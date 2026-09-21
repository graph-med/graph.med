# Graph Representation — how knowledge is stored in this repository

> **Status: design intent, partly enforced.** The schema (`schema/schema.yaml`,
> currently 0.6.0) exists and `tools/validate.py` enforces it, locally and in CI
> (`CLAUDE.md`, "Checks"): ids, enums, provenance requirements, claim hashes, slots,
> edges, a claim's `section` against its source's `outline`, `broader` without
> cycles, and with `--verify-quotes` every quote against its source. The pool uses
> all of it: one source with its outline, its claims with sections, statements and
> concepts with short labels, every concept with a facet, a `broader`
> hierarchy over the patient groups, and grouping axes (§4.1): the `axes/`
> entity, the validator's axis rules, the feasibility report (`tools/axes.py`),
> one dimension axis asserted on the first source and offered by its view, and
> the chapters as the built-in grouping. Everything else described as checked or
> computed — the canonical form and content hashes (§2), staleness (§5, §8),
> attestations and review state (§8), view cuts (§4), the derived statement
> properties (§3.3) — is not implemented yet, and the automated review (§8.1) is
> designed and defined only: the judge's definition exists (`.claude/agents/judge.md`)
> and its report goes into the pull request; no helper, no agent entity and no
> attestation exists. Statements about those describe the model this repository is
> being built to, not behaviour anyone can rely on today.

This file explains the approach behind the knowledge in this repository. It is
written for humans who review changes and for AI agents that read or write graph
data. It fixes *concepts and rules*; the one schema (`schema/schema.yaml`, §9) is
the authority on syntax.

If you are an agent about to add or change content: read this file, then the
schema, then the existing entities in the namespaces you are working in. Never
invent structure that neither this file nor the schema describes.

---

## 1. One sentence

Everything is an **entity with a URL** in **one pool**; knowledge lives in two
layers — source-anchored **claims** with deterministic identity, and a **semantic
layer** of concepts, statements and structure that claims *support* or *contest*;
relations are **typed tuples**; every statement carries **provenance**; a
**graph is a versioned view** over the pool — a filter plus an as-of point,
validated when a version is cut; review is a **signed attestation** by an agent
over a content hash; **one schema** governs the whole pool.

The same, as a picture. Boxes are namespaces (§2); labelled arrows are edge
kinds (§5); the two layers are §3; the view below the pool is §4:

```
              one schema (schema/schema.yaml) governs everything in the pool

  +---------------------------------------------------------------------------+
  |  THE POOL -- one repository; every git commit is a pool-wide as-of point  |
  |                                                                           |
  |  outside the pool     evidence layer             semantic layer           |
  |  linked, never        identity DERIVED           identity MINTED          |
  |  rehosted             from the anchor            (search before minting)  |
  |                                                                           |
  |  +-------------+      +------------------+       +--------------------+   |
  |  | sources/    |      | claims/          |       | statements/        |   |
  |  | url, sha256 |<-----| at + quote,      |------>| proposition        |   |
  |  | license     | at + | grade/verb/      | supp- | slots: population, |   |
  |  +-------------+quote | direction, kind  | orts/ | action, condition, |   |
  |                       | id=sha256(at|q)  | cont- | outcome            |   |
  |                       +------------------+ ests  +---------+----------+   |
  |                          |      ^                          | slot values  |
  |                          +------+                          v              |
  |                          refines, supplements,   +--------------------+   |
  |                          limits (body text)      | concepts/          |   |
  |                                                  | thin: label, defn  |   |
  |  agents/ --signs--> attestations/                +---------+----------+   |
  |            over a content hash; a changed                  | codes_as     |
  |            hash makes it stale, not void                   v              |
  |                                                  <terminology>/<code>     |
  |  pathways/ (decision, branch, outcome, gap)                               |
  |            --about--> statements; sequence, branch among themselves       |
  |            pure modelling, no evidence                                    |
  |                                                                           |
  |  every entity and edge carries `source`: a reference (at + quote) or the  |
  |  marker `modelling`; evidence on a statement is derived from its edges    |
  +---------------------------------------------------------------------------+
                |
                | filter: by pathway, source set, concept subtree, explicit list
                v
      views/<id>       floating -- the filter evaluated against the pool as of now
      views/<id>@<n>   a cut -- as-of commit + frozen members + validation;
                       stable forever, so it is what gets cited and attested
```

---

## 2. Entities and URLs

An entity is anything we want to talk about or point at: a claim extracted from a
source, a medical concept, a statement, a decision point, a source document, an
agent, a view. Every entity has exactly one identifier of the form

```
<namespace>/<entity-id>
```

Namespaces exist to mint identity, not to own content. The pool has a fixed set
of them, declared in the schema:

```
sources/         source documents                       identity: chosen slug + version
claims/          source-anchored extraction units       identity: derived (see cascade)
concepts/        uncoded medical concepts               identity: minted
statements/      propositions claims bear evidence on   identity: minted
pathways/        structural nodes of one composition    identity: minted within the pathway
views/           view definitions and their cuts        identity: chosen slug
agents/          people, organisations, software runs   identity: chosen slug
attestations/    signed review records                  identity: sequential
<terminology>/   one namespace per classification release (icd10gm-2026/, ops-2026/)
                                                        identity: the code itself
```

**The identity cascade.** Identity is deterministic wherever it can be, minted
only where it must be — because deterministic identity makes duplicates
impossible by construction, while minted identity requires judgment and review:

1. **Terminology concepts** take their id from the classification release:
   `icd10gm-2026/K57.3`. Two agents cannot mint duplicate nodes for a coded
   concept; the code is the id.
2. **Claims** derive their id from what anchors them:
   `claims/<source-id>/<hash>` where the hash is computed (by the validator, never
   by hand) over the locator and the verbatim quote. Two agents extracting the
   same passage produce the same claim.
3. **Edges** derive their id from `(from, kind, to)` plus an explicit
   discriminator only when parallel edges of the same kind exist.
4. **Uncoded concepts and statements** are minted — opaque, stable, ASCII slugs
   that never encode meaning that might change. Minting is preceded by search:
   an agent must look for an existing entity, and for a codable one, before
   inventing an id (§11).
5. **Structural nodes** are minted freely within their pathway namespace;
   duplication there is harmless because they carry no evidence.

Finer things are addressed by extending the path, and view cuts are addressed
with `@`:

```
<namespace>/<entity-id>              an entity
<namespace>/<entity-id>/<property>   one property of that entity
views/<view-id>                      the view, floating: evaluated as of now
views/<view-id>@<cut>                a cut: the frozen, validated version
```

The property-level address is what feedback, provenance and reviews point at
("the grade of this claim is wrong", not "this claim is wrong"). Nothing is
stored under a property address; it is an address the resolution rules in §6
answer for.

Identity is the URL, never the file. How entities are distributed over files is
a storage and diff-ergonomics decision that the model does not depend on. Once
published, every identifier resolves at `https://graph.med/<namespace>/<entity-id>`
and every view at `https://graph.med/<view-id>` — `docs/publication.md`.

**Language.** Content stays in the source language — labels, quotes, statement
texts are never translated at extraction. Every entity and edge that carries
text declares `lang` (BCP 47, e.g. `de`). Structural keys are English (they are
ours, not content); enum values are schema vocabulary slugified from the source
language (`soll`/`sollte`/`kann`, `konsens`/`starker_konsens`). Translation is
a build-layer concern, never a data concern.

**Canonical form.** Every entity has exactly one canonical serialisation
(deterministic key order and encoding, fixed by the validator and never changed
without a migration). The hash of that form identifies the entity's content at a
point in time and is what signatures cover (§8) and what staleness detection
compares (§5, §8). Authors never compute it; the validator does.

---

## 3. Two layers: claims and semantics

The pool separates *what sources say* from *what we hold to be the knowledge*.

### 3.1 Claims — the evidence layer

A **claim** is a source-anchored extraction unit: one place in one source,
carrying the locator, the verbatim quote, and the structured content readable at
that place — a recommendation's grade, verb and direction, a criterion's
threshold, a definition. Claims are **immutable** once extracted (a correction
is an edit with history, §7; the source said what it said), their identity is
deterministic (§2), and they are **never merged**. A claim asserts nothing on
its own about what is true; it asserts what a source states at a location. Its
unit is the **recommendation sentence**, not the box: a box holding several
sentences with their own verbs and directions becomes several claims sharing
the box's `recommendation_no`, each with the one grade its verb maps to under
the source's grading scheme (memory `box-granularity-per-sentence`).

How binding a recommendation is (`grade`, `verb`) and how certain the evidence
behind it is are two different facts, and a source may state the second per
outcome — *hoch* for one endpoint, *sehr niedrig* for another. A claim carries
it as **`evidence`**: a list of entries, each the rating in the words of the
system that made it (`value`, `system`: GRADE, Oxford, the ESC levels, whatever
the source used) and, where the source rates per outcome, the outcome concept
it applies to. Two rules keep the field honest. **A value is never mapped
between systems**: GRADE's *hoch* is not an Oxford level, no table in the
schema, the validator or the build says otherwise, and a system the site does
not know is a valid state, not an error. **Several entries are never reduced to
one**: a recommendation whose certainty differs by outcome carries every row,
and no consumer forms a summary value from them — grades are shown, never
composed (`docs/publication.md` §3). A source that rates the whole
recommendation once produces one entry without an outcome; an absent or empty
list means the certainty was not recorded, not that there is none. Like the
grade, the rating is read off the source and never inferred: its provenance is
required (§6.5).

### 3.2 The semantic layer

Three kinds of entity, kept apart because different edges attach to them:

- **Concepts** — the vocabulary: *pancreatic resection*, *intraabdominal
  drainage*. Thin: labels, a definition, a **facet** saying what kind of thing
  the concept is, and edges — `codes_as` into terminology namespaces, `broader`
  to the concept it is a special case of (§5). A concept cannot be contested; it
  means, it does not claim. The facet is one of `procedure` (the operation that
  defines the case: *leberresektion-komplex*), `patient_state` (a risk profile or
  pre-existing condition), `medication` (a drug or long-term therapy),
  `intervention` (the measure a recommendation judges: *epiduralanalgesie*,
  *abdominelle-drainage*), `outcome` (an endpoint or complication), `finding`
  (a result that triggers a decision) or `qualifier` (a value of a statement
  dimension, §4.1 — a phase, a setting, a line of therapy — which qualifies a
  recommendation and is nothing in the case itself). It describes the concept's nature, which
  is fixed; the slots a statement puts it in describe its role there, which
  varies (`mpom` is the action of one statement and the condition of another).
  Where the two seem to collide, ask whether the concept describes the case or
  the act.
- **Statements** — propositions with a truth claim: "after pancreatic
  resection, the drain can be removed early when the drain amylase indicates a
  low fistula risk." Statements are what claims *support* or *contest*. A
  statement has a **slot shape** declared by the schema (population, action,
  condition, outcome — filled with concept URLs; a further slot exists only
  where a dimension axis declares it, §4.1), which makes "is this the same
  statement?" an almost-computable question and keeps granularity honest: **a
  statement is the smallest unit that can be independently supported or
  contested.** Its `label` is the full proposition; an optional **`short_label`**
  is the same proposition compressed for a box on a drawing, and it must still
  tell siblings apart — six boxes reading "Magensonde ziehen" hide exactly the
  staging the drawing exists to show, so the short form carries the
  distinguishing feature ("Magensonde vor Ausleitung (kolorektal)"). Concepts
  and structural nodes may carry a `short_label` for the same reason. A short
  label is at most 60 characters (the schema enforces it: a box holds two lines
  of about thirty); aim for 55. Shortening
  a clinical proposition can change its meaning, so a short label is reviewed
  like any other content, never generated on the fly.
- **Structure** — decision questions, branches, outcomes, explicit gaps: the
  pathway machinery. Structural nodes assert nothing about the world; they
  arrange statements into something navigable, and they are pure modelling.

### 3.3 Stored versus derived

A semantic entity stores almost nothing: labels, definition, type, slots.
Everything evidential is **derived** from its claim links and never written by
hand: its source set (via `supports`), its conflict status (via `contests`), its
effective grade (computed from supporting claims by a schema-declared policy —
a grade always originates in a document, §6.5), and its review state (via
attestations, §8). A hand-written evidence property on a statement is the same
violation as a hand-written review status.

### 3.4 How new evidence arrives

A new document produces new claims — deterministically, without judgment. The
editorial act is linking: each claim gets a `supports` or `contests` edge to the
statement it bears on, or a new statement is minted when none fits. Where a
claim agrees, the statement's evidence grows and the statement itself is
untouched. Where it disagrees, the conflict is *surfaced*, never resolved by
recency (§7). Sameness is an edge, not an identity decision: a wrong link is
rerouted or deleted under review; there is no merge that has to be unpicked.

---

## 4. One pool, many views

There is no monolith and there are no owned graphs; there is one pool, and there
are **views**: named selections over it. What a reader calls "a graph" is a view.

A view is an entity (`views/<view-id>`) whose definition is a **filter** — a
membership rule over the pool: by pathway namespace, by source set, by concept
subtree, by schema compliance, or an explicit list. How filters are expressed is
schema-governed and deliberately minimal for now (§13). One filter form is
worth naming because it looks like knowledge and is not: a **section** filter
selects the statements supported by claims whose `section` lies under a given
section of a source (§6.7). It is how a reader narrows a view to one chapter of
a guideline; it selects, and it never adds a node or an edge.

**Versioning.** The unadorned view URL is *floating*: the filter evaluated
against the pool as of now. A **cut** freezes it:

```
views/<view-id>@<n>  =  filter + as-of commit + frozen member list + validation
```

Because the pool's history is append-only through git (§7), a cut is stable
forever: its member list, the members' content hashes, and therefore the cut's
own canonical hash never change. Cuts are what get cited, exported, and attested
(§8). The repository commit is the pool-wide as-of point; no per-item version
bookkeeping exists.

**Completeness lives at the cut.** A view intended as a decision pathway must
pass the structural validation for pathways *at cut time* — every branch has its
outcomes, every referenced statement is a member, nothing dangles. A filter that
amputates a branch fails validation and the cut is not made. "A graph is complete
and valid on its own" is a guarantee only a cut can honour, so it lives there.

### 4.1 Grouping axes: proposed, tested, asserted, shown

A view is read as a tree of questions whose answers are grouped
(`docs/publication.md` §3). *By what* they are grouped is an **axis**, and an
axis is never built into the pool or the site. Guidelines are organised by
different principles — chronologically by perioperative phase, by organ, by
tumour entity, by stage, by leading symptom, by setting (a source's `structure`
says which, §6.7) — and any closed list of axes is exactly what the next
guideline breaks. The pool therefore fixes the **mechanism** by which an axis
comes to exist, and leaves the axes themselves to the people who read each
guideline. An axis is guideline-specific in what it proposes and generic in
how; a second and a third guideline pass through the same four steps unchanged.
Nothing in this section names an organ, a phase or a source; the worked example
at its end does.

#### The two carriers

An axis groups the answers to one question of the tree, and it is carried by
one of two things the schema already has. The rule that decides which is the
same for every guideline:

- A **statement dimension** — a slot on the statement (§3.2) that the axis
  adds. Its value qualifies the *recommendation* and holds whoever the patient
  is: the same patient group carries recommendations across all values of such
  an axis. In the tree, a dimension is a question of its own, asked **before**
  the population question, because it partitions the whole guideline the way
  its chapters do — and it is exactly what a chapter *meant* (§6.7), lifted
  from the outline into data. Its values are concepts of facet `qualifier`
  (§3.2), listed in the axis definition; the slot holds one of them.
- A **hierarchy respect** — a `broader` edge with an `axis` property (§5) over
  the concepts that answer a question the tree already asks (today the
  population and the condition). Its value is a true "is a special case of" of
  a *concept* in one respect. A concept may have several broader concepts on
  different axes and, unless the definition says otherwise, one on each; an
  edge without `axis` is plain subsumption as before. In the tree, a hierarchy
  changes which concepts are the families of that question and how it folds —
  never which question is asked.

If the value would stay true whatever were recommended, it is subsumption; if
it varies with the recommendation, it is a dimension. Edge cases, decided once:
a value that names the patient's *situation* after an intervention ("the state
after X") is a population concept and is placed by hierarchies like any other,
while *when* the recommendation applies stays a dimension; a dimension value
that covers the whole guideline ("throughout") is a legitimate declared value,
not a missing one; a concept defined by exclusion or spanning several families
is placed by a hierarchy only where the definition allows several parents, and
is otherwise unplaced — the pool never mints a "several" family, because that
is not a subsumption. The document outline is neither carrier and needs no axis
entity, because it is provenance, not modelling (§6.7): every view offers it as
the built-in chapter grouping of its switch, derived from the claims' sections
and the sources' outline, with the plain hierarchy as the default — and its
headings are the extractor's hint when a rule is applied. The `broader` hierarchy over the first source's
patient groups and the population question the site asks today are the
**plain hierarchy**: the axis every view has without declaring it, read as one
hierarchy respect over the population slot; the mechanism adds nothing to it.

#### 1. Proposed — the axis definition

A person — usually a physician — proposes an axis as data: one entity
`axes/<axis-id>` in the `axes/` namespace (§2), with

| field | content |
|---|---|
| `id`, `type: axis`, `lang`, `label`, `short_label` | as for every entity; the label is what the site's switch shows |
| `carrier` | `dimension` or `hierarchy` |
| `slot` | for a dimension: the slot key the axis adds to statements (English, like every structural key); for a hierarchy: the existing slot whose concepts it folds (`population`, `condition`) |
| `values` | dimension only: the concepts (facet `qualifier`) the slot may hold, in the order the tree shows them |
| `several` | hierarchy only, default `false`: whether a concept may have more than one parent on this axis |
| `rule` | the written rule a linking session applies without judgment calls: what earns which value or which family, in the source language, `lang`-tagged |
| `proposed_by` | a role — `physician`, `maintainer`, `agent` — never a name (`.claude/rules/conventions/no-personal-information.md`) |
| `views` | one entry per view the axis is proposed for: `{view, status, since}`, status one of `proposed`, `asserted`, `withdrawn` |
| `placements` | the rule *applied*, before assertion: for a dimension, `{statement: value}` pairs; for a hierarchy, `{concept: parent}` pairs; removed from the definition when the axis is asserted, because edges and slot values then carry them with provenance |

The rule is for people; the placements are what the tool measures. An axis
whose rule holds for a second guideline is proposed for its view by adding an
entry under `views`, not by a second definition; a status is per view, because
an axis can be feasible on one source and not on another. Proposing is cheap
and commits the pool to nothing: a proposed axis groups no view.

#### 2. Tested — the feasibility report

A tool (`tools/axes.py <axis> <view>`, registered as WP-0008) applies one axis
to one view and prints a report. It reads the placements from the definition
while the axis is proposed, and from the asserted edges and slot values once it
is asserted, so that the same numbers can be printed before and after. It
writes nothing. The **universe** *U* is, for a dimension, the view's member
statements; for a hierarchy, the concepts that fill the axis's slot on the
view's member statements. Four measures:

- **Coverage** — the share of *U* with a place: a statement with a value, a
  concept from which axis edges lead to a root on this axis. Reported twice for
  a hierarchy — by concept and by statement (a concept weighs the statements it
  answers for) — because ten placed concepts carrying two statements each are
  not the same as one unplaced concept carrying twenty-four.
- **Disjointness** — what has more than one place: a statement whose rule
  yields two values (the slot holds one), a concept reaching two roots on this
  axis. Listed by name with the places. For a hierarchy with `several: true`
  this is information; otherwise it is a defect of the placements.
- **The unplaced remainder** — every member of *U* without a place, by name,
  each with the number of statements it carries, heaviest first. This list is
  where the proposer's next decision lies.
- **Depth** — for a hierarchy: the number of roots (the families the switch
  will offer), the longest chain, and every root with a single member (memory
  `concept-hierarchy-depth`: no family for one member); for a dimension: the
  values used with their statement counts, every declared value used by no
  statement, and whether one value takes all of *U* (then the axis partitions
  nothing).

The report is a measurement, not a verdict: no threshold is fixed here. A
person reads it and decides, and the report goes verbatim into the pull request
that asserts the axis. An axis feasible on one guideline and infeasible on
another is a fact the report states, not a defect of either.

#### 3. Asserted — with provenance

What the person accepts is written into the pool the way everything that groups
the graph is written — by a linking pass, reviewed in a pull request:

- a dimension: the value as a slot on each statement, an edit with history
  (§7), `modelling` with a rationale that cites the rule and, where the sentence
  does not name the value, the heading or passage that does;
- a hierarchy: `broader` edges naming the axis, each `modelling` with a
  rationale; a family concept minted where the axis needs one, with facet and
  label, never for a single member;
- the definition's `views` entry set to `asserted`, its `placements` removed.

**Nothing groups a view that is not asserted this way.** The feasibility test
is post-processing; the grouping never is — otherwise a grouping would appear
on the site that nobody can cite, attest, date or dispute. A rejected proposal
stays `proposed` or becomes `withdrawn`, with the report in the pull request
that decided it, so the next session does not re-run the same experiment.

#### 4. Shown — `group_by` on the view

A view declares which asserted axes it offers, in the order its switch lists
them:

```yaml
group_by: [axes/<axis-id>, axes/<axis-id>]   # each asserted for this view
```

It is a property of the view beside `filter`, not a filter form: it selects
nothing and never changes the view's members (§13). The switch lists the plain
hierarchy first, then the chapters of the view's sources (§6.7: the top-level
sections in outline order, a statement behind every chapter one of its claims
sits in), then the declared axes; the first two are built in and need no
declaration, so a view without `group_by` has those two. Choosing a grouping
changes what the tree asks first (the chapters, a dimension) or which concepts
are the families of a question (a hierarchy), and nothing else — not the
shape, not the folding, not where a recommendation hangs. Whatever the chosen
grouping cannot place is one answer, **"not placed"**, last among the answers
of the question it groups, at every depth where that question is asked; it is
never dropped. The build knows no axis by name: the switch's words, the chapter
question and "not placed" come from the per-language table like the questions,
keyed by the axis's `label` and the language.

The validator (WP-0008) holds this together: an `axis` on a `broader` edge and
a `group_by` entry name an existing axis of the right carrier; a `group_by`
entry is asserted for that view; a slot key on a statement is one a dimension
axis declares, and its value is one of that axis's `values`; no cycle within
one axis; a placement references entities that exist.

#### Worked example — the first source, and two imagined ones

*The first source* (`views/pomgat-lv-1.0`: 90 statements over 36 population
concepts, chapters titled by perioperative phase and subsections by organ and
modality). A physician proposes two axes.

- **Perioperative phase**, a dimension: `slot: phase`, values *präoperativ*,
  *intraoperativ*, *postoperativ*, *perioperativ* (the last for what holds
  throughout, such as a management concept); the rule: the phase the
  recommendation's sentence names; where it names none, the phase of the
  chapter its supporting claim sits in, as the hint §6.7 allows. Applied: 58
  of 90 sentences name a phase word, 32 do not and are placed by the chapter;
  by chapter the values would carry 35 · 15 · 33 · 7 statements, so the axis
  partitions and no declared value is empty. The two hardest to place: the
  single-dose corticosteroid recommendation, whose section is titled
  "präoperative und intraoperative" — the rule takes the sentence, which says
  "vor Narkoseeinleitung", *präoperativ*; and the early drain-removal
  recommendations, whose chapter is intraoperative (the drain is placed there)
  while the sentence says "bis 4. postoperativer Tag" — the sentence wins,
  *postoperativ*, which is precisely why the sentence is the rule and the
  chapter only the fallback. Two sentences name two phases ("präoperativ … und
  postoperativ …"): disjointness, listed; the proposer either splits the
  statement (memory `box-granularity-per-sentence`) or accepts
  *perioperativ*.
- **Anatomical region**, a hierarchy: `slot: population`, `several: false`,
  families Ösophagus, Magen, Pankreas, Leber, Kolorektum; the rule: a
  population concept is placed under the organ its procedure resects or
  anastomoses; a population that is not a procedure has no region. Applied to
  the 36 concepts: 20 placed, carrying 42 statements; 2 in several regions
  ("Pankreas- und Leberchirurgie", and the resection defined by exclusion,
  "nicht-kolorektal", which names four); 14 unplaced, carrying 46 statements —
  among them the generic "Operation eines gastrointestinalen Tumors" with 24
  and the elective abdominal tumour operation with 7, the four cardiac
  medication groups and the three risk profiles. Coverage by concept 56 %, by
  statement 47 %. The two hardest: the exclusion-defined group, which the rule
  cannot place without `several: true` and which is then under four of five
  families — the report shows the proposer exactly that; and "Magenschlauch
  nach Ösophagektomie", a situation after the operation, which is a population
  concept and is placed under Ösophagus by the rule, its timing being the
  phase axis's business. The report says what a physician suspected: half the
  guideline speaks of gastrointestinal tumour surgery as such, and a region
  axis leaves that half in "not placed". Whether that is useful is the
  proposer's call, not the tool's.

*A guideline organised by stage* (an oncological entity, chapters by UICC
stage). Its physician proposes a hierarchy "Stadium" over the condition slot
(`slot: condition`), families the stages, rule: the stage a condition concept
names; and a dimension "Therapielinie" (first-line, second-line, …). Nothing
in the mechanism, the schema or the build changes; its view declares both in
`group_by`, and its switch shows "Stadium" and "Therapielinie" where the
first source's shows "Phase" and "Region".

*A guideline organised by leading symptom* (an emergency guideline, chapters
"Brustschmerz", "Dyspnoe", …). The symptom is the population's *presentation*,
not a phase and not a subsumption of a procedure: a dimension `slot:
leitsymptom` whose values are the symptoms — or, if the populations are
minted as "patient with X", a hierarchy over the population slot. The
carrier rule decides: a symptom stays true whatever is recommended, so it is
subsumption where the population concept carries it, and a dimension only
where the same population is addressed under several presentations. The
feasibility report of each variant tells the proposer which one the data
carries.

---

## 5. Edges are typed tuples

An edge is

```
(from-URL, kind, to-URL, properties?)
```

with a derived id (§2). `kind` comes from the schema's vocabulary, which keeps
the different jobs of edges apart:

- **evidence** — `supports`, `contests`: claim → statement. The only edges that
  carry evidential weight.
- **body-text relations** — `refines`, `supplements`, `limits`: claim → claim.
  Body text never inherits a recommendation's grade; the edge says how they
  relate.
- **coding** — `codes_as`: concept → terminology concept. Codes are never bare
  strings inside a property; a code is a node and coding is an edge, so the link
  carries provenance and dangles visibly when a classification changes.
- **subsumption** — `broader`: concept → concept, "is a special case of". *Offene
  Leberresektion* is a *Leberresektion*; a concept may have several broader
  concepts (a minimally invasive colorectal resection is both a colorectal
  resection and a minimally invasive procedure) and a concept with none is a
  root. Always `modelling`, with a rationale; it may carry an **`axis`** naming
  the respect in which the subsumption holds, once that axis is asserted for
  the view (§4.1). The edge carries **no evidence and no inheritance**: whether a recommendation about the broader concept holds for
  the narrower one is a clinical question the source either answers explicitly,
  in which case a statement says so, or leaves open, in which case the gap stays
  visible. A build that propagates recommendations down a `broader` edge would
  be inventing answers; it may only use the edge to group and to fold.
- **structure** — `sequence`, `branch` (with a `guard` property), `about`:
  among structural nodes and from them to the statements they arrange.
- **cross-source semantics** — `specializes`, `complements`, `conflicts`:
  statement → statement. Our assertions, always `modelling`, with rationale and
  date.

**Staleness without version pins.** An edge whose meaning depends on its
endpoints' content records the endpoints' content hashes at assertion time. When
an endpoint's current hash differs, the edge is **stale**: surfaced for
re-evaluation, its derived weight downgraded — not silently applied, and not a
blocker (§8). No version is ever pinned on an edge; the mechanism is the same one
attestations use.

---

## 6. Provenance

Provenance answers "where does this statement come from". It is the central
guarantee of this repository: a human must be able to jump from any statement to
the exact passage that justifies it, and a machine must be able to verify that
the passage exists.

### 6.1 Sources are entities

Every source document — a PDF, a web page, a classification release — is an
entity in `sources/` with a version, its public URL, a content hash and licence
information. Sources are **referenced, never rehosted**: the repository and its
links are the only assets (see `README.md`, "Source documents"). Provenance
points *into* sources with a locator whose syntax depends on the media type:

```
sources/pomgat-lv-1.0#page=61        a PDF page — physical page, what viewers navigate by
sources/bfarm-icd10gm-2026#code=K57.3 a code in a classification
sources/some-website#:~:text=exact%20phrase   an HTML text anchor
```

The build layer turns these into links using the fragment conventions of the
target format (`#page=N&search=<quote>` for PDFs — viewers that understand
`search` highlight the quote, the rest land on the page). Authors never write
the final link; they write the locator.

### 6.2 A reference is a locator plus a verbatim quote

```yaml
{at: sources/pomgat-lv-1.0#page=61, quote: "kann die Einlage einer intraabdominellen"}
```

The quote is short (a clause, not a paragraph) and **must be a verbatim
substring of the source's extracted text** — it is three things at once: the
highlight target for a reader, the reviewer's at-a-glance check, and the
validator's exact match. A paraphrase breaks all three. A statement whose quote
cannot be found where it claims to be is invalid. Provenance values are lists; a
single reference is shorthand for a list of one.

### 6.3 Two kinds of provenance value

- a reference (or list of references) into a source — "the source says this";
- the marker **`modelling`** — "no source states this; it was asserted by the
  person or agent who built it".

Claims carry references by construction — a claim *is* its anchor plus content.
Semantic and structural entities are typically `modelling`: a statement's
wording, a slot assignment, every structural node, every cross-source edge.
`modelling` is never a way to skip provenance; it is provenance of a different
kind, recorded as attribution to an agent instead of derivation from a passage.

### 6.4 Default on the entity, override per property

Every entity and every edge carries a default `source`. Any property whose
origin differs gets its own entry under `provenance`, keyed by the property
name. Resolution for `claims/pomgat-lv-1.0/ab12cd34/grade`: the override if
present, otherwise the entity default.

### 6.5 The schema decides which properties need provenance

Not every property has a source. Identifiers, types and labels are ours. The
schema states, per type and property, whether provenance is **required** (must
resolve to a passage, never `modelling`), **optional**, or **not applicable**.
Domain rules such as "a recommendation grade must always come from the
document, never from the extractor" are enforced here mechanically — which is
also why a statement's effective grade is *derived* from its supporting claims
(§3.3) and never written on the statement.

### 6.6 Who did it

Which extraction run produced which claims is recorded as attribution to an
agent (§8). Who reviewed what is recorded as attestations, never as a
hand-written field. Review state is derived.


### 6.7 Document structure is provenance, not knowledge

A guideline has chapters; the knowledge in it does not. The pool records where in
a document a claim was found and never turns that location into a node:

- A claim may carry **`section`**, the number of the source section its passage
  lies in (`'7.4.1.1'`), next to `recommendation_no`. Both are properties of the
  anchor — document structure, read off the page — and they live on the claim
  only. A statement can be supported from two chapters and a concept used in
  five, so neither carries a section.
- A source may carry **`outline`**, its complete table of contents: every section
  with its number, title and physical page, including sections that contain no
  recommendation. It is a property of the document, like its content hash, and
  is verified against it. The validator checks that every claim's `section`
  names a section of its source's outline, which makes the section a controlled
  reference rather than a free string. Coverage is then a derived number: the
  outline minus the sections any claim names is exactly the part of the
  document nobody has extracted — a gap stays a visible white spot instead of
  vanishing silently.
- A source may carry **`structure`**, a list saying by which principles the
  document is organised — `chronologisch_perioperativ`, `anatomisch`,
  `modalitaetsbezogen`, `versorgungspfad`, `entitaetsbezogen`,
  `stadien_schweregrad`, `populationsbezogen`, `settingbezogen`,
  `leitsymptombezogen`, `berufsgruppen_prozessbezogen`, `querschnittskapitel`
  (most S3 guidelines mix several). It is descriptive and steers nothing; its
  value is the evidence that the pool presupposes no particular outline.

There is deliberately no `outlines/` namespace and no chapter node, because a
chapter is not something the pool knows, only something a source is arranged by.
A chapter reaches the reader as a **filter** (§4) and as a tree beside the graph
(`docs/publication.md`), never as a vertex in it. What a chapter *means* —
POMGAT's headings encode an organ or procedure family and a perioperative phase —
is knowledge, and it goes where knowledge goes: the family into `broader` edges
between concepts, the phase into a statement dimension a person proposes and a
linking pass asserts (§4.1). The heading is the extractor's hint
for assigning those; the section number is never the key. That is what lets a
second guideline with a different outline land in the same graph: "colorectal,
postoperative" survives the change of document, "7.4" does not.
---

## 7. History, editing and schema evolution

**Files hold current state; git is the edit history.** The commit is the
timestamp, the author and the atomic as-of point for the whole pool — no
in-data timestamps duplicate it. The data is laid out so that this history can
be *extracted* later (one entity per file, property-level diffs legible) when
the pool moves out of git.

**Supersede versus contest.** Two very different events must never be
conflated:

- **Supersede** — a correction within the same editorial line: an extraction
  error fixed, a label improved. This is an *edit*: the file changes, the old
  value lives in git history, attestations on the old content go stale.
- **Contest** — a source that disagrees. This is *new data*: a new claim and a
  `contests` edge. Both sides stay visible with their evidence; the conflict is
  surfaced on the statement. **Recency never resolves disagreement** — a newer
  document does not overwrite a stronger one (§11.4).

An agent asserting a change chooses which of the two it is, and the choice is
reviewable in the diff: an edit to an existing entity claims "same editorial
line"; new entities and edges claim "new evidence".

**Schema evolution.** The schema is edited first, in its own change; data edits
then comply with the schema as of their commit. Nothing is retroactively
invalid: an entity untouched since an older schema version remains valid *as of
its last edit*. The drift this creates is deliberate and **visible**: a view can
demand "compliant with the current schema", and the entities that fall out of it
are precisely the migration worklist. Migrations are explicit, reviewed edits —
never silent rewrites.

---

## 8. Agents, attestations and review

People, organisations and software runs are entities in `agents/`. An agent
entity has an opaque, stable id; how the agent authenticates — a repository
login, an ORCID, a signing key — is a set of *identity claims* and
*verification methods* attached to the agent, replaceable without touching
anything that refers to it.

An **attestation** records that an agent makes a claim about a subject at a
specific content state, and signs it:

```yaml
- id: attestations/0001
  type: attestation
  subject: statements/drain-early-removal-low-risk
  subject_hash: "sha256:9f2c…"        # hash of the subject's canonical form (§2)
  scope: with_evidence                 # content | with_evidence (statement + its current claim set)
  claim: expert_reviewed               # expert_reviewed | validated | disputed | …
  by: agents/mkoch
  date: 2026-09-05
  proof: {type: …, verification_method: agents/mkoch#key-1, value: "…"}
```

Rules that follow:

- **Review state is derived, not asserted.** An entity's status is whatever its
  valid attestations support. Nobody writes `validated` into an entity.
- **A changed subject invalidates its attestations.** If the canonical hash no
  longer matches, the attestation is *stale* and the derived status drops until
  someone re-attests. With `scope: with_evidence`, the hash covers the composed
  snapshot of the statement *plus its evidence edges*, so a new contesting claim
  stales an expert review — the expert vouched for a conclusion given its
  evidence basis.
- **Verification is an attestation.** The `validated` claim records that a quote
  was checked against the source — made at extraction time while the downloaded
  copy is at hand, or whenever a source is re-fetched. It additionally records
  the **source's content hash** it verified against, so a changed source never
  leaves silently orphaned verifications. `validated` is a mechanical claim and
  may be signed by a software agent's own key; `expert_reviewed` may not.
- **Stale downgrades; invalid blocks.** Staleness — of an attestation or an
  edge (§5) — lowers the derived status of the affected item and lands in a
  report. It never blocks an unrelated change, otherwise any source or
  statement update would freeze everything that references it. *Invalid* —
  a quote that fails verification against a source at hand, a schema violation
  at edit time, a cut that fails completeness — blocks.
- **Authority is governance, not data.** Which agents may issue which claims is
  a role on the agent, granted through the repository's governance process and
  checked by the validator.
- **A service acting for a human** is itself an agent acting *on behalf of* the
  human; the human's key signs the attestation, the service's key signs the
  commit. Signed commits protect the changesets; attestations protect the
  statements.

### 8.1 Automated review: the judge

*Designed, not built (status header).* One agent in `agents/` is software that
reads what a pull request adds to the pool and says whether it matches what it
is anchored to — the "LLM as a judge" of the review initiative. It is a reader
with a recorded identity, not a writer: everything it finds lands as
attestations by it, never as an edit, and everything else about it follows
from the rules of §8 above.

**What it checks.** Four questions. Three are asked of one subject the pull
request adds — a claim, a statement, an edge — against the ground the pool
already holds for it, and catch what was invented or misread. The fourth is
asked of the ground itself — the page — against the pool, and catches what was
left out:

- **A claim against its page.** The judge reads the physical page the claim's
  locator names — the same extracted text the validator's quote check reads
  (`--verify-quotes`; §14) — and asks whether the claim says what is printed
  there: the `label` is the sentence at the quote, one sentence and not the
  whole recommendation the source marks (§3.1); `kind` follows the sentence's form; `grade`, `verb`, `direction`,
  `consensus`, `recommendation_no` and `section` are as printed at that place,
  and none is supplied where the page prints none (§11, rule 6; a body-text
  claim carries no grade, §5); a number in the label — a day, a dose, a value,
  a threshold — is the number on the page. Whether the quote is on the page,
  whether the id hashes from the anchor, whether the file fits the schema, it
  does not ask: the validator has, and the judge runs after it and repeats
  none of it — the definition lists what the validator covers so that the
  judge skips it. That is the difference in kind between the two: a substring
  is mechanical, "as printed" is a reading.
- **A statement against its supporting claims.** The judge reads the statement
  with every claim that `supports` or `contests` it and asks whether the
  proposition is what the claims say: nothing the label asserts is absent from
  every supporting claim, nothing a supporting claim asserts contradicts it;
  each slot names what the claims' sentences name in that role — the
  population operated on, the action, the condition, the outcome, the value of
  a dimension (§4.1); the `short_label` compresses without changing the
  meaning (§3.2); a `contests` edge really contradicts. Sameness is what it
  judges: a wrong `supports` edge is a statement that does not say what its
  claim says.
- **A body-text edge against the rule.** For each `refines`, `supplements` and
  `limits` edge the judge reads both claims and the page and applies the
  body-text rule of §5 as this document states it when the judge reads. Today
  §5 says only what the three kinds are and that body text never inherits a
  grade; the rule that says which passage earns which kind — a gate, then
  tests in a fixed order, the edge to the claim of the marked recommendation
  whose wording carries the term, a `rationale` naming the test and the term,
  the from-claim ungraded, never between two sentences of one marked
  recommendation — is being written as its own package, and the third
  question is stated over that shape: the kind the edge carries is the first
  test that holds, the target is the right claim, the rationale names what
  the rule asks for.
- **A page against the pool.** For every page a claim of the branch cites,
  the judge — already holding that page for the first question — reads it
  the other way round and asks whether everything on it that the pool's
  rules make a claim is one: every sentence of every recommendation the
  source marks on the page has a claim, sharing its number where the source
  numbers it (§3.1: a marked recommendation of two sentences is two claims),
  every body-text sentence that passes the rule's gate is a claim with its
  edge (§5), every alternative of an "entweder … oder" is a claim of its own,
  every claim of a marked recommendation supports or contests a statement,
  and every body-text claim has its one edge — a body-text claim supports no
  statement, the rule of §5 gives it the edge instead. What "marks" means is
  read off the source, never assumed: a numbered, shaded box in one
  guideline, a numbered statement, a bulleted "offer", a sentence with a
  grade letter in another; the schema's `kind: recommendation` with whatever
  number, grade and consensus the source prints is the unit, and the judge's
  questions are stated over that, not over any one layout. The page is the
  scope, not the chapter: the branch cited it,
  so the branch answers for it, and no declared range is needed. What a
  package promised — a chapter, a section of the source's outline — is the
  package's verification, read from the judge's report, not a finding the
  judge attests on its own; a page nobody cited is read by nobody.

The subjects of a run are the entities and edges the branch adds or changes
against `main`, plus every statement whose evidence the branch changes — a new
`supports` edge re-opens the second question for its statement — plus every
page those claims cite, for the fourth. The judge
reads the source, the pool and the rules of this document, and nothing else:
no other guideline, no textbook, no medical judgement. It judges the
extraction against the page, never the guideline against medicine; a claim
that faithfully carries a recommendation the judge would disagree with is
consistent. Nothing in it names a guideline, a grading scheme or a concept —
the four questions are stated over the schema's properties and this
document's rules, and the same four are asked of every source (memory
`generic-over-guidelines`).

**What it writes.** One attestation per subject read, by the judge, shaped as
§8 says: `subject` the claim, the statement or the edge; `subject_hash` its
canonical hash at the head the judge read, so that a changed subject stales
the finding; `scope` `content` for a claim and an edge, `with_evidence` for a
statement, so that a further supporting claim re-opens the question; `date`;
and `claim` one of two. The fourth question has no subject of its own — what
is missing does not exist to be pointed at — so its finding lands on the
**source**, at the page the proof names, with a scope that covers the source
together with its current set of claims and their edges, the way
`with_evidence` covers a statement with its evidence: the claim that fills
the gap changes that set, and the finding goes stale by itself. That scope,
like the agreement word, is a word the schema does not yet carry (the schema
follow-up). `disputed` where the reading found a discrepancy. Where
it found none, a word that says *a software agent read the subject against its
ground and found it consistent* — `validated` is the quote check and pins a
source hash, `expert_reviewed` is a person's and may not be signed by software
(§8), so agreement needs a word of its own, which the schema does not yet
carry (a follow-up card on the board). Agreement is recorded, not only
dispute, because review state is derived (§8): a subject nobody has judged and
a subject judged consistent must be told apart, and a judged subject that then
changes must show as unjudged again — which only an attestation with a hash
does. `proof`, free today, carries what makes a finding traceable and
repeatable: the definition the judge ran as and its hash, the model that read,
the properties it checked and, for a dispute, the property the finding
concerns (§2's property address, `claims/<id>/grade`) with one sentence saying
what the page, the claims or the rule say instead — in the source's language,
`lang`-tagged, like every text in the pool. A page finding is a list, not a
sentence: one entry per sentence without a claim, each with the page, the
marked recommendation it belongs to and the test it passes, quoted verbatim. For a claim it also pins
`source_hash`, the content hash of the source it read. There is no signature:
the judge holds no key (below); the run is what the proof identifies.

**What the judge is.** The judge is a subagent definition, one file under
`.claude/agents/` — the agent-governing directory `CLAUDE.md` describes — and
the file is the whole of the judge: its frontmatter pins the model and limits
its tools to reading (the diff, the pool, the source's extracted text, this
document), and its body is the three questions above, stated once, over the
schema's properties. The judging is done by a model, so the definition is
what a prompt and a tool would otherwise be, and its identity is the file's
own: the `proof` of every attestation records the definition's git blob hash
as the prompt hash and the frontmatter's model as the model, so a finding
stays traceable when either changes. What a model should not do is done by a
small deterministic helper under `tools/`, run like the validator: it computes
a subject's canonical hash (§2), mints the attestation's id, checks the
finding against the schema and writes the file under `data/attestations/`.
The judge decides; the helper records. Neither holds a credential: in the
sandbox the session's own model reads, authenticated by the host like every
call the session makes (`.claude/rules/environment/git-identity.md`).

**Where it runs, and how its findings reach the pool.** Twice, and the two
runs have different jobs:

1. **The session runs it before proposing.** The `process-work-package`
   skill's coordinator runs the judge over the branch's diff against `main`
   as the last step before the pull request, after the validator (§11,
   rule 9), and commits its attestations in the pull request, on the judge's
   behalf. Until the helper and the schema's words exist, the report alone
   goes into the pull request description, under a heading of its own. The
   findings are then in the diff the reviewer reads, next to what they are
   about, before the merge; an attestation is data like everything
   else and reaches `main` the only way data does, through a pull request a
   person approves.
2. **A workflow runs it on every pull request** — committed by a person, with
   the read-only token, like the validator's (`README.md`, "Checks") — and
   puts its report in the run's summary: the same definition, run headless
   against the same diff by the same model behind a repository secret, read
   again. It writes nothing anywhere: not to the branch, not to `main`, no
   comment, no review. Its report beside the committed attestations is what
   tells the reviewer whether the session's run and an independent run agree;
   where they differ, the reviewer reads the page. The check fails only when
   the judge could not run; a dispute is a finding, never a failure.

The alternatives, and why not. A follow-up pull request carrying the findings,
opened after the merge, would keep the judge's word out of the author's commit
— but it would arrive after the review it exists to inform, and only an actor
with write access could open it, one per merged pull request. The run's
findings offered as an artifact for a person to commit would be honest about
who holds what, and a step nobody takes at thirty claims a pull request. A
standalone tool with its own prompt, model client and key, run by the session
and by the workflow, would be a second copy of the three questions to keep
honest, with a key the sandbox does not hold; one definition, read by the
session's model here and by the workflow's there, keeps one text of the rule
and gives the second run its independence by being a second run. Committed by
the session, an attestation's authenticity rests on the second run and on the
reviewer, not on a signature — the trade-off this design accepts, because the
judge's finding is a reading, not a proof: two runs of a model can differ, and
a disagreement between them is information for the reviewer, never a verdict.

**What it must not do.** The judge never approves, merges or blocks: a dispute
lowers a derived status and lands in the report, like staleness (§8) — it is
not *invalid*, and it stops nothing. It never edits: no entity, no edge, no
label, no supersede (§7); it says what it read, and a person or an agent's
package acts on it. It never sets a review state, and never writes `validated`
or `expert_reviewed`: the first is the quote check's, the second a person's —
which claims a software agent may make is a role on the agent (§8), and the
schema follow-up gives the validator the rule that `expert_reviewed` is never
`by` software. It never judges what it was not given: the diff and its ground.
And it never writes to the board, opens a card or comments on a pull request:
its only output is the attestation and the report. Of a gap it finds it says
which sentence on which page has no claim; it never mints the claim.

**The report has three parts, and only the first is attestations.** Consistent
and disputed are the two words a finding can carry. A run also meets what the
rule as written does not decide — a sentence the gate excludes that a later
clause admits, two cues of the rule pointing opposite ways on one sentence, an
instruction whose verb the rule does not list. That is not a finding about the
subject; it is a finding about the rule, and it goes into the report's second
part, *undecidable*, with the sentence, the page and the two readings, for the
package that owns the rule to settle. Nothing under it becomes an attestation:
an undecided subject is unjudged, not consistent, and its row in the report
says so in that one word. The third part is *noticed*:
what the judge saw on the page or in the pool outside its four questions — a
property the schema carries and the claim lacks, a requirement this document
states and the schema cannot express. It is written down because a reader was
there, and it is never a finding, because the judge judges only what it was
given (above); a person decides whether it becomes a card.

**The agent.** One entity, `agents/<judge-id>`, for the role — the automated
review — not for a model: which model read, as which definition, is in each
attestation's `proof`, so a finding stays traceable when the model changes and
the agent does not multiply. Its identity claims name the definition file and
the workflow that runs it; it has no key.

**Worked example** — the first source, whose form for a marked recommendation
is a numbered, shaded box: box 6.7 on p. 63, as the pool holds it.
A branch adds the box claim `claims/pomgat-lv-1.0/6b9239a9` ("Nach
Pankreasresektion kann die abdominelle Drainage im frühen postoperativen
Verlauf (bis 4. postoperativer Tag) gezogen werden, wenn …", grade 0, `kann`,
`for`, starker Konsens, section 6.1.3), its `supports` edge to
`statements/fruehe-drainageentfernung-pankreasresektion`, and the criterion
`claims/pomgat-lv-1.0/8349aa77` ("unter 5000 U/L am ersten postop. Tag",
p. 64) with a `refines` edge to the box claim. The judge asks the first
question of the box claim on p. 63 — one sentence; `kann`, `for`, "0",
"Starker Konsens", "6.7", "bis 4. postoperativer Tag", all as printed — and
the helper writes:

```yaml
- id: attestations/<n>                        # sequential (§2) — see docs/open-questions.md
  type: attestation
  subject: claims/pomgat-lv-1.0/6b9239a9
  subject_hash: "sha256:…"                    # the claim's canonical form at the head read
  scope: content
  claim: consistent                           # the word the schema does not carry yet (§8.1)
  by: agents/<judge-id>
  date: 2026-09-21
  source_hash: "sha256:029c…"                 # the source it read
  proof: {type: judge_run, definition: ".claude/agents/judge.md", prompt: "sha256:…",
          model: "<model>",
          checked: [label, kind, grade, verb, direction, consensus, recommendation_no, section]}
```

Of the statement it asks the second: the label is the box's sentence, the
slots name Pankreasresektion, frühe Drainageentfernung, geringes
Pankreasfistelrisiko and postoperativ, each in the sentence; the short label
keeps the condition — consistent, `scope: with_evidence`. Of the edge it asks
the third, on p. 64, against the rule in the shape its package drafts: the
guideline's own voice, about the box's own action, a value the box's "wenn das
Drainagesekret … hinweist" needs and the reader cannot supply, nothing taken
out — `refines`, to the box claim whose wording carries the term, and the
criterion carries no grade: the kind and the target hold. But the edge carries
no `rationale`, and the rule asks for one naming the test and the term; the
finding is `disputed`, its proof naming the property and saying, in German,
`"Die Kante nennt keinen Test und keinen Begriff (§5: refines, Drainagesekret
… hinweist)."` Were the box claim's grade "B", the first attestation would
instead be `disputed` at `claims/pomgat-lv-1.0/6b9239a9/grade`: `"Seite 63
druckt Empfehlungsgrad 0, nicht B."` Of p. 64 it asks the fourth: the
sentence the criterion is quoted from lists three alternatives — "entweder
eine Amylase-Konzentration … unter 5000 U/L am ersten postop. Tag, oder …
unter 5000 U/L am postop. Tag 1 und 3 sowie Drainagemenge unter 300 ml/Tag
oder aber Amylase … kleiner als das Dreifache der Serumkonzentration am
postop. Tag 3" — and the pool holds a claim for the first alone; the page is
`disputed` on `sources/pomgat-lv-1.0` at page 64, the proof listing the two
sentences without a claim, each with its box (6.7) and its test (refines).
Nothing in the pool changes either way: the linking pass that reads the
findings does.

This example was run once, on 2026-09-21, as a read-only session subagent
briefed with the four questions and the rule in its draft form, writing
nothing. It found what is written above, and one gap more that the example
had not seen: the summary sentence of p. 63 refines box 6.6 ("insbesondere
bei Risikoanastomosen eines weichen Pankreas") and is no claim — found because
the judge reads the page, not the box it was pointed at. Its undecidable part
held three entries about the draft rule; its noticed part, two. Four subjects
and two pages took about four minutes.

---

## 9. One schema

`schema/schema.yaml` is the single schema for the whole pool. Views own nothing,
so there is nothing for a per-view schema to govern. Instead:

- the schema declares the **namespaces**, the **node types** with their
  properties and provenance requirements (§6.5), the **edge kinds** with the
  types they may connect, the **slot shapes** of statement types, and the
  **structural validations** a view kind must pass at cut time (§4);
- schema changes land **before** the data that uses them (§7);
- the schema is versioned by its own history like everything else;
- the schema is a **JSON Schema** (draft 2020-12, written in YAML), so a standard
  validator library checks every data file against it and editors can validate on
  save. What JSON Schema has no keyword for — provenance requirement levels, identity
  strategies, which file holds which definition, view filters, cut validations — is
  carried as `x-` annotations in the same file, so it stays the single point of
  truth; `tools/validate.py` reads those annotations for the cross-file checks
  (references resolve, claim ids hash correctly, edges are unique) that a document
  schema cannot express.

What a pathway needs a kind for — its node types, its edge vocabulary, its
completeness rules — is a *view kind* inside the one schema.

---

## 10. Illustration: a guideline's drainage recommendations

A slice of real content in the shape the rules above imply — the source is the
POMGAT S3 guideline (AWMF 088-010OL), quotes verified against the document.

```yaml
# ── source ────────────────────────────────────────────────────────────────
- id: sources/pomgat-lv-1.0
  type: source
  lang: de
  title: "S3-Leitlinie Perioperatives Management bei gastrointestinalen Tumoren (POMGAT), Langversion 1.0"
  awmf_register: "088-010OL"
  url: "https://register.awmf.org/assets/guidelines/008-010OLl_S3_Perioperatives-Management-bei-gastrointestinalen-Tumoren-POMGAT_2023-12.pdf"
  content_hash: "sha256:…"
  license: "© Leitlinienprogramm Onkologie; referenced, not rehosted"
  structure: [chronologisch_perioperativ, anatomisch, modalitaetsbezogen]   # how the document is organised (§6.7)
  outline:                                                                  # its complete table of contents
    - {section: "6.1",   title: "Intraoperative Einlage einer Drainage in das OP-Feld", page: 58}
    - {section: "6.1.3", title: "Pankreas", page: 61}
    # … every numbered section, those without a recommendation included

# ── claims (phase one: deterministic, verifiable against the source) ──────
- id: claims/pomgat-lv-1.0/7c31a2f0        # hash over (locator, quote); validator-checked
  type: claim
  lang: de
  kind: recommendation
  recommendation_no: "6.5"
  section: "6.1.3"                          # where in the document (§6.7); must be in the outline
  label: "Nach Pankreasresektion kann eine intraabdominelle Drainage erwogen werden."
  grade: "0"
  verb: kann
  direction: for
  consensus: starker_konsens
  source: {at: sources/pomgat-lv-1.0#page=61, quote: "kann die Einlage einer intraabdominellen"}
  provenance:
    consensus: {at: sources/pomgat-lv-1.0#page=61, quote: "Starker Konsens"}

- id: claims/pomgat-lv-1.0/e945b1d8
  type: claim
  lang: de
  kind: recommendation
  recommendation_no: "6.7"
  section: "6.1.3"
  label: "Nach Pankreasresektion kann die abdominelle Drainage früh entfernt werden, wenn …"
  grade: "0"
  verb: kann
  direction: for
  source: {at: sources/pomgat-lv-1.0#page=63, quote: "kann die abdominelle Drainage im frühen postoperativen"}

- id: claims/pomgat-lv-1.0/1f80c3aa
  type: claim
  lang: de
  kind: criterion
  section: "6.1.3"
  label: "Drainageamylase unter 5000 U/L am ersten postoperativen Tag"
  source: {at: sources/pomgat-lv-1.0#page=64, quote: "unter 5000 U/L am ersten postop. Tag"}

# ── semantic layer (phase two: linking, all modelling) ────────────────────
- id: concepts/pankreasresektion
  type: concept
  lang: de
  label: "Pankreasresektion"
  facet: procedure                          # what kind of thing it is (§3.2), not its role
  source: modelling

- id: concepts/pankreaskopfresektion
  type: concept
  lang: de
  label: "Pankreaskopfresektion"
  facet: procedure
  source: modelling

- id: statements/fruehe-drainageentfernung-pankreasresektion
  type: statement
  lang: de
  label: "Nach Pankreasresektion kann die abdominelle Drainage früh (bis 4. postoperativer Tag) entfernt werden, wenn das Drainagesekret ein geringes Pankreasfistelrisiko anzeigt."
  short_label: "Frühe Drainageentfernung bei geringem Fistelrisiko"   # for a box; at most 60 characters
  slots:
    population: concepts/pankreasresektion
    action: concepts/fruehe-drainageentfernung
    condition: concepts/geringes-pankreasfistelrisiko
  source: modelling

# ── structure (the pathway arranging the statements) ──────────────────────
- id: pathways/pomgat-drains/removal_q
  type: decision
  lang: de
  label: "Frühe Drainageentfernung möglich?"
  source: modelling

# ── edges (derived ids; endpoint hashes recorded for staleness) ───────────
- [claims/pomgat-lv-1.0/e945b1d8, supports, statements/fruehe-drainageentfernung-pankreasresektion, {source: modelling}]
- [claims/pomgat-lv-1.0/1f80c3aa, refines,  claims/pomgat-lv-1.0/e945b1d8, {source: modelling}]
- [concepts/pankreasresektion, codes_as, ops-2026/5-52, {source: modelling}]
- [concepts/pankreaskopfresektion, broader, concepts/pankreasresektion,      # subsumption (§5): groups and folds, inherits nothing
   {source: modelling, as_of: "2026-09-10", lang: de, rationale: "Die Pankreaskopfresektion ist eine Pankreasresektion."}]
- [pathways/pomgat-drains/removal_q, about, statements/fruehe-drainageentfernung-pankreasresektion, {source: modelling}]

# ── a view: the pathway as a citable unit ─────────────────────────────────
- id: views/pomgat-drains
  type: view
  view_kind: pathway
  filter: {pathway: pathways/pomgat-drains, closure: [about, supports, refines, codes_as]}
  cuts:
    - {cut: 1, as_of: "<commit>", members_hash: "sha256:…", validated: true}
```

Things to notice: the grade sits on the *claim*, extracted verbatim from the
recommendation box, and the statement carries no grade at all — its effective
grade is derived; the criterion is a claim of its own, related by an edge, never
inheriting the grade; where in the document a claim was found (`section`) sits on
the claim and nowhere else, and the outline that makes it checkable sits on the
source; the classification code is a URL; the head resection is a special case
of the resection by an edge that carries a reason and no evidence, so a
recommendation about one says nothing about the other; a second guideline
discussing early drain removal would add claims and `supports`/`contests` edges
to the *same statement* — the statement's evidence grows without the statement
changing; and the view's cut, not any entity, is the thing a publication would
cite.

---

## 11. Rules of conduct for agents writing to this repository

1. **Read before writing.** This file, the schema, then the existing entities in
   your namespaces. Do not add types, kinds or properties the schema does not
   know.
2. **Extract first, link second.** Phase one mints claims — mechanical,
   verifiable line-by-line against the source. Phase two links them to the
   semantic layer — judgment, all `modelling`. Keep the phases apart; ideally
   they are separate, separately reviewable changes.
3. **Search before minting.** Before creating a concept or statement, look for
   an existing one, and for a codable one. Mint only what no terminology and no
   existing entity covers; flag near-duplicates for review instead of deciding
   sameness silently.
4. **Contest, never overwrite.** A source that disagrees with existing content
   is new claims plus `contests` edges — both sides sourced, conflict surfaced.
   Editing an entity asserts a correction within the same editorial line, and
   nothing else. Recency resolves nothing.
5. **Every statement needs provenance.** If the source says it, cite the passage
   with a verbatim quote you have verified at that location. If the source does
   not say it, write `modelling`. Never guess a page.
6. **Underestimate, never upgrade.** Content without a formal rating in the
   source gets none in the graph. Grades live on claims; derived values are
   computed, not written.
7. **Prefer an explicit gap to an invented answer.** If the source says "no
   recommendation possible", model the gap; if it is silent, leave nothing.
8. **Keep identifiers stable.** Renaming or removing an entity is a reviewed,
   history-preserving change; other entities point at it.
9. **Run the validator** and treat its output as the review's first comment. A
   change that does not validate is not proposed.
10. **Do not set review status.** Agents submit content; attestations decide
    status. An agent never writes a review state or signs on behalf of a person.

---

## 12. Relation to established conventions

The model is a labelled property graph with linked-data identifiers and
W3C-style provenance. The mapping:

| concept here | convention |
|---|---|
| entity with URL, `type` | Linked Data: resources have IRIs, `type` is `rdf:type` |
| `(from, kind, to, props)` | labelled property graph (GQL / openCypher / Gremlin) |
| claim (locator + verbatim quote + content) | nanopublications; W3C Web Annotation (`SpecificResource`, `TextQuoteSelector`); PROV-O `wasDerivedFrom`; PDF locators per RFC 8118 |
| statement with slots, evidence derived | Wikidata statements with references and ranks; SKOS for the concept layer |
| view, cut | RDF named graphs / datasets; a cut is a versioned release of one |
| `modelling` | PROV-O `wasAttributedTo` with no `wasDerivedFrom` |
| codes as nodes, coding as edge | SKOS mappings; FHIR `Coding` |
| `broader` between concepts, no inheritance | SKOS `skos:broader` (a thesaurus relation, not a subclass axiom) |
| `section` on the claim, `outline` on the source | W3C Web Annotation selectors on the source; document structure kept in provenance, never as resources |
| agents, attestations, proofs | PROV-O agents; W3C Data Integrity proofs |
| one schema | SHACL/ShEx shapes plus application-level checks |

No inference semantics are assumed: relations are asserted, not entailed.

---

## 13. What this approach deliberately leaves open

- **File format and layout.** YAML as shown, but anything that round-trips to
  the same entities and tuples is acceptable; one entity per file is a
  diff-ergonomics choice, not a rule.
- **The view-filter language.** The schema starts with a minimal set of filter
  forms, extended one proven need at a time (the section filter, §4, is the
  first); how far it grows toward a query language is undecided
  (`docs/open-questions.md`). A view's `group_by` (§4.1) is not a filter form:
  it selects nothing and only says how the members are grouped.
- **Statement slot vocabularies and grade derivation.** Which slot shape each
  statement type needs, and how supporting claims' grades compose, are open —
  they are medically sensitive and will be settled against real content.
- **Export projections.** FHIR, RDF, diagram formats — generated from the
  data, never authored. The website is the first such projection; its design
  is `docs/publication.md`.

---

## 14. What the environment bounds

Sources are referenced, never committed and never rehosted — the repository and
its links to public sources are the only assets (`README.md`; the reasoning in
`.claude/memory/design/sources-referenced-never-rehosted.md`). A quote is
therefore checked against a source when an agent has the downloaded bytes at
hand — at extraction, or on a re-fetch — and the check is recorded as a
`validated` attestation (§8), which is the durable evidence once the copy is
gone. If a public source later changes or vanishes, its content hash detects
this loudly, stale attestations downgrade the affected items, and the graph
degrades to "verified, on record" — never to unfalsifiable.

The environment itself is described once, elsewhere: `README.md` for
contributors, `.claude/rules/environment/sandbox-environment.md` for agents.

---

Version 0.4 · 2026-09-10
