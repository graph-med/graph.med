---
name: view-scope-in-any-grouping
description: The inline view's scope, read in any grouping — "a few nodes" / "one patient group" is path mode (the pruned tree from the chosen grouping's root to the focus, questions and answers kept), "the whole graph" is tree mode (that grouping folded as the site opens it); the model decides per call, the tool only advises; never an all-at-once drawing, never a `pathways/` entity.
metadata:
  type: project
---

The plan for the MCP App (2026-09-27) settled: "Claude decides per call whether the
view shows one patient group at a time or the whole graph; the tool only advises."
Its reading, in any grouping of a view (`docs/publication.md` §8):

- **"A few nodes"** — the plan's "one patient group" — is **path mode**: the pruned
  tree from the root of the chosen grouping to the focus, keeping the questions asked
  on the way and the answers taken.
- **"The whole graph"** is **tree mode**: that grouping folded as the site opens it,
  with the position marked. Never everything open at once.
- The grouping is part of the position (a graph, a grouping — the first by default —,
  a focus, highlights); the first grouping is only where the page opens.
- A "pathway" is a path through one of a view's derived trees (`groupings`, with
  `scope` where the view declares a scope tree), never a `pathways/` entity.

**Why:** the plan was written when the only tree people had seen was today's first
grouping, the tree of patient groups. The maintainer then said the next graph may
not be organised by patient group — "patient group might not be the axis for the next
graph which may be a decision tree along a diagnostic path. can we make it more
generic?" — so a reading tied to patient groups would bind the view to one shape of
one graph. Path mode keeps what makes a position readable on the site (every fork
passes a question, answers on the edges); tree mode is the folded tree, because the
view page is "not an all-at-once drawing" ([[view-page-is-a-decision-tree]]). The
chapter outline is one of the groupings, never the default shape
([[document-structure-is-provenance]]).

**How to apply:** the view tool and the view (#277, #278) offer exactly these two
modes over whichever grouping the call names, and the tool may suggest a narrower
scope but never overrides the model's choice. Name no grouping, axis or slot in
the view's or the server's code; rely only on the tree shape every grouping has.
Proposed at the initiative's registration (#267, 2026-09-27), read in any grouping
in the maintainer's second round the same day.
