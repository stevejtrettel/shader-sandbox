/**
 * StatsPanel - FPS counter and expandable stats display
 *
 * Shows an FPS counter button that expands to reveal time, frame count,
 * and resolution stats.
 */

export class StatsPanel {
  private container: HTMLElement;
  private statsContainer: HTMLElement;
  private statsGrid: HTMLElement;
  private fpsDisplay: HTMLElement;
  private timeDisplay: HTMLElement;
  private frameDisplay: HTMLElement;
  private resolutionDisplay: HTMLElement;

  private frameCount: number = 0;
  totalFrameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  private isStatsOpen: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // Create stats container (holds FPS button and expandable stats)
    this.statsContainer = document.createElement('div');
    this.statsContainer.className = 'stats-container';

    // Create FPS display (clickable to expand stats)
    this.fpsDisplay = document.createElement('button');
    this.fpsDisplay.className = 'fps-counter';
    this.fpsDisplay.textContent = '0 FPS';
    this.fpsDisplay.title = 'Click to show stats';
    this.fpsDisplay.addEventListener('click', () => this.toggle());

    // Create stats grid (hidden by default)
    this.statsGrid = document.createElement('div');
    this.statsGrid.className = 'stats-grid';

    // Time display
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.className = 'stat-item';
    this.timeDisplay.innerHTML = '<span class="stat-value">0:00</span><span class="stat-label">time</span>';
    this.statsGrid.appendChild(this.timeDisplay);

    // Frame display
    this.frameDisplay = document.createElement('div');
    this.frameDisplay.className = 'stat-item';
    this.frameDisplay.innerHTML = '<span class="stat-value">0</span><span class="stat-label">frame</span>';
    this.statsGrid.appendChild(this.frameDisplay);

    // Resolution display
    this.resolutionDisplay = document.createElement('div');
    this.resolutionDisplay.className = 'stat-item';
    this.resolutionDisplay.innerHTML = '<span class="stat-value">0×0</span><span class="stat-label">res</span>';
    this.statsGrid.appendChild(this.resolutionDisplay);

    this.statsContainer.appendChild(this.statsGrid);
    this.statsContainer.appendChild(this.fpsDisplay);
    this.container.appendChild(this.statsContainer);
  }

  /**
   * Update FPS counter and stats. Call once per frame.
   */
  update(currentTimeSec: number, elapsedTime: number): void {
    this.frameCount++;
    this.totalFrameCount++;

    // Update frame count display every frame if stats panel is open
    if (this.isStatsOpen) {
      this.updateFrameDisplay();
    }

    // Update FPS display once per second
    if (currentTimeSec - this.lastFpsUpdate >= 1.0) {
      this.currentFps = this.frameCount / (currentTimeSec - this.lastFpsUpdate);
      this.fpsDisplay.textContent = `${Math.round(this.currentFps)} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTimeSec;

      // Update time/resolution stats once per second
      if (this.isStatsOpen) {
        this.updateTimeDisplay(elapsedTime);
        this.updateResolutionDisplay();
      }
    }
  }

  /**
   * Reset all counters.
   */
  reset(): void {
    this.frameCount = 0;
    this.totalFrameCount = 0;
    this.lastFpsUpdate = 0;

    if (this.isStatsOpen) {
      this.updateTimeDisplay(0);
      this.updateFrameDisplay();
      this.updateResolutionDisplay();
    }
  }

  /**
   * Update resolution display with current canvas dimensions.
   */
  updateResolution(w: number, h: number): void {
    this.resolutionDisplay.querySelector('.stat-value')!.textContent = `${w}×${h}`;
  }

  /**
   * Clean up DOM.
   */
  dispose(): void {
    this.statsContainer.remove();
  }

  private toggle(): void {
    this.isStatsOpen = !this.isStatsOpen;

    this.statsGrid.classList.toggle('open', this.isStatsOpen);
    this.statsContainer.classList.toggle('open', this.isStatsOpen);

    // Update stats immediately when opening
    if (this.isStatsOpen) {
      this.updateFrameDisplay();
      this.updateResolutionDisplay();
    }
  }

  private updateFrameDisplay(): void {
    let frameStr: string;
    if (this.totalFrameCount >= 1000000) {
      frameStr = (this.totalFrameCount / 1000000).toFixed(1) + 'M';
    } else if (this.totalFrameCount >= 1000) {
      frameStr = (this.totalFrameCount / 1000).toFixed(1) + 'K';
    } else {
      frameStr = this.totalFrameCount.toString();
    }
    this.frameDisplay.querySelector('.stat-value')!.textContent = frameStr;
  }

  private updateTimeDisplay(elapsedTime: number): void {
    const totalSeconds = Math.floor(elapsedTime);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let timeStr: string;
    if (hours > 0) {
      timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    this.timeDisplay.querySelector('.stat-value')!.textContent = timeStr;
  }

  private updateResolutionDisplay(): void {
    const w = this.resolutionDisplay.querySelector('.stat-value')!.textContent;
    // Already set via updateResolution(), just needed for toggle open
    if (!w) {
      this.resolutionDisplay.querySelector('.stat-value')!.textContent = '0×0';
    }
  }
}
