import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    globals: true,
    testTimeout: 15000, // 15 seconds for AI API calls
    env: {
      // Load from .env.local for tests
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'sk-ant-api03-test-key-for-development-only'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  define: {
    // Avoid CSS-related imports during testing
    'import.meta.env.CSS': false,
  },
});