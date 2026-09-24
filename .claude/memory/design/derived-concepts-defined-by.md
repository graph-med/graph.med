---
name: derived-concepts-defined-by
description: A concept established by a rule (a threshold, a score, a definition) is derived because its one `defined_by` edge reaches the criterion or definition claim giving the rule — computed from the edge, never stored; the threshold sits on the claim that prints it (`threshold`, one per claim: quantity concept, comparator from a closed mathematical list, value/unit/when as printed, `relative_to`); how several parts of a rule combine is extracted from the source as a `combination` on the claim quoting the passage (all_of, any_of, at_least n, not_stated; the connective as printed and quote-checked, the reading modelling), nesting through claims — never a default. Choices 1 and 2 proposed 2026-09-24 (#187); choice 3 decided by the maintainer 2026-09-24 (#204).
metadata:
  type: project
---

A concept a clinician cannot observe but establishes by a rule is
**derived** (*abgeleitet*); every other is **stated** (*angegeben*). The rule
is a claim of kind `criterion` or `definition`, and the concept reaches it by
the edge `defined_by` (concept → claim, modelling with a rationale). Three
choices, written into `docs/graph-representation.md` §3.1, §3.2, §3.3 and §5
and schema 0.12.0:

1. **The kind is computed, not stored**: a concept with a `defined_by` edge
   is derived. It therefore holds wherever the concept stands — anchor,
   condition, or the `condition` of a scope edge — by one mechanism.
   (Proposed on card #187.)
2. **The threshold lives on the claim** that prints it (`threshold`), where
   the quote checks it: a quantity concept, a comparator (`<`, `≤`, `>`, `≥`,
   `=`, `between`), value, unit and time point (`when`) as printed strings,
   and for a relative threshold the reference quantity (`relative_to`).
   Provenance required, like the grade. One per claim since #204: two values
   the page joins are two claims and a combination. (Proposed on card #187.)
3. **How the parts of a rule combine is extracted from the source**, like a
   threshold, never set by convention. Decided by the maintainer on
   2026-09-24 (card #204), replacing #187's "several `defined_by` edges are
   alternatives". The concept has **one** `defined_by` edge, to the claim at
   the top of its rule. That claim quotes the passage and carries a
   `combination`:
   - an `operator` from the closed, logical set `all_of` (UND), `any_of`
     (ODER), `at_least` with `n` (mindestens n von), `not_stated` (a list
     the page gives without saying how it combines);
   - its parts `of`, criterion or definition claims of the same source;
   - the `connective` as printed, each piece inside one of its `source`
     quotes;
   - the reading as a `rationale`.

   Operators **nest through claims**: a part that combines is itself a claim
   with its own combination, so each group keeps its claim, label and
   `refines` edge. A claim prints a threshold or combines parts, never both.
   The validator refuses a second `defined_by` edge, since it would be a
   combination nobody read off the page. In this decision the maintainer also
   chose:
   - **no `none_of`**: a definition by exclusion stays one claim, its
     "ohne … oder …" in the sentence as printed;
   - **every member a connective joins is a leaf claim of its own**, a
     narrower place in the sentence;
   - **the combining claim's kind by the §3.1 rule**, with no new kind.

   Several conditions of a statement stay a conjunction
   ([[conditions-are-a-conjunction-list]]), and a connective inside a
   threshold's `when` stays as printed.

**Why:** the rule was already in the pool as criterion claims that `refines`
the recommendation, but the concept knew nothing of it, so a reader of
"geringes Pankreasfistelrisiko" had to search the body text for what to
measure. A stored kind would have to be kept in step with the edges by hand;
a threshold on the concept or the edge would sit away from the quote that
proves it; the relation is an edge because it needs provenance
([[relations-are-edges-not-fields]]). A default combination is wrong for some
source whichever it is: POMGAT joins the rules of 6.7 by "entweder … oder",
the values of one of them by "sowie", the groups of 4.1 by an "und" that
means ODER, and one group by "mindestens zwei". Reading every connective off
the page is the only rule that is right for all of them. It is what a
physician needs so as not to treat a patient as low-risk on one criterion
when the guideline requires several. The operator and comparator lists are
closed because they are logic and mathematics; no connective word, unit,
score or quantity is enumerated ([[generic-over-guidelines]]).

**How to apply:** To mark a concept derived, find (or, where the page plainly
prints it, extract) the criterion or definition claim and add one
`defined_by` edge whose rationale names the clause and the term; never add a
field on the concept. Where the page gives several ways or parts:
1. extract each member the connective joins as a claim;
2. extract the passage as the claim at the top, with its `combination`;
3. quote every connective, and say its reading in the `rationale`, never
   inferring it from the word alone;
4. where the page does not say how its parts combine, write `not_stated`,
   never a guess.

Put a threshold only where the passage prints it, never inferred or
completed. Where the source names the rule without a number, the edge stands
without a threshold. A threshold says for whom, never how: a dose or a
duration of the action is none. A second guideline's rule for a concept that
already has one is open (`docs/open-questions.md`, rule-across-sources).
Related: [[scope-tree-and-anchor]], [[body-text-rule]].
