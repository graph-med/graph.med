# Log

One entry per session, newest first. Past about 200 lines, move the oldest
entries to `docs/LOG-ARCHIVE.md`, newest first there too; never delete.

## 2026-09-14 — agent
Packages touched: WP-0006 (review, rebased)
Branch: agent/2026-09-13-site-colour-by-direction (now on main)
Notable: WP-0006 was reviewed in #55 but #56 carried WP-0004 and WP-0005 to
`main` without it, so the branch was rebased onto today's `main` — the
`groupings` initiative, schema 0.5.0, the axis switch — its four commits
intact; one conflict in `tools/build.py` (the box label composed beside the
switch's duplicate guard) and two in the log and handoff. Re-verified: 0
overlapping pairs in thirteen states, 333 elements with everything open, and
the direction colours hold under every grouping of the switch (425 elements
under the phase, 433 under the chapters). The branch awaits its pull request
with base `main`.

## 2026-09-14 — agent
Packages touched: WP-0015 (open → claimed → review)
Branch: agent/2026-09-14-site-feedback-affordance
Notable: the first feedback affordance. Every statement's section, on the view
page and the entity page, ends with "suggest a change": a plain GitHub URL to a
new issue, prefilled by the build with the statement id, source, box and page
and the form of the new issue template under `.github/ISSUE_TEMPLATE/` — the
form's one home, read by the build; nothing is stored on the site and the page
makes no request. The prefilled issue was not opened by hand from the sandbox
(`gh` is unauthenticated there); the maintainer opens the decoded URL once.

## 2026-09-14 — agent
Packages touched: WP-0016 (open → claimed → review)
Branch: agent/2026-09-14-llm-as-judge-design
Notable: the automated review is designed (spec §8.1): three questions — a
claim against its page, a statement against its supporting claims, a
body-text edge against §5.1 — answered as attestations by one software agent,
`consistent` or `disputed`, hashes pinned, never an edit and never a block;
the author commits them in the pull request on the judge's behalf and a
read-only, human-committed workflow reads the same diff again into the run's
summary. Walking the existing box 6.7 through it found the amylase edge
carries no `rationale`, which §5.1 now asks for. Four open questions (model
and key, attestation ids, an edge's URL form, re-judging) and six entries in
`LATER.md` for the tool, the schema words, the agent, the workflow.

## 2026-09-14 — agent
Packages touched: WP-0012 (open → claimed → review)
Branch: agent/2026-09-14-relink-body-text-a
Notable: chapters 4–6 follow the body-text rule. Of nine body-text edges five
linked two sentences of one box and were removed from the edge files (git is
the history, spec §7), four stay with a rationale; 25 claims were added with
28 `modelling` edges, each rationale naming the test and the term — the
amylase criterion of 6.7 now carries all three alternatives, one claim each.
Chapter 6 was derived blind before the brief was read and matched it, with one
sentence more (the perfusion-check techniques, "hierfür", under 6.14); two
further sentences the brief left (statin side effects p. 28, the SDD
description p. 54) pass the rule and were added, all three flagged for the
reviewer. No schema, validator or build change; the first ungraded body-text
recommendations render under their box with no letter and no marker.

## 2026-09-14 — agent
Packages touched: WP-0011 (open → claimed → review)
Branch: agent/2026-09-14-body-text-relations-rule
Notable: the body-text rule is written (spec §5.1): a gate, then three tests
in order — fills a term → `refines`, takes a case out → `limits`, adds an
action → `supplements` — kind by the sentence's form, no grade, one claim per
alternative, and no edge between the sentences of one box. Checked against
the 101 claims: of the fifteen body-text edges nine link two sentences of one
box or two boxes and go, six stay; the rule adds about thirty claims
across the chapters, six of them in chapter 6 (the amylase criterion's two
other alternatives among them). The brief per chapter is in the pull request.
The `process-work-package` skill's extraction section now points at the rule.

## 2026-09-13 — agent
Packages touched: WP-0007 to WP-0010 (review → done)
Branch: docs/close-groupings
Notable: the `groupings` initiative merged as a stack of five pull requests,
approved and merged one at a time because the ruleset dismisses an approval
whenever the merge base changes. The maintainer, reviewing the switch, put
the chapters into it beside the phase ("these are all the broader concepts,
why are they not part of the one drop down") and dropped the two section
views the build package had added; the status headers of the spec and the
publication design, `CLAUDE.md` and `README.md` now describe what is built.

## 2026-09-13 — agent
Packages touched: WP-0010 (open → claimed → review)
Branch: agent/2026-09-13-site-grouping-views
Notable: the switch is on the site. The build emits one decision tree per
grouping a view offers — the plain hierarchy and each `group_by` axis — by
one derivation that takes the axis: a dimension asks "Welche {short label}?"
first, its values the answers, the population hierarchy below each; a
hierarchy axis swaps the `broader` edges the families come from; the not-placed
answer is last where it is needed. `views/pomgat-lv-1.0` offers the phase;
`?by=axes/phase` in the URL keeps the choice. After the maintainer's review of
the first pull request the chapters became an entry of the one switch
("Kapitel", `?by=section`, built in for every view from the claims' sections
and the outline, no axis entity) instead of two `section` views, which were
deleted; the form stays implemented in the build. The hierarchy path was proved on a
throwaway region assertion in a scratch copy and found a statement hung twice
behind "nicht zugeordnet" — fixed before anything was committed. Nothing in
`tools/` names an axis, a slot or a concept.

## 2026-09-13 — agent
Packages touched: WP-0009 (open → claimed → review)
Branch: agent/2026-09-13-link-grouping-axes
Notable: the first axes went through the mechanism. Four qualifier concepts
(präoperativ, intraoperativ, postoperativ, perioperativ), two definitions
under `data/axes/` with the rule written out and the placements applied,
both reports printed. The phase is asserted: `phase` on all 90 statements,
90 of 90 placed (28 · 20 · 26 · 16), the four sentences naming several
phases take perioperativ, no statement split. The region stays proposed:
19 of 36 concepts, 41 of 90 statements, its five families the plain
hierarchy's five organ families — it would show less than the view already
does, not something else. Nothing in the schema, the validator or the tool
changed; the rationale of a slot value lives in the commit message because
the statement has no per-property provenance (open question added).

## 2026-09-13 — agent
Packages touched: WP-0008 (open → claimed → review)
Branch: agent/2026-09-13-schema-grouping-axes
Notable: schema 0.5.0 carries the mechanism of spec §4.1 — `axes/` entities,
facet `qualifier`, `axis` on `broader`, dimension slots, `group_by` — and the
validator its cross-file rules; the data is valid without change. Nothing in
the schema, the validator or `tools/axes.py` names an axis, a slot or a
concept: the statement's own slots are read from the schema. A throwaway
region hierarchy over the first view reproduced the worked example's shape
(19 of 36 concepts, 41 of 90 statements, two concepts in several places, the
generic tumour operation heaviest among the unplaced with 24), the numbers
checked by hand against the data.

## 2026-09-13 — agent
Packages touched: WP-0007 (open → claimed → review)
Branch: agent/2026-09-13-grouping-axes-decision
Notable: spec §4.1 completed into a mechanism: the axis entity and its fields,
the four report measures defined per carrier, the carrier rule's edge cases,
`group_by` as a view property, "not placed" as one answer last. The worked
example was measured, not imagined: a first region placement covers 20 of 36
population concepts but only 42 of 90 statements, because the generic tumour
operation carries 24 — which is why coverage is reported by statement too.
Phase: 58 of 90 sentences name their phase, the rest fall to the chapter.
grouping-axes and phase-vocabulary left `docs/open-questions.md`.

## 2026-09-13 — agent
Packages touched: WP-0004, WP-0005 (review → done); WP-0007 to WP-0010 (reworded)
Branch: docs/grouping-axes-mechanism
Notable: the grouping axes were first designed as anatomy, phase and access —
POMGAT's own organising principles — and the maintainer asked for a design
that "also works across other leitlinien", then, of a fixed cross-guideline
vocabulary, "then there is a third Leitlinie. It needs to work for them all",
and proposed that a physician suggests axes and post-processing tests their
feasibility. Written into the spec as §4.1 (proposed → tested → asserted →
shown; two carriers, a slot or `axis` on `broader`; the test reports and never
writes, the grouping is always an asserted edge or slot value), into
`docs/publication.md` §3, `README.md`, two memories (`generic-over-guidelines`,
`grouping-axes-proposed-and-tested`) and the four packages of the initiative,
whose contents changed while their ids and slugs stayed. Found that WP-0006 is
not on `main`: #56 was cut before #55 merged.

## 2026-09-13 — agent
Packages touched: WP-0006 (open → claimed → review)
Branch: agent/2026-09-13-site-colour-by-direction (on agent/2026-09-13-site-panel-six-questions)
Notable: a box is coloured by its direction and reads "✓ A · <short label>";
box and banner share four colour variables, gegen now a tint of the contested
red with dark text, and the solid red "against" border went with it. The
screenshot driver gained `--dark` (the theme emulated before the load, since
the graph reads its colours once). Captured a family with a member open on
desktop and phone, light and dark, a gegen box and a fact box selected, the
phone start for the legend, and everything open: 0 overlapping pairs in every
state, 333 elements. Noted in `LATER.md`: the graph does not follow a theme
switch while the page is open.
