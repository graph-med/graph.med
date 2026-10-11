---
name: figures-without-text
description: A figure printed as an image (its content has no text layer; the extracted text holds only its caption and footnotes) stays on the page, whether or not a marked recommendation delegates to it — no claim, statement, concept or edge holds its content; the delegating sentence is a claim as printed, the delegation in its label; the figure's footnotes follow it and stay on the page, except one that prints, in the text layer, a rule another place of the source prints otherwise — a claim of its own (kind by form, the figure's section, the footnote's line quoted), joined by `disagrees_with` to each claim printing the rule otherwise, no R, L or S edge (#379, the maintainer's principle that the graph reflects the text); its caption is a place like any other. A later transcription takes one route (caption quoted as anchor, modelling, the judge reading the rendered page, a person's attestation before display), and an algorithm reaches the graph only as `follows` edges read from the text or, later, an authored pathway of its own card. Card #327, Decisions 5–10 (2026-10-10, on the maintainer's delegation), and card #379 (2026-10-11); spec §5.1 F.
metadata:
  type: project
---

A **figure without a text layer** is one the source prints as an image:
`pdfimages` lists an image on its page and `pdftotext -layout` yields only its
caption and its footnotes. Such a figure **stays on the page**, whether a
marked recommendation delegates to it or not, and whatever it shows — a
summary of the recommendations, an algorithm, a schedule, a table drawn as a
picture. No claim, statement, concept or edge holds its content, and no label
carries a transcription of it. The sentence of a marked recommendation that
delegates to it ("proceed as the figure shows") is a claim as printed (§3.1),
the delegation in its label; its statement's action is what the sentence
names, the statement's label keeping "nach Abb. N", and no slot holds the
figure's content (#325's question 8). The figure's **footnotes follow the figure**,
as a table's follow the table, and stay on the page while its content does,
which answers #325's question 3 for a figure's footnotes. Its **caption** is
text and is read by §5.1 like any other place. A figure that has a text layer
is read by §5.1 as before (G2's voice, K's members). Written into
`docs/graph-representation.md` §5.1 F; no schema, validator or build change.

Decided on card #327 as its Decisions 5–10, on 2026-10-10, by the agent on
the maintainer's delegation (ADR-0009), by the card's leanings. The
physician's half of its question 1 was answered by the maintainer on
2026-10-11: what such delegated figures show is part of what their
recommendations recommend, and the first view holds the delegation and a link
to the page; transcribing doses and intervals is a later step. So the rule
stands, and the case for a later view's transcription is open
(`docs/open-questions.md`, figures-without-text).

The decisions the rule rests on, and the routes it leaves:

- **One rule for every image figure** (Decision 8). A summary figure, an
  algorithm no marked recommendation names and a delegated figure stay on the
  page alike. Where one adds to or disagrees with a marked recommendation, the
  pass that owns its page reads it against the recommendation; a disagreement
  is shown, never resolved — the graph reflects the text (the maintainer,
  2026-10-11; card #341 builds it): a footnote's line by the exception below,
  what only the image prints named and recorded until the figure question is
  answered.
- **A transcription, if a later view takes one** (Decision 6), is anchored by
  the caption, quoted; the transcription is `modelling` with a rationale; the
  judge (§8.1) reads the rendered page as an image, a change to
  `.claude/agents/judge.md` that needs a page renderer; a person's attestation
  (`expert_reviewed`, §8) comes before the view shows it. No figure or region
  fragment in `$defs.locator`, no OCR in the validator or CI. None of it is
  built.
- **An algorithm** (Decision 7). Where its steps are marked recommendations
  that the text also states, `follows` edges join their statements, read from
  the recommendations' wording and the text, never from the figure
  ([[sequences-are-edges]]); a step only the figure draws is named by the
  pass. An authored pathway (structural nodes, `branch` with `guard`, `about`,
  a `pathway` view) waits for open question decision-graph-derivation and
  #294's question 8, and comes as a card of its own (#115), never inside an
  extraction part. A statement per branch end is not taken: its claims would
  need a quote the image does not give.
- **The flowchart test** (Decision 10). Card #327 is the registration that
  #293's Out anticipated when it deferred algorithm figures to a later
  guideline. The test runs later, on a view that exists: the first view of a
  source with such a figure ships with the figure on the page, and #115 is
  scoped against that view, so that its pathway can be "read next to its
  derived graph", as decision-graph-derivation's "Settled by" asks.

**One exception, for a footnote that disagrees** (card #379, 2026-10-11). A
footnote that prints, in the text layer, a rule another place of the source
prints otherwise — a body-text place or a marked recommendation; another
value, time, group or rating for one term, case or action, as §5.1 D reads it
— is a claim of its own, by two decisions:

1. **The footnote's claim.** Its `kind` by form (§3.1), never graded (§5.1
   K); its `section` the figure's; its quote the footnote's line, once on its
   page (§6.2).
2. **The edge.** `disagrees_with` joins it to each claim that prints the rule
   otherwise, under §5.1 D, and it gets no `refines`, `limits` or
   `supplements`, which would read the one through the other.

The exception is narrow. A footnote that agrees with the text, or prints a
rule the text prints nowhere else, still follows its figure and stays on the
page. What the figure prints only in its image is unchanged: it stays on the
page whatever the text says, no quote reaching it, and a contradiction there
is named in the part's pull request and recorded on card #327, where the
figure question is postponed (open question figures-without-text). The
judge (`.claude/agents/judge.md`, questions 3 and 4) reads F with its
exception. The first case: a figure's footnote bounds a score „≥7“ (p. 82
l. 36 of the third guideline, Abb. 7's footnote c), the body text „> 6“ (p. 85
l. 16) for one group — equal only because the score is an integer, so two
printings, both recorded and the difference shown, never equated (card
#328, the maintainer's answer of 2026-10-11).

**Why:** a reference is a locator and a verbatim quote, and spec §6 promises
that a machine can verify the passage exists. For an image's words that fails
three ways: a reader's search finds no text in the image, the validator finds
nothing to match, and a claim's label is not checked by `--verify-quotes`, so
a transcription in a label would rest on review alone. "Proceed as the figure
shows" is a true account of what the recommendation says, and the claim's
link opens the source at the recommendation, the figure on its page or a few
pages on. Such figures can carry restart times, dosing intervals and bands of a
laboratory value, where a transcription error is the least visible and the
most consequential — which is why a transcription, if it comes, is read from
the image by the judge and attested by a person before anyone is shown it. A
figure's footnotes are keyed to marks inside the image, which no quote
reaches, so their meaning cannot be anchored apart from it — except where a
footnote's own line prints a rule the text prints otherwise: that line is
quoted text, the contradiction is the text's, and the maintainer's principle
holds, "the graph should always visualize contradictions in the text, never
resolve them … the graph reflects the text" (#341, [[source-disagreements-shown]]).
Keeping the footnote on the page with its figure would hide a contradiction a
quote can reach; `disagrees_with` shows it, and no R, L or S edge reads one
printing through the other. One rule for every image figure, and one
exception for every footnote whatever its figure, keep the rule generic
([[generic-over-guidelines]]). A `follows` edge rests on text a quote
reaches, an authored pathway of an image on none, so the one is written now
and the other waits for its own question.

**How to apply:** in an extraction, check each figure for a text layer
(`pdfimages -list`, and what `pdftotext -layout` yields on its page). For an
image figure: extract the delegating sentence as printed, the delegation in its
label; read the caption by §5.1; take no claim from the content, nor from a
footnote unless it prints, in the text layer, a rule another place of the
source prints otherwise — then a claim (kind by form, the figure's section,
the footnote's line quoted) joined by `disagrees_with` to each claim printing
the rule otherwise, no R, L or S edge; name in the pull request each such
figure, its footnotes, a step it draws that the text omits, and each place
where it adds to or disagrees with a marked recommendation — a disagreement
a footnote's line prints goes into the graph as above, one only the image
prints is named and recorded on card #327, and none is resolved. Never
write a figure's number as a node or a concept's name
([[document-structure-is-provenance]]), and never commit or publish the
figure, a crop or a redrawing ([[sources-referenced-never-rehosted]]). A place the source calls a table but
prints as an image is not decided here; a pass that meets one names it.
Related: [[body-text-rule]], [[view-page-is-a-decision-tree]].
