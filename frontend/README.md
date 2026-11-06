# Navapack Finance frontend preview

Standalone React / TypeScript / Vite application with no operational React or Django dependencies. This directory is outside both operational Git repositories.

## Batch 1 — Foundation and Dashboard

Run `npm run dev` here and open http://127.0.0.1:5180/#/batch-1/dashboard. The existing landing page also links to Batch 1. Acknowledging fictional data opens the local preview; this is not authentication and grants no Finance permissions. Refresh or Exit preview clears entry acknowledgement.

Batch 1 includes the Navapack green frame/dark sidebar styling, reusable presentation/state components, four mock summary cards, period selection, cash-flow chart with accessible data table, receivables ageing, attention items and recent sample activity. The scenario selector demonstrates sample, loading, empty, error, unavailable, unassessed setup and denied states. Upcoming screens are disabled; there are no posting, configuration or approval actions.

All amounts, companies and parties are fictional. The sample UGX currency and dates do not configure the client's accounting. No API transport, operational providers, browser token access or persistence is used. Actual Finance entitlement, Django accounting and live Frappe integration remain separate future work.

Tests: `npm test` (14 tests), `npm run build` (TypeScript and production build), and `node scripts/check-batch-one-browser.mjs` (local Edge screenshot/interactions check). No new dependencies. See [Batch 1 report and exact inventory](docs/BATCH-1-IMPLEMENTATION.md) and [browser evidence](docs/batch-1/browser-evidence.json).

The older `/workspace/:section` demonstration remains unchanged and is not evidence that later Batch 1 navigation screens are complete. Concurrent Finance preview work in the operational `frontend/` project is outside this standalone batch and has not been merged or altered here.

## Run

Requires Node 20.19+ (or a Vite-supported newer Node) and npm 10+.

```powershell
cd F:\WORK\ERP\finance\frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5180 and choose **Explore demo workspace**. This is an explicit preview acknowledgement, not login. Refreshing a workspace URL returns to that gate. Hash routing supports static hosting without changing operational rewrites. Production access must remain disabled until SSO and authorization exist.

`npm run build` checks TypeScript then builds `dist/`. `npm test` runs provider, hierarchy, fixture and boundary tests. `npm run preview` serves the build.

All records are fictional and labelled **Demo — sample data**. No backend transport, posting, reconciliation, payments or filings exist. The journal form only validates a local example and does not persist it. Financial report and cash flow fixtures are independent illustrations, not statements generated from a ledger.

The only user-facing login link points to the existing Navapack login. No credentials are requested, read, stored or reused by Finance. The old application's existing separate Finance login remains unchanged pending approval.

See [inspection](docs/INSPECTION.md), [integration proposal](docs/LOGIN-INTEGRATION-PROPOSAL.md), [API architecture](docs/ERPNEXT-ARCHITECTURE.md), and [implementation report](docs/IMPLEMENTATION-REPORT.md).
