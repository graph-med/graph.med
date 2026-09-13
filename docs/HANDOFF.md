---
updated: 2026-09-13
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0003 are in
`done/`. The maintainer wants the `ui` initiative done first: WP-0004, WP-0005,
then WP-0006, whose box-colour question is settled (memory
`box-colour-by-direction`) and which now only waits on WP-0005. The live site
still colours boxes by grade until WP-0006 lands.

**Claimed.** Nothing.

**Next agent's first move.** Claim WP-0004 (fold at every question, a reset
button, a fixed "all" row) or WP-0005 (the detail section organised by the
reader's six questions); both are open with their dependencies done. Stay in
`ui`. Check `git ls-remote --heads origin 'agent/*'` first.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.

**Watch out.** `uv run tools/screenshot.py <view> --do all --do fit` prints the
overlapping pairs — nodes and answers on each other, edges across either; a
build package ends with 0. It cannot see a pan that pushes nodes under the
floating controls on a phone; look for that yourself. Every pull request links
its preview as a complete clickable URL (`https://graph.med/preview/pr<N>/<view-id>/`).
