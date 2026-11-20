// Interior render tags in setup and in the development editor, plus who gets the floor plan email.
const RENDERS=`try{localStorage.removeItem('bricly.newdev.v2');}catch(e){}
ndS=null;ndStart();Object.assign(ndS.ans,{name:'Vinci',renders:'Yes'});ndGoStep('collateral');ndS.si='rendUp';ndRender(true);
ndAction('up:ext');ndAction('up:int');`;
const LANDING=`try{localStorage.removeItem('bricly.newdev.v2');localStorage.removeItem('bricly.devreview');}catch(e){}
ndS=null;ndStart();
Object.assign(ndS.files,{avail:'MR availability 30-Sep.xlsx',plans:'24 files',arch:'MR-arch-set-rev3.pdf',spec:'MR-spec-v2.pdf'});
Object.assign(ndS.ans,{name:'Vinci',loc:'Triq il-Qammieħ, Mellieħa · pin confirmed'});
ndS.proc='done';ndS.rev.avail=true;ndSteps().forEach(([k])=>ndS.done[k]=1);ndGoStep('imports');ndS.si='complete';ndRender(true);
document.querySelector('#nd-root [data-nd="finish"]').click();`;
const UNIT_UPLOAD=`deOpen('lalex','media');const u=deUnits(deDev()).find(x=>x.beds===2)||deUnits(deDev())[0];
DE.drawer={k:'unit',id:u.id,tab:'renders'};deRender();
const b1=await (await fetch(awAsset('interior.jpg'))).blob(),b2=await (await fetch(awAsset('render-oak.jpg'))).blob();
deTagStart({files:[new File([b1],'kitchen_2bed.jpg',{type:'image/jpeg'}),new File([b2],'IMG_2041.jpg',{type:'image/jpeg'})]},'Render','');`;
const ASSET=`deOpen('lalex','media');const a=deDraft().assets.find(x=>x.cat==='Render'&&!x.room);DE.drawer={k:'asset',id:a.id};deRender();`;

module.exports={
  id:'14', title:'Interior render tags and floor plan email',
  viewport:{width:1440,height:1100},
  source:'Development Setup report · Q-02, Q-03', devItems:'D-05, D-23',
  changes:[
    'Interior renders need a **room**. A render can’t be saved without one, in setup and in the development editor.',
    'The **unit type** is the default scope and is preselected. **Specific unit (optional)** narrows it to one unit.',
    'Setup Step 4 takes several interior render files and lists each with Room, Unit type and Specific unit. Continue stays off until every file has a room (D-05).',
    'Edit unit › Renders upload: the Applies to radio buttons are replaced by Unit type (preselected) and Specific unit (optional).',
    'Development media: a render is marked Interior or Exterior. Interior needs a room before Done and before publishing. Switching to Interior preselects the most common unit type.',
    'Draft landing (update 05): while floor plans process it says **Floor plans are uploading. We’ll tell you when they’re ready.** and names who gets the email, for example Joseph Vella (account owner) and Karl Zammit (manages Vinci). The person managing the development can be changed there (D-23).',
    'When floor plans finish, the people named get an in-app notification and an email, and the email is logged in Activity.',
  ],
  notes:[
    'Floor plan email recipients: the account owner and the user managing the development. If they are the same person, send one email.',
    'Interior render tag model: room (required), unit type (default scope), unit (optional). Exterior and development-wide renders have no room.',
    'Publishing is blocked while an interior render has no room (listed with the other must-fix items).',
    'Prototype: **Demo: finish floor plans** on the draft landing completes processing straight away.',
  ],
  tryIt:'v3: New development › Marketing collateral › Renders › Yes › upload Interior renders. Submit setup to see the floor plan email note. Developments › La Lex › Edit › Units › a unit › Renders › Upload renders.',
  before:[
    {label:'Setup: upload renders', run:RENDERS},
    {label:'Draft landing: files', run:`${LANDING}`},
    {label:'Edit unit: tag uploaded renders', run:UNIT_UPLOAD},
    {label:'Development media: render tags', run:ASSET},
  ],
  after:[
    {label:'Setup: tag each interior render (room required)', run:RENDERS},
    {label:'Draft landing: who gets the floor plan email', run:LANDING},
    {label:'Edit unit: unit type preselected, specific unit optional', run:UNIT_UPLOAD},
    {label:'Development media: interior render needs a room', run:`${ASSET}deAssetKind(deDraft().assets.indexOf(deDraft().assets.find(x=>x.id===DE.drawer.id)),true);`},
    {label:'Floor plans ready: notification and email logged', run:`${LANDING}ndAction('demoplans');ndAction('hubtab:activity');bnToggle();`},
  ],
};
