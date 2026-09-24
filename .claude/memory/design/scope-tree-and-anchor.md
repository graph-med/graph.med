---
name: scope-tree-and-anchor
description: Every statement of a view has one anchor (the concept in the view's `anchor_slot`, the guideline's primary index); a membership that holds only inside one guideline's scope is the edge `in_scope_of` (with an optional condition concept), never `broader`; the root is declared on the view (`scope_root`); anchor / subgroup / dimension / condition is decided by four questions per statement.
metadata:
  type: project
---

A view may declare `anchor_slot` (a statement slot) and `scope_root` (a
concept). Each member statement then has exactly one **anchor**, the concept
in that slot, and every anchor reaches the root along `broader` and
`in_scope_of`. `broader` keeps only what is true whatever guideline you read;
what a guideline stipulates for its own scope ("within this guideline, this
counts as tumour surgery") is a **scope edge** `in_scope_of`, modelling with a
rationale, whose optional `condition` is a concept reference — absent means
unconditional. The root is the guideline's own scope, declared on the view,
never inferred. What anchor, subgroup, dimension and condition are is decided
per statement by four questions in order: (1) the guideline's primary index →
anchor; (2) a thing in its own right that is a special case of another ("X is
a Y", changing *which* thing is present) → subgroup, `broader` or, if true only
inside the guideline, a scope edge; (3) free combination with every anchor
value from a closed, named list → dimension; (4) otherwise → condition.
Decided on card #141 (WP-0031, decisions C–H, 2026-09-21, with the physician);
applied in `docs/graph-representation.md` §4, §4.1, §5 and schema 0.9.0.

**Why:** the concept hierarchy mixed subsumption with scope stipulations —
rationales beginning "Im Geltungsbereich der Leitlinie", one edge whose
direction reverses outside the guideline, and one pointing to a group *wider*
than the guideline's patients — so reusing it for the next guideline would
carry false "is a" edges, while removing them without a replacement left
the general recommendations unreachable from the specific group and split
the tree into many single-member families. A separate edge kind keeps both
true. As an entity instead of an edge, a scope membership would lack source,
date and language, so no attestation or staleness. A root inferred by a
validator rule would force a coined collector; declared on the view, minting
it is a reviewed act. The four questions replace "if it varies with the
recommendation, it is a dimension" (true of every patient group) and "the
anchor is what the asking person brings" (fails where the index is computed,
like a pneumonia severity score): orthogonality, not variation, is what makes
a dimension, which is why the access broke the population tree
([[access-is-a-dimension]]).

**How to apply:** Before writing `broader`, ask whether "X is a Y" holds in
any guideline; if only inside this one, write `in_scope_of` with a rationale
naming the scope, and a `condition` where the membership holds only under a
circumstance. Never inherit along `broader` ([[relations-are-edges-not-fields]]);
along a scope edge a view shows what applies generally, set apart and marked,
never merged. Decide a value's role per statement with the four questions,
not per concept: one concept may be the anchor of one statement and the
condition of another. Name no guideline in the mechanism
([[generic-over-guidelines]]). Related: [[concept-hierarchy-depth]],
[[grouping-axes-proposed-and-tested]].
