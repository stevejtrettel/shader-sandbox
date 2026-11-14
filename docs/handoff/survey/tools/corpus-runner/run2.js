const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://127.0.0.1:5391';
const projects = process.argv.slice(2);
(async () => {
  let browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const results = [];
  for (const proj of projects) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 640 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [], warns = [], failed = [], logs = [];
    page.on('console', m => { const t = m.type(); const s = m.text().slice(0, 400); if (/WebSocket|\[vite\]/.test(s)) return; if (t === 'error') errors.push(s); else if (t === 'warning') warns.push(s); else logs.push(s); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e.message).slice(0, 400)));
    page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().replace(BASE, '')); });
    const entry = fs.existsSync('/home/user/webgl-demos/' + proj + '/main.ts') ? '/' + proj + '/main.ts' : null;
    const r = { proj, entry };
    if (!entry) { r.status = 'NO_ENTRY'; results.push(r); await ctx.close(); continue; }
    await page.route('**/__run.html', route => route.fulfill({ contentType: 'text/html', body:
      `<!DOCTYPE html><html><head><script type="module" src="/@vite/client"></script><link rel="stylesheet" href="/src/styles/index.css"><style>#app{width:100%;height:100%}</style></head><body><div id="app"></div><script type="module" src="${entry}"></script></body></html>` }));
    try {
      await page.goto(BASE + '/__run.html', { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3500);
      r.info = await Promise.race([new Promise(res => setTimeout(() => res({ evalTimeout: true }), 25000)), page.evaluate(() => new Promise(res => {
        const c = document.querySelector('canvas');
        if (!c) return res({ canvas: false, text: document.body.innerText.slice(0, 300) });
        const gl = c.getContext('webgl2');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const t = document.createElement('canvas'); t.width = 64; t.height = 64;
          const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64);
          const d = x.getImageData(0, 0, 64, 64).data; const set = new Set(); let sum = 0;
          for (let i = 0; i < d.length; i += 4) { set.add((d[i] << 16) | (d[i+1] << 8) | d[i+2]); sum += d[i] + d[i+1] + d[i+2]; }
          const errEl = document.querySelector('.error-panel, .fallback-error, [class*="error"]');
          res({ canvas: true, w: c.width, h: c.height, gl: !!gl, lost: gl ? gl.isContextLost() : null, colors: set.size, mean: Math.round(sum / (64*64*3)),
                errText: errEl ? errEl.innerText.slice(0, 300) : null });
        }));
      }))]);
      await page.screenshot({ timeout: 20000, path: 'shots/' + proj.replace(/\//g, '__') + '.png' });
    } catch (e) { r.exc = String(e).slice(0, 300); }
    r.errors = errors.slice(0, 6); r.nErrors = errors.length; r.warns = warns.slice(0, 3); r.failed = failed.slice(0, 5);
    results.push(r);
    console.log(JSON.stringify(r));
    try { await ctx.close(); } catch (e) { try { await browser.close(); } catch (e2) {} browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] }); }
  }
  await browser.close();
})();
