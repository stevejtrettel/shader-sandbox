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
import type { DemoScriptHooks, Channels, ShaderProject, PassName } from './project/types';
import { EditorPanel } from './editor/EditorPanel';
import { joinBrowserPath, pathBaseName, pluckScriptHooks } from './project/loaderUtils';

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
      // Only a 404 means "file absent". Other failures (500, 403, CORS,
      // network down) must surface as errors — otherwise a failed config.json
      // fetch silently degrades a multi-pass project to single-pass mode.
      pending = fetch(url).then(async (res) => {
        if (res.ok) return res.text();
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch '${url}': HTTP ${res.status} ${res.statusText}`);
      });
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

    joinPath: joinBrowserPath,
    baseName: pathBaseName,
  };
}

// =============================================================================
// Script Loading
// =============================================================================

async function loadScript(
  baseUrl: string,
): Promise<{ hooks: DemoScriptHooks | null; source: string | null }> {
  const scriptUrl = new URL('script.js', baseUrl).href;
  const none = { hooks: null, source: null };

  // Check if script.js exists before attempting import
  try {
    const head = await fetch(scriptUrl, { method: 'HEAD' });
    if (!head.ok) return none; // No script for this demo — that's fine
  } catch {
    return none; // Network error or CORS — no script available
  }

  // Script exists — import it, and surface real errors
  try {
    const mod = await import(/* @vite-ignore */ scriptUrl);
    const hooks = pluckScriptHooks(mod);
    // Also retain the raw module text for HTML export
    let source: string | null = null;
    try {
      const res = await fetch(scriptUrl);
      if (res.ok) source = await res.text();
    } catch { /* export just falls back to hook serialization */ }
    return { hooks, source };
  } catch (e) {
    console.error(`[shader-sandbox] Failed to load script: ${scriptUrl}`, e);
    return none;
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
  const { hooks: script, source: scriptSource } = await loadScript(baseUrl);

  const project = await loadProjectFromFiles(loader, '.', {
    script,
    scriptSource,
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

/**
 * Mount a built module (dist/<name>/main.js — or any module honoring the
 * contract: export mount(el, options?) → { destroy() } | Promise thereof).
 */
export async function loadFromModule(
  el: HTMLElement,
  url: string,
  options?: MountPresentationOptions,
): Promise<Partial<MountHandle> & { destroy(): void }> {
  const mod = await import(/* @vite-ignore */ url);
  if (typeof mod.mount !== 'function') {
    throw new Error(`Module '${url}' does not export mount()`);
  }
  const handle = await mod.mount(el, options);
  if (!handle || typeof handle.destroy !== 'function') {
    throw new Error(`Module '${url}': mount() must return { destroy() }`);
  }
  return handle;
}

/** What a mounted source resolves to. `project` is null for built modules. */
interface ResolvedMount {
  handle: Partial<MountHandle> & { destroy(): void };
  project: ShaderProject | null;
}

/**
 * The ONE source resolver (DESIGN.md Principle 2). Accepts:
 *   inline GLSL / bare .glsl file / project folder / built .js module
 */
async function mountFromSource(
  el: HTMLElement,
  src: string | null,
  inlineGlsl: string | null,
  options: MountPresentationOptions,
): Promise<ResolvedMount> {
  if (!src && inlineGlsl) {
    const project = projectFromGlsl(inlineGlsl, 'inline');
    return { handle: coreMount(el, { project, ...options }), project };
  }
  if (!src) throw new Error('No source provided');

  if (/\.(js|mjs)([?#].*)?$/i.test(src)) {
    const url = /^https?:\/\//.test(src) ? src : new URL(src, document.baseURI).href;
    return { handle: await loadFromModule(el, url, options), project: null };
  }

  // Folder or bare .glsl — loadFromFolder handles both, but we also need
  // the loaded project for editors, so inline the folder path here.
  let url = src;
  if (!/^https?:\/\//.test(url)) {
    url = new URL(url, document.baseURI).href;
  }

  if (/\.(glsl|frag)$/i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch shader: ${url}`);
    const glsl = await res.text();
    const name = url.split('/').pop()?.replace(/\.(glsl|frag)$/i, '') ?? 'shader';
    const project = projectFromGlsl(glsl, name);
    return { handle: coreMount(el, { project, ...options }), project };
  }

  const baseUrl = url.endsWith('/') ? url : url + '/';
  const loader = createFetchFileLoader(baseUrl);
  const { hooks: script, source: scriptSource } = await loadScript(baseUrl);
  const project = await loadProjectFromFiles(loader, '.', {
    script,
    scriptSource,
    textureUrlResolver: async (path: string) => new URL(path, baseUrl).href,
  });
  return { handle: coreMount(el, { project, ...options }), project };
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
.ss-editor-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 120px;
  padding: 1.5em;
  font: 13px/1.5 system-ui, sans-serif;
  color: #888;
  background: rgba(128,128,128,0.06);
  border: 1px dashed rgba(128,128,128,0.35);
  border-radius: 8px;
  text-align: center;
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

// =============================================================================
// Canvas registry — lets <shader-editor for="id"> find its canvas across
// arbitrary DOM distance, including late/lazy mounting and re-parenting.
// =============================================================================

const canvasRegistry = new Map<string, ShaderCanvas>();

function registerCanvas(el: ShaderCanvas): void {
  if (el.id) canvasRegistry.set(el.id, el);
  document.dispatchEvent(new CustomEvent('shader-canvas:connected', { detail: { id: el.id, el } }));
}

function unregisterCanvas(el: ShaderCanvas): void {
  if (el.id && canvasRegistry.get(el.id) === el) canvasRegistry.delete(el.id);
}

/** Resolve an editor's target: explicit id, or the page's sole canvas. */
function findCanvas(forId: string | null): ShaderCanvas | null {
  if (forId) return canvasRegistry.get(forId) ?? null;
  const all = [...canvasRegistry.values()];
  return all.length === 1 ? all[0] : null;
}

// =============================================================================
// Shared host element base (lazy mount, placeholders, teardown guards)
// =============================================================================

abstract class ShaderHostElement extends HTMLElement {
  protected _handle: (Partial<MountHandle> & { destroy(): void }) | null = null;
  protected _project: ShaderProject | null = null;
  protected _observer: IntersectionObserver | null = null;
  protected _mounted = false;
  protected _loading = false;
  protected _visible = false;
  protected _placeholder: HTMLElement | null = null;
  protected _savedGlsl: string | null = null;
  /** Bumped on disconnect so an in-flight mount knows to abandon itself. */
  protected _generation = 0;
  protected _src: string | null = null;
  protected _inlineGlsl: string | null = null;

  /** Chrome the element enforces regardless of attributes. */
  protected abstract chromeOverrides(): MountPresentationOptions;
  protected abstract elementName(): string;

  connectedCallback(): void {
    this._src = this.getAttribute('src');
    // textContent is cleared on first connect — fall back to the saved copy
    // so the element survives being re-parented (frameworks move nodes)
    this._inlineGlsl = !this._src ? (this.textContent?.trim() || this._savedGlsl) : null;

    if (!this._src && !this._inlineGlsl) {
      console.error(`<${this.elementName()}>: provide a "src" attribute or inline GLSL content`);
      return;
    }

    if (this._inlineGlsl) {
      this._savedGlsl = this._inlineGlsl;
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

    this.onConnected();

    // Lazy loading (default: true)
    const lazy = this.getAttribute('lazy') !== 'false';

    if (lazy) {
      this._observer = new IntersectionObserver(
        (entries) => {
          // Entries batch during fast scrolls — only the LAST one reflects
          // the element's current visibility
          const entry = entries[entries.length - 1];
          this._visible = entry.isIntersecting;
          if (entry.isIntersecting) {
            if (!this._mounted && !this._loading) {
              this._mountShader();
            } else if (this._handle && !this.hasAttribute('static')) {
              // static figures must stay on their rendered frame
              this._handle.resume?.();
            }
          } else if (this._handle) {
            this._handle.pause?.();
          }
        },
        { rootMargin: '200px' },
      );
      this._observer.observe(this);
    } else {
      this._visible = true;
      this._mountShader();
    }
  }

  disconnectedCallback(): void {
    this._generation++;
    this._observer?.disconnect();
    this._observer = null;
    this._destroyShader();
    this.onDisconnected();
  }

  /** Subclass hooks around connect/disconnect (registry, etc.). */
  protected onConnected(): void { /* default: nothing */ }
  protected onDisconnected(): void { /* default: nothing */ }
  protected onLoaded(): void { /* default: nothing */ }

  /**
   * Force load WITHOUT forcing play: mounts immediately (fetch + compile)
   * but stays paused until the element scrolls into view. Used by
   * <shader-editor>, which needs sources while its canvas may be off-screen.
   */
  async ensureLoaded(): Promise<void> {
    if (this._mounted || this._loading) return this._loadedPromise ?? undefined;
    await this._mountShader();
  }

  protected _loadedPromise: Promise<void> | null = null;

  protected _buildOptions(): MountPresentationOptions {
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
    return { ...(opts as MountPresentationOptions), ...this.chromeOverrides() };
  }

  protected _showLoading(): void {
    injectStyles();
    this._placeholder = document.createElement('div');
    this._placeholder.className = 'ss-loading';
    this._placeholder.innerHTML = '<div class="ss-loading__shimmer"></div>';
    this.appendChild(this._placeholder);
  }

  protected _clearPlaceholder(): void {
    if (this._placeholder) {
      this._placeholder.remove();
      this._placeholder = null;
    }
  }

  protected _showError(err: unknown): void {
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
      this._mountShader();
    });

    this._placeholder = errorEl;
    this.appendChild(errorEl);
  }

  protected _mountShader(): Promise<void> {
    if (this._mounted || this._loading) return this._loadedPromise ?? Promise.resolve();
    this._loading = true;
    const generation = this._generation;
    this._showLoading();

    const doMount = (async () => {
      try {
        const options = this._buildOptions();
        const resolved = await mountFromSource(this, this._src, this._inlineGlsl, options);

        // Removed from the DOM while the fetch/mount was in flight? Destroy
        // immediately — otherwise the WebGL context and rAF loop leak in a
        // detached element.
        if (generation !== this._generation || !this.isConnected) {
          resolved.handle.destroy();
          this._clearPlaceholder();
          return;
        }

        this._handle = resolved.handle;
        this._project = resolved.project;
        this._clearPlaceholder();

        // Fade in the mounted content
        const layoutRoot = this.querySelector('.layout-default, .layout-fullscreen, .layout-split, .layout-tabbed');
        if (layoutRoot) {
          layoutRoot.classList.add('ss-fade-in');
        }

        this._mounted = true;

        // Loaded while off-screen (editor-forced): render is ready but
        // playback waits for visibility.
        if (!this._visible && this._observer) {
          this._handle.pause?.();
        }

        this.onLoaded();
      } catch (err) {
        console.error(`<${this.elementName()}>: failed to load shader`, err);
        if (generation === this._generation && this.isConnected) {
          this._showError(err);
        }
      } finally {
        this._loading = false;
        this._loadedPromise = null;
      }
    })();

    this._loadedPromise = doMount;
    return doMount;
  }

  protected _destroyShader(): void {
    this._clearPlaceholder();
    if (!this._mounted) return;
    this._handle?.destroy();
    this._handle = null;
    this._project = null;
    this._mounted = false;
  }
}

// =============================================================================
// <shader-canvas> — the chromeless picture
// =============================================================================

class ShaderCanvas extends ShaderHostElement {
  protected elementName(): string { return 'shader-canvas'; }

  protected chromeOverrides(): MountPresentationOptions {
    // Chromeless: no playback bar, no stats, no pane decoration. The
    // uniforms UI stays attribute/config-driven (sliders are content).
    return { playback: false, stats: false, controls: false, styled: false, layout: 'fullscreen' };
  }

  protected onConnected(): void {
    registerCanvas(this);
  }

  protected onDisconnected(): void {
    unregisterCanvas(this);
  }

  protected onLoaded(): void {
    document.dispatchEvent(new CustomEvent('shader-canvas:loaded', { detail: { id: this.id, el: this } }));
  }

  /** The loaded project, for editors. Null until loaded or for .js modules. */
  get project(): ShaderProject | null {
    return this._project;
  }

  /** Live-recompile a pass. No-op error before load / for built modules. */
  recompile(passName: 'common' | PassName, source: string): { success: boolean; error?: string } {
    if (!this._handle?.recompile) {
      return { success: false, error: 'Shader not loaded (or built module — not editable)' };
    }
    return this._handle.recompile(passName, source);
  }
}

// =============================================================================
// <shader-editor> — live code editing bound to a <shader-canvas>
// =============================================================================

class ShaderEditor extends HTMLElement {
  private _panel: EditorPanel | null = null;
  private _onCanvasEvent: ((e: Event) => void) | null = null;
  private _generation = 0;

  connectedCallback(): void {
    if (!this.style.display || this.style.display === 'inline') {
      this.style.display = 'flex';
    }
    this.style.flexDirection = 'column';
    if (!this.style.minHeight) this.style.minHeight = '300px';
    this.setAttribute('data-theme', this.getAttribute('theme') ?? 'auto');

    this._tryBind();

    // Late binding: canvases may connect or finish loading after us
    this._onCanvasEvent = () => { if (!this._panel) this._tryBind(); };
    document.addEventListener('shader-canvas:connected', this._onCanvasEvent);
    document.addEventListener('shader-canvas:loaded', this._onCanvasEvent);
  }

  disconnectedCallback(): void {
    this._generation++;
    if (this._onCanvasEvent) {
      document.removeEventListener('shader-canvas:connected', this._onCanvasEvent);
      document.removeEventListener('shader-canvas:loaded', this._onCanvasEvent);
      this._onCanvasEvent = null;
    }
    this._panel?.dispose();
    this._panel = null;
    this.innerHTML = '';
  }

  private async _tryBind(): Promise<void> {
    const forId = this.getAttribute('for');
    const canvas = findCanvas(forId);

    if (!canvas) {
      this._showPlaceholder(forId
        ? `No <shader-canvas id="${forId}"> found on this page.`
        : 'No <shader-canvas> to bind to. Add one, or set for="canvas-id".');
      if (forId) console.warn(`<shader-editor for="${forId}">: no matching <shader-canvas> (yet)`);
      return;
    }

    const generation = this._generation;

    // Editor forces LOAD, not PLAY: the canvas fetches + compiles now, but
    // keeps waiting for visibility before animating (DESIGN.md).
    await canvas.ensureLoaded();
    if (generation !== this._generation || !this.isConnected) return;

    const project = canvas.project;
    if (!project) {
      this._showPlaceholder('This shader is a built module — source editing is not available.');
      return;
    }

    if (this._panel) return; // raced by a second event

    this.innerHTML = '';
    const passAttr = this.getAttribute('pass');
    const pass = passAttr
      ? (passAttr === 'common' ? 'common' : (passAttr.charAt(0).toUpperCase() + passAttr.slice(1)) as PassName)
      : undefined;

    this._panel = new EditorPanel(this, project, pass !== undefined ? { pass } : {});
    this._panel.setRecompileHandler((passName, source) => canvas.recompile(passName, source));
  }

  private _showPlaceholder(message: string): void {
    injectStyles();
    this.innerHTML = `<div class="ss-editor-placeholder">${escapeHTML(message)}</div>`;
  }
}

// =============================================================================
// <shader-sandbox> — the one-tag preset (default / fullscreen / split / tabbed)
// =============================================================================

class ShaderSandbox extends ShaderHostElement {
  protected elementName(): string { return 'shader-sandbox'; }

  protected chromeOverrides(): MountPresentationOptions {
    return {}; // full preset chrome — attributes and config decide
  }
}

customElements.define('shader-canvas', ShaderCanvas);
customElements.define('shader-editor', ShaderEditor);
customElements.define('shader-sandbox', ShaderSandbox);
