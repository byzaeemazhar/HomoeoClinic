// Builds www/index.html (one self-contained file) from src/*.
const fs=require('fs'),path=require('path');
const src=p=>path.join(__dirname,'src',p);
const order=['core.js','native.js','logic.js','logic2.js','ui.js','views1.js','views2.js','views3.js','views4.js','main.js'];
const js=order.map(f=>fs.readFileSync(src(f),'utf8')).join('\n');
if(/<\/script/i.test(js))throw new Error('script end tag inside JS');
const font=(fam,file,w)=>`@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${fs.readFileSync(src('fonts/'+file)).toString('base64')}) format('woff2');font-weight:${w};font-style:normal;font-display:swap}`;
const fonts=font('DM Sans','dmsans.woff2','100 1000')+font('Fraunces','fraunces.woff2','100 900');
let html=fs.readFileSync(src('template.html'),'utf8').replace('/*__FONTS__*/',()=>fonts).replace('/*__CSS__*/',()=>fs.readFileSync(src('style.css'),'utf8')).replace('/*__JS__*/',()=>js);
fs.mkdirSync(path.join(__dirname,'www'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'www/index.html'),html);
console.log('www/index.html',Math.round(html.length/1024)+' KB');
