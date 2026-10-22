// Reads Layer 0 — the files the site publishes for programs (docs/publication.md
// §2, §4) — from one base URL, by `fetch` only, and keeps what it parsed in
// memory. Web-standard APIs only (fetch, URL, JSON): the same code runs on
// Workers (ADR-0007). Nothing here names a graph, a grouping or a slot.

// How long a parsed file stays in memory: until this many milliseconds have
// passed since it was fetched, or until index.json names another commit,
// whichever comes first.
export const TTL_MS = 10 * 60 * 1000;

// A request that fails with a 5xx or a network error — GitHub Pages answers
// a 503 now and then (#317) — is made again after each of these waits, then
// reported. A retry is made only while the tool call has made fewer than
// RETRY_WITHIN requests in all, half the subrequests Workers allow one
// request (SUBREQUESTS): a call of at most RETRY_WITHIN requests stays within
// the limit however many of them fail. A wait costs no CPU time. A 404 and
// every other answer are reported at once.
export const RETRY_DELAYS_MS = [200, 600];
export const SUBREQUESTS = 50;
export const RETRY_WITHIN = SUBREQUESTS / 2;

export class InputError extends Error {}

export function normaliseBase(base) {
  let url;
  try {
    url = new URL(base);
  } catch {
    throw new Error(`not a URL: ${base}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`not an http(s) URL: ${base}`);
  url.search = '';
  url.hash = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

export class Layer0 {
  // base: the site's root (https://graph.med/, a preview, a local build).
  // fetch: the fetch to use (default: the global one).
  // onFetch: called with each URL this reader requests, a retry included, for
  // a request log.
  // onRetry: called with the URL and the failure before each retry.
  // now: a clock, for tests.
  constructor({ base, fetch: fetchImpl, onFetch, onRetry, now } = {}) {
    this.base = normaliseBase(base);
    this.fetchImpl = fetchImpl || ((...a) => globalThis.fetch(...a));
    this.onFetch = onFetch || (() => {});
    this.onRetry = onRetry || (() => {});
    this.now = now || (() => Date.now());
    this.cache = new Map(); // url -> {at, promise}
    this.commit = null;
    this.root = this;
  }

  // The reader one tool call uses: this one — its cache, its commit — with a
  // count of the requests the call makes, which bounds its retries
  // (RETRY_WITHIN). Used directly, a reader counts nothing and retries each
  // request as RETRY_DELAYS_MS allows.
  forCall() {
    const call = Object.create(this.root);
    call.requests = 0;
    return call;
  }

  inBase(url) {
    return typeof url === 'string' && url.startsWith(this.base);
  }

  // One Layer 0 file, parsed. Refuses any URL outside the base.
  async get(url) {
    if (!this.inBase(url)) throw new InputError(`outside the base ${this.base}: ${url}`);
    const hit = this.cache.get(url);
    if (hit && this.now() - hit.at < TTL_MS) return hit.promise;
    const promise = this.read(url);
    this.cache.set(url, { at: this.now(), promise });
    promise.catch(() => this.cache.delete(url));
    return promise;
  }

  // One file read, retried as RETRY_DELAYS_MS and RETRY_WITHIN allow.
  async read(url) {
    for (let retry = 0; ; retry++) {
      if (this.requests !== undefined) this.requests++;
      this.onFetch(url);
      const r = await this.attempt(url);
      if (!r.failure) return r.file;
      const attempts = `${retry + 1} attempt${retry ? 's' : ''}`;
      if (retry === RETRY_DELAYS_MS.length || this.requests >= RETRY_WITHIN) throw new Error(`GET ${url}: ${r.failure} (${attempts})`);
      this.onRetry(url, r.failure);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[retry]));
    }
  }

  // One request: {file}, the parsed file, or {failure} where a retry may
  // help — a 5xx, a network error; a 404 and every other answer throw.
  async attempt(url) {
    let res;
    try {
      res = await this.fetchImpl(url, { headers: { accept: 'application/json' } });
    } catch (err) {
      return { failure: `network error: ${err.message}` };
    }
    if (res.status === 404) throw new InputError(`not found: ${url}`);
    if (res.status >= 500) {
      await res.body?.cancel().catch(() => {});
      return { failure: `HTTP ${res.status}` };
    }
    if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
    try {
      return { file: await res.json() };
    } catch (err) {
      if (err instanceof SyntaxError) throw err;
      return { failure: `network error: ${err.message}` };
    }
  }

  async index() {
    const index = await this.get(this.base + 'index.json');
    if (this.commit !== null && index.commit !== this.commit) {
      // A new build: drop everything parsed from the old one.
      const kept = this.cache.get(this.base + 'index.json');
      this.cache.clear();
      if (kept) this.cache.set(this.base + 'index.json', kept);
    }
    this.root.commit = index.commit;
    return index;
  }

  // An entity id from an id or a URL under the base (page or JSON). The id
  // rule is Layer 0's own (llms.txt, "Identifiers and URLs"): an entity's
  // page is <base><id>/ and its JSON <base><id>.json.
  entityId(input) {
    if (typeof input !== 'string' || !input.trim()) throw new InputError('no entity given');
    let s = input.trim();
    if (/^[a-z]+:\/\//i.test(s)) {
      if (!this.inBase(s)) throw new InputError(`outside the base ${this.base}: ${s}`);
      s = s.slice(this.base.length).split('#')[0].split('?')[0];
      s = s.replace(/\.json$/, '').replace(/\/$/, '');
      s = decodeURIComponent(s);
    }
    s = s.replace(/^\/+/, '');
    if (!/^[a-z_]+\/[^\s?#]+$/.test(s) || s.split('/').some((p) => p === '' || p === '.' || p === '..'))
      throw new InputError(`not an entity id: ${input}`);
    return s;
  }

  entityUrl(id) {
    return this.base + id + '/';
  }

  entityJsonUrl(id) {
    return this.base + id + '.json';
  }

  async entity(id) {
    return this.get(this.entityJsonUrl(id));
  }

  // A graph (a view) of the index by its id or one of its URLs.
  async view(input) {
    const index = await this.index();
    if (typeof input !== 'string' || !input.trim()) throw new InputError('no graph given');
    const s = input.trim();
    if (/^[a-z]+:\/\//i.test(s) && !this.inBase(s)) throw new InputError(`outside the base ${this.base}: ${s}`);
    const strip = (u) => (u || '').replace(/\/$/, '');
    const v = index.views.find(
      (v) => v.id === s || [v.url, v.json, v.lean].some((u) => u && strip(u) === strip(s)),
    );
    if (!v) throw new InputError(`no graph ${s} in ${this.base}index.json`);
    return v;
  }
}
