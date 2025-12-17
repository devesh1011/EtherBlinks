"use client";

import { useEffect, useMemo, useState, use } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseEther } from "viem";
import { AlertCircle, CheckCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionType = "tip" | "nft_sale";

interface ActionData {
  id: string;
  action_type: ActionType;
  short_id: string;
  recipient_address?: string;
  tip_amount_eth?: string;
  contract_address?: string;
  token_id?: string;
  price?: string;
  description?: string;
}

export default function ActionPage({
  params,
}: {
  params: Promise<{ data: string }>;
}) {
  const resolvedParams = use(params);
  const [action, setAction] = useState<ActionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isConnected } = useAccount();
  const {
    data: sendHash,
    sendTransaction,
    isPending: isSending,
  } = useSendTransaction();
  const {
    data: writeHash,
    writeContract,
    isPending: isWriting,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (sendHash) setTxHash(sendHash);
  }, [sendHash]);

  useEffect(() => {
    if (writeHash) setTxHash(writeHash);
  }, [writeHash]);

  useEffect(() => {
    const raw = resolvedParams.data;
    const [_, shortId] = raw.split("-", 2);
    if (!shortId) {
      setError("Invalid link format");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/execute/${shortId}`);
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Action not found");
        }
        const result = await response.json();
        setAction(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load action");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [resolvedParams.data]);

  const status = useMemo(() => {
    if (isSuccess) return "Transaction confirmed";
    if (isConfirming) return "Confirming transaction...";
    if (isSending || isWriting) return "Waiting for wallet signature...";
    return "Ready";
  }, [isSuccess, isConfirming, isSending, isWriting]);

  const execute = () => {
    if (!action) return;

    if (
      action.action_type === "tip" &&
      action.recipient_address &&
      action.tip_amount_eth
    ) {
      sendTransaction({
        to: action.recipient_address as `0x${string}`,
        value: parseEther(action.tip_amount_eth),
      });
      return;
    }

    if (
      action.action_type === "nft_sale" &&
      action.contract_address &&
      action.token_id &&
      action.price
    ) {
      writeContract({
        abi: [
          {
            type: "function",
            name: "buy",
            stateMutability: "payable",
            inputs: [{ name: "tokenId", type: "uint256" }],
            outputs: [],
          },
        ],
        address: action.contract_address as `0x${string}`,
        functionName: "buy",
        args: [BigInt(action.token_id)],
        value: parseEther(action.price),
      });
      return;
    }

    setError("Action payload is incomplete");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (error || !action) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="rounded-xl border border-red-800 bg-red-950/30 p-6 max-w-md w-full">
          <p className="text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error || "Invalid action"}
          </p>
        </div>
      </main>
    );
  }

  const title = action.action_type === "tip" ? "Send Tip" : "Buy NFT";
  const subtitle =
    action.action_type === "tip"
      ? `${action.tip_amount_eth} XTZ`
      : `${action.price} XTZ • Token #${action.token_id}`;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        <div className="flex justify-center">
          <ConnectButton showBalance={false} accountStatus="address" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
          <p className="text-zinc-400">{subtitle}</p>
          {action.description && (
            <p className="text-sm text-zinc-300">{action.description}</p>
          )}
        </div>

        <Button
          onClick={execute}
          disabled={
            !isConnected || isSending || isWriting || isConfirming || isSuccess
          }
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {isSuccess
            ? "Completed"
            : isConfirming
              ? "Confirming..."
              : "Execute Action"}
        </Button>

        <p className="text-sm text-zinc-400 flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <Loader2
              className={`h-4 w-4 ${isConfirming ? "animate-spin" : ""}`}
            />
          )}
          {status}
        </p>

        {txHash && (
          <a
            href={`https://shadownet.explorer.etherlink.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            View transaction: {txHash.slice(0, 10)}...
          </a>
        )}
      </div>
    </main>
  );
}
