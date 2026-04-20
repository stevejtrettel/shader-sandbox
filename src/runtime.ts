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
 *   <shader-sandbox>void mainImage(...) { ... }</shader-sandbox>
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
  const scriptUrl = new URL('script.js', baseUrl).href;

  // Check if script.js exists before attempting import
  try {
    const head = await fetch(scriptUrl, { method: 'HEAD' });
    if (!head.ok) return null; // No script for this demo — that's fine
  } catch {
    return null; // Network error or CORS — no script available
  }

  // Script exists — import it, and surface real errors
  try {
    const mod = await import(/* @vite-ignore */ scriptUrl);
    const hooks: DemoScriptHooks = {};
    if (typeof mod.setup === 'function') hooks.setup = mod.setup;
    if (typeof mod.onFrame === 'function') hooks.onFrame = mod.onFrame;
    if (typeof mod.dispose === 'function') hooks.dispose = mod.dispose;
    if (typeof mod.onUniformChange === 'function') hooks.onUniformChange = mod.onUniformChange;
    return (hooks.setup || hooks.onFrame || hooks.dispose || hooks.onUniformChange) ? hooks : null;
  } catch (e) {
    console.error(`[shader-sandbox] Failed to load script: ${scriptUrl}`, e);
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
  // Normalize root-relative paths to absolute URLs
  if (!/^https?:\/\//.test(url)) {
    url = new URL(url, document.baseURI).href;
  }

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
// <shader-sandbox> Custom Element
// =============================================================================

const RUNTIME_CSS = `
.ss-loading {
  position: absolute;
  inset: 0;
  background: #111;
  border-radius: inherit;
  overflow: hidden;
}
.ss-loading__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.03) 45%,
    rgba(255,255,255,0.06) 50%,
    rgba(255,255,255,0.03) 55%,
    transparent 100%
  );
  animation: ss-shimmer 2s ease-in-out infinite;
}
@keyframes ss-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.ss-error {
  position: absolute;
  inset: 0;
  background: #111;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2em;
}
.ss-error__card {
  display: flex;
  max-width: 480px;
  width: 100%;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
.ss-error__accent {
  width: 4px;
  flex-shrink: 0;
  background: #c44;
}
.ss-error__body {
  padding: 1.25em 1.5em;
  flex: 1;
  min-width: 0;
}
.ss-error__title {
  font: 600 14px/1 system-ui, sans-serif;
  color: #e0e0e0;
  margin-bottom: 0.75em;
}
.ss-error__message {
  font: 12px/1.5 'Monaco','Menlo',monospace;
  color: #ff6b6b;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0 0 1em;
  max-height: 120px;
  overflow-y: auto;
}
.ss-error__retry {
  font: 500 12px/1 system-ui, sans-serif;
  color: #aaa;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  padding: 0.5em 1em;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ss-error__retry:hover {
  background: #3a3a3a;
  color: #ddd;
}
.ss-fade-in {
  animation: ss-fade-in 0.3s ease-in;
}
@keyframes ss-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

function injectStyles(): void {
  if (document.getElementById('shader-sandbox-styles')) return;
  const style = document.createElement('style');
  style.id = 'shader-sandbox-styles';
  style.textContent = RUNTIME_CSS;
  document.head.appendChild(style);
}

function escapeHTML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const RESERVED = new Set([
  'src', 'fullpage', 'lazy', 'static',
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
  private _savedGlsl: string | null = null;

  connectedCallback() {
    const src = this.getAttribute('src');
    const inlineGlsl = !src ? (this.textContent?.trim() || null) : null;

    if (!src && !inlineGlsl) {
      console.error('<shader-sandbox>: provide a "src" attribute or inline GLSL content');
      return;
    }

    // Save and clear inline GLSL so it doesn't render as visible text
    if (inlineGlsl) {
      this._savedGlsl = inlineGlsl;
      this.textContent = '';
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
    injectStyles();
    this._placeholder = document.createElement('div');
    this._placeholder.className = 'ss-loading';
    this._placeholder.innerHTML = '<div class="ss-loading__shimmer"></div>';
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
    injectStyles();
    const msg = err instanceof Error ? err.message : String(err);

    const errorEl = document.createElement('div');
    errorEl.className = 'ss-error';
    errorEl.innerHTML = `
      <div class="ss-error__card">
        <div class="ss-error__accent"></div>
        <div class="ss-error__body">
          <div class="ss-error__title">Shader Error</div>
          <pre class="ss-error__message">${escapeHTML(msg)}</pre>
          <button class="ss-error__retry">Retry</button>
        </div>
      </div>
    `;

    errorEl.querySelector('.ss-error__retry')!.addEventListener('click', () => {
      this._destroyShader();
      const src = this.getAttribute('src');
      const inlineGlsl = !src ? this._savedGlsl : null;
      this._mountShader(src, inlineGlsl);
    });

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
        this._handle = loadFromSource(this, inlineGlsl, options);
        this._clearPlaceholder();
      } else {
        this._handle = await loadFromFolder(this, src!, options);
        this._clearPlaceholder();
      }

      // Fade in the mounted content
      const layoutRoot = this.querySelector('.layout-default, .layout-fullscreen, .layout-split, .layout-tabbed');
      if (layoutRoot) {
        layoutRoot.classList.add('ss-fade-in');
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
