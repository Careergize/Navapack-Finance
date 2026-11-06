# Finance screens and native API catalogue

All React paths below are **proposed** relative to `/finance/erpnext`. Phase 1 includes login, home, COA and GL only. Other entries are a full finance-domain roadmap, not a promise to implement all ERPNext features in Phase 1 or replace operations modules.

## API conventions

Calls go through `/finance-api`; paths here are the upstream Frappe paths. Names containing spaces must be URL encoded.

- **R(Doctype)** = `/api/resource/{Doctype}` for permitted list/create, and `/{encoded-name}` for read/update. Lists explicitly select fields, filter by allowed company, sort and paginate; child rows are read through their parent. Single DocTypes such as Accounts Settings require the Single document convention verified against the pinned site.
- **Q(report)** = `/api/method/frappe.desk.query_report.run` with exact `report_name` and JSON `filters`. Use the native result columns, rows and summary, including prepared-report state; do not substitute direct SQL or browser aggregation.
- **Submit/cancel** = native `/api/method/frappe.client.submit` and `frappe.client.cancel`, or a narrowly authorized wrapper calling the native document methods. These are later-phase mutations. Creation alone leaves submittable documents in Draft; never directly write GL Entry or Payment Ledger Entry.
- Native response envelopes differ (`data` for resources, commonly `message` for methods). The Finance API layer normalizes them and preserves validation/permission failures without exposing traces.

These are existing Frappe API patterns, not proposed Django endpoints. [REST API](https://docs.frappe.io/framework/user/en/api/rest), [v16 document methods](https://raw.githubusercontent.com/frappe/frappe/version-16/frappe/client.py), [v16 report runner](https://raw.githubusercontent.com/frappe/frappe/version-16/frappe/desk/query_report.py).

## Phase 1 contracts

1. `/login` → native `POST /api/method/login`, `GET /api/method/frappe.auth.get_logged_user`, native logout; proposed custom `/api/method/navapack_finance.api.session.bootstrap` and `.csrf_token` for minimal permitted profile/company/capability state. Those two custom methods do not exist yet. Never treat them as upstream APIs.
2. `/` → permitted session/company summary; no synthetic financial cards.
3. `/chart-of-accounts` → R(Account), selected fields `name`, `account_name`, `account_number`, `parent_account`, `is_group`, `root_type`, `report_type`, `account_type`, `account_currency`, `company`, `disabled`. Confirm fields against the pinned metadata. Build the tree from complete paginated results for the permitted company. No balance arithmetic in the COA client. In Phase 1 this screen has no create/rename/delete action.
4. `/general-ledger` → Q(General Ledger). Require company/from_date/to_date and validate account/party/cost center/dimensions/currency filters against the installed report JS/Python. Preserve native opening/closing rows and voucher identifiers; a voucher link is read-only and permission checked. [Native GL implementation](https://raw.githubusercontent.com/frappe/erpnext/version-16/erpnext/accounts/report/general_ledger/general_ledger.py).

## Finance module coverage and proposed screens

The following mappings are architectural recommendations using native document/report names. The upstream Accounting workspace and documentation establish the domains; exact installed fields, report availability and mutation payloads require contract tests on the selected patch. No runtime endpoint was exercised in this audit. [Accounting workspace](https://raw.githubusercontent.com/frappe/erpnext/version-16/erpnext/accounts/workspace/accounting/accounting.json), [accounting documentation](https://docs.frappe.io/erpnext/accounting-introduction).

### Foundations, general accounting and controls

- **Company/setup** → `/settings/company`, `/settings/accounting`: R(Company), R(Accounts Settings), R(Fiscal Year). Phase 2; controlled configuration and default accounts.
- **Chart of Accounts** → `/chart-of-accounts`: R(Account); later native account creation/import/rename workflows with group/leaf checks. Phase 1 reads; Phase 2 controlled changes.
- **Dimensions and cost centers** → `/settings/dimensions`, `/cost-centers`: R(Cost Center), R(Accounting Dimension); native dimension metadata determines document filters. Phase 2.
- **Journal and opening entries** → `/journals`, `/opening-balances`: R(Journal Entry), native insert/submit/cancel; native Opening Invoice Creation Tool when invoice-level openings are required. Phase 2. No direct GL inserts.
- **General Ledger** → `/general-ledger`: Q(General Ledger). Phase 1; Party GL uses native party filters rather than a new ledger engine.
- **Trial balance** → `/reports/trial-balance`: Q(Trial Balance). [v16 report metadata](https://raw.githubusercontent.com/frappe/erpnext/version-16/erpnext/accounts/report/trial_balance/trial_balance.json). Phase 2/3; match opening/movement/closing figures with Desk.
- **Period close and lock** → `/period-close`: R(Accounting Period), R(Period Closing Voucher), native closing and account freeze settings. Phase 2/6; cancellation/reopening policy is explicit and audited.
- **Budget/variance** → `/budgets`: R(Budget), Q(Budget Variance Report). Phase 6; account/cost-center/project controls.
- **Workflow and audit** → `/approvals`, `/audit`: R(Workflow), permission-limited Version/Access Log/document history. Phase 2 onward; application workflow permission is enforced on each native transition, not only in React.

### Receivables and sales finance

- **Customer accounting master** → `/receivables/customers`: R(Customer), Customer Group, Territory, Payment Terms Template; mapped from stable operations IDs, not a replacement operations CRM. Phase 2/3.
- **Sales invoices and debit adjustments** → `/receivables/invoices`: R(Sales Invoice), native submit/cancel/amend and tax rows. Phase 3 subject to Phase 4 EFRIS gate.
- **Credit notes/returns** → `/receivables/credit-notes`: native Sales Invoice with return semantics and `return_against`; controlled partial quantities/taxes. Operations return approval remains its existing workflow. Phase 3/4.
- **Receipts/advances/allocation** → `/receivables/receipts`: R(Payment Entry), native references/allocations and payment reconciliation. Phase 3; does not initiate a bank transfer by itself.
- **Ageing/statements** → `/receivables/ageing`, `/receivables/statements`: Q(Accounts Receivable), Q(Accounts Receivable Summary); Process Statement Of Accounts for reviewed email/export jobs, not automatic delivery. [v16 AR metadata](https://raw.githubusercontent.com/frappe/erpnext/version-16/erpnext/accounts/report/accounts_receivable/accounts_receivable.json).
- **Dunning/bad debts** → `/receivables/dunning`: R(Dunning), Dunning Type; native adjustments via authorized journals. Phase 6.
- **Subscriptions and recurrence** → `/subscriptions`: R(Subscription), Subscription Plan, Auto Repeat; native recurring invoice scheduling with duplicate/fiscalisation controls. Phase 6.

### Payables and purchasing finance

- **Supplier accounting master** → `/payables/suppliers`: R(Supplier), Supplier Group, payment terms and account links. Phase 2/3.
- **Supplier bills/debit notes** → `/payables/bills`, `/payables/debit-notes`: R(Purchase Invoice), native return semantics for supplier credits, receipt/PO matching references and recoverable tax treatment. Phase 3. A PO does not create a payable.
- **Supplier payments/advances** → `/payables/payments`: R(Payment Entry); native allocation/payment reconciliation. Phase 3 with maker/checker workflow.
- **Payable ageing** → `/payables/ageing`: Q(Accounts Payable), Q(Accounts Payable Summary). Phase 3.
- **Expenses/employee settlements** → `/expenses`: approved native Purchase Invoice/Journal Entry/Payment Entry flow for ordinary expenses. Employee Expense Claim/payroll require a separately evaluated compatible Frappe HR app; do not claim these as core ERPNext features installed by this plan. Phase 3/6.

### Cash, bank, treasury and currency

- **Bank/cash/mobile-money setup** → `/treasury/accounts`: R(Bank), Bank Account, Mode of Payment and native Account links. Phase 2/3. Mobile money is a separately reconcilable account/payment mode.
- **Transfers/payment orders/requests** → `/treasury/transfers`, `/treasury/payment-orders`, `/treasury/payment-requests`: native Payment Entry internal transfer, Payment Order, Payment Request; bank-file/payment-provider integrations are separate reviewed features. Phase 3/6.
- **Statement import/reconciliation** → `/treasury/bank-reconciliation`: R(Bank Transaction), Bank Statement Import and native reconciliation tool. Any reconciliation RPC must be selected from the pinned module and allowlisted after test; no invented generic `/reconcile` endpoint. Phase 3.
- **Currency/exchange/revaluation** → `/treasury/exchange-rates`, `/treasury/revaluation`: R(Currency Exchange), Exchange Rate Revaluation; native payment FX differences. Phase 3/6, preserving dated source rates.
- **Payment matching** → `/treasury/payment-reconciliation`: native Payment Reconciliation document/tool; select/test its installed methods for finding and allocating unreconciled payments. No direct Payment Ledger Entry writes. Phase 3.

### Tax and Uganda localization

- **Tax setup** → `/tax/settings`: R(Sales Taxes and Charges Template), Purchase Taxes and Charges Template, Item Tax Template, Tax Category, Tax Rule and Tax Withholding Category as applicable. Phase 2/4.
- **VAT registers** → `/tax/vat`: native Sales Register/Purchase Register and item-wise tax reports where installed, with custom Uganda report/export over native documents if needed. Phase 4; signed local return schema required.
- **LED** → `/tax/led`: proposed Uganda Tax Profile/custom report plus native invoice tax rows and liability Account; not a native Ugandan LED API. Phase 4.
- **EFRIS** → `/tax/efris`: proposed EFRIS Submission/status/retry view and custom server connector. No claim that ERPNext supplies a certified native Uganda endpoint. Phase 4 before fiscal issuance.
- **WHT** → `/tax/withholding`: native withholding configuration and local certificate/register export extension if required; confirm category coverage and current rates. Phase 4.

### Assets, valuation and manufacturing finance

- **Asset register/depreciation** → `/assets`, `/assets/depreciation`: R(Asset), Asset Category, Asset Finance Book/Finance Book and native depreciation schedule/booking. Phase 6. [v16 Asset definition](https://raw.githubusercontent.com/frappe/erpnext/version-16/erpnext/assets/doctype/asset/asset.json).
- **Capitalization/movement/disposal/value change/repair** → `/assets/capitalization`, `/assets/movements`, `/assets/adjustments`, `/assets/repairs`: native Asset Capitalization, Asset Movement, Asset Value Adjustment, Asset Repair, and native sale/scrap flow. Phase 6; validate each enabled workflow.
- **Stock valuation/landed costs** → `/manufacturing/valuation`, `/manufacturing/landed-costs`: Q(Stock Balance), Q(Stock Ledger), R(Landed Cost Voucher), permitted Stock Entry/Purchase Receipt references. Phase 5/6. Read-only operational visibility does not authorize additional stock postings.
- **WIP/production cost** → `/manufacturing/wip`, `/manufacturing/job-cost`: native stock/GL and cost-center/dimension reports, with source job mapping and custom reconciliation where needed. Phase 5/6. Native Stock Entry manufacture/repack only if the stock-mirror policy is approved; no replacement of Navapack Job Cards.
- **Project/cost profitability** → `/reports/job-profitability`: native Project/cost-center accounting and project/gross-profit reports when applicable, plus approved job mapping. Phase 6; planned costing and actual GL remain distinguishable.

### Statements and advanced reporting

- **Balance sheet** → `/reports/balance-sheet`: Q(Balance Sheet). [v16 report metadata](https://raw.githubusercontent.com/frappe/erpnext/version-16/erpnext/accounts/report/balance_sheet/balance_sheet.json).
- **Profit and loss** → `/reports/profit-loss`: Q(Profit and Loss Statement).
- **Cash flow** → `/reports/cash-flow`: Q(Cash Flow); do not label cash-account turnover as a complete cash-flow statement.
- **Consolidation/intercompany** → `/reports/consolidated`, `/intercompany`: native consolidated financial reports and inter-company journal/invoice workflows only if legal entities require them; validate elimination rules and report names on the pinned site. Phase 6.
- **Deferred revenue/expense** → `/deferred`: native invoice deferred-accounting fields and Process Deferred Accounting tool; preserve scheduled native postings. Phase 6.
- **Finance dashboard/analysis** → `/reports`, `/`: native reviewed report results for liquidity, AR/AP, profitability and ratios; create no parallel report arithmetic engine. Financial analytics, sales/purchase registers, tax detail and accounting dimensions are extensions of these domains.

This catalogue covers core accounting plus finance-adjacent Assets, stock valuation/manufacturing, projects and recurring billing. HR/payroll, lending, external bank connections and country compliance packages are separate apps/integrations requiring compatibility review; they are not silently bundled into Finance.

## Native lifecycle and contract gates

At implementation, enumerate the installed Report and DocType metadata for every enabled screen, save a non-sensitive contract manifest and verify exact spelling, fields, report filters, controller methods and permissions. Entries above describe native resources; they are not blanket authorization to expose all generic CRUD.

For each mutation: validate draft → submit → cancel/amend/reversal behavior, link/child permissions, closed dates, currency and native GL impact. Block GL Entry, Payment Ledger Entry and Stock Ledger Entry creation/update/deletion at the public gateway. Native controllers and workers own these records. Allow read access only where explicitly needed and permitted.

For each report: compare to the native Desk output for the same filters and user/company, handle prepared jobs and denied exports, and preserve native monetary precision. Phase 1 General Ledger must not depend on writing finance documents from the React application.
