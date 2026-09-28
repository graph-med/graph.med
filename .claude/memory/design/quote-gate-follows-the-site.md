---
name: quote-gate-follows-the-site
description: The MCP server gates nothing the site shows openly — get_provenance returns each claim's sentence whole with its page and link, anchor quotes stay capped at 100 characters, every other tool cites by URL and page.
metadata:
  type: project
---

The read-only MCP server (`docs/publication.md` §8) returns verbatim source
text from one tool only, `get_provenance`, and there it gates nothing the site
shows openly:

- each claim's sentence (`claim.label`) whole, as the site shows it, with its
  page and its link into the source;
- the anchor quotes and the other quoted fields capped at 100 characters,
  shortened at a word and marked;
- every other tool cites a claim by its graph.med URL and page, and returns no
  claim sentence and no quote; the server drops those keys from their results,
  and a recommendation's wording that carries a claim's sentence or quote word
  for word is withheld there.

One policy for every graph: the licence line is the project's prose summary,
so no per-source policy can be read from data. Decided by the maintainer on
2026-09-28 in pull request #290 (card #272; option 2 of the former open
question `quote-gate`), over option 1, which never returned `claim.label`.

**Why:** the maintainer's reasoning: any assistant can fetch the source PDF,
and graph.med already publishes every claim's sentence, so gating the server
alone protects nothing. The basis on which a source's text may reach users at
all is a separate, legal question (`assistant-permission`, card #281), and
the site's own publishing is the same exposure as the server's.

**How to apply:** a claim sentence reaches a tool result only through
`get_provenance`, whole, never cut to the quote cap; a quote there stays
capped. Full sentences in every result stay out until `assistant-permission`
is answered; its answer can widen or narrow this, together with what the site
publishes. The server's check (`mcp/test/check.js`) enforces the split: it
scans every result, provenance included, and allows verbatim text only in
provenance's `quotes` (capped) and `sentences` (each equal to its claim's
label). Beside [[sources-referenced-never-rehosted]]: the server fetches,
proxies and serves no source document; it links to the public one.
