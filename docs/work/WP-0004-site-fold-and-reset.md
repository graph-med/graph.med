---
id: WP-0004
title: Fold at every question, a reset button, a fixed "all" row
status: claimed
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

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

## Open questions

None.

## Verification

Browser captures on desktop and phone: a question folded and restored, the page
after reset, the chapter panel scrolled with "all" still visible. Build succeeds.
