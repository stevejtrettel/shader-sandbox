const { open, chromium, S } = require('./harness');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const mod = process.argv[2] || 'engine.js';
  const { page, logs } = await open(browser, { src: `/__t/${mod}` });
  try { await page.waitForFunction(() => window.__done, null, { timeout: 120000 }); } catch (e) { console.log('TIMEOUT', e.message) }
  const R = await page.evaluate(() => window.__R);
  console.log(JSON.stringify(R, null, 1));
  const errs = logs.filter(l => /pageerror/.test(l)); for (const e of errs) console.log(e);
  if (process.argv[3]) for (const l of logs) console.log(l.slice(0,300));
  await browser.close();
})();
