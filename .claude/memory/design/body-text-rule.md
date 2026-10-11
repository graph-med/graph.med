---
name: body-text-rule
description: A body-text place (a sentence, a footnote, a table or figure, read in rows) earns a claim and an edge only through spec §5.1 — gate G1–G4 in its section (a float's is that of the box naming it; a section's own text also has its subsections' boxes, a boxless subsection its parent's, never a sibling's), then D (disagrees_with: it answers the recommendation otherwise than the recommendation prints it, a rating in other words included, a rating joined to every claim carrying its row, #341, #372) → R (refines) → L (limits) → S (supplements), first that holds, and `disagrees_with` to every place answering its question otherwise; a decline is a gap notice without an edge (a denied need or indication read by its verb, #372), an evidence gap nothing; a recommendation in the guideline's voice no box of its section covers is a claim without an edge in no statement (U); a definition a heading marks is a claim wherever it stands when a box uses its term; kind by form, never graded, one claim per answer (a table one per instrument or per row); no edge between sentences of marked recommendations, none for evidence certainty or effect data, and an edge never decides a statement's condition.
metadata:
  type: project
---

Which body-text place becomes a claim, and which of `refines`, `limits`,
`supplements` it gets, is decided by the rule in `docs/graph-representation.md`
§5.1, not by the extractor's reading. The edge follows the place's relation to
the recommendation (fills a term → `refines`; takes cases out → `limits`;
instructs a further action → `supplements`), its `kind` follows the place's
form (§3.1), and the two are decided separately. A body-text claim carries
`verb` and `direction` as printed and no grade, consensus or number. Members
that give different answers (another threshold for the same term, another
action for another case) are one claim each; members sharing one answer stay
one claim. Two sentences of marked recommendations are never linked by a
body-text edge. The four proposals of pull request #66 (2026-09-14) became the
rule on card #160 (2026-09-23), pending the maintainer's confirmation.

Card #213 (2026-09-24, the agent's proposal awaiting the maintainer) widened
it from sentences to places and closed four gaps the second guideline opened:

- **Places.** A footnote (also one marked from inside a box), a table and a
  figure are body text. A table is read like a sentence whose members are its
  rows (or a cell's items): K counts answers, so rows listing one group's cases
  are one claim, a row with its own action is its own, and a table a
  recommendation names as one instrument is one answer. A table claim quotes
  one line of one cell and is labelled "Kopf: Zelle; …", its reference marks
  left out as every label's are ([[reference-marks-left-out]], spec §3.1).
  A figure printed as an image, without a text layer, stays on the page with
  its footnotes, its caption a place like any other (§5.1 F, card #327,
  [[figures-without-text]]).
- **Voice of a table.** It speaks as the sentence introducing it does: a
  source line "nach …" is an attribution, like "nach Apfel 1999" in the first
  source; a table introduced as another guideline's options speaks for that
  guideline; one a marked recommendation names speaks for this one. The
  guideline's own authors and "wir" are the guideline.
- **Section.** "Its section" is the lowest numbered heading above the place,
  and a sibling's box does not lend it one (amended by #325, below).
- **Declines.** Saying no recommendation, or no value one needs, is given is a
  decline: a `gap_notice` claim without an edge, whose G1 asks only that it
  share the question of a marked recommendation of its section (any agent,
  any population — the first source's body-text gap notices all do). Saying
  the action is not recommended recommends against it. Saying only what is
  unknown ("unklar", "keine Studien", "keine Datengrundlage") is evidence
  (N2), and a decline restating a marked gap notice fails G3.
- **Marked definitions** reach every claim of the source using the term only
  when they define the term as such; an item of a list "definiert als …"
  where it stands defines that item there.

Card #325 (2026-10-10 on the maintainer's delegation, ADR-0009; the
physician's questions answered by the maintainer on 2026-10-11) closed the
places the third guideline prints and the rule did not decide, or decided
against what its boxes rely on. Each is a clause of §5.1 now:

- **Definitions wherever they stand (G1).** A chapter of definitions and
  classes holds no box, and later boxes use its classes as populations. A
  definition or criterion the source marks for a term as such — a heading or
  table head that calls it a definition, classification or criterion — passes
  G1 wherever it stands when a box uses the term; its concept reaches it by
  `defined_by`, and it carries no body-text edge, not even E's (E's edges to
  every claim using the term would reach every claim of the source from a
  definition of the disease itself). A term no box uses stays on the page.
- **A float's section.** A table printed in a subsection after the next box,
  or in a section without a box, named by a box elsewhere, is read where the
  box that names it stands, else where the first sentence introducing it
  stands, else where it is printed; its claim's `section` stays where printed.
  The text that calls a float places it, as it already gives it its voice.
- **The section boundary both ways.** A box in a section's own text is also
  one of each subsection below that holds none (subsections that say in words
  part of what the box's figure draws), and a section's own text above
  boxed subsections is read against their boxes. A sibling's box never
  counts. Neither direction admits anything in the first two guidelines.
- **Adapted floats (G2).** A source line — "adaptiert nach", "modifiziert
  nach", "Zusammengestellt nach …; ergänzt und bearbeitet durch die
  Leitliniengruppe" — is attribution, like "nach …": a table a box names
  speaks for the guideline. The second guideline's adopted options table
  stays on the page because the sentence introducing it gives it to another
  guideline and no box names it (#220), not because it is adapted; without
  that note "adapted tables stay on the page" could pass for the rule. A
  figure's footnotes follow the figure (F, #327).
- **Claims per table (K).** A table a box names as one instrument (a symptom
  score, a classification) is one answer; one whose rows each give another
  action or agent (a drug table a box delegates its choice to) is a claim per
  row, labelled "Kopf: Zelle; …"; a row is one claim with one edge, the first
  of R, L, S that holds, so a row with a dose and a contraindication is R.
  Effect data a box names ("absolute Effekte", strokes per 1000 by score) is
  N2 and stays on the page.
- **Declines (G4).** "… besteht nicht", "existiert nicht", "sprechen … gegen
  eine Empfehlung", "lässt eine Empfehlung … nicht zu", "keine Empfehlung …
  auszusprechen", "Ermessensspielraum" each say that no recommendation is
  given: a gap notice without an edge, also with the evidence as subject. A
  referral in place of a recommendation is N4.
- **Recommendations outside a box (U).** Whole sections without a box tell
  how to interrupt, bridge or reverse an anticoagulant, and sections whose box
  is on another action recommend in the guideline's voice too. Such a place
  is a claim without an edge, in no statement, with no grade, consensus or
  number, kind by form and verb by §3.1 — findable on its page and in the
  pool, never beside the boxes as if voted on; so is a decline G1 does not
  admit. "Diese Leitlinie empfiehlt" is no mark; a passive "wird empfohlen" is
  the same voice. One restating a box adds nothing (G3).
- **Disagreement.** Where the source prints one rule differently in two
  places (a diagnostic duration "für 30 Sekunden", "mindestens 30s",
  ">30 Sekunden"; a long-standing form "mehr als 12 Monate", "seit
  mindestens 12 Monaten", "über 1 Jahr"), each printing that passes is a
  claim, and the graph shows the disagreement, never resolves it — the
  maintainer's principle of 2026-10-11, "the graph reflects the text", built
  by card #341.

Card #341 (2026-10-11, the maintainer's "the graph reflects the text") put
**D** before R: a place that answers a recommendation's term, case or action
otherwise than the recommendation prints it is a claim joined to it by
`disagrees_with`, and gets no R, L or S edge to it, which would read one
through the other; places answering a term the recommendation leaves open
each keep their edge and are joined to each other
([[source-disagreements-shown]]).

Card #372 (2026-10-11) wrote the maintainer's answers to three findings of
the third guideline's pilot (F3, F5 and F6 of #370) into G4 and D:

- **A denied need is read by its verb (G4).** "besteht … keine Indikation
  zur Umstellung" says that no need exists: a decline, a gap notice without
  an edge. "sieht … keine Indikation für …" says that the guideline denies
  the action one: against it, as "kann nicht empfohlen werden" is. The noun
  is the same in both, so it cannot decide; the verb does (the maintainer:
  "By the verb, as now").
- **A disagreeing rating joins every claim that carries the row (D).** A
  row goes to every sentence of its box with a statement of its own
  ([[claim-evidence-per-outcome]]), so a place that rates it otherwise is
  joined to each, and every recommendation's card shows it (the maintainer:
  "Every claim with the row"). The edges grow with the sentences; the
  alternative, one edge to the first, would leave the other cards silent.
- **A rating in other words is another rating (D).** Ratings are compared
  by their words as printed and never mapped: "sehr niedrige" against the
  box's "sehr gering" is a disagreement, shown, its rationale saying that
  the page does not equate them (the maintainer: "Show it as a
  disagreement"; equating them would be a reading the source does not
  print). The same word capitalised or inflected otherwise is the same
  rating, as the pilot left "moderater Aussagesicherheit" beside a row's
  "moderat" on the page. This bears on the open question
  rating-printed-as-symbols and does not settle it.

**Why:** the first extraction read the relations differently from chapter to
chapter — a box's second sentence was `refines` in one box, `supplements` in
another, `limits` in a third — because kind and edge were tied
(criterion ⇔ `refines`) and no test was written down. Eight chapter passes
apply the rule next and the `judge` (§8.1) checks each edge against it, so
every clause is a test on one place and the edge's `rationale` names the
clause that decided. The second source prints tables, footnotes and many
declines the sentence-only rule did not say how to read, and nine parallel
parts would have read them nine ways; every widening was checked against the
first source's claims, and none reads differently. Linking two graded
sentences as "body text" would put a recommendation under zone 6 of the card
(`docs/publication.md` §4); they share their number and each is linked as
§3.1 says. Evidence certainty was already decided to be `claim.evidence`, not
`refines` claims ([[claim-evidence-per-outcome]]). One claim per alternative
was re-checked against the anchor/subgroup/dimension/condition procedure of
card #141: that procedure decides what a value is *to a statement*, the claim
split only what the source says at one place, so the split stands and implies
nothing about the statement.

The third guideline's widening was asked case by case (#325's questions
1–13): a chapter of definitions with no box would otherwise leave its classes
stated concepts while one later page's printing passed as R and hid the
others; a printed position would test a float against a box that does not
name it; and a reader looking in the graph for how to interrupt an
anticoagulant before surgery found nothing, though the guideline says it in
its own voice. The maintainer's answer to that last case (2026-10-11) settled
open question body-text-without-a-box: such sentences are claims in the pool,
with no edge and in no statement (b), not statements of their own shown as
unvoted (c). The re-read of the first two guidelines found no claim that
reads differently and no place the section boundary admits; it found the
second guideline's unboxed sentences that U would admit, extracted none.

**How to apply:** apply §5.1 place by place, in the order printed; put the
clause and the term in the rationale (`"L: Dosistitration nicht
gewährleistet"`); never grade a body-text claim; never write a slot from a
body-text edge — name a circumstance the statement lacks in the pull request.
A change to the rule is a change to §5.1 and re-judges what was linked under
it (open question judge-rerun). Related: [[box-granularity-per-sentence]],
[[relations-are-edges-not-fields]], [[generic-over-guidelines]],
[[derived-concepts-defined-by]].
