---
name: conditions-are-a-conjunction-list
description: A statement's `condition` is always a list of concepts (one entry or more), never a concept-or-list; several entries hold at once (a conjunction), and a source's "or" is one concept naming the alternatives (a disjunction), never two entries.
metadata:
  type: project
---

`slots.condition` holds a list of concept references, one entry or more, in
every statement that has a condition — one shape, whether the recommendation
has one prerequisite or four. **Several entries are a conjunction; a
disjunction is one concept.** Where the source says "at the same time" (the
four prerequisites of a heart-failure recommendation: LVEF, sinus rhythm,
ongoing therapy, heart rate), each is an entry of its own, checkable and
citable alone. Where it says "or" ("at medium or high VTE risk"), one concept
names the alternatives, as the pool already did before the list existed
(`gastrektomie-oder-magenteilresektion`). Independent prerequisites are not
fused into one concept to fit a single value; a constellation concept stands
only where the source names the constellation as one. The other slots stay
single-valued. Decided by the maintainer on 2026-09-23 (card #142, WP-0034);
applied in `docs/graph-representation.md` §3.2 and schema 0.7.0.

**Why:** A single value had forced the extractor to merge independent factors
into one concept, which then could be neither queried nor cited on its own.
"Always a list" was chosen over "a concept or a list" because the latter gives
every consumer two shapes to read, against [[generic-over-guidelines]]'s one
code path, and it lets a later per-entry addition (a condition's kind, a
threshold) be purely additive. A plain list can carry only one of "and" and
"or"; the rule gives the other its own carrier instead of a second list
semantics. A condition is part of the proposition's shape, not a relation
between entities, so [[relations-are-edges-not-fields]] does not turn it into
an edge.

**How to apply:** Write `condition: [concepts/x]` even for one condition. When
a recommendation names several prerequisites, ask of the source's words
whether they hold together (entries) or are alternatives (one concept). Code
reads a slot's concepts through one helper (`fillers` in `tools/build.py`),
never `slots["condition"]` as a concept. A hierarchy axis over `condition`
places each entry's concept.
