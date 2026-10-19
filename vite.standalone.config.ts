import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Builds the console into ONE self-contained HTML file with no backend.
 *
 * Uses `index.standalone.html` -> `src/main.standalone.tsx`, which installs the
 * in-browser API before rendering. Output: dist-standalone/index.standalone.html
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: {
    outDir: 'dist-standalone',
    rollupOptions: { input: path.resolve(__dirname, 'index.standalone.html') },
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
