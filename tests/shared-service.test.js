import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
test('Apps Script rejects unauthorized/invalid/conflicting writes and updates only one row',()=>{
 const rows=[['channel','Channel letters',''],['reverse','Reverse channel letters',''],['coroplastic','Coroplastic signs',''],['banner','Banners',''],['wall','Wall prints',''],['full-wrap','Full car wrap',''],['semi-wrap','Semi-car wrap',''],['window','Window graphics','']];
 const sheet={getRange:(row,col)=>({getValues:()=>rows.map(r=>[...r]),setValue:v=>{rows[row-2][col-1]=v;}})};
 const context=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='EDIT_KEY'?'secret':'sheet-id'})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:body=>({setMimeType:()=>JSON.parse(body)})}});
 vm.runInContext(fs.readFileSync('google-apps-script/Code.gs','utf8'),context);
 const post=d=>context.doPost({postData:{contents:JSON.stringify(d)}});
 assert.equal(context.doGet().ok,true);
 assert.equal(post({product:'channel',rate:'5',expectedRate:'',key:'wrong'}).code,'unauthorized');
 for(const rate of ['-1','Infinity','=SUM(A1)','NaN'])assert.equal(post({product:'channel',rate,expectedRate:'',key:'secret'}).ok,false);
 assert.equal(post({product:'channel',rate:'5',expectedRate:'',key:'secret'}).ok,true);
 assert.equal(rows[0][2],5);assert.equal(rows[1][2],'');
 assert.equal(post({product:'channel',rate:'9',expectedRate:'',key:'secret'}).code,'conflict');
 assert.equal(post({product:'channel',rate:'0',expectedRate:'5',key:'secret'}).ok,true);
 assert.equal(post({product:'channel',rate:'',expectedRate:'0',key:'secret'}).ok,true);
 assert.equal(rows[0][2],'');
});
