// Team member drawer: CRM access as switches, approvals inside the same panel, clearer Quick set.
const karl="BST.team.MEMBERS.find(m=>m.first==='Karl').id";
const OPEN=`go('settings');stGo('p:team');stMemberOpen(${karl});`;
const to=sel=>`await new Promise(r=>setTimeout(r,80));{const b=document.getElementById('qaDrawerBody'),el=b.querySelector(${JSON.stringify(sel)});if(el)b.scrollTop+=el.getBoundingClientRect().top-b.getBoundingClientRect().top-24;}`;
module.exports={
  added:'20 Nov',
  id:'20', title:'Team member: CRM access switches, approvals in the same panel',
  source:'Sam, Team CRM access redesign chat (follow-up to update 08)', devItems:'D-01 (Account Settings)',
  changes:[
    '**CRM access** uses the same layout as **Permissions**: one row per area with a **No access / Access** switch, instead of a dropdown.',
    'The note above the rows matches Permissions: “All from the Sales Rep role. Change one to set it for this person only.” A row that differs from the role shows **Changed** with the role default under it, and **Reset to role** appears once anything is changed.',
    '**Approvals › Edit ›** opens the person’s approval rules **in the same side panel**. The Team page stays where it is; before, it jumped to Settings › Approvals and left the flow.',
    '**‹ Back to Karl Zammit** at the top of the panel returns to the edit screen with unsaved changes kept. **Cancel** and **Save rules** also go back, and the Approvals summary updates.',
    '**Quick set** buttons look clickable: outlined, with a hover state. The preset that matches the rules below is selected (green with ✓), and it follows as rules change.',
  ],
  notes:[
    'CRM access overrides are stored per member like permission overrides: role default plus a list of areas switched on or off for this person.',
    'Opening a person’s approvals from Settings › Approvals itself works as before (page, not panel).',
  ],
  tryIt:'Settings › Team › click Karl Zammit. Scroll to CRM access, then Approvals › Edit ›.',
  before:[
    {label:'Member drawer › CRM access', run:OPEN+to('#au-areas-l'), selector:'#qaDrawer'},
    {label:'Approvals › Edit › leaves Team for the Approvals page', run:OPEN+"document.querySelector('#qaDrawer .au-apsum .au-link').click();"},
    {label:'Quick set on Karl’s approval rules', run:"go('settings');stGo('p:approvals');stApRepOpen("+karl+");", selector:'#qaDrawer'},
  ],
  after:[
    {label:'Member drawer › CRM access as switches, one changed', run:OPEN+"stAuArea('reports',true);"+to('#au-areas-l'), selector:'#qaDrawer'},
    {label:'Approvals › Edit › opens in the same panel, Team stays behind', run:OPEN+"stAuApprovals();"},
    {label:'Quick set: clickable buttons, matching preset selected', run:OPEN+"stAuApprovals();", selector:'#qaDrawer'},
  ],
};
