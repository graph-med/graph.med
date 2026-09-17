---
id: WP-0023
title: claim.evidence — evidence certainty per outcome, in an open system vocabulary
status: open
created: 2026-09-17
updated: 2026-09-17
depends_on: []
blocks: [WP-0025]
owner: unassigned
initiative: evidence
kind: schema
slug: schema-claim-evidence
---

## Outcome

A claim can carry how certain its evidence is, per outcome, in the vocabulary of
whatever system rated it:

```yaml
evidence:                        # 0..n, absent or [] means "not recorded"
  - outcome: concepts/zeit-bis-zur-ersten-defaekation   # 0..1, a concept_ref
    value: hoch                  # the system's own word, never translated
    system: grade                # open string: grade | oxford_loe | esc_loe | sign | …
```

- `outcome` may be absent — a guideline that states one certainty for the whole
  recommendation produces one entry without it. Present, it is a `concept_ref`
  that resolves, like every other reference (validator).
- `value` is the word the system uses. The schema does not enumerate it and the
  build never maps it onto a project-wide vocabulary.
- `system` is an open string, not an enum. A second guideline brings its own.
- Provenance: `evidence` is `x-provenance: required` like `grade` and
  `consensus` — a certainty rating is read off the source, never inferred, and
  overriding it needs a passage.
- `schema/schema.yaml` `x-version` goes to **0.6.0**. It is already 0.5.0
  (WP-0008, grouping axes); the draft this package was registered from assumed
  0.5.0 was still ahead.
- `uv run tools/validate.py` passes unchanged on the current pool: no claim
  carries the field yet, and it is optional.

`docs/graph-representation.md` gains the field where it describes a claim's
properties, with the two rules that make it safe: values are never mapped
between systems, and several entries are never reduced to one.

## Scope

In: `schema/schema.yaml` (`$defs.claim` — the `evidence` property, its entry in
`claim.provenance`, `x-version`); `tools/validate.py` only if a `concept_ref`
inside a nested list is not already resolved by the existing reference check —
verify, do not assume; `docs/graph-representation.md` (the claim's properties);
`docs/open-questions.md` (the `evidence-profiles` entry is removed — this
package is the consumer it was waiting for) and a `.claude/memory/design/`
memory recording the shape and the two rules. (`docs/work/LATER.md`'s
"evidence profiles" line went with this package's registration.)

Out: **any data change.** No claim gets an `evidence` value in this package —
filling them is an extraction pass over the source, registered separately (see
Notes). The rendering of the field (WP-0025). `EVIDENCE_SCALES`, the per-system
display order, which lives in `tools/build.py` and belongs to the renderer
(WP-0025). `grade`, `consensus`, `verb`, `direction` — untouched. An effective
grade or an effective certainty for a statement — `grade-derivation` stays open
and this package does not touch it.

## Constraints

- **Nothing composed** (`docs/publication.md` §3): the schema must make the
  per-outcome list the natural thing to write and a single summary value
  impossible to express. This is why the field is a list even when a guideline
  gives one value — that case is a one-entry list without `outcome`, not a
  scalar with a list alternative. A `oneOf` scalar-or-list would reintroduce
  exactly the ambiguity the field exists to remove.
- **No evidence system is wired in** (memory `generic-over-guidelines`): no
  enum of systems, no enum of values, no mapping table anywhere in schema or
  validator. The POMGAT GRADE words must not be privileged over another
  guideline's.
- `claim` is `additionalProperties: false`, so the field does not exist in data
  until the schema admits it — there is nothing to migrate and no migration
  report to write (see Decisions).
- Claims are immutable (spec §7): adding certainty to an existing claim is an
  edit with history, which is the extraction pass's problem, not this one's.

## Decisions

- 2026-09-17 (maintainer, registration): the shape is the second option of
  `docs/open-questions.md` → evidence-profiles — a structured property on the
  claim — narrowed to the rating and its outcome. The third option (each
  outcome row its own `fact` claim with a `refines` edge) was not taken: it
  multiplies claims roughly fivefold per box and puts the certainty a step away
  from the recommendation that the panel has to show it beside.
- 2026-09-17 (checked against the repository, correcting the registration
  draft): `claim.evidence` **does not exist today** — it is not in
  `schema/schema.yaml`, and `claim` forbids additional properties, so no file
  under `data/` carries it (`grep -rn evidence data/` is empty). The draft's
  §6.1 describes it as "scalar today" and its §6.4 asks for a migration and a
  migration report of non-migratable values. Both are moot: this package
  introduces the field, migrates nothing, and produces no report. The
  acceptance criterion about logging non-migratable claims falls away with them.
  The consequence to carry forward: every statement renders zone 4 as
  `Evidenz: nicht erfasst` until the extraction pass runs, and that is the
  honest state, not a bug in WP-0025.
- 2026-09-17: `system` open rather than an enum, because the ESC evidence
  levels (A/B/C beside recommendation classes I/IIa/IIb/III) do not map onto
  the GRADE words without inventing a correspondence. The renderer never
  translates between systems; an unknown system is a valid state, not an error.

## Open questions

None that block. One noted for the pass that fills the field: POMGAT states
certainty per outcome in a table under the box, and whether a table row whose
outcome has no concept yet mints one or is left out is an extraction decision,
not a schema one — `outcome` is optional precisely so a row is never dropped for
want of a concept.

## Verification

1. `uv run tools/validate.py` passes on the unchanged pool.
2. A hand-written fixture claim with two `evidence` entries validates; one with
   a scalar `evidence:` is rejected; one whose `outcome` names a concept that
   does not exist is rejected by the reference check.
3. `uv run tools/build.py` succeeds — the build ignores the field until WP-0025.
4. `grep -rn "grade\|GRADE\|hoch\|moderat" schema/schema.yaml` shows no
   evidence-system vocabulary added.
5. `docs/open-questions.md` no longer carries `evidence-profiles`; a
   `.claude/memory/design/` memory records the shape, with its row in
   `.claude/rules/conventions/memory.md`.

## Notes

The extraction pass that fills `claim.evidence` from POMGAT's per-box GRADE
tables is the natural successor and is **not** registered here. It is
`extraction` kind, needs the source and its pages, and should be registered once
this schema has merged so its scope can name the real field.
