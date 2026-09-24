---
name: access-is-a-dimension
description: The operative access is a statement dimension (`axes/zugang`: offen, minimalinvasiv), never part of a population concept's name; robotic assistance is minimally invasive; a statement without a placement means the guideline does not distinguish, never "applies to both"; asserted but not in `group_by`.
metadata:
  type: project
---

The operative access is carried by the dimension axis `axes/zugang` (key
`zugang`), with the two values `offen` and `minimalinvasiv` (facet
`qualifier`); since card #202 a statement's value is the axis's placement,
not a slot of the statement ([[grouping-axes-proposed-and-tested]]). It is never baked into the name of a population concept. Three
rules came with the decision, set by the physician on 2026-09-21:

- **Robotic assistance is `minimalinvasiv`**, not a third value. A guideline
  that separates the two gets a further value; the existing one is never
  redefined, because that would silently change what already-asserted
  statements mean.
- **Where the access determines *which* operation was performed**, and the
  recommendation follows from that operation's anatomy rather than from how
  invasively it was done, it is not a dimension value: transthoracic
  oesophagectomy and oesophagectomy with cervical reconstruction stay
  procedure concepts with `broader` edges.
- **No placement means the guideline does not distinguish here** — never
  "applies to both". POMGAT names the access in 4 of its 90 recommendations;
  filling the other 86 would assert something the source does not say.

A concept that only enumerated procedures (7.12, "Kolonresektionen oder
(tiefe) anteriore Rektumresektionen") keeps a concept of its own without the
access, because the physician read the enumeration as a restriction, not as a
paraphrase of the broader family.

**Why:** the access sat in the names of four population concepts, so the same
fact lived in four places, and one of them carried it as a *second* parent —
the only multiple classification in the pool, over which one statement reached
two roots. Access and organ are orthogonal — every operation can be open or
minimally invasive — so a single hierarchy cannot hold both, and a compound
such as "minimally invasive colorectal resection" is a qualifier forced into a
concept name. The proof that it is not mere subsumption is in the data: POMGAT
7.9 (grade B) recommends epidural analgesia for open oncological visceral
surgery with "sollte", 7.10 (EK) allows it for minimally invasive surgery only
under a risk constellation — same action, same patient group, and both the
recommendation and its grade flip with the access. The rejected alternative
was to carry the access in the `condition` slot: that slot is for the clinical
circumstances of the case, and a procedural qualifier does not belong there.

**How to apply:** the axis is asserted but deliberately **not** offered in
`group_by` — at 4 of 90 statements it cannot group a view. Assertion and
offering are two steps ([[grouping-axes-proposed-and-tested]]), so a sparse
qualifier reaches the statement's card without appearing in the switch. Another
guideline's qualifier of the same shape gets the same mechanism, not a new one
([[generic-over-guidelines]]). No population concept carries the access in its
name: a statement whose sentence names it hangs on the access-free stem, with
the access in its placement, so that a pair told apart only by the access (7.9 and
7.10) stands under one node and is read as a pair.
