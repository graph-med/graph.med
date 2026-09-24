---
name: grouping-axes-proposed-and-tested
description: A grouping axis is never a fixed vocabulary of the pool or the build — a person proposes one per guideline as an `axes/` entity, a tool tests its feasibility and reports, a linking pass asserts it with provenance, then a view offers it in `group_by`; two carriers, a slot (dimension) or `axis` on `broader` (hierarchy), decided by one rule.
metadata:
  type: project
---

By what a view's tree groups its answers — an organ, a perioperative phase, a
stage, a symptom — is an **axis**, and axes are not fixed in the pool, the
schema or the build. Each guideline gets the axes a person proposes for it as
an entity `axes/<id>` (carrier, slot, values or `several`, the written rule,
the proposer as a role, a status per view, and the rule's placements until
assertion); a tool tests whether the data can carry a proposal and prints a
report (coverage by concept and by statement, disjointness, the unplaced by
name heaviest first, depth) and writes nothing; a linking pass asserts what a
person accepts as `broader` edges naming the axis or as slot values on
statements, with provenance and a rationale; a view then declares which
asserted axes it groups by (`group_by`, a view property, not a filter), and
the site offers exactly those after the plain hierarchy every view has.
Decided 2026-09-13 by the maintainer; the mechanism completed by WP-0007;
applied in `docs/graph-representation.md` §4.1, `docs/publication.md` §3 and
the `groupings` initiative.

**Why:** The first design named anatomy, phase and access modality as *the*
axes — the principles POMGAT's chapters happen to follow. The maintainer
objected that "the axes sound graph specific, we need to generalize this,
s.t. it also works across other leitlinien", and, when a fixed cross-guideline
vocabulary was offered instead, that "then there is a third Leitlinie. It
needs to work for them all" — proposing that axes be suggested by a physician
and their feasibility tested in post-processing, guideline-specific in what is
proposed but generic in how. Two conditions keep this consistent with the
rest of the model: the *grouping* is never post-processed, only the test is —
what groups the graph is always an edge or a slot value with provenance
([[relations-are-edges-not-fields]]), because the physician's original
complaint was that `broader` might have emerged in post-processing; and
"feasible" is a measurement, not an opinion, so the pull request that asserts
an axis carries a report a reviewer can check. The worked example on the first
source showed why the measures are what they are (its report of 2026-09-13): a region axis places 20 of
36 population concepts but only 42 of 90 statements, because the generic
"gastrointestinal tumour operation" carries 24 — coverage by concept alone
would have hidden that. The region was withdrawn for that view on 2026-09-24
(WP-0031, card #190): the view's scope tree places the organ families and the
generic groups in one tree, which the region, one parent per concept and no
place for the generic half, could not.

**How to apply:** Never add an axis name to the schema, the validator or
`tools/` ([[generic-over-guidelines]] applies to the data model too); the
schema's `structure_kind` on a source describes the document and is not the
axis vocabulary. Decide the carrier by the four questions of
[[scope-tree-and-anchor]], asked per statement: a value that is a true "is a"
of a concept is a hierarchy respect (`axis` on `broader`, one parent per axis
unless the definition says `several`); a value that combines freely with every
anchor value from a closed, named list is a statement dimension (a slot,
values are concepts of facet `qualifier`, the dimension's question is asked
before the population's). Orthogonality decides a dimension, not variation:
"varies with the recommendation" is true of every patient group. Never
mint a "several" family: what spans families is unplaced and shows as "not
placed". Treat the feasibility tool as a check like the validator — it
reports, it never writes to `data/`. Put an axis's report in the pull request
that asserts it; leave an axis whose report falls short as proposed or
withdrawn, not asserted. The outline is never an axis
([[document-structure-is-provenance]]), but its headings are the fallback a
rule may use where the sentence names no value; the sentence wins.
