import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import vue2 from '@vitejs/plugin-vue2';
import tailwindcss from '@tailwindcss/vite';

// The shared .env lives at the monorepo root (one `cp .env.example .env`
// for api/worker/web alike), not inside apps/web — Vite only looks in its
// own project root by default, so without this VITE_API_BASE_URL and the
// Stripe/PayPal keys are silently undefined in dev.
const envDir = path.resolve(import.meta.dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');

  return {
    plugins: [vue2(), tailwindcss()],
    envDir,
    server: {
      port: 5173,
      host: true,
      // Same shape as production, where vercel.json rewrites /api/* to the API: the browser only
      // ever talks to one origin, so SameSite=Lax auth cookies behave identically in dev.
      // Point DEV_API_PROXY at the deployed API to try the cold-start splash locally.
      proxy: {
        '/api': { target: env.DEV_API_PROXY || 'http://localhost:4000', changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Never inline fonts as data: URIs: the CSP (vercel.json / nginx.conf) has no font-src, so
      // default-src 'self' blocks them, and a small font subset would otherwise fall under Vite's
      // 4 kB inline threshold.
      assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
      rollupOptions: {
        output: {
          // The framework runtime changes far less often than app code. In its own chunk it keeps
          // its immutable cache entry across deploys, so a returning visitor re-downloads only the
          // app chunk that actually changed.
          manualChunks(id) {
            if (/node_modules\/(vue|vuex|vue-router|vue-i18n|axios)\//.test(id)) return 'vendor';
          },
        },
      },
    },
  };
});
