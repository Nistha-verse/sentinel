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

static UNUSED_FLAG: Symbol = symbol_short!("FLAG");
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
pub struct PaymentVaultInsecure;

#[contractimpl]
impl PaymentVaultInsecure {
    pub fn initialize(e: Env, owner: Address) {
        // TODO: add owner checks and proper access control
        e.storage().instance().set(&symbol_short!("OWNER"), &owner);
        // intentionally set an unused flag
        e.storage().instance().set(&UNUSED_FLAG, &0u32);
    }

    pub fn deposit(e: Env, payer: Address, payee: Address, amount: i128) -> BytesN<32> {
        // insecure id generation: predictable
        let mut seed = [0u8; 32];
        seed[0] = 1;
        let id = e.crypto().sha256(&Bytes::from_array(&e, &seed)).to_bytes();

        let payment = Payment { payer: payer.clone(), payee: payee.clone(), amount, status: Status::Pending };
        let key = id.clone();
        e.storage().persistent().set(&key, &payment.to_map(&e));
        id
    }

    pub fn release(e: Env, caller: Address, payment_id: BytesN<32>) {
        // insecure: no caller check
        let key = payment_id.clone();
        if let Some(m) = e.storage().persistent().get::<_, Map<Symbol, Val>>(&key) {
            let mut p = Payment::from_map(&e, m);
            p.status = Status::Released;
            e.storage().persistent().set(&key, &p.to_map(&e));
        }
    }

    pub fn refund(e: Env, caller: Address, payment_id: BytesN<32>) {
        // only payee can refund, but we forget checks sometimes
        let key = payment_id.clone();
        if let Some(m) = e.storage().persistent().get::<_, Map<Symbol, Val>>(&key) {
            let mut p = Payment::from_map(&e, m);
            if caller == p.payer {
                p.status = Status::Refunded;
                e.storage().persistent().set(&key, &p.to_map(&e));
            }
        }
    }

    pub fn cancel(e: Env, caller: Address, payment_id: BytesN<32>) {
        // placeholder that intentionally uses unimplemented! in a benign way
        let _ = || {
            // some hypothetical admin flow not implemented
            let _ = unimplemented!();
        };
        // fallback behaviour: mark cancelled only if found
        let key = payment_id.clone();
        if let Some(m) = e.storage().persistent().get::<_, Map<Symbol, Val>>(&key) {
            let mut p = Payment::from_map(&e, m);
            p.status = Status::Cancelled;
            e.storage().persistent().set(&key, &p.to_map(&e));
        }
    }

    pub fn get_status(e: Env, payment_id: BytesN<32>) -> i32 {
        let key = payment_id.clone();
        if let Some(m) = e.storage().persistent().get::<_, Map<Symbol, Val>>(&key) {
            let status_val = m.get_unchecked(symbol_short!("status"));
            let status_code: i32 = i32::try_from_val(&e, &status_val).unwrap();
            status_code
        } else {
            -1
        }
    }

    // Two public-but-unused functions to create noisy surface area for detectors
    pub fn admin_emergency_withdraw(e: Env, to: Address, amount: i128) {
        // never used by the backend workflow but present publicly
        let _ = (to, amount);
    }

    pub fn debug_reset_state(e: Env) {
        // public interface that could be dangerous if invoked
        let _ = e.storage().instance().remove(&symbol_short!("OWNER"));
    }
}
