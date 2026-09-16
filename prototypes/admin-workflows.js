const AW_REQUESTS=[];
const AW_DEAL_DRAFTS=[];
let awState=null;
function awCan(kind){return kind==='development'?['owner','manager'].includes(curPersona):kind==='deal'?['owner','manager','rep'].includes(curPersona):curPersona==='owner';}
function awActor(){return PERSONAS[curPersona]?.name||curPersona;}
function awOverviewActions(){
  for(const [page,kind,label,action] of [['developments','development','Add development','awDevelopment()'],['properties','unit','Add unit','awUnit()'],['deals','deal','Add deal','awDeal()']]){
    const heading=document.querySelector(`#p-${page} .crm-page-heading`);
    if(!heading.querySelector('[data-aw-action]'))heading.insertAdjacentHTML('beforeend',`<button class="btn-primary" data-aw-action="${kind}" onclick="${action}">+ ${label}</button>`);
  }
  document.querySelectorAll('[data-aw-action]').forEach(button=>button.hidden=!awCan(button.dataset.awAction));
  let requests=document.getElementById('aw-requests');
  if(!requests){requests=document.createElement('div');requests.id='aw-requests';document.getElementById('dv-grid').before(requests);}
  requests.innerHTML=awCan('development')&&AW_REQUESTS.length?`<h3>Setup requests</h3>${AW_REQUESTS.map(request=>`<button class="aw-request" onclick="awDevelopment('${request.id}')"><strong>${xesc(request.name||'Untitled development')}</strong><span>${xesc(request.status)}</span><span>${xesc(request.location||'Location pending')}</span></button>`).join('')}`:'';
  let drafts=document.getElementById('aw-deal-drafts');
  if(!drafts){drafts=document.createElement('div');drafts.id='aw-deal-drafts';document.getElementById('deals-rows').before(drafts);}
  drafts.innerHTML=awCan('deal')?AW_DEAL_DRAFTS.filter(draft=>draft.by===awActor()).map(draft=>`<button class="aw-request" onclick="awDeal('${draft.id}')"><strong>${xesc(draft.values.buyerName||draft.values.oppId||'New deal')}</strong><span>Draft</span></button>`).join(''):'';
}
function awRoleChanged(){
  document.getElementById('aw-dialog')?.close();
  awOverviewActions();
  if(unCur&&document.getElementById('p-unit').classList.contains('on'))renderUnit();
  if(dvCur&&document.getElementById('p-development').classList.contains('on'))renderDev();
}
function awField(name,label,value='',type='text',attributes=''){
  return `<label class="aw-field"><span>${label}</span><input name="${name}" type="${type}" value="${xesc(String(value??''))}" ${attributes}></label>`;
}
function awText(name,label,value=''){
  return `<label class="aw-field aw-wide"><span>${label}</span><textarea name="${name}" aria-label="${label}" rows="3">${xesc(value)}</textarea></label>`;
}
function awSelect(name,label,options,value='',attributes=''){
  return `<label class="aw-field"><span>${label}</span><select name="${name}" aria-label="${label}" ${attributes}>${options.map(([key,text])=>`<option value="${xesc(String(key))}" ${String(key)===String(value)?'selected':''}>${xesc(text)}</option>`).join('')}</select></label>`;
}
function awCollect(){
  const form=document.getElementById('aw-form');
  if(!form||!awState)return;
  for(const [key,value] of new FormData(form))if(typeof value==='string')awState.values[key]=value.trim();
  form.querySelectorAll('input[type=checkbox]').forEach(input=>awState.values[input.name]=input.checked);
}
function awShell(title,steps,body,submitLabel='Continue'){
  let dialog=document.getElementById('aw-dialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='aw-dialog';document.body.appendChild(dialog);}
  dialog.innerHTML=`<form id="aw-form"><header><div><h2>${title}</h2><p>${awState.step+1} of ${steps.length} · ${steps[awState.step]}</p></div><button type="button" class="tool" aria-label="Close" title="Close" onclick="awClose()">${sbIcon('x')}</button></header><nav aria-label="Progress">${steps.map((step,index)=>`<span ${index===awState.step?'aria-current="step"':''}>${index+1}. ${step}</span>`).join('')}</nav><div class="aw-body">${body}</div><p id="aw-error" role="alert"></p><footer><button type="button" class="btn-ghost" onclick="awSaveDraft()">${awState.kind==='editDevelopment'||awState.id&&awState.kind==='unit'?'Cancel':'Save draft'}</button><div>${awState.step?'<button type="button" class="btn-ghost" onclick="awBack()">Back</button>':''}<button type="submit" class="btn-primary">${submitLabel}</button></div></footer></form>`;
  dialog.oncancel=event=>{event.preventDefault();awClose();};
  dialog.onclose=()=>awState?.trigger?.isConnected&&awState.trigger.focus();
  dialog.querySelector('form').onsubmit=event=>{event.preventDefault();awCollect();try{awNext();}catch(error){document.getElementById('aw-error').textContent=error.message;}};
  if(!dialog.open)dialog.showModal();
  dialog.querySelector('.aw-body input,.aw-body select,.aw-body textarea,button[type=submit]')?.focus();
}
function awClose(){if(window.confirm('Discard unsaved changes?'))document.getElementById('aw-dialog').close();}
function awBack(){awCollect();awState.step--;awRender();}
function awRender(){if(awState.kind==='development')awDevelopmentRender();else if(awState.kind==='unit')awUnitRender();else if(awState.kind==='editDevelopment')awEditDevelopmentRender();else if(awState.kind==='deal')awDealRender();}
function awDevelopment(id){
  if(!awCan('development'))return;
  const record=AW_REQUESTS.find(request=>request.id===id);
  awState={kind:'development',step:0,id:record?.id,values:record?structuredClone(record):{},trigger:document.activeElement};
  awRender();
}
function awDevelopmentRender(){
  const values=awState.values,steps=['Development','Source files','Agreement & review'];
  let body='';
  if(awState.step===0)body=`<div class="aw-grid">${awField('name','Development name',values.name,'text','required maxlength="100"')}${awField('location','Location',values.location,'text','required maxlength="150"')}${awField('unitCount','Expected units',values.unitCount,'number','required min="1" step="1"')}${awField('completion','Completion / delivery',values.completion)}${awField('contact','Setup contact',values.contact,'text','required')}${awField('email','Contact email',values.email,'email','required')}${awField('target','Target launch date',values.target,'date')}${awText('notes','Scope and setup notes',values.notes)}</div>`;
  if(awState.step===1)body=`<div class="aw-grid">${awField('schedule','Unit schedule / price list link',values.schedule,'url')}${awField('plans','Floorplans / drawings link',values.plans,'url')}${awField('media','Images / renders link',values.media,'url')}${awField('specifications','Specifications / payment terms link',values.specifications,'url')}</div><label class="aw-field"><span>Source files</span><input type="file" multiple onchange="awRequestFiles(this)" accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.zip,.dwg"></label><div class="aw-files">${(values.files||[]).map((file,index)=>`<div><span>${xesc(file.name)}</span><button type="button" class="tool" title="Remove file" aria-label="Remove ${xesc(file.name)}" onclick="awState.values.files.splice(${index},1);awRender()">${sbIcon('x')}</button></div>`).join('')}</div>${awText('missing','Missing information / delivery plan',values.missing)}`;
  if(awState.step===2)body=`<dl class="aw-summary"><dt>Development</dt><dd>${xesc(values.name)}</dd><dt>Location</dt><dd>${xesc(values.location)}</dd><dt>Units</dt><dd>${xesc(values.unitCount)}</dd><dt>Setup contact</dt><dd>${xesc(values.contact)} · ${xesc(values.email)}</dd><dt>Source files</dt><dd>${(values.files||[]).length} attached</dd><dt>Commercial basis</dt><dd>Existing agreement</dd><dt>Next status</dt><dd>Submitted - scope review</dd></dl><p>Agreement coverage will be checked before setup begins. Any additional scope requires separate approval. No payment is taken on submission.</p>${awField('agreement','Agreement reference (optional)',values.agreement)}<label class="aw-check"><input type="checkbox" name="confirmed" required ${values.confirmed?'checked':''}>Confirm this setup request</label>`;
  awShell('New development setup',steps,body,awState.step===2?'Submit setup request':'Continue');
}
function awRequestFiles(input){
  awCollect();
  const files=Array.from(input.files);
  if(files.some(file=>file.size>25*1024*1024)){document.getElementById('aw-error').textContent='Each source file must be 25 MB or smaller.';return;}
  awState.values.files=[...(awState.values.files||[]),...files.map(file=>({name:file.name,size:file.size,file}))];
  awRender();
}
function awNext(){
  if(!awCan(awState.kind))throw new Error('Your role cannot perform this action.');
  if(awState.kind==='deal'){
    awValidateDeal(awState.step);
    if(awState.step===0&&awState.values.origin==='linked')awDealPrefill();
    if(awState.step<3){awState.step++;awRender();return;}
    awDealSave();return;
  }
  if(awState.kind==='unit'){
    awValidateUnit();
    if(awState.step<3){awState.step++;awRender();return;}
    awUnitSave(awState.values.publish===true);return;
  }
  if(awState.kind==='editDevelopment'){
    if(awState.step===0){awValidateText(awState.values);awState.step++;awRender();return;}
    awDevelopmentSave();return;
  }
  if(awState.kind==='development'){
    if(awState.step===1){
      const values=awState.values;
      if(!values.schedule&&!values.plans&&!values.files?.length&&!values.missing)throw new Error('Add source files or note when the missing information will be supplied.');
      for(const field of ['schedule','plans','media','specifications'])if(values[field]&&!/^https:\/\//i.test(values[field]))throw new Error('Source links must use HTTPS.');
    }
    if(awState.step<2){awState.step++;awRender();return;}
    awSaveRequest('Submitted - scope review');
  }
}
function awSaveDraft(){
  awCollect();if(!awCan(awState.kind))return;
  try{
    if(awState.kind==='development')awSaveRequest('Draft');
    else if(awState.kind==='deal'){
      if(awState.values.origin==='external'&&!['owner','manager'].includes(curPersona))throw new Error('Only admins and managers can record external deals.');
      const previous=AW_DEAL_DRAFTS.find(draft=>draft.id===awState.id),draft={id:awState.id||crypto.randomUUID(),by:awActor(),values:structuredClone(awState.values)};
      if(previous)Object.assign(previous,draft);else AW_DEAL_DRAFTS.push(draft);
      document.getElementById('aw-dialog').close();awOverviewActions();showToast('Deal draft saved');
    }
    else if(awState.kind==='unit'&&!awState.id)awUnitSave(false);
    else awClose();
  }catch(error){document.getElementById('aw-error').textContent=error.message;}
}
function awSaveRequest(status){
  const previous=AW_REQUESTS.find(request=>request.id===awState.id);
  const request={...awState.values,id:awState.id||crypto.randomUUID(),status,updatedAt:new Date().toISOString(),updatedBy:awActor(),agreementBasis:'Existing agreement',audit:[...(previous?.audit||[]),{status,at:new Date().toISOString(),by:awActor()}]};
  if(previous)Object.assign(previous,request);else AW_REQUESTS.push(request);
  document.getElementById('aw-dialog').close();awOverviewActions();
  showToast(status==='Draft'?'Setup draft saved':'Setup request recorded locally');
}
function awValidateText(values){
  for(const value of Object.values(values))if(typeof value==='string'&&/[<>]/.test(value))throw new Error('Text fields cannot contain HTML markup.');
}
function awAudit(record,action,before){record.audit=[...(record.audit||[]),{action,by:awActor(),at:new Date().toISOString(),before}];}
function awInvalidateFloor(development,floor){
  UNITS.filter(unit=>unit.dev===development.name&&unit.floor===floor&&unit.mapping?.confirmed&&unit.mapping.mode==='mapped').forEach(unit=>{
    unit.mapping.confirmed=false;unit.mapping.mode='pending';
    if(unit.status==='available')unit.status='off_market';
    awAudit(unit,'Floor drawing replaced - mapping review required');
  });
}
function awUnit(id,developmentId){
  if(!awCan('unit'))return;
  const unit=id&&UN(id),development=unit?DEV(unit.dev):DEVS.find(record=>record.id===developmentId)||DEVS[0];
  const point=unit&&development.floorPlans?.[unit.floor]?.positions[unit.id];
  awState={kind:'unit',id:unit?.id,step:0,trigger:document.activeElement,values:unit?{...structuredClone(unit),developmentId:development.id,features:unit.views.join(', '),images:structuredClone(unit.images||[]),mapping:unit.mapping?.mode||'pending',mappingConfirmed:unit.mapping?.confirmed||false,horizontal:point?.x??50,vertical:point?.y??50}:{developmentId:development.id,type:'Apartment',floor:0,beds:2,baths:1,ext:0,images:[],mapping:'pending',horizontal:50,vertical:50}};
  awRender();
}
function awUnitPlan(){const values=awState.values;return values.floorDrawing||DEVS.find(record=>record.id===values.developmentId)?.floorPlans?.[Number(values.floor)];}
function awUnitRender(){
  const values=awState.values,existing=awState.id&&UN(awState.id),steps=['Unit details','Floorplan mapping','Images & files','Review'];
  let body='';
  if(awState.step===0)body=`<div class="aw-grid">${awSelect('developmentId','Development',DEVS.map(record=>[record.id,record.name]),values.developmentId,existing?'disabled':'required onchange="awUnitStructureChanged()"')}${awField('id','Unit reference',values.id,'text',`${existing?'readonly':'required'} pattern="[#A-Za-z0-9_-]+" maxlength="40"`)}${awSelect('type','Unit type',['Apartment','Maisonette','Penthouse','Studio','Garage','Commercial'].map(type=>[type,type]),values.type)}${awField('floor','Floor',values.floor,'number',`required step="1" ${existing&&existing.status!=='off_market'?'readonly':'onchange="awUnitStructureChanged()"'}`)}${awField('beds','Bedrooms',values.beds,'number','required min="0" step="1"')}${awField('baths','Bathrooms',values.baths,'number','required min="0" step="1"')}${awField('sqm','Internal area (m2)',values.sqm,'number','required min="1" step="0.01"')}${awField('ext','Outdoor area (m2)',values.ext,'number','required min="0" step="0.01"')}${awField('price','List price (EUR)',values.price,'number','required min="1" step="0.01"')}${awField('ready','Delivery',values.ready)}${awText('features','Features (comma separated)',values.features)}${awText('description','Unit description',values.description)}</div>`;
  if(awState.step===1){
    const plan=awUnitPlan();
    awState.planVersion=plan?.url;
    body=`${awSelect('mapping','Floorplan mapping',[['pending','Mapping pending'],['mapped','Map onto a floor drawing'],['not_applicable','No floorplan applicable']],values.mapping,'onchange="awMappingChanged()"')}`;
    if(values.mapping==='mapped')body+=`<label class="aw-field"><span>${plan?'Replace staged floor drawing':'Upload floor drawing'}</span><input type="file" accept="image/png,image/jpeg,image/webp" onchange="awUpload(this,'floorDrawing')"></label>${plan?`<div class="aw-map" onclick="awMapClick(event)"><img src="${xesc(plan.url)}" alt="Floor drawing"><span style="left:${Number(values.horizontal)}%;top:${Number(values.vertical)}%">${xesc(values.id||'Unit')}</span></div><div class="aw-grid">${awField('horizontal','Horizontal position (%)',values.horizontal,'number','min="0" max="100" step="0.1" required onchange="awMappingChanged(false)"')}${awField('vertical','Vertical position (%)',values.vertical,'number','min="0" max="100" step="0.1" required onchange="awMappingChanged(false)"')}</div><label class="aw-check"><input type="checkbox" name="mappingConfirmed" ${values.mappingConfirmed?'checked':''}>I confirm this unit is correctly placed on this floor</label>`:'<p>No floor drawing has been supplied for this floor.</p>'}`;
    if(values.mapping==='not_applicable')body+=`${awText('mappingReason','Reason no floorplan applies',values.mappingReason)}<label class="aw-check"><input type="checkbox" name="mappingConfirmed" ${values.mappingConfirmed?'checked':''}>I confirm no floorplan is applicable</label>`;
    if(values.mapping==='pending')body+='<p>Off market - mapping pending</p>';
  }
  if(awState.step===2)body=`${awImagesHtml(values.images)}<label class="aw-field"><span>Unit floorplan (image or PDF)</span><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onchange="awUpload(this,'unitPlan')"></label>${values.unitPlan?`<div class="aw-files"><div><a href="${xesc(values.unitPlan.url)}" target="_blank" rel="noopener">${xesc(values.unitPlan.name)}</a><button type="button" class="btn-ghost" onclick="awState.values.unitPlan=null;awRender()">Remove floorplan</button></div></div>`:''}`;
  if(awState.step===3){
    body=`<dl class="aw-summary"><dt>Unit</dt><dd>${xesc(values.id)}</dd><dt>Development</dt><dd>${xesc(DEVS.find(record=>record.id===values.developmentId)?.name||'')}</dd><dt>Floor</dt><dd>${xesc(String(values.floor))}</dd><dt>List price</dt><dd>${fmtEur(Number(values.price))}</dd><dt>Mapping</dt><dd>${values.mappingConfirmed?values.mapping==='not_applicable'?'Not applicable - confirmed':'Placement confirmed':'Pending confirmation'}</dd><dt>Images</dt><dd>${values.images.length}</dd></dl>`;
    if(!existing||existing.status==='off_market')body+=`<label class="aw-check"><input type="checkbox" name="publish" ${values.publish?'checked':''}>Publish as available</label>`;
    else body+=`<p>Inventory status remains ${UN_STATUS[existing.status].l}. Existing deal terms are unchanged.</p>`;
  }
  awShell(existing?'Edit unit':'Add unit',steps,body,awState.step===3?'Save unit':'Continue');
}
function awUnitStructureChanged(){awCollect();awState.mappingDirty=true;awState.values.mappingConfirmed=false;awState.values.floorDrawing=null;awState.values.mapping='pending';}
function awMappingChanged(reset=true){
  awCollect();awState.mappingDirty=true;awState.values.mappingConfirmed=false;
  if(reset){awState.values.horizontal=awState.values.vertical=50;awRender();return;}
  const marker=document.querySelector('.aw-map>span'),confirmation=document.querySelector('[name="mappingConfirmed"]');
  if(marker){marker.style.left=Number(awState.values.horizontal)+'%';marker.style.top=Number(awState.values.vertical)+'%';}
  if(confirmation)confirmation.checked=false;
}
function awMapClick(event){
  const bounds=event.currentTarget.getBoundingClientRect();awCollect();
  awState.values.horizontal=Number(Math.max(0,Math.min(100,(event.clientX-bounds.left)/bounds.width*100)).toFixed(1));
  awState.values.vertical=Number(Math.max(0,Math.min(100,(event.clientY-bounds.top)/bounds.height*100)).toFixed(1));
  awState.mappingDirty=true;awState.values.mappingConfirmed=false;awRender();
}
function awImagesHtml(images){
  return `<label class="aw-field"><span>Add images</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" onchange="awUpload(this,'images')"></label><div class="aw-images">${images.map((image,index)=>`<div><img src="${xesc(awAsset(image.img))}" alt="${xesc(image.cap)}">${awField('caption'+index,'Caption',image.cap,'text',`onchange="awState.values.images[${index}].cap=this.value"`)}${awSelect('category'+index,'Category',[['ext','Exterior'],['int','Interior']],image.category||'ext',`onchange="awState.values.images[${index}].category=this.value"`)}<div class="toolbar"><button type="button" class="tool" title="Move image earlier" aria-label="Move image earlier" ${index?'':'disabled'} onclick="awImageMove(${index})">${sbIcon('export')}</button><button type="button" class="tool" title="Remove image" aria-label="Remove image" onclick="awCollect();awState.values.images.splice(${index},1);awRender()">${sbIcon('x')}</button></div></div>`).join('')}</div>`;
}
function awImageMove(index){awCollect();const images=awState.values.images;[images[index-1],images[index]]=[images[index],images[index-1]];awRender();}
async function awUpload(input,field){
  awCollect();const state=awState,files=Array.from(input.files),assets=[];
  try{
    for(const file of files){
      const allowed=['image/png','image/jpeg','image/webp',...(field==='unitPlan'?['application/pdf']:[])];
      if(!allowed.includes(file.type)||!file.size||file.size>20*1024*1024)throw new Error('Choose a supported file up to 20 MB.');
      const url=URL.createObjectURL(file);assets.push({url,name:file.name,type:file.type});
      if(file.type.startsWith('image/')){const image=new Image();image.src=url;await image.decode();}
    }
    if(awState!==state||!awCan(state.kind)||!document.getElementById('aw-dialog').open){assets.forEach(asset=>URL.revokeObjectURL(asset.url));return;}
    if(field==='images')state.values.images.push(...assets.map(asset=>({img:asset.url,cap:asset.name,category:'ext'})));
    else if(assets[0]){
      if(field==='floorDrawing'){
        const development=DEVS.find(record=>record.id===state.values.developmentId);
        if(development.floorPlans?.[Number(state.values.floor)])throw new Error('Replace an existing shared floor drawing from Development > Availability.');
        state.values.mappingConfirmed=false;
      }
      state.values[field]=assets[0];
    }
    awRender();
  }catch(error){assets.forEach(asset=>URL.revokeObjectURL(asset.url));document.getElementById('aw-error').textContent=error.message==='The source image cannot be decoded.'?'The image could not be opened.':error.message;}
}
function awValidateUnit(){
  const values=awState.values;awValidateText(values);
  if(!DEVS.some(record=>record.id===values.developmentId))throw new Error('Select a development.');
  if(!/^[#A-Za-z0-9_-]{1,40}$/.test(values.id||''))throw new Error('Unit reference is required; use letters, numbers, hyphens or underscores.');
  if(UNITS.some(unit=>unit.id.toLowerCase()===values.id.toLowerCase()&&unit.id!==awState.id))throw new Error('This unit reference already exists.');
  for(const key of ['floor','beds','baths','sqm','ext','price'])if(values[key]===''||values[key]==null||!Number.isFinite(Number(values[key])))throw new Error('Complete all unit specifications before saving.');
  if(['floor','beds','baths'].some(key=>!Number.isInteger(Number(values[key])))||['beds','baths','ext'].some(key=>Number(values[key])<0)||Number(values.sqm)<=0||Number(values.price)<=0)throw new Error('Check unit dimensions, room counts and price.');
  for(const image of values.images)awValidateText({caption:image.cap});
}
function awUnitSave(publish){
  if(!awCan('unit'))throw new Error('Only admins can save units.');
  awValidateUnit();
  const values=awState.values,development=DEVS.find(record=>record.id===values.developmentId),existing=awState.id&&UN(awState.id),plan=awUnitPlan();
  if(publish||existing&&existing.status!=='off_market'&&awState.mappingDirty){
    if(!values.mappingConfirmed||values.mapping==='pending')throw new Error('Confirm floorplan mapping or the no-floorplan exemption before publishing.');
    if(values.mapping==='mapped'&&(!plan||plan.url!==awState.planVersion||!['horizontal','vertical'].every(key=>Number.isFinite(Number(values[key]))&&Number(values[key])>=0&&Number(values[key])<=100)))throw new Error('The floor drawing or position changed. Review mapping again.');
    if(values.mapping==='not_applicable'&&!values.mappingReason?.trim())throw new Error('Provide the reason no floorplan applies.');
  }
  const before=existing?structuredClone(existing):null;
  const unit={id:values.id,dev:development.name,type:values.type,floor:Number(values.floor),beds:Number(values.beds),baths:Number(values.baths),sqm:Number(values.sqm),ext:Number(values.ext),price:Number(values.price),ready:values.ready||development.completion,views:(values.features||'').split(',').map(value=>value.trim()).filter(Boolean),description:values.description||'',images:structuredClone(values.images),unitPlan:values.unitPlan||null,days:existing?.days??0,status:existing&&existing.status!=='off_market'?existing.status:publish?'available':'off_market',setupState:publish?'published':existing?.setupState||'draft',mapping:{mode:values.mapping,confirmed:!!values.mappingConfirmed,reason:values.mappingReason||'',reviewedBy:values.mappingConfirmed?awActor():null}};
  if(values.mapping==='mapped'&&plan){
    development.floorPlans=development.floorPlans||{};
    if(values.floorDrawing)development.floorPlans[unit.floor]={...values.floorDrawing,positions:{}};
    development.floorPlans[unit.floor].positions[unit.id]={x:Number(values.horizontal),y:Number(values.vertical)};
  }
  if(existing&&existing.floor!==unit.floor)delete development.floorPlans?.[existing.floor]?.positions?.[unit.id];
  if(values.mapping!=='mapped'&&awState.mappingDirty)delete development.floorPlans?.[unit.floor]?.positions?.[unit.id];
  if(existing)Object.assign(existing,unit);else UNITS.push(unit);
  awAudit(existing||unit,existing?'Unit updated':'Unit created',before);
  document.getElementById('aw-dialog').close();renderUnits();openUnit(unit.id);showToast(unit.status==='off_market'?'Unit saved off market':'Unit saved');
}
function awEditDevelopment(id){
  if(!awCan('editDevelopment'))return;
  const development=DEVS.find(record=>record.id===id);if(!development)return;
  awState={kind:'editDevelopment',id,step:0,trigger:document.activeElement,values:{...structuredClone(development),amenities:development.amen.join(', '),images:[...development.media.renders.ext.map(image=>({...image,category:'ext'})),...development.media.renders.int.map(image=>({...image,category:'int'}))]}};
  awRender();
}
function awEditDevelopmentRender(){
  const values=awState.values;
  const body=awState.step===0?`<div class="aw-grid">${awField('name','Development name',values.name,'text','readonly')}${awField('loc','Location',values.loc,'text','required')}${awField('completion','Completion / delivery',values.completion,'text','required')}${awField('tag','Summary',values.tag)}${awField('lat','Latitude',values.lat,'number','required min="-90" max="90" step="any"')}${awField('lng','Longitude',values.lng,'number','required min="-180" max="180" step="any"')}${awText('about','About the development',values.about)}${awText('amenities','Amenities (comma separated)',values.amenities)}</div>`:awImagesHtml(values.images);
  awShell('Edit development',['Details','Images'],body,awState.step===1?'Save development':'Continue');
}
function awDevelopmentSave(){
  if(!awCan('editDevelopment'))throw new Error('Only admins can edit developments.');
  const values=awState.values;awValidateText(values);values.images.forEach(image=>awValidateText({caption:image.cap}));
  const development=DEVS.find(record=>record.id===awState.id),before=structuredClone(development);
  Object.assign(development,{loc:values.loc,completion:values.completion,tag:values.tag,lat:Number(values.lat),lng:Number(values.lng),about:values.about,amen:(values.amenities||'').split(',').map(value=>value.trim()).filter(Boolean)});
  development.media.renders={ext:values.images.filter(image=>image.category==='ext'),int:values.images.filter(image=>image.category==='int')};
  development.photo=values.images.find(image=>image.category==='ext')?.img||development.photo;
  awAudit(development,'Development updated',before);
  document.getElementById('aw-dialog').close();renderDevs();openDev(development.id);showToast('Development saved');
}
function awEligibleOpportunities(){return OPPS.filter(opportunity=>!dealFor(opportunity.id)&&opportunity.stage!=='Closed Won'&&(curPersona!=='rep'||opportunity.rep===PERSONAS.rep.name));}
function awDeal(id){
  if(!awCan('deal'))return;
  const draft=AW_DEAL_DRAFTS.find(record=>record.id===id&&record.by===awActor());
  awState={kind:'deal',id:draft?.id,step:0,trigger:document.activeElement,values:draft?structuredClone(draft.values):{origin:'linked',saleState:'ongoing',developmentId:DEVS[0].id,rep:PERSONAS.rep.name,contactId:'',commissionPaid:false}};
  awRender();
}
function awDealOrigin(){awCollect();awState.values={origin:awState.values.origin,saleState:'ongoing',developmentId:DEVS[0].id,rep:PERSONAS.rep.name,contactId:'',commissionPaid:false};awRender();}
function awDealPrefill(){
  const values=awState.values,opportunity=OPPS.find(record=>record.id===values.oppId),contact=CONTACTS.find(record=>record.name===opportunity.lead);
  const unit=UNITS.find(record=>opportunity.units.includes(record.id));
  Object.assign(values,{buyerName:opportunity.lead,contactId:contact?.id||'',email:contact?.email||'',phone:contact?.phone||'',rep:opportunity.rep,developmentId:DEV(unit?.dev||opportunity.devs[0])?.id,unitId:values.unitId&&opportunity.units.includes(values.unitId)?values.unitId:unit?.id||'',value:values.value||opportunity.value*1000,commission:values.commission??Math.round(opportunity.value*20)});
}
function awDealContact(){
  awCollect();const contact=CONTACTS.find(record=>record.id===awState.values.contactId);
  if(contact)Object.assign(awState.values,{buyerName:contact.name,email:contact.email||'',phone:contact.phone||''});
  else Object.assign(awState.values,{buyerName:'',email:'',phone:''});
  awRender();
}
function awDealSearch(value){
  const select=document.querySelector('[name="oppId"]'),selected=select.value;
  select.innerHTML='<option value="">Select opportunity</option>';
  awEligibleOpportunities().filter(opportunity=>(opportunity.id+' '+opportunity.lead+' '+opportunity.units.join(' ')).toLowerCase().includes(value.toLowerCase())).forEach(opportunity=>select.add(new Option(opportunity.id+' - '+opportunity.lead+' - '+opportunity.units.join(', '),opportunity.id)));
  select.value=selected;
}
function awDealRender(){
  const values=awState.values,linked=values.origin==='linked',steps=['Deal source','Buyer & unit','Signed milestones','Review'];
  let body='';
  if(awState.step===0){
    body=awSelect('origin','Deal source',[['linked','Link an existing opportunity'],...(['owner','manager'].includes(curPersona)?[['external','Record a deal from outside Bricly']]:[])],values.origin,'onchange="awDealOrigin()"');
    if(linked)body+=`${awField('search','Search opportunities','','search','oninput="awDealSearch(this.value)"')}${awSelect('oppId','Opportunity',[['','Select opportunity'],...awEligibleOpportunities().map(opportunity=>[opportunity.id,opportunity.id+' - '+opportunity.lead+' - '+opportunity.units.join(', ')])],values.oppId,'required')}`;
    else body+=`${awSelect('saleState','Sale status',[['ongoing','POS signed - still progressing'],['completed','Final deed signed']],values.saleState)}${awField('externalRef','External reference',values.externalRef)}`;
  }
  if(awState.step===1){
    const opportunity=linked?OPPS.find(record=>record.id===values.oppId):null;
    const units=UNITS.filter(unit=>linked?opportunity?.units.includes(unit.id):DEV(unit.dev)?.id===values.developmentId);
    body=`${linked?`<p>${xesc(values.oppId)} · ${xesc(values.buyerName)}</p>`:awSelect('contactId','Existing buyer',[['','Create new contact'],...CONTACTS.map(contact=>[contact.id,contact.name+' - '+contact.email])],values.contactId,'onchange="awDealContact()"')}<div class="aw-grid">${awField('buyerName','Buyer name',values.buyerName,'text',linked||values.contactId?'readonly':'required')}${awField('phone','Buyer phone',values.phone,'tel',linked||values.contactId?'readonly':'required')}${awField('email','Buyer email',values.email,'email',linked||values.contactId?'readonly':'')}${awSelect('rep','Assigned rep',[...new Set(OPPS.map(opportunity=>opportunity.rep))].map(rep=>[rep,rep]),values.rep,linked?'disabled':'required')}${awSelect('developmentId','Development',DEVS.map(development=>[development.id,development.name]),values.developmentId,linked?'disabled':'onchange="awCollect();awState.values.unitId=\'\';awRender()"')}${awSelect('unitId','Contracted unit',[['','Select unit'],...units.map(unit=>[unit.id,unit.id+' - '+UN_STATUS[unit.status].l])],values.unitId,'required')}${awField('value','Agreed sale price (EUR)',values.value,'number','required min="1" step="0.01"')}${awField('commission','Commission payable (EUR)',values.commission,'number','required min="0" step="0.01"')}</div>${!linked?awText('reconciliation','Inventory reconciliation reason (held, reserved or already sold units)',values.reconciliation):''}`;
  }
  if(awState.step===2){
    body=`<div class="aw-grid">${awField('pos','POS signed date',values.pos,'date',`required max="${dealToday()}"`)}${awField('bank','Bank / finance provider',values.bank)}${awSelect('bankOutcome','Bank outcome',[['unknown','Not recorded'],['approved','Approved'],['not-required','Cash purchase - not required']],values.bankOutcome||'unknown')}${awField('bankDate','Bank outcome date (if known)',values.bankDate,'date',`max="${dealToday()}"`)}${awField('notaryDate','Notary clearance date (if known)',values.notaryDate,'date',`max="${dealToday()}"`)}${awField('deed','Final deed signed date',values.deed,'date',`${values.saleState==='completed'?'required':''} max="${dealToday()}"`)}${awField('expectedDeed','Expected deed date',values.expectedDeed,'date')}</div><label class="aw-check"><input type="checkbox" name="commissionPaid" ${values.commissionPaid?'checked':''} onchange="awCollect();awRender()">Commission already received</label>${values.commissionPaid?`<div class="aw-grid">${awField('commissionDate','Commission receipt date',values.commissionDate,'date',`required max="${dealToday()}"`)}${awField('commissionReference','Commission receipt reference',values.commissionReference,'text','required')}</div>`:''}<label class="aw-field"><span>Signed documents / evidence</span><input type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" onchange="awDealEvidence(this)"></label><div class="aw-files">${(values.evidence||[]).map((file,index)=>`<div><a href="${xesc(file.url)}" target="_blank" rel="noopener">${xesc(file.name)}</a><button type="button" class="tool" aria-label="Remove evidence" title="Remove evidence" onclick="awCollect();awState.values.evidence.splice(${index},1);awRender()">${sbIcon('x')}</button></div>`).join('')}</div>${awText('evidenceNotes','Missing evidence / historical notes',values.evidenceNotes)}`;
  }
  if(awState.step===3){
    const unit=UN(values.unitId),status=values.deed?'Sold':'Reserved';
    body=`<dl class="aw-summary"><dt>Source</dt><dd>${linked?xesc(values.oppId):'External deal'}</dd><dt>Buyer</dt><dd>${xesc(values.buyerName)}</dd><dt>Unit</dt><dd>${xesc(values.unitId)} · ${xesc(unit.dev)}</dd><dt>Sale price</dt><dd>${fmtEur(Number(values.value))}</dd><dt>POS signed</dt><dd>${xesc(values.pos)}</dd><dt>Final deed</dt><dd>${xesc(values.deed||'Not recorded')}</dd><dt>Inventory</dt><dd>${UN_STATUS[unit.status].l} → ${status}</dd><dt>Commission</dt><dd>${fmtEur(Number(values.commission))} · ${values.commissionPaid?'Received':'Pending'}</dd><dt>Buyer payments</dt><dd>${linked?'Existing payment records retained':'No receipts entered'}</dd></dl><p>${values.deed?'This unit will be removed from other opportunity shortlists.':'Other opportunity shortlists will be retained.'}</p><label class="aw-check"><input name="dealConfirmed" type="checkbox" required ${values.dealConfirmed?'checked':''}>I confirm the signed milestones and inventory change</label>`;
  }
  awShell('Add deal',steps,body,awState.step===3?'Create deal':'Continue');
}
async function awDealEvidence(input){
  awCollect();const state=awState,assets=[];
  try{
    for(const file of input.files){
      if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type)||!file.size||file.size>20*1024*1024)throw new Error('Choose PDFs or images up to 20 MB.');
      const url=URL.createObjectURL(file);assets.push({name:file.name,url,size:file.size,type:file.type});
      if(file.type.startsWith('image/')){const image=new Image();image.src=url;await image.decode();}
    }
    if(awState!==state||!awCan('deal')||!document.getElementById('aw-dialog').open){assets.forEach(asset=>URL.revokeObjectURL(asset.url));return;}
    state.values.evidence=[...(state.values.evidence||[]),...assets];awRender();
  }catch(error){assets.forEach(asset=>URL.revokeObjectURL(asset.url));document.getElementById('aw-error').textContent=error.message;}
}
function awPhone(value){return (value||'').replace(/\D/g,'').replace(/^00/,'');}
function awValidateDeal(step){
  const values=awState.values,linked=values.origin==='linked';awValidateText(values);
  if(!awCan('deal')||!linked&&!['owner','manager'].includes(curPersona))throw new Error('Your role cannot create this deal.');
  if(linked&&!awEligibleOpportunities().some(opportunity=>opportunity.id===values.oppId))throw new Error('Select an eligible opportunity. It may already have a deal or belong to another rep.');
  if(step<1)return;
  const unit=UN(values.unitId);
  if(!unit||DEV(unit.dev)?.id!==values.developmentId)throw new Error('Choose a unit in the selected development.');
  if(linked&&!OPPS.find(opportunity=>opportunity.id===values.oppId).units.includes(unit.id))throw new Error('Select a unit linked to this opportunity.');
  if(unit.status==='off_market')throw new Error('This unit is off market. Complete its setup before recording a deal.');
  if(DEALS.some(deal=>dealOpp(deal)?.units.includes(unit.id)))throw new Error('This unit already has a deal. Open that record instead.');
  if(unit.status==='sold'&&(linked||values.saleState!=='completed'))throw new Error('A sold unit can only be reconciled as an external completed sale.');
  if(!linked&&unit.status!=='available'&&!values.reconciliation)throw new Error('Explain the existing inventory status before recording this external deal.');
  if(!Number.isFinite(Number(values.value))||Number(values.value)<=0||values.commission==null||values.commission===''||!Number.isFinite(Number(values.commission))||Number(values.commission)<0)throw new Error('Enter a valid sale price and commission amount.');
  if(!linked&&!values.contactId){
    if(!values.buyerName||awPhone(values.phone).length<7)throw new Error('Enter the buyer name and a valid phone number.');
    const duplicate=CONTACTS.find(contact=>awPhone(contact.phone)===awPhone(values.phone)||values.email&&contact.email?.toLowerCase()===values.email.toLowerCase()||contact.name.toLowerCase()===values.buyerName.toLowerCase());
    if(duplicate)throw new Error('An existing contact matches these details: '+duplicate.name+'. Select that buyer to avoid a duplicate.');
  }
  if(!linked&&values.contactId&&!CONTACTS.some(contact=>contact.id===values.contactId))throw new Error('The selected contact no longer exists.');
  if(step<2)return;
  if(!values.pos||values.pos>dealToday())throw new Error('Enter the actual POS signing date, not a future date.');
  for(const field of ['bankDate','notaryDate','deed','commissionDate'])if(values[field]&&(values[field]<values.pos||values[field]>dealToday()))throw new Error('Recorded milestone dates must be on or after POS signing and no later than today.');
  if(values.saleState==='completed'&&!values.deed)throw new Error('A completed sale requires the final deed date.');
  if(values.bankDate&&(!values.bankOutcome||values.bankOutcome==='unknown'))throw new Error('Select the bank outcome for its recorded date.');
  if(values.deed&&[values.bankDate,values.notaryDate].some(date=>date&&date>values.deed))throw new Error('Bank and notary milestones cannot follow the final deed.');
  if(values.commissionPaid&&(!values.commissionDate||!values.commissionReference))throw new Error('Record the actual commission receipt date and reference.');
  if(!values.evidence?.length&&!values.evidenceNotes)throw new Error('Attach signed evidence or explain which documents are still missing.');
  if(step===3&&!values.dealConfirmed)throw new Error('Confirm the inventory change before creating the deal.');
}
function awDealInventory(opportunity,status){
  for(const unitId of opportunity.units){
    const unit=UN(unitId);if(!unit)continue;
    const previous=unit.status;unit.status=status;awAudit(unit,'Deal inventory: '+status,{status:previous,deal:dealFor(opportunity.id)?.id});
    if(status==='sold')for(const other of OPPS.filter(record=>record.id!==opportunity.id&&record.stage!=='Closed Won'&&record.units.includes(unitId))){
      other.units=other.units.filter(id=>id!==unitId);
      const extension=getExt(other);extension.comms=extension.comms||[];extension.comms.unshift({ch:'sys',t:'Just now',who:awActor(),text:xesc(unitId+' sold; removed from shortlist. '+other.rep+' to review alternatives.')});
    }
  }
  if(status==='sold')opportunity.completed={date:opportunity.closed.milestones?.[3]?.date||opportunity.closed.deed};
}
function awDealSave(){
  awValidateDeal(3);const values=awState.values,linked=values.origin==='linked',unit=UN(values.unitId),now=new Date().toISOString();
  const contact=CONTACTS.find(record=>record.id===values.contactId);
  let opportunity=linked?OPPS.find(record=>record.id===values.oppId):null;
  if(!opportunity){
    opportunity={id:'OPP-'+crypto.randomUUID(),lead:contact?.name||values.buyerName,devs:[unit.dev],units:[unit.id],stage:'Closed Won',source:'External deal',budget:Number(values.value)/1000,value:Number(values.value)/1000,rep:values.rep,tags:['External deal'],next:{d:'—',t:'Review deal records'},ago:'Today',origin:'external',externalRef:values.externalRef||''};
  }
  const before=linked?structuredClone(opportunity):null;
  const milestones=Array(5).fill(null);
  for(const [index,date] of [[0,values.pos],[1,values.bankDate],[2,values.notaryDate],[3,values.deed],[4,values.commissionPaid?values.commissionDate:null]])if(date)milestones[index]={id:crypto.randomUUID(),date,documentIds:[],who:awActor(),recordedAt:now,reference:index===4?values.commissionReference:'Recorded during deal entry'};
  if(milestones[1])milestones[1].outcome=values.bankOutcome;
  if(milestones[4])Object.assign(milestones[4],{amount:Number(values.commission),method:'Not recorded'});
  const nextStep=values.deed?(values.commissionPaid?5:4):milestones[1]?(milestones[2]?3:2):1;
  Object.assign(opportunity,{shortlistBeforeConversion:[...opportunity.units],units:[unit.id],devs:[unit.dev],stage:'Closed Won',value:Number(values.value)/1000,closed:{step:nextStep,bank:values.bank||'TBC',deed:values.deed||values.expectedDeed||'TBC',comm:Number(values.commission)/1000,paid:!!values.commissionPaid,milestones}});
  if(!linked){
    OPPS.push(opportunity);
    EXT[opportunity.id]={jstage:'pos',done:[],blocker:null,next:{label:'Review deal records',due:'',overdue:false},date:null,offer:{amt:Number(values.value),status:'POS signed'},buyer:{email:contact?.email||values.email||'',phone:contact?.phone||values.phone,type:'Buyer'},comms:[],keyDates:[],payments:[],docs:[],bids:[]};
  }
  const extension=getExt(opportunity);extension.jstage='pos';extension.comms=extension.comms||[];extension.docs=extension.docs||[];
  for(const evidence of values.evidence||[]){
    const documentId=crypto.randomUUID();extension.docs.push({id:documentId,g:'Contract',label:evidence.name,flow:'file',status:'filed',file:{name:evidence.name,size:Math.ceil(evidence.size/1024)+' KB',url:evidence.url,type:evidence.type},hist:[{t:now,who:awActor(),act:'Attached at deal entry'}]});
  }
  extension.comms.unshift({ch:'sys',t:'Just now',who:awActor(),text:xesc((linked?'Deal created from opportunity':'External deal recorded')+'; POS signed '+values.pos+(values.evidenceNotes?'; '+values.evidenceNotes:''))});
  const deal=ensureDeal(opportunity);Object.assign(deal,{pos:values.pos,origin:linked?'opportunity':'external',externalRef:values.externalRef||'',recordedAt:now,recordedBy:awActor()});
  let buyer=contact;
  if(!buyer&&!linked){
    buyer={id:'CT-'+crypto.randomUUID(),name:values.buyerName,type:'buyer',btype:'Owner-occupier',company:null,status:values.deed?'past':'contract',email:values.email||'',phone:values.phone,nat:'',lang:'',source:'External deal',ref:null,bmin:null,bmax:Number(values.value)/1000,interest:unit.id+' · '+unit.dev,ploc:unit.dev,finance:values.bank||null,timeline:values.deed?'Completed':'Committed',rep:values.rep,tags:[],oppIds:[],consent:{wa:false,em:false,sms:false},created:dealToday(),last:'Today',lastD:0,notesList:[]};
    CONTACTS.push(buyer);
  }
  if(buyer){buyer.oppIds=[...new Set([...buyer.oppIds,opportunity.id])];opportunity.contactId=buyer.id;}
  awAudit(deal,'Deal created',before);awDealInventory(opportunity,values.deed?'sold':'reserved');
  const draftIndex=AW_DEAL_DRAFTS.findIndex(draft=>draft.id===awState.id);if(draftIndex>=0)AW_DEAL_DRAFTS.splice(draftIndex,1);
  document.getElementById('aw-dialog').close();renderDeals();renderUnits();renderDevs();pipeRenderAll();openDeal(deal.id);showToast('Deal created');
}
const awStyles=document.createElement('style');
awStyles.textContent=`
#aw-dialog{width:min(780px,calc(100vw - 24px));max-height:calc(100dvh - 24px);margin:auto;padding:0;border:1px solid var(--outline);border-radius:8px;background:var(--surface);color:var(--on-surface);box-sizing:border-box}
#aw-dialog::backdrop{background:rgba(0,0,0,.35)}
#aw-form{display:flex;flex-direction:column;max-height:calc(100dvh - 26px)}
#aw-form header,#aw-form footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;flex-shrink:0}
#aw-form header{border-bottom:1px solid var(--outline)}#aw-form h2{font-size:20px;letter-spacing:0;margin:0}#aw-form header p{color:var(--muted);font-size:12px;margin:5px 0 0}
#aw-form nav{display:flex;gap:18px;flex-wrap:wrap;padding:12px 22px;background:var(--sc-lowest);font-size:12px;color:var(--muted)}#aw-form nav [aria-current]{color:var(--primary);font-weight:600}
.aw-body{padding:22px;overflow:auto;min-height:0}.aw-body p{font-size:13px;line-height:1.6}.aw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.aw-wide{grid-column:1/-1}
.aw-images{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.aw-images img{width:100%;height:150px;object-fit:cover;border-radius:5px;margin-bottom:10px}.aw-map{position:relative;margin:12px 0;cursor:crosshair}.aw-map img{display:block;width:100%;height:auto}.aw-map>span{position:absolute;transform:translate(-50%,-50%);background:var(--primary);color:var(--on-primary);padding:5px;font-size:11px;border-radius:4px;pointer-events:none;max-width:100%;overflow:hidden}
.aw-field{display:flex;flex-direction:column;gap:7px;font-size:12px;min-width:0;margin-bottom:14px}.aw-grid .aw-field{margin-bottom:0}.aw-field input,.aw-field select,.aw-field textarea{box-sizing:border-box;width:100%;min-width:0;border:1px solid var(--outline);border-radius:5px;background:var(--surface);color:var(--on-surface);padding:10px;font:inherit;font-size:13px}.aw-field textarea{resize:vertical}.aw-field input:focus,.aw-field select:focus,.aw-field textarea:focus{outline:2px solid var(--primary);outline-offset:1px}
.aw-check{display:flex;align-items:center;gap:9px;font-size:13px;margin:16px 0}.aw-summary{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px;font-size:13px}.aw-summary dt{color:var(--muted)}.aw-summary dd{margin:0;overflow-wrap:anywhere}
#aw-error{color:var(--error,#b3261e);font-size:13px;padding:0 22px;margin:0;flex-shrink:0}#aw-form footer{border-top:1px solid var(--outline)}#aw-form footer>div{display:flex;gap:8px;flex-wrap:wrap}#aw-form button{white-space:normal;letter-spacing:0}#aw-form .tool svg{width:16px;height:16px}
.aw-files>div,.aw-request{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--outline);font-size:13px}.aw-files span{overflow-wrap:anywhere;min-width:0}.aw-request{width:100%;background:none;color:var(--on-surface);border:0;border-bottom:1px solid var(--outline);text-align:left;cursor:pointer}.aw-request>*{overflow-wrap:anywhere;min-width:0}#aw-requests{margin:12px 0 20px}#aw-requests:empty{display:none}#aw-requests h3{font-size:14px}.crm-page-heading [data-aw-action]{margin-left:auto}[data-aw-action][hidden]{display:none!important}
@media(max-width:600px){.aw-grid{grid-template-columns:minmax(0,1fr)}#aw-form header,#aw-form footer,.aw-body{padding:16px}#aw-form nav{padding:10px 16px;gap:10px}.aw-summary{grid-template-columns:110px minmax(0,1fr)}.aw-request{flex-wrap:wrap}#aw-form h2{font-size:18px}}
`;
document.head.appendChild(awStyles);