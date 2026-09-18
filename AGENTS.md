# Agents: how to pick up work here

1. Read `docs/HANDOFF.md` first — one screen: where we are, what is claimed, what
   is blocked, the next agent's first move.
2. Close what has merged: a package on `main` with `status: review` is reviewed
   and merged — set `status: done`, `git mv` it into `docs/work/done/`, one commit
   per package, before anything else.
3. Process the packages the command lists (`/process-work-package WP-0004
   WP-0005`), and no other: each must be `status: open` with every `depends_on`
   in `docs/work/done/` or itself listed. Given several, decide whether they run
   in sequence or in parallel — one worker per package, each in a git worktree —
   and stack their branches, always, so the pull requests merge once, from the
   top (`docs/work/README.md`, "Processing packages").
   Given none, report what could be processed and stop.
4. A package is claimed in its own commit before any code: `status: claimed`,
   `owner: agent`, `updated:` today, on branch `agent/YYYY-MM-DD-<slug>`, pushed at
   once so the claim is visible.
5. Work inside the package's Scope; never widen it; never answer its Open questions
   yourself — a human answers them in `docs/open-questions.md`.
6. Every package ends with: a `docs/LOG.md` entry (newest first), `docs/HANDOFF.md`
   rewritten, the package at `status: review`, and a pull request a person
   reviews; the run ends when every listed package has one. Run
   `uv run tools/validate.py` first — it checks all of this.

The convention in full, written for people: `docs/work/README.md`. The project
itself: `CLAUDE.md`. The step-by-step procedure an agent follows:
`.claude/skills/process-work-package/SKILL.md`.
