---
name: view-page-is-a-decision-tree
description: The view page is one decision tree — which patient group? (families, then members, a question at every fork) → which condition? → recommendation (coloured by direction, the grade a letter) → aim, answers on the edges — drawn left to right by Cytoscape.js + dagre, folded by default, nothing overlapping; not chapters as the shape, not an outline, not an all-at-once drawing.
metadata:
  type: project
---

A view page on the site is **one decision tree**: a root, a question "Which patient
group?" whose answers sit on the edges, a junction per group, an optional "Which
condition?" with its answers on the edges, the recommendations as boxes coloured
by their direction with the grade as a letter, aims as tags. Drawn top-down by Cytoscape.js with the
dagre layout, self-hosted; a node's details in the section below the graph.
Decided 2026-09-06 after three rejected forms; applied in `docs/publication.md`
§3 and `tools/build.py`.

Refined 2026-09-12 from the physician's review of the live site (2026-09-11):
**every fork passes a question** — an opened family asks the population question
again before its member groups, because a bare fan of answers read as "a branch
without a decision" — built by one rule for the root and every family alike
(`branch()` in `tools/build.py`; the maintainer asked why the family question
had not emerged on its own: the rule had been written for the root only). And
**nothing overlaps**: an answer is written at the end of its edge, anchored where
the arrow meets its target; every edge's vertical run lies in the gap after its
source's column, set after each layout; the `screenshot` skill measures both.

**Why:** The maintainer read the earlier forms on a phone. The force-directed
drawing of everything was "too dense"; the outline tree was "more like a table of
contents"; the per-chapter layered graph was close but they wanted "one graph, no
chapters", asked "why is it not a decision tree like structure? it's a leitlinie",
expected labels on the edges, and saw labels that did not fit the boxes — "is
there no library we can use to solve all this". They liked the 2D pan-and-zoom
view where "nothing is dense, nothing overlays", and the detail section below the
graph throughout. A library that measures text, lays out a DAG without overlaps,
and places edge labels answers all of it; self-hosting keeps the site free of
third-party requests.

**How to apply:** Keep one tree for the whole view, drawn left to right and
folded by default (the maintainer found the top-down, all-open tree "much too
wide" on a desktop, with labels still spilling out of the diamonds); the first
answers are the family concepts (`broader`), each unfolding into its members
level by level, and a recommendation stays on the group it was made for; keep the
answers on the edges and the questions as the only text the build adds, in the
view's source language ("Welche Population?", "Welche Bedingung?" — the
maintainer saw "Which patient group?" live and asked for it to be corrected,
content and language); boxes
show the short label behind the direction glyph; keep the direction colours, the grade letter and the
node forms; keep Cytoscape.js + dagre vendored and pinned. Do not split
the page by chapter, reintroduce an outline, or hand-write layout again. The tree
is *derived* from slots until pathways are authored (`docs/open-questions.md` →
decision-graph-derivation); never invent yes/no branches or an ordering the data
does not carry. Add information to the section below the graph rather than to
the graph. A chapter tree *beside* the graph, as a filter over what is shown, is
not the outline form the maintainer rejected: it narrows the one tree, it never
becomes its shape ([[document-structure-is-provenance]]).
