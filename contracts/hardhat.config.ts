import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    etherlinkShadownet: {
      type: "http",
      chainType: "l1",
      url: "https://node.shadownet.etherlink.com",
      chainId: 127823,
      accounts: process.env.ETHERLINK_PRIVATE_KEY
        ? [process.env.ETHERLINK_PRIVATE_KEY as `0x${string}`]
        : [],
    },
  },
});
