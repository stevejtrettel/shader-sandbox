/**
 * Mp4Encoder - Frame-by-frame MP4 encoding via mediabunny + WebCodecs
 *
 * Dynamically imports mediabunny to avoid bundle impact when not used.
 * Falls back gracefully when WebCodecs (VideoEncoder) is unavailable.
 */

const QUALITY_BITRATES: Record<string, number> = {
  low: 2_000_000,
  medium: 8_000_000,
  high: 16_000_000,
  ultra: 32_000_000,
};

/**
 * Check if the browser supports WebCodecs VideoEncoder (required for MP4).
 */
export function isMP4Supported(): boolean {
  return typeof VideoEncoder !== 'undefined';
}

/**
 * H.264 High Profile levels: [levelHex, maxMacroblocks, maxMacroblocksPerSec].
 * A hardcoded level 4.0 caps out around 2 Mpx — far below the 4K/8K presets —
 * so pick the smallest level that fits the requested size and framerate.
 */
const H264_LEVELS: Array<[string, number, number]> = [
  ['28', 8192, 245760],       // 4.0 — up to ~1080p60
  ['2a', 8704, 522240],       // 4.2
  ['32', 22080, 589824],      // 5.0 — up to ~1440p
  ['33', 36864, 983040],      // 5.1 — 4K30
  ['34', 36864, 2073600],     // 5.2 — 4K60
  ['3c', 139264, 4177920],    // 6.0 — 8K30
  ['3d', 139264, 8355840],    // 6.1 — 8K60
  ['3e', 139264, 16711680],   // 6.2
];

/** Pick an avc1 High Profile codec string whose level fits width×height @ fps. */
export function pickH264Codec(width: number, height: number, fps: number): string {
  const macroblocks = Math.ceil(width / 16) * Math.ceil(height / 16);
  const mbPerSec = macroblocks * fps;
  for (const [hex, maxMB, maxMBps] of H264_LEVELS) {
    if (macroblocks <= maxMB && mbPerSec <= maxMBps) {
      return `avc1.6400${hex}`;
    }
  }
  return 'avc1.64003e'; // largest defined level — let the encoder reject if truly out of range
}

export class Mp4Encoder {
  private width: number;
  private height: number;
  private fps: number;
  private bitrate: number;

  private output: any = null; // mediabunny Output
  private target: any = null; // mediabunny BufferTarget
  private videoSource: any = null; // mediabunny EncodedVideoPacketSource
  private encoder: VideoEncoder | null = null;
  private EncodedPacket: any = null; // mediabunny EncodedPacket class
  private frameCount = 0;

  constructor(width: number, height: number, fps: number, quality: string = 'high') {
    // H.264 requires even dimensions — round down rather than fail mid-render
    if (width % 2 !== 0 || height % 2 !== 0) {
      console.warn(`MP4 requires even dimensions; adjusting ${width}x${height} to ${width - (width % 2)}x${height - (height % 2)}`);
    }
    this.width = width - (width % 2);
    this.height = height - (height % 2);
    this.fps = fps;
    this.bitrate = QUALITY_BITRATES[quality] ?? QUALITY_BITRATES.high;
  }

  /** Actual encoded dimensions (after even-dimension adjustment). */
  get encodedWidth(): number { return this.width; }
  get encodedHeight(): number { return this.height; }

  async init(): Promise<void> {
    const {
      Output,
      BufferTarget,
      Mp4OutputFormat,
      EncodedVideoPacketSource,
      EncodedPacket,
    } = await import('mediabunny');

    this.EncodedPacket = EncodedPacket;
    this.target = new BufferTarget();
    this.videoSource = new EncodedVideoPacketSource('avc');

    this.output = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: this.target,
    });

    this.output.addVideoTrack(this.videoSource);
    await this.output.start();

    this.encoder = new VideoEncoder({
      output: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => {
        const packet = this.EncodedPacket.fromEncodedChunk(chunk);
        this.videoSource.add(packet, meta ?? undefined);
      },
      error: (e: DOMException) => {
        console.error('VideoEncoder error:', e);
      },
    });

    this.encoder.configure({
      codec: pickH264Codec(this.width, this.height, this.fps),
      width: this.width,
      height: this.height,
      bitrate: this.bitrate,
      framerate: this.fps,
    });

    this.frameCount = 0;
  }

  /**
   * Add a frame from a canvas element.
   */
  async addFrame(canvas: HTMLCanvasElement): Promise<void> {
    if (!this.encoder) throw new Error('Mp4Encoder not initialized');

    // Backpressure: GL renders frames far faster than hardware encoders
    // consume them at high resolutions — without this, raw VideoFrames pile
    // up in the WebCodecs queue unboundedly.
    while (this.encoder.encodeQueueSize > 4) {
      await new Promise<void>((resolve) => {
        this.encoder!.addEventListener('dequeue', () => resolve(), { once: true });
      });
    }

    // VideoFrame accepts a canvas directly — no ImageBitmap detour needed
    const frame = new VideoFrame(canvas, {
      timestamp: (this.frameCount / this.fps) * 1_000_000, // microseconds
      duration: (1 / this.fps) * 1_000_000,
    });

    const keyFrame = this.frameCount % (this.fps * 2) === 0; // keyframe every 2 seconds
    this.encoder.encode(frame, { keyFrame });
    frame.close();

    this.frameCount++;
  }

  /**
   * Finalize encoding and return the MP4 as a Blob.
   */
  async finish(): Promise<Blob> {
    if (!this.encoder || !this.output || !this.target) {
      throw new Error('Mp4Encoder not initialized');
    }

    await this.encoder.flush();
    this.encoder.close();
    await this.output.finalize();

    const buffer = this.target.buffer as ArrayBuffer;
    return new Blob([buffer], { type: 'video/mp4' });
  }

  /**
   * Clean up without finalizing (e.g. on cancel).
   */
  dispose(): void {
    try {
      if (this.encoder && this.encoder.state !== 'closed') {
        this.encoder.close();
      }
    } catch { /* ignore */ }
    try {
      if (this.output && this.output.state === 'started') {
        this.output.cancel();
      }
    } catch { /* ignore */ }
    this.encoder = null;
    this.output = null;
    this.target = null;
    this.videoSource = null;
  }
}
