// =====================================================================================================
// Memphis · 📚 BIBLIOTECA (segundo cerebro). Notas, ideas, enlaces, PDF, libros, citas textuales, referencias
// científicas (DOI → Crossref), material de clase y documentos importantes con vencimiento (bóveda).
// Etiquetas = los mismos #temas de toda la app; [[Otra nota]] enlaza notas y cada una muestra quién la menciona.
// =====================================================================================================
"use strict";
const BTIPOS={nota:["📝","Nota"],idea:["💡","Idea"],enlace:["🔗","Enlace / artículo web"],referencia:["🔬","Referencia científica"],pdf:["📄","PDF / documento"],libro:["📕","Libro"],cita:["❝","Cita textual"],clase:["🎓","Material de clase"],documento:["🗂️","Documento importante"]};
const BESTADOS=["","por leer","leyendo","leído"];
const bIco=t=>(BTIPOS[t]||BTIPOS.nota)[0],bTipoNom=t=>(BTIPOS[t]||BTIPOS.nota)[1];
let TB={vista:"todo",q:"",tipo:"",etq:"",col:"",estado:""};
function migrarBiblio(st,{ISO,ID,normA}){const s=(v,n)=>v==null?"":String(v).slice(0,n),lst=(v,n,m)=>[...new Set((Array.isArray(v)?v:[]).map(x=>s(x,n).trim()).filter(Boolean))].slice(0,m);
  st.biblio=(Array.isArray(st.biblio)?st.biblio:[]).filter(x=>x&&typeof x==="object").map(x=>({id:ID.test(String(x.id))?String(x.id):uid(),tipo:BTIPOS[x.tipo]?x.tipo:"nota",titulo:s(x.titulo,400),texto:s(x.texto,300000),
    url:/^https?:\/\//i.test(String(x.url||""))?s(x.url,2000):"",doi:/^10\.\d{4,9}\/\S+$/.test(String(x.doi||""))?s(x.doi,300):"",autores:lst(x.autores,150,60),anio:/^\d{4}$/.test(String(x.anio||""))?String(x.anio):"",
    revista:s(x.revista,300),vol:s(x.vol,30),num:s(x.num,30),pags:s(x.pags,40),editorial:s(x.editorial,200),etiquetas:lst(x.etiquetas,80,30),coleccion:s(x.coleccion,120).trim(),estado:BESTADOS.includes(x.estado)?x.estado:"",
    vence:ISO.test(String(x.vence||""))?String(x.vence):"",fijado:!!x.fijado,adjuntos:(Array.isArray(x.adjuntos)?x.adjuntos:[]).filter(a=>a&&typeof a==="object").map(normA).slice(0,200),
    creado:RE_DT.test(String(x.creado))?String(x.creado):new Date().toISOString(),editado:RE_DT.test(String(x.editado))?String(x.editado):"",
    versiones:(Array.isArray(x.versiones)?x.versiones:[]).filter(v=>v&&RE_DT.test(String(v.t))).map(v=>({t:String(v.t),titulo:s(v.titulo,400),texto:s(v.texto,300000)})).slice(-30),...(x.priv&&typeof x.priv==="object"&&/^[\w+/=]{12,40}$/.test(String(x.priv.iv||""))&&typeof x.priv.ct==="string"&&/^[\w+/=]*$/.test(x.priv.ct)&&x.priv.ct.length<8e6?{priv:{iv:String(x.priv.iv),ct:String(x.priv.ct)}}:{})})).slice(-20000)}
const huellaB=x=>JSON.stringify([x.tipo,x.titulo,x.texto,x.url,x.doi,x.autores,x.anio,x.revista,x.vol,x.num,x.pags,x.editorial,x.etiquetas,x.coleccion,x.estado,x.vence,x.fijado,(x.adjuntos||[]).map(a=>a.sha).join(","),(x.versiones||[]).length,x.priv?String(x.priv.ct).slice(0,80):""]);
MIGRAR_EXTRA.push(migrarBiblio);LISTAS_EXTRA.push({k:"biblio",base:"_baseB",hf:huellaB,ord:(x,y)=>x.creado.localeCompare(y.creado)});

// ---------------------------------------------------------------- referencias
const normDOI=v=>{const m=String(v||"").match(/10\.\d{4,9}\/[^\s"<>]+/);return m?m[0].replace(/[.,;)\]]+$/,""):""};
async function traerDOI(doi){doi=normDOI(doi);if(!doi)throw new Error("No reconozco el DOI");const r=await fetch("https://api.crossref.org/works/"+encodeURIComponent(doi));if(!r.ok)throw new Error(r.status===404?"Ese DOI no está en Crossref":"Crossref no respondió ("+r.status+")");
  const m=(await r.json()).message;const autores=(m.author||[]).map(a=>[a.family,a.given].filter(Boolean).join(", ")||a.name).filter(Boolean);
  const anio=String(((m.issued||m.published||{})["date-parts"]||[[""]])[0][0]||"");return{doi,titulo:(m.title||[""])[0]||"",autores,anio,revista:(m["container-title"]||[""])[0]||"",vol:m.volume||"",num:m.issue||"",pags:m.page||"",editorial:m.publisher||"",url:m.URL||("https://doi.org/"+doi)}}
const inic=n=>String(n||"").split(/[\s-]+/).filter(Boolean).map(p=>p[0].toUpperCase()+".").join(" ");
function refAPA(x){const A=x.autores.map(a=>{const [f,g]=a.split(", ");return g?`${f}, ${inic(g)}`:f});const au=A.length>20?[...A.slice(0,19),"…",A[A.length-1]].join(", "):A.length>1?A.slice(0,-1).join(", ")+", & "+A[A.length-1]:A[0]||"";
  return`${au}${au?" ":""}(${x.anio||"s. f."}). ${x.titulo}.${x.revista?` ${x.revista}`:""}${x.vol?`, ${x.vol}`:""}${x.num?`(${x.num})`:""}${x.pags?`, ${x.pags}`:""}.${x.doi?` https://doi.org/${x.doi}`:x.url?` ${x.url}`:""}`.replace(/\.\./g,".")}
function refVancouver(x){const A=x.autores.map(a=>{const [f,g]=a.split(", ");return g?`${f} ${String(g).split(/[\s-]+/).filter(Boolean).map(p=>p[0].toUpperCase()).join("")}`:f});const au=A.length>6?A.slice(0,6).join(", ")+", et al":A.join(", ");
  return`${au}${au?". ":""}${x.titulo}. ${x.revista||""}${x.revista?". ":""}${x.anio||""}${x.vol?`;${x.vol}`:""}${x.num?`(${x.num})`:""}${x.pags?`:${x.pags}`:""}.${x.doi?` doi:${x.doi}`:""}`.replace(/\.\./g,".")}
function refBib(x){const k=(normK((x.autores[0]||"anon").split(",")[0]).replace(/[^a-z]/g,"")||"anon")+(x.anio||"")+(normK(x.titulo).split(" ").find(w=>w.length>3)||"").replace(/[^a-z]/g,"");const e=v=>String(v).replace(/[{}]/g,"");
  return`@${x.tipo==="libro"?"book":"article"}{${k},\n  title = {${e(x.titulo)}},\n  author = {${x.autores.map(e).join(" and ")}},\n${x.revista?`  journal = {${e(x.revista)}},\n`:""}${x.anio?`  year = {${x.anio}},\n`:""}${x.vol?`  volume = {${e(x.vol)}},\n`:""}${x.num?`  number = {${e(x.num)}},\n`:""}${x.pags?`  pages = {${e(x.pags).replace("-","--")}},\n`:""}${x.editorial&&x.tipo==="libro"?`  publisher = {${e(x.editorial)}},\n`:""}${x.doi?`  doi = {${x.doi}},\n`:""}${x.url?`  url = {${x.url}},\n`:""}}`}

// ---------------------------------------------------------------- [[enlaces]] entre notas y quién menciona a quién
const bPorTitulo=t=>(S.biblio||[]).find(x=>claveF(x.titulo)===claveF(t));
const RE_WIKI=/\[\[([^\]\n]{1,150})\]\]/g;
function menciones2(x){const out=[];for(const y of S.biblio||[]){if(y.id===x.id)continue;let m;RE_WIKI.lastIndex=0;while((m=RE_WIKI.exec(y.texto||""))){if(claveF(m[1])===claveF(x.titulo)){out.push(y);break}}}return out}
function etiquetasDe(x){return[...new Set([...x.etiquetas,...menciones(x.titulo+" "+x.texto).filter(m=>m.tipo==="tema").map(m=>nomTema(m.nombre))])]}
const nomTema=n=>{const f=fichaDe(n,"tema");return f?f.nombre:n};
function bibDeFicha(f){if(f.tipo!=="tema")return"";const L=(S.biblio||[]).filter(x=>etiquetasDe(x).some(e=>claveF(e)===claveF(f.nombre)||f.alias.some(a=>claveF(a)===claveF(e))));if(!L.length)return"";
  return`<div class="card"><h2>📚 Biblioteca <span class="small muted">${L.length}</span></h2>${L.slice(0,40).map(tarjetaB).join("")}</div>`}

// ---------------------------------------------------------------- vistas
function tarjetaB(x){const ex=(x.texto||"").split("\n").filter(l=>l.trim()).slice(0,2).join("\n"),E=etiquetasDe(x),venc=x.vence?Math.round((dDe(x.vence)-dDe(hoyISO()))/864e5):null;
  return`<div class="it bib t-${x.tipo}" data-b="${esc(x.id)}"><div class="ih"><b>${bIco(x.tipo)} ${esc(x.titulo||"(sin título)")}</b>${x.fijado?" 📌":""}${x.estado?`<span class="chip">${esc(x.estado)}</span>`:""}${venc!=null?`<span class="chip ${venc<0?"bad":venc<=60?"warn":""}">vence ${esc(x.vence)}</span>`:""}${typeof chipVin==="function"?chipVin("b:"+x.id):""}</div>
    ${x.autores.length||x.revista?`<div class="small muted">${esc([x.autores.slice(0,3).map(a=>a.split(",")[0]).join(", ")+(x.autores.length>3?" et al.":""),x.revista,x.anio].filter(Boolean).join(" · "))}</div>`:""}
    ${ex?`<div class="ex">${md(ex)}</div>`:""}${x.url&&!x.doi?`<div class="small"><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.url.replace(/^https?:\/\//,"").slice(0,70))}</a></div>`:""}
    ${galeria(x,{chico:true})}${E.length||x.coleccion?`<div class="small">${x.coleccion?`<span class="chip">📂 ${esc(x.coleccion)}</span> `:""}${E.map(e=>`<a href="#" class="men tem" data-men="tema|${esc(e)}">#${esc(e)}</a>`).join(" ")}</div>`:""}</div>`}
function filtrarB(){const q=normK(TB.q);return(S.biblio||[]).filter(x=>(!TB.tipo||x.tipo===TB.tipo)&&(!TB.col||x.coleccion===TB.col)&&(!TB.estado||x.estado===TB.estado)&&(!TB.etq||etiquetasDe(x).some(e=>claveF(e)===claveF(TB.etq)))&&
  (!q||q.split(/\s+/).every(w=>normK([x.titulo,x.texto,x.url,x.doi,x.autores.join(" "),x.revista,x.etiquetas.join(" "),x.coleccion,(x.adjuntos||[]).map(a=>a.original||a.nombre).join(" ")].join(" ")).includes(w))))
  .sort((a,b)=>(b.fijado-a.fijado)||(b.editado||b.creado).localeCompare(a.editado||a.creado))}
function vBiblio(){syncTabsB();let h=`<div class="cap card"><div class="caprow"><input id="bq0" placeholder="Pega un enlace o un DOI, o escribe una idea… (#etiquetas y [[otras notas]])" autocomplete="off"><button class="b p" id="bqG">Guardar</button></div>
   <div id="bqP" class="small muted"></div><div class="filters" style="margin:6px 0 0">${Object.entries(BTIPOS).map(([k,[i,l]])=>`<button class="b s" data-bnuevo="${k}">${i} ${l.split(" /")[0]}</button>`).join("")}</div></div>`;
  const T=TB.vista;if(T==="etiquetas")h+=vEtiquetasB();else if(T==="colecciones")h+=vColeccionesB();else if(T==="boveda")h+=vBovedaB();else h+=vTodoB();
  $("#view").innerHTML=h;bindBiblio()}
function vTodoB(){const L=filtrarB(),cols=[...new Set((S.biblio||[]).map(x=>x.coleccion).filter(Boolean))].sort(),etqs=[...new Set((S.biblio||[]).flatMap(etiquetasDe))].sort((a,b)=>a.localeCompare(b));
  if(TB.vista==="leer"&&!TB.estado)TB.estado="por leer";
  return`<div class="filters"><input id="bB" placeholder="🔎 Buscar en títulos, textos, autores, archivos…" value="${esc(TB.q)}" style="flex:1;min-width:180px">
    <select id="bFt"><option value="">Todo tipo</option>${Object.entries(BTIPOS).map(([k,[i,l]])=>`<option value="${k}" ${TB.tipo===k?"selected":""}>${i} ${esc(l)}</option>`).join("")}</select>
    <select id="bFe"><option value="">Toda etiqueta</option>${etqs.map(e=>`<option ${claveF(TB.etq)===claveF(e)?"selected":""}>${esc(e)}</option>`).join("")}</select>
    <select id="bFc"><option value="">Toda colección</option>${cols.map(c=>`<option ${TB.col===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select id="bFs">${BESTADOS.map(e=>`<option value="${e}" ${TB.estado===e?"selected":""}>${e||"Cualquier estado"}</option>`).join("")}</select>
    ${L.length?`<button class="b s" id="bExp">📤 Exportar</button>${L.some(x=>x.doi||x.autores.length)?'<button class="b s" id="bBib">📚 BibTeX</button>':""}`:""}</div>
   <div class="small muted" style="margin:6px 0">${L.length} elementos</div>${L.slice(0,300).map(tarjetaB).join("")||'<div class="card vacio"><p>Aquí guardas lo que quieres volver a encontrar: ideas, artículos, PDF, citas, material de clase, documentos. Pega un enlace o un DOI arriba, o manda cosas desde la 📥 Bandeja.</p></div>'}`}
function vEtiquetasB(){const c={};for(const x of S.biblio||[])for(const e of etiquetasDe(x))c[e]=(c[e]||0)+1;const E=Object.entries(c).sort((a,b)=>b[1]-a[1]);
  return`<div class="card"><h2>🏷️ Etiquetas</h2><p class="small muted">Son los mismos #temas del diario: al abrir uno ves también sus notas, gastos y lo ligado.</p><div class="chips">${E.map(([e,n])=>`<span class="fchip on"><a href="#" data-betq="${esc(e)}">#${esc(e)}</a> <span class="muted">${n}</span> <a href="#" title="Ver el tema completo" data-men="tema|${esc(e)}">↗</a></span>`).join(" ")||'<p class="small muted">Aún no hay etiquetas.</p>'}</div></div>`}
function vColeccionesB(){const c={};for(const x of S.biblio||[])if(x.coleccion)c[x.coleccion]=(c[x.coleccion]||0)+1;
  return`<div class="pcards">${Object.entries(c).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,n])=>`<div class="card pcard click" style="--c:var(--mod)" data-bcol="${esc(k)}"><h2>📂 ${esc(k)}</h2><div class="small muted">${n} elementos</div></div>`).join("")||'<div class="card"><p class="small muted">Crea una colección escribiendo su nombre al guardar algo (ej.: «Tesis de Laura», «Clase de enzimas»).</p></div>'}</div>`}
function vBovedaB(){const L=(S.biblio||[]).filter(x=>x.tipo==="documento").sort((a,b)=>(a.vence||"9999").localeCompare(b.vence||"9999"));
  return`<div class="card"><h2>🗂️ Bóveda de documentos</h2><p class="small muted">Pasaporte, SOAT, pólizas, contratos, escrituras, diplomas: una foto o PDF, dónde está el original y cuándo vence (aparece en la agenda y la app avisa 60 días antes).</p>
   <button class="b s p" data-bnuevo="documento">+ Documento</button></div>${L.map(tarjetaB).join("")}`}
function syncTabsB(){document.querySelectorAll("#tabsB button").forEach(x=>x.classList.toggle("on",x.dataset.tb===TB.vista))}
function previewBQ(){const t=($("#bq0")||{}).value||"",el=$("#bqP");if(!el)return null;if(!t.trim()){el.textContent="Un DOI trae título, autores y revista desde Crossref. Un enlace se guarda como enlace; texto suelto, como idea o nota.";return null}
  const doi=normDOI(t),url=(t.match(/https?:\/\/\S+/)||[])[0]||"",tipo=doi?"referencia":url&&t.trim()===url?"enlace":t.length>280?"nota":"idea",E=menciones(t).filter(m=>m.tipo==="tema").map(m=>m.nombre);
  el.innerHTML=`${bIco(tipo)} <b>${esc(bTipoNom(tipo))}</b>${doi?` · DOI ${esc(doi)} (al guardar busco los datos)`:""}${E.length?" · "+E.map(e=>"#"+esc(e)).join(" "):""}`;return{t,doi,url,tipo}}
async function guardarBQ(){const p=previewBQ();if(!p)return;const ah=new Date().toISOString();let x={id:uid(),tipo:p.tipo,titulo:"",texto:p.t,url:p.url,doi:p.doi,autores:[],anio:"",revista:"",vol:"",num:"",pags:"",editorial:"",etiquetas:[],coleccion:"",estado:p.doi||p.tipo==="enlace"?"por leer":"",vence:"",fijado:false,adjuntos:[],creado:ah,editado:"",versiones:[]};
  if(p.doi){try{status("Buscando el DOI…");const d=await traerDOI(p.doi);Object.assign(x,d,{texto:p.t.replace(/\S*10\.\d{4,9}\/\S+/,"").trim()})}catch(e){aviso(e.message)}finally{status("")}}
  if(!x.titulo)x.titulo=p.tipo==="enlace"?p.url.replace(/^https?:\/\/(www\.)?/,"").slice(0,120):p.t.split("\n")[0].replace(RE_WIKI,"$1").slice(0,120);
  (S.biblio=S.biblio||[]).push(x);asegurarFichas(x.texto);changed();$("#bq0").value="";render();deshacer("Guardado en la biblioteca",()=>{S.biblio=S.biblio.filter(y=>y.id!==x.id);changed();render()})}
function bindBiblio(){const q=$("#bq0");if(q){q.oninput=previewBQ;q.onkeydown=ev=>{if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();guardarBQ()}};$("#bqG").onclick=guardarBQ;previewBQ()}
  document.querySelectorAll("[data-bnuevo]").forEach(b=>b.onclick=()=>editarB(null,{tipo:b.dataset.bnuevo}));
  const sel=(id,k)=>{const e=$(id);if(e)e.onchange=()=>{TB[k]=e.value;render()}};sel("#bFt","tipo");sel("#bFe","etq");sel("#bFc","col");sel("#bFs","estado");
  if($("#bB")){const b=$("#bB");b.oninput=()=>{TB.q=b.value;clearTimeout(b._t);b._t=setTimeout(()=>{render();const i=$("#bB");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)}}
  document.querySelectorAll("[data-betq]").forEach(a=>a.onclick=ev=>{ev.preventDefault();TB.etq=a.dataset.betq;TB.vista="todo";render()});
  document.querySelectorAll("[data-bcol]").forEach(a=>a.onclick=()=>{TB.col=a.dataset.bcol;TB.vista="todo";render()});
  if($("#bExp"))$("#bExp").onclick=()=>exportarItems(filtrarB().map(b=>({k:"b",b})),"Biblioteca"+(TB.etq?" · #"+TB.etq:"")+(TB.col?" · "+TB.col:""));
  if($("#bBib"))$("#bBib").onclick=()=>descargar(new Blob([filtrarB().filter(x=>x.doi||x.autores.length).map(refBib).join("\n\n")],{type:"application/x-bibtex"}),"referencias_"+hoyISO()+".bib");
  bindItems($("#view"))}

// ---------------------------------------------------------------- ver y editar
function verB(id){const x=(S.biblio||[]).find(y=>y.id===id);if(!x)return;const M=menciones2(x),E=etiquetasDe(x),ref=x.tipo==="referencia"||x.doi||x.autores.length;
  dlg(`${bIco(x.tipo)} ${x.titulo||"(sin título)"}`,`<div class="small muted">${esc(bTipoNom(x.tipo))}${x.coleccion?" · 📂 "+esc(x.coleccion):""}${x.estado?" · "+esc(x.estado):""}${x.vence?" · vence "+esc(x.vence):""}</div>
    ${x.autores.length?`<div class="small">${esc(x.autores.join("; "))}</div>`:""}${x.revista||x.anio?`<div class="small"><i>${esc(x.revista)}</i> ${esc(x.anio)}${x.vol?" · vol. "+esc(x.vol):""}${x.num?"("+esc(x.num)+")":""}${x.pags?" · "+esc(x.pags):""}</div>`:""}
    ${x.doi?`<div class="small"><a href="https://doi.org/${esc(x.doi)}" target="_blank" rel="noopener noreferrer">doi:${esc(x.doi)}</a></div>`:x.url?`<div class="small"><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.url)}</a></div>`:""}
    ${E.length?`<div style="margin:6px 0">${E.map(e=>`<a href="#" class="men tem" data-men="tema|${esc(e)}">#${esc(e)}</a>`).join(" ")}</div>`:""}
    <div class="mdv">${x.texto?mdB(x.texto):'<p class="muted small">Sin notas.</p>'}</div>${galeria(x)}
    ${ref?`<details class="card"><summary class="small"><b>Cómo citarlo</b></summary>${[["APA",refAPA(x)],["Vancouver",refVancouver(x)],["BibTeX",refBib(x)]].map(([k,v])=>`<div class="small" style="margin:6px 0"><b>${k}</b> <button class="b s" data-copiar="${esc(v)}">Copiar</button><pre class="refpre">${esc(v)}</pre></div>`).join("")}</details>`:""}
    ${M.length?`<div class="small"><b>Mencionado en:</b> ${M.map(y=>`<a href="#" data-b="${esc(y.id)}">${bIco(y.tipo)} ${esc(y.titulo)}</a>`).join(" · ")}</div>`:""}
    <div class="small muted tss">Creado ${esc(tsBonito(x.creado))}${x.editado?` · editado ${esc(tsBonito(x.editado))}`:""}${(x.versiones||[]).length?` · ${x.versiones.length} versiones anteriores`:""}</div>`,
   [["📤","",()=>exportarItems([{k:"b",b:x}],x.titulo)],...((x.versiones||[]).length?[["Historial","",()=>historialB(x)]]:[]),["Cerrar","",cerrar],["Editar","p",()=>editarB(x.id)]]);
  $("#dlg").classList.add("ancho");bindItems($("#dlgB"));bindWiki($("#dlgB"));
  $("#dlgB").querySelectorAll("[data-copiar]").forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.copiar);aviso("Copiado")}catch(e){prompt("Copia:",b.dataset.copiar)}});
  $("#dlgB").querySelectorAll("[data-tarea]").forEach(c=>c.onchange=()=>{const L=x.texto.split("\n"),i=+c.dataset.tarea;L[i]=L[i].replace(/\[( |x|X)\]/,c.checked?"[x]":"[ ]");guardarVersion(x,x.titulo,L.join("\n"));changed()})}
// [[Título]] → enlace a esa nota (o la crea)
function mdB(t){return md(String(t||"").replace(RE_WIKI,(m,ti)=>`[[${ti}]]`)).replace(/\[\[([^\]<\n]{1,150})\]\]/g,(m,ti)=>`<a href="#" class="wiki ${bPorTitulo(ti)?"":"nueva"}" data-wiki="${ti}">${ti}</a>`)}
function bindWiki(root){root.querySelectorAll("[data-wiki]").forEach(a=>a.onclick=ev=>{ev.preventDefault();const t=a.dataset.wiki,x=bPorTitulo(t);if(x)verB(x.id);else editarB(null,{tipo:"nota",titulo:t})})}
function historialB(x){const V=(x.versiones||[]).map((v,i)=>({v,i})).reverse();dlg("Historial de cambios",V.map(({v,i})=>`<details class="card"><summary>${esc(tsBonito(v.t))} · ${esc(v.titulo||"")}</summary><div class="mdv">${md(v.texto)}</div><button class="b s" data-rv="${i}">Volver a esta versión</button></details>`).join(""),[["Cerrar","",()=>verB(x.id)]]);
  document.querySelectorAll("[data-rv]").forEach(b=>b.onclick=()=>{const v=x.versiones[+b.dataset.rv];guardarVersion(x,v.titulo,v.texto);changed();verB(x.id)})}
function editarB(id,pre){const x0=id?(S.biblio||[]).find(y=>y.id===id):null;pre=pre||{};
  const x=x0?structuredClone(x0):{id:uid(),tipo:pre.tipo||"nota",titulo:pre.titulo||"",texto:pre.texto||"",url:pre.url||"",doi:normDOI(pre.texto||pre.url||""),autores:[],anio:"",revista:"",vol:"",num:"",pags:"",editorial:"",etiquetas:TB.etq?[TB.etq]:[],coleccion:TB.col||"",estado:"",vence:"",fijado:false,adjuntos:pre.adjuntos||[],creado:new Date().toISOString(),editado:"",versiones:[]};
  ADJ=(x.adjuntos||[]).slice();ENL=[];ADJCTX=()=>({fecha:hoyISO(),estab:"biblioteca",concepto:"",desc:"",valor:0});ADJPINTA=pintaAdjD;ADJOPC={max:2200,q:0.85,umbral:600*1024};
  const temas=(S.fichas||[]).filter(f=>f.tipo==="tema").map(f=>f.nombre),cols=[...new Set((S.biblio||[]).map(y=>y.coleccion).filter(Boolean))];
  dlg(x0?"Editar":"Nuevo en la biblioteca",`<div class="seg wrap">${Object.entries(BTIPOS).map(([k,[i,l]])=>`<button data-btp="${k}" class="${x.tipo===k?"on":""}">${i} ${l.split(" /")[0]}</button>`).join("")}</div>
    <input id="bT" placeholder="Título" value="${esc(x.titulo)}" style="width:100%;margin-top:8px;font-weight:600">
    <div class="filters" data-bpara="referencia libro pdf enlace clase"><input id="bU" placeholder="Enlace https://… o DOI" value="${esc(x.doi?"https://doi.org/"+x.doi:x.url)}" style="flex:1;min-width:200px"><button class="b s" id="bDoi">🔎 Traer datos del DOI</button></div>
    <div data-bpara="referencia libro"><input id="bA" placeholder="Autores (Apellido, Nombre; Apellido, Nombre)" value="${esc(x.autores.join("; "))}" style="width:100%"><div class="filters"><input id="bR" placeholder="Revista / editorial" value="${esc(x.revista||x.editorial)}" style="flex:1"><input id="bY" placeholder="Año" value="${esc(x.anio)}" style="width:70px"><input id="bV" placeholder="Vol." value="${esc(x.vol)}" style="width:60px"><input id="bN" placeholder="Núm." value="${esc(x.num)}" style="width:60px"><input id="bP" placeholder="Págs." value="${esc(x.pags)}" style="width:80px"></div></div>
    <div class="filters"><input id="bE" placeholder="#etiquetas (separadas por coma)" value="${esc(x.etiquetas.join(", "))}" list="bEL" style="flex:1;min-width:160px"><datalist id="bEL">${temas.map(t=>`<option value="${esc(t)}">`).join("")}</datalist>
     <input id="bC" placeholder="📂 Colección" value="${esc(x.coleccion)}" list="bCL" style="width:170px"><datalist id="bCL">${cols.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
     <select id="bS">${BESTADOS.map(e=>`<option value="${e}" ${x.estado===e?"selected":""}>${e||"Estado"}</option>`).join("")}</select>
     <label class="small" data-bpara="documento">Vence <input type="date" id="bVe" value="${x.vence}"></label><label class="small"><input type="checkbox" id="bF" ${x.fijado?"checked":""}> 📌</label></div>
    <div class="tb">${[["**","B","Negrita"],["- ","•","Lista"],["- [ ] ","☐","Tarea"],["==","▮","Resaltar"],["> ","❝","Cita"]].map(([m,l,t])=>`<button class="b s" data-mk="${esc(m)}" title="${t}">${l}</button>`).join("")}<button class="b s" id="bWk" title="Enlazar otra nota">[[ ]]</button><span class="sp"></span><button class="b s" id="bPrev">👁 Vista previa</button></div>
    <textarea id="bX" rows="10" style="width:100%" placeholder="Escribe. Markdown opcional; #etiqueta, @persona y [[Otra nota]] crean conexiones.">${esc(x.texto)}</textarea><div id="bVw" class="mdv card" hidden></div><div id="bSug"></div>
    <div class="filters"><button class="b s" id="deFo">📷 Foto</button><button class="b s" id="deIm">🖼 Imágenes</button><button class="b s" id="deFi">📄 PDF / archivo</button><button class="b s" id="deAu">🎙 Audio</button><span id="deRec" class="small"></span></div>
    <input type="hidden" id="adjT" value="Biblioteca"><div id="adjL"></div><div id="deEnl" hidden></div>`,
   [...(x0?[["Borrar","",()=>{if(!confirm("¿Borrar? Queda 30 días en la papelera."))return;cerrar();borrarConPapelera("biblio",x0.id);render()}]]:[]),["Cancelar","",()=>{pararGrab(true);cerrar()}],["Guardar","p",()=>guardarB(x,x0)]]);
  $("#dlg").classList.add("ancho");
  const tipo=t=>{x.tipo=t;document.querySelectorAll("[data-btp]").forEach(b=>b.classList.toggle("on",b.dataset.btp===t));document.querySelectorAll("#dlgB [data-bpara]").forEach(e=>e.hidden=!e.dataset.bpara.split(" ").includes(t))};tipo(x.tipo);
  document.querySelectorAll("[data-btp]").forEach(b=>b.onclick=()=>tipo(b.dataset.btp));
  $("#bDoi").onclick=async()=>{const d0=normDOI($("#bU").value);if(!d0){alert("Pega un DOI (10.xxxx/…) o un enlace doi.org");return}try{$("#bDoi").textContent="Buscando…";const d=await traerDOI(d0);x.doi=d.doi;if(!$("#bT").value)$("#bT").value=d.titulo;$("#bA").value=d.autores.join("; ");$("#bR").value=d.revista||d.editorial;$("#bY").value=d.anio;$("#bV").value=d.vol;$("#bN").value=d.num;$("#bP").value=d.pags;if(x.tipo!=="libro")tipo("referencia");aviso("Datos traídos de Crossref")}catch(e){alert(e.message)}finally{$("#bDoi").textContent="🔎 Traer datos del DOI"}};
  const X=$("#bX");document.querySelectorAll("#dlgB [data-mk]").forEach(b=>b.onclick=()=>marcar(X,b.dataset.mk));
  $("#bWk").onclick=()=>{const t=prompt("Título de la nota a enlazar:",(S.biblio||[]).slice(-1)[0]?.titulo||"");if(!t)return;const p=X.selectionStart;X.value=X.value.slice(0,p)+`[[${t}]]`+X.value.slice(X.selectionEnd);X.focus()};
  $("#bPrev").onclick=()=>{const v=$("#bVw");v.hidden=!v.hidden;X.hidden=!v.hidden;if(!v.hidden)v.innerHTML=mdB(X.value)||'<p class="muted small">(vacío)</p>'};
  X.addEventListener("paste",async ev=>{const files=[...(ev.clipboardData&&ev.clipboardData.files)||[]].filter(f=>/^image\//.test(f.type));if(files.length){ev.preventDefault();await adjuntarArchivos(files.map((f,i)=>new File([f],`captura_${fISO(new Date())}_${ahoraHM().replace(":","")}${i?"_"+i:""}.${(f.type.split("/")[1]||"png").replace("jpeg","jpg")}`,{type:f.type})))}});
  $("#deFo").onclick=()=>{$("#camIn").value="";$("#camIn").click()};$("#deIm").onclick=()=>{const i=$("#attIn");i.accept="image/*";i.value="";i.click();setTimeout(()=>i.removeAttribute("accept"),1000)};
  $("#deFi").onclick=()=>{const i=$("#attIn");i.removeAttribute("accept");i.value="";i.click()};$("#deAu").onclick=()=>GRAB?pararGrab():grabar();pintaAdjD();
  if(typeof vigilarSugerencias==="function")vigilarSugerencias(["bT","bX"],"bSug");setTimeout(()=>(x0?X:$("#bT")).focus(),30)}
function guardarB(x,x0){if(GRAB){alert("Detén la grabación antes de guardar.");return}const titulo=$("#bT").value.trim(),texto=$("#bX").value;
  if(!titulo&&!texto.trim()&&!ADJ.length){alert("Está vacío.");return}const u=$("#bU").value.trim(),d=normDOI(u);
  Object.assign(x,{url:d?"https://doi.org/"+d:/^https?:\/\//i.test(u)?u:"",doi:d||"",autores:$("#bA").value.split(";").map(s=>s.trim()).filter(Boolean),anio:/^\d{4}$/.test($("#bY").value.trim())?$("#bY").value.trim():"",
    revista:x.tipo==="libro"?"":$("#bR").value.trim(),editorial:x.tipo==="libro"?$("#bR").value.trim():x.editorial,vol:$("#bV").value.trim(),num:$("#bN").value.trim(),pags:$("#bP").value.trim(),
    etiquetas:[...new Set($("#bE").value.split(",").map(s=>s.replace(/^#/,"").trim()).filter(Boolean))],coleccion:$("#bC").value.trim(),estado:$("#bS").value,vence:x.tipo==="documento"?$("#bVe").value:"",fijado:$("#bF").checked,adjuntos:ADJ.slice()});
  for(const e of x.etiquetas)asegurarFichas("#["+e+"]");const tit=titulo||texto.split("\n")[0].slice(0,120)||"(sin título)";
  if(x0){const real=S.biblio.find(y=>y.id===x0.id),antes=structuredClone(real);guardarVersion(x,tit,texto);Object.assign(real,x,{versiones:x.versiones});asegurarFichas(tit+" "+texto);changed();cerrar();ADJPINTA=null;ADJOPC=null;render();
    deshacer("Guardado",()=>{const i=S.biblio.findIndex(y=>y.id===antes.id);if(i>=0){antes.editado=new Date().toISOString();S.biblio[i]=antes;changed();render()}})}
  else{x.titulo=tit;x.texto=texto;x.creado=new Date().toISOString();(S.biblio=S.biblio||[]).push(x);asegurarFichas(tit+" "+texto);changed();cerrar();ADJPINTA=null;ADJOPC=null;render();deshacer("Guardado en la biblioteca",()=>{S.biblio=S.biblio.filter(y=>y.id!==x.id);changed();render()})}}
// desde la bandeja
function crearBiblioDesde(x){BA_EN={id:x.id,antes:idsActuales()};const doi=normDOI(x.texto+" "+x.url);editarB(null,{tipo:doi?"referencia":x.url?"enlace":(x.adjuntos||[]).some(a=>/pdf/.test(a.mime))?"pdf":"nota",titulo:x.titulo,texto:x.texto,url:x.url,adjuntos:x.adjuntos.slice()});if(doi)setTimeout(()=>$("#bDoi")&&$("#bDoi").click(),50)}
// aviso de documentos por vencer (bóveda) al desbloquear
window.addEventListener("load",()=>{const db=window.desbloqueado;if(typeof db==="function")window.desbloqueado=function(...a){const r=db.apply(this,a);setTimeout(()=>{if(!S)return;const h=hoyISO(),L=(S.biblio||[]).filter(x=>x.vence&&x.vence<=masDias(h,60));if(L.length)aviso(`🗂️ ${L.length} documento${L.length>1?"s":""} de la bóveda ${L.some(x=>x.vence<h)?"vencido o ":""}por vencer: ${L.slice(0,2).map(x=>x.titulo).join(", ")}${L.length>2?"…":""}`)},2600);return r}});
