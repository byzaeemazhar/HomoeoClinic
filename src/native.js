/* =====================================================================
   Native helpers (Android app via Capacitor): save files, share, PDF.
   In a normal browser these fall back to standard web behaviour.
   ===================================================================== */
const NATIVE=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const Plug=n=>(NATIVE&&window.Capacitor.Plugins&&window.Capacitor.Plugins[n])||null;
const blobB64=b=>new Promise((res,rej)=>{const f=new FileReader();f.onload=()=>res(String(f.result).split(',')[1]||'');f.onerror=()=>rej(f.error);f.readAsDataURL(b)});
const FOLDER='HomoeoClinic';
/* save a file inside the phone (Documents/HomoeoClinic). Returns {ok,where,uri} */
async function nativeSave(blob,name,{sub='',dirs=['DOCUMENTS','EXTERNAL','CACHE']}={}){
  const fs=Plug('Filesystem');if(!fs)return{ok:false};
  const data=await blobB64(blob);let err;
  for(const directory of dirs){
    try{const r=await fs.writeFile({path:FOLDER+(sub?'/'+sub:'')+'/'+name,data,directory,recursive:true});
      return{ok:true,uri:r.uri,where:directory==='DOCUMENTS'?'Documents/'+FOLDER+(sub?'/'+sub:''):directory==='EXTERNAL'?'phone storage / '+FOLDER:'temporary storage',dir:directory}}
    catch(e){err=e}}
  console.warn('save failed',err);return{ok:false,err}}
async function nativeShare(uri,title){const sh=Plug('Share');if(!sh||!uri)return false;try{await sh.share({title,files:[uri],dialogTitle:title});return true}catch(e){return false}}
/* ---------- PDF made from HTML (works for Urdu too; used in the Android app where window.print is unavailable) ---------- */
const PDFCSS=`*{box-sizing:border-box}.pdfroot{background:#fff;color:#000;font:12pt/1.4 'DM Sans',system-ui,'Noto Nastaliq Urdu','Noto Sans Arabic',Arial,sans-serif}h1{font-size:19pt;margin:0}h2{font-size:13pt;margin:.55rem 0 .3rem}.ph{border-bottom:2px solid #000;padding-bottom:.4rem;margin-bottom:.6rem}p{margin:.4rem 0}table{border-collapse:collapse;width:100%;font-size:10.5pt}th,td{border:1px solid #888;padding:3px 6px;text-align:left;vertical-align:top}th{background:#eee}td.n,th.n{text-align:right}.note-box{border:1px solid #888;padding:6px 8px;margin-top:8px;white-space:pre-wrap}.lab{border:1px dashed #000;padding:6px;font-size:9pt;line-height:1.3}.lm{font-size:12pt;font-weight:700;margin:2px 0}.ls{font-size:8pt;border-bottom:1px solid #000;margin-bottom:2px}.sig{margin-top:2.2rem;display:flex;justify-content:space-between;font-size:10pt}.sig span{border-top:1px solid #000;padding-top:3px;min-width:35%;text-align:center}.kvt td:first-child{width:34%;color:#444}`;
const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('render failed'));i.src=src});
async function pdfFromHTML(html,o={}){
  const kind=o.thermal?'thermal':o.label?'label':'a4';
  const W=kind==='a4'?794:kind==='thermal'?302:227, PH=kind==='a4'?1123:kind==='label'?151:0, M=kind==='a4'?42:8, S=2;
  const box=document.createElement('div');box.style.cssText=`position:fixed;left:-99999px;top:0;width:${W}px;visibility:hidden`;
  box.innerHTML=`<style>${PDFCSS}</style><div class="pdfroot" style="padding:${M}px ${M}px ${kind==='a4'?0:M}px">${html}</div>`;document.body.appendChild(box);
  const root=box.querySelector('.pdfroot');const H=Math.ceil(root.scrollHeight),t0=root.getBoundingClientRect().top;
  const marks=[...root.querySelectorAll('tr,p,h1,h2,.ph,.lab,.note-box,.sig,li')].map(e=>Math.ceil(e.getBoundingClientRect().bottom-t0)).sort((a,b)=>a-b);
  const inner=root.outerHTML;box.remove();
  const FOOT=kind==='a4'?46:0, pages=[];
  if(kind==='thermal'){pages.push([0,H])}
  else{let y0=0,k=0;while(y0<H-1){const tp=k?30:0,room=(PH-FOOT)-tp;let lim=y0+room,end;
      if(lim>=H)end=H;else{const c=marks.filter(m=>m>y0+room*.45&&m<=lim);end=c.length?c[c.length-1]:lim}
      pages.push([y0,end,tp]);y0=end;k++;if(k>60)break}}
  const imgs=[];
  for(let k=0;k<pages.length;k++){
    const [y0,end,tp=0]=pages[k];const ph=kind==='thermal'?H:PH;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${ph}"><foreignObject x="0" y="${tp-y0}" width="${W}" height="${H}"><div xmlns="http://www.w3.org/1999/xhtml"><style>${PDFCSS.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</style>${inner}</div></foreignObject></svg>`;
    const im=await loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));
    const cv=document.createElement('canvas');cv.width=W*S;cv.height=ph*S;const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cv.width,cv.height);g.drawImage(im,0,0,cv.width,cv.height);
    if(kind==='a4'){const cut=(tp+(end-y0))*S;g.fillStyle='#fff';g.fillRect(0,cut,cv.width,cv.height-cut);
      g.fillStyle='#667';g.font=`${10*S}px sans-serif`;g.textAlign='center';g.fillText(`HomoeoClinic · ${CREDIT}  ·  Page ${k+1} of ${pages.length}`,cv.width/2,cv.height-16*S);
      g.strokeStyle='#bbb';g.lineWidth=S;g.beginPath();g.moveTo(M*S,cv.height-34*S);g.lineTo(cv.width-M*S,cv.height-34*S);g.stroke()}
    else if(kind==='thermal'){g.fillStyle='#555';g.font=`${8*S}px sans-serif`;g.textAlign='center';g.fillText(CREDIT,cv.width/2,cv.height-4*S)}
    const jb=await new Promise(r=>cv.toBlob(r,'image/jpeg',.92));imgs.push({bytes:new Uint8Array(await jb.arrayBuffer()),w:cv.width,h:cv.height})}
  return buildPdf(imgs,kind==='a4'?[595.28,841.89]:null)}
function buildPdf(imgs,size){
  const enc=new TextEncoder(),chunks=[],offs=[];let len=0;
  const put=x=>{const b=typeof x==='string'?enc.encode(x):x;chunks.push(b);len+=b.length};
  const obj=(n,body)=>{offs[n]=len;put(`${n} 0 obj\n`);put(body);put('\nendobj\n')};
  put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n=imgs.length,kids=imgs.map((_,i)=>`${3+i*3} 0 R`).join(' ');
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  imgs.forEach((im,i)=>{const pw=size?size[0]:im.w*.75/2*1,ph=size?size[1]:im.h*.75/2*1,b=3+i*3;
    obj(b,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 ${b+2} 0 R >> >> /Contents ${b+1} 0 R >>`);
    const cs=`q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im0 Do Q`;obj(b+1,`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
    offs[b+2]=len;put(`${b+2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`);put(im.bytes);put('\nendstream\nendobj\n')});
  const total=3+n*3,xr=len;put(`xref\n0 ${total}\n0000000000 65535 f \n`);for(let i=1;i<total;i++)put(String(offs[i]).padStart(10,'0')+' 00000 n \n');
  put(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
  return new Blob(chunks,{type:'application/pdf'})}
const pdfName=html=>{const m=/<h2>([^<]*)<\/h2>/.exec(html);return((m?m[1]:'document').replace(/&amp;/g,'and').replace(/[^\w\-]+/g,'_').replace(/^_+|_+$/g,'')||'document')+'_'+ymd()+'.pdf'};
async function savePdf(html,o={}){
  try{toast('Making PDF…');const blob=await pdfFromHTML(html,o),name=pdfName(html);
    if(NATIVE){const r=await nativeSave(blob,name,{sub:'PDF'});if(r.ok){toast('PDF saved in '+r.where,'ok');await nativeShare(r.uri,name)}else toast('Could not save the PDF','bad')}
    else download(blob,name)}
  catch(e){console.error(e);toast('Could not make the PDF','bad')}}
