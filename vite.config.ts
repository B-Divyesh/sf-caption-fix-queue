import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        notFound: resolve(root, '404.html'),
        privacy: resolve(root, 'privacy/index.html'),
        terms: resolve(root, 'terms/index.html'),
        offline: resolve(root, 'offline.html')
      }
    }
  }
});
