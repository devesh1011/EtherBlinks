"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import {
  History,
  Search,
  Filter,
  RefreshCcw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
} from "lucide-react";
import { etherlinkShadownet } from "@/lib/wagmi";

interface ChargeRecord {
  id: number;
  policy_id: string;
  chain_id: number;
  tx_hash: string | null;
  status: string;
  amount: string;
  protocol_fee: string | null;
  error_message: string | null;
  attempt_count: number;
  created_at: string;
  completed_at: string | null;
  policies: {
    payer: string;
    merchant: string;
    metadata_url: string | null;
    interval_seconds: number;
  };
}

type StatusFilter = "all" | "success" | "failed" | "pending";
type SortField = "date" | "amount" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "success":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" /> Success
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
          <XCircle className="h-3 w-3" /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
          <Clock className="h-3 w-3" /> Pending
        </span>
      );
  }
}

export default function PaymentHistoryPage() {
  const { address, isConnected } = useAccount();
  const [charges, setCharges] = useState<ChargeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  // Sort
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchCharges = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ payer: address });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo)
        params.set(
          "to",
          new Date(dateTo + "T23:59:59").toISOString()
        );
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));

      const res = await fetch(`/api/charges?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCharges(data.charges);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address, statusFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    if (isConnected && address) fetchCharges();
  }, [fetchCharges, isConnected, address]);

  // Client-side search filtering (on top of server-filtered results)
  const filtered = useMemo(() => {
    if (!searchQuery) return charges;
    const q = searchQuery.toLowerCase();
    return charges.filter(
      (c) =>
        c.tx_hash?.toLowerCase().includes(q) ||
        c.policy_id.toLowerCase().includes(q) ||
        c.policies?.merchant?.toLowerCase().includes(q)
    );
  }, [charges, searchQuery]);

  // Client-side sorting
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
        case "amount":
          cmp = Number(BigInt(a.amount) - BigInt(b.amount));
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = [
      "Date",
      "Merchant",
      "Amount (USDC)",
      "Fee (USDC)",
      "Status",
      "Tx Hash",
      "Policy ID",
    ];
    const rows = sorted.map((c) => [
      new Date(c.created_at).toISOString(),
      c.policies?.merchant || "",
      formatUnits(BigInt(c.amount), 6),
      c.protocol_fee ? formatUnits(BigInt(c.protocol_fee), 6) : "0",
      c.status,
      c.tx_hash || "",
      c.policy_id,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary from current page data
  const successCount = charges.filter((c) => c.status === "success").length;
  const failedCount = charges.filter((c) => c.status === "failed").length;
  const totalVolume = charges
    .filter((c) => c.status === "success")
    .reduce((s, c) => s + BigInt(c.amount), BigInt(0));

  if (!isConnected) {
    return (
      <div className="space-y-6 py-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Payment History
          </h2>
          <p className="text-zinc-400">
            View your complete transaction log.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">
            Connect your wallet to view payment history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Payment History
          </h2>
          <p className="text-zinc-400 mt-1">
            View your complete transaction log across all subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={sorted.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={fetchCharges}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <History className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Transactions</p>
              <p className="text-2xl font-bold text-zinc-100">{total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Success Rate</p>
              <p className="text-2xl font-bold text-zinc-100">
                {charges.length > 0
                  ? `${((successCount / charges.length) * 100).toFixed(0)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <ArrowUpDown className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Volume</p>
              <p className="text-2xl font-bold text-zinc-100">
                {formatUnits(totalVolume, 6)} USDC
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by tx hash, policy, or merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          {(["all", "success", "failed", "pending"] as StatusFilter[]).map(
            (s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(0);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <span className="text-zinc-500 text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">
                Failed to load history
              </h3>
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <History className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No transactions found</p>
            <p className="text-sm text-zinc-500 mt-1">
              {charges.length === 0
                ? "Transactions will appear here once charges are executed"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400 font-medium border-b border-zinc-800">
                <tr>
                  <th
                    className="px-6 py-4 cursor-pointer select-none hover:text-zinc-200"
                    onClick={() => toggleSort("date")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Date
                      {sortField === "date" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                  <th className="px-6 py-4">Merchant</th>
                  <th
                    className="px-6 py-4 cursor-pointer select-none hover:text-zinc-200"
                    onClick={() => toggleSort("amount")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Amount
                      {sortField === "amount" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                  <th className="px-6 py-4">Fee</th>
                  <th
                    className="px-6 py-4 cursor-pointer select-none hover:text-zinc-200"
                    onClick={() => toggleSort("status")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Status
                      {sortField === "status" && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                  <th className="px-6 py-4">Policy</th>
                  <th className="px-6 py-4 text-right">Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sorted.map((charge) => (
                  <tr
                    key={charge.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-zinc-300 whitespace-nowrap">
                      {formatDateTime(charge.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-zinc-100 font-mono text-xs">
                        {shortenAddress(charge.policies?.merchant || "")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 whitespace-nowrap">
                      {formatUnits(BigInt(charge.amount), 6)} USDC
                    </td>
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                      {charge.protocol_fee
                        ? `${formatUnits(BigInt(charge.protocol_fee), 6)}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={charge.status} />
                      {charge.error_message && (
                        <p className="text-xs text-red-400/70 mt-1 max-w-[150px] truncate">
                          {charge.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-zinc-500">
                        {shortenAddress(charge.policy_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {charge.tx_hash ? (
                        <a
                          href={`${etherlinkShadownet.blockExplorers?.default?.url || "https://shadownet.explorer.etherlink.com"}/tx/${charge.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          {shortenAddress(charge.tx_hash)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-zinc-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
