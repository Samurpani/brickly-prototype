module.exports={
  id:'16', title:'€ inside every price field, commas everywhere',
  source:'Sam, staging review notes · Edit Unit and Unit Page report D-04', devItems:'D-04 (Edit Unit)',
  changes:[
    'Every price field shows **€ inside the field**. Labels no longer say "EUR", "· EUR" or "(€)".',
    'Numbers get **comma separators as you type** (1234567 shows as 1,234,567), in every price field and in any number field that holds thousands.',
    'One shared module (`money-format.js`) upgrades fields as they appear, so every screen follows the rule without opting in, including new screens.',
    'Fixed source labels: "Listing price · EUR", "Price · EUR", "List price (EUR)", "Agreed sale price (EUR)", "Commission payable (EUR)", "Standard plan · EUR". Marketing spend on the dashboard now has commas.',
    'Small counts (floor, bedrooms, bathrooms, %) stay normal number fields. Years, phone numbers and references never get commas.',
  ],
  notes:[
    'Rule for the product: **display and input use the same format**, €824,000. The stored value is a plain number (824000); formatting is presentation only.',
    'In the prototype, code that reads a formatted field gets plain digits back, so maths and validation are unchanged. In the real app, use one shared money input component with the same behaviour.',
    'Keep the caret in place while commas are inserted (the module counts digits before the caret).',
    'Accounts in other currencies (Present Mode has USD for Miami) should show their own symbol in the same position. The prototype CRM is euro-only.',
  ],
  tryIt:'Open any unit › Edit unit, or an opportunity › Log an offer, and type a price.',
  before:[
    {label:'Edit unit: Listing price', run:"deOpenUnit(UNITS[0].id);", selector:'#de-drawer'},
    {label:'Log an offer', run:"openOpp('OPP-1008'); oppOfferOpen(); const a=document.getElementById('ofAmt'); if(a){a.value='1234567';}", selector:'#qaDrawer'},
    {label:'Add unit: List price', run:"awUnit();", full:false},
  ],
  after:[
    {label:'Edit unit: € in the field, no "EUR" in the label', run:"deOpenUnit(UNITS[0].id);", selector:'#de-drawer'},
    {label:'Log an offer: typed 1234567 shows as 1,234,567', run:"openOpp('OPP-1008'); oppOfferOpen(); await new Promise(r=>setTimeout(r,200)); const a=document.getElementById('ofAmt'); if(a){a.value='1234567';}", selector:'#qaDrawer'},
    {label:'Add unit: List price with €', run:"awUnit();", full:false},
  ],
};
