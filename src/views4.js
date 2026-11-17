/* =====================================================================
   Views 4: More menu, Backup & data safety
   ===================================================================== */
V.more={title:'More',render(){
  const own=isOwner(),bk=Backup.lastOut();
  const mi=(href,ic,t,sub,extra='')=>`<a class="mi" href="${href}"><span class="c">${ico(ic)}</span><div style="flex:1"><b>${t}</b><small>${sub}</small></div>${extra}${ico('chev')}</a>`;
  return`<div class="morehead"><h1 class="serif">More</h1></div><div class="stack" style="gap:.5rem">
   ${own?mi('#/suppliers','store','Suppliers','Who you buy from · '+DB.all('suppliers').length+' supplier(s)'):''}
   ${mi('#/orders','list','My order lists','Auto list from low stock, or make your own')}
   ${mi('#/patients','user','Patients','Records, visits and medicine courses')}
   ${mi('#/notes','note','Notes','Notepad for reminders')}
   ${mi('#/people','people','Customers','Who owes you money')}
   ${mi('#/mix','flask','Mixtures','Saved formulas')}
   ${own?mi('#/reports','chart','Reports','Sales, profit, stock, expiry'):''}
   ${mi('#/alerts','bell','Alerts','Low stock, expiry, follow-ups',alerts().count?`<span class="badge warn">${alerts().count}</span>`:'')}
   ${own?`<a class="mi hl" href="#/backup"><span class="c">${ico('up')}</span><div style="flex:1"><b>Backup &amp; restore</b><small>${bk?'Last backup: '+fdate(ymd(new Date(bk))):'No backup yet – tap to make one'}</small></div>${ico('chev')}</a>`:''}
   ${own?mi('#/settings','gear','Settings','Shop details, alerts, PIN'):''}
   <div class="grid g2"><button class="btn" data-a="theme">${ico('moon')} Dark / light</button><button class="btn" data-a="help">${ico('help')} How to use</button></div>
   <div class="devline">${logoSVG(34)}<div><b>${APP}</b><br>${esc(CREDIT)} · Version ${APPVER}</div></div></div>`}};

/* ---------------- backup engine ---------------- */
const APPVER='1.0';
const b64e=u=>{let s='';u.forEach(c=>s+=String.fromCharCode(c));return btoa(s)},b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function cryptoKey(pw,salt){const m=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encryptText(text,pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),k=await cryptoKey(pw,salt);const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(text)));return JSON.stringify({app:'homoeoclinic-encrypted',v:1,salt:b64e(salt),iv:b64e(iv),data:b64e(ct)})}
async function decryptText(o,pw){const k=await cryptoKey(pw,b64d(o.salt));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64d(o.iv)},k,b64d(o.data)))}
const Backup=(()=>{
  const snapDB=()=>new Promise((res,rej)=>{const q=indexedDB.open('homoeo-snaps',1);q.onupgradeneeded=()=>q.result.createObjectStore('s',{keyPath:'k'});q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
  const cfg=()=>({auto:true,...ls.get('hs_bkcfg',{})});
  const pw=()=>ls.get('hs_bkpw','');
  let busy=false,lastCount=-1;
  const api={
    cfg,pw,lastOut:()=>ls.get('hs_bk_out',null),lastAuto:()=>ls.get('hs_bk_auto',null),
    setCfg(o){ls.set('hs_bkcfg',{...cfg(),...o})},
    async text(){const j=JSON.stringify(DB.export());return pw()?await encryptText(j,pw()):j},
    async fileName(){const d=new Date();return`${APP}-backup-${ymd(d)}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${pw()?'-protected':''}.json`},
    async now(){const t=await api.text(),name=await api.fileName();const r=await download(new Blob([t],{type:'application/json'}),name);if(!NATIVE||(r&&r.ok)){ls.set('hs_bk_out',Date.now());return true}return false},
    async snaps(){try{const db=await snapDB();return await new Promise(res=>{const q=db.transaction('s').objectStore('s').getAll();q.onsuccess=()=>res(q.result.sort((a,b)=>b.t-a.t));q.onerror=()=>res([])})}catch(e){return[]}},
    async auto(force){
      if(busy||!isOwner()&&!force)return;const c=cfg();if(!c.auto&&!force)return;if(!DB.count())return;
      if(!force&&DB.changed===lastCount)return;busy=true;
      try{const t=await api.text(),now=Date.now();let ok=false,where='';
        try{const db=await snapDB(),all=await api.snaps();await new Promise(res=>{const tx=db.transaction('s','readwrite'),st=tx.objectStore('s');
          const last=all[0];if(!last||now-last.t>30*60*1000||force)st.put({k:'s'+now,t:now,n:DB.count(),enc:!!pw(),text:t});
          all.slice(8).forEach(x=>st.delete(x.k));tx.oncomplete=res;tx.onerror=res});ok=true;where='inside the app'}catch(e){console.warn('snap',e)}
        if(NATIVE){const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];const r=await nativeSave(new Blob([t],{type:'application/json'}),`auto-backup-${day}.json`,{sub:'Auto-backup',dirs:['DOCUMENTS','EXTERNAL']});if(r.ok){ok=true;where=r.where}}
        lastCount=DB.changed;if(ok)ls.set('hs_bk_auto',{t:now,where,n:DB.count()})}
      finally{busy=false}},
    async restoreText(text,mode){let o=JSON.parse(text);
      if(o&&o.app==='homoeoclinic-encrypted'){let p=pw(),tries=0;for(;;){if(!p){p=await askText('This backup is password-protected.\nEnter the backup password:')}if(p==null)return null;
        try{o=JSON.parse(await decryptText(o,p));break}catch(e){tries++;toast('Wrong password','bad');p='';if(tries>4)return null}}}
      if(!o||!o.data)throw new Error('Not a valid backup file');
      if(mode==='replace'){await DB.wipe()}
      return DB.import(o)},
    async persist(){try{if(navigator.storage&&navigator.storage.persist)return await navigator.storage.persist()}catch(e){}return false},
    async status(){let persisted=false,est=null;try{persisted=!!(navigator.storage&&navigator.storage.persisted&&await navigator.storage.persisted());est=navigator.storage&&navigator.storage.estimate?await navigator.storage.estimate():null}catch(e){}return{persisted,est}},
    /* empty database but an automatic copy exists -> offer to bring it back */
    async rescue(){if(DB.count()>3||DB.memOnly)return;const s=await api.snaps();let nat=null;
      if(NATIVE){try{const fs=Plug('Filesystem');const day=await fs.readdir({path:FOLDER+'/Auto-backup',directory:'DOCUMENTS'});const f=(day.files||[]).sort((a,b)=>(b.mtime||0)-(a.mtime||0))[0];if(f){const r=await fs.readFile({path:FOLDER+'/Auto-backup/'+f.name,directory:'DOCUMENTS',encoding:'utf8'});nat={t:f.mtime||0,text:r.data,from:'Documents/'+FOLDER}}}catch(e){}}
      const best=[...s.map(x=>({t:x.t,text:x.text,from:'the app'})),...(nat?[nat]:[])].sort((a,b)=>b.t-a.t)[0];if(!best||!best.text)return;
      if(await ask(`Your data looks empty, but an automatic backup was found (${new Date(best.t).toLocaleString()}, from ${best.from}).\n\nBring your data back now?`,{ok:'Restore my data'})){try{const n=await api.restoreText(best.text,'merge');if(n!=null)toast(n+' records restored','ok')}catch(e){toast('Could not read that backup','bad')}}}
  };
  return api})();
const askText=(msg,{type='password'}={})=>new Promise(res=>{let done=false;const fin=v=>{if(!done){done=true;res(v)}};
  modal({title:'Password',html:`<form class="stack" onsubmit="return false"><p style="margin:0;white-space:pre-wrap">${esc(msg)}</p><input name="v" type="${type}" autocomplete="off" autofocus></form>`,sticky:true,onclose:()=>{fin(null)},foot:[{t:'Cancel',fn:()=>{fin(null)}},{t:'OK',cls:'pri',fn:el=>{fin(formData(el).v||'')}}]})});

V.backup={title:'Backup & restore',live:false,render(){
  const lo=Backup.lastOut(),la=Backup.lastAuto(),c=Backup.cfg(),old=!lo||(Date.now()-lo)/864e5>7;
  const n=k=>DB.all(k).length;
  return`<div class="card"><h2><span>Your data is saved on this phone</span><span class="badge ok">${ico('check')} Safe inside the app</span></h2>
   <div class="grid kpis4" style="margin:.4rem 0"><div class="kpi" style="cursor:default"><small>Medicines</small><b>${n('items')}</b></div><div class="kpi" style="cursor:default"><small>Patients</small><b>${n('patients')}</b></div><div class="kpi" style="cursor:default"><small>Visits</small><b>${n('visits')}</b></div><div class="kpi" style="cursor:default"><small>Bills</small><b>${n('sales')}</b></div></div>
   <p class="mut" style="margin:.3rem 0 0">Everything you enter is written to the phone immediately. Closing the app, restarting the phone or having no internet never deletes it. <b>Uninstalling the app or “Clear data” in Android settings does</b> – so keep a backup copy <b>outside</b> the app.</p>
   <div class="kv" style="margin-top:.7rem"><dt>Protected from cleanup</dt><dd id="bk-pers">checking…</dd><dt>Last backup you saved / shared</dt><dd style="${old?'color:var(--bad)':''}">${lo?new Date(lo).toLocaleString():'never'}</dd><dt>Last automatic copy</dt><dd>${la?new Date(la.t).toLocaleString()+' · '+esc(la.where):'none yet'}</dd></div></div>
  <div class="card"><h2>Back up now</h2><div class="stack"><p class="mut" style="margin:0">Creates one file with <b>all</b> medicines, patients, visits, bills and notes. ${NATIVE?'It is saved in <b>Documents/'+FOLDER+'/Backups</b> and the share menu opens so you can send it to WhatsApp, Google Drive, Gmail or another phone.':'Your browser downloads the file – keep it somewhere safe.'}</p><button class="btn pri bigpay" data-a="bk-now">${ico('up')} Back up now</button>
   <label class="btn" style="cursor:pointer">${ico('download')} Restore from a backup file<input type="file" accept=".json,application/json,.txt" data-c="bk-up" hidden></label><button class="btn" data-a="bk-snaps">${ico('clock')} Restore from an automatic copy</button></div></div>
  <div class="card"><h2>Automatic backup</h2><div class="stack">${F.c('Keep automatic copies (recommended)','x',c.auto).replace('name="x"','data-c="bk-auto" name="x"')}<p class="mut" style="margin:0">While this is on, the app quietly saves a fresh copy after you make changes – 8 copies inside the app${NATIVE?' and a rolling set of 7 files (one per weekday) in <b>Documents/'+FOLDER+'/Auto-backup</b>':''}. If the app’s data is ever lost, it offers to restore the newest copy when you open it.</p>
   <button class="btn" data-a="bk-auto-now">Make an automatic copy now</button>
   <div class="hr" style="margin:.2rem 0"></div><div class="fld">Backup password (optional)<span class="mut" style="font-weight:500">Patient and sales data is sensitive. With a password every backup file is encrypted – nobody can read it without the password. <b>Write the password down: if it is forgotten the backup cannot be opened.</b></span></div><div class="bar" style="margin:0"><button class="btn" data-a="bk-pw">${ico('lock')} ${Backup.pw()?'Change / remove password':'Set backup password'}</button>${Backup.pw()?'<span class="badge ok">Backups are encrypted</span>':'<span class="badge warn">Backups are not encrypted</span>'}</div></div></div>
  <div class="card"><h2>Other ways to keep your data safe</h2><ol class="mut" style="margin:0;padding-left:1.2rem;display:flex;flex-direction:column;gap:.35rem"><li><b>Send the backup file to yourself</b> on WhatsApp or Gmail every week – the easiest way.</li><li><b>Google Drive:</b> choose Drive in the share menu after “Back up now”.</li><li><b>Computer:</b> connect the phone with a cable and copy the <i>${FOLDER}</i> folder from Documents.</li><li><b>Second phone:</b> install the app there and use “Restore from a backup file”.</li><li><b>Printed copies:</b> Reports and patient histories can be saved as PDF / Excel.</li><li>Android’s own Google backup may also keep app data, but do not rely on it for an app installed from a file.</li></ol></div>`},
  mount(){Backup.status().then(s=>{const e=$('#bk-pers');if(e)e.innerHTML=s.persisted?'<span style="color:var(--ok)">Yes</span>':NATIVE?'Android app storage':'<span style="color:var(--warn)">Not guaranteed by this browser</span>'})}};
A['bk-now']=async()=>{if(await Backup.now()){toast('Backup created','ok');render(true)}};
A['bk-auto-now']=async()=>{await Backup.auto(true);toast('Automatic copy saved','ok');render(true)};
HC['bk-auto']=(v,el)=>{Backup.setCfg({auto:el.checked});toast(el.checked?'Automatic copies are on':'Automatic copies are off')};
HC['bk-up']=async(v,el)=>{const f=el.files[0];if(!f)return;el.value='';restoreFlow(await f.text(),f.name)};
async function restoreFlow(text,label){
  let probe;try{probe=JSON.parse(text)}catch(e){toast('This is not a valid backup file','bad');return}
  const m=modal({title:'Restore backup',sticky:true,html:`<div class="stack"><p style="margin:0"><b>${esc(label||'Backup')}</b></p><p class="mut" style="margin:0"><b>Merge</b> adds everything from the backup and keeps your newer changes (safe, recommended).<br><b>Replace</b> erases the data on this phone first, then loads the backup exactly as it was.</p></div>`,
   foot:[{t:'Cancel',fn:()=>{}},{t:'Replace everything',cls:'bad',fn:async()=>{if(!await ask('Erase the current data on this phone and load the backup?',{ok:'Replace',bad:true}))return false;await doRestore(text,'replace')}},{t:'Merge (recommended)',cls:'pri',fn:()=>doRestore(text,'merge')}]})}
async function doRestore(text,mode){try{const n=await Backup.restoreText(text,mode);if(n==null)return;toast(n+' records restored','ok');render(true)}catch(e){console.error(e);toast('Could not restore: '+(e.message||'invalid file'),'bad')}}
A['bk-snaps']=async()=>{const s=await Backup.snaps();
  modal({title:'Automatic copies',html:s.length?s.map(x=>`<div class="row" data-a="bk-snap-use" data-k="${x.k}"><div class="r-main"><b>${new Date(x.t).toLocaleString()}</b><small>${x.n} records${x.enc?' · password-protected':''}</small></div><button class="btn sm pri">Restore</button></div>`).join(''):emptyBox('No automatic copies yet','They appear after you add or change data.')})};
A['bk-snap-use']=async d=>{const s=(await Backup.snaps()).find(x=>x.k===d.k);if(!s)return;A.closeTop();restoreFlow(s.text,'Automatic copy · '+new Date(s.t).toLocaleString())};
A['bk-pw']=()=>{const has=!!Backup.pw();
  modal({title:'Backup password',html:`<form class="stack" onsubmit="return false"><p class="mut" style="margin:0">Choose a password (at least 4 characters). It is needed to open or restore any new backup file. It is stored only on this phone – <b>write it down somewhere safe</b>.</p>${F.t('New password','pw','',{type:'password',autocomplete:'off'})}${F.t('Type it again','pw2','',{type:'password',autocomplete:'off'})}</form>`,
   foot:[...(has?[{t:'Remove password',cls:'bad',fn:()=>{ls.set('hs_bkpw','');toast('Backups are no longer encrypted');render(true)}}]:[]),{t:'Cancel',fn:()=>{}},{t:'Save password',cls:'pri',fn:el=>{const f=formData(el);if(f.pw.length<4){toast('Use at least 4 characters','bad');return false}if(f.pw!==f.pw2){toast('The two passwords do not match','bad');return false}ls.set('hs_bkpw',f.pw);toast('Backups will now be encrypted','ok');render(true)}}]})};
/* keep copies fresh: after changes, when the app is hidden, and on a timer */
setInterval(()=>Backup.auto(),5*60*1000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)Backup.auto()});

HC.po=(v,el,d)=>{const inp=el.closest('.po').querySelector('input[name="'+d.for+'"]');if(v==='__o'){inp.style.display='';inp.value='';inp.focus()}else{inp.style.display='none';inp.value=v}};
