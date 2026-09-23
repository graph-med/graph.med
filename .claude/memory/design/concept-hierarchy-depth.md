---
name: concept-hierarchy-depth
description: The concept hierarchy has no fixed depth; `broader` goes as deep as subsumption does (three concept levels in POMGAT), families are whatever has no parent, and the site folds recursively.
metadata:
  type: project
---

`broader` edges are written wherever one concept is a special case of another,
and the hierarchy is as deep as that takes: in POMGAT three concept levels
(Whipple → Pankreaskopfresektion → Pankreasresektion; Rektumanastomose →
kolorektale Anastomose → kolorektale Chirurgie). A family is simply a concept
with no `broader` edge; the patient groups fold into ten of them. Existing
concepts serve as families where one fits (`pankreasresektion`,
`gastrektomie-oder-magenteilresektion`, `gastrointestinale-tumoroperation`),
and five were minted (`oesophagusresektion`, `leberresektion`,
`kolorektale-chirurgie`, `kardiale-dauermedikation`,
`perioperatives-risikoprofil`). Decided 2026-09-10 in chunk `broader-edges` of
pass 2.

**Why:** The open question weighed one fixed family layer against two. Writing
the edges showed that a fixed depth would force either a false edge (a Whipple
operation directly under "Pankreasresektion" skips the head resection the
source names) or a missing one. Truthful subsumption costs nothing at the data
level, and the site can fold any depth. Two families are deliberately *not*
linked under the general "Operation eines gastrointestinalen Tumors":
`leberresektion` and the other organ families have benign indications outside
this guideline, and a concept hierarchy is meant to be reused by the next
guideline; the generic populations of chapters 4–5 are linked to it with a
rationale naming the guideline's scope.

**How to apply:** Write a `broader` edge only for a true "is a", with the
rationale saying why; several parents only where the concept truly is a
special case of each. A value that combines freely with every family (the
operative access) is not a second parent but a dimension
([[access-is-a-dimension]]). Do not mint a family for a single
member. When a family concept would also fit a code, it gets `codes_as` like
any concept. The site folds recursively (`site-hierarchy`); never flatten to a
fixed depth in the build. Related: [[relations-are-edges-not-fields]].
