---
name: facet-boundaries
description: Between the facets `patient_state` and `finding` a concept's label decides by what it names — what the patient has or is, acute or pre-existing, stated or derived by a rule, is `patient_state`; a measured or observed result (a quantity a threshold bounds, a value named as one, signs, a test result) is `finding`; a derived concept is no finding for being derived; a circumstance and an endpoint stay two concepts.
metadata:
  type: project
---

`patient_state` is what the patient has or is, acute or pre-existing: a
disease, an organ dysfunction, a risk, a need for a measure or a
contraindication to one. `finding` is a measured or observed result that
triggers a decision: a measured or scored quantity (the one a threshold
bounds), a value the label names as one, signs, the result of a test. Where a
term could be either, the label decides by what it names: "anhaltender
Vasopressorbedarf" names a need the patient has, "Noradrenalindosis" the
quantity its rule bounds; "Einschränkung der arteriellen Oxygenierung
(PaO2/FiO2 < 150 mmHg)" names an impairment, "Hb-Wert von < 4,34 mmol/L" a
value. A concept derived by a rule (spec §3.2) is no finding for being
derived; the quantities its rule bounds are. A term the source uses both as a
circumstance and as an endpoint stays two concepts, the circumstance and an
`outcome`. Spec §3.2. Decided 2026-10-11 by the maintainer (option 1 of open
question facet-boundaries, answered under #314's question 4; card #342).

**Why:** The facets were drawn from a surgical guideline whose patient states
were all pre-existing ("a risk profile or pre-existing condition"), with
`finding` as "a result that triggers a decision". An intensive-care
guideline's acute states fell between the two, and its chapter parts chose
differently for the same kind of term: "Vasopressorbedarf" `patient_state`
(2.6), "anhaltender Vasopressorbedarf" `finding` (8.1); "Volumenmangel" beside
"angemessener Flüssigkeitsstatus"; "Hypoperfusion" beside "Sepsis-induzierte
Hypoperfusion oder septischer Schock". "Triggers a decision" sorted nothing,
since every condition of a statement triggers one. The rejected options were
a facet of its own for acute states (a third side to the same line, and a
schema change), the endpoint check reading a concept's role instead of its
facet (it would let a subgroup or a comparator into an evidence row, which the
`outcome` check keeps out: [[claim-evidence-per-outcome]]), and leaving the
pairs as they were for review. The pass that settled it moved 20 of the 96
concepts of the two facets: 19 from `finding` to `patient_state`, and "keine
zusätzliche Gabe von Antiemetika", which names a drug's administration, to
`medication`; no `patient_state` concept moved.

**How to apply:** When minting or reviewing a concept of either facet, ask
what its label names: a state of the patient — whatever its time course, and
whether a clinician states it or a rule establishes it — or the value, sign or
test result a measurement or an observation yields. A need, an indication or a
contraindication, an intolerance or a tolerance, a risk, and a therapy goal
reached are states. The quantity of a threshold is a `finding`; the concept
the threshold establishes is not, by that alone. Never merge a condition with
the endpoint of the same words; the `outcome` check stays on the facet. The
rule holds for every guideline ([[generic-over-guidelines]]); a facet decides
no grouping, since only a dimension's values have a facet of their own,
`qualifier` ([[grouping-axes-proposed-and-tested]]). Related:
[[derived-concepts-defined-by]].
