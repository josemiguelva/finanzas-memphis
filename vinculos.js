// =====================================================================================================
// Memphis · RELACIONES. Cualquier cosa se liga con cualquier otra: un gasto, una nota o evento, un registro de salud,
// un vencimiento, un cobro recurrente, una persona, un lugar, un tema o un elemento de la biblioteca.
// Claves: "m:<id>" movimiento · "d:" diario · "s:" salud · "v:" vencimiento · "r:" recurrente · "f:" ficha · "b:" biblioteca.
// Los vínculos se guardan cifrados en S.vinculos, se sincronizan y se pueden quitar; los descartes evitan re-sugerir.
// =====================================================================================================
"use strict";
const RE_VK=/^[mdsvrfbpt]:[A-Za-z0-9_-]{1,64}$/;
const idVin=(a,b)=>{const [x,y]=[a,b].sort();return"vi_"+hashTxt(x+"|"+y)+hashTxt(y+"#"+x)};
function migrarVinculos(st,{ID}){const ah=new Date().toISOString(),s=(v,n)=>v==null?"":String(v).slice(0,n);
  st.vinculos=(Array.isArray(st.vinculos)?st.vinculos:[]).filter(x=>x&&RE_VK.test(String(x.a))&&RE_VK.test(String(x.b))&&x.a!==x.b).map(x=>({id:ID.test(String(x.id))?String(x.id):uid(),a:String(x.a),b:String(x.b),no:x.no===true,nota:s(x.nota,300),creado:RE_DT.test(String(x.creado))?String(x.creado):ah})).slice(-20000);
  // los gastos que Salud guardaba en r.movs pasan a ser vínculos (id fijo: dos equipos generan el mismo)
  for(const r of st.salud||[]){for(const mid of r.movs||[]){const a="s:"+r.id,b="m:"+mid,id=idVin(a,b);if(!st.vinculos.some(v=>v.id===id||(!v.no&&((v.a===a&&v.b===b)||(v.a===b&&v.b===a)))))st.vinculos.push({id,a,b,no:false,nota:"",creado:ah})}r.movs=[]}}
const huellaVi=v=>JSON.stringify([v.a,v.b,v.no,v.nota]);
const huellasVi=L=>{const o={};for(const v of L||[])o[v.id]=huellaVi(v);return o};

// ---------------------------------------------------------------- qué es cada clave
function itemDe(key){if(!RE_VK.test(key))return null;const k=key[0],id=key.slice(2);let o,t="",f="",sub="",ico="";
  if(k==="m"){o=S.mov.find(x=>x.id===id);if(!o)return null;t=o.estab||o.desc||o.concepto||"Movimiento";f=o.fecha;sub=`${fmt(o.valor)} · ${o.categoria||o.tipo}`;ico=typeof icoCat==="function"?icoCat(o.categoria||""):"💰"}
  else if(k==="d"){o=(S.diario||[]).find(x=>x.id===id);if(!o)return null;t=o.titulo||(o.texto||"").split("\n")[0].slice(0,80)||"Nota";f=o.fecha;sub=(o.hora||"")+(o.lugar?" · 📍 "+o.lugar:"");ico=o.tipo==="evento"?"📅":"📓"}
  else if(k==="s"){o=(S.salud||[]).find(x=>x.id===id);if(!o)return null;t=o.titulo;f=o.fecha;sub=o.personas.map(nomPer).join(", ");ico=sIco(o.tipo)}
  else if(k==="v"){o=(S.venc||[]).find(x=>x.id===id);if(!o)return null;t=o.titulo;f=o.vence;sub=o.tipo;ico="⏰"}
  else if(k==="r"){o=(S.rec||[]).find(x=>x.id===id);if(!o)return null;t=o.nombre;f="";sub="Cobro recurrente";ico="🔁"}
  else if(k==="f"){o=(S.fichas||[]).find(x=>x.id===id);if(!o)return null;t=o.nombre;sub=o.tipo==="persona"?(datosP(o).rel||"Persona"):o.tipo==="lugar"?"Lugar":"Tema";ico=o.tipo==="persona"?"👤":o.tipo==="lugar"?"📍":"🏷️"}
  else if(k==="b"){o=(S.biblio||[]).find(x=>x.id===id);if(!o)return null;t=o.titulo;f=diaLocal(o.creado);sub=typeof bTipoNom==="function"?bTipoNom(o.tipo):"Biblioteca";ico=typeof bIco==="function"?bIco(o.tipo):"📚"}
  else if(k==="p"){o=(S.proy||[]).find(x=>x.id===id);if(!o)return null;t=o.corto||o.nombre;f=o.inicio||"";sub="Proyecto · "+(o.corto?o.nombre+" · ":"")+(o.area||"");ico="🎯"}
  else if(k==="t"){o=(S.ptar||[]).find(x=>x.id===id);if(!o)return null;const p=(S.proy||[]).find(x=>x.id===o.proy);t=o.titulo;f=o.fin||o.inicio||"";sub=(typeof PT_TIPOS!=="undefined"&&PT_TIPOS[o.tipo]?PT_TIPOS[o.tipo][1]:"Tarea")+(p?" · "+(p.corto||p.nombre):"");ico=typeof PT_TIPOS!=="undefined"&&PT_TIPOS[o.tipo]?PT_TIPOS[o.tipo][0]:"☑️"}
  return{key,k,id,o,titulo:t,fecha:f,sub,ico}}
const gastoDe=m=>{const c=calc(m);return c.gasto||(/Gasto de otra cuenta|Gasto en efectivo/.test(m.tipo)?+m.valor||0:0)};
function ligados(key){const out=[],vistos=new Set();for(const v of S.vinculos||[]){if(v.no)continue;const o=v.a===key?v.b:v.b===key?v.a:null;if(!o||vistos.has(o))continue;vistos.add(o);const it=itemDe(o);if(it)out.push({...it,vin:v})}
  return out.sort((a,b)=>(a.fecha||"9").localeCompare(b.fecha||"9"))}
const nLigados=key=>ligados(key).length;
const descartado=(a,b)=>(S.vinculos||[]).some(v=>v.no&&((v.a===a&&v.b===b)||(v.a===b&&v.b===a)));
function ligar(a,b,no){if(a===b)return;S.vinculos=S.vinculos||[];const ex=S.vinculos.find(v=>(v.a===a&&v.b===b)||(v.a===b&&v.b===a));if(ex){if(ex.no===!!no)return;quitarVin(ex)}
  S.vinculos.push({id:uid(),a,b,no:!!no,nota:"",creado:new Date().toISOString()});changed()}
function quitarVin(v){S.vinculos=S.vinculos.filter(x=>x!==v);(S.eliminados=S.eliminados||[]).push({id:v.id,fecha:new Date().toISOString()})}
function desligar(a,b){for(const v of (S.vinculos||[]).filter(v=>!v.no&&((v.a===a&&v.b===b)||(v.a===b&&v.b===a))))quitarVin(v);changed()}
function costoDe(L){const m=L.filter(x=>x.k==="m"),tot=m.reduce((a,x)=>a+gastoDe(x.o),0),por={};for(const x of m){const c=x.o.categoria||"Otros";por[c]=(por[c]||0)+gastoDe(x.o)}return{tot,por,n:m.length}}

// ---------------------------------------------------------------- sugerencias automáticas
const RE_TRANS=/cabify|uber|didi|indriver|taxi|beat|picap|transmilenio|tullave|parqueadero|parking|peaje|gasolina|terpel|primax|texaco|biomax/i;
function sugerirVin(key){const it=itemDe(key);if(!it||!it.fecha)return[];const o=it.o,ini=it.fecha,fin=(o.fechaFin||it.fecha),a=masDias(ini,-2),b=masDias(fin,2),ya=new Set(ligados(key).map(x=>x.key)),c=[];
  const per=it.k==="s"?o.personas.map(n=>claveF(nomPer(n))):it.k==="d"?fichasDeEntrada(o).filter(f=>f.tipo==="persona").map(f=>claveF(f.nombre)):[];
  const lug=claveF(o.lugar||"");const dd=f=>Math.abs(diasS(ini,f)<0&&f<=fin?0:Math.min(Math.abs(diasS(ini,f)),Math.abs(diasS(fin,f))));
  const salud=it.k==="s"||(it.k==="d"&&/medic|cita|clinic|odonto|pediatr|terapia|examen|eps|salud|farmac|droguer/i.test(o.titulo+" "+o.texto));
  if(it.k!=="m")for(const m of S.mov){if(m.fecha<a||m.fecha>b||!(gastoDe(m)>0))continue;const t=[m.estab,m.desc,m.concepto,m.categoria].join(" ");let p=3-Math.min(3,dd(m.fecha));
    if(salud&&RE_SALUDMOV.test(t))p+=4;if(RE_TRANS.test(t)||/transporte/i.test(m.categoria||""))p+=(m.fecha>=ini&&m.fecha<=fin?3:0);if(lug&&normK(t).includes(lug.split(" ")[0])&&lug.length>3)p+=3;
    if(it.k==="d"&&o.tipo==="evento"&&m.fecha===ini&&/restaur|almuerzo|comida|cafe|mercado/i.test(t+" "+(o.titulo||"")))p+=2;if(p>=5)c.push({key:"m:"+m.id,p})}
  if(it.k!=="s")for(const r of S.salud||[]){if(r.fecha<a||r.fecha>b)continue;let p=3-Math.min(3,dd(r.fecha));if(per.length&&r.personas.some(x=>per.includes(claveF(nomPer(x)))))p+=3;if(lug&&claveF(r.lugar||"")===lug)p+=3;if(it.k==="m"&&RE_SALUDMOV.test([o.estab,o.desc,o.categoria].join(" ")))p+=3;if(it.k==="m"&&RE_TRANS.test([o.estab,o.desc].join(" "))&&r.fecha===ini&&r.tipo==="cita")p+=2;if(p>=5)c.push({key:"s:"+r.id,p})}
  if(it.k!=="d")for(const e of S.diario||[]){if(e.fecha<a||e.fecha>b)continue;let p=3-Math.min(3,dd(e.fecha));const pe=fichasDeEntrada(e).filter(f=>f.tipo==="persona").map(f=>claveF(f.nombre));if(per.length&&pe.some(x=>per.includes(x)))p+=3;if(lug&&claveF(e.lugar||"")===lug)p+=3;
    if(it.k==="m"&&e.tipo==="evento"&&e.fecha===ini&&(RE_TRANS.test([o.estab,o.desc].join(" "))||(e.lugar&&normK([o.estab,o.desc].join(" ")).includes(normK(e.lugar).split(" ")[0]))))p+=2;if(p>=5)c.push({key:"d:"+e.id,p})}
  return c.filter(x=>!ya.has(x.key)&&x.key!==key&&!descartado(key,x.key)).sort((x,y)=>y.p-x.p).slice(0,8).map(x=>({...itemDe(x.key),p:x.p}))}

// ---------------------------------------------------------------- panel «🔗 Relacionado» (va al final de cualquier diálogo)
let HISTVIN=[];
function filaVin(x,{quitar,ligar:lig}={}){return`<div class="vrow"><a href="#" class="vlink" data-vk="${esc(x.key)}"><span class="vico">${x.ico}</span><span><b>${esc(x.titulo)}</b><br><span class="small muted">${x.fecha?esc(fechaCorta(x.fecha))+" "+x.fecha.slice(0,4)+" · ":""}${esc(x.sub||"")}</span></span></a>${x.k==="m"?`<span class="vval">${fmt(gastoDe(x.o)||x.o.valor)}</span>`:""}${quitar?`<button class="b s" data-vq="${esc(x.key)}" title="Quitar la relación">✕</button>`:""}${lig?`<button class="b s p" data-vl="${esc(x.key)}">Ligar</button><button class="b s" data-vn="${esc(x.key)}" title="No sugerir otra vez">✕</button>`:""}</div>`}
function ponerRelaciones(key){const B=$("#dlgB");if(!B||!itemDe(key))return;let box=$("#relBox");if(!box){box=document.createElement("div");box.id="relBox";box.className="card relbox";B.appendChild(box)}box.dataset.key=key;pintarRel()}
function pintarRel(){const box=$("#relBox");if(!box)return;const key=box.dataset.key,L=ligados(key),sg=sugerirVin(key),c=costoDe(L),prev=HISTVIN.length?itemDe(HISTVIN[HISTVIN.length-1]):null;
  box.innerHTML=`<div class="ih"><b>🔗 Relacionado</b> <span class="small muted">${L.length||"nada aún"}</span><span class="sp"></span>${prev?`<button class="b s" id="vVolver">← ${esc(prev.titulo.slice(0,24))}</button>`:""}<button class="b s" id="vMas">+ Relacionar</button></div>
   ${c.n?`<div class="small vtot">💰 <b>${fmt(c.tot)}</b> en ${c.n} gasto${c.n>1?"s":""}${Object.keys(c.por).length>1?": "+Object.entries(c.por).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${esc(k)} ${fmt(v)}`).join(" · "):""}</div>`:""}
   ${L.map(x=>filaVin(x,{quitar:true})).join("")}
   ${sg.length?`<div class="small muted" style="margin-top:6px">¿Van con esto? (mismas fechas, persona, lugar o tipo de gasto)</div>${sg.map(x=>filaVin(x,{ligar:true})).join("")}`:""}
   <div id="vPick" hidden><input id="vQ" placeholder="🔎 Buscar gasto, nota, cita, vencimiento, persona, tema…" style="width:100%"><div id="vRes"></div></div>`;
  box.querySelectorAll("[data-vk]").forEach(a=>a.onclick=ev=>{ev.preventDefault();HISTVIN.push(key);if(HISTVIN.length>20)HISTVIN.shift();abrirItem(a.dataset.vk)});
  box.querySelectorAll("[data-vq]").forEach(b=>b.onclick=()=>{desligar(key,b.dataset.vq);pintarRel();deshacer("Relación quitada",()=>{ligar(key,b.dataset.vq);pintarRel()})});
  box.querySelectorAll("[data-vl]").forEach(b=>b.onclick=()=>{ligar(key,b.dataset.vl);pintarRel()});
  box.querySelectorAll("[data-vn]").forEach(b=>b.onclick=()=>{ligar(key,b.dataset.vn,true);pintarRel()});
  if($("#vVolver"))$("#vVolver").onclick=()=>abrirItem(HISTVIN.pop(),true);
  $("#vMas").onclick=()=>{const p=$("#vPick");p.hidden=!p.hidden;if(!p.hidden){buscaVin(key);$("#vQ").focus()}};$("#vQ").oninput=()=>buscaVin(key)}
function buscaVin(key){const q=normK($("#vQ").value),it=itemDe(key),f0=it&&it.fecha||hoyISO(),ya=new Set([key,...ligados(key).map(x=>x.key)]),res=[];
  const ok=t=>!q||q.split(/\s+/).every(w=>normK(t).includes(w)),cerca=f=>f?Math.abs(diasS(f0,f)):9999;
  for(const m of S.mov){const t=[m.estab,m.desc,m.concepto,m.categoria,m.nota,m.cuenta,String(m.valor)].join(" ");if((q||cerca(m.fecha)<=3)&&ok(t))res.push({key:"m:"+m.id,d:cerca(m.fecha)})}
  for(const e of S.diario||[]){if((q||cerca(e.fecha)<=3)&&ok([e.titulo,e.texto,e.lugar].join(" ")))res.push({key:"d:"+e.id,d:cerca(e.fecha)})}
  for(const p of S.proy||[])if(ok(p.nombre+" "+(p.corto||"")+" "+p.area+" "+(p.desc||"")))res.push({key:"p:"+p.id,d:q?0:5000});for(const t of S.ptar||[])if(q&&ok(t.titulo+" "+(t.desc||"")))res.push({key:"t:"+t.id,d:cerca(t.fin||t.inicio)});
  for(const r of S.salud||[]){if((q||cerca(r.fecha)<=3)&&ok([r.titulo,r.texto,r.personas.join(" "),r.sintomas.join(" "),r.lugar].join(" ")))res.push({key:"s:"+r.id,d:cerca(r.fecha)})}
  for(const v of S.venc||[])if(q&&ok([v.titulo,v.comercio,v.tipo].join(" ")))res.push({key:"v:"+v.id,d:cerca(v.vence)});
  for(const r of S.rec||[])if(q&&ok(r.nombre))res.push({key:"r:"+r.id,d:5000});
  for(const f of S.fichas||[])if(q&&ok([f.nombre,...f.alias].join(" ")))res.push({key:"f:"+f.id,d:-1});
  for(const b of S.biblio||[])if(q&&ok([b.titulo,b.texto,(b.etiquetas||[]).join(" ")].join(" ")))res.push({key:"b:"+b.id,d:6000});
  const L=res.filter(x=>!ya.has(x.key)).sort((a,b)=>a.d-b.d).slice(0,40).map(x=>itemDe(x.key)).filter(Boolean);
  $("#vRes").innerHTML=L.length?L.map(x=>`<div class="vrow"><span class="vico">${x.ico}</span><span style="flex:1"><b>${esc(x.titulo)}</b><br><span class="small muted">${x.fecha?esc(x.fecha)+" · ":""}${esc(x.sub||"")}</span></span>${x.k==="m"?`<span class="vval">${fmt(x.o.valor)}</span>`:""}<button class="b s p" data-vadd="${esc(x.key)}">Ligar</button></div>`).join(""):`<p class="small muted">${q?"Nada con esas palabras.":"Escribe para buscar en todo; sin texto muestro lo de esos días."}</p>`;
  $("#vRes").querySelectorAll("[data-vadd]").forEach(b=>b.onclick=()=>{ligar(key,b.dataset.vadd);const q0=$("#vQ").value;pintarRel();$("#vPick").hidden=false;$("#vQ").value=q0;buscaVin(key)})}
function abrirItem(key,volviendo){const it=itemDe(key);if(!it){aviso("Ese elemento ya no existe");return}cerrarSiAbierto();
  if(it.k==="m")editar(it.id);else if(it.k==="d")verD(it.id);else if(it.k==="s")verS(it.id);else if(it.k==="v")editarV(it.id);else if(it.k==="r")editarR(it.id);else if(it.k==="b"&&typeof verB==="function")verB(it.id);else if(it.k==="p"&&typeof abrirProyecto==="function")abrirProyecto(it.id);else if(it.k==="t"&&typeof editarTarea==="function")editarTarea(it.id);
  else if(it.k==="f"){TD.vista="fichas";TD.ficha=it.id;if(MOD!=="dia")irModulo("dia");else{syncTabsD();render()}}}
// el panel se agrega solo al abrir cualquiera de estos diálogos
(function(){const envolver=(nombre,k)=>{const f=window[nombre];if(typeof f!=="function")return;window[nombre]=function(id,...r){const out=f.call(this,id,...r);if(id&&typeof id==="string")setTimeout(()=>{if($("#dlg").open&&!$("#relBox"))ponerRelaciones(k+":"+id)},0);return out}};
  window.addEventListener("load",()=>{envolver("editar","m");envolver("verD","d");envolver("verS","s");envolver("editarV","v");envolver("editarR","r");envolver("verB","b")})})();
// tarjetas: «🔗 3 · $185.000»
function chipVin(key){const L=ligados(key);if(!L.length)return"";const c=costoDe(L);return`<span class="chip vchip" title="Relacionado">🔗 ${L.length}${c.tot?" · "+fmt(c.tot):""}</span>`}
// en fichas de persona, lugar o tema: lo ligado directamente
function ligadosFichaHtml(f){const L=ligados("f:"+f.id);if(!L.length)return"";const c=costoDe(L);
  return`<div class="card"><h2>🔗 Ligado a ${esc(f.nombre)}</h2>${c.n?`<div class="small vtot">💰 <b>${fmt(c.tot)}</b> en ${c.n} gastos</div>`:""}${L.map(x=>filaVin(x)).join("")}</div>`}
