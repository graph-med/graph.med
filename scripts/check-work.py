#!/usr/bin/env python3
"""Check the frozen work-package registry (docs/work/README.md; ADR-0004). Exit 1 on any error.

    uv run scripts/check-work.py

Since 2026-09-19 work is registered on the board (the `project-board` skill), not under
docs/work/: every package file outside done/ is `status: migrated` with the number of
its card, and no new package may be added — a status other than migrated there is an
error pointing at the board. The files, the log and the handoff stay as history and are
still checked for shape. Fails loudly on: a duplicate or missing id, an id not matching its file name,
depends_on / blocks pointing at a package that does not exist or not mirroring
each other, a package in done/ whose status is not done (or a done package
outside done/), a claimed package whose `updated` is older than 7 days, a
LOG.md past 200 lines, docs/HANDOFF.md older than the newest LOG.md entry or
referencing a package id that does not exist, an unknown status, kind or
initiative, an extraction package without a source entity and pages, and a
package missing a required section. tools/validate.py runs this too, so CI
covers it on every pull request.
"""

from __future__ import annotations

import re
import sys
from datetime import date, timedelta
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
WORK, DONE = ROOT / "docs" / "work", ROOT / "docs" / "work" / "done"
HANDOFF, LOG = ROOT / "docs" / "HANDOFF.md", ROOT / "docs" / "LOG.md"
STATUSES = ("open", "claimed", "blocked", "review", "done", "migrated")
KINDS = ("extraction", "linking", "schema", "build", "docs", "tooling")
KEYS = {"id", "title", "status", "created", "updated", "depends_on", "blocks", "owner", "initiative", "kind", "slug", "source", "pages", "card"}
SECTIONS = ("Outcome", "Scope", "Constraints", "Decisions", "Open questions", "Verification")
STALE_CLAIM = timedelta(days=7)
LOG_LIMIT = 200


def frontmatter(path: Path) -> tuple[dict | None, str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n") or (end := text.find("\n---\n", 4)) < 0:
        return None, text
    try:
        return yaml.safe_load(text[4:end]) or {}, text[end + 5:]
    except yaml.YAMLError as exc:
        return {"_yaml_error": str(exc).splitlines()[0]}, text[end + 5:]


def as_date(v) -> date | None:
    if isinstance(v, date):
        return v
    try:
        return date.fromisoformat(str(v))
    except ValueError:
        return None


def check(today: date | None = None) -> list[str]:
    today = today or date.today()
    errs: list[str] = []
    if not WORK.is_dir():
        return errs
    rel = lambda p: str(p.relative_to(ROOT))
    initiatives = {p.stem for p in (WORK / "initiatives").glob("*.md")} if (WORK / "initiatives").is_dir() else set()
    sources = {f"sources/{p.stem}" for p in (ROOT / "data" / "sources").glob("*.yaml")}

    pkgs: dict[str, tuple[Path, dict]] = {}
    for folder, archived in ((WORK, False), (DONE, True)):
        for path in sorted(folder.glob("WP-*.md")) if folder.is_dir() else []:
            fm, body = frontmatter(path)
            if fm is None:
                errs.append(f"{rel(path)}: no frontmatter"); continue
            if "_yaml_error" in fm:
                errs.append(f"{rel(path)}: frontmatter is not valid YAML ({fm['_yaml_error']}) — quote a value that contains ': '"); continue
            pid = fm.get("id")
            m = re.fullmatch(r"(WP-\d{4})-([a-z0-9]+(?:-[a-z0-9]+)*)", path.stem)
            if not m:
                errs.append(f"{rel(path)}: file name must be WP-NNNN-<kebab-slug>.md"); continue
            if not pid:
                errs.append(f"{rel(path)}: missing id")
            elif pid != m.group(1):
                errs.append(f"{rel(path)}: id {pid!r} does not match the file name")
            if pid in pkgs:
                errs.append(f"{rel(path)}: duplicate id {pid} (also {rel(pkgs[pid][0])})")
            if fm.get("slug") != m.group(2):
                errs.append(f"{rel(path)}: slug must equal the file name after its id")
            if set(fm) - KEYS:
                errs.append(f"{rel(path)}: unknown keys {sorted(set(fm) - KEYS)}")
            for k in ("title", "created", "updated", "owner"):
                if not fm.get(k):
                    errs.append(f"{rel(path)}: missing {k}")
            st = fm.get("status")
            if st not in STATUSES:
                errs.append(f"{rel(path)}: status must be one of {', '.join(STATUSES)}")
            if archived and st != "done":
                errs.append(f"{rel(path)}: in done/ but status is {st!r}")
            if not archived and st == "done":
                errs.append(f"{rel(path)}: status done but not in done/ — git mv it")
            if not archived and st in STATUSES and st not in ("done", "migrated"):
                errs.append(f"{rel(path)}: status {st!r} — the registry is frozen; work is registered on the board (tools/board.py), not here")
            if st == "migrated" and not (isinstance(fm.get("card"), int) and fm["card"] > 0):
                errs.append(f"{rel(path)}: a migrated package names its card (`card: <issue number>`)")
            if st != "migrated" and fm.get("card") is not None:
                errs.append(f"{rel(path)}: only a migrated package names a card")
            if fm.get("kind") not in KINDS:
                errs.append(f"{rel(path)}: kind must be one of {', '.join(KINDS)}")
            if fm.get("initiative") not in initiatives:
                errs.append(f"{rel(path)}: initiative {fm.get('initiative')!r} has no file under docs/work/initiatives/")
            for k in ("created", "updated"):
                if fm.get(k) and as_date(fm[k]) is None:
                    errs.append(f"{rel(path)}: {k} is not an ISO date")
            if st == "claimed" and (u := as_date(fm.get("updated"))) and today - u > STALE_CLAIM:
                errs.append(f"{rel(path)}: claimed but not updated since {u} — stale claim (more than {STALE_CLAIM.days} days)")
            if fm.get("kind") == "extraction":
                if fm.get("source") not in sources:
                    errs.append(f"{rel(path)}: an extraction package names a source entity under data/sources/")
                if not re.fullmatch(r"\d+(-\d+)?", str(fm.get("pages", ""))):
                    errs.append(f"{rel(path)}: an extraction package names its pages (N or N-M)")
            elif fm.get("source") or fm.get("pages"):
                errs.append(f"{rel(path)}: only an extraction package names a source and pages")
            headings = {h.strip() for h in re.findall(r"^## (.+)$", body, re.M)}
            for sec in SECTIONS:
                if sec not in headings and not (archived and sec == "Open questions"):
                    errs.append(f"{rel(path)}: missing section '## {sec}'")
            if pid:
                pkgs[pid] = (path, fm)

    for pid, (path, fm) in pkgs.items():
        for d in fm.get("depends_on") or []:
            if d not in pkgs:
                errs.append(f"{rel(path)}: depends_on {d}, which does not exist")
            elif pid not in (pkgs[d][1].get("blocks") or []):
                errs.append(f"{rel(path)}: depends_on {d}, but {d} does not list it under blocks")
        for b in fm.get("blocks") or []:
            if b not in pkgs:
                errs.append(f"{rel(path)}: blocks {b}, which does not exist")
            elif pid not in (pkgs[b][1].get("depends_on") or []):
                errs.append(f"{rel(path)}: blocks {b}, but {b} does not list it under depends_on")

    newest_log = None
    if LOG.exists():
        lines = LOG.read_text(encoding="utf-8").splitlines()
        if len(lines) > LOG_LIMIT:
            errs.append(f"docs/LOG.md: {len(lines)} lines, over {LOG_LIMIT} — move older entries to docs/LOG-ARCHIVE.md")
        dates = [as_date(m.group(1)) for m in re.finditer(r"^## (\d{4}-\d{2}-\d{2})", "\n".join(lines), re.M)]
        dates = [d for d in dates if d]
        if dates:
            newest_log = max(dates)
            if dates != sorted(dates, reverse=True):
                errs.append("docs/LOG.md: entries must be newest first")
    if HANDOFF.exists():
        fm, body = frontmatter(HANDOFF)
        if fm and "_yaml_error" in fm:
            errs.append(f"docs/HANDOFF.md: frontmatter is not valid YAML ({fm['_yaml_error']})")
        updated = as_date((fm or {}).get("updated"))
        if updated is None:
            errs.append("docs/HANDOFF.md: frontmatter needs `updated: YYYY-MM-DD`")
        elif newest_log and updated < newest_log:
            errs.append(f"docs/HANDOFF.md: updated {updated}, older than the newest LOG.md entry {newest_log} — rewrite it")
        if len(body.splitlines()) > 60:
            errs.append("docs/HANDOFF.md: over 60 lines — it is a brief, not a document")
        for ref in set(re.findall(r"WP-\d{4}", body)):
            if ref not in pkgs:
                errs.append(f"docs/HANDOFF.md: references {ref}, which does not exist")
    elif pkgs:
        errs.append("docs/HANDOFF.md is missing")
    return errs


def main() -> int:
    errs = check()
    for e in errs:
        print(f"error: {e}")
    print(f"{len(errs)} error(s)" if errs else "work packages ok")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
