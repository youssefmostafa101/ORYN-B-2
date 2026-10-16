import http from 'node:http';
import worker from '../dist/server/index.js';
import {localDatabase} from './local-db.mjs';
const DB=await localDatabase(),port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
  try{
    let body;
    if(!['GET','HEAD'].includes(req.method)){const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>4096){res.writeHead(413);res.end();return;}chunks.push(chunk);}body=Buffer.concat(chunks);}
    const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers:req.headers,...(body?{body}:{})});
    const response=await worker.fetch(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Preview unavailable');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port} (temporary in-memory test signup database)`));
