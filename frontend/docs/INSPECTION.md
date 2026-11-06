# Read-only inspection — 5 November 2026

Scope: local `F:/WORK/ERP/frontend` and `F:/WORK/ERP/backend`. This is source inspection, not a claim that the deployed Vercel revision matches local source. No production login or real data was accessed.

- `frontend/src/pages/Login.tsx`: existing visual login, BrandPanel, Button, TextField and logo. Username/password is sent through AuthContext. A `finance` prop changes wording; `/finance/login` and a separate Finance link already exist. Task restrictions prevent changing either.
- `frontend/src/context/AuthContext.tsx`: validates known single-role profiles; restores with `/auth/me/`; handles retry/error; generation guard protects against stale restoration. Demo login is explicitly environment gated. Finance login requires `accounts` on the client.
- `frontend/src/lib/api.ts`: Axios login `/auth/login/`, current profile `/auth/me/`, shared refresh promise, 401 retry, rotating refresh tokens. Django bearer tokens belong to operations only.
- `frontend/src/lib/authSession.ts`: access/refresh stored in sessionStorage by default, localStorage with Remember me. Clear removes both stores and emits an auth-cleared event. UI logout clears browser state; it does not itself invoke the available backend blacklist route.
- `frontend/src/App.tsx`: RequireAuth guards nested AppShell routes, redirecting unauthenticated users to `/login`; QC restriction exists. `/` sends `accounts` to AccountingPage, other users to RoleDashboard. Existing `/finance` and `/finance/quality` exist. `/finance` has the generic authentication guard; the quality page also checks accounts. Client navigation visibility is not authoritative permission enforcement.
- `frontend/src/components/layout/AppShell.tsx`: operational and accounts navigation with role arrays. Existing Finance navigation includes purchasing, procurement, costing, quotations and quality; future app switching must preserve these authorized operational modules.
- Branding: copied `Nava-logo.png` into the new app. Existing palette from `frontend/tailwind.config.ts`: navy #1A3764, blue #1567A9, teal #31A8E0, green #3AAA35, lime #94C11F, surface #F5F8FA; Inter/system font. Independent CSS reproduces the design language without importing operational components or contexts.
- `backend/accounts/models.py`: roles admin, receptionist, project_manager, production_manager, store_keeper, production_operator, recycling_operator, accounts, qc_inspector, qc_supervisor. One assigned_role FK plus legacy role string; active assignment overrides legacy, disabled assignment resolves to empty; special legacy superuser fallback. There is no serialized multi-role entitlement set.
- `backend/accounts/backends.py`: active assigned-role Django permissions augment group permissions. User/Role management is superuser-only in management_api.py.
- `backend/accounts/views.py`: SimpleJWT LoginSerializer includes serialized user; MeView returns current user. settings default to JWTAuthentication and IsAuthenticated. Access lifetime 15 minutes; refresh one day with rotation and blacklisting. Login is throttled.
- `backend/config/urls.py`: login, refresh, blacklist logout, profile and role/user routes. Existing accounting is already implemented in Django. `backend/accounting/views.py` checks authenticated/active effective roles; write is admin/accounts, configure admin, read additionally project/production managers (superuser exception). New Finance does not call these tables or endpoints.

## Git baseline

The workspace root is not a usable Git worktree (`git status` reports a parent path error). Frontend and backend are separate Git roots, confirmed with `rev-parse --show-toplevel`.

Frontend had 13 modified tracked files and 2 untracked Sales API files at inspection. Exact list is in `baseline-frontend-status.txt`. Backend had a clean porcelain status. Baseline source-file SHA256 manifests capture files before Finance implementation; dependencies, Git metadata, pycache and generated dist were excluded. No existing operational file was edited during inspection or implementation.
