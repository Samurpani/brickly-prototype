const {test,expect}=require('@playwright/test');
const ENTRY_URL='/prototypes/Bricly_OS_Prototype_v2.html';
const key='bricly.present.v1';
// Drawers duplicate the desktop panel. Never click the inert copy underneath.
const active=(page,selector)=>page.locator(`#pm-shell ${selector}:not([inert]):not([inert] *):visible`);
const button=(page,action,arg)=>active(page,`[data-pm="${action}"]${arg===undefined?'':`[data-arg="${arg}"]`}`).first();
const field=(page,name)=>active(page,`[data-field="${name}"]`).first();
const state=page=>page.evaluate(()=>PM.session);
async function screen(page,value){await expect.poll(async()=>(await state(page))?.last_screen).toBe(value);}
// Exercise the real sequential UI; never call start(), set session answers, or skip
// the preparing transition through an internal hook to make a regression pass.
async function questions(page,{lens,style,finish}={}){
  await expect.poll(async()=>['preflight','preferences','preparing','opening','showroom','portfolio'].includes((await state(page))?.last_screen)).toBe(true);
  const values={lens,style,finish},actions=['lens','stylePreference','finishPreference'];
  for(let n=0;n<3;n++){
    const s=await state(page);
    if(!['preflight','preferences'].includes(s.last_screen))break;
    const step=s.ui.questionStep,key=['lens','style','finish'][step];
    const value=values[key]===undefined?(key==='lens'?s.lens:s.preferences[key]):values[key];
    await expect(active(page,'.pm-question-glass h1')).toHaveCount(1);
    for(let other=0;other<3;other++)if(other!==step)await expect(active(page,`[data-pm="${actions[other]}"]`)).toHaveCount(0);
    await (value?button(page,actions[step],value):button(page,'skipQuestion')).click();
  }
}
async function development(page,id='dolphin'){
  await page.evaluate(id=>prOpenDev(id),id);
  await questions(page);await screen(page,'showroom');
  expect((await state(page)).ui.panel).toBe('units');
}
async function unit(page,id='#CM1201'){
  if((await state(page)).last_screen==='showroom'){
    if(!await button(page,'panel','units').isVisible())await button(page,'openPanel').click();
    await button(page,'panel','units').click();
  }
  await button(page,'unit',id).click();
  await screen(page,'unit');
}
async function shortDevelopment(page,id){
  if(!await button(page,'panel','overview').isVisible())await button(page,'openPanel').click();
  await button(page,'panel','overview').click();await button(page,'shortDev',id).click();
  if(await page.locator('#pm-shell [role="dialog"]').count())await button(page,'dismiss').click();
}
async function preferences(page,style,finish){
  await questions(page,{style,finish});
}
async function specification(page,id='#CM1201'){
  return page.evaluate(id=>{const i=PM.selection.items.find(i=>i.unit_id===id);return {config:i.config,price:i.configured_price};},id);
}
async function noLiveConfig(page){
  await expect(page.locator('#pm-shell [data-pm="layout"], #pm-shell [data-pm="pack"], #pm-shell [data-pm="preset"], #pm-shell [data-field="preset"], #pm-shell [data-field="style"]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Documents',exact:true})).toHaveCount(0);
  await expect(page.locator('#pm-shell [data-pm="media"][data-arg="documents"]')).toHaveCount(0);
}
async function checkout(page){await button(page,'end').click();await screen(page,'closing');await button(page,'ack').click();await screen(page,'checkout');}
async function prepare(page){await field(page,'name').fill('Present Test Buyer');await button(page,'prepare').click();await expect(button(page,'share')).toBeVisible();}
test.beforeEach(async({page})=>{
  page.errors=[];page.on('pageerror',e=>page.errors.push(e.stack || e.message));
  // Avoid external font-network nondeterminism in the local functional suite.
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto(ENTRY_URL);await expect.poll(()=>page.evaluate(()=>typeof PM)).toBe('object');
});
test.afterEach(async({page})=>{expect(page.errors).toEqual([]);});

test('visual preferences, unchanged specification, notes and hidden prices survive save and resume',async({page})=>{
  await development(page);await unit(page);
  const before=await specification(page);
  await noLiveConfig(page);await button(page,'preferences').click();await screen(page,'preferences');
  const style=await page.evaluate(()=>CR_STYLES[0].id);
  await preferences(page,style,'urban');await screen(page,'unit');
  expect(await specification(page)).toEqual(before);
  await button(page,'shortUnit','#CM1201').click();await button(page,'note','#CM1201').click();
  await field(page,'note').fill('Can the bedroom wall move?');await button(page,'dismiss').click();
  await button(page,'prices').click();expect(await page.locator('#pm-shell').innerText()).not.toContain('€');
  const config=await page.evaluate(()=>PM.selection.items[0]);expect(config.config).toEqual({layout:'architect',preset:'std',pack:'signature'});expect(config.visual_preference).toMatchObject({style,finish:'urban'});expect(config.visual_state).toBe('pending');
  await checkout(page);const id=(await state(page)).id;await button(page,'saveOnly').click();
  await page.reload();await page.evaluate(id=>PM.resume(id),id);await screen(page,'unit');
  expect(await page.evaluate(()=>PM.selection.items[0].request_note)).toBe('Can the bedroom wall move?');expect(await page.locator('#pm-shell').innerText()).not.toContain('€');
  expect((await state(page)).preferences).toMatchObject({style,finish:'urban'});expect(await specification(page)).toEqual(before);await noLiveConfig(page);
});
test('single-surface safety, Escape and empty anonymous closing',async({page})=>{
  await development(page);await button(page,'openPanel').click();
  await page.keyboard.press('Escape');await expect(page.locator('#pm-shell [role="dialog"]')).toHaveCount(0);await screen(page,'showroom');
  await page.evaluate(()=>{showToast('PRIVATE CRM NOTIFICATION');go('pipeline');openOpp('OPP-1001');});
  const privacy=await page.evaluate(()=>({inert:document.querySelector('.app').inert,visibility:getComputedStyle(document.querySelector('.app')).visibility,checkout:!!document.querySelector('#pm-shell [data-pm="prepare"]')}));
  expect(privacy).toEqual({inert:true,visibility:'hidden',checkout:false});
  await page.keyboard.press('Escape');await screen(page,'portfolio');await page.keyboard.press('Escape');await screen(page,'closing');
  expect(await page.locator('#pm-shell').innerText()).not.toContain('PRIVATE CRM');
  const before=await page.evaluate(()=>({opps:OPPS.length,contacts:CONTACTS.length}));
  await button(page,'ack').click();await button(page,'saveOnly').click();await expect(page.locator('#pm-shell')).toHaveCount(0);
  expect(await page.evaluate(()=>({opps:OPPS.length,contacts:CONTACTS.length}))).toEqual(before);
});
test('curated tour starts in showroom and widens without losing saved specifications',async({page})=>{
  await page.evaluate(()=>PM.presentDevelopments(['dolphin','mercury']));await questions(page,{lens:'investment'});await screen(page,'showroom');
  expect((await state(page)).ui).toMatchObject({dev:'dolphin',panel:'units',tour:['dolphin','mercury']});
  await shortDevelopment(page,'dolphin');await unit(page);await button(page,'shortUnit','#CM1201').click();
  const before=await specification(page),id=(await state(page)).id;
  await button(page,'portfolio').click();await screen(page,'portfolio');
  const count=await page.evaluate(()=>DEVS.filter(d=>UNITS.some(u=>u.dev===d.name&&u.status==='available')).length);
  await expect(page.locator('#pm-shell .pm-select-card')).toHaveCount(count);expect((await state(page)).id).toBe(id);
  await button(page,'beginTour').click();await screen(page,'showroom');
  await button(page,'nextDevelopment').click();await screen(page,'showroom');expect((await state(page)).ui.dev).toBe('mercury');await shortDevelopment(page,'mercury');
  await button(page,'shortlist').click();await button(page,'shortView','developments').click();
  await screen(page,'shortlist');await expect(page.locator('#pm-shell [role="dialog"]')).toHaveCount(0);
  await field(page,'compareDev.dolphin').check();await field(page,'compareDev.mercury').check();await button(page,'openComparison','developments').click();await screen(page,'compare');
  expect((await state(page)).ui.compareMode).toBe('developments');await expect(page.locator('#pm-shell .pm-table')).toContainText('Est. gross yield (demo)');expect(await specification(page)).toEqual(before);
});
test('new v2 Compare stays intact, inherits lens and keeps five selections',async({page})=>{
  const imported=await page.evaluate(()=>{
    trState.items=['#CM1201','#CM1203','#CM1204','#CM1207','#CM1210'].map((unitId,n)=>({unitId,config:{layout:n===0?'open-kitchen':'architect',preset:'std',pack:n===0?'urban':'signature',style:null,modifier:''}}));
    trSave();cmpOpen();cmpSetLens('investor');return {items:trState.items,total:cmpBaseTotal()};
  });
  // Five base prices total €2.1m; imported open-kitchen (€6k) + Urban Dark (€8k).
  expect(imported.total).toBe(2114000);
  await expect(page.locator('#cmp.on .cmp-cols .cmp-col')).toHaveCount(5);
  await page.getByRole('button',{name:'Present live',exact:true}).click();
  await screen(page,'compare');
  expect((await state(page)).lens).toBe('investment');expect(await page.evaluate(()=>PM.selection.items.length)).toBe(5);expect((await state(page)).ui.compare.length).toBe(4);
  const before=await specification(page);expect(before).toEqual({config:{layout:'open-kitchen',preset:'std',pack:'urban'},price:329000});
  await unit(page);await noLiveConfig(page);await button(page,'preferences').click();await screen(page,'preferences');
  await questions(page,{finish:'signature'});await screen(page,'unit');
  expect(await specification(page)).toEqual(before);await button(page,'back').click();await screen(page,'compare');
  await checkout(page);await button(page,'saveOnly').click();await expect(page.locator('#cmp.on')).toBeVisible();
  expect(await page.locator('#cmp-body').innerText()).toContain('Urban Dark');expect(await page.evaluate(()=>cmpBaseTotal())).toBe(imported.total);
  expect(await page.evaluate(()=>trState.items)).toEqual(imported.items);
});
test('copy is not a send, local preview is read-only and Custom Pack receives notes',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await development(page);await unit(page);const before=await specification(page);
  const style=await page.evaluate(()=>{const p=CR_PACK('signature');const st=CR_STYLES.find(st=>!p.styles.includes(st.id));return {id:st.id,name:st.name};});
  await button(page,'preferences').click();await preferences(page,style.id,'urban');await screen(page,'unit');
  await button(page,'shortUnit','#CM1201').click();
  await button(page,'note','#CM1201').click();await field(page,'note').fill('Move bedroom wall');await button(page,'dismiss').click();await button(page,'prices').click();
  expect(await specification(page)).toEqual(before);
  await checkout(page);await prepare(page);await button(page,'share').click();await button(page,'copy').click();await screen(page,'ready');
  expect(await page.locator('#pm-shell').innerText()).toContain('Copied only');
  const info=await page.evaluate(()=>({url:new URL('#shortlist='+PM.session.ui.output,location.href).href,raw:localStorage.getItem('bricly.present.v1'),opp:PM.session.opportunity_id,contact:CONTACTS.find(c=>c.id===PM.session.contact_id)}));
  expect(info.contact.phone).toBe('');expect(info.contact.email).toBe('');expect(info.contact.consent.wa).toBe(false);
  const previewPage=await context.newPage();await previewPage.goto(info.url);await expect(previewPage.locator('#pm-shell h1')).toContainText('places');
  expect(await previewPage.locator('#pm-shell').innerText()).not.toContain('€');await expect(previewPage.locator('#pm-shell')).toContainText('Move bedroom wall');
  await noLiveConfig(previewPage);await expect(previewPage.locator('#pm-shell input, #pm-shell select, #pm-shell textarea, #pm-shell [data-pm="note"], #pm-shell [data-pm="preferences"], #pm-shell [data-pm="shortUnit"]')).toHaveCount(0);
  expect(await previewPage.evaluate(()=>localStorage.getItem('bricly.present.v1'))).toBe(info.raw);await previewPage.close();
  await button(page,'followup').click();await expect(page.locator('#p-crwiz.on')).toBeVisible();
  const pack=await page.evaluate(()=>({step:crState.step,cfg:crState.cfg['#CM1201'],mode:crState.priceMode,prefs:crState.presentPreferences,allowed:CR_PACK(crState.cfg['#CM1201'].pack).styles,price:crPrice('#CM1201')}));
  expect(pack).toMatchObject({step:2,cfg:before.config,mode:'request',prefs:{style:style.id,finish:'urban'},price:before.price});
  expect(pack.allowed).toContain(pack.cfg.style);expect(pack.cfg.style).not.toBe(style.id);
  expect(pack.cfg.modifier).toContain('Move bedroom wall');expect(pack.cfg.modifier).toContain(style.name);
  expect(pack.cfg.modifier).toContain('Preferred finish for review: Urban Dark');expect(pack.cfg.modifier).toContain('not applied to specification or price');
});
test('inventory updates remove actionable units and invalidate prepared output',async({page,context})=>{
  await development(page);await unit(page);await button(page,'shortUnit','#CM1201').click();await checkout(page);await prepare(page);
  const other=await context.newPage();await other.goto(ENTRY_URL);await other.evaluate(()=>PM.simulateInventory('#CM1201','sold'));
  await expect.poll(()=>page.evaluate(()=>PM.session.ui.output)).toBeNull();
  expect(await page.locator('#pm-shell').innerText()).toContain('Excluded from deliverables');await expect(button(page,'prepare')).toBeDisabled();
  expect(await page.evaluate(()=>PM.selection.items[0].is_shortlisted)).toBe(true);await other.close();
});
test('existing Custom Pack draft is not overwritten by follow-up',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await development(page);await unit(page);await button(page,'shortUnit','#CM1201').click();await checkout(page);await prepare(page);await button(page,'share').click();await button(page,'copy').click();await screen(page,'ready');
  const oid=await page.evaluate(()=>{const o=OPPS.find(o=>o.id===PM.session.opportunity_id);const d=crFreshState(o);d.unitIds=['#CM1203'];d.cfg={'#CM1203':crMkCfg('#CM1203')};d.marker='keep-me';getExt(o).crDraft=d;return o.id;});
  await button(page,'followup').click();await expect(page.getByRole('dialog',{name:'A Custom Pack draft already exists'})).toBeVisible();await button(page,'keepDraft').click();
  expect(await page.evaluate(id=>getExt(OPPS.find(o=>o.id===id)).crDraft.marker,oid)).toBe('keep-me');await expect(page.locator('#pm-shell')).toHaveCount(0);
});
test('iPad portrait drawers, reduced motion and no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:834,height:1194});await development(page);await unit(page);const before=await specification(page);
  await button(page,'config').click();await expect(page.getByRole('dialog',{name:'Residence details'})).toBeVisible();await noLiveConfig(page);
  await expect(page.getByRole('dialog',{name:'Residence details'})).toContainText('Saved specification');
  await page.keyboard.press('Escape');await screen(page,'unit');await expect(page.locator('#pm-shell [role="dialog"]')).toHaveCount(0);
  expect(await specification(page)).toEqual(before);expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(()=>({viewport:innerWidth,width:document.querySelector('#pm-shell').scrollWidth}))).toEqual({viewport:834,width:834});
  await button(page,'end').click();await screen(page,'closing');await expect(button(page,'ack')).toBeVisible();
});
test('development-list entry supports a curated selection',async({page})=>{
  await page.evaluate(()=>go('developments'));
  await page.getByRole('checkbox',{name:'Select Dolphin Court',exact:true}).check();await page.getByRole('checkbox',{name:'Select Mercury',exact:true}).check();
  await page.getByRole('button',{name:'Present 2 developments',exact:true}).click();await screen(page,'preflight');expect((await state(page)).scope.ids).toEqual(['dolphin','mercury']);
  await questions(page);await screen(page,'showroom');expect((await state(page)).ui).toMatchObject({dev:'dolphin',panel:'units'});
  await button(page,'portfolio').click();await button(page,'tourReorder','mercury:-1').click();expect((await state(page)).ui.tour).toEqual(['mercury','dolphin']);
  await button(page,'beginTour').click();await screen(page,'showroom');expect((await state(page)).ui).toMatchObject({dev:'mercury',panel:'units'});
});

test('linked entry with saved preferences skips preflight and unavailable units are read-only',async({page})=>{
  await page.evaluate(()=>{getExt(OPPS.find(o=>o.id==='OPP-1009')).presentPreferences={style:CR_STYLES[0].id,finish:'urban',lens:'relocation'};PM.presentOpportunity('OPP-1009');});await screen(page,'showroom');
  expect((await state(page)).opportunity_id).toBe('OPP-1009');
  expect((await state(page)).lens).toBe('relocation');expect((await state(page)).preferences.finish).toBe('urban');
  if(!await button(page,'panel','units').isVisible())await button(page,'openPanel').click();
  await button(page,'panel','units').click();await field(page,'filter.unavailable').check();
  await unit(page,'#CM9611');await noLiveConfig(page);
  await expect(button(page,'shortUnit','#CM9611')).toBeDisabled();await expect(page.locator('#pm-shell')).toContainText('Sold · For reference only.');
});

test('clipboard failure never records a successful copy or send',async({page})=>{
  await development(page);await unit(page);await button(page,'shortUnit','#CM1201').click();await checkout(page);await prepare(page);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Denied'))}}));
  await button(page,'share').click();await button(page,'copy').click();
  await expect(page.locator('#pm-shell [role="status"]')).toContainText('Clipboard access was denied');
  expect((await state(page)).ui.shared).toBeNull();
  expect(await page.evaluate(()=>getExt(OPPS.find(o=>o.id===PM.session.opportunity_id)).comms.some(e=>e.presentKey?.endsWith(':copy')))).toBe(false);
});

test('dark iPad landscape supports development-only shortlist and output',async({page})=>{
  await page.setViewportSize({width:1194,height:834});await page.evaluate(()=>document.documentElement.dataset.theme='dark');await development(page);
  await shortDevelopment(page,'dolphin');await noLiveConfig(page);
  await button(page,'nextDevelopment').click();await screen(page,'shortlist');await expect(page.locator('#pm-shell [role="dialog"]')).toHaveCount(0);
  await checkout(page);await prepare(page);await button(page,'preview').click();await screen(page,'preview');
  expect(await page.locator('#pm-shell').innerText()).toContain('Development interest');
  const width=await page.evaluate(()=>document.querySelector('#pm-shell').scrollWidth);expect(width).toBe(1194);
  expect(await page.evaluate(()=>getComputedStyle(document.querySelector('#pm-shell')).backgroundColor)).toBe('rgb(20, 20, 19)');
});

test('preflight preferences change visuals only, including imported canonical specification and total',async({page})=>{
  const style=await page.evaluate(()=>{
    const o=OPPS.find(o=>o.id==='OPP-1009');o.devs=['Dolphin Court'];o.units=['#CM1201'];
    const x=getExt(o);delete x.presentPreferences;
    x.unitConfigs={'#CM1201':{layout:'open-kitchen',preset:'std',pack:'urban'}};
    PM.presentOpportunity(o.id);return CR_STYLES[0].id;
  });
  await screen(page,'preflight');const before=await specification(page);
  expect(before).toEqual({config:{layout:'open-kitchen',preset:'std',pack:'urban'},price:329000});
  await preferences(page,style,'signature');
  expect(await specification(page)).toEqual(before);
  expect((await state(page)).preferences).toMatchObject({style,finish:'signature'});
  await screen(page,'showroom');await unit(page);
  await noLiveConfig(page);expect(await specification(page)).toEqual(before);
  await button(page,'shortlist').click();await screen(page,'shortlist');
  const total=await page.evaluate(()=>fmtEur(PM.selection.items.filter(i=>i.is_shortlisted).reduce((n,i)=>n+i.configured_price,0)));
  await expect(page.locator('#pm-shell .pm-note').filter({hasText:'Combined configured price'})).toContainText(total);
});

test('portfolio multiselect, reorder and filters retain the ordered tour across both views',async({page})=>{
  await page.evaluate(()=>PM.presentDevelopments([]));await questions(page);await screen(page,'portfolio');
  await expect(button(page,'beginTour')).toBeDisabled();
  await button(page,'toggleDev','dolphin').click();await button(page,'toggleDev','mercury').click();
  expect((await state(page)).ui.tour).toEqual(['dolphin','mercury']);
  await button(page,'tourReorder','mercury:-1').click();
  await field(page,'filter.dev').selectOption('dolphin');
  await expect(page.locator('#pm-shell .pm-select-card[data-arg="mercury"]')).toHaveCount(0);
  expect((await state(page)).ui.tour).toEqual(['mercury','dolphin']);
  await expect(page.locator('#pm-shell .pm-tour-chip')).toHaveCount(2);
  await button(page,'resetFilters').click();
  await expect(page.locator('#pm-shell .pm-select-card[data-arg="mercury"]')).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>PMMap.load())).toBe(true);
  await button(page,'portfolioView','map').click();
  await expect(page.locator('#pm-shell .pm-map-result[data-arg="mercury"]')).toHaveAttribute('aria-pressed','true');
  await button(page,'portfolioView','collection').click();
  expect((await state(page)).scope.order).toEqual(['mercury','dolphin']);
  await button(page,'beginTour').click();await screen(page,'showroom');
  expect((await state(page)).ui).toMatchObject({dev:'mercury',panel:'units',tour:['mercury','dolphin']});
  await expect(page.getByRole('navigation',{name:'Presentation progress'})).toContainText('Development 1 of 2');
  await button(page,'portfolio').click();await screen(page,'portfolio');
  expect((await state(page)).ui.tour).toEqual(['mercury','dolphin']);
});

test('map awaits local geometry and pin/legend selections stay in sync with the collection',async({page})=>{
  const geometryResponse=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/vendor/malta-geo.json'));
  await page.reload();const response=await geometryResponse;
  expect(response.ok()).toBe(true);expect(new URL(response.url()).origin).toBe(new URL(page.url()).origin);
  expect(await page.evaluate(()=>PMMap.load())).toBe(true);
  await page.evaluate(()=>PM.presentDevelopments([]));await questions(page);await screen(page,'portfolio');
  await button(page,'portfolioView','map').click();
  const paths=page.locator('#pm-shell .pm-map-land path');
  expect(await paths.count()).toBeGreaterThan(0);
  for(const d of await paths.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('d')))){
    expect(d).toMatch(/^M/);expect(d).not.toMatch(/NaN|Infinity|undefined/);
  }
  const pin=page.locator('#pm-shell .pm-map-pin[data-arg="dolphin"]');
  await expect(pin).toBeVisible();await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#pm-shell .pm-map-result[data-arg="dolphin"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#pm-shell .pm-map-result[data-arg="mercury"]').click();
  expect((await state(page)).ui.tour).toEqual(['dolphin','mercury']);
  await expect(page.locator('#pm-shell .pm-map-attribution')).toContainText('OpenStreetMap');
  await button(page,'portfolioView','collection').click();
  await expect(page.locator('#pm-shell .pm-select-card[data-arg="dolphin"]')).toHaveAttribute('aria-pressed','true');
  await button(page,'beginTour').click();await screen(page,'showroom');
  await button(page,'media','location').click();
  await expect(page.locator('#pm-shell .nb-geography')).toBeVisible();
  await expect(page.locator('#pm-shell .pm-neighbourhood-stage [data-pm="toggleDev"], #pm-shell .pm-map-land')).toHaveCount(0);
  await expect(page.locator('#pm-shell .nb-disclaimer')).toHaveText('Illustrative neighbourhood · demo places, not real locations or routes');
  await expect(page.locator('#pm-shell .nb-pin[data-arg="development"]')).toHaveAttribute('aria-pressed','true');await noLiveConfig(page);
});

test('two developments progress sequentially into fullscreen shortlist and one switchable compare screen',async({page})=>{
  await page.evaluate(()=>PM.presentDevelopments(['dolphin','mercury']));await questions(page,{lens:'investment'});await screen(page,'showroom');
  const sessionId=(await state(page)).id;
  const progress=page.getByRole('navigation',{name:'Presentation progress'});
  await expect(progress).toContainText('Development 1 of 2');await noLiveConfig(page);
  await shortDevelopment(page,'dolphin');await unit(page);await button(page,'shortUnit','#CM1201').click();
  await expect(progress).toBeVisible();await button(page,'nextDevelopment').click();await screen(page,'showroom');
  expect((await state(page)).ui).toMatchObject({dev:'mercury',panel:'units'});await expect(progress).toContainText('Development 2 of 2');
  await shortDevelopment(page,'mercury');
  const mercuryUnit=await page.evaluate(()=>UNITS.find(u=>u.dev===DEV('mercury').name&&u.status==='available').id);
  await unit(page,mercuryUnit);await button(page,'shortUnit',mercuryUnit).click();
  await button(page,'nextDevelopment').click();await screen(page,'shortlist');
  await expect(page.locator('#pm-shell [role="dialog"]')).toHaveCount(0);await expect(progress).toBeVisible();
  await expect(page.locator('#pm-shell h1')).toContainText('places');
  await field(page,'compareUnit.#CM1201').check();await field(page,'compareUnit.'+mercuryUnit).check();
  await button(page,'openComparison','units').click();await screen(page,'compare');
  expect((await state(page)).ui.compareMode).toBe('units');
  await expect(page.locator('#pm-shell .pm-table thead')).toContainText('Dolphin Court');await expect(page.locator('#pm-shell .pm-table thead')).toContainText('Mercury');
  await expect(page.locator('#pm-shell .pm-table')).toContainText('#CM1201');await expect(page.locator('#pm-shell .pm-table')).toContainText(mercuryUnit);
  await button(page,'compareMode','developments').click();await screen(page,'compare');
  expect((await state(page)).ui.compareMode).toBe('developments');await expect(page.locator('#pm-shell .pm-table')).toContainText('Est. gross yield (demo)');
  await button(page,'preferences').click();await screen(page,'preferences');await questions(page,{lens:'relocation'});await screen(page,'compare');
  expect((await state(page)).ui.compareMode).toBe('developments');await expect(page.locator('#pm-shell .pm-table')).toContainText('Schools');
  await button(page,'compareMode','units').click();await screen(page,'compare');
  await expect(page.locator('#pm-shell .pm-table')).toContainText('Configured price');
  expect((await state(page)).id).toBe(sessionId);expect((await state(page)).ui.visited).toEqual(['dolphin','mercury']);
  await checkout(page);await expect(button(page,'prepare')).toBeVisible();
});

for(const buyer of [
  {label:'unknown',buyerType:'',tags:[],lens:'general'},
  {label:'explicit buyer type',buyerType:'Relocation',tags:[],lens:'relocation'},
  {label:'known investor tag',buyerType:'',tags:['Investor'],lens:'investment'},
])test(`${buyer.label} without saved presentation preferences still requires preflight`,async({page})=>{
  await page.evaluate(buyer=>{
    const o=OPPS.find(o=>o.id==='OPP-1009');o.buyerType=buyer.buyerType;o.tags=buyer.tags;
    delete getExt(o).presentPreferences;PM.presentOpportunity(o.id);
  },buyer);
  await screen(page,'preflight');
  expect((await state(page)).lens).toBe(buyer.lens);expect((await state(page)).ui.preferencesSet).toBe(false);
  expect((await state(page)).preferences).toMatchObject({style:'',finish:''});
  await questions(page);await screen(page,'showroom');
});

test('legacy saved session migrates missing presentation fields and old compare route idempotently',async({page})=>{
  await development(page);await unit(page);await button(page,'shortUnit','#CM1201').click();
  const before=await specification(page),id=(await state(page)).id;
  await checkout(page);await button(page,'saveOnly').click();await expect(page.locator('#pm-shell')).toHaveCount(0);
  // Mutate only this test context's saved fixture after closing, so beforeunload cannot overwrite it.
  await page.evaluate(({key,id})=>{
    const saved=JSON.parse(localStorage.getItem(key)),session=saved.sessions[id];
    delete session.preferences;
    for(const name of ['tour','portfolioView','compareMode','preferencesSet'])delete session.ui[name];
    session.scope={type:'developments',ids:['dolphin','mercury'],order:['mercury','dolphin']};
    session.ui.visited=['dolphin','mercury'];session.ui.compareDevs=['dolphin','mercury'];session.ui.media='documents';
    session.last_screen='devcompare';session.last_buyer_screen='devcompare';
    saved.selections[session.selection_id].items.forEach(i=>delete i.visual_preference);
    delete saved.inventory;localStorage.setItem(key,JSON.stringify(saved));
  },{key,id});
  await page.reload();await page.evaluate(id=>PM.resume(id),id);await screen(page,'compare');
  const migrated=await state(page);
  expect(migrated.preferences).toEqual({style:'',finish:''});expect(migrated.last_buyer_screen).toBe('compare');
  expect(migrated.ui).toMatchObject({tour:['mercury','dolphin'],portfolioView:'collection',compareMode:'developments',media:'exterior'});
  expect(await specification(page)).toEqual(before);await noLiveConfig(page);
  await expect(page.locator('#pm-shell [role="status"]')).toHaveCount(0);
  await page.reload();await page.evaluate(id=>PM.resume(id),id);await screen(page,'compare');
  expect((await state(page)).ui.tour).toEqual(migrated.ui.tour);expect(await specification(page)).toEqual(before);
  await button(page,'preferences').click();await questions(page,{finish:'urban'});await screen(page,'compare');
  expect(await specification(page)).toEqual(before);
});

test('compatible visual style passes to Custom Pack without changing the saved pack',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);await development(page);await unit(page);
  const before=await specification(page),style=await page.evaluate(()=>CR_PACK('signature').styles[1]);
  await button(page,'preferences').click();await preferences(page,style,'urban');await screen(page,'unit');
  await button(page,'shortUnit','#CM1201').click();await checkout(page);await prepare(page);
  await button(page,'share').click();await button(page,'copy').click();await screen(page,'ready');await button(page,'followup').click();
  await expect(page.locator('#p-crwiz.on')).toBeVisible();
  expect(await page.evaluate(()=>({cfg:crState.cfg['#CM1201'],prefs:crState.presentPreferences,price:crPrice('#CM1201')}))).toMatchObject({cfg:{...before.config,style},prefs:{style,finish:'urban'},price:before.price});
});

// Approval metadata below belongs only to generated test SVGs in isolated browser contexts.
// No production asset, registry, or file is marked approved by these tests.
const fixtureSvg='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#77806b"/><text x="40" y="80">ISOLATED PRESENT TEST FIXTURE</text></svg>';
const fixtureUrl='/__present_test_assets__/approved-project.svg';

test('only explicitly approved matching project assets satisfy visual preferences; no match uses honest fallback',async({page})=>{
  await page.route('**/__present_test_assets__/*.svg',route=>route.fulfill({contentType:'image/svg+xml',body:fixtureSvg}));
  const prefs=await page.evaluate(url=>{
    const style=CR_STYLES[0].id,otherStyle=CR_STYLES[1].id;
    const match={development_id:'dolphin',kind:'interior',style,finish:'urban',approved:true,url};
    window.PM_PROJECT_ASSETS=[
      {...match,approved:false,url:url+'?unapproved'},
      {...match,style:otherStyle,url:url+'?wrong-style'},
      {...match,finish:'signature',url:url+'?wrong-finish'},
      {...match,development_id:'mercury',url:url+'?wrong-development'},
      {...match,kind:'exterior',url:url+'?wrong-kind'},
      match,
    ];
    prOpenDev('dolphin');return {style,otherStyle};
  },fixtureUrl);
  await preferences(page,prefs.style,'urban');await screen(page,'showroom');
  await button(page,'media','interiors').click();
  const image=page.locator('#pm-shell .pm-project-images img').first();
  await expect(image).toHaveAttribute('src',fixtureUrl);
  await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await expect(page.locator('#pm-shell .pm-project-images figure').first()).toContainText('Approved project imagery · not a unit specification');
  await expect(page.locator('#pm-shell .pm-project-images img[src*="?"]')).toHaveCount(0);
  // Removing the sole eligible fixture must not promote any near-match or unapproved fixture.
  await page.evaluate(()=>{window.PM_PROJECT_ASSETS=window.PM_PROJECT_ASSETS.slice(0,-1);});
  await button(page,'media','exterior').click();await button(page,'media','interiors').click();
  const original=await page.evaluate(()=>{const d=DEV('dolphin');return UN_ASSET+(d.media?.renders?.int?.[0]?.img||d.media?.renders?.ext?.[0]?.img||d.photo);});
  await expect(image).toHaveAttribute('src',original);
  await expect(page.locator('#pm-shell .pm-project-images figure').first()).toContainText('Preferred project visual unavailable · Original project imagery · not a configured unit visual');
  await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  expect((await state(page)).preferences).toMatchObject({style:prefs.style,finish:'urban'});await noLiveConfig(page);
  await unit(page);expect((await specification(page)).config.pack).toBe('signature');
  expect(await page.evaluate(()=>PM.selection.items[0].visual_state)).toBe('pending');
});

test('an approved project fixture with a failed image falls back to the project cover',async({page})=>{
  await page.route('**/__present_test_assets__/broken.svg',route=>route.fulfill({status:404,body:'Missing test fixture'}));
  await page.evaluate(()=>{window.PM_PROJECT_ASSETS=[{development_id:'dolphin',kind:'interior',approved:true,url:'/__present_test_assets__/broken.svg'}];});
  await development(page);await button(page,'media','interiors').click();
  const image=page.locator('#pm-shell .pm-project-images img').first(),cover=await page.evaluate(()=>UN_ASSET+DEV('dolphin').photo);
  await expect(image).toHaveAttribute('src',cover);await expect(image).toBeVisible();
  await expect(page.locator('#pm-shell .pm-project-images figure').first()).toContainText('Requested image unavailable · showing project exterior');
  await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);await noLiveConfig(page);
});

test('primary hover stays readable and legacy wrap padding does not inflate controls',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>prOpenDev('dolphin'));
  await button(page,'introContinue').hover();
  await expect.poll(()=>button(page,'introContinue').evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}))).toEqual({background:'rgb(101, 122, 50)',color:'rgb(250, 249, 247)'});
  await button(page,'introContinue').click();await questions(page);await screen(page,'showroom');
  await button(page,'portfolio').click();await screen(page,'portfolio');
  const rows=await page.locator('#pm-shell .pm-row.wrap').evaluateAll(els=>els.map(el=>({padding:getComputedStyle(el).padding,margin:getComputedStyle(el).margin})));
  expect(rows.length).toBeGreaterThan(0);rows.forEach(row=>expect(row).toEqual({padding:'0px',margin:'0px'}));
});

test('map failure retains selectable development list and tour navigation',async({page})=>{
  await page.route('**/vendor/malta-geo.json',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.reload();expect(await page.evaluate(()=>PMMap.load())).toBe(false);
  await page.evaluate(()=>PM.presentDevelopments([]));await questions(page);await screen(page,'portfolio');
  await button(page,'portfolioView','map').click();await expect(page.locator('#pm-shell .pm-map-fallback')).toContainText('Map unavailable');
  await page.locator('#pm-shell .pm-map-result[data-arg="dolphin"]').click();
  await button(page,'beginTour').click();await screen(page,'showroom');expect((await state(page)).ui.dev).toBe('dolphin');
});

test('cancelled linked setup does not mark unanswered preferences as known',async({page})=>{
  await page.evaluate(()=>{const o=OPPS.find(o=>o.id==='OPP-1009');delete getExt(o).presentPreferences;PM.presentOpportunity(o.id);});
  await screen(page,'preflight');await page.keyboard.press('Escape');await screen(page,'closing');await button(page,'ack').click();await button(page,'saveOnly').click();
  expect(await page.evaluate(()=>getExt(OPPS.find(o=>o.id==='OPP-1009')).presentPreferences)).toBeUndefined();
  await page.evaluate(()=>PM.presentOpportunity('OPP-1009'));await screen(page,'preflight');
});

test('portfolio development filter does not hide residences in the next tour stop',async({page})=>{
  await page.evaluate(()=>PM.presentDevelopments([]));await questions(page);await screen(page,'portfolio');
  await button(page,'toggleDev','dolphin').click();await button(page,'toggleDev','mercury').click();
  await field(page,'filter.dev').selectOption('dolphin');await button(page,'beginTour').click();await screen(page,'showroom');
  await button(page,'nextDevelopment').click();await screen(page,'showroom');expect((await state(page)).ui.dev).toBe('mercury');
  await unit(page,'#CM2701');await screen(page,'unit');
});

test('mobile full-screen shortlist and map stay within viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});await development(page);
  await shortDevelopment(page,'dolphin');await button(page,'shortlist').click();await screen(page,'shortlist');
  expect(await page.evaluate(()=>document.querySelector('#pm-shell').scrollWidth)).toBe(390);
  await button(page,'portfolio').click();await button(page,'portfolioView','map').click();
  expect(await page.evaluate(()=>PMMap.load())).toBe(true);
  expect(await page.evaluate(()=>document.querySelector('#pm-shell').scrollWidth)).toBe(390);
});

async function unitFixtures(page){
  await page.route('**/__present_test_assets__/**',route=>route.fulfill({contentType:'image/svg+xml',body:fixtureSvg}));
  return page.evaluate(()=>{
    const [style,otherStyle]=CR_PACK('signature').styles;
    const url=name=>'/__present_test_assets__/'+name+'.svg';
    const base={approved:true,development_id:'dolphin',unit_id:'#CM1201',layout:'architect',preset:'std',pack:'signature',style};
    const living={...base,room:'Living room',caption:'Fixture living room',url:url('living')};
    const bedroom={...base,room:'Bedroom',caption:'Fixture bedroom',url:url('bedroom')};
    window.PM_ASSETS=[
      {...living,approved:false,url:url('unapproved')},
      {...living,unit_id:'#CM1203',url:url('wrong-unit')},
      {...living,development_id:'mercury',url:url('wrong-development')},
      {...living,pack:'urban',url:url('wrong-pack')},
      {...living,preset:'nonexistent',url:url('wrong-preset')},
      living,bedroom,
      {...living,style:otherStyle,url:url('living-other-style')},
      {...bedroom,style:otherStyle,url:url('bedroom-other-style')},
      {...living,layout:'open-kitchen',style:otherStyle,url:url('living-open')},
      {...bedroom,layout:'open-kitchen',style:otherStyle,url:url('bedroom-open')},
    ];
    window.PM_PLANS=[
      {...base,approved:false,url:url('unapproved-plan')},
      {...base,unit_id:'#CM1203',url:url('other-unit-plan')},
      {...base,layout:'open-kitchen',url:url('alternative-plan')},
      {...base,url:url('saved-plan'),caption:'Fixture saved specification plan',northBearing:25},
    ];
    return {style,otherStyle,living:living.url,bedroom:bedroom.url,otherBedroom:url('bedroom-other-style'),openBedroom:url('bedroom-open'),plan:url('saved-plan')};
  });
}
const viewer=page=>page.locator('#pm-shell .pm-viewer');
const viewerButton=(page,name)=>viewer(page).getByRole('button',{name,exact:true});
async function viewerImage(page,url){await expect(viewer(page).locator('.pm-viewer-media img')).toHaveJSProperty('src',new URL(url,page.url()).href);}
async function planReady(page){
  await expect(viewer(page)).toBeVisible();
  await expect(viewerButton(page,'Draw mode (D)')).toBeEnabled();
}
async function drawMark(page){
  await viewerButton(page,'Draw mode (D)').click();
  const box=await page.locator('#pm-shell .pm-viewer-stage').boundingBox();
  const start={x:box.x+box.width/2,y:box.y+box.height/2};
  await page.mouse.move(start.x,start.y);await page.mouse.down();
  await page.mouse.move(start.x+45,start.y+25,{steps:5});await page.mouse.up();
  return start;
}

test('company intro shows one question at a time, auto-advances and prepares before default Units',async({page})=>{
  await page.clock.install({time:new Date('2026-09-10T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-09-10T12:00:01Z'));
  await page.evaluate(()=>{window.PM_COMPANY={name:'Fixture Developer Company',tagline:'Fixture company introduction'};prOpenDev('dolphin');});
  await screen(page,'intro');await expect(page.locator('#pm-shell h1')).toHaveText('A new way to find your place.');
  await expect(page.locator('#pm-shell .pm-company-brand')).toContainText('Fixture Developer Company');
  await expect(page.locator('#pm-shell')).not.toContainText('Dolphin Court');
  await button(page,'introContinue').click();await screen(page,'preflight');
  const choiceActions=['lens','stylePreference','finishPreference'];
  for(let step=0;step<3;step++){
    expect((await state(page)).ui.questionStep).toBe(step);
    await expect(page.locator('#pm-shell .pm-question-glass')).toHaveCount(1);
    for(let other=0;other<3;other++){
      const choices=active(page,`[data-pm="${choiceActions[other]}"]`);
      if(other===step)expect(await choices.count()).toBeGreaterThan(0);else await expect(choices).toHaveCount(0);
    }
    await expect(page.locator('#pm-shell [data-pm="start"], #pm-shell [data-pm="finishPreferences"]')).toHaveCount(0);
    await button(page,'skipQuestion').click();
  }
  await screen(page,'preparing');await expect(page.getByRole('status')).toContainText('Preparing developments');
  expect((await state(page)).ui.answers).toEqual({lens:true,style:true,finish:true});
  await page.clock.runFor(2700);await screen(page,'showroom');
  expect((await state(page)).ui).toMatchObject({dev:'dolphin',panel:'units'});
  await expect(button(page,'panel','units')).toHaveClass(/selected/);await noLiveConfig(page);
});

test('question Back retains answers, inherited answers are omitted, and preparing Escape cancels stale transitions safely',async({page})=>{
  await page.clock.install({time:new Date('2026-09-10T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-09-10T12:00:01Z'));
  // Hold the cover fixture so local preparation cannot finish between assertions.
  let releaseCover;
  const coverGate=new Promise(resolve=>{releaseCover=resolve;});
  const cover=await page.evaluate(()=>new URL(UN_ASSET+DEV('dolphin').photo,location.href).href);
  await page.route(cover,async route=>{await coverGate;await route.fulfill({contentType:'image/svg+xml',body:fixtureSvg});});
  await page.evaluate(()=>prOpenDev('dolphin'));await button(page,'introContinue').click();
  await button(page,'lens','investment').click();expect((await state(page)).ui.questionStep).toBe(1);
  await button(page,'back').click();expect((await state(page)).ui.questionStep).toBe(0);
  await expect(button(page,'lens','investment')).toHaveClass(/selected/);
  await questions(page,{lens:'relocation'});await screen(page,'preparing');
  await page.keyboard.press('Escape');await screen(page,'closing');
  releaseCover();
  await page.clock.runFor(5000);await screen(page,'closing');
  await expect(page.locator('.app')).toHaveAttribute('inert','');
  await expect(button(page,'prepare')).toHaveCount(0);
  await button(page,'ack').click();await button(page,'saveOnly').click();
  await page.evaluate(()=>{const o=OPPS.find(o=>o.id==='OPP-1009');o.buyerType='Relocation';delete getExt(o).presentPreferences;PM.presentOpportunity(o.id);});
  await button(page,'introContinue').click();await screen(page,'preflight');
  expect((await state(page)).ui.questionStep).toBe(1);
  await expect(active(page,'[data-pm="lens"]')).toHaveCount(0);
  expect((await state(page)).lens).toBe('relocation');
});

test('approved unit gallery previews preserve room, saved plan, canonical price and shortlist across style/layout and preferences',async({page})=>{
  const fixtures=await unitFixtures(page);await development(page);await unit(page);
  await button(page,'shortUnit','#CM1201').click();
  const before=await specification(page),sessionId=(await state(page)).id;
  const hero=page.locator('#pm-shell .pm-detail-hero img');
  await expect(hero).toHaveAttribute('src',fixtures.living);
  await expect(page.locator('#pm-shell .pm-detail-thumbnail')).toHaveCount(2);
  await expect(page.locator('#pm-shell')).not.toContainText('Visual pending');await noLiveConfig(page);
  await expect(page.locator('#pm-shell .pm-detail-gallery img[src*="wrong-"], #pm-shell .pm-detail-gallery img[src*="unapproved"]')).toHaveCount(0);
  await button(page,'viewUnitImage','1').first().click();
  await viewerImage(page,fixtures.bedroom);
  await expect(viewer(page).locator('.pm-viewer-counter')).toHaveText('2 / 2');
  await viewerButton(page,'Previous item (Left arrow)').click();await expect(viewer(page).locator('.pm-viewer-counter')).toHaveText('1 / 2');
  await viewerButton(page,'Next item (Right arrow)').click();await page.keyboard.press('Escape');await screen(page,'unit');
  await field(page,'previewStyle').selectOption(fixtures.otherStyle);await expect(hero).toHaveAttribute('src',fixtures.otherBedroom);
  await field(page,'previewLayout').selectOption('open-kitchen');await expect(hero).toHaveAttribute('src',fixtures.openBedroom);
  await expect(page.locator('#pm-shell .pm-detail-hero figcaption')).toContainText('Alternative layout preview · saved specification unchanged');
  await expect(field(page,'previewStyle').locator(`option[value="${fixtures.style}"]`)).toHaveJSProperty('disabled',true);
  const unsupported=await field(page,'previewLayout').locator('option:disabled').count();expect(unsupported).toBeGreaterThan(0);
  await expect(page.locator('#pm-shell .pm-detail-plan img')).toHaveAttribute('src',fixtures.plan);
  await button(page,'viewUnitGallery','#CM1201').click();await viewerImage(page,fixtures.openBedroom);
  await page.keyboard.press('Escape');await expect(hero).toHaveAttribute('src',fixtures.openBedroom);
  await button(page,'preferences').click();await questions(page,{style:fixtures.style,finish:'urban'});await screen(page,'unit');
  await expect(hero).toHaveAttribute('src',fixtures.openBedroom);
  expect(await specification(page)).toEqual(before);
  expect(await page.evaluate(()=>PM.selection.items.find(i=>i.unit_id==='#CM1201').is_shortlisted)).toBe(true);
  expect((await state(page)).id).toBe(sessionId);
  await checkout(page);await prepare(page);
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).outputs[PM.session.ui.output].items[0].config,key)).toEqual(before.config);
  await button(page,'preview').click();await screen(page,'preview');await noLiveConfig(page);
  await expect(page.locator('#pm-shell [data-field="previewLayout"], #pm-shell [data-field="previewStyle"]')).toHaveCount(0);
});

test('fullscreen gallery navigation survives close without changing specification',async({page})=>{
  await development(page);await unit(page);const before=await specification(page);
  const images=await page.locator('#pm-shell .pm-detail-thumbnails img').evaluateAll(els=>els.map(el=>el.getAttribute('src')));
  expect(images.length).toBeGreaterThan(1);
  await button(page,'viewUnitGallery','#CM1201').click();await viewerImage(page,images[0]);
  await viewerButton(page,'Next item (Right arrow)').click();await viewerImage(page,images[1]);
  await page.keyboard.press('Escape');await expect(page.locator('#pm-shell .pm-detail-hero img')).toHaveAttribute('src',images[1]);
  expect(await specification(page)).toEqual(before);
  await button(page,'viewUnitGallery','#CM1201').click();await viewerImage(page,images[1]);
});

test('rep Present launcher exposes saved sessions without putting the picker in buyer setup',async({page})=>{
  await development(page);const id=(await state(page)).id;
  await checkout(page);await button(page,'saveOnly').click();
  await page.evaluate(()=>prOpenLobby());await screen(page,'review');
  await expect(page.locator('#pm-shell')).toContainText('Rep only · before screen sharing');
  await button(page,'resume',id).click();await screen(page,'showroom');expect((await state(page)).id).toBe(id);
  await expect(page.locator('#pm-shell')).not.toContainText('Resume a saved session');
});

test('legacy development Compare renders shared full rows across lenses and difference mode',async({page})=>{
  const results=await page.evaluate(()=>{
    trState.items=[{unitId:'#CM1201',config:{}},{unitId:'#CM2701',config:{}}];trSave();
    const ids=['dolphin','mercury'];
    return CMP_LENSES.flatMap(lens=>[false,true].map(diffOnly=>{
      cmpState.lens=lens.k;cmpState.diffOnly=diffOnly;
      const rows=PMData.devRows(ids,{lens:lens.k,diffOnly});
      return {lens:lens.k,diffOnly,columns:ids.map((id,column)=>{
        const container=document.createElement('div');container.innerHTML=cmpDevColHtml(DEV(id));
        return {actual:[...container.querySelectorAll('.cmp-specs .cmp-row')].map(el=>[el.querySelector('.k').textContent,el.querySelector('.v').textContent]),expected:rows.map(r=>[r.label,r.values[column]])};
      })};
    }));
  });
  for(const result of results)for(const column of result.columns)expect(column.actual,`${result.lens} differences=${result.diffOnly}`).toEqual(column.expected);
});

test('no eligible unit assets uses labelled project context, not invented rooms, orientation or approved renders',async({page})=>{
  await development(page);await unit(page);const before=await specification(page);
  await expect(page.locator('#pm-shell')).not.toContainText('Visual pending');
  await expect(page.locator('#pm-shell .pm-detail-hero figcaption')).toContainText('No approved unit visual for the saved finish pack');
  await expect(page.locator('#pm-shell .pm-detail-hero figcaption')).toContainText('Original project imagery');
  await expect(field(page,'previewLayout')).toBeDisabled();await expect(field(page,'previewStyle')).toBeDisabled();
  await expect(page.locator('#pm-shell .pm-detail-plan')).toContainText('Illustrative plan · not to scale · not an approved layout');
  await expect(page.locator('#pm-shell .pm-detail-plan')).toContainText('Plan orientation not supplied');
  const facts=page.locator('#pm-shell .pm-detail-grid > div');
  await expect(facts.filter({has:page.getByText('Rooms',{exact:true})})).toContainText('Not supplied');
  await expect(facts.filter({has:page.getByText('Orientation',{exact:true})})).toContainText('Not supplied');
  await button(page,'viewPlan','#CM1201').click();await planReady(page);
  await expect(viewer(page).locator('.pm-viewer-compass')).toBeHidden();
  await page.keyboard.press('Escape');expect(await specification(page)).toEqual(before);
});

test('fullscreen plan marks transform with zoom/pan, stay temporary and isolated, and clear on end',async({page})=>{
  const fixtures=await unitFixtures(page);await development(page);await unit(page);await button(page,'shortUnit','#CM1201').click();
  const before=await specification(page),ink=page.locator('#pm-shell .pm-viewer-ink path');
  await button(page,'viewPlan','#CM1201').click();await planReady(page);
  await viewerImage(page,fixtures.plan);
  await expect(viewer(page).locator('.pm-viewer-compass')).toBeVisible();
  const storageBefore=await page.evaluate(key=>localStorage.getItem(key),key);
  await viewerButton(page,'Zoom in (+)').click();await expect(viewer(page).locator('.pm-viewer-zoom')).toHaveText('125%');
  const stage=viewer(page).locator('.pm-viewer-stage');await stage.focus();await page.keyboard.press('Shift+ArrowRight');
  const start=await drawMark(page);await expect(ink).toHaveCount(1);
  const coordinates=await ink.evaluate((path,start)=>{
    const matrix=path.getScreenCTM().inverse(),point=new DOMPoint(start.x,start.y).matrixTransform(matrix);
    return {expected:[point.x,point.y],actual:path.getAttribute('d').match(/^M([\d.e+-]+) ([\d.e+-]+)/).slice(1).map(Number)};
  },start);
  expect(coordinates.actual[0]).toBeCloseTo(coordinates.expected[0],1);expect(coordinates.actual[1]).toBeCloseTo(coordinates.expected[1],1);
  const mark=await ink.getAttribute('d');
  await viewerButton(page,'Fit / reset viewport (0); retain marks').click();await expect(viewer(page).locator('.pm-viewer-zoom')).toHaveText('100%');await expect(ink).toHaveAttribute('d',mark);
  await drawMark(page);await expect(ink).toHaveCount(2);
  await viewerButton(page,'Undo last mark (Control or Command Z)').click();await expect(ink).toHaveCount(1);
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(storageBefore);
  await page.keyboard.press('Escape');await screen(page,'unit');expect(await specification(page)).toEqual(before);
  await button(page,'shortlist').click();await button(page,'viewPlan','#CM1201').click();await planReady(page);await expect(ink).toHaveAttribute('d',mark);
  await viewerButton(page,'Clear marks on this plan').click();await expect(ink).toHaveCount(0);await drawMark(page);
  await page.keyboard.press('Escape');await button(page,'unit','#CM1201').click();await button(page,'back').click();await screen(page,'shortlist');
  await button(page,'back').click();await unit(page,'#CM1203');await button(page,'viewPlan','#CM1203').click();await planReady(page);await expect(ink).toHaveCount(0);
  await page.keyboard.press('Escape');await button(page,'back').click();await unit(page);await button(page,'viewPlan','#CM1201').click();await planReady(page);await expect(ink).toHaveCount(1);
  await page.keyboard.press('Escape');await checkout(page);await prepare(page);
  const output=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).outputs[PM.session.ui.output],key);
  expect(output.items[0].config).toEqual(before.config);expect(JSON.stringify(output)).not.toContain(mark);
  expect(JSON.stringify(output)).not.toMatch(/"(?:annotations|strokes|ink)"/);
  await button(page,'preview').click();await screen(page,'preview');await expect(page.locator('#pm-shell .pm-viewer-ink, #pm-shell [data-pm="viewPlan"]')).toHaveCount(0);
  await button(page,'previewBack').click();await button(page,'saveOnly').click();
  await development(page);await unit(page);await button(page,'viewPlan','#CM1201').click();await planReady(page);await expect(ink).toHaveCount(0);
});

test('viewer traps focus and Escape restores the invoking plan control without leaving the buyer-safe surface',async({page})=>{
  await unitFixtures(page);await development(page);await unit(page);
  const trigger=button(page,'viewPlan','#CM1201');await trigger.click();await planReady(page);
  await expect(viewerButton(page,'Close viewer (Escape)')).toBeFocused();
  await page.keyboard.press('Shift+Tab');expect(await page.evaluate(()=>!!document.activeElement.closest('#pm-shell .pm-viewer'))).toBe(true);
  await page.keyboard.press('Tab');await expect(viewerButton(page,'Close viewer (Escape)')).toBeFocused();
  await page.evaluate(()=>{showToast('PRIVATE VIEWER CRM ALERT');go('pipeline');openOpp('OPP-1001');});
  await expect(page.locator('.app')).toHaveAttribute('inert','');await expect(page.locator('.app')).toHaveCSS('visibility','hidden');
  await expect(page.locator('#pm-shell')).not.toContainText('PRIVATE VIEWER CRM ALERT');
  await page.keyboard.press('Escape');await expect(viewer(page)).toHaveCount(0);await screen(page,'unit');
  await expect.soft(trigger).toBeFocused();
  await page.keyboard.press('Escape');await screen(page,'showroom');await expect(page.locator('.app')).toHaveAttribute('inert','');
});

test('map places one selectable filtered result list left of geography and keeps marker selection/order in sync',async({page})=>{
  await page.evaluate(()=>PM.presentDevelopments([]));await questions(page);await screen(page,'portfolio');
  await button(page,'portfolioView','map').click();expect(await page.evaluate(()=>PMMap.load())).toBe(true);
  const results=page.locator('#pm-shell .pm-map-results'),map=page.locator('#pm-shell .pm-map-geography');
  await expect(results).toHaveCount(1);await expect(map).toHaveCount(1);
  const left=await results.boundingBox(),right=await map.boundingBox();expect(left.x+left.width).toBeLessThanOrEqual(right.x);expect(Math.abs(left.y-right.y)).toBeLessThan(2);
  await expect(results.locator('[data-field="filter.dev"]')).toBeVisible();await expect(page.locator('#pm-shell .pm-map-legend-control')).toHaveCount(0);
  await results.locator('[data-arg="dolphin"]').click();await map.locator('.pm-map-pin[data-arg="mercury"]').click();
  await expect(results.locator('[data-arg="mercury"]')).toHaveAttribute('aria-pressed','true');
  await field(page,'filter.dev').selectOption('dolphin');await expect(results.locator('.pm-map-result')).toHaveCount(1);await expect(map.locator('.pm-map-pin')).toHaveCount(1);
  expect((await state(page)).ui.tour).toEqual(['dolphin','mercury']);
  await button(page,'tourReorder','mercury:-1').click();await button(page,'resetFilters').click();
  await button(page,'portfolioView','collection').click();expect((await state(page)).scope.order).toEqual(['mercury','dolphin']);
  await button(page,'beginTour').click();await screen(page,'showroom');expect((await state(page)).ui.dev).toBe('mercury');
});

test('tour Gallery, Interiors, Amenities and Timeline use source facts while preserving Units and tour navigation',async({page})=>{
  await page.evaluate(()=>PM.presentDevelopments(['dolphin','mercury']));await questions(page);await screen(page,'showroom');
  const before=await state(page),facts=await page.evaluate(()=>({amen:DEV('dolphin').amen,completion:DEV('dolphin').completion}));
  const rail=page.getByRole('navigation',{name:'Project media'});
  for(const name of ['Gallery','Amenities','Timeline'])await expect(rail.getByRole('button',{name,exact:true})).toBeVisible();
  await button(page,'media','gallery').click();expect(await page.locator('#pm-shell .pm-project-images figure').count()).toBeGreaterThan(1);
  const first=await page.locator('#pm-shell .pm-project-images img').first().getAttribute('src');
  await button(page,'viewProjectImage','0').click();await viewerImage(page,first);
  await page.keyboard.press('Escape');await screen(page,'showroom');expect((await state(page)).ui.media).toBe('gallery');
  await button(page,'media','interiors').click();await expect(page.locator('#pm-shell .pm-stage-title, #pm-shell .pm-stage-content')).toHaveCount(0);
  const interiorUrls=await page.locator('#pm-shell .pm-project-images img').evaluateAll(els=>els.map(el=>el.getAttribute('src')));
  expect(interiorUrls).toEqual(await page.evaluate(()=>DEV('dolphin').media.renders.int.map(im=>UN_ASSET+im.img)));
  await button(page,'media','amenities').click();await expect(page.locator('#pm-shell .pm-amenity-list > div')).toHaveCount(facts.amen.length);
  for(const amenity of facts.amen)await expect(page.locator('#pm-shell .pm-amenity-list')).toContainText(amenity);
  await button(page,'media','timeline').click();await expect(page.locator('#pm-shell .pm-timeline li')).toHaveCount(1);await expect(page.locator('#pm-shell .pm-timeline')).toContainText(facts.completion);
  await expect(page.locator('#pm-shell .pm-stage-content')).toContainText('Completion is the only milestone supplied');
  await page.evaluate(()=>DEV('dolphin').presentTimeline=[{label:'Fixture foundation milestone',date:'2026-01',status:'Completed · fixture source'},{label:'Fixture handover',date:'2027-06',status:'Planned · fixture source'}]);
  await button(page,'media','exterior').click();await button(page,'media','timeline').click();await expect(page.locator('#pm-shell .pm-timeline li')).toHaveCount(2);
  await expect(page.locator('#pm-shell .pm-timeline')).toContainText('Planned · fixture source');
  expect((await state(page)).ui.panel).toBe('units');expect((await state(page)).id).toBe(before.id);
  await button(page,'nextDevelopment').click();await screen(page,'showroom');expect((await state(page)).ui).toMatchObject({dev:'mercury',panel:'units'});
});

test('buyer interest persists independently of private aggregate demand; own buyer and closed records are excluded',async({page,context})=>{
  await page.evaluate(()=>{
    const o=OPPS.find(o=>o.id==='OPP-1009');o.devs=['Dolphin Court'];o.units=['#CM1201'];o.lead='PRIVATE CURRENT BUYER';
    OPPS.filter(x=>x!==o).forEach(x=>{x.units=x.units.filter(id=>id!=='#CM1201');});
    const contact=CONTACTS.find(c=>c.oppIds?.includes(o.id));if(contact){contact.name=o.lead;contact.oppIds.push('FIXTURE-SAME-BUYER');}
    const make=(id,stage,lead)=>({...o,id,stage,lead,units:['#CM1201']});
    OPPS.push(make('FIXTURE-ACTIVE','Qualified','PRIVATE OTHER BUYER'),make('FIXTURE-ACTIVE','Qualified','PRIVATE OTHER BUYER'),make('FIXTURE-WON','Closed Won','PRIVATE WON BUYER'),make('FIXTURE-LOST','Lost','PRIVATE LOST BUYER'),make('FIXTURE-CLOSED-LOST','Closed Lost','PRIVATE CLOSED LOST BUYER'),make('FIXTURE-SAME-BUYER','Qualified',o.lead));
    delete getExt(o).presentPreferences;PM.presentOpportunity(o.id);
  });
  await questions(page);await screen(page,'showroom');await button(page,'shortlist').click();
  const card=page.locator('#pm-shell .pm-detail-short-unit').filter({hasText:'#CM1201'});
  await expect(card.locator('.pm-detail-market')).toHaveText('1 other active opportunity · aggregated prototype data, not a reservation or demand forecast.');
  await expect(field(page,'interest.#CM1201')).toHaveValue('unset');await field(page,'interest.#CM1201').selectOption('favourite');
  await expect(page.locator('#pm-shell')).not.toContainText('PRIVATE');await expect(page.locator('#pm-shell')).not.toContainText('FIXTURE-');
  await expect(page.locator('#pm-shell')).not.toContainText('viewing now');await expect(page.locator('#pm-shell')).not.toContainText('expiring');
  const before=await specification(page),id=(await state(page)).id;
  await checkout(page);await button(page,'prepare').click();await expect(button(page,'share')).toBeVisible();
  const output=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).outputs[PM.session.ui.output],key);
  expect(output.items[0].interest).toBe('favourite');expect(JSON.stringify(output)).not.toContain('PRIVATE OTHER BUYER');
  expect(JSON.stringify(output)).not.toMatch(/"(?:marketInterest|market_interest|demandCount)"/);
  await button(page,'preview').click();await expect(page.locator('#pm-shell')).not.toContainText('other active');
  await button(page,'previewBack').click();await button(page,'saveOnly').click();await page.reload();await page.evaluate(id=>PM.resume(id),id);await screen(page,'shortlist');
  await expect(field(page,'interest.#CM1201')).toHaveValue('favourite');expect(await specification(page)).toEqual(before);
  const inventoryPage=await context.newPage();await inventoryPage.goto(ENTRY_URL);await inventoryPage.evaluate(()=>PM.simulateInventory('#CM1201','sold'));await expect(card).toContainText('excluded from comparison and deliverables');
  await expect(field(page,'compareUnit.#CM1201')).toBeDisabled();await expect(field(page,'interest.#CM1201')).toHaveValue('favourite');
  await inventoryPage.close();
});

test('shared Compare and Present retain complete row values across every buyer lens without mutating tray state',async({page})=>{
  const parity=await page.evaluate(()=>{
    const items=[{unitId:'#CM1201',config:{layout:'open-kitchen',preset:'std',pack:'urban'}},{unitId:'#CM2701',config:{layout:'architect',preset:'std',pack:'signature'}}];
    trState.items=items;trSave();cmpOpen();cmpSetLens('investor');
    const before=JSON.stringify({tray:trState,compare:cmpState});
    const priceFor=(u,c)=>u.price+((CR_LAYOUT(c.layout)?.delta||0)+(CR_PACK(c.pack)?.delta||0))*1000;
    const results=CMP_LENSES.map(lens=>{
      const original=cmpActivePlan(items.map(it=>({it,u:UN(it.unitId)})),lens).filter(p=>p.row);
      const present=PMData.unitRows(items,{lens:lens.k,priceFor});
      return {lens:lens.k,rows:original.filter(p=>p.row.key!=='amen').map(p=>({key:p.row.key,original:items.map(it=>p.vals[it.unitId].replace(/\s+/g,' ').trim()),present:present.find(r=>r.key===p.row.key)?.values.map(v=>v.replace(/\s+/g,' ').trim())})),keys:present.map(r=>r.key)};
    });
    return {results,unchanged:before===JSON.stringify({tray:trState,compare:cmpState}),items,total:cmpBaseTotal()};
  });
  expect(parity.unchanged).toBe(true);
  await expect(page.locator('#cmp.on .cmp-cols .cmp-col')).toHaveCount(2);
  await page.getByRole('button',{name:'Present live',exact:true}).click();await screen(page,'compare');
  const before=await specification(page);expect(before.price).toBe(329000);
  await expect(page.locator('#pm-shell .pm-table')).toContainText('€329,000');
  await expect(page.locator('#pm-shell .pm-table')).toContainText('Est. gross yield (demo)');
  // Collect every mismatch rather than masking later discrepancies behind the first.
  const differences=parity.results.flatMap(({lens,rows})=>rows.filter(r=>JSON.stringify(r.original)!==JSON.stringify(r.present)).map(r=>({lens,...r})));
  await checkout(page);await button(page,'saveOnly').click();
  expect(await page.evaluate(()=>trState.items)).toEqual(parity.items);expect(await page.evaluate(()=>cmpBaseTotal())).toBe(parity.total);
  expect(differences,'Shared Compare facts must not diverge for the same units, configs and lens').toEqual([]);
});

test('comparison differences, full amenities, missing stock and hidden prices use shared facts without leaking amounts',async({page})=>{
  await page.evaluate(()=>{
    DEV('dolphin').attributes={...DEV('dolphin').attributes,total_units:150,amenityAvailability:{'Fixture sauna':false}};
    DEV('mercury').attributes={...DEV('mercury').attributes,amenityAvailability:{'Fixture sauna':true}};
    DEV('dolphin').amen.push('Fixture library');
    PM.presentDevelopments(['dolphin','mercury']);
  });
  await questions(page,{lens:'investment'});await screen(page,'showroom');await shortDevelopment(page,'dolphin');await unit(page);await button(page,'shortUnit','#CM1201').click();
  await button(page,'nextDevelopment').click();await screen(page,'showroom');await shortDevelopment(page,'mercury');await unit(page,'#CM2701');await button(page,'shortUnit','#CM2701').click();
  await button(page,'shortlist').click();await button(page,'openComparison','units').click();await screen(page,'compare');
  const before=await specification(page);
  const row=(label)=>page.locator('#pm-shell .pm-table tbody tr').filter({has:page.locator('th[scope="row"]').filter({hasText:label})});
  await expect(row('Fixture sauna').locator('td')).toHaveText(['Not included','✓ Included']);await expect(row('Fixture library').locator('td')).toHaveText(['✓ Included','— Not listed']);
  const allRows=await page.locator('#pm-shell .pm-table tbody tr:has(td)').count();
  await field(page,'diffOnly').check();
  const values=await page.locator('#pm-shell .pm-table tbody tr:has(td)').evaluateAll(rows=>rows.map(r=>[...r.querySelectorAll('td')].map(td=>td.textContent)));
  expect(values.length).toBeLessThan(allRows);expect(values.length).toBeGreaterThan(0);values.forEach(v=>expect(new Set(v).size).toBeGreaterThan(1));
  await field(page,'diffOnly').uncheck();await button(page,'prices').click();
  await expect(row('Configured price').locator('td')).toHaveText(['On request','On request']);
  expect(await page.locator('#pm-shell').innerText()).not.toMatch(/€\s*[\d]|329,000|315,000/);
  await button(page,'compareMode','developments').click();await expect(row('Total development units').locator('td').first()).toHaveText('150');
  await expect(row('Fixture sauna').locator('td')).toHaveText(['Not included','✓ Included']);
  await expect(row('From · nonsold registered stock').locator('td')).toHaveText(['On request','On request']);
  expect(await page.locator('#pm-shell').innerText()).not.toMatch(/€\s*[\d]/);expect(await specification(page)).toEqual(before);
  const empty=await page.evaluate(()=>PMData.stats('nonexistent-test-development'));
  expect(empty).toEqual({registered:0,available:0,total:null,from:null,avgPsqm:null});
  const stock=await page.evaluate(()=>({actual:PMData.stats('dolphin'),registered:UNITS.filter(u=>u.dev==='Dolphin Court').length,available:UNITS.filter(u=>u.dev==='Dolphin Court'&&u.status==='available').length}));
  expect(stock.actual).toMatchObject({registered:stock.registered,available:stock.available,total:150});
});

// Spatial fixtures are read from the public projection and independently checked
// against inventory. Never assume a particular building, level, or stock count.
const spatialStage=page=>page.locator('#pm-shell .pm-spatial-stage');
const stageButton=(page,action,arg)=>spatialStage(page).locator(`[data-pm="sp-${action}"]${arg===undefined?'':`[data-arg="${arg}"]`}:visible`).first();
const footprint=(page,id)=>spatialStage(page).locator(`.sp-footprint[data-arg="${id}"]`);
const spatialState=(page,id='dolphin')=>page.evaluate(id=>PM.session.ui.spatial[id],id);
const neighbourhood=page=>page.locator('#pm-shell .pm-neighbourhood-stage');
const neighbourhoodState=(page,id='dolphin')=>page.evaluate(id=>PM.session.ui.neighbourhood[id],id);
async function projectMedia(page){
  await button(page,'media','exterior').click();
  expect((await state(page)).ui.media).toBe('exterior');
  await expect(spatialStage(page)).toBeVisible();
}
async function spatialFixture(page,id='dolphin'){
  const data=await page.evaluate(id=>({project:PMSpatial.project(id),units:UNITS.filter(u=>u.dev===DEV(id).name)}),id);
  const available=data.units.find(u=>u.status==='available'&&data.project.buildings.some(b=>b.floors.some(f=>f.unitIds.includes(u.id))));
  expect(available,'Fixture needs an available unit with a recorded floor').toBeTruthy();
  const building=data.project.buildings.find(b=>b.unitIds.includes(available.id));
  return {...data,unit:available,building,floor:building.floors.find(f=>f.unitIds.includes(available.id))};
}
async function openFloor(page,fixture){
  await projectMedia(page);
  await stageButton(page,'building',fixture.building.id).click();
  await stageButton(page,'floors').click();
  await stageButton(page,'floor',fixture.floor.value).click();
  await expect(spatialStage(page).locator('[data-sp-plan]')).toBeVisible();
}
async function selectFootprint(page,fixture,key){
  const target=footprint(page,fixture.unit.id);
  if(key){await target.focus();await page.keyboard.press(key);}else await target.click();
  await expect(target).toHaveAttribute('aria-pressed','true');
  await expect(active(page,'.sp-unit-detail[aria-label="Selected unit details"]')).toContainText(fixture.unit.id);
  await screen(page,'showroom');
}
async function noExplorerOverflow(page){
  const sizes=await page.locator('#pm-shell, #pm-shell .pm-main, #pm-shell .pm-stage, #pm-shell .sp-stage-content, #pm-shell .sp-panel:visible').evaluateAll(els=>els.map(el=>({name:el.className||el.id,width:el.clientWidth,scroll:el.scrollWidth})));
  for(const size of sizes)expect(size.scroll,`${size.name} horizontal overflow`).toBeLessThanOrEqual(size.width+1);
}
async function protectedSurface(page){
  await expect(page.locator('#pm-shell')).toBeVisible();
  await expect(page.locator('.app')).toHaveAttribute('inert','');
  await expect(page.locator('.app')).toHaveCSS('visibility','hidden');
}

test('spatial site selects both buildings and four distinct facades without mutating inventory or canonical data',async({page})=>{
  await development(page);const fixture=await spatialFixture(page);
  await unit(page,fixture.unit.id);await button(page,'back').click();await projectMedia(page);await stageButton(page,'site').click();
  // Navigation legitimately updates the selection's save timestamp, not its
  // inventory, configuration, prices, membership, or other persisted fields.
  const snapshot=()=>page.evaluate(()=>({units:UNITS,devs:DEVS,tray:trState,selection:{...PM.selection,updated_at:undefined}}));
  const before=await snapshot();expect(before.selection.items.length).toBeGreaterThan(0);
  await expect(spatialStage(page).locator('.sp-site-building')).toHaveCount(fixture.project.buildings.length);
  await expect(spatialStage(page).locator('.sp-disclosure')).toContainText('Buildings, geometry, orientation and outlooks are invented');
  await spatialStage(page).getByText('About this demo mapping',{exact:true}).click();
  await expect(spatialStage(page).locator('.sp-disclosure')).toContainText(fixture.project.mapping);
  const elevations=[];
  for(const [index,building] of fixture.project.buildings.entries()){
    const site=spatialStage(page).locator(`.sp-site-building[data-arg="${building.id}"]`);
    await site.focus();await page.keyboard.press(index?'Space':'Enter');
    expect((await spatialState(page)).buildingId).toBe(building.id);
    const sides=[];
    for(let side=0;side<building.facades.length;side++){
      await stageButton(page,'facade',side).click();
      await expect(stageButton(page,'facade',side)).toHaveAttribute('aria-pressed','true');
      await expect(spatialStage(page).locator('.sp-art svg')).toHaveAttribute('aria-label',`${building.name}, illustrative ${building.facades[side]}`);
      sides.push(await spatialStage(page).locator('.sp-art svg').innerHTML());
    }
    expect(new Set(sides).size).toBe(building.facades.length);elevations.push(sides);
    await stageButton(page,'facade-next').click();expect((await spatialState(page)).facadeIndex).toBe(0);
    await stageButton(page,'facade-prev').click();expect((await spatialState(page)).facadeIndex).toBe(3);
    await stageButton(page,'site').click();expect((await spatialState(page)).buildingId).toBeNull();
  }
  expect(elevations[0]).not.toEqual(elevations[1]);
  expect(await snapshot()).toEqual(before);
});

test('spatial projection and rendered floors use exact live IDs, sparse recorded levels and status counts',async({page})=>{
  // Isolated inventory edge cases: no implicit zero for absent floors, no range
  // interpolation, one explicitly registered empty level, and an unknown status.
  await page.evaluate(()=>{
    const rows=UNITS.filter(u=>u.dev===DEV('dolphin').name);
    rows.forEach((u,i)=>{u.floor=[-2,'3',11,null,'',undefined,'unrecorded'][i%7];u.status=['available','hold','reserved','sold','unknown'][i%5];});
    DEV('dolphin').floors=[19];
  });
  await development(page);await projectMedia(page);
  const {project,units}=await page.evaluate(()=>({project:PMSpatial.project('dolphin'),units:UNITS.filter(u=>u.dev===DEV('dolphin').name)}));
  const hasFloor=u=>(typeof u.floor==='number'&&Number.isFinite(u.floor))||(typeof u.floor==='string'&&u.floor.trim()!==''&&Number.isFinite(Number(u.floor)));
  const levels=[...new Set([19,...units.filter(hasFloor).map(u=>Number(u.floor))])].sort((a,b)=>a-b);
  expect(project.registered).toBe(units.length);expect(project.available).toBe(units.filter(u=>u.status==='available').length);
  expect([...project.unplacedUnitIds].sort()).toEqual(units.filter(u=>!hasFloor(u)).map(u=>u.id).sort());
  expect(project.buildings.flatMap(b=>b.unitIds).sort()).toEqual(units.map(u=>u.id).sort());
  for(const [index,building] of project.buildings.entries()){
    expect(building.unitIds).toEqual(units.map(u=>u.id).sort().filter((_,i)=>i%2===index));
    expect(building.floors.map(f=>f.value)).toEqual(levels);
    await stageButton(page,'building',building.id).click();
    if((await state(page)).ui.media!=='floors')await stageButton(page,'floors').click();
    await expect(spatialStage(page).locator('.sp-stage-floor-nav [data-pm="sp-floor"]')).toHaveCount(levels.length);
    for(const floor of building.floors){
      const expected=units.filter(u=>building.unitIds.includes(u.id)&&hasFloor(u)&&Number(u.floor)===floor.value);
      expect(floor.unitIds).toEqual(expected.map(u=>u.id).sort());
      expect(floor.registered).toBe(expected.length);expect(floor.available).toBe(expected.filter(u=>u.status==='available').length);
      await stageButton(page,'floor',floor.value).click();
      await expect(spatialStage(page).locator('.sp-footprint')).toHaveCount(expected.length);
      expect(await spatialStage(page).locator('.sp-footprint').evaluateAll(nodes=>nodes.map(n=>n.dataset.arg).sort())).toEqual(floor.unitIds);
      for(const status of ['available','hold','reserved','sold','unknown'])await expect(spatialStage(page).locator(`.sp-footprint.sp-${status}`)).toHaveCount(expected.filter(u=>u.status===status).length);
      await expect(spatialStage(page).locator('.sp-caption').filter({hasText:'registered units'})).toHaveText(`${floor.registered} registered units · ${floor.available} available on this mapped level. Layout, room partitions, shared spaces and compass are illustrative.`);
      if(!expected.length){await expect(spatialStage(page)).toContainText('Blank geometry is not available inventory');await expect(active(page,'[data-pm="sp-explore"], [data-pm="sp-shortlist"]')).toHaveCount(0);}
    }
  }
  expect(levels).not.toContain(0);expect(levels).not.toContain(4);
  // Fresh snapshots must not retain external mutation or write demo assignments
  // onto the actual inventory records.
  const purity=await page.evaluate(()=>{
    const before=JSON.stringify({units:UNITS,devs:DEVS}),p=PMSpatial.project('dolphin');
    p.buildings[0].unitIds.push('NOT-IN-INVENTORY');p.buildings[0].floors[0].value=999;
    return {unchanged:before===JSON.stringify({units:UNITS,devs:DEVS}),fresh:PMSpatial.project('dolphin')};
  });
  expect(purity.unchanged).toBe(true);expect(purity.fresh).toEqual(project);
});

test('floor up/down follows registered levels and highlights exactly one complete building outline',async({page})=>{
  await development(page);const fixture=await spatialFixture(page);await openFloor(page,fixture);
  const floors=fixture.building.floors;
  await stageButton(page,'floor',floors[0].value).click();await expect(stageButton(page,'floor-down')).toBeDisabled();
  for(const [index,floor] of floors.entries()){
    if(index)await stageButton(page,'floor-up').click();
    expect((await spatialState(page)).floor).toBe(floor.value);
    await expect(stageButton(page,'floor',floor.value)).toHaveAttribute('aria-pressed','true');
    const outline=active(page,'.sp-silhouette');await expect(outline).toHaveCount(1);
    await expect(outline).toHaveAttribute('aria-label',`${fixture.building.name} complete recorded-level outline; selected ${floor.label}`);
    await expect(outline.locator('g')).toHaveCount(floors.length);
    await expect(outline.locator('.sp-level-active')).toHaveCount(1);
    await expect(outline.locator('g').filter({has:page.locator('.sp-level-active')})).toContainText(`${floor.registered} units · ${floor.available} available`);
  }
  await expect(stageButton(page,'floor-up')).toBeDisabled();
  for(let index=floors.length-2;index>=0;index--){await stageButton(page,'floor-down').click();expect((await spatialState(page)).floor).toBe(floors[index].value);}
  await expect(stageButton(page,'floor-down')).toBeDisabled();
});

for(const activation of ['click','Enter','Space'])test(`footprint ${activation} inspects then opens canonical unit and Back restores exact floor viewport`,async({page})=>{
  await development(page);const fixture=await spatialFixture(page);await openFloor(page,fixture);
  await stageButton(page,'zoom-in').click();
  const plan=spatialStage(page).locator('[data-sp-plan]');await plan.focus();await page.keyboard.press('ArrowRight');
  await selectFootprint(page,fixture,activation==='click'?null:activation);
  const before=await spatialState(page),box=await plan.getAttribute('viewBox');
  await expect(footprint(page,fixture.unit.id)).toHaveClass(/sp-selected/);
  if(activation!=='click')await expect(footprint(page,fixture.unit.id)).toBeFocused();
  await button(page,'sp-explore',fixture.unit.id).click();await screen(page,'unit');
  const canonical=await specification(page,fixture.unit.id);
  expect(canonical.config).toEqual({layout:'architect',preset:'std',pack:'signature'});expect(canonical.price).toBe(fixture.unit.price);
  await expect(page.locator('#pm-shell .pm-detail-grid')).toContainText(String(fixture.unit.sqm));await noLiveConfig(page);
  await button(page,'back').click();await screen(page,'showroom');expect((await state(page)).ui.media).toBe('floors');
  expect(await spatialState(page)).toEqual(before);await expect(plan).toHaveAttribute('viewBox',box);
  await expect(footprint(page,fixture.unit.id)).toHaveAttribute('aria-pressed','true');
  expect(await specification(page,fixture.unit.id)).toEqual(canonical);await protectedSurface(page);
});

for(const status of ['available','hold','reserved','sold'])test(`spatial ${status} inspection respects shortlist availability and hides every price representation`,async({page})=>{
  const fixture=await spatialFixture(page);
  await page.evaluate(({id,status})=>{UN(id).status=status;},{id:fixture.unit.id,status});
  await development(page);await openFloor(page,fixture);await selectFootprint(page,fixture);
  await expect(footprint(page,fixture.unit.id)).toHaveClass(new RegExp(`sp-${status}`));
  const shortlist=button(page,'sp-shortlist',fixture.unit.id);
  if(status==='available'){
    await expect(shortlist).toBeEnabled();await shortlist.click();await expect(shortlist).toBeDisabled();
    expect(await page.evaluate(id=>PM.selection.items.filter(i=>i.unit_id===id&&i.is_shortlisted).length,fixture.unit.id)).toBe(1);
  }else{
    await expect(shortlist).toBeDisabled();await expect(active(page,'.sp-readonly')).toContainText('Read-only inspection');
    expect(await page.evaluate(id=>PM.selection.items.some(i=>i.unit_id===id&&i.is_shortlisted),fixture.unit.id)).toBe(false);
  }
  await button(page,'prices').click();
  await expect(active(page,'.sp-price')).toHaveText('Price on request');
  const rendered=await page.locator('#pm-shell').evaluate(el=>({text:el.textContent,attributes:[...el.querySelectorAll('[aria-label],[title],[data-price]')].map(n=>[n.getAttribute('aria-label'),n.getAttribute('title'),n.getAttribute('data-price')]).flat().join(' ')}));
  expect(JSON.stringify(rendered)).not.toMatch(/€|EUR\s*\d/);
  expect(JSON.stringify(rendered)).not.toContain(fixture.unit.price.toLocaleString('en-US'));
  await button(page,'sp-explore',fixture.unit.id).click();await screen(page,'unit');await noLiveConfig(page);
  if(status!=='available')await expect(button(page,'shortUnit',fixture.unit.id)).toBeDisabled();
  expect(await page.locator('#pm-shell').innerText()).not.toContain('€');
});

test('inventory reconciliation keeps floors live, selected history and viewport while removing actionable stock',async({page,context})=>{
  await development(page);const fixture=await spatialFixture(page);await openFloor(page,fixture);await selectFootprint(page,fixture);
  await button(page,'sp-shortlist',fixture.unit.id).click();await stageButton(page,'zoom-in').click();
  const before=await spatialState(page),canonical=await specification(page,fixture.unit.id);
  const other=await context.newPage();await other.goto(ENTRY_URL);
  for(const status of ['hold','reserved','sold','available']){
    await other.evaluate(({id,status})=>PM.simulateInventory(id,status),{id:fixture.unit.id,status});
    await expect(footprint(page,fixture.unit.id)).toHaveClass(new RegExp(`sp-${status}`));
    await screen(page,'showroom');expect((await state(page)).ui.media).toBe('floors');expect(await spatialState(page)).toEqual(before);
    const live=await spatialFixture(page),floor=live.project.buildings.find(b=>b.id===fixture.building.id).floors.find(f=>f.value===fixture.floor.value);
    expect(floor.available).toBe(fixture.floor.available-(status==='available'?0:1));
    await expect(spatialStage(page).locator('.sp-caption').filter({hasText:'registered units'})).toContainText(`${floor.registered} registered units · ${floor.available} available`);
    await expect(button(page,'sp-shortlist',fixture.unit.id)).toBeDisabled();
    expect(await page.evaluate(id=>PM.selection.items.find(i=>i.unit_id===id).is_shortlisted,fixture.unit.id)).toBe(true);
    if(status!=='available')expect((await state(page)).ui.compare).not.toContain(fixture.unit.id);
    expect(await specification(page,fixture.unit.id)).toEqual(canonical);
  }
  await stageButton(page,'zoom-out').click();await expect(spatialStage(page).locator('[data-sp-plan]')).toHaveAttribute('viewBox','0 0 1000 660');
  await other.close();
});

test('spatial mounted keyboard and mouse pan persist without rerender or accidental footprint selection',async({page})=>{
  await development(page);const fixture=await spatialFixture(page);await openFloor(page,fixture);
  const plan=spatialStage(page).locator('[data-sp-plan]'),node=await plan.elementHandle();
  await plan.focus();await page.keyboard.press('=');expect((await spatialState(page)).viewport.zoom).toBe(1.25);
  const zoomed=await spatialState(page);await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');
  expect((await spatialState(page)).viewport.x).toBeGreaterThan(zoomed.viewport.x);expect((await spatialState(page)).viewport.y).toBeGreaterThan(zoomed.viewport.y);
  await page.keyboard.press('0');expect((await spatialState(page)).viewport).toEqual({x:0,y:0,zoom:1});
  await page.keyboard.press('=');await page.keyboard.press('=');
  const start=await spatialState(page);await plan.scrollIntoViewIfNeeded();const box=await plan.boundingBox();
  await page.mouse.move(box.x+box.width*.52,box.y+box.height*.51);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.52-40,box.y+box.height*.51-20,{steps:6});await page.mouse.up();
  const dragged=await spatialState(page);expect(dragged.viewport.x).toBeGreaterThan(start.viewport.x);expect(dragged.viewport.y).toBeGreaterThan(start.viewport.y);expect(dragged.unitId).toBeNull();
  expect(await node.evaluate(el=>el.isConnected)).toBe(true);
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).sessions[PM.session.id].ui.spatial.dolphin.viewport,key)).toEqual(dragged.viewport);
  await stageButton(page,'reset').click();expect((await spatialState(page)).viewport).toEqual({x:0,y:0,zoom:1});
});

test('spatial building and development memories stay isolated and resume after reload',async({page})=>{
  await page.evaluate(()=>PM.presentDevelopments(['dolphin','mercury']));await questions(page);await screen(page,'showroom');
  const fixture=await spatialFixture(page);await openFloor(page,fixture);await selectFootprint(page,fixture);await stageButton(page,'zoom-in').click();
  await stageButton(page,'view','outlook').click();await stageButton(page,'direction','west').click();
  const first=await spatialState(page),otherBuilding=fixture.project.buildings.find(b=>b.id!==fixture.building.id);
  await stageButton(page,'building',otherBuilding.id).click();
  expect(await spatialState(page)).toMatchObject({buildingId:otherBuilding.id,unitId:null,direction:'north',view:'plan',viewport:{x:0,y:0,zoom:1}});
  await stageButton(page,'floor',otherBuilding.floors.at(-1).value).click();await stageButton(page,'zoom-in').click();await stageButton(page,'zoom-in').click();
  const second=await spatialState(page);
  await stageButton(page,'building',fixture.building.id).click();
  expect((await spatialState(page)).byBuilding[fixture.building.id]).toEqual(first.byBuilding[fixture.building.id]);
  expect((await spatialState(page)).byBuilding[otherBuilding.id]).toEqual(second.byBuilding[otherBuilding.id]);
  const dolphin=await spatialState(page);await button(page,'nextDevelopment').click();await screen(page,'showroom');
  await projectMedia(page);
  expect((await state(page)).ui.dev).toBe('mercury');expect(await spatialState(page,'mercury')).toMatchObject({buildingId:null,unitId:null,viewport:{x:0,y:0,zoom:1}});
  const mercuryFixture=await spatialFixture(page,'mercury');await openFloor(page,mercuryFixture);await selectFootprint(page,mercuryFixture);
  expect(await spatialState(page)).toEqual(dolphin);const mercury=await spatialState(page,'mercury'),id=(await state(page)).id;
  await checkout(page);await button(page,'saveOnly').click();await page.reload();await page.evaluate(id=>PM.resume(id),id);await screen(page,'showroom');
  expect((await state(page)).ui).toMatchObject({dev:'mercury',media:'floors'});expect(await spatialState(page,'mercury')).toEqual(mercury);expect(await spatialState(page)).toEqual(dolphin);
  await button(page,'dev','dolphin').click();await screen(page,'showroom');await button(page,'media','floors').click();
  expect(await spatialState(page)).toEqual(dolphin);await expect(stageButton(page,'direction','west')).toHaveAttribute('aria-pressed','true');
});

test('illustrative outlook directions open protected fullscreen without plan tools and Escape preserves floor state',async({page})=>{
  await development(page);const fixture=await spatialFixture(page);await openFloor(page,fixture);await selectFootprint(page,fixture);
  await stageButton(page,'view','outlook').click();const images=[];
  for(const direction of ['north','east','south','west']){
    await stageButton(page,'direction',direction).click();await expect(stageButton(page,'direction',direction)).toHaveAttribute('aria-pressed','true');
    await expect(spatialStage(page).locator('.sp-panorama')).toHaveAttribute('aria-label',`${fixture.building.name}, ${fixture.floor.label}, ${direction}. Illustrative view · not an actual outlook`);
    images.push(await spatialStage(page).locator('.sp-panorama').innerHTML());
  }
  expect(new Set(images).size).toBe(4);const before=await spatialState(page);
  await stageButton(page,'fullscreen').click();await expect(viewer(page)).toBeVisible();
  await expect(viewer(page)).toContainText('Illustrative view · not an actual outlook');await expect(viewer(page).locator('.pm-viewer-counter')).toHaveText('4 / 4');
  await expect(viewerButton(page,'Draw mode (D)')).toHaveCount(0);await expect(viewer(page).locator('.pm-viewer-compass')).toBeHidden();
  await page.keyboard.press('ArrowLeft');await expect(viewer(page).locator('.pm-viewer-counter')).toHaveText('3 / 4');
  expect(await spatialState(page)).toEqual(before);
  await page.evaluate(()=>{showToast('PRIVATE OUTLOOK ALERT');go('pipeline');openOpp('OPP-1001');});await protectedSurface(page);
  await expect(page.locator('#pm-shell')).not.toContainText('PRIVATE OUTLOOK ALERT');
  await page.keyboard.press('Escape');await expect(viewer(page)).toHaveCount(0);await screen(page,'showroom');
  expect(await spatialState(page)).toEqual(before);await expect(stageButton(page,'fullscreen')).toBeFocused();await protectedSurface(page);
});

test('neighbourhood category pins and list share selected details with honest demo labels and no geographic links',async({page})=>{
  await development(page);
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await button(page,'media','location').click();
  const stage=neighbourhood(page),pins=stage.locator('.nb-pin'),places=stage.locator('.nb-place');
  const all=await places.evaluateAll(els=>els.map(el=>({id:el.dataset.arg,label:el.querySelector('strong').textContent,category:el.querySelector('small').textContent.split(' · ')[0]})));
  expect(all.length).toBeGreaterThan(0);expect(new Set(all.map(p=>p.id)).size).toBe(all.length);
  await expect(pins).toHaveCount(all.length+1);await expect(stage.locator('.nb-selection')).toContainText('Development anchor · Demo');
  const categories=await stage.locator('[data-pm="nb-category"]').evaluateAll(els=>els.map(el=>({id:el.dataset.arg,label:el.textContent.trim()})));
  expect(categories.map(c=>c.id)).toEqual(['all','transport','education','dining','shopping','health','recreation']);
  for(const category of categories.filter(c=>c.id!=='all')){
    await button(page,'nb-category',category.id).click();await expect(button(page,'nb-category',category.id)).toHaveAttribute('aria-pressed','true');
    const expected=all.filter(p=>p.category===category.label);expect(expected.length).toBeGreaterThan(0);
    expect(await places.evaluateAll(els=>els.map(el=>el.dataset.arg))).toEqual(expected.map(p=>p.id));
    expect(await pins.evaluateAll(els=>els.map(el=>el.dataset.arg).sort())).toEqual([...expected.map(p=>p.id),'development'].sort());
    for(const poi of expected){
      expect(poi.id).toMatch(/^demo-/);expect(poi.label).toMatch(/^Example /);
      const pin=stage.locator(`.nb-pin[data-arg="${poi.id}"]`),list=stage.locator(`.nb-place[data-arg="${poi.id}"]`);
      await pin.click();await expect(pin).toHaveAttribute('aria-pressed','true');await expect(list).toHaveAttribute('aria-pressed','true');
      await expect(pin).toHaveAttribute('aria-label',`${poi.label} · ${category.label} · demo place`);
      await expect(stage.locator('.nb-selection h3')).toHaveText(poi.label);await expect(stage.locator('.nb-selection')).toContainText('No verified location, distance or route information.');
      await button(page,'nb-clear').click();await expect(pin).toHaveAttribute('aria-pressed','false');
      await list.focus();await page.keyboard.press('Enter');await expect(pin).toHaveAttribute('aria-pressed','true');await expect(list).toBeFocused();
    }
  }
  await button(page,'nb-category','transport').click();expect((await neighbourhoodState(page)).poiId).toBeNull();
  await expect(stage.locator('.nb-selection h3')).toHaveText('Choose a place to explore');
  await button(page,'nb-reset').click();await expect(places).toHaveCount(all.length);
  expect(await neighbourhoodState(page)).toEqual({category:'all',poiId:'development',viewport:{x:.5,y:.5,zoom:1}});
  await expect(stage.locator('a[href], iframe, img, [data-lat], [data-lng]')).toHaveCount(0);
  const text=await stage.textContent();expect(text).not.toMatch(/https?:\/\/|google|openstreetmap|\b\d+(?:\.\d+)?\s*(?:km|minutes|min walk)\b/i);
  await expect(stage.locator('.nb-footer')).toContainText('not a geographic basemap');
  expect(requests,'Location must not fetch tiles, POIs, routes or external imagery').toEqual([]);await noLiveConfig(page);
});

test('neighbourhood mounted keyboard, wheel and mouse pan update transform and storage; reset clears selection and filters',async({page})=>{
  await development(page);await button(page,'media','location').click();
  const map=neighbourhood(page).locator('.nb-map'),world=neighbourhood(page).locator('.nb-world');
  await map.scrollIntoViewIfNeeded();const node=await map.elementHandle();await map.focus();await page.keyboard.press('=');
  await expect(neighbourhood(page).locator('.nb-zoom-value')).toHaveText('125%');
  const before=await neighbourhoodState(page);await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');
  const moved=await neighbourhoodState(page);expect(moved.viewport.x).toBeGreaterThan(before.viewport.x);expect(moved.viewport.y).toBeGreaterThan(before.viewport.y);
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowUp');
  expect((await neighbourhoodState(page)).viewport.x).toBeCloseTo(before.viewport.x,8);expect((await neighbourhoodState(page)).viewport.y).toBeCloseTo(before.viewport.y,8);
  await page.keyboard.press('-');await expect(neighbourhood(page).locator('.nb-zoom-value')).toHaveText('100%');
  const box=await map.boundingBox();await page.mouse.move(box.x+box.width*.55,box.y+box.height*.55);await page.mouse.wheel(0,-120);
  await expect.poll(async()=>(await neighbourhoodState(page)).viewport.zoom).toBeGreaterThan(1);
  const wheel=await neighbourhoodState(page),transform=await world.getAttribute('style');
  await page.mouse.down();await page.mouse.move(box.x+box.width*.55-35,box.y+box.height*.55-20,{steps:6});await page.mouse.up();
  const dragged=await neighbourhoodState(page);expect(dragged.viewport.x).toBeGreaterThan(wheel.viewport.x);expect(dragged.viewport.y).toBeGreaterThan(wheel.viewport.y);expect(dragged.poiId).toBe('development');
  expect(await world.getAttribute('style')).not.toBe(transform);expect(await node.evaluate(el=>el.isConnected)).toBe(true);
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).sessions[PM.session.id].ui.neighbourhood.dolphin,key)).toEqual(dragged);
  await button(page,'nb-category','dining').click();await neighbourhood(page).locator('.nb-place').first().click();
  await map.focus();await page.keyboard.press('Home');expect(await neighbourhoodState(page)).toEqual({category:'all',poiId:'development',viewport:{x:.5,y:.5,zoom:1}});
  await expect(button(page,'nb-zoom-out')).toHaveAttribute('aria-disabled','true');
  await button(page,'nb-zoom-in').click();await expect(neighbourhood(page).locator('.nb-zoom-value')).toHaveText('125%');
  await button(page,'nb-zoom-out').click();await expect(neighbourhood(page).locator('.nb-zoom-value')).toHaveText('100%');
  await page.keyboard.press('Escape');await screen(page,'portfolio');await protectedSurface(page);
});

test('neighbourhood filters, place and viewport are isolated by development and survive save/resume',async({page})=>{
  await page.evaluate(()=>PM.presentDevelopments(['dolphin','mercury']));await questions(page);await screen(page,'showroom');
  await button(page,'media','location').click();await button(page,'nb-category','education').click();await button(page,'nb-zoom-in').click();await neighbourhood(page).locator('.nb-place').first().click();
  const dolphin=await neighbourhoodState(page);await button(page,'nextDevelopment').click();await screen(page,'showroom');await button(page,'media','location').click();
  expect(await neighbourhoodState(page,'mercury')).toEqual({category:'all',poiId:'development',viewport:{x:.5,y:.5,zoom:1}});
  await button(page,'nb-category','dining').click();await neighbourhood(page).locator('.nb-place').last().click();await button(page,'nb-zoom-in').click();
  const mercury=await neighbourhoodState(page,'mercury'),id=(await state(page)).id;expect(await neighbourhoodState(page)).toEqual(dolphin);
  await checkout(page);await button(page,'saveOnly').click();await page.reload();await page.evaluate(id=>PM.resume(id),id);await screen(page,'showroom');
  expect((await state(page)).ui).toMatchObject({dev:'mercury',media:'location'});expect(await neighbourhoodState(page,'mercury')).toEqual(mercury);
  await button(page,'dev','dolphin').click();await screen(page,'showroom');await button(page,'media','location').click();
  expect(await neighbourhoodState(page)).toEqual(dolphin);await expect(button(page,'nb-category','education')).toHaveAttribute('aria-pressed','true');
  await expect(neighbourhood(page).locator(`.nb-place[data-arg="${dolphin.poiId}"]`)).toHaveAttribute('aria-pressed','true');
});

for(const device of [{name:'mobile',width:390,height:844,dark:false},{name:'dark tablet portrait',width:834,height:1194,dark:true},{name:'dark tablet landscape',width:1194,height:834,dark:true}])test(`${device.name} spatial outline, actions and neighbourhood remain accessible without horizontal overflow`,async({page})=>{
  await page.setViewportSize({width:device.width,height:device.height});if(device.dark)await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  await development(page);const fixture=await spatialFixture(page);await noExplorerOverflow(page);await openFloor(page,fixture);await noExplorerOverflow(page);
  const outline=active(page,'.sp-silhouette');await expect(outline).toHaveCount(1);await outline.scrollIntoViewIfNeeded();await expect(outline).toBeInViewport();
  await expect(outline.locator('.sp-level-active')).toHaveCount(1);
  await selectFootprint(page,fixture,'Enter');
  for(const target of [stageButton(page,'floor',fixture.floor.value),button(page,'sp-explore',fixture.unit.id),button(page,'sp-shortlist',fixture.unit.id)]){
    await target.scrollIntoViewIfNeeded();await expect(target).toBeInViewport();await expect(target).toBeEnabled();
    const box=await target.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    await target.focus();await expect(target).toBeFocused();
  }
  if(device.dark)expect(await spatialStage(page).locator('.sp-stage-content').evaluate(el=>getComputedStyle(el).getPropertyValue('--sp-paper').trim())).toBe('#252e28');
  await noExplorerOverflow(page);await button(page,'sp-shortlist',fixture.unit.id).click();
  await stageButton(page,'view','outlook').click();await noExplorerOverflow(page);await stageButton(page,'fullscreen').click();await expect(viewer(page)).toBeVisible();await page.keyboard.press('Escape');await screen(page,'showroom');
  await button(page,'media','location').click();await noExplorerOverflow(page);
  if(device.dark)expect(await neighbourhood(page).evaluate(el=>getComputedStyle(el).getPropertyValue('--nb-land').trim())).toBe('#2d352e');
  await button(page,'nb-category','health').click();const place=neighbourhood(page).locator('.nb-place').first();await place.scrollIntoViewIfNeeded();await place.focus();await page.keyboard.press('Space');
  await expect(place).toHaveAttribute('aria-pressed','true');await expect(neighbourhood(page).locator('.nb-selection')).toContainText('Demo place');await noExplorerOverflow(page);await protectedSurface(page);
});

test('demo geometry, outlooks and POIs never enter buyer output or Custom Pack configuration',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);await development(page);const fixture=await spatialFixture(page);await openFloor(page,fixture);await selectFootprint(page,fixture);
  await button(page,'sp-shortlist',fixture.unit.id).click();const before=await specification(page,fixture.unit.id);
  await stageButton(page,'view','outlook').click();await stageButton(page,'direction','east').click();await stageButton(page,'fullscreen').click();await page.keyboard.press('Escape');
  await button(page,'media','location').click();await button(page,'nb-category','shopping').click();await neighbourhood(page).locator('.nb-place').first().click();await button(page,'nb-zoom-in').click();
  const demoLabels=await neighbourhood(page).locator('.nb-place strong').allTextContents();
  expect((await state(page)).ui.spatial.dolphin.view).toBe('outlook');expect((await neighbourhoodState(page)).poiId).toMatch(/^demo-/);
  const forbidden=/(?:"(?:spatial|neighbourhood|geometry|footprints|byBuilding|viewport|poiId|facadeIndex)"|sp-demo-outlook|demo-[ab]"|demo-(?:bus|ferry|school|cafe|bistro|market|grocer|clinic|park|promenade)|sp-panorama|nb-geography|Courtyard House|Garden House)/;
  await checkout(page);await prepare(page);
  const output=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).outputs[PM.session.ui.output],key);
  expect(output.items.find(i=>i.unit_id===fixture.unit.id).config).toEqual(before.config);expect(JSON.stringify(output)).not.toMatch(forbidden);
  for(const label of demoLabels)expect(JSON.stringify(output)).not.toContain(label);
  await button(page,'preview').click();await screen(page,'preview');
  await expect(page.locator('#pm-shell .sp-diagram, #pm-shell .sp-silhouette, #pm-shell .nb-geography, #pm-shell [data-pm^="sp-"], #pm-shell [data-pm^="nb-"]')).toHaveCount(0);
  expect(await page.locator('#pm-shell').innerText()).not.toMatch(forbidden);await noLiveConfig(page);
  await button(page,'previewBack').click();await button(page,'share').click();await button(page,'copy').click();await screen(page,'ready');await button(page,'followup').click();
  await expect(page.locator('#p-crwiz.on')).toBeVisible();
  const pack=await page.evaluate(id=>({cfg:crState.cfg,price:crPrice(id),ids:crState.unitIds}),fixture.unit.id);
  expect(pack.ids).toEqual([fixture.unit.id]);expect(pack.cfg[fixture.unit.id]).toMatchObject(before.config);expect(pack.price).toBe(before.price);
  expect(JSON.stringify(pack.cfg)).not.toMatch(forbidden);for(const label of demoLabels)expect(JSON.stringify(pack.cfg)).not.toContain(label);
});

// Intro and Project are separate surfaces. Ignore only the navigation save
// timestamp when checking that viewing media leaves source/canonical data alone.
const sourceSnapshot=page=>page.evaluate(()=>({units:UNITS,devs:DEVS,tray:trState,selection:{...PM.selection,updated_at:undefined}}));
const projectIntro=page=>page.locator('#pm-shell .pm-project-intro');
const facadeLevel=(page,value)=>spatialStage(page).locator(`.sp-facade-level[data-pm="sp-open-floor"][data-arg="${value}"]`);

test('each newly opened development starts on Intro with a left hero and Units, preserving source and canonical selection',async({page})=>{
  await page.evaluate(()=>{
    for(const id of ['dolphin','mercury'])DEV(id).media.video={};
    const o=OPPS.find(o=>o.id==='OPP-1009');o.devs=['Dolphin Court','Mercury'];o.units=['#CM1201'];
    const x=getExt(o);delete x.presentPreferences;x.unitConfigs={'#CM1201':{layout:'open-kitchen',preset:'std',pack:'urban'}};
    PM.presentOpportunity(o.id);
  });
  await questions(page);await screen(page,'showroom');
  const before=await sourceSnapshot(page),canonical=await specification(page),sessionId=(await state(page)).id;
  expect(canonical).toEqual({config:{layout:'open-kitchen',preset:'std',pack:'urban'},price:329000});
  const rail=page.getByRole('navigation',{name:'Project media'});
  for(const id of ['dolphin','mercury']){
    const d=await page.evaluate(id=>DEV(id),id);
    expect((await state(page)).ui).toMatchObject({dev:id,media:'intro',panel:'units'});
    await expect(rail.getByRole('button',{name:'Intro',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(rail.getByRole('button',{name:'Project',exact:true})).toHaveAttribute('data-arg','exterior');
    await expect(rail.getByRole('button',{name:'Exterior',exact:true})).toHaveCount(0);
    await expect(projectIntro(page)).toHaveAttribute('aria-label',`${d.name} project introduction`);
    await expect(projectIntro(page).locator('h1')).toHaveText(d.name);
    await expect(projectIntro(page)).toContainText(d.tag);await expect(projectIntro(page)).toContainText(d.loc);
    await expect(projectIntro(page).locator('video')).toHaveCount(0);
    const hero=projectIntro(page).locator('.pm-stage-photo');
    await expect(hero).toHaveAttribute('src',await page.evaluate(id=>UN_ASSET+(DEV(id).media.renders.ext[0]?.img||DEV(id).photo),id));
    await expect.poll(()=>hero.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    const left=await projectIntro(page).boundingBox(),right=await active(page,'.pm-panel').boundingBox();
    expect(left.x+left.width).toBeLessThanOrEqual(right.x+1);
    await expect(button(page,'panel','units')).toHaveClass(/selected/);await expect(spatialStage(page)).toHaveCount(0);
    await projectIntro(page).getByRole('button',{name:'Explore project →',exact:true}).click();
    await expect(spatialStage(page)).toBeVisible();expect((await state(page)).ui.media).toBe('exterior');
    await expect(rail.getByRole('button',{name:'Project',exact:true})).toHaveAttribute('aria-pressed','true');
    await button(page,'media','intro').click();
    if(id==='dolphin'){
      await unit(page);expect((await state(page)).ui.unitMediaReturn).toBe('intro');
      await button(page,'back').click();await screen(page,'showroom');await expect(projectIntro(page)).toBeVisible();
      await button(page,'nextDevelopment').click();await screen(page,'showroom');
    }
  }
  await button(page,'dev','dolphin').click();await screen(page,'showroom');
  expect((await state(page)).ui).toMatchObject({dev:'dolphin',media:'intro',panel:'units'});
  expect((await state(page)).id).toBe(sessionId);expect(await specification(page)).toEqual(canonical);
  expect(await sourceSnapshot(page)).toEqual(before);await noLiveConfig(page);await protectedSurface(page);
});

for(const media of ['intro','exterior'])test(`saved ${media} media resumes unchanged; Project keeps its legacy exterior state value`,async({page})=>{
  await development(page);await unit(page);const canonical=await specification(page);await button(page,'back').click();
  if(media==='exterior')await projectMedia(page);
  const id=(await state(page)).id;
  await checkout(page);await button(page,'saveOnly').click();
  expect(await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).sessions[id].ui.media,{key,id})).toBe(media);
  for(let attempt=0;attempt<2;attempt++){
    await page.reload();await page.evaluate(id=>PM.resume(id),id);await screen(page,'showroom');
    expect((await state(page)).ui).toMatchObject({dev:'dolphin',media,panel:'units'});
    await expect(button(page,'media',media)).toHaveAttribute('aria-pressed','true');
    await expect(media==='intro'?projectIntro(page):spatialStage(page)).toBeVisible();
    expect(await specification(page)).toEqual(canonical);
  }
});

// Generate a tiny real WebM in browser memory and serve it only through a test
// route. Playback is real (no play()/media-property stubs), with no fixture files
// or external film network dependency.
async function introFilmFixture(page,broken){
  const url='/__present_test_assets__/intro-film.webm';
  let body;
  if(!broken)body=Buffer.from(await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
    const ctx=canvas.getContext('2d'),stream=canvas.captureStream(10),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});
    recorder.ondataavailable=e=>chunks.push(e.data);
    const finished=new Promise(resolve=>{recorder.onstop=resolve;});
    recorder.start();let frame=0;
    const paint=setInterval(()=>{ctx.fillStyle=++frame%2?'#77806b':'#354338';ctx.fillRect(0,0,64,64);},40);
    await new Promise(resolve=>setTimeout(resolve,350));recorder.stop();await finished;
    clearInterval(paint);stream.getTracks().forEach(track=>track.stop());
    return [...new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer())];
  }));
  await page.route('**/__present_test_assets__/intro-film.webm',route=>route.fulfill(broken?{status:404,body:'Missing isolated film fixture'}:{contentType:'video/webm',body}));
  await page.evaluate(url=>{DEV('dolphin').media.video={url};},url);
  return url;
}

for(const motion of ['no-preference','reduce'])for(const broken of [false,true])test(`Intro film ${broken?'error falls back to hero':'loads real fixture'} with ${motion} motion`,async({page})=>{
  await page.emulateMedia({reducedMotion:motion});
  const url=await introFilmFixture(page,broken);
  const requested=page.waitForResponse(response=>new URL(response.url()).pathname===url);
  // Reduced-motion setup auto-advances the company intro; normal motion keeps
  // the explicit Continue button. Neither bypasses the real question flow.
  await page.evaluate(()=>prOpenDev('dolphin'));
  if(motion==='no-preference')await button(page,'introContinue').click();
  await questions(page);await screen(page,'showroom');
  expect((await requested).status()).toBe(broken?404:200);
  expect((await state(page)).ui).toMatchObject({media:'intro',panel:'units'});
  const before=await sourceSnapshot(page),film=projectIntro(page).locator('.pm-intro-film'),hero=projectIntro(page).locator('.pm-stage-photo');
  await expect(film).toHaveAttribute('controls','');await expect(film).toHaveAttribute('muted','');await expect(film).toHaveAttribute('playsinline','');
  await expect(film).toHaveJSProperty('muted',true);await expect(film).toHaveJSProperty('playsInline',true);await expect(film).toHaveJSProperty('controls',true);
  await expect(film).toHaveJSProperty('autoplay',motion==='no-preference');
  await expect(film).toHaveAttribute('poster',await hero.getAttribute('src'));
  if(broken){
    await expect(film).toBeHidden();await expect(film).not.toHaveAttribute('src',/.+/);
    await expect(projectIntro(page).getByRole('status')).toHaveText('Film unavailable · showing project hero');
    await expect(hero).toBeVisible();await expect.poll(()=>hero.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  }else{
    await expect(film).toBeVisible();await expect(film).toHaveAttribute('src',url);
    await expect.poll(()=>film.evaluate(video=>video.readyState)).toBeGreaterThanOrEqual(2);
    await expect(film).toHaveJSProperty('paused',motion==='reduce');
    if(motion==='reduce'){
      await expect(film).not.toHaveAttribute('autoplay','');await expect(film).toHaveJSProperty('currentTime',0);
      await expect(film).toHaveJSProperty('loop',false);
    }else await expect.poll(()=>film.evaluate(video=>video.currentTime)).toBeGreaterThan(0);
    await expect(projectIntro(page).getByRole('status')).toBeHidden();
  }
  await expect(projectIntro(page).getByRole('button',{name:'Explore residences',exact:true})).toBeVisible();
  await projectMedia(page);await expect(projectIntro(page).locator('video')).toHaveCount(0);
  expect(await sourceSnapshot(page)).toEqual(before);await protectedSurface(page);
});

test('facade levels highlight and reveal exact floor callouts on hover and focus without changing selection or source',async({page})=>{
  await development(page);const fixture=await spatialFixture(page);
  await unit(page,fixture.unit.id);await button(page,'back').click();await projectMedia(page);
  const before=await sourceSnapshot(page);
  for(const building of fixture.project.buildings){
    await stageButton(page,'building',building.id).click();
    for(let side=0;side<building.facades.length;side++){
      await stageButton(page,'facade',side).click();
      const bands=spatialStage(page).locator('.sp-facade-level');
      expect(await bands.evaluateAll(els=>els.map(el=>Number(el.dataset.arg)).sort((a,b)=>a-b))).toEqual(building.floors.map(f=>f.value));
      const selected=(await spatialState(page)).floor,targetFloor=building.floors.find(f=>f.value!==selected);
      expect(targetFloor,'Fixture needs an unselected floor to distinguish highlight from selection').toBeTruthy();
      const target=facadeLevel(page,targetFloor.value),callout=target.locator('.sp-floor-callout'),band=target.locator('.sp-facade-band');
      await expect(target).toHaveAttribute('role','button');await expect(target).toHaveAttribute('tabindex','0');
      await expect(target).toHaveAttribute('aria-pressed','false');
      await expect(target).toHaveAttribute('aria-label',`${targetFloor.label} · ${targetFloor.registered} registered units · ${targetFloor.available} available; open floor plan`);
      await expect(callout).toContainText(`${targetFloor.label} · Open floor plan →`);
      await page.mouse.move(0,0);await expect(callout).toHaveCSS('opacity','0');
      const normal=await band.evaluate(el=>({fill:getComputedStyle(el).fill,stroke:getComputedStyle(el).strokeWidth})),s=await spatialState(page);
      // Check the unobstructed quarter of every band here; the entrance-covered
      // centre of the arrival elevation has its own regression below.
      const hit=target.locator('.sp-floor-hit');await hit.scrollIntoViewIfNeeded();const box=await hit.boundingBox();
      await hit.hover({position:{x:box.width*.25,y:box.height*.5}});await expect(callout).toHaveCSS('opacity','1');await expect(band).toHaveCSS('stroke-width','4px');
      expect(await band.evaluate(el=>getComputedStyle(el).fill)).not.toBe(normal.fill);
      expect(await spatialState(page)).toEqual(s);
      await page.mouse.move(0,0);await expect(callout).toHaveCSS('opacity','0');await expect(band).toHaveCSS('fill',normal.fill);
      await target.focus();await expect(target).toBeFocused();await expect(callout).toHaveCSS('opacity','1');await expect(band).toHaveCSS('stroke-width','4px');
      expect(await spatialState(page)).toEqual(s);expect((await state(page)).ui.media).toBe('exterior');
      await stageButton(page,'facade',side).focus();await expect(callout).toHaveCSS('opacity','0');await expect(band).toHaveCSS('stroke-width',normal.stroke);
    }
  }
  expect(await sourceSnapshot(page)).toEqual(before);
});

test('arrival elevation entrance artwork does not block Ground-floor hover or direct plan activation',async({page})=>{
  await page.evaluate(()=>{
    DEV('dolphin').floors=[0,3];
    UNITS.filter(u=>u.dev===DEV('dolphin').name).forEach((u,i)=>{u.floor=[0,0,3,3][i%4];});
  });
  await development(page);await projectMedia(page);
  const p=await page.evaluate(()=>PMSpatial.project('dolphin')),b=p.buildings[0];
  await stageButton(page,'building',b.id).click();await stageButton(page,'facade',1).click();
  const level=facadeLevel(page,0),hit=level.locator('.sp-floor-hit');await hit.scrollIntoViewIfNeeded();
  const box=await hit.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  // Real pointer coordinates, not forced or synthetic SVG activation: artwork
  // painted above the band must not make part of its hit target inert.
  await page.mouse.move(x,y);
  await expect.soft(level.locator('.sp-floor-callout')).toHaveCSS('opacity','1');
  await page.mouse.click(x,y);
  await expect.poll(async()=>(await state(page)).ui.media).toBe('floors');
  expect(await spatialState(page)).toMatchObject({buildingId:b.id,floor:0,view:'plan'});
  await expect(spatialStage(page).locator('[data-sp-plan]')).toBeVisible();
});

test.describe('direct facade floor activation',()=>{
  test.use({hasTouch:true});
  for(const activation of ['click','tap','Enter','Space'])test(`${activation} opens the exact building floor plan from outlook and unit Back restores it`,async({page})=>{
    await development(page);const fixture=await spatialFixture(page);
    for(const building of fixture.project.buildings){
      const floor=building.floors.filter(f=>f.unitIds.some(id=>fixture.units.find(u=>u.id===id)?.status==='available')).at(-1);
      expect(floor,'Each fixture building needs an available residence').toBeTruthy();
      const u=fixture.units.find(u=>floor.unitIds.includes(u.id)&&u.status==='available'),target={...fixture,building,floor,unit:u};
      // Seed a real canonical selection, then leave the remembered building in
      // outlook on another floor so direct activation must explicitly choose plan.
      await unit(page,u.id);const canonical=await specification(page,u.id);await button(page,'back').click();
      await openFloor(page,target);const other=building.floors.find(f=>f.value!==floor.value);
      expect(other).toBeTruthy();await stageButton(page,'floor',other.value).click();
      await stageButton(page,'view','outlook').click();await stageButton(page,'direction','west').click();
      await stageButton(page,'exterior').click();await stageButton(page,'facade',2).click();
      expect((await spatialState(page)).view).toBe('outlook');
      const before=await sourceSnapshot(page),level=facadeLevel(page,floor.value);
      if(activation==='click')await level.locator('.sp-floor-hit').click();
      else if(activation==='tap')await level.locator('.sp-floor-hit').tap();
      else {await level.focus();await page.keyboard.press(activation);}
      await screen(page,'showroom');expect((await state(page)).ui.media).toBe('floors');
      expect(await spatialState(page)).toMatchObject({buildingId:building.id,floor:floor.value,view:'plan',unitId:null,facadeIndex:2});
      const plan=spatialStage(page).locator('[data-sp-plan]');await expect(plan).toBeVisible();
      await expect(plan).toHaveAttribute('aria-label',`${building.name}, ${floor.label}, whole-level demo plan. Select a footprint or use the unit buttons below.`);
      expect(await spatialStage(page).locator('.sp-footprint').evaluateAll(els=>els.map(el=>el.dataset.arg).sort())).toEqual([...floor.unitIds].sort());
      await expect(stageButton(page,'view','plan')).toHaveAttribute('aria-pressed','true');await expect(stageButton(page,'floor',floor.value)).toHaveAttribute('aria-pressed','true');
      expect(await sourceSnapshot(page)).toEqual(before);
      await selectFootprint(page,target);await stageButton(page,'zoom-in').click();
      const returnState=await spatialState(page),box=await plan.getAttribute('viewBox');
      await button(page,'sp-explore',u.id).click();await screen(page,'unit');
      expect((await state(page)).ui).toMatchObject({unit:u.id,unitReturn:'showroom',unitMediaReturn:'floors'});
      expect(await specification(page,u.id)).toEqual(canonical);await button(page,'back').click();await screen(page,'showroom');
      expect((await state(page)).ui.media).toBe('floors');expect(await spatialState(page)).toEqual(returnState);
      await expect(plan).toHaveAttribute('viewBox',box);await expect(footprint(page,u.id)).toHaveAttribute('aria-pressed','true');
      expect(await sourceSnapshot(page)).toEqual(before);await protectedSurface(page);
      // The second building starts from the normal Units list, not the spatial panel.
      await projectMedia(page);
    }
  });
});

test('floor navigation projection honors explicit metadata, whole-word villa types and recorded levels without mutating sources',async({page})=>{
  const results=await page.evaluate(()=>{
    const d=DEV('dolphin'),rows=UNITS.filter(u=>u.dev===d.name);
    const cases=[
      {name:'false overrides apartment floors and registry',setting:false,types:['Apartment'],floors:[0,3],registry:[19],expected:[]},
      {name:'villa-only default suppresses placeholder floors and registry',types:['Villa','Detached VILLA','Semi-detached villa'],floors:[0,3],registry:[19],expected:[]},
      {name:'false also suppresses villas',setting:false,types:['Villa'],floors:[0],registry:[19],expected:[]},
      {name:'true opts villas into recorded sparse levels',setting:true,types:['Detached Villa'],floors:[-2,'3',11],registry:[19],expected:[-2,3,11,19]},
      {name:'villa substring is not a whole word',types:['Villaggio apartment','Villas'],floors:[0,3],expected:[0,3]},
      {name:'mixed inventory is not villa-only',types:['Villa','Apartment'],floors:[0,3],expected:[0,3]},
      {name:'no recorded levels does not invent Ground',types:['Apartment'],floors:[null,'',undefined,'unrecorded',NaN,Infinity],expected:[]},
      {name:'true cannot invent missing levels',setting:true,types:['Villa'],floors:[null,''],expected:[]},
      {name:'explicit registry can supply an empty recorded level',types:['Apartment'],floors:[null,''],registry:[19],expected:[19]},
    ];
    return cases.map(c=>{
      d.presentSpatial={};if(c.setting!==undefined)d.presentSpatial.floorNavigation=c.setting;
      d.floors=c.registry||[];rows.forEach((u,i)=>{u.type=c.types[i%c.types.length];u.floor=c.floors[i%c.floors.length];});
      const before=JSON.stringify({units:UNITS,devs:DEVS}),p=PMSpatial.project(d.id);
      return {name:c.name,expected:c.expected,project:p,ids:rows.map(u=>u.id).sort(),available:rows.filter(u=>u.status==='available').length,unchanged:before===JSON.stringify({units:UNITS,devs:DEVS})};
    });
  });
  for(const {name,expected,project:p,ids,available,unchanged} of results){
    expect(unchanged,name).toBe(true);expect(p.hasFloors,name).toBe(expected.length>0);
    expect(p.registered,name).toBe(ids.length);expect(p.available,name).toBe(available);
    expect(p.buildings.flatMap(b=>b.unitIds).sort(),name).toEqual(ids);
    for(const b of p.buildings)expect(b.floors.map(f=>f.value),name).toEqual(expected);
  }
});

async function floorlessFixture(page,kind){
  return page.evaluate(kind=>{
    const d=DEV('dolphin'),rows=UNITS.filter(u=>u.dev===d.name);
    d.presentSpatial=kind==='metadata'?{floorNavigation:false}:{};d.floors=kind==='no levels'?[]:[19];
    rows.forEach((u,i)=>{u.type=kind==='villa'?['Villa','Detached VILLA','Semi-detached villa'][i%3]:'Apartment';u.floor=kind==='no levels'?[null,'','unrecorded'][i%3]:i%2?3:0;});
    return {project:PMSpatial.project(d.id),ids:rows.map(u=>u.id).sort(),unit:rows.find(u=>u.status==='available').id};
  },kind);
}
async function noFloorActions(page){
  await expect(page.getByRole('navigation',{name:'Project media'}).getByRole('button',{name:'Floors',exact:true})).toHaveCount(0);
  await expect(page.locator('#pm-shell [data-pm="media"][data-arg="floors"], #pm-shell [data-pm="sp-floors"], #pm-shell [data-pm="sp-open-floor"], #pm-shell [data-pm="sp-floor"], #pm-shell [data-pm="sp-floor-up"], #pm-shell [data-pm="sp-floor-down"]')).toHaveCount(0);
  await expect(page.locator('#pm-shell .sp-facade-level, #pm-shell .sp-facade-band, #pm-shell .sp-floor-hit, #pm-shell .sp-floor-callout, #pm-shell .sp-silhouette, #pm-shell [data-sp-plan]')).toHaveCount(0);
}

for(const kind of ['metadata','villa','no levels'])test(`floorless ${kind} hides floor actions and bands, retains units and redirects stale saved Floors to Project`,async({page})=>{
  const fixture=await floorlessFixture(page,kind);expect(fixture.project.hasFloors).toBe(false);
  await development(page);expect((await state(page)).ui.media).toBe('intro');await noFloorActions(page);
  await projectMedia(page);await field(page,'filter.unavailable').check();
  expect(await active(page,'.pm-unit-row [data-pm="unit"]').evaluateAll(els=>els.map(el=>el.dataset.arg).sort())).toEqual(fixture.ids);
  for(const b of fixture.project.buildings){
    expect(b.floors).toEqual([]);await stageButton(page,'building',b.id).click();
    for(let side=0;side<4;side++){
      await stageButton(page,'facade',side).click();await noFloorActions(page);
      await expect(spatialStage(page).locator('.sp-art svg')).toHaveAttribute('aria-label',`${b.name}, illustrative ${b.facades[side]}`);
      await expect(spatialStage(page).locator('.sp-art .sp-wall')).toHaveCount(1);
    }
    await expect(spatialStage(page)).toContainText('Explore individual properties in the Units list.');
  }
  await unit(page,fixture.unit);const canonical=await specification(page,fixture.unit);await button(page,'back').click();
  expect((await state(page)).ui.media).toBe('exterior');await noFloorActions(page);
  const before=await sourceSnapshot(page);
  const guarded=await page.evaluate(()=>{
    const state=structuredClone(PM.session.ui.spatial.dolphin),context={developmentId:'dolphin',mode:'exterior',state};
    return ['sp-floors','sp-open-floor'].map(action=>PMSpatial.handleAction(action,'0',context));
  });
  for(const result of guarded){expect(result.handled).toBe(true);expect(result.media).toBeUndefined();}
  expect(await sourceSnapshot(page)).toEqual(before);
  const id=(await state(page)).id;await checkout(page);await button(page,'saveOnly').click();
  // Emulate a genuine persisted legacy Floors session only after closing.
  await page.evaluate(({key,id})=>{
    const saved=JSON.parse(localStorage.getItem(key));saved.sessions[id].ui.media='floors';
    localStorage.setItem(key,JSON.stringify(saved));
  },{key,id});
  await page.reload();await floorlessFixture(page,kind);await page.evaluate(id=>PM.resume(id),id);await screen(page,'showroom');
  expect((await state(page)).ui.media).toBe('exterior');await expect(spatialStage(page)).toBeVisible();
  await expect(button(page,'media','exterior')).toHaveAttribute('aria-pressed','true');await noFloorActions(page);
  expect(await specification(page,fixture.unit)).toEqual(canonical);
  expect(await active(page,'.pm-unit-row [data-pm="unit"]').evaluateAll(els=>els.map(el=>el.dataset.arg).sort())).toEqual(fixture.ids);
  expect(await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).sessions[id].ui.media,{key,id})).toBe('exterior');
  await protectedSurface(page);
});

test('a live stale Floors rail click reroutes to Project after floor navigation is disabled',async({page})=>{
  await development(page);const floors=button(page,'media','floors');await expect(floors).toBeVisible();
  await floorlessFixture(page,'metadata');const before=await sourceSnapshot(page);
  await floors.click();await screen(page,'showroom');expect((await state(page)).ui.media).toBe('exterior');
  await expect(spatialStage(page)).toBeVisible();await noFloorActions(page);
  expect(await sourceSnapshot(page)).toEqual(before);
});

test('explicit floorNavigation true restores villa Floors and direct level plans using recorded inventory',async({page})=>{
  await floorlessFixture(page,'villa');
  await page.evaluate(()=>{DEV('dolphin').presentSpatial.floorNavigation=true;});
  await development(page);await expect(button(page,'media','floors')).toBeVisible();
  const fixture=await spatialFixture(page);expect(fixture.project.hasFloors).toBe(true);
  await projectMedia(page);const before=await sourceSnapshot(page);
  for(const b of fixture.project.buildings){
    await stageButton(page,'building',b.id).click();
    await expect(spatialStage(page).locator('.sp-facade-level')).toHaveCount(b.floors.length);
    expect(b.floors.map(f=>f.value)).toEqual([0,3,19]);
    // A registered empty level is still inspectable, never inferred inventory.
    await facadeLevel(page,19).click();expect((await state(page)).ui.media).toBe('floors');
    expect(await spatialState(page)).toMatchObject({buildingId:b.id,floor:19,view:'plan'});
    await expect(spatialStage(page).locator('[data-sp-plan]')).toBeVisible();
    await expect(spatialStage(page).locator('.sp-footprint')).toHaveCount(0);
    await expect(spatialStage(page)).toContainText('Blank geometry is not available inventory');
    await stageButton(page,'exterior').click();
  }
  expect(await sourceSnapshot(page)).toEqual(before);
});