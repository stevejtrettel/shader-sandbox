// Click to Place Demo
//
// Demonstrates setArrayElement and setActiveCount:
// - Click the canvas to place points one at a time
// - Each click updates a single element (no full array repack)
// - Active count grows with each placed point

let count = 0;
let canvas = null;
const MAX_POINTS = 256;

function onClick(e) {
  if (count >= MAX_POINTS) return;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = 1.0 - (e.clientY - rect.top) / rect.height;

  // Update just this one element — much cheaper than resending everything
  this.engine.setArrayElement('points', count, [x, y]);
  count++;
  this.engine.setActiveCount('points', count);
}

export function setup(engine, { isRestore }) {
  if (isRestore) return;

  canvas = document.querySelector('canvas');
  if (!canvas) return;

  // Bind engine to the handler so it can call setArrayElement
  const handler = onClick.bind({ engine });
  canvas.addEventListener('click', handler);

  // Store for cleanup
  canvas._clickHandler = handler;
}

export function dispose() {
  if (canvas && canvas._clickHandler) {
    canvas.removeEventListener('click', canvas._clickHandler);
  }
}
