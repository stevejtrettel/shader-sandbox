const { open, chromium, S } = require('./harness');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const list = process.argv.slice(2);
  for (const d of list) {
    const { page, logs, ctx } = await open(browser, { src: `/${d}/main.ts` });
    await page.waitForTimeout(+process.env.WAIT||3500);
    const info = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return { canvas: null };
      const gl = c.getContext('webgl2');
      return { w: c.width, h: c.height, glErr: gl ? gl.getError() : 'nogl', renderer: gl ? gl.getParameter(gl.VERSION) : null };
    });
    const name = d.replace(/\//g, '_');
    await page.screenshot({ path: `${S}/shots/${name}.png` });
    const errs = logs.filter(l => /^\[(error|pageerror|warning)\]/.test(l) && !/ebsocket|WebSocket/.test(l));
    console.log(`=== ${d} canvas=${JSON.stringify(info)} logs=${logs.length} errs=${errs.length}`);
    for (const e of errs.slice(0, 6)) console.log('   ', e.replace(/\n/g, ' | ').slice(0, 400));
    await ctx.close();
  }
  await browser.close();
})();
