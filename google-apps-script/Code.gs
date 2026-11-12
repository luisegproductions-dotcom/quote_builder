/** Run setup once, then deploy as a Web app: Execute as Me, access Anyone. */
const PRODUCTS = [
 ['channel','Channel letters'],['reverse','Reverse channel letters'],
 ['coroplastic','Coroplastic signs'],['banner','Banners'],['wall','Wall prints'],
 ['full-wrap','Full car wrap'],['semi-wrap','Semi-car wrap'],['window','Window graphics']
];
function setup() {
 const props=PropertiesService.getScriptProperties();
 if(!props.getProperty('ALLOWED_EMAILS'))props.setProperty('ALLOWED_EMAILS','info@11eg11.com,luis.egproductions@gmail.com,suarezl@gmail.com');
 if(!props.getProperty('SHEET_ID')) {
  const book=SpreadsheetApp.create('EG Signs Solutions — Shared Product Prices');
  const sheet=book.getSheets()[0];sheet.setName('Prices');
  sheet.getRange(1,1,9,3).setValues([['Product ID','Product / service','Default price (USD)'],...PRODUCTS.map(p=>[...p,''])]);
  sheet.setFrozenRows(1);sheet.getRange('A1:C1').setFontWeight('bold');sheet.autoResizeColumns(1,3);
  props.setProperty('SHEET_ID',book.getId());
 }

 console.log('Price sheet: https://docs.google.com/spreadsheets/d/'+props.getProperty('SHEET_ID')+'/edit');
 console.log('Set GOOGLE_CLIENT_ID and ALLOWED_EMAILS in Script properties. Old EDIT_KEY values are no longer accepted.');
}
function priceSheet_(){
 const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
 if(!id)throw new Error('Run setup first.');
 return SpreadsheetApp.openById(id).getSheetByName('Prices');
}
function validRate_(v){return typeof v==='string' && (v==='' || (/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v) && Number.isFinite(Number(v)) && Number(v)>=0));}
function readPrices_(sheet){
 const prices={};
 sheet.getRange(2,1,8,3).getValues().forEach(row=>{
  if(!PRODUCTS.some(p=>p[0]===row[0]))throw new Error('Product IDs changed in the sheet. Restore the original IDs.');
  const rate=String(row[2]);if(!validRate_(rate))throw new Error('Invalid price in the sheet for '+row[0]);
  prices[row[0]]={rate};
 });
 if(Object.keys(prices).length!==8)throw new Error('Missing or duplicate product IDs.');
 return prices;
}
function reply_(body){return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);}
function authConfig_(){return {mode:'google',clientId:PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || ''};}
function authError_(code,message){const error=new Error(message);error.authCode=code;return error;}
function googleKeys_(refresh){
 const cache=CacheService.getScriptCache(), cached=refresh?null:cache.get('google-jwks-v1');
 if(cached){try{return JSON.parse(cached);}catch{}}
 const response=UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v3/certs',{muteHttpExceptions:true});
 if(response.getResponseCode()!==200)throw authError_('unavailable','Google sign-in verification is unavailable. Try again.');
 const body=response.getContentText(), keys=JSON.parse(body).keys;
 if(!Array.isArray(keys))throw authError_('unavailable','Google sign-in verification is unavailable. Try again.');
 cache.put('google-jwks-v1',JSON.stringify(keys),3600);return keys;
}
function authorize_(token){
 const props=PropertiesService.getScriptProperties(), clientId=props.getProperty('GOOGLE_CLIENT_ID');
 const allowed=(props.getProperty('ALLOWED_EMAILS') || '').split(/[\s,;]+/).map(s=>s.toLowerCase()).filter(Boolean);
 if(!clientId || !allowed.length)throw authError_('unavailable','Staff sign-in is not configured yet.');
 if(typeof token!=='string' || token.length>16000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))throw authError_('unauthorized','Sign in with Google to save shared prices.');
 let header, claims;
 try{header=JSON.parse(b64utoutf8(token.split('.')[0]));claims=JSON.parse(b64utoutf8(token.split('.')[1]));}catch{throw authError_('unauthorized','Invalid Google sign-in. Sign in again.');}
 if(header.alg!=='RS256' || typeof header.kid!=='string')throw authError_('unauthorized','Invalid Google sign-in. Sign in again.');
 let key=googleKeys_(false).find(k=>k.kid===header.kid && k.kty==='RSA');
 if(!key)key=googleKeys_(true).find(k=>k.kid===header.kid && k.kty==='RSA');
 const now=Math.floor(Date.now()/1000);
 let verified=false;
 try{verified=!!key && KJUR.jws.JWS.verifyJWT(token,KEYUTIL.getKey(key),{alg:['RS256'],aud:[clientId],iss:['accounts.google.com','https://accounts.google.com'],verifyAt:now,gracePeriod:0});}catch{}
 if(!verified || !Number.isInteger(claims.exp) || claims.exp<=now || !Number.isInteger(claims.iat) || claims.iat>now+60 || typeof claims.sub!=='string' || !claims.sub || claims.email_verified!==true || typeof claims.email!=='string' || !['accounts.google.com','https://accounts.google.com'].includes(claims.iss) || claims.aud!==clientId || (claims.azp && claims.azp!==clientId))throw authError_('unauthorized','Google sign-in expired or is invalid. Sign in again.');
 const email=claims.email.toLowerCase();
 if(!allowed.includes(email))throw authError_('forbidden','This Google account is not approved to change prices.');
 // For third-party email accounts Google may not remain authoritative for email ownership.
 if(!email.endsWith('@gmail.com') && !(typeof claims.hd==='string' && claims.hd))throw authError_('forbidden','Use an approved Gmail or Google Workspace account.');
 return {email,sub:claims.sub,expiresAt:claims.exp*1000};
}
function doGet(){
 try{return reply_({ok:true,prices:readPrices_(priceSheet_()),auth:authConfig_()});}
 catch(e){return reply_({ok:false,error:String(e.message)});}
}
function doPost(e){
 let lock;
 try{
  const data=JSON.parse(e.postData.contents);
  const user=authorize_(data.credential);
  if(data.action==='authorize')return reply_({ok:true,user});
  if(!PRODUCTS.some(p=>p[0]===data.product) || !validRate_(data.rate) || !validRate_(data.expectedRate))return reply_({ok:false,error:'Invalid product or price.'});
  lock=LockService.getScriptLock();lock.waitLock(10000);
  const sheet=priceSheet_(), prices=readPrices_(sheet);
  if(prices[data.product].rate!==data.expectedRate)return reply_({ok:false,code:'conflict',error:'Another user changed this price. Reopen Price settings before saving again.'});
  const rows=sheet.getRange(2,1,8,3).getValues();
  const row=rows.findIndex(r=>r[0]===data.product)+2;
  sheet.getRange(1,4,1,2).setValues([['Updated by','Updated at (UTC)']]);
  sheet.getRange(row,3,1,3).setValues([[data.rate===''?'':Number(data.rate),user.email,new Date().toISOString()]]);SpreadsheetApp.flush();
  return reply_({ok:true,prices:readPrices_(sheet)});
 }catch(e){if(e.authCode)return reply_({ok:false,code:e.authCode,error:e.message});return reply_({ok:false,error:'Could not save. Refresh prices to check whether the change was applied, then retry.'});}
 finally{if(lock)lock.releaseLock();}
}
