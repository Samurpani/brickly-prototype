// Settings: grouped menu, and the Targets page layout fixed.
module.exports={
  added:'20 Nov',
  id:'22', title:'Settings menu in groups, Targets page spacing',
  source:'Sam, Team CRM access redesign chat', devItems:'—',
  changes:[
    'The long Account list in the Settings menu is grouped, using the existing header and item styles: **Organisation** (Company profile, Team, Notifications, Integrations), **Sales** (Sales setup, Targets, Approvals, Calls and meetings), **Buyers** (Proposal page, Buyer pack standards), **Billing** (Plan and billing, Credits and usage), **Security and data** (Security, Data and privacy). **Personal** is unchanged.',
    'Groups the person’s role can’t see are hidden. A new Settings page not yet in a group appears under Organisation.',
    '**Targets:** the page had a card inside a card with no padding, so text touched the borders. Now the four target groups are the only cards, each with inner padding, the Edit button on the title line, evenly spaced rows, and their own height.',
  ],
  notes:['Menu groups live in `ST_NAV_GROUPS` in `settings.js`; Targets styling is in `mgmt-vis.css`.'],
  tryIt:'Open Settings, then Settings › Targets.',
  before:[
    {label:'Settings menu', run:"go('settings');stGo('p:company');", selector:'#st-root .st-rail'},
    {label:'Settings › Targets', run:"go('settings');stGo('p:targets');", selector:'#st-root .st-main'},
  ],
  after:[
    {label:'Settings menu in groups', run:"go('settings');stGo('p:company');", selector:'#st-root .st-rail'},
    {label:'Settings › Targets with proper spacing', run:"go('settings');stGo('p:targets');", selector:'#st-root .st-main'},
  ],
};
