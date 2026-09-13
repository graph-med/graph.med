---
id: WP-0010
title: The axis switch and the first specialised views on the site
status: claimed
created: 2026-09-12
updated: 2026-09-13
depends_on: [WP-0009, WP-0004]
blocks: []
owner: agent
initiative: groupings
kind: build
slug: site-grouping-views
---

## Outcome

The reader can choose, among the axes a view declares in `group_by`, the one
the tree's first question groups by; the questions, the folding and the
"not placed" bucket come from the axis definition and the per-language table,
so the build knows no axis by name and a view of any guideline gets the switch
from its data alone. The site offers the specialised views the initiative
asked for as fixed filter forms (`docs/graph-representation.md` §4, open
question view-filter-language): a view that hides an aspect is a view entity
under `data/views/` with its own page, never a query typed into the page.
`docs/publication.md` §3 says how the axis switch looks and where it sits.

## Scope

In: `tools/build.py` (the tree derivation takes the axis), `tools/site/`,
`docs/publication.md` §3; one or two view entities under `data/views/` as the
first specialised views, agreed in the PR.
Out: a query language; the search and facet filters beyond what they do; any
axis not asserted by `link-grouping-axes`.

## Constraints

Memory `view-page-is-a-decision-tree`: one tree, left to right, folded, a
question at every fork; the axis changes which concepts are families or what
the first question asks, never the shape. Memory `generic-over-guidelines`: one
code path for every axis and every level. Views are data (memory
`pool-and-views`).

## Decisions

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- 2026-09-13, WP-0007: a dimension axis adds its question before "Welche Population?"; a hierarchy axis changes the families of the question it folds; the plain hierarchy is the switch's first entry; "not placed" is one answer, last, from the per-language table (spec §4.1 "4. Shown", `docs/publication.md` §3).

## Open questions

None.

## Verification

Browser captures on desktop and phone of the tree under each axis and of one
specialised view, 0 overlapping pairs in every state; the PR links the
previews. Build and validator pass.
