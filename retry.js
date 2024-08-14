/**
 * @async
 * @callback retryHandler
 * @param {object} param0
 * @param {number} param0.errorCount - 失败次数
 * @param {number} param0.delay - 上次重试延迟
 * @returns {Promise<boolean>} - true: 重试, false: 停止重试
 * 
 * 该回调函数用于控制重试策略，根据错误次数和延迟时间决定是否继续重试。
 */

/**
 * 创建一个带重试机制的异步函数
 * @param {function(): Promise} target - 要重试的目标函数，该函数需要返回一个 Promise 对象。
 * @param {retryHandler} [retryHandler] - 重试策略回调函数，默认情况下不会进行重试。
 * @returns {function(): Promise} - 返回一个函数，该函数返回一个 Promise，解析为目标函数的结果或拒绝为最后一次失败的错误。
 */
function createRetryPromise(target, retryHandler = () => Promise.resolve(false)) {
  return async function retry() {
    let errorCount = 0;
    let delay = 0;

    while (true) {
      try {
        const result = await target();
        return result;
      } catch (err) {
        errorCount++;
        console.error(err);

        const shouldRetry = await retryHandler({ errorCount, delay });
        if (!shouldRetry) {
          throw err;
        }

        // 可以根据需要调整延迟策略
      }
    }
  };
}

module.exports = {
  createRetryPromise
};