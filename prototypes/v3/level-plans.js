/* Level plans (v3): where each unit sits on a floor drawing. Shared by Edit development and Present Mode.
 *
 * Level plan = one drawing used by a range of floors ("Typical floor · 2–40"), with the unit outlines found on it.
 *   {id, n, from, to, w, h, img, ver, file, core:[x,y,w,h]|null, slots:[{id, label, r:[x,y,w,h]}]}
 *   Coordinates are in the drawing's own box (w × h). Present scales them onto its plate.
 * Placement = how a unit maps to a plan. Automatic unless someone overrides it:
 *   auto   the outline label on the drawing matches the unit reference (03 → AP.3203 on floor 32; CM1207 → #CM1207)
 *   manual someone picked an outline:          placements[uid] = {level, slot, by, at}
 *   drawn  someone drew an outline for this unit only: placements[uid] = {level, rect, by, at}
 *   none   no level plan applies:              placements[uid] = {none:true, reason, by, at}
 * Load before dev-editor.js. Present reads the published (live) content only.
 */
const LP=(()=>{
  const W=880, H=420, FRAME=[36,36,808,348];
  const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const pad=n=>String(Math.abs(n)).padStart(2,'0');
  const floorLabel=f=>f===0?'Ground floor':f<0?'Basement '+Math.abs(f):'Floor '+f;
  const range=l=>l.from===l.to?floorLabel(l.from):`Floors ${l.from}–${l.to}`;
  const covers=(l,f)=>f>=l.from&&f<=l.to;
  const short=id=>String(id).replace(/^#/,'');

  // ---------- seeds ----------
  const MT_RECTS=[[40,40,210,230],[250,40,210,110],[460,40,210,110],[670,40,170,230],[680,270,160,110],[520,270,160,110],[360,270,160,110],[200,270,160,110],[40,270,160,110]];
  const level=(id,n,from,to,slots,t={})=>({id,n,from,to,w:W,h:H,img:t.img||null,ver:t.ver||'v1',file:t.file||'',core:t.core||null,slots});
  function seed(d,units){
    if(d.id==='miami-tropic'){
      const slots=()=>MT_RECTS.map((r,i)=>({id:'p'+pad(i+1),label:pad(i+1),r:[...r]}));
      return [level('typ','Typical floor',2,40,slots(),{ver:'v3',file:'MT_GA_Typical_L02-40_v3.pdf',core:[250,150,420,120]}),
        level('ph','Penthouse floors',41,42,slots(),{ver:'v1',file:'MT_GA_Penthouse_L41-42_v1.pdf',core:[250,150,420,120]})];
    }
    // Other developments: one drawing per floor, outlines labelled with the unit reference as drawn by the architect.
    const floors=[...new Set(units.map(u=>u.floor))].sort((a,b)=>a-b);
    return floors.map(f=>{
      const us=units.filter(u=>u.floor===f), w=800/Math.max(1,us.length);
      // La Lex floor 1: the architect labelled one flat "Unit 20", so it can't be matched automatically.
      const label=u=>d.id==='lalex'&&u.id==='#CM9820'?'Unit 20':short(u.id);
      return level('f'+f,floorLabel(f),f,f,us.map((u,i)=>({id:'s'+i,label:label(u),r:[Math.round(40+i*w),40,Math.round(w),340]})),
        {ver:f<2?'v2':'v1',file:`${d.name} GA L${f} ${f<2?'v2':'v1'}.pdf`});
    });
  }

  // ---------- resolution ----------
  const matches=(label,u)=>{const L=norm(label), I=norm(u.id);return !!L&&(I===L||(I.length>L.length&&I.endsWith(L)&&I.slice(0,-L.length).endsWith(pad(u.floor))));};
  const levelsFor=(c,f)=>c.levels.filter(l=>covers(l,f));
  const byId=(c,id)=>c.levels.find(l=>l.id===id);
  function own(c,u){
    const p=c.placements?.[u.id];
    if(p?.none) return {how:'none',reason:p.reason||'',by:p.by,at:p.at};
    if(p?.level){
      const l=byId(c,p.level);
      if(!l) return {how:'manual',issue:'no-plan',by:p.by,at:p.at};
      if(p.rect) return {how:'drawn',level:l,rect:p.rect,label:short(u.id),by:p.by,at:p.at,issue:covers(l,u.floor)?null:'wrong-floor'};
      const s=l.slots.find(x=>x.id===p.slot);
      return s?{how:'manual',level:l,slot:s,rect:s.r,label:s.label,by:p.by,at:p.at,issue:covers(l,u.floor)?null:'wrong-floor'}:{how:'manual',level:l,issue:'unplaced',by:p.by,at:p.at};
    }
    const ls=levelsFor(c,u.floor);
    for(const l of ls){const s=l.slots.find(x=>matches(x.label,u));if(s) return {how:'auto',level:l,slot:s,rect:s.r,label:s.label};}
    return {how:'auto',level:ls[0]||null,issue:ls.length?'no-match':'no-plan'};
  }
  // Placements for every unit on one floor, with clashes flagged (two units on one outline).
  function floor(c,units,f){
    const out=new Map(), seen=new Map();
    units.filter(u=>u.floor===f).forEach(u=>{
      const p=own(c,u); out.set(u.id,p);
      if(p.slot){const k=p.level.id+'|'+p.slot.id;if(seen.has(k)){p.issue='clash';p.with=seen.get(k);const o=out.get(seen.get(k));o.issue='clash';o.with=u.id;}else seen.set(k,u.id);}
    });
    return out;
  }
  const place=(c,units,u)=>floor(c,units,u.floor).get(u.id);
  const issues=(c,units)=>units.map(u=>({u,p:place(c,units,u)})).filter(x=>x.p.issue);
  const ISSUE={'no-plan':'No level plan covers this floor','no-match':'No outline label matches this unit','unplaced':'Plan chosen, position not set','clash':'Shares an outline with another unit','wrong-floor':'The chosen plan doesn’t cover this floor'};
  const HOW={auto:'Automatic',manual:'Set manually',drawn:'Own outline',none:'Not on a plan'};
  const occupant=(c,units,l,f,slotId)=>{const m=floor(c,units,f);for(const [id,p] of m) if(p.level?.id===l.id&&p.slot?.id===slotId) return id;return null;};
  // Plan box → Present plate box (880 × 420 with a 36px frame).
  const toPlate=(l,r)=>{const sx=W/l.w, sy=H/l.h;return [r[0]*sx,r[1]*sy,r[2]*sx,r[3]*sy];};

  return {W,H,FRAME,norm,pad,short,floorLabel,range,covers,seed,matches,levelsFor,byId,own,floor,place,issues,occupant,toPlate,ISSUE,HOW};
})();
