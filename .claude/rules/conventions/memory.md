---
description: The project's memory — durable facts about this project that are not derivable from the code, and the index of what is recorded.
---

# Project memory

`.claude/memory/` holds what an agent has learned about this project that the repository
does not otherwise record: design decisions, the reasoning behind constraints, and the
things that were only ever said out loud. One fact per file.

This is not Claude Code's per-machine memory. That lives outside the repository, is
private to one machine, and nobody reviews it. **Project memory is checked in**, so it is
versioned, it survives the sandbox, every contributor and every agent sees the same
facts, and a memory only becomes part of the project when a human approves the pull
request that adds it — as with every other change. A claim recorded here has been read by
someone.

Which one to use: if a reviewer should see it, or another machine needs it, it belongs
here. Machine-local quirks belong in per-machine memory.

## The index

Read a file when its line below bears on what you are doing. Do not read them all
pre-emptively.

| Memory | The fact |
|---|---|
| `environment/security-enforced-outside-model.md` | Guarantees are enforced outside the model, never by the agent obeying a rule file. |
| `environment/credential-handling.md` | The agent holds no credential; the host authenticates on its behalf. Never substitute one. |
| `environment/main-branch-protection.md` | The default branch takes changes only through an approved pull request. |
| `conventions/editing-your-own-instructions.md` | Editing the files that instruct you is allowed; saying so in the PR is the obligation. |
| `environment/commit-author-is-not-evidence.md` | A commit's author line is display only, not evidence about the setup. |
| `environment/push-failure-triage.md` | Which failures are host-side, which are the design working, and why commits are usually safe. |
| `environment/screenshot-skill-needs-sbx-docker.md` | The `screenshot` skill needs the `sbx` sandbox's own Docker daemon; a session on a different harness has none, and starting one is refused — report it, do not work around it. |
| `environment/github-app-permissions.md` | The App holds organisation Projects and repository Issues, read and write; a 403 "Resource not accessible by integration" names the missing permission in `X-Accepted-Github-Permissions` — set on the App, accepted on the installation, token minted after. |
| `design/sources-referenced-never-rehosted.md` | Sources are never committed or rehosted; the graph links to public URLs, and agents download sources per session. |
| `design/quote-gate-follows-the-site.md` | The MCP server gates nothing the site shows openly: `get_provenance` returns each claim's sentence whole with page and link, anchor quotes capped at 100 characters; every other tool cites by URL and page (2026-09-28, #290). |
| `design/pool-and-views.md` | The repository is one pool; graphs are versioned views (filter + as-of commit); one schema governs everything. |
| `design/two-layer-identity.md` | Claims have deterministic source-anchored identity and never merge; semantic nodes are minted; sameness is an edge. |
| `design/staleness-and-verification.md` | One content-hash mechanism for review, verification and references; stale downgrades, only invalid blocks. |
| `design/view-page-is-a-decision-tree.md` | The view page is one decision tree (which patient group? → which condition? → recommendation → aim, answers on the edges, a question at every fork, nothing overlapping), drawn by Cytoscape.js + dagre, self-hosted; not chapters, not an outline. |
| `design/document-structure-is-provenance.md` | Chapters are provenance (`section` on the claim, `outline` on the source): a filter and a grouping the reader may choose from the switch, never nodes or edges in the pool and never the default shape; no `outlines/` namespace. |
| `design/relations-are-edges-not-fields.md` | A relation is an edge with provenance (`broader`, `codes_as`), never a field; `broader` inherits nothing and names no axis — a hierarchy axis only picks edges. |
| `design/short-label-limit.md` | `short_label` is at most 60 characters (schema), target 55; concepts get one only above about 45. |
| `design/label-case.md` | A concept's `label` and `short_label` are in running-text case: as their words read inside a sentence of their language, the first word included ("angemessener Flüssigkeitsstatus", "ohne Schocksymptomatik"; nouns, names, acronyms and units keep their case); printed words, statements and other labels are not under it; the build shows labels as stored and changes no case (#257, 2026-10-10). |
| `design/direction-legend.md` | The four-word direction (für, gegen, abwägen, Lücke) is derived from claims read in their source's grading scheme: the wording of an open grade (kann) → abwägen with a lean, any other recommendation by its direction; facts have none. |
| `design/box-granularity-per-sentence.md` | A claim is one sentence of a marked recommendation, not a box; every sentence of a box is a claim sharing its `recommendation_no`; the box's printed grade goes to its recommendation and gap-notice sentences (by wording where it prints several; a lettered part's to that part's), its consensus to every sentence, no grade to a fact, criterion or definition; a sentence instructing two actions supports two statements; a lead-in over full-sentence items is no claim; a fact saying only what the evidence shows stays unlinked; an adapted box is read like any other (#325); beside its own claim, a sentence yields a narrower one for a rule printed inside it (a criterion claim, its concept derived) and for a half a „sondern“ joins, unless an arrow grade fixes the other direction (#328). |
| `design/concept-hierarchy-depth.md` | `broader` goes as deep as subsumption does (three levels in POMGAT); families are concepts without a parent; the site folds recursively. |
| `design/generic-over-guidelines.md` | Nothing in the build, schema, validator or design is specific to one guideline: no ids, family names, or vocabularies admitted because the current source needs them; one code path per rule at every level. |
| `design/grouping-axes-proposed-and-tested.md` | An axis (what a view groups by) is never fixed in the pool or the build: a person proposes one per guideline as an `axes/` entity, a tool tests and reports (coverage, disjointness, unplaced, depth), a linking pass asserts it, a view offers it in `group_by`. An overlay: its placements stay in its file — values for statements (dimension, facet `qualifier`), or for each concept the existing `broader`/`in_scope_of` edge it hangs by (hierarchy); the tree of patient groups is the view's first axis. |
| `design/box-colour-by-direction.md` | A box is coloured by its direction (the banner's four colours); its label begins with the glyph, the grade as printed and, where the grade does not carry it in its scheme, the verb as a word; EK is marked "EK". Not by grade, not by verb; the border carries only state. |
| `design/claim-evidence-per-outcome.md` | A claim's evidence certainty is `evidence`, a list of {outcome?, key?, value?, note?, system?}, one entry per row of the box's evidence block, and per endpoint where a row names several, in the rating system's own words, each stating an outcome, a value or a note, and its system wherever it states an outcome or a value: a row keyed by a component, subgroup, arm, comparator, device or regimen keeps its printed `key`, never an outcome, several names under one rating one key joined by ", "; a range one value as printed; the box's own rating beside its rows an entry of its own; a cell's words instead of a level, or a heading's on the kind of evidence, the `note`; values as printed, compared without regard to case; never a scalar, never mapped between systems, never reduced to one; a rating outside the box no entry; provenance required like the grade, a quote per entry; a box's rows go to each sentence with a statement of its own. |
| `design/access-is-a-dimension.md` | The operative access is the dimension `axes/zugang` (offen, minimalinvasiv), never part of a population's name: robotic is minimalinvasiv, oesophagectomy variants stay procedures, no placement means "not distinguished"; asserted, not in `group_by`. |
| `design/body-text-rule.md` | A body-text place (sentence, footnote, table read in rows) earns a claim and an edge only by spec §5.1: gate G1–G4 in its section (a float's where the box naming it stands; a section's own text with its subsections' boxes, a boxless subsection with its parent's, never a sibling's), then `disagrees_with` → `refines` → `limits` → `supplements`, first that holds; a decline is a gap notice without an edge, an evidence gap nothing; a recommendation in the guideline's voice no box of its section covers is a claim without an edge in no statement (U); a definition a heading marks is a claim wherever it stands when a box uses its term; kind by form, never graded, one claim per answer (a table per instrument or per row); no edge between sentences of marked recommendations; an edge never decides a statement's condition (#325, #341). |
| `design/scope-tree-and-anchor.md` | One anchor per statement (the view's `anchor_slot`): every recommendation exactly one patient group, where its page puts it — the target group, the patients a structural measure serves, a group the guideline brings into scope under the root by `in_scope_of` — none left in a bucket (2026-09-25); a membership true only inside one guideline's scope is `in_scope_of` (optional condition concept), never `broader`; the root is declared (`scope_root`), the tree drawn by the view's first axis; anchor / subgroup / dimension / condition by four questions per statement. |
| `design/conditions-are-a-conjunction-list.md` | A statement's `condition` is always a list of concepts; several entries hold at once (a conjunction), a source's "or" is one concept naming the alternatives; the other slots stay single-valued. |
| `design/page-chrome-in-the-view-layer.md` | Only the viewer reads German: the page chrome's words (legend, sheet hint) are a per-language table under `tools/site/words/`, not in `tools/build.py` and not published; the legend's keys are computed per view; collapsed at every load on every screen, opened only by its pill, nothing remembered. |
| `design/grading-scheme-on-the-source.md` | A claim's grade, verb, basis and consensus are its source's own words, checked against the `grading_scheme` the source declares as data, quoted from its pages: grades in the table's order with wording, the negated form its own pages print and open flag, a `direction` where the symbol carries one (one wording under ⇑ and ⇓ alike); bases printed beside the grade (EK beside an arrow), never a grade; consensus classes with bounds, a printed share beside its class or alone where none is named; verbs pool-wide; never mapped, never enumerated in the schema (#212, 2026-09-24; #323, 2026-10-11). |
| `design/derived-concepts-defined-by.md` | A concept established by a rule is derived because its `defined_by` edge reaches the criterion or definition claim giving it — one, or one per printing where they are joined by `disagrees_with` (#341) — computed, never stored; the threshold sits on that claim as printed (`threshold`, one per claim); how several parts combine is extracted from the page as a `combination` on the claim quoting the passage (all_of, any_of, at_least n, not_stated; connective quoted, reading modelling), nesting through claims — never a default (#204, 2026-09-24); a points table is a `sum`, each part's points as printed and quoted in no cell, its score a quantity that fills no slot, its bounds thresholds on the claims that print them (#328). |
| `design/source-disagreements-shown.md` | The graph reflects the text: where a source disagrees with itself, each printing is a claim as printed, `disagrees_with` (claim → claim, one source, symmetric, modelling, rationale quoting both) joins every pair, a concept reaches each printing of its rule by `defined_by` only where they are so joined, each side's card shows the other; nothing picks a side or is named only in a pull request (the maintainer, 2026-10-11; #341). |
| `design/view-scope-in-any-grouping.md` | The inline view's scope, in any grouping: "a few nodes" / "one patient group" is path mode, the pruned tree from the chosen grouping's root to the focus with its questions and answers; "the whole graph" is tree mode, that grouping folded as the site opens it; the model decides per call, the tool only advises; a pathway is a path through a derived tree, never a `pathways/` entity (publication.md §8, 2026-09-27). |
| `design/quotes-whole-words-across-lines.md` | A quote is a passage of its page in whole words and may cross a line break: the break read as a space, a line-end hyphen as the printed word reads (dropped where it breaks the word, kept where it belongs); the validator reads the page in columns and accepts either reading of the hyphen; a connective broken by a line is one word (#316, settling line-break-hyphen). |
| `design/quote-once-on-its-page.md` | A claim's quote lies once on its page, counted as the link's search counts (ignoring case, inside a word too): a recurring passage is lengthened until unique — a symbols cell with its row's head, a table's head from its caption or introducing sentence; `--verify-quotes` refuses a recurring claim quote and reports other recurring quotes (#347, 2026-10-11). |
| `design/reference-marks-left-out.md` | Every claim label — sentence, table row, evidence key — leaves out the reference marks its passage prints (a number glued, bracketed or in parentheses, pointing into the source's reference list) and keeps every number that is a value; the quote keeps a mark verbatim; which number is a mark is the judge's reading, no validator check (#266, 2026-10-10). |
| `design/sequences-are-edges.md` | A recommendation triggered by the outcome of another is the statement → statement edge `follows` (later → earlier), `modelling`, its rationale quoting the trigger as printed, with closed `transition` (replaces, adds, follows, concurrent) and `trigger` (target_missed, intolerance, contraindication, target_reached, reevaluation, finding, other), both required; never a field, never `complements` with properties; the condition stays on the later statement, the threshold on its `defined_by` claim, a body-text step `supplements`, no status, authored pathways beside it (#294, 2026-10-10; built by #295). |
| `design/facet-boundaries.md` | Between `patient_state` and `finding` the label decides by what it names: what the patient has or is, acute or pre-existing, stated or derived by a rule, is `patient_state`; a measured or observed result (a quantity a threshold bounds, a value named as one, signs, a test result) is `finding`; a derived concept is no finding for being derived; a circumstance and an endpoint stay two concepts (#342, 2026-10-11). |
| `design/figures-without-text.md` | A figure printed as an image (no text layer: the extracted text holds only its caption and footnotes) stays on the page, delegated to or not: no claim, statement, concept or edge holds its content; a delegating sentence is a claim as printed, the delegation in its label; its footnotes follow it, its caption is a place like any other (spec §5.1 F); a later transcription is anchored by the caption, `modelling`, read from the image by the judge and attested by a person before display; an algorithm reaches the graph as `follows` edges read from the text, an authored pathway only as #115 (#327, 2026-10-10). |
| `design/source-version-and-date.md` | A source's `version` (text as printed) and `date` (the date it prints for that version, its "Stand", ISO 8601 at the printed precision) are fields of their own, each quoted under `provenance`; the title is the title proper; the page shows both on a line of their own in the page chrome's words, a source recording neither shows none, and no date ranks anything (#265, 2026-10-10). |

## Writing one

```markdown
---
name: <kebab-case-slug, matching the filename>
description: <one line — this is what decides whether the file gets read>
metadata:
  type: project | reference
---

<the fact, stated plainly>

**Why:** <what makes it true, or what breaks without it>

**How to apply:** <what to do differently because of it>
```

File the memory in the subdirectory of the level it belongs to — `environment/`,
`conventions/`, `design/` (created with its first fact) — as
`conventions/documentation.md` defines them. A `design/` memory most often records
the resolution of an entry in `docs/open-questions.md` — see the `handover` skill.
Link related memories with `[[their-name]]`. Add a row to the index above in the same
commit — a memory absent from the index is a memory nobody will open.

What does **not** belong here: anything the code, the git history, `README.md` or a rule
already states; a decision about the repository itself — its tooling, conventions or
process — which is an ADR under `docs/adr/`; anything true only of today's session,
such as a current outage or a failure you are in the middle of debugging (the
session's record is its pull request and the handover comment on its card). Record the durable shape of a problem, not
its current instance. If a fact turns out to be wrong, delete the file rather than
leaving it to be trusted.
