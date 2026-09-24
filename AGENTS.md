# Agents: how to pick up work here

Work is registered on the **board** — the GitHub project `planning-graph.med`
of the organisation (ADR-0004; the `project-board` skill). A card is an issue
of this repository on it; Todo is registered and not started, In Progress has
an agent's branch on it, Done has merged.

1. Read the board first: `uv run tools/board.py list` (or `ready`, which also
   says what is blocked and on what), then each card in full,
   `uv run tools/board.py show <n>` — its text is the package, its work record
   the branch, pull request and preview, its "blocked by" what it waits on,
   its comments what earlier sessions did, the last one what is left.
2. **Which cards.** `/process-work-package 92 93` processes the cards it names
   and no other. `/process-next-work-package [label | initiative | cards]`
   continues from the board: it resumes every card in progress from its work
   record and last comment, then takes the ready Todo cards — a scope in
   their text, every blocker closed — and announces the set before starting.
   Either way each card needs a scope in its text; given several, the session
   decides sequence or parallel — one worker per card, each in a git worktree —
   and stacks their branches, each pull request against its predecessor so
   each shows its own change; then it retargets the top one to `main` with a
   `Closes` line for every card, and that one pull request is reviewed and
   merged for the whole stack (ADR-0006;
   `.claude/skills/process-work-package/SKILL.md`).
3. Claim a card before any code: `uv run tools/board.py claim <n> --branch
   agent/<n>-<slug>` moves it to In Progress, comments the branch and writes
   the card's work record; push the branch at once so the claim is visible.
   **The branch names its card.**
4. **Manage the card you work** (ADR-0005): comment on it at every step that
   changes what the next session would do, saying what is done and what is
   left; keep its work record current (`tools/board.py record`). A session
   that starts after yours continues from the card alone.
5. Work inside the card's text; never widen it; never answer its open
   questions yourself — a human answers them in `docs/open-questions.md`. A
   diff that touches `data/` goes through the `judge` agent before its pull
   request.
6. Every card ends with a pull request that says `Closes #<n>` on its own line
   and links its preview, the preview and pull request in its work record, a
   handover comment on the card, and `uv run tools/validate.py` passing; the
   run ends when every card of the run has its pull request.
7. **The agent manages the board**: it closes the cards whose commits are on
   `main` and are still open, and the stacked pull requests below a merged top
   (they target branches and stay open otherwise), keeps columns, dependencies and sub-issues true, and names every
   write in its final message. It registers no work of its own finding — that
   goes into the final message, for the maintainer to register.

There is no registry, log or handoff in the repository: the board is the
single point of truth for work, and its README (on the project page) carries
the columns, the card template and the initiatives. The project itself:
`CLAUDE.md`. The step-by-step procedure an agent follows:
`.claude/skills/process-work-package/SKILL.md`.
