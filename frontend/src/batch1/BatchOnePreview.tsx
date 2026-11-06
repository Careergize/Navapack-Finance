import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { PreviewFrame, PreviewState } from './components';
import { loadMockDashboard, type DashboardSnapshot, type PreviewPeriod, type PreviewScenario } from './mockProvider';
import './batch-one.css';

const scenarios: [PreviewScenario, string][] = [['sample', 'Sample dashboard'], ['loading', 'Loading'], ['empty', 'Empty'], ['error', 'Loading error'], ['unavailable', 'Service unavailable'], ['unconfigured', 'Setup not assessed'], ['permission-denied', 'Permission denied']];

export function BatchOnePreview() {
  const [entered, setEntered] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [period, setPeriod] = useState<PreviewPeriod>('2026-11');
  const [scenario, setScenario] = useState<PreviewScenario>('sample');
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setSnapshot(null); setFailed(false);
    if (!entered || scenario !== 'sample') return () => controller.abort();
    loadMockDashboard(period, controller.signal).then(result => {
      if (!controller.signal.aborted) setSnapshot(result);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [entered, period, scenario, attempt]);
  const reset = () => { setScenario('sample'); setAttempt(value => value + 1); };
  if (!entered) return <div className="b1-root b1-entry"><div className="b1-entry-card"><img src="./assets/Nava-logo.png" alt="NavaPack" /><span className="b1-preview-pill">FINANCE PREVIEW · BATCH 1</span><h1>One clear view of<br />your finance workspace.</h1><p>Explore the Foundation and Dashboard design with fictional records. This preview does not connect to your ERP or post transactions.</p><div className="b1-entry-notice"><ShieldCheck size={22} /><div><strong>Preview access is not Finance authorization</strong><p>Your existing Navapack login and Finance permissions remain unchanged.</p></div></div><label className="b1-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />I understand these are sample figures.</label><button className="b1-primary" disabled={!acknowledged} onClick={() => setEntered(true)}>Open dashboard preview <ArrowRight size={17} /></button><a href="https://erp-frontend-six-mocha.vercel.app/login">Go to existing Navapack login <ArrowUpRight size={14} /></a><small>No credentials requested · No real accounting data</small></div></div>;
  let content;
  if (scenario === 'permission-denied') content = <PreviewState title="Finance access denied">This simulates a permission-denied view. It does not grant or change any real Finance permissions.</PreviewState>;
  else if (scenario === 'unconfigured') content = <PreviewState title="Accounting setup not assessed">This simulates an unconfigured workspace. No conclusion has been made about the client’s accounting setup. Configuration and approval belong to the client’s CA / Finance Manager.</PreviewState>;
  else if (scenario === 'unavailable') content = <PreviewState title="Finance service unavailable">This is a simulated connection state. No live request was attempted, and posting remains disabled.</PreviewState>;
  else if (scenario === 'error' || failed) content = <PreviewState title="Unable to load preview" action={<button className="b1-primary" onClick={reset}>Retry sample data</button>}>The sample loading-error state is active. Retry to return to the local fictional dashboard.</PreviewState>;
  else if (scenario === 'empty') content = <PreviewState title="No sample activity to display" action={<button className="b1-primary" onClick={reset}>Restore sample data</button>}>The empty preview contains no financial records. It does not indicate a zero balance in the client’s ERP.</PreviewState>;
  else if (scenario === 'loading' || !snapshot || snapshot.period !== period) content = <PreviewState title="Loading sample dashboard…" loading>Preparing the fictional summary. You can change the preview scenario at any time.</PreviewState>;
  else content = <Dashboard snapshot={snapshot} />;
  return <PreviewFrame leave={() => { setEntered(false); setAcknowledged(false); setSnapshot(null); setScenario('sample'); setPeriod('2026-11'); }}>
    <div className="b1-page-heading"><div><span className="b1-eyebrow">FINANCE / OVERVIEW</span><h1>Finance dashboard</h1><p>A clear view of your sample cash, balances and activity.</p></div><div className="b1-period-controls"><label>Sample period<select aria-label="Sample period" value={period} onChange={event => setPeriod(event.target.value as PreviewPeriod)}><option value="2026-11">November 2026</option><option value="2026-10">October 2026</option></select></label><button className="b1-icon-button" onClick={reset} aria-label="Refresh sample dashboard" title="Reload local fixtures"><RefreshCw size={17} /></button></div></div>
    <div className="b1-context"><div><span className="b1-company-icon">NP</span><span><strong>Preview company</strong><small>Fictional workspace · UGX sample figures</small></span></div><label>Preview scenario<select aria-label="Preview scenario" value={scenario} onChange={event => setScenario(event.target.value as PreviewScenario)}>{scenarios.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
    {content}
  </PreviewFrame>;
}
