# Runtime Loader — Skip the Build Step

## Idea

Instead of `shader build` → `main.js` → `<live-app src="main.js">`, allow pointing
`<live-app>` directly at a folder of raw `.glsl` files:

```html
<live-app src="/shaders/mandelbrot/"></live-app>
```

A single generic script fetches `config.json`, `image.glsl`, `common.glsl`, textures,
etc. via plain HTTP and mounts the shader — no Vite, no compile step.

## How It Would Work

1. **Generic entry module** (e.g. `shader-sandbox.js` or bundled into the package):
   - Exports `mount(el, options)` where `options.src` is a folder URL
   - Implements a fetch-based `FileLoader` (same interface as the existing Vite loader)
   - Calls `loadProjectCore` → `mount()` with the loaded project

2. **Fetch-based FileLoader**:
   - `exists(path)` → `HEAD` request
   - `readText(path)` → `fetch().then(r => r.text())`
   - `resolveImageUrl(path)` → return the URL directly (already on a server)
   - `listGlslFiles()` → fetch a manifest or try known filenames (image.glsl, bufferA-D.glsl, common.glsl)

3. **`<live-app>` integration**:
   - If `src` ends with `/` or has no `.js` extension → use runtime loader
   - If `src` ends with `.js` → use current dynamic import path

## File Discovery Problem

The main challenge: a static file server can't list directory contents. Options:
- **Try known filenames**: fetch `config.json`, `image.glsl`, `common.glsl`, `bufferA.glsl`...`bufferD.glsl` — 404s are fine, just skip
- **Manifest file**: require a `manifest.json` listing all files (could be auto-generated)
- **Config-driven**: `config.json` already declares buffers/textures, so we know which files to expect

The config-driven approach is cleanest — `config.json` tells us what exists, we fetch only those files. For the simplest case (single `image.glsl`, no config), we just fetch `image.glsl` and use defaults.

## Tradeoffs vs Build

| | Build (`shader build`) | Runtime loader |
|---|---|---|
| Setup | Run build per shader | Drop files on server |
| HTTP requests | 1 bundled JS file | N fetches (config + glsl + textures) |
| First paint | Faster (pre-bundled) | Slightly slower (sequential fetches) |
| Dependencies | Needs Vite + Node | None — static file server only |
| CSS/JS bundling | All-in-one | Need to include `shader-sandbox.js` separately |
| Best for | Production sites | Quarto, prototyping, static sites |

## Existing Code to Reuse

- `src/project/loadProjectCore.ts` — all project assembly logic
- `src/project/FileLoader.ts` — abstract interface (just need a fetch implementation)
- `src/project/configHelpers.ts` — config parsing/validation
- `src/mount.ts` — the core `mount()` function

## Open Questions

- Should the runtime loader be a separate entry point (`shader-sandbox-runtime.js`) or bundled into the main package?
- How to handle `script.js`? It's a JS module — could dynamic-import it from the server
- Caching strategy? Service worker? Or just rely on HTTP caching headers
- Should `<live-app>` auto-detect folder vs module, or use a separate attribute?
