// ---------------------------------------------------------------------------
// Intervals (seconds)
// ---------------------------------------------------------------------------

export const intervals = {
  /** 1 minute — useful for testing */
  minute: 60,
  /** 7 days */
  weekly: 604_800,
  /** 14 days */
  biweekly: 1_209_600,
  /** 30 days */
  monthly: 2_592_000,
  /** 90 days */
  quarterly: 7_776_000,
  /** 365 days */
  yearly: 31_536_000,

  /** Build a custom interval from a count and unit */
  custom(
    count: number,
    unit: "minutes" | "hours" | "days" | "months" | "years",
  ): number {
    const multipliers: Record<string, number> = {
      minutes: 60,
      hours: 3_600,
      days: 86_400,
      months: 2_592_000, // 30 days
      years: 31_536_000, // 365 days
    };
    return count * multipliers[unit];
  },
} as const;

// ---------------------------------------------------------------------------
// Protocol
// ---------------------------------------------------------------------------

/** Protocol fee in basis points (2.5%) */
export const PROTOCOL_FEE_BPS = 250;

/** USDC uses 6 decimals */
export const USDC_DECIMALS = 6;

/** Minimum interval (1 minute) */
export const MIN_INTERVAL = 60;

/** Maximum interval (365 days) */
export const MAX_INTERVAL = 31_536_000;

/** Max consecutive failures before auto-cancel */
export const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Chain configs
// ---------------------------------------------------------------------------

export interface ChainConfig {
  name: string;
  chainId: number;
  cctpDomain: number;
  usdc: string;
  explorer: string;
}

export const chains: Record<string, ChainConfig> = {
  etherlinkMainnet: {
    name: "Etherlink Mainnet",
    chainId: 42793,
    cctpDomain: 0,
    usdc: "",
    explorer: "https://explorer.etherlink.com",
  },
  etherlinkShadownet: {
    name: "Etherlink Shadownet Testnet",
    chainId: 127823,
    cctpDomain: 0,
    usdc: "",
    explorer: "https://shadownet.explorer.etherlink.com",
  },
};

/** Default checkout base URL */
export const DEFAULT_CHECKOUT_BASE_URL = "https://etherblinks.com";
