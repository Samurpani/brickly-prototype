/* Proposal standard: the account-level rules every buyer proposal follows. Admins edit a draft in
   Settings › Proposal page and publish it as a new version; reps never change any of this. The CRM
   and the buyer page (proposal/index.html) both read the published version. In the prototype the
   draft and published versions live in localStorage so the buyer page in another tab sees them. */
(function(){
  const KEY='bricly.proposal.std';
  const clone=o=>JSON.parse(JSON.stringify(o));

  // State per section: 'always' | 'data' (shown only when the data exists) | 'off'. Locked rows can't change.
  const SECTIONS=[
    {g:'Page',k:'intro',l:'Personalised intro',d:'“This proposal is for Mike” loading screen, about 2 seconds',src:'Buyer and rep',st:'always',opts:['always','off']},
    {g:'Page',k:'cover',l:'Cover',d:'Buyer name, rep, proposal number and date',src:'Opportunity',st:'always',lock:1},
    {g:'Page',k:'profile',l:'Buyer profile',d:'Looking for, budget, handover, purpose, areas',src:'Opportunity',st:'data',opts:['data','off']},
    {g:'Page',k:'goals',l:'Your goals',d:'What the buyer asked for, with where it’s answered',src:'Meeting notes',st:'data',opts:['data','off']},
    {g:'Page',k:'letter',l:'Letter from the rep',d:'Short note the rep approves before sending',src:'Rep message',st:'always',opts:['always','off']},
    {g:'Page',k:'selection',l:'The properties you’re interested in',d:'One box per development with its homes',src:'Opportunity units',st:'always',lock:1},
    {g:'Page',k:'compare',l:'Side by side',d:'Homes and developments compared',src:'Units and developments',st:'data',opts:['data','off'],note:'Shown for 2 or more homes'},
    {g:'Page',k:'developer',l:'Built on trust',d:'Track record, delivered projects and promises',src:'Company profile',st:'always',opts:['always','off']},
    {g:'Page',k:'next',l:'Your next step',d:'Reserve, or book the promise of sale once reserved',src:'Deal state',st:'always',lock:1},
    {g:'Page',k:'downloads',l:'Downloads',d:'Proposal PDF, floor plans, specification, price list',src:'Development files',st:'always',opts:['always','off']},
    {g:'Page',k:'legal',l:'Legal footer',d:'Price validity, image and estimate disclaimers',src:'This page',st:'always',lock:1},
    {g:'Development panel',k:'amenities',l:'Amenities',d:'Amenity images and names',src:'Development',st:'data',opts:['data','off']},
    {g:'Development panel',k:'location',l:'Location',d:'Places nearby, filtered by buyer type',src:'Development',st:'data',opts:['data','off']},
    {g:'Development panel',k:'progress',l:'Build progress',d:'Dated site photo, % built and timeline',src:'Development',st:'data',opts:['data','off']},
    {g:'Home panel',k:'views',l:'Renders and views',d:'Approved renders and photos from the home',src:'Unit media',st:'data',opts:['data','off']},
    {g:'Home panel',k:'plan',l:'Floor plan',d:'Plan, room sizes and specification',src:'Unit',st:'always',lock:1},
    {g:'Home panel',k:'position',l:'In the building',d:'Level in the building and position on the floor',src:'Level plans',st:'data',opts:['data','off']},
    {g:'Home panel',k:'payment',l:'Payment plan',d:'Milestones in euros for this home',src:'Payment plan',st:'always',lock:1},
    {g:'Home panel',k:'investment',l:'Investment or value figures',d:'Estimated rent and yield, or price per m² since launch',src:'Development investment data',st:'data',opts:['data','off'],note:'Only for the buyer types below'},
  ];
  const TYPES=[['first','First home'],['investment','Investment · rental'],['growth','Investment · growth'],['second','Second home'],['relocation','Relocation']];
  const TEMPLATES=[
    {k:'signature',n:'Signature',d:'Editorial. Image and buyer profile on the cover, developments in boxes, details in side panels.',ready:true},
    {k:'residence',n:'Residence',d:'One home at a time, room by room. Best for owner-occupiers.'},
    {k:'investor',n:'Investor brief',d:'Numbers first, calm data, comparison up front.'},
    {k:'monograph',n:'Monograph',d:'Minimal and type-led, one image per chapter.'},
  ];

  // Brand kits. In the product the company brand comes from Company profile and each development's
  // brand from New development setup (logo, colour values, fonts). Settings › Proposal page confirms them.
  const FONTS=[
    {n:'Cormorant Garamond',k:'serif'},{n:'EB Garamond',k:'serif'},{n:'DM Serif Display',k:'serif'},{n:'Fraunces',k:'serif'},
    {n:'Libre Caslon Text',k:'serif'},{n:'Playfair Display',k:'serif'},{n:'Hanken Grotesk',k:'sans'},{n:'Inter',k:'sans'},{n:'Manrope',k:'sans'},{n:'Work Sans',k:'sans'},
  ];
  const COLOR_KEYS=[['bg','Background'],['surface','Cards'],['ink','Text'],['muted','Secondary text'],['accent','Accent and buttons'],['tint','Soft accent'],['line','Lines']];
  const kit=(colors,display,text,logo,src)=>({src,logo,colors,fonts:{display:{name:display},text:{name:text}}});
  const BRAND_DEFAULT=kit({bg:'#F4F1EA',surface:'#FFFFFF',ink:'#1A1916',muted:'#5E5A52',accent:'#8C6A3F',tint:'#E9DFCF',line:'#DDD5C7'},'Cormorant Garamond','Hanken Grotesk',{text:'Seashore',sub:'Developments'},'Company profile · logo and brand guidelines');
  const DEV_BRANDS={
    dolphin:{own:true,...kit({bg:'#F2F4F3',surface:'#FFFFFF',ink:'#14232A',muted:'#4F5D63',accent:'#1F4E5F',tint:'#D3E3E7',line:'#D8DFDF'},'Cormorant Garamond','Hanken Grotesk',{text:'Dolphin Court',sub:'Grand Harbour · Paola'},'New development setup · uploaded 2 Sep')},
    onyx:{own:true,...kit({bg:'#EEEDEA',surface:'#FFFFFF',ink:'#111111',muted:'#58585A',accent:'#111111',tint:'#DEDCD6',line:'#D8D6D1'},'DM Serif Display','Hanken Grotesk',{text:'Onyx Rise',sub:'Mrieħel'},'New development setup · uploaded 18 Sep')},
    mercury:{own:true,...kit({bg:'#F1F0EE',surface:'#FFFFFF',ink:'#17181B',muted:'#55575C',accent:'#22252B',tint:'#DADCE2',line:'#DCDBD7'},'Fraunces','Hanken Grotesk',{text:'Mercury',sub:'Tower residences · St Julian’s'},'New development setup · uploaded 4 Aug')},
    lalex:{own:true,...kit({bg:'#F7F2EA',surface:'#FFFFFF',ink:'#2A1F16',muted:'#6A5A4B',accent:'#8A5A2B',tint:'#EEDCC6',line:'#E4D9C9'},'Libre Caslon Text','Hanken Grotesk',{text:'La Lex',sub:'Townhouse residences · Sliema'},'New development setup · uploaded 12 Jul')},
    verdala:{own:false,...kit({bg:'#F1F3EC',surface:'#FFFFFF',ink:'#1E2418',muted:'#596150',accent:'#4D5B3A',tint:'#DCE4CF',line:'#D9DED0'},'Cormorant Garamond','Hanken Grotesk',{text:'Verdala',sub:'Terraces · Rabat'},'No project brand · uses the company brand')},
  };
  function fontFamily(f,kind){
    const k=(FONTS.find(x=>x.n===f.name)||{}).k||kind;
    return `'${f.name}',${k==='serif'?'Georgia,serif':"'Helvetica Neue',Arial,sans-serif"}`;
  }
  // Brand kit → the token object every template reads (same shape as BRANDS in present-v3-data.js).
  function tokens(b){return {...b.colors,display:fontFamily(b.fonts.display,'serif'),text:fontFamily(b.fonts.text,'sans'),logo:b.logo};}
  // Loads Google fonts by name, or registers an uploaded font file.
  function loadFonts(b,doc){
    doc=doc||document;
    [b.fonts.display,b.fonts.text].forEach(f=>{
      const id='pf-'+f.name.replace(/\W+/g,'-');
      if(doc.getElementById(id)) return;
      if(f.data){const st=doc.createElement('style');st.id=id;st.textContent=`@font-face{font-family:'${f.name}';src:url(${f.data});font-display:swap}`;doc.head.appendChild(st);}
      else if(FONTS.some(x=>x.n===f.name)){const l=doc.createElement('link');l.id=id;l.rel='stylesheet';l.href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.name)}:wght@300;400;500;600&display=swap`;doc.head.appendChild(l);}
    });
  }
  function lum(hex){const n=parseInt(String(hex).replace('#',''),16);if(isNaN(n))return 0;const c=[n>>16,(n>>8)&255,n&255].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const onAccent=c=>ratio('#FFFFFF',c.accent)>=ratio(c.ink,c.accent)?'#FFFFFF':c.ink;
  // WCAG AA checks for a brand kit. Body text and buttons must reach 4.5:1.
  function checks(c){
    return [['Text on background',ratio(c.ink,c.bg)],['Secondary text',ratio(c.muted,c.bg)],['Button text',ratio(onAccent(c),c.accent)],['Text on cards',ratio(c.ink,c.surface)]]
      .map(([l,r])=>({l,r:Math.round(r*10)/10,ok:r>=4.5}));
  }

  function defaults(){
    return {
      v:1,when:'1 Nov',by:'Mark Galea',
      template:'signature',
      brand:clone(BRAND_DEFAULT),
      devBrands:clone(DEV_BRANDS),
      sections:Object.fromEntries(SECTIONS.map(s=>[s.k,s.st])),
      investFor:['investment','growth'],
      reserve:{mode:'request-pos',to:'rep'},          // mode: request | request-pos · to: rep | manager
      sending:'approve',                            // approve | auto
      access:{expiry:30,passcode:false,prices:true,tracking:true},
      legal:'Prices are valid for the period shown and depend on availability. Images are indicative and may show optional finishes. Rental and yield figures are estimates based on comparable lettings. They are not guaranteed and can go down as well as up. Room sizes are approximate.',
      log:[{v:1,when:'1 Nov',by:'Mark Galea',note:'First proposal standard'}],
    };
  }
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
  function load(){
    const s=read()||{};
    const pub=Object.assign(defaults(),s.pub||{});
    pub.sections=Object.assign(defaults().sections,(s.pub||{}).sections||{});
    pub.devBrands=Object.assign(defaults().devBrands,(s.pub||{}).devBrands||{});
    return {pub,draft:s.draft||null};
  }
  function save(st){localStorage.setItem(KEY,JSON.stringify(st));}
  // Is a section shown? 'data' sections still hide on their own when the data is missing.
  const shows=(std,k)=>!std||(std.sections[k]||'always')!=='off';

  window.PROPOSAL_STD={KEY,SECTIONS,TYPES,TEMPLATES,FONTS,COLOR_KEYS,defaults,load,save,clone,shows,tokens,loadFonts,checks,onAccent,reset(){localStorage.removeItem(KEY);}};
})();
