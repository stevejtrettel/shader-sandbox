/**
 * Quad View Layout
 *
 * Displays four shader views in a 2x2 grid.
 */

import './multi-view.css';

import { MultiViewLayout, MultiViewLayoutOptions } from './types';

export class QuadViewLayout implements MultiViewLayout {
  private container: HTMLElement;
  private wrapper: HTMLElement;
  private canvasContainers: Map<string, HTMLElement> = new Map();

  constructor(opts: MultiViewLayoutOptions) {
    this.container = opts.container;

    // Create wrapper element
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'layout-multi-view layout-quad-view';

    // Create canvas container for each view (expects 4 views)
    for (const viewName of opts.viewNames) {
      const viewContainer = document.createElement('div');
      viewContainer.className = 'multi-view-canvas';
      viewContainer.setAttribute('data-view-name', viewName);

      this.canvasContainers.set(viewName, viewContainer);
      this.wrapper.appendChild(viewContainer);
    }

    // Append to DOM
    this.container.appendChild(this.wrapper);
  }

  getCanvasContainers(): Map<string, HTMLElement> {
    return this.canvasContainers;
  }

  getWrapperElement(): HTMLElement {
    return this.wrapper;
  }

  dispose(): void {
    this.container.innerHTML = '';
  }
}
