import { network } from "hardhat";
import { formatUnits, parseUnits } from "viem";

async function main() {
  console.log("🪙 Deploying Mock USDC...\n");

  const { viem } = await network.connect();

  const [deployer] = await viem.getWalletClients();
  const deployerAddress = deployer.account.address;
  console.log("Deploying from:", deployerAddress);

  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  console.log("Network Chain ID:", chainId);

  if (chainId !== 127823) {
    console.error(
      "❌ This script is for Etherlink Shadownet only (Chain ID: 127823)",
    );
    process.exit(1);
  }

  // Deploy MockUSDC
  console.log("\n⏳ Deploying MockUSDC contract...");
  const mockUSDC = await viem.deployContract("MockUSDC", []);

  console.log("✅ Mock USDC deployed to:", mockUSDC.address);

  // Mint 10,000 USDC to deployer
  console.log("\n💰 Minting 10,000 USDC to deployer...");
  const mintHash = await mockUSDC.write.mint([
    deployerAddress,
    parseUnits("10000", 6),
  ]);
  await publicClient.waitForTransactionReceipt({ hash: mintHash });
  console.log("✅ Minted 10,000 USDC");

  // Check balance
  const balance = await mockUSDC.read.balanceOf([deployerAddress]);
  console.log("Deployer balance:", formatUnits(balance as bigint, 6), "USDC");

  console.log("\n📝 Next Steps:");
  console.log("1. Update USDC_ADDRESS in frontend/lib/contracts.ts:");
  console.log(`   export const USDC_ADDRESS = "${mockUSDC.address}" as const;`);
  console.log(
    "\n2. To mint more USDC for testing, call the faucet() function:",
  );
  console.log(
    `   cast send ${mockUSDC.address} "faucet()" --rpc-url https://node.shadownet.etherlink.com --private-key YOUR_KEY`,
  );
  console.log("\n3. Or mint specific amounts:");
  console.log(
    `   cast send ${mockUSDC.address} "mint(address,uint256)" YOUR_ADDRESS 1000000000 --rpc-url https://node.shadownet.etherlink.com --private-key YOUR_KEY`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
