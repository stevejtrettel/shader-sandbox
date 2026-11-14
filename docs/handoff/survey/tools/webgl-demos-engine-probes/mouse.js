const { open, chromium, S } = require('./harness');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const { page, logs } = await open(browser, { src: `/new-demos/wave-equation/main.ts`, w: 1300, h: 400 });
  await page.waitForTimeout(2500);
  const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x:r.x, y:r.y, w:r.width, h:r.height } });
  console.log('canvas css box', box);
  const cx = box.x + box.w * 0.15, cy = box.y + box.h * 0.5;
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.waitForTimeout(400); await page.mouse.up();
  await page.mouse.move(box.x + box.w*0.9, box.y + box.h*0.9);
  await page.waitForTimeout(150);
  await page.evaluate(([x,y]) => { const d=document.createElement('div'); d.style.cssText=`position:fixed;left:${x-6}px;top:${y-6}px;width:12px;height:12px;border:2px solid lime;border-radius:50%;z-index:99999;pointer-events:none`; document.body.appendChild(d) }, [cx, cy]);
  await page.screenshot({ path: `${S}/shots/mouse-wave.png` });
  console.log('clicked at css', cx, cy, 'canvas-u', 0.15, 'predicted ripple u =', (0.15-0.5)/(box.w/box.h)+0.5, '=> css x', box.x + box.w*((0.15-0.5)/(box.w/box.h)+0.5));
  await browser.close();
})();
