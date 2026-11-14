import { it, expect, vi } from 'vitest';
import fs from 'fs'; import path from 'path';
import { loadProjectFromFiles } from '/home/user/shader-sandbox/src/project/loadProjectCore';
import { validateMultiViewConfig } from '/home/user/shader-sandbox/src/project/configHelpers';
const R='/home/user/shader-sandbox';
function walk(d:string,out:string[]=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else out.push(p);}return out;}
const loader:any={
  async exists(p:string){return fs.existsSync(path.join(R,p))&&fs.statSync(path.join(R,p)).isFile();},
  async readText(p:string){return fs.readFileSync(path.join(R,p),'utf8');},
  async resolveImageUrl(p:string){return p;},
  async listGlslFiles(d:string){return fs.readdirSync(path.join(R,d)).filter(f=>f.endsWith('.glsl'));},
  async hasFiles(d:string){return fs.existsSync(path.join(R,d));},
  joinPath(...parts:string[]){return path.posix.normalize(parts.join('/'));},
  baseName(p:string){return path.basename(p);},
};
it('loads every demo', async () => {
  const dirs=new Set<string>();
  for(const base of ['demos','templates/shaders']) for(const f of walk(path.join(R,base))) if(/config\.json$|image\.glsl$/.test(f)) dirs.add(path.relative(R,path.dirname(f)));
  const warns:string[]=[]; vi.spyOn(console,'warn').mockImplementation((...a)=>{warns.push(a.join(' '))});
  const out:string[]=[];
  for(const d of [...dirs].sort()){
    warns.length=0;
    try{
      const cfgPath=path.join(R,d,'config.json');
      const cfg=fs.existsSync(cfgPath)?JSON.parse(fs.readFileSync(cfgPath,'utf8')):null;
      if(cfg&&Array.isArray(cfg.views)){ validateMultiViewConfig(cfg,d); out.push(`MV-OK ${d}`); continue; }
      const p:any=await loadProjectFromFiles(loader,d);
      out.push(`OK ${d} mode=${p.mode} passes=${Object.keys(p.passes).filter(k=>p.passes[k]).join('+')} ${warns.length?'WARN: '+warns.join(' | ').slice(0,200):''}`);
    }catch(e:any){ out.push(`FAIL ${d}: ${e.message.slice(0,300)}`); }
  }
  console.log(out.join('\n'));
});
