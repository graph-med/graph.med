---
name: relations-are-edges-not-fields
description: A relation between entities is an edge with provenance (`broader`, `codes_as`), never a field on an entity; and `broader` carries no inheritance of recommendations.
metadata:
  type: project
---

Concept subsumption is the edge `broader` (concept → concept, modelling, with a
rationale) and coding is the edge `codes_as`; neither is a property on the
concept. A recommendation about a broader concept is never propagated to a
narrower one. Decided 2026-09-10; applied in `docs/graph-representation.md` §5.

**Why:** The physician's feedback proposed both as fields (`broader`,
`coded_as`) on concepts. The pool already had `codes_as` as an edge, and the
spec's reason holds for both: an edge carries its own `source`, can be attested,
dated and marked stale, and dangles visibly when its target changes; a field
can do none of that. The same feedback set the no-inheritance rule itself, as a
binding architectural decision: whether a recommendation for colorectal
resection holds for its minimally invasive variant is a clinical question the
source either answers explicitly or leaves as a visible gap; propagating along
the hierarchy would be exactly the improvising behaviour the pool is built to
exclude.

**How to apply:** When a need looks like "add a reference field to an entity",
add an edge kind instead. Let the build use `broader` only to group and fold
patient groups, never to move a statement from a family to a member. A
hierarchy axis's placement `{concept: parent}` is not a relation stated as a
field: once the axis is asserted it must pick an edge the pool holds, and the
edge carries the provenance; the axis only chooses which edges draw its tree,
and `broader` names no axis ([[grouping-axes-proposed-and-tested]], card
#202). Related:
[[document-structure-is-provenance]], [[two-layer-identity]].
