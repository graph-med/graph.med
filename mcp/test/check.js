// The server's check (cards #272, #279, Verification): a scripted MCP client
// that drives the server over Streamable HTTP and walks every graph the index
// lists and every grouping it lists for each, comparing each result with the
// Layer 0 files it was read from. It names no graph and no grouping: they
// come from the index.
//
// The server is the Worker's own handler (src/worker.js, `createMcpHandler`
// of the Agents SDK): in-process in Node behind a local listener, or, with
// --worker, the Worker itself in Workers' local runtime (`wrangler dev`,
// workerd; local mode, no Cloudflare account).
//
//   node test/check.js --fixture                  the synthetic Layer 0 (test/fixture.js)
//   node test/check.js --site ../site             a local build, served here; build it with
//                                                 --origin http://localhost:<port> first
//   node test/check.js --base https://graph.med/preview/pr<N>/   a published site
//   node test/check.js --worker …                 the same, through `wrangler dev`
//
// Several targets may be given; it exits non-zero on any failure. Besides the
// walk it checks the transport (405 for GET and DELETE on /mcp, 404 elsewhere,
// ping, the initialize handshake of the 1.x SDK's client); with --worker it
// also counts each request's subrequests from the runtime's trace, against
// Workers' 50, and its CPU time from a profile of the isolate, against the
// 10 ms of Workers Free.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { Client as Client1 } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as Transport1 } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createHash } from 'node:crypto';
import { createServerFactory, callTool, UI_EXTENSION, UI_MIME, appUri } from '../src/server.js';
import { createHandler } from '../src/worker.js';
import { Layer0 } from '../src/layer0.js';
import * as words from '../src/descriptions.js';
import { QUOTE_CAP, MAX_DEPTH } from '../src/tools.js';
import * as fixture from './fixture.js';

const LIMIT_CHARS = 50000;
const CPU_MS = 10; // Workers Free, per request
const SUBREQUESTS = 50; // Workers, per request
const TOOLS = ['list_graphs', 'list_groupings', 'get_tree_node', 'get_entity', 'search', 'get_provenance'];
// The tools the inline view is linked to (card #278), as the card names them: not read from the server.
const VIEW_TOOLS = new Set(['get_tree_node', 'get_entity']);

// --- targets -------------------------------------------------------------------

let WORKER = false;
function parseArgs(argv) {
  const targets = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--worker') WORKER = true;
    else if (argv[i] === '--fixture') targets.push({ kind: 'fixture' });
    else if (argv[i] === '--site') targets.push({ kind: 'site', dir: argv[++i] });
    else if (argv[i] === '--base') targets.push({ kind: 'base', base: argv[++i] });
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!targets.length) targets.push({ kind: 'fixture' });
  return targets;
}

function listen(server, port = 0) {
  return new Promise((resolve) => server.listen(port, '::', () => resolve(server.address().port)));
}

// Every URL the static server is asked for, for the request log of a Worker
// run (in-process, the reader's onFetch records the same).
const served = [];

// The inline view (card #278; MCP Apps 2026-01-26). Where index.json lists the
// page: the extension in the capabilities, one ui:// resource named after the
// page's hash with the MCP App type, the page as built (its hash the index's,
// self-contained), and its URI on get_tree_node and get_entity only, nested
// (`_meta.ui.resourceUri`, never the flat key), without a domain. Then the
// same server over the same files without the page: no extension, no resource,
// no `_meta`, and every sample call's text the same — a host without the
// extension sees no difference either way.
async function checkApp(C, { client, index, base, sample, tools }) {
  const app = index.mcp_app;
  if (!app) {
    C.ok(!client.getServerCapabilities()?.extensions?.[UI_EXTENSION], 'the extension without a page in index.json');
    C.ok(tools.every((t) => !t._meta?.ui), 'a `_meta.ui` without a page in index.json');
    return;
  }
  const uri = appUri(app);
  C.ok(eq(client.getServerCapabilities()?.extensions?.[UI_EXTENSION], { mimeTypes: [UI_MIME] }), `initialize: the extension ${UI_EXTENSION} is not advertised with ${UI_MIME}`);
  for (const t of tools) {
    if (VIEW_TOOLS.has(t.name)) C.ok(eq(t._meta, { ui: { resourceUri: uri } }), `${t.name}: _meta ${JSON.stringify(t._meta)}, not {ui: {resourceUri: ${uri}}}`);
    else C.ok(!t._meta, `${t.name}: carries _meta ${JSON.stringify(t._meta)}`);
  }
  const { resources } = await client.listResources();
  C.ok(resources.length === 1 && resources[0].uri === uri && resources[0].mimeType === UI_MIME, `resources/list: ${JSON.stringify(resources.map((r) => [r.uri, r.mimeType]))}`);
  const { contents } = await client.readResource({ uri });
  const page = await (await fetch(app.url)).text();
  C.ok(contents.length === 1 && contents[0].uri === uri && contents[0].mimeType === UI_MIME, `resources/read: ${JSON.stringify(contents.map((c) => [c.uri, c.mimeType]))}`);
  C.ok(contents[0]?.text === page, 'resources/read: not the page index.json lists');
  C.ok(createHash('sha256').update(page).digest('hex') === app.sha256, 'the page\'s hash is not the one index.json lists');
  C.ok(!JSON.stringify(contents[0]?._meta ?? {}).includes('domain'), 'the resource carries _meta.ui.domain');
  // An earlier page's name (a host that kept an older tool list) reads the current page, under the name asked.
  const older = uri.replace(/[0-9a-f]{12}$/, '000000000000');
  const r0 = await client.readResource({ uri: older }).catch((e) => ({ error: e.message }));
  C.ok(r0.contents?.[0]?.uri === older && r0.contents?.[0]?.text === page && r0.contents?.[0]?.mimeType === UI_MIME, `resources/read of an earlier name: ${r0.error ?? JSON.stringify(r0.contents?.map((c) => c.uri))}`);
  C.ok(/^<!DOCTYPE html>/i.test(page), 'the page is not an HTML document');
  C.ok(!/<script[^>]+\bsrc=|<link[^>]+\bhref=|@import/i.test(page), 'the page loads a script or a stylesheet: it must be self-contained');
  C.count('inline view: tools linked', tools.filter((t) => t._meta?.ui).length);

  // Without the page: the same files, index.json without `mcp_app`.
  const bare = createServerFactory({
    base,
    fetch: async (u, o) => {
      const r = await fetch(u, o);
      if (u !== base + 'index.json') return r;
      const { mcp_app, ...rest } = await r.json();
      return new Response(JSON.stringify(rest), { status: r.status, headers: r.headers });
    },
  });
  const srv = await serveMcp(bare);
  const c2 = new Client({ name: 'graph-med-check-bare', version: '0' });
  await c2.connect(new StreamableHTTPClientTransport(new URL(srv.url)));
  C.ok(!c2.getServerCapabilities()?.extensions && !c2.getServerCapabilities()?.resources, 'without the page: an extension or resources advertised');
  C.ok((await c2.listTools()).tools.every((t) => !t._meta), 'without the page: a tool carries _meta');
  for (const [name, args] of Object.entries(sample)) {
    const a = await c2.callTool({ name, arguments: args });
    const b = await client.callTool({ name, arguments: args });
    C.ok(a.content[0].text === b.content[0].text, `${name}: the result differs without the page`);
    C.count('calls compared, with and without the page');
  }
  await c2.close();
  srv.close?.();
}

async function serveStatic(target) {
  if (target.kind === 'fixture') {
    const srv = http.createServer();
    const port = await listen(srv);
    const base = `http://localhost:${port}/`;
    const files = fixture.files(base);
    srv.on('request', (req, res) => {
      served.push(base + req.url.replace(/^\//, ''));
      const p = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '');
      if (!(p in files)) return res.writeHead(404).end();
      if (typeof files[p] === 'string') return res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(files[p]);
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(files[p]));
    });
    return { base, close: () => srv.close() };
  }
  const index = JSON.parse(await fs.readFile(path.join(target.dir, 'index.json'), 'utf8'));
  const base = index.llms_txt.replace(/llms\.txt$/, '');
  const u = new URL(base);
  if (u.hostname !== 'localhost') throw new Error(`${target.dir} was built for ${base}; build it with --origin http://localhost:<port>`);
  const root = path.resolve(target.dir);
  const srv = http.createServer(async (req, res) => {
    served.push(u.origin + req.url);
    const rel = decodeURIComponent(req.url.split('?')[0]).slice(u.pathname.length);
    const p = path.resolve(root, rel);
    if (!p.startsWith(root)) return res.writeHead(403).end();
    try {
      res.writeHead(200, { 'content-type': 'application/json' }).end(await fs.readFile(p));
    } catch {
      res.writeHead(404).end();
    }
  });
  await listen(srv, Number(u.port));
  return { base, close: () => srv.close() };
}

// The Streamable HTTP harness: the Worker's handler, behind node:http.
async function serveMcp(factory) {
  const handler = createHandler(factory);
  const srv = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await handler.fetch(
      new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      }),
    );
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  });
  const port = await listen(srv);
  return { url: `http://localhost:${port}/mcp`, close: () => srv.close() };
}

// The Worker in Workers' local runtime: `wrangler dev` (workerd), reading the
// base given, on a free port; ready once GET /mcp answers.
async function freePort() {
  const probe = http.createServer();
  const port = await listen(probe);
  await new Promise((r) => probe.close(r));
  return port;
}

async function serveWorker(base) {
  const port = await freePort();
  const inspector = await freePort();
  const bin = new URL('../node_modules/.bin/wrangler', import.meta.url).pathname;
  const args = ['dev', '--port', String(port), '--ip', '127.0.0.1', '--inspector-port', String(inspector), '--var', `LAYER0_BASE:${base}`, '--show-interactive-dev-session=false'];
  const child = spawn(bin, args, {
    cwd: new URL('..', import.meta.url).pathname,
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (out += d));
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error(`wrangler dev exited:\n${out}`);
    try {
      if ((await fetch(origin + '/mcp')).status === 405) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
    if (i === 119) throw new Error(`wrangler dev did not start:\n${out}`);
  }
  // Workers' local trace store: one top-level span per request, a child span
  // per fetch it made — the subrequests, counted by the runtime itself.
  const spans = async (sql) => {
    // A pooled connection the runtime has already closed fails once; retry.
    let r;
    for (let attempt = 1; !r; attempt++) {
      try {
        r = await fetch(origin + '/cdn-cgi/local/explorer/api/local/observability/query', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sql }),
        });
      } catch (e) {
        if (attempt === 3) throw new Error(`trace query failed: ${e.cause?.message || e.message}`);
      }
    }
    const j = await r.json();
    if (!j.success) throw new Error(`trace query: ${JSON.stringify(j.errors)}`);
    return j.result.rows;
  };
  // The store outlives a run (mcp/.wrangler/): start this one empty.
  await fetch(origin + '/cdn-cgi/local/explorer/api/local/observability/clear', { method: 'POST' });
  return {
    url: origin + '/mcp',
    inspector: `ws://127.0.0.1:${inspector}/ws`,
    spans,
    close: () =>
      new Promise((r) => {
        child.once('exit', r);
        child.kill('SIGTERM');
      }),
  };
}

// The transport itself: methods, paths, ping, and the initialize handshake
// of the 1.x SDK's client, whose results equal the 2.x client's.
async function checkTransport(C, url, client, sample) {
  const origin = new URL(url).origin;
  for (const method of ['GET', 'DELETE']) {
    const r = await fetch(url, { method, headers: { accept: 'text/event-stream' } });
    C.ok(r.status === 405, `${method} /mcp: ${r.status}, not 405`);
  }
  for (const p of ['/', '/mcp/', '/other']) {
    const r = await fetch(origin + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    C.ok(r.status === 404, `POST ${p}: ${r.status}, not 404`);
  }
  C.ok(eq(await client.ping(), {}), 'ping (2.x client)');
  const c1 = new Client1({ name: 'graph-med-check-1x', version: '0' });
  const t1 = new Transport1(new URL(url));
  await c1.connect(t1);
  const init = c1.getServerCapabilities();
  C.ok(!!init?.tools, 'initialize (1.x client): no tools capability');
  C.ok(eq(await c1.ping(), {}), 'ping (1.x client)');
  const l1 = await c1.listTools();
  const l2 = await client.listTools();
  C.ok(eq(l1.tools.map((t) => [t.name, t.title, t.annotations]), l2.tools.map((t) => [t.name, t.title, t.annotations])), 'tools/list: the 1.x client sees other tools');
  C.ok(eq(l1.tools.map((t) => t._meta ?? null), l2.tools.map((t) => t._meta ?? null)), 'tools/list: the 1.x client sees other `_meta`');
  const everything = JSON.stringify([init, c1.getServerVersion(), l1, l2]);
  C.ok(!/"domain"/.test(everything), 'a domain in initialize or tools/list');
  for (const [name, args] of Object.entries(sample)) {
    const a = await c1.callTool({ name, arguments: args });
    const b = await client.callTool({ name, arguments: args });
    C.ok(a.content[0].text === b.content[0].text, `${name}: the 1.x client's result ≠ the 2.x client's`);
    C.count('calls compared, 1.x and 2.x client');
  }
  const r = await c1.listResources().catch((e) => ({ error: e.message }));
  C.ok(!(r.resources || []).some((x) => x._meta?.ui?.domain), 'a resource carries _meta.ui.domain');
  await c1.close();
}

// CPU time per request against Workers' 10 ms, in workerd (--worker): V8's
// sampling profiler on the Worker's isolate, through the inspector
// `wrangler dev` opens, on a fresh isolate: the first call of each tool — the
// very first a cold isolate's, the others the first of their code and files —
// then every call of the walk again. A request's CPU is the samples inside
// its wall-clock window that are not idle, times the sampling interval. The
// profiler's own work is counted with it, so these are upper bounds. (Node is
// no stand-in: its Request, Response and streams are JavaScript compiled on
// first use, where workerd's are native, and zod compiles parsers with
// `new Function`, which Workers forbid.)
let rpcId = 0;
function rpcRequest(url, name, args) {
  return new Request(url, {
    method: 'POST',
    headers: { host: new URL(url).host, 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args } }),
  });
}

// A tools/call answered: its JSON-RPC result, or a thrown error.
async function answered(res) {
  const text = await res.text();
  const data = text.startsWith('{') ? text : (text.match(/^data: (.*)$/m) || [])[1];
  const j = data && JSON.parse(data);
  if (res.status !== 200 || !j?.result?.content) throw new Error(`tools/call: HTTP ${res.status}: ${text.slice(0, 200)}`);
  return j.result;
}

function cpuStats(byTool) {
  return Object.fromEntries(
    Object.entries(byTool).map(([k, xs]) => {
      xs.sort((a, b) => a - b);
      const over = xs.filter((x) => x > CPU_MS).length;
      return [k, { n: xs.length, median: xs[xs.length >> 1], p99: xs[Math.floor(xs.length * 0.99)], max: xs[xs.length - 1], over }];
    }),
  );
}

async function workerCpu(base, calls) {
  const w = await serveWorker(base);
  const ws = new WebSocket(w.inspector, { headers: { origin: 'https://devtools.devprod.cloudflare.dev' } });
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error(`inspector ${w.inspector} did not open`));
  });
  const pending = new Map();
  let n = 0;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id);
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      pending.set(++n, resolve);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  await send('Profiler.enable');
  await send('Profiler.setSamplingInterval', { interval: 100 });
  await send('Profiler.start');
  const windows = [];
  const call = async (name, args, first) => {
    const t0 = process.hrtime.bigint() / 1000n;
    await answered(await fetch(rpcRequest(w.url, name, args)));
    windows.push({ name, args, first, t0: Number(t0), t1: Number(process.hrtime.bigint() / 1000n) });
  };
  const seen = new Set();
  for (const [name, args] of calls) if (!seen.has(name)) seen.add(name), await call(name, args, true);
  for (const [name, args] of calls) await call(name, args, false);
  const { result } = await send('Profiler.stop');
  ws.close();
  await w.close();
  // Sample times (µs, the monotonic clock this process reads too), idle or not.
  const p = result.profile;
  const idle = new Set(p.nodes.filter((x) => x.callFrame.functionName === '(idle)').map((x) => x.id));
  const busy = [];
  let t = p.startTime;
  p.samples.forEach((id, i) => {
    t += p.timeDeltas[i];
    if (!idle.has(id)) busy.push(t);
  });
  const deltas = p.timeDeltas.slice(1).sort((a, b) => a - b);
  const interval = deltas[deltas.length >> 1] / 1000; // ms
  let j = 0;
  const first = {};
  const warm = {};
  for (const x of windows) {
    while (j < busy.length && busy[j] < x.t0) j++;
    let k = j;
    while (k < busy.length && busy[k] <= x.t1) k++;
    const ms = (k - j) * interval;
    if (x.first) first[x.name] = ms;
    else (warm[x.name] ||= []).push(ms);
    x.ms = ms;
  }
  const heaviest = windows.filter((x) => !x.first).sort((a, b) => b.ms - a.ms);
  return { interval, first, warm: cpuStats(warm), over: heaviest.filter((x) => x.ms > CPU_MS), heaviest: heaviest.slice(0, 5) };
}

// --- helpers -------------------------------------------------------------------

const rawCache = new Map();
async function raw(url) {
  if (!rawCache.has(url))
    rawCache.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`GET ${url}: ${r.status}`);
        return r.json();
      }),
    );
  return rawCache.get(url);
}

function strings(o, out = [], key = null) {
  if (typeof o === 'string') out.push({ key, s: o });
  else if (Array.isArray(o)) o.forEach((x) => strings(x, out, key));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) strings(v, out, k);
  return out;
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sortStr = (xs) => [...xs].map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).sort();
const sameSet = (a, b) => eq(sortStr(a), sortStr(b));

class Check {
  constructor(name) {
    this.name = name;
    this.failures = [];
    this.counts = {};
    this.maxChars = {};
    this.gets = {};
  }
  fail(msg) {
    if (this.failures.length < 200) this.failures.push(msg);
    else this.failures.length === 200 && this.failures.push('… more failures');
  }
  ok(cond, msg) {
    if (!cond) this.fail(msg);
    return cond;
  }
  count(k, n = 1) {
    this.counts[k] = (this.counts[k] || 0) + n;
  }
}

// --- the run -------------------------------------------------------------------

async function runTarget(target) {
  const stat = target.kind === 'base' ? { base: target.base, close() {} } : await serveStatic(target);
  const base = stat.base;
  const C = new Check(target.kind === 'site' ? `local build (${base})` : target.kind === 'fixture' ? `synthetic fixture (${base})` : base);
  // The request log: the reader's own in-process; through the Worker, what
  // the static server was asked for (none for a published base).
  const readerLog = [];
  const factory = createServerFactory({ base, onFetch: (u) => readerLog.push(u) });
  const mcp = WORKER ? await serveWorker(base) : await serveMcp(factory);
  const log = WORKER ? served : readerLog;
  const observable = !WORKER || target.kind !== 'base';
  if (WORKER) C.name += ' through wrangler dev';
  const client = new Client({ name: 'graph-med-check', version: '0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(mcp.url)));

  const index = await raw(base + 'index.json');
  // The disclaimer (card #291): the server's copy is the site's, as index.json
  // publishes it (a built site; the synthetic fixture has no banner), and the
  // server gives it as its instructions.
  if (target.kind !== 'fixture') C.ok(index.disclaimer === words.disclaimer, 'disclaimer: the server\'s copy differs from index.json');
  C.ok(client.getInstructions() === words.disclaimer, 'instructions: not the disclaimer');
  const forbiddenUrls = new Set(index.views.map((v) => v.json));
  const views = index.views;

  // One call through the transport; its text, parsed, and the GETs it made.
  async function call(name, args) {
    log.length = 0;
    const r = await client.callTool({ name, arguments: args });
    const text = r.content[0].text;
    const gets = [...log];
    if (observable) C.maxGets = Math.max(C.maxGets || 0, gets.length);
    for (const u of gets) {
      C.ok(u.startsWith(base), `${name} fetched outside the base: ${u}`);
      C.ok(!forbiddenUrls.has(u), `${name} fetched a view JSON: ${u}`);
    }
    C.ok(text.length < LIMIT_CHARS, `${name} ${JSON.stringify(args)}: ${text.length} characters`);
    C.maxChars[name] = Math.max(C.maxChars[name] || 0, text.length);
    C.count('calls');
    resultTexts.push([`${name} ${JSON.stringify(args)}`, text]);
    if (r.isError) return { error: JSON.parse(text).error, text, gets };
    return { ...JSON.parse(text), _text: text, _gets: gets };
  }
  const strip = ({ _text, _gets, ...r }) => r;

  // 1. tools/list
  const { tools } = await client.listTools();
  C.ok(sameSet(tools.map((t) => t.name), TOOLS), `tools/list: ${tools.map((t) => t.name).join(', ')}`);
  for (const t of tools) {
    C.ok(t.name.length <= 64, `${t.name}: name longer than 64`);
    C.ok(!!t.title && t.annotations?.readOnlyHint === true, `${t.name}: title or readOnlyHint missing`);
  }
  // No name, argument or description names a particular grouping, axis or
  // anchor slot of the data, or a patient group.
  const banned = new Set(['patient']);
  for (const v of views) {
    for (const g of v.groupings) {
      if (g.axis && g.axis !== 'section') banned.add(g.axis.toLowerCase()).add(g.axis.split('/').pop().toLowerCase());
      [g.label, g.short_label].filter(Boolean).forEach((x) => banned.add(x.toLowerCase()));
    }
    const lean = await raw(v.lean);
    if (lean.scope?.anchor_slot) banned.add(lean.scope.anchor_slot.toLowerCase());
  }
  const toolText = JSON.stringify(tools.map((t) => [t.name, t.title, t.description, t.inputSchema])).toLowerCase();
  for (const b of banned) C.ok(!toolText.includes(b), `tools/list names ${JSON.stringify(b)}`);

  // 8. Requests: cold, one call per tool on a fresh reader; warm, a repeat.
  //    Transport-agnostic: the direct call returns the transport's text.
  const v0 = views[0];
  const g0 = v0.groupings[v0.groupings.length - 1];
  const s0 = (await raw(v0.search)).entries;
  const sample = {
    list_graphs: {},
    list_groupings: { graph: v0.id },
    get_tree_node: { graph: v0.id, grouping: g0.axis, depth: MAX_DEPTH },
    get_entity: { entity: s0.find((e) => e.kind === 'statement').id, graph: v0.id },
    search: { query: (s0[0].short_label || s0[0].label).split(/\s+/)[0] },
    get_provenance: { entity: s0.find((e) => e.kind === 'statement').id },
  };
  for (const name of TOOLS) {
    const gets = [];
    const reader = new Layer0({ base, onFetch: (u) => gets.push(u) });
    const direct = await callTool(reader, name, sample[name]);
    const cold = gets.length;
    gets.length = 0;
    await callTool(reader, name, sample[name]);
    C.gets[name] = { cold, warm: gets.length };
    C.ok(gets.length === 0, `${name}: a repeated call fetched ${gets.length}`);
    const viaHttp = await client.callTool({ name, arguments: sample[name] });
    C.ok(viaHttp.content[0].text === direct.content[0].text, `${name}: the transport's result ≠ the direct call's: ${direct.content[0].text.slice(0, 200)}`);
  }
  await checkTransport(C, mcp.url, client, sample);
  await checkApp(C, { client, index, base, sample, tools });


  // 2. list_graphs, list_groupings
  const lg = [];
  for (let offset = 0; offset !== undefined; ) {
    const r = await call('list_graphs', offset ? { offset } : {});
    lg.push(...r.graphs);
    checkAbout(C, 'list_graphs', r.about);
    offset = r.next_offset;
  }
  C.ok(eq(lg.map((g) => g.id), views.map((v) => v.id)), 'list_graphs: not every view of the index');

  const quotes = new Set(); // the pool's quoted strings, collected below
  const leanStrings = new Set(strings(index).map((x) => x.s));

  for (const v of views) {
    const lean = await raw(v.lean);
    const search = await raw(v.search);
    strings(lean).forEach((x) => leanStrings.add(x.s));
    strings(search).forEach((x) => leanStrings.add(x.s));
    const S = new Map(search.entries.map((e) => [e.id, e]));
    const members = new Set([v.id, ...search.entries.map((e) => e.id), ...v.sources.map((s) => s.id), ...v.groupings.map((g) => g.axis)]);
    // The scope's general entries name concepts outside the view's filter
    // (a condition carried by an in_scope_of edge): Layer 0 names them there.
    strings(lean.scope || {}).forEach((x) => /^concepts\//.test(x.s) && members.add(x.s));
    const sourceSlugs = v.sources.map((s) => s.id.replace(/^sources\//, ''));
    const isMember = (id) => members.has(id) || sourceSlugs.some((s) => id.startsWith(`claims/${s}/`));

    const gr = await call('list_groupings', { graph: v.id });
    checkAbout(C, 'list_groupings', gr.about);
    C.ok(gr.groupings.length === v.groupings.length, `${v.id}: list_groupings count`);
    gr.groupings.forEach((g, k) => {
      const w = v.groupings[k];
      C.ok(g.axis === w.axis && g.label === w.label && g.short_label === w.short_label && g.kind === w.kind && eq(g.question, w.question) && g.default === (k === 0), `${v.id}: grouping ${k} differs from the index`);
      checkLink(C, v, w.axis, g.link, isMember);
    });
    checkIds(C, `list_groupings ${v.id}`, gr, isMember);

    // 3. Every grouping: the walk down from the root, node by node.
    for (const [k, g] of v.groupings.entries()) {
      const tree = await raw(g.tree);
      strings(tree).forEach((x) => leanStrings.add(x.s));
      tree.nodes.forEach((n) => {
        members.add(n.id);
        if (n.ref) members.add(n.ref);
      });
      tree.edges.forEach((e) => (e.refs || []).forEach((r) => members.add(r)));
      const T = indexTree(tree);
      const G = `${v.id} ${JSON.stringify(g.axis)}`;

      const root = await call('get_tree_node', { graph: v.id, grouping: g.axis });
      if (k === 0) C.ok(eq(strip(await call('get_tree_node', { graph: v.id })), strip(root)), `${G}: no grouping ≠ the first`);
      C.ok(root.node?.id === T.root.id, `${G}: no node ≠ the root`);

      const seen = new Set();
      const queue = [T.root.id];
      const recsReached = new Set();
      while (queue.length) {
        const id = queue.shift();
        if (seen.has(id)) continue;
        seen.add(id);
        const r = await fullNode(call, { graph: v.id, grouping: g.axis, node: id });
        if (r.error) {
          C.fail(`${G} ${id}: ${r.error}`);
          continue;
        }
        checkAbout(C, 'get_tree_node', r.about);
        checkIds(C, `get_tree_node ${G} ${id}`, r, isMember);
        checkLinksIn(C, v, g.axis, r.node, isMember);
        compareNode(C, G, r.node, T, lean, S);
        for (const a of r.node.asks) {
          queue.push(a.question.id);
          for (const x of a.answers) queue.push(x.to.id);
        }
        for (const x of r.node.recommendations) {
          queue.push(x.id);
          recsReached.add(x.id);
          x.aims.forEach((a) => queue.push(a.id));
        }
        (r.node.aims || []).forEach((a) => queue.push(a.id));
        if (r.node.type === 'statement') recsReached.add(r.node.id);

        // Addressed by the entity it names: that node, or a list holding it.
        const n = T.nodes.get(id);
        const ent = n.type !== 'root' && n.ref ? n.ref : null;
        if (ent && ent !== id) {
          const e = await call('get_tree_node', { graph: v.id, grouping: g.axis, node: ent });
          if (e.places) {
            C.count('entities at several nodes');
            C.ok(e.places.some((p) => p.node.id === id), `${G}: ${ent}'s places lack ${id}`);
          } else C.ok(e.node?.id === id, `${G}: ${ent} selects ${e.node?.id}, not ${id}`);
        }
        // A depth returns what the calls one level down return.
        if (n.type !== 'statement' && n.type !== 'aim') {
          const d1 = await call('get_tree_node', { graph: v.id, grouping: g.axis, node: id, depth: 1 });
          for (const b of d1.node.below || []) {
            const one = await call('get_tree_node', { graph: v.id, grouping: g.axis, node: b.id });
            C.ok(eq(b, one.node), `${G} ${id}: depth 1 ≠ the call for ${b.id}`);
          }
          await call('get_tree_node', { graph: v.id, grouping: g.axis, node: id, depth: MAX_DEPTH });
        }
      }
      const expected = [...T.nodes.keys()];
      const statementsInTree = tree.nodes.filter((n) => n.type === 'statement').map((n) => n.id);
      C.ok(expected.every((x) => seen.has(x)), `${G}: nodes not reached: ${expected.filter((x) => !seen.has(x)).slice(0, 5).join(', ')}`);
      C.counts[`${G}: nodes reached / in tree file`] = `${expected.filter((x) => seen.has(x)).length} / ${expected.length}`;
      C.counts[`${G}: recommendations reached / in tree file`] = `${statementsInTree.filter((x) => recsReached.has(x)).length} / ${statementsInTree.length}`;
    }

    // 4. get_entity: every concept and every recommendation of the search file.
    for (const e of search.entries) {
      const r = await fullEntity(call, { entity: e.id, graph: v.id });
      if (r.error) {
        C.fail(`get_entity ${e.id}: ${r.error}`);
        continue;
      }
      checkAbout(C, 'get_entity', r.about);
      checkIds(C, `get_entity ${e.id}`, r, isMember);
      const j = await raw(base + e.id + '.json');
      collectQuotes(j, quotes);
      if (j.type === 'concept') [j.label, j.short_label].filter(Boolean).forEach((x) => leanStrings.add(x));
      C.ok(r.graphs.length === 1 && r.graphs[0].graph.id === v.id, `get_entity ${e.id}: not kept to ${v.id}`);
      const pv = r.graphs[0];
      for (const x of strings(pv).filter((x) => x.key === 'link')) checkLink(C, v, null, x.s, isMember, true);
      if (e.kind === 'concept') {
        C.count('concepts read');
        const want = j.statements?.[v.id]?.held_by || [];
        C.ok(sameSet(pv.held_by.map((h) => ({ id: h.id, slot: h.slot })), want.map((h) => ({ id: h.id, slot: h.slot }))), `get_entity ${e.id}: held_by`);
        const where = j.appears_in?.[v.id] || {};
        const got = Object.fromEntries(pv.appears_in.map((a) => [a.grouping.axis, a.nodes.map((n) => n.node)]));
        C.ok(eq(got, Object.fromEntries(v.groupings.filter((g) => where[g.axis]).map((g) => [g.axis, where[g.axis]]))), `get_entity ${e.id}: appears_in`);
        for (const a of pv.appears_in) {
          const t = indexTree(await raw(v.groupings.find((g) => g.axis === a.grouping.axis).tree));
          for (const n of a.nodes) C.ok(t.nodes.has(n.node), `get_entity ${e.id}: ${n.node} is no node of ${a.grouping.axis}`);
          for (const n of a.nodes) checkLink(C, v, a.grouping.axis, n.link, isMember);
        }
      } else if (e.kind === 'statement') {
        C.count('recommendations read');
        const rel = [
          ...(j.edges.out || []).filter((x) => ['specializes', 'complements'].includes(x.kind)).map((x) => `${x.kind}>${x.to}`),
          ...(j.edges.in || []).filter((x) => ['specializes', 'complements'].includes(x.kind)).map((x) => `${x.kind}<${x.from}`),
        ].filter((x) => S.has(x.split(/[<>]/)[1]));
        C.ok(sameSet(pv.related.map((x) => `${x.relation}${x.direction === 'out' ? '>' : '<'}${x.other.id}`), rel), `get_entity ${e.id}: related`);
        for (const c of r.entity.claims) {
          const cj = await raw(base + c.id + '.json');
          collectQuotes(cj, quotes);
          C.ok(c.url === cj.meta.url, `get_entity ${e.id}: claim URL ${c.url} ≠ ${cj.meta.url}`);
        }
        // Provenance: the only verbatim text — each quote capped, each claim's
        // sentence whole as the site shows it — each with its link or page.
        const p = await call('get_provenance', { entity: e.id, graph: v.id });
        checkAbout(C, 'get_provenance', p.about, true);
        C.ok(p.quotes.length > 0, `get_provenance ${e.id}: no quote`);
        for (const q of p.quotes) {
          C.ok(q.quote.length <= QUOTE_CAP, `get_provenance ${e.id}: quote over the cap`);
          C.ok(!!q.link || (!!q.document && !!q.page), `get_provenance ${e.id}: a quote without link or page`);
          C.count('quotes returned by provenance');
        }
        const wortlaut = (j.card?.wortlaut || []).map((w) => w.id);
        C.ok(wortlaut.every((id) => p.sentences.some((x) => x.claim === id)), `get_provenance ${e.id}: a supporting claim's sentence missing`);
        await checkSentences(C, `get_provenance ${e.id}`, p, raw, base);
        for (const c of r.entity.claims) {
          const pc = await call('get_provenance', { entity: c.id, graph: v.id });
          C.ok(!pc.error && pc.quotes.every((q) => q.quote.length <= QUOTE_CAP), `get_provenance ${c.id}`);
          if (pc.error) continue;
          C.ok(pc.sentences.length >= 1 && pc.sentences[0].claim === c.id, `get_provenance ${c.id}: its own sentence missing`);
          await checkSentences(C, `get_provenance ${c.id}`, pc, raw, base);
        }
      }
    }

    // 5. search, within the view and across views.
    const probe = search.entries.find((e) => e.kind === 'statement');
    if (probe) {
      const word = (probe.short_label || probe.label).split(/\s+/).find((w) => w.length > 3) || (probe.short_label || probe.label);
      const r = await call('search', { query: word, graph: v.id });
      checkAbout(C, 'search', r.about);
      C.ok(r.groups.length === 1 && r.groups[0].hits.some((h) => h.id === probe.id) || r.groups[0].total > 20, `search ${JSON.stringify(word)}: ${probe.id} not found`);
      checkIds(C, `search ${v.id}`, r.groups[0], isMember);
      // Paging reaches every hit.
      const all = new Set();
      for (let offset = 0; offset !== undefined; ) {
        const pg = await call('search', { query: 'e', graph: v.id, limit: 50, offset });
        pg.groups[0].hits.forEach((h) => all.add(h.id));
        offset = pg.groups[0].next_offset;
        if (offset === undefined) C.ok(all.size === pg.groups[0].total, `search paging: ${all.size} of ${pg.groups[0].total}`);
      }
      const x = await call('search', { query: word });
      C.ok(eq(x.groups.map((g) => g.graph.id), views.map((w) => w.id)), 'search without a graph: not grouped per graph');
      for (const grp of x.groups) {
        const w = views.find((w) => w.id === grp.graph.id);
        const s2 = await raw(w.search);
        const ids = new Set(s2.entries.map((e) => e.id));
        C.ok(grp.hits.every((h) => ids.has(h.id)), `search: a hit under ${w.id} from elsewhere`);
      }
    }
  }

  // 6. A concept two graphs' claims reference, found from the data.
  const refsBySource = new Map();
  for (const [url, p] of rawCache) {
    if (!/\/claims\//.test(url)) continue;
    const j = await p.catch(() => null);
    if (!j) continue;
    const src = j.source?.at?.split('#')[0];
    for (const x of strings(j).filter((x) => /^concepts\//.test(x.s))) {
      if (!refsBySource.has(x.s)) refsBySource.set(x.s, new Set());
      refsBySource.get(x.s).add(src);
    }
  }
  const shared = [...refsBySource].find(([, s]) => s.size > 1);
  if (shared) {
    const cj = await raw(base + shared[0] + '.json');
    [cj.label, cj.short_label].filter(Boolean).forEach((x) => leanStrings.add(x));
    const r = await call('get_entity', { entity: shared[0] });
    C.counts['concept referenced by two graphs’ claims'] = `${shared[0]}: in ${r.graphs?.length ?? 0} graph(s)`;
    for (const grp of r.graphs || []) {
      const w = views.find((w) => w.id === grp.graph.id);
      const s2 = await raw(w.search);
      const ids = new Set([w.id, ...s2.entries.map((e) => e.id), ...w.sources.map((s) => s.id)]);
      for (const x of strings(grp).filter((x) => /^(statements|concepts)\//.test(x.s))) C.ok(ids.has(x.s), `get_entity ${shared[0]}: ${x.s} under ${w.id}`);
    }
  } else C.counts['concept referenced by two graphs’ claims'] = 'none in this target';

  // 7. The quote gate: no quoted string of the pool outside provenance.
  // A quote the quote-free files already carry inside a label (a concept
  // named in the source's words) is words of Layer 0, not a gate breach;
  // those are counted and named, not failed.
  const leanAll = [...leanStrings];
  const inLabels = [...quotes].filter((q) => leanAll.some((s) => s.includes(q)));
  const gated = [...quotes].filter((q) => q.length >= 2 && !inLabels.includes(q));
  C.counts['quotes that Layer 0 labels carry (not gated)'] = inLabels.length + (inLabels.length ? ': ' + inLabels.map((q) => JSON.stringify(q)).join(', ') : '');
  // Provenance is scanned too, without the places verbatim text may stand
  // there: `quotes` (capped, checked above) and `sentences` (claim sentences,
  // whole, checked above), each with the link that searches its quote, and a
  // claim's anchor link in its metadata.
  let scanned = 0;
  for (const [key, text] of resultTexts) {
    let result = JSON.parse(text);
    if (key.startsWith('get_provenance')) {
      const bare = (list) => (list || []).map(({ quote, sentence, link, ...rest }) => rest);
      const { link, ...provenance } = result.about?.provenance || {};
      result = { ...result, quotes: bare(result.quotes), sentences: bare(result.sentences), about: { ...result.about, provenance } };
    } else C.ok(!text.includes('"sentences"'), `quote gate: ${key} carries claim sentences`);
    scanned++;
    for (const { s } of strings(result)) {
      if (leanStrings.has(s)) continue;
      for (const q of gated)
        if (s.includes(q) || s.includes(encodeURIComponent(q))) C.fail(`quote gate: ${key} carries ${JSON.stringify(q.slice(0, 40))} in ${JSON.stringify(s.slice(0, 60))}`);
    }
  }
  C.counts['results scanned for quotes'] = scanned;
  C.counts['quoted strings of the pool checked'] = gated.length;

  await client.close();
  if (!observable) C.counts['request log'] = 'not observable for a published base through the Worker; the subrequests below count every fetch';
  else C.counts['most Layer 0 GETs in one call'] = C.maxGets;
  if (WORKER) {
    const [[requests]] = await mcp.spans('SELECT count(*) FROM spans WHERE parent_id IS NULL');
    const [[most]] = await mcp.spans(
      "SELECT coalesce(max(n), 0) FROM (SELECT count(*) AS n FROM spans WHERE kind = 'fetch' GROUP BY parent_id)",
    );
    C.counts['requests the Worker served (runtime trace)'] = requests;
    C.counts['most subrequests in one request (runtime trace)'] = most;
    C.ok(most <= SUBREQUESTS, `a request made ${most} subrequests, over ${SUBREQUESTS}`);
  }
  await mcp.close();
  const calls = resultTexts.map(([k]) => {
    const i = k.indexOf(' ');
    return [k.slice(0, i), JSON.parse(k.slice(i + 1))];
  });
  // Reported, not failed: a profile's figures are upper bounds.
  if (WORKER) C.cpu = await workerCpu(base, calls);
  stat.close();
  return C;
}

// Record every result's text for the quote gate.
const resultTexts = [];
async function fullNode(call, args) {
  const r = await call('get_tree_node', args);
  if (r.error || r.node?.next_offset === undefined) return r;
  // Page through the lists until every item is in.
  let offset = r.node.next_offset;
  while (offset !== undefined) {
    const p = await call('get_tree_node', { ...args, offset });
    p.node.asks.forEach((a, i) => r.node.asks[i].answers.push(...a.answers));
    r.node.recommendations.push(...p.node.recommendations);
    if (p.node.general) r.node.general.push(...p.node.general);
    offset = p.node.next_offset;
  }
  return r;
}

async function fullEntity(call, args) {
  const r = await call('get_entity', args);
  let offset = r.next_offset;
  while (offset !== undefined) {
    const p = await call('get_entity', { ...args, offset });
    p.graphs.forEach((g, i) => {
      for (const k of ['held_by', 'own', 'general']) if (g[k]) r.graphs[i][k].push(...g[k]);
    });
    offset = p.next_offset;
  }
  return r;
}

function indexTree(tree) {
  const nodes = new Map(tree.nodes.map((n) => [n.id, n]));
  const out = new Map();
  const into = new Map();
  for (const e of tree.edges) {
    (out.get(e.from) || out.set(e.from, []).get(e.from)).push(e);
    (into.get(e.to) || into.set(e.to, []).get(e.to)).push(e);
  }
  return { nodes, out, into, root: tree.nodes.find((n) => n.type === 'root') };
}

function compareNode(C, G, node, T, lean, S) {
  const id = node.id;
  const n = T.nodes.get(id);
  const outs = T.out.get(id) || [];
  C.ok(sameSet(node.parents.map((p) => `${p.node.id}|${p.edge}|${p.answer ?? ''}`), (T.into.get(id) || []).filter((e) => e.kind !== 'relation').map((e) => `${e.from}|${e.kind}|${e.kind === 'answer' ? e.label ?? '' : ''}`)), `${G} ${id}: parents`);
  const qs = n.type === 'question' ? [n] : outs.filter((e) => e.kind === 'flow').map((e) => T.nodes.get(e.to)).filter((m) => m.type === 'question');
  C.ok(eq(node.asks.map((a) => a.question.id), qs.map((q) => q.id)), `${G} ${id}: question`);
  node.asks.forEach((a, i) => {
    const want = (T.out.get(qs[i].id) || []).filter((e) => e.kind === 'answer');
    C.ok(a.question.label === qs[i].label, `${G} ${id}: question label`);
    C.ok(eq(a.answers.map((x) => [x.answer, x.refs.map((r) => r.id), x.to.id]), want.map((e) => [e.label, e.refs || [], e.to])), `${G} ${id}: answers`);
  });
  const recs = outs.filter((e) => e.kind === 'flow' && T.nodes.get(e.to).type === 'statement').map((e) => e.to);
  C.ok(eq(node.recommendations.map((r) => r.id), recs), `${G} ${id}: recommendations`);
  for (const r of node.recommendations) {
    const tn = T.nodes.get(r.id);
    C.ok(r.direction === (tn.direction ?? null) && r.grade === (tn.grade ?? null) && r.verb === (tn.verb ?? null), `${G} ${r.id}: direction, grade or verb ≠ the tree's`);
    C.ok(sameSet(r.aims.map((a) => a.id), (T.out.get(r.id) || []).filter((e) => e.kind === 'aim').map((e) => e.to)), `${G} ${r.id}: aims`);
  }
  if (Array.isArray(n.general)) {
    C.count('junctions with general recommendations');
    const ids = new Set(n.general);
    const want = (lean.scope?.concepts?.[n.ref]?.general || []).filter((x) => ids.has(x.id));
    C.ok(sameSet((node.general || []).map((x) => ({ id: x.id, anchor: x.anchor?.id ?? null, via: x.via?.id ?? null, condition: x.condition.map((c) => c.id) })), want.map((x) => ({ id: x.id, anchor: x.anchor ?? null, via: x.via ?? null, condition: x.condition || [] }))), `${G} ${id}: general ≠ scope's`);
    const own = lean.scope?.concepts?.[n.ref]?.own;
    if (own) C.ok(recs.every((r) => own.includes(r)), `${G} ${id}: a recommendation under it is not the concept's own`);
  } else C.ok(node.general === undefined, `${G} ${id}: general where the tree has none`);
  if (n.type === 'statement') {
    C.ok(sameSet(node.relations.map((r) => `${r.relation}|${r.direction}|${r.other.id}`), [...outs.filter((e) => e.kind === 'relation').map((e) => `${e.label}|out|${e.to}`), ...(T.into.get(id) || []).filter((e) => e.kind === 'relation').map((e) => `${e.label}|in|${e.from}`)]), `${G} ${id}: relations`);
  }
}

function checkAbout(C, name, about, verbatim = false) {
  C.ok(about && 'commit' in about && about.commit && 'review' in about && about.review && Array.isArray(about.sources) && 'license_note' in about && 'provenance' in about && about.disclaimer === words.disclaimer && 'repository_license' in about, `${name}: metadata incomplete`);
  if (verbatim) C.ok(about.quote_cap === QUOTE_CAP, `${name}: no quote cap`);
}

// Every id in a result belongs to the graph asked for.
function checkIds(C, where, result, isMember) {
  for (const { key, s } of strings(result)) {
    if (key === 'about' || key === 'sources' || key === 'id' && /^sources\//.test(s)) continue;
    if (/^(statements|concepts|claims|axes|views)\//.test(s)) C.ok(isMember(s), `${where}: ${s} is not of this graph`);
  }
}

function checkLinksIn(C, v, axis, node, isMember) {
  for (const { key, s } of strings(node)) if (key === 'link') checkLink(C, v, axis, s, isMember);
}

// A deep link: the view's page, `?by=` exactly when the grouping is not the
// first, and entity ids of the view after `#`.
function checkLink(C, v, axis, link, isMember, anyGrouping = false) {
  C.count('deep links checked');
  if (!C.ok(typeof link === 'string' && link.startsWith(v.url), `link ${link} is not under ${v.url}`)) return;
  const rest = link.slice(v.url.length);
  const m = /^(?:\?by=([^#]*))?(?:#(.*))?$/.exec(rest);
  if (!C.ok(!!m, `link ${link}: malformed`)) return;
  if (!anyGrouping) {
    const first = v.groupings[0].axis;
    if (axis === first) C.ok(m[1] === undefined, `link ${link}: ?by= for the first grouping`);
    else C.ok(m[1] !== undefined && decodeURIComponent(m[1]) === axis, `link ${link}: ?by= ≠ ${axis}`);
  }
  if (m[2]) for (const id of m[2].split(',')) C.ok(isMember(id) && !/^[qj]:/.test(id), `link ${link}: ${id} is no entity of ${v.id}`);
}

// Each claim sentence provenance returns is its claim's `label`, whole, with
// a link into the source or a page, and each claim once.
async function checkSentences(C, name, p, raw, base) {
  C.ok(Array.isArray(p.sentences), `${name}: no sentences`);
  C.ok(new Set(p.sentences.map((x) => x.claim)).size === p.sentences.length, `${name}: a claim's sentence twice`);
  for (const x of p.sentences) {
    const cj = await raw(base + x.claim + '.json');
    C.ok(x.sentence === cj.label, `${name}: the sentence of ${x.claim} is not its claim's, whole`);
    C.ok(!!x.link || !!x.page, `${name}: the sentence of ${x.claim} without link or page`);
    C.count('claim sentences returned by provenance');
  }
}

// The pool's quoted strings: every `quote`, and every claim sentence (the
// gate counts `claim.label`: only provenance returns it, whole — card #272,
// option 2, the maintainer's answer of 2026-09-28). A per-property quote equal
// to the value it backs (a grade as printed) is that value, carried as data.
function collectQuotes(j, quotes) {
  const values = new Set(strings({ grade: j.grade, verb: j.verb, consensus: j.consensus, evidence: j.evidence }).map((x) => x.s.toLowerCase()));
  (function walk(o, k) {
    if (Array.isArray(o)) o.forEach((x) => walk(x, k));
    else if (o && typeof o === 'object')
      for (const [key, v] of Object.entries(o)) {
        if (key === 'meta') continue;
        if (key === 'quote' && typeof v === 'string' && !values.has(v.toLowerCase())) quotes.add(v);
        else walk(v, key);
      }
  })(j);
  if (j.type === 'claim' && j.label) quotes.add(j.label);
  for (const w of j.card?.wortlaut || []) if (w.label) quotes.add(w.label);
}

// No tool module imports a transport or a Node module (ADR-0007): the tool
// code imports only its siblings, the server factory also the SDK's server
// and zod, the Worker's entry point also the Agents SDK's handler.
async function checkImports() {
  const dir = new URL('../src/', import.meta.url);
  const bad = [];
  for (const f of await fs.readdir(dir)) {
    const src = await fs.readFile(new URL(f, dir), 'utf8');
    for (const m of src.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)) {
      const spec = m[1];
      const allowed =
        spec.startsWith('./') ||
        (f === 'server.js' && (spec === '@modelcontextprotocol/server' || spec === 'zod')) ||
        (f === 'worker.js' && spec === 'agents/mcp/server');
      if (!allowed) bad.push(`${f} imports ${spec}`);
    }
    if (/\bprocess\.|\brequire\(|\bBuffer\b/.test(src)) bad.push(`${f} uses a Node global`);
  }
  return bad;
}

// --- main ----------------------------------------------------------------------

const targets = parseArgs(process.argv.slice(2));
let failed = 0;
const bad = await checkImports();
console.log(`imports of src/: ${bad.length ? 'FAILED: ' + bad.join('; ') : 'no Node module; the transport only in the Worker entry point'}`);
if (bad.length) failed++;
for (const t of targets) {
  resultTexts.length = 0;
  served.length = 0;
  rawCache.clear();
  const C = await runTarget(t);
  console.log(`\n== ${C.name}`);
  for (const [k, v] of Object.entries(C.counts)) console.log(`  ${k}: ${v}`);
  console.log(`  largest result per tool (characters): ${JSON.stringify(C.maxChars)}`);
  console.log(`  GETs per call, cold / repeated: ${Object.entries(C.gets).map(([k, v]) => `${k} ${v.cold}/${v.warm}`).join(', ')}`);
  const ms = (x) => x.toFixed(2);
  const stats = (m) => Object.entries(m).map(([k, v]) => `${k} ${v.n}: ${ms(v.median)} / ${ms(v.p99)} / ${ms(v.max)} / ${v.over}`).join(', ');
  if (C.cpu) {
    const w = C.cpu;
    console.log(`  CPU ms per request in workerd, profiled every ${ms(w.interval)} ms, first call of each tool on a fresh isolate: ${Object.entries(w.first).map(([k, v]) => `${k} ${ms(v)}`).join(', ')}`);
    console.log(`  CPU ms per request in workerd, warm (n, median / p99 / max / over ${CPU_MS} ms): ${stats(w.warm)}`);
    console.log(`  the heaviest warm calls (ms): ${w.heaviest.map((x) => `${ms(x.ms)} ${x.name} ${JSON.stringify(x.args)}`).join('; ')}`);
    const deep = w.over.filter((x) => x.args.depth > 0).length;
    console.log(`  warm calls over ${CPU_MS} ms: ${w.over.length}, of them with a depth: ${deep}`);
  }
  if (C.failures.length) {
    failed++;
    console.log(`  FAILED (${C.failures.length}):`);
    C.failures.forEach((f) => console.log('   - ' + f));
  } else console.log('  passed');
}
process.exit(failed ? 1 : 0);
