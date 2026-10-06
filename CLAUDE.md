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
"Build") and the Pages workflow (`.github/workflows/pages.yml`), the MCP deploy workflow
(`.github/workflows/mcp.yml`, see "Build"), the work-board tool
(`tools/board.py`, see "Work"), the read-only MCP server with its Worker entry point
and its check (`mcp/`, see "Checks" and "Build"), `AGENTS.md`, and the `.claude/` directory described
below. Beyond these scripts the one source tree is `mcp/` (ADR-0007).
Project-specific guidance — data sources and their licenses, setup and test
instructions — belongs in this file once it exists. Do not document tooling that does
not exist.

## Checks

Python tooling is managed with `uv` (`pyproject.toml`, `uv.lock`); never pip. The
check of the pool is the validator; the MCP server has a check of its own (below).
`schema/schema.yaml` is a JSON Schema (draft 2020-12); the validator applies it to every file under `data/` with the `jsonschema` library, then
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

`mcp/` is the read-only MCP server (`docs/publication.md` §8; ADR-0007): Node,
JavaScript ES modules, no compile step, its dependencies pinned in
`mcp/package.json` and `mcp/package-lock.json` and installed with `npm ci`
(`mcp/node_modules/` and `mcp/.wrangler/` are gitignored). It reads only the site's
files for programs, by `fetch`, from a base URL — `https://graph.med/`, a preview, or
a local build served over HTTP — and exposes six tools (list graphs, list a graph's
groupings, get a tree node, get an entity, search, get provenance) through a server
factory, `createServerFactory({ base })` in `mcp/src/server.js`. Its one entry point
is the Worker, `mcp/src/worker.js`, which serves the factory as stateless Streamable
HTTP at `/mcp` (`createMcpHandler` of the Agents SDK) and reads the base from the
Worker variable `LAYER0_BASE`; `mcp/wrangler.toml` configures it for Cloudflare
Workers (ADR-0008). The tool descriptions, and the words every result carries, are
one file, `mcp/src/descriptions.js`. Its check drives the Worker's handler over
Streamable HTTP with scripted MCP clients (the 2.x SDK's for the walk, the 1.x SDK's
`initialize` handshake beside it), walks every view the index lists and every
grouping of each, and compares each result with the files it was read from — the
quote gate, graph separation, deep links, paging, sizes, the requests per call, and
the transport (405 for GET and DELETE on `/mcp`, 404 elsewhere, ping). With
`--worker` it runs the same through the Worker in Workers' local runtime
(`wrangler dev`, workerd, local mode; no Cloudflare account or login), counts
each request's subrequests from the runtime's trace, and profiles the isolate for
CPU per request against Workers Free's 10 ms:

```bash
npm --prefix mcp ci                                   # once: the pinned dependencies
npm --prefix mcp run check                            # the synthetic Layer 0 (mcp/test/fixture.js)
uv run tools/build.py --origin http://localhost:8272 && npm --prefix mcp run check -- --site ../site
npm --prefix mcp run check -- --base https://graph.med/preview/pr<N>/   # a published site
npm --prefix mcp run check -- --worker --fixture --site ../site         # the same, through wrangler dev
```

The third form serves the build at the origin it was built for (rebuild without
`--origin` for anything else). Run the first form, and the third after a change to
`mcp/` or to the files for programs; add `--worker` after a change to the Worker,
its configuration or its dependencies.

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
JSON per entity, the schema at its `$id`. Every entity JSON carries `meta` (its
absolute URLs, its views, its sources' licence lines, review status, provenance,
commit), a concept's also its `statements` per view and where it `appears_in` each
grouping (`docs/publication.md` §4). For programs it also writes `index.json` and
`llms.txt` at the root, and per view a tree file per grouping
(`<view-id>/trees/<axis>.json`), the view without content (`<view-id>/view.json`) and a
search file (`<view-id>/search.json`) (§2, §4 there). Offline and deterministic; two seconds.

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
`/tmp/graph.med/screenshots/` and reports what overlaps on a page with a graph (a
view, the index), and on every page whether it overflows horizontally (the `screenshot` skill
describes the actions it can take first). Deployment to
GitHub Pages is a workflow file, committed by a person
(`.github/workflows/pages.yml`): validate, build, deploy on every push to `main`,
and one preview per open pull request at `graph.med/preview/pr<N>/`, rebuilt from
the pull request's head after each run of its checks (`docs/publication.md` §6).
Every pull request links its preview — whether or not it changes a page — as a
complete clickable URL (`https://graph.med/preview/pr<N>/<view-id>/`), never a
bare path.

The MCP endpoint is the Worker in `mcp/` on Cloudflare Workers, at
`https://mcp.graph.med/mcp`, a custom domain of graph.med's zone attached in the
dashboard (not by the deploy), open to every MCP
client behind one rate-limiting rule (ADR-0008). `npm --prefix mcp run dev`
runs it locally (`wrangler dev`; `-- --var LAYER0_BASE:<url>` points it at a preview
or a local build). It is deployed with `npm --prefix mcp run deploy` (`wrangler
deploy`), only by `.github/workflows/mcp.yml`, after each successful Pages deploy from
`main` and by hand, which first runs its check against the live site, with the repository secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` — never from the sandbox, which
holds neither.

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
at `graph.med`, views as pages, a graph-and-sheet page read on a phone first, and
(its §8) how the pool reaches programs and assistants — a machine-readable site, a
read-only MCP server, a view inside a conversation; and
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
