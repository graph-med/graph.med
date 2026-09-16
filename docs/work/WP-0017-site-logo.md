---
id: WP-0017
title: Site logo — favicon and header mark
status: claimed
created: 2026-09-16
updated: 2026-09-16
depends_on: []
blocks: []
owner: agent
initiative: ui
kind: build
slug: site-logo
---

## Outcome
Every page declares a favicon using the graph.med mark, and the header
(`.brand` in `tools/site/templates/base.html`) shows the mark, legible in both
themes and at favicon size, without changing what the header link does or
where it points.

## Scope
In: `tools/site/templates/base.html` (a `<link rel="icon">` in `<head>`, the
mark in `.brand`), `tools/site/static/site.css` (sizing and placement only),
the asset itself — already committed at `tools/site/static/logo.svg`, a
square mark (black rounded square, white stroke) supplied by the maintainer,
copied verbatim into `site/assets/` by the existing `static` → `assets`
copytree in `tools/build.py` — no build script change needed for that copy.
Any raster fallback (`apple-touch-icon`, a sized PNG) the mark turns out to
need.

Out: any other change to the header, the nav, or `site.css` beyond fitting
the mark in; no redesign of `.brand`'s text or link target; no change to
`tools/build.py` beyond what the existing copytree already covers; no
"brand" or design-system documentation — this is one asset, wired in.

## Constraints
- `ui` initiative scope: `tools/build.py` and `tools/site/` only, no data or
  schema change (`docs/work/initiatives/ui.md`).
- Checked on desktop and phone width, light and dark, with the `screenshot`
  skill (`--dark` for the dark theme); the pull request links the preview
  (`docs/work/README.md`, `AGENTS.md`).
- The mark must read correctly at favicon size (16–32px) as well as at
  header height — verify both, not just the header.

## Decisions
- The mark itself (`tools/site/static/logo.svg`, 100×100 viewBox, black
  rounded-square background, white stroke) is supplied by the maintainer and
  already committed with this package; the package's job is wiring it in
  (favicon link, header placement, sizing), not designing it.
- The SVG's original file carried an embedded C2PA content-credentials
  manifest (provenance metadata added by the tool that produced it); it was
  stripped before committing as out of place for a site asset in this
  repository — see the registration pull request for the reasoning.

## Open questions
None yet. If the mark turns out illegible at favicon size or against the
dark theme's background, that is a question for `docs/open-questions.md`,
not a redesign to make unilaterally.

## Verification
- `uv run tools/build.py`, open `site/index.html`, confirm the favicon and
  header mark render.
- `uv run tools/screenshot.py <view-id>` and `--dark`, desktop and
  `--size 390x2700` phone width; 0 overlaps, mark legible in both themes.
- `uv run tools/validate.py` still passes (no data touched, but it also runs
  `scripts/check-work.py`).
