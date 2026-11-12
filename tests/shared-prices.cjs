const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const ids=['channel','reverse','coroplastic','banner','wall','full-wrap','semi-wrap','window'];
 const prices=Object.fromEntries(ids.map(id=>[id,{rate:''}]));let fail=false;
 async function user(){
  const p=await b.newPage();
  await p.route('**/price-config.js*',r=>r.fulfill({contentType:'application/javascript',body:"window.EG_PRICE_SERVICE_URL='https://script.google.com/macros/s/test/exec';"}));
  await p.route('https://script.google.com/macros/s/test/exec',async r=>{
   if(fail)return r.abort();
   let result={ok:true,prices};
   if(r.request().method()==='POST'){
    const d=r.request().postDataJSON();
    if(d.key!=='test-staff-key')result={ok:false,code:'unauthorized',error:'Incorrect staff edit key.'};
    else if(d.expectedRate!==prices[d.product].rate)result={ok:false,code:'conflict',error:'Another user changed this price. Reopen Price settings before saving again.'};
    else prices[d.product]={rate:d.rate};
   }
   await r.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  await p.goto('http://localhost:5173');return p;
 }
 const a=await user(),c=await user();
 for(const p of [a,c])await p.locator('#open-settings').click();
 async function save(p,rate,key){
  await p.locator('#default-rate-channel').fill(rate);await p.locator('[data-price-product=channel] button').click();
  if(key){await p.locator('#staff-key').fill(key);await p.locator('#staff-key-dialog button[value=save]').click();}
 }
 await save(a,'5','wrong');await a.getByText('Incorrect staff edit key.',{exact:true}).waitFor();assert.equal(prices.channel.rate,'');
 await save(a,'5','test-staff-key');await a.getByText('Price saved for everyone.',{exact:true}).waitFor();
 await save(c,'8','test-staff-key');await c.getByText(/Another user changed this price/).waitFor();assert.equal(prices.channel.rate,'5');
 await c.locator('#settings-cancel').click();await c.locator('[data-product=channel]').click();await c.locator('#builder').waitFor({state:'visible'});assert.equal(await c.locator('#rate').inputValue(),'5');
 await c.locator('#customize-price').click();await c.locator('#rate').fill('99');assert.equal(prices.channel.rate,'5');
 await a.reload();await a.locator('#open-settings').click();await a.locator('[data-price-product=channel]').waitFor();assert(await a.locator('#forget-staff-key').isVisible());
 await save(a,'','');await a.getByText('Shared default removed.',{exact:true}).waitFor();assert.equal(prices.channel.rate,'');
 await a.locator('#forget-staff-key').click();assert(await a.locator('#forget-staff-key').isHidden());await save(a,'4','test-staff-key');await a.getByText('Price saved for everyone.',{exact:true}).waitFor();
 fail=true;await save(a,'12','');await a.locator('[data-price-product=channel] .price-save-status').filter({hasText:/fetch|confirmed|network/i}).waitFor();assert.equal(prices.channel.rate,'4');
 console.log('Shared price UI: two separate browser users, confirmed save/read, wrong key, conflict, removal, quote-only override, and network failure passed (mock service).');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
