import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
const output=process.env.ORYN_QA_OUTPUT||path.resolve(import.meta.dirname,'..','test-results');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:path.join(output,'desktop-hero.png')});
await page.locator('#output').scrollIntoViewIfNeeded();
await page.waitForSelector('[data-stage="output"][data-ready="true"]',{timeout:20000});
for(const [kind,p] of [['output',.5],['deep',.62],['deep',1]]){
  await page.evaluate(({kind,p})=>{const section=document.getElementById(kind);window.scrollTo({top:section.offsetTop+(section.offsetHeight-innerHeight)*p,behavior:'instant'});},{kind,p});
  await page.waitForTimeout(1500);
  await page.screenshot({path:path.join(output,`${kind}-${p===1?'closed':'motion'}-desktop.png`)});
}
await page.locator('#output-details').scrollIntoViewIfNeeded();await page.waitForTimeout(600);await page.screenshot({path:path.join(output,'desktop-gallery.png')});
await page.locator('#founders').scrollIntoViewIfNeeded();await page.waitForTimeout(600);await page.screenshot({path:path.join(output,'desktop-founders.png')});
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.screenshot({path:path.join(output,'mobile-hero.png'),fullPage:false});
await page.screenshot({path:path.join(output,'mobile-full-page.png'),fullPage:true});
await page.locator('#deep').scrollIntoViewIfNeeded();await page.waitForSelector('[data-stage="deep"][data-ready="true"]',{timeout:20000});
await page.evaluate(()=>{const section=document.getElementById('deep');window.scrollTo({top:section.offsetTop+(section.offsetHeight-innerHeight)*.62,behavior:'instant'});});await page.waitForTimeout(1500);await page.screenshot({path:path.join(output,'mobile-deep-motion.png')});
console.log(JSON.stringify({errors,output}));await browser.close();
