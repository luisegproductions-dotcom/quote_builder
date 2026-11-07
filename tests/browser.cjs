const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5173');
 assert.equal(await page.locator('.product').count(),8);
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/eg-quote-products.png',fullPage:true});
 await page.getByRole('button',{name:'Banners Your message'}).click();
 await page.locator('#height-0').fill('20');await page.locator('#width-0').fill('30');await page.locator('#quantity-0').fill('40');await page.locator('#rate').fill('0.05');
 assert.equal(await page.locator('#total').innerText(),'$1,200.00');
 await page.getByRole('button',{name:'Metric',exact:true}).click();assert.equal(await page.locator('#height-0').inputValue(),'508');assert.equal(await page.locator('#total').innerText(),'$1,200.00');
 await page.getByRole('button',{name:'Inches',exact:true}).click();
 await page.locator('#add').click();assert(await page.locator('#copy').isDisabled());
 await page.locator('#height-1').fill('10');await page.locator('#width-1').fill('30');await page.locator('#quantity-1').fill('40');assert.equal(await page.locator('#total').innerText(),'$1,800.00');
 await page.locator('#copy').click();assert((await page.evaluate(()=>navigator.clipboard.readText())).includes('ESTIMATED TOTAL: $1,800.00 USD'));
 await page.screenshot({path:'/tmp/eg-quote-mobile.png',fullPage:true});
 await page.locator('#quantity-1').fill('1.5');assert(await page.locator('#copy').isDisabled());assert(await page.locator('#print').isDisabled());
 await page.getByRole('button',{name:'Remove panel 2'}).click();assert.equal(await page.locator('#total').innerText(),'$1,200.00');
 await page.locator('#basis').selectOption('ft2');await page.locator('#rate').fill('7');assert.equal(await page.locator('#total').innerText(),'$1,167.60');
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/tmp/eg-quote-desktop.png',fullPage:true});
 await page.emulateMedia({media:'print'});assert(await page.locator('.editor').isHidden());assert(await page.locator('#summary').isVisible());await page.pdf({path:'/tmp/eg-quote.pdf',format:'Letter'});await page.emulateMedia({media:'screen'});
 await page.locator('#clear').click();await page.locator('#cancel-clear').click();assert.equal(await page.locator('#total').innerText(),'$1,167.60');
 await page.locator('#clear').click();await page.locator('#confirm-clear').click();assert.equal(await page.locator('#height-0').inputValue(),'');assert(await page.locator('#copy').isDisabled());
 await page.locator('#back').click();
 for(let i=0;i<8;i++){await page.locator('.product').nth(i).click();assert(await page.locator('#builder').isVisible());await page.locator('#back').click();}
 assert.deepEqual(errors,[]);await browser.close();console.log('Browser checks passed: mobile/desktop, all products, calculations, conversions, validation, copy, print, clear.');
})().catch(e=>{console.error(e);process.exit(1)});
