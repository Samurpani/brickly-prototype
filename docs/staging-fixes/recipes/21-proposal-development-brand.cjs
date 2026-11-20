// Proposal page: one-development proposals can use the development's own brand.
const SET="localStorage.removeItem('bricly.proposal.std');paOpenSettings();";
module.exports={
  added:'20 Nov',
  id:'21', title:'Proposal: development brand for one-development proposals',
  source:'Sam, Team CRM access redesign chat', devItems:'—',
  changes:[
    'Settings › Proposal page › Brand has a new choice: **When a proposal has one development** › **Company brand** (default, same as today) or **Development brand**.',
    '**Development brand:** if every home in a proposal is in the same development, the whole proposal uses that development’s logo, colours and fonts: cover, top bar, intro, footer and the browser tab title. The developer’s logo and name don’t show, and **Built on trust** is hidden.',
    'If the development has no brand of its own, it uses the company colours with the development’s name as the logo. Proposals with homes in more than one development always keep the company brand.',
    'The choice follows draft and publish like the other proposal settings, and shows in the publish summary. **Preview with one development** opens a Dolphin Court–only proposal.',
  ],
  notes:['Stored as `singleDev: "company" | "development"` on the proposal standard (`proposal-std.js`); the buyer page checks it when `developments.length === 1` (`proposal/proposal.js`).'],
  tryIt:'Settings › Proposal page › Brand › When a proposal has one development.',
  before:[
    {label:'Proposal page › Brand', run:SET, selector:"#st-root .st-card:has(h3:text-is('Brand'))"},
  ],
  after:[
    {label:'Proposal page › Brand with the one-development choice', run:SET+"paSet('singleDev','development');document.getElementById('pa-single').scrollIntoView({block:'center'});", selector:"#st-root .st-card:has(h3:text-is('Brand'))"},
    {label:'Buyer page: a Dolphin Court–only proposal in the development brand', run:SET+"paSet('singleDev','development');await new Promise(r=>setTimeout(r,80));setTimeout(()=>{location.href='proposal/index.html?std=draft&dev=dolphin';});", wait:3000},
  ],
};
