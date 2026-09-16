---
updated: 2026-09-16
---
# Handoff

**Where we are.** Twenty-two packages, WP-0001 to WP-0022, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0010 and
WP-0017 are in `done/` (WP-0017 merged in #70 and is closed by this run's
coordinator). WP-0011, WP-0012, WP-0013, WP-0015 and WP-0016 are implemented
and stacked in open pull requests (#65–#69), awaiting human review; none has
merged yet, so their files still read `open` on `main`. WP-0019, WP-0020,
WP-0021 and WP-0022 (all `ui`) were claimed and implemented in this run, four
workers in parallel worktrees, and are at `status: review` on their branches,
stacked in that order by the coordinator, each pull request targeting `main`.
WP-0018 (a social preview card using the mark) is `open`, unclaimed — a prior
session's own inference from an unspecific request; confirm or redirect its
scope before claiming it.

**Claimed.**
- WP-0011 — `agent/2026-09-14-body-text-relations-rule`, PR #66, in review.
- WP-0012 — `agent/2026-09-14-relink-body-text-a`, PR #68, in review.
- WP-0013 — `agent/2026-09-14-relink-body-text-b`, PR #69, in review.
- WP-0015 — `agent/2026-09-14-site-feedback-affordance`, PR #65, in review.
- WP-0016 — `agent/2026-09-14-llm-as-judge-design`, PR #67, in review.
- WP-0019 — `agent/2026-09-16-statement-detail-panel-revision`, in review,
  base of the stack.
- WP-0020 — `agent/2026-09-16-site-search-navigate-matches`, in review,
  stacked on WP-0019.
- WP-0021 — `agent/2026-09-16-site-answer-label-gap-when-faded`, in review,
  stacked on WP-0020.
- WP-0022 — `agent/2026-09-16-site-statement-verb-strength-and-glyph`, in
  review, stacked on WP-0021.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first — several stale branches from
already-`done/` packages (WP-0001–WP-0005, WP-0007–WP-0010) are still on the
remote and can be ignored. If the four `agent/2026-09-16-*` branches are not
on `origin`, the push failure below is why: push them and open their pull
requests, in stack order, before anything else.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.
- The region axis (`axes/region`) stays proposed: its report reproduces the
  organ families and leaves 13 concepts carrying 45 statements unplaced; the
  proposer decides `several: true` or withdrawal. `docs/open-questions.md` →
  statement-slot-provenance waits for a decision on where a slot value's
  rationale lives.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch it is stacked on; under the ruleset an
approval is dismissed whenever the merge base changes, so a stack is approved
and merged one pull request at a time, `main` merged into the next before its
approval. Pushing from the sandbox failed in this run with
`could not read Username for 'https://github.com'`, and the `gh` API answered
401 — a host-side credential problem, reported, not to be worked around.
**The `screenshot` skill needs the `sbx` sandbox's own Docker daemon** (memory
`environment/screenshot-skill-needs-sbx-docker.md`): a session on a
different harness cannot run it; report that rather than working around it,
and ask a human to confirm visually on the live preview. `group_by` may name
only what is asserted for that view (validator).
