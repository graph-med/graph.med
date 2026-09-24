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
and which card is next, is not a question and lives on the board (`uv run tools/board.py list`).

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
**Leaning:** fixed forms, extended one proven need at a time — a query language is a dependency and an injection surface the data model should not commit to before it is needed, and filters must stay declarative data so cuts are reproducible. The first proven need arrived: a `section` form for selection views (spec §4, §6.7), so a chapter of a source can be a view. The physician has since asked for "specialised looks that hide aspects" and a query language that answers in the browser ("show me every node that …"); the leaning holds, because those are two different things — a *view* is data and needs a form, an *interactive* narrowing is the search and the facet filters in the page, which can grow (a facet, a group, a direction) without a language. Grouping is not a filter either: a view's `group_by` (spec §4.1) selects nothing and only says how the members are grouped, so it adds no form here. (2026-09-11, 2026-09-13)
**Settled by:** the first view a fixed form cannot express.

## gap-notices  (graph-representation.md §3.2, §11.7; schema `claim.kind: gap_notice`, edge kinds)
**Question:** How does a `gap_notice` claim — a box that says "no recommendation can be given" (POMGAT 4.3 on calcium antagonists, 4.6 on perioperative glucocorticoids) — enter the semantic layer? `supports`/`contests` target statements, but a gap asserts no proposition; the structural `gap` node exists only inside a pathway, and none is authored yet. The body-text rule (graph-representation.md §5.1, G1) lets a body-text sentence refine, limit or supplement a gap notice on its topic; while the gap claim is linked to nothing, that edge hangs off a claim no statement shows, so the card's zone 6 cannot show it — whichever shape is chosen decides where such a passage appears. (2026-09-23)
**Options:** leave gap notices as unlinked claims until a pathway arranges them · allow a `gap` structural node outside any pathway that the claim `supports` · mint a statement of the form "no recommendation possible for X" and let the claim support it · a dedicated edge kind (`notes_gap`: claim → concept) pointing at the topic the source declines to rule on
**Leaning:** the fourth — the gap is *about a concept*, not a proposition, and an edge to the concept keeps it findable from the topic without inventing a statement nobody can contest. The gap claims are extracted and unlinked, so nothing is lost. Whatever shape gap notices take must let a recommendation stand *inside* a gap's scope: 4.7 ("in der Pankreas- und Leberchirurgie kann … erwogen werden") is the exception carved out of 4.6's gap. The site's *Lücke* direction (publication.md §3) will need this. (2026-09-05)
**Settled by:** the first pathway or view that has to render "the guideline declines to recommend here".

## quality-indicators  (graph-representation.md §3.1, §5; schema `claim.kind`, edge kinds; card #112)
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

## judge-provider  (graph-representation.md §8.1; README.md "Checks")
**Question:** Which model does the judge's frontmatter pin, where does the workflow's key live, and who pays — the session's run reads with the session's own model, authenticated by the host, but the second run in CI needs a key of its own.
**Options:** the frontmatter pins one model and the workflow holds its key as a repository secret, the model's domain allowlisted like the source's · the frontmatter names no model, so each run reads with whatever its harness offers and the proof records which · two different models, one per run, so the second run is independent in kind as well as in time
**Leaning:** the first; a pinned model is what makes the two runs comparable, the second run's independence comes from being a second run, and a second vendor is a second bill and a second prompt to keep honest — until a disagreement rate between the two runs says otherwise. The proof records the model either way, so the choice is reversible per finding. The one measured run (§8.1's example, 2026-09-21): four subjects and two pages, about four minutes and sixty thousand tokens as a session subagent; an extraction card of thirty claims is of the order of ten times that, twice per pull request. Needs the maintainer, before the judge's package is processed. (2026-09-21)
**Settled by:** the maintainer, when the judge's card is processed.

## attestation-identity  (graph-representation.md §2, §8.1; schema `x-namespaces.attestations: sequential`)
**Question:** Attestation ids are sequential, and the judge writes them on branches: two pull requests judged in parallel both mint `attestations/0042`, and the coordinator's stack has to renumber one of them.
**Options:** sequential per agent (`attestations/<agent>-0042`), still colliding on one agent's parallel runs · derived from `(by, subject, subject_hash)` like a claim's id from its anchor, the date inside · sequential, renumbered by whoever stacks
**Leaning:** derived — identity is deterministic wherever it can be (§2), and two readings by one agent of one subject at one hash are one attestation by construction, which is also what a re-run on a push should overwrite. A person's attestations can take the same form. (2026-09-14)
**Settled by:** the schema follow-up of the automated review (a card on the board).

## edge-address  (graph-representation.md §2, §5, §8.1; schema `attestation.subject`, `entity_ref`; publication.md §2)
**Question:** An edge derives its id from `(from, kind, to, discriminator)` (§2) but has no URL form, so no attestation can name one — and the judge's third question, the body-text edge against the rule of §5, has no subject to write its finding to.
**Options:** `edges/<source-id>/<hash8>` over the tuple, mirroring a claim's id, with a page on the site · the attestation names the from-claim and the proof names the edge · the tuple itself as the subject, a list where every other subject is a reference
**Leaning:** the first — a page per edge is what the property-level address of §2 already promises for provenance and feedback, and the site links what an edge relates; the hash makes two agents' addresses of one edge the same. (2026-09-14)
**Settled by:** the schema follow-up of the automated review, together with `docs/publication.md` §2.

## judge-rerun  (graph-representation.md §8.1)
**Question:** When is what already lies on `main` judged again — after a change of the judge's definition or its model, a re-fetched source, or a change to a rule the judge applies (the body-text rule of §5)?
**Options:** never automatically; a package re-judges a namespace when a person decides · on every push to `main`, the whole pool · whenever a rule of the spec changes, everything that rule governs
**Leaning:** the first; a changed rule stales nothing mechanically, so re-judging is a decision, and the definition hash in every proof says which text of the rule a finding was read against. (2026-09-14)
**Settled by:** the first change to the body-text rule, or to the definition, after the first judged pull request.

## completeness-scope  (graph-representation.md §8.1, §3.1, §5; schema `attestation.scope`)
**Question:** The judge's fourth question reads a page the branch cites and asks whether everything on it that the rules make a claim is one; but a page nobody cited is read by nobody, and what "everything" is on a page depends on rules that are still moving — the body-text rule's gate, the gap-notice and quality-indicator questions.
**Options:** page-local only, as §8.1 says, and the declared range (a chapter, a section of the outline) is the package's verification read from the report · the run also reads every page of every outline section a cited page belongs to · a section-level completeness attestation on the source with the outline entry as the address
**Leaning:** the first; a page the branch cited is ground the branch answers for, a section is a promise the card made, and the two should not be confused in one attestation. Revisit when the second guideline shows pages with boxes that no branch ever cited. (2026-09-21)
**Settled by:** the first extraction card judged end to end, and the schema follow-up that names the source-with-claims scope.

## scope-edge-pinning  (graph-representation.md §4, §5 `in_scope_of`; schema `view.scope_root`)
**Question:** A scope edge holds inside one guideline's scope, and it is pinned to a view only by the `scope_root` it leads to. When a second guideline reuses a concept and writes its own scope edges from it, a view's walk up from an anchor can pass through the other guideline's edges on its way to its own root — and show as "applying generally" what only the other guideline stipulated.
**Options:** read, per view, only the scope edges on a path that ends at its root (enough while no path crosses a foreign edge) · a scope edge names the source whose scope it states, and a view reads only the edges of its sources · scope edges filed per view and read only from there
**Leaning:** the second once it happens — the source is what the stipulation is a stipulation of, and the edge already sits in that source's edge directory; the first is what the model says today. (2026-09-24)
**Since card #202** (the same day) a view's scope tree is drawn by the placements of its first axis, a hierarchy each guideline writes for itself, so a view walks only the edges its own axis chooses and a foreign scope edge reaches it only by a placement a reviewer let through. That may settle the question without an attribute on the edge; the maintainer decides whether it does.
**Settled by:** the second guideline that reuses a concept carrying a scope edge.

## scope-groups-spanning-organs  (graph-representation.md §4, §5 `in_scope_of`; publication.md §3 "what applies generally")
**Question:** A group that names several organ families — "Pankreas- und Leberchirurgie", "Tumorresektion oberer GI-Trakt und Pankreas", "Operation am oberen Gastrointestinaltrakt", the resection defined as "nicht-kolorektal" — hangs in the first view's scope tree beside the organ families, under the operation of a gastrointestinal tumour. Opening an organ family therefore reaches what applies to that operation as such, but not what the guideline recommends for such a spanning group: opening *Leberresektion* does not show the glucocorticoid recommendation for pancreatic and liver surgery. Should an organ family also reach the spanning groups that name it?
**Options:** leave it — the spanning group is one answer of its own, found under the same parent · a scope edge from each named organ family to the spanning group (several parents; the tree then shows the family under each, and the "applies generally" list grows by the spanning groups' statements) · `broader` from the organ family to the spanning group where "X is a Y" holds whatever guideline one reads ("Leberresektion ist Leberchirurgie"), which by itself moves nothing (a path must end in a scope edge)
**Leaning:** the second for the groups named by listing organs, none for the one defined by exclusion until a physician says whether "nicht-kolorektal" is meant as a union; it is what a physician opening an organ would expect, and it widens no recommendation. (2026-09-24)
**Settled by:** a physician reading an organ family's "applies generally" list on the first view.

## rule-claim-granularity  (graph-representation.md §3.1, §5 `defined_by`, §5.1; card #192)
**Question:** How does a derived concept reach its rule when the source prints the rule only inside a marked recommendation sentence — "Bei Risikofaktoren für einen Harnverhalt (männliches Geschlecht, tiefe anteriore Rektumresektion, Rektumexstirpation) kann …" (7.7), "… aufgrund von Risiko-Konstellationen (lange OP-Zeiten, zu erwartender hoher postoperativer Opioidverbrauch) …" (7.10)? §3.1 makes the recommendation sentence the unit, §5.1 applies only outside marked recommendations, and `defined_by` reaches only a criterion or definition claim, so today such a concept stays stated. A gap in the specification, not in the data.
**Options:** a parenthesis that states which cases a term covers becomes a criterion claim of its own, a narrower place in the box sentence, by a rule §3.1 would have to name · `defined_by` may also reach the recommendation claim whose sentence prints the rule · the concept stays stated and the page shows its label, which already carries the enumeration
**Leaning:** none yet; the first keeps the edge's target a rule claim but breaks "one claim per sentence" for boxes, the second keeps the unit but makes the edge point at an instruction. (A sentence of the body text that lists alternative answers is not part of this question: §5.1 K already makes each answer a claim, as #192 did for 4.1.) (2026-09-24)
**Settled by:** the maintainer's decision on the route; then a linking pass over 7.7 and 7.10.
