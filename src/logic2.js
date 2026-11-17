/* =====================================================================
   Extra domain logic: time of day, custom lists, daily sales, patient courses
   ===================================================================== */
const TOD=h=>h<5?['Late night','Good night']:h<12?['Morning','Good morning']:h<14?['Noon','Good noon']:h<17?['Afternoon','Good afternoon']:h<19?['Evening','Good evening']:h<21?['After evening','Good evening']:['Night','Good night'];
const todOf=t=>TOD(new Date(t).getHours())[0];
const clockStr=(d=new Date())=>d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const dateLong=(d=new Date())=>d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
const FREQS=['Once a day','Twice a day','Three times a day','Four times a day','Every 2 hours','Every 4 hours','Every hour','At bedtime','Alternate days','Once a week','Only when needed (SOS)','Single dose'];
const BLOODS=['','A+','A-','B+','B-','O+','O-','AB+','AB-'];
const VISIT_TYPES=['New case','Follow-up','Acute','Repeat medicine only','Emergency'];
const OUTCOMES=['','Much better','Better','Aggravation first, then better','Plateau (improvement stopped)','Same','Worse','New complaint'];
const potList=()=>{const s=new Set([...POTENCIES,...(CFG().xPot||[])]);DB.all('items').forEach(i=>i.potency&&s.add(i.potency));return[...s]};
const BRAND0=['Dr. Reckeweg','Schwabe','Wilmar Schwabe Pakistan','SBL','Wilms','Allen','Bakson','Hahnemann','Adel','Haslab','Bjain','Masood','BM','Kent','Medisynth','Local'];
const brandList=()=>[...new Set([...BRAND0,...(CFG().xBrand||[]),...DB.all('items').map(i=>i.brand).filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
const formList=()=>[...new Set([...FORMS,...(CFG().xForm||[])])];
function remember(key,val){val=(val||'').trim();if(!val)return;const m=DB.get('settings','main')||{id:'main'};const a=m[key]||[];if(a.some(x=>x.toLowerCase()===val.toLowerCase()))return;DB.put('settings',{...m,id:'main',[key]:[...a,val]})}
/* select + "Other…" text box (any value can be typed by hand) */
function pickOther(label,name,list,cur,{blank='— choose —',ph='Type it here'}={}){
  const has=!cur||list.includes(cur);
  return`<div class="fld po"><span>${label}</span><select data-c="po" data-for="${name}"><option value="">${esc(blank)}</option>${list.map(x=>`<option${x===cur?' selected':''}>${esc(x)}</option>`).join('')}<option value="__o"${has?'':' selected'}>Other (type my own)…</option></select><input name="${name}" value="${esc(cur||'')}" placeholder="${esc(ph)}" dir="auto" autocomplete="off" style="${has?'display:none;':''}margin-top:.3rem"></div>`}

/* ---------- daily sales entries (manual, no bill) ---------- */
const dsOf=d=>DB.all('daysales').filter(x=>x.d===d).sort((a,b)=>a.t-b.t);
function dayTotals(d){
  const bills=DB.all('sales').filter(s=>!s.void&&s.d===d),man=dsOf(d);
  const bt=bills.reduce((s,x)=>s+x.total,0),bc=bills.reduce((s,x)=>s+x.lines.reduce((a,l)=>a+(l.cost||0),0),0);
  const mt=man.reduce((s,x)=>s+num(x.amt),0),mp=man.reduce((s,x)=>s+num(x.profit),0);
  return{bills:bills.length,billTotal:r2(bt),billProfit:r2(bt-bc),manual:man,manTotal:r2(mt),manProfit:r2(mp),total:r2(bt+mt),profit:r2(bt-bc+mp)}}

/* ---------- patient helpers ---------- */
const patVisits=id=>DB.all('visits').filter(v=>v.pat===id).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:(a.t||0)-(b.t||0));
const rxKey=r=>r.it||((r.nm||'').toLowerCase().trim()+'|'+(r.pot||'').toLowerCase().trim());
const addD=(d,n)=>addDays(n,new Date(d+'T12:00:00'));
const daysBetween=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
function patCourses(pid){
  const vs=patVisits(pid),m=new Map(),t=ymd();
  vs.forEach(v=>(v.rx||[]).forEach(r=>{if(!(r.nm||'').trim())return;const k=rxKey(r);let c=m.get(k);if(!c){c={key:k,nm:r.nm,it:r.it||'',pot:r.pot||'',list:[]};m.set(k,c)}
    const days=num(r.days);c.list.push({d:v.d,vid:v.id,dose:r.dose||'',freq:r.freq||'',days,end:days?addD(v.d,days):'',qty:r.qty||'',stop:r.stop||'',reason:r.reason||''})}));
  const sales=DB.all('sales').filter(s=>s.pat===pid&&!s.void);
  return[...m.values()].map(c=>{const last=c.list[c.list.length-1];
    let st='nodur',left=null;if(last.stop)st='stopped';else if(last.end){left=daysBetween(t,last.end);st=left>=0?'running':'finished'}
    const rebuys=c.it?sales.filter(s=>s.lines.some(l=>l.it===c.it)).length:0;
    return{...c,last,st,left,times:c.list.length,rebuys,first:c.list[0].d}}).sort((a,b)=>({running:0,nodur:1,finished:2,stopped:3}[a.st]-{running:0,nodur:1,finished:2,stopped:3}[b.st])||(a.last.d<b.last.d?1:-1))}
function patStats(pid){
  const vs=patVisits(pid),gaps=[];for(let i=1;i<vs.length;i++)gaps.push(daysBetween(vs[i-1].d,vs[i].d));
  const fu=vs.filter(v=>v.follow&&!v.fdone).sort((a,b)=>a.follow<b.follow?-1:1)[0];
  const bills=DB.all('sales').filter(s=>s.pat===pid&&!s.void);
  return{n:vs.length,first:vs[0]&&vs[0].d,last:vs.length&&vs[vs.length-1],avgGap:gaps.length?Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length):0,fu,bills:bills.length,spent:r2(bills.reduce((s,x)=>s+x.total,0)),fees:r2(vs.reduce((s,v)=>s+num(v.fee),0))}}
/* what changed compared with the visit before */
function rxChange(v){const vt=v.t||Infinity,vs=patVisits(v.pat).filter(x=>x.id!==v.id&&(x.d<v.d||(x.d===v.d&&(x.t||0)<=vt)));if(!vs.length)return null;const pv=vs[vs.length-1];
  const prev=new Set((pv.rx||[]).filter(r=>r.nm&&!r.stop).map(rxKey)),cur=new Set((v.rx||[]).filter(r=>(r.nm||'').trim()).map(rxKey));
  const nm=new Map([...(pv.rx||[]),...(v.rx||[])].map(r=>[rxKey(r),r.nm+(r.pot?' '+r.pot:'')]));
  const added=[...cur].filter(k=>!prev.has(k)).map(k=>nm.get(k)),dropped=[...prev].filter(k=>!cur.has(k)).map(k=>nm.get(k));
  return added.length||dropped.length?{added,dropped}:null}
const patAge=p=>p.dob?Math.max(0,Math.floor(daysBetween(p.dob,ymd())/365.25)):(p.age||'');

/* ---------- prescription presets ---------- */
const DIRS=['4 pills 3 times a day','4 pills once a day','2 pills at bedtime','10 drops in half cup water','5 drops in a little water','Empty stomach in the morning','Dissolve in water, sip slowly','1 dose now, repeat if needed'];
const MEDIUMS=['Globules No. 30','Globules No. 20','Sugar of milk','Distilled water','Drops (alcohol)','Tablets'];
const PARHEZ=['No raw onion / garlic','No coffee','No strong perfumes / camphor','15 min gap before / after food','No mint / toothpaste with mint','No tobacco / paan','Avoid sour & spicy food','Avoid cold drinks / ice'];
const POTSEQ=['6C','12C','30C','200C','1M','10M','50M','CM'],XSEQ=['3X','6X','12X','30X','200X'];
const nextPot=p=>{p=(p||'').toUpperCase().trim();let a=POTSEQ.indexOf(p);if(a>=0&&a<POTSEQ.length-1)return POTSEQ[a+1];a=XSEQ.indexOf(p);if(a>=0&&a<XSEQ.length-1)return XSEQ[a+1];return''};
const PKG0=[{n:'Consultation only',fee:300,days:0},{n:'7 days medicine + checkup',fee:700,days:7},{n:'15 days medicine + checkup',fee:1200,days:15},{n:'Monthly (30 days)',fee:2000,days:30}];
const pkgList=()=>{const c=CFG();return Array.isArray(c.pkgs)&&c.pkgs.length?c.pkgs:PKG0};
function pkgVisit(patId,pk,fee){if(!patId||!pk)return;DB.put('visits',{pat:patId,d:ymd(),t:Date.now(),vtype:pk.days?'Repeat medicine only':'Follow-up',complaint:'Package: '+pk.n,rx:[],advice:'',follow:pk.days?addD(ymd(),pk.days):'',fee:fee||pk.fee,notes:'Created from package billing'})}
function followMsg(p,v){const c=CFG();return`Assalam-o-Alaikum ${p.name},\nthis is a gentle reminder for your follow-up visit at ${c.shop}${v&&v.follow?' on '+fdate(v.follow):''}.${c.doc?'\nDr. '+c.doc.replace(/^dr\.?\s*/i,''):''}${c.phone?'\nPhone: '+c.phone:''}\nJazakAllah.`}
function rxText(v,p){const c=CFG(),L=[`*${c.shop}*`,c.doc?`Dr. ${c.doc.replace(/^dr\.?\s*/i,'')} ${c.qual||''}`.trim():'',`Prescription · ${fdate(v.d)}`,`Patient: ${p.name}`,''].filter((x,i)=>x||i>3);
  (v.rx||[]).filter(r=>r.nm).forEach((r,i)=>L.push(`${i+1}. ${r.nm}${r.pot?' '+r.pot:''}${r.medium?' – '+r.medium:''}\n    ${[r.dir,(!r.dir&&r.dose)?r.dose:'',(!r.dir&&r.freq)?r.freq:'',r.days?'for '+r.days+' days':''].filter(Boolean).join(', ')}`));
  if((v.parhez||[]).length||v.advice){L.push('','*Parhez / Advice*');(v.parhez||[]).forEach(x=>L.push('• '+x));if(v.advice)L.push(v.advice)}
  if(v.follow)L.push('',`Next visit: ${fdate(v.follow)}`);return L.join('\n')}
/* ---------- cash drawer ---------- */
const EXP_CATS=['Tea / hospitality','Courier / transport','Utility bill','Cleaner / staff','Repair / supplies','Other'];
function drawer(d){const ss=DB.all('sales').filter(s=>!s.void&&s.d===d),man=DB.all('daysales').filter(x=>x.d===d),pays=DB.all('payments').filter(p=>p.d===d),ex=DB.all('expenses').filter(x=>x.d===d);
  const bills=r2(ss.filter(s=>s.method==='cash').reduce((a,s)=>a+num(s.paid),0)),manual=r2(man.filter(x=>(x.method||'cash')==='cash').reduce((a,x)=>a+num(x.amt),0)),
   dues=r2(pays.filter(p=>p.k==='c'&&p.method==='cash').reduce((a,p)=>a+num(p.amt),0)),sup=r2(pays.filter(p=>p.k==='s'&&p.method==='cash').reduce((a,p)=>a+num(p.amt),0)),exps=r2(ex.reduce((a,x)=>a+num(x.amt),0));
  return{bills,manual,dues,sup,exps,list:ex,box:r2(bills+manual+dues-sup-exps)}}
