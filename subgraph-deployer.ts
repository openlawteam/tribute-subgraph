// import fs from "fs";
import path, { resolve } from "path";
import { execSync } from "child_process";
import { config as dotenvConfig } from "dotenv";

// import subgraphConfig from "./config/subgraph-config.json";

dotenvConfig({ path: resolve(__dirname, ".env") });

const GITHUB_USERNAME = "ADD_GITHUB_USERNAME";
const SUBGRAPH_NAMES_OR_SLUGS = [
  {
    BankExtension: "tribute-bank-extension",
    CouponOnboarding: "tribute-coupon-onboarding",
    DaoRegistry: "tribute-dao-registry",
    NFTExtension: "tribute-nft-extension",
  },
];

// type DeploySettings = {
//   GITHUB_USERNAME?: string;
//   SUBGRAPH_NAME_OR_SLUG: string;
// };

// type YAMLSettings = {
//   daoFactoryAddress: string;
//   daoFactoryStartBlock: number;
//   couponOnboardingAddress?: string | undefined;
//   couponOnboardingStartBlock?: number | undefined;
//   network: string;
// };

// type SubgraphSettings = DeploySettings & YAMLSettings;

// Execute Child Processes
const srcDir = path.join(__dirname);
export const exec = (cmd: string) => {
  try {
    return execSync(cmd, { cwd: srcDir, stdio: "inherit" });
  } catch (e) {
    throw new Error(`Failed to run command \`${cmd}\``);
  }
};

(function() {
  // Compile the solidity contracts
  console.log("📦 ### 1/3 Compiling the smart contracts...");
  exec(`npm run compile`);

  // Create the graph code generation files
  console.log("📦 ### 2/3 Creating the graph scheme...");
  exec(`graph codegen`);

  // Building the graph scheme
  console.log("📦 ### 3/3 Building the graph scheme...");
  exec(`graph build`);

  console.log("📦 ### Build complete, preparing deployment...");

  let executedDeployments: number = 0;

  console.log(
    `==== READY TO DEPLOY ${
      Object(SUBGRAPH_NAMES_OR_SLUGS).length
    } SUBGRAPHS... ====
    
    `
  );

  SUBGRAPH_NAMES_OR_SLUGS.forEach(
    (subgraph: Record<string, string>, index: number) => {
      console.log(`📦 ### DEPLOYMENT ${index + 1}/${
        Object(SUBGRAPH_NAMES_OR_SLUGS).length
      }...
    
    `);

      console.log("🛠 ### Preparing subgraph template for...");
      //   console.log(`
      // GITHUB_USERNAME: ${subgraph.GITHUB_USERNAME || "n/a"}
      // SUBGRAPH_NAME_OR_SLUG: ${subgraph.SUBGRAPH_NAME_OR_SLUG}
      // Network: ${subgraph.network}
      // Address: ${subgraph.daoFactoryAddress}
      // Start Block: ${subgraph.daoFactoryStartBlock}
      // `);

      // Write YAML file
      // fs.writeFileSync(
      //   "subgraph.yaml",
      //   getYAML({
      //     daoFactoryAddress: subgraph.daoFactoryAddress,
      //     daoFactoryStartBlock: subgraph.daoFactoryStartBlock,
      //     couponOnboardingAddress: subgraph.couponOnboardingAddress,
      //     couponOnboardingStartBlock: subgraph.couponOnboardingStartBlock,
      //     network: subgraph.network,
      //   })
      // );

      // Deploy subgraph <GITHUB_USERNAME/SUBGRAPH_NAME_OR_SLUG>
      console.log("🚗 ### Deploying subgraph...");

      if (subgraph.network === "mainnet") {
        exec(`graph auth --studio ${process.env.GRAPH_DEPLOYMENT_KEY}`);
        exec(`graph deploy --studio ${subgraph.SUBGRAPH_NAME_OR_SLUG}`);
      } else {
        exec(
          `graph deploy --access-token ${process.env.GRAPH_ACCESS_TOKEN} --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ ${subgraph.GITHUB_USERNAME}/${subgraph.SUBGRAPH_NAME_OR_SLUG}`
        );
      }

      console.log("👏 ### Done.");

      // Increment deployment counter
      executedDeployments++;
    }
  );

  console.log(`🎉 ### ${executedDeployments} Deployment(s) Successful!`);
})();
