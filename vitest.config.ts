import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

const publicDir = fileURLToPath(new URL('./public', import.meta.url));

export default defineConfig(() =>
  mergeConfig(
    viteConfig,
    defineConfig({
      resolve: {
        // Templates turn src="/x.svg" into an import of a public/ file; on Windows Vitest
        // resolves that root path to file:///x.svg and crashes, so point it at public/.
        alias: [{ find: /^\/([^/]+\.(?:svg|png))$/, replacement: `${publicDir}/$1` }],
      },
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
);
