// Captures the Buyer proposals handoff screenshots from the live v3 prototype.
// Usage: NODE_PATH=<repo>/node_modules node docs/handoff/buyer-proposals/capture.cjs [base url]
const {chromium}=require('@playwright/test');
const path=require('node:path'), fs=require('node:fs');
const BASE=process.argv[2]||'http://127.0.0.1:4310';
const CRM=BASE+'/prototypes/v3/Bricly_OS_Prototype_v3.html';
const BUYER=BASE+'/prototypes/v3/proposal/index.html';
const IMG=path.join(__dirname,'img');
fs.mkdirSync(IMG,{recursive:true});

(async()=>{
  const b=await chromium.launch(), errs=[];
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
  const shot=async(n,el)=>{await p.waitForTimeout(350);await (el||p).screenshot({path:path.join(IMG,n+'.png')});};
  const card=title=>p.locator('.st-card',{has:p.locator('h3',{hasText:new RegExp('^'+title+'$')})});
  const brand=()=>card('Brand');
  const hex=async(label,val)=>{const h=brand().locator('.pa-color',{hasText:label}).locator('.pa-hex');await h.fill(val);await h.press('Tab');};

  // ---------- admin: Settings › Proposal page ----------
  await p.goto(CRM); await p.waitForTimeout(700);
  await p.evaluate(()=>{localStorage.removeItem('bricly.proposal.std');localStorage.removeItem('bricly.proposal.issue');curPersona='owner';paOpenSettings();});
  await shot('a1-settings');
  await shot('a2-brand-company',brand());
  await brand().locator('.pa-bl',{hasText:'Dolphin Court'}).click();
  await hex('Secondary text','#D0D8DA');
  await shot('a3-brand-readability',brand());
  await p.evaluate(()=>document.getElementById('content').scrollTo(0,0)); await shot('a4-publish-blocked',p.locator('#pa-bar'));
  await hex('Secondary text','#4F5D63');
  await brand().locator('.pa-bl',{hasText:'Verdala'}).click(); await shot('a5-brand-inherit',brand());
  await shot('a6-sections',card('Sections'));
  for(const t of ['Investment figures','Reservations','Sending','Link and privacy']) await shot('a7-'+t.toLowerCase().replace(/\W+/g,'-'),card(t));
  await shot('a8-readiness',card('Development readiness'));
  await card('Link and privacy').locator('.pa-sw',{hasText:'Ask for a passcode'}).locator('input').click();
  await p.evaluate(()=>document.getElementById('content').scrollTo(0,0));
  await p.getByRole('button',{name:'Publish v2'}).click(); await shot('a9-publish-confirm');
  await p.locator('#qaDrawer').getByRole('button',{name:'Publish v2'}).click();
  await shot('a10-versions',card('Versions'));

  // ---------- rep: send ----------
  await p.evaluate(()=>openOpp('OPP-1001')); await p.waitForTimeout(500);
  await shot('r1-opportunity-banner',p.locator('.pa-ban'));
  await p.locator('.pa-ban').getByRole('button',{name:'Review and send'}).click();
  await p.selectOption('#pa-add','#CM1207'); await shot('r2-send-drawer');
  await p.locator('#qaDrawer').getByRole('button',{name:/Send on/}).click(); await p.waitForTimeout(300);

  // ---------- buyer ----------
  const bp=await ctx.newPage(); bp.on('pageerror',e=>errs.push(e.message));
  const bshot=async(n,el)=>{await bp.waitForTimeout(450);await (el||bp).screenshot({path:path.join(IMG,n+'.png')});};
  await bp.goto(BUYER+'?intro=1'); await bshot('b1-passcode');
  await bp.fill('#in-code','4821'); await bp.click('.in-gate button'); await bp.waitForTimeout(1000); await bshot('b2-intro');
  await bp.waitForTimeout(2600); await bshot('b3-cover');
  const full=await bp.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<full;y+=500){await bp.evaluate(y=>scrollTo(0,y),y);await bp.waitForTimeout(40);}
  for(const [n,s] of [['b4-letter','.letter'],['b5-selection','.selection'],['b9-compare-homes','.compare'],['b10-trust','.developer'],['b11-next-step','.next']]){
    await bp.locator(s).scrollIntoViewIfNeeded(); await bshot(n,bp.locator(s));
  }
  await bp.click('[data-cmp="devs"]'); await bshot('b9b-compare-developments',bp.locator('.compare'));
  await bp.locator('.selection').scrollIntoViewIfNeeded(); await bp.waitForTimeout(300); await bshot('b12-floating-button');
  await bp.click('.sel-dev[data-open="d-dolphin"]'); await bshot('b6-development-panel');
  await bp.click('.pn-sw [data-open="u-CM9802"]'); await bshot('b7-home-panel');
  for(const t of ['position','payment','investment']){await bp.click(`.pn-nav a[data-tab="${t}"]`);await bp.waitForTimeout(900);await bshot('b8-home-'+t);}
  await bp.click('.pn-f [data-reserve]'); await bshot('b13-reserve');
  await bp.click('#rs-send'); await bshot('b14-reserve-sent');
  await bp.click('#reserve .rs-done .btn'); await bp.click('[data-close]');
  await bp.evaluate(()=>{PROPOSAL_APP.state.reserved='CM9802';PROPOSAL_APP.state.requested.clear();PROPOSAL_APP.render();});
  await bp.locator('.next').scrollIntoViewIfNeeded(); await bshot('b15-next-reserved',bp.locator('.next'));

  // ---------- mobile ----------
  const m=await ctx.newPage(); await m.setViewportSize({width:390,height:844}); m.on('pageerror',e=>errs.push(e.message));
  await m.goto(BUYER+'?intro=1'); await m.waitForTimeout(400);
  if(await m.locator('#in-code').count()){await m.fill('#in-code','4821');await m.click('.in-gate button');}
  await m.waitForTimeout(3600); await m.screenshot({path:path.join(IMG,'m1-cover.png')});
  await m.evaluate(()=>PROPOSAL_APP.openPanel('u-CM9802')); await m.waitForTimeout(900); await m.screenshot({path:path.join(IMG,'m2-home-panel.png')});

  await b.close();
  if(errs.length){console.error(errs.join('\n'));process.exit(1);}
  console.log('Buyer proposals screenshots saved to',IMG);
})();
