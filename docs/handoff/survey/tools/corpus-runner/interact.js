// usage: node interact.js W H proj fx fy [dragdx]
const { chromium } = require('playwright');
const [W, H, proj, fx, fy, drag] = [ +process.argv[2], +process.argv[3], process.argv[4], +process.argv[5], +process.argv[6], +(process.argv[7]||0) ];
const BASE = 'http://127.0.0.1:5391';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/WebSocket|\[vite\]/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message.slice(0, 200)));
  await page.route('**/__run.html', route => route.fulfill({ contentType: 'text/html', body:
    `<!DOCTYPE html><html><head><link rel="stylesheet" href="/src/styles/index.css"><style>#app{width:100%;height:100%}</style></head><body><div id="app"></div><script type="module" src="/${proj}/main.ts"></script></body></html>` }));
  await page.goto(BASE + '/__run.html', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const box = await page.locator('canvas').first().boundingBox();
  const grab = () => page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
    const c = document.querySelector('canvas'); const t = document.createElement('canvas'); t.width = 200; t.height = Math.round(200 * c.height / c.width);
    const x = t.getContext('2d'); x.drawImage(c, 0, 0, t.width, t.height); const d = x.getImageData(0, 0, t.width, t.height).data;
    res({ w: t.width, h: t.height, cw: c.width, ch: c.height, d: Array.from(d) });
  }))));
  const before = await grab();
  const px = box.x + fx * box.width, py = box.y + fy * box.height;
  await page.mouse.move(px, py); await page.mouse.down();
  await page.waitForTimeout(250);
  if (drag) { for (let i = 1; i <= 10; i++) { await page.mouse.move(px + drag * i / 10, py + drag * i / 20); await page.waitForTimeout(40); } }
  await page.mouse.up();
  await page.waitForTimeout(150);
  const after = await grab();
  let sx = 0, sy = 0, sw = 0, changed = 0, maxd = 0, mx = 0, my = 0;
  for (let j = 0; j < after.h; j++) for (let i = 0; i < after.w; i++) {
    const k = 4 * (j * after.w + i); const dd = Math.abs(after.d[k] - before.d[k]) + Math.abs(after.d[k+1] - before.d[k+1]) + Math.abs(after.d[k+2] - before.d[k+2]);
    if (dd > 12) { changed++; sx += i * dd; sy += j * dd; sw += dd; } if (dd > maxd) { maxd = dd; mx = i; my = j; }
  }
  const out = { proj, canvas: [after.cw, after.ch], box, pressFrac: [fx, fy], changedPx: changed, of: after.w * after.h,
    centroidFrac: sw ? [+(sx / sw / after.w).toFixed(3), +(sy / sw / after.h).toFixed(3)] : null, peakFrac: [+(mx / after.w).toFixed(3), +(my / after.h).toFixed(3)], maxd, errors: errors.slice(0, 3) };
  console.log(JSON.stringify(out));
  await page.screenshot({ path: 'shots/INTERACT_' + proj.replace(/\//g, '__') + `_${W}x${H}.png` });
  await browser.close();
})();
