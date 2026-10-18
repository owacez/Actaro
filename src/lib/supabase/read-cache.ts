// Short-lived, memory-only reads. Authorization headers are part of each key;
// authentication is never cached and writes invalidate all pending/read entries.
const readFunctions = new Set([
  'search_exercises',
  'search_foods',
  'get_training_history',
  'get_training_plans',
  'get_training_overview',
  'get_exercise_performance',
]);
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export function createReadCache(
  origin: string,
  request: Fetcher = (input, init) => fetch(input, init),
) {
  const values = new Map<string, { response: Response; until: number }>();
  const pending = new Map<string, Promise<Response>>();
  let generation = 0;
  function clear() {
    generation++;
    values.clear();
    pending.clear();
  }
  async function cachedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input !== 'string') return request(input, init);
    const url = new URL(input),
      method = (init?.method ?? 'GET').toUpperCase();
    if (url.origin !== new URL(origin).origin) return request(input, init);
    const rest = url.pathname.startsWith('/rest/v1/');
    const signing = url.pathname.startsWith('/storage/v1/object/sign/') && method === 'POST';
    const read =
      signing ||
      (rest &&
        (method === 'GET' ||
          (method === 'POST' && readFunctions.has(url.pathname.split('/rpc/')[1]))));
    const verifying = url.pathname === '/auth/v1/user' && method === 'GET';
    if (!read && !verifying) {
      if (method === 'GET' || method === 'HEAD') return request(input, init);
      clear();
      try {
        return await request(input, init);
      } finally {
        clear();
      }
    }
    if (init?.signal) return request(input, init); // Do not share independently cancellable reads.
    const headers: [string, string][] = [];
    new Headers(init?.headers).forEach((value, name) => headers.push([name, value]));
    const key = JSON.stringify([
      input,
      method,
      headers.sort(([a], [b]) => a.localeCompare(b)),
      init?.body ?? null,
    ]);
    const saved = values.get(key);
    if (saved && saved.until > Date.now()) return saved.response.clone();
    values.delete(key);
    let work = pending.get(key);
    if (!work) {
      const revision = generation;
      work = request(input, init)
        .then((response) => {
          if (read && response.ok && revision === generation) {
            if (values.size >= 100) {
              const first = values.keys().next().value;
              if (first) values.delete(first);
            }
            values.set(key, { response: response.clone(), until: Date.now() + 60000 });
          }
          return response;
        })
        .finally(() => {
          if (revision === generation) pending.delete(key);
        });
      pending.set(key, work);
    }
    return (await work).clone();
  }
  return { fetch: cachedFetch, clear };
}

let activeCache: ReturnType<typeof createReadCache> | undefined;
export function cachedSupabaseFetch(origin: string) {
  activeCache = createReadCache(origin);
  return activeCache.fetch;
}
export function clearReadCache() {
  activeCache?.clear();
}
