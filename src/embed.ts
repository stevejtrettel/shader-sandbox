/**
 * Build Entry Point
 *
 * This is the entry point for compiled shader modules.
 * Exports:
 *   - mount(el, options?) — consumer API (auto-loads baked-in project)
 *   - DEMO_NAME           — name of the baked-in demo
 */

import { mount as coreMount, MountHandle, MountPresentationOptions } from './mount';
import { loadDemoProject, DEMO_NAME } from './project/generatedLoader';

/**
 * Mount the baked-in shader project into a DOM element.
 * This is the primary consumer-facing API for build output.
 */
export async function mount(
  el: HTMLElement,
  options?: MountPresentationOptions,
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
export type { MountHandle, MountPresentationOptions } from './mount';
