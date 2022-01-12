import path, {resolve} from 'path';
import {execSync} from 'child_process';
import {config as dotenvConfig} from 'dotenv';

dotenvConfig({path: resolve(__dirname, '.env')});

const GRAPH_NODE_TYPE = process.env.GRAPH_NODE_TYPE;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GRAPH_ACCESS_TOKEN = process.env.GRAPH_ACCESS_TOKEN;
const GRAPH_DEPLOYMENT_KEY = process.env.GRAPH_DEPLOYMENT_KEY;

enum GRAPH_NODE {
  LOCAL = 'local',
  HOST = 'host',
  NETWORK = 'network',
}

const SUBGRAPH_SLUGS = {
  /**
   * CORE
   * Mandatory core subgraph (DaoFactory, DaoRegistry, BankExtension)
   */
  Core: 'core-dev',

  /**
   * ADAPTERS
   * Add your adpater subgraphs datasource and subgraph slug
   */
  // CouponOnboarding: 'coupon-onboarding-dev',

  /**
   * EXTENSIONS
   * Add your extension subgraphs datasource and subgraph slug
   */
  // NFTExtension: 'nft-extension-dev',
};

// Execute Child Processes
const srcDir = path.join(__dirname);
export const exec = (cmd: string, cwdDir?: string) => {
  try {
    return execSync(cmd, {cwd: cwdDir ?? srcDir, stdio: 'inherit'});
  } catch (e) {
    throw new Error(`Failed to run command \`${cmd}\``);
  }
};

let executedDeployments: number = 0;

(function () {
  if (!GRAPH_NODE_TYPE) {
    throw new Error('Please set a GRAPH_NODE_TYPE in a .env file');
  }

  if (GRAPH_NODE_TYPE === GRAPH_NODE.HOST) {
    if (!GITHUB_USERNAME) {
      throw new Error('Please set your GITHUB_USERNAME in a .env file');
    }

    if (!GRAPH_ACCESS_TOKEN) {
      throw new Error('Please set your GRAPH_ACCESS_TOKEN in a .env file');
    }
  }

  if (GRAPH_NODE_TYPE === GRAPH_NODE.NETWORK && !GRAPH_DEPLOYMENT_KEY) {
    throw new Error('Please set your GRAPH_DEPLOYMENT_KEY in a .env file');
  }

  // Compile the solidity contracts
  console.log('⛓  ### Compiling the smart contracts...');
  exec(`npm run compile`);

  Object.entries(SUBGRAPH_SLUGS).forEach(
    async ([datasourceName, subgraphSlug], index) => {
      try {
        // Display deployment index
        console.log(
          `✨ ### DEPLOYMENT ${index + 1}/${
            Object.keys(SUBGRAPH_SLUGS).length
          }...`
        );
        // Define the subgraph dataSource path
        const datasourcePath = `${resolve(
          __dirname,
          'subgraphs',
          datasourceName
        )}`;

        // 📦 ### 1/2 Create the graph code generation files
        taskGraphCodegen(datasourceName, datasourcePath);

        // 📦 ### 2/2 Building the graph scheme
        taskGraphBuild(datasourceName, datasourcePath);

        // 🏎  ### Deploy subgraph <SUBGRAPH_SLUG>
        switch (GRAPH_NODE_TYPE) {
          case GRAPH_NODE.NETWORK:
            taskDeployToNetwork(datasourceName, datasourcePath, subgraphSlug);
            break;
          case GRAPH_NODE.HOST:
            taskDeployToHosted(datasourcePath, subgraphSlug);
            break;
          case GRAPH_NODE.LOCAL:
          default:
            taskDeployToLocal(datasourcePath, subgraphSlug);
        }

        console.log('🦾 ### Done.');

        // Increment deployment counter
        executedDeployments++;
      } catch (error) {
        console.error(error);
      }
    }
  );

  console.log(
    `${
      executedDeployments === 0 ? '😵' : '🎉'
    } ### ${executedDeployments} Deployment(s) Successful!`
  );
})();

/**
 * taskGraphCodegen()
 *
 * Runs the code generation
 * @param datasourceName
 * @param datasourcePath
 */
function taskGraphCodegen(datasourceName: string, datasourcePath: string) {
  // Create the graph code generation files
  console.log('📦 ### 1/2 Creating the graph scheme for...', datasourceName);
  exec(`graph codegen`, datasourcePath);
}

/**
 * taskGraphBuild()
 *
 * Builds the graph scheme
 * @param datasourceName
 * @param datasourcePath
 */
function taskGraphBuild(datasourceName: string, datasourcePath: string) {
  // Building the graph scheme
  console.log('📦 ### 2/2 Building the graph scheme for...', datasourceName);
  exec(`graph build`, datasourcePath);
}

/**
 * taskDeployToNetwork()
 *
 * Deploys subgraph to The Graph decentralized service
 * @param datasourceName
 * @param datasourcePath
 * @param subgraphSlug
 */
function taskDeployToNetwork(
  datasourceName: string,
  datasourcePath: string,
  subgraphSlug: string
) {
  console.log(
    `
    ==== READY TO DEPLOY SUBGRAPH... ${datasourceName} ====
    ⚠️  IMPORTANT: When prompted, enter a version label for the subgraph!
    `
  );

  // Deploy subgraph <SUBGRAPH_SLUG>
  console.log('🏎  ### Deploying subgraph...');

  exec(`graph auth --studio ${GRAPH_DEPLOYMENT_KEY}`, datasourcePath);
  exec(`graph deploy --studio ${subgraphSlug}`, datasourcePath);
}

/**
 * taskDeployToHosted()
 *
 * Deploys the subgraph to The Graph hosted service
 * @param datasourcePath
 * @param subgraphSlug
 */
function taskDeployToHosted(datasourcePath: string, subgraphSlug: string) {
  exec(
    `graph deploy --access-token ${GRAPH_ACCESS_TOKEN} --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ ${GITHUB_USERNAME}/${subgraphSlug}`,
    datasourcePath
  );
}

/**
 * taskDeployToLocal()
 *
 * Allocates the subgraph name in the Graph Node and deploys the subgraphs to your local Graph Node
 * @param datasourcePath
 * @param subgraphSlug
 */
function taskDeployToLocal(datasourcePath: string, subgraphSlug: string) {
  exec(
    `graph create tribute/${subgraphSlug} --node http://127.0.0.1:8020`,
    datasourcePath
  );
  exec(
    `graph deploy tribute/${subgraphSlug} --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020`,
    datasourcePath
  );
}
