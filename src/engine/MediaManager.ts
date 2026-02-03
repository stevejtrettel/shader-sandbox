/**
 * MediaManager - Audio, video, and webcam texture management
 *
 * Owns the lifecycle of media inputs (microphone, webcam, video files)
 * and their corresponding WebGL textures. The engine calls update methods
 * per-frame and resolves textures when binding channels.
 */

import { ShaderProject, ChannelSource } from '../project/types';
import {
  RuntimeAudioTexture,
  RuntimeVideoTexture,
} from './types';
import {
  createAudioTexture,
  updateAudioTextureData,
  createVideoPlaceholderTexture,
  updateVideoTexture as glUpdateVideoTexture,
} from './glHelpers';

export class MediaManager {
  private _audioTexture: RuntimeAudioTexture | null = null;
  private _needsAudio: boolean = false;
  private _videoTextures: RuntimeVideoTexture[] = [];

  constructor(gl: WebGL2RenderingContext, project: ShaderProject) {
    const allChannels = this.getAllChannelSources(project);

    // Audio: create texture if any channel uses audio
    if (allChannels.some(ch => ch.kind === 'audio')) {
      this._needsAudio = true;
      this._audioTexture = {
        texture: createAudioTexture(gl),
        audioContext: null,
        analyser: null,
        stream: null,
        frequencyData: new Uint8Array(512),
        waveformData: new Uint8Array(512),
        width: 512,
        height: 2,
        initialized: false,
      };
    }

    // Video/Webcam: create placeholder textures
    for (const ch of allChannels) {
      if (ch.kind === 'webcam') {
        const existing = this._videoTextures.find(v => v.kind === 'webcam');
        if (!existing) {
          this._videoTextures.push({
            texture: createVideoPlaceholderTexture(gl),
            video: null,
            stream: null,
            width: 1,
            height: 1,
            ready: false,
            kind: 'webcam',
          });
        }
      } else if (ch.kind === 'video') {
        const existing = this._videoTextures.find(v => v.kind === 'video' && v.src === ch.src);
        if (!existing) {
          this._videoTextures.push({
            texture: createVideoPlaceholderTexture(gl),
            video: null,
            stream: null,
            width: 1,
            height: 1,
            ready: false,
            kind: 'video',
            src: ch.src,
          });
        }
      }
    }
  }

  // ===========================================================================
  // Accessors
  // ===========================================================================

  get needsAudio(): boolean {
    return this._needsAudio;
  }

  get needsWebcam(): boolean {
    return this._videoTextures.some(v => v.kind === 'webcam');
  }

  get videoSources(): string[] {
    return this._videoTextures
      .filter(v => v.kind === 'video' && !v.ready && v.src)
      .map(v => v.src!);
  }

  get audioTexture(): RuntimeAudioTexture | null {
    return this._audioTexture;
  }

  get videoTextures(): RuntimeVideoTexture[] {
    return this._videoTextures;
  }

  // ===========================================================================
  // Initialization (require user gesture for audio/webcam)
  // ===========================================================================

  async initAudio(): Promise<void> {
    if (!this._audioTexture || this._audioTexture.initialized) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; // 512 frequency bins
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      this._audioTexture.audioContext = audioContext;
      this._audioTexture.analyser = analyser;
      this._audioTexture.stream = stream;
      this._audioTexture.initialized = true;
    } catch (e) {
      console.warn('Failed to initialize audio input:', e);
    }
  }

  async initWebcam(): Promise<void> {
    const entry = this._videoTextures.find(v => v.kind === 'webcam' && !v.ready);
    if (!entry) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      entry.video = video;
      entry.stream = stream;
      entry.width = video.videoWidth;
      entry.height = video.videoHeight;

      video.addEventListener('loadedmetadata', () => {
        entry.width = video.videoWidth;
        entry.height = video.videoHeight;
      });

      entry.ready = true;
    } catch (e) {
      console.warn('Failed to initialize webcam:', e);
    }
  }

  async initVideo(src: string): Promise<void> {
    const entry = this._videoTextures.find(v => v.kind === 'video' && v.src === src && !v.ready);
    if (!entry) return;

    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    video.addEventListener('loadedmetadata', () => {
      entry.width = video.videoWidth;
      entry.height = video.videoHeight;
    });

    try {
      await video.play();
      entry.video = video;
      entry.ready = true;
    } catch (e) {
      console.warn(`Failed to play video '${src}':`, e);
    }
  }

  // ===========================================================================
  // Per-frame updates
  // ===========================================================================

  updateAudioTexture(gl: WebGL2RenderingContext): void {
    if (!this._audioTexture?.analyser) return;

    this._audioTexture.analyser.getByteFrequencyData(this._audioTexture.frequencyData);
    this._audioTexture.analyser.getByteTimeDomainData(this._audioTexture.waveformData);
    updateAudioTextureData(
      gl,
      this._audioTexture.texture,
      this._audioTexture.frequencyData,
      this._audioTexture.waveformData,
    );
  }

  updateVideoTextures(gl: WebGL2RenderingContext): void {
    for (const entry of this._videoTextures) {
      if (!entry.ready || !entry.video) continue;
      if (entry.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) continue;

      glUpdateVideoTexture(gl, entry.texture, entry.video);
      if (entry.video.videoWidth > 0) {
        entry.width = entry.video.videoWidth;
        entry.height = entry.video.videoHeight;
      }
    }
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  dispose(gl: WebGL2RenderingContext): void {
    // Stop audio
    if (this._audioTexture) {
      this._audioTexture.stream?.getTracks().forEach(t => t.stop());
      this._audioTexture.audioContext?.close();
      gl.deleteTexture(this._audioTexture.texture);
    }

    // Stop video/webcam
    for (const entry of this._videoTextures) {
      entry.stream?.getTracks().forEach(t => t.stop());
      entry.video?.pause();
      gl.deleteTexture(entry.texture);
    }

    this._audioTexture = null;
    this._videoTextures = [];
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private getAllChannelSources(project: ShaderProject): ChannelSource[] {
    const sources: ChannelSource[] = [];
    const passes = project.passes;
    for (const pass of [passes.Image, passes.BufferA, passes.BufferB, passes.BufferC, passes.BufferD]) {
      if (pass) {
        sources.push(...pass.channels);
        if (pass.namedSamplers) {
          sources.push(...pass.namedSamplers.values());
        }
      }
    }
    return sources;
  }
}
