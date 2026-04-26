/**
 * Uniforms Panel - Floating overlay for uniform controls
 *
 * A compact panel that floats on the right side of the canvas.
 * Includes a toggle button to show/hide. Starts closed by default.
 */

import './uniforms-panel.css';

import { UniformDefinitions, UniformValue, UniformValues, hasUIControl } from '../project/types';
import { UniformControls } from './UniformControls';

export interface UniformsPanelOptions {
  /** Parent container to attach the panel to */
  container: HTMLElement;
  /** Uniform definitions from project */
  uniforms: UniformDefinitions;
  /** Callback when uniform value changes */
  onChange: (name: string, value: UniformValue) => void;
  /** Initial values (optional) */
  initialValues?: UniformValues;
  /** Start with panel open (default: false). Ignored when collapsible is false. */
  startOpen?: boolean;
  /** If true (default), the panel collapses behind a toggle button. If false,
   *  the panel is always visible inline over the shader, with no toggle or
   *  header chrome. */
  collapsible?: boolean;
}

export class UniformsPanel {
  private wrapper: HTMLElement;
  private panel: HTMLElement;
  private toggleButton: HTMLElement | null = null;
  private controls: UniformControls | null = null;
  private collapsible: boolean;
  private isOpen: boolean;

  constructor(opts: UniformsPanelOptions) {
    this.collapsible = opts.collapsible ?? true;
    // When inline (not collapsible), the panel is always open.
    this.isOpen = this.collapsible ? (opts.startOpen ?? false) : true;

    // Create wrapper for the panel (and toggle button, if collapsible)
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'uniforms-panel-wrapper';
    if (!this.collapsible) {
      this.wrapper.classList.add('inline');
    }

    // Toggle button only exists in collapsible mode
    if (this.collapsible) {
      this.toggleButton = document.createElement('button');
      this.toggleButton.className = 'uniforms-toggle-button';
      this.toggleButton.title = 'Toggle Uniforms Panel';
      this.toggleButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="21" x2="4" y2="14"></line>
          <line x1="4" y1="10" x2="4" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="3"></line>
          <line x1="20" y1="21" x2="20" y2="16"></line>
          <line x1="20" y1="12" x2="20" y2="3"></line>
          <line x1="1" y1="14" x2="7" y2="14"></line>
          <line x1="9" y1="8" x2="15" y2="8"></line>
          <line x1="17" y1="16" x2="23" y2="16"></line>
        </svg>
      `;
      this.toggleButton.addEventListener('click', () => this.toggle());
      this.wrapper.appendChild(this.toggleButton);
    }

    // Create panel element
    this.panel = document.createElement('div');
    this.panel.className = 'uniforms-panel';

    // Only create content if there are visible uniforms
    const hasVisible = Object.values(opts.uniforms).some(def => hasUIControl(def));
    if (!hasVisible) {
      this.wrapper.style.display = 'none';
      opts.container.appendChild(this.wrapper);
      return;
    }

    // Header with close button (only in collapsible mode — inline mode is chromeless)
    if (this.collapsible) {
      const header = document.createElement('div');
      header.className = 'uniforms-panel-header';

      const title = document.createElement('span');
      title.textContent = 'Uniforms';
      header.appendChild(title);

      const closeButton = document.createElement('button');
      closeButton.className = 'uniforms-panel-close';
      closeButton.innerHTML = '&times;';
      closeButton.title = 'Close';
      closeButton.addEventListener('click', () => this.hide());
      header.appendChild(closeButton);

      this.panel.appendChild(header);
    }

    // Content area for controls
    const content = document.createElement('div');
    content.className = 'uniforms-panel-content';
    this.panel.appendChild(content);

    // Create uniform controls
    this.controls = new UniformControls({
      container: content,
      uniforms: opts.uniforms,
      initialValues: opts.initialValues,
      onChange: opts.onChange,
    });

    // Inline mode: physically unwrap the .uniform-control-label-row inside
    // float/int controls so [label, value, slider] become direct grid children.
    // (Avoids relying on display:contents, which can interact poorly with
    // grid layout in some browsers.)
    if (!this.collapsible) {
      const targets = content.querySelectorAll<HTMLElement>(
        '.uniform-control-float > .uniform-control-label-row, .uniform-control-int > .uniform-control-label-row',
      );
      for (const labelRow of targets) {
        const parent = labelRow.parentElement!;
        while (labelRow.firstChild) {
          parent.insertBefore(labelRow.firstChild, labelRow);
        }
        labelRow.remove();
      }
    }

    this.wrapper.appendChild(this.panel);

    // Set initial state — inline mode never gets the .closed class
    if (this.collapsible && !this.isOpen) {
      this.panel.classList.add('closed');
    }

    // Append to container
    opts.container.appendChild(this.wrapper);
  }

  /**
   * Update a uniform value from external source.
   */
  setValue(name: string, value: UniformValue): void {
    this.controls?.setValue(name, value);
  }

  /**
   * Show the panel.
   */
  show(): void {
    if (!this.collapsible) return;
    this.isOpen = true;
    this.toggleButton?.classList.add('hidden');
    this.panel.classList.remove('closed');
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    if (!this.collapsible) return;
    this.isOpen = false;
    this.panel.classList.add('closed');
    this.toggleButton?.classList.remove('hidden');
  }

  /**
   * Toggle panel visibility.
   */
  toggle(): void {
    if (!this.collapsible) return;
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if panel is visible.
   */
  isVisible(): boolean {
    return this.isOpen;
  }

  /**
   * Destroy the panel.
   */
  destroy(): void {
    this.controls?.destroy();
    this.wrapper.remove();
  }
}
