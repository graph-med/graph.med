---
name: anchor-dimension-or-subgroup
description: Which slot a value takes is decided by four questions asked per statement — primary index → anchor, "is a" that changes what → subgroup, orthogonal from a closed list → dimension, otherwise condition; "varies with the recommendation" and "what the asking person brings" both fail.
metadata:
  type: project
---

A value that attaches to a statement takes its place by four questions, asked
in order and **per statement, not per concept**:

1. **Is it the guideline's primary index** — what its recommendation chapters
   are keyed on, what you must know before you can look anything up?
   → **anchor** (the slot the view declares).
2. **Is it a thing in its own right that is a special case of another?** Test:
   "X is a Y", and it changes *which* thing is present, not merely *how* it is
   done. → **subgroup** (`broader`), or a scope edge where the sentence holds
   only inside this guideline ([[relations-are-edges-not-fields]]).
3. **Does it combine freely with every anchor value, from a closed, named
   list?** → **dimension** (a slot a dimension axis declares,
   [[grouping-axes-proposed-and-tested]]).
4. Otherwise → **condition**: the circumstance of the individual case, open
   value range, no partition.

Whether an anchor value is observed or computed does not enter into this. That
decides only how the value is obtained, never which slot holds it. Decided by
the maintainer on 2026-09-21.

**Why:** two rules were in circulation and neither separates. The
specification's "if it varies with the recommendation, it is a dimension"
(§4.1) is true of any patient group as well — different populations are *for*
getting different recommendations — so it makes everything a dimension. And
"the anchor is what the asking person brings" fails wherever the index is
derived: CAP anchors its therapy chapters on a severity computed from CRB-65,
so a validator admitting only observable anchors would make CAP unmodelling.
The discriminator that does hold for the dimension case is **orthogonality**,
not variation: `minimalinvasive-kolorektale-resektion` needed two parents
precisely because access and organ combine freely and were forced into one
tree ([[access-is-a-dimension]]). Checked against twelve values from five
guidelines (POMGAT, PAP, Schmerz, VTE, CAP, NVL Herzinsuffizienz); all resolve,
and no decision already taken is overturned.

**How to apply:** run the four questions before adding a slot, an edge or a
concept, and record which question decided. A concept may be the anchor of one
statement and the condition of another — that is a role, not a contradiction,
and the pool already does it (`ponv-risikofaktoren`,
`elektiver-abdominalchirurgischer-tumoreingriff`). Where question 2 is
tempting but the value is only expressible as a compound ("minimally invasive
colorectal resection"), it is a qualifier and belongs in a slot, not in a
concept name.
