---
updated: 2026-09-13
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0003 are in
`done/`. The `ui` initiative is being processed first, as the maintainer asked:
WP-0004 and WP-0005 ran in parallel as workers in worktrees, WP-0006 followed
from WP-0005's branch; all three are in review, stacked WP-0004 → WP-0005 →
WP-0006, one pull request each. The live site colours boxes by grade until
WP-0006 lands.

**Claimed.**
- WP-0004 — `agent/2026-09-13-site-fold-and-reset`, in review.
- WP-0005 — `agent/2026-09-13-site-panel-six-questions`, in review, stacked on
  WP-0004.
- WP-0006 — `agent/2026-09-13-site-colour-by-direction`, in review, stacked on
  WP-0005.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first. The `ui` initiative continues
with WP-0010 (waits on the `groupings` packages) and WP-0015 (waits on
WP-0005).

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.

**Watch out.** `uv run tools/screenshot.py <view> --do all --do fit` prints the
overlapping pairs — nodes and answers on each other, edges across either; a
build package ends with 0. It cannot see a pan that pushes nodes under the
floating controls on a phone; look for that yourself. It captures the viewport
only and opens view pages only: to see the whole sheet at phone width use
`--size 390x2700`; an entity page is checked in the built HTML. `--dark`
renders the dark theme, which a package that touches a colour captures too. The
driver prints page errors when the graph never appears; a silent 20 s timeout
before this meant a script error. Every pull request links its preview as a
complete clickable URL (`https://graph.med/preview/pr<N>/<view-id>/`).
