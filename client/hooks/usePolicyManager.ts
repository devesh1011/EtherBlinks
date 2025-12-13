"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { POLICY_MANAGER_CONFIG } from "@/lib/contracts";
import { useState, useEffect } from "react";

export interface Policy {
  id: string;
  merchant: string;
  chargeAmount: bigint;
  interval: number;
  spendingCap: bigint;
  totalSpent: bigint;
  nextChargeAt: bigint;
  active: boolean;
  metadataUrl: string;
}

/**
 * Hook to fetch a user's policy by policyId
 */
export function usePolicy(policyId: `0x${string}` | undefined) {
  return useReadContract({
    ...POLICY_MANAGER_CONFIG,
    functionName: "policies",
    args: policyId ? [policyId] : undefined,
    query: {
      enabled: !!policyId,
    },
  });
}

/**
 * Hook to revoke a policy
 */
export function useRevokePolicy() {
  const {
    writeContract,
    data: hash,
    isPending,
    isSuccess,
  } = useWriteContract();

  const revokePolicy = (policyId: `0x${string}`) => {
    writeContract({
      ...POLICY_MANAGER_CONFIG,
      functionName: "revokePolicy",
      args: [policyId],
    });
  };

  return {
    revokePolicy,
    hash,
    isPending,
    isSuccess,
  };
}

/**
 * Hook to create a new policy
 */
export function useCreatePolicy() {
  const {
    writeContract,
    data: hash,
    isPending,
    isSuccess,
    error,
  } = useWriteContract();

  const createPolicy = (params: {
    merchant: `0x${string}`;
    chargeAmount: bigint;
    interval: number;
    spendingCap: bigint;
    metadataUrl: string;
  }) => {
    console.log("🟡 useCreatePolicy: Calling writeContract with:", {
      ...POLICY_MANAGER_CONFIG,
      functionName: "createPolicy",
      args: [
        params.merchant,
        params.chargeAmount,
        params.interval,
        params.spendingCap,
        params.metadataUrl,
      ],
    });

    try {
      writeContract({
        ...POLICY_MANAGER_CONFIG,
        functionName: "createPolicy",
        args: [
          params.merchant,
          params.chargeAmount,
          params.interval,
          params.spendingCap,
          params.metadataUrl,
        ],
      });
      console.log("🟡 useCreatePolicy: writeContract called successfully");
    } catch (err) {
      console.error("🔴 useCreatePolicy: Error calling writeContract:", err);
    }
  };

  // Log error state changes
  useEffect(() => {
    if (error) {
      console.error("🔴 useCreatePolicy: Contract write error:", error);
    }
  }, [error]);

  return {
    createPolicy,
    hash,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * Hook to get all user policies
 * Note: This requires indexing events. For now, we'll use the relayer's database.
 */
export function useUserPolicies() {
  const { address } = useAccount();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setPolicies([]);
      setIsLoading(false);
      return;
    }

    const fetchPolicies = async () => {
      try {
        setIsLoading(true);
        console.log("🔍 Fetching policies for:", address);
        const response = await fetch(`/api/policies?payer=${address}`);
        console.log("📡 API Response status:", response.status);
        const data = await response.json();
        console.log("📊 Policies data:", data);
        setPolicies(data);
      } catch (error) {
        console.error("Error fetching policies:", error);
        setPolicies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, [address]);

  return { policies, isLoading };
}
