---
id: evidence
title: Evidence certainty, from the schema to the card
---

How certain the evidence is, and how binding the recommendation is, are two
different facts. The pool carries the second (`claim.grade`, `claim.consensus`)
and not the first: a recommendation box's GRADE certainty — which in POMGAT is
stated per outcome, `hoch` for one endpoint and `sehr niedrig` for another — has
no shape in the schema at all, and the detail panel has no zone for it
(`docs/open-questions.md` → evidence-profiles, `docs/work/LATER.md`).

**Scope.** The shape in the schema (`claim.evidence`, a list of
outcome/value/system), the display order per evidence system that the renderer
needs, the panel zone that shows it, and the extraction pass that fills it from
the source. Two constraints hold throughout: nothing is composed — no single
certainty is computed for a statement that the guideline states per outcome
(`docs/publication.md` §3 "Grades are shown, never composed"); and no evidence
system is wired in — GRADE, Oxford LoE and the ESC evidence levels differ enough
that translating between them would fabricate a value (memory
`generic-over-guidelines`).

**Out of scope.** `grade-derivation` (`docs/open-questions.md`) — an effective
grade for a statement stays undecided and unaffected. The evidence *effect*
data (effect sizes, confidence intervals, study counts) behind a certainty
rating: this initiative carries the rating and its outcome, not the profile
table under it. Quality indicators (`LATER.md`).
