/**
 * OfflineRenderer — deterministic fixed-timestep rendering.
 *
 * Owns everything that steps the engine outside the live animation loop:
 * video recording (MP4/WebM/PNG frames), high-res screenshot capture, and
 * stepped previews for buffer shaders. Renders advance one frame at a time
 * regardless of real-time performance, so output is deterministic.
 *
 * Extracted from App so the coordinator no longer owns canvas-resize
 * mutation or render-loop plumbing. Behavior is a verbatim move.
 */

import type { ShaderView } from './ShaderView';
import type { Transport } from './Transport';
import type { RecordingRequest } from './RecordingPanel';
import { Mp4Encoder } from './Mp4Encoder';
import { downloadBlob } from './dom';

export interface OfflineRendererDeps {
  view: ShaderView;
  transport: Transport;
  hasBufferPasses(): boolean;
  hasOnFrameScript(): boolean;
  /** Run the script onFrame hook (errors swallowed by the provider). */
  runOnFrame(time: number, deltaTime: number, frame: number): void;
  /** Non-throwing script setup (restore paths). */
  runSetup(): void;
  /** Throwing script setup — aborts a starting render on error. */
  runSetupOrThrow(): void;
  notifyPauseState(paused: boolean): void;
}

export class OfflineRenderer {
  private deps: OfflineRendererDeps;

  /** True while a render owns the canvas (blocks a second render). */
  private active = false;

  constructor(deps: OfflineRendererDeps) {
    this.deps = deps;
  }

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Step one offline frame. `frameOffset` keeps the script's frame counter
   * continuous across the warmup → recording transition (the engine's
   * internal iFrame already is).
   */
  stepForRender(frame: number, fps: number, startTime: number, frameOffset = 0): void {
    const time = startTime + frame / fps;
    const deltaTime = 1 / fps;
    this.deps.runOnFrame(time, deltaTime, frame + frameOffset);
    this.deps.view.engine.step(time, [0, 0, 0, 0], false);
  }

  /** Step from frame 0 to the target time, presenting the final frame. */
  async renderPreviewStepped(
    time: number,
    fps: number,
    onProgress: (frame: number, total: number) => void,
  ): Promise<boolean> {
    const engine = this.deps.view.engine;
    engine.reset();
    this.deps.runSetup();

    const totalFrames = Math.ceil(time * fps);
    for (let f = 0; f <= totalFrames; f++) {
      this.stepForRender(f, fps, 0);
      if (f % 100 === 0) {
        onProgress(f, totalFrames);
        await new Promise(r => setTimeout(r, 0));
      }
    }
    this.deps.view.presentToScreen();
    onProgress(totalFrames, totalFrames);
    return true;
  }

  /** Capture a high-res screenshot at an explicit resolution and time. */
  async captureScreenshot(opts: {
    width: number;
    height: number;
    time: number;
    hasBuffers: boolean;
    onProgress: (frame: number, total: number) => void;
  }): Promise<Blob | null> {
    const view = this.deps.view;
    const canvas = view.canvas;
    const engine = view.engine;
    const origW = canvas.width;
    const origH = canvas.height;
    view.suspendResizeTracking();

    try {
      // Resize to target resolution
      canvas.width = opts.width;
      canvas.height = opts.height;
      engine.resize(opts.width, opts.height);
      engine.reset();

      this.deps.runSetup();

      if (opts.hasBuffers) {
        // Step through all frames to target time
        const fps = 60;
        const totalFrames = Math.ceil(opts.time * fps);
        for (let f = 0; f <= totalFrames; f++) {
          this.stepForRender(f, fps, 0);
          if (f % 100 === 0) {
            opts.onProgress(f, totalFrames);
            await new Promise(r => setTimeout(r, 0));
          }
        }
        opts.onProgress(totalFrames, totalFrames);
      } else {
        // Jump directly
        engine.step(opts.time, [0, 0, 0, 0], false);
      }

      view.presentToScreen();

      // Capture
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to capture')),
          'image/png',
        );
      });
    } finally {
      // Restore original canvas size
      canvas.width = origW;
      canvas.height = origH;
      engine.resize(origW, origH);
      engine.reset();
      this.deps.runSetup();
      // Re-render preview at current slider time so canvas isn't blank
      if (!this.deps.hasBufferPasses()) {
        const currentSliderTime = this.deps.transport.elapsed(); // approximate
        engine.step(currentSliderTime, [0, 0, 0, 0], false);
        view.presentToScreen();
      }
      view.resumeResizeTracking();
    }
  }

  /** Run an offline recording (MP4/WebM/PNG frames). Returns a cancel fn. */
  record(req: RecordingRequest): () => void {
    let cancelled = false;
    const cancel = () => { cancelled = true; };

    if (this.active) {
      req.onError(new Error('A render is already in progress'));
      return cancel;
    }

    const run = async () => {
      const view = this.deps.view;
      const transport = this.deps.transport;
      const canvas = view.canvas;
      const engine = view.engine;
      const origW = canvas.width;
      const origH = canvas.height;
      const wasPaused = transport.isPaused;
      // Preserve the live clock: iTime must not jump by the wall-clock
      // duration of the render when playback resumes afterwards
      const savedElapsed = transport.elapsed();

      this.active = true;
      // The ResizeObserver would snap the canvas back to container size and
      // reset the engine mid-render — suspend it while we own the canvas
      view.suspendResizeTracking();

      try {
        transport.pause();
        this.deps.notifyPauseState(true);

        canvas.width = req.width;
        canvas.height = req.height;
        engine.resize(req.width, req.height);
        engine.reset();

        // Deliberately throwing: a setup throw at recording start should
        // abort the render (caught below → panel shows the error) rather
        // than silently producing wrong frames.
        this.deps.runSetupOrThrow();

        // Warm-up phase: step to startTime. Only needed when earlier frames
        // affect later ones (buffer feedback or a stateful script) —
        // otherwise startTime is reached directly via the time uniform.
        let warmupFrames = 0;
        if (req.startTime > 0 && (this.deps.hasBufferPasses() || this.deps.hasOnFrameScript())) {
          warmupFrames = Math.ceil(req.startTime * req.fps);
          for (let f = 0; f < warmupFrames; f++) {
            if (cancelled) return;
            this.stepForRender(f, req.fps, 0);
            if (f % 100 === 0) {
              req.onProgress('Warming up', f, warmupFrames);
              await new Promise(r => setTimeout(r, 0));
            }
          }
        }

        const totalFrames = Math.ceil(req.fps * req.duration);
        const onFrame = (f: number, t: number) => req.onProgress('Recording', f, t);

        if (req.format === 'mp4') {
          await this.renderMp4Frames(totalFrames, req.fps, req.startTime, warmupFrames, req.quality, () => cancelled, onFrame);
        } else if (req.format === 'webm') {
          await this.renderWebmFrames(totalFrames, req.fps, req.startTime, warmupFrames, () => cancelled, onFrame);
        } else {
          await this.renderPngFrames(totalFrames, req.fps, req.startTime, warmupFrames, () => cancelled, onFrame);
        }

        if (!cancelled) req.onComplete();
      } catch (e) {
        if (!cancelled) req.onError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        canvas.width = origW;
        canvas.height = origH;
        engine.resize(origW, origH);
        engine.reset();
        this.deps.runSetup();
        // Restore the clock and pause state we entered with
        if (!wasPaused) transport.resume();
        transport.restore(savedElapsed);
        this.deps.notifyPauseState(wasPaused);
        view.resumeResizeTracking();
        this.active = false;
      }
    };

    run();
    return cancel;
  }

  // ===========================================================================
  // Format-specific render loops
  // ===========================================================================

  private async renderPngFrames(
    totalFrames: number, fps: number, startTime: number, frameOffset: number,
    isCancelled: () => boolean,
    onProgress: (frame: number, total: number) => void,
  ): Promise<void> {
    const view = this.deps.view;
    let dirHandle: FileSystemDirectoryHandle | null = null;
    if ('showDirectoryPicker' in window) {
      try {
        dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      } catch { /* user cancelled */ }
    }

    for (let frame = 0; frame < totalFrames; frame++) {
      if (isCancelled()) return;

      this.stepForRender(frame, fps, startTime, frameOffset);
      view.presentToScreen();

      const blob = await new Promise<Blob>((resolve, reject) => {
        view.canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to capture frame')), 'image/png');
      });

      const filename = `frame_${String(frame).padStart(5, '0')}.png`;
      if (dirHandle) {
        const fh = await dirHandle.getFileHandle(filename, { create: true });
        const w = await fh.createWritable();
        await w.write(blob);
        await w.close();
      } else {
        downloadBlob(blob, filename);
      }

      onProgress(frame + 1, totalFrames);
      if (frame % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
  }

  private async renderWebmFrames(
    totalFrames: number, fps: number, startTime: number, frameOffset: number,
    isCancelled: () => boolean,
    onProgress: (frame: number, total: number) => void,
  ): Promise<void> {
    const canvas = this.deps.view.canvas;
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = canvas.width;
    videoCanvas.height = canvas.height;
    const ctx = videoCanvas.getContext('2d')!;

    const stream = videoCanvas.captureStream(0);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8_000_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const done = new Promise<void>(r => { recorder.onstop = () => r(); });
    recorder.start();

    for (let frame = 0; frame < totalFrames; frame++) {
      if (isCancelled()) { recorder.stop(); await done; return; }

      this.stepForRender(frame, fps, startTime, frameOffset);
      this.deps.view.presentToScreen();
      ctx.drawImage(canvas, 0, 0);

      const track = stream.getVideoTracks()[0] as any;
      if (track?.requestFrame) track.requestFrame();

      onProgress(frame + 1, totalFrames);
      if (frame % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }

    recorder.stop();
    await done;

    const blob = new Blob(chunks, { type: 'video/webm' });
    downloadBlob(blob, `render_${canvas.width}x${canvas.height}_${fps}fps.webm`);
  }

  private async renderMp4Frames(
    totalFrames: number, fps: number, startTime: number, frameOffset: number,
    quality: string,
    isCancelled: () => boolean,
    onProgress: (frame: number, total: number) => void,
  ): Promise<void> {
    const canvas = this.deps.view.canvas;
    const encoder = new Mp4Encoder(canvas.width, canvas.height, fps, quality);
    await encoder.init();

    try {
      for (let frame = 0; frame < totalFrames; frame++) {
        if (isCancelled()) { encoder.dispose(); return; }

        this.stepForRender(frame, fps, startTime, frameOffset);
        this.deps.view.presentToScreen();

        await encoder.addFrame(canvas);

        onProgress(frame + 1, totalFrames);
        if (frame % 10 === 0) await new Promise(r => setTimeout(r, 0));
      }

      const blob = await encoder.finish();
      downloadBlob(blob, `render_${canvas.width}x${canvas.height}_${fps}fps.mp4`);
    } catch (e) {
      encoder.dispose();
      throw e;
    }
  }
}
