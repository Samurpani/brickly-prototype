/* Minimal PDF writer for the buyer proposal downloads (no dependencies).
   A4 pages, Helvetica and Helvetica-Bold (WinAnsi), filled rectangles, lines and JPEG images.
   Coordinates are in points from the top-left corner. proposal.js lays out the pages. */
(function(){
  const W=595.28, H=841.89;
  // WinAnsi covers Latin-1 plus a few typographic marks; Maltese letters fall back to their base letter.
  const MAP={'€':0x80,'‚':0x82,'„':0x84,'…':0x85,'‘':0x91,'’':0x92,'“':0x93,'”':0x94,'•':0x95,'–':0x96,'—':0x97,'™':0x99,
    'ħ':'h','Ħ':'H','ż':'z','Ż':'Z','ċ':'c','Ċ':'C','ġ':'g','Ġ':'G','→':'>','←':'<','↓':'','✓':'','≈':'~','−':'-'};
  function enc(s){
    let o='';
    for(const ch of String(s??'')){
      const m=MAP[ch], c=ch.charCodeAt(0);
      if(typeof m==='number') o+=String.fromCharCode(m);
      else if(typeof m==='string') o+=m;
      else if(c<256) o+=ch;
      else o+='?';
    }
    return o.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  }
  const ctx=document.createElement('canvas').getContext('2d');
  function width(s,size,bold){ctx.font=`${bold?'bold ':''}${size}px Helvetica, Arial, sans-serif`;return ctx.measureText(String(s??'')).width;}
  function lines(s,size,max,bold){
    const out=[];
    String(s??'').split('\n').forEach(par=>{
      let cur='';
      par.split(/\s+/).filter(Boolean).forEach(w=>{const t=cur?cur+' '+w:w;if(cur&&width(t,size,bold)>max){out.push(cur);cur=w;}else cur=t;});
      out.push(cur);
    });
    return out;
  }
  const rgb=hex=>{const n=parseInt(String(hex||'#000').replace('#',''),16);return [(n>>16)/255,((n>>8)&255)/255,(n&255)/255].map(v=>v.toFixed(3)).join(' ');};
  const f=n=>(+n).toFixed(2);

  function Page(doc){
    const ops=[];
    const p={
      ops,images:[],
      text(x,y,s,o={}){const size=o.size||10;let tx=x;if(o.align==='right')tx=x-width(s,size,o.bold);else if(o.align==='center')tx=x-width(s,size,o.bold)/2;
        ops.push(`BT /${o.bold?'F2':'F1'} ${size} Tf ${rgb(o.color||'#1d1d1b')} rg ${f(tx)} ${f(H-y-size*.8)} Td (${enc(s)}) Tj ET`);return y+size*(o.lh||1.35);},
      wrap(x,y,w,s,o={}){const size=o.size||10;lines(s,size,w,o.bold).forEach(l=>{y=p.text(x,y,l,o);});return y;},
      rect(x,y,w,h,o={}){ops.push(`${o.fill?rgb(o.fill)+' rg ':''}${o.stroke?rgb(o.stroke)+' RG '+f(o.lw||.6)+' w ':''}${f(x)} ${f(H-y-h)} ${f(w)} ${f(h)} re ${o.fill&&o.stroke?'B':o.fill?'f':'S'}`);},
      line(x1,y1,x2,y2,o={}){ops.push(`${rgb(o.color||'#d6d2c8')} RG ${f(o.lw||.6)} w ${f(x1)} ${f(H-y1)} m ${f(x2)} ${f(H-y2)} l S`);},
      image(img,x,y,w,h){const n=doc.addImage(img);p.images.push(n);ops.push(`q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(H-y-h)} cm /Im${n} Do Q`);},
    };
    return p;
  }

  window.ProposalPDF={
    W,H,width,lines,
    create(){
      const pages=[], imgs=[];
      const doc={
        page(){const p=Page(doc);pages.push(p);return p;},
        addImage(img){let i=imgs.indexOf(img);if(i<0){imgs.push(img);i=imgs.length-1;}return i;},
        get pages(){return pages;},
        blob(meta={}){
          const chunks=[], offs=[]; let len=0;
          const bin=s=>{const b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i)&255;return b;};
          const put=x=>{const b=typeof x==='string'?bin(x):x;chunks.push(b);len+=b.length;};
          const obj=(n,body)=>{offs[n]=len;put(`${n} 0 obj\n`);body.forEach(put);put('\nendobj\n');};
          put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
          // 1 catalog · 2 pages · 3 Helvetica · 4 Helvetica-Bold · 5 info · images · then page + content pairs
          const imgBase=6, pageBase=imgBase+imgs.length;
          const kids=pages.map((_,i)=>`${pageBase+i*2} 0 R`).join(' ');
          obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
          obj(2,[`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`]);
          obj(3,['<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>']);
          obj(4,['<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>']);
          obj(5,[`<< /Title (${enc(meta.title||'Proposal')}) /Author (${enc(meta.author||'')}) /Producer (Bricly) >>`]);
          imgs.forEach((im,i)=>obj(imgBase+i,[`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>\nstream\n`,im.data,'\nendstream']));
          pages.forEach((p,i)=>{
            const n=pageBase+i*2, content=bin(p.ops.join('\n'));
            const xo=[...new Set(p.images)].map(k=>`/Im${k} ${imgBase+k} 0 R`).join(' ');
            obj(n,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(W)} ${f(H)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xo?` /XObject << ${xo} >>`:''} >> /Contents ${n+1} 0 R >>`]);
            obj(n+1,[`<< /Length ${content.length} >>\nstream\n`,content,'\nendstream']);
          });
          const total=pageBase+pages.length*2, xref=len;
          put(`xref\n0 ${total}\n0000000000 65535 f \n`);
          for(let i=1;i<total;i++) put(String(offs[i]).padStart(10,'0')+' 00000 n \n');
          put(`trailer\n<< /Size ${total} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF`);
          return new Blob(chunks,{type:'application/pdf'});
        },
      };
      return doc;
    },
    // Any image source (photo URL or SVG markup) → JPEG bytes the writer can embed. Resolves null if it can't load.
    jpeg(src,{maxW=1400,bg='#ffffff',svg=false}={}){
      return new Promise(res=>{
        const img=new Image(); let url=src;
        if(svg) url=URL.createObjectURL(new Blob([src],{type:'image/svg+xml'}));
        img.onload=()=>{
          try{
            const k=Math.min(1,maxW/(img.naturalWidth||maxW)), w=Math.max(1,Math.round((img.naturalWidth||maxW)*k)), h=Math.max(1,Math.round((img.naturalHeight||maxW*.7)*k));
            const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,w,h);g.drawImage(img,0,0,w,h);
            const b64=c.toDataURL('image/jpeg',.86).split(',')[1], raw=atob(b64), data=new Uint8Array(raw.length);
            for(let i=0;i<raw.length;i++) data[i]=raw.charCodeAt(i);
            res({data,w,h});
          }catch(e){res(null);}
          if(svg) URL.revokeObjectURL(url);
        };
        img.onerror=()=>{res(null);if(svg)URL.revokeObjectURL(url);};
        img.src=url;
      });
    },
    save(blob,name){
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
      setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
    },
  };
})();
