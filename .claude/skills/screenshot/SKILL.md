---
name: screenshot
description: Capture any page of the built site (a view, an entity page, the index) in a real browser — Chromium in a container on the sandbox's own Docker daemon — before proposing a build change, or when the maintainer asks to see the page. Runs tools/screenshot.py; installs nothing in the sandbox.
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
uv run tools/screenshot.py pomgat-lv-1.0 --dark     # the dark theme; combines with --phone
uv run tools/screenshot.py pomgat-lv-1.0 \
    --do toggle=concepts/leberresektion \
    --do open=statements/drainage-komplexe-leberresektion-optional \
    --do chapters --out /tmp/graph.med/screenshots/liver.png
uv run tools/screenshot.py pomgat-lv-1.0 --phone \
    --do open=statements/drainage-komplexe-leberresektion-optional --do graph   # the graph under the selection
uv run tools/screenshot.py statements/tap-block-mic-kolorektal --phone --full  # an entity page, the whole of it
uv run tools/screenshot.py /                        # the index
```

The first argument is a **site path**: a view id, an entity page
(`statements/<id>`, `concepts/<id>`, `axes/<id>`, `sources/<id>`, …), or `/`
for the index; a trailing slash and `index.html` may be left out. `--full`
captures the whole scrolled page instead of the viewport, so a sheet or an
entity page longer than the screen is one image without a tall `--size`.

The runner builds the site into a temporary directory with base path `/site/`,
copies it and the driver into a fresh container, captures, copies the PNG out,
and removes the container. Actions run in order before the capture and map onto
the hooks `tools/site/static/graph.js` exposes as `window.graphmed`:
all of them need a view page — on a page without a graph the run fails,
naming the action, before anything is captured — except `wait`. The index
draws a graph too (`tools/site/static/home.js`): it takes `open=<view id>` (a
guideline's box tapped, its entry in the sheet), `sheet`, `graph` and `wait`.
`toggle=<concept id>` folds or unfolds a patient group, `open=<entity id>` is a
deep link (unfold and select), `section=<number>` sets the chapter filter,
`fold=<question node id>` folds or unfolds everything below a question,
`search=<text>` and `facet=<kind>` set the search, `step=<n>` steps `n` times through its
matches (back when negative), `chapters` opens the chapter
panel and `chapters-scroll=<px>` scrolls its list, `legend` collapses or expands the legend
(open on a wide screen, collapsed on a phone at load), `all` opens every patient
group one tap at a time (the physician's extreme state), `fit` fits what is
open, `reset` returns the page to its opening state, `sheet` and `graph` bring
the details or the graph into view as a reader does — on a phone, where a
selection waits in a peek strip, `sheet` raises the panel by tapping the strip
and `graph` lowers it again; elsewhere they scroll the page to the section, `wait=<ms>` waits. `--dark`
is a flag, not an action: the graph reads its colours from the stylesheet once,
when it is drawn, so the theme is emulated before the page loads. On a view page the runner
prints how many graph elements were shown, any page error — also when the
graph never appears, which is a script error, not a slow run — and **what
overlaps**: every pair
of nodes and answers whose boxes intersect, and every edge drawn across a node or
an answer it does not touch — the mechanical half of "nothing overlaps"
(`docs/publication.md` §3). It cannot see what a hand does on a phone, such as a
pan that pushes nodes under the floating controls; look for that yourself.
On every page it prints any page error and whether the page is wider than
the viewport (`overflows horizontally: <w> px wide at <width>`, or
`fits <width> px across`) — the mechanical half of "the page fits a phone" —
and on a page without a graph how tall it is.

Output goes under `/tmp/graph.med/screenshots/<branch>/` by default — a neutral
path, never one derived from a home directory
(`conventions/no-personal-information.md`) — and the container is named
`shot-<branch>`, so that sessions running in parallel on the one Docker daemon
(ADR-0002; the `process-work-package` skill) do not remove each other's container
or overwrite each other's PNG. The file is named after the page
(`statements-<id>-phone-full.png`). `--name` and `--out` override both.
Read the PNG to look at it. To show it to the maintainer, put it on a page they
can open; it does not belong in the repository.

## For a build package

Before the pull request: capture the folded start on desktop and on a phone, and
one state that exercises what the package changed (a family unfolded, a box
selected, a filter, a search; on a phone, `--do graph` after `open=` for the
graph under the selection), and every entity page it changes at both widths
with `--full` — in both themes when the package touches a
colour — and run `--do all --do fit`: a build package ends
with 0 overlapping pairs with everything open. Say in the PR description which captures you
took and what you saw — including what is wrong, so the reviewer does not have
to find it. "Not opened in a browser" is no longer an acceptable line in a PR.
Link the preview the reviewer will open as a complete, clickable URL
(`https://graph.med/preview/pr<N>/<view-id>/`, a markdown link on its own line),
never as a bare `graph.med/preview/pr<N>/` — and every other pull request links
its preview the same way, whether or not it changes a page.
