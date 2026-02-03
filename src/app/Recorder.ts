/**
 * Recorder - Video recording from canvas
 *
 * Captures the canvas as a WebM video using MediaRecorder API.
 * Handles start/stop, recording indicator UI, and file download.
 */

export class Recorder {
  isRecording: boolean = false;

  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  private projectRoot: string;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingIndicator: HTMLElement | null = null;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement, projectRoot: string) {
    this.canvas = canvas;
    this.container = container;
    this.projectRoot = projectRoot;
  }

  /**
   * Toggle recording on/off.
   * If paused, calls unpause callback before starting.
   */
  toggle(isPaused: boolean, unpause: () => void): void {
    if (this.isRecording) {
      this.stop();
    } else {
      this.start(isPaused, unpause);
    }
  }

  /**
   * Start recording the canvas as WebM video.
   */
  private start(isPaused: boolean, unpause: () => void): void {
    // Check if MediaRecorder is supported
    if (!MediaRecorder.isTypeSupported('video/webm')) {
      console.error('WebM recording not supported in this browser');
      return;
    }

    // Unpause if paused (can't record a paused shader)
    if (isPaused) {
      unpause();
    }

    // Get canvas stream at 60fps
    const stream = this.canvas.captureStream(60);

    // Create MediaRecorder with WebM format
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000, // 8 Mbps for high quality
    });

    this.recordedChunks = [];

    // Collect recorded chunks
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Handle recording stop - download the video
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });

      // Generate filename
      const folderName = this.projectRoot.split('/').pop() || 'shader';
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') + '-' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
      const filename = `shadertoy-${folderName}-${timestamp}.webm`;

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      console.log(`Recording saved: ${filename}`);
    };

    // Start recording
    this.mediaRecorder.start();
    this.isRecording = true;
    this.showRecordingIndicator();
    console.log('Recording started');
  }

  /**
   * Stop recording and trigger download.
   */
  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    this.mediaRecorder = null;
    this.hideRecordingIndicator();
    console.log('Recording stopped');
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    if (this.isRecording) {
      this.stop();
    }
    this.hideRecordingIndicator();
  }

  /**
   * Show the recording indicator (pulsing red dot in corner).
   */
  private showRecordingIndicator(): void {
    if (this.recordingIndicator) return;

    this.recordingIndicator = document.createElement('div');
    this.recordingIndicator.className = 'recording-indicator';
    this.recordingIndicator.innerHTML = `
      <span class="recording-dot"></span>
      <span class="recording-text">REC</span>
    `;
    this.container.appendChild(this.recordingIndicator);
  }

  /**
   * Hide the recording indicator.
   */
  private hideRecordingIndicator(): void {
    if (this.recordingIndicator) {
      this.recordingIndicator.remove();
      this.recordingIndicator = null;
    }
  }
}
