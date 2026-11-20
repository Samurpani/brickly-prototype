// Fills the setup wizard with a finished "Vinci" setup and opens its last screen. Works on the old and new code.
const SETUP=`try{localStorage.removeItem('bricly.newdev.v2');localStorage.removeItem('bricly.devreview');}catch(e){}
ndS=null;ndStart();
Object.assign(ndS.files,{avail:'MR availability 30-Sep.xlsx',plans:'24 files',arch:'MR-arch-set-rev3.pdf',elev:'4 files',ext:'6 files · final',int:'8 files · 2 work in progress',spec:'MR-spec-v2.pdf'});
Object.assign(ndS.ans,{name:'Vinci',loc:'Triq il-Qammieħ, Mellieħa · pin confirmed',ptype:'Multi-block',blocks:'3 blocks · A, B and C',compl:'Q4 2027',launch:'Not launched yet',ldate:'18 Jan 2027',pricing:'Yes, prices are set',countries:['Malta','United Kingdom','Italy','Germany'],production:'Yes, Bricly produces everything'});
ndS.picks={primary:[ndD().SUG.primary.k],secondary:[ndD().SUG.secondary.k]};ndS.proc='done';ndS.rev.avail=true;
ndSteps().forEach(([k])=>ndS.done[k]=1);ndGoStep('imports');ndS.si='complete';ndRender(true);`;
const SUBMIT=`${SETUP}document.querySelector('#nd-root [data-nd="finish"]').click();`;
const CS_URL='/prototypes/admin/Bricly_Control_Station.html';

module.exports={
  id:'05', title:'Developers submit, Bricly reviews',
  viewport:{width:1440,height:1200},
  source:'Development Setup report · S-06', devItems:'D-19, D-21, D-22, D-25',
  changes:[
    'The last setup screen is now **Submit for review**. The developer submits and leaves. There is no Activate step at the end of setup.',
    'After submitting, the development opens on a clear landing: **Draft · Bricly is checking it**, a short message saying we will email when it is ready (usually within 2 working days), files still being read with progress (for example **Floor plans: 9 of 24 ready**), the number of units saved as drafts, and every answer from setup (D-21, D-22).',
    'While Bricly is checking, the developer has no Activate button and no Activation tab.',
    'Inventory on the development page lists the draft units, with **Add unit** to add one by hand and **Confirm imported units** to review the import (D-25).',
    'Setup import saves every unit as a draft. Nothing is published from setup (D-19).',
    'Control Station: new queue item type **New development review** in the Fulfilment queue (seeded: Vinci from Vella Developments).',
    'Review screen with the setup answers, a units table with flags (missing price, duplicate unit, no floor plan), the files (floor plans matched or not, renders tagged or not) and a checklist: Units checked, Prices checked, Floor plans matched, Renders tagged.',
    '**Mark ready and notify developer** only works once the checklist is done. It marks the item delivered and records the email to the developer. **Ask the developer a question** sends a message.',
    'When Bricly marks it ready, the developer sees **Ready** and gets the notification **Your development is ready**.',
  ],
  notes:[
    'Setup import must use its own path, not the live bulk upload: units are created as drafts with no publish or status side effects.',
    'Opening a draft development loads the saved setup answers and file states (D-21). File progress comes from the background import jobs.',
    'Mark ready should send the email and an in-app notification to the account owner, and log both on the account timeline.',
    'The two prototypes do not share a backend. In the v3 prototype, use **Demo: Bricly marks it ready** on the landing. If both prototypes are open on the same server, Mark ready in Control Station also flips the v3 draft to Ready (via localStorage).',
  ],
  tryIt:'v3: Developments › New development, go to the end of setup and press Submit for review. Control Station: Fulfilment queue › FQ-320 › Open review.',
  before:[
    {label:'End of setup', run:SETUP},
    {label:'Development page after setup', run:`${SETUP}document.querySelector('#nd-root [data-nd="finish"]').click();`},
    {label:'Inventory', run:`${SETUP}document.querySelector('#nd-root [data-nd="finish"]').click();ndS.rev.avail=false;ndAction('hubtab:inventory');`},
    {label:'Fulfilment queue', url:CS_URL+'#/queue'},
  ],
  after:[
    {label:'End of setup: Submit for review', run:SETUP},
    {label:'Draft landing: Bricly is checking it', run:SUBMIT},
    {label:'Inventory: add unit and confirm imported units', run:`${SUBMIT}ndS.rev.avail=false;ndAction('hubtab:inventory');`},
    {label:'Fulfilment queue with a development review', url:CS_URL+'#/queue'},
    {label:'Review screen (Control Station)', url:CS_URL+'#/queue/FQ-320'},
    {label:'Mark ready is on once the checklist is done', url:CS_URL+'#/queue/FQ-320',
      run:`['units','prices','plans','renders'].forEach(k=>CSUI.drCheck('FQ-320',k,true));CSUI.drPlans('FQ-320');CSUI.drTag('FQ-320');CSUI.drReady('FQ-320');document.querySelector('.toast')?.remove();`},
    {label:'Add unit', run:`${SUBMIT}ndAction('hubtab:inventory');ndAction('addunit');`},
    {label:'Developer sees Ready and the notification', run:`${SUBMIT}ndAction('demoready');bnToggle();`},
  ],
};
