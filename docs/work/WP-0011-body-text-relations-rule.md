---
id: WP-0011
title: A written rule per body-text relation
status: migrated
created: 2026-09-12
updated: 2026-09-19
card: 91
depends_on: []
blocks: [WP-0012, WP-0016]
owner: unassigned
initiative: extraction-quality
kind: docs
slug: body-text-relations-rule
---

## Outcome

`docs/graph-representation.md` §5 states, for each of `refines`, `supplements`
and `limits`, a rule an extraction session can apply without judgment calls:
what kind of passage earns which relation, what its claim's `kind` is, how a
criterion with alternatives is captured (one claim per alternative, or one claim
quoting the whole criterion — decided here), and what is *not* a body-text
relation. The rule is checked against the 101 existing claims of
`pomgat-lv-1.0`: the PR lists every existing edge the rule would change, as the
brief for the two relinking packages.

## Scope

In: `docs/graph-representation.md` §5 (and §3.1 if the claim kinds need a word),
the `process-work-package` skill's extraction section if it must say more.
Out: any change under `data/` — that is `relink-body-text-a` and `-b`.

## Constraints

Claims are immutable and never merged (spec §3.1); a wrong relation is fixed by
a new edge and an edit with history, never by rewriting a claim. Underestimate,
never upgrade (spec §11).

## Decisions

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

## Open questions

None.

## Verification

The rule fits on one screen; a second reader applying it to chapter 6 gets the
same edges — say in the PR how you checked that. Validator passes.
