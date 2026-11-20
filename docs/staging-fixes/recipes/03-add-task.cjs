// Add task box. The old and new dialogs share the title, record and due date fields, so the same steps add a task on both.
const O=`curPersona='owner';openOpp('OPP-1008');`;
const ADD=(t,extra='')=>`oppAddTask();document.getElementById('tqTitle').value=${JSON.stringify(t)};document.getElementById('tqTime').value='10:00';${extra}tqAddSave(null);`;
const NEW_EXTRA=`document.getElementById('tqDesc').value='Use the 10/20/70 plan and add the parking option.';document.getElementById('tqRemind').value='60';`;
const FEED=`${O}${ADD('Call Maria about the bank letter')}oppTaskToggle(TQ[0].id);`;
const SCROLL=`document.querySelector('#opp-root .opp-comp').scrollIntoView();`;

module.exports={
  id:'03', title:'One task dialog, tasks in Activity',
  viewport:{width:1440,height:1300},
  source:'Opportunity Flow report · S-05', devItems:'D-33',
  changes:[
    'One **Add task** dialog everywhere (opportunity Actions, Tasks tab, Activity, Tasks page): Title (required), Description (optional), Due date and time, Reminder, Assigned to (defaults to me).',
    'Reminder options: None, At due time, 15 min before, 1 hour before, 1 day before, Custom date and time (shows a date and time picker).',
    'Open tasks are pinned in an **Upcoming** strip at the top of Activity, with tick box, description, due time, reminder and who it’s assigned to, plus **+ Add task**.',
    'Ticking a task done adds **Task done: <title>** to the Activity feed.',
    'The opportunity Tasks tab opens the same dialog instead of the title-and-date row.',
  ],
  notes:[
    'Task fields: `desc`, `remindKey` (none, due, 15, 60, 1d, custom), `remindAt` for custom, `owner`. A relative reminder needs a due date; Custom needs a date and time.',
    'The Upcoming strip shows the first 3 open tasks, overdue first, and links to the Tasks tab when there are more.',
    'The quick add row in the pipeline quick view stays for fast capture.',
  ],
  tryIt:'Opportunities › Maria Borg › Actions › Add task, or + Add task in the Upcoming strip on Activity.',
  before:[
    {label:'Add task dialog', run:`${O}oppAddTask();`, selector:'#qaDrawer'},
    {label:'Activity after adding a task and ticking another done', run:`${FEED}${ADD('Send Maria the payment plan')}${SCROLL}`},
    {label:'Opportunity Tasks tab', run:`${O}oppSetTab('tasks');`, selector:'#opp-tasks-card'},
  ],
  after:[
    {label:'One dialog: description, reminder, assigned to', run:`${O}oppAddTask();document.getElementById('tqTitle').value='Send Maria the payment plan';${NEW_EXTRA}document.getElementById('tqRemind').value='custom';tqRemindPick('custom');document.getElementById('tqTitle').focus();`, selector:'#qaDrawer'},
    {label:'Upcoming strip on Activity, done task in the feed', run:`${FEED}${ADD('Send Maria the payment plan',NEW_EXTRA)}${SCROLL}`},
    {label:'Opportunity Tasks tab opens the same dialog', run:`${O}${ADD('Send Maria the payment plan',NEW_EXTRA)}oppSetTab('tasks');`, selector:'#opp-tasks-card'},
  ],
};
