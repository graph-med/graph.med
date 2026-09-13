#!/usr/bin/env python3
"""Validate the pool under data/ against schema/schema.yaml.

The schema is a JSON Schema (draft 2020-12) and the single point of truth. This
script only (1) validates each data file against the definition the schema's
`x-layout` assigns to it, using the jsonschema library, and (2) checks the few
rules a document schema cannot state because they span files:

  - every id is unique, and in one-per-file namespaces equals <ns>/<file stem>;
  - every entity reference in the data resolves (terminology codes excepted);
  - a claim's id is claims/<source-id>/<first 8 hex of sha256("<at>|<quote>")>;
  - edges are unique per (from, kind, to, discriminator);
  - a view id is not a namespace name (views are served at the site root);
  - a claim's `section` names an entry of its source's `outline` (spec §6.7);
  - `broader` edges form no cycle (spec §5), within one axis or across them;
  - the grouping axes hold together (spec §4.1): a dimension axis declares a slot
    no statement has of its own and no other axis declares, a hierarchy axis
    folds one the statements have; an axis's `values` are concepts of facet
    `qualifier`; a statement's extra slot is declared by a dimension axis and
    holds one of its `values`; `axis` on a `broader` edge names a hierarchy
    axis, and a concept has one parent per axis unless the axis says `several`;
    a view's `group_by` names axes asserted for that view; placements resolve;
  - the work-package convention holds (scripts/check-work.py: ids, statuses,
    dependencies, done/, stale claims, HANDOFF.md against LOG.md).

With --verify-quotes it also downloads each source (hash-checked, cached) and
verifies every quote is a verbatim substring of `pdftotext -layout` on the cited
physical page. Exit status 1 on any error.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "schema" / "schema.yaml"


def load(path: Path):
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def walk(node, path=()):
    """Yield (path, value) for every scalar and container in a YAML document."""
    yield path, node
    if isinstance(node, dict):
        for k, v in node.items():
            yield from walk(v, path + (k,))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk(v, path + (i,))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--verify-quotes", action="store_true", help="download sources and verify every quote")
    ap.add_argument("--cache", type=Path, default=Path.home() / ".cache" / "graph.med" / "sources")
    args = ap.parse_args(argv)
    errors: list[str] = []

    schema = load(SCHEMA)
    Draft202012Validator.check_schema(schema)
    terminologies = set(schema["x-namespaces"]["terminologies"])
    namespaces = set(schema["x-namespaces"]) - {"terminologies"}
    reserved = namespaces | terminologies | {"schema"}   # a view is served at the site root (docs/publication.md §2)

    # 1. each file against its definition ------------------------------------
    docs: list[tuple[str, object, bool]] = []   # (relative path, document, one_per_file)
    for glob, entry in schema["x-layout"].items():
        validator = Draft202012Validator({"$defs": schema["$defs"], **entry["schema"]})
        for path in sorted(ROOT.glob(glob)):
            rel = str(path.relative_to(ROOT))
            try:
                doc = load(path)
            except yaml.YAMLError as exc:
                errors.append(f"{rel}: YAML error: {exc}")
                continue
            for err in sorted(validator.iter_errors(doc), key=lambda e: list(e.absolute_path)):
                where = "/".join(str(p) for p in err.absolute_path) or "."
                errors.append(f"{rel} at {where}: {err.message}")
            docs.append((rel, doc, entry.get("one_per_file", False)))

    # 2. cross-file rules -------------------------------------------------------
    ids: dict[str, str] = {}
    entities: dict[str, dict] = {}
    for rel, doc, one_per_file in docs:
        for ent in (doc if isinstance(doc, list) else [doc]):
            if not (isinstance(ent, dict) and isinstance(ent.get("id"), str)):
                continue
            eid = ent["id"]
            if eid in ids:
                errors.append(f"{rel}: duplicate id {eid} (also in {ids[eid]})")
            ids[eid] = rel
            entities[eid] = ent
            if one_per_file and eid != f"{Path(rel).parent.name}/{Path(rel).stem}":
                errors.append(f"{rel}: id {eid} does not match the file name")
            if ent.get("type") == "view" and eid.split("/", 1)[-1] in reserved:
                errors.append(f"{rel}: view id {eid} collides with a namespace; it would shadow that path on the site")
            if ent.get("type") == "claim" and isinstance(ent.get("source"), dict):
                at, quote = ent["source"].get("at", ""), ent["source"].get("quote", "")
                digest = hashlib.sha256(f"{at}|{quote}".encode("utf-8")).hexdigest()[:8]
                expected = f"claims/{at.split('/', 1)[-1].split('#')[0]}/{digest}"
                if eid != expected:
                    errors.append(f"{rel}: claim {eid} should be {expected} (sha256 of locator|quote)")

    # a claim's section must be a section of its source's outline (spec §6.7)
    outlines: dict[str, set[str]] = {}
    for _, doc, _ in docs:
        if isinstance(doc, dict) and doc.get("type") == "source" and isinstance(doc.get("outline"), list):
            outlines[doc["id"]] = {str(e.get("section")) for e in doc["outline"] if isinstance(e, dict)}
    for rel, doc, _ in docs:
        for ent in (doc if isinstance(doc, list) else [doc]):
            if isinstance(ent, dict) and ent.get("type") == "claim" and "section" in ent and isinstance(ent.get("source"), dict):
                src = str(ent["source"].get("at", "")).split("#")[0]
                if src not in outlines:
                    errors.append(f"{rel}: claim {ent.get('id')} has section {ent['section']!r} but {src} has no outline")
                elif str(ent["section"]) not in outlines[src]:
                    errors.append(f"{rel}: claim {ent.get('id')} names section {ent['section']!r}, not in the outline of {src}")

    ref_pattern = re.compile(rf"^({'|'.join(map(re.escape, namespaces))})/")
    seen_edges: set[tuple] = set()
    broader: list[tuple[str, int, str, str, dict]] = []   # (file, index, from, to, props)
    for rel, doc, _ in docs:
        for path, value in walk(doc):
            if isinstance(value, str) and ref_pattern.match(value) and value.split("#")[0] not in ids:
                errors.append(f"{rel} at {'/'.join(map(str, path))}: {value} does not resolve")
        if rel.startswith("data/edges/") and isinstance(doc, list):
            for i, edge in enumerate(doc):
                if isinstance(edge, list) and len(edge) == 4 and isinstance(edge[3], dict):
                    key = (edge[0], edge[1], edge[2], edge[3].get("discriminator"))
                    if key in seen_edges:
                        errors.append(f"{rel} at {i}: duplicate edge; parallel edges need a discriminator")
                    seen_edges.add(key)
                    if edge[1] == "broader":
                        broader.append((rel, i, edge[0], edge[2], edge[3]))

    errors += check_axes(schema, ids, entities, broader)
    errors += check_work(set(ids))

    n_entities, n_edges = len(ids), len(seen_edges)
    print(f"checked {n_entities} entities and {n_edges} edges against schema {schema.get('x-version')}")

    # 3. quotes against the source text (optional) ------------------------------
    if args.verify_quotes:
        sources = {eid: next(e for _, d, _ in docs for e in (d if isinstance(d, list) else [d])
                             if isinstance(e, dict) and e.get("id") == eid)
                   for eid in ids if eid.startswith("sources/")}
        errors += verify_quotes(docs, sources, args.cache)
        print("verified quotes against the source text")

    for line in errors:
        print(f"error: {line}")
    print(f"{len(errors)} error(s)" if errors else "ok")
    return 1 if errors else 0


def check_axes(schema: dict, ids: dict[str, str], entities: dict[str, dict],
               broader: list[tuple[str, int, str, str, dict]]) -> list[str]:
    """Grouping axes (spec §4.1) and the `broader` hierarchy (spec §5): what the axis
    definitions, the edges, the statements and the views owe each other. The
    statement's own slots are read from the schema, so no slot is named here."""
    errs: list[str] = []
    core = list(schema["$defs"]["statement"]["properties"]["slots"]["properties"])
    axes = {eid: e for eid, e in entities.items() if e.get("type") == "axis"}
    by_slot: dict[str, str] = {}   # a dimension's slot key → the one axis declaring it

    for aid, ax in sorted(axes.items()):
        rel, carrier, slot = ids[aid], ax.get("carrier"), ax.get("slot")
        if carrier == "dimension":
            if slot in core:
                errs.append(f"{rel}: dimension axis {aid} declares slot {slot!r}, which every statement has of its own")
            elif slot in by_slot:
                errs.append(f"{rel}: slot {slot!r} is declared by both {by_slot[slot]} and {aid}; one dimension axis per slot")
            else:
                by_slot[slot] = aid
            for value in ax.get("values") or []:
                if value in entities and entities[value].get("facet") != "qualifier":
                    errs.append(f"{rel}: value {value} of {aid} has facet {entities[value].get('facet')!r}, not qualifier")
        elif carrier == "hierarchy" and slot not in core:
            errs.append(f"{rel}: hierarchy axis {aid} folds slot {slot!r}, which no statement has (one of {', '.join(core)})")
        seen: set[str] = set()
        for entry in ax.get("views") or []:
            if isinstance(entry, dict):
                if entry.get("view") in seen:
                    errs.append(f"{rel}: {aid} lists {entry.get('view')} twice under views; one entry per view")
                seen.add(entry.get("view"))
        for key, val in (ax.get("placements") or {}).items():   # keys are not walked as references
            if key not in ids:
                errs.append(f"{rel}: placement {key} of {aid} does not resolve")
            if carrier == "dimension":
                for place in (val if isinstance(val, list) else [val]):
                    if place not in (ax.get("values") or []):
                        errs.append(f"{rel}: placement of {key} in {aid} is {place}, not one of its values")

    # a statement's extra slot is one a dimension axis declares, holding one of its values
    for sid, st in sorted(entities.items()):
        if st.get("type") != "statement" or not isinstance(st.get("slots"), dict):
            continue
        for key, value in st["slots"].items():
            if key in core:
                continue
            if key not in by_slot:
                errs.append(f"{ids[sid]}: statement {sid} has slot {key!r}, which no dimension axis declares")
            elif value not in (axes[by_slot[key]].get("values") or []):
                errs.append(f"{ids[sid]}: slot {key!r} of {sid} holds {value}, not a value of {by_slot[key]}")

    # broader is a hierarchy (spec §5): no cycle, within one axis or across them; `axis`
    # names a hierarchy axis, and one parent per axis unless the axis says `several`
    per_axis: dict[str | None, dict[str, list[str]]] = {}
    for rel, i, frm, to, props in broader:
        axis = props.get("axis")
        if axis in axes and axes[axis].get("carrier") != "hierarchy":
            errs.append(f"{rel} at {i}: axis {axis} is a dimension; only a hierarchy axis is a respect of broader")
        per_axis.setdefault(axis, {}).setdefault(frm, []).append(to)
    within: set[frozenset] = set()
    for axis, graph in sorted(per_axis.items(), key=lambda kv: (kv[0] is not None, kv[0] or "")):
        for cycle in cycles(graph):
            within.add(frozenset(cycle))
            errs.append(f"broader edges{f' on {axis}' if axis else ''} form a cycle: {' -> '.join(cycle)}")
        if axis is not None and not axes.get(axis, {}).get("several"):
            for frm, tos in sorted(graph.items()):
                if len(tos) > 1:
                    errs.append(f"{frm} has {len(tos)} broader concepts on {axis} ({', '.join(sorted(tos))}); the axis does not allow several")
    everything: dict[str, list[str]] = {}
    for graph in per_axis.values():
        for frm, tos in graph.items():
            everything.setdefault(frm, []).extend(tos)
    for cycle in cycles(everything):
        if frozenset(cycle) not in within:
            errs.append(f"broader edges form a cycle across axes: {' -> '.join(cycle)}")

    # a view offers only axes asserted for it
    for vid, view in sorted(entities.items()):
        if view.get("type") != "view":
            continue
        for axis in view.get("group_by") or []:
            if axis not in axes:
                continue   # an unresolved reference is reported as such
            status = {e.get("view"): e.get("status") for e in axes[axis].get("views") or [] if isinstance(e, dict)}.get(vid)
            if status != "asserted":
                errs.append(f"{ids[vid]}: group_by names {axis}, which is {status or 'not proposed'} for {vid}; only an asserted axis groups a view")
    return errs


def check_work(ids: set[str]) -> list[str]:
    """The work-package convention (docs/work/README.md) has its own check,
    scripts/check-work.py; running it here means CI covers it on every pull
    request without a workflow change."""
    script = ROOT / "scripts" / "check-work.py"
    if not script.exists():
        return []
    run = subprocess.run([sys.executable, str(script)], capture_output=True, text=True, cwd=ROOT)
    return [line[len("error: "):] for line in run.stdout.splitlines() if line.startswith("error: ")] + \
           ([f"scripts/check-work.py failed: {run.stderr.strip()}"] if run.returncode and not run.stdout.startswith("error") and run.stderr else [])


def cycles(graph: dict[str, list[str]]) -> list[list[str]]:
    """Every elementary cycle reachable in a directed graph, each reported once from its first node."""
    found: list[list[str]] = []
    state: dict[str, int] = {}          # 1 on the current path, 2 finished
    path: list[str] = []
    def visit(node: str) -> None:
        state[node] = 1
        path.append(node)
        for nxt in graph.get(node, []):
            if state.get(nxt) == 1:
                found.append(path[path.index(nxt):] + [nxt])
            elif nxt not in state:
                visit(nxt)
        path.pop()
        state[node] = 2
    for start in sorted(graph):
        if start not in state:
            visit(start)
    return found


def verify_quotes(docs, sources: dict[str, dict], cache: Path) -> list[str]:
    errors: list[str] = []
    pdfs: dict[str, Path | None] = {}
    pages: dict[tuple[str, int], str] = {}

    def pdf_for(source_id: str) -> Path | None:
        if source_id in pdfs:
            return pdfs[source_id]
        ent = sources[source_id]
        expected = ent["content_hash"].split(":", 1)[1]
        cache.mkdir(parents=True, exist_ok=True)
        target = cache / f"{expected}.pdf"
        try:
            if not target.exists():
                with urllib.request.urlopen(ent["url"], timeout=120) as resp:
                    target.write_bytes(resp.read())
            if hashlib.sha256(target.read_bytes()).hexdigest() != expected:
                target.unlink()
                raise ValueError("content_hash mismatch")
        except Exception as exc:  # noqa: BLE001 — reported, not raised
            errors.append(f"{source_id}: cannot verify quotes: {exc}")
            target = None
        pdfs[source_id] = target
        return target

    def page_text(source_id: str, page: int) -> str | None:
        pdf = pdf_for(source_id)
        if pdf is None:
            return None
        if (source_id, page) not in pages:
            out = subprocess.run(["pdftotext", "-layout", "-f", str(page), "-l", str(page), str(pdf), "-"],
                                 capture_output=True, text=True, check=False)
            pages[(source_id, page)] = out.stdout
        return pages[(source_id, page)]

    for rel, doc, _ in docs:
        for path, value in walk(doc):
            if not (isinstance(value, dict) and "at" in value and "quote" in value):
                continue
            m = re.match(r"^(sources/[^#]+)(?:#page=(\d+))?$", str(value["at"]))
            if not m or m.group(1) not in sources:
                continue
            where = f"{rel} at {'/'.join(map(str, path))}"
            if not m.group(2):
                errors.append(f"{where}: locator has no #page=N, quote cannot be verified")
                continue
            text = page_text(m.group(1), int(m.group(2)))
            if text is not None and value["quote"] not in text:
                errors.append(f"{where}: quote not found on page {m.group(2)}: {value['quote']!r}")
    return errors


if __name__ == "__main__":
    sys.exit(main())
