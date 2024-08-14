/**
 * 默认的检查处理器，判断是否应该使用缓存的值。
 * @param {Object} [options={}] - 选项对象
 * @param {number} [options.prevUpdateTime] - 上次更新的时间戳（毫秒）
 * @returns {Promise<boolean>} true 表示使用缓存，false 表示获取新值
 */
const defaultCheckHandler = async ({ prevUpdateTime } = {}) => {// 默认冷却时间（毫秒）
  const DEFAULT_COOLDOWN = 3000;

  if (typeof prevUpdateTime !== 'number') return true;
  return (Date.now() - prevUpdateTime) < DEFAULT_COOLDOWN;
};


/**
 * 默认重试处理器：根据错误次数增加延迟时间，最多重试 3 次。
 * @async
 * @param {Object} options - 重试选项
 * @param {number} [options.errorCount=0] - 当前错误次数
 * @returns {Promise<boolean>} 是否需要重试
 */
async function defaultRetryHandler({ errorCount = 0 } = {}) {
  const MAX_RETRY = 3;
  const BASE_DELAY = 1000; // 1 seconds
  const MAX_DELAY = 10000; // 10 seconds 示范作用，这里实际不会用到

  if (errorCount >= MAX_RETRY) return false;
  const delayTime = Math.min((errorCount - 1) * BASE_DELAY, MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delayTime));

  return true;
}

module.exports = {
  defaultCheckHandler,
  defaultRetryHandler
}