# ADR-0008 — The MCP endpoint runs on Cloudflare Workers, behind one firewall rule

Status: proposed, 2026-09-28. It becomes accepted when the maintainer confirms
three things in its pull request (card #279): the host name, the whole-host
reading of the firewall rule, and the deploy trigger. The rest was agreed with
the maintainer on 2026-09-27 (#267, agreed decisions 3 and 4; #279, Decisions).

## Context

The read-only MCP server (ADR-0007; `docs/publication.md` §8) is tool code
behind a server factory in `mcp/`, with no entry point of its own. On
2026-09-28 the maintainer decided: "let's roll back the desktop mcp server fully
and only work with the web version". A hosted endpoint is therefore the only
way the server reaches Claude, and it is part of the MVP. GitHub Pages cannot
host it, because the protocol needs an endpoint that answers POST requests. The
plan asked "which function host to use after the MVP?"; the maintainer answered
it on 2026-09-27 with Cloudflare Workers. The platform facts behind the design
(the limits, the quota, what zone rules reach, Bot Fight Mode, authentication
in Claude) are in `docs/publication.md` §8, "Where the server runs", each with
its source and the date it was read. This record does not restate them.

What it adds, read on 2026-09-28 at developers.cloudflare.com/workers/platform/limits/:

- CPU time per HTTP request on Workers Free is 10 ms. "Each isolate has some
  built-in flexibility to allow for cases where your Worker infrequently runs
  over the configured limit. If your Worker starts hitting the limit
  consistently, its execution will be terminated", with Error 1102.
- A Worker "must parse and execute its global scope … within 1 second".

The Worker was measured in Workers' local runtime (`wrangler dev`, workerd) on
every call of the server's check, over the local build and over
`https://graph.med/preview/pr287/` (`CLAUDE.md`, "Checks"). V8's sampling
profiler ran on the Worker's isolate. The profiler's own work is counted, so
the figures are upper bounds:

- A warm request costs about 1.2–1.4 ms of CPU at the median, 2.4–2.7 ms at the
  95th percentile, over every call of the check.
- The first request of a fresh isolate costs about 20–30 ms, most of it the
  runtime compiling code on first use. The first search costs about 15–20 ms,
  because it parses the search files.
- A get tree node call with a depth near a large grouping's root once cost
  50–70 ms, because the tool built such a result up to three times until it
  fitted its size bound. #272 now builds each result once, sized in advance, and
  keeps each node's detail and each tool's schema per isolate. The heaviest such
  call (depth 3 at a large root) now costs about 3.5–4 ms. Of about 3,160 warm
  calls, 4–8 exceeded 10 ms, each a one-off that a replay did not repeat (at most
  6.8 ms over 20 replays).
- Start-up (`wrangler check startup`) is about 65 ms active.
- No request makes more than 3 subrequests (the runtime's own trace; the limit
  is 50).

## Decision

1. **Host: Cloudflare Workers.** The Worker's entry point is
   `mcp/src/worker.js`. It hands the server factory to `createMcpHandler` from
   `agents/mcp/server`, Cloudflare's stateless Streamable HTTP handler, not the
   deprecated `McpAgent`. Every MCP message is a POST to `/mcp`, GET and DELETE
   there are answered 405, and every other path 404. The server keeps no
   session, writes nothing and logs no tool argument. What stays in memory
   between requests is Layer 0 files, dropped when `index.json` names a new
   commit or after ten minutes (`mcp/src/layer0.js`). The site it reads is the
   Worker variable `LAYER0_BASE`, `https://graph.med/`, never a value from a
   request. It sends no `_meta.ui.domain`.
2. **Configuration: `mcp/wrangler.toml`,** with no account id and no secret:
   - `workers_dev = false` and `preview_urls = false`, each set explicitly,
     because the first leaves Version URLs as they were. There is no
     `previews` block. The deploy runs `wrangler deploy`, never
     `wrangler preview`;
   - one route, a custom domain in graph.med's Cloudflare zone. Its host name,
     `mcp.graph.med`, is a placeholder until the maintainer confirms it;
   - `compatibility_flags = ["nodejs_als"]`: the handler imports
     `node:async_hooks` (AsyncLocalStorage), and nothing else of Node's is
     used, so the wider `nodejs_compat` is not set;
   - Workers Logs off (`[observability] enabled = false`).
3. **One WAF custom rule covers the whole host.** It blocks every request to
   the endpoint's host that does not come from `160.79.104.0/21`, on every path:

   ```
   (http.host eq "mcp.graph.med" and not ip.src in {160.79.104.0/21})
   ```

   The action is Block. A custom domain sends every path of its host to the
   Worker, so a rule on `/mcp` alone would let requests to other paths reach the
   Worker and use the quota. The maintainer agreed the rule as "requests to the
   MCP path". This reading needs their confirmation; the alternative is a route
   of `mcp.graph.med/mcp` instead of a custom domain. In the zone, Bot Fight
   Mode is off and the AI "Agent" behaviour is not blocked.
4. **No sign-in.** The endpoint is authless and is added in Claude as a custom
   connector with "No sign-in". OAuth enters only if the answer to
   `assistant-permission` or `mdr-status` requires restricting who may use it.
5. **Deploy: after each successful Pages deploy from `main`, and by hand.**
   This is proposed, for the maintainer to confirm. A workflow (committed by a
   person; workflow files are human-only) runs on a `workflow_run` of the
   `pages` workflow that completed successfully for a push to `main` (or a
   `workflow_dispatch` of it), and on its own `workflow_dispatch`. It checks out
   the commit Pages just published, runs `npm ci` and the server's check against
   the fixture and `https://graph.med/`, and then runs `npm run deploy`
   (`wrangler deploy`). The token is the repository secret
   `CLOUDFLARE_API_TOKEN` and the account id the repository secret
   `CLOUDFLARE_ACCOUNT_ID`. Its default token is `contents: read`.
   - Options weighed: every push to `main` that touches `mcp/`. That trigger
     deploys only when the server changes, but it runs beside the Pages
     deploy, not after it, so a server that needs a new JSON shape can go live
     before the site that has it. After Pages, the Worker and the site it reads
     change together: the Worker goes live minutes after its site, and never
     before it.
   - A change to Layer 0 and to the server lands in one pull request, so one
     push to `main`. Pages publishes the new files, and the Worker from the
     same commit follows. In the minutes between, the running Worker reads the
     new files: its cache drops everything when `index.json` names the new
     commit. A change that the old server cannot read is therefore made in two
     steps: first a server that reads both shapes, then the files.

## Consequences

- The MVP adds infrastructure: a Cloudflare account, graph.med's DNS in a
  Cloudflare zone (the site's records stay DNS only, pointing at GitHub Pages),
  the Worker, the rule and the zone settings, a token, and a committed
  workflow. All of these are a person's steps, and the agent deploys nothing.
- The endpoint answers Anthropic's platform only (claude.ai web, Desktop and
  mobile by URL, Cowork). Claude Code and other programs that run MCP servers
  locally read Layer 0 (`llms.txt`) instead, since the sandbox and every
  machine outside the range are blocked.
- On Workers Free, the request that runs over the 10 ms is the first one of each
  new isolate (about 20–30 ms); a warm call exceeds it only as a rare one-off.
  Cloudflare tolerates an infrequent overrun per isolate, but terminates a Worker
  that hits the limit consistently (Error 1102, `exceededCpu` in its metrics).
  A cold start is infrequent by nature. If the metrics show `exceededCpu`
  anyway, the remedies are:
  - Workers Paid: $5 a month, 30 s of CPU by default;
  - a lighter request: the server still builds an `McpServer` with its six tools
    on every request, because `createMcpHandler` calls the factory per request
    and one server serves one transport at a time.

- Unknown until a person settles it (`docs/publication.md` §8): whether requests
  the rule blocks count against the 100,000 a day of Workers Free. Until then
  the maintainer weighs Workers Paid against the risk.
- A new deploy starts new isolates, so the first requests after each deploy are
  cold ones.
