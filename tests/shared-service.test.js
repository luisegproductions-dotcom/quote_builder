import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {generateKeyPairSync,sign} from 'node:crypto';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'google-test-key',alg:'RS256',use:'sig'};
const now=Math.floor(Date.now()/1000);
function token(overrides={},header={}){
 const claims={aud:'client.apps.googleusercontent.com',iss:'https://accounts.google.com',sub:'user-123',email:'staff@gmail.com',email_verified:true,iat:now,exp:now+3600,...overrides};
 const data=[{alg:'RS256',kid:jwk.kid,...header},claims].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');return data+'.'+sign('RSA-SHA256',Buffer.from(data),privateKey).toString('base64url');
}
function service(){
 const rows=[['channel','Channel letters',''],['reverse','Reverse channel letters',''],['coroplastic','Coroplastic signs',''],['banner','Banners',''],['wall','Wall prints',''],['full-wrap','Full car wrap',''],['semi-wrap','Semi-car wrap',''],['window','Window graphics','']];
 const props={GOOGLE_CLIENT_ID:'client.apps.googleusercontent.com',ALLOWED_EMAILS:'staff@gmail.com,info@example.com',SHEET_ID:'sheet',EDIT_KEY:'old-secret'};
 const cache=new Map();let requests=0;
 const sheet={getRange:(row,col)=>({getValues:()=>rows.map(r=>[...r]),setValues:values=>{if(row>1)values[0].forEach((v,i)=>rows[row-2][col-1+i]=v);}})};
 const context=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:key=>props[key]})},CacheService:{getScriptCache:()=>({get:key=>cache.get(key),put:(key,v)=>cache.set(key,v)})},UrlFetchApp:{fetch:url=>{assert.equal(url,'https://www.googleapis.com/oauth2/v3/certs');requests++;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({keys:[jwk]})};}},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:body=>({setMimeType:()=>JSON.parse(body)})}});
 vm.runInContext(fs.readFileSync('google-apps-script/JwtLibrary.gs','utf8'),context);
 vm.runInContext(fs.readFileSync('google-apps-script/Code.gs','utf8'),context);
 return {context,props,rows,post:d=>context.doPost({postData:{contents:JSON.stringify(d)}}),requests:()=>requests};
}
test('signed Google identity required; every save checks allowlist, audience, issuer, expiration and signature',()=>{
 const s=service();assert.equal(s.context.doGet().auth.mode,'google');
 assert.equal(s.post({key:'old-secret',product:'channel',rate:'5',expectedRate:''}).code,'unauthorized');
 for(const credential of [token({aud:'attacker'}),token({iss:'attacker'}),token({exp:now-1}),token({exp:undefined}),token({iat:undefined}),token({email_verified:false}),token({sub:''}),token({azp:'attacker'}),token({}, {alg:'HS256'}),token({}, {kid:'unknown'}),token().replace(/.$/,'!')])assert.equal(s.post({action:'authorize',credential}).ok,false);
 const valid=token();const parts=valid.split('.');parts[1]=Buffer.from(JSON.stringify({aud:'client.apps.googleusercontent.com',iss:'https://accounts.google.com',exp:now+3600,iat:now,email:'staff@gmail.com',email_verified:true,sub:'forged'})).toString('base64url');assert.equal(s.post({action:'authorize',credential:parts.join('.')}).ok,false);
 assert.equal(s.post({action:'authorize',credential:token({email:'outsider@gmail.com'})}).code,'forbidden');
 assert.equal(s.post({action:'authorize',credential:token({email:'info@example.com'})}).code,'forbidden');
 assert.equal(s.post({action:'authorize',credential:token({email:'info@example.com',hd:'example.com'})}).ok,true);
 assert.equal(s.post({action:'authorize',credential:valid}).ok,true);
 const data={credential:valid,product:'channel',rate:'5',expectedRate:''};assert.equal(s.post(data).ok,true);assert.equal(s.rows[0][2],5);assert.equal(s.rows[0][3],'staff@gmail.com');assert.equal(s.rows[1][2],'');
 assert.equal(s.post({...data,rate:'8'}).code,'conflict');
 for(const rate of ['-1','Infinity','=SUM(A1)'])assert.equal(s.post({...data,expectedRate:'5',rate}).ok,false);
 s.props.ALLOWED_EMAILS='someone@gmail.com';assert.equal(s.post({...data,expectedRate:'5',rate:'8'}).code,'forbidden');assert.equal(s.rows[0][2],5);
 s.props.ALLOWED_EMAILS='staff@gmail.com';assert.equal(s.post({...data,expectedRate:'5',rate:'0'}).ok,true);assert.equal(s.post({...data,expectedRate:'0',rate:''}).ok,true);
 assert(s.requests()<=2,'verification keys are cached');
 s.props.GOOGLE_CLIENT_ID='';assert.equal(s.post(data).code,'unavailable');
});
