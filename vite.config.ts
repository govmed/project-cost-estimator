/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
  test: {
    globals: false,
    // Use node for engine tests (they use fs/path); component tests can opt-in to jsdom per-file.
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup/global-setup.ts'],

    // M5d-3: pin to single-fork pool so tests run serially in one worker.
    // We have shared module state (Zustand stores, audit-log localStorage cache)
    // that doesn't reset between test files. On a multi-core Windows box the
    // default parallel scheduling races on that state and fails intermittently:
    //
    //   - one test file resets the project store while another is rendering
    //   - localStorage mutations from one file leak into the next
    //   - window.history.pushState in one file changes the URL another file
    //     is mid-assertion on
    //
    // The fix is to serialize. Cost: ~+35s on a full run (60s -> 95s).
    // Benefit: zero flakes. We're at 270 tests; not worth the complexity of
    // per-worker store isolation yet.
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
