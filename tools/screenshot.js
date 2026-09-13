/* Runs inside zenika/alpine-chrome:with-puppeteer (tools/screenshot.py copies it in): open the
   built view page at file:///site/<view>/, wait for the graph to lay out, run the requested
   actions through window.graphmed (the hooks tools/site/static/graph.js exposes), capture. */
const puppeteer = require("/usr/src/app/node_modules/puppeteer");
const spec = JSON.parse(process.argv[2]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
(async () => {
  const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium-browser", args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"] });
  const page = await browser.newPage();
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.setViewport({ width: spec.width, height: spec.height, deviceScaleFactor: spec.phone ? 2 : 1, isMobile: !!spec.phone, hasTouch: !!spec.phone });
  await page.goto(`file:///site/${spec.view}/index.html`, { waitUntil: "load" });
  await page.waitForFunction(() => window.graphmed && window.graphmed.cy.nodes().not(".folded").length > 0, { timeout: 20000 });
  await sleep(900);
  for (const [action, value] of spec.actions) {
    if (action === "wait") { await sleep(Number(value) || 500); continue; }
    if (action === "all") {   /* every patient group open, one tap at a time as a reader would */
      const ids = await page.evaluate(() => window.graphmed.cy.nodes("[type = 'junction']").map(j => j.id()));
      for (const id of ids) { await page.evaluate(id => window.graphmed.toggle(window.graphmed.cy.getElementById(id), true), id); await sleep(400); }
      await sleep(900); continue;
    }
    await page.evaluate((action, value) => {
      const g = window.graphmed;
      if (action === "toggle") g.toggle(g.cy.getElementById("j:" + value));
      else if (action === "fold") g.fold(g.cy.getElementById(value));
      else if (action === "reset") g.reset();
      else if (action === "open") g.open(value, false);
      else if (action === "section") g.section(value);
      else if (action === "search") g.search(value);
      else if (action === "facet") g.search(document.getElementById("search").value, value);
      else if (action === "chapters") document.getElementById("chapters-toggle").click();
      else if (action === "chapters-scroll") document.querySelector("#chapters .list").scrollTop = Number(value) || 0;
      else if (action === "fit") document.getElementById("fit").click();
      else throw new Error("unknown action " + action);
    }, action, value);
    await sleep(900);
  }
  await page.screenshot({ path: "/tmp/shot.png" });
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
  console.log(`${shown} elements shown, ${overlaps.length} overlapping pairs` + (errors.length ? `; page errors: ${errors.join(" | ")}` : ""));
  overlaps.slice(0, 40).forEach(p => console.log("  " + p));
  await browser.close();
})().catch(e => { console.error("screenshot failed: " + e.message + (errors.length ? "; page errors: " + errors.join(" | ") : "")); process.exit(1); });
