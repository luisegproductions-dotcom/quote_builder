import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, convert } from '../pricing.js';
const panel=(height,width,quantity=1)=>({height:String(height),width:String(width),quantity:String(quantity)});
test('original calculator: panel areas, quantities and USD subtotals',()=>{
 const r=calculate([panel(20,30,40),panel(10,30,40)],'in','in2','0.05');
 assert.equal(r.total,1800);assert.equal(r.area,36000);assert.equal(r.quantity,80);
});
test('original rounds per-panel area before quantity and price',()=>{
 const r=calculate([panel(20,30,3)],'in','ft2','7');
 assert.equal(r.rows[0].area,4.17);assert.equal(r.rows[0].billableArea,12.51);assert.equal(r.total,87.57);
});
test('all six input units agree on a square foot',()=>{
 for(const [u,v] of [['in',12],['ft',1],['yd',1/3],['mm',304.8],['cm',30.48],['m',.3048]])assert.equal(calculate([panel(v,v)],u,'ft2','5').total,5);
});
test('unit switching preserves physical dimensions and quote',()=>{
 let h='20.5',w='32.7';const total=calculate([panel(h,w,3)],'in','ft2','8.5').total;
 for(let i=0;i<30;i++){h=convert(convert(h,'in','mm'),'mm','in');w=convert(convert(w,'in','mm'),'mm','in');}
 assert.equal(calculate([panel(h,w,3)],'in','ft2','8.5').total,total);
});
test('blank and invalid panels cannot silently produce a final quote',()=>{
 for(const bad of [panel('',2),panel(-1,2),panel(2,2,1.5),panel(2,2,0),panel(Infinity,2),panel(1e308,1e308)])assert.equal(calculate([panel(2,2),bad],'in','in2','1').ready,false);
});
test('missing and invalid rates differ from a valid zero-dollar rate',()=>{
 for(const rate of ['', '-1', 'Infinity','no']) assert.equal(calculate([panel(2,2)],'in','in2',rate).ready,false);
 assert.equal(calculate([panel(2,2)],'in','in2','0').total,0);
});
