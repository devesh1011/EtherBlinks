"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { Chain } from "viem/chains";

export const etherlinkShadownet: Chain = {
  id: 127823,
  name: "Etherlink Shadownet Testnet",
  nativeCurrency: {
    name: "Tezos",
    symbol: "XTZ",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://node.shadownet.etherlink.com"] },
  },
  blockExplorers: {
    default: {
      name: "Etherlink Explorer",
      url: "https://shadownet.explorer.etherlink.com",
    },
  },
  testnet: true,
};

export function getWagmiConfig() {
  return getDefaultConfig({
    appName: "EtherBlinks",
    projectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
    chains: [etherlinkShadownet],
    ssr: true, // Enable SSR for cross-origin consistency
  });
}
