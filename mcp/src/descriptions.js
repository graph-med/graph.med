// The words the server gives a model about graph.med: every tool's title and
// description, every argument's description, and the words that travel as data
// in each result (the disclaimer, the labels of the metadata). This is the
// one file of them (ADR-0007; card #272). They state what a tool returns, as a
// fact; none tells the model how to behave. None names a graph, a grouping, an
// axis or a slot: those are data, read from the site.

export const server = {
  name: 'graph-med',
  title: 'graph.med',
};

// The disclaimer, carried in every result's `about` and in the server's
// instructions (card #291). Its wording is the maintainer's (2026-10-06): the
// site's banner (tools/site/templates/banner.html), which the build publishes
// as `disclaimer` in index.json; the check asserts this copy equals it.
export const disclaimer =
  'graph.med is not a medical device under the EU Medical Device Regulation (MDR). Its information was retrieved with the help of AI, and it includes AI-generated content. It is provided without warranty; use it with care.';

// Words that travel with the metadata of every result.
export const about = {
  license:
    "Each source's licence line is the project's summary as recorded for that source, not the publisher's own words.",
  review:
    "Review status as the site publishes it; 'pending' means no clinical review has been recorded.",
  verbatim:
    "Holds no verbatim source text; the provenance tool returns it: each claim's sentence, and short quotes, with their links into the source.",
  graphProvenance: 'A graph is a view: a filter over the pool its authors write.',
  searchProvenance: "Labels are the site's modelling words; grades and verbs are the guideline's own.",
  places: 'The entity stands at several nodes of this grouping; each node id selects one.',
  wordingWithheld: 'The wording carries source text word for word; the provenance tool returns source text.',
  verbatimProvenance:
    "Holds verbatim source text: each claim's sentence whole, as graph.med's pages show it, and quotes of at most the stated number of characters; each with its link into the source or its page.",
  // A recommendation's steps before and after (get_entity's `sequence`; spec §5 `follows`).
  sequence:
    "before: the recommendations this one follows, the outcome of whose measure calls for its step; after: those that follow it; chain: every recommendation joined to it by such steps, this one included, each with its distance (how many steps lie between the two, either way along them), each edge from the later to the earlier, and the words of its keys once in terms. Each entry and each edge is one step as the source states it, with its own transition and trigger; several into one recommendation say neither that their outcomes call for it together nor that any one of them does: the source data does not say which. A grade is the box's own, as printed. A step carries no threshold: the circumstance that calls for it is the later recommendation's condition, and a threshold printed for it stands on that concept's rule.",
  sequenceWording:
    "Each step's rationale quotes the trigger's wording as printed; it carries source text and is not returned here. It stands under the step on the recommendation's page.",
  sequenceCut: "The chain holds more recommendations than are returned: those nearest to this one, by steps along it; each node's own result gives its steps.",
  sequenceOutside: 'Steps to recommendations outside this graph are left out, and counted.',
};

// The words of a step's transition and trigger, by the schema's keys (spec §5
// `follows`), stated from the later recommendation to the earlier — "later"
// and "earlier" being the order of the decision, not of the clock. A key
// without words here is returned with null words; the check fails on one.
export const sequence = {
  transition: {
    replaces: "the later measure replaces the earlier one (instead of it)",
    adds: "the later measure is added to the earlier one (in addition to it)",
    follows: "the later measure comes after the earlier one has ended (after it)",
    concurrent:
      "both measures run at the same time: the guideline gives no order between them in time; the later is the one it makes depend on the other's outcome",
  },
  trigger: {
    target_missed: "the earlier measure's target is missed",
    intolerance: 'the patient does not tolerate the earlier measure',
    contraindication: 'a contraindication arises under the earlier measure',
    target_reached: "the earlier measure's target is reached",
    reevaluation: 'a re-evaluation of the earlier measure',
    finding: 'a finding under the earlier measure',
    other: 'another outcome of the earlier measure, of none of the named kinds',
  },
};

// The `detail` argument of the tools that answer in two forms (tools.js, FORMS).
const DETAIL =
  "Optional: 'compact' (the default) or 'full'. Compact keeps every id, label, URL and deep link of an item, its direction, grade and verb, its place and depth, and the metadata; it leaves out what the full form repeats: a concept named inside another item gives only its id and short label, a language equal to the graph's, empty lists of aims, an answer's concepts where they are the node it leads to, a search hit's slots.";

export const tools = {
  list_graphs: {
    title: 'List graphs',
    description:
      'Lists the graphs graph.med publishes. Each graph is one view of the pool: the recommendations of one guideline, the claims they rest on and the concepts they hold, as structure for professionals. For each graph: its id, title, language, page URL, what it holds, its sources with their licence lines, and its groupings with the one it opens with. Graphs are listed separately and never combined.',
    args: {
      offset: 'Where to continue a listing that returned a next offset.',
    },
  },
  list_groupings: {
    title: "List a graph's groupings",
    description:
      "Lists the groupings of one graph, in the site's order: the trees the site draws for it, each a way of arranging the same recommendations. For each: its id, label, short label, kind, the question its root asks, the URL of its tree, the page link that opens it, and whether the graph opens with it (the first).",
    args: {
      graph: "The graph: its id or its page URL, as the list of graphs gives them.",
    },
  },
  get_tree_node: {
    title: 'Get a tree node',
    description:
      "Returns one node of one grouping of a graph: the question asked there and its answers (each with its label, the concepts it stands for and the node it leads to), its parents, the recommendations under it with direction, grade, verb and URL, the recommendations that apply to it generally with the way they reach it and their condition where the grouping carries them, and their aims. A node naming an entity is addressed by the entity's id or URL, any other node by its id in the grouping's tree; without a node it is the grouping's root, without a grouping the graph's first. An entity standing at several nodes returns each with its node id. A depth returns the nodes below as well. Every node carries the page link that opens it, and its depth: how many answers lie between the root and it. Each answer, each recommendation and each parent link carries a place, counted from 1 among the siblings of its kind (a question's answers, a node's recommendations, a node's questions, a recommendation's aims) in the order the build writes the grouping; the site's drawing orders a few siblings differently, so an item is identified across the two by its entity id, not its place. Compact by default and kept under 24,000 characters by paging; with detail 'full', under 45,000.",
    args: {
      graph: 'The graph: its id or its page URL.',
      grouping: "The grouping's id, as the list of groupings gives it; default: the graph's first grouping.",
      node: "A node id from the grouping's tree, or the id or URL of an entity a node names; default: the root.",
      depth: 'How many levels below the node to include (0 to 3); default 0.',
      offset: 'Where to continue lists that returned a next offset.',
      detail: DETAIL,
    },
  },
  get_entity: {
    title: 'Get an entity',
    description:
      "Returns a recommendation, a concept or a claim by its id or URL. A recommendation: its wording (modelling, the project's own), grade, verb, consensus and direction as the guideline prints them, the claims it rests on by URL and page (without their text), each with its evidence rows, its related recommendations within its graph, and its steps: the recommendations before and after it in the order the guideline states, and the whole chain they form (up to 25 recommendations, the nearest), each with direction, grade, verb, recommendation number and pages, and each step's transition and trigger, as keys and in words; no certainty of evidence is composed for the recommendation itself. A concept: the recommendations that hold it, per graph and slot, and the nodes where it stands in each grouping of each graph, each with its page link; for a concept established by a rule, the claim giving it, or each where the source prints the rule differently. A claim: its kind, page, section, grade, verb and consensus, its evidence rows, without its text, and the claims where its source says otherwise, by URL. Evidence rows say how certain the evidence is, as the guideline prints it: one entry per printed row, in its order, each with the outcome it rates (a concept) or the row's key as printed, its value, a note where the row prints words instead of a level, and its rating system, by id and by the name the source declares for it; values are the source's own words, never mapped between systems and never reduced to one; an empty list where none is recorded. With a graph, the result keeps to that graph; without one, it is grouped per graph. Compact by default; with detail 'full', the URLs and short labels of the concepts it names, the languages, and a claim's source and section.",
    args: {
      entity: 'The id or URL of a recommendation (statements/…), a concept (concepts/…) or a claim (claims/…).',
      graph: 'Optional: the graph (id or page URL) to keep to.',
      offset: 'Where to continue lists that returned a next offset.',
      detail: DETAIL,
    },
  },
  search: {
    title: 'Search',
    description:
      "Searches a graph's recommendations and concepts by the words of their labels, by filters, or both: a kind, a direction, a grade or a verb, as the results give them, and a subtree — the recommendations, aims and concepts at and below one node of a grouping. Within one graph, or across all graphs with the hits grouped per graph, each group ranked on its own and never merged. Ranked by the words; without words, in the subtree's order where one is given (depth first, in the grouping's order), else recommendations first, by label. With a subtree, each hit gives the depth of the node it stands at, as tree nodes do. Each hit gives its id, kind, label, URL, page link and, for a recommendation, its direction, grade and verb; with detail 'full' also its slots; never a sentence or quote of a source.",
    args: {
      query: 'Optional: words to find in labels; every word must occur. Case and accents are ignored. Needed unless a filter is given.',
      graph: 'Optional: the graph (id or page URL) to search; without one, every graph.',
      kind: "Optional: 'statement' (a recommendation) or 'concept'.",
      direction: 'Optional: a direction, as results give it; only recommendations have one.',
      grade: 'Optional: a grade, as printed; only recommendations have one.',
      verb: 'Optional: a verb, as printed; only recommendations have one.',
      under: "Optional, with a graph: a node of a grouping — a node id from its tree, or the id or URL of an entity a node names — whose subtree is searched.",
      grouping: "Optional, with under: the grouping's id; default: the graph's first grouping.",
      detail: DETAIL,
      limit: 'Hits per graph (1 to 50); default 20.',
      offset: 'Where to continue a graph’s hits that returned a next offset.',
    },
  },
  get_provenance: {
    title: 'Get provenance',
    description:
      "Returns where a claim, a recommendation or a concept comes from in its source: the only tool that returns verbatim source text. The sentence of each claim involved, whole, as graph.med's pages show it; and the quotes that anchor them, each short (capped, marked when shortened). Each comes with its page and its link into the source document at its publisher, with the source's licence line. For a recommendation, the sentences and quotes of the claims it rests on.",
    args: {
      entity: 'The id or URL of a claim, a recommendation or a concept.',
      graph: 'Optional: the graph (id or page URL) to keep to.',
    },
  },
};
