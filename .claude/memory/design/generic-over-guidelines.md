---
name: generic-over-guidelines
description: Nothing in the build, the schema, the validator or the design is specific to one guideline or one graph — no concept ids, no family names, no axis or vocabulary admitted because the source in front of you needs it; a rule holds at every level by one code path.
metadata:
  type: project
---

The pool, the schema, the site build and the design are written for every
guideline, never for the one being worked on. No concept or statement id, no
family name, no branch or vocabulary exists because of what one data set
happens to contain; a rule stated for the tree ("wherever it forks, the reader
passes a question") is applied by one code path at every level, so a deeper
level cannot silently lack what the root has. Per-*language* tables (the
question words, the axis labels) are fine; per-*graph* logic is not. Set by
the maintainer on 2026-09-12 for the build and on 2026-09-13 for the data
model and the design.

**Why:** On 2026-09-12 the population question was missing between an opened
family and its members because the derivation had special-cased the root; the
maintainer asked "why wasn't there such a node in the first place? it should
have emerged naturally. we don't want anything specific to this graph." On
2026-09-13 a design of grouping axes named anatomy, phase and access modality —
POMGAT's own organising principles — and the maintainer said "the axes sound
graph specific, we need to generalize this, s.t. it also works across other
leitlinien", and of a fixed cross-guideline vocabulary: "then there is a third
Leitlinie. It needs to work for them all." The pool exists to take the next
guideline, organised differently, without a schema change or a code change per
guideline.

**How to apply:** Before proposing a schema field, an enum value, a slot, a
view form or a build feature, ask what a guideline organised by stage or by
leading symptom would need; if the answer differs, design the mechanism and let
the current source be its first instance ([[grouping-axes-proposed-and-tested]]
is the worked case). When a rule appears twice in code — once for the root,
once in the recursion — unify it rather than patch the level that lacks it.
Related: [[view-page-is-a-decision-tree]].
