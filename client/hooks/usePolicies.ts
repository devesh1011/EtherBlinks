"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, type Address, type PublicClient } from "viem";
import { POLICY_MANAGER_CONFIG } from "@/lib/contracts";

export interface OnChainPolicy {
  policyId: `0x${string}`;
  payer: `0x${string}`;
  merchant: `0x${string}`;
  chargeAmount: bigint;
  spendingCap: bigint;
  totalSpent: bigint;
  interval: number;
  lastCharged: number;
  chargeCount: number;
  consecutiveFailures: number;
  endTime: number;
  active: boolean;
  metadataUrl: string;
}

interface DbPolicy {
  id: string;
  chain_id: number;
  payer: string;
  merchant: string;
  charge_amount: string;
  spending_cap: string;
  total_spent: string;
  interval_seconds: number;
  last_charged_at: string | null;
  next_charge_at: string;
  charge_count: number;
  active: boolean;
  metadata_url: string | null;
  created_at: string;
  ended_at: string | null;
  created_block: number;
  created_tx: string;
}

interface UsePoliciesReturn {
  policies: OnChainPolicy[];
  isLoading: boolean;
  error: string | null;
  dataSource: "supabase" | "contract" | null;
  refetch: () => Promise<void>;
  refreshPolicyFromContract: (policyId: `0x${string}`) => Promise<void>;
}

// PolicyCreated event signature
const PolicyCreatedEvent = parseAbiItem(
  "event PolicyCreated(bytes32 indexed policyId, address indexed payer, address indexed merchant, uint128 chargeAmount, uint32 interval, uint128 spendingCap, string metadataUrl)"
);

// Block where the contract was deployed — no events exist before this
const CONTRACT_DEPLOY_BLOCK = BigInt(2716400);

// Max blocks per getLogs call (Etherlink RPC limit with indexed filters)
const BATCH_SIZE = BigInt(499);

// Convert database policy to on-chain policy format
function dbPolicyToOnChainPolicy(db: DbPolicy): OnChainPolicy {
  return {
    policyId: db.id as `0x${string}`,
    payer: db.payer as `0x${string}`,
    merchant: db.merchant as `0x${string}`,
    chargeAmount: BigInt(db.charge_amount),
    spendingCap: BigInt(db.spending_cap),
    totalSpent: BigInt(db.total_spent),
    interval: db.interval_seconds,
    lastCharged: db.last_charged_at
      ? Math.floor(new Date(db.last_charged_at).getTime() / 1000)
      : 0,
    chargeCount: db.charge_count,
    consecutiveFailures: 0,
    endTime: db.ended_at
      ? Math.floor(new Date(db.ended_at).getTime() / 1000)
      : 0,
    active: db.active,
    metadataUrl: db.metadata_url || "",
  };
}

// Fetch a single policy's current state from the contract
async function fetchPolicyFromContract(
  publicClient: PublicClient,
  policyManagerAddress: Address,
  policyId: `0x${string}`
): Promise<OnChainPolicy> {
  const policyData = await publicClient.readContract({
    address: policyManagerAddress,
    abi: POLICY_MANAGER_CONFIG.abi,
    functionName: "policies",
    args: [policyId],
  });

  const [
    payer,
    merchant,
    chargeAmount,
    spendingCap,
    totalSpent,
    interval,
    lastCharged,
    chargeCount,
    consecutiveFailures,
    endTime,
    active,
    metadataUrl,
  ] = policyData as [
    Address,
    Address,
    bigint,
    bigint,
    bigint,
    number,
    number,
    number,
    number,
    number,
    boolean,
    string
  ];

  return {
    policyId,
    payer,
    merchant,
    chargeAmount,
    spendingCap,
    totalSpent,
    interval,
    lastCharged,
    chargeCount,
    consecutiveFailures,
    endTime,
    active,
    metadataUrl,
  };
}

/**
 * Scan blockchain logs in batches to work within RPC limits.
 * Etherlink allows max ~500 blocks per getLogs call with indexed filters.
 */
async function scanLogsInBatches(
  publicClient: PublicClient,
  contractAddress: Address,
  payerAddress: Address,
  fromBlock: bigint,
  toBlock: bigint
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLogs: any[] = [];
  let current = fromBlock;

  const totalBlocks = Number(toBlock - fromBlock);
  const totalBatches = Math.ceil(totalBlocks / Number(BATCH_SIZE));
  console.log(
    `📦 [usePolicies] Scanning blocks ${fromBlock} → ${toBlock} (${totalBlocks} blocks in ~${totalBatches} batches)`
  );

  while (current <= toBlock) {
    const batchEnd =
      current + BATCH_SIZE > toBlock ? toBlock : current + BATCH_SIZE;

    try {
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: PolicyCreatedEvent,
        args: { payer: payerAddress },
        fromBlock: current,
        toBlock: batchEnd,
      });

      if (logs.length > 0) {
        allLogs.push(...logs);
        console.log(
          `  ✅ Blocks ${current}-${batchEnd}: found ${logs.length} events`
        );
      }
    } catch (err) {
      console.warn(
        `  ⚠️ Batch ${current}-${batchEnd} failed, skipping:`,
        err
      );
    }

    current = batchEnd + BigInt(1);
  }

  return allLogs;
}

// Module-level pub-sub for cross-instance updates
type PolicyListener = (updated: OnChainPolicy) => void;
const policyListeners = new Set<PolicyListener>();

function notifyPolicyUpdate(policy: OnChainPolicy) {
  for (const listener of policyListeners) {
    listener(policy);
  }
}

/**
 * Hook to fetch policies with smart fallback strategy:
 * 1. Try Supabase (indexed data) - Full history, fast queries
 * 2. Fallback to batched contract event scanning (if Supabase fails/empty)
 * 3. Real-time updates via refreshPolicyFromContract
 */
export function usePolicies(): UsePoliciesReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [policies, setPolicies] = useState<OnChainPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<
    "supabase" | "contract" | null
  >(null);

  // Subscribe to cross-instance policy updates
  useEffect(() => {
    const handler: PolicyListener = (updated) => {
      setPolicies((prev) => {
        const exists = prev.some((p) => p.policyId === updated.policyId);
        if (exists) {
          return prev.map((p) =>
            p.policyId === updated.policyId ? updated : p
          );
        }
        return [updated, ...prev];
      });
    };
    policyListeners.add(handler);
    return () => {
      policyListeners.delete(handler);
    };
  }, []);

  const fetchPolicies = useCallback(async () => {
    if (!address) {
      setPolicies([]);
      setDataSource(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 [usePolicies] Fetching policies for:", address);

      // ── Step 1: Try Supabase first (full indexed history) ──
      try {
        const response = await fetch(`/api/policies?payer=${address}`);
        console.log(
          "📡 [usePolicies] Supabase API response status:",
          response.status
        );

        if (response.ok) {
          const data: DbPolicy[] = await response.json();
          console.log("📊 [usePolicies] Supabase returned policies:", data);

          if (data && Array.isArray(data) && data.length > 0) {
            const converted = data.map(dbPolicyToOnChainPolicy);
            converted.sort((a, b) => b.lastCharged - a.lastCharged);
            setPolicies(converted);
            setDataSource("supabase");
            console.log(
              "✅ [usePolicies] Successfully fetched from Supabase:",
              converted.length
            );
            return;
          }

          console.warn(
            "⚠️ [usePolicies] Supabase returned empty, falling back to contract"
          );
        } else {
          console.warn(
            "⚠️ [usePolicies] Supabase request failed, falling back to contract"
          );
        }
      } catch (supabaseErr) {
        console.warn(
          "⚠️ [usePolicies] Supabase fetch error, falling back to contract:",
          supabaseErr
        );
      }

      // ── Step 2: Fallback to batched contract event scanning ──
      if (!publicClient || !POLICY_MANAGER_CONFIG.address) {
        console.error("❌ [usePolicies] No publicClient or contract address");
        setPolicies([]);
        setDataSource(null);
        return;
      }

      console.log("🔗 [usePolicies] Fetching from blockchain (batched)...");
      const currentBlock = await publicClient.getBlockNumber();

      const logs = await scanLogsInBatches(
        publicClient,
        POLICY_MANAGER_CONFIG.address,
        address,
        CONTRACT_DEPLOY_BLOCK,
        currentBlock
      );

      console.log(
        "📝 [usePolicies] Total PolicyCreated events found:",
        logs.length
      );

      if (logs.length === 0) {
        setPolicies([]);
        setDataSource("contract");
        return;
      }

      // Fetch current on-chain state for each discovered policy
      const policyPromises = logs.map(async (log) => {
        const policyId = log.args.policyId as `0x${string}`;
        console.log("🔄 [usePolicies] Fetching policy state:", policyId);
        return fetchPolicyFromContract(
          publicClient,
          POLICY_MANAGER_CONFIG.address,
          policyId
        );
      });

      const fetchedPolicies = await Promise.all(policyPromises);
      fetchedPolicies.sort((a, b) => b.lastCharged - a.lastCharged);

      console.log(
        "✅ [usePolicies] Successfully fetched from contract:",
        fetchedPolicies.length
      );
      setPolicies(fetchedPolicies);
      setDataSource("contract");
    } catch (err) {
      console.error("❌ [usePolicies] Failed to fetch policies:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch policies"
      );
      setPolicies([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  // Refresh a single policy from contract (real-time update after write)
  const refreshPolicyFromContract = useCallback(
    async (policyId: `0x${string}`) => {
      if (!publicClient || !POLICY_MANAGER_CONFIG.address) {
        console.warn("⚠️ [refreshPolicy] No publicClient or contract address");
        return;
      }

      try {
        console.log(
          "🔄 [refreshPolicy] Refreshing policy from contract:",
          policyId
        );
        const policy = await fetchPolicyFromContract(
          publicClient,
          POLICY_MANAGER_CONFIG.address,
          policyId
        );

        console.log("✅ [refreshPolicy] Fetched updated policy:", policy);

        // Broadcast to all usePolicies() instances
        notifyPolicyUpdate(policy);
      } catch (err) {
        console.error("❌ [refreshPolicy] Failed to refresh policy:", err);
      }
    },
    [publicClient]
  );

  // Fetch policies on mount and when dependencies change
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return {
    policies,
    isLoading,
    error,
    dataSource,
    refetch: fetchPolicies,
    refreshPolicyFromContract,
  };
}
