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
