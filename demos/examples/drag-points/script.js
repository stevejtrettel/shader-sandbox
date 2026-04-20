// Drag Points — interactive Voronoi
//
// Click to place points, drag to move them.
// Demonstrates setStructArrayElement for real-time single-element updates
// and setActiveCount for a growing point set.

let count = 0;
let canvas = null;
let engine = null;
let dragging = -1; // index of point being dragged, or -1

const MAX_POINTS = 64;
const GRAB_RADIUS = 0.04; // in UV space

// Stored positions (for hit-testing during drag)
const positions = [];

function uvFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  return [
    (e.clientX - rect.left) / rect.width,
    1.0 - (e.clientY - rect.top) / rect.height,
  ];
}

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function findNearest(uv) {
  let best = -1, bestDist = GRAB_RADIUS;
  for (let i = 0; i < count; i++) {
    const dx = uv[0] - positions[i][0];
    const dy = uv[1] - positions[i][1];
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function onMouseDown(e) {
  const uv = uvFromEvent(e);
  const hit = findNearest(uv);

  if (hit >= 0) {
    // Start dragging existing point
    dragging = hit;
  } else if (count < MAX_POINTS) {
    // Place a new point
    const hue = count * 137.508; // golden angle
    const color = hslToRgb(hue, 0.7, 0.55);

    positions.push(uv);
    engine.setStructArrayElement('seeds', count, { pos: uv, color });
    count++;
    engine.setActiveCount('seeds', count);
  }
}

function onMouseMove(e) {
  if (dragging < 0) return;
  const uv = uvFromEvent(e);
  positions[dragging] = uv;
  // Update only this one element's position — color stays the same
  engine.setStructArrayElement('seeds', dragging, { pos: uv });
}

function onMouseUp() {
  dragging = -1;
}

export function setup(eng, { isRestore }) {
  engine = eng;
  if (isRestore) return;

  canvas = document.querySelector('canvas');
  if (!canvas) return;

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

export function dispose() {
  if (canvas) canvas.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}
