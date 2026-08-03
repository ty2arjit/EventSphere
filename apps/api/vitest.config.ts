import { defineConfig } from 'vitest/config';

/**
 * Default suite: unit + API tests only — no external infrastructure, so it
 * runs anywhere, offline, in milliseconds.
 *
 * Integration tests (*.integration.test.ts) require a live database and are
 * run separately via `pnpm test:integration`. They are excluded here rather
 * than skipped conditionally, so a genuine database failure in CI can never
 * be silently swallowed as "environment unavailable".
 */
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
  },
});
