// The Worker's entry point (card #279; docs/publication.md §8; ADR-0008): the
// server factory behind Cloudflare's stateless Streamable HTTP handler,
// `createMcpHandler` of the Agents SDK. Every MCP message is a POST to /mcp;
// GET and DELETE there are answered 405, every other path 404. No session is
// kept and nothing is written: what stays in memory between requests is the
// Layer 0 files the reader parsed (layer0.js), and no tool argument is logged.
//
// LAYER0_BASE, a variable of the Worker (wrangler.toml), is the site it
// reads: https://graph.med/ when deployed; a preview or a local build when
// run with `wrangler dev --var LAYER0_BASE:<url>`. It never comes from a
// request.

import { createMcpHandler } from 'agents/mcp/server';
import { createServerFactory } from './server.js';

// The handler over one factory. The check (test/check.js) builds the same
// handler around a factory with a request log.
export function createHandler(factory) {
  const handler = createMcpHandler(factory, { route: '/mcp' });
  const prepared = async (request, env, ctx) => {
    if (request.method === 'POST') await factory.prepare?.();
    return handler(request, env, ctx);
  };
  prepared.fetch = prepared;
  return prepared;
}

// One handler per isolate, rebuilt only if the base changes: the reader, and
// with it every parsed file, lives as long as the isolate does.
let current = null;

export default {
  fetch(request, env, ctx) {
    const base = env.LAYER0_BASE;
    if (!base) return new Response('LAYER0_BASE is not set', { status: 500 });
    if (!current || current.base !== base) current = { base, handler: createHandler(createServerFactory({ base })) };
    return current.handler(request, env, ctx);
  },
};
