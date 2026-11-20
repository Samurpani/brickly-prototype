const create="curPersona='manager'; dcOpen('OPP-1001','actions'); DCV.step=3; const d=dcCreate(); openDeal(d.id);";
module.exports={
  id:'13', title:'Tasks done before the deal show as done',
  source:'Deal Page report · Q-02', devItems:'D-02',
  changes:[
    'When a deal is created, what was already settled carries over. Funding type and deposit set in the Create deal wizard, and the payment plan from the accepted offer, mark their step 1 tasks as done.',
    'These tasks sit in one collapsed group at the end of the task list: “4 done before the deal ▸”. Click to see each one and where it was done.',
    'The opportunity’s done list (for example “Unit taken off market”) is kept and shown in the same group, instead of being cleared.',
    'Step 1 tasks that weren’t answered in the wizard, such as “Book notary for searches”, now start open instead of ticked.',
    '“Confirm funding type” links to the funding setting and “Confirm payment plan” links to the payment schedule.',
  ],
  notes:[
    'Store carried-over items on the deal as `{task_key, done_via, done_at}` so the group can say where each was done. Ticking or unticking one still works and wins over the carried-over value.',
    'Mapping used: funding type → “Confirm funding type”, payment plan on the accepted offer → “Confirm payment plan”, deposit recorded → “Share deposit terms with buyer”.',
    'Previously `dcCreate` set the opportunity’s done list to empty. It now keeps it.',
  ],
  tryIt:'Open Mike Gatt’s opportunity (OPP-1001) › Actions › Create deal › Create. On the deal, open “4 done before the deal”.',
  before:[
    {label:'Step 1 tasks on a new deal', run:create, selector:'#df-next'},
  ],
  after:[
    {label:'Step 1 tasks, done items collapsed', run:create, selector:'#df-next'},
    {label:'“4 done before the deal” expanded', run:create+"document.querySelector('#df-next .df-pre').open=true;", selector:'#df-next'},
  ],
};
