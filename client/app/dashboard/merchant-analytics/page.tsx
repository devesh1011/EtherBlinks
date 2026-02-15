"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import {
  RefreshCcw,
  Loader2,
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  UserCheck,
  UserMinus,
  BarChart3,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MerchantOverview {
  totalPolicies: number;
  activePolicies: number;
  cancelledPolicies: number;
  uniquePayers: number;
  totalRevenue: string;
  netRevenue: string;
  totalFees: string;
  totalCharges: number;
  successfulCharges: number;
  failedCharges: number;
  churnRate: string;
  retentionRate: string;
  arpu: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: string;
  charges: number;
}

interface RecentSubscriber {
  payer: string;
  chargeAmount: string;
  interval: number;
  active: boolean;
  createdAt: string;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatInterval(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const days = Math.floor(seconds / 86400);
  if (days === 7) return "Weekly";
  if (days === 14) return "Biweekly";
  if (days === 30) return "Monthly";
  if (days === 90) return "Quarterly";
  if (days === 365) return "Yearly";
  return `${days}d`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor,
  iconBg,
}: {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg ${iconBg} p-2`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-2xl font-bold text-zinc-100">{value}</p>
          {subValue && (
            <p className="text-xs text-zinc-500 mt-0.5">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MerchantAnalyticsPage() {
  const { address, isConnected } = useAccount();
  const [overview, setOverview] = useState<MerchantOverview | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [recentSubscribers, setRecentSubscribers] = useState<
    RecentSubscriber[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/merchant-analytics?merchant=${address}`
      );
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setOverview(data.overview);
      setMonthlyRevenue(data.monthlyRevenue);
      setRecentSubscribers(data.recentSubscribers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) fetchAnalytics();
  }, [fetchAnalytics, isConnected, address]);

  if (!isConnected) {
    return (
      <div className="space-y-6 py-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Merchant Analytics
          </h2>
          <p className="text-zinc-400">
            Revenue tracking, customer retention, and churn analysis.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">
            Connect your merchant wallet to view analytics
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 py-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Merchant Analytics
          </h2>
          <p className="text-zinc-400">Loading analytics...</p>
        </div>
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 py-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Merchant Analytics
          </h2>
        </div>
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">
                Failed to load analytics
              </h3>
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const o = overview;
  const maxRevenue = Math.max(
    ...monthlyRevenue.map((m) => Number(m.revenue)),
    1
  );

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Merchant Analytics
          </h2>
          <p className="text-zinc-400 mt-1">
            Revenue tracking, customer retention, and churn analysis.
          </p>
        </div>
        <Button
          onClick={fetchAnalytics}
          disabled={isLoading}
          variant="shimmer"
          size="sm"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`${formatUnits(BigInt(o?.totalRevenue || "0"), 6)} USDC`}
          subValue={`Net: ${formatUnits(BigInt(o?.netRevenue || "0"), 6)} USDC`}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          icon={Users}
          label="Unique Customers"
          value={String(o?.uniquePayers || 0)}
          subValue={`ARPU: ${formatUnits(BigInt(o?.arpu || "0"), 6)} USDC`}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          icon={Activity}
          label="Total Charges"
          value={String(o?.totalCharges || 0)}
          subValue={`${o?.successfulCharges || 0} succeeded · ${o?.failedCharges || 0} failed`}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="Protocol Fees"
          value={`${formatUnits(BigInt(o?.totalFees || "0"), 6)} USDC`}
          subValue="2.5% per charge"
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Retention & Churn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UserCheck}
          label="Active Subscriptions"
          value={String(o?.activePolicies || 0)}
          subValue={`of ${o?.totalPolicies || 0} total`}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          icon={UserMinus}
          label="Cancelled"
          value={String(o?.cancelledPolicies || 0)}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Retention Rate"
          value={`${o?.retentionRate || "100.0"}%`}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
        />
        <StatCard
          icon={TrendingDown}
          label="Churn Rate"
          value={`${o?.churnRate || "0.0"}%`}
          iconColor="text-orange-500"
          iconBg="bg-orange-500/10"
        />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-100">
            Monthly Revenue
          </h3>
        </div>

        {monthlyRevenue.length > 0 ? (
          <div className="space-y-3">
            {monthlyRevenue.map((m) => {
              const rev = Number(m.revenue);
              const pct = maxRevenue > 0 ? (rev / maxRevenue) * 100 : 0;
              return (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="text-xs text-zinc-400 w-20 shrink-0">
                    {m.month}
                  </span>
                  <div className="flex-1 h-8 bg-zinc-800/50 rounded-md overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600/80 to-cyan-400/60 rounded-md transition-all duration-500"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-300 font-medium">
                      {formatUnits(BigInt(m.revenue), 6)} USDC
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 w-20 text-right">
                    {m.charges} charge{m.charges !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 text-center py-8">
            No revenue data available yet
          </p>
        )}
      </div>

      {/* Recent Subscribers */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-400" />
            <h3 className="text-lg font-semibold text-zinc-100">
              Recent Subscribers
            </h3>
          </div>
        </div>

        {recentSubscribers.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {recentSubscribers.map((sub, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Users className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-zinc-100">
                      {shortenAddress(sub.payer)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(sub.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-zinc-300">
                      {formatUnits(BigInt(sub.chargeAmount), 6)} USDC
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatInterval(sub.interval)}
                    </p>
                  </div>
                  {sub.active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                      <XCircle className="h-3 w-3" /> Cancelled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No subscribers yet</p>
            <p className="text-sm text-zinc-500 mt-1">
              Subscribers will appear here when users create subscriptions to
              your merchant address
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
