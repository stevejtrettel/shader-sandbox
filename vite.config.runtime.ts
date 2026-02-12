/**
 * Vite config for building the standalone runtime loader bundle.
 *
 * Produces a single ES module (dist-runtime/shader-sandbox.js) that can be
 * served from any static file server. Includes all CSS inlined into JS.
 *
 * Usage: vite build --config vite.config.runtime.ts
 */

import { defineConfig } from 'vite';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin(),
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-runtime',
    lib: {
      entry: path.resolve(__dirname, 'src/runtime.ts'),
      formats: ['es'],
      fileName: () => 'shader-sandbox.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
