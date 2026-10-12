---
name: reference-marks-left-out
description: Every claim label — a sentence, a table row, an evidence key — leaves out the reference marks its passage prints (a number glued to a word, in brackets or in parentheses, pointing into the source's reference list) and keeps every number that is a value; the quote keeps a mark verbatim; which number is a mark is the judge's reading, never the validator's. Card #266, 2026-10-10 (option 1); recording the marks in a field of their own waits until a reader asks for the reference itself.
metadata:
  type: project
---

A claim's `label` is the sentence at its quote as printed — for a table, the
row §5.1 K reads — with its **reference marks left out**, and an evidence
`key` is read the same way. A reference mark is a number, or a range of
numbers, that the source prints to point into its own reference list: glued
to a word ("erfolgen55", "Caironi et al.249", "HAT486"), in brackets
("[274]", "[14,15]", "[73–75]") or in parentheses ("(19)"). Only the mark
goes, with the spaces and commas whose only job is to separate marks; the
sentence keeps its own punctuation and the words around the mark — an author,
an attribution ("nach Apfel 1999"), a cross-reference. A number that is a
value stays, however it is set: "HA330", "SpO2", "mm3", "Vitamin B1", a
bracketed interval ("95% KI [1.67, 2.58]"). The quote stays a verbatim
passage and keeps a mark where its passage holds one. Written into
`docs/graph-representation.md` §3.1 (the one rule), §5.1 K, §6.2 and §8.1, and
into question 1 of `.claude/agents/judge.md`; no schema change and no
validator check. Decided with card #266 on 2026-10-10: option 1 of its
question, the card's leaning, answered by the agent on the maintainer's
delegation and open to the maintainer at review. The question was settled
before its entry `reference-marks` was written into `docs/open-questions.md`,
so none was.

Until then only tables (§5.1 K) and evidence keys had a rule. The sepsis
chapter parts left every mark out of their labels by no written rule, while
five POMGAT labels kept their bracketed marks and others on the same pages did
not; the five were edited, their ids and quotes unchanged.

**Why:** the label is the proposition a physician reads, and a mark is no
part of it — §5.1 G2 already says a mark alone reports nothing. A glued mark
reads as a value: "HAT486" is HAT and reference 486 beside the device
"HA330", and "erfolgen55" looks like a count. Keeping the marks (option 2)
would put such numbers into labels and make tables and keys the exception.
The way back to the reference stays: the quote keeps the mark and the link
opens the page, while the pool holds no reference list
([[sources-referenced-never-rehosted]]). A mark is defined by what it points
to, not by its form, because the form does not tell it from a value, and the
next source sets marks in parentheses and prints bracketed intervals that are
values; so no list of one source's reference numbers and no validator check
can carry the rule ([[generic-over-guidelines]]), and the judge reads it.
Option 3 — the label leaves the marks out and a field records them as printed,
with provenance, so a reader can look the reference up — needs a schema and a
site change; it is taken up when a reader asks for the reference itself.

**How to apply:** write the label as the sentence prints it and drop each
reference mark with the spaces and commas that only separate marks
("verringert werden [274], [275]." → "verringert werden."; "reduzieren kann
[231], sollte" → "reduzieren kann, sollte"); keep the author, the attribution,
the cross-reference and every number that is a value; read a glued number
against the source's reference list where its form leaves it open. Cut the
quote verbatim: it keeps a mark where its passage holds one, and a glued mark
ends the word before it, so a quote may stop there. A footnote mark — a
symbol or a letter pointing to text on the same page, not into the reference
list — is not a reference mark, and whether a label keeps one is not decided
here. Where a mark is a word's only object ("Abbildung nach [1]"), leaving it
out leaves the word without one; no label holds such a passage yet, and a
pass that meets one names it in its pull request. Correcting a label is an edit with history and changes no
id ([[two-layer-identity]]). Related: [[body-text-rule]],
[[claim-evidence-per-outcome]], [[quotes-whole-words-across-lines]],
[[box-granularity-per-sentence]].
