/* =====================================================================
   Views 1: Dashboard, Sell (POS), Stock, Stock audit
   ===================================================================== */
const receiptText=s=>{const c=CFG();return`*${c.shop}*\nBill ${s.no} · ${fdate(s.d)}\n`+s.lines.map(l=>`• ${l.nm}${l.mx?' (mixture)':''} × ${fq(l.q)} = ${money(l.q*l.p)}`).join('\n')+`\n\n${s.disc?'Discount: '+money(s.disc)+'\n':''}*Total: ${money(s.total)}*\nPaid: ${money(s.paid)}${s.total>s.paid?'\nBalance due: '+money(s.total-s.paid):''}\n\n${c.footer}`};
const receiptHTML=s=>docHead('Receipt '+s.no,fdate(s.d)+' '+ftime(s.t)+(s.cust?' · '+custName(s.cust):''))+tableHTML(['Item','Qty','Price','Amount'],s.lines.map(l=>[l.nm+(l.mx?' (mixture)':''),l.q,r2(l.p),r2(l.q*l.p)]))+`<p style="text-align:right">Subtotal: ${money(s.sub)}<br>${s.disc?'Discount: '+money(s.disc)+'<br>':''}<b>Total: ${money(s.total)}</b><br>Paid: ${money(s.paid)}${s.total>s.paid?'<br><b>Balance due: '+money(s.total-s.paid)+'</b>':''}</p>${s.note?`<div class="note-box">${esc(s.note)}</div>`:''}<p style="text-align:center">${esc(CFG().footer)}</p>`;
const printReceipt=s=>printDoc(receiptHTML(s),{thermal:CFG().receipt==='thermal'});

function openSale(id){
  const s=DB.get('sales',id);if(!s)return;const cu=DB.get('customers',s.cust);
  modal({title:`Bill ${s.no}${s.void?' · VOID':''}`,html:`<div class="stack"><div class="mut">${fdate(s.d)} ${ftime(s.t)}${s.cust?' · '+esc(custName(s.cust)):''}${s.pat?' · Patient: '+esc((DB.get('patients',s.pat)||{}).name||''):''}</div>
   <div>${s.lines.map(l=>`<div class="row static"><div class="r-main"><b>${esc(l.nm)}</b><small>${fq(l.q)} × ${money(l.p)}${l.mx?' · '+esc((l.mx.ings||[]).map(g=>((DB.get('items',g.it)||{}).name||'?')+' '+fq(g.q)).join(', ')):''}</small></div><div class="r-side"><b>${money(l.q*l.p)}</b></div></div>`).join('')}</div>
   <dl class="kv"><dt>Subtotal</dt><dd>${money(s.sub)}</dd>${s.disc?`<dt>Discount</dt><dd>${money(s.disc)}</dd>`:''}<dt>Total</dt><dd>${money(s.total)}</dd><dt>Paid (${esc(s.method)})</dt><dd>${money(s.paid)}</dd>${(s.rets||[]).map(r=>`<dt>Returned ${fdate(r.d)}</dt><dd>${esc(r.items)}${r.cash?' · refund '+money(r.cash):''}</dd>`).join('')}${s.total>s.paid?`<dt>Balance due</dt><dd style="color:var(--bad)">${money(s.total-s.paid)}</dd>`:''}</dl>${noteBox(s.note)}</div>`,
   foot:[{t:ico('print')+' Print',keep:true,fn:()=>{printReceipt(s);return false}},{t:ico('tag')+' Labels',keep:true,fn:()=>{labelsForm(s);return false}},{t:ico('chat')+' WhatsApp',keep:true,fn:()=>{window.open(waUrl(cu&&cu.phone,receiptText(s)),'_blank');return false}},
    ...(s.void?[]:[{t:'Return items',keep:true,fn:()=>{returnForm(s.id);return false}}]),
    ...(s.void||!isOwner()?[]:[{t:'Void bill',cls:'bad',fn:async()=>{if(!await ask('Void this bill? Stock will be returned and the amount removed from sales.',{ok:'Void bill',bad:true}))return false;voidSale(s.id);toast('Bill voided','ok')}}])]})}
A['sale-open']=d=>openSale(d.id);

/* ---------------- Home ---------------- */
const greetHTML=()=>{const c=CFG(),n=new Date(),g=TOD(n.getHours())[1],who=(c.doc||'').trim()||'doctor';return`${g},<br>${esc(who)}.`};
V.dash={title:'Home',bare:true,render(){
  const t=ymd(),al=alerts(),c=CFG(),own=isOwner(),DT=dayTotals(t),sales=DB.all('sales').filter(s=>!s.void);
  const days=[...Array(7)].map((_,i)=>{const d=addDays(i-6);return{l:fdate(d).slice(0,5),v:dayTotals(d).total}});
  const pinned=DB.all('notes').filter(n=>n.pin&&!n.done).slice(0,4),nItems=DB.all('items').length;
  const steps=[[!!DB.get('settings','main'),'Enter your shop name &amp; doctor details',`<button class="btn sm" data-a="goto" data-r="settings">Open Settings</button>`],[nItems>0,'Add your medicines',`<button class="btn sm pri" data-a="item-new">Add one</button> <button class="btn sm" data-a="import-csv">Import list</button> <button class="btn sm" data-a="demo">Try sample data</button>`],[sales.length>0||DB.all('daysales').length>0,'Record your first sale',`<button class="btn sm" data-a="goto" data-r="today">Today's sales</button> <button class="btn sm" data-a="goto" data-r="sell">Make a bill</button>`]];
  const guide=own&&!ls.get('hs_noguide',false)&&steps.some(x=>!x[0]);
  const bk=Backup.lastOut(),hasData=nItems>0||DB.all('patients').length>0,needBk=own&&hasData&&(!bk||(Date.now()-bk)/864e5>7);
  const att=[[al.exps.length,'Expired medicines still in stock','bad'],[al.out.length,'Medicines finished','bad'],[al.low.length,'Medicines running low','warn'],[al.soon.length,`Expiring within ${c.expDays} days`,'warn'],[al.dues.length,'Customers who owe money','warn'],[own?al.sdue.length:0,'Supplier payments due','warn'],[al.follow.length,'Patient follow-ups','warn'],[al.notes.length,'Your note reminders','warn']].filter(x=>x[0]);
  const tile=(ic,l,a,r,cls='')=>`<button class="tile ${cls}" data-a="${a}"${r?` data-r="${r}"`:''}>${ico(ic)}<span>${l}</span></button>`;
  const kp=(l,v,r,cl='')=>`<div class="kpi ${cl}" data-a="goto" data-r="${r}"><small>${l}</small><b>${v}</b></div>`;
  return`<div class="hhead"><div><div class="eyebrow">${esc(c.shop).toUpperCase()}</div><h1 class="greet" id="greet">${greetHTML()}</h1><div class="clk" id="clk">${ico('clock')} ${clockStr()} · ${dateLong()} · ${TOD(new Date().getHours())[0]}</div></div><div class="hicons"><button class="ib" data-a="help" aria-label="Help">${ico('help')}</button><button class="ib" data-a="bell" aria-label="Alerts">${ico('bell')}<span class="dot bellDot" style="display:none"></span></button><button class="ib" data-a="theme" aria-label="Theme">${ico('moon')}</button></div></div>
  ${needBk?`<div class="banner">${bk?'Your last backup is over a week old.':'You have not made a backup yet.'} <a href="#/backup">Back up now</a></div>`:''}
  <div class="search big home-s">${ico('search')}<input data-i="home-q" placeholder="Search medicine – stock &amp; price" autocomplete="off" dir="auto" aria-label="Search medicine"></div><div id="hres"></div>
  <div class="tiles">${tile('cash',"Today's sales",'goto','today','pri')}${tile('plus','Add stock','home-addstock')}${tile('truck','Order list','goto','orders')}${tile('bell','Alerts'+(al.count?' ('+al.count+')':''),'goto','alerts',al.count?'hot':'')}${tile('user','Patients','goto','patients')}${tile('note','Notes','goto','notes')}</div>
  ${guide?`<div class="card guide"><h2><span>Getting started</span><button class="btn sm" data-a="hide-guide">Hide</button></h2>${steps.map((x,i)=>`<div class="step-row ${x[0]?'done':''}"><span class="num">${x[0]?'✓':i+1}</span><div style="flex:1"><b>${x[1]}</b>${x[0]?'':`<div style="margin-top:.35rem">${x[2]}</div>`}</div></div>`).join('')}</div>`:''}
  <div class="grid kpis2">${kp("Today's sales",money(DT.total),'today')}${own?kp('Profit today',money(DT.profit),'today','good'):kp('Bills today',DT.bills,'sell')}</div>
  <div class="cols l2" style="margin-top:.8rem"><div>
   <div class="card"><h2>Needs attention <a href="#/alerts" class="btn sm">See all</a></h2>${att.length?att.map(([n,l,cl])=>`<div class="row" data-a="goto" data-r="alerts"><div class="r-main"><b>${l}</b></div><span class="badge ${cl}">${n}</span></div>`).join(''):'<div class="empty">✔ Everything looks fine</div>'}</div>
   ${own?`<div class="card"><h2>Last 7 days sales</h2>${barChart(days)}</div>`:''}</div>
  <div><div class="card"><h2>Pinned notes <button class="btn sm" data-a="goto" data-r="notes">Notepad</button></h2>${pinned.length?`<div class="notes" style="grid-template-columns:1fr">${pinned.map(noteCard).join('')}</div>`:'<div class="empty">Pin a note to keep it here.</div>'}</div>
   <div class="card"><h2>Recent bills <button class="btn sm" data-a="goto" data-r="sell">New bill</button></h2>${sales.slice().sort((a,b)=>b.t-a.t).slice(0,5).map(s=>`<div class="row" data-a="sale-open" data-id="${s.id}"><div class="r-main"><b>${esc(s.no)}${s.cust?' · '+esc(custName(s.cust)):''}</b><small>${fdate(s.d)} ${ftime(s.t)} · ${s.lines.length} item(s)</small></div><div class="r-side"><b>${money(s.total)}</b></div></div>`).join('')||'<div class="empty">No bills yet</div>'}</div></div></div>`},
  mount(){}};
HI['home-q']=v=>{const el=$('#hres');if(!el)return;if(!v.trim()){el.innerHTML='';return}
  const items=DB.all('items').filter(i=>!i.arch&&matchItem(i,v)).sort(byName).slice(0,8);
  el.innerHTML=`<div style="margin:.5rem 0">${items.length?items.map(i=>`<div class="row" data-a="item-open" data-id="${i.id}"><div class="r-main"><b>${esc(iname(i))}</b><small>${esc(isub(i))} · ${money(i.sell)}</small></div><div class="r-side">${stBadge(i)}<div><span class="qty ${istate(i)==='ok'?'':istate(i)}">${fq(qty(i.id))}</span></div></div></div>`).join(''):'<div class="empty">No such medicine. <a href="#" data-a="item-new">Add it</a></div>'}</div>`};

/* ---------------- Today's sales (record a whole day's sale without making bills) ---------------- */
const DSU={m:'cash',d:''};
V.today={title:"Today's sales",live:false,render(){
  const d=DSU.d||ymd(),T=dayTotals(d),own=isOwner();
  const week=[...Array(7)].map((_,i)=>{const x=addDays(-i);return[x,dayTotals(x)]});
  return`<p class="mut" style="margin:0 0 .7rem">Write the money you took <b>without making a bill</b>. You can add several times in a day – everything is added together with your bills.</p>
  ${(()=>{const dr=drawer(d);return`<div class="card cashbox"><h2><span>Cash box · ${d===ymd()?'today':fdate(d)}</span></h2><div class="mut">Cash that should be in the drawer right now</div><div class="big">${money(dr.box)}</div>
   <div class="kv" style="margin-top:.4rem"><dt>Cash from bills</dt><dd>${money(dr.bills)}</dd><dt>Cash day-sale entries</dt><dd>${money(dr.manual)}</dd><dt>Old dues collected (cash)</dt><dd>${money(dr.dues)}</dd><dt>Paid to suppliers (cash)</dt><dd>− ${money(dr.sup)}</dd><dt>Expenses paid out</dt><dd>− ${money(dr.exps)}</dd></div></div>`})()}
  <div class="mut" style="margin:.2rem 0 .2rem;font-size:.85rem">Quick packages (fills the amount)</div><div class="pkgs">${pkgList().map((p,i)=>`<button class="pkg" data-a="ds-pkg" data-i="${i}">${esc(p.n)}<small>${money(p.fee)}${p.days?' · follow-up in '+p.days+' days':''}</small></button>`).join('')}</div>
  <div class="card dsform"><label class="fld">Amount sold<div class="bigamt"><span>${esc(CFG().cur)}</span><input id="ds-amt" inputmode="decimal" placeholder="0" autocomplete="off"></div></label>
   <div class="chips" style="padding:.7rem 0 .2rem">${[['cash','Cash'],['online','Online / card'],['credit','On credit']].map(([k,t])=>`<button class="chip ${DSU.m===k?'on':''}" data-a="ds-m" data-m="${k}">${t}</button>`).join('')}</div>
   <div class="grid g2" style="margin-top:.4rem">${F.d('Date','ds-d',d,{'data-c':'ds-date'})}${own?F.n('Profit (optional)','ds-p',''):''}</div>
   ${F.t('Note (optional)','ds-n','',{placeholder:'e.g. clinic patients medicines, morning shift'})}${DSU.pkg&&DSU.pkg.days?F.s('Patient (to set the follow-up date)','ds-pat',[['','— none —'],...DB.all('patients').sort((a,b)=>a.name.localeCompare(b.name)).map(p=>[p.id,p.name+(p.phone?' · '+p.phone:'')])],''):''}
   <div class="mut" style="margin:.4rem 0 .6rem">Time: <b>${TOD(new Date().getHours())[0]}</b> · ${clockStr()}</div>
   <button class="btn pri bigpay block" data-a="ds-save">Save sale</button></div>
  <div class="card"><h2><span>${d===ymd()?'Today':fdate(d)}</span><b class="gt">${money(T.total)}</b></h2>
   ${T.manual.length?T.manual.map(x=>`<div class="row" data-a="ds-edit" data-id="${x.id}"><div class="r-main"><b>${money(x.amt)}${x.note?' · '+esc(x.note):''}</b><small>${esc({cash:'Cash',online:'Online / card',credit:'On credit'}[x.method]||'Cash')} · ${todOf(x.t)} ${ftime(x.t)}${num(x.profit)&&own?' · profit '+money(x.profit):''}</small></div>${ico('edit')}</div>`).join(''):'<div class="mut" style="padding:.3rem 0 .6rem">No manual entries for this day yet.</div>'}
   <div class="kv" style="margin-top:.4rem"><dt>From bills (${T.bills})</dt><dd>${money(T.billTotal)}</dd><dt>Manual entries</dt><dd>${money(T.manTotal)}</dd>${own?`<dt>Profit</dt><dd>${money(T.profit)}</dd>`:''}</div></div>
  <div class="card"><h2><span>Cash paid out (expenses)</span><b class="gt">${money(drawer(d).exps)}</b></h2>
   <div class="chips" style="padding:0 0 .4rem">${EXP_CATS.map(c=>`<button class="chip ${EXU.c===c?'on':''}" data-a="ex-c" data-c="${esc(c)}">${c}</button>`).join('')}</div>
   <div class="grid g2" style="grid-template-columns:1fr 1fr auto;align-items:end">${F.n('Amount','ex-amt','')}${F.t('Note','ex-n','',{placeholder:'optional'})}<button class="btn pri" data-a="ex-save">Add</button></div>
   ${drawer(d).list.map(x=>`<div class="row" data-a="ex-del" data-id="${x.id}"><div class="r-main"><b>${money(x.amt)} · ${esc(x.cat)}</b><small>${esc(x.note||'')}${x.note?' · ':''}${ftime(x.t)} · tap to delete</small></div></div>`).join('')}</div>
  <div class="card"><h2>Last 7 days</h2>${week.map(([x,t])=>`<div class="row" data-a="ds-day" data-d="${x}"><div class="r-main"><b>${x===ymd()?'Today':fdate(x)}</b><small>${t.bills} bill(s) · ${t.manual.length} manual</small></div><div class="r-side"><b>${money(t.total)}</b></div></div>`).join('')}</div>`}};
const EXU={c:EXP_CATS[0]};
A['ex-c']=d=>{EXU.c=d.c;$$('[data-a="ex-c"]').forEach(c=>c.classList.toggle('on',c.dataset.c===d.c))};
A['ex-save']=()=>{const a=num($('[name="ex-amt"]').value);if(a<=0){toast('Write the amount','bad');return}DB.put('expenses',{d:DSU.d||ymd(),t:Date.now(),amt:a,cat:EXU.c,note:$('[name="ex-n"]').value.trim()});toast('Expense saved','ok');render(true)};
A['ex-del']=async d=>{if(!await ask('Delete this expense?',{ok:'Delete',bad:true}))return;DB.del('expenses',d.id);render(true)};
A['ds-pkg']=d=>{const p=pkgList()[+d.i];if(!p)return;DSU.pkg=p;$('#ds-amt').value=p.fee;const n=$('[name="ds-n"]');if(n&&!n.value)n.value=p.n;render(true);setTimeout(()=>{$('#ds-amt').value=p.fee;const n=$('[name="ds-n"]');if(n&&!n.value)n.value=p.n},0)};
A['ds-m']=d=>{DSU.m=d.m;$$('.dsform .chip').forEach(c=>c.classList.toggle('on',c.dataset.m===d.m))};
HC['ds-date']=v=>{DSU.d=v;render(true)};
A['ds-day']=d=>{DSU.d=d.d;render();window.scrollTo(0,0)};
A['ds-save']=()=>{const a=num($('#ds-amt').value);if(a<=0){toast('Write the amount first','bad');$('#ds-amt').focus();return}
  const p=$('[name="ds-p"]'),n=$('[name="ds-n"]'),d=($('[name="ds-d"]').value)||ymd();
  const ps=$('[name="ds-pat"]');const pt=ps?ps.value:'';DB.put('daysales',{d,t:Date.now(),amt:a,method:DSU.m,profit:p?num(p.value):0,note:n.value.trim(),pat:pt,pkg:DSU.pkg?DSU.pkg.n:''});if(pt&&DSU.pkg)pkgVisit(pt,DSU.pkg,a);DSU.pkg=null;DSU.d=d;toast('Saved: '+money(a),'ok');render(true)};
A['ds-edit']=d=>{const x=DB.get('daysales',d.id);if(!x)return;
  modal({title:'Edit sale entry',html:`<form class="stack" onsubmit="return false">${F.n('Amount','amt',x.amt)}${F.s('Received as','method',[['cash','Cash'],['online','Online / card'],['credit','On credit']],x.method||'cash')}${isOwner()?F.n('Profit','profit',x.profit||''):''}${F.d('Date','d',x.d)}${F.t('Note','note',x.note||'')}</form>`,
   foot:[{t:ico('trash'),cls:'bad',fn:async()=>{if(!await ask('Delete this entry?',{ok:'Delete',bad:true}))return false;DB.del('daysales',x.id);render(true)}},{t:'Cancel',fn:()=>{}},{t:'Save',cls:'pri',fn:el=>{const f=formData(el);if(num(f.amt)<=0){toast('Write the amount','bad');return false}DB.put('daysales',{...x,amt:num(f.amt),method:f.method,profit:f.profit!==undefined?num(f.profit):x.profit,d:f.d||x.d,note:f.note.trim()});toast('Saved','ok');render(true)}}]})};
A['hide-guide']=()=>{ls.set('hs_noguide',true);render(true)};
A['home-addstock']=()=>pickItem(it=>addStockForm(it.id),{title:'Which medicine arrived?',allowNew:true});
A.goto=d=>go(d.r);
A.demo=async()=>{if(DB.all('items').length&&!await ask('Add demo medicines to your existing data?'))return;loadDemo();toast('Demo data added','ok')};

/* ---------------- Sell / POS ---------------- */
const newCart=()=>({lines:[],cust:'',pat:'',disc:'',discType:'Rs',paid:null,method:'cash',note:''});
let CART=Object.assign(newCart(),ls.get('hs_cart',null)||{});
const saveCart=()=>ls.set('hs_cart',CART);
const held=()=>ls.get('hs_held',[]);
V.sell={title:'Sell / Billing',live:false,render(){
  return`<div class="pos"><section class="pos-l"><div class="bar" style="margin:0"><div class="search big">${ico('search')}<input id="pq" data-i="pos-q" placeholder="Scan barcode or type medicine…" autocomplete="off" dir="auto"></div><button class="btn" data-a="pos-scan" aria-label="Scan barcode">${ico('scan')}</button></div>
  <div class="mut" style="margin:.6rem 0 .2rem;font-size:.85rem">Treatment packages</div><div class="pkgs">${pkgList().map((p,i)=>`<button class="pkg" data-a="pos-pkg" data-i="${i}">${esc(p.n)}<small>${money(p.fee)}${p.days?' · follow-up in '+p.days+' days':''}</small></button>`).join('')}</div><div id="pres" style="margin-top:.2rem"></div>
  <div class="bar" style="margin-top:.8rem"><button class="btn" data-a="pos-mix">${ico('flask')} Custom mixture</button><button class="btn" data-a="pos-formula">Saved formula</button><button class="btn" data-a="pos-fee">+ Fee / service</button><button class="btn" data-a="pos-held">Held bills <span class="badge" id="heldN">${held().length}</span></button></div></section>
  <section class="pos-r"><div class="card" id="cart"></div></section></div><button class="cartbar" id="cartbar" data-a="goto-cart" style="display:none"></button>`},
  mount(){drawRes('');drawCart();const q=$('#pq');q.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const v=q.value.trim();if(!v)return;
    const ex=DB.all('items').find(i=>i.barcode&&i.barcode===v);const m=ex?[ex]:DB.all('items').filter(i=>!i.arch&&matchItem(i,v));if(m.length===1||ex){posAdd(m[0].id);q.value='';drawRes('')}});
    if(innerWidth>=720)q.focus()}};
function drawRes(q){
  const el=$('#pres');if(!el)return;
  const items=q?DB.all('items').filter(i=>!i.arch&&matchItem(i,q)).sort(byName).slice(0,24):topItems(8);
  el.innerHTML=(q?'':'<div class="sec" style="margin-top:0"><h3>Frequently sold</h3></div>')+(items.length?`<div class="res">${items.map(i=>`<div class="row" data-a="pos-add" data-id="${i.id}"><div class="r-main"><b>${esc(iname(i))}</b><small>${esc(i.brand||'')} · ${money(i.sell)}</small></div><div class="r-side"><span class="qty ${istate(i)}">${fq(qty(i.id))}</span></div></div>`).join('')}</div>`:emptyBox('No match','Check spelling or add it in Stock.'))}
HI['pos-q']=v=>drawRes(v);
function posAdd(id){
  const it=DB.get('items',id);if(!it)return;
  const L=CART.lines.find(l=>l.it===id&&!l.mx);
  if(L)L.q=r3(L.q+1);else CART.lines.push({it:id,nm:iname(it),q:1,p:num(it.sell)});
  if(qty(id)<=0)toast(iname(it)+' is out of stock','bad');drawCart()}
A['pos-add']=d=>{posAdd(d.id);const q=$('#pq');if(q&&innerWidth>=720){q.value='';drawRes('');q.focus()}};
function addMixLine(mx,price,fid){CART.lines.push({it:'',nm:'Mixture: '+(mx.name||'custom'),q:1,p:num(price),mx,fid:fid||''});drawCart()}
let POSMORE=false;
A['pos-more']=()=>{POSMORE=!POSMORE;drawCart()};
function drawCart(){
  const el=$('#cart');if(!el)return;saveCart();const pats=DB.all('patients');
  const more=POSMORE||CART.disc||CART.note||CART.paid!=null||CART.pat||CART.method!=='cash';
  el.innerHTML=`<h2><span>Current bill</span>${CART.lines.length?'<button class="btn sm" data-a="pos-clear">Clear</button>':''}</h2>
  ${CART.lines.length?CART.lines.map((L,i)=>{const have=L.it?qty(L.it):null;const sub=L.mx?(L.mx.ings||[]).map(g=>((DB.get('items',g.it)||{}).name||'?')+' '+fq(g.q)).join(', '):'';
    return`<div class="line"><div class="nm">${esc(L.nm)}<small>${L.mx?esc(sub):!L.it?'Service / fee':`In stock: <span style="${have<L.q?'color:var(--bad);font-weight:700':''}">${fq(have)}</span>`}</small></div><button class="ib" data-a="pos-rm" data-idx="${i}" aria-label="Remove">${ico('trash')}</button>
    <div class="ctl"><button class="step" data-a="pos-step" data-idx="${i}" data-d="-1">−</button><input data-c="pos-q" data-idx="${i}" inputmode="decimal" value="${fq(L.q)}" aria-label="Quantity"><button class="step" data-a="pos-step" data-idx="${i}" data-d="1">+</button><span class="mut">×</span><input data-c="pos-p" data-idx="${i}" inputmode="decimal" value="${r2(L.p)}" aria-label="Price" style="width:5.5rem"><span class="tot">${money(L.q*L.p)}</span></div></div>`}).join(''):emptyBox('Bill is empty','Tap a medicine to add it.')}
  <label class="fld" style="margin-top:.8rem">Customer <span style="font-weight:500">(only needed if they pay later)</span><select data-c="pos-cust">${custOpts().map(([v,t])=>`<option value="${v}"${v===CART.cust?' selected':''}>${esc(t)}</option>`).join('')}<option value="__new">＋ New customer…</option></select></label>
  <div class="tot-box" id="tb"></div>
  <button class="more-toggle" data-a="pos-more">${more?'▾':'▸'} Discount, payment, patient &amp; note</button>
  ${more?`<div class="stack" style="margin:.6rem 0 .8rem"><div class="grid g2"><label class="fld">Discount<span style="display:flex;gap:.3rem"><input data-i="pos-disc" inputmode="decimal" value="${esc(CART.disc)}" placeholder="0"><select data-c="pos-dt" style="width:5rem"><option value="Rs"${CART.discType==='Rs'?' selected':''}>${esc(CFG().cur)}</option><option value="%"${CART.discType==='%'?' selected':''}>%</option></select></span></label>
   <label class="fld">Paid by<select data-c="pos-method">${['cash','card','UPI / wallet','bank','credit'].map(m=>`<option${m===CART.method?' selected':''}>${m}</option>`).join('')}</select></label></div>
   <label class="fld">Amount received (leave empty = full amount)<input data-i="pos-paid" inputmode="decimal" value="${CART.paid==null?'':esc(CART.paid)}" placeholder="full amount"></label>
   ${pats.length?`<label class="fld">Patient (optional)<select data-c="pos-pat"><option value="">—</option>${pats.sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<option value="${p.id}"${p.id===CART.pat?' selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`:''}
   <label class="fld">Note for yourself<textarea data-i="pos-note" dir="auto" rows="2" placeholder="e.g. remaining amount tomorrow">${esc(CART.note)}</textarea></label></div>`:''}
  <div class="bar" style="margin:.8rem 0 0"><button class="btn" data-a="pos-hold" ${CART.lines.length?'':'disabled'}>Hold</button><button class="btn pri bigpay" style="flex:1" data-a="pos-pay" ${CART.lines.length?'':'disabled'}>Complete sale</button></div>`;
  updTot();const cb=$('#cartbar');if(cb){const n=CART.lines.length;cb.style.display=n?'':'none';cb.innerHTML=`${ico('cart')}<span>${n} item(s) · ${money(cartTotals(CART).total)}</span><b>Review bill ↓</b>`}}
A['goto-cart']=()=>{const c=$('#cart');c&&c.scrollIntoView({behavior:'smooth',block:'start'})};
function updTot(){
  const tb=$('#tb');if(!tb)return;const T=cartTotals(CART),paid=CART.paid==null||CART.paid===''?T.total:num(CART.paid);
  tb.innerHTML=`<div class="r"><span>Subtotal</span><span>${money(T.sub)}</span></div>${T.disc?`<div class="r"><span>Discount</span><span>− ${money(T.disc)}</span></div>`:''}<div class="r big"><span>Total</span><span>${money(T.total)}</span></div>${paid<T.total?`<div class="r" style="color:var(--bad)"><span>Balance (on credit)</span><span>${money(T.total-paid)}</span></div>`:paid>T.total?`<div class="r"><span>Change to return</span><span>${money(paid-T.total)}</span></div>`:''}`}
HC['pos-q']=(v,el,d)=>{const L=CART.lines[+d.idx];if(!L)return;const n=num(v);if(n<=0)CART.lines.splice(+d.idx,1);else L.q=r3(n);drawCart()};
HC['pos-p']=(v,el,d)=>{const L=CART.lines[+d.idx];if(L){L.p=Math.max(0,num(v));drawCart()}};
A['pos-step']=d=>{const L=CART.lines[+d.idx];if(!L)return;L.q=r3(L.q+ +d.d);if(L.q<=0)CART.lines.splice(+d.idx,1);drawCart()};
A['pos-rm']=d=>{CART.lines.splice(+d.idx,1);drawCart()};
A['pos-clear']=async()=>{if(await ask('Clear the whole bill?',{ok:'Clear',bad:true})){CART=newCart();drawCart()}};
HC['pos-cust']=(v,el)=>{if(v==='__new'){el.value=CART.cust;partyForm('c',null,id=>{CART.cust=id;drawCart()});return}CART.cust=v;saveCart()};
HC['pos-pat']=v=>{CART.pat=v;saveCart()};
HC['pos-method']=v=>{CART.method=v;saveCart()};
HC['pos-dt']=v=>{CART.discType=v;saveCart();updTot()};
HI['pos-disc']=v=>{CART.disc=v;saveCart();updTot()};
HI['pos-paid']=v=>{CART.paid=v===''?null:v;saveCart();updTot()};
HI['pos-note']=v=>{CART.note=v;saveCart()};
A['pos-hold']=()=>{const h=held();h.push({...CART,at:Date.now()});ls.set('hs_held',h);CART=newCart();drawCart();const n=$('#heldN');if(n)n.textContent=h.length;toast('Bill put on hold','ok')};
A['pos-held']=()=>{const h=held();
  modal({title:'Held bills',html:h.length?h.map((b,i)=>`<div class="row static"><div class="r-main"><b>${b.lines.length} item(s) · ${money(cartTotals(b).total)}</b><small>${new Date(b.at).toLocaleString()}${b.cust?' · '+esc(custName(b.cust)):''}</small></div><button class="btn sm pri" data-a="held-use" data-i="${i}">Resume</button><button class="btn sm bad" data-a="held-del" data-i="${i}">Delete</button></div>`).join(''):emptyBox('No held bills')})};
A['held-use']=d=>{const h=held(),b=h.splice(+d.i,1)[0];if(!b)return;if(CART.lines.length){h.push({...CART,at:Date.now()})}ls.set('hs_held',h);delete b.at;CART=Object.assign(newCart(),b);A.closeTop();const n=$('#heldN');if(n)n.textContent=h.length;drawCart()};
A['held-del']=d=>{const h=held();h.splice(+d.i,1);ls.set('hs_held',h);A.closeTop();const n=$('#heldN');if(n)n.textContent=h.length};
A['pos-mix']=()=>mixBuilder({once:true});
A['pos-fee']=()=>modal({title:'Add fee / service',html:`<form class="stack" onsubmit="return false">${F.t('Description','nm','Consultation fee')}${F.n('Amount','amt','',{required:true})}</form>`,foot:[{t:'Cancel',fn:()=>{}},{t:'Add',cls:'pri',fn:el=>{const f=formData(el);if(num(f.amt)<=0||!f.nm.trim()){toast('Enter description and amount','bad');return false}CART.lines.push({it:'',nm:f.nm.trim(),q:1,p:num(f.amt)});drawCart()}}]});
A['pos-formula']=()=>{const fs=DB.all('formulas').sort((a,b)=>a.name.localeCompare(b.name));
  modal({title:'Saved formulas',html:fs.length?fs.map(f=>`<div class="row" data-a="pos-use-formula" data-id="${f.id}"><div class="r-main"><b>${esc(f.name)}</b><small>${esc(mixSummary(f.ings))}</small></div><div class="r-side"><b>${money(f.price)}</b></div></div>`).join(''):emptyBox('No saved formulas yet','Create them in Mixtures.')})};
A['pos-use-formula']=d=>{const f=DB.get('formulas',d.id);if(!f)return;A.closeTop();addMixLine({name:f.name,ings:f.ings,note:f.note},f.price,f.id)};
A['pos-scan']=()=>scanBarcode(v=>{const it=DB.all('items').find(i=>i.barcode&&i.barcode===v);if(it){posAdd(it.id);toast(iname(it)+' added','ok')}else toast('No medicine has barcode '+v,'bad')});
A['stock-scan']=()=>scanBarcode(v=>{const it=DB.all('items').find(i=>i.barcode&&i.barcode===v);if(it)openItem(it.id);else{SU.q=v;const q=$('#sq');if(q)q.value=v;drawStock();toast('No medicine has that barcode','bad')}});
A['form-scan']=()=>scanBarcode(v=>{const e=document.querySelector('.modal [name=barcode]');if(e)e.value=v});
A['pos-pkg']=d=>{const p=pkgList()[+d.i];if(!p)return;CART.lines.push({it:'',nm:p.n,q:1,p:p.fee});CART.pkg={n:p.n,days:p.days,fee:p.fee};drawCart();
  if(p.days&&!CART.pat)toast('Choose the patient in the bill to set their follow-up date automatically','ok');else toast(p.n+' added','ok')};
A['pos-pay']=async()=>{
  if(!CART.lines.length)return;const T=cartTotals(CART),paid=CART.paid==null||CART.paid===''?T.total:num(CART.paid);
  if(paid<T.total&&!CART.cust)return toast('Select a customer to sell on credit (or enter full payment)','bad');
  const r=checkout(CART);
  if(r.err){const msg=r.err.map(e=>`• ${iname(DB.get('items',e.it))}: short by ${fq(e.n)}`).join('\n');
    modal({title:'Not enough stock',html:`<p style="margin-top:0">Stock is not enough (expired batches are excluded):</p><pre class="code">${esc(msg)}</pre><p class="mut">Reduce the quantity, add stock, or allow negative stock in Settings.</p>`});return}
  const s=r.sale;if(CART.pkg&&CART.pat)pkgVisit(CART.pat,CART.pkg,CART.pkg.fee);CART=newCart();drawCart();const cu=DB.get('customers',s.cust);
  modal({title:'Sale complete',html:`<div class="stack" style="text-align:center"><div style="width:3.4rem;height:3.4rem;border-radius:50%;background:var(--okb);color:var(--ok);display:flex;align-items:center;justify-content:center;margin:0 auto">${ico('check')}</div><b style="font-size:1.6rem">${money(s.total)}</b><div class="mut">Bill ${esc(s.no)}${r.change?` · Return change ${money(r.change)}`:''}${s.total>s.paid?` · Due ${money(s.total-s.paid)}`:''}</div></div>`,
   foot:[{t:ico('print')+' Receipt',keep:true,fn:()=>{printReceipt(s);return false}},{t:ico('tag')+' Labels',keep:true,fn:()=>{labelsForm(s);return false}},{t:ico('chat')+' WhatsApp',fn:()=>{window.open(waUrl(cu&&cu.phone,receiptText(s)),'_blank');return false}},{t:'New bill',cls:'pri',fn:()=>{}}]})};

/* ---------------- Stock ---------------- */
const SU={q:'',f:'all',c:'',lim:60};
const stockFilter=it=>{const s=istate(it);switch(SU.f){case'low':return s==='low';case'out':return s==='out'||s==='neg';case'soon':return batchesOf(it.id).some(b=>bq(b.id)>0&&expState(b)==='soon');case'exp':return batchesOf(it.id).some(b=>bq(b.id)>0&&expState(b)==='expired');case'arch':return!!it.arch;default:return!it.arch}};
V.stock={title:'Medicines',render(){
  return`<div class="bar"><div class="search">${ico('search')}<input id="sq" data-i="stock-q" placeholder="Search name, potency, brand, barcode…" value="${esc(SU.q)}" dir="auto" autocomplete="off"></div><button class="btn" data-a="stock-scan" aria-label="Scan barcode">${ico('scan')}</button><button class="btn pri" data-a="item-new">${ico('plus')}<span>Add</span></button><button class="btn" data-a="stock-menu" aria-label="More">${ico('more')}</button></div><div class="chips" id="scat"></div><div class="chips" id="schips"></div><div id="slist"></div>`},
  mount(){drawStock()}};
function drawStock(){
  const list=$('#slist');if(!list)return;
  const all=DB.all('items');
  const items=all.filter(it=>matchItem(it,SU.q)&&stockFilter(it)&&(!SU.c||catOf(it)===SU.c));
  const al=alerts();
  $('#scat').innerHTML=[['','All types'],...CATS].map(([k,t])=>`<button class="chip ${SU.c===k?'on':''}" data-a="stock-c" data-c="${k}">${t}${k?' · '+all.filter(i=>!i.arch&&catOf(i)===k).length:''}</button>`).join('');
  $('#schips').innerHTML=[['all','All',all.filter(i=>!i.arch).length],['low','Low',al.low.length],['out','Finished',al.out.length+al.neg.length],['soon','Expiring',new Set(al.soon.map(x=>x.it.id)).size],['exp','Expired',new Set(al.exps.map(x=>x.it.id)).size],['arch','Archived']].map(([k,t,n])=>`<button class="chip ${SU.f===k?'on':''}" data-a="stock-f" data-f="${k}">${t}${n!=null?' · '+n:''}</button>`).join('');
  /* one card per medicine name (+brand) with a pill for every potency / pack */
  const gm=new Map();items.forEach(it=>{const k=(it.name||'').toLowerCase().trim()+'|'+(it.brand||'').toLowerCase().trim();if(!gm.has(k))gm.set(k,[]);gm.get(k).push(it)});
  const groups=[...gm.values()].map(g=>g.sort((a,b)=>potRank(a.potency)-potRank(b.potency)||(a.size||'').localeCompare(b.size||'',undefined,{numeric:true}))).sort((a,b)=>(a[0].name||'').localeCompare(b[0].name||'')||(a[0].brand||'').localeCompare(b[0].brand||''));
  list.innerHTML=groups.length?groups.slice(0,SU.lim).map(g=>{const f=g[0];let nx=null;
    const pills=g.map(it=>{const q=qty(it.id),s=istate(it),ol=openList(it.id).length;const nb=batchesOf(it.id).filter(b=>bq(b.id)>0&&b.exp).sort((a,b)=>a.exp<b.exp?-1:1)[0];const ex=nb&&expState(nb);if(ex&&(!nx||ex==='expired'))nx=ex;
      const lab=[it.potency,it.size].filter(Boolean).join(' · ')||it.form||it.unit||'1 pack';
      return`<button class="pill ${s}" data-a="item-open" data-id="${it.id}" title="${esc(iname(it))}"><span>${esc(lab)}</span><b>${fq(q)}</b>${ol?`<i title="Open at counter">+${ol} open</i>`:''}${ex?`<em class="${ex}"></em>`:''}</button>`}).join('');
    const tot=g.reduce((a,it)=>a+Math.max(0,qty(it.id)),0);
    return`<div class="grp"><div class="gh"${g.length===1?` data-a="item-open" data-id="${f.id}"`:''}><div class="r-main"><b>${esc(f.name)}</b><small>${esc([f.brand,g.length===1?f.form:'',g.length>1?g.length+' potencies / packs':''].filter(Boolean).join(' · '))}</small></div><div class="r-side">${nx?`<span class="badge ${nx==='expired'?'bad':'warn'}">${nx==='expired'?'Expired':'Exp soon'}</span>`:''}${g.length===1?`<small>${money(f.sell)}</small>`:`<small class="mut">total ${fq(tot)}</small>`}</div></div><div class="pills">${pills}</div></div>`}).join('')+(groups.length>SU.lim?`<button class="btn block" data-a="stock-more">Show more (${groups.length-SU.lim} more)</button>`:'')
   :emptyBox(all.length?'No medicines match':'No medicines yet','',all.length?'':`<button class="btn pri" data-a="item-new">${ico('plus')} Add first medicine</button>`)}
A['stock-c']=d=>{SU.c=d.c;SU.lim=60;drawStock()};
HI['stock-q']=v=>{SU.q=v;SU.lim=60;drawStock()};
A['stock-f']=d=>{SU.f=d.f;SU.lim=60;drawStock()};
A['stock-more']=()=>{SU.lim+=100;drawStock()};
A['stock-menu']=()=>modal({title:'Stock tools',sticky:false,html:`<div class="stack">
  <button class="btn" data-a="import-csv">${ico('download')} Import medicines (Excel / CSV)</button>
  ${isOwner()?`<button class="btn" data-a="stock-export">${ico('file')} Download stock list (Excel / CSV / PDF)</button>`:''}
  <button class="btn" data-a="goto" data-r="audit">${ico('check')} Count stock (compare shelf with app)</button>
  <button class="btn" data-a="convert">${ico('swap')} Repack bottles (big bottle → small ones)</button>
  ${isOwner()?`<button class="btn" data-a="move-log">${ico('file')} Stock history log</button>`:''}</div>`});
function stockRows(){return DB.all('items').filter(i=>!i.arch).sort(byName).map(i=>{const q=qty(i.id);const nb=batchesOf(i.id).filter(b=>bq(b.id)>0&&b.exp).sort((a,b)=>a.exp<b.exp?-1:1)[0];return[i.name,i.potency||'',i.size||'',i.brand||'',i.form||'',i.rack||'',q,i.unit||'',num(i.buy),num(i.sell),num(i.reorder),supName(i.sup),r2(Math.max(0,q)*num(i.buy)),nb?nb.exp:'']})}
const STOCK_HEAD=['Medicine','Potency','Size','Brand','Form','Rack','Stock','Unit','Buy price','Sell price','Reorder level','Supplier','Stock value','Nearest expiry'];
A['stock-export']=()=>{A.closeTop();const rows=stockRows();exportMenu({title:'Stock list',head:STOCK_HEAD,rows,foot:['TOTAL','','','','','',rows.reduce((s,r)=>s+r[6],0),'','','','','',r2(rows.reduce((s,r)=>s+r[12],0)),''],text:null})};
A['move-log']=()=>{A.closeTop();const rows=DB.all('moves').sort((a,b)=>b.t-a.t).slice(0,1000).map(m=>[m.d,ftime(m.t),iname(DB.get('items',m.item)),m.type,m.q,m.note||'']);exportMenu({title:'Stock movement log (last 1000)',head:['Date','Time','Medicine','Type','Qty','Note'],rows})};

/* --- item detail --- */
function openItem(id){
  const it=DB.get('items',id);if(!it)return;const own=isOwner();
  const q=qty(id),bs=batchesOf(id).map(b=>({b,q:bq(b.id)})).filter(x=>x.q>0).sort((a,b)=>(a.b.exp||'9999')<(b.b.exp||'9999')?-1:1);
  const mv=DB.all('moves').filter(m=>m.item===id).sort((a,b)=>b.t-a.t).slice(0,12),s=istate(it);
  return modal({title:esc(iname(it)),sticky:false,cls:'wide',html:`<div class="stack">
   <div style="display:flex;align-items:center;gap:.8rem;flex-wrap:wrap"><div><small class="mut">In stock</small><div class="qty ${s==='ok'?'':s}" style="font-size:2.3rem;line-height:1.1">${fq(q)} <small class="mut" style="font-size:1rem">${esc(it.unit||'')}</small></div></div>${stBadge(it)}${it.arch?'<span class="badge mut">Archived</span>':''}<div style="margin-left:auto;text-align:right"><small class="mut">Selling price</small><div class="qty">${money(it.sell)}</div></div></div>
   <div class="grid g3"><button class="btn pri" data-a="add-stock" data-id="${id}" data-cl="1">${ico('plus')} Add stock</button><button class="btn" data-a="item-sell" data-id="${id}">${ico('cart')} Sell</button><button class="btn" data-a="adj-stock" data-id="${id}" data-cl="1">${ico('minus')} Remove</button></div>
   <div class="card" style="margin:0"><h2><span>Clinic counter (open bottles)</span><span class="badge ${openList(id).length?'warn':'mut'}">${openList(id).length} open</span></h2><div class="mut" style="margin:-.2rem 0 .6rem">A sealed bottle you open for dispensing leaves sealed stock but is not lost – you always see how many are in use.</div><div class="grid g2"><button class="btn" data-a="open-bottle" data-id="${id}">${ico('plus')} Open 1 bottle for clinic</button>${openList(id).length?`<button class="btn" data-a="open-finish" data-id="${id}">${ico('check')} Open bottle finished</button>`:`<span></span>`}</div>${openList(id).map(o=>`<div class="mut" style="margin-top:.3rem">• Opened ${fdate(o.d)} (${Math.max(0,daysBetween(o.d,ymd()))} days ago)</div>`).join('')}</div>
   ${bs.length?`<div><div class="sec" style="margin-top:0"><h3>Expiry dates</h3></div>${bs.map(({b,q})=>{const e=expState(b);return`<div class="row static"><div class="r-main"><b>${b.exp?'Expires '+fdate(b.exp):'No expiry date'}</b><small>Batch ${esc(b.no||'—')}${b.mfg?' · made '+fdate(b.mfg):''}</small></div><div class="r-side">${e?`<span class="badge ${e==='expired'?'bad':'warn'}">${e==='expired'?'Expired':'Expiring soon'}</span>`:''}<div class="qty">${fq(q)}</div></div></div>`}).join('')}</div>`:''}
   ${it.note?noteBox(it.note):''}
   <details class="help"><summary>Details &amp; history</summary><div class="stack" style="margin-top:.7rem"><dl class="kv"><dt>Brand</dt><dd>${esc(it.brand||'—')}</dd><dt>Form</dt><dd>${esc(it.form||'—')}</dd><dt>Shelf / rack</dt><dd>${esc(it.rack||'—')}</dd><dt>Barcode</dt><dd>${esc(it.barcode||'—')}</dd><dt>Supplier</dt><dd>${esc(supName(it.sup)||'—')}</dd><dt>Warns when stock is</dt><dd>${fq(reo(it))} or less</dd>${own?`<dt>Purchase price</dt><dd>${money(it.buy)}</dd><dt>Margin</dt><dd>${it.sell?Math.round((it.sell-it.buy)/it.sell*100)+'%':'—'}</dd><dt>Stock value</dt><dd>${money(Math.max(0,q)*num(it.buy))}</dd>`:''}</dl>
   ${mv.length?`<div class="tw"><table class="t"><thead><tr><th>Date</th><th>What</th><th class="n">Qty</th><th>Note</th></tr></thead><tbody>${mv.map(x=>`<tr><td>${fdate(x.d)}</td><td>${esc(x.type)}</td><td class="n" style="color:${x.q<0?'var(--bad)':'var(--ok)'}">${x.q>0?'+':''}${fq(x.q)}</td><td>${esc(x.note||'')}</td></tr>`).join('')}</tbody></table></div>`:''}</div></details>
   <div class="grid g3"><button class="btn" data-a="item-edit" data-id="${id}">${ico('edit')} Edit</button><button class="btn" data-a="item-order" data-id="${id}">${ico('truck')} Order</button><button class="btn" data-a="note-new" data-ref="${esc('Medicine: '+iname(it))}">${ico('note')} Note</button>${own?`<button class="btn bad" data-a="item-del" data-id="${id}">${ico('trash')} ${DB.all('moves').some(x=>x.item===id)?'Archive':'Delete'}</button>`:''}</div></div>`})}
A['item-open']=d=>openItem(d.id);
A['open-bottle']=d=>{const it=DB.get('items',d.id);const r=openBottle(d.id,1);if(r.err){toast('No sealed stock left to open','bad');return}toast('1 bottle opened – sealed stock now '+fq(qty(d.id)),'ok');A.closeTop();openItem(d.id)};
A['open-finish']=async d=>{const l=openList(d.id);if(!l.length)return;const o=l[0];modal({title:'Open bottle finished',html:`<form class="stack" onsubmit="return false"><p class="mut" style="margin:0">Opened ${fdate(o.d)}. Mark it as finished (empty / discarded). Then open a new one when needed.</p>${F.s('What happened?','why',['Finished (used up)','Discarded (spoiled / contaminated)','Expired'],'Finished (used up)')}</form>`,foot:[{t:'Cancel',fn:()=>{}},{t:'Mark finished',cls:'pri',fn:el=>{finishOpen(o.id,formData(el).why);toast('Done','ok');A.closeTop();openItem(d.id)}}]})};
A['item-sell']=d=>{A.closeTop();posAdd(d.id);location.hash='#/sell'};
A['item-order']=d=>{A.closeTop();addToOrderDraft(d.id)};
A['item-del']=async d=>{const it=DB.get('items',d.id);const has=DB.all('moves').some(x=>x.item===d.id);
  if(!await ask(has?`Archive "${iname(it)}"? It has stock history, so it will be hidden (not deleted).`:`Delete "${iname(it)}"?`,{ok:has?'Archive':'Delete',bad:true}))return;
  if(has)DB.put('items',{...it,arch:1});else DB.del('items',d.id);A.closeTop();toast(has?'Archived':'Deleted','ok')};

/* --- item form (add / edit medicine) --- */
const unitOpts=['','bottle','vial','pack','strip','tube','pcs','box'];
const SIZES=['5 ml','10 ml','30 ml','100 ml','450 ml','20 g','25 g','100 g','200 g','500 g'];
const expChips=n=>`<div class="chips" style="padding:0 0 .2rem"><span class="mut" style="align-self:center;font-size:.8rem">Quick:</span>${[[6,'6 months'],[12,'1 year'],[24,'2 years'],[36,'3 years'],[60,'5 years']].map(([m,t])=>`<button type="button" class="chip" data-a="exp-q" data-n="${m}" data-for="${n}">${t}</button>`).join('')}</div>`;
A['exp-q']=(d,btn)=>{const i=btn.closest('form').querySelector('[name="'+d.for+'"]');const t=new Date();t.setMonth(t.getMonth()+ +d.n);i.value=ymd(t)};
const fsec=(t,h)=>`<div class="fsec"><h4>${t}</h4>${h}</div>`;
const supPick=cur=>`<div class="fld"><span>Supplier / distributor (where you buy it)</span><div style="display:flex;gap:.4rem"><select name="sup">${supOpts('— not set —').map(([v,t])=>`<option value="${v}"${v===cur?' selected':''}>${esc(t)}</option>`).join('')}</select><button type="button" class="btn" data-a="if-newsup" style="flex:none">${ico('plus')} New</button></div></div>`;
A['if-newsup']=(d,btn)=>partyForm('s',null,id=>{const sel=btn.closest('form').querySelector('[name="sup"]'),sp=DB.get('suppliers',id);if(sel&&sp){sel.insertAdjacentHTML('beforeend',`<option value="${sp.id}" selected>${esc(sp.name)}</option>`);sel.value=sp.id}});
function itemForm(id,cb){
  const it=id?DB.get('items',id):{};const isNew=!id,own=isOwner();
  modal({title:isNew?'Add new medicine':'Edit medicine',cls:'wide',sticky:true,html:`<form class="stack" onsubmit="return false"><datalist id="dl-name">${[...new Set(DB.all('items').map(i=>i.name))].sort().map(n=>`<option value="${esc(n)}">`).join('')}</datalist><datalist id="dl-size">${SIZES.map(n=>`<option value="${n}">`).join('')}</datalist>
   ${fsec('1 · Medicine',`${F.t('Medicine name *','name',it.name,{required:true,list:'dl-name',placeholder:'e.g. Arnica Montana'})}
     ${isNew?`<div class="fld"><span>Potency – tick one or many</span><div class="pchips">${potList().map(p=>`<label class="pchip"><input type="checkbox" name="pc_${esc(p)}"><span>${esc(p)}</span></label>`).join('')}</div></div>${F.t('Not in the list? Type your own potency (separate several with commas)','potx','',{placeholder:'e.g. 45C, LM3, 0/6, #30'})}`:pickOther('Potency','potency',potList(),it.potency,{blank:'— no potency —',ph:'Type the potency, e.g. 45C'})}
     <div class="grid g2">${pickOther('Type / form','form',formList(),it.form||'',{blank:'— choose —',ph:'Type the form'})}${pickOther('Brand / company','brand',brandList(),it.brand||'',{blank:'— choose —',ph:'Type the brand'})}</div>
     <div class="grid g2">${F.t('Pack size','size',it.size,{list:'dl-size',placeholder:'30 ml'})}${F.s('Counted in','unit',unitOpts,it.unit||'')}</div>`)}
   ${fsec('2 · Prices',`<div class="grid g3">${own?F.n('Purchase price (you pay)','buy',it.buy??''):''}${F.n('Selling price *','sell',it.sell??'')}${F.n('MRP (printed price)','mrp',it.mrp??'')}</div>`)}
   ${isNew?fsec('3 · Stock you have now',`<div class="grid g2">${F.n('How many in stock now? (for each potency)','oq','')}${F.t('Batch number','ono')}</div><div class="grid g2">${F.d('Manufacturing date','omfg')}${F.d('Expiry date','oexp')}</div>${expChips('oexp')}`):''}
   ${fsec((isNew?'4':'3')+' · Supplier',supPick(it.sup||''))}
   ${fsec((isNew?'5':'4')+' · Shelf &amp; alerts',`<div class="grid g3">${F.t('Shelf / rack','rack',it.rack,{placeholder:'A1'})}<div class="fld">Barcode<div class="bar" style="margin:0"><input name="barcode" value="${esc(it.barcode||'')}" autocomplete="off" inputmode="numeric"><button type="button" class="btn" data-a="form-scan" aria-label="Scan">${ico('scan')}</button></div></div>${F.t('Short name for search','alias',it.alias,{placeholder:'arn'})}</div>${F.n('Warn me when stock is this or less','reorder',it.reorder??'',{placeholder:'default '+CFG().defReorder})}`)}
   <details class="help"><summary>For mixtures (optional)</summary><div class="grid g2" style="margin-top:.7rem">${F.n('Content per pack','content',it.content??'',{placeholder:'30'})}${F.s('Content unit','cunit',['','ml','g','pcs','drops'],it.cunit||'')}</div></details>
   ${fsec((isNew?'6':'5')+' · Notes',F.a('Note about this medicine','note',it.note,{rows:2,placeholder:'e.g. keep away from sunlight, supplier gives 10% off on 12 pcs…'})+(isNew?'':F.c('Archived (hide from lists &amp; alerts)','arch',it.arch)))}</form>`,
   foot:[{t:'Cancel',fn:()=>{}},{t:'Save',cls:'pri',fn:el=>{
     const f=formData(el);if(!f.name.trim()){toast('Please write the medicine name','bad');return false}
     const buy=own?num(f.buy):num(it.buy);
     const base={name:f.name.trim(),size:(f.size||'').trim(),brand:(f.brand||'').trim(),form:(f.form||'').trim(),buy,sell:num(f.sell),mrp:num(f.mrp)||num(f.sell),reorder:num(f.reorder),sup:f.sup||'',rack:(f.rack||'').trim(),barcode:(f.barcode||'').trim(),unit:f.unit||'',alias:(f.alias||'').trim(),content:f.content?num(f.content):'',cunit:f.cunit||'',note:f.note||''};
     if(base.brand&&!brandList().includes(base.brand))remember('xBrand',base.brand);if(base.form&&!formList().includes(base.form))remember('xForm',base.form);
     if(!isNew){const pot=(f.potency||'').trim();if(pot&&!potList().includes(pot))remember('xPot',pot);DB.put('items',{...it,...base,potency:pot,arch:f.arch?1:0});toast('Saved','ok');cb&&cb(id);return}
     const pots=[...Object.keys(f).filter(k=>k.startsWith('pc_')&&f[k]).map(k=>k.slice(3)),...(f.potx||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean)];const uniq=[...new Set(pots)];if(!uniq.length)uniq.push('');
     const dup=uniq.filter(p=>DB.all('items').some(x=>!x.arch&&x.name.toLowerCase()===base.name.toLowerCase()&&(x.potency||'')===p&&(x.size||'')===base.size));
     if(dup.length){toast('Already in your list: '+base.name+' '+dup.join(', '),'bad');return false}
     const made=[];uniq.forEach(p=>{if(p&&!potList().includes(p))remember('xPot',p);const n=DB.put('items',{...base,potency:p,c:Date.now()});made.push(n.id);if(num(f.oq)>0)addStock(n.id,num(f.oq),{type:'open',no:(f.ono||'').trim(),exp:f.oexp,mfg:f.omfg,buy,note:'Opening stock'})});
     toast(uniq.length>1?uniq.length+' medicines added':'Medicine added','ok');cb&&cb(made[0])}}]})}
A['item-new']=()=>{if(modals.length)A.closeTop();itemForm()};
A['item-edit']=d=>{A.closeTop();itemForm(d.id)};

/* --- add stock (delivery of one medicine) / adjust / convert --- */
function addStockForm(id){const it=DB.get('items',id);if(!it)return;const own=isOwner();
  modal({title:'Add stock · '+esc(iname(it)),cls:'wide',sticky:true,mount(el){const u=()=>{const g=n=>num((el.querySelector('[name="'+n+'"]')||{}).value);const t=g('q')+Math.max(0,g('free')),e=$('#as-tot',el);if(e)e.textContent=t?fq(t)+' '+(it.unit||'')+(g('free')>0&&g('q')>0&&g('buy')>0?' · real cost '+money(g('q')*g('buy')/t)+' each':''):'—'};el.addEventListener('input',u);u()},html:`<form class="stack" onsubmit="return false"><div class="mut">Now in stock: <b>${fq(qty(id))}</b> ${esc(it.unit||'')}</div>
   ${fsec('Delivery',`<div class="grid g2">${F.n('How many bought (paid)? *','q','',{required:true,autofocus:true})}${F.n('Free / bonus qty (e.g. 10 + 1 free)','free','',{placeholder:'0'})}</div><div class="grid g2">${F.d('Date received','rd',ymd())}<div class="fld"><span>Total going into stock</span><b id="as-tot" style="padding:.6rem 0">—</b></div></div>${own?`<div class="grid g2"><div>${supPick(it.sup||'')}</div>${F.t('Supplier invoice / bill no.','inv')}</div>`:''}`)}
   ${fsec('Batch &amp; expiry',`<div class="grid g3">${F.t('Batch number','no')}${F.d('Manufacturing date','mfg')}${F.d('Expiry date','exp')}</div>${expChips('exp')}`)}
   ${own?fsec('Price &amp; payment',`<div class="grid g3">${F.n('Purchase price (each)','buy',it.buy||'')}${F.n('New selling price','sell',it.sell||'')}${F.n('New MRP','mrp',it.mrp||'')}</div>
     <div class="grid g2">${F.s('Payment to supplier','pay',[['full','Paid in full'],['later','Pay later (credit)'],['part','Part paid']],'full')}${F.n('Amount paid (if part paid)','paid','')}</div><div class="mut" style="font-size:.85rem">Payment is only recorded when a supplier is chosen. Credit appears in Suppliers → “We owe”.</div>`):''}
   ${F.a('Note','note','',{rows:2,placeholder:'e.g. 2 bottles arrived damaged'})}</form>`,
   foot:[{t:'Cancel',fn:()=>{}},{t:'Add stock',cls:'pri',fn:el=>{const f=formData(el);const q=num(f.q),fr=Math.max(0,num(f.free));if(q<=0&&fr<=0){toast('Write how many arrived','bad');return false}
     const buy=own&&f.buy!==undefined?num(f.buy):num(it.buy),exp=f.exp||'',mfg=f.mfg||'';
     if(exp&&mfg&&exp<mfg){toast('Expiry date is before the manufacturing date','bad');return false}
     if(own){const ch={};if(f.sell!==''&&num(f.sell)!==num(it.sell))ch.sell=num(f.sell);if(f.mrp!==''&&num(f.mrp)!==num(it.mrp))ch.mrp=num(f.mrp);if(f.sup&&f.sup!==it.sup)ch.sup=f.sup;if(Object.keys(ch).length)DB.put('items',{...DB.get('items',id),...ch})}
     if(own&&f.sup&&buy>0&&q>0){const total=r2(q*buy);const paid=f.pay==='later'?0:f.pay==='part'?Math.min(total,num(f.paid)):total;
       receivePurchase({sup:f.sup,inv:(f.inv||'').trim(),d:f.rd||ymd(),note:f.note||'',paid,lines:[{it:id,nm:iname(it),q,free:fr,p:buy,no:(f.no||'').trim(),exp,mfg}]},{updateBuy:true})}
     else{const all=q+fr,eff=all>0&&buy>0?r2(q*buy/all):buy;addStock(id,all,{type:'add',no:(f.no||'').trim(),exp,mfg,buy:eff,note:(f.note||'')+(fr?(f.note?' · ':'')+'incl. '+fq(fr)+' free':'')});if(own&&eff>0&&eff!==num(it.buy))DB.put('items',{...DB.get('items',id),buy:eff})}
     toast('Stock added','ok')}}]})}
A['add-stock']=d=>{if(d.cl)A.closeTop();addStockForm(d.id)};
function adjustForm(id){const it=DB.get('items',id);if(!it)return;const bs=batchesOf(id).filter(b=>bq(b.id)!==0);
  modal({title:'Remove / correct stock · '+esc(iname(it)),html:`<form class="stack" onsubmit="return false"><div class="mut">Now in stock: <b>${fq(qty(id))}</b></div>
   ${F.s('What happened?','mode',[['out','Remove some (damaged, expired, used…)'],['in','Add some (found extra)'],['set','Set the exact count']],'out')}
   <div class="grid g2">${F.n('How many? *','q','',{required:true})}${F.s('Which batch (optional)','batch',[['','Any / no batch'],...bs.map(b=>[b.id,`${b.exp?fdate(b.exp):'no expiry'} · ${b.no||'—'} · ${fq(bq(b.id))}`])],'')}</div>
   ${F.s('Reason','reason',REASONS,REASONS[0])}${F.a('Note','note','',{rows:2})}</form>`,
   foot:[{t:'Cancel',fn:()=>{}},{t:'Save',cls:'pri',fn:el=>{const f=formData(el);const n=num(f.q);if(f.mode!=='set'&&n<=0||n<0){toast('Write how many','bad');return false}
     let delta=f.mode==='out'?-n:f.mode==='in'?n:n-(f.batch?bq(f.batch):qty(id));
     if(!delta){toast('No change');return}
     DB.put('moves',{item:id,batch:f.batch,q:r3(delta),type:'adjust',ref:'',d:ymd(),t:Date.now(),note:f.reason+(f.note?' – '+f.note:'')});toast('Stock updated','ok')}}]})}
A['adj-stock']=d=>{if(d.cl)A.closeTop();adjustForm(d.id)};
A.convert=()=>{A.closeTop();let from=null,to=null;
  modal({title:'Repack / convert stock',html:`<form class="stack" onsubmit="return false"><p class="mut" style="margin:0">Use this when you open a big bottle/pack and fill smaller ones (e.g. 450 ml bottle → 15 × 30 ml bottles, or 100 g globules → vials).</p>
   <button type="button" class="btn" id="cvF">Choose source medicine…</button><div class="grid g2">${F.n('Quantity taken out *','q1','')}${F.n('Quantity made *','q2','')}</div>
   <button type="button" class="btn" id="cvT">Choose result medicine…</button>${F.a('Note','note','',{rows:2})}</form>`,
   mount(el){$('#cvF',el).onclick=()=>pickItem(i=>{from=i;$('#cvF',el).textContent='From: '+iname(i)+' (stock '+fq(qty(i.id))+')'},{title:'Source (taken from)'});$('#cvT',el).onclick=()=>pickItem(i=>{to=i;$('#cvT',el).textContent='To: '+iname(i)},{title:'Result (made)'})},
   foot:[{t:'Cancel',fn:()=>{}},{t:'Convert',cls:'pri',fn:el=>{const f=formData(el);if(!from||!to||num(f.q1)<=0||num(f.q2)<=0){toast('Choose both medicines and quantities','bad');return false}
     const P=plan([{it:from.id,q:num(f.q1),meta:{type:'conv'}}]);if(P.short.length){toast('Not enough stock of '+iname(from),'bad');return false}
     const id=rid();P.moves.forEach(m=>DB.put('moves',{...m,ref:id,d:ymd(),t:Date.now(),note:'Repack → '+iname(to)+(f.note?' · '+f.note:'')}));
     addStock(to.id,num(f.q2),{type:'conv',ref:id,note:'Repack ← '+iname(from)});toast('Stock converted','ok')}}]})};

/* --- import --- */
const HMAP={name:['name','medicine','medicine name','item','product'],potency:['potency','pot'],size:['size','pack','pack size'],brand:['brand','company','manufacturer'],form:['form','type','category'],buy:['buy','buy price','purchase','purchase price','cost'],sell:['sell','sell price','selling price','price','sale price'],mrp:['mrp'],reorder:['reorder','reorder level','min','min stock','minimum'],stock:['stock','qty','quantity','opening','opening stock'],rack:['rack','shelf','location'],barcode:['barcode','sku','code'],supplier:['supplier','distributor','vendor'],batch:['batch','batch no','batch number'],expiry:['expiry','exp','expiry date','exp date'],content:['content'],cunit:['content unit'],unit:['unit']};
A['import-csv']=()=>{if(modals.length)A.closeTop();
  modal({title:'Import medicines',html:`<div class="stack"><p class="mut" style="margin:0">Use a CSV file (Excel: <i>Save As → CSV</i>) with a header row. Columns recognised: <span class="code">name, potency, size, brand, form, buy, sell, mrp, reorder, stock, rack, barcode, supplier, batch, expiry</span>. Only <b>name</b> is required. Existing medicines (same name + potency + size) are skipped.</p>
   <button class="btn" data-a="csv-template">${ico('download')} Download template</button><input type="file" id="csvf" accept=".csv,.txt,text/csv"><textarea id="csvt" rows="5" placeholder="…or paste CSV text here" dir="auto"></textarea><div id="csvinfo" class="mut"></div></div>`,
   mount(el){$('#csvf',el).onchange=async e=>{const f=e.target.files[0];if(f)$('#csvt',el).value=await f.text();info()};$('#csvt',el).oninput=info;
     function info(){const r=parseCSV($('#csvt',el).value);$('#csvinfo',el).textContent=r.length>1?(r.length-1)+' rows found':''}},
   foot:[{t:'Cancel',fn:()=>{}},{t:'Import',cls:'pri',fn:el=>{
     const rows=parseCSV($('#csvt',el).value);if(rows.length<2){toast('Nothing to import','bad');return false}
     const hd=rows[0].map(h=>h.trim().toLowerCase()),col={};for(const k in HMAP){const i=hd.findIndex(h=>HMAP[k].includes(h));if(i>=0)col[k]=i}
     if(col.name==null){toast('No "name" column found','bad');return false}
     let add=0,skip=0;const sups=DB.all('suppliers');
     for(const r of rows.slice(1)){const g=k=>col[k]!=null?(r[col[k]]||'').trim():'';const name=g('name');if(!name)continue;
       const potency=g('potency'),size=g('size');
       if(DB.all('items').some(x=>x.name.toLowerCase()===name.toLowerCase()&&(x.potency||'')===potency&&(x.size||'')===size)){skip++;continue}
       let sup='';if(g('supplier')){let s=sups.find(x=>x.name.toLowerCase()===g('supplier').toLowerCase());if(!s){s=DB.put('suppliers',{name:g('supplier'),phone:'',note:''});sups.push(s)}sup=s.id}
       const it=DB.put('items',{name,potency,size,brand:g('brand'),form:g('form'),buy:num(g('buy')),sell:num(g('sell')),mrp:num(g('mrp'))||num(g('sell')),reorder:num(g('reorder')),rack:g('rack'),barcode:g('barcode'),sup,unit:g('unit'),content:g('content')?num(g('content')):'',cunit:g('cunit'),c:Date.now()});
       if(num(g('stock'))>0)addStock(it.id,num(g('stock')),{type:'open',no:g('batch'),exp:/^\d{4}-\d{2}-\d{2}$/.test(g('expiry'))?g('expiry'):'',buy:num(g('buy')),note:'Imported opening stock'});add++}
     toast(`${add} imported${skip?`, ${skip} skipped (already exist)`:''}`,'ok')}}]})};
A['csv-template']=()=>download(new Blob([toCSV(['name','potency','size','brand','form','buy','sell','mrp','reorder','stock','rack','barcode','supplier','batch','expiry'],[['Arnica Montana','30C','30 ml','SBL','Dilution',140,220,220,5,12,'A1','','Ali Distributors','B123','2027-12-31']])],{type:'text/csv'}),'medicines_template.csv');

/* ---------------- Stock audit ---------------- */
const AU={q:'',vals:{}};
V.audit={title:'Count stock',live:false,render(){
  return`<div class="bar"><button class="btn" data-a="goto" data-r="stock">← Stock</button><div class="search">${ico('search')}<input data-i="audit-q" placeholder="Search…" value="${esc(AU.q)}" autocomplete="off"></div><button class="btn" data-a="audit-sheet">${ico('print')} Count sheet</button></div>
  <p class="mut" style="margin:.2rem 0 .8rem">Type the physically counted quantity. Leave blank if not counted. Only differences are adjusted.</p><div id="alist"></div>
  <div class="bar" style="position:sticky;bottom:4.5rem;justify-content:flex-end"><button class="btn pri" data-a="audit-apply">Apply counted differences <span class="badge" id="acnt">0</span></button></div>`},
  mount(){drawAudit()}};
function drawAudit(){const el=$('#alist');if(!el)return;const items=DB.all('items').filter(i=>!i.arch&&matchItem(i,AU.q)).sort(byName).slice(0,150);
  el.innerHTML=items.map(i=>{const q=qty(i.id),v=AU.vals[i.id];return`<div class="row static"><div class="r-main"><b>${esc(iname(i))}</b><small>${esc(isub(i))} · system: ${fq(q)}</small></div><input data-i="audit-v" data-id="${i.id}" inputmode="decimal" value="${v??''}" style="width:5.5rem;text-align:center" placeholder="count"></div>`}).join('')+(items.length===150?'<div class="mut" style="text-align:center">Showing first 150 – use search</div>':'');cnt()}
const cnt=()=>{const n=Object.values(AU.vals).filter(v=>v!=='').length;const e=$('#acnt');if(e)e.textContent=n};
HI['audit-q']=v=>{AU.q=v;drawAudit()};
HI['audit-v']=(v,el,d)=>{if(v==='')delete AU.vals[d.id];else AU.vals[d.id]=v;cnt()};
A['audit-sheet']=()=>{const rows=DB.all('items').filter(i=>!i.arch).sort(byName).map(i=>[i.rack||'',iname(i),qty(i.id),'']);exportMenu({title:'Stock count sheet',head:['Rack','Medicine','System qty','Counted'],rows})};
A['audit-apply']=async()=>{const ids=Object.keys(AU.vals);const diffs=ids.map(id=>({id,d:r3(num(AU.vals[id])-qty(id))})).filter(x=>x.d!==0);
  if(!diffs.length){toast('No differences found','ok');return}
  if(!await ask(`${diffs.length} medicine(s) differ from the system.\n\n`+diffs.slice(0,12).map(x=>`${iname(DB.get('items',x.id))}: ${x.d>0?'+':''}${fq(x.d)}`).join('\n')+(diffs.length>12?'\n…':'')+'\n\nApply these corrections?',{ok:'Apply'}))return;
  diffs.forEach(x=>DB.put('moves',{item:x.id,batch:'',q:x.d,type:'adjust',ref:'',d:ymd(),t:Date.now(),note:'Stock audit'}));AU.vals={};toast('Audit applied','ok');drawAudit()};

/* ---- return items / labels ---- */
function returnForm(id){
  const s=DB.get('sales',id);if(!s)return;
  modal({title:'Return items · '+esc(s.no),html:`<form class="stack" onsubmit="return false"><p class="mut" style="margin:0">Enter how many the customer is returning. Stock goes back to the shelf.</p>${s.lines.map((l,i)=>l.mx||!l.it?`<div class="row static"><div class="r-main"><b>${esc(l.nm)}</b><small>cannot be returned (mixture / fee)</small></div></div>`:`<div class="row static"><div class="r-main"><b>${esc(l.nm)}</b><small>bought ${fq(l.q)} × ${money(l.p)}</small></div><input name="r${i}" inputmode="decimal" placeholder="0" style="width:5rem;text-align:center"></div>`).join('')}</form>`,
   foot:[{t:'Cancel',fn:()=>{}},{t:'Return',cls:'pri',fn:el=>{const f=formData(el),rets={};for(const k in f)if(k[0]==='r'&&num(f[k])>0)rets[k.slice(1)]=f[k];
     if(!Object.keys(rets).length){toast('Enter a quantity to return','bad');return false}
     const r=returnItems(id,rets);if(!r){toast('Nothing returned','bad');return false}
     toast(r.cash?`Returned. Refund ${money(r.cash)} to customer`:'Returned. Stock updated','ok');A.closeTop&&0}}]})}
function labelsForm(s){
  const who=custName(s.cust)||(DB.get('patients',s.pat)||{}).name||'';
  const L=s.lines.filter(l=>l.it||l.mx);
  modal({title:'Print medicine labels',html:`<form class="stack" onsubmit="return false">${F.t('Patient / customer name','who',who)}<p class="mut" style="margin:0">Write the directions for each medicine (optional). One label is printed per medicine.</p>${L.map((l,i)=>`<label class="fld">${esc(l.nm)}<input name="d${i}" dir="auto" placeholder="e.g. 4 pills, 3 times daily, 7 days"></label>`).join('')}</form>`,
   foot:[{t:'Cancel',fn:()=>{}},{t:ico('print')+' Print labels',cls:'pri',keep:true,fn:el=>{const f=formData(el),c=CFG();
     printDoc(L.map((l,i)=>`<div class="lab"><div class="ls">${esc(c.shop)}${c.phone?' · '+esc(c.phone):''}</div><div><b>${esc(f.who||'')}</b> <span style="float:right">${fdate(s.d)}</span></div><div class="lm" dir="auto">${esc(l.nm.replace(/^Mixture: /,''))}</div><div dir="auto">${esc(f['d'+i]||'')}</div></div>`).join(''),{label:true});return false}}]})}
