/**
 * @author EE_Azura <EE_Azura@outlook.com>
 */

const { createRetryPromise } = require('./retry')
const { defaultCheckHandler, defaultRetryHandler } = require('./default')


/**
 * 检查处理器函数，用于判断是否需要更新缓存值。
 * 
 * @async
 * @callback CheckHandler
 * @param {Object} options - 检查选项
 * @param {number} options.prevUpdateTime - 上次更新时间的时间戳
 * @param {*} options.prevValue - 上次缓存的值
 * @returns {Promise<boolean>} 如果返回 true，则使用缓存值；如果返回 false，则获取新值
 */

/**
 * 重试处理器函数，用于控制重试策略。
 * 
 * @async
 * @callback RetryHandler
 * @param {Object} options - 重试选项
 * @param {number} options.errorCount - 当前失败次数
 * @param {number} options.delay - 上次重试的延迟时间（毫秒）
 * @returns {Promise<boolean>} 如果返回 true，则继续重试；如果返回 false，则停止重试
 */

/**
 * 创建一个带缓存的 Promise 函数，可以根据条件判断是否使用缓存的值。
 * 
 * @param {function(): Promise<*>} target - 目标函数，该函数需要返回一个 Promise 对象
 * @param {CheckHandler} [checkHandler=defaultCheckHandler] - 判断值是否需要更新的回调函数
 * @param {RetryHandler|boolean} [retry=true] - 重试策略配置。
 *        如果为 true，使用默认重试策略；
 *        如果为 false，不启用重试；
 *        如果是函数，则使用自定义的重试处理函数
 * @returns {CachedPromiseFunction} 返回一个新的 Promise 函数，可以根据 `fresh` 参数决定是否强制刷新缓存
 */
function createCachedPromise(
  target,
  checkHandler = defaultCheckHandler,
  retry = true
) {
  let _isRunning = false;
  let _updateTime = 0;
  let _value = undefined;
  let _fresh = false;
  let _hasValidCache = false;

  const pool = new Set();

  const retryHandler = typeof retry === 'function' ? retry : retry ? defaultRetryHandler : () => false;
  const retryPromise = createRetryPromise(target, retryHandler);

  /**
   * 带缓存的 Promise 函数
   * 
   * @async
   * @function CachedPromiseFunction
   * @param {Object} [options] - 调用选项
   * @param {boolean} [options.fresh=false] - 是否强制刷新缓存
   * @returns {Promise<*>} 返回目标函数的结果
   */
  async function cachedPromise({ fresh = false } = {}) {
    _fresh = fresh;
    return new Promise((resolve, reject) => {
      pool.add({ resolve, reject });
      run();
    });
  }

  async function run() {
    if (!_isRunning) {
      _isRunning = true;
      try {
        const shouldRefresh = _fresh || !_hasValidCache || !(await checkHandler({ prevUpdateTime: _updateTime, prevValue: _value }));
        if (shouldRefresh) {
          _value = await retryPromise();
          _updateTime = Date.now();
          _hasValidCache = true;  // 标记为已初始化
        }
        onSuccess();
      } catch (err) {
        onFail(err);
      } finally {
        _isRunning = false;
        _fresh = false;
      }
    } else {
      // 如果已经在运行，等待当前操作完成
      await new Promise(resolve => {
        const checkRunning = () => {
          if (!_isRunning) {
            resolve();
          } else {
            setTimeout(checkRunning, 10);
          }
        };
        checkRunning();
      });
      // 操作完成后，再次检查是否需要刷新
      if (_fresh) {
        _isRunning = true;
        try {
          _value = await retryPromise();
          _updateTime = Date.now();
          onSuccess();
        } catch (err) {
          onFail(err);
        } finally {
          _isRunning = false;
          _fresh = false;
        }
      } else {
        onSuccess();
      }
    }
  }

  function onSuccess() {
    console.log('onSuccess called, current value:', _value);
    for (const { resolve } of pool) {
      resolve(_value);
    }
    pool.clear();
  }

  function onFail(err) {
    console.log('onFail called with error:', err);
    for (const { reject } of pool) {
      reject(err);
    }
    pool.clear();
  }

  /**
   * 清除当前缓存
   * 
   * @function clearCache
   */
  function clearCache() {
    _updateTime = 0;
    _value = undefined;
    _hasValidCache = false;
  }

  return Object.assign(cachedPromise, { clearCache });
}

module.exports = {
  createCachedPromise
};