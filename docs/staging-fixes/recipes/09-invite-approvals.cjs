const open="go('settings');stGo('p:team');stAddUserOpen();stAuChoose('role','Sales Rep');await new Promise(r=>setTimeout(r,60));";
module.exports={
  id:'09', title:'Approvals in the invite',
  source:'Account Settings report · S-01', devItems:'—',
  changes:[
    'The approval tags in Add user are replaced by three radio rows, each with one line saying what it means: **New rep**, **Trusted rep** and **Team default**.',
    'Team default is selected to start with.',
    'A note under them says custom rules can be set in Approvals after the invite.',
  ],
  notes:[
    'Values sent are unchanged: the preset names `New rep · everything needs approval`, `Trusted rep · holds and reservations go straight through` and `Team default`.',
    '“Custom · set in Approvals” is no longer offered at invite. Custom rules are created in Settings › Approvals once the person exists.',
  ],
  tryIt:'Open Settings › Team › Add users and choose the Sales Rep role.',
  before:[
    {label:'Add user › approval rules', run:open+"const d=document.getElementById('au-approvals');d.open=true;d.scrollIntoView({block:'start'});", selector:'#qaDrawer'},
  ],
  after:[
    {label:'Add user › approvals', run:open+"document.getElementById('au-approvals').scrollIntoView({block:'center'});", selector:'#qaDrawer'},
    {label:'Trusted rep chosen', run:open+"document.querySelectorAll('#au-approvals input')[1].click();await new Promise(r=>setTimeout(r,60));document.getElementById('au-approvals').scrollIntoView({block:'center'});", selector:'#qaDrawer'},
  ],
};
