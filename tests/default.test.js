const { defaultCheckHandler, defaultRetryHandler } = require('../src/default');

describe('defaultCheckHandler', () => {
  test('应该在 prevUpdateTime 不是数字时返回 true', async () => {
    // should return true when prevUpdateTime is not a number
    const result = await defaultCheckHandler({ prevUpdateTime: 'not a number' });
    expect(result).toBe(true);
  });

  describe('defaultCheckHandler', () => {
    test('应该在 prevUpdateTime 不是数字时返回 true', async () => {
      // should return true when prevUpdateTime is not a number
      const result = await defaultCheckHandler({ prevUpdateTime: 'not a number' });
      expect(result).toBe(true);
    });

    test('应该在冷却时间内返回 true', async () => {
      // should return true when within cooldown period
      const prevUpdateTime = Date.now() - 2000; // 2 seconds ago
      const result = await defaultCheckHandler({ prevUpdateTime });
      expect(result).toBe(true);
    });

    test('应该在冷却时间外返回 false', async () => {
      // should return false when outside cooldown period
      const prevUpdateTime = Date.now() - 4000; // 4 seconds ago
      const result = await defaultCheckHandler({ prevUpdateTime });
      expect(result).toBe(false);
    });

    test('应该在没有传递参数时返回 true', async () => {
      // should return true when no parameters are passed
      const result = await defaultCheckHandler();
      expect(result).toBe(true);
    });
  });

  describe('defaultRetryHandler', () => {
    jest.useFakeTimers();

    test('应该在错误次数超过最大重试次数时返回 false', async () => {
      // should return false when error count exceeds max retry count
      const result = await defaultRetryHandler({ errorCount: 4 });
      expect(result).toBe(false);
    });

    test('应该在错误次数未超过最大重试次数时返回 true 并延迟', async () => {
      // should return true and delay when error count does not exceed max retry count
      const resultPromise = defaultRetryHandler({ errorCount: 2 });
      jest.advanceTimersByTime(1000); // advance time by 1 second
      const result = await resultPromise;
      expect(result).toBe(true);
    });

    test('应该根据错误次数增加延迟时间', async () => {
      // should increase delay time based on error count
      const errorCount = 3;
      const delayTime = (errorCount - 1) * 1000; // 2 seconds delay
      const resultPromise = defaultRetryHandler({ errorCount });
      jest.advanceTimersByTime(delayTime); // advance time by delay time
      const result = await resultPromise;
      expect(result).toBe(true);
    });

    test('应该在错误次数为 0 时立即重试', async () => {
      // should retry immediately when error count is 0
      const resultPromise = defaultRetryHandler({ errorCount: 0 });
      jest.advanceTimersByTime(0); // advance time by 0 seconds
      const result = await resultPromise;
      expect(result).toBe(true);
    });

    test('应该在没有传递参数时立即重试', async () => {
      // should retry immediately when no parameters are passed
      const resultPromise = defaultRetryHandler();
      jest.advanceTimersByTime(0); // advance time by 0 seconds
      const result = await resultPromise;
      expect(result).toBe(true);
    });
  });
});