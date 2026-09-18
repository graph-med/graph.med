---
updated: 2026-09-18
---
# Handoff

**Where we are.** Twenty-seven packages, WP-0001 to WP-0027, in five
initiatives. WP-0001 to WP-0010, WP-0017, WP-0019 to WP-0022 and WP-0027 are
in `done/` (WP-0021 and WP-0022 closed on this run's base branch). This run
processes WP-0023, WP-0024 and WP-0025 as one stack: WP-0023 (schema 0.6.0,
`claim.evidence`) and WP-0024 (the nine-zone statement card) ran in parallel
and are at `status: review`, WP-0024 stacked on WP-0023; WP-0025 (zone 4)
depends on both and follows on top. WP-0016 is in review (#67). WP-0011,
WP-0012, WP-0013 and WP-0015 were implemented on `agent/2026-09-14-*`
branches whose pull requests (#66, #68, #69, #65) were closed unmerged;
their files read `open` on `main` — reopen, rebase or re-register is a
maintainer decision. WP-0026 is `open`, unclaimed. WP-0018 is `open`,
unclaimed — a prior session's inference from an unspecific request; confirm
or redirect its scope before claiming it.

**Claimed.**
- WP-0023 — `agent/2026-09-18-schema-claim-evidence`, review; the base of
  this run's stack, carrying the closures of WP-0021 and WP-0022.
- WP-0024 — `agent/2026-09-18-site-statement-card-nine-zones`, review,
  stacked on WP-0023.
- WP-0025 — starts from WP-0024's branch, stacked on it, the top of the stack.
- WP-0016 — `agent/2026-09-14-llm-as-judge-design`, PR #67, in review.
- WP-0011, WP-0012, WP-0013, WP-0015 — branches on `origin`, pull requests
  closed unmerged, no running worker.

**Next agent's first move.** `git fetch origin`, close what has merged
(`status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"). Stale
`agent/*` branches of `done/` packages are still on the remote and can be
ignored. The extraction pass that fills `claim.evidence` is in
`docs/work/LATER.md`, to be registered once WP-0023 has merged; until it
runs every statement's zone 4 reads `Evidenz: nicht erfasst`, honestly.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.
- The region axis (`axes/region`) stays proposed (13 concepts carrying 45
  statements unplaced); `docs/open-questions.md` → statement-slot-provenance
  waits on where a slot value's rationale lives.
- WP-0024's open questions (zone 8's review line once an attestation exists;
  the family line under `Eingriff`) are the maintainer's.

**Watch out.** Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch below it; a stack is merged once, from the
top, with a merge commit (ADR-0003). Check open pull requests before
numbering a new package. **The `screenshot` skill needs the `sbx` sandbox's
own Docker daemon** (memory `environment/screenshot-skill-needs-sbx-docker.md`).
No evidence vocabulary goes into the schema, the validator or the build
(memory `design/claim-evidence-per-outcome.md`). The card's words live in
`CARD_WORDS` (`tools/build.py`) with no fallback: a new language, grade or
consensus value fails the build until its key exists. `group_by` may name
only what is asserted for that view (validator).
