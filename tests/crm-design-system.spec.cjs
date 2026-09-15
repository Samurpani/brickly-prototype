const {test,expect}=require('@playwright/test');
const ENTRY_URL='/prototypes/Bricly_OS_Prototype_v2.html';

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
    await expect(page.locator('#p-pipeline .btn-primary').first()).toHaveCSS('height','32px');
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
    const controls=await page.locator('#dv-toolbar').boundingBox();
    const present=await page.locator('#dv-present').boundingBox();
    expect(Math.abs(controls.x+controls.width-present.x-present.width)).toBeLessThanOrEqual(1);
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