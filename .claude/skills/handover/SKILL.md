---
name: handover
description: End-of-session handover — update docs/open-questions.md with what the session left open, migrate what it settled into the spec and .claude/memory/design/ (or docs/adr/ for the repository itself), leave the handover as a comment on each card worked (docs/LOG.md and docs/HANDOFF.md are frozen), then commit and deliver through a pull request. Use when a working session ends, or when the user asks to hand over, wrap up, or record open questions.
---

# Handover

Open questions are the one kind of session state with no other home: git records
what changed, the pull request records uncertainty about its diff, and
`.claude/memory/` records what was settled. What is still **undecided** lives in
`docs/open-questions.md`. This skill maintains that file, and nothing else does
the job — an uncommitted note does not survive the sandbox, and an unreviewed
one is not part of the project.

## At the end of a session

1. **Collect.** Walk back through the session for questions that were raised and
   not settled — options weighed, leanings stated, disagreements parked — and for
   questions the session *did* settle.
2. **Update the registry** (`docs/open-questions.md`):
   - Add each new question in the entry format below. One entry per question,
     kebab-case slug, stable once created.
   - Where the session moved an existing question, update its **Leaning** and
     re-date it. Do not silently reverse an earlier leaning: state the new one
     and why it changed.
   - Delete entries that stopped mattering. A registry full of dead questions
     stops being read.
3. **Migrate what settled.** For each settled question, in the same change:
   apply the decision where it belongs (usually the spec or a rule), delete the
   entry, and record the *why* as a memory in `.claude/memory/design/` — format
   and index in `.claude/rules/conventions/memory.md`.
4. **The card.** The session's record is a comment on each card it worked
   (`uv run tools/board.py comment <n> --body-file <file>`): the branch, the
   pull request, what was decided, what was left open or undone. The command
   that named the card is the permission for that comment (`project-board`
   skill). `docs/LOG.md`, `docs/HANDOFF.md` and `docs/work/` are frozen
   history since 2026-09-19 (ADR-0004): read them, never write them.
   `uv run scripts/check-work.py` must still pass. A settled decision about
   the repository itself is an ADR under `docs/adr/`, not a memory.
5. **Deliver like any other change.** Commit on the working branch, push, and
   open or update the pull request, naming the handover in its description.
   Review is not overhead here; a reviewer seeing what was left open *is* the
   handover.

## Entry format

```markdown
## <kebab-slug>  (<file / section it concerns>)
**Question:** one sentence, answerable.
**Options:** the candidates seriously considered, · separated.
**Leaning:** the current position and why, or "none yet" — dated.
**Settled by:** the event that resolves this (a spec version, a decision, an experiment).
```

## At the start of a session

When continuing work this registry covers, read `docs/open-questions.md` before
re-deriving anything — the leanings are previous sessions' conclusions, not
decisions. Challenge one if it is wrong; then update the entry, dated.

## What does not belong in the registry

Anything with a home already: what changed (git history), what a diff is unsure
of (its PR description), what was decided and why (`.claude/memory/`), what the
design intends (`docs/graph-representation.md`). And no session-snapshot files —
the registry is the durable shape of what is open, not a log of who was working.
