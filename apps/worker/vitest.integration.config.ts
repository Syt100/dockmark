import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  process.env.SETUP_TOKEN ??= 'setup-secret'

  const migrations = await readD1Migrations('../../migrations')

  return {
    plugins: [
      cloudflareTest({
        main: './src/index.ts',
        wrangler: {
          configPath: './wrangler.jsonc',
        },
        miniflare: {
          d1Databases: ['DB'],
          kvNamespaces: ['KV'],
          bindings: {
            AUTH_MODE: 'builtin',
            APP_VERSION: '0.1.0-test',
            SETUP_TOKEN: 'setup-secret',
            SESSION_TOUCH_INTERVAL_SECONDS: '1',
          },
          serviceBindings: {
            ASSETS: async (request: Request) => {
              const url = new URL(request.url)

              if (url.pathname === '/' || url.pathname === '/index.html') {
                return new Response('<!doctype html><div id="app"></div>', {
                  headers: { 'content-type': 'text/html' },
                })
              }

              return new Response('Not found', { status: 404 })
            },
          },
        },
      }),
    ],
    test: {
      include: ['test/**/*.integration.test.ts'],
      provide: {
        migrations,
      },
    },
  }
})
