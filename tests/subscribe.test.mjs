import test from 'node:test';import assert from 'node:assert/strict';
import {handleSubscribe} from '../server/subscribe.js';import {localDatabase} from '../tools/local-db.mjs';
const origin='https://oryn-b-cinematic-review.proudcabin3.chatgpt.site';
const body={email:'qa@example.com',consent:true,consentVersion:'oryn-launch-v2',website:'',interest:'BOTH'};
const request=(data=body,options={})=>new Request(origin+'/api/subscribe',{method:options.method||'POST',headers:{Origin:origin,'Content-Type':'application/json',...options.headers},body:JSON.stringify(data)});

test('live domain preflight, signup and removal allow only the intended CORS origins',async()=>{
  const DB=await localDatabase();
  try{
    for(const live of ['https://orynb.com','https://www.orynb.com']){
      const preflight=await handleSubscribe(new Request(origin+'/api/subscribe',{method:'OPTIONS',headers:{Origin:live,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}}),{DB});
      assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),live);assert.equal(preflight.headers.get('Vary'),'Origin');
      const response=await handleSubscribe(request(body,{headers:{Origin:live}}),{DB});
      assert.equal(response.status,201);assert.equal(response.headers.get('Access-Control-Allow-Origin'),live);
      const signup=await response.json();
      const removal=await handleSubscribe(request({token:signup.removalToken},{method:'DELETE',headers:{Origin:live}}),{DB});
      assert.equal(removal.status,200);assert.equal(removal.headers.get('Access-Control-Allow-Origin'),live);
    }
    for(const invalid of [{Origin:'https://orynb.com.evil.example','Access-Control-Request-Method':'POST'},{Origin:'https://orynb.com','Access-Control-Request-Method':'PUT'},{Origin:'https://orynb.com','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization'}]){
      const denied=await handleSubscribe(new Request(origin+'/api/subscribe',{method:'OPTIONS',headers:invalid}),{DB});
      assert.equal(denied.status,403);assert.equal(denied.headers.get('Access-Control-Allow-Origin'),null);
    }
    assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,0);
  }finally{DB.close();}
});
test('requires valid email, consent, version, interest and empty honeypot',async()=>{const DB=await localDatabase();try{for(const data of [{...body,email:'bad'},{...body,consent:false},{...body,consentVersion:'old'},{...body,interest:'invented'},{...body,website:'bot'}])assert.equal((await handleSubscribe(request(data),{DB})).status,422);assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,0);}finally{DB.close();}});
test('persists original consent, deduplicates email and removes only with a valid private token',async()=>{const DB=await localDatabase();try{const first=await handleSubscribe(request(),{DB});assert.equal(first.status,201);const record=await first.json();assert.equal(record.accepted,true);assert.match(record.removalToken,/^[a-f0-9]{64}$/);const rows=DB.inspect('SELECT * FROM launch_subscribers');assert.equal(rows.length,1);assert.equal(rows[0].email,body.email);assert.equal(rows[0].consent_version,'oryn-launch-v2');assert.match(rows[0].consent_text,/unsubscribe/);assert.notEqual(rows[0].removal_hash,record.removalToken);assert.equal((await handleSubscribe(request(),{DB})).status,201);assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,1);const latest=await (await handleSubscribe(request(),{DB})).json();assert.equal((await handleSubscribe(request({token:latest.removalToken},{method:'DELETE'}),{DB})).status,200);assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,0);}finally{DB.close();}});
test('rejects other origins, wrong types, unsupported methods, oversized bodies and missing database',async()=>{const DB=await localDatabase();try{assert.equal((await handleSubscribe(request(),{})).status,503);assert.equal((await handleSubscribe(request(body,{headers:{Origin:'https://other.example'}}),{DB})).status,403);assert.equal((await handleSubscribe(request(body,{headers:{'Content-Type':'text/plain'}}),{DB})).status,415);assert.equal((await handleSubscribe(new Request(origin+'/api/subscribe'),{DB})).status,405);assert.equal((await handleSubscribe(request({...body,email:'a'.repeat(5000)}),{DB})).status,400);}finally{DB.close();}});
test('limits repeated submissions and never acknowledges a failed database write',async()=>{const DB=await localDatabase();try{for(let i=0;i<15;i++)assert.equal((await handleSubscribe(request({...body,email:`qa${i}@example.com`}),{DB})).status,201);assert.equal((await handleSubscribe(request({...body,email:'excess@example.com'}),{DB})).status,429);assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,15);}finally{DB.close();}assert.equal((await handleSubscribe(request(),{DB:{prepare(){throw Error('private details');}}})).status,503);});
