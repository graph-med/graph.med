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
- One command, `/process-work-package WP-… WP-…`, names the packages. The
  session that receives it coordinates: it processes exactly those — never one
  not listed, never a substitute, and with none listed it reports and stops —
  and decides whether they run in sequence or in parallel, one worker subagent
  per package in its worktree. A single package the session does itself.
- A worker stops after pushing its handover. The coordinator rebases the first
  branch on `main` and each next on its predecessor, resolving the log by
  keeping every entry and the handoff by rewriting it for the union, and opens
  the pull requests in order, each stacked on the one before and every one
  targeting `main`; the handoff lists
  every package with an open `agent/*` branch. The run ends when every listed
  package has a pull request.
- Anything a session starts on shared infrastructure is named after its branch;
  the screenshot runner does so by default.
- A package that depends on one still in review either waits or branches from
  the dependency's branch. Its pull request still targets `main`: a pull
  request merged into another branch does not land on `main` (the branch is
  not retargeted unless the dependency's branch is deleted on merge), and the
  merge order named in the description is what keeps the stack in sequence.

## Consequences

Two or three packages of one initiative can be in flight at once, each still
one worker, one branch, one pull request, one human approval, and a person
still knows when a run is over: when what they listed has its pull requests.
The former "one package per session" rule goes; its purpose — a known end — is
kept by the list. The cost is one rebase per pull request and a merge of two
small files by the coordinator when siblings finish close together. The checker needs no change: several claimed packages
pass, and the stale-claim rule is per package. What remains serial is the
review: pull requests are still approved and merged one at a time by a person.
