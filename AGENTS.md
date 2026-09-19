# Agents: how to pick up work here

Work is registered on the **board** — the GitHub project `planning-graph.med`
of the organisation (ADR-0004; the `project-board` skill). A card is an issue
of this repository on it; Todo is registered and not started, In Progress has
an agent's branch on it, Done has merged.

1. Read the board first: `uv run tools/board.py list`, then each card the
   command names in full, `uv run tools/board.py show <n>` — its text is the
   package, its comments the earlier claims and handovers, its Initiative
   field the scope it serves.
2. Process the cards the command lists (`/process-work-package 92 93`), and no
   other: each must be in Todo, with a scope in its text and every card it
   depends on in Done or itself listed. Given several, decide whether they run
   in sequence or in parallel — one worker per card, each in a git worktree —
   and stack their branches, always, so the pull requests merge once, from the
   top (`.claude/skills/process-work-package/SKILL.md`). Given none, report
   what could be processed and stop.
3. Claim a card before any code: `uv run tools/board.py claim <n> --branch
   agent/YYYY-MM-DD-<slug>` moves it to In Progress and comments the branch;
   push the branch at once so the claim is visible.
4. Work inside the card's text; never widen it; never answer its open
   questions yourself — a human answers them in `docs/open-questions.md`.
5. Every card ends with a pull request that says `Closes #<n>` on its own line
   and links its preview, a handover comment on the card, and
   `uv run tools/validate.py` passing; the run ends when every listed card
   has its pull request. Merging closes the issue and the board moves the
   card to Done.
6. **Write to the board only with the maintainer's permission.** The command
   that names a card permits its claim and its handover comment; anything
   else — a new card, a move, an edit — only when the maintainer asks. Work
   you find goes into your final message; the maintainer registers it.

There is no registry, log or handoff in the repository: the board is the
single point of truth for work, and its README (on the project page) carries
the columns, the card template and the initiatives. The project itself:
`CLAUDE.md`. The step-by-step procedure an agent follows:
`.claude/skills/process-work-package/SKILL.md`.
