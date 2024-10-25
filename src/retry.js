/**
 * 创建一个带重试机制的异步函数
 *
 * @param {function(): Promise} target - 要重试的目标函数，该函数需要返回一个 Promise 对象。
 * @param {retryHandler} [retryHandler] - 重试策略回调函数，默认情况下不会进行重试。 {@link types.js#RetryHandler}
 * @returns {function(): Promise} - 返回一个函数，该函数返回一个 Promise，解析为目标函数的结果或拒绝为最后一次失败的错误。
 */
export function createRetryPromise(
  target,
  retryHandler = () => Promise.resolve(false)
) {
  return async function retry() {
    let errorCount = 0;

    while (true) {
      try {
        const result = await target();
        return result;
      } catch (err) {
        errorCount++;
        console.error(err);

        const shouldRetry = await retryHandler({ errorCount });
        if (!shouldRetry) {
          throw err;
        }

        // 可以根据需要调整延迟策略
      }
    }
  };
}
