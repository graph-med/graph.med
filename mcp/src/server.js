// The server factory: an MCP server with the six tools over one base URL.
// It imports no transport and no Node module (ADR-0007): an entry point wraps
// it — on Workers, `createMcpHandler(factory)` (#279).
//
//   import { createServerFactory } from './src/server.js';
//   const factory = createServerFactory({ base: 'https://graph.med/' });
//
// The factory returns a fresh server per call (per request under
// `createMcpHandler`); all of them share one reader, so parsed Layer 0 files
// stay in memory between requests (layer0.js, TTL_MS).

import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { Layer0, InputError } from './layer0.js';
import { handlers, MAX_DEPTH } from './tools.js';
import * as words from './descriptions.js';

export const VERSION = '0.1.0';

const d = (tool, arg) => words.tools[tool].args[arg];

const schemas = {
  list_graphs: z.object({ offset: z.number().int().min(0).optional().describe(d('list_graphs', 'offset')) }),
  list_groupings: z.object({ graph: z.string().describe(d('list_groupings', 'graph')) }),
  get_tree_node: z.object({
    graph: z.string().describe(d('get_tree_node', 'graph')),
    grouping: z.string().optional().describe(d('get_tree_node', 'grouping')),
    node: z.string().optional().describe(d('get_tree_node', 'node')),
    depth: z.number().int().min(0).max(MAX_DEPTH).optional().describe(d('get_tree_node', 'depth')),
    offset: z.number().int().min(0).optional().describe(d('get_tree_node', 'offset')),
  }),
  get_entity: z.object({
    entity: z.string().describe(d('get_entity', 'entity')),
    graph: z.string().optional().describe(d('get_entity', 'graph')),
    offset: z.number().int().min(0).optional().describe(d('get_entity', 'offset')),
  }),
  search: z.object({
    query: z.string().describe(d('search', 'query')),
    graph: z.string().optional().describe(d('search', 'graph')),
    limit: z.number().int().min(1).max(50).optional().describe(d('search', 'limit')),
    offset: z.number().int().min(0).optional().describe(d('search', 'offset')),
  }),
  get_provenance: z.object({
    entity: z.string().describe(d('get_provenance', 'entity')),
    graph: z.string().optional().describe(d('get_provenance', 'graph')),
  }),
};

// Drops every `quote` key from a result: verbatim source text leaves the
// server only through the provenance tool, whatever a Layer 0 file carries.
function scrub(o) {
  if (Array.isArray(o)) return o.map(scrub);
  if (o && typeof o === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(o)) if (k !== 'quote') out[k] = scrub(v);
    return out;
  }
  return o;
}

// Runs one tool and renders its result as the text a model reads.
export async function callTool(reader, name, args) {
  try {
    let result = await handlers[name](reader, args || {});
    if (name !== 'get_provenance') result = scrub(result);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (err) {
    const known = err instanceof InputError;
    return {
      isError: true,
      content: [{ type: 'text', text: JSON.stringify({ error: known ? err.message : `graph.med could not be read: ${err.message}` }) }],
    };
  }
}

export function createServer(reader) {
  const server = new McpServer({ name: words.server.name, title: words.server.title, version: VERSION });
  for (const [name, spec] of Object.entries(words.tools)) {
    server.registerTool(
      name,
      {
        title: spec.title,
        description: spec.description,
        inputSchema: schemas[name],
        annotations: { title: spec.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async (args) => callTool(reader, name, args),
    );
  }
  return server;
}

// base: the site's root — https://graph.med/, a preview
// https://graph.med/preview/pr<N>/, or a local build served over HTTP.
export function createServerFactory({ base, fetch, onFetch } = {}) {
  const reader = new Layer0({ base, fetch, onFetch });
  const factory = () => createServer(reader);
  factory.reader = reader;
  return factory;
}
