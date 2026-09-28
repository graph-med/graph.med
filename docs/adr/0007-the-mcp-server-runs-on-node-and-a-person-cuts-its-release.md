# ADR-0007 — The MCP server runs on Node, lives in `mcp/`, and a person cuts its release

Status: accepted, 2026-09-28

## Context

The initiative `mcp-app` adds a read-only MCP server over the published JSON
(card #267, https://github.com/graph-med/graph.med/issues/267). The maintainer's
plan of 2026-09-27, which #267 carries, says: "The server code lives in the
repo. CI on `main` builds the extension and publishes it as a GitHub release;
the agent never publishes releases itself." For the MVP the server runs inside
Claude Desktop as an extension (an `.mcpb`); later "the same code runs as a
remote endpoint", which the maintainer placed on Cloudflare Workers on
2026-09-27 (#279 records that host in a record of its own). Before any server
code exists, three things about the repository have to be fixed: the runtime
and its toolchain, where the server lives, and how an extension is released.

What the repository holds today:

- One toolchain: Python through uv, "never pip" (`CLAUDE.md:26`);
  `pyproject.toml` says "There is no package to build" (`:2`) and sets
  `package = false` (`:17`). No `package.json`, lockfile or `.ts` file is
  tracked. The JavaScript that exists needs no install: the hand-written
  `tools/site/static/graph.js` and `home.js`, and vendored libraries,
  "Pinned; update by replacing the file and this note"
  (`tools/site/static/vendor/LICENSES.md:3`). Both workflows set up only uv
  (`.github/workflows/pages.yml:63, 84`; `.github/workflows/validate.yml:27, 40`).
- "A tool needed to build or test this project belongs in a manifest in the
  repo" (`.claude/rules/environment/sandbox-environment.md:29-31`). The
  sandbox has Node 22 and npm 9 and reaches registry.npmjs.org.
- `CLAUDE.md:19`: "There is no source tree beyond these scripts."
- Both workflows run with `contents: read` (`.github/workflows/pages.yml:20-21`,
  `.github/workflows/validate.yml:14-15`), and four texts say so
  (`.github/workflows/pages.yml:8`, `README.md:382-384`,
  `.claude/rules/environment/git-identity.md:41-42`,
  `docs/publication.md:804-806`). A person commits workflow files; the App
  has no `workflows` permission (`.claude/rules/environment/git-identity.md:32-45`).
- Tags `v0.1.0`, `v0.1.1`, `v0.2.0` and `v0.3.0` exist, each with a release and
  no assets, each made by a person
  (api.github.com/repos/graph-med/graph.med/releases, read 2026-09-28); no
  file documents a release process. The pool's versioning does not use them:
  "nothing about versioning depends on git tags"
  (`.claude/memory/design/pool-and-views.md:21`).
- The repository's two rulesets, `main-block-force-delete` and
  `main-require-review`, target branches; none covers tags
  (api.github.com/repos/graph-med/graph.med/rulesets, read 2026-09-28). The
  App pushes branches, which needs the Contents permission with write, the
  permission GitHub also names for creating a release
  (docs.github.com/en/rest/releases/releases). So "the agent never publishes
  releases itself" is an instruction only, where guarantees belong outside
  the model (`.claude/memory/environment/security-enforced-outside-model.md:8-11`).

What the platforms say (read 2026-09-27 and 2026-09-28):

- An `.mcpb` is "a zip archive containing a local MCP server and a
  `manifest.json`" (claude.com/docs/connectors/building/mcpb.md:9). Server
  types: `node`, whose dependencies "must be bundled in `node_modules`";
  `uv` (manifest 0.4), which ships `pyproject.toml` and source while "Host
  application manages Python and dependencies"; `python`, which "Cannot
  portably bundle compiled dependencies (e.g., pydantic, which the MCP Python
  SDK requires)" (github.com/modelcontextprotocol/mcpb `MANIFEST.md:399-464`,
  `README.md:112-132`).
- "We recommend implementing MCP servers in Node.js … Node.js ships with
  Claude for macOS and Windows" (github.com/modelcontextprotocol/mcpb
  `README.md:107`; claude.com/docs/connectors/building/mcpb.md:56-62). The
  Node version Desktop ships is not published. The `uv` type stopped being
  experimental with modelcontextprotocol/mcpb#206; a Desktop bug with it,
  modelcontextprotocol/mcpb#291, was closed as fixed on 2026-07-23.
- The official packing CLI is the npm package `@anthropic-ai/mcpb` (2.1.2 on
  2026-09-28): `mcpb validate`, `mcpb pack`, exclusions in `.mcpbignore`
  (github.com/modelcontextprotocol/mcpb `CLI.md:61-90`). For a `node` bundle
  it advises `npm ci` and a production install of `node_modules`
  (`README.md:128-132`).
- The TypeScript SDK's server package is `@modelcontextprotocol/server` 2.x
  (Node ≥ 20, registry.npmjs.org), with a stdio transport
  (`@modelcontextprotocol/server/stdio`) and, for a Node HTTP server,
  `@modelcontextprotocol/node`. The Python SDK `mcp` (2.2.0) has a stdio
  server and a Streamable HTTP server on Starlette, and requires pydantic
  (pypi.org/project/mcp).
- On Workers, Cloudflare's stateless Streamable HTTP handler is
  `createMcpHandler` from `agents/mcp/server`, which takes a factory returning
  an `McpServer` of `@modelcontextprotocol/server`; `McpAgent` is deprecated.
  Its example is plain JavaScript as well as TypeScript, and "Use the exact
  MCP versions required by your installed Agents release"
  (developers.cloudflare.com/agents/model-context-protocol/protocol/transport/,
  /agents/model-context-protocol/apis/handler-api/). The Agents release on
  2026-09-28, `agents` 0.24.0, names `@modelcontextprotocol/server` 2.0.0 as
  an exact peer (registry.npmjs.org).
- Workers "provides a subset of Node.js APIs", some only as shims whose
  methods throw (developers.cloudflare.com/workers/runtime-apis/nodejs/).
  Workers Free gives 10 ms of CPU per request and 50 subrequests
  (developers.cloudflare.com/workers/platform/limits/).
- Wrangler, the Workers deploy tool, is an npm package (4.142.0, Node ≥ 22)
  that bundles a Worker with esbuild; Cloudflare "recommends installing
  Wrangler locally in your project (rather than globally)"
  (developers.cloudflare.com/workers/wrangler/install-and-update/).
- Python Workers exist: they run on Pyodide, take pure-Python or PyEmscripten
  packages and Pyodide's own, and are run and deployed with `pywrangler`,
  for which "ensure uv and Node are installed"
  (developers.cloudflare.com/workers/languages/python/,
  /workers/languages/python/packages/).
- The MCP Apps view speaks the standard's messages over `postMessage`: "you
  can use any framework or none at all", and the ext-apps `App` class is "a
  convenience wrapper, not a requirement"
  (modelcontextprotocol.io/docs/extensions/apps). The ext-apps package also
  publishes a self-contained build of that class (`./app-with-deps`,
  registry.npmjs.org). The view uses the standard's messages and no vendor SDK
  (#267, agreed decision 6).
- ext-apps packs its own `.mcpb` on the `release` event, in a job with
  `environment: Release` and `contents: write`, and attaches it with
  `gh release upload` (github.com/modelcontextprotocol/ext-apps
  `.github/workflows/npm-publish.yml:157-181`). The MCPB format has no update
  mechanism (modelcontextprotocol/mcpb#65, closed as not planned); signing is
  optional (`CLI.md:92`).

## Decision

### 1. Runtime and toolchain: Node, JavaScript as ES modules, npm with a lockfile

The server is an `.mcpb` of type `node`, written in JavaScript as ES modules
with no compile step, on `@modelcontextprotocol/server` 2.x.

- **Dependencies** are pinned in the server's `package.json` and
  `package-lock.json` and installed with `npm ci`; `node_modules` is
  gitignored. `dependencies` hold only what the stdio server imports at run
  time; `devDependencies` hold the tools and what only the Worker imports.
- **Shared tool code** uses only web-standard APIs (`fetch`, `URL`, JSON,
  `TextEncoder`) and imports neither a transport nor a `node:` module. The
  stdio entry point, alone, may use Node APIs. So the same tool code serves
  the extension over stdio (`@modelcontextprotocol/server/stdio`) and, in
  #279, the Worker over Streamable HTTP (`createMcpHandler` from
  `agents/mcp/server`, given the same server factory); the version of
  `@modelcontextprotocol/server` is the one the pinned `agents` release names
  as its peer.
- **Tools are pinned and run locally, never installed globally.** The packing
  CLI `@anthropic-ai/mcpb` and, when #279 needs them, `wrangler` and `agents`
  are `devDependencies` of the same `package.json`, locked in the same
  lockfile, and run through npm scripts from `node_modules/.bin`, the same way
  in the sandbox and in CI. Wrangler bundles the Worker itself, so no separate
  bundler enters.
- **The packing step** is one npm script in the server's directory: it stages
  the directory with `npm ci --omit=dev` (so the bundle's `node_modules` holds
  no tool), places what #274 names (`LICENSE`, the icon), and runs
  `mcpb validate` and `mcpb pack`. The official CLI, not a reimplementation.
- **JavaScript for the chat view** (#276, #277) enters as the site's does:
  hand-written, or vendored as pinned files with their licence note like
  `tools/site/static/vendor/`, never through npm and a bundler. The view needs
  no library (#267, agreed decision 4); if #277 does use the ext-apps `App`
  class, its self-contained build is vendored and pinned. The Pages build
  therefore gains no Node step.
- **Node versions:** the server declares `engines.node` and the manifest's
  `compatibility.runtimes.node` as the SDK requires (≥ 20 today); #274's
  person check records the version Desktop runs. CI jobs that pack or deploy
  set up Node 22 (Wrangler needs ≥ 22).

Options weighed:

- **`uv`, the server in Python.** Keeps one toolchain in the repository and
  lets the server share code with `tools/build.py`. The bundle is small, but
  Desktop installs Python and the dependencies on each user's machine at
  install time. Packing still needs npm for the official CLI (in a
  `package.json` of its own), or a Python reimplementation that validates
  `manifest.json` against mcpb's published schema with `jsonschema` and zips
  the directory honouring `.mcpbignore`, and has to keep matching the
  official CLI's checks. On Workers, the endpoint is either a second
  implementation in JavaScript (every tool twice, the checks run against both)
  or a Python Worker on Pyodide, deployed with `pywrangler`, which itself
  needs Node, and where the `mcp` SDK with pydantic, Starlette and its HTTP
  client is not shown to load, nor to answer within 10 ms of CPU. Under `uv`
  Node enters anyway, for the endpoint.
- **TypeScript instead of JavaScript.** Wrangler compiles it for the Worker,
  but the stdio bundle would need a compile step, or a Node version that runs
  TypeScript directly, which Desktop does not publish. Type safety is the
  gain; a build step and its output in the bundle are the cost. Not chosen;
  a later record can change it.
- **Two manifests** (runtime and packing apart, or the Worker's tools apart).
  One lockfile is one thing to update and audit; the production install
  keeps the tools out of the bundle.

### 2. Location: a top-level directory `mcp/`

The server lives in `mcp/` at the repository root: `manifest.json`,
`package.json` and `package-lock.json`, the source (tool modules, the stdio
entry point, later the Worker's entry point), the one file of tool
descriptions (#273), `.mcpbignore` and, with #279, the Wrangler
configuration. `mcpb pack` packs one directory, and this is shipped software,
not a script of the repository's own tooling.

Options weighed: `tools/mcp/` (beside the scripts, but `tools/` holds what
checks and builds the pool, not what users install); a neutral `server/`
(names a role, not the protocol, and the repository may grow other servers);
a repository of its own (against the plan's "The server code lives in the
repo", and the server's checks run against this repository's build).

### 3. Release: a person cuts it, CI attaches the extension

- **Trigger:** the `release` event (`published`). A person creates the
  release and its tag on GitHub; a workflow packs the `.mcpb` from the tagged
  commit and attaches it with `gh release upload`. It acts only on tags with
  the extension's prefix, and refuses (fails, attaching nothing) a tag whose
  version differs from `mcp/manifest.json`'s `version` or whose commit is not
  on `main`.
- **Tag scheme:** `mcp-v<semver>`, equal to the manifest's `version`. It
  cannot collide with `v0.1.0`–`v0.3.0`, and it versions the code, never the
  data: the extension carries none. The release notes name the commit.
- **Token:** `contents: write` in the one job that uploads, in a workflow file
  of its own, whose default stays `contents: read`. `pages.yml:8` and
  `docs/publication.md:804-806` stay true; `README.md:382-384` and
  `git-identity.md:41-42` are reworded by #274 so that they hold before and
  after a person commits the workflow.
- **Enforcement:** a person sets a tag ruleset over every tag (`refs/tags/**`)
  that restricts creation, update and deletion to a bypass list of persons or
  their team, never the App. Every new release needs a new tag, so this stops
  the App from publishing one. It does not stop the App from editing an
  existing release, attaching an asset to one, or deleting a release and
  publishing another on its existing tag. Until the ruleset exists, "the agent
  never publishes a release" is an instruction only. An environment with
  required reviewers on the upload job is optional, not part of this decision.
- **Signing:** none for now.

Options weighed for the trigger: the plan's, on push to `main`: CI packs, and
when the manifest's `version` has no release yet it creates the tag
`mcp-v<version>` and the release. The gate is then a version line in a
reviewed pull request; the cost is a job that creates tags and releases with
`contents: write` on every push to `main`, and a tag ruleset that must let the
workflow create the prefix's tags. Under the `release` event the person who
cuts the release is the gate, and tag creation can be left to persons alone.
This departs from the plan's wording, not its intent: the agent still
publishes nothing.

## Consequences

- A second dependency manager, npm, enters beside uv, confined to `mcp/`;
  Python stays uv-only. `CLAUDE.md` and `README.md` describe it when #272 and
  #274 add what they describe, not before.
- The extension and the hosted endpoint share one codebase and one set of
  checks; the price is that shared tool code may not touch Node APIs, and the
  SDK version follows the Agents release #279 pins.
- A clinician's machine downloads nothing at install: the runtime is the Node
  Desktop ships, and the bundle carries its `node_modules`.
- The Pages build stays Python-only; the view's JavaScript is vendored or
  hand-written.
- Releases stay a person's act. Until a person sets the tag ruleset, nothing
  but an instruction stops the App from making a tag or a release; after it,
  the App can still alter releases that exist, which the ruleset does not
  cover. Installed extensions do not update themselves: a user installs each
  new release.
