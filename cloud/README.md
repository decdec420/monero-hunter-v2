# Monero Hunter — Profit Control v3

Private browser dashboard for deciding whether a Monero mining operation can make money **after all costs**. This is the next product direction for [decdec420/monero-hunter-v2](https://github.com/decdec420/monero-hunter-v2), audited at commit `f734015fe4f2fff9b24522cd2603b1b071d3821b`.

v3 replaces the old Electron control surface with a private web dashboard and a read-only XMRig telemetry bridge. It does not install or start a miner, buy cloud capacity, trade crypto, custody coins, or claim to guarantee profits. There is no execution endpoint. The previously hardcoded wallet and static profitability assumptions are not carried forward.

## What works

- Live XMR USD pricing from CoinGecko and Monero network difficulty from XMRig's network API, fetched server-side. Market freshness is validated against upstream timestamps. Cache refresh is at most every two minutes per isolate/request flow; the dashboard polls every 30 seconds. No requests run merely because the page is closed.
- A 24-hour chart of real observations collected since use began; no fabricated historical returns or mock balances.
- Saved owned-machine and cloud-rental scenarios with upfront cost recovery, full costs, fees, uptime, stressed returns, and a maximum acceptable hourly rental rate.
- A candidate gate that requires fresh data (15 minutes), user-confirmed sustained RandomX performance and full costs, plus a 20% margin after revenue falls 25% and costs rise 10%.
- A durable cash ledger of actual fiat receipts and expenses entered by the owner. Integer cents, unique reference numbers, idempotent retries, append-only records, CSV export with spreadsheet formula neutralization. All totals are self-reported; there is no bank, exchange or pool reconciliation yet.
- Read-only telemetry ingestion and a Python agent for existing XMRig installations. Unknown watts and temperature stay null; devices become stale after 90 seconds and are excluded from aggregate hashrate.
- Responsive layout, keyboard-operable dialogs, error states, no overlapping browser poll requests, and visible stale-data states.

## Financial assumptions

Expected gross daily revenue = sustained rx/0 H/s / network H/s × 432 XMR/day × USD/XMR × uptime.

432 XMR/day uses the 0.6 XMR tail-emission baseline and 720 blocks/day; it does not assume transaction-fee windfalls. Pool fees, miner fees, and selling fees reduce revenue multiplicatively. Non-RandomX algorithm-switching hashrates must not be entered into this model.

Owned-machine costs = full-system watts / 1000 × 24 × electricity tariff + monthly overhead / 30. Rental costs = full hourly rental rate × 24 + monthly overhead / 30. Rental electricity already included in the rate is not counted twice; additional power/service charges belong in overhead. Costs persist through downtime. Upfront acquisition/contract cost is spread over the chosen recovery period, without assuming resale value. Taxes, hosting, repairs, and labor are not automatically known: include applicable reserves in overhead and record actual cash costs in the ledger.

The base-case cash-payback calculation uses cash revenue minus operating cost, before amortization; a payback beyond the contract period is explicitly marked. A positive estimate is **not** an authorized deployment. The app's execution state remains disabled even when a scenario qualifies.

## Build and verify

Node.js >=22.13, Python >=3.10. The project uses the supplied Sites/Vinext integration and a pinned pnpm lockfile.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

Use the Sites skill lifecycle helpers for managed hosting. The production app uses a Cloudflare D1 binding named `DB`, declared in `.openai/hosting.json`. Schema migrations are under `drizzle/`; deployment applies them. Never create migration-owned tables during a request. `pnpm db:generate` generates new migrations after schema changes.

The local development server (`pnpm dev`) is for development only. For local D1 migration commands see `docs/DEVELOPMENT.md`. Hosted data and local data are separate.

## Private access boundary — required

This app is deliberately **owner-private**. Sites dispatch authenticates browser and service requests before they reach the Worker. Records are shared within that single private owner's Site. Browser mutations check origin and JSON content type. Do not expose this Worker outside that private boundary or broaden its audience without adding per-user application authorization. These routes are not a public multi-tenant API.

Service ingestion sends a Sites service-access credential as `OAI-Sites-Authorization: Bearer <token>`. Obtain the credential from the Sites integration as the owner. Never put it in a repository, browser bundle, shell history, URL, or logs. A service credential grants private Site access and must be protected accordingly. The optional local XMRig bearer credential is separate.

## Connect an existing miner

The app serves `public/hunter-agent.py` for download. This process reads `http://127.0.0.1:18088/2/summary` and uploads telemetry every 30 seconds. It cannot execute commands or modify the miner. Keep the XMRig API on loopback with restricted access. It refuses redirects to avoid leaking credentials and avoids printing upstream payloads or request headers.

Set `HUNTER_SITE_TOKEN` securely in the agent environment. Set `XMRIG_API_TOKEN` if the local API requires it. Then:

```sh
python3 public/hunter-agent.py --site https://YOUR-PRIVATE-SITE --name my-machine
```

Use `--once` to test a single upload, or `--port` for another loopback API port. Stop the telemetry agent with Ctrl+C. This does not stop your independently running miner. Sensors are not synthesized from CPU load. Whole-system power currently needs a separate measurement and entry into the scenario.

## Product gates before spending

1. Inventory hardware already owned; measure sustained rx/0 hashrate and wall power with explicit consent to run a benchmark.
2. Enter the actual tariff and all recurring/upfront costs. For a rental, verify sustained CPU capacity, mining permission, cancellation, and all fees using the provider's terms.
3. Require fresh data and stressed positive economics. If nothing qualifies, do not spend.
4. Agree an explicit cash budget, maximum loss, time limit, and provider. Only then implement a narrowly scoped executor with hard limits, stale-data shutdown, confirmed cancellation, and credential separation.
5. Run a small timed trial; reconcile independently observable pool payouts, conversion proceeds, and all invoices before extending or scaling.

Success means positive **reconciled net cash over a defined period**, not a green estimate. A second possible business model is charging for monitoring software; that requires real customer validation and is not assumed to generate revenue here.

## Current limitations

No machine or provider is connected by default; no earnings are invented. There is no marketplace crawler, cloud purchase adapter, wallet balance integration, payout reconciliation, autonomous trading, mining control, hardware sensor plugin, or unattended historical collector. The UI’s HOLD decision is advisory and cannot stop an external miner. Provider outages are visible, cached data retains its original timestamp, and stale data cannot qualify a scenario.

The original v2 remains in Git history; it should not be used as a production mining controller. This release intentionally removes its hardcoded payout address, inferred temperatures, and hardcoded XMR price from the active product.

## Sources

- https://www.getmonero.org/get-started/mining/
- https://www.getmonero.org/resources/moneropedia/tail-emission.html
- https://api.xmrig.com/1/network/XMR
- https://xmrig.com/docs/miner/api
- https://docs.coingecko.com/reference/simple-price
