# ADR-0004 — The work board on GitHub Projects is the single point of truth for work

Status: accepted, 2026-09-19. Supersedes ADR-0001. Its permission rule is superseded by ADR-0005, its reference to how a stack merges (ADR-0003) by ADR-0006.

## Context

ADR-0001 registered work as markdown files under `docs/work/`, with a
handoff and a log beside them, so that every registration and every state
change was a reviewed commit. That put the maintainer's planning inside pull
requests: registering an idea, reordering what is next, or noting that a
package waits meant editing files and merging. The maintainer created a
GitHub project, `planning-graph.med`, for that planning, had the bot given
access to it, and decided to migrate the registry to it entirely.

## Decision

- **The board is the work registry.** A card is an issue of this repository
  on the organisation's project `planning-graph.med`; its column is its
  state. Todo: registered by the maintainer, not started — new initiatives
  are registered here. In Progress: an agent's branch is on it. Done: its
  pull request merged and closed the issue; the board's own automation moves
  the card.
- **The card's text is the package**: the shape ADR-0001's template gave a
  package (Outcome, Scope, Constraints, Decisions, Open questions,
  Verification) is the recommended shape of a card's text and lives in the
  board's README. Every package — open, blocked and done — was migrated as a
  card carrying its text verbatim, with the former file named at the top;
  done packages are closed cards in Done. The **Initiative** field carries
  what the initiative files carried, and the board's README describes each
  initiative.
- **The process keeps its mechanics** and changes its records. The command
  names cards instead of package ids; a worker claims by moving the card to
  In Progress with a comment naming its branch; the pull request says
  `Closes #<card>`; the handover is a comment on the card. ADR-0002 (one
  worker per card in a git worktree) and ADR-0003 (one stack, merged once
  from the top) apply unchanged.
- **The agent writes to the board only with the maintainer's permission**:
  the command that names a card permits its claim and its handover comment;
  any other write happens because the maintainer asked for it in the
  session. The agent registers no card — work it finds goes into its final
  message.
- **`docs/work/`, `docs/LOG.md`, `docs/LOG-ARCHIVE.md`, `docs/HANDOFF.md`
  and `scripts/check-work.py` are removed.** The board is the single point of
  truth for what is planned, in progress and done; git history keeps the
  files as they were. The entries of `docs/work/LATER.md` became Todo cards
  too. A session leaves no log entry and no handoff file.
- The App holds organisation Projects and repository Issues, read and write,
  for this (memory `environment/github-app-permissions.md`); "Admin" on
  projects was deliberately not granted.

## Consequences

Registering and reordering work no longer needs a pull request, which is the
point. The reviewed record of a change stays the pull request; the reviewed
record of a decision stays an ADR or a memory; the board carries state, not
authority — where a card and the repository disagree, git wins. The agent can
change the board without review, so the permission rule above is a
convention, not an enforced gate: what enforces it is the organisation's
audit log, where every board write appears under the bot's name. A session
no longer leaves a handoff file; the next session reads the board and each
card's comments instead, so a handover comment that is not written is a
handover lost. The history of work before the migration is on the board
(the Done cards) and in git; nothing in the repository duplicates it.
