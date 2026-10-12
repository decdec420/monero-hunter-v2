# Monero Hunter — Profit Control

The v3 product adds a private browser dashboard for live mining economics, cost-inclusive opportunity screening, recorded cash flow, and read-only XMRig telemetry.

**Open the owner-private dashboard:** https://monero-hunter-profit-control.dedsec1.chatgpt.site

The implementation lives in [`cloud/`](cloud/). See [the product documentation](cloud/README.md) for assumptions, setup, tests, and limitations.

```sh
cd cloud
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

There is no cloud purchase or mining-start executor in this release. A positive model result is a candidate for a measured trial, not proof of income. No wallet, provider account, device, or capital allocation is connected by default. All reported cash is manually entered and must be reconciled against actual receipts and bills.

The root Electron v2 source is retained for history and migration reference. It has known audit findings and should not be used as a production mining controller. Its previous instructions are preserved in [docs/LEGACY_V2.md](docs/LEGACY_V2.md). Use `cloud/` for the active v3 product.
