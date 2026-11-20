// Unit status in every unit picker on the opportunity. Same steps on the old and new code.
const O=`curPersona='owner';openOpp('OPP-1008');`;
module.exports={
  id:'15', title:'Unit status when adding units',
  viewport:{width:1440,height:1100},
  source:'Opportunity Flow report · Q-01', devItems:'D-15',
  changes:[
    'Every unit picker on the opportunity shows each unit’s status: **Add unit** (Units editor and the Details and quick view pickers), **Find another unit** in Book POS signing, and **Other units** in the hold dialog.',
    '**Available** units are tagged Available.',
    'Units **on hold for another buyer** can be picked. The tag shows where this buyer would stand, for example “On hold · you’d be 3rd in line”, from the Approvals queue. Requesting a hold on one joins the line.',
    '**Reserved** and **Sold** units are shown with their status but can’t be picked.',
  ],
  notes:[
    'Place in line = the buyer holding the unit, plus every open hold request on it, plus one. If this buyer is already in the line, the tag says “you’re Nth”.',
    'Units already linked to the opportunity stay ticked and can be removed even if they were sold since.',
    'Settings › Lead allocation already defaults to **Round robin** for the workspace (Sam: “Yes, by default”). Developments without an override follow it. No change needed.',
  ],
  tryIt:'Opportunities › Maria Borg › Units › Add units, or Put unit on hold and search “onyx”, or Book POS signing › Find another unit.',
  before:[
    {label:'Add unit', run:`${O}oppQuickEditOpen('OPP-1008','units');`, selector:'#qaDrawer'},
    {label:'Hold dialog, other units', run:`${O}oppHoldRequest();uhSetQ('onyx');`, selector:'#uh-modal .uhx-box'},
    {label:'Book POS signing, find another unit', run:`${O}oppPosOpen();AB.uFind=true;AB.uq='onyx';abRender();document.getElementById('ab-sign').scrollIntoView();`, selector:'#ab-sign'},
  ],
  after:[
    {label:'Add unit: status tags, Reserved and Sold disabled', run:`${O}oppQuickEditOpen('OPP-1008','units');`, selector:'#qaDrawer'},
    {label:'Hold dialog: a held unit joins the line', run:`${O}oppHoldRequest();uhSetQ('onyx');`, selector:'#uh-modal .uhx-box'},
    {label:'Find another unit: same tags', run:`${O}oppPosOpen();AB.uFind=true;AB.uq='onyx';abRender();document.getElementById('ab-sign').scrollIntoView();`, selector:'#ab-sign'},
  ],
};
