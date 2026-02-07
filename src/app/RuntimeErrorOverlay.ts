/**
 * RuntimeErrorOverlay - Visual error reporting for runtime errors
 *
 * Shows a dismissible banner for:
 * - Script errors (setup/onFrame throws)
 * - Asset load failures (texture, framebuffer)
 *
 * Auto-hides after a timeout if no new errors occur.
 * Shows a persistent warning when onFrame() is disabled after too many errors.
 */

export class RuntimeErrorOverlay {
  private container: HTMLElement;
  private overlay: HTMLElement | null = null;
  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly AUTO_HIDE_MS = 5000;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Show an error from setup() or onFrame().
   */
  showError(hook: 'setup' | 'onFrame', error: unknown): void {
    this.clearAutoHide();
    this.ensureOverlay();

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error && error.stack
      ? error.stack.split('\n').slice(1, 4).join('\n')
      : '';

    this.overlay!.innerHTML = `
      <div class="script-error-content">
        <div class="script-error-header">
          <span class="script-error-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5z"/>
            </svg>
            script.js ${hook}() error
          </span>
          <button class="script-error-close" title="Dismiss">\u00d7</button>
        </div>
        <pre class="script-error-message">${escapeHTML(message)}</pre>
        ${stack ? `<pre class="script-error-stack">${escapeHTML(stack)}</pre>` : ''}
      </div>
    `;

    this.wireClose();
    this.autoHideTimer = setTimeout(() => this.hide(), RuntimeErrorOverlay.AUTO_HIDE_MS);
  }

  /**
   * Show a persistent warning when onFrame() has been disabled.
   */
  showDisabled(): void {
    this.clearAutoHide();
    this.ensureOverlay();

    this.overlay!.innerHTML = `
      <div class="script-error-content">
        <div class="script-error-header disabled">
          <span class="script-error-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5z"/>
            </svg>
            script.js onFrame() disabled
          </span>
          <button class="script-error-close" title="Dismiss">\u00d7</button>
        </div>
        <pre class="script-error-message">Too many consecutive errors. Reload to retry.</pre>
      </div>
    `;

    this.wireClose();
  }

  /**
   * Show a warning banner for asset load errors (textures, framebuffers).
   */
  showWarning(title: string, message: string): void {
    this.clearAutoHide();
    this.ensureOverlay();

    this.overlay!.innerHTML = `
      <div class="script-error-content">
        <div class="script-error-header warning">
          <span class="script-error-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            ${escapeHTML(title)}
          </span>
          <button class="script-error-close" title="Dismiss">\u00d7</button>
        </div>
        <pre class="script-error-message">${escapeHTML(message)}</pre>
      </div>
    `;

    this.wireClose();
    this.autoHideTimer = setTimeout(() => this.hide(), RuntimeErrorOverlay.AUTO_HIDE_MS);
  }

  /**
   * Hide the overlay.
   */
  hide(): void {
    this.clearAutoHide();
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.hide();
  }

  private ensureOverlay(): void {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'script-error-overlay';
      this.container.appendChild(this.overlay);
    }
  }

  private wireClose(): void {
    const closeButton = this.overlay?.querySelector('.script-error-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
  }

  private clearAutoHide(): void {
    if (this.autoHideTimer !== null) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }
}

function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
