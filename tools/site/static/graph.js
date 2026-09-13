/* graph.med view page: one decision tree — which patient group? → which condition? →
   recommendation → aim — drawn left to right by Cytoscape.js with the dagre layout
   (self-hosted, see assets/vendor/LICENSES.md). Folded by default: tap an answer to
   unfold that patient group. Tap a box for its details in the section beside or below
   the graph. Tap a question to fold everything below it; tap it again to restore what
   was open there. A chapter tree (from the source's outline and the claims' sections) is
   a hard filter: only what that section supports is shown. The search is a soft
   highlight: matches keep their colour, the rest fades. The reset button returns the
   page to its opening state (docs/publication.md §3).
   Data: the #graph-data JSON written by tools/build.py. */
(function () {
  "use strict";
  var hint = document.getElementById("hint"), sheet = document.getElementById("sheet");
  var home = sheet.innerHTML;
  function fail(msg) { hint.hidden = false; hint.textContent = "The graph could not be drawn: " + msg; }
  try { draw(); } catch (e) { fail(e && e.message ? e.message : String(e)); throw e; }

  function draw() {
  var data = JSON.parse(document.getElementById("graph-data").textContent);
  var css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };
  var GRADE = { A: "--gA", B: "--gB", "0": "--g0", EK: "--gEK", mixed: "--line" };
  if (typeof cytoscape !== "function") throw new Error("library missing");
  if (typeof cytoscapeDagre === "function") cytoscape.use(cytoscapeDagre);

  /* the search compares folded text: no case, no diacritics ("osophagus" finds Ösophagus), ß as ss */
  function fold(s) { return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").toLowerCase(); }
  var elements = [], types = {};
  data.nodes.forEach(function (n) { types[n.id] = n.type; });
  data.nodes.forEach(function (n) {
    elements.push({ data: { id: n.id, ref: n.ref || "", type: n.type, label: n.label || "", group: n.group || "",
      fill: n.grade ? css(GRADE[n.grade] || "--line") : css("--bg"), against: n.against ? 1 : 0, contested: n.contested ? 1 : 0,
      sections: n.sections || [], text: fold(n.text), facets: n.facets || [] } });
  });
  data.edges.forEach(function (e, i) {
    /* an answer is written at the end of its edge, beside the group or box it leads to, so that
       ten answers fanning out of one question do not pile up at the edges' midpoints. The label is
       anchored where the arrow meets the target's boundary; the margin moves its centre left by half
       its width (estimated from the text, capped at the wrap width) and a small gap, so it ends just
       before the arrow and, with the rank separation below, never reaches the rank before */
    var width = Math.min(170, 6.2 * (e.label || "").length);
    elements.push({ data: { id: "e" + i, source: e.from, target: e.to, kind: e.kind, label: e.label || "", ref: e.ref || "", text: fold(e.text),
      lm: -(width / 2 + 10), turn: -200 } });   /* turn: where the edge's vertical run lies, set by route() after every layout */
  });

  var cy = cytoscape({
    container: document.getElementById("graph"),
    elements: elements,
    minZoom: 0.1, maxZoom: 4,
    boxSelectionEnabled: false, autounselectify: true,
    style: [
      { selector: "node", style: {
          "shape": "round-rectangle", "background-color": "data(fill)", "border-width": 1.5, "border-color": css("--mute"),
          "label": "data(label)", "color": css("--fg"), "font-family": "system-ui, sans-serif", "font-size": 12,
          "text-wrap": "wrap", "text-max-width": 210, "text-valign": "center", "text-halign": "center",
          "width": 240, "height": "label", "padding": 10 } },
      { selector: "node[type = 'root']", style: { "font-weight": 700, "border-color": css("--fg") } },
      { selector: "node[type = 'question']", style: { "shape": "diamond", "width": 200, "height": 120, "padding": 0, "text-max-width": 110, "border-color": css("--fg"), "font-weight": 600 } },
      { selector: "node[type = 'junction']", style: { "shape": "ellipse", "width": 30, "height": 30, "padding": 0, "font-size": 11, "font-weight": 700,
          "background-color": css("--bg"), "border-color": css("--fg"), "border-width": 2, "text-max-width": 30 } },
      { selector: "node[type = 'junction'].open", style: { "background-color": css("--fg"), "color": css("--bg") } },
      { selector: "node[type = 'question'].closed", style: { "background-color": css("--line"), "border-style": "dashed" } },   /* folded: there is more below */
      { selector: "node[type = 'statement']", style: { "color": "#111", "border-color": "rgba(0,0,0,0)", "text-halign": "center" } },
      { selector: "node[type = 'statement'][against = 1]", style: { "border-width": 3, "border-color": css("--contested") } },
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
      { selector: "edge[kind = 'relation']", style: { "line-style": "dotted", "line-color": css("--statement"), "target-arrow-color": css("--statement"),
          "curve-style": "taxi", "taxi-direction": "rightward", "taxi-turn": "data(turn)", "taxi-turn-min-distance": 8 } },
      { selector: "edge.dup", style: { "target-label": "" } },   /* a group reached from two open parents names its answer once */
      { selector: ".folded", style: { "display": "none" } },
      { selector: ".dim", style: { "opacity": 0.12 } },
      { selector: ".faded", style: { "opacity": 0.15 } },
      { selector: "node.picked", style: { "border-width": 3, "border-color": css("--fg") } },
      { selector: "edge.picked", style: { "line-color": css("--fg"), "width": 3 } }
    ],
    layout: { name: "preset" }
  });

  /* the chapter filter: the statements supported from a section or its subsections,
     what leads to them and their aims — nothing else is shown, no edge is computed */
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
      e.data("turn", turn < -8 ? Math.round(turn) : 24);   /* a target beside or behind its source (a relation) turns just after the source */
    });
  }

  /* fit what is open into the part of the canvas the controls do not cover: the search row floats
     over its top and the legend over its bottom, so a plain fit would put nodes under them */
  var tools = document.querySelectorAll(".tools");
  function fit(eles, padding) {
    var bb = eles.boundingBox({ includeLabels: true }), w = cy.width(), h = cy.height();
    if (!bb.w || !bb.h) return;
    var top = Math.max.apply(null, Array.prototype.map.call(tools, function (t) { return t.getBoundingClientRect().height; })) + 16, bottom = hint.hidden ? 0 : hint.getBoundingClientRect().height + 4;
    var zoom = Math.max(cy.minZoom(), Math.min((w - 2 * padding) / bb.w, (h - top - bottom - 2 * padding) / bb.h, cy.maxZoom()));
    cy.animate({ zoom: zoom, pan: { x: (w - bb.w * zoom) / 2 - bb.x1 * zoom, y: top + (h - top - bottom - bb.h * zoom) / 2 - bb.y1 * zoom } }, { duration: 250 });
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
    lay.one("layoutstop", function () { route(shown); if (fitTo) fit(fitTo.not(".folded"), 30); });
    lay.run();
    highlight();
  }
  function toggle(j, force) {
    open[j.id()] = force === undefined ? !open[j.id()] : force;
    relayout(open[j.id()] ? j.union(j.successors()) : j.closedNeighborhood());
  }
  function foldQuestion(q, force) {
    closed[q.id()] = force === undefined ? !closed[q.id()] : force;
    relayout(closed[q.id()] ? q.closedNeighborhood() : q.union(q.successors()));
  }
  function unfoldTo(eles) {   /* a deep link or a search reaches its target through every folded question on the way */
    var changed = false;
    eles.union(eles.predecessors()).filter("node[type = 'question']").forEach(function (q) { if (closed[q.id()]) { delete closed[q.id()]; changed = true; } });
    return changed;
  }

  /* selection: what leads to the element and what follows it stays; the rest fades; the sheet fills */
  function select(eles, ref, push) {
    cy.elements().removeClass("dim picked");
    if (!eles || eles.empty()) {
      sheet.innerHTML = home; hint.hidden = false;
      if (push) history.replaceState(null, "", location.pathname);
      return;
    }
    var keep = eles.union(eles.predecessors()).union(eles.successors());
    cy.elements().not(keep).addClass("dim");
    eles.addClass("picked");
    sheet.innerHTML = data.html[ref] || home; hint.hidden = !data.html[ref];
    if (push) history.replaceState(null, "", "#" + ref);
    if (window.innerWidth < 900) sheet.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  cy.on("tap", "node, edge", function (evt) {
    var t = evt.target, ref = t.data("ref");
    if (t.isNode() && t.data("type") === "question") { foldQuestion(t); return; }
    var j = t.isNode() && t.data("type") === "junction" ? t : (t.isEdge() && t.data("kind") === "answer" && t.target().data("type") === "junction" ? t.target() : null);
    if (j) { toggle(j); }
    if (!ref) return;
    var eles = cy.elements("[ref = '" + ref + "']");
    select(eles, ref, true);
    if (!j) fit(eles.closedNeighborhood().not(".folded"), 40);
  });
  cy.on("tap", function (evt) { if (evt.target === cy) select(null, null, true); });
  document.getElementById("fit").addEventListener("click", function () { fit(cy.elements().not(".folded"), 20); });
  window.addEventListener("resize", function () { cy.resize(); });

  function open_(ref, push) {
    var eles = ref ? cy.elements("[ref = '" + ref + "']") : cy.collection();
    if (eles.empty()) { relayout(cy.elements()); return; }
    var groups = eles.union(eles.predecessors()).filter("[type = 'junction']");
    groups.forEach(function (j) { open[j.id()] = true; });
    unfoldTo(eles);
    relayout(eles.closedNeighborhood());
    select(eles, ref, push);
  }
  sheet.addEventListener("click", function (e) {
    var a = e.target.closest("a.node-link");
    if (a && cy.elements("[ref = '" + a.dataset.node + "']").nonempty()) { e.preventDefault(); open_(a.dataset.node, true); if (window.innerWidth < 900) window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  /* the chapter tree: every section of the outline with the number of recommendations
     under it; sections without one are greyed; tapping one filters, "all" clears */
  var chapters = document.getElementById("chapters"), chaptersToggle = document.getElementById("chapters-toggle");
  var outline = data.outline || [];
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
    chapters.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || b.disabled) return;
      setSection(b.dataset.section || "");
      if (window.innerWidth < 900) { chapters.hidden = true; chaptersToggle.setAttribute("aria-expanded", "false"); }
    });
    chaptersToggle.addEventListener("click", function () { chapters.hidden = !chapters.hidden; chaptersToggle.setAttribute("aria-expanded", String(!chapters.hidden)); });
  } else {
    chaptersToggle.hidden = true;
  }

  /* the search: a soft highlight — matches keep their colour, everything else fades but
     stays; groups holding a match unfold; the counter reads "n matches in m sections" */
  var search = document.getElementById("search"), count = document.getElementById("count"), facetSel = document.getElementById("facet"), query = "", facet = "";
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
    if (!query && !facet) { count.hidden = true; return; }
    var m = matches().not(".folded");
    cy.elements().not(".folded").not(m).not(m.connectedEdges()).not(frame).addClass("faded");   /* the frame stays for orientation */
    var st = m.filter("[type = 'statement']").union(m.not("[type = 'statement']").neighborhood("node[type = 'statement']")), secs = {};
    st.forEach(function (n) { n.data("sections").forEach(function (s) { secs[s] = 1; }); });
    var n = m.length, k = Object.keys(secs).length;
    count.textContent = n + (n === 1 ? " match" : " matches") + " in " + k + (k === 1 ? " section" : " sections");
    count.hidden = false;
  }
  function research() {
    query = fold(search.value.trim()); facet = facetSel.value;
    var m = matches(), changed = unfoldTo(m);
    m.predecessors("node[type = 'junction']").forEach(function (j) { if (!open[j.id()]) { open[j.id()] = true; changed = true; } });
    if (changed) relayout(m.union(m.predecessors())); else highlight();
  }
  search.addEventListener("input", research);
  facetSel.addEventListener("change", research);

  /* the reset button: the page's opening state — folded, no search, no facet, no chapter,
     nothing selected — so the way back from any search or filter is one tap */
  function reset() {
    search.value = ""; facetSel.value = ""; query = ""; facet = "";
    chapters.hidden = true; chaptersToggle.setAttribute("aria-expanded", "false");
    setSection("");   /* clears the fold and the selection, then lays out and fits */
  }
  document.getElementById("reset").addEventListener("click", reset);

  window.addEventListener("hashchange", function () { open_(decodeURIComponent(location.hash.slice(1)), false); });
  cy.ready(function () { open_(decodeURIComponent(location.hash.slice(1)), false); });
  window.graphmed = { cy: cy, open: open_, toggle: toggle, fold: foldQuestion, reset: reset, isOpen: function (id) { return !!open[id]; }, isClosed: function (id) { return !!closed[id]; },
    section: setSection, search: function (q, f) { search.value = q; if (f !== undefined) facetSel.value = f; search.dispatchEvent(new Event("input")); } };   /* for the console and tests */
  }
})();
