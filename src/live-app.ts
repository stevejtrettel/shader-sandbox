/**
 * <live-app> Custom Element
 *
 * A generic launcher for any module that exports mount(el, options?).
 * Works with shader-sandbox, three.js apps, or any other visual module.
 *
 * Usage:
 *   <script type="module" src="/js/live-app.js"></script>
 *   <live-app src="/viz/my-shader/main.js" style="width:100%;height:400px;display:block;"></live-app>
 *
 * Reserved attributes (control the component itself):
 *   src       — Path to the module (must export mount)
 *   fullpage  — Present: fill the viewport (position:fixed, 100vw x 100vh)
 *   lazy      — "false" to disable lazy loading (default: lazy-loads on scroll)
 *
 * All other attributes are passed as options to mount():
 *   controls="false"    → { controls: false }
 *   theme="dark"        → { theme: 'dark' }
 *   start-paused="true" → { startPaused: true }
 *   pixel-ratio="2"     → { pixelRatio: 2 }
 *   camera-fov="75"     → { cameraFov: 75 }
 *
 * Type coercion: "true"/"false" → boolean, numeric strings → number.
 * Attribute names are converted from kebab-case to camelCase.
 *
 * Module contract:
 *   The imported module must export:
 *     mount(el, options?) → Promise<{ destroy() }> | { destroy() }
 */

/** Attributes reserved for component behavior (not passed as options). */
const RESERVED_ATTRS = new Set([
  'src', 'fullpage', 'lazy', 'style', 'class', 'id', 'slot', 'is',
]);

type MountFn = (
  el: HTMLElement,
  options?: Record<string, unknown>,
) => Promise<{ destroy: () => void }> | { destroy: () => void };

interface AppModule {
  mount: MountFn;
}

/**
 * Convert kebab-case to camelCase: "start-paused" → "startPaused"
 */
function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Coerce a string attribute value to a JS type:
 *   "true"/"false" → boolean
 *   numeric string  → number
 *   everything else → string
 */
function coerceValue(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const n = Number(value);
  if (value !== '' && !isNaN(n)) return n;
  return value;
}

class LiveApp extends HTMLElement {
  private _handle: { destroy: () => void } | null = null;
  private _observer: IntersectionObserver | null = null;
  private _unmountTimer: ReturnType<typeof setTimeout> | null = null;
  private _mounted: boolean = false;

  connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) {
      console.error('<live-app>: missing "src" attribute');
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
            // Cancel any pending unmount
            if (this._unmountTimer !== null) {
              clearTimeout(this._unmountTimer);
              this._unmountTimer = null;
            }
            if (!this._mounted) {
              this._mountApp();
            }
          } else if (this._mounted) {
            // Debounce unmount to avoid thrashing during fast scrolling
            this._unmountTimer = setTimeout(() => {
              this._unmountTimer = null;
              this._unmountApp();
            }, 1000);
          }
        },
        { rootMargin: '200px' },
      );
      this._observer.observe(this);
    } else {
      this._mountApp();
    }
  }

  disconnectedCallback() {
    if (this._unmountTimer !== null) {
      clearTimeout(this._unmountTimer);
      this._unmountTimer = null;
    }
    this._observer?.disconnect();
    this._observer = null;
    this._unmountApp();
  }

  /**
   * Collect non-reserved attributes into an options object.
   */
  private _buildOptions(): Record<string, unknown> {
    const options: Record<string, unknown> = {};
    for (const attr of this.attributes) {
      if (RESERVED_ATTRS.has(attr.name)) continue;
      options[kebabToCamel(attr.name)] = coerceValue(attr.value);
    }
    return options;
  }

  private async _mountApp(): Promise<void> {
    if (this._mounted) return;
    this._mounted = true;

    const src = this.getAttribute('src')!;
    const options = this._buildOptions();

    try {
      const module = await import(/* @vite-ignore */ src) as AppModule;
      if (!this._mounted) return; // unmounted while loading
      if (!module.mount) {
        throw new Error('Module must export mount()');
      }
      this._handle = await module.mount(this, options);
    } catch (err) {
      console.error('<live-app>: failed to load module', err);
      this._mounted = false;
    }
  }

  private _unmountApp(): void {
    if (!this._mounted) return;
    this._handle?.destroy();
    this._handle = null;
    this._mounted = false;
  }
}

customElements.define('live-app', LiveApp);
