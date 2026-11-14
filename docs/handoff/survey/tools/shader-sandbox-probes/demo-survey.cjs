const fs=require('fs'),path=require('path');
const root='/home/user/shader-sandbox/demos';
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else out.push(p);}return out;}
const dirs=new Set();
for(const f of walk(root)){ if(/config\.json$|image\.glsl$/.test(f)) dirs.add(path.dirname(f)); }
for(const d of [...dirs].sort()){
  const files=fs.readdirSync(d).filter(f=>fs.statSync(path.join(d,f)).isFile());
  let c={};try{c=JSON.parse(fs.readFileSync(path.join(d,'config.json'),'utf8'))}catch(e){c={__noconfig:true}}
  const glsl=files.filter(f=>f.endsWith('.glsl'));
  const all=glsl.map(f=>fs.readFileSync(path.join(d,f),'utf8')).join('\n');
  const loc=all.split('\n').length;
  const feats=[];
  const P=['Image','BufferA','BufferB','BufferC','BufferD'];
  const passCfg=P.filter(p=>c[p]);
  const chans=[];
  for(const p of passCfg) for(const k of Object.keys(c[p])) if(/iChannel/.test(k)) chans.push(p+'.'+k+'='+JSON.stringify(c[p][k]));
  const u=c.uniforms||{};
  const ut={};
  for(const [n,v] of Object.entries(u)){ let t=v.struct?'struct[]':(v.count?v.type+'[]':v.type); if(v.data)t+='+data'; if(v.hidden)t+='(hidden)'; if(v.color)t+='(color)'; ut[t]=(ut[t]||0)+1;}
  const top=Object.keys(c).filter(k=>!P.includes(k)&&!['uniforms','buffers','textures','title','description','author'].includes(k)).map(k=>k+'='+JSON.stringify(c[k]));
  const g=[];
  for(const [k,re] of Object.entries({iMouse:/iMouse\b/,iMousePressed:/iMousePressed/,iFrame:/iFrame\b/,iTimeDelta:/iTimeDelta/,iDate:/iDate/,touch:/iTouch|iPinch/,key:/isKey|KEY_|keyboard/i,texLod:/textureLod|texelFetch/,cube:/samplerCube/,iChRes:/iChannelResolution/, dFd:/dFdx|fwidth/})) if(re.test(all)) g.push(k);
  console.log(`## ${path.relative(root,d)}\n  files: ${files.join(' ')} (${loc} glsl lines)\n  top: ${top.join(' ')}\n  buffers: ${JSON.stringify(c.buffers||null)} textures: ${JSON.stringify(c.textures||null)}\n  chans: ${chans.join(' ')}\n  uniforms: ${JSON.stringify(ut)}\n  glsl: ${g.join(',')}`);
}
