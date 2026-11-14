import { Engine } from '/src/engine/Engine.ts'
import { compileProject, compileShader, generateUniforms } from '/src/project/compiler.ts'

const R = {}; window.__R = R;
function mk(w=300,h=150){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c }
function readCur(engine, name, x=0, y=0) {
  const gl = engine.core.gl; const pair = engine.framebuffers.get(name)
  const tex = pair.alt ? (pair.current==='main'?pair.main.texture:pair.alt.texture) : pair.main.texture
  const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  const px = new Float32Array(4); gl.readPixels(x,y,1,1,gl.RGBA,gl.FLOAT,px)
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(fbo); return Array.from(px)
}
function readMain(engine, name, x=0,y=0){ const gl=engine.core.gl; const pair=engine.framebuffers.get(name); gl.bindFramebuffer(gl.FRAMEBUFFER,pair.main.fbo); const px=new Float32Array(4); gl.readPixels(x,y,1,1,gl.RGBA,gl.FLOAT,px); gl.bindFramebuffer(gl.FRAMEBUFFER,null); return Array.from(px)}
async function run(name, fn){ try { R[name] = await fn() } catch(e){ R[name] = 'THROW: '+String(e).slice(0,500) } }
const buf = (extra={}) => ({ format:'rgba32f', resolution:[4,4], ...extra })

// ---- T2 ordering -------------------------------------------------------
async function ordering(order, iters) {
  const passes = {}
  const A = `void main(){ fragColor = texelFetch(a, pixel, 0) + vec4(1.0, float(uFrame), uTime, 0.0); }`
  const B = `void main(){ fragColor = vec4(texelFetch(a, pixel, 0).r, texelFetch(b, pixel, 0).g + 1.0, 0.0, 0.0); }`
  for (const k of order) passes[k] = k==='a'?A:B
  passes.screen = `void main(){ fragColor = vec4(1.0); }`
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf(), b:buf()}, passes, computeIterationsPerFrame: iters })
  const e = await Engine.create(p, mk())
  const out = []
  for (let f=0; f<3; f++){ e.step(); out.push({ a: readCur(e,'a')[0], b_seesA: readCur(e,'b')[0], b_count: readCur(e,'b')[1], aFrameSum: readCur(e,'a')[1] }) }
  return out
}
await run('order_A_then_B_iter1', () => ordering(['a','b'],1))
await run('order_B_then_A_iter1', () => ordering(['b','a'],1))
await run('order_A_then_B_iter3', () => ordering(['a','b'],3))
await run('order_B_then_A_iter3', () => ordering(['b','a'],3))

// two passes writing same buffer
await run('two_passes_same_buffer', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf()}, passes:{
    a1:{ shader:`void main(){ vec4 s=texelFetch(a,pixel,0); fragColor = vec4(s.r+1.0, s.g, 0,0); }`, output:'a' },
    a2:{ shader:`void main(){ vec4 s=texelFetch(a,pixel,0); fragColor = vec4(s.r, s.g + s.r, 0,0); }`, output:'a' },
    screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); const o=[]; for(let i=0;i<3;i++){ e.step(); o.push(readCur(e,'a').slice(0,2)) } return o })

// partial write: second pass writes only .g? can't; show that a pass which does not write (discard) exposes the stale texture
await run('discard_exposes_two_steps_old', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf()}, passes:{
    a:`void main(){ if (uFrame % 2 == 0) discard; fragColor = vec4(float(uFrame)); }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); const o=[]; for(let i=0;i<6;i++){ e.step(); o.push(readCur(e,'a')[0]) } return o })

// non-pingpong self read
await run('nonpingpong_self_read', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf({pingPong:false})}, passes:{
    a:`void main(){ fragColor = texelFetch(a,pixel,0) + 1.0; }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); const gl=e.core.gl; while(gl.getError()); e.step(); const err=gl.getError(); e.step(); return { glError: err, value: readCur(e,'a')[0] } })
await run('nonpingpong_chain', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf({pingPong:false}), b:buf({pingPong:false})}, passes:{
    a:`void main(){ fragColor = vec4(float(uFrame)); }`, b:`void main(){ fragColor = texelFetch(a,pixel,0)*10.0; }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); const gl=e.core.gl; e.step(); e.step(); return { err: gl.getError(), b: readCur(e,'b')[0] } })

// ---- T8 init colour at startup / reset ----------------------------------
await run('color_init_fixed_buffer', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf({init:[0.25,0.5,0.75,1]}), inh:{format:'rgba32f', init:[0.25,0.5,0.75,1]}}, passes:{ screen:`void main(){fragColor=texelFetch(a,pixel,0);}` } })
  const e = await Engine.create(p, mk()); const o = { atCreate_fixed: readCur(e,'a'), atCreate_inherit: readCur(e,'inh') }
  e.resize(320,160); o.afterResize_fixed = readCur(e,'a'); o.afterResize_inherit = readCur(e,'inh')
  e.reset(); o.afterReset_fixed = readCur(e,'a'); return o })
await run('init_shader_sees_other_buffers_and_frame', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf({init:`void main(){ fragColor = vec4(7.0, float(uFrame), mousePos); }`}), b:buf({init:`void main(){ fragColor = texelFetch(a,pixel,0) + 1.0; }`})}, passes:{ screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); const o={ a: readCur(e,'a'), b: readCur(e,'b') }; e.step(); e.step(); e.setParameter('uTime', 5); e.reset(); o.afterReset_a = readCur(e,'a'); return o })
await run('readBuffer_main_vs_current', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:{format:'rgba8', resolution:[4,4]}}, passes:{ a:`void main(){ fragColor = vec4(float(uFrame)/10.0); }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); const o=[]; for(let i=0;i<4;i++){ e.step(); o.push({frame:e.frame, readBuffer_r: e.readBuffer('a').data[0], expected: Math.round(e.frame/10*255)}) } return o })
await run('readBuffer_float_buffer', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf({pingPong:false})}, passes:{ a:`void main(){ fragColor = vec4(0.5); }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); e.step(); const gl=e.core.gl; while(gl.getError()); const d = e.readBuffer('a').data[0]; return { data0: d, glErr: gl.getError() } })

// ---- 3D -------------------------------------------------------------------
await run('volume3d', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{v:{format:'rgba32f', dimension:'3d', resolution:[4,4,4], pingPong:true, init:[0.5,0.5,0.5,0.5]}, probe:buf()}, passes:{
    v:`void main(){ fragColor = vec4(float(uLayer), uLayerNorm, uResolution.z, uVResolution.z) ; }`,
    probe:`void main(){ fragColor = texelFetch(v, ivec3(0,0,pixel.x), 0); }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); const gl=e.core.gl; while(gl.getError());
  const o={}; e.step(); o.layers = [0,1,2,3].map(x=>readCur(e,'probe',x,0)); o.errAfterStep = gl.getError(); e.reset(); o.errAfterReset = gl.getError(); 
  // probe volume after reset w/o running v pass: use a raw read of current texture layers
  const pair=e.framebuffers.get('v'); const tex = pair.current==='main'?pair.main.texture:pair.alt.texture; const fbo=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fbo); o.afterResetLayers=[];
  for(let l=0;l<4;l++){ gl.framebufferTextureLayer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,tex,0,l); const px=new Float32Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.FLOAT,px); o.afterResetLayers.push(px[0]) }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); return o })
await run('volume3d_depth1_layerNorm', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{v:{format:'rgba32f', dimension:'3d', resolution:[2,2,1], pingPong:false}, probe:buf()}, passes:{ v:`void main(){ fragColor = vec4(uLayerNorm); }`, probe:`void main(){ fragColor = texelFetch(v, ivec3(0), 0); }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); e.step(); return String(readCur(e,'probe')[0]) })

// ---- T7 matrices ---------------------------------------------------------
await run('cube_default_vertex_shader', async () => {
  const p = compileProject({ meta:{title:'t'}, passes:{ screen:{ shader:`void main(){ fragColor = vec4(vNormal*0.5+0.5,1.0); }`, geometry:{type:'cube'} } } })
  const e = await Engine.create(p, mk()); const errs = e.getCompilationErrors().map(x=>x.rawError.slice(0,200)); let stepErr=null; try { e.step() } catch(x){ stepErr=String(x) } return { compileErrors: errs, stepErr } })
await run('cube_custom_vertex_no_matrix', async () => {
  const p = compileProject({ meta:{title:'t'}, passes:{ screen:{ shader:`void main(){ fragColor = vec4(vNormal*0.5+0.5,1.0); }`, vertex:`void main(){ vNormal=aNormal; vPosition=aPosition; vUV=aUV; gl_Position=vec4(aPosition*0.5,1.0); }`, geometry:{type:'cube'} } } })
  const e = await Engine.create(p, mk()); let stepErr=null; try { e.step() } catch(x){ stepErr=String(x) } let setErr=null; try { e.setParameter('uModel', new Array(16).fill(0)) } catch(x){ setErr=String(x) } return { stepErr, setErr } })
await run('common_with_PI_breaks_vertex', async () => {
  const p = compileProject({ meta:{title:'t'}, common:`float twoPi(){ return 2.0*PI; }`, passes:{ screen:`void main(){ fragColor = vec4(twoPi()); }` } })
  const e = await Engine.create(p, mk()); return e.getCompilationErrors().map(x=>({pass:x.passName, raw:x.rawError.slice(0,160), isFromCommon:x.isFromCommon, line:x.originalLine})) })
await run('common_with_fragColor_breaks_vertex', async () => {
  const p = compileProject({ meta:{title:'t'}, common:`void put(vec3 c){ fragColor = vec4(c,1.0); }`, passes:{ screen:`void main(){ put(vec3(1.0)); }` } })
  const e = await Engine.create(p, mk()); return e.getCompilationErrors().map(x=>({pass:x.passName, raw:x.rawError.slice(0,160)})) })

// ---- T4 injection --------------------------------------------------------
async function compiles(src, common) { const p = compileProject({ meta:{title:'t'}, common, passes:{ screen: src } }); const e = await Engine.create(p, mk()); const errs=e.getCompilationErrors(); return errs.length? errs.map(x=>x.rawError.replace(/\n/g,' | ').slice(0,220)) : 'OK' }
const cases = {
  plain: `void main(){ fragColor = vec4(uv, pos); }`,
  main_void: `void main(void){ fragColor = vec4(uv, 0.0, 1.0); }`,
  main_void_no_use: `void main(void){ fragColor = vec4(1.0); }`,
  brace_next_line: `void main()\n{\n fragColor = vec4(uv,0,1); }`,
  commented_main_first: `// void main() { old }\nvoid main(){ fragColor = vec4(uv,0,1); }`,
  block_commented_main_first: `/* void main() { fragColor = vec4(0); } */\nvoid main(){ fragColor = vec4(uv,0,1); }`,
  redeclare_uv: `void main(){ vec2 uv = gl_FragCoord.xy/uResolution.xy; fragColor = vec4(uv,0,1); }`,
  redeclare_pos_vec3: `void main(){ vec3 pos = vec3(1.0); fragColor = vec4(pos,1); }`,
  helper_uses_uv: `vec3 shade(){ return vec3(uv,0.0); }\nvoid main(){ fragColor = vec4(shade(),1); }`,
  global_named_pos: `vec2 pos = vec2(0.0);\nvoid main(){ fragColor = vec4(pos,0,1); }`,
  function_named_pos: `float pos(float x){ return x; }\nvoid main(){ fragColor = vec4(pos(1.0)); }`,
  function_named_pixel_called: `float pixel(float x){ return x; }\nvoid main(){ fragColor = vec4(pixel(1.0)); }`,
  param_shadow_in_helper_ok: `vec3 shade(vec2 uv){ return vec3(uv,0.0); }\nvoid main(){ fragColor = vec4(shade(uv),1); }`,
  nested_scope_redeclare_ok: `void main(){ { vec2 uv = vec2(0.0); fragColor = vec4(uv,0,1); } }`,
  macro_main: `#define ENTRY void main()\nENTRY { fragColor = vec4(uv,0,1); }`,
  no_main_mainImage: `void mainImage(out vec4 c, in vec2 f){ c = vec4(1.0); }`,
  user_declares_buffer_uniform: `uniform float uTime;\nvoid main(){ fragColor = vec4(uTime); }`,
  user_declares_own_out: `out vec4 myColor;\nvoid main(){ myColor = vec4(1.0); }`,
  include_directive_runtime: `#include "@lib/math/random"\nvoid main(){ fragColor = vec4(1.0); }`,
  version_directive_in_source: `#version 300 es\nvoid main(){ fragColor = vec4(1.0); }`,
  precision_int_param: `void main(){ fragColor = vec4(float(uFrame)); }`,
}
R.injection = {}
for (const [k, src] of Object.entries(cases)) { try { R.injection[k] = await compiles(src) } catch(e){ R.injection[k] = 'THROW '+String(e).slice(0,200) } }
R.injected_text = compileShader({ uniforms:'', common:'', source:`// void main() { }\nvoid main(){ fragColor=vec4(1); }` }).split('// === Shader Source ===')[1]

// ---- T6 error line mapping -----------------------------------------------
async function errLine(src, common, params) { const p = compileProject({ meta:{title:'t'}, common, params, buffers: {a:buf()}, passes:{ screen: src } }); const e = await Engine.create(p, mk()); const x=e.getCompilationErrors()[0]; if(!x) return 'no error'; const m = x.rawError.match(/ERROR:\s*\d+:(\d+)/); const cl = +m[1]; return { glLine: cl, glLineText: x.compiledSource.split('\n')[cl-1], reported_originalLine: x.originalLine, isFromCommon: x.isFromCommon, msg: x.message } }
const userErr = `// line1\n// line2\nvoid main(){\n  float x = undefinedThing; // true line 4\n  fragColor = vec4(x);\n}`
await run('errmap_user_noCommon', () => errLine(userErr, undefined))
await run('errmap_user_withCommon', () => errLine(userErr, `// c1\nfloat f(float x){ return x; }\n// c3`))
await run('errmap_user_before_main_withCommon', () => errLine(`float g(){ return undefinedThing; } // true line 1\nvoid main(){ fragColor=vec4(g()); }`, `// c1\nfloat f(float x){ return x; }\n// c3`))
await run('errmap_inCommon', () => errLine(`void main(){ fragColor = vec4(f(1.0)); }`, `// c1\nfloat f(float x){ return undefinedThing; } // true common line 2\n// c3`))

// ---- params -----------------------------------------------------------------
await run('param_types', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf()}, params:{ f:{type:'float',default:0.5}, i:{type:'int',default:3}, b:{type:'bool',default:true}, e:{type:'enum',default:2,options:['x','y','z']}, v2:{type:'vec2',default:[1,2]}, v3:{type:'vec3',default:[1,2,3]}, v4:{type:'vec4',default:[1,2,3,4]}, btn:{type:'button',label:'x',action:'reset'}, txt:{type:'text',default:'hello'}, col:{type:'color',default:[1,0,0]} },
    passes:{ a:`void main(){ fragColor = vec4(f + float(i) + (b?10.0:0.0) + float(e)*100.0, v2.y, v3.z, v4.w); }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); e.step(); return { errs: e.getCompilationErrors().length, val: readCur(e,'a'), uniforms: generateUniforms(p).split('\n').filter(l=>/ (f|i|b|e|v2|v3|v4|btn|txt|col);/.test(l)) } })
await run('uniform_list', async () => generateUniforms(compileProject({ meta:{title:'t'}, buffers:{velocity:'rgba16f', vol:{format:'r8',dimension:'3d',resolution:[2,2,2]}}, textures:{img:{source:'x',filter:'linear',wrap:'clamp'}}, passes:{screen:'void main(){}'} }), true).split('\n'))
await run('legacy_array_passes', async () => { compileProject({ meta:{title:'t'}, passes:[{name:'r', source:'void main(){}', output:'screen'}] }); return 'no throw' })
await run('string_pass_key_not_buffer', async () => { const p=compileProject({ meta:{title:'t'}, buffers:{a:buf()}, passes:{ a:'void main(){fragColor=vec4(1);}', a_second:'void main(){fragColor=vec4(1);}', screen:'void main(){fragColor=vec4(1);}' } }); await Engine.create(p, mk()); return 'no throw' })
await run('buffer_named_screen', async () => { const p=compileProject({ meta:{title:'t'}, buffers:{screen:buf()}, passes:{ screen:'void main(){fragColor=vec4(1);}' } }); const e=await Engine.create(p, mk()); e.step(); return { errs:e.getCompilationErrors().length, screenBufferValue: readCur(e,'screen')[0] } })
await run('frame_and_time_per_iteration', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:buf()}, computeIterationsPerFrame:4, passes:{ a:`void main(){ vec4 s=texelFetch(a,pixel,0); fragColor = vec4(s.r+1.0, s.g+float(uFrame), s.b+uDeltaTime, 0); }`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk()); e.setParameter('uDeltaTime', 0.25); e.step(); return readCur(e,'a') })
await run('initial_resolution_small_canvas', async () => {
  const p = compileProject({ meta:{title:'t'}, buffers:{a:{format:'rgba8', resolution:'initial'}}, passes:{ a:`void main(){fragColor=vec4(1);}`, screen:`void main(){fragColor=vec4(1);}` } })
  const e = await Engine.create(p, mk(300,150)); const o=[]; const sz=()=>{const q=e.framebuffers.get('a'); return [q.width,q.height]}; o.push(sz()); e.resize(500,400); o.push(sz()); e.resize(900,850); o.push(sz()); e.resize(1200,1000); o.push(sz()); e.resize(400,300); o.push(sz()); return o })
window.__done = true
