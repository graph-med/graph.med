---
updated: 2026-09-16
---
# Handoff

**Where we are.** Nineteen packages, WP-0001 to WP-0019, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0010 are in
`done/`. WP-0011, WP-0012, WP-0013, WP-0015 and WP-0016 are implemented and
stacked in open pull requests (#65–#69), awaiting human review; none has
merged yet, so their files still read `open` on `main`. WP-0017 (a
maintainer-supplied mark as the favicon and in the header `.brand`) was
registered, claimed and implemented in a prior session — PR #70 — and is at
`status: review`; its browser check could not run (see "Watch out"). WP-0018
(an Open Graph/Twitter social-preview card using the same mark) is `open`,
unclaimed — a prior session's own inference of "a new work package" from an
unspecific request; confirm or redirect its scope before claiming it.
WP-0019 (the statement detail panel: drop the "neighbouring situation"
question, fix the banner's "nicht" for against statements, carry grade and
consensus into the banner, single-vs-multi-source citations in "Where
exactly is it written?", no field shown twice) was registered this session
from the maintainer's own review of the live panel — `open`, unclaimed.

**Claimed.**
- WP-0011 — `agent/2026-09-14-body-text-relations-rule`, PR #66, in review.
- WP-0012 — `agent/2026-09-14-relink-body-text-a`, PR #68, in review.
- WP-0013 — `agent/2026-09-14-relink-body-text-b`, PR #69, in review.
- WP-0015 — `agent/2026-09-14-site-feedback-affordance`, PR #65, in review.
- WP-0016 — `agent/2026-09-14-llm-as-judge-design`, PR #67, in review.
- WP-0017 — `claude/magical-bell-b1dw85`, PR #70, in review.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first — several stale branches from
already-`done/` packages (WP-0001–WP-0005, WP-0007–WP-0010) are still on the
remote and can be ignored.

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
approval. **The `screenshot` skill needs the `sbx` sandbox's own Docker
daemon** (memory `environment/screenshot-skill-needs-sbx-docker.md`): a
session on a different harness cannot run it; report that rather than
working around it, and ask a human to confirm visually on the live preview.
`group_by` may name only what is asserted for that view (validator).
