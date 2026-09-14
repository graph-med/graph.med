---
updated: 2026-09-14
---
# Handoff

**Where we are.** Sixteen packages, WP-0001 to WP-0016, in four initiatives
(`ui`, `groupings`, `extraction-quality`, `review`). WP-0001 to WP-0005 and
WP-0007 to WP-0010 are in `done/`; `groupings` is on `main`. This run
processes the open packages as one stack of branches, each on the one before:
WP-0006 (colour by direction, reviewed in #55 but missed by #56) rebased onto
`main`; WP-0015, the "suggest a change" link under every statement's section;
WP-0011, the body-text rule (spec §5.1), its relinking brief in its pull
request; WP-0016, the automated review designed (spec §8.1); WP-0012 and
WP-0013, chapters 4–6 and 7–9 of `pomgat-lv-1.0` under the rule — every
chapter of the source now follows spec §5.1.

**Claimed.** Every package with an open `agent/*` branch in this run, in
stack order:
- WP-0006 — `agent/2026-09-13-site-colour-by-direction`, review.
- WP-0015 — `agent/2026-09-14-site-feedback-affordance`, review.
- WP-0011 — `agent/2026-09-14-body-text-relations-rule`, review.
- WP-0016 — `agent/2026-09-14-llm-as-judge-design`, review.
- WP-0012 — `agent/2026-09-14-relink-body-text-a`, review.
- WP-0013 — `agent/2026-09-14-relink-body-text-b`, review.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Check
`git ls-remote --heads origin 'agent/*'` first. Nothing open remains but
WP-0014, which is blocked; the next run closes what has merged and waits for
the command. A linking pass over body text reads spec §5.1, applies the rule
blind before reading any brief, and does what WP-0012 and WP-0013 did: a wrong
edge is removed from the edge file (git is the history), a kept one gets
`as_of`, `lang` and a `rationale` naming the test and the term, a new claim
gets its one `modelling` edge and no `supports` edge.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.
- `docs/open-questions.md` → ungraded-body-text-claims: ungraded body-text
  `recommendation` claims are on the site (chapters 4–7); they hang under
  their box with no letter and no marker, support no statement, and the sheet
  prints the box's number in front of them. The physician decides on the page.
- `docs/open-questions.md` → judge-provider, attestation-identity,
  edge-address, judge-rerun: what the automated review's design left to a
  person; the first blocks the judge tool.
- The region axis (`axes/region`) stays proposed (13 concepts, 45 statements
  unplaced); `docs/open-questions.md` → statement-slot-provenance waits for a
  decision on where a slot value's rationale lives.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch it is stacked on; the ruleset dismisses an
approval whenever the merge base changes, so a stack is merged one pull
request at a time, `main` merged into the next before its approval. `uv run
tools/screenshot.py <view> --do all --do fit` prints the overlapping pairs; a
build package ends with 0 (`--dark`, `--size 390x2700` for the phone sheet).
The build reads `.github/ISSUE_TEMPLATE/suggest-a-change.md` and stops without
it. The source PDF is cached under the validator's `--cache` directory once
`--verify-quotes` has run; the body-text rule is applied sentence by sentence
to `pdftotext -layout` output, and a quote must lie on one line of it — a
sentence across a page break is quoted from the page it starts on.
