---
updated: 2026-09-13
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0005 and
WP-0007 to WP-0010 are in `done/`: the `groupings` initiative is on `main` —
the axis mechanism (spec §4.1), schema 0.5.0 with `tools/axes.py`, the phase
asserted on the first source, and the switch on the site (Population · Kapitel
· Perioperative Phase). WP-0006 is built and reviewed (#55) but **not on
`main`**: #56 was cut before #55 merged, so
`agent/2026-09-13-site-colour-by-direction` still holds its four commits; a
pull request from that branch with base `main` carries it over, and the live
site colours boxes by grade until then.

**Claimed.** Nothing.

**Next agent's first move.** Wait for the command. Processable now, each with
its dependencies in `done/`: WP-0011 (the body-text rule, opens WP-0012 →
WP-0013 and WP-0016), WP-0015 (the "suggest a change" link). Process nothing
that is not listed. Check `git ls-remote --heads origin 'agent/*'` first.

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
approval. `uv run tools/screenshot.py <view> --do all --do fit` prints the
overlapping pairs; a build package ends with 0; `--do by=section` or `--do
by=<axis id>` chooses the grouping first; `--size 390x2700` shows the whole
sheet at phone width. An axis is tested with `uv run tools/axes.py <axis-id or
file> <view>` before it is asserted, and the report goes verbatim into the
asserting pull request; the tool never writes under `data/`. `group_by` may
name only what is asserted for that view (validator); the chapters need no
axis. The build's per-language table is `WORDS` in `tools/build.py`; a
hierarchy axis is built over `population` only; the `section` filter form is
implemented in `members_of` and used by no view.
