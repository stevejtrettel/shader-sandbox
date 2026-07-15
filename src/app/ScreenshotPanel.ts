/**
 * ScreenshotPanel - Full-featured screenshot capture panel
 *
 * Provides resolution presets, time scrubbing (with live preview for
 * non-buffer shaders), collapsible uniform controls, and high-res capture.
 */

import './screenshot-panel.css';

import { UniformControls } from '../uniforms/UniformControls';
import { UniformDefinitions, UniformValue, hasUIControl } from '../project/types';
import { timestampString, downloadBlob } from './dom';
import {
  createPanelShell,
  createSection,
  createCollapsibleSection,
  createResolutionSection,
  createProgressBar,
  ProgressBar,
} from './panel-kit';

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
  private callbacks: ScreenshotPanelCallbacks;
  private uniformControls: UniformControls | null = null;

  // Resolution
  private widthInput: HTMLInputElement;
  private heightInput: HTMLInputElement;
  private supersampleCheckbox: HTMLInputElement;

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
  private progress: ProgressBar;
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
    this.hasBuffers = callbacks.hasBufferPasses();
    this.currentTime = callbacks.getCurrentTime();

    const shell = createPanelShell({
      prefix: 'screenshot',
      titleHTML: `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
          <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"/>
        </svg>
        Screenshot`,
      onClose: () => this.close(),
      onBackdropClick: () => this.close(),
    });
    this.backdrop = shell.backdrop;

    // Body
    const body = document.createElement('div');
    body.className = 'screenshot-panel-body';

    // --- Resolution Section ---
    const res = createResolutionSection({
      prefix: 'screenshot',
      canvasWidth,
      canvasHeight,
    });
    const resSection = res.section;
    this.widthInput = res.widthInput;
    this.heightInput = res.heightInput;

    // Supersample: render at 2x, downscale — print-quality antialiasing
    const ssRow = document.createElement('label');
    ssRow.className = 'screenshot-supersample';
    this.supersampleCheckbox = document.createElement('input');
    this.supersampleCheckbox.type = 'checkbox';
    const ssText = document.createElement('span');
    ssText.textContent = '2× supersample (smoother edges)';
    ssRow.appendChild(this.supersampleCheckbox);
    ssRow.appendChild(ssText);
    resSection.appendChild(ssRow);

    // --- Time Section ---
    const timeSection = createSection('screenshot', 'Time');

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
      uniformsSection = createCollapsibleSection('screenshot', 'Uniforms');
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
    this.progress = createProgressBar('screenshot');

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
    body.appendChild(this.progress.el);

    shell.panel.appendChild(body);
    shell.panel.appendChild(actions);

    parentContainer.appendChild(this.backdrop);

    // Pause animation loop so our preview renders persist on the canvas
    this.callbacks.pause();

    // Render initial preview at current time
    if (!this.hasBuffers) {
      this.callbacks.renderPreviewAtTime(this.currentTime);
    }
  }

  close(): void {
    this.uniformControls?.dispose();
    this.backdrop.remove();
    // Resume animation loop
    this.callbacks.resume();
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
    this.progress.show('Rendering preview...');

    await this.callbacks.renderPreviewStepped(
      time, 60,
      (frame, total) => this.progress.update(frame, total),
    );

    this.progress.hide();
    this.isBusy = false;
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

    this.progress.show('Capturing...');
    this.captureBtn.classList.add('disabled');

    // Supersample: render 2x, then downscale for high-quality antialiasing
    const scale = this.supersampleCheckbox.checked ? 2 : 1;

    try {
      let blob = await this.callbacks.captureScreenshot({
        width: width * scale,
        height: height * scale,
        time,
        hasBuffers: this.hasBuffers,
        onProgress: (frame, total) => this.progress.update(frame, total),
      });

      if (blob && scale > 1) {
        this.progress.text.textContent = 'Downscaling…';
        blob = await downscaleBlob(blob, width, height);
      }

      if (blob) {
        this.downloadBlob(blob, width, height);
        this.progress.text.textContent = 'Saved!';
        setTimeout(() => this.close(), 1000);
      }
    } catch (e) {
      this.progress.fail(`Error: ${(e as Error).message}`);
    } finally {
      this.captureBtn.classList.remove('disabled');
      this.isBusy = false;
    }
  }

  private downloadBlob(blob: Blob, width: number, height: number): void {
    downloadBlob(blob, `screenshot_${width}x${height}_${timestampString()}.png`);
  }
}

/** High-quality downscale of a PNG blob to the target size. */
async function downscaleBlob(blob: Blob, width: number, height: number): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Downscale failed')), 'image/png');
  });
}
