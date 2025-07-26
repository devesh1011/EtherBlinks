import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { Chain } from 'viem/chains';

// Define the Etherlink Testnet as a custom chain
export const etherlinkTestnet: Chain = {
  id: 128123, // Etherlink Testnet Chain ID
  name: 'Etherlink Testnet',
  nativeCurrency: {
    name: 'Tezos',
    symbol: 'XTZ', // Even though it's used like ETH, the native symbol is XTZ
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://node.ghostnet.etherlink.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherlink Testnet Explorer', url: 'https://testnet.explorer.etherlink.com' },
  },
  testnet: true,
};

// Create the wagmi config
export const config = getDefaultConfig({
  appName: 'EtherBlink',
  projectId: 'Ycb559b32348089833acd49f8c3c2784b', // Get one from https://cloud.walletconnect.com/
  chains: [etherlinkTestnet],
  ssr: true, // Enable SSR for Next.js
});