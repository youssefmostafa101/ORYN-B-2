import test from 'node:test';
import assert from 'node:assert/strict';
import {handleSubscribe} from '../server/subscribe.js';
import {localDatabase} from '../tools/local-db.mjs';

const origin='https://oryn-b-cinematic-review.proudcabin3.chatgpt.site';
const emailOctopusHost='https://api.emailoctopus.com/lists/test-list/contacts';
const body={email:'qa@example.com',consent:true,consentVersion:'oryn-launch-v2',website:'',interest:'BOTH'};
const request=(data=body,options={})=>new Request(origin+'/api/subscribe',{
  method:options.method||'POST',
  headers:{Origin:origin,'Content-Type':'application/json',...options.headers},
  body:JSON.stringify(data)
});
const env=DB=>({DB,EMAILOCTOPUS_API_KEY:'test-secret-stays-server-side',EMAILOCTOPUS_LIST_ID:'test-list'});
const realFetch=globalThis.fetch;
let providerContacts=new Map();
let providerCalls=[];
let failProvider=false;
globalThis.fetch=async(url,init)=>{
  assert.match(url,/^https:\/\/api\.emailoctopus\.com\/lists\/test-list\/contacts/);
  assert.equal(init.headers.Authorization,'Bearer test-secret-stays-server-side');
  assert.equal(init.headers['Content-Type'],'application/json');
  const data=JSON.parse(init.body);
  providerCalls.push({url,method:init.method,data});
  if(failProvider) return new Response('{}',{status:503});
  if(init.method==='POST'){
    if(providerContacts.has(data.email_address))return new Response(JSON.stringify({title:'Already exists'}),{status:409});
    const contact={id:crypto.randomUUID(),email_address:data.email_address,status:data.email_address.startsWith('pending')?'pending':'subscribed'};
    providerContacts.set(data.email_address,contact);
    return new Response(JSON.stringify({data:contact}),{status:201});
  }
  if(init.method==='PUT'){
    const id=url.slice(emailOctopusHost.length+1);
    const contact=[...providerContacts.values()].find(c=>c.id===id);
    if(!contact)return new Response('{}',{status:404});
    contact.status=data.status;
    return new Response(JSON.stringify({data:contact}),{status:200});
  }
  throw Error('Unexpected provider operation');
};
test.after(()=>{globalThis.fetch=realFetch;});
test.beforeEach(()=>{providerContacts=new Map();providerCalls=[];failProvider=false;});

test('CORS allows live ORYN-B hosts; provider is called only after valid consent',async()=>{
  const DB=await localDatabase();
  try{
    for(const live of ['https://orynb.com','https://www.orynb.com']){
      const preflight=await handleSubscribe(new Request(origin+'/api/subscribe',{method:'OPTIONS',headers:{Origin:live,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}}),env(DB));
      assert.equal(preflight.status,204);
      assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),live);
      const signed=await handleSubscribe(request({...body,email:live.startsWith('https://www.')?'www@example.com':'root@example.com'},{headers:{Origin:live}}),env(DB));
      assert.equal(signed.status,201);
      assert.equal((await signed.json()).accepted,true);
    }
    assert.equal(providerCalls.filter(c=>c.method==='POST').length,2);
    for(const invalid of [{Origin:'https://orynb.com.evil.example','Access-Control-Request-Method':'POST'},{Origin:'https://orynb.com','Access-Control-Request-Method':'PUT'}]){
      const denied=await handleSubscribe(new Request(origin+'/api/subscribe',{method:'OPTIONS',headers:invalid}),env(DB));
      assert.equal(denied.status,403);
    }
  }finally{DB.close();}
});

test('rejects invalid email, missing consent, wrong version and honeypot without touching provider',async()=>{
  const DB=await localDatabase();
  try{
    for(const data of [{...body,email:'bad'},{...body,consent:false},{...body,consentVersion:'old'},{...body,interest:'invented'},{...body,website:'bot'}]){
      const resp=await handleSubscribe(request(data),env(DB));
      assert.equal(resp.status,422);
    }
    assert.equal(providerCalls.length,0);
    assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,0);
  }finally{DB.close();}
});

test('creates the ESP contact, saves consent and unsubscribes on undo',async()=>{
  const DB=await localDatabase();
  try{
    const first=await handleSubscribe(request(),env(DB));
    assert.equal(first.status,201);
    const record=await first.json();
    assert.equal(record.accepted,true);
    assert.match(record.removalToken,/^[a-f0-9]{64}$/);
    const rows=DB.inspect('SELECT * FROM launch_subscribers');
    assert.equal(rows.length,1);
    assert.equal(rows[0].email,body.email);
    assert.equal(rows[0].consent_version,'oryn-launch-v2');
    assert.equal(rows[0].emailoctopus_contact_id,providerContacts.get(body.email).id);
    assert.notEqual(rows[0].removal_hash,record.removalToken);
    assert.equal((await handleSubscribe(request(),env(DB))).status,409);
    const removal=await handleSubscribe(request({token:record.removalToken},{method:'DELETE'}),env(DB));
    assert.equal(removal.status,200);
    assert.equal(providerContacts.get(body.email).status,'unsubscribed');
    assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,0);
  }finally{DB.close();}
});

test('respects provider pending confirmation',async()=>{
  const DB=await localDatabase();
  try{
    const response=await handleSubscribe(request({...body,email:'pending@example.com'}),env(DB));
    assert.equal(response.status,201);
    assert.equal((await response.json()).pendingConfirmation,true);
  }finally{DB.close();}
});

test('does not claim success when provider credentials or connectivity are missing',async()=>{
  const DB=await localDatabase();
  try{
    assert.equal((await handleSubscribe(request(),{DB})).status,503);
    failProvider=true;
    assert.equal((await handleSubscribe(request(),env(DB))).status,503);
    assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,0);
  }finally{DB.close();}
});

test('rejects invalid origins, wrong MIME, oversized requests and missing database',async()=>{
  const DB=await localDatabase();
  try{
    assert.equal((await handleSubscribe(request(),{})).status,503);
    assert.equal((await handleSubscribe(request(body,{headers:{Origin:'https://other.example'}}),env(DB))).status,403);
    assert.equal((await handleSubscribe(request(body,{headers:{'Content-Type':'text/plain'}}),env(DB))).status,415);
    assert.equal((await handleSubscribe(new Request(origin+'/api/subscribe'),env(DB))).status,405);
    assert.equal((await handleSubscribe(request({...body,email:'a'.repeat(5000)}),env(DB))).status,400);
  }finally{DB.close();}
});

test('rate limits signup attempts and does not claim success after a database write error',async()=>{
  const DB=await localDatabase();
  try{
    for(let i=0;i<15;i++)assert.equal((await handleSubscribe(request({...body,email:'qa'+i+'@example.com'}),env(DB))).status,201);
    assert.equal((await handleSubscribe(request({...body,email:'excess@example.com'}),env(DB))).status,429);
    assert.equal(DB.inspect('SELECT * FROM launch_subscribers').length,15);
  }finally{DB.close();}
  const broken={prepare(){throw Error('private details');}};
  assert.equal((await handleSubscribe(request(),env(broken))).status,503);
});
