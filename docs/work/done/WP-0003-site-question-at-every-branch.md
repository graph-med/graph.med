---
id: WP-0003
title: A question diamond at every branching of the tree
status: done
created: 2026-09-12
updated: 2026-09-13
depends_on: [WP-0002]
blocks: [WP-0004]
owner: agent
initiative: ui
kind: build
slug: site-question-at-every-branch
---

## Outcome

Wherever the tree forks, the reader passes a question. An opened family shows
"Welche Population?" between its junction and its member groups; today it fans
straight into them with answers on the edges and no diamond, which the physician
read as a branch without a decision. The family's own recommendations keep hanging
from its junction, through "Welche Bedingung?" where they have a condition. Folding,
the counts on junctions and deep links behave as before; the question folds with
the family.

## Scope

In: the tree derivation in `tools/build.py` (`decision_tree_of`) and the folding
logic in `tools/site/static/graph.js`.
Out: any new question text — "Welche Population?" is reused; a different wording
("Welcher Eingriff?") is a design decision for the maintainer, not this package.

## Constraints

- `docs/publication.md` §3 "Every branching is a question" and "The questions are
  ours; every answer is data".
- The build adds no text it does not already have (`QUESTIONS` in `build.py`).

## Decisions

- 2026-09-12 (agent): the question is a node of the build, not of the browser,
  and one rule makes every one of them: `branch(parent, groups)` asks "Welche
  Population?" and hangs a junction from each answer, called for the root with
  the families and for a junction with its members. Ids are
  `q:<parent>:population` and `q:<junction>:condition`; the client treats no id
  as special (the frame is the root and its outgoing question). The maintainer
  asked why the family question had not emerged on its own: the rule had been
  written for the root only, and the member level as a shortcut past it.
- 2026-09-12 (agent): the reviewer's overlap on a phone was edges, not boxes:
  a taxi edge turned 24 px after its source, inside the source's own rank, so an
  edge fanning from a question to a far answer ran through the boxes stacked
  below the question, and a line to a shared aim left one box through its bottom
  into the next. Every edge now turns 20 px right of the widest node in its
  source's column, set after each layout (`route()`), since a column's width is
  known only then; aim and relation edges turn the same way. The screenshot
  driver reports an edge drawn across a node or an answer it does not touch.
- 2026-09-12 (agent): a junction is built once and its question and members
  with it; a group with two parents gets a second answer edge into the same
  junction, never a second question or subtree.
- 2026-09-12 (agent): folding stops at a question whose answers are groups: an
  open junction shows its own question with the member junctions folded behind
  it, and follows a condition question through to its recommendations and aims
  as before.

## Open questions

None.

## Verification

Build; the view JSON has no edge from a junction directly to a junction. Browser
captures of a family opened, desktop and phone, in the pull request.
