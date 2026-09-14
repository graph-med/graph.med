---
id: WP-0013
title: Relink body-text relations, chapters 7–9
status: review
created: 2026-09-12
updated: 2026-09-14
depends_on: [WP-0012]
blocks: []
owner: agent
initiative: extraction-quality
kind: linking
slug: relink-body-text-b
---

## Outcome

Chapters 7–9 of `pomgat-lv-1.0` (claim files `ch07a`, `ch07b`, `ch07c`, `ch08`,
`ch09`) follow the body-text rule the way chapters 4–6 do after
`relink-body-text-a`; the two passes together leave one consistent reading of
body-text relations across the source.

## Scope

In: the five claim files and their edges; pages 75–124 of the source.
Out: chapters 4–6; the site.

## Constraints

As `relink-body-text-a`.

## Decisions

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- **Same mechanics as `relink-body-text-a`**: a wrong edge is removed from the edge
  file (git is the history, spec §7), a kept one is re-asserted in place with
  `as_of`, `lang` and a `rationale` naming the test and the term, a new body-text
  claim gets its one `modelling` edge and no `supports` edge, no grade, no
  consensus, ids hashed by script. Four edges go (7.2 → 7.1 two boxes; 7.7b → 7.7a,
  7.25b → 7.25a, 7.28b → 7.28a one box each), two stay (the p. 88 TAP criterion
  under 7.12, the chapter 9 definition under 6.8), nine claims and ten edges are
  added. Chapter 8 has no body-text edge and the rule produces none.
- **Second-reader check, blind**: chapters 8 and 9 and pp. 104–109 were derived
  before the brief was read, then the rest of chapter 7 as well. The blind reading
  reproduced the brief's four removals, two keeps, chapters 8 and 9 and five of its
  additions (p. 79 secondary tube, p. 84 balanced analgesia, p. 106 point selection,
  p. 107 point locations, p. 107 needles and sterile technique). Divergences,
  settled by the rule and the source: (1) the p. 92–93 caution "Zu beachten ist bei
  der perioperativen Applikation von NSAR …, sodass … berücksichtigt werden muss"
  is the guideline's own instruction beside 7.15's action and passes every gate —
  added, `supplements`, as 5.5's "bei der Wahl der Substanzen berücksichtigt
  werden" was; the brief had not listed it. (2) The brief's fragment "NSAR, bspw.
  50mg Diclophenac" (p. 92) is an example inside a sentence reporting an effect
  (gate 2), and a fragment is a claim only for an alternative or a case — left on
  the page. (3) The p. 86 "sollte auch dies bei der Entscheidung für oder gegen
  eine EA berücksichtigt werden" is the guideline's instruction on the topic of
  statement 7.11 — added, `supplements`, as the calcium-antagonist actions under
  statement 4.3 were; the brief was silent. (4) The two point locations of the
  appendix (p. 107) state what is the case: `fact` by form, where the brief said
  `criterion`. (5) The blind reading had leaned to take the studies' definition of
  early mobilisation ("den ersten postoperativen Tag", p. 107) as the value
  7.29's "frühmobilisiert" needs; the brief's gate 2 was accepted — the subject is
  the studies, and the guideline goes on to leave "intensivierte" undefined.
- **The semicolon sentence of p. 107 is two claims** ("Zur Anwendung können
  kommerziell vertriebene Akupunkturnadelprodukte kommen; die Vorgehensweise
  sollte unter sterilen Kautelen erfolgen"): two independent clauses saying two
  things, each with its own test — the needles fill "Akupunktur" (`refines`), the
  sterile technique is a measure beside it (`supplements`) — labelled by their
  fragment, as the brief read it.
- **The balanced-analgesia sentence of p. 84 goes to both boxes of 7.3.1** (7.9 and
  7.10): the measure sits beside the epidural analgesia in both, as the statin
  side-effects sentence went to both sentences of 4.4.
- **The p. 88 TAP claim keeps `kind: criterion`** although its form is a
  recommendation ("kann … verwendet werden"): an edit of an existing claim is a
  reviewed edit with history, the maintainer's call (`docs/work/LATER.md`); the
  edge stays with its rationale.
- **Labels keep the printed citation markers** ("[231]", "[278] … [282]") — the
  sentence as printed, as the Apfel claim of chapter 5 already does.
- **No chapter is left under the old reading**: chapters 4–6 (`relink-body-text-a`)
  and 7–9 (this package) now carry only edges the rule in spec §5.1 produces, each
  with a rationale naming the test and the term.

## Open questions

None.

## Verification

As `relink-body-text-a`; additionally the PR states that no chapter is left
under the old reading.
