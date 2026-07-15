/**
 * Editor Panel - Shared component for code editing in layouts
 *
 * Provides:
 * - CodeMirror editor (dynamically loaded)
 * - Recompile button with keyboard shortcut
 * - Error display
 * - Tab management for multiple passes
 */

import { ShaderProject, PassName } from '../project/types';
import { RecompileHandler } from '../layouts/types';
import type { EditorInstance } from './prism-editor';

import './editor-panel.css';

type ViewTab = { kind: 'view'; name: string };
type CodeTab = { kind: 'code'; name: string; passName: 'common' | PassName; source: string };
type ImageTab = { kind: 'image'; name: string; url: string };
type Tab = ViewTab | CodeTab | ImageTab;

export interface EditorPanelOptions {
  /**
   * Optional leading tab that shows an external element instead of an
   * editor — used by TabbedLayout to put the live canvas on the first tab.
   * The element is adopted into the panel's content area and toggled with
   * `visibility` (never display:none, which would zero the canvas size).
   */
  viewTab?: { name: string; element: HTMLElement };

  /**
   * Narrow the panel to a single pass ('common' | 'Image' | 'BufferA'…):
   * one tabless code block instead of the full tab bar. Used by
   * <shader-editor pass="...">.
   */
  pass?: 'common' | PassName;
}

export class EditorPanel {
  private container: HTMLElement;
  private project: ShaderProject;
  private recompileHandler: RecompileHandler | null = null;

  private tabBar: HTMLElement;
  private contentArea: HTMLElement;
  private viewSlot: HTMLElement | null = null;
  private editorHost: HTMLElement;
  private copyButton: HTMLElement;
  private recompileButton: HTMLElement;
  private errorDisplay: HTMLElement;

  private tabs: Tab[] = [];
  private activeTabIndex: number = 0;

  // Editor instance (null if not in editor mode or viewing image)
  private editorInstance: EditorInstance | null = null;

  // Track modified sources (passName -> modified source)
  private modifiedSources: Map<string, string> = new Map();

  // Stored for cleanup in dispose()
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(container: HTMLElement, project: ShaderProject, opts: EditorPanelOptions = {}) {
    this.container = container;
    this.project = project;

    // Build tabs
    this.buildTabs(opts.viewTab?.name);

    // Single-pass mode: keep only the requested code tab, no tab bar
    if (opts.pass !== undefined) {
      this.tabs = this.tabs.filter(t => t.kind === 'code' && t.passName === opts.pass);
      if (this.tabs.length === 0) {
        console.warn(`EditorPanel: pass '${opts.pass}' not found in project`);
      }
    }

    // Create tab bar (hidden entirely in single-pass mode)
    this.tabBar = document.createElement('div');
    this.tabBar.className = 'editor-tab-bar';
    if (opts.pass !== undefined) this.tabBar.style.display = 'none';
    this.buildTabBar();

    // Create content area with two stacked slots: the external view (if
    // any) and the editor host. Both fill the area; visibility toggles.
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'editor-content-area';

    if (opts.viewTab) {
      this.viewSlot = document.createElement('div');
      this.viewSlot.className = 'editor-view-slot';
      this.viewSlot.appendChild(opts.viewTab.element);
      this.contentArea.appendChild(this.viewSlot);
    }

    this.editorHost = document.createElement('div');
    this.editorHost.className = 'editor-host-slot';
    this.contentArea.appendChild(this.editorHost);

    // Create copy button (icon only)
    this.copyButton = document.createElement('button');
    this.copyButton.className = 'editor-copy-button';
    this.copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" opacity="0.4"/>
        <path d="M2 5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2zm0 1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>
      </svg>
    `;
    this.copyButton.title = 'Copy code to clipboard';
    this.copyButton.addEventListener('click', () => this.copyToClipboard());

    // Create recompile button
    this.recompileButton = document.createElement('button');
    this.recompileButton.className = 'editor-recompile-button';
    this.recompileButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 3v10l8-5-8-5z"/>
      </svg>
      Recompile
    `;
    this.recompileButton.title = 'Recompile shader (Ctrl+Enter)';
    this.recompileButton.addEventListener('click', () => this.recompile());

    // Create error display
    this.errorDisplay = document.createElement('div');
    this.errorDisplay.className = 'editor-error-display';
    this.errorDisplay.style.display = 'none';

    // Assemble panel
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.appendChild(this.tabBar);
    toolbar.appendChild(this.copyButton);
    toolbar.appendChild(this.recompileButton);

    this.container.appendChild(toolbar);
    this.container.appendChild(this.contentArea);
    this.container.appendChild(this.errorDisplay);

    // Set up keyboard shortcut
    this.setupKeyboardShortcut();

    // Load editor for first tab
    this.showTab(0);
  }

  setRecompileHandler(handler: RecompileHandler): void {
    this.recompileHandler = handler;
  }

  dispose(): void {
    if (this.keydownHandler) {
      this.container.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.editorInstance) {
      this.editorInstance.dispose();
      this.editorInstance = null;
    }
    this.container.innerHTML = '';
  }

  private buildTabs(viewTabName?: string): void {
    this.tabs = [];

    // 0. External view tab (e.g. live canvas), always first
    if (viewTabName !== undefined) {
      this.tabs.push({ kind: 'view', name: viewTabName });
    }

    // 1. Common (if exists)
    if (this.project.commonSource) {
      this.tabs.push({
        kind: 'code',
        name: 'common.glsl',
        passName: 'common',
        source: this.project.commonSource,
      });
    }

    // 2. Buffers in order (A, B, C, D)
    const bufferOrder: ('BufferA' | 'BufferB' | 'BufferC' | 'BufferD')[] = [
      'BufferA', 'BufferB', 'BufferC', 'BufferD',
    ];
    for (const bufferName of bufferOrder) {
      const pass = this.project.passes[bufferName];
      if (pass) {
        this.tabs.push({
          kind: 'code',
          name: `${bufferName.toLowerCase()}.glsl`,
          passName: bufferName,
          source: pass.glslSource,
        });
      }
    }

    // 3. Image pass
    const imagePass = this.project.passes.Image;
    this.tabs.push({
      kind: 'code',
      name: 'image.glsl',
      passName: 'Image',
      source: imagePass.glslSource,
    });

    // 4. Textures (images) - not editable
    for (const texture of this.project.textures) {
      this.tabs.push({
        kind: 'image',
        name: texture.filename || texture.name,
        url: texture.source,
      });
    }
  }

  private buildTabBar(): void {
    this.tabBar.innerHTML = '';

    this.tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'editor-tab-button';
      if (tab.kind === 'image') {
        tabButton.classList.add('image-tab');
      } else if (tab.kind === 'view') {
        tabButton.classList.add('view-tab');
      }
      tabButton.textContent = tab.name;
      if (index === this.activeTabIndex) {
        tabButton.classList.add('active');
      }

      tabButton.addEventListener('click', () => this.showTab(index));
      this.tabBar.appendChild(tabButton);
    });
  }

  private async showTab(index: number): Promise<void> {
    // Save current editor content before switching
    this.saveCurrentEditorContent();

    this.activeTabIndex = index;
    const tab = this.tabs[index];

    // Update tab bar active state
    this.tabBar.querySelectorAll('.editor-tab-button').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    // Destroy previous editor instance before clearing DOM
    if (this.editorInstance) {
      this.editorInstance.dispose();
      this.editorInstance = null;
    }

    // Clear the editor host (the view slot is never cleared — the layout
    // owns the element inside it)
    this.editorHost.innerHTML = '';

    if (tab.kind === 'view') {
      // Show the external view, hide editor chrome
      if (this.viewSlot) this.viewSlot.style.visibility = 'visible';
      this.editorHost.style.visibility = 'hidden';
      this.copyButton.style.display = 'none';
      this.recompileButton.style.display = 'none';
      return;
    }

    if (this.viewSlot) this.viewSlot.style.visibility = 'hidden';
    this.editorHost.style.visibility = 'visible';

    if (tab.kind === 'code') {
      // Show buttons
      this.copyButton.style.display = '';
      this.recompileButton.style.display = '';

      // Get source (use modified if available, otherwise original)
      const source = this.modifiedSources.get(tab.passName) ?? tab.source;

      // Create editor container
      const editorContainer = document.createElement('div');
      editorContainer.className = 'editor-prism-container';
      this.editorHost.appendChild(editorContainer);

      // Dynamically load editor and create instance
      try {
        const { createEditor } = await import('./prism-editor');
        this.editorInstance = createEditor(editorContainer, source, (newSource) => {
          // Track modifications
          this.modifiedSources.set(tab.passName, newSource);
        });
      } catch (err) {
        console.error('Failed to load editor:', err);
        // Fallback to textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'editor-fallback-textarea';
        textarea.value = source;
        textarea.addEventListener('input', () => {
          this.modifiedSources.set(tab.passName, textarea.value);
        });
        editorContainer.appendChild(textarea);
      }
    } else {
      // Hide buttons for image tabs
      this.copyButton.style.display = 'none';
      this.recompileButton.style.display = 'none';

      // Show image
      const imgContainer = document.createElement('div');
      imgContainer.className = 'editor-image-viewer';

      const img = document.createElement('img');
      img.src = tab.url;
      img.alt = tab.name;

      imgContainer.appendChild(img);
      this.editorHost.appendChild(imgContainer);
    }
  }

  private saveCurrentEditorContent(): void {
    if (this.editorInstance) {
      const tab = this.tabs[this.activeTabIndex];
      if (tab.kind === 'code') {
        const source = this.editorInstance.getSource();
        this.modifiedSources.set(tab.passName, source);
      }
    }
  }

  private recompile(): void {
    if (!this.recompileHandler) {
      console.warn('No recompile handler set');
      return;
    }

    // Save current content first
    this.saveCurrentEditorContent();

    const tab = this.tabs[this.activeTabIndex];
    if (tab.kind !== 'code') {
      return;
    }

    const source = this.modifiedSources.get(tab.passName) ?? tab.source;
    const result = this.recompileHandler(tab.passName, source);

    if (result.success) {
      this.hideError();
      // Update the original source in the tab
      tab.source = source;
    } else {
      this.showError(result.error || 'Compilation failed');
    }
  }

  private showError(message: string): void {
    this.errorDisplay.textContent = message;
    this.errorDisplay.style.display = 'block';
  }

  private hideError(): void {
    this.errorDisplay.style.display = 'none';
  }

  private async copyToClipboard(): Promise<void> {
    const tab = this.tabs[this.activeTabIndex];
    if (tab.kind !== 'code') return;

    // Get current source (modified or original)
    const source = this.editorInstance
      ? this.editorInstance.getSource()
      : (this.modifiedSources.get(tab.passName) ?? tab.source);

    try {
      await navigator.clipboard.writeText(source);
      // Show checkmark feedback
      const originalHTML = this.copyButton.innerHTML;
      this.copyButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
        </svg>
      `;
      this.copyButton.classList.add('copied');
      setTimeout(() => {
        this.copyButton.innerHTML = originalHTML;
        this.copyButton.classList.remove('copied');
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  private setupKeyboardShortcut(): void {
    // Listen for Ctrl+Enter / Cmd+Enter — only while a code tab is active,
    // so the shortcut can't hijack keys meant for the shader/view tab
    this.keydownHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (this.tabs[this.activeTabIndex]?.kind !== 'code') return;
        e.preventDefault();
        this.recompile();
      }
    };
    this.container.addEventListener('keydown', this.keydownHandler);
  }
}
