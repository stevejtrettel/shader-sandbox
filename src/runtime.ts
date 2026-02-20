/**
 * Runtime Loader — fetch-based shader loading, no build step.
 *
 * A standalone entry point that loads shader projects directly from a folder
 * of raw files over HTTP. No Vite, no Node, no compile step — just a static
 * file server.
 *
 * Exports:
 *   - loadFromFolder(el, url, options)  — load from a shader folder or .glsl URL
 *   - loadFromSource(el, glsl, options) — load from inline GLSL source
 *
 * Also registers the <shader-sandbox> custom element:
 *   <shader-sandbox src="/shaders/mandelbrot/" controls="false"></shader-sandbox>
 *   <shader-sandbox src="/shaders/heatmap.glsl" static></shader-sandbox>
 *   <shader-sandbox size="square">void mainImage(...) { ... }</shader-sandbox>
 */

import { mount as coreMount, MountHandle, MountPresentationOptions } from './mount';
import { buildShaderProject, loadProjectFromFiles } from './project/loadProjectCore';
import type { FileLoader } from './project/FileLoader';
import type { DemoScriptHooks, Channels } from './project/types';

// =============================================================================
// Fetch-based FileLoader
// =============================================================================

function createFetchFileLoader(baseUrl: string): FileLoader {
  const cache = new Map<string, Promise<string | null>>();

  function resolveUrl(path: string): string {
    const clean = path.replace(/^\.\//, '');
    return new URL(clean, baseUrl).href;
  }

  function fetchCached(path: string): Promise<string | null> {
    const url = resolveUrl(path);
    let pending = cache.get(url);
    if (!pending) {
      pending = fetch(url).then(
        (res) => (res.ok ? res.text() : null),
        () => null,
      );
      cache.set(url, pending);
    }
    return pending;
  }

  return {
    async exists(path: string): Promise<boolean> {
      return (await fetchCached(path)) !== null;
    },

    async readText(path: string): Promise<string> {
      const content = await fetchCached(path);
      if (content === null) {
        throw new Error(`File not found: ${resolveUrl(path)}`);
      }
      return content;
    },

    async resolveImageUrl(path: string): Promise<string> {
      return resolveUrl(path);
    },

    async listGlslFiles(): Promise<string[]> {
      return [];
    },

    async hasFiles(): Promise<boolean> {
      return false;
    },

    joinPath(...parts: string[]): string {
      return parts
        .map((p, i) => (i === 0 ? p : p.replace(/^\/+/, '')))
        .join('/')
        .replace(/\/+/g, '/');
    },

    baseName(path: string): string {
      return path.split('/').pop() || path;
    },
  };
}

// =============================================================================
// Script Loading
// =============================================================================

async function loadScript(baseUrl: string): Promise<DemoScriptHooks | null> {
  try {
    const scriptUrl = new URL('script.js', baseUrl).href;
    const mod = await import(/* @vite-ignore */ scriptUrl);
    const hooks: DemoScriptHooks = {};
    if (typeof mod.setup === 'function') hooks.setup = mod.setup;
    if (typeof mod.onFrame === 'function') hooks.onFrame = mod.onFrame;
    return (hooks.setup || hooks.onFrame) ? hooks : null;
  } catch {
    return null;
  }
}

// =============================================================================
// Minimal project from raw GLSL source
// =============================================================================

const NO_CHANNELS: Channels = [
  { kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' },
];

function projectFromGlsl(glsl: string, name: string) {
  return buildShaderProject({
    mode: 'standard',
    root: name,
    commonSource: null,
    passes: {
      Image: { name: 'Image', glslSource: glsl, channels: NO_CHANNELS },
    },
  });
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Load a shader project from a URL and mount it into a DOM element.
 *
 * Supports two URL shapes:
 *   - Folder URL ("/shaders/mandelbrot/")     — full project with config.json
 *   - Single GLSL file ("/shaders/heatmap.glsl") — single-pass, no config needed
 */
export async function loadFromFolder(
  el: HTMLElement,
  url: string,
  options?: MountPresentationOptions,
): Promise<MountHandle> {
  // Single-file mode: URL points directly to a .glsl or .frag file
  if (/\.(glsl|frag)$/i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch shader: ${url}`);
    const glsl = await res.text();
    const name = url.split('/').pop()?.replace(/\.(glsl|frag)$/i, '') ?? 'shader';
    const project = projectFromGlsl(glsl, name);
    return coreMount(el, { project, ...options });
  }

  // Folder mode: load full project from directory
  const baseUrl = url.endsWith('/') ? url : url + '/';
  const loader = createFetchFileLoader(baseUrl);
  const script = await loadScript(baseUrl);

  const project = await loadProjectFromFiles(loader, '.', {
    script,
    textureUrlResolver: async (path: string) => new URL(path, baseUrl).href,
  });

  return coreMount(el, { project, ...options });
}

/**
 * Mount a shader from inline GLSL source (no fetch).
 */
export function loadFromSource(
  el: HTMLElement,
  glsl: string,
  options?: MountPresentationOptions,
): MountHandle {
  const project = projectFromGlsl(glsl, 'inline');
  return coreMount(el, { project, ...options });
}

// Re-export for consumers
export type { MountHandle, MountPresentationOptions };

// =============================================================================
// Size Presets
// =============================================================================

const SIZE_PRESETS: Record<string, Record<string, string>> = {
  wide:         { width: '100%', aspectRatio: '16/9' },
  square:       { width: '100%', aspectRatio: '1/1', maxWidth: '600px', margin: '0 auto' },
  'square-sm':  { width: '100%', aspectRatio: '1/1', maxWidth: '400px', margin: '0 auto' },
  banner:       { width: '100%', aspectRatio: '3/1' },
  tall:         { width: '100%', aspectRatio: '3/4', maxWidth: '500px', margin: '0 auto' },
};

// =============================================================================
// <shader-sandbox> Custom Element
// =============================================================================

const RESERVED = new Set([
  'src', 'fullpage', 'lazy', 'size', 'static',
  'style', 'class', 'id', 'slot', 'is',
]);

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function coerce(v: string): string | number | boolean {
  if (v === 'true' || v === '') return true;   // bare attribute (e.g. <el static>) → true
  if (v === 'false') return false;
  const n = Number(v);
  if (!isNaN(n)) return n;
  return v;
}

class ShaderSandbox extends HTMLElement {
  private _handle: MountHandle | null = null;
  private _observer: IntersectionObserver | null = null;
  private _mounted: boolean = false;
  private _loading: boolean = false;
  private _placeholder: HTMLElement | null = null;

  connectedCallback() {
    const src = this.getAttribute('src');
    const inlineGlsl = !src ? (this.textContent?.trim() || null) : null;

    if (!src && !inlineGlsl) {
      console.error('<shader-sandbox>: provide a "src" attribute or inline GLSL content');
      return;
    }

    // Save and clear inline GLSL so it doesn't render as visible text
    if (inlineGlsl) {
      this.textContent = '';
    }

    // Apply size preset defaults (explicit style attributes override these)
    const sizePreset = this.getAttribute('size');
    if (sizePreset && SIZE_PRESETS[sizePreset]) {
      for (const [prop, val] of Object.entries(SIZE_PRESETS[sizePreset])) {
        const cssProp = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        if (!this.style.getPropertyValue(cssProp)) {
          (this.style as any)[prop] = val;
        }
      }
    }

    // Fullpage mode
    if (this.hasAttribute('fullpage')) {
      Object.assign(this.style, {
        display: 'block',
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: '0',
        left: '0',
      });
    } else if (!this.style.display || this.style.display === 'inline') {
      this.style.display = 'block';
    }

    // Position context for loading/error overlays
    if (!this.style.position || this.style.position === 'static') {
      this.style.position = 'relative';
    }

    // Lazy loading (default: true)
    const lazy = this.getAttribute('lazy') !== 'false';

    if (lazy) {
      this._observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            if (!this._mounted && !this._loading) {
              this._mountShader(src, inlineGlsl);
            } else if (this._handle) {
              this._handle.resume();
            }
          } else if (this._handle) {
            this._handle.pause();
          }
        },
        { rootMargin: '200px' },
      );
      this._observer.observe(this);
    } else {
      this._mountShader(src, inlineGlsl);
    }
  }

  disconnectedCallback() {
    this._observer?.disconnect();
    this._observer = null;
    this._destroyShader();
  }

  private _buildOptions(): MountPresentationOptions {
    const opts: Record<string, unknown> = {};
    for (const attr of this.attributes) {
      if (RESERVED.has(attr.name)) continue;
      opts[kebabToCamel(attr.name)] = coerce(attr.value);
    }
    // static → render one frame, no controls
    if (this.hasAttribute('static')) {
      opts.startPaused = true;
      opts.controls = false;
    }
    return opts as MountPresentationOptions;
  }

  private _showLoading(): void {
    this._placeholder = document.createElement('div');
    Object.assign(this._placeholder.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#888',
      fontSize: '14px',
      fontFamily: 'system-ui, sans-serif',
    });
    this._placeholder.textContent = 'Loading shader\u2026';
    this.appendChild(this._placeholder);
  }

  private _clearPlaceholder(): void {
    if (this._placeholder) {
      this._placeholder.remove();
      this._placeholder = null;
    }
  }

  private _showError(err: unknown): void {
    this._clearPlaceholder();
    const msg = err instanceof Error ? err.message : String(err);
    const errorEl = document.createElement('div');
    Object.assign(errorEl.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#c44',
      fontSize: '13px',
      fontFamily: 'system-ui, sans-serif',
      padding: '1em',
      textAlign: 'center',
      background: 'rgba(0,0,0,0.05)',
    });
    errorEl.textContent = `Shader error: ${msg}`;
    this._placeholder = errorEl;
    this.appendChild(errorEl);
  }

  private async _mountShader(src: string | null, inlineGlsl: string | null): Promise<void> {
    if (this._mounted || this._loading) return;
    this._loading = true;
    this._showLoading();

    try {
      const options = this._buildOptions();

      if (inlineGlsl) {
        this._clearPlaceholder();
        this._handle = loadFromSource(this, inlineGlsl, options);
      } else {
        this._handle = await loadFromFolder(this, src!, options);
        this._clearPlaceholder();
      }

      this._mounted = true;
    } catch (err) {
      console.error('<shader-sandbox>: failed to load shader', err);
      this._showError(err);
    } finally {
      this._loading = false;
    }
  }

  private _destroyShader(): void {
    this._clearPlaceholder();
    if (!this._mounted) return;
    this._handle?.destroy();
    this._handle = null;
    this._mounted = false;
  }
}

customElements.define('shader-sandbox', ShaderSandbox);
