---
name: grouping-axes-proposed-and-tested
description: A grouping axis is never a fixed vocabulary of the pool or the build — a person proposes one per guideline as an `axes/` entity, a tool tests its feasibility and reports, a linking pass asserts it, then a view offers it in `group_by`; an axis is an overlay whose placements stay in its file — a dimension gives statements values, a hierarchy picks for each concept an existing `broader`/`in_scope_of` edge — and the tree of patient groups a view opens with is its first axis.
metadata:
  type: project
---

By what a view's tree groups its answers — an organ, a perioperative phase, a
stage, a symptom — is an **axis**, and axes are not fixed in the pool, the
schema or the build. Each guideline gets the axes a person proposes for it as
an entity `axes/<id>` (carrier, slot, values or `several`, the written rule,
the proposer as a role, a status per view, and the rule's placements); a tool
tests whether the data can carry a proposal and prints a report (coverage by
concept and by statement, disjointness, the unplaced by name heaviest first,
depth, and for a hierarchy the placements no edge carries) and writes nothing;
a linking pass asserts what a person accepts by setting the view's status to
`asserted`; a view then declares which asserted axes it groups by
(`group_by`, a view property, not a filter). Decided 2026-09-13 by the
maintainer; the mechanism completed by WP-0007; applied in
`docs/graph-representation.md` §4.1, `docs/publication.md` §3 and the
`groupings` initiative.

**An axis is an overlay** (decided 2026-09-24, card #202). Its placements
stay in its own file after assertion and are what the site draws; the pool
under it holds only the facts they choose from. A dimension's placement
`{statement: value}` is the statement's value — the statement holds no slot
for it. A hierarchy's placement `{concept: parent}` picks an edge the pool
already holds, `broader` or `in_scope_of`: once the axis is asserted the
validator refuses a placement no edge carries, and a relation the axis needs
is added to the pool first as an edge of its own. `broader` names no axis.
**The tree of patient groups a view opens with is its first axis** — a
hierarchy over the anchor slot, listed first in `group_by`, required first in
a view with a `scope_root` (it draws the scope tree) — with explicit
placements written by the pass that writes the guideline's `broader` and
`in_scope_of` edges (`axes/pomgat-population` for the first view). Nothing is
built in beside the chapters; a view without such an axis shows its patient
groups unfolded. A dimension axis may declare its own `question`.

**Why:** The first design named anatomy, phase and access modality as *the*
axes — the principles POMGAT's chapters happen to follow. The maintainer
objected that "the axes sound graph specific, we need to generalize this,
s.t. it also works across other leitlinien", and, when a fixed cross-guideline
vocabulary was offered instead, that "then there is a third Leitlinie. It
needs to work for them all" — proposing that axes be suggested by a physician
and their feasibility tested in post-processing, guideline-specific in what is
proposed but generic in how. Two conditions keep this consistent with the
rest of the model: the *grouping* is never post-processed, only the test is —
what groups the graph is always data a person or a linking pass wrote and a
reviewer read, a placement in the axis's file, never the build applying the
axis's rule ([[relations-are-edges-not-fields]]), because the physician's
original complaint was that `broader` might have emerged in post-processing; and
"feasible" is a measurement, not an opinion, so the pull request that asserts
an axis carries a report a reviewer can check. The worked example on the first
source showed why the measures are what they are (its report of 2026-09-13): a region axis places 20 of
36 population concepts but only 42 of 90 statements, because the generic
"gastrointestinal tumour operation" carries 24 — coverage by concept alone
would have hidden that. The region was withdrawn for that view on 2026-09-24
(WP-0031, card #190): the view's scope tree places the organ families and the
generic groups in one tree, which the region, one parent per concept and no
place for the generic half, could not.

The overlay replaced writing the assertion into the pool (`axis` on
`broader`, slot values on statements) because that could not hold one fact
once: all 17 single placements of the region coincided with plain `broader`
edges, a second edge naming the axis was refused as a duplicate, and tagging
the existing edge took it out of the plain tree. A subsumption is true
whatever grouping uses it, so it is one edge; which edges a grouping uses is a
choice over the facts. `broader` also does two jobs — facts that the card's
families, view membership and concept pages read across every facet, and the
default tree — and a true but unhelpful edge reshaped the tree the moment it
was added. For the default tree the maintainer chose explicit placements per
guideline ("option b") over one generic axis selecting every edge, because
the generic axis would have put the built-in back in a data file and given up
exactly that separation. It also settled where a dimension value's reason
lives: beside the value, as the placement's `rationale` where the rule alone
does not decide it.

**How to apply:** Never add an axis name to the schema, the validator or
`tools/` ([[generic-over-guidelines]] applies to the data model too); the
schema's `structure_kind` on a source describes the document and is not the
axis vocabulary. Decide the carrier by the four questions of
[[scope-tree-and-anchor]], asked per statement: a value that is a true "is a"
of a concept is a hierarchy respect (placements that pick `broader` or
`in_scope_of` edges, one parent per axis unless the definition says
`several`); a value that combines freely with every
anchor value from a closed, named list is a statement dimension (placements
per statement, values are concepts of facet `qualifier`, the dimension's
question is asked before the population's). Orthogonality decides a dimension, not variation:
"varies with the recommendation" is true of every patient group. Never
mint a "several" family: what spans families is unplaced and shows as "not
placed". Treat the feasibility tool as a check like the validator — it
reports, it never writes to `data/`. Put an axis's report in the pull request
that asserts it; leave an axis whose report falls short as proposed or
withdrawn, not asserted. Never write an axis into the pool: no axis property
on an edge, no slot a dimension adds on a statement. A guideline that gets a
view gets its first hierarchy axis with the pass that writes its edges. The
outline is never an axis
([[document-structure-is-provenance]]), but its headings are the fallback a
rule may use where the sentence names no value; the sentence wins.
