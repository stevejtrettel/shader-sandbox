#!/usr/bin/env node

/**
 * Development server for a specific demo
 * Usage: npm run dev:demo <demo-name>
 * Example: npm run dev:demo keyboard-test
 */

const { execSync } = require('child_process');
const fs = require('fs');

const demo = process.argv[2];

if (!demo) {
  console.error('Error: Please specify a demo name');
  console.error('Usage: npm run dev:demo <demo-name>');
  console.error('Example: npm run dev:demo keyboard-test');
  process.exit(1);
}

console.log(`Starting dev server for demo: ${demo}`);

try {
  // Generate tiny loader with literal paths for this demo only
  // Use /demos/ (root-relative) for globs, then transform keys to ./ format for loadDemo
  console.log(`Generating loader for demo: ${demo}...`);
  const loaderContent = `// Auto-generated - DO NOT EDIT
import { loadDemo } from './loaderHelper';
import { ProjectConfig } from './types';

export const DEMO_NAME = 'demos/${demo}';

// Transform glob keys from "/path" to "./path" format
function transformKeys<T>(files: Record<string, T>): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(files)) {
    // Convert /demos/... to ./demos/...
    const newKey = key.startsWith('/') ? '.' + key : key;
    result[newKey] = value;
  }
  return result;
}

export async function loadDemoProject() {
  // Use root-relative paths for globs (works from any file location)
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

  execSync(`npx vite`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEMO: demo
    }
  });
} catch (error) {
  process.exit(error.status || 1);
}
