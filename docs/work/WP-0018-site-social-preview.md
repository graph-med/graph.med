---
id: WP-0018
title: Social preview card (Open Graph / Twitter Card) using the mark
status: migrated
created: 2026-09-16
updated: 2026-09-19
card: 97
depends_on: [WP-0017]
blocks: []
owner: unassigned
initiative: ui
kind: build
slug: site-social-preview
---

## Outcome
A link to any graph.med page — the index, a view, an entity — unfurls with a
card (a preview image, the page title, a short description) when shared on
a platform that reads Open Graph or Twitter Card tags, instead of showing a
bare URL.

## Scope
In: `<meta property="og:...">` and `<meta name="twitter:...">` tags in
`tools/site/templates/base.html` (or per-template overrides where the
title/description block already varies — `view.html`, `entity.html`,
`index.html`), and the preview image itself: a raster PNG derived from
`tools/site/static/logo.svg` at a size social platforms accept
(most read a square icon; a 1200×630 canvas is the safer default if the
mark alone reads as too small a card). Generating that PNG is part of this
package's own work, not a prerequisite — `tools/build.py` runs offline, so
either a static PNG is committed like `logo.svg` or the build script
renders one; decide which when this is claimed, and record it under
Decisions.

Out: per-entity preview images (one static image for the whole site is the
outcome above); anything that needs a live renderer or an external service;
changing what `<title>` or the page's existing description already say.

## Constraints
- `ui` initiative scope: `tools/build.py` and `tools/site/` only, no data or
  schema change (`docs/work/initiatives/ui.md`).
- `tools/build.py` stays offline and deterministic (`CLAUDE.md`, "Build") —
  no network call to render the PNG at build time.
- Checked with the `screenshot` skill where it bears (the card image itself
  is outside what the skill renders — a browser page, not a share-card
  preview — so checking it means opening the built `<meta>` tags against a
  platform's own card-preview tool, or reasoning about the tags directly);
  the pull request links the preview
  (`docs/work/README.md`, `AGENTS.md`).

## Decisions
None yet.

## Open questions
None yet.

## Verification
- `uv run tools/build.py`, inspect the emitted `<head>` for `og:image`,
  `og:title`, `og:description`, `twitter:card` and their values resolving
  to real, reachable URLs under the built site.
- `uv run tools/validate.py` passes.

## Notes
Registered alongside WP-0017 rather than requested separately — the
maintainer asked for "a new work package" without naming one; this is this
session's inference of a natural next step (the site has no social preview
today), offered for the maintainer to accept, redirect, or withdraw.
