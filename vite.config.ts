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
  },
});
