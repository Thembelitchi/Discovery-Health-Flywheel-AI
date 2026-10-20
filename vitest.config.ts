import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // server.ts skips binding a port under NODE_ENV=test.
    env: { NODE_ENV: 'test' },
    include: ['src/**/*.test.ts'],
    // The ledger is module-level state; run files serially so they cannot
    // interleave writes to it.
    fileParallelism: false,
  },
});
