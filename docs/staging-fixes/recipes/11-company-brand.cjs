const logo=(bg,fg)=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="330" height="60"><text x="0" y="40" font-family="Georgia" font-size="34" fill="${fg}">LALEX</text><text x="128" y="40" font-family="Arial" font-size="13" letter-spacing="3" fill="${fg}">DEVELOPMENTS</text></svg>`)}`;
const buyer="document.getElementById('developer').scrollIntoView();await new Promise(r=>setTimeout(r,800));";
// Developer section edits on the Proposal page draft: numbers, awards, a fourth project with a photo, then reorder.
const trust="localStorage.removeItem('bricly.proposal.std');paOpenSettings();paTrust('years','31');paTrust('units','1,480');paTrust('guarantees','10-year structural guarantee and 2 years on finishes, backed by an insurer.');paTrust('awards','Malta Property Awards 2024, Best residential development\\nMalta Property Awards 2022, Best sea-view project');paProjAdd();{const T=PA_STATE.st.draft.trust,p=T.delivered[T.delivered.length-1];paProj(p.id,'name','Dolphin Court');paProj(p.id,'place','Paola');paProj(p.id,'year','2026');PA_STATE.st.draft.trust.delivered[3].img='assets/present/dev-dolphin.jpg';PROPOSAL_STD.save(PA_STATE.st);paProjMove(p.id,-3);}";
const seed=`coSet('logoLight',${JSON.stringify(logo('#fff','#2F5D50'))});coSet('logoDark',${JSON.stringify(logo('#000','#ffffff'))});coSet('accent','#2F5D50');`;
module.exports={
  viewport:{width:1440,height:2400},
  id:'11', title:'Company brand, and the proposal developer section',
  source:'Account Settings report · S-05, Opportunity Flow report · Q-03', devItems:'—',
  changes:[
    'Company profile has a **Brand** section: logo for light and dark backgrounds (upload with preview), brand colour (colour picker and hex), proposal colours with readability checks, headline and body fonts (pick or upload), trading name, line under the name, legal name, website and a short description.',
    'The Proposal page Brand section reads the company brand from Company profile: a read-only preview labelled **From Company profile** with an **Edit** link that opens Company profile.',
    'Settings › Proposal page has a new **Developer section** card for the buyer page’s “Built on trust”: years in business, projects delivered, units delivered, guarantees, awards, and delivered projects with a photo, name, place and year. Projects can be added, removed and reordered, with a live preview.',
    'The Developer section is drafted, previewed and published like the rest of the Proposal page.',
    'On the buyer page, Built on trust shows these numbers and photos. Guarantees replace the warranty promise and awards show as a list. Empty fields fall back to the existing proposal data. The heading keeps the developer name (“Why buy from Seashore.”).',
    'Legal name moved from Legal and billing into Brand, so it is entered once.',
  ],
  notes:[
    'Company profile is the single source of the company brand. The proposal standard copies trading name, light logo, all 7 colours and both fonts (including uploaded font files) into its company kit (`brand`). These apply straight away; they are the company’s identity, not a proposal draft.',
    'The Developer section is stored on the proposal standard as `trust`: `{years, projects, units, guarantees, awards, delivered:[{id, name, place, year, img}]}`. It is versioned with the standard, so sent proposals keep the version they were sent with.',
    'Buyer page: years, projects and units replace the matching numbers; guarantees replace the warranty promise; awards are one per line. Projects need a photo and a name to show. The on-schedule % and other promises still come from developer data. Field sources are in docs/buyer-proposal-data-sources.md.',
    'Uploads: logos SVG, PNG or WebP under 300 KB; project photos JPG, PNG or WebP under 400 KB, up to 6 projects. In the product, store files in media storage, not in the standard.',
  ],
  tryIt:'Open Settings › Proposal page › Developer section, change a number or add a project with a photo, then Preview draft and scroll to Built on trust. Company brand: Settings › Company profile.',
  before:[
    {label:'Company profile', run:"go('settings');stGo('p:company');", selector:'#st-root .st-main'},
    {label:'Proposal page › Brand', run:"localStorage.removeItem('bricly.proposal.std');paOpenSettings();", selector:"#st-root .st-card:has(h3:text-is('Brand'))"},
    {label:'Buyer proposal › Built on trust', url:'/prototypes/v3/proposal/index.html', run:buyer, selector:'#developer', wait:1200},
  ],
  after:[
    {label:'Company profile › Brand', run:"go('settings');stGo('p:company');", selector:'#st-root .st-main'},
    {label:'Proposal page › Brand, from Company profile', run:"localStorage.removeItem('bricly.proposal.std');paOpenSettings();", selector:'.pa-co'},
    {label:'Buyer proposal › Built on trust, from the published Developer section', run:trust+"paPublish();await new Promise(r=>setTimeout(r,50));setTimeout(()=>{location.href='proposal/index.html';});", selector:'#developer', wait:3000},
    {label:'Proposal page › Developer section (draft)', run:trust, selector:"#st-root .st-card:has(h3:text-is('Developer section'))"},
    {label:'Company profile with logos and a new colour, before saving', run:"go('settings');stGo('p:company');"+seed+"stRender();", selector:"#st-root .st-card:has(h3:text-is('Brand'))"},
    {label:'After saving: the Proposal page follows', run:"go('settings');stGo('p:company');"+seed+"stSave();paOpenSettings();", selector:'.pa-co'},
  ],
};
