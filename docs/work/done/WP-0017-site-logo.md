---
id: WP-0017
title: Site logo — favicon and header mark
status: done
created: 2026-09-16
updated: 2026-09-16
depends_on: []
blocks: [WP-0018]
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
- `uv run tools/validate.py` passes (323 entities, 146 edges, schema 0.5.0;
  `scripts/check-work.py` included).
- `uv run tools/build.py` emits `site/assets/logo.svg` and both wired
  references (`<link rel="icon">` in `<head>`, the mark in `.brand`).
- The `screenshot` skill could not run in this session: `docker info` fails
  (`failed to connect to the docker API at unix:///var/run/docker.sock`), and
  `sudo service docker start` fails on a `ulimit` permission the sandbox does
  not grant here — this session is not the `sbx` environment the skill
  assumes. Not worked around; reported instead
  (`.claude/rules/environment/sandbox-environment.md`).
- In place of the skill: rasterised `logo.svg` at 16/24/32/48/96px on both
  `--bg` values (`#fff`, `#111`) with `cairosvg`. Legible from 24px up in
  both themes; at 16px (the smallest a browser tab actually renders) the
  mark is still an identifiable dark rounded tile with a light glyph, not
  mush. On the dark theme the mark's own black tile sits close in value to
  `--bg: #111`, so the tile's edge is faint — the glyph itself stays
  legible, but this is the one thing worth a human's eye on the live
  preview before calling it settled.
- The graph itself is untouched by this package, so the overlap check the
  skill would otherwise run (`--do all --do fit`) does not apply here.
- **Still needed before this can be called fully verified**: someone opens
  the preview in an actual browser, desktop and phone, light and dark, and
  confirms the header mark and the tab favicon read as intended — the one
  check this session could not perform itself.
