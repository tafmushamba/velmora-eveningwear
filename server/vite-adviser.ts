import { loadEnv, type Plugin, type Connect } from 'vite';
import { handleAdvice, limits } from './adviser.ts';
export function adviserPlugin():Plugin {
 let env:Record<string,string>={};
 const counts=new Map<string,{start:number;count:number}>();
 const middleware:Connect.NextHandleFunction=async(req,res,next)=>{
  if(req.url?.split('?')[0]!=='/api/adviser')return next();
  const now=Date.now();for(const [key,value] of counts)if(now-value.start>60000)counts.delete(key);
  const key=req.socket.remoteAddress??'local',bucket=counts.get(key)??{start:now,count:0};counts.set(key,bucket);
  if(++bucket.count>limits.requestsPerMinute){res.writeHead(429,{'Content-Type':'application/json','Retry-After':'60'});res.end(JSON.stringify({error:'Please wait a minute before sending another message.'}));return;}
  try{
   const chunks:Buffer[]=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>limits.bodyBytes){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Please shorten your message.'}));return;}chunks.push(Buffer.from(chunk));}
   const headers=new Headers();for(const [name,value] of Object.entries(req.headers))if(value)headers.set(name,Array.isArray(value)?value.join(','):value);
   const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
   const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers,...(req.method==='GET'||req.method==='HEAD'?{}:{body:Buffer.concat(chunks)}),signal:controller.signal});
   const response=await handleAdvice(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
  }catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'The AI adviser is unavailable. Please use the collection filters.'}));}
 };
 return {name:'velmora-adviser',configResolved(config){env={...loadEnv(config.mode,config.root,'OPENAI_'),...Object.fromEntries(Object.entries(process.env).filter(([k,v])=>k.startsWith('OPENAI_')&&v!==undefined))} as Record<string,string>;},configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}};
}
