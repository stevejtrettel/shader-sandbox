/**
 * PlaybackControls - Collapsible button panel for playback actions
 *
 * DOM-only: creates buttons and wires them to callbacks.
 * Keyboard shortcuts stay in App.ts (document-level bindings).
 */

export interface PlaybackCallbacks {
  onTogglePlayPause: () => void;
  onReset: () => void;
  onScreenshot: () => void;
  onToggleRecording: () => void;
  onExportHTML: () => void;
  onRender: () => void;
}

export class PlaybackControls {
  private container: HTMLElement;
  private controlsContainer: HTMLElement;
  private controlsGrid: HTMLElement;
  private menuButton: HTMLElement;
  private playPauseButton: HTMLElement;
  private isMenuOpen: boolean = false;

  constructor(container: HTMLElement, callbacks: PlaybackCallbacks) {
    this.container = container;

    // Create container
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'playback-controls';

    // Create menu toggle button
    this.menuButton = document.createElement('button');
    this.menuButton.className = 'controls-menu-button';
    this.menuButton.title = 'Controls';
    this.menuButton.textContent = '+';
    this.menuButton.addEventListener('click', () => this.toggleMenu());

    // Create controls grid (hidden by default)
    this.controlsGrid = document.createElement('div');
    this.controlsGrid.className = 'controls-grid';

    // Play/Pause button (starts showing pause icon since we're playing)
    this.playPauseButton = document.createElement('button');
    this.playPauseButton.className = 'control-button';
    this.playPauseButton.title = 'Play/Pause (Space)';
    this.playPauseButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
      </svg>
    `;
    this.playPauseButton.addEventListener('click', () => callbacks.onTogglePlayPause());

    // Reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'control-button';
    resetButton.title = 'Reset (R)';
    resetButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
    `;
    resetButton.addEventListener('click', () => callbacks.onReset());

    // Screenshot button
    const screenshotButton = document.createElement('button');
    screenshotButton.className = 'control-button';
    screenshotButton.title = 'Screenshot (S)';
    screenshotButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
        <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
      </svg>
    `;
    screenshotButton.addEventListener('click', () => callbacks.onScreenshot());

    // Record button
    const recordButton = document.createElement('button');
    recordButton.className = 'control-button';
    recordButton.title = 'Record Video';
    recordButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5"/>
      </svg>
    `;
    recordButton.addEventListener('click', () => callbacks.onToggleRecording());

    // Export button
    const exportButton = document.createElement('button');
    exportButton.className = 'control-button';
    exportButton.title = 'Export HTML';
    exportButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
        <path d="M2 14.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
      </svg>
    `;
    exportButton.addEventListener('click', () => callbacks.onExportHTML());

    // Render button
    const renderButton = document.createElement('button');
    renderButton.className = 'control-button';
    renderButton.title = 'Render';
    renderButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/>
      </svg>
    `;
    renderButton.addEventListener('click', () => callbacks.onRender());

    // Menu button clone for inside grid (8th cell)
    const menuButtonInGrid = document.createElement('button');
    menuButtonInGrid.className = 'control-button';
    menuButtonInGrid.title = 'Close';
    menuButtonInGrid.textContent = '−';
    menuButtonInGrid.style.fontSize = '20px';
    menuButtonInGrid.style.fontWeight = '300';
    menuButtonInGrid.addEventListener('click', () => this.toggleMenu());

    // Add buttons to grid (positioned in 2x4 layout)
    // Row 1: Play/Pause, Reset, Export, Render
    // Row 2: Screenshot, Record, —, Menu (close)
    this.controlsGrid.appendChild(this.playPauseButton);
    this.controlsGrid.appendChild(resetButton);
    this.controlsGrid.appendChild(exportButton);
    this.controlsGrid.appendChild(renderButton);
    this.controlsGrid.appendChild(screenshotButton);
    this.controlsGrid.appendChild(recordButton);
    // Empty spacer for grid alignment
    const spacer = document.createElement('div');
    this.controlsGrid.appendChild(spacer);
    this.controlsGrid.appendChild(menuButtonInGrid);

    // Add grid and standalone menu button to container
    this.controlsContainer.appendChild(this.controlsGrid);
    this.controlsContainer.appendChild(this.menuButton);
    this.container.appendChild(this.controlsContainer);
  }

  /**
   * Update the play/pause button icon.
   */
  setPaused(paused: boolean): void {
    if (paused) {
      this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M4 3v10l8-5-8-5z"/>
        </svg>
      `;
    } else {
      this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
        </svg>
      `;
    }
  }

  /**
   * Clean up DOM.
   */
  dispose(): void {
    this.controlsContainer.remove();
  }

  private toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.menuButton.textContent = this.isMenuOpen ? '−' : '+';
    this.controlsGrid.classList.toggle('open', this.isMenuOpen);
    this.controlsContainer.classList.toggle('open', this.isMenuOpen);
  }
}
