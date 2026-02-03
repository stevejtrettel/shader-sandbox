/**
 * InputManager - Mouse, touch, and keyboard input tracking
 *
 * Tracks all input state without calling into the engine.
 * App reads state each frame and forwards to engine.
 */

import type { MouseState, TouchState, PointerData } from './types';

// Map from KeyboardEvent.code to Shadertoy-compatible ASCII keycodes (0-255).
// This replaces the deprecated e.keyCode property.
const CODE_TO_ASCII: Record<string, number> = {};
// Letters: KeyA-KeyZ -> 65-90
for (let i = 0; i < 26; i++) {
  CODE_TO_ASCII[`Key${String.fromCharCode(65 + i)}`] = 65 + i;
}
// Digits: Digit0-Digit9 -> 48-57
for (let i = 0; i < 10; i++) {
  CODE_TO_ASCII[`Digit${i}`] = 48 + i;
}
// Function keys: F1-F12 -> 112-123
for (let i = 1; i <= 12; i++) {
  CODE_TO_ASCII[`F${i}`] = 111 + i;
}
// Common keys
Object.assign(CODE_TO_ASCII, {
  Backspace: 8, Tab: 9, Enter: 13, ShiftLeft: 16, ShiftRight: 16,
  ControlLeft: 17, ControlRight: 17, AltLeft: 18, AltRight: 18,
  Pause: 19, CapsLock: 20, Escape: 27, Space: 32,
  PageUp: 33, PageDown: 34, End: 35, Home: 36,
  ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
  Insert: 45, Delete: 46,
  NumLock: 144, ScrollLock: 145,
  Semicolon: 186, Equal: 187, Comma: 188, Minus: 189,
  Period: 190, Slash: 191, Backquote: 192,
  BracketLeft: 219, Backslash: 220, BracketRight: 221, Quote: 222,
});

/**
 * Convert a KeyboardEvent to a Shadertoy-compatible ASCII keycode (0-255).
 * Returns null if the key doesn't map to a valid code.
 */
function keyEventToAscii(e: KeyboardEvent): number | null {
  const code = CODE_TO_ASCII[e.code];
  if (code !== undefined && code >= 0 && code < 256) {
    return code;
  }
  return null;
}

export interface KeyEvent {
  keycode: number;
  down: boolean;
}

export class InputManager {
  readonly mouse: MouseState = [0, 0, 0, 0];
  isMouseDown = false;
  readonly touchState: TouchState = {
    count: 0,
    touches: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    pinch: 1.0,
    pinchDelta: 0.0,
    pinchCenter: [0, 0],
  };

  /** Callback fired on first user gesture (for media init). */
  onFirstGesture: (() => void) | null = null;

  private canvas: HTMLCanvasElement;
  private pixelRatio: number;
  private activePointers: Map<number, PointerData> = new Map();
  private gestureTriggered = false;
  private keyEvents: KeyEvent[] = [];

  // Store bound handlers for cleanup
  private keydownHandler: (e: KeyboardEvent) => void;
  private keyupHandler: (e: KeyboardEvent) => void;

  constructor(canvas: HTMLCanvasElement, pixelRatio: number) {
    this.canvas = canvas;
    this.pixelRatio = pixelRatio;

    this.setupMouseTracking();
    this.setupTouchTracking();

    // Keyboard tracking
    this.keydownHandler = (e: KeyboardEvent) => {
      const keycode = keyEventToAscii(e);
      if (keycode !== null) {
        this.keyEvents.push({ keycode, down: true });
      }
    };
    this.keyupHandler = (e: KeyboardEvent) => {
      const keycode = keyEventToAscii(e);
      if (keycode !== null) {
        this.keyEvents.push({ keycode, down: false });
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
  }

  /**
   * Drain and return accumulated key events since last call.
   */
  getAndClearKeyEvents(): KeyEvent[] {
    const events = this.keyEvents;
    this.keyEvents = [];
    return events;
  }

  /**
   * Clean up all event listeners.
   */
  dispose(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
  }

  private triggerGesture(): void {
    if (this.gestureTriggered) return;
    this.gestureTriggered = true;
    this.onFirstGesture?.();
  }

  private setupMouseTracking(): void {
    const getCoords = (e: MouseEvent): [number, number] => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * this.pixelRatio;
      const y = (rect.height - (e.clientY - rect.top)) * this.pixelRatio; // Flip Y
      return [x, y];
    };

    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      const [x, y] = getCoords(e);
      this.isMouseDown = true;
      this.mouse[0] = x;
      this.mouse[1] = y;
      this.mouse[2] = x;  // Click origin (positive = pressed)
      this.mouse[3] = y;

      this.triggerGesture();
    });

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isMouseDown) return;
      const [x, y] = getCoords(e);
      this.mouse[0] = x;
      this.mouse[1] = y;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      // Negate zw to signal mouse is no longer held
      this.mouse[2] = -Math.abs(this.mouse[2]);
      this.mouse[3] = -Math.abs(this.mouse[3]);
    });
  }

  private setupTouchTracking(): void {
    // Prevent default touch actions (scroll, zoom) on canvas
    this.canvas.style.touchAction = 'none';

    const getCanvasCoords = (clientX: number, clientY: number): [number, number] => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * this.pixelRatio;
      const y = (rect.height - (clientY - rect.top)) * this.pixelRatio; // Flip Y
      return [x, y];
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Only track touch and pen (mouse is handled separately)
      if (e.pointerType === 'mouse') return;

      const [x, y] = getCanvasCoords(e.clientX, e.clientY);

      this.activePointers.set(e.pointerId, {
        id: e.pointerId,
        x, y,
        startX: x,
        startY: y,
      });

      // Capture pointer to receive events even outside canvas
      this.canvas.setPointerCapture(e.pointerId);

      this.updateTouchState();

      // Single touch also updates iMouse for compatibility
      if (this.activePointers.size === 1) {
        this.isMouseDown = true;
        this.mouse[0] = x;
        this.mouse[1] = y;
        this.mouse[2] = x; // Click origin (positive = pressed)
        this.mouse[3] = y;
      }

      e.preventDefault();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;

      const pointer = this.activePointers.get(e.pointerId);
      if (!pointer) return;

      const [x, y] = getCanvasCoords(e.clientX, e.clientY);
      pointer.x = x;
      pointer.y = y;

      this.updateTouchState();

      // Single touch also updates iMouse
      if (this.activePointers.size === 1) {
        this.mouse[0] = x;
        this.mouse[1] = y;
      }

      e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;

      this.activePointers.delete(e.pointerId);
      this.canvas.releasePointerCapture(e.pointerId);

      // Negate zw when all touches released
      if (this.activePointers.size === 0) {
        this.isMouseDown = false;
        this.mouse[2] = -Math.abs(this.mouse[2]);
        this.mouse[3] = -Math.abs(this.mouse[3]);
      }

      this.updateTouchState();
      e.preventDefault();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      // Same as pointer up - finger lifted or system interrupted
      handlePointerUp(e);
    };

    this.canvas.addEventListener('pointerdown', handlePointerDown);
    this.canvas.addEventListener('pointermove', handlePointerMove);
    this.canvas.addEventListener('pointerup', handlePointerUp);
    this.canvas.addEventListener('pointercancel', handlePointerCancel);
  }

  private updateTouchState(): void {
    const pointers = Array.from(this.activePointers.values());
    const count = pointers.length;

    this.touchState.count = count;

    // Update individual touch points (up to 3)
    for (let i = 0; i < 3; i++) {
      if (i < pointers.length) {
        const p = pointers[i];
        this.touchState.touches[i] = [p.x, p.y, p.startX, p.startY];
      } else {
        this.touchState.touches[i] = [0, 0, 0, 0];
      }
    }

    // Calculate pinch gesture (requires 2 fingers)
    if (count >= 2) {
      const p1 = pointers[0];
      const p2 = pointers[1];

      // Current distance
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      // Initial distance (from start positions)
      const sdx = p2.startX - p1.startX;
      const sdy = p2.startY - p1.startY;
      const startDistance = Math.sqrt(sdx * sdx + sdy * sdy);

      // Pinch scale relative to start
      if (startDistance > 0) {
        const newPinch = currentDistance / startDistance;
        this.touchState.pinchDelta = newPinch - this.touchState.pinch;
        this.touchState.pinch = newPinch;
      }

      // Pinch center
      this.touchState.pinchCenter = [
        (p1.x + p2.x) / 2,
        (p1.y + p2.y) / 2,
      ];
    } else {
      // Reset pinch when less than 2 fingers
      this.touchState.pinchDelta = 0;
      // Keep pinch at current value (don't reset to 1.0 until all fingers lift)
      if (count === 0) {
        this.touchState.pinch = 1.0;
        this.touchState.pinchCenter = [0, 0];
      }
    }
  }
}
