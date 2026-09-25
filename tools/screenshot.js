/* Runs inside zenika/alpine-chrome:with-puppeteer (tools/screenshot.py copies it in): open a page
   of the built site at file:///site/<path>, and on a page with a graph wait for it to lay out and run
   the requested actions through window.graphmed (the hooks tools/site/static/graph.js exposes on a
   view page; home.js on the index exposes `open` alone); capture the viewport, or the whole page with
   spec.full. A view page takes every action; the index takes open=<view id>, sheet, graph, key=<key>
   and wait; any other page (an entity page) key= and wait. Any other action fails with its name, and
   what the page takes, before anything runs. Every page reports whether it is wider than the viewport,
   and where the focus is when it is not on the page itself. */
const puppeteer = require("/usr/src/app/node_modules/puppeteer");
const spec = JSON.parse(process.argv[2]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
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
  const kind = await page.evaluate(() => !document.getElementById("graph") ? "other" : document.getElementById("graph-data") ? "view" : "index");
  if (kind === "other") return other(browser, page);
  if (kind === "index") refuse(INDEX, "the index", "open=<view id>, sheet, graph, key=<key> and wait");
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
      await sleep(900); continue;
    }
    await page.evaluate((action, value) => {
      const g = window.graphmed;
      if (action === "toggle") g.toggle(g.cy.getElementById(value.indexOf("j:") === 0 ? value : "j:" + value));   /* a concept id, or a junction id in full (under an axis: j:<value>:<concept>) */
      else if (action === "by") g.by(value);
      else if (action === "fold") g.fold(g.cy.getElementById(value));
      else if (action === "reset") g.reset();
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
    /* and every edge drawn across a node it does not touch: a taxi edge as its three runs, any other
       as the straight line between its endpoints (a bezier bows a little, a segment is the least it covers) */
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
  console.log(`${shown} elements shown, ${overlaps.length} overlapping pairs; ${await across(page)}${await focus(page)}` + (errors.length ? `; page errors: ${errors.join(" | ")}` : ""));
  overlaps.slice(0, 40).forEach(p => console.log("  " + p));
  await browser.close();
})().catch(e => { console.error("screenshot failed: " + e.message + (errors.length ? "; page errors: " + errors.join(" | ") : "")); process.exit(1); });

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
