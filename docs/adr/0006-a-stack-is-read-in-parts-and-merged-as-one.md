# ADR-0006 — A stack is read in parts and merged as one

Status: accepted, 2026-09-24 (the maintainer: "make today's way the rule").
Supersedes ADR-0003 and the stacking parts of ADR-0002.

## Context

A run of several cards ends as a stack of branches, each containing the one
below it. How its pull requests are targeted and merged has changed three
times:

- **ADR-0003 (2026-09-18):** every pull request targeted `main`, and the
  reviewer merged only the top one. Each pull request then showed the whole
  stack below it as its diff; a package's own change was readable only through
  a compare link.
- **2026-09-18 to 2026-09-24:** at the maintainer's request ("the PRs shall be
  stacked. One PR into main, the rest on top"), the bottom pull request
  targeted `main` and each higher one its predecessor's branch, so that each
  showed only its own change. The stack was then merged from the top down,
  each pull request into the branch below it, until the bottom one merged
  into `main`. This recorded one package per pull request, but it took one
  merge per package, in an order every description had to spell out, and a
  stacked pull request's `Closes #n` never fired, because GitHub honours it
  only for a merge into the default branch — so the agent closed those cards
  by hand (ADR-0005).
- **2026-09-24:** with 27 stacked pull requests open (#171 to #208) and a fix
  on top (#209), the maintainer asked for "only the one left, i.e. the one that
  merges into main. i want all changes in that one, i will review them all at
  once". The top pull request was retargeted to `main`, given a `Closes` line
  for every card of the stack, and merged once; the stacked pull requests
  below it were closed with a pointer to it. The maintainer then made that the
  rule.

## Decision

- **Build a run as a stack, for reading.** The first branch starts from
  `main` — or from the top of a stack still open, when the run depends on it,
  and then continues that stack. Each next branch starts from its predecessor.
  Each pull request targets its predecessor's branch, so it shows only its own
  change and carries its own checks, judge report and handover.
- **Hand it over as one pull request, for merging.** When the run is
  complete, the top pull request is retargeted to `main`. Its branch contains
  everything below it, so its diff against `main` is the whole stack. Its
  description says so, lists the stacked pull requests bottom to top with
  their cards, carries one `Closes #n` line for every card of the stack (a
  parent card too, when all its sub-cards are in it), and links the preview of
  the whole stack. Exactly one pull request of a stack targets `main`: when a
  run continues a stack whose top already did, that pull request goes back to
  its predecessor's branch.
- **The maintainer reviews and merges that one.** No pull request is merged
  into another's branch, and the agent merges nothing and approves nothing.
- **After the merge** the agent closes the stacked pull requests below it —
  they target branches and do not close by themselves — with a comment naming
  the pull request that carried them, and checks that every card of the stack
  is in Done (ADR-0005).
- A command that names one card produces one pull request: against `main`,
  or against the top of an open stack it depends on, and then it is that
  stack's new top.

## Consequences

One review and one merge per stack, however many packages it holds, and the
cards close by themselves. Each package's own change, checks and report stay
readable in its own pull request (closed, not merged) and at its compare link.
Rejecting one package in the middle means taking it out of the stack and
rebasing the branches above it before the top is merged; a stack is therefore
worth keeping to one run, or to runs that belong together.
