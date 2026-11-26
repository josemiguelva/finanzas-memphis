// =====================================================================================================
// Memphis · ARRASTRAR Y SOLTAR archivos en cualquier parte + PEGAR CON FORMATO (texto, listas, negritas e imágenes).
// Soltar sobre un diálogo con adjuntos → se adjuntan; sobre un selector de archivo → lo llena; en cada sección crea
// lo que corresponde (Biblioteca: nueva nota; Diario: nueva nota; Salud: nuevo registro; Finanzas: extracto o factura;
// Inicio: a la 📥 Bandeja). Un enlace soltado en la Biblioteca se guarda como enlace/artículo.
// =====================================================================================================
"use strict";
let ARR=0;
const tipos=ev=>[...((ev.dataTransfer&&ev.dataTransfer.types)||[])];
const traeArch=ev=>tipos(ev).includes("Files"),traeLink=ev=>!traeArch(ev)&&tipos(ev).includes("text/uri-list")&&typeof MOD!=="undefined"&&MOD==="bib";
function ponerEnInput(inp,fs){const dt=new DataTransfer();(inp.multiple?fs:fs.slice(0,1)).forEach(f=>dt.items.add(f));inp.files=dt.files;inp.dispatchEvent(new Event("change",{bubbles:true}));inp.dispatchEvent(new Event("input",{bubbles:true}))}
const visible=el=>!!(el&&(el.offsetParent||el.getClientRects().length)&&!el.closest("[hidden]"));
async function soltarArchivos(fs,target){if(!fs.length)return;
  if(!S){const w=$("#wJson");if(w&&visible(w))aviso("Para abrir tus datos usa el botón; por seguridad no se abren soltando el archivo.");return}
  const dl=$("#dlg");
  if(dl&&dl.open){const ins=[...dl.querySelectorAll('input[type="file"]')],cerca=target&&target.closest&&target.closest(".filters,.card,label,div");const inp=(cerca&&cerca.querySelector('input[type="file"]'))||ins.find(visible)||ins[0];
    if(inp){ponerEnInput(inp,fs);return}
    if(dl.querySelector("#adjL")){await adjuntarArchivos(fs);aviso(`📎 ${fs.length} archivo${fs.length>1?"s":""} adjunto${fs.length>1?"s":""}`);return}
    aviso("En esta ventana no se pueden adjuntar archivos.");return}
  const v=$("#view"),zona=target&&target.closest?target.closest(".card"):null,inpV=(zona&&zona.querySelector('input[type="file"]'))||[...v.querySelectorAll('input[type="file"]')].find(visible);
  if(inpV){ponerEnInput(inpV,fs);return}
  const nombre=fs.length===1?fs[0].name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").slice(0,120):"",img=fs.every(f=>/^image\//.test(f.type)),pdf=fs.some(f=>/pdf/.test(f.type));
  const luego=()=>setTimeout(async()=>{await adjuntarArchivos(fs);aviso(`📎 ${fs.length} archivo${fs.length>1?"s":""} adjunto${fs.length>1?"s":""}`)},60);
  if(MOD==="bib"&&typeof importarNotasB==="function"&&fs.every(f=>/\.(zip|md|markdown|html?)$/i.test(f.name))){importarNotasB();analizar(fs).catch(e=>alert(e.message));return}
  if(MOD==="bib"){editarB(null,{tipo:pdf?"pdf":"nota",titulo:nombre});luego();return}
  if(MOD==="dia"){editarD(null,{fecha:TD.fecha||hoyISO(),tipo:"nota"});luego();return}
  if(MOD==="sal"&&typeof editarS==="function"){editarS(null,{tipo:"nota"});luego();return}
  if(MOD==="fin"){const f=fs[0];if(/\.(csv|txt|xlsx|xls|ods|tsv)$/i.test(f.name)){ponerEnInput($("#fileIn"),[f]);return}if(img||pdf){editar(null);luego();return}}
  if(MOD==="proy"&&typeof PR!=="undefined"&&!PR.id){aviso("Abre un proyecto para adjuntarle archivos.");return}
  if(typeof aBandeja==="function"){await aBandeja({de:"manual",texto:nombre,files:fs});aviso(`📥 ${fs.length} archivo${fs.length>1?"s":""} a la Bandeja`);render();return}}
// ---------------------------------------------------------------- pegar con formato
const PEGA_IDS=["bX","deX","seX"];
function htmlConImagenes(html){let doc;try{doc=new DOMParser().parseFromString(html,"text/html")}catch(e){return null}const files=[],remotas=[];let k=0;
  for(const im of [...doc.querySelectorAll("img")]){const src=im.getAttribute("src")||"",w=+im.getAttribute("width")||0,h=+im.getAttribute("height")||0;if((w&&w<40)||(h&&h<40)){im.remove();continue}
    if(/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(src)){try{const [cab,b64]=src.split(","),mime=cab.slice(5).split(";")[0],bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
        files.push(new File([u],`pegada_${fISO(new Date())}_${++k}.${mime.split("/")[1].replace("jpeg","jpg")}`,{type:mime}))}catch(e){}im.remove();continue}
    if(/^https?:\/\//i.test(src)){remotas.push(src);const p=doc.createElement("p"),a=doc.createElement("a");a.href=src;a.textContent="🖼 imagen";p.appendChild(a);im.replaceWith(p);continue}im.remove()}
  return{md:htmlAMd(doc.body.innerHTML),files,remotas}}
document.addEventListener("paste",async ev=>{const X=ev.target;if(!X||X.tagName!=="TEXTAREA"||!PEGA_IDS.includes(X.id)||PEGA!=="rico")return;const cd=ev.clipboardData;if(!cd)return;const h=cd.getData("text/html");if(!h)return;
  const r=htmlConImagenes(h);if(!r||r.md==null)return;const plano=(cd.getData("text/plain")||"").replace(/\s+/g," ").trim(),fs=[...[...(cd.files||[])].filter(f=>/^image\//.test(f.type)),...r.files];
  if(!fs.length&&!r.remotas.length&&r.md.replace(/\s+/g," ").trim()===plano)return; // nada que ganar: que siga el pegado normal
  ev.preventDefault();ev.stopImmediatePropagation();insertar(X,r.md);
  if(fs.length&&document.querySelector("#dlg #adjL"))await adjuntarArchivos(fs);
  aviso(`Pegado con formato${fs.length?` · 🖼 ${fs.length} imagen${fs.length>1?"es":""} adjunta${fs.length>1?"s":""}`:""}${r.remotas.length?` · ${r.remotas.length} imagen${r.remotas.length>1?"es":""} de internet como enlace`:""}`)},true);
function botonPega(ancla){const a=$(ancla);if(!a||$("#bPega"))return;const b=document.createElement("button");b.className="b s";b.id="bPega";b.title="Cómo se pega el texto copiado";const pinta=()=>b.textContent=PEGA==="rico"?"Pegar: con formato":"Pegar: texto plano";pinta();
  b.onclick=()=>{PEGA=PEGA==="rico"?"plano":"rico";try{localStorage.setItem("memphisPega",PEGA)}catch(e){}pinta()};a.before(b)}
// ---------------------------------------------------------------- enganches
window.addEventListener("load",()=>{
  try{const p=localStorage.getItem("memphisPega");PEGA=p==="plano"?"plano":"rico"}catch(e){PEGA="rico"}
  const dp=$("#dePega");document.addEventListener("click",ev=>{if(ev.target&&ev.target.id==="dePega")setTimeout(()=>{try{localStorage.setItem("memphisPega",PEGA)}catch(e){}},0)},true);
  const eb=window.editarB;if(typeof eb==="function")window.editarB=function(){const r=eb.apply(this,arguments);botonPega("#bPrev");return r};
  const ed=window.editarD;if(typeof ed==="function")window.editarD=function(){const r=ed.apply(this,arguments);const b=$("#dePega");if(b)b.textContent=PEGA==="rico"?"Pegar: con formato":"Pegar: texto plano";return r};
  document.addEventListener("dragenter",ev=>{if(!traeArch(ev)&&!traeLink(ev))return;ev.preventDefault();ARR++;document.body.classList.add("soltando");const d=$("#dlg");if(d&&d.open)d.classList.add("soltando")});
  document.addEventListener("dragover",ev=>{if(!traeArch(ev)&&!traeLink(ev))return;ev.preventDefault();ev.dataTransfer.dropEffect="copy"});
  const fin=()=>{ARR=0;document.body.classList.remove("soltando");const d=$("#dlg");if(d)d.classList.remove("soltando")};
  document.addEventListener("dragleave",ev=>{if(!traeArch(ev)&&!traeLink(ev))return;if(--ARR<=0)fin()});
  document.addEventListener("drop",async ev=>{const a=traeArch(ev),l=traeLink(ev);if(!a&&!l)return;ev.preventDefault();fin();
    if(a){await soltarArchivos([...ev.dataTransfer.files],ev.target);return}
    const u=(ev.dataTransfer.getData("text/uri-list")||"").split("\n").find(s=>/^https?:\/\//.test(s.trim()));if(u&&S&&!($("#dlg")&&$("#dlg").open)){const x=await capturarBiblio(u.trim(),{coleccion:sugerirCol(u)});if(x){render();aviso("📚 "+x.titulo.slice(0,60))}}});
});
