// Accumulates mouse drag into the hidden uRotation uniform.
// This runs on the CPU so rotation persists across drags.

let lon = 0;
let lat = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;
let canvas = null;

function onMouseDown(e) {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
}

function onMouseMove(e) {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;

  const sensitivity = 0.005;
  lon -= dx * sensitivity;
  lat += dy * sensitivity;
  lat = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, lat));
}

function onMouseUp() {
  dragging = false;
}

export function setup(engine, { isRestore }) {
  if (isRestore) return; // Don't re-add listeners on context restore
  canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
}

export function onFrame(engine) {
  engine.setUniformValue('uRotation', [lon, lat]);
}

export function dispose() {
  if (canvas) {
    canvas.removeEventListener('mousedown', onMouseDown);
  }
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}
