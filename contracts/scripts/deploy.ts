import { network } from "hardhat";
import { formatUnits, parseUnits } from "viem";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Deploying SubscriptionManager...\n");

  // Connect to network and get viem instance
  const { viem } = await network.connect();

  // Get deployment account
  const [deployer] = await viem.getWalletClients();
  const deployerAddress = deployer.account.address;
  console.log("Deploying from:", deployerAddress);

  // Get network info
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const balance = await publicClient.getBalance({ address: deployerAddress });
  console.log("Network Chain ID:", chainId);
  console.log("Deployer Balance:", formatUnits(balance, 18), "XTZ\n");

  // Configuration based on network
  let usdcAddress: `0x${string}`;
  let feeRecipient: `0x${string}`;

  if (chainId === 127823) {
    // Etherlink Shadownet
    usdcAddress = "0xdff6bf7fbcbba7142e0b091a14404080dca852bb"; // Mock USDC for testing
    feeRecipient = deployerAddress; // You can change this to a dedicated fee recipient
    console.log("📍 Network: Etherlink Shadownet");
  } else if (chainId === 42793) {
    // Etherlink Mainnet
    usdcAddress = "0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9"; // Update with mainnet USDC
    feeRecipient = deployerAddress;
    console.log("📍 Network: Etherlink Mainnet");
  } else {
    console.error(
      "❌ Unknown network. Please configure USDC address for chain ID:",
      chainId,
    );
    process.exit(1);
  }

  console.log("USDC Address:", usdcAddress);
  console.log("Fee Recipient:", feeRecipient);
  console.log();

  // Deploy SubscriptionManager
  console.log("⏳ Deploying SubscriptionManager contract...");
  const subscriptionManager = await viem.deployContract("SubscriptionManager", [
    usdcAddress,
    feeRecipient,
  ]);

  console.log(
    "✅ SubscriptionManager deployed to:",
    subscriptionManager.address,
  );
  console.log();

  // Read contract details
  const protocolFeeBps = await subscriptionManager.read.PROTOCOL_FEE_BPS();
  const minInterval = await subscriptionManager.read.MIN_INTERVAL();
  const maxInterval = await subscriptionManager.read.MAX_INTERVAL();
  const usdc = await subscriptionManager.read.USDC();

  console.log("📋 Contract Details:");
  console.log("  - USDC Token:", usdc);
  console.log("  - Fee Recipient:", feeRecipient);
  console.log("  - Protocol Fee:", Number(protocolFeeBps) / 100, "%");
  console.log("  - Min Interval:", Number(minInterval), "seconds");
  console.log("  - Max Interval:", Number(maxInterval), "seconds");
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: chainId === 127823 ? "Etherlink Shadownet" : "Etherlink Mainnet",
    chainId: chainId,
    timestamp: new Date().toISOString(),
    deployer: deployerAddress,
    contracts: {
      SubscriptionManager: {
        address: subscriptionManager.address,
        constructorArgs: [usdcAddress, feeRecipient],
      },
    },
    config: {
      usdcAddress: usdc,
      feeRecipient: feeRecipient,
      protocolFeeBps: Number(protocolFeeBps),
      minInterval: Number(minInterval),
      maxInterval: Number(maxInterval),
    },
  };

  const deploymentPath = join(
    process.cwd(),
    "deployments",
    `${chainId}-${Date.now()}.json`,
  );

  try {
    writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", deploymentPath);
  } catch (error) {
    console.warn(
      "⚠️  Could not save deployment file (mkdir deployments/ if needed)",
    );
  }

  console.log();
  console.log("✨ Deployment Complete!");
  console.log();
  console.log("📝 Next Steps:");
  console.log("1. Update your frontend/relayer with the new contract address:");
  console.log(`   ${subscriptionManager.address}`);
  console.log();
  console.log("2. Verify the contract (optional):");
  console.log(
    `   npx hardhat verify --network etherlinkShadownet ${subscriptionManager.address} ${usdcAddress} ${feeRecipient}`,
  );
  console.log();
  console.log("3. Test by creating a policy:");
  console.log("   - Visit your frontend demo at /demo/checkout");
  console.log("   - Or use the contract directly via etherscan");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
