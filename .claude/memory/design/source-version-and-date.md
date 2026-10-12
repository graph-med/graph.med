---
name: source-version-and-date
description: A source records its version (text as printed, "1.0") and the date it prints for that version (its "Stand", ISO 8601 at the printed precision, "2023-11", "2025-04-30") as fields of their own, each quoted; the title is the title proper; the page shows both on a line of their own, in the page chrome's words, and never ranks by the date (#265, 2026-10-10).
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

**Why:** Both titles carried version and date joined by the extractor, a string
no page prints, and one date was a month while the other was a day. The page
could neither show them apart nor tell two versions apart without reading
titles. A version is a label, so it stays text. A date at its printed precision
is language-neutral and comparable, and its quote keeps the printed form
checkable. Recency resolves nothing (spec §3.4, §11 rule 4), so a date is shown
and never used to rank. A source's version is no view's cut and pins no edge
([[pool-and-views]]).

**How to apply:** When a source is added, record its version and that date
quoted from the document at its public URL
([[sources-referenced-never-rehosted]]). Quote the date in YAML (an unquoted
day loads as a date, not a string), and keep version and date out of the
title. Where a document prints two versions, say which one was chosen in the
pull request. Never parse anything out of a title in the build, and never
compare dates there. The line's words and month names are page chrome
([[page-chrome-in-the-view-layer]]), never `CARD_WORDS`, even inside the card,
so that they have one home. A field for the validity period waits until a view
needs to flag an expired source. Related: [[generic-over-guidelines]]: no field
name or word is one register's.
