const {chromium}=require('playwright');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto('file:///home/claude/homoeostock/www/index.html');await sleep(2500);
await p.click('text=Use sample data');await sleep(500);
const id=await p.evaluate(()=>DB.all('patients')[0].id);
for(const t of ['over','visits','meds','bills']){await p.evaluate(([i,t])=>{while(modals.length)modals[modals.length-1].close();PTAB=t;openPatient(i)},[id,t]);await sleep(300);
 console.log(t,(await p.evaluate(()=>$('#pbody').innerHTML.length)));await p.screenshot({path:'tests/shots/pat-'+t+'.png'})}
await b.close()})();
