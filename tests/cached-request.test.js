const { createCachedRequest } = require('../cached-request');

describe('createCachedRequest', () => {
  test('在相同参数的情况下应返回缓存的结果', async () => {
    // should return a cached result on subsequent calls with the same parameters
    let callCount = 0;
    const target = async (params) => {
      callCount++;
      return params.value;
    };

    const cachedRequest = createCachedRequest(target, { ttl: 1000 });

    const result1 = await cachedRequest({ value: 42 });
    const result2 = await cachedRequest({ value: 42 });

    expect(result1).toBe(42);
    expect(result2).toBe(42);
    expect(callCount).toBe(1);
  });

  test('如果缓存已过期，则不应返回缓存的结果', async () => {
    // should not return a cached result if the cache has expired
    let callCount = 0;
    const target = async (params) => {
      callCount++;
      return params.value;
    };

    const cachedRequest = createCachedRequest(target, { ttl: 100 });

    const result1 = await cachedRequest({ value: 42 });
    await new Promise(resolve => setTimeout(resolve, 200)); // 等待缓存过期
    const result2 = await cachedRequest({ value: 42 });

    expect(result1).toBe(42);
    expect(result2).toBe(42);
    expect(callCount).toBe(2);
  });

  test('调用 clearCache 时应清除缓存', async () => {
    // should clear the cache when clearCache is called
    let callCount = 0;
    const target = async (params) => {
      callCount++;
      return params.value;
    };

    const cachedRequest = createCachedRequest(target, { ttl: 1000 });

    const result1 = await cachedRequest({ value: 42 });
    cachedRequest.clearCache();
    const result2 = await cachedRequest({ value: 42 });

    expect(result1).toBe(42);
    expect(result2).toBe(42);
    expect(callCount).toBe(2);
  });

  test('应返回正确的缓存统计信息', async () => {
    // should return correct cache statistics
    const target = async (params) => params.value;

    const cachedRequest = createCachedRequest(target, { ttl: 1000 });

    await cachedRequest({ value: 42 });
    await cachedRequest({ value: 42 });
    await cachedRequest({ value: 43 });

    const stats = cachedRequest.getStats();

    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
    expect(stats.total).toBe(3);
    expect(stats.hitRate).toBe(1 / 3);
    expect(stats.cacheSize).toBe(2);
  });
});