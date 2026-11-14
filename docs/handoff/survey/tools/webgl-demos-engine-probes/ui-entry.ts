import { App } from '/home/user/webgl-demos/src/app/App';
import { PerformancePanel } from '/home/user/webgl-demos/src/panels/PerformancePanel/PerformancePanel';
import { BufferViewerPanel } from '/home/user/webgl-demos/src/panels/BufferViewerPanel/BufferViewerPanel';
import { PreviewPanel } from '/home/user/webgl-demos/src/panels/PreviewPanel/PreviewPanel';
import { ParamsPanel } from '/home/user/webgl-demos/src/panels/ParamsPanel/ParamsPanel';
import { ControlsPanel } from '/home/user/webgl-demos/src/panels/ControlsPanel/ControlsPanel';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const out: any = {};
const shader = `void main(){ fragColor = vec4(uA, uV.x, float(uMode)*0.1 + uP.x + (uB?0.1:0.0), 1.0) * vec4(uC,1.0) + uQ*0.0; }`;
const bufShader = `void main(){ fragColor = vec4(uv.y > 0.5 ? 1.0 : 0.0, 0.0, uv.y > 0.5 ? 0.0 : 1.0, 1.0); }`; // top half red, bottom blue
const project: any = {
  meta: { title: 't' },
  buffers: { bufA: { format: 'rgba8', resolution: [4, 4], pingPong: false }, bufF: { format: 'rgba16f', resolution: [4, 4], pingPong: false } },
  passes: { bufA: bufShader, bufF: bufShader, screen: shader },
  params: {
    uA: { type: 'float', default: 0.5, min: 0, max: 1, group: 'G1' },
    uB: { type: 'bool', default: false, group: 'G1' },
    uV: { type: 'vec2', default: [0, 0], min: -1, max: 1, ui: 'sliders', group: 'G2' },
    uP: { type: 'vec2', default: [0, 0], min: -1, max: 1, ui: '2d-pad', group: 'G2' },
    uQ: { type: 'vec4', default: [0, 0, 0, 0], group: 'G2' },
    uC: { type: 'vec3', default: [1, 1, 1], ui: 'color', group: 'G3' },
    uMode: { type: 'enum', default: 0, options: ['a', 'b', 'c'], group: 'G3' },
    uO: { type: 'float', default: 0.5, min: 0, max: 1, overlay: true },
    rnd: { type: 'button', label: 'Randomize', action: 'randomize', group: 'G3' },
    custom: { type: 'button', label: 'Custom', action: 'myAction', group: 'G3' },
  },
  presets: { P1: { uA: 0.9, uB: true, uV: [0.5, 0.5], uP: [0.5, 0.5], uQ: [0.3, 0.3, 0.3, 0.3], uC: [1, 0, 0], uMode: 2, uO: 0.1 } },
};
async function run() {
  const host = document.createElement('div'); host.style.cssText = 'width:700px;height:400px'; document.body.appendChild(host);
  let perf!: PerformancePanel, bufv!: BufferViewerPanel, controls!: ControlsPanel;
  const panels: any[] = [];
  const layout = (app: any, container: HTMLElement) => {
    container.style.cssText = 'display:grid;grid-template-columns:1fr 300px;width:100%;height:100%';
    const left = document.createElement('div'); left.style.cssText = 'position:relative;overflow:hidden';
    const right = document.createElement('div'); right.style.cssText = 'overflow:auto';
    const preview = new PreviewPanel(); const params = new ParamsPanel();
    perf = new PerformancePanel(); bufv = new BufferViewerPanel(); controls = new ControlsPanel();
    out.perfCanvasAtConstruct = { w: (perf as any).graphCanvas.width, h: (perf as any).graphCanvas.height };
    for (const p of [preview, params, perf, bufv, controls]) { p.attach(app); panels.push(p); }
    app.setParamsPanel(params);
    left.appendChild(preview.element); right.append(params.element, controls.element, perf.element, bufv.element);
    container.append(left, right);
  };
  const app: any = new App({ project, container: host, layout: layout as any, theme: 'dark' });
  await sleep(1500);
  out.engineErrors = app.getEngine()?.hasErrors?.() ? app.getEngine().getCompilationErrors().map((e: any) => e.passName + ': ' + e.message).slice(0, 3) : 'none';
  out.running = app.isRunning();
  out.bodyDataTheme = document.body.getAttribute('data-theme');
  out.perfCanvasAfterAttachInDom = { w: (perf as any).graphCanvas.width, h: (perf as any).graphCanvas.height, fpsText: perf.element.querySelector('.fps-display')?.textContent };
  const q = (s: string) => host.querySelector<any>(s);
  const ctl = (name: string) => (panels[1] as any).paramControls.get(name) as HTMLElement;
  const snap = () => ({
    uA_slider: ctl('uA').querySelector<HTMLInputElement>('.param-slider')!.value,
    uB_checkbox: ctl('uB').querySelector<HTMLInputElement>('.param-checkbox')!.checked,
    uV_sliders: [...ctl('uV').querySelectorAll<HTMLInputElement>('.param-slider')].map(s => s.value),
    uP_handle: [ctl('uP').querySelector<HTMLElement>('.param-vec2-handle')!.style.left, ctl('uP').querySelector<HTMLElement>('.param-vec2-handle')!.style.top],
    uQ_numeric: [...ctl('uQ').querySelectorAll<HTMLInputElement>('.param-vec-input')].map(s => s.value),
    uC_color: ctl('uC').querySelector<HTMLInputElement>('.param-color')!.value,
    uMode_select: ctl('uMode').querySelector<HTMLSelectElement>('.param-enum')!.value,
    uO_overlaySlider: q('.overlay-param-slider')?.value,
    store: Object.fromEntries(['uA', 'uB', 'uV', 'uP', 'uQ', 'uC', 'uMode', 'uO'].map(n => [n, app.getParam(n)])),
  });
  out.initial = snap();
  out.ui = { groups: host.querySelectorAll('.param-group').length, presetSelect: !!q('.preset-select'), overlayPanel: !!q('.overlay-controls-panel'),
    overlayInParamsPanel: !!(panels[1] as any).paramControls.get('uO') };
  // preset via UI
  const ps = q('.preset-select'); ps.value = 'P1'; ps.dispatchEvent(new Event('change'));
  await sleep(100);
  out.afterPreset = snap();
  // programmatic (script-like) write
  app.setParam('uA', 0.25);
  out.afterProgrammaticSet_uA = { slider: ctl('uA').querySelector<HTMLInputElement>('.param-slider')!.value, store: app.getParam('uA') };
  // randomize button
  const errs: string[] = []; const oe = console.error; console.error = (...a: any[]) => { errs.push(a.map(String).join(' ').slice(0, 100)); };
  [...host.querySelectorAll<HTMLButtonElement>('.param-button')].find(b => b.textContent === 'Randomize')!.click();
  await sleep(50); console.error = oe;
  out.afterRandomize = { uA: app.getParam('uA'), uMode: app.getParam('uMode'), uV: app.getParam('uV'), consoleErrors: errs.slice(0, 3) };
  // controls panel vs external pause
  app.pause(); out.controlsAfterExternalPause = { appRunning: app.isRunning(), buttonText: controls.element.querySelector('.play-pause-btn')!.textContent };
  app.start(); await sleep(400);
  // buffer viewer
  const readTop = (name: string) => { (bufv as any).selectedBuffer = name; (bufv as any).updateDisplay();
    const c = (bufv as any).displayCanvas as HTMLCanvasElement; const d = c.getContext('2d')!.getImageData(0, 0, 1, 1).data;
    return { size: [c.width, c.height], topLeftPixelOnScreen: [...d], label: (bufv as any).resolutionDisplay.textContent }; };
  const gl = app.getCanvas().getContext('webgl2');
  out.bufferViewer_rgba8 = readTop('bufA');   // GL top (uv.y>0.5) is red; a correct viewer shows red at top
  out.bufferViewer_rgba16f = readTop('bufF'); out.glErrorAfterFloatRead = gl.getError();
  // destroy
  app.destroy(); await sleep(50);
  out.afterDestroy = { hostChildren: host.childElementCount, hostHasParamsPanel: !!q('.params-panel'), bodyDataTheme: document.body.getAttribute('data-theme'),
    panelsStillAttached: panels.map(p => p.app !== null) };
  let threw = null; try { ctl('uA').querySelector<HTMLInputElement>('.param-slider')!.dispatchEvent(new Event('input')); } catch (e) { threw = String(e); }
  out.afterDestroy.sliderInputAfterDestroy = threw ?? 'no throw';
}
run().catch(e => { out.fatal = String(e && e.stack || e); }).finally(() => {
  const pre = document.createElement('pre'); pre.id = 'RESULT'; pre.textContent = JSON.stringify(out, null, 1); document.body.appendChild(pre);
});
