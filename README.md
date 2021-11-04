# Tribute DAO Framework Subgraph

> Graph definition for the Tribute DAO Framework

## Graph CLI Installation

You need to install Graph CLI with either npm or yarn.

> Note: You need version 0.21.0 or above

NPM install:

```
npm install -g @graphprotocol/graph-cli
```

Yarn install:

```
yarn global add @graphprotocol/graph-cli
```

## Subgraph Deployment Setup

In the `subgraph-deployer.ts` script, you will need to add the subgraph slug for all the datasources of each adapter/extension subgraph you want to deploy:

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

In `.env` (create `.env` file if necessary), add the deployment key from your Subgraph Studio account:

```
GRAPH_DEPLOYMENT_KEY=...
```

Then, simply run the following command to deploy the subgraphs:

```
npm run deploy-subgraph
```

## Subgraph Tests

TODO
