"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  Link2,
  Wallet,
  Hash,
  DollarSign,
  FileText,
  Zap,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionType = "tip" | "nft_sale";

export default function LinksPage() {
  const [actionType, setActionType] = useState<ActionType>("tip");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [description, setDescription] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormValid = useMemo(() => {
    if (actionType === "tip") {
      return !!recipientAddress && !!tipAmount;
    }
    return !!contractAddress && !!tokenId && !!price;
  }, [
    actionType,
    recipientAddress,
    tipAmount,
    contractAddress,
    tokenId,
    price,
  ]);

  async function handleGenerate() {
    if (!isFormValid) return;
    setIsLoading(true);
    setGeneratedLink("");
    setError("");

    const payload =
      actionType === "tip"
        ? {
            action_type: "tip",
            recipient_address: recipientAddress,
            tip_amount_eth: tipAmount,
            description,
          }
        : {
            action_type: "nft_sale",
            contract_address: contractAddress,
            token_id: tokenId,
            price,
            description,
          };

    try {
      const response = await fetch("/api/create-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to create action link");
      }

      const result = await response.json();
      setGeneratedLink(result.short_url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
          Links
        </h2>
        <p className="text-zinc-400">
          Create Tip/NFT action links on Etherlink testnet and share instantly.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-800/50 p-1">
          <Button
            type="button"
            variant={actionType === "tip" ? "default" : "ghost"}
            className="justify-center"
            onClick={() => setActionType("tip")}
          >
            <Zap className="mr-2 h-4 w-4" /> Tip
          </Button>
          <Button
            type="button"
            variant={actionType === "nft_sale" ? "default" : "ghost"}
            className="justify-center"
            onClick={() => setActionType("nft_sale")}
          >
            <Image className="mr-2 h-4 w-4" /> NFT Sale
          </Button>
        </div>

        {actionType === "tip" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-300 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Recipient Wallet
              </label>
              <Input
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Amount (XTZ)
              </label>
              <Input
                type="number"
                step="0.000001"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="0.01"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-300 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> NFT Contract
              </label>
              <Input
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 flex items-center gap-2">
                  <Hash className="h-4 w-4" /> Token ID
                </label>
                <Input
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Price (XTZ)
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1.5"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-zinc-300 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional note shown on action page"
            className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={!isFormValid || isLoading}
        >
          <Link2 className="mr-2 h-4 w-4" />{" "}
          {isLoading ? "Generating..." : "Generate Link"}
        </Button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {generatedLink && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-100">
            Generated Link
          </h3>
          <div className="flex items-center gap-2">
            <Input value={generatedLink} readOnly />
            <Button type="button" variant="secondary" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="w-fit rounded-xl bg-white p-4">
            <QRCodeSVG value={generatedLink} size={180} />
          </div>
        </div>
      )}
    </div>
  );
}
