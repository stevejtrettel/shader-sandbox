/**
 * Runtime Loader — fetch-based shader loading, no build step.
 *
 * A standalone entry point that loads shader projects directly from a folder
 * of raw files over HTTP. No Vite, no Node, no compile step — just a static
 * file server.
 *
 * Exports:
 *   - mount(el, options)        — <live-app> compatible API
 *   - loadFromFolder(el, url, options) — direct API
 *
 * Also registers the <shader-sandbox> custom element:
 *   <shader-sandbox src="/shaders/mandelbrot/" controls="false"></shader-sandbox>
 */

import { mount as coreMount, MountHandle } from './mount';
import { loadProjectFromFiles } from './project/loadProjectCore';
import type { FileLoader } from './project/FileLoader';
import type { DemoScriptHooks } from './project/types';
import type { LayoutMode } from './layouts/types';
import type { ThemeMode } from './project/types';

// =============================================================================
// Fetch-based FileLoader
// =============================================================================

function createFetchFileLoader(baseUrl: string): FileLoader {
  // Cache promises (not results) to deduplicate concurrent requests
  const cache = new Map<string, Promise<string | null>>();

  function resolveUrl(path: string): string {
    // Strip leading ./ — URL constructor handles the rest
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
      return []; // Cannot list directory contents over HTTP
    },

    async hasFiles(): Promise<boolean> {
      return false; // Cannot check directory contents over HTTP
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
// Single-file FileLoader (for bare .glsl URLs)
// =============================================================================

function createSingleFileLoader(glslContent: string): FileLoader {
  return {
    async exists(path: string): Promise<boolean> {
      const name = path.replace(/^\.\//, '');
      return name === 'image.glsl';
    },
    async readText(path: string): Promise<string> {
      const name = path.replace(/^\.\//, '');
      if (name === 'image.glsl') return glslContent;
      throw new Error(`File not found: ${path}`);
    },
    async resolveImageUrl(path: string): Promise<string> {
      return path;
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
// Helpers
// =============================================================================

/** Resolve a path (absolute or relative) to a full URL using the document base. */
function toAbsoluteUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}

// =============================================================================
// Script Loading
// =============================================================================

async function loadScript(loader: FileLoader, baseUrl: string): Promise<DemoScriptHooks | null> {
  // Check existence via fetch first — avoids noisy import() 404 errors in the console
  if (!(await loader.exists('script.js'))) return null;

  try {
    const scriptUrl = new URL('script.js', baseUrl).href;
    const mod = await import(/* @vite-ignore */ scriptUrl);
    const hooks: DemoScriptHooks = {};
    if (typeof mod.setup === 'function') hooks.setup = mod.setup;
    if (typeof mod.onFrame === 'function') hooks.onFrame = mod.onFrame;
    return (hooks.setup || hooks.onFrame) ? hooks : null;
  } catch {
    return null; // import failed — that's fine
  }
}

// =============================================================================
// Public API
// =============================================================================

export interface RuntimeMountOptions {
  styled?: boolean;
  pixelRatio?: number;
  layout?: LayoutMode;
  controls?: boolean;
  theme?: ThemeMode;
  startPaused?: boolean;
}

/**
 * Load a shader project from a folder URL (or bare .glsl URL) and mount it
 * into a DOM element.
 *
 * @param el - Target DOM element
 * @param url - URL to a shader folder ("/shaders/mandelbrot/") or bare file ("/shaders/test.glsl")
 * @param options - Presentation options
 */
export async function loadFromFolder(
  el: HTMLElement,
  url: string,
  options?: RuntimeMountOptions,
): Promise<MountHandle> {
  let project;

  if (url.endsWith('.glsl')) {
    // Bare .glsl file — fetch it and treat as a single-pass shader
    const absoluteUrl = toAbsoluteUrl(url);
    const response = await fetch(absoluteUrl);
    if (!response.ok) throw new Error(`Failed to fetch shader: ${url}`);
    const glslContent = await response.text();

    const loader = createSingleFileLoader(glslContent);
    project = await loadProjectFromFiles(loader, '.', {});
  } else {
    // Folder — resolve to absolute URL so new URL() works downstream
    const baseUrl = toAbsoluteUrl(url.endsWith('/') ? url : url + '/');
    const loader = createFetchFileLoader(baseUrl);
    const script = await loadScript(loader, baseUrl);
    const textureUrlResolver = async (path: string): Promise<string> => {
      return new URL(path, baseUrl).href;
    };

    project = await loadProjectFromFiles(loader, '.', {
      script,
      textureUrlResolver,
    });
  }

  return coreMount(el, {
    project,
    styled: options?.styled ?? true,
    pixelRatio: options?.pixelRatio,
    layout: options?.layout,
    controls: options?.controls,
    theme: options?.theme,
    startPaused: options?.startPaused,
  });
}

/**
 * <live-app> compatible mount function.
 * Reads options.shaderSrc for the folder URL.
 */
export async function mount(
  el: HTMLElement,
  options?: RuntimeMountOptions & { shaderSrc?: string },
): Promise<MountHandle> {
  const src = options?.shaderSrc;
  if (!src) {
    throw new Error(
      'shader-sandbox runtime: "shaderSrc" option is required. ' +
      'Use <shader-sandbox src="..."> or pass shaderSrc in options.',
    );
  }
  return loadFromFolder(el, src, options);
}

// Re-export for consumers
export type { MountHandle };

// =============================================================================
// <shader-sandbox> Custom Element
// =============================================================================

const RESERVED = new Set(['src', 'fullpage', 'lazy', 'style', 'class', 'id', 'slot', 'is']);

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function coerce(v: string): string | number | boolean {
  if (v === 'true') return true;
  if (v === 'false') return false;
  const n = Number(v);
  if (v !== '' && !isNaN(n)) return n;
  return v;
}

class ShaderSandbox extends HTMLElement {
  private _handle: MountHandle | null = null;
  private _observer: IntersectionObserver | null = null;
  private _unmountTimer: ReturnType<typeof setTimeout> | null = null;
  private _mounted: boolean = false;

  connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) {
      console.error('<shader-sandbox>: missing "src" attribute');
      return;
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

    // Lazy loading (default: true)
    const lazy = this.getAttribute('lazy') !== 'false';

    if (lazy) {
      this._observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            if (this._unmountTimer !== null) {
              clearTimeout(this._unmountTimer);
              this._unmountTimer = null;
            }
            if (!this._mounted) {
              this._mountShader();
            }
          } else if (this._mounted) {
            this._unmountTimer = setTimeout(() => {
              this._unmountTimer = null;
              this._unmountShader();
            }, 1000);
          }
        },
        { rootMargin: '200px' },
      );
      this._observer.observe(this);
    } else {
      this._mountShader();
    }
  }

  disconnectedCallback() {
    if (this._unmountTimer !== null) {
      clearTimeout(this._unmountTimer);
      this._unmountTimer = null;
    }
    this._observer?.disconnect();
    this._observer = null;
    this._unmountShader();
  }

  private _buildOptions(): RuntimeMountOptions {
    const opts: Record<string, unknown> = {};
    for (const attr of this.attributes) {
      if (RESERVED.has(attr.name)) continue;
      opts[kebabToCamel(attr.name)] = coerce(attr.value);
    }
    return opts as RuntimeMountOptions;
  }

  private async _mountShader(): Promise<void> {
    if (this._mounted) return;
    this._mounted = true;

    const src = this.getAttribute('src')!;

    try {
      this._handle = await loadFromFolder(this, src, this._buildOptions());
    } catch (err) {
      console.error('<shader-sandbox>: failed to load shader', err);
      this._mounted = false;
    }
  }

  private _unmountShader(): void {
    if (!this._mounted) return;
    this._handle?.destroy();
    this._handle = null;
    this._mounted = false;
  }
}

customElements.define('shader-sandbox', ShaderSandbox);
