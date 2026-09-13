---
name: grouping-axes-proposed-and-tested
description: A grouping axis is never a fixed vocabulary of the pool or the build — a person proposes one for a guideline, a tool tests its feasibility and reports, a linking pass asserts it with provenance, then a view offers it; two carriers, a slot or `axis` on `broader`.
metadata:
  type: project
---

By what a view's tree groups its answers — an organ, a perioperative phase, a
stage, a symptom — is an **axis**, and axes are not fixed in the pool, the
schema or the build. Each guideline gets the axes a person proposes for it;
a tool tests whether the data can carry a proposal and prints a report; a
linking pass asserts what holds as `broader` edges naming the axis or as slot
values on statements, with provenance and a rationale; a view then declares
which asserted axes it groups by, and the site offers exactly those. Decided
2026-09-13 by the maintainer; applied in `docs/graph-representation.md` §4.1,
`docs/publication.md` §3 and the `groupings` initiative.

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
"feasible" is a measurement (coverage, disjointness, the unplaced by name,
depth), not an opinion, so the pull request that asserts an axis carries a
report a reviewer can check.

**How to apply:** Never add an axis name to the schema, the validator or
`tools/` ([[generic-over-guidelines]] applies to the data model too); the
schema's `structure_kind` on a source describes the document and is not the
axis vocabulary. Decide the carrier by one rule: a value that varies with the
recommendation is a statement dimension (a slot), a value that is a true "is
a" of a concept is a hierarchy respect (`axis` on `broader`). Treat the
feasibility tool as a check like the validator — it reports, it never writes
to `data/`. Put an axis's report in the pull request that asserts it; leave
an axis whose report falls short as proposed, not asserted. The outline is
never an axis ([[document-structure-is-provenance]]); the existing family
hierarchy is the first axis, read as one hierarchy respect.
