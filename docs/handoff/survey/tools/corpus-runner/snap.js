// Compare the stock engine (immediate swap = sequential) with an in-memory patched engine
// (swaps deferred to the end of each compute iteration = snapshot, last writer wins).
// Nothing on disk is modified: the patch is applied to the HTTP response for Engine.ts.
const { chromium } = require('playwright');
const proj = process.argv[2]; const waitMs = +(process.argv[3] || 6000);
const BASE = 'http://127.0.0.1:5391';
(async () => {
  for (const mode of ['sequential', 'snapshot']) {
    const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
    const ctx = await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); const errors = [];
    page.on('console', m => { if (m.type() === 'error' && !/WebSocket|\[vite\]/.test(m.text())) errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', e => errors.push('PAGEERROR ' + e.message.slice(0, 200)));
    await page.route('**/__run.html', route => route.fulfill({ contentType: 'text/html', body:
      `<!DOCTYPE html><html><head><link rel="stylesheet" href="/src/styles/index.css"><style>#app{width:100%;height:100%}</style></head><body><div id="app"></div><script type="module" src="/${proj}/main.ts"></script></body></html>` }));
    if (mode === 'snapshot') await page.route('**/src/engine/Engine.ts*', async route => {
      const resp = await route.fetch(); let body = await resp.text();
      const a = 'outputBuffer.current = outputBuffer.current === "main" ? "alt" : "main";';
      const b = 'for (const pass of computePasses) {\n        this.executePass(pass);\n      }';
      if (!body.includes(a) || !body.includes(b)) throw new Error('patch anchors not found');
      body = body.replace(a, '(this.__pend ??= new Set()).add(outputBuffer);');
      body = body.replace(b, b + '\n      for (const pb of (this.__pend ?? [])) pb.current = pb.current === "main" ? "alt" : "main"; this.__pend?.clear();');
      // screen passes: flush before display too (already flushed per iteration)
      await route.fulfill({ response: resp, body });
    });
    await page.goto(BASE + '/__run.html', { waitUntil: 'load' });
    await page.waitForTimeout(waitMs);
    const stats = await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
      const c = document.querySelector('canvas'); const t = document.createElement('canvas'); t.width = 128; t.height = 128;
      const x = t.getContext('2d'); x.drawImage(c, 0, 0, 128, 128); const d = x.getImageData(0, 0, 128, 128).data; let s = 0, nz = 0, sat = 0; const set = new Set();
      for (let i = 0; i < d.length; i += 4) { const v = d[i] + d[i+1] + d[i+2]; s += v; if (v > 30) nz++; if (v >= 3 * 250) sat++; set.add((d[i] << 16) | (d[i+1] << 8) | d[i+2]); }
      res({ mean: +(s / (128*128*3)).toFixed(2), litFrac: +(nz / (128*128)).toFixed(3), satFrac: +(sat / (128*128)).toFixed(3), colors: set.size });
    }))));
    await page.screenshot({ path: `shots/SNAP_${mode}_` + proj.replace(/\//g, '__') + '.png' });
    console.log(JSON.stringify({ proj, mode, stats, errors: errors.slice(0, 2) }));
    await browser.close();
  }
})();
