# graph.med

A collaborative public medical knowledge graph: clinical guidelines taken apart into
source-anchored claims, linked into statements and concepts, and drawn as decision
trees. The site is **[graph.med](https://graph.med/)**; the first view, the POMGAT
guideline, is at [graph.med/pomgat-lv-1.0](https://graph.med/pomgat-lv-1.0/).

New here? "A walk through graph.med" below follows one recommendation from the page
to the graph and ends with every word the project uses. The model is specified in
[`docs/graph-representation.md`](docs/graph-representation.md), the site in
[`docs/publication.md`](docs/publication.md); the walk only explains.

> **Status.** One source is in the pool (POMGAT, 90 recommendations), validated and
> published. What exists is the design (`docs/`), the one schema
> (`schema/schema.yaml`), the validator that enforces it and the CI that runs it (see
> "Checks"), the pool under `data/` as it lands through pull requests, and the build
> that renders the pool into the site (see "Build"). This README describes how the
> project is worked on.

## Authors

Robert Schwarzenberg and Anton Zolkin and their agents. 

## A walk through graph.med

### The question the project answers

A clinical guideline is a long PDF. A physician wants one thing from it: *for this
patient, in this situation, what does the guideline say, and where does it say
that?* graph.med takes guidelines apart into pieces small enough to answer that
question, keeps every piece tied to the exact passage it came from, and draws the
pieces as a decision tree you can read on a phone.

Two rules shape everything else:

- **Nothing is invented.** Every piece of knowledge points at a passage in a
  public document, with a quote a machine can check. Where the project adds
  something of its own — a grouping, a wording — it says so.
- **The document is not the knowledge.** A guideline's chapters are how one
  publisher arranged one document. The knowledge is what the recommendations say,
  for whom, under which condition. The pool models the second and remembers the
  first only as provenance.

### One recommendation, from the page to the graph

Take recommendation 6.7 of POMGAT, on page 63, in section 6.1.3 "Pankreas":

> Nach Pankreasresektion kann die abdominelle Drainage im frühen postoperativen
> Verlauf (bis 4. postoperativer Tag) gezogen werden, wenn das Drainagesekret
> initial auf ein geringes Risiko einer Pankreasfistel hinweist.

Here is how it lives in the pool, layer by layer.

#### The source

The guideline itself is an entity, `sources/pomgat-lv-1.0`: a title, the public
URL at the AWMF register, a content hash of the PDF, the licence line, and the
document's complete table of contents. **The PDF is never copied into the
repository.** Everything links to the register's own copy; the hash detects if
that copy ever changes.

#### The claim — what the source says, where

```yaml
- id: claims/pomgat-lv-1.0/6b9239a9        # derived from the anchor below, never chosen
  type: claim
  lang: de
  kind: recommendation
  recommendation_no: '6.7'
  section: "6.1.3"                         # where in the document; must exist in the outline
  label: Nach Pankreasresektion kann die abdominelle Drainage im frühen postoperativen
    Verlauf (bis 4. postoperativer Tag) gezogen werden, wenn das Drainagesekret initial
    auf ein geringes Risiko einer Pankreasfistel hinweist.
  grade: '0'
  verb: kann
  direction: for
  consensus: starker_konsens
  source:
    at: sources/pomgat-lv-1.0#page=63
    quote: kann die abdominelle Drainage im frühen postoperativen
```

A **claim** is one place in one document and what is printed there: the sentence,
its grade, its verb, its direction, the consensus. The `source` is the anchor — a
physical page and a short verbatim quote. The validator can download the PDF and
check that the quote is on that page. The claim's id is a hash of the anchor, so two
people extracting the same sentence produce the same claim, and nobody can quietly
edit what the guideline said.

Claims are **mechanical**. Extracting them is reading, not judgment. That is why a
claim carries the grade and the statement below does not: grades come from
documents, never from us.

#### The statement — the proposition the claim is evidence for

```yaml
id: statements/fruehe-drainageentfernung-pankreasresektion
type: statement
lang: de
label: Nach Pankreasresektion kann die abdominelle Drainage früh (bis 4. postoperativer
  Tag) entfernt werden, wenn das Drainagesekret ein geringes Pankreasfistelrisiko anzeigt.
short_label: "Frühe Drainageentfernung bei geringem Fistelrisiko"
slots:
  population: concepts/pankreasresektion
  action: concepts/fruehe-drainageentfernung
  condition: [concepts/geringes-pankreasfistelrisiko]
source: modelling
```

A **statement** is the proposition itself, written once, in the pool's own words.
Its `source: modelling` says exactly that: no document states this sentence; a
person or agent wrote it. What ties it to the guideline is an edge:

```yaml
- [claims/pomgat-lv-1.0/6b9239a9, supports, statements/fruehe-drainageentfernung-pankreasresektion, {source: modelling}]
```

Why two layers? Because a second guideline will speak about the same thing. Its
claim will `supports` — or `contests` — **the same statement**. The statement's
evidence grows; the statement itself is untouched; and where two guidelines
disagree, the disagreement is visible on one node instead of being resolved by
whoever edited last. A statement is deliberately the *smallest unit that can be
supported or contested on its own*, which is why one guideline box with three
sentences becomes three claims and, usually, three statements.

The **slots** are what make a statement navigable: *whom* it is for (population),
*what* it recommends (action), *when* (condition), *to what end* (outcome). The
condition is a list: its entries hold at once, and a guideline's "or" is one
concept that names the alternatives. The site's decision tree is nothing but these slots drawn as questions and answers.

The `short_label` is the same proposition compressed for a box on the drawing — at
most 60 characters, and it must still tell the statement apart from its siblings.
Shortening a clinical sentence can change its meaning, so short labels are reviewed
like everything else.

#### The concepts — the vocabulary

```yaml
id: concepts/geringes-pankreasfistelrisiko
type: concept
lang: de
label: Geringes Risiko einer postoperativen Pankreasfistel (nach initialem Drainagesekret)
short_label: "Geringes Pankreasfistelrisiko"
facet: finding
source: modelling
```

A **concept** is a thing the statements talk about: a procedure, a drug, a
finding, an outcome. It is thin — a label, maybe a definition, a `facet` saying
what kind of thing it is — and it *means*; it never claims. A concept cannot be
contested. Concepts are minted only after searching for an existing one, and
where a classification has a code for it, the code becomes a node of its own,
linked by a `codes_as` edge, so that two guidelines meet on the same code.

Concepts also carry a hierarchy:

```yaml
- [concepts/kolorektale-resektion, broader, concepts/kolorektale-chirurgie, {source: modelling, as_of: "2026-09-10", lang: de,
   rationale: "Die kolorektale Resektion ist der Eingriff der kolorektalen Chirurgie."}]
```

`broader` means "is a special case of", and only what is true whatever guideline
you read. It carries **no evidence and no inheritance**: a recommendation for
colorectal resection says nothing about a narrower resection unless the
guideline says so. Where the guideline is silent, the gap stays visible. That
rule is what keeps the graph from improvising.

What a guideline stipulates for its own scope is a second kind of edge:

```yaml
- [concepts/leberresektion, in_scope_of, concepts/gastrointestinale-tumoroperation, {source: modelling, as_of: "2026-09-24", lang: de,
   rationale: "Im Geltungsbereich der Leitlinie (2.1.2: …) ist die Leberresektion eine Operation eines gastrointestinalen Tumors; …"}]
```

A liver resection is not in general the operation of a gastrointestinal tumour —
it has benign indications — but inside POMGAT it is, so what POMGAT recommends
for gastrointestinal tumour surgery as such is addressed to it too. `in_scope_of`
may carry a `condition` (a medication group counts only *during* an operation in
the guideline's scope). The view names the concept its scope ends in — POMGAT's
patient target group, quoted from page 17 — and every patient group reaches it
along `broader` and `in_scope_of`: the **scope tree**, which folds the 34 patient groups
the recommendations are made for (every concept in a statement's population
slot) under five answers to the first question. Open liver resection and
the site shows its own recommendation and, set apart and marked, the ones that
apply generally; it never merges them.

#### The body text — what qualifies a recommendation

Recommendation boxes are terse; the paragraphs around them say when a
recommendation applies. Those paragraphs become claims too, related to the box by
an edge that says *how*:

```yaml
- [claims/pomgat-lv-1.0/8349aa77, refines, claims/pomgat-lv-1.0/6b9239a9, {source: modelling}]
```

The refining claim here is the criterion "Amylase-Konzentration im Drainagesekret
unter 5000 U/L am ersten postop. Tag" from page 64. It refines the recommendation;
it never inherits its grade. The other two relations are `supplements` and
`limits`. On the site they appear under "Hinweise aus dem Begleittext".

#### The direction — derived, never stored

The site shows every recommendation as one of four words: **für**, **gegen**,
**abwägen**, **Lücke**. Nobody writes that word into the data. It is computed from
the claims, each read in the grading scheme its source declares (the source quotes
its own method table): a recommendation for or against gives für or gegen —
`soll`, `sollte`, or another guideline's "Wir empfehlen" and "Wir schlagen vor"
alike —; the wording of a grade the scheme calls open, `kann` in this guideline,
gives abwägen, with the lean shown beside it; a box that says "no recommendation
possible" gives Lücke. Our example is abwägen, eher für. The rule is the same for
every statement and every guideline, so it can be changed in one place and never
drifts.

### Where the chapters went

Section 6.1.3 appears exactly once in the example: on the claim, as `section`.
Statements and concepts never carry a chapter, because a statement can be
supported from two chapters and a concept used in five. The source entity carries
the whole table of contents, so the validator can check that every claim names a
real section, and so the site can count which sections nobody has extracted yet.

On the site, a chapter is a **filter**: the `§` panel narrows the tree to what one
section supports. It is never a node in the graph. What a chapter *means*
clinically — an organ, a phase — is a grouping **axis**, and an axis is never built
in: a physician proposes one for a guideline, a tool tests whether the pool can
carry it and reports, a linking pass asserts what holds, and only then does a view
offer it as a way to fold the tree (`docs/graph-representation.md` §4.1). An axis
lies over the pool rather than inside it: its own file says which statement has
which value, or under which family each patient group hangs, choosing among the
`broader` and scope edges the pool already holds. The next guideline, organised by
stage or by symptom, proposes its own axes through the same steps. The patient
groups themselves fold by the scope tree the view declares (above), which is drawn
by the view's first axis.

### Views: the pool is one, the graphs are many

There is one pool and no separate graphs. A **view** is a named filter over the
pool — "everything drawn from POMGAT" — and every view is a page:
[graph.med/pomgat-lv-1.0](https://graph.med/pomgat-lv-1.0/). The unadorned page is
*floating*: it shows the pool as of the last build. A **cut** freezes a view at a
commit so that it can be cited, and will be added when someone needs to cite one.

Every entity has a page and a JSON document at its own identifier, so
`graph.med/statements/fruehe-drainageentfernung-pankreasresektion` is a working
link from anywhere, and `…/claims/pomgat-lv-1.0/6b9239a9` leads to the page and
the quote.

### How to read the page

Left to right: the guideline, **Welche Population?**, the families of patient
groups by weight, each unfolding into its members, then **Welche Bedingung?** where
a statement has a condition, then the recommendation as a box — coloured by its direction, stamped with the
direction's glyph, the grade as the guideline prints it and, where the grade does
not carry it, the verb, then the short label — and its aim as a tag.
Tap a box: its details open beside the graph on a wide screen, and on a phone in
a strip at the bottom that raises them over the graph. They answer in a fixed
order: what to do and how binding it is (a band in the direction's colour, with
the grade and the consensus), the exact wording, the evidence, whom it applies
to, what the body text adds, any contradicting recommendation, and where it
stands in the guideline — with the quote and a link into the PDF at the cited
page, opening in a tab of its own. The **copy** button beside a quote is for
viewers that cannot highlight the search from the link. The legend at the
bottom left names the forms, colours, letters and borders the view uses, and
only those.

The dropdown after the search box changes what the first question asks. **Population**
is the tree above; **Kapitel** asks for the chapter of the guideline first, then the
population within it; a further entry appears for every grouping axis a person has
proposed for the view, a tool has tested and a linking pass has asserted — for
POMGAT the **perioperative Phase** (`docs/graph-representation.md` §4.1). A link can
carry the choice (`?by=section`, `?by=axes/phase`).

### How the pool grows

Work is registered as **cards** on the organisation's GitHub project
`planning-graph.med` (Todo, In Progress, Done; `docs/adr/0004-planning-board-on-github-projects.md`):
a card is an issue of this repository on the board, its text the package. A
session claims the cards it is given by moving them to In Progress, does them,
and ends with a pull request a person reviews (`Closes #<card>`) and a
handover comment on each card; merging moves the card to Done. `AGENTS.md`
is the short form; the board's own README carries the columns, the card
template and the initiatives. A card extracts pages of a source (claims
first, mechanical; then linking, judgment), or changes the schema, or adds a site
feature, or changes the documentation or the tooling. The rules an agent follows are short and worth reading
once: read before writing; extract first, link second; search before minting;
contest, never overwrite; every statement needs provenance; underestimate, never
upgrade; prefer an explicit gap to an invented answer.

What is not decided yet lives in `docs/open-questions.md`, with the options and the
current leaning, so that nobody re-derives it. What was decided, and why, lives in
`.claude/memory/design/`.

### Words

| word | means |
|---|---|
| **source** | a public document: title, URL, content hash, licence, outline; never copied |
| **claim** | one passage of one source and what it states: verbatim quote, page, grade, verb |
| **statement** | a proposition in the pool's words, with slots; what claims support or contest |
| **concept** | a thing statements talk about; has a facet; can be a special case of another (`broader`) |
| **axis** | what a view's first question groups by — proposed by a person for a guideline, tested by a tool, asserted by a linking pass, then offered by the view; an overlay on the pool: its placements give each statement a value (a dimension) or pick for each concept the `broader` or `in_scope_of` edge it hangs by (a hierarchy — the tree of patient groups a view opens with is one) |
| **slot** | a statement's population, action, condition or outcome, filled with a concept (the condition with a list of them, all holding at once) |
| **edge** | a typed link: `supports`/`contests` (claim → statement), `refines`/`supplements`/`limits` (claim → claim), `broader`, `in_scope_of` (concept → concept, the second only within one guideline's scope), `codes_as` (concept), `specializes`/`complements`/`conflicts` (statement → statement) |
| **section** | where in its document a claim was found; on the claim only |
| **view** | a named filter over the pool; a page on the site. A **cut** is a frozen view |
| **modelling** | provenance meaning "no document says this; we asserted it" |
| **direction** | für / gegen / abwägen / Lücke, derived from the claims |
| **card**, **initiative** | one session's registered unit of work — an issue on the board, its text the package; the scope a set of cards serves (the board's `Initiative` field) |

## Development environment (sbx)

Work on this repository happens inside a **Docker Sandbox (`sbx`)** — a microVM
with its own kernel and its own network namespace, started and managed from the
host by the `sbx` CLI. Both human and agent contributions are made from one.

What that means in practice for a contributor:

- **Only this repository is mounted.** Nothing else of the host filesystem is
  visible from inside the sandbox, and paths outside the workspace do not
  resolve. Anything the project needs must live in the repository.
- **Outbound network is deny-by-default.** HTTPS reaches allowlisted domains
  only; raw TCP, UDP and ICMP are blocked. A blocked request returns HTTP 403
  with the reason in the body. Allow a domain from the host:

  ```bash
  sbx policy allow network <domain>
  sbx policy log                      # what was blocked, and by which rule
  ```

- **Installed packages are ephemeral.** They live as long as the sandbox does.
  A tool needed to build or test this project belongs in a manifest in the
  repository, not in someone's shell history.
- **A Docker daemon runs inside the sandbox**, and image pulls from Docker Hub
  pass the proxy. Images are as ephemeral as packages. The site's screenshots
  (`tools/screenshot.py`, see "Build") render in a Chromium container this way,
  because no browser can be installed in the sandbox.
- **Services are not reachable from the host** until the port is published, and
  they must bind to `0.0.0.0` or `::` rather than `127.0.0.1`:

  ```bash
  sbx ports <sandbox-name> --publish 8080:8080/tcp
  ```

- **Parallel sessions run in one sandbox**, each in a git worktree under
  `.claude/worktrees/` on its own branch (`claude --worktree <name>` inside the
  sandbox). Do not start a second sandbox on the same directory: it mounts the
  same checkout. The convention for what parallel sessions owe each other is
  `docs/adr/0002-parallel-sessions-in-git-worktrees.md` and the
  `process-work-package` skill.

Agent-specific rules — bot identity, credentials, what an agent may and may not
do — are in [`.claude/`](.claude/README.md); [`CLAUDE.md`](CLAUDE.md) describes the
project itself.

## Checks

One check exists: the validator, `tools/validate.py`. `schema/schema.yaml` is a JSON
Schema (draft 2020-12, written in YAML) and the single point of truth; the validator
applies it to every file under `data/` with the standard `jsonschema` library, then
checks the few cross-file rules a document schema cannot state — references resolve,
claim ids are the hash of their anchor, edges are unique, the grouping axes and a
view's scope tree hold together, a derived concept's rules point at the passages that
give them — and optionally every quote
against the cited page of its source. The commands, and
what each form checks, are in [`CLAUDE.md`](CLAUDE.md) under "Checks" — one home for
them, read by humans and agents alike. Python tooling is managed with
[`uv`](https://docs.astral.sh/uv/) (`pyproject.toml`, `uv.lock`); never pip.

CI runs the same validator (`.github/workflows/validate.yml`) on every pull request —
including every push to an open pull request — and on every push to `main`, as two
jobs: the offline structural check, then the quote verification, which downloads each
source, verifies its content hash and checks every quote.

Two facts about the workflow that contributors should know:

- **Workflow files are edited by humans only.** The bot's GitHub App has no
  `workflows` permission, so GitHub refuses any push from it that touches
  `.github/workflows/`. This is deliberate: an agent cannot change what CI runs.
  When an agent needs a workflow change, it puts the file's content in the pull
  request and a person commits it.
- **The workflow's token is read-only** — a repository setting, restated as
  `permissions: contents: read` in the file — so a run can check the repository but
  never write to it, approve anything, or trigger further runs.

Running the quote check inside the sandbox needs each source's domain on the egress
allowlist (`sbx policy allow network register.awmf.org` for the first source). The
download is cached under `~/.cache/graph.med/sources/` by content hash and is
ephemeral, like everything outside the repository.

## Build

`tools/build.py` renders `data/` into a static site — one decision-tree page per view,
with a chapter tree that filters it and a search that highlights, one page and one
JSON document per entity, read on a phone first — as designed in
`docs/publication.md`. The tree is drawn by Cytoscape.js with the dagre layout,
vendored under `tools/site/static/vendor/` (MIT, pinned; see its `LICENSES.md`). The command is in [`CLAUDE.md`](CLAUDE.md) under "Build"; run
it locally and open `site/index.html`. Deployment to GitHub Pages is a workflow, and
like every workflow file it is committed by a person (see "Checks"). The same
workflow serves every open pull request at `graph.med/preview/pr<N>/`, built from
the pull request's head once its checks have run, so that a change to a page is
reviewed as the page it produces; a preview says which pull request it is and asks
not to be indexed.

## Source documents

Source documents — papers, guidelines, classification releases — are **not
committed to this repository**, and not rehosted anywhere else. Third-party
material carries its own licensing and does not belong in the history of a
PolyForm-licensed repository; the repository and its links to public sources
are the only assets. An agent that needs a source downloads it from its public
URL into the session's working copy (the source's domain needs an egress
allowlist entry — see "Development environment" above), extracts what it needs into
the graph, and references the public location; the downloaded copy is
ephemeral and never committed. The reasoning is recorded in
`.claude/memory/design/sources-referenced-never-rehosted.md`.

## License

The repository is public and collaborative, and it is **not open source** in the
OSI sense: it is licensed under the PolyForm Noncommercial License 1.0.0 — see
[`LICENSE`](LICENSE) — which permits use, copying and modification for
noncommercial purposes only. The source documents the pool refers to are not part
of the repository and carry their own licences (see "Source documents").
Copyright 2026 Robert Schwarzenberg, Anton Zolkin.
