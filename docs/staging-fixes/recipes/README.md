# Staging fixes recipes

One file per update: `NN-slug.cjs`. Build the pages with `node docs/build/staging-fixes.cjs [id]`.

```js
module.exports={
  id:'01', title:'Offer to promise of sale as one flow',
  source:'Opportunity Flow report · S-07', devItems:'D-36, D-38, D-39',
  changes:['…'], notes:['…'], tryIt:'Open Opportunities › Maria Borg › Log an offer',
  before:[{label:'Offer drawer', run:"openOpp('OPP-1008'); oppOfferOpen();"}],   // runs on the snapshot taken before the work
  after:[{label:'Offer drawer', run:"openOpp('OPP-1008'); oppOfferOpen();", selector:'#qaDrawer'}], // runs on the working tree
};
```
`run` is page JavaScript (may use await). Optional: `url`, `selector` (screenshot one element), `full` (full page), `wait` (ms).
Before shots must use only code that exists in `.tmp/before-snapshot` (the copy taken before the work started).
