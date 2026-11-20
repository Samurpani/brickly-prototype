// Screen registry: every documented screen state has an id, a recipe that opens it from a fresh load, where it leads,
// and the actions whose effect on the records is captured for developers. Open any state with #screen=<id>.
// Used by docs/build/capture.cjs to generate the flow documentation from the prototype itself.
(function(){
const S={}, ORDER=[];
function reg(id,def){S[id]={id,...def};ORDER.push(id);}
const MARIA='OPP-1008', DANIEL='OPP-1004', VIEW='MT-1008-1', VIDEO='MT-1008-2';
function opp(id){openOpp(id);return OPPS.find(o=>o.id===id);}
function appt(oid,aid){const o=OPPS.find(v=>v.id===oid);miAppts(o);return miFind(o,aid);}
function scrollTo(sel){setTimeout(()=>document.querySelector(sel)?.scrollIntoView({block:'start'}),30);}
// A read meeting waiting for approval, from a recording or from Sam's summary.
function ready(aid,src,nv){const a=appt(MARIA,aid);a.status='ready';a.m.src=src;if(nv)a.m.nv=nv;a.m.tab='transcript';return a;}
function pickUnit(){const {o,a}=miCur(),p=miData(o,a).props.find(v=>v.id==='A7');if(p){a.m.pick=p.opts[0][0];miPickConfirm();}}
function approved(){ready(VIEW,'rec');miOpen(MARIA,VIEW,'trans');pickUnit();miApproveAll();}
function call(status){
  const o=opp(MARIA),x=getExt(o);miAppts(o,x);
  const a={id:'MT-CALL',kind:'call',label:'Call',date:'Thu 1 Oct',mon:'OCT',day:'1',start:'10:11',end:status==='live'?'':'10:22',where:'Bricly line · outbound',status,when:'Thu 1 Oct, 10:11 · Bricly line',
    m:{props:{},edits:{},mode:'phone',src:'rec',sec:status==='live'?401:668,step:1,pct:40,live:['Maria: the payment plan is the open point, 30% on signing is too much right now.','Maria asks whether 9702 can be kept until next Friday.']}};
  x.appts=[a,...x.appts];return a;
}
const F1='Flow 1 · Meeting to CRM updates', FQ='Flow 1 · Quick summary, no recording', FA='Flow 1 · Automatic capture', FT='Appointment page tabs', F2='Flow 2 · Inbound buyer message', F3='Flow 3 · Objections';

reg('1a0',{group:F1,design:'1a0',title:'Viewing booked',from:'A viewing is booked from Actions, Assist or the Calendar',next:['1a'],code:['miCardHtml','miSideHtml'],
  open(){const a=appt(MARIA,VIEW);a.status='booked';a.booked='Mon 28 Sep';opp(MARIA);scrollTo('#p-opp .mi-cards');},
  actions:[{label:'The viewing ends (end time passes)',run(){miSimEnd(VIEW);}}]});
reg('1a',{group:F1,design:'1a',title:'Needs outcome on the opportunity',from:'The appointment’s end time passes with no outcome',next:['1b','ns'],code:['miBannerHtml','miCardHtml','miSideHtml'],
  open(){opp(MARIA);}});
reg('1b',{group:F1,design:'1b',title:'Appointment · close it one of two ways',from:'Click the appointment card, the banner or the Appointments row on 1a',next:['1b2','1n','1n2','1n3','ns'],code:['miOpen','miRender','miChooseHtml','miRailHtml'],
  open(){miOpen(MARIA,VIEW);}});
reg('1b2',{group:F1,design:'1b2',title:'Upload recording · file or link',from:'Upload or paste a link on 1b',next:['1c'],code:['miUploadHtml','miLinkOk','miRun'],
  open(){miOpen(MARIA,VIEW,'upload');const {a}=miCur();a.m.file='viewing_Thu_1_Oct.m4a · 44:12 · 38 MB';a.m.consent=true;miRender();},
  actions:[{label:'Transcribe and read',run(){miRun('rec');}}]});
reg('1c',{group:F1,design:'1c',title:'Transcribing',from:'Transcribe and read on 1b2',next:['1d'],code:['miProcHtml','miTick'],
  open(){const a=appt(MARIA,VIEW);a.status='proc';a.m.src='rec';a.m.step=1;a.m.pct=62;miOpen(MARIA,VIEW);}});
reg('1d',{group:F1,design:'1d',title:'Proposals from the transcript',from:'Reading completes, or the “Proposals ready” notification',next:['1e','1f','1h'],code:['miData','miTransTab','miPropsPanel','miPropHtml','miApproveAll','miCommit'],
  open(){ready(VIEW,'rec');miOpen(MARIA,VIEW,'trans');},
  actions:[{label:'Pick the unit, then Approve all',run(){pickUnit();miApproveAll();}}]});
reg('1e',{group:F1,design:'1e',title:'Check the source and edit',from:'A timestamp or Edit on a proposal card in 1d',next:['1d'],code:['miPlay','miPropHtml','miEditSave'],
  open(){const a=ready(VIEW,'rec');a.m.props.A2='edit';a.m.hl='12:40';a.m.playing='12:40';miOpen(MARIA,VIEW,'trans');scrollTo('#mi-p-A2');},
  actions:[{label:'Save the edited budget',run(){document.getElementById('mi-ed-v').value='€375,000';miEditSave('A2');}}]});
reg('1f',{group:F1,design:'1f',title:'Which unit did they mean?',from:'Entity matching finds two candidate units (opens with 1d)',next:['1d'],code:['miPropHtml','miPickConfirm'],
  open(){const a=ready(VIEW,'rec');a.m.hl='38:02';miOpen(MARIA,VIEW,'trans');scrollTo('#mi-p-A7');},
  actions:[{label:'Pick the first unit and Confirm',run(){pickUnit();}}]});
reg('1g',{group:F1,design:'1g',title:'Unclear audio',from:'The transcript has unclear stretches (variant of 1d)',next:['1h'],code:['miData','miPropsPanel'],
  open(){const a=appt(MARIA,VIDEO);a.status='ready';a.m.src='rec';a.m.tab='transcript';miOpen(MARIA,VIDEO,'trans');}});
reg('1h',{group:F1,design:'1h',title:'Written to the opportunity',from:'Approve all on 1d, 1e or 1f',next:['1o','3a'],code:['miCommit','miBannerHtml','miFactsHtml'],
  open(){approved();}});
reg('ns',{group:F1,design:'—',title:'The meeting didn’t take place',from:'Didn’t happen on 1a or 1b',next:['1a'],code:['miNoShow','miNoShowSave'],
  open(){opp(MARIA);miNoShow(VIEW);},
  actions:[{label:'Save · didn’t show up, propose a rebook task',run(){miNoShowSave(VIEW);}}]});

reg('1n',{group:FQ,design:'1n',title:'Voice note in the app',from:'How did the meeting go? › Voice note on 1b',next:['1n4'],code:['miNoteHtml','miVoice','miVoiceText'],
  open(){miOpen(MARIA,VIEW,'note');const {a}=miCur();a.m.nv='voice';a.m.words=26;miRender();},
  actions:[{label:'Stop and read',run(){miRun('note');}}]});
reg('1n2',{group:FQ,design:'1n2',title:'Type a few lines',from:'How did the meeting go? › Type it on 1b',next:['1n4'],code:['miNoteHtml','miNoteLines','miNoteRef'],
  open(){miOpen(MARIA,VIEW,'note');miNoteStart('text');const {a}=miCur();a.m.noteText='Loved the terrace on 9702, bedrooms on 9703 tight.\nBudget 380 if the payment plan works.\n30% on signing too much.\nMove by Sep 2027.\nSend plan Monday. Keep 9702 till Friday.';miRender();},
  actions:[{label:'Read my notes',run(){miRun('note');}}]});
reg('1n3',{group:FQ,design:'1n3',title:'Summary arrives from WhatsApp',from:'Automatic · the rep messages the Bricly number after the meeting',next:['1n4','1h'],code:['miWaHtml','miWaArrive','miWaYes'],
  open(){miOpen(MARIA,VIEW);miWaArrive();},
  actions:[{label:'Reply yes on WhatsApp',run(){miWaYes();}}]});
reg('1n4',{group:FQ,design:'1n4',title:'Proposals from the summary',from:'Any of 1n, 1n2 or 1n3',next:['1h'],code:['miData','miPropsPanel'],
  open(){ready(VIEW,'note','voice');miOpen(MARIA,VIEW,'trans');},
  actions:[{label:'Approve all',run(){miApproveAll();}}]});

reg('brief',{group:FA,design:'—',title:'Upcoming video call · pre-meeting brief',from:'Click an Upcoming appointment',next:['1v'],code:['miBriefHtml','inBriefOpen'],
  open(){miOpen(MARIA,VIDEO);}});
reg('1v',{group:FA,design:'1v',title:'Video call recorded automatically',from:'A video call with a Bricly Meet link ends',next:['1g'],code:['miProcHtml','miSimEndHere'],
  open(){const a=appt(MARIA,VIDEO);a.status='proc';a.m.src='rec';a.m.step=1;a.m.pct=40;miOpen(MARIA,VIDEO);}});
reg('1p',{group:FA,design:'1p',title:'Phone call from the opportunity · live',from:'Call on the opportunity header, contact card or Actions',next:['1p2','cb'],code:['miCall','miPhoneHtml','miCallEnd'],
  open(){call('live');miOpen(MARIA,'MT-CALL');},
  actions:[{label:'End call',run(){miCallEnd();}}]});
reg('cb',{group:FA,design:'—',title:'Call bar while navigating away',from:'Leave the call page during a live call',next:['1p'],code:['miCallBar'],
  open(){call('live');openOpp(MARIA);miCallBar();}});
reg('1p2',{group:FA,design:'1p2',title:'Call ended · logged and read',from:'End call on 1p, or an inbound call to the Bricly line ends',next:['1d'],code:['miPhoneHtml','miCallEnd'],
  open(){call('proc');miOpen(MARIA,'MT-CALL');}});
reg('1s',{group:FA,design:'1s',title:'Settings · Calls and meetings',from:'Settings › Calls and meetings (owner and manager)',next:[],code:[],role:'owner',
  open(){go('settings');stGo('p:calls');}});

reg('t-ov',{group:FT,design:'1o',title:'Overview tab · held meeting',from:'Click a Held appointment',next:['t-tr','t-up','t-ob','t-fu','t-no','t-de'],code:['miOverviewHtml','miRailHtml','miActions'],
  open(){approved();miOpen(MARIA,VIEW,'overview');}});
reg('t-tr',{group:FT,design:'1d',title:'Transcript tab · held meeting',from:'Transcript tab, or any timestamp',next:['t-ov'],code:['miTransTab','miTransLeft'],
  open(){approved();miOpen(MARIA,VIEW,'transcript');}});
reg('t-up',{group:FT,design:'—',title:'Updates tab · what was written',from:'Updates tab',next:['t-ov'],code:['miUpdatesTab'],
  open(){approved();miOpen(MARIA,VIEW,'updates');}});
reg('t-ob',{group:FT,design:'—',title:'Objections tab',from:'Objections tab',next:['3a'],code:['miObjTab','miObjList'],
  open(){approved();miOpen(MARIA,VIEW,'objections');},
  actions:[{label:'Mark the first objection answered',run(){miObjToggle(miObjList(miCur().o,miCur().x,miCur().a)[0].i);}}]});
reg('t-fu',{group:FT,design:'—',title:'Follow-ups tab',from:'Follow-ups tab, or Actions › Send a follow-up',next:['t-ov'],code:['miFollowTab','miFuText','miFuSend','miTaskDone'],
  open(){approved();miOpen(MARIA,VIEW,'followups');},
  actions:[{label:'Send the follow-up on WhatsApp',run(){miFuSend();}}]});
reg('t-no',{group:FT,design:'—',title:'Notes tab',from:'Notes tab, or Actions › Add a note',next:['t-ov'],code:['miNotesTab','miNoteAdd'],
  open(){miOpen(MARIA,VIEW,'notes');},
  actions:[{label:'Add a note',run(){document.getElementById('mi-note-add').value='She will decide with her husband this weekend.';miNoteAdd();}}]});
reg('t-de',{group:FT,design:'—',title:'Details tab',from:'Details tab',next:['t-ov'],code:['miDetailsTab','miHist'],
  open(){approved();miOpen(MARIA,VIEW,'details');}});

reg('2a',{group:F2,design:'2a',title:'Message read',from:'An inbound WhatsApp with attachments lands on a matched contact',next:['2b','2c','2e'],code:['inMsgSeed','inMsgHtml','inMsgSend'],
  open(){opp(DANIEL);scrollTo('#in-msg');},
  actions:[{label:'Approve all and send',run(){inMsgSend();}}]});
reg('2b',{group:F2,design:'2b',title:'Question not in the records',from:'A question in the message has no answer in the records',next:['2e'],code:['inMsgGap','inMsgGapSave'],
  open(){opp(DANIEL);inMsgGap('add');scrollTo('#in-msg');},
  actions:[{label:'Save the answer as a fact',run(){document.getElementById('in-gap').value='Yes, the pool is finished before handover.';inMsgGapSave();}},{label:'Ask Operations instead',run(){inMsgGap('ask');}}]});
reg('2c',{group:F2,design:'2c',title:'Attachment it can’t identify',from:'An attachment doesn’t match a known document type',next:['2e'],code:['inMsgFolder','inMsgB3'],
  open(){opp(DANIEL);scrollTo('#in-msg .in-pc.need');},
  actions:[{label:'File it under Finance',run(){inMsgFolder('Finance');inMsgB3();}}]});
reg('2d',{group:F2,design:'2d',title:'Sender not on a contact',from:'Contacts › Unmatched messages, or the Contacts badge',next:['2a'],code:['miUnmRender','miUnmDo'],
  open(){go('unmatched');},
  actions:[{label:'Add the number to the matched contact',run(){miUnmDo();}}]});
reg('2e',{group:F2,design:'2e',title:'Approved and sent',from:'Approve all and send on 2a, 2b or 2c',next:[],code:['inMsgSend'],
  open(){opp(DANIEL);inMsgSend();scrollTo('#in-msg');}});

reg('3a',{group:F3,design:'3a',title:'Objections on the opportunity',from:'Objections approved in 1d or 2a',next:['3b','3c'],code:['inObjHtml','inObjToggle'],
  open(){approved();scrollTo('#opp-obj-card');}});
reg('3b',{group:F3,design:'3b',title:'Change the category',from:'⋯ on an objection row',next:['3a'],code:['inObjHtml','inObjCat'],
  open(){approved();inObjMenu=0;renderOpp();scrollTo('#opp-obj-card');},
  actions:[{label:'Move it to Price',run(){inObjCat(0,'Price');}}]});
reg('3c',{group:F3,design:'3c',title:'Objections per development',from:'Developments › Onyx Rise › Objections (manager)',next:['3d','3e'],code:['inDevObjHtml','inObjRows'],role:'manager',
  open(){curPersona='manager';openDev('onyx');dvSetTab('objections');}});
reg('3d',{group:F3,design:'3d',title:'Cluster detail',from:'A row on 3c',next:['3c'],code:['inQuotes'],role:'manager',
  open(){curPersona='manager';openDev('onyx');dvSetTab('objections');inQuotes(0,'Onyx Rise');}});
reg('3e',{group:F3,design:'3e',title:'Merge suggestion',from:'Review merge on the 3c banner',next:['3c'],code:['inMergeOpen','inMerge'],role:'manager',
  open(){curPersona='manager';openDev('onyx');dvSetTab('objections');inMergeOpen();},
  actions:[{label:'Merge',run(){inMerge();}}]});

// What developers need from an action: every record it changes. Kept to the fields a back end would persist.
function strip(h){return String(h||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();}
function snap(){
  if(typeof tqInit==='function') tqInit();
  const out={};
  [MARIA,DANIEL].forEach(id=>{const o=OPPS.find(v=>v.id===id),x=EXT[id]||{};
    out[id]={stage:o.stage,budget:o.budgetMax??o.budget,units:[...o.units],rep:o.rep,nextAction:x.next?.label||null,blocker:x.blocker||null,hold:x.hold?`${x.hold.unit} · ${x.hold.state}`:null,
      finance:x.buyer?.finance||null,moveInBy:x.buyer?.timing||null,objections:(x.objections||[]).map(v=>`${v.cat} · ${strip(v.q)} · ${v.open?'open':'answered'}`),
      appointments:(x.appts||[]).map(a=>`${a.label||a.kind} ${a.date||''} · ${a.status}`),facts:(x.miFacts||[]).map(r=>`${r[0]}: ${r[1]}`),
      documents:(x.docs||[]).filter(d=>d.file).map(d=>`${d.label} · ${d.status}`),activity:(x.comms||[]).map(c=>`${c.ch}${c.dir?'/'+c.dir:''}: ${strip(c.text)}`)};});
  out.approvalsQueue=APPROVALS.filter(r=>!r.decided).map(r=>`${r.type} · ${r.unit} · ${r.buyer}`);
  out.openTasks=(TQ||[]).filter(t=>t.status==='open').map(t=>t.title);
  out.unmatchedMessages=MI_UNM.map(m=>m.from);
  out.objectionClusters=IN_CLUSTERS.map(r=>`${r[0]} · ${r[1]} · ${r[3]} mentions`);
  return JSON.parse(JSON.stringify(out));
}
function diff(a,b,path=''){
  const out=[];
  if(Array.isArray(a)&&Array.isArray(b)){
    const added=b.filter(v=>!a.includes(v)),removed=a.filter(v=>!b.includes(v));
    added.forEach(v=>out.push({path,change:'added',value:v}));removed.forEach(v=>out.push({path,change:'removed',value:v}));return out;
  }
  if(a&&b&&typeof a==='object'&&typeof b==='object'){Object.keys({...a,...b}).forEach(k=>out.push(...diff(a[k],b[k],path?`${path}.${k}`:k)));return out;}
  if(JSON.stringify(a)!==JSON.stringify(b)) out.push({path,change:'changed',from:a??null,to:b??null});
  return out;
}
window.BRICLY_SCREENS={screens:S,order:ORDER,snap,diff,
  open(id){const s=S[id];if(!s)return false;if(s.role)curPersona=s.role;s.open();return true;},
  async act(id,i){const s=S[id],before=snap();s.actions[i].run();await new Promise(r=>setTimeout(r,120));return diff(before,snap());}};
function fromHash(){const m=location.hash.match(/^#screen=([\w.-]+)/);if(m&&S[m[1]])setTimeout(()=>window.BRICLY_SCREENS.open(m[1]),60);}
window.addEventListener('load',fromHash);window.addEventListener('hashchange',fromHash);
})();
