const karl="BST.team.MEMBERS.find(m=>m.first==='Karl').id";
const sam="BST.team.MEMBERS.find(m=>m.first==='Sam').id";
// Scrolls the drawer body so the element sits at the top.
const to=sel=>`await new Promise(r=>setTimeout(r,60));{const b=document.getElementById('qaDrawerBody'),el=b.querySelector(${JSON.stringify(sel)});b.scrollTop+=el.getBoundingClientRect().top-b.getBoundingClientRect().top-48;}`;
module.exports={
  viewport:{width:1440,height:1700},
  id:'08', title:'Approvals page and its link to Team',
  source:'Account Settings report · S-02', devItems:'D-01',
  changes:[
    'Settings › Approvals is now one table. A row per request: Hold, Reservation, Offer below asking price, Returning lead, Lead takeover. Columns: Who needs approval, Who approves, Limit.',
    '**Edit** on a row opens a drawer with that request for every team, including the limit for offers below asking price.',
    'Below the table, **Exceptions for specific people** lists only the people whose rules differ from their team, with what differs. **Add exception** starts a new one.',
    'A **Teams** table keeps who approves, the backup and escalation for each team.',
    'The rule key `price` is now labelled **Offer below asking price** everywhere in Settings.',
    'Settings › Team: clicking a person opens their drawer with Role (sets the defaults), Permissions (role defaults, with anything set for this person marked **Changed**) and an Approvals summary with **Edit ›**.',
    '**Edit ›** opens Settings › Approvals filtered to that person. If they have no exception yet, their exception drawer opens so one can be created.',
  ],
  notes:[
    'Approval rules are still stored per team with per-person overrides (`ap:team:<team>:<type>` and `ap:rep:<id>:<type>`). The table summarises them; nothing about the model changed.',
    'The rule key stays `price`. The opportunity flow now raises below-asking offers as approval type `offer`; map `offer` requests to the `price` rule.',
    'Per-person permission overrides are saved on the member as `perms` ({capability: level}). Only differences from the role are stored. Changing role clears them.',
    'The member drawer no longer edits approval presets directly; that lives in Approvals. The invite keeps the three presets (see update 09).',
    'Rows in the Rules table are whatever request types exist. Unit status change and Commission split rows appear once those rules exist.',
  ],
  tryIt:'Open Settings › Team, click Karl Zammit, then Approvals › Edit ›. Try Sam too, who has no exception yet.',
  before:[
    {label:'Settings › Approvals', run:"go('settings');stGo('p:approvals');", selector:'#st-root .st-main'},
    {label:'Team › member drawer', run:`go('settings');stGo('p:team');stMemberOpen(${karl});`, selector:'#qaDrawer'},
  ],
  after:[
    {label:'Settings › Approvals', run:"go('settings');stGo('p:approvals');", selector:'#st-root .st-main'},
    {label:'Team › member drawer: Role, then Permissions', run:`go('settings');stGo('p:team');stMemberOpen(${karl});`+to('#au-role-l'), selector:'#qaDrawer'},
    {label:'Member drawer › a permission changed for this person', run:`go('settings');stGo('p:team');stMemberOpen(${karl});stAuPerm('export','scope');`+to('.au-perm[data-cap="approve"]'), selector:'#qaDrawer'},
    {label:'Member drawer › Approvals summary', run:`go('settings');stGo('p:team');stMemberOpen(${karl});`+to('.au-apsum'), selector:'#qaDrawer'},
    {label:'Edit › lands on Karl’s exception', run:`go('settings');stGo('p:team');stMemberOpen(${karl});document.querySelector('#qaDrawer .au-apsum .au-link').click();`, selector:'#st-root .st-main'},
    {label:'Edit › for Sam, who has no exception yet', run:`go('settings');stGo('p:team');stMemberOpen(${sam});document.querySelector('#qaDrawer .au-apsum .au-link').click();`},
    {label:'Edit a request › Offer below asking price', run:"go('settings');stGo('p:approvals');stApRuleOpen('price');stApRuleSet('Rachel Mifsud','over');", selector:'#qaDrawer'},
  ],
};
