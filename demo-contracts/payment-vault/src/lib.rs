#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Bytes, BytesN, Env, IntoVal, Map, Symbol, TryFromVal, Val};

pub mod types {
    use soroban_sdk::Address;
    pub type PaymentId = [u8; 32];
    #[derive(Clone)]
    pub enum Status {
        Pending,
        Released,
        Refunded,
        Cancelled,
    }
}

use types::Status;

static KEY_NEXT_ID: Symbol = symbol_short!("NEXT_ID");
static KEY_PAYMENT_PREFIX: Symbol = symbol_short!("PAY_");

#[derive(Clone)]
struct Payment {
    payer: Address,
    payee: Address,
    amount: i128,
    status: Status,
}

impl Payment {
    fn to_map(&self, e: &Env) -> Map<Symbol, Val> {
        let mut m = Map::new(e);
        m.set(symbol_short!("payer"), self.payer.clone().into_val(e));
        m.set(symbol_short!("payee"), self.payee.clone().into_val(e));
        m.set(symbol_short!("amount"), self.amount.into_val(e));
        m.set(
            symbol_short!("status"),
            match self.status {
                Status::Pending => 0i32,
                Status::Released => 1i32,
                Status::Refunded => 2i32,
                Status::Cancelled => 3i32,
            }
            .into_val(e),
        );
        m
    }

    fn from_map(e: &Env, m: Map<Symbol, Val>) -> Self {
        let payer_val = m.get_unchecked(symbol_short!("payer"));
        let payee_val = m.get_unchecked(symbol_short!("payee"));
        let amount_val = m.get_unchecked(symbol_short!("amount"));
        let status_val = m.get_unchecked(symbol_short!("status"));
        let payer: Address = Address::try_from_val(e, &payer_val).unwrap();
        let payee: Address = Address::try_from_val(e, &payee_val).unwrap();
        let amount: i128 = i128::try_from_val(e, &amount_val).unwrap();
        let status_code: i32 = i32::try_from_val(e, &status_val).unwrap();
        let status = match status_code {
            1 => Status::Released,
            2 => Status::Refunded,
            3 => Status::Cancelled,
            _ => Status::Pending,
        };
        Payment { payer, payee, amount, status }
    }
}

#[contract]
pub struct PaymentVault;

#[contractimpl]
impl PaymentVault {
    pub fn initialize(e: Env, owner: Address) {
        e.storage().instance().set(&KEY_NEXT_ID, &0u64);
        e.storage().instance().set(&symbol_short!("OWNER"), &owner);
    }

    pub fn deposit(e: Env, payer: Address, payee: Address, amount: i128) -> BytesN<32> {
        let mut next: u64 = e.storage().instance().get(&KEY_NEXT_ID).unwrap_or(0u64);
        next += 1;
        e.storage().instance().set(&KEY_NEXT_ID, &next);

        let mut seed = [0u8; 32];
        seed[0..8].copy_from_slice(&next.to_be_bytes());
        let id = e.crypto().sha256(&Bytes::from_array(&e, &seed)).to_bytes();

        let payment = Payment { payer: payer.clone(), payee: payee.clone(), amount, status: Status::Pending };
        let key = Self::payment_key(&e, &id);
        e.storage().persistent().set(&key, &payment.to_map(&e));
        id
    }

    pub fn release(e: Env, caller: Address, payment_id: BytesN<32>) {
        let owner: Address = e.storage().instance().get(&symbol_short!("OWNER")).expect("owner not set");
        if caller != owner {
            return;
        }
        let key = Self::payment_key(&e, &payment_id);
        let m: Map<Symbol, Val> = e.storage().persistent().get(&key).expect("payment not found");
        let mut p = Payment::from_map(&e, m.clone());
        if let Status::Pending = p.status {
            p.status = Status::Released;
            e.storage().persistent().set(&key, &p.to_map(&e));
        }
    }

    pub fn refund(e: Env, caller: Address, payment_id: BytesN<32>) {
        let key = Self::payment_key(&e, &payment_id);
        let m: Map<Symbol, Val> = e.storage().persistent().get(&key).expect("payment not found");
        let mut p = Payment::from_map(&e, m.clone());
        if caller != p.payee && caller != p.payer {
            return;
        }
        if let Status::Pending = p.status {
            p.status = Status::Refunded;
            e.storage().persistent().set(&key, &p.to_map(&e));
        }
    }

    pub fn cancel(e: Env, caller: Address, payment_id: BytesN<32>) {
        let owner: Address = e.storage().instance().get(&symbol_short!("OWNER")).expect("owner not set");
        if caller != owner {
            return;
        }
        let key = Self::payment_key(&e, &payment_id);
        let m: Map<Symbol, Val> = e.storage().persistent().get(&key).expect("payment not found");
        let mut p = Payment::from_map(&e, m.clone());
        if let Status::Pending = p.status {
            p.status = Status::Cancelled;
            e.storage().persistent().set(&key, &p.to_map(&e));
        }
    }

    pub fn get_status(e: Env, payment_id: BytesN<32>) -> i32 {
        let key = Self::payment_key(&e, &payment_id);
        if let Some(m) = e.storage().persistent().get::<_, Map<Symbol, Val>>(&key) {
            let status_val = m.get_unchecked(symbol_short!("status"));
            let status_code: i32 = i32::try_from_val(&e, &status_val).unwrap();
            status_code
        } else {
            -1
        }
    }

    fn payment_key(_e: &Env, id: &BytesN<32>) -> BytesN<32> {
        id.clone()
    }
}

mod tests {
    // no-std contracts typically don't run Rust unit tests in this environment,
    // keep this module empty to avoid unused warnings.
}
