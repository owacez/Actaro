import { afterEach, expect, jest, test } from '@jest/globals';
import { createReadCache } from '@/lib/supabase/read-cache';
const origin = 'https://cache-fixture.supabase.co';
const url = origin + '/rest/v1/habits?select=*';
const headers = { authorization: 'Bearer account-a', accept: 'application/json' };
afterEach(() => {
  jest.restoreAllMocks();
});

test('recent identical reads and concurrent requests share one HTTP call with separate consumable responses', async () => {
  const request = jest
    .fn<() => Promise<Response>>()
    .mockResolvedValue(new Response('[{"name":"Read"}]'));
  const cache = createReadCache(origin, request);
  const [a, b] = await Promise.all([cache.fetch(url, { headers }), cache.fetch(url, { headers })]);
  expect(await a.json()).toEqual(await b.json());
  await (await cache.fetch(url, { headers })).json();
  expect(request).toHaveBeenCalledTimes(1);
});

test('identity, schema, range and RPC parameters are part of the read key; auth verification has no TTL', async () => {
  const request = jest
    .fn<() => Promise<Response>>()
    .mockImplementation(async () => new Response('[]'));
  const cache = createReadCache(origin, request);
  await cache.fetch(url, { headers });
  await cache.fetch(url, { headers: { ...headers, authorization: 'Bearer account-b' } });
  await cache.fetch(url, { headers: { ...headers, range: '10-20' } });
  await cache.fetch(url, { headers: { ...headers, 'accept-profile': 'private' } });
  const rpc = origin + '/rest/v1/rpc/get_training_history';
  await cache.fetch(rpc, { method: 'POST', headers, body: '{"p_offset":0}' });
  await cache.fetch(rpc, { method: 'POST', headers, body: '{"p_offset":10}' });
  await cache.fetch(origin + '/auth/v1/user', { headers });
  await cache.fetch(origin + '/auth/v1/user', { headers });
  expect(request).toHaveBeenCalledTimes(8);
});

test('mutations, expiry and account cleanup invalidate cached data; errors are never cached', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(100000);
  const request = jest
    .fn<() => Promise<Response>>()
    .mockImplementation(async () => new Response('[]'));
  const cache = createReadCache(origin, request);
  await cache.fetch(url, { headers });
  now.mockReturnValue(160001);
  await cache.fetch(url, { headers });
  await cache.fetch(origin + '/rest/v1/rpc/log_habit', { method: 'POST', headers, body: '{}' });
  await cache.fetch(url, { headers });
  cache.clear();
  request.mockResolvedValueOnce(new Response('offline', { status: 503 }));
  await cache.fetch(url, { headers });
  await cache.fetch(url, { headers });
  expect(request).toHaveBeenCalledTimes(6);
});

test('a read begun before a mutation cannot repopulate the cache with an older response', async () => {
  let finish: ((value: Response) => void) | undefined;
  const request = jest
    .fn<() => Promise<Response>>()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockImplementation(async () => new Response('[]'));
  const cache = createReadCache(origin, request);
  const stale = cache.fetch(url, { headers });
  await cache.fetch(origin + '/rest/v1/habits', { method: 'PATCH', headers });
  finish?.(new Response('["old"]'));
  await stale;
  await cache.fetch(url, { headers });
  expect(request).toHaveBeenCalledTimes(3);
});
