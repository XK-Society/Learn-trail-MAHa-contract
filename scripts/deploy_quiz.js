const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Make sure to replace with the actual deployed TRAIL token address
  const trailTokenAddress = "0xD68fAd32Cf19d2f68A853A2aBCbFc8eBD9704E93";

  const EnhancedQuizContract = await hre.ethers.getContractFactory("EnhancedQuizContract");
  const quizContract = await EnhancedQuizContract.deploy(trailTokenAddress, deployer.address);

  await quizContract.waitForDeployment();

  console.log("EnhancedQuizContract deployed to:", await quizContract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });