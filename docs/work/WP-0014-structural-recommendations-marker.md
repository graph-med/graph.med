---
id: WP-0014
title: A data marker for structural recommendations
status: migrated
created: 2026-09-12
updated: 2026-09-19
card: 94
depends_on: []
blocks: []
owner: unassigned
initiative: extraction-quality
kind: schema
slug: structural-recommendations-marker
---

## Outcome

Recommendations of a structural or organisational kind can be told apart in the
data, in the shape `docs/open-questions.md` → structural-recommendations decides
(the leaning: a facet value on the action concept). The schema and the validator
express it, and every candidate in `pomgat-lv-1.0` is classified — the specialised
nurse in mPOM (box 8.7) is the given example — each classification a `modelling`
change with its rationale. The site is untouched; it reads the marker in a later
package of the `ui` or `groupings` initiative.

## Scope

In: `schema/schema.yaml`, `tools/validate.py`, the concept files (or statement
files, as decided) of the candidates, `docs/graph-representation.md` §3.2.
Out: how the site shows or hides them.

## Constraints

- Do not start until the open question is settled; if it decides against a data
  marker, close this package in the PR with that reason.
- Schema commit first, data commit second (spec §7).

## Open questions

`docs/open-questions.md` → structural-recommendations (gates this package).

## Decisions

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

## Verification

Validator passes; the PR lists every classified statement with its box number
and the sentence that makes it structural.
