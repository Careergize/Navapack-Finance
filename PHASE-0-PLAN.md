# Finance — repository audit and implementation plan

## 1. Scope, evidence and confidence

Read-only source audit performed on 4 November 2026. Only deliverable documents in `finance/` were added. No application code, Git configuration, package lockfiles, databases or environment files were changed. Existing `.env` contents and database records were not opened. No remote Navapack service was contacted. No installation, migration, test that creates a database, build or deployment was run.

**Verified** below means observed in local source or identified official upstream documentation. It does not establish that the checked-out implementation is deployed, configured or financially reconciled. **Proposed** means a design for approval. **Unresolved** means a business, tax or runtime check is still required.

Primary inspected files:

- Frontend: `AGENTS.md`, `README.md`, `package.json`, `vite.config.ts`, `vercel.json`, `tailwind.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`.
- Frontend authentication/layout: `src/context/AuthContext.tsx`, `src/lib/authSession.ts`, `src/lib/api.ts`, `src/pages/Login.tsx`, `src/components/layout/AppShell.tsx`.
- Finance/UI boundaries: `src/pages/Accounting.tsx`, `src/pages/FinanceDashboard.tsx`, `src/lib/led.ts`, `src/components/ui/{Card,SearchSelect,ConfirmationDialog}.tsx`, login `Button.tsx` and `TextField.tsx`, `src/context/SharedEntriesContext.tsx`.
- Backend: `README.md`, `requirements.txt`, `config/{settings,urls}.py`, `accounts/{models,views}.py`, `erp/{models,sales_models,operational_records,shared_entries,purchases,grn,sales_urls}.py`, `inventory/{models,urls}.py`, `accounting/{README,models,views,urls,integration,signals,apps}.py`.

Scope excluded alternate backend copies, virtual environments, generated frontend distribution assets and private client reference contents. The active sibling folders selected were `frontend/` and `backend/`, based on actual source and routes. Their remote deployment status was not inferred.

## 2. Current repository architecture — verified findings

### 2.1 Workspace and repository ownership

The workspace contains `frontend/`, `backend/`, `finance/`, `Gap-Analysis/`, `client-reference/`, historical audit folders, alternate `backend-task03a-*` copies and Python environments. The `finance/` folder existed and was empty before this audit.

`git rev-parse --show-toplevel` returns `F:/WORK/ERP/frontend` and `F:/WORK/ERP/backend`, respectively. Both contain their own `.git`. This contradicts frontend instructions/README statements that the Git root has moved to the parent. Treat them as separate checkouts until repository ownership is confirmed; do not initialize a parent repository or restructure them as part of Finance.

The frontend already has modified sales files and untracked sales API work. Backend status was clean at inspection. Preserve all existing work. Parent `AGENTS.md` was absent; the frontend-specific guidance was read. No applicable instruction requested subagent delegation.

### 2.2 Frontend structure and dependencies

```text
frontend/
  package.json, package-lock.json, vite.config.ts, vercel.json
  tailwind.config.ts, postcss.config.js, tsconfig.json
  public/assets/                         # current brand assets
  scripts/                               # focused Node regression checks
  docs/                                  # business/API/status documentation
  src/
    main.tsx, App.tsx, index.css
    components/
      layout/AppShell.tsx
      login/                             # branding, inputs, button, backgrounds
      ui/                                # Card, SearchSelect, dialogs, badges
    context/                             # Auth and operations domain providers
    lib/                                 # API, calculations, stores, references
    pages/
      Login.tsx, Dashboard.tsx, Accounting.tsx, FinanceDashboard.tsx
      Sales/, SalesOrders/, JobCards/, Stocks/, RawMaterials/
      Quality/, Quotations/, Costing/, Masters/, Registers/
      Recycling/, Consumables/, Spares/, TrackTrace/
    types/index.ts
```

Manifest: React 18.3, TypeScript 5.6 range, React Router 7.18 range, Axios 1.7 range, Lucide, Vite 8.3 range, Tailwind 4.3 range. These are declared version ranges, not a claim that the lockfile or installed runtime has been independently validated. Node minimum is 20.19 and npm minimum 10. Scripts are `dev`, `build`, `preview`, `cap:sync`; there is no `test`, `lint` or dedicated `typecheck` script. Build invokes TypeScript project build then Vite. Capacitor packages exist; a working mobile Finance deployment was not verified.

`main.tsx` mounts React StrictMode, BrowserRouter and App, importing global CSS. `@` maps to `src`; Vite uses port 5173 and relative asset base `./`. No API proxy currently exists. Vercel configuration rewrites every path to `index.html`.

### 2.3 Routes, provider graph and authorization

`App.tsx` contains one route tree. Public `/login` and `/finance/login` both use `Login`; the latter only passes `finance=true`. Authenticated routes share `RequireAuth` and `AppShell`.

Existing Finance routes:

- `/finance` → `AccountingPage`, a live Django accounting client.
- `/` → `AccountingPage` for `accounts`, otherwise a role dashboard.
- `/finance/quality` → `FinanceQualityOverview`, only for the operations `accounts` role.

Other routes cover Sales workspace/ledger/returns/credits, Sales Orders, purchase orders, GRNs, production models/processes, Job Cards, Stock, Raw Materials, procurement, spares/consumables, Recycling, Costing, Masters, Activity History, Track & Trace, QC and Quotations. Preserve their route parameters, nested layouts and guards.

All routes currently sit beneath AuthProvider and the operations provider stack: SharedEntries, SalesOrders, Models, Commercial, Quality, Inventory, Costing, Quotations, JobCards and Invoices. Consequently, merely placing a Finance component on a new route inside this tree would still initialize operations contexts. SharedEntries itself consumes `useAuth` and provides persistence/save state. Finance isolation requires splitting provider ownership at the route boundary, not just adding a sidebar entry.

`RequireAuth` restores the Django session and has special QC route restrictions. It is not a complete per-route role authorization policy. AppShell filters navigation by role, with a separate accounts menu; hiding navigation is not authorization. Existing accounts navigation includes routes whose target pages may impose their own rules. The new Finance implementation needs explicit route capabilities and backend enforcement.

### 2.4 Existing authentication and API

Operations login sends username/password to `/api/auth/login/`, obtains SimpleJWT tokens, and gets profile data from `/api/auth/me/`. The frontend accepts a fixed operations role set. `finance=true` still authenticates to Django and then accepts only `accounts`; it is not a separate identity domain.

`authSession.ts` stores access/refresh tokens in sessionStorage or localStorage depending on Remember me. Axios attaches `Bearer navapack_access`, retries eligible 401s through a shared refresh promise and clears session on rejected refresh. Mock login is an explicit `VITE_ENABLE_MOCK_LOGIN` switch and supplies browser-only demo identities. The new Finance session must not use these stores, events, demo state or interceptors.

`lib/api.ts` reads public `VITE_API_BASE_URL` and otherwise defaults to a hardcoded remote HTTPS IP URL. Do not use that Axios instance for Frappe. Do not modify the existing base URL to introduce Finance. No secret belongs in a Vite variable.

### 2.5 Design system and safe reuse

Tailwind defines navy, blue, teal, green, lime, ink and surface tokens, Inter/system typography and `rounded-card`. Global CSS controls action sizing, sidebar navigation and form presentation. AppShell uses a green background, pale content shell, dark sidebar and `/assets/Nava-logo.png`.

Reuse global CSS, tokens, logo, Lucide icons, `Card`, `SearchSelect`, `StatusBadge`, `ConfirmationDialog`, and login branding/input/button components where suitable. `AppShell` itself depends on operations `useAuth`, pending shared-entry saves and QC/Sales navigation; importing it into Finance would couple identities and providers. Initially reproduce its visual structure in a dedicated `FinanceShell` using the same tokens/classes. Extract a shared presentational frame only as a later, separately tested refactor.

`Accounting.tsx` has a local generic table and Django-specific report/document contracts. These are not a reusable Frappe API layer. `FinanceDashboard.tsx` is a QC/production summary consuming operations contexts; it is not a native accounting dashboard.

### 2.6 Django boundaries

The active requirements pin Django 5.2.18, DRF 3.16.1, SimpleJWT 5.5.1, django-cors-headers, psycopg, reportlab and related utilities. Current `settings.py` selects SQLite (`db.sqlite3`); PostgreSQL configuration is commented out. PostgreSQL is a target, not verified current behavior. Django defaults to authenticated DRF requests, JWT, pagination, and throttling. CORS allows specific localhost frontend origins.

Custom `accounts.User` holds both legacy `role` and `assigned_role`; `effective_role` rejects inactive assigned roles. Django identities and permissions remain operations-owned.

Important discovery: `accounting` is installed with `AccountingConfig.ready()` loading signals. It already contains Book, Account, Party, Document, DocumentLine, JournalLine, Allocation, StockValue, ValueMovement and PostingEvent. It posts invoices, allocations, reversals and inventory value movements and exposes reports. Source inspection confirms integration calls from shared entries, purchases and GRNs, plus a `RawMovement` post-save signal. The queue is gated by presence of a Book, uses stable source keys and retains errors. This is existing custom accounting logic, not an empty Finance placeholder.

`accounting/views.py` permits Admin/Accounts writes, Admin setup/period controls, and Admin/Accounts/Project Manager/Production Manager reads, with active-role checks. Its business behavior must remain untouched during Phase 1.

## 3. Safest frontend insertion — proposed

Reserve **`/finance/erpnext/*`** for the new application during coexistence:

- `/finance/erpnext/login`: separate Frappe login.
- `/finance/erpnext`: new Finance landing page.
- `/finance/erpnext/chart-of-accounts` and `/finance/erpnext/general-ledger`: first native screens.

Keep `/finance`, `/finance/login`, `/finance/quality` and the accounts home route unchanged. Show the new destination as “Finance (ERPNext)” with explicit separate sign-in. A later approved cutover can redirect `/finance/login` and `/finance`; no silent route reassignment now.

In `App.tsx`, select the Finance branch before mounting operations providers. Put the current provider graph and existing route tree into an OperationsApp component without changing their internal order or behavior. Top-level routes become `/finance/erpnext/*` → lazy Finance entry and `/*` → OperationsApp. BrowserRouter stays in `main.tsx`. The Finance entry owns FinanceAuthProvider, guards and FinanceShell. Lazy loading plus an error boundary keeps Finance failures isolated.

This gives one existing React build and design system with separate route/provider ownership. It does not require a second React project or Frappe Desk redesign. Unsaved operations state must retain its existing warning on navigation; verify full navigation and back/forward behavior when switching branches.

### Proposed frontend tree

```text
frontend/src/
  App.tsx                               # route dispatch only
  app/OperationsApp.tsx                  # existing app/provider graph moved intact
  finance/
    FinanceApp.tsx
    routes.tsx
    config.ts
    types.ts
    auth/
      FinanceAuthContext.tsx
      RequireFinanceAuth.tsx
      RequireFinancePermission.tsx
      capabilities.ts
    api/
      client.ts
      session.ts
      accounts.ts
      reports.ts
      contracts.ts
    layout/
      FinanceShell.tsx
      FinanceNavigation.tsx
    components/
      FinanceErrorBoundary.tsx
      CompanySelector.tsx
      FinanceTable.tsx
      DateRangeFilter.tsx
      Money.tsx
    pages/
      FinanceLogin.tsx
      FinanceHome.tsx
      ChartOfAccounts.tsx
      GeneralLedger.tsx
      Forbidden.tsx
    tests/
      session.test.tsx
      permissions.test.tsx
      accounts.test.tsx
      general-ledger.test.tsx
      isolation.test.tsx
```

Do not create empty future module folders now. Add later pages in the module catalogue as their phases begin. `finance/` at workspace root remains the planning/backend infrastructure home; frontend source stays inside the actual Vite `src` tree so branding, aliases, Tailwind scanning and build behavior remain consistent.

### File-by-file change plan

**Phase 1 modifications** (all proposed):

- `frontend/src/App.tsx`: dispatch route branches and lazy loading; remove no existing route behavior.
- `frontend/src/app/OperationsApp.tsx` (new): move current route/providers intact; keep operations RequireAuth and QC behavior.
- `frontend/src/components/layout/AppShell.tsx`: add one clearly labelled link to `/finance/erpnext/login`; do not remap existing Finance links. Show link according to product choice, but never infer Frappe permission from a Django role.
- `frontend/vite.config.ts`: local Finance gateway proxy only, preserving React plugin, alias, port and relative base. No Django proxy/base changes.
- `frontend/.env.example`: document only public Finance path/feature flag; no key, password or private host. Feature flag defaults off until acceptance.
- `frontend/vercel.json`: only if Vercel remains frontend host, add the reviewed Finance API reverse-proxy rule before SPA fallback. Actual hostname is deployment configuration, not guessed here. Alternative: external same-origin edge routes Finance API while retaining current static host.
- `frontend/package.json` and lockfile: only if approved test tooling is needed; inspect existing local tools first, then add a coherent test runner/browser harness. No runtime state/UI dependency is required merely for Phase 1.
- `frontend/docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_STATUS.md`, `docs/BACKEND_TODO.md`, `docs/CHANGELOG.md`: update affected boundaries after implementation and validation, preserving current unrelated changes.

**New Phase 1 files**, purpose per file:

- `FinanceApp.tsx`: provider lifecycle, boundary and loading state; `routes.tsx`: public login plus guarded children and not-found route.
- `config.ts`: same-origin API base and nonsecret feature switch; `types.ts`: FinanceUser, company, decimal-string and account/report types independent of operations Role.
- `auth/FinanceAuthContext.tsx`: bootstrap, login challenge, expiry, logout, company selection, request cancellation and in-memory profile; no persistent browser credential.
- `auth/RequireFinanceAuth.tsx`: distinguish loading, anonymous, denied and backend-unavailable; preserve safe return path.
- `auth/RequireFinancePermission.tsx`: route capability checks; `auth/capabilities.ts`: UI capability names, never authoritative grants.
- `api/client.ts`: separate fetch/Axios instance with credentials, CSRF and normalized errors, no operations Authorization header; `api/contracts.ts`: Frappe envelopes, schema validation and error types.
- `api/session.ts`: native login/logout plus proposed bootstrap/CSRF methods; `api/accounts.ts`: company-scoped paginated Account reads; `api/reports.ts`: allowlisted native report invocation and prepared-report handling.
- `layout/FinanceShell.tsx`: familiar responsive shell; `layout/FinanceNavigation.tsx`: capability-based links with distinct Finance sign-out and identity.
- `components/FinanceErrorBoundary.tsx`: isolate render failures; `CompanySelector.tsx`: server-permitted companies only; `FinanceTable.tsx`: accessible stable columns, native row identifiers and controlled sorting; `DateRangeFilter.tsx`: explicit posting dates; `Money.tsx`: display decimal strings using account/company currency and configured precision.
- `pages/FinanceLogin.tsx`: reuse branding/form primitives, genuine Frappe sign-in and MFA states; `FinanceHome.tsx`: session/company summary and links, no fabricated totals.
- `pages/ChartOfAccounts.tsx`: read-only account tree/search/filter; `pages/GeneralLedger.tsx`: report filters, opening/movement/closing rows and native voucher drilldown; `pages/Forbidden.tsx`: denied state without leaking data.
- `tests/session.test.tsx`, `permissions.test.tsx`, `accounts.test.tsx`, `general-ledger.test.tsx`, `isolation.test.tsx`: meaningful behavior checks listed in the test plan. Exact runner chosen during Phase 1 preparation.

**Intentionally unchanged**: operations AuthContext, authSession, api.ts, Login, AccountingPage, FinanceQualityOverview, shared Role union, main.tsx, global CSS/Tailwind theme, existing page/domain logic. Do not replace their endpoints or import Frappe types into operations models.

## 4. Existing Django contracts to preserve

No Django endpoints or model changes are needed for Finance login, Account tree or General Ledger.

Preserve these operational models and their existing identifiers, validation and evidence:

- `accounts.User`, `Role`, RoleCode; all operations login/management behavior.
- `erp.Customer`, Supplier, Product, Unit, SalesOrder/SalesOrderLine, JobCard, PurchaseOrder/PurchaseOrderLine, FinishedStockItem, GoodsReceivedNote/GoodsReceivedLine.
- ProductionMachine, ProductionProcess, ProductionModelRevision, WorkflowOrder, WorkflowJob and their revisions; ContributorEvidence, ApprovalDecision and immutable control evidence.
- SharedEntry, EntryRevision, CommandReceipt and shared-record validation; SalesDocument, SalesReturn, SalesCreditNote and SalesReturnInspection.
- `inventory.RawMaterial`, RawMovement, ProcurementPlan, ProcurementDelivery, ProcurementPlanRevision; catalogue/spares/consumables and opening approvals.
- Existing quotation models/APIs and all invoice/dispatch/quality/job source snapshots.
- Entire existing `accounting` schema, services, reports, queue, signals and historical journal evidence during coexistence. No deletion or migration into ERPNext merely because a Finance UI exists.

Preserve the `/api/auth/{login,refresh,logout,me}/`, `/api/users/`, `/api/roles/`, master/customer/supplier/product/unit routes, `/api/production-workflow/*`, `/api/quotations/`, `/api/quotation-drafts/`, `/api/sales/*`, `/api/sales-orders/`, `/api/job-cards/`, `/api/purchase-orders/`, `/api/goods-received-notes/`, `/api/raw-inventory/*`, `/api/procurement-plans/*`, `/api/finished-stock/`, `/api/shared-entries/*`, `/api/shared-entry-commands/`, `/api/management/activity/`, recycling/costing and catalogue routes.

Keep all `/api/accounting/` endpoints unchanged: setup, masters, commands, reports, close-period, posting-queue, import-parties, purchase-bills, capture-sources, tax-mapping. They belong to the existing ledger. They must not become proxies to ERPNext.

Future adapter inputs should use authoritative saved records: stable party/item/UOM IDs, accepted invoices and commercial snapshots, confirmed dispatches and returns, accepted GRNs, raw movements, approved manufacturing consumption/completion and actual cost evidence. A purchase order alone is not a payable; a quotation/order alone is not revenue; a frontend save/fallback alone is not a posted event. New SalesReturn/CreditNote source services explicitly do not themselves mutate accounting balances; verify finalized statuses and authority before selecting integration triggers.

## 5. Release, database and environment recommendation

**Proposed baseline:** matching stable `version-16` Frappe and ERPNext, pinned to tested release tags/commit SHAs at implementation. Avoid `develop`, beta and mismatched majors. Official support plans list v16 through end-2029 and v15 through end-2027 (planned dates, not service guarantees). This favors v16 for a new application. [Official support policy](https://github.com/frappe/erpnext/wiki/Supported-Versions).

The current installation guide specifies Ubuntu 24.04+/Debian 13+, Python 3.14, Node 24, MariaDB 11.8, Redis/Valkey 6+, Yarn 1.22+ and pip 25.3+ for v16. It supports WSL for Windows users and now documents Chromium PDF generation. Frappe's v16 Python metadata limits Python to `>=3.14,<3.15`; do not reuse Django's environment. [Installation](https://docs.frappe.io/framework/user/en/installation), [v16 package metadata](https://raw.githubusercontent.com/frappe/frappe/version-16/pyproject.toml).

Use MariaDB 11.8 for ERPNext, isolated from the operations PostgreSQL target. Framework-level PostgreSQL support is not evidence of complete ERPNext accounting compatibility. No shared database, cross-database foreign keys or direct Django table access by Frappe. Do not migrate the current operations SQLite database as a Finance prerequisite.

Choose exact patches at setup time, record Frappe, ERPNext, Bench, Python, Node, MariaDB, Redis and container digests in a manifest, and run the contract/upgrade suite. This audit does not claim a pair of untested patch versions is compatible simply because both carry v16. Rollbacks require a tested database backup plus matching code/images; reverting Git alone is insufficient after migrations.

**Development**: dedicated WSL2 Ubuntu instance/services, Linux filesystem Bench under `~/navapack-finance/bench`, dedicated site and database, separate Redis queues, no use of Django's port 8000. Suggested Frappe HTTP port 8002 and browser origin `http://localhost:5173`; reserve socket/Redis ports after checking actual listeners. Bench starts workers, scheduler/web and socket services; a single web process is insufficient. Host the custom app in its own repository under Bench, with planning/infrastructure files in root `finance/`. Do not execute Bench from `/mnt/f` due to filesystem watchers, permissions and performance.

**Production**: independently deployed Finance web, workers, scheduler, socket service, Redis, MariaDB and private file storage; separate dev/staging/prod sites and secrets. Linux infrastructure or official Frappe container tooling with a custom image containing both ERPNext and navapack_finance. WSL/`bench start` is development only. Resource starting estimate: 4 vCPU/8 GB RAM for local Finance services, more for combined frontend/Django use; measure rather than treating this as an upstream minimum.

See [setup runbook](WSL2-SETUP.md) for approval-gated commands.

## 6. Proposed backend and custom app structure

Do not vendor or fork Frappe/ERPNext into this workspace. Generated app files must come from the chosen v16 Bench template; documentation examples may show older `setup.py` scaffolds, so preserve the actual generated template. [Frappe app concepts](https://docs.frappe.io/framework/user/en/basics/apps).

```text
F:/WORK/ERP/finance/                       # planning now; proposed infra later
  README.md, PHASE-0-PLAN.md, MODULE-API-MAPPING.md
  WSL2-SETUP.md, PHASE-1-CHECKLIST.md
  infrastructure/                        # future tracked deployment templates
    README.md
    gateway/nginx.conf
    mariadb/finance.cnf
    versions.env.example                 # nonsecret pins only
    secrets.env.example                  # names/placeholders only
  contracts/                             # future adapter schema/version contracts
    source-event.schema.json
    ownership.md
    reconciliation.md
  adapter/                               # future separate process, not Django app
    README.md
    pyproject.toml
    navapack_adapter/{sources,transforms,transport,reconcile}.py
    tests/

WSL: ~/navapack-finance/bench/             # runtime; NOT committed as a whole
  apps/
    frappe/                              # unmodified upstream checkout
    erpnext/                             # unmodified upstream checkout
    navapack_finance/                     # own custom app Git repository
      pyproject.toml, README.md, license.txt, .gitignore
      navapack_finance/
        __init__.py
        hooks.py, modules.txt, patches.txt
        config/                          # generated configuration if present
        public/, templates/, www/        # template-generated asset/page folders
        navapack_finance/                # generated module package
          __init__.py
          doctype/                       # future custom metadata, not ledgers
          report/                        # later local regulatory/reconciliation views
        api/
          __init__.py
          session.py                     # Phase 1 proposed bootstrap + CSRF access
        permissions.py                   # Phase 1 capability/company resolution
        install.py                       # idempotent role/setup hooks
        fixtures/
          role.json                      # only named custom Finance roles
          custom_docperm.json            # tested explicit grants
        tests/
          test_session.py
          test_permissions.py
          test_native_contracts.py
        integration/                     # later ingestion/idempotency
          __init__.py, ingest.py, mapping.py, reconcile.py
        uganda/                          # later approved localization
          __init__.py, taxes.py, efris.py
        patches/                         # later idempotent data/setup migrations
  sites/                                 # local site configs, uploads, logs; private
  env/, logs/, Procfile, config/          # runtime-only
```

Phase 1 custom changes: `hooks.py` declares ERPNext requirement and install hooks/fixture filters; `install.py` provisions only approved roles/grants, including explicit native Report access for the custom roles through supported site customization rather than editing upstream report JSON; `permissions.py` calculates server-derived capabilities/allowed companies; `api/session.py` exposes authenticated `bootstrap` and CSRF access under native Frappe session semantics. `bootstrap` returns minimal identity, permitted companies, capability flags and versions, never password hashes or API secrets. Do not expose unrestricted User/Has Role enumeration to the browser.

The generated `modules.txt`, `patches.txt`, package metadata, initial packages and tests remain template-owned until specific additions are needed. No custom Account, GL Entry, invoice or payment ledger DocTypes. New custom DocTypes later may include External Source Mapping, Integration Event/Attempt, Uganda Tax Profile and EFRIS Submission; their generated JSON/Python/tests live in the module's `doctype/<snake_name>/` folders. Use encrypted Password fields or deployment secret references, filtered fixtures and idempotent patches. Never export User records, site config, tokens, private files or live company/tax IDs in fixtures.

## 7. Secure authentication, authorization and gateway

### 7.1 Chosen Phase 1 pattern

```text
Browser (existing React origin)
  /api/...                  -> existing Django (existing JWT unchanged)
  /finance-api/...          -> edge reverse proxy -> dedicated Frappe site
  /finance/erpnext/...      -> existing static React build
                                  |
                            ERPNext / MariaDB
                            workers / Redis / scheduler
```

Use a same-origin reverse proxy, not a Django Finance gateway and not a blanket browser CORS exception. `/finance-api/api/...` maps to Frappe `/api/...`. The gateway must set the intended upstream site Host, preserve request method/body/status, forward only necessary headers, strip all client-supplied trusted identity/site headers, set body/time limits and apply login rate limits. No dynamic upstream URL from user input. Keep database/cache ports private. Block public developer/administrative RPC access; expose only reviewed auth, bootstrap, allowed resource/report methods and necessary private-file retrieval paths. Retain a separately restricted Desk origin for administrators.

Frappe supports password login with sessions, token auth and OAuth. Use **native Frappe session authentication** for users: `POST /api/method/login` with `usr`/`pwd`, server bootstrap, and native logout. Forward MFA challenges and satisfy Frappe verification before accepting the session; exact v16 challenge payload is a Phase 1 contract test. Do not invent a custom password store or exchange Django JWTs for Frappe access. [Official REST authentication](https://docs.frappe.io/framework/user/en/api/rest).

**Cookie isolation is an acceptance gate:** rewrite upstream session cookie paths from `/` to `/finance-api` and remove upstream Domain attributes so Finance cookies are host-only. Preserve HttpOnly for session IDs, enforce Secure in production and SameSite=Lax (or stricter where verified). Logout deletion must use the same rewritten path. Forward session cookies only to Finance, not Django. Set no shared root `sid` that could collide with another site. Keep profile/capabilities/CSRF state in memory; no tokens or credentials in browser storage or Vite variables. Test proxy cookie behavior with native login and MFA on a real browser before adopting it.

Use CSRF protection for cookie-authenticated mutations including logout; obtain the CSRF token through a small authenticated custom method using native Frappe session utilities, and send `X-Frappe-CSRF-Token`. Retain native CSRF validation; never set `ignore_csrf`. Enforce exact Origin/Referer checks at the gateway for auth/mutations, JSON content type, login CSRF mitigation, and sanitized errors/logs. Session bootstrap must be `Cache-Control: no-store`; no shared authenticated-response cache. Proxy WebSocket/SSE only when a later feature requires it. Private file access needs the same authenticated session and Frappe authorization; never rewrite private files into public assets.

If the deployed static host cannot reliably proxy cookie paths, headers and MFA, stop at this acceptance gate and use a dedicated Finance BFF (outside Django), storing user-specific Frappe/OAuth credentials encrypted server-side behind its own HttpOnly cookie. Do not substitute a shared Administrator API token. This is a contingency, not a second simultaneous Phase 1 authentication system.

### 7.2 Finance roles and separation of duties

Create custom roles; do not equate operations `accounts`/`admin` with Frappe Accounts Manager/System Manager. Proposed policy:

- **Finance Viewer:** permitted-company COA/GL/statements read only; separately granted print/export; no create/write/submit/cancel/delete.
- **Finance Accountant:** permitted drafts for journals, invoices and payments in later phases; cannot approve own payment or change users/tax/COA structure. Phase 1 remains read-only except login/logout.
- **Finance Manager:** review/submit approved documents and controlled cancellation/amendment, budgets and close controls; independent maker/checker checks on payments and sensitive journals.
- **Finance Administrator:** scoped configuration and Finance user administration; no automatic unrestricted accounting posting. Break-glass Frappe Administrator is an audited operational identity, not the normal login.
- **Finance Auditor:** read submitted and historical evidence, access logs and explicitly authorized exports; no ledger writes.
- **Finance Integration:** noninteractive, least-privilege service user with only approved ingest methods and company mappings; no user management or arbitrary Journal Entry API grant.

Apply permissions in Frappe Role Permission Manager/fixtures, User Permissions for Company and linked dimensions, report permissions, field permission levels and workflows. Do not assign broad standard Accounts Manager merely to simplify the React menu. Explicit custom-method checks must enforce user enabled status, company access, document/report permissions and role constraints. Never use `ignore_permissions=True` or `get_all` to implement browser lists. Validate child rows, linked accounts/parties, company overrides and report filters to prevent cross-company leakage.

UI capabilities come from server bootstrap and control visibility only. Server checks apply on every request; company dropdown choices cannot grant access. Revalidate capability caches on expiry/role change and clear company/report state on identity switch. Define idle/absolute timeouts, password reset, MFA enrollment/recovery and revocation procedures before production. Avoid logging login bodies, cookies, CSRF tokens, TINs or financial payloads unnecessarily.

## 8. Native accounting ownership and integration roadmap

ERPNext owns Finance company/accounting masters, COA, native financial documents, GL, fiscal periods, reconciliation and reports after approved cutover. Django continues to own operational masters and workflows. An explicit external-ID mapping links their identities; names are never keys. Finance-only parties require an ownership rule so reverse synchronization cannot overwrite operations data.

**Phase 1: no adapter, no business writes.** Use an isolated Finance site and approved demonstration/opening data through native Desk; do not replay operations history. Verify login, account tree and General Ledger using native report logic.

**Later contract discovery:** assess saved invoice/dispatch/GRN/raw/job evidence and choose one canonical event per economic effect. Define versioned payload with event ID, source system/site, entity type/ID/revision, action, effective date, currency/FX snapshot, line IDs, quantities/UOM, source totals/tax snapshots, evidence hash, actor and correlation ID. Preserve source commercial totals; reject tax/rounding mismatches rather than silently repricing history.

**Transport:** begin with scheduled adapter polling of existing authorized APIs where completeness is demonstrable. Current paginated/list APIs do not prove an immutable change feed or deletion/cancellation coverage. Before real-time reliance, add a minimal transactional outbox at existing Django command boundaries in a separately approved integration phase; this may add an outbox table/worker but must not introduce Django accounting rules or duplicate public finance CRUD endpoints. Emit after authoritative commit through durable state, not a best-effort HTTP request in a transaction.

**Frappe ingestion:** custom whitelisted method validates an allowlisted event type under the Integration user, resolves mapping and calls native `insert`/`submit`/cancel/amend methods on ERPNext documents. Enforce a unique source event/action/revision key transactionally in Frappe. Duplicate delivery returns the original outcome; changed payload under the same key is rejected. Record target voucher/name/status and attempts. Queue retryable errors with backoff, dead-letter permanent mapping errors and expose reconciliation. Network timeout after commit must be safe to retry. Record original actor separately from service identity; do not impersonate through browser headers.

**Stock ownership decision:** preserve Django physical stock and production. ERPNext must either receive a validated mirror of stock movements with native valuation/GL, or act as a financial-only ledger with approved summarized valuation vouchers. Do not mix these modes per event without rules. If stock is mirrored, import native Item/Warehouse/UOM/Stock Entry/Purchase Receipt/Delivery Note as required and use non-stock-updating invoices where receipt/dispatch already moves stock. Native stock valuation and COGS must not also be posted by custom Journal Entries. Reconcile raw/WIP/finished quantities and values before activation. ERPNext Work Order/Job Card screens are not a replacement for existing Navapack production.

**Ledger cutover:** inventory the existing Django Book and posted/pending events using approved read-only exports, agree legal entity/fiscal boundaries and a cutover date, and map accounts/parties/currency/UOM. Reconcile trial balance, banks, AR/AP open invoices/advances, taxes, stock/WIP and assets. Import native openings and unresolved invoices once, with source IDs and independent review. Choose exactly one authoritative posting destination for each event/date. Later narrowly change the existing accounting posting gate to freeze legacy writes after cutover while preserving historical reads and operational saves; this is explicitly outside Phase 1 and requires separate approval. Do not merely hide the old page while its hooks continue to post.

Keep the old ledger available for audit. Stage dual reporting only as a controlled comparison with separate books and no external issuance. Rollback must specify which new vouchers to cancel/reverse natively and how to handle fiscalised documents; it cannot erase financial history. Monitor missing, duplicate and delayed events and reconcile daily control totals by source, currency and tax category.

## 9. Uganda VAT, EFRIS, LED and manufacturing

### Verified tax context and unresolved applicability

URA states that standard-rated supplies attract 18% VAT, zero-rated supplies 0%, and exempt supplies are distinct. This does not establish the tax treatment of every Navapack product. [URA explanation, February 2026](https://ura.go.ug/en/ask-ura-commissioner-general-6/).

URA's manufacturing guidance describes EFRIS invoicing for VAT-registered taxpayers and excise on specified supplies. A specific URA notice also addresses exemptions for certain plastics; classification cannot be inferred from the word “plastic”. Older guidance is background, not proof of the complete law effective in November 2026. [Manufacturing guidance](https://ura.go.ug/wp-content/uploads/2024/01/A-GUIDE-TO-TAXATION-OF-THE-MANUFACTURING-SECTOR.pdf), [plastics notice](https://ura.go.ug/en/clarification-on-plastics-exempt-from-excise-duty/).

The current frontend has `LED_PERCENT=2.5` and `LED_USD_PER_TONNE=70`, compares percentage against weight-based UGX equivalent and chooses the higher amount. It requires explicit net-selling vs production-cost base, eligible kilograms, dated USD/UGX FX and VAT-on-LED choice. Source comments expressly leave base/applicability/VAT treatment unresolved. These are verified existing commercial rules, **not verified current statutory rates or a blanket rule for all products**. Preserve historic snapshots unchanged; obtain effective legislation and written accountant/URA classification for each product before new tax posting.

### Proposed localization requirements

- Company configuration: legal name/TIN, Uganda jurisdiction, reporting currency, posting timezone `Africa/Kampala`, fiscal year, account precision, invoice numbering, tax-effective dates and evidence references. Fiscal year must be confirmed rather than assumed from the government tax calendar.
- Configure Sales/Purchase Taxes and Charges Templates, Item Tax Templates and Tax Categories for approved VAT treatments, input recoverability, exports, exemptions, imports, credit notes and rounding. Distinguish exempt from zero rated in output and returns.
- Separate output VAT/input VAT, LED liability, withholding liabilities/credits, import clearing, tax payments and adjustments. Add WHT rules only after confirming registration/agent status, exemptions, thresholds and period rules; no automatic universal deduction.
- Tax rule versions must include product classification, exemptions, effective interval, source reference, base, approved FX source/date, specific/ad-valorem rates, quantity basis and VAT interaction. Use native tax rows; any needed Uganda LED calculation extension belongs in the custom app and feeds native document taxes, not a second GL engine. Block ambiguous calculations. Test line/document rounding and credit/return treatment against signed examples.
- EFRIS is a separate fiscal integration, not native ERPNext certification assumed by this plan. Confirm current URA system-to-system specification, enrollment, keys/certificates/device requirements, sandbox and approvals. The public handbook is background; exact endpoints, signatures and payload schemas were not verified. [URA EFRIS handbook](https://ura.go.ug/storage/2025/01/THE-EFRIS-HANDBOOK-2024-25-2.pdf).
- Build a server-side EFRIS connector with approved product/UOM/tax-code mappings, TIN validation, stable submission keys, raw response hashes, fiscal document number/verification code/QR metadata, retry and status inquiry after ambiguous timeout. No browser signing keys. Redact payload logs and protect stored signed responses.
- Define explicit fiscal states: draft → ready → pending → accepted/rejected/unknown; unknown must be queried before resend. Enforce the legally approved relationship between ERPNext submission, fiscal acceptance and customer issuance. A timeout must not be displayed as accepted. Fiscalised corrections require the prescribed credit/debit/cancellation process; cancelling ERPNext alone is insufficient. Establish outage, manual recovery and daily EFRIS-to-sales/VAT reconciliation procedures before issuance.
- Provide VAT input/output and adjustment registers, LED production/sales/exempt/export schedule, WHT certificates/registers, filing-period exports and payment reconciliation. Obtain current URA return formats and accountant approval; generic ERPNext reports are not certified Ugandan returns.

### Manufacturing accounting scope

COA/cost centers should distinguish raw virgin/recycled resin, ink, spares/consumables, WIP by production stage where needed, finished goods, scrap/by-products, GRNI, COGS, manufacturing variances and overhead absorption. Capture source quantities and approved UOM conversions, actual issue/receipt cost, landed costs/nonrecoverable taxes, labor, machine/power and overhead allocations; separate planned quotation/job cost from actual financial cost.

Map approved consumption, scrap, rework, production completion, returns and dispatch to native valuation documents or the agreed financial-only policy. Account for stage transfers, subcontracting, abnormal loss, machine maintenance/capitalization, recycling yield, recovered granules and inter-stage WIP. A recycling register is not automatically inventory or revenue. QC holds/rejections affect acceptance and inventory classification but do not themselves imply a second purchase/sale. Reconcile production inputs, yields, WIP, completed stock and COGS by job/batch and period. Define negative-stock, backdated valuation, stock freeze and period-lock policies before posting.

## 10. Phased delivery and gates

1. **Phase 0 — this audit:** review architecture, coexistence route, v16/MariaDB choice, roles and scope. No implementation.
2. **Phase 1 — isolated native read access:** approved WSL site/custom app, gateway, separate login/MFA/session, read-only COA and native General Ledger, company permissions, operations regression and restore smoke check. Gate: checklist acceptance; no operational synchronization or new financial posting screen.
3. **Phase 2 — accounting foundations:** Company/Fiscal Year/Accounts Settings, reviewed COA, cost centers/dimensions, banks, payment terms, party/item/UOM mappings and reconciled openings. Controlled native Journal Entry and posting/period-lock workflows; independent approval.
4. **Phase 3 — receivables/payables/cash:** invoices/returns/credits, payment entry/allocation/advances, supplier matching/GRNI, expenses, reconciliation and financial statements. Use native controllers; validate tax snapshots and currency behavior.
5. **Phase 4 — Uganda compliance:** approved effective tax profiles, VAT/LED/WHT registers, EFRIS sandbox/certification and production issuance controls. Must precede any legally required fiscal invoice issuance in Phase 3; phases may overlap but this gate cannot be deferred past go-live.
6. **Phase 5 — operations adapter:** read contracts, durable events/mappings, idempotent ingestion, replay/dead letters, manufacturing/stock ownership proof and daily reconciliation. Pilot one source type/company before broad rollout.
7. **Phase 6 — advanced finance and cutover:** assets/depreciation, budgets, subscriptions/deferred items, consolidation/intercompany if applicable, manufacturing actual-cost close, audited migration and approved legacy posting freeze. Gradually reassign public Finance routes only after cutover acceptance.

Each phase needs a demonstrated native accounting result, permission evidence, regression checks, backup/rollback procedure and financial owner sign-off. Do not use screen completion as evidence of statutory or ledger readiness.

## 11. Risks, tests and unresolved decisions

**Critical: duplicate ledgers/posting.** Existing Django hooks are active in source. Test source-key replay, cutover-date routing, reversal/cancellation, pre/post-cutover events and queue reconciliation. Phase 1 must send no operational posting request to either ledger.

**High: session/provider coupling.** Test Finance-only navigation with no Django session/backend, expired Django token, concurrent operations+Finance users, logout in either system, tab/session switch, pending operations saves, reload/back/forward and Finance failure. Assert no operations provider/network initialization under Finance routes and no Django Authorization header reaches Frappe.

**High: role/company leaks.** Direct HTTP negative tests for Guest, disabled user, revoked role, another company, forbidden account/party/report/voucher, export/print and custom methods. Changing URL/JSON filters must never grant access. Test linked child-row restrictions and report permission handling.

**High: gateway/MFA/CSRF.** Real-browser cookie path/domain/Secure/HttpOnly tests, login/logout and deletion, CSRF missing/invalid, forged Origin, rate limiting, MFA failure/recovery, session timeout/revocation, private files and deployment rewrite precedence. No token/session response in shared caches or analytics logs.

**High: tax uncertainty/EFRIS.** Accountant-approved examples covering standard/zero/exempt, VAT inclusive/exclusive, discounts, LED applicability/exemption/higher-of/FX, credit notes/returns, dated rule changes, WHT and rounding. EFRIS timeout-after-acceptance, duplicate/retry, rejected invoices, outage and correction tests. Current statutory LED classification and S2S specification remain open.

**High: native stock vs financial duplication.** Golden scenarios for GRN→bill→payment, raw issue→WIP→finished goods→dispatch→invoice, scrap/rework/return and landed costs. Reconcile quantities, value and native GL at each step; receipt and invoice must not receive stock twice.

**Medium/high: dependencies and upgrades.** Pin compatible upstream major/patch manifests, test installation from clean WSL environment, migrate a restored staging copy and rerun API/permission/report contracts before upgrades. No upstream source modifications. Ubuntu's default MariaDB may be below 11.8; explicitly validate candidate/version.

**Medium/high: report correctness/performance.** Compare React GL against native ERPNext report for exact filters, opening/closing totals, cost center/dimensions, vouchers, currencies and cancellation status. Test precision, large balances, date boundaries, zero rows, tree cycles/unexpected parents, pagination, prepared reports and slow worker failure. Do not calculate official balances by summing a paginated GL Entry list in React.

**Medium: deployment/repository mismatch and dirty tree.** Confirm Git ownership and frontend host rewrite control before changes; isolate only Finance diffs and preserve existing sales work. Test deep links, refresh, assets, production build, narrow screens, keyboard navigation and loading/error states. Mobile/file-origin authentication is a separate design task, not supported automatically by this same-origin plan.

**Runtime tests not performed in Phase 0.** No claim of green current build, working Frappe site, live API contract, PostgreSQL concurrency or statutory compliance. Phase 1 test details and runnable existing frontend checks are in the checklist. Backend integration concurrency later needs PostgreSQL tests for operations and MariaDB tests for Frappe, not SQLite substitutes.

Decisions to settle before implementation: route coexistence accepted; current authoritative ledger/deployment confirmed; legal entities/currencies and Finance role owners named; gateway host/control available; WSL service/port reservations confirmed; tested release pins selected. Before financial go-live additionally settle cutover date/openings, stock valuation ownership, statutory tax applicability and EFRIS approvals. These do not require changing existing operational models during Phase 1.
