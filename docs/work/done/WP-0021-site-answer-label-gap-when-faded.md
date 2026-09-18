---
id: WP-0021
title: A faded answer's label keeps its clean gap in the line
status: done
created: 2026-09-16
updated: 2026-09-18
depends_on: []
blocks: []
owner: agent
initiative: ui
kind: build
slug: site-answer-label-gap-when-faded
---

## Outcome

A faded or dimmed answer edge (`.dim`, `.faded` — search fading, selection
fading, and an unopened sibling in a family fan-out alike) shows its label the
same way a full-opacity, selected answer does: the label's opaque background
breaks the line cleanly behind the text, so no line is visible crossing through
the word. Only the line itself, its arrowhead and the label's text colour read
as dimmer than the selected path; the label's background stays as opaque as an
unfaded edge's.

## Scope

In: the cytoscape style block in `tools/site/static/graph.js` — the `edge`,
`edge[kind = 'answer']`, `.dim` and `.faded` selectors, specifically how the
blanket `opacity` property interacts with `text-background-opacity`. Likely
shape of the fix: stop using the single `opacity` property to dim an answer
edge's label background, and instead lower only `line-color`/`target-arrow-color`
(or `text-opacity` for the label's own text colour) while `text-background-opacity`
stays fixed at 1 for every edge regardless of `.dim`/`.faded`.

Out: which elements get `.dim` or `.faded` in the first place (unaffected —
WP-0001's search matching, `select()`'s path highlighting); node fading (a node
has no separate label background, its own fill dims as one piece, which is not
the reported problem); any change to how faded the line itself reads.

## Constraints

- The rest of a faded answer must stay visibly secondary to the selected path.
  `docs/publication.md` §3, "fading, never hiding": this package narrows what
  fades (not the label's occluding background), it must not make an unselected
  answer as prominent as the selected one.
- Applies wherever `edge[kind = 'answer']` carries `.dim` or `.faded`: the
  family/chapter fan-out (the reported screenshot), search highlighting, and
  tap-selection highlighting all share the same base style rule, so the fix in
  one place must not need repeating per caller.
- ui initiative: `tools/build.py` and `tools/site/` only, no data or schema
  change (`docs/work/initiatives/ui.md`).
- Checked in a browser, desktop and phone, light and dark, with the `screenshot`
  skill; the pull request links the preview and specifically recaptures the
  reported scene (an open family question with folded, faded siblings).

## Decisions

- 2026-09-16 (maintainer, by screenshot): reported the family/chapter question
  "präoperativ" (selected, 28) beside faded "intraoperativ" (20), "postoperativ"
  (26), "perioperativ" (15) — the faded siblings' labels show the trunk line
  crossing through the text, the selected one does not. Wanted: the same clean
  gap for faded labels, without raising their overall prominence.

- 2026-09-16 (agent, implementing): the blanket `opacity` is not the only property
  that fades the label's background. Cytoscape 3.30 draws an edge label from a
  texture cache and blits it as one image — text and background together — with
  `text-opacity × opacity` as its alpha, so `text-opacity` on `.dim`/`.faded`
  let the line through exactly as `opacity` did (verified by capture: the pixels
  were identical). What fades on a dimmed or faded edge is therefore
  `line-opacity` (0.12 / 0.15 as before; the line and its arrowhead are drawn
  directly) and the label text's `color`, set to `--line` — the stylesheet's
  faint neutral, the foreground at about 15 % over the background in both
  themes, so the text reads as it did; `opacity` and `text-background-opacity`
  stay 1 on every edge. Nodes keep the blanket opacity (`node.dim`,
  `node.faded`), unchanged. One consequence: `.dim` and `.faded` label text now
  share one shade instead of 12 % against 15 %, a difference nobody could see.

## Open questions

None. The fix target is a specific, reproduced visual defect, not a design
choice.

## Verification

1. `uv run tools/validate.py` passes (no data change).
2. `uv run tools/build.py` succeeds.
3. Browser, the exact reported scene (a family question, one answer open, its
   siblings folded): no line visible through any faded answer's label text.
4. Same check under a search query that fades some answer edges, and under a
   tap-selection that dims elements off the selected path. Screenshot captures
   light and dark, desktop and phone.
