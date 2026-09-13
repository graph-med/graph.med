# Agents: how to pick up work here

1. Read `docs/HANDOFF.md` first — one screen: where we are, what is claimed, what
   is blocked, the next agent's first move.
2. Close what has merged: a package on `main` with `status: review` is reviewed
   and merged — set `status: done`, `git mv` it into `docs/work/done/`, one commit
   per package, before anything else.
3. Pick a package from `docs/work/`: `status: open`, every `depends_on` already in
   `docs/work/done/`, lowest id first. One claimed package per agent at a time.
4. Claim it in its own commit before writing code: `status: claimed`,
   `owner: agent`, `updated:` today, on branch `agent/YYYY-MM-DD-<slug>`, pushed at
   once so the claim is visible. Sessions run in parallel each in a git worktree
   on such a branch, told their package by id (`docs/work/README.md`, "Parallel
   work").
5. Work inside the package's Scope; never widen it; never answer its Open questions
   yourself — a human answers them in `docs/open-questions.md`.
6. End every session with: a `docs/LOG.md` entry (newest first), `docs/HANDOFF.md`
   rewritten, the package at `status: review`, a rebase on `main`, and a pull
   request a person reviews. Run `uv run tools/validate.py` first — it checks all
   of this.

The convention in full, written for people: `docs/work/README.md`. The project
itself: `CLAUDE.md`. The step-by-step procedure an agent follows:
`.claude/skills/next-work-package/SKILL.md`.
