// Captures the Create deal handoff screenshots from the live v3 prototype.
// Usage: NODE_PATH=<repo>/node_modules node docs/handoff/create-deal/capture.cjs [base url]
const {chromium}=require('@playwright/test');
const path=require('node:path');
const BASE=process.argv[2]||'http://127.0.0.1:4310';
const URL_=BASE+'/prototypes/v3/Bricly_OS_Prototype_v3.html';
const IMG=path.join(__dirname,'img');
(async()=>{
  const b=await chromium.launch(), p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const load=async()=>{await p.goto(URL_);await p.waitForTimeout(900);await p.addStyleTag({content:'#briclyToast{display:none!important}.hl{outline:3px solid #d97706!important;outline-offset:3px;border-radius:8px}'});};
  const shot=async(name,sel)=>{await p.waitForTimeout(250);if(sel) await p.locator(sel).first().screenshot({path:path.join(IMG,name+'.png')});else await p.screenshot({path:path.join(IMG,name+'.png')});console.log('shot',name);};
  const hl=async sel=>p.evaluate(s=>{document.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));const e=document.querySelector(s);e&&e.classList.add('hl');},sel);
  const D='#qaDrawer';
  const next=()=>p.locator('#dc-next').click();

  // A · entry points
  await load();
  await p.evaluate(()=>{curPersona='owner';go('deals');}); await hl('[data-aw-action="deal"]'); await shot('a1-deals-add-deal');
  await p.evaluate(()=>{curPersona='rep';openOpp('OPP-1006');}); await p.waitForTimeout(300);
  await p.evaluate(()=>{document.getElementById('cr-actions-menu').style.display='block';const b=[...document.querySelectorAll('#cr-actions-menu button')].find(x=>x.textContent.trim()==='Convert to deal');b.classList.add('hl');});
  await shot('a2-opportunity-convert');

  // B · Deals → existing opportunity → referral by a new agent (owner: goes live)
  await load();
  await p.evaluate(()=>{curPersona='owner';go('deals');}); await p.getByRole('button',{name:'+ Add deal'}).click();
  await shot('b1-buyer-step',D);
  await p.fill('#dc-q','Julia'); await shot('b2-buyer-search',D);
  await p.locator('#dc-opps .dc-row').first().click(); await shot('b3-sale-step',D);
  await p.locator('#dc-body').getByRole('radio',{name:'Bank loan'}).click();
  await p.locator('[data-k="deedTarget"]').fill('2026-12-15'); await p.locator('[data-k="loanBy"]').fill('2026-11-30');
  await p.evaluate(()=>document.querySelector('[data-k="deedTarget"]').scrollIntoView()); await shot('b4-sale-dates',D);
  await next(); await shot('b5-commission-default',D);
  await p.locator('.dc-toggle',{hasText:'Referral or shared deal'}).click(); await shot('b6-referral-search',D);
  await p.fill('#dc-ps-ref','Zara Newagent'); await p.locator('#dc-pr-ref .dc-row.add').click();
  await p.fill('#dc-pp-ref','+356 7999 1111'); await p.fill('#dc-pc-ref','Remax Sliema'); await shot('b7-referral-new-contact',D);
  await p.getByRole('button',{name:'Add & link'}).click(); await shot('b8-referral-linked',D);
  await p.locator('.dc-toggle',{hasText:'Split with a team member'}).click();
  await p.locator('.dc-team-row').nth(1).locator('select').selectOption({index:1});
  await p.evaluate(()=>document.getElementById('dc-break').scrollIntoView()); await shot('b9-team-split',D);
  await next(); await shot('b10-review-create',D);
  await next(); await p.waitForTimeout(500); await shot('b11-deal-created');
  await p.evaluate(()=>document.getElementById('df-sec-commission')?.scrollIntoView({block:'center'})); await shot('b12-deal-commission-card');

  // C · Deals → sale outside Bricly (rep: goes to approval)
  await load();
  await p.evaluate(()=>{curPersona='rep';go('deals');dcStart();}); await p.locator('.dc-alt').click(); await shot('c1-outside-sale',D);
  await p.fill('#dc-ps-buyer','Nora Outside'); await p.locator('#dc-pr-buyer .dc-row.add').click(); await p.fill('#dc-pp-buyer','+356 7911 2233'); await shot('c2-new-buyer',D);
  await p.getByRole('button',{name:'Add & link'}).click();
  const u=await p.evaluate(()=>[...document.querySelectorAll('#dc-body select')[1].options].find(o=>o.value&&!o.disabled).value);
  await p.locator('#dc-body select').nth(1).selectOption(u); await shot('c3-outside-sale-filled',D);
  await next(); await next(); await next(); await shot('c4-review-approval',D);
  await next(); await p.waitForTimeout(500); await shot('c5-deal-awaiting-approval');
  const req=await p.evaluate(()=>DEALS.at(-1).approvalReq);
  await p.evaluate(r=>{curPersona='manager';dcViewRequest(r);},req); await p.waitForTimeout(500); await shot('c6-approvals-queue');

  // D · Opportunity at an early stage → Convert to deal (POS signed outside Bricly)
  await load();
  await p.evaluate(()=>{curPersona='rep';openOpp('OPP-1006');dcOpenFromActions();}); await shot('d1-convert-early-stage',D);

  // E · Add a referral later from the deal page
  await load();
  const id=await p.evaluate(()=>{curPersona='manager';dcOpen('OPP-1003','actions');DCV.step=3;const d=dcCreate();openDeal(d.id);dfSplitOpen();return d.id;});
  await p.getByRole('button',{name:'+ Add referral'}).click();
  await p.locator('.dfs-row').last().locator('.dfs-name').selectOption('__new'); await p.locator('.dfs-nn').fill('Leo Referrer'); await shot('e1-split-new-contact',D);
  await p.locator('.dfs-row').last().getByRole('button',{name:'Add',exact:true}).click(); await shot('e2-split-referral-added',D);

  // F · Mobile
  await p.setViewportSize({width:390,height:844}); await load();
  await p.evaluate(()=>{curPersona='owner';go('deals');dcStart();dcPickOpp('OPP-1007');DCV.step=2;dcRender();dcPick('ref.on','yes');}); await shot('f1-mobile-commission');

  console.log('errors',JSON.stringify(errs)); await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
