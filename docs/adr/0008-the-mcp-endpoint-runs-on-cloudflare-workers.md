# ADR-0008 — The MCP endpoint runs on Cloudflare Workers, open to every client, behind one rate-limiting rule

Status: accepted, 2026-09-28. The maintainer answered its open points in its
pull request (#290, which carries card #279) on 2026-09-28: the host name
`mcp.graph.med`; no IP allowlist, so that other AI platforms are not kept
out; Workers Free with one rate-limiting rule; and the deploy trigger. The
rest was agreed on 2026-09-27 (#267, agreed decision 4; #279, Decisions). The
allowlist of #267's agreed decisions 3 and 9 (only Anthropic's range let
through, other vendors' hosted assistants not) is overturned.

## Context

The read-only MCP server (ADR-0007; `docs/publication.md` §8) is tool code
behind a server factory in `mcp/`, with no entry point of its own. On
2026-09-28 the maintainer decided: "let's roll back the desktop mcp server fully
and only work with the web version". A hosted endpoint is therefore the only
way the server reaches Claude, and it is part of the MVP. GitHub Pages cannot
host it, because the protocol needs an endpoint that answers POST requests. The
plan asked "which function host to use after the MVP?"; the maintainer answered
it on 2026-09-27 with Cloudflare Workers. The platform facts behind the design
(the limits, the quota, what zone rules reach, rate limiting on the Free plan,
Bot Fight Mode, authentication in Claude) are in `docs/publication.md` §8, "Where the server runs", each with
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
   - no `route` or `routes` key. The custom domain `mcp.graph.med` in graph.med's
     Cloudflare zone is attached once by a person in the dashboard (Workers &
     Pages › the Worker › Settings › Domains & Routes), which creates its DNS
     record. Cloudflare's Wrangler documentation ("Source of truth") says that
     to manage routes in the dashboard only, a configuration has no
     `route`/`routes` key and sets `workers_dev = false`; Wrangler then leaves
     them alone on deploy. So the deploy token holds no DNS or route
     permission. It holds only Workers Scripts: Edit, Workers Observability:
     Edit, Account Settings: Read, User Details: Read and Memberships: Read, and
     a leaked token can replace the Worker's code but cannot change graph.med's
     DNS, which carries the site and mail (the maintainer chose this on
     2026-10-06);
   - `compatibility_flags = ["nodejs_als"]`: the handler imports
     `node:async_hooks` (AsyncLocalStorage), and nothing else of Node's is
     used, so the wider `nodejs_compat` is not set;
   - Workers Logs off (`[observability] enabled = false`).
3. **Open to every MCP client, behind one rate-limiting rule.** No firewall
   rule restricts who may call the endpoint. The maintainer, 2026-09-28: "we
   want to board other ai platforms too without that friction." Any MCP
   client reaches it at `https://mcp.graph.med/mcp`: hosted assistants of any
   vendor, and clients on the user's machine such as Claude Code, Cursor or VS
   Code, which add it as a remote server. What protects it and its quota is
   the one rate-limiting rule of Cloudflare's Free plan, in the zone:

   - it matches requests whose URI path equals `/mcp`,
     `(http.request.uri.path eq "/mcp")`: on the Free plan the expression can
     use only the path (and whether a bot is verified), not the host;
   - it counts per client IP, the only characteristic the Free plan offers;
   - more than **60 requests in 10 seconds** from one IP blocks that IP for
     10 seconds (action Block, the Free plan's period and duration).

   The site's records are DNS only, so only `mcp.graph.med` passes Cloudflare's
   proxy, and the path condition reaches no page of the site. The Worker
   answers `/mcp` only, 404 elsewhere. In the zone, Bot Fight Mode stays off,
   because on the Free plan it cannot be skipped per path and AI platforms'
   servers cannot solve its challenge; "Block AI bots" stays off and the AI
   "Agent" behaviour is not blocked, for the same clients.
4. **No sign-in.** The endpoint is authless: it is added in Claude as a
   custom connector with "No sign-in", and in any other client as a remote
   server by its URL, with no key. OAuth enters only if the answer to
   `assistant-permission` or `mdr-status` requires restricting who may use it.
5. **Deploy: after each successful Pages deploy from `main`, and by hand**
   (confirmed by the maintainer, 2026-09-28). A workflow (committed by a
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
  the Worker, the rate-limiting rule and the zone settings, a token, and a
  committed workflow. All of these are a person's steps, and the agent deploys
  nothing.
- Every MCP client can use the endpoint, whoever runs it, with no sign-in and
  no key: claude.ai web, Desktop and mobile, other vendors' hosted assistants,
  and clients on the user's machine. Programs that fetch pages read Layer 0
  (`llms.txt`) as well.
- **Workers Free, with the worst case accepted.** One IP cannot hold the
  endpoint for long: past 60 requests in 10 seconds it is blocked for 10
  seconds. A distributed flood, from many IPs each under the limit, can use up
  the 100,000 requests a day of Workers Free; the endpoint, with every Worker
  of the account, is then off until midnight UTC, and nothing is billed.
  Requests to the host's other paths are not counted by the rule; the Worker
  answers them 404, and they too can only use up the quota. Automatic DDoS
  protection reacts only to attack-sized traffic. Whether
  requests the rule blocks count against the quota is not documented
  (`docs/publication.md` §8); either way the worst case stays this one.
- **When to reconsider Workers Paid** ($5 a month, 10 million requests
  included): the first day the quota runs out, or steady use near it in the
  Workers metrics. That is a new decision for the maintainer.
- The limit counts per IP, and a hosted assistant calls from its operator's
  servers, so all users of one platform may share a few addresses. Busy use
  through one platform can therefore meet the limit and be blocked for 10
  seconds at a time. The rule's threshold is the setting to change if the
  zone's analytics show it.
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

- A new deploy starts new isolates, so the first requests after each deploy are
  cold ones.
