# Graph Representation — how knowledge is stored in this repository

> **Status: design intent, partly enforced.** The schema (`schema/schema.yaml`,
> currently 0.11.0) exists and `tools/validate.py` enforces it, locally and in CI
> (`CLAUDE.md`, "Checks"): ids, enums, provenance requirements, claim hashes, slots,
> edges, a claim's `section` against its source's `outline`, `broader` without
> cycles, and with `--verify-quotes` every quote against its source. The pool uses
> all of it: one source with its outline, its claims with sections, statements and
> concepts with short labels, every concept with a facet, a `broader`
> hierarchy over the patient groups, and grouping axes (§4.1): the `axes/`
> entity with its placements, the validator's axis rules, the feasibility
> report (`tools/axes.py`), the hierarchy axis that draws the first view's
> patient-group tree and one dimension axis, both asserted and offered by that
> view, and the chapters as the built-in grouping. The scope tree (§4, §5 `in_scope_of`) is
> in the schema and the validator, and the first view declares one, rooted in its
> guideline's patient target group. Everything else described as checked or
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
language (`versorgungspfad`, `modalitaetsbezogen`). A claim's grade, verb, basis
and consensus are no schema vocabulary: they are the words its source's grading
scheme declares (§3.1), a consensus class slugified from its printed name
(`starker_konsens`). Translation is a build-layer concern, never a data
concern.

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
`kind` names the place's form, the first that holds: it declines to recommend →
`gap_notice`; it instructs an action → `recommendation`; the source marks it as
a definition → `definition`; it states which cases, values or thresholds a term
covers → `criterion`; otherwise → `fact`.

A claim's **`label`** is the sentence at its quote as printed — for a table,
the row or group §5.1 K reads ("Kopf: Zelle; …") — with its **reference marks
left out**, and an evidence `key` (below) is read the same way. A reference
mark is a number, or a range of numbers, that the source prints to point into
its own reference list: glued to a word ("erfolgen55", "Caironi et al.249"),
set in brackets ("[274]", "[14,15]", "[73–75]") or in parentheses ("(19)").
Only the mark goes, with any spaces and commas whose only job is to separate
marks; the sentence keeps its own punctuation ("erfolgen55, daher" →
"erfolgen, daher", "verringert werden [274], [275]." → "verringert werden.")
and the words around the mark — an author ("Caironi et al."), an attribution
("nach Apfel 1999"), a cross-reference ("vgl hierzu auch 2 weitere S3
Leitlinien"). A number that is a value stays, wherever it stands and however
it is set: "HA330", "SpO2", "mm3", "Vitamin B1", a bracketed interval ("95% KI
[1.67, 2.58]"). Its form does not tell a mark from a value, so which number is
a mark is a reading of the sentence and of the source's reference list, which
the judge checks (§8.1) and the validator does not. The quote keeps a mark
where its passage holds one (§6.2); the quote and the link into the page are
the way back to the reference, which the pool does not hold.

Within a **marked recommendation** (§5.1) the unit is the **sentence**, not the
box: every sentence of the box is a claim, whatever its form, sharing the box's
`recommendation_no` and its `section` — the section the box lies in, never its
number (memory `box-granularity-per-sentence`). Beside its own claim, a
sentence yields a narrower one for a rule printed inside it, for each member
a rule's connective joins and for a half a „sondern“ joins, and for nothing
else (below). A lead-in that introduces items
each of which is a full sentence with a predicate of its own ("… folgende Werte
herangezogen werden:") is no sentence of its own: each item is a claim,
labelled as printed, and what the lead-in says of every item ("Orientierend")
each item's statement keeps, the pass naming it in its pull request. A box
the source adapts or quotes from another work is its marked recommendation
like any other, and its kind line, origin and status words ("Adaptierte
Empfehlung", "zitiert nach …", "Neu …") stay on the page (open question
origin-and-status-labels). What the box prints once belongs to its sentences
by one rule:

- the **grade** to each sentence of recommendation or gap-notice form, whatever
  its wording — a remark that instructs in another wording than the grade's
  carries the grade the box prints. Where the box prints one grade per wording
  ("A/B"), each such sentence carries the one whose wording its verb is, and
  one with none of those wordings carries none. A fact, criterion or
  definition carries no grade: it recommends nothing. A box whose grade cell
  prints no grade — a word naming the box's type in its place — gives its
  sentences none;
- the **consensus**, with its share where printed, to every sentence: the vote
  was on the box;
- the **basis**, where the box prints one beside its grade or in its place,
  to every sentence, a fact's too: like the vote, what the box rests on is said
  of the box;
- the **verb** is the sentence's own, never the box's, read off its
  predicate (`verb`, below);
- in a box the source marks as a definition no sentence is a `recommendation`:
  it is a `definition` where it says what the term is, a `criterion` where it
  says what establishes it ("… ist ein Anstieg … um ≥ 2 Punkte zu verwenden").

Where a box prints its grade, basis and consensus once per **lettered part**
("a)", "b)"), each part's sentences take that part's by the same rule, and
none takes one from another part: the box stays the unit, its number theirs
and the letter in their labels.

A sentence of recommendation form supports a statement of its own — one per
action where it instructs two, in two predicates ("… befragt und … beraten
werden") or in a clause instructing a second ("wobei … geprüft werden sollte");
a predicate that says how the other's action is to be done ("… und soll sich an
den jeweiligen Leitlinien orientieren") instructs none of its own, and the
claim keeps one verb. A gap notice stays unlinked (open question gap-notices).
A fact or criterion sentence supports the statement of the box sentence it
extends, restricts, fills or gives the reason for — a remark qualifies the
sentence it follows, a "dies" or "davon" the one it names —, and a statement of
its own only where it states another action or comparison, or the box holds no
recommendation; a sentence whose subject is the evidence and that says only
what the evidence shows ("Die Daten … sind widersprüchlich") asserts no action
or comparison a statement could hold, and stays unlinked. A definition
sentence, and a criterion of a marked definition, supports none: the concept it
establishes reaches it by `defined_by` (§5).

A **rule printed inside a box sentence** — a parenthesis or a qualifier that
states which cases a term covers: a threshold or a range in parentheses, a
duration qualifying the group, a score's bound ("bei einem … Score von ≥2") —
is a **criterion claim of its own**, a narrower place in the sentence quoting
the qualifier's words and labelled with them, as each member a connective
joins is (below). It takes what the box gives every sentence of it — its
`recommendation_no`, its `section`, the consensus and the basis —, no grade,
being a criterion, the threshold it prints or the combination where it joins
parts, and supports no statement; the concept the qualifier gives reaches it
by its one `defined_by` edge, and so is derived (§3.2). The sentence's own
claim keeps the whole sentence, the qualifier in its label, and its statement
stays as it is. A **sentence of two directions** is read the same way: where
it joins two halves by „sondern“ and prints each with its own case and
direction ("… NICHT zur Behandlung eines Volumenmangels, sondern ausschließlich
entsprechend den Indikationen … einzusetzen"), each half is a claim with its
own direction — the sentence's claim the half it opens with, and a narrower
place quoting the other —, both with the box's grade, consensus and number
and the verb of the predicate they share, each supporting a statement of its
own. Where the box's grade fixes a direction (below), a half of the other
direction cannot carry that grade: it stays in its sentence's claim and its
statement's label. What a „nur“ only implies ("… nur bei vorliegenden
Risikofaktoren …": and none without them) is no half and is not recorded.
Decided on 2026-10-10 on the maintainer's delegation (card #328), settling the
open questions rule-claim-granularity and two-directions-in-one-sentence. Which
places outside the marked recommendations become claims, and how they attach,
is the rule of §5.1.

A claim's **grade, verb and consensus are read in its source's own grading
scheme**, and the source declares that scheme as data: `grading_scheme` on the
source entity, quoted from its method table. One guideline grades A, B and 0,
worded *soll*, *sollte* and *kann*; another grades *Stark* and *Schwach*,
worded *Wir empfehlen* and *Wir schlagen vor*; a third prints arrows, ⇑⇑ to
⇓⇓; a fourth will say "offer" and "consider". The declaration lists the
**grades** in the order the legend follows — the table's rows, in the table's
order —, each as the recommendations print it, with the table's description,
the **wording** the table gives it (`verb`), that wording's **negated** form as
the source prints it ("empfehlen nicht", "schlagen nicht vor" — never the verb
followed by "nicht"), and whether the table makes it an **open**
recommendation, one that weighs rather than advises for or against. Each
scheme declares the negated form its own pages print, in the table or in a
recommendation of that grade; a form none prints is `modelling`. Where the
table prints an open grade with two wordings, one for and one against ("kann
erwogen werden/kann verzichtet werden"), its wording is the modal, the form
every other row gives, and the against-form is its negated form.

Where the **symbol carries the direction** — an arrow up, an arrow down — the
grade **fixes** it (`direction`): every claim of the grade records that
direction. Two grades of one scheme may then share a wording, one for and one
against (⇑ and ⇓ both "sollte"), if they read it alike, open or not and with
one negated form; two grades that fix the same direction, or one that fixes
none, never share a wording, and an open grade fixes none. A letter two rows
share is quoted with its rows and kept in no field: a claim carries the symbol
its box prints, and nothing is mapped inside a scheme either. A grade that
fixes no wording — an expert consensus whose strength its wording carries —
has none and follows the graded ones.

A token the recommendations print **beside the grade**, or in its place, for
what a recommendation rests on ("EK" beside an arrow, an expert consensus with
the strength the arrow gives) is no grade but a **basis**: the scheme lists it
under `bases`, quoted where the source prints it and where it says what it
means, and a claim carries it as `basis`. The declaration lists the
**consensus classes**, each with its bounds as printed and, where the source
prints shares, those bounds read as numbers; a source that prints only shares
and names no class declares none. Every entry quotes the source's own pages,
and every word of a grade, a wording, a negated form, a basis or a class lies
in one of its quotes — a symbol as a whole token, never inside a longer run of
symbols (⇑ is not printed in "⇑⇑"); a form the source prints nowhere is
`modelling`, with a rationale. A claim then carries:

- `grade` as printed, one of the grades its own source declares; where the
  page's text layer gives another character than the rendered page shows (a
  font's private character for an arrow), the grade the page shows, its
  provenance quoting the text layer, and the scheme entry's rationale naming
  the boxes;
- `verb`, for a sentence of recommendation form, read off its **predicate**:
  the finite modal of the clause that instructs its action — as a rule the
  main clause; a dependent clause where only that one instructs, as for a
  member §5.1 K quotes from it — and the participle or infinitive it governs,
  never an attributive participle ("die empfohlene …"), a noun ("Empfehlung")
  or a clause that does not instruct the action. In the form a scheme gives
  it ("sollten" is `sollte`), the verb is
  the first that holds: (1) a word of the predicate its own source's scheme
  gives as a wording, the finite modal winning where there are two ("soll …
  empfohlen werden" is `soll` under a scheme worded *soll*, `empfehlen` under
  one worded *empfehlen*); (2) a modal another declared scheme gives (a
  *sollte* in a guideline graded by GRADE); (3) another declared scheme's
  wording the predicate prints ("wird … nicht empfohlen" under a scheme worded
  by modals is `empfehlen`, against); (4) none. It is read in its own source's
  scheme if that defines it, otherwise in the schemes that do, which must read
  it alike (open or not, one negated form);
- `direction`, `for` or `against`, as the sentence reads; under a grade that
  fixes a direction, that one, the statement's action being what the sentence
  says to do ("auf Tabakkonsum zu verzichten" under an arrow up is the
  abstinence, `for`);
- `basis` as printed, where the box prints one, one of the bases its own
  source declares;
- `consensus`, a class of its own source's table; and where the source prints
  the share of votes rather than a class, `consensus_share` as printed
  ("95 %") beside it, the class being the one the table gives that share,
  with provenance naming both the line that prints the share and the table's
  row; where the source names no class, the share alone.

The validator checks each against the declaration — a direction against the
one its grade fixes —, and a printed share against its class's bounds.
Nothing is mapped between schemes: a *Stark* is
not an *A*, and a 95 % is *Konsens* where the table starts *Starker Konsens*
above 95 %. What the site shows is read from the declaration too: the order of
the grades, the words and their negated forms, and the direction — a claim
whose grade fixes a direction is *für* or *gegen* by it, one whose grade is open
weighs (*abwägen*); otherwise a claim whose verb is the wording of an open grade
weighs, any other recommendation is *für* or *gegen* by its direction —, and which grades carry
their verb is decided per scheme, never across two (`docs/publication.md` §3).

How binding a recommendation is (`grade`, `verb`) and how certain the evidence
behind it is are two different facts, and a source may state the second per
outcome — *hoch* for one endpoint, *sehr niedrig* for another — or per row of
another kind: a component of the action, a subgroup, an arm, a comparator, a
device, a regimen. A claim carries it as **`evidence`**: a list of entries, one
per row of the recommendation's **evidence block** — what the box prints for the
certainty of its evidence, under whatever heading — and per endpoint where a row
names several, in its order, each the rating in the words of the system that
made it (`value`, `system`: GRADE, Oxford, the ESC levels, whatever the source
used), the outcome concept it applies to where the row names an endpoint
(`outcome`), and the row's **`key`** as printed where the row names anything
else ("Sepsis-Screening", "Septischer Schock", "Dopamin", "HAT", "oXiris®"), its
reference marks left out as a label's are (above). The key is a string, never a
concept and never a kind: rows keyed by comparator and rows keyed by subgroup
are told apart by the words they print, and no vocabulary of row kinds exists
for the next source to break. A row naming both, an endpoint for a device
("Mortalität oXiris®") or under a comparison ("CRRT vs. IHD" above
"Mortalität"), carries both; what qualifies the endpoint itself — its time frame
("Mortalität (30 Tage)"), its setting ("ICU Mortalität") — belongs to the
endpoint and is no key. **A component, a subgroup or a comparator is never
recorded as an outcome**: an `outcome` is a concept of facet `outcome`
(validator). The key also keeps apart rows that would otherwise be the same
entry — three devices rated *Sehr niedrig* for one endpoint — so no two rows the
source prints become one entry. A row that rates **several names under one
rating** — several agents, comparators or other things that are no endpoint — is
one entry, and its key lists the names of what the rating covers, as printed and
in printed order, joined by ", ": without the effect data printed between them
(effect sizes, intervals, ranks, a certainty repeated in words), and without a
name the row mentions only to say that nothing reports on it, which the rating
does not cover. It is the one case where a key joins words the page prints
apart; one entry per row keeps the count the card shows equal to the page's, and
the key tells the reader what each rating covers. A row that rates **several
endpoints under one rating** gives one entry per endpoint, in printed order,
each with the row's value and system and, where the row prints any, a key of the
names it prints for that endpoint — also where the row names nothing but its
endpoints, however its label joins them: every endpoint stays an `outcome`, and
every quote stays paired with its entry. A row worded as a **result or an aim**
of its endpoint ("Reduktion des PONV-Risikos") rates that endpoint: its
`outcome` is the endpoint the label names, the words that state the result or
the aim are effect data and go into no field, and a setting that belongs to the
endpoint stays with it, as its time frame does. The `value` is the system's word
**as printed**, "Moderat" where the box prints it capitalised: the case is the
print's, not a second level, and a consumer compares the values of one system
without regard to it. A **range** printed as the rating, from one level to
another, is one value, as printed, on every entry of its row: never split into
two entries, never paired level by level with the row's endpoints, never
composed into one of its levels. Words printed beside a level that only say what
it covers are no part of the value: an entry without an `outcome` already says
that its rating holds for the row as a whole. Where the source prints a rating
twice, as a word and as symbols (⊕⊕⊕⊝), the value is the word. **Where the two
disagree, both are recorded and neither is chosen**: the word as the entry's
value, and the symbols as a claim of their own — kind `fact`, the row read as
§5.1 K reads a table, its head and the symbols ("Hämodynamische Instabilität:
⊕⊕⊝⊝"), quoting the row from its head to the symbols ("Hämodynamische
Instabilität: Sehr niedrig ⊕⊕⊝⊝"), because the same symbols recur on a page
(§6.2), with the box's `recommendation_no` and `section` and nothing else the
box prints — which `disagrees_with` joins to every claim that carries the row,
its rationale quoting the word and the symbols (§5). A
rating the body text gives otherwise than the box is the same disagreement (§5.1
D). Two rules keep the field honest. **A value is never mapped between
systems**: GRADE's *hoch* is not an Oxford level, and no table in the schema,
the validator or the build says otherwise. A system its claim's source does not
declare (below) is refused by the validator; a system the build has no display
order for is shown unranked and is never an error. **Several entries are never reduced to one**: a
recommendation whose certainty differs by row carries every row, and no consumer
forms a summary value from them — grades are shown, never composed
(`docs/publication.md` §3). A source that rates the whole recommendation once
produces one entry without an outcome or a key — a box's "Evidenzgrad: 1", where
the method section names the system, is `value: "1"` with the system that
section names. An outcome the source lists without a rating is an entry with its
outcome and system and no value: it is recorded, not left out, so that a table
with an empty cell keeps its count, and it reads *nicht erfasst*. A rating the
source prints **for the box beside its rows** is an entry of its own, without an
outcome or a key, in the place the source prints it among them — never merged
with a row's rating and never in place of one: the summary is the source's own
print, recorded as printed, not one a consumer composes. A cell that prints
**words instead of a level** — that no study was found, or where the rating was
taken from — gives no value (underestimate, never upgrade): its words, as
printed, are the entry's **`note`**, beside the row's `key` where the row prints
one, and the entry reads as those words, not as *nicht erfasst*. A heading that
says **what kind of evidence its rows rate**, more than naming the column, goes
into the `note` of each entry under it, as printed, and where it heads no rating
it is one entry with that note alone; a heading that only names the column goes
into no field. A note is never a level, never the basis the box prints beside
its grade, never effect data and never words that only say what a rating covers.
A cell that prints, in place of a level, the basis the box prints beside its
grade gives that token to the claim's `basis` (above), never to a note; the
words it prints beside the token — where the box's recommendation comes from,
say — are a note alone, like those of any cell that prints words instead of a
level, and the reader sees them. An entry names its **`system`** wherever it
states an outcome or a value. An entry stating a note alone, or a box's own
rating printed beside its rows without a notation, takes the system of the box's
rated rows; where no row of the box prints a rating, a note alone names none —
the one entry without a `system`, since a system there would be an inference no
quote supports. Every entry states an outcome, a value or a note, and an entry
with none of them is refused, whatever its key. An absent or empty list means
the certainty was not recorded, not that there is none. The entries are the rows
of the box's evidence block **and nothing else**: a rating the source prints
elsewhere for the recommendation's evidence — in the text that gives its
reasons, say — is never an entry. Where it rates that evidence otherwise than
the box, it is the disagreement above, a `fact` claim joined to every claim
that carries the row by `disagrees_with` (§5.1 N(2), D), both shown and
neither chosen; where it rates an endpoint the box does not list, it stays on
the page.

The rows a marked recommendation prints once belong to **every sentence of it
that supports a statement of its own**: each such claim carries all of them, in
the source's order. Two sentences of opposite direction under rows keyed by arm
each carry both rows, and the keys tell the reader which arm each rates; no row
is given to one sentence by reading its key against the sentence. A sentence
that supports another sentence's statement, or none, carries none: that
statement's card shows the rows already, and a second claim repeating them would
count each row twice. Like the grade, the rating is read off the source and
never inferred: its provenance is required (§6.5) — one quote per entry, in the
entries' order, the line that prints the entry's key or outcome (for an endpoint
of a row that names several, the line that prints that endpoint, a line that
prints several quoted once for each of their entries; for a cell that prints
words instead of a level, the cell; the rating's own line where the row prints
neither). After them, each once and in the order the page prints them, come the
lines the box prints for its rows as a whole: the line that identifies the
system where an entry's own line does not — the method section's line that
names it where a row prints a level no notation identifies (a bare "1", where
GRADE's ⊕ symbols identify theirs), or a rated row's notation line where an
entry takes its system from the box's rated rows — and the heading whose words
are the entries' `note`. The validator holds each entry to its quote, refusing
fewer quotes than entries; which line a quote is, is the judge's reading (§8.1).

**A source declares the rating systems its rows use**, as it declares its
grading scheme and beside it, not inside it — how certain the evidence is and
how binding the recommendation is stay two facts: `rating_systems` on the source
entity, one entry per system, with its slug (`system`, what an evidence entry
names), its **name as the source prints it** (`name`: "GRADE", "Oxford 2011"),
and the source's own line that prints the name, quoted (`source`). Every word of
the name lies in one of the entry's quotes, the quotes are the source's own
pages, a slug is declared once per source, and an evidence entry's `system` is
one its claim's source declares (validator). The line is the method line where
the source has one — "Tabelle 4: Evidenzgraduierung nach GRADE", "nach GRADE und
Oxford 2011 gekennzeichnet." Where the source leaves its method to a separate
report, it is a body-text line that names the system beside a rating the source
gives ("GRADE moderat"), and a `rationale` says where the method is; the
separate report is not quoted. A declaration is never `modelling`: a name the
source does not print is not declared, and a notation alone (⊕⊕⊕⊝) prints
none. The site names a system by its declared name and never by its slug,
which stays in the data and the JSON (`docs/publication.md` §3, zone 4).

A criterion or a definition may print a **threshold** — "Amylase im
Drainagesekret unter 5000 U/L am ersten postop. Tag", "ASA Status von
mindestens 3". The claim carries it as **`threshold`**, naming the `quantity`
measured or scored (a concept, like every other thing the pool refers to), a
`comparator` (`<`, `≤`, `>`, `≥`, `=`, `between`), the `value` as printed,
and, where printed, its `unit` and the time point of the measurement
(`when`). A **relative** threshold — "kleiner als das Dreifach der
Serumkonzentration" — also names the quantity it is relative to
(`relative_to`), and its value is the factor. The comparator list is closed
because it is mathematics; nothing else is: the quantity is a concept, and
value, unit and time point are strings exactly as printed, never converted,
rounded or completed, so no unit table and no vocabulary of scores enters the
schema. **A claim prints one threshold**: two values the page joins ("unter
5000 U/L am postop. Tag 1 und 3 sowie Drainagemenge unter 300 ml/Tag") are
two claims, and the combination below joins them with the word the page
joins them by. A threshold says for whom — which cases a term covers — and
never how: a dose, a duration or a volume the action prescribes is not one,
and only criterion and definition claims carry it. Like the grade, it is the
number on the page: its provenance is required (§6.5), and adding it to an
existing claim is an edit with history (§7).

A rule may have several parts, and the page says how they combine — "entweder
… oder … oder aber", "sowie", "mindestens zwei", a column of points, or
nothing. A claim carries
that as its **`combination`**, read off the page like a threshold and never
set by a default. It has four fields:

- **`operator`**, the reading, from a set closed because it is logic and
  arithmetic, like the comparators: `all_of` (UND), `any_of` (ODER),
  `at_least` with `n` (mindestens n von), `not_stated` for a passage that
  lists parts without saying how they combine, and `sum` with `points` for a
  points table (below).
- **`of`**, the parts: criterion or definition claims of the same source.
- **`connective`**, the word or words the page prints for the combination,
  as printed, the pieces of a word spread over the passage joined by " … ".
  A word the page breaks at a line end is one piece, read as its quotes read
  it (§6.2): "Gleichzeitig", never "Gleichzei- … tig". Its **`source`** holds
  the quotes, and every piece lies in one of them, so the quote check (§6.2)
  reads each connective on its page.
- **`rationale`**, how the connective is read. That is modelling, and a word
  alone never decides it: "und" between groups each counting on its own
  ("… ferner Patienten mit … und Patienten mit …") is `any_of`, not
  `all_of`.

Operators nest **through claims**: a part that itself combines parts is a
claim with its own combination, so each group keeps its place, label and
edges, and the claim at the top quotes the passage as a whole. A claim
either prints a threshold or combines parts, never both. The top and the
parts are extracted for the rule and reached through it: one that is not
itself an answer of §5.1 carries no body-text edge, and the answer's claim
keeps the one §5.1 gives it. `not_stated` names
no connective, since the page prints none, and its parts are optional: a
passage listing factors without a count ("Als Risikofaktoren nach Apfel
gelten …") is marked, not guessed. How a threshold's `when` is worded ("am
postop. Tag 1 und 3") stays as printed, and a statement's several conditions
stay a conjunction (§3.2): neither is a combination. Adding one to an
existing claim is an edit with history (§7).

A **points score** is printed as a table whose rows each give a criterion its
points ("Punkt(e)" beside each "Merkmal") — and a column of points says how
the parts combine: they add up. Its combination is a **`sum`**, admitted
because it is arithmetic, as the comparators are, and read off the page like
every operator. The table's claim is the **top**: the one answer §5.1 K reads
(quoting its caption or head, its label the table as K reads it), carrying
that answer's edge. Each criterion the page gives points to is a **part**, a
`criterion` claim of its row quoting its cell: a leaf with the threshold the
cell prints, or a claim with a combination of its own where the cell joins
parts ("… oder … oder …"); a graded criterion is one part per band (`between`
"65 – 74", `≥` "75"). The sum carries **`points`**, one per entry of `of` and
in its order, each the points its row prints, **as printed** ("2", "jeweils 1
Punkt"): strings, never numbers, never added up. A cell printed once for two
parts goes to each of them as printed, the rationale reading it ("jeweils 1
Punkt": one point each), so the row keeps that it counts up to two. A row
whose rule a footnote gives is the part itself — the row's claim, quoting its
own cell —, carrying the footnote's threshold or combination, its provenance
for that property quoting the footnote's line (§6.4), and its label the
footnote's narrowing words as printed ("nur unzureichend eingestellte
arterielle Hypertonie"), not only the number. A value printed in two units is
two values the page joins ("Kreatinin >2.26 mg/dl oder > 200 μmol/l"): two
claims under the combination the page's word gives, nothing converted.

The **connective** of a sum is the head of the points column as printed
("Punkt(e)", "Punkte"), quoted in its `source` like every connective. The
points themselves lie in **no quote**: a lone "1" in a cell is found anywhere
on its page, so the quote check (§6.2) proves nothing for them, and the judge
reads each against its row (§8.1) — the one value read off a page that no
quote carries, a departure from §6.5's practice accepted for it (card #328).
A sum yields a **number, not whether a rule holds**: it is a part of no
combination, and nothing is computed from it or stored beside it — no total,
no maximum, no exclusivity between bands. Every bound on the score sits on
the claim that prints it, as a `threshold` with the score as its `quantity`
(§3.2), never on the table's claim, each as printed: "≥7" on one page and
"> 6" on another are two printings, never equated, and where they bound one
term they are a disagreement (§5). No rule is rewritten into a tree of
`at_least` and `any_of` the arithmetic would allow and no page prints. A
score whose scale its source does not print stays a quantity bounded by its
threshold, with no `defined_by` edge, and a table of ordinal classes with
neither points nor a sum ("1 Keine … 4 behindernd") is no combination: its
classes are values of one quantity, a bound on one a threshold whose value is
the class as printed. The validator refuses `points` beside another
operator, a count of points other than of parts, and a sum as a part.

### 3.2 The semantic layer

Three kinds of entity, kept apart because different edges attach to them:

- **Concepts** — the vocabulary: *pancreatic resection*, *intraabdominal
  drainage*. Thin: labels, a definition, a **facet** saying what kind of thing
  the concept is, and edges — `codes_as` into terminology namespaces, `broader`
  to the concept it is a special case of (§5). A concept cannot be contested; it
  means, it does not claim. The facet is one of `procedure` (the operation that
  defines the case: *leberresektion-komplex*), `patient_state` (what the
  patient has or is, acute or pre-existing: a disease, an organ dysfunction, a
  risk, a need for a measure or a contraindication to one: *septischer-schock*,
  *vasopressorbedarf*, *kardiovaskulaerer-hochrisikopatient*), `medication` (a
  drug or long-term therapy), `intervention` (the measure a recommendation
  judges: *epiduralanalgesie*, *abdominelle-drainage*), `outcome` (an endpoint
  or complication), `finding` (a measured or observed result that triggers a
  decision: a value, a sign, the result of a test: *laktat-im-blut*,
  *plausibler-erregernachweis*) or `qualifier` (a value of a statement
  dimension, §4.1 — a phase, a setting, a line of therapy — which qualifies a
  recommendation and is nothing in the case itself). It describes the concept's nature, which
  is fixed; the slots a statement puts it in describe its role there, which
  varies (`mpom` is the action of one statement and the condition of another).
  Where the two seem to collide, ask whether the concept describes the case or
  the act.

  **Between `patient_state` and `finding`, the label decides by what it
  names.** A state the patient is in is a `patient_state` whether it is acute
  or pre-existing, so that an intensive-care guideline's acute states and a
  surgical guideline's pre-existing ones fall on one side, and whether a
  clinician states it or establishes it by a rule (below): "Vasopressorbedarf"
  and "anhaltender Vasopressorbedarf", "hämodynamisch instabil",
  "Hypoperfusion", a low risk of a pancreatic fistula that the drain amylase
  indicates. What a measurement or an observation yields is a `finding`: a
  measured or scored quantity, such as the one a threshold bounds
  ("Noradrenalindosis", "Laktat im Blut"), a value the label names as one
  ("Hb-Wert von < 4,34 mmol/L"), signs ("Hinweise für eine kardiale
  Dysfunktion"), the result of a test ("plausibler Erregernachweis"). A
  derived concept is therefore no finding for being derived; the quantities
  its rule bounds are. The validator holds a threshold's `quantity` and its
  `relative_to` to facet `finding`, as it holds an evidence row's endpoint to
  facet `outcome` (§3.1; card #356). A term the source uses both as a
  circumstance and as an endpoint stays two concepts, the circumstance and an
  `outcome` ("hämodynamisch instabil" beside the evidence row's "hämodynamische
  Instabilität"): an endpoint counts events, not a state the patient is in, and
  the check that an evidence row's endpoint is an `outcome` (§3.1) is what keeps
  a subgroup or a comparator out of the row. Decided on 2026-10-11 by the
  maintainer (card #342), whose pass aligned the concepts of both graphs.

  A concept is **derived** (*abgeleitet*) when a clinician cannot observe it
  but establishes it by a rule — a threshold on a measured quantity, a score
  over risk factors, a definition — and **stated** (*angegeben*) otherwise.
  The rule is a `criterion` or `definition` claim (§3.1), and the concept
  reaches it by a `defined_by` edge (§5); a concept with such an edge is
  derived, one without is stated, and that is computed from the edges, never
  written on the concept (§3.3). A derived concept whose source names the rule
  without a number ("lange OP-Zeit") has its edge and no threshold.
  **How several rules of one concept combine is extracted, never assumed.**
  The concept has one `defined_by` edge, to the claim at the top of its rule
  — or one to each printing, where the source prints its rule differently in
  several places and `disagrees_with` joins every pair of them (§5);
  where the page gives several ways of establishing it, that claim quotes the
  passage and its `combination` (§3.1) joins them as the page does — drain
  amylase on day 1, *or* on days 1 and 3 *and* the drain volume, *or*
  relative to the serum value on day 3; at least two of four risk factors,
  *or* an ASA status of at least 3, *or* coronary heart disease *or* proven
  myocardial ischaemia. A second edge would join the rules by a default
  nobody read off the page, and is refused — unless the two claims are
  printings of one rule that disagree, which then stand side by side, each as
  printed, and are never combined. A combination may be of any
  operator, so neither "any rule suffices" nor "all rules hold" is ever
  assumed, and a statement's conditions stay a conjunction of their own
  (below). Because the kind is read off the concept, it holds wherever the
  concept stands — a statement's anchor, one of its conditions, or the
  `condition` of a scope edge (§5) — by the one mechanism. The kind computed
  rather than stored and the threshold on the claim that prints it were
  proposed on 2026-09-24 (card #187); the combination extracted from the
  source replaced that card's third choice, several rules as alternatives by
  convention, the same day (card #204).

  **A score is a quantity.** The concept a points table defines — the
  score — is a scored quantity, a `finding`, derived because its one
  `defined_by` edge reaches the table's claim, the top of the sum (§3.1).
  A quantity is no group: the score fills no statement slot and no axis
  placement (validator), and stands where a quantity stands, as the
  `quantity` of every threshold that bounds it. The patients a bound gives
  ("bei einem … Score von ≥2") are a concept of their own, which reaches the
  claim printing the bound by its `defined_by` edge; a recommendation to use
  the score names the use, a concept of its own beside the score's. Two
  scores are two concepts — one that adds a category the other leaves out is
  another score —, and nothing reads a bound on one as a bound on the other,
  as no grade is mapped between schemes; every spelling of one score is one
  concept, its labels and quotes as printed. Decided on 2026-10-10 on the
  maintainer's delegation (card #328); on 2026-10-11 the maintainer answered
  that a reader under a bounded score needs each criterion with its points,
  as data.
- **Statements** — propositions with a truth claim: "after pancreatic
  resection, the drain can be removed early when the drain amylase indicates a
  low fistula risk." Statements are what claims *support* or *contest*. A
  statement has a **slot shape** declared by the schema (population, action,
  condition, outcome — filled with concept URLs; the value a dimension axis
  gives a statement is that axis's placement, not a slot of the statement,
  §4.1), which makes "is this the same
  statement?" an almost-computable question and keeps granularity honest: **a
  statement is the smallest unit that can be independently supported or
  contested.** Every slot holds one concept except `condition`, which is
  always a **list** of concepts, one entry or more — one shape, whether a
  recommendation has one prerequisite or four. **Several conditions are a
  conjunction; a disjunction is one concept.** The entries hold at once, each
  on its own, individually checkable and citable ("LVEF ≤ 35 % *and* sinus
  rhythm *and* …" is several entries); where the source says "or", one concept
  names the alternatives ("Gastrektomie oder Magenteilresektion", "mittleres
  oder hohes VTE-Risiko") and stands as a single entry. A list can mean only
  one of the two, so the other has its own carrier. Nor are independent
  prerequisites fused into one concept to fit a single value: a concept for a
  constellation stands only where the source itself names it as one. A
  hierarchy respect over `condition` (§4.1) places each entry's concept.
  Its `label` is the full proposition; an optional **`short_label`**
  is the same proposition compressed for a box on a drawing, and it must still
  tell siblings apart — six boxes reading "Magensonde ziehen" hide exactly the
  staging the drawing exists to show, so the short form carries the
  distinguishing feature ("Magensonde vor Ausleitung (kolorektal)"). Concepts
  and structural nodes may carry a `short_label` for the same reason. A short
  label is at most 60 characters (the schema enforces it: a box holds two lines
  of about thirty); aim for 55. Shortening
  a clinical proposition can change its meaning, so a short label is reviewed
  like any other content, never generated on the fly.

  **A concept's label is written in running-text case.** Its `label` and
  `short_label` are written as their words read inside a sentence of the
  label's language (its `lang`), the first word included: a first word that
  language writes in lower case inside a sentence opens in lower case, and a
  noun, a name or a token whose case is fixed (an acronym, a symbol, a unit)
  keeps its case. In German an adjective, a participle, an adverb, a
  preposition or a determiner opens in lower case — "angemessener
  Flüssigkeitsstatus", "hämodynamisch instabil", "ohne Schocksymptomatik",
  "ausgenommen Infektionen, die längere Therapie erfordern" — and
  "Hypoperfusion", "ARDS", "pH", "β-Blocker" keep theirs. A label then reads
  as its language wherever it stands: joined to the next condition by "und",
  or inside a sentence. Its case is ours (§6.5) and carries no provenance; the
  words a page prints keep their printed case — a claim's sentence, a quote,
  an evidence `key`, `value` or `note`, a grade, verb or consensus word, an outline
  title — and a statement's `label`, one sentence, begins as a sentence does.
  The rule is the concepts'; the labels of statements, structural nodes, axes,
  views and sources are not under it. The build never changes a label's case:
  it shows every label as stored, so a concept's label standing alone — a
  patient group's box, a concept page's title, the first line of an answer —
  opens in lower case where its first word does, as a dictionary lists an
  adjective. Nothing in the build, the schema or the validator names a word
  class, a word list or a language; the validator cannot check the rule, since
  it cannot tell a noun, so review checks it wherever a concept is minted or
  relabelled. Decided on 2026-10-10 (card #257).
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
violation as a hand-written review status. Likewise, whether a concept is
derived or stated (§3.2) is computed from its `defined_by` edges and never
stored: a stored kind would have to be kept in step with the edges by hand,
and a concept used as a condition in one statement and as an anchor in
another would need it written twice.

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

**Anchor and scope root.** A view may declare, beside its filter, the two
properties that make its members one tree of "for whom":

```yaml
anchor_slot: population        # a slot every statement has (§3.2)
scope_root:  concepts/<id>     # the concept the scope tree ends in
```

The **anchor** of a statement (not a claim's source anchor, §3.1) is the one
concept in the view's `anchor_slot`:
the guideline's primary index, what its recommendations are keyed on and what
one must know to look anything up (§4.1, question 1). The **scope root** is the
concept above every anchor — for a guideline, its own scope, the patients it
addresses, as the source describes them. It is **declared, never inferred**:
where a guideline's anchors have no common concept, minting one is a visible,
reviewed act on the view, not something a validator rule forces. Between the
anchors and the root lie `broader` edges, which hold whatever guideline one
reads, and scope edges (`in_scope_of`, §5), which hold inside this guideline's
scope. Which of them the view's **scope tree** is drawn from is chosen by the
first axis of its `group_by`: a hierarchy axis over the anchor slot, whose
placements pick for each concept the one of those edges it hangs by (§4.1) —
the pool holds the facts, the axis the tree. The two properties are
declared together, and a view that declares them owes four things, which the
validator checks: (1) every member statement fills the anchor slot with
exactly one concept; (2) the first entry of its `group_by` is such an axis,
asserted for the view, and every anchor reaches the scope root along its
placements; (3) every scope edge carries a rationale, and its
`condition`, where it has one, is a concept; (4) scope edges form no cycle,
alone or with `broader`, and never repeat a `broader` edge between the same two
concepts. A view that declares neither is read as before, and none of the four
applies to it.

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

#### An overlay on the pool, and its two carriers

An axis groups the answers to one question of the tree. It is an **overlay**:
its placements live in the axis entity, before and after it is asserted, and
the pool it lies over is left as it is. The pool holds the facts an axis
chooses from — the statements' own slots, the `broader` and `in_scope_of`
edges between concepts — and the axis holds the choice, so a fact is stated
once however many groupings use it, and a fact added to the pool changes no
grouping until someone changes an axis. The placements are data written by a
person or a linking pass and reviewed, never derived by the build from the
axis's rule (step 3). An axis is carried in one of two ways, and the rule that
decides which is the same for every guideline:

- A **statement dimension** — a value the axis gives each statement it
  places, `{statement: value}` in its placements; the statement's own slots
  (§3.2) do not change. Its value qualifies the *recommendation* and holds
  whoever the patient is: the same patient group carries recommendations
  across all values of such an axis. In the tree, a dimension is a question
  of its own, asked **before** the population question, because it
  partitions the whole guideline the way its chapters do — and it is exactly
  what a chapter *meant* (§6.7), lifted from the outline into data. Its
  values are concepts of facet `qualifier` (§3.2), listed in the axis
  definition; a statement has one of them, or none — then the axis does not
  distinguish it, which never means "all values".
- A **hierarchy respect** — for each concept that answers a question the
  tree already asks (today the population and the condition), the parent it
  hangs by on this axis, `{concept: parent}` in its placements. The parent is
  chosen from the pool, never stated by the axis: once the axis is asserted,
  each placement is an edge the pool already holds from the concept to the
  parent, `broader` (a true "is a special case of", §5) or `in_scope_of` (a
  membership this guideline stipulates, §5). A relation the axis needs and
  the pool lacks is added to the pool first, as an edge of its own with its
  own rationale. A concept may hang by different edges on different axes and,
  unless the definition says otherwise, by one on each; the edge names no
  axis. In the tree, a hierarchy changes which concepts are the families of
  that question and how it folds — never which question is asked.

Which of these a value is — and whether it is either — is decided by four
questions, asked in order, **per statement**, not per concept:

1. **Is the value the guideline's primary index** — what its recommendation
   chapters are keyed on, what one must know to look anything up? Then it is
   the statement's **anchor** (§4), in the view's `anchor_slot`. A guideline
   on perioperative care is keyed on the procedure, one on pneumonia on the
   severity, one on thromboembolism prophylaxis on the risk group, one on
   heart failure on the phenotype. Whether the value is observed or computed
   does not matter here; that decides only how it is obtained.
2. **Is the value a thing in its own right that is a special case of
   another?** The test is the sentence "X is a Y", where the value changes
   *which* thing is present, not merely *how* it is done. Then it is a
   **subgroup**: `broader` where the sentence holds whatever guideline one
   reads, a **scope edge** (`in_scope_of`, §5) where it holds only inside this
   guideline's scope. A named operation is a special case of the resection it
   performs; an operation whose route decides its anatomy is a procedure of
   its own; "minimally invasive" is not a thing but a qualifier of one.
3. **Does the value combine freely with every anchor value, from a closed,
   named list?** Then it is a **dimension**. Orthogonality is the
   discriminator, not variation: a value that is forced into one tree with
   the anchor although both combine freely (an access and an organ) breaks
   the tree.
4. **Otherwise it is a condition** (§3.2): the circumstance of the individual
   case, with an open range of values and no partition.

The same concept may be the anchor of one statement and a condition of
another; slots are roles, not types (§3.2). This replaces an earlier rule —
"if it varies with the recommendation, it is a dimension" — which held for
every patient group too and so separated nothing. Edge cases, decided once:
a value that names the patient's *situation* after an intervention ("the state
after X") is a population concept and may be an anchor, but it is not "an X":
where the guideline treats it under X, that is a scope edge, not `broader`,
while *when* the recommendation applies stays a dimension; a dimension value
that covers the whole guideline ("throughout") is a legitimate declared value,
not a missing one; a concept defined by exclusion or spanning several families
is placed by a hierarchy only where the definition allows several parents, and
is otherwise unplaced — the pool never mints a "several" family, because that
is not a subsumption. The document outline is neither carrier and needs no axis
entity, because it is provenance, not modelling (§6.7): every view offers it as
the built-in chapter grouping of its switch, derived from the claims' sections
and the sources' outline, second after the view's tree of patient groups —
and its headings are the extractor's hint when a rule is applied. The tree of patient
groups a view opens with is an axis like any other: a hierarchy over the
view's anchor slot (`population` where it declares none), proposed, tested
and asserted by the same steps, its placements written by the pass that
writes the guideline's `broader` and `in_scope_of` edges, and listed first in
the view's `group_by` (step 4). Nothing is built in beside it: a view without
such an axis shows its patient groups unfolded, each an answer of its own.

#### 1. Proposed — the axis definition

A person — usually a physician — proposes an axis as data: one entity
`axes/<axis-id>` in the `axes/` namespace (§2), with

| field | content |
|---|---|
| `id`, `type: axis`, `lang`, `label`, `short_label` | as for every entity; the label is what the site's switch shows |
| `carrier` | `dimension` or `hierarchy` |
| `slot` | for a dimension: the key its values are shown and asked under — on the card, in the tree — never a slot of the statement's own (English, like every structural key); for a hierarchy: the statement's own slot whose concepts it folds (`population`, `condition`) |
| `values` | dimension only: the concepts (facet `qualifier`) a statement may have on the axis, in the order the tree shows them |
| `question` | dimension only, optional: the question the tree asks for it, whole, in the axis's `lang` — where the site's generic form ("which {short label}?") would be wrong in that language; a hierarchy never changes which question is asked, so it has none |
| `several` | hierarchy only, default `false`: whether a concept may have more than one parent on this axis |
| `rule` | the written rule a linking session applies without judgment calls: what earns which value or which family, in the source language, `lang`-tagged |
| `proposed_by` | a role — `physician`, `maintainer`, `agent` — never a name (`.claude/rules/conventions/no-personal-information.md`) |
| `views` | one entry per view the axis is proposed for: `{view, status, since}`, status one of `proposed`, `asserted`, `withdrawn` |
| `placements` | the rule *applied*: for a dimension, `{statement: value}` pairs; for a hierarchy, `{concept: parent}` pairs; while proposed a list where the rule yields several places. A place may be written `{place, rationale}`, the rationale in the axis's `lang`, where the rule alone does not decide it (a value taken from a heading because the sentence names none, say); the rule is the rationale of every other. Kept when the axis is asserted: they are what groups the view |

The rule is for people; the placements are what the tool measures and what
the site draws. An axis whose rule holds for a second guideline is proposed for
its view by adding an entry under `views`, not by a second definition; a status
is per view, because an axis can be feasible on one source and not on another.
A hierarchy whose placements pick scope edges holds a tree only one guideline
stipulates, and a second guideline gets a hierarchy of its own. Proposing is cheap
and commits the pool to nothing: a proposed axis groups no view.

#### 2. Tested — the feasibility report

A tool (`tools/axes.py <axis> <view>`, registered as WP-0008) applies one axis
to one view and prints a report. It reads the definition's placements, which
are the same before and after assertion, so the same numbers print either way;
for a hierarchy it also lists every placement that no edge of the pool carries
yet — what asserting it would first need in the pool. It writes nothing. The **universe** *U* is, for a dimension, the view's member
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

What the person accepts is asserted by a linking pass, reviewed in a pull
request that carries the feasibility report:

- the placements, one per statement (a dimension) or per concept (a
  hierarchy) — a single place each, unless a hierarchy says `several`; for a
  dimension the value that the rule gives, with a `rationale` where the
  sentence does not name it and a heading or passage does; for a hierarchy
  the parent whose edge the pool holds;
- what a hierarchy needs in the pool and the pool lacks, added to it first as
  facts of their own: a `broader` or `in_scope_of` edge, `modelling` with a
  rationale, a family concept minted with facet and label where the axis
  needs one, never for a single member;
- the definition's `views` entry set to `asserted`, with its date. The
  placements stay where they are; from then on the validator holds each
  hierarchy placement to an edge of the pool, and the placements are what the
  site draws. Git keeps their history (§7).

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
nothing and never changes the view's members (§13). Its **first** entry, when
it is a hierarchy over the view's anchor slot (`population` where the view
declares none), is the view's tree of patient groups: the page opens with
it, it folds the patient groups below the chapters and below every dimension,
and in a view with a scope root it is the scope tree (§4), which is why such a
view must list one first. The switch lists that axis first, then the chapters
of the view's sources (§6.7: the top-level sections in outline order, a
statement behind every chapter one of its claims sits in) — the one grouping
built in and needing no declaration —, then the other declared axes. A view
whose `group_by` does not begin with such an axis shows its patient groups
unfolded, each an answer of its own, as the first entry of its switch. A
hierarchy axis other than the first places only what its placements place;
the rest is "not placed". Choosing a grouping
changes what the tree asks first (the chapters, a dimension) or which concepts
are the families of a question (a hierarchy), and nothing else — not the
shape, not the folding, not where a recommendation hangs. Whatever the chosen
grouping cannot place is one answer, **"not placed"**, last among the answers
of the question it groups, at every depth where that question is asked; it is
never dropped. The build knows no axis by name: the switch shows the axis's
`label`; a dimension's question is the axis's own `question` where it declares
one and otherwise the per-language form filled with its short label; the
chapter question, "not placed" and the word for unfolded patient groups come
from the per-language table like the questions.

The validator holds this together: a `group_by` entry names an existing axis
asserted for that view; an axis asserted for any view places each statement or
concept once (unless a hierarchy says `several`), a dimension's placements are
statements holding one of its `values`, and a hierarchy's are edges the pool
holds; a statement has no slot beyond its own; a placement references entities
that exist; the first-entry rule of a view with a scope root (§4). A cycle
needs no check of its own: every hierarchy placement is an edge, and the
edges have none (§5).

#### Worked example — the first source, and two imagined ones

*The first source* (`views/pomgat-lv-1.0` as the axes were proposed on
2026-09-13 — the figures below are that report, and the pool has changed since:
90 statements over 36 population concepts, chapters titled by perioperative phase and subsections by organ and
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
  proposer's call, not the tool's. For this view it was answered by the scope
  tree (§4): once the organ families and the generic groups hang under the
  guideline's own scope, one tree places both halves, and the region was
  withdrawn for the view.

*A guideline organised by stage* (an oncological entity, chapters by UICC
stage). The stage is what its chapters are keyed on, so by the first question
it is the anchor: its view names the slot that holds it as `anchor_slot`
(`population`, "patient in stage X"). Its physician proposes a hierarchy
"Stadium" over that slot (`slot: population`), families the stages, rule: the
stage a population concept names; and a dimension "Therapielinie"
(first-line, second-line, …). Nothing
in the mechanism, the schema or the build changes; its view declares both in
`group_by`, and its switch shows "Stadium" and "Therapielinie" where the
first source's shows "Phase".

*A guideline organised by leading symptom* (an emergency guideline, chapters
"Brustschmerz", "Dyspnoe", …). The symptom is the population's *presentation*,
not a phase and not a subsumption of a procedure: a dimension `slot:
leitsymptom` whose values are the symptoms — or, if the populations are
minted as "patient with X", a hierarchy over the population slot. The four
questions decide: chapters keyed on the symptom make it the guideline's
primary index, so it is the anchor and the populations are minted as
"patient with X"; a dimension only where a symptom combines freely with every
anchor value, which a primary index cannot. The feasibility report of each
variant tells the proposer which one the data carries.

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
  relate. Which sentence earns which edge is the rule of §5.1.
- **disagreement** — `disagrees_with`: claim → claim, "this source says
  otherwise at that place". **The graph reflects the text**: where a source
  answers one question differently in two places — another value, time,
  group or rating for one term, case or action — each printing is a claim, as
  printed, and this edge joins every pair of them (§5.1 D). No extraction,
  linking pass or build picks a side, smooths the difference over, or names
  it only in a pull request, and nothing computes a "true" answer. The edge is
  symmetric, once per pair in either direction, and never joins a claim to
  itself; it joins claims of **one** source — between two sources the
  relation is `contests` (§11). Always `modelling`, with a rationale that
  quotes both sides with their pages and says what they differ in, `lang` and
  `as_of`. It carries no evidence and decides nothing: each side keeps the
  edges the rules give it, and the site shows each on the other's card as the
  source's own inconsistency (`docs/publication.md` §3). A side the page
  prints as a figure without a text layer cannot be quoted: the claim of the
  figure's caption is that side, and the rationale says what the image shows,
  as read off it and not quoted.
- **coding** — `codes_as`: concept → terminology concept. Codes are never bare
  strings inside a property; a code is a node and coding is an edge, so the link
  carries provenance and dangles visibly when a classification changes.
- **subsumption** — `broader`: concept → concept, "is a special case of". *Pankreaskopfresektion*
  is a *Pankreasresektion*; a concept may have several broader
  concepts (a pancreatoduodenectomy is both a pancreatic resection and a
  duodenal resection) and a concept with none is a
  root. Always `modelling`, with a rationale. A grouping axis chooses among
  these edges (§4.1); the edge names no axis, and it is the same fact
  whichever grouping uses it. The edge carries **no evidence and no inheritance**: whether a recommendation about the broader concept holds for
  the narrower one is a clinical question the source either answers explicitly,
  in which case a statement says so, or leaves open, in which case the gap stays
  visible. A build that propagates recommendations down a `broader` edge would
  be inventing answers; it may only use the edge to group and to fold.
- **scope** — `in_scope_of`: concept → concept, "counts, within the scope of
  this guideline, as a case of". It carries what one guideline stipulates for
  its own scope and what `broader` cannot hold: that its general
  recommendations are addressed to a group because the group lies in its
  scope, not because the group is a special case of anything. Such a sentence
  can be false outside the guideline (a kind of operation counts as tumour
  surgery only where the guideline says it is about tumour surgery), and it
  can even point the other way (a guideline carries the evidence of a group
  *wider* than its own patients onto them; as "is a special case of" that is
  backwards, as a scope edge it is right). Written into `broader`, it would
  make the concept hierarchy false for the next guideline that reuses the
  concepts. Always `modelling`, with a rationale and a date; an optional
  **`condition`** names, as a concept reference like every other condition
  in the pool, the circumstance under which the membership holds ("during a
  procedure within the scope"), and its absence means unconditional — no
  magic value stands for "always". A scope edge belongs to the scope tree of
  the view whose `scope_root` (§4) it leads to. It is an **edge, not an
  entity**: as an entity it would lack `source`, `as_of` and `lang` — no
  provenance, no attestation, no staleness — and would need a namespace of its
  own. Unlike `broader`, it says what the guideline itself says: that what it
  recommends for the upper concept is addressed to the lower one. A view may
  therefore show a concept, beside its own statements, those anchored above it
  along its scope edges — set apart and marked as applying generally, with
  the condition (`docs/publication.md`) — and never merges them into its own;
  along `broader` alone nothing moves.
- **definition** — `defined_by`: concept → claim, "is established by the rule
  this passage gives". It connects a derived concept (§3.2) to the
  `criterion` or `definition` claim that says how it is established, with the
  threshold the claim prints or the combination it quotes (§3.1). Always
  `modelling`, with a rationale naming the clause and the term, `lang` and
  `as_of`. **A concept has one such edge**: several rules reach it through
  the combination on the claim the edge leads to, as the page joins them —
  except where the source prints its rule differently in several places
  ("> 50 ml/kg/h" on one page, "≥ 50ml/kg/h" on another): then the concept
  has one edge to each printing, each claim keeps its threshold as printed,
  nothing computes a "true" bound, and the site shows every printing. The
  validator refuses a second edge, even with a discriminator, unless every
  pair of the claims the concept reaches is joined by `disagrees_with`, and
  an edge to a claim of another kind. It is the edge, not a field on the
  concept, because the rule is a relation with provenance: it can be attested
  and go stale. It carries no evidence and says nothing about the statements
  that use the concept; the `refines` edge the same criterion may have to a
  recommendation (§5.1) stays what it is, a body-text relation between
  claims.
- **structure** — `sequence`, `branch` (with a `guard` property), `about`:
  among structural nodes and from them to the statements they arrange.
- **cross-source semantics** — `specializes`, `complements`, `conflicts`:
  statement → statement. Our assertions, always `modelling`, with rationale and
  date.
- **sequence** — `follows`: statement → statement, a kind beside
  `specializes`, `complements` and `conflicts`, written
  `[later statement, follows, earlier statement, {…}]` and read "is triggered
  by the outcome of": the guideline takes the later recommendation's step
  because of how the earlier one's measure went. It is not the structure edge
  `sequence`, which arranges the nodes of an authored pathway; it joins two
  recommendations where the text states the order, and is never read from a
  figure. Two properties are required on it and allowed on no other kind,
  closed lists with English keys, their words for a reader in the view layer
  (`docs/publication.md`): **`transition`**, what the later measure does to
  the earlier one — `replaces` it, `adds` to it, `follows` it once it has
  ended, or runs `concurrent` with it, which is written only where the
  guideline says "at the same time"; and **`trigger`**, which outcome of the
  earlier measure calls for the later — its target missed (`target_missed`),
  the patient's intolerance of it (`intolerance`), a contraindication arising
  under it (`contraindication`), its target reached (`target_reached`), a
  re-evaluation of it (`reevaluation`), a finding under it (`finding`), or
  `other`. "Later" and "earlier" are the order of the decision, not of the
  clock: under `concurrent` both measures run at once, and the edge runs from
  the one the page makes depend on the other's outcome. Always `modelling`,
  with a rationale that quotes the trigger's wording as printed, in „…“,
  `lang` and `as_of`; the sentence is already a claim, where its quote is
  checked, and the edge cites it as every modelling edge does.

  **Sequence or condition.** Whether a circumstance a recommendation names
  makes it the later step of another, or is a condition of its own statement,
  is decided by four tests:
  - a circumstance that describes the patient's state stays a condition; one
    that is the outcome of a previous measure is a sequence;
  - a state worded against a measure — "despite", "under" or "after" X
    („trotz X“, „unter X“, „nach X“) — is a sequence only where X is the
    measure of a statement of the same guideline; a state worded without
    reference to a measure earns no edge;
  - a contraindication the patient has before the first measure is a
    condition; one arising under the previous measure is a sequence;
  - a value that selects the patients is a condition; one that measures their
    response to the previous measure is a sequence.

  The edge says *to which measure*, the condition *what*: the circumstance
  that triggers the step stays the later statement's `condition` concept,
  usually of facet `finding` (§3.2), and the edge never writes, removes or
  decides a condition entry (§5.1 N3) — a trigger the page prints that the
  condition lacks is named in the linking pull request. It carries no
  threshold: one the trigger prints sits on the criterion or definition claim
  the condition concept's `defined_by` edge reaches, and is read through
  condition → `defined_by` → `threshold`, never copied. And it carries no
  status: a border case, where the tests above leave the reading open, is a
  finding of the judge (§8.1) and a line in the linking pull request naming
  the edge and the test that leaves it open; review state is derived (§3.3).
  `complements` stays, unchanged, for a measure that adds to or stands beside
  another without a trigger; `follows` with `adds` adds it because of the
  earlier one's outcome. One pair of statements carries one of the two, never
  both: a linking pass that reads a sequence where `complements` joins the
  pair replaces that edge. A step only the body text gives is no node of a
  chain: it stays `supplements`, claim → claim, with its recommendation's
  claim (§5.1 S). Where the source states the order of two recommendations
  differently in two places — another trigger, another transition, or the
  one after the other in one place and the other way round in another —
  each printing is an edge of its own (with a `discriminator` where two run
  from the same statement to the same one), the claims that print them are
  joined by `disagrees_with` (§5.1 D), and nothing picks one: the graph
  reflects the text. The validator refuses an edge whose two statements no one source
  supports with claims — a chain never runs across guidelines —, an edge
  whose later statement's `population` lies strictly above the earlier's
  along `broader` and `in_scope_of`, since a step the outcome of another
  triggers is never for a wider group than that one (the same group, a
  narrower one or one the pool relates to it by no edge passes), and a cycle
  of `follows` edges none of whose triggers is `reevaluation` or
  `target_reached`: a loop that a re-evaluation or a reached target closes is
  one the guideline may run, and stays allowed, and so is one through an
  edge whose two statements are supported by claims `disagrees_with` joins,
  the source stating their order both ways. Decided on 2026-10-10 on the
  maintainer's delegation (card #294; memory `sequences-are-edges`); the
  cycle a disagreement states passes by the maintainer's principle of card
  #341, applied on 2026-10-11 (card #295).

**Staleness without version pins.** An edge whose meaning depends on its
endpoints' content records the endpoints' content hashes at assertion time. When
an endpoint's current hash differs, the edge is **stale**: surfaced for
re-evaluation, its derived weight downgraded — not silently applied, and not a
blocker (§8). No version is ever pinned on an edge; the mechanism is the same one
attestations use.

### 5.1 The body-text rule

A **marked recommendation** is what the source marks as one (a numbered box,
statement or definition), whatever origin or status it prints beside the mark;
each of its sentences is a claim (§3.1). **Body text** is every other place: a
sentence, a footnote, a table or a figure. Its **section** is the lowest
numbered heading above it — a table's or figure's that of the marked
recommendation naming it, else of the first sentence introducing it, else where
printed (its claim's `section` stays where printed). A section's marked
recommendations are those in its own text; one where neither it nor a section
below it holds any also has those in the own text of the nearest section above
that does; and a section's own text, before its first subsection, also has
those of every section below it. Those of a sibling never count. A place
becomes a claim with an edge exactly when it passes G1–G4 and one of D, R, L,
S, tried in that order — the first that holds decides; a decline that passes G1–G3
is a claim without one, and so is a place U admits. Every other place stays on
the page, and so does a figure without a text layer (F). Whatever edge a
place gets, it is joined by `disagrees_with` to every other place of the
source that answers its question otherwise (D).

- **G1 topic** — it is about the action of a marked recommendation of its
  section, for that recommendation's population; a decline, or a place on a
  marked gap notice, need only share its question, whatever agent or population.
  A definition or criterion the source marks for a term as such — a heading or
  table head that calls it a definition, classification or criterion — also
  passes wherever it stands, when a marked recommendation of the source uses
  the term; where only this admits it, its concept reaches it by `defined_by`
  (§5) and it carries no edge of this rule, E's included. One no marked
  recommendation uses stays on the page.
- **G2 voice** — it speaks for the guideline, its authors and "wir" included:
  its subject is not a study, a review, another work's author, another
  guideline or the evidence, nor a pronoun or connective continuing a sentence
  whose subject was. A reference mark, a "nach …" or a table's or figure's
  source line ("adaptiert nach …", "… bearbeitet durch die Leitliniengruppe")
  alone is no report. A table or figure speaks as the sentence introducing it
  does, and for the guideline where a marked recommendation names it. Except:
  a value the recommendation's wording needs and does not give passes even when
  reported from the studies, if the guideline gives none.
- **G3 new** — it adds a case, value or action the recommendation lacks. A
  repetition (after a summary word, a reason, "this holds for all"), a decline
  restating a marked gap notice and an example as a whole add nothing; a
  repetition that adds counts only for what it adds.
- **G4 decline** — saying that no recommendation, or no value one needs, is
  given is a gap notice, no edge, also where its subject is the evidence:
  "keine Empfehlung", "weder für noch gegen", a recommendation or a need that
  "besteht nicht" or "existiert nicht", data that "sprechen gegen eine
  Empfehlung" or "lassen eine Empfehlung … nicht zu", a "Ermessensspielraum"
  left to the reader; referring to another work instead is N4. Saying the
  action is not recommended ("kann nicht empfohlen werden") is against it;
  saying only what is unknown ("unklar", "keine Studien") is N2. A need or
  an indication denied is read by its verb, never by the noun: where the
  verb says that none exists, it is a decline ("besteht … keine Indikation
  zur Umstellung"); where the guideline itself denies the action one ("sieht
  … keine Indikation für …"), it judges the action and is against it, as
  "kann nicht empfohlen werden" is (card #372).
- **D `disagrees_with`** — it answers a term, case or action of the
  recommendation otherwise than the recommendation itself prints it: another
  value, time or rating, a rating in other words included, or a group the
  recommendation answers differently (an hour for sepsis where the box gives
  the hour to septic shock alone). Ratings are compared by their words as
  printed, never mapped onto each other (§3.1): the same word, capitalised or
  inflected otherwise, is the same rating; another word is another rating,
  though the two may name one level, since the page does not equate them
  ("sehr niedrige" against the box's "sehr gering"), and the rationale quotes
  both and says so. It is a claim, joined to the recommendation's claim by
  `disagrees_with` (§5) — where it rates the evidence, to every claim that
  carries a row it rates: each sentence with a statement of its own, as the
  row goes to each (§3.1), so that every recommendation's card shows it —,
  and gets no R, L or S edge to it, which would read the one through the
  other. Places that answer one term differently where the recommendation
  prints no answer of its own each get the edge R, L or S gives them, and
  every pair of them is joined by `disagrees_with`: each printing shown,
  none chosen. A distinction one place draws and another erases or denies
  is a disagreement (the hour for septic shock alone, against the hour for
  both, or a deadline "unabhängig davon, ob ein Schock vorliegt"); two
  answers that differ only in kind for the same groups — an ideal time
  beside a latest one — are none.
- **R `refines`** — it says what a term of the recommendation covers: who is in
  its group; which value, time, dose, agent or technique a word stands for. It
  makes cases precise and takes none out.
- **L `limits`** — it takes cases the recommendation covers out of it: an
  exception, a contraindication, a circumstance in which the action is not to
  be done or is advised against, with or without what to do instead.
- **S `supplements`** — it instructs a further action for the recommendation's
  case: a next step, what to do when the action fails or is refused, a measure
  beside it. Describing an effect or a mechanism instructs nothing.
- **U unmarked recommendation** — a recommendation or a decline in the
  guideline's voice (G2) that G1 does not admit, on an action or for a
  population no marked recommendation of its section names, is a claim
  without an edge and in no statement, unless it restates a marked
  recommendation of the source (G3). "Diese Leitlinie empfiehlt" is no mark.
- **K claim** — `kind` by form (§3.1); `verb` and `direction` as printed (the
  verb by §3.1's predicate rule, and only if a declared grading scheme defines
  it); never `grade`, `basis`, `consensus` or `recommendation_no`. **One claim
  per answer**: members giving different answers — another threshold for the
  same term, another action, another direction — are a claim each, each quoting
  its member; members sharing one answer (the cases one group comprises) are
  one claim. A table's members
  are its rows or a cell's items: a table a marked recommendation names as one
  instrument is one answer, one whose rows each give another action or agent a
  claim per row, and a row one claim with one edge, the first of R, L, S that
  holds. A table claim quotes within one cell (a caption or head for a whole;
  where the head recurs on the page, the caption or the sentence that
  introduces the table, §6.2) and reads "Kopf: Zelle; …" as printed, its
  label leaving out the reference marks as every claim's does (§3.1). A rule
  the source prints differently in two places is a claim per printing that
  passes, the disagreement shown in the graph and never resolved (card #341).
- **F figure without a text layer** — a figure printed as an image, of which
  the extracted text holds only the caption and the footnotes, stays on the
  page, whether a marked recommendation delegates to it or not: no quote
  reaches its content (§6.2), so no claim, statement, concept or edge holds
  it. The sentence of a marked recommendation that delegates to it, telling
  the reader to proceed as the figure shows, is a claim as printed (§3.1),
  the delegation in its label; its statement's action is what the sentence
  names, its label keeping the delegation ("nach Abb. N"), and no slot holds
  the figure's content. Its footnotes follow the figure: they stay on the
  page while its content does. Its caption is text, a place like any
  other. Whether a later view transcribes such a figure is open (open
  question figures-without-text).
- **E edge** — to each claim of the section whose wording carries the term, the
  case or the action, none to the other sentences of its recommendation; a
  definition the source marks for its term as such — not an item of a list
  defined where it stands —, to every claim of the source using the term.
  `modelling`, with `rationale` naming the clause and the term as printed
  (`"R: <term>"`), `lang`, `as_of`. A pass deletes an existing body-text edge
  the rule does not give and lists it, with its clause, in its pull request.
- **N — not a body-text relation.** (1) Sentences of one marked recommendation,
  or of two: each is linked as §3.1 says; what one says of the other is
  said between statements (`specializes`, `complements`, `follows` where the
  outcome of one triggers the other, §5) — and where they
  answer one question differently, `disagrees_with` joins their claims as
  well (D). (2) How certain the
  evidence is: `evidence` on the recommendation's claim (§3.1); effect data,
  study summaries and rationale: nothing, also in a table or figure a marked
  recommendation names — except a place that rates the certainty of the
  recommendation's evidence otherwise than the box does, which is a `fact`
  claim joined to every claim that carries the row (D). (3) A condition of
  the statement: an
  edge relates two claims and never writes a slot, mints a statement or decides
  what a circumstance is to a statement (§4.1); a circumstance the statement
  lacks is named in the pull request. (4) A cross-reference, a referral to
  another work in place of a recommendation, a research question, a quality
  indicator (→ quality-indicators). (5) The top or a
  part of a rule's combination (§3.1) that is not itself an answer: it is
  reached through the combination, and the answer's claim carries the edge.

---

## 6. Provenance

Provenance answers "where does this statement come from". It is the central
guarantee of this repository: a human must be able to jump from any statement to
the exact passage that justifies it, and a machine must be able to verify that
the passage exists.

### 6.1 Sources are entities

Every source document — a PDF, a web page, a classification release — is an
entity in `sources/` with its public URL, a content hash and licence
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

**Title, version and date.** A source's `title` is its title proper, as the
document prints it — without its version, its date or its form ("Langfassung"),
which the document prints apart from it. Where the document prints a version and
the date it gives that version (its "Stand"), the source records both, each
quoted where it is printed (`provenance.version`, `provenance.date`, §6.4): the
`version` is the label as printed, without the word for it ("1.0", "4.0"), and
the `date` is ISO 8601 at the precision printed — a year, a month (`2023-11` for
"November 2023") or a day (`2025-04-30` for "30.04.2025"). The quote keeps the
printed form checkable; reading it as ISO is a reading for review, and no month
name of any language enters the schema or the validator. The date is the one the
document gives its version — not a register's publication date, an adoption date
or the date of a download. It is shown with the source and never used to rank or
overrule (§3.4, §11 rule 4); a version is no view's cut (§4) and pins no edge
(§5, "Staleness without version pins"). A source that prints neither records
neither, and nothing is parsed out of a title. The period a document declares
itself valid for is not recorded yet.

### 6.2 A reference is a locator plus a verbatim quote

```yaml
{at: sources/pomgat-lv-1.0#page=61, quote: "kann die Einlage einer intraabdominellen"}
```

The quote is short (a clause, not a paragraph) and **must be a verbatim
passage of the source's extracted text**, in **whole words** — it is three
things at once: the highlight target for a reader, the reviewer's at-a-glance
check, and the validator's exact match. A paraphrase breaks all three. A
statement whose quote cannot be found where it claims to be is invalid.
Provenance values are lists; a single reference is shorthand for a list of one.

A quote neither starts nor ends inside a word, and it may run across a line
break of the extracted text where the text runs on: to the next line, or,
where a box or a table interleaves its columns, to the next line of the same
column. A line break reads as a space, and a hyphen that ends a line reads as
the printed word does: the hyphen of a word the line breaks is dropped
("Volu-" + "men" → "Volumen"), and a hyphen that belongs to the word stays
("Povidon-" + "Iod" → "Povidon-Iod", "Rektum-" + "und" → "Rektum- und"). Which
of these a line-end hyphen is, is a reading of the page, the extractor's; the
validator accepts each and refuses a quote that lies on its page only inside a
word.

The quote is the same text in the link into the source (§6.1), so a viewer's
search finds it as a reader's would. pdf.js joins a line break and its hyphen
the same way, except that it drops every line-end hyphen between two
lower-case letters, after a capital or after a letter with a diacritic, so
where the page keeps one there ("oral-" + "antibiotische", "Rektum-" + "und",
"SOFA-" + "Score") its search misses the quote: the link still opens the page,
and an extraction cuts the quote elsewhere where the sentence allows. pdf.js
also removes every ASCII double quote (`"`) from the search before it looks,
so a quote holds none — the validator refuses one — and is cut beside a
passage the page prints in such marks; typographic quotation marks („ “) are
other characters and stay. A quote stays within 100 characters, the longest
the read-only server returns whole
(`.claude/memory/design/quote-gate-follows-the-site.md`); a longer passage is
cut back to its last whole word that fits.

A claim's quote lies **once** on its page. pdf.js finds a phrase, not an
occurrence: its search ignores case and matches inside a word as well, and
the link lands on the page's first match. And a claim's id hashes its locator
and its quote (§2), so two claims quoting one recurring passage of a page
would be one. A passage the page prints more than once is lengthened, along
the text it lies in, until it lies there once: a symbols cell with its row's
head ("Hämodynamische Instabilität: Sehr niedrig ⊕⊕⊝⊝", §3.1). Where it cannot be
lengthened into a passage that both readings find once — a table's head,
which the validator reads down its column and pdf.js along its row — the
quote is cut from the table's caption, or from the sentence that introduces
the table (§5.1 K). The validator counts a quote's places on its page the
way the link's search does: in its reading of the page, ignoring case,
inside a word or not. It refuses a claim's anchor that lies there more than
once. Any other quote that recurs, it reports and does not refuse. A grade,
a consensus or an evidence row recurs wherever a page prints two boxes, and
its claim's anchor already fixes which one is meant.

A quote stays a verbatim passage and keeps a reference mark where the passage
holds one ("Apfel 1999 [93] gelten"); a mark glued to a word ends that word, so
a quote may as well stop before the mark or start after it. A claim's label
is the sentence as printed, whole, its reference marks left out (§3.1), and is
no quote. Since a claim's id is derived from its quote (§2), re-cutting an
existing quote renames the claim and every reference to it: an edit with
history (§7), never a silent one.

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
(§3.3) and never written on the statement. A claim's `grade`, `verb`,
`direction`, `basis`, `consensus` and `consensus_share` all require it: each is
read off the page. The words they may hold are no list in the schema but the
grading scheme their source declares (§3.1), whose entries carry their own
provenance — the method table's cells, the recommendations that print a
negated form or a basis, and `modelling` with a rationale for a form the
source prints nowhere — so that a value is checked against the words the
source prints.

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

**What it checks.** Seven questions. Six are asked of one subject the pull
request adds — a claim, a statement, an edge, a placement of an axis — against
the ground the pool already holds for it, and catch what was invented or
misread. The fourth is asked of the ground itself — the page — against the
pool, and catches what was left out:

- **A claim against its page.** The judge reads the physical page the claim's
  locator names — the same extracted text the validator's quote check reads
  (`--verify-quotes`; §14) — and asks whether the claim says what is printed
  there: the `label` is the sentence at the quote, one sentence and not the
  whole recommendation the source marks (§3.1) — for a table, the row or group
  §5.1 K names; `kind` follows the sentence's form; `grade`, `verb`, `direction`,
  `basis`, `consensus`, `consensus_share`, `recommendation_no` and `section` are as printed at that place —
  a box's grade, basis and consensus reaching its sentences as §3.1 says (a
  lettered part's only its own), the verb the one §3.1 reads off the
  predicate, a consensus class the one the source's table gives the printed
  share, a direction the one the grade fixes where it fixes one, a table's or
  figure's `section` where it is printed —,
  and none is supplied where the page prints none (§11, rule 6; a body-text
  claim carries no grade, §5); a number in the label — a day, a dose, a value,
  a threshold — is the number on the page, and a reference mark the page
  prints is left out of it (§3.1) — which number is a mark is the judge's
  reading. A `threshold` is what the page
  prints, one per claim; a `combination` (§3.1) joins every member the passage
  joins and no other, its connective is what the page prints between them,
  and its operator is the reading the connective bears in its sentence, never
  decided by the word alone; a list the page does not combine is marked
  `not_stated`, not read; a `sum`'s points are each the cell its row prints,
  in the order of its parts — no quote carries them (§3.1), so this reading
  is their only check. A rule printed inside a box sentence, and a half a
  „sondern“ joins, is a narrower claim of its own as §3.1 says, and a bound
  on a score a threshold on the claim that prints it, never on the table's.
  An entry of a source's `grading_scheme` (§3.1) is
  read the same way against the pages it quotes: each grade, wording,
  negated form and class as the table prints it, in its order, `open` only
  where the table makes the grade an open recommendation, `direction` only
  where it makes the grade one for or one against, a basis as the
  recommendations print it and what the source says it means, and `modelling`
  only for a form the source prints nowhere. Whether the quote is on the page,
  whether the id hashes from the anchor, whether the file fits the schema, it
  does not ask: the validator has, and the judge runs after it and repeats
  none of it — the definition lists what the validator covers so that the
  judge skips it. That is the difference in kind between the two: a passage on
  the page is mechanical, "as printed" is a reading — whether a quote drops or
  keeps a hyphen at a line end (§6.2) among it.
- **A statement against its supporting claims.** The judge reads the statement
  with every claim that `supports` or `contests` it and asks whether the
  proposition is what the claims say: nothing the label asserts is absent from
  every supporting claim, nothing a supporting claim asserts contradicts it;
  each slot names what the claims' sentences name in that role — the
  population operated on, the action, the condition, the outcome; the `short_label` compresses without changing the
  meaning (§3.2); a `contests` edge really contradicts. Sameness is what it
  judges: a wrong `supports` edge is a statement that does not say what its
  claim says.
- **A body-text edge against the rule.** For each `refines`, `supplements` and
  `limits` edge the judge reads both claims and the page and applies the
  body-text rule of §5.1 as this document states it when the judge reads: the
  sentence passes the gate, the kind the edge carries is the first test that
  holds, the target is the right claim, the from-claim is ungraded and holds
  one answer, the rationale names the clause and the term, and the edge is
  not between sentences of marked recommendations. For each `disagrees_with`
  edge it reads both claims on their pages and asks whether they answer one
  question differently as printed, and whether the rationale quotes both
  sides and says what they differ in.
- **A page against the pool.** For every page a claim of the branch cites,
  the judge — already holding that page for the first question — reads it
  the other way round and asks whether everything on it that the pool's
  rules make a claim is one: every sentence of every recommendation the
  source marks on the page has a claim, sharing its number where the source
  numbers it (§3.1: a marked recommendation of two sentences is two claims),
  every body-text place that passes the rule is a claim with its edge
  (§5.1), read in the section §5.1 gives it, every alternative of an
  "entweder … oder" is a claim of its own, a table's rows as §5.1 K counts
  them, every claim of a marked recommendation is linked as §3.1 says — it
  supports or contests a statement, one per action it instructs, a
  definition's concept reaches it by `defined_by`, a gap notice and a sentence
  saying only what the evidence shows stay unlinked —, and every body-text
  claim has its edge — a body-text claim supports no statement, the rule of
  §5.1 gives it the edge instead; a decline (§5.1 G4), a recommendation or
  decline outside the marked ones (§5.1 U), a definition admitted only where
  it stands (§5.1 G1, reached by `defined_by`) and the top or a part of a
  combination that is not itself an answer carry none (§5.1 N 5). What "marks" means is
  read off the source, never assumed: a numbered, shaded box in one
  guideline, a numbered statement, a bulleted "offer", a sentence with a
  grade letter in another, whatever origin or status it prints beside the
  mark; the schema's `kind: recommendation` with whatever
  number, grade and consensus the source prints is the unit, and the judge's
  questions are stated over that, not over any one layout. The page is the
  scope, not the chapter: the branch cited it,
  so the branch answers for it, and no declared range is needed. What a
  package promised — a chapter, a section of the source's outline — is the
  package's verification, read from the judge's report, not a finding the
  judge attests on its own; a page nobody cited is read by nobody.
- **A hierarchy edge against the four questions of §4.1.** For each
  `broader` and `in_scope_of` edge the branch adds or changes, the judge reads
  both concepts, the rationale and, where it names one, the passage, and asks
  the second question of §4.1: does "X is a Y" hold whatever guideline one
  reads (then `broader`), or only because this guideline stipulates it for
  its own scope (then `in_scope_of`, with a rationale that says where the
  guideline does, and a `condition` where the membership holds only under a
  circumstance)? A situation after an intervention is no special case of it
  (§4.1, edge cases). That the edge exists once and forms no cycle the
  validator has checked.
- **A placement against its axis's rule.** For each placement the branch adds
  or changes in an axis definition, the judge reads the axis's `rule` and
  applies it as written: for a dimension, to the statement's supporting
  claims — the sentence first, and the heading or passage the rule allows
  only where the sentence names no value —; for a hierarchy, to the concept,
  asking whether the rule puts it under this parent. A placement's own
  `rationale`, where it has one, must say what the rule alone does not
  decide. The judge knows no axis: it reads the rule the definition carries,
  and a rule that does not let it decide makes the placement *undecidable*.
  That a hierarchy placement is an edge of the pool the validator has
  checked.
- **A sequence edge against the criterion of §5.** For each `follows` edge
  the branch adds or changes, the judge reads both statements with the
  claims that support them, and the passage the rationale quotes on its
  page, and asks the four tests of §5: does the page make the later
  recommendation's step depend on the outcome of the earlier one's measure,
  or on a state of the patient, which stays a condition — a state worded
  "despite", "under" or "after" a measure only where that measure is the
  earlier statement's, a contraindication only where it arises under it, a
  value only where it measures the response to it? Does the edge run the
  page's way, from the step that depends to the measure it depends on? Are
  `transition` and `trigger` the ones the passage bears — `concurrent` only
  where the page says "at the same time" —, does the rationale quote the
  trigger's wording as printed, and does the pair carry no `complements`
  edge besides? Where the edge's pair carries another `follows` edge, or its
  claims are joined by `disagrees_with`, it reads both printings and asks
  whether they state the order differently, each kept. A finding that the
  page bears another kind, direction, transition or trigger is `disputed`;
  where the tests point both ways the edge is unjudged, its two readings
  under *undecidable* with the test that leaves it open. Either is the
  border case the linking pull request names in a line of its own; nothing
  writes a status on the edge (§5). That both statements are supported by
  claims of one source, that the later population is not wider, that the
  chain closes no cycle but as §5 allows, and that the two properties are
  present and from their lists, the validator has checked.

The subjects of a run are the entities and edges the branch adds or changes
against `main`, plus every statement whose evidence the branch changes — a new
`supports` edge re-opens the second question for its statement — plus every
page those claims cite, for the fourth. The judge
reads the source, the pool and the rules of this document, and nothing else:
no other guideline, no textbook, no medical judgement. It judges the
extraction against the page, never the guideline against medicine; a claim
that faithfully carries a recommendation the judge would disagree with is
consistent. Nothing in it names a guideline, a grading scheme or a concept —
the seven questions are stated over the schema's properties and this
document's rules, and the same seven are asked of every source (memory
`generic-over-guidelines`).

**What it writes.** One attestation per subject read, by the judge, shaped as
§8 says: `subject` the claim, the statement, the edge or the placement (a
property of the axis, addressed as §2 addresses one); `subject_hash` its
canonical hash at the head the judge read, so that a changed subject stales
the finding; `scope` `content` for a claim, an edge and a placement, `with_evidence` for a
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
document), and its body is the questions above, stated once, over the
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
what the judge saw on the page or in the pool outside its seven questions — a
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
slots name Pankreasresektion, frühe Drainageentfernung and geringes
Pankreasfistelrisiko, each in the sentence; the short label
keeps the condition — consistent, `scope: with_evidence`. Of the edge it asks
the third, on p. 64, against §5.1: about the box's own action (G1), a value
the box's "wenn das Drainagesekret … hinweist" needs and does not give,
reported from the studies and admitted by G2's exception, nothing taken out —
`refines`, to the box claim whose wording carries the term, and the
criterion carries no grade: the kind and the target hold. But the edge carries
no `rationale`, and the rule asks for one naming the clause and the term; the
finding is `disputed`, its proof naming the property and saying, in German,
`"Die Kante nennt keinen Test und keinen Begriff (§5.1 R: Drainagesekret
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
  kind: leitlinie                                                           # what kind of document it is: the index groups by it
  title: "S3-Leitlinie Perioperatives Management bei gastrointestinalen Tumoren (POMGAT)"   # the title proper (§6.1)
  short_label: S3 POMGAT 2023                                               # one line on a card; the title stays the citation
  version: "1.0"                                                            # as printed, without the word for it
  date: "2023-11"                                                           # the date of that version, ISO 8601 at the precision printed
  provenance:                                                               # where both are printed (§6.1)
    version: {at: sources/pomgat-lv-1.0#page=1, quote: "Version 1.0 – November 2023"}
    date:    {at: sources/pomgat-lv-1.0#page=1, quote: "Version 1.0 – November 2023"}
  awmf_register: "088-010OL"
  url: "https://register.awmf.org/assets/guidelines/008-010OLl_S3_Perioperatives-Management-bei-gastrointestinalen-Tumoren-POMGAT_2023-12.pdf"
  content_hash: "sha256:…"
  license: "© Leitlinienprogramm Onkologie"                                 # the source's own terms; the site says beside it that it links, never rehosts
  structure: [chronologisch_perioperativ, anatomisch, modalitaetsbezogen]   # how the document is organised (§6.7)
  outline:                                                                  # its complete table of contents
    - {section: "6.1",   title: "Intraoperative Einlage einer Drainage in das OP-Feld", page: 58}
    - {section: "6.1.3", title: "Pankreas", page: 61}
    # … every numbered section, those without a recommendation included
  grading_scheme:                                                           # its method table, quoted (§3.1)
    grades:                                                                 # in the order the legend follows
      - grade: "0"
        description: Empfehlung offen
        verb: kann
        open: true                                                          # weighs: neither for nor against
        source:                                                             # the row of Tabelle 5, cell by cell
          - {at: sources/pomgat-lv-1.0#page=19, quote: "0"}
          - {at: sources/pomgat-lv-1.0#page=19, quote: "Empfehlung offen"}
          - {at: sources/pomgat-lv-1.0#page=19, quote: "kann"}
      # … A, B and EK, each with its row
    consensus:
      - class: starker_konsens                                              # what a claim carries: the name, slugified
        name: Starker Konsens
        bounds: ">95% der Stimmberechtigten"
        source:
          - {at: sources/pomgat-lv-1.0#page=20, quote: "Starker Konsens"}
          - {at: sources/pomgat-lv-1.0#page=20, quote: ">95% der Stimmberechtigten"}
      # … Konsens, Mehrheitliche Zustimmung, Keine mehrheitliche Zustimmung

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
  threshold:                                # as printed (§3.1), one per claim; provenance required, here the claim's own quote
    {quantity: concepts/amylase-drainagesekret, comparator: "<", value: "5000", unit: "U/L", when: "am ersten postop. Tag"}
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

- id: concepts/geringes-pankreasfistelrisiko   # derived: it has a defined_by edge (§3.2); nothing on it says so
  type: concept
  lang: de
  label: "geringes Pankreasfistelrisiko"
  facet: patient_state                      # a risk the patient has; the drain amylase that indicates it is a finding
  source: modelling

- id: statements/fruehe-drainageentfernung-pankreasresektion
  type: statement
  lang: de
  label: "Nach Pankreasresektion kann die abdominelle Drainage früh (bis 4. postoperativer Tag) entfernt werden, wenn das Drainagesekret ein geringes Pankreasfistelrisiko anzeigt."
  short_label: "Frühe Drainageentfernung bei geringem Fistelrisiko"   # for a box; at most 60 characters
  slots:
    population: concepts/pankreasresektion
    action: concepts/fruehe-drainageentfernung
    condition: [concepts/geringes-pankreasfistelrisiko]   # always a list; several entries hold at once (§3.2)
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
- [concepts/geringes-pankreasfistelrisiko, defined_by, claims/pomgat-lv-1.0/1f80c3aa,   # its one edge (§5); where the page joins several rules, to the claim combining them (§3.1)
   {source: modelling, as_of: "2026-09-24", lang: de, rationale: "Kriterium für geringes Pankreasfistelrisiko: Drainageamylase am ersten postop. Tag."}]
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
inheriting the grade, and it carries the threshold it prints, while the
condition it establishes is derived only because an edge reaches the criterion
— nothing on the concept says so; where in the document a claim was found (`section`) sits on
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
   A source that disagrees with itself is a claim per printing joined by
   `disagrees_with` (§5): both shown, neither chosen.
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
  is `docs/publication.md`. The projections for programs and assistants — a
  machine-readable site, a read-only server a chat assistant calls, and a view
  drawn inside the conversation — are designed in `docs/publication.md` §8.

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
