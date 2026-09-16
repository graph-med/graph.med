# Log

One entry per session, newest first. Past about 200 lines, move the oldest
entries to `docs/LOG-ARCHIVE.md`, newest first there too; never delete.

## 2026-09-16 — agent
Packages touched: WP-0019 (registered, claimed → review)
Branch: claude/busy-bohr-exli39
Notable: registered WP-0019 (`ui`) from the maintainer's own review of the
live statement detail panel, then claimed and implemented it, all in this
session. `tools/site/templates/details.html`: dropped the sixth question
("would the answer be different in a neighbouring situation?") and its
`neighbours` data; the citation entries in "where exactly is it written?"
lost their redundant second link (into the claim's own entity page,
alongside the link into the source) — the one duplicate `recommendation_no`
found was removed from question 3's tags, kept in question 5's citation
line, which already attributes each of several claims on a multi-sentence
box to its own recommendation number. `tools/build.py`: `direction_of` now
appends "nicht" to the verb for a gegen statement ("soll nicht"/"sollte
nicht", matching the per-claim tags) and returns each supporting claim's
grade and consensus for the banner, without composing them into one
derived grade — `grade-derivation` stays untouched, open; dropped
`neighbours_of`, unused elsewhere. `docs/publication.md` §3 rewritten to
five questions. Considered folding question 4's body-text citations into
question 5 too, on a first reading of the maintainer's "several source
references" exception — rejected, since they already have their own
citation and label in question 4 and repeating them would itself be the
duplication asked against; see the package's Decisions. `screenshot` skill
could not run — `docker info` fails to reach the daemon in this harness,
same limitation as WP-0017 — checked instead by reading the built HTML for
one statement per direction present in the pool and reasoning the banner's
new dark-theme contrast fix from the CSS variables; a human should confirm
visually on the live preview.

## 2026-09-16 — agent
Packages touched: WP-0006 (review → done), WP-0017 (registered, claimed →
review)
Branch: claude/magical-bell-b1dw85
Notable: closed WP-0006 (merged in #64, file still said review on main).
Registered WP-0017 (`ui`) for a maintainer-supplied mark
(`tools/site/static/logo.svg`, its embedded C2PA content-credentials
manifest stripped as out of place for a site asset here), then claimed and
implemented it: a favicon `<link>` and the mark beside "graph.med" in
`.brand`. This session runs under a harness without `sbx`'s own Docker
daemon, so the `screenshot` skill could not run (`docker info` fails to
reach the socket; `sudo service docker start` is refused on a `ulimit`
permission) — recorded as `environment/screenshot-skill-needs-sbx-docker.md`
so the next session does not re-discover it. Checked instead by building and
by rasterising the mark at favicon and header sizes on both themes
(`cairosvg`): legible from 24px, readable but small at 16px, and the dark
theme's own black tile sits close in value to `--bg`, faint at the edge —
noted for a human to confirm on the live preview, not treated as blocking.
Also registered WP-0018 (`ui`, depends on WP-0017): an Open Graph/Twitter
card using the mark, since the site currently has no social preview at all
— my own inference of what "a new work package" should cover, flagged as
such for the maintainer to redirect.

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


