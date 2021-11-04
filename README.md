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

Each adapter, and extension contract should have it's own subgraph. To create a new subgraph for a new adapter or extension contract, create a new folder in the `subgraphs` directory with the contract name. Take a look at The Graph's [documentation](https://thegraph.com/docs/developer/create-subgraph-hosted) on how to create a subgraph, also check out the current examples in the subgraphs directory.

## Subgraph Deployment

In the `subgraph-deployer.ts` script, you will need to add the subgraph slug for all the datasources of each adapter and extension subgraph you want to deploy:

```
const SUBGRAPH_SLUGS = {
  /**
   * CORE
   * Mandatory core subgraphs
   */
  DaoRegistry: "tribute-dao-registry-dev",
  BankExtension: "tribute-dao-bank-extension-dev",

  /**
   * ADAPTERS
   * Add your adpater subgraphs datasource and subgraph slug
   */
  Onboarding: "tribute-dao-onboarding-dev",
  ...

  /**
   * EXTENSIONS
   * Add your extension subgraphs datasource and subgraph slug
   */
  NFTExtension: "tribute-dao-nft-extension-dev",
  ...
};
```

In `.env` (create `.env` file if there isn't one already created), add your seed phrase (for the hardhat contract compilation) and the deployment key from your Subgraph Studio account:

```
GRAPH_DEPLOYMENT_KEY=...
TRUFFLE_MNEMONIC=...
```

Then, simply run the following command to deploy the subgraphs:

```
npm run deploy-subgraph
```

### Local Development Graph Setup

Check out the setup guide [here](https://github.com/openlawteam/tribute-subgraph/blob/main/docker/README.md)

## Subgraph Tests

TODO
