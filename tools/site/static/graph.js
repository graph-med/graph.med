/* graph.med view page: one decision tree — which patient group? → which condition? →
   recommendation → aim — drawn left to right by Cytoscape.js with the dagre layout
   (self-hosted, see assets/vendor/LICENSES.md). Folded by default: tap an answer to
   unfold that patient group. Tap a box for its details in the section beside or below
   the graph (on a phone, a peek strip that raises it). Tap a question to fold everything below it; tap it again to restore what
   was open there. A chapter tree (from the source's outline and the claims' sections) is
   a hard filter: only what that section supports is shown. The search is a soft
   highlight: matches keep their colour, the rest fades; the arrows beside the box, or
   ↓ and ↑ in it, step from match to match. Unfolding fits the whole unfolded part and the
   answer that names it, the fit button everything open; the back button returns the view as it
   was before the reader's last change, one change at a time (docs/publication.md §3). An assistant beside the reader reads the
   view and acts on it through the session tools, a page function and WebMCP tools (§8). The axis switch chooses which of
   the view's groupings is drawn — its tree of patient groups (the first), the chapters of
   its sources, or another axis of its `group_by` (spec §4.1) — as `?by=<grouping>` in the
   URL (`section` for the chapters, else the axis id; absent for the first), so a grouped
   view is a shareable link.
   The legend under the graph keys what the view draws: a pill in the corner at every
   load, which opens and closes it.
   Data: the #graph-data JSON written by tools/build.py, one tree per grouping. Words: what
   this script writes outside the graph — the counter, the chapter panel, the failure, the
   strip's close label — is the page chrome's, read from the page (#graph's data-words,
   #sheet's data-close), so that no word is written here. */
(function () {
  "use strict";
  var legend = document.getElementById("legend"), sheet = document.getElementById("sheet");
  var words = JSON.parse(document.getElementById("graph").dataset.words || "{}");
  /* a word with its blanks filled ("{n} …"), and of a pair the form its count takes (`one` for 1, else `many`) */
  function say(text, values) { return text.replace(/\{(\w+)\}/g, function (m, k) { return k in values ? String(values[k]) : m; }); }
  function pair(p, n) { return n === 1 ? p.one : p.many; }
  var home = sheet.innerHTML;
  var data = JSON.parse(document.getElementById("graph-data").textContent);
  var chapters = document.getElementById("chapters"), chaptersToggle = document.getElementById("chapters-toggle");
  var search = document.getElementById("search"), count = document.getElementById("count"), facetSel = document.getElementById("facet");
  var first = data.groupings[0].axis;   /* the view's tree of patient groups, what the page opens with */
  var axisSel = document.getElementById("axis"), by = new URLSearchParams(location.search).get("by") || first, cy = null;
  if (!data.groupings.some(function (g) { return g.axis === by; })) by = first;   /* an unknown axis in the link: the first grouping */
  data.groupings.forEach(function (g) { var o = document.createElement("option"); o.value = g.axis; o.textContent = g.label; o.lang = g.lang; axisSel.appendChild(o); });
  axisSel.value = by; axisSel.hidden = data.groupings.length < 2;   /* a single grouping needs no switch */
  function fail(msg) { legend.textContent = say(words.failed, { message: msg }); }

  /* the legend: collapsed at every load, on every screen, and opened only by its pill — nothing is remembered. The pill
     toggles the panel beside it; the zoom does not follow, the fit button does (the free row is re-read). On a
     phone the panel opens over the graph (site.css) and is as tall as the free row at most, read on opening */
  var legendPanel = document.getElementById("legend-panel"), legendToggle = document.getElementById("legend-toggle");
  var freeRow = document.getElementById("free");
  function showLegend(on) {
    legendPanel.style.maxHeight = on && narrow() ? Math.max(120, freeRow.getBoundingClientRect().height - 8) + "px" : "";
    legendPanel.hidden = !on; legendToggle.setAttribute("aria-expanded", String(on));
  }
  /* on a phone the legend and the chapter panel share the little height the graph leaves, so opening one closes the other */
  var narrow = function () { return !(window.matchMedia && window.matchMedia("(min-width: 900px)").matches); };
  showLegend(false);
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
    remember();
    var g = window.graphmed, was = g.state();
    redraw(axis);
    g = window.graphmed;
    if (was.section) g.section(was.section);
    if (was.query || was.facet) g.search(was.query, was.facet);
    if (was.ref) g.open(was.ref, true);
  }
  function redraw(axis, then) {   /* the tree of a grouping, opened as a load opens it — or, with `then`, as that view (back) */
    by = data.groupings.some(function (x) { return x.axis === axis; }) ? axis : first;
    axisSel.value = by;
    history.replaceState(null, "", location.pathname + (by !== first ? "?by=" + encodeURIComponent(by) : "") + location.hash);
    cy.destroy();
    draw(then);
  }

  /* the back button: every change the reader makes to the view first keeps the view it leaves — what is open and what
     is closed, the selection, the chapter, the search and its facet, the grouping, the zoom and the pan (view, in
     draw) —, and back returns to the last view kept, one change at a time, until the view the page opened with; with
     nothing kept it is disabled (docs/publication.md §3). One action is one change, however many steps it takes (a tap
     that unfolds a group selects it too): what one turn of the event loop keeps, it keeps once, before its first step.
     A search being typed, or its facet chosen, is one change until a change of another kind follows */
  var trail = [], backBtn = document.getElementById("back"), keeping = false;
  function remember(kind) {
    if (keeping || !window.graphmed) return;
    keeping = true;
    setTimeout(function () { keeping = false; }, 0);
    kind = kind || "";
    if (kind && trail.length && trail[trail.length - 1].kind === kind) return;
    var v = window.graphmed.view();
    v.kind = kind;
    trail.push(v);
    if (trail.length > 100) trail.shift();
    backBtn.disabled = false;
  }
  function back() {
    var v = trail.pop();
    backBtn.disabled = !trail.length;
    if (!v) return;
    if (v.by !== by) redraw(v.by, v); else window.graphmed.restore(v);
  }
  backBtn.onclick = back;

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
      /* the assistant's highlight (the session tools): a halo in the page's accent behind the box or the answer's line —
         apart from the reader's selection (the border) and from the outlines of related and general boxes */
      { selector: "node.assisted", style: { "underlay-color": css("--accent"), "underlay-opacity": 0.45, "underlay-padding": 7, "underlay-shape": "round-rectangle" } },
      { selector: "node[type = 'junction'].assisted", style: { "underlay-shape": "ellipse" } },
      { selector: "edge.assisted", style: { "underlay-color": css("--accent"), "underlay-opacity": 0.45, "underlay-padding": 5, "color": css("--accent") } },
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
     the strip names every card's title, one to a line, and each card after the first numbers the ids its template repeats. */
  /* what the reader opened or closed on one card stays so on the next: every disclosure the card marks with
     `data-keep` (the evidence table, the general groups, a rule, the folded body text and related statements) is remembered by that
     name for as long as the page is open — in this variable, never in storage — and set so on every fill */
  var kept = {};
  sheet.addEventListener("toggle", function (e) {
    var k = e.target && e.target.getAttribute && e.target.getAttribute("data-keep");
    if (k) kept[k] = e.target.open;
  }, true);
  /* raised on a phone, the strip shows the title and the judgement again once the card's own title has scrolled
     away, so that the reader always knows which recommendation the text under the strip belongs to */
  var titled = null;
  sheet.addEventListener("scroll", function () {
    if (!titled || !sheet.classList.contains("raised")) return;
    var bar = sheet.querySelector(".peek-bar");
    sheet.classList.toggle("titled", titled.getBoundingClientRect().bottom < (bar ? bar.getBoundingClientRect().bottom : 0));
  }, { passive: true });
  /* the page ends with the strip's own height, so that the footer lies above it (site.css, --strip): read on every fill
     and whenever the sheet changes size while it waits lowered, never stated as a constant */
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
    var cards = Array.prototype.slice.call(sheet.querySelectorAll(".card")), card = cards[0], title = card && card.querySelector("h2.title, .label");
    titled = title;
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
      t.className = "peek-title" + (cards.length > 1 ? " several" : "");
      cards.forEach(function (c) {   /* each card's title in its own language; several stand one to a line, each cut on its own */
        var s = document.createElement("span"), h = c.querySelector("h2.title, .label");
        if (h) { h = h.cloneNode(true); h.querySelectorAll(".origin").forEach(function (o) { o.remove(); }); }   /* the title alone, without its origin tag */
        s.lang = c.lang; s.textContent = h ? h.textContent.trim() : "";
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
      close.type = "button"; close.className = "peek-close"; close.setAttribute("aria-label", sheet.dataset.close || ""); close.textContent = "✕";
      bar.appendChild(peek); bar.appendChild(close);
      sheet.insertBefore(bar, sheet.firstChild);
      sheet.classList.add("peeking");
    }
    sheet.scrollTop = 0;
    strip();
    if (cy) cy.resize();   /* on a phone the strip's coming or going changes the canvas's height (site.css): a fit that follows reads the new one */
  }
  /* lowered, the sheet hides all but the strip: where the focus was on what it hides — a control of the card, or ✕ —
     it goes to the strip, so that it never falls to the page and the next Tab goes on from the strip; anywhere else
     it stays (home.js does the same) */
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

  /* the session tools as a page function — window.graphmed.agent, for an agent that runs script in the page — and as
     WebMCP tools where the browser offers document.modelContext (or the older navigator.modelContext): one set of
     definitions (tools/site/session-tools.json), each call answered by the graph drawn now (window.graphmed.session),
     so that a redraw under another grouping, or back across one, keeps them (docs/publication.md §8) */
  var tools = JSON.parse(document.getElementById("session-tools").textContent);
  function names() { return "the page's tools: " + tools.tools.map(function (t) { return t.name; }).join(", "); }
  /* the brief form: each tool's name, title, line and arguments (an optional one marked "?"); with a tool's name, its
     full definition — what WebMCP registers */
  function describe(name) {
    if (name !== undefined) {
      var t = tools.tools.filter(function (x) { return x.name === name; })[0];
      return t ? { name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, readOnly: !!t.readOnly } : { error: "no tool " + name, hint: names() };
    }
    return { version: tools.version, about: tools.about, tools: tools.tools.map(function (t) {
      var req = t.inputSchema.required || [];
      return { name: t.name, title: t.title, line: t.line, args: Object.keys(t.inputSchema.properties || {}).map(function (k) { return req.indexOf(k) >= 0 ? k : k + "?"; }) };
    }) };
  }
  /* a promise of the answer: what was refused; a read (find, details) at once; view once the graph is at rest; an act,
     once at rest, briefly — the state after it and what became of the boxes it acted on (brief), with the boxes when
     its `view` asks for them */
  function call(name, args) {
    var s = window.graphmed && window.graphmed.session;
    if (!s) return Promise.resolve({ error: "the graph is not drawn" });
    if (!s.acts.hasOwnProperty(name)) return Promise.resolve({ error: "no tool " + name, hint: names() });
    args = args && typeof args === "object" ? args : {};
    if (args.view !== undefined && (!args.view || typeof args.view !== "object" || Array.isArray(args.view)))
      return Promise.resolve({ error: "view: an object of view's arguments", hint: "{} reads the first page of boxes after the act" });
    var r;
    try { r = s.acts[name](args) || {}; } catch (e) { return Promise.reject(e); }
    if (r.error) return Promise.resolve(r);
    if (r.answer) return Promise.resolve(r.answer);
    return new Promise(function (next) { setTimeout(next, 0); }).then(function () {   /* back across a grouping draws anew: read the graph drawn now */
      var now = window.graphmed.session;
      return now.rest().then(function () { return name === "view" ? now.look(args) : now.brief(name, now === s ? r.targets : null, args.view); });
    });
  }
  var agent = { version: tools.version, describe: describe, call: call };

  try { draw(); } catch (e) { fail(e && e.message ? e.message : String(e)); throw e; }
  (function register() {   /* once, after the first draw; a browser that refuses a tool leaves the page function as it is */
    var mc = document.modelContext || navigator.modelContext;
    if (!mc || typeof mc.registerTool !== "function") return;
    tools.tools.forEach(function (t) {
      var tool = { name: t.name, title: t.title, description: t.name === "view" ? t.description + " " + tools.about : t.description, inputSchema: t.inputSchema,
                   execute: function (input) { return call(t.name, input); } };
      if (t.readOnly) tool.annotations = { readOnlyHint: true };
      try { Promise.resolve(mc.registerTool(tool)).catch(function () {}); } catch (e) { /* refused */ }
    });
  })();

  function draw(then) {
  var tree = data.groupings.filter(function (g) { return g.axis === by; })[0];
  if (typeof cytoscape !== "function") throw new Error(words.missing);
  if (typeof cytoscapeDagre === "function") cytoscape.use(cytoscapeDagre);

  /* the search compares folded text: no case, no diacritics ("osophagus" finds Ösophagus), ß as ss */
  function fold(s) { return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").toLowerCase(); }
  var elements = [], types = {};
  tree.nodes.forEach(function (n) { types[n.id] = n.type; });
  tree.nodes.forEach(function (n) {
    elements.push({ data: { id: n.id, refs: n.ref ? [n.ref] : [], type: n.type, label: n.label || "", group: n.group || "",
      direction: n.direction || "", contested: n.contested ? 1 : 0, grade: n.grade || "", no: n.no || "",
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
    minZoom: 0.02, maxZoom: 4,   /* low enough that the fit button holds everything open, whole, on a phone too (fit) */
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
     read once here instead of adding up the controls' height and the legend's with a constant each.
     What is framed is its nodes and every word on them and on its edges; an edge's line runs between its nodes, so an
     answer that leads into the frame from a question outside it adds its words, not its line back to that question */
  var canvas = document.getElementById("graph"), free = document.getElementById("free");
  var framed = cy.collection();   /* what the last fit framed, none once a view is restored (window.graphmed.frame, for tests) */
  var fitted = null;   /* where the last fit put the graph, so that a change to the free row can tell whether the reader moved it since (mark) */
  function fit(eles, padding) {
    framed = eles;
    var bb = eles.boundingBox({ includeLabels: true, includeEdges: false }), w = cy.width(), h = cy.height();
    if (!bb.w || !bb.h) return;
    var g = canvas.getBoundingClientRect(), f = free.getBoundingClientRect();
    var top = Math.max(0, f.top - g.top), bottom = Math.max(0, g.bottom - f.bottom);
    var zoom = Math.max(cy.minZoom(), Math.min((w - 2 * padding) / bb.w, (h - top - bottom - 2 * padding) / bb.h, cy.maxZoom()));
    /* centred in the free row; what is still too large at the smallest zoom starts at the row's top left instead,
       so that it runs out below and to the right rather than under the controls above */
    var room = h - top - bottom, wide = bb.w * zoom > w - 2 * padding, tall = bb.h * zoom > room - 2 * padding;
    var x = wide ? padding - bb.x1 * zoom : (w - bb.w * zoom) / 2 - bb.x1 * zoom;
    var y = tall ? top + padding - bb.y1 * zoom : top + (room - bb.h * zoom) / 2 - bb.y1 * zoom;
    fitted = { zoom: zoom, pan: { x: x, y: y }, padding: padding };
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
  function relayout(fitTo, view) {   /* lay out what is shown, then fit fitTo — or, with `view` (restore), return to its zoom and pan */
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
    /* a view returned to (restore) puts every box back where it stood: the places are kept with the view, because a
       layout of the same groups can land a few units aside — a selected box is drawn wider, and its column with it */
    var placed = view && shown.nodes().every(function (n) { return view.pos[n.id()]; });
    var lay = placed ? shown.layout({ name: "preset", positions: function (n) { return view.pos[n.id()]; }, animate: true, animationDuration: 250, fit: false })
                   : shown.layout({ name: "dagre", rankDir: "LR", nodeSep: 18, rankSep: 230, edgeSep: 10, align: "UL", nodeDimensionsIncludeLabels: true,
                                    animate: true, animationDuration: 250, fit: false });
    laying = lay;
    lay.one("layoutstop", function () {
      var last = laying === lay;   /* a layout overtaken by a later one leaves the viewport to that one */
      if (last) laying = null;
      route(shown); related(cy.nodes(".picked")); general(cy.nodes(".picked"));
      if (last && view) { framed = cy.collection(); cy.animate({ zoom: view.zoom, pan: view.pan }, { duration: 250 }); }
      else if (last && fitTo) fit(fitTo.not(".folded"), 30);
      if (cursor) counter();
    });
    lay.run();
    highlight();
  }
  var laying = null;   /* the layout in flight: a step orders the matches by position, so it waits for this to settle */
  /* unfolding a group fits the group, everything it unfolds and the answer that names it — written left of the group,
     so that the reader sees which group they opened —, as far out as that takes; folding it, the group and what is
     around it */
  function toggle(j, force) {
    remember();
    open[j.id()] = force === undefined ? !open[j.id()] : force;
    relayout(open[j.id()] ? j.union(j.successors()).union(j.incomers("edge[kind = 'answer']")) : j.closedNeighborhood());
  }
  function foldQuestion(q, force) {
    remember();
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
    remember();   /* after a group's toggle, the same change (remember) */
    var eles = naming(refs);
    select(eles, refs, true);
    if (!j) fit(near(eles).not(".folded"), 40);
  });
  cy.on("tap", function (evt) {
    if (evt.target !== cy) return;
    if (location.hash.length > 1 || cy.elements(".picked").nonempty()) remember();   /* a selection undone is a change */
    select(null, null, true);
  });
  cy.on("tapstart", function () { if (narrow() && !legendPanel.hidden) showLegend(false); });   /* the legend lies over the graph on a phone: touching the graph puts it away */
  /* the page's own handlers are assigned, not added, so that a redraw under another axis replaces them */
  document.getElementById("fit").onclick = function () { remember(); fit(cy.elements().not(".folded"), 20); };
  window.onresize = function () { cy.resize(); };

  /* a deep link: the ids of what is selected, joined by a comma (select). It unfolds the way and every group it names,
     and fits what it selects and what is around it — a group it names with everything that group shows, as unfolding
     it by a tap does (toggle) */
  function open_(hash, push) {
    var refs = hash ? hash.split(",") : [], eles = naming(refs);
    if (eles.empty()) { relayout(cy.elements()); return; }
    var groups = before(eles).filter("[type = 'junction']");
    groups.forEach(function (j) { open[j.id()] = true; });
    unfoldTo(eles);
    var named = eles.nodes("[type = 'junction']");
    relayout(near(eles).union(named).union(named.successors()));
    select(eles, refs, push);
  }
  sheet.onclick = function (e) {
    if (e.target.closest(".peek-close")) { raise(false); return; }
    if (e.target.closest(".peek")) { raise(!sheet.classList.contains("raised")); return; }
    var a = e.target.closest("a.node-link");
    if (a && naming([a.dataset.node]).nonempty()) { e.preventDefault(); remember(); open_(a.dataset.node, true); if (window.innerWidth < 900) window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  /* the chapter tree: every section of the outline with the number of recommendations
     under it; sections without one are greyed; tapping one filters, "all" clears */
  var outline = data.outline || [];
  chapters.innerHTML = "";
  function marks(sec) {   /* the chapter shown: its entry in the panel active, its number on the panel's button */
    chapters.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", (b.dataset.section || "") === sec); });
    chaptersToggle.textContent = sec ? "§ " + sec : "§";
  }
  function setSection(sec) {
    remember();
    section = sec;
    open = {}; closed = {};
    if (sec) statementsIn(sec).predecessors("node[type = 'junction']").forEach(function (j) { open[j.id()] = true; });   /* a chapter opens unfolded */
    marks(sec);
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
      if (!n) { b.classList.add("empty"); b.disabled = true; b.title = words.chapters.empty; }
      return b;
    }
    var lists = { "": document.createElement("ul") };
    var all = document.createElement("button"); all.type = "button"; all.className = "all active"; all.dataset.section = "";
    var allSec = document.createElement("span"), allN = document.createElement("span");
    allSec.className = "sec"; allSec.textContent = words.chapters.all;
    allN.textContent = say(pair(words.chapters.recommendations, statements.length), { n: statements.length });
    all.appendChild(allSec); all.appendChild(allN);
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
     stays; groups holding a match unfold; the counter counts the matches and the sections they lie in.
     Stepping — the arrows beside the box, ↓ and ↑ while it has focus — walks the visible
     matches in graph order and selects each as a tap would; the counter then leads with
     the reader's place among the matches until the query changes */
  var query = "", facet = "", cursor = null;   /* cursor: the id of the match the reader stepped to */
  var stepBox = document.getElementById("step");
  facetSel.hidden = facetSel.options.length < 2;   /* its entries are the page's: each facet the view draws, by its word */
  function matches() { return query || facet ? matching(query, facet, scope()) : cy.collection(); }   /* the search text and the facet filter compose; either alone is a query */
  function matching(q, f, within) {   /* the nodes of `within` a folded text and a facet match: by a node's own text or by the answer that leads to it — a condition is an edge */
    return within.nodes().filter(function (n) {
      if (!n.data("text") || (f && n.data("facets").indexOf(f) < 0)) return false;
      return !q || n.data("text").indexOf(q) >= 0 || n.incomers("edge[kind = 'answer']").some(function (e) { return e.data("text").indexOf(q) >= 0; });
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
  function counter() {   /* n matches in m sections — with the reader's place first, i of n, once they have stepped; the words and their pairs the page's */
    var m = matches().not(".folded");
    var st = m.filter("[type = 'statement']").union(m.not("[type = 'statement']").neighborhood("node[type = 'statement']")), secs = {};
    st.forEach(function (n) { n.data("sections").forEach(function (s) { secs[s] = 1; }); });
    var n = m.length, k = Object.keys(secs).length, i = cursor ? position(ordered()) : -1;
    var S = words.search;
    count.textContent = say(S.counter, { matches: say(i >= 0 ? pair(S.at, n) : pair(S.matches, n), { i: i + 1, n: n }), sections: say(pair(S.sections, k), { k: k }) });
  }
  /* a step selects the next (or previous) visible match as a tap would — the sheet opens, the graph fits to it —
     and wraps at both ends; the fading stays as it is. Only visible matches are stepped: research() has unfolded
     the way to every match, and one behind a question the reader closed since is folded, so not in the set */
  function step(dir) {
    if (laying) { laying.one("layoutstop", function () { step(dir); }); return; }
    var list = ordered(), len = list.length;
    if (!len) return;
    remember();
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
  var typed = "";   /* the search as typed, for the view kept before the next one (the box holds the new text already) */
  function research() {
    remember("search");
    typed = search.value;
    query = fold(search.value.trim()); facet = facetSel.value; cursor = null;   /* a new query: no place in it yet */
    var m = matches(), changed = unfoldTo(m);
    m.predecessors("node[type = 'junction']").forEach(function (j) { if (!open[j.id()]) { open[j.id()] = true; changed = true; } });
    if (changed) relayout(m.union(m.predecessors())); else highlight();
  }
  search.oninput = research;
  facetSel.onchange = research;

  /* the view the back button keeps and returns to (remember, back): the folding, the chapter, the search, the selection,
     the assistant's highlight, the grouping, where every box stands, and the viewport — returned to, it shows what the
     reader saw */
  function view() {
    var pos = {};
    cy.nodes().not(".folded").forEach(function (n) { var p = n.position(); pos[n.id()] = { x: p.x, y: p.y }; });
    return { by: by, open: copy(open), closed: copy(closed), section: section, query: typed, facet: facet, cursor: cursor,
             ref: decodeURIComponent(location.hash.slice(1)), assist: assist && { ids: assist.ids.slice(), note: assist.note },
             pos: pos, zoom: cy.zoom(), pan: { x: cy.pan().x, y: cy.pan().y } };
  }
  function copy(flags) { var c = {}; Object.keys(flags).forEach(function (k) { if (flags[k]) c[k] = true; }); return c; }
  function restore(v) {
    open = copy(v.open); closed = copy(v.closed); section = v.section; marks(section);
    search.value = typed = v.query; facetSel.value = facet = v.facet; query = fold(v.query.trim()); cursor = v.cursor;
    var refs = v.ref ? v.ref.split(",") : [];
    relayout(null, v);
    select(refs.length ? naming(refs) : null, refs, true);
    if (!refs.length && cursor) cy.getElementById(cursor).addClass("picked");   /* a step to a chapter node, which names no entity */
    assist = v.assist && { ids: v.assist.ids.slice(), note: v.assist.note };
    mark();
  }

  /* the session tools (docs/publication.md §8, "The session tools"; their names, the words a model reads about them and
     their arguments are tools/site/session-tools.json; the page function and the WebMCP tools are beside draw()): what an
     assistant beside the reader reads of the view and does to it. view, find and details read and change nothing. An act
     is one the reader's own controls make — a deep link, a fold, a fit, a search, a step, back —, kept for the back button
     like theirs (remember), and answered briefly once the layout and the fit are at rest: the state after it and what
     became of the boxes it acted on (brief); nothing persists. The highlight is the assistant's own mark, drawn apart from
     the reader's selection and named on a line under the controls, where the reader clears it */
  var assist = null, assistLine = document.getElementById("assist");   /* the highlight: the ids it names and its note */
  var KIND = { root: "root", question: "question", junction: "group", statement: "statement", aim: "aim" };
  function ident(e) { return e.data("refs")[0] || e.id(); }   /* an element by its entity id; a question, which names none, by its node id */
  function cut(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function facets() { return [].map.call(facetSel.options, function (o) { return o.value; }).filter(Boolean); }   /* the page's facet filter values */
  /* a box's label as the tools give it: a statement's without the glyph, grade and verb before it (dir and grade say
     them), a group's by the answer that leads to it */
  function labelOf(n) {
    var t = n.data("type"), l = n.data("label");
    if (t === "statement") return l.indexOf(" · ") >= 0 ? l.slice(l.indexOf(" · ") + 3) : l;
    if (t === "junction") { var into = n.incomers("edge[kind = 'answer']").first(); return (into.nonempty() && into.data("label").replace(/\n/g, "; ")) || n.data("group"); }
    return l;
  }
  /* a refusal: what was refused, what is accepted, and for an id that names nothing here the nearest ids that do: one
     that begins with it first, then those holding most of its words, a word in the id counting twice one in the text */
  var FINDS = "find(text) lists the boxes of this grouping whose words match, folded ones too";
  function refused(error, unknown) {
    var r = { error: error, hint: FINDS }, near = [], seen = {};
    unknown.forEach(function (id) { nearby(id).forEach(function (h) { if (!seen[h.id]) { seen[h.id] = true; near.push(h); } }); });
    if (near.length) r.near = near.slice(0, 5);
    return r;
  }
  function nearby(id) {
    var ws = fold(String(id).split("/").pop().replace(/[-_.:]+/g, " ")).split(" ").filter(function (w) { return w.length > 2; });
    var score = {}, label = {};
    if (!ws.length) return [];
    cy.elements().forEach(function (e) {
      e.data("refs").forEach(function (r) {
        if (score[r]) return;
        var own = fold(r.replace(/[-_\/]+/g, " ")), s = r.indexOf(id) === 0 ? 100 : 0;
        ws.forEach(function (w) { s += own.indexOf(w) >= 0 ? 2 : e.data("text").indexOf(w) >= 0 ? 1 : 0; });
        if (s) { score[r] = s; label[r] = e.isNode() ? labelOf(e) : e.data("label").replace(/\n/g, "; "); }
      });
    });
    return Object.keys(score).sort(function (a, b) { return score[b] - score[a] || a.length - b.length; }).slice(0, 5)
      .map(function (r) { return { id: r, label: cut(label[r], 80) }; });
  }
  function known(ids, entities) {   /* the elements the ids name — entities, and with `entities` false node ids too — or what names nothing */
    if (!Array.isArray(ids) || !ids.length || ids.some(function (i) { return typeof i !== "string"; }))
      return { error: "ids: a list of " + (entities ? "entity ids" : "entity ids or question node ids"), hint: "statements/…, concepts/…, sources/…" + (entities ? "" : ", q:…") };
    var eles = cy.collection(), unknown = [];
    ids.forEach(function (id) {
      var found = naming([id]).union(entities ? cy.collection() : cy.getElementById(id));
      if (found.empty()) unknown.push(id); else eles = eles.union(found);
    });
    return unknown.length ? refused("nothing in this grouping is named " + unknown.join(", "), unknown) : { eles: eles };
  }
  /* the tree as drawn: the box a node hangs from is the source of its first shown answer or flow (a group reached from
     two open parents hangs from the first, an aim from its first box); what hangs from a node, top to bottom, then left
     to right — the order the reader sees, and the one a place among siblings ("3/32") counts in */
  function up(n) { var e = n.incomers("edge").not(".folded").not(".dup").first(); return e.nonempty() ? e.source() : null; }
  function below(n) {
    return n.outgoers("edge").not(".folded").targets().not(".folded").filter(function (t) { var p = up(t); return p && p.same(n); })
      .sort(function (a, b) { return a.position("y") - b.position("y") || a.position("x") - b.position("x"); });
  }
  function reading() {   /* every box the folding shows: from the root, a box before what hangs from it */
    var out = [], seen = {};
    (function visit(n) { if (seen[n.id()]) return; seen[n.id()] = true; out.push(n); below(n).forEach(visit); })(root);
    cy.nodes().not(".folded").forEach(function (n) { if (!seen[n.id()]) { seen[n.id()] = true; out.push(n); } });   /* none, in a tree */
    return out;
  }
  function sight() {   /* the part of the canvas the reader sees, in its own pixels: inside it and the window, in the free row, above a phone's strip */
    var c = canvas.getBoundingClientRect(), f = free.getBoundingClientRect();
    var strip = sheet.classList.contains("peeking") && getComputedStyle(sheet).position === "fixed" ? sheet.getBoundingClientRect().top : Infinity;
    return { x1: Math.max(c.left, 0) - c.left, x2: Math.min(c.right, innerWidth) - c.left, y1: Math.max(c.top, f.top, 0) - c.top, y2: Math.min(c.bottom, f.bottom, innerHeight, strip) - c.top };
  }
  function inSight(n, V) {
    var b = n.renderedBoundingBox({ includeLabels: true, includeOverlays: false, includeUnderlays: false });
    return b.x1 >= V.x1 - 1 && b.x2 <= V.x2 + 1 && b.y1 >= V.y1 - 1 && b.y2 <= V.y2 + 1;
  }
  /* one box as view gives it, only what it has; `at`: each shown box's place in reading order; `hit`: the shown matches */
  function entry(n, V, twice, at, hit) {
    var t = n.data("type"), e = { i: at[n.id()], id: ident(n), kind: KIND[t] || t, label: n.data("label") };
    var into = n.incomers("edge[kind = 'answer']").not(".folded").not(".dup").first(), answer = into.nonempty() ? into.data("label").replace(/\n/g, "; ") : "";
    if (t === "statement") {
      e.label = labelOf(n);   /* the glyph, grade and verb before it are dir and grade */
      if (n.data("direction")) e.dir = n.data("direction");
      if (n.data("grade")) e.grade = n.data("grade");
      if (n.data("no")) e.no = n.data("no");
      if (answer) e.answer = answer;
    } else if (t === "junction") {
      e.label = answer || n.data("group"); e.n = Number(n.data("label")); e.open = !!open[n.id()];
      if (twice[e.id]) e.node = n.id();   /* the concept stands at more than one group here: toggle names the node */
    } else if (t === "question" && closed[n.id()]) e.closed = true;
    var p = up(n);   /* the box it hangs from by its i, which a parent's long id would repeat at every child */
    if (p) { var sib = below(p).map(function (x) { return x.id(); }); e.up = at[p.id()]; e.place = (sib.indexOf(n.id()) + 1) + "/" + sib.length; }
    e.in_view = inSight(n, V);
    if (n.hasClass("picked")) e.selected = true;
    if (n.hasClass("assisted")) e.highlighted = true;
    if (hit[n.id()]) e.match = true;
    return e;
  }
  function shownNamed(id) { return naming([id]).nodes().not(".folded").union(cy.getElementById(id).not(".folded")).first(); }   /* the first shown box an id names */
  function unseen(id) {   /* view's `under` names no shown box: folded away, or nothing at all */
    if (typeof id !== "string") return { error: "under: an entity id or a question node id" };
    if (naming([id]).nonempty() || cy.getElementById(id).nonempty()) return { error: "under: " + id + " is folded away", hint: "focus shows a box, toggle unfolds a group" };
    return refused("under: nothing in this grouping is named " + id, [id]);
  }
  /* the search as the answers give it: its text and facet, the shown matches by count, the reader's place among them
     once stepped, and the first ids in step order */
  function sought() {
    if (!query && !facet) return null;
    var list = ordered(), i = cursor ? position(list) : -1;
    var s = { text: typed, facet: facet || null, matches: list.length, at: i >= 0 ? i + 1 : null, ids: list.slice(0, 10).map(ident) };
    if (list.length > 10) s.more = list.length - 10;
    return s;
  }
  function state() {   /* what view and every act's answer begin with */
    var refs = decodeURIComponent(location.hash.slice(1)).split(",").filter(Boolean);
    return { v: tools.version, graph: data.id, grouping: by, chapter: section || null, search: sought(),
      selected: refs.map(function (r) {   /* each selected entity with the boxes it hangs from, root first */
        var n = naming([r]).nodes().not(".folded").first(), path = [];
        for (var p = n.nonempty() ? up(n) : null; p; p = up(p)) path.unshift(ident(p));
        return { id: r, path: n.nonempty() ? path : null };
      }),
      highlighted: assist && { ids: assist.ids, note: assist.note || null },
      shown: cy.nodes().not(".folded").length };
  }
  function look(a) {   /* the view tool: the state, and the boxes in reading order, a page of them */
    if (a.under !== undefined && shownNamed(a.under).empty()) return unseen(a.under);
    var V = sight(), all = reading(), twice = {}, count = {}, at = {}, hit = {};
    all.forEach(function (n, k) { at[n.id()] = k; });
    junctions.not(".folded").forEach(function (j) { var c = ident(j); count[c] = (count[c] || 0) + 1; if (count[c] > 1) twice[c] = true; });
    matches().not(".folded").forEach(function (n) { hit[n.id()] = true; });
    if (a.under) {   /* a box and what hangs below it: the read a question about one node needs */
      var keep = {}, top = shownNamed(a.under);
      (function down(n) { keep[n.id()] = true; below(n).forEach(down); })(top);
      all = all.filter(function (n) { return keep[n.id()]; });
    }
    if (a.in_view) all = all.filter(function (n) { return inSight(n, V); });
    var from = Math.max(0, Math.floor(a.from) || 0), limit = a.limit === 0 ? 0 : Math.min(200, Math.max(1, Math.floor(a.limit) || 20));
    var out = state();
    out.total = all.length;
    if (!limit) return out;   /* the state alone */
    out.from = from;
    out.boxes = all.slice(from, from + limit).map(function (n) { return entry(n, V, twice, at, hit); });
    if (from + limit < all.length) out.more = all.length - from - limit;
    return out;
  }
  /* an act's answer: the state after it, and what became of the boxes it acted on — how many are shown and how many of
     those lie wholly in view, the first few that do not, and how many are folded away; the boxes too when `v` asks */
  function brief(name, targets, v) {
    var out = { act: name }, st = state();
    Object.keys(st).forEach(function (k) { out[k] = st[k]; });
    if (targets) {
      var all = targets(), shown = all.not(".folded"), V = sight(), away = shown.filter(function (e) { return !inSight(e, V); });
      var on = out.acted_on = { shown: shown.length, in_view: shown.length - away.length };
      if (away.length) on.not_in_view = away.slice(0, 5).map(ident);
      if (all.length > shown.length) on.folded = all.length - shown.length;
    }
    if (v) {
      var l = look(v);
      if (l.error) out.view = l;
      else ["total", "from", "boxes", "more"].forEach(function (k) { if (k in l) out[k] = l[k]; });
    }
    return out;
  }
  /* find: every node of the grouping that a text or a facet matches as the page's search matches it, folded ones too,
     in the tree's own order (from the root, a node before what hangs from it, in the order the grouping's tree gives —
     the one the MCP server's places count in) */
  function treeOrder() {
    var out = [], seen = {};
    (function visit(n) { if (seen[n.id()]) return; seen[n.id()] = true; out.push(n); n.outgoers("node").forEach(visit); })(root);
    return out;
  }
  function parentOf(n) { var e = n.incomers("edge").first(); return e.nonempty() ? e.source() : null; }   /* in the whole tree: its first answer or flow */
  function find(a) {
    if ((a.text !== undefined && typeof a.text !== "string") || (a.facet !== undefined && typeof a.facet !== "string")) return { error: "text and facet: strings" };
    var q = fold((a.text || "").trim()), f = a.facet || "", kinds = facets();
    if (f && kinds.indexOf(f) < 0) return { error: "no facet " + f + " here", hint: "the page's facets: " + kinds.join(", ") };
    if (!q && !f) return { error: "nothing to find", hint: "a text, a facet, or both" };
    var m = {}, within = scope(), twice = {}, count = {};
    matching(q, f, cy.nodes()).forEach(function (n) { m[n.id()] = true; });
    junctions.forEach(function (j) { var c = ident(j); count[c] = (count[c] || 0) + 1; if (count[c] > 1) twice[c] = true; });
    var list = treeOrder().filter(function (n) { return m[n.id()]; });
    var from = Math.max(0, Math.floor(a.from) || 0), limit = Math.min(200, Math.max(1, Math.floor(a.limit) || 10));
    var out = { text: a.text || "", facet: f || null, total: list.length, from: from, hits: list.slice(from, from + limit).map(function (n) {
      var t = n.data("type"), h = { id: ident(n), kind: KIND[t] || t, label: labelOf(n) }, groups = [];
      for (var p = parentOf(n); p; p = parentOf(p)) if (p.data("type") === "junction") groups.unshift(ident(p));
      if (t === "statement") {
        var into = n.incomers("edge[kind = 'answer']").first();
        if (n.data("direction")) h.dir = n.data("direction");
        if (n.data("grade")) h.grade = n.data("grade");
        if (n.data("no")) h.no = n.data("no");
        if (into.nonempty() && into.data("label")) h.answer = into.data("label").replace(/\n/g, "; ");
      } else if (t === "junction") {
        h.n = Number(n.data("label"));
        if (twice[h.id]) h.node = n.id();
      }
      h.groups = groups; h.shown = !n.hasClass("folded");
      if (section && !within.contains(n)) h.in_chapter = false;
      return h;
    }) };
    if (from + limit < list.length) out.more = list.length - from - limit;
    return out;
  }
  /* details: what the details panel shows for an entity of this graph (the card the build wrote for it), as text, part by
     part — a part per zone of the card, named by the zone and headed as the panel heads it, with the origin its heading
     carries. A line per block, a table row's cells joined by " | ", a term and its value by ": ", a link as [words](target),
     its target an entity id where it leads to a page of this site; what a reader is not shown (aria-hidden) and the card's
     buttons are left out. A part over PART characters is cut at a line; one asked for by name comes WHOLE characters at a
     time, from `from` */
  var PART = 800, WHOLE = 5000, BLOCK = /^(P|LI|DT|H[1-6]|BLOCKQUOTE|TR|DIV|SECTION|UL|OL|DL|TABLE|THEAD|TBODY|DETAILS|SUMMARY|FIGURE|FIGCAPTION)$/;
  var site = location.pathname.replace(/[^\/]*$/, "").replace(/[^\/]+\/$/, "");   /* the site's root: a view page lives in a folder of its own under it */
  function target(href) {
    var u; try { u = new URL(href, location.href); } catch (e) { return href; }
    if (u.protocol === location.protocol && u.host === location.host && u.pathname.indexOf(site) === 0 && !u.search && !u.hash) return u.pathname.slice(site.length).replace(/\/$/, "") || u.href;
    return u.href;
  }
  function said(n) {   /* an element's words as a reader is shown them, without its origin tag */
    var c = n.cloneNode(true);
    c.querySelectorAll("button, .origin").forEach(function (x) { x.remove(); });
    c.querySelectorAll("[aria-hidden='true']").forEach(function (x) { x.replaceWith(" "); });
    return c.textContent.replace(/\s+/g, " ").trim();
  }
  function prose(el, skip) {
    var lines = [], line = "";
    function flush() { var s = line.replace(/\s+/g, " ").trim(); if (s) lines.push(s); line = ""; }
    (function walk(n) {
      if (n.nodeType === 3) { line += n.nodeValue; return; }
      if (n.nodeType !== 1 || n === skip || /^(BUTTON|SCRIPT|STYLE|TEMPLATE)$/.test(n.tagName)) return;
      if (n.getAttribute("aria-hidden") === "true") { line += " "; return; }   /* a glyph or a separator: the words beside it stay apart */
      if (n.tagName === "A") { var w = said(n), to = n.getAttribute("data-node") || target(n.getAttribute("href") || ""); line += w === to ? to : "[" + w + "](" + to + ")"; return; }
      if ((n.tagName === "TD" || n.tagName === "TH") && n.previousElementSibling) line += " | ";
      var block = BLOCK.test(n.tagName);
      if (block) flush();
      [].forEach.call(n.childNodes, walk);
      if (n.tagName === "DT") line += ": "; else if (block || n.tagName === "DD") flush();
    })(el);
    flush();
    return lines.join("\n");
  }
  function shorten(p, n) {   /* a part's text cut at its last line within n characters (at n where the line ends early), what is left counted */
    if (p.text.length <= n) return;
    var at = p.text.lastIndexOf("\n", n); if (at < n / 2) at = n;
    p.cut = p.text.length - at; p.text = p.text.slice(0, at);
    return at;
  }
  function details(a) {
    if (typeof a.id !== "string" || !a.id) return { error: "id: an entity id", hint: "statements/…, concepts/…, sources/…" };
    if (a.part !== undefined && typeof a.part !== "string") return { error: "part: a part's name or heading, as details gives it" };
    if (a.from !== undefined && (a.part === undefined || typeof a.from !== "number" || a.from < 0)) return { error: "from: a character of the part named, counted from 0" };
    var html = data.html[a.id];
    if (!html) return refused("no details of " + a.id + " on this page", [a.id]);
    var t = document.createElement("template"); t.innerHTML = html;
    var card = t.content.querySelector(".card") || t.content, title = card.querySelector("h2.title, .label"), parts = [], loose = document.createElement("div");
    [].slice.call(card.children).forEach(function (c) {
      if (c.tagName !== "SECTION") { if (c !== title) loose.appendChild(c.cloneNode(true)); return; }
      var h = c.querySelector("h2, h3, h4"), o = h && h.querySelector(".origin"), name = c.classList[1] || (c.getAttribute("aria-labelledby") || "").replace(/^zone-|-h\d*$/g, "") || "part";
      var p = { part: name };
      if (h && h !== title) p.head = said(h);
      if (o) p.origin = o.textContent.trim();
      p.text = prose(c, h);
      parts.push(p);
    });
    if (loose.childNodes.length) parts.unshift({ part: "card", text: prose(loose) });
    parts = parts.filter(function (p) { return p.text; });
    if (a.part !== undefined) {
      parts = parts.filter(function (p) { return p.part === a.part || p.head === a.part; });
      if (!parts.length) return { error: "no part " + a.part + " in the details of " + a.id, hint: "its parts: " + details({ id: a.id }).parts.map(function (p) { return p.part; }).join(", ") };
      var from = Math.floor(a.from) || 0;
      parts.forEach(function (p) {
        if (from) { p.from = from; p.text = p.text.slice(from); }
        var at = shorten(p, WHOLE); if (at) p.next = from + at;   /* the `from` of the rest */
      });
    } else parts.forEach(function (p) { shorten(p, PART); });
    return { id: a.id, title: title ? said(title) : null, parts: parts };
  }
  /* the highlight on what it names, and its line. The line makes the controls' row taller or shorter, and the free row
     with it: a graph still where the last fit put it is fitted again into the new free row, so what it framed stays whole
     in view; one the reader has moved since moves with the line, so nothing slides under the controls */
  function mark() {
    var top = free.getBoundingClientRect().top, eles = assist ? known(assist.ids).eles || cy.collection() : cy.collection();
    cy.elements(".assisted").removeClass("assisted");
    eles.addClass("assisted");
    assistLine.hidden = !assist;
    if (assist) assistLine.querySelector(".text").textContent = assist.note || say(pair(words.agent.marked, eles.length), { n: eles.length });
    var d = free.getBoundingClientRect().top - top, z = cy.zoom(), at = cy.pan();
    if (!d) return;
    if (framed.nonempty() && fitted && Math.abs(z - fitted.zoom) < 1e-3 && Math.abs(at.x - fitted.pan.x) < 1 && Math.abs(at.y - fitted.pan.y) < 1) fit(framed, fitted.padding);
    else cy.panBy({ x: 0, y: d });
  }
  document.getElementById("assist-clear").onclick = function () { remember(); assist = null; mark(); };
  function group(id) {   /* a group by its node id, or by the concept it stands for where one group of this grouping does */
    var n = cy.getElementById(id || "");
    if (n.nonempty() && n.data("type") === "junction") return n;
    var js = naming([id]).nodes("[type = 'junction']");
    if (js.length === 1) return js;
    if (js.length) return { error: id + " stands at " + js.length + " groups here", hint: "name one by its node id (view's and find's node): " + js.map(function (j) { return j.id(); }).join(", ") };
    return refused("no group " + id, [String(id)]);
  }
  function rest() {   /* a promise of the graph at rest: no layout in flight, no fit and no box moving, twice in a row */
    return new Promise(function (done) {
      var quiet = 0, start = Date.now();
      (function poll() {
        quiet = !laying && !cy.animated() && !cy.nodes().some(function (n) { return n.animated(); }) ? quiet + 1 : 0;
        if (quiet >= 2 || Date.now() - start > 4000) done(); else setTimeout(poll, 60);
      })();
    });
  }
  /* each act checks its arguments before it changes anything, and answers what it refused; what it changes it keeps
     for back first (remember: one change, however many steps it takes). It names the boxes it acts on (targets), read
     once the graph is at rest, for its answer (brief) */
  var acts = {
    view: function (a) { if (a.under !== undefined && shownNamed(a.under).empty()) return unseen(a.under); },   /* read at rest, by call() */
    find: function (a) { var r = find(a); return r.error ? r : { answer: r }; },
    details: function (a) { var r = details(a); return r.error ? r : { answer: r }; },
    open: function (a) {
      var r = known(a.ids, true); if (r.error) return r;
      remember(); open_(a.ids.join(","), true);
      return { targets: function () { var e = naming(a.ids).nodes(); return e.union(e.filter("[type = 'junction']").successors().nodes().not(".folded")); } };
    },
    focus: function (a) {
      var r = known(a.ids); if (r.error) return r;
      remember();
      before(r.eles).not(r.eles.nodes()).filter("[type = 'junction']").forEach(function (j) { open[j.id()] = true; });   /* the way there, not the group itself */
      unfoldTo(r.eles);
      relayout(near(r.eles));
      return { targets: function () { return r.eles; } };
    },
    highlight: function (a) {
      var r = known(a.ids); if (r.error) return r;
      if (a.note !== undefined && (typeof a.note !== "string" || a.note.length > 140)) return { error: "note: a text of at most 140 characters" };
      remember(); assist = { ids: a.ids.slice(), note: a.note || "" }; mark();
      return { targets: function () { return r.eles; } };
    },
    clear: function () { if (!assist) return { error: "nothing is highlighted" }; remember(); assist = null; mark(); },
    toggle: function (a) {
      var j = group(a.id); if (j.error) return j;
      if (a.open === undefined || !!open[j.id()] !== !!a.open) toggle(j, a.open);
      return { targets: function () { return open[j.id()] ? j.union(j.successors().nodes().not(".folded")) : j; } };
    },
    fold: function (a) {
      var q = cy.getElementById(typeof a.id === "string" ? a.id : "");
      if (q.empty() || q.data("type") !== "question") return { error: "no question " + a.id, hint: "a question is named by its node id (q:…), as view gives it" };
      if (a.closed === undefined || !!closed[q.id()] !== !!a.closed) foldQuestion(q, a.closed);
      return { targets: function () { return closed[q.id()] ? q : q.union(q.successors().nodes().not(".folded")); } };
    },
    search: function (a) {
      if ((a.text !== undefined && typeof a.text !== "string") || (a.facet !== undefined && typeof a.facet !== "string")) return { error: "text and facet: strings" };
      var kinds = facets();
      if (a.facet && kinds.indexOf(a.facet) < 0) return { error: "no facet " + a.facet + " here", hint: "the page's facets: " + kinds.join(", ") };
      search.value = a.text || ""; facetSel.value = a.facet || ""; research();
      return { targets: function () { return matches(); } };
    },
    step: function (a) {
      if (!ordered().length) return { error: "no match to step to", hint: "step walks the shown matches of a running search" };
      step(a.by < 0 ? -1 : 1);
      return { targets: function () { return cursor ? cy.getElementById(cursor) : cy.collection(); } };
    },
    back: function () { if (!trail.length) return { error: "nothing to go back to", hint: "the view is the one the page opened with" }; back(); }
  };

  window.onhashchange = function () { remember(); open_(decodeURIComponent(location.hash.slice(1)), false); };
  cy.ready(function () { if (then) restore(then); else open_(decodeURIComponent(location.hash.slice(1)), false); });
  window.graphmed = { cy: cy, open: open_, toggle: toggle, fold: foldQuestion, back: back, view: view, restore: restore, isOpen: function (id) { return !!open[id]; }, isClosed: function (id) { return !!closed[id]; },
    section: setSection, search: function (q, f) { search.value = q; if (f !== undefined) facetSel.value = f; research(); }, step: step,
    frame: function () { return framed.map(function (e) { return e.id(); }); },
    agent: agent, session: { acts: acts, rest: rest, look: look, brief: brief },   /* the session tools: the page function, and what it calls in the graph drawn now */
    by: switchTo, state: function () { return { by: by, section: section, query: search.value, facet: facetSel.value, ref: decodeURIComponent(location.hash.slice(1)) }; } };   /* for the console and tests */
  }
})();
