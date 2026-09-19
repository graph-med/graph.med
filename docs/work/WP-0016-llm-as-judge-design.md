---
id: WP-0016
title: Design the automated review that lands as attestations
status: migrated
created: 2026-09-12
updated: 2026-09-19
card: 96
depends_on: [WP-0011]
blocks: []
owner: unassigned
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

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

## Open questions

None.

## Verification

A reader of §8 can say for one concrete claim what the judge would check, what
it would write, and where. Validator passes.
