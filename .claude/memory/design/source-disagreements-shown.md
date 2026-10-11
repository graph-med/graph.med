---
name: source-disagreements-shown
description: The graph reflects the text — where a source disagrees with itself (two printings of one rule, two places' answers to one question, a rating's word against its symbols or its text), each printing is a claim as printed and `disagrees_with` (claim → claim, one source, symmetric, once per pair, modelling with a rationale quoting both sides) joins every pair; a concept reaches each printing of its rule by `defined_by` only where every pair is so joined; each side's card shows the other; nothing picks a side, smooths it over or names it only in a pull request. The maintainer, 2026-10-11 (#341).
metadata:
  type: project
---

**The graph reflects the text.** Where a source answers one question
differently in two places, or prints something ambiguously, the pool holds each
printing as a claim, an edge records the disagreement, and the site shows it on
the card of each side. No extraction, linking pass or build picks one side,
smooths the difference over, or names it only in a pull request. The
maintainer, 2026-10-11: "the graph should always visualize contradictions in
the text, never resolve them. this also applies to previous questions. the
graph reflects the text", and "ambiguities and contradictions are reflected in
the data and graph". Settled the open question source-disagrees-with-itself;
card #341 applied it, with three decisions taken that day on the maintainer's
delegation:

1. **The edge.** `disagrees_with`, claim → claim, between two claims of **one**
   source (two sources are `contests`, spec §11), symmetric, once per pair in
   either direction, never a claim to itself, `modelling` with a rationale that
   quotes both sides with their pages and says what they differ in. Among three
   printings every pair is joined. It carries no evidence and decides nothing.
2. **A concept with differing printings** reaches each by a `defined_by` edge of
   its own, each claim keeping its threshold as printed; the validator allows
   several only where every pair of those claims is joined by `disagrees_with`,
   otherwise one ([[derived-concepts-defined-by]]). Nothing computes a "true"
   bound.
3. **The display.** Each side's card shows the other in a line of its own,
   worded as the source's own inconsistency ("Die Leitlinie nennt hierzu
   abweichende Angaben:"), with the other side's sentence, page and the link
   into the source; a concept page with several printings lists them all.

How the rules read it (spec §3.1, §5, §5.1):

- **Body text, D before R.** A place that answers a recommendation's term,
  case or action otherwise than the recommendation itself prints it is a
  claim joined to the recommendation's claim by `disagrees_with`, and gets no
  `refines`, `limits` or `supplements` to it, which would read the one through
  the other. Places that answer a term the recommendation leaves open each get
  their R, L or S edge and are joined to each other. A distinction one place
  draws and another erases or denies is a disagreement; two answers that
  differ only in kind for the same groups (an ideal time beside a latest one)
  are none ([[body-text-rule]]).
- **A rating's word against its symbols**: the word stays the evidence entry's
  value, the symbols become a `fact` claim of their own (the row read "Kopf:
  ⊕⊕⊝⊝", quoting the symbols, with the box's number and section), joined to
  the recommendation's claim. A rating the body text gives otherwise than the
  box is a `fact` claim joined the same way (§5.1 N2).
- **Two marked recommendations** that answer one question differently keep
  their statements as §3.1 links them, and their claims are joined as well.
- **A figure without a text layer** cannot be quoted: the claim of its caption
  is its side, and the rationale says what the image shows, as read off it and
  not quoted.

The first cases, in the second source (#341): high-volume haemofiltration,
"> 50 ml/kg/h" (p. 99) against "≥ 50ml/kg/h" (p. 101), one concept with two
printings; the time to the first antimicrobial dose, box 3.2 (the hour for
septic shock, "so schnell wie möglich" for sepsis) against p. 39 (the hour for
both) and p. 41 (at the latest three hours "unabhängig davon, ob ein Schock
vorliegt oder nicht"), p. 39's `refines` to 3.2 removed; and the word "Sehr
niedrig" over ⊕⊕⊝⊝ in boxes 6.7 (p. 95) and 8.11 (p. 117).

**Why:** a disagreement named only in a pull request is gone for the reader:
a physician reads the card, not the review thread. An edge that picks the
printing that fits (`defined_by` to one page, `refines` that reads a body-text
hour into a box that withholds it) answers a question the source left open,
and the answer looks like the guideline's. Claims never merge
([[two-layer-identity]]), so every printing already had a place; what was
missing was the relation saying they differ, and a display that shows it.

**How to apply:** when a pass meets two places of one source that answer one
question differently, extract both as printed, join them with
`disagrees_with` (rationale: both sides quoted with pages, and what differs),
give each the edges the rules give it — never one that reads one side through
the other —, and let the site show it. Between two sources use `contests`.
Never resolve by page order, by which passage is the guideline group's
decision, by recency or by what seems clinically likelier. Related:
[[generic-over-guidelines]], [[claim-evidence-per-outcome]].
