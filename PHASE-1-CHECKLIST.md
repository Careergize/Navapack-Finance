# Phase 1 — approval and acceptance checklist

Status: **not implemented**. Target: separate Finance login, read-only native Chart of Accounts and native General Ledger in the existing React design system. Operational synchronization, migration of existing balances and new financial posting screens are excluded.

## Before starting

- [ ] Approve the Phase 0 plan, `/finance/erpnext/*` coexistence routes, same-origin gateway and v16/MariaDB environment.
- [ ] Confirm repository ownership: local frontend/backend Git roots disagree with their monorepo documentation; preserve current sales modifications and untracked files.
- [ ] Identify Finance owner, permitted legal entities, test users, role matrix and whether an existing Django Book is in production use.
- [ ] Select tested Frappe/ERPNext v16 patch pair, Bench release and dependencies; record immutable versions and license/security review.
- [ ] Confirm WSL distro, dedicated service ports and resources without disturbing current Django/Redis/database services.
- [ ] Confirm deployment control for proxy routing, cookies, TLS and private-file handling; feature flag defaults off until acceptance.

## Environment and custom application

- [ ] Follow the approval-gated setup runbook on an isolated WSL Linux filesystem; no reuse of Django virtualenv/database.
- [ ] Create dedicated site, install ERPNext and generated `navapack_finance`; leave both upstream sources unchanged.
- [ ] Implement minimal role/capability/company bootstrap and native CSRF retrieval; no accounting engine or ledger DocTypes.
- [ ] Restrict fixture export to named custom roles/permissions; keep users, companies, secrets and private files out of Git.
- [ ] Provision test identities with one permitted company, a second forbidden company, read-only roles, disabled identity and audited admin.
- [ ] Configure only test-company data in Desk; seed a known balanced native journal for GL verification using native submission, not React/API bypass.
- [ ] Create and restore a test-site backup to prove code/data compatibility; do not use production records or source replay.

## Frontend and gateway

- [ ] Split the existing operations route/provider stack intact and add the lazy Finance branch before operations providers.
- [ ] Preserve existing `/finance`, `/finance/login`, `/finance/quality`, `/` role behavior and all operations URLs.
- [ ] Add separate Finance API client/context/types and session guards; never import operations Axios, token storage or demo-auth helpers.
- [ ] Reuse established CSS/tokens/branding/form primitives; dedicated FinanceShell does not import operations contexts.
- [ ] Add login, native MFA challenge handling, bootstrap, expiry/retry, logout and permitted-company selection.
- [ ] Configure gateway prefix/site routing, cookie-path rewriting/deletion, CSRF and Origin checks, rate limits, no-store headers and RPC/resource allowlist.
- [ ] COA: company-scoped full paginated tree, search, disabled/group/leaf distinction, correct parents, no mutation actions.
- [ ] GL: company/date/account filters, native opening/movement/closing rows and voucher links, precise currency display, no browser-built official balances.
- [ ] Handle loading, denied, empty, expired session, unavailable server and report worker errors distinctly; no financial demo fallbacks.

## Required verification

### Session and isolation

- [ ] Finance works with Django unreachable and no Django session. Finance navigation sends no operations bootstrap calls.
- [ ] Operations login and Finance login can coexist with different users. No JWT reaches Finance; no Finance cookie is sent to Django.
- [ ] Logging out of Finance clears/revokes only Finance session and cached financial data. Operations logout leaves Finance independent.
- [ ] Refresh/deep link/back/forward and failed login preserve safe return paths without open redirects. Existing unsaved-save warning behavior is preserved.
- [ ] Native MFA wrong/expired challenge and session revocation behave correctly in the actual pinned Frappe release.

### Permissions and security

- [ ] Direct API attempts as Guest/disabled/revoked users fail; another company's accounts and GL fail despite forged filters.
- [ ] Viewer cannot create/write/submit/cancel/delete; UI hiding is independently backed by server negative tests.
- [ ] Report permission grants work for custom Finance roles without assigning broad Accounts Manager/System Manager privileges.
- [ ] Invalid/missing CSRF, forged Origin, login throttling and cache isolation tests pass; cookies use correct host/path and production attributes.
- [ ] Private files remain permission protected; URL/header manipulation cannot select another Frappe site or upstream.
- [ ] Browser bundles, logs, fixtures and repository diff contain no credentials, session IDs or API secrets.

### Accounting/UI correctness

- [ ] React COA matches native company tree across multiple pages, disabled accounts and empty/search states.
- [ ] React GL matches native Desk under identical filters/user: opening balances, debits/credits, closing balances, voucher references and dates.
- [ ] Validate date edges, account/dimension/company changes, currency/precision, big values, no transactions, forbidden voucher and slow/prepared report cases.
- [ ] Keyboard/form labels/focus, narrow-screen navigation/table overflow, familiar typography/colors and separate Finance identity are verified in-browser.
- [ ] Native ledger tables receive no direct writes from the browser or custom bootstrap methods.

### Existing application regression commands

Run from `F:/WORK/ERP/frontend` after approved implementation. No packages were installed or checks executed as part of this audit.

```powershell
node ./node_modules/typescript/bin/tsc -b --pretty false
npm run build
node scripts/check-auth.mjs
node scripts/check-led-finance.mjs
node scripts/check-shared-entries.mjs
node scripts/check-registers.mjs
node scripts/check-sales-management.mjs
node scripts/check-sales-api.mjs
node scripts/check-sales-fulfillment.mjs
node scripts/check-integrated-operations.mjs
```

These filenames exist in the current checkout; review each script's environment assumptions before running. Existing Finance route assertions may need carefully updated coverage for the added branch while retaining legacy expectations. An existing script pass does not prove live Frappe behavior. Add the proposed Finance behavior tests with the approved runner and real-browser gateway tests; avoid tests that only mirror JSX strings.

On a disposable Finance test site, run custom app permission/session/native-contract tests with the chosen v16 test runner (confirm `bench run-tests --help`; never use production). Phase 1 does not need Django migrations or new APIs. If provider/route extraction unexpectedly requires operations backend changes, stop and reassess scope rather than widening it silently.

## Exit and rollback

- [ ] All Phase 1 gates have captured evidence (versions, commands/outcomes, screenshots, native GL comparison, security cases and restore result).
- [ ] No existing operations or legacy accounting behavior changed; feature flag off restores the original user journey.
- [ ] Finance failure leaves operations usable; rollback removes Finance route/proxy exposure and restores matched deployment artifacts without deleting accounting history.
- [ ] Finance owner accepts native COA/GL accuracy and role boundaries. No production fiscal invoicing, integration, migration or legacy posting freeze is implied.
- [ ] Only after acceptance, plan Phase 2 foundations and separately approve any financial writes.
