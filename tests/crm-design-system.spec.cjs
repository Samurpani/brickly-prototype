const {test,expect}=require('@playwright/test');
const ENTRY_URL='/prototypes/Bricly_OS_Prototype_v2.html';

for(const width of [1440,390]){
  test(`Sidebar account switches persona and appearance at ${width}`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:900});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const trigger=page.getByRole('button',{name:'Account and appearance',exact:true});
    const popup=page.getByRole('dialog',{name:'Account and appearance',exact:true});
    await expect(page.locator('#p-today .persona-seg')).toHaveCount(0);
    await page.evaluate(()=>go('developments'));
    await trigger.focus();await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded','true');
    await expect(popup.getByRole('radio',{name:'Sales Rep',exact:true})).toBeChecked();
    await popup.getByRole('radio',{name:'Owner / Admin',exact:true}).check();
    await expect(popup).toBeHidden();await expect(trigger).toBeFocused();
    await expect(page.locator('#p-developments [data-aw-action="development"]')).toBeVisible();
    await page.evaluate(()=>go('properties'));
    await expect(page.locator('#p-properties [data-aw-action="unit"]')).toBeVisible();
    await trigger.click();await popup.getByRole('radio',{name:'Manager',exact:true}).check();
    await expect(page.locator('#p-properties [data-aw-action="unit"]')).toBeHidden();
    await page.evaluate(()=>go('developments'));
    await expect(page.locator('#p-developments [data-aw-action="development"]')).toBeVisible();
    await trigger.click();await popup.getByRole('radio',{name:'Marketing',exact:true}).check();
    await expect(page.locator('#p-developments [data-aw-action="development"]')).toBeHidden();
    await trigger.click();await popup.getByRole('radio',{name:'Sales Rep',exact:true}).check();
    expect(await page.evaluate(()=>curPersona)).toBe('rep');
    await expect(page.locator('#uName')).toHaveText('Sam');
    for(const theme of ['dark','light']){
      await trigger.click();await popup.getByRole('radio',{name:theme==='dark'?'Dark':'Light',exact:true}).check();
      await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
      const bounds=await popup.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
      expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(900);
      expect(await popup.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
      await page.screenshot({path:testInfo.outputPath(`account-${theme}-${width}.png`)});
      await page.keyboard.press('Escape');await expect(popup).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded','false');
    }
    await trigger.click();await page.locator('#p-developments .page-title').click();
    await expect(popup).toBeHidden();
    expect(errors).toEqual([]);
  });
}

for(const [route,kind,persona] of [['deals','deal','rep'],['properties','unit','owner'],['developments','development','owner']]){
for(const width of [1440,390]){
  test(`${route} Add ${kind} uses the rightmost header action at ${width}`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:900});
    await page.evaluate(({route,persona})=>{curPersona=persona;go(route);awOverviewActions();awOverviewActions();if(route==='developments'){dvSetView('list');dvSetView('card');renderDevs();}},{route,persona});
    const toolbar=page.locator(`#p-${route} .crm-page-controls > .toolbar`);
    const button=toolbar.locator(`[data-aw-action="${kind}"]`);
    await expect(button).toHaveCount(1);
    await expect(button).toBeVisible();
    await expect(page.locator(`#p-${route} .crm-page-heading [data-aw-action]`)).toHaveCount(0);
    expect(await button.evaluate(element=>Array.from(element.parentElement.children).filter(sibling=>sibling!==element).every(sibling=>Number(getComputedStyle(sibling).order)<Number(getComputedStyle(element).order)))).toBe(true);
    const bounds=await button.boundingBox(),parent=await toolbar.boundingBox();
    expect(Math.abs(bounds.x+bounds.width-parent.x-parent.width)).toBeLessThanOrEqual(1);
    expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
    await page.screenshot({path:testInfo.outputPath(`${route}-header-${width}.png`)});
    await button.click();await expect(page.locator('#aw-dialog')).toBeVisible();
    await page.evaluate(()=>{document.getElementById('aw-dialog').close();curPersona='marketing';awOverviewActions();});
    await expect(button).toBeHidden();
  });
}
}

for(const width of [1440,390]){
  test(`Header search expands into one control at ${width}`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'no-preference'});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const [route,prefix]of [['properties','un'],['pipeline','pipe'],['contacts','ct'],['deals','dl'],['developments','dv']]){
      await page.evaluate(route=>go(route),route);
      const field=page.locator(`#${prefix}-search-wrap`),input=field.locator('input');
      const trigger=page.locator(`#p-${route} .crm-page-controls .tool[title="Search"]`);
      const before=await trigger.evaluate(button=>[...button.parentElement.children].filter(element=>element!==button&&element.getBoundingClientRect().width>0).map(element=>({element:element.tagName,top:element.getBoundingClientRect().top})));
      await trigger.click();
      const control=page.locator(`#p-${route} .crm-header-search`);
      await expect(control).toHaveClass(/is-open/);
      await expect(input).toBeFocused();
      await expect(field.locator('svg')).toHaveCount(0);
      await expect(control.locator('button')).toHaveCount(1);
      await expect(control).toHaveCSS('transition-duration','0.22s, 0.22s, 0.22s');
      await expect.poll(async()=> (await control.boundingBox()).width).toBeGreaterThan(32);
      await expect(input).toHaveCSS('font-size','11px');
      expect((await control.boundingBox()).width).toBeLessThanOrEqual(180);
      const after=await control.evaluate(control=>[...control.parentElement.children].filter(element=>element!==control&&element.getBoundingClientRect().width>0).map(element=>({element:element.tagName,top:element.getBoundingClientRect().top})));
      expect(after).toEqual(before);
      const bounds=await control.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
      await input.fill('Mercury');
      if(prefix==='un')expect(await page.evaluate(()=>unState.q)).toBe('Mercury');
      if(prefix==='dv'){
        await page.evaluate(()=>renderDevs());
        await expect(control).toHaveClass(/is-open/);await expect(input).toHaveValue('Mercury');
      }
      await input.press('Escape');
      await expect(control).not.toHaveClass(/is-open/);await expect(trigger).toBeFocused();
      await expect(input).toHaveValue('');await expect(trigger).toHaveAttribute('aria-expanded','false');
      await expect.poll(async()=> (await control.boundingBox()).width).toBe(32);
      await trigger.click();await expect(input).toBeFocused();
      if(prefix==='un'){
        await expect.poll(async()=> (await control.boundingBox()).width).toBeGreaterThan(32);
        await page.screenshot({path:testInfo.outputPath(`header-search-${width}.png`)});
      }
      await trigger.click();await expect(control).not.toHaveClass(/is-open/);
      await trigger.click();await input.fill('   ');
      await page.locator(`#p-${route} .page-title`).first().click();
      await expect(control).not.toHaveClass(/is-open/);
      await expect(input).toHaveValue('');
      await trigger.click();await input.fill('Mercury');
      await page.locator(`#p-${route} .page-title`).first().click();
      await expect(control).toHaveClass(/is-open/);
      await expect(input).toHaveValue('Mercury');
      await input.press('Escape');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect(page.locator('#p-developments .crm-header-search')).toHaveCSS('transition-duration','0s');
    expect(errors).toEqual([]);
  });
}

test('Walkthrough updates: new contacts require details and keep optional values empty',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const before=await page.evaluate(()=>({contacts:CONTACTS.length,opps:OPPS.length}));
  await page.evaluate(()=>openNewOpp());
  await page.locator('#nf-lead').fill('Walkthrough Buyer');
  await page.getByRole('option',{name:'Create new contact',exact:true}).click();
  await page.evaluate(()=>submitNewOpp());
  await expect(page.locator('#nf-error')).toContainText('number');
  await page.locator('#nf-phone').fill('+356 79001239');
  await page.locator('#nf-email').fill('not-an-email');
  await page.evaluate(()=>submitNewOpp());
  await expect(page.locator('#nf-error')).toContainText('email');
  expect(await page.evaluate(()=>CONTACTS.length)).toBe(before.contacts);
  await page.locator('#nf-email').fill('walkthrough@example.com');
  await page.evaluate(()=>{submitNewOpp();submitNewOpp();});
  const saved=await page.evaluate(()=>({contacts:CONTACTS.length,opps:OPPS.length,units:OPPS.at(-1).units,devs:OPPS.at(-1).devs,budget:OPPS.at(-1).budget,linked:CONTACTS.at(-1).oppIds.includes(OPPS.at(-1).id),consent:CONTACTS.at(-1).consent}));
  expect(saved).toEqual({contacts:before.contacts+1,opps:before.opps+1,units:[],devs:[],budget:null,linked:true,consent:{wa:false,em:false,sms:false}});
  await page.evaluate(()=>openOpp(OPPS.at(-1).id));
  await expect(page.locator('#opp-root')).not.toContainText(/undefined|€null|NaN/);
  await expect(page.locator('#opp-root')).toContainText('walkthrough@example.com');
  expect(errors).toEqual([]);
  await page.reload();expect(await page.evaluate(()=>CONTACTS.length)).toBe(before.contacts);
});

test('Walkthrough updates: existing contacts and unit context share the same drawer',async({page})=>{
  const fixture=await page.evaluate(()=>({contact:CONTACTS[0],unit:UNITS[0],count:CONTACTS.length}));
  await page.evaluate(id=>unNewDeal(id),fixture.unit.id);
  await expect(page.locator('#nf-units summary')).toHaveText(fixture.unit.id);
  await expect(page.locator('#nf-devs summary')).toHaveText(fixture.unit.dev);
  await expect(page.locator('#nf-value')).toHaveValue('');
  await page.locator('#nf-lead').fill(fixture.contact.email);
  await page.locator('#nf-lead').press('ArrowDown');await page.keyboard.press('Enter');
  await expect(page.locator('#nf-phone')).toHaveValue(fixture.contact.phone);
  await expect(page.locator('#nf-email')).toHaveValue(fixture.contact.email);
  await page.locator('#nf-value').fill('0');
  await page.evaluate(()=>submitNewOpp());
  expect(await page.evaluate(()=>({count:CONTACTS.length,contactId:OPPS.at(-1).contactId,budget:OPPS.at(-1).budget,units:OPPS.at(-1).units}))).toEqual({count:fixture.count,contactId:fixture.contact.id,budget:0,units:[fixture.unit.id]});
  await page.evaluate(()=>openNewOpp());
  await page.locator('#nf-units summary').click();
  expect(await page.locator('#nf-units .fd-item').count()).toBe(await page.evaluate(()=>UNITS.length));
  await page.locator('#nf-units .fd-item').first().click();
  await expect(page.locator('#nf-units summary')).toHaveText(fixture.unit.id);
  await page.keyboard.press('Escape');await expect(page.locator('#nf-units')).not.toHaveAttribute('open','');
  await page.locator('#nf-devs summary').click();
  expect(await page.locator('#nf-devs .fd-item').count()).toBe(await page.evaluate(()=>DEVS.length));
  await page.evaluate(({contact,unit})=>{closeNewOpp();openNewOpp({contactId:contact.id,unitId:unit.id});submitNewOpp();openOpp(OPPS.at(-1).id);},fixture);
  await expect(page.locator('#opp-root')).not.toContainText(/undefined|€null|NaN/);
});

test('Walkthrough updates: unit links search, filter and enforce ownership',async({page})=>{
  const fixture=await page.evaluate(()=>{
    curPersona='rep';const unit=UNITS.find(record=>OPPS.some(opportunity=>unLinkAllowed(opportunity,record.id)));
    const own=OPPS.find(opportunity=>unLinkAllowed(opportunity,unit.id));
    const other=OPPS.find(opportunity=>opportunity.rep!==UN_REP&&opportunity.stage!=='Closed Won'&&!opportunity.units.includes(unit.id));
    unLinkDeal(unit.id);return {unit:unit.id,own,other};
  });
  await page.locator('#un-link-search').fill(fixture.other.id);
  await expect(page.locator('#un-link-results')).toContainText('No matching opportunities');
  await page.locator('#un-link-search').fill(fixture.own.id);
  await expect(page.locator('#un-link-results button')).toHaveCount(1);
  await page.evaluate(stage=>unLinkFilter('stage',stage),fixture.own.stage);
  await expect(page.locator('#un-link-results button')).toHaveCount(1);
  await page.evaluate(()=>unLinkFilter('stage','Closed Won'));
  await expect(page.locator('#un-link-results button')).toHaveCount(0);
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await page.locator('#un-link-search').fill(fixture.own.id);
  await page.locator('#un-link-results button').click();
  expect(await page.evaluate(({own,unit})=>OPPS.find(opportunity=>opportunity.id===own.id).units.filter(id=>id===unit).length,fixture)).toBe(1);
  await page.evaluate(({own,unit,other})=>{unAttach(own.id,unit);unAttach(other.id,unit);},fixture);
  expect(await page.evaluate(({other,unit})=>OPPS.find(opportunity=>opportunity.id===other.id).units.includes(unit),fixture)).toBe(false);
  await page.evaluate(unit=>{curPersona='manager';unLinkDeal(unit);unLinkFilter('scope','all');},fixture.unit);
  await page.locator('#un-link-search').fill(fixture.other.id);
  await expect(page.locator('#un-link-results button')).toHaveCount(1);
  await page.evaluate(()=>{curPersona='rep';});
  await page.locator('#un-link-results button').click();
  expect(await page.evaluate(({other,unit})=>OPPS.find(opportunity=>opportunity.id===other.id).units.includes(unit),fixture)).toBe(false);
});

test('Walkthrough updates: cancellation, duplicate details and decimal budget',async({page})=>{
  const before=await page.evaluate(()=>CONTACTS.length);
  await page.evaluate(()=>openNewOpp());
  await page.locator('#nf-lead').fill('Cancelled Buyer');
  await page.getByRole('option',{name:'Create new contact',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  expect(await page.evaluate(()=>CONTACTS.length)).toBe(before);
  await page.evaluate(()=>openNewOpp());
  await page.locator('#nf-lead').fill('Duplicate Buyer');
  await page.getByRole('option',{name:'Create new contact',exact:true}).click();
  const existing=await page.evaluate(()=>CONTACTS[0]);
  await page.locator('#nf-phone').fill(existing.phone);
  await page.locator('#nf-email').fill(existing.email);
  await page.evaluate(()=>submitNewOpp());
  await expect(page.locator('#nf-error')).toContainText('existing contact');
  await page.locator('#nf-lead').fill(existing.email);
  await page.getByRole('option').first().click();
  await page.locator('#nf-value').fill('350.75');
  await page.evaluate(()=>submitNewOpp());
  expect(await page.evaluate(()=>({count:CONTACTS.length,budget:OPPS.at(-1).budget}))).toEqual({count:before,budget:350.75});
});

for(const width of [1440,390]){
  test(`Walkthrough updates: logo, menus, shared gaps and selection clearance at ${width}`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:900});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const logo=page.locator('.crm-brand-logo');
    await logo.evaluate(image=>image.decode());
    expect(await logo.evaluate(image=>[image.naturalWidth,image.naturalHeight])).toEqual([73,22]);
    await page.evaluate(()=>{go('pipeline');openNewOpp();});
    await page.locator('#nf-devs summary').click();
    await expect(page.locator('#nf-devs .fd-search input')).toBeVisible();
    for(const selector of ['#oppDrawer','#nf-devs']){
      const bounds=await page.locator(selector).boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
    }
    expect(await page.locator('#nf-devs .fd-item').first().evaluate(element=>getComputedStyle(element).borderTopWidth)).toBe('0px');
    await page.screenshot({path:testInfo.outputPath(`form-${width}.png`)});
    await page.evaluate(()=>{closeNewOpp();const opportunity=OPPS.find(record=>record.lead==='Emma Farrugia');openOpp(opportunity.id);});
    const shared=page.locator('#opp-root .dcard').filter({has:page.locator('.side-h',{hasText:'Shared with client'})});
    const cards=shared.locator('.cr-lc');
    const first=await cards.nth(0).boundingBox(),second=await cards.nth(1).boundingBox();
    expect(second.y-first.y-first.height).toBeGreaterThanOrEqual(10);
    await expect.poll(async()=> (await page.locator('#oppDrawer').boundingBox()).x).toBeGreaterThanOrEqual(width);
    await shared.screenshot({path:testInfo.outputPath(`shared-${width}.png`)});
    await page.evaluate(()=>{go('properties');trClear();trAdd(UNITS.find(unit=>unit.status==='available').id);});
    await expect(page.locator('.selbar.on')).toBeVisible();
    await expect(page.locator('#briclyToast')).toHaveClass(/selection-toast/);
    const toast=await page.locator('#briclyToast').boundingBox(),bar=await page.locator('.selbar.on').boundingBox();
    expect(toast.x).toBeGreaterThanOrEqual(0);expect(toast.x+toast.width).toBeLessThanOrEqual(width);expect(toast.y+toast.height).toBeLessThan(bar.y);
    await expect(page.getByRole('button',{name:'Export list',exact:true})).toHaveCount(0);
    expect(await page.evaluate(()=>sbEl._surface.actions.some(action=>/export/i.test(action.label)))).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`selection-${width}.png`)});
    await page.evaluate(()=>showToast('General notification'));
    await expect(page.locator('#briclyToast')).not.toHaveClass(/selection-toast/);
    expect(errors).toEqual([]);
  });
}

test('Admin workflows: development request permissions, drafts and submission',async({page})=>{
  await page.goto(ENTRY_URL);
  await page.evaluate(()=>{curPersona='rep';go('developments');});
  await expect(page.getByRole('button',{name:'Add development'})).toBeHidden();
  await page.evaluate(()=>{curPersona='manager';go('developments');});
  await page.getByRole('button',{name:'Add development'}).click();
  await page.getByLabel('Development name',{exact:true}).fill('Harbour Extension');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();
  await page.locator('.aw-request').click();
  await expect(page.getByLabel('Development name',{exact:true})).toHaveValue('Harbour Extension');
  await page.getByLabel('Location',{exact:true}).fill('Sliema');
  await page.getByLabel('Expected units',{exact:true}).fill('12');
  await page.getByLabel('Setup contact',{exact:true}).fill('Sam');
  await page.getByLabel('Contact email',{exact:true}).fill('sam@example.com');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('#aw-error')).toContainText('source files');
  await page.getByLabel('Missing information / delivery plan').fill('Architect will supply plans on Friday.');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Confirm this setup request').check();
  const before=await page.evaluate(()=>DEVS.length);
  await page.getByRole('button',{name:'Submit setup request',exact:true}).click();
  await expect(page.locator('.aw-request')).toContainText('Submitted - scope review');
  expect(await page.evaluate(()=>({requests:AW_REQUESTS.length,developments:DEVS.length}))).toEqual({requests:1,developments:before});
});

test('Admin workflows: new units remain off market until explicit mapping sign-off',async({page})=>{
  await page.evaluate(()=>{curPersona='owner';go('properties');});
  await page.getByRole('button',{name:'Add unit',exact:false}).click();
  await page.getByLabel('Unit reference',{exact:true}).fill('EXT-101');
  await page.getByLabel('Internal area (m2)',{exact:true}).fill('85');
  await page.getByLabel('List price (EUR)',{exact:true}).fill('340000');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();
  expect(await page.evaluate(()=>UN('EXT-101').status)).toBe('off_market');
  await page.getByRole('button',{name:'Edit unit',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Publish as available').check();
  await page.getByRole('button',{name:'Save unit',exact:true}).click();
  await expect(page.locator('#aw-error')).toContainText('Confirm floorplan mapping');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByLabel('Floorplan mapping',{exact:true}).selectOption('not_applicable');
  await page.getByLabel('Reason no floorplan applies').fill('Independent garage with no architectural floorplan.');
  await page.getByLabel('I confirm no floorplan is applicable').check();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Save unit',exact:true}).click();
  expect(await page.evaluate(()=>UN('EXT-101').status)).toBe('available');
  await page.evaluate(()=>{curPersona='manager';go('properties');});
  await expect(page.getByRole('button',{name:'Add unit',exact:false})).toBeHidden();
});

test('Admin workflows: uploaded unit images and confirmed floor placement render after save',async({page})=>{
  await page.evaluate(()=>{curPersona='owner';awUnit();Object.assign(awState.values,{id:'EXT-102',floor:8,sqm:80,price:300000});awState.step=1;awRender();});
  await page.getByLabel('Floorplan mapping',{exact:true}).selectOption('mapped');
  const fixture=await floorDrawingFixture(page);
  await page.getByLabel('Upload floor drawing',{exact:true}).setInputFiles(fixture);
  await expect(page.locator('.aw-map img')).toBeVisible();
  await page.getByLabel('Horizontal position (%)').fill('25');
  await page.getByLabel('Vertical position (%)').fill('40');
  await page.getByLabel('I confirm this unit is correctly placed on this floor').check();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Add images',{exact:true}).setInputFiles(fixture);
  await expect(page.locator('.aw-images img')).toBeVisible();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Publish as available').check();
  await page.getByRole('button',{name:'Save unit',exact:true}).click();
  expect(await page.evaluate(()=>DEV('dolphin').floorPlans[8].positions['EXT-102'])).toEqual({x:25,y:40});
  await expect(page.locator('#un-media-main img')).toBeVisible();
  expect(await page.locator('#un-media-main img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
  await page.evaluate(()=>awInvalidateFloor(DEV('dolphin'),8));
  expect(await page.evaluate(()=>UN('EXT-102').status)).toBe('off_market');
});

test('Admin workflows: development editing saves details without changing unit identities',async({page})=>{
  await page.evaluate(()=>{curPersona='owner';openDev('dolphin');});
  await page.getByRole('button',{name:'Edit development',exact:true}).click();
  await page.getByLabel('About the development',{exact:true}).fill('Updated development description.');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Save development',exact:true}).click();
  await expect(page.locator('#dv-tabc')).toContainText('Updated development description.');
  expect(await page.evaluate(()=>UN('#CM1201').dev)).toBe('Dolphin Court');
});

test('Admin workflows: external completed deal preserves actual history and deduplicates inventory',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const fixture=await page.evaluate(()=>{
    curPersona='owner';go('deals');
    const unit=UNITS.find(record=>record.status==='available'&&!DEALS.some(deal=>dealOpp(deal).units.includes(record.id)));
    return {unit:unit.id,development:DEV(unit.dev).id,before:DEALS.length};
  });
  await page.getByRole('button',{name:'Add deal',exact:false}).click();
  await page.getByLabel('Deal source',{exact:true}).selectOption('external');
  await page.getByLabel('Sale status',{exact:true}).selectOption('completed');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Buyer name',{exact:true}).fill('External Buyer');
  await page.getByLabel('Buyer phone',{exact:true}).fill('+356 79991234');
  await page.getByLabel('Buyer email',{exact:true}).fill('external@example.com');
  await page.getByLabel('Development',{exact:true}).selectOption(fixture.development);
  await page.getByLabel('Contracted unit',{exact:true}).selectOption(fixture.unit);
  await page.getByLabel('Agreed sale price (EUR)').fill('320000');
  await page.getByLabel('Commission payable (EUR)').fill('6400');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('POS signed date',{exact:true}).fill('2026-01-01');
  await page.getByLabel('Final deed signed date',{exact:true}).fill('2026-08-01');
  await page.getByLabel('Missing evidence / historical notes').fill('Notary will supply archived signed documents.');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('I confirm the signed milestones and inventory change').check();
  await page.getByRole('button',{name:'Create deal',exact:true}).click();
  await expect(page.locator('#deal-root')).toContainText('External Buyer');
  const result=await page.evaluate(unitId=>{
    const deal=DEALS.at(-1),opportunity=dealOpp(deal);
    return {count:DEALS.length,status:UN(unitId).status,paid:opportunity.closed.paid,step:opportunity.closed.step,milestones:opportunity.closed.milestones.map(record=>record?.date||null),payments:EXT[opportunity.id].payments,consent:CONTACTS.at(-1).consent};
  },fixture.unit);
  expect(result).toEqual({count:fixture.before+1,status:'sold',paid:false,step:4,milestones:['2026-01-01',null,null,'2026-08-01',null],payments:[],consent:{wa:false,em:false,sms:false}});
  const duplicate=await page.evaluate(()=>{awDeal();Object.assign(awState.values,{origin:'external',saleState:'completed',unitId:DEALS.at(-1)&&dealOpp(DEALS.at(-1)).units[0]});const unit=UN(awState.values.unitId);awState.values.developmentId=DEV(unit.dev).id;try{awValidateDeal(1);}catch(error){return error.message;}});
  expect(duplicate).toContain('already has a deal');expect(errors).toEqual([]);
});

test('Admin workflows: reps convert only their own opportunities and preserve existing records',async({page})=>{
  const fixture=await page.evaluate(()=>{
    curPersona='rep';go('deals');
    const opportunity=awEligibleOpportunities()[0];
    const unit=UNITS.find(record=>record.status==='available'&&!DEALS.some(deal=>dealOpp(deal).units.includes(record.id)));
    opportunity.units=[unit.id];opportunity.devs=[unit.dev];
    return {id:opportunity.id,unit:unit.id,count:OPPS.length};
  });
  await page.getByRole('button',{name:'Add deal',exact:false}).click();
  await expect(page.getByLabel('Deal source',{exact:true}).locator('option')).toHaveCount(1);
  await page.getByLabel('Search opportunities').fill(fixture.id);
  await page.getByLabel('Opportunity',{exact:true}).selectOption(fixture.id);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Contracted unit',{exact:true}).selectOption(fixture.unit);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('POS signed date',{exact:true}).fill('2026-08-01');
  await page.getByLabel('Missing evidence / historical notes').fill('Signed POS copy requested.');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('I confirm the signed milestones and inventory change').check();
  await page.getByRole('button',{name:'Create deal',exact:true}).click();
  expect(await page.evaluate(({id,unit})=>({count:OPPS.length,deal:!!dealFor(id),status:UN(unit).status,jstage:getExt(OPPS.find(record=>record.id===id)).jstage}),fixture)).toEqual({count:fixture.count,deal:true,status:'reserved',jstage:'pos'});
  expect(await page.evaluate(()=>{awDeal();awState.values.origin='external';try{awValidateDeal(0);}catch(error){return error.message;}})).toContain('role');
});

test('Admin workflows: duplicate contacts and changed permissions block external entry',async({page})=>{
  const messages=await page.evaluate(()=>{
    curPersona='manager';awDeal();const unit=UNITS.find(record=>record.status==='available'&&!DEALS.some(deal=>dealOpp(deal).units.includes(record.id)));
    Object.assign(awState.values,{origin:'external',unitId:unit.id,developmentId:DEV(unit.dev).id,buyerName:'Duplicate Test',phone:CONTACTS[0].phone,value:300000,commission:6000});
    const messages=[];try{awValidateDeal(1);}catch(error){messages.push(error.message);}
    curPersona='marketing';try{awValidateDeal(1);}catch(error){messages.push(error.message);}
    return messages;
  });
  expect(messages[0]).toContain('existing contact');expect(messages[1]).toContain('role');
});

for(const width of [1440,390]){
  test(`Admin workflows: forms fit ${width}`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:900});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const flow of ['development','unit','deal']){
      await page.evaluate(flow=>{document.getElementById('aw-dialog')?.close();curPersona='owner';if(flow==='development')awDevelopment();if(flow==='unit')awUnit();if(flow==='deal')awDeal();},flow);
      const dialog=page.locator('#aw-dialog'),bounds=await dialog.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
      expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
      for(const control of await dialog.locator('input:not([type=checkbox]),select,textarea').all()){
        const box=await control.boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(bounds.x+bounds.width);
      }
      await page.screenshot({path:testInfo.outputPath(`${flow}-${width}.png`)});
    }
    expect(errors).toEqual([]);
  });
}

test.beforeEach(async({page})=>{
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.goto(ENTRY_URL);
});

test('Development hub replaces collateral and opens available sales resources',async({page})=>{
  await page.evaluate(()=>{curPersona='owner';openDev('dolphin');});
  const hub=page.locator('.dv-sales-hub');
  await expect(hub).toBeVisible();
  await expect(hub.locator('.dv-hub-row')).toHaveCount(9);
  await expect(hub.locator('.crm-resource-group h4')).toHaveText(['Online presence','Sales documents','Visuals & presentations']);
  await expect(hub.getByRole('region',{name:'Online presence'}).locator('.dv-hub-text strong')).toHaveText(['Website','Instagram','Facebook']);
  await expect(page.locator('#dv-tabc')).not.toContainText('Sales collateral');
  expect(await hub.evaluate(element=>element.previousElementSibling.textContent)).toContain('About the development');
  await expect(hub.getByRole('link',{name:'Open Website',exact:true})).toHaveAttribute('href','https://dolphincourt.mt');
  await expect(hub.getByRole('button',{name:'Share Sales brochure',exact:true})).toBeDisabled();
  await hub.getByRole('button',{name:'Open live availability',exact:true}).click();
  await expect(page.locator('#dvu-filter-row')).toBeVisible();
  await page.evaluate(()=>dvSetTab('overview'));
  await hub.getByRole('button',{name:'Open Renders & photography',exact:true}).click();
  expect(await page.evaluate(()=>dvTabCur)).toBe('media');
  await page.evaluate(()=>dvSetTab('overview'));
  await page.evaluate(()=>{window.prOpenDev=id=>{window.hubPresentedId=id;};});
  await hub.getByRole('button',{name:'Enter present mode',exact:true}).click();
  expect(await page.evaluate(()=>window.hubPresentedId)).toBe('dolphin');
});

test('Development hub validates links, shares actual URLs and isolates projects',async({page})=>{
  await page.evaluate(()=>{curPersona='owner';openDev('dolphin');Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.hubCopied=text;}}});});
  await page.getByRole('button',{name:'Add Sales brochure link',exact:true}).click();
  await page.locator('#dv-hub-url').fill('javascript:alert(1)');
  await page.getByRole('button',{name:'Save link',exact:true}).click();
  await expect(page.locator('#dv-hub-error')).toContainText('HTTPS');
  await page.locator('#dv-hub-url').fill('https://example.com/brochure.pdf');
  await page.getByRole('button',{name:'Save link',exact:true}).click();
  await expect(page.getByRole('link',{name:'Open Sales brochure',exact:true})).toHaveAttribute('href','https://example.com/brochure.pdf');
  await page.getByRole('button',{name:'Share Sales brochure',exact:true}).click();
  expect(await page.evaluate(()=>window.hubCopied)).toBe('https://example.com/brochure.pdf');
  await page.getByRole('button',{name:'Edit Sales brochure link',exact:true}).click();
  await page.locator('#dv-hub-url').fill('https://example.com/unsaved.pdf');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link',{name:'Open Sales brochure',exact:true})).toHaveAttribute('href','https://example.com/brochure.pdf');
  await page.evaluate(()=>openDev('mercury'));
  await expect(page.getByRole('button',{name:'Share Sales brochure',exact:true})).toBeDisabled();
  await page.evaluate(()=>{curPersona='rep';openDev('dolphin');});
  await expect(page.getByRole('button',{name:'Edit Sales brochure link',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Share Sales brochure',exact:true})).toBeEnabled();
});

for(const theme of ['light','dark']){
  for(const width of [1440,390]){
    test(`Development hub ${theme} fits ${width}`,async({page},testInfo)=>{
      await page.setViewportSize({width,height:900});
      await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;curPersona='owner';openDev('dolphin');},theme);
      const hub=page.locator('.dv-sales-hub');
      const panelStyles=await hub.evaluate(element=>{
        const hubStyle=getComputedStyle(element),neighbor=getComputedStyle(element.previousElementSibling);
        return ['backgroundColor','borderColor','borderRadius','padding'].map(property=>[hubStyle[property],neighbor[property]]);
      });
      for(const [actual,expected] of panelStyles)expect(actual).toBe(expected);
      await hub.scrollIntoViewIfNeeded();
      const availability=hub.locator('[data-hub-asset="availability"]');
      await availability.locator('.crm-resource-primary').hover();
      const hoverColor=await hub.evaluate(element=>getComputedStyle(element).getPropertyValue('--crm-surface-low').trim());
      const resolvedHover=await page.evaluate(color=>{const element=document.createElement('span');element.style.color=color;document.body.appendChild(element);const result=getComputedStyle(element).color;element.remove();return result;},hoverColor);
      await expect(availability).toHaveCSS('background-color',resolvedHover);
      await availability.locator('.crm-resource-primary').focus();
      await expect(availability.locator('.crm-resource-primary')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#dvu-filter-row')).toBeVisible();
      await page.evaluate(()=>dvSetTab('overview'));
      await hub.scrollIntoViewIfNeeded();
      for(const row of await hub.locator('.dv-hub-row').all()){
        const bounds=await row.boundingBox();expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
        expect(await row.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
        const text=await row.locator('.dv-hub-text').boundingBox(),actions=await row.locator('.dv-hub-actions').boundingBox();
        expect(text.x+text.width).toBeLessThanOrEqual(actions.x);
      }
      await page.screenshot({path:testInfo.outputPath('development-hub.png')});
      await page.getByRole('button',{name:'Add Floor plans link',exact:true}).click();
      await expect(page.locator('#dv-hub-url')).toBeFocused();
      const dialogBox=await page.locator('#dvHubDialog').boundingBox();
      expect(Math.abs(dialogBox.x+dialogBox.width/2-width/2)).toBeLessThanOrEqual(1);
      expect(Math.abs(dialogBox.y+dialogBox.height/2-450)).toBeLessThanOrEqual(1);
      await page.screenshot({path:testInfo.outputPath('hub-link-dialog.png')});
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button',{name:'Add Floor plans link',exact:true})).toBeFocused();
    });
  }
}

async function floorDrawingFixture(page){
  const data=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=600;
    const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,960,600);
    context.strokeStyle='#434b48';context.lineWidth=5;context.strokeRect(40,40,880,520);
    context.strokeRect(40,40,400,440);context.strokeRect(520,40,400,440);
    context.strokeRect(40,40,200,200);context.strokeRect(520,40,200,200);
    context.fillStyle='#434b48';context.font='20px sans-serif';context.fillText('TEST FLOOR DRAWING',350,535);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return {name:'floor-1.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
}

test('Development floor plans link real drawings to current floor inventory',async({page})=>{
  await page.evaluate(()=>{curPersona='owner';openDev('dolphin');});
  const panel=page.locator('#dv-floor-panel');
  await expect(panel).toHaveCount(0);
  await expect(page.locator('#dv-root .dv-hero')).toBeVisible();
  await page.getByRole('button',{name:/^Availability \(/}).click();
  await expect(page.locator('#dv-root .dv-hero')).toHaveCount(0);
  await page.getByRole('button',{name:'View as floorplans',exact:true}).click();
  await expect(panel).toContainText('No drawing for ground floor');
  await page.getByLabel('Floor plan level').selectOption('1');
  await expect(panel.locator('.dv-floor-unit')).toHaveCount(2);
  await expect(panel).toContainText('Sold 1');
  await page.locator('#dv-floor-file').setInputFiles(await floorDrawingFixture(page));
  await expect(panel.locator('.dv-floor-canvas img')).toBeVisible();
  await page.getByRole('button',{name:'Place units',exact:true}).click();
  await page.getByLabel('Unit to place').selectOption('#CM1105');
  await page.getByLabel('Marker horizontal percent').fill('75');
  await page.getByLabel('Marker vertical percent').fill('45');
  await page.getByRole('button',{name:'Place marker',exact:true}).click();
  const sold=panel.locator('.dv-floor-pin[data-unit-id="#CM1105"]');
  await expect(sold).toHaveAttribute('data-status','sold');
  await page.getByLabel('Unit to place').selectOption('#CM1201');
  await panel.locator('.dv-floor-canvas img').click({position:{x:100,y:100}});
  await expect(panel.locator('.dv-floor-pin')).toHaveCount(2);
  await page.getByRole('button',{name:'Done placing'}).click();
  await page.evaluate(()=>{UNITS.find(unit=>unit.id==='#CM1201').status='reserved';dvFloorRefresh('dolphin');});
  await expect(panel.locator('.dv-floor-pin[data-unit-id="#CM1201"]')).toHaveAttribute('data-status','reserved');
  await expect(panel).toContainText('Reserved 1');
  await page.getByRole('button',{name:'Zoom in floor plan',exact:true}).click();
  await expect(panel.locator('.dv-floor-zoom')).toContainText('125%');
  expect(await page.evaluate(()=>DEVS.find(record=>record.id==='dolphin').floorPlans[1].positions['#CM1105'])).toEqual({x:75,y:45});
  await page.getByLabel('Floor plan level').selectOption('2');
  await expect(panel.locator('.dv-floor-pin')).toHaveCount(0);
  await expect(panel).toContainText('On hold 1');
  await page.getByLabel('Floor plan level').selectOption('1');
  await expect(panel.locator('.dv-floor-pin')).toHaveCount(2);
  const drawing=await panel.locator('.dv-floor-canvas img').getAttribute('src');
  await page.evaluate(()=>dvuPick('status','sold'));
  await expect(panel.locator('.dv-floor-unit')).toHaveCount(1);
  await expect(panel.locator('.dv-floor-pin')).toHaveCount(1);
  await page.getByRole('button',{name:'View as list',exact:true}).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator('#dv-tabc .table tbody tr')).toHaveCount(1);
  await expect(page.locator('#dv-tabc .table tbody')).toContainText('#CM1105');
  await page.getByRole('button',{name:'View as floorplans',exact:true}).click();
  await expect(page.getByLabel('Floor plan level')).toHaveValue('1');
  await expect(panel.locator('.dv-floor-canvas img')).toHaveAttribute('src',drawing);
  await expect(panel.locator('.dv-floor-pin')).toHaveCount(1);
  await page.evaluate(()=>dvuClearF());
  await expect(panel.locator('.dv-floor-pin')).toHaveCount(2);
  await sold.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#unPeek')).toHaveClass(/open/);
});

test('Development floor plans reject invalid files, preserve cancelled replacements and restrict editing',async({page})=>{
  await page.evaluate(()=>{curPersona='owner';openDev('dolphin');dvSetTab('availability');});
  await page.getByRole('button',{name:'View as floorplans',exact:true}).click();
  await page.getByLabel('Floor plan level').selectOption('1');
  await page.locator('#dv-floor-file').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await expect(page.locator('#dv-floor-message')).toContainText('could not be opened');
  const fixture=await floorDrawingFixture(page);
  await page.locator('#dv-floor-file').setInputFiles(fixture);
  await expect(page.locator('.dv-floor-canvas img')).toBeVisible();
  const original=await page.locator('.dv-floor-canvas img').getAttribute('src');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#dv-floor-file').setInputFiles({...fixture,name:'replacement.png'});
  await expect(page.locator('.dv-floor-canvas img')).toHaveAttribute('src',original);
  await page.evaluate(()=>{curPersona='rep';renderDev();});
  await expect(page.getByRole('button',{name:'Replace drawing'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Place units',exact:true})).toHaveCount(0);
  await page.evaluate(()=>{openDev('mercury');dvSetTab('availability');});
  await page.getByRole('button',{name:'View as floorplans',exact:true}).click();
  await expect(page.locator('.dv-floor-canvas')).toHaveCount(0);
});

test('Development hero is limited to Overview across all tabs',async({page})=>{
  await page.evaluate(()=>{curPersona='owner';openDev('dolphin');});
  const hero=page.locator('#dv-root .dv-hero');
  await expect(hero).toBeVisible();
  for(const tab of ['availability','visual','media','deals','marketing']){
    await page.locator(`#dv-root .tab[onclick="dvSetTab('${tab}')"]`).click();
    await expect(hero).toHaveCount(0);
    await expect(page.locator('#dv-floor-panel')).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Overview',exact:true}).click();
  await expect(hero).toBeVisible();
  await expect(page.locator('#dv-floor-panel')).toHaveCount(0);
});

for(const theme of ['light','dark']){
  for(const width of [1440,390]){
    test(`Development floor plans ${theme} fit ${width}`,async({page},testInfo)=>{
      await page.setViewportSize({width,height:900});
      await page.evaluate(theme=>{curPersona='owner';document.documentElement.dataset.theme=theme;openDev('dolphin');dvSetTab('availability');},theme);
      const toggle=page.getByRole('button',{name:'View as floorplans',exact:true});
      const toggleBounds=await toggle.boundingBox();
      const rowBounds=await page.locator('#dvu-filter-row').boundingBox();
      expect(Math.abs(toggleBounds.x+toggleBounds.width-rowBounds.x-rowBounds.width)).toBeLessThan(2);
      if(width===1440){
        const filterBounds=await page.locator('#dvu-filter-row .crm-filter-field').first().boundingBox();
        expect(Math.abs(toggleBounds.y+toggleBounds.height/2-filterBounds.y-filterBounds.height/2)).toBeLessThan(2);
      }
      await toggle.click();
      await page.getByLabel('Floor plan level').selectOption('1');
      await page.locator('#dv-floor-file').setInputFiles(await floorDrawingFixture(page));
      await expect(page.locator('.dv-floor-canvas img')).toBeVisible();
      await page.evaluate(()=>{const view=dvFloorViews.dolphin;view.editing=true;view.unitId='#CM1105';dvFloorPosition('dolphin',75,45);view.unitId='#CM1201';dvFloorPosition('dolphin',25,45);view.editing=false;dvFloorRefresh('dolphin');});
      const panel=page.locator('#dv-floor-panel');
      const bounds=await panel.boundingBox();expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
      expect(await panel.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
      await panel.screenshot({path:testInfo.outputPath('development-floor-plan.png')});
      await page.screenshot({path:testInfo.outputPath('development-availability-floorplans.png'),fullPage:true});
      await page.getByRole('button',{name:'Place units',exact:true}).click();
      expect(await panel.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
      await panel.screenshot({path:testInfo.outputPath('development-floor-mapping.png')});
    });
  }
}

async function openPaymentDeal(page,step=3){
  await page.evaluate(step=>{
    const opportunity=dealOpp(DEALS[0]);
    opportunity.closed.step=step;opportunity.closed.paid=false;
    delete opportunity.closed.milestones;delete opportunity.completed;
    const extension=getExt(opportunity);
    extension.payments=[{label:'Shell Complete Payment',due:'On completion',amt:1000,status:'overdue'}];
    extension.docs=[{id:'test-deed',g:'Contract',label:'Final deed',flow:'sign',status:'required',file:null,hist:[]}];
    openDeal(DEALS[0].id);
  },step);
}
async function recordBuyerReceipt(page,amount='1000'){
  await page.locator('.deal-payment').getByRole('button',{name:'Record payment',exact:true}).click();
  await page.locator('#de-amount').fill(amount);
  await page.locator('#dealEventDialog').getByRole('button',{name:'Record payment',exact:true}).click();
  await expect(page.locator('#dealEventDialog')).not.toBeVisible();
}
async function paymentDealState(page){
  return page.evaluate(()=>{const opportunity=dealOpp(DEALS[0]),extension=getExt(opportunity);return {cash:dealCash(opportunity),closed:opportunity.closed,payment:extension.payments[0],docs:extension.docs,activity:extension.comms};});
}
const receiptFile={name:'payment-proof.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n%%EOF')};

test('Deal workflow records full payment and later links one shared proof',async({page})=>{
  await openPaymentDeal(page);
  await recordBuyerReceipt(page);
  await expect(page.locator('.deal-payment')).toContainText('Evidence pending');
  let state=await paymentDealState(page);
  expect(state.cash.paid).toBe(1000);expect(state.closed.step).toBe(3);expect(state.closed.paid).toBe(false);
  await page.getByRole('button',{name:'Add proof / receipts'}).click();
  await page.locator('#dealEventDialog').getByRole('button',{name:'Add proof',exact:true}).click();
  await page.locator('#de-file').setInputFiles(receiptFile);
  await page.getByRole('button',{name:'Attach proof',exact:true}).click();
  state=await paymentDealState(page);
  expect(state.docs).toHaveLength(2);expect(state.cash.paid).toBe(1000);
  const documentId=state.payment.receipts[0].documentIds[0];
  expect(state.docs.find(record=>record.id===documentId).file.name).toBe(receiptFile.name);
  await expect(page.locator('.deal-payment')).not.toContainText('Evidence pending');
  await page.getByRole('button',{name:'View receipts'}).click();
  const proof=page.locator('#dealEventDialog .deal-proof a');
  expect(await proof.evaluate(async link=>(await fetch(link.href)).text())).toBe(receiptFile.buffer.toString());
  await page.locator('#dealEventDialog').getByRole('button',{name:'Add proof',exact:true}).click();
  await page.locator('#de-document').selectOption(documentId);
  await page.getByRole('button',{name:'Attach proof',exact:true}).click();
  state=await paymentDealState(page);
  expect(state.docs).toHaveLength(2);expect(state.payment.receipts[0].documentIds).toEqual([documentId]);
});

test('Deal workflow partial receipts validate, cancel and void without losing history',async({page})=>{
  await openPaymentDeal(page);
  await page.getByRole('button',{name:'Record payment',exact:true}).click();
  await page.locator('#de-amount').fill('1001');
  await page.locator('#dealEventDialog').getByRole('button',{name:'Record payment',exact:true}).click();
  expect((await paymentDealState(page)).cash.paid).toBe(0);
  await page.locator('#de-amount').fill('0');
  await page.locator('#dealEventDialog').getByRole('button',{name:'Record payment',exact:true}).click();
  expect((await paymentDealState(page)).cash.paid).toBe(0);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await recordBuyerReceipt(page,'250.25');
  await expect(page.locator('.deal-payment')).toContainText('Partially paid');
  await expect(page.locator('.deal-payment')).toContainText('749.75 remaining');
  await recordBuyerReceipt(page,'749.75');
  expect((await paymentDealState(page)).cash.paid).toBe(1000);
  await page.getByRole('button',{name:'Add proof / receipts'}).click();
  await page.getByRole('button',{name:'Void receipt',exact:true}).first().click();
  await page.locator('#de-reason').fill('Duplicate bank entry');
  await page.locator('#dealEventDialog').getByRole('button',{name:'Void receipt',exact:true}).click();
  const state=await paymentDealState(page);
  expect(state.cash.paid).toBe(749.75);expect(state.payment.receipts).toHaveLength(2);
  expect(state.payment.receipts[0].voided.reason).toBe('Duplicate bank entry');
  expect(state.closed.step).toBe(3);expect(state.closed.paid).toBe(false);
});

test('Deal workflow binds submission to its deal and prevents duplicate receipts',async({page})=>{
  await openPaymentDeal(page);
  await page.getByRole('button',{name:'Record payment',exact:true}).click();
  await page.locator('#de-amount').fill('100');
  await page.evaluate(()=>{openDeal(DEALS[1].id);dealEventSave();dealEventSave();});
  const state=await paymentDealState(page);
  expect(state.cash.paid).toBe(100);expect(state.payment.receipts).toHaveLength(1);
});

test('Deal workflow uploads and records external signatures without advancing the deal',async({page})=>{
  await openPaymentDeal(page);
  await page.getByRole('button',{name:'Update document',exact:true}).click();
  await page.locator('#de-file').setInputFiles(receiptFile);
  await page.locator('#de-event-confirm').check();
  await page.getByRole('button',{name:'Save document'}).click();
  let state=await paymentDealState(page);
  expect(state.docs[0].status).toBe('uploaded');expect(state.closed.milestones[3]).toBeNull();
  await page.getByRole('button',{name:'Update document',exact:true}).click();
  await page.locator('#de-doc-status').selectOption('signed');
  await page.locator('#de-reference').fill('Signed at the notary');
  await page.locator('#de-event-confirm').check();
  await page.getByRole('button',{name:'Save document'}).click();
  state=await paymentDealState(page);
  expect(state.docs).toHaveLength(1);expect(state.docs[0].status).toBe('signed');
  expect(state.docs[0].hist.map(record=>record.act).join(' ')).not.toMatch(/Sent|Viewed/);
  expect(state.closed.step).toBe(3);expect(state.closed.paid).toBe(false);expect(state.cash.paid).toBe(0);
});

test('Deal workflow confirms stages explicitly and keeps commission separate',async({page})=>{
  await openPaymentDeal(page);
  await page.locator('#oj-hero').getByRole('button',{name:'Record deed signing'}).click();
  await page.locator('#de-event-confirm').check();
  await page.locator('#dealEventDialog').getByRole('button',{name:'Record deed signing'}).click();
  await expect(page.locator('#de-title')).toHaveText('Confirm stage change');
  expect((await paymentDealState(page)).closed.step).toBe(3);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:'Review stage change'}).click();
  await page.locator('#de-ack').check();
  await page.getByRole('button',{name:'Confirm stage change',exact:true}).click();
  let state=await paymentDealState(page);
  expect(state.closed.step).toBe(4);expect(state.closed.paid).toBe(false);expect(state.cash.paid).toBe(0);
  await page.locator('#oj-hero').getByRole('button',{name:'Record commission receipt'}).click();
  await page.locator('#de-event-confirm').check();
  await page.locator('#dealEventDialog').getByRole('button',{name:'Record commission receipt'}).click();
  state=await paymentDealState(page);
  expect(state.closed.step).toBe(4);expect(state.closed.paid).toBe(true);expect(state.cash.paid).toBe(0);
  await page.locator('#de-ack').check();
  await page.getByRole('button',{name:'Confirm stage change',exact:true}).click();
  expect((await paymentDealState(page)).closed.step).toBe(5);
  await page.getByRole('button',{name:'Add evidence',exact:true}).last().click();
  await page.locator('#de-file').setInputFiles(receiptFile);
  await page.getByRole('button',{name:'Attach evidence',exact:true}).click();
  state=await paymentDealState(page);
  expect(state.closed.milestones[4].documentIds).toHaveLength(1);expect(state.cash.paid).toBe(0);
  await page.getByRole('button',{name:'Void record',exact:true}).last().click();
  await page.locator('#de-reason').fill('Receipt was assigned to the wrong deal');
  await page.locator('#dealEventDialog').getByRole('button',{name:'Void record',exact:true}).click();
  state=await paymentDealState(page);
  expect(state.closed.step).toBe(4);expect(state.closed.paid).toBe(false);
  expect(state.closed.milestoneHistory[0].documentIds).toHaveLength(1);expect(state.cash.paid).toBe(0);
});

test('Deal workflow empty schedules and early-stage readiness stay accurate',async({page})=>{
  await openPaymentDeal(page,0);
  await page.evaluate(()=>{const opportunity=dealOpp(dealCur);getExt(opportunity).payments=[];renderDeal();});
  await expect(page.locator('#deal-root')).toContainText('No payment plan');
  expect(await page.locator('#deal-root').innerHTML()).not.toMatch(/NaN|Infinity/);
  await page.evaluate(()=>{const opportunity=dealOpp(dealCur);getExt(opportunity).payments=[{label:'Final on deed',amt:1000,status:'upcoming'}];});
  expect(await page.evaluate(()=>dealStageWarnings(dealOpp(dealCur),0))).toEqual([]);
});

test('Deal workflow records later facts early and supports cash-buyer bank outcomes',async({page})=>{
  await openPaymentDeal(page,1);
  await page.getByRole('button',{name:'Record deed signing',exact:true}).click();
  await page.locator('#de-event-confirm').check();
  await page.locator('#dealEventDialog').getByRole('button',{name:'Record deed signing'}).click();
  await expect(page.locator('#dealEventDialog')).not.toBeVisible();
  let state=await paymentDealState(page);
  expect(state.closed.step).toBe(1);expect(state.closed.milestones[3].date).toBeTruthy();
  await page.locator('#oj-hero').getByRole('button',{name:'Record bank approval'}).click();
  await page.locator('#de-bank-outcome').selectOption('not-required');
  await page.locator('#de-event-confirm').check();
  await page.locator('#dealEventDialog').getByRole('button',{name:'Record bank approval'}).click();
  await expect(page.locator('#de-error')).toContainText('reason');
  await page.locator('#de-reference').fill('Cash purchase with verified source of funds');
  await page.locator('#dealEventDialog').getByRole('button',{name:'Record bank approval'}).click();
  state=await paymentDealState(page);
  expect(state.closed.step).toBe(1);expect(state.closed.milestones[1].outcome).toBe('not-required');
  expect(state.closed.paid).toBe(false);expect(state.cash.paid).toBe(0);
});

for(const theme of ['light','dark']){
  for(const width of [1440,390]){
    test(`Deal workflow ${theme} drawer fits ${width} viewport and supports Escape`,async({page},testInfo)=>{
      await page.setViewportSize({width,height:844});
      await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
      await openPaymentDeal(page);
      await page.screenshot({path:testInfo.outputPath('deal-page.png'),fullPage:true});
      await page.getByRole('button',{name:'Record payment',exact:true}).click();
      const dialog=page.locator('#dealEventDialog');
      await expect(page.locator('#de-amount')).toBeFocused();
      const box=await dialog.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);
      expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
      for(const input of await dialog.locator('input,select,button').all()){
        const bounds=await input.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(box.x);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
      }
      await page.screenshot({path:testInfo.outputPath('receipt-drawer.png')});
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      expect((await paymentDealState(page)).cash.paid).toBe(0);
    });
  }
}

for(const theme of ['light','dark']){
  test(`CRM ${theme} supplied sidebar vectors load and navigate`,async({page})=>{
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    const icons=page.locator('#sidebar .crm-nav-icon');
    await expect(icons).toHaveCount(11);
    for(const width of [1728,390]){
      await page.setViewportSize({width,height:900});
      for(const icon of await icons.all()){
        const row=icon.locator('..');
        const view=await row.getAttribute('data-page');
        await row.click();
        await expect(page.locator(`#p-${view}`)).toBeVisible();
        await expect(icon).toHaveCSS('width','20px');
        await expect(icon).toHaveCSS('height','20px');
        const artwork=await icon.evaluate(async node=>{
          const style=getComputedStyle(node);
          const image=new Image();
          image.src=style.maskImage.slice(5,-2);
          await image.decode();
          const canvas=document.createElement('canvas');
          canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
          const context=canvas.getContext('2d');
          context.drawImage(image,0,0);
          const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
          let opaque=0,transparent=0;
          for(let index=3;index<pixels.length;index+=4){if(pixels[index])opaque++;else transparent++;}
          return {opaque,transparent,colour:style.backgroundColor,rowColour:getComputedStyle(node.parentElement).color};
        });
        expect(artwork.opaque).toBeGreaterThan(0);
        expect(artwork.transparent).toBeGreaterThan(0);
        expect(artwork.colour).toBe(artwork.rowColour);
      }
    }
  });

  test(`CRM ${theme} tokens, component geometry and table interaction`,async({page})=>{
    await page.setViewportSize({width:1728,height:1030});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;go('pipeline');setPipeView('board');},theme);
    await expect(page.locator('.app .sidebar')).toHaveCSS('width','256px');
    await expect(page.locator('#p-pipeline .card').first()).toHaveCSS('width','256px');
    await expect(page.locator('#p-pipeline .card').first()).toHaveCSS('border-radius','8px');
    await expect(page.locator('#p-pipeline .btn-primary').first()).toHaveCSS('height','28px');
    await expect(page.locator('.app .ws')).toHaveCSS('color',theme==='light'?'rgb(46, 45, 44)':'rgb(232, 232, 220)');
    await expect(page.locator('#navSearch')).toHaveCSS('border-top-width','0px');
    await expect(page.locator('#p-pipeline .btn-primary').first()).toHaveCSS('background-color',theme==='light'?'rgb(101, 122, 50)':'rgb(127, 148, 77)');
    await expect(page.locator('#studioApp .sidebar')).toHaveCSS('width','190px');
    await page.locator('#vt-table').click();
    await expect(page.locator('#pipe-table')).toBeVisible();
    await expect(page.locator('#pipe-rows td').first()).toHaveCSS('height','56px');
    await expect(page.locator('#pipe-rows td').first()).toHaveCSS('font-size','14px');
    await page.locator('#pipe-rows tr').first().click();
    await expect(page.locator('#p-opp')).toBeVisible();
  });

  test(`CRM ${theme} search filters, routes and fits mobile`,async({page})=>{
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;go('pipeline');},theme);
    const dialog=page.locator('#globalSearch');
    const input=page.locator('#gsInput');
    await page.locator('#navSearch').click();
    await expect(input).toBeFocused();
    await input.fill('Mike');
    await dialog.getByRole('button',{name:'Contacts',exact:true}).click();
    await expect(page.locator('.gs-row')).toHaveCount(1);
    const contactsNavIconMask=await page.locator('.nav [data-page="contacts"] .crm-nav-icon').evaluate(el=>getComputedStyle(el).maskImage);
    await expect(page.locator('.gs-vector')).toHaveCSS('mask-image',contactsNavIconMask);
    await input.press('Enter');
    await expect(page.locator('#p-contact')).toBeVisible();
    await page.keyboard.press('Control+k');
    await input.fill('#CM1203');
    await input.press('Enter');
    await expect(page.locator('#p-unit')).toBeVisible();
    await page.keyboard.press('Meta+k');
    await input.fill('OPP-1001');
    await input.press('Enter');
    await expect(page.locator('#p-opp')).toBeVisible();
    await page.locator('#navSearch').click();
    await input.fill('Dolphin brochure');
    await dialog.getByRole('button',{name:'Files',exact:true}).click();
    await page.locator('.gs-row').first().click();
    await expect(page.locator('#p-development')).toBeVisible();
    await expect(page.locator('#dv-tabc')).toContainText('Sales brochure');
    await page.locator('#navSearch').click();
    await input.fill('Dolphin');
    await dialog.getByRole('button',{name:'Properties',exact:true}).click();
    await page.locator('#gsSort').selectOption('az');
    const titles=await dialog.locator('[aria-label="Results"] .gs-title').allTextContents();
    expect(titles).toEqual([...titles].sort((first,second)=>first.localeCompare(second)));
    await input.focus();
    await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant','gs-result-1');
    await input.fill('<img src=x onerror=alert(1)>');
    await expect(page.locator('.gs-row')).toHaveCount(0);
    await expect(page.locator('.gs-empty img')).toHaveCount(0);
    await input.press('Enter');
    await expect(dialog).toBeVisible();
    await input.press('Escape');
    await expect(page.locator('#navSearch')).toBeFocused();
    await page.reload();
    await page.locator('#navSearch').click();
    await expect(dialog.locator('[aria-label="Recent"] .gs-row')).toHaveCount(3);
    await page.mouse.click(4,4);
    await expect(dialog).not.toBeVisible();
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    await page.locator('#navSearch').click();
    await input.fill('Dolphin');
    const bounds=await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(390);
    expect(bounds.y+bounds.height).toBeLessThanOrEqual(844);
    expect(await dialog.evaluate(element=>element.scrollWidth-element.clientWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  test(`CRM ${theme} mobile controls and drawer remain usable`,async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;go('pipeline');setPipeView('board');},theme);
    await expect(page.locator('.app .sidebar')).toHaveCSS('width','56px');
    await expect(page.locator('.app .main')).toHaveCSS('min-width','0px');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    expect(overflow).toBe(false);
    await page.locator('#p-pipeline .btn-primary').first().click();
    await expect(page.locator('#oppDrawer')).toBeVisible();
    await expect(page.locator('#oppDrawer')).toHaveCSS('width','390px');
    const field=page.locator('#oppDrawer input:not([type="checkbox"]):not([type="hidden"])').first();
    await expect(field).toHaveCSS('min-height','40px');
    await field.focus();
    await expect(field).toHaveCSS('outline-style','solid');
    await page.locator('#oppDrawer .od-head .x').click();
    await expect(page.locator('#oppDrawer')).toBeHidden();
    await page.locator('.app .tb-toggle').click();
    await expect(page.locator('.app .sidebar')).toBeHidden();
    await page.locator('.app .tb-toggle').click();
    await expect(page.locator('.app .sidebar')).toBeVisible();
    for(const view of ['dashboard','opp','settings','deals']){
      await page.evaluate(view=>view==='opp'?openOpp('OPP-1001'):go(view),view);
      const contentOverflow=await page.locator('.app .content').evaluate(node=>node.scrollWidth-node.clientWidth);
      expect(contentOverflow,`${view} should not overflow the mobile content area`).toBeLessThanOrEqual(1);
    }
    const summary=await page.locator('#deals-stats').boundingBox();
    const lastMetric=await page.locator('#deals-stats .csum').last().boundingBox();
    expect(lastMetric.x+lastMetric.width).toBeLessThanOrEqual(summary.x+summary.width+1);
    const payment=await page.locator('#deals-rows .closed-row').first().locator('.cr-date').first().boundingBox();
    const deed=await page.locator('#deals-rows .closed-row').first().locator('.cr-date').nth(1).boundingBox();
    expect(payment.x+payment.width).toBeLessThanOrEqual(deed.x);
  });

  test(`CRM ${theme} reference metrics, labels and timeline`,async({page})=>{
    await page.setViewportSize({width:1728,height:1030});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;go('contacts');},theme);
    await expect(page.locator('#p-contacts .ct-stat').first()).toHaveCSS('border-top-width','0px');
    await expect(page.locator('#p-contacts .ct-stat').first()).toHaveCSS('border-left-width','1px');
    await expect(page.locator('#ct-rows .p-tbuyer').first()).toHaveCSS('background-color',theme==='light'?'rgb(246, 231, 201)':'rgb(85, 64, 25)');
    await page.evaluate(()=>go('deals'));
    await expect(page.locator('#p-deals .csum').first()).toHaveCSS('border-radius','0px');
    await expect(page.locator('#deals-rows .closed-row').first().locator('.cr-commission')).toContainText('Commission');
    await page.locator('#deals-rows .closed-row').first().click();
    await expect(page.locator('#p-deal')).toBeVisible();
    await page.evaluate(()=>openOpp(OPPS.find(record=>record.lead==='Emma Farrugia'&&!record.closed).id));
    await expect(page.locator('#oj-hero .oj-title')).toHaveText('Timeline');
    await expect(page.locator('#oj-hero .oj-dot').first()).toHaveCSS('height','3px');
    const tabs=await page.locator('#opp-root .crm-page-controls > .tabs').boundingBox();
    const timeline=await page.locator('#p-opp #oj-hero').boundingBox();
    expect(tabs.y+tabs.height).toBeLessThanOrEqual(timeline.y);
    await page.locator('#oj-hero .oj-st').first().click();
    await expect(page.locator('#oj-pop')).toBeVisible();
  });

  test(`CRM ${theme} closed deal cards and hover feedback`,async({page})=>{
    await page.setViewportSize({width:1728,height:1030});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;go('deals');},theme);
    const expectedClosed=await page.evaluate(()=>OPPS.filter(record=>dealDone(record)).length);
    const closedCards=page.locator('#deals-rows .closed-row.is-complete');
    expect(expectedClosed).toBeGreaterThan(0);
    await expect(closedCards).toHaveCount(expectedClosed);
    const closed=closedCards.first();
    const active=page.locator('#deals-rows .closed-row:not(.is-complete)').first();
    const green=theme==='light'?'rgb(223, 236, 216)':'rgb(51, 77, 44)';
    await expect(closed).toHaveCSS('background-color',green);
    await expect(closed.locator(':scope > .pill')).toHaveText('Closed');
    await expect(active).toHaveCSS('background-color',theme==='light'?'rgb(255, 255, 255)':'rgb(28, 28, 26)');
    for(const card of [active,closed]){
      await page.mouse.move(0,0);
      await expect(card).toHaveCSS('box-shadow','none');
      const before=await card.boundingBox();
      await card.hover();
      await expect(card).not.toHaveCSS('box-shadow','none');
      expect(await card.boundingBox()).toEqual(before);
    }
    await expect(closed).toHaveCSS('background-color',green);
    await closed.click();
    await expect(page.locator('#p-deal')).toBeVisible();
  });
}

test('CRM development gallery shares selection with Present and keeps actions right aligned',async({page})=>{
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    await page.evaluate(()=>go('developments'));
    await expect(page.locator('#p-developments .page-sub')).toHaveCount(0);
    await expect(page.locator('#dv-grid input[type="checkbox"]')).toHaveCount(5);
    await expect(page.locator('.dv-card').first().locator('dt')).toHaveText(['Available','Ready','Budget','Property types']);
    await page.getByRole('checkbox',{name:'Select Dolphin Court',exact:true}).check();
    await page.getByRole('checkbox',{name:'Select Mercury',exact:true}).check();
    await expect(page.locator('#selbar')).toHaveClass(/on/);
    await expect(page.locator('#selbar .selbar-count')).toHaveText('2 developments selected');
    await expect(page.locator('#dv-present')).toHaveText('Present 2 developments');
    await page.evaluate(()=>dvSetView('list'));
    await expect(page.locator('#dv-grid input:checked')).toHaveCount(2);
    await page.locator('#dv-filter-row .crm-filter-field').filter({hasText:'Location'}).click();
    await page.locator('#dv-filter-menu .fd-item').filter({hasText:'Paola'}).click();
    await expect(page.locator('#dv-grid input:checked')).toHaveCount(1);
    await expect(page.locator('#dv-present')).toHaveText('Present 2 developments');
    await page.keyboard.press('Escape');
    await expect(page.locator('#selbar')).not.toHaveClass(/on/);
    await expect(page.locator('#dv-present')).toHaveText('Enter Present Mode');
    await page.evaluate(()=>{dvSetListF('loc','all');dvSetView('card');});
    await page.getByRole('checkbox',{name:'Select Dolphin Court',exact:true}).focus();
    await page.keyboard.press('Space');
    await page.locator('#selbar').getByRole('button',{name:'Select all',exact:true}).click();
    await expect(page.locator('#dv-grid input:checked')).toHaveCount(5);
    await expect(page.locator('#dv-present')).toHaveText('Present 5 developments');
    const controls=await page.locator('#dv-toolbar .crm-page-controls').boundingBox();
    const present=await page.locator('#dv-present').boundingBox();
    if(width===1440){
      expect(Math.abs(controls.x+controls.width-present.x-present.width)).toBeLessThanOrEqual(1);
      const presentCenter=present.y+present.height/2;
      for(const control of await page.locator('#dv-toolbar .viewtoggle button').all()){
        const bounds=await control.boundingBox();
        expect(Math.abs(bounds.y+bounds.height/2-presentCenter)).toBeLessThanOrEqual(1);
      }
      const chipRow=await page.locator('#dv-filter-row').boundingBox();
      expect(chipRow.y).toBeGreaterThanOrEqual(controls.y+controls.height-1);
    }
    const overflow=await page.locator('#p-developments').evaluate(node=>node.scrollWidth-node.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.locator('.dv-card-name').first().click();
    await expect(page.locator('#selbar')).not.toHaveClass(/on/);
    await expect(page.locator('#dv-root .page-sub')).toHaveCount(0);
    const detailControls=await page.locator('#dv-root .crm-page-controls').boundingBox();
    const detailPresent=await page.locator('#dv-root .crm-page-controls').getByRole('button',{name:'Enter present mode',exact:true}).boundingBox();
    expect(Math.abs(detailControls.x+detailControls.width-detailPresent.x-detailPresent.width)).toBeLessThanOrEqual(1);
  }
});

test('CRM views and filter workflow remain available',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const view of ['today','dashboard','pipeline','deals','properties','developments','contacts','newchat','chats','automations','calendar','reports','settings']){
    await page.evaluate(view=>go(view),view);
    await expect(page.locator(`#p-${view}`)).toBeVisible();
  }
  await page.evaluate(()=>go('pipeline'));
  await page.locator('#filter-row .crm-filter-field').filter({hasText:'Development'}).click();
  await expect(page.locator('#filter-menu')).toBeVisible();
  await page.locator('#filter-menu .fd-item').first().click();
  await expect(page.locator('#filter-row .crm-filter-field').filter({hasText:'Development'})).toHaveClass(/on/);
  expect(errors).toEqual([]);
});

test('CRM headers share responsive hierarchy and separate filters',async({page})=>{
  for(const width of [1728,390]){
    await page.setViewportSize({width,height:1030});
    for(const view of ['pipeline','deals','contacts','properties','developments','chats','reports','calendar','automations','dashboard','settings']){
      await page.evaluate(view=>go(view),view);
      const root=page.locator(`#p-${view}`);
      const heading=root.locator('.crm-page-heading').first();
      await expect(heading).toBeVisible();
      await expect(heading.locator('.toolbar')).toHaveCount(0);
      const headingBox=await heading.boundingBox();
      if(view!=='settings'){
        const controls=root.locator('.crm-page-controls').first();
        const controlsBox=await controls.boundingBox();
        expect(controlsBox.y,view).toBeGreaterThanOrEqual(headingBox.y+headingBox.height);
        expect(controlsBox.x+controlsBox.width,view).toBeLessThanOrEqual(width+1);
      }
      const overflow=await root.evaluate(node=>node.scrollWidth-node.clientWidth);
      expect(overflow,`${view} at ${width}`).toBeLessThanOrEqual(1);
      for(const filters of await root.locator('.crm-page-filters').all()){
        await expect(filters.locator('.tabs')).toHaveCount(0);
      }
    }
  }
});

for(const theme of ['light','dark']){
  for(const width of [1440,390]){
    test(`CRM filter operator ${theme} geometry fits ${width}`,async({page},testInfo)=>{
      await page.setViewportSize({width,height:900});
      await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;go('pipeline');},theme);
      await page.locator('#filter-row .crm-filter-field[data-label="Development"]').click();
      const menu=page.locator('#filter-menu');
      const header=menu.locator('.fm-group:visible .fd-operator');
      await expect(menu.locator('.fm-group:visible')).toHaveCount(1);
      await expect(header).toHaveText('Development is any of');
      await expect(header.locator('.fm-label')).toHaveText('Development');
      for(const [property,value] of Object.entries({width:'260px',height:'36px',padding:'8px','box-sizing':'border-box','border-radius':'4px','font-size':'12px','font-weight':'500','line-height':'16px','letter-spacing':'-0.15px','justify-content':'space-between','align-items':'center'})){
        await expect(header).toHaveCSS(property,value);
      }
      await expect(header).toHaveCSS('font-family',/Inter/);
      await expect(header).toHaveCSS('color',theme==='light'?'rgb(46, 45, 44)':'rgb(232, 232, 220)');
      await expect(header).toHaveCSS('background-color',theme==='light'?'rgb(240, 238, 234)':'rgb(28, 28, 26)');
      const bounds=await menu.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
      await menu.locator('.fm-group:visible .fd-item').first().click();
      await expect(menu).toBeVisible();
      await page.mouse.move(0,0);
      await expect(menu.locator('.fm-group:visible .fd-item.on').first()).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
      await page.screenshot({path:testInfo.outputPath('filter-dropdown.png')});
      await page.evaluate(()=>go('contacts'));
      await page.locator('#ct-filter-row .crm-filter-field[data-label="Status"]').click();
      await expect(page.locator('#ct-filter-menu .fm-group:visible .fd-operator')).toHaveText('Status is');
    });
  }
}

test('CRM filter operator preserves dropdown search and sort styling',async({page})=>{
  await page.evaluate(()=>go('properties'));
  await page.locator('#un-filter-row .crm-filter-field[data-label="View & features"]').click();
  const group=page.locator('#un-filter-menu .fm-group:visible');
  const search=group.locator('.fd-search input');
  const label=await group.locator('.fd-label').first().textContent();
  await search.fill(label);
  await expect(group.locator('.fd-item:visible')).not.toHaveCount(0);
  await search.fill('no-such-filter-option');
  await expect(group.locator('.fd-item:visible')).toHaveCount(0);
  await expect(group.locator('.fd-empty')).toHaveText('No matches');
  await search.fill('');
  await expect(group.locator('.fd-empty')).toHaveCount(0);
  await page.mouse.click(4,4);
  await page.locator('#un-filter-row [id$="-sort-trigger"]').click();
  const sort=page.locator('#un-filter-row .sort-menu');
  await expect(sort).toBeVisible();
  await expect(sort.locator('.fd-operator')).toHaveCount(0);
  await expect(sort.locator('.fd-item').first()).toHaveCSS('min-height','32px');
});

test('CRM multi-select field chips stay open across picks and merge selections into one chip',async({page})=>{
  for(const [view,rowId,field,menuId] of [
    ['pipeline','filter-row','Development','filter-menu'],
    ['properties','un-filter-row','Development','un-filter-menu'],
    ['deals','dl-filter-row','Development','dl-filter-menu']
  ]){
    await page.evaluate(view=>go(view),view);
    const chip=page.locator(`#${rowId} .crm-filter-field`).filter({hasText:field});
    await chip.click();
    const menu=page.locator(`#${menuId}`);
    await expect(menu).toBeVisible();
    const items=menu.locator('.fm-group:visible .fd-item');
    await items.nth(0).click();
    await expect(menu).toBeVisible();
    await items.nth(1).click();
    await expect(menu).toBeVisible();
    await expect(chip).toHaveClass(/on/);
    await expect(chip).toHaveText(`${field}2`);
    await expect(chip.locator('.crm-ff-count')).toHaveText('2');
    await page.mouse.click(4,4);
    await expect(menu).toBeHidden();
  }
});

test('CRM single-select field chips close after a pick and show the chosen value',async({page})=>{
  for(const [view,rowId,field,menuId] of [
    ['contacts','ct-filter-row','Status','ct-filter-menu'],
    ['chats','hist-filter-row','Chat scope','hist-filter-menu']
  ]){
    await page.evaluate(view=>go(view),view);
    const chip=page.locator(`#${rowId} .crm-filter-field`).filter({hasText:field});
    await chip.click();
    await page.locator(`#${menuId} .fm-group:visible .fd-item`).first().click();
    await expect(page.locator(`#${menuId}`)).toBeHidden();
    await expect(chip).toHaveClass(/on/);
    await expect(chip).toContainText(`${field}:`);
  }
});

test('CRM record headers keep tabs and actions below identity',async({page})=>{
  for(const width of [1728,390]){
    await page.setViewportSize({width,height:1030});
    for(const view of ['contact','unit','development','deal','opp']){
      await page.evaluate(view=>{
        if(view==='contact'){go('contacts');document.querySelector('#ct-rows tr').click();}
        if(view==='unit')openUnit(UNITS[0].id);
        if(view==='development')openDev(DEVS[0].id);
        if(view==='deal')openDeal(DEALS[0].id);
        if(view==='opp')openOpp(OPPS.find(record=>record.lead==='Emma Farrugia'&&!record.closed).id);
      },view);
      if(view==='contact')await page.locator('#ctPeek [onclick*="openContact"]').click();
      const root=page.locator(`#p-${view}`);
      const heading=root.locator('.crm-page-heading').first();
      await expect(heading).toBeVisible();
      const headingBox=await heading.boundingBox();
      expect(headingBox.x+headingBox.width,view).toBeLessThanOrEqual(width+1);
      if(view!=='deal'){
        const controls=root.locator('.crm-page-controls').first();
        const controlsBox=await controls.boundingBox();
        expect(controlsBox.y,view).toBeGreaterThanOrEqual(headingBox.y+headingBox.height);
        expect(controlsBox.x+controlsBox.width,view).toBeLessThanOrEqual(width+1);
      }
    }
    for(const tab of ['Notes','Details','Documents','Activity']){
      await page.locator('#p-opp .crm-page-controls .tab').getByText(tab,{exact:true}).click();
      await expect(page.locator('#p-opp .crm-page-controls .tab.on')).toHaveText(tab);
    }
    await page.locator('#p-opp .cr-actions-btn').click();
    await expect(page.locator('#p-opp #cr-actions-menu')).toBeVisible();
    await page.locator('#p-opp .page-title').click();
  }
});