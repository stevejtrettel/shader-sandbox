/**
 * RenderDialog - Modal overlay for configuring deterministic renders
 *
 * Provides resolution, FPS, duration, and format controls.
 * Shows a progress bar during rendering with a cancel button.
 * Delegates actual rendering to App via a callback.
 */

import './render-dialog.css';

export interface RenderRequest {
  width: number;
  height: number;
  fps: number;
  duration: number;
  format: 'frames' | 'video';
  onProgress: (frame: number, totalFrames: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export class RenderDialog {
  private backdrop: HTMLElement;
  private cancelRenderFn: (() => void) | null = null;

  // Form elements
  private widthInput: HTMLInputElement;
  private heightInput: HTMLInputElement;
  private fpsInput: HTMLInputElement;
  private durationInput: HTMLInputElement;
  private formatFrames: HTMLInputElement;
  private formatVideo: HTMLInputElement;
  private estimateEl: HTMLElement;

  // Progress elements
  private bodyEl: HTMLElement;
  private actionsEl: HTMLElement;
  private progressEl: HTMLElement;
  private progressBar: HTMLElement;
  private progressText: HTMLElement;

  constructor(
    private parentContainer: HTMLElement,
    private canvasWidth: number,
    private canvasHeight: number,
    private onStartRender: (req: RenderRequest) => (() => void),
  ) {
    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'render-dialog-backdrop';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Dialog
    const dialog = document.createElement('div');
    dialog.className = 'render-dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'render-dialog-header';
    header.innerHTML = `
      <div class="render-dialog-title">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
          <path d="M2 14.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
        </svg>
        Render
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'render-dialog-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    // Body (form fields)
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'render-dialog-body';

    // Resolution
    const resField = this.createField('Resolution');
    const resRow = document.createElement('div');
    resRow.className = 'render-field-row';
    this.widthInput = this.createNumberInput(canvasWidth, 1, 7680);
    this.heightInput = this.createNumberInput(canvasHeight, 1, 4320);
    const x = document.createElement('span');
    x.textContent = '\u00d7';
    resRow.appendChild(this.widthInput);
    resRow.appendChild(x);
    resRow.appendChild(this.heightInput);
    resField.appendChild(resRow);

    // FPS
    const fpsField = this.createField('FPS');
    this.fpsInput = this.createNumberInput(60, 1, 120);
    fpsField.appendChild(this.fpsInput);

    // Duration
    const durField = this.createField('Duration (seconds)');
    this.durationInput = this.createNumberInput(10, 1, 3600);
    durField.appendChild(this.durationInput);

    // Format
    const fmtField = this.createField('Format');
    const fmtGroup = document.createElement('div');
    fmtGroup.className = 'render-format-group';

    this.formatFrames = document.createElement('input');
    this.formatFrames.type = 'radio';
    this.formatFrames.name = 'render-format';
    this.formatFrames.id = 'render-fmt-frames';
    this.formatFrames.value = 'frames';

    this.formatVideo = document.createElement('input');
    this.formatVideo.type = 'radio';
    this.formatVideo.name = 'render-format';
    this.formatVideo.id = 'render-fmt-video';
    this.formatVideo.value = 'video';
    this.formatVideo.checked = true;

    const framesOpt = document.createElement('div');
    framesOpt.className = 'render-format-option';
    const framesLabel = document.createElement('label');
    framesLabel.htmlFor = 'render-fmt-frames';
    framesLabel.textContent = 'PNG Frames';
    framesOpt.appendChild(this.formatFrames);
    framesOpt.appendChild(framesLabel);

    const videoOpt = document.createElement('div');
    videoOpt.className = 'render-format-option';
    const videoLabel = document.createElement('label');
    videoLabel.htmlFor = 'render-fmt-video';
    videoLabel.textContent = 'Video (WebM)';
    videoOpt.appendChild(this.formatVideo);
    videoOpt.appendChild(videoLabel);

    fmtGroup.appendChild(videoOpt);
    fmtGroup.appendChild(framesOpt);
    fmtField.appendChild(fmtGroup);

    // Estimate
    this.estimateEl = document.createElement('div');
    this.estimateEl.className = 'render-estimate';

    this.bodyEl.appendChild(resField);
    this.bodyEl.appendChild(fpsField);
    this.bodyEl.appendChild(durField);
    this.bodyEl.appendChild(fmtField);
    this.bodyEl.appendChild(this.estimateEl);

    // Actions
    this.actionsEl = document.createElement('div');
    this.actionsEl.className = 'render-dialog-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'render-btn render-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());

    const startBtn = document.createElement('button');
    startBtn.className = 'render-btn render-btn-primary';
    startBtn.textContent = 'Start Render';
    startBtn.addEventListener('click', () => this.startRender());

    this.actionsEl.appendChild(cancelBtn);
    this.actionsEl.appendChild(startBtn);

    // Progress (hidden initially)
    this.progressEl = document.createElement('div');
    this.progressEl.className = 'render-progress';
    this.progressEl.innerHTML = `
      <div class="render-progress-bar-bg"><div class="render-progress-bar"></div></div>
      <div class="render-progress-text">Preparing...</div>
    `;
    this.progressBar = this.progressEl.querySelector('.render-progress-bar')!;
    this.progressText = this.progressEl.querySelector('.render-progress-text')!;

    const cancelRenderBtn = document.createElement('button');
    cancelRenderBtn.className = 'render-btn render-btn-cancel';
    cancelRenderBtn.textContent = 'Cancel Render';
    cancelRenderBtn.style.marginTop = '4px';
    cancelRenderBtn.addEventListener('click', () => this.cancelRender());
    this.progressEl.appendChild(cancelRenderBtn);

    // Assemble
    dialog.appendChild(header);
    dialog.appendChild(this.bodyEl);
    dialog.appendChild(this.actionsEl);
    dialog.appendChild(this.progressEl);
    this.backdrop.appendChild(dialog);

    // Update estimate on any input change
    const update = () => this.updateEstimate();
    this.widthInput.addEventListener('input', update);
    this.heightInput.addEventListener('input', update);
    this.fpsInput.addEventListener('input', update);
    this.durationInput.addEventListener('input', update);
    this.formatFrames.addEventListener('change', update);
    this.formatVideo.addEventListener('change', update);
    this.updateEstimate();
  }

  open(): void {
    this.parentContainer.appendChild(this.backdrop);
  }

  close(): void {
    this.cancelRenderFn?.();
    this.cancelRenderFn = null;
    this.backdrop.remove();
  }

  private createField(label: string): HTMLElement {
    const field = document.createElement('div');
    field.className = 'render-field';
    const lbl = document.createElement('div');
    lbl.className = 'render-field-label';
    lbl.textContent = label;
    field.appendChild(lbl);
    return field;
  }

  private createNumberInput(defaultVal: number, min: number, max: number): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'render-input';
    input.value = String(Math.round(defaultVal));
    input.min = String(min);
    input.max = String(max);
    return input;
  }

  private updateEstimate(): void {
    const w = parseInt(this.widthInput.value) || 0;
    const h = parseInt(this.heightInput.value) || 0;
    const fps = parseInt(this.fpsInput.value) || 0;
    const dur = parseFloat(this.durationInput.value) || 0;
    const totalFrames = Math.ceil(fps * dur);

    if (this.formatFrames.checked) {
      const mbPerFrame = (w * h * 4) / (1024 * 1024);
      const totalMB = mbPerFrame * totalFrames;
      this.estimateEl.textContent = `${totalFrames} frames, ~${totalMB < 1024 ? Math.round(totalMB) + ' MB' : (totalMB / 1024).toFixed(1) + ' GB'} raw`;
    } else {
      this.estimateEl.textContent = `${totalFrames} frames, ${dur}s at ${fps} fps`;
    }
  }

  private startRender(): void {
    const width = parseInt(this.widthInput.value) || this.canvasWidth;
    const height = parseInt(this.heightInput.value) || this.canvasHeight;
    const fps = parseInt(this.fpsInput.value) || 60;
    const duration = parseFloat(this.durationInput.value) || 10;
    const format: 'frames' | 'video' = this.formatFrames.checked ? 'frames' : 'video';

    // Switch to progress view
    this.bodyEl.style.display = 'none';
    this.actionsEl.style.display = 'none';
    this.progressEl.classList.add('active');
    this.progressBar.style.width = '0%';
    this.progressText.textContent = 'Preparing...';

    this.cancelRenderFn = this.onStartRender({
      width,
      height,
      fps,
      duration,
      format,
      onProgress: (frame, total) => {
        const pct = (frame / total) * 100;
        this.progressBar.style.width = `${pct}%`;
        this.progressText.textContent = `Frame ${frame} / ${total} (${Math.round(pct)}%)`;
      },
      onComplete: () => {
        this.progressText.textContent = 'Done!';
        this.progressBar.style.width = '100%';
        setTimeout(() => this.close(), 1500);
      },
      onError: (error) => {
        this.progressText.textContent = `Error: ${error.message}`;
        this.progressBar.style.background = '#c62828';
      },
    });
  }

  private cancelRender(): void {
    this.cancelRenderFn?.();
    this.cancelRenderFn = null;
    // Reset to form view
    this.bodyEl.style.display = '';
    this.actionsEl.style.display = '';
    this.progressEl.classList.remove('active');
  }
}
