/**
 * Split Layout
 *
 * Shader on left, editable code on right with syntax highlighting.
 * Ideal for teaching and presentations where viewers can tweak the code.
 */

import './split.css';

import { BaseLayout, LayoutOptions, RecompileHandler, UniformChangeHandler } from './types';
import { ShaderProject } from '../project/types';
import type { EditorPanel } from '../editor/EditorPanel';

export class SplitLayout implements BaseLayout {
  private container: HTMLElement;
  private project: ShaderProject;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;
  private codePanel: HTMLElement;

  private editorPanel: EditorPanel | null = null;
  private recompileHandler: RecompileHandler | null = null;
  private _disposed = false;


  constructor(opts: LayoutOptions) {
    this.container = opts.container;
    this.project = opts.project;

    // Create root layout container
    this.root = document.createElement('div');
    this.root.className = 'layout-split';

    // Create canvas container (left side)
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'canvas-container';

    // Create code panel (right side)
    this.codePanel = document.createElement('div');
    this.codePanel.className = 'code-panel';

    // Build editor panel
    this.buildEditorPanel();

    // Assemble and append to DOM
    this.root.appendChild(this.canvasContainer);
    this.root.appendChild(this.codePanel);
    this.container.appendChild(this.root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  setRecompileHandler(handler: RecompileHandler): void {
    this.recompileHandler = handler;
    if (this.editorPanel) {
      this.editorPanel.setRecompileHandler(handler);
    }
  }

  setUniformHandler(_handler: UniformChangeHandler): void {
    // TODO: wire up uniform change handler to editor panel
  }

  dispose(): void {
    this._disposed = true;
    if (this.editorPanel) {
      this.editorPanel.dispose();
      this.editorPanel = null;
    }
    this.container.innerHTML = '';
  }

  /**
   * Build editor panel (dynamically loaded).
   */
  private async buildEditorPanel(): Promise<void> {
    try {
      const { EditorPanel } = await import('../editor/EditorPanel');
      if (this._disposed) return;
      this.editorPanel = new EditorPanel(this.codePanel, this.project);
      if (this.recompileHandler) {
        this.editorPanel.setRecompileHandler(this.recompileHandler);
      }
    } catch (err) {
      console.error('Failed to load editor panel:', err);
    }
  }
}
