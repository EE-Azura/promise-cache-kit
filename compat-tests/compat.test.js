import { describe, it, expect } from 'vitest';
import { createCachedPromise as esmCreateCachedPromise } from '../dist/promise-cache-kit.js';


describe('兼容性测试', () => {
  it('应该在 CommonJS 环境中正常工作', async () => {
    const {
      createCachedPromise: cjsCreateCachedPromise
    } = require('../dist/promise-cache-kit.cjs');
    let callCount = 0;
    const target = async () => {
      callCount++;
      return 42;
    };

    const cachedPromise = cjsCreateCachedPromise(target);
    const result1 = await cachedPromise();
    const result2 = await cachedPromise();

    expect(result1).toBe(42);
    expect(result2).toBe(42);
    expect(callCount).toBe(1);

    cachedPromise.clearCache();
    const result3 = await cachedPromise();

    expect(result3).toBe(42);
    expect(callCount).toBe(2);
  });

  it('应该在 ES Module 环境中正常工作', async () => {
    let callCount = 0;
    const target = async () => {
      callCount++;
      return 42;
    };

    const cachedPromise = esmCreateCachedPromise(target);
    const result1 = await cachedPromise();
    const result2 = await cachedPromise();

    expect(result1).toBe(42);
    expect(result2).toBe(42);
    expect(callCount).toBe(1);

    cachedPromise.clearCache();
    const result3 = await cachedPromise();

    expect(result3).toBe(42);
    expect(callCount).toBe(2);
  });
});