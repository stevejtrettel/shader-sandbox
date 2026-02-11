/**
 * Grid Layout
 *
 * Adaptive multi-view layout that arranges N shader views using CSS Grid.
 * Replaces SplitViewLayout and QuadViewLayout with a single responsive class.
 *
 * View count behavior:
 * - 2 views: side-by-side (wide) or stacked (narrow), responsive
 * - 3 views: 2-column grid, last view spans full width
 * - 4 views: 2x2 grid
 */

import './multi-view.css';

import { MultiViewLayout, MultiViewLayoutOptions } from './types';

export class GridLayout implements MultiViewLayout {
  private container: HTMLElement;
  private wrapper: HTMLElement;
  private canvasContainers: Map<string, HTMLElement> = new Map();
  private resizeObserver: ResizeObserver;

  constructor(opts: MultiViewLayoutOptions) {
    this.container = opts.container;
    const n = opts.viewNames.length;

    // Create wrapper element (controls attach here)
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'layout-multi-view layout-grid-view';
    this.wrapper.dataset.viewCount = String(n);

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

    // Responsive layout: switch orientation based on aspect ratio (for 2-3 views)
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.updateOrientation(width, height);
      }
    });
    this.resizeObserver.observe(this.wrapper);

    // Initial orientation
    const rect = this.wrapper.getBoundingClientRect();
    this.updateOrientation(rect.width, rect.height);
  }

  private updateOrientation(width: number, height: number): void {
    const isWide = width > height;
    this.wrapper.classList.toggle('grid-horizontal', isWide);
    this.wrapper.classList.toggle('grid-vertical', !isWide);
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
