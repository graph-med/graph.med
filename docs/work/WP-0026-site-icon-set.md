---
id: WP-0026
title: Site icon set (updated mark as favicon, touch icon and home-screen icons)
status: open
created: 2026-09-18
updated: 2026-09-18
depends_on: []
blocks: []
owner: unassigned
initiative: ui
kind: build
slug: site-icon-set
---

## Outcome
The updated graph.med mark (three branches instead of two) is the one mark the
site shows everywhere a platform asks for an icon:

- **Favicon.** Browser tab, bookmarks and address bar show the new mark, from an
  SVG where the browser supports it and from `favicon.ico` where it does not.
  `https://graph.med/favicon.ico` exists too, for clients that ask the domain
  root instead of reading `<link>` (a JSON file opened in the browser, feed
  readers, some crawlers).
- **Apple touch icon.** "Add to Home Screen" on iOS and iPadOS produces the new
  mark, not a screenshot of the page.
- **Web app manifest icon.** "Add to Home screen" in Chrome on Android takes
  the new mark from `site.webmanifest`. The site stays a website: the manifest
  does not make it installable.
- **Maskable icon.** Wherever an Android launcher crops the icon to its own
  shape (circle, squircle, teardrop), the full glyph stays visible with no part
  cut off and no transparent wedge in the corners.

The header mark (`.brand`) shows the new mark too, since it reads the same file.

## Scope
In:
- `tools/site/static/logo.svg`: replaced by the new mark (same file name, so the
  header `<img>` and the existing `<link rel="icon">` follow without a template
  change). The replacement is committed with this registration, as in WP-0017;
  what remains for the package is everything around it.
- `tools/build.py`: after the existing `static` → `assets` copytree, and only
  when the base is `/`, `favicon.ico` is also copied to the output root. That is
  the build `.github/workflows/pages.yml` runs for the domain
  (`tools/build.py --cname graph.med`), and the composing job serves its output
  at the domain root.
- New committed rasters in `tools/site/static/`, copied to `site/assets/` by the
  existing `static` → `assets` copytree in `tools/build.py`:

  | File | Size | Geometry | Used by |
  |---|---|---|---|
  | `favicon.ico` | 16, 32, 48 px in one file | tile | browsers without SVG favicon support |
  | `apple-touch-icon.png` | 180 × 180 | full-bleed, opaque | iOS and iPadOS home screen |
  | `icon-192.png` | 192 × 192 | tile | manifest, `purpose: any` |
  | `icon-512.png` | 512 × 512 | tile | manifest, `purpose: any`, install dialog |
  | `icon-maskable-512.png` | 512 × 512 | full-bleed, opaque | manifest, `purpose: maskable` |

  "Tile" is `logo.svg` as it is (black rounded square, transparent outside the
  corners). "Full-bleed" is the same geometry with the corner radius set to 0,
  so the black fills the whole square.
- New `tools/site/static/site.webmanifest`:

  ```json
  {
    "name": "graph.med",
    "short_name": "graph.med",
    "start_url": "../",
    "scope": "../",
    "display": "browser",
    "background_color": "#000000",
    "icons": [
      { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
      { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
      { "src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }
  ```

- `tools/site/templates/base.html`, `<head>` only. The existing SVG icon link
  stays and gains `?v={{ commit }}`, three links are added. The icon block then
  reads:

  ```html
  <link rel="icon" href="{{ base }}assets/favicon.ico?v={{ commit }}" sizes="32x32">
  <link rel="icon" type="image/svg+xml" href="{{ base }}assets/logo.svg?v={{ commit }}">
  <link rel="apple-touch-icon" href="{{ base }}assets/apple-touch-icon.png?v={{ commit }}">
  <link rel="manifest" href="{{ base }}assets/site.webmanifest">
  ```

Out:
- Installability: no `standalone` or `minimal-ui`, no service worker, no
  offline support, no install prompt.
- A root `favicon.ico` for the other bases. Under `/preview/pr<N>/` the domain
  root belongs to `main`, under `/graph.med/` the root of
  `graph-med.github.io` is not the site's.
- Root copies of the other icons (`/apple-touch-icon.png` and the like). Every
  HTML page declares them through `<link>`.
- `<meta name="theme-color">` or any other tint of browser chrome.
- A dark-theme or monochrome variant of the mark (the faint tile edge on the dark
  theme noted in WP-0017 stays as it is).
- Any change to `.brand` beyond the file it already reads, and any change to
  `site.css`.
- The social preview image (`og:image`), which is WP-0018.
- A raster renderer in `tools/build.py` or a new entry in `pyproject.toml`.

## Constraints
- `ui` initiative scope: `tools/build.py` and `tools/site/` only, no data or schema
  change (`docs/work/initiatives/ui.md`). This package touches `tools/site/`
  and one copy step in `tools/build.py`. The workflow files stay untouched
  (human-only, `.claude/rules/environment/git-identity.md`).
- `tools/build.py` stays offline and deterministic (`CLAUDE.md`, "Build"). The
  rasters are therefore committed files, not build output.
- Every icon URL must resolve under each base the build supports: `/`,
  `/graph.med/` and `/preview/pr<N>/` (`tools/build.py` docstring). The static
  manifest cannot be templated, so every path inside it is relative to the
  manifest's own URL.
- The glyph geometry of `logo.svg` is the maintainer's and is taken over
  verbatim. The package wires the mark in, it does not redraw it (as in
  WP-0017).
- Checked on desktop and phone width, light and dark, with the `screenshot`
  skill. The pull request links the preview (`docs/work/README.md`, `AGENTS.md`).
- No personal names (`.claude/rules/conventions/no-personal-information.md`).

## Decisions
- **What changes in the mark.** Against the current `logo.svg`: a third,
  horizontal branch ends in a third dot at (76.4, 50), the two diagonal branches
  now end at (73, 37) and (73, 63) instead of (74, 40) and (74, 60), all three
  dots have radius 4.4 instead of 5.2, and the stem ends at x = 60 instead of 61.
  Background tile, arc and stroke widths are unchanged. As with WP-0017, the
  embedded C2PA manifest in the supplied file is stripped before committing, so
  the committed `logo.svg` carries only the drawing.
- **Rasters are committed, not rendered at build time.** Rendering needs a
  library (`cairosvg` or similar) that `pyproject.toml` does not carry, and the
  build must stay offline. Five small PNG/ICO files that change only when the
  mark changes are cheaper than a new dependency. How they were produced goes
  in the pull request description.
- **Two geometries, not one.** iOS and Android launchers apply their own corner
  mask. The rounded tile would be masked a second time and, for maskable icons,
  show transparent corners inside the launcher shape. So touch icon and
  maskable icon use the full-bleed square, the favicon and the `any` icons keep
  the tile the header already shows.
- **The maskable icon needs no rescaling.** Measured on a 1000 px full-bleed
  render: the glyph (stroke and dots included) reaches at most 30.8 % of the
  edge length from the centre. The maskable safe zone is a centred circle of
  radius 40 % (W3C Web App Manifest, `purpose: maskable`). The glyph fits with
  margin at its original size, so maskable and touch icon show the mark at the
  same scale as everywhere else.
- **SVG first, ICO as fallback.** `sizes="32x32"` on the ICO link keeps Chromium
  and Firefox on the SVG. Browsers without SVG favicon support take the ICO.
- **`?v={{ commit }}` on the icon links,** as `site.css` already has. Browsers
  cache favicons and touch icons aggressively, and a mark that changes under the
  same file name would otherwise keep showing the old one. The manifest's own
  icon URLs carry no version, since the manifest is static.
- **`display: "browser"`: no installation.** The site does not need to be
  installable at this point. `browser` keeps every page a normal browser tab
  with its address bar, and the page URL is the citable thing on this site
  (`docs/publication.md`, §2). The manifest exists only to give the home-screen
  shortcut its icons. Whether Chrome uses the maskable or the `any` icon for a
  shortcut of a non-installable site is the browser's choice. Both show the
  same mark, and the maskable one costs one file.
- **Root `favicon.ico` only for base `/`.** The domain root is served from the
  `main` build alone (`docs/publication.md`, §6, "Previews"). A copy in any
  other build would land under `preview/pr<N>/` or `/graph.med/`, where no
  client looks for it. The root file is the same bytes as
  `assets/favicon.ico`, not a second asset to maintain.
- **Relative `start_url` and `scope` (`"../"`).** Resolved against
  `<base>assets/site.webmanifest` they yield `<base>`, so one static file is
  correct for the domain, the `/graph.med/` build and every preview.

## Open questions
None. If the mark turns out illegible at favicon size, that goes to
`docs/open-questions.md`, not into a redesign (as in WP-0017).

## Verification
- `uv run tools/validate.py` passes (`scripts/check-work.py` included).
- `uv run tools/build.py` and `uv run tools/build.py --base /preview/pr12/
  --preview 12` both emit `site/assets/` with `logo.svg`, `favicon.ico`,
  `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png` and `site.webmanifest`, and every page's `<head>`
  carries the four icon and manifest links with the correct base.
- `uv run tools/build.py --cname graph.med` emits `site/favicon.ico`,
  byte-identical to `site/assets/favicon.ico`. The preview build above emits no
  `favicon.ico` outside `assets/`.
- `site.webmanifest` parses as JSON. Resolving `start_url`, `scope` and each
  `icons[].src` against the manifest URL gives the base and existing files, for
  both builds above.
- Rasters, checked with Pillow: exact pixel sizes as in the Scope table,
  `favicon.ico` contains 16, 32 and 48 px, `apple-touch-icon.png` and
  `icon-maskable-512.png` are fully opaque (no alpha below 255),
  `icon-maskable-512.png` has no glyph pixel outside the centred circle of
  radius 204.8 px.
- `logo.svg` contains no `<metadata>` element and matches the geometry in
  Decisions.
- Chrome DevTools, Application → Manifest: no errors on icons, all three icons
  shown, maskable preview with the minimum safe area shows the whole glyph.
  Installability warnings are expected and correct, since the site is not meant
  to be installable.
- `screenshot` skill, desktop and phone, light and dark: header mark at 24 px
  shows three separate branches. Tab favicon at 16 px is an identifiable dark
  tile with a light glyph. At 16 px the three branches merge into one shape
  (checked on a render), which is the same standard WP-0017 accepted.
- After deploy: `https://graph.med/favicon.ico` returns the icon (HTTP 200).
- **Needs a person on real devices:** iOS Safari "Add to Home Screen" and
  Chrome on Android "Add to Home screen" both show the new mark, not a
  screenshot of the page.

## Notes
- WP-0018 (social preview) is independent. If it renders its image from
  `logo.svg`, it picks up the new mark by itself. If it committed a PNG before
  this package merges, that PNG is re-rendered from the new mark in whichever
  package merges second.
