import PolicyManagerArtifact from "./PolicyManager.abi.json";
import { etherlinkShadownet } from "./wagmi";

export const POLICY_MANAGER_ADDRESS =
  "0x93344be5b4170ad7430c7096953d048a4a03c58c" as const;

export const POLICY_MANAGER_CONFIG = {
  address: POLICY_MANAGER_ADDRESS,
  abi: PolicyManagerArtifact.abi,
  chainId: etherlinkShadownet.id,
} as const;

// USDC contract address on Etherlink Shadownet
// Mock USDC for testing - anyone can mint via faucet() function
export const USDC_ADDRESS =
  "0xdff6bf7fbcbba7142e0b091a14404080dca852bb" as const;

export const USDC_ABI = [
  // ERC20 approve function
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ERC20 allowance function
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
