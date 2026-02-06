/**
 * Layouts - Modular layout system for Shadertoy viewer
 *
 * Provides five single-view layout modes:
 * - Default: Canvas centered with styling
 * - Fullscreen: Canvas fills entire viewport
 * - Split: Canvas on left, code viewer on right
 * - Tabbed: Single window with tabs for shader and code
 * - UI: Canvas on left, uniforms panel on right
 *
 * And three multi-view layout modes:
 * - SplitView: Two views side-by-side (responsive)
 * - QuadView: Four views in 2x2 grid
 * - InsetView: Main view with small overlay
 */

export { FullscreenLayout } from './FullscreenLayout';
export { DefaultLayout } from './DefaultLayout';
export { SplitLayout } from './SplitLayout';
export { TabbedLayout } from './TabbedLayout';
export { UILayout } from './UILayout';
export { SplitViewLayout } from './SplitViewLayout';
export { QuadViewLayout } from './QuadViewLayout';
export { InsetViewLayout } from './InsetViewLayout';
export type { BaseLayout, LayoutOptions, LayoutMode, MultiViewLayout, MultiViewLayoutOptions } from './types';

import { FullscreenLayout } from './FullscreenLayout';
import { DefaultLayout } from './DefaultLayout';
import { SplitLayout } from './SplitLayout';
import { TabbedLayout } from './TabbedLayout';
import { UILayout } from './UILayout';
import { SplitViewLayout } from './SplitViewLayout';
import { QuadViewLayout } from './QuadViewLayout';
import { InsetViewLayout } from './InsetViewLayout';
import { BaseLayout, LayoutOptions, LayoutMode, MultiViewLayout, MultiViewLayoutOptions } from './types';
import { ThemeMode, MultiViewLayoutMode } from '../project/types';

/**
 * Apply theme to the document.
 * Sets the data-theme attribute on the html element.
 *
 * @param theme - Theme mode to apply ('light', 'dark', or 'system')
 */
export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme);
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
  // Apply theme from project configuration
  applyTheme(options.project.theme);

  switch (mode) {
    case 'fullscreen':
      return new FullscreenLayout(options);
    case 'default':
      return new DefaultLayout(options);
    case 'split':
      return new SplitLayout(options);
    case 'tabbed':
      return new TabbedLayout(options);
    case 'ui':
      return new UILayout(options);
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
  // Apply theme from project configuration
  applyTheme(options.project.theme);

  switch (mode) {
    case 'split':
      return new SplitViewLayout(options);
    case 'quad':
      return new QuadViewLayout(options);
    case 'inset':
      return new InsetViewLayout(options);
    default:
      // Default to split for 2 views
      return new SplitViewLayout(options);
  }
}
