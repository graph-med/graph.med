# ADR-0004 — A planning board on GitHub Projects, worked by the bot

Status: accepted, 2026-09-19

## Context

Work is registered as packages under `docs/work/` and delivered through pull
requests (ADR-0001, ADR-0002). What comes *before* a package — the
maintainer's ordering of ideas, what is being looked at, what waits — had no
place: `docs/work/LATER.md` is a list a session may append to, not a board a
person moves things across. The maintainer created a GitHub project,
`planning-graph.med`, in the organisation and asked that the agent be able to
read it, add and move items, and comment on them.

## Decision

- The organisation's project `planning-graph.med` (Todo, In Progress, Done)
  is the **planning board**. The App is granted organisation permission
  Projects: read and write and repository permission Issues: read and write,
  so that the bot works the board and its issues as itself.
- The board is worked through `tools/board.py` and the `project-board` skill.
  A card is by preference an issue in this repository; a draft card has no
  comments and no number.
- The board is a **planning aid, not a control**. The reviewed record of
  agreed work remains the package file under `docs/work/`; the change remains
  the pull request; decisions remain ADRs and memories. Nothing treats a
  card's column as an approval, a claim or a decision, and where the board and
  `docs/work/` disagree, git wins.

## Consequences

The agent can change the board without review, which is the point of a
board and the reason it must carry no authority: an injected instruction in
anything the agent reads could rewrite cards, and the worst it achieves is a
board to tidy, visible in the organisation's audit log under the bot's name.
The App's permission set widened by two items, both listed in memory
`environment/github-app-permissions.md`; "Admin" on projects was deliberately
not granted. Whether cards and work packages mirror each other, and in which
direction, is open (`docs/open-questions.md`, board-and-packages).
