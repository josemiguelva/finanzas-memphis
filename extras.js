// =====================================================================================================
// Memphis · EXTRAS: ✅ tareas de todas las notas, 📋 revisión semanal, plantillas, seguimiento de tesis,
// 💰 costos por persona y por tema, y 🧾 soportes para la declaración de renta.
// =====================================================================================================
"use strict";
// ---------------------------------------------------------------- ✅ tareas: todos los «- [ ]» de diario, salud y biblioteca
const RE_TAREA=/^(\s*[-*]\s+\[)( |x|X)(\]\s+)(.*)$/;
function todasTareas(){const out=[];const fuentes=[...(S.diario||[]).map(o=>({k:"d",o,f:o.fecha})),...(S.salud||[]).map(o=>({k:"s",o,f:o.fecha})),...(S.biblio||[]).map(o=>({k:"b",o,f:diaLocal(o.creado)}))];
  for(const {k,o,f} of fuentes){const L=String(o.texto||"").split("\n");L.forEach((l,i)=>{const m=l.match(RE_TAREA);if(!m)return;const t=m[4].trim();if(!t)return;const r=leerCuando(t,f||hoyISO(),{modo:"futuro"});
    out.push({key:k+":"+o.id,k,o,linea:i,texto:t,hecha:m[2]!==" ",fecha:r.fecha&&/\d|hoy|manana|mañana|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|semana|mes|dias|días/i.test(t)?r.fecha:"",hora:r.hora,origen:f})})}
  return out}
function marcarTarea(t,hecha){const L=String(t.o.texto).split("\n");L[t.linea]=L[t.linea].replace(RE_TAREA,(_,a,b,c,d)=>a+(hecha?"x":" ")+c+d);guardarVersion(t.o,t.o.titulo,L.join("\n"));changed()}
function nuevaTarea(txt){const r=leerCuando(txt,hoyISO(),{modo:"futuro"});const e={id:uid(),tipo:"nota",titulo:"",texto:"- [ ] "+txt.trim(),fecha:hoyISO(),hora:ahoraHM(),horaFin:"",fechaFin:"",todoDia:false,lugar:"",alertas:[],adjuntos:[],enlaces:[],creado:new Date().toISOString(),editado:"",fijado:false,versiones:[]};
  (S.diario=S.diario||[]).push(e);asegurarFichas(txt);changed();return r}
function filaTarea(t){const ico=t.k==="d"?"📓":t.k==="s"?"🩺":"📚",venc=t.fecha&&!t.hecha&&t.fecha<hoyISO();
  return`<div class="tarea-f ${t.hecha?"hecha":""}"><input type="checkbox" data-tk="${esc(t.key)}" data-tl="${t.linea}" ${t.hecha?"checked":""}><span class="tt">${mdInline(t.texto)}</span>
   ${t.fecha?`<span class="chip ${venc?"bad":t.fecha===hoyISO()?"warn":""}">${esc(fechaCorta(t.fecha))}${t.hora?" "+t.hora:""}</span>`:""}<a href="#" class="small muted" data-vk="${esc(t.key)}" title="Ver de dónde viene">${ico}</a>${!t.hecha&&typeof abrirAnydo==="function"?`<button class="b s" data-tad="${esc(t.key)}|${t.linea}" title="Recordar en Any.do">⏰</button>`:""}</div>`}
function vTareas(){const T=todasTareas(),h0=hoyISO(),P=T.filter(t=>!t.hecha);const g=[["⚠️ Vencidas",P.filter(t=>t.fecha&&t.fecha<h0)],["📌 Hoy",P.filter(t=>t.fecha===h0)],["🗓️ Próximas",P.filter(t=>t.fecha>h0).sort((a,b)=>a.fecha.localeCompare(b.fecha))],["📝 Sin fecha",P.filter(t=>!t.fecha).sort((a,b)=>b.origen.localeCompare(a.origen))],["✔ Hechas (recientes)",T.filter(t=>t.hecha).sort((a,b)=>b.origen.localeCompare(a.origen)).slice(0,30)]];
  return`<div class="card"><div class="caprow"><input id="tN" placeholder="Nueva tarea: «llamar a @decana el jueves», «comprar #[Remodelación cocina] pintura»" autocomplete="off"><button class="b p" id="tG">Añadir</button></div><div class="small muted">Aquí se juntan todas las casillas «- [ ]» de tus notas, salud y biblioteca. Marcarlas aquí las marca en su nota.</div></div>
   ${g.filter(([,L])=>L.length).map(([n,L])=>`<div class="card"><h2>${n} <span class="small muted">${L.length}</span></h2>${L.map(filaTarea).join("")}</div>`).join("")||'<div class="card"><p class="small muted">No hay tareas. Escribe «- [ ] algo» en cualquier nota o usa el campo de arriba.</p></div>'}`}
function bindTareas(){const n=$("#tN");if(n){const go=()=>{const v=n.value.trim();if(!v)return;const r=nuevaTarea(v);n.value="";aviso(r.fecha?"Tarea para "+fechaCorta(r.fecha):"Tarea añadida");render()};n.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();go()}};$("#tG").onclick=go}
  document.querySelectorAll("[data-tk]").forEach(c=>c.onchange=()=>{const t=todasTareas().find(x=>x.key===c.dataset.tk&&x.linea===+c.dataset.tl);if(t){marcarTarea(t,c.checked);render()}});
  document.querySelectorAll("[data-tad]").forEach(b=>b.onclick=()=>{const [k,l]=b.dataset.tad.split("|");const t=todasTareas().find(x=>x.key===k&&x.linea===+l);if(t)abrirAnydo({titulo:limpiaMen(t.texto.replace(/\s*(el|este|para el)?\s*(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo|mañana|hoy)\b.*$/i,"")),fecha:t.fecha,hora:t.hora})})}

// ---------------------------------------------------------------- 📋 revisión semanal
let REV_LUN="";
function vRevision(){if(!REV_LUN)REV_LUN=masDias(lunesDe(hoyISO()),-7);const a=REV_LUN,b=masDias(a,6),a0=masDias(a,-7),b0=masDias(a,-1),h0=hoyISO();
  const M=S.mov.filter(m=>m.fecha>=a&&m.fecha<=b),M0=S.mov.filter(m=>m.fecha>=a0&&m.fecha<=b0),g=M.reduce((s,m)=>s+gastoDe(m),0),g0=M0.reduce((s,m)=>s+gastoDe(m),0);
  const cat={};for(const m of M){const v=gastoDe(m);if(v)cat[m.categoria||"Sin categoría"]=(cat[m.categoria||"Sin categoría"]||0)+v}
  const D=(S.diario||[]).filter(e=>e.fecha>=a&&e.fecha<=b),SA=(S.salud||[]).filter(r=>r.fecha>=a&&r.fecha<=b),T=todasTareas().filter(t=>!t.hecha),sig=masDias(b,7);
  const cum=(S.fichas||[]).filter(p=>p.tipo==="persona"&&p.datos&&p.datos.cumple).map(p=>({p,f:proxCumple(p.datos.cumple,h0)})).filter(x=>x.f<=masDias(h0,14)).sort((x,y)=>x.f.localeCompare(y.f));
  const ven=[...(S.venc||[]).filter(v=>v.estado!=="cerrado"&&v.vence>=h0&&v.vence<=masDias(h0,30)).map(v=>({t:v.titulo,f:v.vence})),...(S.biblio||[]).filter(x=>x.vence&&x.vence<=masDias(h0,60)).map(x=>({t:"🗂️ "+x.titulo,f:x.vence}))].sort((x,y)=>x.f.localeCompare(y.f));
  const rec=[];for(const r of S.rec||[])if(r.activo!==false)for(const f of ocurrencias(r,h0,masDias(h0,7)))rec.push({r,f});
  const fr=f=>`${dDe(f).getDate()} ${MESN[dDe(f).getMonth()]}`;
  return`<div class="dnav"><button class="b s" id="rvPrev">◀</button><button class="b s" id="rvHoy">Última semana</button><button class="b s" id="rvNext">▶</button><h2 class="dtit">Revisión: ${fr(a)} – ${fr(b)} ${b.slice(0,4)}</h2><span class="sp"></span><button class="b s" id="rvComp">📤 Compartir</button><button class="b s" id="rvCal">📅 Cada domingo</button></div>
   <div class="kpis"><div class="kpi"><div class="l">💰 Gastos de la semana</div><div class="v">${fmt(g)}</div><div class="small ${g>g0?"neg":"pos"}">${g0?(g>g0?"▲ ":"▼ ")+Math.abs(Math.round((g-g0)/g0*100))+"% vs. semana anterior":""}</div></div>
    <div class="kpi"><div class="l">📓 Notas y eventos</div><div class="v">${D.length}</div></div><div class="kpi"><div class="l">🩺 Salud</div><div class="v">${SA.length}</div></div><div class="kpi"><div class="l">✅ Tareas pendientes</div><div class="v">${T.length}</div><div class="small muted">${T.filter(t=>t.fecha&&t.fecha<h0).length} vencidas</div></div></div>
   <div class="g2"><div>${Object.keys(cat).length?`<div class="card"><h2>💰 En qué se fue</h2>${barrasS(Object.entries(cat).sort((x,y)=>y[1]-x[1]).slice(0,8).map(([k,v])=>[k,Math.round(v)]),"var(--mod)").replace(/<span class="sbn">(\d+)<\/span>/g,(m,n)=>`<span class="sbn" style="width:90px">${fmt(+n)}</span>`)}</div>`:""}
     ${D.filter(e=>e.tipo==="evento").length?`<div class="card"><h2>📅 Eventos</h2>${D.filter(e=>e.tipo==="evento").map(e=>tarjetaItem({k:"d",fecha:e.fecha,hora:e.hora,e})).join("")}</div>`:""}
     ${SA.length?`<div class="card"><h2>🩺 Salud</h2>${SA.map(r=>tarjetaS(r,{conFecha:true,corto:true})).join("")}</div>`:""}</div>
    <div><div class="card"><h2>➡️ Lo que viene</h2>
      ${T.filter(t=>t.fecha&&t.fecha<=sig).length?`<b class="small">Tareas</b>${T.filter(t=>t.fecha&&t.fecha<=sig).sort((x,y)=>x.fecha.localeCompare(y.fecha)).map(filaTarea).join("")}`:""}
      ${cum.length?`<div class="small" style="margin-top:6px"><b>🎂 Cumpleaños:</b> ${cum.map(x=>`${esc(x.p.nombre)} (${fr(x.f)})`).join(", ")}</div>`:""}
      ${ven.length?`<div class="small"><b>⏰ Vencen:</b> ${ven.map(x=>`${esc(x.t)} (${fr(x.f)})`).join(", ")}</div>`:""}
      ${rec.length?`<div class="small"><b>🔁 Cobros:</b> ${rec.map(x=>`${esc(x.r.nombre)} ${fmt(vigenteEn(x.r,x.f).monto||0)} (${fr(x.f)})`).join(", ")}</div>`:""}
      ${(S.bandeja||[]).length?`<div class="small"><b>📥 Bandeja:</b> ${(S.bandeja||[]).length} por clasificar</div>`:""}</div>
     <div class="card"><h2>✍️ Mi reflexión</h2><textarea id="rvTx" rows="4" placeholder="¿Qué salió bien? ¿Qué ajusto la próxima semana?"></textarea><button class="b s p" id="rvG">Guardar en el diario</button></div></div></div>`}
function bindRevision(){if(!$("#rvPrev"))return;$("#rvPrev").onclick=()=>{REV_LUN=masDias(REV_LUN,-7);render()};$("#rvNext").onclick=()=>{REV_LUN=masDias(REV_LUN,7);render()};$("#rvHoy").onclick=()=>{REV_LUN="";render()};
  $("#rvG").onclick=()=>{const t=$("#rvTx").value.trim();if(!t)return;S.diario.push({id:uid(),tipo:"nota",titulo:`Revisión semanal ${REV_LUN}`,texto:t+"\n\n#[Revisión semanal]",fecha:hoyISO(),hora:ahoraHM(),horaFin:"",fechaFin:"",todoDia:false,lugar:"",alertas:[],adjuntos:[],enlaces:[],creado:new Date().toISOString(),editado:"",fijado:false,versiones:[]});asegurarFichas("#[Revisión semanal]");changed();aviso("Guardada en el diario");$("#rvTx").value=""};
  $("#rvCal").onclick=()=>{const p=new URLSearchParams({action:"TEMPLATE",text:"📋 Revisión semanal (Memphis)",ctz:"America/Bogota",dates:gcDT(proxDomingo(),"18:00")+"/"+gcDT(proxDomingo(),"18:30"),recur:"RRULE:FREQ=WEEKLY;BYDAY=SU",details:"Abrir Memphis › Diario › 📋 Revisión"});
    dlg("📅 Recordatorio semanal",`<p class="small">Un recordatorio cada domingo a las 6 p. m. para hacer la revisión.</p>`,[["Cerrar","",cerrar],...(typeof abrirAnydo==="function"?[["⏰ Any.do","",()=>abrirAnydo({titulo:"hacer la revisión semanal en Memphis todos los domingos",fecha:"",hora:"18:00"})]]:[]),["📅 Google","p",()=>window.open("https://calendar.google.com/calendar/render?"+p,"_blank","noopener,noreferrer")]])};
  $("#rvComp").onclick=async()=>{const t=$("#view").innerText.replace(/\n{3,}/g,"\n\n").slice(0,6000);try{if(navigator.share)await navigator.share({title:"Revisión semanal",text:t});else{await navigator.clipboard.writeText(t);aviso("Copiado")}}catch(e){}}}
const proxDomingo=()=>{const h=dDe(hoyISO()).getDay();return masDias(hoyISO(),(7-h)%7||7)};

// ---------------------------------------------------------------- plantillas (diario y salud)
const PLANT_DEF=[{id:"pl_tesis",nombre:"🎓 Reunión de tesis",para:"diario",texto:"## Reunión de tesis con @[Estudiante]\n### Avances\n- \n### Dificultades\n- \n### Acuerdos\n- [ ] \n### Próxima reunión\n"},
  {id:"pl_clase",nombre:"🧪 Sesión de clase",para:"diario",texto:"## Sesión de #[Curso]\n### Tema\n\n### Observaciones\n\n### Pendientes\n- [ ] \n"},
  {id:"pl_acta",nombre:"📝 Acta de reunión",para:"diario",texto:"## Reunión: \n**Asistentes:** @\n### Temas\n1. \n### Decisiones\n- \n### Tareas\n- [ ] \n"},
  {id:"pl_bien",nombre:"🤝 Reunión de comité",para:"diario",texto:"## Reunión de comité\n**Asistentes:** \n### Seguimiento\n- \n### Nuevos casos o solicitudes\n- \n### Compromisos\n- [ ] \n"},
  {id:"pl_cita",nombre:"🩺 Cita médica",para:"salud",texto:"### Motivo\n\n### Qué dijo el médico\n\n### Fórmula y órdenes\n- \n### Próximo control\n- [ ] "}];
const plantillas=()=>Array.isArray(S.plantillas)&&S.plantillas.length?S.plantillas:PLANT_DEF;
MIGRAR_EXTRA.push((st)=>{if(Array.isArray(st.plantillas))st.plantillas=st.plantillas.filter(p=>p&&typeof p==="object"&&String(p.nombre||"").trim()).map(p=>({id:/^[\w-]{1,64}$/.test(String(p.id))?String(p.id):uid(),nombre:String(p.nombre).slice(0,80),para:p.para==="salud"?"salud":"diario",texto:String(p.texto||"").slice(0,20000)})).slice(0,60)});
CONFIG_EXTRA.push("plantillas");
function selPlantilla(para,X){const L=plantillas().filter(p=>p.para===para);if(!L.length)return null;const s=document.createElement("select");s.className="b s";s.title="Insertar una plantilla";
  s.innerHTML=`<option value="">📋 Plantilla…</option>${L.map(p=>`<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join("")}<option value="__ed">✏️ Editar plantillas…</option>`;
  s.onchange=()=>{const v=s.value;s.value="";if(v==="__ed"){editarPlantillas();return}const p=L.find(x=>x.id===v);if(!p||!X)return;const i=X.selectionStart||X.value.length;X.value=X.value.slice(0,i)+(i&&X.value[i-1]!=="\n"?"\n":"")+p.texto+X.value.slice(X.selectionEnd||i);X.dispatchEvent(new Event("input"));X.focus()};return s}
function editarPlantillas(){const L=structuredClone(plantillas());
  const pinta=()=>`${L.map((p,i)=>`<div class="card"><div class="filters"><input data-pn="${i}" value="${esc(p.nombre)}" style="flex:1"><select data-pp="${i}"><option value="diario" ${p.para==="diario"?"selected":""}>Diario</option><option value="salud" ${p.para==="salud"?"selected":""}>Salud</option></select><button class="b s" data-px="${i}">✕</button></div><textarea data-pt="${i}" rows="5">${esc(p.texto)}</textarea></div>`).join("")}<button class="b s" id="plN">+ Plantilla</button>`;
  const leer=()=>{document.querySelectorAll("[data-pn]").forEach(x=>L[+x.dataset.pn].nombre=x.value);document.querySelectorAll("[data-pp]").forEach(x=>L[+x.dataset.pp].para=x.value);document.querySelectorAll("[data-pt]").forEach(x=>L[+x.dataset.pt].texto=x.value)};
  const abrir=()=>{dlg("📋 Plantillas",`<p class="small muted">Texto que se inserta al escribir una nota o un registro de salud. Puedes usar Markdown, @personas, #temas y casillas «- [ ]».</p>${pinta()}`,[["Cancelar","",cerrar],["Restaurar las de fábrica","",()=>{if(confirm("¿Volver a las plantillas iniciales?")){S.plantillas=[];changed();cerrar()}}],["Guardar","p",()=>{leer();S.plantillas=L.filter(p=>p.nombre.trim());changed();cerrar();aviso("Plantillas guardadas")}]]);$("#dlg").classList.add("ancho");
    document.querySelectorAll("[data-px]").forEach(b=>b.onclick=()=>{leer();L.splice(+b.dataset.px,1);abrir()});$("#plN").onclick=()=>{leer();L.push({id:uid(),nombre:"Nueva plantilla",para:"diario",texto:""});abrir()}};abrir()}

// ---------------------------------------------------------------- 🎓 seguimiento de tesis (en la ficha de la persona)
const esTesista=f=>f&&f.tipo==="persona"&&((f.datos&&f.datos.tesis)||/tesis|tesista|maestr|doctorad|pasant/i.test((f.datos&&f.datos.rel)||""));
function tesisHtml(f){if(!esTesista(f))return"";const T=(f.datos&&f.datos.tesis)||{titulo:"",programa:"",inicio:"",hitos:[]},u=usosFicha(f),h0=hoyISO();
  const tareas=todasTareas().filter(t=>t.k==="d"&&u.ent.some(e=>e.id===t.o.id)&&!t.hecha),ult=u.ent[0];
  return`<div class="card"><div class="ih"><h2 style="margin:0">🎓 Tesis</h2><span class="sp"></span><button class="b s" id="tsE">Editar</button><button class="b s p" id="tsR">+ Reunión</button></div>
   ${T.titulo?`<div><b>${esc(T.titulo)}</b></div>`:'<div class="small muted">Sin título de tesis aún.</div>'}<div class="small muted">${[T.programa,T.inicio&&"desde "+T.inicio,ult&&"última reunión "+ult.fecha].filter(Boolean).map(esc).join(" · ")}</div>
   ${(T.hitos||[]).length?`<div style="margin-top:6px">${T.hitos.map((x,i)=>`<label class="tarea-f ${x.hecho?"hecha":""}"><input type="checkbox" data-th="${i}" ${x.hecho?"checked":""}><span class="tt">${esc(x.n)}</span>${x.fecha?`<span class="chip ${!x.hecho&&x.fecha<h0?"bad":""}">${esc(x.fecha)}</span>`:""}</label>`).join("")}</div>`:""}
   ${tareas.length?`<div class="small" style="margin-top:6px"><b>Compromisos abiertos</b></div>${tareas.map(filaTarea).join("")}`:""}</div>`}
function bindTesis(f){if(!$("#tsE"))return;$("#tsR").onclick=()=>{const p=plantillas().find(x=>x.id==="pl_tesis")||PLANT_DEF[0];editarD(null,{tipo:"nota",titulo:`Reunión de tesis — ${f.nombre}`,texto:p.texto.replace("@[Estudiante]","@["+f.nombre+"]"),fecha:hoyISO()})};
  document.querySelectorAll("[data-th]").forEach(c=>c.onchange=()=>{const T=f.datos.tesis;T.hitos[+c.dataset.th].hecho=c.checked;f.editado=new Date().toISOString();changed();render()});
  $("#tsE").onclick=()=>{const T=structuredClone((f.datos&&f.datos.tesis)||{titulo:"",programa:"",inicio:"",hitos:[]});
    dlg("🎓 Tesis de "+f.nombre,`<label>Título</label><input id="tsT" value="${esc(T.titulo)}" style="width:100%"><div class="filters"><input id="tsP" placeholder="Programa (Maestría en…)" value="${esc(T.programa)}" style="flex:1"><label class="small">Inicio <input type="date" id="tsI" value="${esc(T.inicio)}"></label></div>
      <label>Hitos (uno por línea: «Propuesta aprobada 2026-03-15», «Seminario I», «Sustentación»)</label><textarea id="tsH" rows="6">${esc((T.hitos||[]).map(x=>(x.hecho?"[x] ":"")+x.n+(x.fecha?" "+x.fecha:"")).join("\n"))}</textarea>`,
     [["Cancelar","",cerrar],["Guardar","p",()=>{const hit=$("#tsH").value.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const hecho=/^\[x\]\s*/i.test(l);l=l.replace(/^\[x\]\s*/i,"");const r=leerCuando(l,hoyISO(),{modo:"futuro"});const fm=l.match(/\d{4}-\d{2}-\d{2}/);return{n:(fm?l.replace(fm[0],""):r.fecha?r.titulo:l).trim().slice(0,200),fecha:fm?fm[0]:r.fecha||"",hecho}}).slice(0,40);
       f.datos=normDatosP({...(f.datos||{}),tesis:{titulo:$("#tsT").value.trim(),programa:$("#tsP").value.trim(),inicio:$("#tsI").value,hitos:hit}});f.editado=new Date().toISOString();changed();cerrar();render()}]])}}

// ---------------------------------------------------------------- 💰 costos por persona y por tema
function costosDeFicha(f,desde){const keys=new Set(["f:"+f.id]);if(f.tipo==="persona"){for(const r of S.salud||[])if(typeof esDe==="function"&&esDe(r,f.nombre))keys.add("s:"+r.id);for(const e of usosFicha(f).ent)keys.add("d:"+e.id)}
  if(f.tipo==="tema"){for(const e of usosFicha(f).ent)keys.add("d:"+e.id);for(const b of S.biblio||[])if(etiquetasDe(b).some(x=>claveF(x)===claveF(f.nombre)))keys.add("b:"+b.id)}
  const movs=new Map();for(const k of keys)for(const x of ligados(k))if(x.k==="m"&&(!desde||x.o.fecha>=desde))movs.set(x.id,{m:x.o,via:k});
  if(f.tipo==="persona")for(const m of usosFicha(f).mov)if(!desde||m.fecha>=desde)if(!movs.has(m.id))movs.set(m.id,{m,via:"nombre"});return[...movs.values()]}
function costosFichaHtml(f){if(f.tipo==="lugar")return"";const L=costosDeFicha(f).filter(x=>gastoDe(x.m)>0);if(!L.length)return"";const anio={},cat={};
  for(const {m} of L){const v=gastoDe(m);anio[m.fecha.slice(0,4)]=(anio[m.fecha.slice(0,4)]||0)+v;cat[m.categoria||"Otros"]=(cat[m.categoria||"Otros"]||0)+v}
  const sal=L.filter(x=>x.via.startsWith("s:")).reduce((a,x)=>a+gastoDe(x.m),0);
  return`<div class="card"><h2>💰 Lo que ha costado</h2><div class="small">${Object.entries(anio).sort().reverse().map(([y,v])=>`<b>${y}:</b> ${fmt(v)}`).join(" · ")}${sal?` · <span class="muted">en salud ${fmt(sal)}</span>`:""}</div>
   ${barrasS(Object.entries(cat).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>[k,Math.round(v)]),"var(--mod)").replace(/<span class="sbn">(\d+)<\/span>/g,(m,n)=>`<span class="sbn" style="width:90px">${fmt(+n)}</span>`)}
   <div class="small muted">Suma los gastos ligados a ${esc(f.nombre)}, a sus registros${f.tipo==="persona"?" de salud y notas":" y notas"}, y los movimientos que lo nombran.</div></div>`}
const costoSalud12=n=>{const f=fichaDe(n,"persona");if(!f)return 0;return costosDeFicha(f,masDias(hoyISO(),-365)).filter(x=>x.via.startsWith("s:")).reduce((a,x)=>a+gastoDe(x.m),0)};

// ---------------------------------------------------------------- 🧾 soportes para la declaración de renta
const RENTA=[["prepagada","🩺 Medicina prepagada / seguro de salud",/prepagad|colsanitas|medisanitas|coomeva mp|sura.*(salud|prepag)|allianz salud|plan complementario|colmedica/i],["vivienda","🏠 Intereses de vivienda / leasing habitacional",/leasing habitacional|credito hipotecario|crédito hipotecario|intereses vivienda/i],
  ["dependientes","👨‍👩‍👦 Dependientes (soporte)",null],["pension","🏦 Aportes voluntarios a pensión",/pension voluntaria|pensión voluntaria|fondo voluntario|porvenir voluntari|protecci[oó]n voluntari/i],["afc","💰 Cuenta AFC / AVC",/\bafc\b|\bavc\b/i],
  ["icetex","🎓 Intereses ICETEX",/icetex/i],["gmf","🧾 GMF (4×1000)",/\bgmf\b|4x1000|4 x 1000|gravamen/i],["donacion","🎁 Donaciones",/donaci/i],["salud","💊 Otros gastos de salud (soporte)",null],["otro","📎 Otro soporte",null]];
const huellaRT=x=>x.tipo;
MIGRAR_EXTRA.push(st=>{st.renta=(Array.isArray(st.renta)?st.renta:[]).filter(x=>x&&/^rt_[\w-]{1,60}$/.test(String(x.id))&&RENTA.some(r=>r[0]===x.tipo)).map(x=>({id:String(x.id),tipo:x.tipo,creado:/^\d{4}-\d\d-\d\dT/.test(String(x.creado))?String(x.creado):new Date().toISOString()}))});
LISTAS_EXTRA.push({k:"renta",base:"_baseRT",hf:huellaRT,ord:(a,b)=>a.id.localeCompare(b.id)});
const rentaDe=id=>((S.renta||[]).find(x=>x.id==="rt_"+id)||{}).tipo||"";
function ponRenta(id,tipo){S.renta=(S.renta||[]).filter(x=>x.id!=="rt_"+id);if(!tipo)(S.eliminados=S.eliminados||[]).push({id:"rt_"+id,fecha:new Date().toISOString()});else S.renta.push({id:"rt_"+id,tipo,creado:new Date().toISOString()});changed()}
const rentaSugerida=m=>{const t=[m.estab,m.desc,m.concepto,m.categoria].join(" ");const r=RENTA.find(r=>r[2]&&r[2].test(t));return r?r[0]:""};
function rentaHtml(){const anios=[...new Set(S.mov.map(m=>m.fecha.slice(0,4)))].sort().reverse(),y=rentaHtml.y||String(+hoyISO().slice(0,4)-(+hoyISO().slice(5,7)<=8?1:0));
  const M=S.mov.filter(m=>m.fecha.startsWith(y)),mar=M.filter(m=>rentaDe(m.id)),sug=M.filter(m=>!rentaDe(m.id)&&rentaSugerida(m)&&!(S.renta||[]).some(x=>x.id==="rt_"+m.id));const tot={};for(const m of mar){const t=rentaDe(m.id);tot[t]=(tot[t]||0)+(+m.valor||0)}
  return`<div class="card" id="rentaCard"><div class="ih"><h2 style="margin:0">🧾 Soportes para la declaración de renta</h2><span class="sp"></span><select id="rtY">${anios.map(a=>`<option ${a===y?"selected":""}>${a}</option>`).join("")}</select>${mar.length?'<button class="b s" id="rtCsv">⬇️ CSV</button>':""}</div>
   <p class="small muted">Marca en cada movimiento (al editarlo) si sirve como soporte. Esto solo organiza; qué es deducible y cuánto lo confirma tu contador.</p>
   ${Object.keys(tot).length?`<div class="tw"><table><tr><th>Concepto</th><th class="n">Movimientos</th><th class="n">Total</th></tr>${RENTA.filter(r=>tot[r[0]]).map(r=>`<tr><td>${r[1]}</td><td class="n">${mar.filter(m=>rentaDe(m.id)===r[0]).length}</td><td class="n">${fmt(tot[r[0]])}</td></tr>`).join("")}</table></div>`:'<p class="small">Aún no hay movimientos marcados este año.</p>'}
   ${sug.length?`<details><summary class="small"><b>${sug.length} posibles</b> (prepagada, ICETEX, 4×1000, pensión voluntaria…)</summary>${sug.slice(0,80).map(m=>`<div class="small vrow"><span style="flex:1">${esc(m.fecha)} · ${esc(m.estab||m.desc)} · ${fmt(m.valor)}</span><button class="b s p" data-rts="${esc(m.id)}|${rentaSugerida(m)}">${esc(RENTA.find(r=>r[0]===rentaSugerida(m))[1])}</button><button class="b s" data-rtn="${esc(m.id)}">No</button></div>`).join("")}</details>`:""}</div>`}
function bindRenta(){if(!$("#rentaCard"))return;$("#rtY").onchange=()=>{rentaHtml.y=$("#rtY").value;render()};
  document.querySelectorAll("[data-rts]").forEach(b=>b.onclick=()=>{const [id,t]=b.dataset.rts.split("|");ponRenta(id,t);render()});
  document.querySelectorAll("[data-rtn]").forEach(b=>b.onclick=()=>{S.renta=(S.renta||[]).filter(x=>x.id!=="rt_"+b.dataset.rtn);S.renta.push({id:"rt_"+b.dataset.rtn,tipo:"otro",creado:new Date().toISOString(),no:true});ponRenta(b.dataset.rtn,"");render()});
  if($("#rtCsv"))$("#rtCsv").onclick=()=>{const y=$("#rtY").value,M=S.mov.filter(m=>m.fecha.startsWith(y)&&rentaDe(m.id));const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
    descargar(new Blob(["﻿Fecha;Concepto renta;Establecimiento;Descripción;Valor;Cuenta;Adjuntos\n"+M.map(m=>[m.fecha,RENTA.find(r=>r[0]===rentaDe(m.id))[1].replace(/^\S+\s/,""),m.estab,m.desc,m.valor,m.cuenta,(m.adjuntos||[]).length].map(q).join(";")).join("\n")],{type:"text/csv"}),`soportes_renta_${y}.csv`)}}

// ---------------------------------------------------------------- enganches
window.addEventListener("load",()=>{
  // diario: pestañas Tareas y Revisión
  const vd=window.vDiario;if(typeof vd==="function")window.vDiario=function(){if(TD.vista==="tareas"||TD.vista==="revision"){if(!TD.fecha)TD.fecha=hoyISO();$("#view").innerHTML=TD.vista==="tareas"?vTareas():vRevision();bindItems($("#view"));bindTareas();bindRevision();return}return vd.apply(this,arguments)};
  // agenda: tareas con fecha
  const vdia=window.vDia;if(typeof vdia==="function")window.vDia=function(){let h=vdia.apply(this,arguments);const T=todasTareas().filter(t=>!t.hecha&&t.fecha===TD.fecha);const H=(S.fichas||[]).flatMap(f=>((f.datos&&f.datos.tesis&&f.datos.tesis.hitos)||[]).filter(x=>x.fecha===TD.fecha).map(x=>`<div class="tarea-f ${x.hecho?"hecha":""}"><span class="tt">🎓 ${esc(x.n)} — <a href="#" data-fi="${esc(f.id)}">${esc(f.nombre)}</a></span></div>`));
  if(T.length||H.length)h=`<div class="card"><h2>✅ Tareas del día</h2>${T.map(filaTarea).join("")}${H.join("")}</div>`+h;return h};
  const bd=window.bindDiario;if(typeof bd==="function")window.bindDiario=function(){const r=bd.apply(this,arguments);bindTareas();return r};
  // fichas: tesis y costos
  const vf=window.vFichas;if(typeof vf==="function")window.vFichas=function(){let h=vf.apply(this,arguments);const f=(S.fichas||[]).find(x=>x.id===TD.ficha);if(f){const extra=tesisHtml(f)+costosFichaHtml(f);if(extra)h=h.replace('<div class="g2">',`<div class="g2x">${extra}</div><div class="g2">`)}return h};
  const vdi=window.vDiario;window.vDiario=function(){const r=vdi.apply(this,arguments);if(TD.vista==="fichas"){const f=(S.fichas||[]).find(x=>x.id===TD.ficha);if(f)bindTesis(f)}return r};
  // editores: plantillas
  const ed=window.editarD;if(typeof ed==="function")window.editarD=function(){const r=ed.apply(this,arguments);const tb=$("#dlgB .tb"),X=$("#deX");if(tb&&X){const s=selPlantilla("diario",X);if(s)tb.insertBefore(s,tb.querySelector(".sp"))}return r};
  const es=window.editarS;if(typeof es==="function")window.editarS=function(){const r=es.apply(this,arguments);const tb=$("#dlgB .tb"),X=$("#seX");if(tb&&X){const s=selPlantilla("salud",X);if(s)tb.insertBefore(s,tb.querySelector(".sp"))}return r};
  // movimientos: soporte para la renta
  const em=window.editar;if(typeof em==="function")window.editar=function(id,...a){const r=em.call(this,id,...a);const n=$("#eN");if(n&&$("#dlg").open){const m=S.mov.find(x=>x.id===id);const cur=id?rentaDe(id):"",sug=m&&!cur?rentaSugerida(m):"";
    n.insertAdjacentHTML("afterend",`<label>🧾 ¿Sirve como soporte para la renta?</label><select id="eRt" style="width:100%"><option value="">No</option>${RENTA.map(x=>`<option value="${x[0]}" ${cur===x[0]?"selected":""}>${x[1]}${sug===x[0]?" (sugerido)":""}</option>`).join("")}</select>`);
    const getId=()=>id||(S.mov.find(x=>x.fecha===$("#eF").value&&x.estab===$("#eE").value.trim())||{}).id;$("#eRt").onchange=()=>{const i=getId();if(i)ponRenta(i,$("#eRt").value);else{const v=$("#eRt").value,F=$("#eF").value,E=$("#eE").value.trim(),t0=Date.now(),ids=new Set(S.mov.map(x=>x.id));const iv=setInterval(()=>{if($("#dlg").open&&Date.now()-t0<6e5)return;clearInterval(iv);const nm=S.mov.find(x=>!ids.has(x.id)&&x.fecha===F);if(nm&&v)ponRenta(nm.id,v)},700)}}}return r};
  // análisis: tarjeta de renta
  const vr=window.vResumen;if(typeof vr==="function")window.vResumen=function(){const r=vr.apply(this,arguments);const v=$("#view");if(v&&S){v.insertAdjacentHTML("beforeend",rentaHtml());bindRenta()}return r};
  // salud: costo en las tarjetas de persona
  const vrs=window.vResumenS;if(typeof vrs==="function")window.vResumenS=function(){let h=vrs.apply(this,arguments);return h.replace(/(<div class="card pcard" style="--c:[^"]*"><div class="ih click" data-sper="([^"]*)">)/g,(m0,a,n)=>{const c=costoSalud12(n.replace(/&amp;/g,"&").replace(/&quot;/g,'"'));return c?a.replace('<div class="ih click"',`<div class="small pcost">💰 ${fmt(c)} en salud (12 m)</div><div class="ih click"`):a})};
});

// ---------------------------------------------------------------- corrección única: gastos anotados de noche que quedaron con fecha de mañana
// (hasta la versión 2026.11.24-huella el editor tomaba la fecha en hora UTC: de 7 p. m. a medianoche en Bogotá ponía el día siguiente)
function nochesCorridas(){return S.mov.filter(m=>m.origen==="manual"&&m.editado&&!m.recId&&(()=>{const u=m.editado.slice(0,10),l=diaLocal(m.editado);return u!==l&&m.fecha===u})())}
function revisarNochesCorridas(){S.mig=S.mig||{};if(S.mig.nocheUTC1)return;const L=nochesCorridas();if(!L.length){S.mig.nocheUTC1=true;changed();return}
  dlg("📅 Fechas corridas por la noche",`<p class="small">Hasta hoy, los gastos que anotabas a mano después de las 7 p. m. quedaban con la fecha del <b>día siguiente</b>. Encontré ${L.length} que parecen tener ese error:</p>
   ${L.sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,60).map(m=>`<label class="vrow small"><input type="checkbox" data-nc="${esc(m.id)}" checked><span style="flex:1">${esc(m.estab||m.desc||m.concepto||"(sin nombre)")} · ${fmt(m.valor)}</span><span>${esc(m.fecha)} → <b>${esc(diaLocal(m.editado))}</b></span></label>`).join("")}
   <p class="small muted">Desmarca los que de verdad eran para el día siguiente.</p>`,
   [["Después","",cerrar],["No corregir","",()=>{S.mig.nocheUTC1=true;changed();cerrar()}],["Corregir marcados","p",()=>{let n=0;document.querySelectorAll("[data-nc]").forEach(c=>{if(!c.checked)return;const m=S.mov.find(x=>x.id===c.dataset.nc);if(m){m.fecha=diaLocal(m.editado);m.editado=new Date().toISOString();n++}});S.mig.nocheUTC1=true;changed();cerrar();render();aviso(`${n} fecha${n===1?"":"s"} corregida${n===1?"":"s"}`)}]])}
window.addEventListener("load",()=>{const dz=window.desbloqueado;if(typeof dz==="function")window.desbloqueado=function(){const r=dz.apply(this,arguments);setTimeout(()=>{try{if(S&&!$("#dlg").open)revisarNochesCorridas()}catch(e){}},2500);return r}});
