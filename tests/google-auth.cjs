const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage();const ids=['channel','reverse','coroplastic','banner','wall','full-wrap','semi-wrap','window'];const prices=Object.fromEntries(ids.map(id=>[id,{rate:''}]));let revoked=false;const bodies=[];
 await p.route('**/price-config.js*',r=>r.fulfill({contentType:'application/javascript',body:"window.EG_PRICE_SERVICE_URL='https://script.google.com/macros/s/test/exec';"}));
 await p.route('https://accounts.google.com/gsi/client',r=>r.fulfill({contentType:'application/javascript',body:`window.google={accounts:{id:{initialize(options){window.testGoogleCallback=options.callback},renderButton(el){const b=document.createElement('button');b.textContent='Sign in with Google';b.onclick=()=>window.testGoogleCallback({credential:window.testCredential || 'approved-token'});el.append(b)},disableAutoSelect(){}}}};`}));
 await p.route('https://script.google.com/macros/s/test/exec',async r=>{
  let result={ok:true,prices,auth:{mode:'google',clientId:'test-client'}};
  if(r.request().method()==='POST'){
   const body=r.request().postDataJSON();bodies.push(body);assert(!('key' in body));
   if(body.credential==='outsider' || revoked)result={ok:false,code:'forbidden',error:'This Google account is not approved to change prices.'};
   else if(!['approved-token','expiring-token'].includes(body.credential))result={ok:false,code:'unauthorized',error:'Sign in again.'};
   else if(body.action==='authorize')result={ok:true,user:{email:'staff@gmail.com',expiresAt:Date.now()+(body.credential==='expiring-token'?100:3600000)}};
   else {prices[body.product]={rate:body.rate};result={ok:true,prices};}
  }
  await r.fulfill({contentType:'application/json',body:JSON.stringify(result)});
 });
 await p.goto('http://localhost:5173');await p.evaluate(()=>localStorage.setItem('eg-quote-builder.staff-key:https://script.google.com/macros/s/test/exec','legacy'));await p.reload();
 await p.locator('#open-settings').click();await p.locator('[data-price-product=channel]').waitFor();await p.getByRole('button',{name:'Sign in with Google'}).waitFor();
 assert.equal(await p.evaluate(()=>localStorage.getItem('eg-quote-builder.staff-key:https://script.google.com/macros/s/test/exec')),null);
 await p.locator('#default-rate-channel').fill('5');await p.locator('[data-price-product=channel] button').click();assert.equal(bodies.length,0);assert(await p.locator('#staff-key-dialog').isHidden());
 await p.evaluate(()=>window.testCredential='outsider');await p.getByRole('button',{name:'Sign in with Google'}).click();await p.getByText('This Google account is not approved to change prices.',{exact:true}).waitFor();
 await p.evaluate(()=>window.testCredential='approved-token');await p.getByRole('button',{name:'Sign in with Google'}).click();await p.getByText('Signed in as staff@gmail.com',{exact:true}).waitFor();
 await p.locator('[data-price-product=channel] button').click();await p.getByText('Price saved for everyone.',{exact:true}).waitFor();assert.equal(prices.channel.rate,'5');
 assert(!(await p.evaluate(()=>JSON.stringify(localStorage))).includes('approved-token'));
 revoked=true;await p.locator('#default-rate-channel').fill('6');await p.locator('[data-price-product=channel] button').click();await p.locator('[data-price-product=channel] .price-save-status').filter({hasText:'not approved'}).waitFor();assert.equal(prices.channel.rate,'5');assert(await p.locator('#google-sign-out').isHidden());
 revoked=false;await p.evaluate(()=>window.testCredential='expiring-token');await p.getByRole('button',{name:'Sign in with Google'}).click();await p.getByText('Your session expired. Sign in again to save prices.',{exact:true}).waitFor();
 await p.evaluate(()=>window.testCredential='approved-token');await p.getByRole('button',{name:'Sign in with Google'}).click();await p.locator('#google-sign-out').click();assert(await p.locator('#google-sign-in').isVisible());
 await p.locator('#settings-cancel').click();await p.locator('[data-product=channel]').click();await p.locator('#builder').waitFor({state:'visible'});await p.locator('#height-0').fill('1');await p.locator('#width-0').fill('1');assert.equal(await p.locator('#total').innerText(),'$5.00');
 console.log('Google auth UI passed: approved/rejected accounts, sign-out, expiry, revoked access, no key fallback, memory-only tokens, public quoting (mock Google flow).');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
