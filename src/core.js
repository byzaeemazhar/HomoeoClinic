'use strict';
/* =====================================================================
   HomoeoClinic – core: utils and local database (Developed by Zaeem Azhar)
   ===================================================================== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let _last=0;const now=()=>(_last=Math.max(Date.now(),_last+1));
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const ymd=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const addDays=(n,from=new Date())=>ymd(new Date(from.getTime()+n*864e5));
const num=v=>{const n=parseFloat(String(v??'').replace(/,/g,''));return isFinite(n)?n:0};
const r2=n=>Math.round((n+Number.EPSILON)*100)/100;
const r3=n=>Math.round((n+Number.EPSILON)*1000)/1000;
const mem={};
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return k in mem?mem[k]:d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){mem[k]=v}}};

/* ---------- device identity & numbering ---------- */
const DEV=()=>{let d=ls.get('hs_dev',null);if(!d){d={code:String.fromCharCode(65+Math.random()*26|0)+(1+Math.random()*8|0),name:''};ls.set('hs_dev',d)}return d};
const CREDIT='Developed by Zaeem Azhar';
const APP='HomoeoClinic';
const nextNo=kind=>{const k='hs_seq_'+kind;const n=ls.get(k,0)+1;ls.set(k,n);return DEV().code+'-'+String(n).padStart(4,'0')};

/* ---------- local-first database ---------------------------------------
   Every record = {id,_u(updatedAt),_d(deleted)...}. Stored permanently in
   IndexedDB on the phone (and asked to be 'persistent' so Android never
   clears it). Stock is NEVER stored as a number – it is the sum of
   immutable ledger rows ("moves"), so a restored backup always merges
   correctly with newer data (newest _u wins).
   ----------------------------------------------------------------------- */
const DB=(()=>{
  const cols=new Map(),vers={},cache={};let idb=null,tm=null;const subs=new Set();
  const bc=('BroadcastChannel' in self)?new BroadcastChannel('hs-tabs'):null;
  const C=c=>{let m=cols.get(c);if(!m){m=new Map();cols.set(c,m)}return m};
  const bump=c=>{vers[c]=(vers[c]||0)+1;delete cache[c];clearTimeout(tm);tm=setTimeout(()=>subs.forEach(f=>{try{f()}catch(e){console.error(e)}}),40)};
  const persist=(c,r)=>{if(!idb)return;try{idb.transaction('rec','readwrite').objectStore('rec').put({k:c+'/'+r.id,c,d:r})}catch(e){console.warn(e)}};
  const api={
    memOnly:false,changed:0,count(){let n=0;for(const m of cols.values())n+=m.size;return n},
    async init(){
      try{
        idb=await new Promise((res,rej)=>{const q=indexedDB.open('homoeo-store',1);q.onupgradeneeded=()=>q.result.createObjectStore('rec',{keyPath:'k'});q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);q.onblocked=()=>rej(new Error('blocked'))});
        const all=await new Promise((res,rej)=>{const q=idb.transaction('rec').objectStore('rec').getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
        for(const e of all){C(e.c).set(e.d.id,e.d);vers[e.c]=1}
      }catch(e){idb=null;api.memOnly=true;console.warn('IndexedDB unavailable – running in memory only',e)}
      if(bc)bc.onmessage=m=>{const{c,r}=m.data||{};if(c&&r)api.remote(c,r.id,r)};
    },
    ver:c=>vers[c]||0,
    vsum:()=>Object.values(vers).reduce((a,b)=>a+b,0),
    get(c,id){const r=C(c).get(id);return r&&!r._d?r:null},
    raw:(c,id)=>C(c).get(id),
    all(c){if(cache[c])return cache[c];const a=[];for(const r of C(c).values())if(!r._d)a.push(r);return cache[c]=a},
    put(c,o){const r={...o};if(!r.id)r.id=rid();r._u=now();C(c).set(r.id,r);persist(c,r);bump(c);bc&&bc.postMessage({c,r});api.changed++;return r},
    del(c,id){const o=C(c).get(id);if(o)api.put(c,{...o,_d:1})},
    remote(c,id,r){
      if(!r||typeof r!=='object'||!r._u)return false;
      r.id=id;const l=C(c).get(id);if(l&&l._u>=r._u)return false;
      C(c).set(id,r);persist(c,r);bump(c);return true},
    entries(){const a=[];for(const[c,m]of cols)for(const r of m.values())a.push([c,r]);return a},
    onChange:f=>subs.add(f),
    export(){const o={app:'homoeoclinic',v:2,by:CREDIT,at:Date.now(),data:{}};for(const[c,r]of api.entries())(o.data[c]??={})[r.id]=r;return o},
    import(o){let n=0;if(!o||!o.data)throw new Error('Not a valid backup file');
      for(const c in o.data)for(const id in o.data[c]){const r=o.data[c][id];if(!r||!r._u)continue;const l=C(c).get(id);if(!l||r._u>l._u){C(c).set(id,r);persist(c,r);n++}}
      Object.keys(o.data).forEach(bump);api.changed++;return n},
    async wipe(){cols.clear();if(idb)await new Promise(res=>{const t=idb.transaction('rec','readwrite');t.objectStore('rec').clear();t.oncomplete=res;t.onerror=res});Object.keys(vers).forEach(bump)}
  };
  return api;
})();

