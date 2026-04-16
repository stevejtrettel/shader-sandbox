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
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.bitrate = QUALITY_BITRATES[quality] ?? QUALITY_BITRATES.high;
  }

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
      codec: 'avc1.640028', // H.264 High Profile Level 4.0
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

    const bitmap = await createImageBitmap(canvas);
    const frame = new VideoFrame(bitmap, {
      timestamp: (this.frameCount / this.fps) * 1_000_000, // microseconds
      duration: (1 / this.fps) * 1_000_000,
    });

    const keyFrame = this.frameCount % (this.fps * 2) === 0; // keyframe every 2 seconds
    this.encoder.encode(frame, { keyFrame });
    frame.close();
    bitmap.close();

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
