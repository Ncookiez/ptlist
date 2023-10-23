# PT List Cloudflare Worker

A Cloudflare worker to create and cache PT vault lists based on where a wallet has deposited funds.

### Endpoints

- `/<walletAddress>` - Returns a new or cached vault list for the prize vaults this wallet is deposited into.

### Setup

Fill in `wrangler.toml` with your data, and run either `wrangler dev` or `wrangler deploy` to deploy locally or on your account.
