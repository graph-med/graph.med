---
name: derived-concepts-defined-by
description: A concept established by a rule (a threshold, a score, a definition) is derived because a `defined_by` edge reaches the criterion or definition claim giving the rule — computed from the edges, never stored; the threshold sits on that claim as printed (`thresholds`: quantity concept, comparator from a closed mathematical list, value/unit/when as printed, `relative_to`); several rules of a concept are alternatives, a rule needing two values is one claim with two thresholds. Proposed 2026-09-24, awaiting the maintainer's confirmation.
metadata:
  type: project
---

A concept a clinician cannot observe but establishes by a rule is
**derived** (*abgeleitet*); every other is **stated** (*angegeben*). The rule
is a claim of kind `criterion` or `definition`, and the concept reaches it by
the edge `defined_by` (concept → claim, modelling with a rationale). Three
choices, proposed on 2026-09-24 on card #187 (WP-0032) and written into
`docs/graph-representation.md` §3.1, §3.2, §3.3 and §5 and schema 0.10.0 as
proposed until the maintainer confirms or overturns them in review:

1. **The kind is computed, not stored**: a concept with a `defined_by` edge
   is derived. It therefore holds wherever the concept stands — anchor,
   condition, or the `condition` of a scope edge — by one mechanism.
2. **The threshold lives on the claim** that prints it (`thresholds`), where
   the quote checks it: a quantity concept, a comparator (`<`, `≤`, `>`, `≥`,
   `=`, `between`), value, unit and time point (`when`) as printed strings,
   and for a relative threshold the reference quantity (`relative_to`).
   Provenance required, like the grade.
3. **Several `defined_by` edges are alternatives**; a rule that needs two
   values at once is one claim with two thresholds. Several conditions of a
   statement stay a conjunction ([[conditions-are-a-conjunction-list]]).

**Why:** the rule was already in the pool as criterion claims that `refines`
the recommendation, but the concept knew nothing of it, so a reader of
"geringes Pankreasfistelrisiko" had to search the body text for what to
measure. A stored per-entry kind would reshape the condition list and have to
be kept in step with the edges by hand; a threshold on the concept or the
edge would sit away from the quote that proves it; the relation itself is an
edge because it needs provenance ([[relations-are-edges-not-fields]]). The
comparator list is closed because it is mathematics; units, scores and
quantities are not enumerated ([[generic-over-guidelines]]).

**How to apply:** To mark a concept derived, find (or, where the page plainly
prints it, extract) the criterion or definition claim and add a `defined_by`
edge whose rationale names the clause and the term; never add a field on the
concept. Put a threshold only where the passage prints it, never inferred or
completed; where the source names the rule without a number, the edge stands
without a threshold. A threshold says for whom, never how — a dose or a
duration of the action is none. If the maintainer overturns a choice, rewrite
this file and the spec sections together. Related: [[scope-tree-and-anchor]],
[[body-text-rule]].
