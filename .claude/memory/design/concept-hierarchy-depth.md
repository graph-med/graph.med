---
name: concept-hierarchy-depth
description: The concept hierarchy has no fixed depth; `broader` goes as deep as subsumption does (three concept levels in POMGAT), families are whatever has no parent, a view with a scope tree folds them further under its root, and the site folds recursively.
metadata:
  type: project
---

`broader` edges are written wherever one concept is a special case of another,
and the hierarchy is as deep as that takes: in POMGAT three concept levels
(Whipple → Pankreaskopfresektion → Pankreasresektion; Rektumanastomose →
kolorektale Chirurgie). A family is simply a concept
with no `broader` edge. Existing
concepts serve as families where one fits (`pankreasresektion`,
`gastrektomie-oder-magenteilresektion`, `gastrointestinale-tumoroperation`),
and five were minted (`oesophagusresektion`, `leberresektion`,
`kolorektale-chirurgie`, `kardiale-dauermedikation`,
`perioperatives-risikoprofil`). Decided 2026-09-10 in chunk `broader-edges` of
pass 2. Since the scope stipulations left `broader` (WP-0031, card #190),
`broader` alone leaves the POMGAT patient groups seventeen families; the view
folds them by its scope tree, which hangs them under the guideline's patient
target group and gives the first question five answers
([[scope-tree-and-anchor]]).

**Why:** The open question weighed one fixed family layer against two. Writing
the edges showed that a fixed depth would force either a false edge (a Whipple
operation directly under "Pankreasresektion" skips the head resection the
source names) or a missing one. Truthful subsumption costs nothing at the data
level, and the site can fold any depth. Two families are deliberately *not*
linked by `broader` under the general "Operation eines gastrointestinalen
Tumors": `leberresektion` and the other organ families have benign indications
outside this guideline, and a concept hierarchy is meant to be reused by the
next guideline. A link that holds only inside the guideline's scope — the organ
families and the generic populations of chapters 4–5 under that operation, a
situation after an operation under the operation — is not subsumption at all
but a scope edge `in_scope_of` ([[scope-tree-and-anchor]]).

**How to apply:** Write a `broader` edge only for a true "is a" that holds
whatever guideline you read, with the rationale saying why (one true only in
this guideline's scope is `in_scope_of`); several parents only where the concept truly is a
special case of each. A value that combines freely with every family (the
operative access) is not a second parent but a dimension
([[access-is-a-dimension]]). Do not mint a family for a single
member. When a family concept would also fit a code, it gets `codes_as` like
any concept. The site folds recursively (`site-hierarchy`); never flatten to a
fixed depth in the build. Related: [[relations-are-edges-not-fields]].
