// The six tools, as plain functions of a Layer 0 reader and their arguments.
// They return plain objects; server.js registers them on an MCP server. Web-
// standard APIs only, no transport, no Node module (ADR-0007): the same code
// serves any entry point. Nothing here names a graph, a grouping, an axis or a
// slot, and nothing assumes what the first grouping groups by: the tools rely
// only on the tree shape every grouping shares (docs/publication.md §8).

import { InputError } from './layer0.js';
import * as words from './descriptions.js';

// Items per list in one result; a longer list returns `next_offset`. A
// result that would exceed MAX_CHARS is cut to the smaller sizes (fitted).
export const PAGE = 50;
const PAGE_SIZES = [PAGE, 20, 8];
// The longest verbatim quote the provenance tool returns, in characters.
export const QUOTE_CAP = 100;
// get_tree_node's deepest subtree, and the size a result is kept under.
export const MAX_DEPTH = 3;
export const MAX_CHARS = 45000;

// --- metadata carried by every result -------------------------------------

function about({ commit, meta, sources, repositoryLicense, provenance, verbatim = false }) {
  const out = {
    commit: commit ?? meta?.commit ?? null,
    review: meta?.review ?? null,
    review_note: words.about.review,
    repository_license: repositoryLicense ?? meta?.repository_license ?? null,
    sources: (sources ?? meta?.sources ?? []).map((s) => ({ id: s.id, license: s.license ?? null })),
    license_note: words.about.license,
    provenance: provenance ?? meta?.provenance ?? null,
    intended_use: words.intendedUse,
    ai_disclosure: words.aiDisclosure,
    verbatim_source_text: verbatim ? words.about.verbatimProvenance : words.about.verbatim,
  };
  if (verbatim) out.quote_cap = QUOTE_CAP;
  return out;
}

function graphRef(v) {
  return { id: v.id, title: v.title, lang: v.lang, url: v.url };
}

// The site's deep link to a position: the view's page as the index gives it,
// `?by=<axis>` unless the grouping is the view's first, `#<id>[,<id>]` for the
// entities named (docs/publication.md §3, §8).
export function deepLink(v, axis, ids = []) {
  const first = v.groupings.length ? v.groupings[0].axis : axis;
  let link = v.url;
  if (axis !== undefined && axis !== null && axis !== first) link += '?by=' + encodeURIComponent(axis);
  const named = ids.filter(Boolean);
  if (named.length) link += '#' + named.join(',');
  return link;
}

function page(list, offset, size = PAGE) {
  const start = Math.max(0, offset | 0);
  const items = list.slice(start, start + size);
  return { items, total: list.length, next: start + size < list.length ? start + size : null };
}

// The result at the largest page size that keeps it under MAX_CHARS: built
// once at PAGE, then cut to the smaller sizes (`cut(result, size)`) until one
// fits, never rebuilt — a Worker request has 10 ms of CPU (#279).
function fitted(full, cut) {
  let result = full;
  for (const size of PAGE_SIZES) {
    result = size === PAGE ? full : cut(full, size);
    if (JSON.stringify(result).length <= MAX_CHARS) break;
  }
  return result;
}

// --- parsed files, indexed once per file ------------------------------------

const indexed = new WeakMap();

function once(obj, build) {
  let x = indexed.get(obj);
  if (!x) {
    x = build(obj);
    indexed.set(obj, x);
  }
  return x;
}

function treeIndex(tree) {
  return once(tree, (t) => {
    const nodes = new Map(t.nodes.map((n) => [n.id, n]));
    const out = new Map();
    const into = new Map();
    for (const e of t.edges) {
      if (!out.has(e.from)) out.set(e.from, []);
      out.get(e.from).push(e);
      if (!into.has(e.to)) into.set(e.to, []);
      into.get(e.to).push(e);
    }
    return { nodes, out, into, root: t.nodes.find((n) => n.type === 'root') };
  });
}

function searchIndex(search) {
  return once(search, (s) => new Map(s.entries.map((e) => [e.id, e])));
}

// --- context: a view, its per-view file, a grouping --------------------------

async function viewContext(L, graph) {
  const index = await L.index();
  const v = await L.view(graph);
  const lean = await L.get(v.lean);
  return { index, v, lean };
}

function groupingOf(v, axis) {
  if (axis === undefined || axis === null) {
    if (!v.groupings.length) throw new InputError(`${v.id} lists no grouping`);
    return { g: v.groupings[0], position: 0 };
  }
  const position = v.groupings.findIndex((g) => g.axis === axis);
  if (position < 0)
    throw new InputError(
      `${v.id} has no grouping ${JSON.stringify(axis)}; its groupings: ${v.groupings.map((g) => JSON.stringify(g.axis)).join(', ')}`,
    );
  return { g: v.groupings[position], position };
}

function groupingRef(g, position) {
  return { axis: g.axis, label: g.label, short_label: g.short_label ?? null, kind: g.kind, default: position === 0 };
}

// --- summaries ---------------------------------------------------------------

// A node names an entity when it has a `ref` and is not the root (whose `ref`
// is the view's first source, which the page's hash does not select).
function namedEntity(n) {
  return n && n.type !== 'root' && n.ref ? n.ref : null;
}

function statementSummary(L, S, v, axis, id) {
  const e = S.get(id);
  const out = { id, url: L.entityUrl(id) };
  if (e) {
    out.label = e.short_label ?? e.label ?? null;
    out.lang = e.lang;
    out.direction = e.direction ?? null;
    out.grade = e.grade ?? null;
    out.verb = e.verb ?? null;
  } else {
    out.missing_from_search_file = true;
  }
  out.link = deepLink(v, axis, [id]);
  return out;
}

function conceptSummary(L, S, id) {
  const e = S.get(id);
  const out = { id, url: L.entityUrl(id), label: e?.label ?? null };
  if (e?.short_label) out.short_label = e.short_label;
  return out;
}

function nodeSummary(L, S, v, axis, n) {
  if (!n) return null;
  if (n.type === 'statement') return { type: 'statement', ...statementSummary(L, S, v, axis, n.id) };
  const out = { id: n.id, type: n.type };
  if (n.type === 'junction') {
    out.label = n.group ?? null;
    out.recommendations_below = /^\d+$/.test(n.label ?? '') ? Number(n.label) : null;
  } else {
    out.label = n.label ?? null;
  }
  if (n.lang) out.lang = n.lang;
  const ent = namedEntity(n);
  if (ent) {
    out.entity = ent;
    out.url = L.entityUrl(ent);
  }
  out.link = deepLink(v, axis, ent ? [ent] : []);
  return out;
}

// --- get_tree_node -----------------------------------------------------------

function nodeDetail(L, ctx, n, depth, offset) {
  const { v, g, T, S } = ctx;
  const axis = g.axis;
  const out = nodeSummary(L, S, v, axis, n);
  if (n.type === 'statement') {
    const tn = T.nodes.get(n.id);
    if (tn.no) out.no = tn.no;
    if (tn.contested) out.contested = true;
  }

  // Parents: the nodes whose flow, answer or aim edge leads here.
  out.parents = (T.into.get(n.id) || [])
    .filter((e) => e.kind !== 'relation')
    .map((e) => ({
      node: nodeSummary(L, S, v, axis, T.nodes.get(e.from)),
      edge: e.kind,
      ...(e.kind === 'answer' ? { answer: e.label ?? null, refs: (e.refs || []).map((r) => conceptSummary(L, S, r)) } : {}),
    }));

  const outs = T.out.get(n.id) || [];
  let next = null;
  const track = (p) => {
    if (p.next !== null) next = next === null ? p.next : Math.min(next, p.next);
  };

  // The question asked here, and its answers.
  const questions = questionsAt(T, n);
  out.asks = questions.map((q) => {
    const answers = (T.out.get(q.id) || []).filter((e) => e.kind === 'answer');
    const p = page(answers, offset, ctx.size);
    track(p);
    return {
      question: { id: q.id, label: q.label ?? null, lang: q.lang ?? null },
      answers: p.items.map((e) => ({
        answer: e.label ?? null,
        refs: (e.refs || []).map((r) => conceptSummary(L, S, r)),
        to: nodeSummary(L, S, v, axis, T.nodes.get(e.to)),
      })),
      answers_total: p.total,
    };
  });

  // The recommendations hung under this node, with their aims.
  const recs = outs.filter((e) => e.kind === 'flow').map((e) => T.nodes.get(e.to)).filter((m) => m.type === 'statement');
  const pr = page(recs, offset, ctx.size);
  track(pr);
  out.recommendations = pr.items.map((m) => ({ ...statementSummary(L, S, v, axis, m.id), aims: aimsOf(L, ctx, m.id) }));
  out.recommendations_total = pr.total;

  // The recommendations that apply here generally: the junction's `general`
  // ids, with `via` and condition from the search file's concept entry.
  if (Array.isArray(n.general)) {
    const ids = new Set(n.general);
    const entry = S.get(n.ref);
    const entries = (entry?.general || []).filter((x) => ids.has(x.id));
    const found = new Set(entries.map((x) => x.id));
    const gen = [
      ...entries.map((x) => ({
        ...statementSummary(L, S, v, axis, x.id),
        anchor: x.anchor ? conceptSummary(L, S, x.anchor) : null,
        via: x.via ? conceptSummary(L, S, x.via) : null,
        condition: (x.condition || []).map((c) => conceptSummary(L, S, c)),
        aims: aimsOf(L, ctx, x.id),
      })),
      ...n.general.filter((id) => !found.has(id)).map((id) => ({ ...statementSummary(L, S, v, axis, id), via_and_condition_not_in_layer0: true })),
    ];
    const pg = page(gen, offset, ctx.size);
    track(pg);
    out.general = pg.items;
    out.general_total = pg.total;
  }

  if (n.type === 'statement') {
    out.aims = aimsOf(L, ctx, n.id);
    out.relations = [
      ...outs.filter((e) => e.kind === 'relation').map((e) => ({ relation: e.label, direction: 'out', other: statementSummary(L, S, v, axis, e.to) })),
      ...(T.into.get(n.id) || []).filter((e) => e.kind === 'relation').map((e) => ({ relation: e.label, direction: 'in', other: statementSummary(L, S, v, axis, e.from) })),
    ];
  }
  if (next !== null) out.next_offset = next;

  if (depth > 0) out.below = belowIds(T, n, offset, ctx.size).map((id) => nodeDetail(L, { ...ctx, size: PAGE }, T.nodes.get(id), depth - 1, 0));
  return out;
}

// The questions asked at a node: itself, or those its flow edges lead to.
function questionsAt(T, n) {
  return n.type === 'question' ? [n] : (T.out.get(n.id) || []).filter((e) => e.kind === 'flow').map((e) => T.nodes.get(e.to)).filter((m) => m.type === 'question');
}

// The nodes one level below: where the answers on this page lead, once each.
function belowIds(T, n, offset, size) {
  const out = [];
  const seen = new Set();
  for (const q of questionsAt(T, n))
    for (const e of page((T.out.get(q.id) || []).filter((x) => x.kind === 'answer'), offset, size).items)
      if (!seen.has(e.to)) {
        seen.add(e.to);
        out.push(e.to);
      }
  return out;
}

// A node's detail at a smaller page size, cut from the detail built at PAGE
// from the same offset: a page is a prefix of a longer one, so this is what
// building at that size gives, `next_offset` included. Keys keep their order.
function cutNode(out, offset, size) {
  const start = Math.max(0, offset | 0);
  let next = null;
  const track = (total) => {
    if (start + size < total) next = next === null ? start + size : Math.min(next, start + size);
  };
  const cut = { ...out };
  cut.asks = out.asks.map((a) => {
    track(a.answers_total);
    return { ...a, answers: a.answers.slice(0, size) };
  });
  track(out.recommendations_total);
  cut.recommendations = out.recommendations.slice(0, size);
  if (out.general) {
    track(out.general_total);
    cut.general = out.general.slice(0, size);
  }
  if (next !== null) cut.next_offset = next;
  else delete cut.next_offset;
  return cut;
}

function aimsOf(L, ctx, statementId) {
  const { v, g, T, S } = ctx;
  return (T.out.get(statementId) || [])
    .filter((e) => e.kind === 'aim')
    .map((e) => {
      const a = T.nodes.get(e.to);
      return { id: a.id, label: a.label ?? null, url: L.entityUrl(a.id), link: deepLink(v, g.axis, [a.id]) };
    });
}

// The nodes of a grouping that name an entity: by `ref`, else those an answer
// naming it in `refs` leads to (the site's own rule, docs/publication.md §4).
function nodesNaming(T, id) {
  const byRef = [...T.nodes.values()].filter((n) => namedEntity(n) === id);
  if (byRef.length) return byRef;
  const seen = new Set();
  const out = [];
  for (const [, es] of T.out)
    for (const e of es)
      if (e.kind === 'answer' && (e.refs || []).includes(id) && !seen.has(e.to)) {
        seen.add(e.to);
        out.push(T.nodes.get(e.to));
      }
  return out;
}

export async function getTreeNode(L, { graph, grouping, node, depth = 0, offset = 0 }) {
  const { index, v, lean } = await viewContext(L, graph);
  const { g, position } = groupingOf(v, grouping);
  const [tree, search] = await Promise.all([L.get(g.tree), L.get(v.search)]);
  const T = treeIndex(tree);
  const S = searchIndex(search);
  const ctx = { v, g, T, S, size: PAGE };
  const base = {
    graph: graphRef(v),
    grouping: groupingRef(g, position),
  };
  const meta = about({ commit: tree.commit, meta: lean.meta, sources: v.sources, repositoryLicense: index.repository_license });

  let n;
  if (node === undefined || node === null || node === '') n = T.root;
  else if (T.nodes.has(node)) n = T.nodes.get(node);
  else {
    const id = L.entityId(node);
    const found = nodesNaming(T, id);
    if (!found.length) throw new InputError(`${id} names no node of grouping ${JSON.stringify(g.axis)} of ${v.id}`);
    if (found.length > 1) {
      return {
        ...base,
        entity: id,
        places: found.map((m) => ({
          node: nodeSummary(L, S, v, g.axis, m),
          parents: (T.into.get(m.id) || []).filter((e) => e.kind !== 'relation').map((e) => ({
            node: nodeSummary(L, S, v, g.axis, T.nodes.get(e.from)),
            edge: e.kind,
            ...(e.kind === 'answer' ? { answer: e.label ?? null } : {}),
          })),
        })),
        note: words.about.places,
        about: meta,
      };
    }
    n = found[0];
  }
  const d = Math.max(0, Math.min(MAX_DEPTH, depth | 0));
  return fittedTree(L, ctx, base, meta, n, d, offset);
}

// The deepest subtree, and the largest page size, that keep the result under
// MAX_CHARS — the first that fits, trying depth d down to 0 and at each depth
// the sizes of PAGE_SIZES in turn, with `depth_reduced_to` when the depth was
// lowered. Each node's detail is built and serialised once, and each
// candidate's length is added up from those, not by building and
// serialising the candidate: a Worker request has 10 ms of CPU (#279).
// A grouping's node details at PAGE from offset 0, and their subtrees'
// JSON lengths, kept with its parsed tree file and search file: they depend
// on nothing else, and are the same for every call on them.
const detailCaches = new WeakMap();

function detailCache(T, S) {
  let c = detailCaches.get(T);
  if (!c || c.S !== S) detailCaches.set(T, (c = { S, flat: new Map(), lengths: new Map() }));
  return c;
}

function fittedTree(L, ctx, base, meta, n, d, offset) {
  const { T, S } = ctx;
  const { flat, lengths } = detailCache(T, S); // node id -> [detail at PAGE from 0, its JSON length]; `${id}|${depth}` -> JSON length of its subtree
  const flatOf = (id) => {
    if (!flat.has(id)) {
      const x = nodeDetail(L, ctx, T.nodes.get(id), 0, 0);
      flat.set(id, [x, JSON.stringify(x).length]);
    }
    return flat.get(id);
  };
  // {…x, below: [c1, …]} is x's JSON without its '}', then ,"below":[…]} .
  const withBelow = (len, parts) => len - 1 + ',"below":['.length + parts.reduce((a, b) => a + b, 0) + Math.max(0, parts.length - 1) + 2;
  const subLength = (id, depth) => {
    const key = `${id}|${depth}`;
    if (!lengths.has(key)) {
      const [, len] = flatOf(id);
      lengths.set(key, depth === 0 ? len : withBelow(len, belowIds(T, T.nodes.get(id), 0, PAGE).map((c) => subLength(c, depth - 1))));
    }
    return lengths.get(key);
  };
  const subtree = (id, depth) => {
    const [x] = flatOf(id);
    return depth === 0 ? x : { ...x, below: belowIds(T, T.nodes.get(id), 0, PAGE).map((c) => subtree(c, depth - 1)) };
  };

  const top = nodeDetail(L, ctx, n, 0, offset);
  const tops = new Map(PAGE_SIZES.map((size) => {
    const x = size === PAGE ? top : cutNode(top, offset, size);
    return [size, [x, JSON.stringify(x).length]];
  }));
  const topLength = (size, k) => {
    const [, len] = tops.get(size);
    return k === 0 ? len : withBelow(len, belowIds(T, n, offset, size).map((c) => subLength(c, k - 1)));
  };
  const frame = JSON.stringify({ ...base, node: 0, about: meta }).length - 1;
  const reduced = (k) => (k < d ? ',"depth_reduced_to":'.length + String(k).length : 0);

  let size;
  let k;
  for (k = d; k >= 0; k--) {
    size = PAGE_SIZES.find((s) => frame + topLength(s, k) <= MAX_CHARS) ?? PAGE_SIZES[PAGE_SIZES.length - 1];
    if (frame + topLength(size, k) + reduced(k) <= MAX_CHARS) break;
  }
  if (k < 0) k = 0;
  const [x] = tops.get(size);
  const node = k === 0 ? x : { ...x, below: belowIds(T, n, offset, size).map((c) => subtree(c, k - 1)) };
  const result = { ...base, node, about: meta };
  if (k < d) result.depth_reduced_to = k;
  return result;
}

// --- list_graphs, list_groupings ---------------------------------------------

function groupingEntry(v, g, position) {
  return {
    ...groupingRef(g, position),
    lang: g.lang ?? null,
    question: g.question ?? null,
    tree: g.tree,
    link: deepLink(v, g.axis),
  };
}

export async function listGraphs(L, { offset = 0 } = {}) {
  const index = await L.index();
  const p = page(index.views, offset);
  const leans = await Promise.all(p.items.map((v) => L.get(v.lean)));
  return {
    graphs: p.items.map((v, i) => ({
      ...graphRef(v),
      holds: v.holds ?? null,
      root: v.root ? { id: v.root.id, url: L.entityUrl(v.root.id) } : null,
      sources: v.sources.map((s) => ({
        id: s.id,
        title: s.title,
        lang: s.lang,
        page: s.page,
        document: s.url,
        ...(s.awmf_register ? { awmf_register: s.awmf_register } : {}),
        license: s.license ?? null,
      })),
      groupings: v.groupings.map((g, k) => ({ axis: g.axis, label: g.label, kind: g.kind, default: k === 0 })),
      review: leans[i].meta?.review ?? null,
      provenance: leans[i].meta?.provenance ?? null,
    })),
    total: p.total,
    ...(p.next !== null ? { next_offset: p.next } : {}),
    about: about({
      commit: index.commit,
      meta: { review: [...new Set(leans.map((l) => l.meta?.review ?? null))].join(', ') || null },
      sources: p.items.flatMap((v) => v.sources),
      repositoryLicense: index.repository_license,
      provenance: { kind: 'modelling', note: words.about.graphProvenance },
    }),
  };
}

export async function listGroupings(L, { graph }) {
  const { index, v, lean } = await viewContext(L, graph);
  return {
    graph: graphRef(v),
    root: v.root ? { id: v.root.id, url: L.entityUrl(v.root.id) } : null,
    groupings: v.groupings.map((g, k) => groupingEntry(v, g, k)),
    about: about({ commit: index.commit, meta: lean.meta, sources: v.sources, repositoryLicense: index.repository_license }),
  };
}

// --- get_entity --------------------------------------------------------------

function viewsFor(index, meta, graphView) {
  const ids = new Set((meta?.views || []).map((x) => x.id));
  const views = index.views.filter((v) => ids.has(v.id));
  if (graphView) {
    if (!ids.has(graphView.id)) throw new InputError(`not a member of ${graphView.id}`);
    return [graphView];
  }
  return views;
}

function sameText(a, b) {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  return n(a) !== '' && n(a) === n(b);
}

function pageOf(at) {
  const m = /#page=(\d+)/.exec(at || '');
  return m ? m[1] : null;
}

export async function getEntity(L, { entity, graph, offset = 0 }) {
  const id = L.entityId(entity);
  const index = await L.index();
  const graphView = graph ? await L.view(graph) : null;
  const e = await L.entity(id);
  const views = viewsFor(index, e.meta, graphView);
  const searches = await Promise.all(views.map((v) => L.get(v.search)));
  const meta = about({ meta: e.meta, repositoryLicense: index.repository_license });

  if (e.type === 'statement') {
    // The claims behind it, read for the quote gate only (statementEntity).
    const claimIds = (e.edges?.in || []).filter((x) => x.kind === 'supports' || x.kind === 'contests').map((x) => x.from);
    const claims = await Promise.all(claimIds.map((c) => L.entity(c).catch(() => null)));
    return statementEntity(L, e, views, searches, meta, claims.filter(Boolean));
  }
  if (e.type === 'concept') return fitted(conceptEntity(L, e, views, searches, meta, offset, PAGE), (x, size) => cutConcept(x, offset, size));
  if (e.type === 'claim') return claimEntity(L, e, views, searches, meta);
  throw new InputError(`${id} is a ${e.type}; this tool reads a recommendation, a concept or a claim`);
}

// Every quoted string of an entity: its `quote`s, outside `meta`.
function quotedStrings(o, out = []) {
  if (Array.isArray(o)) o.forEach((x) => quotedStrings(x, out));
  else if (o && typeof o === 'object')
    for (const [k, v] of Object.entries(o)) {
      if (k === 'meta') continue;
      if (k === 'quote' && typeof v === 'string') out.push(v);
      else quotedStrings(v, out);
    }
  return out;
}

function statementEntity(L, e, views, searches, meta, claimDocs) {
  const card = e.card || {};
  // The wording is withheld where it carries source text: a claim sentence,
  // or a quote of the claims behind it, word for word.
  const claimLabels = (card.wortlaut || []).map((w) => w.label);
  const values = (c) => new Set([c.grade, c.verb, c.consensus].filter(Boolean).map((x) => x.toLowerCase()));
  const cardQuotes = [
    ...(card.beleg?.sources || []).flatMap((s) => (s.claims || []).map((c) => c.quote)),
    ...claimDocs.flatMap((c) => [c.label, ...quotedStrings(c).filter((q) => !values(c).has(q.toLowerCase()))]),
  ].filter(Boolean);
  const norm = (x) => (x || '').replace(/\s+/g, ' ').trim();
  const withheld =
    claimLabels.some((l) => sameText(l, e.label) || norm(e.label).includes(norm(l))) ||
    cardQuotes.some((q) => norm(e.label).includes(norm(q)));
  const u = card.urteil || {};
  const slotLabels = card.mehr?.slots || {};
  const slots = {};
  for (const [slot, val] of Object.entries(e.slots || {})) {
    const ids = Array.isArray(val) ? val : [val];
    slots[slot] = ids.map((cid) => ({
      id: cid,
      label: slotLabels[slot]?.id === cid ? slotLabels[slot].label : (searches.map((s) => searchIndex(s).get(cid)).find(Boolean)?.label ?? null),
      url: L.entityUrl(cid),
    }));
  }
  const claims = [];
  for (const src of card.beleg?.sources || [])
    for (const c of src.claims || [])
      claims.push({ id: c.id, url: L.entityUrl(c.id), source: src.id, page: c.page ?? null, section: c.section ?? null, recommendation_no: c.recommendation_no ?? null });
  const edgesIn = e.edges?.in || [];
  const edgesOut = e.edges?.out || [];
  const kindOf = new Map(edgesIn.filter((x) => x.kind === 'supports' || x.kind === 'contests').map((x) => [x.from, x.kind]));
  for (const c of claims) c.edge = kindOf.get(c.id) ?? null;

  const perView = views.map((v, i) => {
    const S = searchIndex(searches[i]);
    const first = v.groupings[0]?.axis;
    const related = [
      ...edgesOut.filter((x) => x.kind === 'specializes' || x.kind === 'complements').map((x) => ({ relation: x.kind, direction: 'out', id: x.to, source: x.source ?? null })),
      ...edgesIn.filter((x) => x.kind === 'specializes' || x.kind === 'complements').map((x) => ({ relation: x.kind, direction: 'in', id: x.from, source: x.source ?? null })),
    ]
      .filter((r) => S.has(r.id))
      .map((r) => ({ relation: r.relation, direction: r.direction, edge_source: r.source, other: statementSummary(L, S, v, first, r.id) }));
    return { graph: graphRef(v), link: deepLink(v, first, [e.id]), related };
  });

  return {
    entity: {
      id: e.id,
      type: 'statement',
      url: e.meta?.url ?? L.entityUrl(e.id),
      lang: e.lang,
      short_label: e.short_label ?? card.title ?? null,
      wording: withheld ? null : e.label,
      wording_source: e.source ?? null,
      ...(withheld ? { wording_withheld: words.about.wordingWithheld } : {}),
      direction: u.direction ?? null,
      verbs: u.verbs ?? [],
      grades: (u.badges || []).map((b) => ({ source: b.source, grade: b.grade ?? null, consensus: b.consensus ?? null, share: b.share ?? null, claims: b.count ?? null })),
      contested: u.umstritten ?? false,
      slots,
      claims,
      questions: card.questions ?? null,
    },
    graphs: perView,
    about: meta,
  };
}

function conceptEntity(L, e, views, searches, meta, offset, size) {
  let next = null;
  const track = (p) => {
    if (p.next !== null) next = next === null ? p.next : Math.min(next, p.next);
  };
  const perView = views.map((v, i) => {
    const S = searchIndex(searches[i]);
    const st = e.statements?.[v.id] || {};
    const first = v.groupings[0]?.axis;
    const held = page(st.held_by || [], offset, size);
    const own = page(st.own || [], offset, size);
    const gen = page(st.general || [], offset, size);
    [held, own, gen].forEach(track);
    const where = e.appears_in?.[v.id] || {};
    return {
      graph: graphRef(v),
      held_by: held.items.map((h) => ({ slot: h.slot, ...statementSummary(L, S, v, first, h.id) })),
      held_by_total: held.total,
      ...(st.own ? { own: own.items.map((id) => statementSummary(L, S, v, first, id)), own_total: own.total } : {}),
      ...(st.general
        ? {
            general: gen.items.map((x) => ({
              ...statementSummary(L, S, v, first, x.id),
              anchor: x.anchor ? conceptSummary(L, S, x.anchor) : null,
              via: x.via ? conceptSummary(L, S, x.via) : null,
              condition: (x.condition || []).map((c) => conceptSummary(L, S, c)),
            })),
            general_total: gen.total,
          }
        : {}),
      appears_in: v.groupings
        .map((g, k) => ({ g, k }))
        .filter(({ g }) => Array.isArray(where[g.axis]) && where[g.axis].length)
        .map(({ g, k }) => ({
          grouping: groupingRef(g, k),
          nodes: where[g.axis].map((nid) => ({ node: nid, link: deepLink(v, g.axis, [e.id]) })),
        })),
    };
  });
  const out = {
    entity: {
      id: e.id,
      type: 'concept',
      url: e.meta?.url ?? L.entityUrl(e.id),
      label: e.label ?? null,
      ...(e.short_label ? { short_label: e.short_label } : {}),
      lang: e.lang,
      facet: e.facet ?? null,
      source: typeof e.source === 'string' ? e.source : sourceRefs(e.source),
      derivation: e.derivation ?? null,
      ...(e.rule && e.rule.id
        ? { rule: { claim: e.rule.id, url: L.entityUrl(e.rule.id), kind: e.rule.kind ?? null, page: e.rule.page ?? null, section: e.rule.section ?? null } }
        : {}),
    },
    graphs: perView,
    about: meta,
  };
  if (next !== null) out.next_offset = next;
  return out;
}

// A concept's result at a smaller page size, cut from the one built at PAGE
// (see cutNode). Keys keep their order.
function cutConcept(out, offset, size) {
  const start = Math.max(0, offset | 0);
  let next = null;
  const track = (total) => {
    if (start + size < total) next = next === null ? start + size : Math.min(next, start + size);
  };
  const graphs = out.graphs.map((g) => {
    const c = { ...g };
    for (const k of ['held_by', 'own', 'general'])
      if (g[k]) {
        track(g[`${k}_total`]);
        c[k] = g[k].slice(0, size);
      }
    return c;
  });
  const cut = { ...out, graphs };
  if (next !== null) cut.next_offset = next;
  else delete cut.next_offset;
  return cut;
}

// A concept's references, by place only: their quotes are provenance's.
function sourceRefs(src) {
  if (!src) return null;
  const refs = Array.isArray(src) ? src : [src];
  return {
    kind: 'sourced',
    references: refs.map((r) => ({ at: r.at ?? null, page: pageOf(r.at) })),
    note: words.about.verbatim,
  };
}

function claimEntity(L, e, views, searches, meta) {
  const supports = (e.edges?.out || []).filter((x) => x.kind === 'supports' || x.kind === 'contests');
  return {
    entity: {
      id: e.id,
      type: 'claim',
      url: e.meta?.url ?? L.entityUrl(e.id),
      lang: e.lang,
      kind: e.kind ?? null,
      at: e.source?.at ?? null,
      page: pageOf(e.source?.at),
      section: e.section ?? null,
      recommendation_no: e.recommendation_no ?? null,
      grade: e.grade ?? null,
      verb: e.verb ?? null,
      consensus: e.consensus ?? null,
      direction: e.direction ?? null,
      text: null,
      text_note: words.about.verbatim,
    },
    graphs: views.map((v, i) => {
      const S = searchIndex(searches[i]);
      const first = v.groupings[0]?.axis;
      return {
        graph: graphRef(v),
        statements: supports.filter((x) => S.has(x.to)).map((x) => ({ edge: x.kind, ...statementSummary(L, S, v, first, x.to) })),
      };
    }),
    about: meta,
  };
}

// --- search --------------------------------------------------------------------

function fold(s) {
  return (s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export async function search(L, { query, graph, limit = 20, offset = 0 }) {
  const words_ = fold(query).split(/\s+/).filter(Boolean);
  if (!words_.length) throw new InputError('no query given');
  const lim = Math.max(1, Math.min(50, limit | 0 || 20));
  const index = await L.index();
  const views = graph ? [await L.view(graph)] : index.views;
  const files = await Promise.all(views.flatMap((v) => [L.get(v.search), L.get(v.lean)]));
  const q = fold(query).trim();
  const groups = views.map((v, i) => {
    const s = files[2 * i];
    const lean = files[2 * i + 1];
    const first = v.groupings[0]?.axis;
    const hits = [];
    for (const e of s.entries) {
      const texts = [e.label, e.short_label].filter(Boolean).map(fold);
      const hay = texts.join(' \u0000 ');
      if (!words_.every((w) => hay.includes(w))) continue;
      let score = 0;
      if (texts.some((t) => t === q)) score += 4;
      if (texts.some((t) => t.startsWith(q))) score += 2;
      if (texts.some((t) => t.includes(q))) score += 1;
      hits.push({ e, score });
    }
    hits.sort((a, b) => b.score - a.score || (a.e.kind === b.e.kind ? 0 : a.e.kind === 'statement' ? -1 : 1) || (a.e.short_label ?? a.e.label ?? '').localeCompare(b.e.short_label ?? b.e.label ?? ''));
    const start = Math.max(0, offset | 0);
    const items = hits.slice(start, start + lim);
    return {
      graph: graphRef(v),
      total: hits.length,
      ...(start + lim < hits.length ? { next_offset: start + lim } : {}),
      hits: items.map(({ e }) => {
        const h = {
          id: e.id,
          kind: e.kind,
          label: e.kind === 'statement' ? e.short_label ?? e.label ?? null : e.label ?? null,
          ...(e.kind === 'concept' && e.short_label ? { short_label: e.short_label } : {}),
          lang: e.lang,
          url: L.entityUrl(e.id),
          link: deepLink(v, first, [e.id]),
        };
        if (e.kind === 'statement') Object.assign(h, { direction: e.direction ?? null, grade: e.grade ?? null, verb: e.verb ?? null });
        if (e.slots) h.slots = e.slots;
        return h;
      }),
      review: lean.meta?.review ?? null,
      sources: v.sources.map((x) => ({ id: x.id, license: x.license ?? null })),
      commit: s.commit ?? null,
    };
  });
  return {
    query,
    groups,
    about: about({
      commit: index.commit,
      meta: { review: [...new Set(groups.map((g) => g.review))].join(', ') || null },
      sources: views.flatMap((v) => v.sources),
      repositoryLicense: index.repository_license,
      provenance: { kind: 'modelling', note: words.about.searchProvenance },
    }),
  };
}

// --- get_provenance -------------------------------------------------------------

function cap(q) {
  if (q.length <= QUOTE_CAP) return { quote: q, truncated: false };
  let cut = q.slice(0, QUOTE_CAP - 1);
  const sp = cut.lastIndexOf(' ');
  if (sp > QUOTE_CAP / 2) cut = cut.slice(0, sp);
  return { quote: cut + '…', truncated: true };
}

// Every object with a `quote` in an entity, outside its `meta` and `edges`,
// with the path of keys that leads to it.
function quotesIn(obj, path = []) {
  const out = [];
  if (Array.isArray(obj)) obj.forEach((x, i) => out.push(...quotesIn(x, [...path, i])));
  else if (obj && typeof obj === 'object') {
    if (typeof obj.quote === 'string' && obj.quote) out.push({ path, o: obj });
    for (const [k, v] of Object.entries(obj)) {
      if (path.length === 0 && (k === 'meta' || k === 'edges')) continue;
      if (k === 'quote') continue;
      out.push(...quotesIn(v, [...path, k]));
    }
  }
  return out;
}

// Every claim sentence an entity carries, as the site shows it: each object
// outside its `meta` and `edges` that names a claim (`id`) with its `label`,
// the claim itself included, in the order first met; its page and link from
// wherever the entity gives them for that claim. Whole, never capped (the
// maintainer, 2026-09-28: the site publishes every claim's sentence).
function claimSentences(e) {
  const found = new Map();
  const note = (id, o) => {
    const f = found.get(id) || { sentence: null, lang: null, page: null, at: null, link: null };
    if (!f.sentence && typeof o.label === 'string' && o.label) Object.assign(f, { sentence: o.label, lang: o.lang ?? null });
    if (!f.page) f.page = o.page ?? pageOf(o.at) ?? null;
    if (!f.at && o.at) f.at = o.at;
    if (!f.link && o.link) f.link = o.link;
    found.set(id, f);
  };
  if (e.type === 'claim') note(e.id, { label: e.label, lang: e.lang, at: e.source?.at, link: e.meta?.provenance?.link });
  (function walk(o, top) {
    if (Array.isArray(o)) return o.forEach((x) => walk(x, false));
    if (!o || typeof o !== 'object') return;
    if (!top && typeof o.id === 'string' && o.id.startsWith('claims/')) note(o.id, o);
    for (const [k, v] of Object.entries(o)) if (!(top && (k === 'meta' || k === 'edges'))) walk(v, false);
  })(e, true);
  return [...found].filter(([, f]) => f.sentence);
}

export async function getProvenance(L, { entity, graph }) {
  const id = L.entityId(entity);
  const index = await L.index();
  const graphView = graph ? await L.view(graph) : null;
  const e = await L.entity(id);
  if (!['claim', 'statement', 'concept'].includes(e.type))
    throw new InputError(`${id} is a ${e.type}; provenance reads a claim, a recommendation or a concept`);
  const views = viewsFor(index, e.meta, graphView);
  const documents = new Map(index.views.flatMap((v) => v.sources.map((s) => [s.id, s.url])));
  const seen = new Set();
  const quotes = [];
  for (const { path, o } of quotesIn(e)) {
    const at = o.at ?? null;
    const pg = o.page ?? pageOf(at);
    let link = o.link ?? null;
    if (!link && e.type === 'claim' && o === e.source) link = e.meta?.provenance?.link ?? null;
    const key = o.quote + '|' + pg;
    if (seen.has(key)) continue;
    seen.add(key);
    const src = (at || '').split('#')[0] || null;
    quotes.push({
      ...cap(o.quote),
      of: path.filter((p) => typeof p === 'string').join('.') || 'source',
      ...(o.id ? { claim: o.id, claim_url: L.entityUrl(o.id) } : {}),
      page: pg ?? null,
      ...(at ? { at } : {}),
      link,
      ...(!link && src && documents.has(src) ? { document: documents.get(src) } : {}),
    });
  }
  const sentences = claimSentences(e).map(([id, f]) => {
    const src = (f.at || '').split('#')[0] || null;
    return {
      claim: id,
      claim_url: L.entityUrl(id),
      sentence: f.sentence,
      lang: f.lang,
      page: f.page,
      link: f.link,
      ...(!f.link && src && documents.has(src) ? { document: documents.get(src) } : {}),
    };
  });
  return {
    entity: { id: e.id, type: e.type, url: e.meta?.url ?? L.entityUrl(e.id) },
    graphs: views.map(graphRef),
    ...(e.type === 'claim' ? { anchored_at: e.meta?.provenance?.at ?? e.source?.at ?? null } : {}),
    sentences,
    quotes,
    about: about({ meta: e.meta, repositoryLicense: index.repository_license, verbatim: true }),
  };
}

export const handlers = {
  list_graphs: listGraphs,
  list_groupings: listGroupings,
  get_tree_node: getTreeNode,
  get_entity: getEntity,
  search,
  get_provenance: getProvenance,
};
