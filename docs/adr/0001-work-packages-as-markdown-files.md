# ADR-0001 — Work packages as markdown files, with handoff and history apart

Status: superseded by ADR-0004, 2026-09-19 (the registry moved to the board; the files were removed, git history keeps them)

## Context

Work for agent sessions was registered in one YAML file (`data/PROGRESS.yaml`,
then briefly `WORK.yaml`): passes of chunks per source, shaped around parsing
one guideline. Every session edited the one file, half its commits were
bookkeeping, and the file mixed three things — what is to do, what the next
session must know, and what happened — so that a reviewer could not read a
package in a diff.

## Decision

- **Register:** one markdown file per work package under `docs/work/`,
  `WP-NNNN-<slug>.md`, ids never reused, frontmatter for the machine (status,
  dates, dependencies, owner, initiative, kind) and sections for people
  (Outcome, Scope, Constraints, Decisions, Open questions, Verification).
  Finished packages move to `docs/work/done/`.
- **Handover:** `docs/HANDOFF.md`, one screen, rewritten every session; it
  references packages by id and duplicates nothing.
- **History:** `docs/LOG.md`, append-only, newest first, one entry per session,
  rotated to `docs/LOG-ARCHIVE.md`.
- **Validation:** `scripts/check-work.py`, run by `tools/validate.py` and so by
  CI on every pull request.
- Undecided questions stay in `docs/open-questions.md`; decisions about the
  knowledge model stay memories under `.claude/memory/design/`; this directory
  holds decisions about the repository itself.

## Consequences

A reviewer reads a package, a claim or a handoff as a small diff. Two agents can
hold different claimed packages at once. Progress is never written into a
package; git has it. Session history now has a home, `docs/LOG.md`, and is kept
out of every other file. Human names are still written nowhere by an agent
(`.claude/rules/conventions/no-personal-information.md`): `owner` is `agent`,
`unassigned`, or a handle a person writes for themselves.
