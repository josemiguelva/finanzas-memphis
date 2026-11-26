// =====================================================================================================
// Memphis · 📚 BIBLIOTECA 2: vistas (lista, cuadritos, tabla, fichas, tablero), agrupar, ordenar, selección múltiple,
// lector al lado (PC/tablet), 📤 compartir / enviar a…, PMID y PMC (Europe PMC / NCBI), redes sociales reconocidas
// y sugerencia de colección. Todo en el navegador; lo que sale de Memphis sale sin cifrar y solo si tú lo envías.
// =====================================================================================================
"use strict";
const BV=Object.assign({cel:"lista",pc:"tabla",grupo:"",orden:"reciente",desc:false,col:"fecha"},(()=>{try{return JSON.parse(localStorage.getItem("memphisBV")||"{}")}catch(e){return{}}})(),{sel:new Set(),selOn:false,n:60,lect:""});
const BV_MODOS={lista:["☰","Lista"],tarjetas:["▦","Cuadritos"],tabla:["▤","Tabla"],fichas:["🗂","Fichas"],tablero:["📋","Tablero"]};
const bvGuarda=()=>{try{localStorage.setItem("memphisBV",JSON.stringify({cel:BV.cel,pc:BV.pc,grupo:BV.grupo,orden:BV.orden,desc:BV.desc,col:BV.col}))}catch(e){}};
const esPC=()=>innerWidth>=900,conLector=()=>innerWidth>=760;
const modoB=()=>esPC()?BV.pc:BV.cel;
const bloqB=x=>typeof verPriv==="function"&&verPriv(x);
// ---------------------------------------------------------------- de dónde viene un enlace
const FUENTES=[[/(^|\.)youtube\.com$|(^|\.)youtu\.be$/,"▶️","YouTube"],[/(^|\.)facebook\.com$|(^|\.)fb\.watch$|(^|\.)fb\.com$/,"📘","Facebook"],[/(^|\.)instagram\.com$/,"📸","Instagram"],[/(^|\.)threads\.(net|com)$/,"🧵","Threads"],
  [/(^|\.)(x|twitter)\.com$/,"𝕏","X / Twitter"],[/(^|\.)tiktok\.com$/,"🎵","TikTok"],[/(^|\.)pubmed\.ncbi\.nlm\.nih\.gov$/,"🧬","PubMed"],[/pmc\.ncbi\.nlm\.nih\.gov$|ncbi\.nlm\.nih\.gov$/,"🧬","NCBI / PMC"],[/europepmc\.org$/,"🧬","Europe PMC"],
  [/(^|\.)doi\.org$/,"🔬","DOI"],[/(^|\.)biorxiv\.org$|(^|\.)medrxiv\.org$/,"🧪","bioRxiv / medRxiv"],[/(^|\.)linkedin\.com$/,"💼","LinkedIn"],[/(^|\.)pinterest\.[a-z.]+$|(^|\.)pin\.it$/,"📌","Pinterest"],[/(^|\.)spotify\.com$/,"🎧","Spotify"],[/(^|\.)wikipedia\.org$/,"📖","Wikipedia"]];
function fuenteDe(u){let h="";try{h=new URL(u).hostname.replace(/^www\.|^m\./,"")}catch(e){return null}if(!h)return null;for(const [re,i,n] of FUENTES)if(re.test(h))return{ico:i,nom:n,host:h,red:/YouTube|Facebook|Instagram|Threads|X \/|TikTok|Pinterest|LinkedIn/.test(n)};return{ico:"🌐",nom:h,host:h,red:false}}
function tituloRed(u){const f=fuenteDe(u);if(!f||!f.red)return"";let p="";try{p=new URL(u).pathname}catch(e){}const us=(p.match(/\/@([\w.]+)/)||[])[1]||(f.nom.startsWith("X")?(p.match(/^\/([\w]+)\/status/)||[])[1]:"")||"";
  const que=/\/reel|\/reels/.test(p)?"Reel":/\/watch|\/video|\/shorts|fb\.watch|youtu\.be/.test(p+f.host)?"Video":/\/p\/|\/post|\/status/.test(p)?"Publicación":"Enlace";return`${que} de ${f.nom}${us?" · @"+us:""}`}
// ---------------------------------------------------------------- PMID / PMC
const normPMID=t=>{t=String(t||"");const m=t.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{4,9})/)||t.match(/europepmc\.org\/(?:abstract|article)\/MED\/(\d{4,9})/i)||t.match(/\bPMID\s*:?\s*(\d{4,9})\b/i);return m?m[1]:""};
const normPMC=t=>{const m=String(t||"").match(/\bPMC\s?(\d{4,9})\b/i);return m?"PMC"+m[1]:""};
async function traerPM(id){id=String(id||"").trim();const pmid=/^\d{4,9}$/.test(id)?id:normPMID(id),pmc=pmid?"":normPMC(id);if(!pmid&&!pmc)throw new Error("No reconozco el PMID o PMC");
  const q=pmid?`EXT_ID:${pmid} AND SRC:MED`:`PMCID:${pmc}`;let r=null;
  try{const res=await fetch("https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=core&pageSize=1&query="+encodeURIComponent(q));if(res.ok)r=((await res.json()).resultList||{}).result?.[0]||null}catch(e){}
  if(r){const A=((r.authorList||{}).author||[]).map(a=>a.lastName?[a.lastName,a.firstName||a.initials].filter(Boolean).join(", "):a.fullName||a.collectiveName).filter(Boolean),J=r.journalInfo||{};
    return{titulo:String(r.title||"").replace(/\.$/,""),autores:A,anio:String(r.pubYear||""),revista:(J.journal||{}).title||r.bookOrReportDetails?.publisher||"",vol:J.volume||"",num:J.issue||"",pags:r.pageInfo||"",doi:r.doi||"",pmid:r.pmid||pmid,pmc:r.pmcid||pmc,
      resumen:String(r.abstractText||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(),url:r.pmid?"https://pubmed.ncbi.nlm.nih.gov/"+r.pmid+"/":r.pmcid?"https://pmc.ncbi.nlm.nih.gov/articles/"+r.pmcid+"/":""}}
  // respaldo: NCBI E-utilities
  const db=pmid?"pubmed":"pmc",uid=pmid||pmc.slice(3);const res=await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=${db}&retmode=json&tool=memphis&id=${uid}`);if(!res.ok)throw new Error("PubMed no respondió ("+res.status+")");
  const j=await res.json(),d=(j.result||{})[uid];if(!d||d.error)throw new Error("No encontré ese "+(pmid?"PMID":"PMC"));const ids=Object.fromEntries((d.articleids||[]).map(a=>[a.idtype,a.value]));
  return{titulo:String(d.title||"").replace(/\.$/,""),autores:(d.authors||[]).map(a=>{const m=String(a.name||"").match(/^(.+?)\s+([A-Z]{1,4})$/);return m?m[1]+", "+m[2]:a.name}).filter(Boolean),anio:String(d.pubdate||d.epubdate||"").slice(0,4),revista:d.fulljournalname||d.source||"",vol:d.volume||"",num:d.issue||"",pags:d.pages||"",
    doi:ids.doi||"",pmid:ids.pubmed||pmid,pmc:ids.pmc||pmc,resumen:"",url:pmid?"https://pubmed.ncbi.nlm.nih.gov/"+pmid+"/":"https://pmc.ncbi.nlm.nih.gov/articles/"+pmc+"/"}}
const idsTexto=(d)=>[d.pmid&&"PMID: "+d.pmid,d.pmc&&"PMCID: "+d.pmc].filter(Boolean).join(" · ");
// ---------------------------------------------------------------- sugerir colección (aprende de lo que ya clasificaste)
const STOPB=new Set("para como esta este estos estas sobre entre desde hasta donde cuando porque pero tambien video post reel https http www com html with from that this have your the and".split(" "));
const SEMILLAS=[[/receta|cocin|ingrediente|horno|torta|postre|almuerzo|sopa|salsa|arroz|pollo|carne|pan\b|galleta/,/receta|cocina/],[/pint|acuarel|oleo|lienzo|pincel|acrilic|dibuj|boceto/,/pint|arte|dibujo/],
  [/casa|hogar|limpi|plomer|jardin|mueble|cocina integral|lavadora|humedad|bricolaje/,/casa|hogar/],[/bacteri|microb|cepa|antibiot|resistencia|patogen|cultivo/,/microbio/],
  [/enzim|protein|metabol|bioquim|cinetica|lipid|aminoac|glucolisis|atp\b/,/bioqu/],[/adn|dna|rna|arn|gen\b|genes|genom|pcr|plasmid|crispr|clonac|secuenc|transcrip/,/molecular|genom|biolog/],
  [/truco|tip\b|tips|consejo|hack/,/truco|tip/],[/noticia|politic|gobierno|elecci/,/noticia/]];
function sugerirCol(t){const cols=[...new Set((S.biblio||[]).map(x=>x.coleccion).filter(Boolean))];if(!cols.length)return"";const n=normK(t);
  for(const [a,b] of SEMILLAS)if(a.test(n)){const c=cols.find(c=>b.test(normK(c)));if(c)return c}
  const tok=new Set(n.replace(/https?:\/\/\S+/g," ").split(/[^a-zñ0-9]+/).filter(w=>w.length>=4&&!STOPB.has(w)));if(!tok.size)return"";
  const sc={};for(const x of S.biblio||[]){if(!x.coleccion||bloqB(x))continue;const w=new Set(normK(x.titulo+" "+(x.texto||"").slice(0,400)+" "+x.etiquetas.join(" ")).split(/[^a-zñ0-9]+/));let s=0;for(const k of tok)if(w.has(k))s++;if(s)sc[x.coleccion]=(sc[x.coleccion]||0)+s}
  const top=Object.entries(sc).sort((a,b)=>b[1]-a[1]);return top.length&&top[0][1]>=2&&(!top[1]||top[0][1]>top[1][1])?top[0][0]:""}
// ---------------------------------------------------------------- captura rápida: DOI, PMID, PMC, redes, enlaces, ideas
let BQ_COL=null;
function previewBQ(){const t=($("#bq0")||{}).value||"",el=$("#bqP");if(!el)return null;if(!t.trim()){el.textContent="Pega un DOI, PMID, PMC o enlace (PubMed, Facebook, Instagram, X, Threads, YouTube, noticias…) o escribe una idea. Los artículos traen sus datos solos.";BQ_COL=null;return null}
  const doi=normDOI(t),pmid=doi?"":normPMID(t),pmc=doi||pmid?"":normPMC(t),url=(t.match(/https?:\/\/\S+/)||[])[0]||"",f=url?fuenteDe(url):null,tipo=doi||pmid||pmc?"referencia":url?"enlace":t.length>280?"nota":"idea",E=menciones(t).filter(m=>m.tipo==="tema").map(m=>m.nombre);
  if(BQ_COL===null||BQ_COL.t!==t)BQ_COL={t,c:sugerirCol(t),on:true};
  el.innerHTML=`${bIco(tipo)} <b>${esc(bTipoNom(tipo))}</b>${doi?` · DOI ${esc(doi)}`:pmid?` · PMID ${esc(pmid)}`:pmc?` · ${esc(pmc)}`:""}${doi||pmid||pmc?" (al guardar traigo título, autores y revista)":f?` · ${f.ico} ${esc(f.nom)}`:""}${E.length?" · "+E.map(e=>"#"+esc(e)).join(" "):""}
    ${BQ_COL.c?` · <a href="#" id="bqCol" class="chip ${BQ_COL.on?"":"muted"}" title="Toca para quitar o poner">📂 ${esc(BQ_COL.c)}${BQ_COL.on?" ✓":""}</a>`:""}`;
  if($("#bqCol"))$("#bqCol").onclick=ev=>{ev.preventDefault();BQ_COL.on=!BQ_COL.on;previewBQ()};return{t,doi,pmid,pmc,url,tipo}}
async function capturarBiblio(t,op={}){t=String(t||"").trim();if(!t)return null;const ah=new Date().toISOString(),doi=normDOI(t),pmid=doi?"":normPMID(t),pmc=doi||pmid?"":normPMC(t),url=(t.match(/https?:\/\/\S+/)||[])[0]||"";
  const tipo=doi||pmid||pmc?"referencia":url&&t.replace(url,"").trim().length<3?"enlace":url?"enlace":t.length>280?"nota":"idea";
  const x={id:uid(),tipo,titulo:"",texto:t,url,doi,autores:[],anio:"",revista:"",vol:"",num:"",pags:"",editorial:"",etiquetas:[],coleccion:op.coleccion||"",estado:tipo==="referencia"||tipo==="enlace"?"por leer":"",vence:"",fijado:false,adjuntos:[],creado:ah,editado:"",versiones:[]};
  try{if(doi){status("Buscando el DOI…");const d=await traerDOI(doi);Object.assign(x,d,{texto:t.replace(/\S*10\.\d{4,9}\/\S+/,"").trim()})}
    else if(pmid||pmc){status("Buscando en PubMed…");const d=await traerPM(pmid||pmc);const resto=t.replace(/https?:\/\/\S+/,"").replace(/\bPMID\s*:?\s*\d+|\bPMC\s?\d+/ig,"").trim();
      Object.assign(x,{titulo:d.titulo,autores:d.autores,anio:d.anio,revista:d.revista,vol:d.vol,num:d.num,pags:d.pags,doi:/^10\.\d{4,9}\/\S+$/.test(d.doi)?d.doi:"",url:d.url||url,texto:[resto,idsTexto(d),d.resumen?"**Resumen:** "+d.resumen:""].filter(Boolean).join("\n\n")})}}
  catch(e){aviso(e.message)}finally{status("")}
  if(!x.titulo){const resto=url?t.replace(url,"").trim():"";x.titulo=url?(resto.split("\n")[0].slice(0,120)||tituloRed(url)||url.replace(/^https?:\/\/(www\.)?/,"").slice(0,120)):t.split("\n")[0].replace(RE_WIKI,"$1").slice(0,120);if(url&&!resto)x.texto=url}
  (S.biblio=S.biblio||[]).push(x);asegurarFichas(x.texto);changed();return x}
async function guardarBQ(){const p=previewBQ();if(!p)return;const col=BQ_COL&&BQ_COL.on?BQ_COL.c:"";$("#bqG").disabled=true;const x=await capturarBiblio(p.t,{coleccion:col});$("#bq0").value="";BQ_COL=null;render();
  deshacer("Guardado en la biblioteca"+(x&&x.coleccion?" · 📂 "+x.coleccion:""),()=>{S.biblio=S.biblio.filter(y=>y.id!==x.id);changed();render()})}
// ---------------------------------------------------------------- orden y grupos
function ordenarB(L){const k=BV.orden,d=BV.desc?-1:1,s=(a,b)=>String(a||"").localeCompare(String(b||""),"es",{numeric:true});const f={reciente:(a,b)=>(b.editado||b.creado).localeCompare(a.editado||a.creado),creado:(a,b)=>b.creado.localeCompare(a.creado),
  titulo:(a,b)=>s(a.titulo,b.titulo),anio:(a,b)=>s(b.anio,a.anio),autor:(a,b)=>s(a.autores[0]||"~",b.autores[0]||"~"),tipo:(a,b)=>s(bTipoNom(a.tipo),bTipoNom(b.tipo)),coleccion:(a,b)=>s(a.coleccion||"~",b.coleccion||"~"),estado:(a,b)=>BESTADOS.indexOf(a.estado)-BESTADOS.indexOf(b.estado)}[k]||((a,b)=>0);
  return L.slice().sort((a,b)=>(b.fijado-a.fijado)||d*f(a,b))}
function claveGrupo(x){const g=BV.grupo;if(g==="coleccion")return[x.coleccion||"(sin colección)"];if(g==="tipo")return[bIco(x.tipo)+" "+bTipoNom(x.tipo)];if(g==="estado")return[x.estado||"(sin estado)"];if(g==="anio")return[x.anio||"(sin año)"];
  if(g==="mes"){const f=diaLocal(x.creado);return[f.slice(0,7)]}if(g==="fuente"){const f=x.url?fuenteDe(x.url):null;return[f?f.ico+" "+f.nom:x.doi?"🔬 DOI":"✍️ Escrito por ti"]}if(g==="etiqueta"){const E=etiquetasDe(x);return E.length?E.map(e=>"#"+e):["(sin etiqueta)"]}return[""]}
function agruparB(L){if(!BV.grupo)return[["",L]];const m=new Map();for(const x of L)for(const k of claveGrupo(x)){if(!m.has(k))m.set(k,[]);m.get(k).push(x)}
  return[...m.entries()].sort((a,b)=>BV.grupo==="mes"||BV.grupo==="anio"?b[0].localeCompare(a[0]):a[0].startsWith("(")-b[0].startsWith("(")||a[0].localeCompare(b[0],"es"))}
// ---------------------------------------------------------------- piezas de cada vista
const fuenteHtml=x=>{const f=x.url&&!x.doi?fuenteDe(x.url):null;return f?`<span class="bvsrc" title="${esc(f.host)}">${f.ico} ${esc(f.nom)}</span>`:""};
const metaB=x=>[x.autores.length?x.autores.slice(0,3).map(a=>a.split(",")[0]).join(", ")+(x.autores.length>3?" et al.":""):"",x.revista||x.editorial,x.anio].filter(Boolean).join(" · ");
const chk=x=>BV.selOn?`<input type="checkbox" class="bvchk" data-bvs="${esc(x.id)}" ${BV.sel.has(x.id)?"checked":""}>`:"";
const tituloB=x=>bloqB(x)?`🔒 ${x.titulo?esc(x.titulo):"••••••"}`:`${bIco(x.tipo)} ${esc(x.titulo||"(sin título)")}`;
const extracto=(x,n)=>bloqB(x)?"":esc(String(x.texto||"").replace(/https?:\/\/\S+/g,"").replace(/[*_=`>#\[\]]+/g,"").replace(/\s+/g," ").trim().slice(0,n));
const etqHtml=(x,max)=>{const E=bloqB(x)?[]:etiquetasDe(x);return(x.coleccion&&!bloqB(x)?`<span class="chip">📂 ${esc(x.coleccion)}</span> `:"")+E.slice(0,max||6).map(e=>`<span class="bvtag">#${esc(e)}</span>`).join(" ")};
const imgDe=x=>bloqB(x)?null:(x.adjuntos||[]).find(a=>a.tipo!=="enlace"&&/^image\//.test(a.mime||""));
function filaLista(x){return`<div class="bvrow ${BV.sel.has(x.id)?"sel":""} ${BV.lect===x.id?"act":""}" data-bvo="${esc(x.id)}">${chk(x)}<div class="bvc"><div class="bvt">${tituloB(x)}${x.fijado?" 📌":""}</div>
   <div class="small muted bvm">${bloqB(x)?"Privada":[fuenteHtml(x),esc(metaB(x))].filter(Boolean).join(" · ")||extracto(x,90)}</div><div class="small">${etqHtml(x,4)}</div></div>
   <div class="bvr small">${x.estado&&!bloqB(x)?`<span class="chip">${esc(x.estado)}</span>`:""}<span class="muted">${esc(fechaCorta(diaLocal(x.creado)))}</span>${(x.adjuntos||[]).length&&!bloqB(x)?`<span class="muted">📎${x.adjuntos.length}</span>`:""}</div></div>`}
function cuadro(x){const im=imgDe(x),f=x.url?fuenteDe(x.url):null;return`<div class="bvcard ${BV.sel.has(x.id)?"sel":""} t-${x.tipo}" data-bvo="${esc(x.id)}">${chk(x)}
   <div class="bvth" ${im?`data-th="${esc(im.sha)}"`:""}>${im?"":`<span>${bloqB(x)?"🔒":f&&!x.doi?f.ico:bIco(x.tipo)}</span>`}</div>
   <div class="bvcb"><div class="bvt">${tituloB(x)}${x.fijado?" 📌":""}</div><div class="small muted">${bloqB(x)?"Privada":[fuenteHtml(x),esc(metaB(x))].filter(Boolean).join(" · ")}</div>
   <div class="bvex small">${extracto(x,170)}</div><div class="small bvft">${etqHtml(x,3)}${x.estado&&!bloqB(x)?` <span class="chip">${esc(x.estado)}</span>`:""}</div></div></div>`}
const COLS_T=[["titulo","Título"],["tipo","Tipo"],["autor","Autores / fuente"],["anio","Año"],["coleccion","Colección"],["etq","Etiquetas"],["estado","Estado"],["creado","Guardado"]];
function tabla(L){const th=([k,l])=>`<th ${k==="etq"?"":`data-bvord="${k}"`} class="${BV.orden===k?"on":""}">${l}${BV.orden===k?(BV.desc?" ▲":" ▼"):""}</th>`;
  return`<div class="bvtabw"><table class="bvtab"><thead><tr>${BV.selOn?`<th><input type="checkbox" id="bvTodo"></th>`:""}${COLS_T.map(th).join("")}</tr></thead><tbody>${L.map(x=>`<tr data-bvo="${esc(x.id)}" class="${BV.sel.has(x.id)?"sel":""} ${BV.lect===x.id?"act":""}">${BV.selOn?`<td>${chk(x)}</td>`:""}
   <td class="bvtt">${tituloB(x)}${x.fijado?" 📌":""}</td><td>${bIco(x.tipo)} <span class="small">${esc(bTipoNom(x.tipo).split(" /")[0])}</span></td><td class="small">${bloqB(x)?"":fuenteHtml(x)||esc(x.autores.slice(0,2).map(a=>a.split(",")[0]).join(", ")+(x.autores.length>2?" et al.":"")||x.revista)}</td>
   <td>${bloqB(x)?"":esc(x.anio)}</td><td class="small">${bloqB(x)?"":esc(x.coleccion)}</td><td class="small">${etqHtml({...x,coleccion:""},3)}</td><td class="small">${bloqB(x)?"":esc(x.estado)}</td><td class="small muted">${esc(fechaCorta(diaLocal(x.creado)))}</td></tr>`).join("")}</tbody></table></div>`}
function ficha(x){if(bloqB(x))return`<div class="bvfich" data-bvo="${esc(x.id)}">${chk(x)}<b>${tituloB(x)}</b></div>`;const ref=x.doi||x.autores.length;
  return`<div class="bvfich ${BV.sel.has(x.id)?"sel":""} ${BV.lect===x.id?"act":""}" data-bvo="${esc(x.id)}">${chk(x)}<div class="bvfh"><b>${tituloB(x)}</b><span class="sp"></span>${x.estado?`<span class="chip">${esc(x.estado)}</span>`:""}</div>
   ${ref?`<div class="bvcita">${esc(refAPA(x))}</div>`:x.url?`<div class="small">${fuenteHtml(x)} <span class="muted">${esc(x.url.replace(/^https?:\/\/(www\.)?/,"").slice(0,80))}</span></div>`:""}
   ${extracto(x,320)?`<div class="small bvex2">${extracto(x,320)}</div>`:""}<div class="small">${etqHtml(x,8)}</div></div>`}
function tablero(L){const cols=["por leer","leyendo","leído",""];return`<div class="bvkan">${cols.map(e=>{const C=L.filter(x=>(x.estado||"")===e&&!bloqB(x));return`<div class="bvcol" data-bvest="${e}"><div class="bvch"><b>${e?esc(e[0].toUpperCase()+e.slice(1)):"Sin estado"}</b> <span class="muted small">${C.length}</span></div>
   ${C.slice(0,BV.n).map(x=>`<div class="bvk" draggable="true" data-bvo="${esc(x.id)}" data-bvk="${esc(x.id)}">${chk(x)}<div class="bvt">${tituloB(x)}</div><div class="small muted">${[fuenteHtml(x),esc(metaB(x))].filter(Boolean).join(" · ")}</div><div class="small">${etqHtml(x,2)}</div>
   <div class="bvkb">${cols.filter(c=>c!==e).map(c=>`<button class="b s" data-bvmv="${esc(x.id)}|${c}" title="Mover a ${c||"sin estado"}">${c?c.replace("por leer","📥").replace("leyendo","📖").replace("leído","✅"):"∅"}</button>`).join("")}</div></div>`).join("")}</div>`}).join("")}</div>`}
// ---------------------------------------------------------------- lector al lado
function lectorB(x){if(!x)return`<div class="small muted" style="padding:20px">Elige un elemento para leerlo aquí.</div>`;
  if(bloqB(x))return`<h3>${tituloB(x)}</h3><button class="b p" data-bvab="${esc(x.id)}">🔒 Abrir con PIN</button>`;const E=etiquetasDe(x);
  return`<div class="bvlh"><h3 style="margin:0">${tituloB(x)}</h3><span class="sp"></span><button class="b s" data-bvcerr title="Cerrar">✕</button></div>
   <div class="small muted">${esc(bTipoNom(x.tipo))}${x.coleccion?" · 📂 "+esc(x.coleccion):""}${x.estado?" · "+esc(x.estado):""}</div>${metaB(x)?`<div class="small">${esc(metaB(x))}${x.vol?" · vol. "+esc(x.vol):""}${x.pags?" · "+esc(x.pags):""}</div>`:""}
   ${x.doi?`<div class="small"><a href="https://doi.org/${esc(x.doi)}" target="_blank" rel="noopener noreferrer">doi:${esc(x.doi)}</a></div>`:x.url?`<div class="small">${fuenteHtml(x)} <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.url.replace(/^https?:\/\//,"").slice(0,70))}</a></div>`:""}
   ${E.length?`<div style="margin:6px 0">${E.map(e=>`<a href="#" class="men tem" data-men="tema|${esc(e)}">#${esc(e)}</a>`).join(" ")}</div>`:""}
   <div class="filters" style="margin:8px 0"><button class="b s p" data-bvsh="${esc(x.id)}">📤 Compartir</button><button class="b s" data-bved="${esc(x.id)}">✏️ Editar</button><button class="b s" data-bvver="${esc(x.id)}">↗ Abrir</button></div>
   <div class="mdv">${x.texto?mdB(x.texto):'<p class="muted small">Sin notas.</p>'}</div>${galeria(x)}`}
// ---------------------------------------------------------------- la vista principal
function vTodoB(){const L0=ordenarB(filtrarB()),cols=[...new Set((S.biblio||[]).map(x=>x.coleccion).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es")),etqs=[...new Set((S.biblio||[]).flatMap(etiquetasDe))].sort((a,b)=>a.localeCompare(b,"es"));
  if(TB.vista==="leer"&&!TB.estado)TB.estado="por leer";const M=modoB(),lado=conLector()&&["lista","tabla","fichas"].includes(M)&&BV.lect&&L0.some(x=>x.id===BV.lect),side=innerWidth>=1180;
  const L=M==="tablero"?L0:L0.slice(0,BV.n);let cuerpo="";
  if(M==="tablero")cuerpo=tablero(L);else for(const [g,G] of agruparB(L)){const h=g?`<div class="bvgh">${esc(g)} <span class="muted small">${G.length}</span></div>`:"";
    cuerpo+=h+(M==="tabla"?tabla(G):M==="tarjetas"?`<div class="bvgrid">${G.map(cuadro).join("")}</div>`:M==="fichas"?`<div class="bvfichas">${G.map(ficha).join("")}</div>`:`<div class="bvlist">${G.map(filaLista).join("")}</div>`)}
  const cnt=(arr,f)=>{const c={};for(const x of S.biblio||[])for(const k of f(x))c[k]=(c[k]||0)+1;return arr.map(k=>[k,c[k]||0])};
  const lateral=side?`<aside class="bvside"><div class="small"><b>📂 Colecciones</b></div><a href="#" class="bvsl ${!TB.col?"on":""}" data-bvcol="">Todas <span>${(S.biblio||[]).length}</span></a>${cnt(cols,x=>x.coleccion?[x.coleccion]:[]).map(([k,n])=>`<a href="#" class="bvsl ${TB.col===k?"on":""}" data-bvcol="${esc(k)}">${esc(k)} <span>${n}</span></a>`).join("")}
     <div class="small" style="margin-top:10px"><b>🏷 Etiquetas</b></div>${cnt(etqs,x=>bloqB(x)?[]:etiquetasDe(x)).sort((a,b)=>b[1]-a[1]).slice(0,40).map(([k,n])=>`<a href="#" class="bvsl ${claveF(TB.etq)===claveF(k)?"on":""}" data-bvetq="${esc(k)}">#${esc(k)} <span>${n}</span></a>`).join("")}</aside>`:"";
  const nf=[TB.tipo,TB.etq,TB.col,TB.estado].filter(Boolean).length;
  return`<div class="filters bvf ${BV.fil?"abierta":""}"><input id="bB" placeholder="🔎 Buscar en títulos, textos, autores, archivos…" value="${esc(TB.q)}" style="flex:1;min-width:170px">
    <select id="bFt"><option value="">Todo tipo</option>${Object.entries(BTIPOS).map(([k,[i,l]])=>`<option value="${k}" ${TB.tipo===k?"selected":""}>${i} ${esc(l)}</option>`).join("")}</select>
    <select id="bFe"><option value="">Toda etiqueta</option>${etqs.map(e=>`<option ${claveF(TB.etq)===claveF(e)?"selected":""}>${esc(e)}</option>`).join("")}</select>
    <select id="bFc"><option value="">Toda colección</option>${cols.map(c=>`<option ${TB.col===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select id="bFs">${BESTADOS.map(e=>`<option value="${e}" ${TB.estado===e?"selected":""}>${e||"Cualquier estado"}</option>`).join("")}</select><button class="b s bvfbtn ${nf?"p":""}" id="bvFil">⚙ Filtros${nf?" ("+nf+")":""}</button></div>
   <div class="filters bvbar"><div class="seg">${Object.entries(BV_MODOS).map(([k,[i,l]])=>`<button data-bvm="${k}" class="${M===k?"on":""}" title="${l}">${i}<span class="bvml"> ${l}</span></button>`).join("")}</div>
    ${M!=="tablero"?`<select id="bvG" title="Agrupar"><option value="">Sin agrupar</option>${[["coleccion","Por colección"],["etiqueta","Por etiqueta"],["tipo","Por tipo"],["fuente","Por fuente"],["estado","Por estado"],["anio","Por año"],["mes","Por mes guardado"]].map(([k,l])=>`<option value="${k}" ${BV.grupo===k?"selected":""}>${l}</option>`).join("")}</select>`:""}
    <select id="bvO" title="Ordenar">${[["reciente","Recientes"],["creado","Guardado"],["titulo","Título A-Z"],["autor","Autor"],["anio","Año"],["tipo","Tipo"],["coleccion","Colección"],["estado","Estado"]].map(([k,l])=>`<option value="${k}" ${BV.orden===k?"selected":""}>${l}</option>`).join("")}</select>
    <button class="b s ${BV.selOn?"p":""}" id="bvSel">☑ Seleccionar</button><span class="sp"></span><span class="small muted">${L0.length} elementos</span>
    ${L0.length?`<button class="b s" id="bExp" title="Exportar lo filtrado">📤</button>${L0.some(x=>x.doi||x.autores.length)?'<button class="b s" id="bBib">📚 BibTeX</button>':""}`:""}</div>
   ${BV.selOn?barraSel(L0):""}
   <div class="bvlay ${side?"side":""} ${lado?"lado":""}">${lateral}<div class="bvmain">${L0.length?cuerpo:'<div class="card vacio"><p>Aquí guardas lo que quieres volver a encontrar: artículos (DOI, PMID, PMC), enlaces de redes, recetas, trucos, ideas, PDF… Pega arriba, arrastra archivos o manda cosas desde la 📥 Bandeja.</p></div>'}
    ${M!=="tablero"&&L0.length>BV.n?`<div id="bvMas" class="small muted" style="text-align:center;padding:14px"><button class="b s" id="bvMasB">Mostrar más (${L0.length-BV.n})</button></div>`:""}</div>
    ${lado?`<div class="bvlect card" id="bvL">${lectorB(L0.find(x=>x.id===BV.lect))}</div>`:""}</div>`}
function barraSel(L){const n=BV.sel.size;return`<div class="selbar bvsel"><b>${n} seleccionado${n===1?"":"s"}</b><button class="b s" data-bva="todo">Todo (${L.length})</button>${n?`<button class="b s" data-bva="etq">🏷 Etiquetar</button><button class="b s" data-bva="col">📂 Colección</button><button class="b s" data-bva="est">Estado</button><button class="b s p" data-bva="sh">📤 Compartir</button><button class="b s" data-bva="zip">⬇ .zip</button><button class="b s" data-bva="del">🗑</button>`:""}<span class="sp"></span><button class="b s" data-bva="x">✕</button></div>`}
// ---------------------------------------------------------------- eventos
function selToggle(id,on){if(on??!BV.sel.has(id))BV.sel.add(id);else BV.sel.delete(id)}
function bindVistasB(){const v=$("#view");
  document.querySelectorAll("[data-bvm]").forEach(b=>b.onclick=()=>{if(esPC())BV.pc=b.dataset.bvm;else BV.cel=b.dataset.bvm;BV.n=60;bvGuarda();render()});
  if($("#bvG"))$("#bvG").onchange=()=>{BV.grupo=$("#bvG").value;bvGuarda();render()};$("#bvO").onchange=()=>{BV.orden=$("#bvO").value;BV.desc=false;bvGuarda();render()};
  if($("#bvFil"))$("#bvFil").onclick=()=>{BV.fil=!BV.fil;render()};
  $("#bvSel").onclick=()=>{BV.selOn=!BV.selOn;if(!BV.selOn)BV.sel.clear();render()};
  v.querySelectorAll("[data-bvord]").forEach(t=>t.onclick=()=>{const k=t.dataset.bvord;if(BV.orden===k)BV.desc=!BV.desc;else{BV.orden=k;BV.desc=false}bvGuarda();render()});
  if($("#bvTodo"))$("#bvTodo").onchange=()=>{const ids=[...v.querySelectorAll("[data-bvs]")].map(c=>c.dataset.bvs);ids.forEach(id=>selToggle(id,$("#bvTodo").checked));render()};
  v.querySelectorAll("[data-bvcol]").forEach(a=>a.onclick=ev=>{ev.preventDefault();TB.col=a.dataset.bvcol;render()});v.querySelectorAll("[data-bvetq]").forEach(a=>a.onclick=ev=>{ev.preventDefault();TB.etq=claveF(TB.etq)===claveF(a.dataset.bvetq)?"":a.dataset.bvetq;render()});
  // abrir / seleccionar (mantener presionado en el celular = seleccionar)
  v.querySelectorAll("[data-bvo]").forEach(el=>{let t=null,largo=false;
    el.addEventListener("pointerdown",ev=>{if(ev.pointerType==="mouse")return;largo=false;t=setTimeout(()=>{largo=true;BV.selOn=true;selToggle(el.dataset.bvo,true);if(navigator.vibrate)navigator.vibrate(20);render()},550)});
    ["pointerup","pointercancel","pointermove"].forEach(e=>el.addEventListener(e,ev=>{if(e==="pointermove"&&Math.abs(ev.movementX)+Math.abs(ev.movementY)<4)return;clearTimeout(t)}));
    el.onclick=ev=>{if(largo){largo=false;return}if(ev.target.closest("a,button,input,select,.men"))return;const id=el.dataset.bvo;if(BV.selOn){selToggle(id);render();return}
      const x=(S.biblio||[]).find(y=>y.id===id);if(conLector()&&["lista","tabla","fichas"].includes(modoB())&&!bloqB(x)){BV.lect=BV.lect===id&&!ev.detail?"":id;render();const L=$("#bvL");if(L&&innerWidth<1180)L.scrollIntoView({block:"nearest"});return}verB(id)}});
  v.querySelectorAll("[data-bvs]").forEach(c=>c.onchange=()=>{selToggle(c.dataset.bvs,c.checked);render()});
  v.querySelectorAll("[data-bva]").forEach(b=>b.onclick=()=>accionSel(b.dataset.bva));
  if($("#bvMasB"))$("#bvMasB").onclick=()=>{BV.n+=120;render()};
  const mas=$("#bvMas");if(mas&&"IntersectionObserver" in window){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();BV.n+=60;const y=scrollY;render();scrollTo(0,y)}},{rootMargin:"300px"});io.observe(mas)}
  // tablero: arrastrar entre columnas (PC) o botones (celular)
  v.querySelectorAll("[data-bvk]").forEach(k=>k.ondragstart=ev=>{ev.dataTransfer.setData("text/memphis-b",k.dataset.bvk);ev.dataTransfer.effectAllowed="move"});
  v.querySelectorAll("[data-bvest]").forEach(c=>{c.ondragover=ev=>{if([...ev.dataTransfer.types].includes("text/memphis-b")){ev.preventDefault();c.classList.add("over")}};c.ondragleave=()=>c.classList.remove("over");
    c.ondrop=ev=>{const id=ev.dataTransfer.getData("text/memphis-b");if(!id)return;ev.preventDefault();ev.stopPropagation();c.classList.remove("over");moverEstado(id,c.dataset.bvest)}});
  v.querySelectorAll("[data-bvmv]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();const [id,e]=b.dataset.bvmv.split("|");moverEstado(id,e)});
  // lector
  const L=$("#bvL");if(L){bindItems(L);if(typeof bindWiki==="function")bindWiki(L);L.querySelectorAll("[data-bvsh]").forEach(b=>b.onclick=()=>compartirB([b.dataset.bvsh]));L.querySelectorAll("[data-bved]").forEach(b=>b.onclick=()=>editarB(b.dataset.bved));
    L.querySelectorAll("[data-bvver]").forEach(b=>b.onclick=()=>verB(b.dataset.bvver));L.querySelectorAll("[data-bvab]").forEach(b=>b.onclick=()=>verB(b.dataset.bvab));if(L.querySelector("[data-bvcerr]"))L.querySelector("[data-bvcerr]").onclick=()=>{BV.lect="";render()};
    L.querySelectorAll("[data-tarea]").forEach(c=>c.onchange=()=>{const x=S.biblio.find(y=>y.id===BV.lect);const T=x.texto.split("\n"),i=+c.dataset.tarea;T[i]=T[i].replace(/\[( |x|X)\]/,c.checked?"[x]":"[ ]");guardarVersion(x,x.titulo,T.join("\n"));changed()})}
  miniaturas()}
async function miniaturas(){for(const el of [...document.querySelectorAll("#view [data-th]")]){const sha=el.dataset.th;let a=null;for(const x of S.biblio||[]){a=(x.adjuntos||[]).find(y=>y.sha===sha);if(a)break}if(!a)continue;
  try{const u=await urlAdj(a);if(!el.isConnected)return;el.style.backgroundImage=`url("${u}")`;el.classList.add("img")}catch(e){}}}
function moverEstado(id,e){const x=(S.biblio||[]).find(y=>y.id===id);if(!x||bloqB(x))return;const antes=x.estado;x.estado=e;x.editado=new Date().toISOString();changed();render();deshacer(`Movido a «${e||"sin estado"}»`,()=>{x.estado=antes;x.editado=new Date().toISOString();changed();render()})}
async function accionSel(a){const ids=[...BV.sel],X=ids.map(id=>(S.biblio||[]).find(y=>y.id===id)).filter(Boolean),ok=X.filter(x=>!bloqB(x)),ah=()=>new Date().toISOString();
  if(a==="x"){BV.selOn=false;BV.sel.clear();render();return}if(a==="todo"){ordenarB(filtrarB()).forEach(x=>BV.sel.add(x.id));render();return}
  if(a==="sh"){compartirB(ids);return}if(a==="zip"){zipB(X);return}
  if(a==="etq"){const t=prompt(`Etiquetas para ${ok.length} elemento(s), separadas por coma (antepón «-» para quitar):`,TB.etq||"");if(!t)return;const P=t.split(",").map(s=>s.trim().replace(/^#/,"")).filter(Boolean);
    for(const x of ok){for(const p of P){if(p.startsWith("-")){const q=claveF(p.slice(1).replace(/^#/,""));x.etiquetas=x.etiquetas.filter(e=>claveF(e)!==q)}else if(!x.etiquetas.some(e=>claveF(e)===claveF(p)))x.etiquetas.push(p)}x.editado=ah()}P.filter(p=>!p.startsWith("-")).forEach(p=>asegurarFichas("#["+p+"]"));changed();aviso("Etiquetas aplicadas");render();return}
  if(a==="col"){const cols=[...new Set((S.biblio||[]).map(x=>x.coleccion).filter(Boolean))];const t=prompt(`Colección para ${ok.length} elemento(s) (vacío = quitar).\nExistentes: ${cols.join(", ")||"—"}`,TB.col||"");if(t===null)return;for(const x of ok){x.coleccion=t.trim();x.editado=ah()}changed();aviso("Colección: "+(t.trim()||"ninguna"));render();return}
  if(a==="est"){dlg("Cambiar estado",`<div class="filters">${BESTADOS.map(e=>`<button class="b" data-bve="${e}">${e||"Sin estado"}</button>`).join("")}</div>`,[["Cancelar","",cerrar]]);
    document.querySelectorAll("[data-bve]").forEach(b=>b.onclick=()=>{for(const x of ok){x.estado=b.dataset.bve;x.editado=ah()}changed();cerrar();render()});return}
  if(a==="del"){if(!confirm(`¿Borrar ${X.length} elemento(s)? Quedan 30 días en la papelera.`))return;for(const x of X)borrarConPapelera("biblio",x.id);BV.sel.clear();render()}}
// ---------------------------------------------------------------- 📤 compartir / enviar a…
const sinMd=t=>limpiaMen(String(t||"")).replace(/\*\*|==|~~|`/g,"").replace(/^#{1,3}\s+/gm,"").replace(/^- \[x\] /gim,"✔ ").replace(/^- \[ \] /gm,"☐ ").replace(/\[\[([^\]]+)\]\]/g,"$1").replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,"$1 ($2)");
function textoB(x){const o=[x.titulo];const m=metaB(x);if(m)o.push(m);if(x.doi)o.push("https://doi.org/"+x.doi);else if(x.url&&!String(x.texto||"").includes(x.url))o.push(x.url);
  const t=sinMd(x.texto).trim();if(t&&t!==x.titulo)o.push("",t);const E=etiquetasDe(x);if(E.length)o.push("",E.map(e=>"#"+e.replace(/\s+/g,"")).join(" "));return o.join("\n")}
function mdUno(x){let s=`# ${x.titulo||"(sin título)"}\n\n`;const kv=[["Tipo",bTipoNom(x.tipo)],["Autores",x.autores.join("; ")],["Publicación",[x.revista||x.editorial,x.anio,x.vol&&"vol. "+x.vol,x.num&&"("+x.num+")",x.pags].filter(Boolean).join(" ")],["DOI",x.doi&&"https://doi.org/"+x.doi],["Enlace",!x.doi&&x.url],["Colección",x.coleccion],["Estado",x.estado],["Etiquetas",etiquetasDe(x).map(e=>"#"+e).join(" ")],["Guardado",diaLocal(x.creado)]];
  for(const [k,v] of kv)if(v)s+=`- **${k}:** ${v}\n`;if(x.texto)s+="\n"+limpiaMen(x.texto).replace(/\[\[([^\]]+)\]\]/g,"$1")+"\n";const A=(x.adjuntos||[]).filter(a=>a.tipo!=="enlace");if(A.length)s+="\n"+A.map(a=>`- 📎 adjuntos/${nomArchivo(a)}`).join("\n")+"\n";return s}
const nomArchivo=a=>String(a.original||a.nombre||"archivo").replace(/[\\/:*?"<>|]+/g,"_").slice(0,120);
function refRIS(x){const p=String(x.pags||"").split(/[-–]/);return[`TY  - ${x.tipo==="libro"?"BOOK":x.revista?"JOUR":"GEN"}`,...x.autores.map(a=>"AU  - "+a),"TI  - "+x.titulo,x.revista&&"JO  - "+x.revista,x.editorial&&"PB  - "+x.editorial,x.anio&&"PY  - "+x.anio,x.vol&&"VL  - "+x.vol,x.num&&"IS  - "+x.num,p[0]&&"SP  - "+p[0],p[1]&&"EP  - "+p[1],x.doi&&"DO  - "+x.doi,(x.doi?"https://doi.org/"+x.doi:x.url)&&"UR  - "+(x.doi?"https://doi.org/"+x.doi:x.url),"ER  - "].filter(Boolean).join("\r\n")}
async function archivosDe(X,max){const out=[];let tot=0;for(const x of X)for(const a of (x.adjuntos||[]).filter(a=>a.tipo!=="enlace")){if(max&&tot>max)break;try{const b=await bytesAdj(a,{silencio:true});tot+=b.length;out.push(new File([b],nomArchivo(a),{type:a.mime||"application/octet-stream"}))}catch(e){}}return out}
async function compartirB(ids){const X0=ids.map(id=>(S.biblio||[]).find(y=>y.id===id)).filter(Boolean);if(!X0.length)return;
  if(X0.some(bloqB)){if(typeof pedirPin!=="function"||!await pedirPin("Para compartir notas privadas, escribe tu PIN."))return;for(const x of X0)if(bloqB(x))await abrirEntrada(x,"biblio")}
  const X=X0,uno=X.length===1?X[0]:null,nAdj=X.reduce((a,x)=>a+(x.adjuntos||[]).filter(a=>a.tipo!=="enlace").length,0),ref=X.filter(x=>x.doi||x.autores.length),priv=X.some(x=>x.priv);
  const texto=()=>X.map(textoB).join("\n\n———\n\n"),titulo=uno?uno.titulo||"Nota":`${X.length} elementos de la biblioteca`,enlace=uno&&(uno.doi?"https://doi.org/"+uno.doi:uno.url);
  const B=(k,l,cl)=>`<button class="b ${cl||""}" data-shb="${k}">${l}</button>`;
  dlg("📤 Compartir",`<p><b>${esc(titulo)}</b>${nAdj?` · 📎 ${nAdj} archivo${nAdj>1?"s":""}`:""}</p>
   <div class="shgrid">${navigator.share?B("nat","📱 Enviar a… <span class='small muted'>(WhatsApp, Gmail, UpNote…)</span>","p"):""}${B("wa","💬 WhatsApp")}${B("mail","✉️ Correo")}${B("txt","📋 Copiar texto")}${B("md","📋 Copiar Markdown")}${enlace?B("url","🔗 Copiar enlace"):""}
    ${ref.length?B("apa","❝ Copiar cita APA")+B("bib","⬇ BibTeX")+B("ris","⬇ RIS (Zotero/Mendeley)"):""}${B("dmd",uno&&!nAdj?"⬇ Archivo .md":"⬇ .zip (Markdown + archivos)")}${B("pdf","🖨 PDF / imprimir")}${B("mas","⋯ Más formatos")}</div>
   ${nAdj&&navigator.share?`<label class="small"><input type="checkbox" id="shF" ${nAdj<=10?"checked":""}> Enviar también los archivos adjuntos (${nAdj})</label>`:""}
   <p class="small ${priv?"neg":"muted"}">${priv?"⚠️ Incluye notas 🔒 privadas: lo que envíes sale de Memphis sin cifrar.":"Lo que envíes sale de Memphis sin cifrar."}</p>`,[["Cerrar","",cerrar]]);
  const copia=async t=>{try{await navigator.clipboard.writeText(t);aviso("Copiado")}catch(e){prompt("Copia:",t)}};
  document.querySelectorAll("[data-shb]").forEach(b=>b.onclick=async()=>{const k=b.dataset.shb;try{
    if(k==="nat"){const t=texto();let files=[];if($("#shF")&&$("#shF").checked){status("Preparando archivos…");files=await archivosDe(X,60e6);status("")}
      const d={title:titulo,text:t};if(files.length&&navigator.canShare&&navigator.canShare({files}))d.files=files;else if(files.length)aviso("Este navegador no deja enviar archivos; va solo el texto.");await navigator.share(d);cerrar()}
    else if(k==="wa")window.open("https://wa.me/?text="+encodeURIComponent(texto().slice(0,6000)),"_blank","noopener");
    else if(k==="mail"){let t=texto();if(t.length>1800)t=t.slice(0,1800)+"\n\n[…texto recortado: usa «Enviar a…» o descarga el archivo para el contenido completo]";location.href="mailto:?subject="+encodeURIComponent(titulo)+"&body="+encodeURIComponent(t)}
    else if(k==="txt")await copia(texto());else if(k==="md")await copia(X.map(mdUno).join("\n\n---\n\n"));else if(k==="url")await copia(enlace);
    else if(k==="apa")await copia(ref.map(refAPA).join("\n\n"));else if(k==="bib")descargar(new Blob([ref.map(refBib).join("\n\n")],{type:"application/x-bibtex"}),"referencias_"+hoyISO()+".bib");
    else if(k==="ris")descargar(new Blob([ref.map(refRIS).join("\r\n\r\n")+"\r\n"],{type:"application/x-research-info-systems"}),"referencias_"+hoyISO()+".ris");
    else if(k==="dmd"){if(uno&&!nAdj)descargar(new Blob([mdUno(uno)],{type:"text/markdown;charset=utf-8"}),slug(uno.titulo||"nota").slice(0,60)+".md");else await zipB(X)}
    else if(k==="pdf"){status("Preparando…");const h=await htmlExport(X.map(b=>({k:"b",b})),titulo,"Exportado "+hoyISO()+" desde Memphis",{fotos:true,notas:true});status("");const w=window.open(URL.createObjectURL(new Blob([h],{type:"text/html"})),"_blank");if(w)setTimeout(()=>{try{w.print()}catch(e){}},900);else alert("El navegador bloqueó la ventana; usa «Más formatos» → Descargar.")}
    else if(k==="mas"){cerrar();exportarItems(X.map(b=>({k:"b",b})),titulo)}}
   catch(e){status("");if(e&&e.name==="AbortError")return;alert("No se pudo: "+e.message)}})}
// zip sin compresión (sirve para Notesnook, Obsidian, UpNote y cualquier editor de Markdown)
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRCT[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function zipar(files){const P=[],C=[];let off=0;const te=new TextEncoder();
  for(const f of files){const nm=te.encode(f.name),d=f.data,crc=crc32(d),h=new DataView(new ArrayBuffer(30)),c=new DataView(new ArrayBuffer(46));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nm.length,true);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    P.push(new Uint8Array(h.buffer),nm,d);C.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+d.length}
  const cs=C.reduce((a,b)=>a+b.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob([...P,...C,new Uint8Array(e.buffer)],{type:"application/zip"})}
async function zipB(X){X=X.filter(x=>!bloqB(x));if(!X.length){alert("No hay nada para exportar (las privadas cerradas no se incluyen).");return}status("Armando el .zip…");const te=new TextEncoder(),F=[],usados=new Set();
  const unico=n=>{let k=n,i=2;while(usados.has(k)){k=n.replace(/(\.[^.]+)?$/,m=>"_"+i+++m)}usados.add(k);return k};
  for(const x of X){F.push({name:unico(slug(x.titulo||"nota").slice(0,70)+".md"),data:te.encode(mdUno(x))});for(const a of (x.adjuntos||[]).filter(a=>a.tipo!=="enlace")){try{F.push({name:"adjuntos/"+unico(nomArchivo(a)),data:await bytesAdj(a,{silencio:true})})}catch(e){}}}
  if(X.some(x=>x.doi||x.autores.length))F.push({name:"referencias.bib",data:te.encode(X.filter(x=>x.doi||x.autores.length).map(refBib).join("\n\n"))});
  status("");descargar(zipar(F),"biblioteca_"+hoyISO()+".zip");aviso(`⬇ ${X.length} nota(s) en .zip`)}
// ---------------------------------------------------------------- enganches
window.addEventListener("load",()=>{
  const bb=window.bindBiblio;if(typeof bb==="function")window.bindBiblio=function(){const r=bb.apply(this,arguments);if($("#bvSel"))bindVistasB();return r};
  // botón «📤 Compartir» claro en la nota abierta
  const vb=window.verB;if(typeof vb==="function")window.verB=function(id){const r=vb.apply(this,arguments);const x=(S.biblio||[]).find(y=>y.id===id);const f=$("#dlgF");
    if(x&&!bloqB(x)&&f&&$("#dlg").open&&!f.querySelector("[data-shv]")){const b0=[...f.querySelectorAll("button")].find(b=>b.textContent.trim()==="📤");const nb=document.createElement("button");nb.className="b";nb.dataset.shv="1";nb.textContent="📤 Compartir";nb.onclick=()=>compartirB([x.id]);if(b0)b0.replaceWith(nb);else f.prepend(nb)}return r};
  // editor: el botón trae DOI, PMID o PMC
  const eb=window.editarB;if(typeof eb==="function")window.editarB=function(){const r=eb.apply(this,arguments);const btn=$("#bDoi");if(!btn)return r;btn.textContent="🔎 Traer datos (DOI / PMID / PMC)";const orig=btn.onclick;
    btn.onclick=async()=>{const u=$("#bU").value;if(normDOI(u)||!(normPMID(u)||normPMC(u)))return orig();try{btn.textContent="Buscando…";const d=await traerPM(normPMID(u)||normPMC(u));if(!$("#bT").value)$("#bT").value=d.titulo;$("#bA").value=d.autores.join("; ");$("#bR").value=d.revista;$("#bY").value=d.anio;$("#bV").value=d.vol;$("#bN").value=d.num;$("#bP").value=d.pags;
      $("#bU").value=d.doi?"https://doi.org/"+d.doi:d.url;const X=$("#bX");if(!X.value.includes(idsTexto(d)))X.value=[X.value.trim(),idsTexto(d),d.resumen&&!X.value.includes("Resumen")?"**Resumen:** "+d.resumen:""].filter(Boolean).join("\n\n");const t=document.querySelector('[data-btp="referencia"]');if(t)t.click();aviso("Datos traídos de PubMed")}
      catch(e){alert(e.message)}finally{btn.textContent="🔎 Traer datos (DOI / PMID / PMC)"}};
    const U=$("#bU");U.addEventListener("change",()=>{const u=U.value;if(!$("#bT").value.trim()&&/^https?:\/\//.test(u)&&!normDOI(u)&&!normPMID(u)&&!normPMC(u)){const t=tituloRed(u);if(t)$("#bT").value=t}});return r};
  // al cambiar el tamaño de la ventana (girar el celular) se recalcula la vista
  let rz=null,w0=innerWidth;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{if(Math.abs(innerWidth-w0)>60&&MOD==="bib"&&S&&!$("#dlg").open){w0=innerWidth;render()}},250)});
});
