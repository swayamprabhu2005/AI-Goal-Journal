import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The dev server forwards "/api/*" to the FastAPI backend so the browser always
 * talks to the SAME origin it loaded the app from. That removes the hard-coded
 * 127.0.0.1 dependency inside the app (see src/services/api.js) and works for
 * every developer host: localhost, 127.0.0.1, a LAN IP, Codespaces, ...
 *
 * Point VITE_API_PROXY_TARGET (in .env) at another host/port when the backend
 * does not run on this machine.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
