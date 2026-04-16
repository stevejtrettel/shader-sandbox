/**
 * RecordingPanel - Full-featured video/frame sequence recording panel
 *
 * Provides resolution presets, timing controls (start time, duration, FPS),
 * format selection (MP4/WebM/PNG frames), quality settings,
 * collapsible uniform controls, and progress tracking.
 */

import './recording-panel.css';

import { UniformControls } from '../uniforms/UniformControls';
import { UniformDefinitions, UniformValue, hasUIControl } from '../project/types';
import { isMP4Supported } from './Mp4Encoder';

// Resolution presets: [label, width, height]
const RESOLUTION_PRESETS: [string, number, number][] = [
  ['720p', 1280, 720],
  ['1080p', 1920, 1080],
  ['1440p', 2560, 1440],
  ['4K', 3840, 2160],
  ['8K', 7680, 4320],
];

export type RecordingFormat = 'mp4' | 'webm' | 'frames';
export type RecordingQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface RecordingRequest {
  width: number;
  height: number;
  fps: number;
  startTime: number;
  duration: number;
  format: RecordingFormat;
  quality: RecordingQuality;
  onProgress: (phase: string, frame: number, totalFrames: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface RecordingPanelCallbacks {
  /** Start an offline render. Returns a cancel function. */
  startRecording: (req: RecordingRequest) => () => void;

  /** Whether this shader has buffer passes (feedback). */
  hasBufferPasses: () => boolean;

  /** Set a uniform value (live). */
  setUniformValue: (name: string, value: UniformValue) => void;
}

export class RecordingPanel {
  private backdrop: HTMLElement;
  private panel: HTMLElement;
  private callbacks: RecordingPanelCallbacks;
  private uniformControls: UniformControls | null = null;
  private cancelRenderFn: (() => void) | null = null;

  // Resolution
  private presetSelect: HTMLSelectElement;
  private widthInput: HTMLInputElement;
  private heightInput: HTMLInputElement;
  private aspectLocked: boolean = true;
  private aspectRatio: number;
  private lockButton: HTMLElement;

  // Timing
  private startTimeInput: HTMLInputElement;
  private durationInput: HTMLInputElement;
  private fpsInput: HTMLInputElement;
  private estimateEl: HTMLElement;

  // Format
  private formatMp4: HTMLInputElement;
  private formatWebm: HTMLInputElement;
  private formatFrames: HTMLInputElement;
  private mp4Label: HTMLLabelElement;
  private qualityGroup: HTMLElement;
  private qualitySelect: HTMLSelectElement;

  // State
  private hasBuffers: boolean;
  private canvasWidth: number;
  private canvasHeight: number;

  // Progress/actions
  private bodyEl: HTMLElement;
  private actionsEl: HTMLElement;
  private progressEl: HTMLElement;
  private progressBar: HTMLElement;
  private progressText: HTMLElement;
  private warmupNotice: HTMLElement | null = null;

  constructor(
    parentContainer: HTMLElement,
    canvasWidth: number,
    canvasHeight: number,
    uniforms: UniformDefinitions | undefined,
    callbacks: RecordingPanelCallbacks,
  ) {
    this.callbacks = callbacks;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.aspectRatio = canvasWidth / canvasHeight;
    this.hasBuffers = callbacks.hasBufferPasses();

    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'recording-panel-backdrop';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Panel
    this.panel = document.createElement('div');
    this.panel.className = 'recording-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'recording-panel-header';
    header.innerHTML = `
      <div class="recording-panel-title">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/>
        </svg>
        Record
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'recording-panel-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    // Body
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'recording-panel-body';

    // --- Resolution Section ---
    const resSection = this.createSection('Resolution');

    this.presetSelect = document.createElement('select');
    this.presetSelect.className = 'recording-input recording-select';
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

    // W x H row
    const resRow = document.createElement('div');
    resRow.className = 'recording-res-row';

    this.widthInput = this.createNumberInput(canvasWidth, 1, 7680);
    this.heightInput = this.createNumberInput(canvasHeight, 1, 4320);

    this.widthInput.addEventListener('input', () => {
      this.presetSelect.value = 'custom';
      if (this.aspectLocked) {
        const w = parseInt(this.widthInput.value) || 1;
        this.heightInput.value = String(Math.round(w / this.aspectRatio));
      }
      this.updateEstimate();
    });
    this.heightInput.addEventListener('input', () => {
      this.presetSelect.value = 'custom';
      if (this.aspectLocked) {
        const h = parseInt(this.heightInput.value) || 1;
        this.widthInput.value = String(Math.round(h * this.aspectRatio));
      }
      this.updateEstimate();
    });

    const xLabel = document.createElement('span');
    xLabel.className = 'recording-dim-separator';
    xLabel.textContent = '\u00d7';

    this.lockButton = document.createElement('button');
    this.lockButton.className = 'recording-aspect-lock active';
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

    // --- Timing Section ---
    const timingSection = this.createSection('Timing');

    // Start Time
    const startRow = this.createFieldRow('Start Time');
    this.startTimeInput = this.createNumberInput(0, 0, 3600);
    this.startTimeInput.step = '0.1';
    this.startTimeInput.addEventListener('input', () => {
      this.updateEstimate();
      this.updateWarmupNotice();
    });
    const startUnit = document.createElement('span');
    startUnit.className = 'recording-unit';
    startUnit.textContent = 'sec';
    startRow.appendChild(this.startTimeInput);
    startRow.appendChild(startUnit);
    timingSection.appendChild(startRow);

    // Duration
    const durRow = this.createFieldRow('Duration');
    this.durationInput = this.createNumberInput(10, 0.1, 3600);
    this.durationInput.step = '0.1';
    this.durationInput.addEventListener('input', () => this.updateEstimate());
    const durUnit = document.createElement('span');
    durUnit.className = 'recording-unit';
    durUnit.textContent = 'sec';
    durRow.appendChild(this.durationInput);
    durRow.appendChild(durUnit);
    timingSection.appendChild(durRow);

    // FPS
    const fpsRow = this.createFieldRow('FPS');
    this.fpsInput = this.createNumberInput(60, 1, 120);
    this.fpsInput.addEventListener('input', () => this.updateEstimate());
    fpsRow.appendChild(this.fpsInput);
    timingSection.appendChild(fpsRow);

    // Warm-up notice (buffer shaders)
    if (this.hasBuffers) {
      this.warmupNotice = document.createElement('div');
      this.warmupNotice.className = 'recording-notice';
      this.warmupNotice.style.display = 'none';
      timingSection.appendChild(this.warmupNotice);
    }

    // Estimate
    this.estimateEl = document.createElement('div');
    this.estimateEl.className = 'recording-estimate';
    timingSection.appendChild(this.estimateEl);

    // --- Format Section ---
    const formatSection = this.createSection('Format');

    const formatGroup = document.createElement('div');
    formatGroup.className = 'recording-format-group';

    // MP4
    const mp4Opt = document.createElement('div');
    mp4Opt.className = 'recording-format-option';
    this.formatMp4 = document.createElement('input');
    this.formatMp4.type = 'radio';
    this.formatMp4.name = 'recording-format';
    this.formatMp4.id = 'rec-fmt-mp4';
    this.formatMp4.value = 'mp4';
    this.formatMp4.checked = isMP4Supported();
    this.formatMp4.disabled = !isMP4Supported();
    this.mp4Label = document.createElement('label');
    this.mp4Label.htmlFor = 'rec-fmt-mp4';
    this.mp4Label.textContent = isMP4Supported() ? 'MP4' : 'MP4 (unsupported)';
    if (!isMP4Supported()) this.mp4Label.classList.add('disabled');
    mp4Opt.appendChild(this.formatMp4);
    mp4Opt.appendChild(this.mp4Label);
    this.formatMp4.addEventListener('change', () => this.onFormatChange());

    // WebM
    const webmOpt = document.createElement('div');
    webmOpt.className = 'recording-format-option';
    this.formatWebm = document.createElement('input');
    this.formatWebm.type = 'radio';
    this.formatWebm.name = 'recording-format';
    this.formatWebm.id = 'rec-fmt-webm';
    this.formatWebm.value = 'webm';
    this.formatWebm.checked = !isMP4Supported();
    const webmLabel = document.createElement('label');
    webmLabel.htmlFor = 'rec-fmt-webm';
    webmLabel.textContent = 'WebM';
    webmOpt.appendChild(this.formatWebm);
    webmOpt.appendChild(webmLabel);
    this.formatWebm.addEventListener('change', () => this.onFormatChange());

    // PNG Frames
    const framesOpt = document.createElement('div');
    framesOpt.className = 'recording-format-option';
    this.formatFrames = document.createElement('input');
    this.formatFrames.type = 'radio';
    this.formatFrames.name = 'recording-format';
    this.formatFrames.id = 'rec-fmt-frames';
    this.formatFrames.value = 'frames';
    const framesLabel = document.createElement('label');
    framesLabel.htmlFor = 'rec-fmt-frames';
    framesLabel.textContent = 'PNG Frames';
    framesOpt.appendChild(this.formatFrames);
    framesOpt.appendChild(framesLabel);
    this.formatFrames.addEventListener('change', () => this.onFormatChange());

    formatGroup.appendChild(mp4Opt);
    formatGroup.appendChild(webmOpt);
    formatGroup.appendChild(framesOpt);
    formatSection.appendChild(formatGroup);

    // Quality (video only)
    this.qualityGroup = document.createElement('div');
    this.qualityGroup.className = 'recording-quality-row';

    const qualityLabel = document.createElement('span');
    qualityLabel.className = 'recording-field-label';
    qualityLabel.textContent = 'Quality';

    this.qualitySelect = document.createElement('select');
    this.qualitySelect.className = 'recording-input recording-select';
    for (const [val, label] of [['low', 'Low (2 Mbps)'], ['medium', 'Medium (8 Mbps)'], ['high', 'High (16 Mbps)'], ['ultra', 'Ultra (32 Mbps)']]) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      if (val === 'high') opt.selected = true;
      this.qualitySelect.appendChild(opt);
    }

    this.qualityGroup.appendChild(qualityLabel);
    this.qualityGroup.appendChild(this.qualitySelect);
    formatSection.appendChild(this.qualityGroup);

    // --- Uniforms Section (collapsible) ---
    let uniformsSection: HTMLElement | null = null;
    if (uniforms && Object.values(uniforms).some(def => hasUIControl(def))) {
      uniformsSection = this.createCollapsibleSection('Uniforms');
      const uniformsContent = uniformsSection.querySelector('.recording-section-content')!;

      this.uniformControls = new UniformControls({
        container: uniformsContent as HTMLElement,
        uniforms,
        onChange: (name, value) => {
          callbacks.setUniformValue(name, value);
        },
      });
    }

    // --- Progress ---
    this.progressEl = document.createElement('div');
    this.progressEl.className = 'recording-progress';
    this.progressEl.innerHTML = `
      <div class="recording-progress-bar-bg"><div class="recording-progress-bar"></div></div>
      <div class="recording-progress-text">Preparing...</div>
    `;
    this.progressBar = this.progressEl.querySelector('.recording-progress-bar')!;
    this.progressText = this.progressEl.querySelector('.recording-progress-text')!;

    const cancelRenderBtn = document.createElement('button');
    cancelRenderBtn.className = 'recording-btn recording-btn-cancel';
    cancelRenderBtn.textContent = 'Cancel Render';
    cancelRenderBtn.style.marginTop = '4px';
    cancelRenderBtn.addEventListener('click', () => this.cancelRender());
    this.progressEl.appendChild(cancelRenderBtn);

    // --- Actions ---
    this.actionsEl = document.createElement('div');
    this.actionsEl.className = 'recording-panel-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'recording-btn recording-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());

    const startBtn = document.createElement('button');
    startBtn.className = 'recording-btn recording-btn-primary';
    startBtn.textContent = 'Start Render';
    startBtn.addEventListener('click', () => this.startRender());

    this.actionsEl.appendChild(cancelBtn);
    this.actionsEl.appendChild(startBtn);

    // Assemble
    this.bodyEl.appendChild(resSection);
    this.bodyEl.appendChild(timingSection);
    this.bodyEl.appendChild(formatSection);
    if (uniformsSection) this.bodyEl.appendChild(uniformsSection);

    this.panel.appendChild(header);
    this.panel.appendChild(this.bodyEl);
    this.panel.appendChild(this.actionsEl);
    this.panel.appendChild(this.progressEl);
    this.backdrop.appendChild(this.panel);

    // Initialize
    this.updateEstimate();
    this.onFormatChange();

    parentContainer.appendChild(this.backdrop);
  }

  close(): void {
    this.cancelRenderFn?.();
    this.cancelRenderFn = null;
    this.uniformControls?.destroy();
    this.backdrop.remove();
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
    this.updateEstimate();
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
  // Format
  // ===========================================================================

  private onFormatChange(): void {
    const isVideo = this.formatMp4.checked || this.formatWebm.checked;
    this.qualityGroup.style.display = isVideo ? 'flex' : 'none';
  }

  private getSelectedFormat(): RecordingFormat {
    if (this.formatMp4.checked) return 'mp4';
    if (this.formatFrames.checked) return 'frames';
    return 'webm';
  }

  // ===========================================================================
  // Estimate
  // ===========================================================================

  private updateEstimate(): void {
    const fps = parseInt(this.fpsInput.value) || 0;
    const dur = parseFloat(this.durationInput.value) || 0;
    const totalFrames = Math.ceil(fps * dur);

    if (this.formatFrames.checked) {
      const w = parseInt(this.widthInput.value) || 0;
      const h = parseInt(this.heightInput.value) || 0;
      const mbPerFrame = (w * h * 4) / (1024 * 1024);
      const totalMB = mbPerFrame * totalFrames;
      this.estimateEl.textContent = `${totalFrames} frames, ~${totalMB < 1024 ? Math.round(totalMB) + ' MB' : (totalMB / 1024).toFixed(1) + ' GB'} raw`;
    } else {
      this.estimateEl.textContent = `${totalFrames} frames, ${dur}s at ${fps} fps`;
    }
  }

  private updateWarmupNotice(): void {
    if (!this.warmupNotice) return;
    const startTime = parseFloat(this.startTimeInput.value) || 0;
    const fps = parseInt(this.fpsInput.value) || 60;

    if (startTime > 0) {
      const warmupFrames = Math.ceil(startTime * fps);
      this.warmupNotice.textContent = `Feedback buffers detected. Will compute ${warmupFrames} warm-up frames before recording.`;
      this.warmupNotice.style.display = '';
    } else {
      this.warmupNotice.style.display = 'none';
    }
  }

  // ===========================================================================
  // Render
  // ===========================================================================

  private startRender(): void {
    const width = parseInt(this.widthInput.value) || this.canvasWidth;
    const height = parseInt(this.heightInput.value) || this.canvasHeight;
    const fps = parseInt(this.fpsInput.value) || 60;
    const startTime = parseFloat(this.startTimeInput.value) || 0;
    const duration = parseFloat(this.durationInput.value) || 10;
    const format = this.getSelectedFormat();
    const quality = this.qualitySelect.value as RecordingQuality;

    // Switch to progress view
    this.bodyEl.style.display = 'none';
    this.actionsEl.style.display = 'none';
    this.progressEl.classList.add('active');
    this.progressBar.style.width = '0%';
    this.progressBar.style.background = '';
    this.progressText.textContent = 'Preparing...';

    this.cancelRenderFn = this.callbacks.startRecording({
      width,
      height,
      fps,
      startTime,
      duration,
      format,
      quality,
      onProgress: (phase, frame, total) => {
        const pct = (frame / total) * 100;
        this.progressBar.style.width = `${pct}%`;
        this.progressText.textContent = `${phase}: ${frame} / ${total} (${Math.round(pct)}%)`;
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

  // ===========================================================================
  // DOM Helpers
  // ===========================================================================

  private createSection(label: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'recording-section';
    const lbl = document.createElement('div');
    lbl.className = 'recording-section-label';
    lbl.textContent = label;
    section.appendChild(lbl);
    return section;
  }

  private createCollapsibleSection(label: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'recording-section recording-collapsible collapsed';

    const header = document.createElement('div');
    header.className = 'recording-collapsible-header';
    header.innerHTML = `<span class="recording-collapsible-arrow">&#9654;</span> ${label}`;
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    const content = document.createElement('div');
    content.className = 'recording-section-content';

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  private createFieldRow(label: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'recording-field-row';
    const lbl = document.createElement('span');
    lbl.className = 'recording-field-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    return row;
  }

  private createNumberInput(defaultVal: number, min: number, max: number): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'recording-input';
    input.value = String(Math.round(defaultVal));
    input.min = String(min);
    input.max = String(max);
    return input;
  }
}
