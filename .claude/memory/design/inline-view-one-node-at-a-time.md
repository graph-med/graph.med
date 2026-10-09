---
name: inline-view-one-node-at-a-time
description: The inline view (MCP App) draws one tree node or one card at a time, bound to get_tree_node and get_entity, drilling down through tools/call; the whole graph is the deep link's, never the view's; no position tool, no path or tree mode, no graph canvas (#278, 2026-10-06; replaces the plan's position reading of 2026-09-27).
metadata:
  type: project
---

The inline view is not a view tool of its own. It is the MCP Apps resource that
`get_tree_node` and `get_entity` point to (`_meta.ui.resourceUri`). It draws exactly
what the call that opened it returned: one node of one grouping (its questions,
answers, recommendations) or one card. A click calls one of the two tools again
through the host, without a model turn. The whole graph is one tap away through the
deep link every result carries (`docs/publication.md` §8, "Layer 2").

It relies only on the tree shape every grouping shares, names a grouping by its label
and question, and works for a first grouping that is a dimension or the chapter
outline. It names no graph, grouping, axis or slot. A "pathway" stays a path through
a view's derived trees, never a `pathways/` entity.

**Why:** the plan of 2026-09-27 read the view as a *position* (graph, grouping,
focus, highlights) drawn in path mode or tree mode, with crowding advice from the
tool. The maintainer's brief of 2026-10-06 bound the view to the two existing tools
instead, and the initiative's owner adopted it (card #278, decision 1): one node or
card at a time solves crowding by design, needs no graph canvas in the chat (no
Cytoscape, a small page), and adds no tool. #276 and #277 were closed as superseded.

**How to apply:** do not add a position or view tool, a mode or crowding advice to
the server. A change to what the view shows is a change to what the two tools return,
or to the page (`tools/site/templates/mcp-app.html`). How far the view and the model
talk to each other, and how a person keeps their place among several views, are open
(`docs/open-questions.md`: `inline-view-interaction`, `inline-view-trail`). See also
[[view-page-is-a-decision-tree]] and [[quote-gate-follows-the-site]].
