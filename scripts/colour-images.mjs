import {readFile,writeFile,access} from 'node:fs/promises';
const products=JSON.parse(await readFile(new URL('../data/products.json',import.meta.url),'utf8'));
const primary=JSON.parse(await readFile(new URL('../src/image-manifest.json',import.meta.url),'utf8'));
const manifest={};const missing=[];
for(const p of products){
 manifest[p.id]={};
 for(const colour of p.colours){
  const file=colour===primary[p.id].colour?primary[p.id].src+'.webp':p.id+'-'+colour.replaceAll(' ','-')+'.webp';
  try{await access(new URL('../public/images/'+file,import.meta.url));manifest[p.id][colour]=file;}
  catch{missing.push(p.id+' '+colour);}
 }
}
if(process.argv.includes('--require-all')&&missing.length)throw Error('Missing colour images: '+missing.join(', '));
await writeFile(new URL('../src/colour-manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(`${Object.values(manifest).reduce((s,v)=>s+Object.keys(v).length,0)} colour images available; ${missing.length} remaining.`);
