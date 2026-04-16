/**
 * ScreenshotPanel - Full-featured screenshot capture panel
 *
 * Provides resolution presets, time scrubbing (with live preview for
 * non-buffer shaders), collapsible uniform controls, and high-res capture.
 */

import './screenshot-panel.css';

import { UniformControls } from '../uniforms/UniformControls';
import { UniformDefinitions, UniformValue, hasUIControl } from '../project/types';

// Resolution presets: [label, width, height]
const RESOLUTION_PRESETS: [string, number, number][] = [
  ['720p', 1280, 720],
  ['1080p', 1920, 1080],
  ['1440p', 2560, 1440],
  ['4K', 3840, 2160],
  ['8K', 7680, 4320],
];

export interface ScreenshotPanelCallbacks {
  /** Render a single frame at the given time and return without capturing.
   *  Used for live preview. Engine should render at current canvas size. */
  renderPreviewAtTime: (time: number) => void;

  /** Step the engine from frame 0 to the target time (for buffer shaders).
   *  Calls onProgress during stepping. Resolves when done. */
  renderPreviewStepped: (
    time: number,
    fps: number,
    onProgress: (frame: number, total: number) => void,
  ) => Promise<boolean>; // returns false if cancelled

  /** Capture a high-res screenshot at the given time.
   *  Resizes canvas, renders, captures PNG blob, restores canvas.
   *  Calls onProgress during buffer shader stepping. */
  captureScreenshot: (opts: {
    width: number;
    height: number;
    time: number;
    hasBuffers: boolean;
    onProgress: (frame: number, total: number) => void;
  }) => Promise<Blob | null>;

  /** Get current elapsed shader time. */
  getCurrentTime: () => number;

  /** Whether this shader has buffer passes (feedback). */
  hasBufferPasses: () => boolean;

  /** Set a uniform value (live). */
  setUniformValue: (name: string, value: UniformValue) => void;

  /** Pause the animation loop so preview renders aren't overwritten. */
  pause: () => void;

  /** Resume the animation loop when panel closes. */
  resume: () => void;
}

export class ScreenshotPanel {
  private backdrop: HTMLElement;
  private panel: HTMLElement;
  private callbacks: ScreenshotPanelCallbacks;
  private uniformControls: UniformControls | null = null;

  // Resolution
  private presetSelect: HTMLSelectElement;
  private widthInput: HTMLInputElement;
  private heightInput: HTMLInputElement;
  private aspectLocked: boolean = true;
  private aspectRatio: number; // w/h
  private lockButton: HTMLElement;

  // Time
  private timeInput: HTMLInputElement;
  private timeSlider: HTMLInputElement | null = null;
  private sliderMinInput: HTMLInputElement | null = null;
  private sliderMaxInput: HTMLInputElement | null = null;

  // State
  private hasBuffers: boolean;
  private currentTime: number;
  private canvasWidth: number;
  private canvasHeight: number;

  // Progress
  private captureBtn: HTMLElement;
  private progressEl: HTMLElement;
  private progressBar: HTMLElement;
  private progressText: HTMLElement;
  private isBusy: boolean = false;

  constructor(
    parentContainer: HTMLElement,
    canvasWidth: number,
    canvasHeight: number,
    uniforms: UniformDefinitions | undefined,
    callbacks: ScreenshotPanelCallbacks,
  ) {
    this.callbacks = callbacks;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.aspectRatio = canvasWidth / canvasHeight;
    this.hasBuffers = callbacks.hasBufferPasses();
    this.currentTime = callbacks.getCurrentTime();

    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'screenshot-panel-backdrop';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Panel
    this.panel = document.createElement('div');
    this.panel.className = 'screenshot-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'screenshot-panel-header';
    header.innerHTML = `
      <div class="screenshot-panel-title">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
          <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"/>
        </svg>
        Screenshot
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'screenshot-panel-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'screenshot-panel-body';

    // --- Resolution Section ---
    const resSection = this.createSection('Resolution');

    // Preset dropdown
    this.presetSelect = document.createElement('select');
    this.presetSelect.className = 'screenshot-input screenshot-select';
    const currentOpt = document.createElement('option');
    currentOpt.value = 'current';
    currentOpt.textContent = `Current (${canvasWidth}\u00d7${canvasHeight})`;
    this.presetSelect.appendChild(currentOpt);

    for (const [label, w, h] of RESOLUTION_PRESETS) {
      const opt = document.createElement('option');
      opt.value = `${w}x${h}`;
      opt.textContent = `${label} (${w}\u00d7${h})`;
      this.presetSelect.appendChild(opt);
    }

    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = 'Custom';
    this.presetSelect.appendChild(customOpt);

    this.presetSelect.addEventListener('change', () => this.onPresetChange());
    resSection.appendChild(this.presetSelect);

    // W x H row with aspect lock
    const resRow = document.createElement('div');
    resRow.className = 'screenshot-res-row';

    this.widthInput = this.createNumberInput(canvasWidth, 1, 7680);
    this.heightInput = this.createNumberInput(canvasHeight, 1, 4320);

    this.widthInput.addEventListener('input', () => {
      this.presetSelect.value = 'custom';
      if (this.aspectLocked) {
        const w = parseInt(this.widthInput.value) || 1;
        this.heightInput.value = String(Math.round(w / this.aspectRatio));
      }
    });
    this.heightInput.addEventListener('input', () => {
      this.presetSelect.value = 'custom';
      if (this.aspectLocked) {
        const h = parseInt(this.heightInput.value) || 1;
        this.widthInput.value = String(Math.round(h * this.aspectRatio));
      }
    });

    const xLabel = document.createElement('span');
    xLabel.className = 'screenshot-dim-separator';
    xLabel.textContent = '\u00d7';

    this.lockButton = document.createElement('button');
    this.lockButton.className = 'screenshot-aspect-lock active';
    this.lockButton.title = 'Lock aspect ratio';
    this.lockButton.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
      <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    </svg>`;
    this.lockButton.addEventListener('click', () => this.toggleAspectLock());

    resRow.appendChild(this.widthInput);
    resRow.appendChild(xLabel);
    resRow.appendChild(this.heightInput);
    resRow.appendChild(this.lockButton);
    resSection.appendChild(resRow);

    // --- Time Section ---
    const timeSection = this.createSection('Time');

    if (!this.hasBuffers) {
      // Slider + number input for non-buffer shaders
      const sliderWindow = 5; // seconds before/after current time
      const sliderMin = Math.max(0, this.currentTime - sliderWindow);
      const sliderMax = this.currentTime + sliderWindow;

      // Range inputs
      const rangeRow = document.createElement('div');
      rangeRow.className = 'screenshot-range-row';

      this.sliderMinInput = document.createElement('input');
      this.sliderMinInput.type = 'number';
      this.sliderMinInput.className = 'screenshot-input screenshot-range-input';
      this.sliderMinInput.value = sliderMin.toFixed(1);
      this.sliderMinInput.step = '0.1';
      this.sliderMinInput.min = '0';
      this.sliderMinInput.addEventListener('input', () => this.updateSliderRange());

      this.sliderMaxInput = document.createElement('input');
      this.sliderMaxInput.type = 'number';
      this.sliderMaxInput.className = 'screenshot-input screenshot-range-input';
      this.sliderMaxInput.value = sliderMax.toFixed(1);
      this.sliderMaxInput.step = '0.1';
      this.sliderMaxInput.min = '0';
      this.sliderMaxInput.addEventListener('input', () => this.updateSliderRange());

      const rangeTo = document.createElement('span');
      rangeTo.className = 'screenshot-dim-separator';
      rangeTo.textContent = 'to';

      const rangeUnit = document.createElement('span');
      rangeUnit.className = 'screenshot-unit';
      rangeUnit.textContent = 'sec';

      rangeRow.appendChild(this.sliderMinInput);
      rangeRow.appendChild(rangeTo);
      rangeRow.appendChild(this.sliderMaxInput);
      rangeRow.appendChild(rangeUnit);
      timeSection.appendChild(rangeRow);

      // Slider
      this.timeSlider = document.createElement('input');
      this.timeSlider.type = 'range';
      this.timeSlider.className = 'screenshot-time-slider';
      this.timeSlider.min = String(sliderMin);
      this.timeSlider.max = String(sliderMax);
      this.timeSlider.step = String(1 / 60); // frame-level precision
      this.timeSlider.value = String(this.currentTime);
      this.timeSlider.addEventListener('input', () => {
        const t = parseFloat(this.timeSlider!.value);
        this.timeInput.value = t.toFixed(3);
        this.callbacks.renderPreviewAtTime(t);
      });
      timeSection.appendChild(this.timeSlider);
    }

    // Number input (always present)
    const timeRow = document.createElement('div');
    timeRow.className = 'screenshot-time-row';

    this.timeInput = document.createElement('input');
    this.timeInput.type = 'number';
    this.timeInput.className = 'screenshot-input';
    this.timeInput.value = this.currentTime.toFixed(3);
    this.timeInput.step = String(1 / 60);
    this.timeInput.min = '0';

    if (!this.hasBuffers) {
      this.timeInput.addEventListener('input', () => {
        const t = parseFloat(this.timeInput.value) || 0;
        if (this.timeSlider) this.timeSlider.value = String(t);
        this.callbacks.renderPreviewAtTime(t);
      });
    }

    const timeUnit = document.createElement('span');
    timeUnit.className = 'screenshot-unit';
    timeUnit.textContent = 'sec';

    timeRow.appendChild(this.timeInput);
    timeRow.appendChild(timeUnit);

    if (this.hasBuffers) {
      const previewBtn = document.createElement('button');
      previewBtn.className = 'screenshot-btn screenshot-btn-secondary';
      previewBtn.textContent = 'Render Preview';
      previewBtn.addEventListener('click', () => this.renderBufferPreview());
      timeRow.appendChild(previewBtn);
    }

    timeSection.appendChild(timeRow);

    if (this.hasBuffers) {
      const notice = document.createElement('div');
      notice.className = 'screenshot-notice';
      notice.textContent = 'This shader has feedback buffers. Preview requires computing all frames from the start.';
      timeSection.appendChild(notice);
    }

    // --- Uniforms Section (collapsible) ---
    let uniformsSection: HTMLElement | null = null;
    if (uniforms && Object.values(uniforms).some(def => hasUIControl(def))) {
      uniformsSection = this.createCollapsibleSection('Uniforms');
      const uniformsContent = uniformsSection.querySelector('.screenshot-section-content')!;

      this.uniformControls = new UniformControls({
        container: uniformsContent as HTMLElement,
        uniforms,
        onChange: (name, value) => {
          callbacks.setUniformValue(name, value);
          // Update preview for non-buffer shaders
          if (!this.hasBuffers) {
            const t = parseFloat(this.timeInput.value) || 0;
            this.callbacks.renderPreviewAtTime(t);
          }
        },
      });
    }

    // --- Progress ---
    this.progressEl = document.createElement('div');
    this.progressEl.className = 'screenshot-progress';
    this.progressEl.innerHTML = `
      <div class="screenshot-progress-bar-bg"><div class="screenshot-progress-bar"></div></div>
      <div class="screenshot-progress-text">Preparing...</div>
    `;
    this.progressBar = this.progressEl.querySelector('.screenshot-progress-bar')!;
    this.progressText = this.progressEl.querySelector('.screenshot-progress-text')!;

    // --- Actions ---
    const actions = document.createElement('div');
    actions.className = 'screenshot-panel-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'screenshot-btn screenshot-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());

    this.captureBtn = document.createElement('button');
    this.captureBtn.className = 'screenshot-btn screenshot-btn-primary';
    this.captureBtn.textContent = 'Capture';
    this.captureBtn.addEventListener('click', () => this.capture());

    actions.appendChild(cancelBtn);
    actions.appendChild(this.captureBtn);

    // Assemble
    body.appendChild(resSection);
    body.appendChild(timeSection);
    if (uniformsSection) body.appendChild(uniformsSection);
    body.appendChild(this.progressEl);

    this.panel.appendChild(header);
    this.panel.appendChild(body);
    this.panel.appendChild(actions);
    this.backdrop.appendChild(this.panel);

    parentContainer.appendChild(this.backdrop);

    // Pause animation loop so our preview renders persist on the canvas
    this.callbacks.pause();

    // Render initial preview at current time
    if (!this.hasBuffers) {
      this.callbacks.renderPreviewAtTime(this.currentTime);
    }
  }

  close(): void {
    this.uniformControls?.destroy();
    this.backdrop.remove();
    // Resume animation loop
    this.callbacks.resume();
  }

  // ===========================================================================
  // Resolution
  // ===========================================================================

  private onPresetChange(): void {
    const val = this.presetSelect.value;
    if (val === 'current') {
      this.widthInput.value = String(this.canvasWidth);
      this.heightInput.value = String(this.canvasHeight);
      this.aspectRatio = this.canvasWidth / this.canvasHeight;
    } else if (val !== 'custom') {
      const [w, h] = val.split('x').map(Number);
      this.widthInput.value = String(w);
      this.heightInput.value = String(h);
      this.aspectRatio = w / h;
    }
  }

  private toggleAspectLock(): void {
    this.aspectLocked = !this.aspectLocked;
    this.lockButton.classList.toggle('active', this.aspectLocked);
    if (this.aspectLocked) {
      const w = parseInt(this.widthInput.value) || 1;
      const h = parseInt(this.heightInput.value) || 1;
      this.aspectRatio = w / h;
    }
  }

  // ===========================================================================
  // Time
  // ===========================================================================

  private updateSliderRange(): void {
    if (!this.timeSlider || !this.sliderMinInput || !this.sliderMaxInput) return;
    const min = parseFloat(this.sliderMinInput.value) || 0;
    const max = parseFloat(this.sliderMaxInput.value) || 10;
    this.timeSlider.min = String(Math.max(0, min));
    this.timeSlider.max = String(max);
  }

  private async renderBufferPreview(): Promise<void> {
    if (this.isBusy) return;
    this.isBusy = true;

    const time = parseFloat(this.timeInput.value) || 0;
    this.showProgress('Rendering preview...');

    const completed = await this.callbacks.renderPreviewStepped(
      time, 60,
      (frame, total) => {
        const pct = (frame / total) * 100;
        this.progressBar.style.width = `${pct}%`;
        this.progressText.textContent = `Frame ${frame} / ${total} (${Math.round(pct)}%)`;
      },
    );

    this.hideProgress();
    this.isBusy = false;

    if (completed) {
      this.progressText.textContent = 'Preview ready';
    }
  }

  // ===========================================================================
  // Capture
  // ===========================================================================

  private async capture(): Promise<void> {
    if (this.isBusy) return;
    this.isBusy = true;

    const width = parseInt(this.widthInput.value) || this.canvasWidth;
    const height = parseInt(this.heightInput.value) || this.canvasHeight;
    const time = parseFloat(this.timeInput.value) || 0;

    this.showProgress('Capturing...');
    this.captureBtn.classList.add('disabled');

    try {
      const blob = await this.callbacks.captureScreenshot({
        width,
        height,
        time,
        hasBuffers: this.hasBuffers,
        onProgress: (frame, total) => {
          const pct = (frame / total) * 100;
          this.progressBar.style.width = `${pct}%`;
          this.progressText.textContent = `Frame ${frame} / ${total} (${Math.round(pct)}%)`;
        },
      });

      if (blob) {
        this.downloadBlob(blob, width, height);
        this.progressText.textContent = 'Saved!';
        setTimeout(() => this.close(), 1000);
      }
    } catch (e) {
      this.progressText.textContent = `Error: ${(e as Error).message}`;
      this.progressBar.style.background = '#c62828';
    } finally {
      this.captureBtn.classList.remove('disabled');
      this.isBusy = false;
    }
  }

  private downloadBlob(blob: Blob, width: number, height: number): void {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') + '-' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const filename = `screenshot_${width}x${height}_${timestamp}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ===========================================================================
  // Progress
  // ===========================================================================

  private showProgress(text: string): void {
    this.progressEl.classList.add('active');
    this.progressBar.style.width = '0%';
    this.progressBar.style.background = '';
    this.progressText.textContent = text;
  }

  private hideProgress(): void {
    this.progressEl.classList.remove('active');
  }

  // ===========================================================================
  // DOM Helpers
  // ===========================================================================

  private createSection(label: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'screenshot-section';
    const lbl = document.createElement('div');
    lbl.className = 'screenshot-section-label';
    lbl.textContent = label;
    section.appendChild(lbl);
    return section;
  }

  private createCollapsibleSection(label: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'screenshot-section screenshot-collapsible collapsed';

    const header = document.createElement('div');
    header.className = 'screenshot-collapsible-header';
    header.innerHTML = `<span class="screenshot-collapsible-arrow">&#9654;</span> ${label}`;
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    const content = document.createElement('div');
    content.className = 'screenshot-section-content';

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  private createNumberInput(defaultVal: number, min: number, max: number): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'screenshot-input';
    input.value = String(Math.round(defaultVal));
    input.min = String(min);
    input.max = String(max);
    return input;
  }
}
