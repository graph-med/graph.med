---
name: quote-once-on-its-page
description: A claim's quote lies once on its page, counted the way the link's search counts (ignoring case, inside a word too). A recurring passage is lengthened until it is unique: a symbols cell with its row's head; a table's head that recurs is quoted from the caption or the sentence introducing the table. `--verify-quotes` refuses a recurring claim quote and reports any other recurring quote. Decided by the agent on the maintainer's delegation with card #347, 2026-10-11.
metadata:
  type: project
---

A claim's `quote` lies **once** on its page. A passage the page prints more
than once is lengthened, along the text it lies in, until it lies there once.
A symbols cell is quoted with its row's head ("Hämodynamische Instabilität:
Sehr niedrig ⊕⊕⊝⊝"). A table's head that recurs cannot be lengthened into a
passage both readings find once: the validator reads a table down its
columns, pdf.js along its rows. Such a head is quoted from the table's
caption, or from the sentence that introduces the table. `--verify-quotes`
counts a quote's places in its reading of the page, ignoring case, whether
inside a word or not. It refuses a claim's anchor that lies there more than
once. Any other quote that recurs, it reports and does not refuse: a grade, a
consensus, an evidence row or a grading scheme's word. Written into
`docs/graph-representation.md` §6.2, §3.1 and §5.1 K, and into
`tools/validate.py` (`places`). Of the other options on the card, card #347
rejected an occurrence index in the locator, which the link cannot carry, and
accepting repeats for non-anchor quotes only, which leaves the id collision.

**Why:** the link into the source (`#page=N&search=<quote>&phrase=true`)
runs pdf.js's find with `caseSensitive: false, entireWord: false` and lands
on the page's first match. A quote that recurs lands on the wrong row
whenever its place is not the first. A claim's id hashes its locator and its
quote ([[two-layer-identity]]), so two claims quoting one recurring passage
would share an id. On the pool of 2026-10-11, the count in the validator's
reading agreed with pdf.js's own find (pdfjs-dist 6.4.299) on all 1,381
quoted fields. It found three claim anchors that recur: two symbols claims
quoting „⊕⊕⊝⊝“, and a table claim quoting its head „Absolute Indikationen“,
which the page also prints in the sentence above the table. There were also
146 other quotes that recur, almost all a box's grade, consensus or evidence
row.

**How to apply:** before committing an extraction, run `--verify-quotes`.
For a claim it names, lengthen the quote along its passage, across the line
where the passage runs on, until it is unique; a symbols cell always takes
its row's head. Where lengthening runs into the next cell of a table read
along its rows, quote the caption or the introducing sentence instead. The
link should still find the quote, as [[quotes-whole-words-across-lines]]
requires. A re-cut renames the claim: script it, and rewrite every reference
in the same change. A reported quote needs no change. Related:
[[quote-gate-follows-the-site]] (the 100-character cap still holds).
