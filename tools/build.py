#!/usr/bin/env python3
"""Build the site under site/ from data/ and schema/schema.yaml (docs/publication.md).

    uv run tools/build.py                      # site/ for the domain (base path "/")
    uv run tools/build.py --base /graph.med/   # for graph-med.github.io/graph.med/
    uv run tools/build.py --cname graph.med    # also emit the CNAME file for Pages
    uv run tools/build.py --base /preview/pr12/ --preview 12   # the preview of pull request 12

Every view becomes <view-id>/index.html — one decision tree (which patient group? →
which condition? → recommendation → aim; answers on the edges; laid out left to right
in the browser by dagre) per grouping the view offers — the plain hierarchy, the
chapters of its sources, and each axis of its `group_by` (spec §4.1), chosen by a
switch on the page —, a chapter tree
that filters it and a search that fades it (both from the sources' outline and the
claims' sections, docs/publication.md §3), with a detail section beside or below it
— plus <view-id>.json; every entity becomes
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

EVIDENCE = ("supports", "contests")
STATEMENT_EDGES = ("specializes", "complements", "conflicts")
BODY_TEXT = ("refines", "supplements", "limits")
DIRECTION_GLYPH = {"für": "✓", "gegen": "✗", "abwägen": "⚖", "Lücke": "∅"}
GRADES = ("A", "B", "0", "EK")   # the guideline's own scale, in order: the letter a box carries after its glyph; a new scale is a new letter
# The only words the build adds inside the graph, in the view's source language (docs/publication.md §3):
# the two questions whose answers are the population and condition slots, the question a dimension axis
# adds (its short label filled in), the chapter question and the switch's entries for the plain hierarchy
# and the chapters, and the one answer for what a grouping cannot place (spec §4.1 "4. Shown"). Keyed by
# structural key, never by an axis: the build knows no axis by name. Add a row per language; a view in a
# language without one fails the build rather than falling back to another language.
WORDS = {"de": {"population": "Welche Population?", "condition": "Welche Bedingung?", "section": "Welches Kapitel?",
                "axis": "Welche {label}?", "plain": "Population", "chapter": "Kapitel", "unplaced": "nicht zugeordnet"}}
CHAPTERS = "section"   # the URL token and grouping id of the built-in chapter grouping (`?by=section`)


def direction_of(claims: list[dict]) -> dict | None:
    """The four-word direction of a statement, derived from its supporting claims (docs/publication.md §3):
    soll/sollte for → für, soll/sollte against → gegen, kann → abwägen (the guideline's own open
    recommendation), a gap notice → Lücke. Facts have no direction; claims that disagree give abwägen.
    Carries the supporting claims' own grades and consensus levels too, so the banner answers "how binding
    and how well supported" without composing them into one derived grade (open question grade-derivation)."""
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
    if word == "gegen":
        verbs = [f"{v} nicht" for v in verbs]   # "soll nicht"/"sollte nicht", matching the per-claim tags
    elif word == "abwägen" and len({c.get("direction") for c in sup if c.get("direction")}) == 1:
        verbs.append("eher gegen" if sup[0].get("direction") == "against" else "eher für")   # the lean of an open recommendation
    grades = sorted({c["grade"] for c in sup if c.get("grade")}, key=lambda g: (GRADES.index(g) if g in GRADES else len(GRADES), g))
    consensus = sorted({c["consensus"] for c in sup if c.get("consensus")})
    return {"word": word, "glyph": DIRECTION_GLYPH[word], "verbs": verbs, "grades": grades, "consensus": consensus}


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

    def uses_of(self, concept_id: str) -> list[dict]:
        rows = []
        for st in self.of_type("statement"):
            for slot, cid in (st.get("slots") or {}).items():   # the four slots and any a dimension axis adds (spec §4.1)
                if cid == concept_id:
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

def under(section: str, s) -> bool:
    """Whether outline section `s` is `section` or lies beneath it ("7.4" holds "7.4.2.1")."""
    return s is not None and (str(s) == section or str(s).startswith(section + "."))


def members_of(view: dict, pool: Pool) -> dict[str, dict]:
    """Resolve a view's filter to its member entities (docs/publication.md §2, spec §4): the selection
    forms `sources` and, narrowing it, `section: {source, under}` — the claims of that source whose
    section is `under` or beneath it (schema x-view-filters, spec §6.7). A filter selects; it never
    adds a node or an edge."""
    f = view["filter"]
    if view["view_kind"] != "selection" or "sources" not in f:
        raise SystemExit(f"{view['id']}: only selection views over `sources` are built yet")
    sec = f.get("section")
    if sec and not any(under(str(sec["under"]), e.get("section")) for e in pool.entities[sec["source"]].get("outline") or []):
        raise SystemExit(f"{view['id']}: section {sec['under']!r} is not in the outline of {sec['source']}")
    members: dict[str, dict] = {}
    for src in f["sources"]:
        members[src] = pool.entities[src]
    for claim in pool.of_type("claim"):
        if pool.source_of(claim) in f["sources"] and (not sec or pool.source_of(claim) != sec["source"] or under(str(sec["under"]), claim.get("section"))):
            members[claim["id"]] = claim
            for kind, to, _ in pool.out.get(claim["id"], []):
                if kind in EVIDENCE and to in pool.entities:
                    members[to] = pool.entities[to]
    for ent in list(members.values()):
        if ent.get("type") == "statement":
            for cid in (ent.get("slots") or {}).values():   # the four slots and any a dimension axis adds (spec §4.1)
                if cid in pool.entities:
                    members[cid] = pool.entities[cid]
    queue = [m["id"] for m in members.values() if m.get("type") == "concept"]   # and the families above them (spec §5 broader)
    while queue:
        for kind, to, _ in pool.out.get(queue.pop(), []):
            if kind == "broader" and to in pool.entities and to not in members:
                members[to] = pool.entities[to]
                queue.append(to)
    return members


def title_of(view: dict, members: dict[str, dict], root: bool = False) -> str:
    """What a view is called: its one source's title (several sources give the view its id), and for a
    `section` view the section's number and title after it — alone at the root of the tree (`root`),
    where the box is small and the sheet beside it names the source."""
    sources = [members[s] for s in view["filter"]["sources"]]
    sec = view["filter"].get("section")
    title = sources[0]["title"] if len(sources) == 1 else view["id"].split("/", 1)[1]
    if sec:
        entry = next(e for e in members[sec["source"]].get("outline") or [] if str(e.get("section")) == str(sec["under"]))
        return f"{entry['section']} {entry['title']}" if root else f"{title} — {entry['section']} {entry['title']}"
    return title


def clip(text: str, limit: int = 60) -> str:
    """A label the box rule allows (schema short_text: 60 characters): cut at a word boundary with an
    ellipsis only when the text is longer — a title from an outline has no short form of its own."""
    if len(text) <= limit:
        return text
    cut = text[:limit - 1].rsplit(" ", 1)[0].rstrip(" ,;:–-")
    return cut + "…"


def groupings_of(view: dict, members: dict[str, dict], pool: Pool) -> list[dict]:
    """One decision tree per grouping the view offers, in the order of its switch (spec §4.1 "4. Shown",
    docs/publication.md §3): the plain hierarchy first, needing no declaration; then the chapters of the
    view's sources — built in for every view, derived from the claims' sections and the sources' outline
    (spec §6.7), no axis entity behind it; then each axis of `group_by` by its label — the validator has
    checked that each is asserted for this view. Every grouping is one description the one derivation
    reads: a question and a partition of the statements into its answers (chapters, a dimension axis),
    or the `broader` respect the families come from (a hierarchy axis), or neither (the plain hierarchy)."""
    lang = members[view["filter"]["sources"][0]]["lang"]
    if lang not in WORDS:
        raise SystemExit(f"{view['id']}: no words for language {lang!r} — add a row to WORDS in tools/build.py")
    words = WORDS[lang]
    statements = [m for m in members.values() if m["type"] == "statement"]
    short = lambda cid: members[cid].get("short_label") or members[cid]["label"] if cid in members else cid
    text_of = lambda cid: " ".join(filter(None, [members[cid]["label"], members[cid].get("short_label")])) if cid in members else cid

    def by_section() -> list[dict]:
        """The top-level sections of every source of the view, in outline order; a statement is behind each
        chapter one of its claims' `section` lies in, so one supported from two chapters is under both."""
        rows = []
        for sid in view["filter"]["sources"]:
            src = members[sid]
            for e in src.get("outline") or []:
                sec = str(e.get("section"))
                if "." in sec:
                    continue
                sts = [st for st in statements if any(under(sec, c.get("section")) for c in pool.claims_for(st["id"]))]
                rows.append({"id": f"{CHAPTERS}:{sid}:{sec}", "ref": "", "label": clip(f"{sec} {e['title']}"), "text": f"{sec} {e['title']}",
                             "lang": src["lang"], "facets": [], "statements": sts})
        return rows

    def by_slot(axis: dict) -> list[dict]:
        """A dimension axis's values in the declared order; a statement is behind the value its slot holds."""
        slot = axis["slot"]
        return [{"id": v, "ref": v, "label": short(v), "text": text_of(v), "lang": members[v]["lang"] if v in members else lang,
                 "facets": [members[v]["facet"]] if members.get(v, {}).get("facet") else [],
                 "statements": [st for st in statements if (st.get("slots") or {}).get(slot) == v]} for v in axis["values"]]

    rows = [{"axis": "", "label": words["plain"], "lang": lang, **decision_tree_of(view, members, pool)},
            {"axis": CHAPTERS, "label": words["chapter"], "lang": lang,
             **decision_tree_of(view, members, pool, question=(f"q:{view['id']}:{CHAPTERS}", words["section"]), partition=by_section())}]
    for aid in view.get("group_by") or []:
        axis = pool.entities[aid]
        tree = (decision_tree_of(view, members, pool, question=(f"q:{view['id']}:{axis['slot']}", words["axis"].format(label=axis.get("short_label") or axis["label"])),
                                 partition=by_slot(axis)) if axis["carrier"] == "dimension"
                else decision_tree_of(view, members, pool, hierarchy_axis=axis))
        rows.append({"axis": aid, "label": axis["label"], "lang": axis["lang"], **tree})
    return rows


def decision_tree_of(view: dict, members: dict[str, dict], pool: Pool, question: tuple[str, str] | None = None,
                     partition: list[dict] | None = None, hierarchy_axis: dict | None = None) -> dict:
    """One decision tree for the whole view, derived from the statements' slots
    (docs/publication.md §3). The question nodes are ours; every answer on an edge and
    every box is a slot value or a claim's grade. Patient groups are the population
    concepts and the families above them (`broader`), answers ordered by how many
    recommendations they lead to; a recommendation hangs from the group it was made for,
    never from a family. Layout and folding happen in the browser (dagre).

    The grouping chosen (spec §4.1 "4. Shown", groupings_of): nothing for the plain hierarchy; a
    `question` (node id, text) with a `partition` of the statements into its answers — the chapters,
    or a dimension axis's values — asked first, the population question below each answer; or a
    `hierarchy_axis` whose `broader` edges replace the plain hierarchy's as the families of the
    population question. Whatever the grouping cannot place is one answer, "not placed", last, at
    every depth where its question is asked; the shape, the folding and where a recommendation hangs
    stay the same, by one code path."""
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
    slots = lambda st: st.get("slots") or {}
    first_no = lambda st: natural(min((c["recommendation_no"] for c in pool.claims_for(st["id"]) if c.get("recommendation_no")), default=""))
    sources = [members[s] for s in view["filter"]["sources"]]
    lang = sources[0]["lang"]
    words = WORDS[lang]
    root = add(view["id"], ref=sources[0]["id"], type="root", lang=lang, label=title_of(view, members, root=True))
    statements = sorted((m for m in members.values() if m["type"] == "statement"), key=lambda s: first_no(s) + [s["id"]])

    def hang(st, at):
        """The recommendation itself, under the junction of its group (`at`, or the question when it names
        no group): through the condition question where it has one, then its aim and its relations."""
        sl = slots(st)
        claims = pool.claims_for(st["id"])
        grades = {c["grade"] for c in claims if c["edge"] == "supports" and c.get("grade")}
        cond, outc = sl.get("condition"), sl.get("outcome")
        d = direction_of(claims)
        again = st["id"] in seen   # under two answers (two chapters): one node, hung from both, its aim and relations once
        # the box reads "✓ A · <short label>": the direction's glyph, the grade as a letter (every grade when the
        # claims differ — shown, never composed), then the short form (docs/publication.md §3)
        letters = "/".join(sorted(grades, key=lambda g: (GRADES.index(g) if g in GRADES else len(GRADES), g)))
        head = " ".join(filter(None, [d["glyph"] if d else "", letters]))
        sid = add(st["id"], ref=st["id"], type="statement", lang=st["lang"],
                  label=(head + (" · " if letters else " ") if head else "") + (st.get("short_label") or st["label"]), full=st["label"],
                  direction=d["word"] if d else None, facets=sorted({f for f in (facet(c) for c in sl.values()) if f}),
                  grade=next(iter(grades)) if len(grades) == 1 else ("mixed" if grades else None),
                  against={c["direction"] for c in claims if c["edge"] == "supports" and c.get("direction")} == {"against"},
                  contested=any(c["edge"] == "contests" for c in claims),
                  no=min((c["recommendation_no"] for c in claims if c.get("recommendation_no")), default=None),
                  sections=sorted({c["section"] for c in claims if c.get("section")}, key=natural),
                  # what the search matches: the statement, its short form, its slot concepts (label and short
                  # label), its claims' sentences and quotes (docs/publication.md §3)
                  text=" ".join(filter(None, [st["label"], st.get("short_label")] + [text_of(c) for c in sl.values() if c in members]
                                              + [c.get("label") for c in claims] + [c.get("quote") for c in claims])))
        if cond in members:  # a further question, asked within the patient group
            q = f"q:{at}:condition"
            if q not in seen:
                add(q, type="question", lang=lang, label=words["condition"])
                edge(at, q, "flow")
            edge(q, sid, "answer", short(cond), ref=cond)
        else:
            edge(at, sid, "flow")
        if again:
            return
        if outc in members:
            add(outc, ref=outc, type="aim", lang=members[outc]["lang"], label=short(outc), full=label(outc), facets=[facet(outc)] if facet(outc) else [], text=text_of(outc))
            edge(sid, outc, "aim")
        for kind, to, _ in pool.out.get(st["id"], []):
            if kind in STATEMENT_EDGES and to in members:
                edge(sid, to, "relation", kind)

    def unplaced(q, prefix, sts):
        """The one answer for what the axis cannot place: last among the answers of `q`, a junction the
        reader unfolds like any group, counting the statements behind it; what hangs below it is
        built by the same rules."""
        j = add(f"j:{prefix}unplaced", ref="", type="junction", label=str(len(sts)), lang=lang, group=words["unplaced"], facets=[], text=words["unplaced"])
        edge(q, j, "answer", words["unplaced"])
        return j

    def hierarchy(parent, sts, prefix, axis_id):
        """The patient-group hierarchy under `parent` for the statements `sts`: every population concept
        and every family above it along the `broader` edges of one respect — the plain hierarchy's
        edges carry no `axis`, a hierarchy axis's name it (spec §4.1) — a junction per concept, its
        count the recommendations anywhere below it, families first by weight. One code path for the
        root, for every value of a dimension axis and for the not-placed answer."""
        own: dict = defaultdict(list)          # statements whose population is exactly this concept
        for st in sts:
            own[slots(st).get("population")].append(st)
        concepts = set(own) & set(members)
        children: dict = defaultdict(list)
        stack = list(concepts)
        while stack:
            c = stack.pop()
            for kind, to, props in pool.out.get(c, []):
                if kind == "broader" and to in members and props.get("axis") == axis_id:
                    children[to].append(c)
                    if to not in concepts:
                        concepts.add(to); stack.append(to)
        parents = {c for cs in children.values() for c in cs}
        def below(c, trail=()):
            if c in trail:
                return set()
            return {st["id"] for st in own.get(c, [])} | {sid for k in children.get(c, []) for sid in below(k, trail + (c,))}
        weight = {c: len(below(c)) for c in concepts}
        def branch(at, groups):
            """Every branching is a question (docs/publication.md §3): whatever forks into patient groups —
            the root into the families, a family into its members — asks "Welche Population?" first, and
            each answer leads to a group's junction. One rule for every level of the tree."""
            q = add(f"q:{at}:population", type="question", lang=lang, label=words["population"])
            edge(at, q, "flow")
            for c in sorted(groups, key=lambda c: (-weight[c], short(c))):
                junction(c, q)
            return q
        def junction(c, q):
            j = f"j:{prefix}{c}"
            edge(q, j, "answer", short(c), ref=c)
            if j in seen:   # a group with two parents appears under both, built once
                return
            add(j, ref=c, type="junction", label=str(weight[c]), lang=members[c]["lang"], group=short(c), facets=[facet(c)] if facet(c) else [], text=text_of(c))
            if children.get(c):
                branch(j, children[c])
        top = concepts - parents
        # under a hierarchy axis a concept without an edge on that axis, and no member below it, has no
        # place: it is not a family of the axis, so it goes behind the not-placed answer (spec §4.1)
        rest = {c for c in top if axis_id and c not in children}
        q = branch(parent, top - rest)
        if rest:
            left = [st for c in rest for st in own[c]]
            hierarchy(unplaced(q, prefix, left), left, prefix + "unplaced:", None)
        order = lambda st: (-weight.get(slots(st).get("population"), 0), label(slots(st).get("population") or ""), first_no(st), st["id"])
        for st in sorted((st for st in sts if slots(st).get("population") not in rest), key=order):   # the not-placed subtree hung its own
            pop = slots(st).get("population")
            hang(st, f"j:{prefix}{pop}" if pop in members else q)   # its own group's junction, never a family's
        return q

    if partition is not None:
        qid, text = question
        q = add(qid, type="question", lang=lang, label=text)
        edge(root, q, "flow")
        placed: set = set()
        for a in partition:   # the given order; an answer with no statement of the view behind it is not offered
            if not a["statements"]:
                continue
            j = add(f"j:{a['id']}", ref=a["ref"], type="junction", label=str(len(a["statements"])), lang=a["lang"], group=a["label"], facets=a["facets"], text=a["text"])
            edge(q, j, "answer", a["label"], ref=a["ref"] or None)
            hierarchy(j, a["statements"], f"{a['id']}:", None)
            placed.update(st["id"] for st in a["statements"])
        rest = [st for st in statements if st["id"] not in placed]
        if rest:
            hierarchy(unplaced(q, f"{qid}:", rest), rest, f"{qid}:unplaced:", None)
    elif hierarchy_axis:
        if hierarchy_axis["slot"] != "population":
            raise SystemExit(f"{view['id']}: {hierarchy_axis['id']} folds `{hierarchy_axis['slot']}`; only a hierarchy over `population` is built yet")
        hierarchy(root, statements, "", hierarchy_axis["id"])
    else:
        hierarchy(root, statements, "", None)
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
            # the five questions a physician brings to a recommendation (docs/publication.md §3): the answer,
            # whom it applies to, its evidence, what could change it, where it is written
            slots = ent.get("slots") or {}
            concept = lambda cid: {"id": cid, "label": pool.entities[cid]["label"]} if cid in pool.entities else None
            d["action"], d["outcome"], d["condition"] = concept(slots.get("action")), concept(slots.get("outcome")), concept(slots.get("condition"))
            d["population"] = dict(concept(slots["population"]), families=pool.families_of(slots["population"])) if slots.get("population") in pool.entities else None
            d["claims"] = pool.claims_for(ent["id"])
            d["contested"] = any(c["edge"] == "contests" for c in d["claims"])
            d["direction"] = direction_of(d["claims"])
            d["body"] = {k: [dict(b, claim=c["recommendation_no"]) for c in d["claims"] for b in c.get("body", []) if b["kind"] == k] for k in BODY_TEXT}
            d["body"] = {k: v for k, v in d["body"].items() if v}
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
        groupings = groupings_of(view, members, pool)
        refs = {n["ref"] for g in groupings for n in g["nodes"] if n.get("ref")} | {e["ref"] for g in groupings for e in g["edges"] if e.get("ref")}
        sources = [members[s] for s in view["filter"]["sources"]]
        title = title_of(view, members)
        counts = {t: sum(1 for m in members.values() if m["type"] == t) for t in ("statement", "concept", "claim")}
        sec = view["filter"].get("section")   # a section view's chapter tree is that section and what lies beneath it
        outline = [{"source": s["id"], **e} for s in sources for e in s.get("outline") or []
                   if not sec or s["id"] != sec["source"] or under(str(sec["under"]), e.get("section"))]   # spec §6.7; a chapter is a filter, never a node
        data = {"id": view["id"], "title": title, "sources": [s["id"] for s in sources], "commit": commit, "outline": outline,
                "facets": sorted({f for g in groupings for n in g["nodes"] for f in n.get("facets", [])}), "groupings": groupings,
                "html": {r: detail_tpl.render(**details(pool.entities[r])) for r in sorted(refs) if r in pool.entities}}
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
