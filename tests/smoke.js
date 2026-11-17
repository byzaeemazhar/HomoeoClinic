const {chromium}=require('playwright');
const URL='file:///home/claude/homoeostock/www/index.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true,permissions:[]});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const shot=n=>p.screenshot({path:'/home/claude/homoeostock/tests/shots/'+n+'.png'});
 await p.goto(URL);await sleep(300);await shot('00-splash');
 await sleep(2200);
 ok(await p.$('#splash')===null,'splash removed');
 // welcome modal -> use own data
 await shot('01-welcome');
 await p.click('text=Use sample data');await sleep(400);
 await shot('02-home');
 ok((await p.textContent('#greet')).toLowerCase().includes('good'),'greeting');
 // today's sales
 await p.click('.tile.pri');await sleep(300);
 await p.fill('#ds-amt','5200');await p.click('[data-a=ds-save]');await sleep(300);
 await p.fill('#ds-amt','1800');await p.click('[data-m=online]');await p.click('[data-a=ds-save]');await sleep(300);
 await shot('03-today');
 ok((await p.textContent('.gt')).includes('7,000'),'day total 7,000');
 await p.goto(URL+'#/dash');await sleep(500);
 ok((await p.textContent('.kpis2')).includes('7,000'),'home kpi shows 7,000');
 // add new medicine with custom potency
 await p.evaluate(()=>location.hash='#/stock');await sleep(300);
 await p.click('[data-a=item-new]');await sleep(300);
 await p.fill('[name=name]','Thuja Occidentalis');
 await p.click('.pchip:has-text("30C")');
 await p.fill('[name=potx]','45C, LM3');
 await p.selectOption('.po select[data-for=brand]','__o');await p.fill('input[name=brand]','Dr. Willmar');
 await p.fill('[name=sell]','260');await p.fill('[name=buy]','170');await p.fill('[name=oq]','6');await p.fill('[name=ono]','TH9');
 await p.click('[data-a=exp-q][data-n="24"]');
 await shot('04-itemform');
 await p.click('.sheet footer .btn.pri');await sleep(400);
 const names=await p.evaluate(()=>DB.all('items').filter(i=>i.name==='Thuja Occidentalis').map(i=>i.potency).sort());
 ok(JSON.stringify(names)===JSON.stringify(['30C','45C','LM3']),'3 potencies created incl custom: '+names);
 ok(await p.evaluate(()=>CFG().xBrand.includes('Dr. Willmar')&&CFG().xPot.includes('45C')),'custom brand + potency remembered');
 // add stock detailed
 const id=await p.evaluate(()=>DB.all('items').find(i=>i.name==='Thuja Occidentalis'&&i.potency==='45C').id);
 await p.evaluate(i=>addStockForm(i),id);await sleep(300);
 await p.fill('[name=q]','10');await p.fill('[name=no]','B77');await p.click('[data-a=exp-q][data-n="12"]');await p.fill('[name=mfg]','2026-10-01');await p.fill('[name=buy]','175');
 const sups=await p.evaluate(()=>DB.all('suppliers').map(s=>s.id));await p.selectOption('[name=sup]',sups[0]);await p.fill('[name=inv]','INV-55');await p.selectOption('[name=pay]','part');await p.fill('[name=paid]','500');
 await shot('05-addstock');
 await p.click('.sheet footer .btn.pri');await sleep(400);
 ok(await p.evaluate(i=>qty(i),id)===16||await p.evaluate(i=>qty(i),id)===10,'stock qty after add: '+await p.evaluate(i=>qty(i),id));
 ok(await p.evaluate(()=>DB.all('purchases').some(x=>x.inv==='INV-55'&&x.total===1750&&x.paid===500)),'purchase recorded with part payment');
 ok(await p.evaluate(()=>DB.all('batches').some(b=>b.no==='B77'&&b.mfg==='2026-10-01')),'batch has mfg date');
 // patients
 await p.evaluate(()=>location.hash='#/patients');await sleep(300);await shot('06-patients');
 await p.click('[data-a=pat-new]');await sleep(300);
 await p.fill('[name=name]','Bilal Ahmed');await p.fill('[name=age]','41');await p.selectOption('[name=sex]','Male');await p.fill('[name=phone]','03001112233');await p.fill('[name=allergy]','Penicillin');
 await shot('07-patform');
 await p.click('.sheet footer .btn.pri');await sleep(400);
 const pid=await p.evaluate(()=>DB.all('patients').find(x=>x.name==='Bilal Ahmed').id);
 await p.evaluate(i=>openPatient(i),pid);await sleep(300);
 await p.click('[data-a=visit-new]');await sleep(300);
 await p.fill('[data-f=complaint]','Chronic cough since 1 month');await p.fill('[data-f=since]','1 month');
 await p.click('[data-a=ve-free]');await p.fill('[data-f=nm]','Bryonia');await p.fill('[data-f=pot]','1M-custom');await p.fill('[data-f=dose]','5 drops');await p.fill('[data-f=days]','10');
 await p.click('[data-a=ve-fq][data-n="14"]');await shot('08-visit');
 await p.click('.sheet footer .btn:not(.pri):not(:first-child)');await sleep(400);
 ok(await p.evaluate(i=>patVisits(i).length,pid)===1,'visit saved');
 ok(await p.evaluate(i=>patCourses(i)[0].st,pid)==='running','course running');
 ok(await p.evaluate(()=>CFG().xPot.includes('1M-custom')),'custom Rx potency remembered');
 // second visit with change
 await p.evaluate(i=>visitForm(i,null,{}),pid);await sleep(300);
 await p.click('[data-a=ve-free]');await p.fill('[data-f=nm]','Drosera');await p.fill('[data-f=days]','5');
 await sleep(100);ok((await p.textContent('#vechg')).includes('stopped Bryonia'),'change detected in form');
 await p.click('.sheet footer .btn:not(.pri):not(:first-child)');await sleep(400);
 await p.evaluate(i=>{PTAB='meds';openPatient(i)},pid);await sleep(300);await shot('09-meds');
 await p.evaluate(()=>{while(modals.length)modals[modals.length-1].close()});
 await p.evaluate(i=>{PTAB='visits';openPatient(i)},pid);await sleep(300);await shot('10-visits');
 await p.evaluate(()=>{while(modals.length)modals[modals.length-1].close()});
 // more + backup
 await p.evaluate(()=>location.hash='#/more');await sleep(300);await shot('11-more');
 await p.evaluate(()=>location.hash='#/backup');await sleep(500);await shot('12-backup');
 const dl=p.waitForEvent('download');await p.click('[data-a=bk-now]');const d=await dl;const path='/home/claude/homoeostock/tests/backup.json';await d.saveAs(path);
 const bk=JSON.parse(require('fs').readFileSync(path,'utf8'));ok(bk.data&&bk.data.patients&&Object.keys(bk.data.items).length>10,'backup file has data');
 // encrypted backup + restore
 await p.evaluate(()=>ls.set('hs_bkpw','secret1'));
 const t=await p.evaluate(()=>Backup.text());ok(JSON.parse(t).app==='homoeoclinic-encrypted','encrypted backup');
 const back=await p.evaluate(async t=>{await DB.wipe();const n=await Backup.restoreText(t,'replace');return [n,DB.all('patients').length]},t);
 ok(back[0]>10&&back[1]>=2,'restore from encrypted: '+back);
 await p.evaluate(()=>ls.set('hs_bkpw',''));
 // auto snapshot
 await p.evaluate(()=>Backup.auto(true));await sleep(300);ok((await p.evaluate(()=>Backup.snaps())).length>=1,'auto snapshot stored');
 // PDF
 await p.evaluate(()=>location.hash='#/patients');
 const dl2=p.waitForEvent('download');
 await p.evaluate(i=>{const v=patVisits(i)[0];savePdf(docHead('Prescription','Bilal',true)+tableHTML(['Medicine','Dose'],[['Bryonia','5 drops'],['آرنیکا','۳ گولیاں']])+'<p>Test</p>')},pid);
 const d2=await dl2;await d2.saveAs('/home/claude/homoeostock/tests/test.pdf');
 // persistence across reload
 await p.reload();await sleep(2500);
 ok(await p.evaluate(()=>DB.all('patients').length)>=2,'data survives reload');
 await shot('13-home-after');
 console.log('errors:',errs.slice(0,8));
 await b.close();console.log(fails?'FAILURES '+fails:'ALL PASS');
})().catch(e=>{console.error(e);process.exit(1)});
