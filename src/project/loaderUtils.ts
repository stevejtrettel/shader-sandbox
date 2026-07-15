/**
 * Small helpers shared by the browser/Vite loader (loaderHelper.ts) and the
 * fetch-based runtime loader (runtime.ts).
 */

import type { DemoScriptHooks } from './types';

/**
 * Forward-slash path join with './' normalization, so config paths like
 * "./data.json" resolve to the same keys the file maps use.
 */
export function joinBrowserPath(...parts: string[]): string {
  return parts
    .map((p, i) => (i === 0 ? p : p.replace(/^\/+/, '')))
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/\.\//g, '/');
}

/** Last path segment ("/foo/bar" → "bar"). */
export function pathBaseName(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * Extract the supported lifecycle hooks from an imported script module.
 * Returns null when the module exports none of them.
 */
export function pluckScriptHooks(mod: Record<string, unknown>): DemoScriptHooks | null {
  const hooks: DemoScriptHooks = {};
  if (typeof mod.setup === 'function') hooks.setup = mod.setup as DemoScriptHooks['setup'];
  if (typeof mod.onFrame === 'function') hooks.onFrame = mod.onFrame as DemoScriptHooks['onFrame'];
  if (typeof mod.dispose === 'function') hooks.dispose = mod.dispose as DemoScriptHooks['dispose'];
  if (typeof mod.onUniformChange === 'function') hooks.onUniformChange = mod.onUniformChange as DemoScriptHooks['onUniformChange'];
  return (hooks.setup || hooks.onFrame || hooks.dispose || hooks.onUniformChange) ? hooks : null;
}
