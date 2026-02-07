/**
 * <live-app> Custom Element
 *
 * Usage:
 *   <script type="module" src="/js/live-app.js"></script>
 *   <live-app src="/viz/my-shader/main.js" style="width:100%;height:400px;display:block;"></live-app>
 *
 * Attributes:
 *   src       — Path to the built shader module (main.js)
 *   styled    — "true" to enable pane decoration (default: false)
 *   fullpage  — Present: fill the viewport (position:fixed, 100vw x 100vh)
 */

interface ShaderModule {
  mountDemo: (el: HTMLElement, options?: { styled?: boolean }) => Promise<{ destroy: () => void }>;
}

class LiveApp extends HTMLElement {
  private _handle: { destroy: () => void } | null = null;

  async connectedCallback() {
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

    const styled = this.getAttribute('styled') === 'true';

    try {
      const module = await import(/* @vite-ignore */ src) as ShaderModule;
      this._handle = await module.mountDemo(this, { styled });
    } catch (err) {
      console.error('<live-app>: failed to load module', err);
    }
  }

  disconnectedCallback() {
    this._handle?.destroy();
    this._handle = null;
  }
}

customElements.define('live-app', LiveApp);
