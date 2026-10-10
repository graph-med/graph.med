# ADR-0009 — The agent registers the work it is sure of; the maintainer gives directions

Status: accepted, 2026-10-10. Supersedes the registration rule of ADR-0005.

## Context

ADR-0005 made the agent manage the board but kept one thing back: it
"registers no work of its own finding — that goes into the final message for
the maintainer". Every run therefore ended with a list of work for the
maintainer to register, and the work waited on a person who supervises the
project from a distance. Planning the third guideline (#314) showed the cost:
six generic cards were drafted, verified against the source and `main`, and
then waited to be registered; two initiatives waited for a field value only
the maintainer was said to add. The maintainer said on 2026-10-10: "the board
is yours to govern", and: "you can register work. i distantly supervise the
project. ask for general directions but register todos you are sure about".

## Decision

- **The agent registers the work it is sure of.** Sure means: the need is
  verified — a defect reproduced on `main`, a gap shown at the place it occurs
  (a file and line, a page of a source, a card's text), a card text
  contradicted by a merged change; the outcome and the scope can be written
  without presuming the answer to an open question; and no card already
  covers it (overlapping work goes into the existing card instead). The card
  is a full package in the board's template, in Todo, with its labels,
  initiative, dependencies and sub-issues, and its header says it was
  registered by the agent and from what.
- **It adds the initiatives such work needs**: the value of the board's
  `Initiative` field and its section in the board's README.
- **It asks for general directions**: which initiative or guideline comes
  next, anything that widens what the project does, and the decisions that
  are a person's — a clinical reading (the physician), a legal question, an
  approval or a merge, anything outside GitHub. What it is not sure of goes
  into its final message as a question, not as a card.
- **Unchanged**: a card's open questions are answered by whom its text names;
  the agent approves and merges nothing; every board write, and every card it
  registers, is named with its number in the session's final message.

## Consequences

The board carries cards no person wrote. Their header line says so, so the
maintainer can find them, and the final message lists them; a card the
maintainer disagrees with is closed as not planned with a comment. The
maintainer's review moves from registering work to reading the pull requests
and answering the questions the agent asks. The skills (`project-board`,
`process-work-package`, `process-next-work-package`), `AGENTS.md`,
`CLAUDE.md`, `tools/board.py` and the board's README say the same.
