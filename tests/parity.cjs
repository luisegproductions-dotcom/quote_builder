// Direct browser comparison with the original, not a duplicate pricing formula.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const {calculate}=await import('../pricing.js');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage();await page.goto('https://ivanvelascoklee-web.github.io/cotizador-EG/');
 await page.locator('#agregarLamina').click();
 const panels=[{height:'20',width:'30',quantity:'40'},{height:'10',width:'30',quantity:'3'}];
 for(let i=0;i<panels.length;i++)for(const [key,cls] of [['height','alto'],['width','largo'],['quantity','cantidad']])await page.locator('.'+cls).nth(i).fill(panels[i][key]);
 let checks=0;
 for(const [unit,original] of Object.entries({in:'pulgadas',ft:'pies',yd:'yardas',mm:'milimetros',cm:'centimetros',m:'metros'})){
 await page.locator('#unidad').selectOption(original);
 for(const basis of ['in2','ft2'])for(const rate of ['0','0.05','7']){
 await page.locator(basis==='in2'?'label[for=precioPulgadas]':'label[for=precioPies]').click();await page.locator('#precioUnidad').fill(rate);
 const total=calculate(panels,unit,basis,rate).total;
 const expected=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(total);
 assert((await page.locator('.total-caja.destacado').innerText()).includes(expected),`${unit}/${basis}/${rate}: ${expected}`);checks++;
 }}
 console.log(`${checks} live original-calculator comparisons passed.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
