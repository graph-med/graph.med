---
name: claim-evidence-per-outcome
description: A claim carries how certain its evidence is as `evidence`, a list of {outcome?, value, system} in the rating system's own words — never a scalar, values never mapped between systems, several entries never reduced to one; provenance required like the grade.
metadata:
  type: project
---

How certain the evidence behind a recommendation is lives on the claim as
`evidence`: a list, each entry the rating in the words of the system that made
it (`value`, `system`) and, where the source rates per outcome, the `outcome`
concept it applies to. A source that states one certainty for the whole
recommendation gives a one-entry list without `outcome`; absent or empty means
"not recorded". Neither `system` nor `value` is an enum, and the list is the
only shape — no scalar, no scalar-or-list alternative. Its provenance is
`required`, like `grade` and `consensus`. Decided by the maintainer on
2026-09-17 when registering WP-0023: the second option of the former
`evidence-profiles` open question, narrowed to the rating and its outcome;
in the schema since 0.6.0.

**Why:** two rules make the field safe, and both are about not inventing a
value. A value is never mapped between systems: the ESC evidence levels
(A/B/C) and GRADE's four words have no correspondence that would not be made
up, so an unknown system is a valid state a consumer shows as it is
([[generic-over-guidelines]]: no guideline's vocabulary is privileged).
Several entries are never reduced to one: POMGAT rates per outcome under a
box, and a single summary certainty would be a value the guideline never
stated — `docs/publication.md` §3, grades are shown, never composed. A
scalar-or-list schema would reintroduce exactly the ambiguity the list
removes. The third option — each outcome row its own `fact` claim with a
`refines` edge — was not taken: it multiplies claims roughly fivefold per box
and puts the certainty a step away from the recommendation the card has to
show it beside.

**How to apply:** extract the rating as the source words it, one entry per
outcome row, an entry without `outcome` only where the source rates the
recommendation as a whole; `outcome` is optional so that a row is never
dropped for want of a concept — whether the pass mints one is its own
decision. Never add an enum of systems or values, or a mapping table, to the
schema, the validator or the build; a renderer may hold a display order per
system it knows and shows an unknown one unranked. Never compute one
certainty for a claim or a statement from several entries. The effect data
under a rating (effect sizes, intervals, study counts) is not this field.
Related: [[box-granularity-per-sentence]], [[relations-are-edges-not-fields]].
