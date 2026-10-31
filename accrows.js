const nz=s=>String(s==null?'':s).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/ة/g,'ه').replace(/\u200c/g,' ').replace(/[()\-.،]/g,' ').replace(/\s+/g,' ').trim();
function parseAcc(t){
  const un=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&amp;/g,'&');
  const out=[];
  for(const r of (t.match(/<Row\b[\s\S]*?<\/Row>/g)||[])){
    const c=[...r.matchAll(/<Cell\b[^>]*?(?:\/>|>([\s\S]*?)<\/Cell>)/g)].map(m=>{const d=(m[1]||'').match(/<Data[^>]*>([\s\S]*?)<\/Data>/);return d?un(d[1]).trim():''});
    if(c.length!==9)continue;
    const q=parseFloat(c[4]),m=parseInt(c[8]);
    if(!c[0]||isNaN(q)||isNaN(m))continue;
    out.push([nz(c[0]),c[1],c[2],nz(c[3]),q,parseFloat(c[5])||0,m]);
  }
  return out;
}

console.log(JSON.stringify(parseAcc(require('fs').readFileSync(process.argv[2],'utf8'))))
