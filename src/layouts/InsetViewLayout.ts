/**
 * Inset View Layout
 *
 * Displays two views: one fullscreen (main) and one as a small overlay (inset).
 * The inset can be minimized to show the full main view.
 */

import './multi-view.css';

import { MultiViewLayout, MultiViewLayoutOptions } from './types';

export class InsetViewLayout implements MultiViewLayout {
  private container: HTMLElement;
  private wrapper: HTMLElement;
  private canvasContainers: Map<string, HTMLElement> = new Map();
  private insetContainer: HTMLElement | null = null;
  private minimizeBtn: HTMLElement | null = null;
  private isMinimized: boolean = false;

  constructor(opts: MultiViewLayoutOptions) {
    this.container = opts.container;

    if (opts.viewNames.length < 2) {
      throw new Error('InsetViewLayout requires at least 2 views');
    }

    // Create wrapper element
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'layout-multi-view layout-inset-view';

    // First view is the main (fullscreen) view
    const mainViewName = opts.viewNames[0];
    const mainContainer = document.createElement('div');
    mainContainer.className = 'multi-view-canvas inset-main';
    mainContainer.setAttribute('data-view-name', mainViewName);
    this.canvasContainers.set(mainViewName, mainContainer);
    this.wrapper.appendChild(mainContainer);

    // Second view is the inset (overlay) view
    const insetViewName = opts.viewNames[1];
    this.insetContainer = document.createElement('div');
    this.insetContainer.className = 'multi-view-canvas inset-overlay';
    this.insetContainer.setAttribute('data-view-name', insetViewName);
    this.canvasContainers.set(insetViewName, this.insetContainer);

    // Create minimize/restore button
    this.minimizeBtn = document.createElement('button');
    this.minimizeBtn.className = 'inset-minimize-btn';
    this.minimizeBtn.innerHTML = '&#x2212;'; // Minus sign
    this.minimizeBtn.title = 'Minimize';
    this.minimizeBtn.addEventListener('click', this.toggleMinimize);
    this.insetContainer.appendChild(this.minimizeBtn);

    this.wrapper.appendChild(this.insetContainer);

    // Click on minimized inset to restore
    this.insetContainer.addEventListener('click', (e) => {
      if (this.isMinimized && e.target === this.insetContainer) {
        this.toggleMinimize();
      }
    });

    // Append to DOM
    this.container.appendChild(this.wrapper);
  }

  private toggleMinimize = (): void => {
    this.isMinimized = !this.isMinimized;

    if (this.insetContainer) {
      this.insetContainer.classList.toggle('minimized', this.isMinimized);
    }

    if (this.minimizeBtn) {
      if (this.isMinimized) {
        this.minimizeBtn.innerHTML = '&#x25A1;'; // Square (restore)
        this.minimizeBtn.title = 'Restore';
        this.minimizeBtn.style.display = 'none'; // Hide button when minimized (click anywhere to restore)
      } else {
        this.minimizeBtn.innerHTML = '&#x2212;'; // Minus (minimize)
        this.minimizeBtn.title = 'Minimize';
        this.minimizeBtn.style.display = '';
      }
    }
  };

  getCanvasContainers(): Map<string, HTMLElement> {
    return this.canvasContainers;
  }

  getWrapperElement(): HTMLElement {
    return this.wrapper;
  }

  dispose(): void {
    if (this.minimizeBtn) {
      this.minimizeBtn.removeEventListener('click', this.toggleMinimize);
    }
    this.container.innerHTML = '';
  }
}
