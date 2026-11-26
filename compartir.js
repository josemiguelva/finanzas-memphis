// =====================================================================================================
// Memphis · COMPARTIR. Exporta registros (salud y diario) SIN cifrar para mandarlos a alguien: HTML (con fotos),
// Markdown o texto. En el celular usa el menú «Compartir» del teléfono (WhatsApp, Telegram, correo…).
// No es un respaldo: solo lo que elijas, y avisa que el archivo queda sin protección.
// =====================================================================================================
"use strict";
// items: [{k:"s",r}] o [{k:"d",e}]
function exportarItems(items,titulo){items=(items||[]).filter(Boolean);if(!items.length){alert("No hay nada para exportar.");return}
  const fechas=items.map(fechaItem).sort(),d0=fechas[0],d1=fechas[fechas.length-1];const nAdj=items.reduce((a,x)=>a+((x.r||x.e||x.b).adjuntos||[]).filter(esImg).length,0);
  dlg("📤 Compartir / exportar",`<p><b>${esc(titulo)}</b> · ${items.length} registro${items.length>1?"s":""}</p>
    <div class="filters"><label class="small">Desde <input type="date" id="xD0" value="${d0}"></label><label class="small">hasta <input type="date" id="xD1" value="${d1}"></label><select id="xOrd"><option value="asc">Del más antiguo al más reciente</option><option value="desc">Más recientes primero</option></select></div>
    <div class="seg wrap" id="xFmt"><button data-xf="html" class="on">🌐 Página (HTML)</button><button data-xf="md">📝 Markdown</button><button data-xf="txt">💬 Texto para chat</button></div>
    <label class="small" id="xFotL"><input type="checkbox" id="xFot" ${nAdj&&nAdj<=40?"checked":""}> Incluir fotos dentro de la página (${nAdj})</label>
    <label class="small"><input type="checkbox" id="xNot" checked> Incluir notas y evolución</label>
    <p class="small neg">⚠️ Lo exportado queda <b>sin cifrar</b>: quien reciba el archivo puede leerlo y reenviarlo. No es un respaldo.</p>
    <p class="small muted" id="xInfo">La página se abre en cualquier navegador y se puede imprimir o guardar como PDF.</p>`,
   [["Cancelar","",cerrar],["📋 Copiar","",()=>hacerExport(items,titulo,"copiar")],["⬇️ Descargar","",()=>hacerExport(items,titulo,"bajar")],...(navigator.share?[["📤 Compartir","p",()=>hacerExport(items,titulo,"compartir")]]:[])]);
  let fmt="html";document.querySelectorAll("[data-xf]").forEach(b=>b.onclick=()=>{fmt=b.dataset.xf;document.querySelectorAll("[data-xf]").forEach(x=>x.classList.toggle("on",x===b));$("#xFotL").hidden=fmt!=="html";
    $("#xInfo").textContent=fmt==="html"?"La página se abre en cualquier navegador y se puede imprimir o guardar como PDF.":fmt==="md"?"Markdown: texto con formato, útil para Notion, Obsidian o tu editor.":"Texto simple, listo para pegar o enviar en un chat."});
  hacerExport.fmt=()=>fmt}
const fechaItem=x=>x.k==="s"?x.r.fecha:x.k==="b"?diaLocal(x.b.creado):x.e.fecha;
async function hacerExport(items,titulo,accion){const fmt=hacerExport.fmt(),d0=$("#xD0").value||"0000",d1=$("#xD1").value||"9999",desc=$("#xOrd").value==="desc",fotos=fmt==="html"&&$("#xFot").checked,notas=$("#xNot").checked;
  const L=items.filter(x=>{const f=fechaItem(x);return f>=d0&&f<=d1}).sort((a,b)=>{const c=(fechaItem(a)+((a.r||a.e||a.b).hora||"")).localeCompare(fechaItem(b)+((b.r||b.e||b.b).hora||""));return desc?-c:c});
  if(!L.length){alert("No hay registros en ese rango de fechas.");return}
  const sub=`${L.length} registro${L.length>1?"s":""} · ${fechaItem(L[desc?L.length-1:0])} a ${fechaItem(L[desc?0:L.length-1])} · exportado ${hoyISO()} desde Memphis`;
  status("Preparando…");let cont,tipo,ext;
  try{if(fmt==="html"){cont=await htmlExport(L,titulo,sub,{fotos,notas});tipo="text/html";ext="html"}else if(fmt==="md"){cont=mdExport(L,titulo,sub,{notas});tipo="text/markdown";ext="md"}else{cont=txtExport(L,titulo,sub,{notas});tipo="text/plain";ext="txt"}}
  catch(e){alert("No se pudo preparar: "+e.message);return}finally{status("")}
  const nombre=`${slug(titulo).slice(0,60)}_${hoyISO()}.${ext}`;
  if(accion==="copiar"){try{await navigator.clipboard.writeText(fmt==="html"?txtExport(L,titulo,sub,{notas}):cont);aviso("Copiado: pégalo donde quieras")}catch(e){alert("El navegador no dejó copiar; usa Descargar.")}return}
  if(accion==="compartir"){try{if(fmt==="txt"){await navigator.share({title:titulo,text:cont})}else{const f=new File([cont],nombre,{type:tipo});if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({title:titulo,files:[f]});else{await navigator.share({title:titulo,text:txtExport(L,titulo,sub,{notas})})}}cerrar();return}
    catch(e){if(e&&e.name==="AbortError")return;alert("No se pudo abrir el menú de compartir; se descargará el archivo.")}}
  descargar(new Blob([cont],{type:tipo+";charset=utf-8"}),nombre);aviso("Descargado: "+nombre)}
function lineasItem(x,{notas}){const o=[];
  if(x.k==="s"){const r=x.r;o.push({h:`${r.fecha}${r.hora?" "+r.hora:""}${r.fechaFin&&r.fechaFin!==r.fecha?" → "+r.fechaFin:""} · ${sIco(r.tipo)} ${r.titulo||sNom(r.tipo)}`});
    const kv=[["Tipo",sNom(r.tipo)],["Persona(s)",r.personas.map(nomPer).join(", ")],["Síntomas",r.sintomas.join(", ")],["Especialidad",r.esp],["Médico/a",r.medico],["Lugar",r.lugar&&(typeof dirLugar==="function"?dirLugar(r.lugar):r.lugar)],["Estado",r.estado],
      ["Medidas",[r.medidas.temp&&"temperatura "+r.medidas.temp+" °C",r.medidas.peso&&r.medidas.peso+" kg",r.medidas.talla&&r.medidas.talla+" cm",r.medidas.pa&&"presión "+r.medidas.pa,r.medidas.fc&&r.medidas.fc+" lpm"].filter(Boolean).join(", ")],
      ["Medicamentos",(r.meds||[]).map(m=>`${m.n}${m.dosis?" "+m.dosis:""}${m.cadaH?" cada "+m.cadaH+" h":""}${m.dias?" por "+m.dias+" días":""}${m.desde?" desde "+m.desde:""}${m.nota?" ("+m.nota+")":""}`).join("; ")],
      ["Vacunas",(r.vacunas||[]).map(v=>`${v.p?v.p+": ":""}${v.v}${v.dosis?" ("+v.dosis+")":""}${v.refuerzo?", refuerzo "+v.refuerzo:""}`).join("; ")],
      ["Incapacidad",r.inc?`desde ${r.inc.desde}${r.inc.dias?" por "+r.inc.dias+" días":""}`:""]];
    for(const [k,v] of kv)if(v)o.push({k,v});if(notas&&r.texto)o.push({t:r.texto});
    const ad=(r.adjuntos||[]).filter(a=>a.tipo!=="enlace").map(a=>a.original||a.nombre),fu=(r.fuentes||[]).flatMap(f=>f.archivos);if(ad.length||fu.length)o.push({k:"Archivos",v:[...ad,...fu].join(", ")});
    if((r.enlaces||[]).length)o.push({k:"Enlaces",v:r.enlaces.map(l=>l.url).join(" ")})}
  else if(x.k==="b"){const b=x.b;o.push({h:`${bIco(b.tipo)} ${b.titulo}`});const kv=[["Tipo",bTipoNom(b.tipo)],["Autores",b.autores.join("; ")],["Publicación",[b.revista||b.editorial,b.anio,b.vol&&"vol. "+b.vol,b.num&&"("+b.num+")",b.pags].filter(Boolean).join(" ")],["DOI",b.doi],["Enlace",!b.doi&&b.url],["Etiquetas",etiquetasDe(b).map(e=>"#"+e).join(" ")],["Colección",b.coleccion],["Vence",b.vence]];for(const [k,v] of kv)if(v)o.push({k,v});if(b.doi||b.autores.length)o.push({k:"Cita (APA)",v:refAPA(b)});if(notas&&b.texto)o.push({t:b.texto});const ad=(b.adjuntos||[]).filter(a=>a.tipo!=="enlace").map(a=>a.original||a.nombre);if(ad.length)o.push({k:"Archivos",v:ad.join(", ")})}
  else{const e=x.e;o.push({h:`${e.fecha}${e.hora?" "+e.hora:""}${e.fechaFin?" → "+e.fechaFin:""} · ${e.tipo==="evento"?"📅":"📓"} ${e.titulo||"Nota"}`});if(e.lugar)o.push({k:"Lugar",v:typeof dirLugar==="function"?dirLugar(e.lugar):e.lugar});
    const F=fichasDeEntrada(e).filter(f=>f.tipo==="persona");if(F.length)o.push({k:"Con",v:F.map(f=>f.nombre).join(", ")});if(notas&&e.texto)o.push({t:e.texto});
    const ad=(e.adjuntos||[]).filter(a=>a.tipo!=="enlace").map(a=>a.original||a.nombre);if(ad.length)o.push({k:"Archivos",v:ad.join(", ")});if((e.enlaces||[]).length)o.push({k:"Enlaces",v:e.enlaces.map(l=>l.url).join(" ")})}
  return o}
// las menciones @[Nombre] se dejan como «Nombre» al exportar
const limpiaMen=t=>String(t||"").replace(/([@#])\[([^\]\n]{1,80})\]/g,"$2").replace(/(^|[\s(])@([\wÁÉÍÓÚÑáéíóúñü.-]+)/g,(_,p,n)=>p+nomPer(n));
function mdExport(L,titulo,sub,op){let s=`# ${titulo}\n\n_${sub}_\n`;for(const x of L){for(const l of lineasItem(x,op)){if(l.h)s+=`\n## ${l.h}\n\n`;else if(l.k)s+=`- **${l.k}:** ${l.v}\n`;else if(l.t)s+=`\n${limpiaMen(l.t)}\n`}}return s}
function txtExport(L,titulo,sub,op){let s=`${titulo}\n${sub}\n`;for(const x of L){for(const l of lineasItem(x,op)){if(l.h)s+=`\n▪ ${l.h}\n`;else if(l.k)s+=`  ${l.k}: ${l.v}\n`;else if(l.t)s+=limpiaMen(l.t).replace(/\*\*|==|~~|`/g,"").replace(/^- \[x\] /gim,"✔ ").replace(/^- \[ \] /gm,"☐ ").split("\n").map(z=>"  "+z).join("\n")+"\n"}}return s}
async function htmlExport(L,titulo,sub,op){let cuerpo="";
  for(const x of L){const reg=x.r||x.e||x.b;let h="";for(const l of lineasItem(x,op)){if(l.h)h+=`<h2>${esc(l.h)}</h2>`;else if(l.k)h+=`<div class="kv"><b>${esc(l.k)}:</b> ${esc(l.v)}</div>`;else if(l.t)h+=`<div class="tx">${md(limpiaMen(l.t)).replace(/ data-[a-z-]+="[^"]*"/g,"").replace(/<a href="#"[^>]*>([\s\S]*?)<\/a>/g,"$1")}</div>`}
    if(op.fotos)for(const a of (reg.adjuntos||[]).filter(esImg)){try{const b=await bytesAdj(a);let bin="";for(let i=0;i<b.length;i+=32768)bin+=String.fromCharCode.apply(null,b.subarray(i,i+32768));h+=`<figure><img src="data:${esc(a.mime||"image/jpeg")};base64,${btoa(bin)}" alt=""><figcaption>${esc(a.original||a.nombre)}</figcaption></figure>`}catch(e){h+=`<p class="sub">(No se pudo incluir la foto ${esc(a.original||a.nombre)}: ${esc(e.message)})</p>`}}
    cuerpo+=`<section>${h}</section>`}
  return`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title>
<style>body{font:15px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:820px;margin:24px auto;padding:0 16px;color:#1d2330}h1{font-size:22px;margin:0}.sub{color:#667;font-size:13px}section{border:1px solid #dde3ea;border-radius:10px;padding:10px 14px;margin:12px 0;break-inside:avoid}h2{font-size:16px;margin:4px 0 8px}.kv{font-size:14px;margin:2px 0}.tx{margin-top:8px;border-top:1px dashed #dde3ea;padding-top:6px}img{max-width:100%;border-radius:8px}figure{margin:8px 0}figcaption{font-size:12px;color:#667}mark{background:#fff3b0}ul.tareas{list-style:none;padding-left:4px}@media print{body{margin:0}section{border-color:#bbb}}</style></head>
<body><h1>${esc(titulo)}</h1><p class="sub">${esc(sub)}</p>${cuerpo}</body></html>`}
