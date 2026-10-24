// A synthetic Layer 0, written by hand, for the shapes today's build cannot
// produce (card #272, Verification): a view whose first grouping is the
// chapter outline, not a hierarchy; no scope tree (no `scope_root`, no
// junction `general`); several sources; a source that is not German; no
// register number; one concept standing at two nodes of one grouping; a
// recommendation whose wording equals its claim's sentence; claims with
// evidence rows (#330) — outcomes outside the view, a keyed row whose quote is
// a part of its key, a note, an outcome without a rating, a rating for the
// whole box in a system whose declared name is not its slug — and a claim
// without rows; a card without zone 4, so that an outcome's label comes from
// the concept's own JSON; steps (`follows`) with two edges between one pair
// and a recommendation following two, their rationale quoting a claim (which
// no result but provenance may carry); and, in `chainFiles`, a chain longer
// than the server returns. Every file is
// keyed by its path under the base; `files(base)` returns them as
// {path: object}. Nothing here is a real guideline.

export function files(base) {
  const B = base;
  const VIEW = 'views/fx-guide';
  const V = 'fx-guide';
  const commit = 'fixture';
  const srcA = { id: 'sources/fx-a', title: 'Example guideline A', lang: 'en', url: 'https://example.org/guideline-a.pdf', license: 'Example licence line A' };
  const srcB = { id: 'sources/fx-b', title: 'Beispielleitlinie B', lang: 'de', url: 'https://example.org/leitlinie-b.pdf', license: 'Beispiel-Lizenzzeile B' };
  // The rating systems each source declares (`rating_systems`): a slug, the name as printed, its line.
  const ratingSystems = {
    'sources/fx-a': [{ system: 'fx_grade', name: 'Example GRADE', source: { at: 'sources/fx-a#page=2', quote: 'Table 1: certainty after Example GRADE' } }],
    'sources/fx-b': [{ system: 'fx_stufen', name: 'Beispielstufen 2020', source: { at: 'sources/fx-b#page=2', quote: 'Evidenzstufen nach Beispielstufen 2020' } }],
  };
  const sources = [srcA, srcB];
  const metaSources = sources.map((s) => ({ id: s.id, json: B + s.id + '.json', license: s.license }));
  const viewRef = { id: VIEW, url: B + V + '/', json: B + V + '.json' };
  const meta = (id, provenance, extra = {}) => ({
    commit,
    json: B + id + '.json',
    provenance,
    repository_license: 'PolyForm Noncommercial 1.0.0',
    review: 'pending',
    schema_version: '0.0.0',
    sources: metaSources,
    url: B + id + '/',
    views: [viewRef],
    ...extra,
  });

  const groupings = [
    { axis: 'section', default: true, kind: 'outline', label: 'Chapters', lang: 'en', question: { label: 'Which chapter?', lang: 'en' }, short_label: null, tree: B + V + '/trees/section.json' },
    { axis: 'axes/fx-stage', default: false, kind: 'dimension', label: 'Stage', lang: 'en', question: { label: 'Which stage?', lang: 'en' }, short_label: 'Stage', tree: B + V + '/trees/axes/fx-stage.json' },
  ];

  const st = {
    'statements/fx-s1': { label: 'Doing X is recommended in stage one.', short_label: 'Do X in stage one', lang: 'en', direction: 'für', grade: 'A', verb: 'should', slots: { action: 'concepts/fx-x', stage: 'concepts/fx-stage-1' }, claim: 'claims/fx-a/aaaa0001', src: srcA, page: '3', section: '1' },
    'statements/fx-s2': { label: 'Y soll nicht angewendet werden.', short_label: 'Y nicht anwenden', lang: 'de', direction: 'gegen', grade: 'B', verb: 'soll nicht', slots: { action: 'concepts/fx-y', stage: 'concepts/fx-stage-2' }, claim: 'claims/fx-b/bbbb0001', src: srcB, page: '7', section: '2' },
    'statements/fx-s3': { label: 'Z may be considered in stage one.', short_label: 'Consider Z early', lang: 'en', direction: 'abwägen', grade: '0', verb: 'may', slots: { action: 'concepts/fx-z', stage: 'concepts/fx-stage-1' }, claim: 'claims/fx-a/aaaa0002', src: srcA, page: '4', section: '1' },
    'statements/fx-s4': { label: 'Z may be continued in stage two.', short_label: 'Continue Z later', lang: 'en', direction: 'abwägen', grade: '0', verb: 'may', slots: { action: 'concepts/fx-z', stage: 'concepts/fx-stage-2' }, claim: 'claims/fx-a/aaaa0003', src: srcA, page: '5', section: '1' },
  };
  const claimOf = Object.fromEntries(Object.entries(st).map(([id, s]) => [s.claim, id]));
  const claimLabel = {
    'claims/fx-a/aaaa0001': 'X should be done when the stage is one.',
    'claims/fx-b/bbbb0001': 'Y soll nicht angewendet werden.',
    'claims/fx-a/aaaa0002': 'Z may be considered in the first stage.',
    'claims/fx-a/aaaa0003': 'Z may be continued in the second stage.',
  };
  const claimQuote = {
    'claims/fx-a/aaaa0001': 'X should be done when',
    'claims/fx-b/bbbb0001': 'Y soll nicht angewendet',
    'claims/fx-a/aaaa0002': 'Z may be considered in the first',
    'claims/fx-a/aaaa0003': 'Z may be continued in the second',
  };
  const concepts = {
    'concepts/fx-x': { label: 'X', lang: 'en', facet: 'procedure', slots: ['action'] },
    'concepts/fx-y': { label: 'Y', lang: 'de', facet: 'medication', slots: ['action'] },
    'concepts/fx-z': { label: 'Z', lang: 'en', facet: 'procedure', slots: ['action'] },
    'concepts/fx-stage-1': { label: 'Stage one', lang: 'en', facet: 'qualifier', slots: ['stage'] },
    'concepts/fx-stage-2': { label: 'Stage two', lang: 'en', facet: 'qualifier', slots: ['stage'] },
    'concepts/fx-outcome': { label: 'Outcome', lang: 'en', facet: 'outcome', slots: [] },
  };
  // Outcomes only evidence rows name: in no view, no search file, no tree.
  const outcomes = {
    'concepts/fx-endpoint': { label: 'Endpoint E', lang: 'en', facet: 'outcome' },
    'concepts/fx-endpoint-2': { label: 'Endpoint F within 30 days', lang: 'en', facet: 'outcome' },
  };
  const label = (id) => (concepts[id] || outcomes[id]).label;
  const lang = (id) => (concepts[id] || outcomes[id]).lang;
  // Each claim's evidence rows as its entity JSON gives them, and the quote of
  // each; none for claims/fx-a/aaaa0003.
  const evidence = {
    'claims/fx-a/aaaa0001': [
      [{ outcome: 'concepts/fx-endpoint', system: 'fx_grade', value: 'Low' }, 'Endpoint E: low certainty'],
      [{ key: 'Drug P, Drug Q', outcome: 'concepts/fx-outcome', system: 'fx_grade', value: 'moderate' }, 'Drug P'],
    ],
    'claims/fx-a/aaaa0002': [
      [{ key: 'Subgroup R', system: 'fx_grade', value: 'very low' }, 'Subgroup R: very low'],
      [{ note: 'Indirect evidence', system: 'fx_grade' }, 'Indirect evidence'],
      [{ outcome: 'concepts/fx-endpoint-2', system: 'fx_grade' }, 'Endpoint F within 30 days:'],
    ],
    'claims/fx-b/bbbb0001': [[{ system: 'fx_stufen', value: 'Stufe 2' }, 'Evidenzstufe: Stufe 2']],
  };
  // Zone 4 of a card, as the build writes it (tools/build.py, evidence_of);
  // statements/fx-s3's card has none.
  const zone4 = (claim, src) => {
    const rows = (evidence[claim] || []).map(([x]) => ({ outcome: x.outcome ? { id: x.outcome, label: label(x.outcome), lang: lang(x.outcome) } : null, value: x.value ?? null, lang: st[claimOf[claim]].lang, ...(x.key ? { key: x.key } : {}), ...(x.note ? { note: x.note } : {}) }));
    if (!rows.length) return { state: 'missing', groups: [] };
    const system = evidence[claim][0][0].system;
    const single = rows.length === 1 && !rows[0].outcome && !rows[0].key;
    return { state: single ? 'single' : 'by_outcome', groups: [{ system, system_name: ratingSystems[src.id].find((r) => r.system === system).name, rows, n: rows.length, k: rows.filter((r) => r.value || r.note).length, range: null }] };
  };
  const glyph = { 'für': '✓', gegen: '✗', 'abwägen': '~' };
  const sNode = (id) => ({ id, ref: id, type: 'statement', label: `${glyph[st[id].direction]} ${st[id].grade} · ${st[id].short_label}`, lang: st[id].lang, direction: st[id].direction, grade: st[id].grade, verb: st[id].verb, sections: [st[id].section], facets: [], against: st[id].direction === 'gegen', contested: false });
  const root = { id: VIEW, label: 'Example guideline A', lang: 'en', ref: srcA.id, type: 'root' };
  const aim = { id: 'concepts/fx-outcome', ref: 'concepts/fx-outcome', type: 'aim', label: 'Outcome', lang: 'en', facets: ['outcome'] };
  const common = {
    nodes: [...Object.keys(st).map(sNode), aim],
    edges: [
      { from: 'statements/fx-s3', to: 'statements/fx-s1', kind: 'relation', label: 'specializes' },
      { from: 'statements/fx-s3', to: 'concepts/fx-outcome', kind: 'aim' },
      { from: 'statements/fx-s4', to: 'concepts/fx-outcome', kind: 'aim' },
    ],
  };
  const tree = (g, nodes, edges) => ({ view: VIEW, commit, axis: g.axis, label: g.label, short_label: g.short_label, kind: g.kind, lang: g.lang, nodes: [root, ...nodes, ...common.nodes], edges: [...edges, ...common.edges] });

  const qs = 'q:' + VIEW + ':section';
  const section = tree(
    groupings[0],
    [
      { id: qs, label: 'Which chapter?', lang: 'en', type: 'question' },
      { id: 'j:section:sources/fx-a:1', ref: '', type: 'junction', label: '3', group: '1 Doing', lang: 'en' },
      { id: 'j:section:sources/fx-b:2', ref: '', type: 'junction', label: '1', group: '2 Avoiding', lang: 'de' },
    ],
    [
      { from: VIEW, to: qs, kind: 'flow' },
      { from: qs, to: 'j:section:sources/fx-a:1', kind: 'answer', label: '1 Doing', refs: [] },
      { from: qs, to: 'j:section:sources/fx-b:2', kind: 'answer', label: '2 Avoiding', refs: [] },
      { from: 'j:section:sources/fx-a:1', to: 'statements/fx-s1', kind: 'flow' },
      { from: 'j:section:sources/fx-a:1', to: 'statements/fx-s3', kind: 'flow' },
      { from: 'j:section:sources/fx-a:1', to: 'statements/fx-s4', kind: 'flow' },
      { from: 'j:section:sources/fx-b:2', to: 'statements/fx-s2', kind: 'flow' },
    ],
  );

  const qd = 'q:' + VIEW + ':stage';
  const j = (value, concept) => (concept ? `j:${value}:${concept}` : `j:${value}`);
  const stageTree = tree(
    groupings[1],
    [
      { id: qd, label: 'Which stage?', lang: 'en', type: 'question' },
      { id: j('concepts/fx-stage-1'), ref: 'concepts/fx-stage-1', type: 'junction', label: '2', group: 'Stage one', lang: 'en', facets: ['qualifier'] },
      { id: j('concepts/fx-stage-2'), ref: 'concepts/fx-stage-2', type: 'junction', label: '2', group: 'Stage two', lang: 'en', facets: ['qualifier'] },
      { id: qd + ':1', label: 'Which action?', lang: 'en', type: 'question' },
      { id: qd + ':2', label: 'Which action?', lang: 'en', type: 'question' },
      { id: j('concepts/fx-stage-1', 'concepts/fx-x'), ref: 'concepts/fx-x', type: 'junction', label: '1', group: 'X', lang: 'en' },
      { id: j('concepts/fx-stage-1', 'concepts/fx-z'), ref: 'concepts/fx-z', type: 'junction', label: '1', group: 'Z', lang: 'en' },
      { id: j('concepts/fx-stage-2', 'concepts/fx-z'), ref: 'concepts/fx-z', type: 'junction', label: '1', group: 'Z', lang: 'en' },
    ],
    [
      { from: VIEW, to: qd, kind: 'flow' },
      { from: qd, to: j('concepts/fx-stage-1'), kind: 'answer', label: 'Stage one', refs: ['concepts/fx-stage-1'] },
      { from: qd, to: j('concepts/fx-stage-2'), kind: 'answer', label: 'Stage two', refs: ['concepts/fx-stage-2'] },
      { from: j('concepts/fx-stage-1'), to: qd + ':1', kind: 'flow' },
      { from: j('concepts/fx-stage-2'), to: qd + ':2', kind: 'flow' },
      { from: qd + ':1', to: j('concepts/fx-stage-1', 'concepts/fx-x'), kind: 'answer', label: 'X', refs: ['concepts/fx-x'] },
      { from: qd + ':1', to: j('concepts/fx-stage-1', 'concepts/fx-z'), kind: 'answer', label: 'Z', refs: ['concepts/fx-z'] },
      { from: qd + ':2', to: j('concepts/fx-stage-2', 'concepts/fx-z'), kind: 'answer', label: 'Z', refs: ['concepts/fx-z'] },
      { from: qd + ':2', to: 'statements/fx-s2', kind: 'answer', label: 'Y', refs: ['concepts/fx-y'] },
      { from: j('concepts/fx-stage-1', 'concepts/fx-x'), to: 'statements/fx-s1', kind: 'flow' },
      { from: j('concepts/fx-stage-1', 'concepts/fx-z'), to: 'statements/fx-s3', kind: 'flow' },
      { from: j('concepts/fx-stage-2', 'concepts/fx-z'), to: 'statements/fx-s4', kind: 'flow' },
    ],
  );

  // Where each concept appears: the nodes naming it by `ref`, and the nodes an
  // answer naming it in `refs` leads to (docs/publication.md §4).
  const appearsIn = (cid) => {
    const out = {};
    for (const t of [section, stageTree]) {
      const ids = [];
      for (const n of t.nodes) if (n.ref === cid && n.type !== 'root' && !ids.includes(n.id)) ids.push(n.id);
      for (const e of t.edges) if ((e.refs || []).includes(cid) && !ids.includes(e.to)) ids.push(e.to);
      if (ids.length) out[t.axis] = ids;
    }
    return out;
  };

  const out = {};
  out['index.json'] = {
    commit,
    contract: 'https://example.org/contract',
    llms_txt: B + 'llms.txt',
    repository_license: 'PolyForm Noncommercial 1.0.0',
    schema: { url: B + 'schema/schema.yaml', version: '0.0.0' },
    views: [
      {
        groupings,
        holds: { claim: 4, group: 0, statement: 4 },
        id: VIEW,
        json: B + V + '.json',
        lang: 'en',
        lean: B + V + '/view.json',
        root: null,
        search: B + V + '/search.json',
        sources: sources.map((s) => ({ ...s, json: B + s.id + '.json', page: B + s.id + '/' })),
        title: 'Example guideline A',
        url: B + V + '/',
      },
    ],
  };
  out[V + '/view.json'] = {
    id: VIEW,
    title: 'Example guideline A',
    sources: sources.map((s) => s.id),
    commit,
    outline: {},
    facets: [],
    legend: [],
    groupings,
    meta: { ...meta(VIEW, { kind: 'modelling' }), url: B + V + '/', json: B + V + '.json', views: [] },
  };
  out[V + '/trees/section.json'] = section;
  out[V + '/trees/axes/fx-stage.json'] = stageTree;
  // The view JSON itself: the checks assert it is never fetched.
  out[V + '.json'] = { id: VIEW, never: 'fetched by the server' };
  out[V + '/search.json'] = {
    view: VIEW,
    commit,
    entries: [
      ...Object.entries(st).map(([id, s]) => ({ id, kind: 'statement', lang: s.lang, short_label: s.short_label, slots: Object.fromEntries(Object.entries(s.slots).map(([k, v]) => [k, [v]])), direction: s.direction, grade: s.grade, verb: s.verb })),
      ...Object.entries(concepts).map(([id, c]) => ({ id, kind: 'concept', lang: c.lang, label: c.label, slots: c.slots })),
    ],
  };
  // Steps (spec §5 `follows`, later → earlier), as the build publishes them in
  // a statement JSON's `sequence` (docs/publication.md §4): fx-s4 follows fx-s1
  // and, twice — the source stating the order in two places, a discriminator
  // each — fx-s3. fx-s2 is on no step.
  const steps = [
    { from: 'statements/fx-s4', to: 'statements/fx-s1', transition: 'replaces', trigger: 'intolerance' },
    { from: 'statements/fx-s4', to: 'statements/fx-s3', transition: 'follows', trigger: 'reevaluation', discriminator: 'p1' },
    { from: 'statements/fx-s4', to: 'statements/fx-s3', transition: 'concurrent', trigger: 'other', discriminator: 'p2' },
  ];
  const stepKeys = ({ transition, trigger, discriminator }) => ({ transition, trigger, ...(discriminator ? { discriminator } : {}) });
  const stepRef = (sid) => ({ id: sid, url: B + sid + '/', json: B + sid + '.json', no: st[sid].section, pages: [st[sid].page] });
  const chainIds = ['statements/fx-s1', 'statements/fx-s3', 'statements/fx-s4'];
  const sequenceOf = (sid) => {
    const before = steps.filter((x) => x.from === sid).map((x) => ({ ...stepRef(x.to), ...stepKeys(x) }));
    const after = steps.filter((x) => x.to === sid).map((x) => ({ ...stepRef(x.from), ...stepKeys(x) }));
    const on = chainIds.includes(sid);
    return {
      before,
      after,
      chain: {
        nodes: on ? chainIds.map((c) => ({ id: c, no: st[c].section, pages: [st[c].page] })) : [],
        edges: on ? steps.map((x) => ({ from: x.from, to: x.to, ...stepKeys(x) })) : [],
      },
    };
  };
  const stepEdges = (sid) => ({
    out: steps.filter((x) => x.from === sid).map((x) => ({ to: x.to, kind: 'follows', source: 'modelling', ...stepKeys(x), rationale: 'A synthetic step, quoting its claim: „Z may be continued in the second“.', lang: 'en', as_of: '2026-10-22' })),
    in: steps.filter((x) => x.to === sid).map((x) => ({ from: x.from, kind: 'follows', source: 'modelling', ...stepKeys(x), rationale: 'A synthetic step, quoting its claim: „Z may be continued in the second“.', lang: 'en', as_of: '2026-10-22' })),
  });
  for (const [id, s] of Object.entries(st)) {
    const related = [...(id === 'statements/fx-s3' ? [{ from: id, to: 'statements/fx-s1', kind: 'specializes', source: 'modelling' }] : []), ...stepEdges(id).out];
    const relatedIn = [...(id === 'statements/fx-s1' ? [{ from: 'statements/fx-s3', kind: 'specializes', source: 'modelling' }] : []), ...stepEdges(id).in];
    out[id + '.json'] = {
      id,
      type: 'statement',
      label: s.label,
      short_label: s.short_label,
      lang: s.lang,
      source: 'modelling',
      slots: s.slots,
      card: {
        title: s.short_label,
        wortlaut: [{ id: s.claim, label: claimLabel[s.claim], lang: s.lang }],
        beleg: { review: 'pending', sources: [{ id: s.src.id, lang: s.src.lang, title: s.src.title, claims: [{ id: s.claim, lang: s.lang, page: s.page, section: s.section, recommendation_no: s.section, quote: claimQuote[s.claim], link: `${s.src.url}#page=${s.page}&search=${encodeURIComponent(claimQuote[s.claim])}&phrase=true` }] }] },
        urteil: { badges: [{ consensus: 'konsens', count: 1, grade: s.grade, share: null, source: s.src.id }], direction: s.direction, glyph: glyph[s.direction], umstritten: false, verbs: [s.verb] },
        ...(id === 'statements/fx-s3' ? {} : { evidenz: zone4(s.claim, s.src) }),
        mehr: { slots: Object.fromEntries(Object.entries(s.slots).map(([k, v]) => [k, { id: v, label: concepts[v].label, lang: concepts[v].lang }])) },
        questions: { urteil: 'What should I do?' },
      },
      edges: { in: [{ from: s.claim, kind: 'supports', source: 'modelling' }, ...relatedIn], out: related },
      sequence: sequenceOf(id),
      meta: meta(id, { kind: 'modelling', source: 'modelling', supported_by: { [s.src.id]: 1 }, contested_by: {} }, { sources: [{ id: s.src.id, json: B + s.src.id + '.json', license: s.src.license }] }),
    };
    out[s.claim + '.json'] = {
      id: s.claim,
      type: 'claim',
      kind: 'recommendation',
      label: claimLabel[s.claim],
      lang: s.lang,
      grade: s.grade,
      verb: s.verb,
      consensus: 'konsens',
      section: s.section,
      recommendation_no: s.section,
      source: { at: `${s.src.id}#page=${s.page}`, quote: claimQuote[s.claim] },
      ...(evidence[s.claim]
        ? {
            evidence: evidence[s.claim].map(([x]) => x),
            provenance: { evidence: evidence[s.claim].map(([, quote]) => ({ at: `${s.src.id}#page=${s.page}`, quote })) },
          }
        : {}),
      edges: { in: [], out: [{ kind: 'supports', to: id, source: 'modelling' }] },
      meta: meta(s.claim, { kind: 'anchored', at: `${s.src.id}#page=${s.page}`, link: `${s.src.url}#page=${s.page}&search=${encodeURIComponent(claimQuote[s.claim])}&phrase=true` }, { sources: [{ id: s.src.id, json: B + s.src.id + '.json', license: s.src.license }] }),
    };
  }
  for (const [id, c] of Object.entries(concepts)) {
    const held = Object.entries(st).flatMap(([sid, s]) => Object.entries(s.slots).filter(([, v]) => v === id).map(([slot]) => ({ id: sid, slot })));
    out[id + '.json'] = {
      id,
      type: 'concept',
      label: c.label,
      lang: c.lang,
      facet: c.facet,
      source: 'modelling',
      derivation: 'stated',
      rules: [],
      edges: { in: [], out: [] },
      statements: { [VIEW]: { held_by: held } },
      appears_in: { [VIEW]: appearsIn(id) },
      meta: meta(id, { kind: 'modelling', source: 'modelling' }, { sources: [] }),
    };
  }
  for (const [id, c] of Object.entries(outcomes))
    out[id + '.json'] = {
      id,
      type: 'concept',
      label: c.label,
      lang: c.lang,
      facet: c.facet,
      source: 'modelling',
      derivation: 'stated',
      rules: [],
      edges: { in: [], out: [] },
      statements: {},
      appears_in: {},
      meta: meta(id, { kind: 'modelling', source: 'modelling' }, { sources: [], views: [] }),
    };
  for (const src of sources)
    out[src.id + '.json'] = {
      id: src.id,
      type: 'source',
      title: src.title,
      lang: src.lang,
      url: src.url,
      license: src.license,
      rating_systems: ratingSystems[src.id],
      edges: { in: [], out: [] },
      meta: meta(src.id, { kind: 'anchored', at: src.id }, { sources: [] }),
    };
  return out;
}

// A second synthetic Layer 0, for the chain's cap (tools.js, MAX_CHAIN): one
// graph of `length` recommendations in a line, each following the one before
// (fx-c02 follows fx-c01, …), every statement JSON carrying the whole chain.
// Only what get_entity reads: the index, the search file, the statement JSONs.
export function chainFiles(base, length = 30) {
  const B = base;
  const VIEW = 'views/fx-chain';
  const V = 'fx-chain';
  const src = { id: 'sources/fx-c', title: 'Example guideline C', lang: 'en', url: 'https://example.org/guideline-c.pdf', license: 'Example licence line C' };
  const ids = Array.from({ length }, (_, i) => `statements/fx-c${String(i + 1).padStart(2, '0')}`);
  const no = (i) => `1.${i + 1}`;
  const node = (i) => ({ id: ids[i], no: no(i), pages: [String(i + 10)] });
  const edges = ids.slice(1).map((id, i) => ({ from: id, to: ids[i], transition: 'adds', trigger: 'target_missed' }));
  const ref = (i) => ({ id: ids[i], url: B + ids[i] + '/', json: B + ids[i] + '.json', no: no(i), pages: [String(i + 10)], transition: 'adds', trigger: 'target_missed' });
  const out = {};
  out['index.json'] = {
    commit: 'fixture-chain',
    repository_license: 'PolyForm Noncommercial 1.0.0',
    views: [
      {
        id: VIEW,
        title: 'Example guideline C',
        lang: 'en',
        url: B + V + '/',
        json: B + V + '.json',
        lean: B + V + '/view.json',
        search: B + V + '/search.json',
        sources: [{ ...src, json: B + src.id + '.json', page: B + src.id + '/' }],
        groupings: [{ axis: 'section', default: true, kind: 'outline', label: 'Chapters', lang: 'en', question: { label: 'Which chapter?', lang: 'en' }, short_label: null, tree: B + V + '/trees/section.json' }],
      },
    ],
  };
  out[V + '/search.json'] = {
    view: VIEW,
    commit: 'fixture-chain',
    entries: ids.map((id, i) => ({ id, kind: 'statement', lang: 'en', short_label: `Step ${i + 1}`, slots: {}, direction: 'für', grade: 'B', verb: 'should' })),
  };
  ids.forEach((id, i) => {
    out[id + '.json'] = {
      id,
      type: 'statement',
      label: `Step ${i + 1} is taken when step ${i} misses its target.`,
      short_label: `Step ${i + 1}`,
      lang: 'en',
      source: 'modelling',
      slots: {},
      card: { title: `Step ${i + 1}`, wortlaut: [], beleg: { review: 'pending', sources: [] }, urteil: { badges: [], direction: 'für', verbs: ['should'] } },
      edges: { in: [], out: [] },
      sequence: { before: i > 0 ? [ref(i - 1)] : [], after: i < length - 1 ? [ref(i + 1)] : [], chain: { nodes: ids.map((_, k) => node(k)), edges } },
      meta: { commit: 'fixture-chain', url: B + id + '/', json: B + id + '.json', review: 'pending', provenance: { kind: 'modelling' }, sources: [{ id: src.id, license: src.license }], views: [{ id: VIEW }] },
    };
  });
  return out;
}
