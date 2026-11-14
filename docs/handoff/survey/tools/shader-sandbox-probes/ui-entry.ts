import { mount } from '/home/user/shader-sandbox/src/mount';
import { buildShaderProject } from '/home/user/shader-sandbox/src/project/loadProjectCore';

const NONE: any = [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }];
const GLSL = `void mainImage(out vec4 o, in vec2 c){ o = vec4(uSpeed*0.1, uOn?1.0:0.0, 0.0, 1.0); }`;
const GLSL_DECL = `uniform float uSpeed; uniform bool uOn;\n` + GLSL;

function mk(opts: any, script: any) {
  return buildShaderProject({
    mode: 'standard', root: 'test', commonSource: null,
    passes: { Image: { name: 'Image', glslSource: opts.glsl, channels: NONE } },
    uniforms: {
      uSpeed: { type: 'float', value: 1.0, min: 0, max: 5 },
      uOn: { type: 'bool', value: false },
    },
    script, ...opts.extra,
  } as any);
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const out: any = {};
function host(id: string) {
  const d = document.createElement('div'); d.id = id;
  d.style.cssText = 'width:320px;height:200px;position:relative';
  document.body.appendChild(d); return d;
}

async function run() {
  // --- which GLSL compiles (auto-injected uniforms or not)?
  for (const [k, glsl] of [['noDecl', GLSL], ['withDecl', GLSL_DECL]] as const) {
    const el = host('probe-' + k);
    try {
      const h = mount(el, { project: mk({ glsl }, null) });
      await sleep(200);
      out['compile_' + k] = { errorOverlay: !!el.querySelector('.shader-error-overlay'),
        msg: el.querySelector('.error-content')?.textContent?.slice(0, 120) ?? null };
      h.destroy();
    } catch (e) { out['compile_' + k] = 'threw ' + e; }
    el.remove();
  }
  const glsl = out.compile_noDecl?.errorOverlay ? GLSL_DECL : GLSL;

  // --- A/B: stats OFF. script sets uSpeed=3 on frame; record frame args
  for (const stats of [false, true]) {
    const frames: number[] = [];
    let changeCalls = 0;
    const script = {
      onFrame(engine: any, t: number, dt: number, frame: number) {
        frames.push(frame);
        if (frames.length === 3) { engine.setUniformValue('uSpeed', 3.0); engine.setUniformValue('uOn', true); }
      },
      onUniformChange() { changeCalls++; },
    };
    const el = host('ab-' + stats);
    const h = mount(el, { project: mk({ glsl }, script), stats });
    await sleep(4000);
    const slider = el.querySelector<HTMLInputElement>('.uniform-control-float .uniform-control-slider');
    const valueText = el.querySelector('.uniform-control-float .uniform-control-value')?.textContent;
    const checkbox = el.querySelector<HTMLInputElement>('.uniform-control-bool input[type=checkbox]');
    const r: any = {
      framesSeenFirst8: frames.slice(0, 8), nFrames: frames.length,
      distinctFrames: [...new Set(frames)].length,
      engine_uSpeed: h.getUniform('uSpeed'), engine_uOn: h.getUniform('uOn'),
      slider_value: slider?.value, slider_text: valueText, checkbox_checked: checkbox?.checked,
      hasStatsDom: !!el.querySelector('.stats-container'),
    };
    // handle.setUniform path
    h.setUniform('uSpeed', 4.5);
    await sleep(100);
    r.afterHandleSet = { engine: h.getUniform('uSpeed'), slider: slider?.value, onUniformChangeCalls: changeCalls };
    // UI path: user moves slider -> engine + hook
    if (slider) { slider.value = '2'; slider.dispatchEvent(new Event('input', { bubbles: true })); }
    await sleep(50);
    r.afterUserInput = { engine: h.getUniform('uSpeed'), onUniformChangeCalls: changeCalls };
    out['stats_' + stats] = r;

    if (!stats) {
      // --- destroy check
      const styleCountBefore = document.querySelectorAll('style').length;
      h.destroy();
      out.destroy = {
        childCount: el.childElementCount, attrs: [...el.attributes].map(a => a.name),
        classList: el.className, styleTagsRemaining: document.querySelectorAll('style,link[rel=stylesheet]').length,
        styleCountBefore,
      };
      try { h.destroy(); out.destroy.secondDestroy = 'ok'; } catch (e) { out.destroy.secondDestroy = 'threw ' + e; }
      try { h.setUniform('uSpeed', 1); out.destroy.setAfterDestroy = 'no throw'; } catch (e) { out.destroy.setAfterDestroy = 'threw ' + e; }
    } else h.destroy();
    el.remove();
  }

  // --- E: author toolbar; move main slider, open screenshot panel, compare
  {
    const el = host('shot');
    const h = mount(el, { project: mk({ glsl }, null), authorTools: true });
    await sleep(300);
    const slider = el.querySelector<HTMLInputElement>('.uniforms-panel .uniform-control-slider')!;
    slider.value = '4'; slider.dispatchEvent(new Event('input', { bubbles: true }));
    const btn = [...el.querySelectorAll<HTMLElement>('.control-button')].find(b => b.title.startsWith('Screenshot'));
    btn?.click();
    await sleep(200);
    const shotSlider = el.querySelector<HTMLInputElement>('.screenshot-panel .uniform-control-slider');
    out.screenshotPanel = { opened: !!el.querySelector('.screenshot-panel'), engine: h.getUniform('uSpeed'),
      mainSlider: slider.value, screenshotPanelSlider: shotSlider?.value ?? null };
    if (shotSlider) { shotSlider.value = '0.5'; shotSlider.dispatchEvent(new Event('input', { bubbles: true })); }
    out.screenshotPanel.afterPanelEdit = { engine: h.getUniform('uSpeed'), mainSlider: slider.value };
    // --- F: a11y census on full author chrome
    const all = [...el.querySelectorAll('*')];
    out.a11y = {
      elements: all.length,
      withAria: all.filter(e => [...e.attributes].some(a => a.name.startsWith('aria-'))).length,
      withRole: all.filter(e => e.hasAttribute('role')).length,
      labels: el.querySelectorAll('label').length,
      labelsWithFor: el.querySelectorAll('label[for]').length,
      labelsWrappingInput: [...el.querySelectorAll('label')].filter(l => l.querySelector('input')).length,
      inputs: el.querySelectorAll('input,select,textarea').length,
      inputsWithAccessibleName: [...el.querySelectorAll<HTMLInputElement>('input,select,textarea')].filter(i => (i.labels && i.labels.length) || i.getAttribute('aria-label') || i.title).length,
      buttons: el.querySelectorAll('button').length,
      buttonsWithTitleOrText: [...el.querySelectorAll('button')].filter(b => b.title || b.textContent!.trim()).length,
      shadowRoots: all.filter(e => (e as any).shadowRoot).length,
      canvasAttrs: [...el.querySelector('canvas')!.attributes].map(a => a.name),
    };
    h.destroy(); el.remove();
  }

  // --- D: style leakage onto host page
  {
    const before = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary');
    document.documentElement.setAttribute('data-theme', 'dark');
    const after = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary');
    document.documentElement.removeAttribute('data-theme');
    const glass = getComputedStyle(document.documentElement).getPropertyValue('--glass-bg');
    let starRule = false, rootRules = 0, total = 0;
    const walk = (rules: CSSRuleList, inRM: boolean) => {
      for (const r of rules as any) {
        if (r.cssRules && r.conditionText !== undefined) walk(r.cssRules, inRM || /reduced-motion/.test(r.conditionText));
        else if (r.selectorText) { total++; if (inRM && /(^|,)\s*\*/.test(r.selectorText)) starRule = true; if (/:root/.test(r.selectorText)) rootRules++; }
      }
    };
    for (const s of document.styleSheets as any) { try { walk(s.cssRules, false); } catch {} }
    const probe = document.createElement('div'); probe.className = 'tab-button active'; document.body.appendChild(probe);
    const probe2 = document.createElement('span'); probe2.className = 'token keyword'; document.body.appendChild(probe2);
    out.styleLeak = {
      rootVarBefore: JSON.stringify(before), rootVarWhenHostUsesDataThemeDark: JSON.stringify(after),
      glassVarOnRoot: JSON.stringify(glass.trim().slice(0, 40)),
      globalStarRuleUnderReducedMotion: starRule, rootSelectors: rootRules, totalStyleRules: total,
      hostDivWithClass_tab_button: { padding: getComputedStyle(probe).padding, cursor: getComputedStyle(probe).cursor },
    };
  }

  // --- G/H: DOM facts behind two webgl-demos claims
  {
    const c = document.createElement('canvas'); c.width = 2; c.height = 2;
    const ctx = c.getContext('2d')!;
    const img = new ImageData(new Uint8ClampedArray([255,0,0,255, 255,0,0,255, 0,0,255,255, 0,0,255,255]), 2, 2); // row0 red, row1 blue
    ctx.save(); ctx.translate(0, 2); ctx.scale(1, -1); ctx.putImageData(img, 0, 0); ctx.restore();
    const top = ctx.getImageData(0, 0, 1, 1).data;
    out.putImageDataIgnoresTransform = { topRowAfter_flip_attempt: [...top], row0WasRed: true };
    const d = document.createElement('div'); d.innerHTML = '<canvas class="g" width="300" height="100"></canvas>';
    const g = d.querySelector('canvas')!; const rect = g.getBoundingClientRect();
    out.detachedCanvasRect = { w: rect.width, h: rect.height };
  }
}
run().catch(e => { out.fatal = String(e && e.stack || e); }).finally(() => {
  const pre = document.createElement('pre'); pre.id = 'RESULT'; pre.textContent = JSON.stringify(out, null, 1);
  document.body.appendChild(pre); document.title = 'DONE';
});
