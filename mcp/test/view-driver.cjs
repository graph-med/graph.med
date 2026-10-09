/* The view check's driver (card #278), inside zenika/alpine-chrome:with-puppeteer (test/view.js copies it
   in with the host bundle and the page). The host page and the view are served by request interception at
   two origins, the view with the restrictive CSP a host applies when a resource declares none (MCP Apps
   2026-01-26, "Host Behavior"), in an iframe sandboxed to scripts. Each run (a graph, a size, the device's
   and the host's theme, a grouping) walks what a person does: the grouping's root, the first answer,
   "more" where it is offered, a recommendation (down the first answers until one is listed), back into the
   tree, back, the ask button, fullscreen; then ping and the teardown. Controls
   are found by their `data-act`, never by words. It writes one JSON report to stdout and a PNG per step
   under /tmp/shots. */
const puppeteer = require('/usr/src/app/node_modules/puppeteer');
const fs = require('fs');
const spec = JSON.parse(process.argv[2]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HOST = 'http://host.test/';
const VIEW = 'http://view.test/mcp-app.html';
const CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'none'";
const files = {
  [HOST]: { body: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:8px;background:#ddd}iframe{display:block;width:100%;border:0;background:#fff;height:200px}</style></head><body><iframe id="view" sandbox="allow-scripts"></iframe><script>${fs.readFileSync('/check/host.js', 'utf8')}</script></body></html>`, type: 'text/html' },
  [VIEW]: { body: fs.readFileSync('/check/mcp-app.html', 'utf8'), type: 'text/html', csp: CSP },
};

let rpc = 0;
async function mcp(method, params) {
  const r = await fetch(spec.mcp, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpc, method, params }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`the server answered ${r.status}: ${text.slice(0, 200)}`);
  const line = text.split('\n').find((l) => l.startsWith('data: '));
  const msg = JSON.parse(line ? line.slice(6) : text);
  if (msg.error) throw new Error(msg.error.message);
  return msg.result;
}

async function walk(browser, { graph, grouping, node, size: [width, height], device, host }, shot) {
  const dark = host === 'dark';   // the host's theme decides, whatever the device's
  const run = { graph, grouping, size: `${width}x${height}, device ${device}, host ${host}${grouping ? `, ${grouping}` : ''}`, steps: [], errors: [], failures: [] };
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: device }]);
  page.on('pageerror', (e) => run.errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') run.errors.push(m.text()); });
  page.on('requestfailed', (r) => run.errors.push(`request failed: ${r.url()}`));
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const f = files[req.url()];
    if (req.url() === HOST + 'favicon.ico') return req.respond({ status: 204, body: '' });   // the browser's own ask, not the view's
    if (!f) return req.respond({ status: 404, body: '' });
    req.respond({ status: 200, contentType: f.type, headers: f.csp ? { 'content-security-policy': f.csp } : {}, body: f.body });
  });
  await page.exposeFunction('mcp', mcp);
  await page.goto(HOST);
  // The host's start, bounded: a view that never initializes fails here with what it did send.
  const started = await Promise.race([
    page.evaluate((a) => window.startHost(a).then(() => 'ok', (e) => `error: ${e.message}`), { src: VIEW, tool: 'get_tree_node', args: { graph, ...(grouping ? { grouping } : {}), ...(node ? { node } : {}) }, theme: host }),
    sleep(20000).then(() => 'timeout'),
  ]);
  if (started !== 'ok') {
    run.failures.push(`the host's start: ${started}; the view sent ${JSON.stringify(await page.evaluate(() => window.viewLog.sent.map((m) => m.method ?? 'answer')))}`);
    run.log = await page.evaluate(() => window.viewLog);
    run.end = {};
    await page.close();
    return run;
  }
  const frame = () => page.frames().find((f) => f.url() === VIEW);
  const calls = () => page.evaluate(() => window.viewLog.toolCalls.length);

  // What the view shows: its heading, whether it is wider than its frame, and the frame's height.
  async function step(name, expect) {
    await sleep(300);
    const f = frame();
    const state = await f.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent.trim() ?? '',
      card: !!document.querySelector('.judgement'),
      error: document.querySelector('.error')?.textContent ?? null,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      items: document.querySelectorAll('.answer, li.rec').length,
      // the page's background, as a luminance 0–255: the host's theme reaches the view
      background: (([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b)(getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number)),
    }));
    if (dark !== state.background < 128) run.failures.push(`${name}: the host's theme is ${dark ? 'dark' : 'light'}, the view's background is not`);
    run.steps.push({ name, ...state });
    if (!state.h1 && !state.error) run.failures.push(`${name}: nothing drawn`);
    if (state.error) run.failures.push(`${name}: the view shows an error: ${state.error}`);
    if (state.overflow) run.failures.push(`${name}: wider than the view's frame`);
    if (expect && !expect(state)) run.failures.push(`${name}: not what the step leads to (${JSON.stringify(state)})`);
    await page.screenshot({ path: `/tmp/shots/${shot}-${run.steps.length}-${name}.png`, fullPage: true });
    return state;
  }
  // A click that calls a tool: done once the call is answered and drawn.
  async function click(selector, name, expect) {
    const before = await calls();
    const found = await frame().evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, selector);
    if (!found) { run.failures.push(`${name}: no ${selector}`); return null; }
    for (let i = 0; i < 50 && (await calls()) === before; i++) await sleep(100);
    await frame().waitForFunction(() => !document.querySelector('main.busy'), { timeout: 15000 }).catch(() => run.failures.push(`${name}: still busy`));
    return step(name, expect);
  }

  await frame()?.waitForSelector('h1', { timeout: 15000 }).catch(() => run.failures.push('root: never drawn'));
  let root = await step('root');
  // "more", where the node offers it: the lists grow, the heading stays.
  const more = async (before) => {
    if (!(await frame().$('[data-act="more"]'))) return before;
    run.more = true;
    return click('[data-act="more"]', 'more', (x) => x.h1 === before.h1 && x.items > before.items);
  };
  root = await more(root);
  let s = await click('.answer', 'answer', (x) => x.h1 && x.h1 !== root.h1);
  if (s) s = await more(s);
  for (let i = 0; i < 3 && s && !s.card && !(await frame().$('li.rec')); i++) s = await click('.answer', 'answer');
  if (s && !s.card) s = await click('li.rec', 'recommendation', (x) => x.card);
  if (s?.card) {
    const card = s.h1;
    await click('[data-act="in-tree"]', 'in-tree', (x) => !x.card);
    // back into the tree of the grouping walked, not the first
    const last = (await page.evaluate(() => window.viewLog.toolCalls)).filter((c) => c.name === 'get_tree_node').pop();
    if (grouping && last?.arguments?.grouping !== grouping) run.failures.push(`in-tree: into grouping ${last?.arguments?.grouping ?? 'the first'}, not ${grouping}`);
    const marked = await frame().evaluate(() => !!document.querySelector('.mark'));
    if (!marked) run.failures.push('in-tree: nothing marked');
    const back = await frame().evaluate(() => { const e = document.querySelector('[data-act="back"]'); if (e) e.click(); return !!e; });
    if (!back) run.failures.push('back: no button');
    await step('back', (x) => x.h1 === card);
  } else run.failures.push('no recommendation reached from the root through the first answers');
  await frame().evaluate(() => document.querySelector('[data-act="ask"]')?.click());
  await frame().evaluate(() => document.querySelector('[data-act="fullscreen"]')?.click());
  await sleep(500);
  const shown = await frame().evaluate(() => !!document.querySelector('[data-act="fullscreen"]'));
  run.log = await page.evaluate(() => window.viewLog);
  run.end = await page.evaluate(() => window.endHost());
  run.fullscreenHidden = !shown;
  await page.close();
  return run;
}

(async () => {
  const browser = await puppeteer.launch({ protocolTimeout: 60000, executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
  const runs = [];
  let n = 0;
  for (const r of spec.runs) runs.push(await walk(browser, r, `${++n}`));
  await browser.close();
  process.stdout.write(JSON.stringify(runs));
})().catch((e) => { console.error(e); process.exit(1); });
