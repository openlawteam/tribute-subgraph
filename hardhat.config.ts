import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, ".env") });

import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "@nomiclabs/hardhat-ganache";

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.WALLET_SEED_PHRASE) {
  throw new Error("Please set your WALLET_SEED_PHRASE in a .env file");
} else {
  mnemonic = process.env.WALLET_SEED_PHRASE;
}

function createLocalHostConfig() {
  const url: string = "http://localhost:7545";
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    url,
  };
}

const config = {
  defaultNetwork: "localhost",
  networks: {
    localhost: createLocalHostConfig(),
  },
  solidity: {
    version: "0.8.9", // using the same version as tribute-contracts
    settings: {
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // https://hardhat.org/config/#path-configuration
  paths: {
    tests: "./test",
    sources: "./build/contracts",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },
};

export default config;
