// The words the server gives a model about graph.med: every tool's title and
// description, every argument's description, and the words that travel as data
// in each result (the intended use, the labels of the metadata). This is the
// one file of them (ADR-0007; card #272). They state what a tool returns, as a
// fact; none tells the model how to behave. None names a graph, a grouping, an
// axis or a slot: those are data, read from the site.

export const server = {
  name: 'graph-med',
  title: 'graph.med',
};

// The intended use, carried in every result. Its wording is the maintainer's
// (#283); until given, it stays empty.
export const intendedUse = '';

// Words that travel with the metadata of every result.
export const about = {
  license:
    "Each source's licence line is the project's summary as recorded for that source, not the publisher's own words.",
  review:
    "Review status as the site publishes it; 'pending' means no clinical review has been recorded.",
  verbatim:
    'Holds no verbatim source text; the provenance tool returns it, short and with its link into the source.',
  graphProvenance: 'A graph is a view: a filter over the pool its authors write.',
  searchProvenance: "Labels are the site's modelling words; grades and verbs are the guideline's own.",
  places: 'The entity stands at several nodes of this grouping; each node id selects one.',
  wordingWithheld: 'The wording carries source text word for word; the provenance tool returns source text.',
  verbatimProvenance:
    'Holds verbatim source text: quotes of at most the stated number of characters, each with its link into the source or its page.',
};

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
      "Returns one node of one grouping of a graph: the question asked there and its answers (each with its label, the concepts it stands for and the node it leads to), its parents, the recommendations under it with direction, grade, verb and URL, the recommendations that apply to it generally with the way they reach it and their condition where the grouping carries them, and their aims. A node naming an entity is addressed by the entity's id or URL, any other node by its id in the grouping's tree; without a node it is the grouping's root, without a grouping the graph's first. An entity standing at several nodes returns each with its node id. A depth returns the nodes below as well. Every node carries the page link that opens it.",
    args: {
      graph: 'The graph: its id or its page URL.',
      grouping: "The grouping's id, as the list of groupings gives it; default: the graph's first grouping.",
      node: "A node id from the grouping's tree, or the id or URL of an entity a node names; default: the root.",
      depth: 'How many levels below the node to include (0 to 3); default 0.',
      offset: 'Where to continue lists that returned a next offset.',
    },
  },
  get_entity: {
    title: 'Get an entity',
    description:
      "Returns a recommendation or a concept by its id or URL. A recommendation: its wording (modelling, the project's own), grade, verb, consensus and direction as the guideline prints them, the claims it rests on by URL and page (without their text), and its related recommendations within its graph. A concept: the recommendations that hold it, per graph and slot, and the nodes where it stands in each grouping of each graph, each with its page link. A claim: its kind, page, section, grade, verb and consensus, without its text. With a graph, the result keeps to that graph; without one, it is grouped per graph.",
    args: {
      entity: 'The id or URL of a recommendation (statements/…), a concept (concepts/…) or a claim (claims/…).',
      graph: 'Optional: the graph (id or page URL) to keep to.',
      offset: 'Where to continue lists that returned a next offset.',
    },
  },
  search: {
    title: 'Search',
    description:
      "Searches the labels of a graph's recommendations and concepts. Within one graph, or across all graphs with the hits grouped per graph, each group ranked on its own and never merged. Each hit gives its id, kind, label, URL, page link and, for a recommendation, its direction, grade and verb; never a sentence or quote of a source.",
    args: {
      query: 'Words to find in labels; every word must occur. Case and accents are ignored.',
      graph: 'Optional: the graph (id or page URL) to search; without one, every graph.',
      limit: 'Hits per graph (1 to 50); default 20.',
      offset: 'Where to continue a graph’s hits that returned a next offset.',
    },
  },
  get_provenance: {
    title: 'Get provenance',
    description:
      "Returns where a claim, a recommendation or a concept comes from in its source: the only tool that returns verbatim source text. Each quote is short (capped, marked when shortened) and comes with its page and its link into the source document at its publisher, with the source's licence line. For a recommendation, the quotes of the claims it rests on.",
    args: {
      entity: 'The id or URL of a claim, a recommendation or a concept.',
      graph: 'Optional: the graph (id or page URL) to keep to.',
    },
  },
};
