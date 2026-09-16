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
4. Question 5, "Where exactly is it written?", drops the redundant second link
   each entry carried (a link straight into the source *and* a link to the
   claim's own entity page for the same claim) and keeps the one link into the
   cited passage; a statement resting on several claims (a box of several
   sentences, sharing one `recommendation_no`) still shows one entry per claim,
   each labelled with its recommendation number, so a reader can tell which
   passage backs which sentence. Question 4's body-text citations
   (refines/supplements/limits) stay where they already were, in question 4 —
   folding them into question 5 too would itself be the duplication point 5
   forbids.
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
  five points above; this registration records them.
- 2026-09-16 — implementation reading of point 4 ("only a link... unless
  several references"): the pool already lets one statement rest on several
  `supports` claims (a multi-sentence box shares one `recommendation_no`
  across several claims — memory `box-granularity-per-sentence`), and each
  already got its own citation entry in question 5; what was not "only a
  link" was the *second* link each entry carried, into the claim's own entity
  page, next to the citation link into the source. That is what "only a link"
  fixes; the recommendation-number label that already distinguished several
  entries stays, since point 4's exception clause requires exactly that
  attribution. Body-text citations (question 4) were considered for folding
  into question 5 too, on a first reading of "several source references... by
  a supplement or limitation" — rejected: they already carry their own
  citation and `recommendation_no` label in question 4, so repeating them in
  question 5 would itself be the duplication point 5 rules out.
- 2026-09-16 — `.q .banner .tag` forces dark text (`#111`) on the grade and
  consensus badges now in the banner, the same fixed dark text the banner's
  direction word and lean already use (`site.css` `.banner[class*="dir-"]`):
  the default `.tag`/`.tag.grade` colours read from `--fg`, which is light in
  the dark theme and would sit badly on the banner's light pastel background.

## Open questions

None yet. If several supporting claims disagree enough in grade or consensus
that the banner stops being readable at a glance, that is a question for the
maintainer, not a redesign to make unilaterally.

## Verification

- `uv run tools/validate.py` passes (323 entities, 146 edges, schema 0.5.0).
- `uv run tools/build.py` succeeds (1 view, 322 entity pages).
- Checked in the built HTML for one statement per direction present in the
  pool (für, gegen, abwägen — no statement carries `Lücke` yet, memory
  `direction-legend`: gap notices are not linked to statements until open
  question `gap-notices` is settled): no "neighbouring situation" section on
  any statement page; the gegen example's banner reads glyph, "gegen",
  "sollte nicht", then its grade and consensus tags; für and abwägen read
  correctly too, abwägen keeping its "eher für"/"eher gegen" lean beside
  "kann". `recommendation_no` appears once per claim (question 5 only); the
  claim-entity second link is gone from question 5. A statement with a
  `limits` body-text relation (`ace-hemmer-sartane-fortfuehrung`) still shows
  that citation only in question 4, not repeated in question 5.
- **Not run in this session**: the `screenshot` skill — `docker info` fails
  to reach the daemon in this harness (memory
  `environment/screenshot-skill-needs-sbx-docker.md`), so the banner's actual
  colours and the panel's layout on a phone were not seen in a real browser.
  Reasoned about the dark-theme contrast fix from the CSS variables instead
  (see Decisions); a human should still confirm the banner and the removed
  section visually on the live preview before merging.
