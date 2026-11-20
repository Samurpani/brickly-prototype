const open="localStorage.removeItem('bricly.proposal.std');paOpenSettings();await new Promise(r=>setTimeout(r,80));";
const card="#st-root .st-card:has(h3:text-is('Brand'))";
module.exports={
  viewport:{width:1440,height:1800},
  id:'10', title:'Developments list on the Proposal page',
  source:'Account Settings report · S-03', devItems:'—',
  changes:[
    'Developments in the Proposal page Brand section are now a list with three columns: Development, Brand (Own or Company) and Last edited.',
    'It shows the first 5. **Show all (N)** shows the rest, and a search field appears once there are more than 5.',
    'Clicking a development opens its brand below the list, as before. **Close** hides it.',
    'The prototype now has 14 developments so the list shows the problem it solves.',
  ],
  notes:[
    'Last edited comes from the development brand’s last change (date of the latest logo, colour, font or source change).',
    'Search matches the development name. While searching, all matches show, not only the first 5.',
    'The 9 extra developments are prototype seed data in proposal-admin.js (SEED_DEVS).',
  ],
  tryIt:'Open Settings › Proposal page and scroll to Brand. Type “bay” in the search, or click Show all.',
  before:[
    {label:'Proposal page › Brand', run:open, selector:card},
  ],
  after:[
    {label:'Proposal page › Brand, first 5 developments', run:open, selector:card},
    {label:'Show all (14)', run:open+"paDevAll();", selector:'.pa-devs'},
    {label:'Search “bay”', run:open+"const s=document.querySelector('.pa-dsearch');s.value='bay';paDevSearch('bay');", selector:'.pa-devs'},
    {label:'A development opened', run:open+"paBrandSel('dolphin');await new Promise(r=>setTimeout(r,80));", selector:card},
  ],
};
