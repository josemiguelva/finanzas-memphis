// =====================================================================================================
// Memphis · ✍️ ESCRITURA: las tres horas de una nota (✍️ escrita · 🕑 cuándo pasó · ⏰ recordatorios), recordatorios
// que se detectan al escribir («si no lo hace, recordarme en una semana») y PREGUNTAN, etiquetas de lo detectado con ✕,
// sugerencia de la actividad del mismo día, panel «Relacionar», atajos al escribir (@ # / [ ]) como Notion u Obsidian,
// barra sobre el teclado en el celular, colores de resaltado y ayuda de atajos.
// =====================================================================================================
"use strict";
// ---------------------------------------------------------------- @"Nombre Apellido" → @[Nombre Apellido]
const RE_COMI=/([@#])["“]([^"”\n]{1,80})["”]/g;
const sinComillas=t=>String(t||"").replace(RE_COMI,"$1[$2]");
MIGRAR_EXTRA.push(st=>{for(const e of st.diario||[])for(const k of ["texto","titulo"])if(typeof e[k]==="string"&&e[k].includes("@")||typeof e[k]==="string"&&e[k].includes("#")){const v=sinComillas(e[k]);if(v!==e[k])e[k]=v}});
const CAMPOS_ESC=["deX","deT","bX","seX","qc","iq","bq0","fiNo","etDe"];
document.addEventListener("input",ev=>{const X=ev.target;if(!X||!CAMPOS_ESC.includes(X.id))return;const v=X.value;if(!/[@#]["“][^"”\n]{1,80}["”]/.test(v))return;
  const p=X.selectionStart,antes=sinComillas(v.slice(0,p));X.value=antes+sinComillas(v.slice(p));X.setSelectionRange(antes.length,antes.length)},true);
// ---------------------------------------------------------------- lugares: «su oficina» no es tu oficina
window.lugarEn=function(t){const n=" "+normK(String(t||"")).replace(/[.,;:!?()]/g," ").replace(/\s+/g," ")+" ";let best=null,bl=0;
  for(const f of (S.fichas||[]).filter(x=>x.tipo==="lugar"))for(const k of [f.nombre,...(f.alias||[])].map(x=>normK(x)).filter(x=>x.length>=3)){let i=n.indexOf(" "+k+" ");
    while(i>=0){const antes=n.slice(0,i).trim().split(" ").slice(-2),despues=n.slice(i+k.length+2);const ajeno=/^(su|sus|tu|tus|vuestra|vuestro|suya|suyo)$/.test(antes[antes.length-1]||"")||/^de (el |la |los |las |don |dona )?[a-zñ]{3,}/.test(despues)&&!/^de (mi|nosotros)\b/.test(despues);
      if(!ajeno&&k.length>bl){best=f;bl=k.length;break}i=n.indexOf(" "+k+" ",i+1)}}return best};
// ---------------------------------------------------------------- recordatorios dentro del texto
const RE_PIDE_REC=/\b(recuerdame|recuerdeme|recordarme|recordarmelo|recordarlo|recordar|avisame|avisarme|avisame|alertame|alarma|recordatorio)\b/;
function sacarRecordatorio(t){t=String(t||"");const P=t.split(/(?<=[.!?;\n])\s*/);
  for(let i=0;i<P.length;i++){const c=P[i];if(!RE_PIDE_REC.test(normK(c)))continue;let r=null;
    const ra=typeof relAhora==="function"?relAhora(c):null;if(ra&&!/\bhace\b/.test(normK(c)))r={fecha:ra.fecha,hora:ra.hora};
    if(!r){const x=leerCuando(c,hoyISO(),{modo:"futuro"});if(x.encontrado&&x.fecha&&(x.fecha>hoyISO()||x.hora))r={fecha:x.fecha,hora:x.hora||""}}
    if(!r)continue;const mt=c.match(/(\b(si no( lo hace| lo hacen| me responde| llega)?,?\s*)?)(recu[eé]rd[ae]me|recordarme(lo)?|recordarlo|recordar|av[ií]sa(me|rme)|al[eé]rta(me)?|(pon(er)?(me)? )?(una )?alarma|recordatorio)\b[^.!?;\n]*/i);
    const quitar=mt?mt[0]:c,limpio=c.replace(quitar,"").replace(/[,\s]+$/,"").trim();
    const prev=(P[i-1]||"").trim(),txt=(limpio.length>=12?limpio:prev||limpio||c).replace(/[.;]+$/,"").slice(0,200);
    const resto=t.replace(quitar,"").replace(/\s{2,}/g," ").replace(/\s+([.,;])/g,"$1").replace(/,\s*\./g,".").trim();return{fecha:r.fecha,hora:r.hora,frase:quitar,resto:resto||t,txt}}return null}
const RE_PASADO_E=/\b(fui|fue|fuimos|tuve|tuvimos|hubo|estuve|estuvimos|quedo|quedamos|dijo|asisti|asistimos|termino|acabo|hablamos|hable|llego|llegue|salio|sali)\b/;
const empiezaConFecha=t=>{const c=String(t||"").trim().slice(0,40);const x=leerCuando(c,hoyISO(),{modo:"pasado"});return x.encontrado&&/^(hoy|ayer|anteayer|el |la |esta |este |anoche|manana|mañana|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|\d)/i.test(c)};
const fechaBonitaE=(f,h)=>{const d=dDe(f);return d.toLocaleDateString("es-CO",{weekday:"short",day:"numeric",month:"short"})+(h?" "+h:"")};
// ---------------------------------------------------------------- actividades del mismo día (para ligar)
const tokensE=t=>new Set(normK(String(t||"")).split(/[^a-zñ0-9]+/).filter(w=>w.length>=4&&!["para","como","esta","este","porque","pero","tambien","hace","hacer","sobre","entre","donde","cuando","nota","reunion"].includes(w)));
const minDe=h=>/^\d\d:\d\d$/.test(h||"")?(+h.slice(0,2))*60+(+h.slice(3)):null;
function sugeridosDia(fecha,hora,texto,excluir){if(!fecha||typeof itemsRango!=="function")return[];const T=tokensE(texto),hm=minDe(hora),out=[];
  for(const x of itemsRango(fecha,fecha)){let key="",tit="",h=x.hora||"",ico="📅";
    if(x.k==="d"&&x.e&&x.e.tipo==="evento"){key="d:"+x.e.id;tit=x.e.titulo;h=x.e.hora||""}else if(x.k==="s"&&x.r){key="s:"+x.r.id;tit=x.r.titulo;ico="🩺"}else if(x.k==="pt"&&x.t){key="t:"+x.t.id;tit=x.t.titulo;ico="☑️"}else continue;
    if(!tit||key===excluir)continue;let sc=0;const m=minDe(h);if(hm!=null&&m!=null){const d=Math.abs(hm-m);sc+=d<=30?4:d<=90?3:d<=180?1:0}for(const w of tokensE(tit))if(T.has(w))sc+=2;
    out.push({key,tit,h,ico,sc})}
  return out.sort((a,b)=>b.sc-a.sc||(a.h||"99").localeCompare(b.h||"99"))}
// ---------------------------------------------------------------- etiquetas de lo detectado (con ✕)
function chipsDet(o,dueño){const h=[],per=menciones(o.t).filter(m=>m.tipo==="persona"),tem=menciones(o.t).filter(m=>m.tipo==="tema");
  for(const m of per)h.push(`<span class="dchip per">👤 ${esc(m.nombre)}<a href="#" data-dq="${esc(dueño)}" data-dm="@|${esc(m.nombre)}" title="No ligar">✕</a></span>`);
  for(const m of tem)h.push(`<span class="dchip tem">#${esc(m.nombre)}<a href="#" data-dq="${esc(dueño)}" data-dm="#|${esc(m.nombre)}" title="Quitar">✕</a></span>`);
  if(o.lug&&!o.st.noLug)h.push(`<span class="dchip lug">📍 ${esc(o.lug.nombre)}<a href="#" data-dq="${esc(dueño)}" data-dl="1" title="No es ese lugar">✕</a></span>`);
  if(o.rec)h.push(o.st.rec===false?`<span class="dchip rec off">⏰ ¿Recordatorio ${esc(fechaBonitaE(o.rec.fecha,o.rec.hora))}? <a href="#" data-dq="${esc(dueño)}" data-dr="si">Sí</a></span>`
    :`<span class="dchip rec">⏰ Recordatorio ${esc(fechaBonitaE(o.rec.fecha,o.rec.hora||"08:00"))} · «${esc(o.rec.txt.slice(0,60))}»<a href="#" data-dq="${esc(dueño)}" data-dr="no" title="Sin recordatorio">✕</a></span>`);
  for(const s of (o.sug||[]).slice(0,2))h.push(`<span class="dchip act ${o.st.lig.has(s.key)?"on":""}"><a href="#" data-dq="${esc(dueño)}" data-dk="${esc(s.key)}">${o.st.lig.has(s.key)?"🔗 Ligada:":"🔗 ¿Ligar con"} ${s.ico} ${esc(s.tit.slice(0,50))}${s.h?" · "+esc(s.h):""}${o.st.lig.has(s.key)?"":"?"}</a></span>`);
  return h.length?`<div class="dchips">${h.join("")}</div>`:""}
function bindChips(dueño,st,campo,refrescar){document.querySelectorAll(`[data-dq="${dueño}"]`).forEach(a=>a.onclick=ev=>{ev.preventDefault();const X=$("#"+campo);
  if(a.dataset.dm){const [s,n]=a.dataset.dm.split("|");if(X){X.value=X.value.replace(new RegExp(`${s==="@"?"@":"#"}(\\[${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\]|${n.split(" ")[0].replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b)`),s==="@"?n:n)}}
  else if(a.dataset.dl)st.noLug=true;else if(a.dataset.dr)st.rec=a.dataset.dr==="si";else if(a.dataset.dk){const k=a.dataset.dk;if(st.lig.has(k))st.lig.delete(k);else st.lig.add(k)}refrescar()})}
const nuevoEst=()=>({noLug:false,rec:true,lig:new Set()});
function aplicarAEntrada(e,o,st){if(!e)return;if(o&&o.rec&&st.rec!==false){e.recs=[...(e.recs||[]),{id:"r"+Date.now().toString(36),fecha:o.rec.fecha,hora:o.rec.hora||"",txt:o.rec.txt,hecho:false}]}
  if(st.noLug&&o&&o.lug&&e.lugar===o.lug.nombre)e.lugar="";for(const k of st.lig)if(typeof ligar==="function")ligar("d:"+e.id,k);e.editado=e.editado||"";changed()}
// ---------------------------------------------------------------- Diario › captura rápida
const QCS={st:nuevoEst(),t:""};
window.previewQC=function(){const t0=$("#qc")?$("#qc").value.trim():"";if(!t0){$("#qcP").innerHTML='Con fecha u hora se guarda como evento; sin ellas, como nota de ahora. Escribe <b>@</b> para ligar personas o lugares, <b>#</b> para temas, y «recordarme el viernes» para un ⏰.';QCS.st=nuevoEst();return null}
  if(QCS.t&&t0.slice(0,8)!==QCS.t.slice(0,8))QCS.st=nuevoEst();QCS.t=t0;const t=sinComillas(t0),rec=sacarRecordatorio(t),base=rec?rec.resto:t;
  const modo=modoTexto(base,"futuro"),r=leerCuando(base,hoyISO(),{modo});if(modo==="pasado"&&r.fecha>hoyISO()&&!empiezaConFecha(base)){r.fecha="";r.hora="";r.encontrado=false}
  const fecha=r.fecha||hoyISO(),ev=r.encontrado&&modo!=="pasado"&&(fecha>=hoyISO()||r.fechaFin)&&(r.fecha!==hoyISO()||r.hora);const lug=lugarEn(t),sug=ev?[]:sugeridosDia(fecha,r.hora||ahoraHM(),t);
  const o={t,lug,rec,sug,st:QCS.st};
  $("#qcP").innerHTML=(ev?`📅 <b>Evento</b> · ${esc(cuandoTxt({...r,fecha,encontrado:true}))}${r.hora?"":" · todo el día"} · «${esc(r.titulo||base)}»`:`📝 <b>Nota</b> · 🕑 ${r.fecha?esc(cuandoTxt(r)):"hoy "+ahoraHM()}`)+chipsDet(o,"qc")+(typeof sugerenciasHtml==="function"?sugerenciasHtml(t,"qc"):"");
  bindChips("qc",QCS.st,"qc",window.previewQC);if(typeof bindSugerencias==="function")bindSugerencias("qc",window.previewQC);
  return{r,t,ev,fecha,lug:QCS.st.noLug?null:lug,_o:o}};
window.addEventListener("load",()=>{
  const gq=window.guardarQC;if(typeof gq==="function")window.guardarQC=function(){const p=window.previewQC();if(!p)return;const n0=(S.diario||[]).length,st=QCS.st,o=p._o;if($("#qc"))$("#qc").value=sinComillas($("#qc").value);
    const r=gq.apply(this,arguments);const e=(S.diario||[]).length>n0?S.diario[S.diario.length-1]:null;if(e)aplicarAEntrada(e,o,st);QCS.st=nuevoEst();QCS.t="";if(e&&o.rec&&st.rec!==false)aviso("⏰ Recordatorio creado para "+fechaBonitaE(o.rec.fecha,o.rec.hora||"08:00"));return r};
});
// ---------------------------------------------------------------- Inicio: la misma lógica en la caja
const INI2={st:nuevoEst(),t:""};
window.addEventListener("load",()=>{
  const it=window.interpretar;if(typeof it==="function"){const it2=function(t){let o=it.call(this,t);
      if(o&&o.tipo==="evento"&&!INI.forzar&&((!o.fecha&&!o.hora)||RE_PASADO_E.test(normK(t)))){INI.forzar="nota";try{o=it.call(this,t)}finally{INI.forzar=""}}return o};
    window.interpretar=function(t){t=sinComillas(t);const rec=sacarRecordatorio(t);if(!rec)return it2.call(this,t);
      const o=it2.call(this,rec.resto);if(!o)return o;o.t=t;o.rec=rec;return o}}
  const pv=window.previewI;if(typeof pv==="function")window.previewI=function(){const o=pv.apply(this,arguments);const box=$("#iqP");if(!o||!box||INI.busca)return o;
    if(INI2.t&&o.t.slice(0,8)!==INI2.t.slice(0,8))INI2.st=nuevoEst();INI2.t=o.t;
    if(o.tipo==="nota"&&o.fecha>hoyISO()&&!empiezaConFecha(o.t)){o.fecha="";o.hora=""}
    const lug=["nota","evento"].includes(o.tipo)?lugarEn(o.t):null,sug=o.tipo==="nota"?sugeridosDia(o.fecha||hoyISO(),o.hora||ahoraHM(),o.t):[];o._lug=lug;o._sug=sug;
    box.insertAdjacentHTML("beforeend",chipsDet({t:o.t,lug,rec:["nota","evento","tarea"].includes(o.tipo)&&!o.proy?o.rec:null,sug,st:INI2.st},"iq"));
    bindChips("iq",INI2.st,"iq",()=>window.previewI());return o};
  const gi=window.guardarI;if(typeof gi==="function")window.guardarI=function(abrir){if(INI.busca)return gi.apply(this,arguments);const q=$("#iq");if(q)q.value=sinComillas(q.value);
    const o=window.previewI();const n0=(S.diario||[]).length,st=INI2.st;const r=gi.apply(this,arguments);const e=(S.diario||[]).length>n0?S.diario[S.diario.length-1]:null;
    if(e&&o){if(o.tipo==="nota"&&!o.fecha&&e.fecha!==hoyISO()){e.fecha=hoyISO();e.hora=ahoraHM()}if(typeof e.lugar!=="string")e.lugar=(e.lugar&&e.lugar.nombre)||"";aplicarAEntrada(e,{...o,lug:o._lug},st);if(o.rec&&st.rec!==false)aviso("⏰ Recordatorio creado para "+fechaBonitaE(o.rec.fecha,o.rec.hora||"08:00"));render()}
    INI2.st=nuevoEst();INI2.t="";return r};
});
// ---------------------------------------------------------------- Editor de notas y actividades
const ED={recs:[],lig:new Set(),lugar:null,id:"",creado:""};
function pintaRecsEd(){const box=$("#edRec");if(!box)return;const X=$("#deX"),hay=X?sacarRecordatorio(X.value):null,ya=hay&&ED.recs.some(r=>r.fecha===hay.fecha&&(r.hora||"")===(hay.hora||""));
  box.innerHTML=`<div class="edlbl">⏰ Recordatorios <span class="small muted">— te avisan por Telegram (sin hora: 8:00 a. m.)</span></div>
   <div class="dchips">${ED.recs.map((r,i)=>`<span class="dchip rec ${r.hecho?"off":""}">⏰ ${esc(fechaBonitaE(r.fecha,r.hora))}${r.txt?" · "+esc(r.txt.slice(0,50)):""}<a href="#" data-rx="${i}" title="Quitar">✕</a></span>`).join("")}
    ${hay&&!ya?`<span class="dchip rec off">¿${esc(fechaBonitaE(hay.fecha,hay.hora||"08:00"))} · «${esc(hay.txt.slice(0,40))}»? <a href="#" id="edRecSi">Sí, crear</a></span>`:""}
    <button class="b s" id="edRecN" type="button">＋ Recordatorio</button></div>
   <div id="edRecF" hidden class="filters"><input type="date" id="edRF" value="${masDias(hoyISO(),1)}"><input type="time" id="edRH" value="08:00"><input id="edRT" placeholder="Qué te recuerdo (opcional)" style="flex:1;min-width:150px">
    <span class="small">${[["mañana",1],["en 3 días",3],["en 1 semana",7],["en 1 mes",30]].map(([l,d])=>`<a href="#" data-rq="${d}">${l}</a>`).join(" · ")}</span><button class="b s p" id="edRA" type="button">Agregar</button></div>`;
  box.querySelectorAll("[data-rx]").forEach(a=>a.onclick=ev=>{ev.preventDefault();ED.recs.splice(+a.dataset.rx,1);pintaRecsEd()});
  if($("#edRecSi"))$("#edRecSi").onclick=ev=>{ev.preventDefault();ED.recs.push({id:"r"+Date.now().toString(36),fecha:hay.fecha,hora:hay.hora||"",txt:hay.txt,hecho:false});pintaRecsEd()};
  $("#edRecN").onclick=()=>{$("#edRecF").hidden=false;$("#edRT").focus()};box.querySelectorAll("[data-rq]").forEach(a=>a.onclick=ev=>{ev.preventDefault();$("#edRF").value=masDias(hoyISO(),+a.dataset.rq)});
  $("#edRA").onclick=()=>{const f=$("#edRF").value;if(!/^\d{4}-\d\d-\d\d$/.test(f)){alert("Elige la fecha");return}ED.recs.push({id:"r"+Date.now().toString(36),fecha:f,hora:$("#edRH").value||"",txt:$("#edRT").value.trim().slice(0,300),hecho:false});pintaRecsEd()}}
function pintaRelEd(){const box=$("#edRel");if(!box)return;const f=$("#deF")?$("#deF").value:hoyISO(),h=$("#deH")?$("#deH").value:"",t=($("#deT")?$("#deT").value:"")+" "+($("#deX")?$("#deX").value:""),yo=ED.id?"d:"+ED.id:"";
  const ya=new Set(yo&&typeof ligados==="function"?ligados(yo).map(x=>x.key):[]),dia=sugeridosDia(f,h,t,yo).slice(0,5);
  let par=[];if(typeof buscarTodo==="function"){const W=[...tokensE(t)].slice(0,6);const vis=new Set(dia.map(x=>x.key));const cnt={};for(const w of W)for(const r of buscarTodo(w,30)){if(!/^[dsbptf]:/.test(r.key)||r.key===yo||vis.has(r.key))continue;cnt[r.key]=cnt[r.key]||{r,n:0};cnt[r.key].n++}
    par=Object.values(cnt).filter(x=>x.n>=Math.min(2,W.length)).sort((a,b)=>b.n-a.n).slice(0,6).map(x=>({key:x.r.key,tit:x.r.tit,ico:x.r.ico,h:x.r.fecha?fechaCorta(x.r.fecha):""}))}
  const fila=x=>{const on=ED.lig.has(x.key)||ya.has(x.key);return`<a href="#" class="dchip act ${on?"on":""}" data-rl="${esc(x.key)}">${on?"🔗":"＋"} ${x.ico} ${esc(String(x.tit).slice(0,60))}${x.h?" · "+esc(x.h):""}</a>`};
  box.innerHTML=`<details ${dia.length||par.length?"open":""}><summary class="edlbl">🔗 Relacionar <span class="small muted">— toca para ligar</span></summary>
   ${dia.length?`<div class="small muted">Ese día en tu agenda (${esc(fechaBonitaE(f,""))})</div><div class="dchips">${dia.map(fila).join("")}</div>`:`<div class="small muted">No hay actividades ese día.</div>`}
   ${par.length?`<div class="small muted" style="margin-top:4px">Parecido a lo que escribes</div><div class="dchips">${par.map(fila).join("")}</div>`:""}
   <div class="filters" style="margin-top:4px"><input id="edRQ" placeholder="Buscar algo para ligar: proyecto, actividad, libro, persona…" style="flex:1"><div id="edRR" class="dchips" style="width:100%"></div></div></details>`;
  box.querySelectorAll("[data-rl]").forEach(a=>a.onclick=ev=>{ev.preventDefault();const k=a.dataset.rl;if(ya.has(k)){if(confirm("¿Quitar este vínculo?")){desligar(yo,k);pintaRelEd()}return}if(ED.lig.has(k))ED.lig.delete(k);else ED.lig.add(k);pintaRelEd()});
  const q=$("#edRQ");q.oninput=()=>{clearTimeout(q._t);q._t=setTimeout(()=>{const R=q.value.trim().length>=2?buscarTodo(q.value,40).filter(r=>/^[dsbptf]:/.test(r.key)&&r.key!==yo).slice(0,8):[];$("#edRR").innerHTML=R.map(r=>fila({key:r.key,tit:r.tit,ico:r.ico,h:r.fecha?fechaCorta(r.fecha):""})).join("");
    $("#edRR").querySelectorAll("[data-rl]").forEach(a=>a.onclick=ev=>{ev.preventDefault();ED.lig.add(a.dataset.rl);q.value="";pintaRelEd()})},250)}}
window.addEventListener("load",()=>{
  const ed=window.editarD;if(typeof ed==="function")window.editarD=function(id,pre){const r=ed.apply(this,arguments);const e0=id?(S.diario||[]).find(x=>x.id===id):null;
    Object.assign(ED,{recs:e0&&e0.recs?structuredClone(e0.recs):[],lig:new Set(),lugar:null,id:e0?e0.id:"",creado:e0?e0.creado:""});
    const F=$("#deF");if(!F)return r;const fila=F.closest(".filters");fila.insertAdjacentHTML("beforebegin",'<div class="edlbl">🕑 Cuándo pasó o cuándo es</div>');
    const evo=document.querySelector("#dlgB > .evo");(evo||fila).insertAdjacentHTML("afterend",'<div id="edRec" class="edsec"></div>');
    const X=$("#deX");X.insertAdjacentHTML("afterend",'<div id="edRel" class="edsec"></div>');X.placeholder="Escribe libremente. Atajos: @ persona, lugar, proyecto o actividad · # tema · / comandos (tarea, foto, color, recordar…) · [ ] tarea. Toca ⌨ para ver todos.";
    const tb=document.querySelector("#dlgB .tb");if(tb){tb.insertAdjacentHTML("beforeend",'<button class="b s" type="button" id="edRecB" title="Agregar recordatorio">⏰</button><button class="b s" type="button" id="edAy" title="Atajos de escritura">⌨ ?</button>');$("#edRecB").onclick=()=>{pintaRecsEd();$("#edRecF").hidden=false;$("#edRT").focus()};$("#edAy").onclick=ayudaAtajos}
    const tss=document.querySelector("#dlgB .tss");if(tss&&e0){tss.innerHTML=`✍️ Escrita ${esc(tsBonito(e0.creado))}${e0.editado?` · editada ${esc(tsBonito(e0.editado))}`:""} · <a href="#" id="edCrE">cambiar</a><span id="edCrB" hidden> <input type="datetime-local" id="edCr" value="${esc((()=>{const d=new Date(e0.creado);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)})())}"></span>`;$("#edCrE").onclick=ev=>{ev.preventDefault();$("#edCrB").hidden=false}}
    else if(tss)tss.innerHTML=`✍️ Se registrará como escrita ahora (${esc(ahoraHM())}). ${esc(tss.textContent)}`;
    const al0=document.querySelector("#dlgB [data-al]");if(al0){const caja=al0.closest(".filters")||al0.parentElement.parentElement;caja.insertAdjacentHTML("beforeend",`<label class="fchip ${e0&&e0.sinAviso?"on":"off"}" title="Esta actividad no te avisa por Telegram"><input type="checkbox" id="deSA" ${e0&&e0.sinAviso?"checked":""} hidden>🔕 Sin aviso</label>`);
      const sa=$("#deSA");sa.onchange=()=>{sa.parentElement.className="fchip "+(sa.checked?"on":"off");if(sa.checked)document.querySelectorAll("#dlgB [data-al]").forEach(c=>{c.checked=false;c.parentElement.className="fchip off"})};
      document.querySelectorAll("#dlgB [data-al]").forEach(c=>c.addEventListener("change",()=>{if(c.checked&&sa.checked){sa.checked=false;sa.parentElement.className="fchip off"}}))}
    pintaRecsEd();pintaRelEd();let tt=null;const re=()=>{clearTimeout(tt);tt=setTimeout(()=>{pintaRecsEd();pintaRelEd()},600)};X.addEventListener("input",re);F.addEventListener("change",re);if($("#deH"))$("#deH").addEventListener("change",re);if($("#deT"))$("#deT").addEventListener("input",re);
    return r};
  const gd=window.guardarD;if(typeof gd==="function")window.guardarD=function(e,e0){e.recs=ED.recs.slice();if($("#deSA")){if($("#deSA").checked)e.sinAviso=true;else delete e.sinAviso}if(ED.lugar!=null&&e.tipo!=="evento")e.lugar=ED.lugar;
    const cr=$("#edCr");if(cr&&!$("#edCrB").hidden&&cr.value){const d=new Date(cr.value);if(!isNaN(d))e.creado=d.toISOString()}
    const X=$("#deX");if(X)X.value=sinComillas(X.value);const T=$("#deT");if(T)T.value=sinComillas(T.value);const lig=[...ED.lig];const r=gd.apply(this,arguments);
    if(!($("#dlg")&&$("#dlg").open&&$("#deX"))){for(const k of lig)ligar("d:"+e.id,k);if(lig.length)changed()}return r};
  // ver una nota: recordatorios con ✓ y la hora en que se escribió
  const vd=window.verD;if(typeof vd==="function")window.verD=function(id){const r=vd.apply(this,arguments);const e=(S.diario||[]).find(x=>x.id===id);const B=$("#dlgB");if(!e||!B)return r;
    const R=(e.recs||[]);if(R.length){const h=`<div class="edsec"><div class="edlbl">⏰ Recordatorios</div><div class="dchips">${R.map((x,i)=>`<span class="dchip rec ${x.hecho?"off":""}"><a href="#" data-rh="${i}" title="${x.hecho?"Marcar pendiente":"Marcar hecho"}">${x.hecho?"✔":"○"}</a> ${esc(fechaBonitaE(x.fecha,x.hora||"08:00"))}${x.txt?" · "+esc(x.txt.slice(0,60)):""}</span>`).join("")}</div></div>`;
      const ref=B.querySelector("#vdTxt");if(ref)ref.insertAdjacentHTML("beforebegin",h);B.querySelectorAll("[data-rh]").forEach(a=>a.onclick=ev=>{ev.preventDefault();const x=e.recs[+a.dataset.rh];x.hecho=!x.hecho;e.editado=new Date().toISOString();changed();verD(e.id)})}
    const tss=B.querySelector(".tss");if(tss)tss.innerHTML=tss.innerHTML.replace(/^Creado/,"✍️ Escrita");const cab=B.querySelector(".small.muted");if(cab&&!cab.dataset.ok){cab.dataset.ok=1;cab.innerHTML="🕑 "+cab.innerHTML}return r};
  // Inicio › Por atender: recordatorios de hoy y atrasados
  const pa=window.porAtenderHtml;if(typeof pa==="function")window.porAtenderHtml=function(){let h=pa.apply(this,arguments);const hoy=hoyISO(),L=[];
    for(const e of S.diario||[])for(const x of e.recs||[])if(!x.hecho&&x.fecha<=hoy)L.push({e,x});if(!L.length)return h;L.sort((a,b)=>(a.x.fecha+a.x.hora).localeCompare(b.x.fecha+b.x.hora));
    const fila=L.slice(0,12).map(({e,x})=>`<div class="vrow small"><a href="#" data-rok="${esc(e.id)}|${esc(x.id)}" title="Hecho">○</a><span style="flex:1;min-width:0" class="click" data-rver="${esc(e.id)}">⏰ ${esc(x.txt||e.titulo||String(e.texto||"").slice(0,60))}</span><span class="${x.fecha<hoy?"neg":""}">${x.fecha<hoy?esc(fechaCorta(x.fecha)):"hoy"}${x.hora?" "+esc(x.hora):""}</span></div>`).join("");
    return h.replace('<h2>📌 Por atender</h2>','<h2>📌 Por atender</h2>'+fila).replace('<p class="small muted">Todo al día ✔</p>',"")};
  const bi=window.bindInicio;if(typeof bi==="function")window.bindInicio=function(){const r=bi.apply(this,arguments);
    document.querySelectorAll("[data-rok]").forEach(a=>a.onclick=ev=>{ev.preventDefault();const [eid,rid]=a.dataset.rok.split("|"),e=S.diario.find(x=>x.id===eid),x=e&&(e.recs||[]).find(y=>y.id===rid);if(x){x.hecho=true;e.editado=new Date().toISOString();changed();render();aviso("✔ Hecho")}});
    document.querySelectorAll("[data-rver]").forEach(a=>a.onclick=()=>verD(a.dataset.rver));return r};
  // colores de resaltado {verde:texto}
  const m0=window.md;if(typeof m0==="function")window.md=function(){return String(m0.apply(this,arguments)).replace(/\{(amarillo|verde|azul|rosa|rojo):([^{}\n]{1,800})\}/g,'<mark class="mk-$1">$2</mark>')};
});
// ---------------------------------------------------------------- ATAJOS AL ESCRIBIR: @ # / y [ ]
const AT={el:null,ini:0,tipo:"",items:[],sel:0,filtro:""};
const CMD=[["tarea","☑️","Tarea","- [ ] ","linea"],["lista","•","Lista","- ","linea"],["titulo","H","Título","## ","linea"],["subtitulo","h","Subtítulo","### ","linea"],["negrita","B","Negrita","**","envolver"],["resaltar","▮","Resaltar","==","envolver"],
  ["color","🎨","Color de resaltado","","color"],["cita","❝","Cita","> ","linea"],["separador","—","Separador","\n---\n","insertar"],["recordar","⏰","Recordatorio","","recordar"],["foto","📷","Foto con la cámara","","foto"],["galeria","🖼","Imagen de la galería","","galeria"],
  ["archivo","📎","Archivo o PDF","","archivo"],["audio","🎙","Grabar audio","","audio"],["persona","👤","Ligar persona","","@persona"],["lugar","📍","Ligar lugar","","@lugar"],["proyecto","🎯","Ligar proyecto","","@proyecto"],["ligar","🔗","Ligar algo (actividad, libro…)","","@"],
  ["hora","🕑","Cambiar fecha y hora","","hora"],["plantilla","📋","Insertar plantilla","","plantilla"],["hoy","📆","Escribir la fecha de hoy","","hoy"],["ayuda","⌨","Ver todos los atajos","","ayuda"]];
const COLORES=[["amarillo","🟨"],["verde","🟩"],["azul","🟦"],["rosa","🟪"],["rojo","🟥"]];
function itemsArroba(q,solo){const n=normK(q),ok=s=>!n||normK(s).includes(n),pri=s=>normK(s).startsWith(n)?0:1,out=[];
  if(!solo||solo==="persona")for(const f of (S.fichas||[]).filter(f=>f.tipo==="persona"&&(ok(f.nombre)||(f.alias||[]).some(ok))))out.push({g:"Personas",ico:"👤",t:f.nombre,sub:(f.datos&&f.datos.rel)||"",ins:"@["+f.nombre+"] ",key:"f:"+f.id,p:pri(f.nombre)});
  if(!solo||solo==="lugar")for(const f of (S.fichas||[]).filter(f=>f.tipo==="lugar"&&(ok(f.nombre)||(f.alias||[]).some(ok))))out.push({g:"Lugares",ico:"📍",t:f.nombre,ins:f.nombre+" ",key:"f:"+f.id,lugar:f.nombre,p:pri(f.nombre)});
  if(!solo||solo==="proyecto")for(const p of (S.proy||[]).filter(p=>p.estado!=="cancelado"&&(ok(p.nombre)||ok(p.corto||""))))out.push({g:"Proyectos",ico:"🎯",t:p.corto||p.nombre,sub:p.corto?p.nombre:"",ins:(p.corto||p.nombre)+" ",key:"p:"+p.id,proy:p.id,p:pri(p.corto||p.nombre)});
  if(!solo){const h=hoyISO(),a=masDias(h,-45),b=masDias(h,45);for(const e of (S.diario||[]).filter(e=>e.tipo==="evento"&&e.titulo&&e.fecha>=a&&e.fecha<=b&&ok(e.titulo)&&!(e.gcal&&e.gcal.fuera)).sort((x,y)=>Math.abs(dDe(x.fecha)-dDe(h))-Math.abs(dDe(y.fecha)-dDe(h))).slice(0,8))out.push({g:"Actividades",ico:"📅",t:e.titulo,sub:fechaCorta(e.fecha)+(e.hora?" "+e.hora:""),ins:e.titulo+" ",key:"d:"+e.id,p:pri(e.titulo)+1});
    if(n)for(const x of (S.biblio||[]).filter(x=>!(typeof verPriv==="function"&&verPriv(x))&&ok(x.titulo)).slice(0,6))out.push({g:"Biblioteca",ico:"📚",t:x.titulo,ins:x.titulo+" ",key:"b:"+x.id,p:pri(x.titulo)+1})}
  out.sort((a,b)=>a.p-b.p);const res=out.slice(0,14);
  if(q&&(!solo||solo==="persona")&&!out.some(x=>x.g==="Personas"&&normK(x.t)===n)){const nom=q.replace(/[_-]/g," ").replace(/\b\w/g,c=>c.toUpperCase());res.push({g:"Crear",ico:"＋",t:`Crear persona «${nom}»`,ins:"@["+nom+"] "})}
  if(q&&solo==="lugar")res.push({g:"Crear",ico:"＋",t:`Escribir «${q}» (sin ligar)`,ins:q+" "});return res}
function itemsHash(q){const n=normK(q),set=new Map();for(const f of (S.fichas||[]).filter(f=>f.tipo==="tema"))set.set(claveF(f.nombre),f.nombre);for(const x of S.biblio||[])for(const e of x.etiquetas||[])if(!set.has(claveF(e)))set.set(claveF(e),e);
  const L=[...set.values()].filter(t=>!n||normK(t).includes(n)).sort((a,b)=>(normK(a).startsWith(n)?0:1)-(normK(b).startsWith(n)?0:1)||a.localeCompare(b,"es")).slice(0,14).map(t=>({g:"Temas y etiquetas",ico:"#",t,ins:(/\s/.test(t)?"#["+t+"]":"#"+t)+" "}));
  if(q&&!L.some(x=>normK(x.t)===n))L.push({g:"Crear",ico:"＋",t:`Nuevo tema «${q}»`,ins:(/\s/.test(q)?"#["+q+"]":"#"+q)+" "});return L}
function itemsSlash(q){const n=normK(q);return CMD.filter(c=>!n||normK(c[0]+" "+c[2]).includes(n)).map(c=>({g:"Comandos",ico:c[1],t:c[2],sub:"/"+c[0],cmd:c}))}
const esArea=el=>el&&el.tagName==="TEXTAREA";
function caretXY(el){const r=el.getBoundingClientRect();if(innerWidth<760)return null;const cs=getComputedStyle(el),m=document.createElement("div");
  for(const p of ["fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","paddingTop","paddingRight","paddingBottom","paddingLeft","borderTopWidth","borderLeftWidth","boxSizing","width","textTransform","wordSpacing"])m.style[p]=cs[p];
  m.style.position="absolute";m.style.visibility="hidden";m.style.whiteSpace=esArea(el)?"pre-wrap":"pre";m.style.wordWrap="break-word";m.style.top="0";m.style.left="-9999px";
  m.textContent=el.value.slice(0,el.selectionStart);const s=document.createElement("span");s.textContent="\u200b";m.appendChild(s);document.body.appendChild(m);
  const x=r.left+s.offsetLeft-el.scrollLeft,y=r.top+s.offsetTop-el.scrollTop+parseFloat(cs.lineHeight||"18");m.remove();return{x:Math.min(x,innerWidth-300),y:Math.min(y+4,r.bottom+4)}}
function cerrarAt(){AT.el=null;AT.tipo="";const p=$("#atPop");if(p)p.remove()}
function pintarAt(){let p=$("#atPop");if(!AT.items.length){if(p)p.remove();return}if(!p){p=document.createElement("div");p.id="atPop";(document.querySelector("dialog[open]")||document.body).appendChild(p)}
  let g="";p.innerHTML=AT.items.map((x,i)=>{const h=x.g!==g?`<div class="atg">${esc(x.g)}</div>`:"";g=x.g;return h+`<div class="ati ${i===AT.sel?"on":""}" data-ai="${i}"><span class="atico">${esc(x.ico)}</span><span class="att">${esc(x.t)}</span>${x.sub?`<span class="ats">${esc(x.sub)}</span>`:""}</div>`}).join("")+`<div class="atpie">↑↓ elegir · Enter · Esc cerrar · <a href="#" data-aay="1">⌨ atajos</a></div>`;
  const xy=AT.el?caretXY(AT.el):null;if(xy){p.classList.remove("abajo");p.style.left=Math.max(8,xy.x)+"px";p.style.top=xy.y+"px";const r=p.getBoundingClientRect();if(r.bottom>innerHeight-8)p.style.top=Math.max(8,xy.y-r.height-28)+"px"}
  else{p.classList.add("abajo");const vv=window.visualViewport;p.style.left="6px";p.style.top="";p.style.bottom=(vv?Math.max(0,innerHeight-vv.height-vv.offsetTop):0)+(innerWidth<760&&$("#kbBar")?50:8)+"px"}
  p.querySelectorAll("[data-ai]").forEach(d=>d.onmousedown=ev=>{ev.preventDefault();elegirAt(+d.dataset.ai)});const ay=p.querySelector("[data-aay]");if(ay)ay.onmousedown=ev=>{ev.preventDefault();cerrarAt();ayudaAtajos()};
  const on=p.querySelector(".ati.on");if(on)on.scrollIntoView({block:"nearest"})}
function evaluarAt(el){if(!el||!CAMPOS_ESC.includes(el.id)){cerrarAt();return}const p=el.selectionStart,antes=el.value.slice(0,p);
  const m=antes.match(/(^|[\s(¡¿])([@#\/])([^\s@#\/\[\]]{0,30})$/);if(!m||(m[2]==="/"&&!esArea(el))||(m[2]==="/"&&/https?:$/.test(antes.slice(0,-1-m[3].length)))){cerrarAt();return}
  AT.el=el;AT.ini=p-m[3].length-1;AT.tipo=m[2];AT.filtro=m[3];AT.items=m[2]==="@"?itemsArroba(m[3],AT.solo):m[2]==="#"?itemsHash(m[3]):itemsSlash(m[3]);AT.sel=0;pintarAt()}
function reemplazarToken(el,txt){const v=el.value,fin=el.selectionStart;el.value=v.slice(0,AT.ini)+txt+v.slice(fin);const c=AT.ini+txt.length;el.setSelectionRange(c,c);el.dispatchEvent(new Event("input",{bubbles:true}));el.focus()}
function enLinea(el,pref){const v=el.value,p=el.selectionStart,i=v.lastIndexOf("\n",p-1)+1;el.value=v.slice(0,i)+pref+v.slice(i);el.setSelectionRange(p+pref.length,p+pref.length);el.dispatchEvent(new Event("input",{bubbles:true}));el.focus()}
function envolverSel(el,a,b,ph){const s=el.selectionStart,e=el.selectionEnd,sel=el.value.slice(s,e)||ph;el.value=el.value.slice(0,s)+a+sel+b+el.value.slice(e);el.setSelectionRange(s+a.length,s+a.length+sel.length);el.dispatchEvent(new Event("input",{bubbles:true}));el.focus()}
function pendienteLigar(el,x){if(!x.key)return;if(el.id==="deX"||el.id==="deT"){if(x.proy&&$("#deProy")){$("#deProy").value=x.proy;return}if(x.lugar){ED.lugar=x.lugar;if($("#deL"))$("#deL").value=x.lugar}else if(!x.key.startsWith("f:"))ED.lig.add(x.key);pintaRelEd()}
  else if(el.id==="qc"){if(!x.key.startsWith("f:"))QCS.st.lig.add(x.key)}else if(el.id==="iq"){if(!x.key.startsWith("f:"))INI2.st.lig.add(x.key)}}
function elegirAt(i){const x=AT.items[i],el=AT.el;if(!x||!el)return;const solo=AT.solo;AT.solo="";
  if(x.cmd){const [k,,,mk,modo]=x.cmd;reemplazarToken(el,"");cerrarAt();
    if(modo==="linea")enLinea(el,mk);else if(modo==="envolver")envolverSel(el,mk,mk,"texto");else if(modo==="insertar"){insertar(el,mk);el.dispatchEvent(new Event("input",{bubbles:true}))}
    else if(modo==="color"){AT.el=el;AT.ini=el.selectionStart;AT.tipo="color";AT.items=COLORES.map(([c,i])=>({g:"Color",ico:i,t:c,color:c}));AT.sel=0;pintarAt()}
    else if(modo==="recordar"){if($("#edRecF")){$("#edRecF").hidden=false;$("#edRT").focus()}else{insertar(el," recordarme mañana");el.dispatchEvent(new Event("input",{bubbles:true}))}}
    else if(modo==="foto"){const b=$("#deFo")||$("#bFo");if(b)b.click();else{const c=$("#camIn");if(c){c.value="";c.click()}}}else if(modo==="galeria"){const b=$("#deIm")||$("#bIm");if(b)b.click()}else if(modo==="archivo"){const b=$("#deFi")||$("#bFi");if(b)b.click();else{const a=$("#attIn");if(a){a.value="";a.click()}}}
    else if(modo==="audio"){const b=$("#deAu");if(b)b.click();else aviso("Graba audio desde una nota del Diario")}else if(modo==="hora"){const f=$("#deH")||$("#deF");if(f){f.focus();f.scrollIntoView({block:"center"});if(f.showPicker)try{f.showPicker()}catch(e){}}}
    else if(modo==="plantilla"){const s=document.querySelector('dialog[open] select[title="Insertar una plantilla"]');if(s){s.focus();if(s.showPicker)try{s.showPicker()}catch(e){}}else aviso("Las plantillas están en el editor del Diario y de Salud")}
    else if(modo==="hoy"){insertar(el,fechaLarga(hoyISO()));el.dispatchEvent(new Event("input",{bubbles:true}))}else if(modo==="ayuda")ayudaAtajos();
    else if(modo.startsWith("@")){insertar(el,"@");AT.solo=modo.slice(1);evaluarAt(el)}return}
  if(x.color){envolverSel(el,"{"+x.color+":","}","texto");cerrarAt();return}
  reemplazarToken(el,x.ins);pendienteLigar(el,x);cerrarAt();if(solo)AT.solo=""}
document.addEventListener("input",ev=>{const el=ev.target;if(!el||!CAMPOS_ESC.includes(el.id))return;
  if(esArea(el)){const p=el.selectionStart,v=el.value,ini=v.lastIndexOf("\n",p-1)+1,lin=v.slice(ini,p);if(/^\s*\[ ?\]\s$/.test(lin)){el.value=v.slice(0,ini)+"- [ ] "+v.slice(p);el.setSelectionRange(ini+6,ini+6);return}}
  if(AT.tipo==="color")return;evaluarAt(el)});
document.addEventListener("keydown",ev=>{if(!AT.el||!$("#atPop"))return;if(ev.key==="ArrowDown"){ev.preventDefault();AT.sel=(AT.sel+1)%AT.items.length;pintarAt()}else if(ev.key==="ArrowUp"){ev.preventDefault();AT.sel=(AT.sel-1+AT.items.length)%AT.items.length;pintarAt()}
  else if(ev.key==="Enter"||ev.key==="Tab"){const x=AT.items[AT.sel];if(ev.key==="Enter"&&!esArea(AT.el)&&x&&(x.g==="Crear"||normK(x.t)===normK(AT.filtro))){cerrarAt();return}ev.preventDefault();ev.stopPropagation();elegirAt(AT.sel)}else if(ev.key==="Escape"){ev.preventDefault();ev.stopPropagation();cerrarAt()}},true);
document.addEventListener("focusout",ev=>{if(ev.target===AT.el)setTimeout(()=>{if(document.activeElement!==AT.el)cerrarAt()},150)});
document.addEventListener("click",ev=>{if(AT.el&&!ev.target.closest("#atPop")&&ev.target!==AT.el)cerrarAt()});
// ---------------------------------------------------------------- barra sobre el teclado (celular)
const KB=[["B","negrita"],["▮","resaltar"],["☐","tarea"],["@","@"],["#","#"],["⏰","recordar"],["📷","foto"],["📎","archivo"],["/","/"]];
function ponerBarraKB(el){if(innerWidth>=760||!esArea(el))return;let b=$("#kbBar");if(!b){b=document.createElement("div");b.id="kbBar";(document.querySelector("dialog[open]")||document.body).appendChild(b)}
  b.innerHTML=KB.map(([l,k])=>`<button type="button" data-kb="${k}">${l}</button>`).join("");const pos=()=>{const vv=window.visualViewport;b.style.bottom=(vv?Math.max(0,innerHeight-vv.height-vv.offsetTop):0)+"px"};pos();
  if(window.visualViewport){visualViewport.onresize=pos;visualViewport.onscroll=pos}
  b.querySelectorAll("[data-kb]").forEach(x=>x.onmousedown=ev=>{ev.preventDefault();const k=x.dataset.kb;if(k==="@"||k==="#"||k==="/"){insertar(el,(el.selectionStart&&!/\s$/.test(el.value.slice(0,el.selectionStart))?" ":"")+k);evaluarAt(el);return}
    const c=CMD.find(c=>c[0]===k);if(c){AT.el=el;AT.ini=el.selectionStart;AT.items=[{cmd:c}];elegirAt(0)}})}
document.addEventListener("focusin",ev=>{if(ev.target&&CAMPOS_ESC.includes(ev.target.id))ponerBarraKB(ev.target)});
document.addEventListener("focusout",ev=>{if(ev.target&&CAMPOS_ESC.includes(ev.target.id))setTimeout(()=>{const a=document.activeElement;if(!a||!CAMPOS_ESC.includes(a.id)){const b=$("#kbBar");if(b)b.remove()}},200)});
// ---------------------------------------------------------------- ayuda
function ayudaAtajos(){const f=(k,d)=>`<tr><td><code>${k}</code></td><td>${d}</td></tr>`;
  const html=`<p class="small">Funcionan en las notas del Diario, la Biblioteca, Salud y la caja de Inicio. Al escribir el símbolo se abre una lista: elige con un toque o con ↑↓ y Enter.</p>
   <table class="tabla-c atay">${f("@","Ligar a una <b>persona</b>, <b>lugar</b>, <b>proyecto</b>, <b>actividad</b> o <b>libro</b>. Si la persona no existe, se crea.")}${f('@"Nombre Apellido"',"También vale, igual que <code>@[Nombre Apellido]</code>.")}
    ${f("#","Tema o etiqueta (<code>#tesis</code>, <code>#[Plan de clase]</code>).")}${f("/","Menú de comandos: tarea, lista, título, negrita, resaltar, color, cita, separador, recordatorio, foto, galería, archivo, audio, hora, plantilla, fecha de hoy.")}
    ${f("[ ]","Al inicio de una línea se convierte en casilla de tarea.")}${f("recordarme el viernes","En cualquier nota: crea un ⏰ recordatorio (te pregunta antes). También «avísame en 2 horas», «si no lo hace, recordarme en una semana».")}
    ${f("**texto**","Negrita")}${f("==texto==","Resaltado amarillo")}${f("{verde:texto}","Resaltado de color: amarillo, verde, azul, rosa o rojo")}${f("## Título","Título · <code>### </code> subtítulo")}${f("> texto","Cita")}${f("---","Separador")}
    ${f("Ctrl+K","Anotar desde cualquier parte (PC)")}${f("/ o Ctrl+Shift+K","Buscar en todo (PC, fuera de un campo)")}</table>
   <h3>Las tres horas de una nota</h3><p class="small">✍️ <b>Escrita</b>: cuándo la anotaste (al pie, se puede cambiar). 🕑 <b>Cuándo pasó o cuándo es</b>: la fecha y hora del hecho («hoy a las 2 pm»). ⏰ <b>Recordatorios</b>: los que tú pongas; puedes tener varios en una misma nota o actividad. Una nota <b>no avisa</b> si no tiene ⏰.</p>`;
  if($("#dlg").open){let d=$("#ayAt");if(!d){d=document.createElement("dialog");d.id="ayAt";document.body.appendChild(d)}d.innerHTML=`<h2>⌨ Atajos de escritura</h2>${html}<div class="filters"><button class="b p" id="ayAtC">Entendido</button></div>`;d.showModal();$("#ayAtC").onclick=()=>d.close()}
  else dlg("⌨ Atajos de escritura",html,[["Entendido","p",cerrar]])}
