const {chromium}=require('playwright');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1.5})).newPage();
await p.goto('file:///home/claude/homoeostock/www/index.html');await sleep(2500);await p.click('text=Use sample data');await sleep(400);
await p.evaluate(()=>location.hash='#/today');await sleep(500);await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:'tests/shots/40-today-top.png'});
await p.evaluate(()=>location.hash='#/sell');await sleep(500);await p.screenshot({path:'tests/shots/41-sell.png'});await b.close()})()
