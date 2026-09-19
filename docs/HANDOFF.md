---
updated: 2026-09-19
---
# Handoff

**Where we are.** Twenty-seven packages, WP-0001 to WP-0027, in five
initiatives. WP-0001 to WP-0010, WP-0017, WP-0019 to WP-0022 and WP-0027 are
in `done/`. WP-0023, WP-0024 and WP-0025 (#86–#88, one stack) merged on
2026-09-19 and still read `status: review` — close them first. The last
session (2026-09-19) processed no package: it connected the bot to the
maintainer's planning board, `planning-graph.med` (`tools/board.py`, the
`project-board` skill, ADR-0004), in one pull request. WP-0016 is in review (#67). WP-0011, WP-0012,
WP-0013 and WP-0015 were implemented on `agent/2026-09-14-*` branches whose
pull requests (#66, #68, #69, #65) were closed unmerged; their files read
`open` on `main` — reopen, rebase or re-register is a maintainer decision.
WP-0026 and WP-0018 are `open`, unclaimed; WP-0018 was a prior session's
inference from an unspecific request — confirm its scope before claiming it.

**Claimed.**
- WP-0023, WP-0024, WP-0025 — merged (#86–#88), to be closed into `done/`.
- WP-0016 — `agent/2026-09-14-llm-as-judge-design`, PR #67, in review.
- WP-0011, WP-0012, WP-0013, WP-0015 — branches on `origin`, pull requests
  closed unmerged, no running worker.

**Next agent's first move.** `git fetch origin`, close what has merged
(WP-0023 to WP-0025: `status: review` on `origin/main` → `done/`), then process only what the
command lists (`docs/work/README.md`, "Processing packages"); stale
`agent/*` branches of `done/` packages on the remote can be ignored. The
extraction pass that fills `claim.evidence` is in `docs/work/LATER.md`, to be
registered once WP-0023 has merged; until it runs zone 4 reads `Evidenz:
nicht erfasst` or, on EK-only statements, `Expertenkonsens, keine
Evidenzbewertung`.

**Blocked, and why.**
- WP-0014 — waits on `docs/open-questions.md` → structural-recommendations.
- The region axis (`axes/region`) stays proposed (13 concepts, 45 statements
  unplaced); `docs/open-questions.md` → statement-slot-provenance waits on
  where a slot value's rationale lives.
- WP-0024's open questions (zone 8's review line once an attestation exists;
  the family line under `Eingriff`) and WP-0025's (several evidence systems;
  the system shown as its slug) are the maintainer's; an outcome without a
  rating has no schema shape (`LATER.md`).

**Watch out.** The planning board is a planning aid: read it with
`uv run tools/board.py list`, move a card when asked or when it names a
package whose state changed, create none on your own (`project-board` skill;
`docs/open-questions.md` → board-and-packages). Every pull request links its preview as a complete clickable
URL (`https://graph.med/preview/pr<N>/<view-id>/`). A stacked pull request
targets `main`, never the branch below it; a stack is merged once, from the
top, with a merge commit (ADR-0003). Check open pull requests before
numbering a new package. **The `screenshot` skill needs the `sbx` sandbox's
own Docker daemon** (memory `environment/screenshot-skill-needs-sbx-docker.md`).
No evidence vocabulary goes into the schema, the validator or the build;
`EVIDENCE_SCALES` (`tools/build.py`) is a display order, read for the range
only (memory `design/claim-evidence-per-outcome.md`).
The card's words live in `CARD_WORDS` (`tools/build.py`) with no fallback: a
new language or enum value fails the build until its key exists. `group_by`
may name only what is asserted for that view (validator).
