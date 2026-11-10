// Captures the Level plans handoff screenshots from the live v3 prototype.
// Usage: NODE_PATH=<repo>/node_modules node docs/handoff/level-plans/capture.cjs [base url]
const {chromium}=require('@playwright/test');
const path=require('node:path');
const BASE=process.argv[2]||'http://127.0.0.1:4310';
const URL_=BASE+'/prototypes/v3/Bricly_OS_Prototype_v3.html';
const IMG=path.join(__dirname,'img');
(async()=>{
  const b=await chromium.launch(), p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const shot=async n=>{await p.waitForTimeout(300);await p.screenshot({path:path.join(IMG,n+'.png')});};
  const D=p.locator('#de-drawer');
  const floorView=(dev,floor)=>p.evaluate(([dev,floor])=>{const s=PV3.S;s.sec=PV3.SECS.indexOf('availability');s.av[dev].tab='floor';s.av[dev].floor=floor;PV3.render();},[dev,floor]);
  await p.goto(URL_); await p.waitForTimeout(600);
  await p.evaluate(()=>{localStorage.removeItem('bricly.present.v3');curPersona='owner';deOpen('miami-tropic','plans');}); await shot('01-plans');
  await p.evaluate(()=>deOpen('lalex','plans')); await shot('02-needs');
  await p.evaluate(()=>deOpen('lalex','units')); await shot('03-units-flag');
  await p.evaluate(()=>deGo('review')); await shot('12-review');
  await p.evaluate(()=>{deGo('units');deLocOpen('#CM9820');}); await shot('04-location-needs');
  await D.getByRole('button',{name:'Free outline Unit 20'}).click(); await shot('05-placed');
  await D.getByRole('button',{name:/^CM9803 at CM9803/}).click(); await shot('06-swap');
  await D.getByRole('button',{name:'Cancel'}).click();
  await D.getByRole('button',{name:'Draw outline'}).click();
  const r=await D.locator('.de-lv svg').boundingBox();
  await p.mouse.move(r.x+r.width*.58,r.y+r.height*.18); await p.mouse.down(); await p.mouse.move(r.x+r.width*.75,r.y+r.height*.4,{steps:4}); await shot('07-drawing');
  await p.mouse.move(r.x+r.width*.9,r.y+r.height*.82,{steps:4}); await p.mouse.up(); await shot('08-drawn');
  await D.getByLabel('Level plan').selectOption('__none'); await D.getByPlaceholder(/Garage/).fill('Duplex upper level, shown with floor 2'); await shot('09-none');
  await D.getByRole('button',{name:'Cancel'}).click(); await D.getByRole('button',{name:'Reset to automatic'}).click();
  await D.getByRole('button',{name:'Free outline Unit 20'}).click();
  await p.evaluate(()=>{deOpen('miami-tropic','units');deLocOpen('AP.3203');}); await shot('10-auto');
  await p.evaluate(()=>{DE.drawer=null;deGo('plans');const el=document.querySelector('.de-g3'),c=document.getElementById('content');c.scrollTop=el.getBoundingClientRect().top+c.scrollTop-140;}); await shot('11-range');
  await p.evaluate(()=>{deOpen('lalex','review');deDraft().assets.forEach(a=>{if(a.img&&!a.alt.trim())a.alt='Photo';});deDraft().links.ig='';deRender();});
  await p.getByRole('button',{name:/^Publish v\d+/}).click(); await p.waitForTimeout(1000);
  await p.evaluate(()=>prOpenDev('lalex')); await p.waitForTimeout(900); await floorView('lalex',1); await shot('13-present-floor');
  await p.evaluate(()=>{PV3.close();prOpenDev('miami-tropic');}); await p.waitForTimeout(900); await floorView('miami-tropic',32); await shot('14-present-mt');
  await b.close();
  if(errs.length){console.error(errs.join('\n'));process.exit(1);}
  console.log('Level plans screenshots saved to',IMG);
})();
