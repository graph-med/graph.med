/* graph.med view page: one decision tree — which patient group? → which condition? →
   recommendation → aim — drawn left to right by Cytoscape.js with the dagre layout
   (self-hosted, see assets/vendor/LICENSES.md). Folded by default: tap an answer to
   unfold that patient group. Tap a box for its details in the section beside or below
   the graph (on a phone, a peek strip that raises it). Tap a question to fold everything below it; tap it again to restore what
   was open there. A chapter tree (from the source's outline and the claims' sections) is
   a hard filter: only what that section supports is shown. The search is a soft
   highlight: matches keep their colour, the rest fades; the arrows beside the box, or
   ↓ and ↑ in it, step from match to match. The reset button returns the
   page to its opening state (docs/publication.md §3). The axis switch chooses which of
   the view's groupings is drawn — its tree of patient groups (the first), the chapters of
   its sources, or another axis of its `group_by` (spec §4.1) — as `?by=<grouping>` in the
   URL (`section` for the chapters, else the axis id; absent for the first), so a grouped
   view is a shareable link.
   The legend under the graph keys what the view draws, open on a wide screen and a
   pill on a phone.
   Data: the #graph-data JSON written by tools/build.py, one tree per grouping. */
(function () {
  "use strict";
  var legend = document.getElementById("legend"), sheet = document.getElementById("sheet");
  var home = sheet.innerHTML;
  var data = JSON.parse(document.getElementById("graph-data").textContent);
  var chapters = document.getElementById("chapters"), chaptersToggle = document.getElementById("chapters-toggle");
  var search = document.getElementById("search"), count = document.getElementById("count"), facetSel = document.getElementById("facet");
  var first = data.groupings[0].axis;   /* the view's tree of patient groups, what the page opens with */
  var axisSel = document.getElementById("axis"), by = new URLSearchParams(location.search).get("by") || first, cy = null;
  if (!data.groupings.some(function (g) { return g.axis === by; })) by = first;   /* an unknown axis in the link: the first grouping */
  data.groupings.forEach(function (g) { var o = document.createElement("option"); o.value = g.axis; o.textContent = g.label; o.lang = g.lang; axisSel.appendChild(o); });
  axisSel.value = by; axisSel.hidden = data.groupings.length < 2;   /* a single grouping needs no switch */
  function fail(msg) { legend.textContent = "The graph could not be drawn: " + msg; }

  /* the legend: open on a wide screen, collapsed on a phone, at every load — nothing is remembered. The pill
     toggles the panel above it; the zoom does not follow, the fit button does (the free row is re-read) */
  var legendPanel = document.getElementById("legend-panel"), legendToggle = document.getElementById("legend-toggle");
  function showLegend(on) { legendPanel.hidden = !on; legendToggle.setAttribute("aria-expanded", String(on)); }
  showLegend(!!(window.matchMedia && window.matchMedia("(min-width: 900px)").matches));
  /* on a phone the legend and the chapter panel share the little height the graph leaves, so opening one closes the other */
  var narrow = function () { return !(window.matchMedia && window.matchMedia("(min-width: 900px)").matches); };
  legendToggle.onclick = function () {
    var open = legendPanel.hidden;
    if (open && narrow() && !chapters.hidden) { chapters.hidden = true; chaptersToggle.setAttribute("aria-expanded", "false"); }
    showLegend(open);
  };

  /* switching the grouping redraws the tree from the chosen grouping's nodes and edges and keeps
     the rest of the page's state — the chapter, the search and the facet, the selected entity —
     so the reader lands where they were, under the other axis; the URL carries the choice */
  axisSel.onchange = function () { switchTo(axisSel.value); };
  function switchTo(axis) {
    var g = window.graphmed, was = g.state();
    by = data.groupings.some(function (x) { return x.axis === axis; }) ? axis : first;
    axisSel.value = by;
    history.replaceState(null, "", location.pathname + (by !== first ? "?by=" + encodeURIComponent(by) : "") + location.hash);
    cy.destroy();
    draw();
    g = window.graphmed;
    if (was.section) g.section(was.section);
    if (was.query || was.facet) g.search(was.query, was.facet);
    if (was.ref) g.open(was.ref, true);
  }

  /* the graph's colours are the page's: the custom properties on :root (site.css), read when the
     stylesheet is built — at every draw, and again when the theme changes while the page is open */
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  /* a box is coloured by its direction — the banner's four colours, one variable each in site.css — and its
     label, written by the build, begins with the direction's glyph, the grade as printed and, where the grade does
     not carry it, the verb as a word; a statement without a direction (a fact) stays uncoloured. The border
     means state alone: contested, and the selection */
  var DIRECTION = { "für": "--dir-for", "gegen": "--dir-against", "abwägen": "--dir-weigh", "Lücke": "--dir-gap" };
  function stylesheet() {
    return [
      { selector: "node", style: {
          "shape": "round-rectangle", "background-color": css("--bg"), "border-width": 1.5, "border-color": css("--mute"),
          "label": "data(label)", "color": css("--fg"), "font-family": css("--font"), "font-size": 12,
          "text-wrap": "wrap", "text-max-width": 210, "text-valign": "center", "text-halign": "center",
          "width": 240, "height": "label", "padding": 10 } } ].concat(
      /* the fill by direction: one rule per direction word, so that the colour is the stylesheet's and not the node's */
      Object.keys(DIRECTION).map(function (d) { return { selector: "node[direction = '" + d + "']", style: { "background-color": css(DIRECTION[d]) } }; }), [
      { selector: "node[type = 'root']", style: { "font-weight": 700, "border-color": css("--fg") } },
      { selector: "node[type = 'question']", style: { "shape": "diamond", "width": 200, "height": 120, "padding": 0, "text-max-width": 110, "border-color": css("--fg"), "font-weight": 600 } },
      { selector: "node[type = 'junction']", style: { "shape": "ellipse", "width": 30, "height": 30, "padding": 0, "font-size": 11, "font-weight": 700,
          "background-color": css("--bg"), "border-color": css("--fg"), "border-width": 2, "text-max-width": 30 } },
      { selector: "node[type = 'junction'].open", style: { "background-color": css("--fg"), "color": css("--bg") } },
      { selector: "node[type = 'question'].closed", style: { "background-color": css("--line"), "border-style": "dashed" } },   /* folded: there is more below */
      /* a box has no border of its own: "none" is a width of 0, not a transparent colour — Cytoscape takes a
         border's alpha from `border-opacity`, never from the colour, so a transparent colour drew a dark hairline.
         The contested and picked rules below each set their own width, so they draw as before */
      { selector: "node[type = 'statement']", style: { "color": "#111", "border-width": 0, "text-halign": "center" } },   /* dark text on the direction's colour, in both themes */
      { selector: "node[type = 'statement'][!direction]", style: { "color": css("--fg"), "border-width": 1.5, "border-color": css("--mute") } },   /* no direction: the page's own colours, with a border */
      { selector: "node[type = 'statement'][contested = 1]", style: { "border-width": 3, "border-color": css("--contested"), "border-style": "dashed" } },
      { selector: "node[type = 'aim']", style: { "width": 180, "text-max-width": 160, "font-size": 11, "color": css("--mute"), "border-style": "dashed" } },
      { selector: "edge", style: {
          "curve-style": "bezier", "width": 1.5, "line-color": css("--edge"),
          "target-arrow-shape": "triangle", "target-arrow-color": css("--edge"), "arrow-scale": 0.9,
          "label": "data(label)", "font-size": 11, "color": css("--fg"), "text-wrap": "wrap", "text-max-width": 170,
          "text-background-color": css("--bg"), "text-background-opacity": 1, "text-background-padding": 3, "text-background-shape": "round-rectangle" } },
      /* answers fan out of one question orthogonally — a short trunk, then a horizontal run into each
         group or box — so that an answer, written on its own run, is crossed by no other edge */
      { selector: "edge[kind = 'answer']", style: { "line-color": css("--fg"), "target-arrow-color": css("--fg"), "font-weight": 600,
          "curve-style": "taxi", "taxi-direction": "rightward", "taxi-turn": "data(turn)", "taxi-turn-min-distance": 8,
          "label": "", "target-label": "data(label)", "target-text-offset": 0, "target-text-margin-x": "data(lm)", "target-text-rotation": "none" } },
      { selector: "edge[kind = 'flow']", style: { "curve-style": "taxi", "taxi-direction": "rightward", "taxi-turn": "data(turn)", "taxi-turn-min-distance": 8 } },
      /* an aim or a relation leaves its box by the right edge and turns like the others, so that a line
         to a shared aim never leaves through the bottom of one box into the top of the next */
      { selector: "edge[kind = 'aim']", style: { "line-style": "dashed", "target-arrow-shape": "none",
          "curve-style": "taxi", "taxi-direction": "rightward", "taxi-turn": "data(turn)", "taxi-turn-min-distance": 8 } },
      /* a box related to the selected one (specializes, complements, conflicts) keeps its colour and wears a
         dotted outline — no line is drawn across the tree, and the card names the relation (zone 9) */
      { selector: "node.related", style: { "outline-width": 2.5, "outline-style": "dotted", "outline-color": css("--fg"), "outline-offset": 3 } },
      /* a box that applies generally to the selected group — through the view's scope tree, hung where it was made
         for — keeps its colour and wears a double outline; the group's own boxes follow it as before, and the
         sheet lists the general ones apart, each with its condition (docs/publication.md §3) */
      { selector: "node.general", style: { "outline-width": 4, "outline-style": "double", "outline-color": css("--fg"), "outline-offset": 3 } },
      { selector: "edge.dup", style: { "target-label": "" } },   /* a group reached from two open parents names its answer once */
      { selector: ".folded", style: { "display": "none" } },
      /* a node fades as one piece; an edge fades by its line and arrowhead (`line-opacity`) and by the
         colour of its label's text, never by an opacity on the label: the label is drawn from a texture
         that `opacity` and `text-opacity` alike blit background and all, which let the line show
         through the word. The background stays opaque, so a faded answer keeps its clean gap; `--line`
         is the page's faint neutral, the foreground at about 15% over the background in both themes */
      { selector: "node.dim", style: { "opacity": 0.12 } },
      { selector: "node.faded", style: { "opacity": 0.15 } },
      { selector: "edge.dim", style: { "line-opacity": 0.12, "color": css("--line") } },
      { selector: "edge.faded", style: { "line-opacity": 0.15, "color": css("--line") } },
      { selector: "node.picked", style: { "border-width": 3, "border-color": css("--fg") } },
      { selector: "edge.picked", style: { "line-color": css("--fg"), "width": 3 } }
    ]);
  }

  /* a theme switch while the page is open (prefers-color-scheme): the page restyles itself from the
     variables, and the graph follows — the stylesheet is rebuilt from the re-read colours and applied
     in place. What is open, folded and selected, and the layout, stay as they are: nothing is redrawn */
  function retheme() { if (cy) cy.style().fromJson(stylesheet()).update(); }
  var scheme = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  if (scheme) { if (scheme.addEventListener) scheme.addEventListener("change", retheme); else scheme.addListener(retheme); }

  /* the details of a selection (docs/publication.md §3). Every fill starts the panel at its top — the title, never
     the middle of the next card. Below 900 px a selection leaves the page where it is: the details wait in a peek
     strip at the bottom edge, carrying what the card's band carries — the direction colour, the title, the
     judgement and the grade — built from the card itself, so that no word or value is written here. Tapping the
     strip raises the panel over the graph; the strip again, ✕ or Escape lowers it. A wide screen never shows it.
     A selection of several entities (an answer naming several conditions) is a card for each, one after another:
     the strip names every card's title, and each card after the first numbers the ids its template repeats. */
  function fill(html) {
    sheet.innerHTML = html;
    sheet.classList.remove("peeking", "raised");
    var cards = Array.prototype.slice.call(sheet.querySelectorAll(".card")), card = cards[0], title = card && card.querySelector("h2.title, .label");
    cards.forEach(function (c, i) {
      if (i) c.querySelectorAll("[id], [aria-labelledby]").forEach(function (el) {
        if (el.id) el.id += "-" + i;
        if (el.hasAttribute("aria-labelledby")) el.setAttribute("aria-labelledby", el.getAttribute("aria-labelledby") + "-" + i);
      });
    });
    if (card && title) {
      var band = card.querySelector(".zone.judgement"), dir = "";
      if (band) band.classList.forEach(function (c) { if (c.indexOf("dir-") === 0) dir = c; });
      var bar = document.createElement("div"), peek = document.createElement("button"), close = document.createElement("button");
      bar.className = "peek-bar" + (dir ? " " + dir : "");
      peek.type = "button"; peek.className = "peek"; peek.setAttribute("aria-expanded", "false"); peek.setAttribute("aria-controls", "sheet");
      var sw = document.createElement("span"), text = document.createElement("span"), t = document.createElement("span"), verdict = document.createElement("span");
      sw.className = "sw-band"; sw.setAttribute("aria-hidden", "true"); text.className = "peek-text";
      t.className = "peek-title";
      cards.forEach(function (c, i) {   /* each card's title in its own language, the next after a separator */
        var s = document.createElement("span"), h = c.querySelector("h2.title, .label");
        s.lang = c.lang; s.textContent = (i ? " · " : "") + (h ? h.textContent.trim() : "");
        t.appendChild(s);
      });
      verdict.className = "verdict"; verdict.lang = card.lang;
      var answer = band && band.querySelector(".line1 .answer"), parts = [];
      if (answer && answer.textContent.trim()) {
        var a = answer.cloneNode(true), verbs = a.querySelector(".verbs");
        if (verbs) verbs.remove();
        if (a.lastChild && a.lastChild.nodeType === 3) a.lastChild.textContent = a.lastChild.textContent.replace(/\s+$/, "");   /* the space before the verbs */
        verdict.appendChild(a);
      }
      if (band) band.querySelectorAll(".badge b").forEach(function (b) { if (parts.indexOf(b.textContent) < 0) parts.push(b.textContent); });
      if (parts.length) verdict.appendChild(document.createTextNode((verdict.firstChild ? " · " : "") + parts.join(" · ")));
      var mark = band && band.querySelector(".contested-mark");
      if (mark) { var m = document.createElement("span"); m.className = "contested"; Array.prototype.forEach.call(mark.childNodes, function (n) { m.appendChild(n.cloneNode(true)); });   /* the glyph keeps its own span and weight */ verdict.appendChild(document.createTextNode(" · ")); verdict.appendChild(m); }
      text.appendChild(t); if (verdict.firstChild) text.appendChild(verdict);
      peek.appendChild(sw); peek.appendChild(text);
      close.type = "button"; close.className = "peek-close"; close.setAttribute("aria-label", "close the details"); close.textContent = "✕";
      bar.appendChild(peek); bar.appendChild(close);
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

  try { draw(); } catch (e) { fail(e && e.message ? e.message : String(e)); throw e; }

  function draw() {
  var tree = data.groupings.filter(function (g) { return g.axis === by; })[0];
  if (typeof cytoscape !== "function") throw new Error("library missing");
  if (typeof cytoscapeDagre === "function") cytoscape.use(cytoscapeDagre);

  /* the search compares folded text: no case, no diacritics ("osophagus" finds Ösophagus), ß as ss */
  function fold(s) { return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").toLowerCase(); }
  var elements = [], types = {};
  tree.nodes.forEach(function (n) { types[n.id] = n.type; });
  tree.nodes.forEach(function (n) {
    elements.push({ data: { id: n.id, refs: n.ref ? [n.ref] : [], type: n.type, label: n.label || "", group: n.group || "",
      direction: n.direction || "", contested: n.contested ? 1 : 0,
      sections: n.sections || [], text: fold(n.text), facets: n.facets || [], general: n.general || [] } });
  });
  tree.edges.forEach(function (e, i) {
    /* an answer is written at the end of its edge, beside the group or box it leads to, so that
       ten answers fanning out of one question do not pile up at the edges' midpoints. The label is
       anchored where the arrow meets the target's boundary; the margin moves its centre left by half
       its width (estimated from the text, capped at the wrap width) and a small gap, so it ends just
       before the arrow and, with the rank separation below, never reaches the rank before. An answer naming
       several conditions has a line for each, so its widest line is measured */
    var width = Math.min(170, 6.2 * Math.max.apply(null, (e.label || "").split("\n").map(function (l) { return l.length; })));
    elements.push({ data: { id: "e" + i, source: e.from, target: e.to, kind: e.kind, label: e.label || "", refs: e.refs || [], text: fold(e.text),
      lm: -(width / 2 + 10), turn: -200 } });   /* turn: where the edge's vertical run lies, set by route() after every layout */
  });

  cy = cytoscape({
    container: document.getElementById("graph"),
    elements: elements,
    minZoom: 0.1, maxZoom: 4,
    boxSelectionEnabled: false, autounselectify: true,
    style: stylesheet(),
    layout: { name: "preset" }
  });

  /* the chapter filter: the statements supported from a section or its subsections,
     what leads to them and their aims — nothing else is shown, no edge is computed */
  /* relations take no part in the tree: out of the graph from the start, so that no layout ranks a box
     after the box it points at and no unfolding follows them into another group. What remains of them
     is a mark: `related` outlines the boxes related to the selected ones, where they are shown
     (docs/publication.md §3) */
  var relations = cy.edges("[kind = 'relation']").remove().map(function (e) { return [e.data("source"), e.data("target")]; });
  function related(eles) {
    cy.nodes(".related").removeClass("related");
    if (!eles || eles.empty()) return;
    var picked = {};
    eles.nodes().forEach(function (n) { picked[n.id()] = true; });
    relations.forEach(function (r) {
      var other = picked[r[0]] ? r[1] : picked[r[1]] ? r[0] : null;
      if (other && !picked[other]) cy.getElementById(other).not(".folded").removeClass("dim").addClass("related");
    });
  }
  /* what applies generally to a selected group (its junction's `general`, from the view's scope tree): the boxes
     that are shown keep their colour and wear the double outline; nothing moves and nothing unfolds */
  function general(eles) {
    cy.nodes(".general").removeClass("general");
    if (!eles || eles.empty()) return;
    eles.nodes("[type = 'junction']").forEach(function (j) {
      j.data("general").forEach(function (id) { cy.getElementById(id).not(".folded").removeClass("dim").addClass("general"); });
    });
  }
  var statements = cy.nodes("[type = 'statement']"), junctions = cy.nodes("[type = 'junction']"), open = {}, section = "";
  function under(sec, s) { return s === sec || s.indexOf(sec + ".") === 0; }
  function statementsIn(sec) {
    return sec ? statements.filter(function (n) { return n.data("sections").some(function (s) { return under(sec, s); }); }) : statements;
  }
  function scope() {
    if (!section) return cy.elements();
    var st = statementsIn(section);
    var nodes = st.union(st.predecessors().nodes()).union(st.outgoers("edge[kind = 'aim']").targets());
    return nodes.union(nodes.edgesWith(nodes));
  }
  var counts = {};
  junctions.forEach(function (j) { counts[j.id()] = j.data("label"); });

  /* an edge runs right, turns, runs down or up, turns, runs right into its target. Its vertical run
     must lie in the gap after its source's rank — never inside the rank, where it would cut through
     the boxes stacked above or below the source — and before the answers written in front of the next
     rank. A rank is a column of nodes sharing a centre x, and its width is known only once laid out
     (a rank of junctions is 30 px wide, one with a box 240), so the turn is set after every layout:
     20 px right of the widest node in the source's column, measured back from the target (negative) */
  function route(eles) {
    var right = {};
    eles.nodes().forEach(function (n) { var k = Math.round(n.position("x")), b = n.boundingBox({ includeLabels: false }); right[k] = Math.max(right[k] || -Infinity, b.x2); });
    eles.edges().forEach(function (e) {
      var s = e.source(), t = e.target(), x = right[Math.round(s.position("x"))] + 20, turn = x - t.boundingBox({ includeLabels: false }).x1;
      e.data("turn", turn < -8 ? Math.round(turn) : 24);   /* a target beside or behind its source turns just after the source */
    });
  }

  /* fit what is open into the part of the canvas nothing covers. That part is the free row of the
     wrapper's grid (site.css, .graph-wrap): the controls make the row above it as tall as they are,
     the legend the row below, as tall as it is collapsed or expanded — so the free row is
     read once here instead of adding up the controls' height and the legend's with a constant each. */
  var canvas = document.getElementById("graph"), free = document.getElementById("free");
  function fit(eles, padding) {
    var bb = eles.boundingBox({ includeLabels: true }), w = cy.width(), h = cy.height();
    if (!bb.w || !bb.h) return;
    var g = canvas.getBoundingClientRect(), f = free.getBoundingClientRect();
    var top = Math.max(0, f.top - g.top), bottom = Math.max(0, g.bottom - f.bottom);
    var zoom = Math.max(cy.minZoom(), Math.min((w - 2 * padding) / bb.w, (h - top - bottom - 2 * padding) / bb.h, cy.maxZoom()));
    /* centred in the free row; what is still too large at the smallest zoom starts at the row's top left instead,
       so that it runs out below and to the right rather than under the controls above */
    var room = h - top - bottom, wide = bb.w * zoom > w - 2 * padding, tall = bb.h * zoom > room - 2 * padding;
    var x = wide ? padding - bb.x1 * zoom : (w - bb.w * zoom) / 2 - bb.x1 * zoom;
    var y = tall ? top + padding - bb.y1 * zoom : top + (room - bb.h * zoom) / 2 - bb.y1 * zoom;
    cy.animate({ zoom: zoom, pan: { x: x, y: y } }, { duration: 250 });
  }

  /* folding: the root, the first question and its answers — the families — are always
     shown; an open junction shows what hangs directly from it: its own recommendations
     (with their conditions and aims) and, behind a "Welche Population?" of its own, the
     junctions of its member groups, each folded until opened in turn. Every question
     folds too: a closed question is shown and nothing below it is — the first question
     folds the tree to the root and itself — while what was open below it stays open in
     `open`, so that opening the question again restores it */
  var root = cy.nodes("[type = 'root']"), q0 = root.outgoers("node[type = 'question']"), frame = root.union(q0);
  var families = junctions.filter(function (j) { return j.incomers("node").intersection(frame).nonempty(); });
  var always = frame.union(root.connectedEdges()), fan = families.union(families.incomers("edge")), closed = {};
  function relayout(fitTo) {
    var shown = closed[q0.id()] ? always : always.union(fan), inScope = scope();
    var done = {}, grew = true;
    while (grew) {   /* an open junction unfolds only while it is itself shown, so closing a family folds its members too */
      grew = false;
      junctions.forEach(function (j) {
        if (done[j.id()] || !open[j.id()] || !shown.contains(j)) return;
        done[j.id()] = true; grew = true;
        var out = j.outgoers();
        shown = shown.union(out);
        out.nodes().not("[type = 'junction']").forEach(function (n) {
          if (closed[n.id()]) return;   /* a folded question: shown, nothing below it */
          var members = n.outgoers("node[type = 'junction']");   /* the family's own question: its answers are groups, shown folded */
          shown = shown.union(members.nonempty() ? n.outgoers() : n.successors());
        });
      });
    }
    shown = shown.intersection(inScope);
    cy.elements().addClass("folded"); shown.removeClass("folded");
    cy.edges(".dup").removeClass("dup");
    junctions.forEach(function (j) { j.incomers("edge[kind = 'answer']").not(".folded").slice(1).addClass("dup"); });
    cy.nodes("[type = 'question']").forEach(function (q) { q.toggleClass("closed", !!closed[q.id()]); });
    junctions.forEach(function (j) {
      j.toggleClass("open", !!open[j.id()]);
      j.data("label", section ? String(j.successors("node[type = 'statement']").intersection(inScope).length) : counts[j.id()]);
    });
    /* nodes just unfolded were display:none a moment ago, so their label-derived heights are not
       computed yet and dagre would stack them; measuring their bounding boxes first fills them in */
    shown.nodes().forEach(function (n) { n.boundingBox({ includeLabels: true }); });
    var lay = shown.layout({ name: "dagre", rankDir: "LR", nodeSep: 18, rankSep: 230, edgeSep: 10, align: "UL", nodeDimensionsIncludeLabels: true,
                             animate: true, animationDuration: 250, fit: false });
    laying = lay;
    lay.one("layoutstop", function () { if (laying === lay) laying = null; route(shown); related(cy.nodes(".picked")); general(cy.nodes(".picked")); if (fitTo) fit(fitTo.not(".folded"), 30); if (cursor) counter(); });
    lay.run();
    highlight();
  }
  var laying = null;   /* the layout in flight: a step orders the matches by position, so it waits for this to settle */
  function toggle(j, force) {
    open[j.id()] = force === undefined ? !open[j.id()] : force;
    relayout(open[j.id()] ? j.union(j.successors()) : j.closedNeighborhood());
  }
  function foldQuestion(q, force) {
    closed[q.id()] = force === undefined ? !closed[q.id()] : force;
    relayout(closed[q.id()] ? q.closedNeighborhood() : q.union(q.successors()));
  }
  /* what leads to a selection and what follows it, and what it is shown with. An answer is an edge, and Cytoscape walks
     from nodes only — an edge has no predecessors, successors or neighbours of its own —, so an edge is walked back
     from its source and on from its target, and shown with both: the question it answers and the box it leads to */
  function before(eles) { var from = eles.nodes().union(eles.edges().sources()); return eles.union(from).union(from.predecessors()); }
  function after(eles) { var to = eles.nodes().union(eles.edges().targets()); return eles.union(to).union(to.successors()); }
  function near(eles) { return eles.closedNeighborhood().union(eles.edges().connectedNodes()); }
  function unfoldTo(eles) {   /* a deep link or a search reaches its target through every folded question on the way */
    var changed = false;
    before(eles).filter("node[type = 'question']").forEach(function (q) { if (closed[q.id()]) { delete closed[q.id()]; changed = true; } });
    return changed;
  }

  /* what the page selects by: the entities an element names — a node the one it stands for, an answer each concept
     it names (a patient group, a value, a statement's conditions, which hold at once), none for a question. The
     elements naming any of `refs` are where each of them appears, so a condition is found wherever it is one of an
     answer's conditions: by a tap, a deep link, a link in the section, a step */
  function naming(refs) {
    return cy.elements().filter(function (e) { return e.data("refs").some(function (r) { return refs.indexOf(r) >= 0; }); });
  }
  /* selection: what leads to the elements and what follows them stays; the rest fades; the sheet fills with the details
     of each entity selected, in the order named, and the URL carries their ids, joined by a comma */
  function select(eles, refs, push) {
    related(null); general(null);
    cy.elements().removeClass("dim picked");
    if (!eles || eles.empty()) {
      fill(home);
      if (push) history.replaceState(null, "", location.pathname + location.search);
      return;
    }
    var keep = before(eles).union(after(eles));
    cy.elements().not(keep).addClass("dim");
    eles.addClass("picked");
    related(eles); general(eles);
    fill(refs.map(function (r) { return data.html[r] || ""; }).join("") || home);
    if (push) history.replaceState(null, "", "#" + refs.join(","));
  }
  /* a tap selects what the element names, wherever each appears (naming): a box its statement, a group its concept,
     an answer every concept it names — one or several, by one rule */
  cy.on("tap", "node, edge", function (evt) {
    var t = evt.target, refs = t.data("refs");
    if (t.isNode() && t.data("type") === "question") { foldQuestion(t); return; }
    var j = t.isNode() && t.data("type") === "junction" ? t : (t.isEdge() && t.data("kind") === "answer" && t.target().data("type") === "junction" ? t.target() : null);
    if (j) { toggle(j); }
    if (!refs.length) return;
    var eles = naming(refs);
    select(eles, refs, true);
    if (!j) fit(near(eles).not(".folded"), 40);
  });
  cy.on("tap", function (evt) { if (evt.target === cy) select(null, null, true); });
  /* the page's own handlers are assigned, not added, so that a redraw under another axis replaces them */
  document.getElementById("fit").onclick = function () { fit(cy.elements().not(".folded"), 20); };
  window.onresize = function () { cy.resize(); };

  function open_(hash, push) {   /* a deep link: the ids of what is selected, joined by a comma (select) */
    var refs = hash ? hash.split(",") : [], eles = naming(refs);
    if (eles.empty()) { relayout(cy.elements()); return; }
    var groups = before(eles).filter("[type = 'junction']");
    groups.forEach(function (j) { open[j.id()] = true; });
    unfoldTo(eles);
    relayout(near(eles));
    select(eles, refs, push);
  }
  sheet.onclick = function (e) {
    if (e.target.closest(".peek-close")) { raise(false); return; }
    if (e.target.closest(".peek")) { raise(!sheet.classList.contains("raised")); return; }
    var a = e.target.closest("a.node-link");
    if (a && naming([a.dataset.node]).nonempty()) { e.preventDefault(); open_(a.dataset.node, true); if (window.innerWidth < 900) window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  /* the chapter tree: every section of the outline with the number of recommendations
     under it; sections without one are greyed; tapping one filters, "all" clears */
  var outline = data.outline || [];
  chapters.innerHTML = "";
  function setSection(sec) {
    section = sec;
    open = {}; closed = {};
    if (sec) statementsIn(sec).predecessors("node[type = 'junction']").forEach(function (j) { open[j.id()] = true; });   /* a chapter opens unfolded */
    chapters.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", (b.dataset.section || "") === sec); });
    chaptersToggle.textContent = sec ? "§ " + sec : "§";
    select(null, null, true);
    relayout(cy.elements());
  }
  if (outline.length) {
    var byNumber = {};
    outline.forEach(function (e) { byNumber[e.section] = e; });
    function item(e) {
      var n = statementsIn(e.section).length;
      var b = document.createElement("button"); b.type = "button"; b.dataset.section = e.section;
      b.innerHTML = '<span class="sec">' + e.section + '</span><span lang="' + (data.lang || "") + '">' + e.title.replace(/&/g, "&amp;").replace(/</g, "&lt;") + '</span><span class="n">' + (n || "") + "</span>";
      if (!n) { b.classList.add("empty"); b.disabled = true; b.title = "no recommendation extracted from this section"; }
      return b;
    }
    var lists = { "": document.createElement("ul") };
    var all = document.createElement("button"); all.type = "button"; all.className = "all active"; all.dataset.section = "";
    all.innerHTML = '<span class="sec">all</span><span>' + statements.length + " recommendations</span>";
    chapters.appendChild(all);   /* fixed at the top of the panel; the sections scroll below it */
    var list = document.createElement("div"); list.className = "list"; list.appendChild(lists[""]); chapters.appendChild(list);
    outline.forEach(function (e) {
      var parent = e.section.indexOf(".") >= 0 ? e.section.slice(0, e.section.lastIndexOf(".")) : "";
      if (!(parent in lists)) parent = "";
      var li = document.createElement("li"); li.appendChild(item(e));
      lists[parent].appendChild(li);
      var ul = document.createElement("ul"); lists[e.section] = ul; li.appendChild(ul);
    });
    chapters.querySelectorAll("ul:empty").forEach(function (ul) { ul.remove(); });
    chapters.onclick = function (e) {
      var b = e.target.closest("button"); if (!b || b.disabled) return;
      setSection(b.dataset.section || "");
      if (window.innerWidth < 900) { chapters.hidden = true; chaptersToggle.setAttribute("aria-expanded", "false"); }
    };
    chaptersToggle.onclick = function () {
      chapters.hidden = !chapters.hidden; chaptersToggle.setAttribute("aria-expanded", String(!chapters.hidden));
      if (!chapters.hidden && narrow()) showLegend(false);   /* one panel at a time on a phone (the legend's toggle, above) */
    };
  } else {
    chaptersToggle.hidden = true;
  }

  /* the search: a soft highlight — matches keep their colour, everything else fades but
     stays; groups holding a match unfold; the counter reads "n matches in m sections".
     Stepping — the arrows beside the box, ↓ and ↑ while it has focus — walks the visible
     matches in graph order and selects each as a tap would; the counter then reads
     "i of n matches in m sections" until the query changes */
  var query = "", facet = "", cursor = null;   /* cursor: the id of the match the reader stepped to */
  var stepBox = document.getElementById("step");
  while (facetSel.options.length > 1) facetSel.remove(1);
  (data.facets || []).forEach(function (f) { var o = document.createElement("option"); o.value = f; o.textContent = f.replace("_", " "); facetSel.appendChild(o); });
  facetSel.hidden = !(data.facets || []).length;
  function matches() {   /* the search text and the facet filter compose; either alone is a query */
    if (!query && !facet) return cy.collection();
    return scope().nodes().filter(function (n) {   /* a node matches by its own text or by the answer that leads to it — a condition is an edge */
      if (!n.data("text") || (facet && n.data("facets").indexOf(facet) < 0)) return false;
      return !query || n.data("text").indexOf(query) >= 0 || n.incomers("edge[kind = 'answer']").some(function (e) { return e.data("text").indexOf(query) >= 0; });
    });
  }
  function highlight() {
    cy.elements().removeClass("faded");
    count.hidden = stepBox.hidden = !query && !facet;
    if (count.hidden) return;
    var m = matches().not(".folded");
    cy.elements().not(".folded").not(m).not(m.connectedEdges()).not(frame).addClass("faded");   /* the frame stays for orientation */
    counter();
  }
  function ordered() {   /* the visible matches in graph order: from the root, a node before what hangs from it, siblings top to bottom */
    var m = matches().not(".folded"), seen = {}, out = [];
    function byY(a, b) { return a.position("y") - b.position("y") || a.position("x") - b.position("x"); }
    (function visit(n) {
      if (seen[n.id()]) return;
      seen[n.id()] = true;
      if (m.contains(n)) out.push(n);
      n.outgoers("edge[kind != 'relation']").targets().not(".folded").sort(byY).forEach(visit);   /* a relation leads sideways, not down */
    })(root);
    m.sort(byY).forEach(function (n) { if (!seen[n.id()]) out.push(n); });   /* whatever the root does not reach, last */
    return out;
  }
  function position(list) { for (var i = 0; i < list.length; i++) if (list[i].id() === cursor) return i; return -1; }
  function counter() {   /* "n matches in m sections" — with the reader's place first, "i of n", once they have stepped */
    var m = matches().not(".folded");
    var st = m.filter("[type = 'statement']").union(m.not("[type = 'statement']").neighborhood("node[type = 'statement']")), secs = {};
    st.forEach(function (n) { n.data("sections").forEach(function (s) { secs[s] = 1; }); });
    var n = m.length, k = Object.keys(secs).length, i = cursor ? position(ordered()) : -1;
    count.textContent = (i >= 0 ? (i + 1) + " of " : "") + n + (n === 1 ? " match" : " matches") + " in " + k + (k === 1 ? " section" : " sections");
  }
  /* a step selects the next (or previous) visible match as a tap would — the sheet opens, the graph fits to it —
     and wraps at both ends; the fading stays as it is. Only visible matches are stepped: research() has unfolded
     the way to every match, and one behind a question the reader closed since is folded, so not in the set */
  function step(dir) {
    if (laying) { laying.one("layoutstop", function () { step(dir); }); return; }
    var list = ordered(), len = list.length;
    if (!len) return;
    var i = position(list), n = list[dir < 0 ? (i < 0 ? len - 1 : (i + len - 1) % len) : (i + 1) % len], refs = n.data("refs");   /* from no place: the first, or the last when stepping back */
    cursor = n.id();
    if (refs.length) select(naming(refs), refs, true); else { select(null, null, true); n.addClass("picked"); }   /* a chapter node has no entity behind it */
    fit(n.closedNeighborhood().not(".folded"), 40);
    counter();
  }
  search.onkeydown = function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); step(e.key === "ArrowDown" ? 1 : -1); }
  };
  document.getElementById("step-next").onclick = function () { step(1); };
  document.getElementById("step-back").onclick = function () { step(-1); };
  stepBox.onmousedown = function (e) { e.preventDefault(); };   /* the search box keeps its focus, so the arrow keys keep working after a click */
  function research() {
    query = fold(search.value.trim()); facet = facetSel.value; cursor = null;   /* a new query: no place in it yet */
    var m = matches(), changed = unfoldTo(m);
    m.predecessors("node[type = 'junction']").forEach(function (j) { if (!open[j.id()]) { open[j.id()] = true; changed = true; } });
    if (changed) relayout(m.union(m.predecessors())); else highlight();
  }
  search.oninput = research;
  facetSel.onchange = research;

  /* the reset button: the page's opening state — folded, no search, no facet, no chapter,
     nothing selected — so the way back from any search or filter is one tap */
  function reset() {
    search.value = ""; facetSel.value = ""; query = ""; facet = ""; cursor = null;
    chapters.hidden = true; chaptersToggle.setAttribute("aria-expanded", "false");
    setSection("");   /* clears the fold and the selection, then lays out and fits */
  }
  document.getElementById("reset").onclick = reset;

  window.onhashchange = function () { open_(decodeURIComponent(location.hash.slice(1)), false); };
  cy.ready(function () { open_(decodeURIComponent(location.hash.slice(1)), false); });
  window.graphmed = { cy: cy, open: open_, toggle: toggle, fold: foldQuestion, reset: reset, isOpen: function (id) { return !!open[id]; }, isClosed: function (id) { return !!closed[id]; },
    section: setSection, search: function (q, f) { search.value = q; if (f !== undefined) facetSel.value = f; research(); }, step: step,
    by: switchTo, state: function () { return { by: by, section: section, query: search.value, facet: facetSel.value, ref: decodeURIComponent(location.hash.slice(1)) }; } };   /* for the console and tests */
  }
})();
