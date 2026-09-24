# data/ — the pool

The entities and edges of the knowledge pool, laid out by namespace
(`docs/graph-representation.md` §2; syntax authority: `schema/schema.yaml`):

```
data/
├── sources/<source-id>.yaml one entity per source document
├── claims/<source-id>/<package>.yaml  the claims extracted by one card (work package)
├── concepts/<id>.yaml       one entity per file
├── statements/<id>.yaml     one entity per file
├── pathways/                structural nodes, when pathways are authored
├── edges/<source-id>/<package>.yaml   edges minted while doing that package
├── views/<id>.yaml          view definitions and their cuts — each one a page on the site
└── axes/<id>.yaml           grouping axes (spec §4.1): proposed as data with their placements, tested, asserted, offered by a view
```

Claims and the edges minted alongside them are grouped per card (work package) for diff
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

The parts that extract `sepsis-lf-4.0` are one per chapter cluster too, chapter 3
cut at its section boundary 3.3 | 3.4. Each writes its claims and the edges minted
with them, its `defined_by` edges included, under the same file name in
`claims/sepsis-lf-4.0/` and `edges/sepsis-lf-4.0/`:

| file | chapters | physical pages |
|---|---|---|
| `ch02` | 2 | 21–36 |
| `ch03a` | 3.1–3.3 (Tabelle 2 stays on the page: spec §5.1 G2) | 37–51, to the heading of 3.4 (line 21 of p. 51) |
| `ch03b` | 3.4–3.5 | 51 from the heading of 3.4, to 56 |
| `ch04` | 4 | 57–72 |
| `ch05` | 5 | 73–87 |
| `ch06` | 6 | 88–102 |
| `ch07` | 7 | 103–104 |
| `ch08` | 8 | 105–126 |
| `ch09` | 9 | 127–134 |
| `ch10` | 10 | 135–138 |

The linking passes over the whole source write only edges, each in a file of its
own under `edges/sepsis-lf-4.0/`: `cross-chapter` (the edges between statements or
concepts of two chapters, and the families across chapters), `scope-edges` (the
view's scope tree) and `broader-edges` (`broader` between the concepts that fill a
population or condition slot).

Rules that bind everything here:

- **Source language, tagged.** All content stays in the source language with a
  `lang` tag; nothing is translated at extraction (spec §2, "Language").
- **Verbatim quotes, physical pages.** Every quote is a verbatim substring of
  the source's extracted text; `#page=N` counts physical PDF pages (spec §6.2).
- **Only current sources.** An expired guideline (AWMF: renamed with an
  `-abgelaufen` suffix, banner "wird aktuell überarbeitet") is not parsed — its
  successor will be, when published.
- **One card per worker**, then a handover: a pull request that says
  `Closes #<card>`, and a handover comment on the card. The
  `process-work-package` skill runs this for the cards it is given; a card is
  an extraction, a linking pass, a schema change, a build feature, a docs
  change or tooling, registered on the board with its instruction
  (`AGENTS.md`; ADR-0004).
- **Document structure is provenance.** A claim's `section` and a source's
  `outline` say where in the document something was found; nothing in
  `concepts/` or `statements/` carries a chapter (spec §6.7).
- **No axis is built in, and an axis is an overlay.** By what a view groups its
  answers — the tree of patient groups it opens with included — is an axis a person
  proposes as an entity under `axes/`, its placements in the same file: a hierarchy
  (for each concept of one statement slot, the parent it hangs by, which once the
  axis is asserted must be a `broader` or `in_scope_of` edge under `edges/`) or a
  dimension (a value for each statement, its values concepts of facet
  `qualifier`; the statement itself holds no such slot). `uv run tools/axes.py
  <axis> <view>` prints its feasibility report and writes nothing; what a person
  accepts is asserted by a linking pass, the placements kept, and only then may the
  view name it in `group_by`, the tree of patient groups first (spec §4.1).
