#!/usr/bin/env python3
"""Validate the pool under data/ against schema/schema.yaml.

The schema is a JSON Schema (draft 2020-12) and the single point of truth. This
script only (1) validates each data file against the definition the schema's
`x-layout` assigns to it, using the jsonschema library, and (2) checks the few
rules a document schema cannot state because they span files:

  - every id is unique, and in one-per-file namespaces equals <ns>/<file stem>;
  - every entity reference in the data resolves (terminology codes excepted), each entry
    of a list on its own — a statement's conditions, say;
  - a claim's id is claims/<source-id>/<first 8 hex of sha256("<at>|<quote>")>;
  - edges are unique per (from, kind, to, discriminator);
  - a view id is not a namespace name (views are served at the site root);
  - a claim's `section` names an entry of its source's `outline` (spec §6.7);
  - `broader` edges form no cycle (spec §5);
  - the grouping axes hold together (spec §4.1), an axis being an overlay whose
    placements are the grouping: a dimension axis keys its values by a slot no
    statement has of its own and no other axis declares, a hierarchy axis folds
    one the statements have; an axis's `values` are concepts of facet
    `qualifier`; placements resolve, and a dimension's are among its `values`;
    once an axis is asserted for any view, it places each statement or concept
    once (unless a hierarchy says `several`), and every hierarchy placement is a
    `broader` or `in_scope_of` edge the pool holds — the axis chooses, the pool
    states; a view's `group_by` names axes asserted for that view;
  - a view that declares a scope tree holds together (spec §4, §5), the four rules
    of the scope tree: (1) its `anchor_slot` is one of the statement's own slots
    and every member statement fills it with exactly one concept; (2) the first
    entry of its `group_by` is a hierarchy axis over that slot, asserted for the
    view, and every anchor reaches the view's `scope_root` along its placements;
    (3) a scope edge's `condition` is a concept and every scope edge has a
    rationale (the schema and the reference check carry this one); (4)
    `in_scope_of` forms no cycle, alone or with `broader`, and never doubles a
    `broader` edge between the same two concepts. A view without `scope_root`
    is not checked for (1) and (2);
  - a derived concept's rule holds together (spec §3.1, §5): a concept has one
    `defined_by` edge, discriminator or not — several rules combine on the claim it
    reaches, as the page prints it, and a second edge would be a combination
    nobody extracted —, to a claim of kind `criterion` or `definition`; a
    `combination`'s parts are claims of those kinds from the claim's own source,
    its connective's quotes are from that source too, each piece of the connective
    lies in one of them, `at_least` counts no more parts than it names, and
    combinations nest through claims without a cycle; a threshold's `quantity`
    and `relative_to` resolve like every reference, and a relative threshold is
    relative to another quantity than the one it bounds;
  - a claim is read in its source's grading scheme (spec §3.1): its `grade` is
    one its own source's `grading_scheme` lists and its `consensus` one of its
    classes; its `verb` is a wording some declared scheme defines — its own
    source's, or others that read it alike (open or not, one negated form); a
    printed `consensus_share` shows a number, carries the class where its
    source classes shares, and lies within that class's bounds where the scheme
    reads them as numbers; within a scheme a grade, a wording and a class are
    listed once, every word of a grade, wording, negated form, class name and
    bounds lies as a whole word in one of the quotes that give it, and those
    quotes are the source's own;

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
    scope: list[tuple[str, int, str, str, dict]] = []     # the same, for in_scope_of
    defined_by: list[tuple[str, int, str, str, dict]] = []   # the same, for defined_by
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
                    elif edge[1] == "in_scope_of":
                        scope.append((rel, i, edge[0], edge[2], edge[3]))
                    elif edge[1] == "defined_by":
                        defined_by.append((rel, i, edge[0], edge[2], edge[3]))

    errors += check_axes(schema, ids, entities, broader, scope)
    errors += check_scope_edges(broader, scope)
    errors += check_definitions(ids, entities, defined_by)
    errors += check_grading(ids, entities)
    if any(e.get("type") == "view" and "scope_root" in e for e in entities.values()):
        if errors:   # members are computed by the build's reader, which expects a pool that fits the schema
            print("the scope trees of views are checked once the errors below are fixed")
        else:
            errors += check_scope_views(schema, ids, entities)

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
               broader: list[tuple[str, int, str, str, dict]],
               scope: list[tuple[str, int, str, str, dict]]) -> list[str]:
    """Grouping axes (spec §4.1) and the `broader` hierarchy (spec §5): what the axis
    definitions, the edges, the statements and the views owe each other. An axis is an
    overlay — its placements are the grouping, before and after assertion — so what
    changes at assertion is what they must be: one place each (unless a hierarchy says
    `several`), and for a hierarchy an edge the pool already holds, which also keeps an
    axis free of cycles, the edges having none. The statement's own slots are read from
    the schema, so no slot is named here."""
    sys.path.insert(0, str(ROOT / "tools"))
    from build import asserted, places   # noqa: E402 — one reading of a placement for the validator, the tool and the site
    errs: list[str] = []
    core = list(schema["$defs"]["statement"]["properties"]["slots"]["properties"])
    axes = {eid: e for eid, e in entities.items() if e.get("type") == "axis"}
    by_slot: dict[str, str] = {}   # a dimension's slot key → the one axis declaring it
    held = {(frm, to) for _, _, frm, to, _ in broader + scope}   # what a hierarchy placement may pick

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
        fixed = asserted(ax)
        for key, val in (ax.get("placements") or {}).items():   # keys are not walked as references
            if key not in ids:
                errs.append(f"{rel}: placement {key} of {aid} does not resolve")
            where = places(val)
            if carrier == "dimension":
                for place in where:
                    if place not in (ax.get("values") or []):
                        errs.append(f"{rel}: placement of {key} in {aid} is {place}, not one of its values")
            if not fixed:
                continue   # a proposal may name parents the pool lacks, and several places: that is what it measures
            if len(where) > 1 and not (carrier == "hierarchy" and ax.get("several")):
                errs.append(f"{rel}: {aid} is asserted and places {key} {len(where)} times; an asserted axis places each once"
                            + (" unless it says `several`" if carrier == "hierarchy" else ""))
            if carrier == "hierarchy":
                for parent in where:
                    if (key, parent) not in held:
                        errs.append(f"{rel}: {aid} is asserted and places {key} under {parent}, but the pool holds no "
                                    f"broader or in_scope_of edge between them; the axis chooses an edge, it states none")

    # broader is a hierarchy (spec §5): no cycle
    graph: dict[str, list[str]] = {}
    for _, _, frm, to, _ in broader:
        graph.setdefault(frm, []).append(to)
    for cycle in cycles(graph):
        errs.append(f"broader edges form a cycle: {' -> '.join(cycle)}")

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


def check_scope_edges(broader: list[tuple[str, int, str, str, dict]],
                      scope: list[tuple[str, int, str, str, dict]]) -> list[str]:
    """Rule (4) of the scope tree (spec §5): `in_scope_of` forms no cycle — on its own or together
    with `broader`, since a view walks both to its root — and never repeats a `broader` edge between
    the same two concepts, which would state one relation twice with two meanings. Rule (3) needs
    no code here: the schema gives every scope edge a rationale and a `condition` of the shape of
    a concept reference, and the reference check resolves it."""
    errs: list[str] = []
    pairs = {(frm, to) for _, _, frm, to, _ in broader}
    graph: dict[str, list[str]] = {}
    for rel, i, frm, to, _ in scope:
        if (frm, to) in pairs:
            errs.append(f"{rel} at {i}: {frm} in_scope_of {to} doubles a broader edge between the same concepts; one of the two is wrong")
        graph.setdefault(frm, []).append(to)
    alone: set[frozenset] = set()
    for cycle in cycles(graph):
        alone.add(frozenset(cycle))
        errs.append(f"in_scope_of edges form a cycle: {' -> '.join(cycle)}")
    if scope:   # a cycle of broader alone is reported by check_axes
        sub: dict[str, list[str]] = {}
        for _, _, frm, to, _ in broader:
            sub.setdefault(frm, []).append(to)
        alone |= {frozenset(c) for c in cycles(sub)}
        both = {c: graph.get(c, []) + sub.get(c, []) for c in set(graph) | set(sub)}
        for cycle in cycles(both):
            if frozenset(cycle) not in alone:
                errs.append(f"in_scope_of and broader edges form a cycle together: {' -> '.join(cycle)}")
    return errs


def check_definitions(ids: dict[str, str], entities: dict[str, dict],
                      defined_by: list[tuple[str, int, str, str, dict]]) -> list[str]:
    """A derived concept's rule (spec §3.1, §3.2, §5). A concept has one `defined_by` edge, to a claim of kind
    `criterion` or `definition` — the passage that gives the rule, not a recommendation that uses the term.
    Several rules of one concept are the parts of a `combination` on that claim, with the connective the page
    prints; a second edge would join them by a default nobody read off the page, so it is refused, to the same
    claim or another, discriminator or not. A combination's parts are criterion or definition claims of the
    claim's own source, as are the quotes of its connective, and every piece of the connective ("entweder …
    oder") lies in one of those quotes, so that --verify-quotes checks the words on the page; `at_least` names
    at most as many as its parts; combinations nest through claims and never reach their own claim. That the
    operator states its parts, connective and `n`, and that a combining claim prints no threshold, is the
    schema's. A threshold's `relative_to` names another quantity than its `quantity`; that both resolve is the
    reference check's. No operator word, kind of concept, quantity or unit of a guideline is named here."""
    errs: list[str] = []
    rules = ("criterion", "definition")
    first: dict[str, tuple[str, str]] = {}
    for rel, i, frm, to, _ in defined_by:
        kind = entities.get(to, {}).get("kind")
        if to in entities and kind not in rules:
            errs.append(f"{rel} at {i}: {frm} defined_by {to}, a claim of kind {kind!r}; a rule is a criterion or a definition")
        if frm in first:
            errs.append(f"{rel} at {i}: {frm} has a second defined_by edge (to {to}; the first, to {first[frm][1]}, is in "
                        f"{first[frm][0]}); several rules combine on one claim as the page prints it (`combination`), never by a second edge")
        first.setdefault(frm, (f"{rel} at {i}", to))
    source_of = lambda at: str(at).split("#")[0]
    graph: dict[str, list[str]] = {}
    for cid, claim in sorted(entities.items()):
        if claim.get("type") != "claim":
            continue
        th = claim.get("threshold")
        if isinstance(th, dict) and "relative_to" in th and th.get("relative_to") == th.get("quantity"):
            errs.append(f"{ids[cid]}: the threshold of {cid} is relative to {th['quantity']}, its own quantity; a relative threshold names the quantity it is relative to")
        comb = claim.get("combination")
        if not isinstance(comb, dict):
            continue
        rel, own = ids[cid], source_of((claim.get("source") or {}).get("at", ""))
        parts = [p for p in comb.get("of") or [] if isinstance(p, str)]
        graph[cid] = parts
        for part in parts:
            if part not in entities:
                continue   # the reference check reports it
            if entities[part].get("kind") not in rules:
                errs.append(f"{rel}: the combination of {cid} names {part}, a claim of kind {entities[part].get('kind')!r}; a part is a criterion or a definition")
            if source_of((entities[part].get("source") or {}).get("at", "")) != own:
                errs.append(f"{rel}: the combination of {cid} names {part}, a claim of another source; a combination is read off one passage")
        if comb.get("operator") == "at_least" and isinstance(comb.get("n"), int) and comb["n"] > len(parts):
            errs.append(f"{rel}: the combination of {cid} asks for at least {comb['n']} of {len(parts)} parts")
        refs = comb.get("source")
        refs = [refs] if isinstance(refs, dict) else [r for r in refs or [] if isinstance(r, dict)]
        for r in refs:
            if source_of(r.get("at", "")) != own:
                errs.append(f"{rel}: the connective of {cid} is quoted from {source_of(r.get('at', ''))}, not from its own source {own}")
        if isinstance(comb.get("connective"), str):
            for piece in (x.strip() for x in comb["connective"].split("…")):
                if piece and not any(piece in str(r.get("quote", "")) for r in refs):
                    errs.append(f"{rel}: the connective of {cid} prints {piece!r}, which none of its quotes contains")
    for cycle in cycles(graph):
        errs.append(f"combinations form a cycle through claims: {' -> '.join(cycle)}")
    return errs


def check_grading(ids: dict[str, str], entities: dict[str, dict]) -> list[str]:
    """A claim's grade, verb and consensus in its source's grading scheme (spec §3.1, §6.5). A source declares the
    scheme as data, quoted from its method table; the schema enumerates none of its words, so this is where a claim's
    values are held to them. `grade` and `consensus` are its own source's; `verb` may be another guideline's wording
    — recorded wherever a declared scheme defines it, read in its own source's scheme first, otherwise in the schemes
    that define it, which must read it alike, or its direction would depend on which guideline one asked. A printed
    share carries its class where the source classes shares, and lies within the class's bounds where the scheme
    reads them as numbers. Within a scheme, each grade, wording and class is listed once, and every word of a grade,
    wording, negated form, class name and bounds lies, as a whole word, in one of the quotes that give it — quotes
    from the source itself — so that the words are the source's; a form marked `modelling` is not read against
    quotes. That grade and verb agree is not checked: which grade a sentence carries is the rule of §3.1 and §5.1.
    No grade, verb, class or scheme of any guideline is named here."""
    errs: list[str] = []
    source_of = lambda at: str(at).split("#")[0]
    as_refs = lambda refs: [refs] if isinstance(refs, dict) else [r for r in refs or [] if isinstance(r, dict)] if isinstance(refs, list) else []
    printed = lambda word, quote: re.search(rf"(?<!\w){re.escape(word)}(?!\w)", str(quote)) is not None
    schemes: dict[str, dict] = {}
    readings: dict[str, dict[str, tuple]] = {}   # a wording → {source: (open, negated)}
    for sid, src in sorted(entities.items()):
        if src.get("type") != "source" or not isinstance(src.get("grading_scheme"), dict):
            continue
        rel, scheme = ids[sid], src["grading_scheme"]
        grades = [g for g in scheme.get("grades") or [] if isinstance(g, dict)]
        classes = [c for c in scheme.get("consensus") or [] if isinstance(c, dict)]
        schemes[sid] = {"grades": [g.get("grade") for g in grades], "verbs": {g["verb"] for g in grades if "verb" in g},
                        "classes": {c.get("class"): c for c in classes}}
        for field, entries, what in (("grade", grades, "grade"), ("verb", grades, "wording"), ("class", classes, "consensus class")):
            values = [e[field] for e in entries if field in e]
            for value in sorted({v for v in values if values.count(v) > 1}, key=str):
                errs.append(f"{rel}: the grading scheme lists the {what} {value!r} more than once")
        for entry, fields in [(g, ("grade", "verb", "negated")) for g in grades] + [(c, ("name", "bounds")) for c in classes]:
            name = entry.get("grade", entry.get("class"))
            for field in fields:
                if field not in entry:
                    continue
                given = (entry.get("provenance") or {}).get(field, entry.get("source"))
                if given == "modelling":
                    continue
                refs = as_refs(given)
                for r in refs:
                    if source_of(r.get("at", "")) != sid:
                        errs.append(f"{rel}: the grading scheme quotes {source_of(r.get('at', ''))} for {name!r}; a scheme is read off its own source")
                missing = [w for w in str(entry[field]).split() if not any(printed(w, r.get("quote")) for r in refs)]
                if missing:
                    errs.append(f"{rel}: the {field} {entry[field]!r} of {name!r} in the grading scheme prints "
                                f"{', '.join(map(repr, missing))}, which none of its quotes contains as a word")
        for g in grades:
            if "verb" in g:
                readings.setdefault(g["verb"], {})[sid] = (bool(g.get("open")), g.get("negated"))
    for cid, claim in sorted(entities.items()):
        if claim.get("type") != "claim":
            continue
        rel, own = ids[cid], source_of((claim.get("source") or {}).get("at", ""))
        scheme = schemes.get(own)
        for field, listed in (("grade", "grades"), ("consensus", "classes")):
            if field not in claim:
                continue
            if scheme is None:
                errs.append(f"{rel}: {cid} carries {field} {claim[field]!r}, but {own} declares no grading scheme to read it in")
            elif claim[field] not in scheme[listed]:
                errs.append(f"{rel}: {cid} has {field} {claim[field]!r}, which the grading scheme of {own} does not list "
                            f"({', '.join(map(str, scheme[listed])) or 'none'})")
        if "verb" in claim and not (scheme and claim["verb"] in scheme["verbs"]):
            others = readings.get(claim["verb"], {})
            if not others:
                errs.append(f"{rel}: {cid} has verb {claim['verb']!r}, which no declared grading scheme defines")
            elif len(set(others.values())) > 1:
                errs.append(f"{rel}: {cid} has verb {claim['verb']!r}, which {own} does not define and the grading schemes of "
                            f"{', '.join(sorted(others))} read differently (open or not, or another negated form); "
                            f"its reading would depend on which guideline one asked")
        if "consensus_share" in claim:
            number = re.search(r"\d+(?:[.,]\d+)?", str(claim["consensus_share"]))
            cls = (scheme or {}).get("classes", {}).get(claim.get("consensus"))
            if not number:
                errs.append(f"{rel}: {cid} has consensus_share {claim['consensus_share']!r}, which prints no number")
            elif scheme and scheme["classes"] and "consensus" not in claim:
                errs.append(f"{rel}: {cid} prints a share, and the grading scheme of {own} classes shares; carry its class as `consensus` beside it")
            elif cls:
                share = float(number.group().replace(",", "."))
                outside = [f"{k} {cls[k]}" for k, fits in (("above", lambda b: share > b), ("at_least", lambda b: share >= b),
                                                           ("at_most", lambda b: share <= b), ("below", lambda b: share < b))
                           if isinstance(cls.get(k), (int, float)) and not fits(cls[k])]
                if outside:
                    errs.append(f"{rel}: {cid} prints the share {claim['consensus_share']!r}, outside the bounds of "
                                f"{claim['consensus']!r} in the grading scheme of {own} ({', '.join(outside)})")
    return errs


def check_scope_views(schema: dict, ids: dict[str, str], entities: dict[str, dict]) -> list[str]:
    """Rules (1) and (2) of the scope tree (spec §4), for each view that declares `scope_root`:
    its `anchor_slot` is one of the statement's own slots, read from the schema, so no slot is
    named here; every member statement fills it with exactly one concept; the first entry of its
    `group_by` is a hierarchy axis over that slot, asserted for the view — the axis that draws the
    scope tree (spec §4.1 "4. Shown") —, and every anchor reaches the `scope_root` along that axis's
    placements. That each placement is an edge of the pool check_axes has said. Members are the
    build's (`members_of`), one membership computation for the validator, the tool and the site."""
    sys.path.insert(0, str(ROOT / "tools"))
    from build import Pool, asserted_for, fillers, members_of, places   # noqa: E402 — imported only when a view declares a scope tree
    errs: list[str] = []
    core = list(schema["$defs"]["statement"]["properties"]["slots"]["properties"])
    pool = Pool(schema)
    for vid, view in sorted(entities.items()):
        if view.get("type") != "view" or "scope_root" not in view:
            continue
        rel, slot, root = ids[vid], view.get("anchor_slot"), view["scope_root"]
        if slot not in core:
            errs.append(f"{rel}: anchor_slot {slot!r} is not one of the statement's own slots ({', '.join(core)})")
            continue
        first = pool.entities.get(((view.get("group_by") or [None])[0]) or "")
        if not (first and first.get("carrier") == "hierarchy" and first.get("slot") == slot and asserted_for(first, vid)):
            errs.append(f"{rel}: declares scope_root, so the first entry of its group_by must be a hierarchy axis over "
                        f"{slot!r} asserted for {vid} — the axis that draws its scope tree (spec §4.1)")
            continue
        up = {c: places(v) for c, v in (first.get("placements") or {}).items()}
        try:
            members = members_of(view, pool)
        except SystemExit as exc:
            errs.append(f"{rel}: its scope tree cannot be checked: {exc}")
            continue
        reaches: dict[str, bool] = {}
        def reach(cid: str) -> bool:
            if cid not in reaches:
                seen, queue = {cid}, [cid]
                while queue and root not in seen:
                    for nxt in up.get(queue.pop(), []):
                        if nxt not in seen:
                            seen.add(nxt); queue.append(nxt)
                reaches[cid] = root in seen
            return reaches[cid]
        for sid, st in sorted(members.items()):
            if st.get("type") != "statement":
                continue
            anchors = fillers(st, slot)
            if len(anchors) != 1:
                errs.append(f"{ids[sid]}: statement {sid} has {len(anchors)} concepts in {slot!r}, the anchor slot of {vid}; it needs exactly one")
            elif not reach(anchors[0]):
                errs.append(f"{ids[sid]}: the anchor {anchors[0]} of {sid} does not reach {root}, the scope_root of {vid}, along the placements of {first['id']}")
    return errs


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
