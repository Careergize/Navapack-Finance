import type { Account, FinanceDocument, FinanceProvider } from '../api/types';
const account = (name: string, account_name: string, root_type: Account['root_type'], parent_account: string|null, is_group: 0|1 = 0): Account => ({name,account_name,root_type,parent_account,is_group,account_currency:'INR'});
export const accounts: Account[] = [account('1000','Assets','Asset',null,1),account('1100','Current assets','Asset','1000',1),account('1110','Bank — demo current account','Asset','1100'),account('1120','Accounts receivable','Asset','1100'),account('2000','Liabilities','Liability',null,1),account('2100','Accounts payable','Liability','2000'),account('2200','GST payable','Liability','2000'),account('3000','Equity','Equity',null,1),account('3100','Share capital','Equity','3000'),account('4000','Income','Income',null,1),account('4100','Packaging sales','Income','4000'),account('5000','Expenses','Expense',null,1),account('5100','Material purchases','Expense','5000')];
const document = (name: string, doctype: string, posting_date: string, party: string, account: string, amount: number, status: FinanceDocument['status'], docstatus: 0|1 = 1): FinanceDocument => ({name,doctype,posting_date,party,account,amount,status,docstatus,currency:'INR'});
export const documents: FinanceDocument[] = [
 document('DEMO-SINV-0042','Sales Invoice','2026-11-05','Aster Packaging (fictional)','Accounts receivable',148000,'Unpaid'),
 document('DEMO-SINV-0041','Sales Invoice','2026-11-03','Maple Retail (fictional)','Accounts receivable',92000,'Overdue'),
 document('DEMO-SINV-0040','Sales Invoice','2026-11-02','Cedar Foods (fictional)','Accounts receivable',216000,'Paid'),
 document('DEMO-PINV-0028','Purchase Invoice','2026-11-04','Atlas Materials (fictional)','Accounts payable',76000,'Unpaid'),
 document('DEMO-PINV-0027','Purchase Invoice','2026-11-01','Pine Supplies (fictional)','Accounts payable',48000,'Overdue'),
 document('DEMO-JV-0015','Journal Entry','2026-11-05','Monthly adjustment (fictional)','Material purchases',12500,'Draft',0),
 document('DEMO-JV-0014','Journal Entry','2026-11-01','Opening example (fictional)','Share capital',500000,'Submitted'),
 document('DEMO-BT-0009','Bank Transaction','2026-11-04','Demo receipt (fictional)','Bank — demo current account',216000,'Unreconciled'),
 document('DEMO-GST-001','Sales Taxes and Charges Template','2026-11-01','Illustrative tax template','GST payable',18000,'Draft',0)
];
export const demoProvider: FinanceProvider = {mode:'demo',async load(signal) { await new Promise<void>((resolve,reject)=>{const id=setTimeout(resolve,250);signal?.addEventListener('abort',()=>{clearTimeout(id);reject(new DOMException('Aborted','AbortError'));},{once:true});}); return structuredClone({documents,accounts}); }};
