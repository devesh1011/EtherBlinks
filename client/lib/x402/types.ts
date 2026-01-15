/**
 * x402 Protocol Types for EtherBlinks
 *
 * Follows the x402 v2 specification (Coinbase) adapted for
 * Etherlink Shadownet where EIP-3009 isn't available.
 *
 * Settlement uses on-chain ERC-20 transfer verification
 * instead of facilitator-based transferWithAuthorization.
 */

/** CAIP-2 network identifier */
export type NetworkId = `eip155:${number}`;

/** Payment requirement returned in 402 responses */
export interface PaymentRequirement {
  scheme: "exact";
  network: NetworkId;
  maxAmountRequired: string; // raw token amount (6 decimals for USDC)
  resource: string; // endpoint path
  description?: string;
  payTo: `0x${string}`; // merchant wallet
  asset: `0x${string}`; // token contract (USDC)
  /** Extra fields for our custom flow */
  maxTimeoutSeconds: number;
  mimeType?: string;
}

/** Full 402 response payload */
export interface PaymentRequired {
  x402Version: 2;
  accepts: PaymentRequirement[];
  error?: string;
}

/** Payment payload sent by the client */
export interface PaymentPayload {
  /** The on-chain tx hash of the USDC transfer */
  txHash: `0x${string}`;
  /** Which requirement index is being paid */
  scheme: "exact";
  network: NetworkId;
  /** Payer's address (for verification) */
  payer: `0x${string}`;
}

/** Verification result */
export interface VerificationResult {
  valid: boolean;
  txHash?: string;
  amount?: string;
  from?: string;
  to?: string;
  error?: string;
}

/** Stored endpoint definition */
export interface X402Endpoint {
  id: string;
  merchant_address: string;
  path: string;
  method: string;
  price_usdc: number;
  description: string | null;
  network: string;
  token_address: string;
  active: boolean;
  response_body: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Stored payment record */
export interface X402Payment {
  id: string;
  endpoint_id: string;
  payer_address: string;
  merchant_address: string;
  amount: string;
  tx_hash: string | null;
  status: "pending" | "verified" | "settled" | "failed";
  chain_id: number;
  created_at: string;
  verified_at: string | null;
}

/**
 * Headers used in x402 protocol
 */
export const X402_HEADERS = {
  /** Server → Client: base64-encoded PaymentRequired JSON */
  PAYMENT_REQUIRED: "x-payment-required",
  /** Client → Server: base64-encoded PaymentPayload JSON */
  PAYMENT: "x-payment",
  /** Server → Client: payment settled receipt */
  PAYMENT_RESPONSE: "x-payment-response",
} as const;

/**
 * Default network config for Etherlink Shadownet
 */
export const ETHERLINK_SHADOWNET: {
  network: NetworkId;
  chainId: number;
  rpcUrl: string;
  usdc: `0x${string}`;
} = {
  network: "eip155:127823",
  chainId: 127823,
  rpcUrl: "https://node.shadownet.etherlink.com",
  usdc: "0xdff6bf7fbcbba7142e0b091a14404080dca852bb",
};
