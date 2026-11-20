// Control Station engine: state, permissions, Data Doctor checks, alert rules, health score,
// audited repair operations, support sessions and the staff action log.
// Screens live in admin-screens*.js and only read/act through window.CS.
(function(){
const SEED=window.CS_SEED;
const clone=o=>JSON.parse(JSON.stringify(o));
const NOW=Date.now();
const H=3600e3,D=24*H;

const CS=window.CS={
  staff:clone(SEED.STAFF),accounts:clone(SEED.ACCOUNTS),queue:clone(SEED.QUEUE),reviews:clone(SEED.DEV_REVIEWS),services:clone(SEED.SERVICES),
  releases:clone(SEED.RELEASES),flags:clone(SEED.FLAGS),dsars:clone(SEED.DSARS),retention:clone(SEED.RETENTION),
  customerAudit:clone(SEED.CUSTOMER_AUDIT),buyers:SEED.BUYERS,
  me:'sam',alertState:{},staffLog:[],sessions:[],sensitive:[],pendingOps:[],overrides:{},incidents:[],slack:[],
  paused:{},restrictions:{},playbookTicks:{},notes:{},
  oncall:[{label:'This week',staff:'sam'},{label:'Next week',staff:null},{label:'Week after',staff:null}],
  seq:500,
};
CS.accounts.forEach(a=>{a.notes=a.notes.map(n=>({...n,at:NOW-n.days*D}));});
CS.queue.forEach(q=>{q.dueAt=NOW+q.dueH*H;});

// ---------- helpers ----------
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=n=>'€'+Math.round(n).toLocaleString('en-GB');
const ago=t=>{const m=Math.round((Date.now()-t)/60e3);if(m<1)return 'just now';if(m<60)return m+'m ago';const h=Math.round(m/60);if(h<48)return h+'h ago';return Math.round(h/24)+'d ago';};
const inDays=n=>n===0?'today':n>0?`in ${n}d`:`${-n}d ago`;
const pct=(a,b)=>b?Math.round(a/b*100):100;
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
const avg=arr=>arr.length?arr.reduce((s,n)=>s+n,0)/arr.length:0;
const uid=p=>p+'-'+(++CS.seq);
Object.assign(CS,{esc,eur,ago,inDays,pct,clamp,uid,H,D});

const ROLE_LABEL={founder:'Founder / Admin',cs:'CS / Ops',eng:'Engineer',contractor:'Concierge / Contractor',finance:'Finance'};
const PERMS={
  founder:['*'],
  cs:['accounts','alerts','alerts.act','integrations','doctor','ops.request','queue','queue.act','support','support.l1','support.l2','usage','commercial','compliance','compliance.act','platform','staff','notes','owner.set'],
  eng:['accounts','alerts','alerts.act','integrations','doctor','ops.request','ops.approve','sensitive.approve','queue','support','support.l1','usage','commercial','compliance','platform','platform.act','staff'],
  contractor:['queue.own'],
  finance:['accounts','alerts','commercial','commercial.act','clearance.set','usage','compliance','staff'],
};
const me=()=>CS.staff.find(s=>s.id===CS.me);
const can=p=>{const r=PERMS[me().role];return r.includes('*')?p!=='queue.own':r.includes(p);};
const staffName=id=>CS.staff.find(s=>s.id===id)?.name||'Unassigned';
const acct=id=>CS.accounts.find(a=>a.id===id);
const devName=(a,id)=>a.devs.find(d=>d.id===id)?.name||id;
const seatName=(a,id)=>a.seats.find(s=>s.id===id)?.name||id;
Object.assign(CS,{ROLE_LABEL,PERMS,current:me,can,staffName,acct,devName,seatName});

// ---------- domain ----------
const STAGE_LABEL={lead:'Lead',qualified:'Qualified',viewing_booked:'Viewing booked',viewing_held:'Viewing held',negotiating:'Negotiating',hold:'Hold',reservation:'Reservation',kyc:'KYC',pos:'POS',payments:'Payments',deed:'Deed',handover:'Handover',closed_won:'Closed won'};
const COMMIT=['reservation','kyc','pos','payments','deed','handover','closed_won'];
const COUNTED=['available','hold','reserved'];
const commitOpps=(a,uid)=>a.opps.filter(o=>COMMIT.includes(o.stage)&&o.units.includes(uid));
const shortlistOpps=(a,uid)=>a.opps.filter(o=>!COMMIT.includes(o.stage)&&o.units.includes(uid));
const activeUnits=a=>a.units.filter(u=>COUNTED.includes(u.status)&&a.devs.find(d=>d.id===u.dev)?.state==='active').length+(a.extraActiveUnits||0);
const allowance=a=>a.devs.filter(d=>d.state==='active').reduce((s,d)=>s+d.allowance,0);
const isOnboarding=a=>['onboarding','provisioning'].includes(a.lifecycle);
Object.assign(CS,{STAGE_LABEL,COMMIT,commitOpps,activeUnits,allowance,isOnboarding});

// ---------- Data Doctor ----------
const CHECKS=[
  {id:'double_sale',group:'Inventory and deals',sev:'P1',label:'Unit committed to more than one deal',
    run:a=>a.units.filter(u=>commitOpps(a,u.id).length>1).map(u=>({entity:u.id,dev:u.dev,detail:`${u.id} is ${u.status} and committed on ${commitOpps(a,u.id).map(o=>`${o.id} (${STAGE_LABEL[o.stage]})`).join(' and ')}.`,op:'resolve_unit_conflict',target:u.id}))},
  {id:'sold_on_shortlist',group:'Inventory and deals',sev:'P2',label:'Sold unit still on other shortlists',
    run:a=>a.units.filter(u=>u.status==='sold'&&shortlistOpps(a,u.id).length).map(u=>({entity:u.id,dev:u.dev,detail:`${u.id} is sold but still shortlisted on ${shortlistOpps(a,u.id).map(o=>o.id).join(', ')}. The propagation rule did not run.`,op:'rerun_propagation',target:u.dev}))},
  {id:'status_mismatch',group:'Inventory and deals',sev:'P2',label:'Unit status disagrees with its deal',
    run:a=>a.opps.filter(o=>COMMIT.includes(o.stage)&&o.stage!=='closed_won').flatMap(o=>o.units.map(id=>a.units.find(u=>u.id===id)).filter(u=>u&&u.status==='available').map(u=>({entity:u.id,dev:u.dev,detail:`${o.id} is in ${STAGE_LABEL[o.stage]} but ${u.id} still shows Available to every other rep.`,op:'rerun_propagation',target:u.dev})))},
  {id:'expired_hold',group:'Inventory and deals',sev:'P2',label:'Hold expired but unit still on hold',
    run:a=>a.units.filter(u=>u.status==='hold'&&u.holdDays<0).map(u=>({entity:u.id,dev:u.dev,detail:`The hold on ${u.id} expired ${-u.holdDays} days ago.`,op:'release_expired_hold',target:u.id}))},
  {id:'hold_no_approval',group:'Inventory and deals',sev:'P2',label:'Hold without an approved request',
    run:a=>a.units.filter(u=>u.status==='hold'&&!u.approval).map(u=>({entity:u.id,dev:u.dev,detail:`${u.id} is on hold but no manager approved it.`,op:'create_hold_approval',target:u.id}))},
  {id:'allowance',group:'Inventory and deals',sev:'P2',label:'Active units at or near the allowance',
    run:a=>{const n=activeUnits(a),cap=allowance(a);if(!cap||n<cap*0.9)return [];return [{entity:'allowance',sev:n>=cap?'P2':'P3',detail:`${n} of ${cap} active units used (${pct(n,cap)}%).`}];}},
  {id:'active_no_clearance',group:'Inventory and deals',sev:'P1',label:'Development active without activation clearance',
    run:a=>a.devs.filter(d=>d.state==='active'&&d.clearance==='outstanding').map(d=>({entity:d.id,dev:d.id,detail:`${d.name} is active but its activation fee is outstanding.`}))},
  {id:'missing_price',group:'Inventory and deals',sev:'P3',label:'Units without a price on an active development',
    run:a=>a.units.filter(u=>COUNTED.includes(u.status)&&!u.price&&a.devs.find(d=>d.id===u.dev)?.state==='active').map(u=>({entity:u.id,dev:u.dev,detail:`${u.id} has no price. Reps can't quote it and Present hides it.`}))},
  {id:'orphan_opps',group:'Pipeline and ownership',sev:'P2',label:'Opportunities owned by a deactivated user',
    run:a=>{const off=a.seats.filter(s=>!s.active).map(s=>s.id);const os=a.opps.filter(o=>off.includes(o.rep));return os.length?[{entity:'orphans',detail:`${os.length} opportunities (${os.map(o=>o.id).join(', ')}) belong to ${off.map(id=>seatName(a,id)).join(', ')}, who is deactivated.`,op:'reassign_orphans',target:a.id}]:[];}},
  {id:'unassigned_leads',group:'Pipeline and ownership',sev:'P2',label:'Leads unassigned past the 2h SLA',
    run:a=>{const l=a.leadsUnassigned.filter(x=>x.ageH>2);return l.length?[{entity:'leads',detail:`${l.length} leads waiting up to ${Math.max(...l.map(x=>x.ageH))}h for a rep.`,op:'reassign_leads',target:a.id}]:[];}},
  {id:'approvals_stale',group:'Pipeline and ownership',sev:'P3',label:'Approvals pending more than 3 days',
    run:a=>{const p=a.approvalsPending.filter(x=>x.ageDays>3);return p.length?[{entity:'approvals',detail:`${p.length} approvals waiting (${p.map(x=>`${x.what}, ${x.ageDays}d`).join('; ')}).`}]:[];}},
  {id:'stale_pipeline',group:'Pipeline and ownership',sev:'P3',label:'Stale pipeline',
    run:a=>{const open=a.opps.filter(o=>o.stage!=='closed_won');const st=open.filter(o=>o.lastAct>=14);return open.length&&st.length/open.length>0.3?[{entity:'stale',detail:`${st.length} of ${open.length} open opportunities have had no activity for 14+ days.`}]:[];}},
  {id:'dup_contacts',group:'Contacts and compliance',sev:'P3',label:'Duplicate contacts',
    run:a=>a.dupContacts?[{entity:'dups',detail:`${a.dupContacts} contact pairs share a normalised phone or email.`,op:'merge_duplicates',target:a.id}]:[]},
  {id:'optout_send',group:'Contacts and compliance',sev:'P1',label:'Message sent to an opted-out contact',
    run:a=>a.optOutSends.filter(m=>!m.contained).map(m=>({entity:m.id,detail:`${m.channel} message ${m.id} went to opted-out contact ${m.contact} via "${m.automation}" (sender ${seatName(a,m.sender)}), ${m.h}h ago.`,op:'contain_optout',target:m.id}))},
  {id:'config_drift',group:'Configuration',sev:'P3',label:'Settings disagree with the CRM',
    run:a=>a.drift.length?[{entity:'drift',detail:a.drift.map(d=>`${d.what} ${d.settings}, but ${d.crm} in the CRM`).join('. ')+'.',op:'apply_settings_fix',target:a.id}]:[]},
  {id:'import_problem',group:'Imports and jobs',sev:'P2',label:'Import needs attention',
    run:a=>a.imports.filter(i=>(i.status==='attention'||i.problem)&&i.status!=='undone').map(i=>({entity:i.id,detail:`${i.id} (${i.type}, ${i.rows} rows, ${i.days}d ago): ${i.problem||i.failed+' rows failed.'}`,op:i.problem?'undo_import':null,target:i.id}))},
  {id:'dead_jobs',group:'Imports and jobs',sev:'P2',label:'Background job dead-lettered',
    run:a=>a.jobs.filter(j=>j.state==='dead').map(j=>({entity:j.id,detail:`${j.kind} for ${j.target} failed ${j.tries} times: ${j.error}.`,op:'retry_job',target:j.id}))},
];
const SEV_W={P1:25,P2:10,P3:4,P4:0};
function doctor(a){
  const found=CHECKS.flatMap(c=>c.run(a).map(f=>({...f,check:c.id,group:c.group,label:c.label,sev:f.sev||c.sev})));
  const score=clamp(100-found.reduce((s,f)=>s+SEV_W[f.sev],0));
  return {found,score};
}
Object.assign(CS,{CHECKS,doctor});

// ---------- alert rules ----------
// Each rule returns findings for one account; doctor findings become alerts too.
const PLAYBOOKS={
  double_sale:['Freeze the unit (no further status changes)','Find the earlier valid transaction in the record history','Call the account owner before changing anything','Run "Resolve unit conflict" and confirm with the owner'],
  sold_on_shortlist:['Check the dead-lettered propagation job','Run "Re-run unit propagation" for the development','Tell the affected reps the unit is gone'],
  status_mismatch:['Confirm the deal stage with the rep','Run "Re-run unit propagation"','Check no other rep promised the unit'],
  expired_hold:['Check with the rep whether the buyer still wants it','Release the hold or ask the manager to extend it'],
  hold_no_approval:['Create the missing approval request','Nudge the manager to decide'],
  allowance:['Review the active-unit count with the owner','Offer a band upgrade or let the owner pick units to move off-market'],
  active_no_clearance:['Check with finance','Set clearance or contact the owner'],
  missing_price:['Ask the owner for the price list','Never enter prices for the customer'],
  orphan_opps:['Ask the manager who should take the opportunities','Run "Reassign orphaned opportunities"'],
  unassigned_leads:['Check routing rules have active reps','Run "Assign waiting leads"','Tell the manager'],
  approvals_stale:['Nudge the manager','Suggest delegation or auto-expiry settings'],
  stale_pipeline:['Share the stale list with the manager','Run the rep-coaching playbook'],
  dup_contacts:['Review the pairs','Run "Merge duplicate contacts"'],
  optout_send:['Contain: pause the automation that sent it','Notify the DPO and open an incident record','Tell the account owner within 24h'],
  config_drift:['Walk the owner through the differences','Record consent and apply the fix'],
  import_problem:['Open the batch and read the failure reasons','Fix the mapping with the customer','Undo or re-run the import'],
  dead_jobs:['Read the job error','Retry the job','If it fails again, escalate to engineering'],
  wa_flagged:['Tell the account owner now','Check template and quality history in Meta','Pause outbound automations until quality recovers','Walk the owner through reconnecting'],
  wa_quality:['Review recent templates and opt-outs','Coach the team on message frequency'],
  webhook_fail:['Check the provider status page','Replay failed deliveries','Escalate to engineering if it continues'],
  parser_low:['Read the failing phrases','Log them for the parser backlog'],
  template_rejected:['Read the rejection reason','Fix and resubmit the template with the customer'],
  email_auth:['Send the DNS fix to the customer\'s IT contact','Re-check authentication after 24h'],
  email_bounce:['Check the suppression list growth','Check recent imports for bad emails'],
  form_silent:['Submit a test lead','Check the form embed and domain','Tell the marketing user'],
  calendar_token:['Ask the rep to reconnect Google Calendar','Run "Resync calendar" afterwards'],
  credits_forecast:['Review consumption by driver','Offer an output block or adjust usage'],
  rep_drop:['Nudge the manager','Check the rep\'s WhatsApp link'],
  owner_quiet:['Send the value summary','Book an exec touchpoint'],
  invoice_overdue:['Finance follow-up','No product restriction without a founder decision'],
  renewal_risk:['Prepare a value review','Book an exec sponsor call','Fix the top health drivers first'],
  activation_blocked:['Finance check','Set clearance or contact the owner'],
  sla_risk:['Assign or reassign a producer','Tell the requester the new ETA'],
  onboarding_stuck:['Find the blocking queue item','Assign it and restart the clock','Update the customer'],
  dsar_deadline:['Gather the data export','Send before the one-month deadline'],
  incident:['Confirm scope and affected accounts','Post on the status page','Send the customer notice'],
};
const TITLE={wa_flagged:'WhatsApp number flagged',wa_quality:'WhatsApp quality dropped',webhook_fail:'Webhook failures above 5%',parser_low:'WhatsApp command parsing below 80%',template_rejected:'WhatsApp template rejected',email_auth:'Email domain authentication broken',email_bounce:'Email bounce rate above 5%',form_silent:'Lead form gone silent',calendar_token:'Calendar sync token expired',credits_forecast:'Credits forecast over allowance',rep_drop:'Rep adoption drop',owner_quiet:'Owner has gone quiet',invoice_overdue:'Invoice overdue',renewal_risk:'Renewal at risk',activation_blocked:'Activation blocked on clearance',sla_risk:'Concierge SLA at risk',onboarding_stuck:'Onboarding stuck',dsar_deadline:'Data request close to deadline',incident:'Platform incident'};

function rules(a,{skipRenewal}={}){
  const out=[],add=(rule,sev,entity,detail,extra={})=>out.push({rule,sev,acct:a.id,entity,detail,title:TITLE[rule],...extra});
  const wa=a.integrations.wa,em=a.integrations.email;
  if(!CS.paused[a.id]){
    if(['flagged','disabled'].includes(wa.status))add('wa_flagged','P1','wa',`Number status is ${wa.status}, quality ${wa.quality}, messaging limit ${wa.tier}. Reps' commands and buyer messages may fail.`,{link:`#/accounts/${a.id}/integrations`});
    else if(wa.quality==='medium')add('wa_quality','P3','wa','Quality rating is Medium. Another drop limits outbound messaging.',{link:`#/accounts/${a.id}/integrations`});
  }
  if(wa.webhookFail>5)add('webhook_fail','P2','wa',`${wa.webhookFail}% of WhatsApp webhooks failed in the last 15 minutes.`,{link:`#/accounts/${a.id}/integrations`,op:'replay_webhooks',target:a.id});
  if(wa.parseRate&&wa.parseRate<80)add('parser_low','P3','wa',`Only ${wa.parseRate}% of rep commands parsed first time this week.`,{link:`#/accounts/${a.id}/integrations`});
  if(wa.templatesRejected)add('template_rejected','P2','wa',`${wa.templatesRejected} message template rejected by Meta.`,{link:`#/accounts/${a.id}/integrations`});
  if(em.auth==='dkim_broken')add('email_auth','P2','email','DKIM signature failing for the sending domain. Emails land in spam.',{link:`#/accounts/${a.id}/integrations`});
  if(em.bounce>5)add('email_bounce','P2','email',`Bounce rate ${em.bounce}% this week.`,{link:`#/accounts/${a.id}/integrations`});
  a.integrations.forms.filter(f=>f.subs7===0&&f.baseline>0&&f.lastDays>=3).forEach(f=>add('form_silent','P2',f.id,`${f.name} has had no submissions for ${f.lastDays} days (usually ~${f.baseline}/week)${f.adsRunning?' while ads are running':''}.`,{link:`#/accounts/${a.id}/integrations`}));
  a.seats.filter(s=>s.active&&!s.calendarOk).forEach(s=>add('calendar_token','P3',s.id,`${s.name}'s Google Calendar token expired. Their meetings stopped syncing.`,{link:`#/accounts/${a.id}/integrations`,op:'resync_calendar',target:s.id}));
  if(a.credits.forecast>a.credits.allowance)add('credits_forecast','P3','credits',`Credits are forecast at ${a.credits.forecast.toLocaleString()} against an allowance of ${a.credits.allowance.toLocaleString()} before renewal.`,{link:`#/accounts/${a.id}/commercial`});
  if(!isOnboarding(a)){
    a.seats.filter(s=>s.active&&s.role==='rep'&&((s.actsPrev>=10&&s.acts7<s.actsPrev*0.5)||s.lastLogin>=7)).forEach(s=>add('rep_drop','P3',s.id,`${s.name}: ${s.acts7} activities this week vs ${s.actsPrev} last week, last login ${s.lastLogin}d ago.`,{link:`#/accounts/${a.id}/team`}));
    const o=a.seats.find(s=>s.role==='owner');if(o&&o.lastLogin>=21)add('owner_quiet','P3',o.id,`${o.name} (owner) hasn't logged in for ${o.lastLogin} days.`,{link:`#/accounts/${a.id}/team`});
  }
  a.invoices.filter(i=>i.status==='open'&&i.dueDays<-14).forEach(i=>add('invoice_overdue','P3',i.id,`${i.id} (${i.label}, ${eur(i.amt)}) is ${-i.dueDays} days overdue.`,{link:`#/accounts/${a.id}/commercial`}));
  a.devs.filter(d=>d.state==='draft'&&d.clearance==='outstanding'&&d.readyDays>=5).forEach(d=>add('activation_blocked','P2',d.id,`${d.name} has been ready to activate for ${d.readyDays} days but the activation fee is outstanding.`,{link:`#/accounts/${a.id}/developments`,dev:d.id}));
  if(a.onboarding)a.onboarding.steps.filter(s=>!s.done&&s.waitingDays>=5).forEach(s=>add('onboarding_stuck','P2',s.k,`"${s.label}" has been waiting ${s.waitingDays} days${s.queue?` (queue item ${s.queue})`:''}.`,{link:`#/accounts/${a.id}/overview`}));
  CS.queue.filter(q=>q.acct===a.id&&q.status!=='delivered').forEach(q=>{
    const left=(q.dueAt-Date.now())/H,elapsed=(q.slaH-left)/q.slaH;
    if(left<0)add('sla_risk','P2',q.id,`${q.id} ${q.type} is ${Math.round(-left)}h overdue${q.assignee?'':' and has no assignee'}.`,{link:'#/queue'});
    else if(q.status==='requested'&&elapsed>=0.75)add('sla_risk','P2',q.id,`${q.id} ${q.type} has used ${Math.round(elapsed*100)}% of its ${q.slaH}h SLA and hasn't started.`,{link:'#/queue'});
  });
  CS.dsars.filter(r=>r.acct===a.id&&r.status==='open'&&r.receivedDays>=23).forEach(r=>add('dsar_deadline','P2',r.id,`${r.id} ${r.kind.toLowerCase()} is due in ${30-r.receivedDays} days.`,{link:'#/compliance'}));
  doctor(a).found.forEach(f=>add(f.check,f.sev,f.entity,f.detail,{title:f.label,link:`#/accounts/${a.id}/data`,op:f.op,target:f.target,dev:f.dev}));
  if(!skipRenewal&&a.renewalDays<=90){const h=health(a);if(h.score<75)add('renewal_risk','P2','renewal',`Renewal in ${a.renewalDays} days and health is ${h.score} (${h.color}). Drivers: ${h.drivers.map(d=>d.text).join('; ')}.`,{link:`#/accounts/${a.id}/overview`});}
  return out;
}

const SEV_ORDER={P1:0,P2:1,P3:2,P4:3};
function evaluate(){
  const live=[...CS.accounts.flatMap(a=>rules(a)),...CS.incidents.filter(i=>i.status==='open').map(i=>({rule:'incident',sev:'P1',acct:null,entity:i.id,title:`Platform incident: ${i.title}`,detail:`${i.component} affected. ${i.affected.length} accounts affected: ${i.affected.map(id=>acct(id).name).join(', ')}.`,link:'#/platform'}))];
  const keys=new Set();
  live.forEach(al=>{
    const key=`${al.rule}:${al.acct||'platform'}:${al.entity}`;keys.add(key);al.key=key;
    let st=CS.alertState[key];
    if(!st||st.status==='resolved'){
      st=CS.alertState[key]={status:'open',firstSeen:st?Date.now():Date.now()-(SEED_AGE[key]||1)*H,assignee:null,history:[]};
      if(al.sev==='P1'&&CS.booted)postSlack(al);
      if(CS.booted&&al.acct)timeline(al.acct,'alert',`Alert raised: ${al.title}`);
    }
    if(st.status==='snoozed'&&st.until<Date.now()){st.status='open';st.history.push({at:Date.now(),text:'Snooze ended'});}
    Object.assign(al,{state:st});
  });
  Object.entries(CS.alertState).forEach(([k,st])=>{
    if(!keys.has(k)&&st.status!=='resolved'){st.status='resolved';st.resolvedBy='auto';st.resolvedAt=Date.now();st.history.push({at:Date.now(),text:'Condition cleared: auto-resolved'});const id=k.split(':')[1];if(acct(id))timeline(id,'alert',`Alert auto-resolved: ${k.split(':')[0].replace(/_/g,' ')}`);}
  });
  live.sort((x,y)=>SEV_ORDER[x.sev]-SEV_ORDER[y.sev]||x.state.firstSeen-y.state.firstSeen);
  CS.alerts=live;
  CS.resolvedAlerts=Object.entries(CS.alertState).filter(([,st])=>st.status==='resolved').map(([k,st])=>({key:k,state:st}));
  return live;
}
// How long ago (hours) seeded alerts were first seen, so ages look realistic on load.
const SEED_AGE={'double_sale:vella:#CM9802':9*24,'wa_flagged:mercury:wa':3,'optout_send:mercury:MSG-55120':5,'form_silent:sliema:f4':48,'onboarding_stuck:onyx:units':6*24,'import_problem:vella:IMP-1052':8*24,'dead_jobs:vella:JOB-88213':9*24,'sla_risk:onyx:FQ-308':72,'sla_risk:mercury:FQ-312':1,'renewal_risk:sliema:renewal':30,'webhook_fail:mercury:wa':2};
Object.assign(CS,{rules,evaluate,PLAYBOOKS,SEV_ORDER});

function postSlack(al){
  const on=CS.oncall[0].staff;
  CS.slack.unshift({at:Date.now(),sev:al.sev,text:`${on?'@'+staffName(on).split(' ')[0]:'@channel (no on-call set)'} ${al.sev} · ${al.acct?acct(al.acct).name:'Platform'} · ${al.title}`});
}

// ---------- health ----------
const HIST={vella:[81,79,76],mercury:[84,85,82],sliema:[68,63,58],gozo:[88,89,90]};
const PILLARS={adoption:['Adoption',30],data:['Data health',20],integration:['Integrations',15],value:['Value delivered',20],relationship:['Relationship',15]};
function health(a){
  if(isOnboarding(a))return activation(a);
  const reps=a.seats.filter(s=>s.role==='rep'&&s.active),activeReps=reps.filter(s=>s.acts7>0&&s.lastLogin<7);
  const owner=a.seats.find(s=>s.role==='owner'),open=a.opps.filter(o=>o.stage!=='closed_won');
  const repActs=Math.round(avg(reps.map(s=>s.acts7))),nextPct=pct(open.filter(o=>o.next).length,open.length);
  const stale=pct(open.filter(o=>o.lastAct>=14).length,open.length),doc=doctor(a);
  const wa=a.integrations.wa,em=a.integrations.email,forms=a.integrations.forms;
  const waScore=CS.paused[a.id]?50:wa.status==='connected'?(wa.quality==='high'?100:wa.quality==='medium'?70:30)-(wa.webhookFail>5?30:0):wa.status==='not_connected'?40:15;
  const emScore=em.auth==='dkim_broken'?35:em.bounce>5?50:100;
  const silent=forms.filter(f=>f.subs7===0&&f.baseline>0);
  const subs=forms.reduce((s,f)=>s+f.subs7,0),base=forms.reduce((s,f)=>s+f.baseline,0);
  const committed=a.opps.filter(o=>COMMIT.includes(o.stage)).length;
  const raw=rules(a,{skipRenewal:true}).filter(r=>!['renewal_risk'].includes(r.rule));
  const p1=raw.filter(r=>r.sev==='P1').length,p2=raw.filter(r=>r.sev==='P2').length;
  const overdue=a.invoices.filter(i=>i.status==='open'&&i.dueDays<-14);
  const breaches=CS.queue.filter(q=>q.acct===a.id&&q.status!=='delivered'&&q.dueAt<Date.now()).length;
  const S=[
    ['adoption','Active reps',pct(activeReps.length,reps.length),`${activeReps.length} of ${reps.length} reps active this week`],
    ['adoption','Activity per rep',clamp(repActs/50*100),`${repActs} activities per rep per week`],
    ['adoption','Next action set',nextPct,`${nextPct}% of open opportunities have a next action`],
    ['adoption','Owner engagement',owner.lastLogin<=7?100:owner.lastLogin<=14?60:owner.lastLogin<=21?30:0,`Owner last logged in ${owner.lastLogin===0?'today':owner.lastLogin+'d ago'}`],
    ['data','Data Doctor',doc.score,`Data Doctor score ${doc.score}${doc.found.length?` (${doc.found.length} failing checks)`:''}`],
    ['data','Fresh pipeline',clamp(100-stale*1.5),`${stale}% of open opportunities untouched for 14+ days`],
    ['integration','WhatsApp',clamp(waScore),CS.paused[a.id]?'Outbound WhatsApp paused by Bricly':wa.status==='connected'?`WhatsApp quality ${wa.quality}${wa.webhookFail>5?', webhooks failing':''}`:`WhatsApp ${wa.status.replace('_',' ')}`],
    ['integration','Email',emScore,em.auth==='dkim_broken'?'Email DKIM broken':`Email bounce ${em.bounce}%`],
    ['integration','Lead forms',silent.length?20:100,silent.length?`${silent.length} lead form silent`:'Lead forms receiving submissions'],
    ['value','Lead flow',base?clamp(subs/base*100):60,`${subs} leads this week vs ~${base} usual`],
    ['value','Deal progression',clamp(pct(committed,a.opps.length)*2),`${committed} of ${a.opps.length} opportunities reserved or won`],
    ['relationship','Open issues',clamp(100-p1*35-p2*10),`${p1} P1 and ${p2} P2 alerts open`],
    ['relationship','Billing',overdue.length?40:100,overdue.length?`${overdue.length} invoice overdue`:'Invoices up to date'],
    ['relationship','Concierge SLA',breaches?50:100,breaches?`${breaches} concierge item overdue`:'Concierge work on time'],
  ].map(([pillar,label,score,text])=>({pillar,label,score,text}));
  const pillars=Object.entries(PILLARS).map(([k,[label,w]])=>{const s=S.filter(x=>x.pillar===k);return {k,label,w,score:Math.round(avg(s.map(x=>x.score))),signals:s};});
  let score=Math.round(pillars.reduce((s,p)=>s+p.score*p.w,0)/100);
  const drivers=S.filter(x=>x.score<80).map(x=>({...x,impact:(100-x.score)*PILLARS[x.pillar][1]/S.filter(y=>y.pillar===x.pillar).length})).sort((x,y)=>y.impact-x.impact).slice(0,3);
  if(p1&&score>74){score=74;drivers.unshift({pillar:'relationship',label:'P1 cap',score:0,text:`${p1} P1 alert open, so the score is capped at Amber`});drivers.length=Math.min(drivers.length,3);}
  const computed=score;let override=CS.overrides[a.id];
  if(override&&override.until<Date.now()){delete CS.overrides[a.id];override=null;}
  if(override)score=override.score;
  const hist=[...(HIST[a.id]||[]),computed];
  return {mode:'health',score,computed,color:color(score),pillars,drivers,override,hist,trend:hist.length>1?computed-hist[hist.length-2]:0};
}
const color=s=>s>=75?'Green':s>=50?'Amber':'Red';
function activation(a){
  const ob=a.onboarding,done=ob.steps.filter(s=>s.done).length;
  const stuck=ob.steps.find(s=>!s.done&&s.waitingDays>=5);
  return {mode:'activation',pct:pct(done,ob.steps.length),done,total:ob.steps.length,day:ob.startedDays,target:14,steps:ob.steps,stuck,color:stuck||ob.startedDays>14?'Amber':'Green'};
}
Object.assign(CS,{health,PILLARS,color});

// ---------- logs ----------
function timeline(acctId,kind,text,who,at){
  const a=acct(acctId);if(!a)return;
  (a.timeline=a.timeline||[]).push({at:at||Date.now(),kind,text,who:who||null});
  a.timeline.sort((x,y)=>y.at-x.at);
}
function audit(acctId,what){(CS.customerAudit[acctId]=CS.customerAudit[acctId]||[]).unshift({at:Date.now(),who:`Bricly support (${me().name})`,what});}
function log(entry){
  const e={id:uid('SA'),at:Date.now(),staff:CS.me,...entry};CS.staffLog.unshift(e);
  if(e.acct){timeline(e.acct,'staff',e.text,staffName(e.staff));if(e.customerVisible!==false)audit(e.acct,e.text);}
  return e;
}
Object.assign(CS,{timeline,audit,log});

// ---------- repair operations ----------
// Every repair is a named operation: preview → reason + ticket → (second approver if P1-class) → run → audit → undo.
const findUnit=(a,id)=>a.units.find(u=>u.id===id);
const OPS={
  resolve_unit_conflict:{label:'Resolve unit conflict',p1:true,
    plan(a,unitId){const os=commitOpps(a,unitId).slice().sort((x,y)=>(x.stage==='closed_won'?0:1)-(y.stage==='closed_won'?0:1));const keep=os[0],rest=os.slice(1);
      return {changes:[`Keep ${unitId} on ${keep.id} (${STAGE_LABEL[keep.stage]}, ${seatName(a,keep.rep)})`,...rest.map(o=>`Move ${o.id} back to Negotiating and remove ${unitId} from it`),`Notify ${rest.map(o=>seatName(a,o.rep)).join(', ')} and the account owner`],keep,rest};},
    apply(a,unitId,p){const before=p.rest.map(o=>({o:a.opps.find(x=>x.id===o.id),stage:o.stage,units:[...o.units]}));
      before.forEach(b=>{b.o.stage='negotiating';b.o.units=b.o.units.filter(u=>u!==unitId);});
      return ()=>before.forEach(b=>{b.o.stage=b.stage;b.o.units=b.units;});}},
  rerun_propagation:{label:'Re-run unit propagation',
    plan(a,devId){const ch=[];const sold=a.units.filter(u=>u.dev===devId&&u.status==='sold');
      sold.forEach(u=>shortlistOpps(a,u.id).forEach(o=>ch.push({kind:'unshort',o:o.id,u:u.id,text:`Remove sold ${u.id} from ${o.id}'s shortlist`})));
      a.opps.filter(o=>COMMIT.includes(o.stage)&&o.stage!=='closed_won').forEach(o=>o.units.forEach(id=>{const u=findUnit(a,id);if(u&&u.dev===devId&&u.status==='available')ch.push({kind:'reserve',u:u.id,text:`Set ${u.id} to Reserved to match ${o.id}`});}));
      a.jobs.filter(j=>j.state==='dead'&&j.kind==='Unit propagation'&&findUnit(a,j.target)?.dev===devId).forEach(j=>ch.push({kind:'job',j:j.id,text:`Close dead-lettered job ${j.id}`}));
      return {changes:ch.length?ch.map(c=>c.text):['Nothing to change'],items:ch};},
    apply(a,devId,p){const undo=[];p.items.forEach(c=>{
      if(c.kind==='unshort'){const o=a.opps.find(x=>x.id===c.o),prev=[...o.units];o.units=o.units.filter(u=>u!==c.u);undo.push(()=>o.units=prev);}
      if(c.kind==='reserve'){const u=findUnit(a,c.u);u.status='reserved';undo.push(()=>u.status='available');}
      if(c.kind==='job'){const j=a.jobs.find(x=>x.id===c.j);j.state='done';undo.push(()=>j.state='dead');}
    });return ()=>undo.reverse().forEach(f=>f());}},
  release_expired_hold:{label:'Release expired hold',
    plan:(a,id)=>({changes:[`Set ${id} from Hold to Available`,`Notify ${a.opps.filter(o=>o.units.includes(id)).map(o=>seatName(a,o.rep)).join(', ')||'the manager'}`]}),
    apply(a,id){const u=findUnit(a,id),prev={...u};u.status='available';delete u.holdDays;return ()=>Object.assign(u,prev);}},
  create_hold_approval:{label:'Create missing hold approval',
    plan:(a,id)=>({changes:[`Create an approval request for the hold on ${id}`,'Send it to the account\'s managers']}),
    apply(a,id){const u=findUnit(a,id),ap={id:uid('AP'),what:`Hold · ${id}`,ageDays:0};u.approval=true;a.approvalsPending.push(ap);return ()=>{u.approval=false;a.approvalsPending=a.approvalsPending.filter(x=>x!==ap);};}},
  reassign_orphans:{label:'Reassign orphaned opportunities',param:'rep',
    plan(a,_,p){const off=a.seats.filter(s=>!s.active).map(s=>s.id),os=a.opps.filter(o=>off.includes(o.rep));return {changes:os.map(o=>`Move ${o.id} from ${seatName(a,o.rep)} to ${seatName(a,p.rep)}`),os:os.map(o=>({id:o.id,rep:o.rep}))};},
    apply(a,_,p){p.os.forEach(x=>a.opps.find(o=>o.id===x.id).rep=p.rep);return ()=>p.os.forEach(x=>a.opps.find(o=>o.id===x.id).rep=x.rep);}},
  reassign_leads:{label:'Assign waiting leads',
    plan(a){const reps=a.seats.filter(s=>s.active&&s.role==='rep');return {changes:a.leadsUnassigned.map((l,i)=>`Assign ${l.id} to ${reps[i%reps.length].name} (round robin)`)};},
    apply(a){const prev=a.leadsUnassigned;a.leadsUnassigned=[];return ()=>a.leadsUnassigned=prev;}},
  merge_duplicates:{label:'Merge duplicate contacts',
    plan:a=>({changes:[`Merge ${a.dupContacts} duplicate pairs, keeping the most recently active record`,'Move activities and opportunities to the kept record']}),
    apply(a){const n=a.dupContacts;a.dupContacts=0;return ()=>a.dupContacts=n;}},
  contain_optout:{label:'Contain opted-out send',
    plan(a,id){const m=a.optOutSends.find(x=>x.id===id);return {changes:[`Pause the automation "${m.automation}"`,`Open a compliance incident for ${m.id} and notify the DPO`,'Draft the account-owner notice']};},
    apply(a,id){const m=a.optOutSends.find(x=>x.id===id);m.contained=true;const inc={id:uid('CI'),acct:a.id,what:`Message to opted-out contact (${m.id})`,at:Date.now(),status:'open'};(CS.complianceIncidents=CS.complianceIncidents||[]).unshift(inc);return ()=>{m.contained=false;CS.complianceIncidents=CS.complianceIncidents.filter(x=>x!==inc);};}},
  apply_settings_fix:{label:'Apply Settings fix',consent:true,
    plan:a=>({changes:a.drift.map(d=>`${d.what}: align Settings with what the CRM uses`)}),
    apply(a){const prev=a.drift;a.drift=[];return ()=>a.drift=prev;}},
  undo_import:{label:'Undo import batch past window',p1:true,
    plan(a,id){const i=a.imports.find(x=>x.id===id);return {changes:[`Delete the ${i.created} records ${i.id} created`,`Restore the previous values on the ${i.matched} records it matched`,'Keep the batch in Data activity marked Undone']};},
    apply(a,id){const i=a.imports.find(x=>x.id===id),prev=i.status;i.status='undone';return ()=>i.status=prev;}},
  retry_job:{label:'Retry job',
    plan(a,id){const j=a.jobs.find(x=>x.id===id),u=findUnit(a,j.target);const prop=u?OPS.rerun_propagation.plan(a,u.dev):null;return {changes:[`Re-run ${j.kind} for ${j.target}`,...(prop?prop.changes.filter(c=>!c.startsWith('Close')):[])],prop,dev:u?.dev};},
    apply(a,id,p){const j=a.jobs.find(x=>x.id===id);const undo=p.prop?OPS.rerun_propagation.apply(a,p.dev,p.prop):null;j.state='done';return ()=>{undo&&undo();j.state='dead';};}},
  replay_webhooks:{label:'Replay failed webhooks',
    plan:a=>({changes:[`Replay ${Math.round(a.integrations.wa.webhookFail*12)} failed WhatsApp deliveries from the last hour`]}),
    apply(a){const prev=a.integrations.wa.webhookFail;a.integrations.wa.webhookFail=0.5;return ()=>a.integrations.wa.webhookFail=prev;}},
  resync_calendar:{label:'Resync calendar',
    plan:(a,id)=>({changes:[`Ask ${seatName(a,id)} to reconnect Google Calendar, then backfill 30 days of events`]}),
    apply(a,id){const s=a.seats.find(x=>x.id===id);s.calendarOk=true;return ()=>s.calendarOk=false;}},
};
const canApprove=(req)=>can('ops.approve')&&req.requestedBy!==CS.me;
function runOp(opId,acctId,target,params,{reason,ticket,approver}){
  const a=acct(acctId),op=OPS[opId],p={...op.plan(a,target,params),...params};
  const undo=op.apply(a,target,p);
  const e=log({kind:'repair',acct:acctId,op:opId,target,text:`${op.label}${target&&target!==acctId?' · '+target:''}`,reason,ticket,approver,changes:p.changes,undo});
  evaluate();return e;
}
function requestOp(opId,acctId,target,params,reason,ticket){
  const r={id:uid('OPR'),op:opId,acct:acctId,target,params,reason,ticket,requestedBy:CS.me,at:Date.now(),status:'pending'};
  CS.pendingOps.unshift(r);log({kind:'approval',acct:acctId,text:`Requested approval: ${OPS[opId].label}${target&&target!==acctId?' · '+target:''}`,reason,ticket,customerVisible:false});
  return r;
}
function approveOp(id){
  const r=CS.pendingOps.find(x=>x.id===id);if(!r||!canApprove(r))return null;
  r.status='approved';r.approver=CS.me;
  const keep=CS.me;CS.me=r.requestedBy;const e=runOp(r.op,r.acct,r.target,r.params,{reason:r.reason,ticket:r.ticket,approver:keep});CS.me=keep;return e;
}
function rejectOp(id){const r=CS.pendingOps.find(x=>x.id===id);if(r&&canApprove(r)){r.status='rejected';r.approver=CS.me;log({kind:'approval',acct:r.acct,text:`Rejected: ${OPS[r.op].label}`,customerVisible:false});}}
function undoEntry(id){
  const e=CS.staffLog.find(x=>x.id===id);if(!e||!e.undo||e.undone)return;
  e.undo();e.undone=true;log({kind:'repair',acct:e.acct,text:`Undid: ${e.text}`,reason:`Undo of ${e.id}`});evaluate();
}
Object.assign(CS,{OPS,runOp,requestOp,approveOp,rejectOp,undoEntry,canApprove});

// ---------- support sessions ----------
const SESSION_MS=H;
const activeSession=acctId=>CS.sessions.find(s=>s.acct===acctId&&s.staff===CS.me&&!s.endedAt&&s.end>Date.now());
function openSession(acctId,asUser,level,reason){
  const a=acct(acctId),s={id:uid('SS'),acct:acctId,asUser,level,reason,staff:CS.me,start:Date.now(),end:Date.now()+SESSION_MS};
  CS.sessions.unshift(s);log({kind:'session',acct:acctId,text:`Opened ${level==='L2'?'act-as':'read-only'} support session as ${seatName(a,asUser)}`,reason});
  return s;
}
function endSession(id){const s=CS.sessions.find(x=>x.id===id);if(s&&!s.endedAt){s.endedAt=Date.now();log({kind:'session',acct:s.acct,text:`Ended support session as ${seatName(acct(s.acct),s.asUser)}`});}}
function requestSensitive(acctId,what,reason){
  const r={id:uid('SD'),acct:acctId,what,reason,requestedBy:CS.me,at:Date.now(),status:'pending'};CS.sensitive.unshift(r);
  log({kind:'sensitive',acct:acctId,text:`Requested sensitive data: ${what}`,reason,customerVisible:false});return r;
}
function decideSensitive(id,ok){
  const r=CS.sensitive.find(x=>x.id===id);if(!r||!can('sensitive.approve')||r.requestedBy===CS.me)return;
  r.status=ok?'approved':'rejected';r.approver=CS.me;
  log({kind:'sensitive',acct:r.acct,text:`${ok?'Approved':'Rejected'} sensitive data access for ${staffName(r.requestedBy)}: ${r.what}`,reason:r.reason});
}
const mask=s=>String(s).split(' ').map(w=>w[0]+'•'.repeat(Math.max(2,w.length-1))).join(' ');
const maskPhone=p=>p.slice(0,4)+' •••• ••'+p.slice(-2);
Object.assign(CS,{activeSession,openSession,endSession,requestSensitive,decideSensitive,mask,maskPhone,SESSION_MS});

// ---------- seed staff log ----------
const seedLog=[
  {days:3,staff:'anna',acct:'mercury',kind:'session',text:'Opened read-only support session as Chris Galea',reason:'Ticket #1182: approvals not showing'},
  {days:3,staff:'anna',acct:'mercury',kind:'session',text:'Ended support session as Chris Galea'},
  {days:5,staff:'luke',acct:'gozo',kind:'repair',text:'Re-run unit propagation · xaghra',reason:'Alert: sold unit still shortlisted',ticket:'#1170'},
  {days:6,staff:'paul',acct:'vella',kind:'commercial',text:'Set activation clearance for Verdala: Covered by terms',reason:'Contract §4.2 founding terms'},
];
seedLog.forEach(e=>{const x={id:uid('SA'),at:NOW-e.days*D,...e};CS.staffLog.push(x);timeline(e.acct,'staff',e.text,staffName(e.staff),x.at);});
CS.sessions.push({id:uid('SS'),acct:'mercury',asUser:'m3',level:'L1',reason:'Ticket #1182: approvals not showing',staff:'anna',start:NOW-3*D,end:NOW-3*D+H,endedAt:NOW-3*D+25*60e3});
CS.accounts.forEach(a=>{
  (CS.customerAudit[a.id]||[]).forEach(x=>{x.at=NOW-x.days*D;timeline(a.id,'customer',x.what,x.who,x.at);});
  a.imports.forEach(i=>timeline(a.id,'import',`${i.id}: ${i.type} import by ${i.by} (${i.rows} rows, ${i.status})`,null,NOW-i.days*D));
  a.notes.forEach(n=>timeline(a.id,'note',n.text,staffName(n.by),n.at));
  a.invoices.filter(i=>i.dueDays<=0).forEach(i=>timeline(a.id,'billing',`${i.id} ${i.label} ${eur(i.amt)} due · ${i.status}`,null,NOW+i.dueDays*D));
});
evaluate();
CS.alerts.filter(a=>a.sev==='P1').forEach(postSlack);
CS.slack.forEach((m,i)=>m.at=Date.now()-(i+1)*47*60e3);
CS.booted=true;
})();
