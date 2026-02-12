import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// Get shader name from command line args or env
const shaderName = process.env.SHADER_NAME || 'simple';

// When building via `shader build`, the CLI generates _build-entry.js with
// shader-specific glob imports. We build it as a standalone ES module that
// exports mount(). In dev mode, index.html + main.ts is used as normal.
const useBuildEntry = !!process.env.SHADER_BUILD_ENTRY;

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin(),
  ],
  base: './',
  define: {
    __SHADER_NAME__: JSON.stringify(shaderName),
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: `dist/${shaderName}`,
    rollupOptions: {
      // In build mode, use the generated JS entry directly (produces an ES module).
      // In dev/other mode, fall back to default index.html entry.
      ...(useBuildEntry ? { input: './_build-entry.js' } : {}),
      output: {
        format: 'es',
        inlineDynamicImports: true,
        entryFileNames: 'main.js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name)) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
