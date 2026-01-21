"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  Plus,
  RefreshCcw,
  Loader2,
  AlertCircle,
  Globe,
  DollarSign,
  Activity,
  Zap,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Code,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";

interface Endpoint {
  id: string;
  merchant_address: string;
  path: string;
  method: string;
  price_usdc: number;
  description: string | null;
  network: string;
  token_address: string;
  active: boolean;
  response_body: any;
  created_at: string;
}

interface Payment {
  id: string;
  endpoint_id: string;
  payer_address: string;
  merchant_address: string;
  amount: string;
  tx_hash: string | null;
  status: string;
  chain_id: number;
  created_at: string;
  verified_at: string | null;
  x402_endpoints: {
    path: string;
    method: string;
    price_usdc: number;
    description: string | null;
  } | null;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    settled: {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    verified: {
      icon: Shield,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    pending: {
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  }[status] || {
    icon: Clock,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  };
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${config.color} ${config.bg} px-2 py-1 rounded-full`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-zinc-500 hover:text-zinc-300 transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export default function X402DashboardPage() {
  const { address, isConnected } = useAccount();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"endpoints" | "payments" | "docs">(
    "endpoints"
  );

  // Create form state
  const [newPath, setNewPath] = useState("");
  const [newMethod, setNewMethod] = useState("GET");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newResponseBody, setNewResponseBody] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchEndpoints = useCallback(async () => {
    if (!address) return;
    const res = await fetch(
      `/api/x402/endpoints?merchant=${address}&active=false`
    );
    const data = await res.json();
    setEndpoints(data.endpoints || []);
  }, [address]);

  const fetchPayments = useCallback(async () => {
    if (!address) return;
    const res = await fetch(`/api/x402/payments?merchant=${address}&limit=20`);
    const data = await res.json();
    setPayments(data.payments || []);
  }, [address]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchEndpoints(), fetchPayments()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchEndpoints, fetchPayments]);

  useEffect(() => {
    if (isConnected && address) fetchAll();
  }, [isConnected, address, fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setIsCreating(true);

    try {
      let responseBody = null;
      if (newResponseBody.trim()) {
        try {
          responseBody = JSON.parse(newResponseBody);
        } catch {
          setError("Invalid JSON in response body");
          setIsCreating(false);
          return;
        }
      }

      const res = await fetch("/api/x402/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: address,
          path: newPath.startsWith("/") ? newPath : `/${newPath}`,
          method: newMethod,
          price_usdc: parseFloat(newPrice),
          description: newDescription || undefined,
          response_body: responseBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowCreateForm(false);
      setNewPath("");
      setNewPrice("");
      setNewDescription("");
      setNewResponseBody("");
      await fetchEndpoints();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleEndpoint = async (id: string, active: boolean) => {
    try {
      await fetch("/api/x402/endpoints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      });
      await fetchEndpoints();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteEndpoint = async (id: string) => {
    if (!confirm("Delete this endpoint? This cannot be undone.")) return;
    try {
      await fetch("/api/x402/endpoints", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchEndpoints();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Stats
  const activeEndpoints = endpoints.filter((e) => e.active).length;
  const settledPayments = payments.filter((p) => p.status === "settled");
  const totalRevenue = settledPayments.reduce(
    (sum, p) => sum + Number(p.amount) / 1_000_000,
    0
  );
  const uniquePayers = new Set(settledPayments.map((p) => p.payer_address))
    .size;

  if (!isConnected) {
    return (
      <div className="space-y-6 py-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            x402 Agentic Payments
          </h2>
          <p className="text-zinc-400 mt-1">
            Create pay-per-use API endpoints using the x402 protocol.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <Zap className="h-10 w-10 text-cyan-500 mx-auto mb-4" />
          <p className="text-zinc-300 text-lg font-medium">
            Connect your wallet to get started
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Create paywalled endpoints that AI agents and developers can pay for
            per request.
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
            x402 Agentic Payments
          </h2>
          <p className="text-zinc-400 mt-1">
            Create pay-per-use API endpoints using the x402 protocol.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-100 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Endpoint
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm text-red-300/80">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-1 text-xs text-red-400 hover:text-red-300 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Globe}
          label="Active Endpoints"
          value={String(activeEndpoints)}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
        />
        <StatCard
          icon={Activity}
          label="Total Payments"
          value={String(settledPayments.length)}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={`${totalRevenue.toFixed(2)} USDC`}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        />
        <StatCard
          icon={Zap}
          label="Unique Agents"
          value={String(uniquePayers)}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="rounded-xl border border-cyan-800/50 bg-zinc-900/80 p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Create Paywalled Endpoint
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">
                  Endpoint Path
                </label>
                <div className="flex items-center gap-0">
                  <span className="px-3 py-2 text-sm text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-l-lg border-r-0">
                    /api/x402/pay
                  </span>
                  <input
                    type="text"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder="/weather"
                    required
                    className="flex-1 px-3 py-2 text-sm bg-zinc-800/50 border border-zinc-700 rounded-r-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Method
                </label>
                <select
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Price (USDC per request)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.01"
                  required
                  className="w-full px-3 py-2 text-sm bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="AI-generated weather report"
                  className="w-full px-3 py-2 text-sm bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Response Body (JSON) — returned when payment is verified
              </label>
              <textarea
                value={newResponseBody}
                onChange={(e) => setNewResponseBody(e.target.value)}
                placeholder='{"data": "your premium content here"}'
                rows={3}
                className="w-full px-3 py-2 text-sm bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-100 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Endpoint
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(["endpoints", "payments", "docs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "text-cyan-400 border-cyan-400"
                : "text-zinc-400 border-transparent hover:text-zinc-300"
            }`}
          >
            {tab === "endpoints"
              ? "Endpoints"
              : tab === "payments"
                ? "Payment Log"
                : "Integration Docs"}
          </button>
        ))}
      </div>

      {/* Endpoints Tab */}
      {activeTab === "endpoints" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : endpoints.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
              <Globe className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-lg font-medium">
                No endpoints yet
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                Create your first paywalled API endpoint to start earning.
              </p>
            </div>
          ) : (
            endpoints.map((ep) => (
              <div
                key={ep.id}
                className={`rounded-xl border ${ep.active ? "border-zinc-800" : "border-zinc-800/50 opacity-60"} bg-zinc-900/50 p-5`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-cyan-600/20 text-cyan-400">
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono text-zinc-200 truncate">
                        /api/x402/pay{ep.path}
                      </code>
                      <CopyButton
                        text={`${typeof window !== "undefined" ? window.location.origin : ""}/api/x402/pay${ep.path}`}
                      />
                    </div>
                    {ep.description && (
                      <p className="text-sm text-zinc-400 mb-2">
                        {ep.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> {ep.price_usdc} USDC
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {ep.network}
                      </span>
                      <span>
                        {new Date(ep.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleEndpoint(ep.id, ep.active)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title={ep.active ? "Deactivate" : "Activate"}
                    >
                      {ep.active ? (
                        <ToggleRight className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteEndpoint(ep.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No payments recorded yet</p>
              <p className="text-zinc-500 text-sm mt-1">
                Payments will appear here when agents access your paywalled
                endpoints.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-zinc-400">
                      Time
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-zinc-400">
                      Endpoint
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-zinc-400">
                      Payer
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-zinc-400">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-zinc-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-zinc-400">
                      Tx
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-400">
                        {new Date(p.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-zinc-300">
                          {p.x402_endpoints?.path || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-400">
                        {shortenAddress(p.payer_address)}
                      </td>
                      <td className="px-4 py-3 text-zinc-200">
                        {(Number(p.amount) / 1_000_000).toFixed(2)} USDC
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        {p.tx_hash ? (
                          <a
                            href={`https://shadownet.explorer.etherlink.com/tx/${p.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Docs Tab */}
      {activeTab === "docs" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2 flex items-center gap-2">
              <Code className="h-5 w-5 text-cyan-500" />
              How x402 Works
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The x402 protocol uses the HTTP 402 &quot;Payment Required&quot;
              status code to enable pay-per-request API access. AI agents and
              developers can programmatically pay for your endpoints using USDC.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-300">
              Protocol Flow
            </h4>
            <div className="space-y-3">
              {[
                {
                  step: 1,
                  title: "Request Resource",
                  desc: "Client sends a standard HTTP request to your endpoint.",
                  code: "curl https://etherblinks.com/api/x402/pay/weather",
                },
                {
                  step: 2,
                  title: "402 Payment Required",
                  desc: "Server responds with payment requirements (amount, token, recipient).",
                  code: '{ "x402Version": 2, "accepts": [{ "scheme": "exact", "price": "10000", ... }] }',
                },
                {
                  step: 3,
                  title: "Pay On-Chain",
                  desc: "Client sends USDC to the merchant address and gets a tx hash.",
                  code: "Transfer 0.01 USDC → merchant address",
                },
                {
                  step: 4,
                  title: "Re-request with Payment",
                  desc: "Client re-sends the request with the X-PAYMENT header.",
                  code: 'curl -H "X-PAYMENT: <base64 payload>" https://etherblinks.com/api/x402/pay/weather',
                },
                {
                  step: 5,
                  title: "Verified Response",
                  desc: "Server verifies the on-chain transfer and returns the resource.",
                  code: '{ "data": "your premium content" }',
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center text-sm font-bold">
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">
                      {s.title}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{s.desc}</p>
                    <code className="block mt-1.5 px-3 py-1.5 text-xs font-mono text-cyan-300 bg-zinc-800/80 rounded-md overflow-x-auto">
                      {s.code}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-3">
              Client Code Example (JavaScript)
            </h4>
            <pre className="px-4 py-3 text-xs font-mono text-cyan-300 bg-zinc-800/80 rounded-lg overflow-x-auto leading-relaxed">
              {`// 1. Request the endpoint
const res = await fetch("/api/x402/pay/weather");

if (res.status === 402) {
  const { accepts } = await res.json();
  const req = accepts[0];

  // 2. Send USDC on-chain (using wagmi/viem)
  const txHash = await walletClient.writeContract({
    address: req.asset,
    abi: erc20Abi,
    functionName: "transfer",
    args: [req.payTo, BigInt(req.maxAmountRequired)],
  });

  // 3. Wait for confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  // 4. Re-request with payment proof
  const payload = btoa(JSON.stringify({
    txHash, scheme: "exact",
    network: req.network, payer: myAddress,
  }));

  const paid = await fetch("/api/x402/pay/weather", {
    headers: { "X-PAYMENT": payload },
  });
  const data = await paid.json();
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
}: {
  icon: any;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg ${iconBg} p-2`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-xl font-bold text-zinc-100">{value}</p>
        </div>
      </div>
    </div>
  );
}
