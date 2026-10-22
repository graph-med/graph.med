# Publication — how the pool is served at graph.med

> **Status: design, built in part.** The build (`tools/build.py`, `CLAUDE.md`
> "Build") renders §2–§5 for `selection` views over sources: the URL layout, the
> graph-and-sheet page with patient groups folded by family, the chapter tree and
> the search with facet filters, short labels, direction glyphs, legend and judgement,
> the order of the detail section (§3) — with a statement's steps before and after
> along `follows` (zone 5) and its path view, the whole chain on a page of its own
> (§3, "The path view") —, entity pages and JSON — with `meta`, a statement's
> `sequence`, and a concept's `statements` and `appears_in` (§4) —, source links
> (§5), the grouping switch — the view's tree of patient groups · Kapitel · each
> other axis the view declares (§3, "The axis is the reader's choice") —, the scope tree and what applies
> generally, for a view that declares one (§3), and the deploy workflow with one
> preview per open pull request (§6), and the machine-readable site of §8 (Layer 0:
> `index.json`, `llms.txt`, a tree file per grouping, a per-view file and a search
> file per view, §2 and §4), and the read-only server's tools (§8, Layer 1: `mcp/`)
> with its hosted endpoint, deployed at `https://mcp.graph.med/mcp` since 2026-10-06.
> Designed, not built: the rest of the pool in programs and assistants — a view
> inside a conversation (§8, which carries each layer's status). Not built and not
> registered: cuts (§7), pathway views, and everything under §9. The
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
in a **section below the graph** — on a phone, a strip at the bottom edge that
raises the section over the graph.

---

## 2. URLs are the identifiers

`graph-representation.md` §2 says identity is the URL and the schema's `$id` already
begins with `https://graph.med/`. Publication makes that literal: every identifier in
the pool resolves.

```
graph.med/                          index: a graph with one answer per view — the only page where the views meet
graph.med/<view-id>                 a view, floating — the filter as of the last build
graph.med/<view-id>@<n>             a cut of that view (deferred, §7)
graph.med/<namespace>/<entity-id>   any entity: statements/…, concepts/…, claims/<source>/<hash>, sources/…
graph.med/<namespace>/<entity-id>.json   the same entity as data
graph.med/<view-id>.json            the view as data: what its page draws, card HTML included
graph.med/<view-id>/trees/<axis>.json    one grouping's tree file, without content (§4)
graph.med/<view-id>/view.json       the view without content: its groupings by their tree files (§4)
graph.med/<view-id>/search.json     the view's search file (§4)
graph.med/<view-id>/sequence/<statement>/   the path view: the chain a statement stands in (§3)
graph.med/index.json                every view, its groupings and its files, for programs (§4)
graph.med/llms.txt                  what the files for programs hold, in English (§4)
graph.med/schema/schema.yaml        the schema, at its $id
```

Views live at the root because they are the citable things and the pages people
share. Entities live under their namespace exactly as in the pool. The one rule
this adds to the data model: **a view id must not equal a namespace name**
(`sources`, `claims`, `concepts`, `statements`, `pathways`, `views`, `agents`,
`attestations`, `schema`, or a terminology namespace), nor `index`, which would
shadow `index.json`. The validator enforces it.

**Base path.** The site can also be served without the domain, at
`graph-med.github.io/graph.med/`. The build takes the base path as a parameter and
generates every internal link from it, so moving between the two is configuration,
never a content change.

A **graph id**, as the maintainer calls it, is therefore a view id. The first views
are one per source document, e.g. `graph.med/pomgat-lv-1.0` for the POMGAT guideline:
a `selection` view whose filter is that one source. A view is a data entity
(`data/views/<view-id>.yaml`, schema `view`); adding a graph to the site is a reviewed
data change, and a change to the build only where its source brings something the
build does not yet read from data — a language without a words table, a scope tree
over a slot other than `population`. A source's grading scheme is data: its grades,
wordings and consensus classes are read from the source (§3).

**The index is where the graphs meet, and the only place they do.** Each graph stays
separate: no view links another, and the index combines nothing — it is built from the
views and their sources and names no guideline, so that a third guideline is a third
box by a data change alone. **It is a graph like theirs**, a graph and a sheet (§3),
drawn by the same renderer: a tree whose root is *graph.med*, under it one node per
language of the views' sources (`lang`, as recorded: *de*), under each one node per
kind of source (`kind`, its word from the view layer's table: *Leitlinien*), and under
each one box per view that names its source — a level only as far as all of a view's
sources agree on it and record it, the box hanging from the last. The box gives its title as the source
prints it, in the source's language (`lang`); on a line of their own under it, its
version and the date it prints for that version where the source records them
(`version`, `date`; `graph-representation.md` §6.1), in the page chrome's words and
the date at the precision recorded — *Version 1.0, Stand November 2023*,
*Version 4.0, Stand 30.04.2025* —, and no line where it records neither; a half the
source prints two ways names every printing, in the order recorded, each with the pages
its quotes name, under words that say the source gives it inconsistently — *Version
uneinheitlich angegeben: 1.1 (S. 1, 93) und 1 (S. 4, 11), Stand 14.04.2025* —, none
chosen and none set below another; its
register number where the source records one (`awmf_register`); and what the graph holds: its recommendations (the
statements), the patient groups a reader meets in its tree (the junctions of its first
grouping, each concept once) and the claims they rest on, or, while it holds no claim,
that none has been extracted, and while it holds claims but no statement, that none has
been linked yet. A source has no short title of its own, so the box shows the title as
printed, as a view's root box does. Each guideline's patient groups are not drawn here:
that would repeat the views outside them and begin a view combining two sources. The
tree is small, so it is drawn at a size a phone reads, and always whole: left to right
where the canvas leaves a box its least width beside the levels, else — on a phone —
as an indented tree, each node under its parent and set in by a step, a box taking the
width left.

Tapping a box, or the line leading to it, **opens its graph at once**: one tap, no
selection in between. A box is selected only by its deep link or from the keyboard:
then the rest fades, and its **entry** opens in the sheet beside the graph, on a phone
in the strip at the bottom edge — its title and what the graph holds, which raise the
sheet, and the entry's *Graph öffnen*. The keyboard reaches a box through its entry:
beside *Graph öffnen* a toggle, *Im Graphen zeigen*, selects the entry's box and,
pressed again, returns the sheet to its home, as tapping the canvas or a level
does, the focus staying on the entry (on a phone, on the strip's link); it is shown
only where the graph is drawn. A selection that changes nothing — the home again, the
same box again — leaves the sheet as it is. The entry gives the title as printed, what
the graph holds, and for each source its version and date on a line of their own, its
register number, a link to the source's page and its licence line with the note beside
it (§5); the entry is one link to the graph, its title stretched over it with
*Graph öffnen* below, and the toggle and the source's lines lie apart from it, so that
the source's page can be reached and its licence read. The deep link is the view's id
(`graph.med/#views/<view-id>`); a hash that names no view, or is no well-formed escape,
selects nothing. The sheet's home is the page's text — what graph.med is, *an open collaborative
medical knowledge graph*, in English and bound to no kind of source — and every entry,
in the page's HTML: the graph is read from them, so that the page reads the same without
the script and with a screen reader, and without the script the sheet is the page, the
entries side by side where the width allows and one under the other on a phone. Where
the graph is drawn its boxes say what the entries say, so the entries' section is out
of sight — still read by a screen reader, and shown while the keyboard is in it — and
the sheet shows only the page's text. Every
other word the index adds — the kinds of source included — is page chrome, from the view
layer's table (§3 "Language"). Above the header, every page — the index, every graph
page (§3) and every entity page (§4) — carries a yellow **banner** in English, the
site's one notice (the maintainer, 2026-10-06, #291):

> graph.med is not a medical device under the EU Medical Device Regulation (MDR). Its
> information was retrieved with the help of AI, and it includes AI-generated content.
> It is provided without warranty; use it with care.

Its text is defined once, in `tools/site/templates/banner.html`; the build writes the
same string as `disclaimer` into `index.json`, `llms.txt` and every entity JSON's
`meta` (§4), and the tool carries it in every result (§8). It claims no check. On a
wide screen the banner wraps to the lines it needs and the graph takes the rest of the
window.

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
      │                │       ╲ Amylase < …     answer on the edge (condition slot;
      │                │                         several conditions: one answer, "und")
   ┌──┴────────┐   ┌───┴───────┐ ┌───┴───────┐
   │ recommend.│   │ recommend.│ │ recommend.│    the statements — boxes coloured by
   └─────┬─────┘   └───────────┘ └───────────┘    direction (für · gegen · abwägen · Lücke),
         ┆ (dashed)                               its glyph, the grade as printed (A · B · 0 · EK; ⇑⇑ · ⇔),
         ┆                                        a basis printed beside it (⇑ EK),
         ┆                                        the verb a word where the grade does not carry it;
         ┆                                        dashed red border when contested
         ▷ aim                                    outcome slot
```

- **The questions are ours; every answer is data.** "Welche Population?" and
  "Welche Bedingung?" are the only text the build adds, with the conjunction
  below, in the view's source language (a language the build has no words for
  fails the build; nothing falls back to English); the words of the root's line
  for its source's version and date are the page chrome's (below). Each answer on an edge is a
  population or condition concept; each box is a statement with its claims' grade;
  each aim an outcome concept. Nothing else is invented — in particular no yes/no
  branches and no ordering between conditions, which is what authored pathways will
  add (`graph-representation.md` §5, `branch` edges with a `guard`).
- **Several conditions are one answer.** A statement's conditions hold at once
  (`graph-representation.md` §3.2), so the condition question answers a statement
  with several by **one** answer naming all of them, in the order stored, each
  by its short form on a line of its own and every line after the first opened
  by the conjunction from the build's words table (`und`): `invasive Beatmung` /
  `und ARDS` / `und PaO2/FiO2 < 150`. The box is reached exactly once, and never
  through one condition alone — one answer per condition would draw a path to
  the box that names one of them, as if it sufficed; asking one after another
  would invent an order the source does not give. The line per condition keeps
  a label's own "oder" (a disjunction is one concept) from reading across the
  join. One condition is the same rule with no conjunction: its answer names it,
  as always. Every answer carries the ids of what it names, one or several
  (`refs` in the view's JSON; a node stands for one entity, its `ref`), and a
  condition is found wherever it is one of them, by one rule for one and for
  several: tapping an answer selects every concept it names, wherever each
  appears, and opens the details of each in the order named, a card after the
  other (the strip on a phone names every title, one to a line); a deep link or a link in the
  section to one condition selects it wherever it is named, alone or with
  others, the box it leads to included; the search finds the answer by any of
  them.
- **The root names the source.** The root box gives the view's source by its title as
  printed and, on a line of its own below it, its version and date as the index's box
  does (§2), from the page chrome's words; a section view's root names its section
  instead, and the sheet beside it the source. Tapping the root opens the source's
  details, and the sheet's home names it the same way. Every other place a page names a
  source by its title — a card's citation (zone 8), the source's own page, a claim's
  citation line — carries the same line, and a source that records neither shows none.
  The date is shown, never used to order anything.
- **Patient groups converge.** Statements sharing a population hang from one
  junction, so the tree shows at a glance what the guideline says for, say,
  colorectal resection. A condition is asked within its group.
- **Forms tell the types apart, colour tells the direction, a token the grade.**
  Diamond, box, tag for question, recommendation, aim; the answers are bold edge
  labels written at the end of their edge, beside the group or box they lead to, so
  that many answers from one question do not pile up mid-edge; the aim a dashed
  edge. A relation between two recommendations (`specializes`, `complements`,
  `conflicts`) is not an edge of the tree: it takes no part in the layout and
  unfolding a group never follows it. While a box is selected, the boxes
  related to it that are shown keep their colour and wear a dotted outline; no
  line is drawn across the tree, and the card names each relation (zone 9).
  A sequence (`follows`, `graph-representation.md` §5) is no edge of the tree
  either: the card names a statement's steps before and after (zone 5) and
  opens the whole chain on a page of its own ("The path view", below).
  A box takes the colour of its direction — the four colours of the judgement band
  in the details, so that box and section agree — and its label begins with a
  stamp, in text, before the short form: `✗ EK soll nicht · Keine präoperative
  Haarentfernung`. **The glyph** (✓ ✗ ⚖ ∅) says the direction again, for every
  reader who does not see the colour: under red-green deficiency the *für* and
  *gegen* fills are one colour. `⚖` carries the text variation selector U+FE0E,
  and the page's font stack (`--font`, the graph's too) names text faces that
  have it after the system face, so that no platform draws it from a colour emoji
  font — the selector alone did not keep Chromium from it where the system face
  lacks the glyph. **The grade** follows as the
  guideline prints it — `A · B · 0 · EK` in one, `Stark · Schwach · EK` in
  another, `⇑⇑ · ⇑ · ⇔ · ⇓ · ⇓⇓` in a third, whose arrows carry the direction
  —, several in their scheme's order when the claims differ: the order of the
  scheme's table, which need not run strongest first (the arrows run from for to
  against). The arrows are text in the page's font stack, a glyph on every
  platform and never an empty box. The order,
  like everything else about a grade, is read from the grading scheme the source
  declares (`graph-representation.md` §3.1): the build knows no grade, verb, basis or
  consensus class by name. An EK box is coloured by its direction like every
  other recommendation and marked "EK", not demoted. **A basis** — what a box
  prints beside its grade, or in its place, for what it rests on (`EK` beside an
  arrow, a `basis` of the scheme, §3.1) — follows the grade as the box prints it,
  every basis the claims carry in its scheme's order: `✓ ⇑ EK · …`, `✗ ⇓ EK · …`,
  and alone where the box prints no grade, `✗ EK empfehlen nicht · …`. A basis is
  no grade: it changes neither the colour nor where the verb is written. **The verb is a word where
  the grade does not carry it.** The build computes, per grading scheme — the
  grade names its scheme through its claim's source, so the grades of two
  schemes are never pooled —, which verbs the supporting claims of that source
  say under each grade: where a grade has exactly one, the grade determines the
  verb and nothing is written; where it has more than one, a box whose claims
  carry that grade writes its verb after it. The word carries its negation in
  the form the scheme prints — `soll nicht`, `schlagen nicht vor` for a
  recommendation against, never the verb with "nicht" appended — exactly as the
  judgement writes it, so that box and card say the same thing; it is read from
  the claim's own grade where that grade gives the claim's wording (a wording two
  grades share, each fixing another direction: `soll` under `⇑⇑` and `⇓⇓`), else
  from the scheme that defines the wording. The rule reads
  the claims, not the scheme's table, so one new claim can make a grade
  ambiguous and every box of that grade then writes its verb. Supporting claims
  that disagree on the verb give no word (the verb, like the grade, is shown and
  never composed). **The border means
  state alone** — a contested box's dashed red border, and the selection; it
  carries no meaning of its own.
  **The legend** sits under the graph, at the bottom left, and keys what this
  view draws and nothing else. Its keys are computed by the build from the
  view's trees and its statements' claims — the same computation that decides
  where a box writes its verb — never declared: a direction no box has, a
  contested border no box wears, an edge style no tree draws, has no key, and a
  form, colour, letter or edge style the view draws has one. They stand in named
  groups, laid out as a small table: one row per group, its name in a column of
  its own and its keys side by side beside it, wrapping in their column, a
  hairline between the groups — so that the panel is as tall as its groups
  rather than as its longest group, and each group is told apart at a glance:
  *Typ* (question; patient group, and an open one, the state in its form's key;
  recommendation; aim), *Richtung* (a chip in the box's
  fill with the glyph inside it, and a box without a direction), *Grad* (the
  grades the boxes carry, in their scheme's order, and the grades under which
  the verb is written as a word; where every grade the boxes carry writes its
  verb — compared as grades of their schemes, so that a grade word two schemes
  share is not taken for one grade —, the two are one key, the grades with the
  verb as a word, and no grade is named twice; then, as a key of its own after
  them, each basis the boxes' claims carry, its token and its scheme's
  description, **EK** Expertenkonsens — never listed among the grades, which it is
  not, and present only where a box carries one), *Rahmen = Zustand* (contested, related to the selected
  box, applying generally to the selected group) and *Kanten* (answer, the way
  on, the aim). The panel always holds every key the view has, whatever the
  reader has opened. A question the reader has closed (grey, dashed) has no
  key: it is drawn only after the reader's own tap on it, which says what it is. A chip carries a border that holds
  against the page in both themes, so that no key is told by a pastel alone.
  Interaction hints are not keys: the legend has none, and the one hint — tap or
  click a box — is the sheet's home text (its verb: "Language" below). Collapsed,
  the legend is a pill of at least 44 px carrying the view's direction chips and
  the word *Legende*, so the corner says what it opens; expanded, the panel stands
  beside it on a wide screen, and on a phone opens upward from it over the graph,
  as tall as the free row at most, so that the tree keeps its room and a touch on
  the graph puts it away. It is collapsed at every load, on every screen, and only
  its pill opens it; nothing is remembered: the site keeps no client state. On a
  phone the legend and the chapter panel share
  the little height the graph leaves, so opening one closes the other.
  Claims are not nodes; they are the evidence and appear in the section.

**Drawn by a library, left to right, folded.** The page uses Cytoscape.js with the
dagre layout, self-hosted under `assets/vendor/` (MIT, pinned, no third-party
request): boxes have a fixed width and grow to their wrapped text, the layered
layout has no overlaps, edge labels are placed, and touch pan and pinch come with
it. The index draws its tree with the same library, forms and colours, and
opens a tapped box's entry in the same sheet and peek strip (§2). Three choices keep
the tree readable at ninety recommendations:

- **Left to right.** A rank is a column, so the widest rank becomes a tall column
  that pans vertically — natural on a phone and on a desktop — and the whole tree is
  seven columns wide.
- **Folded by default.** The page opens with the root, the first question and its
  answers, one junction per patient group carrying the number of recommendations
  behind it. Tapping an answer or its junction unfolds that group's conditions and
  recommendations, and the graph fits the group with everything it unfolded and the
  answer that names it, so that the reader sees which group they opened, whole,
  zoomed out as far as that takes; tapping again folds it. Only what the reader
  opened takes space.
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
  `graph-representation.md` §5): the first question's answers are the roots of
  that hierarchy — or, in a view with a scope tree (below), the groups directly
  under its root: for the first view *Operation eines gastrointestinalen
  Tumors*, *kardiale Dauermedikation*, … — each with the number of
  recommendations anywhere below it, heaviest first. Opening a family shows its own
  recommendations and its member groups, each folded until opened in turn; closing
  it folds everything below. A recommendation hangs from the group it was made
  for, never from a family — the edge only groups and folds, it never moves a
  recommendation from a family to a member, and a group with two parents appears
  under both.
- **The scope tree, where the view declares one.** A view with `anchor_slot` and
  `scope_root` (`graph-representation.md` §4) folds its patient groups by its
  scope tree: the `broader` edges and the scope edges (`in_scope_of`, §5) that
  lead to the root, as the first axis of its `group_by` chooses them (§4.1). The first question's answers are then the concepts directly
  below the root — the root itself is no answer, unless recommendations are
  anchored on it, and then it is one answer with nothing below it — and every
  level below folds as before, a scope edge's lower end a member group like a
  `broader` one. Under every grouping but another hierarchy axis the same scope
  tree folds the groups. Opening a group also reaches **what applies generally** to
  it: the recommendations anchored on the upper end of a scope edge its concept
  reaches, itself or through the groups above it. A path counts only when it
  ends in a scope edge, so along `broader` alone nothing moves. They are never
  merged into the group's own: they hang where they were made for and stay out
  of its count. While the group is selected, those shown keep their colour and
  wear a double outline (the legend names it, for such a view only), and the
  sheet lists them apart from the group's own, under "Allgemein geltende
  Empfehlungen": grouped by the concept each was made for, with the condition of
  the scope edges on the way ("Voraussetzung", every condition on the path holding
  at once and joined as zone 5 joins a statement's; of several paths the one with
  the fewest conditions counts), then each
  recommendation with its number, page and section. The statement card names the
  other side in zone 5. The origin is data, not only rendering: the view's JSON
  carries `scope` — its anchor slot, its root, and per concept `own` (the
  statements anchored on it) and `general` (each with its `anchor`, the `via`
  concept whose scope edge it came through and its `condition`) — and each
  junction its `general`; the statement's JSON carries it on the card (zone 5).
  A view that declares no scope tree is drawn exactly as without this.
- **The axis is the reader's choice.** What the tree groups by is an **axis**
  (`graph-representation.md` §4.1), and an axis exists once a person has
  proposed it for the view and a linking pass has asserted it. The families
  above the patient groups are the view's first axis, a hierarchy over its
  anchor slot; a view without one shows its patient groups unfolded. The page
  offers a switch whose first entry is that tree of patient groups, whose
  second is the **chapters** of the view's sources — built in for every view,
  derived from the claims' `section` and the sources' `outline`
  (`graph-representation.md` §6.7), no axis entity behind it — and whose others
  are the other axes the view declares in `group_by`, in that order, and no
  other. Under the chapters the first
  question is "Welches Kapitel?", its answers the top-level sections in outline
  order, each with the number of recommendations supported from it or beneath
  it, a recommendation supported from two chapters under both; below each
  chapter the population question with the families that chapter touches. A
  *dimension* axis (a value it gives each statement — a phase, a setting) adds
  its own question the same way, its answers the axis's values in the order declared;
  a *hierarchy* axis changes which concepts are the families of the question
  it folds and how it unfolds. None of them changes the shape of the tree, its
  folding, or where a recommendation hangs — the chapters are answers of a
  question the reader chose, never nodes in the pool and never the default
  shape. Whatever the chosen grouping cannot place is one answer, "not placed",
  last among that question's answers at every depth where it is asked, so
  nothing disappears. The switch shows each axis's `label`; the chapter
  question, "Kapitel", "not placed" and the word for unfolded patient groups
  come from the per-language table like the questions; the build knows no axis
  by name. **How it looks.** The switch is a select in the
  row of controls over the graph, after the search box: it shows the name of
  the chosen grouping — the first axis's `label` ("Population" on the first
  view), "Kapitel" for the chapters, then each other axis's `label`, in the
  view's language — and opens the
  list on a tap. On a phone the row wraps and the switch takes the second line
  beside the facet filter, wide enough for an axis's label. A chapter's answer
  is its number and title, cut to the box rule's sixty characters with an
  ellipsis only when longer; a dimension axis's question is the `question` it
  declares, and without one its short label in the per-language question form
  ("Welche Phase?"). The choice is part of the URL, `?by=<grouping>` before the
  `#<entity id>` deep link — `section` for the chapters, else the axis id;
  absent for the first grouping, and an unknown value falls back to it — so a link to a grouped view is shareable and a deep
  link unfolds to its target under the chosen grouping.
  Switching keeps the chapter, the search, the facet and the selected entity;
  it is a change like any other, and the back button returns to the grouping
  the reader left.

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
everything that is open (drawn, not a glyph a font may lack) — centred in the free
row, whole, zoomed out as far as that takes, and where the tree is too large even
at the smallest zoom, starting at the row's top left so that it runs out below and
to the right, never under the controls — and a **back** button beside it, drawn
too, that returns the view as it was before the reader's last change: what is open
and what is closed, the selection, the chapter, the search and its facet, the
grouping, the zoom and the pan. It goes back one change per tap — a group or a
question folded or unfolded, a tap that selects or deselects, the fit button, a
step, a chapter, a grouping; a search while it is typed is one change — as far as
the view the page opened with, and is disabled when there is nothing to go back
to. The view returned to is the one the reader saw: every box where it stood, at the
zoom and the pan it had (the maintainer, 2026-10-18: focus before a readable zoom,
and a back button in place of a reset). An assistant's acts through the session
tools (§8) are changes like the reader's, undone by the same button; its highlight
is a halo in the page's accent, named on a line under the controls that the reader
clears with ✕. Tapping a node or an answer selects it: what leads to it and what
follows it stay — for an answer, the question it answers and the box it leads
to —, everything else fades, and its details open in the **section below the
graph** — on a wide screen, in a **column beside it**, the graph taking
the full height; the graph stays where it is either way, so the reader keeps their
place, and the section opens at its top, the title, on every selection — never in
the middle of the card before it. **On a phone the details wait in a peek strip**
at the bottom edge rather than below the graph: the direction colour as a swatch
and an edge, the title, and the judgement (`✓ für · Grad B`, and `⚠ umstritten`
where a contesting claim exists), so that closed it already answers the first
question. Tapping the strip raises the section over the graph; `✕`, the strip
again or Escape lowers it. While the strip waits, the graph takes the height the
banner, the header and the footer leave — never less than it has without a
selection —, the footer follows the graph, and the page ends with the strip's own
height: nothing blank stands between the graph and the strip, and the footer,
scrolled to where the page is taller than the screen, lies wholly above it. Lowered
while the keyboard is on what it hides — a control of the card, or `✕` —, the focus
goes to the strip, so that it never falls to the page and the next Tab goes on from
the strip; anywhere else it stays where it was. The index's strip does the same (§2).
Raised, the strip shows only the swatch and `✕` while
the card's own title is in sight, and its title and judgement again once the
title has scrolled away under it, so that the reader always knows which
recommendation the text below belongs to. On a wide screen the column is as wide
as a third of the screen, at least 400 and at most 560 px, so that a row of zone 5
does not wrap its value into four lines.
A disclosure the reader opens or closes on one card — the evidence table, the
general groups, a rule, the folded body text, the further related statements — stays so on the next selection,
for as long as the page is open, and is never stored. The page itself never scrolls: not on a tap, not on
raising or lowering, and the graph is where the reader left it. The strip is
built in the browser from the card's own title, band and chips, and a wide
screen does not show it. Tapping the background clears. Tapping a concept linked in the section
moves the graph there. Deep links carry `#<entity id>` — what an answer naming several
concepts selects, their ids joined by a comma —, and `?by=<grouping>` when the tree is
grouped by the chapters or an axis. There are no modal dialogs and no page
loads needed to read a view; the entity pages (§4) exist for linking, not for reading.

**The wrapper is three rows.** Everything the page floats over the canvas is placed
in a row of one grid rather than at a measured distance from an edge: the controls
in the first, what the reader opens over the graph — the chapter panel — in the
second, the legend in the third, and the canvas spanning all three. A control row
that wraps on a phone makes its own row taller, the legend is as tall as it is,
collapsed or expanded (on a phone, where it opens over the graph, as tall as its
pill), and both the panel's height and the zoom that fits the tree
follow from the free middle row. No constant states how tall the controls or the
legend are.

**Chapters and search.** Two ways to narrow the tree, deliberately different in
kind:

- **A chapter tree beside the graph**, built from the source's `outline` and the
  claims' `section` (`graph-representation.md` §6.7). Tapping a section is a
  *hard filter*: the tree shows only the statements supported from that section
  and its subsections, plus their groups, conditions and aims; nothing is redrawn
  and no edge is computed, the rest is simply not shown. Sections without a claim
  are listed greyed, so the reader sees what the pool has not extracted. The
  chapter tree is a control, not the graph: the graph stays the one decision tree,
  and the tree of headings never becomes its shape. Its *alle* row stays fixed at
  the top of the panel while the sections scroll, so that after any narrowing the
  whole tree is one tap away (whether the search also finds sections in this tree
  is open: `open-questions.md` → chapter-search).
- **A search box** is a *soft highlight*: it matches the label, short label,
  slot concepts and claim text of statements, the labels of patient groups, and
  the answers on the edges — a condition is an edge, not a node, and must be found
  all the same, an answer naming several by each of them — without regard to case
  or diacritics; matches keep their colour
  and everything else fades without disappearing, so "Leber" shows every branch
  the liver occurs in and, just as usefully, where it does not. A counter reads *n
  Treffer in m Abschnitten*. Hiding would destroy the overview the search exists to
  give; fading keeps the structure. A node the chapter tree can reach and the
  search cannot is a bug. The search also **steps**, word-processor style: a
  pair of arrows beside the box, and ↓ and ↑ while the box has focus, move from
  one match to the next in graph order — a node before what hangs from it,
  siblings top to bottom — wrapping at both ends. A step selects the match
  exactly as a tap would: its details open, the graph fits to it, the rest of
  the fading stays as it is. Only visible matches are stepped, so a match
  behind a question the reader has closed is not visited. The counter then
  leads with the reader's place, *3 von 12 Treffern in 4 Abschnitten*, until the
  query changes.

Once concepts carry a `facet`, the search gets facet filters (only procedures,
only outcomes). Everything here runs in the browser on the view's JSON.

**Direction, in four words.** A recommendation's direction is one of *für*,
*gegen*, *abwägen*, *Lücke*, derived at build time from the supporting claims, each
read in its grading scheme (`graph-representation.md` §3.1). The grade the box
prints decides first: a claim whose grade the scheme makes one for or one against
(an arrow, `direction` on the grade) reads für or gegen by that direction, whatever
its verb — a `kann` printed under `⇑` reads für —; a claim whose grade the scheme
declares `open` → abwägen, with or without a verb of its own (a sentence under
grade 0 that says only "ist als internationaler Standard anzusehen" weighs as the
grade does). Only a claim whose grade fixes neither, or that has none, is read by
its verb: the wording of a grade the scheme declares `open` → abwägen, because an
open recommendation is the guideline's own third category, neither for nor against
— in the AWMF scheme grade 0, "kann", in the arrow scheme `⇔` (the judgement adds
the lean, "eher für" or "eher gegen"); any other recommendation → für with
`direction: for`, gegen with `against` — `soll`, `sollte`, and a GRADE scheme's weak
"schlagen vor" as much as its strong "empfehlen", since its table gives the weak
grade an arrow up or down; `kind: gap_notice` → Lücke; claims that disagree in
direction → abwägen; a fact has no direction. A verb another guideline's scheme
defines (a *sollte* in a guideline graded by GRADE) is read in that scheme. The box's colour and the judgement at the
top of the details carry it; the
glyph (✓ ✗ ⚖ ∅) stands on the box, before its grade, in the judgement and in
the legend; the legend lists the words this view has, each with its colour and
glyph. Timing
("innerhalb von 24 Stunden") is not a direction; it stays in the label.

**What the section shows.**

- *statement*: the **statement card** — nine zones in a fixed order, so that a
  physician reads the judgement, then the wording, then for whom it holds, what
  limits it, whether anything contradicts it, and where to look it up. A zone
  with nothing shows its empty state or is absent; it never swaps place. Every
  heading is a label in the statement's source language, from the build's
  per-language words table (`CARD_WORDS` in `tools/build.py`), and none is a
  written-out question:

  | # | Zone | Heading | From | Gone when |
  |---|---|---|---|---|
  | 1 | Title | none | `short_label`, else `label` | never |
  | 2 | Judgement | none | supporting claims; whether a contesting claim exists | never |
  | 3 | Wording | `Wortlaut der Empfehlung` | `claim.label` per supporting claim | never |
  | 4 | Evidence | `Evidenz` | the supporting claims' `evidence`, per row; else `nicht erfasst` | never |
  | 5 | Applies to | `Gilt für` | the `population`, `condition`, `action` slots, then the value of every dimension axis that places the statement, named by that axis's `short_label` (else `label`); then the steps before and after it, `follows` (`Davor`, `Danach`), and the statements related to it, `specializes`, `complements`, `conflicts` (`Verwandt`), each row absent without an edge | no slot filled, no step and no related statement |
  | 6 | Body text | `Hinweise aus dem Begleittext` | `limits`, `refines`, `supplements` | never (empty state) |
  | 7 | Contradiction | `Widersprechende Empfehlung(en)` | `contests` | no contesting claim |
  | 8 | Citation | `Beleg` | the supporting claims' `source`, the source's title, `version` and `date` | never |
  | 9 | More | `Mehr zu dieser Aussage` | `specializes`, `complements`, `conflicts`, `follows` with its `transition` and `trigger`, the ids, the slots as stored | never (closed) |

  1. **Title.** The short label, exactly once on the card. Under it one muted
     line names where the recommendation comes from — each source by its
     `short_label` (else its title) and the recommendation numbers of its
     supporting claims, `S3 Sepsis 2025 · Empf. 8.15` —, so that the guideline
     is known before the band and never only at the end of the card; zone 8
     keeps the full title. Each number stands once: where a box's
     recommendation sentence and the fact it prints beside it both support the
     statement, the line names the box once, `S3 Vorhofflimmern 2025 ·
     Empf. 6.14`, and zone 8 keeps an entry per sentence.
  2. **Judgement.** One band, a block filled with the direction colour, no
     heading; its lines share the left edge. Line 1, in the card's largest
     type: the glyph, the direction word and the verb as the claims say it —
     for a recommendation against the negated form its scheme prints, "soll
     nicht", "schlagen nicht vor", never the bare verb. Line 2: one chip per
     supporting claim in claim order, its grade as text on the chip's own light
     fill — the grade as printed in the card's frame (`Grad A`, `Grad Stark`),
     and a grade that fixes no wording, an expert consensus, by its scheme's
     description of it (`Expertenkonsens`) —, a claim that recommends nothing —
     a fact, a criterion, a definition, which carry no grade
     (`graph-representation.md` §3.1) — by its kind where the grade would
     stand, in plain type, since the bold is the grade (`Feststellung ·
     Expertenkonsens · Konsensstärke 92%`), so that its chip never reads as a
     grade left empty; a basis the claim prints beside
     its grade by its scheme's description of it, after the grade (`Grad ⇑ ·
     Expertenkonsens`; the token stays on the box), and its consensus beside
     them: the class as the scheme names it (`Starker Konsens`) and, where the
     claim prints the share of votes, the share after it (`Konsens, 95 %`); a
     share whose scheme declares no class is named by the card's word, never
     bare — `Grad ⇑ · Expertenkonsens · Konsensstärke 100%` —, since a bare number
     does not say what it counts and `Konsens` alone is a class of other schemes.
     Identical chips collapse to one with a count, `Grad A (2)`, a chip with a
     basis never into one without, a fact's never into a criterion's; the
     statement JSON's badge carries `basis` only where its claim prints one,
     and `kind` only for a claim that recommends nothing. A chip is
     read in its claim's own scheme: the same token from two schemes is two
     chips.
     The chips wrap under line 1 and never squeeze it. **Their order is the
     order of zone 8's entries** — the only thing tying a chip to its citation.
     Only when a contesting claim exists, a third line under the chips,
     `⚠ umstritten` in the contested colour, a link to zone 7 — not a chip
     among the grades, because a contesting recommendation is the one case in
     which a reader must not stop after the judgement, and a line has room for
     the reason. A claim without a direction (a fact, a gap notice) draws no
     direction line and its band stays on the neutral surface; its chips still
     stand in line 2. Grades are shown, never composed (below). Fill means
     grade, block and glyph mean direction — the chip keeps its own fill on
     the block; nothing is carried by colour alone.
  3. **Wording.** The guideline's own sentence on its own surface: body-text
     size, line height 1.6, a measure of about seventy characters, no indent,
     no rule, no shrunken type. Several supporting claims: one surface each, in
     zone 8's order. The number, page and section are in zone 8, not here.

     **Where the source says otherwise.** A claim the source contradicts at
     another place (`graph-representation.md` §5 `disagrees_with`) carries,
     under its sentence, a line of its own in the disagreement's colour,
     worded as the source's own inconsistency — `≠ Die Leitlinie nennt hierzu
     eine abweichende Angabe:` (`… abweichende Angaben:` for several) — and
     under it each other printing: its sentence, its recommendation number,
     page and section linked into the source by its quote, `Textstelle` (its
     claim's page), and a closed `Worin die Angaben abweichen`, the edge's
     rationale, tagged *KI-erzeugt*. Every side is shown and none is marked
     as the right one; the colour is not the contested red, which is two
     sources (zone 7). The same line stands under a passage of zone 6, under
     a node of a rule in zone 5 (for a printing that is not the concept's own,
     below) and on a claim's page, so that each side's card shows the other.
     In the statement JSON a `wortlaut` entry and a passage of
     `leitlinientext` carry `disagrees_with`, the other printings, each with
     `id`, `kind`, `label`, `lang`, `source`, `recommendation_no`, `page`,
     `section`, `quote`, `link`, `rationale` and `rationale_lang`, only where
     there is one.
  4. **Evidence.** How certain the evidence is, separately from how binding
     the recommendation is (zone 2), from the supporting claims' `evidence`
     entries. The heading says `Evidenz` once, and no line under it starts
     with it again. Each rating system is named by the name the claims' source
     declares for it, as the source prints it (`GRADE`, `Oxford 2011`;
     `rating_systems`, `graph-representation.md` §3.1), never by its slug; the
     statement JSON keeps the slug as `evidenz.groups[].system` and the name
     beside it as `system_name`. One group per system, never merged, in one of
     five forms:

     | Form | What it renders |
     |---|---|
     | One value | one line, no disclosure: `moderat nach GRADE`, `1 nach Oxford 2011` — the value as the claim stores it, then the system's name; one entry with neither an outcome nor a key |
     | One row | one line, no disclosure: the value and the system's name, then what the value rates — `Moderat nach GRADE · Endpunkt: Klinisch relevante obere GI-Blutungen`, a keyed row `… · Bezug: <key>`, a row naming both `… · Bezug: <key> · Endpunkt: <endpoint>`; a row the source lists unrated reads `nicht erfasst nach GRADE · Endpunkt: …` — a table of one row is no table |
     | Per row | a native `<details>`, closed — its summary already says what was rated and how certain, the table is for whoever asks which endpoint —: its `<summary>` reads `für 4 Endpunkte bewertet, hoch bis sehr niedrig`, or `für 2 Endpunkte bewertet, hoch` where every row carries one level, under it a table `Endpunkt \| Sicherheit` in the guideline's order, never sorted, the system named once as the table's caption; a table with keyed rows reads by its keys (below) |
     | Expert consensus only | one line: `Expertenkonsens, keine Evidenzbewertung` — no supporting claim carrying an entry, and each either graded by a grade that fixes no wording in its scheme (`EK`, an expert consensus, `graph-representation.md` §3.1) or printing a basis beside its grade (`⇑⇑ EK`); the first words are the scheme's description of that grade or basis, one line per description where the claims rest on different ones |
     | Nothing recorded | one line: `nicht erfasst` — what is not recorded, never that the guideline says nothing |

     The summary line says what the source rated and how many, and the range
     follows it after a comma, as what it is — a description of a set, no value
     of the recommendation. Where every row carries one value instead, matched
     without regard to case, that value follows in the range's place (`für 2
     Endpunkte bewertet, hoch`), so that a closed table still shows its rating:
     it is the value each row prints, named once, for any system, since naming
     it needs no order, and nothing is composed — rows that differ keep their
     range, or lose it as below, and are never named by one of their levels. It
     is named in the form the display order holds where the system has one and
     the value is on it, as the range is, else as its first row prints it
     (`für 3 Endpunkte bewertet, sehr gering`); the statement JSON carries it
     as the group's `level`, beside `range`. A table counts two rows or more, so the line has
     no singular: one row is the one-row line, which names the endpoint or the
     key its value belongs to, so that the certainty stays with what it rates
     and no line claims that a single value depends on anything. The
     range is the highest and the lowest value present by the system's display
     order (`EVIDENCE_SCALES` in `tools/build.py`, keyed by system, read for
     this and for the form of the one level, and nothing else), matched
     without regard to case — a value is
     stored as printed, and a box's `Moderat` and a method section's `moderat`
     are one level — and named in the form that order holds (`moderat bis
     sehr niedrig`), while each row shows its value as the claim stores it; a
     system the build has no order for keeps the
     table and loses the range, `für 4 Endpunkte bewertet`, and
     never fails the build. A system its claim's source does not declare is
     refused by the validator; the build shows its slug and stops at nothing.
     Where some rows carry a value and others do not,
     those rows read `nicht erfasst` and the line counts only what is
     recorded: `für 3 von 5 Endpunkten erfasst`. Several
     systems give one group per system, never merged. Nothing is composed
     — no average, no worst case, no certainty in zone 2 — and the disclosure
     needs no script; print shows the table open where the browser can.

     A source may key its rows by something other than an endpoint — a
     component of the action, a subgroup, an arm, a comparator, a device, a
     regimen —, and the entry then carries the row's printed `key`
     (`graph-representation.md` §3.1). A table with such a row is read by its
     keys: a first column `Bezug` holds each row's key, the `Endpunkt` column
     follows only where some row names an endpoint, and the summary line
     counts rows, not endpoints, with the same range rule:
     `in 2 Zeilen aufgeschlüsselt, moderat bis sehr niedrig`,
     `in 3 Zeilen aufgeschlüsselt, moderat`,
     `in 5 Zeilen aufgeschlüsselt`, `in 5 Zeilen aufgeschlüsselt, 3 davon
     erfasst`. `Sepsis-Screening | Moderat`,
     `Dopamin | Hoch`, `oXiris® | Mortalität | Sehr niedrig`: the key is never
     shown as an endpoint. A row without a key leaves its `Bezug` cell empty,
     and a row without an endpoint its `Endpunkt` cell: `nicht erfasst` is said
     of a value, never of what a row rates. A table without a key reads as above, and a row
     of the statement JSON carries `key` only where its entry has one.

     A cell may print words where a level would stand, and a heading may print
     words for the kind of evidence its rows rate; the entry keeps them as its
     `note` (`graph-representation.md` §3.1), and zone 4 shows them in their
     words, never as a rating and never as unrated. Words in a level's place
     stand there: they lead the line, with no system named after them
     (`Keine Interventionsstudien identifiziert`; keyed, `Leitlinienadaptation
     · Bezug: DOAK`), and fill the `Sicherheit` cell of a table. Words beside a
     value follow it (`sehr gering nach GRADE · Endpunkt: … · Aussagesicherheit
     der indirekten Evidenz`), in a table in a column `Anmerkung` that is there
     only where a row has both. A summary line counts a row with a note as
     recorded. An entry without a system — a note alone, where no row of its box
     is rated — is a group of its own that names no system. The entries of a
     group that name neither an endpoint nor a key — the box's own rating
     (`Moderat nach GRADE`) beside rows that rate its endpoints, a cell's words
     for the whole box — are lines of their own before the group's rows, never a
     row of its table, and its summary counts the rows alone. The statement JSON
     keeps them as the group's `box`, and a row's words as its `note`, each only
     where there is one. A source's own level words the display order does not
     hold (`gering`, `sehr gering`) stay unranked: the table keeps its rows and
     loses the range, as a system without an order does, and no guideline's
     words are added to `EVIDENCE_SCALES`.
  5. **Applies to.** The slots as rows: `Patientengruppe` (population, with the
     families it belongs to below it, after `gehört zu:`, so that they read as
     broader categories and not as further requirements), `Bedingung` (condition), `Maßnahme`
     (action), then one row for every dimension axis that gives the
     statement a value (its placement, `graph-representation.md` §4.1), in the
     order of the axes' slot keys, named by the axis's
     `short_label` (else `label`) and never by the slot key or a word of the
     build's table — so a dimension asserted later appears without a code
     change, and two statements under one population that differ only in a
     dimension value (an access, a phase) are told apart on their cards. In
     the statement JSON `geltung` holds each row under its slot key, a
     dimension's row carrying its `axis`. A slot is plain text when its concept carries only this one
     statement in that role, and a link with the count when it carries more —
     `Magensonde ziehen (6 Empfehlungen)`, the current statement included. Linked
     or plain, the entries of a row stand at one spacing however their labels
     wrap, one-line entries 44 px apart, and a link keeps its 44 px touch target. In a
     view with a scope tree, the anchor's row carries a second line under its
     value: a disclosure like zone 4's, but closed, so that the rows read on
     from the anchor to the condition without a list between them. Its summary
     counts — `Gilt allgemein auch für 11 weitere Gruppen` — and opened, it is a
     table of the groups whose scope edge leads directly to the statement's
     anchor, `Patientengruppe`, with a column `Voraussetzung` only where an
     edge has a condition; on a phone the table takes the card's width, and
     print shows it open where the browser can. In the JSON the
     anchor's row carries `allgemein`, every group it applies generally to — also
     those below the named ones — with its `condition`, its `via` and `direct`. The
     `outcome` slot has no row: an endpoint is the dimension the certainty
     varies along, which is zone 4's business; the slot stays in the schema and
     the data and is listed under zone 9. The last row, `Verwandt`, names the
     statements related to this one over `specializes`, `complements`,
     `conflicts` (`graph-representation.md` §5), one to a line — the first
     two, the rest in a closed disclosure under them, `2 weitere verwandte
     Empfehlungen`, as zone 6 folds its passages —, each by its
     short label and linked so that the graph moves to it, with what it is to
     this one in words — `allgemeinere Empfehlung`, `speziellere Empfehlung`,
     `ergänzende Empfehlung`, `gegenläufige Empfehlung` —, never the edge's
     name: a related recommendation answers "does it hold for my patient?"
     as much as the slots do. Without one, the row is absent. Under each
     entry, closed, `Warum verwandt` says why the two are related: the
     edge's `rationale` as stored, never composed by the build, tagged
     *KI-erzeugt* with the date of the reading beside the tag (`Stand
     12.10.2026`, the edge's `as_of` in the page's printed form of a date),
     as the disagreement's fold says what two printings differ in (zone 3).
     The reason is the project's reading, written while linking and printed
     in no guideline (`graph-representation.md` §5: such an edge is always
     `modelling`); the tag and the closed fold keep it from reading as the
     guideline's words, and the card grows by one line per entry, not by
     the reason. In the statement JSON each entry of `mehr.related` carries
     `rationale`, `rationale_lang` and `as_of`, so that a program reads the
     same reason.

     **The steps before and after.** Where the statement stands in a
     sequence (`graph-representation.md` §5 `follows`), two rows come
     between the slots and `Verwandt`: `Davor`, the statements it follows,
     and `Danach`, those that follow it. Each is absent without such an
     edge, as `Verwandt` is: a card without a sequence shows neither row and
     no empty state, since no pass has read every source for the order it
     states, and an empty row would claim what nobody checked. A row names
     every one of its neighbours, one to a line, in the guideline's order:
     the transition as a word read from this card's side — on the later
     statement's card `anstelle von`, `zusätzlich zu`, `nach`,
     `gleichzeitig mit` the earlier one, on the earlier's `ersetzt durch`,
     `erweitert um`, `gefolgt von`, `gleichzeitig mit` the later one —,
     then the neighbour as its box names it: the chip of its direction (the
     box's fill with the glyph inside, as the legend keys it, its direction
     word for a screen reader), its grade and basis as printed and its verb
     where the grade does not carry it, its short label — `anstelle von
     ✓ ⇑ sollte · Initial: Ruheherzfrequenz unter 110/min mit
     Symptomfreiheit` —, linked so that the graph moves to it. Every
     neighbour shows its grade, so that a chain of open recommendations
     reads as what the guideline says, never as a protocol. Under it,
     closed, the trigger in words — `Anlass: Ziel nicht erreicht`,
     `Anlass: Befund`, `sonstiger Anlass` — and, opened, the edge's
     `rationale`, which quotes the trigger's wording as printed, tagged
     *KI-erzeugt* with the date of the reading beside the tag, as `Warum
     verwandt` is: both are the project's reading, and the condition row
     above says *what* the circumstance is, the step *after which measure*.
     Nothing is computed beyond the edge: no step further along the chain,
     no threshold (that is the condition's rule, above), nothing inherited.
     Several neighbours in a row stand one under the other, each with its
     own edge's transition and trigger, never joined by a conjunction, an
     alternative or a count: the pool does not say whether a statement that
     follows several follows all of them together or any one of them, and
     the row says neither. Two edges between one pair — the source stating
     their order twice (§5) — are two entries. The rows' words, the
     transitions' and the triggers' are the page chrome's ("Language"
     below), not the card's table (card #294, Decision 3). The steps are
     rows of this zone and not a zone of their own: a `follows` edge is a
     statement → statement relation beside `specializes`, `complements` and
     `conflicts`, whose reader's place is this zone's `Verwandt` row since
     the related statements' zone of their own was removed (below); the
     edge says to which measure the condition refers, so it reads beside
     the condition; and a row absent without an edge needs no exception to
     the rule that every zone keeps its heading, nor renumbers the zones
     after it. In the statement JSON the card keeps them under
     `mehr.follows`, each with `to` (a statement this one follows) or
     `from` (one that follows it), `label`, `title`, `lang`, `direction`,
     `glyph`, `stamp` (what the box writes between its glyph and its short
     label), `transition`, `trigger`, `discriminator` where the edge has
     one, `rationale`, `rationale_lang` and `as_of`; a program reads the
     chain from `sequence` (§4). Under the last of the two rows, on a line
     of its own, `Pfad anzeigen` opens the statement's path view ("The path
     view", below) — on the statement's own page one link per view it
     belongs to, each named by its view where there are several; in the
     path view itself the same place leads back to the view's tree at the
     statement, `Im Entscheidungsbaum zeigen`.

     **The row's word is the slot's, never a graph's.** `Patientengruppe` is
     the word the page already uses for what the population slot holds — the
     legend keys the junction a statement hangs from as a patient group, and the
     index reads the trees "von der Patientengruppe über die Bedingung zur
     Empfehlung" — and it holds for an operation (`Gastrektomie`) and a state
     (`septischer Schock`) alike. The label of the view's first axis cannot
     name the row: the card belongs to the statement, not to a view — it is the
     same on the entity page, which has no view, and in every view the
     statement is in.

     **Several conditions, each once, all at once.** The `Bedingung` row names
     every condition of the statement, in the order stored, each with its own
     link or count and, where it is derived, its own rule under it (below);
     every condition after the first stands on a line of its own opened by the
     conjunction (`und`), in a column of its own, so that the row says that all
     of them must hold and no label's own "oder" reads across the join. No
     condition is dropped, shortened into another or shown alone; one condition
     is the same row without a conjunction. A reference outside the pool (a
     terminology not imported) is named by its id, plain, never left out. The
     statement JSON keeps each slot in the shape the pool stores it: `geltung`
     and zone 9's slots hold the conditions as a list, one row per condition,
     for one condition too, and every other slot as its one row.

     **A derived concept shows its rule.** Under a row whose concept is
     derived (`graph-representation.md` §3.2: it has a `defined_by` edge) — the
     anchor, a condition, any row, by one code path — a line says so,
     `abgeleitet, nach der Regel`, and the rule the edge reaches follows as a
     tree, nested where the source nests it. Where the source prints the rule
     differently in several places (§5: an edge to each printing), the line
     says that instead, `abgeleitet; die Leitlinie gibt die Regel an 2 Stellen
     abweichend an:`, and every printing's rule follows, each its own tree, in
     the source's order — `> 50 ml/kg/h` (S. 99) above `≥ 50 ml/kg/h`
     (S. 101) —, none chosen and nothing computed from them. On the card that
     line is the summary of a closed disclosure, so that the rows read on from
     the condition to the action; on the concept's own page the rule stands
     open. A claim that combines parts
     (`graph-representation.md` §3.1) is a line with the operator in words —
     `UND`, `ODER`, `mindestens 2 von 4`, `Verknüpfung nicht angegeben` — the
     connective as printed (`„entweder … oder … oder aber“`), its page linked
     into the source and `Textstelle`, a link to the claim's page; its parts
     follow under it, set in by a line of their own, each such an entry in
     turn. A combination that names no parts, a list the page gives without
     saying how it combines, shows the claim's sentence under its line. A
     points table (`graph-representation.md` §3.1, a `sum`) is such a line,
     `Summe der Punkte` with the head of its points column as printed
     (`„Punkt(e)“`), and each of its parts reads as its row does: the row's
     own words, its label as §5.1 K reads the row with the points cell in
     it (`Buchstabe: H; Merkmal: Hypertonie* (* nur unzureichend eingestellte
     arterielle Hypertonie mit Werten > 160mmHg systolisch); Punkte: 1`), as
     the entry that links to the claim's page; then, set in under them by a
     line of their own, the rule the row prints or its footnote gives — its
     threshold (`systolischer Blutdruck > 160 mmHg`), as quantity,
     comparator, value, unit and time point, a relative one with its
     reference quantity after the value — joined by `×` where the value is a
     number alone (`> 80 % × Procalcitonin-Spitzenwert`), and as printed,
     nothing added, where the value prints a sign or a word of its own
     (`Bilirubin > 2x Normalwert`), so that no factor is said twice —, or its
     combination with the parts under it —, by this same tree. The points are shown once,
     in the row's own words: nothing is set beside the label, since telling
     where a label prints its points would mean reading the label (card
     #369, on the maintainer's delegation); the sum's `points` stay in the
     JSON as printed. Nothing is added up, and no total, maximum or band is
     shown that the page does not print (the maintainer, 2026-10-11: each
     criterion with its points; card #354). No
     operator is assumed anywhere: a claim without a combination is a single
     rule. Any other claim is one entry: its sentence, whether or not it
     prints a threshold. The sentence prints the number with the words that
     qualify it — `… persistierende arterielle Hypotension mit der
     Notwendigkeit einer Therapie mit Vasopressoren, um einen mittleren
     arteriellen Blutdruck von ≥ 65 mmHg zu erreichen`, `Hyperkaliämie:
     > 6.0 mmol/l; therapieresistent (ohne NET)` —, which the threshold set
     in its place would lose, so that the value would read as if it alone
     were enough. A threshold is never shown in place of the sentence, nor
     beside it, since the sentence already prints the number; it stays in
     the JSON (card #253).
     The entry is itself the link to the claim's page; under it its page and
     section, linked into the source, only where they differ from the last
     ones the tree showed — parts printed on one page in one section are cited
     once, at the first of them. Where a threshold's quantity (or reference
     quantity) is itself derived — a score, which a points table defines
     (`graph-representation.md` §3.2) — a line under the entry names it,
     linked to its page, `CHA2DS2-VA Score: abgeleitet, nach der Regel` (or
     the line of several printings), and its rule follows set in, by the same
     tree: so the bound a recommendation puts on a score, `Bei einem
     ermittelten CHA2DS2-VA Score von ≥2` (S. 40), opens to the score's
     criteria with their points. A rule that would reach its own concept
     again stops there. A
     claim without a threshold says nothing about a missing number: its
     sentence shows whether one is printed, and nothing in the pool tells a
     quantity-like rule ("lange OP-Zeit") from a categorical one ("koronare
     Herzkrankheit"), so the card never claims "the guideline gives no
     threshold". A stated concept's row is unchanged. In the statement JSON
     each row of `geltung` carries `derivation` (`derived` or `stated`,
     computed from the edges) and `rules`, a list of trees — one, or one per
     printing — empty for a stated concept: per node the claim's `id`,
     `kind`, `label`, `page`, `section`, `link`, `quote`, its `threshold` with
     `quantity` and `relative_to` resolved to `{id, label, lang}` — a derived
     one with its own `derivation` and `rules` beside them, in this shape —,
     and its `combination` with `operator`, `n`, `connective`, `rationale`,
     the connective's `pages` and `link`, its parts under `of`, each a node,
     a sum's `points` beside them, one per part and in its order, as printed,
     and `disagrees_with` where the claim disagrees with a claim that is not
     another printing of the same rule (as zone 3 gives it);
     the view JSON carries the same two keys for every concept its statements
     hold, under `concepts`, and the concept's own JSON and page carry them
     too (§4). The
     words come from the card's words table; nothing is per concept.
  6. **Body text.** Three groups in order of their effect on the decision, not
     by relation name: `Grenzt ein` (`limits`), `Präzisiert` (`refines`),
     `Ergänzt` (`supplements`) — each passage its wording, then page and section
     linked into the source, and where the source says otherwise at another
     place, zone 3's line under it. A group shows its first three passages;
     the rest wait in a closed disclosure under them, `5 weitere Hinweise`, so
     that a long group does not push the citation off the card. The zone is named after what its passages do and
     where they stand: everything on the card is guideline text, and what sets
     these apart is that they stand beside the box, not in it, and each one
     bears on how the box is applied — `Ergänzt` without changing it. The
     heading does not promise the whole of the surrounding text: rationale,
     study reports and effect data never enter (`graph-representation.md`
     §5.1). Empty: `Der Begleittext schränkt diese Empfehlung nicht ein und
     ergänzt oder präzisiert sie nicht.` — a checked result, true once §5.1
     has been applied to the whole source; before that an empty zone would
     mean *not yet examined*.
  7. **Contradiction.** One entry per contesting claim: its own badge by zone
     2's rules, its wording, and its own citation with recommendation number
     and page. Heading singular or plural by count. Its existence is what the
     marker in zone 2 announces.
  8. **Citation.** Each source named once, by its title with its version and date
     on a line of their own under it, in the order of its
     first supporting claim; under it one entry per supporting claim from that
     source, in the guideline's order — by recommendation number, and a
     recommendation number that is not a number ("Definition 1") by the page it
     is printed on, after the numbered ones printed before it; the sentences of
     one box in the order the box prints them, by page and then by where the
     pool lists them, which is the order an extraction writes a box's
     sentences in (no claim records its line), never by id: recommendation
     number (`Empf. 2.1`; one that is not a number as printed, `Definition 1`),
     page, section, the verbatim quote as an excerpt — the quote is the search
     text that finds the passage, often a sentence's head cut where a line
     breaks it, so the card drops a word the line break cut with its hyphen
     and sets `…` where the sentence goes on, before or after; the quote copied
     and linked is never changed —, and two
     actions that do not look alike — `In der Leitlinie öffnen`, the primary
     one (the link into the cited page, §5), opening in a new tab and marked
     `↗`, so that following the citation keeps the reader's open groups,
     search, chapter and axis; and beside it `Suchtext kopieren`, a quiet text
     button (the quote to the clipboard, for viewers that cannot highlight). Then the review status, `Klinische Begutachtung:
     ausstehend` (the pool has no attestation yet). Where a recommendation
     comes from is as much part of the answer as whom it is for.
  9. **More.** A `<details>`, closed: the related statements over
     `specializes`, `complements`, `conflicts` and the steps over `follows`,
     each with its `transition` and `trigger` as stored, by their edge names
     (zone 5 names them for the reader), the statement's and its claims'
     ids, every slot as stored, the modelling source. The only zone where
     developer vocabulary — edge names, raw values, ids — is allowed.

  The zones are separated by space, not by rules: one rule remains, before
  zone 8, where the card turns from the answer to where the answer comes from.
  The headings are in sentence case, never in versals — a German compound
  keeps its word shape — and every zone keeps its heading, an empty one too.
  Every zone is a `<section>` with an accessible name (zones 1 and 2 by their
  own first line, the others by their heading), glyphs are `aria-hidden`, and
  every text carries its `lang`. At 390 × 844 px zones 1 to 3 of a typical
  statement are visible without scrolling. Nothing is authored: every value
  comes from claims, slots, edges and the source's outline, and the build adds
  only the words of its table.

  **The card, one structure.** The build assembles the card once per statement
  (`card` in the statement's JSON, §4); the template and the JSON render that
  one structure. Its keys are the five questions a physician brings to a
  recommendation, kept as a **semantic mapping that is not rendered** — the
  questions are no longer headings; an answering layer reads them from the
  JSON (`questions` on the card):

  | Key | The question it answers | Zone |
  |---|---|---|
  | `urteil` | Was soll ich tun, und wie verbindlich ist das? | 2 |
  | `wortlaut` | Was steht genau in der Leitlinie? | 3 |
  | `evidenz` | Wie gut ist das belegt? | 4 |
  | `geltung` | Gilt das für meine Patientin oder meinen Patienten? | 5 |
  | `leitlinientext` | Was ändert oder ergänzt der umgebende Leitlinientext? | 6 |
  | `widerspruch` | Gibt es eine gegenläufige Empfehlung? | 7 |
  | `beleg` | Wo steht es, und wie prüfe ich es nach? | 8 |

  Two zones of earlier designs are **removed**, not overwritten: "Andere
  Situationen, andere Antwort" — the related statements as a zone of their own
  (WP-0019) — is gone, its content under zone 9 and, for the reader, one row of zone 5 (`Verwandt`), not a zone; and the binding question,
  "How binding and how well supported is it?", is gone — its supporting
  claims' grade and consensus are the badges of zone 2, its contesting claims
  are zone 7. The entity page (§4) renders the same card.
- *concept*: the label and definition, the statements that use it and in which slot,
  and its codes (`codes_as`) once terminology imports exist; in a view with a
  scope tree, below them and apart, the statements that apply generally to it
  (`Allgemein geltende Empfehlungen`, above).
- *structural node*: its label, its branches or outcomes, and the statements it is
  about.

**Grades are shown, never composed.** A statement's effective grade is an open
question (`open-questions.md` → grade-derivation) leaning toward showing the
distribution. The page shows each claim's grade next to that claim and nothing on
the statement. When the question is settled, the page follows the schema.

**Language.** Content is rendered in its source language with the `lang` attribute
set; nothing is translated. The chrome of the graph (its questions, the switch)
and of the statement card (its headings, labels and buttons) is in the view's
source language too, from per-language tables in the build with no fallback: a
language the tables do not cover fails the build, naming the language and the
missing keys, so that no English word ever stands on a German card. The detail
sections of a concept, a claim and a source, and the entity page's link to its
JSON (§4), take their words from the same table in the entity's own language.
**The page's own chrome is the reader's, not the source's.** Every word a page adds
outside the graph and the card is German, whatever the view's source language —
what is seen and what is heard: visible text, `title`, `aria-label`, `placeholder`,
`alt` and the meta description. That is the legend; the controls; the search
counter and the chapter panel, which the script reads from the page; the sheet's
home — its kind line, its counts (a pair per count, as the index's), its links and
its hint; the index's words (§2); the line that says a source's version and date
wherever a page names the source (its words, and the month names that write its
date); the words of a statement's steps before and after on its card — zone 5's
rows `Davor` and `Danach`, the transitions and the triggers (card #294, Decision 3)
—, which stand among the card's source-language words as the version line stands
in its citation, each carrying the page language, and the link to its path view;
the path view's own — its kind line, the way back to the tree, the step's frame
(`Bedingung: …`) and heading, the transitions and triggers on its labels ("The path
view", below); the note beside every licence line that the
document is linked at its public URL and never served here (§5), the project's rule
said once and not part of the source's line; the preview strip, the footer, the
share image's description, and an entity page's description by its type. The
exceptions are what the index says about graph.med itself and the banner, which are
English (§2), the ids, the name graph.med and the repository's licence name. Every
page declares the page language (`<html lang>`), and a part in another language
carries its own. The words come from a table of the view layer — one file per
language under `tools/site/words/`, read by the build, handed to every page and
never published — and the build, the schema, the data and every identifier, key and
comment behind them stay English: only what the viewer reads is German. The hint
names the reader's gesture: CSS shows *antippen* by default, the page being read
on a phone first, and *anklicken* where a fine pointer can hover
(`(hover: hover) and (pointer: fine)`); no script reads the device and nothing is
remembered. The facet filter's entries are the facets' words in the view's source
language, like the switch's — the card's table, not the page's. A German and an
English site are a later phase; they will be a second table, not a second
template. Translation of content is a build-layer concern and can be added without
a data change (`graph-representation.md` §2).

### Where each part comes from

A statement's card, in the sheet and on its page, and a concept's or claim's section
mark each part by where it comes from, read from the provenance `meta.provenance` gives
(§4): a small tag beside the title or a zone's heading — *KI-erzeugt* for content the
project generated (`modelling`; *KI-erzeugt, mit Fundstelle* for `sourced`), *Zitat
aus der Quelle* for a claim's sentence, quoted from its source (`anchored`): the
statement's title and zone 5 (generated), zones 3, 6, 7 and 8 (quoted),
what two printings differ in under a disagreement (generated), and why two
statements are related, under each entry of zone 5's `Verwandt` row, and what
triggers a step, under each entry of its rows `Davor` and `Danach` and in a step's
section of the path view (generated, with the date of the reading); a concept's
label, and its list of statements where they all share one kind. The words are the
card's table (`origin.*`, §3 "Language"). A tag says where a part comes from, never
that it was checked.

### The path view

A statement that stands in a sequence (`graph-representation.md` §5 `follows`) has a
page of its own that draws the whole chain it stands in,
`graph.med/<view-id>/sequence/<statement>/` — `<statement>` its id without
`statements/` —, under each view it belongs to, for every statement of the view on a
`follows` edge. Its card opens it (zone 5, `Pfad anzeigen`). It is **not an entry of
the grouping switch**, whose rule above stays as it is: a chain groups nothing of a
view — most statements stand in none — but is what one recommendation reaches by its
steps, so it is opened from a statement and from nowhere else (card #298, the
discussion's Option B).

**A page, not an overlay of the view page.** The view page is one decision tree, and
everything around its canvas is fitted to that tree — the switch, the chapters, the
search and its steps, the back button, the session tools (§8); a second graph in the
same canvas would need a meaning in each of them or would have to switch them off. A
page of its own leaves the view page as it is, loads the chain alone, and is a link a
reader shares and a program gives. The chain has no id in the pool — it is read off
the edges and owns no data —, so the page is addressed by the statement it is opened
from, whose id stays while the chain grows or splits; every member's page draws the
same chain. One code path reads it, `Pool.chain_of`, the walk the statement JSON's
`sequence.chain` gives (§4), and nothing in it is named after a guideline.

**What it draws.** The chain whole and uncut: every statement the opened one reaches
along `follows` edges, either way and through any number of them, and every such
edge among them — a line, a branch, a join, a star (the sepsis guideline's 4.6 and
8.1 around 4.5), a cycle —, top to bottom by the view page's renderer (Cytoscape.js
with dagre), the earlier statement above the later. Each statement is a **box** as
its box in the view's tree reads: coloured by its direction, its label the glyph,
the grade as printed, a basis beside it, the verb where the grade does not carry it
and the short label — one rule for both (`box_label` in the build) —, a dashed red
border where it is contested; so every step shows how binding it is, and a chain of
open recommendations reads as what the guideline says, never as a protocol. Each
`follows` edge is a **step**: a line from the earlier box to the step's label, an
arrow from the label to the later box. The label says, one to a line, the transition
read from the earlier statement (`ersetzt durch`, `erweitert um`, `gefolgt von`,
`gleichzeitig mit`, the words of zone 5's `Danach` row), the trigger (`Anlass: Ziel
nicht erreicht`, …) and the later statement's condition, `Bedingung: …`, each further
condition on a line of its own opened by the conjunction, as the view page's
condition answer writes it — on the step, never a node of its own. The trigger's
wording as printed is quoted by the edge's rationale: a tap on a step opens its
section in the sheet — the earlier box, the label's lines, the later box, and under
`Warum dieser Schritt` the rationale, tagged *KI-erzeugt* with the date of the
reading. Nothing is computed beyond the edges and the slots: no threshold (the
condition's rule is on its card), nothing inherited along the chain. The label is a
node of the layout, so that no label runs into a box or another label; the lines run
orthogonally — down from their upper end, across in the gap between two ranks, down
into their lower end —, so that none crosses a box or a label, and the lines of one
gap run across at heights of their own. **A cycle keeps its back edge**: a step whose
trigger is a re-evaluation or a target reached — the triggers a cycle may run
through (`graph-representation.md` §5) — and which closes a cycle is laid out upward, its arrow at its upper
end; a cycle without such a step (the source giving an order both ways, the same §5) is
broken by the layout itself, and the edge it turns bows beside the column.

**Several steps into one box** — a statement that follows several, as the sepsis
guideline's 8.1 follows 4.5 and 4.1 — are several labels and several arrows, each
reaching the box at a point of its own with an arrowhead of its own. Nothing joins
them: no node stands between them and no word is written across them, so the drawing
says neither that the earlier statements' outcomes call for the step together nor
that any one of them does, which the pool does not say (`open-questions.md` →
follows-several-earlier). The later statement's condition stands whole on each of its
steps; its conjunction joins that statement's conditions, which hold at once
(`graph-representation.md` §3.2), never two steps.

**Opened from a statement, read on a phone.** The statement it was opened from wears
an outline the whole time and is selected at load, its card in the sheet; the same
chain opened from another member outlines that one. A tap on a box opens its card, as
on the view page; a tap on a step its section; a tap on the canvas the sheet's home; a
link in a card to another member of the chain selects it in place. The hash is the
selected statement's id. The page is a view page's graph and sheet, read on a phone
first: the fit never zooms the chain out below a size a phone reads — a chain wider
than that is shown around the selected box and panned, the fit button showing it
whole —, and the card waits in the peek strip at the bottom edge. Over the graph a
link leads back to the view's tree at the statement it was opened from
(`Entscheidungsbaum`). The legend keys what the page draws: its directions and grades,
a contested border, the step, and the box it was opened from. The sheet's home says
what the page shows and names every step in words — the earlier box, the label's
lines, the later box —, so that the page reads without the script and to a screen
reader; without the script it is the page. Its words are the page chrome's (`path`,
"Language" above); the boxes', the conditions' and the rationales' are the data's, in
their language.

---

## 4. Entity pages and JSON

Every entity gets a page whose content is the same as its sheet section, so that
`graph.med/statements/<id>` is a working link from anywhere, and a JSON document
next to it that carries the entity as stored plus its incoming and outgoing edges
resolved to ids. The JSON is what a program uses; the page is what a person lands
on. Both are generated; neither is authored. A derived concept's page shows its
rule under its label — every printing, where the source prints it differently —
as zone 5 of the card does (§3), and its JSON carries `derivation` and `rules`.
A claim's page shows, under its quote, the claims where the source says
otherwise, as zone 3 does. An axis's page is where a grouping shows as data, since
an axis lies over the pool rather than in it (`graph-representation.md` §4.1): its
carrier, its rule, its own question where it declares one, its status and date per
view, and its placements grouped by where they place — a dimension's statements
under each of its values in the declared order, a hierarchy's concepts under each
parent from the top of the tree down, each with the kind of edge it hangs by
("Sonderfall" for `broader`, "im Geltungsbereich" for `in_scope_of`, "ohne Kante"
where a proposal names a parent the pool holds no edge to), and a placement's
rationale where it has one. The words come from the build's per-language table.

**What a program walks and cites by.** Beside what the entity stores and its
`edges` (and a statement's `card`, a derived concept's `derivation` and `rules`),
every entity JSON carries one key more, `meta`, a statement one more, `sequence`,
and a concept two more, `statements` and `appears_in`. They are added, never in place of a stored key: a
stored `url`, `license`, `provenance`, `rule` or `views` keeps its meaning, which
is why the metadata sits under a key of its own. This section is their contract.

- `meta.url`, `meta.json` — the absolute URLs of the entity's page and JSON:
  origin, base path and id, then `/` or `.json`. A preview build gives its
  preview's URLs (§6); no URL carries a version.
- `meta.views` — every view the entity belongs to by the view's filter (§2), each
  `{id, url, json}`, a view's URLs being `<view-id>/` and `<view-id>.json` at the
  root, never under `views/`; empty for an entity in no view. An axis, which no
  filter selects, lists the views its own `views` names, each with its `status`
  and `since`.
- `meta.sources` — every source whose words the JSON may carry, each
  `{id, json, license}`, the licence line as recorded on the source (its words,
  not the publisher's): a source named by id, by a reference's `at`, or through a
  claim whose sentence or quote it carries.
- `meta.repository_license` — the repository's licence as the footer and README
  name it; it says nothing about what it covers.
- `meta.review` — `pending`, the build's one token until an attestation is read
  (§3, zone 8); never "validated" or "verified".
- `meta.provenance` — where the content comes from, by type, its `kind` first: a
  claim `anchored`, with its `at` and the link into the source (§5); a statement
  its wording's own `source` (`modelling` by design, `graph-representation.md`
  §6.3), with the claims behind it counted per source in `supported_by` and
  `contested_by`; a concept its `source` as stored (`modelling` or `sourced`); a
  source the `document`, with `url` and `content_hash`; an axis `modelling`, with
  `proposed_by`. An edge's own provenance is in `edges`.
- `meta.disclaimer` — the banner's text (§2), the same in every JSON.
- `meta.commit`, `meta.schema_version` — the build's commit and the schema's
  version. Nothing in the JSON carries a build date, so one commit and one set of
  flags give the same bytes.
- `sequence` (a statement) — where it stands along `follows`
  (`graph-representation.md` §5), so that a program reads the chain without the
  page, from this one file:
  - `before`, the statements it follows (the edges that run from it), and `after`,
    those that follow it (the edges that run to it) — its direct neighbours. Each is
    a list in the guideline's order — by the neighbour's first recommendation
    number, then its id —, one entry per edge: `id`; `url` and `json`, the
    neighbour's page and JSON as absolute URLs, as `meta.url` and `meta.json` give
    them; `no`, its first recommendation number as printed, the number its box
    carries in the tree (null where no claim carries one); `pages`, the distinct
    pages of its supporting claims, as printed and in its card's citation order
    (zone 8); `transition` and `trigger`, as the edge stores them (the schema's
    English keys, never the page's words); and `discriminator`, only where the edge
    has one.
  - `chain`, the whole sequence it belongs to: every statement connected to it by
    `follows` edges, in either direction and through any number of them, and every
    `follows` edge among them — branches, joins and a cycle through a re-evaluation
    included, never cut by the build (a reader caps what it shows). `nodes`, each
    `{id, no, pages}` as above, by first recommendation number, then id, the
    statement itself among them; `edges`, each `{from, to, transition, trigger}`,
    `from` the later statement and `to` the earlier as the edge runs, with
    `discriminator` where the edge has one, ordered by the nodes' order of their
    `from`, then their `to`. Ids and keys only: a label, a direction or a grade is
    the node's own JSON's, or the search file's.

  The key is on every statement; for one on no such edge both lists and the
  chain's `nodes` and `edges` are empty — it stands in no chain. It carries nothing
  the edges do not hold: no label, no rationale (both are in `edges` and in the
  card's `mehr.follows`, §3 zone 5), no threshold, nothing inherited. Several
  entries of one list, or several edges into one node of the chain, say neither
  that they hold together nor that any one of them suffices: the pool does not say
  which. The chain is the build's one walk of it (`Pool.chain_of` in
  `tools/build.py`).
- `statements` (a concept) — keyed by each view it belongs to: `held_by`, the
  view's statements that hold the concept, each `{id, slot}`; and, in a view with
  a scope tree, `own` and `general` as that view JSON's `scope.concepts` gives
  them (empty where it lists nothing). From a concept's JSON alone a program
  reaches its recommendations.
- `appears_in` (a concept) — keyed by view, then by grouping (its `axis` as the
  view JSON's `groupings` give it: an axis id, `section` for the chapters, the
  empty string for patient groups unfolded without an axis): the ids of the
  nodes of that grouping that name the concept, in the tree's order, each once.
  A node names the entity of its `ref` and every concept an edge leading to it
  names in `refs` — the page's own rule for where an entity appears (§3), so a
  condition, which has no node of its own, appears at the statements its answers
  lead to, and a group reached by two answers is one node. A grouping, or a view,
  where the concept appears nowhere is left out. Only node ids: the tree's
  structure is in the view's groupings, and nothing assumes which grouping comes
  first or what it groups by.

The view JSON, the page's inline data and every page stay as they are.

**Files for programs.** Beside the pages and the JSON above, the build writes files a
program reads without the view JSON, which is mostly card HTML and whose nodes carry
claim sentences and quotes for the page's search (§8, Layer 0). Each is built from the
views and their groupings by one code path, relies only on the tree shape every
grouping shares (node types, edge kinds, `ref`, `refs`), carries no build date, and
holds no claim sentence, no quote, no card and no rule. Their URLs are absolute, a
preview's its own (§6).

- `index.json`, at the root: the build's `commit`, the `schema` (`version`, `url`),
  `repository_license`, `disclaimer` (the banner's text, §2), `contract` (this section, where the keys are described),
  `llms_txt`, and `views`, one entry per view: `id`, `title`, `lang`; `url` (the page),
  `json` (the view JSON), `lean` (the per-view file), `search` (the search file);
  `groupings`, in the order of the page's switch; `root`, the root of its scope tree
  as `{id, json}` (null for a view that declares none); `holds`, as the index page
  counts it — `statement`, `claim`, and `group`, the number of distinct concepts at the
  junctions of the view's first grouping, whatever that grouping groups by; and
  `sources`, each with `id`, `title`, `lang`, `url` and `license` as recorded, its
  register number where recorded (`awmf_register`), and its `page` and `json` here.
- A **grouping** in the index and in the per-view file: `axis` (its id as the view
  JSON gives it), `label`, `short_label` (the axis's, null for the chapters and for a
  grouping without an axis), `lang`, `kind`, `default` (true for the first, the one
  the page opens with), `question` (the label and `lang` of the question node the
  root's `flow` edge leads to) and `tree` (its tree file's URL). `kind` is set by the
  code path that builds the grouping, never read from an axis's id: an axis's
  `carrier` (`hierarchy`, `dimension`), `outline` for the chapters, and `hierarchy`
  for patient groups without an axis (`axis` ""), which the hierarchy code draws
  with nothing to fold, or folded by the scope tree. *Proposed.*
- A **tree file**, one per grouping of every view, at `<view-id>/trees/<axis>.json`:
  `trees/axes/<id>.json` for an axis, `trees/section.json` for the chapters,
  `trees/plain.json` for a grouping without an axis. No reader derives the path; the
  index gives it. It holds `view`, `commit`, the grouping's `axis`, `label`,
  `short_label`, `kind` and `lang`, and its `nodes` and `edges` as the view JSON has
  them minus content: nodes keep `id`, `ref`, `type`, `label`, `lang`, `direction`,
  `grade`, `verb`, `no`, `sections`, `facets`, `group`, `general`, `against`,
  `contested`; edges keep `from`, `to`, `kind`, `label`, `refs`. Box and answer
  labels, grades and directions stay — the site's modelling words and the source's
  grades —, and so do the chapter tree's labels, the sources' chapter titles. A
  junction's `general` stays the ids of the statements that apply generally to its
  concept. *Proposed.*
- The **per-view file**, `<view-id>/view.json`: the view JSON minus content and minus
  its groupings, which it lists by their tree files (as in the index), so that
  nothing is published twice — `id`, `title`, `sources`, `commit`, `outline`,
  `facets`, `legend`, `scope` where the view has a scope tree, `groupings`, and the
  view's `meta` from the same code path as an entity's (its `url` and `json` the
  view's page and view JSON, its `provenance` `modelling`: a view is a filter its
  authors write). It leaves out `html`, `concepts`, node `text` and `full`, edge
  `text`. Together with the tree files it is the view JSON minus content. *Proposed*,
  against keeping every grouping inline in one file.
- The **search file**, `<view-id>/search.json`: `view`, `commit` and `entries`, one
  per statement of the view and one per concept that its statements hold in a slot,
  that a node or answer of any grouping names, or that is its scope root. Each has
  `id`, `kind` (`statement`, `concept`) and `lang`. A statement has the words its box
  shows — `short_label`, else `label` —, `slots` (`{slot: [concept ids]}`, the slots
  its card shows, a dimension axis's included) and `direction`, `grade` and `verb` as
  its box carries them in the tree. A concept has `label`, `short_label` where it has
  one, `slots` (the slots it holds in the view's statements) and, in a view with a
  scope tree, `general`, its entries exactly as `scope.concepts` gives them
  (`{id, anchor, via, condition}`), so that a junction's generally applying
  recommendations are read with their `via` and condition from the tree file and this
  file alone. *Proposed*, against carrying the entries on each junction. Where a
  concept stands in a tree is not here: the tree files and `appears_in` give it.
- `llms.txt`, at the root: in English, what these files hold — the index and each
  view with its URLs and groupings, the default marked; the id rule and its
  exceptions; the tree shape; the page link that opens a position
  (`<view-id>/?by=<axis>#<id>[,<id>]`, `?by=` left out for the first grouping); the
  per-view and search files; the entity JSON's keys, the card's keys and the
  direction tokens as the build has them; each source's licence line and the review
  status; and a link to this section. It describes and instructs nothing.

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
viewer that cannot highlight, the reader pastes it into the document's find. Every
link into a source opens in a tab of its own — the citation's, a body-text passage's,
a contesting claim's, a rule's — so that the page keeps its open groups, search,
chapter and axis. The source's license line, as
recorded on the source entity — the source's own terms —, is shown on its page, on
the index and on every view drawn from it, and beside it, in the page language, the
page chrome's note that the document is linked at its public URL and never served
here (§3 "Language"). The files for programs carry the line as recorded (§4).

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
change before proposing it — the same habit as the validator. Beside what it
writes, it prints one line per view: the `follows` edges between two of the view's
statements and how many of them have `trigger: other`
(`views/<id>: 15 follows edge(s), 4 with trigger: other`), the count each linking
pass reports its measure by (card #294, Decision 10 (d)) — a count, never a
failure.

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

## 8. The pool in programs and assistants

> **Status: Layer 0 built; Layer 1's tools and its hosted endpoint built, the
> endpoint deployed at `https://mcp.graph.med/mcp` since 2026-10-06; Layer 2
> designed, not built.** Each layer's status changes here when the card
> that builds it lands.
>
> | Layer | Status | Built by |
> |---|---|---|
> | 0 — the machine-readable site | built: index, `llms.txt`, tree files, per-view file, search file (§2, §4); entity JSON with `meta`, a concept's `statements` and `appears_in` (§4) | #270 (with #269) |
> | 1 — the read-only server: its six tools, a server factory in `mcp/` | built: tools, description file (`mcp/src/descriptions.js`), quote gate, paging, the check (`CLAUDE.md` "Checks"); a recommendation's steps in get entity | #272; #299 |
> | 1 — the read-only server, hosted | deployed at `https://mcp.graph.med/mcp` since 2026-10-06: the Worker (`mcp/src/worker.js`, `mcp/wrangler.toml`), checked through Workers' local runtime (`CLAUDE.md` "Checks"); the one way the server is reached (2026-09-28). `.github/workflows/mcp.yml` deploys it after each Pages deploy from `main` once the server's check passes against the site just published (ADR-0008); every run from 2026-10-12 to 2026-10-22 stopped at that check, the first two on the quote gate #415 fixes, so until a run passes the endpoint serves the server deployed on 2026-10-06. Transient errors from Pages are retried, and the check before a deploy is the fixture and a short walk of the site (#317) | #279, #317 |
> | 2 — the inline view | designed, not built | #278 (with #276, #277) |
> | the session tools in the view page (below) | built: the page function and WebMCP registration; the relay that would take them outside the browser is not (#412, after #411) | #408 (initiative `co-navigation`, #407) |
>
> This section is the design; the keys and URLs it relies on are §2's and §4's, the
> server's runtime, toolchain and home ADR-0007's (#271), the choice of host
> ADR-0008's (#279). What is marked *proposed* waits for the maintainer's
> confirmation; the rest is agreed design. The facts it gives about other parties'
> products change; each carries its source and the date it was read.

This section designs how the pool reaches Claude and other programs: a machine
reading the site, a server a chat assistant calls, and a view drawn inside the
conversation. It adds no knowledge to the pool and changes no page of §3.

**The aim.** The maintainer's plan (2026-09-27) states it:

> Claude should be able to find, traverse and visually highlight graph.med pathways
> inline in a chat, for every graph the site publishes. The vehicle is an **MCP
> App**: a read-only MCP server whose tools can also render an interactive view
> inside the conversation. Writing to the graph, expert feedback, and UI support in
> Claude Code are out of scope.
>
> **The MVP adds no infrastructure.** It runs entirely on what exists: GitHub Pages
> serves the data and the view, and GitHub Releases ship the server package. The
> server runs locally inside Claude Desktop. Web and mobile need a hosted endpoint,
> so they come after the MVP.

**Where this departs from the plan.** On 2026-09-28 the maintainer decided:
"let's roll back the desktop mcp server fully and only work with the web
version". There is no Desktop extension, no server on the user's machine and no
release of one: the hosted endpoint on Cloudflare Workers ("Where the server
runs") is the one Layer 1 and part of the MVP, and the inline view is checked in
claude.ai web. The MVP therefore adds infrastructure — a Cloudflare account,
graph.med's DNS in a Cloudflare zone, the Worker and its deploy — against the
plan's "The MVP adds no infrastructure", at the maintainer's word of that day.
The endpoint is open to every MCP client (2026-09-28): programs that run on the
user's machine, Claude Code among them, add it as a remote server, and hosted
assistants of any vendor reach it as Claude does.

A **pathway**, here, is a path through one of a view's derived trees — its
groupings (below), with its scope tree where the view declares one. It is never a
`pathways/` entity: that namespace is reserved for authored pathways, the build
refuses `pathway` views, and no `data/pathways/` exists (open question
`decision-graph-derivation`). *Proposed.*

**Six principles**, from the plan:

> The guarantees live in the server and the build, not in instructions to the model.
>
> 1. **Static first.** The Pages build is the single source; everything else only
>    reads its output.
> 2. **Read-only and stateless.** No credentials, no user data, nothing written.
> 3. **URLs are the interface.** Tools take and return graph.med entity URLs, so
>    every claim can be checked.
> 4. **Metadata travels with the data.** Licence, review status and provenance come
>    with every result.
> 5. **Text first.** Every tool result makes sense without the view; the view is an
>    addition.
> 6. **Graph-agnostic.** Nothing names a specific graph. The server and the view work
>    from the schema and the build's index, so a newly published graph is available
>    without code changes.

The first sentence is the one the repository holds for its own agent
(`.claude/memory/environment/security-enforced-outside-model.md`): whatever must
hold is enforced by what the build publishes and what the server returns, never by
a sentence a model is asked to obey.

**Terms.** Everything below relies on four, which the build already has (§3, "The
axis is the reader's choice"):

- A **grouping** is one tree the build draws for a view. The view's JSON carries
  them as `groupings`, each `{axis, label, lang, nodes, edges}`, one for each
  grouping the page's switch offers. The page opens with the first.
- An **axis** is an `axes/<id>` entity the view lists in `group_by`
  (`graph-representation.md` §4.1): `carrier: hierarchy` places concepts under
  concepts by an existing `broader` or `in_scope_of` edge, `carrier: dimension`
  places statements under values.
- The **chapter outline** is the grouping with `axis: "section"`: the source's
  chapters, provenance, never nodes of the pool
  (`.claude/memory/design/document-structure-is-provenance.md`).
- The **tree shape** is the same for every grouping: nodes of type `root`,
  `question`, `junction`, `statement` and `aim`; edges of kind `flow`, `answer`
  (with `label` and `refs`), `relation` and `aim`. A statement or aim node takes the
  id of the entity it shows, and a statement under several answers is one node. A
  junction has an id of its own and names its concept, if any, in `ref` (`j:<concept>`
  in a hierarchy; `j:<value>` or `j:<value>:<concept>` under a dimension's values;
  `j:section:<source>:<n>`, with `:<concept>` where one applies, under the chapter
  outline), so one concept can be a junction under several values or chapters. A
  question node (`q:…`) and a chapter's junction name no entity.

Today's data, as an example: both views open with a hierarchy over their patient
groups, labelled "Population", because both declare `anchor_slot: population` and a
`scope_root`; the chapter outline follows, and one view adds a dimension (the
perioperative phase). **"Patient group" is today's data** — the label of today's
first grouping — and nothing in this section relies on it. The tools, the files and
the view below rely only on the tree shape, so a graph organised as a decision path,
for example a diagnostic one (a question, branches on its findings, an outcome),
works unchanged if the build publishes it in that shape.

**Positions the site already opens.** A deep link carries `#<entity id>`, several ids
joined by a comma, and `?by=<grouping>` before it — `section` for the chapter outline,
else the axis id, left out for the first grouping, an unknown value falling back to
the first (§3). The page unfolds to, selects and fits every element whose `refs` hold
one of the ids. The ids after `#` are entity ids, so a node that names no entity — a
question, a chapter's junction — has no deep link of its own.

### Where the plan meets today's site

The plan was written against a site it describes in part. What the repository holds,
as checked on 2026-09-27:

- **No layout JSON.** The build computes no positions (§3, "The data carries no
  positions"); dagre lays the tree out in the browser, in 54–102 ms for a whole tree
  of today's views. The view JSON (today about 2 MB per view) is mostly card HTML,
  and each statement node's `text` carries every supporting claim's sentence and
  quote. Layer 0 therefore adds lean files instead (below).
- **Quotes are not gated on the site.** It publishes verbatim text with no gate:
  every claim's `label` (the full sentence, today up to 657 characters), its
  `source.quote`, the card's `wortlaut`, `leitlinientext` and `beleg` (§3, "The
  card"), and the view JSON's rendered HTML. This includes a source whose licence
  line reads "written permission … required for any reproduction" (today, the first
  source, POMGAT).
- **Every statement and edge is `modelling`.** That is by design
  (`graph-representation.md` §6.3; today 188 statements and 613 edges). A
  statement's backing is its `supports` edges to claims, which are sourced.
- **The licence line is prose.** `source.license` is free text, the project's own
  summary, carrying no provenance (`schema/schema.yaml`); no policy per graph can be
  read from it.
- **The site frames its content for a patient.** `README.md` asks "for this patient,
  in this situation"; every statement JSON's `card.questions` includes "Gilt das für
  meine Patientin oder meinen Patienten?" (§3, "The card"). The plan's guardrail is
  "No individual advice".
- **The whole graph is never drawn at once.** The view page is "folded by default …
  not an all-at-once drawing" (`.claude/memory/design/view-page-is-a-decision-tree.md`).
- **Views float.** No entity JSON carries a commit; a cut is what gets cited, and
  cuts wait for "the first citation of a view" (§7; open question `cut-publication`).
- **The graphs share nothing.** No entity is a member of both views, and no edge
  joins their members. One concept is an evidence outcome of both sources' claims (a
  property, not an edge), and edges from concepts in no view point into it (today,
  `concepts/mortalitaet`). The index combines nothing (§2).

### The three layers

> There are three layers, and only the MCP server is a new running component.
> Layer 0 is an extra output of the existing Pages build. Layer 2 is a UI bundle
> that the MCP server serves.

The data flow, arrows in the direction data moves:

```
data/ ──build──► graph.med (GitHub Pages)
                   pages, entity JSON, view JSON                  (today, §2–§4)
                   Layer 0: index, llms.txt, search file per graph,
                            tree file per grouping                (built)
                     │                         │                       │
                     │ GET (JSON)              │ GET (tree file)       │ GET
                     ▼                         │                       ▼
   Layer 1: read-only MCP server               │          programs that fetch pages
   (a hosted endpoint on                       │          (Claude Code, any model
    Cloudflare Workers)                        │           that reads the web):
                     │ tool results:           │           text only
                     │ text + metadata         │
                     ▼                         ▼
   an MCP host (Claude, …) ──tool input──► Layer 2: the view,
        │                                  a sandboxed iframe in the conversation
        ▼
      the model
```

The plan's "The iframe loads layout JSON directly from graph.med, while graph
content reaches it only through tool results" reads, on this site: the view loads
the tree file of the grouping it draws, which holds no claim sentence and no quote,
and lays it out itself; what it shows and marks comes from the tool input. "Claude
Code and any model that can fetch web pages read Layer 0 directly and get text
only."

**Layer 0: the machine-readable site.** The plan: "The build emits a JSON twin for
every entity page, plus a small index and an `llms.txt`. At this point any model
that can fetch pages, including Claude Code, can already walk the graph." Besides the
entity JSON (§4), which exists, and the index and `llms.txt`:

- **One tree file per grouping.** Each grouping of each view, the chapter outline
  too, is a small file: its `axis`, label, short label, kind and `lang`, and its
  nodes and edges as the view JSON has them, minus content — no node `text`, no
  `full`, no card HTML, no claim sentence, no quote. The index lists each view's
  groupings (id, label, kind, the question its root asks, the file's URL) and marks
  the first as the default.
- **A concept's JSON says where the concept appears**: per view and grouping, the
  node ids where it is a junction or is named, so that a program can enter any tree
  from a concept. Its `statements`, per view and slot, stay.
- **A search file per graph**: ids, labels, short labels, `lang`, kind, slot roles,
  and each statement's direction, grade and verb as its box shows them — modelling
  fields and the source's own words, no claim sentence and no quote. Tree membership
  comes from the tree files and the concept JSON, not from the search file.

The paths and keys are §2's and §4's, written by the cards that build them (#269,
#270); the path `<view-id>/trees/<axis-slug>.json` and the key `appears_in` are their
proposals, and so is whether the lean view JSON is split into the tree files plus a
small file per view, so that nothing is published twice. That direction, grade and
verb sit in the search file, rather than on the entries of a concept's `statements`,
is a reading #270's pull request asks the maintainer to confirm.

**Layer 1: the read-only server.** The plan: "A small stateless server reads Layer 0
and offers a handful of tools … It adds no knowledge of its own." It navigates a
graph's groupings. Its tools, by role — their names are #272's, and none names an
axis, a slot or a grouping:

- **List graphs**, from the index.
- **List a graph's groupings**: each grouping's id (`axis`), label, short label,
  kind (`hierarchy`, `dimension`, `outline`, and whatever the build publishes
  later), the question its root asks (as the tree's first question node states it),
  and which grouping the graph opens with (its first). All of it from Layer 0.
- **Get tree node**, for a graph, a grouping and a node (the root by default): the
  question asked there; its answers (children) with their labels and `refs`; its
  parent; the recommendations under it, each with direction, grade, verb and URL —
  in a grouping over a scope tree also those that apply generally, with `via` and
  condition (§3) —; and their aims. An optional small depth returns a subtree in one
  result, so a deep path needs few calls. **Where a node stands** (#409): every node
  carries its depth, how many answers lie between the root and it; every answer,
  recommendation and parent link carries its place, counted from 1 in the tree file's
  order among the siblings of its kind (a question's answers, a node's
  recommendations, a node's questions, a recommendation's aims), so "the third
  recommendation against under this node" is read off one result. The places are the
  build's order; the page's drawing (dagre) follows it in most parents, not all.
  Measured on 2026-10-18, sibling lists of two or more, drawn order against the tree
  file: with each group of the first grouping opened alone, as a tap opens it, 289 of
  289 the same; with everything open, 13 of 185 differ (none of 23 in POMGAT's first
  grouping, 1 of 34 and 3 of 34 in its other two; 1 of 19 and 5 of 36 in Sepsis's;
  none of 16 and 3 of 23 in Vorhofflimmern's). The server reads Layer 0 only and
  cannot know the drawn order, so the key the server and the page share is the
  entity id, never the place; a place on screen ("the third one I see") is the
  page's to give, counted as drawn (#408).
- **Get entity**: a recommendation — its wording, marked `modelling`; grade, verb,
  consensus and direction; the claims behind it by URL and page, with no verbatim
  text (no claim sentence, no quote), each with its evidence rows; its `specializes`
  and `complements` relations; and its **steps** (#299), read from its JSON's
  `sequence` (§4) — or a concept — the
  recommendations that hold it, per graph and slot, and where it appears in each
  grouping of each graph — or a claim — its kind, page, section, grade, verb,
  consensus and direction, its evidence rows, and the claims where its source says
  otherwise, by URL. A condition is a concept seen from its slot, so no tool of
  its own returns it. **Evidence rows** (#330): how certain the evidence is, as the
  claim's entity JSON gives it (`evidence`, memory `claim-evidence-per-outcome`) — one
  entry per printed row, in its order, with the outcome it rates (the concept's id and
  label, read as a slot's label is read, in the full form also its URL) or the row's
  `key` as printed, its `value` (null where the row prints none), its `note` where it
  has one, and its `system` by slug and by `system_name`, the name the claim's source
  declares for it (`rating_systems`), never made from the slug; an empty list where
  the claim records none. A row carries rating words, as a grade does, and no quote.
  The values are the source's own, never mapped between systems and never reduced to
  one: a recommendation's rows stay per claim, in `claims`, and nothing is added at
  its top level (§3, "Grades are shown, never composed"). Tree nodes and search hits
  carry none, since a summary of a recommendation's evidence would compose one.

  The steps are the recommendations before and after it along `follows`
  (`graph-representation.md` §5), one entry per edge in the guideline's order, and
  the whole chain they form. Each recommendation is named as tree nodes name it —
  label, direction, grade and verb as its box shows them, URL, deep link — with its
  recommendation number and pages; each step carries its `transition` and `trigger`
  as stored and in the server's words (`mcp/src/descriptions.js`), `concurrent`
  worded as running at the same time with no order in time given. The chain is its
  nodes, each with its distance from this recommendation in steps, and its edges,
  later → earlier, with the words of their keys once; it is cut to the 25 nodes
  nearest to this one, the count it was cut from and the cut stated, and carries a
  deep link selecting it. The words are data, as the guardrails below say: they
  state what a key means, a grade on every node, and that several steps into one
  recommendation mean neither that their outcomes call for it together nor that any
  one does (open question `follows-several-earlier`). A step carries no threshold —
  one the trigger prints stands on the rule of the later recommendation's condition
  — and nothing compares a value with one. It carries no rationale either: the
  rationale quotes the trigger's wording and carries source text, so it stays on the
  page until the maintainer decides where the server may return it (open question
  `step-wording-gate`). Every node is a recommendation, never a step of the body
  text (`graph-representation.md` §5), so none is marked as having no
  recommendation of its own; one without a recommendation number shows `no: null`.
- **Search**, over a graph's search file, within one graph, or across graphs with
  the hits grouped per graph, each group ranked on its own and never merged; it
  returns ids, labels, URLs and the metadata, never a quote. Beside the words, or
  instead of them, it filters (#409) by kind, direction, grade and verb, as results
  give them, and by a subtree: the entities at and below one node of a grouping, in
  depth-first order, each hit with the depth of the node it stands at.
- **Provenance**, the only tool that returns verbatim source text: each claim's
  sentence whole, as the site shows it, and the quotes that anchor it, capped (the
  guardrails, below).

**Two forms** (#409). Get tree node, get entity and search answer **compact** by
default, and in full on request (`detail: "full"`). The compact form keeps every id,
label, entity URL and deep link of an item, its direction, grade and verb, its place
and depth, and the whole metadata; it leaves out what the full form repeats — a
concept named inside another item gives only its id and short label, a language
equal to the graph's, empty lists of aims and conditions, an answer's concepts where
they are the node it leads to, a claim's section, a search hit's slots. A compact
result is kept under 24,000 characters, a full one under 45,000, each by paging.
Where the levels a get tree node depth asks for do not fit under the cap even at the
smallest page (eight items a list), the depth is lowered, and the result says so:
`depth_reduced_to`, `depth_reduced_reason` (`size_cap`, the one reason) and
`size_cap`, the form's cap in characters (#317) — on the site of 2026-10-22, depth 1
at the sepsis root returns depth 0 for that reason, in either form.
Measured on the build of 2026-10-18 (characters, full → compact): the sepsis root
8,887 → 6,549; *septischer Schock* 24,244 → 18,315; a concept's card 26,211 →
21,175; a recommendation 3,643 → 3,275; a search 5,854 → 4,744. Most of what remains
in a large node is its list of recommendations that apply generally; a question
narrowed by the filters is smaller still (the recommendations against under the
sepsis root group, five at a time: 3,845).

No tool follows edges generically; this replaces the plan's "follow edges" and "get a
patient group's pathway". **Addressing:** a node that names an entity is addressed by
that entity's id, and its URL is the entity's (`concepts/<id>.json`); any other node
by its id within its grouping's tree file. There is no new URL namespace and no role
URL such as `patient-groups/<id>`: one concept can fill different slots — the
population of one recommendation, the condition of another — and the URL is the
identity (`.claude/memory/design/pool-and-views.md`). **Cost:** get tree node reads
the grouping's tree file and the graph's search file — one or two static GET requests
whatever the depth —, a search over a subtree also the grouping's tree file, and get
entity reads the entity's JSON, the graph's search file and, for a recommendation, the
JSONs of its claims — its steps and its whole chain come from its own JSON and the
search file, no other recommendation's JSON —; where a claim has evidence rows, also
its source's JSON, which declares each system's name, and, for a claim read on its
own, the JSON of each recommendation it supports, whose card names its rows'
outcomes (an outcome no card names is read from the concept's JSON); parsed files stay in
memory between calls. **A transient error is retried** (#317): a GET that fails with
a 5xx or a network error — GitHub Pages answers a 503 now and then, and one failed
the first automatic deploy on 2026-10-06 after 3,169 of its check's 3,170 calls had
passed — is made again after 200 ms and after another 600 ms, then reported; a 404
or any other answer is reported at once. A call retries only while it has made fewer
than 25 requests, half the 50 subrequests a Worker's request may make, so a call of at
most 25 requests stays within the limit however many of them fail; on the build of
2026-10-22 the most a call makes with nothing in memory is 7 (a search across the
three graphs). On today's build, `JSON.parse` of a whole lean view JSON takes
about 2.2–2.5 ms in Node 22.

**Layer 2: the inline view.** The plan: "One tool is bound to a UI resource, which
is the site's own graph renderer packaged for the chat. Claude decides what the view
shows, from a few nodes to a whole graph, and what to highlight. The tool only
advises, for example by suggesting a narrower scope when a view would get crowded.
Clicks in the view go back to Claude as context. CI builds the view's bundle and
publishes it on Pages with the data."

- **Vendor-neutral.** The view is an MCP App — the extension `io.modelcontextprotocol/ui`:
  a plain HTML page in a sandboxed iframe that talks to its host over `postMessage`.
  It uses only the standard's messages (`ui/initialize`, the tool-input and
  tool-result notifications, `ui/update-model-context`, `ui/open-link`) and no
  host-specific API (no `_meta.ui.domain`, no vendor SDK); it reads what to show from
  the tool input and never depends on `structuredContent`. So it speaks of *an MCP
  host*, not of Claude alone. Hosts that support the extension, as read on 2026-09-27
  (modelcontextprotocol.io/extensions/client-matrix): Claude (web), Claude Desktop,
  VS Code GitHub Copilot, Microsoft 365 Copilot, Goose, Postman, MCPJam, ChatGPT,
  Cursor, Archestra.AI and PostHog Code; not fast-agent or the MCP Inspector. "Since
  it's all standard web primitives, you can use any framework or none at all"; the
  `App` class of `@modelcontextprotocol/ext-apps` is "a convenience wrapper, not a
  requirement" (modelcontextprotocol.io/docs/extensions/apps, as read on 2026-09-27).
- **A position.** The view shows where in the graph the conversation is. A position
  is a graph, a **grouping** (by default the first), a focus (a node of that
  grouping, or entities it names) and highlights. **Path mode** draws the pruned tree
  from the grouping's root to the focus, with its questions and answers; **tree
  mode** draws the grouping folded as the site opens it, with the position marked.
  The view loads the tree file of the grouping it draws.
- **Settled** (the plan): "Claude decides per call whether the view shows one patient
  group at a time or the whole graph; the tool only advises." *Proposed* reading, in
  any grouping: "a few nodes" (the plan's "one patient group") is path mode, the
  pruned tree from the root of the chosen grouping to the focus; "the whole graph" is
  tree mode, that grouping folded as the site opens it — never an all-at-once
  drawing (`.claude/memory/design/view-scope-in-any-grouping.md`).
- **The link comes first.** Every result that names a node of a grouping or a
  recommendation carries the site's deep link to that position,
  `https://graph.med/<view-id>/?by=<axis>#<id>[,<id>]`, with `?by=` left out for the
  first grouping; the ids after `#` are entity ids, as the site reads them. It works
  in every client, with or without MCP Apps; the inline view is the addition in a
  host that supports them.
- **A trail of positions.** As the conversation moves, each call adds a new view
  instance ("No host API unmounts earlier instances":
  claude.com/docs/connectors/building/mcp-apps/instance-supersession, as read on
  2026-09-27). Optionally only the newest stays live and older ones grey out, through
  a `BroadcastChannel` (a plain web API) keyed by the server in the tool result; the
  view still draws without the key.
- **A tap reaching the model is best effort**, since hosts differ in whether it
  does; the link and the drawn position are the guarantee. The plan's "Clicks in the
  view go back to Claude as context" is the aim, not the guarantee.

Where the view's page comes from — fetched from graph.med or shipped with the
server — is #278's to decide, and ADR-0007's how its bundle is built.

### The session tools

> **Status: built (#408)**, the first part of the initiative `co-navigation` (#407).
> Its other parts are the MCP server's side (#409), the page and `llms.txt`
> describing the tools (#410), and a relay for clients outside the browser (#412,
> after the decision #411). Two of #407's questions are the maintainer's and stay
> open: whether the tools wait for the reader to switch a session on (opt-in), and
> whether conversation-driven highlighting makes the page a medical device (#283).

A view page offers an assistant beside the reader a small set of tools: read what the
reader sees, and change it as the reader's own controls would. They are the session
channel of #407; the MCP server above is its data channel, and the two share their
ids. An entity id is what follows `#` in the page's URL and what the server's tools
take; a question, which names no entity, goes by its node id (`q:…`).

- **One definition, two entries.** `tools/site/session-tools.json` holds the tools'
  names, the words a model reads about them, and the shape of their arguments. The
  build hands it to every view page, and `graph.js` implements each tool by name.
  - **A page function** serves an agent that runs script in the page, as Claude in
    Chrome and Claude Code with `--chrome` do: `window.graphmed.agent.describe()`
    lists the tools and the interface's version, and
    `window.graphmed.agent.call(name, args)` returns a promise of the answer.
  - **WebMCP tools** are registered with `document.modelContext.registerTool` (or the
    older `navigator.modelContext`) where the browser offers it, from the same
    definitions. `view` carries the read-only hint. Nothing is registered where
    neither is offered.
- **The tools.**
  - `view` reads. It returns the graph, the grouping, the chapter filter, the
    search, the selection with the path of boxes from the root, the assistant's
    highlight, and the boxes the folding shows, in reading order.
  - Each box gives its index `i` in that order, its id, kind and label, and `up`,
    the index of the box it hangs from. It also gives its place among that box's
    shown children (`3/32`), and `in_view`.
  - A statement adds its direction, grade, box number, and the answer that leads to
    it. A group adds its count and whether it is open.
  - Pages hold 40 boxes. `under` reads one box and what hangs below it, and
    `in_view` reads only what the reader can see.
  - The acts are `open` (as a deep link), `focus` (unfold the way and fit, the
    selection unchanged), `highlight` (with a note of at most 140 characters),
    `clear`, `toggle`, `fold`, `search`, `step` and `back`. Every act answers with
    the view after it, once the layout and the fit are at rest. An argument it
    cannot take is refused with the reason, and nothing changes.
- **Reading order and place are what the reader sees.** From the root, a box comes
  before what hangs from it, and siblings run top to bottom as drawn, then left to
  right. A place among siblings counts in that order.
  - The layout can draw siblings in another order than the published tree file,
    which the MCP server reads. With every group open, 13 of the 185 parents with
    two or more children differ across all groupings, and 1 of the 58 in the views'
    first groupings (2026-10-18; #408's pull request lists them).
  - So "the third one" is the page's answer about the page. The server's places
    count in the tree file's order (#409, "The tools" above), and the key the two
    share is the entity id, never the place.
- **`in_view` answers both readings of "visible".** Every box the folding shows is
  listed, and `in_view` says whether it lies wholly in the part of the canvas the
  reader sees: inside the canvas and the window, in the free row, above a phone's
  strip. The reading of #322's open question is left to the maintainer.
- **Nothing persists, and back undoes the assistant.** Each act is kept for the back
  button like the reader's own change (§3, "The interaction"), the highlight with
  it. A reload shows the page as it was.
- **The highlight is the assistant's own mark.** It is a halo in the page's accent
  behind the boxes and answers it names, apart from the reader's selection (the
  border) and from the outlines of related and general boxes. A line under the
  controls names it, with the note or the number of marked fields, and the reader
  clears it there.
  - The line makes the controls' row taller, so the free row and every fit after it
    stay clear of it.
  - A graph still where the last fit put it is fitted again into the smaller free
    row, so what it framed stays whole in view. A graph the reader has moved since
    moves down with the line, so nothing slides under the controls.
  - Nothing unfolds to show a highlight: `focus` does that.
- **Sizes.** An answer without arguments was at most 10.7 KB on every published
  graph (2026-10-18). The opening views took 1.3–5.2 KB, and a page of 40 boxes
  with the largest group open 8.2–10.7 KB. A tool's description and schemas, read
  once, take about 6 KB.

### Guardrails, carried as data

> The server decides what the model can repeat, because source licences differ per
> graph.
>
> - **Quotes are gated.** Verbatim source text comes only from an explicit
>   provenance call, kept short, always with the deep link. POMGAT's notice requires
>   written permission for any reproduction.
> - **Status is visible.** Every result states its review status and whether a
>   statement is sourced or `modelling`, so Claude can say "unreviewed extraction"
>   when it is.
> - **Graphs stay separate.** Cross-graph links appear only on request and are
>   marked as `modelling`.
> - **No individual advice.** Tool descriptions frame the content as guideline
>   structure for professionals. Whether an interactive pathway view counts as a
>   medical device under the EU MDR needs a legal check before promoting it to
>   clinicians.

Readings, each read with the first principle — *proposed*, except the quote gate,
which the maintainer decided on 2026-09-28:

- **Guardrails are data in every result, not instructions.** A tool description may
  state as a fact what the tool returns — guideline structure for professionals — and
  never instructs the model; a directory of connectors rejects descriptions that tell
  Claude how to behave (claude.com/docs/connectors/building/review-criteria.md, as
  read on 2026-09-27). Each result carries: the licence line, labelled as the
  project's summary; the review status, today `pending` for everything; provenance
  per entity type (a claim sourced, a statement `modelling` with its supporting
  claims); the build commit; and `disclaimer`, the banner's text (§2), which the
  server also gives as its instructions — the one copy in `mcp/src/descriptions.js`,
  checked against what `index.json` publishes. There is no intended-use field (the
  maintainer, 2026-10-06, #291). Results pass a card's `questions` through unchanged; whether they
  stay, are recast or are left out is `mdr-status`'s to decide.
- **The quote gate: nothing is gated that the site shows openly** (the maintainer,
  2026-09-28, #290; `.claude/memory/design/quote-gate-follows-the-site.md`). The
  provenance tool is the one place verbatim source text leaves the server: each
  claim's sentence (`claim.label`) whole, as the site shows it, with its page and
  its link into the source; the anchor quotes and the other quoted fields capped at
  100 characters, shortened at a word and marked. Every other tool cites a claim by
  its graph.med URL and page and returns no claim sentence and no quote, and the
  server drops those keys from their results whatever a file carries; a
  recommendation's wording that carries a claim's sentence or quote word for word is
  withheld there, its short label standing. One policy for every graph: the licence
  line is prose, so no policy per graph can be read from data. The maintainer's
  reason: any assistant can fetch the source PDF, and graph.med already publishes
  every claim's sentence, so gating the server alone protects nothing. Full
  sentences in every result wait for `assistant-permission`, which also says
  whether graph.med itself changes what it publishes.
- **Graphs stay separate.** The server never makes a cross-graph link of its own: a
  link made by the server would be a modelling assertion with no home in the pool.
  On request it returns only those the pool asserts, marked `modelling`, and today
  the pool asserts none. A cross-graph link the maintainer wants is asserted in the
  pool first, as `modelling` with a rationale. Each navigation tool keeps to one
  graph's members, and search without a graph groups its hits per graph, each ranked
  on its own and never merged.
- **No individual advice** is carried by the disclaimer in every result ("provided
  without warranty; use it with care"), not by a description; nothing in a result
  claims that anything was checked. The framing the site already publishes for a patient (above) is
  `mdr-status`'s to judge.

Nothing fetches, proxies or serves a source document: provenance returns the
source's public URL with its page and quote (§5;
`.claude/memory/design/sources-referenced-never-rehosted.md`).

### Citing

Every result carries graph.med URLs, so every statement can be checked (principle
3), and the commit its build was made from. The URLs point at floating content
(§7): a later build may say something else at the same address. *Proposed:* results
cite the floating URL with the build commit, and a citation from an assistant may be
the "first citation of a view" that `cut-publication` waits for.

### Where the server runs

**Hosted, in the MVP: Cloudflare Workers, open to every client, behind one
rate-limiting rule.** The server runs
only as a hosted endpoint (above, "Where this departs from the plan"). The tools
are built as a server factory in `mcp/` with no entry point of its own (#272); the
endpoint wraps it. The plan:
"Later the same code runs as a remote endpoint on a small function host, which
claude.ai web and mobile need. GitHub Pages cannot host it, because the protocol
needs an endpoint that answers POST requests." The host is Cloudflare Workers, which
settles the plan's "which function host to use after the MVP?", now for the MVP
itself; ADR-0008 records the choice and refers here for the facts. The server's
runtime, toolchain and home are ADR-0007's (#271); this section chooses none. Workers
run JavaScript and TypeScript on Cloudflare's own runtime, which provides a subset of
Node.js APIs (`nodejs_compat`; developers.cloudflare.com/workers/runtime-apis/nodejs/,
as read on 2026-09-27), so the tool code uses only web-standard APIs (`fetch`, JSON).
The design:

- The Worker is served on a custom domain in a Cloudflare zone, `mcp.graph.med`
  (the maintainer, 2026-09-28), attached once in the dashboard rather than by the
  deploy, so that the deploy token holds no DNS permission (ADR-0008); its MCP
  endpoint is `https://mcp.graph.med/mcp`.
  graph.med's DNS is managed in Cloudflare; the site stays on GitHub Pages, its
  records DNS only (not proxied), so only `mcp.graph.med` passes Cloudflare's
  proxy.
- It serves stateless Streamable HTTP. Cloudflare recommends the stateless handler
  `createMcpHandler`; `McpAgent` is deprecated.
- **No IP allowlist.** The maintainer, 2026-09-28: "we want to board other ai
  platforms too without that friction." Any MCP client may call the endpoint:
  hosted assistants of any vendor, and clients on the user's machine (Claude Code,
  Cursor, VS Code and the like), which add `https://mcp.graph.med/mcp` as a remote
  server. This overturns the earlier agreement (#267, agreed decisions 3 and 9) that
  one WAF rule admit only Anthropic's range.
- **One rate-limiting rule protects it**, the one the Free plan allows: requests
  whose path is `/mcp`, counted per client IP; more than 60 in 10 seconds block that
  IP for 10 seconds. On the Free plan a rule's expression can use only the path (and
  whether a bot is verified), counts only by IP, and counts over 10 seconds with a
  10-second block (developers.cloudflare.com/waf/rate-limiting-rules/, as read on
  2026-09-28). The Worker answers only `/mcp`, and 404 on every other path.
- `workers_dev = false`, and Preview and Version URLs are disabled, because zone rules
  do not apply to them. Bot Fight Mode is off, "Block AI bots" is off and the AI
  "Agent" behaviour is not blocked: on the Free plan Bot Fight Mode cannot be
  skipped per path, and AI platforms' servers cannot solve a challenge.
- The Worker keeps parsed files in memory between requests; a call with a cold cache
  costs a few GETs, at most 7 on the build of 2026-10-22, and a transient error adds
  at most two retries to a GET and none once the call has made 25 requests (Layer 1,
  "Cost"), within the 50 subrequests and 10 ms of CPU a request has: the wait before
  a retry costs no CPU time.

The facts, as read on 2026-09-27 (developers.cloudflare.com/workers/platform/limits/,
/workers/platform/pricing/, /agents/model-context-protocol/protocol/transport/,
/waf/custom-rules/, /bots/get-started/bot-fight-mode/,
/workers/configuration/routing/workers-dev/, /workers/configuration/routing/custom-domains/,
/workers/observability/metrics-and-analytics/): Workers Free allows 100,000 requests
a day per account, reset at midnight UTC, above which every Worker of the account
answers Error 1027, with no bill; 10 ms of CPU per request, time spent waiting on
`fetch()` not counted; 50 subrequests per request; Workers Paid costs $5 a month with
10 million requests included. Automatic DDoS protection reacts to attack-sized
traffic, while a steady 2–3 requests a second empties the free quota in about ten
hours.

**Unknown: whether requests the rule blocks spare the daily quota.** Cloudflare does
not say, and the Workers metrics cannot tell: requests the WAF blocks "will not
count" in their totals, so a count that does not rise is expected either way. It no
longer changes the worst case below, which the maintainer accepted.

The consequences (the maintainer's option C, 2026-09-28):

- Every MCP client can use the endpoint with no sign-in and no key: claude.ai web,
  Desktop and mobile, and Cowork; other vendors' hosted assistants; and clients on
  the user's machine. Programs that fetch pages read Layer 0 as well.
- One IP cannot hold the endpoint for long. A distributed flood, from many IPs each
  under the limit, or requests to the host's other paths, which the rule does not
  count, can use up the 100,000 requests a day: in that worst case the endpoint,
  with every Worker of the account, is off until midnight UTC, and nothing is
  billed.
- The limit counts per IP, and a hosted assistant calls from its operator's
  servers, so all users of one platform may share a few addresses; busy use through
  one platform can meet the limit. The threshold is the setting to change if the
  zone's analytics show it.
- Workers Paid ($5 a month) is reconsidered the first day the quota runs out, or
  when steady use nears it (ADR-0008).

**No login.** The hosted endpoint stays authless, protected by the rate limit. OAuth is
added only if the answers of `assistant-permission` or `mdr-status` require
restricting who may use it, for example to professionals. It would need an identity
source and would make the server hold user accounts and personal data, which breaks
principle 2 ("No credentials, no user data"). OAuth would restrict only the hosted
endpoint: the site and Layer 0 stay public, so such an answer
also says whether they must change. The facts, as read on 2026-09-27
(claude.com/docs/connectors/building/authentication, /connectors/custom/add-unlisted):
Claude supports OAuth 2.0 by default (Dynamic Client Registration or a Client ID
Metadata Document), each user signing in; a static credential (an API key or bearer
token in a request header) is in beta for a limited set of organizations, entered
once by an organization Owner and sent for everyone in it, so it cannot tell users
apart; a machine-to-machine `client_credentials` grant is not supported; `none` is
supported by default.

The Worker's configuration (`mcp/wrangler.toml`), the rate-limiting rule and the
deploy trigger are ADR-0008's; the account, the DNS, the rule as entered, the API
token and the deploy workflow (`.github/workflows/mcp.yml`) are a person's steps
(#279), all taken on 2026-10-06. This section states the design only.

**The check before a deploy** (#317) is the server's check on the synthetic fixture
and a short walk of the site just published (`--light`, `CLAUDE.md` "Checks"): per
graph its groupings, the first four nodes of each grouping's walk from its root, four
recommendations and four concepts spread over its search file with the claims behind
those recommendations, and search with its filters. Measured against a local build of
2026-10-22, it makes 512 tool calls and 188 requests to the site in 8 seconds, where
the full walk makes 7,716 calls and 2,463 requests in 5 minutes; against
`https://graph.med/` the same day it passed in under half a minute. The full walk
stays the check of a change to `mcp/` or to the files for programs, run before its
pull request (`CLAUDE.md` "Checks"), and a deploy started by hand can ask for it.

### What this section leaves open

- **The plan's questions** — `assistant-permission` (on what basis the sources' text
  may reach users through an assistant), `license-commercial-hosts` (PolyForm
  Noncommercial and commercial chat hosts) and `mdr-status` (the EU MDR, and the
  intended use), each in `open-questions.md`; `cut-publication` above.
- **The build's own limits, for a next graph.** The build ties a view's first
  grouping to patient groups in four places: it draws the tree of patient groups
  first in every view (`tools/build.py:861-863`); it builds the scope tree only over
  the `population` slot (`tools/build.py:750-751`); the hierarchy it draws asks
  "Welche Population?" at every fork (`tools/build.py:80, 1025`) and it refuses a
  hierarchy axis over another slot (`tools/build.py:1072-1073`); and it refuses
  `pathway` views, the kind reserved for authored decision paths
  (`tools/build.py:675-676`). A next graph shaped differently brings this build work
  with it; this section designs no change to them (open question
  `decision-graph-derivation`).
- **Proposals of the cards that build Layer 0** — the tree files' path, the key for
  where a concept appears, whether the lean view JSON is split — and the placement of
  direction, grade and verb in the search file, confirmed in #269's and #270's pull
  requests.

---

## 9. Left open

- **Cut publication** — how cuts are built and served alongside the floating view;
  whether a cut has a PDF export.
- **Branch guards** — yes/no and value-range branches come with authored pathways
  (`branch` edges carry a `guard`); the derived tree has only slot answers.
- **The page language** — the page chrome is German from the view layer's table
  (§3 "Language"), but for what the index says about graph.med itself and the
  banner, which are English; the questions and the direction words inside the
  graph, and every word of the sheet — the statement card and the other entities'
  sections — are in the source language. The maintainer decided on German now and a
  German and an English site in a later phase; nothing selects a page language yet.
- **Translation** — a build-layer projection, not started.
- **Other projections** — FHIR, RDF, diagram formats (`graph-representation.md` §13).
  The projections for programs and assistants — the machine-readable site, a
  read-only server and a view inside a conversation — are designed in §8.
