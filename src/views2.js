/* =====================================================================
   Views 2: Orders & GRN, Mixtures, Notes
   ===================================================================== */
const stLab={draft:['Draft','mut'],sent:['Sent','warn'],received:['Received','ok']};
const OU={tab:'orders'};
const orderTotal=o=>r2((o.lines||[]).reduce((s,l)=>s+num(l.q)*num(l.p),0));
V.orders={title:'Orders & Deliveries',render(){
  const sg=suggestions().reduce((n,g)=>n+g.items.length,0);
  return`<div class="bar"><button class="btn pri" data-a="order-new">${ico('plus')} New order list</button>${isOwner()?`<button class="btn" data-a="grn-new">${ico('box')} Delivery arrived</button>`:''}<button class="btn" data-a="ret-list">${ico('clock')} Expiry return list</button></div>
  <div class="tabs"><button class="${OU.tab==='orders'?'on':''}" data-a="ord-tab" data-t="orders">Order lists</button><button class="${OU.tab==='sugg'?'on':''}" data-a="ord-tab" data-t="sugg">To reorder${sg?' ('+sg+')':''}</button><button class="${OU.tab==='grn'?'on':''}" data-a="ord-tab" data-t="grn">Deliveries</button></div><div id="ordbody">${ordBody()}</div>`}};
A['ord-tab']=d=>{OU.tab=d.t;render(true)};
function ordBody(){
  if(OU.tab==='orders'){const os=DB.all('orders').sort((a,b)=>b.t-a.t);
    return os.length?os.map(o=>{const[l,c]=stLab[o.status||'draft'];return`<div class="row" data-a="order-open" data-id="${o.id}"><div class="r-main"><b>${esc(supName(o.sup)||'No supplier')} · ${esc(o.no)}</b><small>${fdate(o.d)} · ${o.lines.length} item(s)${o.note?' · 📝 '+esc(o.note.slice(0,40)):''}</small></div><div class="r-side"><span class="badge ${c}">${l}</span>${orderTotal(o)?`<small>${money(orderTotal(o))}</small>`:''}</div></div>`}).join(''):emptyBox('No order lists yet','Create one, or open the "To reorder" tab to build it from low stock.')}
  if(OU.tab==='sugg'){const gs=suggestions();
    return gs.length?`<div class="bar"><span class="mut" style="flex:1">Medicines at or below their reorder level, grouped by supplier. The app builds these lists for you.</span><button class="btn pri" data-a="sugg-all">${ico('list')} Create all order lists</button></div>`+gs.map(g=>`<div class="card"><h2><span>${esc(supName(g.sup)||'No supplier set')} <span class="badge">${g.items.length}</span></span><button class="btn sm pri" data-a="sugg-make" data-sup="${g.sup}">Create list</button></h2>${g.items.map(i=>`<div class="row static"><div class="r-main"><b>${esc(iname(i))}</b><small>Stock ${fq(qty(i.id))} · min ${fq(reo(i))}</small></div><div class="r-side"><small>suggest</small><b>${suggestQty(i)}</b></div></div>`).join('')}</div>`).join(''):emptyBox('Nothing to reorder','All medicines are above their reorder level. Set reorder levels on each medicine.')}
  const ps=DB.all('purchases').sort((a,b)=>b.t-a.t);
  return ps.length?ps.map(p=>`<div class="row" data-a="grn-open" data-id="${p.id}"><div class="r-main"><b>${esc(supName(p.sup)||'Purchase')} · ${esc(p.no)}</b><small>${fdate(p.d)}${p.inv?' · Inv '+esc(p.inv):''} · ${p.lines.length} item(s)</small></div><div class="r-side"><b>${money(p.total)}</b>${p.total>p.paid?`<small style="color:var(--bad)">due ${money(p.total-p.paid)}</small>`:''}</div></div>`).join(''):emptyBox('No stock received yet','Use "Receive stock" when a supplier delivers.')}
A['grn-open']=d=>{const p=DB.get('purchases',d.id);if(!p)return;
  modal({title:'Purchase '+p.no,html:`<div class="stack"><div class="mut">${fdate(p.d)} · ${esc(supName(p.sup))}${p.inv?' · Invoice '+esc(p.inv):''}</div>${p.lines.map(l=>`<div class="row static"><div class="r-main"><b>${esc(l.nm)}</b><small>${fq(l.q)}${num(l.free)?' + '+fq(l.free)+' free':''} × ${money(l.p)}${l.no?' · batch '+esc(l.no):''}${l.exp?' · exp '+fdate(l.exp):''}</small></div><b>${money(l.q*l.p)}</b></div>`).join('')}<dl class="kv"><dt>Total</dt><dd>${money(p.total)}</dd><dt>Paid</dt><dd>${money(p.paid)}</dd></dl>${noteBox(p.note)}</div>`})};

/* ---- order list editor ---- */
let OE=null;
const ulabI=it=>it?(it.unit||'pcs'):'';
function newOrderSeed(sup=''){return{no:nextNo('po'),d:ymd(),t:Date.now(),sup,lines:[],note:'',inc:true,status:'draft'}}
A['order-new']=()=>orderEditor(newOrderSeed());
A['order-open']=d=>orderEditor(DB.get('orders',d.id));
function orderLine(it,note=''){return{it:it.id,nm:iname(it),q:suggestQty(it),u:it.unit||'',p:num(it.buy),n:note}}
A['sugg-all']=()=>{const gs=suggestions();if(!gs.length)return;gs.forEach(g=>{const o=newOrderSeed(g.sup);o.lines=g.items.map(i=>orderLine(i,`stock ${fq(qty(i.id))} / min ${fq(reo(i))}`));DB.put('orders',o)});OU.tab='orders';toast(gs.length+' order list(s) created – open one to edit and send','ok');render(true)};
A['sugg-make']=d=>{const g=suggestions().find(x=>x.sup===d.sup);if(!g)return;const o=newOrderSeed(d.sup);o.lines=g.items.map(i=>orderLine(i,`stock ${fq(qty(i.id))} / min ${fq(reo(i))}`));orderEditor(o)};
function addToOrderDraft(itemId){
  const it=DB.get('items',itemId);if(!it)return;
  let o=DB.all('orders').filter(x=>(x.status||'draft')==='draft'&&(x.sup||'')===(it.sup||'')).sort((a,b)=>b.t-a.t)[0];
  if(!o)o=newOrderSeed(it.sup||'');
  const L=o.lines.find(l=>l.it===itemId);if(L)L.q=num(L.q)+1;else o.lines.push(orderLine(it));
  DB.put('orders',o);toast(`Added to order list${it.sup?' ('+supName(it.sup)+')':''}`,'ok')}
function orderEditor(o){
  OE=JSON.parse(JSON.stringify(o));OE.lines=OE.lines||[];
  modal({title:OE.id?'Order list '+esc(OE.no):'New order list',cls:'full',html:`<div class="stack">
   <div class="grid g3"><label class="fld">Supplier<select data-c="oe-sup">${supOpts('— choose supplier —').map(([v,t])=>`<option value="${v}"${v===OE.sup?' selected':''}>${esc(t)}</option>`).join('')}</select></label>
   <label class="fld">Date<input type="date" data-c="oe-d" value="${OE.d}"></label><label class="fld">Status<select data-c="oe-st"><option value="draft"${OE.status==='draft'?' selected':''}>Draft</option><option value="sent"${OE.status==='sent'?' selected':''}>Sent</option><option value="received"${OE.status==='received'?' selected':''}>Received</option></select></label></div>
   <div id="oelines"></div>
   <div class="bar"><button class="btn" data-a="oe-add">${ico('plus')} Medicine</button><button class="btn" data-a="oe-custom">${ico('plus')} Custom item</button><button class="btn" data-a="oe-low">Add low stock</button></div>
   <div class="tot-box" id="oetot"></div>
   <label class="fld">Notes / reminders for this order<textarea data-i="oe-note" dir="auto" rows="3" placeholder="e.g. ask for 10% discount, deliver before Friday, check new price list…">${esc(OE.note)}</textarea></label>
   <label class="fld chk"><input type="checkbox" data-c="oe-inc" ${OE.inc?'checked':''}> Include this note when sending / printing</label></div>`,
   mount(){drawOE()},
   foot:[{t:'Close',fn:()=>{}},{t:ico('share')+' Send / Export',keep:true,fn:()=>{saveOE();exportOrder();return false}},{t:'Save',fn:()=>{saveOE();toast('Order saved','ok')}},{t:ico('box')+' Delivery arrived',cls:'pri',fn:()=>{const o=saveOE();A.closeTop();grnFromOrder(o);return false}}]})}
function saveOE(){OE.lines=OE.lines.filter(l=>l.nm&&num(l.q)>0);return OE=DB.put('orders',OE)}
function drawOE(){
  const el=$('#oelines');if(!el)return;
  el.innerHTML=OE.lines.length?OE.lines.map((L,i)=>{const it=L.it&&DB.get('items',L.it);return`<div class="line"><div class="nm">${L.it?esc(L.nm):`<input data-i="oe-l" data-idx="${i}" data-f="nm" value="${esc(L.nm)}" placeholder="Item name" dir="auto">`}<small>${it?`In stock ${fq(qty(L.it))} · min ${fq(reo(it))}`:'Custom item'}</small></div><button class="ib" data-a="oe-rm" data-idx="${i}" aria-label="Remove">${ico('trash')}</button>
   <div class="ctl"><input data-i="oe-l" data-idx="${i}" data-f="q" inputmode="decimal" value="${esc(L.q)}" aria-label="Qty"><input data-i="oe-l" data-idx="${i}" data-f="u" value="${esc(L.u||'')}" placeholder="unit" style="width:5rem"><span class="mut">@</span><input data-i="oe-l" data-idx="${i}" data-f="p" inputmode="decimal" value="${esc(L.p||'')}" placeholder="price" style="width:5.5rem"><span class="tot" id="olt${i}">${num(L.p)?money(num(L.q)*num(L.p)):''}</span></div>
   <input data-i="oe-l" data-idx="${i}" data-f="n" value="${esc(L.n||'')}" placeholder="note for this item…" dir="auto" style="grid-column:1/-1"></div>`}).join(''):emptyBox('No items yet','Add medicines with the buttons below.');
  updOE()}
function updOE(){const t=$('#oetot');if(t)t.innerHTML=`<div class="r"><span>${OE.lines.length} item(s)</span><span>Estimated: <b>${money(orderTotal(OE))}</b></span></div>`}
HI['oe-l']=(v,el,d)=>{const L=OE.lines[+d.idx];if(!L)return;L[d.f]=v;if(d.f==='q'||d.f==='p'){const e=$('#olt'+d.idx);if(e)e.textContent=num(L.p)?money(num(L.q)*num(L.p)):'';updOE()}};
HI['oe-note']=v=>{OE.note=v};
HC['oe-sup']=v=>{OE.sup=v};HC['oe-d']=v=>{OE.d=v};HC['oe-st']=v=>{OE.status=v};HC['oe-inc']=(v,el)=>{OE.inc=el.checked};
A['oe-rm']=d=>{OE.lines.splice(+d.idx,1);drawOE()};
A['oe-add']=()=>pickItem(it=>{const L=OE.lines.find(l=>l.it===it.id);if(L)L.q=num(L.q)+1;else OE.lines.push(orderLine(it));if(!OE.sup&&it.sup){OE.sup=it.sup;const s=$('[data-c="oe-sup"]');if(s)s.value=it.sup}drawOE()});
A['oe-custom']=()=>{OE.lines.push({it:'',nm:'',q:1,u:'',p:0,n:''});drawOE()};
A['oe-low']=()=>{let n=0;suggestions().forEach(g=>{if(OE.sup&&g.sup!==OE.sup)return;g.items.forEach(i=>{if(!OE.lines.some(l=>l.it===i.id)){OE.lines.push(orderLine(i,`stock ${fq(qty(i.id))} / min ${fq(reo(i))}`));n++}})});toast(n?n+' item(s) added':'No low-stock items to add');drawOE()};
function orderText(o){const c=CFG(),s=supName(o.sup);
  return`*${c.shop}* – Order request\n${s?'To: '+s+'\n':''}Date: ${fdate(o.d)}\n\n`+o.lines.map((l,i)=>`${i+1}. ${l.nm} × ${fq(num(l.q))}${l.u?' '+l.u:''}${l.n?' ('+l.n+')':''}`).join('\n')+(o.inc&&o.note?`\n\nNote: ${o.note}`:'')+`\n\nPlease confirm availability & price. Thank you.`}
function exportOrder(){
  const o=OE,sp=DB.get('suppliers',o.sup)||{};
  const rows=o.lines.map((l,i)=>[i+1,l.nm,num(l.q),l.u||'',num(l.p)||'',num(l.p)?r2(num(l.q)*num(l.p)):'',l.n||'']);
  const hasP=rows.some(r=>r[4]!=='');
  exportMenu({title:'Order '+o.no+(sp.name?' - '+sp.name:''),head:['#','Medicine','Qty','Unit','Est. price','Amount','Note'],rows,foot:hasP?['','TOTAL','','','',orderTotal(o),'']:null,text:orderText(o),phone:sp.phone,email:sp.email,subject:`Order request – ${CFG().shop}`,sub:`${sp.name?'Supplier: '+sp.name+' · ':''}Date: ${fdate(o.d)}`,
    noteHtml:o.inc&&o.note?`<div class="note-box"><b>Note:</b> ${esc(o.note)}</div>`:'',
    extraHtml:`<div class="mut" style="margin-top:.4rem">${sp.phone?'WhatsApp opens with '+esc(sp.name)+"'s number.":'No supplier phone saved – WhatsApp will let you choose a contact.'}</div><button class="btn block" data-a="mark-sent" style="margin-top:.5rem">${ico('check')} Mark this order as sent</button>`})}
A['mark-sent']=()=>{if(!OE)return;OE.status='sent';OE=DB.put('orders',OE);const s=$('[data-c="oe-st"]');if(s)s.value='sent';toast('Marked as sent','ok')};

/* ---- receive stock (GRN) ---- */
let GE=null;
A['grn-new']=()=>grnEditor({});
function grnFromOrder(o){
  const lines=o.lines.filter(l=>l.it&&num(l.q)>0).map(l=>({it:l.it,nm:l.nm,q:num(l.q),p:num(l.p)||num((DB.get('items',l.it)||{}).buy),no:'',exp:''}));
  const skipped=o.lines.filter(l=>!l.it).length;if(skipped)toast(skipped+' custom item(s) can\'t be stocked – add them as medicines first','bad');
  grnEditor({sup:o.sup,ref:o.id,lines})}
function grnEditor(seed){
  GE={sup:'',inv:'',d:ymd(),note:'',paid:'',ref:'',lines:[],upd:true,...seed};
  modal({title:'Delivery arrived – add to stock',cls:'full',sticky:true,html:`<div class="stack">
   <div class="grid g3"><label class="fld">Supplier<select data-c="ge-sup">${supOpts('— choose supplier —').map(([v,t])=>`<option value="${v}"${v===GE.sup?' selected':''}>${esc(t)}</option>`).join('')}</select></label><label class="fld">Invoice / bill no.<input data-i="ge-inv" value="${esc(GE.inv)}" dir="auto"></label><label class="fld">Date<input type="date" data-c="ge-d" value="${GE.d}"></label></div>
   <div id="gelines"></div><div class="bar"><button class="btn" data-a="ge-add">${ico('plus')} Add medicine</button></div><div class="tot-box" id="getot"></div>
   <div class="grid g2"><label class="fld">Amount paid now<input data-i="ge-paid" inputmode="decimal" value="${esc(GE.paid)}" placeholder="0 = on credit"></label>
   <label class="fld chk" style="align-self:end"><input type="checkbox" data-c="ge-upd" ${GE.upd?'checked':''}> Update purchase price of medicines</label></div>
   <label class="fld">Note<textarea data-i="ge-note" dir="auto" rows="2" placeholder="e.g. 2 bottles arrived damaged…">${esc(GE.note)}</textarea></label></div>`,
   mount(){drawGE()},
   foot:[{t:'Cancel',fn:()=>{}},{t:'Save & add to stock',cls:'pri',fn:()=>{
     const good=GE.lines.filter(l=>l.it&&(num(l.q)+num(l.free))>0);if(!good.length){toast('Add at least one medicine with a quantity','bad');return false}
     const p=receivePurchase({...GE,lines:good},{updateBuy:GE.upd});
     if(GE.ref){const o=DB.get('orders',GE.ref);if(o)DB.put('orders',{...o,status:'received'})}
     toast(`Stock received (${good.length} items)`,'ok')}}]})}
function drawGE(){const el=$('#gelines');if(!el)return;
  el.innerHTML=GE.lines.length?GE.lines.map((L,i)=>`<div class="line"><div class="nm">${esc(L.nm)}<small>current stock ${fq(qty(L.it))}</small></div><button class="ib" data-a="ge-rm" data-idx="${i}">${ico('trash')}</button>
   <div class="ctl"><input data-i="ge-l" data-idx="${i}" data-f="q" inputmode="decimal" value="${esc(L.q)}" aria-label="Qty"><span class="mut">+</span><input data-i="ge-l" data-idx="${i}" data-f="free" inputmode="decimal" value="${esc(L.free||'')}" placeholder="free" style="width:4.2rem" aria-label="Free bonus qty"><span class="mut">@</span><input data-i="ge-l" data-idx="${i}" data-f="p" inputmode="decimal" value="${esc(L.p)}" style="width:5.5rem" aria-label="Cost"><span class="tot" id="glt${i}">${money(num(L.q)*num(L.p))}</span></div>
   <div class="ctl" style="grid-column:1/-1"><input data-i="ge-l" data-idx="${i}" data-f="no" value="${esc(L.no||'')}" placeholder="Batch no." style="width:8rem;text-align:left"><input type="date" data-i="ge-l" data-idx="${i}" data-f="mfg" value="${esc(L.mfg||'')}" style="width:10rem;text-align:left" aria-label="Manufacturing date" title="Manufacturing date"><input type="date" data-i="ge-l" data-idx="${i}" data-f="exp" value="${esc(L.exp||'')}" style="width:10rem;text-align:left" aria-label="Expiry" title="Expiry date"></div><div class="mut" style="grid-column:1/-1;font-size:.75rem">Qty (paid) + free bonus @ price each · Batch no. · Made on · Expires on${num(L.free)?` · <b>${fq(num(L.q)+num(L.free))} go into stock</b>`:''}</div></div>`).join(''):emptyBox('No items yet','Tap "Add medicine".');updGE()}
function updGE(){const t=$('#getot');if(!t)return;const tot=r2(GE.lines.reduce((s,l)=>s+num(l.q)*num(l.p),0));t.innerHTML=`<div class="r big"><span>Invoice total</span><span>${money(tot)}</span></div>${tot>num(GE.paid)?`<div class="r"><span>Payable to supplier</span><span>${money(tot-num(GE.paid))}</span></div>`:''}`}
HI['ge-l']=(v,el,d)=>{const L=GE.lines[+d.idx];if(!L)return;L[d.f]=v;if(d.f==='q'||d.f==='p'){const e=$('#glt'+d.idx);if(e)e.textContent=money(num(L.q)*num(L.p));updGE()}};
HI['ge-inv']=v=>{GE.inv=v};HI['ge-note']=v=>{GE.note=v};HI['ge-paid']=v=>{GE.paid=v;updGE()};
HC['ge-sup']=v=>{GE.sup=v};HC['ge-d']=v=>{GE.d=v};HC['ge-upd']=(v,el)=>{GE.upd=el.checked};
A['ge-rm']=d=>{GE.lines.splice(+d.idx,1);drawGE()};
A['ge-add']=()=>pickItem(it=>{if(!GE.lines.some(l=>l.it===it.id))GE.lines.push({it:it.id,nm:iname(it),q:1,free:'',p:num(it.buy),no:'',exp:''});drawGE()});

/* ---------------- Mixtures / custom medicines ---------------- */
const ulab=it=>it.content?(it.cunit||'units'):(it.unit||'pack');
const mixSummary=ings=>(ings||[]).map(g=>{const it=DB.get('items',g.it);return it?`${it.name}${it.potency?' '+it.potency:''} ${fq(g.q)}${ulab(it)}`:'?'}).join(', ');
V.mix={title:'Mixtures & Formulas',render(){
  const fs=DB.all('formulas').sort((a,b)=>a.name.localeCompare(b.name));
  return`<div class="bar"><button class="btn pri" data-a="mix-new">${ico('plus')} New mixture / formula</button></div>
  <p class="mut" style="margin:0 0 .8rem">Create your own combinations. <b>Save</b> a formula you sell often, or make a <b>one-time</b> mixture for a single patient from the Sell screen. Stock of every ingredient is deducted automatically when the bill is completed.</p>
  ${fs.length?fs.map(f=>`<div class="row" data-a="mix-edit" data-id="${f.id}"><div class="r-main"><b>${esc(f.name)}</b><small>${esc(mixSummary(f.ings))}</small></div><div class="r-side"><b>${money(f.price)}</b><small>cost ${money(mixCost(f.ings))}</small></div><button class="btn sm pri" data-a="mix-use" data-id="${f.id}">Use</button></div>`).join(''):emptyBox('No saved formulas','Example: “Cough mix” = Drosera Q 5 ml + Ipecac 30C 5 ml + Bryonia 30C 5 ml.')}`}};
A['mix-new']=()=>mixBuilder({});
A['mix-edit']=d=>mixBuilder({id:d.id});
A['mix-use']=d=>{const f=DB.get('formulas',d.id);if(!f)return;addMixLine({name:f.name,ings:f.ings,note:f.note},f.price,f.id);location.hash='#/sell';toast('Added to bill','ok')};
let MX=null;
function mixBuilder(o){
  const f=o.id?DB.get('formulas',o.id):null;
  MX=f?JSON.parse(JSON.stringify(f)):{name:'',price:'',note:'',ings:[]};MX.once=!!o.once;
  const m=modal({title:o.once?'One-time mixture (for this bill)':f?'Edit formula':'New formula',cls:'full',sticky:true,html:`<div class="stack">
   <label class="fld">Mixture name<input data-i="mx-name" value="${esc(MX.name)}" dir="auto" placeholder="e.g. Cough mix, Mrs Khan’s drops"></label>
   <div><div class="sec" style="margin-top:0"><h3>Ingredients</h3><button class="btn sm" data-a="mx-add">${ico('plus')} Add medicine</button></div><div id="mxl"></div></div>
   <div class="tot-box" id="mxt"></div>
   <div class="grid g2"><label class="fld">Selling price (per bottle / dose)<input data-i="mx-price" inputmode="decimal" value="${esc(MX.price)}" placeholder="0"></label><div style="align-self:end"><button class="btn block" data-a="mx-suggest">Use suggested price</button></div></div>
   <label class="fld">Notes (how to make, dose, advice)<textarea data-i="mx-note" dir="auto" rows="3" placeholder="e.g. add 90 ml distilled water, shake well; 5 ml thrice daily">${esc(MX.note||'')}</textarea></label></div>`,
   mount(){drawMX()},
   foot:[{t:'Cancel',fn:()=>{}},
    ...(o.once?[]:[{t:'Save formula',fn:()=>{if(!saveMX())return false;toast('Formula saved','ok')}}]),
    {t:o.once?'Add to bill':'Save & add to bill',cls:'pri',fn:()=>{
      if(!MX.ings.length){toast('Add at least one ingredient','bad');return false}
      if(!MX.name.trim())MX.name=o.once?'Custom mixture':'';
      let fid='';if(!o.once){const r=saveMX();if(!r)return false;fid=r.id}
      addMixLine({name:MX.name,ings:MX.ings,note:MX.note},MX.price===''?mixSell(MX.ings):num(MX.price),fid);location.hash='#/sell';toast('Added to bill','ok')}},
    ...(o.once?[{t:'Save as formula too',fn:()=>{if(!MX.name.trim()){toast('Give it a name first','bad');return false}if(!saveMX())return false;toast('Saved to formulas','ok');return false}}]:[])]});
  return m}
function saveMX(){if(!MX.name.trim()){toast('Enter a name','bad');return null}if(!MX.ings.length){toast('Add at least one ingredient','bad');return null}
  const r=DB.put('formulas',{id:MX.id,name:MX.name.trim(),price:num(MX.price)||mixSell(MX.ings),note:MX.note||'',ings:MX.ings.filter(g=>g.it&&num(g.q)>0).map(g=>({it:g.it,q:num(g.q)}))});MX.id=r.id;return r}
function drawMX(){const el=$('#mxl');if(!el)return;
  el.innerHTML=MX.ings.length?MX.ings.map((g,i)=>{const it=DB.get('items',g.it);if(!it)return'';const need=r3(num(g.q)/(num(it.content)||1)),have=qty(g.it);
    return`<div class="row static"><div class="r-main"><b>${esc(iname(it))}</b><small style="${need>have?'color:var(--bad)':''}">uses ${fq(need)} pack(s) · in stock ${fq(have)}</small></div><input data-i="mx-q" data-idx="${i}" inputmode="decimal" value="${esc(g.q)}" style="width:5rem;text-align:center" aria-label="Quantity"><span class="mut" style="min-width:2.2rem">${esc(ulab(it))}</span><button class="ib" data-a="mx-rm" data-idx="${i}">${ico('trash')}</button></div>`}).join(''):emptyBox('No ingredients yet','Add the medicines this mixture is made of.');
  updMX()}
function updMX(){const t=$('#mxt');if(!t)return;const c=mixCost(MX.ings),s=mixSell(MX.ings),p=MX.price===''?s:num(MX.price);
  t.innerHTML=`<div class="r"><span>Ingredient cost</span><span>${money(c)}</span></div><div class="r"><span>Suggested price (at normal selling rates)</span><span>${money(s)}</span></div><div class="r big"><span>Profit at your price</span><span>${money(p-c)}</span></div>`}
HI['mx-name']=v=>{MX.name=v};HI['mx-price']=v=>{MX.price=v;updMX()};HI['mx-note']=v=>{MX.note=v};
HI['mx-q']=(v,el,d)=>{const g=MX.ings[+d.idx];if(g){g.q=v;updMX()}};
A['mx-rm']=d=>{MX.ings.splice(+d.idx,1);drawMX()};
A['mx-add']=()=>pickItem(it=>{if(!MX.ings.some(g=>g.it===it.id))MX.ings.push({it:it.id,q:it.content?5:1});drawMX()},{title:'Add ingredient'});
A['mx-suggest']=()=>{MX.price=mixSell(MX.ings);const i=$('[data-i="mx-price"]');if(i)i.value=MX.price;updMX()};

/* ---------------- Notes (notepad) ---------------- */
const NU={q:'',f:'all'};
const noteCard=n=>`<div class="note nc${n.color||0}" data-a="note-open" data-id="${n.id}">${n.pin?`<span style="float:right">${ico('pin')}</span>`:''}${n.title?`<h4 dir="auto">${esc(n.title)}</h4>`:''}<p dir="auto">${esc(n.body||'')}</p><small>${n.ref?esc(n.ref)+' · ':''}${n.due?'⏰ '+fdate(n.due)+' · ':''}${fdate(ymd(new Date(n._u)))}</small></div>`;
V.notes={title:'Notepad',render(){
  return`<div class="bar"><div class="search">${ico('search')}<input data-i="note-q" placeholder="Search notes…" value="${esc(NU.q)}" dir="auto"></div><button class="btn pri" data-a="note-new">${ico('plus')} New note</button></div>
  <div class="chips">${[['all','All'],['pin','Pinned'],['due','Reminders'],['done','Done']].map(([k,t])=>`<button class="chip ${NU.f===k?'on':''}" data-a="note-f" data-f="${k}">${t}</button>`).join('')}</div><div id="nlist"></div>`},mount(){drawNotes()}};
function drawNotes(){const el=$('#nlist');if(!el)return;const q=NU.q.toLowerCase();
  const ns=DB.all('notes').filter(n=>(!q||(n.title+' '+n.body+' '+(n.ref||'')).toLowerCase().includes(q))&&(NU.f==='all'?!n.done:NU.f==='pin'?n.pin&&!n.done:NU.f==='due'?n.due&&!n.done:n.done)).sort((a,b)=>(b.pin?1:0)-(a.pin?1:0)||b._u-a._u);
  el.innerHTML=ns.length?`<div class="notes">${ns.map(noteCard).join('')}</div>`:emptyBox('No notes','Write anything you want to remember – prices, promises, supplier messages.',`<button class="btn pri" data-a="note-new">${ico('plus')} New note</button>`)}
HI['note-q']=v=>{NU.q=v;drawNotes()};
A['note-f']=d=>{NU.f=d.f;render(true)};
A['note-open']=d=>noteForm(d.id);
A['note-new']=d=>noteForm(null,{ref:d&&d.ref||''});
function noteForm(id,seed={}){
  const n=id?DB.get('notes',id):{color:0,pin:false,title:'',body:'',due:'',ref:'',...seed};
  modal({title:id?'Edit note':'New note',html:`<form class="stack" onsubmit="return false">${F.t('Title','title',n.title,{placeholder:'optional'})}${F.a('Note','body',n.body,{rows:8,placeholder:'Write here… (Urdu / English)',autofocus:true})}
   <div class="colors">${[0,1,2,3,4,5].map(c=>`<label class="nc${c}"><input type="radio" name="color" value="${c}" ${(n.color||0)===c?'checked':''}><span></span></label>`).join('')}</div>
   <div class="grid g2">${F.d('Remind me on (optional)','due',n.due||'')}${F.t('About (optional)','ref',n.ref||'',{placeholder:'e.g. Supplier: Ali'})}</div>
   <div class="grid g2">${F.c('Pin to dashboard','pin',n.pin)}${id?F.c('Mark as done','done',n.done):''}</div></form>`,
   foot:[...(id?[{t:ico('trash'),cls:'bad',fn:async()=>{if(!await ask('Delete this note?',{ok:'Delete',bad:true}))return false;DB.del('notes',id)}}]:[]),{t:'Cancel',fn:()=>{}},{t:'Save',cls:'pri',fn:el=>{const f=formData(el);if(!f.title.trim()&&!f.body.trim()){toast('Write something first','bad');return false}
     DB.put('notes',{...(id?n:{}),title:f.title.trim(),body:f.body,color:+f.color||0,due:f.due,ref:f.ref.trim(),pin:f.pin,done:!!f.done});toast('Note saved','ok')}}]})}
