---
name: body-text-relations-rule
description: A body-text sentence earns an edge to a box claim by three tests in order — fills a term → refines, takes a case out → limits, adds an action → supplements — one claim per alternative, kind by form and never graded; the sentences of one box get no edge between them.
metadata:
  type: project
---

The body-text relations (`refines`, `supplements`, `limits`) are decided by the
rule in `docs/graph-representation.md` §5.1, not by the extractor's reading: a
gate (the guideline's own voice, about the box's own action, adding something
the box lacks, not a decline), then *in* → `refines`, *out* → `limits`, *more*
→ `supplements`, first match wins. A criterion with alternatives ("entweder …
oder … oder aber", 6.7's amylase values) is one claim per alternative, each
with its own edge. A body-text claim's kind follows the sentence's form and it
carries no grade. The sentences of one box, and two boxes, get no body-text
edge between them. Decided 2026-09-14 (WP-0011).

**Why:** the first extraction read the relations differently from chapter to
chapter — a box's second sentence was `refines` in 7.28, `supplements` in 7.25
and 7.7, `limits` in 4.5 — and the physician saw it. The site's sheet shows
these edges as "what the body text adds" (`docs/publication.md` §4), so an
edge between two graded box sentences puts a box under "body text"; the box's
sentences already share a `recommendation_no` and each supports its own
statement. A quote must lie on one line of the extracted text (§6.2), so an
enumeration of alternatives cannot be one verifiable claim; and the existing
claim already quoted one alternative alone, so the others are added beside it.

**How to apply:** apply §5.1 sentence by sentence to the body text under a box,
in the order printed; put the deciding test and the term in the edge's
`rationale`; never grade a body-text claim; never link two sentences of one box
— say what they say about each other between their statements
(`specializes`, `complements`). Related: [[box-granularity-per-sentence]],
[[relations-are-edges-not-fields]].
