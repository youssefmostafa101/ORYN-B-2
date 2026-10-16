import {mkdir,rm,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw Error('Unsafe build path');
await rm(dist,{recursive:true,force:true});await mkdir(path.join(dist,'server'),{recursive:true});
const files=['index.html','styles.css','app.js','privacy.html','terms.html','robots.txt','assets/brand-mark.webp','assets/monogram.png','favicon.ico','assets/favicon-black-32.png','assets/favicon-black-192.png'];
for(const kind of ['output','deep'])for(let i=1;i<=5;i++)for(const size of [160,760])files.push(`assets/${kind}-${i}-${size}.webp`);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const assets=[];
for(const file of files){const bytes=await readFile(path.join(root,file));assets.push(['/'+file,{type:types[path.extname(file)],body:bytes.toString('base64')}]);}
let handler=await readFile(path.join(root,'server','subscribe.js'),'utf8');handler=handler.replace('export async function handleSubscribe','async function handleSubscribe');
const worker=`${handler}\nconst ASSETS=new Map(${JSON.stringify(assets)});\nconst security={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(),microphone=(),geolocation=()','Content-Security-Policy':"default-src 'self';script-src 'self';style-src 'self';img-src 'self' data:;connect-src 'self';object-src 'none';base-uri 'self';frame-ancestors 'self';form-action 'self'"};\nexport default {async fetch(request,env){const url=new URL(request.url);let response;if(url.pathname==='/api/subscribe'){response=await handleSubscribe(request,env);}else{if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const entry=ASSETS.get(url.pathname==='/'?'/index.html':url.pathname);if(!entry)return new Response('Not found',{status:404});const data=Uint8Array.from(atob(entry.body),c=>c.charCodeAt(0));response=new Response(request.method==='HEAD'?null:data,{headers:{'Content-Type':entry.type,'Cache-Control':url.pathname.startsWith('/assets/')?'public,max-age=86400':'no-cache'}});}for(const [key,value]of Object.entries(security))response.headers.set(key,value);return response;}};\n`;
await writeFile(path.join(dist,'server','index.js'),worker);
await mkdir(path.join(dist,'.openai'),{recursive:true});await copyFile(path.join(root,'.openai','hosting.json'),path.join(dist,'.openai','hosting.json'));
await cp(path.join(root,'drizzle'),path.join(dist,'.openai','drizzle'),{recursive:true});
console.log(`Built ${files.length} original-photo assets into a ${Math.round(Buffer.byteLength(worker)/1024)}KB Worker with first-party opt-in.`);
