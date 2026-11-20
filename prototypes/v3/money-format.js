// Money and number inputs, one rule everywhere (Sam, staging review; Edit Unit D-04):
// price fields show € inside the field (never "EUR" in the label) and every number is shown with comma separators,
// as you type and on display. Inputs are upgraded automatically as they appear, so no screen has to opt in.
// Code that reads input.value still gets plain digits ("824000"), so existing maths keeps working.
(function(){
  const NATIVE=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  const MONEY=/price|amount|deposit|budget|offer|commission|payment|cost|fee|value|€|\bEUR\b|instal|balance|salary|income|funds|revenue|target €|limit €/i;
  const NOT_MONEY=/%|percent|bed|bath|floor|size|m²|sqm|sq ft|area|year|since|unit count|units|count|days|hours|minutes|qty|quantity|age|phone|number of/i;
  const NO_COMMAS=/year|since|phone|pin|code|zip|postcode|ref\b|id\b/i;

  function labelText(el){
    const bits=[el.getAttribute('aria-label'),el.placeholder,el.name,el.id,el.dataset.label];
    if(el.id){const l=document.querySelector(`label[for="${CSS.escape(el.id)}"]`);if(l) bits.push(l.textContent);}
    const wrap=el.closest('label,.od-field,.ff,.field,.st-field,.qa-field,.de-field,td,.form-row');
    const l2=wrap&&wrap.querySelector('label,.lbl,.label,.st-l,.ff-l');
    if(l2&&l2!==el) bits.push(l2.textContent);
    if(wrap&&wrap.tagName==='LABEL') bits.push(wrap.textContent);
    return bits.filter(Boolean).join(' ');
  }
  const digits=s=>String(s??'').replace(/[^\d.-]/g,'');
  const commas=s=>{
    const raw=digits(s); if(raw===''||raw==='-') return raw;
    const neg=raw.startsWith('-'), [i,d]=raw.replace(/-/g,'').split('.');
    return (neg?'-':'')+(i||'0').replace(/^0+(?=\d)/,'').replace(/\B(?=(\d{3})+(?!\d))/g,',')+(d!==undefined?'.'+d.slice(0,2):'');
  };

  function upgrade(el,money){
    if(el.dataset.numUp) return; el.dataset.numUp=money?'money':'num';
    const start=NATIVE.get.call(el);
    el.type='text'; el.inputMode='decimal'; el.autocomplete='off';
    Object.defineProperty(el,'value',{configurable:true,
      get(){return digits(NATIVE.get.call(this));},
      set(v){NATIVE.set.call(this,commas(v));}});
    NATIVE.set.call(el,commas(start));
    el.addEventListener('input',()=>{
      const before=NATIVE.get.call(el), pos=el.selectionStart??before.length;
      const keep=before.slice(0,pos).replace(/[^\d.]/g,'').length;
      const next=commas(before); if(next===before) return;
      NATIVE.set.call(el,next);
      let p=0,n=0; while(p<next.length&&n<keep){if(/[\d.]/.test(next[p])) n++; p++;}
      try{el.setSelectionRange(p,p);}catch{}
    });
    if(money){
      const own=[...(el.parentElement?.children||[])].some(c=>c!==el&&c.tagName!=='INPUT'&&c.textContent.trim()==='€');
      if(!own){
        const wrap=document.createElement('span'); wrap.className='money-in';
        el.parentNode.insertBefore(wrap,el); wrap.appendChild(el);
        wrap.insertAdjacentHTML('afterbegin','<span class="money-sym" aria-hidden="true">€</span>');
      }
      if(!el.getAttribute('aria-label')){const t=labelText(el).replace(/\s+/g,' ').trim();if(t) el.setAttribute('aria-label',t.replace(/\s*[·(]?\s*\bEUR\b\)?/g,'').slice(0,60)+' in euro');}
      stripEur(el);
    }
  }
  // "Listing price · EUR", "List price (EUR)" → "Listing price": the € in the field says it.
  function stripEur(el){
    const wrap=el.closest('.od-field,.ff,.field,.st-field,.qa-field,.de-field,label,td,.form-row'); if(!wrap) return;
    wrap.querySelectorAll('label,.lbl,.label,.st-l,.ff-l').forEach(l=>{
      l.childNodes.forEach(n=>{if(n.nodeType===3&&/\bEUR\b|\(€\)|·\s*€/.test(n.nodeValue)) n.nodeValue=n.nodeValue.replace(/\s*[·(]\s*(EUR|€)\s*\)?|\s*\bEUR\b/g,'');});
    });
  }
  function scan(root){
    (root.querySelectorAll?root:document).querySelectorAll('input:not([data-num-up])').forEach(el=>{
      if(el.dataset.noFormat!==undefined||el.hasAttribute('data-aw-money')) return;
      const t=(el.getAttribute('type')||'text').toLowerCase(), txt=labelText(el);
      const flagged=el.dataset.money!==undefined;
      if(t==='number'){
        if(NO_COMMAS.test(txt)||+el.min>=1900) return;
        const money=flagged||(MONEY.test(txt)&&!NOT_MONEY.test(txt));
        // Small counts (floor, beds, %) keep the native number field and its checks; commas only matter from 1,000 up.
        if(!money&&!(Math.abs(+NATIVE.get.call(el))>=1000||+el.min>=1000||+el.max>=10000||+el.step>=100)) return;
        upgrade(el,money);
      }else if(t==='text'&&(flagged||(MONEY.test(txt)&&!NOT_MONEY.test(txt)&&/^[\s€\d,.]*$/.test(NATIVE.get.call(el))&&!/name|note|message|condition|plan\b|search|link|url|email/i.test(txt)))){
        upgrade(el,true);
      }
    });
  }
  const css=document.createElement('style'); css.id='money-format-css';
  css.textContent=`.money-in{position:relative;display:block;width:100%}.money-in>input{width:100%;padding-left:26px!important}
  .money-sym{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--ink-3,#777);pointer-events:none;font-size:inherit}
  td .money-in,.de-int-row .money-in{display:inline-block}`;
  document.head.appendChild(css);
  const run=()=>{scan(document);new MutationObserver(ms=>{for(const m of ms) for(const n of m.addedNodes) if(n.nodeType===1){if(n.tagName==='INPUT') scan(n.parentNode||document); else scan(n);}}).observe(document.body,{childList:true,subtree:true});};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.moneyFmt={commas,digits,scan};
})();
