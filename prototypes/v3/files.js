/* ═══════════════ FILES: floor plans and brochures without a proposal ═══════════════
   One control wherever a home or development appears (unit page, development page, the opportunity's linked
   units, the contact page). Every file has the same three actions:
   Download   a real PDF built from the published development content (proposal/proposal-pdf.js writes it)
   Copy link  bricly.mt/f/<hash>, always the current version of that file
   Send       to a buyer: opens the opportunity's message box with the file attached (client-share.js logs it)
   Download and Copy link aren't tied to a buyer, so only Send is recorded in Shared with client.
   Keys match the message box's Attach list: fp:<unit id> · br|pl|ss:<development name>.
   Load after client-share.js and send-buyer.js. */
(function(){
  const E=s=>xesc(String(s??''));
  const D=()=>window.PV3D, X=()=>window.ProposalPDF;
  const devRec=name=>DEV(name)||DEVS.find(d=>d.name===name);
  const ccy=dev=>{try{return D()?D().commerce(devRec(dev)?.id).currency:'EUR';}catch(e){return 'EUR';}};
  const money=(n,dev)=>window.PV3&&PV3.fmtIn?PV3.fmtIn(n,ccy(dev)):fmtEur(n);
  const area=(m2,u)=>window.PV3&&PV3.ar?PV3.ar(m2,u):`${m2} m²`;
  const bed=u=>u.beds?`${u.beds} bed`:'Studio';
  const OK=u=>u&&['available','hold'].includes(u.status);
  // 'devbrochure', not 'brochure': old personalised brochures fold into the proposal (client-share.js swFold).
  const KIND={floorplan:'Floor plan',devbrochure:'Brochure',pricelist:'Price list',spec:'Specification'};

  // ---------- which files ----------
  function list(units,devs){
    const us=[...new Set(units)].map(UN).filter(Boolean), ds=[...new Set([...devs,...us.map(u=>u.dev)])].filter(n=>devRec(n));
    return [
      ...us.map(u=>({k:'fp:'+u.id,type:'floorplan',title:`Floor plan · ${u.id}`,units:[u.id],dev:u.dev,sub:`${u.dev} · ${bed(u)} · ${area(u.sqm,u)}`})),
      ...ds.flatMap(n=>[
        {k:'br:'+n,type:'devbrochure',title:`Brochure · ${n}`,units:[],dev:n,sub:'The development, its homes and type plans'},
        {k:'pl:'+n,type:'pricelist',title:`Price list · ${n}`,units:[],dev:n,sub:'Available homes, prices and the payment plan'},
        {k:'ss:'+n,type:'spec',title:`Specification · ${n}`,units:[],dev:n,sub:'Finishes and materials'},
      ]),
    ];
  }
  const forUnit=uid=>{const u=UN(uid);return u?list([uid],[u.dev]):[];};
  // A development's type plans: one home of each size stands for its type.
  function typeUnits(name){const by={};UNITS.filter(u=>u.dev===name).forEach(u=>{if(!by[u.beds]||OK(u)&&!OK(by[u.beds]))by[u.beds]=u;});return Object.values(by).sort((a,b)=>a.beds-b.beds);}
  const forDev=name=>list(typeUnits(name).map(u=>u.id),[name]);
  const forOpp=o=>list(o.units,o.devs);
  const find=k=>{const [t,rest]=[k.slice(0,2),k.slice(3)];return t==='fp'?forUnit(rest)[0]:list([],[rest]).find(f=>f.k===k);};

  // ---------- PDFs ----------
  async function planImage(u,maxW){
    const P=X(), url=(D()&&D().planImg(u))||(u.unitPlan&&/^image\//.test(u.unitPlan.type||'')&&u.unitPlan.url)||(u.dev==='Miami Tropic'&&D()?D().asset+'miami/plan.png':'');
    if(url){const im=await P.jpeg(url,{maxW});if(im)return im;}
    const svg=unPlanSVG(u,560).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="1260" height="840" ').replace(/style="[^"]*"/,'');
    return P.jpeg(svg,{svg:true,maxW});
  }
  function frame(doc,dev,title,sub){
    const P=X(), d=devRec(dev), b=D()?D().brand(d?.id):{accent:'#1d1d1b'}, M=48, CW=P.W-M*2, acc=b.accent||'#1d1d1b';
    const pg=doc.page();
    pg.rect(0,0,P.W,6,{fill:acc});
    pg.text(M,30,d?d.name:dev,{size:9,bold:true,color:'#6b6760'});
    pg.text(P.W-M,30,d&&d.loc?d.loc:'',{size:9,color:'#6b6760',align:'right'});
    let y=pg.wrap(M,58,CW,title,{size:22,bold:true,color:'#1d1d1b',lh:1.2});
    if(sub) y=pg.wrap(M,y+2,CW,sub,{size:11,color:'#6b6760'});
    return {pg,y:y+14,M,CW,acc};
  }
  const img=(f,im,y,maxH)=>{if(!im)return y;const k=Math.min(f.CW/im.w,maxH/im.h),w=im.w*k,h=im.h*k;f.pg.image(im,f.M+(f.CW-w)/2,y,w,h);return y+h+14;};
  const row=(f,y,cells,o={})=>{const w=f.CW/cells.length;cells.forEach((c,i)=>f.pg.text(i===cells.length-1&&o.right?f.M+f.CW:f.M+i*w,y,c,{size:o.size||9.5,bold:o.bold,color:o.color||'#1d1d1b',align:i===cells.length-1&&o.right?'right':undefined}));f.pg.line(f.M,y+13,f.M+f.CW,y+13);return y+19;};
  const facts=(f,y,pairs)=>{const w=f.CW/Math.min(5,pairs.length);pairs.forEach(([l,v],i)=>{const x=f.M+(i%5)*w,yy=y+Math.floor(i/5)*36;f.pg.text(x,yy,l,{size:8,color:'#6b6760'});f.pg.text(x,yy+11,v,{size:11,bold:true});});return y+Math.ceil(pairs.length/5)*36+6;};
  const unitFacts=u=>[['Bedrooms',String(u.beds)],['Bathrooms',String(u.baths||'—')],['Internal',area(u.sqm,u)],['Terrace',u.ext?area(u.ext,u):'—'],['Floor',u.floor===0?'Ground':String(u.floor)]];

  async function build(file){
    const P=X(), doc=P.create(), dev=file.dev, d=devRec(dev);
    if(file.type==='floorplan'){
      const u=UN(file.units[0]), f=frame(doc,dev,`Floor plan · ${u.id}`,`${u.dev} · ${bed(u)}${u.type?' · '+u.type:''}`);
      let y=facts(f,f.y,unitFacts(u));
      y=img(f,await planImage(u,1400),y,430);
      f.pg.wrap(f.M,y,f.CW,'Indicative layout. Dimensions are approximate and the drawing is not to scale.',{size:8.5,color:'#6b6760'});
    }
    if(file.type==='devbrochure'){
      const hero=D()?await P.jpeg(D().hero(d)||('assets/present/'+d.photo),{maxW:1400}):null;
      let f=frame(doc,dev,d.name,[d.tag,d.loc,d.completion?'Completion '+d.completion:''].filter(Boolean).join(' · '));
      let y=img(f,hero,f.y,330);
      y=f.pg.wrap(f.M,y,f.CW,d.about||'',{size:11,lh:1.5})+10;
      if(d.amen&&d.amen.length){f.pg.text(f.M,y,'Amenities',{size:12,bold:true});y+=18;d.amen.forEach(a=>{f.pg.text(f.M,y,'•  '+a,{size:10});y+=15;});y+=8;}
      if(d.dist&&d.dist.length&&y<P.H-160){f.pg.text(f.M,y,'Close by',{size:12,bold:true});y+=18;d.dist.forEach(([n,t])=>{f.pg.text(f.M,y,n,{size:10});f.pg.text(f.M+f.CW,y,t,{size:10,color:'#6b6760',align:'right'});y+=15;});}
      const types=typeUnits(d.name);
      for(let i=0;i<types.length;i+=2){
        f=frame(doc,dev,i?'Homes (continued)':'Homes',i?'':'Each type with its plan. Prices are from the current price list.');
        let yy=f.y;
        for(const u of types.slice(i,i+2)){
          const same=UNITS.filter(x=>x.dev===d.name&&x.beds===u.beds), avail=same.filter(OK), from=avail.length?Math.min(...avail.map(x=>x.price)):0;
          f.pg.text(f.M,yy,u.beds?`${u.beds}-bedroom homes`:'Studios',{size:13,bold:true});
          f.pg.text(f.M+f.CW,yy,from?'From '+money(from,dev):'Sold out',{size:12,bold:true,color:f.acc,align:'right'});
          yy=f.pg.text(f.M,yy+18,`${avail.length} of ${same.length} available · ${area(Math.min(...same.map(x=>x.sqm)),u)} to ${area(Math.max(...same.map(x=>x.sqm)),u)}`,{size:9.5,color:'#6b6760'});
          yy=img(f,await planImage(u,1100),yy+4,250);
        }
      }
    }
    if(file.type==='pricelist'){
      const f=frame(doc,dev,'Price list',`Prices as of ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · subject to availability`);
      let y=row(f,f.y,['Home','Type','Floor','Internal','Terrace','Status','Price'],{bold:true,size:9,color:'#6b6760',right:true});
      UNITS.filter(u=>u.dev===d.name&&OK(u)).sort((a,b)=>a.price-b.price).forEach(u=>{
        if(y>P.H-170) return;
        y=row(f,y,[u.id,bed(u),u.floor===0?'Ground':String(u.floor),area(u.sqm,u),u.ext?area(u.ext,u):'—',u.status==='hold'?'On hold':'Available',money(u.price,dev)],{right:true});
      });
      const plan=D()?D().commerce(d.id).plan:null;
      if(plan&&plan.length){y+=14;f.pg.text(f.M,y,'Payment plan',{size:12,bold:true});y+=18;plan.forEach(([l,w,p])=>{f.pg.text(f.M,y,p+'%',{size:10,bold:true,color:f.acc});f.pg.text(f.M+40,y,`${l} · ${w}`,{size:10});y+=16;});}
      f.pg.wrap(f.M,P.H-110,f.CW,'Prices can change and homes can sell at any time. Ask your adviser to confirm before you decide.',{size:8.5,color:'#6b6760'});
    }
    if(file.type==='spec'){
      const f=frame(doc,dev,'Specification',`${d.name} · finishes and materials`);
      let y=f.y; const fins=D()?D().finishesFor(d.id):[];
      if(!fins.length) y=f.pg.wrap(f.M,y,f.CW,'The full specification is being finalised. Your adviser can share the current finishes schedule.',{size:11});
      fins.forEach(fin=>{
        if(y>P.H-140) return;
        f.pg.text(f.M,y,fin.name,{size:13,bold:true});
        f.pg.text(f.M+f.CW,y,fin.delta?'+ '+money(fin.delta,dev):'Included',{size:10,color:f.acc,align:'right'});y+=18;
        if(fin.mood) y=f.pg.wrap(f.M,y,f.CW,fin.mood,{size:9.5,color:'#6b6760'})+2;
        (fin.spec||[]).forEach(([room,what])=>{f.pg.text(f.M,y,room,{size:9.5,color:'#6b6760'});f.pg.text(f.M+120,y,what,{size:9.5});y+=15;});
        y+=12;
      });
      f.pg.wrap(f.M,P.H-110,f.CW,'Materials may be replaced with equivalents of the same quality.',{size:8.5,color:'#6b6760'});
    }
    const n=doc.pages.length;
    doc.pages.forEach((pg,i)=>pg.text(P.W-48,P.H-34,`${file.title} · page ${i+1} of ${n}`,{size:8,color:'#6b6760',align:'right'}));
    return {blob:doc.blob({title:file.title,author:d?d.name:''}),pages:n};
  }
  const fileName=f=>f.title.replace(/ · /g,'-').replace(/[^\w.-]+/g,'-').replace(/-+/g,'-')+'.pdf';

  // ---------- actions ----------
  let busy=false;
  async function download(k){
    const f=find(k); if(!f||busy) return; busy=true;
    showToast(`Preparing ${f.title}…`);
    try{const r=await build(f);window.__lastFile={name:fileName(f),pages:r.pages,size:r.blob.size};X().save(r.blob,fileName(f));showToast(`${f.title} downloaded`);}
    catch(e){showToast('The PDF couldn’t be made. Try again.');}
    busy=false;
  }
  const linkOf=k=>'bricly.mt/f/'+swHash('file:'+k).toString(36).slice(0,6);
  function copy(k){
    const f=find(k), l=linkOf(k); if(!f) return;
    try{navigator.clipboard&&navigator.clipboard.writeText('https://'+l).catch(()=>{});}catch(e){/* clipboard blocked */}
    showToast(`Link copied · ${l} always opens the current ${KIND[f.type].toLowerCase()}`);
  }
  // Send attaches the file to a buyer's message. From an opportunity it goes straight there; elsewhere the rep picks the buyer.
  function attachTo(o,k){
    qaDrawerClose();
    const go=()=>{const p=swAttPicks(o);if(!p.includes(k))p.push(k);if(typeof oppComposeCh!=='undefined'&&oppComposeCh==='note')oppComposeCh='wa';qaMessage();};
    if(oppCur!==o||!document.getElementById('opp-comp')){openOpp(o.id);setTimeout(go,30);} else go();
  }
  let PICK={k:null,q:''};
  function send(k,oppId){
    const f=find(k); if(!f) return;
    if(oppId){attachTo(OPPS.find(o=>o.id===oppId),k);return;}
    PICK={k,q:''}; pickRender();
  }
  function pickRender(){
    const f=find(PICK.k), q=PICK.q.trim().toLowerCase();
    const open=OPPS.filter(o=>!(typeof EXIT_STAGES!=='undefined'&&EXIT_STAGES.includes(o.stage)));
    const hasHome=o=>f.units.some(u=>o.units.includes(u));
    const linked=open.filter(o=>hasHome(o)||o.devs.includes(f.dev)).sort((a,b)=>hasHome(b)-hasHome(a));
    const rest=open.filter(o=>!linked.includes(o)&&(!q||o.lead.toLowerCase().includes(q)));
    const opt=o=>`<button type="button" class="fl-pick" onclick="FL.attach('${o.id}')"><span><b>${E(o.lead)}</b><span class="st-sub">${E(o.devs.join(', ')||'No development')} · ${E(o.units.join(', ')||'no homes linked')}</span></span><span class="sh-chip">${E(o.stage)}</span></button>`;
    const shown=linked.filter(o=>!q||o.lead.toLowerCase().includes(q));
    qaDrawerOpen(`Send ${f.title}`,`<div class="fl-send">
      <label class="sb-ol" for="fl-q">Which buyer?</label><input id="fl-q" class="fl-q" placeholder="Search buyers" value="${E(PICK.q)}" oninput="FL.pickSearch(this.value)">
      ${shown.length?`<div class="sb-ol">Interested in ${E(f.units[0]?f.units[0]+' or '+f.dev:f.dev)}</div>${shown.map(opt).join('')}`:''}
      ${rest.length?`<div class="sb-ol">${q?'Other buyers':'Other open opportunities'}</div>${rest.slice(0,q?20:6).map(opt).join('')}`:''}
      ${!shown.length&&!rest.length?'<div class="st-sub">No buyer matches.</div>':''}
      <div class="st-sub fl-note">It opens ${'the buyer’s'} message box with the file attached. You add a line and send it on WhatsApp, SMS or email.</div></div>`,
      `<button class="btn-ghost" onclick="qaDrawerClose()">Cancel</button>`);
    const i=document.getElementById('fl-q'); if(i&&q){i.focus();i.setSelectionRange(i.value.length,i.value.length);}
  }

  // ---------- the control ----------
  const ICON={floorplan:'PLAN',devbrochure:'PDF',pricelist:'PDF',spec:'PDF'};
  function rows(files,oppId){
    return `<div class="fl-list">${files.map(f=>`<div class="fl-row" data-fl="${E(f.k)}">
      <span class="file-ic">${ICON[f.type]}</span>
      <span class="fl-t"><b>${E(f.title)}</b><span>${E(f.sub)}</span></span>
      <span class="fl-acts"><button type="button" class="sh-btn" onclick="FL.download('${E(f.k)}')" aria-label="Download ${E(f.title)}">Download</button><button type="button" class="sh-btn" onclick="FL.copy('${E(f.k)}')" aria-label="Copy link to ${E(f.title)}">Copy link</button><button type="button" class="sh-btn primary" onclick="FL.send('${E(f.k)}'${oppId?`,'${oppId}'`:''})" aria-label="Send ${E(f.title)} to ${oppId?'this buyer':'a buyer'}">Send</button></span>
    </div>`).join('')}</div>`;
  }
  function openFor(scope,id){
    // A contact with one opportunity sends straight to it; with several, Send asks which one.
    const cOpps=scope==='contact'?contactOpps(id):[];
    const o=scope==='opp'?OPPS.find(x=>x.id===id):cOpps.length===1?cOpps[0]:null;
    const files=scope==='unit'?forUnit(id):scope==='dev'?forDev(id):scope==='contact'?list(cOpps.flatMap(x=>x.units),cOpps.flatMap(x=>x.devs)):o?forOpp(o):[];
    const name=scope==='unit'?id:scope==='dev'?id:o?o.lead.split(' ')[0]:'';
    const head=o?`Floor plans and brochures for ${E(name)}’s homes. Send attaches the file to a message to ${E(name)}.`
      :`Download a PDF, copy a link to paste anywhere, or send it to a buyer. Only sends are recorded on the buyer.`;
    qaDrawerOpen(`Floor plans and brochures${name&&!o?' · '+E(name):''}`,files.length?`<div class="fl-drawer"><p class="st-sub">${head}</p>${rows(files,o&&o.id)}</div>`
      :`<div class="sb-warn">Link a development or a home first.</div>`,`<button class="btn-ghost" onclick="qaDrawerClose()">Close</button>`);
  }
  function contactOpps(cid){
    const c=CONTACTS.find(x=>x.id===cid);
    return c?OPPS.filter(o=>((c.oppIds||[]).includes(o.id)||o.lead===c.name)&&!(typeof EXIT_STAGES!=='undefined'&&EXIT_STAGES.includes(o.stage))):[];
  }

  window.FL={list,forUnit,forDev,forOpp,find,build,download,copy,send,rows,open:openFor,linkOf,
    attach:id=>attachTo(OPPS.find(o=>o.id===id),PICK.k),pickSearch:v=>{PICK.q=v;pickRender();}};

  // ---------- where it shows ----------
  // Unit page: Actions › Floor plan and brochure (was a placeholder Share brochure).
  window.unShareBrochure=()=>openFor('unit',unCur.id);
  // Development page: Documents rows and type plans download real files.
  window.dvFileRow=function(f){
    const d=dvCur, k=/brochure/i.test(f.n)?'br:':/price/i.test(f.n)?'pl:':/spec/i.test(f.n)?'ss:':null;
    const acts=k&&d?`<button class="sh-btn" onclick="FL.download('${k}${E(d.name)}')">Download</button><button class="sh-btn" onclick="FL.copy('${k}${E(d.name)}')">Copy link</button><button class="sh-btn primary" onclick="FL.send('${k}${E(d.name)}')">Send</button>`
      :`<button class="sh-btn" onclick="showToast('Original file · ${E(f.n)}')">Download</button>`;
    return `<div class="file-row"><span class="file-ic">${f.n.includes('.xlsx')?'XLS':'PDF'}</span>
      <span style="flex:1;min-width:0"><div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${E(f.n)}</div><div style="font-size:11.5px;color:var(--muted)">${E(f.s)} · ${E(f.d)}${k?' · download is the current version':''}</div></span>${acts}</div>`;
  };
  const baseDev=window.renderDev;
  if(baseDev) window.renderDev=function(){
    const r=baseDev.apply(this,arguments), d=dvCur; if(!d) return r;
    document.querySelectorAll('#p-development .media-it[onclick^="openUnPeek"]').forEach(el=>{
      const uid=/openUnPeek\('([^']+)'\)/.exec(el.getAttribute('onclick'))?.[1]; if(!uid||el.querySelector('.fl-mini')) return;
      el.querySelector('.cap')?.insertAdjacentHTML('beforeend',`<button type="button" class="fl-mini" onclick="event.stopPropagation();FL.download('fp:${E(uid)}')" aria-label="Download the ${E(uid)} type plan">PDF</button>`);
    });
    const m=document.getElementById('dv-actions-menu');
    if(m&&!m.querySelector('[data-fl]')) m.insertAdjacentHTML('afterbegin',`<button data-fl onclick="dvAct(()=>FL.open('dev','${E(d.name)}'))"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="2" width="9" height="10" rx="1.5"/><path d="M5 5h4M5 7.5h4"/></svg>Floor plans and brochure</button>`);
    return r;
  };
  // Opportunity: the Linked units card gets Floor plans and brochures under its homes.
  const baseOpp=window.renderOpp;
  if(baseOpp) window.renderOpp=function(){
    const r=baseOpp.apply(this,arguments), o=oppCur, card=document.getElementById('opp-units-card');
    if(o&&card&&!card.querySelector('[data-fl]')&&(o.units.length||o.devs.length)){
      const note=card.querySelector('.rail-note');
      const btn=`<button type="button" class="btn-ghost fl-card-btn" data-fl onclick="FL.open('opp','${o.id}')">Floor plans and brochures</button>`;
      if(note) note.insertAdjacentHTML('beforebegin',btn); else card.insertAdjacentHTML('beforeend',btn);
    }
    return r;
  };
  // Contact page: the Shared with tab has Floor plans and brochures next to Send proposal (contact-page.js).
})();
