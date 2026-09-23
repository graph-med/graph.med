#!/usr/bin/env python3
"""Test one grouping axis against one view and print its feasibility report (spec §4.1).

    uv run tools/axes.py <axis> <view>
    uv run tools/axes.py axes/region pomgat-lv-1.0                   # an axis in the pool
    uv run tools/axes.py /tmp/graph.med/region.yaml pomgat-lv-1.0    # a definition not yet committed

<axis> is an axis id (the `axes/` prefix optional) or the path of a YAML file holding
one axis definition, so a proposal is measured before anything is committed; the
definition is validated against the schema's `axis` first. <view> is a view id.

While the axis is proposed for the view (or withdrawn, or not listed for it) the
places are read from the definition's `placements`; once asserted, from the data —
`axis` on `broader` edges for a hierarchy, the slot value on each statement for a
dimension — so the same numbers print before and after assertion. The universe is
the view's member statements for a dimension and, for a hierarchy, the concepts
filling the axis's slot on them. Four measures, no verdict: coverage (for a
hierarchy by concept and by statement), disjointness, the unplaced remainder by
name heaviest first, and depth. A person reads it, and it goes verbatim into the
pull request that asserts or withdraws the axis. This tool writes nothing.
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter, defaultdict
from pathlib import Path

from jsonschema import Draft202012Validator

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import SCHEMA, Pool, fillers, load, members_of   # noqa: E402 — one membership computation for the tool and the site


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("axis", help="an axis id, or the path of a YAML file holding one axis definition")
    ap.add_argument("view", help="a view id")
    args = ap.parse_args(argv)

    schema = load(SCHEMA)
    pool = Pool(schema)
    axis = axis_of(args.axis, pool)
    errors = [f"{'/'.join(map(str, e.absolute_path)) or '.'}: {e.message}"
              for e in sorted(Draft202012Validator({"$defs": schema["$defs"], "$ref": "#/$defs/axis"}).iter_errors(axis),
                              key=lambda e: list(e.absolute_path))]
    if errors:
        print("the axis definition does not fit the schema's `axis`:", *(f"  {e}" for e in errors), sep="\n")
        return 2
    vid = args.view if args.view.startswith("views/") else f"views/{args.view}"
    view = pool.entities.get(vid)
    if not view or view.get("type") != "view":
        print(f"no view {vid}; the pool has: {', '.join(sorted(v['id'] for v in pool.of_type('view')))}")
        return 2
    members = members_of(view, pool)
    print(*report(axis, view, members, pool), sep="\n")
    return 0


def axis_of(arg: str, pool: Pool) -> dict:
    path = Path(arg)
    if path.is_file():
        return load(path)
    aid = arg if arg.startswith("axes/") else f"axes/{arg}"
    axis = pool.entities.get(aid)
    if not axis or axis.get("type") != "axis":
        have = ", ".join(sorted(a["id"] for a in pool.of_type("axis"))) or "none"
        raise SystemExit(f"no axis {aid} in the pool (the pool has: {have}) and no file at {arg}")
    return axis


def report(axis: dict, view: dict, members: dict[str, dict], pool: Pool) -> list[str]:
    entry = next((e for e in axis.get("views") or [] if e.get("view") == view["id"]), None)
    asserted = bool(entry and entry.get("status") == "asserted")
    where = "the data" if asserted else "the definition's placements"
    listed = f"{entry['status']} since {entry['since']}" if entry else "not listed under its views"
    label = axis.get("short_label") or axis["label"]
    statements = sorted((m for m in members.values() if m.get("type") == "statement"), key=lambda m: m["id"])
    kind = (f"hierarchy over `{axis['slot']}`, several: {'true' if axis.get('several') else 'false'}"
            if axis["carrier"] == "hierarchy" else f"dimension, slot `{axis['slot']}`, {len(axis.get('values') or [])} values")
    lines = [f"axis      {axis['id']} — {label}: {kind}",
             f"view      {view['id']} — {listed}; places read from {where}"]
    measure = hierarchy if axis["carrier"] == "hierarchy" else dimension
    return lines + measure(axis, statements, pool, asserted)


def name(eid: str, pool: Pool) -> str:
    ent = pool.entities.get(eid)
    return (ent.get("short_label") or ent.get("label", "")) if ent else "(not in the pool)"


def pct(part: int, whole: int) -> str:
    return f"{round(100 * part / whole)} %" if whole else "–"


def plural(n: int, noun: str) -> str:
    return f"{n} {noun}{'' if n == 1 else 's'}"


def hierarchy(axis: dict, statements: list[dict], pool: Pool, asserted: bool) -> list[str]:
    slot = axis["slot"]
    carries: dict[str, list[str]] = defaultdict(list)          # concept → the member statements it answers for
    for st in statements:
        for c in fillers(st, slot):                              # every entry of a list slot (`condition`)
            carries[c].append(st["id"])
    universe = sorted(carries)
    without = sum(1 for st in statements if not fillers(st, slot))

    parents: dict[str, list[str]] = defaultdict(list)          # the places, on this axis only
    if asserted:
        for frm, kind, to, props in pool.edges:
            if kind == "broader" and props.get("axis") == axis["id"]:
                parents[frm].append(to)
    else:
        for concept, place in (axis.get("placements") or {}).items():
            parents[concept].extend(place if isinstance(place, list) else [place])
    nodes = set(parents) | {p for ps in parents.values() for p in ps}
    roots = sorted(n for n in nodes if not parents.get(n))

    def places(c: str, trail: tuple = ()) -> set[str]:          # the roots c reaches; c itself when it is one
        if c in trail:
            return set()                                         # a cycle — the validator rejects it once committed
        if c in nodes and not parents.get(c):
            return {c}
        return set().union(*(places(p, trail + (c,)) for p in parents.get(c, [])))

    def chain(c: str, trail: tuple = ()) -> int:                # the longest chain of edges from c to a root
        if c in trail or not parents.get(c):
            return 0
        return 1 + max(chain(p, trail + (c,)) for p in parents[c])

    place = {c: places(c) for c in universe}
    several = bool(axis.get("several"))
    one = [c for c in universe if len(place[c]) == 1]
    many = [c for c in universe if len(place[c]) > 1]
    none = [c for c in universe if not place[c]]
    covered = sorted(one + many) if several else one            # a second place is a place only where the axis allows it
    weight = lambda cs: len({s for c in cs for s in carries[c]})   # noqa: E731 — statements, each once however many of its concepts
    under = {r: [c for c in universe if r in place[c]] for r in roots}
    singles = [r for r in roots if len(under[r]) == 1]
    unknown = sorted(n for n in nodes if n not in pool.entities)

    lines = [f"universe  {plural(len(universe), 'concept')} fill `{slot}` on {plural(len(statements), 'statement')}; "
             f"{without} fill no `{slot}`"]
    if unknown:
        lines.append(f"unknown   {plural(len(unknown), 'place')} not in the pool: {', '.join(unknown)}")
    lines.append(f"coverage  {len(covered)} of {len(universe)} concepts ({pct(len(covered), len(universe))}), "
                 f"carrying {weight(covered)} of {len(statements)} statements ({pct(weight(covered), len(statements))})")
    verdict = "information (several: true)" if several else "a defect of the places (several: false)"
    lines.append(f"disjoint  {plural(len(many), 'concept')} in more than one place — {verdict}" + (":" if many else ""))
    for c in many:
        lines.append(f"          {len(carries[c]):>3}  {c}  {name(c, pool)}")
        lines.append(f"               → {', '.join(sorted(place[c]))}")
    lines.append(f"unplaced  {plural(len(none), 'concept')} carrying {plural(weight(none), 'statement')}, heaviest first" + (":" if none else ""))
    for c in sorted(none, key=lambda c: (-len(carries[c]), c)):
        lines.append(f"          {len(carries[c]):>3}  {c}  {name(c, pool)}")
    lines.append(f"depth     {plural(len(roots), 'root')} (members): " +
                 (" · ".join(f"{r} {len(under[r])}" for r in sorted(roots, key=lambda r: (-len(under[r]), r))) or "none"))
    lines.append(f"          longest chain {plural(max((chain(c) for c in universe), default=0), 'edge')}; "
                 f"roots with a single member: {', '.join(singles) or 'none'}")
    return lines


def dimension(axis: dict, statements: list[dict], pool: Pool, asserted: bool) -> list[str]:
    slot, values = axis["slot"], list(axis.get("values") or [])
    ids = [st["id"] for st in statements]
    given: dict[str, list[str]] = {}
    outside = 0
    if asserted:
        for st in statements:
            if fillers(st, slot):
                given[st["id"]] = fillers(st, slot)
    else:
        for sid, place in (axis.get("placements") or {}).items():
            if sid in set(ids):
                given[sid] = list(place) if isinstance(place, list) else [place]
            else:
                outside += 1
    one = [s for s in ids if len(given.get(s, [])) == 1]
    many = [s for s in ids if len(given.get(s, [])) > 1]
    none = [s for s in ids if s not in given]
    used = Counter(given[s][0] for s in one)
    stray = sorted({v for s in given for v in given[s] if v not in values})
    unknown = sorted(v for v in values if v not in pool.entities)
    takes_all = [v for v in values if used[v] == len(ids) and ids]

    lines = [f"universe  {plural(len(ids), 'statement')}" + (f" ({outside} placements name statements outside the view)" if outside else "")]
    if unknown:
        lines.append(f"unknown   {plural(len(unknown), 'value')} not in the pool: {', '.join(unknown)}")
    if stray:
        lines.append(f"stray     {plural(len(stray), 'place')} not among the declared values: {', '.join(stray)}")
    lines.append(f"coverage  {len(one)} of {len(ids)} statements ({pct(len(one), len(ids))})")
    lines.append(f"disjoint  {plural(len(many), 'statement')} with more than one value — the slot holds one" + (":" if many else ""))
    for s in many:
        lines.append(f"          {s}  {name(s, pool)}")
        lines.append(f"               → {', '.join(given[s])}")
    lines.append(f"unplaced  {plural(len(none), 'statement')}" + (":" if none else ""))
    for s in none:
        lines.append(f"          {s}  {name(s, pool)}")
    lines.append("depth     values (statements): " + (" · ".join(f"{v} {used[v]}" for v in values) or "none declared"))
    lines.append(f"          declared, used by none: {', '.join(v for v in values if not used[v]) or 'none'}; "
                 f"one value takes all of the universe: {', '.join(takes_all) or 'no'}")
    return lines


if __name__ == "__main__":
    sys.exit(main())
