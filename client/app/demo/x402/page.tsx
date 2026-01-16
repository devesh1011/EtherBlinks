"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi, type Hash } from "viem";
import {
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  DollarSign,
  Code,
} from "lucide-react";

const USDC_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
]);

interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  payTo: `0x${string}`;
  asset: `0x${string}`;
  maxTimeoutSeconds: number;
}

interface PaymentResponse {
  x402Version: number;
  accepts: PaymentRequirement[];
}

type Step =
  | "idle"
  | "fetching"
  | "payment-required"
  | "sending-payment"
  | "waiting-confirmation"
  | "verifying"
  | "success"
  | "error";

export default function X402DemoPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [endpoint, setEndpoint] = useState("/hello");
  const [step, setStep] = useState<Step>("idle");
  const [paymentReq, setPaymentReq] = useState<PaymentRequirement | null>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const { data: receipt, isLoading: isWaitingReceipt } =
    useWaitForTransactionReceipt({
      hash: txHash as Hash | undefined,
    });

  const handlePayAndAccess = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setError("");
      setStep("fetching");

      // Step 1: Fetch the endpoint (expect 402)
      const res = await fetch(`/api/x402/pay${endpoint}`);
      if (res.status !== 402) {
        throw new Error(`Expected 402, got ${res.status}`);
      }

      const data: PaymentResponse = await res.json();
      const requirement = data.accepts[0];
      setPaymentReq(requirement);
      setStep("payment-required");

      // Step 2: Send USDC transfer on-chain
      setStep("sending-payment");
      const hash = await writeContractAsync({
        address: requirement.asset,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [requirement.payTo, BigInt(requirement.maxAmountRequired)],
      });

      setTxHash(hash);
      setStep("waiting-confirmation");

      // Wait for confirmation (wagmi hook will handle this)
      // We'll proceed after the receipt is available
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed");
      setStep("error");
    }
  };

  // When receipt is available, verify payment
  const verifyPayment = async () => {
    if (!receipt || !paymentReq || !address) return;

    try {
      setStep("verifying");

      // Build payment payload
      const payload = {
        txHash,
        scheme: "exact",
        network: paymentReq.network,
        payer: address,
      };

      const encoded = btoa(JSON.stringify(payload));

      // Re-request with payment header
      const res = await fetch(`/api/x402/pay${endpoint}`, {
        headers: {
          "X-PAYMENT": encoded,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setStep("success");
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Payment verification failed");
      setStep("error");
    }
  };

  // Auto-verify when receipt is ready
  if (receipt && step === "waiting-confirmation") {
    verifyPayment();
  }

  const reset = () => {
    setStep("idle");
    setPaymentReq(null);
    setTxHash("");
    setResponse(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-600/20 mb-4">
            <Zap className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-100 mb-2">
            x402 Payment Demo
          </h1>
          <p className="text-zinc-400">
            Test the x402 protocol: Pay with USDC, access paywalled content
          </p>
        </div>

        {/* Endpoint Input */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Paywalled Endpoint
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-0">
              <span className="px-4 py-2.5 text-sm text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-l-lg border-r-0">
                /api/x402/pay
              </span>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                disabled={step !== "idle"}
                className="flex-1 px-4 py-2.5 text-sm bg-zinc-800/50 border border-zinc-700 rounded-r-lg text-zinc-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              onClick={handlePayAndAccess}
              disabled={!isConnected || step !== "idle"}
              className="px-6 py-2.5 text-sm font-medium text-zinc-100 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {step !== "idle" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Pay & Access
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          {/* Step 1: Fetching */}
          <StepCard
            title="1. Request Endpoint"
            status={
              step === "fetching"
                ? "loading"
                : ["payment-required", "sending-payment", "waiting-confirmation", "verifying", "success"].includes(step)
                  ? "complete"
                  : "idle"
            }
            error={step === "error" && error.includes("402") ? error : ""}
          >
            <p className="text-sm text-zinc-400">
              {step === "fetching"
                ? "Requesting paywalled endpoint..."
                : step === "payment-required" ||
                    ["sending-payment", "waiting-confirmation", "verifying", "success"].includes(step)
                  ? `Received 402 Payment Required`
                  : "Will request the paywalled endpoint"}
            </p>
          </StepCard>

          {/* Payment Required Details */}
          {paymentReq && (
            <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/20 p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">
                    Payment Required
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500">Amount:</span>
                      <span className="text-zinc-200 ml-2 font-medium">
                        {(Number(paymentReq.maxAmountRequired) / 1_000_000).toFixed(6)} USDC
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Recipient:</span>
                      <span className="text-zinc-200 ml-2 font-mono text-xs">
                        {paymentReq.payTo.slice(0, 6)}...{paymentReq.payTo.slice(-4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Network:</span>
                      <span className="text-zinc-200 ml-2">
                        {paymentReq.network}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Token:</span>
                      <span className="text-zinc-200 ml-2 font-mono text-xs">
                        USDC
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Send Payment */}
          <StepCard
            title="2. Send USDC On-Chain"
            status={
              step === "sending-payment" || step === "waiting-confirmation"
                ? "loading"
                : ["verifying", "success"].includes(step)
                  ? "complete"
                  : "idle"
            }
          >
            <p className="text-sm text-zinc-400">
              {step === "sending-payment"
                ? "Waiting for wallet signature..."
                : step === "waiting-confirmation"
                  ? "Transaction submitted, waiting for confirmation..."
                  : ["verifying", "success"].includes(step)
                    ? "Payment confirmed on Etherlink"
                    : "Will send USDC to merchant"}
            </p>
            {txHash && (
              <a
                href={`https://shadownet.explorer.etherlink.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
              >
                View on Etherlink Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </StepCard>

          {/* Step 3: Verify */}
          <StepCard
            title="3. Verify & Access Resource"
            status={
              step === "verifying"
                ? "loading"
                : step === "success"
                  ? "complete"
                  : "idle"
            }
            error={step === "error" && !error.includes("402") ? error : ""}
          >
            <p className="text-sm text-zinc-400">
              {step === "verifying"
                ? "Verifying payment on-chain..."
                : step === "success"
                  ? "Payment verified! Resource unlocked"
                  : "Will verify transaction and return resource"}
            </p>
          </StepCard>
        </div>

        {/* Response */}
        {response && step === "success" && (
          <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-300">
                  Success!
                </h3>
                <p className="text-sm text-emerald-400/80">
                  Payment verified, content unlocked
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-400">Response</span>
              </div>
              <pre className="text-xs text-zinc-300 overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
            <button
              onClick={reset}
              className="mt-4 w-full px-4 py-2.5 text-sm font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Try Another Endpoint
            </button>
          </div>
        )}

        {/* Error */}
        {error && step === "error" && (
          <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-300 mb-1">
                  Error
                </h3>
                <p className="text-sm text-red-400/80">{error}</p>
                <button
                  onClick={reset}
                  className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        {!isConnected && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
            <Zap className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">
              Connect your wallet to test x402 payments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StepCard({
  title,
  status,
  error,
  children,
}: {
  title: string;
  status: "idle" | "loading" | "complete";
  error?: string;
  children: React.ReactNode;
}) {
  const icon =
    status === "loading" ? (
      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
    ) : status === "complete" ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-zinc-700" />
    );

  return (
    <div
      className={`rounded-xl border ${
        error
          ? "border-red-800/50 bg-red-950/20"
          : status === "loading"
            ? "border-cyan-800/50 bg-cyan-950/20"
            : status === "complete"
              ? "border-emerald-800/50 bg-emerald-950/20"
              : "border-zinc-800 bg-zinc-900/30"
      } p-5`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold mb-2 ${
              error
                ? "text-red-300"
                : status === "loading"
                  ? "text-cyan-300"
                  : status === "complete"
                    ? "text-emerald-300"
                    : "text-zinc-400"
            }`}
          >
            {title}
          </h3>
          {children}
          {error && (
            <p className="text-sm text-red-400/80 mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
