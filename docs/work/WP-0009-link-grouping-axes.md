---
id: WP-0009
title: Test and assert the first proposed axes on POMGAT
status: claimed
created: 2026-09-12
updated: 2026-09-13
depends_on: [WP-0008]
blocks: [WP-0010]
owner: agent
initiative: groupings
kind: linking
slug: link-grouping-axes
---

## Outcome

The axes the physician proposed for `pomgat-lv-1.0` — the perioperative phase
as a statement dimension, the anatomical region as a hierarchy respect, in the
form `grouping-axes-decision` gives them — exist as axis definitions in the
pool, each has been run through `tools/axes.py` against the view, and each
whose report the pull request judges feasible is asserted: slot values on the
statements and `broader` edges with `axis`, every one `modelling` with a
rationale, in `data/edges/pomgat-lv-1.0/grouping-axes.yaml` and on the
statement files; family concepts minted where an axis needs them (facet,
label, source language). The existing `broader` edges are read as the region
axis where the rule confirms them and left as plain subsumption where it does
not. What the rule cannot place is listed in the pull request with the
reason, not forced; an axis whose report falls short is left proposed, with
the report in the pull request, not asserted.

## Scope

In: `data/axes/` (or the namespace `schema-grouping-axes` names),
`data/edges/pomgat-lv-1.0/`, `data/statements/`, new files under
`data/concepts/` for families.
Out: the site; any axis nobody proposed; a change to the mechanism.

## Constraints

Spec §11 (search before minting, nothing inherited, no review status written);
spec §4.1 (the report decides nothing — the pull request does, and says why);
memory `concept-hierarchy-depth` (as deep as subsumption goes; families are
concepts without a parent on that axis); short labels above ~45 characters
(memory `short-label-limit`); everything in the source language with `lang`.
Statements are edited, not replaced: a slot value added is an edit with
history (spec §7), never a new statement.

## Decisions

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- 2026-09-13, WP-0007: the two proposals and their rules are the worked example of spec §4.1; the phase's fourth value is *perioperativ*; the region axis is proposed with `several: false` first, and the report decides whether it is asserted at all — 46 of 90 statements sit on populations the rule leaves unplaced.

## Open questions

None.

## Verification

Validator passes; the PR contains the feasibility report of every proposed
axis before and after assertion, lists every population concept with its
family per hierarchy axis and every statement with its value per dimension
axis as tables, and the unplaced with the reason.
