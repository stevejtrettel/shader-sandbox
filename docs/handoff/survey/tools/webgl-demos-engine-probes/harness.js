const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const S = __dirname;
const BASE = 'http://localhost:5199';
async function open(browser, {src, w=800, h=450, dpr=1}) {
  const ctx = await browser.newContext({ viewport: {width:w, height:h}, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text().slice(0,600)}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${String(e).slice(0,600)}`));
  await page.route('**/__t/**', async route => {
    const u = new URL(route.request().url());
    if (u.pathname.endsWith('page.html')) {
      const m = u.searchParams.get('m');
      return route.fulfill({ contentType: 'text/html', body:
        `<!DOCTYPE html><html><head><link rel="stylesheet" href="/src/styles/index.css"><style>html,body{margin:0;width:100%;height:100%}#app{width:100%;height:100%}</style></head><body><div id="app"></div><script type="module" src="${m}"></script></body></html>` });
    }
    const f = path.join(S, 't', path.basename(u.pathname));
    return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(f, 'utf8') });
  });
  await page.goto(`${BASE}/__t/page.html?m=${encodeURIComponent(src)}`);
  return { page, logs, ctx };
}
module.exports = { open, chromium, S };
