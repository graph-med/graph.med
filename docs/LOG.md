# Log

One entry per session, newest first. Past about 200 lines, move the oldest
entries to `docs/LOG-ARCHIVE.md`, newest first there too; never delete.

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
Packages touched: WP-0005 (open → claimed → review)
Branch: agent/2026-09-13-site-panel-six-questions
Notable: a statement's details are now the six questions, in order, on the
sheet and the entity page alike; `details()` gained the population's families,
the condition and the neighbours (same group, same action elsewhere, linked
statements). Captured on desktop, phone and a tall phone-width viewport: 0
overlapping pairs in every state, 333 elements with everything open. The
screenshot driver cannot open an entity page (it waits for the graph), so the
entity page was checked in the built HTML; noted in `LATER.md`.

## 2026-09-13 — agent
Packages touched: WP-0004 (open → claimed → review)
Branch: agent/2026-09-13-site-fold-and-reset
Notable: the first package run as a worker in a worktree, in parallel with
WP-0005. Every question folds by one rule (a closed question keeps what was open
below it, so a second tap restores it); a reset button beside the fit button;
the chapter panel's "all" row a fixed header over the scrolling list. The
screenshot driver gained `fold=`, `reset` and `chapters-scroll=` so the
verification could be driven, and now prints page errors when the graph does
not appear — the first run found a function name shadowing the search's text
folding, which the driver had been swallowing. Twelve captures, 0 overlapping
pairs in every state, 333 elements with everything open.

## 2026-09-13 — agent
Packages touched: none
Branch: conventions/parallel-work
Notable: the maintainer asked for WP-0004 to WP-0006 in parallel. Tested in
this sandbox: two git worktrees under `.claude/worktrees/`, validate, build and
two screenshots at once — fine, once the containers had distinct names. The
repository is now prepared (ADR-0002): worktrees ignored, screenshot defaults
per branch, and one command, `process-work-package`, replaces
`next-work-package` — it takes the packages to process, the session
coordinates workers and stacks their pull requests, and nothing unlisted is
processed.

## 2026-09-13 — agent
Packages touched: WP-0003 (review → done), WP-0006 (blocked → open)
Branch: docs/settle-box-colour
Notable: the maintainer settled box-colour — colour by direction, the grade as a
letter — after asking which option the agent preferred and why. Applied in
`docs/publication.md` §3 and the memory `box-colour-by-direction`; the entry
left `docs/open-questions.md`. No site change: WP-0006 builds it once WP-0005 is
done. The maintainer asked to concentrate on the `ui` initiative first.

## 2026-09-12 — agent
Packages touched: WP-0002 (review → done), WP-0003 (open → claimed → review)
Branch: agent/2026-09-12-site-question-at-every-branch
Notable: the first session to close a merged package under the new rule. One
rule now builds every question, root and family alike. The review found edges
drawn through boxes on a phone — the vertical run of a taxi edge sat inside its
source's rank; it is now placed after each layout in the gap between columns,
and the screenshot driver reports edges across nodes and answers. 0 in every
state checked, 333 elements with everything open.

## 2026-09-12 — agent
Packages touched: WP-0002 (open → claimed → review)
Branch: agent/2026-09-12-site-layout-visibility
Notable: the overlaps had a single cause — the answer's offset assumed the arrow
ends at the target's centre, not its boundary. Measured with an overlap report
added to the screenshot driver: 7, 4 and 12 overlapping pairs in the two named
families and with every group open; 0 after. The maintainer set the rule that
a merged package is closed by the next agent that sees it (WP-0001 closed).

## 2026-09-12 — agent
Packages touched: WP-0001 (open → claimed → review)
Branch: agent/2026-09-12-site-search-recall
Notable: reproduced 122 search misses out of 673 queries (diacritics, slot
concepts' short labels, answers on condition edges) before changing anything;
none after. First package worked under the new convention.

## 2026-09-12 — agent
Packages touched: WP-0001 … WP-0016 (registered)
Branch: conventions/work-packages
Notable: migrated the register from `data/PROGRESS.yaml` (passes and chunks per
source) via a short-lived `WORK.yaml` to `docs/work/`, one markdown file per
package with the handoff and history layers kept apart (`docs/HANDOFF.md`,
`docs/LOG.md`); see ADR-0001. Nothing lost: every deferred item is in
`docs/work/LATER.md` or a package. The physician's review of 2026-09-11 was
partitioned into the four initiatives under `docs/work/initiatives/`.
