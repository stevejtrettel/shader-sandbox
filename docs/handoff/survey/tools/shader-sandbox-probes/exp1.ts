import { buildFragmentShader } from './repo/src/engine/shaderSource';
import { computeStructLayout } from './repo/src/engine/std140';
import { validateConfig } from './repo/src/project/configHelpers';
const USER = `void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  fragColor = vec4(1.0);\n}`;
const def = { struct: { position: 'vec3', color: 'vec4' }, count: 8 } as any;
const r = buildFragmentShader(USER, [{kind:'none'},{kind:'none'},{kind:'none'},{kind:'none'}] as any, {
  commonSource: 'float sq(float x){return x*x;}',
  ubos: [{ name: 'pts', def: { type: 'vec3', count: 4 } as any, count: 4 }, { name: 'seeds', def, count: 8, structLayout: computeStructLayout(def.struct) }],
  uniforms: { uSpeed: { type: 'float', value: 1 }, pts: { type: 'vec3', count: 4 }, seeds: def },
});
console.log('=== SHADERTOY-BRANCH OUTPUT ===');
r.source.split('\n').forEach((l, i) => console.log(String(i + 1).padStart(3) + '| ' + l));
console.log(r.lineMapping);
const r2 = buildFragmentShader(USER, [] as any, { commonSource: '', ubos: [], uniforms: {}, namedSamplers: new Map([['velocity', { kind: 'buffer', buffer: 'BufferA', current: false }], ['kb', { kind: 'keyboard' }]]) as any });
console.log('=== NAMED BRANCH (kb sampler bound to keyboard, name != "keyboard") ===');
console.log(r2.source.includes('KEY_A'), r2.lineMapping);
r2.source.split('\n').slice(10, 40).forEach((l, i) => console.log(String(i + 11).padStart(3) + '| ' + l));
// cubemap cases
const cube = [{ kind: 'texture', name: 'tex0', cubemap: true }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }] as any;
const cases = [
  'texture(iChannel0, f(a) + g(b))',
  'texture(iChannel0, reflect(rd, n))',
  'texture(iChannel0, normalize(rd) * rot)',
  'texture(iChannel0, vec3(x).zyx)',
  'texture(iChannel0, rd, 2.0)',
  'textureLod(iChannel0, rd, 0.0)',
  'mytexture(iChannel0, rd)',
  'texture( iChannel0 , rd )',
  '// texture(iChannel0, rd)',
  'texture(iChannel0, (rd))',
  'texture(iChannel0,\n   rd)',
];
console.log('=== CUBEMAP ===');
for (const c of cases) {
  const out = buildFragmentShader(c, cube, { commonSource: '', ubos: [], uniforms: {} });
  const lines = out.source.split('\n'); const s = lines.slice(out.lineMapping.userCodeStartLine - 1, lines.indexOf('// Main wrapper') - 1).join('\\n');
  console.log(JSON.stringify(c), ' => ', s);
}
// marker spoof
const spoof = buildFragmentShader('float a;\n// User shader code\nvoid mainImage(out vec4 o, in vec2 c){o=vec4(0);}', [] as any, { commonSource: '', ubos: [], uniforms: {} });
console.log('=== marker spoof: userCodeStartLine', spoof.lineMapping, 'true first user line index', spoof.source.split('\n').indexOf('float a;') + 1);
// reserved names
for (const n of ['iMousePressed', 'iTime', 'fragColor', 'ST_PI', 'main', 'position', 'texture', 'gl_Foo', 'sampler3D', 'uint', 'iChannelTime', 'iSampleRate']) {
  try { validateConfig({ uniforms: { [n]: { type: 'float', value: 0 } } }, 't'); console.log('uniform name accepted:', n); } catch (e: any) { console.log('uniform name REJECTED:', n); }
}
try { validateConfig({ buffers: { iTime: {} , velocity:{}}, textures: { velocity_resolution: 'a.png', iResolution: 'b.png' } }, 't'); console.log('buffer named iTime / texture named iResolution accepted'); } catch (e: any) { console.log('rejected', e.message); }
