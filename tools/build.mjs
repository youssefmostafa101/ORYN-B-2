import { mkdir, rm, copyFile, cp, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
// Only this project's generated output can be removed.
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw new Error('Unsafe build path');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const file of ['index.html','styles.css','app.js','motion.js','site-config.js','privacy.html','terms.html','review.html','robots.txt','_headers'])await copyFile(path.join(root,file),path.join(dist,file));
await cp(path.join(root,'lib'),path.join(dist,'lib'),{recursive:true});
await mkdir(path.join(dist,'assets','fonts'),{recursive:true});
for(const file of await readdir(path.join(root,'assets')))if(/\.webp$|-label\.png$|^monogram\.png$/.test(file))await copyFile(path.join(root,'assets',file),path.join(dist,'assets',file));
await cp(path.join(root,'assets','fonts'),path.join(dist,'assets','fonts'),{recursive:true});
await mkdir(path.join(dist,'vendor'),{recursive:true});
for(const file of ['three.module.min.js','three.core.min.js'])await copyFile(path.join(root,'node_modules','three','build',file),path.join(dist,'vendor',file));
await copyFile(path.join(root,'node_modules','three','LICENSE'),path.join(dist,'vendor','THREE-LICENSE.txt'));
await mkdir(path.join(dist,'.openai'),{recursive:true});await copyFile(path.join(root,'.openai','hosting.json'),path.join(dist,'.openai','hosting.json'));
// Every local HTML reference must resolve in the deployable output.
const html=await readFile(path.join(dist,'index.html'),'utf8');
for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
  const reference=match[1];if(/^(?:https?:|mailto:)/.test(reference))continue;
  await stat(path.join(dist,reference.split('#')[0]));
}
const summary=[];for(const file of ['app.js','styles.css','motion.js','assets/hero-environment-960.webp','assets/hero-environment-1600.webp','assets/product-duo-640.webp','assets/product-duo-1100.webp','vendor/three.module.min.js','vendor/three.core.min.js'])summary.push({file,bytes:(await stat(path.join(dist,file))).size});
console.table(summary);console.log('Static build complete. CNAME deliberately excluded from preview output.');
