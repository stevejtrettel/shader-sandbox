/**
 * <live-app> Custom Element
 *
 * A generic launcher for any module that exports mount(el, options?).
 * Works with shader-sandbox, three.js apps, or any other visual module.
 *
 * Usage:
 *   <script type="module" src="./live-app.js"></script>
 *   <live-app src="./my-shader.js" fullpage></live-app>
 *
 * Reserved attributes (control the component itself):
 *   src       — Path to the module
 *   fullpage  — Fill the viewport (position:fixed, 100vw x 100vh)
 *   lazy      — "false" to disable lazy loading (default: lazy-loads on scroll)
 *
 * All other attributes are passed as options to the mount function:
 *   controls="false"    → { controls: false }
 *   theme="dark"        → { theme: 'dark' }
 *   start-paused="true" → { startPaused: true }
 *   pixel-ratio="2"     → { pixelRatio: 2 }
 *
 * Type coercion: "true"/"false" → boolean, numeric strings → number.
 * Attribute names are converted from kebab-case to camelCase.
 */

const RESERVED = new Set(['src', 'fullpage', 'lazy', 'style', 'class', 'id', 'slot', 'is']);

function kebabToCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function coerce(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  const n = Number(v);
  if (v !== '' && !isNaN(n)) return n;
  return v;
}

class LiveApp extends HTMLElement {
  connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) {
      console.error('<live-app> requires a "src" attribute');
      return;
    }

    if (this.hasAttribute('fullpage')) {
      Object.assign(this.style, {
        display: 'block', width: '100vw', height: '100vh',
        position: 'fixed', top: '0', left: '0',
      });
    } else if (!this.style.display || this.style.display === 'inline') {
      this.style.display = 'block';
    }

    const lazy = this.getAttribute('lazy') !== 'false';

    if (lazy) {
      this._observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            if (this._unmountTimer) { clearTimeout(this._unmountTimer); this._unmountTimer = null; }
            if (!this._mounted) this._mount(src);
          } else if (this._mounted) {
            this._unmountTimer = setTimeout(() => { this._unmountTimer = null; this._unmount(); }, 1000);
          }
        },
        { rootMargin: '200px' },
      );
      this._observer.observe(this);
    } else {
      this._mount(src);
    }
  }

  disconnectedCallback() {
    if (this._unmountTimer) { clearTimeout(this._unmountTimer); this._unmountTimer = null; }
    if (this._observer) { this._observer.disconnect(); this._observer = null; }
    this._unmount();
  }

  _buildOptions() {
    const opts = {};
    for (const attr of this.attributes) {
      if (RESERVED.has(attr.name)) continue;
      opts[kebabToCamel(attr.name)] = coerce(attr.value);
    }
    return opts;
  }

  async _mount(src) {
    if (this._mounted) return;
    this._mounted = true;

    try {
      const mod = await import(src);
      if (!this._mounted) return;
      if (!mod.mount) throw new Error('Module must export mount()');
      this._handle = await mod.mount(this, this._buildOptions());
    } catch (err) {
      console.error(`<live-app> failed to load "${src}":`, err);
      this._mounted = false;
    }
  }

  _unmount() {
    if (!this._mounted) return;
    if (this._handle) { this._handle.destroy(); this._handle = null; }
    this._mounted = false;
  }
}

customElements.define('live-app', LiveApp);
