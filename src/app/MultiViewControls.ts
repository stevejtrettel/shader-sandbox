/**
 * MultiViewControls - Shared controls panel for multi-view projects
 *
 * A floating panel in the upper-right corner of the wrapper that provides:
 * - Play/Pause toggle
 * - Reset button
 * - Screenshot button
 * - Uniform sliders (if any defined)
 *
 * Decoupled from App — uses callbacks for all interactions.
 */

import './multi-view-controls.css';

import { UniformDefinitions, UniformValue, hasUIControl } from '../project/types';
import { UniformControls } from '../uniforms/UniformControls';

export interface MultiViewControlsOptions {
  /** Wrapper element to attach controls to */
  wrapper: HTMLElement;
  /** Toggle play/pause callback */
  onTogglePlayPause: () => void;
  /** Reset callback */
  onReset: () => void;
  /** Get current paused state */
  getPaused: () => boolean;
  /** Set uniform value callback (optional) */
  onSetUniformValue?: (name: string, value: UniformValue) => void;
  /** Uniform definitions (optional) */
  uniforms?: UniformDefinitions;
}

export class MultiViewControls {
  private wrapper: HTMLElement;
  private opts: MultiViewControlsOptions;

  private controlsWrapper: HTMLElement;
  private toggleButton: HTMLElement;
  private panel: HTMLElement | null = null;
  private controls: UniformControls | null = null;
  private isOpen: boolean = false;
  private isPaused: boolean = false;

  constructor(opts: MultiViewControlsOptions) {
    this.wrapper = opts.wrapper;
    this.opts = opts;
    this.isPaused = opts.getPaused();

    // Create controls wrapper (positioned in upper-right of wrapper)
    this.controlsWrapper = document.createElement('div');
    this.controlsWrapper.className = 'multi-view-controls-wrapper';

    // Create toggle button (sliders icon - same as single-view UniformsPanel)
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'multi-view-controls-toggle';
    this.toggleButton.title = 'Toggle Controls';
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
    this.controlsWrapper.appendChild(this.toggleButton);

    // Create panel (initially hidden)
    this.createPanel(opts.uniforms);

    // Append to wrapper
    this.wrapper.appendChild(this.controlsWrapper);
  }

  private createPanel(uniforms?: UniformDefinitions): void {
    this.panel = document.createElement('div');
    this.panel.className = 'multi-view-controls-panel';

    // Header with close button (same as UniformsPanel)
    const header = document.createElement('div');
    header.className = 'multi-view-controls-header';

    const title = document.createElement('span');
    title.textContent = 'Controls';
    header.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.className = 'multi-view-controls-close';
    closeButton.innerHTML = '&times;';
    closeButton.title = 'Close';
    closeButton.addEventListener('click', () => this.toggle());
    header.appendChild(closeButton);

    this.panel.appendChild(header);

    // Playback controls section
    const playbackSection = document.createElement('div');
    playbackSection.className = 'controls-section playback-controls';

    // Play/Pause button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'control-btn play-pause-btn';
    playPauseBtn.title = 'Play/Pause';
    this.updatePlayPauseIcon(playPauseBtn);
    playPauseBtn.addEventListener('click', () => {
      this.opts.onTogglePlayPause();
      this.isPaused = this.opts.getPaused();
      this.updatePlayPauseIcon(playPauseBtn);
    });
    playbackSection.appendChild(playPauseBtn);

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'control-btn reset-btn';
    resetBtn.title = 'Reset';
    resetBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
    `;
    resetBtn.addEventListener('click', () => {
      this.opts.onReset();
    });
    playbackSection.appendChild(resetBtn);

    this.panel.appendChild(playbackSection);

    // Uniforms section (if any)
    if (uniforms && Object.values(uniforms).some(def => hasUIControl(def))) {
      const uniformsSection = document.createElement('div');
      uniformsSection.className = 'controls-section uniforms-section';

      const uniformsLabel = document.createElement('div');
      uniformsLabel.className = 'section-label';
      uniformsLabel.textContent = 'Uniforms';
      uniformsSection.appendChild(uniformsLabel);

      const uniformsContainer = document.createElement('div');
      uniformsContainer.className = 'uniforms-container';

      this.controls = new UniformControls({
        container: uniformsContainer,
        uniforms,
        onChange: (name, value) => {
          this.opts.onSetUniformValue?.(name, value);
        },
      });

      uniformsSection.appendChild(uniformsContainer);
      this.panel.appendChild(uniformsSection);
    }

    // Start closed
    this.panel.classList.add('closed');

    this.controlsWrapper.appendChild(this.panel);
  }

  private updatePlayPauseIcon(btn: HTMLElement): void {
    if (this.isPaused) {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
    } else {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
    }
  }

  private toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.panel?.classList.remove('closed');
      this.toggleButton.classList.add('hidden');
    } else {
      this.panel?.classList.add('closed');
      this.toggleButton.classList.remove('hidden');
    }
  }

  dispose(): void {
    this.controls?.destroy();
    this.wrapper.removeChild(this.controlsWrapper);
  }
}
