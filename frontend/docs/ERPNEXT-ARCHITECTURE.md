# ERPNext integration boundary

Current path: UI → FinanceProvider → local demo fixtures. FrappeProvider deliberately throws and has no HTTP transport or credentials. There is no automatic production/demo fallback. Demo amounts are display fixtures; no ledger, journal store, accounting persistence or tax engine is implemented.

Future path: UI → same-origin authenticated Finance BFF → native Frappe endpoints under the mapped user's permission context. BFF endpoints are future design, not implemented APIs. The browser never reads operational Django JWTs or Frappe secrets. Frappe is the sole accounting authority after an approved cutover. Do not connect the new app to existing Django accounting tables.

`src/api/types.ts` defines minimal display projections. `docstatus` retains native 0=draft, 1=submitted, 2=cancelled. Financial amounts are read-only presentation numbers; live forms need native precision/currency handling. `party` and `amount` are normalized display fields, not claimed native field names.

Native resource catalogue in `src/api/frappe.ts`:

- Chart of Accounts: Account; map name, account_name, parent_account, root_type, is_group, account_currency. Live account names are native document identifiers, not the demo numeric codes.
- General Ledger: GL Entry; map posting_date, account, debit, credit, voucher_type, voucher_no, party_type, party, company, account_currency. Read only; never create GL Entry directly.
- Journals: Journal Entry and child accounts (account, debit_in_account_currency, credit_in_account_currency), company, posting_date, user_remark, voucher_type and docstatus.
- Receivables: Sales Invoice; map customer, grand_total, outstanding_amount, due_date, currency, status. Aging should come from the native report, not browser due-date math.
- Payables: Purchase Invoice; analogous supplier fields; native outstanding and payment status.
- Banking: Bank Transaction for imported transactions; Bank Account, Bank and Payment Entry for supporting detail and native settlement. Reconciliation must follow native authorized workflow.
- Taxes: Sales Taxes and Charges Template / Purchase Taxes and Charges Template; native tax accounts and child rows. Jurisdictional compliance/localizations require separate setup and validation.
- Settings: Company, Fiscal Year, Cost Center, Currency and native permissions. Configure only after least-privilege authorization and validation.
- Reports: `/api/method/frappe.desk.query_report.run`, approved report names and required company/date filters. Common ERPNext reports include General Ledger, Balance Sheet, Profit and Loss Statement, Trial Balance, Cash Flow, Accounts Receivable and Accounts Payable. Verify installed release schemas, filters, report permissions and response envelopes before enabling.

Future client requirements: explicit fields and company filters, native pagination, server-side search, stable ordering, abort handling, loading/empty/error separation, 401/403 handling, currency/timezone metadata, response validation, audit correlation without secrets. Native report and document permissions are authoritative. No raw path or arbitrary method pass-through from the browser.

Posting is intentionally absent. A later implementation must authorize create/read/write/submit/cancel separately in Frappe, enforce CSRF and idempotent request handling, preserve native audit trails and validate accounting periods. Never duplicate posting calculations in Django or the browser.

References checked 5 November 2026: [Frappe REST API](https://docs.frappe.io/framework/user/en/api/rest) and [Frappe OAuth 2](https://docs.frappe.io/framework/user/en/guides/integration/rest_api/oauth-2). Native resource/method patterns are documented there; this specific BFF/handoff design is a proposal and must be validated against the selected Frappe release.
