// Floor plans and brochures without a proposal: Download, Copy link or Send, from wherever a home or development appears.
const UNIT="curPersona='owner';openUnit('#CM9703');";
const UNIT_MENU=`${UNIT}document.querySelector('#p-unit .cr-actions-btn').click();`;
const DEV="curPersona='owner';openDev('dolphin');dvSetTab('media');";
const DOCS=`${DEV}[...document.querySelectorAll('#p-development .dcard h3')].find(h=>h.textContent==='Floor plans').closest('.dcard').scrollIntoView({block:'start'});`;
const OPP="curPersona='owner';openOpp('OPP-1008');";
const CONTACT="curPersona='owner';openContact(CONTACTS.find(c=>c.name==='Maria Borg').id);ctSetTab('shared');";

module.exports={
  added:'20 Nov',
  id:'19', title:'Floor plans and brochures without a proposal',
  viewport:{width:1440,height:1000},
  source:'Sam, product review: a floor plan or brochure must stay quick to download or share', devItems:'—',
  changes:[
    'Every home and development has **Floor plans and brochures**: the unit page (**Actions › Floor plan and brochure**, which was a placeholder **Share brochure**), the development page (**Actions › Floor plans and brochure**, plus the Documents and Floor plans cards), the opportunity (**Floor plans and brochures** under the linked units) and the contact page (**Shared with › Floor plans and brochures**).',
    'The files: the **floor plan** of each home, and the development’s **brochure**, **price list** and **specification**.',
    'Each file has three buttons. **Download** saves a real PDF. **Copy link** copies a short link (**bricly.mt/f/…**) that always opens the current version, to paste into WhatsApp from a phone, an agent email or anywhere else. **Send** sends it to a buyer.',
    '**Send** on an opportunity or a contact with one opportunity opens that buyer’s message box with the file attached. From a unit or development page it first asks **Which buyer?**, listing buyers who have that home, then buyers interested in the development, with a search for anyone else.',
    'Only **Send** is recorded on the buyer, in Shared with client and Activity (“📎 Floor plan · #CM9703 (PDF)”). Download and Copy link aren’t tied to a buyer.',
    'The PDFs. **Floor plan**: the home’s facts and its published plan, or the indicative layout until one is published (Miami Tropic shows its real plan, in sq ft). **Brochure**: cover photo, story, amenities, what’s close by, then each home type with its plan, how many are available and the price from. **Price list**: available and held homes with price and status, plus the payment plan. **Specification**: each finish pack with its materials and price.',
    'On the development page, the fake **Share** and **Download** buttons on Documents are replaced by **Download**, **Copy link** and **Send**. Each type plan in Floor plans has a **PDF** button.',
    'Message › **Attach** offers the same files, including the brochure.',
  ],
  notes:[
    '`files.js` (`window.FL`): `list(units, devs)`, `forUnit`, `forDev` (one home per bedroom count stands for its type), `forOpp`, `download(k)`, `copy(k)`, `send(k, oppId?)`, `open(scope, id)` with scope `unit | dev | opp | contact`. Keys are shared with Message › Attach: `fp:<unit id>`, `br:`, `pl:`, `ss:` plus the development name.',
    'PDFs use the writer from the buyer proposal (`proposal/proposal-pdf.js`, now also loaded in the CRM). Plan image order: the published unit plan (`PV3D.planImg`), an uploaded image plan, Miami’s plan image, then the indicative drawing (`unPlanSVG`). Money and area go through `PV3.fmtIn` and `PV3.ar` with the development’s currency and unit (`PV3D.commerce`).',
    'Logged type is `devbrochure`, not `brochure`: old personalised brochures fold into the proposal as earlier versions (update 18), and a development brochure must not.',
    'A file sent from a unit page to a buyer whose opportunity doesn’t link that home is still attached; it isn’t linked to the opportunity.',
    'Prototype: the copied link is a stand-in. In production `bricly.mt/f/<id>` serves the current PDF and can be revoked from the development.',
    'Tests: `tests/staging-fixes-files.spec.cjs`.',
  ],
  tryIt:'v3: Units › #CM9703 › Actions › Floor plan and brochure. Or Developments › Dolphin Court › Media. Or Opportunities › Maria Borg › Floor plans and brochures (under Linked units) › Send.',
  before:[
    {label:'Unit page Actions: Share brochure only showed a message', run:UNIT_MENU, selector:'#un-actions-menu'},
    {label:'Development Media: Share and Download only showed a message', run:DOCS},
    {label:'Opportunity Linked units: no way to get a floor plan', run:`${OPP}document.getElementById('opp-units-card').scrollIntoView({block:'center'});`, selector:'#opp-units-card'},
    {label:'Contact Shared with: Send proposal only', run:CONTACT, selector:'#ct-root .dcard:has-text("Shared with")'},
  ],
  after:[
    {label:'Unit page Actions: Floor plan and brochure', run:UNIT_MENU, selector:'#un-actions-menu'},
    {label:'Development Media: Download, Copy link and Send; a PDF button on each type plan', run:DOCS},
    {label:'Opportunity Linked units: Floor plans and brochures', run:`${OPP}document.getElementById('opp-units-card').scrollIntoView({block:'center'});`, selector:'#opp-units-card'},
    {label:'Contact Shared with: Floor plans and brochures next to Send proposal', run:CONTACT, selector:'#ct-root .dcard:has-text("Shared with")'},
    {label:'New: the files for a home', run:`${UNIT}FL.open('unit','#CM9703');`, selector:'#qaDrawer'},
    {label:'New: Send from a unit page asks which buyer, with buyers who have this home first', run:`${UNIT}FL.send('fp:#CM9703');`, selector:'#qaDrawer'},
    {label:'New: the buyer’s message box opens with the file attached', run:`${UNIT}FL.send('fp:#CM9703');FL.attach('OPP-1008');await new Promise(r=>setTimeout(r,300));document.getElementById('opp-comp').scrollIntoView({block:'center'});`, wait:500},
    {label:'New: the PDFs (floor plan, brochure, price list, specification, a Miami Tropic plan)', url:'/docs/staging-fixes/assets/19-file-pdfs.png'},
  ],
};
