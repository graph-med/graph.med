---
id: WP-0025
title: Zone 4 — evidence certainty per outcome, shown without composing a value
status: open
created: 2026-09-17
updated: 2026-09-17
depends_on: [WP-0023, WP-0024]
blocks: []
owner: unassigned
initiative: evidence
kind: build
slug: site-evidence-zone
---

## Outcome

Zone 4 of the statement card reads `claim.evidence` (WP-0023) and answers how
certain the evidence is, separately from how binding the recommendation is,
which zone 2 carries. Four states, and no fifth:

| State | What it renders |
|---|---|
| One value | one line, no disclosure: `Evidenz: moderat (GRADE)` |
| Per outcome | a `<summary>` line: `Evidenz: endpunktabhängig (4 Endpunkte, hoch bis sehr niedrig)`, and open below it a table `Endpunkt \| Sicherheit` |
| Expert consensus only | one line, no disclosure: `Expertenkonsens, keine Evidenzbewertung` |
| Evidence-based, nothing recorded | one line: `Evidenz: nicht erfasst` |

Six rules decide the hard cases:

1. **`endpunktabhängig` comes first, the range follows in brackets.** Not a
   matter of style. Put the range first — "hoch bis sehr niedrig" — and it reads
   as a value the guideline stated. Put `endpunktabhängig` first and the
   sentence's first word denies that a single value exists, which makes the
   range readable as what it is: a description of a set.
2. **No sorting.** The table's rows stand in the guideline's order. Sorting by
   certainty invents a ranking the guideline did not make, and by construction
   puts the worst value at one end.
3. **A range only on a known scale.** The range presupposes an order over the
   values, which `EVIDENCE_SCALES` holds per system. A system that is not in
   the table gets no range and the line reads `Evidenz: endpunktabhängig (4
   Endpunkte)`. No order is guessed.
4. **Mixed.** Where some outcomes carry a value and others do not, those rows
   read `nicht erfasst` and the summary counts only what is recorded:
   `Evidenz: endpunktabhängig (3 von 5 Endpunkten erfasst)`.
5. **No certainty in the judgement.** Zone 2 takes no evidence value. A
   per-outcome table cannot be squeezed into one line without forming a value
   the guideline never stated; the only honest hint at the top would be a
   counting one, and none is added here.
6. **Native `<details>`/`<summary>`, no JavaScript** — it survives printing,
   works without the script bundle, and gives A11 its disclosure semantics for
   free. The evidence system is named once in the zone, never per row.

`EVIDENCE_SCALES` lands in `tools/build.py` beside `GRADES`, mapping a system to
its values from high to low, and is used for the range and nothing else:

```python
EVIDENCE_SCALES = {"grade": ("hoch", "moderat", "niedrig", "sehr niedrig")}
```

An unknown system is a valid state that costs the range; it never fails the
build. A missing language does (WP-0024) — the difference is deliberate.

## Scope

In: `tools/build.py` — `evidence_of(statement)` returning the state
(`single`, `by_outcome`, `ek_only`, `missing`), the rows in guideline order,
the recorded and total outcome counts, the system, and the range where
`EVIDENCE_SCALES` knows the system; `EVIDENCE_SCALES` itself; the `evidenz` key
of `card`; the zone-4 keys of the words table (`evidence.single`,
`evidence.by_outcome`, `evidence.by_outcome.no_range`,
`evidence.by_outcome.partial`, `evidence.ek_only`, `evidence.missing`,
`evidence.table.outcome`, `evidence.table.certainty`, `evidence.row.missing`,
with the values below). `tools/site/templates/details.html` — zone 4's four
states. `tools/site/static/site.css` — `<details>`/`<summary>` and the outcome
table.

```
evidence.single              Evidenz: {wert} ({system})
evidence.by_outcome          Evidenz: endpunktabhängig ({n} Endpunkte, {von} bis {bis})
evidence.by_outcome.no_range Evidenz: endpunktabhängig ({n} Endpunkte)
evidence.by_outcome.partial  Evidenz: endpunktabhängig ({k} von {n} Endpunkten erfasst)
evidence.ek_only             Expertenkonsens, keine Evidenzbewertung
evidence.missing             Evidenz: nicht erfasst
evidence.table.outcome       Endpunkt
evidence.table.certainty     Sicherheit
evidence.row.missing         nicht erfasst
```

Out: filling `claim.evidence` with data — no claim carries a rating until the
extraction pass runs (WP-0023, Notes), so on the pool as it stands every
statement still renders `Evidenz: nicht erfasst`; this package is verified on
fixtures. The `outcome` slot's row in zone 5, already removed by WP-0024. Any
schema change. An effective certainty for a statement: none is formed, here or
anywhere.

## Constraints

- **Nothing composed** (`docs/publication.md` §3): no average, no worst case, no
  single certainty derived from several. The range is a description of the set
  and is rendered only where an order is known.
- **No system is wired in** (memory `generic-over-guidelines`): `EVIDENCE_SCALES`
  is keyed by system, not by guideline, holds display order only, and is never
  read for a comparison, a threshold or a derived value. `value` is printed as
  the system wrote it; nothing is translated between systems. The precedent is
  `GRADES` in `tools/build.py`, already a scale constant beside the words.
- Zone 4 keeps its fixed place whatever it contains (A1) and shows an honest
  empty state (A4); the strings above, no others (A6).
- Works without JavaScript and in print (rule 6).
- `docs/publication.md` §3's zone table, written by WP-0024, gains zone 4's four
  states.
- Checked in a browser, desktop and phone, light and dark, with the `screenshot`
  skill; the pull request links the preview.

## Decisions

- 2026-09-17 (maintainer, registration): the four states, the six rules and the
  strings above; `endpunktabhängig` first in the summary line; no sorting; no
  certainty in zone 2.
- 2026-09-17: `EVIDENCE_SCALES` in `tools/build.py` rather than in the schema or
  the pool. It is a display order, not a fact about the world, and the build
  already holds one such scale (`GRADES`, the guideline's own A/B/0/EK, used for
  ordering only). Putting it in the schema would make an ordering assertion the
  schema has no business making.
- 2026-09-17: `ek_only` is decided from the claims, not from `evidence` — a
  statement all of whose supporting claims are `grade: EK` and none of which
  carries an `evidence` entry. An `EK` claim that *does* carry one is rendered
  by whichever of the other states fits; the guideline is then saying more than
  "expert consensus" and the card must not hide it.

## Open questions

- A statement supported by several claims whose `evidence` entries name
  *different systems* has no defined rendering. The pool cannot produce one
  today (one source, one system). The implementing session renders one group
  per system, each naming its own system, rather than merging them or picking
  one — and if that reads badly on the first real case, it is a maintainer
  decision, entered here.

## Verification

1. `uv run tools/validate.py` and `uv run tools/build.py` pass.
2. Fixture per state — a claim with one entry without `outcome`; one with four
   entries across four outcomes; an `EK`-graded claim with no entry; a claim
   with no entry at all — each rendering its state. Fixtures are checked, not
   committed.
3. One value: no disclosure control at all.
4. Per outcome: the summary line begins with `Evidenz: endpunktabhängig`, and
   the open table lists the rows in the order of the data, not sorted by
   certainty.
5. A fixture with `system: oxford_loe`, absent from `EVIDENCE_SCALES`: the range
   is gone, the line reads `… (4 Endpunkte)`, the build succeeds.
6. A fixture where two of five outcomes have no value: those rows read `nicht
   erfasst` and the summary reads `(3 von 5 Endpunkten erfasst)`.
7. A statement with no evidence recorded reads `Evidenz: nicht erfasst` and
   says nothing about what the guideline does or does not state.
8. Zone 2 shows no evidence value in any of the four states.
9. JavaScript off: the zone renders and the disclosure still opens. The print
   stylesheet shows the table.
10. Browser, desktop and phone, light and dark (`screenshot` skill); the pull
    request links the preview.
