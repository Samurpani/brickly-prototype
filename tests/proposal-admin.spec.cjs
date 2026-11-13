const {test,expect}=require('@playwright/test');
const CRM='/prototypes/v3/Bricly_OS_Prototype_v3.html';

test('Proposal page settings: brand, draft, publish, and the buyer page follows the published standard',async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(CRM);
  await page.evaluate(()=>localStorage.removeItem('bricly.proposal.std'));
  await page.evaluate(()=>paOpenSettings());
  await expect(page.locator('.page-title',{hasText:'Proposal page'})).toBeVisible();
  await expect(page.locator('#pa-bar b')).toHaveText('Published v1');
  await expect(page.locator('.pa-tpl.on b')).toHaveText('Signature');

  // Required sections can't be switched off
  await expect(page.locator('.pa-row',{hasText:'Your next step'}).locator('.pa-lock')).toHaveText('Always · required');

  // Changes are a draft until published
  await page.locator('.pa-row',{hasText:'Built on trust'}).getByRole('radio',{name:'Off'}).click();
  await page.locator('.pa-sw',{hasText:'Show prices'}).locator('input').click();
  await expect(page.locator('#pa-bar b')).toHaveText('Draft · 2 changes');
  // Brand: unreadable colours block publishing; the company accent reaches the buyer page
  const brand=page.locator('.st-card',{has:page.locator('h3',{hasText:/^Brand$/})});
  await brand.locator('.pa-bl',{hasText:'Dolphin Court'}).click();
  const muted=()=>page.locator('.st-card',{has:page.locator('h3',{hasText:/^Brand$/})}).locator('.pa-color',{hasText:'Secondary text'}).locator('.pa-hex');
  await muted().fill('#D0D8DA');await muted().press('Tab');
  await expect(page.locator('#pa-bar')).toContainText('Can’t publish: Dolphin Court');
  await expect(page.getByRole('button',{name:'Publish v2'})).toBeDisabled();
  await muted().fill('#4F5D63');await muted().press('Tab');
  await page.locator('.st-card',{has:page.locator('h3',{hasText:/^Brand$/})}).locator('.pa-bl',{hasText:'Frames every proposal'}).click();
  const accent=page.locator('.st-card',{has:page.locator('h3',{hasText:/^Brand$/})}).locator('.pa-color',{hasText:'Accent and buttons'}).locator('.pa-hex');
  await accent.fill('#2F5D50');await accent.press('Tab');
  await expect(page.locator('#pa-bar b')).toHaveText('Draft · 3 changes');
  await page.getByRole('button',{name:'Publish v2'}).click();
  await expect(page.locator('#qaDrawer')).toContainText('Built on trust → Off');
  await page.locator('#qaDrawer').getByRole('button',{name:'Publish v2'}).click();
  await expect(page.locator('#pa-bar b')).toHaveText('Published v2');
  await expect(page.locator('.cp-std-v .sw-li').first()).toContainText('v2');

  // Rep: homes and message only, then preview and send
  await page.evaluate(()=>openOpp('OPP-1001'));
  await expect(page.locator('.pa-ban')).toContainText('Proposal ready for Mike');
  await page.locator('.pa-ban').getByRole('button',{name:'Review and send'}).click();
  const drawer=page.locator('#qaDrawer');
  await expect(drawer).toContainText('#CM9802');
  await expect(drawer).toContainText('standard v2');
  await page.selectOption('#pa-add','#CM1207');
  await expect(drawer.locator('.pa-home')).toHaveCount(2);
  await expect(page.locator('#pa-msg')).toHaveValue(/the 2 homes/);
  const [buyer]=await Promise.all([context.waitForEvent('page'),drawer.getByRole('button',{name:'Preview'}).click()]);
  await buyer.waitForLoadState();
  await expect(buyer.locator('#intro')).toBeHidden({timeout:6000});
  await expect(buyer.locator('#developer')).toHaveCount(0);
  expect(await buyer.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim())).toBe('#2F5D50');
  await expect(buyer.locator('.ucard-price')).toHaveText(['Price on request','Price on request']);
  await expect(buyer.locator('.letter .first')).toHaveText(/^Mike, /);
  await buyer.close();
  await drawer.getByRole('button',{name:'Send on WhatsApp'}).click();
  await expect(page.locator('.pa-ban')).toHaveCount(0);
  expect(await page.evaluate(()=>swAssets(oppCur).filter(a=>a.pp).map(a=>a.units.join(',')))).toEqual(['#CM9802,#CM1207']);
  expect(errors).toEqual([]);
});
