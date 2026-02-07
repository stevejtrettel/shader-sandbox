# `<live-app>` Custom Element System

## Goal

Replace the current pattern of hardcoding mount targets (e.g. `<div id="app">`) with a browser-native Custom Element (`<live-app>`) that can:

- Mount a single visualization full-page
- Mount multiple independent visualizations on the same page
- Work with any rendering approach: raw WebGL/GLSL shaders, Three.js, 2D canvas, SVG, or plain DOM
- Produce compiled JS files (ES modules, no runtime dependencies) that will still run in 10+ years
- Integrate cleanly with an Astro site

## Architecture

Two layers:

1. **`mount(el, options)` function** — the real core of each visualization. Pure JS/TS, takes a DOM element, sets everything up, returns a cleanup handle. This is the portable, eternal part.

2. **`<live-app>` Custom Element** — a thin (~20 line) wrapper that calls `mount()` when the browser connects the element to the page. This is the ergonomic part.

Each visualization project produces a single ES module `.js` file as its build output. The Custom Element is defined once in a shared package; individual visualizations just export a `mount` function.

## The Mount Function Contract

Every visualization must export a `mount` function with this signature:

```ts
interface MountOptions {
  [key: string]: any; // each viz defines its own options
}

interface MountHandle {
  destroy(): void;       // cleanup: remove listeners, cancel animation frames, dispose GL resources
  resize?(): void;       // optional: called if the container resizes
  setOptions?(o: Partial<MountOptions>): void; // optional: update options at runtime
}

export function mount(el: HTMLElement, options?: MountOptions): MountHandle;
```

### Rules for `mount`:
- It receives a DOM element and fully owns its contents (can append canvas, divs, whatever)
- It must not assume anything about the element's size at call time — measure it, and ideally observe resizes
- It must return at minimum a `destroy()` method
- It must clean up everything in `destroy`: animation frames, event listeners, GL contexts, etc.
- It must not touch anything outside the provided element

## The `<live-app>` Custom Element

### Attributes

| Attribute    | Required | Description |
|-------------|----------|-------------|
| `src`       | yes      | Path to the ES module JS file that exports `mount` |
| `fullpage`  | no       | Boolean attribute. If present, element is styled to fill viewport |
| (any other) | no       | Passed through to mount as options (all as strings — mount should parse) |

### Implementation sketch

```js
class LiveApp extends HTMLElement {
  async connectedCallback() {
    // Dynamically import the module specified by src
    const src = this.getAttribute('src');
    if (!src) {
      console.error('<live-app> requires a "src" attribute');
      return;
    }

    try {
      const module = await import(src);
      
      // Gather all non-reserved attributes as options
      const options = {};
      for (const attr of this.attributes) {
        if (attr.name !== 'src' && attr.name !== 'style' && attr.name !== 'class' && attr.name !== 'fullpage') {
          options[attr.name] = attr.value;
        }
      }

      // Handle fullpage mode
      if (this.hasAttribute('fullpage')) {
        this.style.display = 'block';
        this.style.width = '100vw';
        this.style.height = '100vh';
        this.style.position = 'fixed';
        this.style.top = '0';
        this.style.left = '0';
      }

      this._instance = module.mount(this, options);
    } catch (err) {
      console.error(`<live-app> failed to load module "${src}":`, err);
    }
  }

  disconnectedCallback() {
    this._instance?.destroy();
    this._instance = null;
  }
}

customElements.define('live-app', LiveApp);
```

### File: `live-app.js`

This file contains only the Custom Element definition above. It is a standalone ES module with zero dependencies. It should be hosted on the site and included once per page (or once site-wide via a layout).

## Usage Examples

### Full-page shader

```html
<script type="module" src="/js/live-app.js"></script>
<live-app src="/visualizations/hyperbolic-plane.js" fullpage></live-app>
```

### Multiple visualizations on one page (e.g. a blog post)

```html
<script type="module" src="/js/live-app.js"></script>

<p>Here's a hyperbolic tiling:</p>
<live-app src="/visualizations/hyperbolic-tiling.js" style="width:100%;height:400px;display:block;"></live-app>

<p>And here's a Schwarzschild geodesic tracer:</p>
<live-app src="/visualizations/schwarzschild.js" style="width:100%;height:400px;display:block;" mass="1.5"></live-app>
```

### In Astro

In a `.astro` or `.mdx` file:

```astro
---
// no frontmatter needed for the component itself
---
<script type="module" src="/js/live-app.js"></script>

<live-app src="/visualizations/my-shader.js" style="width:100%;height:500px;display:block;"></live-app>
```

Or better: create a thin Astro component that wraps it:

```astro
---
// components/LiveApp.astro
const { src, fullpage = false, ...rest } = Astro.props;
---
<live-app 
  src={src} 
  fullpage={fullpage ? '' : undefined}
  {...rest}
  style={fullpage ? undefined : `width:100%;height:400px;display:block;${rest.style || ''}`}
></live-app>

<script type="module" src="/js/live-app.js"></script>
```

Usage: `<LiveApp src="/visualizations/my-shader.js" />`

## Example Visualization Module

Here's what an individual visualization file looks like (this is the build output):

```js
// hyperbolic-tiling.js — ES module, zero dependencies
export function mount(el, options = {}) {
  const canvas = document.createElement('canvas');
  el.appendChild(canvas);

  const gl = canvas.getContext('webgl2');
  if (!gl) {
    el.textContent = 'WebGL2 not supported';
    return { destroy() {} };
  }

  // ... compile shaders, set up geometry, uniforms, etc.

  // Handle resize
  const ro = new ResizeObserver(() => {
    canvas.width = el.clientWidth * devicePixelRatio;
    canvas.height = el.clientHeight * devicePixelRatio;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    gl.viewport(0, 0, canvas.width, canvas.height);
  });
  ro.observe(el);

  // Animation loop
  let frameId;
  function loop(t) {
    // ... render
    frameId = requestAnimationFrame(loop);
  }
  frameId = requestAnimationFrame(loop);

  // Return cleanup handle
  return {
    destroy() {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    }
  };
}
```

## Build Setup

Each visualization project should compile to a single ES module `.js` file.

### Recommended: esbuild (fast, minimal config)

```bash
esbuild src/main.ts --bundle --format=esm --outfile=dist/my-viz.js
```

### For Three.js projects

Three.js gets bundled into the output file. No CDN dependency, no npm at runtime. The output is a self-contained `.js` file.

```bash
esbuild src/main.ts --bundle --format=esm --outfile=dist/my-viz.js --external:none
```

### For raw GLSL shader projects

Shader source can be inlined as template literals in the JS, or use esbuild's text loader:

```bash
esbuild src/main.ts --bundle --format=esm --loader:.glsl=text --outfile=dist/my-viz.js
```

This lets you write `import vertSrc from './shader.vert.glsl'` and it gets inlined as a string.

## Migration Path from Current Setup

Current pattern (what to move away from):
```js
// old: hardcoded to a specific div
const el = document.getElementById('app');
setupVisualization(el);
```

New pattern:
1. Wrap the existing setup code in a `mount(el, options)` function
2. Add a `destroy()` return value (cancel animation frames, remove listeners)
3. Export `mount` from the module
4. Replace `<div id="app">` with `<live-app src="./that-module.js">` in HTML

This can be done incrementally — one visualization at a time.

## Key Decisions

- **No Shadow DOM**: Skip it. It adds complexity and makes styling harder. The element just uses light DOM (appends children directly).
- **Dynamic import for src**: The Custom Element uses `import(src)` to load the module. This means each viz is lazy-loaded — the page doesn't download visualization code until the element is connected.
- **ResizeObserver inside mount, not the Custom Element**: Each visualization knows best how to handle its own resizing. The Custom Element doesn't try to mediate this.
- **No framework runtime**: The compiled output is vanilla JS. No React, no Svelte, no Lit. Just DOM APIs and WebGL.

## File Structure on the Site

```
/js/
  live-app.js              ← the Custom Element definition (shared, load once)
/visualizations/
  hyperbolic-tiling.js     ← individual viz, ES module
  schwarzschild.js
  geodesic-flow.js
  ...
```

## Checklist for Implementation

- [ ] Create `live-app.js` with the Custom Element definition
- [ ] Set up esbuild (or similar) for bundling visualization modules
- [ ] Migrate one existing visualization as a proof of concept
- [ ] Create the Astro wrapper component (`LiveApp.astro`)
- [ ] Add `live-app.js` to the site's base layout so it's available on every page
- [ ] Incrementally migrate remaining visualizations