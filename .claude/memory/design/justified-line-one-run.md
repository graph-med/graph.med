---
name: justified-line-one-run
description: A line set in justified type reads as one run inside its column. Two neighbouring pieces of a line are one where another line of their block (the lines between two blank lines) runs across the whole gap and none starts a piece inside it; both tests, since neither alone tells a column. Settles justified-spacing-in-a-quote. Decided by the agent on the maintainer's delegation with card #371, 2026-10-11.
metadata:
  type: project
---

The validator reads a page in columns (`tools/validate.py` `page_reading`).
It cuts each line at runs of two or more spaces, where the columns of a box
or a table part. A line set in justified type has such runs between its
words as well, and since card #371 it stays one inside its column
(`line_pieces`). Two neighbouring pieces of a line are one, read with one
space between them, where the gap between them lies inside one column of the
line's block, the lines between two blank lines:

- another line of the block runs across the whole gap (the card's option 1,
  the column as the lines above and below set it);
- no other line of the block starts a piece inside the gap, up to where the
  second piece starts (the card's option 2).

Both tests are read off the lines as cut, before any piece is joined. A
quote across a justified line is written as its words read, one space
between them. Written into `docs/graph-representation.md` §6.2.

**Why:** box 5.4 of the Vorhofflimmern guideline prints its second item's
bound justified, „Bei    einem      ermittelten CHA2DS2-VA      Score    von   1“
(p. 40, l. 45). The old cut gave seven pieces, and every piece that holds the
bound also lies elsewhere on the page. So §3.1's narrower claim of the bound
could not be quoted under the once-rule ([[quote-once-on-its-page]]), and
the group it defines stood without its `defined_by` edge
([[derived-concepts-defined-by]]). The open question had three options:

- cut the quote to the piece naming the term: that piece recurs on l. 43;
- one reference per piece: every piece recurs;
- join the pieces of one line whose gaps lie inside one column of the box:
  the only option left, and the card took it.

Its open question 1 asked how a column is told. Each test was measured alone
and together over all 1,596 quoted fields of the three sources (201 pages),
against the reading before:

- **The no-start test alone** failed one quote and moved the first match of
  another. Tabelle 9 (Vorhofflimmern p. 39) sets its rows apart by blank
  lines, so no other row in a row's block starts the points column, and
  row D's cells joined.
- **The runs-across test alone** changed no quote, but it made 319 joins,
  some of them wrong. Where a heading shares a box's block, it joined the
  box's label to the box's text: Sepsis p. 103, „Empfehlungsgrad: ‖ Wir
  schlagen vor …“. It also joined table cells that wrap: Sepsis p. 142.
- **Both together** changed no quote's whole-word result, place count or
  first-match place. There were 181 recurring-quote notices before and 181
  after. The validator's count then agreed with pdf.js's own find
  (pdfjs-dist 6.4.299) on all 1,598 quoted fields, including „Score von 1“.
  Before the change it had missed that one.

Both tests together make 112 joins over every page of the three sources.
Each one reads a line along its row:

- justified lines in boxes, in body text, in a table's head (Vorhofflimmern
  p. 41) and in Sepsis' reference list;
- a section number with its title;
- a box's header row, where the line below runs across it.

The tests name no source, column or word ([[generic-over-guidelines]]). The
link into the source needs no change: its search is pdf.js's, which reads
along rows, and it already found the justified line as one.

**How to apply:** quote a justified line with one space between its words,
like any other line. Where `--verify-quotes` still finds such a quote
missing, the line's block holds a piece of another line that starts inside
a gap, or no line runs across the gap. Say so in the pull request and quote
a piece that does read whole. Do not widen the rule for one page: any
change to the cut is measured over every quoted field, before and after, as
#371 did. Related: [[quotes-whole-words-across-lines]] (the run-on and the
line-end hyphen are unchanged).
