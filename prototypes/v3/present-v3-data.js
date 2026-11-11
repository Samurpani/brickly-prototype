/* Present Mode v3 data: per-development branding, brochure content and the
 * Miami Tropic showcase inventory. Load after the inline CRM script (DEVS, UNITS,
 * CR_PACKS exist) and before present-v3.js. Each development carries its own
 * brand, which the presentation loads when that development is on screen.
 */
(() => {
  'use strict';
  const A = 'assets/present/';
  const MT = 'miami-tropic';

  const FEATURES = {
    sea:{label:'Sea view',icon:'waves'}, terrace:{label:'Terrace',icon:'deck'}, pool:{label:'Pool',icon:'pool'},
    garden:{label:'Garden',icon:'potted_plant'}, parking:{label:'Parking',icon:'local_parking'}, storage:{label:'Storage',icon:'deployed_code'},
    corner:{label:'Corner',icon:'select_all'}, nature:{label:'Nature',icon:'park'},
  };
  // Gallery tiles follow the Figma filter panel; availability tiles follow the availability design.
  const GALLERY_FEATURES = ['sea','terrace','pool','garden','parking','nature'];
  const UNIT_FEATURES = ['sea','terrace','pool','parking','storage','corner'];

  const BRANDS = {
    [MT]:{bg:'#FBF6ED',surface:'#FFFFFF',ink:'#1C1C1C',muted:'#595959',accent:'#5A1A33',tint:'#EBD6DC',reserved:'#ECEEE6',line:'#E0DCD2',
      display:"'EB Garamond',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{img:A+'miami/logo-alpha.png',alt:'Jean-Georges Miami Tropic Residences'}},
    dolphin:{bg:'#F2F4F3',surface:'#FFFFFF',ink:'#14232A',muted:'#4F5D63',accent:'#1F4E5F',tint:'#D3E3E7',reserved:'#E6EAE8',line:'#D8DFDF',
      display:"'Cormorant Garamond',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{text:'Dolphin Court',sub:'Grand Harbour · Paola'}},
    mercury:{bg:'#F1F0EE',surface:'#FFFFFF',ink:'#17181B',muted:'#55575C',accent:'#22252B',tint:'#DADCE2',reserved:'#E7E7E4',line:'#DCDBD7',
      display:"'Fraunces',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{text:'Mercury',sub:'Tower residences · St Julian’s'}},
    lalex:{bg:'#F7F2EA',surface:'#FFFFFF',ink:'#2A1F16',muted:'#6A5A4B',accent:'#8A5A2B',tint:'#EEDCC6',reserved:'#ECE9E1',line:'#E4D9C9',
      display:"'Libre Caslon Text',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{text:'La Lex',sub:'Townhouse residences · Sliema'}},
    verdala:{bg:'#F1F3EC',surface:'#FFFFFF',ink:'#1E2418',muted:'#596150',accent:'#4D5B3A',tint:'#DCE4CF',reserved:'#E8EAE2',line:'#D9DED0',
      display:"'Cormorant Garamond',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{text:'Verdala',sub:'Terraces · Rabat'}},
    onyx:{bg:'#EEEDEA',surface:'#FFFFFF',ink:'#111111',muted:'#58585A',accent:'#111111',tint:'#DEDCD6',reserved:'#E7E6E2',line:'#D8D6D1',
      display:"'DM Serif Display',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{text:'Onyx Rise',sub:'Mrieħel'}},
  };
  const FALLBACK_BRAND = BRANDS.dolphin;

  // Miami Tropic: register the showcase development in the CRM so selections,
  // opportunities and the Developments page all resolve it like any other.
  if (typeof DEVS !== 'undefined' && !DEVS.some(d => d.id === MT)) {
    DEVS.push({id:MT,name:'Miami Tropic',loc:'Miami Design District',lat:25.8136,lng:-80.1918,
      tag:'Jean-Georges residences where Midtown meets the Design District',photo:'miami/tower.jpg',completion:'Q4 2027',
      about:'A 42-storey residential tower by Jean-Georges, rising where Midtown meets the Miami Design District. Spa, yoga studio, pool deck and a residents’ restaurant, with bay and downtown views from every residence.',
      dist:[['Miami Design District','2 min walk'],['Midtown Miami','5 min walk'],['Wynwood','8 min drive'],['Miami International Airport','15 min drive']],
      amen:['Spa & treatment rooms','Yoga studio','Pool deck','Residents’ dining by Jean-Georges','Fitness centre','Valet & concierge'],
      media:{renders:{ext:[{img:'miami/tower.jpg',cap:'Tower — east elevation'}],int:[{img:'miami/hero-living.jpg',cap:'Living — bay views'},{img:'miami/r-kitchen.jpg',cap:'Kitchen'}]},
        photos:[{img:'miami/l-spa.jpg',cap:'Spa treatment room',tag:'Lifestyle'},{img:'miami/l-yoga.jpg',cap:'Yoga studio',tag:'Lifestyle'}]},
      files:[{n:'Miami Tropic — Residences brochure.pdf',s:'12.4 MB',d:'Updated 2 Nov'},{n:'Miami Tropic — Price list.xlsx',s:'0.4 MB',d:'Updated today'}]});
  }

  // Inventory generated from the availability design: 9 residences per floor,
  // floors 2–42, deterministic status and price.
  const MT_TYPES = [
    {n:'01',beds:3,baths:3,internal:182,external:61,view:'Bay & design district',f:['sea','terrace','parking','storage','corner'],dir:'NW'},
    {n:'02',beds:2,baths:2,internal:141,external:44,view:'Bay views',f:['sea','terrace','parking'],dir:'N'},
    {n:'03',beds:2,baths:2,internal:141,external:44,view:'Bay views',f:['sea','terrace','parking'],dir:'NE'},
    {n:'04',beds:3,baths:3,internal:176,external:58,view:'Bay & downtown',f:['sea','terrace','parking','storage','corner'],dir:'NE'},
    {n:'05',beds:2,baths:2,internal:138,external:42,view:'Downtown',f:['terrace','parking','storage'],dir:'E'},
    {n:'06',beds:1,baths:1,internal:92,external:28,view:'Cityscape',f:['parking'],dir:'S'},
    {n:'07',beds:1,baths:1,internal:88,external:24,view:'Cityscape',f:['parking'],dir:'S'},
    {n:'08',beds:2,baths:2,internal:138,external:42,view:'Cityscape',f:['terrace','parking'],dir:'SW'},
    {n:'09',beds:2,baths:3,internal:150,external:50,view:'Design district',f:['terrace','parking','storage'],dir:'W'},
  ];
  const MT_FLOORS = [2,42];
  // Garden-level corner residences are maisonettes, the two floors below the crown are duplexes.
  const mtType = (floor,slot) => floor >= 41 ? 'Penthouse' : floor >= 39 && [0,3].includes(slot) ? 'Duplex' : floor <= 3 && [0,3,8].includes(slot) ? 'Maisonette' : 'Apartment';
  const mtIndex = new Map();
  for (let floor = MT_FLOORS[0]; floor <= MT_FLOORS[1]; floor++) {
    MT_TYPES.forEach((t,i) => {
      const r = (floor*7+i*13)%10, status = r<5 ? 'available' : r<7 ? 'reserved' : 'sold';
      const area = t.internal+t.external, price = Math.round(area*(4800+floor*45)/1000)*1000;
      const id = 'AP.'+String(floor).padStart(2,'0')+t.n;
      mtIndex.set(id,{id,dev:'Miami Tropic',type:mtType(floor,i),floor,beds:t.beds,baths:t.baths,sqm:t.internal,ext:t.external,price,status,
        ready:'Q4 2027',views:[t.view,...t.f.map(k=>FEATURES[k].label)],days:20+((floor*3+i*5)%120),pv:{n:t.n,slot:i,view:t.view,f:t.f,dir:t.dir}});
    });
  }
  const register = uid => {
    if (typeof UNITS === 'undefined' || UN(uid)) return UN(uid);
    const u = mtIndex.get(uid); if (u) UNITS.push(u);
    return u || null;
  };
  // A few released residences are registered up front so the CRM sees Miami Tropic stock.
  ['AP.3803','AP.3203','AP.2402','AP.1201','AP.4204'].forEach(register);

  const unit = uid => (typeof UN === 'function' && UN(uid)) || mtIndex.get(uid) || null;
  const devOf = u => DEV(u?.dev);
  const unitsOf = devId => {
    const d = DEV(devId); if (!d) return [];
    if (d.id === MT) return [...mtIndex.values()].map(u => UN(u.id) || u);
    return UNITS.filter(u => u.dev === d.name);
  };
  const featuresOf = u => {
    if (u.pv) return u.pv.f;
    const v = u.views.join(' ').toLowerCase(), out = new Set();
    if (/sea|harbour|ocean|bay/.test(v)) out.add('sea');
    if (/terrace/.test(v) || u.ext >= 15) out.add('terrace');
    if (/pool/.test(v)) out.add('pool');
    if (/garden|courtyard/.test(v)) out.add('garden');
    if (/country|mdina|nature/.test(v)) out.add('nature');
    if ((DEV(u.dev)?.amen || []).some(a => /parking|garage/i.test(a))) out.add('parking');
    if (u.type === 'Penthouse') out.add('corner');
    return [...out];
  };
  const viewOf = u => u.pv?.view || u.views.find(v => /view/i.test(v)) || u.views[0] || '—';
  const area = u => u.sqm + (u.ext || 0);
  const devFeatures = devId => [...new Set(unitsOf(devId).flatMap(featuresOf))];

  // Unit media, finishes, styles and layouts come from the development's published content
  // (Edit development → live snapshot, modelled in unit-media.js). Nothing here is hard-coded per unit.
  const live = devId => { const d = DEV(devId); return d && typeof deState === 'function' ? deState(d).live : null; };
  const liveOf = u => live(DEV(u?.dev)?.id);
  const finishesFor = devId => { const c = live(devId); return c ? UM.livePacks(c).map(p => ({id:p.id,name:p.n,delta:p.mode === 'Addition' ? p.price : 0,mood:p.d,
    sw:(p.mats || []).slice(0,4).map(m => [m.room,m.name,m.sw]),spec:p.spec || (p.mats || []).slice(0,3).map(m => [m.room,[m.name,m.finish].filter(Boolean).join(' · ')])})) : []; };
  const defaultFinish = devId => { const c = live(devId), ps = c ? UM.livePacks(c) : []; return (ps.find(p => p.def) || ps[0])?.id || ''; };
  const stylesFor = devId => (live(devId)?.interiors.styles || []).map(s => ({id:s.id,name:s.n}));
  const styleName = (devId,id) => stylesFor(devId).find(s => s.id === id)?.name || '';
  const layoutName = (devId,id) => live(devId)?.interiors.layouts.find(l => l.id === id)?.n || '';
  const pair = list => list.map(x => ({id:x.id,name:x.n}));
  // Rooms with at least one render for this unit, resolved for the buyer's layout / finish / style.
  const renderRooms = (u,combo) => { const c = liveOf(u); return c ? UM.resolve(c,u,combo).map(r => ({id:r.id,name:r.n,eff:r.eff,
    imgs:r.renders.map(a => ({img:UM.src(a.img),cap:a.n,tags:UM.tagText(c,a)}))})) : []; };
  // Options worth a button on the render screen: the default plus anything that has its own render.
  const renderAxes = (u,packId) => { const c = liveOf(u); if (!c) return {layout:[],pack:[],style:[],def:{}}; const x = UM.axes(c,u,packId);
    return {layout:pair(x.layout),pack:pair(x.pack),style:pair(x.style),def:x.def}; };
  const defaults = (u,packId) => { const c = liveOf(u); return c ? UM.defaults(c,u,packId) : {}; };
  const viewsFor = u => { const c = liveOf(u); return c ? UM.viewsFor(c,u).map(a => ({id:a.id,name:a.n,dir:UM.dirAbbr(a.orient),rooms:UM.roomName(c,a.room) || 'the residence',img:UM.src(a.img)})) : []; };
  const planImg = u => liveOf(u)?.plans?.[u.id]?.url || null;
  const roomSchedule = u => {
    const rows = [['Living / dining',.24],['Kitchen',.073],...Array.from({length:Math.max(0,u.beds)},(_, i) => [i ? 'Bedroom '+(i+1) : 'Master bedroom',i ? .084 : .112]),
      ...Array.from({length:u.baths},(_, i) => [i ? 'Bathroom '+(i+1) : 'Master bathroom',i ? .027 : .04]),['Hall & circulation',.046],['Walls & shafts',.065]];
    const total = rows.reduce((a,[,p]) => a+p,0);
    const out = rows.map(([name,p]) => [name,+(u.sqm*p/total).toFixed(1)]);
    if (u.ext) out.splice(out.length-1,0,['Terrace',+u.ext.toFixed(1)]);
    return out;
  };
  const details = (u,finishName,ar = m => m+' m²') => [
    ['Internal',ar(u.sqm)],['External',u.ext ? ar(u.ext)+' terrace' : '—'],['Ceiling',u.dev==='Miami Tropic' ? '3.1 m' : '2.9 m'],
    ['Orientation',{N:'North',NE:'North-east',E:'East',SE:'South-east',S:'South',SW:'South-west',W:'West',NW:'North-west'}[u.pv?.dir] || 'South-east'],
    ['Parking',featuresOf(u).includes('parking') ? '1 bay, level −2' : 'Not included'],['Storage',featuresOf(u).includes('storage') ? ar(4.5) : '—'],
    ['Finish',finishName ? finishName+' package' : '—'],['Completion',u.ready || DEV(u.dev)?.completion || '—'],
  ];

  // Plate geometry: Miami Tropic follows the designed plate; other developments
  // lay their units on a floor out along a simple schematic.
  const floorsOf = devId => devId === MT ? Array.from({length:MT_FLOORS[1]-MT_FLOORS[0]+1},(_, i) => MT_FLOORS[0]+i)
    : [...new Set(unitsOf(devId).map(u => u.floor))].sort((a,b) => a-b);
  // Floor plate: units on a floor drawn on their level-plan outlines (published content, see level-plans.js).
  const levelOf = (devId,floor) => { const c = live(devId); return c ? LP.levelsFor(c,floor)[0] || null : null; };
  const plate = (devId,floor) => {
    const c = live(devId); if (!c) return [];
    const us = unitsOf(devId).filter(u => u.floor === floor), map = LP.floor(c,us,floor);
    const taken = new Set();
    return us.map(u => ({u,p:map.get(u.id)})).filter(({p}) => p?.level && p.rect && p.issue !== 'wrong-floor')
      .filter(({u,p}) => { const k = p.slot ? p.level.id+'|'+p.slot.id : u.id; if (taken.has(k)) return false; taken.add(k); return true; })
      .map(({u,p}) => ({u,rect:LP.toPlate(p.level,p.rect),label:p.label,level:p.level}));
  };
  const position = u => { const c = liveOf(u); if (!c) return null; const p = LP.place(c,unitsOf(DEV(u.dev).id),u); return p?.rect && !p.issue ? p : null; };
  const plateSides = devId => devId === MT ? ['Bay views','Downtown Miami','Cityscape','Miami design district']
    : (() => { const d = DEV(devId); return [d?.dist?.[0]?.[0] || 'Street',d?.dist?.[1]?.[0] || '',d?.dist?.[2]?.[0] || '',d?.dist?.[3]?.[0] || '']; })();

  const CONTENT = {
    [MT]:{
      intro:{title:'A Residential Retreat Takes Root Above a Vibrant City',body:'In Miami’s tropical paradise, a residential retreat takes root, blending with an urban tapestry of art and culture, where the legendary Jean-Georges expands his culinary mastery into the realm of residential lifestyle.',img:A+'miami/hero-living.jpg'},
      lifestyle:{title:'The Art of Living Well',body:'The amenities programming at Miami Tropic provides residents with essentials that feel like escapes — and escapes that become essentials.',cards:[
        {img:A+'miami/l-spa.jpg',title:'Relax, Renew, Retreat',body:'The spa contains two private treatment rooms for massage, bodywork, or facials.'},
        {img:A+'miami/l-yoga.jpg',title:'Home Stretch',body:'The yoga studio has a calming fern green and tropical coral palette, with serene, light-filled views.'},
        {img:A+'miami/r-terrace.jpg',title:'Above the Canopy',body:'Landscaped sky terraces with daybeds, outdoor kitchens and bay views.'},
        {img:A+'miami/r-dining.jpg',title:'The Residents’ Table',body:'A private dining room curated by Jean-Georges, with a chef’s table for twelve.'},
      ]},
      amenities:{title:'Every Day, Considered',img:A+'miami/r-kitchen2.jpg'},
      location:{title:'Walk of the Town',body:'Perfectly positioned where Midtown meets the Miami Design District, Miami Tropic is a global beacon of arts, shopping, and dining. Those who gather here don’t have their finger on the pulse. They are the pulse.',
        map:A+'miami/map.jpg',cats:[['Food & drink','#B8467E'],['Retail','#E4692E'],['Art & landmarks','#5A1A33'],['Wellness & beauty','#1F6B36'],['Parks','#F2C94C']],
        pois:[{name:'Proof Creamery',cat:0,body:'A unique liquor infused ice cream and sorbet made with premium alcohol and ingredients, produced in small batches in the sunshine state.',addr:'172 NE 41st St'},
          {name:'Baccarat Bar & Lounge',cat:0,body:'Baccarat boutique also offers a bar featuring champagne, wine and cocktails amid crystal decor.',addr:'140 Northeast 39th Street'},
          {name:'Boia De',cat:0,body:'Boia De is an intimate, chef-driven restaurant that specializes in modern American cooking with a strong Italian influence.',addr:'5205 NE 2nd Ave'},
          {name:'Contessa',cat:0,body:'Glamorous venue in the Miami Design District offering classic Northern Italian cuisine.',addr:'111 NE 41st St'},
          {name:'Institute of Contemporary Art',cat:2,body:'Free-admission museum showing emerging and established contemporary artists.',addr:'61 NE 41st St'},
          {name:'Design District Flagships',cat:1,body:'Hermès, Dior and Louis Vuitton within a five-minute walk of the lobby.',addr:'NE 39th–41st St'}]},
      gallery:['miami/tower.jpg','miami/hero-living.jpg','miami/r-terrace.jpg','miami/r-kitchen.jpg','miami/r-living.jpg','miami/r-dining.jpg','miami/l-spa.jpg','miami/l-yoga.jpg','miami/r-bath.jpg','miami/r-kitchen2.jpg'].map(i => A+i),
      tower:A+'miami/tower.jpg',
    },
  };
  // Amenity slides: a render and a line the rep can talk to, per amenity.
  const AMEN_INFO = {[MT]:{
    'Spa & treatment rooms':['miami/l-spa.jpg','Two private treatment rooms for massage, bodywork and facials, with a relaxation lounge between them.'],
    'Yoga studio':['miami/l-yoga.jpg','Fern green and tropical coral, with soft morning light and classes run by the spa team.'],
    'Pool deck':['miami/r-terrace.jpg','A sun deck above the canopy with cabanas, daybeds and a heated lap pool.'],
    'Residents’ dining by Jean-Georges':['miami/r-dining.jpg','A private dining room curated by Jean-Georges, with a chef’s table for twelve.'],
    'Fitness centre':['gym.jpg','Technogym equipment, a stretching studio and personal training on request.'],
    'Valet & concierge':['cine-lobby.jpg','A 24-hour lobby team: valet parking, deliveries, reservations and house calls.']}};
  const AMEN_GENERIC = [[/pool/i,'cine-pool.jpg','A pool for slow mornings and long summer evenings.'],[/spa|treatment/i,'pool.jpg','Somewhere to switch off without leaving home.'],
    [/gym|fitness/i,'gym.jpg','Fully equipped, open early until late.'],[/concierge|hotel|security/i,'cine-lobby.jpg','A team on hand for deliveries, guests and the everyday.'],
    [/roof|terrace|sky/i,'cine-dusk.jpg','Shared outdoor space with views across the skyline.'],[/garden|courtyard|landscap/i,'park.jpg','Planted, shaded and calm in every season.'],
    [/parking|garage|valet|ev/i,'cine-aerial.jpg','Secure parking on site, with EV charging available.'],[/work|lounge/i,'interior.jpg','A residents’ lounge for meetings, work and guests.']];
  const amenityItems = devId => { const d = DEV(devId); if (!d) return [];
    return d.amen.map((name,i) => { const x = AMEN_INFO[devId]?.[name] || (g => g ? [g[1],g[2]] : [d.photo,'Included for residents of '+d.name+'.'])(AMEN_GENERIC.find(([re]) => re.test(name)));
      return {name,img:A+x[0],body:x[1]}; }); };

  const contentFor = devId => {
    if (CONTENT[devId]) return CONTENT[devId];
    const d = DEV(devId); if (!d) return null;
    const imgs = [d.photo,...(d.media?.renders?.ext || []).map(x => x.img),...(d.media?.renders?.int || []).map(x => x.img),...(d.media?.photos || []).map(x => x.img)];
    const uniq = [...new Set(imgs)].map(i => A+i);
    return {
      intro:{title:d.tag,body:d.about,img:A+(d.media?.renders?.int?.[0]?.img || d.photo)},
      lifestyle:{title:'Life at '+d.name,body:d.about,cards:[...(d.media?.photos || []).map(p => ({img:A+p.img,title:p.cap,body:p.tag+' · '+d.loc})),
        ...d.amen.slice(0,3).map((a,i) => ({img:A+['cine-lobby.jpg','gym.jpg','cine-pool.jpg'][i],title:a,body:'Included for residents of '+d.name+'.'}))]},
      amenities:{title:'Every Day, Considered',img:A+(d.media?.photos?.[0]?.img || d.photo)},
      location:{title:'The Neighbourhood',body:d.name+' sits in '+d.loc+'. Everything that matters is close at hand.',map:null,cats:[],pois:d.dist.map(([name,body]) => ({name,body,addr:d.loc}))},
      gallery:uniq,
      tower:A+d.photo,
    };
  };

  // Residences slide: grouped by property type, each with a representative render.
  const GROUPS = [['Maisonette','Maisonettes'],['Apartment','Apartments'],['Penthouse','Penthouses'],['Duplex','Duplexes']];
  const groupOf = t => t === 'Studio' ? 'Apartment' : t;
  const GROUP_IMG = {[MT]:{Maisonette:'miami/r-kitchen2.jpg',Apartment:'miami/r-living.jpg',Penthouse:'miami/hero-living.jpg',Duplex:'miami/r-dining.jpg'}};
  const GROUP_FALLBACK = {Maisonette:'render-stone.jpg',Apartment:'interior.jpg',Penthouse:'cine-dusk.jpg',Duplex:'render-oak.jpg'};
  const residenceGroups = devId => {
    const us = unitsOf(devId);
    return GROUPS.map(([key,label]) => {
      const g = us.filter(u => groupOf(u.type) === key); if (!g.length) return null;
      const av = g.filter(u => u.status === 'available');
      const beds = [...new Set(g.map(u => u.beds))].sort((a,b) => a-b).map(b => { const x = av.filter(u => u.beds === b); return {beds:b,from:x.length ? Math.min(...x.map(u => u.price)) : null,count:x.length}; });
      return {key,label,img:A+(GROUP_IMG[devId]?.[key] || GROUP_FALLBACK[key]),total:g.length,available:av.length,beds,from:av.length ? Math.min(...av.map(u => u.price)) : null};
    }).filter(Boolean);
  };

  // Commercial terms per development: the money conversation buyers expect before reserving.
  // Currency and area unit follow the market (Miami: USD and sq ft; Malta: EUR and m²).
  const COMPANY = {name:'Lalex Developments',short:'Lalex'};
  const COMMERCE = {
    [MT]:{currency:'USD',area:'sqft',developer:'Tropic Development Partners',
      plan:[['Reservation','On signing the reservation',10],['Contract','Within 30 days',10],['Topping out','Q2 2026',20],['Closing','On completion · Q4 2027',60]],
      protection:'Deposits are held by an independent escrow agent until closing (Florida Statutes ch. 718). 15-day right to cancel after receiving the condominium documents.',
      hold:{hours:48,deposit:'$25,000 refundable'},completion:'Q4 2027',grace:'Up to 6 months',
      timeline:[['Sales launch','Q3 2024','done'],['Groundbreaking','Q1 2025','done'],['Topping out','Q2 2026','now'],['Interiors','Q1 2027',''],['Closing & keys','Q4 2027','']],
      charges:{label:'HOA dues',per:'sqft',rate:1.15,period:'month'},rent:{per:'sqft',rate:2.9},
      track:[['14','towers delivered since 2004'],['6,200','residences handed over'],['0','projects cancelled']]},
    _malta:{currency:'EUR',area:'m2',developer:COMPANY.name,
      plan:[['Promise of sale','10% held by the notary',10],['Shell complete','Structural milestone',30],['Final deed','On completion',60]],
      protection:'The 10% deposit on the promise of sale (konvenju) is held by the notary until the final deed. Bank guarantee on stage payments.',
      hold:{hours:48,deposit:'€5,000 refundable'},grace:'Up to 6 months',
      charges:{label:'Common area charges',per:'m2',rate:9,period:'year'},
      track:[['9','projects delivered since 2008'],['640','residences handed over'],['0','projects cancelled']]},
  };
  const commerce = devId => {
    const d = DEV(devId), c = COMMERCE[devId] || {...COMMERCE._malta,rent:{per:'m2',rate:typeof CMP_RENT_PSQM === 'undefined' ? 16 : CMP_RENT_PSQM[d?.name] || 16}};
    const completion = c.completion || d?.completion || '—', ready = /ready/i.test(completion);
    // Malta timelines follow the completion date: ready projects show every milestone done.
    const timeline = c.timeline || (ready ? [['Permits','2022','done'],['Construction','2023','done'],['Completion','2025','done'],['Ready to move in','Now','now']]
      : [['Permits','2024','done'],['Excavation','Q1 2025','done'],['Shell','Q4 2025','now'],['Finishes','Q2 2026',''],['Final deed',completion,'']]);
    return {...c,completion,timeline};
  };
  // Indicative exchange rates against EUR, for the buyer's display currency.
  const FX = {EUR:{rate:1,sym:'€'},USD:{rate:1.09,sym:'$'},GBP:{rate:.85,sym:'£'},AED:{rate:4,sym:'AED '},CHF:{rate:.96,sym:'CHF '}};
  // Walkthrough film: a cinematic preview until the 3D tour is supplied.
  const WALK = {[MT]:[['miami/tower.jpg','Arrival','The tower rises above Midtown'],['miami/hero-living.jpg','Living','Floor-to-ceiling glass towards the bay'],['miami/r-kitchen.jpg','Kitchen','Gathered around the island'],['miami/r-terrace.jpg','Terrace','Outdoor living, 44 m²'],['miami/l-spa.jpg','Spa','Two private treatment rooms']]};
  const walkFor = devId => (WALK[devId] || [['cine-aerial.jpg','Arrival','The site in context'],['cine-lobby.jpg','Lobby','A considered welcome'],['interior.jpg','Living','Light, space and calm'],['cine-pool.jpg','Pool','Your everyday escape'],['cine-dusk.jpg','Evening','The neighbourhood at dusk']]).map(([img,title,cap]) => ({img:A+img,title,cap}));
  // Buyer-facing chrome in the buyer's language. Development copy stays as supplied.
  const LANGS = {en:'English',fr:'Français',de:'Deutsch',it:'Italiano',zh:'中文'};
  const T9N = {
    fr:{'Selected':'Sélection','Add to selection':'Ajouter à la sélection','In selection':'Dans la sélection','Plan':'Plan','Renders':'Rendus','Views':'Vues','Finishes':'Finitions','Details':'Détails','Room schedule':'Surfaces','Where it sits':'Situation','Payment plan':'Échéancier','Ownership costs':'Charges et rendement','Availability list':'Disponibilités','By floor':'Par étage','residences found':'résidences','Sort by':'Trier par','Filters':'Filtres','Residences':'Résidences','Gallery':'Galerie','Plans':'Plans','from':'à partir de','Price on request':'Prix sur demande','Thank you':'Merci','Your selection':'Votre sélection','Available':'Disponible','Reserved':'Réservé','Sold':'Vendu','On hold':'Option','bedroom':'chambre','bedrooms':'chambres','Introduction':'Introduction','Lifestyle':'Art de vivre','Amenities':'Services','Location':'Quartier','Payment & ownership':'Paiement et propriété','Property Types':'Typologies','Units and Availability':'Lots et disponibilités','Walkthrough':'Visite','Artist’s impression':'Vue d’artiste','Indicative plan':'Plan indicatif','Hold for 48 hours':'Option 48 heures','Held for you':'Réservé pour vous','Prepared by':'Préparé par','Prices valid until':'Prix valables jusqu’au'},
    de:{'Selected':'Ausgewählt','Add to selection':'Zur Auswahl','In selection':'In der Auswahl','Plan':'Grundriss','Renders':'Visualisierungen','Views':'Aussicht','Finishes':'Ausstattung','Details':'Details','Room schedule':'Flächen','Where it sits':'Lage','Payment plan':'Zahlungsplan','Ownership costs':'Kosten und Rendite','Availability list':'Verfügbarkeit','By floor':'Nach Etage','residences found':'Wohnungen','Sort by':'Sortieren','Filters':'Filter','Residences':'Wohnungen','Gallery':'Galerie','Plans':'Grundrisse','from':'ab','Price on request':'Preis auf Anfrage','Thank you':'Vielen Dank','Your selection':'Ihre Auswahl','Available':'Verfügbar','Reserved':'Reserviert','Sold':'Verkauft','On hold':'Vorgemerkt','bedroom':'Schlafzimmer','bedrooms':'Schlafzimmer','Introduction':'Einführung','Lifestyle':'Lebensstil','Amenities':'Ausstattung','Location':'Lage','Payment & ownership':'Zahlung und Eigentum','Property Types':'Wohnungstypen','Units and Availability':'Einheiten und Verfügbarkeit','Walkthrough':'Rundgang','Artist’s impression':'Visualisierung','Indicative plan':'Unverbindlicher Grundriss','Hold for 48 hours':'48 Stunden vormerken','Held for you':'Für Sie vorgemerkt','Prepared by':'Erstellt von','Prices valid until':'Preise gültig bis'},
    it:{'Selected':'Selezionati','Add to selection':'Aggiungi alla selezione','In selection':'Nella selezione','Plan':'Pianta','Renders':'Render','Views':'Viste','Finishes':'Finiture','Details':'Dettagli','Room schedule':'Superfici','Where it sits':'Posizione','Payment plan':'Piano di pagamento','Ownership costs':'Costi e rendimento','Availability list':'Disponibilità','By floor':'Per piano','residences found':'residenze','Sort by':'Ordina per','Filters':'Filtri','Residences':'Residenze','Gallery':'Galleria','Plans':'Piante','from':'da','Price on request':'Prezzo su richiesta','Thank you':'Grazie','Your selection':'La sua selezione','Available':'Disponibile','Reserved':'Riservato','Sold':'Venduto','On hold':'Opzionato','bedroom':'camera','bedrooms':'camere','Introduction':'Introduzione','Lifestyle':'Lifestyle','Amenities':'Servizi','Location':'Posizione','Payment & ownership':'Pagamento e proprietà','Property Types':'Tipologie','Units and Availability':'Unità e disponibilità','Walkthrough':'Visita','Artist’s impression':'Immagine indicativa','Indicative plan':'Pianta indicativa','Hold for 48 hours':'Opziona per 48 ore','Held for you':'Opzionato per lei','Prepared by':'Preparato da','Prices valid until':'Prezzi validi fino al'},
    zh:{'Selected':'已选','Add to selection':'加入选择','In selection':'已加入','Plan':'户型','Renders':'效果图','Views':'景观','Finishes':'装修','Details':'详情','Room schedule':'面积明细','Where it sits':'位置','Payment plan':'付款计划','Ownership costs':'持有成本与收益','Availability list':'房源列表','By floor':'按楼层','residences found':'套房源','Sort by':'排序','Filters':'筛选','Residences':'户型','Gallery':'图库','Plans':'平面图','from':'起','Price on request':'价格面议','Thank you':'谢谢','Your selection':'您的选择','Available':'可售','Reserved':'已预留','Sold':'已售','On hold':'保留中','bedroom':'卧室','bedrooms':'卧室','Introduction':'项目介绍','Lifestyle':'生活方式','Amenities':'配套设施','Location':'区位','Payment & ownership':'付款与持有','Property Types':'户型类别','Units and Availability':'房源与可售情况','Walkthrough':'漫游','Artist’s impression':'效果图仅供参考','Indicative plan':'户型图仅供参考','Hold for 48 hours':'保留48小时','Held for you':'已为您保留','Prepared by':'顾问','Prices valid until':'价格有效期至'},
  };

  // Page switcher groups follow the Figma "Page switcher" component.
  const PAGES = [
    {id:'intro',label:'Introduction',icon:'home',group:'Project'},
    {id:'lifestyle',label:'Lifestyle',icon:'local_cafe',group:'Project'},
    {id:'amenities',label:'Amenities',icon:'spa',group:'Project'},
    {id:'location',label:'Location',icon:'location_on',group:'Project'},
    {id:'ownership',label:'Payment & ownership',icon:'payments',group:'Project'},
    {id:'types',label:'Property Types',icon:'apartment',group:'Availability'},
    {id:'availability',label:'Units and Availability',icon:'list',group:'Availability'},
    {id:'walkthrough',label:'Walkthrough',icon:'play_circle',group:'Floor plan'},
    {id:'gallery',label:'Gallery',icon:'photo_library',group:'Floor plan'},
    {id:'plans',label:'Plans',icon:'dashboard',group:'Floor plan'},
  ];
  const AMENITY_ICONS = [[/pool/i,'pool'],[/spa|treatment/i,'spa'],[/yoga|gym|fitness/i,'fitness_center'],[/dining|restaurant|chef/i,'restaurant'],[/concierge|valet|hotel/i,'concierge'],
    [/parking|garage|ev/i,'local_parking'],[/security/i,'shield'],[/terrace|roof/i,'deck'],[/garden|courtyard|landscap/i,'park'],[/work|lounge/i,'chair']];
  const amenityIcon = a => AMENITY_ICONS.find(([re]) => re.test(a))?.[1] || 'check_circle';

  window.PV3D = {MT,FEATURES,GALLERY_FEATURES,UNIT_FEATURES,PAGES,brand:id => BRANDS[id] || FALLBACK_BRAND,content:contentFor,
    unit,register,unitsOf,residenceGroups,commerce,amenityItems,FX,COMPANY,walkFor,LANGS,T9N,devOf,featuresOf,viewOf,area,devFeatures,finishesFor,defaultFinish,stylesFor,styleName,layoutName,renderRooms,renderAxes,defaults,viewsFor,planImg,
    roomSchedule,details,floorsOf,plate,levelOf,position,plateSides,amenityIcon,
    asset:A,mtFloors:MT_FLOORS};
})();
