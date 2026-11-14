import { loadDemo } from './repo/src/project/loaderHelper';
import { loadProjectFromFiles } from './repo/src/project/loadProjectCore';
import { UniformManager } from './repo/src/engine/UniformManager';
const GLSL = 'void mainImage(out vec4 o, in vec2 c) { o = vec4(1.0); }';
const lazy = <T,>(v: T) => async () => v;
async function tryLoad(label: string, cfg: any, extraGlsl: Record<string, string> = {}, extraJson: Record<string, any> = {}) {
  const glsl: any = { './d/image.glsl': lazy(GLSL) };
  for (const [k, v] of Object.entries(extraGlsl)) glsl[k] = lazy(v);
  const json: any = { './d/config.json': lazy(cfg) };
  for (const [k, v] of Object.entries(extraJson)) json[k] = lazy(v);
  try { const p: any = await loadDemo('d', glsl, json, {}); console.log(label, 'OK', JSON.stringify({ mode: p.mode, passes: Object.keys(p.passes ?? {}), ch: p.passes?.Image?.channels, ns: p.passes?.Image?.namedSamplers && [...p.passes.Image.namedSamplers], ud: p.uniformData, tex: p.textures })); }
  catch (e: any) { console.log(label, 'THROWS:', e.message.split('\n').join(' | ')); }
}
const origWarn = console.warn; console.warn = (...a: any[]) => console.log('   [warn]', ...a);
(async () => {
  await tryLoad('A data file via Vite-style loader', { uniforms: { pts: { type: 'vec3', count: 2, data: './data.json' } } }, {}, { './d/data.json': [[1, 2, 3], [4, 5, 6]] });
  await tryLoad('B image w/o image map', { Image: { iChannel0: 'photo.jpg' } });
  await tryLoad('C channel string typo "bufferA"', { mode: 'shadertoy', Image: { iChannel0: 'bufferA' } });
  await tryLoad('D channel "BufferA" not configured', { mode: 'shadertoy', Image: { iChannel0: 'BufferA' } });
  await tryLoad('E Image as channel source', { mode: 'shadertoy', Image: { iChannel0: 'Image' } });
  await tryLoad('F mode typo', { mode: 'shadertoyy', Image: { iChannel0: 'keyboard' } });
  await tryLoad('G named buffers; buffer named Image / iTime', { buffers: { iTime: {} } }, { './d/iTime.glsl': GLSL });
  await tryLoad('H named texture w/ source option attempt', { buffers: { a: {} }, Image: { source: 'x.glsl' } }, { './d/a.glsl': GLSL });
  await tryLoad('I uniform bad type w/ count (mat2 array)', { uniforms: { m: { type: 'mat2', count: 2 } } });
  await tryLoad('J int uniform non-integer value / min>max', { uniforms: { n: { type: 'int', value: 1.5, min: 5, max: 1 } } });
  await tryLoad('K scalar uniform with count:1 becomes array', { uniforms: { n: { type: 'float', value: 1, count: 1 } } });
  await tryLoad('L struct field named like GLSL keyword', { uniforms: { s: { struct: { 'float': 'vec3', 'a-b': 'float' }, count: 1 } } });
  await tryLoad('M channel object unknown', { mode: 'shadertoy', Image: { iChannel0: { foo: 1 } } });
  await tryLoad('N channel number', { mode: 'shadertoy', Image: { iChannel0: 5 } });
  await tryLoad('O video channel', { mode: 'shadertoy', Image: { iChannel0: { video: 'clip.mp4' } } });
  await tryLoad('P cubemap in named mode impossible; texture w/ "type"', { textures: { sky: 'sky.png' } });
  await tryLoad('Q shadertoy mode, bufferA.glsl present but not in config', { mode: 'shadertoy' }, { './d/bufferA.glsl': GLSL });
  await tryLoad('R filter typo on texture channel', { mode: 'shadertoy', Image: { iChannel0: { texture: 'a.png', filter: 'cubic', wrap: 'mirror' } } });

  // UniformManager with fake GL
  const gl: any = new Proxy({}, { get: (_t, k) => k === 'getParameter' ? () => 65536 : (typeof k === 'string' && k === k.toUpperCase() ? 1 : () => ({})) });
  const um = new UniformManager(gl, { pts: { type: 'vec3', count: 4 }, s: { struct: { p: 'vec3', w: 'float', c: 'vec4' }, count: 2 }, u: { type: 'vec3', value: [1, 2, 3] } } as any);
  um.setArrayUniform('pts', [[1, 2, 3], [4, 5, 6]]);
  const got = um.get('pts') as Float32Array;
  console.log('after setArrayUniform(2 of 4): getUniformValue length =', got.length, '(capacity is 12)');
  um.setArrayElement('pts', 3, [7, 8, 9]);
  console.log('after setArrayElement(3): store =', [...(um.get('pts') as Float32Array)], ' padded =', [...um.ubos[0].paddedData], 'active', um.ubos[0].activeCount);
  um.setArrayUniform('pts', [[9, 9, 9]]);
  console.log('scratch aliasing: store after 2nd setArrayUniform =', [...(um.get('pts') as Float32Array)]);
  um.setArrayUniform('pts', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  console.log('flat overflow (15 floats into cap 12): active', um.ubos[0].activeCount, 'store len', (um.get('pts') as Float32Array).length);
  um.set('u', new Float32Array([1, 2, 3]) as any);
  um.set('pts', [1, 2, 3] as any);
  console.log('plain number[] passed to setUniformValue for array: store =', um.get('pts'));
  const sl = (um.ubos[1] as any).layout; console.log('struct {vec3 p; float w; vec4 c} layout', sl.fields.map((f: any) => f.name + '@' + f.offsetBytes), 'stride', sl.strideBytes);
  um.setStructArrayUniform('s', { p: [[1, 2, 3], [4, 5, 6]] });
  um.setStructArrayUniform('s', { w: [7] });
  console.log('struct partial set: active', um.ubos[1].activeCount, 'padded', [...um.ubos[1].paddedData]);
})();
