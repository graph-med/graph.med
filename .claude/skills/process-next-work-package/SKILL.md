---
name: process-next-work-package
description: Continue the work from the board without being told which card — `/process-next-work-package [label | initiative | card numbers]`. Reads the board, brings it up to date, resumes every card in progress from its work record and last comment, then takes the ready Todo cards (a scope in their text, every blocker closed), optionally narrowed to a label, an initiative or card numbers, announces the set, and processes it as process-work-package does — in parallel where independent, stacked, one pull request per card. Use when a session starts without a named card, or when the maintainer says to continue.
---

# Continue from the board

The board is the single point of truth for work (ADR-0004), and every card
carries its own state: its column, its work record (branch, pull request,
preview), its dependencies, and its comments, the last of which says what was
done and what is left (ADR-0005). This command reads that state and continues.
It is the one command that chooses cards; it chooses only what the board says
is ready, and it announces its choice before starting.

## The command

```
/process-next-work-package                  # everything in progress, then everything ready
/process-next-work-package data-layer       # narrowed to a label
/process-next-work-package extraction-quality   # or an initiative
/process-next-work-package 160 161 168      # or to these cards (as process-work-package, but resuming)
```

## Steps

1. **Read the board and bring it up to date** (the `project-board` skill,
   "Managing the board"): `git fetch origin`, `uv run tools/board.py list`,
   then close the cards whose commits are on `main` and are still open, and
   the stacked pull requests below a merged top, which target branches and do
   not close by themselves (ADR-0006) — and fix any card
   whose column no longer matches its branch or pull request. Name every write
   in the final message.
2. **Find the set**: `uv run tools/board.py ready [--label L | --initiative I]`
   lists the cards in progress, then the Todo cards that are ready, blocked
   (with their open blockers), without a scope, or parents of sub-issues.
   Read every candidate in full (`uv run tools/board.py show <n>`: text, work
   record, dependencies, comments). The set is:
   - every card **in progress** — to be resumed, not restarted;
   - every **ready** Todo card whose text does not itself say it waits (an
     open question in `docs/open-questions.md` named as its blocker, "blocked
     when migrated", "decide with the first …" that has not happened);
   - a **blocked** card whose every open blocker is itself in the set: it runs
     after them, from the top of their stack.

   Not in the set: a card without a scope (a bare title or a one-line idea —
   processing it means asking for its scope); a parent card (its sub-issues
   are the work); a card blocked by something outside the set. Each is named
   with its reason in the final message.
3. **Announce the set and the order before any work**, in the session and as
   a comment on each card of the set ("Picked up by `/process-next-work-package`
   on <date>, <position> of the run"). That announcement is the run's explicit
   end: the run is done when every card announced has a pull request or a
   stated reason why it stopped.
4. **Resume a card in progress** from what the card says, not from memory:
   its work record names the branch and any pull request; its last comment
   says what is done and what is left. Check the branch out into a worktree
   (`git worktree add .claude/worktrees/<card> agent/<card>-<slug>`), compare
   what is on it with the last comment, comment on the card that the work is
   resumed and from which state, and continue with "The worker" of
   `process-work-package` at the step the card had reached. A card in progress
   whose branch is gone, or whose last comment says the work was abandoned, is
   restarted from the card's text, and the card says so.
5. **Process the rest** exactly as `/process-work-package` with the set as its
   list (`.claude/skills/process-work-package/SKILL.md`): one worker per card in
   its own worktree and branch `agent/<card>-<slug>`, in parallel where the
   cards are independent, dependents from their blocker's branch; the judge on
   every data diff; one stack for the run, each pull request against its
   predecessor, handed over as one by retargeting the top to `main` with a
   `Closes` line for every card (ADR-0006); each card's work record and
   progress comments kept by its worker.
6. **Finish** as `process-work-package` does: every pull request with its
   preview URL and place in the stack, the one that targets `main` with the
   preview of the whole stack, every card of
   the set that stopped and why, the cards left out and why, the board writes
   made, and work found for the maintainer to register — none registered.

## What it does not do

It registers no card, answers no card's open question and widens no card's
scope. A card that needs a decision from the maintainer stops at that decision:
the worker says so in a comment on the card and in its report, and the run
continues with the others.
