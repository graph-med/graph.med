---
name: body-text-rule
description: A body-text place (a sentence, a footnote, a table or figure, read in rows) earns a claim and an edge only through spec §5.1 — gate G1–G4 in its own lowest section, then R (refines) → L (limits) → S (supplements), first that holds; a decline passing G1–G3 is a gap notice without an edge, an evidence gap is nothing; kind by form, never graded, one claim per answer; no edge between sentences of marked recommendations, none for evidence certainty, and an edge never decides a statement's condition.
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
  one line of one cell and is labelled "Kopf: Zelle; …" without reference
  marks.
- **Voice of a table.** It speaks as the sentence introducing it does: a
  source line "nach …" is an attribution, like "nach Apfel 1999" in the first
  source; a table introduced as another guideline's options speaks for that
  guideline; one a marked recommendation names speaks for this one. The
  guideline's own authors and "wir" are the guideline.
- **Section.** "Its section" is the lowest numbered heading above the place:
  a subsection without a box has no recommendation for G1, and a sibling's box
  does not lend it one.
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

**How to apply:** apply §5.1 place by place, in the order printed; put the
clause and the term in the rationale (`"L: Dosistitration nicht
gewährleistet"`); never grade a body-text claim; never write a slot from a
body-text edge — name a circumstance the statement lacks in the pull request.
A change to the rule is a change to §5.1 and re-judges what was linked under
it (open question judge-rerun). Related: [[box-granularity-per-sentence]],
[[relations-are-edges-not-fields]], [[generic-over-guidelines]],
[[derived-concepts-defined-by]].
