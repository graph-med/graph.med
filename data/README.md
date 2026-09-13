# data/ — the pool

The entities and edges of the knowledge pool, laid out by namespace
(`docs/graph-representation.md` §2; syntax authority: `schema/schema.yaml`):

```
data/
├── sources/<source-id>.yaml one entity per source document
├── claims/<source-id>/<package>.yaml  the claims extracted by one work package
├── concepts/<id>.yaml       one entity per file
├── statements/<id>.yaml     one entity per file
├── pathways/                structural nodes, when pathways are authored
├── edges/<source-id>/<package>.yaml   edges minted while doing that package
└── views/<id>.yaml          view definitions and their cuts — each one a page on the site
```

Claims and the edges minted alongside them are grouped per work package for diff
ergonomics; semantic entities are one per file because they accumulate history
independently. Identity is the URL, never the file (spec §2). The packages that
extracted `pomgat-lv-1.0` were one per chapter cluster, so its files are:

| file | chapters | physical pages |
|---|---|---|
| `ch04` | 4.1–4.5 | 26–39 |
| `ch05` | 5.1–5.7 | 40–57 |
| `ch06` | 6.1–6.2 | 58–74 |
| `ch07a` | 7.1–7.3 | 75–90 |
| `ch07b` | 7.4.1 | 91–102 |
| `ch07c` | 7.4.2–7.7 | 103–111 |
| `ch08` | 8.1–8.2 | 112–121 |
| `ch09` | 9 | 122–124 |

Rules that bind everything here:

- **Source language, tagged.** All content stays in the source language with a
  `lang` tag; nothing is translated at extraction (spec §2, "Language").
- **Verbatim quotes, physical pages.** Every quote is a verbatim substring of
  the source's extracted text; `#page=N` counts physical PDF pages (spec §6.2).
- **Only current sources.** An expired guideline (AWMF: renamed with an
  `-abgelaufen` suffix, banner "wird aktuell überarbeitet") is not parsed — its
  successor will be, when published.
- **One work package per worker**, then a handover: `docs/LOG.md` and
  `docs/HANDOFF.md` updated, the package at `status: review`, a pull request
  opened. The `process-work-package` skill runs this for the packages it is
  given; a package is an extraction, a linking pass, a schema change, a build
  feature, a docs change or tooling, registered with its instruction.
- **Document structure is provenance.** A claim's `section` and a source's
  `outline` say where in the document something was found; nothing in
  `concepts/` or `statements/` carries a chapter (spec §6.7).
