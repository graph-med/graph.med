---
id: WP-0004
title: Fold at every question, a reset button, a fixed "all" row
status: done
created: 2026-09-12
updated: 2026-09-13
depends_on: [WP-0003]
blocks: [WP-0010]
owner: agent
initiative: ui
kind: build
slug: site-fold-and-reset
---

## Outcome

Tapping a question folds everything below it and tapping it again restores what
was open there: the first "Welche Population?" folds the whole tree to the root and
itself; a family's "Welche Population?" folds its members; "Welche Bedingung?" folds
its group's conditions and recommendations. A reset button beside the fit button
returns the page to its opening state — folded, no search, no facet, no chapter,
nothing selected. The chapter tree's "all" row stays fixed at the top of the panel
while the list scrolls.

## Scope

In: `tools/site/static/graph.js`, `tools/site/templates/view.html`,
`tools/site/static/site.css`.
Out: the search, the panel content, the colours.

## Constraints

`docs/publication.md` §3 "Folded by default", "The interaction", "Chapters and
search". Touch targets stay at least 44 px on a phone.

## Decisions

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- 2026-09-13, agent: a question folds exactly what hangs below it, by one rule for
  every question — a closed question is shown and nothing below it is, while the
  junctions' open states stay as they were, so a second tap restores them. The
  first "Welche Population?" therefore folds to the root and itself; a family's
  folds its members; "Welche Bedingung?" folds the conditions and the
  recommendations behind them. A group's recommendations *without* a condition
  hang from its junction, not from the question, and stay — folding them is the
  junction's tap, which exists already; reading the question's fold as the whole
  group would have made the two taps the same.
- 2026-09-13, agent: a folded question is drawn filled grey with a dashed border
  (there is more below), the way an open junction is drawn filled; the legend
  says "question (tap to fold)".
- 2026-09-13, agent: a deep link, a search match and a chapter filter reach their
  target through folded questions too (the questions on the path open, as the
  groups on the path do); a chapter filter and the reset clear every fold.
- 2026-09-13, agent: the reset is one function over the existing controls — empty
  search and facet, panel closed, no fold, then the chapter filter set to "all",
  which already clears the selection, the hash and the open groups and fits.
- 2026-09-13, agent: the "all" row is a fixed header of the panel and the sections
  a scrolling list below it, rather than a sticky row inside the list; the row and,
  on a phone, every section row are at least 44 px tall. On a phone the fit and
  reset buttons stack vertically so the search row keeps its width.
- 2026-09-13, agent: the screenshot driver (`tools/screenshot.js`, `.py`) gained
  the actions `fold=<question id>`, `reset` and `chapters-scroll=<px>`, without
  which the package's Verification could not be driven, and reports page errors
  when the graph fails to appear; the `screenshot` skill lists them.

## Open questions

None.

## Verification

Browser captures on desktop and phone: a question folded and restored, the page
after reset, the chapter panel scrolled with "all" still visible. Build succeeds.
