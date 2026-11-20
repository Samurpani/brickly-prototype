// Control Station seed data: Bricly staff, customer accounts and platform state.
// Every account carries deliberate problems so each console module has something real to find.
// Times are relative: `days`/`h` = ago; `dueDays`/`dueH` negative = overdue.
(function(){
const STAFF=[
  {id:'sam',name:'Sam Urpani',role:'founder'},
  {id:'anna',name:'Anna Borg',role:'cs'},
  {id:'luke',name:'Luke Farrugia',role:'eng'},
  {id:'mira',name:'Mira Camilleri',role:'contractor',skill:'Renders'},
  {id:'theo',name:'Theo Grech',role:'contractor',skill:'Brand & brochure'},
  {id:'paul',name:'Paul Vella',role:'finance'},
];

const seat=(id,name,role,login,acts,prev,wa,extra={})=>({id,name,role,lastLogin:login,acts7:acts,actsPrev:prev,wa7:wa,active:true,calendarOk:true,waLinked:true,...extra});

const ACCOUNTS=[
{
  id:'vella',name:'Vella Developments',lifecycle:'live',owner:'sam',renewalDays:210,arr:55000,since:'Mar 2026',
  contract:{activation:'Load + personalisation',onboarding:'Waived (founding member)',retainer:'Performance · €3,000/mo'},
  invoices:[{id:'INV-2041',label:'Q4 recurring',amt:13750,dueDays:-20,status:'open'},{id:'INV-1980',label:'Q3 recurring',amt:13750,dueDays:-110,status:'paid'}],
  credits:{allowance:42000,used:30100,forecast:46800},
  seats:[seat('u1','Joseph Vella','owner',1,22,25,0),seat('u2','Maria Spiteri','manager',0,61,58,14),seat('u3','Sam Azzopardi','rep',0,84,80,31),seat('u4','Karl Zammit','rep',0,52,57,12),seat('u5','Nina Caruana','rep',2,18,44,3),seat('u6','Ryan Debono','rep',36,0,0,0,{active:false,waLinked:false})],
  devs:[
    {id:'dolphin',name:'Dolphin Court',state:'active',band:'51–150',allowance:120,clearance:'paid',ref:'INV-1702',revisions:1,revisionDays:2,ready:{units:true,prices:true,media:true,plans:true}},
    {id:'verdala',name:'Verdala',state:'active',band:'Up to 50',allowance:40,clearance:'covered',ref:'Contract §4.2 founding terms',revisions:0,ready:{units:true,prices:true,media:false,plans:true}},
    {id:'tarxien',name:'Tarxien Gardens',state:'draft',band:'Up to 50',allowance:0,clearance:'outstanding',ref:'',revisions:0,readyDays:6,ready:{units:true,prices:true,media:true,plans:false}},
    {id:'vinci',name:'Vinci',state:'draft',band:'Up to 50',allowance:0,clearance:'outstanding',ref:'',revisions:0,ready:{units:false,prices:false,media:false,plans:false}},
  ],
  units:[
    {id:'#CM9802',dev:'dolphin',status:'sold',price:485000},
    {id:'#CM1104',dev:'dolphin',status:'sold',price:612000},
    {id:'#CM1201',dev:'dolphin',status:'reserved',price:398000},
    {id:'#CM1302',dev:'dolphin',status:'hold',price:410000,holdDays:-3,approval:true},
    {id:'#CM1405',dev:'dolphin',status:'hold',price:455000,holdDays:4,approval:true},
    {id:'#CM1501',dev:'dolphin',status:'available',price:520000},
    {id:'#CM1502',dev:'dolphin',status:'available',price:0},
    {id:'#VD0101',dev:'verdala',status:'available',price:690000},
    {id:'#VD0204',dev:'verdala',status:'reserved',price:742000},
    {id:'#VD0301',dev:'verdala',status:'available',price:810000},
  ],
  extraActiveUnits:142,
  opps:[
    {id:'OPP-1001',stage:'closed_won',units:['#CM9802'],rep:'u3',lastAct:1,next:true,since:'12 Oct'},
    {id:'OPP-1014',stage:'reservation',units:['#CM9802'],rep:'u4',lastAct:2,next:true,since:'09 Nov'},
    {id:'OPP-1007',stage:'negotiating',units:['#CM1104','#CM1501'],rep:'u3',lastAct:3,next:true},
    {id:'OPP-1009',stage:'reservation',units:['#CM1201'],rep:'u4',lastAct:1,next:true},
    {id:'OPP-1011',stage:'viewing_booked',units:['#CM1302'],rep:'u5',lastAct:16,next:false},
    {id:'OPP-1016',stage:'qualified',units:['#CM1405'],rep:'u6',lastAct:22,next:false},
    {id:'OPP-1018',stage:'qualified',units:['#VD0101'],rep:'u6',lastAct:19,next:false},
    {id:'OPP-1020',stage:'negotiating',units:['#VD0204'],rep:'u3',lastAct:2,next:true},
  ],
  integrations:{
    wa:{status:'connected',quality:'high',tier:'10K',webhookFail:0.4,parseRate:93,templatesRejected:0},
    email:{auth:'ok',bounce:1.2,complaint:0.01},
    forms:[{id:'f1',name:'Dolphin Court · hosted form',subs7:34,baseline:30,lastDays:0},{id:'f2',name:'Verdala · hosted form',subs7:11,baseline:9,lastDays:0}],
  },
  leadsUnassigned:[],approvalsPending:[{id:'AP-301',what:'Hold · #CM1405',ageDays:1}],
  dupContacts:3,optOutSends:[],drift:[],
  imports:[
    {id:'IMP-1049',type:'units',status:'applied',rows:62,created:4,matched:58,failed:0,days:12,by:'Joseph Vella'},
    {id:'IMP-1052',type:'contacts',status:'applied',rows:412,created:372,matched:40,failed:0,days:9,by:'Maria Spiteri',problem:'40 rows matched on phone numbers without a country code, so the wrong contacts were updated.'},
  ],
  jobs:[{id:'JOB-88213',kind:'Unit propagation',target:'#CM9802',state:'dead',tries:5,error:'Lock timeout on opportunity OPP-1014',days:9}],
  onboarding:null,
  notes:[{by:'anna',days:6,text:'Joseph wants Tarxien Gardens live before the January launch event. Activation fee is still with finance.'}],
},
{
  id:'mercury',name:'Mercury Holdings',lifecycle:'live',owner:'anna',renewalDays:320,arr:60000,since:'May 2026',
  contract:{activation:'Launch',onboarding:'€5,000',retainer:'—'},
  invoices:[{id:'INV-2050',label:'Annual recurring',amt:60000,dueDays:-2,status:'paid'}],
  credits:{allowance:48000,used:21000,forecast:44000},
  seats:[seat('m1','Paul Camilleri','owner',3,9,11,0),seat('m2','Elena Mifsud','marketing',1,30,28,0),seat('m3','Chris Galea','manager',0,40,42,9),seat('m4','Luca Bonnici','rep',0,71,73,26,{calendarOk:false}),seat('m5','Daniel Fenech','rep',0,66,69,24),seat('m6','Sara Attard','rep',1,49,51,19)],
  devs:[{id:'mercury',name:'Mercury Tower',state:'active',band:'151–300',allowance:180,clearance:'paid',ref:'INV-1811',revisions:0,ready:{units:true,prices:true,media:true,plans:true}}],
  units:[
    {id:'#MT2201',dev:'mercury',status:'sold',price:1250000},
    {id:'#MT2303',dev:'mercury',status:'available',price:980000},
    {id:'#MT2404',dev:'mercury',status:'available',price:1010000},
  ],
  extraActiveUnits:131,
  opps:[
    {id:'OPP-2003',stage:'closed_won',units:['#MT2201'],rep:'m4',lastAct:4,next:true},
    {id:'OPP-2006',stage:'viewing_held',units:['#MT2201','#MT2303'],rep:'m5',lastAct:1,next:true},
    {id:'OPP-2008',stage:'reservation',units:['#MT2404'],rep:'m6',lastAct:2,next:true},
  ],
  integrations:{
    wa:{status:'flagged',quality:'low',tier:'1K',webhookFail:7.8,parseRate:88,templatesRejected:1},
    email:{auth:'ok',bounce:2.1,complaint:0.02},
    forms:[{id:'f3',name:'Mercury Tower · hosted form',subs7:48,baseline:45,lastDays:0}],
  },
  leadsUnassigned:[{id:'LD-7781',ageH:5},{id:'LD-7783',ageH:3}],approvalsPending:[],
  dupContacts:0,optOutSends:[{id:'MSG-55120',contact:'CT-4410',sender:'m5',channel:'WhatsApp',h:5,automation:'Price-drop announcement'}],
  drift:[],
  imports:[{id:'IMP-1050',type:'opportunities',status:'applied',rows:88,created:80,matched:8,failed:0,days:20,by:'Chris Galea'}],
  jobs:[],onboarding:null,
  notes:[{by:'anna',days:2,text:'Elena asked about Meta lead ads timing. Told her v1.2.'}],
},
{
  id:'sliema',name:'Sliema Shores Ltd',lifecycle:'renewal',owner:'sam',renewalDays:64,arr:35000,since:'Jan 2026',
  contract:{activation:'Load, CRM-only',onboarding:'€5,000',retainer:'—'},
  invoices:[{id:'INV-2033',label:'H2 recurring',amt:17500,dueDays:31,status:'open'}],
  credits:{allowance:18000,used:6200,forecast:9000},
  seats:[seat('s1','Mark Borg','owner',24,0,3,0),seat('s2','Claire Pace','manager',5,8,26,1),seat('s3','Jake Sammut','rep',1,21,39,6),seat('s4','Ivy Agius','rep',9,2,30,0,{waLinked:false}),seat('s5','Tom Xuereb','rep',0,33,35,11)],
  devs:[{id:'lalex',name:'La Lex',state:'active',band:'51–150',allowance:110,clearance:'paid',ref:'INV-1420',revisions:0,ready:{units:true,prices:true,media:true,plans:true}}],
  units:[
    {id:'#LL0102',dev:'lalex',status:'available',price:355000},
    {id:'#LL0205',dev:'lalex',status:'reserved',price:372000},
    {id:'#LL0307',dev:'lalex',status:'hold',price:390000,holdDays:2,approval:false},
  ],
  extraActiveUnits:41,
  opps:[
    {id:'OPP-3002',stage:'reservation',units:['#LL0205'],rep:'s3',lastAct:6,next:true},
    {id:'OPP-3004',stage:'negotiating',units:['#LL0307'],rep:'s4',lastAct:18,next:false},
    {id:'OPP-3005',stage:'qualified',units:['#LL0102'],rep:'s4',lastAct:25,next:false},
    {id:'OPP-3006',stage:'viewing_booked',units:['#LL0102'],rep:'s5',lastAct:15,next:false},
    {id:'OPP-3008',stage:'lead',units:[],rep:'s3',lastAct:17,next:false},
  ],
  integrations:{
    wa:{status:'connected',quality:'medium',tier:'1K',webhookFail:0.9,parseRate:79,templatesRejected:0},
    email:{auth:'dkim_broken',bounce:6.3,complaint:0.05},
    forms:[{id:'f4',name:'La Lex · hosted form',subs7:0,baseline:14,lastDays:5,adsRunning:true}],
  },
  leadsUnassigned:[],approvalsPending:[{id:'AP-410',what:'Reservation · #LL0205',ageDays:5},{id:'AP-411',what:'Price exception · OPP-3004',ageDays:4}],
  dupContacts:7,optOutSends:[],
  drift:[{what:'Pipeline stage "Contacted"',settings:'exists in Settings',crm:'no opportunity uses it'},{what:'Lead source "Agency portal"',settings:'is missing from Settings',crm:'12 contacts use it'}],
  imports:[{id:'IMP-1055',type:'contacts',status:'attention',rows:230,created:180,matched:12,failed:38,days:3,by:'Claire Pace',problem:'38 rows have no phone or email.'}],
  jobs:[],onboarding:null,
  notes:[{by:'sam',days:30,text:'Mark is the exec sponsor. Renewal conversation planned for December.'}],
},
{
  id:'onyx',name:'Onyx Group',lifecycle:'onboarding',owner:'anna',renewalDays:350,arr:35000,since:'Nov 2026',
  contract:{activation:'Load + personalisation',onboarding:'€5,000',retainer:'—'},
  invoices:[{id:'INV-2060',label:'Onboarding fee',amt:5000,dueDays:-5,status:'paid'},{id:'INV-2061',label:'Activation · Onyx Rise',amt:7000,dueDays:9,status:'open'}],
  credits:{allowance:24000,used:400,forecast:20000},
  seats:[seat('o1','Diane Abela','owner',2,6,0,0),seat('o2','Ben Cassar','manager',4,2,0,0),seat('o3','Rita Farrugia','rep',30,0,0,0,{waLinked:false}),seat('o4','Neil Grima','rep',30,0,0,0,{waLinked:false})],
  devs:[{id:'onyx',name:'Onyx Rise',state:'draft',band:'51–150',allowance:0,clearance:'outstanding',ref:'',revisions:0,ready:{units:false,prices:false,media:true,plans:false}}],
  units:[],extraActiveUnits:0,opps:[],
  integrations:{wa:{status:'not_connected'},email:{auth:'ok',bounce:0,complaint:0},forms:[]},
  leadsUnassigned:[],approvalsPending:[],dupContacts:0,optOutSends:[],drift:[],imports:[],jobs:[],
  onboarding:{startedDays:9,steps:[
    {k:'provisioned',label:'Workspace provisioned',done:true,days:9},
    {k:'team',label:'Team invited',done:true,days:7},
    {k:'units',label:'Units imported and reviewed',done:false,waitingDays:6,queue:'FQ-308'},
    {k:'wa',label:'WhatsApp connected for reps',done:false},
    {k:'opps',label:'First real opportunities',done:false},
    {k:'gate',label:'Success gate: pipeline live',done:false},
  ]},
  notes:[{by:'anna',days:8,text:'Unit schedule came as a 14-page PDF price list. It needs normalising before import.'}],
},
{
  id:'gozo',name:'Gozo Heritage Homes',lifecycle:'live',owner:'anna',renewalDays:150,arr:20000,since:'Apr 2026',
  contract:{activation:'Launch',onboarding:'Waived (founding member)',retainer:'—'},
  invoices:[{id:'INV-2010',label:'Annual recurring',amt:20000,dueDays:-200,status:'paid'}],
  credits:{allowance:12000,used:5100,forecast:9800},
  seats:[seat('g1','Rose Portelli','owner',1,14,13,2),seat('g2','Adrian Saliba','rep',0,58,55,22),seat('g3','Martina Vassallo','rep',0,47,44,17)],
  devs:[{id:'xaghra',name:'Xagħra Farmhouses',state:'active',band:'Up to 50',allowance:24,clearance:'paid',ref:'INV-1530',revisions:0,ready:{units:true,prices:true,media:true,plans:true}}],
  units:[
    {id:'#XF01',dev:'xaghra',status:'sold',price:540000},
    {id:'#XF02',dev:'xaghra',status:'reserved',price:565000},
    {id:'#XF03',dev:'xaghra',status:'available',price:590000},
  ],
  extraActiveUnits:12,
  opps:[
    {id:'OPP-5001',stage:'closed_won',units:['#XF01'],rep:'g2',lastAct:3,next:true},
    {id:'OPP-5002',stage:'reservation',units:['#XF02'],rep:'g3',lastAct:1,next:true},
    {id:'OPP-5004',stage:'viewing_held',units:['#XF03'],rep:'g2',lastAct:2,next:true},
  ],
  integrations:{
    wa:{status:'connected',quality:'high',tier:'1K',webhookFail:0.2,parseRate:95,templatesRejected:0},
    email:{auth:'ok',bounce:0.8,complaint:0},
    forms:[{id:'f5',name:'Xagħra Farmhouses · hosted form',subs7:9,baseline:8,lastDays:1}],
  },
  leadsUnassigned:[],approvalsPending:[],dupContacts:0,optOutSends:[],drift:[],
  imports:[{id:'IMP-1040',type:'units',status:'applied',rows:24,created:24,matched:0,failed:0,days:60,by:'Rose Portelli'}],
  jobs:[],onboarding:null,
  notes:[{by:'anna',days:12,text:'Happy customer. Good case-study candidate.'}],
},
{
  id:'harbour',name:'Harbour Point Estates',lifecycle:'provisioning',owner:'sam',renewalDays:365,arr:60000,since:'Nov 2026',
  contract:{activation:'Launch',onboarding:'€5,000',retainer:'Performance · €4,000/mo'},
  invoices:[{id:'INV-2070',label:'Onboarding fee',amt:5000,dueDays:5,status:'open'}],
  credits:{allowance:48000,used:0,forecast:30000},
  seats:[seat('h1','Victor Ellul','owner',3,1,0,0)],
  devs:[{id:'grandharbour',name:'Grand Harbour Lofts',state:'draft',band:'151–300',allowance:0,clearance:'outstanding',ref:'',revisions:0,ready:{units:false,prices:false,media:false,plans:false}}],
  units:[],extraActiveUnits:0,opps:[],
  integrations:{wa:{status:'not_connected'},email:{auth:'pending',bounce:0,complaint:0},forms:[]},
  leadsUnassigned:[],approvalsPending:[],dupContacts:0,optOutSends:[],drift:[],imports:[],jobs:[],
  onboarding:{startedDays:2,steps:[
    {k:'provisioned',label:'Workspace provisioned',done:true,days:2},
    {k:'team',label:'Team invited',done:false,queue:'FQ-313'},
    {k:'units',label:'Units imported and reviewed',done:false},
    {k:'wa',label:'WhatsApp connected for reps',done:false},
    {k:'opps',label:'First real opportunities',done:false},
    {k:'gate',label:'Success gate: pipeline live',done:false},
  ]},
  notes:[{by:'sam',days:2,text:'Signed. Launch package starts with a brand consultation next week.'}],
},
];

// Concierge fulfilment queue. `dueH` = hours until due (negative = overdue), `slaH` = SLA length.
const QUEUE=[
  {id:'FQ-311',type:'Custom render',acct:'vella',dev:'dolphin',ctx:'OPP-1007 · kitchen in oak finish',assignee:'mira',status:'in_production',slaH:24,dueH:5,hours:2.5},
  {id:'FQ-312',type:'Custom render',acct:'mercury',dev:'mercury',ctx:'OPP-2006 · penthouse terrace at dusk',assignee:null,status:'requested',slaH:24,dueH:4,hours:0},
  {id:'FQ-308',type:'Unit schedule import',acct:'onyx',dev:'onyx',ctx:'14-page PDF price list → import CSV',assignee:null,status:'requested',slaH:72,dueH:-72,hours:0},
  {id:'FQ-305',type:'Studio brief',acct:'harbour',dev:'grandharbour',ctx:'Launch package · brand consultation',assignee:'theo',status:'in_production',slaH:240,dueH:200,hours:6},
  {id:'FQ-306',type:'Brochure',acct:'gozo',dev:'xaghra',ctx:'Reprint with updated availability',assignee:'theo',status:'revision',slaH:48,dueH:20,hours:3},
  {id:'FQ-301',type:'Present media prep',acct:'vella',dev:'verdala',ctx:'Room media for 3 unit types',assignee:'mira',status:'delivered',slaH:72,dueH:-30,hours:7},
  {id:'FQ-320',type:'New development review',acct:'vella',dev:'vinci',ctx:'Vinci · setup submitted by Joseph Vella',assignee:null,status:'requested',slaH:48,dueH:45,hours:0,review:'vinci'},
  {id:'FQ-313',type:'Onboarding provisioning',acct:'harbour',dev:'grandharbour',ctx:'Team invites and roles',assignee:'anna',status:'requested',slaH:48,dueH:40,hours:0},
];

// New development reviews: a developer submits the setup, Bricly checks it, then tells them it's ready.
const DEV_REVIEWS=(()=>{
  const types=[['2 bed',96,365000],['3 bed',128,465000],['1 bed',68,285000]],units=[];
  ['A','B','C'].forEach(b=>{for(let f=1;f<=5;f++)for(let n=1;n<=3;n++){
    if(units.length>=42)return;
    const [t,m2,p]=f===5&&n===1?['Penthouse',165,690000]:types[n-1];
    units.push({id:`${b}-${f}0${n}`,type:t,m2,price:p+f*6000,plan:true,flags:[]});}});
  const u=id=>units.find(x=>x.id===id);
  u('A-102').price=null;u('A-102').flags.push('Missing price');
  u('B-101').flags.push('Duplicate unit');u('B-101').dupRows=2;
  [['C-401','MR-TypeC-PH.pdf'],['B-102','Block-B-ground-2.pdf'],['A-201','Plan 17.pdf']].forEach(([id,f])=>{u(id).plan=false;u(id).flags.push('No floor plan');u(id).suggested=f;});
  return {vinci:{dev:'vinci',name:'Vinci',acct:'vella',by:'Joseph Vella',email:'joseph@vellaholdings.mt',submittedH:3,
    answers:[['Location','Triq il-Qammieħ, Mellieħa'],['Type','Apartments · 3 blocks'],['Completion','Q4 2027'],['Launch','Planned 18 Jan 2027'],['Buyers','Local upgraders, second-home buyers, overseas relocators'],['Countries','Malta, United Kingdom, Italy, Germany'],['Pricing','Prices set in the availability list'],['Production','Bricly produces everything']],
    units,
    files:[{k:'avail',n:'Availability list',f:'MR availability 30-Sep.xlsx',total:43,done:43,note:'43 rows read as 42 units'},
      {k:'plans',n:'Floor plans',f:'24 files',total:24,done:21,note:'not matched',unmatched:['MR-TypeC-PH.pdf','Block-B-ground-2.pdf','Plan 17.pdf']},
      {k:'ext',n:'Exterior renders',f:'6 files',total:6,done:6,note:'not tagged'},
      {k:'int',n:'Interior renders',f:'8 files',total:8,done:5,note:'not tagged',untagged:['Living-v2.jpg','Kitchen-wip.jpg','Bed-2.jpg']},
      {k:'arch',n:'Architectural drawings',f:'MR-arch-set-rev3.pdf',total:18,done:18,note:''}],
    checks:{units:false,prices:false,plans:false,renders:false},messages:[]}};
})();

const SERVICES=[
  {id:'api',name:'CRM API',status:'ok',latency:182,errors:0.3},
  {id:'jobs',name:'Background jobs',status:'degraded',latency:null,errors:1.4},
  {id:'twilio',name:'Twilio (WhatsApp)',status:'ok',latency:410,errors:0.6},
  {id:'esp',name:'Email provider',status:'ok',latency:260,errors:0.2},
  {id:'google',name:'Google Calendar',status:'ok',latency:300,errors:0.4},
  {id:'forms',name:'Hosted lead forms',status:'ok',latency:140,errors:0.1},
];

const RELEASES=[
  {v:'2026.11.16',days:1,note:'WhatsApp parser: date phrases ("next Friday")'},
  {v:'2026.11.12',days:5,note:'Import: phone normalisation for Maltese numbers'},
  {v:'2026.11.05',days:12,note:'Approvals: delegate to a deputy manager'},
];
const FLAGS=[
  {key:'present_v3',label:'Present Mode v3',ring:'Founding cohort',scope:'account',on:['vella','gozo']},
  {key:'proposals',label:'Buyer proposals',ring:'Internal',scope:'account',on:['vella']},
  {key:'wa_parser_dates',label:'WhatsApp parser · date phrases',ring:'All accounts',scope:'account',on:['vella','mercury','sliema','gozo']},
  {key:'level_plans',label:'Level plans',ring:'Founding cohort',scope:'development',on:['dolphin','verdala','xaghra']},
];

const DSARS=[
  {id:'DSR-014',acct:'sliema',kind:'Access request',subject:'CT-2207',receivedDays:24,status:'open'},
  {id:'DSR-015',acct:'vella',kind:'Erasure request',subject:'CT-1190',receivedDays:6,status:'open'},
  {id:'DSR-011',acct:'gozo',kind:'Access request',subject:'CT-5003',receivedDays:40,status:'closed'},
];
const RETENTION={vella:'6 years',mercury:'6 years',sliema:'5 years',onyx:'6 years',gozo:'6 years',harbour:'6 years'};

// Customer-side audit history (what the account owner sees in Settings › Data and privacy).
const CUSTOMER_AUDIT={
  vella:[{days:2,who:'Joseph Vella',what:'Staged a revision to Dolphin Court pricing'},{days:9,who:'Maria Spiteri',what:'Imported 412 contacts (IMP-1052)'}],
  mercury:[{days:1,who:'Chris Galea',what:'Changed hold expiry to 72h'}],
  sliema:[{days:3,who:'Claire Pace',what:'Imported 230 contacts (IMP-1055)'}],
  onyx:[{days:7,who:'Diane Abela',what:'Invited 3 team members'}],
  gozo:[],harbour:[],
};

const BUYERS={
  'OPP-1001':['Mike Gatt','+356 7912 3456'],'OPP-1014':['Lisa Bugeja','+356 9945 1120'],'OPP-1007':['Luca Mallia','+356 7920 8811'],
  'OPP-1009':['Anne Zerafa','+356 9988 2201'],'OPP-1011':['David Cutajar','+356 7934 5512'],'OPP-1016':['Helen Cini','+356 9921 7740'],
  'OPP-1018':['Jon Busuttil','+356 7955 0093'],'OPP-1020':['Karen Pisani','+356 9902 6618'],
  'OPP-2003':['George Azzopardi','+356 7911 4400'],'OPP-2006':['Olivia Brincat','+356 9930 2214'],'OPP-2008':['Peter Schembri','+356 7966 1018'],
  'OPP-3002':['Fiona Tabone','+356 9977 3341'],'OPP-3004':['Noel Micallef','+356 7988 2210'],'OPP-3005':['Paula Gauci','+356 9911 0045'],
  'OPP-3006':['Steve Mangion','+356 7900 6677'],'OPP-3008':['Grace Formosa','+356 9940 1188'],
  'OPP-5001':['Hugh Bartolo','+356 7922 9001'],'OPP-5002':['Ella Calleja','+356 9915 4407'],'OPP-5004':['Ian Tanti','+356 7939 7012'],
};

window.CS_SEED={STAFF,ACCOUNTS,QUEUE,DEV_REVIEWS,SERVICES,RELEASES,FLAGS,DSARS,RETENTION,CUSTOMER_AUDIT,BUYERS};
})();
