/**
 * UI Layout
 *
 * Shader on left, uniform controls panel on right (~200px wide).
 * Playback controls (play/pause, reset, screenshot) at bottom of UI panel.
 * Responsive: stacks vertically on small screens (<600px).
 */

import './ui.css';

import { BaseLayout, LayoutOptions } from './types';
import { ShaderProject, UniformValue } from '../project/types';
import type { UniformControls as UniformControlsType } from '../uniforms/UniformControls';

export class UILayout implements BaseLayout {
  private container: HTMLElement;
  private project: ShaderProject;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;
  private uiPanel: HTMLElement;

  // Uniform controls
  private uniformsContainer: HTMLElement;
  private uniformControls: UniformControlsType | null = null;

  // Playback controls
  private playbackContainer: HTMLElement;
  private playPauseButton: HTMLElement | null = null;

  // Callbacks (set by App)
  private onPlayPause: (() => void) | null = null;
  private onReset: (() => void) | null = null;
  private onScreenshot: (() => void) | null = null;
  private onUniformChange: ((name: string, value: UniformValue) => void) | null = null;
  private _disposed = false;

  constructor(opts: LayoutOptions) {
    this.container = opts.container;
    this.project = opts.project;

    // Create root layout container
    this.root = document.createElement('div');
    this.root.className = 'layout-ui';

    // Create canvas container (left side)
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'ui-canvas-container';

    // Create UI panel (right side)
    this.uiPanel = document.createElement('div');
    this.uiPanel.className = 'ui-panel';

    // Create uniforms container (scrollable, vertically centered)
    this.uniformsContainer = document.createElement('div');
    this.uniformsContainer.className = 'ui-uniforms-container';
    this.uiPanel.appendChild(this.uniformsContainer);

    // Create playback controls container (fixed at bottom)
    this.playbackContainer = document.createElement('div');
    this.playbackContainer.className = 'ui-playback-container';
    this.buildPlaybackControls();
    this.uiPanel.appendChild(this.playbackContainer);

    // Load uniform controls
    this.loadUniformControls();

    // Assemble and append to DOM
    this.root.appendChild(this.canvasContainer);
    this.root.appendChild(this.uiPanel);
    this.container.appendChild(this.root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  /**
   * Set callbacks for playback controls.
   * Called by App after initialization.
   */
  setPlaybackCallbacks(callbacks: {
    onPlayPause: () => void;
    onReset: () => void;
    onScreenshot: () => void;
  }): void {
    this.onPlayPause = callbacks.onPlayPause;
    this.onReset = callbacks.onReset;
    this.onScreenshot = callbacks.onScreenshot;
  }

  /**
   * Set callback for uniform changes.
   * Called by App after initialization.
   */
  setUniformCallback(callback: (name: string, value: UniformValue) => void): void {
    this.onUniformChange = callback;
  }

  /**
   * Update play/pause button state.
   */
  setPaused(paused: boolean): void {
    if (this.playPauseButton) {
      this.playPauseButton.innerHTML = paused
        ? `<svg viewBox="0 0 16 16"><path d="M4 3v10l8-5-8-5z"/></svg>`
        : `<svg viewBox="0 0 16 16"><path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/></svg>`;
      this.playPauseButton.title = paused ? 'Play' : 'Pause';
    }
  }

  dispose(): void {
    this._disposed = true;
    if (this.uniformControls) {
      this.uniformControls.destroy();
      this.uniformControls = null;
    }
    this.container.innerHTML = '';
  }

  /**
   * Build playback control buttons.
   */
  private buildPlaybackControls(): void {
    // Play/Pause button
    this.playPauseButton = document.createElement('button');
    this.playPauseButton.className = 'ui-control-button';
    this.playPauseButton.title = 'Pause';
    this.playPauseButton.innerHTML = `<svg viewBox="0 0 16 16"><path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/></svg>`;
    this.playPauseButton.addEventListener('click', () => {
      if (this.onPlayPause) this.onPlayPause();
    });

    // Reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'ui-control-button';
    resetButton.title = 'Reset';
    resetButton.innerHTML = `<svg viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>`;
    resetButton.addEventListener('click', () => {
      if (this.onReset) this.onReset();
    });

    // Screenshot button
    const screenshotButton = document.createElement('button');
    screenshotButton.className = 'ui-control-button';
    screenshotButton.title = 'Screenshot';
    screenshotButton.innerHTML = `<svg viewBox="0 0 16 16"><path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/></svg>`;
    screenshotButton.addEventListener('click', () => {
      if (this.onScreenshot) this.onScreenshot();
    });

    this.playbackContainer.appendChild(this.playPauseButton);
    this.playbackContainer.appendChild(resetButton);
    this.playbackContainer.appendChild(screenshotButton);
  }

  /**
   * Load uniform controls dynamically.
   */
  private async loadUniformControls(): Promise<void> {
    const uniforms = this.project.uniforms;

    // If no uniforms, show empty state
    if (!uniforms || Object.keys(uniforms).length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'ui-empty-state';
      emptyState.textContent = 'No uniforms';
      this.uniformsContainer.appendChild(emptyState);
      return;
    }

    try {
      const { UniformControls } = await import('../uniforms/UniformControls');
      if (this._disposed) return;
      this.uniformControls = new UniformControls({
        container: this.uniformsContainer,
        uniforms: uniforms,
        onChange: (name: string, value: UniformValue) => {
          if (this.onUniformChange) {
            this.onUniformChange(name, value);
          }
        },
      });
    } catch (err) {
      console.error('Failed to load uniform controls:', err);
      this.uniformsContainer.textContent = 'Failed to load controls';
    }
  }
}
