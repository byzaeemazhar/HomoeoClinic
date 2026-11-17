const {chromium}=require('playwright');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///home/claude/homoeostock/www/index.html');await sleep(2500);await p.click('text=Use sample data');await sleep(400);
 const shot=n=>p.screenshot({path:'tests/shots/'+n+'.png'});
 // sell
 await p.evaluate(()=>location.hash='#/sell');await sleep(300);
 await p.click('#pres .row >> nth=0');await p.click('#pres .row >> nth=1');await sleep(200);await shot('20-sell');
 await p.click('[data-a=pos-pay]');await sleep(400);ok((await p.textContent('.modal'))?.includes('Sale complete'),'sale complete');await shot('21-saledone');
 await p.click('.modal footer .btn.pri');await sleep(200);
 // orders
 await p.evaluate(()=>{OU.tab='sugg';location.hash='#/orders'});await sleep(300);await shot('22-sugg');
 await p.click('[data-a=sugg-all]');await sleep(400);
 const n=await p.evaluate(()=>DB.all('orders').length);ok(n>=1,'order lists created: '+n);
 await p.evaluate(()=>{OU.tab='orders';render()});await sleep(200);
 const oid=await p.evaluate(()=>DB.all('orders')[0].id);
 await p.evaluate(i=>orderEditor(DB.get('orders',i)),oid);await sleep(300);await shot('23-order');
 await p.evaluate(()=>{while(modals.length)modals[modals.length-1].close()});
 // multi-page pdf
 const rows=Array.from({length:140},(_,i)=>[i+1,'Medicine number '+(i+1)+' 30C',i%9+1,'bottle',120+i,'']);
 const dl=p.waitForEvent('download');
 await p.evaluate(r=>savePdf(docHead('Order list ORD-1','To: Ali Distributors',false)+tableHTML(['#','Medicine','Qty','Unit','Price','Note'],r)),rows);
 await (await dl).saveAs('tests/multi.pdf');
 // label (small) pdf
 const dl3=p.waitForEvent('download');
 await p.evaluate(()=>savePdf('<div class="lab"><div class="ls">Clinic</div><b>Ayesha</b><div class="lm">Belladonna 30C</div><div>4 pills 3 times a day</div></div><div class="lab"><div class="lm">Nux Vomica 30C</div></div>',{label:true}));
 await (await dl3).saveAs('tests/label.pdf');
 // staff pin
 await p.evaluate(async()=>{ls.set('hs_pin',await hashPin('1234'));ls.set('hs_pin2',await hashPin('5555'))});
 await p.reload();await sleep(2600);
 ok(await p.$('.lock')!==null,'lock screen shown');
 await p.fill('.lock input','5555');await sleep(400);
 ok(await p.$('.lock')===null,'staff unlocked');
 ok(await p.evaluate(()=>!navList().some(n=>['backup','settings','reports','suppliers'].includes(n[0]))),'staff nav limited');
 await shot('24-staff-home');
 // dark
 await p.evaluate(()=>{ls.set('hs_ui',{theme:'dark',fs:16});applyTheme();location.hash='#/dash'});await sleep(300);await shot('25-dark');
 // laptop
 await p.setViewportSize({width:1280,height:800});await p.evaluate(()=>{ls.set('hs_ui',{theme:'light',fs:16});applyTheme()});await sleep(300);await shot('26-laptop-home');
 await p.evaluate(()=>location.hash='#/patients');await sleep(300);await shot('27-laptop-patients');
 console.log('errors',errs.slice(0,5));await b.close();console.log(fails?'FAILURES':'ALL PASS')
})().catch(e=>{console.error(e);process.exit(1)});
