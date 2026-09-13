---
name: screenshot
description: Capture a view page of the built site in a real browser — Chromium in a container on the sandbox's own Docker daemon — before proposing a build change, or when the maintainer asks to see the page. Runs tools/screenshot.py; installs nothing in the sandbox.
---

# Screenshot the site

A build package is not checked by building alone: the graph is laid out by a
library in the browser, and a headless run in Node cannot see overlapping
labels, a box drawn too narrow, or a control that runs into another on a phone.
Look at the page before proposing it.

## Why it works, and what does not persist

The sandbox has no browser and cannot download one: the Playwright and Chrome
download hosts are blocked by the network policy, and `apt` is not the answer
either (a package needed by the project belongs in a manifest, not in a shell
history). What the sandbox *does* have is a **Docker daemon of its own**, and
image pulls from Docker Hub pass the proxy. So the page is rendered by Chromium
inside a container from an image that bundles Node and Puppeteer
(`zenika/alpine-chrome:with-puppeteer`, about a gigabyte), driven by a script
that waits for the layout to settle and runs the actions you ask for.

The daemon lives **inside the sandbox**, so the image is pulled again in every
new sandbox — once, on the first run, taking a minute or two — and nothing
needs to be installed in the sandbox itself. The recipe is entirely in the
repository: `tools/screenshot.py` (the runner) and `tools/screenshot.js` (the
driver that runs inside the container). If `docker` is missing, the runner says
so and stops; report that rather than looking for another browser.

## How

```bash
uv run tools/screenshot.py pomgat-lv-1.0            # the folded start, 1280×900
uv run tools/screenshot.py pomgat-lv-1.0 --phone    # 390×844 at device scale 2
uv run tools/screenshot.py pomgat-lv-1.0 \
    --do toggle=concepts/leberresektion \
    --do open=statements/drainage-komplexe-leberresektion-optional \
    --do chapters --out /tmp/graph.med/screenshots/liver.png
```

The runner builds the site into a temporary directory with base path `/site/`,
copies it and the driver into a fresh container, captures, copies the PNG out,
and removes the container. Actions run in order before the capture and map onto
the hooks `tools/site/static/graph.js` exposes as `window.graphmed`:
`toggle=<concept id>` folds or unfolds a patient group, `open=<entity id>` is a
deep link (unfold and select), `section=<number>` sets the chapter filter,
`search=<text>` and `facet=<kind>` set the search, `chapters` opens the chapter
panel, `all` opens every patient group one tap at a time (the physician's
extreme state), `fit` fits what is open, `wait=<ms>` waits. The runner prints how
many graph elements were shown, any page error, and **what overlaps**: every pair
of nodes and answers whose boxes intersect, and every edge drawn across a node or
an answer it does not touch — the mechanical half of "nothing overlaps"
(`docs/publication.md` §3). It cannot see what a hand does on a phone, such as a
pan that pushes nodes under the floating controls; look for that yourself.

Output goes under `/tmp/graph.med/screenshots/<branch>/` by default — a neutral
path, never one derived from a home directory
(`conventions/no-personal-information.md`) — and the container is named
`shot-<branch>`, so that sessions running in parallel on the one Docker daemon
(`docs/work/README.md`, "Parallel work") do not remove each other's container
or overwrite each other's PNG. `--name` and `--out` override both.
Read the PNG to look at it. To show it to the maintainer, put it on a page they
can open; it does not belong in the repository.

## For a build package

Before the pull request: capture the folded start on desktop and on a phone, and
one state that exercises what the package changed (a family unfolded, a box
selected, a filter, a search), and run `--do all --do fit`: a build package ends
with 0 overlapping pairs with everything open. Say in the PR description which captures you
took and what you saw — including what is wrong, so the reviewer does not have
to find it. "Not opened in a browser" is no longer an acceptable line in a PR.
Link the preview the reviewer will open as a complete, clickable URL
(`https://graph.med/preview/pr<N>/<view-id>/`, a markdown link on its own line),
never as a bare `graph.med/preview/pr<N>/` — and every other pull request links
its preview the same way, whether or not it changes a page.
