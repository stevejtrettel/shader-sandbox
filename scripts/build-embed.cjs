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

export const DEMO_NAME = 'demos/${demo}';

// Transform glob keys from "/path" to "./path" format
function transformKeys<T>(files: Record<string, T>): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(files)) {
    const newKey = key.startsWith('/') ? '.' + key : key;
    result[newKey] = value;
  }
  return result;
}

export async function loadDemoProject() {
  const glslFilesRaw = import.meta.glob<string>('/demos/${demo}/**/*.glsl', {
    query: '?raw',
    import: 'default',
  });

  const jsonFilesRaw = import.meta.glob<ProjectConfig>('/demos/${demo}/**/*.json', {
    import: 'default',
  });

  const imageFilesRaw = import.meta.glob<string>('/demos/${demo}/**/*.{jpg,jpeg,png,gif,webp,bmp}', {
    query: '?url',
    import: 'default',
  });

  // Script files (setup.js / script.js hooks for JS-driven computation)
  const scriptFilesRaw = import.meta.glob<any>('/demos/${demo}/**/script.js');

  // Transform keys to ./ format that loadDemo expects
  const glslFiles = transformKeys(glslFilesRaw);
  const jsonFiles = transformKeys(jsonFilesRaw);
  const imageFiles = transformKeys(imageFilesRaw);
  const scriptFiles = transformKeys(scriptFilesRaw);

  return loadDemo(DEMO_NAME, glslFiles, jsonFiles, imageFiles, scriptFiles);
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