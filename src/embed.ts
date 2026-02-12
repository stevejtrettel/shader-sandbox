/**
 * Build Entry Point
 *
 * This is the entry point for compiled shader modules.
 * Exports:
 *   - mount(el, options?) — consumer API (auto-loads baked-in project)
 *   - DEMO_NAME           — name of the baked-in demo
 */

import { mount as coreMount, MountHandle } from './mount';
import { loadDemoProject, DEMO_NAME } from './project/generatedLoader';
import type { LayoutMode } from './layouts/types';
import type { ThemeMode } from './project/types';

export interface MountOptions {
  /** Add pane decoration (border-radius, box-shadow). Default: true. */
  styled?: boolean;
  /** Canvas pixel ratio. Default: window.devicePixelRatio. */
  pixelRatio?: number;
  /** Override the layout mode from config. */
  layout?: LayoutMode;
  /** Override whether playback controls are shown. */
  controls?: boolean;
  /** Override the color theme. */
  theme?: ThemeMode;
  /** Override whether the shader starts paused. */
  startPaused?: boolean;
}

/**
 * Mount the baked-in shader project into a DOM element.
 * This is the primary consumer-facing API for build output.
 */
export async function mount(
  el: HTMLElement,
  options?: MountOptions,
): Promise<MountHandle> {
  const project = await loadDemoProject();
  return coreMount(el, {
    project,
    styled: options?.styled ?? true,
    pixelRatio: options?.pixelRatio,
    layout: options?.layout,
    controls: options?.controls,
    theme: options?.theme,
    startPaused: options?.startPaused,
  });
}

// Re-exports
export { DEMO_NAME };
export type { MountHandle } from './mount';
