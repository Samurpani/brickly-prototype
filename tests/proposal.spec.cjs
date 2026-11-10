const {test,expect}=require('@playwright/test');
const URL='/prototypes/v3/proposal/index.html';

test('Buyer proposal: auto intro, profile cover, development boxes, floating action, panel switcher, compare toggle and next-step states',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL);
  await page.evaluate(()=>localStorage.clear());
  await page.reload();

  // Personalised intro plays, then opens the proposal without a click
  const intro=page.locator('#intro');
  await expect(intro).toContainText('This proposal is for');
  await expect(intro.locator('.in-name')).toHaveText('Mike');
  await expect(intro).toBeHidden({timeout:5000});

  // Compact page: the brief lives on the cover, no separate brief or questions section
  const ids=await page.locator('#main > section, #main > footer').evaluateAll(els=>els.map(e=>e.id||e.className));
  expect(ids).toEqual(['top','letter','selection','compare','developer','next','foot']);
  await expect(page.locator('.cover .cv-goals li')).toHaveCount(5);
  await expect(page.locator('.cover .cv-goals button')).toHaveCount(0);
  await expect(page.locator('.cover .cv-goals .cvl')).toHaveText('Your goals');
  await expect(page.locator('.cover-name')).toHaveText('Mike Gatt');
  await expect(page.locator('.profile dt')).toHaveText(['Looking for','Budget','Handover','Purpose','Areas']);
  await expect(page.locator('.cv-media img')).toHaveCount(1);
  await expect(page.locator('.cv-media img')).toHaveAttribute('src',/cover-lounge\.jpg$/);
  await expect(page.locator('.letter .first')).toHaveText('Mike, thank you for coming to see Dolphin Court on Saturday.');

  // Each development is its own box, with its homes inside
  await expect(page.locator('.selection h2')).toHaveText('The properties you’re interested in.');
  await expect(page.locator('.sel-group')).toHaveCount(2);
  await expect(page.locator('.sel-group').nth(0).locator('.ucard')).toHaveCount(2);
  await expect(page.locator('.sel-group').nth(1).locator('.ucard')).toHaveCount(1);

  // Floating action follows the scroll and reserves the held home
  await page.locator('.selection').scrollIntoViewIfNeeded();
  await expect(page.locator('#fab')).toHaveClass(/on/);
  await expect(page.locator('#fab-go')).toHaveText('Reserve unit→');

  // Development opens in a side panel, in its own brand, with section navigation
  await page.locator('.sel-dev[data-open="d-onyx"]').click();
  const panel=page.locator('#panel');
  await expect(panel).toBeVisible();
  expect(await panel.evaluate(el=>getComputedStyle(el).getPropertyValue('--accent').trim())).toBe('#111111');
  await expect(panel.locator('.pn-nav a')).toHaveText(['Overview','Amenities','Location','Progress','Your homes']);
  await panel.locator('[data-tab="homes"]').click();
  await panel.locator('.pn-body [data-open="u-CM9702"]').click();
  await expect(panel.locator('.pn-t')).toHaveText('Residence 9702');
  await expect(panel.locator('.pn-sw [aria-current]')).toHaveText('9702');
  await expect(panel.locator('.pn-nav a')).toHaveText(['Overview','Renders and views','Floor plan','In the building','Payment plan','Investment']);
  await expect(panel.locator('.stack .lv.me')).toHaveCount(1);
  await expect(panel.locator('.plate .pu.me')).toHaveCount(1);
  // Switch development and home from the panel header, no going back
  await panel.locator('.pn-sw [data-open="u-CM1207"]').click();
  await expect(panel.locator('.pn-t')).toHaveText('Residence 1207');
  expect(await panel.evaluate(el=>getComputedStyle(el).getPropertyValue('--accent').trim())).toBe('#1F4E5F');
  await panel.locator('.pn-sw [data-open="d-dolphin"]').click();
  await expect(panel.locator('.pn-nav a').last()).toHaveText('Your homes');
  await panel.locator('[data-close]').click();
  await expect(panel).toBeHidden();


  // Compare toggles between homes and developments
  await page.locator('[data-cmp="devs"]').click();
  await expect(page.locator('#cmp-body')).toContainText('Amenities');
  await expect(page.locator('#cmp-body')).toContainText('Sky lounge');
  await page.locator('[data-cmp="homes"]').click();
  await expect(page.locator('#cmp-body')).toContainText('Estimated gross yield');

  // Nothing reserved: next step reserves a chosen home; the request then shows everywhere
  await expect(page.locator('#next h2')).toHaveText('Ready to reserve?');
  await page.locator('#next label',{hasText:'Residence 1207'}).click();
  await page.locator('#next [data-act="reserve-pick"]').click();
  const sheet=page.locator('#reserve');
  await expect(sheet).toContainText('Reserve Residence 1207');
  await sheet.getByRole('button',{name:'Send reservation request'}).click();
  await sheet.getByRole('button',{name:'Back to your proposal'}).click();
  await expect(page.locator('#next h2')).toHaveText('Sam is confirming your reservation');
  await expect(page.locator('.ucard[data-open="u-CM1207"] .pill')).toHaveText('Reservation requested');
  await expect(page.locator('#fab-go')).toHaveText('Contact Sam→');

  // Reserved: next step books the promise of sale
  await page.locator('.demo-t').click();
  await page.selectOption('#demo-res','CM9802');
  await expect(page.locator('#next h2')).toHaveText('Book your promise of sale');
  await expect(page.locator('#fab-go')).toHaveText('Book promise of sale→');
  await page.selectOption('#demo-ctx','request');
  await expect(page.locator('.letter .first')).toHaveText('Mike, thanks for getting in touch about Dolphin Court.');
  await expect(page.locator('.cv-goals .cvl')).toHaveText('Your requests');

  // A return visit gets the short welcome
  await page.reload();
  await expect(page.locator('#intro')).toContainText('Welcome back');
  expect(errors).toEqual([]);
});
