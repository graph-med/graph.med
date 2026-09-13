# ADR-0002 — Parallel sessions as git worktrees in one sandbox

Status: accepted, 2026-09-13

## Context

Work is registered as packages that name their dependencies (ADR-0001), so two
packages that do not depend on each other could be done at the same time. Three
things stood in the way. A sandbox mounts the host's checkout directly, so a
second sandbox on the same directory would share one branch and one index. Every
session rewrites `docs/HANDOFF.md` and prepends to `docs/LOG.md`, so two open
pull requests always conflict there. And the screenshot runner used one fixed
container name on the sandbox's one Docker daemon, removing whatever container
of that name was running.

## Decision

- Parallel sessions run **in one sandbox**, each in its own git worktree under
  `.claude/worktrees/` (gitignored) on its own `agent/YYYY-MM-DD-<slug>` branch;
  a second sandbox on the same directory is not used.
- Each session is told its package by id; the `next-work-package` skill accepts
  one and refuses a package that does not qualify rather than taking another.
- A session rebases on `origin/main` before its pull request, resolving the
  log by keeping both entries and the handoff by rewriting it for the union;
  the handoff lists every package with an open `agent/*` branch.
- Anything a session starts on shared infrastructure is named after its branch;
  the screenshot runner does so by default.
- A package that depends on one still in review either waits or branches from
  the dependency's branch, with its pull request targeting that branch.

## Consequences

Two or three packages of one initiative can be in flight at once, each still
one session, one branch, one pull request, one human approval. The cost is one
rebase per pull request and a merge of two small files by hand when siblings
finish close together. The checker needs no change: several claimed packages
pass, and the stale-claim rule is per package. What remains serial is the
review: pull requests are still approved and merged one at a time by a person.
