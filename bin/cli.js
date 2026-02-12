#!/usr/bin/env node

/**
 * Shader Sandbox CLI
 * Commands:
 *   shader create <name>              - Create a new shader project
 *   shader create .                   - Initialize shaders in current directory
 *   shader new <name> [template]      - Create a new shader from template
 *   shader dev <shader-name>          - Start development server
 *   shader build <shader-name>        - Build for production
 *   shader build-all                  - Build all shaders in shaders/
 *   shader build-runtime              - Build the standalone runtime loader
 *   shader list                       - List available shaders
 *   shader build-gallery              - Build a static gallery index page
 *   shader render <name> [options]    - Render frames/video headlessly
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

const AVAILABLE_TEMPLATES = ['simple', 'shadertoy', 'buffers', 'scripted'];
const DEFAULT_TEMPLATE = 'simple';

// Read own package version for use in generated projects
const ownPackageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf-8'));
const PACKAGE_VERSION = `^${ownPackageJson.version}`;

function printUsage() {
  console.log(`
Shader Sandbox - Local GLSL shader development

Usage:
  shader create <name>              Create a new shader project
  shader create .                   Initialize in current directory
  shader new <name> [template]      Create a new shader from template
  shader dev <shader-name>          Start development server
  shader build <shader-name>        Build for production
  shader build-all                  Build all shaders in shaders/
  shader build-runtime              Build the standalone runtime loader
  shader list                       List available shaders
  shader build-gallery              Build a static gallery index page
  shader render <name> [options]    Render frames/video (headless)

Templates for 'shader new':
  simple      Minimal starter (default)
  shadertoy   Shadertoy-compatible mode
  buffers     Multi-pass with trail buffer
  scripted    JS-driven particle system (script.js)

Examples:
  shader create my-shaders          Create new project folder
  shader create .                   Initialize in existing folder
  shader dev simple                 Run a shader
  shader new my-shader              Create with default template
  shader new my-shader scripted     Create with scripted template
  shader build-all                  Build all shaders at once
  shader list                       Show all shaders
`);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  const names = new Set();

  // Shader folders (have image.glsl or any .glsl inside)
  for (const e of entries) {
    if (e.isDirectory()) names.add(e.name);
  }

  // Bare .glsl files (my-shader.glsl → "my-shader")
  for (const e of entries) {
    if (!e.isDirectory() && e.name.endsWith('.glsl')) {
      names.add(e.name.replace(/\.glsl$/, ''));
    }
  }

  return [...names].sort();
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
    existingPackage.dependencies['@stevejtrettel/shader-sandbox'] = PACKAGE_VERSION;
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
        '@stevejtrettel/shader-sandbox': PACKAGE_VERSION,
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

function createNewShader(name, template) {
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

  // Validate template
  const templateName = template || DEFAULT_TEMPLATE;
  if (!AVAILABLE_TEMPLATES.includes(templateName)) {
    console.error(`Error: Unknown template "${templateName}"`);
    console.error('');
    console.error('Available templates:');
    console.error('  simple      Minimal starter (default)');
    console.error('  shadertoy   Shadertoy-compatible mode');
    console.error('  buffers     Multi-pass with trail buffer');
    console.error('  scripted    JS-driven particle system (script.js)');
    process.exit(1);
  }

  const shaderDir = path.join(shadersDir, name);

  // Check if already exists
  if (fs.existsSync(shaderDir)) {
    console.error(`Error: Shader "${name}" already exists`);
    process.exit(1);
  }

  // Copy template files from package's templates/shaders/{template}/
  const templateDir = path.join(packageRoot, 'templates', 'shaders', templateName);
  if (!fs.existsSync(templateDir)) {
    console.error(`Error: Template directory not found: ${templateDir}`);
    process.exit(1);
  }

  copyDir(templateDir, shaderDir);

  // List created files
  const createdFiles = [];
  function listFiles(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        listFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`);
      } else {
        createdFiles.push(`${prefix}${entry.name}`);
      }
    }
  }
  listFiles(shaderDir, `shaders/${name}/`);

  console.log(`
✓ Created shader "${name}" from "${templateName}" template

Files:
${createdFiles.map(f => `  ${f}`).join('\n')}

Run it:
  npx shader dev ${name}
`);
}

function findViteBin(cwd) {
  const base = path.join(cwd, 'node_modules', '.bin', 'vite');
  // On Windows, npm creates .cmd shims; check both forms
  if (fs.existsSync(base)) return base;
  if (fs.existsSync(base + '.cmd')) return base + '.cmd';
  return null;
}

/**
 * Check if a shader exists (as a folder or bare .glsl file).
 */
function shaderExists(cwd, shaderName) {
  const shadersDir = path.join(cwd, 'shaders');
  const folderPath = path.join(shadersDir, shaderName);
  const bareFile = path.join(shadersDir, `${shaderName}.glsl`);
  return (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory())
    || fs.existsSync(bareFile);
}

/**
 * Resolve a shader name to a directory path, handling bare .glsl files.
 * If shaders/<name>/ exists, returns { dir, cleanup: null }.
 * If shaders/<name>.glsl exists, creates a temp directory and returns { dir, cleanup }.
 * Returns null if neither exists.
 */
function resolveShaderPath(cwd, shaderName) {
  const shadersDir = path.join(cwd, 'shaders');
  const folderPath = path.join(shadersDir, shaderName);
  const bareFile = path.join(shadersDir, `${shaderName}.glsl`);

  if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
    return { dir: folderPath, cleanup: null };
  }

  if (fs.existsSync(bareFile)) {
    // Create a temp directory with the .glsl file as image.glsl
    fs.mkdirSync(folderPath, { recursive: true });
    fs.copyFileSync(bareFile, path.join(folderPath, 'image.glsl'));
    return {
      dir: folderPath,
      cleanup: () => {
        try { fs.rmSync(folderPath, { recursive: true }); } catch {}
      },
    };
  }

  return null;
}

/**
 * Build a single shader. Returns a promise that resolves on success.
 * Handles bare .glsl files by wrapping them in a temp directory.
 */
function buildShader(shaderName, cwd) {
  return new Promise((resolve, reject) => {
    const resolved = resolveShaderPath(cwd, shaderName);
    if (!resolved) {
      reject(new Error(`Shader "${shaderName}" not found`));
      return;
    }

    const { cleanup } = resolved;

    // Generate a shader-specific build entry that exports mount().
    const buildEntryPath = path.join(cwd, '_build-entry.js');
    const buildEntryCode = `
import { mount as _mount, loadDemo } from '@stevejtrettel/shader-sandbox';

const glslFiles = import.meta.glob('./shaders/${shaderName}/**/*.glsl', { query: '?raw', import: 'default' });
const jsonFiles = import.meta.glob('./shaders/${shaderName}/*.json', { import: 'default' });
const imageFiles = import.meta.glob('./shaders/${shaderName}/**/*.{jpg,jpeg,png,gif,webp,bmp}', { query: '?url', import: 'default' });
const scriptFiles = import.meta.glob('./shaders/${shaderName}/**/script.js');

let _project = null;

async function getProject() {
  if (!_project) {
    _project = await loadDemo('shaders/${shaderName}', glslFiles, jsonFiles, imageFiles, scriptFiles);
  }
  return _project;
}

/**
 * Mount this shader into a DOM element.
 * @param {HTMLElement} el - Target container element
 * @param {Object} [options] - Mount options (styled, pixelRatio, layout, controls, theme, startPaused)
 * @returns {Promise<{pause, resume, reset, isPaused, setUniform, getUniform, destroy}>}
 */
export async function mount(el, options = {}) {
  const project = await getProject();
  return _mount(el, { project, ...options });
}
`.trimStart();

    fs.writeFileSync(buildEntryPath, buildEntryCode);

    function cleanupAll() {
      try { fs.unlinkSync(buildEntryPath); } catch {}
      if (cleanup) cleanup();
    }

    const viteBin = findViteBin(cwd);
    if (!viteBin) {
      cleanupAll();
      reject(new Error('vite not found in node_modules. Run "npm install" first'));
      return;
    }

    const env = { ...process.env, SHADER_NAME: shaderName, SHADER_BUILD_ENTRY: '1' };

    const child = spawn(viteBin, ['build'], {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env
    });

    child.on('error', (err) => {
      cleanupAll();
      reject(new Error(`Failed to start vite: ${err.message}`));
    });

    child.on('close', (code) => {
      cleanupAll();

      if (code !== 0) {
        reject(new Error(`Build failed for "${shaderName}" (exit code ${code})`));
        return;
      }

      const outDir = path.join(cwd, 'dist', shaderName);

      // Copy live-app.js custom element to output
      const liveAppSrc = path.join(packageRoot, 'templates', 'live-app.js');
      if (fs.existsSync(liveAppSrc)) {
        fs.copyFileSync(liveAppSrc, path.join(outDir, 'live-app.js'));
      }

      // Generate a convenience index.html that uses <live-app>
      const prettyTitle = shaderName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${prettyTitle}</title>
  <script type="module" src="./live-app.js"><\/script>
  <style>* { margin: 0; padding: 0; box-sizing: border-box; }</style>
</head>
<body>
  <live-app src="./main.js" fullpage><\/live-app>
</body>
</html>`;
      fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

      resolve();
    });
  });
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
  const viteBin = findViteBin(cwd);
  if (!viteBin) {
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
    create(name).catch(err => {
      console.error('Error creating project:', err.message || err);
      process.exit(1);
    });
    break;
  }

  case 'new': {
    const name = args[1];
    if (!name) {
      console.error('Error: Specify a shader name');
      console.error('  npx shader new <name> [template]');
      console.error('');
      console.error('Available templates:');
      AVAILABLE_TEMPLATES.forEach(t => console.error(`  ${t}${t === DEFAULT_TEMPLATE ? ' (default)' : ''}`));
      process.exit(1);
    }
    createNewShader(name, args[2]);
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

      // No shader specified — show gallery
      console.log('Starting gallery...');
      runVite([], '__gallery__');
      break;
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

    // Check shader exists (folder or bare .glsl)
    if (!shaderExists(cwd, shaderName)) {
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

    buildShader(shaderName, cwd).then(() => {
      console.log(`\n✓ Built to dist/${shaderName}/`);
      console.log('');
      console.log('Files:');
      console.log(`  dist/${shaderName}/main.js       ES module (exports mount)`);
      console.log(`  dist/${shaderName}/live-app.js    <live-app> custom element`);
      console.log(`  dist/${shaderName}/index.html     Standalone page`);
      console.log('');
      console.log('Embed in your site:');
      console.log(`  <script type="module" src="/js/live-app.js"><\/script>`);
      console.log(`  <live-app src="/visualizations/${shaderName}.js" style="width:100%;height:400px;display:block"><\/live-app>`);
      console.log('');
      console.log('Or import directly:');
      console.log(`  import { mount } from './${shaderName}/main.js';`);
      console.log(`  const handle = await mount(myElement);`);
      console.log(`  // later: handle.destroy();`);
      process.exit(0);
    }).catch((err) => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });

    break;
  }

  case 'build-gallery': {
    const cwd = process.cwd();
    const shaders = getShaderList(cwd);

    if (shaders === null || shaders.length === 0) {
      console.error('Error: No shaders found to build gallery');
      process.exit(1);
    }

    // Read config.json for each shader to get title/description
    const cards = shaders.map(name => {
      const configPath = path.join(cwd, 'shaders', name, 'config.json');
      let title = name;
      let description = '';
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (config.meta?.title) title = config.meta.title;
          if (config.meta?.description) description = config.meta.description;
        } catch {}
      }
      return { name, title, description };
    });

    // Check which shaders have been built
    const distDir = path.join(cwd, 'dist');
    const notBuilt = cards.filter(c => !fs.existsSync(path.join(distDir, c.name, 'index.html')));
    if (notBuilt.length > 0) {
      console.warn(`Warning: ${notBuilt.length} shader(s) not yet built — gallery links will be broken:`);
      notBuilt.forEach(c => console.warn(`  ${c.name}  (run: npx shader build ${c.name})`));
      console.warn('');
    }

    fs.mkdirSync(distDir, { recursive: true });

    const galleryHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shader Gallery</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      background: #0a0a0f;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 60px 40px;
    }
    h1 {
      text-align: center;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 40px;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: rgba(30, 30, 40, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 24px;
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      backdrop-filter: blur(12px);
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(100, 140, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #fff;
    }
    .card-name {
      font-size: 12px;
      font-family: 'Monaco', 'Menlo', monospace;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 8px;
    }
    .card-desc {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <h1>Shader Gallery</h1>
  <div class="gallery">
${cards.map(c => `    <a class="card" href="${escapeHtml(c.name)}/index.html">
      <div class="card-title">${escapeHtml(c.title)}</div>
      ${c.title !== c.name ? `<div class="card-name">${escapeHtml(c.name)}</div>` : ''}
      ${c.description ? `<div class="card-desc">${escapeHtml(c.description)}</div>` : ''}
    </a>`).join('\n')}
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(distDir, 'index.html'), galleryHTML);
    console.log(`✓ Gallery built: dist/index.html (${shaders.length} shaders)`);
    break;
  }

  case 'render': {
    const shaderName = args[1];
    const cwd = process.cwd();

    if (!shaderName) {
      console.error('Error: Specify which shader to render');
      console.error('  npx shader render <shader-name> [options]');
      console.error('');
      console.error('Options:');
      console.error('  --width <n>      Output width (default: 1920)');
      console.error('  --height <n>     Output height (default: 1080)');
      console.error('  --fps <n>        Frames per second (default: 60)');
      console.error('  --duration <n>   Duration in seconds (default: 10)');
      console.error('  --format <type>  frames or video (default: video)');
      process.exit(1);
    }

    const shaderPath = path.join(cwd, 'shaders', shaderName);
    if (!fs.existsSync(shaderPath)) {
      console.error(`Error: Shader "${shaderName}" not found`);
      process.exit(1);
    }

    // Parse options
    const renderOpts = {
      width: 1920,
      height: 1080,
      fps: 60,
      duration: 10,
      format: 'video',
    };

    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      const next = args[i + 1];
      if (arg === '--width' && next) { renderOpts.width = parseInt(next); i++; }
      else if (arg === '--height' && next) { renderOpts.height = parseInt(next); i++; }
      else if (arg === '--fps' && next) { renderOpts.fps = parseInt(next); i++; }
      else if (arg === '--duration' && next) { renderOpts.duration = parseFloat(next); i++; }
      else if (arg === '--format' && next) { renderOpts.format = next; i++; }
    }

    console.log(`Rendering "${shaderName}" at ${renderOpts.width}x${renderOpts.height}, ${renderOpts.fps}fps, ${renderOpts.duration}s, format: ${renderOpts.format}...`);
    console.log('Opening browser for headless render...');

    // Set render options as env vars and run dev server
    const renderEnv = {
      ...process.env,
      SHADER_NAME: shaderName,
      SHADER_RENDER: JSON.stringify(renderOpts),
    };

    const viteBin = findViteBin(cwd);
    if (!viteBin) {
      console.error('Error: vite not found. Run "npm install" first');
      process.exit(1);
    }

    // Start vite dev server, then open browser with puppeteer
    const viteChild = spawn(viteBin, [], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: renderEnv,
    });

    let serverUrl = '';

    // Timeout if Vite never prints the server URL
    const startupTimeout = setTimeout(() => {
      if (!serverUrl) {
        console.error('Error: Timed out waiting for Vite dev server to start');
        viteChild.kill();
        process.exit(1);
      }
    }, 30000);

    viteChild.stdout.on('data', async (data) => {
      const text = data.toString();
      const match = text.match(/Local:\s+(https?:\/\/[^\s]+)/);
      if (match && !serverUrl) {
        serverUrl = match[1];
        clearTimeout(startupTimeout);
        console.log(`Dev server at ${serverUrl}`);

        try {
          let puppeteer;
          try {
            puppeteer = await import('puppeteer-core');
          } catch {
            console.error('Error: puppeteer-core is required for the render command.');
            console.error('Install it with: npm install puppeteer-core');
            viteChild.kill();
            process.exit(1);
          }
          // Try common Chrome paths
          const chromePaths = process.platform === 'darwin'
            ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
            : process.platform === 'win32'
              ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe']
              : ['/usr/bin/google-chrome', '/usr/bin/chromium-browser'];

          let execPath = '';
          for (const p of chromePaths) {
            if (fs.existsSync(p)) { execPath = p; break; }
          }

          if (!execPath) {
            console.error('Error: Chrome not found. Install Google Chrome for headless rendering.');
            viteChild.kill();
            process.exit(1);
          }

          const browser = await puppeteer.default.launch({
            headless: true,
            executablePath: execPath,
            args: ['--no-sandbox', `--window-size=${renderOpts.width},${renderOpts.height}`],
          });

          const page = await browser.newPage();
          await page.setViewport({ width: renderOpts.width, height: renderOpts.height });

          // Navigate to shader with render params
          const renderUrl = `${serverUrl}?render=${encodeURIComponent(JSON.stringify(renderOpts))}`;
          await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 30000 });

          // Wait for render to complete (page sets window.__renderComplete)
          await page.waitForFunction('window.__renderComplete === true', { timeout: renderOpts.duration * 2000 + 60000 });

          console.log('Render complete!');
          await browser.close();
        } catch (e) {
          console.error('Render error:', e.message);
          viteChild.kill();
          process.exit(1);
        }
        viteChild.kill();
        process.exit(0);
      }
    });

    viteChild.stderr.on('data', (data) => {
      // Suppress normal vite output, show errors
      const text = data.toString();
      if (text.includes('error') || text.includes('Error')) {
        process.stderr.write(data);
      }
    });

    viteChild.on('close', (code) => {
      if (code !== 0 && !serverUrl) {
        console.error('Dev server failed to start');
        process.exit(code);
      }
    });
    break;
  }

  case 'build-all': {
    const cwd = process.cwd();
    const shaders = getShaderList(cwd);

    if (shaders === null) {
      console.error('Error: shaders/ directory not found');
      process.exit(1);
    }

    if (shaders.length === 0) {
      console.log('No shaders found to build.');
      process.exit(0);
    }

    console.log(`Building ${shaders.length} shader(s)...`);

    (async () => {
      let failed = 0;
      for (const name of shaders) {
        console.log(`\n--- Building "${name}" ---`);
        try {
          await buildShader(name, cwd);
          console.log(`✓ ${name}`);
        } catch (err) {
          console.error(`✗ ${name}: ${err.message}`);
          failed++;
        }
      }

      // Copy runtime loader to dist/ if it exists in the package
      const runtimeSrc = path.join(packageRoot, 'dist-runtime', 'shader-sandbox.js');
      if (fs.existsSync(runtimeSrc)) {
        const distDir = path.join(cwd, 'dist');
        fs.mkdirSync(distDir, { recursive: true });
        fs.copyFileSync(runtimeSrc, path.join(distDir, 'shader-sandbox.js'));
        console.log('\n✓ Copied shader-sandbox.js runtime loader to dist/');
      }

      console.log(`\nDone. ${shaders.length - failed}/${shaders.length} built successfully.`);
      if (failed > 0) process.exit(1);
    })();

    break;
  }

  case 'build-runtime': {
    const cwd = process.cwd();

    // Check for the pre-built runtime in the package
    const runtimeSrc = path.join(packageRoot, 'dist-runtime', 'shader-sandbox.js');
    if (fs.existsSync(runtimeSrc)) {
      // Just copy it
      const distDir = path.join(cwd, 'dist');
      fs.mkdirSync(distDir, { recursive: true });
      fs.copyFileSync(runtimeSrc, path.join(distDir, 'shader-sandbox.js'));
      console.log('✓ Copied shader-sandbox.js to dist/');
      console.log('');
      console.log('Usage:');
      console.log('  <script type="module" src="/js/shader-sandbox.js"><\/script>');
      console.log('  <shader-sandbox src="/shaders/my-shader/"><\/shader-sandbox>');
    } else {
      console.error('Error: Runtime bundle not found.');
      console.error('The runtime loader (shader-sandbox.js) is not yet built.');
      console.error('Run "npm run build:runtime" from the package root first.');
      process.exit(1);
    }
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
