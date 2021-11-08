import path, { resolve } from "path";
import { execSync } from "child_process";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: resolve(__dirname, ".env") });

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const NETWORK = process.env.NETWORK;

enum NETWORKS {
  RINKEBY = "rinkeby",
  MAINNET = "mainnet",
}

const SUBGRAPH_SLUGS = {
  /**
   * CORE
   * Mandatory core subgraphs
   */
  DaoRegistry: "tribute-dao-registry-dev",
  // BankExtension: "tribute-dao-bank-extension-dev",

  /**
   * ADAPTERS
   * Add your adpater subgraphs datasource and subgraph slug
   */
  // CouponOnboarding: "tribute-dao-coupon-onboarding-dev",

  /**
   * EXTENSIONS
   * Add your extension subgraphs datasource and subgraph slug
   */
  // NFTExtension: "tribute-dao-nft-extension-dev",
};

// Execute Child Processes
const srcDir = path.join(__dirname);
export const exec = (cmd: string, cwdDir?: string) => {
  try {
    return execSync(cmd, { cwd: cwdDir ?? srcDir, stdio: "inherit" });
  } catch (e) {
    throw new Error(`Failed to run command \`${cmd}\``);
  }
};

let executedDeployments: number = 0;

(function() {
  if (!NETWORK) {
    throw new Error("Please set a NETWORK in a .env file");
  }

  if (!GITHUB_USERNAME && NETWORK !== NETWORKS.MAINNET) {
    throw new Error("Please set your GITHUB_USERNAME in a .env file");
  }

  // Compile the solidity contracts
  console.log("⛓  ### Compiling the smart contracts...");
  exec(`npm run compile`);

  Object.entries(SUBGRAPH_SLUGS).forEach(
    async ([datasourceName, subgraphSlug], index) => {
      try {
        // Define the subgraph dataSource path
        const datasourcePath = `${resolve(
          __dirname,
          "subgraphs",
          datasourceName
        )}`;

        console.log(
          `✨ ### DEPLOYMENT ${index + 1}/${
            Object.keys(SUBGRAPH_SLUGS).length
          }...`
        );

        // Create the graph code generation files
        console.log(
          "📦 ### 1/3 Creating the graph scheme for...",
          datasourceName
        );
        exec(`graph codegen`, datasourcePath);

        // Building the graph scheme
        console.log(
          "📦 ### 2/3 Building the graph scheme for...",
          datasourceName
        );
        exec(`graph build`, datasourcePath);

        console.log(
          "📦 ### 3/3 Build complete, preparing deployment for ...",
          datasourceName
        );

        if (NETWORK === NETWORKS.MAINNET) {
          console.log(
            `
          ==== READY TO DEPLOY SUBGRAPH... ${datasourceName} ====
          ⚠️  IMPORTANT: When prompted, enter a version label for the subgraph!
          `
          );
        }

        // Deploy subgraph <SUBGRAPH_SLUG>
        console.log("🏎  ### Deploying subgraph...");

        if (NETWORK === NETWORKS.MAINNET) {
          exec(
            `graph auth --studio ${process.env.GRAPH_DEPLOYMENT_KEY}`,
            datasourcePath
          );
          exec(`graph deploy --studio ${subgraphSlug}`, datasourcePath);
        } else {
          exec(
            `graph deploy --access-token ${process.env.GRAPH_ACCESS_TOKEN} --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ ${GITHUB_USERNAME}/${subgraphSlug}`,
            datasourcePath
          );
        }

        console.log("🦾 ### Done.");

        // Increment deployment counter
        executedDeployments++;
      } catch (error) {
        console.error(error);
      }
    }
  );

  console.log(
    `${
      executedDeployments === 0 ? "😵" : "🎉"
    } ### ${executedDeployments} Deployment(s) Successful!`
  );
})();
