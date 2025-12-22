import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig(() =>
  mergeConfig(
    viteConfig,
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        css: true,
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/tests/e2e/**', // Exclude Playwright E2E tests
          '**/.{idea,git,cache,output,temp}/**',
        ],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/',
            'dist/',
            '**/*.config.*',
            '**/test-utils/**',
            '**/__mocks__/**',
          ],
        },
      },
    })
  )
)
