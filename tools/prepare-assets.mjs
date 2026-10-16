import sharp from 'sharp';
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'assets');
await mkdir(path.join(assets, 'fonts'), { recursive: true });
for (const [name, family] of [['manrope', 'Manrope:wght@200..800'], ['space-grotesk', 'Space+Grotesk:wght@300..700']]) {
  const target = path.join(assets, 'fonts', name + '.woff2');
  try { await readFile(target); } catch {
    const response = await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' } });
    if (!response.ok) throw new Error('Font stylesheet download failed');
    const css = await response.text();
    const url = [...css.matchAll(/url\((https:[^)]+)\)/g)].at(-1)?.[1];
    if (!url) throw new Error('Font URL missing');
    const font = await fetch(url); if (!font.ok) throw new Error('Font download failed');
    await writeFile(target, Buffer.from(await font.arrayBuffer()));
  }
}
for (const size of [960,1600]) await sharp(path.join(assets,'hero-environment.png')).resize(size).webp({quality:84}).toFile(path.join(assets,`hero-environment-${size}.webp`));
for (const size of [640,1100]) await sharp(path.join(assets,'product-duo.png')).trim({threshold:10,alpha:true}).resize(size).webp({quality:91,alphaQuality:100}).toFile(path.join(assets,`product-duo-${size}.webp`));
// Remove only the black side bars from supplied mockups. Photography and labels are retained.
for (const kind of ['output','deep']) for(let i=1;i<=5;i++) {
  const file=path.join(assets,`${kind}-${i}.jpg`), meta=await sharp(file).metadata();
  const width=meta.height, left=Math.floor((meta.width-width)/2);
  for(const size of [160,380,760]) await sharp(file).extract({left,top:0,width,height:meta.height}).resize(size,size).webp({quality:size===160?76:89}).toFile(path.join(assets,`${kind}-${i}-${size}.webp`));
}
await sharp(path.join(assets,'monogram.png')).trim().resize(144).webp({lossless:true}).toFile(path.join(assets,'brand-mark.webp'));
// Extract the photographed label ink directly for the 3D curved label surface.
// This does not regenerate words, substitute a font, or invent any label content.
const crops={output:{left:270,top:220,width:230,height:278},deep:{left:283,top:274,width:207,height:227}};
for(const [kind,rect] of Object.entries(crops)){
  const {data,info}=await sharp(path.join(assets,`${kind}-1.jpg`)).extract(rect).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<data.length;i+=4){const lum=(data[i]+data[i+1]+data[i+2])/3;data[i+3]=Math.round(Math.min(1,Math.max(0,(170-lum)/95))*255);data[i]=20;data[i+1]=39;data[i+2]=28;}
  await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(path.join(assets,`${kind}-label.png`));
}
console.log('Prepared responsive WebP imagery, original label textures and local fonts.');
