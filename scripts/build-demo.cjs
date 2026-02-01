#!/usr/bin/env node

/**
 * Build a specific demo for production
 * Usage: npm run build:demo <demo-name>
 * Example: npm run build:demo keyboard-test
 */

const { execSync, writeFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const demo = process.argv[2];

if (!demo) {
  console.error('Error: Please specify a demo name');
  console.error('Usage: npm run build:demo <demo-name>');
  console.error('Example: npm run build:demo keyboard-test');
  process.exit(1);
}

console.log(`Building demo: ${demo}`);

try {
  // Generate tiny loader with literal paths for this demo only
  console.log(`Generating loader for demo: ${demo}...`);
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

  // TypeScript compilation
  console.log('Running TypeScript compiler...');
  execSync('tsc', { stdio: 'inherit' });

  // Vite build
  console.log(`Building with Vite...`);
  execSync(`vite build`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEMO: demo
    }
  });

  console.log(`✓ Build complete for demo: ${demo}`);
  console.log(`Output: dist/`);
} catch (error) {
  process.exit(error.status || 1);
}
