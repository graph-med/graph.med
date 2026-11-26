#!/usr/bin/env python3
"""One-shot conversion of the pool to an Open Knowledge Format v0.3 bundle (ADR-0011, card #438).

    uv run tools/migrate_to_okf.py            # convert data/ in place
    uv run tools/migrate_to_okf.py --check REV  # compare the converted pool with the YAML pool at REV

What it does, and nothing else:
  - a file of one entity, `data/<ns>/<id>.yaml`, becomes `data/<ns>/<id>.md`: its text unchanged between two
    lines `---` (comments included), renamed with `git mv`;
  - a file of claims, `data/claims/<source>/<part>.yaml`, becomes one file per claim, `data/claims/<source>/<hash>.md`:
    the claim's own lines, unchanged, with `order:` added — its place among the claims of its page, top to bottom,
    read from the order of the files and of the claims in them (#384);
  - a file of edges, `data/edges/<source>/<part>.yaml`, becomes one file per edge, `data/edges/<hash>.md`, the tuple
    written as a mapping: `id` (bundle.edge_id), `type: edge`, `from`, `kind`, `to`, then its properties in their order;
  - a comment block that stands before a claim or an edge goes with it, to the head of its frontmatter; a comment at
    the end of an edge's line stays at the end of its `to:` line; a file's header (the comments before its first
    entry) and its trailing comments go, under the file's name, to a README.md in the directory the entries now live
    in, which OKF reads as no concept (§3.2).
The check reads every entity and edge of REV's YAML files and of the converted files and reports any difference, claims
compared without `order`.
"""
from __future__ import annotations

import argparse
import io
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bundle import DATA, ROOT, as_tuple, edge_id, parse, read   # noqa: E402

ITEM = re.compile(r"^- ")


def chunks(text: str):
    """The entries of a YAML list file at column 0, each with the comment block before it:
    (header, [(comments, entry_lines)], trailing)."""
    lines = text.split("\n")
    header: list[str] = []
    entries: list[tuple[list[str], list[str]]] = []
    pending: list[str] = []
    current: list[str] | None = None
    for line in lines:
        if ITEM.match(line):
            if current is None and not entries:
                header, pending = split_header(pending)
            if current is not None:
                entries.append((cur_comments, current))
            cur_comments, current, pending = pending, [line], []
        elif line.startswith("#"):
            if current is not None:
                entries.append((cur_comments, current))
                current = None
            pending.append(line)
        elif line.strip() == "":
            if current is not None:
                entries.append((cur_comments, current))
                current = None
            elif pending:
                pending.append(line)
        else:
            assert current is not None, line
            current.append(line)
    if current is not None:
        entries.append((cur_comments, current))
    return strip(header), [(strip(c), e) for c, e in entries], strip(pending)


def split_header(block: list[str]) -> tuple[list[str], list[str]]:
    """The comments before a file's first entry: its header, and — where more than one paragraph stands there and
    the last touches the entry — that last paragraph, which is the entry's own."""
    paras: list[list[str]] = [[]]
    for line in block:
        if line.strip():
            paras[-1].append(line)
        elif paras[-1]:
            paras.append([])
    touches = bool(block) and block[-1].strip() != ""
    paras = [q for q in paras if q]
    if touches and len(paras) > 1:
        return [ln for q in paras[:-1] for ln in q + [""]], paras[-1]
    return block, []


def strip(block: list[str]) -> list[str]:
    while block and not block[0].strip():
        block = block[1:]
    while block and not block[-1].strip():
        block = block[:-1]
    return block


def dedent(entry: list[str]) -> list[str]:
    out = [entry[0][2:]]
    for line in entry[1:]:
        assert line.startswith("  ") or not line.strip(), line
        out.append(line[2:])
    return out


def page_of(claim: dict) -> int:
    m = re.search(r"#page=(\d+)", claim["source"]["at"])
    return int(m.group(1)) if m else 0


def frontmatter(body_lines: list[str]) -> str:
    return "---\n" + "\n".join(body_lines).rstrip("\n") + "\n---\n"


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def notes_section(name: str, header: list[str], trailing: list[str]) -> str:
    def plain(block):
        return "\n".join(re.sub(r"^# ?", "", ln) for ln in block)
    parts = [f"## `{name}`\n"]
    if header:
        parts.append(plain(header) + "\n")
    if trailing:
        parts.append("After its last entry:\n\n" + plain(trailing) + "\n")
    return "\n".join(parts)


NOTES_HEAD = """# {title}

The notes the former file of each part carried at its head, kept as they were when
the pool became an Open Knowledge Format bundle (ADR-0011, #438). Each entry now is a
file of its own, the comments that stood before it at the head of its frontmatter.
This file has no frontmatter, so OKF reads it as no concept.

"""


def convert() -> None:
    # one entity per file
    for ns in ("sources", "concepts", "statements", "views", "axes"):
        for path in sorted((DATA / ns).glob("*.yaml")):
            text = path.read_text(encoding="utf-8")
            assert not text.startswith("---"), path
            target = path.with_suffix(".md")
            git("mv", str(path.relative_to(ROOT)), str(target.relative_to(ROOT)))
            target.write_text(frontmatter(text.split("\n")), encoding="utf-8")
            assert parse(target.read_text(encoding="utf-8")) == yaml.safe_load(text), path

    # claims: one file each, `order` from the order of the files and of their entries
    next_order: dict[tuple[str, int], int] = defaultdict(int)
    for src_dir in sorted((DATA / "claims").iterdir()):
        notes = []
        for path in sorted(src_dir.glob("*.yaml")):
            text = path.read_text(encoding="utf-8")
            original = yaml.safe_load(text)
            header, entries, trailing = chunks(text)
            assert len(entries) == len(original), path
            for (comments, entry), claim in zip(entries, original):
                lines = dedent(entry)
                assert yaml.safe_load("\n".join(lines)) == claim, (path, claim["id"])
                key = (claim["source"]["at"].split("#")[0], page_of(claim))
                next_order[key] += 1
                i = next(n for n, ln in enumerate(lines) if ln == "type: claim")
                lines.insert(i + 1, f"order: {next_order[key]}")
                target = DATA / f"{claim['id']}.md"
                assert target.parent == src_dir and not target.exists(), target
                target.write_text(frontmatter(comments + lines), encoding="utf-8")
                assert parse(target.read_text(encoding="utf-8")) == {**claim, "order": next_order[key]}, target
            if header or trailing:
                notes.append(notes_section(path.stem, header, trailing))
            git("rm", "-q", str(path.relative_to(ROOT)))
        if notes:
            (src_dir / "README.md").write_text(NOTES_HEAD.format(title=f"Claims of sources/{src_dir.name}: notes of the former part files")
                                               + "\n".join(notes), encoding="utf-8")

    # edges: one file each in data/edges/, the tuple as a mapping
    notes = []
    written: set[str] = set()
    for src_dir in sorted(p for p in (DATA / "edges").iterdir() if p.is_dir()):
        for path in sorted(src_dir.glob("*.yaml")):
            text = path.read_text(encoding="utf-8")
            original = yaml.safe_load(text) or []
            header, entries, trailing = chunks(text)
            assert len(entries) == len(original), path
            for (comments, entry), edge in zip(entries, original):
                frm, kind, to = edge[0], edge[1], edge[2]
                props = edge[3] if len(edge) > 3 else {}
                eid = edge_id(frm, kind, to, props.get("discriminator"))
                assert eid not in written, (path, eid)
                written.add(eid)
                mapping = {"id": eid, "type": "edge", "from": frm, "kind": kind, "to": to, **props}
                buf = io.StringIO()
                yaml.safe_dump(mapping, buf, sort_keys=False, allow_unicode=True, width=120, default_flow_style=False)
                lines = buf.getvalue().rstrip("\n").split("\n")
                tail = re.search(r"\]\s+(#.*)$", entry[-1])
                if tail:   # a comment at the end of the entry's line stays at the end of its `to:` line
                    t = next(n for n, ln in enumerate(lines) if ln.startswith("to: "))
                    lines[t] += "   " + tail.group(1)
                target = DATA / f"{eid}.md"
                target.write_text(frontmatter(comments + lines), encoding="utf-8")
                assert as_tuple(read(target)) == (frm, kind, to, props), target
            if header or trailing:
                notes.append(notes_section(f"{src_dir.name}/{path.stem}", header, trailing))
            git("rm", "-q", str(path.relative_to(ROOT)))
    if notes:
        (DATA / "edges" / "README.md").write_text(NOTES_HEAD.format(title="Edges: notes of the former part files")
                                                  + "\n".join(notes), encoding="utf-8")
    print(f"converted: {len(written)} edges, {sum(next_order.values())} claims")


def check(rev: str) -> int:
    """Every entity and edge at REV equals its converted file, field by field."""
    old_entities: dict[str, dict] = {}
    old_edges: dict[str, tuple] = {}
    for rel in git("ls-tree", "-r", "--name-only", rev, "--", "data").split():
        if not rel.endswith(".yaml"):
            continue
        doc = yaml.safe_load(git("show", f"{rev}:{rel}"))
        if rel.startswith("data/edges/"):
            for e in doc or []:
                props = e[3] if len(e) > 3 else {}
                old_edges[edge_id(e[0], e[1], e[2], props.get("discriminator"))] = (e[0], e[1], e[2], props)
        else:
            for ent in (doc if isinstance(doc, list) else [doc]):
                old_entities[ent["id"]] = ent
    new_entities: dict[str, dict] = {}
    new_edges: dict[str, tuple] = {}
    for path in sorted(DATA.rglob("*.md")):
        if path.name in ("README.md", "index.md", "log.md"):
            continue
        ent = read(path)
        if ent.get("type") == "edge":
            new_edges[ent["id"]] = as_tuple(ent)
        else:
            new_entities[ent["id"]] = {k: v for k, v in ent.items() if not (ent.get("type") == "claim" and k == "order")}
    diffs = [f"entity {k}" for k in sorted(set(old_entities) | set(new_entities)) if old_entities.get(k) != new_entities.get(k)]
    diffs += [f"edge {k}" for k in sorted(set(old_edges) | set(new_edges)) if old_edges.get(k) != new_edges.get(k)]
    print(f"compared {len(old_entities)} entities and {len(old_edges)} edges at {rev} with "
          f"{len(new_entities)} entities and {len(new_edges)} edges converted: {len(diffs)} differ")
    for d in diffs[:20]:
        print("  " + d)
    return 1 if diffs else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", metavar="REV")
    a = ap.parse_args()
    sys.exit(check(a.check) if a.check else convert())
