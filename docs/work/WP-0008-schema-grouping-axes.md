---
id: WP-0008
title: Schema for axis definitions, and the feasibility report
status: open
created: 2026-09-12
updated: 2026-09-13
depends_on: [WP-0007]
blocks: [WP-0009]
owner: unassigned
initiative: groupings
kind: schema
slug: schema-grouping-axes
---

## Outcome

`schema/schema.yaml` and `tools/validate.py` express the mechanism of
`docs/graph-representation.md` §4.1 as settled by `grouping-axes-decision`:
an axis definition is an entity in the pool with the fields the spec names;
a `broader` edge may carry `axis` naming a declared hierarchy axis; a
statement may carry the slots a declared dimension axis adds; a view may
declare `group_by`. The validator rejects an `axis` that is not declared, a
cycle within one axis, a slot no declared axis provides, and a `group_by`
naming an axis the view's data does not carry. A new tool,
`tools/axes.py`, prints the feasibility report of §4.1 for one axis
definition against one view — coverage, disjointness, the unplaced remainder
by name, depth — and writes nothing. The existing data stays valid without
change, and `CLAUDE.md` documents the tool once it exists.

## Scope

In: `schema/schema.yaml` (version bump), `tools/validate.py`, `tools/axes.py`,
`data/README.md` for the new namespace, `CLAUDE.md` "Checks" for the tool, the
schema's own `x-` conventions.
Out: asserting any edge or slot value; proposing an axis; the site.

## Constraints

- Additive: every existing `broader` edge and every statement remains valid
  as it is; an edge without `axis` is plain subsumption.
- Generic (memory `generic-over-guidelines`): no axis name, slot name or
  concept id in the schema beyond what §4.1 defines as the mechanism; the
  vocabulary of axes is the set of declared axis entities, open-ended.
- The tool reports; it never writes to `data/` (memory
  `grouping-axes-proposed-and-tested`).
- The schema commit lands before any data that uses it (spec §7).
- Python tooling through `uv` only (`CLAUDE.md`, "Checks").

## Decisions

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- 2026-09-13, WP-0007: the shape to implement is spec §4.1 as completed — an `axes/` namespace and entity type with the fields of its table, facet `qualifier`, `axis` on `broader`, slots declared by dimension axes, `group_by` on the view, the validator rules listed under "4. Shown", and `tools/axes.py` reading placements while proposed and data once asserted.

## Open questions

None.

## Verification

`uv run tools/validate.py` passes on the unchanged data; a deliberately wrong
edge (undeclared axis, a cycle within one axis), a stray slot and a stray
`group_by` are rejected — show each in the PR. `uv run tools/axes.py <axis>
<view>` on a throwaway axis definition prints a report whose numbers the PR
checks by hand against the data.
