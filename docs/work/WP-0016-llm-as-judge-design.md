---
id: WP-0016
title: Design the automated review that lands as attestations
status: review
created: 2026-09-12
updated: 2026-09-14
depends_on: [WP-0011]
blocks: []
owner: agent
initiative: review
kind: docs
slug: llm-as-judge-design
---

## Outcome

`docs/graph-representation.md` §8 says what an automated review ("LLM as a
judge") checks — each claim against its quoted page (grade, verb, direction,
number as printed), each statement against its supporting claims, each body-text
edge against the rule — how its findings land (as attestations by a software
agent under `agents/`, spec §8, never as edits), where it runs (a tool under
`tools/` on a pull request's diff, as a human-committed workflow), and what it
must not do (approve, merge, rewrite). The follow-up packages are proposed in
the PR and their entries drafted in `docs/work/LATER.md`.

## Scope

In: `docs/graph-representation.md` §8, `docs/open-questions.md` for whatever the
design leaves open, `docs/work/LATER.md`.
Out: any code; any workflow file; any attestation.

## Constraints

Review is a signed attestation (spec §8); a judge is one more agent with a
recorded identity and no write access to the pool beyond attestations. The
workflow's token stays read-only (`README.md`, "Checks").

## Decisions

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- **The findings are committed by the pull request's author on the judge's
  behalf, in the pull request they judge; a human-committed, read-only
  workflow runs the same tool on the same diff and reports in the run's
  summary.** Why: the review exists to inform the reviewer before the merge,
  so the findings must be in the diff; the workflow cannot write and should
  not; a follow-up pull request arrives too late and needs a writer per merged
  pull request; an artifact a person commits is a step nobody takes at thirty
  claims. The second run is what stands in for a signature the judge cannot
  give — the judge's finding is a reading, not a proof.
- **Agreement is recorded, not only dispute**, as an attestation with a claim
  word the schema does not yet carry (`consistent` in the spec's example).
  Why: review state is derived from attestations (§8); "not judged" and
  "judged, found consistent" must be distinguishable, and a judged subject
  that changes must fall back to unjudged, which only a hashed attestation
  does. `validated` is the quote check, `expert_reviewed` a person's.
- **A dispute never blocks.** Why: the spec's rule — stale downgrades, only
  invalid blocks (§8); a model's reading is not a schema violation.
- **One agent entity for the role, not one per model**; model, prompt hash
  and tool version go into each attestation's proof. Why: a finding stays
  traceable when the model changes, and the agent namespace does not fill
  with configurations.
- **Three checks, no more**: claim against page, statement against claims,
  body-text edge against §5.1 — never medical truth, never anything the diff
  did not touch. Why: the package's outcome names these three; the judge
  judges the extraction, not the guideline.
- Not decided here, left to `docs/open-questions.md`: the model and its key
  (judge-provider), attestation ids on parallel branches
  (attestation-identity), the URL form of an edge (edge-address), when the
  pool is re-judged (judge-rerun).

## Open questions

None.

## Verification

A reader of §8 can say for one concrete claim what the judge would check, what
it would write, and where. Validator passes.
