---
updated: 2026-09-18
---
# Handoff

**Where we are.** Twenty-seven packages, WP-0001 to WP-0027, in five
initiatives (`ui`, `groupings`, `extraction-quality`, `review`, `evidence`).
WP-0001 to WP-0010, WP-0017, WP-0019 to WP-0022 and WP-0027 are in `done/`
(WP-0021 and WP-0022 closed on this run's base branch). The `evidence`
initiative is in flight: WP-0023 (schema 0.6.0, `claim.evidence`) is at
`status: review`; WP-0024 runs beside it in a parallel worktree; WP-0025
depends on both and follows, stacked on top. WP-0016 is implemented and in
review (#67). WP-0011, WP-0012, WP-0013 and WP-0015 were implemented on
`agent/2026-09-14-*` branches, but their pull requests were closed without
merging and their files read `open` on `main` — a person decides whether to
reopen or drop those branches before anyone claims them. WP-0026 is `open`,
unclaimed. WP-0018 is `open`, unclaimed — a prior session's own inference
from an unspecific request; confirm or redirect its scope before claiming it.

**Claimed.**
- WP-0016 — `agent/2026-09-14-llm-as-judge-design`, PR #67, in review.
- WP-0023 — `agent/2026-09-18-schema-claim-evidence`, review, awaiting its
  pull request from the coordinator (the base of this run's stack).
- WP-0024 — `agent/2026-09-18-site-statement-card-nine-zones`, in progress
  beside WP-0023; WP-0025 starts from both when they are done.
- WP-0011, WP-0012, WP-0013, WP-0015 — branches on `origin`, pull requests
  closed unmerged (#66, #68, #69, #65); see above.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first — stale branches from
already-`done/` packages (WP-0001–WP-0005, WP-0007–WP-0010, WP-0019–WP-0022,
WP-0027) are still on the remote and can be ignored. The extraction pass that
fills `claim.evidence` is in `docs/work/LATER.md`, to be registered once
WP-0023 has merged.

**Blocked, and why.**
- WP-0025 — waits on WP-0023 and WP-0024.
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.
- The region axis (`axes/region`) stays proposed: its report reproduces the
  organ families and leaves 13 concepts carrying 45 statements unplaced; the
  proposer decides `several: true` or withdrawal. `docs/open-questions.md` →
  statement-slot-provenance waits for a decision on where a slot value's
  rationale lives.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch it is stacked on, and a stack is merged once,
from the top, with a merge commit (ADR-0003). Ids are taken on `main` and in
open registrations alike: check open pull requests before numbering a new
package. **The `screenshot` skill needs the `sbx` sandbox's own Docker
daemon** (memory `environment/screenshot-skill-needs-sbx-docker.md`): a
session on a different harness cannot run it; report that rather than working
around it. `group_by` may name only what is asserted for that view (validator).
No evidence vocabulary goes into the schema, the validator or the build:
`claim.evidence` is open by design (memory `design/claim-evidence-per-outcome.md`).
