---
id: WP-0024
title: The statement card — nine fixed zones, headings in the source language, one card structure
status: open
created: 2026-09-17
updated: 2026-09-17
depends_on: []
blocks: [WP-0025]
owner: unassigned
initiative: ui
kind: build
slug: site-statement-card-nine-zones
---

## Outcome

The statement detail section — the sheet beside or under the graph and the
statement's entity page, both from `details.html` — is rebuilt from five
questions into nine zones in a fixed order, so that a physician reads the
judgement, then the wording, then for whom it holds, what limits it, whether
anything contradicts it, and where to look it up:

| # | Zone | Visible heading | From | Gone when |
|---|---|---|---|---|
| 1 | Title | none | `statement.short_label`, else `label` | never |
| 2 | Judgement | none | supporting claims; whether a contesting claim exists | never |
| 3 | Wording | `Wortlaut der Empfehlung` | `claim.label` per supporting claim | never |
| 4 | Evidence | `Evidenz` | *empty state only in this package* (WP-0025) | never |
| 5 | Applies to | `Gilt für` | `statement.slots`, concepts | no slot filled |
| 6 | Body text | `Aus dem Leitlinientext` | `limits`, `refines`, `supplements` | never (empty state) |
| 7 | Contradiction | `Widersprechende Empfehlung(en)` | `contests` | no contesting claim |
| 8 | Citation | `Beleg` | `claim.source`, `source.outline`, attestations | never |
| 9 | More | `Mehr zu dieser Aussage` | `specializes`, `complements`, `conflicts`, ids | all parts empty |

Zone by zone, what changes against today:

1. **Title.** `short_label` stands above the judgement and names the subject of
   the decision. It appears exactly once on the card; zone 3 does not repeat it.
2. **Judgement.** Two lines in one block with a 6 px left bar in the direction
   colour, no heading. Line 1: glyph, direction word, verb phrase, in the
   card's largest type; at its right, only when it applies, `⚠ umstritten`, an
   anchor link to zone 7. Line 2: one badge per supporting claim in claim
   order, each carrying its grade on the grade colour and its consensus as
   plain text in the same badge; identical (grade, consensus) pairs collapse to
   one badge with a count, `Grad A (2)`. **The badge order is the order of the
   entries in zone 8** — with the recommendation number no longer in the
   judgement, order is the only thing tying a badge to its citation, so it is
   guaranteed, not left to iteration order. Badges wrap; they never squeeze
   line 1. A claim with no direction (a `fact`, a `gap_notice`) draws no
   banner, but its badges still appear in line 2 without glyph or direction
   word.
3. **Wording.** The guideline's own sentences get their own surface — own
   background, full body-text size, generous padding, line height 1.6, measure
   about 70 characters, no indent, no left rule, no shrunken type. Several
   claims: one block each under a small label naming the claim's relation to
   the statement. Number, page and section are not here; they are in zone 8.
4. **Evidence.** The zone, its heading and its `Evidenz: nicht erfasst` line
   only. Every statement shows exactly that until WP-0025, which is the honest
   state: no claim carries a certainty rating yet (WP-0023, Decisions).
5. **Applies to.** The slots as readable rows: `Eingriff` (`population`),
   `Bedingung` (`condition`), `Maßnahme` (`action`). The `outcome` slot loses
   its row — an endpoint is not a condition on the patient, it is the dimension
   the certainty varies along, and it belongs to zone 4. *The slot stays in the
   schema and in the data; a row leaves a zone, a slot does not leave the
   model.* A slot is plain text when its concept carries only this one
   statement, and a link with a visible count when it carries more:
   `Maßnahme  Magensonde ziehen (6 Empfehlungen)`. The count includes the
   current statement and counts statements holding that concept in that same
   slot role. No slot filled: the zone is gone.
6. **Body text.** Three groups in order of their effect on the decision, not by
   class number: `Grenzt ein` (`limits`), `Präzisiert` (`refines`), `Ergänzt`
   (`supplements`). Per entry: the wording, the page, and section and id where
   present. The zone is named after where the passages come from, because the
   three groups do not share one promise — the old heading "What could change
   the answer?" is wrong for `Ergänzt`, which by definition does not.
7. **Contradiction.** The contesting claims move here out of the old binding
   question, one entry each: its own badge by zone 2's rules, the claim's
   wording, and its own citation with recommendation number and page. Heading
   singular or plural by count. The zone's existence drives `⚠ umstritten`.
8. **Citation.** As today: source, recommendation number, page, section, the
   two buttons, the review status. Its entry order fixes zone 2's badge order.
9. **More.** A `<details>`, closed. Related statements over `specializes`,
   `complements`, `conflicts`; the ids, the edge names, the rest of the
   modelling data. The only zone where developer vocabulary is allowed.
   `Ergänzt` does **not** move here; it stays in zone 6.

Two rules that cut across all nine:

- **Every visible word of the card comes from a per-language table and there is
  no fallback.** The panel's chrome is rendered in the view's source language,
  as the graph's questions already are; a language the table does not cover
  fails the build with the language and the missing keys named. No string on
  the card is English any more.
- **One structure, two outputs.** The build assembles `card` once per statement
  (below); the template and the statement's JSON render that one structure.

## Scope

In:

- `tools/build.py`: **first**, rename the `evidence` key returned by
  `direction_of()` to `badges` and carry every use along — it holds grade and
  consensus, which from zone 4 onwards is exactly what `evidence` must not
  mean; `direction_of()` also gains the `umstritten` flag. Then: the per-slot
  statement counts and a linked flag; the `outcome` slot no longer going to the
  applies-to zone; a `contests_of` that feeds zone 7; the body-text grouping
  fixed to `limits, refines, supplements`; the words table and its abort rule;
  `card` assembled in `details()` and added to the statement's JSON.
- `tools/site/templates/details.html`, the `statement` branch: nine `<section>`
  elements in the fixed order, each with `aria-labelledby`; zones 1 and 2 named
  by a visually hidden element, not a visible heading; every written-out
  English question gone; zone 3 as its own surface; zone 7 conditional with a
  singular/plural heading; `⚠ umstritten` as an anchor to zone 7's id. The
  hard-coded `lang="de"` on the banner becomes the entity's language.
- `tools/site/static/site.css`: the wrapping badge group in line 2 and a line 1
  that is never squeezed (only `umstritten` sits right); zone 3's surface; zone
  7; removal of what the deleted binding question styled.
- `docs/publication.md` §3: "What the section shows" rewritten from the zone
  table above; the questions kept as `card` keys, explicitly marked as a
  semantic mapping that is not rendered; the "Language" paragraph corrected —
  chrome on the statement card is the source language, not English; and one
  sentence each on the two zones removed, "Andere Situationen, andere Antwort"
  (WP-0019) and the binding question (this package), named as removed rather
  than quietly overwritten.

Out: the graph, the chapter tree, search, header and footer; the detail
sections of concepts, claims and sources; zone 4's content and `claim.evidence`
(WP-0023, WP-0025); any schema or data change; the answering language-model
layer itself — only its contract with `card` is fixed here.

## Constraints

- **Fixed order** (A1): zones 1 to 9 stand in that order whatever a statement
  contains. A zone with nothing either shows its empty state or is absent; it
  never swaps place.
- **Nothing composed** (A2, `docs/publication.md` §3 "Grades are shown, never
  composed"): several claims' grades stand beside each other, never averaged,
  never reduced to one value. The `grade-derivation` open question stays open.
- **One colour, one meaning** (A3): fill means grade, outline and glyph mean
  direction. Nothing is carried by colour alone — direction always as a word,
  grade always as text, `⚠ umstritten` always as text.
- **Honest gaps** (A4): an empty state says what is *not recorded*, never that
  the guideline says nothing. The strings below, not new ones.
- **No developer vocabulary** in zones 1 to 8 (A5): no edge names, no raw enum
  values, no ids, no hashes outside zone 9.
- **No fallback language** (A6). The graph already fails a view whose language
  the table does not cover (`WORDS` in `tools/build.py`); the card's table does
  the same and names the missing keys. The silent English fallback is what
  produced English headings on a German card, and must not return.
- **Deterministic, nothing authored** (A8): every value comes from claims,
  slots, edges and the source's outline; the build adds only the words below.
- **Transferable** (A9, memory `generic-over-guidelines`): no rule reads a
  chapter number, a section number or a guideline-specific value.
- **Mobile first** (A10): at 390 × 844 px zones 1 to 3 of a typical statement
  are visible without scrolling.
- **Accessible** (A11): every zone a `<section>` with `aria-labelledby`, glyphs
  `aria-hidden="true"`, text content carrying its `lang`.
- `ui` initiative: `tools/build.py` and `tools/site/` only, with the
  `docs/publication.md` amendment riding along as in WP-0006 and WP-0019.
- Checked in a browser, desktop and phone, light and dark, with the `screenshot`
  skill; the pull request links the preview.

## The words

The visible strings, with the keys under which the build holds them. The values
are fixed by the maintainer: the implementing session invents no further strings
and rewords none of these.

```
zone.wording        Wortlaut der Empfehlung      grade.A          Grad A
zone.evidence       Evidenz                      grade.B          Grad B
zone.applies        Gilt für                     grade.0          Grad 0
zone.body_text      Aus dem Leitlinientext       grade.EK         Expertenkonsens
zone.contested.one  Widersprechende Empfehlung   consensus.starker_konsens  starker Konsens
zone.contested.many Widersprechende Empfehlungen consensus.konsens          Konsens
zone.citation       Beleg                        consensus.mehrheitliche_zustimmung  mehrheitliche Zustimmung
zone.more           Mehr zu dieser Aussage       consensus.kein             kein Konsens
                                                 marker.contested           ⚠ umstritten
slot.population     Eingriff                     body.limits      Grenzt ein
slot.condition      Bedingung                    body.refines     Präzisiert
slot.action         Maßnahme                     body.supplements Ergänzt
slot.count          ({n} Empfehlungen)           body.empty       Für diese Aussage sind keine Textstellen
                                                                  aus dem Leitlinientext erfasst.
cite.open           In der Leitlinie öffnen      cite.no          Empf. {nr}
cite.quote          Suchtext kopieren            cite.page        S. {nr}
cite.review.pending Klinische Begutachtung: ausstehend            cite.section  Abschnitt {nr}

evidence.missing    Evidenz: nicht erfasst       (zone 4's other states: WP-0025)
```

The keys are structural and language-neutral, the values are the source
language — the convention `WORDS` already follows (`population`,
`condition`, `chapter`), and the reason `slot.population` reads `Eingriff`
rather than being keyed on the German word. `grade.*` and `consensus.*` are
keyed on the schema's own enum values so that a new value is a missing key, not
a silent blank.

## The card

The five questions stop being headings but stay the semantic mapping the
answering layer reads. They live in `tools/build.py` and in each statement's
`card` JSON:

| Key | The question it answers | Zone |
|---|---|---|
| `urteil` | Was soll ich tun, und wie verbindlich ist das? | 2 |
| `wortlaut` | Was steht genau in der Leitlinie? | 3 |
| `evidenz` | Wie gut ist das belegt? | 4 |
| `geltung` | Gilt das für meine Patientin oder meinen Patienten? | 5 |
| `leitlinientext` | Was ändert oder ergänzt der umgebende Leitlinientext? | 6 |
| `widerspruch` | Gibt es eine gegenläufige Empfehlung? | 7 |
| `beleg` | Wo steht es, und wie prüfe ich es nach? | 8 |

`evidenz` and `widerspruch` are new keys: certainty gets its own zone and its
own data shape, and a contradiction must be recognisable without searching the
body-text groups for it. The old binding key is absorbed into `urteil`.

What the answering layer owes this structure, recorded here because it
constrains what `card` must carry, not because this package builds that layer:
an answer drawn from a statement whose `widerspruch` is filled names the
contradiction — a judgement without the opposing claim is wrong, not brief; a
certainty is never named without its outcome where `evidenz` is per-outcome;
a linked slot in `geltung` means the clinical question is tiered by condition,
so the layer asks back for the missing condition instead of picking one
branch; and an empty state is passed on as "nicht erfasst", never as "the
guideline says nothing about it".

## Decisions

- 2026-09-17 (maintainer, registration): the nine zones, their order, their
  headings and the strings above; the four substantive changes against today —
  evidence gets a zone of its own, the wording becomes the main surface instead
  of a footnote to the short label, contesting claims get their own zone
  announced by a marker in the judgement, and every visible heading is German
  and phrased as a label rather than a written-out question.
- 2026-09-17 (maintainer): the summary-line word order in zone 4 and the
  `⚠ umstritten` marker are both there for the same reason — a reader who stops
  after the judgement must not leave the card with a one-sided answer. The
  marker carries that without pulling zone 7 forward.
- 2026-09-17 (checked against the repository, correcting the registration
  draft): there is no `UI_WORDS`. `tools/build.py` has `WORDS`, holding the
  graph's question labels per language with exactly the abort rule this package
  needs (`no words for language …`); the panel's headings are hard-coded
  English in `details.html` by deliberate policy — `docs/publication.md` §3
  says "Chrome (navigation words) is English". So this package does not extend
  an existing card table, it **creates one and reverses that policy** for the
  statement card, and §3's "Language" paragraph must say so. Whether the card's
  table is a second key space inside `WORDS` or a table beside it is the
  implementing session's call; the abort rule is not.
- 2026-09-17 (checked against the repository): the four direction words
  (`für`, `gegen`, `abwägen`, `Lücke`) are already German constants in the
  build (`DIRECTION_GLYPH`, the `.banner.dir-für` CSS classes, `graph.js`'s
  `DIRECTION` map) and the verbs come from `claim.verb` in the source language.
  They stay where they are — the words table covers what the panel renders in
  English today. Making the direction vocabulary per-language is a separate
  change and would touch the graph's colouring too; it is not in this package.
- 2026-09-17 (checked against the repository): the statement's JSON today is
  `{**entity, "edges": …}` — it does not carry what `details()` computes, and
  the view's JSON carries pre-rendered HTML per entity. `card` in the JSON is
  therefore an addition, not a rename of something existing.
- 2026-09-17, default to be overridden by the maintainer before implementation
  rather than re-derived: zone 5's `Eingriff` row keeps the family line the
  current panel shows under the population (`within Leberchirurgie`,
  `families_of`). The zone table names three rows and does not mention
  families; dropping a link the panel has today would be a silent loss, so it
  stays until said otherwise.

## Open questions

- Zone 8's "review status" line is registered as `Klinische Begutachtung:
  ausstehend` only. What it reads when an attestation *does* exist is not
  specified and the pool has no attestation yet; the implementing session shows
  the pending line and adds no second string. If a state beyond pending is
  wanted, it is a maintainer decision and a new entry here.
- The family line under `Eingriff` (see the last Decision) — confirm or drop.

## Verification

1. `uv run tools/validate.py` passes (no data or schema change).
2. `uv run tools/build.py` succeeds.
3. No visible string of the card is English: a grep over the built
   `site/statements/*/index.html` finds none of the five old question headings
   and no English label.
4. Removing `de` from the card's words table fails the build, naming the
   language and the missing keys; nothing falls back.
5. Zones 1 to 9 appear in that order for every statement, whatever it contains.
6. `grep -n evidence tools/build.py tools/site/templates/details.html` shows the
   key no longer carrying grade and consensus anywhere.
7. A statement with several claims: line 1 of the judgement is not squeezed,
   the badges wrap, and their order matches the order of zone 8's entries.
8. A statement with a contesting claim shows `⚠ umstritten`, and the marker
   jumps to zone 7. One without shows neither the marker nor the zone. (The
   pool has no `contests` edge yet — build one as a throwaway fixture, check it,
   and do not commit it.)
9. The short label appears exactly once, as the title. The wording is body-text
   size on its own surface, not indented and not shrunken.
10. Zone 5 has no endpoint row; `outcome` is unchanged in schema and data. A
    slot whose concept carries one statement is plain text; one with several is
    a link showing the count.
11. Browser, desktop and phone, light and dark, with the `screenshot` skill: at
    390 × 844 px zones 1 to 3 of a typical statement are visible without
    scrolling. The pull request links the preview.
12. Every zone is a `<section>` with an accessible name; glyphs are
    `aria-hidden`; direction and grade are readable as text.
13. `docs/publication.md` §3 describes the nine zones, marks the `card` keys as
    not rendered, corrects the "Language" paragraph, and names both removed
    zones as removed.
