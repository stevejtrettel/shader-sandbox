import { App } from '/src/app/App.ts'
const R = {}; window.__R = R;
const sleep = ms => new Promise(r => setTimeout(r, ms))
function readTex(engine, name) {
  const gl = engine.core.gl; const pair = engine.framebuffers.get(name)
  const tex = pair.alt ? (pair.current==='main'?pair.main.texture:pair.alt.texture) : pair.main.texture
  const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  const px = new Float32Array(4); gl.readPixels(0,0,1,1,gl.RGBA,gl.FLOAT,px)
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.deleteFramebuffer(fbo); return Array.from(px).map(v=>+v.toFixed(3))
}
async function scenario(mode) {
  document.getElementById('app').innerHTML = ''
  const project = { meta:{title:'t'},
    buffers:{ gs:{ format:'rgba32f', resolution:[8,8], init:[1,0,0,0] }, cnt:{ format:'rgba32f', resolution:[8,8] } },
    passes:{ cnt:`void main(){ fragColor = texelFetch(cnt,pixel,0) + vec4(1.0, uDeltaTime, 0, 0); }`, screen:`void main(){ fragColor = vec4(texelFetch(gs,ivec2(0),0).rgb, 1.0); }` } }
  const app = new App({ project, initialTimeMode: mode })
  const ev = []; app.on('frame', e => ev.push({ f:e.frame, t:+e.time.toFixed(3), dt:+e.deltaTime.toFixed(3) }))
  await sleep(1200)
  const o = { mode }
  const eng = app.getEngine()
  o.colorInit_fixedBuffer_atStartup = readTex(eng, 'gs')
  o.pageUptime_s = +(performance.now()/1000).toFixed(2)
  o.before_reset = ev.slice(-2)
  ev.length = 0; app.reset(); await sleep(300)
  o.after_reset_first_events = ev.slice(0, 3); o.events_in_300ms_after_reset = ev.length
  o.cnt_after_reset = readTex(eng,'cnt')
  o.colorInit_fixedBuffer_afterReset = readTex(eng, 'gs')
  app.pause(); await sleep(1500); ev.length = 0; app.resume(); await sleep(200)
  o.after_1500ms_pause_first_events = ev.slice(0, 3); o.events_in_200ms_after_resume = ev.length
  app.destroy(); return o
}
R.realtime = await scenario('realtime')
R.fixed = await scenario('fixed')
window.__done = true
