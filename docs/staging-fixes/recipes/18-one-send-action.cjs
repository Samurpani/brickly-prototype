// One send action: Send proposal. Custom pack, unit details and brochure are gone; old packs become proposal versions;
// single files are attached in Message; the buyer page downloads real PDFs.
const MARIA="curPersona='owner';localStorage.removeItem('bricly.proposal.eng');openOpp('OPP-1008');";
const MENU=`${MARIA}document.querySelector('#opp-root .cr-actions-btn').click();`;
const CARD=`${MARIA}document.getElementById('sw-card').scrollIntoView({block:'start'});`;
const EMPTY="curPersona='owner';const x=getExt(OPPS.find(o=>o.id==='OPP-1008'));x.swEmpty=true;x.swAssets=[];x.shared=[];openOpp('OPP-1008');document.getElementById('sw-card').scrollIntoView({block:'start'});";
const BARE="curPersona='owner';const o=OPPS.find(o=>o.id==='OPP-1009');o.units=[];o.devs=[];openOpp(o.id);";
const BUYER='/prototypes/v3/proposal/index.html';
const SEEN="localStorage.setItem('bricly.proposal.seen.'+PROPOSAL.token,'1');";
// The buyer page's welcome screen hides the page on load; screenshots skip it.
const NOINTRO="const i=document.getElementById('intro');if(i)i.hidden=true;document.body.classList.remove('intro-open');";
const FOOT=`${NOINTRO}document.querySelector('.foot').scrollIntoView({block:'start'});`;
// Opens Maria's sent proposal, as she sees it, inside the CRM page (same origin), with #CM9703 sold since.
const AS_MARIA=`${MARIA}sbSimSold('#CM9703');const a=swAssets(oppCur).find(a=>a.type==='proposal');let u;window.open=x=>{u=x;};sbAsBuyer(a.id);
const f=document.createElement('iframe');f.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:99999;background:#fff';f.src=u+'&preview=1';document.body.appendChild(f);
await new Promise(r=>f.onload=r);await new Promise(r=>setTimeout(r,600));const w=f.contentWindow;
const i=w.document.getElementById('intro');if(i)i.hidden=true;w.document.body.classList.remove('intro-open');w.PROPOSAL_APP.openPanel('u-CM9703');`;

module.exports={
  added:'20 Nov',
  id:'18', title:'Send proposal is the only way to send to a buyer',
  viewport:{width:1440,height:1000},
  source:'Sam, product review: custom pack, unit details and proposal do the same job', devItems:'—',
  changes:[
    '**Send proposal** is the only send action on the opportunity. **Send unit details** was a second name for the same drawer and is gone from Actions. A proposal with one home does the same job. **Create custom pack** and **Continue custom pack (draft)** are gone too.',
    'Every other way in opens the same drawer: the journey step after an appointment (renamed from **Send follow-up pack** to **Send proposal**), the empty **Shared with client** card (one button instead of two), the contact page (**Send proposal** instead of **+ Send something › Send brochure**), and old custom pack links and tasks.',
    'The rep needs a linked development or home. With neither, the drawer says **Link a development or a home to Nathan’s opportunity first** and offers **Link a home** and **Link a development**. With a development but no homes, no homes are picked for the rep. The drawer says **Pick the homes for Nathan from La Lex** and Continue stays off until one is added. Before, it picked two homes at random.',
    'Linked homes that have sold or been reserved are left out and named: **#CM9703 is no longer available and was left out.**',
    '**Old packs become proposal versions.** A personalised brochure, microsite or custom pack that was sent becomes an earlier version of the opportunity’s one **Buyer proposal**. Maria’s brochure from 22 Sep is now **v1** and her proposal from 25 Sep is **v2**. The card says **Includes 1 earlier pack sent before proposals**. **Versions** lists each one with the homes as they were sent. Unsent drafts are dropped.',
    'When a home in the proposal sells or is reserved, the card warns: **#CM9703 sold since v2. Maria still sees it in the proposal.** with **Send new version**. Versions marks it on every version that included it. On the buyer page the home shows **No longer available**, and the button reads **Ask Sam for similar homes** instead of Reserve.',
    '**Attach** in the opportunity’s message box: floor plans for the linked homes, and the price list and specification for each linked development. Picked files show as chips. If the message is empty, a line is drafted (“Hi Maria, here is the floor plan you asked for.”). Each file sent is logged in Shared with client. **Share** and **Resend** on a floor plan, price list or spec card open this composer with the file attached, instead of a separate share sheet.',
    '**Downloads on the buyer page are real PDFs**: **Proposal PDF** (cover and letter, one page per home with render, facts, floor plan and payment plan, the side-by-side comparison, then the next step and legal text), **Floor plans** (one page per home), **Specification** and **Price list**. Each home’s Floor plan tab has **Download floor plan (PDF)**. **Download PDF** in the CRM card opens the buyer page and downloads the same file.',
    'Removed: Settings › **Buyer pack standards**. Settings › Proposal page is the one standard. Stage guidance now says **Send a proposal** instead of “Send a follow-up pack”.',
  ],
  notes:[
    'Removed `custom-pack.js` (812 lines). Its option catalog (`CP_CATALOG`, `cpCat`) moved to `unit-media.js`, which seeds development finishes and layouts from it. `send-buyer.js` and `deal-convert.js` read `cpCat`. The original wizard code in the HTML can’t be reached any more, because `crOpen`, `crResume`, `cpUnitDetails`, `cpAgentOpen` and `qaBrochure` all open `sbOpen`.',
    'Fold (`swFold` in `client-share.js`): assets of type `brochure`, `microsite` or `pack` with a delivered attempt become versions `{v, when, ch, from:"legacy", legacy:<title>, units, note}` of the proposal asset. All versions are sorted by send date and renumbered. Attempts carry the new version numbers. If the newest version is an old pack, the proposal’s current homes and message come from it. Each sent version now stores `units`.',
    'Homes no longer available: unit status `sold`, `reserved` or `contract`. The card, Versions and the drawer read live unit status. The buyer page gets the status in the issue (`homes[].status`) and shows the home as `gone`.',
    'Attach (`client-share.js`): files come from the opportunity’s linked units and developments, plus files already shared with this buyer. Sending adds `sub: 📎 … (PDF)` to the message and a `Delivered` attempt on the file asset (`floorplan`, `pricelist` or `spec`). Not offered on internal notes.',
    'PDFs: `proposal/proposal-pdf.js` is a small writer (A4, Helvetica, JPEG images, WinAnsi; Maltese letters fall back to ħ→h, ż→z). `proposal.js` lays out the pages from the same data the page shows. The floor plan is the page’s SVG drawing rasterised. `?pdf=proposal|plans|spec|prices` downloads on load. File names: `Proposal-<Buyer>-v<n>.pdf`, `Floor-plan-<Residence>-<Buyer>-v<n>.pdf`.',
    'Prototype only: **⋯ › #CM9703 sells to another buyer** in Shared with client marks the home sold so the warnings can be seen.',
    'Tests: `tests/staging-fixes-send.spec.cjs` (one way in, link required, fold and sold flags, attach) and `tests/proposal.spec.cjs` (PDF downloads).',
  ],
  tryIt:'v3: Opportunities › Maria Borg. Actions has one send option. In Shared with client, open Versions on the proposal, then ⋯ (top right) › #CM9703 sells to another buyer. Message › Attach › Floor plan · #CM9814 › Send. Open the proposal (View) › Downloads › Proposal PDF.',
  before:[
    {label:'Actions: Send proposal, Send unit details and custom pack', run:MENU, selector:'#cr-actions-menu'},
    {label:'Send unit details: a second name for the same drawer (shown as “homes from the compare shortlist”)', run:`${MARIA}cpUnitDetails('OPP-1008');`, selector:'#qaDrawer'},
    {label:'Shared with client: brochure and proposal as separate items', run:CARD, selector:'#sw-card'},
    {label:'Nothing shared yet: two buttons', run:EMPTY, selector:'#sw-card'},
    {label:'No development or home linked: an empty drawer', run:`${BARE}sbOpen('OPP-1009');`, selector:'#qaDrawer'},
    {label:'Message box: text only', run:`${MARIA}qaMessage();`, selector:'.opp-comp'},
    {label:'Buyer page Downloads: the buttons only showed a message, nothing downloaded', url:BUYER, run:FOOT, selector:'.foot', wait:900},
  ],
  after:[
    {label:'Actions: Send proposal only', run:MENU, selector:'#cr-actions-menu'},
    {label:'Send proposal: the same drawer, one home or several', run:`${MARIA}sbOpen('OPP-1008');`, selector:'#qaDrawer'},
    {label:'Shared with client: one proposal, the brochure is v1 of it; a home sold since is flagged', run:`${CARD}sbSimSold('#CM9703');document.getElementById('sw-card').scrollIntoView({block:'start'});`, selector:'#sw-card'},
    {label:'Nothing shared yet: one button', run:EMPTY, selector:'#sw-card'},
    {label:'No development or home linked: link one first', run:`${BARE}sbOpen('OPP-1009');`, selector:'#qaDrawer'},
    {label:'Message box: Attach a floor plan, price list or specification', run:`${MARIA}qaMessage();await new Promise(r=>setTimeout(r,200));swAttPick('fp:#CM9814');swAttToggle();document.getElementById('opp-comp').scrollIntoView({block:'center'});`, wait:400},
    {label:'Buyer page Downloads: real PDFs built from this proposal', url:BUYER, run:FOOT, selector:'.foot', wait:900},
    {label:'New: Versions shows the brochure as v1 and the sold home on each version', run:`${MARIA}sbSimSold('#CM9703');sbHistory(swAssets(oppCur).find(a=>a.type==='proposal').id);`, selector:'#qaDrawer'},
    {label:'New: a development linked, no homes: the rep picks', run:`${BARE}OPPS.find(o=>o.id==='OPP-1009').devs=['La Lex'];sbOpen('OPP-1009');`, selector:'#qaDrawer'},
    {label:'New: the home’s Floor plan tab has Download floor plan (PDF)', url:BUYER, run:`${NOINTRO}PROPOSAL_APP.openPanel('u-CM9802','plan');`, wait:1200},
    {label:'New: Maria’s proposal marks #CM9703 No longer available and offers similar homes', run:AS_MARIA, wait:1500},
    {label:'New: the PDFs (proposal cover, a home, side by side, floor plan, price list)', url:'/docs/staging-fixes/assets/18-pdf-pages.png'},
  ],
};
