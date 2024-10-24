/**
 * @author EE_Azura <EE_Azura@outlook.com>
 */

/**
 * @typedef {Object} CachedRequestOptions
 * @property {number} [max=Infinity] - 最大缓存数
 * @property {function(Object): string} [cacheKeyGenerator] - 自定义缓存键生成函数
 * @property {RetryHandler|boolean} [retry=true] - 重试策略配置
 * @property {number} [ttl] - 缓存生存时间（毫秒）
 */

/**
 * @typedef {Object} CachedRequestStats
 * @property {number} hits - 缓存命中次数
 * @property {number} misses - 缓存未命中次数
 * @property {number} total - 总请求次数
 * @property {number} hitRate - 缓存命中率
 * @property {number} cacheSize - 当前缓存大小
 */

import { createCachedPromise } from './cached-promise';

/**
 * 创建一个带缓存的 Promise 函数，可以根据条件判断是否使用缓存的值。
 *
 * @template T
 * @param {function(Object): Promise<T>} target - 目标函数，该函数需要返回一个 Promise 对象
 * @param {CachedRequestOptions} [options={}] - 其它配置
 * @returns {Object} 返回一个对象，包含带缓存的请求函数及辅助方法
 */
export function createCachedRequest(target, options = {}) {
  const {
    max = Infinity,
    cacheKeyGenerator = JSON.stringify,
    retry = true,
    ttl
  } = options;

  const _pool = new Map();
  let _hits = 0;
  let _misses = 0;

  /**
   * @template T
   * @param {Object} [params={}] - 调用参数
   * @param {Object} [options={}] - 调用选项
   * @param {boolean} [options.fresh=false] - 是否强制刷新缓存
   * @returns {Promise<T>} 返回目标函数的结果
   */
  async function cachedRequest(params = {}, options = {}) {
    const cacheKey = cacheKeyGenerator(params);

    if (!_pool.has(cacheKey)) {
      _misses++;
      if (_pool.size >= max) {
        const oldestKey = _pool.keys().next().value;
        _pool.delete(oldestKey);
      }

      const cachedPromise = createCachedPromise(
        () => target(params),
        () => true,
        retry
      );

      _pool.set(cacheKey, {
        promise: cachedPromise,
        timestamp: Date.now()
      });
    } else {
      _hits++;
    }

    const { promise, timestamp } = _pool.get(cacheKey);

    if (ttl && Date.now() - timestamp > ttl) {
      _pool.delete(cacheKey);
      return cachedRequest(params, options);
    }

    return promise(options);
  }

  /**
   * 获取缓存统计
   *
   * @returns {CachedRequestStats} 缓存统计信息
   */
  function getStats() {
    const total = _hits + _misses;
    return {
      hits: _hits,
      misses: _misses,
      total,
      hitRate: total ? _hits / total : 0,
      cacheSize: _pool.size
    };
  }

  /**
   * 清除当前缓存
   */
  function clearCache() {
    _pool.clear();
    _hits = 0;
    _misses = 0;
  }

  return Object.assign(cachedRequest, {
    getStats,
    clearCache
  });
}
