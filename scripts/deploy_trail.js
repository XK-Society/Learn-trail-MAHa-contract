const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const TRAIL = await hre.ethers.getContractFactory("TRAIL");
  const trail = await TRAIL.deploy(deployer.address);

  await trail.waitForDeployment();

  console.log("TRAIL token deployed to:", await trail.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });