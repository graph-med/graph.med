---
name: next-work-package
description: Pick up the next open work package from docs/work/ — one per session — claim it, do it, and hand over (LOG entry, HANDOFF rewritten, status review, pull request). Invoke at the start of a session, optionally with a package id (`/next-work-package WP-0005`) when sessions run in parallel; it reports "nothing open" when no package can be claimed.
---

# Do the next work package

One session does **one work package** and ends with a complete handover. The
convention is `docs/work/README.md` (for people) and `AGENTS.md` (the short
form); this file is the procedure.

## Before working

1. `git fetch origin`. Read `docs/HANDOFF.md` first, then `docs/LOG.md`'s newest
   entry.
2. **Close what has merged.** A package whose file on `origin/main` says
   `status: review` has been reviewed and merged (nothing reaches `main`
   otherwise). For each: `status: done`, `updated: <today>`, `git mv` into
   `docs/work/done/`, one commit per package ("close WP-NNNN") — the first
   commits of your session, on the branch you are about to claim on (so branch
   first, from `main`; the claim commit follows), fused into that session's
   pull request — never a pull request of its own. Do not wait to be asked and
   do not leave it for the handoff to mention.
3. **Pick.** Among `docs/work/WP-*.md` with `status: open`, those whose every
   `depends_on` is in `docs/work/done/`; the lowest id wins. Skip `claimed`,
   `review` and `blocked`. Also skip a package whose slug already has a branch
   `agent/*-<slug>` on `origin` (`git ls-remote --heads origin 'agent/*-<slug>'`):
   someone claimed it and the claim has not merged yet. **If nothing qualifies,
   report "nothing open" — which packages are claimed, blocked or waiting on
   dependencies — and stop.** Never take work from `docs/work/LATER.md`; a human
   registers a package from it. **Invoked with a package id** (parallel
   sessions, `docs/work/README.md` "Parallel work"): take that package if it
   qualifies by the same rules; if it does not, say why and stop — never take
   the next one instead.
4. **Claim.** On `agent/YYYY-MM-DD-<slug>` from `main` (created in step 2 if a
   package was closed). A session started in a git worktree already on that
   branch stays on it. In the package: `status: claimed`, `owner: agent`,
   `updated: <today>`. Commit that alone ("claim WP-NNNN"), push with `-u` at
   once. Only then write code.
5. **Read the package** in full and its initiative
   (`docs/work/initiatives/<initiative>.md`), then what it points at: the spec
   (`docs/graph-representation.md`), `schema/schema.yaml`, `docs/publication.md`
   for a build package, and the entries of `docs/open-questions.md` it names.
6. If the package reads a source (`kind: extraction`, with `source` and `pages`):
   fetch it — URL and expected sha256 are on the source entity under
   `data/sources/`. **Verify the hash.** On mismatch or an unreachable URL, stop:
   fix the source entity if the document merely moved (AWMF renames expired
   assets with an `-abgelaufen` suffix), and hand that over instead. **Never
   parse an expired source.** Extract the pages with `pdftotext -layout`.

If the schema does not cover something the package needs, the schema change is
its own commit **before** the data commit (spec §7) — and is named in the PR.

## By kind

**extraction** — phase one, claims, mechanical: for every recommendation box
(and any criterion the box text depends on), a claim in
`data/claims/<source-id>/<slug>.yaml`:

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
`facet`. Criteria claims attach with `refines` to the claim they qualify. Edges
go to `data/edges/<source-id>/<slug>.yaml`.

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

## The handover

1. **The package:** `status: review`, `updated: <today>`; append to Decisions
   what you decided and why. Do not move it to `done/` yet.
2. **The log:** a new entry at the top of `docs/LOG.md` — date, `agent`, the
   packages touched with their status change, the branch, one notable thing.
   Rotate to `docs/LOG-ARCHIVE.md` if the file passes 200 lines.
3. **The handoff:** rewrite `docs/HANDOFF.md` (its `updated:` today): where we
   are, what is claimed — every package with an open `agent/*` branch on
   `origin`, not only yours — the next agent's first move, what is blocked and
   why. Ids only; no package content.
4. If a design question surfaced, add it to `docs/open-questions.md`; if the
   package settled one, apply the decision, delete the entry, and record the
   why — a memory under `.claude/memory/design/` for the knowledge model, an
   ADR under `docs/adr/` for the repository (the `handover` skill describes the
   former). Work you found and could not do goes into `docs/work/LATER.md`.
5. Run `uv run tools/validate.py` (it runs `scripts/check-work.py`); for a build
   package also the build. Commit. Then `git fetch origin` and rebase on
   `origin/main` — a parallel session may have merged meanwhile. A conflict in
   `docs/LOG.md` keeps both entries, newest first; one in `docs/HANDOFF.md` is
   resolved by rewriting it for the union (what is claimed, what is next, what is
   blocked); one in a package file keeps both changes. Run the checks again.
   Push, open a PR — every PR, of every kind,
   links its preview as a complete clickable URL
   (`https://graph.med/preview/pr<N>/<view-id>/`, see **build**). The PR description: what was
   done, what you were unsure of, what went to `LATER.md`, and any change to the
   schema, the validator or agent-governing files, named explicitly.
6. Stop. A person reviews and merges the pull request as it is; the package
   reaches `done/` through step 2 of the next session that sees it merged.
