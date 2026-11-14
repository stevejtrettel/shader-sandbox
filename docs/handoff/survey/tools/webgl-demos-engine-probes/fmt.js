import { Engine } from '/src/engine/Engine.ts'
import { compileProject } from '/src/project/compiler.ts'
const R = {}; window.__R = R;
for (const f of ['rgba8','rgb8','rg8','r8','rgba16f','rgb16f','rg16f','r16f','rgba32f','rgb32f','rg32f','r32f']) {
  for (const dim of ['2d','3d']) {
    try { const c=document.createElement('canvas'); const p = compileProject({ meta:{title:'t'}, buffers:{a:{format:f, dimension:dim, resolution: dim==='2d'?[4,4]:[4,4,4]}}, passes:{ a:'void main(){fragColor=vec4(1);}', screen:'void main(){fragColor=texture(a, '+(dim==='2d'?'uv':'vec3(uv,0.5)')+');}' } }); const e = await Engine.create(p,c); const gl=e.core.gl; while(gl.getError()); e.step(); R[f+'/'+dim] = 'ok glErr='+gl.getError(); e.destroy() } catch(x){ R[f+'/'+dim] = String(x).slice(0,80) }
  }
}
// >16 buffers
try { const buffers={}, passes={}; let s='vec4(0.0)'; for(let i=0;i<40;i++){ buffers['b'+i]={format:'rgba8',resolution:[2,2]}; s+=`+texelFetch(b${i},ivec2(0),0)` } passes.screen=`void main(){fragColor=${s};}`; const c=document.createElement('canvas'); const e=await Engine.create(compileProject({meta:{title:'t'},buffers,passes}),c); const gl=e.core.gl; while(gl.getError()); e.step(); R.forty_buffers='compileErrs='+e.getCompilationErrors().map(x=>x.rawError.slice(0,120)).join(';')+' glErr='+gl.getError()+' maxUnits='+gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)+'/'+gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) } catch(x){ R.forty_buffers=String(x).slice(0,200) }
window.__done = true
