// =====================================================================================================
// Memphis · 🖼 VISTA PREVIA DE ENLACES en la Biblioteca: título, descripción, sitio e imagen de noticias, YouTube,
// blogs, revistas… a través de tu intermediario de Cloudflare (v2). Facebook/Instagram/X a menudo no la dan sin sesión:
// en esos casos queda el título automático. La imagen se guarda como adjunto cifrado.
// =====================================================================================================
"use strict";
const pxListo=()=>!!(S&&S.calext&&S.calext.proxy&&S.calext.clave);
async function pxGet(ruta){const X=S.calext;const r=await fetch(X.proxy+ruta,{headers:{"X-Memphis-Clave":X.clave},cache:"no-store"});if(r.status===404)throw new Error("Tu intermediario es la versión anterior: actualiza el código del Worker (Ajustes › Conexiones).");if(!r.ok)throw new Error((await r.text()).slice(0,140)||"Error "+r.status);return r}
async function traerMeta(url){const j=await (await pxGet("/meta?u="+encodeURIComponent(url))).json();if(j.error)throw new Error(j.error);return j}
async function imagenAdj(url,fecha){const r=await pxGet("/img?u="+encodeURIComponent(url)),b=await r.blob(),ext=(b.type.split("/")[1]||"jpg").replace("jpeg","jpg");return adjDeArchivo(new File([b],"vista_previa."+ext,{type:b.type}),fecha)}
const tituloAuto=x=>{const u=x.url||"";return!x.titulo||x.titulo===u||x.titulo===u.replace(/^https?:\/\/(www\.)?/,"").slice(0,120)||(typeof tituloRed==="function"&&x.titulo===tituloRed(u))};
async function enriquecerEnlace(x,{silencio}={}){if(!x||!x.url||x.doi||!pxListo()||navigator.onLine===false)return false;
  try{const m=await traerMeta(x.url);let cambio=false;const ah=new Date().toISOString();
    if(m.titulo&&tituloAuto(x)){x.titulo=m.titulo.slice(0,400);cambio=true}
    const desc=m.desc&&m.desc!==m.titulo?m.desc:"";if(desc&&!String(x.texto||"").includes(desc.slice(0,60))){x.texto=[x.texto&&x.texto.trim()!==x.url?x.texto.trim():"",`> ${desc}`,`— ${m.sitio||""}${m.autor&&m.autor!==m.sitio?" · "+m.autor:""}`,x.texto&&x.texto.trim()!==x.url?"":x.url].filter(Boolean).join("\n\n");cambio=true}
    if(m.imagen&&!(x.adjuntos||[]).some(a=>/^vista_previa\./.test(a.original||""))){try{const a=await imagenAdj(m.imagen,diaLocal(x.creado));x.adjuntos=[a,...(x.adjuntos||[])];cambio=true}catch(e){}}
    if(m.fecha&&!x.anio&&/^\d{4}/.test(m.fecha)){x.anio=m.fecha.slice(0,4);cambio=true}
    if(cambio){x.editado=ah;changed()}return cambio}
  catch(e){if(!silencio)aviso("Vista previa: "+e.message);return false}}
async function enriquecerVarios(ids){const X=ids.map(id=>(S.biblio||[]).find(b=>b.id===id)).filter(x=>x&&x.url&&!x.doi&&!(typeof verPriv==="function"&&verPriv(x)));if(!X.length){aviso("Ninguno de los seleccionados es un enlace.");return}
  if(!pxListo()){alert("Para traer vistas previas configura tu intermediario de Cloudflare (Ajustes › Conexiones › Calendarios).");return}let n=0;
  for(let i=0;i<X.length;i++){status(`Vista previa ${i+1} de ${X.length}…`);if(await enriquecerEnlace(X[i],{silencio:true}))n++;await new Promise(r=>setTimeout(r,400))}status("");aviso(`🖼 ${n} de ${X.length} enlaces con vista previa`);render()}
window.addEventListener("load",()=>{
  // al capturar un enlace, la vista previa llega sola unos segundos después
  const cb=window.capturarBiblio;if(typeof cb==="function")window.capturarBiblio=async function(){const x=await cb.apply(this,arguments);if(x&&x.url&&!x.doi&&x.tipo==="enlace"&&pxListo())enriquecerEnlace(x,{silencio:true}).then(c=>{if(c&&MOD==="bib"&&!($("#dlg")&&$("#dlg").open))render()});return x};
  // botón en el lector y en la nota abierta
  const lb=window.lectorB;if(typeof lb==="function")window.lectorB=function(x){let h=lb.apply(this,arguments);if(x&&x.url&&!x.doi&&!(typeof verPriv==="function"&&verPriv(x)))h=h.replace('data-bvver=','data-bvpv="'+esc(x.id)+'">🖼 Vista previa</button><button class="b s" data-bvver=');return h};
  const bv=window.bindVistasB;if(typeof bv==="function")window.bindVistasB=function(){const r=bv.apply(this,arguments);document.querySelectorAll("[data-bvpv]").forEach(b=>b.onclick=async()=>{b.disabled=true;b.textContent="Buscando…";const x=S.biblio.find(y=>y.id===b.dataset.bvpv);if(await enriquecerEnlace(x))aviso("🖼 Vista previa lista");render()});
    const bar=document.querySelector(".bvsel");if(bar&&BV.sel.size&&!bar.querySelector("[data-bvpvs]")){const sh=bar.querySelector('[data-bva="sh"]');if(sh)sh.insertAdjacentHTML("beforebegin",'<button class="b s" data-bvpvs="1">🖼 Vista previa</button>');const b=bar.querySelector("[data-bvpvs]");if(b)b.onclick=()=>enriquecerVarios([...BV.sel])}return r};
  const vb=window.verB;if(typeof vb==="function")window.verB=function(id){const r=vb.apply(this,arguments);const x=(S.biblio||[]).find(y=>y.id===id),f=$("#dlgF");if(x&&x.url&&!x.doi&&pxListo()&&f&&$("#dlg").open&&!f.querySelector("[data-pvd]")&&!(typeof verPriv==="function"&&verPriv(x))){const b=document.createElement("button");b.className="b";b.dataset.pvd="1";b.textContent="🖼 Vista previa";b.onclick=async()=>{b.disabled=true;b.textContent="Buscando…";if(await enriquecerEnlace(x)){cerrar();render();verB(x.id)}else{b.disabled=false;b.textContent="🖼 Vista previa"}};f.prepend(b)}return r};
});
