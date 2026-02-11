/**
 * <live-app> Custom Element
 *
 * A thin wrapper that dynamically imports a visualization module and calls
 * its mount() function. Each visualization is a self-contained ES module
 * that exports mount(el, options) → { destroy() }.
 *
 * Usage:
 *   <script type="module" src="./live-app.js"></script>
 *   <live-app src="./my-shader.js" fullpage></live-app>
 *
 * Attributes:
 *   src       - (required) Path to the ES module that exports mount()
 *   fullpage  - (optional) If present, fills the viewport
 *   Any other attributes are passed as options to mount()
 */
class LiveApp extends HTMLElement {
  async connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) {
      console.error('<live-app> requires a "src" attribute');
      return;
    }

    try {
      const module = await import(src);

      // Gather non-reserved attributes as options
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

      this._instance = await module.mount(this, options);
    } catch (err) {
      console.error(`<live-app> failed to load "${src}":`, err);
    }
  }

  disconnectedCallback() {
    this._instance?.destroy();
    this._instance = null;
  }
}

customElements.define('live-app', LiveApp);
