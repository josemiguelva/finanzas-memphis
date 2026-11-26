// =====================================================================================================
// Memphis · 📥 IMPORTAR NOTAS a la Biblioteca: exportación de UpNote (Markdown o HTML, con su carpeta «Files»),
// Notesnook, Obsidian o cualquier carpeta/.zip de .md/.html/.txt. Las libretas pasan a colecciones, las sublibretas a
// etiquetas, las imágenes y archivos se adjuntan (cifrados). Importar dos veces no duplica. Todo ocurre en el dispositivo.
// =====================================================================================================
"use strict";
// ---------------------------------------------------------------- leer .zip (sin librerías: DecompressionStream)
async function leerZip(file){const buf=new Uint8Array(await file.arrayBuffer()),dv=new DataView(buf.buffer,buf.byteOffset,buf.byteLength);let e=buf.length-22;
  while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error("No parece un .zip válido");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=[],u8=new TextDecoder("utf-8",{fatal:true}),lat=new TextDecoder("windows-1252");
  for(let i=0;i<n;i++){if(dv.getUint32(p,true)!==0x02014b50)break;const fl=dv.getUint16(p+8,true),met=dv.getUint16(p+10,true),tm=dv.getUint16(p+12,true),dt=dv.getUint16(p+14,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
    const nb=buf.subarray(p+46,p+46+nl);let name;try{name=u8.decode(nb)}catch(er){name=lat.decode(nb)}p+=46+nl+xl+cl;if(fl&1)continue;if(name.endsWith("/"))continue;
    const fecha=new Date(1980+(dt>>9),((dt>>5)&15)-1,dt&31,tm>>11,(tm>>5)&63).getTime();
    out.push({path:name.replace(/\\/g,"/"),fecha,leer:async()=>{const n2=dv.getUint16(lo+26,true),x2=dv.getUint16(lo+28,true),d=buf.subarray(lo+30+n2+x2,lo+30+n2+x2+csz);if(met===0)return d;
      if(met===8){if(typeof DecompressionStream!=="function")throw new Error("Este navegador no sabe descomprimir .zip; descomprímelo y elige la carpeta.");return new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer())}
      throw new Error("Compresión no soportada en "+name)}})}
  return out}
const entradasDeArchivos=fs=>fs.map(f=>({path:(f.webkitRelativePath||f.name).replace(/\\/g,"/"),fecha:f.lastModified,leer:async()=>new Uint8Array(await f.arrayBuffer())}));
const MIME_EXT={png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",heic:"image/heic",pdf:"application/pdf",mp3:"audio/mpeg",m4a:"audio/mp4",mp4:"video/mp4",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",txt:"text/plain",csv:"text/csv"};
const extDe=p=>(p.match(/\.([a-z0-9]{1,5})$/i)||[])[1]?.toLowerCase()||"";
function normRuta(base,rel){rel=decodeURIComponent(String(rel||"").split(/[?#]/)[0]).replace(/\\/g,"/");if(/^[a-z]+:/i.test(rel))return"";const parts=(rel.startsWith("/")?[]:base.split("/").slice(0,-1));
  for(const s of rel.split("/")){if(!s||s===".")continue;if(s==="..")parts.pop();else parts.push(s)}return parts.join("/")}
// ---------------------------------------------------------------- interpretar una nota
function frontMatter(t){const m=t.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);if(!m)return{meta:{},cuerpo:t};const meta={};let k=null;
  for(const l of m[1].split(/\r?\n/)){const a=l.match(/^([\w ._-]+):\s*(.*)$/);if(a){k=a[1].trim().toLowerCase();const v=a[2].trim().replace(/^["']|["']$/g,"");meta[k]=v.startsWith("[")?v.slice(1,-1).split(",").map(s=>s.trim().replace(/^["']|["']$/g,"")).filter(Boolean):v||[];continue}
    const b=l.match(/^\s*-\s+(.+)$/);if(b&&k){if(!Array.isArray(meta[k]))meta[k]=meta[k]?[meta[k]]:[];meta[k].push(b[1].trim().replace(/^["']|["']$/g,""))}}
  return{meta,cuerpo:t.slice(m[0].length)}}
const fechaImp=v=>{if(!v)return"";const d=new Date(Array.isArray(v)?v[0]:v);return isNaN(d)?"":d.toISOString()};
function cabeceraSuelta(t){const meta={};const L=t.split(/\r?\n/);let i=0;for(;i<Math.min(L.length,8);i++){const a=L[i].match(/^\s*\**\s*(created|creado|fecha de creaci[oó]n|date created|updated|modified|actualizado|notebooks?|libretas?|tags?|etiquetas)\s*\**\s*:\s*(.+)$/i);if(!a)break;meta[normK(a[1])]=a[2].trim()}
  return i?{meta,cuerpo:L.slice(i).join("\n").replace(/^\s+/,"")}:{meta:{},cuerpo:t}}
function notaDe(ent,texto,arch){const html=/\.html?$/i.test(ent.path);let titulo="",cuerpo,meta={},refs=[];
  if(html){let doc;try{doc=new DOMParser().parseFromString(texto,"text/html")}catch(e){return null}titulo=(doc.querySelector("title")||{}).textContent||"";const h1=doc.querySelector("h1");if(!titulo&&h1)titulo=h1.textContent;if(h1&&titulo&&h1.textContent.trim()===titulo.trim())h1.remove();
    for(const m of doc.querySelectorAll("meta[name]"))meta[m.getAttribute("name").toLowerCase()]=m.getAttribute("content")||"";
    for(const im of [...doc.querySelectorAll("img")]){const r=normRuta(ent.path,im.getAttribute("src"));if(r&&arch.has(r)){refs.push(r);im.remove()}else if(/^https?:/.test(im.getAttribute("src")||"")){const p=doc.createElement("p"),a=doc.createElement("a");a.href=im.getAttribute("src");a.textContent="🖼 imagen";p.appendChild(a);im.replaceWith(p)}else im.remove()}
    for(const a of [...doc.querySelectorAll("a[href]")]){const r=normRuta(ent.path,a.getAttribute("href"));if(r&&arch.has(r)){refs.push(r);a.replaceWith(doc.createTextNode("📎 "+(a.textContent.trim()||r.split("/").pop())))}}
    cuerpo=htmlAMd(doc.body.innerHTML)||""}
  else{let r=frontMatter(texto.replace(/\r\n/g,"\n"));if(!Object.keys(r.meta).length)r=cabeceraSuelta(r.cuerpo);meta=r.meta;cuerpo=r.cuerpo;
    cuerpo=cuerpo.replace(/!\[([^\]]*)\]\(<?([^)>]+?)>?(?:\s+"[^"]*")?\)/g,(m,alt,src)=>{const p=normRuta(ent.path,src);if(p&&arch.has(p)){refs.push(p);return""}return/^https?:/.test(src)?`[🖼 ${alt||"imagen"}](${src})`:m})
      .replace(/!\[\[([^\]|]+)(\|[^\]]*)?\]\]/g,(m,src)=>{const p=[...arch.keys()].find(k=>k.endsWith("/"+src)||k===src);if(p){refs.push(p);return""}return m})
      .replace(/(?<!!)\[([^\]]*)\]\(<?([^)>]+?)>?\)/g,(m,tx,src)=>{if(/^https?:|^mailto:/.test(src))return m;const p=normRuta(ent.path,src);if(p&&arch.has(p)){refs.push(p);return"📎 "+(tx||p.split("/").pop())}return tx||m});
    const h=cuerpo.match(/^\s*#\s+(.+)\n/);if(meta.title)titulo=String(meta.title);else if(h){titulo=h[1].trim();cuerpo=cuerpo.slice(h[0].length)}}
  const nombre=ent.path.split("/").pop().replace(/\.[^.]+$/,"");if(!titulo)titulo=nombre.replace(/[_]+/g," ");
  const creado=fechaImp(meta.created||meta.creado||meta["fecha de creacion"]||meta["date created"]||meta.date||meta.created_at)||new Date(ent.fecha||Date.now()).toISOString();
  const editado=fechaImp(meta.updated||meta.modified||meta.actualizado||meta.updated_at)||"";
  const tagsM=[].concat(meta.tags||meta.etiquetas||[]).flatMap(t=>String(t).split(/,\s*/)).map(t=>t.replace(/^#/,"").trim()).filter(Boolean);
  const libM=[].concat(meta.notebooks||meta.notebook||meta.libretas||meta.libreta||[]).flatMap(t=>String(t).split(/,\s*/)).map(s=>s.trim()).filter(Boolean);
  return{titulo:titulo.trim().slice(0,400),texto:cuerpo.replace(/\n{3,}/g,"\n\n").trim(),creado,editado,tags:tagsM,libretas:libM,refs:[...new Set(refs)]}}
// ---------------------------------------------------------------- el asistente
const IMP={};
function importarNotasB(){dlg("📥 Importar notas a la Biblioteca",`<p class="small">Trae tus notas de <b>UpNote</b> (y también Notesnook, Obsidian, Evernote→Markdown o cualquier carpeta de notas). Se hace aquí mismo, en tu dispositivo, y los adjuntos quedan cifrados.</p>
  <details class="card small"><summary><b>Cómo exportar desde UpNote</b></summary><ol><li>En el PC abre UpNote → <b>Configuración → General → Exportar todas las notas</b> (en Mac: Archivo → Exportar todas las notas).</li><li>Elige <b>Markdown</b> (recomendado) o HTML. Se crea una carpeta con tus libretas y la carpeta <i>Files</i> con imágenes y adjuntos.</li><li>Aquí, toca <b>📁 Elegir la carpeta</b>. En el celular, comprime esa carpeta en .zip y usa <b>🗜 Elegir .zip</b>.</li></ol></details>
  <div class="filters"><button class="b p" id="imDir">📁 Elegir la carpeta</button><button class="b" id="imZip">🗜 Elegir .zip</button><button class="b" id="imArch">📄 Archivos .md / .html</button></div><div id="imRes"></div>`,[["Cerrar","",cerrar]]);
  const elegir=(op)=>{const i=document.createElement("input");i.type="file";i.multiple=true;if(op==="dir"){i.webkitdirectory=true}else if(op==="zip")i.accept=".zip,application/zip";else i.accept=".md,.markdown,.txt,.html,.htm";i.onchange=()=>analizar([...i.files]).catch(e=>alert(e.message));i.click()};
  $("#imDir").onclick=()=>elegir("dir");$("#imZip").onclick=()=>elegir("zip");$("#imArch").onclick=()=>elegir("arch")}
async function analizar(fs){if(!fs.length)return;$("#imRes").innerHTML='<p class="small muted">Leyendo…</p>';let ents=[];
  for(const f of fs){if(/\.zip$/i.test(f.name)||f.type==="application/zip")ents.push(...await leerZip(f));else ents.push(...entradasDeArchivos([f]))}
  ents=ents.filter(e=>!/(^|\/)(\.|__MACOSX\/)/.test(e.path));const notas=ents.filter(e=>/\.(md|markdown|txt|html?)$/i.test(e.path)&&!/(^|\/)index\.html?$/i.test(e.path)),arch=new Map(ents.filter(e=>!notas.includes(e)).map(e=>[e.path,e]));
  if(!notas.length){$("#imRes").innerHTML='<p class="neg small">No encontré notas (.md, .html o .txt) ahí.</p>';return}
  // raíz común (la carpeta de exportación) y libretas
  const partes=notas.map(n=>n.path.split("/").slice(0,-1));let raiz=0;if(notas.length>1||partes[0].length)while(partes.every(p=>p.length>raiz&&p[raiz]===partes[0][raiz]))raiz++;
  const libDe=n=>n.path.split("/").slice(raiz,-1).filter(s=>!/^files?$/i.test(s));const L=new Map();for(const n of notas){const k=libDe(n)[0]||"(sin libreta)";L.set(k,(L.get(k)||0)+1)}
  Object.assign(IMP,{notas,arch,libDe});
  $("#imRes").innerHTML=`<div class="card"><p><b>${notas.length}</b> notas · <b>${arch.size}</b> archivos adjuntos · <b>${L.size}</b> libreta${L.size>1?"s":""}</p>
    <div class="small" style="max-height:160px;overflow:auto">${[...L.entries()].sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<div>📂 ${esc(k)} <span class="muted">${n}</span></div>`).join("")}</div>
    <label class="small"><input type="checkbox" id="imCol" checked> Las libretas pasan a ser <b>colecciones</b> (las sublibretas, etiquetas)</label>
    <label class="small"><input type="checkbox" id="imEtq" checked> Agregar la etiqueta <b>#upnote</b> para encontrarlas juntas</label>
    <label class="small"><input type="checkbox" id="imAdj" checked> Traer imágenes y archivos adjuntos (${arch.size})</label>
    <label class="small"><input type="checkbox" id="imPor"> Dejarlas «por leer»</label>
    <div class="filters" style="margin-top:8px"><button class="b p" id="imGo">Importar ${notas.length} notas</button></div><div id="imPr" class="small"></div></div>`;
  $("#imGo").onclick=()=>importarYa().catch(e=>{status("");alert("Se detuvo: "+e.message)})}
async function importarYa(){const {notas,arch,libDe}=IMP,col=$("#imCol").checked,etq=$("#imEtq").checked,conAdj=$("#imAdj").checked,por=$("#imPor").checked;$("#imGo").disabled=true;
  const ya=new Set((S.biblio||[]).map(x=>claveF(x.titulo)+"|"+normK(String(x.texto||"").slice(0,160)))),nuevos=[],cacheAdj=new Map();let dup=0,errA=0;const t0=Date.now();
  for(let i=0;i<notas.length;i++){const ent=notas[i];if(i%10===0){$("#imPr").textContent=`Importando ${i+1} de ${notas.length}…`;await new Promise(r=>setTimeout(r,0))}
    let txt;try{txt=new TextDecoder("utf-8").decode(await ent.leer())}catch(e){continue}const n=notaDe(ent,txt,arch);if(!n||(!n.titulo&&!n.texto))continue;
    const clave=claveF(n.titulo)+"|"+normK(n.texto.slice(0,160));if(ya.has(clave)){dup++;continue}ya.add(clave);
    const libs=n.libretas.length?n.libretas[0].split("/").map(s=>s.trim()).filter(Boolean):libDe(ent),adj=[];
    if(conAdj)for(const r of n.refs){try{if(!cacheAdj.has(r)){const e=arch.get(r),b=await e.leer(),nom=r.split("/").pop();cacheAdj.set(r,await adjDeArchivo(new File([b],nom,{type:MIME_EXT[extDe(nom)]||"application/octet-stream"}),n.creado.slice(0,10)))}adj.push(cacheAdj.get(r))}catch(e){errA++}}
    const url=(n.texto.match(/https?:\/\/\S+/)||[])[0]||"",doi=normDOI(n.texto),tipo=doi?"referencia":url&&n.texto.replace(url,"").trim().length<40?"enlace":"nota";
    const etqs=[...new Set([...n.tags,...(col?libs.slice(1):libs),...(etq?["upnote"]:[])])].slice(0,30);
    nuevos.push({id:uid(),tipo,titulo:n.titulo||n.texto.split("\n")[0].slice(0,120)||"(sin título)",texto:n.texto,url:url.replace(/[)\].,]+$/,""),doi,autores:[],anio:"",revista:"",vol:"",num:"",pags:"",editorial:"",etiquetas:etqs,coleccion:col&&libs[0]?libs[0].slice(0,120):"",estado:por?"por leer":"",vence:"",fijado:false,adjuntos:adj,creado:n.creado,editado:n.editado&&n.editado>n.creado?n.editado:"",versiones:[]})}
  (S.biblio=S.biblio||[]).push(...nuevos);if(etq)asegurarFichas("#[upnote]");changed();
  $("#imPr").innerHTML=`✅ <b>${nuevos.length}</b> notas importadas${dup?` · ${dup} ya estaban (no se duplicaron)`:""}${cacheAdj.size?` · ${cacheAdj.size} adjuntos`:""}${errA?` · <span class="neg">${errA} adjuntos no se pudieron leer</span>`:""} · ${Math.round((Date.now()-t0)/1000)} s`;
  const ids=new Set(nuevos.map(x=>x.id));deshacer(`📥 ${nuevos.length} notas importadas`,()=>{S.biblio=S.biblio.filter(x=>!ids.has(x.id));changed();render()});
  if(nuevos.length){setTimeout(()=>{cerrar();TB.vista="todo";TB.etq=etq?"upnote":"";TB.col="";if(MOD!=="bib")irModulo("bib");else render()},1600)}}
// ---------------------------------------------------------------- enganches
window.addEventListener("load",()=>{
  const vb=window.vBiblio;if(typeof vb==="function")window.vBiblio=function(){const r=vb.apply(this,arguments);const f=document.querySelector("#view .bvbar");if(f&&!$("#bImp")){const b=document.createElement("button");b.className="b s";b.id="bImp";b.textContent="📥 Importar";b.title="Importar notas de UpNote, Notesnook, Obsidian o Markdown";b.onclick=importarNotasB;const e=$("#bExp");if(e)e.before(b);else f.append(b)}return r};
});
