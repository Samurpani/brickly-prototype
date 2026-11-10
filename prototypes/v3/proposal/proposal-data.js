/* Buyer proposal: one published issue. Every template renders this same object. Templates change
   order, layout and styling only. In the product this is the immutable snapshot behind bricly.mt/p/{token}. */
(function(){
  const A='../assets/present/', M=A+'miami/';

  // Brand tokens follow BRANDS in present-v3-data.js. The developer brand frames the proposal;
  // each development chapter switches to its own brand.
  const SEASHORE={bg:'#F4F1EA',surface:'#FFFFFF',ink:'#1A1916',muted:'#5E5A52',accent:'#8C6A3F',tint:'#E9DFCF',line:'#DDD5C7',
    display:"'Cormorant Garamond',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{text:'Seashore',sub:'Developments'}};
  const DOLPHIN={bg:'#F2F4F3',surface:'#FFFFFF',ink:'#14232A',muted:'#4F5D63',accent:'#1F4E5F',tint:'#D3E3E7',line:'#D8DFDF',
    display:"'Cormorant Garamond',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{text:'Dolphin Court',sub:'Grand Harbour · Paola'}};
  const ONYX={bg:'#EEEDEA',surface:'#FFFFFF',ink:'#111111',muted:'#58585A',accent:'#111111',tint:'#DEDCD6',line:'#D8D6D1',
    display:"'DM Serif Display',Georgia,serif",text:"'Hanken Grotesk','Helvetica Neue',Arial,sans-serif",logo:{text:'Onyx Rise',sub:'Mrieħel'}};

  const PAY=dates=>[
    {pct:10,label:'On signing the promise of sale',when:dates[0]},
    {pct:20,label:'Structure complete',when:dates[1]},
    {pct:20,label:'Finishes complete',when:dates[2]},
    {pct:50,label:'On handover and final deed',when:dates[3]},
  ];
  const PAY_DOLPHIN=PAY(['On signing','On signing · stage reached','Feb 2027','Q2 2027']);
  const PAY_ONYX=PAY(['On signing','Mar 2027','Sep 2027','Q1 2028']);

  window.PROPOSAL={
    id:'PR-1001-2',token:'k7Qm2VxR9aLt3Hc8pZ4wNe',version:2,issued:'10 November 2026',validUntil:'10 December 2026',
    template:'signature',
    buyer:{first:'Mike',last:'Gatt',type:'investment'},
    rep:{name:'Sam Borg',role:'Senior sales adviser',initials:'SB',phone:'+356 7900 1122',whatsapp:'35679001122',email:'sam@seashore.mt'},
    developer:{
      name:'Seashore Developments',brand:SEASHORE,hero:A+'cine-pool.jpg',cover:A+'cover-lounge.jpg',intro:A+'cliffs.jpg',
      stats:[{v:28,l:'Years building'},{v:14,l:'Developments delivered'},{v:1260,l:'Homes handed over'},{v:96,l:'Handed over on schedule',s:'%'}],
      delivered:[{name:'Marina Point',place:'Kalkara',year:2019,img:A+'harbour.jpg'},{name:'The Ramparts',place:'Valletta',year:2021,img:A+'dev-lalex.jpg'},{name:'Laguna Terraces',place:'St Paul’s Bay',year:2024,img:A+'dev-verdala.jpg'}],
      promises:[
        ['Your deposit is protected','Held by the notary until the promise of sale is registered.'],
        ['Fixed price','The price you reserve is the price you pay. No escalation clauses.'],
        ['10-year structural warranty','Plus a 12-month snagging programme after handover.'],
        ['One point of contact','Sam stays with you from reservation to keys.'],
      ],
    },
    // How this buyer reached us. The letter's opening line follows it: viewing, call or request.
    context:{kind:'viewing',day:'Saturday',place:'Dolphin Court'},
    letter:[
      'You told me you want a home that earns from the day it’s finished, in a place people want to live.',
      'I’ve kept this to three homes that fit. Two are at Dolphin Court. The third is at Onyx Rise, so you can compare. Residence 9802 is on hold for you until Friday.',
    ],
    reserved:null,
    // Buyer profile, from the opportunity. Shown on the cover.
    profile:{looking:'Two-bedroom apartment with a terrace',budget:'€280,000 – €380,000',handover:'Before summer 2027',areas:'Grand Harbour or central Malta'},
    requirements:[
      {ask:'Two bedrooms and a terrace',answer:'All three homes',to:'u-CM9802'},
      {ask:'Strong rental demand',answer:'Both within 10 min of major employers',to:'d-dolphin-location'},
      {ask:'Handover before summer 2027',answer:'Dolphin Court, Q2 2027',to:'d-dolphin-progress'},
      {ask:'Payments spread out',answer:'Half due at handover',to:'u-CM9802-payment'},
      {ask:'A sea or harbour view',answer:'Residence 1207',to:'u-CM1207-views'},
    ],
    developments:[
      {id:'dolphin',name:'Dolphin Court',place:'Grand Harbour · Paola',brand:DOLPHIN,numeral:'I',
        hero:A+'dev-dolphin.jpg',open:A+'dev-dolphin.jpg',
        tagline:'Six floors by the Grand Harbour.',plate:{perRow:2,face:'Grand Harbour'},
        story:'Six floors of stone and glass set back from the water, with homes arranged so every living room opens to light. A residents’ spa, a fitness studio and a garden studio sit at its heart, with a concierge at the door.',
        facts:[{v:48,l:'Homes'},{v:6,l:'Floors'},{v:2,l:'Minutes to the water'},{v:2027,l:'Handover',plain:1}],
        amenities:[{n:'Residents’ spa',img:M+'l-spa.jpg'},{n:'Fitness studio',img:A+'gym.jpg'},{n:'Garden studio',img:M+'l-yoga.jpg'}],
        life:[
          {n:'Grand Harbour waterfront',d:'2 min walk',img:A+'cliffs.jpg',for:['all']},
          {n:'Paola business district',d:'6 min drive',img:A+'skyline.jpg',for:['investment','growth','relocation']},
          {n:'International school',d:'8 min drive',img:A+'school.jpg',for:['first','relocation']},
          {n:'Cafés and the market square',d:'4 min walk',img:A+'cafe.jpg',for:['first','second','relocation']},
          {n:'Mater Dei hospital',d:'12 min drive',img:A+'cine-lobby.jpg',for:['investment','relocation']},
          {n:'Beaches at Marsaskala',d:'15 min drive',img:A+'beach.jpg',for:['second','growth']},
        ],
        progress:{pct:72,stage:'Finishes underway',photo:A+'cine-lobby.jpg',date:'Photographed 3 November 2026'},
        timeline:[{l:'Permits granted',d:'Mar 2024',done:1},{l:'Structure complete',d:'Feb 2026',done:1},{l:'Finishes',d:'Now',now:1},{l:'Handover',d:'Q2 2027'}],
        market:{launch:3050,now:3240},
        remaining:'4 of 18 two-bedroom homes remain'},
      {id:'onyx',name:'Onyx Rise',place:'Mrieħel',brand:ONYX,numeral:'II',
        hero:M+'tower.jpg',open:A+'cine-dusk.jpg',
        tagline:'Twelve floors next to the Mrieħel business quarter.',plate:{perRow:3,face:'Business quarter'},
        story:'Twelve floors beside Malta’s new business quarter, with a sky lounge, a co-working floor and a residents’ gym. Built for people who want to walk to work and come home to a view.',
        facts:[{v:96,l:'Homes'},{v:12,l:'Floors'},{v:5,l:'Minutes to the business quarter'},{v:2028,l:'Handover',plain:1}],
        amenities:[{n:'Sky lounge',img:M+'hero-living.jpg'},{n:'Co-working floor',img:A+'cine-lobby.jpg'},{n:'Residents’ gym',img:A+'gym.jpg'}],
        life:[
          {n:'Mrieħel business quarter',d:'5 min walk',img:A+'skyline.jpg',for:['all']},
          {n:'University of Malta',d:'10 min drive',img:A+'school.jpg',for:['investment','growth','first']},
          {n:'Birkirkara cafés',d:'7 min drive',img:A+'cafe.jpg',for:['first','second','relocation']},
          {n:'Ta’ Qali national park',d:'9 min drive',img:A+'park.jpg',for:['first','relocation','second']},
          {n:'Main bus interchange',d:'3 min walk',img:A+'dev-mercury.jpg',for:['investment','relocation']},
        ],
        progress:{pct:48,stage:'Structure at level 9 of 12',photo:A+'dev-mercury.jpg',date:'Photographed 1 November 2026'},
        timeline:[{l:'Permits granted',d:'Jun 2024',done:1},{l:'Groundworks',d:'Jan 2025',done:1},{l:'Structure',d:'Now',now:1},{l:'Finishes',d:'Sep 2027'},{l:'Handover',d:'Q1 2028'}],
        market:{launch:3900,now:4180},
        remaining:'6 of 30 two-bedroom homes remain'},
    ],
    units:[
      {id:'CM9802',name:'Residence 9802',dev:'dolphin',beds:2,baths:2,sqm:88,ext:14,floor:2,aspect:'South-east',view:'Harbour view',price:285000,handover:'Q2 2027',
        status:'held',hold:'Friday 14 November, 18:00',layout:'Architect layout',finish:'Signature finish',plate:2,
        views:[{img:A+'cliffs.jpg',l:'From the living room, level 2'}],
        renders:[M+'r-living.jpg',M+'r-kitchen.jpg',M+'r-detail.jpg',M+'r-bath.jpg'],
        rooms:[['Living and dining','6.1 × 4.4 m'],['Kitchen','3.4 × 2.8 m'],['Main bedroom','4.0 × 3.6 m'],['Second bedroom','3.4 × 3.0 m'],['Terrace','14 m²']],
        spec:['Oak engineered floors','Stone kitchen worktops','Underfloor heating in bathrooms','Smart climate control','Full-height glazing'],
        pay:PAY_DOLPHIN,invest:{rent:[1450,1650],occ:90,fees:1800},
        note:'You liked the morning light in the living room. This is the only two-bedroom home on this floor that faces the harbour.'},
      {id:'CM1207',name:'Residence 1207',dev:'dolphin',beds:2,baths:2,sqm:95,ext:18,floor:4,aspect:'South',view:'Sea and harbour view',price:360000,handover:'Q2 2027',
        status:'available',layout:'Open-kitchen layout',finish:'Riviera finish',plate:3,
        views:[{img:A+'beach.jpg',l:'From the terrace, level 4'},{img:A+'cliffs.jpg',l:'Towards the harbour at dusk'}],
        renders:[M+'l-yoga.jpg',M+'r-kitchen2.jpg',M+'r-dining.jpg',M+'r-terrace.jpg'],
        rooms:[['Living and dining','6.6 × 4.6 m'],['Kitchen','Open plan'],['Main bedroom','4.2 × 3.6 m'],['Second bedroom','3.5 × 3.1 m'],['Terrace','18 m²']],
        spec:['Limestone floors','Open-plan kitchen with island','Underfloor heating throughout','Smart climate control','Frameless glass balustrade'],
        pay:PAY_DOLPHIN,invest:{rent:[1800,2050],occ:92,fees:2100},
        note:'The sea view you asked about: a higher floor, a larger terrace and the strongest rent of the three.'},
      {id:'CM9702',name:'Residence 9702',dev:'onyx',beds:2,baths:2,sqm:82,ext:8,floor:4,aspect:'West',view:'City view',price:355000,handover:'Q1 2028',
        status:'available',layout:'Architect layout',finish:'Urban finish',plate:1,
        views:[{img:A+'skyline.jpg',l:'From the terrace, level 4'}],
        renders:[M+'hero-living.jpg',A+'render-stone.jpg',A+'render-slate.jpg',M+'r-bath.jpg'],
        rooms:[['Living and dining','5.8 × 4.2 m'],['Kitchen','3.2 × 2.6 m'],['Main bedroom','3.9 × 3.5 m'],['Second bedroom','3.3 × 2.9 m'],['Terrace','8 m²']],
        spec:['Polished concrete floors','Slate kitchen','Home-office niche','Smart climate control','Sunset-facing terrace'],
        pay:PAY_ONYX,invest:{rent:[1650,1850],occ:94,fees:1950},
        note:'For comparison: a five-minute walk to the business quarter, which keeps occupancy at its highest.'},
    ],
    downloads:[['Proposal PDF','12 pages'],['Floor plans','3 homes'],['Specification','Signature, Riviera, Urban'],['Price list','Valid until 10 December 2026']],
    legal:'Prices are valid until 10 December 2026 and depend on availability. Images are indicative and may show optional finishes. Rental and yield figures are estimates based on comparable lettings. They are not guaranteed and can go down as well as up. Room sizes are approximate.',
  };

  // Persona copy is the only text that changes with buyer type. Every other block reads the data above.
  window.PROPOSAL_PERSONAS={
    first:{label:'First home',purpose:'A home to live in',lifeTitle:'Everyday life, close by',compare:['price','size','ext','floor','view','handover']},
    investment:{label:'Investment · rental',purpose:'Investment · rental income',lifeTitle:'What keeps rental demand high',compare:['price','rent','yield','occ','pricem2','handover']},
    growth:{label:'Investment · growth',purpose:'Investment · capital growth',lifeTitle:'What’s driving the area',compare:['price','pricem2','floor','view','handover']},
    second:{label:'Second home',purpose:'A second home',lifeTitle:'Your days here',compare:['price','view','ext','floor','handover']},
    relocation:{label:'Relocation',purpose:'Relocating to Malta',lifeTitle:'Schools, health and your commute',compare:['price','size','floor','handover']},
  };
})();
