const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.APP_URL || 'http://localhost:5173');
 await page.locator('#open-settings').click();
 assert.equal(await page.locator('#settings select').count(),0);
 const ids=['channel','reverse','coroplastic','banner','wall','full-wrap','semi-wrap','window'];
 for(const width of [320,390,741,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.setViewportSize({width:390,height:844});
 for(const [i,id] of ids.entries()){await page.locator(`#default-rate-${id}`).fill(String(i));}
 await page.locator('#default-rate-channel').fill('-1');await page.getByRole('button',{name:'Save prices',exact:true}).click();assert(await page.locator('#settings').isVisible());
 await page.locator('#default-rate-channel').fill('0');
 await page.screenshot({path:'/tmp/eg-price-settings.png',fullPage:true});
 await page.getByRole('button',{name:'Save prices',exact:true}).click();await page.reload();
 for(const [i,id] of ids.entries()){
 await page.locator(`[data-product="${id}"]`).click();assert.equal(await page.locator('#rate').inputValue(),String(i));assert(await page.locator('#rate').isDisabled());
 await page.locator('#basis').selectOption('ft2');assert.equal(await page.locator('#rate').inputValue(),String(i));await page.locator('#basis').selectOption('in2');assert.equal(await page.locator('#rate').inputValue(),String(i));await page.locator('#basis').selectOption('ft2');
 await page.locator('#height-0').fill('12');await page.locator('#width-0').fill('12');assert.equal(await page.locator('#total').innerText(),`$${i}.00`);
 await page.locator('#customize-price').click();await page.locator('#rate').fill('10');assert.equal(await page.locator('#total').innerText(),'$10.00');
 await page.locator('#reset-price').click();assert.equal(await page.locator('#rate').inputValue(),String(i));
 await page.locator('#customize-price').click();await page.locator('#rate').fill('99');await page.locator('#back').click();
 }
 await page.locator('[data-product="window"]').click();assert.equal(await page.locator('#rate').inputValue(),'7');
 await page.locator('#clear').click();await page.locator('#confirm-clear').click();assert.equal(await page.locator('#rate').inputValue(),'7');assert(await page.locator('#copy').isDisabled());
 await page.locator('#back').click();await page.locator('#open-settings').click();await page.locator('#default-rate-window').fill('');await page.locator('#settings-cancel').click();
 await page.locator('#open-settings').click();assert.equal(await page.locator('#default-rate-window').inputValue(),'7');await page.locator('#default-rate-window').fill('');await page.getByRole('button',{name:'Save prices',exact:true}).click();
 await page.locator('[data-product="window"]').click();assert.equal(await page.locator('#rate').inputValue(),'');assert(await page.locator('#copy').isDisabled());
 await page.locator('#customize-price').click();assert(await page.locator('#rate').isEnabled());
 await page.reload();await page.evaluate(()=>localStorage.setItem('eg-quote-builder.product-prices.v1',JSON.stringify({channel:{rate:'5',basis:'ft2'}})));await page.reload();await page.locator('[data-product=channel]').click();assert.equal(await page.locator('#rate').inputValue(),'5');await page.locator('#basis').selectOption('ft2');assert.equal(await page.locator('#rate').inputValue(),'5');
 await page.reload();await page.evaluate(()=>localStorage.setItem('eg-quote-builder.product-prices.v1','broken'));await page.reload();await page.locator('[data-product="channel"]').click();assert.equal(await page.locator('#rate').inputValue(),'');
 assert.deepEqual(errors,[]);console.log('Price settings passed: all products, persistence, zero, validation, customization, reset, cancel, deletion, corrupt storage, mobile layouts.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
