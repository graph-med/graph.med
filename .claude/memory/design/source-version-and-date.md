---
name: source-version-and-date
description: A source records its version (text as printed, "1.0") and the date it prints for that version (its "Stand", ISO 8601 at the printed precision, "2023-11", "2025-04-30") as fields of their own, each quoted; the title is the title proper; the page shows both on a line of their own, in the page chrome's words, and never ranks by the date (#265, 2026-10-10); a field the source prints two ways is a list of its printings, each with its own quotes, in page order, none chosen (#366, 2026-10-22).
metadata:
  type: project
---

A source's `version` and `date` are fields of their own (schema 0.22.0,
`$defs.source`), both optional and both `x-provenance: required`. Each carries
its quotes under `provenance.version` and `provenance.date`, which
`--verify-quotes` checks. `version` is the label as printed, without the word
for it ("1.0", "4.0"). `date` is the date the document prints for that version
(its "Stand"), written as ISO 8601 at the precision printed: `YYYY`, `YYYY-MM`
or `YYYY-MM-DD` (`$defs/date_at_precision`; `$defs/date` stays a full day).
It is not a register's publication date, an adoption date or a download date.
The validator holds the date to the calendar and the version's words to its
quotes. Reading "November 2023" as `2023-11` is left to review. The `title` is
the title proper, as the cover prints it; the document's form ("Langversion",
"Langfassung") stays in the id. The site says both on one line wherever a page
names the source: the index's box and entry, the view's root and sheet, a
card's citation, the source's and a claim's page. The line is "Version 1.0,
Stand November 2023", in the page chrome's words (`tools/site/words/`,
`source`), with the month names, and it is left out for a source that records
neither. The validity period is not recorded. The agent decided this on
2026-10-10 on the maintainer's delegation, by the card's leaning (card #265,
Decision 1, option 3).

**Printed two ways** (card #366, 2026-10-22, the agent on the maintainer's
delegation, by the card's leaning). Where the document prints its version or
that date differently in two places, the field is a list of its printings
(schema 0.25.0, `version_printing`, `date_printing`): at least two, each
`{version, source}` or `{date, source}`, the value as those places print it
with its own quotes, and no `provenance.version` or `provenance.date` beside
it. Each value is listed once (one value printed in several places is one
printing with a quote for each), in the order of the pages that first print
them. The validator holds each printing to its own quotes and checks the
order. The line names every printing with its pages: "Version uneinheitlich
angegeben: 1.1 (S. 1) und 1 (S. 4, 11), Stand 14.04.2025". The first case is
the third source, whose cover prints "Version 1.1" and whose citation line
(p. 4) and methods paragraph (p. 11) print "Version 1". A field printed one way
keeps its one value, so the other sources are unchanged.

**Why:** Both titles carried version and date joined by the extractor, a string
no page prints, and one date was a month while the other was a day. The page
could neither show them apart nor tell two versions apart without reading
titles. A version is a label, so it stays text. A date at its printed precision
is language-neutral and comparable, and its quote keeps the printed form
checkable. Recency resolves nothing (spec §3.4, §11 rule 4), so a date is shown
and never used to rank. A source's version is no view's cut and pins no edge
([[pool-and-views]]). A version printed two ways is the source's own
inconsistency, and the graph reflects the text
([[source-disagreements-shown]]): a single `version` would choose one printing
(the cover's, say) and leave the other in a YAML comment, which no reader sees.
`disagrees_with` joins claims, and a source's version is no claim, so the
field itself holds the printings. A field `also_printed` beside it would make
the first printing the value and the others an addendum, which is a ranking. A
list of bare labels with positional quotes could not hold "1" to its own
place, because "1" lies as a whole word inside "Version 1.1". Page order makes
the first printing first by its page, not by choice.

**How to apply:** When a source is added, record its version and that date
quoted from the document at its public URL
([[sources-referenced-never-rehosted]]). Quote the date in YAML (an unquoted
day loads as a date, not a string), and keep version and date out of the
title. Where a document prints its version or that date two ways, record
every printing as a list, each with its quotes, in page order, and choose none.
Never parse anything out of a title in the build, and never
compare dates there. The line's words and month names are page chrome
([[page-chrome-in-the-view-layer]]), never `CARD_WORDS`, even inside the card,
so that they have one home. A field for the validity period waits until a view
needs to flag an expired source. Related: [[generic-over-guidelines]]: no field
name or word is one register's.
