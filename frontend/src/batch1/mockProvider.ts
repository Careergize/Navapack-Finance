export type PreviewScenario = 'sample' | 'loading' | 'empty' | 'error' | 'unavailable' | 'unconfigured' | 'permission-denied';
export type PreviewPeriod = '2026-11' | '2026-10';
export type SampleDocument = {
  id: string; party: string; kind: 'Receivable' | 'Payable'; issued: string; due: string;
  amount: number; draft?: boolean; payments: { date: string; amount: number }[];
};
export type CashMovement = { id: string; date: string; direction: 'in' | 'out'; amount: number; description: string };
export type DashboardSnapshot = {
  mode: 'mock'; currency: 'UGX'; company: 'Preview company'; asOf: string; period: PreviewPeriod;
  openingCash: number; openingDate: string; documents: SampleDocument[]; movements: CashMovement[];
};

const documents: SampleDocument[] = [
  { id: 'DEMO-INV-1048', party: 'Acacia Retail · fictional', kind: 'Receivable', issued: '2026-11-03', due: '2026-11-20', amount: 2800000, payments: [] },
  { id: 'DEMO-INV-1043', party: 'Mango Foods · fictional', kind: 'Receivable', issued: '2026-10-01', due: '2026-10-15', amount: 4200000, payments: [{ date: '2026-10-20', amount: 1200000 }] },
  { id: 'DEMO-INV-1031', party: 'Cedar Stores · fictional', kind: 'Receivable', issued: '2026-09-10', due: '2026-09-30', amount: 1600000, payments: [] },
  { id: 'DEMO-INV-1020', party: 'Willow Market · fictional', kind: 'Receivable', issued: '2026-07-01', due: '2026-07-31', amount: 900000, payments: [] },
  { id: 'DEMO-INV-1046', party: 'Cedar Stores · fictional', kind: 'Receivable', issued: '2026-10-25', due: '2026-11-10', amount: 1200000, payments: [{ date: '2026-11-04', amount: 1200000 }] },
  { id: 'DEMO-BILL-082', party: 'Atlas Materials · fictional', kind: 'Payable', issued: '2026-11-02', due: '2026-11-25', amount: 2100000, payments: [] },
  { id: 'DEMO-BILL-079', party: 'Pine Supplies · fictional', kind: 'Payable', issued: '2026-10-05', due: '2026-10-25', amount: 1800000, payments: [{ date: '2026-11-05', amount: 600000 }] },
  { id: 'DEMO-BILL-075', party: 'Fern Trading · fictional', kind: 'Payable', issued: '2026-09-12', due: '2026-10-01', amount: 750000, payments: [] },
  { id: 'DEMO-DRAFT-017', party: 'Acacia Retail · fictional', kind: 'Receivable', issued: '2026-11-06', due: '2026-11-30', amount: 950000, draft: true, payments: [] },
];
const monthly = [
  ['2026-06', 4200000, 2800000], ['2026-07', 4800000, 3400000], ['2026-08', 3900000, 3600000],
  ['2026-09', 5600000, 4100000], ['2026-10', 6200000, 4600000], ['2026-11', 3100000, 2200000],
] as const;
const movements: CashMovement[] = monthly.flatMap(([month, receipts, payments], index) => [
  { id: `DEMO-CASH-IN-${index}`, date: `${month}-04`, direction: 'in' as const, amount: receipts, description: 'Sample customer receipts' },
  { id: `DEMO-CASH-OUT-${index}`, date: `${month}-05`, direction: 'out' as const, amount: payments, description: 'Sample supplier and operating payments' },
]);

/** Isolated, cancellable in-memory fixtures. This module has no network or storage. */
export async function loadMockDashboard(period: PreviewPeriod, signal?: AbortSignal): Promise<DashboardSnapshot> {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, 180);
    signal?.addEventListener('abort', abort, { once: true });
  });
  return structuredClone({ mode: 'mock', currency: 'UGX', company: 'Preview company', period,
    asOf: period === '2026-11' ? '2026-11-06' : '2026-10-31', openingCash: 5000000,
    openingDate: '2026-06-01', documents, movements });
}

export const formatSampleMoney = (amount: number) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(amount);
export const compactSampleMoney = (amount: number) => new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 2 }).format(amount).toLowerCase();

export function summarizeDashboard(snapshot: DashboardSnapshot) {
  const documents = snapshot.documents.filter(row => row.issued <= snapshot.asOf);
  const posted = documents.filter(row => !row.draft).map(row => ({ ...row,
    outstanding: row.amount - row.payments.filter(payment => payment.date <= snapshot.asOf).reduce((total, payment) => total + payment.amount, 0) }));
  const movements = snapshot.movements.filter(row => row.date <= snapshot.asOf && row.date >= snapshot.openingDate);
  const total = (kind: SampleDocument['kind'], overdue = false) => posted.filter(row => row.kind === kind && (!overdue || row.due < snapshot.asOf)).reduce((sum, row) => sum + row.outstanding, 0);
  const periodMovements = movements.filter(row => row.date.startsWith(snapshot.period));
  const receipts = periodMovements.filter(row => row.direction === 'in').reduce((sum, row) => sum + row.amount, 0);
  const payments = periodMovements.filter(row => row.direction === 'out').reduce((sum, row) => sum + row.amount, 0);
  const cashBalance = snapshot.openingCash + movements.reduce((sum, row) => sum + (row.direction === 'in' ? row.amount : -row.amount), 0);
  const ageing = [
    { label: 'Not yet due', min: -Infinity, max: 0 }, { label: '1–30 days', min: 1, max: 30 },
    { label: '31–60 days', min: 31, max: 60 }, { label: '61+ days', min: 61, max: Infinity },
  ].map(bucket => ({ label: bucket.label, amount: posted.filter(row => {
    const days = Math.floor((Date.parse(snapshot.asOf + 'T00:00:00Z') - Date.parse(row.due + 'T00:00:00Z')) / 86400000);
    return row.kind === 'Receivable' && days >= bucket.min && days <= bucket.max;
  }).reduce((sum, row) => sum + row.outstanding, 0) }));
  const cashFlow = monthly.filter(([month]) => month <= snapshot.period).map(([month]) => ({ month,
    receipts: movements.filter(row => row.date.startsWith(month) && row.direction === 'in').reduce((sum, row) => sum + row.amount, 0),
    payments: movements.filter(row => row.date.startsWith(month) && row.direction === 'out').reduce((sum, row) => sum + row.amount, 0) }));
  return { posted, movements, receivables: total('Receivable'), payables: total('Payable'),
    overdueReceivables: total('Receivable', true), overduePayables: total('Payable', true),
    draftCount: documents.filter(row => row.draft).length, receipts, payments, cashBalance,
    netCashFlow: receipts - payments, ageing, cashFlow };
}
