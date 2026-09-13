---
id: WP-0009
title: Test and assert the first proposed axes on POMGAT
status: review
created: 2026-09-12
updated: 2026-09-13
depends_on: [WP-0008]
blocks: [WP-0010]
owner: agent
initiative: groupings
kind: linking
slug: link-grouping-axes
---

## Outcome

The axes the physician proposed for `pomgat-lv-1.0` — the perioperative phase
as a statement dimension, the anatomical region as a hierarchy respect, in the
form `grouping-axes-decision` gives them — exist as axis definitions in the
pool, each has been run through `tools/axes.py` against the view, and each
whose report the pull request judges feasible is asserted: slot values on the
statements and `broader` edges with `axis`, every one `modelling` with a
rationale, in `data/edges/pomgat-lv-1.0/grouping-axes.yaml` and on the
statement files; family concepts minted where an axis needs them (facet,
label, source language). The existing `broader` edges are read as the region
axis where the rule confirms them and left as plain subsumption where it does
not. What the rule cannot place is listed in the pull request with the
reason, not forced; an axis whose report falls short is left proposed, with
the report in the pull request, not asserted.

## Scope

In: `data/axes/` (or the namespace `schema-grouping-axes` names),
`data/edges/pomgat-lv-1.0/`, `data/statements/`, new files under
`data/concepts/` for families.
Out: the site; any axis nobody proposed; a change to the mechanism.

## Constraints

Spec §11 (search before minting, nothing inherited, no review status written);
spec §4.1 (the report decides nothing — the pull request does, and says why);
memory `concept-hierarchy-depth` (as deep as subsumption goes; families are
concepts without a parent on that axis); short labels above ~45 characters
(memory `short-label-limit`); everything in the source language with `lang`.
Statements are edited, not replaced: a slot value added is an edit with
history (spec §7), never a new statement.

## Decisions

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- 2026-09-13, WP-0007: the two proposals and their rules are the worked example of spec §4.1; the phase's fourth value is *perioperativ*; the region axis is proposed with `several: false` first, and the report decides whether it is asserted at all — 46 of 90 statements sit on populations the rule leaves unplaced.
- 2026-09-13, WP-0009: **the phase is asserted.** Before assertion the report
  placed 86 of 90 statements, 4 disjoint (sentences naming several phases),
  none unplaced, 28 · 20 · 26 · 12 by value; after, 90 of 90 from the data,
  28 · 20 · 26 · 16. The rule in `axes/phase` was written out so that it is
  applied without judgment: a phase is named by the word the sentence attaches
  to the *measure* — as adverb, as adjective of the measure's noun (also as its
  purpose, "zur perioperativen Analgesie"), or as a point in the operative
  timeline (vor dem Hautschnitt, vor Narkoseausleitung, im Aufwachraum, n.
  postoperativer Tag …); adverb and point of time beat the adjective
  ("präoperativ … perioperative Antibiotikaprophylaxe" → präoperativ); a
  phase word on a complication ("postoperativer Ileus") or on the case
  ("intraoperativ eingelegte Magensonde", "nach Gastrektomie") names none, and
  the chapter decides (4, 5 → präoperativ, 6 → intraoperativ, 7 →
  postoperativ, 8 → perioperativ). Where the sentence names several phases the
  placements list them all and assertion takes *perioperativ* — the rule
  says so; no statement was split. 53 sentences name their phase, 37 are placed
  by the chapter; 15 sentences overrule their chapter (the intraoperative
  nasogastric-tube removals in chapter 7, the postoperative drain removal in
  chapter 6, the intraoperative repeat and postoperative stop of the
  antibiotic prophylaxis in chapter 5, the perioperative continuations in
  chapter 4 …).
- 2026-09-13, WP-0009: **the region stays proposed.** Its report: 19 of 36
  concepts (53 %) carrying 41 of 90 statements (46 %); 4 concepts in several
  regions — a defect under `several: false` (Pankreas- und Leberchirurgie,
  oberer GI-Trakt, oberer GI-Trakt und Pankreas, nicht-kolorektal); 13
  unplaced carrying 45 statements, the generic tumour operation heaviest with
  24, the elective abdominal operation with 7, the cardiac medication groups
  and risk profiles the rest; 5 roots, longest chain 2, no single-member
  root. The reason is not the coverage figure alone: the five families the
  rule yields are the five organ families of the plain hierarchy, with the
  same members and the same chains, so the switch would offer the reader the
  plain hierarchy with its non-organ families (the generic operation, the
  cardiac medication, the risk profile) collapsed into "not placed" — less
  than the view already shows, not another grouping of it. Nothing was
  written for it: no `axis` on an existing `broader` edge, no
  `grouping-axes.yaml`, no family minted. The proposer's options are
  `several: true` (places the four disjoint concepts, +4 statements) or
  withdrawal; either is a change to the definition, not to the data.
- 2026-09-13, WP-0009: the region's families are the existing procedure
  family concepts (`oesophagusresektion`, `gastrektomie-oder-magenteilresektion`,
  `pankreasresektion`, `leberresektion`, `kolorektale-chirurgie`), not organ
  concepts: `broader` is "is a special case of", and a resection is not a
  special case of an organ. Search before minting found them; nothing new.
- 2026-09-13, WP-0009: the statement has no per-property provenance in the
  schema, so the rationale of each slot value — the rule, and the phrase or
  the chapter that decided it — is the table in the data commit's message
  (git is the history, spec §7) and in the pull request; a `provenance.phase`
  on the statement would be a schema change this package does not make
  (`docs/open-questions.md` → statement-slot-provenance).
- 2026-09-13, WP-0009: divergences from the worked example, all from the
  written rule applied to the pool as it is: 53 sentences name a phase, not
  58, and 4 name several, not 2; the corticosteroid recommendation 4.7 is
  *perioperativ*, because the pool's sentence says "perioperative
  Glukokortikoidgabe" and "vor Narkoseeinleitung" occurs in no claim; the
  region places 19 / 4 / 13, not 20 / 2 / 14. Placed by the chapter where a
  physician may expect otherwise, and left so because the rule allows no
  clinical inference: the PONV prophylaxis and the anaesthesia statements of
  chapter 5 (präoperativ), the epidural comparisons of 7.3 (postoperativ).

## Open questions

None.

## Verification

Validator passes; the PR contains the feasibility report of every proposed
axis before and after assertion, lists every population concept with its
family per hierarchy axis and every statement with its value per dimension
axis as tables, and the unplaced with the reason.
