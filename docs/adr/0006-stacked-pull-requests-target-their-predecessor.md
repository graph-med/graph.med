# ADR-0006 — A stacked pull request targets its predecessor's branch

Status: accepted, 2026-09-23 (the maintainer's rule since 2026-09-18). Supersedes
the "every pull request targets `main`" of ADR-0003.

## Context

ADR-0003 kept every pull request of a stack targeting `main` and had the
reviewer merge only the top one. Each pull request then showed the whole stack
below it as its diff, and the reviewer read a package's own change only through
a compare link. On 2026-09-18 the maintainer asked for the stack to be built
the other way: "the PRs shall be stacked. One PR into main, the rest on top",
and on 2026-09-21 confirmed how it is merged: from the top, each pull request
into the branch below it, until the bottom one merges into `main`.

## Decision

- The bottom pull request of a run targets `main`; **each higher one targets
  the head branch of the pull request below it**, so each shows only its own
  change.
- **The stack merges from the top down**: the top pull request merges into its
  base, that one — now carrying the change above it — into its own base, and
  so on, until the bottom one merges into `main`, the one merge that reaches
  it. No pull request is updated with `main` on the way. Every pull request
  description and handover comment spells the chain out (`#152 → #151 → … →
  #145`).
- Only the bottom pull request closes its card on merge (GitHub honours
  `Closes #n` only for the default branch). The agent closes the cards of the
  others once the stack's commits are on `main` (ADR-0005).
- Stacking applies to a run of several cards; a command that names one card
  produces one pull request against `main`.

## Consequences

A reviewer reads each pull request as one package. A pull request merged
bottom-up lands in a branch, not in `main` — the failure ADR-0003 was written
against — so the order of merging matters and is written into every
description. Rejecting a package in the middle still means rebasing the
branches above it.
