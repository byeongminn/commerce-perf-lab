import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // 서버 로직 · 순수 함수는 node에서 돌린다.
    // renderHook을 쓰는 파일만 상단에 `// @vitest-environment happy-dom`을 붙인다
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
