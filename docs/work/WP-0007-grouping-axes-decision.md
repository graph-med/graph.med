---
id: WP-0007
title: Design the grouping-axes mechanism — proposed, tested, asserted, shown
status: claimed
created: 2026-09-12
updated: 2026-09-13
depends_on: []
blocks: [WP-0008]
owner: agent
initiative: groupings
kind: docs
slug: grouping-axes-decision
---

## Outcome

`docs/graph-representation.md` §4.1 reads as a complete mechanism a person can
propose an axis against and a session can implement without asking: what an
**axis definition** contains (name, carrier, the written rule, who proposed
it, its status), what the **feasibility report** measures and how each measure
is computed (coverage, disjointness, the unplaced remainder by name, depth),
the rule that decides the **carrier** — a statement dimension (a slot) or a
hierarchy respect (`axis` on `broader`) — and how a view **declares** the
axes it groups by and in which order. Nothing in it names an organ, a phase
or POMGAT: the spec describes the mechanism, and the two axes the physician
proposed for POMGAT (perioperative phase, anatomical region) appear only as
the worked example, together with the thought experiment of a second and a
third guideline organised differently (by stage, by leading symptom) to show
the mechanism holds for them unchanged. `docs/open-questions.md` →
grouping-axes leaves the file; → phase-vocabulary is settled with it (the
phase is a statement dimension, proposed like any other axis); the memory
`grouping-axes-proposed-and-tested` is completed with what this package adds.
The follow-up packages of this initiative are checked against the design and
the pull request says which of them change.

## Scope

In: `docs/graph-representation.md` §4.1, §3.2, §5, §13; `docs/open-questions.md`;
the memory `grouping-axes-proposed-and-tested` and its index row;
`docs/publication.md` §3 where the axis switch is described; the 36 population
concepts and 10 families of `pomgat-lv-1.0` as the test material (read them;
change nothing under `data/`).
Out: the schema, the validator, the feasibility tool, any edge or slot value —
those are `schema-grouping-axes` and `link-grouping-axes`.

## Constraints

- Generic over guidelines (memory `generic-over-guidelines`, extended on
  2026-09-13 to the data model): no axis vocabulary is closed, and no axis is
  admitted to the design because one source needs it. `structure_kind` on the
  source stays descriptive and is not the axis vocabulary.
- What groups the graph is always an edge or a slot value with provenance and
  a rationale (memory `relations-are-edges-not-fields`); the feasibility test
  reports, it never writes. `broader` inherits nothing.
- The outline is provenance and a filter, never an axis (memory
  `document-structure-is-provenance`).
- Views stay fixed filter forms (open question view-filter-language); a
  `group_by` declaration is one more form, not a language.

## Open questions

`docs/open-questions.md` → grouping-axes (this package settles what remains
of it); → phase-vocabulary (settled with it); → view-filter-language
(respected, not settled).

## Decisions

- 2026-09-13, maintainer: axes are not a fixed vocabulary of the pool. A
  physician proposes an axis for a guideline; a tool tests its feasibility
  against the data and reports; what holds is asserted with provenance by a
  linking pass; a view then offers it. Guideline-specific in what is proposed,
  generic in how. Recorded in `docs/graph-representation.md` §4.1 and the
  memory `grouping-axes-proposed-and-tested`.

## Verification

The open-question entries are deleted, §4.1 reads as a rule a linking session
and a build session can apply without asking, the memory is indexed,
`uv run tools/validate.py` passes. The PR walks the two POMGAT proposals and
the two imagined guidelines through all four steps, and names, per POMGAT
axis, the two concepts or statements hardest to place and where the rule puts
them.
