---
description: Extra care required when editing the files that govern agents and CI.
paths:
  - .claude/**
  - .github/**
  - CLAUDE.md
  - AGENTS.md
  - CODEOWNERS
  - mcp/src/descriptions.js
---

# You are editing a file that governs agents

`.github/`, `.claude/`, `CLAUDE.md` and `AGENTS.md` decide what an agent is told and what CI runs.
A change here is the highest-leverage change available to you and the least likely to be
read carefully. `mcp/src/descriptions.js` is governed the same way: its tool descriptions
and intended-use wording decide what Claude is told about graph.med's content, and so what
Claude tells its users. (`CODEOWNERS` is in this rule's scope so that creating one is
treated the same way; no such file exists today.)

- **Nothing here is off-limits to edit.** What stops an unreviewed change is the same
  thing that stops any other: every pull request to `main` needs a human approval.
- **Call it out explicitly in the PR description.** Name the file and say what the
  change permits that was not permitted before. This is the whole safeguard: a rule change
  riding along in a feature diff is genuinely easy to miss. Do not bundle it with
  unrelated work.
- **Never weaken a constraint to unblock yourself.** If a rule, a deny list or a
  workflow is stopping you, that is a question for the user, not an edit to make.
  Report what blocked you and why you think the rule is wrong.
- **Keep the split honest.** `CLAUDE.md` is the project's own description; the files in
  `.claude/rules/` are the operating instructions. Guidance that belongs in a rule
  should not be duplicated back into `CLAUDE.md` — one home per fact.
