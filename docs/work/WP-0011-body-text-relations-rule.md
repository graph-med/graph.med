---
id: WP-0011
title: A written rule per body-text relation
status: review
created: 2026-09-12
updated: 2026-09-14
depends_on: []
blocks: [WP-0012, WP-0016]
owner: agent
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

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- **The relation is decided by the sentence's relation to the box, the kind by
  the sentence's form.** Three tests in order — fills a term (*in*) → `refines`,
  takes a case out → `limits`, adds an action → `supplements` — behind a gate
  (own voice, the box's own action, something the box lacks, not a decline).
  Why: a test on the passage is what two readers can apply alike; tying the
  kind to the edge (criterion ⇔ refines) is what made 7.28's second sentence
  `refines` and 7.25's `supplements`.
- **A criterion with alternatives is one claim per alternative**, each with its
  own edge, never one claim quoting the enumeration. Why: a quote must lie on
  one line of the extracted text (spec §6.2), and the enumeration on p. 64
  spans four; each alternative is what a physician checks against one value;
  the existing claim already quotes one alternative alone, so the other two are
  added beside it and nothing is rewritten.
- **The sentences of one box, and two boxes, get no body-text edge between
  them.** Why: both are graded and each supports its own statement; the shared
  `recommendation_no` is their relation; the site shows these edges as "what
  the body text adds" (`docs/publication.md` §4), where a box does not belong.
  What one box says about another is said between statements (`specializes`,
  `complements`). This removes nine of the fifteen existing edges.
- **A body-text claim is never graded**: `verb` and `direction` as printed, no
  `grade`, no `consensus` (spec §11.6). Recorded in
  `.claude/memory/design/body-text-relations-rule.md`.

## Open questions

None.

## Verification

The rule fits on one screen; a second reader applying it to chapter 6 gets the
same edges — say in the PR how you checked that. Validator passes.
