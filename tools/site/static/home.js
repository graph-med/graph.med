/* graph.med index: where the graphs meet, drawn as they are (docs/publication.md §2) — one question,
   "Welche Leitlinie?", with one answer per view, each leading to a box that names its guideline, laid out left
   to right by the view page's renderer (Cytoscape.js with the dagre layout, self-hosted, see
   assets/vendor/LICENSES.md). Nothing is written here: the graph is read from the page, where the build rendered
   one entry per view in the sheet's home — the question from the canvas's data-question, each box from an entry
   (its data-ref), its lines the entry's [data-box] parts in their order, the first set apart — so that the page
   reads the same without this script and with a screen reader. Tapping a box selects it as on a view page: the
   rest fades, and its entry opens alone in the sheet beside or below the graph (on a phone, a peek strip at the
   bottom edge that raises it); tapping the canvas or the question returns the sheet to its home. The tree is
   small and always whole, so it is drawn at a size a phone reads: a box takes the width the canvas leaves beside
   the question, within bounds, and the fit never zooms far past that size. */
(function () {
  "use strict";
  var canvas = document.getElementById("graph"), sheet = document.getElementById("sheet"), main = canvas.closest("main");
  var home = sheet.innerHTML, entries = {}, cy = null;
  var PAD = 16, QUESTION = { w: 136, h: 96 }, RANK = 40, BOX = { min: 184, max: 300 }, ZOOM = { min: 0.75, max: 1.4 };

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  /* the box's width: what the canvas leaves beside the question and the gap after it, within bounds */
  function boxWidth() { return Math.max(BOX.min, Math.min(BOX.max, canvas.clientWidth - 2 * PAD - QUESTION.w - RANK)); }
  /* the view page's forms and colours (graph.js): a question is a diamond, an answer a solid line in the page's
     foreground that turns just after the question and runs into its box, a box the page's colours with a border;
     the selection is the border, what is not selected fades */
  function stylesheet() {
    var w = boxWidth();
    return [
      { selector: "node", style: {
          "shape": "round-rectangle", "background-color": css("--bg"), "border-width": 1.5, "border-color": css("--fg"),
          "label": "data(label)", "color": css("--fg"), "font-family": css("--font"), "font-size": 13, "line-height": 1.3,
          "text-wrap": "wrap", "text-max-width": w - 24, "text-valign": "center", "text-halign": "center", "text-justification": "left",
          "width": w, "height": "label", "padding": 12 } },
      { selector: "node[type = 'question']", style: { "shape": "diamond", "width": QUESTION.w, "height": QUESTION.h, "padding": 0,
          "text-max-width": QUESTION.w - 56, "text-justification": "center", "font-weight": 600 } },
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
  function layout() {
    var lay = cy.layout({ name: "dagre", rankDir: "LR", nodeSep: 20, rankSep: RANK, nodeDimensionsIncludeLabels: true, fit: false, animate: false });
    lay.one("layoutstop", fit);
    lay.run();
  }

  /* the sheet (graph.js): every fill starts at the top. Below 900 px an entry waits in a peek strip at the bottom
     edge — its title and what the graph holds, taken from the entry itself — which raises the sheet over the graph;
     the strip again, ✕ or Escape lowers it. A wide screen never shows it */
  function fill(html, entry) {
    sheet.innerHTML = html;
    sheet.classList.remove("peeking", "raised");
    var title = entry && sheet.querySelector(".entry-title a");
    if (title) {
      var bar = document.createElement("div"), peek = document.createElement("button"), close = document.createElement("button");
      var text = document.createElement("span"), t = document.createElement("span"), holds = sheet.querySelector(".entry-holds");
      bar.className = "peek-bar";
      peek.type = "button"; peek.className = "peek"; peek.setAttribute("aria-expanded", "false"); peek.setAttribute("aria-controls", "sheet");
      text.className = "peek-text"; t.className = "peek-title"; t.textContent = title.textContent.trim(); if (title.lang) t.lang = title.lang;
      text.appendChild(t);
      if (holds) { var v = document.createElement("span"); v.className = "verdict"; v.textContent = holds.textContent.replace(/\s+/g, " ").trim(); text.appendChild(v); }
      peek.appendChild(text);
      close.type = "button"; close.className = "peek-close"; close.setAttribute("aria-label", sheet.dataset.close || ""); close.textContent = "✕";
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
  sheet.onclick = function (e) {
    if (e.target.closest(".peek-close")) raise(false);
    else if (e.target.closest(".peek")) raise(!sheet.classList.contains("raised"));
  };

  /* selection: the box and the answer leading to it stay, the rest fades, and the sheet shows its entry alone;
     nothing, or anything but a box, is the sheet's home. The hash is the deep link, the view's id */
  function select(ref, push) {
    if (!cy) return;
    cy.elements().removeClass("dim picked");
    var box = ref && entries[ref] ? cy.getElementById(ref) : cy.collection();
    if (box.empty()) {
      fill(home);
      if (push) history.replaceState(null, "", location.pathname + location.search);
      return;
    }
    cy.elements().not(box.union(box.predecessors())).addClass("dim");
    box.addClass("picked");
    fill('<ul class="graph-list">' + entries[ref] + "</ul>", true);
    if (push) history.replaceState(null, "", "#" + ref);
  }

  function draw() {
    if (typeof cytoscape !== "function") throw new Error("library missing");
    if (typeof cytoscapeDagre === "function") cytoscape.use(cytoscapeDagre);
    var elements = [{ data: { id: "q", type: "question", label: canvas.dataset.question || "" } }];
    sheet.querySelectorAll("[data-ref]").forEach(function (entry) {
      var ref = entry.dataset.ref, lines = Array.prototype.slice.call(entry.querySelectorAll("[data-box]"))
        .sort(function (a, b) { return Number(a.dataset.box) - Number(b.dataset.box); })
        .map(function (el) { return el.textContent.replace(/\s+/g, " ").trim(); });
      entries[ref] = entry.outerHTML;
      elements.push({ data: { id: ref, type: "box", label: lines[0] + (lines.length > 1 ? "\n\n" + lines.slice(1).join("\n") : "") } });
      elements.push({ data: { id: "a:" + ref, source: "q", target: ref } });
    });
    cy = cytoscape({ container: canvas, elements: elements, minZoom: 0.3, maxZoom: 3, boxSelectionEnabled: false, autounselectify: true,
                     style: stylesheet(), layout: { name: "preset" } });
    layout();
    cy.on("tap", "node[type = 'box']", function (e) { select(e.target.id(), true); });
    cy.on("tap", "edge", function (e) { select(e.target.target().id(), true); });
    cy.on("tap", function (e) { if (e.target === cy || e.target.data("type") === "question") select(null, true); });
    /* a new width (a phone turned) gives the boxes another width: restyle, lay out and fit again */
    var width = canvas.clientWidth, pending = null;
    window.addEventListener("resize", function () {
      clearTimeout(pending);
      pending = setTimeout(function () {
        cy.resize();
        if (canvas.clientWidth !== width) { width = canvas.clientWidth; cy.style().fromJson(stylesheet()).update(); layout(); } else fit();
      }, 150);
    });
    window.addEventListener("hashchange", function () { select(decodeURIComponent(location.hash.slice(1)), false); });
    select(decodeURIComponent(location.hash.slice(1)), false);
  }

  /* a graph that cannot be drawn leaves the page as it reads without the script: the sheet alone */
  try { draw(); } catch (e) { main.classList.add("flat"); throw e; }
  window.graphmed = { cy: cy, open: select };   /* for the console and tests (tools/screenshot.js: open=<view id>) */
})();
