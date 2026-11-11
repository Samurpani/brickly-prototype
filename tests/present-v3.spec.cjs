const {test,expect}=require('@playwright/test');
const URL='/prototypes/v3/Bricly_OS_Prototype_v3.html';
const screen=page=>page.evaluate(()=>PV3.S?.screen);
async function load(page){await page.goto(URL);await page.evaluate(()=>localStorage.removeItem('bricly.present.v3'));}

test('Present v3 sidebar entry: welcome, loading, gallery, filters and queue',async({page})=>{
  await load(page);
  // Record each screen heading so the short intro screens can't be missed by polling.
  await page.evaluate(()=>{window.__h=[];new MutationObserver(()=>{const h=document.querySelector('#pv-shell h1')?.textContent;if(h&&window.__h.at(-1)!==h)window.__h.push(h);}).observe(document.body,{subtree:true,childList:true});});
  await page.locator('nav .ni',{hasText:'Present'}).first().click();
  await expect.poll(()=>screen(page)).toBe('gallery');
  expect(await page.evaluate(()=>window.__h.slice(0,2))).toEqual(['Welcome to','Loading Developments']);
  await expect(page.locator('.pv-card:not(.side) h2')).toHaveText('Miami Tropic');
  await expect(page.getByRole('button',{name:'Present selection'})).toBeDisabled();
  await page.getByRole('button',{name:/^Filters/}).click();
  await page.locator('[data-a=gFeat][data-v=pool]').click();
  await expect(page.locator('.pv-show')).toContainText(/Show \d+ matching/);
  await page.locator('[data-a=gReset]').click();
  // Filtering happens in the tile view; applying zooms back into the showcase.
  await expect(page.locator('.pv-ftile')).toHaveCount(6);
  await page.locator('.pv-show').click();
  await expect(page.locator('.pv-ftile')).toHaveCount(0);
  await page.locator('.pv-card:not(.side) [data-a=qToggle]').click();
  await page.getByRole('button',{name:'1 developments in the presentation queue'}).click();
  await expect(page.getByRole('dialog',{name:'Presentation queue'})).toContainText('Miami Tropic');
  await page.getByRole('button',{name:'Present selection'}).click();
  await expect.poll(()=>screen(page)).toBe('present');
  await expect(page.locator('.pv-present')).toHaveAttribute('style',/--b-accent:#5A1A33/);
});

test('Present v3 availability, unit page, selection, compare and checkout link',async({page})=>{
  await load(page);
  await page.evaluate(()=>prOpenDev('miami-tropic'));
  await expect.poll(()=>screen(page)).toBe('present');
  await page.getByRole('button',{name:/Introduction/}).click();
  await page.getByRole('dialog',{name:'Pages'}).getByRole('button',{name:'Units and Availability'}).click();
  await page.getByRole('tab',{name:'By floor'}).click();
  await expect(page.locator('.pv-floorno b')).toHaveText('32');
  await page.locator('[data-a=plateUnit][data-v="AP.3203"]').click();
  await page.locator('[data-a=plateUnit][data-v="AP.3203"]').click();
  await expect.poll(()=>screen(page)).toBe('unit');
  await page.getByRole('tab',{name:'Finishes'}).click();
  await page.getByRole('button',{name:'Select Dusk'}).click();
  await expect(page.locator('.pv-ucard .hd .p b')).toHaveText('$1,202,000');
  await page.getByRole('button',{name:'Add to selection'}).click();
  await expect(page.getByRole('button',{name:'In selection'})).toBeVisible();
  await page.evaluate(()=>PV3.toggleSel('#CM1207'));
  await page.getByRole('button',{name:'2 Selected'}).first().click();
  await page.getByRole('button',{name:'Compare 2 units'}).click();
  await expect(page.getByRole('table',{name:'Unit comparison'})).toContainText('Dusk (+$48,000)');
  await page.getByRole('button',{name:/Finish presentation/}).click();
  await expect(page.locator('.pv-thanks h1')).toHaveText('Thank you.');
  await expect(page.getByText('Keep the conversation going.')).toHaveCount(0);
  await page.getByRole('button',{name:/Screen turned away/}).click();
  await page.getByRole('button',{name:'New buyer'}).click();
  await page.getByLabel('Name').fill('Test Buyer');
  await page.getByRole('button',{name:'Create buyer & opportunity'}).click();
  await expect(page.locator('.pv-link code')).toContainText('#present=');
  const info=await page.evaluate(()=>{const o=OPPS.find(x=>x.id===PV3.S.oppId);return {lead:o.lead,units:o.units,fin:getExt(o).unitConfigs['AP.3203'].fin,url:PV3.outputURL(PV3.S.output)};});
  expect(info).toMatchObject({lead:'Test Buyer',units:['AP.3203','#CM1207'],fin:'Dusk'});
  const buyer=await page.context().newPage();await buyer.goto(info.url);
  await expect(buyer.locator('.pv-buyer h1')).toHaveText('Test, your selection');
  await expect(buyer.locator('.pv-bcard')).toHaveCount(2);
});

test('Present v3 unit and opportunity entries skip the gallery',async({page})=>{
  await load(page);
  await page.evaluate(()=>prOpen('#CM1207'));
  await expect.poll(()=>screen(page)).toBe('unit');
  await page.keyboard.press('Escape');
  await expect.poll(()=>screen(page)).toBe('present');
  await page.evaluate(()=>PV3.close());
  await expect(page.locator('#pv-shell')).toHaveCount(0);
  await page.evaluate(()=>PM.presentOpportunity('OPP-1001'));
  await expect.poll(()=>page.evaluate(()=>[PV3.S?.screen,PV3.S?.oppId])).toEqual(['present','OPP-1001']);
});

test('Unit renders: tag in Edit development, publish, and Present shows them by room, finish and style',async({page})=>{
  await load(page);
  await page.evaluate(()=>{curPersona='owner';deOpen('miami-tropic','units');DE.drawer={k:'unit',id:'AP.3203',tab:'renders'};deRender();});
  const drawer=page.locator('#de-drawer');
  await drawer.getByLabel('Preview finish').selectOption('dusk');
  const kitchen=drawer.locator('section[aria-label="Kitchen renders"]');
  await expect(kitchen).toContainText('No Dusk version · buyers keep seeing Stone');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
  await kitchen.locator('input[type=file]').setInputFiles({name:'kitchen_dusk_2-bed.png',mimeType:'image/png',buffer:png});
  await expect(drawer.getByRole('heading',{name:'Tag 1 render'})).toBeVisible();
  await expect(drawer.getByLabel('Finish')).toHaveValue('dusk');
  await expect(drawer.getByLabel('Room · required')).toHaveValue('kitchen');
  await drawer.getByRole('button',{name:'Add 1 render'}).click();
  await expect(kitchen).toContainText('4 renders · 1 shown for this choice');
  await expect(kitchen).not.toContainText('No Dusk version');
  await page.evaluate(()=>{DE.drawer=null;deGo('review');});
  await page.getByRole('button',{name:/^Publish v\d+/}).click();
  await expect.poll(()=>page.evaluate(()=>deState(DEV('miami-tropic')).live.assets.some(a=>a.packs.includes('dusk')&&a.room==='kitchen'))).toBe(true);

  await page.evaluate(()=>prOpen('AP.3203'));
  await expect.poll(()=>screen(page)).toBe('unit');
  await page.getByRole('tab',{name:'Renders'}).click();
  await expect(page.locator('.pv-roomname')).toHaveText('Living room');
  await page.getByRole('button',{name:'Layout, finish and style'}).click();
  const pop=page.getByRole('dialog',{name:'Layout, finish and style'});
  await expect(pop.locator('[data-a=finish]')).toHaveText(['Sand','Stone','Dusk']);
  await expect(pop.locator('[data-a=style]')).toHaveText(['Coastal','Modern']);
  await expect(pop.locator('[data-a=layout]')).toHaveText(['Architect layout','Open-plan kitchen']);
  await pop.getByRole('button',{name:'Dusk'}).click();
  await page.getByRole('button',{name:'Next room'}).click();
  await expect(page.locator('.pv-roomname')).toHaveText('Kitchen');
  await expect(page.locator('.pv-render')).toHaveAttribute('style',/blob:/);
  await page.getByRole('tab',{name:'Views'}).click();
  await expect(page.locator('.pv-viewchips button')).toHaveCount(4);
});

test('Level plans: units match outlines automatically, exceptions are placed from the unit, Present reads the result',async({page})=>{
  await load(page);
  const plate=()=>page.evaluate(()=>PV3D.plate('lalex',1).map(p=>p.u.id).sort());
  expect(await plate()).toEqual(['#CM9803']);
  await page.evaluate(()=>{curPersona='owner';deOpen('miami-tropic','units');deLocOpen('AP.3203');});
  const drawer=page.locator('#de-drawer');
  await expect(drawer.locator('.de-loc')).toContainText('Matched outline 03 on Typical floor');
  await page.evaluate(()=>deOpen('lalex','plans'));
  await expect(page.locator('.de-attn')).toContainText('#CM9820');
  await page.getByRole('button',{name:'Place #CM9820'}).click();
  await expect(drawer.locator('.de-loc')).toContainText('Needs placing');
  await drawer.getByRole('button',{name:'Free outline Unit 20'}).click();
  await expect(drawer.locator('.de-loc')).toContainText('Placed at Unit 20 on Floor 1');
  await drawer.getByRole('button',{name:/^CM9803 at CM9803/}).click();
  await drawer.getByRole('button',{name:'Swap the two units'}).click();
  await expect(drawer.getByLabel('Position on plan')).toHaveValue('s0');
  await drawer.getByRole('button',{name:'Reset to automatic'}).click();
  await expect(drawer.locator('.de-loc')).toContainText('Needs placing');
  await drawer.getByRole('button',{name:'Draw outline'}).click();
  const b=await drawer.locator('.de-lv svg').boundingBox();
  await page.mouse.move(b.x+b.width*.55,b.y+b.height*.2);await page.mouse.down();await page.mouse.move(b.x+b.width*.9,b.y+b.height*.8,{steps:4});await page.mouse.up();
  await expect(drawer.locator('.de-loc')).toContainText('Uses its own outline');
  await drawer.getByLabel('Position on plan').selectOption('s1');
  await expect(drawer.locator('.de-note')).toContainText('#CM9803 is already at Unit 20');
  await drawer.getByRole('button',{name:'Cancel'}).click();
  await drawer.getByLabel('Position on plan').selectOption('s0');
  await expect(drawer.locator('.de-loc')).toContainText('Placed at CM9803');
  await page.evaluate(()=>{DE.drawer=null;deGo('review');});
  await expect(page.locator('.de-card',{hasText:'Changes in this draft'})).toContainText('Unit positions on level plans');
  await page.evaluate(()=>{deDraft().assets.forEach(a=>{if(a.img&&!a.alt.trim())a.alt='Photo';});deDraft().links.ig='';deRender();});
  await page.getByRole('button',{name:/^Publish v\d+/}).click();
  await expect.poll(plate).toEqual(['#CM9803','#CM9820']);
});
