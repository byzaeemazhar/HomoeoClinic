/* =====================================================================
   Domain logic: settings, stock ledger, FEFO, sales, purchases, alerts
   ===================================================================== */
const DEFCFG={xPot:[],xForm:[],xBrand:[],shop:'My Homoeo Store & Clinic',phone:'',addr:'',cur:'Rs',expDays:90,deadDays:90,cc:'92',receipt:'a4',allowNeg:false,footer:'Thank you! Get well soon.',defReorder:3,doc:'',qual:'',reg:''};
let ROLE='owner';const isOwner=()=>ROLE==='owner';
let _cfg=null,_cfgV=-1;
const CFG=()=>{const v=DB.ver('settings');if(_cfg&&_cfgV===v)return _cfg;_cfgV=v;return _cfg={...DEFCFG,...(DB.get('settings','main')||{})}};
const money=n=>{n=r2(n||0);return CFG().cur+' '+n.toLocaleString(undefined,{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})};
const reo=it=>num(it.reorder)||CFG().defReorder;
const fq=n=>{n=r3(n||0);return Number.isInteger(n)?String(n):String(+n.toFixed(2))};

const FORMS=['Dilution','Bio-Combination (BC)','Mother Tincture (Q)','Tablets','Biochemic','Trituration','Ointment / Cream','Drops','Syrup','Globules / Pills','Oil / Lotion','Cosmetic / Other','Consumable (vial, label…)'];
const POTENCIES=['Q','1X','3X','6X','12X','30X','200X','3C','6C','12C','30C','200C','1M','10M','50M','CM','LM1','LM2'];
const REASONS=['Damaged / broken','Expired – discarded','Sample / free','Personal / clinic use','Counting correction','Gift','Other'];

const iname=it=>it?[it.name,it.potency,it.size].filter(Boolean).join(' · '):'—';
const isub=it=>it?[it.brand,it.form,it.rack&&('Rack '+it.rack)].filter(Boolean).join(' · '):'';
const _h=new Map();
const hay=it=>{let h=_h.get(it.id);if(!h||h.u!==it._u){h={u:it._u,s:[it.name,it.alias,it.brand,it.potency,it.size,it.barcode,it.form,it.rack].join(' ').toLowerCase()};_h.set(it.id,h)}return h.s};
const matchItem=(it,q)=>{q=(q||'').toLowerCase().trim();if(!q)return true;return q.split(/\s+/).every(t=>hay(it).includes(t))};
const byName=(a,b)=>(a.name||'').localeCompare(b.name||'')||(a.potency||'').localeCompare(b.potency||'',undefined,{numeric:true});

/* ---------- stock = sum of ledger moves ---------- */
const ST={key:'',item:new Map(),batch:new Map(),nb:new Map(),last:new Map(),sold:new Map(),bi:new Map()};
function stock(){
  const key=DB.ver('moves')+':'+DB.ver('batches');if(ST.key===key)return ST;ST.key=key;
  for(const k of['item','batch','nb','last','sold','bi'])ST[k].clear();
  const since=addDays(-30);
  for(const m of DB.all('moves')){
    ST.item.set(m.item,(ST.item.get(m.item)||0)+m.q);
    if(m.batch)ST.batch.set(m.batch,(ST.batch.get(m.batch)||0)+m.q);else ST.nb.set(m.item,(ST.nb.get(m.item)||0)+m.q);
    if(m.type==='sale'||m.type==='mix'){if(m.d>(ST.last.get(m.item)||''))ST.last.set(m.item,m.d);if(m.d>=since)ST.sold.set(m.item,(ST.sold.get(m.item)||0)-m.q)}}
  for(const b of DB.all('batches')){if(!ST.bi.has(b.item))ST.bi.set(b.item,[]);ST.bi.get(b.item).push(b)}
  return ST}
const qty=id=>r3(stock().item.get(id)||0);
const bq=id=>r3(stock().batch.get(id)||0);
const batchesOf=id=>stock().bi.get(id)||[];
const expState=b=>{if(!b||!b.exp)return'';const t=ymd();if(b.exp<t)return'expired';if(b.exp<=addDays(CFG().expDays))return'soon';return''};
const istate=it=>{const q=qty(it.id);if(q<0)return'neg';if(q===0)return'out';if(q<=reo(it))return'low';return'ok'};

function addStock(itemId,q,o={}){
  let batch='';
  if(o.no||o.exp||o.mfg){
    let b=batchesOf(itemId).find(b=>(b.no||'')===(o.no||'')&&(b.exp||'')===(o.exp||''));
    if(!b)b=DB.put('batches',{item:itemId,no:o.no||'',exp:o.exp||'',mfg:o.mfg||'',buy:o.buy||0,mrp:o.mrp||0});
    batch=b.id}
  return DB.put('moves',{item:itemId,batch,q:r3(q),type:o.type||'open',ref:o.ref||'',d:ymd(),t:Date.now(),note:o.note||''})}

/* FEFO allocation: earliest expiry first, never expired, then un-batched pool */
function plan(needs){
  const used=new Map(),moves=[],short=[],t=ymd(),neg=CFG().allowNeg;
  const use=(k,v)=>used.set(k,(used.get(k)||0)+v);
  for(const L of needs){
    let need=r3(L.q);if(need<=0)continue;
    const bs=batchesOf(L.it).map(b=>({b,a:r3(bq(b.id)-(used.get(b.id)||0))})).filter(x=>x.a>0&&(!x.b.exp||x.b.exp>=t)).sort((x,y)=>(x.b.exp||'9999')<(y.b.exp||'9999')?-1:1);
    for(const x of bs){if(need<=0)break;const g=Math.min(x.a,need);moves.push({item:L.it,batch:x.b.id,q:-g,...L.meta});use(x.b.id,g);need=r3(need-g)}
    if(need>0){const k='nb'+L.it;const a=r3((stock().nb.get(L.it)||0)-(used.get(k)||0));const g=Math.max(0,Math.min(a,need));if(g>0){moves.push({item:L.it,batch:'',q:-g,...L.meta});use(k,g);need=r3(need-g)}}
    if(need>0){short.push({it:L.it,n:need});if(neg)moves.push({item:L.it,batch:'',q:-need,...L.meta})}}
  return{moves,short:neg?[]:short}}

const mixNeeds=L=>(L.mx.ings||[]).filter(g=>g.it).map(g=>{const it=DB.get('items',g.it);const c=num(it&&it.content)||1;return{it:g.it,q:r3(g.q*L.q/c)}});
const mixCost=(ings,mult=1)=>r2((ings||[]).reduce((s,g)=>{const it=DB.get('items',g.it);if(!it)return s;return s+num(it.buy)*g.q/(num(it.content)||1)*mult},0));
const mixSell=ings=>r2((ings||[]).reduce((s,g)=>{const it=DB.get('items',g.it);if(!it)return s;return s+num(it.sell)*g.q/(num(it.content)||1)},0));
const lineCost=L=>L.mx?mixCost(L.mx.ings,L.q):r2(num((DB.get('items',L.it)||{}).buy)*L.q);
const cartTotals=c=>{const sub=r2(c.lines.reduce((s,L)=>s+L.q*L.p,0));const disc=r2(Math.min(sub,c.discType==='%'?sub*num(c.disc)/100:num(c.disc)));return{sub,disc,total:r2(sub-disc)}};

function checkout(c){
  const needs=[];
  c.lines.forEach(L=>{if(L.mx)mixNeeds(L).forEach(n=>needs.push({...n,meta:{type:'mix'}}));else if(L.it)needs.push({it:L.it,q:L.q,meta:{type:'sale'}})});
  const P=plan(needs);if(P.short.length)return{err:P.short};
  const T=cartTotals(c),tender=c.paid==null?T.total:r2(num(c.paid)),paid=Math.min(tender,T.total);
  const id=rid(),d=ymd(),t=Date.now();
  const sale=DB.put('sales',{id,no:nextNo('sale'),d,t,cust:c.cust||'',pat:c.pat||'',sub:T.sub,disc:T.disc,total:T.total,paid,method:c.method||'cash',note:c.note||'',
    lines:c.lines.map(L=>({it:L.it||'',nm:L.nm,q:L.q,p:L.p,cost:lineCost(L),mx:L.mx||null}))});
  P.moves.forEach(m=>DB.put('moves',{...m,ref:id,d,t,note:''}));
  return{sale,change:Math.max(0,r2(tender-T.total))}}

function voidSale(id){
  const s=DB.get('sales',id);if(!s||s.void)return;
  DB.all('moves').filter(m=>m.ref===id&&(m.type==='sale'||m.type==='mix')).forEach(m=>DB.put('moves',{item:m.item,batch:m.batch,q:-m.q,type:'sret',ref:id,d:ymd(),t:Date.now(),note:'Void '+s.no}));
  DB.put('sales',{...s,void:1})}

function receivePurchase(p,{updateBuy=true}={}){
  const id=rid(),d=p.d||ymd();
  const lines=p.lines.filter(l=>l.it&&(num(l.q)+num(l.free))>0);
  const total=r2(lines.reduce((s,l)=>s+num(l.q)*num(l.p),0));
  const rec=DB.put('purchases',{id,no:nextNo('grn'),d,t:Date.now(),sup:p.sup||'',inv:p.inv||'',note:p.note||'',ref:p.ref||'',total,paid:Math.min(total,num(p.paid)),lines:lines.map(l=>({it:l.it,nm:l.nm,q:num(l.q),free:num(l.free),p:num(l.p),no:l.no||'',exp:l.exp||'',mfg:l.mfg||''}))});
  lines.forEach(l=>{const all=num(l.q)+num(l.free),eff=all>0?r2(num(l.q)*num(l.p)/all):0;
    addStock(l.it,all,{type:'purchase',ref:id,no:l.no,exp:l.exp,mfg:l.mfg,buy:eff,note:'GRN '+rec.no+(num(l.free)?' (incl. '+fq(num(l.free))+' free)':'')});
    if(updateBuy&&eff>0){const it=DB.get('items',l.it);if(it&&it.buy!==eff)DB.put('items',{...it,buy:eff})}});
  return rec}

/* ---------- balances (customer credit / supplier dues) ---------- */
let _bal=null,_balK='';
function balances(){
  const k=DB.ver('sales')+':'+DB.ver('payments')+':'+DB.ver('purchases');if(_bal&&_balK===k)return _bal;_balK=k;
  const c=new Map(),s=new Map();
  DB.all('sales').forEach(x=>{if(x.cust&&!x.void)c.set(x.cust,(c.get(x.cust)||0)+x.total-x.paid)});
  DB.all('purchases').forEach(x=>{if(x.sup)s.set(x.sup,(s.get(x.sup)||0)+x.total-x.paid)});
  DB.all('payments').forEach(p=>{const m=p.k==='c'?c:s;m.set(p.pid,(m.get(p.pid)||0)-p.amt)});
  return _bal={c,s}}
const custBal=id=>r2(balances().c.get(id)||0);
const supBal=id=>r2(balances().s.get(id)||0);

/* ---------- alerts ---------- */
let _al=null,_alK='';
function alerts(){
  const t=ymd(),k=DB.vsum()+t;if(_al&&_alK===k)return _al;_alK=k;
  const c=CFG(),lim=addDays(c.expDays),cut=Date.now()-c.deadDays*864e5,cutD=addDays(-c.deadDays);
  const A={out:[],low:[],neg:[],over:[],dead:[],exps:[],soon:[]};
  for(const it of DB.all('items')){if(it.arch)continue;const q=qty(it.id);
    if(q<0)A.neg.push(it);else if(q===0)A.out.push(it);else if(q<=reo(it))A.low.push(it);else if(it.reorder>0&&q>it.reorder*6)A.over.push(it);
    if(q>0&&(it.c||0)<cut&&(stock().last.get(it.id)||'')<cutD)A.dead.push(it)}
  for(const b of DB.all('batches')){if(!b.exp)continue;const q=bq(b.id);if(q<=0)continue;const it=DB.get('items',b.item);if(!it||it.arch)continue;
    if(b.exp<t)A.exps.push({b,it,q});else if(b.exp<=lim)A.soon.push({b,it,q})}
  A.soon.sort((a,b)=>a.b.exp<b.b.exp?-1:1);A.exps.sort((a,b)=>a.b.exp<b.b.exp?-1:1);
  const B=balances();
  A.dues=DB.all('customers').map(x=>({x,b:r2(B.c.get(x.id)||0)})).filter(x=>x.b>0.5).sort((a,b)=>b.b-a.b);
  A.sdue=DB.all('suppliers').map(x=>({x,b:r2(B.s.get(x.id)||0)})).filter(x=>x.b>0.5).sort((a,b)=>b.b-a.b);
  A.follow=DB.all('visits').filter(v=>v.follow&&!v.fdone&&v.follow<=addDays(1)).sort((a,b)=>a.follow<b.follow?-1:1);
  A.notes=DB.all('notes').filter(n=>n.due&&!n.done&&n.due<=t);
  A.count=A.out.length+A.low.length+A.neg.length+A.exps.length+A.soon.length+A.dues.length+A.follow.length+A.notes.length;
  return _al=A}

/* ---------- order suggestions ---------- */
const suggestQty=it=>Math.max(1,Math.ceil(reo(it)*2-qty(it.id)));
function suggestions(){
  const g=new Map();
  for(const it of DB.all('items')){if(it.arch)continue;const s=istate(it);if(s==='out'||s==='low'||s==='neg'){const k=it.sup||'';if(!g.has(k))g.set(k,[]);g.get(k).push(it)}}
  return[...g.entries()].map(([sup,items])=>({sup,items:items.sort(byName)}))}

function topItems(n=8){
  const s=stock().sold;const items=DB.all('items').filter(i=>!i.arch);
  return items.sort((a,b)=>(s.get(b.id)||0)-(s.get(a.id)||0)||byName(a,b)).slice(0,n)}

/* ---------- demo data ---------- */
function loadDemo(){
  const sup=DB.put('suppliers',{name:'Ali Homoeo Distributors',phone:'03001234567',note:'Delivers on Tuesdays'});
  const sup2=DB.put('suppliers',{name:'Bakson Agency',phone:'03111234567',note:''});
  const mk=(name,potency,size,brand,form,buy,sell,reorder,q,sp,rack,content,cunit)=>{
    const it=DB.put('items',{name,potency,size,brand,form,buy,sell,mrp:sell,reorder,sup:sp.id,rack,content:content||'',cunit:cunit||'',c:Date.now()-120*864e5});
    if(q>0){addStock(it.id,q,{no:'B'+(1+Math.random()*80|0),exp:addDays(60+Math.random()*700|0),buy});}return it};
  mk('Arnica Montana','30C','30 ml','SBL','Dilution',140,220,5,12,sup,'A1',30,'ml');
  mk('Arnica Montana','200C','30 ml','SBL','Dilution',150,240,4,3,sup,'A1',30,'ml');
  mk('Arnica Montana','Q','30 ml','Schwabe','Mother Tincture (Q)',260,380,3,6,sup2,'M2',30,'ml');
  mk('Belladonna','30C','30 ml','SBL','Dilution',140,220,5,0,sup,'B1',30,'ml');
  mk('Nux Vomica','30C','30 ml','Reckeweg','Dilution',150,230,5,9,sup,'N1',30,'ml');
  mk('Calcarea Phos','6X','25 g','Schwabe','Biochemic',110,170,6,2,sup2,'C3',25,'g');
  mk('Pulsatilla','200C','30 ml','Allen','Dilution',160,250,4,7,sup,'P1',30,'ml');
  mk('Rhus Tox','30C','30 ml','SBL','Dilution',140,220,5,10,sup,'R1',30,'ml');
  mk('Bryonia Alba','30C','30 ml','SBL','Dilution',140,220,5,8,sup,'B2',30,'ml');
  mk('Sugar of Milk Globules','#30','100 g','Local','Globules / Pills',90,150,5,14,sup2,'G1',100,'g');
  mk('Empty vial 10 ml','','','Local','Consumable (vial, label…)',6,12,50,120,sup2,'V1');
  const old=mk('Sulphur','1M','30 ml','SBL','Dilution',200,320,3,4,sup,'S1',30,'ml');
  addStock(old.id,2,{no:'OLD1',exp:addDays(25),buy:200});
  DB.put('customers',{name:'Muhammad Aslam',phone:'03211112222',note:''});
  const pat=DB.put('patients',{name:'Ayesha Khan',no:'1',age:'34',sex:'Female',marital:'Married',blood:'B+',phone:'03005557777',addr:'House 12, Model Town',job:'Teacher',allergy:'Dust',history:'Migraine since 2019',thermal:'Chilly patient',thirst:'Thirstless',note:'Prefers sweet globules',c:Date.now()});
  const d1=addDays(-20),d2=addDays(-6),t1=new Date(d1+'T10:30:00').getTime(),t2=new Date(d2+'T17:10:00').getTime();
  DB.put('visits',{pat:pat.id,d:d1,t:t1,vtype:'New case',complaint:'Headache on the right side with nausea',since:'2 weeks',symptoms:'Worse in sunlight, better in a dark room',dx:'Migraine',rx:[{it:'',nm:'Belladonna',pot:'30C',dose:'4 pills',freq:'Three times a day',days:'7',qty:'1 bottle'}],advice:'Drink more water. Avoid skipping meals.',follow:d2,fee:'500',fdone:1});
  DB.put('visits',{pat:pat.id,d:d2,t:t2,vtype:'Follow-up',complaint:'Headache less, still nausea in the morning',progress:'Pain reduced by half',outcome:'Better',rx:[{it:'',nm:'Nux Vomica',pot:'30C',dose:'4 pills',freq:'Twice a day',days:'14',qty:'1 bottle'}],chgReason:'Nausea is now the main symptom',advice:'Light dinner.',follow:addDays(8),fee:'300'});
  DB.put('notes',{title:'Order reminder',body:'Ask Ali Distributors about the new Bakson price list.\nCheck Arnica 200C stock before Friday.',color:0,pin:1,due:addDays(1)});
}

/* partial return of items from a bill */
function returnItems(id,rets){
  const s=DB.get('sales',id);if(!s)return null;const lines=s.lines.map(l=>({...l}));const log=[];
  for(const i in rets){const L=lines[i];if(!L||L.mx||!L.it)continue;const rq=r3(Math.min(num(rets[i]),L.q));if(rq<=0)continue;
    const sold=new Map();DB.all('moves').filter(m=>m.ref===id&&m.item===L.it).forEach(m=>{if(m.type==='sale')sold.set(m.batch,(sold.get(m.batch)||0)-m.q);else if(m.type==='sret')sold.set(m.batch,(sold.get(m.batch)||0)-m.q)});
    let left=rq;for(const[b,a]of sold){if(left<=0)break;const g=r3(Math.min(a,left));if(g>0){DB.put('moves',{item:L.it,batch:b,q:g,type:'sret',ref:id,d:ymd(),t:Date.now(),note:'Return '+s.no});left=r3(left-g)}}
    if(left>0)DB.put('moves',{item:L.it,batch:'',q:left,type:'sret',ref:id,d:ymd(),t:Date.now(),note:'Return '+s.no});
    L.q=r3(L.q-rq);L.ret=r3((L.ret||0)+rq);log.push(L.nm+' ×'+fq(rq))}
  if(!log.length)return null;
  const kept=lines.filter(l=>l.q>0),sub=r2(kept.reduce((a,l)=>a+l.q*l.p,0)),disc=Math.min(s.disc||0,sub),total=r2(sub-disc),paid=Math.min(s.paid,total),cash=r2(s.paid-paid);
  DB.put('sales',{...s,lines:kept,sub,disc,total,paid,rets:[...(s.rets||[]),{d:ymd(),t:Date.now(),items:log.join(', '),cash}]});
  return{cash,items:log}}


/* ---------- medicine categories (quick filters) ---------- */
function catOf(it){const f=(it.form||'').toLowerCase(),p=(it.potency||'').toUpperCase().trim();
  if(p==='Q'||f.includes('mother'))return'q';
  if(f.includes('biochemic')||f.includes('bio-comb')||/^\d+X$/.test(p)||/^BC\s*#?\d/i.test(it.name||''))return'bio';
  if(/syrup|drops|ointment|cream|oil|lotion|tablet|cosmetic/.test(f))return'pat';
  if(f.includes('dilution')||/^(\d+C|\d+M|CM|LM\d+)$/.test(p))return'dil';
  return'other'}
const CATS=[['dil','Dilutions'],['q','Q / Tinctures'],['bio','Biochemic / BC'],['pat','Patents']];
const potRank=p=>{p=(p||'').toUpperCase();if(!p)return 9e6;if(p==='Q')return 0;if(p==='CM')return 2e5;const m=p.match(/^(\d+)(X|C|M|LM)?/);if(!m)return 8e6;const n=+m[1],u=m[2]||'';return({X:1e3,C:1e4,M:1e5,LM:1e6}[u]||2e3)+n};

/* ---------- opened bottles at the clinic counter ---------- */
const openList=id=>DB.all('opened').filter(o=>o.item===id&&!o.done);
function openBottle(id,n=1){const P=plan([{it:id,q:n,meta:{type:'opened'}}]);if(P.short.length)return{err:P.short};
  const t=Date.now(),d=ymd();P.moves.forEach(m=>DB.put('moves',{...m,ref:'',d,t,note:'Opened for clinic dispensing'}));
  for(let i=0;i<n;i++)DB.put('opened',{item:id,d,t:t+i,done:0});return{ok:1}}
function finishOpen(oid,why){const o=DB.get('opened',oid);if(o)DB.put('opened',{...o,done:1,doneOn:ymd(),why:why||'Finished'})}
/* write off one expired batch completely */
function writeOffBatch(bid){const b=DB.get('batches',bid);if(!b)return 0;const q=bq(bid);if(q<=0)return 0;
  DB.put('moves',{item:b.item,batch:bid,q:-q,type:'adjust',ref:'',d:ymd(),t:Date.now(),note:'Expired – discarded (batch '+(b.no||'—')+')'});return q}
/* items whose batches expire in the next N days (not yet expired), grouped by supplier */
function returnList(days){const t=ymd(),lim=addDays(days),g=new Map();
  for(const b of DB.all('batches')){if(!b.exp||b.exp<t||b.exp>lim)continue;const q=bq(b.id);if(q<=0)continue;const it=DB.get('items',b.item);if(!it||it.arch)continue;
    const k=it.sup||'';if(!g.has(k))g.set(k,[]);g.get(k).push({it,b,q})}
  return[...g.entries()].map(([sup,rows])=>({sup,rows:rows.sort((a,b)=>a.b.exp<b.b.exp?-1:1)})).sort((a,b)=>(supName(a.sup)||'zzz').localeCompare(supName(b.sup)||'zzz'))}
