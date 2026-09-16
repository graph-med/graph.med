---
id: WP-0020
title: Search steps from match to match, not only highlights
status: claimed
created: 2026-09-16
updated: 2026-09-16
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
