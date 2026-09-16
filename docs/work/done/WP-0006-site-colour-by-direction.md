---
id: WP-0006
title: Boxes coloured by direction, grade as a letter
status: done
created: 2026-09-12
updated: 2026-09-16
depends_on: [WP-0005]
blocks: []
owner: agent
initiative: ui
kind: build
slug: site-colour-by-direction
---

## Outcome

A box takes the four direction colours (the banner's), the grade is written in
the box after the glyph (A · B · 0 · EK), an EK box is coloured by its direction
like every other recommendation and carries "EK" as its grade text, and the
legend explains colours as directions and letters as grades — as
`docs/publication.md` §3 and the memory `box-colour-by-direction` say.

## Scope

In: `tools/site/static/site.css`, `tools/site/static/graph.js`, the legend in
`tools/site/templates/view.html`. The spec and the memories already say what is
built; amend them only where the build teaches otherwise.
Out: the direction derivation itself (memory `direction-legend`).

## Constraints

- Colours light enough for dark text in both themes (see the variables in
  `site.css`); the banner's *gegen* today uses white on red, so the box colour for
  *gegen* needs a lighter tint of the same hue, and the banner may follow it.
- Für and gegen are not a traffic light: reuse the banner's hues, and keep the
  glyph as the redundant cue for readers who do not see the colour.

## Open questions

None.

## Decisions

- 2026-09-13 — box-colour settled by the maintainer: colour by direction, the
  grade as a letter (memory `box-colour-by-direction`).
- 2026-09-13 — A box reads "✓ A · <short label>": the glyph, the grade as a
  letter, a middle dot, the short form; without a grade the dot goes too, and
  claims that differ in grade show every letter ("A/B") — shown, never
  composed. The label is composed in `tools/build.py`, where the glyph was
  already put into it; that is the one change outside the Scope's three files.
- 2026-09-13 — The four direction colours are four variables in `site.css`
  (`--dir-for`, `--dir-against`, `--dir-weigh`, `--dir-gap`), read by the box
  and the banner alike. Gegen is a tint of the contested red (`#e9a9ad` light,
  `#dd8d92` dark), so the banner now has dark text like the other three; Lücke
  is a light grey distinct from `--line`; the preview strip got its own
  `--note` instead of the former grade yellow.
- 2026-09-13 — The solid red border of an `against` box, and its legend entry,
  were dropped: colour and glyph carry gegen now, and the border would have
  marked the two "kann … verzichtet werden" boxes (abwägen, eher gegen) in the
  gegen red; their lean stays in the banner, as the spec says. The `against`
  field stays in the view JSON.
- 2026-09-13 — A statement without a direction (a fact; two in the pool) is an
  uncoloured box in the page's text colour with a border — before, its fixed
  dark text vanished on the dark background.
- 2026-09-13 — `tools/screenshot.py --dark` renders the dark theme; a flag, not
  an action, because the graph reads the stylesheet's colours once when drawn,
  so the theme must be emulated before the page loads.

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

## Verification

Browser captures of a family open, desktop and phone, light and dark, in the pull
request; the legend readable on a phone. Build succeeds.
