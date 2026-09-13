#!/usr/bin/env python3
"""Screenshot a view page of the built site in a headless browser (the `screenshot` skill).

    uv run tools/screenshot.py pomgat-lv-1.0                       # the folded start, 1280×900
    uv run tools/screenshot.py pomgat-lv-1.0 --phone               # 390×844 at device scale 2
    uv run tools/screenshot.py pomgat-lv-1.0 --do toggle=concepts/leberresektion \\
        --do open=statements/drainage-komplexe-leberresektion-optional --out /tmp/graph.med/screenshots/liver.png

The sandbox has no browser and cannot download one, but it runs a Docker daemon and
image pulls pass the proxy: the page is rendered by Chromium inside a container
(zenika/alpine-chrome:with-puppeteer, which bundles Node and Puppeteer), driven by
tools/screenshot.js so that the layout can settle before the capture. The site is
built into a temporary directory with base path /site/ and copied into the container;
nothing is installed in the sandbox and nothing is mounted. Actions run in order
before the capture: by=<axis id> (choose the grouping, "" for the plain hierarchy),
toggle=<concept id> (fold or unfold that patient group; under an axis the junction id in full,
j:<value>:<concept id>),
fold=<question node id> (fold or unfold everything below that question, e.g.
q:j:concepts/leberresektion:population), open=<entity id> (deep link: unfold and select),
section=<number> (chapter filter), search=<text>, facet=<kind>, chapters (open the chapter
panel), chapters-scroll=<px> (scroll its list), all (every patient group open), fit (fit what is
open), reset (the opening state), wait=<ms>. The runner prints how many elements are shown and
how many pairs of nodes and answers overlap — the mechanical half of "nothing overlaps".
The container name and the output directory default to the current branch, so that
sessions working in parallel (one git worktree each, docs/work/README.md "Parallel
work") on the one Docker daemon do not remove each other's container or PNG.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGE = "zenika/alpine-chrome:with-puppeteer"
DRIVER = Path(__file__).resolve().parent / "screenshot.js"


def run(*cmd, **kw):
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kw)


def branch_slug() -> str:
    """The current branch as a name Docker and a path accept; 'main' when there is none."""
    try:
        name = run("git", "-C", str(ROOT), "rev-parse", "--abbrev-ref", "HEAD").stdout.strip() or "main"
    except (subprocess.CalledProcessError, FileNotFoundError):
        name = "main"
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", name).strip("-.") or "main"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("view", help="view id as on the site, e.g. pomgat-lv-1.0")
    ap.add_argument("--out", type=Path, default=None, help="PNG to write (default /tmp/graph.med/screenshots/<branch>/<view>.png)")
    ap.add_argument("--size", default="1280x900", help="viewport WxH (default 1280x900)")
    ap.add_argument("--phone", action="store_true", help="390x844 at device scale 2, touch")
    ap.add_argument("--do", action="append", default=[], metavar="ACTION", help="an action before the capture; repeatable, in order")
    ap.add_argument("--name", default=None, help="container name (default shot-<branch>)")
    ap.add_argument("--preview", type=int, default=None, metavar="N", help="build as the preview of pull request N (the strip above the header)")
    args = ap.parse_args(argv)

    if shutil.which("docker") is None:
        print("error: docker is not available; the screenshot skill needs the sandbox's Docker daemon", file=sys.stderr)
        return 1
    branch = branch_slug()
    out = args.out or Path("/tmp/graph.med/screenshots") / branch / f"{args.view}{'-phone' if args.phone else ''}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    args.name = args.name or f"shot-{branch}"
    width, height = (390, 844) if args.phone else map(int, args.size.lower().split("x"))
    spec = {"view": args.view, "width": width, "height": height, "phone": args.phone,
            "actions": [a.split("=", 1) if "=" in a else [a, ""] for a in args.do]}

    if not run("docker", "images", "-q", IMAGE).stdout.strip():
        print(f"pulling {IMAGE} (once per sandbox) …", file=sys.stderr)
        subprocess.run(["docker", "pull", "--quiet", IMAGE], check=True)

    with tempfile.TemporaryDirectory(prefix="graph.med-site-") as tmp:
        site = Path(tmp) / "site"
        build = [sys.executable, str(ROOT / "tools" / "build.py"), "--base", "/site/", "--out", str(site)]
        subprocess.run(build + (["--preview", str(args.preview)] if args.preview else []), check=True, capture_output=True)
        if not (site / args.view / "index.html").exists():
            print(f"error: no view {args.view!r} in the built site", file=sys.stderr)
            return 1
        subprocess.run(["docker", "rm", "-f", args.name], capture_output=True)
        run("docker", "create", "--name", args.name, "--entrypoint", "node", IMAGE, "/driver.js", json.dumps(spec))
        try:
            run("docker", "cp", str(site), f"{args.name}:/site")
            run("docker", "cp", str(DRIVER), f"{args.name}:/driver.js")
            started = subprocess.run(["docker", "start", "-a", args.name], text=True, capture_output=True)
            if started.returncode != 0:
                print(started.stdout + started.stderr, file=sys.stderr)
                return started.returncode
            run("docker", "cp", f"{args.name}:/tmp/shot.png", str(out))
        finally:
            subprocess.run(["docker", "rm", "-f", args.name], capture_output=True)
        info = started.stdout.strip()
    print(f"{out}  ({info})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
