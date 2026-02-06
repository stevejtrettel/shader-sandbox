/**
 * App Layer - Type Definitions
 *
 * Types for the browser runtime coordinator.
 */

import type { ShaderProject } from '../project/types';

/**
 * Options for creating the App.
 */
export interface AppOptions {
  /**
   * HTML container element (App will create canvas inside).
   */
  container: HTMLElement;

  /**
   * Loaded Shadertoy project.
   */
  project: ShaderProject;

  /**
   * Canvas pixel ratio (default: window.devicePixelRatio).
   * Set to 1 for performance, or higher for retina displays.
   */
  pixelRatio?: number;

  /**
   * Skip creating the floating uniforms panel.
   * Used by 'ui' layout which has its own uniforms panel.
   */
  skipUniformsPanel?: boolean;

  /**
   * Skip creating the playback controls overlay.
   * Used by 'ui' layout which has its own playback controls.
   */
  skipPlaybackControls?: boolean;

  /**
   * Skip creating internal animation loop.
   * Used by AppGroup which manages a shared animation loop for all views.
   * When true, call stepExternal() manually each frame.
   */
  externalAnimationLoop?: boolean;

  /**
   * View names for multi-view projects.
   * Enables cross-view uniforms (iMouse_viewName, etc.)
   */
  viewNames?: string[];
}

/**
 * Mouse state for iMouse uniform (Shadertoy spec).
 * Format: [x, y, clickX, clickY]
 * - x, y: mouse position while button is held (freezes on release)
 * - clickX, clickY: click origin position (positive while held, negated on release)
 * The sign of clickX serves as a "mouse is down" signal (z > 0.0 = pressed).
 */
export type MouseState = [number, number, number, number];

/**
 * Single touch point state.
 * Format: [x, y, startX, startY]
 * - x, y: current touch position in pixels
 * - startX, startY: position where touch started
 */
export type TouchPoint = [number, number, number, number];

/**
 * Touch state for touch uniforms.
 */
export interface TouchState {
  /** Number of active touches (0-10) */
  count: number;
  /** Up to 3 tracked touches for shader uniforms */
  touches: [TouchPoint, TouchPoint, TouchPoint];
  /** Pinch scale factor (1.0 = no pinch, >1 = zoom in, <1 = zoom out) */
  pinch: number;
  /** Pinch change since last frame */
  pinchDelta: number;
  /** Center point of pinch gesture [x, y] */
  pinchCenter: [number, number];
}

/**
 * Internal pointer tracking for gesture recognition.
 */
export interface PointerData {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
}
