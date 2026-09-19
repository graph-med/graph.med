---
description: Where the agent is running — sandbox mounts, egress, persistence, and the mechanics that follow from them.
---

# The sandbox you run in

You are running inside a Docker Sandbox (`sbx`) — a microVM with its own kernel, its
own network namespace, and a host-side proxy for all outbound traffic. These are
properties of the host, not rules you comply with: ignoring them produces failures,
not violations.

- **Only the workspace directory is mounted.** Nothing else of the host filesystem
  exists from your point of view. Paths outside the repo will not resolve.
- **Egress is deny-by-default.** HTTP/HTTPS reach only allowlisted domains; raw TCP,
  UDP and ICMP are blocked. If a fetch or install fails, suspect the network policy
  before the URL. A blocked request returns HTTP 403 with the reason in the body —
  read it, and report the domain rather than working around it.
- **Nothing persists between sandboxes** except the workspace. Do not store state
  outside the repo and expect to find it later.

## Practical mechanics

Consequences of the above that come up when actually running something:

- **Shell state does not carry between commands.** Persist environment variables by
  appending `export` lines to `/etc/sandbox-persistent.sh`, which is sourced before
  every command. Never add shell *completion* scripts there — they break every
  subsequent command.
- **Installed packages are ephemeral.** `sudo`, `npm`, `pip` and `uv` work, but
  anything they install lives only as long as the sandbox. A tool needed to build or
  test this project belongs in a manifest in the repo, not in your shell history.
- **The sandbox has its own `localhost`.** To reach a service on the host machine,
  use `host.docker.internal:<port>`.
- **A Docker daemon runs inside the sandbox**, not on the host: `docker` works,
  image pulls from Docker Hub pass the proxy, and images vanish with the sandbox
  like installed packages. There is no browser and none can be downloaded; a page
  is rendered in a Chromium container instead (the `screenshot` skill).
- **Services you start are not reachable from the host** until the user publishes the
  port from the host side. Bind to `0.0.0.0` or `::`, never `127.0.0.1`, or
  publishing cannot reach them.
- **Parallel sessions share this one sandbox.** The workspace is the host's
  checkout, mounted; a second sandbox on the same directory would share its
  branch and index. Parallel work is therefore several workers here, each in a
  git worktree under `.claude/worktrees/` (inside the mount, so it reaches the
  main `.git`), and they share the Docker daemon — name containers and output
  paths after your branch (ADR-0002; the `process-work-package` skill).
