---
name: process-work-package
description: Process the cards listed with the command (`/process-work-package 92 93 …`, issue numbers of cards on the work board `planning-graph.med`) — the session coordinates: it decides sequence or parallel, runs one worker per card in its own git worktree, branch and pull request, claims each card on the board, stacks every branch of the run on the one before (each pull request against its predecessor, so each shows its own change), opens the pull requests with `Closes #<card>`, hands the stack over as one by retargeting its top pull request to main with a `Closes` line for every card, keeps each card's work record (branch, pull request, preview) and progress comments, leaves the handover as a comment on each card, and processes nothing that was not listed. With no card listed it reports what could be processed and stops; `/process-next-work-package` is the command that chooses from the board.
---

# Process cards from the board

The command names the cards; nothing else is processed. The session that
receives it is the **coordinator**: it decides the order, runs one **worker**
per card, and ends the run when every listed card has its pull request. The
board and its columns are described in the `project-board` skill (ADR-0004);
`AGENTS.md` is the short form; this file is the procedure.

## The command

```
/process-work-package 92 93 98
```

- **Only the listed cards.** Never one that was not listed, never the next
  Todo card in place of one that cannot be processed; the maintainer decides
  what is registered and what is next.
- **No card listed:** report what `uv run tools/board.py ready` shows — the
  cards in progress, the Todo cards that could be processed, and those that
  wait and on what — and stop. Continuing from the board without a named card
  is `/process-next-work-package` (its own skill).
- **The run ends** when every listed card has a pull request, or was reported
  as not processable. That is the answer to "are we done".

## The coordinator

1. `git fetch origin`. Read the board, then every listed card in full
   (`uv run tools/board.py show <n>`: text, column, comments — an earlier
   session's claim and handover are comments there). Stay on `main` in the
   main checkout; never work inside a worktree yourself.
2. **Bring the board up to date** (ADR-0005; the `project-board` skill,
   "Managing the board"). A stack reaches `main` through its top pull request,
   whose description says `Closes #<card>` for every card of the stack
   (ADR-0006), so its merge closes them all. Close any card of it that is
   still open once its commits are on `main` (`uv run tools/board.py close
   <n>`), and close the stacked pull requests below the merged top — they
   target branches and do not close by themselves — with a comment naming the
   pull request that carried them. Name every such write in the final message.
3. **Check each listed card.** It exists and is in Todo (a card in In
   Progress belongs to a branch already — resume it from its work record and
   last comment rather than start again); its
   text states an outcome and a scope (a bare title is not a package — report
   it, do not invent one); every card its text says it depends on is in Done
   or is itself listed (then it runs after that one, from its branch) — the
   card's "blocked by" (`show <n>`) and the dependencies its text names; no
   branch of the card exists on `origin` yet
   (`git ls-remote --heads origin 'agent/<n>-*'`; one that does is resumed
   from its work record and last comment, as `process-next-work-package`
   describes). One that fails is reported with the reason and left alone; the
   others proceed.
4. **Decide the order, and say it before starting.** Cards with no dependency
   among the listed run **in parallel** unless their scopes name the same
   files for more than a stylesheet's worth of change — then in sequence, the
   later stacked on the earlier. A card that depends on a listed one waits
   for that worker and starts from its branch. Either way each card keeps its
   own branch and pull request, and the branches of the run end as one stack
   (step 7).
5. **Start each card** when its turn comes. The branch names the card:
   `agent/<n>-<slug>`, where `<slug>` is a kebab-case gist of the title in at
   most five words.

   ```bash
   git worktree add .claude/worktrees/<n>-<slug> -b agent/<n>-<slug> <base>
   ```

   `<base>` is `main` — or the dependency's branch when it is listed and still
   in review. Then a worker: a subagent told the card number, the worktree
   path, and to follow "The worker" below and stop after pushing. **One card
   only:** no subagent; the session is its own worker on that branch in the
   main checkout, then continues here at step 6.
6. **When a worker returns,** read its report and check its branch: the checks
   pass, the card is In Progress with the claim comment, screenshots were
   taken for a build card. Start what waited on it. A worker that stopped
   short is asked to finish on the same branch; what it could not do is
   reported to the maintainer, not done by you.
7. **Stack — always,** whether the cards ran in parallel or in sequence. In
   order, rebase the first branch onto `origin/main` — or onto the top of a
   stack still open when the run depends on it (then the new run continues
   that stack) — and each next branch onto its predecessor, so that every branch contains the branches below it and
   the top branch contains the whole run. Run `uv run tools/validate.py` (and
   the build, for a build card) on every branch after the rebase. On every
   branch whose diff touches `data/`, run the **judge** (`.claude/agents/judge.md`,
   spec §8.1): a subagent of that definition, told the branch, that reads the
   diff against its pages and the rules and returns its report; it writes
   nothing. Push with `--force-with-lease`; these are your own `agent/*`
   branches.
8. **Open the pull requests** in order, bottom first: the bottom one with
   `--base main` (or the open stack's top branch it continues), each higher one
   with `--base <predecessor's branch>`, so each shows only its own change and
   carries its own report (ADR-0006). A run of one card is one pull request
   against `main`, or against the open stack's top it continues.
   The description carries, each on its own line: **`Closes #<card>`** (so
   that the merge closes the issue and the board moves the card to Done); the
   preview as a complete clickable URL
   (`https://graph.med/preview/pr<N>/<view-id>/`, a markdown link — the
   number exists only after `gh pr create`: create with a placeholder, then
   patch the body with `gh api -X PATCH repos/<owner>/<repo>/pulls/<N> -F body=@<file>`;
   `gh pr edit` can fail on a deprecated project-cards query); what the
   worker reported — what was done, what it decided and why, what it was
   unsure of, what it found and could not do, any change to the schema, the
   validator or agent-governing files, named explicitly; the judge's report
   in full under its own heading, when the diff touches `data/` (until the
   schema carries its words, the report is where its findings live); and, for a stacked
   PR, its place in the stack (`2 of 3, stacked on #N`) and its compare link
   (`https://github.com/<owner>/<repo>/compare/<predecessor>...<branch>`). Write the pull request and its preview into the card's
   work record (`uv run tools/board.py record <n> --pr <N> --preview <url>`).
   Then **the handover comment** on the card
   (`uv run tools/board.py comment <n> --body-file <file>`): the branch, the
   pull request and its place in the stack, what was decided, what was left
   open or undone. This is the one record of the session on that card; the
   command that named the card is the permission for it.
9. **Hand the stack over as one pull request** (ADR-0006). Retarget the
   **top** pull request to `main`
   (`gh api -X PATCH repos/<owner>/<repo>/pulls/<top> -f base=main`); its
   branch contains everything below it, so its diff against `main` is the whole
   stack. Rewrite its description: that it carries the whole stack, a table of
   the stacked pull requests bottom to top with their cards, one
   **`Closes #<card>`** line for every card of the stack (a parent card too,
   when all of its sub-cards are in it), and the preview of the whole stack.
   Where the run continued an open stack whose top already targeted `main`,
   that pull request goes back to its predecessor's branch, so that exactly
   one pull request of a stack targets `main`. The maintainer reviews and
   merges only that one; the agent merges nothing, and no pull request is
   merged into another's branch.
10. **Finish.** `git worktree remove` each worktree. The final message lists
   every pull request with its preview URL and its place in the stack, the one
   that now targets `main` with the preview of the whole stack, every board
   write made, every listed card that was not processed and why, and work
   found that the maintainer may want to register as a card — the agent
   registers none. Then stop. A person reviews and merges; the board moves
   the cards.

## The worker

One card, in the worktree and on the branch the coordinator made — never
`cd` out of it, never a bare `git stash` (the stash is shared with every other
worktree). Alone in a session, the same steps on the branch in the main
checkout.

1. **Claim.** `uv run tools/board.py claim <n> --branch agent/<n>-<slug>`
   moves the card to In Progress, comments the branch and writes it into the
   card's work record. Push the branch with `-u` at once, empty if need be, so
   the claim and the branch are visible together. Only then write code.
   **From here the card is yours to manage** (ADR-0005): comment on it at every
   step that changes what the next session would do — a part done, a check run
   and its result, a blocker met, a decision taken — each comment saying what
   is done and what is left, so that a session that starts after yours
   continues from the card alone
   (`uv run tools/board.py comment <n> --body-file <file>`).
2. **Read the card** in full (`show <n>`), the cards it depends on, and what
   it points at: the spec (`docs/graph-representation.md`),
   `schema/schema.yaml`, `docs/publication.md` for a build card, and the
   entries of `docs/open-questions.md` it names, and its initiative (the
   board's README describes each).
3. If the card reads a source (an extraction, with a source entity and pages):
   fetch it — URL and expected sha256 are on the source entity under
   `data/sources/`. **Verify the hash.** On mismatch or an unreachable URL,
   stop: fix the source entity if the document merely moved (AWMF renames
   expired assets with an `-abgelaufen` suffix), and hand that over instead.
   **Never parse an expired source.** Extract the pages with `pdftotext -layout`.

If the schema does not cover something the card needs, the schema change is
its own commit **before** the data commit (spec §7) — and is named in the PR.

## By kind

A card says what kind of work it is, in its text or by what it touches.

**extraction** — phase one, claims, mechanical: for every sentence of every
marked recommendation, whatever its form (spec §3.1), and for every body-text
place — a sentence, a footnote, a table or figure read in rows — that passes
the body-text rule (spec §5.1, which also says its `kind`, that it is never
graded, and which declines are gap notices), a claim in
`data/claims/<source-id>/<slug>.yaml`:

- id `claims/<source-id>/<hash8>` where `hash8` = first 8 hex of
  sha256(`<locator>|<quote>`) — script it, never hand-compute;
- `label`: the full sentence, source language, `lang` tagged; one claim per
  sentence of a box, never one per box (memory
  `box-granularity-per-sentence`); a table claim as §5.1 K reads it
  ("Kopf: Zelle; …", reference marks left out);
- `quote`: a short **verbatim substring** of the extracted text, contiguous on
  one line of the pdftotext output and inside one cell where columns
  interleave — a box's grade column, a table's cells (layout columns break
  sentences across lines — verify each quote by substring search before
  writing it);
- `grade` and `consensus` as the box prints them, reaching its sentences as
  spec §3.1 says (the grade to its recommendation and gap-notice sentences,
  the consensus to all); `verb`, `direction`, `recommendation_no` and
  `section` (the section the box lies in, never its number) as printed;
  nothing the box does not state (underestimate, never upgrade);
- locator `#page=N` with the **physical** page.

Phase two, linking, judgment, all `modelling`: for each claim, search
`data/statements/` for an existing statement it bears on and
`supports`/`contests` it; mint a statement only when none fits, its slots
referencing concepts. For each slot, search `data/concepts/` and the
terminology namespaces before minting a concept; a new concept gets its
`facet`. A box's fact or criterion sentence supports the statement spec §3.1
names, a definition sentence none (its concept's `defined_by` reaches it), a gap
notice none; a rule printed inside a box sentence stays in that claim and its
concept stays stated — name each in the pull request (open question
rule-claim-granularity). A body-text claim supports no statement: it gets the
edge spec §5.1 gives it (`refines`, `limits`, `supplements`, to the claim the
rule names, its `rationale` naming the clause and the term), a decline none,
and the rule's N clauses say what gets none. Edges go to
`data/edges/<source-id>/<slug>.yaml`.

**linking** — edits existing entities or adds edges under spec §11: every change
`modelling` or sourced, search before minting, nothing inherited, no review
status written.

**schema** — changes `schema/schema.yaml` and `tools/validate.py` together and
leaves the data valid.

**build** — changes `tools/build.py` and `tools/site/`, checked by building
(`CLAUDE.md`, "Build"), reading the result, and looking at the page in a browser
on desktop and phone (the `screenshot` skill); the PR says what you saw and links
its preview as a **clickable, complete URL** on its own line
(`https://graph.med/preview/pr<N>/<view-id>/`, a markdown link). Put the same
full URL in your final message to the maintainer; `graph.med/preview/pr<N>/`
without the scheme is not clickable in a terminal.

**docs** and **tooling** — the card's outcome says what is true when it is
done; the documentation levels (`.claude/rules/conventions/documentation.md`)
say where a change goes; a workflow file is handed over in the PR description
(`.claude/rules/environment/git-identity.md`).

Stay inside the card's scope. Do not answer its open questions yourself: a
human answers them in `docs/open-questions.md`. Do not edit the card's text
beyond its work record (`tools/board.py record`); a decision you had to make
goes into a comment on the card, the pull request description and the
handover comment.

## The worker's handover

1. **No log, no handoff file** — the repository holds none (ADR-0004). The
   record of the work is the pull request and the handover comment on the
   card, which the coordinator writes once the pull request exists.
2. If a design question surfaced, add it to `docs/open-questions.md`; if the
   card settled one, apply the decision, delete the entry, and record the why
   — a memory under `.claude/memory/design/` for the knowledge model, an ADR
   under `docs/adr/` for the repository (the `handover` skill describes the
   former). Work you found and could not do goes into your report, for the
   maintainer to register as a card; you register none.
3. Run `uv run tools/validate.py`; for a
   build card also the build and the screenshots (the `screenshot` skill; its
   container and output directory are named after your branch by default).
   Commit and push.
4. **Stop, and report** to the coordinator: the branch, the checks' output, the
   captures taken and what you saw, what you decided and why, what you were
   unsure of, what you found and left, any change to the schema, the validator
   or agent-governing files. You do not rebase and you do not open the pull
   request; the coordinator does, in order, for the whole stack. Alone in a
   session, do steps 7 to 10 of "The coordinator" yourself.
