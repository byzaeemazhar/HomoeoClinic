/* =====================================================================
   Boot, theme, PIN lock
   ===================================================================== */
function applyTheme(){
  const u=UI(),dark=u.theme==='dark'||(u.theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=dark?'dark':'light';
  document.documentElement.style.setProperty('--fs',(u.fs||16)+'px');
  const b=$('#themebtn');if(b)b.innerHTML=ico(dark?'sun':'moon')}
A.theme=()=>{const u=UI();ls.set('hs_ui',{...u,theme:document.documentElement.dataset.theme==='dark'?'light':'dark'});applyTheme()};
matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);

function lockScreen(){
  const p1=ls.get('hs_pin',null),p2=ls.get('hs_pin2',null);if(!p1&&!p2){ROLE='owner';return}
  if($('.lock'))return;ROLE='staff';
  const el=document.createElement('div');el.className='lock';
  el.innerHTML=`<div class="card">${logoSVG(64)}<h2 style="justify-content:center;margin-top:.6rem">${esc(CFG().shop)}</h2><p class="mut">Enter your PIN</p><input type="password" inputmode="numeric" maxlength="6" autocomplete="off" aria-label="PIN"><div class="mut" style="min-height:1.5rem;margin-top:.5rem"></div><div class="mut" style="font-size:.75rem">${esc(CREDIT)}</div></div>`;
  document.body.appendChild(el);const inp=$('input',el),msg=$('.mut:nth-of-type(2)',el)||$('.mut',el);
  const check=async final=>{const v=inp.value;if(v.length<4)return;const h=await hashPin(v);
    if(h===p1||(p2&&h===p2)){ROLE=h===p1?'owner':'staff';el.remove();buildShell();render();return}
    if(final||v.length>=6){$$('.mut',el)[1].textContent='Wrong PIN';inp.value=''}};
  inp.addEventListener('input',()=>check(false));inp.addEventListener('keydown',e=>{if(e.key==='Enter')check(true)});setTimeout(()=>inp.focus(),50)}
let idleT;const idle=()=>{clearTimeout(idleT);if(ls.get('hs_pin',null)||ls.get('hs_pin2',null))idleT=setTimeout(lockScreen,5*60*1000)};
['pointerdown','keydown','touchstart'].forEach(e=>document.addEventListener(e,idle,{passive:true}));

function tickClock(){const g=$('#greet'),c=$('#clk');if(g)g.innerHTML=greetHTML();if(c)c.innerHTML=`${ico('clock')} ${clockStr()} · ${dateLong()} · ${TOD(new Date().getHours())[0]}`}
setInterval(tickClock,20000);

(async function boot(){
  const t0=performance.now();
  $('#top').insertAdjacentHTML('beforeend',`<button class="ib" data-a="help" aria-label="Help">${ico('help')}</button><button class="ib" data-a="bell" aria-label="Alerts">${ico('bell')}<span class="dot bellDot" style="display:none"></span></button><button class="ib" id="themebtn" data-a="theme" aria-label="Theme"></button>`);
  if(ls.get('hs_pin',null)||ls.get('hs_pin2',null))ROLE='staff';
  buildShell();applyTheme();
  await DB.init();
  DB.onChange(refresh);
  Backup.persist();
  if(!location.hash)history.replaceState(null,'','#/dash');
  render();lockScreen();idle();
  try{ls.set('hs_doc',(CFG().doc||'').trim()||null)}catch(e){}
  const sg=$('#splash-greet');if(sg)sg.textContent=TOD(new Date().getHours())[1]+', '+((CFG().doc||'').trim()||'doctor');
  const wait=Math.max(0,1700-(performance.now()-t0));
  setTimeout(()=>{const sp=$('#splash');if(sp){sp.classList.add('out');setTimeout(()=>sp.remove(),500)}
    if(!ls.get('hs_seen',false)&&!DB.all('items').length&&isOwner())setTimeout(A.welcome,300);
    Backup.rescue().catch(()=>{});setTimeout(()=>Backup.auto(),4000)},wait);
  if(DB.memOnly)toast('Storage is blocked – data will not be saved!','bad');
  const AppP=Plug('App');
  if(AppP&&AppP.addListener){AppP.addListener('backButton',()=>{if(modals.length){modals[modals.length-1].close();return}if(curRoute()!=='dash'){location.hash='#/dash';return}AppP.minimizeApp?AppP.minimizeApp():AppP.exitApp()});
    AppP.addListener('pause',()=>Backup.auto()).catch&&0}
  if(!NATIVE&&'serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();

/* ---------------- help & welcome ---------------- */
const HELP={
 dash:['Type a medicine name in the search box to see its stock and price.','<b>Today\'s sales</b> – write the money you took in a day without making bills.','<b>Add stock</b> when a delivery arrives. <b>Order list</b> shows what to buy. <b>Patients</b> and <b>Notes</b> are one tap away.','The bottom bar always takes you to Home, Sell (billing), Medicines, Orders and More.'],
 today:['Type the amount, choose Cash / Online / Credit and tap <b>Save sale</b>.','You can save several entries in one day. Everything is added to the day\'s total together with your bills.','Forgot yesterday? Change the date and save.'],
 sell:['Tap a medicine to add it to the bill. Change quantity with + / −.','Only choose a <b>Customer</b> if they will pay later (credit).','Tap <b>Complete sale</b> – stock reduces automatically. You can print a receipt or medicine labels.','Use <b>Custom mixture</b> to make a one-time mixture for a patient.'],
 stock:['Tap a medicine to add stock, remove damaged ones, or sell it.','<b>Add</b> creates a new medicine. Tick several potencies, or type your own if it is not in the list.','Filters: Low = running out, Finished = zero stock, Expiring = expiry is near.'],
 orders:['<b>To reorder</b> shows medicines running low, grouped by supplier – press <b>Create list</b> (or create all).','Edit quantities, add a note, then <b>Send / Export</b> to share by WhatsApp, Excel or PDF.','When the delivery comes, press <b>Delivery arrived</b> to add everything to stock at once.'],
 suppliers:['Add the distributors you buy from. Link each medicine to its supplier when you add the medicine.','Open a supplier to see its medicines, what you owe, and to create its order list.'],
 mix:['Save formulas you make often. Ingredient stock reduces when you sell it.','For a one-time mixture, use <b>Custom mixture</b> on the Sell screen.'],
 notes:['Write anything you want to remember. Add a reminder date and it will show in Alerts.','Pinned notes appear on the Home screen.'],
 patients:['Open a patient to see visits, medicines with dates / days left, and bills.','<b>New visit</b> records complaint, medicines, dose, days and the next visit date. The time of day is saved too.','<b>Bill this Rx</b> puts the prescribed medicines straight into a bill.'],
 people:['Customers who buy on credit and their balances. Tap a name to receive a payment or send a WhatsApp reminder.'],
 reports:['Choose a report at the top and a date range. <b>Daily closing</b> shows your cash at the end of the day.','Use <b>Export / Print</b> for Excel, CSV or PDF.'],
 alerts:['Everything that needs action: low stock, expiry, unpaid dues, follow-ups.','Tap the truck icon to put a medicine on your order list.'],
 backup:['Tap <b>Back up now</b> and send the file to WhatsApp, Google Drive or Gmail. Do this every week.','Automatic copies are kept for you, but a copy outside the phone is the real safety.'],
 settings:['Fill in shop and doctor details – they appear on bills and prescriptions.','Set an Owner PIN so only you can see profit, reports and backups.'],
 more:['All other sections are here: suppliers, patients, notes, reports, backup and settings.'],
 audit:['Type what you physically counted on the shelf. Only differences are corrected.']};
A.help=()=>{const r=curRoute(),h=HELP[r]||HELP.dash;
  modal({title:'How to use this screen',sticky:false,html:`<div class="stack"><ul style="margin:0;padding-left:1.2rem;display:flex;flex-direction:column;gap:.5rem">${h.map(x=>`<li>${x}</li>`).join('')}</ul><div class="hr" style="margin:.2rem 0"></div><button class="btn" data-a="welcome">Show the welcome guide</button></div>`})};
A.welcome=()=>{if(modals.length>5)return;ls.set('hs_seen',true);const c=CFG();
  modal({title:'Welcome to '+APP,sticky:true,html:`<form class="stack" onsubmit="return false"><p style="margin:0">Let’s set up in one minute. You can change everything later in Settings.</p>${F.t('Shop / clinic name','shop',DB.get('settings','main')?c.shop:'',{placeholder:'e.g. Dr. Khan Homoeo Clinic & Store'})}${F.t('Doctor name (optional)','doc',c.doc)}${F.t('Shop phone (optional)','phone',c.phone)}
   <div class="mut" style="font-size:.9rem"><b>3 things to know:</b><br>① <b>Sell</b> – make bills, stock reduces by itself.<br>② <b>Medicines</b> – add stock when deliveries arrive.<br>③ <b>Patients</b> – keep every visit and medicine course.<br>④ <b>More → Backup</b> – keep a copy of your data safe.</div></form>`,
   foot:[{t:'Use sample data',fn:el=>{saveWelcome(el);loadDemo()}},{t:'Start with my own data',cls:'pri',fn:el=>{saveWelcome(el)}}]})};
function saveWelcome(el){const f=formData(el);DB.put('settings',{...(DB.get('settings','main')||{}),id:'main',shop:f.shop.trim()||DEFCFG.shop,doc:f.doc.trim(),phone:f.phone.trim()})}
