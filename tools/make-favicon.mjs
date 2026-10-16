import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
// Preserve the supplied monogram's alpha and geometry; only its ink becomes black.
const {data,info}=await sharp(fileURLToPath(new URL('assets/brand-mark.webp',root))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let i=0;i<data.length;i+=info.channels)data[i]=data[i+1]=data[i+2]=0;
for(const size of [32,192])await sharp(data,{raw:{width:info.width,height:info.height,channels:info.channels}}).resize(size,size,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile(fileURLToPath(new URL(`assets/favicon-black-${size}.png`,root)));
const png=await sharp(fileURLToPath(new URL('assets/favicon-black-32.png',root))).toBuffer();
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico[6]=32;ico[7]=32;ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);
await writeFile(new URL('favicon.ico',root),Buffer.concat([ico,png]));
console.log('Black transparent favicons generated from the original brand mark.');
