/**
 * Mandelbrot-Julia Demo Script
 *
 * Displays the current Julia parameter (c value) based on where the user
 * clicks in the Mandelbrot view.
 */

export function onFrame(api, time, deltaTime, frame) {
  // Get the Mandelbrot view's mouse state
  const mandelbrot = api.getCrossViewState('mandelbrot');
  if (!mandelbrot) return;

  const [mx, my] = mandelbrot.mouse;
  const [w, h] = mandelbrot.resolution;

  // Check if user has ever clicked (mouse position will be 0,0 if never interacted)
  if (mx === 0 && my === 0) {
    api.setOverlay('top-left', 'z → z² + c\nc = -0.70 + 0.27i [default]', 'julia');
    return;
  }

  // Map mouse position to complex plane (same math as shader)
  // x: [-2.5, 1.0], y: [-1.5, 1.5]
  const uvX = mx / w;
  const uvY = my / h;
  const cx = -2.5 + uvX * 3.5;  // mix(-2.5, 1.0, uvX)
  const cy = -1.5 + uvY * 3.0;  // mix(-1.5, 1.5, uvY)

  // Format c as complex number with proper sign for imaginary part
  const sign = cy >= 0 ? '+' : '-';
  const cStr = `${cx.toFixed(2)} ${sign} ${Math.abs(cy).toFixed(2)}i`;

  api.setOverlay('top-left', `z → z² + c\nc = ${cStr}`, 'julia');
}
