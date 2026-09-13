---
updated: 2026-09-13
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0003 are in
`done/`. The `ui` initiative is being processed first, as the maintainer asked:
WP-0004 and WP-0005 in parallel as workers in worktrees, WP-0006 to follow
stacked on WP-0005. The live site still colours boxes by grade until WP-0006
lands.

**Claimed.**
- WP-0004 — `agent/2026-09-13-site-fold-and-reset`, at `review`.
- WP-0005 — `agent/2026-09-13-site-panel-six-questions`.
- WP-0006 — to follow, stacked on WP-0005's branch.

**Next agent's first move.** The coordinator of this run stacks the branches,
runs the checks on each, and opens the pull requests in order (WP-0004 on
`main`, WP-0005 on `main`, WP-0006 on WP-0005). After they merge, the next run
closes them (`docs/work/README.md`, "Processing packages"). Process nothing that
is not listed with the command. Check `git ls-remote --heads origin 'agent/*'`
first.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.

**Watch out.** `uv run tools/screenshot.py <view> --do all --do fit` prints the
overlapping pairs — nodes and answers on each other, edges across either; a
build package ends with 0. It cannot see a pan that pushes nodes under the
floating controls on a phone; look for that yourself. The driver now also
prints page errors when the graph never appears; a silent 20 s timeout before
this meant a script error. Every pull request links its preview as a complete
clickable URL (`https://graph.med/preview/pr<N>/<view-id>/`).
