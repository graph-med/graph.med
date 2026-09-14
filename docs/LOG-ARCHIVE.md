# Log archive

Older entries of `docs/LOG.md`, moved here when that file passed 200 lines;
newest first, never deleted.

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
