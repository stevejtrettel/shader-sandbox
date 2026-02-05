import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// Get shader name from command line args or env
const shaderName = process.env.SHADER_NAME || 'simple';

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
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'assets/main.js',
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
