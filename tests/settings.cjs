const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.APP_URL || 'http://localhost:5173');
 await page.locator('#open-settings').click();
 const ids=['channel','reverse','coroplastic','banner','wall','full-wrap','semi-wrap','window'];
 const save=id=>page.locator(`[data-price-product="${id}"] button`).click();
 assert.equal(await page.locator('#settings select').count(),0);
 assert.equal(await page.getByRole('button',{name:'Save price',exact:true}).count(),8);
 for(const width of [320,390,661,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const row=await page.locator('.product-price-actions').first().boundingBox();const button=await page.locator('[data-price-product=channel] button').boundingBox();assert(Math.abs(row.x+row.width-button.x-button.width)<1);}
 await page.setViewportSize({width:390,height:844});
 // An invalid edit in another card must neither block nor be saved with this card.
 await page.locator('#default-rate-channel').fill('-1');await page.locator('#default-rate-reverse').fill('3');await save('reverse');
 assert.equal(await page.locator('[data-price-product=reverse] [role=status]').innerText(),'Price saved.');
 await save('channel');assert.equal(await page.locator('[data-price-product=channel] [role=status]').innerText(),'');
 await page.locator('#settings-cancel').click();await page.locator('#open-settings').click();
 assert.equal(await page.locator('#default-rate-channel').inputValue(),'');assert.equal(await page.locator('#default-rate-reverse').inputValue(),'3');
 for(const [i,id] of ids.entries()){await page.locator(`#default-rate-${id}`).fill(String(i));await save(id);assert(await page.locator('#settings').isVisible());}
 await page.screenshot({path:'/tmp/eg-price-settings.png',fullPage:true});await page.reload();
 for(const [i,id] of ids.entries()){
 await page.locator(`[data-product="${id}"]`).click();assert.equal(await page.locator('#rate').inputValue(),String(i));assert(await page.locator('#rate').isDisabled());
 for(const basis of ['in2','ft2']){await page.locator('#basis').selectOption(basis);assert.equal(await page.locator('#rate').inputValue(),String(i));}
 await page.locator('#height-0').fill('12');await page.locator('#width-0').fill('12');assert.equal(await page.locator('#total').innerText(),`$${i}.00`);
 await page.locator('#customize-price').click();await page.locator('#rate').fill('10');assert.equal(await page.locator('#total').innerText(),'$10.00');
 await page.locator('#reset-price').click();assert.equal(await page.locator('#rate').inputValue(),String(i));await page.locator('#back').click();
 }
 await page.locator('#open-settings').click();await page.locator('#default-rate-window').fill('');await page.locator('#settings-cancel').click();await page.locator('#open-settings').click();assert.equal(await page.locator('#default-rate-window').inputValue(),'7');
 await page.locator('#default-rate-window').fill('');await save('window');await page.locator('#settings-cancel').click();await page.locator('[data-product=window]').click();assert.equal(await page.locator('#rate').inputValue(),'');assert(await page.locator('#copy').isDisabled());
 await page.reload();await page.evaluate(()=>localStorage.setItem('eg-quote-builder.product-prices.v1',JSON.stringify({channel:{rate:'5',basis:'ft2'}})));await page.reload();await page.locator('[data-product=channel]').click();assert.equal(await page.locator('#rate').inputValue(),'5');
 assert.deepEqual(errors,[]);console.log('Individual saves passed: isolated validation and persistence, cancel, zero, deletion, all products, overrides, units, legacy prices, mobile alignment.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
