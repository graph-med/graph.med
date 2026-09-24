# graph.med

A collaborative public medical knowledge graph, published at
[graph.med](https://graph.med/). An intuitive walk through the model opens
`README.md`.

Licensed under the PolyForm Noncommercial License 1.0.0 (see `LICENSE`).
Copyright 2026 Robert Schwarzenberg, Anton Zolkin.

The repository is at inception: it currently contains `README.md`, `LICENSE`, this
file, the design documentation under `docs/`, the one schema for the data pool
(`schema/schema.yaml`), the validator that enforces it (`tools/validate.py`) with the
CI workflow that runs it (`.github/workflows/validate.yml`), the pool itself under
`data/` (layout in `data/README.md`), the site build (`tools/build.py`, see "Build"),
the feasibility test of a grouping axis (`tools/axes.py`, see "Checks"), the
screenshot runner (`tools/screenshot.py` with its driver `tools/screenshot.js`, see
"Build") and the Pages workflow (`.github/workflows/pages.yml`), the work-board tool
(`tools/board.py`, see "Work"), `AGENTS.md`, and the `.claude/` directory described
below. There is no source tree beyond these scripts.
Project-specific guidance — data sources and their licenses, setup and test
instructions — belongs in this file once it exists. Do not document tooling that does
not exist.

## Checks

Python tooling is managed with `uv` (`pyproject.toml`, `uv.lock`); never pip. The one
check is the validator. `schema/schema.yaml` is a JSON Schema (draft 2020-12); the
validator applies it to every file under `data/` with the `jsonschema` library, then
checks what a document schema cannot say — references resolve, claim ids hash
correctly, edges are unique, the grouping axes and a view's scope tree hold together,
a derived concept's rules reach the passages that give them (the full list heads the
script):

```bash
uv run tools/validate.py                  # structure, offline
uv run tools/validate.py --verify-quotes  # also downloads each source and checks every quote
```

The second form needs `pdftotext` (poppler) and network access to the sources; it
caches downloads under `~/.cache/graph.med/sources/` by content hash. CI runs both on
every pull request and on every push to `main` (`.github/workflows/validate.yml`).
Run the first form before proposing a change (the contribution workflow’s "run the
checks locally").

`tools/axes.py` is the feasibility test of a grouping axis (`docs/graph-representation.md`
§4.1): it applies one axis definition to one view and prints the report — coverage,
disjointness, the unplaced remainder by name, depth, and for a hierarchy every placement
no `broader` or `in_scope_of` edge carries — reading the places from the definition's
`placements`, which an axis keeps once asserted. It writes nothing; the report goes verbatim into the pull request that
asserts or withdraws the axis.

```bash
uv run tools/axes.py <axis> <view>                          # an axis in the pool: axes/<id> or <id>
uv run tools/axes.py /tmp/graph.med/<axis>.yaml <view>      # a definition not yet committed
```

## Build

`tools/build.py` renders the site described in `docs/publication.md` from `data/`
into `site/` (gitignored): one graph page and one JSON per view, one page and one
JSON per entity, the schema at its `$id`. Offline and deterministic; two seconds.

```bash
uv run tools/build.py                       # site/ for graph.med (base path /)
uv run tools/build.py --base /graph.med/    # for graph-med.github.io/graph.med/
uv run tools/build.py --base /preview/pr12/ --preview 12   # as the preview of pull request 12
```

Open `site/index.html` in a browser to see a change. Templates and the client script
live in `tools/site/`, the page chrome's words in `tools/site/words/` (not published). Inside the sandbox, where there is no browser,
`uv run tools/screenshot.py <path>` renders a page — a view id, an entity page
such as `statements/<id>`, or `/` for the index; `--full` for the whole scrolled
page — in a Chromium container on the sandbox's Docker daemon, writes a PNG under
`/tmp/graph.med/screenshots/` and reports what overlaps on a view page, and on
any other page whether it overflows horizontally (the `screenshot` skill
describes the actions it can take first). Deployment to
GitHub Pages is a workflow file, committed by a person
(`.github/workflows/pages.yml`): validate, build, deploy on every push to `main`,
and one preview per open pull request at `graph.med/preview/pr<N>/`, rebuilt from
the pull request's head after each run of its checks (`docs/publication.md` §6).
Every pull request links its preview — whether or not it changes a page — as a
complete clickable URL (`https://graph.med/preview/pr<N>/<view-id>/`), never a
bare path.

## Where this runs

Inside a Docker Sandbox (`sbx`): only this repository is mounted, outbound network is
deny-by-default, and nothing outside the workspace persists. The agent-facing detail
is in `.claude/rules/environment/sandbox-environment.md`; the contributor-facing half
— the `sbx` commands themselves — is in `README.md`. Both describe one environment, so
a change to it has to reach both.

## How the documentation is organised

Documentation exists at three levels — **environment** (what is true of the world the
work runs in), **conventions** (how work is done here), and **design** (what is being
built, and how we intend to get there). The levels and what each owes the reader are
defined in `.claude/rules/conventions/documentation.md`.

This file describes the **project** and maps the rest. Design lives in `docs/`:
`docs/graph-representation.md` is the authority on how knowledge is represented —
one pool of source-anchored claims and a semantic layer, graphs as versioned views,
provenance, attestations, review — with `schema/schema.yaml` as the authority on
syntax; `docs/publication.md` is the authority on how the pool is shown — the site
at `graph.med`, views as pages, a graph-and-sheet page read on a phone first; and
`docs/open-questions.md`
carries what is not yet decided; the board (see "Work") what is agreed, in
progress and done; `docs/adr/` what was decided about the repository itself.

## Work

Work is registered on the **board**: the organisation's GitHub project
`planning-graph.med` (Todo, In Progress, Done; ADR-0004). A card is an issue
of this repository on it, its text the package. `tools/board.py` reads and
writes it as the bot through `gh api`, holding no credential:

```bash
uv run tools/board.py list          # every card by column
uv run tools/board.py show 92       # a card's text, column and comments
uv run tools/board.py claim 92 --branch agent/92-<slug>   # In Progress, the branch, the work record
uv run tools/board.py record 92 --pr 170 --preview <url>  # the rest of the work record
uv run tools/board.py comment 92 --body-file <file>       # progress, and the handover
uv run tools/board.py ready                               # what is in progress, ready, blocked
```

`AGENTS.md` at the root says how a session picks up work: read the board,
process the cards the command names (`/process-work-package`) or continue
from the board (`/process-next-work-package`) — in sequence or in parallel,
one worker per card in its own git worktree, branch `agent/<card>-<slug>` and
pull request, the session coordinating and stacking — claim each on the
board, keep its work record and report progress on it, and end when each has
a pull request that says `Closes #<card>` and a handover comment. The agent
manages the board (ADR-0005) and registers no work of its own finding. The
`process-work-package` skill is the procedure, `process-next-work-package`
the resumption; the `project-board` skill describes the board; the `handover` skill maintains
`docs/open-questions.md`; decisions about the repository are `docs/adr/`.
The repository holds no registry, log or handoff: the board is the single
point of truth for work, and its README on the project page carries the
columns, the card template and the initiatives (the `Initiative` field groups
the cards).

How an agent is expected to operate lives in `.claude/`, filed by level, so that
each piece loads when it is relevant rather than all of it, always:

```
.claude/
├── README.md                    what lives here, and how rules load
├── settings.json                project settings: plugins enabled for every session here
├── rules/
│   ├── environment/             the world you run in
│   │   ├── sandbox-environment.md   mounts, egress, persistence, shell mechanics
│   │   └── git-identity.md          the bot identity; why you hold no real token
│   └── conventions/             how work is done here
│       ├── contribution-workflow.md what you may and may not do; branch → PR → stop
│       ├── documentation.md         the documentation levels (*.md)
│       ├── governed-files.md        editing agent-governing files (.claude/, .github/, …)
│       ├── memory.md                what project memory is, and the index of it
│       └── no-personal-information.md  nothing that identifies a person or a machine, anywhere
├── memory/                      durable facts, one per file, filed by level
│   ├── environment/
│   ├── conventions/
│   └── design/
├── agents/                      subagent definitions, one .md each
│   └── judge.md                 the automated review (spec §8.1): reads a data diff against its pages, writes nothing
└── skills/
    ├── handover/                end a session: open questions, the handover comment on each card
    ├── process-next-work-package/  continue from the board: resume in progress, take what is ready
    ├── process-work-package/    process the listed cards: coordinate, one worker each
    ├── project-board/           the work board (a GitHub project): managed by the agent, read always
    └── screenshot/              look at a page of the site in a real browser before proposing it
```

Rules without a `paths:` scope load at the start of every session; the two that have
one load when you touch a file they cover.

`memory/` is what an agent has learned about this project that the code does not
record — why a constraint exists, what was decided and rejected. It is checked in, so
it is reviewed and shared rather than private to one machine.
`rules/conventions/memory.md` carries its index.

`agents/` holds exactly one subagent and `skills/` exactly five skills. A subagent
or skill that automates nothing would be guidance pretending to be capability — the
validator is a check, not a task to automate — and each exception earned its place
as a real, repeated task. `judge` is the automated review of
`docs/graph-representation.md` §8.1: run by the coordinator on every branch whose
diff touches `data/`, it reads each new claim against its page, each statement
against its claims, each body-text edge against the rule and each cited page
against the pool, and returns a report the pull request carries; it writes
nothing, names no guideline, and its attestations wait for the schema.
`handover` ends a session by maintaining
`docs/open-questions.md`. `process-work-package` does the cards named with
it — an extraction, a linking pass, a schema change, a build feature, a docs
change, tooling — one worker, branch and pull request each, the session
coordinating; each ends with a pull request and a handover comment on the card.
`process-next-work-package` continues the work from the board without a named
card: it resumes what is in progress from each card's work record and last
comment, then takes what is ready, optionally narrowed to a label or an
initiative. `screenshot` renders a page of the site in a browser container so a
build change is looked at, not only built. `project-board` is the work board,
`planning-graph.med` (Todo, In Progress, Done), through `tools/board.py`,
managed by the agent (ADR-0005). Add another only for another such task — then say in the pull request what it
does and what it is allowed to touch.

One fact, one home: guidance that belongs in a rule is not restated here.
