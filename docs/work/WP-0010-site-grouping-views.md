---
id: WP-0010
title: The axis switch and the first specialised views on the site
status: review
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
- 2026-09-13, WP-0010: the switch is a select in the left row of controls after the search, hidden when the view offers only the plain hierarchy; its entries read "Population" (the plain hierarchy, from the per-language table) and each axis's `label`; on a phone it wraps to the second line beside the facet filter (`docs/publication.md` §3, "How it looks").
- 2026-09-13, WP-0010: the choice is a URL query parameter, `?by=<axis id>`, beside the `#<entity id>` hash — absent for the plain hierarchy, an unknown axis falls back to it — so the link is shareable and a deep link unfolds under the chosen axis. Switching keeps the chapter, the search, the facet and the selection; reset keeps the axis, because reset undoes narrowing and the axis narrows nothing.
- 2026-09-13, WP-0010: the per-language table (`WORDS` in `tools/build.py`, formerly `QUESTIONS`) is keyed by structural key only: `axis` is the question form of a dimension axis, "Welche {label}?", filled with the axis's short label (its label when it has none); `plain` the switch's first entry; `unplaced` the not-placed answer. The build emits one tree per grouping into the view's JSON; the page redraws on switch.
- 2026-09-13, WP-0010: a declared value no statement of the view holds is offered as no answer (a junction with nothing behind it would be noise), and the not-placed answer appears only where something is not placed — an empty "not placed" would say nothing; what the axis cannot place is never dropped.
- 2026-09-13, WP-0010: a hierarchy axis is built over the slot the tree groups by, `population`, by the same `hierarchy()` code path as the plain hierarchy — the `broader` edges that name the axis instead of those that name none; the families are the axis's roots, a concept with no place goes behind the not-placed answer, and everything below it is built by the same rules. Proved on a throwaway assertion of `axes/region` in a scratch copy (19 of 36 concepts placed, 41 statements, five families, 49 statements behind "nicht zugeordnet", 0 overlapping pairs with everything open); nothing of it committed. A hierarchy over `condition` is not built — the tree has no condition junctions to fold — and the build says so (`docs/work/LATER.md`).
- 2026-09-13, WP-0010: the specialised views are `views/pomgat-lv-1.0-6` (chapter 6, intraoperative management, 15 recommendations) and `views/pomgat-lv-1.0-7.4` (section 7.4, postoperative gastrointestinal motility, 17), both the existing `section` filter form; the id is the source view's id and the section number. The build implements the form in `members_of` (a claim of that source is a member when its section is the one named or beneath it; a section not in the outline fails the build), the chapter tree shows only that section's subtree, the root box carries the section's number and title and the page the source's title with it. They declare no `group_by`: the phase is asserted for `views/pomgat-lv-1.0` only and a status is per view (spec §4.1); proposing it for them is a person's entry under the axis's `views`.
- 2026-09-13, WP-0010: `members_of` and `uses_of` follow every slot of a statement, not the four fixed ones, so the concepts a dimension axis's slot holds are members and a qualifier concept's page lists the statements holding it. The sheet's "within" line still lists the plain `broader` families whatever the axis; the tree, not the sheet, is what the axis changes.

## Open questions

None.

## Verification

Browser captures on desktop and phone of the tree under each axis and of one
specialised view, 0 overlapping pairs in every state; the PR links the
previews. Build and validator pass.
