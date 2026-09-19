---
name: box-granularity-per-sentence
description: The unit of a claim is the recommendation sentence, not the box; a box with several sentences is several claims sharing its recommendation_no, and the physician confirmed the split is clinically right.
metadata:
  type: project
---

A recommendation *box* is not the unit of a claim; a recommendation *sentence* is.
A box that holds several sentences with their own verbs and directions (POMGAT
4.1: kann / soll / sollte nicht / soll) becomes several claims sharing the box's
`recommendation_no`, each carrying the single grade its verb maps to under the
AWMF scheme (A↔soll, B↔sollte, 0↔kann). A box is therefore not automatically one
node in the graph. Decided 2026-09-11 when the physician reviewed the live site;
applied in `docs/graph-representation.md` §3.1 and throughout `data/claims/`.

**Why:** a claim carries one verb and one direction by schema, and per-sentence
claims are what keep statements at the smallest independently contestable unit.
The open question was whether a reviewer would want the box back as an addressable
unit; the first expert reviewer wanted the opposite — the fine split is "fachlich
sinnvoll". The box stays recoverable through the shared `recommendation_no`.

**How to apply:** extract per sentence; never merge sentences into one claim to
match the box. Where an expert judges that a particular box should read as one
recommendation, that is a proposal about that box, made through the review and
feedback mechanism (a card on the board, once registered), not a change of the rule.
Related: [[relations-are-edges-not-fields]].
