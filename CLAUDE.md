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
work packages, handoff and log under `docs/` with the script that checks them
(`scripts/check-work.py`, see "Work"), `AGENTS.md`, and the `.claude/` directory
described below. There is no source tree beyond these scripts.
Project-specific guidance — data sources and their licenses, setup and test
instructions — belongs in this file once it exists. Do not document tooling that does
not exist.

## Checks

Python tooling is managed with `uv` (`pyproject.toml`, `uv.lock`); never pip. The one
check is the validator, which also runs the work-package check (`scripts/check-work.py`,
see "Work"). `schema/schema.yaml` is a JSON Schema (draft 2020-12); the
validator applies it to every file under `data/` with the `jsonschema` library, then
checks what a document schema cannot say — references resolve, claim ids hash
correctly, edges are unique:

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
disjointness, the unplaced remainder by name, depth — reading the places from the
definition's `placements` while the axis is proposed and from the data once it is
asserted. It writes nothing; the report goes verbatim into the pull request that
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
live in `tools/site/`. Inside the sandbox, where there is no browser,
`uv run tools/screenshot.py <view-id>` renders a view page in a Chromium container
on the sandbox's Docker daemon, writes a PNG under `/tmp/graph.med/screenshots/`
and reports what overlaps (the `screenshot` skill describes the actions it can
take first). Deployment to
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
carries what is not yet decided; `docs/work/` what is agreed and not yet done;
`docs/HANDOFF.md` where the last session left things; `docs/LOG.md` what each
session did; `docs/adr/` what was decided about the repository itself.

## Work

`AGENTS.md` at the root says how a session picks up work: read `docs/HANDOFF.md`,
process exactly the packages the command names — in sequence or in parallel,
one worker per package in its own git worktree, branch and pull request, the
session coordinating and stacking — and end when each has a log entry, a
rewritten handoff and a pull request. The convention is `docs/work/README.md`
("Processing packages"; ADR-0002); the `process-work-package` skill is the
procedure; the `handover` skill maintains `docs/open-questions.md`; decisions
about the repository are `docs/adr/`.
`uv run scripts/check-work.py` checks all of it (ids, statuses, dependencies,
`done/`, stale claims, the handoff against the log); the validator runs it too.

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
├── agents/                      subagent definitions — empty; add one .md per agent
└── skills/
    ├── handover/                end a session: open questions, log entry, handoff
    ├── process-work-package/    process the listed work packages: coordinate, one worker each
    └── screenshot/              look at a view page in a real browser before proposing it
```

Rules without a `paths:` scope load at the start of every session; the two that have
one load when you touch a file they cover.

`memory/` is what an agent has learned about this project that the code does not
record — why a constraint exists, what was decided and rejected. It is checked in, so
it is reviewed and shared rather than private to one machine.
`rules/conventions/memory.md` carries its index.

`agents/` is deliberately empty, and `skills/` holds exactly three skills. A subagent
or skill that automates nothing would be guidance pretending to be capability — the
validator is a check, not a task to automate — and each exception earned its place
as a real, repeated task. `handover` ends a session by maintaining
`docs/open-questions.md`. `process-work-package` does the packages named with
it — an extraction, a linking pass, a schema change, a build feature, a docs
change, tooling — one worker, branch and pull request each, the session
coordinating; each ends with a log entry and a rewritten handoff.
`screenshot` renders a view page in a browser container so a build change is looked
at, not only built. Add another only for another such task — then say in the pull request what it
does and what it is allowed to touch.

One fact, one home: guidance that belongs in a rule is not restated here.
