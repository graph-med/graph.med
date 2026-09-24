---
name: box-granularity-per-sentence
description: The unit of a claim is the sentence of a marked recommendation, not the box; a box with several sentences is several claims sharing its recommendation_no, every sentence whatever its form; the box's printed grade goes to its recommendation and gap-notice sentences (one per wording where it prints several, like "A/B"), its consensus to every sentence, never a grade to a fact, criterion or definition; the physician confirmed the split is clinically right.
metadata:
  type: project
---

A recommendation *box* is not the unit of a claim; a *sentence* is. A box that
holds several sentences with their own verbs and directions (POMGAT 4.1: kann /
soll / sollte nicht / soll) becomes several claims sharing the box's
`recommendation_no`. A box is therefore not automatically one node in the
graph. Decided 2026-09-11 when the physician reviewed the live site; applied in
`docs/graph-representation.md` §3.1 and throughout `data/claims/`.

Every sentence of the box is a claim, whatever its form — a remark, an
extension ("Dies gilt auch für …"), a fact, a dose, a definition, a gap notice
beside a recommendation. What the box prints once reaches them by one rule
(card #213, 2026-09-24, the agent's proposal awaiting the maintainer):

- the **grade** goes to every sentence of recommendation or gap-notice form,
  whatever its wording: a remark worded "sollte" in a box graded by another
  scheme's word carries the box's grade, since the box prints the grade for
  the box. Where the box prints one grade per wording ("A/B" over a *soll*
  and a *sollte* sentence), each sentence carries the one whose wording its
  verb is. A fact, criterion or definition carries none;
- the **consensus**, and its share, goes to every sentence;
- the **verb** is the sentence's own ([[grading-scheme-on-the-source]]).

A recommendation-form sentence supports a statement of its own; a fact or
criterion supports the statement of the sentence it extends, restricts, fills
or gives the reason for, and one of its own only where it states another action
or comparison (POMGAT 5.2's second sentence) or the box holds no recommendation
(POMGAT 7.11); a definition supports none and is reached by `defined_by`; a gap
notice stays unlinked.

**Why:** a claim carries one verb and one direction by schema, and per-sentence
claims are what keep statements at the smallest independently contestable unit.
The first expert reviewer wanted the fine split — it is "fachlich sinnvoll" —
and the box stays recoverable through the shared `recommendation_no`. The
earlier wording, "the one grade its verb maps to (A↔soll, B↔sollte, 0↔kann)",
described only the first source's "A/B" boxes and fails as soon as a box's
wording is not its scheme's (an EK box saying *soll* and *kann*, a GRADE box
with an AWMF *sollte*). Reading the grade as printed for the box, and never
giving it to a sentence that recommends nothing, changes no claim of the first
source and never grades a sentence from its neighbour.

**How to apply:** extract per sentence; never merge sentences into one claim to
match the box. Give the box's grade and consensus as above, and nothing the box
does not print. Where an expert judges that a particular box should read as one
recommendation, that is a proposal about that box, made through the review and
feedback mechanism (a card on the board, once registered), not a change of the
rule. Related: [[relations-are-edges-not-fields]], [[body-text-rule]],
[[derived-concepts-defined-by]].
