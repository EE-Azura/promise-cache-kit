/**
 * @author EE_Azura <EE_Azura@outlook.com>
 */

/**
 * 默认的检查处理器，判断是否应该使用缓存的值。
 *
 * @async
 * @param {Object} [options] - 检查选项
 * @param {number} options.prevUpdateTime - 上次更新时间的时间戳
 * @param {*} options.prevValue - 上次缓存的值
 * @returns {Promise<boolean>} 如果返回 true，则使用缓存值；如果返回 false，则获取新值
 */
export async function defaultCheckHandler({ prevUpdateTime } = {}) {
  // 缓存有效时间时间（毫秒）
  const TTL = 60000;

  if (typeof prevUpdateTime !== 'number') return true;
  return Date.now() - prevUpdateTime < TTL;
}

/**
 * 默认重试处理器：根据错误次数增加延迟时间，最多重试 3 次。
 *
 * @async
 * @param {Object} [options] - 重试选项
 * @param {number} options.errorCount - 当前失败次数
 * @returns {Promise<boolean>} 如果返回 true，则继续重试；如果返回 false，则停止重试
 */
export async function defaultRetryHandler({ errorCount = 0 } = {}) {
  const MAX_RETRY = 3;
  const BASE_DELAY = 1000; // 1 seconds
  const MAX_DELAY = 10000; // 10 seconds 示范作用，这里实际不会用到

  if (errorCount > MAX_RETRY) return false;
  const delayTime = Math.min((errorCount - 1) * BASE_DELAY, MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delayTime));

  return true;
}
