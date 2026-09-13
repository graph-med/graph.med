---
updated: 2026-09-13
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0005 are in
`done/`. WP-0006 is built and reviewed (#55) but **not on `main`**: #56 was cut
before #55 merged, so `agent/2026-09-13-site-colour-by-direction` still holds
its four commits; a pull request from that branch with base `main` carries it
over. The `groupings` initiative is three branches deep, each stacked on the
one before: the mechanism (spec §4.1) on WP-0007's, schema 0.5.0 with the
validator rules and `tools/axes.py` on WP-0008's, and on WP-0009's the first
axes — the phase asserted on all 90 statements of `pomgat-lv-1.0`, the region
proposed and left so with its report. WP-0010 builds the switch on that;
until the view declares `group_by: [axes/phase]`, nothing on the site changes.

**Claimed.**
- WP-0007 — `agent/2026-09-13-grouping-axes-decision`, in review.
- WP-0008 — `agent/2026-09-13-schema-grouping-axes`, in review, stacked on
  WP-0007's branch.
- WP-0009 — `agent/2026-09-13-link-grouping-axes`, in review, stacked on
  WP-0008's branch.

**Next agent's first move.** The coordinator of the current run starts
WP-0010 from WP-0009's branch, every pull request with base `main`. A later
session: `git fetch origin`, close what has merged (`status: review` on
`origin/main` → `done/`), then process only what the command lists. Check
`git ls-remote --heads origin 'agent/*'` first.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch it is stacked on. `uv run tools/screenshot.py
<view> --do all --do fit` prints the overlapping pairs; a build package ends
with 0; `--size 390x2700` shows the whole sheet at phone width. An axis is
tested with `uv run tools/axes.py <axis-id or file> <view>` before it is
asserted, and the report goes verbatim into the asserting pull request; the
tool never writes under `data/`. A dimension's values are concepts of facet
`qualifier`, minted before the axis that lists them (spec §7). The only
asserted axis is `axes/phase`; `axes/region` is proposed, and `group_by` may
name only what is asserted (validator). A slot value's rationale is in the
commit that set it — the statement carries no per-property provenance.
