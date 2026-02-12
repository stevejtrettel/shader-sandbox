/**
 * Layouts - Modular layout system for Shadertoy viewer
 *
 * Provides four single-view layout modes:
 * - Default: Canvas centered with styling
 * - Fullscreen: Canvas fills entire viewport
 * - Split: Canvas on left, code viewer on right
 * - Tabbed: Single window with tabs for shader and code
 *
 * And two multi-view layout modes:
 * - Grid: Adaptive N-view grid (2 side-by-side, 3 as 2+1, 4 as 2x2)
 * - Inset: Main view with small overlay
 */

export { FullscreenLayout } from './FullscreenLayout';
export { DefaultLayout } from './DefaultLayout';
export { SplitLayout } from './SplitLayout';
export { TabbedLayout } from './TabbedLayout';
export { GridLayout } from './GridLayout';
export { InsetViewLayout } from './InsetViewLayout';
export type { BaseLayout, LayoutOptions, LayoutMode, MultiViewLayout, MultiViewLayoutOptions } from './types';

import { FullscreenLayout } from './FullscreenLayout';
import { DefaultLayout } from './DefaultLayout';
import { SplitLayout } from './SplitLayout';
import { TabbedLayout } from './TabbedLayout';
import { GridLayout } from './GridLayout';
import { InsetViewLayout } from './InsetViewLayout';
import { BaseLayout, LayoutOptions, LayoutMode, MultiViewLayout, MultiViewLayoutOptions } from './types';
import { ThemeMode, MultiViewLayoutMode } from '../project/types';

/**
 * Apply theme to a target element.
 * Sets the data-theme attribute which activates the corresponding CSS custom properties.
 *
 * @param theme - Theme mode to apply ('light', 'dark', or 'system')
 * @param target - Element to apply theme to (default: document.documentElement for backward compat)
 */
export function applyTheme(theme: ThemeMode, target: HTMLElement = document.documentElement): void {
  target.setAttribute('data-theme', theme);
}

/**
 * Factory function to create the appropriate layout based on mode.
 *
 * @param mode - Layout mode to create
 * @param options - Layout options
 * @returns Layout instance implementing BaseLayout interface
 */
export function createLayout(
  mode: LayoutMode,
  options: LayoutOptions
): BaseLayout {
  switch (mode) {
    case 'fullscreen':
      return new FullscreenLayout(options);
    case 'default':
      return new DefaultLayout(options);
    case 'split':
      return new SplitLayout(options);
    case 'tabbed':
      return new TabbedLayout(options);
  }
}

/**
 * Factory function to create multi-view layouts.
 *
 * @param mode - Multi-view layout mode
 * @param options - Multi-view layout options
 * @returns Layout instance implementing MultiViewLayout interface
 */
export function createMultiViewLayout(
  mode: MultiViewLayoutMode,
  options: MultiViewLayoutOptions
): MultiViewLayout {
  switch (mode) {
    case 'split':
    case 'quad':
    case 'grid':
      return new GridLayout(options);
    case 'inset':
      return new InsetViewLayout(options);
    default:
      return new GridLayout(options);
  }
}
