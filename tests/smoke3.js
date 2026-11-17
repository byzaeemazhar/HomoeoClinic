const {chromium}=require('playwright');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///home/claude/homoeostock/www/index.html');await sleep(2500);await p.click('text=Use sample data');await sleep(500);
 const shot=n=>p.screenshot({path:'tests/shots/'+n+'.png'});
 // stock cards
 await p.evaluate(()=>location.hash='#/stock');await sleep(400);
 ok(await p.$$eval('.grp',e=>e.length)>3,'grouped medicine cards');ok(await p.$$eval('.pill',e=>e.length)>5,'potency pills');await shot('30-stock');
 await p.click('[data-a=stock-c][data-c=q]');await sleep(300);ok(await p.$$eval('.grp',e=>e.length)>=1,'Q filter works');await shot('31-stock-q');
 await p.click('[data-a=stock-c][data-c=""]');
 // open bottle
 const id=await p.evaluate(()=>DB.all('items').find(i=>qty(i.id)>2).id);const before=await p.evaluate(i=>qty(i),id);
 await p.evaluate(i=>openItem(i),id);await sleep(300);await p.click('[data-a=open-bottle]');await sleep(500);
 ok(await p.evaluate(i=>qty(i),id)===before-1,'open bottle reduces sealed stock');ok(await p.evaluate(i=>openList(i).length,id)===1,'1 open bottle tracked');await shot('32-item');
 await p.evaluate(()=>{while(modals.length)modals[modals.length-1].close()});
 // bonus qty
 const q1=await p.evaluate(i=>qty(i),id);
 await p.evaluate(i=>receivePurchase({sup:'',lines:[{it:i,nm:'x',q:10,free:2,p:100,no:'B1',exp:'2030-01-01'}]}),id);
 ok(await p.evaluate(i=>qty(i),id)===q1+12,'10 + 2 free adds 12');ok(await p.evaluate(i=>DB.get('items',i).buy,id)===83.33,'effective cost 83.33');
 // expired write off + return list
 await p.evaluate(i=>{addStock(i,5,{type:'add',no:'OLD',exp:addDays(-10),buy:50});addStock(i,4,{type:'add',no:'SOON',exp:addDays(40),buy:50})},id);
 const bq0=await p.evaluate(i=>qty(i),id);
 await p.evaluate(()=>location.hash='#/alerts');await sleep(400);await shot('33-alerts');
 await p.evaluate(()=>A['ret-list']());await sleep(300);ok((await p.textContent('.modal')).includes('SOON'),'return list has near-expiry batch');await shot('34-return');
 await p.evaluate(()=>{while(modals.length)modals[modals.length-1].close()});
 await p.evaluate(()=>{const b=alerts().exps[0].b;writeOffBatch(b.id)});
 ok(await p.evaluate(i=>qty(i),id)<bq0,'write-off removes expired batch');
 // expense + drawer
 await p.evaluate(()=>location.hash='#/today');await sleep(400);
 await p.fill('[name="ex-amt"]','150');await p.click('[data-a=ex-save]');await sleep(300);
 ok(await p.evaluate(()=>drawer(ymd()).exps)===150,'expense saved');await shot('35-today');
 // packages
 const pid=await p.evaluate(()=>DB.all('patients')[0].id);
 await p.evaluate(()=>location.hash='#/sell');await sleep(300);
 await p.evaluate(i=>{CART.pat=i},pid);await p.click('[data-a=pos-pkg][data-i="1"]');await sleep(300);
 const nv=await p.evaluate(i=>DB.all('visits').filter(v=>v.pat===i).length,pid);
 await p.evaluate(()=>A['pos-pay']());await sleep(500);
 ok(await p.evaluate(i=>DB.all('visits').filter(v=>v.pat===i).length,pid)===nv+1,'package creates follow-up visit');
 ok(await p.evaluate(i=>DB.all('visits').filter(v=>v.pat===i).some(v=>v.follow&&v.complaint.startsWith('Package')),pid),'follow-up date set');
 await p.evaluate(()=>{while(modals.length)modals[modals.length-1].close()});
 // patient: repeat rx, parhez, print
 await p.evaluate(i=>openPatient(i),pid);await sleep(400);await shot('36-patient');
 await p.evaluate(i=>A['pat-repeat']({id:i}),pid);await sleep(500);
 ok(await p.$('#vepar .chip')!==null,'parhez chips shown');ok(await p.$('#veprev .prevbox')!==null,'previous-visit panel shown');
 await p.click('#vepar .chip >> nth=0');await p.click('[data-a=ve-dir] >> nth=0');await sleep(200);await shot('37-visit');
 ok(await p.evaluate(()=>VE.parhez.length)===1,'parhez selected');
 await p.evaluate(()=>{const r=saveVE();A['visit-print']({id:r.id})});await sleep(800);
 await p.evaluate(()=>{const v=DB.all('visits').find(x=>(x.parhez||[]).length);const pt=DB.get('patients',v.pat);window.__t=rxText(v,pt)});
 ok((await p.evaluate(()=>window.__t)).includes('Parhez'),'Rx WhatsApp text has Parhez');
 // scanner modal
 await p.evaluate(()=>{while(modals.length)modals[modals.length-1].close()});
 await p.evaluate(()=>A['stock-scan']());await sleep(500);ok(await p.$('#scc')!==null,'scanner opens with manual fallback');await shot('38-scan');
 // closing report includes expenses
 console.log('errors',errs.slice(0,5));await b.close();console.log(fails?'FAILURES':'ALL PASS')
})().catch(e=>{console.error(e);process.exit(1)});
