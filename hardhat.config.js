require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_RPC_URL = process.env.BASE_RPC_URL;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    base_sepolia: {
      url: BASE_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 84532
    },
  },
  etherscan: {
    apiKey: {
      base_sepolia: BASESCAN_API_KEY
    },
    customChains: [
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
};