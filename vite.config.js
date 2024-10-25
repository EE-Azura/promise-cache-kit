import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'PromiseCacheKit',
      formats: ['es', 'cjs'],
      fileName: format =>
        format === 'es' ? 'promise-cache-kit.js' : 'promise-cache-kit.cjs'
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './vitest.setup.js'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
