// POS checklist setting, Location and the confirmation email in Book POS signing.
const O=`curPersona='owner';openOpp('OPP-1008');`;
const SETTINGS=`${O}go('settings');stGo('p:sales/docs');await new Promise(r=>setTimeout(r,200));const s=document.querySelector('#st-root .st-card:last-of-type')||[...document.querySelectorAll('#st-root .st-card')].pop();s?.scrollIntoView({block:'end'});`;
const POS=`${O}oppPosOpen();`;
const CHECK=`abSet('signUnit','#CM9703');document.getElementById('ab-sign').scrollIntoView();`;
const MAIL=`abSet('signUnit','#CM9703');document.querySelector('#qaDrawerBody label[for="ab-place"]')?.scrollIntoView();`;

module.exports={
  id:'04', title:'POS checklist setting, Location and confirmation email',
  viewport:{width:1440,height:1400},
  source:'Opportunity Flow report · S-06', devItems:'D-34',
  changes:[
    'New **POS checklist** in Settings › Sales setup › Documents: a switch to show or hide it, and a list you can rename, reorder (↑ ↓), delete and add to.',
    'The items keep today’s wording as the starting list.',
    'Book POS signing reads the checklist from the setting and hides it when the switch is off.',
    '**Place** is now **Location** in the POS signing dialog (D-34).',
    'A preview of the **confirmation email** shows who it goes to, date, time, location, unit and offer price. It updates as you change them and is logged in Activity when you book.',
  ],
  notes:[
    'The checklist never blocks a booking. Ticks are saved on the booking.',
    'The setting is account-wide. The prototype saves it in the browser (localStorage key `bricly.posChecklist`).',
    'Email goes to the buyer’s email on the contact. Invited guests are copied in. When the offer is waiting for approval the email goes once the signing is booked.',
  ],
  tryIt:'Settings › Sales setup › Documents › POS checklist. Then Opportunities › Maria Borg › Actions › Book POS signing.',
  before:[
    {label:'Settings › Sales setup › Documents', run:SETTINGS},
    {label:'Book POS signing: checklist', run:`${POS}${CHECK}`, selector:'#qaDrawer'},
    {label:'Book POS signing: place and booking', run:`${POS}${MAIL}`, selector:'#qaDrawer'},
  ],
  after:[
    {label:'POS checklist setting', run:SETTINGS},
    {label:'Checklist switched off in Settings: hidden in the dialog', run:`llPosSet(false);${POS}${CHECK}`, selector:'#qaDrawer'},
    {label:'Location and the confirmation email preview', run:`${POS}abSet('signUnit','#CM9703');const i=document.getElementById('of-pos-amt');i.value='350,000';ofPosPrice('350000');document.querySelector('#qaDrawerBody label[for="ab-place"]').scrollIntoView();`, selector:'#qaDrawer'},
  ],
};
