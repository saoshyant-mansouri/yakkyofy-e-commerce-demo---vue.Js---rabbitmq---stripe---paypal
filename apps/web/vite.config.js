import path from 'node:path';
import { defineConfig } from 'vite';
import vue2 from '@vitejs/plugin-vue2';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue2(), tailwindcss()],
  // The shared .env lives at the monorepo root (one `cp .env.example .env`
  // for api/worker/web alike), not inside apps/web — Vite only looks in its
  // own project root by default, so without this VITE_API_BASE_URL and the
  // Stripe/PayPal keys are silently undefined in dev.
  envDir: path.resolve(import.meta.dirname, '../..'),
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
