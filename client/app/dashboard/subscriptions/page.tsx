"use client";

import {
  RefreshCcw,
  Trash2,
  ExternalLink,
  Loader2,
  Database,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  Activity,
  Clock,
} from "lucide-react";
import { useAccount } from "wagmi";
import { usePolicies } from "@/hooks/usePolicies";
import { useRevokePolicy } from "@/hooks/usePolicyManager";
import { formatUnits } from "viem";
import { useState } from "react";
import { etherlinkShadownet } from "@/lib/wagmi";

function formatInterval(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days === 7) return "Weekly";
  if (days === 14) return "Biweekly";
  if (days === 30) return "Monthly";
  if (days === 90) return "Quarterly";
  if (days === 365) return "Yearly";
  return `Every ${days} days`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function SubscriptionsPage() {
  const { address, isConnected } = useAccount();
  const {
    policies,
    isLoading,
    error,
    dataSource,
    refetch,
    refreshPolicyFromContract,
  } = usePolicies();
  const { revokePolicy, isPending: isRevoking } = useRevokePolicy();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Debug logging
  console.log("🔍 Subscriptions Page State:", {
    address,
    isConnected,
    policiesCount: policies.length,
    isLoading,
    dataSource,
    error,
  });

  const handleRevoke = async (policyId: `0x${string}`) => {
    if (confirm("Are you sure you want to cancel this subscription?")) {
      setRevokingId(policyId);
      try {
        await revokePolicy(policyId);
        // Refresh policy state from contract immediately
        await refreshPolicyFromContract(policyId);
      } catch (err) {
        console.error("Failed to revoke policy:", err);
      } finally {
        setRevokingId(null);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
              Subscriptions
            </h2>
            <p className="text-zinc-400">
              Manage your recurring payments across all merchants.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">
            Connect your wallet to view your subscriptions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Subscriptions
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-zinc-400">
              Manage your recurring payments across all merchants.
            </p>
            {dataSource && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">
                {dataSource === "supabase" ? (
                  <>
                    <Database className="h-3 w-3" /> Indexed
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-3 w-3" /> From Chain
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Subscriptions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Active</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {policies.filter((p) => p.active).length}
                </p>
              </div>
            </div>
          </div>

          {/* Paused Subscriptions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <PauseCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Paused</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {policies.filter((p) => !p.active).length}
                </p>
              </div>
            </div>
          </div>

          {/* Total Executions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Executions</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {policies.reduce((sum, p) => sum + p.chargeCount, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Next Due */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Next Due</p>
                <p className="text-lg font-bold text-zinc-100">
                  {(() => {
                    const activePolicies = policies.filter(
                      (p) => p.active && p.lastCharged > 0
                    );
                    if (activePolicies.length === 0) return "None";
                    const nextCharges = activePolicies.map(
                      (p) => p.lastCharged + p.interval
                    );
                    const earliest = Math.min(...nextCharges);
                    const now = Math.floor(Date.now() / 1000);
                    const diffDays = Math.ceil((earliest - now) / 86400);
                    if (diffDays < 0) return "Overdue";
                    if (diffDays === 0) return "Today";
                    if (diffDays === 1) return "Tomorrow";
                    return `${diffDays}d`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">
                Failed to load subscriptions
              </h3>
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
              <button
                onClick={refetch}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : policies.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-zinc-400">No active subscriptions found</p>
              <p className="text-sm text-zinc-500 mt-2">
                Subscribe to a service to see it here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-800/50 text-zinc-400 font-medium border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Policy ID</th>
                    <th className="px-6 py-4">Merchant</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Interval</th>
                    <th className="px-6 py-4">Next Charge</th>
                    <th className="px-6 py-4">Spent / Cap</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {policies.map((policy) => {
                    const nextCharge = policy.lastCharged + policy.interval;
                    return (
                      <tr
                        key={policy.policyId}
                        className="hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-zinc-500">
                            {shortenAddress(policy.policyId)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-zinc-100">
                              {shortenAddress(policy.merchant)}
                            </span>
                            {policy.metadataUrl && (
                              <a
                                href={policy.metadataUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                View metadata ↗
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {formatUnits(policy.chargeAmount, 6)} USDC
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {formatInterval(policy.interval)}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {policy.lastCharged > 0
                            ? formatDate(nextCharge)
                            : "Not charged yet"}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          <div className="flex flex-col">
                            <span>
                              {formatUnits(policy.totalSpent, 6)} /{" "}
                              {formatUnits(policy.spendingCap, 6)} USDC
                            </span>
                            <div className="w-full bg-zinc-800 rounded-full h-1 mt-1">
                              <div
                                className="bg-emerald-500 h-1 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (Number(policy.totalSpent) /
                                      Number(policy.spendingCap)) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <a
                              href={`${etherlinkShadownet.blockExplorers?.default?.url || "https://shadownet.explorer.etherlink.com"}/address/${policy.merchant}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded-md transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleRevoke(policy.policyId)}
                              disabled={
                                isRevoking && revokingId === policy.policyId
                              }
                              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                            >
                              {isRevoking && revokingId === policy.policyId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCcw className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-400">
                Non-Custodial
              </h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Your funds stay in your wallet until each charge is executed
              according to your policy limits. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
