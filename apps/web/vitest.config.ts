import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    define: {
      __APP_VERSION__: JSON.stringify('0.1.0'),
      __BUILD_TIME__: JSON.stringify('2026-05-31T08:15:30.000Z'),
      __GIT_COMMIT_SHORT__: JSON.stringify('test-commit'),
    },
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
