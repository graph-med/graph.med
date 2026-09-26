---
name: scope-tree-and-anchor
description: Every statement of a view has one anchor (the concept in the view's `anchor_slot`, the guideline's primary index) — every recommendation exactly one patient group, where its page puts it, none left in a bucket; a membership that holds only inside one guideline's scope is the edge `in_scope_of` (with an optional condition concept), never `broader`; the root is declared on the view (`scope_root`); anchor / subgroup / dimension / condition is decided by four questions per statement.
metadata:
  type: project
---

A view may declare `anchor_slot` (a statement slot) and `scope_root` (a
concept). Each member statement then has exactly one **anchor**, the concept
in that slot, and every anchor reaches the root along `broader` and
`in_scope_of` — along the ones the view's first axis picks, a hierarchy over
the anchor slot that must stand first in its `group_by` and draws the scope
tree (card #202, [[grouping-axes-proposed-and-tested]]). `broader` keeps only what is true whatever guideline you read;
what a guideline stipulates for its own scope ("within this guideline, this
counts as tumour surgery") is a **scope edge** `in_scope_of`, modelling with a
rationale, whose optional `condition` is a concept reference — absent means
unconditional. The root is the guideline's own scope, declared on the view,
never inferred, and sourced where the guideline states its scope. What anchor, subgroup, dimension and condition are is decided
per statement by four questions in order: (1) the guideline's primary index →
anchor; (2) a thing in its own right that is a special case of another ("X is
a Y", changing *which* thing is present) → subgroup, `broader` or, if true only
inside the guideline, a scope edge; (3) free combination with every anchor
value from a closed, named list → dimension; (4) otherwise → condition.
Decided on card #141 (WP-0031, decisions C–H, 2026-09-21, with the physician);
applied in `docs/graph-representation.md` §4, §4.1, §5 and schema 0.9.0, and
on `views/pomgat-lv-1.0` by card #190: the root is the guideline's patient
target group, quoted from its section 2.1.2 (p. 17); the organ families, the
generic groups and the situations after an operation are unconditional scope
edges, the organ families under "Operation eines gastrointestinalen Tumors" and
that under the root; the four groups that are not an operation of the scope (a medication,
a risk profile, an access, a wider group of operations that includes others) hang under the root with
the condition "during an elective operation of the scope". The first question
went from ten answers to five, and all 90 statements reach the root.

**Every recommendation has exactly one patient group, and none is left in a
bucket** (decided by the maintainer on 2026-09-25, for the second view,
`views/sepsis-lf-4.0`; applied by its chapter parts and card #228). The anchor
is what the page gives, and nothing is invented. A recommendation of patient
care that does not restate the target group has the guideline's target group,
the root — or the subgroup where the guideline puts its chapter's patients. A
structural recommendation, addressed to a hospital or to staff, has the patients
the measure serves; the institution or the staff stay in the action or the
label as printed, never a concept of their own, and the action is marked as
structural later (card #94). A group the guideline itself brings into its
scope without being its target group (prevention, say) is a population
concept of its own, labelled as close to the print as the page allows, and
hangs under the root by `in_scope_of`, with the condition under which its
members belong to the target group. The circumstances the recommendation
prints stay conditions. Spec §4 rule (1) and the validator's check of it stand
unchanged; all 98 statements of that view reach its root.

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
([[access-is-a-dimension]]). One patient group for every recommendation
replaced leaving the slot empty where the recommendation names none (card
#217, question 4, option a), which the validator refuses once a view declares
its root: a recommendation without an anchor cannot be reached by answering
the tree's questions ([[view-page-is-a-decision-tree]]), and counting it
outside the tree would have needed a bucket in the spec, the validator and the
build for recommendations that all serve patients their page names or
implies. Asked what is most in line with the project, the maintainer chose
the page's own patients over the bucket.

**How to apply:** Before writing `broader`, ask whether "X is a Y" holds in
any guideline; if only inside this one, write `in_scope_of` with a rationale
naming the scope, and a `condition` where the membership holds only under a
circumstance. Never inherit along `broader` ([[relations-are-edges-not-fields]]);
along a scope edge a view shows what applies generally, set apart and marked,
never merged. Decide a value's role per statement with the four questions,
not per concept: one concept may be the anchor of one statement and the
condition of another. When a recommendation names no patient group, read on
its page whom it serves before calling the slot empty — the target group, the
chapter's subgroup, the patients a structural measure serves, or a group the
guideline brings into scope (then a scope edge to the root, with its
condition) — and flag each such reading in the pull request; never leave the
slot empty, never mint a collector for recommendations without a group, and
never a concept for an institution or for staff. Name no guideline in the mechanism
([[generic-over-guidelines]]). Related: [[concept-hierarchy-depth]],
[[grouping-axes-proposed-and-tested]].
