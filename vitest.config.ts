import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig(() =>
  mergeConfig(
    viteConfig,
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        css: {
          include: /.+/,
          // Readable class names, so tests can assert on e.g. `checkbox--chip`.
          modules: { classNameStrategy: 'non-scoped' },
        },
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/tests/e2e/**', // Exclude Playwright E2E tests
          '**/tests/firestore/**', // Needs the emulator; run with npm run test:rules
          '**/legacy-vue/**', // Unported Vue reference code, not part of the build
          '**/.{idea,git,cache,output,temp}/**',
        ],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/',
            'dist/',
            'legacy-vue/',
            '**/*.config.*',
            '**/test-utils/**',
            '**/__mocks__/**',
          ],
        },
      },
    })
  )
);
