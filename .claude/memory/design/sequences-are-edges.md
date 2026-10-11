---
name: sequences-are-edges
description: A recommendation the guideline triggers by the outcome of another is joined to it by the statement → statement edge `follows` (later → earlier, "is triggered by the outcome of"), `modelling`, its rationale quoting the trigger as printed, with two required closed enums, `transition` (replaces, adds, follows, concurrent) and `trigger` (target_missed, intolerance, contraindication, target_reached, reevaluation, finding, other) — never a field, never `complements` with properties; the condition stays on the later statement, the threshold on its `defined_by` claim, a body-text step stays `supplements`, review state comes from attestations, authored pathways stand beside it. Decided 2026-10-10 by the agent on the maintainer's delegation (card #294, Decisions 1–10); spec, schema, validator and judge with #295.
metadata:
  type: project
---

A **sequence** is one recommendation that the guideline makes depend on the
outcome of another: vasopressin "ergänzt", "wenn mit Noradrenalin alleine kein
ausreichender Blutdruck erzielt werden kann" (4.6), after noradrenaline (4.5).
It is the edge **`follows`**, statement → statement, written from the later
statement to the earlier, whose outcome triggers it:
`[later, follows, earlier, {…}]`, read "is triggered by the outcome of". It is
one of the statement → statement kinds beside `specializes`, `complements` and
`conflicts`, not a structure edge, and like them always `modelling`, with a
`rationale` quoting the passage that gives the trigger, as printed in „…“,
`lang` and `as_of`. Two properties are required on it and allowed on no other
kind, both closed enums with English keys:

- `transition`: `replaces`, `adds`, `follows`, `concurrent` — `concurrent`
  only where the guideline says "at the same time";
- `trigger`: `target_missed`, `intolerance`, `contraindication`,
  `target_reached`, `reevaluation`, `finding`, `other`.

Their German words live only in `tools/site/words/` (#297). Recorded on card
#294 as its Decisions 1–10 (question k as Decision k) on 2026-10-10, by the
agent on the maintainer's delegation: questions 1, 2, 4, 5, 6 and 9 by the
card's leanings, 3, 7, 8 and 10 from the evidence, those four the
maintainer's to overturn at review. They overturn two decisions of the expert
discussion of 2026-09-28 (parent card #293): its Decision 5 (a threshold
field) and the review-state half of its Decision 2. #295 wrote the edge
into `docs/graph-representation.md` (§5, §5.1 N(1), §8.1),
`schema/schema.yaml`, `tools/validate.py` and `.claude/agents/judge.md`,
with the criterion that tells a sequence from a condition; #296 writes the
first edges.

Where it meets what the pool already has:

- **Condition** (Decision 2). The circumstance that triggers the step stays
  the later statement's `condition` concept, usually of facet `finding`: the
  condition says *what*, the edge *to which measure*, and its `trigger` what
  kind of outcome that is. The edge never writes, removes or decides a
  condition entry (§5.1 N3), and neither the schema nor the validator relates
  the two. A trigger the page prints that the condition lacks is named in the
  linking pull request, never added by the edge.
- **`complements`** (Decisions 1, 3). It stays, unchanged, for a measure that
  adds to or stands beside another without a trigger (4.2 → 4.1); `follows`
  with `transition: adds` adds a measure because of the earlier one's outcome.
  One relation, one edge: where a linking pass reads a sequence between two
  statements that `complements` joins, `follows` replaces it (4.6 → 4.5, in
  #296).
- **Wording** (Decision 4). The rationale quotes, as every modelling edge's
  does; there is no free-text wording field and no second reference to the
  claim, which already carries the sentence and is checked by
  `--verify-quotes`. Whether the rationale's quote is on the page is the
  judge's reading; whether a quote inside a modelling rationale falls under
  the server's quote gate ([[quote-gate-follows-the-site]]) stays #299's
  question.
- **Threshold** (Decision 5). The edge carries none. A printed threshold of a
  trigger sits on the criterion or definition claim that the condition
  concept's one `defined_by` edge reaches (8.1's
  `concepts/anhaltender-vasopressorbedarf`) and is read through condition →
  `defined_by` → `threshold`, never copied. A stated condition has none. No
  function compares a patient's values with it (#293's Decision 6; #283).
- **Review state** (Decision 6). No `status` on the edge or the statement. A
  border case is a judge finding — `disputed`, or `unjudged` with its two
  readings under "Undecidable" — and a line in the pull request naming the
  edge and the clause of the criterion that leaves it open.
- **Body text** (Decision 7). A body-text place that instructs the next step
  when a marked recommendation's action fails, is refused or reaches its
  target stays `supplements` (§5.1 S), claim → claim, and supports no
  statement. A chain holds statements only, so a body-text step shows with
  its recommendation's claim, never as a node.
- **Authored pathways** (Decision 8). `follows` is written wherever the
  guideline's text states the order — also in a chapter whose flowchart's
  steps are marked recommendations the text states (#327's Decision 7) — and
  is never read from a figure. Whether an authored pathway, once built,
  replaces the view's derived tree or stands beside it stays
  decision-graph-derivation's question (#115). The structure
  edges `sequence`, `branch` (with `guard`) and `about` stay as they are, for
  authored pathways; which is why the new kind is not named `sequence`.
- **Updates** (Decision 9). A changed endpoint makes the edge stale, surfaced
  and downgraded, never a build failure; a removed endpoint dangles, and the
  validator's reference check makes the pull request that removes it delete
  or reroute the edge. Staleness is built for no edge yet; `follows` gets it
  when the other kinds do.
- **Validator** (Decision 10). (a) Some source has claims supporting both
  ends: no chains across guidelines. (b) An edge is refused where the later
  statement's `population` lies strictly above the earlier's along `broader`
  and `in_scope_of`; the same or an unrelated population passes, and so does
  the reference chain (4.6's and 8.1's `concepts/septischer-schock` is
  `in_scope_of` 4.5's population). (c) The `follows` edges whose `trigger` is
  neither `reevaluation` nor `target_reached` form no cycle; cycles through a
  re-evaluation stay allowed, and so does one through an edge whose two
  statements' claims `disagrees_with` joins — the source stating their order
  both ways, each printing an edge of its own and none chosen
  ([[source-disagreements-shown]]; added on #295, 2026-10-11, so that the
  check never makes a linking pass drop one). (d) `other` is counted, never
  a failure: the build prints per view the number of `follows` edges and how
  many say `other` (#297).

**Why:** a field on the statement, the discussion's proposal, has no
provenance, no attestation and no staleness
([[relations-are-edges-not-fields]]); properties on `complements` would make
one kind mean both "adds" and "adds because the first failed", and the
trigger is what tells them apart. An edge never decides a condition (§5.1 N3,
[[body-text-rule]]). Verbatim text lives only in claims, where it is checked,
and a threshold on the claim that prints it, where the quote checks it
([[derived-concepts-defined-by]]). A hand-written review status is the same
violation as a hand-written evidence property (§3.3). A `follows` edge rests
on box text a quote reaches, an authored pathway of a raster flowchart on none
(#327), so neither stands in for the other, and replacing the
authored-pathway leaning now would settle decision-graph-derivation before its
own test (#115). Stale must be survivable, or an update to a shared statement
would freeze everything referencing it ([[staleness-and-verification]]). Each
validator rule is a fact the schema cannot state across files, of a kind the
validator already checks, and none decides a clinical reading.

**How to apply:** write a `follows` edge only where the page states the order
and the earlier measure's outcome triggers the later — a state of the patient
stays a condition; give both properties from the closed lists and quote the
trigger's wording in the rationale; never put a trigger, a threshold or a
status on the edge, and never change a condition with it; replace a
`complements` edge the same pair carries; name border cases, triggers the
condition lacks and body-text steps the chain would need in the pull request.
Where the source states the order of two recommendations differently in
two places, write each printing as an edge and join the claims that print
them by `disagrees_with`; never pick one.
What stays open is `docs/open-questions.md`, sequence-edge. Related:
[[conditions-are-a-conjunction-list]], [[scope-tree-and-anchor]],
[[generic-over-guidelines]].
