# Log archive

Entries rotated out of `docs/LOG.md` once it passes about 200 lines, newest
first here too; never delete.

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
