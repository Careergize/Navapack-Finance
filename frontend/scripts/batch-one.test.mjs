import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
after(() => server.close());
const { loadMockDashboard, summarizeDashboard, formatSampleMoney } = await server.ssrLoadModule('/src/batch1/mockProvider.ts');
const { BatchOnePreview } = await server.ssrLoadModule('/src/batch1/BatchOnePreview.tsx');
const { Dashboard } = await server.ssrLoadModule('/src/batch1/Dashboard.tsx');
const { PreviewState } = await server.ssrLoadModule('/src/batch1/components.tsx');

test('Batch 1 requires explicit acknowledgement and contains no credential input', () => {
  const markup = renderToStaticMarkup(React.createElement(BatchOnePreview));
  assert.match(markup, /Preview access is not Finance authorization/);
  assert.match(markup, /type="checkbox"/);
  assert.match(markup, /disabled=""/);
  assert.match(markup, /https:\/\/erp-frontend-six-mocha.vercel.app\/login/);
  assert.doesNotMatch(markup, /type="password"|type="email"|Sample financial summary/);
});

test('mock snapshots are isolated, cancellable and dated explicitly', async () => {
  const a = await loadMockDashboard('2026-11'); a.documents[0].amount = -1;
  const b = await loadMockDashboard('2026-11');
  assert.equal(b.documents[0].amount, 2800000);
  assert.equal(b.mode, 'mock'); assert.equal(b.asOf, '2026-11-06');
  assert.ok(b.documents.every(row => row.id.startsWith('DEMO-') && row.party.includes('fictional')));
  const pending = new AbortController(); const promise = loadMockDashboard('2026-11', pending.signal); pending.abort();
  await assert.rejects(promise, { name: 'AbortError' });
  await assert.rejects(loadMockDashboard('2026-11', pending.signal), { name: 'AbortError' });
});

test('November mock summaries reconcile; drafts do not affect balances', async () => {
  const snapshot = await loadMockDashboard('2026-11');
  const data = summarizeDashboard(snapshot);
  assert.equal(data.cashBalance, 12100000); assert.equal(data.receivables, 8300000); assert.equal(data.payables, 4050000);
  assert.equal(data.receipts, 3100000); assert.equal(data.payments, 2200000); assert.equal(data.netCashFlow, 900000);
  assert.equal(data.draftCount, 1);
  assert.equal(data.ageing.reduce((total, bucket) => total + bucket.amount, 0), data.receivables);
  assert.deepEqual(data.ageing.map(row => row.amount), [2800000, 3000000, 1600000, 900000]);
  snapshot.documents.find(row => row.draft).amount = 999999999;
  assert.equal(summarizeDashboard(snapshot).receivables, data.receivables);
});

test('October excludes future invoices, movements and settlements', async () => {
  const data = summarizeDashboard(await loadMockDashboard('2026-10'));
  assert.equal(data.receivables, 6700000); assert.equal(data.payables, 2550000);
  assert.equal(data.cashBalance, 11200000); assert.equal(data.netCashFlow, 1600000);
  assert.equal(data.draftCount, 0); assert.equal(data.cashFlow.length, 5);
  assert.ok(data.movements.every(row => row.date <= '2026-10-31'));
});

test('dashboard labels mock money, chart units and table data without live actions', async () => {
  const markup = renderToStaticMarkup(React.createElement(Dashboard, { snapshot: await loadMockDashboard('2026-11') }));
  assert.match(markup, /UGX is the sample currency/); assert.match(markup, /All figures, parties and references are fictional/);
  assert.match(markup, /View chart data/); assert.match(markup, /Sample monthly cash receipts and payments/);
  assert.match(markup, /No actions are enabled here/);
  assert.doesNotMatch(markup, /<form|<button|href="\/api/);
  assert.equal(formatSampleMoney(370000), '370,000');
});

test('shared state component has a readable loading state', () => {
  const markup = renderToStaticMarkup(React.createElement(PreviewState, { title: 'Loading sample dashboard…', loading: true }, 'Local fictional data'));
  assert.match(markup, /role="status"/); assert.match(markup, /Loading sample dashboard/);
});

test('Batch 1 imports no operational provider, authentication, storage or transport', () => {
  for (const file of readdirSync(new URL('../src/batch1/', import.meta.url)).filter(name => /\.tsx?$/.test(name))) {
    const source = readFileSync(new URL('../src/batch1/' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|axios|XMLHttpRequest|WebSocket|localStorage|sessionStorage|navapack_access|AuthContext|FinanceAccessContext|\/api\//, file);
    assert.doesNotMatch(source, /from ['"][^'"]*(?:backend|frappe|context\/)/, file);
  }
  const source = readFileSync(new URL('../src/batch1/components.tsx', import.meta.url), 'utf8');
  assert.match(source, /disabled title="Planned for a later batch"/);
  assert.match(source, /Posting disabled/);
});
