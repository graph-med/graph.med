/* Runs inside zenika/alpine-chrome:with-puppeteer (tools/screenshot.py copies it in): open a page
   of the built site at file:///site/<path>, and on a page with a graph wait for it to lay out and run
   the requested actions through window.graphmed (the hooks tools/site/static/graph.js exposes on a
   view page; home.js on the index and path.js on a path view expose `open` alone); capture the viewport, or
   the whole page with spec.full. A view page takes every action; the index takes open=<view id>, a path view
   open=<statement id or step:<n>>, and both sheet, graph, key=<key> and wait; any other page (an entity page)
   key= and wait. Any other action fails with its name, and
   what the page takes, before anything runs. Every page reports whether it is wider than the viewport,
   and where the focus is when it is not on the page itself. */
const puppeteer = require("/usr/src/app/node_modules/puppeteer");
const spec = JSON.parse(process.argv[2]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const calls = [];   /* what each call= answered, for the report */
const ANYWHERE = new Set(["wait", "key"]);   /* what a page without the graph takes */
const INDEX = new Set([...ANYWHERE, "open", "sheet", "graph"]);   /* what the index takes: its graph selects a guideline's box, and nothing else */
(async () => {
  const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium-browser", args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"] });
  const page = await browser.newPage();
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.setViewport({ width: spec.width, height: spec.height, deviceScaleFactor: spec.phone ? 2 : 1, isMobile: !!spec.phone, hasTouch: !!spec.phone });
  if (spec.dark) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);   /* before the load: the graph reads its colours once, when drawn */
  await page.goto(`file:///site/${spec.file}`, { waitUntil: "load" });
  /* a view page carries its graph's data; the index draws its graph from its own sheet */
  const kind = await page.evaluate(() => !document.getElementById("graph") ? "other" : document.getElementById("graph-data") ? "view"
                                         : document.getElementById("path-data") ? "path" : "index");
  if (kind === "other") return other(browser, page);
  if (kind === "index") refuse(INDEX, "the index", "open=<view id>, sheet, graph, key=<key> and wait");
  if (kind === "path") refuse(INDEX, "a path view", "open=<statement id or step:<n>>, sheet, graph, key=<key> and wait");
  await page.waitForFunction(() => window.graphmed && window.graphmed.cy.nodes().not(".folded").length > 0, { timeout: 20000 });
  await sleep(900);
  for (const [action, value] of spec.actions) {
    if (action === "wait") { await sleep(Number(value) || 500); continue; }
    if (action === "key") {
      const before = page.url();
      await press(page, value); await sleep(400);
      if (page.url().split("#")[0] !== before.split("#")[0])   /* a key that follows a link leaves the page: nothing of it is captured */
        throw new Error(`key=${value} followed a link to ${page.url().replace("file:///site/", "")}; a followed link cannot be captured, so stop the keys before it`);
      continue;
    }
    /* a session tool, called as an assistant calls it (window.graphmed.agent): its answer, its size and what it says, in
       the report — and, where it was called without a size of its own (limit, part, the boxes of an act), whether it is
       over the size docs/publication.md §8 states: an act's brief answer 1.5 KB, any other answer 6 KB */
    if (action === "call") {
      const at = value.indexOf(":"), name = at < 0 ? value : value.slice(0, at), args = at < 0 ? {} : JSON.parse(value.slice(at + 1));
      const r = await page.evaluate((n, a) => window.graphmed.agent.call(n, a), name, args);
      const text = JSON.stringify(r), bytes = Buffer.byteLength(text);
      const sized = "limit" in args || "part" in args || "view" in args, cap = r.act ? 1536 : 6144;
      const says = r.error ? `refused: ${r.error}` + (r.hint ? ` (${r.hint})` : "") + (r.near ? `; near: ${r.near.map(n => n.id).join(", ")}` : "")
        : r.act ? `${r.act}: ` + (r.acted_on ? `${r.acted_on.in_view} of the ${r.acted_on.shown} shown acted on in view` + (r.acted_on.folded ? `, ${r.acted_on.folded} folded away` : "") : "done") + (r.boxes ? `, ${r.boxes.length} of ${r.total} boxes` : "")
        : r.hits ? `${r.hits.length} of ${r.total} hits` : r.parts ? `${r.parts.length} parts` + (r.parts.some(p => p.cut) ? ", some cut" : "")
        : r.boxes ? `${r.boxes.length} of ${r.total} boxes, ${r.boxes.filter(b => b.in_view).length} in view` : `the state: ${r.shown} boxes shown`;
      calls.push(`call ${name}: ${bytes} bytes` + (!sized && bytes > cap ? ` — over ${cap}` : "") + `, ${says}`,
                 "    " + (text.length > 1500 ? text.slice(0, 1500) + " …" : text));
      await settle(page); continue;
    }
    if (action === "graph" || action === "sheet") {   /* bring the graph or the details into view as a reader does */
      await page.evaluate(a => {
        /* on a phone a selection waits in a peek strip: `sheet` raises the panel by tapping it, `graph` lowers it again;
           where there is no strip (a wide screen, nothing selected), the page scrolls to the section instead */
        const peek = document.querySelector("#sheet .peek"), raised = document.querySelector("#sheet.raised");
        if (peek && peek.offsetParent !== null && (a === "sheet") !== !!raised) { peek.click(); return; }
        document.querySelector(a === "graph" ? ".graph-wrap" : "#sheet").scrollIntoView({ block: "start" });
      }, action);
      await sleep(400); continue;
    }
    if (action === "all") {   /* every patient group open, one tap at a time as a reader would */
      const ids = await page.evaluate(() => window.graphmed.cy.nodes("[type = 'junction']").map(j => j.id()));
      for (const id of ids) { await page.evaluate(id => window.graphmed.toggle(window.graphmed.cy.getElementById(id), true), id); await sleep(400); }
      await sleep(900); await settle(page); continue;
    }
    await page.evaluate((action, value) => {
      const g = window.graphmed;
      if (action === "toggle") g.toggle(g.cy.getElementById(value.indexOf("j:") === 0 ? value : "j:" + value));   /* a concept id, or a junction id in full (under an axis: j:<value>:<concept>) */
      else if (action === "by") g.by(value);
      else if (action === "fold") g.fold(g.cy.getElementById(value));
      else if (action === "back") document.getElementById("back").click();   /* the back button, pressed once */
      else if (action === "open") g.open(value, false);
      else if (action === "section") g.section(value);
      else if (action === "search") g.search(value);
      else if (action === "facet") g.search(document.getElementById("search").value, value);
      else if (action === "step") for (let i = Math.abs(Number(value) || 1); i--;) g.step(Number(value) < 0 ? -1 : 1);   /* n steps through the matches, back when negative */
      else if (action === "chapters") document.getElementById("chapters-toggle").click();
      else if (action === "legend") document.getElementById("legend-toggle").click();   /* collapse or expand the legend */
      else if (action === "chapters-scroll") document.querySelector("#chapters .list").scrollTop = Number(value) || 0;
      else if (action === "fit") document.getElementById("fit").click();
      else throw new Error("unknown action " + action);
    }, action, value);
    await sleep(900);
    await settle(page);   /* the next action, and the capture, start from the view this one left */
  }
  await page.screenshot(spec.full ? { path: "/tmp/shot.png", fullPage: true } : { path: "/tmp/shot.png" });
  const shown = await page.evaluate(() => window.graphmed.cy.elements().not(".folded").length);
  /* what overlaps: every pair of shown nodes (with their labels) and edge labels whose boxes
     intersect by more than a pixel — the mechanical half of "nothing overlaps" (docs/publication.md §3) */
  const overlaps = await page.evaluate(() => {
    const cy = window.graphmed.cy, boxes = [];
    cy.nodes().not(".folded").forEach(n => { const b = n.boundingBox({ includeLabels: true, includeOverlays: false }); boxes.push({ id: n.id(), name: n.data("label") || n.id(), ...b }); });
    cy.edges().not(".folded").forEach(e => {
      if (!e.data("label")) return;
      const b = e.boundingBox({ includeEdges: false, includeLabels: true, includeOverlays: false });
      if (b.w > 0 && b.h > 0) boxes.push({ id: e.id(), name: "answer " + e.data("label"), ...b });
    });
    const pairs = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1), h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
      if (w > 1 && h > 1) pairs.push(`${a.name} × ${b.name} (${Math.round(w)}×${Math.round(h)})`);
    }
    /* and every edge drawn across a node it does not touch: a taxi edge as its three runs, a segments edge as the
       runs through its bends, any other as the straight line between its endpoints (a bezier bows a little) */
    const nodes = cy.nodes().not(".folded");
    const labels = boxes.filter(b => b.name.startsWith("answer "));
    function cuts(p, q, b) {   /* does segment p–q cross box b, shrunk by a pixel */
      const x1 = b.x1 + 1, y1 = b.y1 + 1, x2 = b.x2 - 1, y2 = b.y2 - 1;
      let t0 = 0, t1 = 1; const dx = q.x - p.x, dy = q.y - p.y;
      for (const [pp, qq] of [[-dx, p.x - x1], [dx, x2 - p.x], [-dy, p.y - y1], [dy, y2 - p.y]]) {
        if (pp === 0) { if (qq < 0) return false; continue; }
        const r = qq / pp;
        if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
      }
      return t0 <= t1;
    }
    cy.edges().not(".folded").forEach(e => {
      const s = e.sourceEndpoint(), t = e.targetEndpoint(), runs = [];
      if (e.style("curve-style") === "taxi") { const turn = Number(e.data("turn")) || 24, x = turn < 0 ? t.x + turn : s.x + turn; runs.push([s, { x, y: s.y }], [{ x, y: s.y }, { x, y: t.y }], [{ x, y: t.y }, t]); }
      else if (e.style("curve-style") === "segments") { const pts = [s, ...(e.segmentPoints() || []), t]; for (let i = 1; i < pts.length; i++) runs.push([pts[i - 1], pts[i]]); }   /* its runs through its bends (the index's indented tree, a path view) */
      else runs.push([s, t]);
      const name = `edge ${e.source().data("label") || e.source().id()} → ${e.target().data("label") || e.target().id()}`;
      nodes.forEach(n => {
        if (n.same(e.source()) || n.same(e.target())) return;
        const b = n.boundingBox({ includeLabels: true, includeOverlays: false });
        if (runs.some(([p, q]) => cuts(p, q, b))) pairs.push(`${name} across ${n.data("label") || n.id()}`);
      });
      /* the answer before a target is written on the final run of every edge into it: not an obstacle for those */
      const own = new Set(e.target().incomers("edge").map(f => f.id()));
      labels.forEach(b => { if (!own.has(b.id) && runs.some(([p, q]) => cuts(p, q, b))) pairs.push(`${name} across ${b.name}`); });
    });
    return pairs;
  });
  /* the last frame in view: of the nodes and answers the last fit framed (graph.js, `frame`), how many lie wholly in the
     visible part of the canvas — inside the canvas and the window, in the free row between the controls and the legend,
     above the strip a phone keeps a selection in —, each that does not by name, and the zoom it took: the mechanical
     half of "what a fit frames is in view, whole" (docs/publication.md §3). After the back button there is no frame:
     the view returned to is the one the reader left */
  const frame = await page.evaluate(() => {
    const g = window.graphmed, cy = g.cy, ids = new Set(g.frame ? g.frame() : []), zoom = cy.zoom().toFixed(2);
    if (!ids.size) return { zoom, n: 0, out: [] };
    const c = document.getElementById("graph").getBoundingClientRect(), f = document.getElementById("free").getBoundingClientRect();
    const s = document.getElementById("sheet");
    const strip = s && s.classList.contains("peeking") && getComputedStyle(s).position === "fixed" ? s.getBoundingClientRect().top : Infinity;
    const x1 = Math.max(c.left, 0) - c.left, x2 = Math.min(c.right, innerWidth) - c.left;
    const y1 = Math.max(c.top, f.top, 0) - c.top, y2 = Math.min(c.bottom, f.bottom, innerHeight, strip) - c.top;
    const items = [];
    cy.nodes().not(".folded").forEach(n => {
      if (ids.has(n.id())) items.push({ name: n.data("type") === "junction" ? "group " + (n.data("refs")[0] || n.id()) : n.data("label") || n.id(),   /* a group's label is its count */
                                        ...n.renderedBoundingBox({ includeLabels: true, includeOverlays: false }) });
    });
    cy.edges().not(".folded").forEach(e => {
      if (!ids.has(e.id()) || !e.data("label")) return;
      const b = e.renderedBoundingBox({ includeEdges: false, includeLabels: true, includeOverlays: false });
      if (b.w > 0 && b.h > 0) items.push({ name: "answer " + e.data("label"), ...b });
    });
    const out = items.filter(b => b.x1 < x1 - 1 || b.x2 > x2 + 1 || b.y1 < y1 - 1 || b.y2 > y2 + 1).map(b => b.name.replace(/\s+/g, " ").slice(0, 60));
    return { zoom, n: items.length, out };
  });
  const framing = frame.n ? `the last fit's ${frame.n} in view: ${frame.n - frame.out.length}` : "no fit framed";
  console.log(`${shown} elements shown, zoom ${frame.zoom}, ${framing}, ${overlaps.length} overlapping pairs; ${await across(page)}${await focus(page)}` + (errors.length ? `; page errors: ${errors.join(" | ")}` : ""));
  overlaps.slice(0, 40).forEach(p => console.log("  " + p));
  frame.out.slice(0, 40).forEach(n => console.log("  not in view: " + n));
  calls.forEach(c => console.log("  " + c));
  await browser.close();
})().catch(e => { console.error("screenshot failed: " + e.message + (errors.length ? "; page errors: " + errors.join(" | ") : "")); process.exit(1); });

/* the graph at rest before the capture: a layout and a fit animate, and on a busy machine they outlast the pause
   after an action, so the image would show a view the report, read after it, no longer has */
async function settle(page) {
  await page.waitForFunction(() => {
    const cy = window.graphmed && window.graphmed.cy;
    return !cy || (!cy.animated() && !cy.nodes().some(n => n.animated()));
  }, { timeout: 20000, polling: 100 });
  await sleep(150);
}

/* an action the page does not take fails before anything runs, naming itself and what the page takes */
function refuse(takes, what, list) {
  const needs = spec.actions.find(([a]) => !takes.has(a));
  if (needs) throw new Error(`action ${needs[0]}${needs[1] ? "=" + needs[1] : ""} needs a view page; ${spec.file} is ${what}, which takes ${list}`);
}

/* a page without the graph: a view action fails, naming itself; otherwise the page settles, and the
   report is its page errors and whether it is wider than the viewport — the mechanical half of
   "the page fits a phone" (docs/publication.md) */
async function other(browser, page) {
  refuse(ANYWHERE, "a page without a graph", "key=<key> and wait");
  await page.evaluate(() => document.fonts.ready);
  await sleep(300);
  for (const [action, value] of spec.actions) {
    if (action === "wait") await sleep(Number(value) || 500);
    else if (action === "key") {
      const before = page.url();
      await press(page, value); await sleep(400);
      if (page.url().split("#")[0] !== before.split("#")[0])
        throw new Error(`key=${value} followed a link to ${page.url().replace("file:///site/", "")}; a followed link cannot be captured, so stop the keys before it`);
    }
  }
  await page.screenshot(spec.full ? { path: "/tmp/shot.png", fullPage: true } : { path: "/tmp/shot.png" });
  const tall = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`no graph; ${await across(page)}, ${tall} px tall${await focus(page)}` + (errors.length ? `; page errors: ${errors.join(" | ")}` : ""));
  await browser.close();
}

/* key=<key>: a key pressed as a keyboard presses it — Tab, Enter, Escape, ArrowDown — with its modifiers joined by
   "+" (Shift+Tab); the way to check that a control is reached and works without a pointer */
async function press(page, value) {
  const keys = String(value || "").split("+").filter(Boolean);
  if (!keys.length) throw new Error("action key needs a key, e.g. key=Tab");
  const last = keys.pop();
  for (const k of keys) await page.keyboard.down(k);
  await page.keyboard.press(last);
  for (const k of keys.reverse()) await page.keyboard.up(k);
}

/* where the focus is, when it is not on the page itself: the element, its class, its words and whether it is
   pressed — what a key= run reached */
async function focus(page) {
  const at = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return "";
    const words = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
    const pressed = el.getAttribute("aria-pressed");
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""}`
      + (words ? ` "${words.length > 60 ? words.slice(0, 57) + "…" : words}"` : "") + (pressed ? ` (pressed ${pressed})` : "");
  });
  return at ? `; focus on ${at}` : "";
}

/* whether the page is wider than the viewport — the mechanical half of "the page fits a phone". Measured against
   the width asked for as well: a phone's layout viewport (innerWidth) widens to a page that overflows it */
async function across(page) {
  const [wide, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  const view = Math.min(inner, spec.width);
  return wide > view ? `overflows horizontally: ${wide} px wide at ${view}` : `fits ${view} px across`;
}
