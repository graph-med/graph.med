---
updated: 2026-09-18
---
# Handoff

**Where we are.** Twenty-seven packages, WP-0001 to WP-0027, in five
initiatives (`ui`, `groupings`, `extraction-quality`, `review`, `evidence`).
WP-0001 to WP-0010, WP-0017, WP-0019, WP-0020 and WP-0027 are in `done/`. WP-0011,
WP-0012, WP-0013, WP-0015 and WP-0016 are implemented and stacked in open pull
requests (#65–#69), awaiting human review; their files still read `open` on
`main`. WP-0021 and WP-0022 (`ui`) are at `status: review` in #75 and #76,
stacked in that order on the merged WP-0020, each targeting `main`. WP-0023,
WP-0024 and WP-0025
(the nine-zone statement card; WP-0025 depends on the other two) and WP-0026
(the site icon set) are `open`, unclaimed, none implemented. WP-0018 (a social
preview card using the mark) is `open`, unclaimed — a prior session's own
inference from an unspecific request; confirm or redirect its scope before
claiming it.

**Claimed.**
- WP-0011 — `agent/2026-09-14-body-text-relations-rule`, PR #66, in review.
- WP-0012 — `agent/2026-09-14-relink-body-text-a`, PR #68, in review.
- WP-0013 — `agent/2026-09-14-relink-body-text-b`, PR #69, in review.
- WP-0015 — `agent/2026-09-14-site-feedback-affordance`, PR #65, in review.
- WP-0016 — `agent/2026-09-14-llm-as-judge-design`, PR #67, in review.
- WP-0021 — `agent/2026-09-16-site-answer-label-gap-when-faded`, PR #75, in
  review, next to merge of the `ui` stack.
- WP-0022 — `agent/2026-09-16-site-statement-verb-strength-and-glyph`, PR
  #76, in review, stacked on WP-0021.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first — several stale branches from
already-`done/` packages (WP-0001–WP-0005, WP-0007–WP-0010, WP-0019,
WP-0020, WP-0027) are still on the remote and can be ignored.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.
- The region axis (`axes/region`) stays proposed: its report reproduces the
  organ families and leaves 13 concepts carrying 45 statements unplaced; the
  proposer decides `several: true` or withdrawal. `docs/open-questions.md` →
  statement-slot-provenance waits for a decision on where a slot value's
  rationale lives.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch it is stacked on, and a stack is merged once,
from the top, with a merge commit (ADR-0003): the lower pull requests are then
marked merged, and none is updated with `main` on the way. Ids are taken on
`main` and in open registrations alike: check open pull requests before
numbering a new package (WP-0023 collided once).
**The `screenshot` skill needs the `sbx` sandbox's own Docker daemon** (memory
`environment/screenshot-skill-needs-sbx-docker.md`): a session on a
different harness cannot run it; report that rather than working around it,
and ask a human to confirm visually on the live preview. `group_by` may name
only what is asserted for that view (validator).
