/**
 * Canvas-only layouts: 'default' (centered, pane decoration) and
 * 'fullscreen' (fills the viewport, no chrome).
 *
 * Structurally identical — a root div with a canvas container — differing
 * only in the layout class their CSS targets.
 */

import './default.css';
import './fullscreen.css';

import { BaseLayout, LayoutOptions } from './types';

class CanvasLayout implements BaseLayout {
  private container: HTMLElement;
  private canvasContainer: HTMLElement;

  constructor(opts: LayoutOptions, mode: 'default' | 'fullscreen') {
    this.container = opts.container;

    const root = document.createElement('div');
    root.className = `layout-${mode}`;

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'canvas-container';

    root.appendChild(this.canvasContainer);
    this.container.appendChild(root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  dispose(): void {
    this.container.innerHTML = '';
  }
}

export class DefaultLayout extends CanvasLayout {
  constructor(opts: LayoutOptions) {
    super(opts, 'default');
  }
}

export class FullscreenLayout extends CanvasLayout {
  constructor(opts: LayoutOptions) {
    super(opts, 'fullscreen');
  }
}
