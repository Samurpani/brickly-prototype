const {test,expect}=require('@playwright/test');
const URL='/prototypes/v3/Bricly_OS_Prototype_v3.html';
const screen=page=>page.evaluate(()=>PV3.S?.screen);
async function load(page){await page.goto(URL);await page.evaluate(()=>{localStorage.removeItem('bricly.present.v3');localStorage.removeItem('bricly.present.prefs');});}
async function openUnit(page,uid){await page.evaluate(u=>prOpen(u),uid);await expect.poll(()=>screen(page)).toBe('unit');}

test('Each development prices in its market, with a display currency and live price hiding',async({page})=>{
  await load(page);
  await openUnit(page,'AP.3203');
  await expect(page.locator('.pv-ucard .hd .p b')).toHaveText('$1,154,000');
  await expect(page.locator('.pv-ucard .hd .p small')).toContainText('/ sq ft');
  await page.keyboard.press('Shift+P');
  await expect(page.locator('.pv-ucard .hd .p b')).toHaveText('Price on request');
  await page.keyboard.press('Shift+P');
  await page.evaluate(()=>{PV3.prefs.ccy='EUR';PV3.render();});
  await expect(page.locator('.pv-ucard .hd .p b')).toContainText('≈ €');
  await page.evaluate(()=>{PV3.prefs.ccy='local';PV3.close();});
  await openUnit(page,'#CM1207');
  await expect(page.locator('.pv-ucard .hd .p b')).toHaveText('€360,000');
  await expect(page.locator('.pv-ucard .hd .p small')).toContainText('/ m²');
});

test('Unit page shows the payment plan and ownership costs, and labels renders as illustrative',async({page})=>{
  await load(page);
  await openUnit(page,'AP.3203');
  await page.getByRole('button',{name:/Payment plan/}).click();
  await expect(page.locator('.pv-paysched > div')).toHaveCount(4);
  await expect(page.locator('.pv-paysched')).toContainText('10% · Reservation');
  await page.getByRole('button',{name:/Ownership costs/}).click();
  await expect(page.locator('.pv-ucard')).toContainText('Est. gross yield');
  await page.getByRole('tab',{name:'Renders'}).click();
  await expect(page.locator('.pv-ailabel').first()).toHaveText('Artist’s impression');
});

test('A rep holds a unit for 48 hours; other tabs see it, and the hold can be released',async({page,context})=>{
  await load(page);
  await openUnit(page,'AP.3203');
  await page.getByRole('button',{name:'Hold for 48 hours'}).click();
  await expect(page.locator('.pv-holdchip')).toContainText('Held for you · 47:59');
  expect(await page.evaluate(()=>[UN('AP.3203').status,PV3.S.sel.map(i=>i.uid)])).toEqual(['hold',['AP.3203']]);
  const other=await context.newPage();await other.goto(URL);
  expect(await other.evaluate(()=>UN('AP.3203')?.status)).toBe('hold');
  await page.getByRole('button',{name:'Release hold'}).click();
  expect(await page.evaluate(()=>UN('AP.3203').status)).toBe('available');
});

test('Live inventory: a selected unit sold elsewhere is flagged and left out of the shared link',async({page})=>{
  await load(page);
  await page.evaluate(()=>prOpenDev('dolphin'));await expect.poll(()=>screen(page)).toBe('present');
  await page.evaluate(()=>{PV3.toggleSel('#CM1207');PV3.toggleSel('#CM1203');});
  await page.evaluate(()=>PV3.simulateStatus('#CM1203','sold'));
  await expect(page.locator('.pv-toast')).toContainText('#CM1203 was just sold elsewhere');
  await page.evaluate(()=>{PV3.S.oppId='OPP-1001';PV3.go('checkout');});
  await expect(page.locator('.pv-warn')).toContainText('#CM1203 is no longer available');
  expect(await page.evaluate(()=>PV3.store.outputs[PV3.S.output].items.map(i=>i.uid))).toEqual(['#CM1207']);
});

test('A presentation interrupted by a reload resumes where it left off',async({page})=>{
  await load(page);
  await openUnit(page,'AP.3203');
  await page.evaluate(()=>{PV3.toggleSel('AP.3203');PV3.persist();});
  await page.reload();
  await expect.poll(()=>screen(page)).toBe('unit');
  expect(await page.evaluate(()=>[PV3.S.unit,PV3.S.sel.map(i=>i.uid)])).toEqual(['AP.3203',['AP.3203']]);
  await expect(page.locator('.pv-toast')).toContainText('Presentation restored');
});

test('Payment & ownership and Walkthrough slides; investor focus brings the numbers forward',async({page})=>{
  await load(page);
  await page.evaluate(()=>prOpenDev('miami-tropic'));await expect.poll(()=>screen(page)).toBe('present');
  await page.evaluate(()=>PV3.actions.pageGo('ownership'));
  await expect(page.locator('.pv-slide:not(.leaving) .pv-plan-steps li')).toHaveCount(4);
  await expect(page.locator('.pv-slide:not(.leaving)')).toContainText('Deposits are held by an independent escrow agent');
  await page.waitForTimeout(700);
  await page.evaluate(()=>PV3.actions.pageGo('walkthrough'));
  await expect(page.locator('.pv-slide:not(.leaving) .pv-walk .shot')).toHaveCount(5);
  await page.evaluate(()=>PV3.actions.focus('investor'));
  expect(await page.evaluate(()=>PV3.SECS.slice(0,4))).toEqual(['splash','intro','ownership','types']);
});

test('Consent gates WhatsApp and email; links expire and record when the buyer opens them',async({page,context})=>{
  await load(page);
  await page.evaluate(()=>{prOpenDev('dolphin');});await expect.poll(()=>screen(page)).toBe('present');
  await page.evaluate(()=>{PV3.toggleSel('#CM1207');PV3.go('checkout');});
  await page.getByRole('button',{name:'New buyer'}).click();
  await page.getByLabel('Name').fill('Consent Test');
  await page.getByLabel('Email (optional)').fill('c@test.mt');
  await page.getByRole('button',{name:'Create buyer & opportunity'}).click();
  await expect(page.getByRole('button',{name:'Email',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Record email consent'}).click();
  await expect(page.getByRole('button',{name:'Email',exact:true})).toBeEnabled();
  await expect(page.getByText('Not opened yet')).toBeVisible();
  const url=await page.evaluate(()=>PV3.outputURL(PV3.S.output));
  const buyer=await context.newPage();await buyer.goto(url);
  await expect(buyer.locator('.pv-buyer h1')).toHaveText('Consent, your selection');
  await expect(buyer.locator('.pv-buyer')).toContainText('Prices valid until');
  await expect.poll(()=>page.evaluate(()=>{PV3.render();return document.querySelector('.pv-box:nth-child(2)')?.textContent||document.body.textContent;})).toContain('Opened 1×');
  await page.evaluate(()=>{const o=PV3.store.outputs[PV3.S.output];o.expires=Date.now()-1000;PV3.save();});
  await buyer.reload();
  await expect(buyer.locator('.pv-empty')).toContainText('This selection has expired');
});

test('Live view follows the presenter; partner links present without CRM and register clients',async({page,context})=>{
  await load(page);
  await page.evaluate(()=>prOpenDev('miami-tropic'));await expect.poll(()=>screen(page)).toBe('present');
  await page.evaluate(()=>PV3.actions.liveShare());
  const id=await page.evaluate(()=>PV3.S.id);
  const viewer=await context.newPage();await viewer.goto(URL+'#present-live='+id);
  await expect.poll(()=>viewer.evaluate(()=>[PV3.S?.viewer,PV3.S?.dev])).toEqual([true,'miami-tropic']);
  await page.evaluate(()=>PV3.actions.pageGo('location'));
  await expect.poll(()=>viewer.evaluate(()=>PV3.SECS[PV3.S.sec])).toBe('location');
  await expect(viewer.locator('.pv-livepill')).toContainText('Live · following');
  await page.evaluate(()=>PV3.close());
  await page.evaluate(()=>prOpenLobby());await page.evaluate(()=>PV3.actions.skipIntro());
  await page.evaluate(()=>{PV3.actions.partnerOpen();PV3.S.partnerForm.name='Harbour Realty';PV3.S.partnerForm.devs=['dolphin'];return PV3.actions.partnerCreate();});
  const link=await page.evaluate(()=>PV3.S.partnerForm.link);
  const partner=await context.newPage();await partner.goto(link);
  await expect(partner.locator('.pv-brandmark.host')).toHaveAttribute('aria-label','Harbour Realty');
  await partner.evaluate(()=>PV3.actions.skipIntro());
  expect(await partner.evaluate(()=>PV3.galleryDevs().map(d=>d.id))).toEqual(['dolphin']);
  await partner.evaluate(()=>{PV3.S.dev='dolphin';PV3.toggleSel('#CM1207');PV3.go('thanks');});
  await partner.getByRole('button',{name:/Screen turned away/}).click();
  await expect.poll(()=>screen(partner)).toBe('register');
  await partner.getByLabel('Client name').fill('Partner Client');
  await partner.getByRole('button',{name:'Register client'}).click();
  await expect(partner.locator('h1')).toHaveText('Client registered.');
  expect(await partner.evaluate(()=>CONTACTS.find(c=>c.name==='Partner Client')?.source)).toBe('Partner: Harbour Realty');
});

test('Owner insights summarise interest across presentations',async({page})=>{
  await load(page);
  await openUnit(page,'AP.3203');
  await page.evaluate(()=>{PV3.toggleSel('AP.3203');PV3.actions.insightsOpen();});
  await expect(page.locator('h1')).toHaveText('Presentation insights');
  await expect(page.locator('.pv-dark')).toContainText('AP.3203');
});

test('Filters zoom the showcase out to tiles, fade non-matches live, and Apply zooms back into the first match',async({page})=>{
  await load(page);
  await page.evaluate(()=>{prOpenLobby();PV3.actions.skipIntro();});
  await expect(page.locator('.pv-card.center h2')).toHaveText('Miami Tropic');
  await page.getByRole('button',{name:/^Filters/}).click();
  await expect(page.locator('.pv-ftile')).toHaveCount(6);
  await page.locator('[data-a=fsec][data-v=loc]').click();
  await page.locator('[data-a=gLoc][data-v="Paola"]').click();
  await expect(page.locator('.pv-ftile[data-m="1"]')).toHaveCount(1);
  await expect(page.locator('.pv-ftile.out')).toHaveCount(5);
  await expect(page.locator('.pv-fcount')).toContainText('1 of 6 developments match');
  await page.locator('.pv-ftile[data-v="mercury"]').click({force:true});
  await expect(page.locator('.pv-ftiles')).toBeVisible();
  await page.locator('.pv-show').click();
  await expect(page.locator('.pv-ftile')).toHaveCount(0);
  await expect(page.locator('.pv-card.center h2')).toHaveText('Dolphin Court');
  await page.getByRole('button',{name:/^Filters/}).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.pv-ftile')).toHaveCount(0);
});

test('Sold or reserved residences can’t be added; compare picks one and closes: hold, buyer, reserve, signing',async({page})=>{
  await load(page);
  await page.evaluate(()=>prOpenDev('miami-tropic'));await expect.poll(()=>screen(page)).toBe('present');
  const sold=await page.evaluate(()=>PV3.D.unitsOf('miami-tropic').find(u=>u.status==='sold').id);
  await page.evaluate(id=>PV3.toggleSel(id),sold);
  expect(await page.evaluate(()=>PV3.S.sel.length)).toBe(0);
  await expect(page.locator('.pv-toast')).toContainText('can’t be added');
  await page.evaluate(()=>{['AP.3203','AP.3803'].forEach(id=>PV3.toggleSel(id));PV3.actions.compare();});
  await page.getByRole('tab',{name:'Payments & value'}).click();
  await expect(page.getByRole('table',{name:'Unit comparison'})).toContainText('Est. gross yield');
  await page.locator('[data-a=choose][data-v="AP.3203"]').click();
  await page.locator('.pv-secure').getByRole('button',{name:'Hold for 48 hours'}).click();
  await page.locator('.pv-sform [data-f=lname]').fill('Close Test');
  await page.locator('.pv-sform').getByRole('button',{name:'Save buyer'}).click();
  await page.locator('.pv-secure').getByRole('button',{name:'Send reservation agreement'}).click();
  await page.locator('.pv-slots [data-a=slotDay]').first().click();
  await page.locator('.pv-slots [data-a=slotTime][data-v="10:00"]').click();
  await page.locator('.pv-secure').getByRole('button',{name:'Book contract signing'}).click();
  await expect(page.locator('.pv-sstep.done')).toHaveCount(4);
  expect(await page.evaluate(()=>{const o=OPPS.find(x=>x.id===PV3.S.oppId);return [o.lead,o.stage,UN('AP.3203').status];})).toEqual(['Close Test','Contract Booked','hold']);
});

test('Amenities slide through renders from the list or the arrows; Close is on every presentation screen',async({page})=>{
  await load(page);
  await page.evaluate(()=>prOpenDev('miami-tropic'));await expect.poll(()=>screen(page)).toBe('present');
  await page.evaluate(()=>PV3.actions.pageGo('amenities'));
  await expect(page.locator('.pv-slide:not(.leaving) .pv-amen-slide')).toHaveCount(6);
  await page.locator('.pv-slide:not(.leaving) [data-life-item=amen][data-v="3"]').click();
  await expect(page.locator('.pv-slide:not(.leaving) .pv-amen-slide.cur figcaption b')).toHaveText('Residents’ dining by Jean-Georges');
  await page.locator('.pv-slide:not(.leaving) .pv-amen-ctl [data-v="1"]').click();
  await expect(page.locator('.pv-slide:not(.leaving) .pv-amen-ctl .cnt')).toHaveText('05 / 06');
  await expect(page.getByRole('button',{name:'Close Present Mode'})).toBeVisible();
  await page.evaluate(()=>PV3.openUnit('AP.3203'));
  await expect(page.getByRole('button',{name:'Close Present Mode'})).toBeVisible();
  await page.getByRole('button',{name:'Close Present Mode'}).click();
  await expect(page.locator('#pv-shell')).toHaveCount(0);
});
