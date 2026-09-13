#!/usr/bin/env python3
"""Build the site under site/ from data/ and schema/schema.yaml (docs/publication.md).

    uv run tools/build.py                      # site/ for the domain (base path "/")
    uv run tools/build.py --base /graph.med/   # for graph-med.github.io/graph.med/
    uv run tools/build.py --cname graph.med    # also emit the CNAME file for Pages
    uv run tools/build.py --base /preview/pr12/ --preview 12   # the preview of pull request 12

Every view becomes <view-id>/index.html — one decision tree (which patient group? →
which condition? → recommendation → aim; answers on the edges; laid out left to right
in the browser by dagre), a chapter tree that filters it and a search that fades it
(both from the sources' outline and the claims' sections, docs/publication.md §3),
with a detail section beside or below it — plus <view-id>.json; every entity becomes
<namespace>/<entity-id>/index.html and <namespace>/<entity-id>.json; the schema is
copied to schema/schema.yaml. Offline, deterministic, nothing authored.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote as urlquote

import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "schema" / "schema.yaml"
SITE_SRC = Path(__file__).resolve().parent / "site"
REPO = "https://github.com/graph-med/graph.med"

SLOTS = ("population", "action", "condition", "outcome")
EVIDENCE = ("supports", "contests")
STATEMENT_EDGES = ("specializes", "complements", "conflicts")
BODY_TEXT = ("refines", "supplements", "limits")
DIRECTION_GLYPH = {"für": "✓", "gegen": "✗", "abwägen": "⚖", "Lücke": "∅"}
# The only words the build adds inside the graph, in the view's source language (docs/publication.md §3):
# the two questions whose answers are the population and condition slots. Add a row per language;
# a view in a language without one fails the build rather than falling back to another language.
QUESTIONS = {"de": {"population": "Welche Population?", "condition": "Welche Bedingung?"}}


def direction_of(claims: list[dict]) -> dict | None:
    """The four-word direction of a statement, derived from its supporting claims (docs/publication.md §3):
    soll/sollte for → für, soll/sollte against → gegen, kann → abwägen (the guideline's own open
    recommendation), a gap notice → Lücke. Facts have no direction; claims that disagree give abwägen."""
    sup = [c for c in claims if c["edge"] == "supports"]
    if not sup:
        return None
    if all(c.get("kind") == "gap_notice" for c in sup):
        word = "Lücke"
    elif any(c.get("verb") == "kann" for c in sup):
        word = "abwägen"
    else:
        dirs = {c.get("direction") for c in sup if c.get("direction")}
        if not dirs:
            return None
        word = "abwägen" if len(dirs) > 1 else ("gegen" if dirs == {"against"} else "für")
    verbs = sorted({c["verb"] for c in sup if c.get("verb")})
    if word == "abwägen" and len({c.get("direction") for c in sup if c.get("direction")}) == 1:
        verbs.append("eher gegen" if sup[0].get("direction") == "against" else "eher für")   # the lean of an open recommendation
    return {"word": word, "glyph": DIRECTION_GLYPH[word], "verbs": verbs}


# ── the pool ────────────────────────────────────────────────────────────────

def load(path: Path):
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


class Pool:
    def __init__(self, schema: dict):
        self.entities: dict[str, dict] = {}
        self.edges: list[tuple[str, str, str, dict]] = []
        for glob in schema["x-layout"]:
            for path in sorted(ROOT.glob(glob)):
                doc = load(path)
                if str(path.relative_to(ROOT)).startswith("data/edges/"):
                    for e in doc or []:
                        self.edges.append((e[0], e[1], e[2], e[3] if len(e) > 3 else {}))
                else:
                    for ent in (doc if isinstance(doc, list) else [doc]):
                        self.entities[ent["id"]] = ent
        self.out: dict[str, list] = defaultdict(list)
        self.inc: dict[str, list] = defaultdict(list)
        for frm, kind, to, props in self.edges:
            self.out[frm].append((kind, to, props))
            self.inc[to].append((kind, frm, props))

    def of_type(self, t: str):
        return [e for e in self.entities.values() if e.get("type") == t]

    def source_of(self, claim: dict) -> str:
        return claim["source"]["at"].split("#", 1)[0]

    def claims_for(self, statement_id: str) -> list[dict]:
        """Claims linked to a statement by supports/contests, with the edge kind."""
        rows = []
        for kind, frm, _ in self.inc.get(statement_id, []):
            if kind in EVIDENCE and frm in self.entities:
                rows.append({"edge": kind, **self.claim_view(self.entities[frm])})
        rows.sort(key=lambda r: (r["edge"] != "supports", natural(r.get("recommendation_no") or ""), r["id"]))
        return rows

    def claim_view(self, claim: dict) -> dict:
        at = claim["source"]["at"]
        src_id, _, frag = at.partition("#")
        page = frag.split("=", 1)[1] if frag.startswith("page=") else None
        src = self.entities.get(src_id, {})
        link = src.get("url", "")
        if link and page:
            link = source_link(link, page, claim["source"]["quote"])
        row = {k: claim.get(k) for k in ("id", "kind", "recommendation_no", "section", "label", "grade", "verb", "direction", "consensus", "lang")}
        row.update({"quote": claim["source"]["quote"], "page": page, "source": src_id, "source_title": src.get("title"), "link": link})
        for kind, frm, _ in self.inc.get(claim["id"], []):   # what the body text adds to this claim (spec §5)
            if kind in BODY_TEXT and frm in self.entities:
                b = self.entities[frm]
                frag = b["source"]["at"].partition("#")[2]
                row.setdefault("body", []).append({"kind": kind, "id": frm, "label": b["label"], "quote": b["source"]["quote"], "lang": b["lang"],
                                                   "page": frag.split("=", 1)[1] if frag.startswith("page=") else None, "section": b.get("section"),
                                                   "link": source_link(src.get("url", ""), frag.split("=", 1)[1] if frag.startswith("page=") else None, b["source"]["quote"])})
        for kind, to, _ in self.out.get(claim["id"], []):
            if kind in EVIDENCE:
                row.setdefault("statements", []).append({"edge": kind, "id": to, "label": self.entities.get(to, {}).get("label", to)})
        return row

    def families_of(self, concept_id: str) -> list[dict]:
        """The families a concept belongs to — every concept above it along `broader` (spec §5), nearest
        first; a concept with two parents lists both. Grouping only: nothing is inherited along the edge."""
        rows, seen, queue = [], {concept_id}, [concept_id]
        while queue:
            for kind, to, _ in sorted(self.out.get(queue.pop(0), []), key=lambda e: e[1]):
                if kind == "broader" and to in self.entities and to not in seen:
                    seen.add(to); queue.append(to)
                    rows.append({"id": to, "label": self.entities[to]["label"]})
        return rows

    def neighbours_of(self, st: dict) -> dict[str, list[dict]]:
        """The neighbouring situations of a statement (docs/publication.md §3, the sixth question): the other
        statements under the same patient group — those sharing its condition first —, the same action
        recommended for other groups, and the statements it is linked to by specializes, complements or
        conflicts, in either direction. Each row names what differs, so the reader sees the neighbouring
        situation before following the link."""
        slots = st.get("slots") or {}
        concept = lambda cid: {"id": cid, "label": self.entities[cid]["label"]} if cid in self.entities else None
        def row(other):
            o = other.get("slots") or {}
            return {"id": other["id"], "label": other["label"], "short": other.get("short_label") or other["label"], "lang": other["lang"],
                    "population": concept(o.get("population")), "condition": concept(o.get("condition")),
                    "same_condition": o.get("condition") == slots.get("condition")}
        order = lambda r: (natural(min((c["recommendation_no"] for c in self.claims_for(r["id"]) if c.get("recommendation_no")), default="")), r["id"])
        others = [o for o in self.of_type("statement") if o["id"] != st["id"]]
        group = sorted((row(o) for o in others if slots.get("population") and (o.get("slots") or {}).get("population") == slots["population"]),
                       key=lambda r: (not r["same_condition"],) + tuple(order(r)))
        action = sorted((row(o) for o in others if slots.get("action") and (o.get("slots") or {}).get("action") == slots["action"]
                         and (o.get("slots") or {}).get("population") != slots.get("population")), key=order)
        linked = [{"kind": k, "direction": "out", **row(self.entities[to])} for k, to, _ in self.out.get(st["id"], []) if k in STATEMENT_EDGES and to in self.entities]
        linked += [{"kind": k, "direction": "in", **row(self.entities[frm])} for k, frm, _ in self.inc.get(st["id"], []) if k in STATEMENT_EDGES and frm in self.entities]
        return {"group": group, "action": action, "linked": linked}

    def uses_of(self, concept_id: str) -> list[dict]:
        rows = []
        for st in self.of_type("statement"):
            for slot in SLOTS:
                if (st.get("slots") or {}).get(slot) == concept_id:
                    rows.append({"id": st["id"], "label": st["label"], "slot": slot})
        rows.sort(key=lambda r: r["id"])
        return rows


def source_link(url: str, page: str | None, quote: str) -> str:
    """The link into a PDF source (docs/publication.md §5, spec §6.1): the physical page, and the
    quote as a search so that viewers which understand it highlight the passage — Firefox's
    pdf.js (`phrase=true` makes it search the whole quote, not its words) and Acrobat do; Chrome,
    Edge and Safari ignore the search and still land on the page."""
    if not url or not page:
        return url
    return f"{url}#page={page}&search={urlquote(quote, safe='')}&phrase=true"


def natural(s: str):
    return [int(p) if p.isdigit() else p for p in re.split(r"(\d+)", s)]


# ── views ───────────────────────────────────────────────────────────────────

def members_of(view: dict, pool: Pool) -> dict[str, dict]:
    """Resolve a view's filter to its member entities (docs/publication.md §2, spec §4)."""
    f = view["filter"]
    if view["view_kind"] != "selection" or "sources" not in f:
        raise SystemExit(f"{view['id']}: only selection views over `sources` are built yet")
    members: dict[str, dict] = {}
    for src in f["sources"]:
        members[src] = pool.entities[src]
    for claim in pool.of_type("claim"):
        if pool.source_of(claim) in f["sources"]:
            members[claim["id"]] = claim
            for kind, to, _ in pool.out.get(claim["id"], []):
                if kind in EVIDENCE and to in pool.entities:
                    members[to] = pool.entities[to]
    for ent in list(members.values()):
        if ent.get("type") == "statement":
            for slot in SLOTS:
                cid = (ent.get("slots") or {}).get(slot)
                if cid in pool.entities:
                    members[cid] = pool.entities[cid]
    queue = [m["id"] for m in members.values() if m.get("type") == "concept"]   # and the families above them (spec §5 broader)
    while queue:
        for kind, to, _ in pool.out.get(queue.pop(), []):
            if kind == "broader" and to in pool.entities and to not in members:
                members[to] = pool.entities[to]
                queue.append(to)
    return members


def decision_tree_of(view: dict, members: dict[str, dict], pool: Pool) -> dict:
    """One decision tree for the whole view, derived from the statements' slots
    (docs/publication.md §3). The question nodes are ours; every answer on an edge and
    every box is a slot value or a claim's grade. Patient groups are the population
    concepts and the families above them (`broader`), answers ordered by how many
    recommendations they lead to; a recommendation hangs from the group it was made for,
    never from a family. Layout and folding happen in the browser (dagre)."""
    nodes: list[dict] = []
    edges: list[dict] = []
    seen: set = set()
    def add(nid, **kw):
        if nid not in seen:
            seen.add(nid); nodes.append({"id": nid, **kw})
        return nid
    def edge(a, b, kind, label=None, ref=None):
        e = {"from": a, "to": b, "kind": kind}
        if label: e["label"] = label
        if ref:
            e["ref"] = ref
            if kind == "answer": e["text"] = text_of(ref)   # an answer is searchable by what it names, the way a node is
        edges.append(e)
    label = lambda cid: members[cid]["label"] if cid in members else cid
    short = lambda cid: members[cid].get("short_label") or members[cid]["label"] if cid in members else cid   # boxes and answers show the short form
    facet = lambda cid: members[cid].get("facet") if cid in members else None
    # what the search matches on a group, an aim, an answer: the concept's label and short label
    # (docs/publication.md §3; the browser folds case and diacritics)
    text_of = lambda cid: " ".join(filter(None, [label(cid), members[cid].get("short_label")])) if cid in members else cid
    sources = [members[s] for s in view["filter"]["sources"]]
    root = add(view["id"], ref=sources[0]["id"], type="root", lang=sources[0]["lang"], label=sources[0]["title"])
    lang = sources[0]["lang"]
    if lang not in QUESTIONS:
        raise SystemExit(f"{view['id']}: no question words for language {lang!r} — add a row to QUESTIONS in tools/build.py")
    statements = sorted((m for m in members.values() if m["type"] == "statement"),
                        key=lambda s: natural(min((c["recommendation_no"] for c in pool.claims_for(s["id"]) if c.get("recommendation_no")), default="")) + [s["id"]])
    own: dict = defaultdict(list)          # statements whose population is exactly this concept
    for st in statements:
        own[(st.get("slots") or {}).get("population")].append(st)
    # the patient-group hierarchy: every population concept and every family above it (spec §5 broader);
    # a junction per concept, its count the recommendations anywhere below it, families first by weight
    concepts = set(own) & set(members)
    children: dict = defaultdict(list)
    stack = list(concepts)
    while stack:
        c = stack.pop()
        for kind, to, _ in pool.out.get(c, []):
            if kind == "broader" and to in members:
                children[to].append(c)
                if to not in concepts:
                    concepts.add(to); stack.append(to)
    parents = {c for cs in children.values() for c in cs}
    def below(c, seen=()):
        if c in seen:
            return set()
        return {st["id"] for st in own.get(c, [])} | {sid for k in children.get(c, []) for sid in below(k, seen + (c,))}
    weight = {c: len(below(c)) for c in concepts}
    def branch(parent, groups):
        """Every branching is a question (docs/publication.md §3): whatever forks into patient groups —
        the root into the families, a family into its members — asks "Welche Population?" first, and
        each answer leads to a group's junction. One rule for every level of the tree."""
        q = add(f"q:{parent}:population", type="question", lang=lang, label=QUESTIONS[lang]["population"])
        edge(parent, q, "flow")
        for c in sorted(groups, key=lambda c: (-weight[c], short(c))):
            junction(c, q)
        return q
    def junction(c, parent):
        j = f"j:{c}"
        edge(parent, j, "answer", short(c), ref=c)
        if j in seen:   # a group with two parents appears under both, built once
            return
        add(j, ref=c, type="junction", label=str(weight[c]), lang=members[c]["lang"], group=short(c), facets=[facet(c)] if facet(c) else [], text=text_of(c))
        if children.get(c):
            branch(j, children[c])
    q0 = branch(root, concepts - parents)
    statements.sort(key=lambda s: (-weight.get((s.get("slots") or {}).get("population"), 0), label((s.get("slots") or {}).get("population") or ""),
                                   natural(min((c["recommendation_no"] for c in pool.claims_for(s["id"]) if c.get("recommendation_no")), default="")), s["id"]))
    for st in statements:
        slots = st.get("slots") or {}
        claims = pool.claims_for(st["id"])
        grades = {c["grade"] for c in claims if c["edge"] == "supports" and c.get("grade")}
        pop, cond, outc = slots.get("population"), slots.get("condition"), slots.get("outcome")
        d = direction_of(claims)
        sid = add(st["id"], ref=st["id"], type="statement", lang=st["lang"],
                  label=(d["glyph"] + " " if d else "") + (st.get("short_label") or st["label"]), full=st["label"],
                  direction=d["word"] if d else None, facets=sorted({f for f in (facet(c) for c in slots.values()) if f}),
                  grade=grades.pop() if len(grades) == 1 else ("mixed" if grades else None),
                  against={c["direction"] for c in claims if c["edge"] == "supports" and c.get("direction")} == {"against"},
                  contested=any(c["edge"] == "contests" for c in claims),
                  no=min((c["recommendation_no"] for c in claims if c.get("recommendation_no")), default=None),
                  sections=sorted({c["section"] for c in claims if c.get("section")}, key=natural),
                  # what the search matches: the statement, its short form, its slot concepts (label and short
                  # label), its claims' sentences and quotes (docs/publication.md §3)
                  text=" ".join(filter(None, [st["label"], st.get("short_label")] + [text_of(c) for c in slots.values() if c in members]
                                              + [c.get("label") for c in claims] + [c.get("quote") for c in claims])))
        at = f"j:{pop}" if pop in members else q0   # the statement hangs from its own group's junction, never from a family's
        if cond in members:  # a further question, asked within the patient group
            q = f"q:{at}:condition"
            if q not in seen:
                add(q, type="question", lang=lang, label=QUESTIONS[lang]["condition"])
                edge(at, q, "flow")
            edge(q, sid, "answer", short(cond), ref=cond)
        else:
            edge(at, sid, "flow")
        if outc in members:
            add(outc, ref=outc, type="aim", lang=members[outc]["lang"], label=short(outc), full=label(outc), facets=[facet(outc)] if facet(outc) else [], text=text_of(outc))
            edge(sid, outc, "aim")
        for kind, to, _ in pool.out.get(st["id"], []):
            if kind in STATEMENT_EDGES and to in members:
                edge(sid, to, "relation", kind)
    return {"nodes": nodes, "edges": edges}


# ── rendering ───────────────────────────────────────────────────────────────

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, default=ROOT / "site")
    ap.add_argument("--base", default="/", help="base path every link starts with (default: /)")
    ap.add_argument("--cname", default=None, help="emit a CNAME file with this domain")
    ap.add_argument("--preview", type=int, default=None, metavar="N",
                    help="build the preview of pull request N: every page says so and asks not to be indexed")
    args = ap.parse_args(argv)
    base = args.base if args.base.endswith("/") else args.base + "/"

    schema = load(SCHEMA)
    pool = Pool(schema)
    commit = git_commit()
    env = Environment(loader=FileSystemLoader(SITE_SRC / "templates"), autoescape=select_autoescape(["html"]),
                      trim_blocks=True, lstrip_blocks=True)
    env.globals.update(base=base, commit=commit, built=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                       version=schema.get("x-version"), repo=REPO,
                       preview={"number": args.preview, "url": f"{REPO}/pull/{args.preview}"} if args.preview else None)
    env.filters["short"] = lambda eid: eid.split("/", 1)[-1]

    out = args.out
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (out / ".nojekyll").write_text("")
    if args.cname:
        (out / "CNAME").write_text(args.cname + "\n")
    (out / "schema").mkdir()
    shutil.copy(SCHEMA, out / "schema" / "schema.yaml")
    shutil.copytree(SITE_SRC / "static", out / "assets")

    def details(ent: dict) -> dict:
        """What the sheet and the entity page show for one entity (docs/publication.md §3)."""
        d = {"entity": ent}
        t = ent["type"]
        if t == "statement":
            # the six questions a physician brings to a recommendation (docs/publication.md §3): the answer,
            # whom it applies to, its evidence, what could change it, where it is written, its neighbours
            slots = ent.get("slots") or {}
            concept = lambda cid: {"id": cid, "label": pool.entities[cid]["label"]} if cid in pool.entities else None
            d["action"], d["outcome"], d["condition"] = concept(slots.get("action")), concept(slots.get("outcome")), concept(slots.get("condition"))
            d["population"] = dict(concept(slots["population"]), families=pool.families_of(slots["population"])) if slots.get("population") in pool.entities else None
            d["claims"] = pool.claims_for(ent["id"])
            d["contested"] = any(c["edge"] == "contests" for c in d["claims"])
            d["direction"] = direction_of(d["claims"])
            d["body"] = {k: [dict(b, claim=c["recommendation_no"]) for c in d["claims"] for b in c.get("body", []) if b["kind"] == k] for k in BODY_TEXT}
            d["body"] = {k: v for k, v in d["body"].items() if v}
            d["neighbours"] = pool.neighbours_of(ent)
        elif t == "concept":
            d["uses"] = pool.uses_of(ent["id"])
            d["codes"] = [to for k, to, _ in pool.out.get(ent["id"], []) if k == "codes_as"]
        elif t == "claim":
            d["claim"] = pool.claim_view(ent)
        elif t == "source":
            d["claim_count"] = sum(1 for c in pool.of_type("claim") if pool.source_of(c) == ent["id"])
        return d

    def edges_json(eid: str) -> dict:
        return {"out": [{"kind": k, "to": to, **p} for k, to, p in pool.out.get(eid, [])],
                "in": [{"kind": k, "from": frm, **p} for k, frm, p in pool.inc.get(eid, [])]}

    entity_tpl = env.get_template("entity.html")
    detail_tpl = env.get_template("details.html")
    for eid, ent in sorted(pool.entities.items()):
        if ent["type"] == "view":
            continue
        d = details(ent)
        page = out / eid
        page.mkdir(parents=True, exist_ok=True)
        (page / "index.html").write_text(entity_tpl.render(**d), encoding="utf-8")
        (out / (eid + ".json")).write_text(dumps({**ent, "edges": edges_json(eid)}), encoding="utf-8")

    views = []
    view_tpl = env.get_template("view.html")
    for view in sorted(pool.of_type("view"), key=lambda v: v["id"]):
        vid = view["id"].split("/", 1)[1]
        members = members_of(view, pool)
        graph = decision_tree_of(view, members, pool)
        refs = {n["ref"] for n in graph["nodes"] if n.get("ref")} | {e["ref"] for e in graph["edges"] if e.get("ref")}
        graph["html"] = {r: detail_tpl.render(**details(pool.entities[r])) for r in sorted(refs) if r in pool.entities}
        sources = [members[s] for s in view["filter"]["sources"]]
        title = sources[0]["title"] if len(sources) == 1 else vid
        counts = {t: sum(1 for m in members.values() if m["type"] == t) for t in ("statement", "concept", "claim")}
        outline = [{"source": s["id"], **e} for s in sources for e in s.get("outline") or []]   # spec §6.7; a chapter is a filter, never a node
        data = {"id": view["id"], "title": title, "sources": [s["id"] for s in sources], "commit": commit, "outline": outline,
                "facets": sorted({f for n in graph["nodes"] for f in n.get("facets", [])}), **graph}
        (out / vid).mkdir(parents=True, exist_ok=True)
        (out / vid / "index.html").write_text(
            view_tpl.render(view=view, vid=vid, title=title, sources=sources, counts=counts,
                            graph_json=dumps(data).replace("</", "<\\/")), encoding="utf-8")   # safe inside <script>
        (out / (vid + ".json")).write_text(dumps(data), encoding="utf-8")
        views.append({"vid": vid, "title": title, "sources": sources, "counts": counts})

    (out / "index.html").write_text(env.get_template("index.html").render(views=views, sources=sorted(pool.of_type("source"), key=lambda s: s["id"])), encoding="utf-8")
    print(f"built {len(views)} view(s) and {len(pool.entities) - len(views)} entity pages into {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out} (base {base}{', preview of pull request ' + str(args.preview) if args.preview else ''})")
    return 0


def dumps(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def git_commit() -> str:
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True, check=True, cwd=ROOT).stdout.strip()
    except Exception:  # noqa: BLE001 — a tarball build has no git
        return "unknown"


if __name__ == "__main__":
    sys.exit(main())
