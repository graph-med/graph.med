---
id: WP-0020
title: Search steps from match to match, not only highlights
status: done
created: 2026-09-16
updated: 2026-09-18
depends_on: []
blocks: []
owner: agent
initiative: ui
kind: build
slug: site-search-navigate-matches
---

## Outcome

Typing a query and using a "next match" control moves the reader from one match
to the next, word-processor style: a small icon beside the search box, and the
Down/Up arrow keys while the search box has focus, step forward/backward through
the current match set in graph order (top to bottom, left to right by rank),
wrapping from the last match to the first and back. Stepping selects the new
match exactly as tapping it would — the detail sheet opens for it, the graph
pans and fits to it — while the existing soft highlight (matches keep colour,
the rest fades) is unchanged for every other match. The counter shows the
reader's position in the set, e.g. "match 3 of 12", without losing the existing
"n matches in m sections" information.

## Scope

In: the search row (`tools/site/templates/view.html`), `tools/site/static/graph.js`
(`matches()`, `highlight()`, `research()`, the new step function and its keydown
handler), `tools/site/static/site.css` (the new control), `docs/publication.md`
§3 "A search box" (extend the paragraph to describe stepping and the counter
format, as WP-0006 and WP-0019 amend the design doc alongside their build change).

Out: the matching logic itself (WP-0001, done, not reopened here); the chapter
tree and the facet filter; any change to what fades or how; a search inside the
chapter tree (`docs/open-questions.md` → chapter-search, unrelated).

## Constraints

- `docs/publication.md` §3: "matches keep their colour and everything else fades
  without disappearing" stays true. Stepping is a selection layered on the
  existing highlight, not a new highlighting mode, and must not change what is
  faded.
- Only currently visible matches (`.not(".folded")`, i.e. not hidden behind an
  unopened question) are steppable. If a step needs to unfold a question to
  reach its target, it does so the same way `research()` already does
  (`unfoldTo`), so a step never lands on a node the reader cannot see land.
- ui initiative: `tools/build.py` and `tools/site/` only, no data or schema
  change (`docs/work/initiatives/ui.md`).
- Checked in a browser, desktop and phone, light and dark, with the `screenshot`
  skill; the pull request links the preview (`docs/work/README.md`, `AGENTS.md`).

## Decisions

- 2026-09-16 (maintainer): both mechanisms are wanted together, not either/or —
  a small icon in the search row and the arrow keys while the search box has
  focus, modelled on find-in-document navigation (Word, browser find).
- 2026-09-16 (agent): the counter keeps its one phrase and gains the position in
  front of it — "3 of 12 matches in 4 sections" — rather than a second phrase
  ("match 3 of 12 · 12 matches in 4 sections"), which would say the number of
  matches twice and wrap to a second line on a phone; before the first step it
  reads "12 matches in 4 sections" as before. No tradeoff on a phone to flag.
- 2026-09-16 (agent): "graph order" is read as the reading order of a
  left-to-right tree — a depth-first walk from the root, a node before what
  hangs from it, siblings top to bottom (by their laid-out position), a relation
  edge not followed — so that a matching group is followed by its own matching
  recommendations, the way find-in-document follows the document. A column-major
  order (every junction, then every box) would visit all groups before any
  recommendation; a plain top-to-bottom sort would interleave a group's label
  with its boxes. The step waits for a layout still animating before it orders.
- 2026-09-16 (agent): the icon is one pill with two halves, ↑ and ↓, as browser
  find has — the maintainer named backward stepping and a single glyph cannot
  carry both. A click on it keeps the focus in the search box, so the arrow keys
  keep working after it; it is hidden until there is a query, like the counter.
- 2026-09-16 (agent): a step never unfolds. `research()` has already unfolded
  the way to every match, and a match behind a question the reader closed since
  is `.folded` and so not in the set; the counter's `n` counts that visible set.
  The `unfoldTo` the package allows for therefore has nothing to do and is not
  called — the reader reopens the question or retypes. Stepping onto a patient
  group selects its concept without toggling the group, since a step must not
  fold what the reader opened; a chapter node (no entity behind it) is fitted
  and marked, its sheet stays the view's. On a phone a step scrolls to the
  sheet as a tap does, so the counter is seen again on scrolling back up.

## Open questions

- Exact counter wording once a position is added to "n matches in m sections"
  (e.g. "match 3 of 12 · 12 matches in 4 sections" vs. replacing the phrase
  while stepping). Left to the worker's judgement within the constraint above;
  flag for the maintainer only if legibility on a phone forces a real tradeoff.

## Verification

1. `uv run tools/validate.py` passes (no data change).
2. `uv run tools/build.py` succeeds.
3. In a browser: a query with matches across at least two sections. Stepping
   forward and backward (icon and arrow keys) visits every match in order,
   wraps at both ends, opens each match's detail sheet, keeps the rest of the
   page's fading unchanged, and the counter reflects the current position.
   Screenshot captures on desktop and phone.
