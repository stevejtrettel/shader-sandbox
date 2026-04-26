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
    // In build mode, use library mode so the entry's `export { mount }` is preserved.
    // Without this, vite's default app mode tree-shakes exports, leaving an empty bundle.
    ...(useBuildEntry ? {
      lib: {
        entry: './_build-entry.js',
        formats: ['es'],
        fileName: () => 'main.js',
      },
    } : {}),
    rollupOptions: {
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
