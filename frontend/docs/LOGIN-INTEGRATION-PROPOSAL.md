# Existing-login integration — approval required, not applied

The new preview is independent and does not authenticate Finance. Implementation stopped at the operational integration boundary as requested. Nothing in this proposal has been applied to existing frontend or Django files.

## Intended flow

Keep `/login` and its visual markup unchanged. After successful existing Django authentication, request server-verified application entitlements. Existing operational roles retain current RoleDashboard and operational modules. Finance entitlement launches the isolated application through a server handoff. Multiple entitlements show an application selector and an always-available permitted application switcher. Admin is not automatically granted Frappe access merely because it is an operational admin. Existing accounts users must retain permitted purchasing, costing and quotation access.

Use a distinct Finance origin or a dedicated mount such as `/finance/erpnext/`; do not silently replace the existing Django `/finance` ledger. Approve migration/cutover separately to avoid two authoritative ledgers. The existing separate `/finance/login` must eventually redirect to `/login`; its visible link also needs removal to meet the sole-login requirement. Removing it modifies existing login markup, so explicit approval is required even though the remaining visual design can be preserved.

## Minimal proposed frontend file changes

1. `frontend/src/App.tsx`: route post-login resolution via an application resolver; preserve current operational routes and role dashboard behavior. Redirect legacy `/finance/login` to `/login`. Introduce app chooser only for multiple authorized applications.
2. `frontend/src/context/AuthContext.tsx`: consume server entitlements after login/restoration and clear them on logout; never infer a grant from a local role array.
3. `frontend/src/lib/api.ts`: type and request entitlement and handoff initiation contracts from an approved identity service. Do not append tokens to redirects.
4. `frontend/src/components/layout/AppShell.tsx`: add a permitted-application switcher without removing operational navigation access.
5. `frontend/src/pages/Login.tsx`: remove the pre-existing separate Finance login link, subject to explicit approval of this small visual change. Keep all other markup, branding, fields and styling intact. The existing navigation to `/` can remain; App.tsx resolves the next destination.
6. New `frontend/src/pages/ApplicationSelection.tsx`: entitlement-based selector; backend rechecks grants at launch.

No patch has been staged or applied. Exact service URLs, environment configuration and hosting mounts depend on the approved identity design.

## Backend / identity work pending separate approval

Prefer a shared identity provider for both systems, with a server-side Finance BFF maintaining Frappe sessions/tokens. Alternatively an audited broker can exchange a very short-lived, one-use, audience-bound handoff code issued after Django authenticates and checks entitlements. This requires an actual server-to-server trust integration with Frappe, not a frontend trick or Django JWT accepted by Frappe. Do not use an administrator account as the acting user.

Possible Django scope, only if a broker design is approved: extend `backend/accounts/views.py` with entitlement and handoff initiation views, add serializers, register in `backend/config/urls.py`, add server-side entitlement service and tests. Do not change accounts/models.py or role assignments until the multi-role entitlement representation is explicitly approved. A dedicated identity service/shared IdP may avoid a role-model migration. No accounting logic belongs in this scope.

Finance server responsibilities: cryptographic validation, fixed allowed redirect destinations, code replay prevention, audience and issuer checks, expiry, state/nonce and login-CSRF protection, server-only secrets, rotation/revocation, identity-to-Frappe-user mapping, least-privilege company and DocType/report authorization. Establish Secure HttpOnly SameSite cookies; CSRF protection for writes; same-origin BFF API; no tokens in URL, localStorage, logs or browser bundle. Return 401/403 for missing/expired/revoked grants. Logout ends Finance session and defines coordinated logout behavior with operations.

Before live launch, test tampered/replayed codes, open redirects, denied company access, role revocation, multi-role switching, direct URLs, expired sessions, logout and unchanged operational login/navigation. Native Frappe must check every read, report and mutation; a React route guard alone is insufficient.
