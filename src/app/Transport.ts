/**
 * Transport — the playback clock.
 *
 * Single owner of elapsed-time and pause state. Before this existed, the
 * startTime/pausedElapsed/isPaused triple was mutated from six call sites
 * in App, which produced a family of drift bugs (screenshot time ignoring
 * pause, iTime jumping after offline renders). All time bookkeeping goes
 * through here now.
 *
 * The clock source is injectable for tests; production uses performance.now.
 */

export class Transport {
  private startTime = 0;
  private pausedElapsed = 0;
  private paused = false;

  constructor(private readonly clock: () => number = () => performance.now() / 1000) {
    this.startTime = this.clock();
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** Elapsed shader time in seconds — frozen while paused. */
  elapsed(): number {
    return this.paused ? this.pausedElapsed : this.clock() - this.startTime;
  }

  /** Restart the clock from zero (keeps play/pause state). */
  reset(): void {
    this.startTime = this.clock();
    this.pausedElapsed = 0;
  }

  pause(): void {
    if (this.paused) return;
    this.pausedElapsed = this.clock() - this.startTime;
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.startTime = this.clock() - this.pausedElapsed;
    this.paused = false;
  }

  /** Toggle and return the new paused state. */
  toggle(): boolean {
    if (this.paused) this.resume();
    else this.pause();
    return this.paused;
  }

  /** Force pause state without adjusting the clock (startPaused bookkeeping). */
  forcePaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.pausedElapsed = this.clock() - this.startTime;
  }

  /**
   * Restore a previously captured elapsed() value — used by offline renders
   * so iTime doesn't jump by the wall-clock render duration.
   */
  restore(elapsedSeconds: number): void {
    if (this.paused) {
      this.pausedElapsed = elapsedSeconds;
    } else {
      this.startTime = this.clock() - elapsedSeconds;
    }
  }
}
