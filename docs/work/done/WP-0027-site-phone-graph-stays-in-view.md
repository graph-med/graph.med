---
id: WP-0027
title: The graph stays in view when a node is tapped on a phone
status: done
created: 2026-09-18
updated: 2026-09-18
depends_on: []
blocks: []
owner: agent
initiative: ui
kind: build
slug: site-phone-graph-stays-in-view
---

## Outcome
On a phone — any viewport narrower than 900 px, where the sheet sits below the
graph rather than beside it — interacting with the graph leaves the page where
it is. Tapping a box, an answer, a patient group or a question, and opening a
deep link, all show their effect in the graph at the top of the screen: the
selection, the fit, the unfolding. The sheet below fills with the details as it
does today, but the page does not scroll to it. The reader scrolls down to the
details by hand when they want them, and finds the graph where they left it
when they scroll back. On a desktop nothing changes: the sheet is a column
beside the graph and nothing scrolls there today.

## Scope
In:
- `tools/site/static/graph.js`, `select()`: the one line that, below 900 px,
  calls `scrollIntoView` on the sheet after a selection. It goes. Nothing
  replaces it — no shorter scroll, no scroll to the graph either.

Out:
- A different phone layout for the details: a bottom drawer, an overlay, a
  sheet that peeks over the graph, a sticky graph. The page keeps its shape
  (`docs/publication.md` §3: one graph, one detail section below it).
- The graph's height on a phone (`#graph`, 62vh) and the sheet's styling.
- The sheet's content (WP-0019, done; WP-0024 and WP-0025, open).
- The reverse movement: a link inside the sheet (`a.node-link`) re-targets the
  graph and scrolls the page to the top. It stays as it is; see Notes.
- Any change to `tools/screenshot.js`: the driver already captures the phone
  viewport after `open=`, which is enough to see whether the page moved.

## Constraints
- `ui` initiative scope: `tools/build.py` and `tools/site/` only, no data or
  schema change (`docs/work/initiatives/ui.md`).
- `docs/publication.md` §1 and §3: the page is read on a phone first, and
  tapping a node opens its details in the section below the graph. The section
  still opens and still fills; only the page's scroll position stops changing.
  The sheet keeps `aria-live="polite"`, so a screen reader is still told that
  the details changed.
- The desktop layout (`site.css`, `@media (min-width: 900px)`) is not touched.
- Checked on desktop and phone width, light and dark, with the `screenshot`
  skill. The pull request links the preview (`docs/work/README.md`, `AGENTS.md`).
- No personal names (`.claude/rules/conventions/no-personal-information.md`).

## Decisions
- **The cause (2026-09-18).** `select()` in `tools/site/static/graph.js` ends
  with `if (window.innerWidth < 900) sheet.scrollIntoView({ behavior: "smooth",
  block: "start" })`. Every tap on a box or an edge, every deep link and every
  step through search matches reaches `select()`. With the graph at 62vh,
  `block: "start"` puts the sheet's top edge at the top of the viewport, so the
  whole graph, the controls and the legend leave the screen, and every further
  interaction costs a scroll back up. The line dates from the first site build
  (`68c886c`), which inferred it from "opens its details in a section below the
  graph"; `docs/publication.md` says nothing about scrolling to the section,
  and the maintainer, reading the live site on a phone, asked for the opposite.
  Reproduced in the sandbox: `uv run tools/screenshot.py pomgat-lv-1.0 --phone
  --do open=statements/keine-drainage-kolorektale-resektion --do wait=1500`
  captures the sheet alone, no graph in the frame.
- **Remove, do not shorten.** A scroll of any distance moves the graph the
  reader is working in. The visible response to a tap is in the graph itself —
  the box is picked, the rest fades, the neighbourhood is fitted — and that
  response is at the top of the screen only if the page stays put.
- **One rule for every path into `select()`.** A deep link on page load and a
  step through the search matches go through the same function, and the page
  stays at the top for them too: a reader arriving by link sees the graph
  unfolded to the target with the box selected, the details one scroll below.
  The entity page (`statements/<id>/`) is the address for the details alone.
- **The reverse scroll stays.** `sheet.onclick` on a `.node-link` scrolls the
  page to the top on a phone. That moves the reader towards the graph, which is
  the direction this package asks for, and it is an interaction with the sheet,
  not with the graph. It is left unchanged and noted below.
- **Implemented 2026-09-18 as one deletion.** The `scrollIntoView` line in
  `select()` is removed; no other line changes. The reverse scroll in
  `sheet.onclick` and the comment in the file's header ("in the section beside
  or below the graph") stay true and untouched. Verified with the `screenshot`
  skill: phone `open=` light and dark, phone `search=Drainage step=1`, desktop
  `open=`, and `all fit` (0 overlapping pairs); every phone capture shows the
  header, the controls and the graph with the selected box, the sheet
  beginning below the graph.

## Open questions
None.

## Verification
1. `uv run tools/validate.py` passes (no data change); `uv run tools/build.py`
   succeeds.
2. `screenshot` skill, phone, `--do open=statements/keine-drainage-kolorektale-resektion
   --do wait=1500`: the capture shows the header, the controls and the graph
   with the box selected and its neighbourhood fitted; the sheet begins below
   the graph, not at the top of the frame. The same command on `main` today
   shows the sheet alone. Repeat with `--dark`.
3. `screenshot` skill, phone, `--do search=Drainage --do step=1 --do wait=1500`:
   stepping to a match leaves the graph in the frame as well.
4. `screenshot` skill, desktop, the same `open=`: unchanged, the details in the
   column beside the graph.
5. `--do all --do fit`: 0 overlapping pairs, as before; this package changes
   no layout.
6. **Needs a person on a real phone:** tap a box, then an answer, then a
   question; the page does not move at any tap. Scroll down: the details of the
   last tap are there. Scroll up: the graph is as it was left.

## Notes
- With the scroll gone, the only cue on a phone that the details changed is
  the graph's own response (the picked box, the fit). If that turns out to be
  too little, the answer is a cue that does not move the page — not the scroll
  back. That would be a new package, not a widening of this one.
- The reverse scroll (a link in the sheet scrolls to the top) is the mirror of
  the reported problem for a reader who is reading the sheet and follows a
  link in it. It is out of scope here; if it is reported, it is its own package.
