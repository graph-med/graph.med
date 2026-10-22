/* graph.med path view (docs/publication.md §3 "The path view"): the whole chain a recommendation stands in — every
   statement of its view it reaches along `follows` edges, either way — drawn top-down by the view page's renderer
   (Cytoscape.js with the dagre layout, self-hosted, see assets/vendor/LICENSES.md), the earlier step above the later.
   Every box is a statement as the view page draws it: coloured by its direction, its label the glyph, the grade as
   printed and the short form, written by the build. Every step is drawn on its own: a line from the earlier box to the
   step's label — the transition read from the earlier one, the trigger, the later one's condition —, an arrow from
   the label to the later box. A box several steps lead to is reached by several arrows, each from a label of its own;
   nothing joins them, so the drawing says neither that the earlier steps hold together nor that one of them suffices.
   A cycle keeps its back edge, drawn upward. The page is opened from a statement's card ("Pfad anzeigen") and is the
   same chain from whichever member it is opened; the member it was opened from wears an outline the whole time, and
   is selected at load. A tap on a box opens its card in the sheet beside or below the graph (on a phone a peek
   strip, as on the view page), a tap on a step's label or its lines the step, with the edge's rationale; the hash is
   the selected statement's id. Data: #path-data, written by tools/build.py; the words this script writes are the
   page's (#graph's data-words, #sheet's data-close). */
(function () {
  "use strict";
  var canvas = document.getElementById("graph"), sheet = document.getElementById("sheet"), main = canvas.closest("main");
  var legend = document.getElementById("legend"), free = document.getElementById("free");
  var data = JSON.parse(document.getElementById("path-data").textContent);
  var words = JSON.parse(canvas.dataset.words || "{}");
  var home = sheet.innerHTML, cy = null, shown = null;   /* shown: the id of what the sheet shows, null for its home */
  var PAD = 16, ZOOM = { min: 0.8, max: 1.25 };   /* a fit never zooms the boxes out below a size a phone reads; the fit button does */
  function say(text, values) { return text.replace(/\{(\w+)\}/g, function (m, k) { return k in values ? String(values[k]) : m; }); }
  function fail(msg) { if (legend) legend.textContent = say(words.failed || "{message}", { message: msg }); }

  /* the legend, as on the view page: a pill in the corner at every load, which opens and closes the panel; on a phone
     the panel opens over the graph and is as tall as the free row at most */
  var legendPanel = document.getElementById("legend-panel"), legendToggle = document.getElementById("legend-toggle");
  function narrow() { return !(window.matchMedia && window.matchMedia("(min-width: 900px)").matches); }
  function showLegend(on) {
    if (!legendPanel) return;
    legendPanel.style.maxHeight = on && narrow() ? Math.max(120, free.getBoundingClientRect().height - 8) + "px" : "";
    legendPanel.hidden = !on; legendToggle.setAttribute("aria-expanded", String(on));
  }
  showLegend(false);
  if (legendToggle) legendToggle.onclick = function () { showLegend(legendPanel.hidden); };

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  /* the view page's forms and colours (graph.js): a box filled by its direction, dark text on it, a box without a
     direction the page's own colours with a border, a contested one a dashed red border; the border otherwise means
     the selection. A step's label is text on the page's background, set on its line as an answer is on the view
     page; the member the page was opened from wears an outline */
  var DIRECTION = { "für": "--dir-for", "gegen": "--dir-against", "abwägen": "--dir-weigh", "Lücke": "--dir-gap" };
  var size = { box: 240, text: 210, step: 170, font: 12 };   /* set by each layout from the canvas's width */
  function stylesheet() {
    return [
      { selector: "node", style: {
          "shape": "round-rectangle", "background-color": css("--bg"), "border-width": 0, "label": "data(label)",
          "color": css("--fg"), "font-family": css("--font"), "font-size": size.font, "line-height": 1.3, "text-wrap": "wrap",
          "text-valign": "center", "text-halign": "center", "height": "label" } },
      { selector: "node[type = 'statement']", style: { "width": size.box, "text-max-width": size.text, "padding": 10, "color": "#111" } } ].concat(
      Object.keys(DIRECTION).map(function (d) { return { selector: "node[type = 'statement'][direction = '" + d + "']", style: { "background-color": css(DIRECTION[d]) } }; }), [
      { selector: "node[type = 'statement'][!direction]", style: { "color": css("--fg"), "border-width": 1.5, "border-color": css("--mute") } },
      { selector: "node[type = 'statement'][contested = 1]", style: { "border-width": 3, "border-color": css("--contested"), "border-style": "dashed" } },
      /* a step's label: the transition, the trigger and the later box's condition, one to a line, centred on its line */
      { selector: "node[type = 'step']", style: { "width": size.step, "text-max-width": size.step - 8, "padding": 4,
          "font-size": size.font - 1, "background-color": css("--bg"), "text-justification": "center" } },
      { selector: "edge", style: { "curve-style": "straight", "width": 1.5, "line-color": css("--fg"), "target-arrow-color": css("--fg"),
          "target-arrow-shape": "none", "arrow-scale": 0.9 } },
      { selector: "edge[kind = 'into']", style: { "target-arrow-shape": "triangle" } },   /* from a step's label into the later box */
      { selector: "edge.back-step[kind = 'into']", style: { "target-arrow-shape": "none", "source-arrow-shape": "triangle", "source-arrow-color": css("--fg") } },   /* a back edge, laid out the other way: its arrow at the top */
      /* a back edge (a cycle): drawn upward, bowed beside the column it runs past rather than through it */
      { selector: "edge.back", style: { "curve-style": "unbundled-bezier", "control-point-distances": "data(bow)", "control-point-weights": 0.5, "line-style": "dashed" } },
      { selector: "node.entered", style: { "outline-width": 3, "outline-style": "solid", "outline-color": css("--fg"), "outline-offset": 4 } },
      { selector: "node[type = 'statement'].picked", style: { "border-width": 3, "border-color": css("--fg"), "border-style": "solid" } },
      { selector: "node[type = 'step'].picked", style: { "border-width": 2, "border-color": css("--fg") } },
      { selector: "edge.picked", style: { "width": 3 } }
    ]);
  }
  function retheme() { if (cy) cy.style().fromJson(stylesheet()).update(); }
  var scheme = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  if (scheme) { if (scheme.addEventListener) scheme.addEventListener("change", retheme); else scheme.addListener(retheme); }

  /* the part of the canvas nothing covers: the free row of the wrapper's grid, between the controls and the legend
     (site.css, as on the view page) */
  function room() {
    var g = canvas.getBoundingClientRect(), f = free.getBoundingClientRect();
    return { top: Math.max(0, f.top - g.top), bottom: Math.max(0, g.bottom - f.bottom) };
  }
  /* the whole chain, centred in the free row, as large as fits up to ZOOM.max — but never below ZOOM.min unless asked
     (`whole`, the fit button): a chain too large for that is shown at ZOOM.min around `focus`, the selected box, and
     panned from there */
  function fit(focus, whole) {
    var bb = cy.elements().boundingBox({ includeLabels: true }), w = cy.width(), h = cy.height(), r = room();
    if (!bb.w || !bb.h) return;
    var free_h = h - r.top - r.bottom;
    var zoom = Math.min((w - 2 * PAD) / bb.w, (free_h - 2 * PAD) / bb.h, ZOOM.max);
    var x, y;
    if (zoom >= ZOOM.min || whole || !focus || focus.empty()) {
      zoom = Math.max(cy.minZoom(), zoom);
      x = (w - bb.w * zoom) / 2 - bb.x1 * zoom; y = r.top + (free_h - bb.h * zoom) / 2 - bb.y1 * zoom;
      if (bb.h * zoom > free_h - 2 * PAD) y = r.top + PAD - bb.y1 * zoom;   /* too tall even so: from the top, running out below */
    } else {
      zoom = ZOOM.min;
      var c = focus.boundingBox({ includeLabels: true });
      x = w / 2 - (c.x1 + c.w / 2) * zoom;
      y = r.top + free_h / 2 - (c.y1 + c.h / 2) * zoom;
      /* no blank beside the chain where it is larger than the canvas: its edge stops at the canvas's */
      x = Math.min(PAD - bb.x1 * zoom, Math.max(w - PAD - bb.x2 * zoom, x));
      y = Math.min(r.top + PAD - bb.y1 * zoom, Math.max(h - r.bottom - PAD - bb.y2 * zoom, y));
    }
    cy.viewport({ zoom: zoom, pan: { x: x, y: y } });
  }

  /* the layout: dagre, top to bottom. A step's label is a node of the layout, so that no label runs into a box or
     another label; its line from the earlier box weighs less than its arrow into the later one, so that the label
     stands just above the box it leads to. On a narrow canvas the boxes are narrower and the type a little larger,
     so that the fit keeps them readable */
  function layout(then) {
    var tight = canvas.clientWidth < 600;
    size = tight ? { box: 200, text: 178, step: 156, font: 13 } : { box: 210, text: 188, step: 160, font: 12 };
    cy.style().fromJson(stylesheet()).update();
    cy.nodes().forEach(function (n) { n.boundingBox({ includeLabels: true }); });
    var lay = cy.layout({ name: "dagre", rankDir: "TB", nodeSep: 16, rankSep: 32, edgeSep: 10,
                          nodeDimensionsIncludeLabels: true, fit: false, animate: false,
                          edgeWeight: function (e) { return e.data("kind") === "into" ? 4 : 1; } });
    lay.one("layoutstop", function () { route(); if (then) then(); });
    lay.run();
  }

  /* the lines, after every layout. A rank is the row of nodes sharing a centre y; between two ranks lies their gap.
     A line between neighbouring ranks runs orthogonally, as the view page's do: down from its upper end, across in
     the gap, down into its lower end — so it never crosses a box or a label, each of which stands in its own column
     of its rank. The lines of one gap run across at heights of their own, so that no two share a run; the lines a
     node sends down leave its lower edge at points of their own, and the lines it receives reach its upper edge at
     points of their own, each with its own arrowhead, in the order of their other ends — several steps into one box
     stay several arrows, never one. A line across more than one gap turns in the gap above its lower end; one the
     layout drew upward (a cycle it broke itself) bows beside the column it runs past */
  function route() {
    var rows = {}, ys;
    cy.nodes().forEach(function (n) {
      var y = Math.round(n.position("y")), b = n.boundingBox({ includeLabels: false });
      var r = rows[y] || (rows[y] = { top: Infinity, bottom: -Infinity });
      r.top = Math.min(r.top, b.y1); r.bottom = Math.max(r.bottom, b.y2);
    });
    ys = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
    function rank(n) { return ys.indexOf(Math.round(n.position("y"))); }
    function spread(list, end, other) {   /* points of their own along a node's edge, centred, in the order of the other ends */
      list.sort(function (a, b) { return other(a).position("x") - other(b).position("x"); });
      list.forEach(function (e, i) {
        var n = end(e), step = list.length < 2 ? 0 : Math.min(40, (n.width() * .7) / (list.length - 1));
        e.scratch("_dx" + (end === src ? "s" : "t"), (i - (list.length - 1) / 2) * step);
      });
    }
    function src(e) { return e.source(); } function tgt(e) { return e.target(); }
    cy.edges().removeStyle().removeClass("back");
    cy.nodes().forEach(function (n) {
      spread(n.outgoers("edge").toArray(), src, tgt);
      spread(n.incomers("edge").toArray(), tgt, src);
    });
    var gaps = {};
    cy.edges().forEach(function (e) {
      var a = rank(e.source()), b = rank(e.target());
      if (b <= a) {   /* drawn upward: a cycle the layout broke itself */
        var pa = e.source().position(), pb = e.target().position();
        e.addClass("back"); e.data("bow", -Math.max(60, (pa.y - pb.y) / 2)); return;
      }
      (gaps[b - 1] = gaps[b - 1] || []).push(e);   /* it turns in the gap above its lower end */
    });
    Object.keys(gaps).forEach(function (g) {
      var list = gaps[g], top = rows[ys[g]].bottom, bottom = rows[ys[+g + 1]].top;
      list.sort(function (a, b) { return (a.source().position("x") + a.scratch("_dxs")) - (b.source().position("x") + b.scratch("_dxs")); });
      list.forEach(function (e, i) {
        /* the two bends, where the line turns across the gap and back down, given as a segment's weight and distance
           along and across the line between the two centres (home.js does the same) */
        var s = e.source(), t = e.target(), S = s.position(), T = t.position();
        var y = top + (i + 1) / (list.length + 1) * (bottom - top), xs = S.x + e.scratch("_dxs"), xt = T.x + e.scratch("_dxt");
        var v = { x: T.x - S.x, y: T.y - S.y }, len2 = v.x * v.x + v.y * v.y, len = Math.sqrt(len2), weights = [], distances = [];
        [{ x: xs, y: y }, { x: xt, y: y }].forEach(function (p) {
          var r = { x: p.x - S.x, y: p.y - S.y };
          weights.push((r.x * v.x + r.y * v.y) / len2); distances.push((v.x * r.y - v.y * r.x) / len);
        });
        e.style({ "curve-style": "segments", "edge-distances": "node-position", "segment-weights": weights, "segment-distances": distances,
                  "source-endpoint": e.scratch("_dxs") + "px " + s.outerHeight() / 2 + "px", "target-endpoint": e.scratch("_dxt") + "px " + -t.outerHeight() / 2 + "px" });
      });
    });
  }

  /* the sheet, as on the view page (graph.js): every fill starts at the top; below 900 px a selection waits in a peek
     strip at the bottom edge — the direction colour, the title and the judgement, read from the card itself — which
     raises the sheet over the graph; the strip again, ✕ or Escape lowers it. A disclosure the reader opened or closed
     on one card stays so on the next, for as long as the page is open, and is never stored */
  var kept = {}, titled = null;
  sheet.addEventListener("toggle", function (e) {
    var k = e.target && e.target.getAttribute && e.target.getAttribute("data-keep");
    if (k) kept[k] = e.target.open;
  }, true);
  sheet.addEventListener("scroll", function () {
    if (!titled || !sheet.classList.contains("raised")) return;
    var bar = sheet.querySelector(".peek-bar");
    sheet.classList.toggle("titled", titled.getBoundingClientRect().bottom < (bar ? bar.getBoundingClientRect().bottom : 0));
  }, { passive: true });
  function strip() {
    if (sheet.classList.contains("peeking") && !sheet.classList.contains("raised")) document.body.style.setProperty("--strip", sheet.offsetHeight + "px");
  }
  if (window.ResizeObserver) new ResizeObserver(strip).observe(sheet);
  function fill(html) {
    sheet.innerHTML = html;
    sheet.classList.remove("peeking", "raised", "titled");
    sheet.querySelectorAll("details[data-keep]").forEach(function (d) {
      var k = d.getAttribute("data-keep");
      if (Object.prototype.hasOwnProperty.call(kept, k)) d.open = kept[k];
    });
    var card = sheet.querySelector(".card"), title = card && card.querySelector("h2.title");
    titled = title;
    if (card && title) {
      var band = card.querySelector(".zone.judgement"), dir = "";
      if (band) band.classList.forEach(function (c) { if (c.indexOf("dir-") === 0) dir = c; });
      var bar = document.createElement("div"), peek = document.createElement("button"), close = document.createElement("button");
      bar.className = "peek-bar" + (dir ? " " + dir : "");
      peek.type = "button"; peek.className = "peek"; peek.setAttribute("aria-expanded", "false"); peek.setAttribute("aria-controls", "sheet");
      var sw = document.createElement("span"), text = document.createElement("span"), t = document.createElement("span"), verdict = document.createElement("span");
      sw.className = "sw-band"; sw.setAttribute("aria-hidden", "true"); text.className = "peek-text"; t.className = "peek-title";
      var h = title.cloneNode(true);
      h.querySelectorAll(".origin").forEach(function (o) { o.remove(); });   /* the title alone, without its origin tag */
      t.lang = card.lang; t.textContent = h.textContent.replace(/\s+/g, " ").trim();
      verdict.className = "verdict"; verdict.lang = card.lang;
      var answer = band && band.querySelector(".line1 .answer"), parts = [];
      if (answer && answer.textContent.trim()) {
        var a = answer.cloneNode(true), verbs = a.querySelector(".verbs");
        if (verbs) verbs.remove();
        if (a.lastChild && a.lastChild.nodeType === 3) a.lastChild.textContent = a.lastChild.textContent.replace(/\s+$/, "");
        verdict.appendChild(a);
      }
      if (band) band.querySelectorAll(".badge b").forEach(function (b) { if (parts.indexOf(b.textContent) < 0) parts.push(b.textContent); });
      if (parts.length) verdict.appendChild(document.createTextNode((verdict.firstChild ? " · " : "") + parts.join(" · ")));
      var mark = band && band.querySelector(".contested-mark");
      if (mark) { var m = document.createElement("span"); m.className = "contested"; Array.prototype.forEach.call(mark.childNodes, function (n) { m.appendChild(n.cloneNode(true)); }); verdict.appendChild(document.createTextNode(" · ")); verdict.appendChild(m); }
      var trans = card.querySelector(".step-label");   /* a step's strip: what its label in the graph says */
      if (!verdict.firstChild && trans) verdict.textContent = trans.textContent.replace(/\s+/g, " ").trim();
      text.appendChild(t); if (verdict.firstChild) text.appendChild(verdict);
      peek.appendChild(sw); peek.appendChild(text);
      close.type = "button"; close.className = "peek-close"; close.setAttribute("aria-label", sheet.dataset.close || ""); close.textContent = "✕";
      bar.appendChild(peek); bar.appendChild(close);
      sheet.insertBefore(bar, sheet.firstChild);
      sheet.classList.add("peeking");
    }
    sheet.scrollTop = 0;
    strip();
    if (cy) cy.resize();   /* on a phone the strip's coming or going changes the canvas's height (site.css) */
  }
  function raise(up) {
    if (!sheet.classList.contains("peeking")) return;
    var had = document.activeElement;
    sheet.classList.toggle("raised", up);
    sheet.classList.remove("titled");
    var peek = sheet.querySelector(".peek");
    peek.setAttribute("aria-expanded", up ? "true" : "false");
    sheet.scrollTop = 0;
    if (!up && had && sheet.contains(had) && !had.getClientRects().length) peek.focus({ preventScroll: true });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet.classList.contains("raised")) raise(false); });

  /* selection: a statement's box, or a step — its label and its two lines —, wears the selection's border, and the
     sheet shows its card or the step; nothing fades, since the chain is the page. A selection that changes nothing
     leaves the sheet as it is. The hash is the selected statement's id (a step has none: the hash goes) */
  function stepOf(ele) {   /* the label node of a step, from its label or one of its lines */
    if (ele.isNode()) return ele.data("type") === "step" ? ele : null;
    return ele.source().data("type") === "step" ? ele.source() : ele.target().data("type") === "step" ? ele.target() : null;
  }
  function select(id, push) {
    if (!cy) return;
    var n = id ? cy.getElementById(id) : cy.collection();
    if (n.empty() || !data.html[id]) { n = cy.collection(); id = null; }
    if (push) history.replaceState(null, "", n.nonempty() && n.data("type") === "statement" ? "#" + id : location.pathname + location.search);
    if (id === shown) return;
    shown = id;
    cy.elements().removeClass("picked");
    if (!id) { fill(home); return; }
    n.addClass("picked");
    if (n.data("type") === "step") n.connectedEdges().addClass("picked");
    fill(data.html[id]);
  }
  function hashRef() { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ""; } }

  function draw() {
    if (typeof cytoscape !== "function") throw new Error(words.missing || "cytoscape");
    if (typeof cytoscapeDagre === "function") cytoscape.use(cytoscapeDagre);
    var elements = [];
    data.nodes.forEach(function (n) {
      elements.push({ data: { id: n.id, type: "statement", label: n.label, direction: n.direction || "", contested: n.contested ? 1 : 0 },
                      classes: n.id === data.entered ? "entered" : "" });
    });
    /* a cycle's back edge: a step whose trigger is a re-evaluation or a target reached — the triggers a cycle runs
       through (graph-representation.md §5) — and whose later statement already leads, along the steps not drawn back,
       to its earlier one. It is laid out the other way round, so that the cycle's other steps run down and this one
       up, beside them, its arrow at the top end; any cycle else is broken by the layout itself (below) */
    var back = {};
    function reaches(a, b, skip) {
      var seen = {}, todo = [a];
      while (todo.length) {
        var x = todo.pop();
        if (x === b) return true;
        if (seen[x]) continue;
        seen[x] = true;
        data.steps.forEach(function (s) { if (s.from === x && s !== skip && !back[s.id]) todo.push(s.to); });
      }
      return false;
    }
    data.steps.forEach(function (s) {
      if ((s.trigger === "reevaluation" || s.trigger === "target_reached") && reaches(s.to, s.from, s)) back[s.id] = true;
    });
    data.steps.forEach(function (s) {
      var up = !!back[s.id];
      elements.push({ data: { id: s.id, type: "step", label: s.label } });
      elements.push({ data: up ? { id: s.id + ":from", source: s.id, target: s.from, kind: "from", bow: 0 } : { id: s.id + ":from", source: s.from, target: s.id, kind: "from", bow: 0 },
                      classes: up ? "back-step" : "" });
      elements.push({ data: up ? { id: s.id + ":into", source: s.to, target: s.id, kind: "into", bow: 0 } : { id: s.id + ":into", source: s.id, target: s.to, kind: "into", bow: 0 },
                      classes: up ? "back-step" : "" });
    });
    cy = cytoscape({ container: canvas, elements: elements, minZoom: 0.2, maxZoom: 3, boxSelectionEnabled: false, autounselectify: true,
                     style: stylesheet(), layout: { name: "preset" } });
    cy.on("tap", "node, edge", function (e) {
      var s = stepOf(e.target), t = s ? s : e.target;
      select(t.id(), true);
    });
    cy.on("tap", function (e) { if (e.target === cy) select(null, true); });
    cy.on("tapstart", function () { if (narrow() && legendPanel && !legendPanel.hidden) showLegend(false); });
    cy.on("mouseover", "node, edge", function () { canvas.style.cursor = "pointer"; });
    cy.on("mouseout", "node, edge", function () { canvas.style.cursor = ""; });
    /* a link in the sheet to a member of the chain selects it here; any other link goes where it goes */
    sheet.onclick = function (e) {
      if (e.target.closest(".peek-close")) { raise(false); return; }
      if (e.target.closest(".peek")) { raise(!sheet.classList.contains("raised")); return; }
      var a = e.target.closest("a.node-link");
      if (a && a.dataset.node && cy.getElementById(a.dataset.node).nonempty()) {
        e.preventDefault();
        select(a.dataset.node, true);
        fit(cy.getElementById(a.dataset.node));
        if (window.innerWidth < 900) window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    document.getElementById("fit").onclick = function () { fit(null, true); };
    var width = canvas.clientWidth, pending = null;
    window.addEventListener("resize", function () {
      clearTimeout(pending);
      pending = setTimeout(function () {
        cy.resize();
        if (canvas.clientWidth !== width) { width = canvas.clientWidth; layout(function () { fit(cy.$(".picked").union(cy.$(".entered")).first()); }); }
        else fit(cy.$(".picked").union(cy.$(".entered")).first());
      }, 150);
    });
    window.addEventListener("hashchange", function () { select(hashRef(), false); });
    layout(function () {
      var at = hashRef(), start = at && cy.getElementById(at).nonempty() ? at : data.entered;
      select(start, false);
      fit(cy.getElementById(start));
    });
  }

  /* a chain that cannot be drawn leaves the page as it reads without the script: the sheet's home, its steps in words */
  try { draw(); } catch (e) { main.classList.add("flat"); fail(e && e.message ? e.message : String(e)); throw e; }
  window.graphmed = { cy: cy, open: function (id, push) { select(id, push); if (cy) fit(cy.getElementById(id)); } };   /* for the console and tests (tools/screenshot.js: open=<id>) */
})();
