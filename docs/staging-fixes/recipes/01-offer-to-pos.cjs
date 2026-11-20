// Offer to promise of sale as one flow. The same steps run on the old and the new code where both have them.
const O=`curPersona='owner';openOpp('OPP-1008');`;
const OFFER=`${O}oppOfferOpen();document.getElementById('ofAmt').value=300000;[...document.querySelectorAll('#ofOut button')].find(b=>b.textContent==='Accepted').click();`;
const SAVED=`${OFFER}oppOfferSave();`;
const POS=`document.getElementById('ab-sign')?.scrollIntoView();`;

module.exports={
  id:'01', title:'Offer to promise of sale as one flow',
  viewport:{width:1440,height:1700},
  source:'Opportunity Flow report · S-07', devItems:'D-36, D-38, D-39',
  changes:[
    'One **Offer** on the opportunity with a status: Logged, Waiting for approval, Accepted, POS booked (also Countered, Rejected, Expired). It holds the unit, amount, deposit, payment plan, expiry and conditions, and keeps every round.',
    'Log an offer has the new fields and shows the asking price and how far below it the offer is.',
    'The rep’s rule for **Offer below asking price** in Settings › Approvals decides. Approval: any offer below asking needs the approver. Over limit: only offers more than the team’s % or € limit below asking. No approval: never. When approval is needed, saving it as Accepted sends an **Offer approval** to the rep’s approver, who approves the offer itself, and it becomes Accepted. The separate price exception from this flow is gone.',
    'Accepted still requests the hold on the unit automatically, as before.',
    'Every offer event shows in Activity with its status, and the latest one in the Offer row under the timeline strip (see update 12), for example “Maria offered €300,000 on #CM9703. Waiting for Rachel’s approval.” (D-38).',
    'New **Offer** card on the record: status, offer against asking, expiry, deposit and plan, rounds, and the next button (Send for approval, Mark accepted or Book POS signing) (D-39).',
    'Book POS signing has a required **Offer price**. It’s filled with the accepted offer, or left empty. Without an accepted offer, booking creates the offer at that price: if no approval is needed it’s accepted and booked; otherwise it goes for approval and the signing is saved until the manager approves (“We’ll book the signing once Rachel approves”).',
    'Nothing reaches the **Committed** timeline step without an accepted offer. A hold approved on its own keeps the opportunity at Interested and the next action becomes “Log Maria’s offer”.',
    'An opportunity can’t move to **Contract Booked** without an accepted offer: board drag and drop, the stage picker in Details and the quick view, bulk Move stage, Collect deposit and the timeline all stop with a clear message and a button to log the offer (D-36).',
  ],
  notes:[
    'The rule, limits and approver come from Settings › Approvals (rule key `price`, label “Offer below asking price”), read through `stApPolicy(rep,\'price\')` → {rule, limitPct, limitEur, approver}. A person’s own rule wins over the team default. Over limit applies when the offer is more than the % or more than the € amount below asking. Reps not in Team fall back to a 3% limit.',
    'Approval request type is `offer` with offer, asking, deposit, plan, expiry and conditions. Approving it sets the offer to Accepted, writes the timeline and activity rows and files the hold request. Rejecting it sets Rejected with the reason.',
    'A POS booking saved while the offer waits is kept with the offer and booked when it’s approved. Undo in Approvals removes the hold and the booking it created.',
    'The gate checks the pipeline stage Contract Booked (and Contract No Show) and the timeline’s Committed step. An approved hold still holds the unit; it just doesn’t commit the buyer until an offer is accepted.',
    'Older records with a free-text offer status are read as Accepted when the text says accepted or the opportunity is already past the hold step, and as Logged otherwise.',
  ],
  tryIt:'Opportunities › Maria Borg › Actions › Log an offer. Enter €300,000, choose Accepted and press Send for approval (Sam follows his team’s rule, which needs approval for any offer below asking). Then Approvals › the Offer approval › Approve. Try dragging Maria’s card to Contract Booked before and after.',
  before:[
    {label:'Log an offer', run:OFFER, selector:'#qaDrawer'},
    {label:'The record after an offer below asking', run:SAVED},
    {label:'Offer card on the record', run:`${SAVED}const c=[...document.querySelectorAll('#opp-root .dcard')].find(d=>d.querySelector(':scope > .side-h')?.textContent==='Offer');c.id='shot-offer';c.scrollIntoView({block:'center'});`, selector:'#shot-offer'},
    {label:'What goes to Approvals', run:`${SAVED}const r=APPROVALS.find(r=>r.opp==='OPP-1008'&&r.type==='price');go('approvals');apSel=r.id;apRender();`},
    {label:'Book POS signing', run:`${O}oppPosOpen();${POS}`, selector:'#qaDrawer'},
    {label:'Moving to Contract Booked without an accepted offer', run:`${O}oppDetailsApply('OPP-1008','stage','Contract Booked');renderOpp();`},
  ],
  after:[
    {label:'Log an offer: more fields, asking price and the 3% limit', run:OFFER, selector:'#qaDrawer'},
    {label:'Offer on the Timeline, in Activity and on the new Offer card', run:SAVED},
    {label:'Offer card: status, against asking, expiry, rounds, next step', run:`${SAVED}const c=document.getElementById('opp-offer-card');c.querySelector('details').open=true;c.scrollIntoView({block:'center'});`, selector:'#opp-offer-card'},
    {label:'One Offer approval, decided by the manager', run:`${SAVED}const r=APPROVALS.find(r=>r.opp==='OPP-1008'&&r.type==='offer');go('approvals');apSel=r.id;apRender();`},
    {label:'Book POS signing: required offer price', run:`${O}oppPosOpen();abSet('signUnit','#CM9703');${POS}const i=document.getElementById('of-pos-amt');i.value='300,000';ofPosPrice('300000');`, selector:'#qaDrawer'},
    {label:'Blocked with a clear message', run:`${O}oppDetailsApply('OPP-1008','stage','Contract Booked');`},
  ],
};
