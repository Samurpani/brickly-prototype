// Management visibility (Bricly OS · EP-8 v3, 4 Nov): developer dashboard, manager dashboard, Reports (six tabs),
// rep report, Settings › Targets and the weekly roll-up. Supersedes the 21 Oct Performance board.
// Rules: status is always against a target someone entered · recorded activity only · missing shows as missing, never 0 ·
// every number opens the records it counts · describe, don't judge · meeting transcripts and notes never feed rep metrics.

// ---------- Records: project totals per development (the prototype lists a sample of each project's units) ----------
const MV_NOW='Wed 4 Nov', MV_MONTHS=['Jun','Jul','Aug','Sep','Oct','Nov'];
const MV_DEVS=[
  {id:'dolphin',name:'Dolphin Court',total:48,sold:34,res:2,held:3,avg:418,vel:2.1,
    hist:[[4,1],[5,2],[3,1],[4,2],[5,1],[1,1]],due:620,over:38,next:'Riviera handover payments · 12 Nov'},
  {id:'mercury',name:'Mercury',total:60,sold:41,res:2,held:1,avg:395,vel:1.6,
    hist:[[3,2],[4,1],[3,2],[4,1],[3,2],[1,0]],due:410,over:0,next:'Shell-stage payments · 20 Nov'},
  {id:'verdala',name:'Verdala',total:36,sold:14,res:3,held:2,avg:356,vel:0.9,
    hist:[[2,1],[1,1],[2,0],[1,1],[2,1],[0,1]],due:180,over:22,next:'POS deposits · 9 Nov'},
  {id:'onyx',name:'Onyx Rise',total:30,sold:11,res:1,held:2,avg:372,vel:0.8,
    hist:[[1,1],[2,0],[1,1],[1,0],[2,1],[1,0]],due:95,over:0,next:'Reservation deposits · 15 Nov'},
  {id:'lalex',name:'La Lex',total:24,sold:19,res:1,held:0,avg:362,vel:0.5,
    hist:[[1,0],[1,1],[0,1],[1,0],[1,0],[0,0]],due:140,over:0,next:'Final deeds · 27 Nov'},
];
const MV_TYPES={dolphin:[['1 bed',14],['2 bed',22],['3 bed',9],['Penthouse',3]],mercury:[['1 bed',18],['2 bed',26],['3 bed',14],['Penthouse',2]],verdala:[['2 bed',20],['3 bed',12],['Penthouse',4]],onyx:[['1 bed',8],['2 bed',14],['3 bed',6],['Penthouse',2]],lalex:[['1 bed',6],['2 bed',12],['3 bed',6]]};
const MV_AGENCIES=[['Abela Estates','Christine Abela',3.0,5,1980,58],['Harbour Homes','Mark Spiteri',2.5,6,2310,64],['Island Property Co','Joanna Vella',3.0,3,1150,71]];
// Rep metrics recorded in the period. act: actions/week · ft: median first touch (min) · ftIn: % within target ·
// conv: Lead→Interested, Interested→Committed, Committed→Contracted (%) · tis: days in Lead, Interested, Committed ·
// held/noshow/fu: appointment events only (EP-7) · rev/gen: €k · comm: €k commission earned.
const MV_REPS=[
  {id:'sam',name:'Sam',first:'Sam',devs:['Verdala','Onyx Rise'],act:142,ft:9,ftIn:88,conv:[44,27,71],tis:[2,18,12],closes:3,direct:2,agent:1,rev:1085,gen:2400,comm:10.9,held:11,noshow:1,fu:10,msgs:96,calls:21,
    prev:{act:128,ft:11,ftIn:82,conv:[40,24,70],tis:[3,21,12],closes:2,rev:720,gen:1900,comm:7.2}},
  {id:'maria',name:'Maria Farrugia',first:'Maria',devs:['Dolphin Court','Mercury'],act:118,ft:14,ftIn:79,conv:[41,17,74],tis:[3,31,10],closes:2,direct:1,agent:1,rev:790,gen:1650,comm:7.9,held:9,noshow:3,fu:6,msgs:81,calls:17,
    prev:{act:121,ft:12,ftIn:84,conv:[42,23,73],tis:[3,24,11],closes:3,rev:1150,gen:1700,comm:11.5}},
  {id:'matthew',name:'Matthew Vella',first:'Matthew',devs:['Mercury','La Lex'],act:131,ft:7,ftIn:93,conv:[46,29,78],tis:[2,17,9],closes:3,direct:3,agent:0,rev:1210,gen:1980,comm:12.1,held:12,noshow:0,fu:12,msgs:88,calls:25,
    prev:{act:126,ft:8,ftIn:90,conv:[44,27,75],tis:[2,18,10],closes:3,rev:1080,gen:1820,comm:10.8}},
  {id:'sarah',name:'Sarah Azzopardi',first:'Sarah',devs:['Onyx Rise'],act:84,ft:22,ftIn:61,conv:[35,22,67],tis:[4,23,15],closes:1,direct:1,agent:0,rev:372,gen:940,comm:3.7,held:6,noshow:2,fu:4,msgs:58,calls:11,
    prev:{act:70,ft:26,ftIn:55,conv:[33,20,66],tis:[5,25,16],closes:0,rev:0,gen:610,comm:0}},
  {id:'karl',name:'Karl Zammit',first:'Karl',devs:['Verdala','Dolphin Court'],act:109,ft:12,ftIn:84,conv:[39,25,70],tis:[3,20,13],closes:2,direct:1,agent:1,rev:774,gen:1420,comm:7.7,held:8,noshow:1,fu:8,msgs:74,calls:19,
    prev:{act:111,ft:13,ftIn:83,conv:[39,26,69],tis:[3,19,13],closes:2,rev:760,gen:1380,comm:7.6}},
];
const MV_STAGES=['Lead','Interested','Committed','Contracted'];
const MV_LOST=[['Price','Payment plan','Finance not approved','Completion timing','Chose another development','No reply'],[9,7,5,4,4,6]];

// ---------- Targets (Settings › Targets). Stored monthly; an empty field is null, never 0 ----------
const MV_T0=()=>({
  sales:{value:6000,units:16,byDev:{dolphin:2400,mercury:1800,verdala:900,onyx:600,lalex:300}},
  team:{act:120,ft:15,ftPct:80,conv:[40,25,70],tis:[3,21,14],stall:14,direct:70},
  reps:{sam:{sales:1300,comm:13},maria:{sales:1300,comm:13},matthew:{sales:1300,comm:13},sarah:{sales:700,comm:7,ovr:{act:90,ft:20},note:'Ramp · joined September'},karl:{sales:1100,comm:11}},
  devs:{dolphin:{vel:1.8,thr:{kind:'units',n:30,bank:'BOV',date:'30 Sep 2026',hit:'12 Sep'}},mercury:{vel:1.5,thr:{kind:'units',n:36,bank:'HSBC',date:'31 Aug 2026',hit:'3 Aug'}},
    verdala:{vel:1.4,thr:{kind:'value',n:6000,bank:'HSBC',date:'31 Mar 2027'}},onyx:{vel:0.8,thr:{kind:'units',n:15,bank:'APS',date:'30 Jun 2027'}},lalex:{vel:0.6,thr:{kind:'units',n:14,bank:'BOV',date:'31 May 2026',hit:'18 Apr'}}},
  audit:{'team.ft':'Changed from 20 min on Thu 1 Oct by Rachel Mifsud','sales.value':'Changed from €5,500k on Thu 1 Oct by Mark Galea','reps.sarah':'Override added on Mon 14 Sep by Rachel Mifsud'},
});
const MV_EMPTY=()=>({sales:{value:null,units:null,byDev:{}},team:{act:null,ft:null,ftPct:null,conv:[null,null,null],tis:[null,null,null],stall:null,direct:null},reps:{},devs:{},audit:{}});
let MV_T=MV_T0();
let MV={fresh:false,dev:'dolphin',view:'dev',period:'month',tab:'revenue',route:'tabs',rep:'maria',week:44,repPeriod:'7d',teamMetric:'act',lbBy:'rev',menu:null,loading:false,edit:null,updated:null,live:[],brief:'all',rangeR:'6m'};

// ---------- Helpers ----------
function mvRole(){return typeof curPersona==='undefined'?'owner':curPersona;}
function mvMgrish(){return ['owner','manager'].includes(mvRole());}
function mvEditor(){return mvMgrish();}
function mvDevEditor(){return mvRole()==='owner';}
function mvK(n){return n==null?'—':n>=1000?'€'+(n/1000).toFixed(n%1000===0?0:2).replace(/\.?0+$/,'')+'M':'€'+Math.round(n)+'k';}
function mvPct(a,b){return b?Math.round(a/b*100):0;}
function mvHm(){const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function mvDev(id){return MV_DEVS.find(d=>d.id===id);}
function mvRepT(r,k){const o=(MV_T.reps[r.id]||{}).ovr||{};return o[k]!=null?o[k]:MV_T.team[k];}
// Status against a target: on, within 10%, behind. lower=true when smaller is better.
function mvStatus(v,t,lower){if(t==null||v==null)return null;const ok=lower?v<=t:v>=t;if(ok)return 'on';const gap=lower?(v-t)/t:(t-v)/t;return gap<=0.1?'near':'behind';}
function mvDot(st){return st?`<span class="mv-dot ${st}" title="${{on:'On target',near:'Within 10% of target',behind:'Behind target'}[st]}"></span>`:'';}
function mvAddT(card){return mvEditor()?`<button type="button" class="mv-addt" onclick="mvTargetsGo('${card}')">Add a target</button>`:'<span class="in-mu">No target set</span>';}
function mvNoData(t){return `<div class="mv-nodata"><b>No data yet</b><span>${t}</span></div>`;}
function mvNum(v,label,rec,cls){return `<button type="button" class="mv-n ${cls||''}" onclick="mvRecords('${rec}')" title="Open the records behind this">${v}</button>`;}
// Bars and the dashed target line share one plot area, so the line sits at the target's real height.
function mvBarChart(items,target,tall){const mx=Math.max(...items.map(x=>x.v),target||0,1);
  return `<div class="mv-chart ${tall?'tall':''}"><div class="mv-plot">${items.map(x=>`<button type="button" class="mv-col" onclick="${x.fn}" title="${x.m}: ${mvK(x.v)}"><i style="height:${x.v/mx*100}%"></i></button>`).join('')}${target!=null?`<div class="mv-tline" style="bottom:${target/mx*100}%"><span>Target ${mvK(target)}</span></div>`:''}</div><div class="mv-xl">${items.map(x=>`<span>${x.m}</span>`).join('')}</div></div>`;}
function mvStackChart(items,keys,tall){const mx=Math.max(...items.map(x=>keys.reduce((a,[k])=>a+x[k],0)),1);
  return `<div class="mv-chart ${tall?'tall':''}"><div class="mv-plot">${items.map(x=>`<div class="mv-col stack" title="${x.m}">${keys.map(([k,c])=>`<i class="${c}" style="height:${x[k]/mx*100}%"></i>`).join('')}</div>`).join('')}</div><div class="mv-xl">${items.map(x=>`<span>${x.m}</span>`).join('')}</div></div>`;}
function mvSkel(n){return `<div class="mv-skel">${Array.from({length:n||3},()=>'<span></span>').join('')}</div>`;}
function mvBlock(title,sub,body,opts={}){return `<section class="dcard mv-b ${opts.cls||''}" ${opts.id?`id="${opts.id}"`:''}><div class="mv-bh"><div><h3>${title}</h3>${sub?`<div class="in-mu">${sub}</div>`:''}</div>${opts.right||''}</div>${MV.loading?mvSkel(opts.sk):body}</section>`;}
function mvSeg(opts,cur,fn){return `<div class="seg">${opts.map(([k,l])=>`<button type="button" class="${cur===k?'on':''}" onclick="${fn}('${k}')">${l}</button>`).join('')}</div>`;}
function mvChannelFor(o){
  const df=typeof dfState==='function'?dfState(o):null, ext=df&&df.comm&&(df.comm.shares||[]).find(s=>s.kind==='external');
  return ext?{via:'agent',agency:ext.company||ext.name,rate:ext.pct}:{via:'direct'};
}
// Live records the dashboards count directly, so every count matches the list it opens.
function mvOpenOpps(){return OPPS.filter(o=>!['Closed Won','Lost','Nurture'].includes(o.stage)&&!dealFor(o.id));}
function mvStalled(rep){return mvOpenOpps().filter(o=>dbAgoDays(o.ago)>=(MV_T.team.stall||14)&&dbAgoDays(o.ago)<9999&&(!rep||o.rep===rep.first));}
function mvWaiting(){return OPPS.filter(o=>o.stage==='New Lead'&&(o.unassigned||['Unassigned','Pending',''].includes(o.rep)));}
function mvStage(o){return typeof tlIdx==='function'?tlIdx(o,getExt(o)):0;}
function mvSum(a,f){return a.reduce((s,x)=>s+f(x),0);}
function mvSoldMonth(d,i){return d.hist[i][0]+d.hist[i][1];}
function mvMonthIdx(){return MV.period==='month'?[5]:MV.period==='quarter'?[3,4,5]:[0,1,2,3,4,5];}
// Targets are monthly; the current month is compared with the share due by today (4 of 30 days).
function mvPace(){return {month:4/30,quarter:64/90,ytd:154/180}[MV.period];}
function mvTgtLine(val,tgt){if(tgt==null)return {st:null,txt:''};const due=tgt*mvPace(),st=mvStatus(val,due);return {st,txt:`${mvPct(val,tgt)}% of ${mvK(tgt)} · ${st==='on'?'ahead of':st==='near'?'just behind':'behind'} pace for ${MV_NOW}`};}
function mvPeriodLabel(){return {month:'November to date',quarter:'Last 3 months',ytd:'June to date'}[MV.period];}
// ---------- Records drawer: every number opens the list it counts ----------
const MV_BUYERS=['Anna Spiteri','Luca Camilleri','Nicole Galea','Joseph Grech','Rebecca Farrugia','Mark Debono','Clara Vella','Paul Micallef','Kurt Borg','Elena Zahra','Jake Attard','Ruth Cassar','Ian Mallia','Sofia Pace','Neil Bonello','Tara Abela'];
const MV_PREFIX={dolphin:'DC',mercury:'#CM2',verdala:'VD',onyx:'#CM97',lalex:'#CM98'};
function mvGenUnits(d,status,n){const types=MV_TYPES[d.id];return Array.from({length:n},(_,i)=>{const t=types[(i*3+status.length)%types.length][0],fl=2+(i*5+status.length)%9;return {id:`${MV_PREFIX[d.id]}${fl}${String(i+1).padStart(2,'0')}`.replace('#CM2','#CM2').replace(/^DC/,'DC-').replace(/^VD/,'VD-'),type:t,floor:fl,price:Math.round(d.avg*(0.85+((i*7)%30)/100))};});}
function mvGenSales(devs,idx){
  const out=[];let k=0;
  devs.forEach(d=>idx.forEach(i=>{const [dir,ag]=d.hist[i];for(let j=0;j<dir+ag;j++){const r=MV_REPS[(k+d.id.length)%MV_REPS.length],a=MV_AGENCIES[k%MV_AGENCIES.length];
    out.push({unit:mvGenUnits(d,'sold',dir+ag)[j].id,dev:d.name,buyer:MV_BUYERS[k%MV_BUYERS.length],month:MV_MONTHS[i],value:Math.round(d.avg*(0.9+(k%5)/20)),rep:r.name,ch:j<dir?'Direct':'Via '+a[0]});k++;}}));
  return out;
}
function mvRecords(key){
  const [kind,a,b]=key.split(':'), D=a&&mvDev(a), row=(cells,fn)=>`<div class="mv-rr" ${fn?`role="button" tabindex="0" onclick="${fn}"`:''}>${cells.map(c=>`<span>${c}</span>`).join('')}</div>`;
  let title='', sub='', rows=[];
  if(kind==='stalled'||kind==='waiting'||kind==='pipe'||kind==='open'){
    const rep=kind==='stalled'&&a?MV_REPS.find(r=>r.id===a):null, dv=b&&b!=='all'?mvDev(b):null;
    let l=kind==='stalled'?mvStalled(rep):kind==='waiting'?mvWaiting():kind==='pipe'?mvOpenOpps().filter(o=>mvStage(o)===+a):mvOpenOpps().filter(o=>o.rep===(MV_REPS.find(r=>r.id===a)||{}).first);
    if(dv) l=l.filter(o=>o.devs.includes(dv.name));
    title=kind==='stalled'?`${l.length} stalled deal${l.length===1?'':'s'}${rep?' · '+rep.name:''}${dv?' · '+dv.name:''}`:kind==='waiting'?`${l.length} waiting lead${l.length===1?'':'s'}`:kind==='pipe'?`${l.length} at ${MV_STAGES[+a]}${dv?' · '+dv.name:''}`:`${l.length} open deals · ${(MV_REPS.find(r=>r.id===a)||{}).name}`;
    sub=kind==='stalled'?`No recorded activity for ${MV_T.team.stall||14} days or more`:kind==='waiting'?'New leads with no owner yet':'Opportunities';
    rows=l.map(o=>row([`<b>${xesc(o.lead)}</b>`,xesc(o.devs[0]||''),xesc(o.stage),xesc(o.rep),`${xesc(o.ago)}`],`qaDrawerClose();openOpp('${o.id}')`));
  } else if(kind==='units'){
    const n={available:D.total-D.sold-D.res-D.held,hold:D.held,reserved:D.res,sold:D.sold}[b];
    title=`${n} ${b==='hold'?'held':b} unit${n===1?'':'s'} · ${D.name}`;sub='Units';
    rows=mvGenUnits(D,b,n).map(u=>row([`<b>${u.id}</b>`,u.type,`Floor ${u.floor}`,mvK(u.price),{available:'Available',hold:'On hold',reserved:'Reserved',sold:'Sold'}[b]]));
  } else if(kind==='sales'){
    const devs=a&&a!=='all'?[D]:MV_DEVS, idx=b?[MV_MONTHS.indexOf(b)]:mvMonthIdx();
    let l=mvGenSales(devs,idx); if(key.endsWith(':direct')) l=l.filter(s=>s.ch==='Direct'); if(key.endsWith(':agent')) l=l.filter(s=>s.ch!=='Direct');
    title=`${l.length} sale${l.length===1?'':'s'} · POS signed${b&&MV_MONTHS.includes(b)?' in '+b:' · '+mvPeriodLabel()}`;sub='Deals';
    rows=l.map(s=>row([`<b>${s.unit}</b>`,xesc(s.buyer),xesc(s.dev),mvK(s.value),xesc(s.ch),xesc(s.rep)]));
  } else if(kind==='rep'){mvRepOpen(a);return;}
  else if(kind==='appr'){go('approvals');return;}
  qaDrawerOpen(title,`<div class="in-mu" style="margin-bottom:10px">${sub} · the list this number counts</div><div class="mv-rl">${rows.join('')||'<div class="in-mu">Nothing here.</div>'}</div>`,
    `<button class="btn-ghost" onclick="mvCsv('${key}')">Export CSV</button><button class="btn-primary" onclick="qaDrawerClose()">Done</button>`);
}
function mvCsv(name){
  const rows=[...document.querySelectorAll('#qaDrawer .mv-rr, #rp-root .mv-t tr')].map(r=>[...r.children].map(c=>`"${c.textContent.trim().replace(/"/g,'""')}"`).join(','));
  const blob=new Blob([rows.join('\n')],{type:'text/csv'}), a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`bricly-${String(name).replace(/[^a-z0-9]+/gi,'-')}.csv`;a.click();
  showToast(`Exported ${rows.length} rows to CSV`);
}

// ---------- Dashboard routing: owner = developer dashboard (or team view), manager = manager dashboard, reps keep theirs ----------
const mvBaseRenderDash=window.renderDash;
function mvDashRoot(){
  let r=document.getElementById('mv-dash'); const sec=document.getElementById('p-dashboard');
  if(!r&&sec){r=document.createElement('div');r.id='mv-dash';r.className='wrap mv-wrap';sec.prepend(r);}
  return r;
}
window.renderDash=function(){
  const r=mvDashRoot(), base=document.querySelector('#p-dashboard .db-wrap');
  if(!mvMgrish()){if(r)r.hidden=true;if(base)base.hidden=false;mvBaseRenderDash();return;}
  if(base)base.hidden=true; r.hidden=false;
  if(MV.updated==null){MV.updated=mvHm();MV.loading=true;setTimeout(()=>{MV.loading=false;renderDash();},450);}
  r.innerHTML=mvRole()==='manager'||MV.view==='team'?mvMgrDash():MV.dev==='all'?mvAllDash():mvDevDash();
};
function mvSetView(v){MV.view=v;renderDash();}
function mvSetPeriod(p){MV.period=p;MV.loading=true;renderDash();setTimeout(()=>{MV.loading=false;renderDash();},400);}
function mvPickDev(id){MV.menu=null;MV.dev=id;MV.loading=true;renderDash();setTimeout(()=>{MV.loading=false;renderDash();},350);}
function mvFresh(on){MV.fresh=on;MV_T=on?MV_EMPTY():MV_T0();renderDash();showToast(on?'Showing a new workspace: no targets and no records yet':'Back to the live workspace');}
function mvFirstRun(){
  const t=MV_T, missing=t.sales.value==null||t.team.act==null;
  return missing?`<div class="mi-ban t-warn mv-first"><span><b>Set your targets to see where you stand.</b> Values show as they’re recorded. Until a sales target and at least one team target are saved, blocks say “Add a target”.</span>${mvEditor()?`<button type="button" class="mi-ban-a" onclick="mvTargetsGo()">Set targets</button>`:''}</div>`:'';
}
function mvHead(title,sub,right){return `<div class="crm-page-heading mv-head"><div><div class="page-title">${title}</div><div class="page-sub">${sub}</div></div></div><div class="crm-page-controls">${right}</div>`;}
function mvDemoLink(){return `<button type="button" class="mi-demo" onclick="mvFresh(${!MV.fresh})">Demo · ${MV.fresh?'back to live workspace':'new workspace'}</button>`;}
function mvSwitcher(){
  const cur=MV.dev==='all'?'All developments':mvDev(MV.dev).name;
  return `<span class="mv-sw"><button type="button" class="mv-swb" aria-haspopup="menu" aria-expanded="${MV.menu==='dev'}" onclick="event.stopPropagation();MV.menu=MV.menu==='dev'?null:'dev';renderDash()">${cur} <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4.5L6 7.5 9 4.5"/></svg></button>
    ${MV.menu==='dev'?`<span class="mv-menu" role="menu"><button type="button" role="menuitem" class="${MV.dev==='all'?'on':''}" onclick="mvPickDev('all')">All developments</button><span class="mv-mdiv"></span>${MV_DEVS.map(d=>`<button type="button" role="menuitem" class="${MV.dev===d.id?'on':''}" onclick="mvPickDev('${d.id}')">${d.name}<span class="in-mu">${mvPct(d.sold,d.total)}% sold</span></button>`).join('')}</span>`:''}</span>`;
}
document.addEventListener('click',e=>{if(MV.menu&&!e.target.closest('.mv-sw')){MV.menu=null;if(document.getElementById('p-dashboard')?.classList.contains('on'))renderDash();else if(document.getElementById('p-reports')?.classList.contains('on'))rpRender();}});
function mvControls(){
  return `${mvSeg([['month','This month'],['quarter','3 months'],['ytd','Year to date']],MV.period,'mvSetPeriod')}<div class="toolbar">${mvDemoLink()}${mvRole()==='owner'?mvSeg([['dev','Developer'],['team','Team']],MV.view,'mvSetView'):''}<button type="button" class="btn-ghost" onclick="mvBrief()">Pipeline brief</button></div>`;
}

// ---------- 1a · Developer dashboard, single development ----------
function mvThr(d){
  const t=(MV_T.devs[d.id]||{}).thr; if(!t||t.n==null) return {html:mvAddT('devs'),st:null};
  const have=t.kind==='units'?d.sold:d.sold*d.avg, need=t.kind==='units'?t.n:t.n, st=have>=need?'on':have>=need*0.9?'near':'behind';
  return {st,html:`${t.kind==='units'?`${d.sold} of ${t.n} units`:`${mvK(have)} of ${mvK(t.n)}`} · ${t.bank} ${have>=need?`reached ${t.hit||'this month'}`:`by ${t.date}`}`};
}
function mvDevDash(){
  const d=mvDev(MV.dev), t=MV_T, dt=t.devs[d.id]||{}, idx=mvMonthIdx(), fresh=MV.fresh;
  const sold=mvSum(idx,i=>mvSoldMonth(d,i)), val=sold*d.avg, tgt=t.sales.byDev[d.id]!=null?t.sales.byDev[d.id]*idx.length:null;
  const thr=mvThr(d), velSt=mvStatus(d.vel,dt.vel);
  const cell=(k,v,s,st)=>`<div class="now-cell"><div class="k">${k}</div><div class="v">${mvDot(st)}${v}</div><div class="d">${s}</div></div>`;
  const head=`<div class="dcard mv-now"><div class="now-strip">
      ${cell('Sold',fresh?'—':mvNum(`${mvPct(d.sold,d.total)}%`,'',`units:${d.id}:sold`),fresh?'No sales recorded yet':`${d.sold} of ${d.total} units`)}
      ${cell('Sales velocity',fresh?'—':`${d.vel} / week`,dt.vel!=null?`Plan ${dt.vel} / week`:mvAddT('devs'),fresh?null:velSt)}
      ${cell('Financing threshold',fresh?'—':thr.html.split(' · ')[0],fresh?'No sales recorded yet':thr.html.split(' · ').slice(1).join(' · '),fresh?null:thr.st)}
      ${cell('Closed sales vs target',fresh?'—':mvNum(mvK(val),'',`sales:${d.id}`),tgt!=null?mvTgtLine(val,tgt).txt:mvAddT('sales'),fresh||tgt==null?null:mvTgtLine(val,tgt).st)}
    </div></div>`;
  const bars=MV_MONTHS.map((m,i)=>({m:m+(i===5?' (to date)':''),v:mvSoldMonth(d,i)*d.avg,fn:`mvRecords('sales:${d.id}:${m}')`}));
  const salesB=fresh?mvNoData('Closed sales appear when a POS is signed on a deal.'):mvBarChart(bars,t.sales.byDev[d.id])+(t.sales.byDev[d.id]==null?`<div class="mv-foot">${mvAddT('sales')}</div>`:'');
  const dir=mvSum(idx,i=>d.hist[i][0]), ag=mvSum(idx,i=>d.hist[i][1]), share=mvPct(dir,dir+ag), fee=Math.round(ag*d.avg*0.029);
  const chB=fresh?mvNoData('Each deal records its channel from the commission split at POS.'):`<div class="mv-split"><button type="button" class="mv-seg1" style="flex:${dir||0.0001}" onclick="mvRecords('sales:${d.id}::direct')">Direct · ${dir}</button><button type="button" class="mv-seg2" style="flex:${ag||0.0001}" onclick="mvRecords('sales:${d.id}::agent')">Agents · ${ag}</button></div>
    <div class="mv-kv"><span>Direct share</span><b>${mvDot(mvStatus(share,t.team.direct))}${share}%</b><span class="in-mu">${t.team.direct!=null?`target ${t.team.direct}%`:mvAddT('team')}</span></div>
    <div class="mv-kv"><span>Agent fees</span><b>${mvK(fee)}</b><span class="in-mu">${ag} sale${ag===1?'':'s'} via agents</span></div>`;
  const reps=MV_REPS.filter(r=>r.devs.includes(d.name));
  const repB=fresh?mvNoData('Activity records itself as reps message, call and move deals.'):`<table class="mv-t"><thead><tr><th>Rep</th><th class="r">Activity / wk</th><th class="r">Appointments held</th><th class="r">Sales generated</th><th class="r">Closes</th></tr></thead><tbody>${reps.map(r=>`<tr role="button" tabindex="0" onclick="mvRepOpen('${r.id}')"><td><b>${r.name}</b></td><td class="r">${mvDot(mvStatus(r.act,mvRepT(r,'act')))}${r.act}</td><td class="r">${r.held}</td><td class="r">${mvK(r.gen)}</td><td class="r">${r.closes}</td></tr>`).join('')}</tbody></table>`;
  const av=d.total-d.sold-d.res-d.held;
  const invB=fresh?mvNoData('Units appear when the price list is imported.'):`<div class="mv-split">${[['sold',d.sold,'Sold'],['reserved',d.res,'Reserved'],['hold',d.held,'Held'],['available',av,'Available']].map(([k,n,l])=>`<button type="button" class="mv-inv ${k}" style="flex:${n||0.0001}" onclick="mvRecords('units:${d.id}:${k}')" title="${l} ${n}">${n}</button>`).join('')}</div>
    <div class="mv-legend">${[['sold','Sold'],['reserved','Reserved'],['hold','Held'],['available','Available']].map(([k,l])=>`<span><i class="mv-inv ${k}"></i>${l}</span>`).join('')}</div>`;
  const opps=mvOpenOpps().filter(o=>o.devs.includes(d.name)), st=mvStalled().filter(o=>o.devs.includes(d.name));
  const pipeB=fresh?mvNoData('Opportunities appear as leads arrive.'):`<div class="mv-stages">${MV_STAGES.slice(0,3).map((s,i)=>{const n=opps.filter(o=>mvStage(o)===i).length;return `<button type="button" class="mv-stage" onclick="mvRecords('pipe:${i}:${d.id}')"><b>${n}</b><span>${s}</span></button>`;}).join('')}<button type="button" class="mv-stage" onclick="mvRecords('sales:${d.id}')"><b>${sold}</b><span>Contracted</span></button></div>
    <div class="mv-kv"><span>Stalled</span><b>${mvNum(st.length,'',`stalled::${d.id}`)}</b><span class="in-mu">${st.length?`${mvK(mvSum(st,o=>o.value||0))} at stake · `:'Nothing stalled · '}no activity for ${t.team.stall||14}+ days</span></div>`;
  const colB=fresh?mvNoData('Payments appear once a deal has a payment plan.'):`<div class="mv-kv"><span>Due this month</span><b>${mvK(d.due)}</b><span class="in-mu">${xesc(d.next)}</span></div><div class="mv-kv"><span>Overdue</span><b class="${d.over?'mv-bad':''}">${d.over?mvK(d.over):'None'}</b><span class="in-mu">${d.over?'Chase drafted on the deal':'All stage payments on time'}</span></div>`;
  return mvHead(mvSwitcher(),`Updated ${MV.updated} · live · ${mvPeriodLabel()}`,mvControls())+mvFirstRun()+head+`<div class="mv-grid">
    ${mvBlock('Sales vs target',`Closed sales by month · ${d.name}`,salesB,{cls:'span2',sk:4})}
    ${mvBlock('Sold direct vs via agents',mvPeriodLabel(),chB,{right:'<button type="button" class="rail-link" onclick="mvReportTab(\'channel\')">Channel report ›</button>'})}
    ${mvBlock('Rep activity','Recorded as reps work · sales generated and closes',repB,{cls:'span2'})}
    ${mvBlock('Inventory',`${d.total} units`,invB)}
    ${mvBlock('Pipeline by stage','The four commitment stages',pipeB,{cls:'span2'})}
    ${mvBlock('Collections','Stage payments',colB)}
    ${mvBlock('Live activity','Lands as it happens · nobody reports it',mvLiveHtml(d),{cls:'span3',id:'mv-live'})}
  </div>`;
}
// ---------- 1b · All developments ----------
function mvAllDash(){
  const t=MV_T, idx=mvMonthIdx(), fresh=MV.fresh, tot=mvSum(MV_DEVS,d=>d.total), sold=mvSum(MV_DEVS,d=>d.sold);
  const val=mvSum(MV_DEVS,d=>mvSum(idx,i=>mvSoldMonth(d,i))*d.avg), tgt=t.sales.value!=null?t.sales.value*idx.length:null;
  const cell=(k,v,s,st)=>`<div class="now-cell"><div class="k">${k}</div><div class="v">${mvDot(st)}${v}</div><div class="d">${s}</div></div>`;
  const rows=MV_DEVS.map(d=>{const dt=t.devs[d.id]||{},thr=mvThr(d),dir=mvSum(idx,i=>d.hist[i][0]),ag=mvSum(idx,i=>d.hist[i][1]),av=d.total-d.sold-d.res-d.held;
    return `<tr role="button" tabindex="0" onclick="mvPickDev('${d.id}')"><td><b>${d.name}</b></td><td class="r">${mvPct(d.sold,d.total)}%</td><td>${mvDot(mvStatus(d.vel,dt.vel))}${d.vel} / wk <span class="in-mu">${dt.vel!=null?'plan '+dt.vel:'no plan'}</span></td><td>${mvDot(thr.st)}<span class="in-mu">${thr.html}</span></td>
      <td><div class="mv-split sm">${[['sold',d.sold],['reserved',d.res],['hold',d.held],['available',av]].map(([k,n])=>`<i class="mv-inv ${k}" style="flex:${n||0.0001}"></i>`).join('')}</div></td>
      <td><div class="mv-split sm"><i class="mv-seg1" style="flex:${dir||0.0001}"></i><i class="mv-seg2" style="flex:${ag||0.0001}"></i></div><span class="in-mu">${mvPct(dir,dir+ag)}% direct</span></td></tr>`;}).join('');
  return mvHead(mvSwitcher(),`Updated ${MV.updated} · live · ${MV_DEVS.length} developments · ${mvPeriodLabel()}`,mvControls())+mvFirstRun()+`<div class="dcard mv-now"><div class="now-strip">
      ${cell('Sold',fresh?'—':`${mvPct(sold,tot)}%`,fresh?'No sales recorded yet':`${sold} of ${tot} units across all developments`)}
      ${cell('Closed sales vs target',fresh?'—':mvNum(mvK(val),'','sales:all'),tgt!=null?mvTgtLine(val,tgt).txt:mvAddT('sales'),tgt==null||fresh?null:mvTgtLine(val,tgt).st)}
      ${cell('Collections',fresh?'—':mvK(mvSum(MV_DEVS,d=>d.due)),fresh?'No payment plans yet':`due this month · ${mvK(mvSum(MV_DEVS,d=>d.over))} overdue`)}
    </div></div>`+mvBlock('Developments','Velocity and financing threshold per development · inventory and channel as one bar each',fresh?mvNoData('Developments fill in as units sell.'):`<table class="mv-t"><thead><tr><th>Development</th><th class="r">Sold</th><th>Velocity</th><th>Financing threshold</th><th>Inventory</th><th>Sold direct vs agents</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="mv-legend">${[['sold','Sold'],['reserved','Reserved'],['hold','Held'],['available','Available']].map(([k,l])=>`<span><i class="mv-inv ${k}"></i>${l}</span>`).join('')}<span><i class="mv-seg1"></i>Direct</span><span><i class="mv-seg2"></i>Via agents</span></div>`,{sk:5});
}
// ---------- Live activity (C5): recorded actions arrive without a refresh ----------
const MV_LIVE_SEED=[['Sam','moved Anna Spiteri to Committed','Hold on #CM9710 approved'],['Matthew Vella','logged a viewing as held','3 updates written from the recording'],['Maria Farrugia','sent a follow-up on WhatsApp','Rebecca Farrugia · Dolphin Court'],['Karl Zammit','asked to hold #CM9824','Waiting in Approvals'],['Sam','replied to Daniel Vella','2 documents filed'],['Sarah Azzopardi','booked a viewing','Onyx Rise · Fri 6 Nov'],['Rachel Mifsud','approved a commission split','DEAL-2213']];
function mvLiveHtml(d){
  if(MV.fresh) return mvNoData('Each message, call, stage move and approval shows here as it happens.');
  if(!MV.live.length) MV.live=MV_LIVE_SEED.slice(0,5).map(([w,a,s],i)=>({w,a,s,t:['17:02','16:48','16:31','16:10','15:52'][i]}));
  return `<div class="mv-live">${MV.live.slice(0,6).map((e,i)=>`<div class="mv-le ${i===0&&e.fresh?'fresh':''}"><span class="avatar-sm neutral">${initials(e.w)}</span><span><b>${xesc(e.w)}</b> ${xesc(e.a)} <span class="in-mu">· ${xesc(e.s)}</span></span><span class="in-mu">${e.t}</span></div>`).join('')}</div>`;
}
setInterval(()=>{
  if(MV.fresh||!document.getElementById('mv-live')||!document.getElementById('p-dashboard')?.classList.contains('on')) return;
  const s=MV_LIVE_SEED[(MV.live.length)%MV_LIVE_SEED.length]; MV.live.unshift({w:s[0],a:s[1],s:s[2],t:mvHm(),fresh:true}); MV.updated=mvHm();
  const el=document.getElementById('mv-live'); if(el){el.outerHTML=mvBlock('Live activity','Lands as it happens · nobody reports it',mvLiveHtml(),{cls:'span3',id:'mv-live'});}
  const sub=document.querySelector('#mv-dash .mv-head .page-sub'); if(sub) sub.textContent=sub.textContent.replace(/Updated \d\d:\d\d/,'Updated '+MV.updated);
},20000);
// ---------- 3c · Pipeline brief ----------
function mvBriefText(){
  const devs=MV.brief==='all'?MV_DEVS:[mvDev(MV.brief)], t=MV_T, val=mvSum(devs,d=>mvSoldMonth(d,5)*d.avg), tgt=MV.brief==='all'?t.sales.value:t.sales.byDev[MV.brief];
  const opps=mvOpenOpps().filter(o=>MV.brief==='all'||o.devs.includes(mvDev(MV.brief).name)), st=mvStalled().filter(o=>opps.includes(o));
  const n=i=>opps.filter(o=>mvStage(o)===i).length, conv=MV_STAGES.slice(0,3).map((s,i)=>`${s} → ${MV_STAGES[i+1]} ${Math.round(mvSum(MV_REPS,r=>r.conv[i])/MV_REPS.length)}%${t.team.conv[i]!=null?` (target ${t.team.conv[i]}%)`:''}`);
  return {at:mvHm(),lines:[['Closed sales this month',`${mvK(val)}${tgt!=null?` of ${mvK(tgt)} target · ${mvPct(val,tgt)}%`:' · no target set'}`],['Conversion',conv.join(' · ')],['Units',`${mvSum(devs,d=>d.sold+d.res)} committed · ${mvSum(devs,d=>d.total-d.sold-d.res)} open`],['Open opportunities',`${n(0)} Lead · ${n(1)} Interested · ${n(2)} Committed`],['Stalled',`${st.length} · ${mvK(mvSum(st,o=>o.value||0))} at stake`]]};
}
function mvBrief(){
  const b=mvBriefText();
  qaDrawerOpen('Pipeline brief',`<div class="row-between" style="margin-bottom:10px"><span class="in-mu">As of today ${b.at} · read live</span><select class="in-cat" aria-label="Development" onchange="MV.brief=this.value;mvBrief()"><option value="all">All developments</option>${MV_DEVS.map(d=>`<option value="${d.id}" ${MV.brief===d.id?'selected':''}>${d.name}</option>`).join('')}</select></div>
    <div class="mi-kv">${b.lines.map(([k,v])=>`<div><span class="in-mu">${k}</span><span>${xesc(v)}</span></div>`).join('')}</div><div class="in-mu" style="margin-top:10px">No projected closes and no forecast. Every figure matches the dashboard at this moment.</div>`,
    `<button class="btn-ghost" onclick="mvBrief();showToast('Re-read live data')">Refresh</button><button class="btn-primary" onclick="mvBriefCopy()">Copy as text</button>`);
}
function mvBriefCopy(){const b=mvBriefText(),txt=`Pipeline brief · ${MV.brief==='all'?'All developments':mvDev(MV.brief).name} · ${MV_NOW} ${b.at}\n`+b.lines.map(([k,v])=>`${k}: ${v}`).join('\n');navigator.clipboard?.writeText(txt).catch(()=>{});showToast('Copied · paste into WhatsApp or email');}
// ---------- 3a · Manager dashboard: who is behind target, which deals are stuck, which leads are waiting ----------
const MV_METRICS=[['act','Activity','actions / week',false],['ft','First touch','median minutes',true],['conv','Conversion','Interested → Committed',false],['tis','Time in stage','days in Interested',true],['stall','Stalled','deals',true]];
function mvRepVal(r,k){return k==='conv'?r.conv[1]:k==='tis'?r.tis[1]:k==='stall'?mvStalled(r).length:r[k];}
function mvRepTgt(r,k){if(k==='conv')return MV_T.team.conv[1];if(k==='tis')return MV_T.team.tis[1];if(k==='stall')return MV_T.team.stall==null?null:1;return mvRepT(r,k);}
function mvFmt(k,v){return v==null?'—':k==='conv'?v+'%':k==='ft'?v+' min':k==='tis'?v+' d':String(v);}
function mvTeamTable(fresh){
  if(fresh) return mvNoData('Rep metrics fill in as reps message, call and move deals.');
  const head=MV_METRICS.map(([k,l,s,lower])=>{const t=MV_REPS.map(r=>mvRepTgt(r,k)).find(v=>v!=null);return `<th class="r">${l}<div class="in-mu">${t==null?mvAddT('team'):k==='stall'?'none stalled':`target ${mvFmt(k,t)}`}</div></th>`;}).join('');
  return `<table class="mv-t"><thead><tr><th>Rep</th>${head}</tr></thead><tbody>${MV_REPS.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(r=>`<tr role="button" tabindex="0" onclick="mvRepOpen('${r.id}')"><td><b>${r.name}</b>${(MV_T.reps[r.id]||{}).ovr?'<div class="in-mu">Own targets · ramp</div>':''}</td>${MV_METRICS.map(([k,,,lower])=>{const v=mvRepVal(r,k),t=mvRepTgt(r,k);
    return `<td class="r">${k==='stall'?`<button type="button" class="mv-n" onclick="event.stopPropagation();mvRecords('stalled:${r.id}')">${mvDot(t==null?null:v===0?'on':v===1?'near':'behind')}${v}${v?` <span class="in-mu">${mvK(mvSum(mvStalled(r),o=>o.value||0))}</span>`:''}</button>`:`${mvDot(mvStatus(v,t,lower))}${mvFmt(k,v)}${k==='ft'?`<div class="in-mu">${r.ftIn}% within target</div>`:''}`}</td>`;}).join('')}</tr>`).join('')}</tbody></table>
    <div class="mv-legend"><span>${mvDot('on')}On target</span><span>${mvDot('near')}Within 10%</span><span>${mvDot('behind')}Behind</span><span class="in-mu">Against the targets you set · sorted by name</span></div>`;
}
function mvMgrDash(){
  const t=MV_T, fresh=MV.fresh, val=mvSum(MV_DEVS,d=>mvSoldMonth(d,5)*d.avg), units=mvSum(MV_DEVS,d=>mvSoldMonth(d,5)), wait=mvWaiting(), st=mvStalled();
  const pend=typeof APPROVALS!=='undefined'?APPROVALS.filter(r=>!r.decided):[];
  const roll=fresh?`<div class="mv-roll empty"><b>Weekly roll-up</b><span class="in-mu">The first one arrives Monday at 07:00, written from the week’s records against your targets.</span></div>`
    :`<div class="mv-roll"><div><div class="in-mu">Weekly roll-up · week ${MV.week} · 26 Oct to 1 Nov</div><b>${xesc(MV_ROLL[44].headline)}</b></div><button type="button" class="btn-ghost" onclick="mvRollOpen()">Read full roll-up</button></div>`;
  const salesB=fresh||t.sales.value==null?(fresh?mvNoData('Closed sales appear when a POS is signed.'):`<div class="mv-big">${mvK(val)}</div><div class="mv-foot">${mvAddT('sales')}</div>`)
    :`<div class="mv-big">${mvDot(mvStatus(val,t.sales.value*4/30))}${mvNum(mvK(val),'','sales:all')} <span class="in-mu">of ${mvK(t.sales.value)}</span></div><div class="in-mu" style="margin-bottom:8px">${mvStatus(val,t.sales.value*4/30)==='on'?'Ahead of':'Behind'} the pace due by ${MV_NOW}</div><div class="progress"><span style="width:${Math.min(100,mvPct(val,t.sales.value))}%"></span></div>
      <div class="mv-kv"><span>Units</span><b>${units}</b><span class="in-mu">${t.sales.units!=null?`of ${t.sales.units} target`:''}</span></div><div class="mv-foot in-mu">Closed sales only · November to date</div>`;
  const lb=MV_REPS.slice().sort((a,b)=>b.rev-a.rev).slice(0,3);
  const lbB=fresh?mvNoData('Ranks reps by recorded closes once deals close.'):`${lb.map((r,i)=>`<button type="button" class="mv-lbr" onclick="mvRepOpen('${r.id}')"><span class="mv-rank">${i+1}</span><b>${r.name}</b><span>${mvK(r.rev)}</span><span class="in-mu">${r.closes} closes</span></button>`).join('')}`;
  const waitB=fresh?mvNoData('New leads with no owner show here.'):wait.length?wait.slice(0,4).map(o=>`<div class="mv-wr"><span><b>${xesc(o.lead)}</b><div class="in-mu">${xesc(o.devs[0]||'')} · ${xesc(o.source)} · ${xesc(o.ago)}</div></span><button type="button" class="btn-ghost chd-b" onclick="mvAssign('${o.id}')">Assign</button></div>`).join(''):'<div class="in-mu">No leads waiting. Every new lead has an owner.</div>';
  const stB=fresh?mvNoData(`A deal counts as stalled after ${t.team.stall||14} days with no recorded activity.`):st.length?st.slice(0,5).map(o=>`<div class="mv-wr"><span><b>${xesc(o.lead)}</b><div class="in-mu">${xesc(o.stage)} · ${xesc(o.rep)} · quiet ${xesc(o.ago)} · ${mvK(o.value||0)}</div></span><button type="button" class="btn-ghost chd-b" onclick="mvReassign('${o.id}')">Reassign</button></div>`).join('')+(st.length>5?`<button type="button" class="rail-link" onclick="mvRecords('stalled')">All ${st.length} stalled ›</button>`:''):'<div class="in-mu">Nothing stalled.</div>';
  const title=mvRole()==='owner'?'Team':'Dashboard';
  return mvHead(title,fresh?`Updated ${MV.updated} · No sales recorded yet`:`Updated ${MV.updated} · Closed sales this month ${mvK(val)}${t.sales.value!=null?` of ${mvK(t.sales.value)} team target`:''}`,`${mvSeg([['month','This month'],['quarter','3 months'],['ytd','Year to date']],MV.period,'mvSetPeriod')}<div class="toolbar">${mvDemoLink()}${mvRole()==='owner'?mvSeg([['dev','Developer'],['team','Team']],MV.view,'mvSetView'):''}<button type="button" class="btn-ghost" onclick="mvBrief()">Pipeline brief</button></div>`)
    +mvFirstRun()+roll+`<div class="mv-mgr"><div class="mv-col-main">
      ${mvBlock('Team vs target','One row per rep · last 30 days · status against the targets you set',mvTeamTable(fresh),{sk:5,right:'<button type="button" class="rail-link" onclick="mvReportTab(\'team\')">Team report ›</button>'})}
      ${mvBlock('Stalled deals',fresh?'':st.length?`${st.length} · ${mvK(mvSum(st,o=>o.value||0))} at stake`:'None',stB,{sk:3})}
    </div><div class="mv-col-side">
      ${mvBlock('Team sales vs target','November to date',salesB,{sk:2})}
      ${mvBlock('Leaderboard','By closed revenue · last 30 days',lbB,{sk:3,right:'<button type="button" class="rail-link" onclick="mvReportTab(\'leaderboard\')">Full leaderboard ›</button>'})}
      ${mvBlock('Waiting leads',fresh?'':`${wait.length} with no owner`,waitB,{sk:2})}
      ${mvBlock('Approvals',`${pend.length} waiting for a decision`,`<button type="button" class="btn-ghost" onclick="go('approvals')">Open approvals queue</button>`,{sk:1})}
    </div></div>`;
}
function mvAssign(id){
  const o=OPPS.find(v=>v.id===id);
  qaDrawerOpen(`Assign ${o.lead}`,`<div class="in-mu" style="margin-bottom:10px">${xesc(o.devs[0]||'')} · ${xesc(o.source)} · waiting ${xesc(o.ago)}. The allocation rule suggests the rep covering ${xesc(o.devs[0]||'this development')} with the fewest open leads.</div>
    <div class="chd-opts">${MV_REPS.map((r,i)=>`<label class="chd-opt"><input type="radio" name="mv-as" value="${r.first}" ${r.devs.includes(o.devs[0])&&!i?'checked':''}> ${r.name} <span class="in-mu">· ${mvOpenOpps().filter(x=>x.rep===r.first).length} open · covers ${r.devs.join(', ')}</span></label>`).join('')}</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="mvAssignSave('${id}')">Assign</button>`);
}
function mvAssignSave(id){const o=OPPS.find(v=>v.id===id),r=document.querySelector('input[name="mv-as"]:checked')?.value||'Sam';o.rep=r;o.unassigned=false;getExt(o).comms.unshift({ch:'sys',t:'Just now',text:`Assigned to ${r} from the manager dashboard`});qaDrawerClose();renderDash();showToast(`${o.lead} assigned to ${r}`);}
function mvReassign(id){
  const o=OPPS.find(v=>v.id===id);
  qaDrawerOpen(`Reassign ${o.lead}`,`<div class="in-mu" style="margin-bottom:10px">${xesc(o.stage)} · with ${xesc(o.rep)} · no activity for ${xesc(o.ago)}. Open tasks move with the opportunity.</div><div class="chd-opts">${MV_REPS.filter(r=>r.first!==o.rep).map((r,i)=>`<label class="chd-opt"><input type="radio" name="mv-as" value="${r.first}" ${i?'':'checked'}> ${r.name}</label>`).join('')}</div>`,
    `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button><button class="btn-primary" onclick="mvAssignSave('${id}')">Reassign</button>`);
}
// ---------- 2 · Reports: six tabs, one route. Rep report and roll-up are sub-pages ----------
const MV_RTABS=[['revenue','Revenue'],['pipeline','Pipeline'],['inventory','Inventory'],['channel','Channel'],['team','Team'],['leaderboard','Leaderboard']];
function mvReportTab(t){MV.tab=t;MV.route='tabs';if(!document.getElementById('p-reports').classList.contains('on'))go('reports');else rpRender();}
function mvNoAccess(){return `<div class="mv-noacc"><div class="page-title">You don’t have access to this page</div><p class="in-mu">Dashboards for the team, reports and targets are for developers, admins and sales managers. Your own activity still counts; only this view is withheld.</p><button class="btn-primary" onclick="go('today')">Back to Today</button></div>`;}
function mvCrumb(parts){document.getElementById('crumb').innerHTML=parts.map((p,i)=>i<parts.length-1?`<a onclick="${p[1]}">${p[0]}</a><span class="sep">/</span>`:`<span class="cur">${p[0]}</span>`).join('');}
function mvReportsRender(){
  const root=document.getElementById('rp-root'); if(!root) return;
  if(!mvMgrish()){root.innerHTML=mvNoAccess();return;}
  if(MV.route==='rep'){root.innerHTML=mvRepHtml();mvCrumb([['Reports',"MV.route='tabs';rpRender()"],['Team',"mvReportTab('team')"],[mvRepCur().name]]);return;}
  if(MV.route==='rollup'){root.innerHTML=mvRollHtml();mvCrumb([['Dashboard',"go('dashboard')"],[`Weekly roll-up · week ${MV.week}`]]);return;}
  mvCrumb([['Reports',"mvReportTab('revenue')"],[MV_RTABS.find(t=>t[0]===MV.tab)[1]]]);
  const devOpts=`<select class="in-cat mv-sel" aria-label="Development" onchange="MV.dev=this.value;rpRender()"><option value="all">All developments</option>${MV_DEVS.map(d=>`<option value="${d.id}" ${MV.dev===d.id?'selected':''}>${d.name}</option>`).join('')}</select>`;
  const range=`<select class="in-cat mv-sel" aria-label="Period" onchange="MV.rangeR=this.value;rpRender();if(this.value==='custom')showToast('Pick a start and end date')"><option value="6m" ${MV.rangeR==='6m'?'selected':''}>Last 6 months</option><option value="3m" ${MV.rangeR==='3m'?'selected':''}>Last 3 months</option><option value="month" ${MV.rangeR==='month'?'selected':''}>This month</option><option value="custom" ${MV.rangeR==='custom'?'selected':''}>Custom range…</option></select>`;
  const body={revenue:mvRevenue,pipeline:mvPipeline,inventory:mvInventory,channel:mvChannel,team:mvTeam,leaderboard:mvLeader}[MV.tab]();
  root.innerHTML=`<div class="crm-page-heading"><div class="page-title">Reports</div><div class="page-sub">Recorded results against the targets you set · every row opens the records behind it</div></div>
    <div class="crm-page-controls"><div class="tabs">${MV_RTABS.map(([k,l])=>`<button type="button" class="tab ${MV.tab===k?'on':''}" onclick="mvReportTab('${k}')">${l}</button>`).join('')}</div>
      <div class="toolbar">${devOpts}${range}${MV.tab==='team'?`<select class="in-cat mv-sel" aria-label="Metric" onchange="MV.teamMetric=this.value;rpRender()">${MV_METRICS.map(([k,l])=>`<option value="${k}" ${MV.teamMetric===k?'selected':''}>${l}</option>`).join('')}</select>`:''}<button type="button" class="btn-ghost" onclick="mvCsv('${MV.tab}')">Export CSV</button></div></div>${body}`;
}
function mvRDevs(){return MV.dev==='all'?MV_DEVS:[mvDev(MV.dev)];}
function mvRIdx(){return {month:[5],'3m':[3,4,5],'6m':[0,1,2,3,4,5],custom:[0,1,2,3,4,5]}[MV.rangeR];}
// 2a · Revenue
function mvRevenue(){
  const devs=mvRDevs(), idx=mvRIdx(), t=MV.dev==='all'?MV_T.sales.value:MV_T.sales.byDev[MV.dev];
  const rows=idx.map(i=>{const dir=mvSum(devs,d=>d.hist[i][0]),ag=mvSum(devs,d=>d.hist[i][1]),v=mvSum(devs,d=>mvSoldMonth(d,i)*d.avg);return {m:MV_MONTHS[i],u:dir+ag,dir,ag,v};});
  return mvBlock('Closed sales by month','POS signed · dashed line is the monthly sales target',mvBarChart(rows.map(r=>({m:r.m,v:r.v,fn:`mvRecords('sales:${MV.dev}:${r.m}')`})),t,true)+(t==null?`<div class="mv-foot">${mvAddT('sales')}</div>`:''))
    +mvBlock('By month','',`<table class="mv-t"><thead><tr><th>Month</th><th class="r">Units sold</th><th class="r">Value</th><th class="r">Sold direct</th><th class="r">Via agent</th><th class="r">Target</th><th class="r">% to target</th></tr></thead><tbody>${rows.map(r=>`<tr role="button" tabindex="0" onclick="mvRecords('sales:${MV.dev}:${r.m}')"><td><b>${r.m}</b>${r.m==='Nov'?' <span class="in-mu">to date</span>':''}</td><td class="r">${r.u}</td><td class="r">${mvK(r.v)}</td><td class="r">${r.dir}</td><td class="r">${r.ag}</td><td class="r">${t!=null?mvK(t):'Not set'}</td><td class="r">${t!=null?`${mvDot(mvStatus(r.v,r.m==='Nov'?t*4/30:t))}${mvPct(r.v,t)}%`:'—'}</td></tr>`).join('')}</tbody></table>`);
}
// 2b · Pipeline: conversion between the four commitment stages, time in stage, stalled, lost reasons
function mvPipeline(){
  const t=MV_T.team, avg=i=>Math.round(mvSum(MV_REPS,r=>r.conv[i])/MV_REPS.length), tis=i=>Math.round(mvSum(MV_REPS,r=>r.tis[i])/MV_REPS.length);
  const share=MV.dev==='all'?1:mvDev(MV.dev).total/mvSum(MV_DEVS,d=>d.total), entered=[412,178,47,32].map(n=>Math.max(1,Math.round(n*share))), st=mvStalled(), opps=mvOpenOpps();
  const funnel=MV_STAGES.map((s,i)=>`<div class="mv-fs"><div class="mv-fb" style="width:${Math.max(8,Math.round(entered[i]/entered[0]*100))}%"><b>${entered[i]}</b> ${s}</div>${i<3?`<div class="mv-fd">${avg(i)}% move on ${t.conv[i]!=null?`${mvDot(mvStatus(avg(i),t.conv[i]))}<span class="in-mu">target ${t.conv[i]}%</span>`:mvAddT('team')}</div>`:''}</div>`).join('');
  const rows=MV_STAGES.slice(0,3).map((s,i)=>{const sc=st.filter(o=>mvStage(o)===i&&(MV.dev==='all'||o.devs.includes(mvDev(MV.dev).name)));return `<tr role="button" tabindex="0" onclick="mvRecords('pipe:${i}:${MV.dev}')"><td><b>${s} → ${MV_STAGES[i+1]}</b></td><td class="r">${mvDot(mvStatus(avg(i),t.conv[i]))}${avg(i)}%</td><td class="r">${t.conv[i]!=null?t.conv[i]+'%':'Not set'}</td><td class="r">${mvDot(mvStatus(tis(i),t.tis[i],true))}${tis(i)} d</td><td class="r">${t.tis[i]!=null?t.tis[i]+' d':'Not set'}</td><td class="r"><button type="button" class="mv-n" onclick="event.stopPropagation();mvRecords('stalled::${MV.dev}')">${sc.length}</button>${sc.length?` <span class="in-mu">${mvK(mvSum(sc,o=>o.value||0))}</span>`:''}</td></tr>`;}).join('');
  const lt=mvSum(MV_LOST[1],v=>v);
  return mvBlock('Conversion between the four commitment stages','Drop-off between each stage against your conversion targets',`<div class="mv-funnel">${funnel}</div>`)
    +mvBlock('By stage','',`<table class="mv-t"><thead><tr><th>Stage</th><th class="r">Conversion</th><th class="r">Target</th><th class="r">Avg time in stage</th><th class="r">Target</th><th class="r">Stalled</th></tr></thead><tbody>${rows}</tbody></table>`)
    +mvBlock('Why deals were lost',`${lt} lost · reason recorded when the opportunity moved to Lost`,`<table class="mv-t"><tbody>${MV_LOST[0].map((r,i)=>`<tr><td>${r}</td><td class="r">${MV_LOST[1][i]}</td><td style="width:45%"><div class="mv-hbar"><i style="width:${mvPct(MV_LOST[1][i],Math.max(...MV_LOST[1]))}%"></i></div></td></tr>`).join('')}</tbody></table><div class="mv-foot in-mu">Objection clusters per development sit under Developments › Objections.</div>`);
}
// 2c · Inventory
function mvInventory(){
  const devs=mvRDevs(), wk=['W37','W38','W39','W40','W41','W42','W43','W44'];
  const tot=mvSum(devs,d=>d.total), soldNow=mvSum(devs,d=>d.sold);
  const weeks=wk.map((w,i)=>{const s=Math.round(soldNow-(7-i)*mvSum(devs,d=>d.vel)),r=mvSum(devs,d=>d.res),h=mvSum(devs,d=>d.held);return {w,s,r,h,a:tot-s-r-h};});
  const chart=`${mvStackChart(weeks.map(x=>({...x,m:x.w})),[['a','mv-inv available'],['h','mv-inv hold'],['r','mv-inv reserved'],['s','mv-inv sold']],true)}<div class="mv-legend">${[['sold','Sold'],['reserved','Reserved'],['hold','Held'],['available','Available']].map(([k,l])=>`<span><i class="mv-inv ${k}"></i>${l}</span>`).join('')}</div>`;
  const rows=devs.flatMap(d=>{const dt=MV_T.devs[d.id]||{},thr=mvThr(d);return MV_TYPES[d.id].map(([ty,n],j)=>{const sold=Math.round(d.sold*n/d.total),res=j===1?d.res:0,held=j===0?d.held:0,av=n-sold-res-held;
    return `<tr role="button" tabindex="0" onclick="mvRecords('units:${d.id}:available')"><td>${j?'':`<b>${d.name}</b>`}</td><td>${ty}</td><td class="r">${n}</td><td class="r">${av}</td><td class="r">${held}</td><td class="r">${res}</td><td class="r">${sold}</td><td class="r">${mvPct(sold,n)}%</td><td>${j?'':`${mvDot(mvStatus(d.vel,dt.vel))}${dt.vel!=null?`plan ${dt.vel}/wk`:'Not set'}`}</td><td>${j?'':`${mvDot(thr.st)}<span class="in-mu">${thr.html}</span>`}</td></tr>`;});}).join('');
  return mvBlock('Units by status, week by week','Last 8 weeks',chart)+mvBlock('By development and unit type','Planned velocity and financing threshold come from Settings › Targets',`<table class="mv-t"><thead><tr><th>Development</th><th>Type</th><th class="r">Total</th><th class="r">Available</th><th class="r">Held</th><th class="r">Reserved</th><th class="r">Sold</th><th class="r">% sold</th><th>Velocity</th><th>Financing threshold</th></tr></thead><tbody>${rows}</tbody></table>`);
}
// 2e · Channel: sold direct vs via external agents (derived from each deal's commission split)
function mvChannel(){
  const devs=mvRDevs(), idx=mvRIdx(), tg=MV_T.team.direct;
  const months=idx.map(i=>({m:MV_MONTHS[i],dir:mvSum(devs,d=>d.hist[i][0]),ag:mvSum(devs,d=>d.hist[i][1])})), mx=Math.max(...months.map(x=>x.dir+x.ag),1);
  const owed=mvSum(MV_AGENCIES,a=>a[4]*a[2]/100);
  return `<div class="mi-ban t-ok sm" style="margin-bottom:12px"><span>Channel comes from the commission split on each deal: an external agency on the split means the sale was via an agent. It’s confirmed at the POS step, so every deal has one.</span></div>`
    +mvBlock('Channel mix by month',`Direct share target ${tg!=null?tg+'%':'not set'}`,`${mvStackChart(months,[['ag','mv-seg2'],['dir','mv-seg1']],true)}<div class="mv-legend"><span><i class="mv-seg1"></i>Direct</span><span><i class="mv-seg2"></i>Via agents</span></div>`)
    +mvBlock('By development','% direct against the direct-share target',`<table class="mv-t"><thead><tr><th>Development</th><th class="r">Direct</th><th class="r">Via agents</th><th class="r">% direct</th><th class="r">Target</th></tr></thead><tbody>${MV_DEVS.map(d=>{const dir=mvSum(idx,i=>d.hist[i][0]),ag=mvSum(idx,i=>d.hist[i][1]),p=mvPct(dir,dir+ag);return `<tr role="button" tabindex="0" onclick="mvRecords('sales:${d.id}')"><td><b>${d.name}</b></td><td class="r">${dir}</td><td class="r">${ag}</td><td class="r">${mvDot(mvStatus(p,tg))}${p}%</td><td class="r">${tg!=null?tg+'%':'Not set'}</td></tr>`;}).join('')}</tbody></table>`)
    +mvBlock('Agencies',`${mvK(Math.round(owed))} commission owed · cost per sale against direct`,`<table class="mv-t"><thead><tr><th>Agency</th><th>Contact</th><th class="r">Units</th><th class="r">Value</th><th class="r">Rate</th><th class="r">Commission owed</th><th class="r">Avg days to close</th></tr></thead><tbody>${MV_AGENCIES.map(a=>`<tr role="button" tabindex="0" onclick="mvRecords('sales:all::agent')"><td><b>${a[0]}</b></td><td>${a[1]}</td><td class="r">${a[3]}</td><td class="r">${mvK(a[4])}</td><td class="r">${a[2]}%</td><td class="r">${mvK(Math.round(a[4]*a[2]/100))}</td><td class="r">${a[5]} <span class="in-mu">vs 49 direct</span></td></tr>`).join('')}</tbody></table>`);
}
// 2d · Team: one metric at a time against target, sorted by name (ranking lives in Leaderboard)
function mvTeam(){
  const k=MV.teamMetric, m=MV_METRICS.find(x=>x[0]===k), reps=MV_REPS.slice().sort((a,b)=>a.name.localeCompare(b.name)), vals=reps.map(r=>mvRepVal(r,k)), mx=Math.max(...vals,...reps.map(r=>mvRepTgt(r,k)||0),1);
  const t=mvRepTgt(reps[0],k);
  return mvBlock(`${m[1]} by rep`,`${m[2]}${t!=null?` · line is the target${k==='stall'?'':''}`:''}`,`<div class="mv-hbars">${reps.map((r,i)=>{const tt=mvRepTgt(r,k);return `<button type="button" class="mv-hb" onclick="mvRepOpen('${r.id}')"><span>${r.name}</span><span class="mv-hbar"><i style="width:${Math.round(vals[i]/mx*100)}%"></i>${tt!=null?`<em style="left:${Math.round(tt/mx*100)}%"></em>`:''}</span><b>${mvDot(mvStatus(vals[i],tt,m[3]))}${mvFmt(k,vals[i])}</b></button>`;}).join('')}</div>${t==null?`<div class="mv-foot">${mvAddT('team')}</div>`:''}`)
    +mvBlock('All five metrics','Each against the rep’s target (team target unless overridden)',mvTeamTable(false));
}
// 2f · Leaderboard: recorded outcomes only, no colour, no comparison to the team average
function mvLeader(){
  const by=MV.lbBy, key={rev:'rev',closes:'closes',gen:'gen'}[by], l=MV_REPS.slice().sort((a,b)=>b[key]-a[key]);
  const top=(f,lab,fmt)=>{const mx=Math.max(...MV_REPS.map(f)),l=MV_REPS.filter(r=>f(r)===mx);return `<div class="mv-lead"><span class="in-mu">${lab}</span><b>${l.map(r=>r.name).join(' and ')}</b><span>${fmt(mx)}${l.length>1?' each':''}</span></div>`;};
  return `<div class="dcard mv-leads">${top(r=>r.closes,'Most closes',v=>v+' closes')}${top(r=>r.rev,'Most revenue',mvK)}${top(r=>r.gen,'Most sales generated',mvK)}${top(r=>mvPct(r.direct,r.direct+r.agent),'Highest direct share',v=>v+'%')}</div>`
    +mvBlock('Leaderboard',`Ranked by ${{rev:'closed revenue',closes:'closes',gen:'sales generated'}[by]} · recorded outcomes only`,`<div style="margin-bottom:10px">${mvSeg([['rev','Revenue'],['closes','Closes'],['gen','Sales generated']],by,'mvLb')}</div>
      <table class="mv-t"><thead><tr><th>#</th><th>Rep</th><th class="r">Closed revenue</th><th class="r">Closes</th><th class="r">Sales generated</th><th class="r">Average sale</th><th class="r">Direct · agent</th></tr></thead><tbody>${l.map((r,i)=>`<tr role="button" tabindex="0" onclick="mvRepOpen('${r.id}')"><td>${i+1}</td><td><b>${r.name}</b></td><td class="r">${mvK(r.rev)}</td><td class="r">${r.closes}</td><td class="r">${mvK(r.gen)}</td><td class="r">${r.closes?mvK(Math.round(r.rev/r.closes)):'—'}</td><td class="r">${r.direct} · ${r.agent}</td></tr>`).join('')}</tbody></table>
      <div class="mv-foot in-mu">Visible to managers, developers and admins only. Reps don’t see rankings. Status against target stays in the Team tab.</div>`);
}
function mvLb(k){MV.lbBy=k;rpRender();}
// ---------- 4a · Rep report: one rep, ready for a one-to-one ----------
function mvRepCur(){return MV_REPS.find(r=>r.id===MV.rep)||MV_REPS[0];}
function mvRepOpen(id){qaDrawerClose&&document.getElementById('qaDrawer')?.classList.contains('open')&&qaDrawerClose();MV.rep=id;MV.route='rep';if(!document.getElementById('p-reports').classList.contains('on'))go('reports');else rpRender();document.getElementById('content').scrollTop=0;}
function mvDelta(v,p,lower,fmt){if(p==null)return '';const d=v-p;if(!d)return '<span class="in-mu">same as previous period</span>';const good=lower?d<0:d>0;return `<span class="mv-delta ${good?'up':'down'}">${d>0?'▲':'▼'} ${fmt?fmt(Math.abs(d)):Math.abs(d)} vs previous period</span>`;}
const MV_SLOW={maria:[['Elena Zahra','Dolphin Court · website','52 min','Thu 29 Oct, 21:14'],['Ian Mallia','Mercury · Meta lead','38 min','Sat 31 Oct, 10:02']],sarah:[['Kurt Borg','Onyx Rise · portal','1 h 40 min','Mon 2 Nov, 08:47'],['Ruth Cassar','Onyx Rise · Meta lead','47 min','Tue 3 Nov, 19:20'],['Tara Abela','Onyx Rise · website','31 min','Wed 4 Nov, 09:05']],sam:[['Neil Bonello','Verdala · walk-in follow-up','24 min','Fri 30 Oct, 17:40']],karl:[['Jake Attard','Verdala · portal','29 min','Tue 3 Nov, 12:11']],matthew:[]};
function mvRepHtml(){
  const r=mvRepCur(), t=MV_T, rt=t.reps[r.id]||{}, p=r.prev, st=mvStalled(r);
  const dir=mvPct(r.direct,r.direct+r.agent);
  const card=(lab,val,tgt,st2,delta)=>`<div class="mv-tc"><span class="in-mu">${lab}</span><b>${mvDot(st2)}${val}</b><span class="in-mu">${tgt}</span>${delta||''}</div>`;
  const cards=[
    card('Activity',`${r.act} / wk`,mvRepT(r,'act')!=null?`target ${mvRepT(r,'act')}${rt.ovr?.act!=null?' · own':''}`:'No target set',mvStatus(r.act,mvRepT(r,'act')),mvDelta(r.act,p.act)),
    card('First touch',`${r.ft} min median`,mvRepT(r,'ft')!=null?`target ${mvRepT(r,'ft')} min · ${r.ftIn}% within`:'No target set',mvStatus(r.ft,mvRepT(r,'ft'),true),mvDelta(r.ft,p.ft,true,v=>v+' min')),
    card('Interested → Committed',`${r.conv[1]}%`,t.team.conv[1]!=null?`target ${t.team.conv[1]}%`:'No target set',mvStatus(r.conv[1],t.team.conv[1]),mvDelta(r.conv[1],p.conv[1],false,v=>v+' pts')),
    card('Time in Interested',`${r.tis[1]} days`,t.team.tis[1]!=null?`target ${t.team.tis[1]} days`:'No target set',mvStatus(r.tis[1],t.team.tis[1],true),mvDelta(r.tis[1],p.tis[1],true,v=>v+' d')),
    card('Stalled deals',`${st.length}`,t.team.stall!=null?`no activity for ${t.team.stall}+ days`:'No threshold set',t.team.stall==null?null:st.length?st.length>1?'behind':'near':'on'),
    card('Closed sales',mvK(r.rev),rt.sales!=null?`target ${mvK(rt.sales)}`:'No target set',mvStatus(r.rev,rt.sales),mvDelta(r.rev,p.rev,false,mvK)),
    card('Commission earned',mvK(r.comm),rt.comm!=null?`target ${mvK(rt.comm)}`:'No target set',mvStatus(r.comm,rt.comm),mvDelta(r.comm,p.comm,false,v=>mvK(+v.toFixed(1)))),
    card('Sold direct',`${dir}%`,t.team.direct!=null?`target ${t.team.direct}% · ${r.direct} direct, ${r.agent} via agents`:'No target set',mvStatus(dir,t.team.direct)),
    card('Sales generated',mvK(r.gen),'pipeline value created',null,mvDelta(r.gen,p.gen,false,mvK))];
  const gaps=[0,1,2].map(i=>({i,g:t.team.conv[i]!=null?(t.team.conv[i]-r.conv[i])/t.team.conv[i]:0})), worst=gaps.sort((a,b)=>b.g-a.g)[0];
  const drop=MV_STAGES.slice(0,3).map((s,i)=>{const hl=worst.g>0.15&&worst.i===i;return `<div class="mv-drop ${hl?'hl':''}"><span>${s} → ${MV_STAGES[i+1]}</span><span class="mv-hbar"><i style="width:${r.conv[i]}%"></i>${t.team.conv[i]!=null?`<em style="left:${t.team.conv[i]}%"></em>`:''}</span><b>${r.conv[i]}%</b><span class="in-mu">${t.team.conv[i]!=null?'target '+t.team.conv[i]+'%':'Not set'}</span></div>${hl?`<div class="mv-dropnote">Deals reach ${s} on target, then fewer move to ${MV_STAGES[i+1]} than the target: ${r.conv[i]}% against ${t.team.conv[i]}%.</div>`:''}`;}).join('');
  const tis=MV_STAGES.slice(0,3).map((s,i)=>`<div class="mv-drop"><span>${s}</span><span class="mv-hbar"><i style="width:${Math.min(100,r.tis[i]/40*100)}%"></i>${t.team.tis[i]!=null?`<em style="left:${t.team.tis[i]/40*100}%"></em>`:''}</span><b>${mvDot(mvStatus(r.tis[i],t.team.tis[i],true))}${r.tis[i]} d</b><span class="in-mu">${t.team.tis[i]!=null?'target '+t.team.tis[i]+' d':'Not set'}</span></div>`).join('');
  const open=mvOpenOpps().filter(o=>o.rep===r.first), slow=MV_SLOW[r.id]||[];
  const sel=`<select class="in-cat mv-sel" aria-label="Rep" onchange="mvRepOpen(this.value)">${MV_REPS.map(x=>`<option value="${x.id}" ${x.id===r.id?'selected':''}>${x.name}</option>`).join('')}</select>`;
  return `<button class="btn-back mv-noprint" onclick="mvReportTab('team')"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8.5 3L4 7l4.5 4"/></svg>Back to Team</button>
    <div class="mv-rephead"><span class="avatar mv-av">${initials(r.name)}</span><div><div class="page-title">${r.name}</div><div class="page-sub">Sales rep · covers ${r.devs.join(', ')}${rt.note?' · '+rt.note:''}</div></div>
      <div class="toolbar mv-noprint">${sel}<select class="in-cat mv-sel" aria-label="Period" onchange="MV.repPeriod=this.value;rpRender()">${[['7d','Last 7 days'],['30d','Last 30 days'],['month','This month']].map(([k,l])=>`<option value="${k}" ${MV.repPeriod===k?'selected':''}>${l}</option>`).join('')}</select><button class="btn-ghost" onclick="window.print()">Print</button></div></div>
    ${mvBlock('Against target','Five team metrics, closed sales, commission, sold direct and sales generated · small change against the same rep’s previous period',`<div class="mv-tcs">${cards.join('')}</div>`)}
    <div class="mv-grid2">${mvBlock('Where deals drop','Conversion between the four commitment stages',drop)}${mvBlock('Time in stage','Average days',tis)}</div>
    ${mvBlock('Open deals',`${open.length} open · ${st.length} stalled`,open.length?`<table class="mv-t"><tbody>${open.map(o=>`<tr role="button" tabindex="0" onclick="openOpp('${o.id}')"><td><b>${xesc(o.lead)}</b></td><td>${xesc(o.devs[0]||'')}</td><td>${xesc(o.stage)}</td><td class="r">${mvK(o.value||0)}</td><td>${st.includes(o)?`<span class="chd-chip t-warn">Stalled · quiet ${xesc(o.ago)}</span>`:`<span class="in-mu">${xesc(o.ago)}</span>`}</td></tr>`).join('')}</tbody></table>`:'<div class="in-mu">No open deals.</div>')}
    <div class="mv-grid2">${mvBlock('Slow first touches',`Leads answered after the ${mvRepT(r,'ft')||15}-minute target`,slow.length?`<table class="mv-t"><tbody>${slow.map(s=>`<tr><td><b>${s[0]}</b><div class="in-mu">${s[1]}</div></td><td class="r">${s[2]}</td><td class="in-mu">${s[3]}</td></tr>`).join('')}</tbody></table>`:'<div class="in-mu">Every lead was answered within target.</div>')}
      ${mvBlock('Activity mix','Recorded as the rep works',`<div class="mv-mix">${[['WhatsApp messages',r.msgs],['Calls',r.calls],['Appointments held',r.held],['No-shows',r.noshow],['Follow-ups sent',r.fu]].map(([k,v])=>`<div><b>${v}</b><span class="in-mu">${k}</span></div>`).join('')}</div><div class="mv-foot in-mu">Appointments count as events only. Recordings, transcripts and meeting notes are never used for rep metrics.</div>`)}</div>
    <div class="mv-printfoot">Recorded activity only · against targets only · no comparison with other reps · ${r.name} · ${{'7d':'Last 7 days','30d':'Last 30 days',month:'This month'}[MV.repPeriod]} · printed ${MV_NOW}</div>`;
}

// ---------- 6a · Weekly roll-up (Mon 07:00, manager, in-app only) ----------
function mvOct(){return {u:mvSum(MV_DEVS,d=>mvSoldMonth(d,4)),v:mvSum(MV_DEVS,d=>mvSoldMonth(d,4)*d.avg)};}
const MV_ROLL={
  44:{range:'26 Oct to 1 Nov',get headline(){const o=mvOct();return `October closed at ${mvK(o.v)}, ${mvPct(o.v,MV_T.sales.value||1)}% of the sales target; first touch is on target for four of five reps; stalled deals rose from 1 to ${mvStalled().length}.`;},
    get week(){const o=mvOct(),t=MV_T.sales;return [['October closed at ',[mvK(o.v),'sales:all:Oct'],' against the ',[mvK(t.value),'t:sales'],' sales target, ',[`${o.u} units`,'sales:all:Oct'],` against ${t.units}.`],['On the five team metrics the team is on target for activity and first touch, near on time in stage, and behind on Interested → Committed at ',['24%','m:conv'],' against 25%.'],['The biggest change from last week: stalled deals went from 1 to ',[String(mvStalled().length),'stalled'],', both at the early stages.']];},
    reps:[['maria','Maria Farrugia','Activity held at ',['118 a week','m:act'],'. Deals reach Interested on target but stall before Committed: ',['17%','m:conv'],' moved on against a 25% target, and time in Interested is ',['31 days','m:tis'],'. Three of nine viewings were no-shows.'],
      ['matthew','Matthew Vella','On target for all five metrics. ',['3 closes','sales:all'],', all direct, and the fastest median first touch at ',['7 minutes','m:ft'],'.'],
      ['sam','Sam','Activity rose to ',['142 a week','m:act'],', above target. Conversion to Committed is ',['27%','m:conv'],' against 25%. No deals are stalled.'],
      ['sarah','Sarah Azzopardi','Working to her ramp targets. First touch is ',['22 minutes','m:ft'],' against her 20-minute target, with three slow first touches on Onyx Rise portal leads.'],
      ['karl','Karl Zammit','Close to last week on every metric. ',['2 closes','sales:all'],', one via Abela Estates.']],
    missing:[['Time in stage for Committed has no target on Onyx Rise reps’ overrides','team'],['3 Verdala portal leads arrived without a timestamp, so first touch couldn’t be measured','']]},
  43:{range:'19 to 25 Oct',headline:'Sales at 52% of target mid-month; activity on target for every rep; stalled deals steady at 3.',
    week:[['October sales stood at ',['€5.12M','sales:all:Oct'],' by the end of the week.'],['The team was on target for four of the five metrics; time in Interested was near target at ',['22 days','m:tis'],'.'],['Nothing changed sharply from the week before.']],
    reps:[['maria','Maria Farrugia','On target for activity and first touch. ',['2 closes','sales:all'],'.'],['matthew','Matthew Vella','On target for all five metrics.'],['sam','Sam','Activity at ',['128 a week','m:act'],', on target.'],['sarah','Sarah Azzopardi','First week on her ramp targets.'],['karl','Karl Zammit','On target for four of five metrics.']],missing:[]},
};
function mvRollOpen(){MV.route='rollup';MV.week=44;if(!document.getElementById('p-reports').classList.contains('on'))go('reports');else rpRender();document.getElementById('content').scrollTop=0;}
function mvChipAct(a){const [k,v]=a.split(':');return k==='t'?`mvTargetsGo('${v}')`:k==='m'?`MV.teamMetric='${v}';mvReportTab('team')`:`mvRecords('${a}')`;}
function mvProse(parts){return parts.map(p=>Array.isArray(p)?`<button type="button" class="mv-chip" onclick="${mvChipAct(p[1])}">${p[0]}</button>`:xesc(p)).join('');}
function mvRollHtml(){
  const w=MV_ROLL[MV.week], nav=`<span class="mv-wk"><button type="button" class="btn-ghost chd-b" ${MV_ROLL[MV.week-1]?'':'disabled'} onclick="MV.week--;rpRender()" aria-label="Previous week">‹</button><b>Week ${MV.week}</b><button type="button" class="btn-ghost chd-b" ${MV.week<45?'':'disabled'} onclick="MV.week++;rpRender()" aria-label="Next week">›</button></span>`;
  const head=`<div class="crm-page-heading mv-head"><div><div class="page-title">Weekly roll-up</div><div class="page-sub">Last week against your own targets · for you only, never sent to reps or buyers</div></div></div><div class="crm-page-controls">${nav}<div class="toolbar"><button type="button" class="btn-ghost" onclick="go('dashboard')">Back to dashboard</button></div></div>`;
  if(!w) return head+`<div class="mv-roll empty"><b>Not generated yet</b><span class="in-mu">Week ${MV.week} is written on Monday 9 Nov at 07:00 from the records up to Sunday 23:59.</span></div>`;
  return head+`${w.missing.length?`<div class="mi-ban t-warn"><span>Some data was missing this week, so it isn’t in the roll-up. Nothing is estimated.</span></div>`:''}
    ${mvBlock(`The week · ${w.range}`,'',`<div class="mv-prose">${w.week.map(s=>`<p>${mvProse(s)}</p>`).join('')}</div>`)}
    ${mvBlock('Per rep','What the numbers show against target · no recommendations about people',w.reps.map(([id,n,...s])=>`<div class="mv-rrow"><button type="button" class="mv-rname" onclick="mvRepOpen('${id}')">${n}</button><p>${mvProse(s)}</p></div>`).join(''))}
    ${mvBlock('Missing data',w.missing.length?`${w.missing.length} item${w.missing.length>1?'s':''}`:'Nothing missing',w.missing.length?w.missing.map(([t,c])=>`<div class="mv-wr"><span>${xesc(t)}</span>${c?`<button type="button" class="btn-ghost chd-b" onclick="mvTargetsGo('${c}')">Add in Targets</button>`:''}</div>`).join(''):'<div class="in-mu">Every metric had data and a target.</div>')}
    <div class="mv-printfoot" style="display:block">Written from data recorded up to Sunday 23:59.</div>`;
}

// ---------- 5a / 5b · Settings › Targets ----------
function mvMe(){return mvRole()==='manager'?'Rachel Mifsud':'Mark Galea';}
function mvTargetsGo(card){go('settings');stGo('p:targets');setTimeout(()=>{const el=document.getElementById('mv-tc-'+(card||'sales'));el?.scrollIntoView({block:'start',behavior:'smooth'});el?.classList.add('df-flash');},80);}
function mvTF(label,id,v,unit,opts={}){
  const ed=MV.edit===opts.card, au=MV_T.audit[id];
  return `<div class="mv-tf"><label for="mvt-${id.replace(/\W/g,'-')}">${label}${opts.hint?`<span class="in-mu"> · ${opts.hint}</span>`:''}</label>${ed&&!opts.ro?`<span class="mv-ti"><input id="mvt-${id.replace(/\W/g,'-')}" data-t="${id}" inputmode="decimal" value="${v==null?'':v}" placeholder="Not set">${unit?`<span class="in-mu">${unit}</span>`:''}</span>`:`<span class="${v==null?'in-mu':''}">${v==null?'Not set':`${unit==='€k'?mvK(v):v+(unit?' '+unit:'')}`}</span>`}${au?`<span class="mv-au">${xesc(au)}</span>`:''}</div>`;
}
function mvTCard(card,title,desc,body,ro){
  const ed=MV.edit===card;
  return `<section class="st-card mv-tcard" id="mv-tc-${card}"><div class="row-between"><div><h3>${title}</h3><div class="st-sub">${desc}</div></div>${ro?'<span class="chd-chip">Read only</span>':ed?`<span class="chd-row"><button type="button" class="btn-ghost" onclick="MV.edit=null;stRender()">Cancel</button><button type="button" class="btn-primary" onclick="mvTSave('${card}')">Save</button></span>`:`<button type="button" class="btn-ghost" onclick="MV.edit='${card}';stRender()">Edit</button>`}</div>${body}</section>`;
}
function mvTargetsHtml(){
  const t=MV_T, devRo=!mvDevEditor();
  const sales=mvTF('Monthly sales value','sales.value',t.sales.value,'€k',{card:'sales'})+mvTF('Monthly units sold','sales.units',t.sales.units,'units',{card:'sales'})
    +`<div class="mv-tsub">Split per development <span class="in-mu">optional</span></div>`+MV_DEVS.map(d=>mvTF(d.name,'sales.byDev.'+d.id,t.sales.byDev[d.id],'€k',{card:'sales'})).join('');
  const team=mvTF('Activity volume','team.act',t.team.act,'actions / week',{card:'team'})+mvTF('First touch','team.ft',t.team.ft,'minutes',{card:'team',hint:'median'})+mvTF('Leads touched within target','team.ftPct',t.team.ftPct,'%',{card:'team'})
    +MV_STAGES.slice(0,3).map((s,i)=>mvTF(`Conversion ${s} → ${MV_STAGES[i+1]}`,`team.conv.${i}`,t.team.conv[i],'%',{card:'team'})).join('')
    +MV_STAGES.slice(0,3).map((s,i)=>mvTF(`Time in ${s}`,`team.tis.${i}`,t.team.tis[i],'days',{card:'team'})).join('')
    +mvTF('Stalled after','team.stall',t.team.stall,'days without activity',{card:'team'})+mvTF('Direct share','team.direct',t.team.direct,'% of sales',{card:'team',hint:'sold without an external agent'});
  const reps=MV_REPS.map(r=>{const rt=t.reps[r.id]||{};return `<div class="mv-trep"><b>${r.name}</b>${rt.note?`<span class="in-mu"> · ${xesc(rt.note)}</span>`:''}${mvTF('Monthly sales',`reps.${r.id}.sales`,rt.sales,'€k',{card:'reps'})}${mvTF('Monthly commission',`reps.${r.id}.comm`,rt.comm,'€k',{card:'reps'})}${mvTF('Activity override',`reps.${r.id}.ovr.act`,(rt.ovr||{}).act,'actions / week',{card:'reps',hint:'leave empty to use the team target'})}${mvTF('First-touch override',`reps.${r.id}.ovr.ft`,(rt.ovr||{}).ft,'minutes',{card:'reps'})}${MV_T.audit['reps.'+r.id]?`<span class="mv-au">${xesc(MV_T.audit['reps.'+r.id])}</span>`:''}</div>`;}).join('');
  const devs=MV_DEVS.map(d=>{const dt=t.devs[d.id]||{},th=dt.thr||{};return `<div class="mv-trep"><b>${d.name}</b>${mvTF('Planned velocity',`devs.${d.id}.vel`,dt.vel,'units / week',{card:'devs',ro:devRo})}${mvTF(`Financing threshold (${th.kind==='value'?'value':'units'})`,`devs.${d.id}.thr.n`,th.n,th.kind==='value'?'€k':'units',{card:'devs',ro:devRo,hint:'units or value, as the bank sets it'})}${mvTF('Bank and date',`devs.${d.id}.thr.bank`,th.bank?`${th.bank} · ${th.date}`:null,'',{card:'devs',ro:true})}</div>`;}).join('');
  const none=t.sales.value==null&&t.team.act==null;
  return `${none?`<div class="st-note t-warn"><b>No targets yet</b><div>Dashboards show “Add a target” until the sales target and at least one team target are saved.</div></div>`:''}
    <div class="st-note t-neu"><div>Targets are stored monthly; weeks and quarters are worked out from them. A change applies from this month, so past reports keep the target that was in force. Every change is logged. An empty field stays empty, never 0.</div></div>
    <div class="mv-tgrid">${mvTCard('sales','Sales','Monthly closed sales for the whole team',sales)}${mvTCard('team','Team metrics','What every rep is measured against unless they have an override',team)}${mvTCard('reps','Per rep','Sales and commission targets, and overrides such as a new starter’s ramp',reps)}${mvTCard('devs','Developments',devRo?'Set by the developer or an admin':'Planned velocity and the bank’s financing threshold',devs,devRo)}</div>`;
}
function mvTSave(card){
  const now=`Changed on ${MV_NOW} by ${mvMe()}`;let n=0;
  document.querySelectorAll(`#mv-tc-${card} input[data-t]`).forEach(inp=>{
    const path=inp.dataset.t.split('.'), raw=inp.value.trim(), v=raw===''?null:Number(raw.replace(/[^\d.]/g,''));
    let o=MV_T; for(let i=0;i<path.length-1;i++){const k=path[i];if(o[k]==null)o[k]=/^\d+$/.test(path[i+1])?[]:{};o=o[k];}
    const k=path[path.length-1], was=o[k]; if(was===v||(was==null&&v==null)) return;
    o[k]=v; n++; MV_T.audit[inp.dataset.t]=`Changed from ${was==null?'Not set':was} on ${MV_NOW} by ${mvMe()}`;
  });
  MV.edit=null; stRender(); showToast(n?`${n} target${n>1?'s':''} saved · applies from November · logged`:'No changes');
}
(function mvSettings(){
  if(!window.BST||typeof ST_NAV_ACC==='undefined') return;
  if(!ST_NAV_ACC.some(([k])=>k==='targets')) ST_NAV_ACC.splice(ST_NAV_ACC.findIndex(([k])=>k==='sales')+1,0,['targets','Targets']);
  ST_ACCESS.targets={owner:'f',manager:'f'};
  window.BST.pages.targets={nav:'targets',t:'Targets',d:'Every target the dashboards and reports compare against. Status colours are always against these, never the team average.',b:[{k:'custom',render:()=>mvTargetsHtml()}]};
  Object.entries(window.BST.pages).forEach(([k,p])=>{if(p.tabs)p.tabs=p.tabs.filter(t=>t[1]!=='sales/targets');});
  window.BST.pages['sales/targets']=window.BST.pages.targets;
})();

// ---------- Weekly roll-up notification (Mon 07:00) ----------
if(typeof TQ_NOTIFS!=='undefined') TQ_NOTIFS.unshift(['mr44','manager','Reports','Weekly roll-up ready · week 44','Last week against your targets: sales, the five team metrics and what changed.','rollup','07:00','Today',{action:'Read roll-up',kind:'rollup'}]);
if(typeof bnAct==='function'){const b=bnAct;window.bnAct=bnAct=function(id){const n=BN&&BN.find(x=>x.id===id);if(n&&n.kind==='rollup'){n.read=true;tqBadge();if(tqBellOpen)bnToggle();mvRollOpen();return;}b(id);};}
if(typeof tqOpenRec==='function'){const b=tqOpenRec;window.tqOpenRec=tqOpenRec=function(rec){if(rec==='rollup'){if(tqBellOpen)bnToggle();mvRollOpen();return;}b(rec);};}
if(typeof tqRecLabel==='function'){const b=tqRecLabel;window.tqRecLabel=tqRecLabel=function(rec){return rec==='rollup'?'Weekly roll-up · week 44':b(rec);};}

// ---------- Channel at the POS step: read from the commission split, never typed separately ----------
if(typeof dcStep3==='function'){const b=dcStep3;window.dcStep3=dcStep3=function(o){
  const h=b(o), v=DCV, ext=v.ref&&v.ref.on&&!(typeof dfReps==='function'&&dfReps().includes(v.ref.name));
  const agency=ext&&typeof dfContact==='function'?dfContact(v.ref.name)?.company:'';
  const ch=agency?`Via external agent · ${xesc(agency)} (${xesc(v.ref.name)}) · ${v.ref.val}% of the commission`:ext?`Direct · referral fee to ${xesc(v.ref.name)}, who isn’t an agency`:'Direct · no external agency on the split';
  return h.replace(/(<div><div class="k">Split<\/div><div class="v">[\s\S]*?<\/div><\/div>)/,`$1<div><div class="k">Sales channel</div><div class="v">${ch}</div></div>`);
};}

// ---------- Reps keep their own dashboard, without forecasts ----------
if(typeof DB_DEFAULTS!=='undefined'){DB_DEFAULTS.rep=DB_DEFAULTS.rep.filter(k=>k!=='rep_commission_timeline');delete DB_WIDGETS.rep_commission_timeline;}
rpRender=mvReportsRender;
