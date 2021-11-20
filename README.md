# Tribute DAO Framework Subgraph

> Graph definition for the Tribute DAO Framework

## Graph CLI Installation

You need to install Graph CLI with either npm or yarn.

> Note: You need version 0.21.0 or above

```
npm install -g @graphprotocol/graph-cli
```

or

```
yarn global add @graphprotocol/graph-cli
```

## Subgraph Development Setup

In addition to the mandatory core subgraph (which queries the `DaoFactory`, `DaoRegistry`, and `BankExtension` contracts), each adapter and extension contract should have its own subgraph. To create a new subgraph for a new adapter or extension contract, create a new folder in the `subgraphs` directory with the contract name.

Take a look at The Graph's [documentation](https://thegraph.com/docs/developer/create-subgraph-hosted) on how to write a subgraph, also check out the current examples in the subgraphs directory.

## Subgraph Deployment

In the `subgraph-deployer.ts` script, you will need to add the subgraph slug for all the datasources of each adapter and extension subgraph you want to deploy:

```
const SUBGRAPH_SLUGS = {
  /**
   * CORE
   * Mandatory core subgraph (DaoFactory, DaoRegistry, BankExtension)
   */
  Core: "tribute-dao-core-dev",

  /**
   * ADAPTERS
   * Add your adpater subgraphs datasource and subgraph slug
   */
  CouponOnboarding: "tribute-dao-coupon-onboarding-dev",
  ...

  /**
   * EXTENSIONS
   * Add your extension subgraphs datasource and subgraph slug
   */
  NFTExtension: "tribute-dao-nft-extension-dev",
  ...
};
```

In `.env` (create `.env` file if there isn't one already created), add your wallet seed phrase (for the hardhat contract compilation), network, GitHub username, graph access token from your Hosted Service [dashboard](https://thegraph.com/hosted-service/dashboard) and the deployment key from your Subgraph Studio account:

```
# The ethereum network to deploy the subgraph.
NETWORK=...

# Your GitHub username to deploy the subgraph to the hosted service.
GITHUB_USERNAME=...

# The Graph API Access Token that will be used to deploy the Subgraph
# to the hosted service (rinkeby/testnet).
GRAPH_ACCESS_TOKEN=...

# The Graph API Deployment Key that will be used to deploy the Subgraph
# to the decentralized service (mainnet).
GRAPH_DEPLOYMENT_KEY=...

# The wallet mnemonic/seed phrase is a 12 word string which is used to create
# the HD Wallet, and sign transactions on your behalf.
WALLET_SEED_PHRASE=...
```

Using your Tribute DAO contracts deployed from [tribute-contracts](https://github.com/openlawteam/tribute-contracts) to the same network as your subgraphs, copy the `DaoFactory` contract address and block number into the respective `address` and `startBlock` (important: make sure the block number starts from 1 previous block, for example, if the block number is `19`, use `18` as the `startBlock`) for the `DaoFactory` source in `subgraphs/Core/subgraph.yaml`.

If you are deploying other optional subgraphs (e.g., `CouponOnboarding`, `NFTExtension`), you will also need to enter the contract address and block number of the subject contract into the respective `subgraphs/[SLUG]/subgraph.yaml` file.

The `network` in the `subgraphs/[SLUG]/subgraph.yaml` files should be set to the targeted network (e.g., `mainnet`, `rinkeby`).

Then, simply run the following command to deploy the subgraphs:

```
npm run deploy-subgraph
```

_IMPORTANT_: If deploying to `mainnet` the command line will prompt for an input for the `✔ Version Label (e.g. v0.0.1)` for each subgraph. Enter the version and the deployment will resume.

## Local Development Graph Setup

Check out the setup and development guide [here](https://github.com/openlawteam/tribute-subgraph/blob/main/docker/README.md)

## Subgraph Tests

TODO

## Release Tags

For releases, simply run `npm run release` and follow the interactive UI in your console. The release script runs [np](https://github.com/sindresorhus/np). We have initially configured `np` (in `package.json`) to automatically handle only versioning, release drafts, and git tagging. We can enable additional features as needed, such as publishing to npm.
