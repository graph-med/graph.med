---
id: WP-0005
title: The detail section organised by the reader's six questions
status: review
created: 2026-09-12
updated: 2026-09-13
depends_on: []
blocks: [WP-0006, WP-0015]
owner: agent
initiative: ui
kind: build
slug: site-panel-six-questions
---

## Outcome

A statement's detail section is organised by the six questions a reader brings,
each a heading in the chrome language, in this order: what should I do; does this
apply to my patient; how binding and how well supported is it; what could change
the answer; where exactly is it written; would the answer be different in a
neighbouring situation. The same template renders the entity page. Concepts and
claims keep their sections.

## Scope

In: `tools/site/templates/details.html`, the `details()` data in `tools/build.py`
(the sixth question needs the statements under the same group and condition, the
same action in other groups, and the specializes / complements / conflicts edges),
`tools/site/static/site.css`.
Out: an evidence level per claim — the schema has none; it arrives only with
`docs/open-questions.md` → evidence-profiles. The colour of anything.

## Constraints

`docs/publication.md` §3 "What the section shows" is the specification, item by
item; grades are shown per claim, never composed. Chrome is English, content stays
in its source language with `lang` set.

## Decisions

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- 2026-09-13, agent: every one of the six headings is rendered on every statement,
  with one English line under it when the pool has nothing there (no condition, no
  body text, no neighbour), so that "every statement page renders all six headings"
  is checked mechanically and the reader sees an absence rather than a gap.
- 2026-09-13, agent: the action and the aim, which §3 does not name under any
  question, sit under the first — they are what the recommendation does and to
  what end — so that no slot concept becomes unreachable from the section.
- 2026-09-13, agent: "the statements under the same group and condition" is read as
  every other statement of the same patient group, those sharing the condition
  first, each with its condition named as a tag — the neighbouring condition is the
  most useful neighbour, and hiding it would answer the sixth question with less.
  "The same action for other groups" names each neighbour's group (and condition).
  `specializes`/`complements`/`conflicts` are listed in both directions, an
  incoming edge marked with an arrow; no such edge exists in the pool yet, so this
  list is untested against data.
- 2026-09-13, agent: neighbour links show the short label (the box they move the
  graph to) with the full label as the tooltip; the selected statement itself keeps
  its full label under the first question, as §3 says.
- 2026-09-13, agent: an EK claim reads "EK expert consensus" in the grade tag
  (stylesheet text, no data change) and is otherwise a claim like any other; the
  consensus value is shown with its underscore as a space, still in the source
  language. No colour was added or changed: WP-0006 does that.
- 2026-09-13, agent: `tools/site/static/graph.js` is untouched — the sheet is
  filled from the same `html[ref]` and the same `a.node-link` hook moves the
  graph; the concept, claim and source sections are unchanged.

## Open questions

None.

## Verification

Browser captures of one statement's section on desktop and phone, and of its entity
page, in the pull request. Build succeeds; every statement page renders all six
headings.
