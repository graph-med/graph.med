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
// get_tree_node's deepest subtree, and the size a result is kept under: in
// the full form, and in the compact form, each by paging (fitted).
export const MAX_DEPTH = 3;
export const MAX_CHARS = 45000;
export const COMPACT_MAX_CHARS = 24000;
// The most recommendations of a chain (get_entity's `sequence.chain`) one
// result returns: those nearest to the recommendation asked for, by steps.
export const MAX_CHAIN = 25;

// A result's form, the `detail` argument: `compact` by default, or `full`.
// The compact form keeps every id, label, entity URL and deep link of an
// item, the direction, grade and verb, the places and depths, and the whole
// metadata; it leaves out what the full form repeats: a concept named inside
// another item is its id and label only (its own call gives its URL), a
// language equal to the graph's, an empty list of aims, an answer's concepts
// where they are just the node it leads to, and a search hit's slots.
export const FORMS = ['compact', 'full'];
function formOf(detail) {
  if (detail === undefined || detail === null) return 'compact';
  if (!FORMS.includes(detail)) throw new InputError(`detail is ${FORMS.join(' or ')}, not ${JSON.stringify(detail)}`);
  return detail;
}
const limitOf = (form) => (form === 'full' ? MAX_CHARS : COMPACT_MAX_CHARS);

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
    disclaimer: words.disclaimer,
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

// The result at the largest page size that keeps it under `limit` (the
// form's): built once at PAGE, then cut to the smaller sizes (`cut(result,
// size)`) until one fits, never rebuilt — a Worker request has 10 ms of CPU
// (#279).
function fitted(full, cut, limit = MAX_CHARS) {
  let result = full;
  for (const size of PAGE_SIZES) {
    result = size === PAGE ? full : cut(full, size);
    if (JSON.stringify(result).length <= limit) break;
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

// A tree file indexed: its nodes, edges out of and into each node, the root,
// each node's depth and each edge's place.
// - depth: how many answers lie between the root and the node — the questions
//   answered to reach it — on its shortest path (relations not followed).
// - place: an edge's target's place among its siblings, `{n, of}`, counted
//   from 1 in the tree file's order within the group of siblings it belongs to:
//   a question's answers, a node's recommendations, a node's questions, a
//   recommendation's aims (an edge's kind, and for a flow edge the type of
//   what it leads to).
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
    const root = t.nodes.find((n) => n.type === 'root');
    const depth = new Map(root ? [[root.id, 0]] : []);
    const queue = root ? [root.id] : [];
    while (queue.length) {
      const id = queue.shift();
      for (const e of out.get(id) || []) {
        if (e.kind === 'relation' || !nodes.has(e.to)) continue;
        const d = depth.get(id) + (e.kind === 'answer' ? 1 : 0);
        if (depth.has(e.to) && depth.get(e.to) <= d) continue;
        depth.set(e.to, d);
        if (e.kind === 'answer') queue.push(e.to);
        else queue.unshift(e.to);
      }
    }
    const place = new Map();
    for (const es of out.values()) {
      const groups = new Map();
      for (const e of es) {
        if (e.kind === 'relation') continue;
        const key = e.kind === 'flow' ? `flow:${nodes.get(e.to)?.type}` : e.kind;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(e);
      }
      for (const list of groups.values()) list.forEach((e, i) => place.set(e, { n: i + 1, of: list.length }));
    }
    return { nodes, out, into, root, depth, place };
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

// A language is given where the full form is asked for, or where it is not
// the graph's.
const langOf = (lang, v, form) => (lang && (form === 'full' || lang !== v.lang) ? { lang } : {});

function statementSummary(L, S, v, axis, id, form = 'full') {
  const e = S.get(id);
  const out = { id, url: L.entityUrl(id) };
  if (e) {
    out.label = e.short_label ?? e.label ?? null;
    Object.assign(out, langOf(e.lang, v, form));
    out.direction = e.direction ?? null;
    out.grade = e.grade ?? null;
    out.verb = e.verb ?? null;
  } else {
    out.missing_from_search_file = true;
  }
  out.link = deepLink(v, axis, [id]);
  return out;
}

// A concept named inside another item. Compact: its id and its short label
// (its label where it has none); its own call gives the rest.
function conceptSummary(L, S, id, form = 'full') {
  const e = S.get(id);
  if (form === 'compact') return { id, label: e?.short_label ?? e?.label ?? null };
  const out = { id, url: L.entityUrl(id), label: e?.label ?? null };
  if (e?.short_label) out.short_label = e.short_label;
  return out;
}

// T, where given, adds the node's depth (treeIndex).
function nodeSummary(L, S, v, axis, n, form = 'full', T = null) {
  if (!n) return null;
  const depth = T ? { depth: T.depth.get(n.id) ?? null } : {};
  if (n.type === 'statement') return { type: 'statement', ...statementSummary(L, S, v, axis, n.id, form), ...depth };
  const out = { id: n.id, type: n.type };
  if (n.type === 'junction') {
    out.label = n.group ?? null;
    out.recommendations_below = /^\d+$/.test(n.label ?? '') ? Number(n.label) : null;
  } else {
    out.label = n.label ?? null;
  }
  Object.assign(out, langOf(n.lang, v, form));
  const ent = namedEntity(n);
  if (ent) {
    out.entity = ent;
    out.url = L.entityUrl(ent);
  }
  out.link = deepLink(v, axis, ent ? [ent] : []);
  Object.assign(out, depth);
  return out;
}

// The concepts an answer names. Compact: none where they are just the
// entity of the node it leads to, which that node's summary carries.
function answerRefs(L, S, e, to, form) {
  const refs = e.refs || [];
  if (form === 'compact' && refs.length === 1 && refs[0] === namedEntity(to)) return {};
  return { refs: refs.map((r) => conceptSummary(L, S, r, form)) };
}

// --- get_tree_node -----------------------------------------------------------

function nodeDetail(L, ctx, n, depth, offset) {
  const { v, g, T, S, form } = ctx;
  const axis = g.axis;
  const out = nodeSummary(L, S, v, axis, n, form, T);
  if (n.type === 'statement') {
    const tn = T.nodes.get(n.id);
    if (tn.no) out.no = tn.no;
    if (tn.contested) out.contested = true;
  }

  // Parents: the nodes whose flow, answer or aim edge leads here, each with
  // this node's place among that parent's children of its kind.
  out.parents = (T.into.get(n.id) || [])
    .filter((e) => e.kind !== 'relation')
    .map((e) => ({
      node: nodeSummary(L, S, v, axis, T.nodes.get(e.from), form, T),
      edge: e.kind,
      ...(e.kind === 'answer' ? { answer: e.label ?? null, ...answerRefs(L, S, e, n, form) } : {}),
      place: T.place.get(e) ?? null,
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
      question: { id: q.id, label: q.label ?? null, ...(form === 'full' ? { lang: q.lang ?? null } : langOf(q.lang, v, form)) },
      answers: p.items.map((e) => {
        const to = T.nodes.get(e.to);
        return { place: T.place.get(e).n, answer: e.label ?? null, ...answerRefs(L, S, e, to, form), to: nodeSummary(L, S, v, axis, to, form, T) };
      }),
      answers_total: p.total,
    };
  });

  // The recommendations hung under this node, each with its place among
  // them and its depth, and with their aims.
  const recs = outs.filter((e) => e.kind === 'flow' && T.nodes.get(e.to)?.type === 'statement');
  const pr = page(recs, offset, ctx.size);
  track(pr);
  out.recommendations = pr.items.map((e) => ({
    place: T.place.get(e).n,
    ...statementSummary(L, S, v, axis, e.to, form),
    depth: T.depth.get(e.to) ?? null,
    ...aimsField(L, ctx, e.to),
  }));
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
        ...statementSummary(L, S, v, axis, x.id, form),
        anchor: x.anchor ? conceptSummary(L, S, x.anchor, form) : null,
        via: x.via ? conceptSummary(L, S, x.via, form) : null,
        ...conditionField(L, S, x.condition, form),
        ...aimsField(L, ctx, x.id),
      })),
      ...n.general.filter((id) => !found.has(id)).map((id) => ({ ...statementSummary(L, S, v, axis, id, form), via_and_condition_not_in_layer0: true })),
    ];
    const pg = page(gen, offset, ctx.size);
    track(pg);
    out.general = pg.items;
    out.general_total = pg.total;
  }

  if (n.type === 'statement') {
    out.aims = aimsOf(L, ctx, n.id);
    out.relations = [
      ...outs.filter((e) => e.kind === 'relation').map((e) => ({ relation: e.label, direction: 'out', other: statementSummary(L, S, v, axis, e.to, form) })),
      ...(T.into.get(n.id) || []).filter((e) => e.kind === 'relation').map((e) => ({ relation: e.label, direction: 'in', other: statementSummary(L, S, v, axis, e.from, form) })),
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
  const { v, g, T } = ctx;
  return (T.out.get(statementId) || [])
    .filter((e) => e.kind === 'aim')
    .map((e) => {
      const a = T.nodes.get(e.to);
      return { id: a.id, label: a.label ?? null, url: L.entityUrl(a.id), link: deepLink(v, g.axis, [a.id]) };
    });
}

// A general recommendation's condition: in the compact form only where it has one.
function conditionField(L, S, condition, form) {
  const c = (condition || []).map((id) => conceptSummary(L, S, id, form));
  return form === 'compact' && !c.length ? {} : { condition: c };
}

// A list item's aims: in the compact form only where it has some.
function aimsField(L, ctx, statementId) {
  const aims = aimsOf(L, ctx, statementId);
  return ctx.form === 'compact' && !aims.length ? {} : { aims };
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

export async function getTreeNode(L, { graph, grouping, node, depth = 0, offset = 0, detail }) {
  const form = formOf(detail);
  const { index, v, lean } = await viewContext(L, graph);
  const { g, position } = groupingOf(v, grouping);
  const [tree, search] = await Promise.all([L.get(g.tree), L.get(v.search)]);
  const T = treeIndex(tree);
  const S = searchIndex(search);
  const ctx = { v, g, T, S, size: PAGE, form };
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
          node: nodeSummary(L, S, v, g.axis, m, form, T),
          parents: (T.into.get(m.id) || []).filter((e) => e.kind !== 'relation').map((e) => ({
            node: nodeSummary(L, S, v, g.axis, T.nodes.get(e.from), form, T),
            edge: e.kind,
            ...(e.kind === 'answer' ? { answer: e.label ?? null } : {}),
            place: T.place.get(e) ?? null,
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
// the sizes of PAGE_SIZES in turn. When the depth was lowered, the result says
// to what (`depth_reduced_to`), why (`depth_reduced_reason`: 'size_cap', the
// one reason: the depth asked for does not fit even at the smallest page
// size) and the cap (`size_cap`, in characters, the form's) (#317). Each
// node's detail is built and serialised once, and each candidate's length is
// added up from those, not by building and serialising the candidate: a
// Worker request has 10 ms of CPU (#279).
// A grouping's node details at PAGE from offset 0, and their subtrees'
// JSON lengths, kept with its parsed tree file and search file: they depend
// on nothing else, and are the same for every call on them.
const detailCaches = new WeakMap();

function detailCache(T, S, form) {
  let c = detailCaches.get(T);
  if (!c || c.S !== S) detailCaches.set(T, (c = { S }));
  return (c[form] ||= { flat: new Map(), lengths: new Map() });
}

function fittedTree(L, ctx, base, meta, n, d, offset) {
  const { T, S, form } = ctx;
  const MAX_CHARS = limitOf(form);
  const { flat, lengths } = detailCache(T, S, form); // node id -> [detail at PAGE from 0, its JSON length]; `${id}|${depth}` -> JSON length of its subtree
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
  const reducedKeys = (k) => ({ depth_reduced_to: k, depth_reduced_reason: 'size_cap', size_cap: MAX_CHARS });
  // The keys appended to the result: their JSON without its braces, after a comma.
  const reduced = (k) => (k < d ? JSON.stringify(reducedKeys(k)).length - 1 : 0);

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
  if (k < d) Object.assign(result, reducedKeys(k));
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

export async function getEntity(L, { entity, graph, offset = 0, detail }) {
  const form = formOf(detail);
  const id = L.entityId(entity);
  const index = await L.index();
  const graphView = graph ? await L.view(graph) : null;
  const e = await L.entity(id);
  const views = viewsFor(index, e.meta, graphView);
  // A claim's evidence words are read beside the search files, from the cards
  // of the recommendations it supports (evidenceWords).
  const claimWords = e.type === 'claim' ? evidenceWords(L, [e], supportedCards(L, e)) : null;
  const searches = await Promise.all(views.map((v) => L.get(v.search)));
  const meta = about({ meta: e.meta, repositoryLicense: index.repository_license });

  if (e.type === 'statement') {
    // The claims behind it, read for the quote gate (statementEntity), and
    // those it lists for their evidence rows.
    const claimIds = (e.edges?.in || []).filter((x) => x.kind === 'supports' || x.kind === 'contests').map((x) => x.from);
    const claims = (await Promise.all(claimIds.map((c) => L.entity(c).catch(() => null)))).filter(Boolean);
    const listed = new Set((e.card?.beleg?.sources || []).flatMap((s) => (s.claims || []).map((c) => c.id)));
    const ev = await evidenceWords(L, claims.filter((c) => listed.has(c.id)), [e.card]);
    return statementEntity(L, e, views, searches, meta, claims, ev, form);
  }
  if (e.type === 'concept')
    return fitted(conceptEntity(L, e, views, searches, meta, offset, PAGE, form), (x, size) => cutConcept(x, offset, size), limitOf(form));
  if (e.type === 'claim') return claimEntity(L, e, views, searches, meta, await claimWords, form);
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

// --- evidence rows -------------------------------------------------------------

// The source a claim is anchored in: the entity its anchor names.
const sourceOf = (d) => (typeof d?.source?.at === 'string' ? d.source.at.split('#')[0] : '') || null;
const evidenceList = (d) => (Array.isArray(d?.evidence) ? d.evidence : []);

// One entity read for its words, or null: never rejects.
function readOrNull(L, id) {
  try {
    return L.entity(L.entityId(id)).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

// The cards of the recommendations a claim supports, read only where the
// claim has a row naming an outcome: each names the outcomes of the rows of
// the claims behind it (zone 4, docs/publication.md §3).
async function supportedCards(L, d) {
  if (!evidenceList(d).some((x) => x?.outcome)) return [];
  const ids = (d.edges?.out || []).filter((x) => x.kind === 'supports').map((x) => x.to);
  return (await Promise.all(ids.map((id) => readOrNull(L, id)))).map((s) => s?.card);
}

// The words an evidence row is named by, each read from the file that gives
// it: an outcome's label from the card of a recommendation the claim
// supports, as a slot's label is read, else from the concept's own JSON; a
// rating system's name as the claim's source declares it (`rating_systems`),
// never made from its slug. `cards` (a list, or the promise of one) are read
// beside the sources; the concepts only for outcomes no card names. Read only
// for claims with rows. Never rejects: a file that cannot be read leaves its
// words null.
async function evidenceWords(L, docs, cards = []) {
  const entries = docs.flatMap((d) => evidenceList(d).map((x) => [d, x]));
  const sources = [...new Set(entries.filter(([, x]) => x?.system).map(([d]) => sourceOf(d)).filter(Boolean))];
  const declared = Promise.all(sources.map((s) => readOrNull(L, s)));
  const labels = new Map();
  for (const card of await cards)
    for (const g of card?.evidenz?.groups || [])
      for (const r of [...(g.rows || []), ...(g.box || [])]) if (r?.outcome?.id && r.outcome.label) labels.set(r.outcome.id, r.outcome.label);
  const outcomes = [...new Set(entries.map(([, x]) => x?.outcome).filter((o) => typeof o === 'string' && !labels.has(o)))];
  const concepts = await Promise.all(outcomes.map((o) => readOrNull(L, o)));
  outcomes.forEach((o, i) => labels.set(o, concepts[i]?.label ?? null));
  const names = new Map();
  (await declared).forEach((src, i) => {
    for (const r of src?.rating_systems || []) if (r?.system) names.set(`${sources[i]}|${r.system}`, r.name ?? null);
  });
  return { labels, names };
}

// A claim's evidence, row by row as its entity JSON gives it (memory
// claim-evidence-per-outcome): one entry per printed row, in the claim's
// order — its outcome (the concept's id and label, read as a slot's: compact,
// the short label where the graph's search file has one; full, also its URL),
// or its key, as printed; its value (null where the row prints none) and its
// note where it has one, in the source's words; its system by slug and by the
// name its source declares (null where the entry names none). Rating words
// only, no quote. Nothing is composed, mapped between systems or ranked.
function evidenceOf(L, d, searches, words, form) {
  const src = sourceOf(d);
  return evidenceList(d).map((x) => {
    const row = {};
    if (x?.outcome) {
      const found = searches.map((s) => searchIndex(s).get(x.outcome)).find(Boolean);
      const label = words.labels.get(x.outcome) ?? null;
      row.outcome =
        form === 'compact'
          ? { id: x.outcome, label: found?.short_label ?? label ?? found?.label ?? null }
          : { id: x.outcome, label: label ?? found?.label ?? null, url: L.entityUrl(x.outcome) };
    }
    if (x?.key) row.key = x.key;
    row.value = x?.value ?? null;
    if (x?.note) row.note = x.note;
    row.system = x?.system ?? null;
    row.system_name = x?.system ? (words.names.get(`${src}|${x.system}`) ?? null) : null;
    return row;
  });
}

function statementEntity(L, e, views, searches, meta, claimDocs, ev, form = 'full') {
  const card = e.card || {};
  // The wording is withheld where it carries source text word for word: a
  // sentence or a quote that provenance returns for it — of every claim it
  // names, the rules of the concepts it applies to among them (#355) — or a
  // quote of a claim behind it. A text that a name in the graph's search file
  // carries too (a concept named in the source's words) is that name, not
  // source text, as the check counts it (memory quote-gate-follows-the-site).
  const claimLabels = (card.wortlaut || []).map((w) => w.label);
  const values = (c) => new Set([c.grade, c.verb, c.consensus].filter(Boolean).map((x) => x.toLowerCase()));
  const cardQuotes = [
    ...quotesIn(e).map((x) => x.o.quote),
    ...claimSentences(e).map(([, f]) => f.sentence),
    ...claimDocs.flatMap((c) => [c.label, ...quotedStrings(c).filter((q) => !values(c).has(q.toLowerCase()))]),
  ].filter(Boolean);
  const norm = (x) => (x || '').replace(/\s+/g, ' ').trim();
  const wording = norm(e.label);
  const named = (q) => searches.some((s) => s.entries.some((x) => [x.label, x.short_label].some((n) => n && norm(n).includes(norm(q)))));
  const withheld =
    claimLabels.some((l) => sameText(l, e.label) || wording.includes(norm(l))) ||
    cardQuotes.some((q) => wording.includes(norm(q)) && !named(q));
  const u = card.urteil || {};
  const slotLabels = card.mehr?.slots || {};
  const slots = {};
  for (const [slot, val] of Object.entries(e.slots || {})) {
    const ids = Array.isArray(val) ? val : [val];
    slots[slot] = ids.map((cid) => {
      const found = searches.map((s) => searchIndex(s).get(cid)).find(Boolean);
      if (form === 'compact') return { id: cid, label: found?.short_label ?? (slotLabels[slot]?.id === cid ? slotLabels[slot].label : found?.label ?? null) };
      return { id: cid, label: slotLabels[slot]?.id === cid ? slotLabels[slot].label : (found?.label ?? null), url: L.entityUrl(cid) };
    });
  }
  // The claims behind it: by URL and page; compact, without the section, and
  // without the source where it is the only one (the metadata names it).
  const claims = [];
  const sources = card.beleg?.sources || [];
  for (const src of sources)
    for (const c of src.claims || [])
      claims.push(
        form === 'compact'
          ? { id: c.id, url: L.entityUrl(c.id), ...(sources.length > 1 ? { source: src.id } : {}), page: c.page ?? null, recommendation_no: c.recommendation_no ?? null }
          : { id: c.id, url: L.entityUrl(c.id), source: src.id, page: c.page ?? null, section: c.section ?? null, recommendation_no: c.recommendation_no ?? null },
      );
  const edgesIn = e.edges?.in || [];
  const edgesOut = e.edges?.out || [];
  const kindOf = new Map(edgesIn.filter((x) => x.kind === 'supports' || x.kind === 'contests').map((x) => [x.from, x.kind]));
  for (const c of claims) c.edge = kindOf.get(c.id) ?? null;
  // Each claim's evidence rows, its own (#330): none is composed for the
  // recommendation, and nothing is added at its top level (docs/publication.md
  // §3, "Grades are shown, never composed"). Null where the claim could not
  // be read.
  const docOf = new Map(claimDocs.map((d) => [d.id, d]));
  for (const c of claims) c.evidence = docOf.has(c.id) ? evidenceOf(L, docOf.get(c.id), searches, ev, form) : null;

  const perView = views.map((v, i) => {
    const S = searchIndex(searches[i]);
    const first = v.groupings[0]?.axis;
    const related = [
      ...edgesOut.filter((x) => x.kind === 'specializes' || x.kind === 'complements').map((x) => ({ relation: x.kind, direction: 'out', id: x.to, source: x.source ?? null })),
      ...edgesIn.filter((x) => x.kind === 'specializes' || x.kind === 'complements').map((x) => ({ relation: x.kind, direction: 'in', id: x.from, source: x.source ?? null })),
    ]
      .filter((r) => S.has(r.id))
      .map((r) => ({ relation: r.relation, direction: r.direction, edge_source: r.source, other: statementSummary(L, S, v, first, r.id, form) }));
    return { graph: graphRef(v), link: deepLink(v, first, [e.id]), related, ...sequenceField(L, e, v, S, first, form) };
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

// --- a recommendation's steps (spec §5 `follows`) ------------------------------

// A step's transition and trigger as the edge stores them, with their words
// (descriptions.js) where `worded`; its discriminator where it has one.
function stepKeys(x, worded = true) {
  return {
    transition: x.transition ?? null,
    ...(worded ? { transition_words: words.sequence.transition[x.transition] ?? null } : {}),
    trigger: x.trigger ?? null,
    ...(worded ? { trigger_words: words.sequence.trigger[x.trigger] ?? null } : {}),
    ...(x.discriminator ? { discriminator: x.discriminator } : {}),
  };
}

// The words of the keys a chain's edges use, once each (descriptions.js).
function stepTerms(edges) {
  const terms = { transition: {}, trigger: {} };
  for (const x of edges) {
    terms.transition[x.transition] = words.sequence.transition[x.transition] ?? null;
    terms.trigger[x.trigger] = words.sequence.trigger[x.trigger] ?? null;
  }
  return terms;
}

// A recommendation named by a step: as tree nodes summarise it (label,
// direction, grade and verb from the search file, its URL and deep link),
// with its recommendation number and pages as the statement JSON gives them.
function stepNode(L, S, v, axis, x, form) {
  return { ...statementSummary(L, S, v, axis, x.id, form), no: x.no ?? null, pages: x.pages ?? [] };
}

// A recommendation's steps, from its JSON's `sequence` (docs/publication.md
// §4), read from that one file — no other recommendation's is fetched:
// - before / after: its direct neighbours, one entry per edge, in the JSON's
//   order (the guideline's);
// - chain: the whole component the steps join it to, its nodes and edges in
//   the JSON's order, cut to the MAX_CHAIN nodes nearest to it — by steps,
//   either way along an edge; ties in the JSON's order — with the edges
//   between the nodes kept, and the count it was cut from; its edges carry
//   their keys, and `terms` the words of each key once (a chain of MAX_CHAIN
//   with every edge worded would cross the compact form's size).
// Each kept to the graph's members; what is left out is counted. Nothing is
// composed: no step is inferred, no condition or threshold read. Compact:
// none where it has no step; full: two empty lists.
function sequenceField(L, e, v, S, axis, form) {
  const seq = e.sequence;
  if (!seq) return {};
  const outside = new Set();
  const member = (id) => {
    if (S.has(id)) return true;
    outside.add(id);
    return false;
  };
  const side = (list) => (list || []).filter((x) => member(x.id)).map((x) => ({ ...stepNode(L, S, v, axis, x, form), ...stepKeys(x) }));
  const before = side(seq.before);
  const after = side(seq.after);
  if (!before.length && !after.length) return form === 'compact' ? {} : { sequence: { before, after } };

  const out = { before, after };
  const chain = seq.chain;
  if (chain && Array.isArray(chain.nodes)) {
    // Steps away from this recommendation, over every edge of the component.
    const next = new Map();
    for (const x of chain.edges || []) {
      for (const [a, b] of [[x.from, x.to], [x.to, x.from]]) {
        if (!next.has(a)) next.set(a, []);
        next.get(a).push(b);
      }
    }
    const distance = new Map([[e.id, 0]]);
    const queue = [e.id];
    while (queue.length) {
      const id = queue.shift();
      for (const b of next.get(id) || [])
        if (!distance.has(b)) {
          distance.set(b, distance.get(id) + 1);
          queue.push(b);
        }
    }
    const nodes = chain.nodes.filter((x) => member(x.id));
    const order = new Map(nodes.map((x, i) => [x.id, i]));
    const kept = new Set(
      [...nodes]
        .sort((a, b) => (distance.get(a.id) ?? Infinity) - (distance.get(b.id) ?? Infinity) || order.get(a.id) - order.get(b.id))
        .slice(0, MAX_CHAIN)
        .map((x) => x.id),
    );
    const shown = nodes.filter((x) => kept.has(x.id));
    const edges = (chain.edges || []).filter((x) => kept.has(x.from) && kept.has(x.to));
    out.chain = {
      nodes: shown.map((x) => ({ ...stepNode(L, S, v, axis, x, form), distance: distance.get(x.id) ?? null })),
      edges: edges.map((x) => ({ from: x.from, to: x.to, ...stepKeys(x, false) })),
      terms: stepTerms(edges),
      nodes_total: nodes.length,
      ...(shown.length < nodes.length ? { cut_to: MAX_CHAIN, cut_note: words.about.sequenceCut } : {}),
      link: deepLink(v, axis, shown.map((x) => x.id)),
    };
  }
  if (outside.size) Object.assign(out, { outside_graph: outside.size, outside_note: words.about.sequenceOutside });
  out.note = words.about.sequence;
  out.wording = words.about.sequenceWording;
  return { sequence: out };
}

function conceptEntity(L, e, views, searches, meta, offset, size, form = 'full') {
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
      held_by: held.items.map((h) => ({ slot: h.slot, ...statementSummary(L, S, v, first, h.id, form) })),
      held_by_total: held.total,
      ...(st.own ? { own: own.items.map((id) => statementSummary(L, S, v, first, id, form)), own_total: own.total } : {}),
      ...(st.general
        ? {
            general: gen.items.map((x) => ({
              ...statementSummary(L, S, v, first, x.id, form),
              anchor: x.anchor ? conceptSummary(L, S, x.anchor, form) : null,
              via: x.via ? conceptSummary(L, S, x.via, form) : null,
              ...conditionField(L, S, x.condition, form),
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
      // its rule, or one per printing where the source prints the rule differently
      // (spec §5 `defined_by`): every printing, in the source's order, none chosen
      ...((e.rules || []).some((r) => r && r.id)
        ? {
            rules: e.rules
              .filter((r) => r && r.id)
              .map((r) => ({ claim: r.id, url: L.entityUrl(r.id), kind: r.kind ?? null, page: r.page ?? null, section: r.section ?? null })),
          }
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

function claimEntity(L, e, views, searches, meta, ev, form = 'full') {
  const supports = (e.edges?.out || []).filter((x) => x.kind === 'supports' || x.kind === 'contests');
  // where the same source says otherwise (spec §5 `disagrees_with`): symmetric,
  // so both directions, each other claim once, by URL — its text is provenance's
  const others = [
    ...(e.edges?.out || []).filter((x) => x.kind === 'disagrees_with').map((x) => x.to),
    ...(e.edges?.in || []).filter((x) => x.kind === 'disagrees_with').map((x) => x.from),
  ].filter((id, i, all) => id !== e.id && all.indexOf(id) === i);
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
      evidence: evidenceOf(L, e, searches, ev, form),
      text: null,
      text_note: words.about.verbatim,
      ...(others.length ? { disagrees_with: others.map((id) => ({ claim: id, url: L.entityUrl(id) })) } : {}),
    },
    graphs: views.map((v, i) => {
      const S = searchIndex(searches[i]);
      const first = v.groupings[0]?.axis;
      return {
        graph: graphRef(v),
        statements: supports.filter((x) => S.has(x.to)).map((x) => ({ edge: x.kind, ...statementSummary(L, S, v, first, x.to, form) })),
      };
    }),
    about: meta,
  };
}

// --- search --------------------------------------------------------------------

function fold(s) {
  return (s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

// The entities in the subtree of a grouping's node (or of every node an
// entity stands at), in the tree's order — depth first, children in the tree
// file's order: the recommendations and aims at its nodes, the concepts its
// nodes name, and the concepts its answers name; each with the depth of the
// node it stands at (an answer's concepts: the node the answer leads to).
function subtreeEntities(T, starts) {
  const order = new Map(); // entity id -> [its place in the subtree's order, the depth of the node it stands at]
  const add = (id, at) => id && !order.has(id) && order.set(id, [order.size, T.depth.get(at) ?? null]);
  const seen = new Set();
  const visit = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    const n = T.nodes.get(id);
    if (!n) return;
    if (n.type === 'statement' || n.type === 'aim') add(n.id, id);
    add(namedEntity(n), id);
    for (const e of T.out.get(id) || []) {
      if (e.kind === 'relation') continue;
      if (e.kind === 'answer') (e.refs || []).forEach((r) => add(r, e.to));
      visit(e.to);
    }
  };
  starts.forEach((n) => visit(n.id));
  return order;
}

// Filters beside the words, each optional; every filter given must hold. A
// value is compared as the search compares words: case and accents ignored.
const FILTERS = ['kind', 'direction', 'grade', 'verb'];

export async function search(L, { query, graph, kind, direction, grade, verb, grouping, under, detail, limit = 20, offset = 0 }) {
  const form = formOf(detail);
  const words_ = fold(query).split(/\s+/).filter(Boolean);
  const filters = Object.fromEntries(Object.entries({ kind, direction, grade, verb }).filter(([, x]) => typeof x === 'string' && x.trim()));
  if (under !== undefined && under !== null && under !== '') filters.under = under;
  if (grouping !== undefined && grouping !== null && filters.under === undefined) throw new InputError('a grouping is given only with under, the node whose subtree is searched');
  if (!words_.length && !Object.keys(filters).length) throw new InputError('no query and no filter given');
  if (filters.kind !== undefined && !['statement', 'concept'].includes(filters.kind)) throw new InputError(`kind is statement or concept, not ${JSON.stringify(filters.kind)}`);
  if (filters.under !== undefined && !graph) throw new InputError('under needs a graph: a subtree is of one graph');
  const lim = Math.max(1, Math.min(50, limit | 0 || 20));
  const index = await L.index();
  const views = graph ? [await L.view(graph)] : index.views;
  const files = await Promise.all(views.flatMap((v) => [L.get(v.search), L.get(v.lean)]));
  let within = null;
  if (filters.under !== undefined) {
    const { g } = groupingOf(views[0], grouping);
    const T = treeIndex(await L.get(g.tree));
    let starts;
    if (T.nodes.has(filters.under)) starts = [T.nodes.get(filters.under)];
    else {
      const id = L.entityId(filters.under);
      starts = nodesNaming(T, id);
      if (!starts.length) throw new InputError(`${id} names no node of grouping ${JSON.stringify(g.axis)} of ${views[0].id}`);
    }
    within = subtreeEntities(T, starts);
    if (grouping !== undefined && grouping !== null) filters.grouping = g.axis;
  }
  const q = fold(query).trim();
  const same = (a, b) => typeof a === 'string' && fold(a).trim() === fold(b).trim();
  const groups = views.map((v, i) => {
    const s = files[2 * i];
    const lean = files[2 * i + 1];
    const first = v.groupings[0]?.axis;
    const hits = [];
    for (const e of s.entries) {
      if (FILTERS.some((k) => filters[k] !== undefined && !same(e[k], filters[k]))) continue;
      if (within && !within.has(e.id)) continue;
      const texts = [e.label, e.short_label].filter(Boolean).map(fold);
      const hay = texts.join(' \u0000 ');
      if (!words_.every((w) => hay.includes(w))) continue;
      let score = 0;
      if (q) {
        if (texts.some((t) => t === q)) score += 4;
        if (texts.some((t) => t.startsWith(q))) score += 2;
        if (texts.some((t) => t.includes(q))) score += 1;
      }
      hits.push({ e, score });
    }
    // Ranked by the words; without words, in the subtree's order where one is
    // given, else recommendations first, by label.
    hits.sort(
      (a, b) =>
        b.score - a.score ||
        (within && !q ? within.get(a.e.id)[0] - within.get(b.e.id)[0] : 0) ||
        (a.e.kind === b.e.kind ? 0 : a.e.kind === 'statement' ? -1 : 1) ||
        (a.e.short_label ?? a.e.label ?? '').localeCompare(b.e.short_label ?? b.e.label ?? ''),
    );
    const start = Math.max(0, offset | 0);
    const items = hits.slice(start, start + lim);
    return {
      graph: graphRef(v),
      total: hits.length,
      ...(start + lim < hits.length ? { next_offset: start + lim } : {}),
      hits: items.map(({ e }) => {
        const compact = form === 'compact';
        const h = {
          id: e.id,
          kind: e.kind,
          label: e.kind === 'statement' || compact ? e.short_label ?? e.label ?? null : e.label ?? null,
          ...(e.kind === 'concept' && e.short_label && !compact ? { short_label: e.short_label } : {}),
          ...langOf(e.lang, v, form),
          url: L.entityUrl(e.id),
          link: deepLink(v, first, [e.id]),
        };
        if (e.kind === 'statement') Object.assign(h, { direction: e.direction ?? null, grade: e.grade ?? null, verb: e.verb ?? null });
        if (within) h.depth = within.get(e.id)[1];
        if (e.slots && !compact) h.slots = e.slots;
        return h;
      }),
      review: lean.meta?.review ?? null,
      sources: v.sources.map((x) => ({ id: x.id, license: x.license ?? null })),
      commit: s.commit ?? null,
    };
  });
  return {
    query: query ?? null,
    ...(Object.keys(filters).length ? { filters } : {}),
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
