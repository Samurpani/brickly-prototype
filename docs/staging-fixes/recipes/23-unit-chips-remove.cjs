// Opportunity timeline: full-width stage bar, compact unit chips with +N, and × to remove a unit everywhere.
const O=id=>`curPersona='owner';openOpp('${id}');`;
const MANY=`curPersona='owner';const o=OPPS.find(r=>r.id==='OPP-1004');const more=UNITS.filter(u=>u.status==='available'&&!o.units.includes(u.id)).slice(0,4).map(u=>u.id);o.units=[...o.units,...more];openOpp('OPP-1004');`;
module.exports={
  added:'20 Nov',
  id:'23', title:'Opportunity units: compact chips, +N, and remove a unit',
  source:'Sam, Team CRM access redesign chat (follow-up to update 12)', devItems:'—',
  changes:[
    'The **stage bar** under the timeline takes the full width again, as before update 12.',
    'Units in the timeline are small **chips** on one line (unit ref + short status: Shortlisted, Held · Fri, Hold requested, Held elsewhere, Gone, Reserved). Type, price and any offer show on hover. They never wrap onto two lines.',
    'Up to 3 chips show; the rest go behind a **+N** chip. Hovering or clicking +N lists the rest as the same chips, with the same actions.',
    'A **×** removes a unit from the opportunity in every place units show: timeline chips (including inside +N), the **Linked units** card, and unit refs on list rows and board cards (× on hover).',
    'What × does depends on the unit: shortlisted, or held/sold to another buyer → removed straight away and logged in Activity. **Hold requested** → asks first, because it also withdraws the hold request. **Held for this buyer** → asks to release the hold first (managers get Release hold). **Reserved** → no ×, because the deposit and deal depend on it.',
    'Chips have more breathing room: 32px tall, more padding, and a divider before the ×.',
  ],
  notes:['`oppUnitRemove(oppId, unit)` in `opp-strip.js` holds the rules for every entry point.'],
  tryIt:'Opportunities › Daniel Vella. Hover a unit chip, the +N chip, or a unit in Linked units.',
  before:[
    {label:'Timeline with several units', run:MANY, selector:'#oj-hero'},
    {label:'Linked units', run:MANY+"document.querySelector('.side-h')&&[...document.querySelectorAll('.side-h')].find(h=>h.textContent==='Linked units')?.scrollIntoView({block:'start'});"},
  ],
  after:[
    {label:'Timeline: chips on one line, +N, full-width stage bar', run:MANY, selector:'#oj-hero'},
    {label:'Linked units with × on each', run:MANY+"[...document.querySelectorAll('.side-h')].find(h=>h.textContent==='Linked units')?.scrollIntoView({block:'start'});"},
    {label:'+N opened: the rest of the units, same chips', run:MANY+"await new Promise(r=>setTimeout(r,100));ospUnitsMore('OPP-1004');", selector:'#oj-hero'},
    {label:'× on a held unit asks to release the hold first', run:O('OPP-1001')+"await new Promise(r=>setTimeout(r,100));oppUnitRemove('OPP-1001',OPPS.find(o=>o.id==='OPP-1001').units[0]);"},
  ],
};
