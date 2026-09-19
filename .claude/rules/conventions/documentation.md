---
description: The three levels of documentation, and what each owes the reader.
paths:
  - "**/*.md"
---

# Writing documentation in this repository

Documentation here exists at three levels. Which level a file belongs to decides
what it owes the reader:

| Level | Answers | If it is wrong |
|---|---|---|
| **Environment** | what is true of the sandbox, the host, and GitHub | commands fail, and you debug the wrong thing |
| **Conventions** | how work is done in this repository | work is rejected, or the repository drifts |
| **Design** | what is being built, and how we intend to get there | the wrong thing gets built, correctly |

Each level has a home: Environment in `README.md` (the contributor half) and
`.claude/rules/environment/` (the agent half); Conventions in
`.claude/rules/conventions/`; Design in `docs/`. Memory (`.claude/memory/`) is not a
level — it is a mechanism, and each fact it stores is filed under the level it
belongs to. Neither is the work registry — the board and its cards (`AGENTS.md`, the
`project-board` skill; ADR-0004), and before 2026-09-19 the frozen files `docs/work/`,
`docs/HANDOFF.md` and `docs/LOG.md`: it records what is to be done and what each
session did, at no level.
`docs/adr/` holds decisions about the repository itself and is Conventions-level
content that lives under `docs/` because a person reads it there.

The levels classify **content, not files**. A file lives at its dominant level, and a
stray sentence of another level does not split one topic into two files —
`environment/git-identity.md` stays whole even though one line of it is a convention.

What each level owes the reader:

- **Environment and Conventions describe what exists.** Present tense, verified. Do
  not document tooling that does not exist. What exists is listed in `CLAUDE.md`
  ("Checks", "Build", "Work"): the validator, the site build, the work-package
  check and the `uv` manifest — no test suite beyond that. A stale description of
  the environment is worse than none, because it gets trusted.
- **Design describes intent.** Describing what is not yet built is its purpose — and
  for exactly that reason a design document states its status at the top, so it can
  never be mistaken for a description of current behaviour.
- **The sandbox is described where the Environment level owns it** — `README.md` for
  contributors, `.claude/rules/environment/sandbox-environment.md` for agents. When
  the sandbox's behaviour changes, update both. Other documents do not restate the
  environment; they cross-reference it, and name an environment fact only where it
  bounds what the document itself is saying.
- **Say where a thing is described, once.** Each fact has one home. Cross-reference
  rather than restate; two copies drift.
