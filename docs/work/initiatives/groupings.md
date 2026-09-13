---
id: groupings
title: Grouping axes and specialised views
---

From the physician's review: the `broader` hierarchy is to be *defined*, not to
emerge; families should be choosable by more than one axis — the outline, the
anatomical region, the operative phase; and there should be specialised looks
that hide aspects ("show me every node that …").

**Scope.** The mechanism first (`docs/graph-representation.md` §4.1): an axis
is proposed by a person for a guideline, tested for feasibility by a tool that
reports and never writes, asserted with provenance by a linking pass, and only
then offered by a view — guideline-specific in what is proposed, generic in
how, so that a second and a third guideline organised by other principles use
the same mechanism unchanged. Then the schema and the tool, then the first
proposed axes tested and asserted on the first source, then the site. `broader`
stays an edge with provenance (memory `relations-are-edges-not-fields`); the
outline stays provenance and a filter, never an axis (memory
`document-structure-is-provenance`); views stay fixed filter forms (open
question view-filter-language).

**Out of scope.** A query language; authored pathways (open question
decision-graph-derivation); a fixed vocabulary of axes in the pool or the
build (memory `generic-over-guidelines`).
