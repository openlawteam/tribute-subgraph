# Graph Node Docker Image

Preconfigured Docker image for running a Graph Node.

## Usage

In the `subgraph-deployer.ts` script, you will need to add the subgraph slug for all the datasources of each adapter and extension subgraph you want to deploy:

```
const SUBGRAPH_SLUGS = {
  /**
   * CORE
   * Mandatory core subgraph (DaoFactory, DaoRegistry, BankExtension)
   */
  Core: "core-dev",

  /**
   * ADAPTERS
   * Add your adpater subgraphs datasource and subgraph slug
   */
  CouponOnboarding: "coupon-onboarding-dev",
  ...

  /**
   * EXTENSIONS
   * Add your extension subgraphs datasource and subgraph slug
   */
  NFTExtension: "nft-extension-dev",
  ...
};
```

Start ganache with `ganache-cli --host 0.0.0.0 --port 7545 --networkId 1337 --chainId 1337 --blockTime 3 --mnemonic "twelve words including quotes"` in one terminal window.

> Note that -h 0.0.0.0 is necessary for Ganache to be accessible from within Docker and from other machines. By default, Ganache only binds to 127.0.0.1, which can only be accessed from the host machine that Ganache runs on. [The Graph]

[the graph]: https://thegraph.com/docs/quick-start#1.-set-up-ganache-cli

Using your Tribute DAO contracts deployed from [tribute-contracts](https://github.com/openlawteam/tribute-contracts) to your running ganache network, copy the `DaoFactory` contract address and block number into the respective `address` and `startBlock` (important: make sure the block number starts from 1 previous block, for example, if the block number is `19`, use `18` as the `startBlock`) for the `DaoFactory` source in `subgraphs/Core/subgraph.yaml`.

If you are deploying other optional subgraphs (e.g., `CouponOnboarding`, `NFTExtension`), you will also need to enter the contract address and block number of the subject contract into the respective `subgraphs/[SLUG]/subgraph.yaml` file.

The `network` in the `subgraphs/[SLUG]/subgraph.yaml` files should be set to `mainnet`.

In a new terminal window, `cd docker/` and `docker-compose up`.

This will start IPFS, Postgres and Graph Node in Docker and create persistent
data directories for IPFS and Postgres in `./data/ipfs` and `./data/postgres`. You
can access these via:

- Graph Node:
  - GraphiQL: `http://localhost:8000/`
  - HTTP: `http://localhost:8000/subgraphs/name/<subgraph-name>`
  - WebSockets: `ws://localhost:8001/subgraphs/name/<subgraph-name>`
  - Admin: `http://localhost:8020/`
- IPFS:
  - `127.0.0.1:5001` or `/ip4/127.0.0.1/tcp/5001`
- Postgres:
  - `postgresql://graph-node:let-me-in@localhost:5432/graph-node`

Once this is up and running, you can create and deploy your subgraph to the running Graph Node. To do this, in another terminal window from the project root directory:

- `npm ci` to install dependencies
- set the `NETWORK` variable in `.env` to `ganache`:

```
NETWORK=ganache
```

Then, run the subgraph deployer `npm run deploy-subgraph` to allocate the subgraph names in the Graph Node and deploy the subgraphs to your local Graph Node.
