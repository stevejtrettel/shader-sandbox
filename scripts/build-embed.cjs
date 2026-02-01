#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const demo = process.argv[2];

if (!demo) {
  console.error('Usage: npm run build:embed <demo-name>');
  process.exit(1);
}

console.log(`Building embeddable module for: ${demo}`);

try {
  // Generate the loader
  const loaderContent = `// Auto-generated - DO NOT EDIT
import { loadDemo } from './loaderHelper';
import { ProjectConfig } from './types';

export const DEMO_NAME = '${demo}';

export async function loadDemoProject() {
  const glslFiles = import.meta.glob<string>('/demos/${demo}/**/*.glsl', {
    query: '?raw',
    import: 'default',
  });

  const jsonFiles = import.meta.glob<ProjectConfig>('/demos/${demo}/**/*.json', {
    import: 'default',
  });

  const imageFiles = import.meta.glob<string>('/demos/${demo}/**/*.{jpg,jpeg,png,gif,webp,bmp}', {
    query: '?url',
    import: 'default',
  });

  return loadDemo(DEMO_NAME, glslFiles, jsonFiles, imageFiles);
}
`;

  fs.writeFileSync('src/project/generatedLoader.ts', loaderContent);

  // TypeScript check
  execSync('tsc', { stdio: 'inherit' });

  // Build
  const outDir = `dist-embed/${demo}`;
  execSync(`vite build --config vite.config.embed.ts --outDir ${outDir}`, {
    stdio: 'inherit',
  });

  console.log(`\n✓ Done: ${outDir}/embed.js`);

} catch (error) {
  process.exit(error.status || 1);
}