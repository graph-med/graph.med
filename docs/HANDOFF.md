---
updated: 2026-09-13
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0005 are in
`done/`. WP-0006 is built and reviewed (#55) but **not on `main`**: #56 was cut
before #55 merged, so `agent/2026-09-13-site-colour-by-direction` still holds
its four commits; a pull request from that branch with base `main` carries it
over, and the live site colours boxes by grade until then. The `groupings`
initiative is next: the maintainer decided on 2026-09-13 that axes are
proposed per guideline, tested by a tool, asserted with provenance, then shown
(spec §4.1, memory `grouping-axes-proposed-and-tested`), and WP-0007 to
WP-0010 were reworded to that mechanism on `docs/grouping-axes-mechanism`.

**Claimed.** Nothing.

**Next agent's first move.** Process
`/process-work-package WP-0007 WP-0008 WP-0009 WP-0010` in sequence — each
depends on the one before — stacked on `docs/grouping-axes-mechanism` while
that pull request is open, every pull request with base `main`. Process
nothing that is not listed. Check `git ls-remote --heads origin 'agent/*'`
first.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch it is stacked on (#53–#55 merged into each
other instead of `main`). `uv run tools/screenshot.py <view> --do all --do
fit` prints the overlapping pairs; a build package ends with 0; `--size
390x2700` shows the whole sheet at phone width; an entity page is checked in
the built HTML.
