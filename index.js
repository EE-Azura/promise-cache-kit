/**
 * @author EE_Azura <EE_Azura@outlook.com>
 */

const { createRetryPromise } = require('./retry')
const { defaultCheckHandler, defaultRetryHandler } = require('./default')

/**
 * 创建一个带缓存的 Promise 函数，可以根据条件判断是否使用缓存的值。
 * 
 * @param {function(): Promise} target - 目标函数，该函数需要返回一个 Promise 对象
 * @param {function} [checkHandler = defaultCheckHandler] - 判断值是否需要更新的回调函数
 * @param {function | boolean} [retry = true] - 重试策略配置，可以是 `true` 使用默认重试策略，`false` 不启用重试，或者自定义的重试处理函数
 * @returns {Function} - 返回一个新的 Promise 函数，可以根据 `fresh` 参数决定是否强制刷新缓存
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
        const shouldRefresh = _fresh || !_hasValidCache || !(await checkHandler({ prevUpdateTime: _updateTime, value: _value }));
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