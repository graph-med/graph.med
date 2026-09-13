# Publication — how the pool is served at graph.med

> **Status: design, built in part.** The build (`tools/build.py`, `CLAUDE.md`
> "Build") renders §2–§5 for `selection` views over sources: the URL layout, the
> graph-and-sheet page with patient groups folded by family, the chapter tree and
> the search with facet filters, short labels, direction glyphs, legend and banner,
> the order of the detail section (§3), entity pages and JSON (§4), source links
> (§5), and the deploy workflow with one preview per open pull request (§6).
> Registered and not built: the axis switch (§3, "The axis is the reader's
> choice"; `docs/work/initiatives/groupings.md`). Not built and not registered:
> cuts (§7), pathway views, and everything under §8. The
> domain `graph.med` points at GitHub Pages. This document fixes what the site is *meant*
> to be so that the build is written to it, not the other way round. It is the
> design-level counterpart of `graph-representation.md`: that file says how
> knowledge is stored; this one says how it is shown.

---

## 1. One sentence

The pool is published as a **static site**: every **view** is a page at
`graph.med/<view-id>`, every **entity** is a page and a JSON document at its own
identifier, both generated from `data/` by a build script on every change to `main`
and served by GitHub Pages behind the `graph.med` domain; the primary page is a
**graph** that is read on a **phone first**, where tapping a node opens its details
in a **section below the graph**.

---

## 2. URLs are the identifiers

`graph-representation.md` §2 says identity is the URL and the schema's `$id` already
begins with `https://graph.med/`. Publication makes that literal: every identifier in
the pool resolves.

```
graph.med/                          index: the views, the sources they draw on
graph.med/<view-id>                 a view, floating — the filter as of the last build
graph.med/<view-id>@<n>             a cut of that view (deferred, §7)
graph.med/<namespace>/<entity-id>   any entity: statements/…, concepts/…, claims/<source>/<hash>, sources/…
graph.med/<namespace>/<entity-id>.json   the same entity as data
graph.med/schema/schema.yaml        the schema, at its $id
```

Views live at the root because they are the citable things and the pages people
share. Entities live under their namespace exactly as in the pool. The one rule
this adds to the data model: **a view id must not equal a namespace name**
(`sources`, `claims`, `concepts`, `statements`, `pathways`, `views`, `agents`,
`attestations`, `schema`, or a terminology namespace). The validator enforces it.

**Base path.** The site can also be served without the domain, at
`graph-med.github.io/graph.med/`. The build takes the base path as a parameter and
generates every internal link from it, so moving between the two is configuration,
never a content change.

A **graph id**, as the maintainer calls it, is therefore a view id. The first views
are one per source document, e.g. `graph.med/pomgat-lv-1.0` for the POMGAT guideline:
a `selection` view whose filter is that one source. A view is a data entity
(`data/views/<view-id>.yaml`, schema `view`); adding a graph to the site is a reviewed
data change, never a change to the build.

---

## 3. A view page: a graph and a sheet

The view page is designed for a phone first and kept minimal: one graph, one
detail section, nothing else competing for the screen. Desktop gets the same page
with more room.

**The graph is one decision tree.** The page is for physicians and academics, who
read a guideline as decisions: which patients, under which condition, which
recommendation, to what end. So the whole view is drawn top-down as a decision
tree, derived from the statements' slots — the pool has no authored pathways yet,
and this derivation is the stand-in until it does (`open-questions.md` →
decision-graph-derivation):

```
   ┌─────────────────────┐
   │ the guideline       │                       root
   └─────────┬───────────┘
        ◇ Welche Population?                     question (ours, source language)
       ╱ Gastrektomie ╲ Kolorektale Resektion …  answers on the edges (population slot)
      ●                ●                          junction per group
      │                ├──── ◇ Welche Bedingung? question (ours)
      │                │       ╲ Amylase < …     answer on the edge (condition slot)
   ┌──┴────────┐   ┌───┴───────┐ ┌───┴───────┐
   │ recommend.│   │ recommend.│ │ recommend.│    the statements — boxes coloured by
   └─────┬─────┘   └───────────┘ └───────────┘    direction (für · gegen · abwägen · Lücke),
         ┆ (dashed)                               the grade a letter (A · B · 0 · EK);
         ┆                                        dashed red border when contested
         ▷ aim                                    outcome slot
```

- **The questions are ours; every answer is data.** "Welche Population?" and
  "Welche Bedingung?" are the only text the build adds, in the view's source
  language (a language the build has no words for fails the build; nothing falls
  back to English). Each answer on an edge is a
  population or condition concept; each box is a statement with its claims' grade;
  each aim an outcome concept. Nothing else is invented — in particular no yes/no
  branches and no ordering between conditions, which is what authored pathways will
  add (`graph-representation.md` §5, `branch` edges with a `guard`).
- **Patient groups converge.** Statements sharing a population hang from one
  junction, so the tree shows at a glance what the guideline says for, say,
  colorectal resection. A condition is asked within its group.
- **Forms tell the types apart, colour tells the direction, a letter the grade.**
  Diamond, box, tag for question, recommendation, aim; the answers are bold edge
  labels written at the end of their edge, beside the group or box they lead to, so
  that many answers from one question do not pile up mid-edge; the aim a dashed
  edge. A box takes the colour of its direction — the four colours of the banner
  in the details, so that box and section agree — and carries its grade as a
  letter after the direction glyph (A · B · 0 · EK, the guideline's own scale). An
  EK box is coloured by its direction like every other recommendation and marked
  "EK", not demoted. Legend under the graph: the colours are directions, the
  letters grades.
  Claims are not nodes; they are the evidence and appear in the section.

**Drawn by a library, left to right, folded.** The page uses Cytoscape.js with the
dagre layout, self-hosted under `assets/vendor/` (MIT, pinned, no third-party
request): boxes have a fixed width and grow to their wrapped text, the layered
layout has no overlaps, edge labels are placed, and touch pan and pinch come with
it. Three choices keep the tree readable at ninety recommendations:

- **Left to right.** A rank is a column, so the widest rank becomes a tall column
  that pans vertically — natural on a phone and on a desktop — and the whole tree is
  seven columns wide.
- **Folded by default.** The page opens with the root, the first question and its
  answers, one junction per patient group carrying the number of recommendations
  behind it. Tapping an answer or its junction unfolds that group's conditions and
  recommendations; tapping again folds it. Only what the reader opened takes space.
  A deep link unfolds the group its target is in. Every question folds too:
  tapping "Welche Population?" folds the whole tree back to the root and the
  question, tapping "Welche Bedingung?" folds its group's conditions and
  recommendations, and tapping the question again restores what was open below it.
- **Every branching is a question.** Wherever the tree forks, the reader passes a
  diamond: an opened family asks "Welche Population?" again before its member
  groups, so that a fork is never a bare fan of answers without the decision they
  answer. The family's own recommendations hang from its junction as before,
  through "Welche Bedingung?" where they have a condition. The question folds with
  the family and adds no text the build does not already have.
- **Answers in order of weight, families first.** The patient groups are the
  population concepts and the families above them (`broader` edges,
  `graph-representation.md` §5): the first question's answers are the ten roots
  (*Leberresektion*, *Kolorektale Chirurgie*, …), each with the number of
  recommendations anywhere below it, heaviest first. Opening a family shows its own
  recommendations and its member groups, each folded until opened in turn; closing
  it folds everything below. A recommendation hangs from the group it was made
  for, never from a family — the edge only groups and folds, it never moves a
  recommendation from a family to a member, and a group with two parents appears
  under both.
- **The axis is the reader's choice.** What the tree groups by is an **axis**
  (`graph-representation.md` §4.1). The families above the patient groups are
  the plain hierarchy every view has; other axes exist once a person has
  proposed them for the view and a linking pass has asserted them. The page
  offers a switch whose first entry is the plain hierarchy, whose second is the
  **chapters** of the view's sources — built in for every view, derived from the
  claims' `section` and the sources' `outline` (`graph-representation.md` §6.7),
  no axis entity behind it — and whose others are the axes the view declares in
  `group_by`, in that order, and no other. Under the chapters the first
  question is "Welches Kapitel?", its answers the top-level sections in outline
  order, each with the number of recommendations supported from it or beneath
  it, a recommendation supported from two chapters under both; below each
  chapter the population question with the families that chapter touches. A
  *dimension* axis (a slot on the statement — a phase, a setting) adds its own
  question the same way, its answers the axis's values in the order declared;
  a *hierarchy* axis changes which concepts are the families of the question
  it folds and how it unfolds. None of them changes the shape of the tree, its
  folding, or where a recommendation hangs — the chapters are answers of a
  question the reader chose, never nodes in the pool and never the default
  shape. Whatever the chosen grouping cannot place is one answer, "not placed",
  last among that question's answers at every depth where it is asked, so
  nothing disappears. The switch's words, the chapter question, the axis labels
  and "not placed" come from the per-language table like the questions; the
  build knows no axis by name. **How it looks.** The switch is a select in the
  row of controls over the graph, after the search box: it shows the name of
  the chosen grouping — "Population" for the plain hierarchy, "Kapitel" for the
  chapters, then each axis's `label`, in the view's language — and opens the
  list on a tap. On a phone the row wraps and the switch takes the second line
  beside the facet filter, wide enough for an axis's label. A chapter's answer
  is its number and title, cut to the box rule's sixty characters with an
  ellipsis only when longer; a dimension axis's question is its short label in
  the per-language question form ("Welche Phase?"). The choice is part of the
  URL, `?by=<grouping>` before the `#<entity id>` deep link — `section` for the
  chapters, else the axis id; absent for the plain hierarchy, and an unknown
  value falls back to it — so a link to a grouped view is shareable and a deep
  link unfolds to its target under the chosen grouping.
  Switching keeps the chapter, the search, the facet and the selected entity;
  the reset button keeps the axis, because it undoes narrowing and the axis
  narrows nothing.

**Boxes show the short form.** A box shows a statement's `short_label` when it
has one and its `label` otherwise; the section always shows the full label. The
same holds for the answers on the edges (concepts). Short labels are data, reviewed
like everything else, never truncated by the build.

The data carries no positions; the layout is deterministic for a given set of open
groups. This replaces the earlier hand-written renderer, whose fixed boxes could not
fit the labels.

**Everything readable.** Nothing overlaps: every node and every answer is fully
visible in every state the reader can reach, including a large family open with
all its members. Answers written at the end of their edges are part of the layout,
not decoration laid over it; where many answers converge, the layout makes room,
and if placing the text on the edge cannot hold, the answer becomes a node of its
own rather than run into a box. The physician's test is a family with ten members
open: each answer legible, each box clear of its neighbours.

**The interaction.** Pan by one finger, pinch or wheel to zoom, a fit button for
what is open, and a **reset** button beside it that returns the page to its
opening state — folded, no search, no facet, no chapter, nothing selected — so the
way back from any search or filter is one tap. Tapping a node or an answer selects it: what leads to it and what
follows it stay, everything else fades, and its details open in the **section
below the graph** — on a wide screen, in a **column beside it**, the graph taking
the full height; the graph stays where it is either way, so the reader keeps their
place. Tapping the background clears. Tapping a neighbour listed in the section
moves there. Deep links carry `#<entity id>`, and `?by=<grouping>` when the tree is
grouped by the chapters or an axis. There are no modal dialogs and no page
loads needed to read a view; the entity pages (§4) exist for linking, not for reading.

**Chapters and search.** Two ways to narrow the tree, deliberately different in
kind:

- **A chapter tree beside the graph**, built from the source's `outline` and the
  claims' `section` (`graph-representation.md` §6.7). Tapping a section is a
  *hard filter*: the tree shows only the statements supported from that section
  and its subsections, plus their groups, conditions and aims; nothing is redrawn
  and no edge is computed, the rest is simply not shown. Sections without a claim
  are listed greyed, so the reader sees what the pool has not extracted. The
  chapter tree is a control, not the graph: the graph stays the one decision tree,
  and the tree of headings never becomes its shape. Its "all" row stays fixed at
  the top of the panel while the sections scroll, so that after any narrowing the
  whole tree is one tap away (whether the search also finds sections in this tree
  is open: `open-questions.md` → chapter-search).
- **A search box** is a *soft highlight*: it matches the label, short label,
  slot concepts and claim text of statements, the labels of patient groups, and
  the answers on the edges — a condition is an edge, not a node, and must be found
  all the same — without regard to case or diacritics; matches keep their colour
  and everything else fades without disappearing, so "Leber" shows every branch
  the liver occurs in and, just as usefully, where it does not. A counter reads "n
  matches in m sections". Hiding would destroy the overview the search exists to
  give; fading keeps the structure. A node the chapter tree can reach and the
  search cannot is a bug.

Once concepts carry a `facet`, the search gets facet filters (only procedures,
only outcomes). Everything here runs in the browser on the view's JSON.

**Direction, in four words.** A recommendation's direction is one of *für*,
*gegen*, *abwägen*, *Lücke*, derived at build time from the supporting claims:
`soll`/`sollte` with `direction: for` → für, with `against` → gegen; `kann` → abwägen,
because in the AWMF scheme "kann" *is* the open recommendation, the guideline's own
third category (the banner adds the lean, "eher für" or "eher gegen"); `kind:
gap_notice` → Lücke; claims that disagree in direction → abwägen; a fact has no
direction. A glyph before the box label (✓ ✗ ⚖ ∅) and a banner at the top of the
details carry it; the legend lists the four words with their colours. Timing
("innerhalb von 24 Stunden") is not a direction; it stays in the label.

**What the section shows.**

- *statement*: the section is organised by the six questions a physician brings to
  a recommendation, in this order, each a heading in the chrome language:
  1. **What should I do?** — the direction as a banner, so the clinical answer is
     read in a second, then the full label in its source language.
  2. **Does this apply to my patient?** — the population with the family it
     belongs to, and the condition, each linked to its concept.
  3. **How binding and how well supported is it?** — every claim linked by
     `supports` or `contests`, each with **its own grade** highlighted, then verb,
     direction and consensus; an EK claim is marked as such and otherwise shown
     like any other. Grades are shown, never composed (below).
  4. **What could change the answer?** — what the body text adds, grouped by
     relation — *refines*, *supplements*, *limits* — each with its page and section.
  5. **Where exactly is it written?** — for each claim: document, recommendation
     number, page, section, the verbatim quote with its copy button, and the link
     into the cited page of the source (§5). Where a recommendation comes from is
     as much part of the answer as whom it is for.
  6. **Would the answer be different in a neighbouring situation?** — the
     statements under the same group and condition, the same action recommended
     for other groups, and the statements linked by `specializes`, `complements`
     or `conflicts`, each a link that moves the graph there.
  The order goes from the answer to its applicability, its evidence, its limits,
  its source, and its neighbours. The entity page (§4) renders the same section.
- *concept*: the label and definition, the statements that use it and in which slot,
  and its codes (`codes_as`) once terminology imports exist.
- *structural node*: its label, its branches or outcomes, and the statements it is
  about.

**Grades are shown, never composed.** A statement's effective grade is an open
question (`open-questions.md` → grade-derivation) leaning toward showing the
distribution. The page shows each claim's grade next to that claim and nothing on
the statement. When the question is settled, the page follows the schema.

**Language.** Content is rendered in its source language with the `lang` attribute
set; nothing is translated. Chrome (navigation words) is English. Translation is a
build-layer concern and can be added without a data change
(`graph-representation.md` §2).

---

## 4. Entity pages and JSON

Every entity gets a page whose content is the same as its sheet section, so that
`graph.med/statements/<id>` is a working link from anywhere, and a JSON document
next to it that carries the entity as stored plus its incoming and outgoing edges
resolved to ids. The JSON is what a program uses; the page is what a person lands
on. Both are generated; neither is authored.

---

## 5. Sources are linked, never served

The site never hosts a source document
(`.claude/memory/design/sources-referenced-never-rehosted.md`). A claim's locator
becomes a link to the source's public URL with the page fragment and the quote as
a search, `<url>#page=<N>&search=<quote>&phrase=true`. Every PDF viewer lands on
the cited physical page; those that understand the search highlight the passage —
Firefox's pdf.js and Acrobat do, Chrome, Edge and Safari do not. No link form
highlights in every browser and the document is never rehosted in a viewer of our
own, so the verbatim quote is shown beside the link with a **copy** button: in a
viewer that cannot highlight, the reader pastes it into the document's find. The source's license line, as
recorded on the source entity, is shown on its page and on every view drawn from it.

---

## 6. The build

**Design guidance for the site.** An agent changing the site's look — the
stylesheet, the templates, the drawing — works with the `frontend-design` plugin,
enabled for every session in this repository by `.claude/settings.json`. It informs
choices *within* what this document and the decision-tree memory fix (the one
tree, the node forms, the direction colours, folding by family, answers on the edges);
it never licenses a restyle of those. Before a build change is proposed, the page
is looked at in a browser (the `screenshot` skill), on a desktop and on a phone.

The build is a script in the repository, `tools/build.py`, run with `uv` like the
validator. It reads `data/` and `schema/schema.yaml`, writes a `site/` directory
(gitignored), and takes the base path and output directory as parameters. It runs
offline, needs nothing beyond the dependencies in `pyproject.toml`, and is
deterministic. A contributor runs it locally and opens `site/index.html` to see a
change before proposing it — the same habit as the validator.

Publication is a workflow (`.github/workflows/pages.yml`): on every push to `main`,
validate, build, deploy to GitHub Pages. The deploy step never runs on a pool that
fails validation. The deploy job carries an explicit condition
(`!cancelled() && needs.build.result == 'success'`): the preview job is skipped
whenever no pull request is open, and GitHub skips every job downstream of a
skipped one unless told otherwise, so without the condition a push to `main`
with no open pull request built the site and never deployed it — as it did
until 2026-09-12. Workflow files are human-only
(`.claude/rules/environment/git-identity.md`), so the build tooling arrives in a
pull request and the workflow that calls it is committed by a person from the pull
request's description. The build emits the `CNAME` file for the domain and a
`.nojekyll` marker so that paths are served untouched.

**Previews.** Every open pull request from a branch of the repository is served at
`graph.med/preview/pr<N>/`, built from its head with `--base /preview/pr<N>/
--preview <N>`, so that a reviewer reads the page a change produces, not its diff.
A preview page carries a strip above the header naming the pull request, and a
`robots` hint not to be indexed. GitHub Pages serves one deployment per repository
and every deployment replaces the last, so the site is composed on every deploy from
what is true at that moment: the root from `main`, `preview/pr<N>/` from each open
pull request. Nothing is accumulated and nothing needs cleaning up — a pull request
that closes is simply absent from the next composition, and a pull request whose
pool fails validation has no preview until it passes. The same workflow does this
work: it runs on a push to `main` and after each run of the validation workflow
on a pull request, always from `main`'s own workflow file, in `main`'s context, so
that a branch can change what its preview shows and never what the root shows. It
needs no write access to the repository: previews are built in one job per pull
request, handed over as artifacts, and placed under `preview/` by the composing job.

---

## 7. Floating first, cuts later

A floating view is rebuilt on every change to `main`; its page says which commit it
was built from. A **cut** (`graph-representation.md` §4) is a frozen, validated
member list recorded on the view entity, and `graph.med/<view-id>@<n>` serves that
cut from its `as_of` commit forever. Cuts are what get cited. They are deferred until
someone needs to cite one; how the build serves old cuts, and whether a cut also
gets a single-file export such as a PDF, are open (`open-questions.md` →
cut-publication).

---

## 8. Left open

- **Cut publication** — how cuts are built and served alongside the floating view;
  whether a cut has a PDF export.
- **Branch guards** — yes/no and value-range branches come with authored pathways
  (`branch` edges carry a `guard`); the derived tree has only slot answers.
- **The build's own words outside the graph** — the legend, the counter, the
  chapter panel's "all" and the page chrome are English; the questions and the
  direction words inside the graph are in the source language. The maintainer
  deferred the rest to a later phase.
- **Translation** — a build-layer projection, not started.
- **Other projections** — FHIR, RDF, diagram formats (`graph-representation.md` §13).
