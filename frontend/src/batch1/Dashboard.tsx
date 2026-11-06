import { ArrowDownLeft, ArrowUpRight, Clock3, FileText, Wallet } from 'lucide-react';
import { PreviewCard } from './components';
import { compactSampleMoney, formatSampleMoney, summarizeDashboard, type DashboardSnapshot } from './mockProvider';

export function Dashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const data = summarizeDashboard(snapshot);
  const scale = Math.max(1, ...data.cashFlow.flatMap(row => [row.receipts, row.payments])) * 1.12;
  const activity = data.posted.slice().sort((a, b) => b.issued.localeCompare(a.issued)).slice(0, 5);
  const metrics = [
    { label: 'Cash balance', value: data.cashBalance, description: 'From illustrative cash movements', icon: Wallet },
    { label: 'Accounts receivable', value: data.receivables, description: 'Outstanding sample invoices', icon: ArrowDownLeft },
    { label: 'Accounts payable', value: data.payables, description: 'Outstanding sample bills', icon: ArrowUpRight },
    { label: 'Net cash flow', value: data.netCashFlow, description: 'Receipts less payments this month', icon: Wallet },
  ];
  return <div className="b1-dashboard">
    <div className="b1-metrics" aria-label="Sample financial summary">{metrics.map(({ label, value, description, icon: Icon }) => <article className="b1-metric" key={label}><div><span>{label}</span><Icon size={18} /></div><strong>{compactSampleMoney(value)}</strong><small>{snapshot.currency} · sample</small><p>{description}</p></article>)}</div>
    <div className="b1-dashboard-grid">
      <PreviewCard title="Cash flow" subtitle="Illustrative receipts and payments · UGX millions" action={<span className="b1-neutral-badge">Sample cash movements</span>}>
        <div className="b1-chart-legend"><span><i />Receipts</span><span><i />Payments</span></div>
        <figure className="b1-chart"><svg viewBox="0 0 640 225" role="img" aria-labelledby="b1-chart-title b1-chart-description"><title id="b1-chart-title">Sample monthly cash receipts and payments</title><desc id="b1-chart-description">Monthly cash movements from June through the selected preview month. Exact figures are available in View chart data below.</desc>
          {[0, 1, 2, 3].map(index => <g key={index}><line x1="52" x2="620" y1={180 - index * 50} y2={180 - index * 50} stroke="#e6eee8" /><text x="40" y={184 - index * 50} textAnchor="end">{(scale * index / 3 / 1000000).toFixed(1)}</text></g>)}
          {data.cashFlow.map((row, index) => { const x = 90 + index * (500 / data.cashFlow.length); return <g key={row.month}><rect x={x} y={180 - row.receipts / scale * 150} width="23" height={row.receipts / scale * 150} rx="3" fill="#16803d" /><rect x={x + 28} y={180 - row.payments / scale * 150} width="23" height={row.payments / scale * 150} rx="3" fill="#bdcec4" /><text x={x + 25} y="207" textAnchor="middle">{new Date(row.month + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</text></g>; })}
        </svg><figcaption>Sample period ending {snapshot.asOf}. These figures are not a financial statement.</figcaption></figure>
        <details className="b1-chart-data"><summary>View chart data</summary><div className="b1-table-scroll"><table><caption className="b1-sr-only">Monthly sample cash movements in UGX</caption><thead><tr><th scope="col">Month</th><th scope="col">Receipts · UGX</th><th scope="col">Payments · UGX</th></tr></thead><tbody>{data.cashFlow.map(row => <tr key={row.month}><th scope="row">{row.month}</th><td>{formatSampleMoney(row.receipts)}</td><td>{formatSampleMoney(row.payments)}</td></tr>)}</tbody></table></div></details>
        <div className="b1-cash-totals"><div><span>This month’s receipts</span><strong>{formatSampleMoney(data.receipts)} <small>UGX</small></strong></div><div><span>This month’s payments</span><strong>{formatSampleMoney(data.payments)} <small>UGX</small></strong></div></div>
      </PreviewCard>
      <PreviewCard title="Needs attention" subtitle="A quick look at the fictional workspace">
        <div className="b1-attention-item"><span className="b1-attention-icon"><Clock3 size={19} /></span><div><strong>Overdue receivables</strong><p>Sample invoices past their due date</p></div><b>{compactSampleMoney(data.overdueReceivables)}<small>UGX</small></b></div>
        <div className="b1-attention-item"><span className="b1-attention-icon"><Wallet size={19} /></span><div><strong>Overdue payables</strong><p>Sample bills awaiting payment</p></div><b>{compactSampleMoney(data.overduePayables)}<small>UGX</small></b></div>
        <div className="b1-attention-item"><span className="b1-attention-icon"><FileText size={19} /></span><div><strong>Draft documents</strong><p>Excluded from summary balances</p></div><b>{data.draftCount}<small>sample</small></b></div>
        <div className="b1-review-note">Review and approval screens are planned for later batches. No actions are enabled here.</div>
      </PreviewCard>
    </div>
    <div className="b1-dashboard-grid b1-bottom-grid">
      <PreviewCard title="Receivables ageing" subtitle={'Outstanding sample invoices as of ' + snapshot.asOf}>
        <div className="b1-ageing">{data.ageing.map(bucket => <div key={bucket.label}><span>{bucket.label}</span><div className="b1-age-track"><span style={{ width: `${data.receivables ? bucket.amount / data.receivables * 100 : 0}%` }} /></div><strong>{compactSampleMoney(bucket.amount)}</strong></div>)}</div>
        <div className="b1-age-total"><span>Total receivables</span><strong>{formatSampleMoney(data.receivables)} UGX</strong></div>
      </PreviewCard>
      <PreviewCard title="Recent sample activity" subtitle="Read-only records · no posting or navigation to live documents">
        <div className="b1-table-scroll"><table><caption className="b1-sr-only">Recent fictional invoices and bills</caption><thead><tr><th scope="col">Reference / party</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col" className="b1-number">Outstanding · UGX</th></tr></thead><tbody>{activity.map(row => <tr key={row.id}><td><strong>{row.id}</strong><small>{row.party}</small></td><td>{row.issued.slice(5)}</td><td><span className={'b1-status ' + (!row.outstanding ? 'b1-status-paid' : row.due < snapshot.asOf ? 'b1-status-overdue' : '')}>{!row.outstanding ? 'Paid' : row.due < snapshot.asOf ? 'Overdue' : 'Not due'}</span></td><td className="b1-number">{formatSampleMoney(row.outstanding)}</td></tr>)}</tbody></table></div>
      </PreviewCard>
    </div>
    <p className="b1-data-footnote">All figures, parties and references are fictional. UGX is the sample currency, not a configured client preference. The client’s CA will configure the real accounting workspace later.</p>
  </div>;
}
