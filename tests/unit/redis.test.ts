import test from 'node:test';
import assert from 'node:assert/strict';
import { cacheSet, cacheGet, cacheDel, cacheDelPattern, isRedisHealthy, closeRedis } from '../../src/lib/redis';

test.after(async () => {
  await closeRedis();
});

test('Redis: client connects and reports healthy status', async () => {
  const healthy = await isRedisHealthy();
  assert.equal(healthy, true, 'Redis should be connected and healthy');
});

test('Redis: cacheSet and cacheGet handle basic and complex types', async () => {
  const key = 'test:7motors:unit';
  const payload = {
    businessName: 'Seven Motors',
    fleetCount: 15,
    categories: ['Sedan', 'SUV', 'Luxury'],
  };

  await cacheSet(key, payload, 60);
  const fetched = await cacheGet<typeof payload>(key);

  assert.deepEqual(fetched, payload);
  await cacheDel(key);

  const afterDel = await cacheGet(key);
  assert.equal(afterDel, null);
});

test('Redis: cacheDel removes specified keys', async () => {
  const key1 = 'test:del:1';
  const key2 = 'test:del:2';

  await cacheSet(key1, 'val1', 60);
  await cacheSet(key2, 'val2', 60);

  await cacheDel(key1, key2);

  assert.equal(await cacheGet(key1), null);
  assert.equal(await cacheGet(key2), null);
});

test('Redis: cacheDelPattern deletes keys matching glob pattern', async () => {
  const p1 = 'test:pat:car1';
  const p2 = 'test:pat:car2';
  const other = 'test:other:setting';

  await cacheSet(p1, { model: 'Civic' }, 60);
  await cacheSet(p2, { model: 'Corolla' }, 60);
  await cacheSet(other, { site: '7motors' }, 60);

  await cacheDelPattern('test:pat:*');

  assert.equal(await cacheGet(p1), null);
  assert.equal(await cacheGet(p2), null);
  assert.deepEqual(await cacheGet(other), { site: '7motors' });

  await cacheDel(other);
});

test('Redis: cacheGet returns null for nonexistent keys without throwing', async () => {
  const result = await cacheGet('test:does:not:exist');
  assert.equal(result, null);
});
