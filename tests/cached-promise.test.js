const { createCachedPromise } = require('../index');
const { defaultCheckHandler, defaultRetryHandler } = require('../default');

jest.mock('../default', () => ({
  defaultCheckHandler: jest.fn(),
  defaultRetryHandler: jest.fn()
}));

jest.mock('../retry', () => ({
  createRetryPromise: jest.fn((target, retryHandler = () => Promise.resolve(false)) => {
    return async function retry() {
      let errorCount = 0;
      let delay = 0;

      while (true) {
        try {
          return await target();
        } catch (err) {
          errorCount++;
          console.error(err);

          const shouldRetry = await retryHandler({ errorCount, delay });
          if (!shouldRetry) {
            throw err;
          }
        }
      }
    };
  })
}));

describe('createCachedPromise', () => {
  let mockTarget;
  let mockCheckHandler;
  let mockRetryHandler;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    mockTarget = jest.fn();
    mockCheckHandler = jest.fn();
    mockRetryHandler = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    defaultCheckHandler.mockReset();
    defaultRetryHandler.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  test('应该在首次调用时执行目标函数并缓存结果', async () => {
    // should execute the target function and cache the result on the first call
    mockTarget.mockResolvedValue('initial result');
    mockCheckHandler.mockResolvedValue(true);

    const cachedPromise = createCachedPromise(mockTarget, mockCheckHandler);
    const result = await cachedPromise();

    expect(mockTarget).toHaveBeenCalledTimes(1);
    expect(mockCheckHandler).not.toHaveBeenCalled();
    expect(result).toBe('initial result');
  });

  test('应该在有效缓存时使用缓存值', async () => {
    // should use cached value when cache is valid
    mockTarget.mockResolvedValue('result');
    mockCheckHandler.mockResolvedValue(true);

    const cachedPromise = createCachedPromise(mockTarget, mockCheckHandler);
    await cachedPromise();  // 首次调用，缓存结果
    const result = await cachedPromise();  // 第二次调用

    expect(mockTarget).toHaveBeenCalledTimes(1);
    expect(mockCheckHandler).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  test('应该在清除缓存后重新执行目标函数', async () => {
    // should re-execute the target function after clearing the cache
    mockTarget.mockResolvedValueOnce('result1').mockResolvedValueOnce('result2');
    mockCheckHandler.mockResolvedValue(true);

    const cachedPromise = createCachedPromise(mockTarget, mockCheckHandler);
    await cachedPromise();  // 首次调用，缓存结果
    cachedPromise.clearCache();  // 清除缓存
    const result = await cachedPromise();  // 再次调用，应该重新执行目标函数

    expect(mockTarget).toHaveBeenCalledTimes(2);
    expect(mockCheckHandler).toHaveBeenCalledTimes(0);  // 清除缓存后的首次调用不会检查缓存
    expect(result).toBe('result2');
  });

  test('应该在检查处理器返回 false 时重新执行目标函数', async () => {
    // should re-execute the target function when the check handler returns false
    mockTarget.mockResolvedValueOnce('result1').mockResolvedValueOnce('result2');
    mockCheckHandler.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const cachedPromise = createCachedPromise(mockTarget, mockCheckHandler);
    await cachedPromise();  // 首次调用，缓存结果
    await cachedPromise();  // 使用缓存
    const result = await cachedPromise();  // 重新执行

    expect(mockTarget).toHaveBeenCalledTimes(2);
    expect(mockCheckHandler).toHaveBeenCalledTimes(2);
    expect(result).toBe('result2');
  });

  test('应该在强制刷新时重新执行目标函数', async () => {
    // should re-execute the target function when forced to refresh
    mockTarget.mockResolvedValueOnce('result1').mockResolvedValueOnce('result2');
    mockCheckHandler.mockResolvedValue(true);

    const cachedPromise = createCachedPromise(mockTarget, mockCheckHandler);
    await cachedPromise();  // 首次调用，缓存结果
    const result = await cachedPromise({ fresh: true });  // 强制刷新

    expect(mockTarget).toHaveBeenCalledTimes(2);
    expect(mockCheckHandler).toHaveBeenCalledTimes(0);
    expect(result).toBe('result2');
  });

  test('应该在目标函数失败时重试', async () => {
    // should retry when the target function fails
    const error = new Error('fail');
    mockTarget.mockRejectedValueOnce(error).mockResolvedValueOnce('result');
    mockCheckHandler.mockResolvedValue(false);
    mockRetryHandler.mockResolvedValue(true);

    const cachedPromise = createCachedPromise(mockTarget, mockCheckHandler, mockRetryHandler);
    const result = await cachedPromise();

    expect(mockTarget).toHaveBeenCalledTimes(2);
    expect(mockCheckHandler).not.toHaveBeenCalled();
    expect(mockRetryHandler).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  test('应该在重试失败后抛出错误', async () => {
    // should throw an error after retry fails
    const error = new Error('fail');
    mockTarget.mockRejectedValue(error);
    mockCheckHandler.mockResolvedValue(false);
    mockRetryHandler.mockResolvedValue(false);

    const cachedPromise = createCachedPromise(mockTarget, mockCheckHandler, mockRetryHandler);

    await expect(cachedPromise()).rejects.toThrow('fail');
    expect(mockTarget).toHaveBeenCalledTimes(1);
    expect(mockCheckHandler).not.toHaveBeenCalled();
    expect(mockRetryHandler).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  });

  test('应该在并发调用时只执行一次目标函数', async () => {
    // should execute the target function only once during concurrent calls
    mockTarget.mockResolvedValue('result');
    mockCheckHandler.mockResolvedValue(true);

    const cachedPromise = createCachedPromise(mockTarget, mockCheckHandler);
    const [result1, result2] = await Promise.all([cachedPromise(), cachedPromise()]);

    expect(mockTarget).toHaveBeenCalledTimes(1);
    expect(mockCheckHandler).not.toHaveBeenCalled();
    expect(result1).toBe('result');
    expect(result2).toBe('result');
  });

  test('应该使用默认的检查处理器', async () => {
    // should use the default check handler
    mockTarget.mockResolvedValue('result');
    defaultCheckHandler.mockResolvedValue(true);

    const cachedPromise = createCachedPromise(mockTarget);
    await cachedPromise();
    await cachedPromise();

    expect(mockTarget).toHaveBeenCalledTimes(1);
    expect(defaultCheckHandler).toHaveBeenCalledTimes(1);
  });

  test('应该使用默认的重试处理器', async () => {
    // should use the default retry handler
    const error = new Error('fail');
    mockTarget.mockRejectedValueOnce(error).mockResolvedValueOnce('result');
    defaultCheckHandler.mockResolvedValue(false);
    defaultRetryHandler.mockResolvedValue(true);

    const cachedPromise = createCachedPromise(mockTarget);
    const result = await cachedPromise();

    expect(mockTarget).toHaveBeenCalledTimes(2);
    expect(defaultRetryHandler).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  test('不应该在禁用重试时进行重试', async () => {
    // should not retry when retry is disabled
    const error = new Error('fail');
    mockTarget.mockRejectedValue(error);
    defaultCheckHandler.mockResolvedValue(false);

    const cachedPromise = createCachedPromise(mockTarget, undefined, false);

    await expect(cachedPromise()).rejects.toThrow('fail');
    expect(mockTarget).toHaveBeenCalledTimes(1);
    expect(defaultCheckHandler).not.toHaveBeenCalled();
    expect(defaultRetryHandler).not.toHaveBeenCalled();
  });
});