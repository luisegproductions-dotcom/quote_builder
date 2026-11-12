// Non-mutating checks against the configured real Google deployment.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const url=process.env.APP_URL || 'http://localhost:5173';
  for(let i=0;i<2;i++){
   const context=await browser.newContext({viewport:{width:i?661:390,height:827}});
   const page=await context.newPage();await page.goto(url);
   await page.locator('#open-settings').click();await page.locator('[data-price-product=channel]').waitFor();
   assert.equal(await page.locator('[data-price-product]').count(),8);
   assert((await page.locator('#settings-help').innerText()).includes('share its default with everyone'));
   assert.equal(await page.locator('#settings select').count(),0);
   const result=await page.evaluate(async()=>{
    const response=await fetch(window.EG_PRICE_SERVICE_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},credentials:'omit',body:JSON.stringify({product:'channel',rate:'',expectedRate:'',key:'invalid-connectivity-test'})});
    return response.json();
   });
   assert.equal(result.code,'unauthorized');
   await context.close();
  }
  console.log('Live Google reads work in two isolated browsers; POST responses readable and invalid keys rejected. No shared prices changed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
