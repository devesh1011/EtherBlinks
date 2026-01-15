/**
 * x402 Payment Verification for Etherlink Shadownet
 *
 * Since our MockUSDC doesn't support EIP-3009 (transferWithAuthorization),
 * we verify payments by checking actual on-chain ERC-20 Transfer events
 * from the submitted transaction hash.
 *
 * This acts as a self-hosted "facilitator" — confirms that the tx:
 *  1. Is on the correct chain
 *  2. Transfers the correct token (USDC)
 *  3. Sends >= required amount
 *  4. Sends to the correct merchant address
 *  5. Is confirmed (not reverted)
 */

import { createPublicClient, http, parseAbi, type Hash } from "viem";
import {
  ETHERLINK_SHADOWNET,
  type VerificationResult,
  type PaymentPayload,
  type PaymentRequirement,
} from "./types";

const ERC20_TRANSFER_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

/**
 * Create a viem public client for Etherlink Shadownet
 */
function getClient() {
  return createPublicClient({
    chain: {
      id: ETHERLINK_SHADOWNET.chainId,
      name: "Etherlink Shadownet",
      nativeCurrency: { name: "Tezos", symbol: "XTZ", decimals: 18 },
      rpcUrls: {
        default: { http: [ETHERLINK_SHADOWNET.rpcUrl] },
      },
    },
    transport: http(ETHERLINK_SHADOWNET.rpcUrl),
  });
}

/**
 * Verify an on-chain USDC transfer matches x402 payment requirements
 */
export async function verifyPayment(
  payload: PaymentPayload,
  requirement: PaymentRequirement
): Promise<VerificationResult> {
  try {
    const client = getClient();

    // 1. Get the transaction receipt
    const receipt = await client.getTransactionReceipt({
      hash: payload.txHash as Hash,
    });

    if (!receipt) {
      return { valid: false, error: "Transaction not found" };
    }

    if (receipt.status !== "success") {
      return { valid: false, error: "Transaction reverted" };
    }

    // 2. Find the ERC-20 Transfer event in the logs
    const transferLog = receipt.logs.find((log) => {
      // ERC-20 Transfer topic
      return (
        log.address.toLowerCase() === requirement.asset.toLowerCase() &&
        log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      );
    });

    if (!transferLog) {
      return {
        valid: false,
        error: "No USDC Transfer event found in transaction",
      };
    }

    // 3. Decode the Transfer event
    const from = `0x${transferLog.topics[1]!.slice(26)}`.toLowerCase();
    const to = `0x${transferLog.topics[2]!.slice(26)}`.toLowerCase();
    const value = BigInt(transferLog.data);

    // 4. Verify the payer matches
    if (from !== payload.payer.toLowerCase()) {
      return {
        valid: false,
        error: `Transfer from ${from} doesn't match payer ${payload.payer}`,
      };
    }

    // 5. Verify recipient matches merchant
    if (to !== requirement.payTo.toLowerCase()) {
      return {
        valid: false,
        error: `Transfer to ${to} doesn't match merchant ${requirement.payTo}`,
      };
    }

    // 6. Verify amount is sufficient
    const requiredAmount = BigInt(requirement.maxAmountRequired);
    if (value < requiredAmount) {
      return {
        valid: false,
        error: `Transfer amount ${value} < required ${requiredAmount}`,
      };
    }

    return {
      valid: true,
      txHash: payload.txHash,
      amount: value.toString(),
      from,
      to,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Verification failed: ${err.message}`,
    };
  }
}

/**
 * Build a 402 Payment Required response body
 */
export function buildPaymentRequired(
  requirement: PaymentRequirement
): string {
  const payload = {
    x402Version: 2,
    accepts: [requirement],
  };
  return JSON.stringify(payload);
}

/**
 * Parse the X-PAYMENT header from a request
 */
export function parsePaymentHeader(
  headerValue: string | null
): PaymentPayload | null {
  if (!headerValue) return null;

  try {
    // Try base64 first (standard x402)
    const decoded = Buffer.from(headerValue, "base64").toString("utf-8");
    return JSON.parse(decoded) as PaymentPayload;
  } catch {
    try {
      // Fallback to raw JSON
      return JSON.parse(headerValue) as PaymentPayload;
    } catch {
      return null;
    }
  }
}

/**
 * Convert a USD price to raw USDC amount (6 decimals)
 */
export function usdToUsdcRaw(usd: number): string {
  return BigInt(Math.round(usd * 1_000_000)).toString();
}
