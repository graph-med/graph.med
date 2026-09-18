# ADR-0003 — A stack of pull requests merges once, from the top

Status: accepted, 2026-09-18

## Context

A run of several packages ends as a stack of branches, each rebased on the one
before, one pull request each, every one targeting `main` (ADR-0002). ADR-0002
named a bottom-up merge order: the first pull request merges, then the next.
In practice that meant merging `main` into the next pull request after each
merge, and under the ruleset every such push dismissed the approval already
given — one update and one re-approval per pull request, for changes the
reviewer had already read. ADR-0002 also left it open whether packages that
ran in parallel are stacked at all; a run that was not stacked conflicted in
`docs/HANDOFF.md` and `docs/LOG.md` at every merge but the first.

## Decision

- The branches of one run **always form one stack**, whether the packages ran
  in parallel or in sequence: the coordinator rebases the first on `main` and
  each next on its predecessor, so each branch contains every branch below it
  and the top branch contains the whole run.
- Every pull request still targets `main`. Its description says where it sits
  in the stack, what it is stacked on, which pull request is the top, and
  carries a compare link (`compare/<predecessor branch>...<own branch>`) that
  shows this package's commits alone.
- **The stack merges once, from the top.** The reviewer reads the pull
  requests from the top down — the reverse of the order they were opened in —
  and merges only the top one, **with a merge commit**. Every lower branch is
  an ancestor of that merge, so GitHub marks the lower pull requests merged.
  Nothing is merged bottom-up and no pull request is updated with `main` on
  the way.

## Consequences

One merge per run, one approval that is not dismissed by a housekeeping push,
and every package of the run reaches `main` together; the closing rule
(`status: review` on `main` means merged) holds unchanged for each. The
merge must be a merge commit: a squash or a rebase merge rewrites the commits,
the lower pull requests then stay open and have to be closed by hand. A
package the reviewer rejects cannot be left out without rebasing the branches
above it; the coordinator does that on request, and a stack is kept short —
the two or three packages of one run. A stack still open when the next run
starts is a base for it: a listed package that depends on one in review
branches from that branch, and the new stack's top then carries both.
