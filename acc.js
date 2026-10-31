/* ---- accounting (حسابداری) ---- */
const nz=s=>String(s==null?'':s).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/ة/g,'ه').replace(/\u200c/g,' ').replace(/[()\-.،]/g,' ').replace(/\s+/g,' ').trim();
const NOISE=new Set(['آقای','اقای','خانم','نمایندگی','تهران','زرتشت','ولیعصر','کرج','مشهد','شیراز','عبدل','اباد','آباد'].map(w=>w.replace(/آ/g,'ا')));
const core=x=>x.replace(/آ/g,'ا').split(' ').filter(w=>w&&!NOISE.has(w)).join(' ');
const ACC_MAN={'میلاد قادریان تهران':'قادریان','پرده خانه ابریشم زرتشت':'خانه پرده ابریشم','کوکون مورکسی ارومیه':'کوکون مورکسی','فرشته پارک وی تهران':'فرشته پارک وی داوودپور','آقای دشتی رشت':'علی دشتی','رضایی شریعتی تهران':'آرمانی شریعتی','شانل ساری':'اشکان ساری'};
const ACC_NO=new Set([]);
function lev(a,b){const m=a.length,n=b.length;if(!m||!n)return 0;let p=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return 1-p[n]/Math.max(m,n)}
function hintOf(a){
  if(/عبدل اباد|عبدل آباد/.test(a))return s=>/عبدل/.test(s.sheet);
  if(/ کرج$/.test(a))return s=>/کرج/.test(s.sheet);
  if(/ مشهد$/.test(a))return s=>/مشهد/.test(s.sheet);
  if(/ تهران$/.test(a)||/زرتشت|ولیعصر/.test(a))return s=>/تهران|زرتشت|ولیعصر/.test(s.sheet);
  return null;
}
function matchShop(a,shops){
  const man=Object.keys(ACC_MAN).find(k=>nz(k)===a);
  if(man){const t=nz(ACC_MAN[man]);const s=shops.find(x=>nz(x.name)===t)||shops.find(x=>core(nz(x.name))===core(t));return s?{s,how:'manual'}:null}
  const ca=core(a);if(!ca)return null;
  const h=hintOf(a),pools=h?[shops.filter(h),shops]:[shops];
  for(const P of pools){
    let s=P.find(x=>core(nz(x.name))===ca)||P.find(x=>core(nz(x.name)).replace(/ /g,'')===ca.replace(/ /g,''));
    if(s)return {s,how:'exact'};
  }
  let best=null;
  for(const P of pools){for(const x of P){const r=lev(ca,core(nz(x.name)));if(r>=0.85&&(!best||r>best.r))best={s:x,r,how:'fuzzy'}}if(best)return best}
  return null;
}
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
let ACC=null;
const isAct=g=>/RION/i.test(g);
let CAL=[];
function buildCal(sheets){
  const c=parse(sheets).shops,mon={};D.shops.forEach(s=>mon[nz(s.name)]=s);
  c.forEach((s,i)=>{s.id=i;const m=mon[nz(s.name)];s.m=m?m.m.map(v=>v||0):Array(13).fill(0)});
  CAL=c;
}
function buildAcc(rows){
  if(!rows||!rows.length||!D){ACC=null;return}
  const cust={},code={};let maxM=0;
  rows.forEach(([c,d,k,g,q,a,m])=>{
    if(m>maxM)maxM=m;
    const u=cust[c]||(cust[c]={name:c,tot:0,act:0,amt:0,mo:Array(13).fill(0),codes:{},n:0});
    u.tot+=q;u.amt+=a;u.n++;u.mo[m]+=q;if(isAct(g))u.act+=q;
    const uc=u.codes[k]||(u.codes[k]={q:0,g,mo:Array(13).fill(0)});uc.q+=q;uc.mo[m]+=q;
    const o=code[k]||(code[k]={code:k,g,act:isAct(g),q:0,amt:0,mo:Array(13).fill(0),cu:{}});
    o.q+=q;o.amt+=a;o.mo[m]+=q;o.cu[c]=(o.cu[c]||0)+q;
  });
  const unm=[],fz=[];
  Object.values(cust).forEach(u=>{
    const r=matchShop(u.name,CAL);
    if(r){u.shop=r.s;u.how=r.how;if(r.how==='fuzzy')fz.push([u.name,r.s.name,r.r]);
      const s=r.s;s.acc=s.acc||{tot:0,act:0,mo:Array(13).fill(0),codes:{},cust:[]};
      s.acc.tot+=u.tot;s.acc.act+=u.act;u.mo.forEach((v,i)=>s.acc.mo[i]+=v);s.acc.cust.push(u.name);
      for(const k in u.codes){const t=s.acc.codes[k]||(s.acc.codes[k]={q:0,g:u.codes[k].g,mo:Array(13).fill(0)});t.q+=u.codes[k].q;u.codes[k].mo.forEach((v,i)=>t.mo[i]+=v)}
    }else unm.push(u);
  });
  CAL.forEach(s=>{if(!s.acc)s.acc={tot:0,act:0,mo:Array(13).fill(0),codes:{},cust:[]}});
  Object.values(code).forEach(o=>{o.nc=Object.values(o.cu).filter(v=>v>0).length;o.last=0;for(let i=12;i>=1;i--)if(o.mo[i]>0){o.last=i;break}});
  ACC={rows,cust,code,maxM,unm,fz,total:Object.values(cust).reduce((a,u)=>a+u.tot,0)};
}
const fm=v=>fa(Math.round(v*10)/10);
const spark=(mo,mx)=>{const M=Math.max(...mo.slice(1,mx+1),1);return `<span class="spk">${mo.slice(1,mx+1).map(v=>`<i style="height:${Math.max(v>0?10:0,Math.round(Math.max(v,0)/M*100))}%" title="${fm(v)}"></i>`).join('')}</span>`};
const grpTag=g=>`<span class="tag ${isAct(g)?'new':'gray'}">${isAct(g)?(/DELVAN/i.test(g)?'دلوان':'پایا'):esc(g||'؟')}</span>`;
function codeTable(list,tot,mx){
  return `<div class="wrap"><table><tr><th>#</th><th>کد</th><th>گروه</th><th class="n">متر</th><th>سهم</th><th class="n">مشتری</th><th>روند ماهانه</th><th class="n">آخرین ماه</th></tr>
  ${list.map((o,i)=>`<tr class="clk" data-code="${esc(o.code)}"><td>${fa(i+1)}</td><td dir="ltr" style="text-align:right">${esc(o.code)}</td><td>${grpTag(o.g)}</td><td class="n"><b>${fm(o.q)}</b></td><td style="min-width:90px"><div class="bar"><i style="width:${Math.min(100,tot?o.q/tot*100*4:0)}%"></i></div></td><td class="n">${fa(o.nc)}</td><td>${spark(o.mo,mx)}</td><td class="n">${o.last?MONTHS[o.last-1]:'-'}</td></tr>`).join('')}</table></div>`;
}
function viewCodes(){
  if(!ACC)return `<div class="box"><h2>کدها</h2><p class="note">برای دیدن آمار کدها، از ⚙ تنظیمات «اکسل حسابداری» را بارگذاری کنید.</p></div>`;
  const all=Object.values(ACC.code),mx=ACC.maxM,sub=S.ksub||'new';
  const act=all.filter(o=>o.act&&o.q>0).sort((a,b)=>b.q-a.q),out=all.filter(o=>!o.act&&o.q>0).sort((a,b)=>b.q-a.q);
  const ta=act.reduce((x,o)=>x+o.q,0),to=out.reduce((x,o)=>x+o.q,0);
  const seg=`<div class="seg">${[['new',`کدهای بوک جدید (${fa(act.length)})`],['out',`کدهای خارج‌شده (${fa(out.length)})`],['low','کم‌فروش‌ها / نامزد خروج']].map(([k,t])=>`<button class="${sub===k?'on':''}" data-ksub="${k}">${t}</button>`).join('')}</div>`;
  const cards=`<div class="cards"><div class="card g"><div class="l">فروش بوک جدید</div><div class="v">${fm(ta)}</div><div class="s">متر · ${fa(ta+to?ta/(ta+to)*100:0)}٪ کل</div></div><div class="card w"><div class="l">فروش کدهای خارج‌شده</div><div class="v">${fm(to)}</div><div class="s">متر · ته‌مانده فروش</div></div><div class="card"><div class="l">جمع حسابداری</div><div class="v">${fm(ta+to)}</div><div class="s">متر · تا ${MONTHS[mx-1]}</div></div></div>`;
  let body='';
  if(sub==='new')body=`<div class="box"><h2>کدهای بوک جدید — چطور می‌فروشند</h2><p class="note">گروه فروش RION. روی هر کد بزن تا لیست مشتری‌هایش باز شود.</p>${codeTable(act,ta,mx)}</div>`;
  else if(sub==='out')body=`<div class="box"><h2>کدهای خارج‌شده</h2><p class="note">کدهایی که گروه فروششان RION نیست (خارج، امید جیناک، هنگل و ...). فروش آن‌ها از موجودی باقی‌مانده است.</p>${codeTable(out,to,mx)}</div>`;
  else{
    const med=[...act].map(o=>o.q).sort((a,b)=>a-b)[Math.floor(act.length/2)]||0;
    const low=[...act].filter(o=>o.q<med*0.5||o.nc<=5).sort((a,b)=>a.q-b.q);
    body=`<div class="box"><h2>کم‌فروش‌های بوک جدید</h2><p class="note">کدی کم‌فروش حساب می‌شود که فروشش کمتر از نصف میانه‌ی کدهای جدید (${fm(med)} متر) باشد یا فقط ${fa(5)} مشتری یا کمتر داشته باشد. تصمیم نهایی خروج، بعد از اضافه شدن موجودی انبار گرفته می‌شود (نسبت موجودی به فروش ماهانه).</p>${low.length?codeTable(low,ta,mx):'<p class="note">موردی نیست.</p>'}</div>`;
  }
  return cards+seg+body;
}
function modal(h){$('guide').innerHTML=`<div class="pn"><button class="x" data-x aria-label="بستن">×</button>${h}</div>`;$('guide').classList.add('on')}
function codeProfile(k){
  const o=ACC.code[k];if(!o)return;const mx=ACC.maxM;
  const cu=Object.entries(o.cu).filter(([,v])=>v!==0).sort((a,b)=>b[1]-a[1]),top=cu[0]?cu[0][1]:1;
  modal(`<h3 dir="ltr" style="text-align:right">${esc(k)}</h3><p class="note">${grpTag(o.g)} · ${fm(o.q)} متر · ${fa(o.nc)} مشتری</p>
  <div class="wrap"><table><tr>${MONTHS.slice(0,mx).map(m=>`<th class="n">${m.slice(0,4)}</th>`).join('')}</tr><tr>${o.mo.slice(1,mx+1).map(v=>mcell(v,v===0?'z':'')).join('')}</tr></table></div>
  <h4>مشتری‌ها</h4><div class="wrap"><table>${cu.map(([c,v])=>`<tr class="clk" ${ACC.cust[c]&&ACC.cust[c].shop?`data-shop="${ACC.cust[c].shop.id}"`:`data-cust="${esc(c)}"`}><td>${esc(c)}</td><td class="n"><b>${fm(v)}</b></td><td style="min-width:80px"><div class="bar"><i style="width:${Math.max(0,v/top*100)}%"></i></div></td></tr>`).join('')}</table></div>`);
}
function codeBlock(codes,mx,title){
  const l=Object.entries(codes).filter(([,v])=>v.q!==0).sort((a,b)=>b[1].q-a[1].q);
  if(!l.length)return '';
  const tot=l.reduce((x,[,v])=>x+v.q,0),top=l[0][1].q||1;
  return `<h4>${title} <small>(${fa(l.length)} کد · ${fm(tot)} متر)</small></h4><div class="wrap"><table>${l.map(([k,v])=>`<tr class="clk" data-code="${esc(k)}"><td dir="ltr" style="text-align:right">${esc(k)}</td><td class="n"><b>${fm(v.q)}</b></td><td style="min-width:70px"><div class="bar"><i style="width:${Math.max(0,v.q/top*100)}%"></i></div></td><td>${spark(v.mo,mx)}</td></tr>`).join('')}</table></div>`;
}
function shopProfile(id){
  const s=CAL[id];if(!s)return;const a=ACC&&s.acc&&s.acc.cust.length?s.acc:null,mx=ACC?ACC.maxM:S.cur;
  const rowsM=[];for(let k=1;k<=Math.max(mx,S.cur);k++)rowsM.push(k);
  let h=`<h3>${esc(s.name)}</h3><p class="note">${esc(s.sheet)} · ${ytag(s.year)} <small>${esc(s.book)}</small> ${s.hanger?'· هنگر دارد':''} · ${stag(s.status)}</p>
  <div class="cards"><div class="card"><div class="l">خرید طبق لیست ماهانه</div><div class="v">${fm(s.total)}</div><div class="s">متر</div></div>`;
  if(a)h+=`<div class="card g"><div class="l">خرید طبق حسابداری</div><div class="v">${fm(a.tot)}</div><div class="s">متر · اختلاف ${fm(a.tot-s.total)}</div></div><div class="card"><div class="l">بوک جدید (RION)</div><div class="v">${fm(a.act)}</div><div class="s">متر</div></div><div class="card w"><div class="l">قدیمی / سایر</div><div class="v">${fm(a.tot-a.act)}</div><div class="s">متر</div></div>`;
  h+=`</div><h4>خرید ماه به ماه</h4><div class="wrap"><table><tr><th></th>${rowsM.map(k=>`<th class="n">${MONTHS[k-1].slice(0,4)}</th>`).join('')}</tr>
  <tr><td>لیست ماهانه</td>${rowsM.map(k=>mcell(s.m[k],s.m[k]===0?'z':'')).join('')}</tr>
  ${a?`<tr><td>حسابداری</td>${rowsM.map(k=>mcell(Math.round(a.mo[k]*10)/10,!a.mo[k]?'z':'')).join('')}</tr><tr><td>اختلاف</td>${rowsM.map(k=>{const d=Math.round((a.mo[k]-(s.m[k]||0))*10)/10;return `<td class="n" style="${d?'color:#b45309':''}">${d?fa(d):''}</td>`}).join('')}</tr>`:''}</table></div>`;
  if(a){
    const act={},old={};Object.entries(a.codes).forEach(([k,v])=>(isAct(v.g)?act:old)[k]=v);
    h+=codeBlock(act,mx,'کدهای بوک جدید که می‌خرد')+codeBlock(old,mx,'کدهای قدیمی / خارج‌شده');
    h+=`<p class="note">نام در حسابداری: ${a.cust.map(esc).join('، ')}</p>`;
  }else h+=`<p class="note">${ACC?'برای این مغازه خرید ثبت‌شده‌ای در حسابداری پیدا نشد (فروش صفر).':'برای دیدن کدها، اکسل حسابداری را بارگذاری کنید.'}</p>`;
  modal(h);
}
function custProfile(c){
  const u=ACC&&ACC.cust[c];if(!u)return;const mx=ACC.maxM;
  const act={},old={};Object.entries(u.codes).forEach(([k,v])=>(isAct(v.g)?act:old)[k]=v);
  modal(`<h3>${esc(u.name)}</h3><p class="note">بدون کالیته (در لیست مغازه‌ها نیست) · ${fm(u.tot)} متر</p><div class="wrap"><table><tr>${MONTHS.slice(0,mx).map(m=>`<th class="n">${m.slice(0,4)}</th>`).join('')}</tr><tr>${u.mo.slice(1,mx+1).map(v=>mcell(Math.round(v*10)/10,v===0?'z':'')).join('')}</tr></table></div>`+codeBlock(act,mx,'بوک جدید')+codeBlock(old,mx,'قدیمی / خارج‌شده'));
}
function viewAcc(){
  if(!ACC)return `<div class="box"><h2>حسابداری و بوک‌ها</h2><p class="note">اکسل حسابداری را از ⚙ تنظیمات بارگذاری کنید.</p></div>`;
  const mx=ACC.maxM,Y={};
  CAL.forEach(s=>{const y=Y[s.year]||(Y[s.year]={n:0,b:0,t:0,a:0});y.n++;if(s.acc.act>0)y.b++;y.t+=s.acc.tot;y.a+=s.acc.act});
  const low=CAL.filter(s=>s.year>=4&&s.acc.act<30).sort((a,b)=>a.acc.act-b.acc.act);
  const unm=[...ACC.unm].sort((a,b)=>b.tot-a.tot);
  const man=CAL.reduce((x,s)=>x+s.m.slice(1,mx+1).reduce((p,v)=>p+(v||0),0),0);
  const mrow=k=>CAL.reduce((x,s)=>x+(s.m[k]||0),0);
  return `<div class="box"><h2>مقایسه‌ی حسابداری و لیست ماهانه</h2><div class="wrap"><table><tr><th></th>${MONTHS.slice(0,mx).map(m=>`<th class="n">${m.slice(0,4)}</th>`).join('')}<th class="n">جمع</th></tr>
  <tr><td>لیست ماهانه</td>${Array.from({length:mx},(_,i)=>mcell(Math.round(mrow(i+1)))).join('')}<td class="n"><b>${fa(Math.round(man))}</b></td></tr>
  <tr><td>حسابداری (مغازه‌های لیست)</td>${Array.from({length:mx},(_,i)=>mcell(Math.round(CAL.reduce((x,s)=>x+s.acc.mo[i+1],0)))).join('')}<td class="n"><b>${fa(Math.round(CAL.reduce((x,s)=>x+s.acc.tot,0)))}</b></td></tr>
  <tr><td>حسابداری (بدون کالیته)</td>${Array.from({length:mx},(_,i)=>mcell(Math.round(unm.reduce((x,u)=>x+u.mo[i+1],0)))).join('')}<td class="n"><b>${fa(Math.round(unm.reduce((x,u)=>x+u.tot,0)))}</b></td></tr></table></div></div>
  <div class="box"><h2>مغازه‌ها به تفکیک سال بوک</h2><div class="wrap"><table><tr><th>بوک</th><th class="n">مغازه</th><th class="n">با خرید RION</th><th class="n">متر کل</th><th class="n">متر RION</th></tr>
  ${Object.entries(Y).sort((a,b)=>b[0]-a[0]).map(([y,v])=>`<tr><td>${ytag(+y)}</td><td class="n">${fa(v.n)}</td><td class="n">${fa(v.b)}</td><td class="n">${fm(v.t)}</td><td class="n">${fm(v.a)}</td></tr>`).join('')}</table></div></div>
  <div class="box"><h2>بوک ۴ و ۵ با خرید کم یا صفر (کمتر از ۳۰ متر RION)</h2><div class="wrap"><table><tr><th>مغازه</th><th>بوک</th><th class="n">متر RION</th></tr>${low.map(s=>`<tr class="clk" data-shop="${s.id}"><td>${esc(s.name)}</td><td>${ytag(s.year)}</td><td class="n">${fm(s.acc.act)}</td></tr>`).join('')}</table></div></div>
  <div class="box"><h2>بدون کالیته (${fa(unm.length)} مشتری)</h2><p class="note">در حسابداری هستند ولی در لیست مغازه‌ها نیستند؛ خطا حساب نمی‌شوند.</p><div class="wrap"><table><tr><th>مشتری</th><th class="n">متر</th><th class="n">RION</th></tr>${unm.map(u=>`<tr class="clk" data-cust="${esc(u.name)}"><td>${esc(u.name)}</td><td class="n"><b>${fm(u.tot)}</b></td><td class="n">${fm(u.act)}</td></tr>`).join('')}</table></div></div>
  ${ACC.fz.length?`<div class="box"><h2>تطبیق‌های تقریبی (برای بازبینی)</h2><div class="wrap"><table>${ACC.fz.map(f=>`<tr><td>${esc(f[0])}</td><td>←</td><td>${esc(f[1])}</td></tr>`).join('')}</table></div></div>`:''}`;
}
