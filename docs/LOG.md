# Log

One entry per session, newest first. Past about 200 lines, move the oldest
entries to `docs/LOG-ARCHIVE.md`, newest first there too; never delete.

## 2026-09-18 — agent
Packages touched: WP-0027 (open → claimed → review)
Branch: agent/2026-09-18-site-phone-graph-stays-in-view
Notable: one deletion in `tools/site/static/graph.js` — `select()` no longer
scrolls the sheet into view below 900 px, so a tap on a phone leaves the graph
on screen; pull request #80. Earlier the same day, PR #78 (WP-0026, the icon
set) was merged with `main` and renumbered from WP-0023, and WP-0027 was
registered (#79).

## 2026-09-16 — agent
Packages touched: WP-0020 (open → claimed → review)
Branch: agent/2026-09-16-site-search-navigate-matches
Notable: the search steps from match to match — a ↑↓ pill beside the box and
the arrow keys in it — in the reading order of the tree (a node before what
hangs from it, siblings top to bottom), wrapping, each step selecting its match
as a tap would while the fading stays; the counter leads with the place, "3 of
12 matches in 4 sections". The screenshot driver gained `step=<n>` so the
verification could be driven; the `screenshot` skill's action list names it.
Run as one of four workers in parallel worktrees (WP-0019 to WP-0022); the push
failed on a host-side credential problem, so the branch left the sandbox
through the coordinator. The log passed 200 lines; its two oldest entries went
to the archive.

## 2026-09-16 — agent
Packages touched: WP-0019 (open → claimed → review)
Branch: agent/2026-09-16-statement-detail-panel-revision
Notable: the statement detail panel now has five questions: the neighbouring
situation question, its lists and `neighbours_of` are gone; the banner reads
"soll nicht"/"sollte nicht" for an against statement and carries each
supporting claim's grade and consensus (one badge group per distinct pair,
shown, never composed); question 3 keeps per-claim grade, verb and consensus
only for claims the banner does not carry; the recommendation number lives
in question 5 alone; body-text references (page, section, id, quote) moved
from question 4 to question 5, each following its claim labelled by its
relation, so a single-claim statement keeps one plain citation.
`docs/publication.md` §3 rewritten to match. Checked in Chromium on desktop
and phone, light and dark, one statement each for für, gegen, abwägen; the
pool has no statement with direction Lücke (gap notices are unlinked), so
that branch was checked by rendering the template on a synthetic claim.

## 2026-09-16 — agent
Packages touched: WP-0019 (registered)
Branch: claude/busy-bohr-exli39
Notable: registered WP-0019 (`ui`), unclaimed, from the maintainer's own
review of the live statement detail panel: drop the "would the answer be
different in a neighbouring situation?" question; fix the banner's small
verb text to read "soll nicht"/"sollte nicht" for an against-direction
statement, matching the per-claim tags' own convention; carry each
supporting claim's grade and consensus into the banner, without composing a
single statement-level grade (`grade-derivation` stays untouched); make
"where exactly is it written?" show one link by default and label each
source when body-text relations add more than one; and remove the
duplicate fields the current template has (`recommendation_no` shown in
both question 3 and question 5). No implementation in this session.

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
