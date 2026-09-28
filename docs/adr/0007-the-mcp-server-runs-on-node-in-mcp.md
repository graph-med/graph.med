# ADR-0007 — The MCP server runs on Node and lives in `mcp/`

Status: accepted, 2026-09-28

## Context

The initiative `mcp-app` adds a read-only MCP server over the published JSON
(card #267, https://github.com/graph-med/graph.med/issues/267). The maintainer's
plan of 2026-09-27, which #267 carries, says: "The server code lives in the
repo." It ran the server first inside Claude Desktop as an extension and later
"the same code runs as a remote endpoint", which the maintainer placed on
Cloudflare Workers on 2026-09-27 (#279 records that host in a record of its
own). On 2026-09-28 the maintainer decided: "let's roll back the desktop mcp
server fully and only work with the web version". The server is therefore tool
code behind a server factory with no local entry point, and the endpoint on
Workers is the only way it reaches Claude. Before any server code exists, two
things about the repository have to be fixed: the runtime and its toolchain,
and where the server lives.

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

What the platforms say (read 2026-09-27 and 2026-09-28):

- The TypeScript SDK's server package is `@modelcontextprotocol/server` 2.x
  (Node ≥ 20, registry.npmjs.org). The Python SDK `mcp` (2.2.0) has a
  Streamable HTTP server on Starlette, and requires pydantic
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

## Decision

### 1. Runtime and toolchain: Node, JavaScript as ES modules, npm with a lockfile

The server is written in JavaScript as ES modules with no compile step, on
`@modelcontextprotocol/server` 2.x, and runs as a Worker.

- **Dependencies** are pinned in the server's `package.json` and
  `package-lock.json` and installed with `npm ci`; `node_modules` is
  gitignored. `dependencies` hold what the Worker imports at run time
  (`@modelcontextprotocol/server`, `agents`); `devDependencies` hold the
  tools.
- **Tool code** uses only web-standard APIs (`fetch`, `URL`, JSON,
  `TextEncoder`) and imports neither a transport nor a `node:` module. A
  server factory builds the `McpServer` from it; the Worker's entry point,
  in #279, hands that factory to `createMcpHandler` from `agents/mcp/server`
  and serves Streamable HTTP. There is no stdio entry point. The version of
  `@modelcontextprotocol/server` is the one the pinned `agents` release names
  as its peer.
- **Tools are pinned and run locally, never installed globally.** `wrangler`
  is a `devDependency` of the same `package.json`, locked in the same
  lockfile, and run through npm scripts from `node_modules/.bin`, the same way
  in the sandbox and in CI. Wrangler bundles the Worker itself, so no separate
  bundler enters.
- **JavaScript for the chat view** (#276, #277) enters as the site's does:
  hand-written, or vendored as pinned files with their licence note like
  `tools/site/static/vendor/`, never through npm and a bundler. The view needs
  no library (#267, agreed decision 4); if #277 does use the ext-apps `App`
  class, its self-contained build is vendored and pinned. The Pages build
  therefore gains no Node step.
- **Node versions:** the server declares `engines.node` as the SDK and
  Wrangler require (≥ 22 today, Wrangler's floor). CI jobs that deploy set up
  Node 22.

Options weighed:

- **`uv`, the server in Python.** Keeps one toolchain in the repository and
  lets the server share code with `tools/build.py`. On Workers it is either a
  Python Worker on Pyodide, deployed with `pywrangler`, which itself needs
  Node, and where the `mcp` SDK with pydantic, Starlette and its HTTP client
  is not shown to load, nor to answer within 10 ms of CPU; or a second
  implementation in JavaScript for the Worker, every tool twice and the checks
  run against both. Under `uv` Node enters anyway, for the endpoint.
- **TypeScript instead of JavaScript.** Wrangler compiles it for the Worker,
  but the checks that run the tool code in the sandbox would need a compile
  step or a Node that strips types. Type safety is the gain; a build step is
  the cost. Not chosen; a later record can change it.
- **Two manifests** (the Worker's runtime and the tools apart). One lockfile is
  one thing to update and audit, and Wrangler's bundle holds only what the
  Worker imports, so the tools never reach it.

### 2. Location: a top-level directory `mcp/`

The server lives in `mcp/` at the repository root: `package.json` and
`package-lock.json`, the source (tool modules, the server factory, the
Worker's entry point), the one file of tool descriptions (#273) and, with
#279, the Wrangler configuration. It is deployed software with a manifest of
its own, not a script of the repository's own tooling.

Options weighed: `tools/mcp/` (beside the scripts, but `tools/` holds what
checks and builds the pool, not a service that runs); a neutral `server/`
(names a role, not the protocol, and the repository may grow other servers);
a repository of its own (against the plan's "The server code lives in the
repo", and the server's checks run against this repository's build).

### What this record no longer decides

Its first version also decided how a Claude Desktop extension is released. On
2026-09-28 the maintainer decided "let's roll back the desktop mcp server fully
and only work with the web version", so there is no extension and no release;
the endpoint's deployment is #279's, and its host a record of #279's own.

## Consequences

- A second dependency manager, npm, enters beside uv, confined to `mcp/`;
  Python stays uv-only. `CLAUDE.md` and `README.md` describe it when #272 and
  #279 add what they describe, not before.
- The endpoint and the checks run one codebase; the price is that tool code
  may not touch Node APIs, and the SDK version follows the Agents release #279
  pins.
- Nothing is installed on a user's machine. A client that runs local servers
  gets no server; it reads the published JSON (`docs/publication.md` §8).
- The Pages build stays Python-only; the view's JavaScript is vendored or
  hand-written.
