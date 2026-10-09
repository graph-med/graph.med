// The view check (card #278): the inline view's page, as the build writes it,
// in a browser, driven by a stand-in MCP Apps host — the standard's own host
// side (`AppBridge`, test/view-host.js) — over the server's tools. Chromium
// runs in a container on the sandbox's Docker daemon (the `screenshot`
// skill's image); the server runs here, in-process, over a local build.
//
//   uv run tools/build.py --origin http://localhost:8272
//   npm --prefix mcp run check:view -- --site ../site
//
// For every graph the index lists (none is named here), at a desktop and a
// phone width and once in the dark theme, it walks the grouping's root, an
// answer, a recommendation's card, back into the tree and back, and asks
// ping and the teardown (test/view-driver.cjs). It fails on a page error or
// a blocked load (the view runs under the CSP a host applies to a resource
// that declares none), a message outside the MCP Apps standard, a request
// sent twice, a step that draws nothing, an error or the wrong thing, a page
// wider than its frame, a click that reaches neither the tool nor the host,
// and an unanswered ping or teardown. Screenshots go to
// /tmp/graph.med/screenshots/<branch>/view/.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { createServerFactory } from '../src/server.js';
import { createHandler } from '../src/worker.js';

const IMAGE = 'zenika/alpine-chrome:with-puppeteer';
const SIZES = [[760, 900], [390, 844]];
// What a view may send its host (MCP Apps 2026-01-26): its requests and
// notifications; answers carry no method.
const VIEW_METHODS = new Set([
  'ui/initialize', 'ui/notifications/initialized', 'ui/notifications/size-changed', 'tools/call',
  'ui/open-link', 'ui/update-model-context', 'ui/message', 'ui/request-display-mode',
]);

const args = process.argv.slice(2);
const site = args[args.indexOf('--site') + 1];
if (!args.includes('--site') || !site) {
  console.error('usage: node test/view.js --site <dir built with --origin http://localhost:<port>>');
  process.exit(2);
}

const sh = (cmd, a) => execFileSync(cmd, a, { encoding: 'utf8' }).trim();
const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD']).replace(/[^A-Za-z0-9._-]+/g, '-');
const listen = (srv, port = 0, host) => new Promise((r) => srv.listen(port, host, () => r(srv.address().port)));

// The build, served at the origin it was built for.
const root = path.resolve(site);
const index = JSON.parse(await fs.readFile(path.join(root, 'index.json'), 'utf8'));
const base = index.llms_txt.replace(/llms\.txt$/, '');
const origin = new URL(base);
if (origin.hostname !== 'localhost') throw new Error(`${site} was built for ${base}; build it with --origin http://localhost:<port>`);
if (!index.mcp_app) throw new Error(`${site}: index.json lists no mcp_app`);
const files = http.createServer(async (req, res) => {
  const p = path.resolve(root, decodeURIComponent(req.url.split('?')[0]).slice(origin.pathname.length));
  if (!p.startsWith(root)) return res.writeHead(403).end();
  try {
    res.writeHead(200).end(await fs.readFile(p));
  } catch {
    res.writeHead(404).end();
  }
});
await listen(files, Number(origin.port));

// The server, the Worker's handler, on every interface: the container reaches it as `sandbox`. The handler
// refuses a Host it does not expect (DNS rebinding protection), so the request is passed on as localhost's.
const handler = createHandler(createServerFactory({ base }));
const mcp = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = { ...req.headers, host: 'localhost' };
  const r = await handler.fetch(new Request(`http://localhost${req.url}`, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }));
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
});
const port = await listen(mcp, 0, '0.0.0.0');

const host = (await build({ entryPoints: [new URL('./view-host.js', import.meta.url).pathname], bundle: true, format: 'iife', write: false, logLevel: 'warning' })).outputFiles[0].text;
const page = await fs.readFile(path.join(root, new URL(index.mcp_app.url).pathname.slice(origin.pathname.length)), 'utf8');

const tmp = await fs.mkdtemp('/tmp/graph.med-view-');
await fs.writeFile(path.join(tmp, 'host.js'), host);
await fs.writeFile(path.join(tmp, 'mcp-app.html'), page);
await fs.copyFile(new URL('./view-driver.cjs', import.meta.url), path.join(tmp, 'driver.cjs'));
const shots = `/tmp/graph.med/screenshots/${branch}/view`;
await fs.rm(shots, { recursive: true, force: true });
await fs.mkdir(shots, { recursive: true });

if (!sh('docker', ['images', '-q', IMAGE])) sh('docker', ['pull', '--quiet', IMAGE]);
const name = `view-${branch}`;
spawnSync('docker', ['rm', '-f', name]);
const spec = { mcp: `http://sandbox:${port}/mcp`, graphs: index.views.map((v) => v.id), sizes: SIZES };
sh('docker', ['create', '--name', name, '--add-host', 'sandbox:host-gateway', '--entrypoint', 'sh', IMAGE, '-c', `mkdir -p /tmp/shots && node /check/driver.cjs '${JSON.stringify(spec)}'`]);
let out;
try {
  sh('docker', ['cp', tmp + '/.', `${name}:/check`]);
  // Not spawnSync: the server answering the container runs in this process, on its event loop.
  const started = await new Promise((resolve) => {
    const child = spawn('docker', ['start', '-a', name]);
    const r = { stdout: '', stderr: '' };
    child.stdout.on('data', (d) => (r.stdout += d));
    child.stderr.on('data', (d) => (r.stderr += d));
    child.on('close', (status) => resolve({ ...r, status }));
  });
  if (started.status !== 0) throw new Error(`the driver failed:\n${started.stdout}${started.stderr}`);
  out = started.stdout;
  spawnSync('docker', ['cp', `${name}:/tmp/shots/.`, shots]);
} finally {
  spawnSync('docker', ['rm', '-f', name]);
  await fs.rm(tmp, { recursive: true, force: true });
  files.close();
  mcp.close();
}

// The report: each run's own failures, then what the messages show.
const runs = JSON.parse(out);
let failed = 0;
for (const run of runs) {
  const f = [...run.failures, ...run.errors.map((e) => `page error: ${e}`)];
  const methods = run.log.sent.filter((m) => m && m.method).map((m) => m.method);
  for (const m of new Set(methods)) if (!VIEW_METHODS.has(m)) f.push(`a message outside the standard: ${m}`);
  const ids = run.log.sent.filter((m) => m && m.method && m.id !== undefined).map((m) => m.id);
  const twice = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (twice.length) f.push(`requests sent twice: ${twice.join(', ')}`);
  const calls = run.log.toolCalls.map((c) => c.name);
  if (!calls.includes('get_tree_node') || !calls.includes('get_entity')) f.push(`tool calls from the view: ${calls.join(', ') || 'none'}`);
  if (!run.log.context.length) f.push('no ui/update-model-context');
  if (!run.log.messages.length) f.push('the ask button sent no ui/message');
  if (!run.log.modes.includes('fullscreen') || !run.fullscreenHidden) f.push('fullscreen: not requested, or its button stays');
  if (run.end.ping?.error) f.push(`ping: ${run.end.ping.error}`);
  if (run.end.teardown?.error) f.push(`teardown: ${run.end.teardown.error}`);
  console.log(`\n== ${run.graph} at ${run.size}`);
  console.log(`  steps: ${run.steps.map((s) => `${s.name} "${s.h1.slice(0, 40)}"`).join(' → ')}`);
  console.log(`  view → host: ${[...new Set(methods)].join(', ')}; tool calls ${calls.length}; context updates ${run.log.context.length}`);
  if (f.length) {
    failed++;
    console.log(`  FAILED (${f.length}):`);
    f.forEach((x) => console.log('   - ' + x));
  } else console.log('  passed');
}
console.log(`\nscreenshots: ${shots}`);
process.exit(failed ? 1 : 0);
