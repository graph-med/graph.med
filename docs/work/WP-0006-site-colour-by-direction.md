---
id: WP-0006
title: Boxes coloured by direction, grade as a letter
status: open
created: 2026-09-12
updated: 2026-09-13
depends_on: [WP-0005]
blocks: []
owner: unassigned
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

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

## Verification

Browser captures of a family open, desktop and phone, light and dark, in the pull
request; the legend readable on a phone. Build succeeds.
