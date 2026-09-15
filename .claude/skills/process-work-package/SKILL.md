---
name: process-work-package
description: Process the work packages listed with the command (`/process-work-package WP-0004 WP-0005 …`) — the session coordinates: it decides sequence or parallel, runs one worker per package in its own git worktree, branch and pull request, stacks dependent packages, resolves the handoff and the log, opens the pull requests, and processes nothing that was not listed. With no package listed it reports what could be processed and stops.
---

# Process work packages

The command names the packages; nothing else is processed. The session that
receives it is the **coordinator**: it decides the order, runs one **worker**
per package, and ends the run when every listed package has its pull request.
The convention is `docs/work/README.md` (for people) and `AGENTS.md` (the short
form); this file is the procedure.

## The command

```
/process-work-package WP-0004 WP-0005 WP-0006
```

- **Only the listed packages.** Never one that was not listed, never the next
  open id in place of one that cannot be processed, never work from
  `docs/work/LATER.md`; a human registers a package from it.
- **No package listed:** report which packages could be processed — `open`,
  every `depends_on` in `docs/work/done/`, no `agent/*-<slug>` branch on
  `origin` — and which are claimed, blocked or waiting, and stop.
- **The run ends** when every listed package has a pull request, or was
  reported as not processable. That is the answer to "are we done".

## The coordinator

1. `git fetch origin`. Read `docs/HANDOFF.md` first, then `docs/LOG.md`'s newest
   entry. Stay on `main` in the main checkout; never work inside a worktree
   yourself.
2. **Close what has merged.** A package whose file on `origin/main` says
   `status: review` has been reviewed and merged (nothing reaches `main`
   otherwise). For each: `status: done`, `updated: <today>`, `git mv` into
   `docs/work/done/`, one commit per package ("close WP-NNNN") — the first
   commits on the first branch created in step 5, the base of the stack — never
   a pull request of their own. So a listed package's `depends_on` is satisfied
   as soon as the dependency has merged.
3. **Check each listed package.** It exists; its status is `open`; every
   `depends_on` is in `done/` or is itself listed (then it runs after that one,
   from its branch); no branch `agent/*-<slug>` exists on `origin`
   (`git ls-remote --heads origin 'agent/*-<slug>'`). One that fails is
   reported with the reason and left alone; the others proceed.
4. **Decide the order, and say it before starting.** Packages with no
   dependency among the listed run **in parallel** unless their Scopes name the
   same files for more than a stylesheet's worth of change — then in sequence,
   the later stacked on the earlier. A package that depends on a listed one
   waits for that worker and starts from its branch. Prefer parallel when the
   Scopes are apart, sequence when a conflict is certain; either way each
   package keeps its own branch and pull request.
5. **Start each package** when its turn comes:

   ```bash
   git worktree add .claude/worktrees/<slug> -b agent/YYYY-MM-DD-<slug> <base>
   ```

   `<base>` is `main` — or the dependency's branch when it is listed and still in
   review. Then a worker: a subagent told the package id, the worktree path, and
   to follow "The worker" below and stop after pushing. **One package only:** no
   subagent; the session is its own worker on that branch in the main checkout,
   then continues here at step 6.
6. **When a worker returns,** read its report and check its branch: the checks
   pass, the package is at `status: review`, the log has its entry, the handoff
   is rewritten, screenshots were taken for a build package. Start what waited
   on it. A worker that stopped short is asked to finish on the same branch;
   what it could not do is reported to the maintainer, not done by you.
7. **Stack.** In order, rebase the first branch onto `origin/main` and each next
   branch onto its predecessor. A conflict in `docs/LOG.md` keeps every entry,
   newest first; one in `docs/HANDOFF.md` is resolved by rewriting it for the
   union — what is claimed (every package with an open `agent/*` branch), the
   next move, what is blocked; one in a package file keeps both sides. Run
   `uv run tools/validate.py` (and the build, for a build package) on every
   branch after the rebase. Push with `--force-with-lease`; these are your own
   `agent/*` branches.
8. **Open the pull requests** in order, every one with `--base main` — never
   the predecessor's branch: a pull request merged into another branch does not
   reach `main`. Until its predecessor merges, a stacked PR's diff shows the
   predecessor's commits too; merged in order, each lands on `main`. Every PR,
   of every kind, links its preview
   as a complete clickable URL on its own line
   (`https://graph.med/preview/pr<N>/<view-id>/`, a markdown link). The number
   exists only after `gh pr create`: create with a placeholder, then patch the
   body (`gh api -X PATCH repos/<owner>/<repo>/pulls/<N> -F body=@<file>`;
   `gh pr edit` can fail on a deprecated project-cards query). The description
   carries what the worker reported — what was done, what it was unsure of,
   what went to `LATER.md`, any change to the schema, the validator or
   agent-governing files, named explicitly — and, for a stacked PR, what it is
   stacked on and the merge order.
9. **Finish.** `git worktree remove` each worktree. The final message lists every
   pull request with its preview URL, the merge order, and every listed package
   that was not processed and why. Then stop. A person reviews and merges; the
   packages reach `done/` through step 2 of the next run that sees them merged.

## The worker

One package, in the worktree and on the branch the coordinator made — never
`cd` out of it, never a bare `git stash` (the stash is shared with every other
worktree). Alone in a session, the same steps on the branch in the main
checkout.

1. **Claim.** In the package: `status: claimed`, `owner: agent`,
   `updated: <today>`. Commit that alone ("claim WP-NNNN"), push with `-u` at
   once. Only then write code.
2. **Read the package** in full and its initiative
   (`docs/work/initiatives/<initiative>.md`), then what it points at: the spec
   (`docs/graph-representation.md`), `schema/schema.yaml`, `docs/publication.md`
   for a build package, and the entries of `docs/open-questions.md` it names.
3. If the package reads a source (`kind: extraction`, with `source` and `pages`):
   fetch it — URL and expected sha256 are on the source entity under
   `data/sources/`. **Verify the hash.** On mismatch or an unreachable URL, stop:
   fix the source entity if the document merely moved (AWMF renames expired
   assets with an `-abgelaufen` suffix), and hand that over instead. **Never
   parse an expired source.** Extract the pages with `pdftotext -layout`.

If the schema does not cover something the package needs, the schema change is
its own commit **before** the data commit (spec §7) — and is named in the PR.

## By kind

**extraction** — phase one, claims, mechanical: for every sentence of every
recommendation box, and for every body-text sentence that passes the body-text
rule (spec §5.1: kind by its form, one claim per alternative, no grade), a
claim in `data/claims/<source-id>/<slug>.yaml`:

- id `claims/<source-id>/<hash8>` where `hash8` = first 8 hex of
  sha256(`<locator>|<quote>`) — script it, never hand-compute;
- `label`: the full sentence, source language, `lang` tagged; one claim per
  recommendation sentence, never one per box (memory
  `box-granularity-per-sentence`);
- `quote`: a short **verbatim substring** of the extracted text, contiguous on
  one line of the pdftotext output (layout columns break sentences across
  lines — verify each quote by substring search before writing it);
- `grade`, `verb`, `direction`, `consensus`, `recommendation_no`, `section`
  exactly as printed; nothing the box does not state (underestimate, never
  upgrade);
- locator `#page=N` with the **physical** page.

Phase two, linking, judgment, all `modelling`: for each claim, search
`data/statements/` for an existing statement it bears on and
`supports`/`contests` it; mint a statement only when none fits, its slots
referencing concepts. For each slot, search `data/concepts/` and the
terminology namespaces before minting a concept; a new concept gets its
`facet`. A body-text claim attaches to the box claim the rule names, with the
edge the rule gives (`refines`, `supplements`, `limits`; spec §5.1), `modelling`
with a rationale; the sentences of one box get no edge between them. Edges go
to `data/edges/<source-id>/<slug>.yaml`.

**linking** — edits existing entities or adds edges under spec §11: every change
`modelling` or sourced, search before minting, nothing inherited, no review
status written.

**schema** — changes `schema/schema.yaml` and `tools/validate.py` together and
leaves the data valid.

**build** — changes `tools/build.py` and `tools/site/`, checked by building
(`CLAUDE.md`, "Build"), reading the result, and looking at the page in a browser
on desktop and phone (the `screenshot` skill); the PR says what you saw and links
its preview as a **clickable, complete URL** on its own line — scheme and view
page included, `https://graph.med/preview/pr<N>/<view-id>/`, as a markdown link.
The number exists only after `gh pr create`: create with a placeholder, then patch
the body (`gh api -X PATCH repos/<owner>/<repo>/pulls/<N> -F body=@<file>`; `gh pr
edit` can fail on a deprecated project-cards query). Put the same full URL in your
final message to the maintainer; `graph.med/preview/pr<N>/` without the scheme is
not clickable in a terminal.

**docs** and **tooling** — the package's Outcome says what is true when it is
done; the documentation levels (`.claude/rules/conventions/documentation.md`)
say where a change goes; a workflow file is handed over in the PR description
(`.claude/rules/environment/git-identity.md`).

Stay inside the package's Scope. Do not answer its Open questions yourself: a
human answers them in `docs/open-questions.md`. Do not write progress into the
package; a decision you had to make goes under its Decisions, appended.

## The worker's handover

1. **The package:** `status: review`, `updated: <today>`; append to Decisions
   what you decided and why. Do not move it to `done/` yet.
2. **The log:** a new entry at the top of `docs/LOG.md` — date, `agent`, the
   packages touched with their status change, the branch, one notable thing.
   Rotate to `docs/LOG-ARCHIVE.md` if the file passes 200 lines.
3. **The handoff:** rewrite `docs/HANDOFF.md` (its `updated:` today): where we
   are, what is claimed — every package with an open `agent/*` branch on
   `origin`, not only yours — the next agent's first move, what is blocked and
   why. Ids only; no package content. The coordinator merges it with its
   siblings' when it stacks the branches.
4. If a design question surfaced, add it to `docs/open-questions.md`; if the
   package settled one, apply the decision, delete the entry, and record the
   why — a memory under `.claude/memory/design/` for the knowledge model, an
   ADR under `docs/adr/` for the repository (the `handover` skill describes the
   former). Work you found and could not do goes into `docs/work/LATER.md`.
5. Run `uv run tools/validate.py` (it runs `scripts/check-work.py`); for a build
   package also the build and the screenshots (the `screenshot` skill; its
   container and output directory are named after your branch by default).
   Commit and push.
6. **Stop, and report** to the coordinator: the branch, the checks' output, the
   captures taken and what you saw, what you were unsure of, what went to
   `LATER.md`, any change to the schema, the validator or agent-governing files.
   You do not rebase and you do not open the pull request; the coordinator does,
   in order, for the whole stack. Alone in a session, do steps 7 to 9 of "The
   coordinator" yourself.
