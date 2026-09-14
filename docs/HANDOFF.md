---
updated: 2026-09-14
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0005 and
WP-0007 to WP-0010 are in `done/`; `groupings` is on `main`. This run
processes the open packages as one stack of branches, each on the one before:
WP-0006 (colour by direction, reviewed in #55 but missed by #56) rebased onto
`main`; WP-0015, the "suggest a change" link under every statement's section,
prefilled from the issue template under `.github/ISSUE_TEMPLATE/`; WP-0011,
the body-text rule (spec §5.1) — the relinking brief is in its pull request;
WP-0016, the automated review designed (spec §8.1) with its follow-ups drafted
in `docs/work/LATER.md`; WP-0012 relinks chapters 4–6 by the rule.

**Claimed.** Every package with an open `agent/*` branch in this run, in
stack order:
- WP-0006 — `agent/2026-09-13-site-colour-by-direction`, review.
- WP-0015 — `agent/2026-09-14-site-feedback-affordance`, review.
- WP-0011 — `agent/2026-09-14-body-text-relations-rule`, review.
- WP-0016 — `agent/2026-09-14-llm-as-judge-design`, review.
- WP-0012 — `agent/2026-09-14-relink-body-text-a`.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first. WP-0013 opens when WP-0012 is
in `done/`; the coordinator of this run stacks it on WP-0012's branch. The
automated review's follow-ups — the canonical hash, the schema words, the
judge tool, its agent and its workflow — are entries in `docs/work/LATER.md`;
a person registers them.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.
- `docs/open-questions.md` → ungraded-body-text-claims: how an ungraded
  body-text `recommendation` claim shows on the site; decide against the first
  one WP-0012 extracts.
- `docs/open-questions.md` → judge-provider, attestation-identity,
  edge-address, judge-rerun: what the automated review's design left to a
  person; the first blocks the judge tool.
- The region axis (`axes/region`) stays proposed (13 concepts carrying 45
  statements unplaced; the proposer decides `several: true` or withdrawal);
  `docs/open-questions.md` → statement-slot-provenance waits for a decision on
  where a slot value's rationale lives.

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
