#!/usr/bin/env node

/**
 * Development server for a specific demo
 * Usage: npm run dev:demo <demo-name>
 * Example: npm run dev:demo keyboard-test
 */

const { execSync } = require('child_process');
const { writeLoader } = require('./generate-loader.cjs');

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
  console.log(`Generating loader for demo: ${demo}...`);
  writeLoader(demo);

  execSync(`npx vite`, {
    stdio: 'inherit',
  });
} catch (error) {
  process.exit(error.status || 1);
}
