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
import {
  createPanelShell,
  createSection,
  createCollapsibleSection,
  createResolutionSection,
  createProgressBar,
  createNumberInput,
  ProgressBar,
} from './panel-kit';

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
  private rendering = false;

  // Resolution
  private widthInput: HTMLInputElement;
  private heightInput: HTMLInputElement;

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
  private progress: ProgressBar;
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
    this.hasBuffers = callbacks.hasBufferPasses();

    const shell = createPanelShell({
      prefix: 'recording',
      titleHTML: `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/>
        </svg>
        Record`,
      onClose: () => this.close(),
      // Never let a stray backdrop click silently kill an active render --
      // cancelling requires the explicit Cancel button
      onBackdropClick: () => { if (!this.rendering) this.close(); },
    });
    this.backdrop = shell.backdrop;
    this.panel = shell.panel;

    // Body
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'recording-panel-body';

    // --- Resolution Section ---
    const res = createResolutionSection({
      prefix: 'recording',
      canvasWidth,
      canvasHeight,
      onChange: () => this.updateEstimate(),
    });
    const resSection = res.section;
    this.widthInput = res.widthInput;
    this.heightInput = res.heightInput;

    // --- Timing Section ---
    const timingSection = createSection('recording', 'Timing');

    // Start Time
    const startRow = this.createFieldRow('Start Time');
    this.startTimeInput = createNumberInput('recording', 0, 0, 3600);
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
    this.durationInput = createNumberInput('recording', 10, 0.1, 3600);
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
    this.fpsInput = createNumberInput('recording', 60, 1, 120);
    this.fpsInput.addEventListener('input', () => {
      this.updateEstimate();
      this.updateWarmupNotice(); // warmup frame count depends on FPS too
    });
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
    const formatSection = createSection('recording', 'Format');

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
      uniformsSection = createCollapsibleSection('recording', 'Uniforms');
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
    this.progress = createProgressBar('recording');

    const cancelRenderBtn = document.createElement('button');
    cancelRenderBtn.className = 'recording-btn recording-btn-cancel';
    cancelRenderBtn.textContent = 'Cancel Render';
    cancelRenderBtn.style.marginTop = '4px';
    cancelRenderBtn.addEventListener('click', () => this.cancelRender());
    this.progress.el.appendChild(cancelRenderBtn);

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

    this.panel.appendChild(this.bodyEl);
    this.panel.appendChild(this.actionsEl);
    this.panel.appendChild(this.progress.el);

    // Initialize
    this.updateEstimate();
    this.onFormatChange();

    parentContainer.appendChild(this.backdrop);
  }

  close(): void {
    this.cancelRenderFn?.();
    this.cancelRenderFn = null;
    this.uniformControls?.dispose();
    this.backdrop.remove();
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
    this.progress.show('Preparing...');

    this.rendering = true;
    this.cancelRenderFn = this.callbacks.startRecording({
      width,
      height,
      fps,
      startTime,
      duration,
      format,
      quality,
      onProgress: (phase, frame, total) => this.progress.update(frame, total, `${phase}:`),
      onComplete: () => {
        // Clear cancel state BEFORE the delayed close, so close() can't
        // invoke a stale cancel function
        this.rendering = false;
        this.cancelRenderFn = null;
        this.progress.text.textContent = 'Done!';
        this.progress.bar.style.width = '100%';
        setTimeout(() => this.close(), 1500);
      },
      onError: (error) => {
        this.rendering = false;
        this.cancelRenderFn = null;
        this.progress.fail(`Error: ${error.message}`);
      },
    });
  }

  private cancelRender(): void {
    this.rendering = false;
    this.cancelRenderFn?.();
    this.cancelRenderFn = null;
    // Reset to form view
    this.bodyEl.style.display = '';
    this.actionsEl.style.display = '';
    this.progress.hide();
  }

  // ===========================================================================
  // DOM Helpers
  // ===========================================================================

  private createFieldRow(label: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'recording-field-row';
    const lbl = document.createElement('span');
    lbl.className = 'recording-field-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    return row;
  }

}
