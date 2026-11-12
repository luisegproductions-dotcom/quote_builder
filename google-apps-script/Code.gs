/** Run setup once, then deploy as a Web app: Execute as Me, access Anyone. */
const PRODUCTS = [
 ['channel','Channel letters'],['reverse','Reverse channel letters'],
 ['coroplastic','Coroplastic signs'],['banner','Banners'],['wall','Wall prints'],
 ['full-wrap','Full car wrap'],['semi-wrap','Semi-car wrap'],['window','Window graphics']
];
function setup() {
 const props=PropertiesService.getScriptProperties();
 if(!props.getProperty('SHEET_ID')) {
  const book=SpreadsheetApp.create('EG Signs Solutions — Shared Product Prices');
  const sheet=book.getSheets()[0];sheet.setName('Prices');
  sheet.getRange(1,1,9,3).setValues([['Product ID','Product / service','Default price (USD)'],...PRODUCTS.map(p=>[...p,''])]);
  sheet.setFrozenRows(1);sheet.getRange('A1:C1').setFontWeight('bold');sheet.autoResizeColumns(1,3);
  props.setProperty('SHEET_ID',book.getId());
 }
 if(!props.getProperty('EDIT_KEY'))props.setProperty('EDIT_KEY',Utilities.getUuid()+Utilities.getUuid());
 console.log('Price sheet: https://docs.google.com/spreadsheets/d/'+props.getProperty('SHEET_ID')+'/edit');
 console.log('Find EDIT_KEY under Project Settings > Script properties. Share only with staff who edit prices.');
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
function doGet(){
 try{return reply_({ok:true,prices:readPrices_(priceSheet_())});}
 catch(e){return reply_({ok:false,error:String(e.message)});}
}
function doPost(e){
 let lock;
 try{
  const data=JSON.parse(e.postData.contents);
  const key=PropertiesService.getScriptProperties().getProperty('EDIT_KEY');
  if(!key || data.key!==key)return reply_({ok:false,code:'unauthorized',error:'Incorrect staff edit key.'});
  if(!PRODUCTS.some(p=>p[0]===data.product) || !validRate_(data.rate) || !validRate_(data.expectedRate))return reply_({ok:false,error:'Invalid product or price.'});
  lock=LockService.getScriptLock();lock.waitLock(10000);
  const sheet=priceSheet_(), prices=readPrices_(sheet);
  if(prices[data.product].rate!==data.expectedRate)return reply_({ok:false,code:'conflict',error:'Another user changed this price. Reopen Price settings before saving again.'});
  const rows=sheet.getRange(2,1,8,3).getValues();
  const row=rows.findIndex(r=>r[0]===data.product)+2;
  sheet.getRange(row,3).setValue(data.rate===''?'':Number(data.rate));SpreadsheetApp.flush();
  return reply_({ok:true,prices:readPrices_(sheet)});
 }catch(e){return reply_({ok:false,error:'Could not save. Refresh prices to check whether the change was applied, then retry.'});}
 finally{if(lock)lock.releaseLock();}
}
