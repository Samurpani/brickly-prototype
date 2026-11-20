// Opportunity strip, derived. Before and after run the same steps on the old and the new code.
const O=id=>`curPersona='owner';openOpp('${id}');`;
const QUAL=`curPersona='owner';const o=OPPS.find(r=>r.id==='OPP-1006');const c=oppDetailsContact(o);c.finance='';c.bmin=null;c.bmax=null;o.budget=null;o.budgetMin=null;o.budgetMax=null;openOpp('OPP-1006');`;
const OFFER_HOLD=`${O('OPP-1008')}oppOfferOpen();document.getElementById('ofAmt').value=300000;[...document.querySelectorAll('#ofOut button')].find(b=>b.textContent==='Accepted').click();oppOfferSave();uhFile(oppCur,'#CM9703');`;
const ELSEWHERE=`${O('OPP-1008')}apApprove('REQ-1041');openOpp('OPP-1008');uhFile(oppCur,'#CM9822');`;
const BOARD=`curPersona='owner';go('pipeline');setPipeView('board');document.querySelector('#board-cols .card[data-opp-id="OPP-1008"]').scrollIntoView({block:'center',inline:'center'});`;
const H='#oj-hero';

module.exports={
  id:'12', title:'Opportunity strip, derived',
  viewport:{width:1440,height:1000},
  source:'Opportunity Flow report · update 12 (replaces update 02)', devItems:'D-28, D-36',
  changes:[
    'The timeline strip is back in its original layout: **Units · Next step · Next booked · Blocker · main button**. Update 02’s compact hold card and its “See all steps” collapse are removed.',
    'Nothing in the strip is typed. The typed **Next action** field (strip, Details tab, quick view) is gone. Existing typed next actions were turned into Tasks, so nothing is lost.',
    '**Units:** one card per unit (up to 3, then “+N”) with unit, type, price, an “Offer €X” line when there is one, and one status chip: Shortlisted, Hold requested, Held · until date (amber under 48 hours), Reserved · deposit, Held for another buyer · you’re Nth, Gone · reserved or sold to another buyer. Click opens the unit side panel. No units: “No units yet” with Add units.',
    '**Next step** is the first open step of five: Qualify, Viewing, Hold a unit, Agree an offer, Book POS signing, with a reason from the record (for example “Viewing · outcome needed”, “Hold a unit · waiting for Rachel”, “Book POS signing · KYC docs missing”). Clicking it and the main button run the same action, and the button label matches.',
    '**Skip** lets the rep skip the current step with an optional reason. It’s logged in Activity and shows as skipped on the stage bar.',
    '**Next booked** shows the earliest open appointment or task (type, date and time, with whom). “Nothing booked” in amber with Book, “outcome needed” in amber, overdue tasks in red. If Next step already names that appointment, the next one is shown.',
    '**Blocker** only appears when a rule fires: hold ends within 48 hours, offer waiting in Approvals, KYC missing before POS, finance not confirmed after the offer, no reply in 5 days. Each shows cause, owner (Buyer or Us) and a fix link. It never says “None”. A blocker the strip already tells elsewhere isn’t repeated: offer waiting puts **Open approval** on the Offer row, hold ending soon puts **Extend hold** on the Hold row.',
    'Status rows under the strip in the Offer-row style: **Offer** (from update 01) and a new **Hold** row (Requested, Held, Expiring).',
    'The stage bar shows every step under its stage as ticks: done ✓, skipped –, open ○. The current step is highlighted and always matches Next step.',
    'Opportunities list: new **Next step** and **Next booked** columns. Board cards: one line each for Next step and Next booked, replacing the next-action line. New **Status** filter: Nothing booked, Next step overdue, Outcome needed, Has blocker.',
  ],
  notes:[
    '`oppStrip(o)` returns `{units, nextStep, nextBooked, blocker}` (plus `blockers`, `steps`) so other channels can ask what’s blocking a buyer.',
    'Steps tick from records: Qualify = budget and finance route filled; Viewing = a viewing or Present session with a logged outcome; Hold = a hold approved; Offer = an offer accepted; Book POS signing = a POS signing booked. They can tick in any order.',
    'After all five, the strip shows **Sign the POS** under Contracted, which runs the existing create-deal flow.',
    'When the reservation deposit isn’t in yet, Book POS signing’s action is **Collect deposit**.',
    '`oppStrip(o).blockers` always lists every blocker. `shownIn` says where one is already shown instead of the Blocker slot: `next` (the Next step reason), `offer` (Offer row) or `hold` (Hold row). `shownBlockers` is what the slot draws.',
    'Extend hold sends an extension request (3, 7 or 14 days) to the approver and logs it in Activity. In the prototype it doesn’t create an Approvals item yet.',
    'Owner “Developer” for approvals is only for agency accounts and isn’t used in this prototype.',
    'Typed next actions became tasks for the rep on the record (due today or tomorrow where the old value said so; otherwise no date with the old due text in the description).',
  ],
  tryIt:'Opportunities › Maria Borg (viewing outcome needed), Mike Gatt (hold waiting), Kim Farrugia (committed, KYC blocker). Opportunities › list view › Status › Nothing booked.',
  before:[
    {label:'New lead that needs qualifying', run:QUAL, selector:H},
    {label:'Viewing outcome needed', run:O('OPP-1008'), selector:H},
    {label:'Offer waiting for approval, hold requested', run:OFFER_HOLD, selector:H},
    {label:'Committed, booking the POS, KYC missing', run:O('OPP-1014'), selector:H},
    {label:'Stage bar', run:O('OPP-1001'), selector:'#oj-hero .oj-bar'},
    {label:'Unit held for another buyer', run:ELSEWHERE, selector:H},
    {label:'Board card', run:BOARD, selector:'#board-cols .card[data-opp-id="OPP-1008"]'},
    {label:'Opportunities list', run:`curPersona='owner';go('pipeline');setPipeView('table');`},
  ],
  after:[
    {label:'Qualify · budget and finance missing', run:QUAL, selector:H},
    {label:'Viewing · outcome needed', run:O('OPP-1008'), selector:H},
    {label:'Offer and Hold rows; Open approval sits on the Offer row, no duplicate blocker', run:OFFER_HOLD, selector:H},
    {label:'Committed: deposit next, KYC blocker with owner and fix', run:O('OPP-1014'), selector:H},
    {label:'Stage bar with every step tick', run:O('OPP-1001'), selector:'#oj-hero .oj-bar'},
    {label:'Chip: Held for another buyer · you’re 3rd', run:ELSEWHERE, selector:'#osp-units'},
    {label:'Board card: Next step and Next booked lines', run:BOARD, selector:'#board-cols .card[data-opp-id="OPP-1008"]'},
    {label:'List: new columns and the Nothing booked filter', run:`curPersona='owner';go('pipeline');setPipeView('table');pipeF.status=['none'];pipeRenderAll();`},
  ],
};
