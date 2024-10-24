import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'CachedPromise',
      formats: ['es', 'cjs'],
      fileName: format => format === 'es' ? 'cached-promise.js' : 'cached-promise.cjs'
    },
    rollupOptions: {
      external: [], // 在这里添加你不想打包进库的依赖
      output: {
        globals: {} // 在这里添加全局变量名称映射
      }
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