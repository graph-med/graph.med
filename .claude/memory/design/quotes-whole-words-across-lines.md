---
name: quotes-whole-words-across-lines
description: A quote is a passage of its page in whole words and may cross a line break of the extracted text — the break read as a space, a line-end hyphen as the printed word reads (dropped where it breaks the word, kept where it belongs); the validator reads the page in columns and accepts either reading of a line-end hyphen; a connective broken by a line is one piece. Decided by the maintainer with card #316 (registered 2026-10-06), settling the open question line-break-hyphen.
metadata:
  type: project
---

A `quote` — a claim's anchor and every other quoted field — is a verbatim
passage of its page's `pdftotext -layout` text in **whole words**: it neither
starts nor ends inside a word, and it may run across a line break where the
text runs on, to the next line or, where a box or a table interleaves its
columns, to the next line of the same column. The break reads as a space; a
hyphen at its end reads as the printed word does — dropped where it breaks
the word ("Volu-" + "men" → "Volumen"), kept where it belongs to it
("Povidon-" + "Iod" → "Povidon-Iod", "Rektum-" + "und" → "Rektum- und"). A
connective whose word the page breaks at a line end is that one word
("Gleichzeitig"), inside one quote. Labels stay the sentence as printed and
are no quotes. Written into `docs/graph-representation.md` §6.2 and §3.1,
schema 0.16.0, and `tools/validate.py` (`page_reading`, `quote_pattern`, and
the whole-word check).

Until then a quote was "contiguous on one line" of the extracted text, so a
long passage was cut at the line end: 162 of the pool's 1,377 quoted strings
began or ended inside a word, 117 of them in a line-end hyphen ("… Vasop-"),
others with the tail of a broken word ("ren arteriellen Blutdruck"), and
Definition 2's connective read "Gleichzei- … tig". The open
question line-break-hyphen leaned towards keeping the one-line exact match
and cutting new quotes on whole words; the maintainer chose the third option,
the check joining a line end, when an external review of the read-only server
found four of six quotes of one statement cut (card #316).

**Why:** a quote is the highlight target of the link into the source
(`#page=N&search=<quote>&phrase=true`), the text a reader copies into a
viewer's find, and the reviewer's check. A cut word is found by none of
them: pdf.js's own find, run on the two sources, found 911 of the 1,022
distinct quoted strings before the re-cut, every miss but two a quote ending
in a line-end hyphen, the two holding an ASCII double quote, which pdf.js
strips from a link's search; after it, every one. pdf.js joins a line break as a
space and drops a line-end hyphen between two lower-case letters, after a
capital or after a letter with a diacritic, keeping any other — so a quote
that reads the page's words is what it finds. Whether
a line-end hyphen breaks a word or belongs to it is not visible in the text
(pdftotext's own reading-order mode drops every one, "PovidonIod"), so it is
the extractor's reading, stated in the quote, and the validator accepts
either; the whole-word check refuses what it can tell is cut.

**How to apply:** cut a quote on whole words, across the line where the
passage continues; write a hyphen at a line end as the printed word has it,
checking the same word elsewhere in the document where it is unclear; where
the sentence allows, avoid a kept hyphen at a line end between two
lower-case letters, after a capital or after a letter with a diacritic, which
pdf.js reads as a broken word; hold no ASCII double quote, which pdf.js strips
from the link's search (the validator refuses one); stay within the server's
100 characters ([[quote-gate-follows-the-site]]). Re-cutting
an existing quote renames its claim (the id hashes locator and quote,
[[two-layer-identity]]): script it, rewrite every reference in the same
change, and name the count in the pull request. Related:
[[derived-concepts-defined-by]], [[body-text-rule]].
