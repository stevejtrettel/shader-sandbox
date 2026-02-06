/**
 * Split View Layout
 *
 * Displays two shader views side by side (horizontal on wide screens)
 * or stacked (vertical on narrow screens).
 *
 * Features:
 * - Responsive layout based on container aspect ratio
 * - Gap between views
 * - Shadow and rounded corners on each view
 * - Wrapper element for positioning shared controls
 */

import './multi-view.css';

import { MultiViewLayout, MultiViewLayoutOptions } from './types';

export class SplitViewLayout implements MultiViewLayout {
  private container: HTMLElement;
  private wrapper: HTMLElement;
  private canvasContainers: Map<string, HTMLElement> = new Map();
  private resizeObserver: ResizeObserver;

  constructor(opts: MultiViewLayoutOptions) {
    this.container = opts.container;

    // Create wrapper element (controls attach here)
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'layout-multi-view layout-split-view';

    // Create canvas container for each view
    for (const viewName of opts.viewNames) {
      const viewContainer = document.createElement('div');
      viewContainer.className = 'multi-view-canvas';
      viewContainer.setAttribute('data-view-name', viewName);

      // Add view label overlay
      const label = document.createElement('div');
      label.className = 'multi-view-label';
      label.textContent = viewName;
      viewContainer.appendChild(label);

      this.canvasContainers.set(viewName, viewContainer);
      this.wrapper.appendChild(viewContainer);
    }

    // Append to DOM
    this.container.appendChild(this.wrapper);

    // Set up responsive layout based on aspect ratio
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const isWide = width > height;
        this.wrapper.classList.toggle('split-horizontal', isWide);
        this.wrapper.classList.toggle('split-vertical', !isWide);
      }
    });
    this.resizeObserver.observe(this.wrapper);

    // Initial layout check
    const rect = this.wrapper.getBoundingClientRect();
    const isWide = rect.width > rect.height;
    this.wrapper.classList.add(isWide ? 'split-horizontal' : 'split-vertical');
  }

  getCanvasContainers(): Map<string, HTMLElement> {
    return this.canvasContainers;
  }

  getWrapperElement(): HTMLElement {
    return this.wrapper;
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.container.innerHTML = '';
  }
}
