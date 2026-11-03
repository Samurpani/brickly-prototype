// Prototype additions to the Claude Design settings data (window.BST), same format as settings-data-a/b.js.
// Lead allocation comes from Bricly Lead Settings (Lead ownership flows): how new leads get an owner.
(function(){
const X=window.BST; if(!X) return;
const C=(t,c)=>({t,c}), A=(t,s)=>({t,s,av:true}), G=on=>({tg:on}), M=t=>({t,mu:true}), B=(t,s)=>({t,s,b:true});
const f=(l,c,v,x)=>[l,c,v,x||{}];
const salesTabs=X.pages.sales.tabs.slice();
const at=salesTabs.findIndex(t=>t[1]==='sales/leads')+1;
salesTabs.splice(at,0,['Lead allocation','sales/allocation'],['Lead ownership','sales/ownership']);
Object.values(X.pages).forEach(p=>{if(p.nav==='sales'&&p.tabs)p.tabs=salesTabs;});
X.pages['sales/allocation']={nav:'sales',t:'Sales setup',tab:'sales/allocation',d:'How new leads get an owner, per development or as the workspace default. Changes apply to leads arriving after you save; existing owners stay. Every change is written to the audit log.',tabs:salesTabs,
  menu:[['History','s:Opening the audit log filtered to Lead allocation']],
  b:[
    {k:'table',title:'Per development',desc:'Developments without an override use the workspace default.',cols:['Development','Method','Source'],gc:'1.2fr 1fr 1fr',rows:[
      {c:[B('Workspace default','Used by every development without an override'),C('Round robin','pri'),M('Default')],hl:true},
      [B('Mercury'),C('Weighted','info'),C('Override','warn')],
      [B('Dolphin Court'),C('Claim pool','info'),C('Override','warn')],
      [B('Onyx Rise'),C('Round robin','neu'),M('Default')],
      [B('La Lex'),C('Round robin','neu'),M('Default')],
      [B('Verdala'),C('Round robin','neu'),M('Default')]]},
    {k:'fields',title:'Workspace default',desc:'Used by every development without an override.',rows:[
      f('Method','radio',['Round robin','Weighted','Claim pool'],{h:'Round robin: next active rep in order. Inactive reps are skipped without stalling.'}),
      f('Claim pool fallback','select','Round robin after 30 min',{s:'Unclaimed leads in a claim pool',h:'A lead nobody claims is allocated so it never waits'})]},
    {k:'table',title:'Reps who take part',desc:'Order follows the list.',cols:['','Rep','Status','Order','Share','Open leads'],gc:'40px 1.4fr 1.4fr .6fr .6fr .8fr',ra:[3,4,5],rows:[
      [G(true),A('Sam'),C('Active','ok'),'1','33%','9'],
      [G(true),A('Maria Farrugia'),C('Active','ok'),'2','33%','6'],
      [G(true),A('Kyle Azzopardi'),C('Active','ok'),'3','33%','5'],
      {c:[G(true),A('Nadia Cassar'),C('On leave until Mon 12 Oct','warn'),M('Skipped'),M('—'),'0'],dim:true}]},
    {k:'note',tone:'neu',text:'Set by Rachel Mifsud · Mon 7 Sep, 09:30',act:['View history','s:Opening the audit log filtered to Lead allocation']}]};
// Lead ownership (Cold Lead Returns flow 3): one buyer, one owner at a time.
X.pages['sales/ownership']={nav:'sales',t:'Sales setup',tab:'sales/ownership',d:'One buyer, one owner at a time. These rules decide what happens when a known buyer comes back. Requests already waiting keep their route when you change them.',tabs:salesTabs,
  menu:[['History','s:Opening the audit log filtered to Lead ownership']],
  b:[
    {k:'fields',title:'Identity',desc:'How Bricly recognises a buyer it already knows.',rows:[
      f('Identity key','static',B('Phone number','Email is used when there is no phone')),
      f('Match across developments','toggle',true,{h:'A buyer on Verdala is the same buyer on Mercury'})]},
    {k:'fields',title:'Active leads',desc:'The buyer is someone’s open opportunity.',rows:[
      f('Protection window','stepper','14 days',{s:'Days without activity before others can ask to take over',h:'Changing it shows who it affects before you save'}),
      f('Second submission','static',M('Logged as activity on the owner’s opportunity; the other rep is told')),
      f('Rep’s own campaign','toggle',true,{s:'Forms tagged to a rep’s own campaign win ownership',h:'A hand-entered lead never overrides an owner'})]},
    {k:'fields',title:'Lost, nurture or lapsed leads',desc:'A cold buyer fills a form again.',rows:[
      f('Decided by','select','The development’s sales manager',{h:'The request lands in their Approvals queue'}),
      f('Pre-selected owner','radio',['Original rep','Allocation rule'],{h:'The manager can still pick anyone'}),
      f('Decide within','stepper','2 hours'),
      f('If nobody decides','select','Assign to the original rep',{h:'Marked Auto assigned in Decided'})]},
    {k:'table',title:'Change history',cols:['When','Who','Change','Waiting at the time'],gc:'1fr 1fr 2fr 1fr',rows:[
      ['Mon 7 Sep, 09:30',A('Rachel Mifsud'),'Protection window 10 → 14 days',M('3 requests kept their route')],
      ['Tue 1 Sep, 16:05',A('Mark Galea'),'Set up during onboarding',M('—')]]}]};
})();

// Audit fixes: every action resolves to a real dialog, multi-step flows chain, and copy names the right person.
(function(){
const X=window.BST; if(!X) return;
const P=X.pages,D=X.dialogs;
const f=(l,c,v,x)=>[l,c,v,x||{}];
const C=(t,c)=>({t,c}),M=t=>({t,mu:true}),A=(t,s)=>({t,s,av:true}),MO=t=>({t,mono:true});
const tableIn=(page,title)=>(P[page].b||[]).find(b=>b.k==='table'&&(!title||b.title===title));
const tagRows=()=>tableIn('sales/tags').rows;
const tagNames=()=>tagRows().map(r=>r[0].t);
const fmt=d=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
X.selectOpts={'Merge':tagNames,'Merge into':tagNames,'Tag':tagNames,
  'Add after':()=>tableIn('sales','Stages').rows.map(r=>(r.c||r)[1]).filter(c=>!c.lock).map(c=>c.t)};

D['deact-sam'].done='Sam deactivated. 32 records moved to Sarah Azzopardi.';
D.changerole.t='Change role';D.changerole.done='Role changed. Applies on their next request.';
D.changerole.b[1].text='Applies on their next request. Open requests keep their route.';
D.wa1.next='wa2';D.wa2.next='wa3';D.wa3.done='WhatsApp connected. Reps can now message +356 2778 0100.';
D.signout.done='Signed out on 3 devices. Sign in again on this one.';
P.mysecurity.t='Sign-in and sessions';

// Ownership transfer is Owner-only and belongs with the team.
['team','team-invited','team-deact'].forEach(k=>{const m=P[k].menu;if(m.some(i=>i[0]==='Transfer ownership'))return;const t=['Transfer ownership','d:transfer','danger'];t.ownerOnly=true;m.splice(m.length-1,0,t);});
// Development settings open from the development's page; their three tabs all pointed back at themselves.
P.dev.tabs=null;P.dev.back=['Back to development','a:dev/'];
window.stOpenDev=(id,name)=>{P.dev.t=name;P.dev.back=['Back to '+name,'a:dev/'+id];go('settings');stGo('p:dev');};

D.newtag={t:'New tag',ok:'Create tag',b:[{k:'fields',rows:[f('Name','text',''),f('Colour','radio',['Neutral','Green','Amber','Blue'])]}],
  run:v=>{
    if(!v.Name){showToast('Give the tag a name');return false;}
    if(tagNames().some(t=>t.toLowerCase()===v.Name.toLowerCase())){showToast(`${v.Name} already exists`);return false;}
    tagRows().push([C(v.Name,{Green:'pri',Amber:'warn',Blue:'info'}[v.Colour]||'neu'),'0 records',{t:'Merge · Delete',lnk:true}]);
    D.newtag.done=`Tag ${v.Name} created.`;
  }};
D.mergetag={t:'Merge tags',ok:'Merge',d:'Every record with the first tag gets the second instead. The first tag is removed.',b:[{k:'fields',rows:[f('Merge','select',tagNames()[2]||''),f('Merge into','select',tagNames()[0]||'')]}],
  run:v=>{
    if(v.Merge===v['Merge into']){showToast('Pick two different tags');return false;}
    const rows=tagRows(),from=rows.find(r=>r[0].t===v.Merge),to=rows.find(r=>r[0].t===v['Merge into']);
    const n=r=>parseInt(r[1],10)||0;to[1]=`${n(to)+n(from)} records`;rows.splice(rows.indexOf(from),1);
    D.mergetag.done=`${v.Merge} merged into ${v['Merge into']}.`;
  }};
D.deletetag={t:'Delete a tag',ok:'Delete tag',danger:true,b:[{k:'fields',rows:[f('Tag','select',tagNames().at(-1)||'')]},{k:'note',tone:'warn',text:'The tag comes off every record that has it. The records themselves stay.'}],
  run:v=>{const rows=tagRows();rows.splice(rows.findIndex(r=>r[0].t===v.Tag),1);D.deletetag.done=`${v.Tag} deleted.`;}};
D.addstage={t:'Add a stage',ok:'Add stage',d:'Custom stages sit before Reserved. Reserved, Promise of sale and Deed are fixed so deals and payments stay consistent.',
  b:[{k:'fields',rows:[f('Label','text',''),f('Add after','select','Offer made'),f('Next action','text',''),f('Key date label','text','',{h:'Leave empty if this stage has no date'})]}],
  run:v=>{
    if(!v.Label){showToast('Give the stage a label');return false;}
    const rows=tableIn('sales','Stages').rows,cells=r=>r.c||r;
    const at=rows.findIndex(r=>cells(r)[1].t===v['Add after'])+1;
    const key=v.Label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    rows.splice(at,0,[M(''),{t:v.Label,b:true},MO(key),v['Next action']||'—',v['Key date label']||'—']);
    rows.forEach((r,i)=>{cells(r)[0]=M(String(i+1));});
    D.addstage.done=`${v.Label} added after ${v['Add after']}. Opportunities can move into it now.`;
  }};
D.adddoc={t:'Add a required document',ok:'Add document',b:[{k:'fields',rows:[f('Document','text',''),f('Stage','select','Reservation'),f('Required','select','Required'),f('Uploaded by','select','Buyer')]}],
  run:v=>{
    if(!v.Document){showToast('Name the document');return false;}
    tableIn('sales/docs',v.Stage).rows.push([v.Document,C(v.Required,v.Required==='Required'?'warn':'neu'),v['Uploaded by']]);
    D.adddoc.done=`${v.Document} added to ${v.Stage}.`;
  }};
D.addendpoint={t:'Add a webhook endpoint',ok:'Add endpoint',b:[{k:'fields',rows:[f('URL','text','https://'),f('Events','select','All events')]},{k:'note',tone:'neu',text:'Each request is signed. The signing secret shows once, after you add the endpoint.'}],
  run:v=>{
    if(!/^https:\/\/[^\s/]+\.[^\s]+/.test(v.URL)){showToast('Enter an https:// address');return false;}
    tableIn('devaccess','Webhooks').rows.push([MO(v.URL),v.Events,C('Waiting for first event','neu')]);
    D.addendpoint.done='Endpoint added. Copy the signing secret now; it won’t show again.';
  }};
D.newplan={t:'New payment plan template',ok:'Create template',b:[{k:'fields',rows:[f('Name','text',''),f('Deposit at promise of sale','text','10%'),f('Construction instalments','text','20% on shell · 20% on finishes'),f('Final balance at deed','text','Remainder')]}],
  run:v=>{
    if(!v.Name){showToast('Name the template');return false;}
    const rows=[['Deposit at promise of sale',v['Deposit at promise of sale'],'On signing'],...v['Construction instalments'].split('·').map(s=>s.trim()).filter(Boolean).map(s=>['Construction instalment',s.split(' ')[0],s.replace(/^\S+\s*/,'')||'—']),['Final balance at deed',v['Final balance at deed'],'On deed']];
    P['sales/plans'].b.push({k:'table',title:v.Name,cols:['Milestone','Amount','Due'],gc:'1.6fr 1fr 1.4fr',rows});
    D.newplan.done=`${v.Name} created. Pick it when you set up a deal.`;
  }};
D.dsar={t:'Log a data request',ok:'Log request',d:'GDPR gives you one month to respond, extendable by two months for complex requests.',b:[{k:'fields',rows:[f('Contact','text',''),f('Request type','select','Access (copy of data)')]}],
  run:v=>{
    if(!v.Contact){showToast('Who made the request?');return false;}
    const now=new Date(),due=new Date(now);due.setMonth(due.getMonth()+1);
    tableIn('data/requests').rows.unshift([A(v.Contact,'Logged just now'),v['Request type'].split(' ')[0],fmt(now),fmt(due),C('Open','warn')]);
    D.dsar.done=`Request logged. Due ${fmt(due)}.`;
  }};
D.addadaccount={t:'Give the Perform team access to an ad account',ok:'Add account',b:[{k:'fields',rows:[f('Ad platform','select','Meta Ads'),f('Account ID','text','')]}],
  run:v=>{
    if(!v['Account ID']){showToast('Enter the ad account ID');return false;}
    tableIn('adaccess').rows.push([v['Ad platform'].replace(' Ads',''),MO(v['Account ID']),fmt(new Date()),'You',{t:'Revoke',lnk:true}]);
    D.addadaccount.done='Access requested. It shows as granted once the platform confirms.';
  }};
D.revoke={t:'Revoke ad account access?',ok:'Revoke access',danger:true,b:[{k:'note',tone:'warn',text:'The Perform team loses access straight away. Running campaigns keep spending until you pause them in the ad platform.'}],done:'Access revoked. The change is in the audit log.'};
D.contactbilling={t:'Contact billing',ok:'Send message',b:[{k:'fields',rows:[f('Topic','radio',['Invoice question','Change plan','Something else']),f('Message','area','')]}],
  run:v=>{if(!v.Message){showToast('Write a short message');return false;}},done:'Sent to billing@bricly.app. Replies go to Mark Galea.'};
D['preset-new']={t:'Apply the New rep preset?',ok:'Apply preset',d:'Every action needs a manager’s approval for the reps you mark as new.',b:[{k:'note',tone:'neu',items:['Hold, reservation, price exception, unit status change and contract association all need approval','Requests already waiting keep their route']}],done:'New rep preset applied.'};
D['preset-trusted']={t:'Apply the Trusted rep preset?',ok:'Apply preset',d:'Holds and reservations go straight through. Price exceptions, unit status changes and contracts still need approval.',b:[{k:'note',tone:'neu',items:['Requests already waiting keep their route']}],done:'Trusted rep preset applied.'};
D.resetnotif={t:'Reset notifications to defaults?',ok:'Reset to defaults',danger:true,b:[{k:'note',tone:'warn',text:'Every event goes back to Bricly’s default channels for each role. Locked channels stay locked.'}],done:'Notifications reset to defaults.'};
D.caldisc={t:'Disconnect Google Calendar?',ok:'Disconnect',danger:true,b:[{k:'note',tone:'neu',text:'Bricly stops writing appointments to sam@lalex.mt. Events already in your calendar stay.'}],done:'Google Calendar disconnected.'};
})();

// Tab headings: one description for the section (top header) and one per tab (the heading under the tabs).
(function(){
const X=window.BST; if(!X) return;
X.sectionDesc={
  team:'Everyone who works in Bricly, and what each role can do.',
  data:'How buyer data is kept, exported and handed back to buyers.',
  security:'Who can sign in and how, and a permanent record of every change.',
  plan:'Your Bricly plan, services, invoices and how you pay.',
  credits:'AI actions use credits from a monthly pool shared by the whole account. Record changes, approvals and the pipeline never use credits.',
  sales:'Account defaults for how the team sells. Developments inherit these unless they override them.',
};
X.tabDesc={
  team:'Everyone with access to Bricly. Open a person to edit their details, role and access.',
  data:'How long buyer data is kept and who can see identity and source-of-funds documents. Pre-filled from Malta, your default market.',
  plan:'Your yearly fee is set by active homes: the count, the band it puts you in, and what changes the fee before it changes.',
  'plan/homes':'Homes that count towards your fee, by development.',
  'plan/services':'Studio launches, Perform campaigns and ad creative you’ve bought on top of your plan.',
  'plan/invoices':'Every invoice from Bricly. Download any of them as a PDF.',
  'plan/billing':'Who invoices are made out to and how you pay them.',
  'plan/messaging':'WhatsApp and SMS sent this month, and what they cost.',
  credits:'This month’s pool, what used it and who.',
  'credits/weights':'How many credits each AI action uses. Published so there are no surprises.',
  'credits/ledger':'Every credit used or added, with who and why.',
  wa:'The number reps message to keep Bricly current. Every command is saved in Chats.',
  'wa/numbers':'Team members whose WhatsApp number Bricly recognises.',
  'wa/commands':'What reps can ask Bricly to do over WhatsApp, and which actions need approval.',
  'wa/behaviour':'How Bricly replies and when it stays quiet.',
  'wa/activity':'Recent WhatsApp commands and what happened.',
  sales:'Stages every opportunity moves through, and the reasons reps can give when one is lost.',
  'sales/statuses':'What each unit status means, what buyers see, and how holds work.',
  'sales/leads':'How fast leads must be answered, and where they come from.',
  'sales/docs':'Documents each deal collects at reservation, promise of sale and deed.',
  'sales/plans':'Payment plan templates a deal starts from.',
  'sales/tags':'Tags reps can add to opportunities and contacts.',
};
})();
