#!/usr/bin/env node

/**
 * Shader Sandbox CLI
 * Commands:
 *   shader create <name>       - Create a new shader project
 *   shader create .            - Initialize shaders in current directory
 *   shader new <name>          - Create a new shader
 *   shader dev <shader-name>   - Start development server
 *   shader build <shader-name> - Build for production
 *   shader list                - List available shaders
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
Shader Sandbox - Local GLSL shader development

Usage:
  shader create <name>       Create a new shader project
  shader create .            Initialize in current directory
  shader new <name>          Create a new shader
  shader dev <shader-name>   Start development server
  shader build <shader-name> Build for production
  shader list                List available shaders

Examples:
  shader create my-shaders   Create new project folder
  shader create .            Initialize in existing folder
  shader dev simple          Run a shader
  shader new my-shader       Create shaders/my-shader/
  shader list                Show all shaders
`);
}

function copyDir(src, dest, skipFiles = []) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    // Skip specified files
    if (skipFiles.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skipFiles);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getShaderList(cwd) {
  const shadersDir = path.join(cwd, 'shaders');
  if (!fs.existsSync(shadersDir)) {
    return null;
  }

  const entries = fs.readdirSync(shadersDir, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

function listShaders(cwd) {
  const shaders = getShaderList(cwd);

  if (shaders === null) {
    console.error('Error: shaders/ directory not found');
    console.error('');
    console.error('To get started:');
    console.error('  npx @stevejtrettel/shader-sandbox create .');
    process.exit(1);
  }

  if (shaders.length === 0) {
    console.log('No shaders found.');
    console.log('');
    console.log('Create your first shader:');
    console.log('  npx shader new my-shader');
    return;
  }

  console.log('Available shaders:');
  shaders.forEach(s => console.log(`  ${s}`));
  console.log('');
  console.log('Run a shader:');
  console.log(`  npx shader dev ${shaders[0]}`);
}

async function create(projectName) {
  const templatesDir = path.join(packageRoot, 'templates');
  const isCurrentDir = projectName === '.';

  // Validate name (allow "." for current directory)
  if (!projectName) {
    console.error('Error: Specify a project name or use "." for current directory');
    console.error('  npx @stevejtrettel/shader-sandbox create my-shaders');
    console.error('  npx @stevejtrettel/shader-sandbox create .');
    process.exit(1);
  }

  if (!isCurrentDir && !/^[a-zA-Z0-9_-]+$/.test(projectName)) {
    console.error('Error: Invalid project name');
    console.error('Use only letters, numbers, hyphens, and underscores');
    process.exit(1);
  }

  const projectDir = isCurrentDir ? process.cwd() : path.join(process.cwd(), projectName);
  const displayName = isCurrentDir ? path.basename(projectDir) : projectName;

  // Check for existing shaders directory
  const shaderDir = path.join(projectDir, 'shaders');
  if (fs.existsSync(shaderDir)) {
    console.error('Error: shaders/ directory already exists');
    process.exit(1);
  }

  // For new directory, check it doesn't exist
  if (!isCurrentDir && fs.existsSync(projectDir)) {
    console.error(`Error: Directory "${projectName}" already exists`);
    process.exit(1);
  }

  console.log(isCurrentDir
    ? 'Initializing shader project in current directory...'
    : `Creating shader project "${projectName}"...`);

  // Create project directory if needed
  if (!isCurrentDir) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Check if package.json exists
  const packageJsonPath = path.join(projectDir, 'package.json');
  const hasPackageJson = fs.existsSync(packageJsonPath);

  if (hasPackageJson) {
    // Add dependencies to existing package.json
    const existingPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    existingPackage.dependencies = existingPackage.dependencies || {};
    existingPackage.dependencies['@stevejtrettel/shader-sandbox'] = '^0.1.0';
    existingPackage.dependencies['vite'] = '^5.0.0';
    existingPackage.dependencies['vite-plugin-css-injected-by-js'] = '^3.5.0';
    fs.writeFileSync(packageJsonPath, JSON.stringify(existingPackage, null, 2) + '\n');
  } else {
    // Generate new package.json
    const packageJson = {
      name: displayName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'shader dev',
        build: 'shader build',
        list: 'shader list'
      },
      dependencies: {
        '@stevejtrettel/shader-sandbox': '^0.1.0',
        'vite': '^5.0.0',
        'vite-plugin-css-injected-by-js': '^3.5.0'
      }
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }

  // Copy template files (skip package.json since we handled it above)
  copyDir(templatesDir, projectDir, ['package.json']);

  // Run npm install
  console.log('Installing dependencies...');

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['install'], {
    cwd: projectDir,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  child.on('error', (err) => {
    console.error('Failed to run npm install:', err.message);
    console.log('\nProject created but dependencies not installed.');
    console.log(isCurrentDir ? 'Run: npm install' : `Run: cd ${projectName} && npm install`);
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error('\nnpm install failed.');
      console.log(isCurrentDir ? 'Run: npm install' : `Run: cd ${projectName} && npm install`);
      process.exit(code);
    }

    if (isCurrentDir) {
      console.log(`
✓ Shader project initialized!

Next steps:
  npx shader dev simple          Run a shader
  npx shader list                Show all shaders
  npx shader new my-shader       Create a new shader

(If installed globally, use "shader" instead of "npx shader")
`);
    } else {
      console.log(`
✓ Project "${projectName}" created!

Next steps:
  cd ${projectName}
  npx shader dev simple          Run a shader
  npx shader list                Show all shaders
  npx shader new my-shader       Create a new shader

(If installed globally, use "shader" instead of "npx shader")
`);
    }
  });
}

function createNewShader(name) {
  const cwd = process.cwd();
  const shadersDir = path.join(cwd, 'shaders');

  // Check shaders directory exists
  if (!fs.existsSync(shadersDir)) {
    console.error('Error: shaders/ directory not found');
    console.error('Run "npx @stevejtrettel/shader-sandbox create ." first');
    process.exit(1);
  }

  // Validate name
  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    console.error('Error: Invalid shader name');
    console.error('Use only letters, numbers, hyphens, and underscores');
    process.exit(1);
  }

  const shaderDir = path.join(shadersDir, name);

  // Check if already exists
  if (fs.existsSync(shaderDir)) {
    console.error(`Error: Shader "${name}" already exists`);
    process.exit(1);
  }

  // Create directory
  fs.mkdirSync(shaderDir, { recursive: true });

  // Create image.glsl with starter template
  const imageGlsl = `void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Time varying pixel color
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));

    // Output to screen
    fragColor = vec4(col, 1.0);
}
`;

  fs.writeFileSync(path.join(shaderDir, 'image.glsl'), imageGlsl);

  // Create config.json
  const config = {
    layout: 'default',
    controls: true
  };

  fs.writeFileSync(path.join(shaderDir, 'config.json'), JSON.stringify(config, null, 2) + '\n');

  console.log(`
✓ Created shader "${name}"

Files:
  shaders/${name}/image.glsl     Main shader
  shaders/${name}/config.json    Configuration

Run it:
  npx shader dev ${name}
`);
}

function runVite(viteArgs, shaderName) {
  const cwd = process.cwd();

  // Check for vite.config.js
  if (!fs.existsSync(path.join(cwd, 'vite.config.js'))) {
    console.error('Error: vite.config.js not found');
    console.error('Run "npx @stevejtrettel/shader-sandbox create ." first');
    process.exit(1);
  }

  // Find vite binary
  const viteBin = path.join(cwd, 'node_modules', '.bin', 'vite');
  if (!fs.existsSync(viteBin)) {
    console.error('Error: vite not found in node_modules');
    console.error('Run "npm install" first');
    process.exit(1);
  }

  const env = { ...process.env, SHADER_NAME: shaderName };

  const child = spawn(viteBin, viteArgs, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env
  });

  child.on('error', (err) => {
    console.error('Failed to start vite:', err.message);
    process.exit(1);
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });
}

// Main command handler
switch (command) {
  case 'create': {
    const name = args[1];
    if (!name) {
      console.error('Error: Specify a project name or use "." for current directory');
      console.error('  npx @stevejtrettel/shader-sandbox create my-shaders');
      console.error('  npx @stevejtrettel/shader-sandbox create .');
      process.exit(1);
    }
    create(name);
    break;
  }

  case 'new': {
    const name = args[1];
    if (!name) {
      console.error('Error: Specify a shader name');
      console.error('  npx shader new <name>');
      process.exit(1);
    }
    createNewShader(name);
    break;
  }

  case 'dev': {
    const shaderName = args[1];
    const cwd = process.cwd();

    if (!shaderName) {
      const shaders = getShaderList(cwd);

      if (shaders === null) {
        console.error('Error: shaders/ directory not found');
        console.error('');
        console.error('To get started:');
        console.error('  npx @stevejtrettel/shader-sandbox create .');
        process.exit(1);
      }

      if (shaders.length === 0) {
        console.error('Error: No shaders found');
        console.error('');
        console.error('Create your first shader:');
        console.error('  npx shader new my-shader');
        process.exit(1);
      }

      console.error('Error: Specify which shader to run');
      console.error('');
      console.error('Available shaders:');
      shaders.forEach(s => console.error(`  ${s}`));
      console.error('');
      console.error('Usage:');
      console.error(`  npx shader dev ${shaders[0]}`);
      process.exit(1);
    }

    const shaderPath = path.join(cwd, 'shaders', shaderName);
    if (!fs.existsSync(shaderPath)) {
      const shaders = getShaderList(cwd);

      console.error(`Error: Shader "${shaderName}" not found`);

      if (shaders && shaders.length > 0) {
        // Check for similar names (typo detection)
        const similar = shaders.filter(s =>
          s.toLowerCase().includes(shaderName.toLowerCase()) ||
          shaderName.toLowerCase().includes(s.toLowerCase())
        );

        if (similar.length > 0) {
          console.error('');
          console.error('Did you mean:');
          similar.forEach(s => console.error(`  ${s}`));
        } else {
          console.error('');
          console.error('Available shaders:');
          shaders.forEach(s => console.error(`  ${s}`));
        }
      }
      process.exit(1);
    }

    console.log(`Starting dev server for "${shaderName}"...`);
    runVite([], shaderName);
    break;
  }

  case 'build': {
    const shaderName = args[1];
    const cwd = process.cwd();

    if (!shaderName) {
      const shaders = getShaderList(cwd);

      if (shaders && shaders.length > 0) {
        console.error('Error: Specify which shader to build');
        console.error('');
        console.error('Available shaders:');
        shaders.forEach(s => console.error(`  ${s}`));
        console.error('');
        console.error('Usage:');
        console.error(`  npx shader build ${shaders[0]}`);
      } else {
        console.error('Error: Specify a shader name');
        console.error('  npx shader build <shader-name>');
      }
      process.exit(1);
    }

    const shaderPath = path.join(cwd, 'shaders', shaderName);
    if (!fs.existsSync(shaderPath)) {
      const shaders = getShaderList(cwd);

      console.error(`Error: Shader "${shaderName}" not found`);

      if (shaders && shaders.length > 0) {
        const similar = shaders.filter(s =>
          s.toLowerCase().includes(shaderName.toLowerCase()) ||
          shaderName.toLowerCase().includes(s.toLowerCase())
        );

        if (similar.length > 0) {
          console.error('');
          console.error('Did you mean:');
          similar.forEach(s => console.error(`  ${s}`));
        } else {
          console.error('');
          console.error('Available shaders:');
          shaders.forEach(s => console.error(`  ${s}`));
        }
      }
      process.exit(1);
    }

    console.log(`Building "${shaderName}"...`);
    runVite(['build'], shaderName);
    break;
  }

  case 'list':
    listShaders(process.cwd());
    break;

  case 'help':
  case '--help':
  case '-h':
    printUsage();
    break;

  case undefined:
    printUsage();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
