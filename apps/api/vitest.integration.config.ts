import { defineConfig } from 'vitest/config';

/**
 * Integration suite: requires a reachable database via DATABASE_URL.
 * Run with `pnpm test:integration`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.integration.test.ts'],
    testTimeout: 30_000,
  },
});
