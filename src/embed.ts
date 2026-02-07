/**
 * Build Entry Point
 *
 * This is the entry point for compiled shader modules.
 * Exports:
 *   - mountDemo(el, options?) — simple consumer API (auto-loads baked-in project)
 *   - embed(options)          — backward-compatible wrapper
 *   - DEMO_NAME               — name of the baked-in demo
 */

import { mount, MountHandle } from './mount';
import { loadDemoProject, DEMO_NAME } from './project/generatedLoader';

// ---------- New API ----------

export interface MountDemoOptions {
  styled?: boolean;       // default true
  pixelRatio?: number;    // default devicePixelRatio
}

/**
 * Mount the baked-in shader project into a DOM element.
 * This is the primary consumer-facing API for build output.
 */
export async function mountDemo(
  el: HTMLElement,
  options?: MountDemoOptions,
): Promise<MountHandle> {
  const project = await loadDemoProject();
  return mount(el, {
    project,
    styled: options?.styled ?? true,
    pixelRatio: options?.pixelRatio,
  });
}

// ---------- Backward-compatible API ----------

export interface EmbedOptions {
  container: HTMLElement | string;
  pixelRatio?: number;
}

/**
 * @deprecated Use mountDemo() instead.
 */
export async function embed(options: EmbedOptions): Promise<MountHandle> {
  const container = typeof options.container === 'string'
    ? document.querySelector(options.container)
    : options.container;

  if (!container || !(container instanceof HTMLElement)) {
    throw new Error(`Container not found: ${options.container}`);
  }

  const project = await loadDemoProject();
  return mount(container, {
    project,
    styled: false,
    pixelRatio: options.pixelRatio,
  });
}

// Re-exports
export { DEMO_NAME };
export type { MountHandle } from './mount';
