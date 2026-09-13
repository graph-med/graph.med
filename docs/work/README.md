# Work packages

How work is registered, picked up, handed over and finished in this repository.
Written for a person joining cold. The short version every agent reads is
`AGENTS.md` at the root; the agent's step-by-step procedure is
`.claude/skills/process-work-package/SKILL.md`.

## Three layers, kept apart

| Layer | File | Granularity | Lifetime |
|---|---|---|---|
| Register | `docs/work/WP-*.md` | one per work package, spans sessions | until done, then `done/` |
| Handover | `docs/HANDOFF.md` | current state, one screen | rewritten every session |
| History | `docs/LOG.md` | one entry per session | append-only, rotated |

A **work package** outlives many sessions and says what is to be done. A
**handoff** is a brief for the next session and says where we are. The **log**
says what happened. Collapsing them into one file is the mistake this layout
exists to avoid.

```
AGENTS.md                      pointer, read every session
docs/
  HANDOFF.md                   current state, rewritten each session
  LOG.md                       history, newest first (LOG-ARCHIVE.md when rotated)
  adr/NNNN-<slug>.md           decisions about the repository itself
  work/
    README.md                  this file
    LATER.md                   work that is named but not registered
    initiatives/<id>.md        one per initiative: title and scope
    WP-NNNN-<slug>.md          one per work package
    done/WP-NNNN-<slug>.md     finished packages
```

## A package

`docs/work/WP-<4 digits>-<kebab-slug>.md`. Ids are never reused; the next id is
one more than the highest in `docs/work/` and `done/` together.

```markdown
---
id: WP-0042
title: Refresh auth tokens before expiry
status: open              # open | claimed | blocked | review | done
created: 2026-09-12
updated: 2026-09-12       # touched only when status changes
depends_on: [WP-0031]     # must be in done/ before this starts
blocks: []                # the inverse of depends_on, kept in sync
owner: unassigned         # unassigned | agent | a handle a person writes for themselves
initiative: ui            # a file under initiatives/
kind: build               # extraction | linking | schema | build | docs | tooling
slug: refresh-auth-tokens # = the file name after the id; the branch and data-file name
# source: sources/<id>    # extraction only …
# pages: 26-39            # … with its physical pages
---

## Outcome
What is true when this is done. Observable, not "implement X".

## Scope
In:  what the package touches.
Out: what it must not widen into, said explicitly.

## Constraints
What the implementation must not violate: spec sections, memories, rules.

## Decisions
Decisions already made and why. Append only; never rewrite. Link `docs/adr/`
for anything about the repository, `.claude/memory/design/` for the knowledge
model.

## Open questions
Questions for a human, named as entries of docs/open-questions.md. An agent
must not silently answer these; a package that waits on one is `blocked`.

## Verification
How to prove it works: commands, captures, acceptance criteria.

## Notes                 (optional)
Anything with no other home. Not progress.
```

**Rules**

- An agent claims a package by setting `status: claimed`, `owner: agent` and
  `updated`, in its own commit, before writing code — on a branch
  `agent/YYYY-MM-DD-<slug>` pushed at once, so the claim is visible to others.
- At most one claimed package per worker at a time. A run processes several
  packages through several workers (see "Processing packages").
- Progress is **not** written into the package. Git has it. Only decisions,
  constraints and open questions go there — what a diff cannot recover.
- A package's work ends with it at `status: review` and a pull request. A
  person reviews and merges it as it is.
- A package whose file on `main` says `status: review` has been reviewed and
  merged — nothing reaches `main` otherwise. **The next agent that sees one
  closes it** without being asked: `status: done`, `updated:` today, `git mv` into
  `done/`, in its own commit ("close WP-NNNN") at the start of its session, on
  the branch of whatever the session does next — the closure rides in that
  session's pull request; no pull request exists just to close a package. So a
  package's `depends_on` is satisfied on that branch as soon as the dependency
  has merged.
- A package that needs more than about one session is split, with `depends_on`.
- `blocked` means a human decision is pending; the package names it.
- Registering a package is a human decision, made in a pull request. Anyone may
  draft one. A session that finds work it cannot do writes it into `LATER.md`.
- No personal names anywhere (`.claude/rules/conventions/no-personal-information.md`).

## Processing packages

One command processes packages, and it names them:

```
/process-work-package WP-0004 WP-0005 WP-0006
```

The session that receives it is the **coordinator** (ADR-0002). It processes
exactly the listed packages — never one that was not listed, never the next
open id in place of one it cannot process, never work from `LATER.md` — and
the run is over when every listed package has a pull request. With no package
listed it reports what could be processed and stops. That is how a person
knows when the work is done.

The coordinator decides, and says, whether the listed packages run **in
sequence or in parallel**: packages independent of each other run at once
unless their Scopes overlap heavily; a package that depends on a listed one
waits for it and starts from its branch. Each package gets one **worker** — a
subagent in its own git worktree under `.claude/worktrees/` (gitignored) on its
own `agent/YYYY-MM-DD-<slug>` branch — and one pull request. A single listed
package the session does itself. Workers run **in one sandbox**, never in a
second sandbox on the same directory, which would share the one checkout.

What the coordinator owes the workers, and they it:

- **A worker stops after pushing** its claim, its work and its handover; it
  does not rebase and does not open the pull request.
- **The coordinator stacks.** It rebases the first branch on `main` and each
  next one on its predecessor, resolving `docs/LOG.md` by keeping every entry
  newest first and `docs/HANDOFF.md` by rewriting it for the union; it runs the
  checks on every branch, opens the pull requests in order — every one
  against `main`, never against its predecessor's branch — and names the
  merge order in each. Until its predecessor merges, a stacked pull request
  shows the predecessor's commits too; merged in order, each lands on `main`.
- **The handoff lists every claimed package** — every package with an open
  `agent/*` branch on `origin` — not only one worker's own.
- **Nothing shared by name.** The Docker daemon is one per sandbox; the
  screenshot runner names its container and output directory after the branch
  by default, and anything else a worker starts follows the same rule.

## The handoff

`docs/HANDOFF.md` is rewritten, not appended, at the end of every session. One
screen at most. It answers only: where are we, what is claimed (every package
with an open `agent/*` branch), what is the next agent's first move, what is
blocked and why. It references packages by id and
never duplicates their content. Its `updated:` date must not be older than the
newest log entry — a stale handoff is worse than none.

## The log

`docs/LOG.md`, newest entry first, one per session:

```markdown
## 2026-09-12 — agent
Packages touched: WP-0042 (claimed → review)
Branch: agent/2026-09-12-refresh-auth-tokens
Notable: chose refresh-on-401 over a background timer, see ADR-0007.
```

Past about 200 lines, move the oldest entries to `docs/LOG-ARCHIVE.md`, newest
first there too. Never delete.

## Validation

`uv run scripts/check-work.py` — also run by `uv run tools/validate.py`, and so
by CI on every pull request — fails on: a duplicate or missing id; an id or slug
not matching the file name; `depends_on` or `blocks` naming a package that does
not exist, or not mirroring each other; a package in `done/` whose status is not
`done`, or the reverse; a claimed package not updated for 7 days; an unknown
status, kind or initiative; a missing section; `docs/LOG.md` over 200 lines or
out of order; `docs/HANDOFF.md` older than the newest log entry, over one screen,
or naming a package that does not exist.

## Where the rest lives

| What | Where |
|---|---|
| What is undecided, with options and leaning | `docs/open-questions.md` |
| Decisions about the knowledge model, and why | `.claude/memory/design/` |
| Decisions about the repository, and why | `docs/adr/` |
| What a change was unsure of | its pull request |
| What was done, line by line | git |
