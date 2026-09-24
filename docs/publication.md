# Publication — how the pool is served at graph.med

> **Status: design, built in part.** The build (`tools/build.py`, `CLAUDE.md`
> "Build") renders §2–§5 for `selection` views over sources: the URL layout, the
> graph-and-sheet page with patient groups folded by family, the chapter tree and
> the search with facet filters, short labels, direction glyphs, legend and judgement,
> the order of the detail section (§3), entity pages and JSON (§4), source links
> (§5), the grouping switch — the view's tree of patient groups · Kapitel · each
> other axis the view declares (§3, "The axis is the reader's choice") —, the scope tree and what applies
> generally, for a view that declares one (§3), and the deploy workflow with one
> preview per open pull request (§6). Not built and not registered: cuts (§7),
> pathway views, and everything under §8. The
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
         ┆                                        solid border when the verb is "soll",
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
  edge. A relation between two recommendations (`specializes`, `complements`,
  `conflicts`) is not an edge of the tree: it takes no part in the layout and
  unfolding a group never follows it. While a box is selected, the boxes
  related to it that are shown keep their colour and wear a dotted outline; no
  line is drawn across the tree, and the card names each relation (zone 9).
  A box takes the colour of its direction — the four colours of the judgement bar
  in the details, so that box and section agree — and carries its grade as a
  letter before its label (A · B · 0 · EK, the guideline's own scale). No
  direction glyph is on the box, in any direction: the colour says it, and the
  glyph lives in the judgement and the legend. An
  EK box is coloured by its direction like every other recommendation and marked
  "EK", not demoted. **The verb is a border.** A box whose supporting claims all
  say `soll` gets a solid border in a strong shade of its direction's colour —
  green for *für*, red for *gegen* ("soll nicht") — so that two recommendations
  of one grade and direction still show which is the stronger; `sollte` gets no
  border, and neither does a box whose supporting claims disagree on the verb
  (the verb, like the grade, is shown and never composed). A contested box
  keeps its dashed red border and shows no verb border: the rarer, more urgent
  signal is never the one dropped. Legend under the graph: the colours are
  directions, the letters grades, the border the verb.
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
  `graph-representation.md` §5): the first question's answers are the roots of
  that hierarchy — or, in a view with a scope tree (below), the groups directly
  under its root: for the first view *Operation eines gastrointestinalen
  Tumors*, *Kardiale Dauermedikation*, … — each with the number of
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
  at once; of several paths the one with the fewest conditions counts), then each
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
place. Tapping the background clears. Tapping a concept linked in the section
moves the graph there. Deep links carry `#<entity id>`, and `?by=<grouping>` when the tree is
grouped by the chapters or an axis. There are no modal dialogs and no page
loads needed to read a view; the entity pages (§4) exist for linking, not for reading.

**The wrapper is three rows.** Everything the page floats over the canvas is placed
in a row of one grid rather than at a measured distance from an edge: the controls
in the first, what the reader opens over the graph — the chapter panel — in the
second, the legend in the third, and the canvas spanning all three. A control row
that wraps on a phone makes its own row taller, the legend is as tall as its lines
are at that width, and both the panel's height and the zoom that fits the tree
follow from the free middle row. No constant states how tall the controls are, and
a hidden legend leaves no row to subtract.

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
  search cannot is a bug. The search also **steps**, word-processor style: a
  pair of arrows beside the box, and ↓ and ↑ while the box has focus, move from
  one match to the next in graph order — a node before what hangs from it,
  siblings top to bottom — wrapping at both ends. A step selects the match
  exactly as a tap would: its details open, the graph fits to it, the rest of
  the fading stays as it is. Only visible matches are stepped, so a match
  behind a question the reader has closed is not visited. The counter then
  leads with the reader's place, "3 of 12 matches in 4 sections", until the
  query changes.

Once concepts carry a `facet`, the search gets facet filters (only procedures,
only outcomes). Everything here runs in the browser on the view's JSON.

**Direction, in four words.** A recommendation's direction is one of *für*,
*gegen*, *abwägen*, *Lücke*, derived at build time from the supporting claims:
`soll`/`sollte` with `direction: for` → für, with `against` → gegen; `kann` → abwägen,
because in the AWMF scheme "kann" *is* the open recommendation, the guideline's own
third category (the judgement adds the lean, "eher für" or "eher gegen"); `kind:
gap_notice` → Lücke; claims that disagree in direction → abwägen; a fact has no
direction. The box's colour and the judgement at the top of the details carry it; the
glyph (✓ ✗ ⚖ ∅) stands in the judgement and the legend, never on the box; the legend
lists the four words with their colours. Timing
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
  | 4 | Evidence | `Evidenz` | the supporting claims' `evidence`, per outcome; else `Evidenz: nicht erfasst` | never |
  | 5 | Applies to | `Gilt für` | the `population`, `condition`, `action` slots, then the value of every dimension axis that places the statement, named by that axis's `short_label` (else `label`) | no slot filled |
  | 6 | Body text | `Hinweise aus dem Begleittext` | `limits`, `refines`, `supplements` | never (empty state) |
  | 7 | Contradiction | `Widersprechende Empfehlung(en)` | `contests` | no contesting claim |
  | 8 | Citation | `Beleg` | the supporting claims' `source`, the source's title | never |
  | 9 | More | `Mehr zu dieser Aussage` | `specializes`, `complements`, `conflicts`, the ids, the slots as stored | never (closed) |

  1. **Title.** The short label, exactly once on the card.
  2. **Judgement.** One block with a 6 px bar in the direction colour at its
     left, no heading. Line 1, in the card's largest type: the glyph, the
     direction word and the verb as the claims say it — "soll nicht" for a
     recommendation against, never the bare verb; at its right, only when a
     contesting claim exists, `⚠ umstritten`, a link to zone 7, so that a
     reader who stops after the judgement does not leave with a one-sided
     answer. Line 2: one badge per supporting claim in claim order, its grade
     as text on the badge's fill (`Grad A`, `Expertenkonsens`) and its consensus
     beside it; identical pairs collapse to one badge with a count, `Grad A (2)`.
     The badges wrap under line 1 and never squeeze it. **Their order is the
     order of zone 8's entries** — the only thing tying a badge to its citation.
     A claim without a direction (a fact, a gap notice) draws no direction
     line; its badges still stand in line 2. Grades are shown, never composed
     (below). Fill means grade, bar and glyph mean direction; nothing is
     carried by colour alone.
  3. **Wording.** The guideline's own sentence on its own surface: body-text
     size, line height 1.6, a measure of about seventy characters, no indent,
     no rule, no shrunken type. Several supporting claims: one surface each, in
     zone 8's order. The number, page and section are in zone 8, not here.
  4. **Evidence.** How certain the evidence is, separately from how binding
     the recommendation is (zone 2), from the supporting claims' `evidence`
     entries, in one of four states and no fifth:

     | State | What it renders |
     |---|---|
     | One value | one line, no disclosure: `Evidenz: moderat (grade)` — the value and the system as the claim stores them |
     | Per outcome | a native `<details>`, open: its `<summary>` reads `Evidenz: endpunktabhängig (4 Endpunkte, hoch bis sehr niedrig)`, under it a table `Endpunkt \| Sicherheit` in the guideline's order, never sorted, the system named once as the table's caption |
     | Expert consensus only | one line: `Expertenkonsens, keine Evidenzbewertung` — every supporting claim `grade: EK` and none carrying an entry |
     | Nothing recorded | one line: `Evidenz: nicht erfasst` — what is not recorded, never that the guideline says nothing |

     `endpunktabhängig` comes first in the summary line and the range follows
     in brackets, so that the sentence's first word denies that a single value
     exists and the range reads as what it is — a description of a set. The
     range is the highest and the lowest value present by the system's display
     order (`EVIDENCE_SCALES` in `tools/build.py`, keyed by system, read for
     this and nothing else); a system the build has no order for keeps the
     table and loses the range, `Evidenz: endpunktabhängig (4 Endpunkte)`, and
     never fails the build. Where some rows carry a value and others do not,
     those rows read `nicht erfasst` and the line counts only what is
     recorded: `Evidenz: endpunktabhängig (3 von 5 Endpunkten erfasst)`. Several
     systems give one disclosure per system, never merged. Nothing is composed
     — no average, no worst case, no certainty in zone 2 — and the disclosure
     needs no script and survives printing.
  5. **Applies to.** The slots as rows: `Eingriff` (population, with the
     families it belongs to below it), `Bedingung` (condition), `Maßnahme`
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
     `Magensonde ziehen (6 Empfehlungen)`, the current statement included. In a
     view with a scope tree, a row `Gilt allgemein auch für` follows the anchor's:
     the groups whose scope edge leads directly to the statement's anchor, each
     with its `Voraussetzung` where the edge has a condition; in the JSON the
     anchor's row carries `allgemein`, every group it applies generally to — also
     those below the named ones — with its `condition`, its `via` and `direct`. The
     `outcome` slot has no row: an endpoint is the dimension the certainty
     varies along, which is zone 4's business; the slot stays in the schema and
     the data and is listed under zone 9.

     **A derived concept shows its rules.** Under a row whose concept is
     derived (`graph-representation.md` §3.2: it has `defined_by` edges) — the
     anchor, a condition, any row, by one code path — a line says so:
     `abgeleitet, nach der Regel`, or with several rules `abgeleitet, nach einer
     der folgenden 3 Regeln`, the rules being alternatives. Each rule is then
     one entry: the thresholds its claim prints, each as quantity, comparator,
     value, unit and time point (`Amylase-Konzentration im Drainagesekret < 5000
     U/L am ersten postop. Tag`), a relative one with `× <reference quantity>`,
     several joined by `und` because they hold together; a rule without
     thresholds shows its claim's sentence. Under each, its page and section
     linked into the source and `Textstelle`, a link to the claim's page. A rule
     without thresholds says nothing about a missing number: its sentence shows
     whether one is printed, and nothing in the pool tells a quantity-like rule
     ("lange OP-Zeit") from a categorical one ("koronare Herzkrankheit"), so the
     card never claims "the guideline gives no threshold". A stated
     concept's row is unchanged. In the statement JSON each row of `geltung`
     carries `derivation` (`derived` or `stated`, computed from the edges) and
     `rules` (per rule: the claim's `id`, `kind`, `label`, `page`, `section`,
     `link`, `quote`, its `thresholds` with `quantity` and `relative_to`
     resolved to `{id, label, lang}`); the view JSON
     carries the same two keys for every concept its statements hold, under
     `concepts`, and the concept's own JSON and page carry them too (§4). The
     words come from the card's words table; nothing is per concept.
  6. **Body text.** Three groups in order of their effect on the decision, not
     by relation name: `Grenzt ein` (`limits`), `Präzisiert` (`refines`),
     `Ergänzt` (`supplements`) — each passage its wording, then page and section
     linked into the source. The zone is named after what its passages do and
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
  8. **Citation.** Each source named once, by its title, in the order of its
     first supporting claim; under it one entry per supporting claim from that
     source: recommendation number, page, section, the verbatim quote, and two
     buttons — `In der Leitlinie öffnen` (the link into the cited page, §5)
     and `Suchtext kopieren` (the quote to the clipboard, for viewers that
     cannot highlight). Then the review status, `Klinische Begutachtung:
     ausstehend` (the pool has no attestation yet). Where a recommendation
     comes from is as much part of the answer as whom it is for.
  9. **More.** A `<details>`, closed: the related statements over
     `specializes`, `complements`, `conflicts`, the statement's and its claims'
     ids, every slot as stored, the modelling source. The only zone where
     developer vocabulary — edge names, raw values, ids — is allowed.

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
  (WP-0019) — is gone, its content under zone 9; and the binding question,
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
JSON (§4), take their words from the same table in the entity's own language. The page
chrome outside graph and sheet — header, footer, legend, counter — is English (§8).
Translation is a build-layer concern and can be added without a data change
(`graph-representation.md` §2).

---

## 4. Entity pages and JSON

Every entity gets a page whose content is the same as its sheet section, so that
`graph.med/statements/<id>` is a working link from anywhere, and a JSON document
next to it that carries the entity as stored plus its incoming and outgoing edges
resolved to ids. The JSON is what a program uses; the page is what a person lands
on. Both are generated; neither is authored. A derived concept's page lists its
rules under its label, as zone 5 of the card does (§3), and its JSON carries
`derivation` and `rules`.

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
- **The build's own words outside the graph and the card** — the legend, the
  counter, the chapter panel's "all" and the page chrome are English; the
  questions and the direction words inside the graph, and every word of the
  sheet — the statement card and the other entities' sections — are in the
  source language. The maintainer deferred the rest
  to a later phase.
- **Translation** — a build-layer projection, not started.
- **Other projections** — FHIR, RDF, diagram formats (`graph-representation.md` §13).
