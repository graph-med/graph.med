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
| `design/pool-and-views.md` | The repository is one pool; graphs are versioned views (filter + as-of commit); one schema governs everything. |
| `design/two-layer-identity.md` | Claims have deterministic source-anchored identity and never merge; semantic nodes are minted; sameness is an edge. |
| `design/staleness-and-verification.md` | One content-hash mechanism for review, verification and references; stale downgrades, only invalid blocks. |
| `design/view-page-is-a-decision-tree.md` | The view page is one decision tree (which patient group? → which condition? → recommendation → aim, answers on the edges, a question at every fork, nothing overlapping), drawn by Cytoscape.js + dagre, self-hosted; not chapters, not an outline. |
| `design/document-structure-is-provenance.md` | Chapters are provenance (`section` on the claim, `outline` on the source): a filter and a grouping the reader may choose from the switch, never nodes or edges in the pool and never the default shape; no `outlines/` namespace. |
| `design/relations-are-edges-not-fields.md` | A relation is an edge with provenance (`broader`, `codes_as`), never a field; `broader` inherits nothing and names no axis — a hierarchy axis only picks edges. |
| `design/short-label-limit.md` | `short_label` is at most 60 characters (schema), target 55; concepts get one only above about 45. |
| `design/direction-legend.md` | The four-word direction (für, gegen, abwägen, Lücke) is derived from claims; kann → abwägen with a lean; facts have none. |
| `design/box-granularity-per-sentence.md` | A claim is one recommendation sentence, not a box; a box with several sentences is several claims sharing its `recommendation_no`. |
| `design/concept-hierarchy-depth.md` | `broader` goes as deep as subsumption does (three levels in POMGAT); families are concepts without a parent; the site folds recursively. |
| `design/generic-over-guidelines.md` | Nothing in the build, schema, validator or design is specific to one guideline: no ids, family names, or vocabularies admitted because the current source needs them; one code path per rule at every level. |
| `design/grouping-axes-proposed-and-tested.md` | An axis (what a view groups by) is never fixed in the pool or the build: a person proposes one per guideline as an `axes/` entity, a tool tests and reports (coverage, disjointness, unplaced, depth), a linking pass asserts it, a view offers it in `group_by`. An overlay: its placements stay in its file — values for statements (dimension, facet `qualifier`), or for each concept the existing `broader`/`in_scope_of` edge it hangs by (hierarchy); the tree of patient groups is the view's first axis. |
| `design/box-colour-by-direction.md` | A box is coloured by its direction (the banner's four colours); its label begins with the glyph, the grade letter and, where the letter does not carry it in the view, the verb as a word; EK is marked "EK". Not by grade, not by verb; the border carries only state. |
| `design/claim-evidence-per-outcome.md` | A claim's evidence certainty is `evidence`, a list of {outcome?, value?, system} in the rating system's own words, each entry stating an outcome or a value: never a scalar, values never mapped between systems, several entries never reduced to one; provenance required like the grade. |
| `design/access-is-a-dimension.md` | The operative access is the dimension `axes/zugang` (offen, minimalinvasiv), never part of a population's name: robotic is minimalinvasiv, oesophagectomy variants stay procedures, no placement means "not distinguished"; asserted, not in `group_by`. |
| `design/body-text-rule.md` | A body-text sentence earns a claim and an edge only by spec §5.1: gate G1–G4, then `refines` → `limits` → `supplements`, first that holds; kind by form, never graded, one claim per answer; no edge between sentences of marked recommendations; an edge never decides a statement's condition. |
| `design/scope-tree-and-anchor.md` | One anchor per statement (the view's `anchor_slot`); a membership true only inside one guideline's scope is `in_scope_of` (optional condition concept), never `broader`; the root is declared (`scope_root`), the tree drawn by the view's first axis; anchor / subgroup / dimension / condition by four questions per statement. |
| `design/conditions-are-a-conjunction-list.md` | A statement's `condition` is always a list of concepts; several entries hold at once (a conjunction), a source's "or" is one concept naming the alternatives; the other slots stay single-valued. |
| `design/page-chrome-in-the-view-layer.md` | Only the viewer reads German: the page chrome's words (legend, sheet hint) are a per-language table under `tools/site/words/`, not in `tools/build.py` and not published; the legend's keys are computed per view; open on a wide screen, collapsed on a phone, nothing remembered. |
| `design/grading-scheme-on-the-source.md` | A claim's grade, verb and consensus are its source's own words, checked against the `grading_scheme` the source declares as data, quoted from its method table: grades in legend order with wording, negated form and open flag; consensus classes with bounds, a printed share beside its class; verbs pool-wide; never mapped between schemes, never enumerated in the schema (#212, 2026-09-24). |
| `design/derived-concepts-defined-by.md` | A concept established by a rule is derived because its one `defined_by` edge reaches the criterion or definition claim giving it — computed, never stored; the threshold sits on that claim as printed (`threshold`, one per claim); how several parts combine is extracted from the page as a `combination` on the claim quoting the passage (all_of, any_of, at_least n, not_stated; connective quoted, reading modelling), nesting through claims — never a default (#204, 2026-09-24). |

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
