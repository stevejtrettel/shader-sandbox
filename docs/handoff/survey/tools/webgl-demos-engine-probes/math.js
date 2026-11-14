import { Engine } from '/src/engine/Engine.ts'
import { compileProject } from '/src/project/compiler.ts'
const R = {}; window.__R = R;
function mk(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c }
function readTex(engine, name, x, y) {
  const gl = engine.core.gl; const pair = engine.framebuffers.get(name)
  const tex = pair.alt ? (pair.current==='main'?pair.main.texture:pair.alt.texture) : pair.main.texture
  const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  const px = new Float32Array(4); gl.readPixels(x,y,1,1,gl.RGBA,gl.FLOAT,px)
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(fbo); return Array.from(px).map(v=>+v.toFixed(4))
}
const sizes = { scr:'inherit', sq:[64,64], wide:[128,32], tall:[32,64] }
async function probe(mathSpace, cw=400, ch=200) {
  const buffers = {}, passes = {}
  for (const [k,res] of Object.entries(sizes)) {
    buffers[k] = { format:'rgba32f', resolution: res, pingPong:false }
    buffers[k+'_m'] = { format:'rgba32f', resolution: res, pingPong:false }
    passes[k] = `void main(){ fragColor = vec4(pos, uv); }`
    passes[k+'_m'] = `void main(){ fragColor = vec4(mousePos, uPixelSize, uMathSpace.z); }`
  }
  passes.screen = `void main(){ fragColor = vec4(1.0); }`
  const p = compileProject({ meta:{title:'t'}, mathSpace, buffers, passes })
  const e = await Engine.create(p, mk(cw,ch))
  e.setParameter('uMouse', [cw*0.25, ch*0.25, 0, 0])   // mouse at canvas uv (0.25, 0.25)
  e.step()
  const out = {}
  for (const k of Object.keys(sizes)) {
    const q = e.framebuffers.get(k); const W=q.width, H=q.height
    const bl = readTex(e,k,0,0), tr = readTex(e,k,W-1,H-1), m = readTex(e,k+'_m',0,0)
    // extrapolate from pixel centres to the true edges
    const ex = (a,b,n)=>{ const d=(b-a)/(n-1); return [+(a-d/2).toFixed(4), +(b+d/2).toFixed(4)] }
    out[k] = { size:[W,H], pos_x_range: ex(bl[0],tr[0],W), pos_y_range: ex(bl[1],tr[1],H), mousePos: m.slice(0,2), uPixelSize: m[2], true_dx: +((tr[0]-bl[0])/(W-1)).toFixed(5), true_dy: +((tr[1]-bl[1])/(H-1)).toFixed(5), uMathSpaceAspect: m[3] }
  }
  return out
}
for (const [name, ms] of [['default_screen', undefined], ['buffer_sq', 'sq'], ['aspect_1', {aspect:1}], ['buffer_wide','wide'], ['nonexistent_canvas','canvas']]) {
  try { R[name] = await probe(ms) } catch(e){ R[name] = 'THROW '+e }
}
window.__done = true
