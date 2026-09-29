/* graph.med index: where the graphs meet, drawn as they are (docs/publication.md §2) — a tree from graph.med through
   the language of each view's sources and their kind ("Leitlinien") to one box per view, each naming its source,
   drawn by the view page's renderer (Cytoscape.js with the dagre layout, self-hosted, see
   assets/vendor/LICENSES.md). Nothing is written here: the graph is read from the page, where the build rendered
   one entry per view in the sheet's home — each box from an entry (its data-ref), the levels it hangs under from
   its data-path, its lines the entry's [data-box] parts in their order, the first set apart — so that the page
   reads the same without this script and with a screen reader. Tapping a box, or the line leading to it, opens
   its graph at once: the box goes where its entry's link goes. A box is selected — the rest fades, and its entry
   opens alone in the sheet beside or below the graph (on a phone, a peek strip at the bottom edge that carries the
   entry's link to its graph and raises the rest) — only by its deep link or from the keyboard: its entry's own
   control, a toggle beside the link to the graph, selects the box; pressed again, it returns the sheet to its
   home, as tapping the canvas or a level does. The tree is small and always whole, so it is drawn at a size a
   phone reads: left to right where the canvas leaves a box its least width beside the levels, else as an indented
   tree, each level under its parent and set in by a step, a box taking the width left; the fit never zooms far
   past that size. */
(function () {
  "use strict";
  var canvas = document.getElementById("graph"), sheet = document.getElementById("sheet"), main = canvas.closest("main");
  var home = sheet.innerHTML, entries = {}, links = {}, cy = null, shown = "";   /* shown: the view whose entry the sheet shows alone, "" for its home */
  var PAD = 16, RANK = 40, INDENT = 24, GAP = 12, BOX = { min: 184, max: 300 }, ZOOM = { min: 0.75, max: 1.4 };
  var boxW = BOX.max;   /* the boxes' width, set by each layout */

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  /* the view page's forms and colours (graph.js): a line in the page's foreground that turns just before it runs into
     its node, a box the page's colours with a border; graph.med and the levels are small boxes of their label's width,
     graph.med in bold; the selection is the border, what is not selected fades */
  function stylesheet() {
    var w = boxW;
    return [
      { selector: "node", style: {
          "shape": "round-rectangle", "background-color": css("--bg"), "border-width": 1.5, "border-color": css("--fg"),
          "label": "data(label)", "color": css("--fg"), "font-family": css("--font"), "font-size": 13, "line-height": 1.3,
          "text-wrap": "wrap", "text-max-width": w - 24, "text-valign": "center", "text-halign": "center", "text-justification": "left",
          "width": w, "height": "label", "padding": 12 } },
      { selector: "node[type = 'root'], node[type = 'level']", style: { "width": "label", "padding": 8, "text-max-width": 200,
          "text-justification": "center" } },
      { selector: "node[type = 'root']", style: { "font-weight": 700 } },
      { selector: "edge", style: {
          "width": 1.5, "line-color": css("--fg"), "target-arrow-shape": "triangle", "target-arrow-color": css("--fg"), "arrow-scale": 0.9,
          "curve-style": "taxi", "taxi-direction": "rightward", "taxi-turn": 20, "taxi-turn-min-distance": 8 } },
      { selector: "node.dim", style: { "opacity": 0.12 } },
      { selector: "edge.dim", style: { "line-opacity": 0.12 } },
      { selector: "node.picked", style: { "border-width": 3 } }
    ];
  }
  var scheme = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function retheme() { if (cy) cy.style().fromJson(stylesheet()).update(); }
  if (scheme) { if (scheme.addEventListener) scheme.addEventListener("change", retheme); else scheme.addListener(retheme); }

  /* the whole tree, centred, at the largest size up to ZOOM.max; one too tall even at ZOOM.min starts at the top
     and runs out below, to be panned */
  function fit() {
    var bb = cy.elements().boundingBox({ includeLabels: true }), w = cy.width(), h = cy.height();
    if (!bb.w || !bb.h) return;
    var zoom = Math.max(ZOOM.min, Math.min((w - 2 * PAD) / bb.w, (h - 2 * PAD) / bb.h, ZOOM.max));
    var tall = bb.h * zoom > h - 2 * PAD;
    cy.viewport({ zoom: zoom, pan: { x: (w - bb.w * zoom) / 2 - bb.x1 * zoom, y: tall ? PAD - bb.y1 * zoom : (h - bb.h * zoom) / 2 - bb.y1 * zoom } });
  }
  /* left to right where the canvas leaves a box at least its least width beside the widest node of each level and the
     gaps between them; else indented, a box as wide as the canvas leaves it after the deepest step */
  function layout() {
    var levels = cy.nodes().not("[type = 'box']"), widest = {}, depth = 0, prefix = 0;
    cy.edges().removeStyle();
    levels.forEach(function (n) { var d = n.data("depth"); depth = Math.max(depth, d + 1); widest[d] = Math.max(widest[d] || 0, n.outerWidth()); });
    for (var d = 0; d < depth; d++) prefix += (widest[d] || 0) + RANK;
    var room = canvas.clientWidth - 2 * PAD, wide = room - prefix >= BOX.min;
    boxW = Math.max(wide ? BOX.min : 120, Math.min(BOX.max, wide ? room - prefix : room - depth * INDENT));
    cy.style().fromJson(stylesheet()).update();
    if (wide) {
      var lay = cy.layout({ name: "dagre", rankDir: "LR", nodeSep: 20, rankSep: RANK, nodeDimensionsIncludeLabels: true, fit: false, animate: false });
      lay.one("layoutstop", fit);
      lay.run();
      return;
    }
    /* indented: each node under the one before, set in by its depth; a line leaves its parent's lower edge a half
       step in from the left, runs down and turns into the child's left side */
    var y = 0;
    (function place(n) {
      var w = n.outerWidth(), h = n.outerHeight(), left = n.data("depth") * INDENT;
      n.position({ x: left + w / 2, y: y + h / 2 });
      y += h + GAP;
      n.outgoers("node").forEach(place);
    })(cy.getElementById("root"));
    cy.edges().forEach(function (e) {
      /* one bend, where the line down from the parent meets the child's middle — given as a segment's weight and
         distance along and across the line between the two centres */
      var a = e.source(), b = e.target(), S = a.position(), T = b.position();
      var bend = { x: S.x - a.outerWidth() / 2 + INDENT / 2, y: T.y }, v = { x: T.x - S.x, y: T.y - S.y }, r = { x: bend.x - S.x, y: bend.y - S.y };
      var len = Math.sqrt(v.x * v.x + v.y * v.y);
      e.style({ "curve-style": "segments", "edge-distances": "node-position",
                "segment-weights": (r.x * v.x + r.y * v.y) / (len * len), "segment-distances": (v.x * r.y - v.y * r.x) / len,
                "source-endpoint": (bend.x - S.x) + "px " + (a.outerHeight() / 2) + "px", "target-endpoint": (-b.outerWidth() / 2) + "px 0px" });
    });
    fit();
  }

  /* the sheet (graph.js): every fill starts at the top. Below 900 px an entry waits in a peek strip at the bottom
     edge — its title and what the graph holds, and the entry's own link to its graph, all taken from the entry
     itself — so that a graph is two taps away, the box and the link; the rest of the strip raises the sheet over the
     graph, and the strip again, ✕ or Escape lowers it. A wide screen never shows it */
  function fill(html, entry) {
    sheet.innerHTML = html;
    sheet.classList.remove("peeking", "raised");
    var title = entry && sheet.querySelector(".entry-title a");
    if (title) {
      var bar = document.createElement("div"), peek = document.createElement("button"), close = document.createElement("button");
      var text = document.createElement("span"), t = document.createElement("span"), holds = sheet.querySelector(".entry-holds");
      var word = sheet.querySelector(".entry-open"), go = null;
      bar.className = "peek-bar";
      peek.type = "button"; peek.className = "peek"; peek.setAttribute("aria-expanded", "false"); peek.setAttribute("aria-controls", "sheet");
      text.className = "peek-text"; t.className = "peek-title"; t.textContent = title.textContent.trim(); if (title.lang) t.lang = title.lang;
      text.appendChild(t);
      if (holds) { var v = document.createElement("span"); v.className = "verdict"; v.textContent = holds.textContent.replace(/\s+/g, " ").trim(); text.appendChild(v); }
      peek.appendChild(text);
      if (word) { go = document.createElement("a"); go.className = "peek-open"; go.href = title.getAttribute("href"); go.textContent = word.textContent.trim(); }
      close.type = "button"; close.className = "peek-close"; close.setAttribute("aria-label", sheet.dataset.close || ""); close.textContent = "✕";
      bar.appendChild(peek); if (go) bar.appendChild(go); bar.appendChild(close);
      sheet.insertBefore(bar, sheet.firstChild);
      sheet.classList.add("peeking");
    }
    sheet.scrollTop = 0;
  }
  function raise(up) {
    if (!sheet.classList.contains("peeking")) return;
    sheet.classList.toggle("raised", up);
    sheet.querySelector(".peek").setAttribute("aria-expanded", up ? "true" : "false");
    sheet.scrollTop = 0;
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet.classList.contains("raised")) raise(false); });
  /* the strip raises and lowers the sheet; an entry's toggle selects its box, or returns the sheet to its home when
     its box is the one selected — the keyboard's way to what a tap does in the graph (graph.js: a node link). The
     reader keeps their place: the focus goes to the same entry's toggle in what the sheet now shows, or, where that
     waits behind the strip on a phone, to the strip's link to the graph; and on a phone the page returns to the graph */
  sheet.onclick = function (e) {
    if (e.target.closest(".peek-close")) { raise(false); return; }
    if (e.target.closest(".peek")) { raise(!sheet.classList.contains("raised")); return; }
    var pick = e.target.closest(".entry-select"), entry = pick && pick.closest("[data-ref]");
    if (!entry || !cy) return;
    var ref = entry.dataset.ref, on = ref === shown;
    select(on ? null : ref, true);
    var again = null;
    sheet.querySelectorAll("[data-ref]").forEach(function (x) { if (x.dataset.ref === ref) again = x.querySelector(".entry-select"); });
    if (!again || !again.getClientRects().length) again = sheet.querySelector(".peek-open") || sheet.querySelector(".peek");
    if (again) again.focus();
    if (!on && window.innerWidth < 900) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* selection: the box and the answer leading to it stay, the rest fades, and the sheet shows its entry alone;
     nothing, or anything but a box, is the sheet's home. The hash is the deep link, the view's id. A selection that
     changes nothing — the home again, the same box again — leaves the sheet as it is: its content, its scroll, the
     strip raised or not (graph.js: open_) */
  function select(ref, push) {
    if (!cy) return;
    var box = ref && entries[ref] ? cy.getElementById(ref) : cy.collection(), to = box.empty() ? "" : ref;
    if (push) history.replaceState(null, "", to ? "#" + to : location.pathname + location.search);
    if (to === shown) return;
    shown = to;
    cy.elements().removeClass("dim picked");
    if (!to) { fill(home); return; }
    cy.elements().not(box.union(box.predecessors())).addClass("dim");
    box.addClass("picked");
    fill('<ul class="graph-list">' + entries[to] + "</ul>", true);
  }
  /* the deep link as the hash names it; one that is not a well-formed escape names no view and selects nothing */
  function hashRef() { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ""; } }

  function draw() {
    if (typeof cytoscape !== "function") throw new Error("library missing");
    if (typeof cytoscapeDagre === "function") cytoscape.use(cytoscapeDagre);
    var elements = [{ data: { id: "root", type: "root", label: "graph.med", depth: 0 } }], levels = {};
    sheet.querySelectorAll("[data-ref]").forEach(function (entry) {
      var ref = entry.dataset.ref, lines = Array.prototype.slice.call(entry.querySelectorAll("[data-box]"))
        .sort(function (a, b) { return Number(a.dataset.box) - Number(b.dataset.box); })
        .map(function (el) { return el.textContent.replace(/\s+/g, " ").trim(); });
      var alone = entry.cloneNode(true), toggle = alone.querySelector(".entry-select");   /* alone in the sheet, its box is the one selected */
      if (toggle) toggle.setAttribute("aria-pressed", "true");
      entries[ref] = alone.outerHTML;
      var link = entry.querySelector(".entry-title a"); if (link) links[ref] = link.getAttribute("href");
      /* the levels it hangs under, each once: its language, then its sources' kind, as far as they agree */
      var parent = "root", path = [];
      try { path = JSON.parse(entry.dataset.path || "[]"); } catch (e) { path = []; }
      path.forEach(function (level, i) {
        var id = "l:" + level.id;
        if (!levels[id]) {
          levels[id] = true;
          elements.push({ data: { id: id, type: "level", label: level.label, depth: i + 1 } });
          elements.push({ data: { id: "e:" + id, source: parent, target: id } });
        }
        parent = id;
      });
      elements.push({ data: { id: ref, type: "box", label: lines[0] + (lines.length > 1 ? "\n\n" + lines.slice(1).join("\n") : ""), depth: path.length + 1 } });
      elements.push({ data: { id: "a:" + ref, source: parent, target: ref } });
    });
    cy = cytoscape({ container: canvas, elements: elements, minZoom: 0.3, maxZoom: 3, boxSelectionEnabled: false, autounselectify: true,
                     style: stylesheet(), layout: { name: "preset" } });
    layout();
    /* a box, or the answer leading to it, opens its graph: no selection in between */
    function go(ref) { if (links[ref]) location.href = links[ref]; else select(ref, true); }
    cy.on("tap", "node[type = 'box']", function (e) { go(e.target.id()); });
    cy.on("tap", "edge", function (e) { if (e.target.target().data("type") === "box") go(e.target.target().id()); });
    cy.on("mouseover", "node[type = 'box']", function () { canvas.style.cursor = "pointer"; });
    cy.on("mouseout", "node[type = 'box']", function () { canvas.style.cursor = ""; });
    cy.on("tap", function (e) { if (e.target === cy || (e.target.isNode() && e.target.data("type") !== "box")) select(null, true); });
    /* a new width (a phone turned) gives the boxes another width: restyle, lay out and fit again */
    var width = canvas.clientWidth, pending = null;
    window.addEventListener("resize", function () {
      clearTimeout(pending);
      pending = setTimeout(function () {
        cy.resize();
        if (canvas.clientWidth !== width) { width = canvas.clientWidth; layout(); } else fit();
      }, 150);
    });
    window.addEventListener("hashchange", function () { select(hashRef(), false); });
    select(hashRef(), false);
  }

  /* a graph that cannot be drawn leaves the page as it reads without the script: the sheet alone */
  try { draw(); } catch (e) { main.classList.add("flat"); throw e; }
  window.graphmed = { cy: cy, open: select };   /* for the console and tests (tools/screenshot.js: open=<view id>) */
})();
