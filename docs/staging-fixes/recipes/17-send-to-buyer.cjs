// One "send to buyer" flow: the opportunity, the Proposal ready banner and Present checkout all open one drawer and send one Buyer proposal.
const wait=ms=>`await new Promise(r=>setTimeout(r,${ms}));`;
const MARIA="curPersona='owner';openOpp('OPP-1008');";
const PRESENT=`localStorage.removeItem('bricly.present.v3');prOpenDev('dolphin');${wait(900)}
PV3.toggleSel('#CM1207');PV3.toggleSel('#CM1203');PV3.S.sel.forEach(i=>i.cmp=true);PV3.S.sel[0].finish='riviera';
PV3.S.oppId='OPP-1008';PV3.go('checkout');${wait(700)}`;
const CARD=`${MARIA}document.getElementById('sw-card').scrollIntoView({block:'start'});`;
const PREVIEW=`${MARIA}otPackOpen();sbPick('#CM9703','fin','urban');sbPick('#CM9814','lay','open-kitchen');
let u;window.open=x=>{u=x;};sbPreview();setTimeout(()=>{location.href=u.replace('intro=1&','');},0);`;

module.exports={
  id:'17', title:'One way to send a proposal to the buyer',
  viewport:{width:1440,height:1000},
  source:'Sam, staging review notes', devItems:'—',
  changes:[
    'There is one output for the buyer: the **Buyer proposal**, the page built from Settings › Proposal page (template, brand, sections). The custom pack, the old Send proposal drawer and Present Mode’s selection link all made a version of the same thing. They now make this one.',
    'One drawer, **Send proposal to Maria**, opens from every entry point: the opportunity’s **Send follow-up pack** step, **Actions › Send proposal**, the **Proposal ready** banner’s **Review and send**, and **Send proposal** at the end of Present Mode.',
    'The drawer is filled in from where it was opened. From the opportunity: the shortlisted homes and any options already saved. From Present Mode: the homes, finishes and layouts picked in the session, and the comparison if it was used.',
    'Step 1 **Homes**: remove a home or add one from the same developments.',
    'Step 2 **Options**: the layouts and finishes each development offers for that home, with the price change. The step only shows when at least one home has a choice to make. Choices made in Present are marked **Picked in Present**.',
    'Step 3 **Message & send**: a drafted message (up to 80 words), what the buyer gets (the website, a **PDF copy**, the **comparison**), when the link expires, and how to send it: **WhatsApp**, **Email** or **Copy link**. Channels without a phone, an email or consent are greyed out with the reason. **Preview** opens the proposal page with this buyer’s name, homes, options and message.',
    'Every send has the same result: one link **bricly.mt/p/…**, one **Buyer proposal** card in Shared with client, and one Activity entry, for example **Proposal sent to Maria on WhatsApp · 2 homes**.',
    'Sending again publishes **v2** on the same link. The card shows the version, the channel, opens and time spent on each home. **⋯** has Copy link, Download PDF, Versions and activity, and Stop the link.',
    'Present checkout no longer creates its own selection link. **Send the proposal** shows what was sent and how often it was opened, and opens the same drawer on top of the presentation.',
    'Removed from the flow: the custom pack agent review drawer and the separate custom pack and microsite cards. **Create custom pack** is gone from Actions; Send proposal replaces it.',
  ],
  notes:[
    'Data model: one asset type, `proposal`, per opportunity. Fields: `units`, `cur` (message, per-home layout and finish with price, compare, pdf, expiry, template and standard version), `versions[]` (v, when, by, channel, from: opp | present | shortlist, change note), `attempts[]` (when, channel, version, status), `access` (state, expiry), engagement. Prototype: `send-buyer.js`.',
    'Link: `bricly.mt/p/<hash>`, one per opportunity, stable across versions. The page always shows the latest version. Stopping the link revokes it; sending again makes a new version.',
    'Versioning: each send publishes the next version (v1, v2…) as an immutable snapshot of homes, options and message. The change note is computed: added, removed, options changed, new message.',
    'Events: `proposal.sent` (or `proposal.link_copied`) writes one Activity entry and sets the follow-up step as done (`ppSent` and `packSent` both set for older readers). The buyer page posts `proposal.opened` and time per home (`proposal.home_viewed`, ms) back to the asset.',
    'Options come from the development’s published content: layouts (with their unit rules, e.g. 1+ bedrooms) and finishing packs with their price. The price shown is the unit price plus both deltas.',
    'Present hand-off passes the session’s selection (unit, layout id, finish id, compare flag). Units sold or reserved since are left out and named in the drawer.',
    'Channel rules: WhatsApp needs a phone and WhatsApp consent; Email needs an email and email consent; do not contact blocks both. Copy link is always available and is logged as copied, not sent.',
    'Prototype only: the proposal page builds homes it has no content for from a home in the same development, with the CRM facts, price, layout and finish on top.',
  ],
  tryIt:'v3: Opportunities › Maria Borg › Actions › Send proposal. Or Present › Dolphin Court › select two homes › Finish presentation › Screen turned away › link Maria › Send new version. In Shared with client, ⋯ (top right) › Open as Maria counts a visit.',
  before:[
    {label:'Opportunity: Send follow-up pack (custom pack agent review)', run:`${MARIA}otPackOpen();`, selector:'#qaDrawer'},
    {label:'Opportunity: Send proposal drawer', run:`${MARIA}paSend('OPP-1008');`, selector:'#qaDrawer'},
    {label:'Present checkout: share the selection', run:PRESENT},
    {label:'Shared with client: microsite and custom pack cards', run:CARD, selector:'#sw-card'},
  ],
  after:[
    {label:'Opportunity: Send follow-up pack opens Send proposal, step 1 Homes', run:`${MARIA}otPackOpen();`, selector:'#qaDrawer'},
    {label:'Send proposal, step 3 Message & send (same drawer from Actions and the banner)', run:`${MARIA}paSend('OPP-1008');sbStep('send');`, selector:'#qaDrawer'},
    {label:'Present checkout: Send proposal opens the same drawer, pre-filled from the session', run:`${PRESENT}PV3.actions.sendProposal();`},
    {label:'Shared with client: one Buyer proposal card with version, channel and opens', run:CARD, selector:'#sw-card'},
    {label:'New: step 2 Options from Present (finish picked in the session)', run:`${PRESENT}PV3.actions.sendProposal();sbStep('options');`, selector:'#qaDrawer'},
    {label:'New: Preview opens the proposal page with Maria’s homes and options', run:PREVIEW, wait:4500},
    {label:'New: the proposal page’s Your selection shows Maria’s homes', run:PREVIEW.replace("u.replace('intro=1&','')","u.replace('intro=1&','')+'#selection'"), wait:4500},
  ],
};
