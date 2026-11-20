const open="openDeal('DEAL-2206'); document.getElementById('df-sec-activity').scrollIntoView();";
const blur="document.activeElement?.blur();";
// Staging shows bare "Opportunity updated" rows; the old snapshot has none, so add a few the way staging stores them.
const staging="const c=getExt(dealOpp(dealById('DEAL-2206'))).comms; c.splice(1,0,...['Today 11:42','Today 11:42','Today 11:41','Today 11:40'].map(t=>({ch:'sys',t,text:'Opportunity updated'}))); c.splice(7,0,{ch:'sys',t:'Yesterday 14:05',text:'Opportunity updated'});";
module.exports={
  id:'06', title:'Deal activity that says what changed',
  source:'Deal Page report · S-01', devItems:'—',
  changes:[
    'Activity rows are grouped by day: **Today**, **Yesterday**, then the date.',
    'Filters are now **All**, **Payments**, **Documents**, **Messages** and **Changes**, each with a count.',
    'Every change row says who changed which field, from what, to what. Example: “Matthew changed the price from €355,000 to €350,000”.',
    'Generic “Opportunity updated” events are no longer shown as is. They are expanded into one row per changed field.',
    '3 or more updates in a row by the same person collapse into one row, such as “4 updates by Sam”, with the fields listed. Click to expand.',
    'Each row has a type icon and its time. Payment rows link to the payment, document rows open the document.',
    'Edits made on the deal (price, target deed, owner, funding type) are logged with the field, the old value, the new value and the reason.',
  ],
  notes:[
    'The audit log must store field-level diffs: `{field, from, to, actor, at}` per changed field. An “updated” event without a diff can only render as “Sam updated the deal. No field details were recorded.”',
    'Collapse rule: consecutive change or system rows in the same day, same actor, run of 3 or more. Messages always break a run.',
    'Row type comes from the event type (payment, document, message, change, system). The prototype guesses it from text for old events; production should use the event type.',
    'Links: payment rows scroll to and highlight the payment row; document rows open the document viewer when a file exists.',
    'Demo history for DEAL-2206 and DEAL-2205 is seeded in `DF_ACT_SEED` (deal-flow.js) and shown on the deal only.',
  ],
  tryIt:'Open Deals › Luca Camilleri (DEAL-2206) › Activity. Expand “4 updates by Sam”, then try each filter.',
  viewport:{width:1440,height:2400},
  before:[
    {label:'Activity, all (with the updates staging shows)', run:staging+open, selector:'#df-sec-activity'},
    {label:'Activity, System filter', run:staging+open+"dfFeed('sys');"+blur, selector:'#df-sec-activity'},
  ],
  after:[
    {label:'Activity, all, grouped by day', run:open, selector:'#df-sec-activity'},
    {label:'Changes filter', run:open+"dfFeed('change');"+blur, selector:'#df-sec-activity'},
    {label:'Payments filter, rows link to the payment', run:open+"dfFeed('pay');"+blur, selector:'#df-sec-activity'},
    {label:'Documents filter, rows open the document', run:open+"dfFeed('doc');"+blur, selector:'#df-sec-activity'},
    {label:'“4 updates by Sam” expanded', run:open+"document.querySelector('#df-sec-activity .df-ar-sum').click();", selector:'#df-sec-activity'},
  ],
};
