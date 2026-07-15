/**
 * Tabbed Layout
 *
 * Single window with tabs to switch between the live shader, editable code,
 * and textures. A thin arrangement around EditorPanel: the panel owns all
 * tab/editor/recompile behavior; this layout just provides the frame and
 * hands the canvas container to the panel's leading "Shader" tab.
 */

import './tabbed.css';

import { BaseLayout, LayoutOptions, RecompileHandler } from './types';
import { EditorPanel } from '../editor/EditorPanel';

export class TabbedLayout implements BaseLayout {
  private container: HTMLElement;
  private canvasContainer: HTMLElement;
  private editorPanel: EditorPanel;

  constructor(opts: LayoutOptions) {
    this.container = opts.container;

    // Root layout container
    const root = document.createElement('div');
    root.className = 'layout-tabbed';

    // Wrapper to constrain size (matches default layout)
    const wrapper = document.createElement('div');
    wrapper.className = 'tabbed-wrapper';

    // Canvas container — handed to EditorPanel as the leading "Shader" tab
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'tabbed-canvas-container';

    this.editorPanel = new EditorPanel(wrapper, opts.project, {
      viewTab: { name: 'Shader', element: this.canvasContainer },
    });

    root.appendChild(wrapper);
    this.container.appendChild(root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  setRecompileHandler(handler: RecompileHandler): void {
    this.editorPanel.setRecompileHandler(handler);
  }

  dispose(): void {
    this.editorPanel.dispose();
    this.container.innerHTML = '';
  }
}
