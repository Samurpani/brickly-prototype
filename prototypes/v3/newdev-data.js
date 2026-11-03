// New development setup v2 data (from the "Bricly New Development v2" design): steps, questions, buyers, names, imports and brief.
(function(){
const intl=c=>c.intl, inv=c=>c.investor;
const multi=c=>c.ptype==='Multi-block'||c.ptype==='Mixed development';
const ND={};
const YNS=[['Yes','It’s ready to upload'],['No','We don’t have one'],['Still changing','We have a version, but it isn’t final']];
ND.STEPS=[['project','Project','3 min'],['inventory','Inventory & drawings','5 min'],['buyers','Target buyers','4 min'],['collateral','Marketing collateral','6 min'],['launch','Launch & go-to-market','4 min'],['review','Review & brief'],['imports','Confirm units']];
ND.Q={
project:[
 {id:'name',s:'Name',t:'What’s the development called?',h:'A working name is fine. You can change it later.',type:'text',ph:'e.g. Mellieħa Ridge',alt:{l:'Need help coming up with a name',v:'Needs a name',note:'No problem. We’ll gather everything about the project first, then suggest names at the end.'},noSkip:1},
 {id:'loc',s:'Location',t:'Where is it?',h:'Search the address, then confirm the pin. Needed to activate.',type:'address',fmt:'Triq il-Qammieħ, Mellieħa · pin confirmed',noSkip:1},
 {id:'ptype',s:'Project type',t:'What type of project is it?',type:'cards',opts:[['Single block','One building'],['Multi-block','Two or more residential blocks'],['Mixed development','Homes plus retail, office or hospitality']]},
 {id:'blocks',s:'Blocks',t:'How many blocks are there?',h:'Lets us map renders and floor plans to the right block later.',type:'blocks',alt:{l:'Help me name the blocks later',note:'We’ll suggest block names at the end, alongside the development name.'},show:multi},
 {id:'mixuse',s:'Other uses',t:'What else is in the development besides homes?',type:'chips',opts:['Retail','Office','Hospitality','Restaurant or café','Parking for sale'],show:c=>c.ptype==='Mixed development'},
 {id:'ptypeHomes',s:'Homes',t:'What kind of homes?',type:'chips',opts:['Apartments','Penthouses','Maisonettes','Townhouses','Villas']},
 {id:'tier',s:'Tier',t:'How would you position the project?',h:'Sets the production level we recommend in the brief.',type:'cards',opts:[['High-end','Premium finishes, top of the local market'],['Mid-sized','The middle of the local market'],['Small project','A handful of homes']],sug:{v:'Mid-sized',why:'Most multi-block developments in Mellieħa sit in the middle of the local market.',basis:['Location','Project type','Sales nearby']}},
 {id:'build',s:'Build stage',t:'Where is construction?',type:'cards',opts:[['Not started',''],['Under construction',''],['Completed','']]},
 {id:'compl',s:'Completion',t:'When do you expect completion?',h:'Pick the quarter and year.',type:'quarter'},
 {id:'launch',s:'Selling yet?',t:'Are you selling yet?',type:'cards',opts:[['Not launched yet','We’ll plan the launch'],['Already selling','We’ll move your live deals across']]},
{id:'sold',s:'Sales so far',t:'How is it selling so far?',h:'Rough numbers are fine. We’ll reconcile them with your availability list.',type:'form',fields:[['Units sold','','e.g. 12'],['Reserved or held','','e.g. 3'],['Selling since','','e.g. Mar 2026']],fmt:'Sales so far recorded',show:c=>c.launch==='Already selling'},
 {id:'live',s:'Already live',t:'What’s already live for this project?',h:'So we don’t plan work that already exists.',type:'chips',opts:['Website','Portal listings','Social media','Paid ads','Agents appointed','Sales office or show unit','Brochure'],free:1,show:c=>c.launch==='Already selling'},
 {id:'deals',s:'Existing deals',t:'Do you have leads and deals to move across?',h:'Bricly imports them so nothing is tracked twice.',type:'cards',opts:[['Yes, upload a list','Excel, CSV or a CRM export'],['Yes, later','We’ll remind you from the development page'],['No','Start fresh']],show:c=>c.launch==='Already selling'},
 {id:'ldate',s:'Launch date',t:'When do you plan to launch?',type:'date',show:c=>c.launch!=='Already selling'},
 {id:'nameProps',s:'Pick a name',t:'Pick a name for the development',h:'Bricly AI has researched the location and the history of the site. Browse the names for each angle and select the one that fits best.',type:'naming',show:c=>c.name==='Needs a name'},
 {id:'blockNames',s:'Block names',t:'Pick names for your three blocks',h:'Each set follows the development name. You can rename any block later.',type:'cards',opts:[['The Bay · The Ridge · The Tower','From landmarks you can see from the site'],['Ramla · Għadira · Paradise','Named after the nearby bays'],['Kala One · Kala Two · Kala Three','Simple and easy for buyers to remember']],show:c=>/names to come/.test(c.blocks||'')}],
inventory:[
 {id:'pricing',s:'Pricing',t:'Is the price list ready?',h:'If prices aren’t set yet you can still upload the unit list and add prices later.',type:'cards',opts:[['Yes, prices are set','Upload the availability list with prices'],['Units yes, prices not yet','Upload the unit list. We’ll remind you to add prices.'],['No list yet','Add units later from the development page']],noSkip:1},
 {id:'files',s:'Upload files',t:'Upload your inventory and drawings',h:'Add what you have now. When you continue, Bricly starts reading the files in the background, and you review the results at the end.',type:'uploads',slots:[
  ['avail','Availability list with prices','Excel, PDF or a photo · needed to activate','MR availability 30-Sep.xlsx'],
  ['plans','Floor plans','Bulk upload, any format','24 files'],
  ['arch','Architectural drawings','Plans, sections, GA drawings','MR-arch-set-rev3.pdf'],
  ['elev','Elevations','Each facade','4 files'],
  ['site','Site plan','','MR-site-plan.pdf'],
  ['spec','Specification and inclusions','Upload or type it later','MR-spec-v2.pdf']]},
 {id:'terms',s:'Payment terms & finishes',t:'Payment terms and finishes list',h:'Fill these in if they aren’t in a document yet. You can also upload one instead.',type:'terms'}],
buyers:[
 {id:'buyers',s:'Buyers',t:'Who are you selling to?',h:'Select one or more primary and secondary buyers.',type:'buyers'},
 {id:'countries',s:'Buyer countries',t:'Which countries are buyers typically in?',src:'Source: 212 sales within 3 km since 2023 (Bricly market data) and your sales history.',h:'Based on previous sales in the area and market data. We’ll use this to help build your launch plan and strategy later. Approve, remove or add countries.',type:'countries'},
 {id:'langs',s:'Languages',t:'Which languages should the marketing use?',h:'Prefilled from the countries you approved.',type:'chips',opts:['English','Italian','German','Maltese','French'],show:intl},
 {id:'legal',s:'Legal partner',t:'Do you have a legal or visa partner for overseas buyers?',type:'cards',opts:[['Yes',''],['No','']],show:intl},
 {id:'yield',s:'Yield',t:'What rental yield do you expect, and where does the figure come from?',h:'A figure with no source is stored as your estimate.',type:'form',fields:[['Yield','','e.g. 4.8%'],['Source','','e.g. Agent valuation, Aug 2026']],fmt:'Yield and source recorded',show:inv},
 {id:'features',s:'Project features',t:'What are the project’s standout features?',h:'Select everything buyers should know about, and add your own.',type:'chips',opts:['Open sea views','Penthouses with pools','Large open-plan living','Large terraces','Underground parking','Communal pool','Gym','Smart-home systems','Storage rooms','Concierge'],free:1},
 {id:'reasons',s:'Top three reasons',t:'Pick the top three reasons to buy',h:'Your features plus market reasons like Golden Visa. Three is enough for marketing.',type:'chips',opts:['Sea views','Walk to Mellieħa Bay','Large terraces','Underground parking','Completion in 2027','Golden Visa','SDA Property'],free:1,help:'Sea views from every upper-floor home, a six-minute walk to Mellieħa Bay, and terraces of 20 m² or more on all 2- and 3-beds.',helpBasis:['Unit mix','Location','Buyers']},
 {id:'comp',s:'Competitors',t:'Which developments nearby will buyers compare you with?',h:'Suggested from listings within 3 km. Add your own.',type:'chips',sugChips:1,opts:['Għadira Point','Tal-Bniet Residences'],free:1}],
collateral:[
 {id:'cintro',s:'Introduction',t:'Now, your marketing collateral',type:'intro',noSkip:1,skipStage:1},
 {id:'brand',s:'Brand',grp:'Brand',t:'Do you have a brand for this development?',h:'A logo, colours and fonts for the project, or your company brand if you use it for every development.',type:'cards',opts:YNS},
 {id:'brandUp',s:'Upload brand',grp:'Brand',t:'Upload your brand files',h:'Anything marked Still changing keeps a work-in-progress label.',type:'uploads',slots:[['logo','Logo files','SVG or PNG, light and dark versions','mellieha-ridge-logo.svg'],['guide','Brand guidelines','PDF',''],['fonts','Fonts','Files or font names',''],['colours','Colour values','Hex or Pantone','']],show:c=>c.brand==='Yes'||c.brand==='Still changing'},
 {id:'houseUp',s:'Company brand',grp:'Brand',t:'Upload your company brand',h:'Logo and guidelines, so every piece of collateral uses the right marks.',type:'uploads',slots:[['hlogo','Company logo','SVG, PNG or PDF','vella-holdings-logo.svg'],['hguide','Brand guidelines','PDF','']],show:c=>c.brand==='We’ll use our company brand'},
 {id:'brandHelp',s:'Brand help',grp:'Brand',t:'Do you need help coming up with the brand?',type:'cards',opts:[['Yes, help me','We’ll ask a few questions and add a brand brief'],['No','We’ll use our company brand or sort it ourselves']],show:c=>c.brand==='No'},
 {id:'feel',s:'Brand feel',grp:'Brand',t:'Which feel fits best?',h:'Pick one. It steers the brand brief, not a finished design.',type:'cards',mood:1,opts:[['Timeless and refined','Permanence, legacy, refined'],['Clean and architectural','Clean, architectural, quiet'],['Warm and natural','Natural, calm, tactile'],['Light and leisurely','Light, airy, leisure'],['Sharp and investor-focused','Dense, sharp, investor'],['Bold and expressive','Expressive, branded, energetic']],sug:{v:'Light and leisurely',why:'Suits a sea-view project for upgraders and relocators.',basis:['Buyers','Location']},show:c=>c.brandHelp==='Yes, help me'},
 {id:'refs',s:'References',grp:'Brand',t:'Any brands or developments you like?',type:'uploads',slots:[['ref','Links or images','Paste links or drop images','2 links · 1 image']],show:c=>c.brandHelp==='Yes, help me'},
 {id:'devline',s:'Developer line',grp:'Brand',t:'Show “by Vella Holdings” under the logo?',type:'cards',opts:[['Yes',''],['No','']],show:c=>c.brandHelp==='Yes, help me'},
 {id:'renders',s:'Renders',grp:'Renders',t:'Do you have renders?',h:'Exterior, interior and individual unit renders.',type:'cards',opts:YNS},
 {id:'rendUp',s:'Upload renders',grp:'Renders',t:'Upload your renders',h:'Mark each set Final approved or Work in progress. Only final renders can be used in ads.',type:'uploads',slots:[['ext','Exterior renders','Hero, facades, aerial','6 files · final'],['int','Interior renders','Living, kitchen, bedrooms per unit type','8 files · 2 work in progress'],['unit','Individual unit renders','Views from specific units','']],show:c=>c.renders==='Yes'||c.renders==='Still changing'},
 {id:'rendNeed',s:'Renders needed',grp:'Renders',t:'Which renders do you need?',h:'This becomes the shot list in your brief.',type:'chips',opts:['Hero exterior','Facade per block','Aerial','Interiors per unit type','Individual unit views','Amenities','Lifestyle'],show:c=>c.renders==='No'||c.renders==='Still changing'},
 {id:'rendStyle',s:'Render style',grp:'Renders',t:'Any style preference?',h:'Optional.',type:'cards',opts:[['Warm and lifestyle',''],['Cool and editorial',''],['Bright and airy',''],['Moody and dramatic','']],show:c=>c.renders==='No'||c.renders==='Still changing'},
 {id:'brochure',s:'Brochure',grp:'Brochure',t:'Do you have a marketing brochure for the project?',type:'cards',opts:YNS},
 {id:'broUp',s:'Upload brochure',grp:'Brochure',t:'Upload the brochure',type:'uploads',slots:[['bro','Brochure','PDF or print files','Mellieha-Ridge-brochure.pdf']],show:c=>c.brochure==='Yes'||c.brochure==='Still changing'},
 {id:'broNeed',s:'Brochure in brief',grp:'Brochure',t:'Should a brochure go into the brief?',type:'cards',opts:[['Yes, add it',''],['No, not needed','']],show:c=>c.brochure==='No'},
 {id:'broSpec',s:'Brochure details',grp:'Brochure',t:'Print, digital or both?',type:'cards',opts:[['Print',''],['Digital',''],['Both','']],show:c=>c.broNeed==='Yes, add it'},
 {id:'otherHave',s:'Other material',grp:'Everything else',t:'Do you already have any of this material?',h:'Add what exists. Anything missing can go on the launch checklist next.',type:'uploads',slots:[['web','Website','Paste the link','','link','https://'],['pres','Sales presentation','PDF or deck','Sales deck v2.pdf'],['adsf','Ad designs','Images or video','6 creatives'],['soc','Social media profiles','Paste the profile links','','link','instagram.com/…'],['emailf','Email templates','HTML, PDF or a link','']]},
 {id:'otherNeed',s:'Launch checklist',grp:'Everything else',t:'For a successful launch, here’s the material you’ll need',h:'Select the items you still need to build out. They go into your brief.',type:'chips',list:1,opts:[['Website','Project site with a registration form'],['Sales presentation','For your sales team and agents'],['Ad designs','Creatives for Meta, Google and portals'],['Social media','Profiles and launch posts'],['Email templates','For registrations and past clients'],['Lifestyle content','Photography and copy about living there'],['Marketing / lifestyle video','Launch film and short cuts for social']]}],
launch:[
 {id:'lintro',s:'Introduction',t:'Launch and go-to-market',h:'A few short questions about how you’ll take the project to market. They shape the launch plan and the brief. Skip the stage if you’d rather do this later.',type:'intro',noSkip:1,skipStage:1},
 {id:'plan',s:'Launch plan',t:'Do you have a marketing launch plan?',type:'cards',opts:[['Yes','We’ll upload it'],['No','We don’t have one yet'],['Still working on it','We’ll upload what we have']]},
 {id:'planUp',s:'Upload plan',t:'Upload the plan',type:'uploads',slots:[['plan','Launch or marketing plan','PDF, deck or spreadsheet','Launch plan Q1 2027.pdf']],show:c=>c.plan==='Yes'||c.plan==='Still working on it'},
 {id:'gtm',s:'Go-to-market',t:'Do you know how you’ll take this development to market?',type:'cards',opts:[['Yes, I know how','We’ll confirm a few decisions'],['I have some idea','We’ll fill in the gaps together'],['No, I need help','We’ll add a go-to-market plan to the brief']]},
 {id:'gtmNote',s:'Plan in brief',t:'We’ll add a go-to-market plan to your brief',type:'note',body:'Based on your buyers, launch date and collateral, the brief will ask for a launch plan covering channels, timing and budget. You can still answer the questions below if you know the answers.',show:c=>c.gtm==='No, I need help'},
 {id:'planNote',s:'Plan read',t:'We’ve read your plan',type:'note',body:'We found the launch model, channels and budget in the plan. Confirm the decisions below; the rest comes from your document and is quoted in the brief.',show:c=>c.plan==='Yes'},
 {id:'model',s:'Launch model',t:'How will you launch?',type:'cards',opts:[['Build up to a launch date','Register interest first'],['Straight to market','Prices public from day one']]},
 {id:'plist',s:'Price list',t:'How will you show the price list?',type:'cards',opts:[['Behind registration',''],['Shown publicly','']],sug:{v:'Behind registration',why:'With a build-up launch, it turns price interest into registrations.',basis:['Launch model','Competitors']}},
 {id:'chan',s:'Channels',t:'Which channels will you use?',type:'chips',opts:['Meta','Google','YouTube','LinkedIn','Property portals','Agent network','Email to past clients','Events','PR','WhatsApp broadcast'],show:c=>c.gtm!=='No, I need help',show:c=>c.plan!=='Yes'},
 {id:'budget',s:'Budget',t:'What’s the monthly marketing budget?',type:'form',fields:[['From','','e.g. €4,000'],['To','','e.g. €7,000']],fmt:'Budget range recorded',show:c=>c.plan!=='Yes'},
 {id:'target',s:'Sales targets',t:'What are your sales targets?',h:'How you expect sales to split, and when you aim to be sold out.',type:'split'}],
imports:[{id:'imports',s:'Imports',t:'Review what Bricly imported',h:'Prices and unit statuses always wait for you to confirm.',type:'imports'},{id:'saved',s:'Saved as draft',t:'Your imports are saved to the draft',type:'saved',noSkip:1},{id:'complete',s:'Done',t:'Setup complete',type:'complete',noSkip:1,last:1}],
review:[{id:'production',s:'Production',t:'Who should produce what you still need?',h:'Asked once for everything on your checklist. We’ll send over a quote once the request comes through. Nothing starts until you accept it.',type:'cards',noSkip:1,opts:[['Yes, Bricly produces everything','Branding, renders, brochure and the rest of your checklist'],['No, I’ll use my own creative agency','You get a brief to hand to them']]},{id:'review',s:'Review',t:'Review your brief and marketing collateral',type:'review'}]
};
ND.NAMES=[
 {k:'place',l:'From the place',d:'Il-Qammieħ ridge, Mellieħa Bay, Għadira',names:[{n:'Kala Ridge',why:'“Kala” is Maltese for a small bay'},{n:'Il-Qammieħ',why:'The ridge the site sits on'},{n:'Għadira Heights',why:'Looks over Għadira Bay'}]},
 {k:'building',l:'From the building',d:'Three blocks, deep terraces, sea-facing',names:[{n:'Terraċċa',why:'Every 2- and 3-bed has a large terrace'},{n:'The Three',why:'Three blocks on one ridge'},{n:'Seafront Stack',why:'Stepped blocks facing the sea'}]},
 {k:'story',l:'From the story',d:'Old farm terraces and the coastal watchtower nearby',names:[{n:'Torri',why:'After the 17th-century watchtower nearby'},{n:'Ħajt Ridge',why:'The rubble walls of the old farm terraces'},{n:'Red Tower Rise',why:'The landmark visible from the site'}]},
 {k:'lifestyle',l:'From the lifestyle',d:'Slow mornings, the beach, the north of the island',names:[{n:'Slow North',why:'The pace of life in the north'},{n:'Baia',why:'Mornings at the bay'},{n:'Mellieħa Living',why:'Simple and clear for overseas buyers'}]}];
ND.BUY=[
 {k:'oinv',n:'Overseas investor',d:'Buys to let, rarely visits. Wants yield and simple management.',b:'€250k–€450k',intl:1,inv:1},
 {k:'oreloc',n:'Overseas relocator or retiree',d:'Moving to Malta for lifestyle, work or retirement.',b:'€350k–€700k',intl:1},
 {k:'holiday',n:'Holiday-home buyer',d:'Uses it a few months a year and lets it the rest.',b:'€300k–€600k',both:1},
 {k:'linv',n:'Local investor',d:'Buys off-plan to rent out or resell on completion.',b:'€220k–€400k',inv:1},
 {k:'first',n:'Local first-time buyer',d:'Couple or young family, using a bank loan and grants.',b:'€200k–€320k'},
 {k:'upg',n:'Local upgrader or second home',d:'Selling a smaller home. Wants space, a terrace and parking.',b:'€350k–€650k'},
 {k:'down',n:'Downsizer or retiree',d:'Leaving a family house for something easier to run.',b:'€300k–€550k'},
 {k:'lux',n:'Luxury end-user',d:'Wants the best home in the building. Penthouses, sea views.',b:'€650k+',both:1}];
ND.SUG={primary:{k:'upg',why:'The 2- and 3-bed mix with terraces suits families moving up. Most Onyx Rise buyers were local upgraders.',basis:['Unit mix','Price range','Onyx Rise']},secondary:{k:'oreloc',why:'Sea views and a quieter pace draw overseas relocators to Mellieħa. Onyx Rise sold 8 homes to UK buyers.',basis:['Location','Onyx Rise']}};
ND.COUNTRIES=[{n:'Malta',why:'Local buyers in Mellieħa, 2023–2025',pct:58},{n:'United Kingdom',why:'Largest overseas group · 8 Onyx Rise buyers',pct:17},{n:'Italy',why:'Short flights, steady demand for the north',pct:9},{n:'Germany',why:'Retirees buying sea-view homes',pct:5},{n:'Netherlands',why:'Relocators and holiday-home buyers',pct:4},{n:'Sweden',why:'Retirees, often through agents',pct:3}];
ND.MOOD={'Timeless and refined':{pal:['#2B2620','#6B5D4F','#B08D57','#D9CDBA'],f:"'Cormorant Garamond',serif",w:600},'Clean and architectural':{pal:['#F4F2EE','#1B1B1D','#3A3A3E','#C9C7C2'],f:"'Space Grotesk',sans-serif",w:300},'Warm and natural':{pal:['#D9C7A7','#8A9B77','#C0704D','#7A6248'],f:"'Space Grotesk',sans-serif",w:500},'Light and leisurely':{pal:['#F5F1E8','#2E5266','#C9B99B','#9FB8C4'],f:"'Cormorant Garamond',serif",w:500},'Sharp and investor-focused':{pal:['#17181A','#2E3033','#C8CACD','#E8590C'],f:"'Archivo',sans-serif",w:800},'Bold and expressive':{pal:['#EFE9DC','#111114','#E33E5A','#F2B33D'],f:"'Archivo',sans-serif",w:800}};
ND.SORT=[['Availability list','42 rows found · prices and statuses detected'],['Floor plans','24 files sorted by unit type'],['Architectural drawings','18 sheets classified'],['Elevations','4 facades detected'],['Site plan','Boundary and access read'],['Specification','36 inclusions found']];
ND.IMPORTS=[
 {k:'avail',n:'Availability list',f:'MR availability 30-Sep.xlsx',res:'42 units read · 4 rows flagged',act:'Review units',warn:1,need:'Needed to activate'},
 {k:'plans',n:'Floor plans',f:'24 files',res:'21 matched to units · 3 to place',act:'Fix 3 plans',warn:1},
 {k:'arch',n:'Architectural drawings',f:'MR-arch-set-rev3.pdf',res:'18 sheets classified',act:'View'},
 {k:'elev',n:'Elevations',f:'4 files',res:'4 facades detected · ready for unit mapping',act:'View'},
 {k:'site',n:'Site plan',f:'MR-site-plan.pdf',res:'Site boundary and access read',act:'View'},
 {k:'spec',n:'Specification',f:'MR-spec-v2.pdf',res:'36 inclusions extracted',act:'Check'}];
ND.BRIEFGEN=1;
ND.BRIEF=[
 ['Project context','A development of about 42 apartments in three blocks on Triq il-Qammieħ, Mellieħa, by Vella Holdings. Prices from €285,000 to €690,000. Under construction; launch planned for 18 Jan 2027. The development still needs a name.'],
 ['Buyers and countries','Primary: local upgraders and second-home buyers. Secondary: overseas relocators and retirees from the United Kingdom, Italy and Germany. Marketing in English and Italian.'],
 ['Reasons to buy','Sea views from every upper-floor home, a six-minute walk to Mellieħa Bay, and terraces of 20 m² or more on all 2- and 3-beds.'],
 ['Objections','Distance to Valletta, summer traffic on the bypass, and prices close to some Sliema resale stock.'],
 ['Competitors','Għadira Point, Tal-Bniet Residences.'],
 ['Brand','A project brand is needed. Feel: light and leisurely. Show “by Vella Holdings” under the logo.'],
 ['Renders shot list','Planned, not yet produced: hero exterior, facade per block, interiors per unit type, individual unit views. Produced by the developer’s own visual studio. Style: bright and airy.'],
 ['Other deliverables','Planned, not yet produced: brochure (print and digital), website, sales presentation, ad designs.'],
 ['Existing material','Social media profiles on Instagram and Facebook.'],
 ['Go-to-market','Build up to the launch date with the price list behind registration. Direct sales plus agents. Budget €4,000–€7,000 a month. Target: 20 homes by Dec 2027.'],
 ['Timing','15 weeks to launch, which is tight with overseas buyers. Brand first, then renders, brochure and website. Ads go live four weeks before launch.'],
 ['Open questions','Legal or visa partner for overseas buyers. Expected completion month.']];
ND.REQ=['Brand identity','Renders shot list','Brochure','Website','Sales presentation','Ad designs'];
ND.CAPUNITS=['A-101','A-102','A-201','B-101','B-102','C-101','C-102','C-201','C-301','C-401'];
window.ND2=ND;
})();
