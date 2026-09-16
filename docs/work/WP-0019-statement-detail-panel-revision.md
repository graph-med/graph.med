---
id: WP-0019
title: Statement detail panel — drop neighbours, banner carries the evidence, no duplicate fields
status: review
created: 2026-09-16
updated: 2026-09-16
depends_on: []
blocks: []
owner: agent
initiative: ui
kind: build
slug: statement-detail-panel-revision
---

## Outcome

The statement detail section (`tools/site/templates/details.html`, rendered both
under the graph and on the entity page) reads as the maintainer asked after
reviewing the live view:

1. The sixth question, "Would the answer be different in a neighbouring
   situation?", is gone — its heading, its three lists (same group, same action,
   linked statements) and the CSS that styles them.
2. The banner (question 1, "What should I do?") reads correctly for an
   against-direction statement: today its small verb text shows the bare verb
   ("soll", "sollte"); it must read "soll nicht" / "sollte nicht", the same
   "verb + nicht" the per-claim tags in question 3 already use for
   `direction: against` (`details.html` line 38).
3. The banner also carries each supporting claim's grade and consensus level —
   "how binding and how well supported" (question 3) answered where the
   physician looks first, not only further down the sheet.
4. Question 5, "Where exactly is it written?", shows one citation link when the
   statement rests on a single recommendation claim. When question 4's
   body-text relations (refines/supplements/limits) contribute further textual
   sources, question 5 lists each source reference labelled with the claim or
   body-text item it belongs to — never an undifferentiated list of links.
5. No fact is shown twice anywhere in the panel. `recommendation_no` today
   appears both in question 3's claim tags and question 5's citation line; that
   and any other duplicate this package finds are reduced to the one section
   where the fact belongs.

`docs/publication.md` §3 ("What the section shows") is rewritten to match: the
six questions become five, the banner's paragraph gains the grade/consensus
sentence, and question 5's paragraph states the single-link default and the
multi-source exception.

## Scope

In: `tools/site/templates/details.html` (the `statement` branch), `tools/build.py`
(`direction_of` for the "nicht" fix; whatever assembles the banner's data grows
to carry grade and consensus; the `neighbours_of` call and, if nothing else
uses it, the `neighbours_of` method itself), `tools/site/static/site.css`
(banner layout for the added badges; removal of the now-unused neighbour
styles), `docs/publication.md` §3.

Out: any other question's content beyond removing the duplicate fields item 5
names; the `grade-derivation` open question (`docs/open-questions.md`) — this
package relocates each claim's *own* grade and consensus into the banner, the
same per-claim facts question 3 already computes, and does not derive a single
statement-level grade; a statement's box on the graph itself (unaffected —
WP-0006 covers it); schema or data changes (none needed — grade and consensus
are already claim slots).

## Constraints

- `ui` initiative: `tools/build.py` and `tools/site/` only, no data or schema
  change (`docs/work/initiatives/ui.md`); the design doc amendment rides along,
  as WP-0006 did for `docs/publication.md`.
- "Grades are shown, never composed" (`docs/publication.md` §3) stays true: the
  banner enumerates each supporting claim's own grade and consensus, it does
  not compute one derived grade for the statement. If several supporting
  claims disagree in grade or consensus, show all of them, exactly as question
  3 already does for grade (letters joined "A/B").
- No two sections of the panel may state the same fact about the same claim.
- Checked in a browser, desktop and phone, light and dark, with the
  `screenshot` skill; the pull request links the preview
  (`docs/work/README.md`, `AGENTS.md`).

## Decisions

- 2026-09-16 — the maintainer, after reading the live detail panel, decided all
  five points above; this registration records them, an implementing session
  carries them out.
- 2026-09-16 — implementing session. (a) "No fact twice" applied to grade,
  verb and consensus: they stand in the banner for every claim the banner
  carries (the supporting claims `direction_of` reads), so question 3 shows
  them only for a claim the banner does not carry — a contesting claim, or any
  claim when no banner is drawn; question 3 otherwise shows each claim's
  sentence, its `contests` mark and its kind. (b) The banner shows one badge
  group per *distinct* (grade, consensus) pair in claim order, not one per
  claim: two sentences of one box share both and would read as a repetition.
  (c) The recommendation number lives in question 5 only; it is gone from
  question 3's tags and from question 4's body-text items. (d) Page, section
  and entity link of a body-text item move from question 4 to question 5,
  where each follows the claim it refines, supplements or limits, labelled by
  its relation; the claim's own reference is labelled "recommendation" (its
  kind) only when body-text references follow it, so a single-claim statement
  keeps one plain citation. Two items of the same relation are told apart by
  order (the same as in question 4) and by their quotes, not by a number.
  (e) `neighbours_of` removed from `tools/build.py`; nothing else used it.
  `STATEMENT_EDGES` stays, the graph uses it. (f) The verb + "nicht" rule
  applies to every verb, as question 3's tags did, so a `kann` claim against
  would read "kann nicht · eher gegen"; the pool has no such claim.

## Open questions

None yet. If several supporting claims disagree enough in grade or consensus
that the banner stops being readable at a glance, that is a question for the
maintainer, not a redesign to make unilaterally.

## Verification

- `uv run tools/validate.py` passes.
- `uv run tools/build.py` succeeds.
- One statement per direction (für, gegen, abwägen, Lücke) checked in a
  browser: no "neighbouring situation" section; a gegen statement's banner
  reads "soll nicht" or "sollte nicht"; the banner shows grade and consensus;
  no field (recommendation number, grade, consensus, claim id link) appears in
  more than one section; a statement whose body text adds a supplement or
  limitation shows each source reference labelled with what it belongs to.
