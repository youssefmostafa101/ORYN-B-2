import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeCart,updateCart,deepTimeline,validateSignup} from '../lib/state.js';
test('bag rejects untrusted persistence, duplicate IDs and excessive quantities',()=>{
  assert.deepEqual(sanitizeCart([{id:'__proto__',quantity:5},{id:'output',quantity:9},{id:'output',quantity:8},{id:'deep',quantity:-2},{id:'system',quantity:'2'}]),[{id:'output',quantity:10}]);
  assert.deepEqual(sanitizeCart({}),[]);
});
test('bag add, decrement, removal and bounds',()=>{
  let cart=updateCart([],'system',1);assert.equal(cart[0].quantity,1);
  cart=updateCart(cart,'system',20);assert.equal(cart[0].quantity,10);
  cart=updateCart(cart,'system',-10);assert.deepEqual(cart,[]);
  assert.deepEqual(updateCart(cart,'bogus',1),[]);
});
test('bottle opens before capsules emerge and closes after their return',()=>{
  assert.equal(deepTimeline(0).opening,0);assert.equal(deepTimeline(0).expansion,0);
  assert.equal(deepTimeline(.36).opening,1);assert.equal(deepTimeline(.36).expansion,0);
  assert.equal(deepTimeline(.64).expansion,1);assert.equal(deepTimeline(.64).opening,1);
  assert.equal(deepTimeline(.86).expansion,0);assert.equal(deepTimeline(.86).opening,1);
  assert.equal(deepTimeline(1).opening,0);assert.equal(deepTimeline(1).expansion,0);
  for(let i=0;i<=1000;i++){const p=i/1000,t=deepTimeline(p);assert.ok(t.opening>=0&&t.opening<=1);assert.ok(t.expansion>=0&&t.expansion<=1);if(t.expansion>.001)assert.equal(t.opening,1);}
});
test('timeline is deterministic and has no phase discontinuities',()=>{
  for(let i=1;i<=1000;i++){const a=deepTimeline((i-1)/1000),b=deepTimeline(i/1000);assert.ok(Math.abs(a.expansion-b.expansion)<.02);assert.ok(Math.abs(a.opening-b.opening)<.03);assert.deepEqual(deepTimeline(i/1000),b);}
});
test('marketing signup requires valid email, explicit consent and an empty honeypot',()=>{
  assert.equal(validateSignup({email:'invalid',consent:true}).field,'email');
  assert.equal(validateSignup({email:'qa@example.com',consent:false}).field,'consent');
  assert.equal(validateSignup({email:'qa@example.com',consent:true,website:'spam'}).valid,false);
  assert.deepEqual(validateSignup({email:' qa@example.com ',consent:true,website:''}),{valid:true,email:'qa@example.com'});
});
