---
updated: 2026-09-14
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0005 and
WP-0007 to WP-0010 are in `done/`; the `groupings` initiative is on `main`.
This run processes the open packages as one stack of branches, each on the
one before: WP-0006 (colour by direction, reviewed in #55 but missed by #56)
rebased onto `main` from its own branch; WP-0015, the "suggest a change" link
under every statement's section, prefilled from the issue template under
`.github/ISSUE_TEMPLATE/`; WP-0011, the body-text rule (spec §5.1) checked
against the pool — the chapter-by-chapter brief for the two relinking passes
is in its pull request.

**Claimed.** Every package with an open `agent/*` branch in this run, in
stack order:
- WP-0006 — `agent/2026-09-13-site-colour-by-direction`, review.
- WP-0015 — `agent/2026-09-14-site-feedback-affordance`, review.
- WP-0011 — `agent/2026-09-14-body-text-relations-rule`, review.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first. WP-0012 (chapters 4–6) and
WP-0016 (the automated review) open when WP-0011 is in `done/`, WP-0013 after
WP-0012; the coordinator of this run stacks them on WP-0011's branch. A
relinking pass reads spec §5.1 first and takes the edge list from WP-0011's
pull request as its brief; every new edge `modelling` with a rationale naming
the test and the term.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.
- `docs/open-questions.md` → ungraded-body-text-claims: how an ungraded
  body-text `recommendation` claim shows on the site; decide against the first
  one WP-0012 extracts.
- The region axis (`axes/region`) stays proposed: its report reproduces the
  organ families and leaves 13 concepts carrying 45 statements unplaced; the
  proposer decides `several: true` or withdrawal. `docs/open-questions.md` →
  statement-slot-provenance waits for a decision on where a slot value's
  rationale lives.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch it is stacked on; the ruleset dismisses an
approval whenever the merge base changes, so a stack is approved and merged
one pull request at a time, `main` merged into the next before its approval,
and a stack is cut only after everything below it has merged. `uv run
tools/screenshot.py <view> --do all --do fit` prints the overlapping pairs; a
build package ends with 0; `--do by=section` or `--do by=<axis id>` chooses
the grouping, `--dark` the dark theme, `--size 390x2700` the whole sheet at
phone width. `uv run tools/axes.py` tests an axis before it is asserted; its
report goes verbatim into the asserting pull request. The build reads
`.github/ISSUE_TEMPLATE/suggest-a-change.md` and stops without it. The source
PDF is cached under the validator's `--cache` directory once `--verify-quotes`
has run; the body-text rule (spec §5.1) is applied sentence by sentence to
`pdftotext -layout` output, and a quote must lie on one line of it.
