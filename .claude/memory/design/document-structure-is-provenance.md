---
name: document-structure-is-provenance
description: A source's chapters are provenance (`section` on the claim, `outline` on the source) — a filter, and one grouping the reader may choose from the tree's switch — never nodes or edges in the pool and never the tree's default shape; the proposed `outlines/` namespace was rejected because the pool models knowledge, not documents.
metadata:
  type: project
---

Where a claim sits in its document is recorded on the claim (`section`, next to
`recommendation_no`) and the document's table of contents on the source
(`outline`, complete, including sections with no recommendation). A chapter
reaches the reader as a view filter, as a tree beside the graph, and — since
2026-09-13 — as the built-in chapter grouping of the tree's switch, derived at
build time from the claims' sections and the outline, second after the view's
tree of patient groups, which stays the default (since card #202 that tree is
the view's first axis, [[grouping-axes-proposed-and-tested]]). There is no `outlines/` namespace, no chapter node and no
edge to a chapter, and no axis entity for the outline. Decided 2026-09-10;
applied in `docs/graph-representation.md` §6.7, §4 and §4.1,
`docs/publication.md` §3.

**Why:** A physician's feedback asked for chapters as navigable objects with
their own namespace, so that a click on "7.4" shows that chapter's subgraph and
uncovered sections show as gaps. The maintainer's position: "I do not want to
model the document but the knowledge." Both needs are met by provenance: the
section on the claim gives the filter, the outline on the source gives the
coverage count, and the validator makes the section a controlled reference by
checking it against the outline. What a chapter *means* clinically (an organ
family, a perioperative phase) is knowledge and goes onto concepts and statements,
which is also the only form that survives a second guideline with a different
outline. Statements and concepts never carry a section, because a statement can
be supported from two chapters and a concept used in five.

The chapter grouping on the site does not reopen this. The physician's notes of
2026-09-11 listed the table of contents beside the anatomical region and the
operative phase as groupings to choose the broader concepts by, and when the
first build offered chapters as separate views the maintainer decided on
2026-09-13: "these are all the broader concepts, why are they not part of the
one drop down, instead of different views?" So the switch lists the chapters
as one grouping among the others, and the tree under it asks "which chapter?"
first — a way of reading derived from provenance, not modelling: still no
entity, no edge, no proposal or assertion, and a second guideline gets it from
its own outline without a change.

**How to apply:** Write `section` on claims and `outline` on sources; never
mint an entity for a chapter or make the outline the tree's default shape — the
reader chooses the chapter grouping from the switch, and a chapter there is an
answer of a question, not a node in the pool. When a source's headings
carry clinical meaning, express that meaning as `broader` edges, facets or a
phase vocabulary, using the heading as the hint and never the section number as
the key. Related: [[relations-are-edges-not-fields]],
[[view-page-is-a-decision-tree]].
