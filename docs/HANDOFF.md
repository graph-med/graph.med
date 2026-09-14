---
updated: 2026-09-14
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0005 and
WP-0007 to WP-0010 are in `done/`: the `groupings` initiative is on `main`.
WP-0006 (boxes coloured by direction, the grade a letter) was reviewed in #55
but missed by #56; its branch is rebased onto `main` with its four commits,
re-verified under the switch, and awaits its pull request with base `main` —
the live site colours boxes by grade until it merges. WP-0015 is built on top
of it: the "suggest a change" link under every statement's section, prefilled
from the issue template under `.github/ISSUE_TEMPLATE/`; the prefilled issue
is opened once by hand by the maintainer, not from the sandbox.

**Claimed.** Every package with an open `agent/*` branch in this run:
- WP-0006 — `agent/2026-09-13-site-colour-by-direction`, in review, rebased.
- WP-0015 — `agent/2026-09-14-site-feedback-affordance`, in review, stacked
  on WP-0006's branch.
- WP-0011 — `agent/2026-09-14-body-text-relations-rule`.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first. WP-0012 → WP-0013 and WP-0016
open once WP-0011 is in `done/`.

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
approval — and a stack is cut only after everything below it has merged, or a
package is left behind as WP-0006 was. `uv run tools/screenshot.py <view> --do
all --do fit` prints the overlapping pairs; a build package ends with 0;
`--do by=section` or `--do by=<axis id>` chooses the grouping first; `--dark`
renders the dark theme, which a package that touches a colour captures too;
`--size 390x2700` shows the whole sheet at phone width, `--size 1280x2400` the
whole sheet column on desktop. An axis is tested with `uv run tools/axes.py
<axis-id or file> <view>` before it is asserted, and the report goes verbatim
into the asserting pull request; the tool never writes under `data/`.
`group_by` may name only what is asserted for that view (validator); the
chapters need no axis. The build's per-language table is `WORDS` in
`tools/build.py`; the chrome outside the graph is English. The build reads
`.github/ISSUE_TEMPLATE/suggest-a-change.md` and stops without it; a label for
the issues goes into that template's front matter once the repository has one.
