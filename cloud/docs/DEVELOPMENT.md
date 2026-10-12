# Development and verification

The supplied Sites/Vinext starter owns build and hosting integration. Use the Sites skill helpers for installation, build, source synchronization, and deployment. Keep `.sites-runtime`, `.wrangler`, secrets, and generated output out of Git.

Local D1 migrations: first build to produce `dist/server/wrangler.json`, then apply each pending SQL file in order, once, using:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_careless_stingray.sql
```

The schema is managed by Drizzle. Do not rewrite applied migrations. Local previews never alter hosted data. The private hosting layer is the production authorization boundary; local development must be restricted to a trusted interface. Do not deploy this Worker directly to a publicly accessible endpoint.

Tests exercise financial loss recognition, upfront cost recovery, fee handling, rental-power accounting, downtime costs, invalid algorithm inputs, stale/future data, evidence requirements, stress margins, cash ledger accuracy, date validation, telemetry parsing, and redirect refusal. Production smoke checks should create/delete only temporary scenarios and reject invalid cash entries; never seed artificial cash receipts or fake machine activity into the live dashboard.
