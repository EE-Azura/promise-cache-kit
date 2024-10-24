import { vi } from 'vitest';

// Mock defaultCheckHandler and defaultRetryHandler
vi.mock('@/default', () => ({
  defaultCheckHandler: vi.fn(),
  defaultRetryHandler: vi.fn()
}));

// Mock createRetryPromise
vi.mock('@/retry', () => ({
  createRetryPromise: vi.fn((target, retryHandler = () => Promise.resolve(false)) => {
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