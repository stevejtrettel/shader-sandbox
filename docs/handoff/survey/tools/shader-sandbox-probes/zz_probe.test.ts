import { describe, it, expect } from 'vitest';
import { ShaderEngine } from '../src/engine/ShaderEngine';
import { OfflineRenderer } from '../src/app/OfflineRenderer';
import { Transport } from '../src/app/Transport';
import { buildShaderProject } from '../src/project/loadProjectCore';

function fakeGL(log: any[]) {
  const consts: Record<string, number> = {};
  let n = 1000;
  return new Proxy({}, {
    get(_t, prop: string) {
      if (prop === 'canvas') return { width: 100, height: 50 };
      if (prop === 'drawingBufferWidth') return 100;
      if (prop === 'drawingBufferHeight') return 50;
      if (/^[A-Z0-9_]+$/.test(prop)) return (consts[prop] ??= n++);
      return (...args: any[]) => {
        if (prop === 'uniform1f' || prop === 'uniform1i') log.push([prop, args[0]?.name, args[1]]);
        if (prop === 'getUniformLocation') return { name: args[1] };
        if (prop === 'getShaderParameter' || prop === 'getProgramParameter') return true;
        if (prop === 'checkFramebufferStatus') return consts['FRAMEBUFFER_COMPLETE'] ??= n++;
        if (prop === 'getExtension') return {};
        if (prop === 'getParameter') return 16;
        if (prop === 'getUniformBlockIndex') return 0;
        if (prop === 'getShaderInfoLog' || prop === 'getProgramInfoLog') return '';
        return { id: prop };
      };
    },
  }) as any;
}

describe('probe', () => {
  it('engine.reset() does not clear lastStepTime -> first offline frame dt is garbage', () => {
    const log: any[] = [];
    const project = buildShaderProject({
      mode: 'standard', root: 'x', commonSource: null,
      passes: { Image: { name: 'Image', glslSource: 'void mainImage(out vec4 o, in vec2 c){o=vec4(iTimeDelta);}',
        channels: [{kind:'none'},{kind:'none'},{kind:'none'},{kind:'none'}] as any } },
    } as any);
    const engine = new ShaderEngine({ gl: fakeGL(log), project } as any);
    expect(engine.hasErrors()).toBe(false);
    // live playback reached t = 37.5
    engine.step(37.4, [0,0,0,0], false);
    engine.step(37.5, [0,0,0,0], false);
    log.length = 0;
    // offline render begins exactly like OfflineRenderer.record does
    const frames: any[] = [];
    const or = new OfflineRenderer({
      view: { engine } as any, transport: new Transport(() => 0),
      hasBufferPasses: () => false, hasOnFrameScript: () => true,
      runOnFrame: (t, dt, f) => frames.push([t, dt, f]),
      runSetup() {}, runSetupOrThrow() {}, notifyPauseState() {},
    });
    engine.reset();
    or.stepForRender(0, 60, 0);
    or.stepForRender(1, 60, 0);
    const dts = log.filter(l => l[1] === 'iTimeDelta').map(l => l[2]);
    const fr = log.filter(l => l[1] === 'iFrame').map(l => l[2]);
    const fps = log.filter(l => l[1] === 'iFrameRate').map(l => l[2]);
    console.log('iTimeDelta', dts, 'iFrame', fr, 'iFrameRate', fps, 'script', frames);
  });
});
