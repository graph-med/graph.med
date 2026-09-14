---
id: WP-0012
title: Relink body-text relations, chapters 4–6
status: review
created: 2026-09-12
updated: 2026-09-14
depends_on: [WP-0011]
blocks: [WP-0013]
owner: agent
initiative: extraction-quality
kind: linking
slug: relink-body-text-a
---

## Outcome

Chapters 4–6 of `pomgat-lv-1.0` (claim files `ch04`, `ch05`, `ch06`) follow the
body-text rule: every `refines`, `supplements` and `limits` edge is one the rule
produces, missing ones are added with their claims, wrong ones are superseded
with history. The amylase criterion refining box 6.7 (p. 64) carries the
alternatives the text gives beside it (day 1 and 3 with the drain volume, three
times the serum concentration on day 3) in the shape the rule prescribes.

## Scope

In: `data/claims/pomgat-lv-1.0/ch04.yaml`, `ch05.yaml`, `ch06.yaml`,
`data/edges/pomgat-lv-1.0/` for those chapters; pages 26–74 of the source.
Out: chapters 7–9 (`relink-body-text-b`); the site.

## Constraints

Every quote verbatim on its physical page (`uv run tools/validate.py
--verify-quotes` must pass); claim ids hashed by script; every new edge
`modelling` with a rationale; nothing the text does not state.

## Decisions

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- **Superseding an edge is an edit of the edge file; git is the history** (spec §5.1
  "a wrong edge is replaced in place", §7 "the file changes, the old value lives in
  git history"). The five edges the rule does not produce were removed from
  `data/edges/pomgat-lv-1.0/ch04.yaml` and `ch05.yaml`; the four it produces were
  re-asserted in place with `as_of`, `lang` and a `rationale`. No claim was touched
  and no schema change was needed: the schema has no "no longer holds" marker and
  the spec asks for none.
- **A body-text claim gets its one edge to the box claim and no `supports` edge**
  (spec §5.1 "becomes a claim with one edge to a box claim"; the boxless case
  supports a statement, the linked case does not), as the four existing criterion
  claims already did. The sheet shows them under their box.
- **Three sentences the brief left on the page pass the rule and were added**, each
  flagged in the pull request for the reviewer: p. 28 "Im Sinne von GCP sind diese
  bei Auftreten klinisch zu beobachten und zu bewerten …" (`supplements` both
  sentences of 4.4 — a measure beside the statin therapy, "ist … zu" form); p. 54
  "Die präoperative selektive Darmdekontamination (SDD) mit oralen, nicht
  resorbierbaren Antibiotika und/oder Antimykotika über 3-7 Tage …" (`refines`
  5.12 — which agents and duration the term stands for); p. 73 "… kommen hierfür
  apparativ unterstützte Verfahren … infrage" (`refines` 6.14 — "Hierfür", the
  rule's own example). Everything else follows the brief.
- **The titration limit of p. 27 goes to 4.1's first sentence** (the action advised
  against, `8ce3a620`), not to the second (which carries the term "Dosistitration"):
  the rule sends a `limits` edge to the claim whose action the case is taken out of.
- **A definition with two verbs carries neither** (p. 55: "soll … gegeben und kann …
  fortgesetzt werden"): `verb` and `direction` are written only where one printed
  verb fits the enum; the label keeps both.
- **Two cases in one sentence are two claims labelled by their fragment**, verbatim
  and contiguous in the source (p. 27 calcium antagonists, p. 45 povidone-iodine),
  never a sentence rebuilt with an ellipsis.
- **Second-reader check on chapter 6**: the rule applied blind before reading the
  brief reproduced the brief's chapter 6 exactly (the amylase alternatives, the
  thoracic-drain removal, the soft pancreas under 6.5 and 6.6, the extraperitoneal
  anastomoses under 6.10; the same sentences left on the page) and found one more,
  the p. 73 techniques sentence above; the brief's `criterion` for the soft-pancreas
  sentence was accepted over the blind reading's `recommendation` ("kann notwendig
  sein" governs no action).

## Open questions

None.

## Verification

Both validator forms pass; the PR lists each edge added, superseded or kept,
with the rule clause that decided it.
