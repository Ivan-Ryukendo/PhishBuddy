import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['core/**/*.test.ts', 'extension/**/*.test.ts'],
    environment: 'node'
  }
});
