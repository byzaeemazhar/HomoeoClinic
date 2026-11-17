const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>console.log('CON',m.type(),m.text()));
await p.goto('file:///home/claude/homoeostock/www/index.html');await new Promise(r=>setTimeout(r,3500));
console.log(await p.evaluate(()=>document.body.innerText.slice(0,300)));await p.screenshot({path:'tests/shots/dbg.png'});await b.close()})();
