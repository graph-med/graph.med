# ADR-0005 — The agent manages the board; a card carries its own work record

Status: accepted, 2026-09-23. Supersedes the permission rule of ADR-0004.

## Context

ADR-0004 let the agent write to the board only for the card a command named
(its claim and its handover comment) or when the maintainer asked for a
specific write. Four days later the board had drifted from the repository: six
cards whose pull requests had merged were still open, because only the bottom
pull request of a stack merges into `main` and GitHub honours `Closes #n` only
there; three package issues sat in no column; a card with an implementation on
a branch was still in Todo. Nobody's permission covered fixing that. The
maintainer said on 2026-09-23: "you are the one responsible for managing the
board."

The same day showed a second gap. A session ends and the next one starts from
nothing but the board, so what a card's worker knew — which branch, how far it
got, which pull request, what was left — has to be on the card, or it is lost.

## Decision

- **The agent manages the board.** It keeps the board in step with the
  repository without being asked for each write: it closes a card whose pull
  request's commits are on `main` (a stacked one included), puts an open
  package issue on the board after checking that it is neither done nor
  deprecated, moves a card whose column no longer matches its branch or pull
  request, records dependencies (GitHub's issue dependencies, "blocked by")
  and sub-issues, tags cards with the board's labels, and splits or merges
  cards when the maintainer asks — carrying into the new cards' text every
  decision and commitment recorded in the old cards' comments, since a worker
  follows the text of its own card. Every write is named, with the card's
  number, in the session's final message. It still **registers no work of its
  own finding** — that goes into the final message for the maintainer — and it
  approves and merges nothing.
- **The worker manages its card.** Whoever works a card claims it, keeps its
  **work record** (a `## Work record` section in the card's text: branch, pull
  request, preview URL) current with `tools/board.py record`, and reports
  progress as comments at every step that changes what the next session would
  do. The last comment is where the next session starts. The rest of the
  card's text is the maintainer's and is not edited by the worker.
- **A branch names its card**: `agent/<card>-<slug>`.
- **`/process-next-work-package` continues from the board.** Without being
  told a card, it resumes every card in progress from its work record and last
  comment, then takes the ready Todo cards — a scope in their text, every
  blocker closed — optionally narrowed to a label, an initiative or card
  numbers, and processes them as `/process-work-package` does, in parallel
  where they are independent. The run still has an explicit end: the set it
  announces at the start, each with a pull request or a reason it stopped.
- **The `judge` agent is the second reader** of every diff that touches
  `data/` (spec §8.1; the design of #96).

## Consequences

The board can be trusted as the state of the work without a person tending it,
and a session can be interrupted at any point: the next one reads the card and
continues. The agent's writes remain unreviewed, as in ADR-0004; the
organisation's audit log is still what shows them, and the final message is
where the maintainer reads them. `/process-work-package <cards>` keeps its
meaning — only the named cards; `/process-next-work-package` is the one
command that chooses, and it chooses only what the board says is ready.
