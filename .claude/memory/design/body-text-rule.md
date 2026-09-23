---
name: body-text-rule
description: A body-text sentence earns a claim and an edge only through spec §5.1 — gate G1–G4, then R (refines) → L (limits) → S (supplements), first that holds; kind by form, never graded, one claim per answer; no edge between sentences of marked recommendations, none for evidence certainty, and an edge never decides a statement's condition.
metadata:
  type: project
---

Which body-text sentence becomes a claim, and which of `refines`, `limits`,
`supplements` it gets, is decided by the rule in `docs/graph-representation.md`
§5.1, not by the extractor's reading. The edge follows the sentence's relation
to the recommendation (fills a term → `refines`; takes cases out → `limits`;
instructs a further action → `supplements`), its `kind` follows the sentence's
form (§3.1), and the two are decided separately. A body-text claim carries
`verb` and `direction` as printed and no grade, consensus or number. Members
that give different answers (another threshold for the same term, another
action for another case) are one claim each; members sharing one answer stay
one claim. Two sentences of marked recommendations are never linked by a
body-text edge. The four proposals of pull request #66 (2026-09-14) became the
rule on card #160 (2026-09-23), pending the maintainer's confirmation.

**Why:** the first extraction read the relations differently from chapter to
chapter — a box's second sentence was `refines` in one box, `supplements` in
another, `limits` in a third — because kind and edge were tied
(criterion ⇔ `refines`) and no test was written down. Eight chapter passes
apply the rule next and the `judge` (§8.1) checks each edge against it, so
every clause is a test on one sentence and the edge's `rationale` names the
clause that decided. Linking two graded sentences as "body text" would put a
recommendation under zone 6 of the card (`docs/publication.md` §4); they
share their number and each supports its own statement. Evidence certainty
was already decided to be `claim.evidence`, not `refines` claims
([[claim-evidence-per-outcome]]). One claim per alternative was re-checked
against the anchor/subgroup/dimension/condition procedure of card #141: that
procedure decides what a value is *to a statement*, the claim split only what
the source says at one place, so the split stands and implies nothing about
the statement — three alternatives are three claims, not three statements
and not yet three condition values (multi-valued conditions, #142).

**How to apply:** apply §5.1 sentence by sentence, in the order printed; put
the clause and the term in the rationale (`"L: Dosistitration nicht
gewährleistet"`); never grade a body-text claim; never write a slot from a
body-text edge — name a circumstance the statement lacks in the pull request.
A change to the rule is a change to §5.1 and re-judges what was linked under
it (open question judge-rerun). Related: [[box-granularity-per-sentence]],
[[relations-are-edges-not-fields]], [[generic-over-guidelines]].
