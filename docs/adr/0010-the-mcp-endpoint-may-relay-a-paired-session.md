# ADR-0010 — The MCP endpoint may hold a paired, view-only, short-lived session: a relay to the reader's open tab

Status: accepted, 2026-10-22. The relay, its limits, and that it departs from
`docs/publication.md` §8 principle 2 and ADR-0008 were put to the maintainer, who
answered: "i accept, build it all" (card #411). This record supersedes, for the
relay alone, ADR-0008's "The server keeps no session" (its decision 1), and it
amends §8 principle 2.

## Context

The initiative `co-navigation` (#407) wants a reader and Claude to steer one live
graph together. The maintainer, 2026-10-18: "after the initiative, we want a
responsive interactive session on the browser. the tooling should also be
suitable for other clients, like the claude desktop app."

The session tools (§8, "The session tools"; #408, #416) live in the view page.
An assistant that runs script in the page reaches them, as Claude in Chrome
does. A client outside the browser cannot. That covers the Claude desktop app,
claude.ai on the web, the mobile app, and Claude Code without its browser. Such a
client runs on another machine, or in the vendor's cloud, and nothing it holds
reaches a tab on the reader's machine. The tab has to connect out to something
both sides reach, and the one such thing graph.med runs is its MCP endpoint,
`mcp.graph.med` (ADR-0008).

Two texts say the endpoint holds nothing of the kind:
- **§8 principle 2:** "Read-only and stateless. No credentials, no user data,
  nothing written."
- **ADR-0008, decision 1:** "The server keeps no session, writes nothing and logs
  no tool argument."

A relay has to know, for as long as a pairing lasts, which tab a client's calls
go to. That is a session.

**The platform**, read on 2026-10-22 at developers.cloudflare.com/durable-objects/
(platform/pricing, platform/limits, best-practices/websockets):

- **Plans.** "Durable Objects are available both on Workers Free and Workers Paid
  plans." On Workers Free, "Only Durable Objects with SQLite storage backend are
  available."
- **Free daily limits.** Requests are 100,000 a day and duration 13,000 GB-s a
  day. "If you exceed any one of the free tier limits, further operations of that
  type will fail with an error." The limits "reset at 00:00 UTC".
- **WebSocket billing.** "A request is needed to create a WebSocket connection.
  There is no charge for outgoing WebSocket messages". For incoming messages,
  "a 20:1 ratio is applied".
- **Hibernation.** "Durable Objects that are idle and eligible for hibernation
  are not billed for duration." The Hibernation WebSocket API "allows the Durable
  Object to hibernate without disconnecting clients when idle".

## Decision

1. **`mcp.graph.med` may hold one kind of session: a reader's open tab, paired
   with an MCP client.**
   - It is held by a Durable Object per session, of a SQLite-backed class (the
     only kind Workers Free offers). The tab connects to it by a WebSocket, which
     the object accepts through the Hibernation API.
   - The server's six tools over the pool are unchanged, and so is the rest of
     ADR-0008: the host, open to every client, no sign-in, the rate-limiting
     rule, and the deploy. How a client names its session on each call is
     #412's, within the limits below.
2. **The reader opens it, and only the reader.**
   - A session exists only while a reader has opened one in the page, with a
     control there.
   - The page shows a short pairing code, and a client reaches the tab only
     through it.
   - The session ends when the reader ends it, when the tab closes, or when it
     expires.
3. **View commands only.**
   - The relay forwards the page's session tools by the names the page's
     definition holds (`tools/site/session-tools.json`), and refuses any other.
   - Those tools read what the reader sees, and act as the reader's own
     controls do. They persist nothing, so a reload shows the page as before
     (§8, "The session tools").
   - Nothing passes through the relay that writes to the pool, the site, or the
     reader's machine.
4. **Nothing stored about a reader, no tool argument logged.**
   - No account, no cookie and no identifier of a person.
   - No tool argument or answer is written to storage or to a log, and Workers
     Logs stay off (ADR-0008).
   - What a session holds lives no longer than the session: in memory, attached
     to its WebSocket, or in its object's storage. A count a rate limit keeps
     lives no longer than its window.
5. **A pairing code and a session that expire.**
   - A code that is not used soon expires.
   - A session with no call for a while expires, and so does one that has
     lasted long enough, whether used or not.
   - The values are #412's, stated in §8, together with the code's length and
     how many guesses the rate limits leave per code.
6. **A rate limit.**
   - The zone's one rule (ADR-0008) counts what reaches `/mcp`.
   - The relay also limits, in its own code, the calls per session and the
     sessions opened, because the Free plan's one rule cannot cover another
     path.
7. **It fits Workers Free.**
   - The class is SQLite-backed, and the page's WebSocket hibernates between
     calls, so an idle session costs no duration.
   - A relayed call costs one Worker request, one Durable Object request, and
     an incoming WebSocket message counted at a twentieth of a request.
   - Workers Paid is a new decision, as ADR-0008 says of the endpoint.
8. **The limits live in the server.** Each one is enforced by the Worker and its
   Durable Object, and checked by the server's check (#412), never by a sentence
   a model is asked to obey (§8, the first principle;
   `.claude/memory/environment/security-enforced-outside-model.md`).

### Options weighed

- **A relay on the Worker** (chosen).
  - It reaches every MCP client the endpoint already serves, hosted or local,
    with nothing to install beyond the connector.
  - Its cost is the state this record allows.
- **Bridge extensions the reader installs.**
  - These keep the server stateless. One is a browser extension that hands a
    tab's WebMCP tools to a client on the same machine; another is a debugging
    server that drives the reader's own Chrome, for clients such as Claude Code
    (found in #407's research, 2026-10-18).
  - Each reader installs and configures software, and it works only on the
    machine the browser runs on.
  - Clients that run in the vendor's cloud (claude.ai on the web, the mobile
    app) cannot use them.
- **No support outside the browser.** This keeps principle 2 whole. It drops
  #407's second outcome, and leaves the desktop app and every other client the
  data channel alone.

## Consequences

- **Principle 2 holds with one exception,** which §8 states where the principle
  stands: the relay's session. Everything else the server does stays read-only
  and stateless. ADR-0008's status line points here.
- **What a reader looks at passes through Cloudflare while a session lasts,**
  and nothing of it is kept.
- **Someone who guesses a live code can read and steer that reader's view for
  the session's life,** and nothing more: no tool reaches beyond the page, and
  nothing persists. The code's length, its expiry and the rate limits bound
  that; #412 states the numbers.
- **A deploy may end open sessions;** the reader then pairs again.
- **The quota is shared.** Past a free daily limit, further operations of that
  kind fail until 00:00 UTC, and the relay with them. This is the worst case
  ADR-0008 accepted for the endpoint, now with a second set of quotas.
- **`mcp/wrangler.toml` gains a Durable Object binding and its migration** (#412).
  Whether the deploy token needs more than ADR-0008's permissions is for #412 to
  find out. A wider token, like any change to the deploy, is a person's step.
- **Undecided by this record:**
  - #283 (whether selection and highlighting driven by a conversation make the
    page a medical device under the EU MDR), which the relay brings to clients
    outside the browser too;
  - whether the in-browser entries to the session tools wait for the reader to
    switch them on (#407). The relay always waits: the reader pairs.
