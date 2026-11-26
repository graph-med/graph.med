# ADR-0011 — The pool is stored as an Open Knowledge Format v0.3 bundle

Status: accepted, 2026-11-26.

## Context

The maintainer asked on 2026-11-26 to "use the latest version of the open
knowledge format for the graph.med knowledge layer". The Open Knowledge Format
(OKF; `SPEC.md` in `open-knowledge-format/open-knowledge-format`) is an open
format for knowledge as a directory of Markdown files with YAML frontmatter. Its
latest version is **0.3**, released on 2026-11-18. An OKF consumer (an agent, an
index, a viewer) reads any conformant bundle without knowing its producer.

The pool under `data/` was YAML: one entity per file for sources, concepts,
statements, axes and views; claims as lists, one file per extraction package;
edges as lists of tuples `[from, kind, to, props]` without a stored id, one file
per package or linking pass.

Two ways were weighed: emit an OKF bundle from the pool as a further build
output, or store the pool itself as one. Nothing in the pool violates OKF. A
bundle is conformant when every frontmatter block parses as a YAML mapping
(§11.1); `type` is the one required key; consumers must accept unknown types and
keys at every level (§4.1, §11.2). Every entity already carries `type`
(`concept`, `statement`, `claim`, `source`, `axis`, `view`), and the keys the
pool shares with OKF (`type`, a source's `title` and `license`) mean what OKF
means by them (checked on 2026-11-26). The maintainer chose to store the pool
itself as OKF, the whole pool (#436).

OKF has no typed relation. Its §12.2 defers one ("use links, path fields and
extension keys"), and its link is untyped and directed (§6.1). The literal OKF
way, a typed extension key and a link on the entity a relation starts from,
would make every relation a field of an entity, which the pool excludes
(memory `relations-are-edges-not-fields`), and would write into claims, which
are immutable (spec §7), whenever a statement was linked to one.

## Decision

- **`data/` is an OKF v0.3 bundle**, and the pool's only store. The schema
  (`schema/schema.yaml`) stays the one schema: it checks each file's
  frontmatter. Nothing about the model changes: not what an entity means, not
  an id, not a canonical form.
- **One entity, one file:** `data/<namespace>/<entity-id>.md`, so that the file's
  path below `data/` is the entity's id plus `.md`, which is OKF's concept id
  (§2). Its frontmatter is the entity as stored before, its keys unchanged and
  unprefixed: OKF's advice to name own keys `x-<producer>-<name>` is a SHOULD,
  and the keys are the schema's.
- **An edge is an entity of `type: edge`** with the keys `id`, `from`, `kind`,
  `to` and its properties as before. Its id is derived from its tuple, like a
  claim's from its anchor: `edges/<first 8 hex of
  sha256("<from>|<kind>|<to>|<discriminator>")>`, the discriminator empty when
  the edge has none; the validator computes and checks it. All edges are in one
  directory, `data/edges/`, because the tuple names no source to group by.
- **A claim records its printed order** as `order`: an integer, its place among
  the claims of its page, top to bottom. With one file per claim, the order of a
  box's sentences can no longer be read from the order of a list (#384). A
  claim's id hashes only its locator and its quote, so no id changes.
- **A file's body is generated** from its frontmatter: the Markdown links to the
  entities it refers to, which make the pool's graph visible to an OKF consumer
  (§6.1, §6.4), with words that name the relation (an edge's kind). It is never
  authored, never part of the canonical form or any hash, and the validator
  checks that it equals the generator's output. It stays empty until the
  generator exists (#439).
- **`data/index.md` declares the bundle** (§8.1): `okf_version: "0.3"`, a title,
  a description and the licence. `data/README.md` has no frontmatter, so OKF does
  not count it as a concept (§3.2), and it stays.
- **OKF conformance is checked by the Rust tool `okf`** (W4G1/okf, Apache-2.0),
  the one Rust implementation of v0.3, pinned to an exact version and run by
  `tools/validate.py` and in CI. Python does not repeat a check the tool makes;
  it keeps what OKF does not know: the schema, ids, hashes and the cross-file
  rules. Installing it needs crates.io in the sandbox and a Rust toolchain in
  CI, both a person's steps (#440).

### How the pool maps onto OKF

| the pool | in the bundle |
|---|---|
| an entity `<namespace>/<id>` | the concept `data/<namespace>/<id>.md` |
| an entity's `type` | OKF's required `type` |
| a source's `title`, `license` | OKF's `title`; `license` as extension key on a concept (OKF defines it on the bundle) |
| every other key | an extension key (OKF §4.1), checked by the schema |
| an edge `(from, kind, to, props)` | the concept `data/edges/<hash>.md` of `type: edge`; its two ends as links in its body |
| a reference to another entity | a link in the body (generated) |
| a view, an axis | a concept each, as stored |
| the pool | the bundle; `data/index.md` its root |

OKF's optional families stay empty: `generated` and `verified` (trust), `status`,
`superseded_by` and `stale_after` (lifecycle), `sources` (provenance) and
`description`. The pool says these things in its own terms: provenance as a
locator and a verbatim quote, review as attestations over content hashes,
staleness as a hash that changed. OKF's timestamp-based trust tier would read
an attestation differently from the pool (memory `staleness-and-verification`).
Filling them in OKF's terms would be a later decision, not a side effect of this
one.

## Consequences

- An OKF consumer can read graph.med's pool: every entity, every claim with its
  quote, and every relation as a link.
- A data diff is many small files: an extraction that wrote one chapter file
  writes one file per claim and per edge. The extraction parts keep their names
  as units of work (`data/README.md`), no longer as files.
- The tools read frontmatter instead of YAML documents (#438), and the
  schema's edge is a mapping instead of a tuple.
- OKF is pre-1.0: a minor version may break (OKF §12; 0.3 has two breaking
  changes against 0.2). The pool declares the version it uses, and moving to a
  newer one is a card of its own.
- What an agent writes to `data/` is a Markdown file with frontmatter. The
  skills and the judge name the new paths.
