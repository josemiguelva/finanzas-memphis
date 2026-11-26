// =====================================================================================================
// Memphis · 🔤 OCR EN EL DISPOSITIVO (Tesseract, español + inglés). Lee el texto de fotos y capturas sin enviarlas a
// ningún servidor: el motor (≈13 MB) se descarga una sola vez desde Memphis y queda guardado en el navegador.
// En cualquier editor con imágenes adjuntas aparece «🔤 Leer texto»: el texto se agrega a la nota (y así se puede buscar).
// En un movimiento, además propone el valor total, la fecha y el NIT de la factura.
// =====================================================================================================
"use strict";
const OCR={w:null,cargando:null};
function cargarScript(src){return new Promise((ok,mal)=>{if(window.Tesseract)return ok();const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>mal(new Error("No se pudo cargar el lector de texto (¿sin conexión la primera vez?)"));document.head.appendChild(s)})}
async function motorOCR(){if(OCR.w)return OCR.w;if(OCR.cargando)return OCR.cargando;
  OCR.cargando=(async()=>{status("Preparando el lector de texto (la primera vez descarga ≈13 MB)…");await cargarScript("vendor/tesseract/tesseract.min.js");const base=new URL("vendor/tesseract/",location.href).href;
    const w=await Tesseract.createWorker(["spa","eng"],1,{workerPath:base+"worker.min.js",corePath:base,langPath:base+"lang",workerBlobURL:false,gzip:true,cacheMethod:"write",
      logger:m=>{if(m&&m.status==="recognizing text")status(`Leyendo texto… ${Math.round((m.progress||0)*100)}%`);else if(m&&/loading|initializ/.test(m.status||""))status("Preparando el lector de texto…")}});
    OCR.w=w;status("");return w})();try{return await OCR.cargando}catch(e){OCR.cargando=null;status("");throw e}}
async function leerTextoImagen(blob){const w=await motorOCR();const r=await w.recognize(blob);status("");return String(r.data.text||"").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim()}
// ---------------------------------------------------------------- facturas: total, fecha, NIT
function datosFactura(t){const L=t.split("\n"),num=s=>{s=s.replace(/[$\s]/g,"");if(/,\d{2}$/.test(s)&&/\./.test(s))s=s.replace(/\./g,"").replace(",",".");else if(/\.\d{3}(\D|$)/.test(s)||/,\d{3}(\D|$)/.test(s))s=s.replace(/[.,](?=\d{3}(\D|$))/g,"");else s=s.replace(",",".");const v=parseFloat(s);return isFinite(v)?v:0};
  let total=0;for(const l of L){const m=normK(l).match(/\b(total a pagar|valor total|total factura|total|neto a pagar|vr\.? total)\b[^0-9$]*\$?\s*([\d.,]{3,})/);if(m&&!/sub ?total/.test(normK(l))){const v=num(m[2]);if(v>total)total=v}}
  if(!total){const vs=[...t.matchAll(/\$\s?([\d.,]{4,})/g)].map(m=>num(m[1]));if(vs.length)total=Math.max(...vs)}
  let fecha="";const f=t.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2}|\d{2})\b/)||t.match(/\b(20\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/);
  if(f){let [_,a,b,c]=f;if(a.length===4)fecha=`${a}-${b.padStart(2,"0")}-${c.padStart(2,"0")}`;else{if(c.length===2)c="20"+c;fecha=`${c}-${b.padStart(2,"0")}-${a.padStart(2,"0")}`}if(!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(fecha))fecha=""}
  const nit=(t.match(/\bNIT\.?\s*:?\s*([\d.]{6,15}-?\d?)/i)||[])[1]||"";const comercio=L.map(s=>s.trim()).find(s=>s.length>=3&&/[A-Za-zÁÉÍÓÚÑ]{3}/.test(s)&&!/factura|nit|fecha|ticket|recibo/i.test(s))||"";
  return{total:Math.round(total),fecha,nit,comercio:comercio.slice(0,60)}}
// ---------------------------------------------------------------- botón en los editores con adjuntos
const imgsDlg=()=>(typeof ADJ!=="undefined"?ADJ:[]).filter(a=>a.tipo!=="enlace"&&/^image\//.test(a.mime||""));
function ponerBotonOCR(){const L=$("#adjL");if(!L||!$("#dlg").open||$("#ocrB"))return;const I=imgsDlg();if(!I.length)return;
  const b=document.createElement("button");b.className="b s";b.id="ocrB";b.type="button";b.textContent=`🔤 Leer texto de ${I.length>1?"las "+I.length+" imágenes":"la imagen"}`;b.style.marginTop="6px";L.appendChild(b);
  b.onclick=async()=>{b.disabled=true;const X=$("#bX")||$("#deX")||$("#seX")||$("#etDe");let todo="";
    try{for(const [i,a] of I.entries()){b.textContent=`Leyendo ${i+1} de ${I.length}…`;const by=await bytesAdj(a);const t=await leerTextoImagen(new Blob([by],{type:a.mime}));if(t)todo+=(todo?"\n\n":"")+t}}
    catch(e){alert(e.message);b.disabled=false;b.textContent="🔤 Leer texto";return}finally{status("")}
    b.textContent="🔤 Leer texto";b.disabled=false;if(!todo){aviso("No encontré texto en la imagen");return}
    if($("#eV")&&$("#eN")){const d=datosFactura(todo),cambios=[];if(d.total&&!(+String($("#eV").value).replace(/[^\d]/g,""))){$("#eV").value=d.total;$("#eV").dispatchEvent(new Event("input",{bubbles:true}));cambios.push("valor "+fmt(d.total))}
      if(d.fecha&&$("#eF")&&$("#eF").value!==d.fecha&&confirm(`¿Usar la fecha de la factura (${d.fecha})?`)){$("#eF").value=d.fecha;cambios.push("fecha")}if(d.comercio&&$("#eE")&&!$("#eE").value.trim()){$("#eE").value=d.comercio;cambios.push("establecimiento")}
      if(d.nit&&!$("#eN").value.includes(d.nit))$("#eN").value=($("#eN").value+" NIT "+d.nit).trim();aviso(cambios.length?"🔤 Factura leída: "+cambios.join(", "):"🔤 Texto leído (revisa los datos)");OCR.ultimo=todo;return}
    if(X){insertar(X,(X.value.trim()?"\n\n":"")+"**Texto de la imagen:**\n"+todo);aviso("🔤 Texto agregado a la nota")}else{try{await navigator.clipboard.writeText(todo);aviso("🔤 Texto copiado")}catch(e){prompt("Texto de la imagen:",todo)}}}}
window.addEventListener("load",()=>{
  for(const n of ["pintaAdjD","pintaAdj"]){const f=window[n];if(typeof f==="function")window[n]=function(){const r=f.apply(this,arguments);setTimeout(ponerBotonOCR,0);return r}}
});
