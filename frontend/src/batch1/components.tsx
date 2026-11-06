import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Building2, ChevronRight, CircleHelp, FileText, LayoutDashboard, ListTree, Menu, ShieldCheck, Wallet, X } from 'lucide-react';

export function PreviewCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="b1-card"><div className="b1-card-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

export function PreviewState({ title, children, action, loading = false }: { title: string; children: ReactNode; action?: ReactNode; loading?: boolean }) {
  return <div className="b1-state" role={loading ? 'status' : 'region'} aria-label={title}>
    {loading ? <span className="b1-spinner" aria-hidden="true" /> : <span className="b1-state-icon"><ShieldCheck size={25} /></span>}
    <h2>{title}</h2><p>{children}</p>{action}
  </div>;
}

const planned = [
  ['Chart of Accounts', ListTree], ['Receivables', ArrowUpRight], ['Payables', Wallet], ['General Ledger', BookOpen],
  ['Journals & Payments', FileText], ['Financial Reports', FileText], ['Finance Setup', Building2],
] as const;

export function PreviewFrame({ children, leave }: { children: ReactNode; leave: () => void }) {
  const [mobile, setMobile] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const closeControl = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const closeMenu = () => { setMobile(false); toggle.current?.focus(); };
  useEffect(() => {
    const resize = () => { if (window.innerWidth > 700) setMobile(false); };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    closeControl.current?.focus({ preventScroll: true });
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobile(false); toggle.current?.focus(); }
      if (event.key === 'Tab') {
        const elements = Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)') ?? []);
        const current = elements.indexOf(document.activeElement as HTMLElement);
        if ((event.shiftKey && current <= 0) || (!event.shiftKey && current === elements.length - 1)) {
          event.preventDefault(); elements[event.shiftKey ? elements.length - 1 : 0]?.focus();
        }
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [mobile]);
  return <div className="b1-root"><a className="b1-skip" href="#b1-dashboard-main">Skip to dashboard</a><div className="b1-shell">
    <aside className={'b1-sidebar' + (mobile ? ' b1-sidebar-open' : '')} id="b1-navigation" ref={sidebar}>
      <a className="b1-brand" href="#/batch-1/dashboard" aria-label="NavaPack Finance dashboard preview"><img src="./assets/Nava-logo.png" alt="NavaPack" /></a>
      <button className="b1-mobile-close" ref={closeControl} onClick={closeMenu} aria-label="Close preview navigation"><X size={18} /></button>
      <div className="b1-workspace"><span>Active workspace</span><strong>NavaPack Finance</strong><small>Design preview · Batch 1</small></div>
      <nav aria-label="Batch 1 Finance navigation"><h2>Finance workspace</h2><button className="b1-nav-active" aria-current="page" onClick={() => setMobile(false)}><LayoutDashboard size={18} />Dashboard</button>
        <h2 className="b1-planned-heading">Upcoming screens <span>Later batches</span></h2>
        {planned.map(([label, Icon]) => <button key={label} disabled title="Planned for a later batch"><Icon size={17} /><span>{label}</span><span className="b1-nav-planned">Planned</span></button>)}
      </nav>
      <div className="b1-sidebar-bottom"><div className="b1-offline"><span />Live accounting unavailable<small>No connection to Django or ERPNext</small></div><button onClick={leave}><ArrowLeft size={15} />Exit preview</button></div>
    </aside>
    {mobile && <button className="b1-scrim" aria-label="Close navigation" onClick={closeMenu} />}
    <div className="b1-main"><header className="b1-topbar"><div className="b1-breadcrumb"><button className="b1-mobile-toggle" ref={toggle} onClick={() => setMobile(value => !value)} aria-expanded={mobile} aria-controls="b1-navigation" aria-label={mobile ? 'Close Finance navigation' : 'Open Finance navigation'}>{mobile ? <X size={20} /> : <Menu size={20} />}</button><span>Workspace</span><ChevronRight size={14} /><strong>Finance</strong></div><div className="b1-profile"><span className="b1-preview-pill">MOCK PREVIEW</span><CircleHelp size={18} aria-hidden="true" /><span className="b1-avatar">PV</span><span>Preview user<small>Fictional workspace</small></span></div></header>
      <div className="b1-safety-banner"><span><ShieldCheck size={15} /><strong>Preview only</strong><span>Fictional data · No transactions can be posted</span></span><span>Posting disabled</span></div>
      <main id="b1-dashboard-main" tabIndex={-1}>{children}</main>
      <footer className="b1-footer"><span>© NavaPack · Finance Preview</span><span>Batch 1 / Foundation &amp; Dashboard</span></footer>
    </div>
  </div></div>;
}
