/* Unit media (v3): one model for unit renders and views, shared by Edit development and Present Mode.
 *
 * Interiors catalogue (per development, ED06): rooms, layouts, finish packs and styles. Rooms and layouts carry
 * a rule ("2+ bedrooms", "outdoor space") so each unit gets the right list automatically.
 * Render = library asset with cat 'Render', a room, and optional layout / finish pack / style tags (empty = any).
 * View   = library asset with cat 'View', a direction, the room it's seen from and an optional floor range.
 * Both are scoped to units, unit types, or the whole development (units and types both empty).
 *
 * Present Mode reads the published (live) snapshot only; the editor previews against the draft.
 * Load before dev-editor.js. Functions read DEVS, UNITS, CR_* and deTypeKey at call time.
 */
const UM=(()=>{
  const MT='miami-tropic';
  const RULES=[['','Every unit'],['beds1','1+ bedrooms'],['beds2','2+ bedrooms'],['beds3','3+ bedrooms'],['outdoor','Outdoor space']];
  const DIRS=[['North','N'],['North-east','NE'],['East','E'],['South-east','SE'],['South','S'],['South-west','SW'],['West','W'],['North-west','NW']];
  const AXES=[['layouts','layout'],['packs','pack'],['styles','style']];
  const fits=(rule,u)=>!rule||(rule==='outdoor'?(u.ext||0)>0:u.beds>=Number(rule.slice(4)));
  const typeOf=u=>typeof deTypeKey==='function'?deTypeKey(u):`${u.beds}-bed`;
  const src=img=>/^(blob:|data:image\/|https?:\/\/)/.test(img||'')?img:'assets/present/'+(img||'');
  const dirAbbr=o=>DIRS.find(([n])=>n===o)?.[1]||'';
  const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

  // ---------- seeds: what a development starts with before anyone edits it ----------
  const asset=(cat,room,n,img,t={})=>({id:uid(cat==='View'?'v':'r'),n,img,cat,label:cat==='View'?'Illustrative':'Render',alt:n,cover:false,units:t.units||[],types:t.types||[],
    packs:t.packs||[],layouts:t.layouts||[],styles:t.styles||[],room,orient:t.orient||'',fmin:t.fmin??null,fmax:t.fmax??null,src:'Studio render'});

  const MT_PACKS=[
    {id:'sand',n:'Sand',d:'Light oak, warm whites, brushed brass',price:0,mode:'Included',def:false,dl:'31 Mar 2027',styles:[],
      mats:[{room:'Floor',name:'Light oak',finish:'',sw:'#D9C3A0'},{room:'Kitchen',name:'Matte ivory',finish:'',sw:'#EEE7DA'},{room:'Stone',name:'Crema marfil',finish:'',sw:'#E2D7C2'},{room:'Metal',name:'Brushed brass',finish:'',sw:'#C8A869'}],
      spec:[['Flooring','Engineered oak 190mm'],['Worktop','Quartz 20mm'],['Bathrooms','Porcelain 60×120']]},
    {id:'stone',n:'Stone',d:'Smoked oak, travertine, blackened steel',price:0,mode:'Included',def:true,dl:'31 Mar 2027',styles:[],
      mats:[{room:'Floor',name:'Smoked oak',finish:'',sw:'#9B7B5A'},{room:'Kitchen',name:'Taupe lacquer',finish:'',sw:'#B8A996'},{room:'Stone',name:'Travertine',finish:'',sw:'#CFC3AE'},{room:'Metal',name:'Black steel',finish:'',sw:'#3A3A3A'}],
      spec:[['Flooring','Engineered oak 220mm'],['Worktop','Travertine 30mm'],['Bathrooms','Travertine slab']]},
    {id:'dusk',n:'Dusk',d:'Walnut, verde marble, bronze',price:48000,mode:'Addition',def:false,dl:'31 Mar 2027',styles:[],
      mats:[{room:'Floor',name:'Walnut',finish:'',sw:'#6A4A30'},{room:'Kitchen',name:'Forest green',finish:'',sw:'#3E5A49'},{room:'Stone',name:'Verde Alpi',finish:'',sw:'#4F6F5C'},{room:'Metal',name:'Bronze',finish:'',sw:'#8C6A44'}],
      spec:[['Flooring','Walnut herringbone'],['Worktop','Verde Alpi 30mm'],['Bathrooms','Book-matched marble']]},
  ];
  function seedPacks(d){
    if(d.id===MT) return JSON.parse(JSON.stringify(MT_PACKS));
    const ids=(typeof CP_CATALOG!=='undefined'&&CP_CATALOG[d.id]?.packs)||CR_PACKS.map(p=>p.id);
    return CR_PACKS.filter(p=>ids.includes(p.id)).map(p=>({id:p.id,n:p.name,d:p.swatches.slice(0,3).map(s=>s.m).join(', '),price:p.delta*1000,mode:p.delta?'Addition':'Included',
      def:!!p.isDefault,dl:'30 Nov 2026',styles:[...p.styles],mats:p.swatches.map(s=>({room:s.n,name:s.m,finish:'',sw:s.c}))}));
  }
  function seedInteriors(d){
    const rooms=d.id===MT
      ?[['living','Living room',''],['kitchen','Kitchen',''],['dining','Dining',''],['master','Principal bedroom','beds1'],['bed2','Second bedroom','beds2'],['bathroom','Bathroom',''],['terrace','Terrace','outdoor']]
      :[['living','Living room',''],['kitchen','Kitchen',''],['master','Master bedroom','beds1'],['bed2','Second bedroom','beds2'],['bed3','Third bedroom','beds3'],['bathroom','Bathroom',''],['terrace','Terrace','outdoor']];
    const layIds=d.id===MT?['architect','open-kitchen']:((typeof CP_CATALOG!=='undefined'&&CP_CATALOG[d.id]?.layouts)||['architect']);
    const layRule={'open-kitchen':'beds1','third-bed':'beds2'};
    const styles=d.id===MT?[['coastal','Coastal'],['modern','Modern'],['classic','Classic']]:CR_STYLES.map(s=>[s.id,s.name]);
    return {rooms:rooms.map(([id,n,rule])=>({id,n,rule})),
      layouts:layIds.map(CR_LAYOUT).filter(Boolean).map(l=>({id:l.id,n:l.name,d:l.desc,price:l.delta*1000,rule:layRule[l.id]||'',def:!!l.isDefault})),
      styles:styles.map(([id,n])=>({id,n}))};
  }
  function seedAssets(d,units,packs){
    const has=id=>packs.some(p=>p.id===id), out=[];
    const r=(room,n,img,t={})=>{if((t.packs||[]).every(has)) out.push(asset('Render',room,n,img,t));};
    const v=(n,orient,room,img,t={})=>out.push(asset('View',room,n,img,{...t,orient}));
    if(d.id===MT){
      r('living','Living room — towards the bay','miami/hero-living.jpg',{packs:['stone'],styles:['coastal']});
      r('living','Living room — modern styling','miami/r-living.jpg',{packs:['stone'],styles:['modern']});
      r('living','Living room — out to the terrace','miami/r-terrace.jpg');
      r('kitchen','Kitchen — island and pantry wall','miami/r-kitchen.jpg',{packs:['sand']});
      r('kitchen','Kitchen — towards the living room','miami/r-kitchen2.jpg',{packs:['stone']});
      r('kitchen','Open-plan kitchen into dining','miami/r-dining.jpg',{layouts:['open-kitchen']});
      r('dining','Dining — seats eight','miami/r-dining.jpg');
      r('master','Principal bedroom — morning light','miami/r-detail.jpg');
      r('bathroom','Bathroom — travertine and oak','miami/r-bath.jpg');
      r('terrace','Terrace — outdoor living','miami/r-terrace.jpg');
      v('Bay views','North-east','living','miami/tower.jpg');
      v('Downtown Miami','East','master','skyline.jpg',{fmin:20});
      v('Cityscape','South','bed2','cine-aerial.jpg');
      v('Design district','West','kitchen','cine-dusk.jpg');
      return out;
    }
    r('living','Living room — open plan','interior.jpg');
    r('kitchen','Kitchen — fitted kitchen','render-oak.jpg',{packs:['signature']});
    r('kitchen','Kitchen — fitted kitchen','render-slate.jpg',{packs:['urban']});
    r('kitchen','Kitchen — fitted kitchen','render-stone.jpg',{packs:['riviera']});
    r('master','Master bedroom','render-oak.jpg');
    r('terrace','Terrace — pool deck','cine-pool.jpg');
    r('terrace','Terrace — at dusk','cine-dusk.jpg');
    // Views: one per distinct outlook in the inventory, linked to the units that have it.
    const pics={sea:'beach.jpg',harbour:'harbour.jpg',country:'cliffs.jpg',mdina:'cliffs.jpg',city:'skyline.jpg',courtyard:'park.jpg',garden:'park.jpg',pool:'pool.jpg',terrace:'cine-dusk.jpg'};
    const seen=new Map();
    units.forEach(u=>(u.views||[]).slice(0,4).forEach((name,i)=>{if(!seen.has(name)) seen.set(name,{i,units:[]});seen.get(name).units.push(u.id);}));
    [...seen].forEach(([name,{i,units:ids}],k)=>v(name,DIRS[(k*3)%8][0],i?'master':'living',
      Object.entries(pics).find(([key])=>name.toLowerCase().includes(key))?.[1]||'harbour.jpg',{units:ids}));
    return out;
  }

  // ---------- resolution ----------
  const scope=(a,u)=>a.units.includes(u.id)?3:a.types.includes(typeOf(u))?2:(!a.units.length&&!a.types.length)?1:0;
  const ok=(list,v)=>!list.length||list.includes(v);
  const livePacks=c=>c.packs.filter(p=>!p.retired);
  function defaults(c,u,packId){
    const layouts=c.interiors.layouts.filter(l=>fits(l.rule,u)), pack=livePacks(c).find(p=>p.id===packId)||livePacks(c).find(p=>p.def)||livePacks(c)[0];
    const styles=c.interiors.styles.filter(s=>!pack?.styles?.length||pack.styles.includes(s.id));
    return {layout:(layouts.find(l=>l.def)||layouts[0])?.id||'',pack:(livePacks(c).find(p=>p.def)||livePacks(c)[0])?.id||'',style:styles[0]?.id||c.interiors.styles[0]?.id||''};
  }
  const roomsFor=(c,u)=>c.interiors.rooms.filter(r=>fits(r.rule,u));
  const rendersFor=(c,u,room)=>c.assets.filter(a=>a.cat==='Render'&&a.img&&a.room===room&&scope(a,u));
  // What a buyer sees in one room. A chosen option with no render of its own falls back to the default for that
  // option, so the images stay put rather than going blank. Unit-specific renders beat type renders beat
  // development renders; exact tags sort ahead of "any".
  function pick(c,u,room,combo){
    const all=rendersFor(c,u,room), def=defaults(c,u,combo.pack), eff={...combo};
    AXES.forEach(([k,v])=>{if(!all.some(a=>a[k].includes(combo[v]))) eff[v]=def[v];});
    const exact=a=>AXES.reduce((n,[k,v])=>n+(a[k].includes(eff[v])?1:0),0);
    for(const drop of [[],['styles'],['styles','packs'],['styles','packs','layouts']]){
      let m=all.filter(a=>AXES.every(([k,v])=>drop.includes(k)||ok(a[k],eff[v])));
      if(!m.length) continue;
      const top=Math.max(...m.map(a=>scope(a,u)));
      m=m.filter(a=>scope(a,u)===top).sort((a,b)=>exact(b)-exact(a));
      return {renders:m,eff,fell:AXES.filter(([,v])=>eff[v]!==combo[v]).map(([,v])=>v)};
    }
    return {renders:[],eff,fell:[]};
  }
  function resolve(c,u,combo){
    return roomsFor(c,u).map(r=>({id:r.id,n:r.n,...pick(c,u,r.id,combo)})).filter(r=>r.renders.length);
  }
  // Options worth offering on screen: the default plus anything with a render of its own for this unit.
  function axes(c,u,packId){
    const def=defaults(c,u,packId), mine=c.assets.filter(a=>a.cat==='Render'&&a.img&&a.room&&scope(a,u));
    const tagged=k=>new Set(mine.flatMap(a=>a[k]));
    const pack=livePacks(c).find(p=>p.id===packId);
    const list=(k,v,items)=>{const t=tagged(k);return items.filter(x=>x.id===def[v]||t.has(x.id));};
    return {layout:list('layouts','layout',c.interiors.layouts.filter(l=>fits(l.rule,u))),
      pack:list('packs','pack',livePacks(c)),
      style:list('styles','style',c.interiors.styles.filter(s=>!pack?.styles?.length||pack.styles.includes(s.id))),def};
  }
  const viewsFor=(c,u)=>c.assets.filter(a=>a.cat==='View'&&a.img&&scope(a,u)&&(a.fmin==null||u.floor>=a.fmin)&&(a.fmax==null||u.floor<=a.fmax))
    .sort((a,b)=>scope(b,u)-scope(a,u));
  const roomName=(c,id)=>c.interiors.rooms.find(r=>r.id===id)?.n||'';
  function tagText(c,a){
    const nm=(list,ids)=>ids.map(id=>list.find(x=>x.id===id)?.n||id).join(' / ');
    return [a.packs.length&&nm(c.packs.map(p=>({id:p.id,n:p.n})),a.packs)+' finish',a.styles.length&&nm(c.interiors.styles,a.styles)+' style',a.layouts.length&&nm(c.interiors.layouts,a.layouts)].filter(Boolean).join(' · ');
  }
  function scopeText(a,u){return a.units.length&&(!u||a.units.includes(u.id))?(a.units.length===1?'This unit':a.units.length+' units'):a.types.length?'All '+a.types.join(', ')+' units':'Whole development';}

  // ---------- filenames: kitchen_riviera_coastal_2bed.jpg → room, finish, style, type ----------
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function guess(c,units,name){
    const base=name.replace(/\.\w+$/,''), tokens=base.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), flat=norm(base);
    const hit=items=>items.filter(x=>[x.id,x.n,String(x.n||'').split(/\s+/)[0]].map(norm).filter(k=>k.length>=3).some(k=>tokens.includes(k)||(k.length>=6&&flat.includes(k))));
    const roomAlias={living:['living','lounge','sitting'],kitchen:['kitchen','kit'],dining:['dining'],master:['master','principal','bedroom1','bed1'],bed2:['bed2','bedroom2'],bed3:['bed3','bedroom3'],bathroom:['bath','bathroom','ensuite','wc'],terrace:['terrace','balcony','deck']};
    const room=c.interiors.rooms.find(r=>(roomAlias[r.id]||[r.id,norm(r.n)]).some(k=>tokens.includes(k)||flat.includes(norm(r.n))))?.id||'';
    const types=[...new Set(units.map(typeOf))].filter(t=>{const k=norm(t);return tokens.includes(k)||flat.includes(k);});
    const unitHits=units.filter(u=>flat.includes(norm(u.id))).map(u=>u.id);
    return {room,cat:/view|outlook|vista/.test(flat)?'View':'Render',packs:hit(c.packs.map(p=>({id:p.id,n:p.n}))).map(x=>x.id),styles:hit(c.interiors.styles).map(x=>x.id),
      layouts:hit(c.interiors.layouts).filter(l=>l.id!=='architect'||tokens.includes('architect')).map(x=>x.id),types,units:unitHits,
      orient:DIRS.find(([n,a])=>tokens.includes(a.toLowerCase())||tokens.includes(norm(n)))?.[0]||''};
  }
  const autoAlt=(c,a)=>[a.cat==='View'?(a.n||'View'):(roomName(c,a.room)||'Interior')+' render',tagText(c,a)].filter(Boolean).join(', ');

  return {MT,RULES,DIRS,fits,typeOf,src,dirAbbr,uid,asset,seedPacks,seedInteriors,seedAssets,defaults,roomsFor,rendersFor,pick,resolve,axes,viewsFor,
    roomName,tagText,scopeText,scope,guess,autoAlt,livePacks};
})();
