#!/usr/bin/env python3
"""Build the site under site/ from data/ and schema/schema.yaml (docs/publication.md).

    uv run tools/build.py                      # site/ for the domain (base path "/")
    uv run tools/build.py --base /graph.med/   # for graph-med.github.io/graph.med/
    uv run tools/build.py --cname graph.med    # also emit the CNAME file for Pages
    uv run tools/build.py --base /preview/pr12/ --preview 12   # the preview of pull request 12
    uv run tools/build.py --base /graph.med/ --origin https://graph-med.github.io   # a mirror under another host

Every view becomes <view-id>/index.html — one decision tree (which patient group? →
which condition? → recommendation → aim; answers on the edges; laid out left to right
in the browser by dagre) per grouping the view offers — the plain hierarchy, the
chapters of its sources, and each axis of its `group_by` (spec §4.1), chosen by a
switch on the page —, a chapter tree
that filters it and a search that fades it (both from the sources' outline and the
claims' sections, docs/publication.md §3), with a detail section beside or below it
— plus <view-id>.json; every entity becomes
<namespace>/<entity-id>/index.html and <namespace>/<entity-id>.json; the schema is
copied to schema/schema.yaml. Every page carries Open Graph and Twitter Card tags with
absolute URLs — the origin is https://<cname> when --cname is given, else the site's
domain, and --origin overrides both — and the one committed preview image
(tools/site/static/social-card.png, rendered from logo.svg). Offline, deterministic,
nothing authored.
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
SITE = "https://graph.med"   # the origin of the published site and its previews (docs/publication.md §6)

CLAIM_EDGES = ("supports", "contests")   # how a claim bears on a statement (spec §5)
STATEMENT_EDGES = ("specializes", "complements", "conflicts")
BODY_TEXT = ("limits", "refines", "supplements")   # zone 6 of the statement card, in order of their effect on the decision
DIRECTION_GLYPH = {"für": "✓", "gegen": "✗", "abwägen": "⚖", "Lücke": "∅"}
GRADES = ("A", "B", "0", "EK")   # the guideline's own scale, in order: the letter a box carries before its label; a new scale is a new letter
# An evidence system's values from high to low (docs/publication.md §3, zone 4), keyed by the `system` a claim's
# `evidence` entry names: read for the range a per-outcome table is summarised by ("hoch bis sehr niedrig") and for
# nothing else — never for a comparison, a threshold or a derived value, and a value is never mapped onto another
# system's. A system not in the table is a valid state that costs the range, never the build. A display order,
# not a fact about the world, which is why it lives here and not in the schema (WP-0025).
EVIDENCE_SCALES = {"grade": ("hoch", "moderat", "niedrig", "sehr niedrig")}
CARD_SLOTS = ("population", "condition", "action")   # the rows of zone 5 "Gilt für", in order; `outcome` is the dimension the certainty varies along (zone 4), not a row here
# The only words the build adds inside the graph, in the view's source language (docs/publication.md §3):
# the two questions whose answers are the population and condition slots, the question a dimension axis
# adds (its short label filled in), the chapter question and the switch's entries for the plain hierarchy
# and the chapters, and the one answer for what a grouping cannot place (spec §4.1 "4. Shown"). Keyed by
# structural key, never by an axis: the build knows no axis by name. Add a row per language; a view in a
# language without one fails the build rather than falling back to another language.
WORDS = {"de": {"population": "Welche Population?", "condition": "Welche Bedingung?", "section": "Welches Kapitel?",
                "axis": "Welche {label}?", "plain": "Population", "chapter": "Kapitel", "unplaced": "nicht zugeordnet"}}
CHAPTERS = "section"   # the URL token and grouping id of the built-in chapter grouping (`?by=section`)

# The words of the statement card (docs/publication.md §3 "What the section shows"), and of the detail
# sections of the other entities and the entity page (§4): every visible word of their chrome, in the
# entity's source language, keyed structurally — the zone, the slot, the grade and the consensus, the
# entity type, the concept's facet and the claim's kind by the schema's own enum values, so that a new
# value is a missing key and never a silent blank. The values are fixed by the maintainer (WP-0024).
# There is no fallback: a language that lacks any key of CARD_KEYS fails the build, naming the language
# and the keys (card_words()). A line that counts something
# is a pair, `<key>.one` and `<key>.many`, chosen by the count at render time (card_words(): word(key, count));
# the grammar sits in the pair, never in the code. The range line of zone 4 (`evidence.by_outcome`) has no
# pair: a range needs two values, so it never counts one (evidence_of()).
CARD_KEYS = ("zone.wording", "zone.evidence", "zone.applies", "zone.body_text", "zone.contested.one", "zone.contested.many",
             "zone.citation", "zone.more", "slot.population", "slot.condition", "slot.action", "slot.count",
             "cite.open", "cite.quote", "cite.review.pending", "cite.no", "cite.page", "cite.section",
             "grade.A", "grade.B", "grade.0", "grade.EK",
             "consensus.starker_konsens", "consensus.konsens", "consensus.mehrheitliche_zustimmung", "consensus.kein",
             "marker.contested", "body.limits", "body.refines", "body.supplements", "body.empty",
             "evidence.single", "evidence.by_outcome", "evidence.by_outcome.no_range.one", "evidence.by_outcome.no_range.many",
             "evidence.by_outcome.partial.one", "evidence.by_outcome.partial.many",
             "evidence.ek_only", "evidence.missing", "evidence.table.outcome", "evidence.table.certainty", "evidence.row.missing",
             # the detail sections of a concept, a claim and a source, and the entity page (docs/publication.md §3, §4)
             "type.concept", "type.claim", "type.source", "type.axis",
             "facet.procedure", "facet.patient_state", "facet.medication", "facet.intervention", "facet.outcome", "facet.finding", "facet.qualifier",
             "kind.recommendation", "kind.criterion", "kind.definition", "kind.fact", "kind.gap_notice",
             "slot.outcome", "concept.uses", "concept.codes", "claim.statements", "edge.supports", "edge.contests",
             "source.claims.one", "source.claims.many", "page.json")
CARD_WORDS = {"de": {
    "zone.wording": "Wortlaut der Empfehlung", "zone.evidence": "Evidenz", "zone.applies": "Gilt für",
    "zone.body_text": "Aus dem Leitlinientext", "zone.contested.one": "Widersprechende Empfehlung",
    "zone.contested.many": "Widersprechende Empfehlungen", "zone.citation": "Beleg", "zone.more": "Mehr zu dieser Aussage",
    "slot.population": "Eingriff", "slot.condition": "Bedingung", "slot.action": "Maßnahme", "slot.count": "({n} Empfehlungen)",
    "cite.open": "In der Leitlinie öffnen", "cite.quote": "Suchtext kopieren", "cite.review.pending": "Klinische Begutachtung: ausstehend",
    "cite.no": "Empf. {nr}", "cite.page": "S. {nr}", "cite.section": "Abschnitt {nr}",
    "grade.A": "Grad A", "grade.B": "Grad B", "grade.0": "Grad 0", "grade.EK": "Expertenkonsens",
    "consensus.starker_konsens": "starker Konsens", "consensus.konsens": "Konsens",
    "consensus.mehrheitliche_zustimmung": "mehrheitliche Zustimmung", "consensus.kein": "kein Konsens",
    "marker.contested": "⚠ umstritten", "body.limits": "Grenzt ein", "body.refines": "Präzisiert", "body.supplements": "Ergänzt",
    "body.empty": "Für diese Aussage sind keine Textstellen aus dem Leitlinientext erfasst.",
    "evidence.single": "Evidenz: {wert} ({system})", "evidence.by_outcome": "Evidenz: endpunktabhängig ({n} Endpunkte, {von} bis {bis})",
    "evidence.by_outcome.no_range.one": "Evidenz: endpunktabhängig ({n} Endpunkt)",
    "evidence.by_outcome.no_range.many": "Evidenz: endpunktabhängig ({n} Endpunkte)",
    "evidence.by_outcome.partial.one": "Evidenz: endpunktabhängig ({k} von {n} Endpunkt erfasst)",
    "evidence.by_outcome.partial.many": "Evidenz: endpunktabhängig ({k} von {n} Endpunkten erfasst)",
    "evidence.ek_only": "Expertenkonsens, keine Evidenzbewertung", "evidence.missing": "Evidenz: nicht erfasst",
    "evidence.table.outcome": "Endpunkt", "evidence.table.certainty": "Sicherheit", "evidence.row.missing": "nicht erfasst",
    "type.concept": "Begriff", "type.claim": "Textstelle", "type.source": "Quelle", "type.axis": "Achse",
    "facet.procedure": "Eingriff", "facet.patient_state": "Patientenzustand", "facet.medication": "Medikament",
    "facet.intervention": "Intervention", "facet.outcome": "Endpunkt", "facet.finding": "Befund", "facet.qualifier": "Qualifikator",
    "kind.recommendation": "Empfehlung", "kind.criterion": "Kriterium", "kind.definition": "Definition", "kind.fact": "Feststellung",
    "kind.gap_notice": "Lücke",
    "slot.outcome": "Endpunkt", "concept.uses": "Verwendet in", "concept.codes": "Kodiert als", "claim.statements": "Bezieht sich auf",
    "edge.supports": "stützt", "edge.contests": "widerspricht",
    "source.claims.one": "{n} Textstelle erfasst", "source.claims.many": "{n} Textstellen erfasst", "page.json": "JSON",
}}
# The five questions a physician brings to a recommendation, kept as the semantic mapping of the card's keys
# — what each zone answers, read by an answering layer from the statement's JSON — and never rendered
# (docs/publication.md §3 "The card").
CARD_QUESTIONS = {"urteil": "Was soll ich tun, und wie verbindlich ist das?", "wortlaut": "Was steht genau in der Leitlinie?",
                  "evidenz": "Wie gut ist das belegt?", "geltung": "Gilt das für meine Patientin oder meinen Patienten?",
                  "leitlinientext": "Was ändert oder ergänzt der umgebende Leitlinientext?", "widerspruch": "Gibt es eine gegenläufige Empfehlung?",
                  "beleg": "Wo steht es, und wie prüfe ich es nach?"}


def card_words(lang: str):
    """The card's words for one language, or the build stops naming the language and every missing key —
    nothing falls back to another language. The function returned resolves one key and stops the same
    way on a key outside CARD_KEYS (an enum value the table does not know), so a template never renders
    a blank where a word should be. With `count`, the key names a counting line and resolves to its
    `<key>.one` form for exactly one and `<key>.many` otherwise — the pair the table holds for it, both keys
    in CARD_KEYS, so that no language has the plural without the singular."""
    have = CARD_WORDS.get(lang, {})
    missing = [k for k in CARD_KEYS if k not in have]
    if missing:
        raise SystemExit(f"no card words for language {lang!r}: missing {', '.join(missing)} — add them to CARD_WORDS in tools/build.py")
    def word(key: str, count: int | None = None) -> str:
        if count is not None:
            key = f"{key}.{'one' if count == 1 else 'many'}"
        if key not in have:
            raise SystemExit(f"no card word {key!r} for language {lang!r} — add it to CARD_KEYS and CARD_WORDS in tools/build.py")
        return have[key]
    return word


def badges_of(claims: list[dict]) -> list[dict]:
    """Line 2 of the judgement (docs/publication.md §3, zone 2): one badge per supporting claim, in the order
    of the claims — the order zone 8 lists them in, which is the only thing tying a badge to its citation —
    each its grade and consensus as the claim states them; identical pairs collapse into one badge with a
    count. Shown, never composed into one value. A claim stating neither has no badge."""
    rows: list[dict] = []
    for c in claims:
        if c["edge"] != "supports" or not (c.get("grade") or c.get("consensus")):
            continue
        for r in rows:
            if (r["grade"], r["consensus"]) == (c.get("grade"), c.get("consensus")):
                r["count"] += 1
                break
        else:
            rows.append({"grade": c.get("grade"), "consensus": c.get("consensus"), "count": 1})
    return rows


def contests_of(claims: list[dict]) -> list[dict]:
    """Zone 7 of the card: the claims that contest the statement, each with its own badge by zone 2's rules,
    its wording and its own citation. Its existence is what the ⚠ marker in the judgement announces."""
    return [{"id": c["id"], "label": c["label"], "lang": c["lang"], "badge": {"grade": c.get("grade"), "consensus": c.get("consensus")},
             "recommendation_no": c.get("recommendation_no"), "page": c["page"], "section": c.get("section"), "link": c["link"], "quote": c["quote"]}
            for c in claims if c["edge"] == "contests"]


def direction_of(claims: list[dict]) -> dict | None:
    """The four-word direction of a statement, derived from its supporting claims (docs/publication.md §3):
    soll/sollte for → für, soll/sollte against → gegen, kann → abwägen (the guideline's own open
    recommendation), a gap notice → Lücke. Facts have no direction; claims that disagree give abwägen.
    With the word come the verbs as the claims say them — "soll nicht" for an against claim, as the
    sentence reads —, the badges of the judgement's second line (badges_of), and `umstritten`: whether a
    contesting claim exists, which the judgement marks so that a reader who stops there does not leave
    with a one-sided answer."""
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
    verbs = sorted({c["verb"] + (" nicht" if c.get("direction") == "against" else "") for c in sup if c.get("verb")})
    if word == "abwägen" and len({c.get("direction") for c in sup if c.get("direction")}) == 1:
        verbs.append("eher gegen" if sup[0].get("direction") == "against" else "eher für")   # the lean of an open recommendation
    return {"word": word, "glyph": DIRECTION_GLYPH[word], "verbs": verbs, "badges": badges_of(claims),
            "umstritten": any(c["edge"] == "contests" for c in claims)}


def evidence_of(claims: list[dict], concept) -> dict:
    """Zone 4 of the statement card (docs/publication.md §3): how certain the evidence is, from the supporting
    claims' `evidence` entries (schema 0.6.0), in one of four states and no fifth — `single` (one entry, no
    outcome: one value for the whole recommendation), `by_outcome` (anything else with entries: one group per
    system, its rows the entries in the claims' order, never sorted — sorting by certainty would rank what the
    guideline did not), `ek_only` (no entry, and every supporting claim `grade: EK`), `missing` (no entry).
    Nothing is composed: no value is derived from several. A group counts its rows (`n`) and those with a value
    (`k`), and carries a range — the highest and the lowest value present, by EVIDENCE_SCALES' order — only where
    every row has a value, the system is in that table, every value is on its scale and more than one value
    occurs; no order is guessed, and a partial table is summarised by its count alone.
    `concept` resolves an outcome id to {id, label, lang}."""
    sup = [c for c in claims if c["edge"] == "supports"]
    entries = [(c, e) for c in sup for e in c.get("evidence") or []]
    if not entries:
        return {"state": "ek_only" if sup and all(c.get("grade") == "EK" for c in sup) else "missing", "groups": []}
    groups: list[dict] = []
    for c, e in entries:
        g = next((g for g in groups if g["system"] == e["system"]), None)
        if g is None:
            g = {"system": e["system"], "rows": []}
            groups.append(g)
        g["rows"].append({"outcome": concept(e["outcome"]) if e.get("outcome") else None, "value": e.get("value") or None, "lang": c["lang"]})
    for g in groups:
        values = [r["value"] for r in g["rows"] if r["value"]]
        g["n"], g["k"], g["range"] = len(g["rows"]), len(values), None
        scale = EVIDENCE_SCALES.get(g["system"])
        if scale and g["k"] == g["n"] and all(v in scale for v in values) and len(set(values)) > 1:
            ranked = sorted(set(values), key=scale.index)
            g["range"] = {"von": ranked[0], "bis": ranked[-1]}
    single = len(entries) == 1 and groups[0]["rows"][0]["outcome"] is None
    return {"state": "single" if single else "by_outcome", "groups": groups}


def verb_of(claims: list[dict]) -> str | None:
    """The one verb of a statement's supporting claims (soll, sollte, kann), derived the way direction_of()
    derives the direction: from the `supports` edges only, and never composed — supporting claims that
    disagree on the verb give none, the way claims that disagree on the grade give no single letter
    (docs/publication.md §3, "Grades are shown, never composed")."""
    verbs = {c["verb"] for c in claims if c["edge"] == "supports" and c.get("verb")}
    return next(iter(verbs)) if len(verbs) == 1 else None


# ── the pool ────────────────────────────────────────────────────────────────

def load(path: Path):
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def fillers(st: dict, slot: str) -> list[str]:
    """The concepts a statement holds in one slot, in order: every entry of a slot the schema makes a
    list (`condition`, the conditions that hold at once, spec §3.2), the one concept of any other, none
    when the slot is empty. Whatever reads a slot's concepts reads them through this — one code path."""
    value = (st.get("slots") or {}).get(slot)
    return list(value) if isinstance(value, list) else [value] if value else []


def filled(st: dict) -> list[tuple[str, str]]:
    """Every (slot, concept) of a statement, a list slot entry by entry: the four slots and any a
    dimension axis adds (spec §4.1)."""
    return [(slot, cid) for slot in (st.get("slots") or {}) for cid in fillers(st, slot)]


def the_one(st: dict, slot: str) -> str | None:
    """The one concept of a slot, where the site shows one — the tree's answer to the condition question,
    a row of the card. How several conditions are shown is not designed yet (docs/publication.md §3
    draws one answer per statement), so the build stops at a statement with several rather than show one of them and drop the rest."""
    cids = fillers(st, slot)
    if len(cids) > 1:
        raise SystemExit(f"{st['id']}: {len(cids)} concepts in `{slot}`; the card and the tree show one, several are not built yet")
    return cids[0] if cids else None


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
        # how many statements hold a concept in a slot role, (slot, concept) → n: zone 5 of the card links a
        # concept that carries more than the one statement and names the count (docs/publication.md §3)
        self.slot_uses: dict[tuple[str, str], int] = defaultdict(int)
        for st in self.of_type("statement"):
            for slot, cid in filled(st):
                self.slot_uses[(slot, cid)] += 1

    def of_type(self, t: str):
        return [e for e in self.entities.values() if e.get("type") == t]

    def source_of(self, claim: dict) -> str:
        return claim["source"]["at"].split("#", 1)[0]

    def claims_for(self, statement_id: str) -> list[dict]:
        """Claims linked to a statement by supports/contests, with the edge kind."""
        rows = []
        for kind, frm, _ in self.inc.get(statement_id, []):
            if kind in CLAIM_EDGES and frm in self.entities:
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
        row = {k: claim.get(k) for k in ("id", "kind", "recommendation_no", "section", "label", "grade", "verb", "direction", "consensus", "evidence", "lang")}
        row.update({"quote": claim["source"]["quote"], "page": page, "source": src_id, "source_title": src.get("title"), "source_lang": src.get("lang"), "link": link})
        for kind, frm, _ in self.inc.get(claim["id"], []):   # what the body text adds to this claim (spec §5)
            if kind in BODY_TEXT and frm in self.entities:
                b = self.entities[frm]
                frag = b["source"]["at"].partition("#")[2]
                row.setdefault("body", []).append({"kind": kind, "id": frm, "label": b["label"], "quote": b["source"]["quote"], "lang": b["lang"],
                                                   "page": frag.split("=", 1)[1] if frag.startswith("page=") else None, "section": b.get("section"),
                                                   "link": source_link(src.get("url", ""), frag.split("=", 1)[1] if frag.startswith("page=") else None, b["source"]["quote"])})
        for kind, to, _ in self.out.get(claim["id"], []):
            if kind in CLAIM_EDGES:
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
            for slot, cid in filled(st):
                if cid == concept_id:
                    rows.append({"id": st["id"], "label": st["label"], "lang": st["lang"], "slot": slot})
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
                if kind in CLAIM_EDGES and to in pool.entities:
                    members[to] = pool.entities[to]
    for ent in list(members.values()):
        if ent.get("type") == "statement":
            for _, cid in filled(ent):
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
                 "statements": [st for st in statements if v in fillers(st, slot)]} for v in axis["values"]]

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
        cond, outc = the_one(st, "condition"), sl.get("outcome")
        d = direction_of(claims)
        again = st["id"] in seen   # under two answers (two chapters): one node, hung from both, its aim and relations once
        # the box reads "A · <short label>": the grade as a letter (every grade when the claims differ — shown,
        # never composed), then the short form; no direction glyph — the direction is the box's colour, the glyph
        # lives in the details' banner and the legend (docs/publication.md §3). The verb (soll, sollte) travels as
        # its own attribute: the client draws a border for `soll`, none for `sollte`
        letters = "/".join(sorted(grades, key=lambda g: (GRADES.index(g) if g in GRADES else len(GRADES), g)))
        sid = add(st["id"], ref=st["id"], type="statement", lang=st["lang"],
                  label=(letters + " · " if letters else "") + (st.get("short_label") or st["label"]), full=st["label"],
                  direction=d["word"] if d else None, verb=verb_of(claims), facets=sorted({f for f in (facet(c) for _, c in filled(st)) if f}),
                  grade=next(iter(grades)) if len(grades) == 1 else ("mixed" if grades else None),
                  against={c["direction"] for c in claims if c["edge"] == "supports" and c.get("direction")} == {"against"},
                  contested=any(c["edge"] == "contests" for c in claims),
                  no=min((c["recommendation_no"] for c in claims if c.get("recommendation_no")), default=None),
                  sections=sorted({c["section"] for c in claims if c.get("section")}, key=natural),
                  # what the search matches: the statement, its short form, its slot concepts (label and short
                  # label), its claims' sentences and quotes (docs/publication.md §3)
                  text=" ".join(filter(None, [st["label"], st.get("short_label")] + [text_of(c) for _, c in filled(st) if c in members]
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
    ap.add_argument("--origin", default=None, metavar="URL",
                    help="scheme and host of the absolute URLs in the share tags (default: https://<cname>, else the site's domain)")
    args = ap.parse_args(argv)
    base = args.base if args.base.endswith("/") else args.base + "/"
    origin = (args.origin or (f"https://{args.cname}" if args.cname else SITE)).rstrip("/")

    schema = load(SCHEMA)
    pool = Pool(schema)
    commit = git_commit()
    env = Environment(loader=FileSystemLoader(SITE_SRC / "templates"), autoescape=select_autoescape(["html"]),
                      trim_blocks=True, lstrip_blocks=True)
    env.globals.update(base=base, origin=origin, commit=commit, built=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
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
    if base == "/":   # the domain root only (docs/publication.md §6): clients that ask /favicon.ico instead of reading <link>
        shutil.copy(SITE_SRC / "static" / "favicon.ico", out / "favicon.ico")

    dimension_axes = {a["slot"]: a for a in pool.of_type("axis") if a.get("carrier") == "dimension"}   # a slot an axis adds, by its key (spec §4.1)

    def details(ent: dict) -> dict:
        """What the sheet and the entity page show for one entity (docs/publication.md §3, §4). Every word
        of the chrome is W(key) from CARD_WORDS in the entity's own language; an entity without `lang`
        has no language to show its page in, so the build stops there rather than falling back."""
        d = {"entity": ent}
        t = ent["type"]
        if not ent.get("lang"):
            raise SystemExit(f"{ent['id']}: no `lang` — the words of its page need one (tools/build.py, CARD_WORDS)")
        W = d["W"] = card_words(ent["lang"])
        if t == "statement":
            d["card"] = card_of(ent)
        elif t == "concept":
            # the statements that hold the concept, each under the name of its slot: the card's own word for
            # the card's slots, the axis's short label for a slot a dimension axis adds — never a slot key
            slot_name = lambda slot: (dimension_axes[slot].get("short_label") or dimension_axes[slot]["label"]) \
                if slot not in CARD_SLOTS + ("outcome",) and slot in dimension_axes else W("slot." + slot)
            order = list(CARD_SLOTS) + ["outcome"] + sorted(dimension_axes)   # grouped by slot, the card's slots first, ids within
            d["uses"] = sorted(({**u, "slot_label": slot_name(u["slot"])} for u in pool.uses_of(ent["id"])),
                               key=lambda u: (order.index(u["slot"]) if u["slot"] in order else len(order), u["id"]))
            d["codes"] = [to for k, to, _ in pool.out.get(ent["id"], []) if k == "codes_as"]
        elif t == "claim":
            d["claim"] = pool.claim_view(ent)
            j = direction_of([{"edge": "supports", **d["claim"]}])   # the claim's own judgement, in the card's four words (zone 2)
            d["claim"]["urteil"] = {"direction": j["word"], "glyph": j["glyph"], "verbs": j["verbs"]} if j else None
        elif t == "source":
            d["claim_count"] = sum(1 for c in pool.of_type("claim") if pool.source_of(c) == ent["id"])
        return d

    def card_of(st: dict) -> dict:
        """The statement card (docs/publication.md §3 "What the section shows"), assembled once: the template
        renders it and the statement's JSON carries it, under the keys the five questions map to (CARD_QUESTIONS)
        — `urteil` (zone 2), `wortlaut` (3), `evidenz` (4), `geltung` (5), `leitlinientext` (6), `widerspruch` (7),
        `beleg` (8) — with the title (zone 1) and the modelling data of zone 9 (`mehr`). Every value comes from the
        claims, the slots, the edges and the source; the build adds only the words of CARD_WORDS, at render time."""
        slots = st.get("slots") or {}
        claims = pool.claims_for(st["id"])
        # The supporting claims in one order for zones 2, 3 and 8 — the badges' order is zone 8's order (§3):
        # grouped by source, sources by their first supporting claim, claims as claims_for() sorts them.
        first = {}
        for c in claims:
            if c["edge"] == "supports":
                first.setdefault(c["source"], len(first))
        sup = sorted((c for c in claims if c["edge"] == "supports"), key=lambda c: first[c["source"]])
        claims = sup + [c for c in claims if c["edge"] != "supports"]
        d = direction_of(claims)
        concept = lambda cid: {"id": cid, "label": pool.entities[cid]["label"], "lang": pool.entities[cid]["lang"]} if cid in pool.entities \
            else {"id": cid, "label": cid, "lang": st["lang"]}   # a reference outside the pool (a terminology not imported) shows as its id

        def slot_row(role):
            """A row of zone 5: plain when the concept carries only this statement in that role, linked with the
            count (this statement included) when it carries more; the population keeps its families below it."""
            cid = the_one(st, role)
            if cid not in pool.entities:
                return None
            n = pool.slot_uses[(role, cid)]
            row = {**concept(cid), "count": n, "linked": n > 1}
            if role == "population":
                row["families"] = [{**f, "lang": pool.entities[f["id"]]["lang"]} for f in pool.families_of(cid)]
            return row

        passage = lambda b: {k: b.get(k) for k in ("id", "label", "lang", "page", "section", "link", "quote")}
        geltung = {role: slot_row(role) for role in CARD_SLOTS}
        cited = []   # zone 8: each source named once, its supporting claims' entries under it, in `sup`'s order
        for c in sup:
            if not cited or cited[-1]["id"] != c["source"]:
                cited.append({"id": c["source"], "title": c["source_title"], "lang": c["source_lang"], "claims": []})
            cited[-1]["claims"].append({k: c.get(k) for k in ("id", "recommendation_no", "page", "section", "link", "quote", "lang")})
        related = [{"edge": k, "to": to, "label": pool.entities[to]["label"]} for k, to, _ in pool.out.get(st["id"], []) if k in STATEMENT_EDGES and to in pool.entities] \
                + [{"edge": k, "from": frm, "label": pool.entities[frm]["label"]} for k, frm, _ in pool.inc.get(st["id"], []) if k in STATEMENT_EDGES and frm in pool.entities]
        return {
            "lang": st["lang"], "questions": CARD_QUESTIONS,
            "title": st.get("short_label") or st["label"], "label": st["label"],
            "urteil": {"direction": d["word"] if d else None, "glyph": d["glyph"] if d else None, "verbs": d["verbs"] if d else [],
                       "badges": d["badges"] if d else badges_of(claims), "umstritten": d["umstritten"] if d else any(c["edge"] == "contests" for c in claims)},
            "wortlaut": [{"id": c["id"], "label": c["label"], "lang": c["lang"]} for c in sup],
            "evidenz": evidence_of(claims, concept),
            "geltung": geltung if any(geltung.values()) else None,
            "leitlinientext": {k: [passage(b) for c in claims for b in c.get("body", []) if b["kind"] == k] for k in BODY_TEXT},
            "widerspruch": contests_of(claims),
            "beleg": {"sources": cited, "review": "pending"},   # the pool has no attestation yet; what a present one reads is a maintainer decision (WP-0024, open questions)
            "mehr": {"id": st["id"], "slots": {slot: concept(the_one(st, slot)) for slot in slots},
                     "related": related, "claims": [{"edge": c["edge"], "id": c["id"]} for c in claims], "source": st.get("source")},
        }

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
        (out / (eid + ".json")).write_text(dumps({**ent, "edges": edges_json(eid), **({"card": d["card"]} if "card" in d else {})}), encoding="utf-8")

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
