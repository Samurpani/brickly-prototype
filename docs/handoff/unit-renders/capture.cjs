// Captures the Unit renders handoff screenshots from the live v3 prototype.
// Usage: NODE_PATH=<repo>/node_modules node docs/handoff/unit-renders/capture.cjs [base url]
const {chromium}=require('@playwright/test');
const fs=require('node:fs'), path=require('node:path');
const BASE=process.argv[2]||'http://127.0.0.1:4310';
const URL_=BASE+'/prototypes/v3/Bricly_OS_Prototype_v3.html';
const IMG=path.join(__dirname,'img'), ASSETS=path.join(__dirname,'../../../prototypes/v3/assets/present/');
const file=(src,name)=>({name,mimeType:'image/jpeg',buffer:fs.readFileSync(ASSETS+src)});
(async()=>{
  const b=await chromium.launch(), p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const shot=async n=>{await p.waitForTimeout(350);await p.screenshot({path:path.join(IMG,n+'.png')});};
  const D=p.locator('#de-drawer'), roomTop=r=>p.evaluate(r=>{const s=document.querySelector(`#de-drawer section[aria-label="${r} renders"]`);document.querySelector('#de-drawer .de-dbody').scrollTop=s.offsetTop-60;},r);
  await p.goto(URL_); await p.waitForTimeout(600);
  await p.evaluate(()=>{localStorage.removeItem('bricly.present.v3');curPersona='owner';deOpen('miami-tropic','finishes');
    const c=[...document.querySelectorAll('.de-card')].find(x=>/Interiors catalogue/.test(x.textContent));document.getElementById('content').scrollTop=c.offsetTop-80;});
  await shot('01-catalogue');
  await p.evaluate(()=>{DE.drawer={k:'pack',i:2};deRender();}); await shot('02-pack');
  await p.evaluate(()=>{DE.drawer=null;deGo('units');}); await shot('03-units');
  await p.evaluate(()=>{DE.drawer={k:'unit',id:'AP.3203',tab:'renders'};deRender();}); await shot('04-renders-tab');
  await p.getByLabel('Preview finish').selectOption('dusk'); await roomTop('Kitchen'); await shot('05-gap');
  await D.locator('section[aria-label="Kitchen renders"] input[type=file]').setInputFiles(file('miami/r-kitchen2.jpg','kitchen_dusk_coastal_2-bed.jpg'));
  await shot('06-tag-sheet');
  await p.getByRole('button',{name:'Add 1 render'}).click(); await roomTop('Kitchen'); await shot('07-added');
  await p.evaluate(()=>{const a=deDraft().assets.filter(x=>x.room==='kitchen'&&x.cat==='Render').pop();deAssetOpen(a.id);}); await shot('08-asset');
  await p.evaluate(()=>{DE.drawer={k:'unit',id:'AP.3203',tab:'views'};deRender();}); await shot('09-views');
  await p.evaluate(()=>{DE.drawer=null;deGo('uploads');});
  await p.locator('#p-devedit input[type=file]').first().setInputFiles([file('miami/r-bath.jpg','bathroom_sand_2-bed.jpg'),file('miami/r-living.jpg','living_stone_modern.jpg'),file('miami/r-detail.jpg','IMG_2231.jpg')]);
  await p.waitForTimeout(1400); await shot('10-bulk');
  await p.evaluate(()=>deGo('review')); await shot('11-review');
  await p.evaluate(()=>{deDraft().assets.forEach(a=>{if(a.img&&!a.alt.trim())a.alt='Detail';});deRender();}); await shot('11b-review-ready');
  await p.getByRole('button',{name:/^Publish v\d+/}).click(); await p.waitForTimeout(1200);
  await p.evaluate(()=>prOpen('AP.3203')); await p.waitForTimeout(900);
  await p.getByRole('tab',{name:'Renders'}).click(); await shot('12-present-renders');
  await p.getByRole('button',{name:'Layout, finish and style'}).click(); await shot('13-picker');
  await p.getByRole('dialog',{name:'Layout, finish and style'}).getByRole('button',{name:'Dusk'}).click();
  await p.keyboard.press('Escape'); await p.getByRole('button',{name:'Next room'}).click(); await shot('14-dusk-kitchen');
  await p.getByRole('button',{name:'Next room'}).click(); await p.getByRole('button',{name:'Next room'}).click(); await shot('15-fallback');
  await p.getByRole('tab',{name:'Views'}).click(); await shot('16-views');
  await p.getByRole('tab',{name:'Finishes'}).click(); await shot('17-finishes');
  await p.getByRole('button',{name:'Add to selection'}).click(); await p.getByRole('button',{name:'1 Selected'}).first().click(); await shot('18-selection');
  await p.evaluate(()=>{PV3.close();const d=deState(DEV('dolphin'));d.live.assets=d.live.assets.filter(a=>a.cat!=='Render'||!a.room);prOpen('#CM1207');});
  await p.waitForTimeout(900); await shot('19-no-renders');
  await b.close();
  if(errs.length){console.error(errs.join('\n'));process.exit(1);}
  console.log('Unit renders screenshots saved to',IMG);
})();
