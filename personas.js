// =====================================================================================================
// Memphis · ÁREA DE PERSONAS. Amplía las fichas @persona del Diario con datos de contacto, relación (papá, tía,
// jefe, estudiante de tesis…), grupo y cumpleaños; importa contactos del celular (.vcf) y exporta tarjetas.
// Las personas marcadas «en Salud» aparecen como parientes con perfil de salud. Todo vive cifrado en los datos.
// =====================================================================================================
"use strict";
const GRUPOS=[["familia cercana","👨‍👩‍👦 Familia cercana"],["familia","🏡 Familia"],["trabajo","💼 Trabajo"],["universidad","🎓 Universidad y estudiantes"],["amigos","🤝 Amigos"],["salud","🩺 Médicos y salud"],["servicios","🛠 Servicios"],["","👤 Otros"]];
const RELS=["yo","pareja","esposa","esposo","hijo","hija","papá","mamá","hermano","hermana","abuelo","abuela","tío","tía","primo","prima","sobrino","sobrina","suegro","suegra","cuñado","cuñada","nuera","yerno","padrino","madrina","jefe","jefa","colega","compañero de trabajo","estudiante de tesis","estudiante","tutor","asesor","coinvestigador","médico","pediatra","odontólogo","amigo","amiga","vecino","vecina"];
const PARIENTE=/^(yo|pareja|espos[oa]|hij[oa]|pap[aá]|mam[aá]|herman[oa]|abuel[oa]|t[ií][oa]|prim[oa]|sobrin[oa]|suegr[oa]|cuñad[oa]|nuera|yerno|padrino|madrina)$/i;
function normDatosP(d){d=d&&typeof d==="object"?d:{};const s=(v,n)=>v==null?"":String(v).slice(0,n).trim(),lst=(v,n,m)=>(Array.isArray(v)?v:[]).map(x=>s(x,n)).filter(Boolean).slice(0,m);
  const o={rel:s(d.rel,80),grupo:GRUPOS.some(g=>g[0]===d.grupo)?d.grupo:"",tel:lst(d.tel,40,8).map(t=>t.replace(/[^\d+()\- ]/g,"")).filter(Boolean),email:lst(d.email,200,6).filter(e=>/^[^\s@<>"]+@[^\s@<>"]+$/.test(e)),
    dir:s(d.dir,400),cumple:/^\d{4}-\d{2}-\d{2}$/.test(String(d.cumple||""))?String(d.cumple):"",org:s(d.org,200),cargo:s(d.cargo,200),web:/^https:\/\//i.test(String(d.web||""))?s(d.web,500):"",salud:d.salud===true};
  for(const k of Object.keys(o))if(o[k]===""||o[k]===false||(Array.isArray(o[k])&&!o[k].length))delete o[k];
  if(d.tesis&&typeof d.tesis==="object"){const T=d.tesis,fe=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||""))?String(v):"";o.tesis={titulo:s(T.titulo,300),programa:s(T.programa,200),inicio:fe(T.inicio),hitos:(Array.isArray(T.hitos)?T.hitos:[]).filter(x=>x&&typeof x==="object"&&s(x.n,200)).map(x=>({n:s(x.n,200),fecha:fe(x.fecha),hecho:x.hecho===true})).slice(0,40)}}
  return o}
const datosP=f=>(f&&f.datos)||{};
const grupoNom=g=>(GRUPOS.find(x=>x[0]===(g||""))||GRUPOS[GRUPOS.length-1])[1];
function proxCumple(c,desde){if(!c)return"";const md=c.slice(5),y=+desde.slice(0,4);let f=y+"-"+md;if(f<desde)f=(y+1)+"-"+md;return f}
function cumpleTxt(c){if(!c)return"";const [y,m,d]=c.split("-");const p=proxCumple(c,hoyISO());const falta=Math.round((dDe(p)-dDe(hoyISO()))/864e5);
  return`🎂 ${+d} ${MESL[+m-1].toLowerCase()}${y!=="0000"?` (${y})`:""} · ${falta===0?"¡hoy!":falta===1?"mañana":"en "+falta+" días"}${y!=="0000"?` cumple ${+p.slice(0,4)-+y}`:""}`}

// ---------------------------------------------------------------- vCard (.vcf)
function leerVCF(txt){const L=String(txt).replace(/\r\n?/g,"\n").replace(/\n[ \t]/g,"").replace(/=\n/g,"=").split("\n");const out=[];let c=null;
  const qp=v=>{try{return new TextDecoder().decode(new Uint8Array((v.match(/=[0-9A-F]{2}|[^=]/gi)||[]).map(x=>x.length===3?parseInt(x.slice(1),16):x.charCodeAt(0))))}catch(e){return v}};
  const un=v=>v.replace(/\\n/gi," ").replace(/\\([,;\\])/g,"$1").trim();
  for(const ln of L){const i=ln.indexOf(":");if(i<0)continue;const izq=ln.slice(0,i),val0=ln.slice(i+1),partes=izq.split(";"),prop=partes[0].replace(/^item\d+\./i,"").toUpperCase(),par=partes.slice(1).join(";").toUpperCase();
    const val=/ENCODING=QUOTED-PRINTABLE/.test(par)?qp(val0):val0;
    if(prop==="BEGIN"&&/VCARD/i.test(val)){c={fn:"",n:"",tel:[],email:[],dir:"",cumple:"",org:"",cargo:"",nota:"",alias:[],web:""};continue}
    if(!c)continue;if(prop==="END"){if(c.fn||c.n)out.push(c);c=null;continue}
    if(prop==="FN")c.fn=un(val);else if(prop==="N"){const [ap,no,ot]=val.split(";");c.n=un([no,ot,ap].filter(Boolean).join(" "))}
    else if(prop==="TEL")c.tel.push(un(val).replace(/^tel:/i,""));else if(prop==="EMAIL")c.email.push(un(val));else if(prop==="ADR"&&!c.dir)c.dir=un(val.split(";").filter(Boolean).join(", "));
    else if(prop==="BDAY"){const v=val.replace(/T.*$/,"");const m=v.match(/^(\d{4}|--)-?(\d{2})-?(\d{2})$/);if(m)c.cumple=`${m[1]==="--"?"0000":m[1]}-${m[2]}-${m[3]}`}
    else if(prop==="ORG")c.org=un(val.split(";").filter(Boolean).join(" · "));else if(prop==="TITLE")c.cargo=un(val);else if(prop==="NOTE")c.nota=un(val);
    else if(prop==="NICKNAME")c.alias.push(...un(val).split(",").map(x=>x.trim()).filter(Boolean));else if(prop==="URL"&&/^https:/i.test(val))c.web=un(val)}
  return out.map(c=>({...c,nombre:(c.fn||c.n).replace(/\s+/g," ").trim()})).filter(c=>c.nombre)}
function aVCF(f){const d=datosP(f),e=v=>String(v||"").replace(/\\/g,"\\\\").replace(/[,;]/g,c=>"\\"+c).replace(/\n/g,"\\n");
  return["BEGIN:VCARD","VERSION:3.0",`FN:${e(f.nombre)}`,`N:;${e(f.nombre)};;;`,...(f.alias.length?[`NICKNAME:${f.alias.map(e).join(",")}`]:[]),...(d.tel||[]).map(t=>`TEL;TYPE=CELL:${t}`),...(d.email||[]).map(m=>`EMAIL:${m}`),
    ...(d.dir?[`ADR:;;${e(d.dir)};;;;`]:[]),...(d.cumple?[`BDAY:${d.cumple.replace(/^0000/,"--")}`]:[]),...(d.org?[`ORG:${e(d.org)}`]:[]),...(d.cargo?[`TITLE:${e(d.cargo)}`]:[]),...(d.web?[`URL:${d.web}`]:[]),...(d.rel?[`NOTE:${e(d.rel)}`]:[]),"END:VCARD"].join("\r\n")}
function importarVCF(){elegirArchivo(".vcf,text/vcard,text/x-vcard",importarVCFArchivo)}
async function importarVCFArchivo(fl){if(fl.size>20*1048576){alert("Archivo muy grande");return}
  const C=leerVCF(await fl.text());if(!C.length){alert("No encontré contactos en ese archivo (.vcf).");return}
  const ex=c=>fichaDe(c.nombre,"persona")||c.alias.map(a=>fichaDe(a,"persona")).find(Boolean);
  dlg(`📇 ${C.length} contacto${C.length>1?"s":""} en el archivo`,`<p class="small">Marca los que quieras en Memphis. Los que ya existen se completan (no se borra nada). Desde el celular: Contactos › Compartir / Exportar › archivo .vcf.</p>
    <div class="filters"><input id="vcQ" placeholder="🔎 Filtrar" style="flex:1"><button class="b s" id="vcT">Marcar visibles</button><button class="b s" id="vcN">Ninguno</button></div>
    <div class="filters"><span class="small">Poner en el grupo</span><select id="vcG"><option value="-">(no cambiar)</option>${GRUPOS.map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select><input id="vcR" placeholder="Relación (opcional)" list="relL" style="width:150px"></div>
    <datalist id="relL">${RELS.map(r=>`<option value="${r}">`).join("")}</datalist>
    <div id="vcL" style="max-height:50vh;overflow:auto">${C.map((c,i)=>`<label class="it vcf" data-n="${esc(normK(c.nombre+" "+c.org+" "+c.tel.join(" ")))}" style="display:flex;gap:8px"><input type="checkbox" data-vc="${i}" ${C.length<=5?"checked":""}><span><b>${esc(c.nombre)}</b>${ex(c)?' <span class="chip">ya está</span>':""}<br><span class="small muted">${[c.tel[0],c.email[0],c.org,c.cumple&&"🎂 "+c.cumple].filter(Boolean).map(esc).join(" · ")}</span></span></label>`).join("")}</div>`,
   [["Cancelar","",cerrar],["Importar marcados","p",()=>{const sel=[...document.querySelectorAll("[data-vc]:checked")].map(x=>C[+x.dataset.vc]);if(!sel.length){alert("Marca al menos uno");return}
     const g=$("#vcG").value,rel=$("#vcR").value.trim(),ah=new Date().toISOString();let nv=0,ac=0;
     for(const c of sel){let f=ex(c);const d0={tel:c.tel,email:c.email,dir:c.dir,cumple:c.cumple,org:c.org,cargo:c.cargo,web:c.web};
       if(!f){f={id:uid(),nombre:c.nombre,tipo:"persona",alias:c.alias.slice(0,20),nota:c.nota||"",creado:ah,editado:"",datos:{}};(S.fichas=S.fichas||[]).push(f);nv++}else ac++;
       const d=f.datos=f.datos||{};for(const [k,v] of Object.entries(d0)){if(Array.isArray(v)){d[k]=[...new Set([...(d[k]||[]),...v])]}else if(v&&!d[k])d[k]=v}
       if(g!=="-")d.grupo=g;if(rel&&!d.rel)d.rel=rel;f.datos=normDatosP(d);f.editado=ah}
     changed();cerrar();aviso(`${nv} personas nuevas · ${ac} completadas`);TD.vista="fichas";TD.ficha="";render()}]]);$("#dlg").classList.add("ancho");
  const filtra=()=>{const q=normK($("#vcQ").value);document.querySelectorAll(".it.vcf").forEach(x=>x.hidden=!!q&&!x.dataset.n.includes(q))};$("#vcQ").oninput=filtra;
  $("#vcT").onclick=()=>document.querySelectorAll(".it.vcf:not([hidden]) [data-vc]").forEach(x=>x.checked=true);$("#vcN").onclick=()=>document.querySelectorAll("[data-vc]").forEach(x=>x.checked=false)}

// ---------------------------------------------------------------- vistas (las llama vFichas del Diario)
let TP={q:"",g:""};
function listaPersonasHtml(){const q=normK(TP.q),P=(S.fichas||[]).filter(f=>f.tipo==="persona"),T=(S.fichas||[]).filter(f=>f.tipo==="tema").sort((a,b)=>a.nombre.localeCompare(b.nombre));
  const ok=f=>{const d=datosP(f);const gq=TP.g==="~"?"":TP.g;return(!TP.g||(TP.g==="*salud"?d.salud:(d.grupo||"")===gq))&&(!q||normK([f.nombre,...f.alias,d.rel,d.org,d.cargo,(d.tel||[]).join(" "),(d.email||[]).join(" ")].join(" ")).includes(q))};
  const h0=hoyISO(),cum=P.filter(f=>datosP(f).cumple).map(f=>({f,p:proxCumple(datosP(f).cumple,h0)})).filter(x=>x.p<=masDias(h0,30)).sort((a,b)=>a.p.localeCompare(b.p));
  const fila=f=>{const d=datosP(f),u=usosFicha(f),ns=typeof esDe==="function"?(S.salud||[]).filter(r=>esDe(r,f.nombre)).length:0;
    return`<div class="it click" data-fi="${esc(f.id)}"><div class="ih"><b>👤 ${esc(f.nombre)}</b>${d.rel?`<span class="chip">${esc(d.rel)}</span>`:""}${d.salud?'<span class="chip" title="En Salud">🩺</span>':""}</div>
      <div class="small muted">${[d.cargo&&d.org?d.cargo+" · "+d.org:d.cargo||d.org,(d.tel||[])[0],u.ent.length&&u.ent.length+" en el diario",u.mov.length&&u.mov.length+" movimientos",ns&&ns+" de salud"].filter(Boolean).map(esc).join(" · ")}</div></div>`};
  const grupos=GRUPOS.map(([k,l])=>({k,l,L:P.filter(f=>(datosP(f).grupo||"")===k&&ok(f)).sort((a,b)=>a.nombre.localeCompare(b.nombre))})).filter(g=>g.L.length);
  return`<div class="filters"><input id="pQ" placeholder="🔎 Nombre, relación, empresa, teléfono…" value="${esc(TP.q)}" style="flex:1;min-width:180px"><select id="pG"><option value="">Todos los grupos</option>${GRUPOS.map(([k,l])=>`<option value="${k||"~"}" ${TP.g===(k||"~")?"selected":""}>${l}</option>`).join("")}<option value="*salud" ${TP.g==="*salud"?"selected":""}>🩺 Incluidas en Salud</option></select>
     <button class="b s" id="fNP">+ Persona</button><button class="b s" id="pVcf">📇 Importar contactos (.vcf)</button><button class="b s" id="fNT">+ Tema</button><button class="b s" id="fNL">+ Lugar</button></div>
   ${cum.length?`<div class="card"><h2>🎂 Cumpleaños próximos</h2>${cum.map(({f})=>`<div class="small click" data-fi="${esc(f.id)}"><b>${esc(f.nombre)}</b> · ${cumpleTxt(datosP(f).cumple)}</div>`).join("")}</div>`:""}
   <div class="g2"><div>${grupos.map(g=>`<div class="card"><h2>${g.l} <span class="small muted">${g.L.length}</span></h2>${g.L.map(fila).join("")}</div>`).join("")||'<div class="card"><p class="small muted">Nadie con ese filtro. Escribe @Nombre en una nota, crea una persona o importa tus contactos.</p></div>'}</div>
   <div><div class="card"><h2>📍 Lugares</h2>${lugares().sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(f=>`<div class="it click" data-fi="${esc(f.id)}"><b>📍 ${esc(f.nombre)}</b>${f.alias.length?` <span class="small muted">${f.alias.map(esc).join(", ")}</span>`:""}${datosP(f).dir?`<div class="small muted">${esc(datosP(f).dir)}</div>`:""}</div>`).join("")||'<p class="small muted">Define «mi casa», «mi trabajo», tu EPS… para que al escribir se llene el lugar solo.</p>'}</div>
   <div class="card"><h2>🏷️ Temas, proyectos y clases</h2>${T.map(f=>{const u=usosFicha(f);return`<div class="it click" data-fi="${esc(f.id)}"><b>🏷️ #${esc(f.nombre)}</b> <span class="small muted">${u.ent.length} entradas${u.mov.length?` · ${u.mov.length} movimientos`:""}</span></div>`}).join("")||'<p class="small muted">Escribe #Tema (o #[Matemáticas]) en una nota.</p>'}</div></div></div>`}
function bindListaPersonas(){const q=$("#pQ");if(q)q.oninput=()=>{TP.q=q.value;clearTimeout(q._t);q._t=setTimeout(()=>{render();const i=$("#pQ");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)};
  const g=$("#pG");if(g)g.onchange=()=>{TP.g=g.value==="~"?"~":g.value;render()};if($("#pVcf"))$("#pVcf").onclick=importarVCF;if($("#fNL"))$("#fNL").onclick=()=>editarLugar(null)}
function datosPersonaHtml(f){const d=datosP(f);if(f.tipo!=="persona")return"";const tel=d.tel||[];
  const filas=[["Relación",d.rel&&esc(d.rel)],["Grupo",esc(grupoNom(d.grupo))],["Teléfono",tel.map(t=>`<a href="tel:${esc(t.replace(/[^\d+]/g,""))}">${esc(t)}</a> <a href="https://wa.me/${esc(t.replace(/\D/g,"").replace(/^(\d{10})$/,"57$1"))}" target="_blank" rel="noopener noreferrer" title="WhatsApp">💬</a>`).join(" · ")],
    ["Correo",(d.email||[]).map(m=>`<a href="mailto:${esc(m)}">${esc(m)}</a>`).join(" · ")],["Trabajo",[d.cargo,d.org].filter(Boolean).map(esc).join(" · ")],["Dirección",d.dir&&esc(d.dir)],["Cumpleaños",d.cumple&&cumpleTxt(d.cumple)],["Web",d.web&&`<a href="${esc(d.web)}" target="_blank" rel="noopener noreferrer">${esc(d.web)}</a>`]].filter(x=>x[1]);
  return`<div class="kv small" style="margin-top:6px">${filas.map(([k,v])=>`<div><span class="muted">${k}</span> ${v}</div>`).join("")}</div>
   <div class="filters" style="margin-top:6px"><button class="b s" id="pVcfX">📇 Tarjeta .vcf</button>${d.salud?`<button class="b s" data-sperfil="${esc(f.nombre)}">🩺 Su salud</button>`:`<button class="b s" id="pSal">🩺 Incluir en Salud</button>`}</div>`}
function bindDatosPersona(f){if($("#pVcfX"))$("#pVcfX").onclick=()=>descargar(new Blob([aVCF(f)],{type:"text/vcard"}),slug(f.nombre)+".vcf");
  if($("#pSal"))$("#pSal").onclick=()=>{f.datos=normDatosP({...datosP(f),salud:true});f.editado=new Date().toISOString();changed();irPerfilS(f.nombre)}}
function editarPersona(f,nombre0){const nf=f||{id:uid(),nombre:nombre0||"",tipo:"persona",alias:[],nota:"",creado:new Date().toISOString(),editado:"",datos:{}};const d=datosP(nf);
  dlg(f?"Editar persona":"Nueva persona",`<label>Nombre</label><input id="fiN" value="${esc(nf.nombre)}" style="width:100%">
   <div class="filters"><label class="small">Relación <input id="pRel" value="${esc(d.rel||"")}" list="relL" placeholder="papá, tía, jefe, estudiante de tesis…" style="width:210px"></label><label class="small">Grupo <select id="pGr">${GRUPOS.map(([k,l])=>`<option value="${k}" ${(d.grupo||"")===k?"selected":""}>${l}</option>`).join("")}</select></label></div>
   <datalist id="relL">${RELS.map(r=>`<option value="${r}">`).join("")}</datalist>
   <label class="small"><input type="checkbox" id="pSa" ${d.salud?"checked":""}> 🩺 Incluir en Salud (pariente o persona cercana con historial de salud)</label>
   <label>Otros nombres (apodos, cómo aparece en el banco o en tus otras apps; separados por coma)</label><input id="fiA" value="${esc(nf.alias.join(", "))}" style="width:100%">
   <div class="filters"><input id="pTel" placeholder="Teléfono(s), separados por coma" value="${esc((d.tel||[]).join(", "))}" style="flex:1;min-width:160px"><input id="pMail" placeholder="Correo(s)" value="${esc((d.email||[]).join(", "))}" style="flex:1;min-width:160px"></div>
   <div class="filters"><input id="pOrg" placeholder="Empresa / institución" value="${esc(d.org||"")}" style="flex:1"><input id="pCar" placeholder="Cargo / programa" value="${esc(d.cargo||"")}" style="flex:1"></div>
   <div class="filters"><input id="pDir" placeholder="Dirección" value="${esc(d.dir||"")}" style="flex:2;min-width:180px"><label class="small">🎂 <input type="date" id="pCum" value="${d.cumple&&!d.cumple.startsWith("0000")?d.cumple:""}"></label><input id="pWeb" placeholder="https://…" value="${esc(d.web||"")}" style="flex:1;min-width:140px"></div>
   <label>Notas (Markdown; puedes mencionar a otras personas con @ y temas con #)</label><textarea id="fiNo" rows="6" style="width:100%">${esc(nf.nota)}</textarea>`,
   [...(f?[["Borrar","",()=>{if(!confirm("¿Borrar la persona? Las notas y registros no se borran; solo pierden el enlace."))return;S.fichas=S.fichas.filter(x=>x.id!==f.id);(S.eliminados=S.eliminados||[]).push({id:f.id,fecha:new Date().toISOString()});changed();cerrar();TD.ficha="";render()}]]:[]),["Cancelar","",cerrar],
    ["Guardar","p",()=>{const n=$("#fiN").value.trim();if(!n){alert("Pon un nombre");return}if(!f&&fichaDe(n,"persona")){alert("Ya existe una persona con ese nombre");return}
     if(f&&claveF(n)!==claveF(f.nombre)&&!nf.alias.some(a=>claveF(a)===claveF(f.nombre)))nf.alias.push(f.nombre);
     const lst=v=>v.split(/[,;]/).map(x=>x.trim()).filter(Boolean),cum=$("#pCum").value||(d.cumple&&d.cumple.startsWith("0000")?d.cumple:"");
     Object.assign(nf,{nombre:n,alias:[...new Set([...lst($("#fiA").value),...(f?nf.alias.filter(a=>claveF(a)===claveF(f.nombre)):[])])],nota:$("#fiNo").value,editado:new Date().toISOString(),
       datos:normDatosP({rel:$("#pRel").value,grupo:$("#pGr").value,salud:$("#pSa").checked,tel:lst($("#pTel").value),email:lst($("#pMail").value),org:$("#pOrg").value,cargo:$("#pCar").value,dir:$("#pDir").value,cumple:cum,web:$("#pWeb").value})});
     if(!f)(S.fichas=S.fichas||[]).push(nf);asegurarFichas(nf.nota);changed();cerrar();if(MOD==="sal"){render();return}TD.vista="fichas";TD.ficha=nf.id;render()}]]);setTimeout(()=>$("#fiN").focus(),30)}

// ---------------------------------------------------------------- atajos: «@yo», «@decana», «mi esposa»
const SINON=[["pareja","esposa","esposo","mujer","marido","novia","novio","companera","companero"],["papa","padre","papi"],["mama","madre","mami"],["jefe","jefa"],["decano","decana"],["director","directora"],["tutor","tutora"],["suegro","suegra"]];
const sinon=k=>{const g=SINON.find(g=>g.includes(k));return g?g:[k]};
const sinArt=s=>claveF(s).replace(/^(?:a\s+|con\s+|de\s+|para\s+)?(?:mi|mis|la|el|los|las|nuestra|nuestro|tu|su)\s+/,"");
function atajosP(f){const d=datosP(f),o=new Set();if(d.rel){const r=claveF(d.rel);o.add(r);for(const x of sinon(r))o.add(x)}
  if(d.cargo){const c=claveF(d.cargo);o.add(c);o.add(c.split(" de ")[0]);o.add(c.split(" ")[0])}return[...o].filter(x=>x.length>=2)}
function porAtajo(nombre){const k=sinArt(nombre);if(!k)return[];const P=(S.fichas||[]).filter(f=>f.tipo==="persona");
  if(k==="yo")return P.filter(f=>datosP(f).rel==="yo");return P.filter(f=>atajosP(f).includes(k)&&datosP(f).rel!=="yo")}
// sugerencias sin @: «¿Hablas de tu decana, Fulana?»
function sugerencias(t){const o=String(t||""),n=normK(o),out=[],vistos=new Set(),ya=new Set(menciones(o).map(m=>claveF(nomMenP(m.nombre))));
  const re=/(^|[^@\w[\]])((?:mi|mis|la|el|nuestra|nuestro)\s+([a-zñ]{3,}(?:\s+de\s+(?:la\s+)?[a-zñ]{3,})?))/g;let m;
  while((m=re.exec(n))){for(const cand of [m[3],m[3].split(" ")[0]]){const L=porAtajo(cand).filter(f=>!ya.has(claveF(f.nombre)));if(!L.length)continue;const i=m.index+m[1].length,frase=o.slice(i,i+m[2].length);if(vistos.has(normK(frase)))break;vistos.add(normK(frase));out.push({frase,L});break}}
  return out}
const nomMenP=n=>{const f=fichaDe(n,"persona");return f?f.nombre:n};
function sugerenciasHtml(t,key){const S2=sugerencias(t);if(!S2.length)return"";
  return S2.map(s=>`<div class="sug small">🤔 ¿«${esc(s.frase)}» es ${s.L.map(f=>`<button class="b s" data-sug="${esc(key)}" data-frase="${esc(s.frase)}" data-nom="${esc(f.nombre)}">@${esc(f.nombre)}${datosP(f).rel?` <span class="muted">(${esc(datosP(f).rel)})</span>`:""}</button>`).join(" o ")}?</div>`).join("")}
function bindSugerencias(key,refresh){document.querySelectorAll(`[data-sug="${key}"]`).forEach(b=>b.onclick=ev=>{ev.preventDefault();const el=$("#"+key);if(!el)return;const v=el.value,fr=b.dataset.frase,i=v.indexOf(fr);if(i<0)return;
  el.value=v.slice(0,i)+"@["+b.dataset.nom+"]"+v.slice(i+fr.length);el.dispatchEvent(new Event("input"));if(refresh)refresh();el.focus()})}
// para los editores: una línea de sugerencias bajo el campo de texto
function vigilarSugerencias(ids,box){const pinta=()=>{const el=$("#"+box);if(!el)return;let h="";for(const id of ids){const x=$("#"+id);if(x)h+=sugerenciasHtml(x.value,id)}el.innerHTML=h;for(const id of ids)bindSugerencias(id,pinta)};
  for(const id of ids){const x=$("#"+id);if(x)x.addEventListener("input",()=>{clearTimeout(x._sg);x._sg=setTimeout(pinta,350)})}pinta()}

// ---------------------------------------------------------------- lugares: «mi casa», «mi trabajo», «la clínica»
const lugares=()=>(S.fichas||[]).filter(f=>f.tipo==="lugar");
function lugarEn(t){const n=" "+normK(String(t||"")).replace(/[.,;:!?()]/g," ").replace(/\s+/g," ")+" ";let best=null,bl=0;
  for(const f of lugares())for(const k of [f.nombre,...f.alias].map(x=>normK(x)).filter(x=>x.length>=3))if(k.length>bl&&n.includes(" "+k+" ")){best=f;bl=k.length}return best}
function resolverLugar(v){if(!v)return"";const f=fichaDe(v,"lugar");return f?f.nombre:v}
function dirLugar(v){const f=fichaDe(v,"lugar");if(!f)return v;const d=datosP(f).dir;return d?`${f.nombre}, ${d}`:f.nombre}
function lugarExtra(f){const ks=[f.nombre,...f.alias].map(claveF);const R=(S.salud||[]).filter(r=>r.lugar&&(ks.includes(claveF(r.lugar))||ks.some(k=>k.length>=5&&claveF(r.lugar).includes(k)))).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const d=datosP(f);return`${d.dir?`<div class="card"><h2>📍 Dirección</h2><p>${esc(d.dir)}</p><a class="b s" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.dir)}" target="_blank" rel="noopener noreferrer">Ver en el mapa</a></div>`:""}
   ${R.length?`<div class="card"><h2>🩺 Salud en este lugar</h2>${R.slice(0,30).map(r=>tarjetaS(r,{conFecha:true,corto:true})).join("")}</div>`:""}`}
function editarLugar(f){const nf=f||{id:uid(),nombre:"",tipo:"lugar",alias:[],nota:"",creado:new Date().toISOString(),editado:"",datos:{}};const d=datosP(nf);
  dlg(f?"Editar lugar":"Nuevo lugar",`<label>Nombre</label><input id="fiN" value="${esc(nf.nombre)}" placeholder="Ej.: Universidad, oficina" style="width:100%">
   <label>Cómo lo llamas al escribir (atajos, separados por coma)</label><input id="fiA" value="${esc(nf.alias.join(", "))}" placeholder="mi trabajo, la Nacional, la U" style="width:100%">
   <label>Dirección</label><input id="pDir" value="${esc(d.dir||"")}" style="width:100%"><label>Notas</label><textarea id="fiNo" rows="4" style="width:100%">${esc(nf.nota)}</textarea>
   <p class="small muted">Al escribir «almuerzo en mi casa» o «fui a la Nacional», el campo Lugar se llena solo.</p>`,
   [...(f?[["Borrar","",()=>{if(!confirm("¿Borrar el lugar?"))return;S.fichas=S.fichas.filter(x=>x.id!==f.id);(S.eliminados=S.eliminados||[]).push({id:f.id,fecha:new Date().toISOString()});changed();cerrar();TD.ficha="";render()}]]:[]),["Cancelar","",cerrar],
    ["Guardar","p",()=>{const n=$("#fiN").value.trim();if(!n){alert("Pon un nombre");return}if(!f&&fichaDe(n,"lugar")){alert("Ya existe ese lugar");return}
     Object.assign(nf,{nombre:n,alias:[...new Set($("#fiA").value.split(/[,;]/).map(x=>x.trim()).filter(Boolean))],nota:$("#fiNo").value,datos:normDatosP({...d,dir:$("#pDir").value}),editado:new Date().toISOString()});
     if(!f)(S.fichas=S.fichas||[]).push(nf);changed();cerrar();TD.vista="fichas";TD.ficha=nf.id;render()}]])}

// ---------------------------------------------------------------- apariencia (por dispositivo)
function apariencia(){const t=localStorage.getItem("memphisTema")||"auto",a=localStorage.getItem("memphisAcento")||"azul";
  const T=[["auto","🌗 Automático"],["claro","☀️ Claro"],["suave","🌾 Suave"],["oscuro","🌙 Oscuro"]],A=[["azul","#1f4e78"],["verde","#1e6b52"],["violeta","#5b3fa0"],["terracota","#9a4a26"],["grafito","#3b4350"]];
  dlg("🎨 Apariencia",`<div class="aparien"><label>Tema</label><div class="opc">${T.map(([k,l])=>`<button class="b ${t===k?"p":""}" data-ap-t="${k}">${l}</button>`).join("")}</div>
    <label>Color de botones</label><div class="opc">${A.map(([k,c])=>`<button class="b ${a===k?"p":""}" data-ap-a="${k}"><span class="swatch" style="background:${c}"></span>${k[0].toUpperCase()+k.slice(1)}</button>`).join("")}</div>
    <p class="small muted">Automático sigue el modo claro u oscuro de tu teléfono o computador. Cada módulo tiene su color (Finanzas azul, Diario ámbar, Salud verde agua, Biblioteca violeta) en la franja superior y en su submenú. Esto se guarda solo en este dispositivo.</p></div>`,[["Listo","p",cerrar]]);
  document.querySelectorAll("[data-ap-t]").forEach(b=>b.onclick=()=>{const v=b.dataset.apT;try{localStorage.setItem("memphisTema",v)}catch(e){}if(v==="auto")delete document.documentElement.dataset.tema;else document.documentElement.dataset.tema=v;apariencia()});
  document.querySelectorAll("[data-ap-a]").forEach(b=>b.onclick=()=>{const v=b.dataset.apA;try{localStorage.setItem("memphisAcento",v)}catch(e){}if(v==="azul")delete document.documentElement.dataset.acento;else document.documentElement.dataset.acento=v;apariencia()})}
document.addEventListener("DOMContentLoaded",()=>{const b=$("#btnTema");if(b)b.onclick=apariencia});
if(document.readyState!=="loading"){const b=document.getElementById("btnTema");if(b)b.onclick=apariencia}
