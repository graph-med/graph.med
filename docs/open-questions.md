# Open questions

What is still undecided. One entry per question, newest concerns last. This
registry is the handover between sessions: git records the code, pull requests
record uncertainty about a diff, `.claude/memory/` records what was settled —
what is *not yet* settled lives here, with the options considered and the
current leaning, so that no session re-derives it from scratch.

When a question is settled it leaves this file: the decision lands where it
belongs (usually the spec), and the why becomes a memory under
`.claude/memory/design/`. The `handover` skill
(`.claude/skills/handover/SKILL.md`) maintains this file at the end of a
session; editing it by hand is just as valid. What the current pass of work is,
and which package is next, is not a question and lives in `docs/work/` and `docs/HANDOFF.md`.

---

## grade-derivation  (graph-representation.md §3.3, §6.5; schema `statement.derived.effective_grade`)
**Question:** How does a statement's effective grade compose from its supporting claims' grades — and what does a contesting claim do to it?
**Options:** highest supporting grade wins · most recent guideline's grade wins · no scalar at all — display the grade *distribution* and let the reader judge · a per-view-kind policy declared in the schema
**Leaning:** toward the distribution — collapsing "one S3 guideline says soll (A), another says kann (0)" into a single scalar loses exactly the disagreement the model exists to surface; a contesting claim should mark the statement contested rather than adjust any number. Medically sensitive; settle against real content, not in the abstract. (2026-09-05)
**Settled by:** the first statement with supporting claims from two graded sources; lands in the schema.

## statement-shape  (graph-representation.md §3.2; schema `statement.slots`)
**Question:** Which slot vocabulary does each statement type need — is population/action/condition/outcome (PICO-shaped) right, and for which content is it overkill?
**Options:** one fixed slot set for all statements · slot sets per statement type in the schema · free-form statements with slots optional everywhere
**Leaning:** slot sets per statement type; the schema ships one PICO-ish set with every slot optional as the starting point, and the granularity rule (smallest independently contestable unit) is the fixed part. One source's ninety statements fit it, with three strains worth keeping in view: *comparative* statements (7.11 "epidural analgesia is superior to peripheral regional analgesia", 7.12 "TAP block as an alternative") have no comparator slot, so a different comparison fills identical slots — a `comparator` slot or a per-type slot set is the likely fix; `outcome` is used both as the *purpose* of an action (chapter 7.4.1, nine statements "X zur Prophylaxe des POI") and as a *measured effect* (7.11, pain intensity), and whether the two should share a slot is unsettled; and slots are roles, not types — `mpom` is the action of 8.1–8.5 and the condition of 8.6–8.7 without duplication, which is reassuring. The shape has not yet met cross-source sameness. (2026-09-05)
**Settled by:** a second source's claims linking into existing statements without the slots getting in the way.

## concept-minting  (graph-representation.md §2, §11.3)
**Question:** Who may mint uncoded concepts, and what keeps the concept namespace from silting up with near-duplicates?
**Options:** any agent, with search-before-mint discipline and review · a curated namespace only humans extend · agents propose, a periodic curation pass merges/blesses
**Leaning:** any agent with search-before-mint plus review (the rule is already §11.3); concepts are thin and sameness lives in edges, so late cleanup is cheap. The near-duplicates observed so far are driven by population *scope*, not wording (`gastrektomie` beside `gastrektomie-oder-magenteilresektion`, `pankreaskopfresektion` beside `klassische-whipple-operation`, five liver-resection concepts): the boxes draw different boundaries, so both are right. The `broader` edge (spec §5, decided 2026-09-10) is the answer to that part — such concepts coexist under one family without looking like duplicates — and narrows this question to who mints and how many true duplicates review has to absorb. (2026-09-10)
**Settled by:** the duplicate rate observed after the first two independent document extractions.

## view-filter-language  (graph-representation.md §4, §13; schema `x-view-filters`)
**Question:** How expressive do view filters get — fixed filter forms or a real query language?
**Options:** keep the fixed filter forms, adding one per proven need · adopt an existing query language (a GQL/Cypher subset, Datalog) early · filters as code in the build layer, not data
**Leaning:** fixed forms, extended one proven need at a time — a query language is a dependency and an injection surface the data model should not commit to before it is needed, and filters must stay declarative data so cuts are reproducible. The first proven need arrived: a `section` form for selection views (spec §4, §6.7), so a chapter of a source can be a view. The physician has since asked for "specialised looks that hide aspects" and a query language that answers in the browser ("show me every node that …"); the leaning holds, because those are two different things — a *view* is data and needs a form, an *interactive* narrowing is the search and the facet filters in the page, which can grow (a facet, a group, a direction) without a language — and the grouping axes (→ grouping-axes) will say which forms are needed next. (2026-09-11)
**Settled by:** the first view a fixed form cannot express.

## evidence-profiles  (docs/work/LATER.md; schema `claim`)
**Question:** How are the per-outcome GRADE evidence tables of evidence-based recommendation boxes modelled — the ⊕-symbol ratings per outcome with effect sizes that justify a claim's grade?
**Options:** not at all (the grade plus the locator suffice; the reader follows the link) · a structured `evidence_profile` property on the claim (outcome, rating, effect, CI) · each outcome row as its own claim (kind: fact) with a `refines` edge to the recommendation claim
**Leaning:** none yet. The third option fits the model best (rows are source-anchored, quotable, individually verifiable) but multiplies claims roughly fivefold per box; decide when a consumer (a view, the site, grade-derivation) actually needs the profiles rather than on principle. (2026-09-05)
**Settled by:** the first consumer that needs evidence detail beyond the grade.

## gap-notices  (graph-representation.md §3.2, §11.7; schema `claim.kind: gap_notice`, edge kinds)
**Question:** How does a `gap_notice` claim — a box that says "no recommendation can be given" (POMGAT 4.3 on calcium antagonists, 4.6 on perioperative glucocorticoids) — enter the semantic layer? `supports`/`contests` target statements, but a gap asserts no proposition; the structural `gap` node exists only inside a pathway, and none is authored yet.
**Options:** leave gap notices as unlinked claims until a pathway arranges them · allow a `gap` structural node outside any pathway that the claim `supports` · mint a statement of the form "no recommendation possible for X" and let the claim support it · a dedicated edge kind (`notes_gap`: claim → concept) pointing at the topic the source declines to rule on
**Leaning:** the fourth — the gap is *about a concept*, not a proposition, and an edge to the concept keeps it findable from the topic without inventing a statement nobody can contest. The gap claims are extracted and unlinked, so nothing is lost. Whatever shape gap notices take must let a recommendation stand *inside* a gap's scope: 4.7 ("in der Pankreas- und Leberchirurgie kann … erwogen werden") is the exception carved out of 4.6's gap. The site's *Lücke* direction (publication.md §3) will need this. (2026-09-05)
**Settled by:** the first pathway or view that has to render "the guideline declines to recommend here".

## quality-indicators  (graph-representation.md §3.1, §5; schema `claim.kind`, edge kinds; docs/work/LATER.md)
**Question:** How do a guideline's quality indicators — POMGAT chapter 9 defines four (Tabelle 7): each a numerator/denominator measure with a Qualitätsziel, derived from one "soll" recommendation it restates as Referenz-Empfehlung — enter the pool? They are source-anchored and quotable like claims, but no claim kind names what they are, and `supports`/`contests` misdescribe the relation: a QI is not evidence for its statement, it is a measure *of adherence to* it.
**Options:** a claim kind `quality_indicator` plus a new edge kind (`measures`: claim → statement) · model the QI as a statement of its own that the QI text `supports`, linked to the underlying statement by `complements` · leave QIs out of the pool entirely
**Leaning:** the first, once a consumer asks — a hospital-facing view wants "this one is audited, target 0%" next to the recommendation, and a dedicated kind plus edge keeps a QI a claim (verbatim, hashed, verifiable) without pretending it is evidence. Two scope mismatches await a modelling pass: QI 3's denominator spans three organ groups whose recommendations are three statements, and QI 4's is narrower (Kolonresektion) than the box it references. (2026-09-05)
**Settled by:** the first view that has to show which recommendations are audited, or a second source whose QIs land on the same statements.

## cut-publication  (publication.md §7; graph-representation.md §4; schema `view.cuts`)
**Question:** How is a cut served next to the floating view — and does a cut get a single-file export (a PDF) as the citable artefact?
**Options:** the build checks out each cut's `as_of` commit and renders it under `<view-id>@<n>` on every deploy · a cut is rendered once, when made, and its output committed to a publication branch · cuts are not served at all; the URL redirects to the repository at the commit
**Leaning:** the first — one build, no second branch to keep consistent, and a cut stays exactly as reproducible as the pool it is cut from; build time grows with the number of cuts, which is fine for years. A PDF export belongs to a cut if anywhere. (2026-09-06)
**Settled by:** the first citation of a view.

## decision-graph-derivation  (publication.md §3; graph-representation.md §3.2 structure, §5 `branch`/`guard`)
**Question:** The site draws one decision tree *derived* from statement slots. Is that the durable form, or a stand-in until pathways are authored — and what do authored pathways add that the derivation cannot?
**Options:** keep deriving from slots and never author pathways for plain recommendation chapters · author a pathway per chapter as structural nodes with `branch` guards and `about` edges, and render those instead · both — derived by default, authored where a chapter is a real algorithm (a flowchart in the source)
**Leaning:** the third. The derivation is honest (every element is a slot value or a claim's grade, nothing invented) and covers recommendation lists well, but it has no branch labels, no ordering between decisions, and no gaps; a chapter that *is* a decision algorithm in the source deserves authored structure with guards. (2026-09-06)
**Settled by:** the first source chapter that is a flowchart, authored as a pathway and read next to its derived graph.

## phase-vocabulary  (graph-representation.md §3.2, §6.7; schema `statement.slots`)
**Question:** Where does the perioperative phase — präoperativ, intraoperativ, postoperativ — live, now that chapters are filters and not knowledge? POMGAT's headings encode it; a second guideline organised anatomically will state it in the sentence instead.
**Options:** a `phase` vocabulary on the statement · a phase concept in the population or condition slot · a facet value on the action concept · nothing — the phase stays in the label
**Leaning:** on the statement: "postoperativ" qualifies the recommendation, not the patient, and a small controlled vocabulary makes "colorectal, postoperative" a cross-guideline query the way "7.4" never can be. (2026-09-10) Since 2026-09-13 this is an instance of a grouping axis (→ grouping-axes; spec §4.1): the phase is a *statement dimension*, proposed for a view by a person, tested, and asserted as slot values — not a vocabulary the pool fixes in advance, so a guideline without a perioperative phase never sees the slot. (2026-09-13)
**Settled by:** WP-0007, which writes the carrier rule into the spec; the phase itself is then proposed and asserted on the first source by WP-0009.

## structural-recommendations  (graph-representation.md §3.2; schema `concept.facet`, `statement`)
**Question:** How are recommendations of a structural or organisational kind — those a physician on the ward cannot act on, such as the specialised nurse in mPOM (box 8.7) — told apart from the rest, and shown? The physician's point is that they play no part in a ward decision.
**Options:** shown in the tree like every other recommendation · in the tree with a marker · not in the main tree, in a view of their own · a facet value on the action concept (`organisation`) that the site can mark on and a view can exclude
**Leaning:** the fourth, which gives the second and the third at once: a facet is data that review can check, the box gets a marker, and a "ward" view excludes the facet by a fixed filter form (→ view-filter-language). Needs a linking pass that classifies the candidates; not part of the UI pass. (2026-09-11)
**Settled by:** the linking pass that classifies the first source's candidates, and the first view that excludes them.

## chapter-search  (publication.md §3 "Chapters and search")
**Question:** Should the chapter tree be searchable? The physician found nodes through the chapter tree that the search box missed, and asked whether a search in the table of contents should exist.
**Options:** no — fix the search box (WP-0001) and keep one search · the one search box also highlights the sections whose statements match, in the chapter tree · a second search field inside the chapter panel
**Leaning:** the second, after the first: one query, two places it shows — the counter already reads "n matches in m sections", and lighting those sections in the tree is the same fact drawn where the reader is looking. A second field would be two searches to explain. Decide after WP-0001 has fixed the misses that prompted the question. (2026-09-11)
**Settled by:** the physician's next read of the site with the search fixed.

## grouping-axes  (graph-representation.md §5 `broader`; memory concept-hierarchy-depth; schema `source.structure`)
**Question:** By what axes are patient groups grouped into families? Today the families are the roots of the `broader` hierarchy, minted by the linking pass from the source's own boundaries; the physician asks whether *broader* emerged in post-processing or is first class, for the hierarchy to be *defined*, and for groupings to choose by — the outline, the anatomical region, the operative phase.
**Options:** one hierarchy (`broader`), defined by a written rule per facet · several hierarchies, one per axis, each its own edge kind or a `broader` edge with an `axis` property · the axes as views — a fixed filter form per axis over one hierarchy plus the phase vocabulary (→ phase-vocabulary) and the outline (→ document-structure-is-provenance)
**Leaning:** `broader` is first class — an edge with provenance, never a field or a post-processing artefact (memory relations-are-edges-not-fields) — and one hierarchy per axis is the honest shape: anatomy and operative phase are different partitions of the same groups, and one `broader` cannot carry both without lying about subsumption. The outline is not an axis but provenance, already a filter. (2026-09-11)
**Decided on 2026-09-13** (maintainer; spec §4.1, memory grouping-axes-proposed-and-tested): *which* axes exist is not a question the pool answers. Any closed vocabulary breaks with the third guideline, so the pool fixes a mechanism: a person proposes an axis for a view, a tool tests its feasibility and reports (never writes), a linking pass asserts what holds with provenance, and a view declares which asserted axes it groups by. Two carriers, one rule: a value that varies with the recommendation is a statement dimension (a slot); a value that is a true "is a" of a concept is a hierarchy respect (`axis` on `broader`). What remains open here is the design detail WP-0007 writes down: the fields of an axis definition, how each measure of the report is computed, and the form of `group_by`.
**Settled by:** WP-0007 (the mechanism in full), then the first proposed axes asserted on the first source (WP-0009) and the first view that groups by one (WP-0010).
