export type Section = 'dashboard'|'accounts'|'ledger'|'journals'|'receivables'|'payables'|'banking'|'taxes'|'reports'|'settings';
export interface FinanceDocument { name: string; doctype: string; posting_date: string; party: string; account: string; amount: number; currency: 'INR'; status: 'Paid'|'Overdue'|'Unpaid'|'Draft'|'Submitted'|'Unreconciled'; docstatus: 0|1|2; }
export interface Account { name: string; account_name: string; parent_account: string|null; root_type: 'Asset'|'Liability'|'Equity'|'Income'|'Expense'; is_group: 0|1; account_currency: 'INR'; }
export interface FinanceSnapshot { documents: FinanceDocument[]; accounts: Account[]; }
export interface FinanceProvider { readonly mode: 'demo'|'frappe'; load(signal?: AbortSignal): Promise<FinanceSnapshot>; }
