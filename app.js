import { calculate, convert } from './pricing.js';
const $ = id => document.getElementById(id);
const products = [
 ['channel','Channel letters','Dimensional. Bold. Illuminated.','<path d="M7 24V8h8M7 16h7M18 8h7v16h-7V8Z"/>','Enter the dimensions of each letter or sign panel.'],
 ['reverse','Reverse channel letters','A glow that stands apart.','<path d="M8 24V8h14M8 16h11M8 24h14M4 5v22M7 4h18M25 8v19"/>','Enter the dimensions of each halo-lit letter or sign panel.'],
 ['coroplastic','Coroplastic signs','Lightweight. Big impact.','<rect x="4" y="5" width="24" height="17" rx="1"/><path d="M10 22v6M22 22v6M9 10h14M9 15h9"/>','Add each sign size and the number of signs you need.'],
 ['banner','Banners','Your message, larger than life.','<path d="M3 5v23M29 5v23M3 8h26v15H3M8 12h16M8 17h10"/>','Add each banner size and quantity.'],
 ['wall','Wall prints','Turn walls into statements.','<rect x="4" y="4" width="24" height="24" rx="1"/><path d="m5 23 8-10 7 7 4-5 4 5M19 9h.01"/>','Measure each wall or print section separately.'],
 ['full-wrap','Full car wrap','A moving brand experience.','<path d="m3 18 3-8h18l5 8v7H3v-7ZM6 18h20M11 10l-2 8M21 10l3 8M7 25v3M25 25v3M6 22h3M23 22h3"/>','Add measured vehicle panels. Price is based on entered area, not a vehicle-size preset.'],
 ['semi-wrap','Semi-car wrap','Less coverage. Lasting impact.','<path d="m3 18 4-7h16l6 7v7H3v-7ZM6 18h20M16 11v14M7 25v3M25 25v3M19 21h7"/>','Add only the vehicle panels or sections being wrapped.'],
 ['window','Window graphics','Make every window work.','<rect x="4" y="4" width="24" height="24" rx="1"/><path d="M16 4v24M4 16h24M7 12l5-5M20 25l5-5"/>','Add each window size and quantity.']
];
const blankPanel = () => ({height:'',width:'',quantity:'1'});
let state = { product:null, unit:'in', basis:'in2', rate:'', panels:[blankPanel()] };
const sharedPriceUrl = window.EG_PRICE_SERVICE_URL || '';
const staffKeyStorageKey = 'eg-quote-builder.staff-key:' + sharedPriceUrl;
let staffEditKey = '';
try { if(sharedPriceUrl)staffEditKey=localStorage.getItem(staffKeyStorageKey) || ''; } catch {}
function rememberStaffKey(key){
 staffEditKey=key;
 try { if(key)localStorage.setItem(staffKeyStorageKey,key);else localStorage.removeItem(staffKeyStorageKey); } catch {}
 $('forget-staff-key').hidden=!sharedPriceUrl || !staffEditKey;
}
$('forget-staff-key').hidden=!sharedPriceUrl || !staffEditKey;
$('forget-staff-key').addEventListener('click',()=>{rememberStaffKey('');toast('Saved key forgotten on this device.');});
const priceStorageKey = 'eg-quote-builder.product-prices.v1';
let defaults = {};
try {
 const saved = sharedPriceUrl ? {} : JSON.parse(localStorage.getItem(priceStorageKey) || '{}');
 for (const [id] of products) {
  const p = saved?.[id];
  if (p && typeof p.rate === 'string' && p.rate.trim() !== '' && Number.isFinite(Number(p.rate)) && Number(p.rate) >= 0) defaults[id] = {rate:p.rate};
 }
} catch { /* Quoting remains available when browser storage is unavailable. */ }
let googleAuthConfig=null, googleCredential='', googleUser=null, googleExpiryTimer, googleAuthEpoch=0;
let googleScriptPromise;
function clearGoogleSession(){
 googleAuthEpoch++;googleCredential='';googleUser=null;clearTimeout(googleExpiryTimer);
 $('google-user').textContent='Sign in to save shared prices.';$('google-sign-out').hidden=true;
 $('google-sign-in').hidden=false;
}
function loadGoogleIdentity(){
 if(window.google?.accounts?.id)return Promise.resolve();
 if(!googleScriptPromise)googleScriptPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
  script.onload=resolve;script.onerror=()=>{script.remove();googleScriptPromise=null;reject(new Error('Google sign-in could not load. Check your connection and reopen Price settings.'));};document.head.append(script);
 });
 return googleScriptPromise;
}
async function configureGoogleAuth(config){
 if(config?.mode!=='google')return;
 $('google-auth').hidden=false;
 rememberStaffKey(''); // Migration removes the previous device key; never send it in Google mode.
 if(googleAuthConfig?.clientId===config.clientId && window.google?.accounts?.id)return;
 googleAuthConfig=config;clearGoogleSession();$('settings-help').textContent='Save each product individually to share its default with everyone. Sign in with an approved Google account to save. Cancel discards unsaved edits. Quoting does not require sign-in.';
 if(!config.clientId){$('google-user').textContent='Staff sign-in is awaiting Google configuration.';return;}
 if(location.protocol==='file:'){$('google-user').textContent='Open the online quote builder to sign in and save shared prices.';return;}
 try{
  await loadGoogleIdentity();
  window.google.accounts.id.initialize({client_id:config.clientId,auto_select:false,callback:async response=>{
   const epoch=++googleAuthEpoch;$('google-user').textContent='Checking your account…';
   try{
    const data=await serviceRequest({action:'authorize',credential:response.credential});
    if(epoch!==googleAuthEpoch)return;
    googleCredential=response.credential;googleUser=data.user;
    $('google-user').textContent='Signed in as '+googleUser.email;
    $('google-sign-in').hidden=true;$('google-sign-out').hidden=false;
    googleExpiryTimer=setTimeout(()=>{clearGoogleSession();$('google-user').textContent='Your session expired. Sign in again to save prices.';},Math.max(0,googleUser.expiresAt-Date.now()));
   }catch(e){if(epoch===googleAuthEpoch){clearGoogleSession();$('google-user').textContent=e.message;}}
  }});
  $('google-sign-in').replaceChildren();
  window.google.accounts.id.renderButton($('google-sign-in'),{type:'standard',theme:'outline',size:'large',text:'signin_with',width:240});
 }catch(e){$('google-user').textContent=e.message;}
}
$('google-sign-out').addEventListener('click',()=>{clearGoogleSession();window.google?.accounts?.id.disableAutoSelect();});
async function serviceRequest(payload){

 const response=await fetch(sharedPriceUrl,{
  method:payload?'POST':'GET', credentials:'omit', redirect:'follow', cache:'no-store',
  ...(payload?{headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}:{}),
  signal:AbortSignal.timeout(20000)
 });
 if(!response.ok)throw new Error('Shared prices are unavailable. Try again.');
 const data=await response.json();
 if(!data.ok){
  if(data.code==='unauthorized' || data.code==='forbidden'){
   if(googleAuthConfig && googleCredential)clearGoogleSession();else if(!googleAuthConfig)rememberStaffKey('');
  }
  throw new Error(data.error || 'Could not access shared prices.');
 }
 return data;
}
async function priceRequest(payload){
 const data=await serviceRequest(payload);
 if(data.auth){void configureGoogleAuth(data.auth);}
 const next={};
 for(const [id] of products){
  const rate=data.prices?.[id]?.rate;
  if(typeof rate!=='string' || (rate!=='' && (!Number.isFinite(Number(rate)) || Number(rate)<0)))throw new Error('The shared price list is invalid.');
  if(rate!=='')next[id]={rate};
 }
 return next;
}
function requestEditKey(){
 if(staffEditKey)return Promise.resolve(staffEditKey);
 return new Promise(resolve=>{
  $('staff-key').value='';
  $('staff-key-dialog').addEventListener('close',()=>{
   const key=$('staff-key-dialog').returnValue==='save'?$('staff-key').value:'';
   $('staff-key').value='';resolve(key);
  },{once:true});
  $('staff-key-dialog').showModal();
 });
}
let customPrice = false;
function applyDefaultPrice(){
 const price = defaults[state.product];
 state.rate = price?.rate ?? ''; customPrice = false;
}
function renderPriceMode(){
 $('basis').disabled = false; $('rate').disabled = !customPrice;
 $('customize-price').hidden = customPrice;
 $('customize-price').setAttribute('aria-expanded', String(customPrice));
 $('reset-price').hidden = !customPrice;
 $('price-source').textContent = customPrice ? 'Custom price for this quote only. Saved defaults stay unchanged.' : defaults[state.product] ? 'Using this product’s saved default price.' : 'No default price saved. Customize the price for this quote or set one in Price settings.';
}
function showHome(){
 $('choose').hidden=false; $('settings').hidden=true; $('builder').hidden=true; $('mobile-total').hidden=true; window.scrollTo(0,0);
}
$('open-settings').addEventListener('click',async()=>{
 $('choose').hidden=true; $('settings').hidden=false;
 $('settings-status').textContent='';
 if(sharedPriceUrl){
  $('settings-products').innerHTML='';$('settings-status').textContent='Loading shared prices…';
  try{defaults=await priceRequest();$('settings-status').textContent='';}
  catch(e){$('settings-status').textContent='Could not load shared prices. Return to products and try again.';return;}
 }
 $('settings-products').innerHTML=products.map(([id,name])=>{
 const p=defaults[id] || {rate:''};
 return `<form class="card" data-price-product="${id}" aria-label="${name} price"><h2>${name}</h2><label for="default-rate-${id}">Default price (USD)</label><input id="default-rate-${id}" type="number" min="0" step="any" inputmode="decimal" placeholder="Not set" value="${escape(p.rate)}"><div class="product-price-actions"><button class="primary" type="submit">Save price</button></div><p class="price-save-status" role="status"></p></form>`;
 }).join('');
 window.scrollTo(0,0); $('settings-title').focus();
});
$('settings-back').addEventListener('click',showHome);
$('settings-cancel').addEventListener('click',showHome);
$('settings-form').addEventListener('submit',async e=>{
 e.preventDefault();
 const form=e.target.closest('[data-price-product]'); if(!form)return;
 const id=form.dataset.priceProduct, input=$(`default-rate-${id}`), rate=input.value;
 const status=form.querySelector('.price-save-status');
 if(!input.checkValidity() || (rate!=='' && (!Number.isFinite(Number(rate)) || Number(rate)<0))){input.reportValidity();return;}
 if(sharedPriceUrl){
  const button=form.querySelector('button');button.disabled=true;input.disabled=true;status.textContent='Saving…';
  try{
   let auth;
   if(googleAuthConfig){
    if(!googleCredential || !googleUser || googleUser.expiresAt<=Date.now()){
     clearGoogleSession();status.textContent='Sign in with an approved Google account above, then save again.';$('google-auth').scrollIntoView({behavior:'smooth'});return;
    }
    auth={credential:googleCredential};
   }else{
    const key=await requestEditKey();if(!key){status.textContent='Save canceled.';return;}auth={key};
   }
   const next=await priceRequest({product:id,rate,expectedRate:defaults[id]?.rate ?? '',...auth});
   // Other cards may contain unsaved edits: only update this card's baseline.
   if(next[id])defaults[id]=next[id];else delete defaults[id];
   if(!googleAuthConfig)rememberStaffKey(auth.key);status.textContent=rate===''?'Shared default removed.':'Price saved for everyone.';
  }catch(e){status.textContent=e.message || 'Save not confirmed. Reopen Price settings to check before retrying.';}
  finally{button.disabled=false;input.disabled=false;}
 }else{
  const next={...defaults};if(rate==='')delete next[id];else next[id]={rate};
  try { localStorage.setItem(priceStorageKey,JSON.stringify(next)); }
  catch { status.textContent='Could not save. Allow browser storage and try again.'; return; }
  defaults=next; status.textContent=rate===''?'Default price removed.':'Price saved.';
 }
});
$('settings-products').addEventListener('input',e=>{
 const form=e.target.closest('[data-price-product]');
 if(form)form.querySelector('.price-save-status').textContent='';
});
$('customize-price').addEventListener('click',()=>{customPrice=true;renderPriceMode();$('rate').focus();});
$('reset-price').addEventListener('click',()=>{applyDefaultPrice();$('basis').value=state.basis;$('rate').value=state.rate;renderPriceMode();update();});
const labels = {in:'Inches (in)',ft:'Feet (ft)',yd:'Yards (yd)',mm:'Millimeters (mm)',cm:'Centimeters (cm)',m:'Meters (m)'};
const usd = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const num = n => new Intl.NumberFormat('en-US',{maximumFractionDigits:2,minimumFractionDigits:2}).format(n);
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areaUnit = () => state.basis==='ft2'?'ft²':'in²';
let quoteText = '';
$('products').innerHTML = products.map(([id,name,tag,icon])=>`<button class="product" data-product="${id}"><span class="icon"><svg viewBox="0 0 32 32" aria-hidden="true">${icon}</svg></span><span class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 18 18 6M6 6h12v12"/></svg></span><strong>${name}</strong><small>${tag}</small></button>`).join('');
let openingProduct=false;
$('products').addEventListener('click',async e=>{
 const b=e.target.closest('[data-product]');if(!b || openingProduct)return;
 openingProduct=true;b.disabled=true;
 try{
  if(sharedPriceUrl){try{defaults=await priceRequest();}catch{defaults={};toast('Shared prices unavailable. Customize the price for this quote or try again.');}}
  state.product=b.dataset.product;applyDefaultPrice();openBuilder();
 }finally{openingProduct=false;b.disabled=false;}
});
function openBuilder(){
 const product=products.find(p=>p[0]===state.product);
 $('choose').hidden=true;$('builder').hidden=false;$('mobile-total').hidden=false;
 $('product-title').textContent=product[1];$('product-description').textContent=product[4];$('summary-product').textContent=product[1];
 renderPriceMode();renderUnits();renderPanels();$('basis').value=state.basis;$('rate').value=state.rate;update();window.scrollTo(0,0);
}
function renderUnits(){
 const metric=['mm','cm','m'].includes(state.unit);
 document.querySelectorAll('[data-system]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.system==='metric')===metric)));
 $('unit').innerHTML=(metric?['mm','cm','m']:['in','ft','yd']).map(u=>`<option value="${u}" ${u===state.unit?'selected':''}>${labels[u]}</option>`).join('');
}
function renderPanels(){
 $('panels').innerHTML=state.panels.map((p,i)=>`<div class="panel" data-index="${i}"><div class="panel-head"><strong>Panel ${String(i+1).padStart(2,'0')}</strong><button class="remove" aria-label="Remove panel ${i+1}" ${state.panels.length===1?'hidden':''}>Remove ×</button></div><div class="panel-fields">${[['height','Height'],['width','Width'],['quantity','Quantity']].map(([key,label])=>`<div class="${key==='quantity'?'quantity-field':''}"><label for="${key}-${i}">${label}${key!=='quantity'?` (${state.unit})`:''}</label><input id="${key}-${i}" data-field="${key}" type="number" inputmode="${key==='quantity'?'numeric':'decimal'}" min="${key==='quantity'?'1':'0'}" step="${key==='quantity'?'1':'any'}" value="${escape(p[key])}" placeholder="${key==='height'?'e.g. 24':'e.g. 36'}" aria-describedby="info-${i}"></div>`).join('')}</div><p class="panel-info" id="info-${i}">Enter a height and width to calculate the area.</p></div>`).join('');
}
function update(){
 const result=calculate(state.panels,state.unit,state.basis,state.rate), au=areaUnit();
 $('rate-label').textContent=`Price per ${au} (USD)`;$('summary-rate-label').textContent=`Rate per ${au}`;
 $('rate-error').textContent=state.rate!==''&&!result.priceValid?'Enter a valid rate of $0 or more.':'';
 $('rate').setAttribute('aria-invalid',String(state.rate!==''&&!result.priceValid));
 result.rows.forEach((r,i)=>{
  const info=$(`info-${i}`); const p=state.panels[i];
  let error='';
  for(const key of ['height','width','quantity']){
   const n=Number(p[key]);const invalid=p[key]!==''&&(!Number.isFinite(n)||n<=0||(key==='quantity'&&!Number.isInteger(n)));
   $(`${key}-${i}`).setAttribute('aria-invalid',String(invalid));
   if(invalid) error=key==='quantity'?'Quantity must be a whole number of 1 or more.':'Measurements must be greater than zero.';
  }
  if(!r.valid&&!error&&p.height!==''&&p.width!==''&&p.quantity!=='')error='These values are too large to calculate.';
  info.classList.toggle('error',!!error);
  info.textContent=error||(r.valid?`${num(r.area)} ${au} per panel × ${r.quantity} = ${num(r.billableArea)} ${au}`:'Enter a height, width, and quantity to calculate the area.');
 });
 $('quote-rows').innerHTML=result.rows.map((r,i)=>`<div class="quote-row"><div>Panel ${String(i+1).padStart(2,'0')}<small>${r.valid?`${escape(r.height)} × ${escape(r.width)} ${state.unit} · Qty ${escape(r.quantity)}<br>${num(r.area)} ${au} each`:'Measurements incomplete'}</small></div><strong>${r.valid&&r.subtotal!==null?usd(r.subtotal):'—'}</strong></div>`).join('');
 $('total-quantity').textContent=result.quantity||'—';$('total-area').textContent=result.quantity?`${num(result.area)} ${au}`:'—';$('summary-rate').textContent=result.priceValid?usd(Number(state.rate)):'—';
 $('total').textContent=result.ready?usd(result.total):'—';$('mobile-amount').textContent=$('total').textContent;
 $('quote-status').textContent=result.ready?'Ready to share. Based on your entered area and rate.':'Complete every panel and enter a rate to finish your quote.';
 $('copy').disabled=!result.ready;$('print').disabled=!result.ready;
 const title=products.find(p=>p[0]===state.product)?.[1]||'';
 quoteText=result.ready?['QUOTE — EG Signs Solutions',title,new Date().toLocaleDateString('en-US'),'',...result.rows.map((r,i)=>`Panel ${i+1}: ${r.height} × ${r.width} ${state.unit} · ${num(r.area)} ${au} × ${r.quantity} panels = ${usd(r.subtotal)}`),'',`Total panels: ${result.quantity}`,`Total billable area: ${num(result.area)} ${au}`,`Price per ${au}: ${usd(Number(state.rate))}`,`ESTIMATED TOTAL: ${usd(result.total)} USD`,'No taxes or additional fees added.'].join('\n'):'';
}
$('panels').addEventListener('input',e=>{if(!e.target.dataset.field)return;const i=Number(e.target.closest('[data-index]').dataset.index);state.panels[i][e.target.dataset.field]=e.target.value;update();});
$('panels').addEventListener('click',e=>{if(!e.target.closest('.remove'))return;const i=Number(e.target.closest('[data-index]').dataset.index);state.panels.splice(i,1);renderPanels();update();});
$('add').addEventListener('click',()=>{state.panels.push(blankPanel());renderPanels();update();$(`height-${state.panels.length-1}`).focus();});
function setUnit(next){
 if(state.panels.some(p=>['height','width'].some(k=>p[k]!==''&&(!Number.isFinite(Number(p[k]))||Number(p[k])<=0)))){toast('Correct invalid measurements before switching units.');renderUnits();return;}
 state.panels=state.panels.map(p=>({...p,height:convert(p.height,state.unit,next),width:convert(p.width,state.unit,next)}));state.unit=next;renderUnits();renderPanels();update();
}
$('unit').addEventListener('change',e=>setUnit(e.target.value));
document.querySelectorAll('[data-system]').forEach(b=>b.addEventListener('click',()=>{if(b.getAttribute('aria-pressed')==='true')return;setUnit(b.dataset.system==='metric'?'mm':'in');}));
$('rate').addEventListener('input',e=>{state.rate=e.target.value;update();});
$('basis').addEventListener('change',e=>{state.basis=e.target.value;update();});
$('back').addEventListener('click',showHome);
$('view-quote').addEventListener('click',()=>$('summary').scrollIntoView({behavior:'smooth'}));
function toast(message){$('toast').textContent=message;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').textContent='',4000);}
$('copy').addEventListener('click',async()=>{
 if(!quoteText)return;
 try {await navigator.clipboard.writeText(quoteText);toast('Quote copied. Ready to paste and share.');}
 catch {const ta=document.createElement('textarea');ta.value=quoteText;document.body.append(ta);ta.select();const ok=document.execCommand('copy');ta.remove();toast(ok?'Quote copied. Ready to paste and share.':'Clipboard unavailable. Use Print / Save PDF instead.');}
});
$('print').addEventListener('click',()=>{if(quoteText)window.print();});
$('clear').addEventListener('click',()=>$('clear-dialog').showModal());
$('cancel-clear').addEventListener('click',()=>$('clear-dialog').close());
$('confirm-clear').addEventListener('click',()=>{state.panels=[blankPanel()];applyDefaultPrice();$('rate').value=state.rate;$('basis').value=state.basis;renderPriceMode();renderPanels();update();$('clear-dialog').close();$('height-0').focus();toast('Quote cleared.');});

if(sharedPriceUrl){$('settings-help').textContent='Save each product individually to share its default with everyone. Cancel discards unsaved edits. The same USD number applies per in² or ft². Saving requires the staff edit key.';}
