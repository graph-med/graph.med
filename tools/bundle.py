#!/usr/bin/env python3
"""Read the pool's files: an Open Knowledge Format v0.3 bundle under data/ (ADR-0011).

Every entity — every claim and every edge included — is one Markdown file
`data/<namespace>/<entity-id>.md`; its YAML frontmatter is the entity, its body is
generated from the frontmatter and is never part of the entity (spec §2). This module
is the one reader of those files for the validator, the build and the axes tool:

  - `read(path)` returns the entity of a `.md` file, or the document of a `.yaml` file
    (the schema, an axis definition not yet committed);
  - the frontmatter is read as OKF §4 asks: the file starts with a line `---`, the
    block ends at the next line `---`, and it is one YAML mapping. Two keys alike in
    one mapping are refused, and so is a plain value that YAML 1.1 reads as a boolean
    (`yes`, `no`, `on`, `off`, `y`, `n`) where OKF's YAML 1.2 reads a string: such a
    value is quoted;
  - an edge is an entity of `type: edge`, `edge_id` derives its id from its tuple and
    `as_tuple` gives it as (from, kind, to, properties), the shape the tools reason in.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
EDGE_KEYS = ("id", "type", "from", "kind", "to")       # an edge's own keys; every other key is a property (spec §5)
YAML11_BOOLEANS = {"yes", "no", "on", "off", "y", "n"}


class FrontmatterError(ValueError):
    """A file whose frontmatter OKF §4 does not admit."""


class _StrictLoader(yaml.SafeLoader):
    """SafeLoader that refuses a key twice in one mapping and a plain YAML 1.1 boolean."""


def _construct_mapping(loader: _StrictLoader, node: yaml.MappingNode, deep: bool = False):
    seen: set = set()
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in seen:
            raise FrontmatterError(f"line {key_node.start_mark.line + 1}: the key {key!r} twice in one mapping")
        seen.add(key)
        if isinstance(value_node, yaml.ScalarNode) and value_node.style is None \
                and value_node.value.lower() in YAML11_BOOLEANS and value_node.value.lower() not in ("true", "false"):
            raise FrontmatterError(f"line {value_node.start_mark.line + 1}: {value_node.value!r} unquoted; "
                                   "YAML 1.1 reads it as a boolean, YAML 1.2 as a string — quote it")
    return loader.construct_mapping(node, deep=deep)


_StrictLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_mapping)


def split(text: str) -> tuple[str, str]:
    """The frontmatter and the body of a Markdown file's text (OKF §4)."""
    lines = text.split("\n")
    if not lines or lines[0].rstrip("\r") != "---":
        raise FrontmatterError("line 1: the file does not start with a line '---'")
    for i, line in enumerate(lines[1:], start=1):
        if line.rstrip("\r") == "---":
            return "\n".join(lines[1:i]) + "\n", "\n".join(lines[i + 1:])
    raise FrontmatterError("the frontmatter has no closing line '---'")


def parse(text: str):
    """The entity a Markdown file's text holds: its frontmatter, one mapping."""
    front, _ = split(text)
    doc = yaml.load(front, Loader=_StrictLoader)
    if not isinstance(doc, dict):
        raise FrontmatterError("the frontmatter is not a mapping")
    return doc


def read(path: Path):
    """The entity of a `.md` file, or the document of a `.yaml` file."""
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".md":
        return parse(text)
    return yaml.safe_load(text)


def entity_id(path: Path) -> str:
    """The id a file under data/ must carry: its path below data/ without `.md` (OKF's concept id)."""
    return path.relative_to(DATA).with_suffix("").as_posix()


def edge_id(frm: str, kind: str, to: str, discriminator: str | None = None) -> str:
    """An edge's id, derived from its tuple (spec §2, the identity cascade): edges/<first 8 hex of
    sha256("<from>|<kind>|<to>|<discriminator>")>, the discriminator empty where the edge has none."""
    digest = hashlib.sha256(f"{frm}|{kind}|{to}|{discriminator or ''}".encode("utf-8")).hexdigest()[:8]
    return f"edges/{digest}"


def as_tuple(edge: dict) -> tuple[str, str, str, dict]:
    """An edge entity as (from, kind, to, properties)."""
    return edge["from"], edge["kind"], edge["to"], {k: v for k, v in edge.items() if k not in EDGE_KEYS}
