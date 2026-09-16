---
name: screenshot-skill-needs-sbx-docker
description: The screenshot skill needs the sbx sandbox's own Docker daemon; a session running under a different harness has none, and starting one is refused.
metadata:
  type: project
---

The `screenshot` skill and `tools/screenshot.py` assume the `sbx` Docker Sandbox
described in `environment/sandbox-environment.md`: a Docker daemon running inside
the sandbox itself, with egress to Docker Hub through the proxy. A session invoked
through a different harness — for example Claude Code Remote / Claude Code on the
web, rather than `sbx` — has no such daemon: `docker info` cannot reach the socket,
and starting one is refused (`sudo service docker start` fails on a `ulimit`
permission that harness does not grant, not a missing package).

**Why:** the skill's own instructions say what to do when `docker` is missing —
report it, do not look for another browser — but that check is written for
`docker` being entirely absent. A harness where the `docker` CLI exists but the
daemon cannot start needs the same response: this is which environment invoked
the session, not something a retry, a different image, or a workaround fixes.

**How to apply:** before relying on the skill, run `docker info`; if it cannot
reach the daemon, do not try to install, start with elevated flags, or substitute
another browser. Report it, and verify what you can without one: `tools/build.py`
plus reading the emitted HTML for structural checks, and for a visual asset's own
legibility in isolation (not the graph's layout), rasterizing it directly — e.g.
`uv run --with cairosvg python3 -c "import cairosvg; ..."`, `cairosvg` installs
from PyPI without the daemon — is a partial substitute. It does not replace the
skill's overlap check on the drawn graph; say so, and ask a human to confirm
visually on the live preview before calling a `ui` package's browser check done.
