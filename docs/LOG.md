# Log

**Frozen on 2026-09-19.** No entry after the first one below: a session's
record is the handover comment on its card and its pull request (ADR-0004).
One entry per session, newest first; older entries in `docs/LOG-ARCHIVE.md`;
never delete.

## 2026-09-19 — agent
Packages touched: WP-0023, WP-0024, WP-0025 (review → done); WP-0011,
WP-0012, WP-0013, WP-0014, WP-0015, WP-0016, WP-0018, WP-0026 (→ migrated)
Branch: agent/2026-09-19-project-board-skill
Notable: the work registry moved to the maintainer's GitHub project
`planning-graph.med` (organisation project 6; Todo, In Progress, Done). The
App gained organisation Projects and repository Issues, read and write, each
after a refused call that named its permission in
`X-Accepted-Github-Permissions` (memory
`environment/github-app-permissions.md`). `tools/board.py` reads and writes
the board through `gh api`; the eight open or blocked packages became cards
#91 to #98 with their text verbatim (WP-0016 In Progress, its pull request
#67 now says `Closes #96`), the twenty `LATER.md` entries Todo cards #99 to
#118; `scripts/check-work.py` treats `docs/work/` as
frozen; AGENTS.md, the `process-work-package`, `handover` and
`project-board` skills, CLAUDE.md and README.md describe the new process;
ADR-0004 records it and supersedes ADR-0001. This file, `docs/HANDOFF.md`
and `docs/work/` are history from here on.

## 2026-09-18 — agent
Packages touched: WP-0025 (open → claimed → review)
Branch: agent/2026-09-18-site-evidence-zone
Notable: zone 4 of the statement card reads the supporting claims'
`evidence` (schema 0.6.0) in four states — one value on one line, per
outcome a native open `<details>` over a table in the guideline's order with
the range from `EVIDENCE_SCALES` (`tools/build.py`, beside `GRADES`, read for
the range alone), expert consensus only, nothing recorded — by
`evidence_of()`; nine words added to `CARD_WORDS`; nothing composed, no
script, printable; `docs/publication.md` §3 amended. The mixed state
(`3 von 5 Endpunkten erfasst`) is built but not writable: the schema
requires `value` (LATER). On the pool 40 EK-only statements now read
`Expertenkonsens, keine Evidenzbewertung`, 50 `Evidenz: nicht erfasst`.
Checked on throwaway `evidence` insertions into one claim (not committed) in
Chromium, desktop and phone, light and dark; 0 overlapping pairs with
everything open (333 elements). Top of this run's stack, on WP-0024's branch.

## 2026-09-18 — agent
Packages touched: WP-0024 (open → claimed → review)
Branch: agent/2026-09-18-site-statement-card-nine-zones
Notable: the statement card is nine sections in a fixed order with every
visible word from `CARD_WORDS` in `tools/build.py`, keyed structurally and
with no fallback (removing `de` fails the build naming the language and all
32 keys); `direction_of()` returns `badges` and `umstritten`, `badges_of()`
collapses identical grade/consensus pairs in zone 8's order, `contests_of()`
feeds zone 7, zone 5 links a slot only when its concept carries more than
one statement and has no outcome row, `card` is assembled once and carried
in the statement's JSON. The marker's jump is handled in the sheet script
(`base.html`), since a hash change is the graph's deep link. Checked in
Chromium on desktop and phone, light and dark, with a throwaway `contests`
fixture for the marker and zone 7 (not committed); 0 overlapping pairs with
everything open (333 elements). `docs/publication.md` §3 rewritten. Processed
in parallel with WP-0023 (`agent/2026-09-18-schema-claim-evidence`).

## 2026-09-18 — agent
Packages touched: WP-0023 (open → claimed → review); WP-0021, WP-0022 (review → done)
Branch: agent/2026-09-18-schema-claim-evidence
Notable: schema 0.6.0 gives the claim `evidence` — a list of the source's own
certainty ratings, each `value` and `system` open strings and an optional
`outcome` concept — with required provenance like `grade`; no enum, no
mapping, and no scalar form, so one certainty for a per-outcome table cannot
be written. The validator needed no change: its reference check already
resolves a concept inside the list (shown by fixture). Spec §3.1 carries the
field and its two rules, `evidence-profiles` left `docs/open-questions.md`
into memory `design/claim-evidence-per-outcome.md`, no data changed. Run as
one of two workers in parallel worktrees (WP-0024 beside it); the oldest
log entry rotated to `docs/LOG-ARCHIVE.md`.

## 2026-09-18 — agent
Packages touched: WP-0027 (open → claimed → review)
Branch: agent/2026-09-18-site-phone-graph-stays-in-view
Notable: one deletion in `tools/site/static/graph.js` — `select()` no longer
scrolls the sheet into view below 900 px, so a tap on a phone leaves the graph
on screen; pull request #80. Earlier the same day, PR #78 (WP-0026, the icon
set) was merged with `main` and renumbered from WP-0023, and WP-0027 was
registered (#79).

## 2026-09-16 — agent
Packages touched: WP-0022 (open → claimed → review)
Branch: agent/2026-09-16-site-statement-verb-strength-and-glyph
Notable: the statement box now carries its verb as a border — a solid rim in
a strong shade of the direction's colour when the supporting claims all say
`soll` (green für, red "soll nicht"), none for `sollte` or a mixed verb —
derived by `verb_of()` beside `direction_of()` and passed as `verb` on the
node; the direction glyph (✓ ✗ ⚖ ∅) is off the box entirely, the box reads
"EK · <short label>", the banner and the legend keep their glyphs; the legend
gains "verb by border"; `docs/publication.md` §3 amended. Checked in Chromium
on desktop and phone, light and dark, 0 overlapping pairs with everything
open (333 elements). Found and left alone, in `LATER.md`: every statement
box's "no border" (`rgba(0,0,0,0)`) renders as a 1.5px near-black hairline
because Cytoscape ignores the alpha. Push failed on a host-side credential
problem the coordinator had already reported. The three oldest log entries
rotated to `docs/LOG-ARCHIVE.md`.

## 2026-09-16 — agent
Packages touched: WP-0021 (open → claimed → review)
Branch: agent/2026-09-16-site-answer-label-gap-when-faded
Notable: a faded answer's label now breaks its line cleanly. Cytoscape blits
an edge label from a texture cache as one image, background and all, with
`text-opacity × opacity` as its alpha, so neither opacity property could keep
the background opaque while fading the text; a dimmed or faded edge now fades
by `line-opacity` and the label text's colour (`--line`), and the label
background stays at 1. Nine states captured in both themes, 0 overlapping
pairs in every one, 333 elements with everything open. On a phone a deep
link scrolls to the sheet, so the dimmed fan-out was checked at desktop width
and the search-faded one on the phone (the driver gap is noted in LATER.md).

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

