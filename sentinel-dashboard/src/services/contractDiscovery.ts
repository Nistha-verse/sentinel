import { StrKey, xdr } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";

import type { DiscoveredContract } from "@/lib/discovered-contract-types";
import {
  getNetworkEndpoints,
  type SentinelNetwork,
} from "@/lib/network-config";

const CONTRACT_ID_PATTERN = /^C[A-Z2-7]{55}$/;
const MAX_PAGES = 5;
const PAGE_LIMIT = 100;

interface HorizonOperation {
  type: string;
  function?: string;
  address?: string;
  parameters?: Array<{ type: string; value: string }>;
  created_at: string;
}

interface HorizonOperationsResponse {
  _embedded?: {
    records: HorizonOperation[];
  };
  _links?: {
    next?: { href: string };
  };
}

interface ContractAccumulator {
  contractId: string;
  lastActivity: string;
  deployedByWallet: boolean;
}

function decodeAddressParameter(base64Xdr: string): string | null {
  try {
    const scVal = xdr.ScVal.fromXDR(base64Xdr, "base64");
    const address = scVal.address();

    if (address.switch() !== xdr.ScAddressType.scAddressTypeContract()) {
      return null;
    }

    const encoded = StrKey.encodeContract(
      Buffer.from(address.contractId() as unknown as Uint8Array)
    );
    return CONTRACT_ID_PATTERN.test(encoded) ? encoded : null;
  } catch {
    return null;
  }
}

function extractContractFromOperation(
  operation: HorizonOperation
): { contractId: string; deployedByWallet: boolean } | null {
  if (operation.type !== "invoke_host_function") return null;

  if (
    operation.function === "HostFunctionTypeHostFunctionTypeCreateContract" &&
    operation.address &&
    CONTRACT_ID_PATTERN.test(operation.address)
  ) {
    return { contractId: operation.address, deployedByWallet: true };
  }

  if (
    operation.function === "HostFunctionTypeHostFunctionTypeInvokeContract" &&
    operation.parameters
  ) {
    const addressParam = operation.parameters.find((p) => p.type === "Address");
    if (!addressParam) return null;

    const contractId = decodeAddressParameter(addressParam.value);
    if (!contractId) return null;

    return { contractId, deployedByWallet: false };
  }

  return null;
}

function truncateContractId(contractId: string): string {
  return `${contractId.slice(0, 6)}…${contractId.slice(-6)}`;
}

function upsertContract(
  map: Map<string, ContractAccumulator>,
  contractId: string,
  createdAt: string,
  deployedByWallet: boolean
): void {
  const existing = map.get(contractId);

  if (!existing) {
    map.set(contractId, {
      contractId,
      lastActivity: createdAt,
      deployedByWallet,
    });
    return;
  }

  if (new Date(createdAt) > new Date(existing.lastActivity)) {
    existing.lastActivity = createdAt;
  }

  if (deployedByWallet) {
    existing.deployedByWallet = true;
  }
}

async function fetchOperationsPage(
  url: string
): Promise<HorizonOperationsResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Horizon request failed (${response.status}): unable to load wallet operations`
    );
  }

  return response.json() as Promise<HorizonOperationsResponse>;
}

export async function discoverWalletContracts(
  address: string,
  network: SentinelNetwork,
  onProgress?: (percent: number) => void
): Promise<DiscoveredContract[]> {
  const endpoints = getNetworkEndpoints(network);
  if (!endpoints) {
    throw new Error(`Unsupported network: ${network}`);
  }

  const contractMap = new Map<string, ContractAccumulator>();
  let url: string | null =
    `${endpoints.horizon}/accounts/${address}/operations?limit=${PAGE_LIMIT}&order=desc`;
  let page = 0;

  onProgress?.(5);

  while (url && page < MAX_PAGES) {
    const data = await fetchOperationsPage(url);
    const records = data._embedded?.records ?? [];

    for (const operation of records) {
      const extracted = extractContractFromOperation(operation);
      if (!extracted) continue;

      upsertContract(
        contractMap,
        extracted.contractId,
        operation.created_at,
        extracted.deployedByWallet
      );
    }

    page++;
    onProgress?.(Math.min(90, 5 + (page / MAX_PAGES) * 85));

    url = data._links?.next?.href ?? null;
  }

  onProgress?.(100);

  const contracts = Array.from(contractMap.values())
    .sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    )
    .map<DiscoveredContract>((entry) => ({
      contractId: entry.contractId,
      displayName: truncateContractId(entry.contractId),
      network,
      networkLabel: endpoints.label,
      lastActivity: entry.lastActivity,
      deployedByWallet: entry.deployedByWallet,
    }));

  return contracts;
}

export { truncateContractId, CONTRACT_ID_PATTERN };
