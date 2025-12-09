"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CheckCircle2, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import {
  POLICY_MANAGER_ADDRESS,
  USDC_ABI,
  USDC_ADDRESS,
} from "@/lib/contracts";
import { useCreatePolicy } from "@/hooks/usePolicyManager";
import { etherlinkShadownet } from "@/lib/wagmi";

interface PlanMetadata {
  name: string;
  description: string;
  icon?: string;
  features?: string[];
}

/**
 * Demo Checkout Page - Reference Implementation
 *
 * This page demonstrates how merchants can build a subscription checkout flow
 * using the EtherBlinks SDK and contracts.
 *
 * Merchants should:
 * 1. Parse URL parameters (merchant, amount, interval, etc.)
 * 2. Fetch and display plan metadata
 * 3. Guide users through USDC approval
 * 4. Create the policy on-chain
 * 5. Redirect to success/cancel URLs
 */
export default function DemoCheckoutPage() {
  const { address, isConnected, chain } = useAccount();
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);
  const [metadata, setMetadata] = useState<PlanMetadata | null>(null);
  const [step, setStep] = useState<
    "connect" | "approve" | "subscribe" | "success"
  >("connect");

  // Parse URL parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlParams(new URLSearchParams(window.location.search));
    }
  }, []);

  // Extract checkout parameters
  const merchant = urlParams?.get("merchant") as `0x${string}` | null;
  const amount = urlParams?.get("amount");
  const interval = urlParams?.get("interval");
  const spendingCap = urlParams?.get("spendingCap");
  const metadataUrl = urlParams?.get("metadataUrl");
  const successUrl = urlParams?.get("successUrl");
  const cancelUrl = urlParams?.get("cancelUrl");

  // Fetch metadata
  useEffect(() => {
    if (metadataUrl) {
      fetch(metadataUrl)
        .then((res) => res.json())
        .then((data) => setMetadata(data))
        .catch(() =>
          setMetadata({
            name: "Subscription Plan",
            description: "Premium subscription",
          }),
        );
    }
  }, [metadataUrl]);

  // USDC approval
  const {
    writeContract: approveUSDC,
    data: approvalHash,
    isPending: isApproving,
  } = useWriteContract();

  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Policy creation
  const {
    createPolicy,
    hash: policyHash,
    isPending: isCreatingPolicy,
    isSuccess: isPolicyCreated,
    error: policyError,
  } = useCreatePolicy();

  // Log policy creation errors
  useEffect(() => {
    if (policyError) {
      console.error("🔴 Policy Creation Error:", policyError);
    }
  }, [policyError]);

  // Log policy creation state changes
  useEffect(() => {
    console.log("🟡 Policy creation state:", {
      isCreatingPolicy,
      isPolicyCreated,
      policyHash,
      policyError: policyError?.message || null,
    });
  }, [isCreatingPolicy, isPolicyCreated, policyHash, policyError]);

  // Debug logging
  useEffect(() => {
    console.log("🟢 Current State:", {
      step,
      isConnected,
      isApprovalConfirmed,
      isPolicyCreated,
      approvalHash,
      policyHash,
    });
  }, [
    step,
    isConnected,
    isApprovalConfirmed,
    isPolicyCreated,
    approvalHash,
    policyHash,
  ]);

  // Handle approval
  const handleApprove = async () => {
    if (!merchant || !spendingCap) return;

    const capAmount = parseUnits(spendingCap, 6); // USDC has 6 decimals

    approveUSDC({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "approve",
      args: [POLICY_MANAGER_ADDRESS, capAmount],
    });
  };

  // Handle subscription
  const handleSubscribe = async () => {
    console.log("🔵 handleSubscribe called");
    console.log("Parameters:", {
      merchant,
      amount,
      interval,
      spendingCap,
      metadataUrl,
    });

    // Check wallet connection
    console.log("Wallet state:", {
      isConnected,
      address,
      chainId: chain?.id,
      expectedChainId: 127823,
    });

    if (!merchant || !amount || !interval || !spendingCap || !metadataUrl) {
      console.error("❌ Missing parameters:", {
        merchant: !!merchant,
        amount: !!amount,
        interval: !!interval,
        spendingCap: !!spendingCap,
        metadataUrl: !!metadataUrl,
      });
      return;
    }

    // Check if on correct chain
    if (chain?.id !== 127823) {
      console.error("❌ Wrong chain! Current:", chain?.id, "Expected: 127823");
      // You might want to show a UI message to switch chains here
      return;
    }

    console.log("✅ All parameters present, creating policy...");
    const parsedChargeAmount = parseUnits(amount, 6);
    const parsedSpendingCap = parseUnits(spendingCap, 6);
    const parsedInterval = parseInt(interval);

    console.log("Parsed values:", {
      merchant,
      chargeAmount: parsedChargeAmount.toString(),
      interval: parsedInterval,
      spendingCap: parsedSpendingCap.toString(),
      metadataUrl,
    });

    createPolicy({
      merchant,
      chargeAmount: parsedChargeAmount,
      interval: parsedInterval,
      spendingCap: parsedSpendingCap,
      metadataUrl,
    });
  };

  // Update step based on transaction status
  useEffect(() => {
    console.log("🔵 Connect effect:", { isConnected, step });
    if (isConnected && step === "connect") {
      console.log("✅ Moving to approve step");
      setStep("approve");
    }
  }, [isConnected, step]);

  useEffect(() => {
    console.log("🔵 Approval effect:", { isApprovalConfirmed, step });
    if (isApprovalConfirmed && step === "approve") {
      console.log("✅ Moving to subscribe step");
      setStep("subscribe");
    }
  }, [isApprovalConfirmed, step]);

  useEffect(() => {
    console.log("🔵 Subscription effect:", { isPolicyCreated, step });
    if (isPolicyCreated && step === "subscribe") {
      console.log("✅ Moving to success step");
      setStep("success");
      // Redirect to success URL after a short delay
      if (successUrl) {
        setTimeout(() => {
          window.location.href = successUrl;
        }, 2000);
      }
    }
  }, [isPolicyCreated, step, successUrl]);

  // Calculate fee breakdown (2.5% protocol fee)
  const calculateFees = (amountStr: string) => {
    const amt = parseFloat(amountStr);
    const protocolFee = amt * 0.025;
    const total = amt;
    const merchantReceives = amt - protocolFee;
    return { total, protocolFee, merchantReceives };
  };

  const fees = amount ? calculateFees(amount) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">
            Demo Checkout
          </h1>
          <p className="text-zinc-400 text-sm">
            Reference implementation for merchants
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
          {/* Plan Details */}
          {metadata && (
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-start gap-4">
                {metadata.icon && (
                  <img
                    src={metadata.icon}
                    alt={metadata.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-zinc-100 mb-1">
                    {metadata.name}
                  </h2>
                  <p className="text-sm text-zinc-400 mb-3">
                    {metadata.description}
                  </p>
                  {metadata.features && (
                    <ul className="space-y-1">
                      {metadata.features.map((feature, i) => (
                        <li
                          key={i}
                          className="text-xs text-zinc-500 flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          {amount && interval && (
            <div className="p-6 border-b border-zinc-800 bg-zinc-800/30">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-zinc-100">
                    ${amount}
                  </span>
                  <span className="text-zinc-400 ml-2">
                    /{" "}
                    {parseInt(interval) === 2592000
                      ? "month"
                      : `${parseInt(interval) / 86400} days`}
                  </span>
                </div>
              </div>

              {fees && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Amount</span>
                    <span>${fees.total.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-xs">
                    <span>Protocol fee (2.5%)</span>
                    <span>${fees.protocolFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-700">
                    <span>Merchant receives</span>
                    <span>${fees.merchantReceives.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Section */}
          <div className="p-6">
            {step === "connect" && (
              <div className="text-center">
                <p className="text-zinc-400 mb-4">
                  Connect your wallet to continue
                </p>
                <button
                  disabled
                  className="w-full py-3 rounded-lg bg-zinc-700 text-zinc-400 font-medium"
                >
                  Connect Wallet (Use header button)
                </button>
              </div>
            )}

            {step === "approve" && (
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <span>Approve USDC spending</span>
                  </div>
                  <p className="text-xs text-zinc-500 ml-8">
                    Allow the contract to charge up to ${spendingCap} USDC from
                    your wallet
                  </p>
                </div>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve USDC"
                  )}
                </button>
                {approvalHash && (
                  <a
                    href={`${etherlinkShadownet.blockExplorers?.default?.url}/tx/${approvalHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-center mt-2"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {step === "subscribe" && (
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <span>Create subscription</span>
                  </div>
                  <p className="text-xs text-zinc-500 ml-8">
                    Confirm the subscription policy on-chain
                  </p>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={isCreatingPolicy}
                  className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingPolicy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating subscription...
                    </>
                  ) : (
                    "Subscribe Now"
                  )}
                </button>
                {policyHash && (
                  <a
                    href={`${etherlinkShadownet.blockExplorers?.default?.url}/tx/${policyHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-center mt-2"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {step === "success" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                  Subscription Created!
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Your subscription is now active.
                  {successUrl && " Redirecting..."}
                </p>
                {policyHash && (
                  <div className="flex flex-col gap-2 mt-4">
                    <a
                      href={`${etherlinkShadownet.blockExplorers?.default?.url || "https://shadownet.explorer.etherlink.com"}/tx/${policyHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center justify-center gap-1"
                    >
                      View transaction <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href="/dashboard/subscriptions"
                      className="text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      View in dashboard →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Cancel button */}
            {step !== "success" && cancelUrl && (
              <button
                onClick={() => (window.location.href = cancelUrl)}
                className="w-full py-2 mt-3 text-sm text-zinc-400 hover:text-zinc-300"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-zinc-100 mb-1">
                Demo Implementation
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This is a reference checkout page. Merchants should build their
                own checkout flow using the EtherBlinks SDK and customize the UI
                to match their brand.
              </p>
            </div>
          </div>
        </div>

        {/* Merchant Info */}
        {merchant && (
          <div className="mt-4 text-center text-xs text-zinc-500">
            Merchant: {merchant.slice(0, 6)}...{merchant.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}
