/**
 * Shared helpers for config loading.
 * Used by both the Node/CLI loader (loadProject.ts) and
 * the browser/Vite loader (loaderHelper.ts).
 */

import type { PassName, ChannelValue, ChannelJSONObject } from './types';

/**
 * Type guard for PassName.
 */
export function isPassName(s: string): s is PassName {
  return s === 'Image' || s === 'BufferA' || s === 'BufferB' || s === 'BufferC' || s === 'BufferD';
}

/**
 * Get default source file name for a pass.
 */
export function defaultSourceForPass(name: PassName): string {
  switch (name) {
    case 'Image':
      return 'image.glsl';
    case 'BufferA':
      return 'bufferA.glsl';
    case 'BufferB':
      return 'bufferB.glsl';
    case 'BufferC':
      return 'bufferC.glsl';
    case 'BufferD':
      return 'bufferD.glsl';
  }
}

/**
 * Parse a channel value (string shorthand or object) into normalized ChannelJSONObject.
 *
 * String shortcuts:
 * - "BufferA", "BufferB", etc. → buffer reference
 * - "keyboard" → keyboard input
 * - "audio" → microphone audio input
 * - "webcam" → webcam video input
 * - "photo.jpg" (with extension) → texture file
 */
export function parseChannelValue(value: ChannelValue): ChannelJSONObject | null {
  if (typeof value === 'string') {
    if (isPassName(value)) {
      return { buffer: value };
    }
    if (value === 'keyboard') {
      return { keyboard: true };
    }
    if (value === 'audio') {
      return { audio: true };
    }
    if (value === 'webcam') {
      return { webcam: true };
    }
    // Assume texture (file path)
    return { texture: value };
  }
  // Already an object
  return value;
}

/** The ordered list of pass names for iteration. */
export const PASS_ORDER = ['Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD'] as const;

/** The four buffer pass names (excludes Image). */
export const BUFFER_PASS_NAMES: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD'];

/** The four channel keys. */
export const CHANNEL_KEYS = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const;

/** Default layout for projects. */
export const DEFAULT_LAYOUT = 'default' as const;

/** Default controls setting. */
export const DEFAULT_CONTROLS = false;

/** Default theme. */
export const DEFAULT_THEME = 'light' as const;
