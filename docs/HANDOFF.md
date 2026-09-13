---
updated: 2026-09-13
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0005 are in
`done/`. WP-0006 is built and reviewed (#55) but **not on `main`**: #56 was cut
before #55 merged, so `agent/2026-09-13-site-colour-by-direction` still holds
its four commits; a pull request from that branch with base `main` carries it
over. The `groupings` initiative is running: the mechanism (spec §4.1 —
proposed, tested, asserted, shown; two carriers; `axes/` entities; the
feasibility report; `group_by`) is complete on WP-0007's branch, stacked on
`docs/grouping-axes-mechanism` (#58).

**Claimed.**
- WP-0007 — `agent/2026-09-13-grouping-axes-decision`, in review.

**Next agent's first move.** The coordinator of the current run starts
WP-0008 from WP-0007's branch, then WP-0009, then WP-0010, each stacked on its
predecessor, every pull request with base `main`. A later session: `git fetch
origin`, close what has merged (`status: review` on `origin/main` → `done/`),
then process only what the command lists. Check
`git ls-remote --heads origin 'agent/*'` first.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch it is stacked on. `uv run tools/screenshot.py
<view> --do all --do fit` prints the overlapping pairs; a build package ends
with 0; `--size 390x2700` shows the whole sheet at phone width; an entity page
is checked in the built HTML. WP-0008's schema must land before WP-0009's data
(spec §7), and `tools/axes.py` must never write under `data/`.
