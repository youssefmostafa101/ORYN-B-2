import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const output=process.env.ORYN_QA_OUTPUT||path.resolve(import.meta.dirname,'..','test-results');await mkdir(output,{recursive:true});
const executable=process.env.BROWSER_CHANNEL||'msedge';
const browser=await chromium.launch({channel:executable,headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={checks:[],errors:[],accessibility:[],performance:[]};
async function check(name,run){try{await run();report.checks.push({name,passed:true});console.log('PASS '+name);}catch(error){report.checks.push({name,passed:false,error:error.message});console.log('FAIL '+name+': '+error.message);}}
async function newPage(options={}){
  const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce',...options});
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});return {page,context};
}
for(const width of [320,390,768,1440])await check(`layout and accessibility at ${width}px`,async()=>{
  const {page,context}=await newPage({viewport:{width,height:width<600?844:960}});
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const section of ['products','output-details','deep-details','system','founders','faq']){await page.locator('#'+section).scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  report.accessibility.push({width,violations:results.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>n.target)}))});
  expect(results.violations).toEqual([]);
  await context.close();
});
await check('galleries select all original views, lightbox keyboard and Escape',async()=>{
  const {page,context}=await newPage();
  for(const kind of ['output','deep']){
    const gallery=page.locator(`[data-gallery="${kind}"]`);
    for(let i=0;i<5;i++){await gallery.locator('.gallery-thumbs button').nth(i).click();await expect(gallery.locator('.gallery-image')).toHaveAttribute('src',`assets/${kind}-${i+1}-760.webp`);await expect(gallery.locator('.gallery-thumbs button').nth(i)).toHaveAttribute('aria-pressed','true');}
    await gallery.locator('.zoom-button').click();await expect(page.locator('#lightbox')).toBeVisible();await page.keyboard.press('ArrowRight');await expect(page.locator('#lightbox-image')).toHaveAttribute('src',`assets/${kind}-1-760.webp`);await page.keyboard.press('Escape');await expect(page.locator('#lightbox')).not.toBeVisible();
  }await context.close();
});
await check('launch bag add, bundle, quantities, persistence, remove and focus trap',async()=>{
  const {page,context}=await newPage({viewport:{width:390,height:844}});
  await page.locator('[data-add="output"]').click();await expect(page.locator('#cart')).toBeVisible();await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.locator('[data-id="output"][data-change="1"]').click();await expect(page.locator('.quantity>span')).toHaveText('2');
  await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement.closest('#cart')!==null)).toBe(true);
  await page.keyboard.press('Escape');await page.reload();await page.locator('[data-open-cart]').click();await expect(page.locator('.quantity>span')).toHaveText('2');
  await page.locator('[data-close-cart]').click();await page.locator('[data-add="system"]').click();await expect(page.locator('.cart-item')).toHaveCount(2);await expect(page.locator('#cart')).not.toContainText('$');
  await page.locator('[data-remove="output"]').click();await page.locator('[data-remove="system"]').click();await expect(page.locator('.cart-empty')).toBeVisible();
  await page.locator('[data-cart-products]').click();await expect(page.locator('#cart')).not.toBeVisible();await context.close();
});
await check('corrupted and adversarial saved bag is rejected',async()=>{
  const {page,context}=await newPage();
  await page.evaluate(()=>localStorage.setItem('oryn-b-launch-bag-v2',JSON.stringify([{id:'<img src=x onerror=alert(1)>',quantity:1},{id:'output',quantity:-1},{id:'deep',quantity:999999}])));
  await page.reload();await page.locator('[data-open-cart]').click();await expect(page.locator('.cart-item')).toHaveCount(1);await expect(page.locator('.quantity>span')).toHaveText('10');await context.close();
});
await check('mobile menu navigation, Escape and no trapped focus',async()=>{
  const {page,context}=await newPage({viewport:{width:390,height:844}});
  await page.locator('.menu-button').click();await expect(page.locator('#mobile-nav')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#mobile-nav')).toBeHidden();await expect(page.locator('.menu-button')).toBeFocused();
  await page.locator('.menu-button').click();await page.locator('#mobile-nav a[href="#system"]').click();await expect(page.locator('#mobile-nav')).toBeHidden();await context.close();
});
await check('founders reveal, email/consent validation and honest disconnected state',async()=>{
  const {page,context}=await newPage();let submitted=false;page.on('request',request=>{if(request.url().includes('/api/'))submitted=true;});
  await page.locator('#reveal-invitation').click();await expect(page.locator('#signup-panel')).toBeVisible();await expect(page.locator('#email')).toBeFocused();
  await page.locator('#early-access button[type=submit]').click();await expect(page.locator('#form-status')).toContainText('valid email');
  await page.locator('#email').fill('qa@example.com');await page.locator('#early-access button[type=submit]').click();await expect(page.locator('#form-status')).toContainText('confirm');
  await page.locator('input[name=consent]').check();await page.locator('#early-access button[type=submit]').click();await expect(page.locator('#form-status')).toContainText('has not been saved or sent');expect(submitted).toBe(false);
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('qa@example.com');await context.close();
});
await check('touch-like scratch interaction reveals the same invitation',async()=>{
  const {page,context}=await newPage({viewport:{width:390,height:844},hasTouch:true});
  await page.locator('.invitation').scrollIntoViewIfNeeded();const rect=await page.locator('#scratch').boundingBox();
  await page.mouse.move(rect.x+10,rect.y+15);await page.mouse.down();
  for(let y=15;y<rect.height;y+=20){await page.mouse.move(rect.x+rect.width-10,rect.y+y,{steps:8});await page.mouse.move(rect.x+10,rect.y+y+10,{steps:8});}
  await page.mouse.up();await expect(page.locator('#signup-panel')).toBeVisible();await expect(page.locator('.invitation-card')).toContainText('Your place');await context.close();
});
await check('prepared email transport: success, rejected acknowledgement and outage',async()=>{
  const context=await browser.newContext({reducedMotion:'reduce'});
  await context.route('**/site-config.js',route=>route.fulfill({contentType:'text/javascript',body:"export const signupConfig={endpoint:'/api/early-access',consentVersion:'founders-marketing-v1',source:'oryn-b-founders'};"}));
  let mode='success',payload;
  await context.route('**/api/early-access',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:mode==='outage'?503:202,contentType:'application/json',body:JSON.stringify({accepted:mode==='success'})});});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173');await page.locator('#reveal-invitation').click();
  for(const next of ['success','rejected','outage']){mode=next;await page.locator('#email').fill('qa@example.com');await page.locator('input[name=consent]').check();await page.locator('#early-access button[type=submit]').click();await expect(page.locator('#form-status')).toContainText(mode==='success'?'request is received':'not confirmed');}
  expect(payload.consent).toBe(true);expect(payload.consentVersion).toBe('founders-marketing-v1');expect(payload).not.toHaveProperty('apiKey');await context.close();
});
await check('no-JavaScript content and real hero links remain usable',async()=>{
  const {page,context}=await newPage({javaScriptEnabled:false});await expect(page.locator('h1')).toContainText('Built for');await expect(page.locator('.hero-copy a.button')).toHaveAttribute('href','#products');await expect(page.locator('#output-details')).toContainText('OUTPUT');await expect(page.locator('.invitation-card')).toBeVisible();await context.close();
});
for(const width of [390,1440])await check(`real WebGL motion, return, pause and errors at ${width}px`,async()=>{
  const {page,context}=await newPage({reducedMotion:'no-preference',viewport:{width,height:width===390?844:960}});
  await page.locator('#output').scrollIntoViewIfNeeded();await page.waitForSelector('[data-stage="deep"][data-ready="true"]',{timeout:30000});
  for(const [p,phase] of [[.3,'OPEN'],[.62,'SUSPEND'],[1,'SETTLE'],[.3,'OPEN']]){
    await page.evaluate(p=>{const s=document.getElementById('deep');window.scrollTo({top:s.offsetTop+(s.offsetHeight-innerHeight)*p,behavior:'instant'});},p);
    await expect(page.locator('[data-phase]')).toContainText(phase,{timeout:12000});
  }
  await page.locator('#deep .motion-toggle').click();await expect(page.locator('#deep .motion-toggle')).toHaveText('Resume motion');await expect(page.locator('#deep .motion-toggle')).toHaveAttribute('aria-pressed','true');await page.locator('#deep .motion-toggle').click();
  expect(await page.locator('.scene-canvas canvas').count()).toBe(2);await context.close();
});
await check('WebGL failure keeps product-photo fallback visible',async()=>{
  const browser2=await chromium.launch({channel:executable,headless:true,args:['--disable-webgl']});
  const page=await browser2.newPage();await page.goto('http://127.0.0.1:4173');await page.locator('#output').scrollIntoViewIfNeeded();await expect(page.locator('[data-stage="output"]')).toHaveAttribute('data-fallback','true');await expect(page.locator('[data-stage="output"] .scene-fallback')).toBeVisible();await browser2.close();
});
await check('initial payload, no third-party calls, zero layout shift and delayed 3D',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});const page=await context.newPage();
  await page.addInitScript(()=>{window.__vitals={cls:0,lcp:0};new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__vitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())window.__vitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.waitForTimeout(600);
  const metrics=await page.evaluate(()=>({vitals:window.__vitals,resources:performance.getEntriesByType('resource').map(e=>({url:e.name,bytes:e.transferSize}))}));
  const total=metrics.resources.reduce((n,r)=>n+r.bytes,0);report.performance.push({...metrics,totalTransferBytes:total,environment:'Local Edge, 390px, no network throttling. Not field Web Vitals.'});
  expect(metrics.resources.some(r=>r.url.includes('three.'))).toBe(false);expect(metrics.resources.filter(r=>!r.url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);expect(metrics.vitals.cls).toBeLessThan(.05);expect(total).toBeLessThan(650000);await context.close();
});
report.summary={passed:report.checks.filter(c=>c.passed).length,failed:report.checks.filter(c=>!c.passed).length,pageErrors:report.errors};
await writeFile(path.join(output,'qa-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));await browser.close();if(report.summary.failed||report.errors.length)process.exitCode=1;
