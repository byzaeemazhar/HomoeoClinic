/* =====================================================================
   UI toolkit: icons, modal, toast, forms, exports (CSV / XLSX / PDF), shell
   ===================================================================== */
const P={
 home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 001 .8h9.1a1 1 0 001-.8L21 7H6"/>',
 box:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',truck:'<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
 flask:'<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 001.3 2.2h12.4a1.5 1.5 0 001.3-2.2L14 9V3"/><path d="M7.5 15h9"/>',note:'<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',people:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.6 3-6 7-6s7 2.4 7 6M16 4.5a3.5 3.5 0 010 7M18 14c2.4.6 4 2.6 4 6"/>',
 chart:'<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',bell:'<path d="M6 16v-5a6 6 0 1112 0v5l2 2H4z"/><path d="M10 21h4"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',download:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
 print:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',check:'<path d="M5 12l5 5 9-10"/>',moon:'<path d="M20 14A8 8 0 019.5 4 8 8 0 1020 14z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
 more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
 cloud:'<path d="M7 18a4 4 0 01-.5-8A6 6 0 0118 11a3.5 3.5 0 01-.5 7z"/>',pin:'<path d="M9 3h6l-1 6 3 3H7l3-3zM12 12v9"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1-1.5 2M12 17h.01"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',swap:'<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
 scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M4 12h16"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',store:'<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 006 0 3 3 0 006 0 3 3 0 004 0M10 20v-5h4v5"/>',list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',shield:'<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',phone:'<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',pill:'<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M9.5 9.5l5 5"/>',up:'<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',leaf:'<path d="M5 19C4 11 10 5 20 5c0 10-6 15-15 14z"/><path d="M5 19C9 14 12 11 16 8"/>'
};
const ico=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[n]||''}</svg>`;

/* ---------- registries ---------- */
const V={};      // views
const A={};      // click actions  (data-a)
const HC={};     // change handlers (data-c)
const HI={};     // input handlers  (data-i)
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const f=A[t.dataset.a];if(f){e.preventDefault();f(t.dataset,t,e)}});
document.addEventListener('change',e=>{const t=e.target.closest('[data-c]');if(t&&HC[t.dataset.c])HC[t.dataset.c](t.value,t,t.dataset)});
document.addEventListener('input',e=>{const t=e.target.closest('[data-i]');if(t&&HI[t.dataset.i])HI[t.dataset.i](t.value,t,t.dataset)});

/* ---------- toast / modal / ask ---------- */
function toast(msg,cls=''){const w=$('#toast'),d=document.createElement('div');d.className=cls;d.textContent=msg;w.appendChild(d);setTimeout(()=>d.remove(),cls==='bad'?4500:2600)}
const modals=[];
function modal(o){
  const el=document.createElement('div');el.className='modal';
  el.innerHTML=`<div class="sheet ${o.cls||''}" role="dialog" aria-modal="true"><header><h3>${o.title||''}</h3><button class="ib" data-close aria-label="Close">${ico('x')}</button></header><div class="body">${o.html||''}</div>${o.foot?'<footer></footer>':''}</div>`;
  const close=()=>{if(o.onclose&&o.onclose()===false)return;el.remove();const i=modals.indexOf(el);if(i>=0)modals.splice(i,1)};
  el.close=close;el.q=s=>$(s,el);
  const sticky=o.sticky??!!o.foot;
  el.addEventListener('mousedown',e=>{if(e.target===el&&!sticky)close()});
  $('[data-close]',el).onclick=close;
  if(o.foot)o.foot.forEach(b=>{const x=document.createElement('button');x.className='btn '+(b.cls||'');x.innerHTML=b.t;x.onclick=async()=>{const r=await b.fn(el);if(r!==false&&!b.keep)close()};$('footer',el).appendChild(x)});
  document.body.appendChild(el);modals.push(el);if(o.mount)o.mount(el);return el}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modals.length)modals[modals.length-1].close()});
const ask=(msg,{ok='OK',bad=false,title='Please confirm'}={})=>new Promise(res=>{let done=false;const fin=v=>{if(!done){done=true;res(v)}};
  modal({title,html:`<p style="margin:0;white-space:pre-wrap">${esc(msg)}</p>`,sticky:true,onclose:()=>{fin(false)},foot:[{t:'Cancel',fn:()=>{fin(false)}},{t:ok,cls:bad?'bad':'pri',fn:()=>{fin(true)}}]})});

/* ---------- form helpers ---------- */
const attrs=o=>Object.entries(o||{}).map(([k,v])=>v===true?k:`${k}="${esc(v)}"`).join(' ');
const F={
 t:(l,n,v='',o={})=>`<label class="fld">${l}<input name="${n}" value="${esc(v)}" dir="auto" autocomplete="off" ${attrs(o)}></label>`,
 n:(l,n,v='',o={})=>`<label class="fld">${l}<input name="${n}" value="${esc(v)}" inputmode="decimal" autocomplete="off" ${attrs(o)}></label>`,
 d:(l,n,v='',o={})=>`<label class="fld">${l}<input type="date" name="${n}" value="${esc(v)}" ${attrs(o)}></label>`,
 s:(l,n,opts,cur='',o={})=>`<label class="fld">${l}<select name="${n}" ${attrs(o)}>${opts.map(x=>{const[v,t]=Array.isArray(x)?x:[x,x];return`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(t)}</option>`}).join('')}</select></label>`,
 a:(l,n,v='',o={})=>`<label class="fld">${l}<textarea name="${n}" dir="auto" ${attrs(o)}>${esc(v)}</textarea></label>`,
 c:(l,n,on)=>`<label class="fld chk"><input type="checkbox" name="${n}"${on?' checked':''}>${l}</label>`
};
const formData=el=>{const o={};$$('[name]',el).forEach(i=>{if(i.type==='radio'){if(i.checked)o[i.name]=i.value}else o[i.name]=i.type==='checkbox'?i.checked:i.value});return o};
const supOpts=(blank='— none —')=>[['',blank],...DB.all('suppliers').sort((a,b)=>a.name.localeCompare(b.name)).map(s=>[s.id,s.name])];
const custOpts=(blank='Walk-in customer')=>[['',blank],...DB.all('customers').sort((a,b)=>a.name.localeCompare(b.name)).map(s=>[s.id,s.name])];
const supName=id=>(DB.get('suppliers',id)||{}).name||'';
const custName=id=>(DB.get('customers',id)||{}).name||'';
const fdate=d=>{if(!d)return'';const[y,m,dd]=String(d).slice(0,10).split('-');return`${dd}/${m}/${y}`};
const ftime=t=>new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});

function pickItem(cb,o={}){
  modal({title:o.title||'Choose medicine',html:`<div class="search big">${ico('search')}<input id="pkq" placeholder="Search name, potency, brand…" autocomplete="off"></div><div id="pkl" style="margin-top:.6rem"></div>${o.allowNew?`<button class="btn block" id="pknew" style="margin-top:.5rem">${ico('plus')} Not in the list? Add a new medicine</button>`:''}`,
   mount(el){const inp=$('#pkq',el),list=$('#pkl',el);
    const draw=()=>{const items=DB.all('items').filter(i=>!i.arch&&matchItem(i,inp.value)).sort(byName).slice(0,60);
      list.innerHTML=items.length?items.map(i=>`<div class="row" data-id="${i.id}"><div class="r-main"><b>${esc(iname(i))}</b><small>${esc(isub(i))}</small></div><div class="r-side"><span class="qty ${istate(i)}">${fq(qty(i.id))}</span><small>${esc(i.unit||'')}</small></div></div>`).join(''):'<div class="empty">No match</div>'};
    inp.oninput=draw;draw();list.onclick=e=>{const r=e.target.closest('[data-id]');if(r){el.close();cb(DB.get('items',r.dataset.id))}};const nb=$('#pknew',el);if(nb)nb.onclick=()=>{el.close();itemForm(null,nid=>{const n=DB.get('items',nid);if(n)cb(n)})};setTimeout(()=>inp.focus(),60)}})}

/* ---------- downloads, CSV, XLSX (hand-written, works offline) ---------- */
async function download(blob,name){
  if(NATIVE){const r=await nativeSave(blob,name,{sub:/\.(json|hsb)$/.test(name)?'Backups':'Exports'});if(r.ok){toast('Saved in '+r.where,'ok');await nativeShare(r.uri,name)}else toast('Could not save the file','bad');return r}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);return{ok:true}}
const csvCell=v=>{v=v==null?'':String(v);return/[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const toCSV=(head,rows)=>'﻿'+[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
function parseCSV(text){
  text=text.replace(/^﻿/,'');const rows=[];let row=[],cur='',q=false;
  const first=text.split(/\r?\n/)[0]||'';const sep=(first.split(';').length>first.split(',').length)?';':(first.split('\t').length>first.split(',').length?'\t':',');
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;else if(c===sep){row.push(cur);cur=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x.trim()!==''))rows.push(row);row=[]}
    else cur+=c}
  row.push(cur);if(row.some(x=>x.trim()!==''))rows.push(row);return rows}
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return b=>{let c=~0;for(let i=0;i<b.length;i++)c=t[(c^b[i])&255]^(c>>>8);return(~c)>>>0}})();
function zip(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  const u16=n=>[n&255,n>>8&255],u32=n=>[n&255,n>>8&255,n>>16&255,n>>>24&255];
  for(const f of files){const nm=enc.encode(f.name),d=enc.encode(f.data),crc=CRC(d),sz=d.length;
    const lh=new Uint8Array([0x50,0x4b,3,4,20,0,0,8,0,0,0,0,0x21,0,...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),0,0]);
    parts.push(lh,nm,d);
    cen.push(new Uint8Array([0x50,0x4b,1,2,20,0,20,0,0,8,0,0,0,0,0x21,0,...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(off)]),nm);
    off+=lh.length+nm.length+sz}
  const cdSize=cen.reduce((s,a)=>s+a.length,0);
  const end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cdSize),...u32(off),0,0]);
  return new Blob([...parts,...cen,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
const xe=s=>String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const colL=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
function toXLSX(head,rows,sheet='Sheet1'){
  const all=[head,...rows];
  const widths=head.map((h,i)=>Math.min(50,Math.max(8,...all.map(r=>String(r[i]??'').length))+2));
  const sx=all.map((r,ri)=>`<row r="${ri+1}">`+r.map((v,ci)=>{const ref=colL(ci)+(ri+1);
    if(typeof v==='number'&&isFinite(v))return`<c r="${ref}"${ri===0?' s="1"':''}><v>${v}</v></c>`;
    return`<c r="${ref}" t="inlineStr"${ri===0?' s="1"':''}><is><t xml:space="preserve">${xe(v??'')}</t></is></c>`}).join('')+'</row>').join('');
  const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zip([
   {name:'[Content_Types].xml',data:H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},
   {name:'_rels/.rels',data:H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
   {name:'xl/workbook.xml',data:H+`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xe(sheet.replace(/[\\\/?*\[\]:]/g,' ').slice(0,31)||'Sheet1')}" sheetId="1" r:id="rId1"/></sheets></workbook>`},
   {name:'xl/_rels/workbook.xml.rels',data:H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
   {name:'xl/styles.xml',data:H+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'},
   {name:'xl/worksheets/sheet1.xml',data:H+`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${sx}</sheetData></worksheet>`}])}

/* ---------- print / PDF ---------- */
const docHead=(title,sub='',withDoc=false)=>{const c=CFG();return`<div class="ph"><h1>${esc(c.shop)}</h1>${withDoc&&c.doc?`<div><b>${esc(c.doc)}</b> ${esc(c.qual)}${c.reg?' · Reg. no. '+esc(c.reg):''}</div>`:''}<div>${esc([c.phone,c.addr].filter(Boolean).join(' · '))}</div><h2>${esc(title)}</h2>${sub?`<div>${esc(sub)}</div>`:''}</div>`};
const tableHTML=(head,rows,foot)=>{const nums=head.map((_,i)=>rows.some(r=>typeof r[i]==='number')&&rows.every(r=>typeof r[i]==='number'||r[i]===''||r[i]==null));
  return`<table><thead><tr>${head.map((h,i)=>`<th class="${nums[i]?'n':''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>`<td class="${nums[i]?'n':''}" dir="auto">${esc(typeof v==='number'?(Number.isInteger(v)?v:v.toFixed(2)):v)}</td>`).join('')}</tr>`).join('')}</tbody>${foot?`<tfoot><tr>${foot.map((v,i)=>`<td class="${nums[i]?'n':''}"><b>${esc(v)}</b></td>`).join('')}</tr></tfoot>`:''}</table>`};
function printDoc(html,o={}){
  if(NATIVE)return savePdf(html,o);
  const p=$('#print');p.innerHTML=html+(o.label?'':`<div class="pcredit">HomoeoClinic · ${esc(CREDIT)}</div>`);p.className=o.label?'label':o.thermal?'thermal':'';
  let st=$('#pstyle');if(!st){st=document.createElement('style');st.id='pstyle';document.head.appendChild(st)}
  st.textContent=o.label?'@page{size:60mm 40mm;margin:2mm}':o.thermal?'@page{size:80mm auto;margin:3mm}':'@page{size:A4;margin:12mm 12mm 16mm}';
  setTimeout(()=>window.print(),80)}
const waUrl=(phone,text)=>{let p=String(phone||'').replace(/\D/g,'');if(p.startsWith('00'))p=p.slice(2);else if(p.startsWith('0'))p=CFG().cc+p.slice(1);return'https://wa.me/'+p+'?text='+encodeURIComponent(text)};
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Copied','ok')}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast('Copied','ok')}catch(x){toast('Copy failed','bad')}a.remove()}}

/* one export / share menu used by every list, report and order */
function exportMenu(o){
  // o:{title,head,rows,foot,fname,text,phone,email,subject,extraHtml,sub}
  const fname=(o.fname||o.title).replace(/[^\w\-]+/g,'_')+'_'+ymd();
  const makeX=()=>toXLSX(o.head,o.foot?[...o.rows,o.foot]:o.rows,o.title);
  const m=modal({title:'Export / send',html:`<div class="stack"><div class="mut">${esc(o.title)} · ${o.rows.length} rows</div>
    <div class="grid g2"><button class="btn" data-x="xlsx">${ico('file')} Excel (.xlsx)</button><button class="btn" data-x="csv">${ico('download')} CSV</button><button class="btn" data-x="pdf">${ico('print')} PDF / Print</button>
    ${o.text!=null?`<button class="btn" data-x="wa">${ico('chat')} WhatsApp</button><button class="btn" data-x="mail">${ico('mail')} Email</button><button class="btn" data-x="copy">${ico('copy')} Copy text</button>`:''}
    ${(navigator.share||NATIVE)?`<button class="btn" data-x="share">${ico('share')} Share file…</button>`:''}</div>${o.extraHtml||''}</div>`,
   mount(el){el.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b)return;const x=b.dataset.x;
     if(x==='xlsx')download(makeX(),fname+'.xlsx');
     else if(x==='csv')download(new Blob([toCSV(o.head,o.foot?[...o.rows,o.foot]:o.rows)],{type:'text/csv;charset=utf-8'}),fname+'.csv');
     else if(x==='pdf')printDoc(docHead(o.title,o.sub||'Date: '+fdate(ymd()))+tableHTML(o.head,o.rows,o.foot)+(o.noteHtml||''));
     else if(x==='wa')window.open(waUrl(o.phone,o.text),'_blank');
     else if(x==='mail')location.href='mailto:'+encodeURIComponent(o.email||'')+'?subject='+encodeURIComponent(o.subject||o.title)+'&body='+encodeURIComponent(o.text);
     else if(x==='copy')copyText(o.text);
     else if(x==='share'){if(NATIVE){const r=await nativeSave(makeX(),fname+'.xlsx',{sub:'Exports'});if(r.ok)await nativeShare(r.uri,o.title);else toast('Could not save the file','bad');return}try{const f=new File([makeX()],fname+'.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],title:o.title,text:o.text||o.title});else await navigator.share({title:o.title,text:o.text||o.title})}catch(e){}}})}});
  return m}

/* ---------- misc ui bits ---------- */
const stBadge=it=>{const s=istate(it);return s==='neg'?'<span class="badge bad">Negative</span>':s==='out'?'<span class="badge bad">Finished</span>':s==='low'?'<span class="badge warn">Low</span>':''};
const emptyBox=(t,s='',btn='')=>`<div class="empty"><b>${t}</b>${s}${btn?`<div style="margin-top:.8rem">${btn}</div>`:''}</div>`;
const noteBox=t=>t?`<div class="inline-note" dir="auto">${esc(t)}</div>`:'';
function barChart(data){const mx=Math.max(1,...data.map(d=>d.v));return`<div class="mini">${data.map(d=>`<div title="${esc(d.l)}: ${esc(money(d.v))}"><i style="height:${Math.round(d.v/mx*80)+2}%"></i><span>${esc(d.l)}</span></div>`).join('')}</div>`}

/* ---------- shell / router ---------- */
const NAV=[['dash','Home','home'],['sell','Sell','cart'],['stock','Medicines','box'],['orders','Orders','truck'],['patients','Patients','user'],['notes','Notes','note'],['mix','Mixtures','flask'],['people','Customers','people'],['suppliers','Suppliers','store'],['reports','Reports','chart'],['alerts','Alerts','bell'],['backup','Backup','up'],['settings','Settings','gear']];
const STAFF_BLOCK=['reports','settings','backup','suppliers'];
const navList=()=>NAV.filter(n=>isOwner()||!STAFF_BLOCK.includes(n[0]));
const BOT=['dash','sell','stock','orders'];
const curRoute=()=>{const h=(location.hash||'').replace(/^#\/?/,'').split('?')[0];return V[h]&&(isOwner()||!STAFF_BLOCK.includes(h))?h:'dash'};
const go=r=>{if(curRoute()===r)render();else location.hash='#/'+r};
const logoSVG=(s=40)=>`<svg width="${s}" height="${s}" viewBox="0 0 512 512" aria-hidden="true"><defs><linearGradient id="lg${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A9374"/><stop offset="1" stop-color="#14604A"/></linearGradient></defs><rect width="512" height="512" rx="116" fill="url(#lg${s})"/><path d="M150 366C132 232 238 128 376 138C388 276 292 380 150 366Z" fill="#F4F1EA"/><path d="M176 344C232 276 292 214 350 166" fill="none" stroke="#1F7A5F" stroke-width="13" stroke-linecap="round"/><path d="M200 300C226 300 252 304 276 318M236 256C262 254 288 256 312 268" fill="none" stroke="#1F7A5F" stroke-width="9" stroke-linecap="round" opacity=".55"/><path d="M360 262C360 262 318 314 318 346A42 42 0 0 0 402 346C402 314 360 262 360 262Z" fill="#F2B544" stroke="#1F7A5F" stroke-width="10" stroke-linejoin="round"/></svg>`;
function buildShell(){
  $('#side').innerHTML=`<div class="brand">${logoSVG(36)}<b>Homoeo<br>Stock</b></div>`+navList().map(([k,t,i])=>`<a href="#/${k}" data-nav="${k}" title="${t}">${ico(i)}<span class="lbl">${t}</span></a>`).join('')+`<div class="sp"></div><div class="sidecredit">${esc(CREDIT)}</div>`;
  $('#bottom').innerHTML=BOT.map(k=>{const n=NAV.find(x=>x[0]===k);return`<a href="#/${k}" data-nav="${k}">${ico(n[2])}<span>${n[1]}</span></a>`}).join('')+`<a href="#/more" data-nav="more">${ico('more')}<span>More</span></a>`}
function chrome(){
  const r=curRoute();
  $$('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===r||(a.dataset.nav==='more'&&!BOT.includes(r))));
  const n=alerts().count;$$('.bellDot').forEach(b=>{b.textContent=n>99?'99+':n;b.style.display=n?'flex':'none'})}
let pending=false;
function render(keep){
  const r=curRoute(),v=V[r];$('#title').textContent=v.title;$('#top').style.display=v.bare?'none':'';
  const y=window.scrollY;$('#view').innerHTML=v.render()+`<div class="credit">${esc(CREDIT)}</div>`;if(v.mount)v.mount();chrome();
  window.scrollTo(0,keep?y:0);pending=false}
function refresh(){
  chrome();const a=document.activeElement;
  if(a&&$('#view').contains(a)&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)){pending=true;return}
  if(V[curRoute()].live===false)return;render(true)}
document.addEventListener('focusout',()=>{if(pending)setTimeout(()=>{const a=document.activeElement;if(pending&&!(a&&$('#view').contains(a)&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)))render(true)},120)});
window.addEventListener('hashchange',()=>render());

/* ---------- camera barcode scanner (best effort; typing the code always works) ---------- */
function scanBarcode(cb){
  let stream=null,stop=false;
  const end=()=>{stop=true;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null};
  const m=modal({title:'Scan barcode',sticky:false,onclose:end,html:`<div class="stack"><div style="background:#000;border-radius:12px;overflow:hidden;aspect-ratio:4/3"><video id="scv" playsinline muted style="width:100%;height:100%;object-fit:cover"></video></div><div class="mut" id="scm">Opening camera…</div><div class="grid g2" style="grid-template-columns:1fr auto;align-items:end"><label class="fld">Or type the code<input id="scc" inputmode="numeric" autocomplete="off"></label><button class="btn pri" id="scu">Use</button></div></div>`,
   mount(el){
    const use=v=>{v=String(v||'').trim();if(!v)return;end();A.closeTop();cb(v)};
    $('#scu',el).onclick=()=>use($('#scc',el).value);$('#scc',el).addEventListener('keydown',e=>{if(e.key==='Enter')use(e.target.value)});
    (async()=>{const msg=$('#scm',el);
      if(!('BarcodeDetector' in window)||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){msg.textContent='Camera scanning is not available on this phone. Type the code below (a USB / Bluetooth barcode scanner also works).';return}
      try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});const v=$('#scv',el);v.srcObject=stream;await v.play();msg.textContent='Point the camera at the barcode…';
        const det=new BarcodeDetector();const loop=async()=>{if(stop)return;try{const r=await det.detect(v);if(r.length&&r[0].rawValue){use(r[0].rawValue);return}}catch(e){}setTimeout(loop,250)};loop()}
      catch(e){msg.textContent='Could not open the camera. Allow camera access, or type the code below.'}})()}});
  return m}
A.closeTop=()=>{const m=modals[modals.length-1];if(m&&m.close)m.close()};
