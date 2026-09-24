---
name: page-chrome-in-the-view-layer
description: Only what the viewer reads is German; the backend stays English. The page chrome's words (the legend, the sheet's hint) live in a per-language table under tools/site/words/, never in tools/build.py, and are not published; the legend is open on a wide screen, collapsed on a phone, nothing remembered.
metadata:
  type: project
---

The page's own chrome is German now, and its words live in the **view layer**:
one table per language under `tools/site/words/` (`de.json`), a sibling of
`templates/` and `static/`, read by `tools/build.py` and never copied into
`site/assets/`. The build, the schema, the data and every identifier, key,
function name and code comment behind the page stay English; the build decides
*which* keys a page shows (for the legend: `legend_of`, from the view) and the
table says them. The legend is the first chrome to follow this rule, with the
sheet's one hint. The maintainer decided it on 2026-09-21 (card #155) and
settled the legend's default on 2026-09-24: **open on a wide screen, collapsed
on a phone, at every load; nothing is remembered** — the site keeps no client
state.

**Why:** A German and an English site come in a later phase. With the words in
a table beside the templates, that switch is a second file, not a second
template and not an edit to the build. An earlier draft of #155 put the words
in `tools/build.py` beside `WORDS` and `CARD_WORDS`; the maintainer corrected
it: only the viewer is German. `WORDS` and `CARD_WORDS` are not a precedent
either way — they are chrome in the *guideline's* source language, chosen by
the data and failing the build when a language is missing; page chrome is
chosen by the reader. Remembering the legend's state would have given the site
its first client state (`localStorage`) for a small convenience.

**How to apply:** A word the viewer reads outside the graph and the card goes
into `tools/site/words/<lang>.json`, keyed structurally in English; no German
string enters `tools/build.py`, the schema or `data/`. Keep `static/` the only
directory copied into `assets/`. Do not move `WORDS` or `CARD_WORDS` on the
strength of this. What a missing page language does (fail or fall back) and
whether the sheet's hint belongs to page or source chrome are open
(`docs/open-questions.md`). Related: [[direction-legend]],
[[generic-over-guidelines]] — which keys a legend shows is computed from the
pool, never declared.
