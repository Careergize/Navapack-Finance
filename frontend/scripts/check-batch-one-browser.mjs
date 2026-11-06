import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';

const server = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: false } });
const evidence = resolve('docs/batch-1');
const profile = await mkdtemp(join(tmpdir(), 'navapack-batch-one-'));
let browser, ws;
try {
  await mkdir(evidence, { recursive: true });
  await server.listen();
  const origin = server.resolvedUrls.local[0];
  browser = spawn(process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ['--headless', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    let output = ''; const timer = setTimeout(() => reject(Error('Browser startup timeout')), 15000);
    browser.stderr.on('data', chunk => { output += chunk; const match = output.match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
    browser.on('error', error => { clearTimeout(timer); reject(error); });
  });
  ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  let id = 0; const pending = new Map(); const requests = []; const errors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    const request = pending.get(message.id);
    if (request) { clearTimeout(request.timer); pending.delete(message.id); message.error ? request.reject(Error(message.error.message)) : request.resolve(message.result); }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const requestId = ++id; const timer = setTimeout(() => { pending.delete(requestId); reject(Error('CDP timeout: ' + method)); }, 12000); pending.set(requestId, { resolve, reject, timer }); ws.send(JSON.stringify({ id: requestId, method, params, sessionId })); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params = {}) => send(method, params, sessionId);
  const evaluate = async expression => { const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const wait = async expression => { const deadline = Date.now() + 15000; while (Date.now() < deadline) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 75)); } throw Error('UI timed out: ' + expression + '; ' + await evaluate('document.body.innerText')); };
  const click = text => evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(button=>button.textContent.trim()===${JSON.stringify(text)});if(!button)throw Error('Missing button');button.click()})()`);
  const choose = (label, value) => evaluate(`(()=>{const select=document.querySelector('select[aria-label=${JSON.stringify(label)}]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,${JSON.stringify(value)});select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const screenshot = async name => writeFile(join(evidence, name + '.png'), Buffer.from((await cdp('Page.captureScreenshot', { captureBeyondViewport: true })).data, 'base64'));
  const sampleReady = () => wait("document.querySelector('.b1-metric>strong')?.textContent==='12.1m'");
  await cdp('Network.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: origin + '#/batch-1/dashboard' });
  await wait("document.body.textContent.includes('Open dashboard preview')");
  assert.ok(await evaluate("document.querySelector('.b1-entry-card>.b1-primary').disabled"));
  assert.equal(await evaluate("!!document.querySelector('input[type=password],input[type=email]')"), false);
  assert.equal(await evaluate("document.querySelector('.b1-entry-card>a').href"), 'https://erp-frontend-six-mocha.vercel.app/login');
  await wait("document.querySelector('.b1-entry-card>img')?.naturalWidth>0");
  await screenshot('entry');
  await evaluate("document.querySelector('input[type=checkbox]').click()"); await click('Open dashboard preview');
  await sampleReady();
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.b1-metric>strong')].map(node=>node.textContent)"), ['12.1m', '8.3m', '4.05m', '900k']);
  assert.equal(await evaluate("document.querySelectorAll('.b1-sidebar nav button:disabled').length"), 7);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.b1-sidebar')).backgroundColor"), 'rgb(16, 45, 36)');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.b1-nav-active')).backgroundColor"), 'rgb(183, 239, 189)');
  await screenshot('dashboard-desktop');
  await evaluate("document.querySelector('.b1-chart-data').open=true");
  assert.ok(await evaluate("document.querySelector('.b1-chart-data').textContent.includes('6,200,000')"));
  await evaluate("document.querySelector('.b1-chart-data').open=false");
  await choose('Sample period', '2026-10');
  await wait("document.querySelector('.b1-metric>strong')?.textContent==='11.2m'");
  assert.ok(await evaluate("document.body.textContent.includes('2026-10-31')"));
  assert.equal(await evaluate("document.querySelector('.b1-bottom-grid').textContent.includes('DEMO-INV-1048')"), false);
  await choose('Sample period', '2026-11'); await sampleReady();
  for (const [scenario, title] of [['loading', 'Loading sample dashboard'], ['empty', 'No sample activity to display'], ['error', 'Unable to load preview'], ['unavailable', 'Finance service unavailable'], ['unconfigured', 'Accounting setup not assessed'], ['permission-denied', 'Finance access denied']]) {
    await choose('Preview scenario', scenario);
    await wait(`document.querySelector('.b1-state')?.textContent.includes(${JSON.stringify(title)})`);
    assert.ok(await evaluate("document.querySelector('.b1-safety-banner').textContent.includes('Posting disabled')"));
    assert.equal(await evaluate("!!document.querySelector('.b1-metrics')"), false);
    if (scenario === 'unconfigured') await screenshot('setup-not-assessed');
    if (scenario === 'error') { await click('Retry sample data'); await sampleReady(); }
    if (scenario === 'empty') { await click('Restore sample data'); await sampleReady(); }
  }
  await choose('Preview scenario', 'sample'); await sampleReady();
  await choose('Sample period', '2026-10'); await choose('Preview scenario', 'unavailable');
  await evaluate('new Promise(resolve=>setTimeout(resolve,350))');
  assert.ok(await evaluate("document.querySelector('.b1-state').textContent.includes('Finance service unavailable')"), 'Late mock loads must not overwrite selected state');
  await choose('Sample period', '2026-11'); await choose('Preview scenario', 'sample'); await sampleReady();
  await evaluate("document.querySelector('[aria-label=\"Refresh sample dashboard\"]').click()"); await sampleReady();
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait("document.querySelector('.b1-mobile-toggle').offsetWidth>0");
  await wait("getComputedStyle(document.querySelector('.b1-sidebar')).visibility==='hidden'");
  await wait("document.querySelector('.b1-sidebar').getBoundingClientRect().right<=0");
  assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'), 'No mobile page overflow');
  await screenshot('dashboard-mobile');
  await evaluate("document.querySelector('.b1-mobile-toggle').click()");
  await wait("document.querySelector('.b1-mobile-toggle').getAttribute('aria-expanded')==='true'");
  await wait("document.querySelector('.b1-sidebar').getBoundingClientRect().left>=11");
  assert.ok(await evaluate("document.activeElement===document.querySelector('.b1-mobile-close')"), JSON.stringify(await evaluate("({active:document.activeElement?.outerHTML.slice(0,180),visibility:getComputedStyle(document.querySelector('.b1-sidebar')).visibility,display:getComputedStyle(document.querySelector('.b1-mobile-close')).display,position:document.querySelector('.b1-sidebar').getBoundingClientRect().left})")));
  await screenshot('navigation-mobile');
  await evaluate("document.querySelector('.b1-brand').focus()");
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
  assert.ok(await evaluate("document.activeElement===document.querySelector('.b1-sidebar-bottom>button')"));
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait("document.querySelector('.b1-mobile-toggle').getAttribute('aria-expanded')==='false'");
  assert.ok(await evaluate("document.activeElement===document.querySelector('.b1-mobile-toggle')"));
  assert.equal(await evaluate('localStorage.length+sessionStorage.length'), 0);
  await cdp('Page.reload');
  await wait("document.body.textContent.includes('Open dashboard preview')");
  assert.ok(await evaluate("document.querySelector('.b1-entry-card>.b1-primary').disabled"));
  assert.ok(requests.every(request => request.method === 'GET'));
  assert.ok(requests.every(request => new URL(request.url).origin === new URL(origin).origin), 'No external transport');
  assert.ok(requests.every(request => !new URL(request.url).pathname.startsWith('/api/')), 'No Django/Frappe API request');
  assert.deepEqual(errors, []);
  const result = { outcome: 'PASS', mode: 'isolated mock preview', browser: 'headless Edge', screenshots: ['entry.png', 'dashboard-desktop.png', 'dashboard-mobile.png', 'navigation-mobile.png', 'setup-not-assessed.png'], checks: ['acknowledgement gate and refresh reset', 'sample totals and period changes', 'all seven scenarios', 'retry/restore and cancellation', 'Navapack shell colours', 'mobile layout/navigation/Escape/focus', 'zero API/external requests', 'no browser storage or runtime exceptions'], apiRequests: 0 };
  await writeFile(join(evidence, 'browser-evidence.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  ws?.close(); browser?.kill(); await server.close();
  assert.equal(resolve(dirname(profile)), resolve(tmpdir()));
  await new Promise(resolve => setTimeout(resolve, 300));
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
}
