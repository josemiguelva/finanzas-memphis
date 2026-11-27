// =====================================================================================================
// Memphis · MEJORAS: ⟳ recargar todo · 📥 por clasificar → Biblioteca · 🧳 eventos de varios días con subeventos
// =====================================================================================================
"use strict";
// ---------------------------------------------------------------- ⟳ recargar todo
const RC={ocupado:false,ult:"",err:""};
async function recargarTodo(manual=true){if(!S||RC.ocupado)return;RC.ocupado=true;pintaSync();const partes=[],errs=[];
  try{if(navigator.onLine===false){errs.push("sin conexión")}
    try{const n=typeof procesarPendientes==="function"?await procesarPendientes():0;if(n)partes.push(`${n} compartido${n>1?"s":""}`)}catch(e){}
    if(S.telegram&&S.telegram.token&&navigator.onLine!==false){const b0=(S.bandeja||[]).length;try{await revisarTelegram(false)}catch(e){errs.push("Telegram")}const d=(S.bandeja||[]).length-b0;if(d>0)partes.push(`${d} de Telegram`)}
    if(typeof conDropbox==="function"&&conDropbox()&&navigator.onLine!==false){DBX.error="";for(let i=0;i<40&&DBX.ocupado;i++)await new Promise(r=>setTimeout(r,250));await dbxSync("manual");for(let i=0;i<120&&DBX.ocupado;i++)await new Promise(r=>setTimeout(r,250));if(DBX.error)errs.push("Dropbox: "+DBX.error);else partes.unshift("Dropbox ✓")}
    if(typeof sincCalendarios==="function"&&typeof cxListo==="function"&&cxListo()&&navigator.onLine!==false){CX.ocupado=false;const r=await sincCalendarios(false);if(r){if(r.errores.length)errs.push(...r.errores);else partes.push(r.n||r.u||r.b?`calendarios: ${r.n} nuevos${r.u?`, ${r.u} cambiados`:""}`:"calendarios ✓")}}}
  finally{RC.ocupado=false;RC.ult=new Date().toISOString();RC.err=errs.join(" · ");pintaSync();render()}
  if(manual)aviso((errs.length?"⚠️ "+errs.join(" · ")+(partes.length?" — ":""):"⟳ ")+(partes.join(" · ")||(errs.length?"":"todo al día")))}
function pintaSync(){const b=$("#btnSync");if(!b)return;b.classList.toggle("girando",RC.ocupado);b.classList.toggle("conerr",!!RC.err);
  b.title=RC.ocupado?"Actualizando…":`Actualizar: Dropbox, calendarios, Telegram y compartidos${RC.ult?" · última vez "+new Date(RC.ult).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}):""}${RC.err?" · ⚠️ "+RC.err:""}`}
function ponerBotonSync(){if($("#btnSync"))return;const ref=$("#btnBandeja")||$("#btnTema");if(!ref)return;ref.insertAdjacentHTML("beforebegin",'<button class="b" id="btnSync" title="Actualizar"><span class="ico">⟳</span></button>');
  $("#btnSync").onclick=()=>{if(RC.err&&!RC.ocupado&&$("#btnSync").classList.contains("conerr")&&!confirm("Último problema: "+RC.err+"\n\n¿Intentar otra vez?"))return;recargarTodo(true)};pintaSync()}
// deslizar hacia abajo para recargar (solo en la app instalada; en el navegador lo hace el propio navegador)
function deslizarParaRecargar(){if(!matchMedia("(display-mode: standalone)").matches)return;document.documentElement.style.overscrollBehaviorY="contain";
  let y0=null,d=0;const ind=document.createElement("div");ind.id="ptr";ind.textContent="⟳";document.body.appendChild(ind);
  addEventListener("touchstart",e=>{y0=scrollY<=0&&!$("#dlg").open&&S?e.touches[0].clientY:null;d=0},{passive:true});
  addEventListener("touchmove",e=>{if(y0==null)return;d=e.touches[0].clientY-y0;if(d>0){ind.style.transform=`translate(-50%,${Math.min(d,110)-50}px) rotate(${d*3}deg)`;ind.classList.toggle("listo",d>85)}},{passive:true});
  addEventListener("touchend",()=>{if(y0!=null&&d>85)recargarTodo(true);y0=null;d=0;ind.style.transform="";ind.classList.remove("listo")},{passive:true})}

// ---------------------------------------------------------------- 📥 por clasificar → 📚 Biblioteca
const SELC=new Set();let CL_TODAS=false;
const claveCl=x=>x.k+":"+x.o.id;
function porClasificar(){const L=[];for(const x of S.bandeja||[])L.push({k:"ba",o:x,fecha:diaLocal(x.fecha),titulo:x.titulo||(x.texto||x.url||"").split("\n")[0].slice(0,120)||((x.adjuntos||[]).length?"📎 Archivos":"(vacío)"),de:x.de});
  const lim=masDias(hoyISO(),-60),enBib=new Set((S.vinculos||[]).filter(v=>!v.no).flatMap(v=>[v.a,v.b]).filter(k=>k.startsWith("d:")&&(S.vinculos||[]).some(w=>(w.a===k&&w.b.startsWith("b:"))||(w.b===k&&w.a.startsWith("b:")))));
  for(const e of S.diario||[]){if(e.tipo!=="nota"||e.priv)continue;const cap=e.cap&&!e.cap.clas;if(!cap&&!(CL_TODAS&&e.fecha>=lim&&!enBib.has("d:"+e.id)&&!(e.cap&&e.cap.clas)))continue;
    L.push({k:"d",o:e,fecha:e.fecha,titulo:e.titulo||(e.texto||"").split("\n").find(l=>l.trim())||((e.adjuntos||[]).length?"📎 Archivos":(e.enlaces||[])[0]?e.enlaces[0].url:"(nota)"),de:e.cap?e.cap.de:""})}
  return L.sort((a,b)=>b.fecha.localeCompare(a.fecha))}
const icoDe=de=>({telegram:"✈️",compartir:"📲",pegado:"📋",marcador:"🔖",archivo:"📁"})[de]||"📥";
function vClasificar(){const L=porClasificar();for(const k of [...SELC])if(!L.some(x=>claveCl(x)===k))SELC.delete(k);
  return`<div class="card"><div class="ih"><h2 style="margin:0">📥 Por clasificar <span class="small muted">${L.length}</span></h2><span class="sp"></span><label class="small" style="margin:0"><input type="checkbox" id="clT" ${CL_TODAS?"checked":""}> incluir todas mis notas de los últimos 60 días</label></div>
   <p class="small muted">Lo que llegó por Telegram, Compartir o la bandeja. Elige y mándalo a la Biblioteca (queda copiado y relacionado con su nota), déjalo como nota o descártalo.</p>
   ${L.length?`<div class="filters"><label class="small" style="margin:0"><input type="checkbox" id="clAll" ${SELC.size&&SELC.size===L.length?"checked":""}> seleccionar todo</label></div>${L.map(x=>`<label class="clrow"><input type="checkbox" data-cl="${esc(claveCl(x))}" ${SELC.has(claveCl(x))?"checked":""}><span class="cli">${icoDe(x.de)}</span><span class="clt"><b>${esc(x.titulo)}</b><span class="small muted">${esc(fechaCorta(x.fecha))} ${x.fecha.slice(0,4)}${x.k==="ba"?" · en la bandeja":""}${(x.o.adjuntos||[]).length?` · 📎 ${x.o.adjuntos.length}`:""}${x.o.url||(x.o.enlaces||[]).length?" · 🔗":""}</span></span><a href="#" class="small" data-clv="${esc(claveCl(x))}">ver</a></label>`).join("")}`:'<p class="small muted">Nada por clasificar ✔</p>'}</div>
   ${SELC.size?`<div class="selbar"><span><b>${SELC.size}</b> seleccionado${SELC.size>1?"s":""}</span><button class="b s p" id="clB">📚 A la Biblioteca</button><button class="b s" id="clN">✓ Dejar como nota</button><button class="b s" id="clX">🗑 Descartar</button></div>`:""}`}
function bindClasificar(){if($("#clT"))$("#clT").onchange=()=>{CL_TODAS=$("#clT").checked;render()};
  const L=porClasificar(),sel=()=>L.filter(x=>SELC.has(claveCl(x)));
  if($("#clAll"))$("#clAll").onchange=()=>{SELC.clear();if($("#clAll").checked)L.forEach(x=>SELC.add(claveCl(x)));render()};
  document.querySelectorAll("[data-cl]").forEach(c=>c.onchange=()=>{c.checked?SELC.add(c.dataset.cl):SELC.delete(c.dataset.cl);render()});
  document.querySelectorAll("[data-clv]").forEach(a=>a.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const [k,id]=a.dataset.clv.split(":");if(k==="d")verD(id);else if(typeof verBandeja==="function")verBandeja()});
  if($("#clB"))$("#clB").onclick=()=>aBiblioteca(sel(),()=>{SELC.clear();render()});
  if($("#clN"))$("#clN").onclick=()=>{let n=0;for(const x of sel()){if(x.k==="d"){x.o.cap={de:(x.o.cap||{}).de||"",clas:true};x.o.editado=new Date().toISOString();n++}else{notaDesdeBa(x.o);n++}}SELC.clear();changed();aviso(`✓ ${n} como nota${n>1?"s":""}`);render()};
  if($("#clX"))$("#clX").onclick=()=>{const S0=sel();if(!confirm(`¿Descartar ${S0.length}? Van a la papelera y se pueden recuperar.`))return;for(const x of S0){if(x.k==="d"){aPapelera("diario",x.o);S.diario=S.diario.filter(y=>y!==x.o);S.eliminados.push({id:x.o.id,fecha:new Date().toISOString()})}else quitarBa(x.o.id)}SELC.clear();changed();aviso(`🗑 ${S0.length} descartado${S0.length>1?"s":""}`);render()}}
function notaDesdeBa(x){const e={id:uid(),tipo:"nota",titulo:x.titulo||"",texto:x.texto||x.url||"",fecha:diaLocal(x.fecha),hora:new Date(x.fecha).toTimeString().slice(0,5),horaFin:"",fechaFin:"",todoDia:false,lugar:"",alertas:[],adjuntos:(x.adjuntos||[]).slice(),enlaces:x.url?[{url:x.url,titulo:x.titulo||"",modo:"titulo",captura:""}]:[],creado:new Date().toISOString(),editado:"",fijado:false,versiones:[],cap:{de:String(x.de||"bandeja").slice(0,20),clas:true}};
  S.diario.push(e);asegurarFichas(e.titulo+" "+e.texto);quitarBa(x.id);return e}
function tipoSugerido(o){const t=[o.titulo,o.texto,o.url,(o.enlaces||[]).map(l=>l.url).join(" ")].join(" ");if(normDOI(t))return"referencia";if((o.adjuntos||[]).some(a=>/pdf/.test(a.mime||"")))return"pdf";if(o.url||(o.enlaces||[]).length||/https?:\/\//.test(t))return"enlace";if((o.adjuntos||[]).some(a=>/^image|word|sheet|presentation|officedocument/.test(a.mime||"")))return"documento";return"nota"}
function aBiblioteca(items,listo){if(!items.length)return;const cols=[...new Set((S.biblio||[]).map(x=>x.coleccion).filter(Boolean))].sort();
  dlg(`📚 A la Biblioteca (${items.length})`,`<label>Tipo</label><select id="abT" style="width:100%"><option value="">Automático según cada uno (enlace, PDF, referencia, nota…)</option>${Object.entries(BTIPOS).map(([k,[i,l]])=>`<option value="${k}">${i} ${l}</option>`).join("")}</select>
    <label>Etiquetas (separadas por coma)</label><input id="abE" placeholder="recetas, por leer…" style="width:100%" list="abEL"><datalist id="abEL">${[...new Set((S.biblio||[]).flatMap(etiquetasDe))].slice(0,200).map(t=>`<option value="${esc(t)}">`).join("")}</datalist>
    <label>Colección (opcional)</label><input id="abC" list="abCL" style="width:100%"><datalist id="abCL">${cols.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
    <label class="small"><input type="checkbox" id="abEs"> Marcar «por leer»</label>
    <label class="small"><input type="checkbox" id="abM"> <b>Mover</b>: quitar del Diario (si no, queda copiado y relacionado con su nota)</label>`,
   [["Cancelar","",cerrar],["Pasar","p",async()=>{const tf=$("#abT").value,et=$("#abE").value.split(",").map(x=>x.trim().replace(/^#/,"")).filter(Boolean),co=$("#abC").value.trim(),mov=$("#abM").checked,est=$("#abEs").checked?"por leer":"",ah=new Date().toISOString();let n=0,ult=null;
     for(const x of items){let e=x.k==="ba"?notaDesdeBa(x.o):x.o;const url=(e.enlaces||[])[0]?e.enlaces[0].url:"";const b={id:uid(),tipo:tf||tipoSugerido({...e,url}),titulo:(e.titulo||(e.texto||"").split("\n").find(l=>l.trim())||url||"Sin título").slice(0,400),texto:e.texto||"",url,doi:normDOI([e.texto,url].join(" ")),autores:[],anio:"",revista:"",vol:"",num:"",pags:"",editorial:"",
        etiquetas:et,coleccion:co,estado:est,vence:"",fijado:false,adjuntos:(e.adjuntos||[]).slice(),creado:e.creado||ah,editado:"",versiones:[]};
       (S.biblio=S.biblio||[]).push(b);asegurarFichas(b.titulo+" "+b.texto+" "+et.map(t=>"#["+t+"]").join(" "));ult=b;
       if(mov){aPapelera("diario",e);S.diario=S.diario.filter(y=>y!==e);S.eliminados.push({id:e.id,fecha:ah})}else{e.cap={de:(e.cap||{}).de||"",clas:true};e.editado=ah;ligar("d:"+e.id,"b:"+b.id)}n++}
     changed();cerrar();aviso(`📚 ${n} en la Biblioteca${mov?" (movido)":" (copiado y relacionado)"}`);if(listo)listo();if(n===1&&ult)setTimeout(()=>verB(ult.id),150)}]])}

// ---------------------------------------------------------------- ☑ seleccionar varias en el día
let SELD=null;
function selDiaBar(){return SELD?`<div class="selbar"><span><b>${SELD.size}</b> seleccionada${SELD.size===1?"":"s"}</span><button class="b s p" id="sdB" ${SELD.size?"":"disabled"}>📚 A la Biblioteca</button><button class="b s" id="sdX" ${SELD.size?"":"disabled"}>🗑 Descartar</button><button class="b s" id="sdC">Listo</button></div>`:""}
function bindSelDia(){const v=$("#view");if(!v)return;if(TD.vista==="dia"&&!$("#sdToggle")){const n=v.querySelector(".g2.dia");if(n)n.insertAdjacentHTML("beforebegin",`<div class="filters" style="justify-content:flex-end;margin:0 0 4px"><button class="b s" id="sdToggle">${SELD?"✕ Cancelar selección":"☑ Seleccionar"}</button></div>${selDiaBar()}`)}
  if($("#sdToggle"))$("#sdToggle").onclick=()=>{SELD=SELD?null:new Set();render()};
  if(SELD){v.querySelectorAll(".g2.dia [data-d]").forEach(el=>{const id=el.dataset.d,e=(S.diario||[]).find(x=>x.id===id);if(!e||e.priv)return;el.classList.add("selm");el.insertAdjacentHTML("afterbegin",`<input type="checkbox" class="selck" ${SELD.has(id)?"checked":""}>`);
      el.onclick=ev=>{ev.preventDefault();ev.stopPropagation();SELD.has(id)?SELD.delete(id):SELD.add(id);render()}});
    const its=()=>[...SELD].map(id=>({k:"d",o:S.diario.find(x=>x.id===id)})).filter(x=>x.o);
    if($("#sdB"))$("#sdB").onclick=()=>aBiblioteca(its(),()=>{SELD=null;render()});
    if($("#sdX"))$("#sdX").onclick=()=>{const L=its();if(!confirm(`¿Descartar ${L.length}? Van a la papelera.`))return;for(const x of L){aPapelera("diario",x.o);S.diario=S.diario.filter(y=>y!==x.o);S.eliminados.push({id:x.o.id,fecha:new Date().toISOString()})}SELD=null;changed();render()};
    if($("#sdC"))$("#sdC").onclick=()=>{SELD=null;render()}}}

// ---------------------------------------------------------------- 🧳 eventos de varios días con subeventos
const hijosDe=id=>(S.diario||[]).filter(e=>e.padre===id).sort((a,b)=>(a.fecha+(a.hora||"99")).localeCompare(b.fecha+(b.hora||"99")));
const padreDe=e=>e&&e.padre?(S.diario||[]).find(x=>x.id===e.padre):null;
const esLargo=e=>e&&e.tipo==="evento"&&e.fechaFin&&e.fechaFin>e.fecha;
function diasDe(e){const L=[];let f=e.fecha;while(f<=e.fechaFin&&L.length<120){L.push(f);f=masDias(f,1)}return L}
function largosEn(f){return(S.diario||[]).filter(e=>esLargo(e)&&!e.priv&&e.fecha<=f&&e.fechaFin>=f)}
let VIAJE={id:"",dia:""};
function panelViaje(e){const D=diasDe(e);if(!VIAJE.dia||VIAJE.id!==e.id||!D.includes(VIAJE.dia)){VIAJE={id:e.id,dia:D.includes(hoyISO())?hoyISO():D[0]}}const H=hijosDe(e.id),dia=VIAJE.dia,hd=H.filter(x=>x.fecha===dia);
  const movs=S.mov.filter(m=>m.fecha>=e.fecha&&m.fecha<=e.fechaFin),lig=new Set([e.id,...H.map(x=>x.id)].flatMap(id=>ligados("d:"+id)).filter(x=>x.k==="m").map(x=>x.id)),gL=movs.filter(m=>lig.has(m.id)).reduce((a,m)=>a+gastoDe(m),0),gT=movs.reduce((a,m)=>a+gastoDe(m),0);
  const fotos=H.reduce((a,x)=>a+(x.adjuntos||[]).length,0);
  return`<div class="card" id="viajeBox" style="margin-top:8px"><div class="ih"><h2 style="margin:0">🧳 Día a día</h2><span class="sp"></span><span class="small muted">${H.length} anotación${H.length===1?"":"es"}${fotos?` · 📎 ${fotos}`:""}</span></div>
   <div class="vjdias">${D.map((f,i)=>{const n=H.filter(x=>x.fecha===f).length;return`<button class="b s ${f===dia?"p":""}" data-vjd="${f}">Día ${i+1}<span class="small"> ${dDe(f).getDate()} ${MESN[dDe(f).getMonth()]}</span>${n?` <span class="chip">${n}</span>`:""}</button>`}).join("")}</div>
   <div class="caprow" style="margin-top:6px"><input id="vjN" placeholder="Añadir al ${esc(fechaCorta(dia))}: «10 am museo del oro», «almuerzo en la playa»…" autocomplete="off"><button class="b s p" id="vjG">+ Añadir</button></div>
   <label class="small"><input type="checkbox" id="vjO"> ocultar en la agenda (solo se ve aquí)</label>
   <div id="vjL">${hd.length?hd.map(x=>`<div class="it ${x.tipo} vjit" data-d="${esc(x.id)}"><span class="hr2">${esc(x.hora||"")}</span> ${x.titulo?`<b>${esc(x.titulo)}</b> `:""}${esc((x.texto||"").split("\n")[0].slice(0,120))}${(x.adjuntos||[]).length?" 📎":""}${x.oculto?' <span class="chip">oculto</span>':""}</div>`).join(""):'<p class="small muted">Nada anotado este día.</p>'}</div>
   <details style="margin-top:6px"><summary class="small"><b>Resumen del ${e.titulo?"«"+esc(e.titulo)+"»":"evento"}</b> · gastos ${fmt(gL||gT)}${gL?" ligados":" en esas fechas"}</summary>
    <div class="small">${D.map((f,i)=>{const L=H.filter(x=>x.fecha===f);return L.length?`<div style="margin-top:4px"><b>Día ${i+1} · ${esc(fechaLarga(f))}</b>${L.map(x=>`<div>• ${esc(x.hora?x.hora+" ":"")}${esc(x.titulo||(x.texto||"").split("\n")[0].slice(0,140))}</div>`).join("")}</div>`:""}).join("")||"Sin anotaciones."}</div>
    <div class="small" style="margin-top:6px"><b>💰 Gastos de esas fechas</b> (${fmt(gT)}). Marca los del viaje para ligarlos:</div>
    ${movs.slice(0,80).map(m=>`<label class="small vrow"><input type="checkbox" data-vjm="${esc(m.id)}" ${lig.has(m.id)?"checked":""}><span style="flex:1">${esc(fechaCorta(m.fecha))} · ${esc(m.estab||m.desc||m.concepto)}</span><span>${fmt(m.valor)}</span></label>`).join("")||'<div class="small muted">No hay movimientos en esas fechas.</div>'}
    <div class="filters"><button class="b s" id="vjE">📤 Exportar todo el viaje</button></div></details></div>`}
function bindViaje(e){if(!$("#viajeBox"))return;const re=()=>{const b=$("#viajeBox");if(b){b.outerHTML=panelViaje(e);bindViaje(e);bindItems($("#viajeBox"))}};
  document.querySelectorAll("[data-vjd]").forEach(b=>b.onclick=()=>{VIAJE.dia=b.dataset.vjd;re()});
  const add=()=>{const t=$("#vjN").value.trim();if(!t)return;const r=leerCuando(t,VIAJE.dia,{modo:"pasado"});const ah=new Date().toISOString();
    const x={id:uid(),tipo:r.hora?"evento":"nota",titulo:r.hora?(r.titulo||t).slice(0,300):"",texto:r.hora?"":t,fecha:VIAJE.dia,hora:r.hora||"",horaFin:r.horaFin||"",fechaFin:"",todoDia:false,lugar:"",alertas:[],adjuntos:[],enlaces:[],creado:ah,editado:"",fijado:false,versiones:[],padre:e.id};if($("#vjO").checked)x.oculto=true;
    S.diario.push(x);asegurarFichas(t);changed();$("#vjN").value="";re();$("#vjN").focus()};
  $("#vjG").onclick=add;$("#vjN").onkeydown=ev=>{if(ev.key==="Enter"){ev.preventDefault();add()}};
  document.querySelectorAll("[data-vjm]").forEach(c=>c.onchange=()=>{if(c.checked)ligar("d:"+e.id,"m:"+c.dataset.vjm);else{for(const id of [e.id,...hijosDe(e.id).map(x=>x.id)])desligar("d:"+id,"m:"+c.dataset.vjm)}changed()});
  $("#vjE").onclick=()=>exportarItems([{k:"d",e},...hijosDe(e.id).map(x=>({k:"d",e:x}))],e.titulo||"Viaje")}
// en el editor: «parte de…» y «ocultar en la agenda»
function camposPadre(e0){const f=($("#deF")&&$("#deF").value)||hoyISO(),cand=(S.diario||[]).filter(x=>esLargo(x)&&!x.priv&&(!e0||x.id!==e0.id)&&x.fecha<=masDias(f,1)&&x.fechaFin>=masDias(f,-1)),cur=e0&&e0.padre;
  if(!cand.length&&!cur)return"";const p=cur&&!cand.some(x=>x.id===cur)?(S.diario||[]).find(x=>x.id===cur):null;
  return`<div class="filters" id="dePadreBox" style="margin:6px 0 0"><label class="small" style="margin:0">↳ Parte de <select id="dePadre"><option value="">— ninguno —</option>${[...(p?[p]:[]),...cand].map(x=>`<option value="${esc(x.id)}" ${cur===x.id?"selected":""}>${esc(x.titulo||"Evento")} (${esc(fechaCorta(x.fecha))}–${esc(fechaCorta(x.fechaFin))})</option>`).join("")}</select></label><label class="small" style="margin:0"><input type="checkbox" id="deOcu" ${e0&&e0.oculto?"checked":""}> ocultar en la agenda</label></div>`}

// ---------------------------------------------------------------- franjas de actividades largas
function bindFranjas(){document.querySelectorAll("[data-fr]").forEach(el=>el.onclick=ev=>{if(ev.target.closest("button,select"))return;const k=el.dataset.fr;TD.frAb=TD.frAb===k?"":k;render()});
  document.querySelectorAll("[data-frv]").forEach(b=>b.onclick=()=>verD(b.dataset.frv));document.querySelectorAll("[data-fre]").forEach(b=>b.onclick=()=>editarD(b.dataset.fre));
  document.querySelectorAll("[data-frs]").forEach(s=>s.onchange=()=>{const e=S.diario.find(x=>x.id===s.dataset.frs);if(!e)return;if(s.value)e.vis=s.value;else delete e.vis;e.editado=new Date().toISOString();changed();aviso(s.value==="oculta"?"Oculta: la ves con «👁 actividades ocultas» del día":"Listo");render()});
  if($("#frOc"))$("#frOc").onclick=ev=>{ev.preventDefault();TD.verOcultas=true;render()}}
function camposLarga(e0){return`<div class="filters" id="deLargaBox" style="margin:6px 0 0"><label class="small" style="margin:0">Actividad larga: mostrar <select id="deVis"><option value="">todos los días</option><option value="extremos" ${e0&&e0.vis==="extremos"?"selected":""}>solo el primer y último día</option><option value="oculta" ${e0&&e0.vis==="oculta"?"selected":""}>oculta de la agenda</option></select></label>
  <span class="small">Color</span>${PAL_FR.map(c=>`<label class="colbol" style="--fc:${c}"><input type="radio" name="deCol" value="${c}" ${(e0&&e0.color||"")===c?"checked":""}></label>`).join("")}<label class="small" style="margin:0"><input type="radio" name="deCol" value="" ${!(e0&&e0.color)?"checked":""}> auto</label></div>`}

// ---------------------------------------------------------------- enganches
window.addEventListener("load",()=>{ponerBotonSync();deslizarParaRecargar();
  const dz=window.desbloqueado;if(typeof dz==="function")window.desbloqueado=function(){const r=dz.apply(this,arguments);ponerBotonSync();RC.err="";pintaSync();return r};
  // biblioteca: pestaña «Por clasificar»
  const tb=$("#tabsB");if(tb&&!tb.querySelector('[data-tb="clasificar"]'))tb.insertAdjacentHTML("afterbegin",'<button data-tb="clasificar">📥 Por clasificar</button>');
  const vb=window.vBiblio;if(typeof vb==="function")window.vBiblio=function(){if(TB.vista==="clasificar"){syncTabsB();$("#view").innerHTML=vClasificar();bindClasificar();return}return vb.apply(this,arguments)};
  const pb=window.pintaBadge;if(typeof pb==="function")window.pintaBadge=function(){const r=pb.apply(this,arguments);const b=document.querySelector('#tabsB [data-tb="clasificar"]');if(b&&S){const n=porClasificar().length;b.innerHTML=`📥 Por clasificar${n?` <span class="chip">${n}</span>`:""}`}return r};
  // diario: modo seleccionar
  const bd=window.bindDiario;if(typeof bd==="function")window.bindDiario=function(){const r=bd.apply(this,arguments);try{bindSelDia()}catch(e){}try{bindFranjas()}catch(e){}return r};
  // tarjetas: marca de subevento
  const ti=window.tarjetaItem;if(typeof ti==="function")window.tarjetaItem=function(x){let h=ti.apply(this,arguments);if(x&&x.k==="d"){const p=padreDe(x.e);if(p)h=h.replace('<div class="ih">',`<div class="small vjpad">↳ <a href="#" data-vk="d:${esc(p.id)}">${esc(p.titulo||"evento")}</a></div><div class="ih">`);if(esLargo(x.e)){const n=hijosDe(x.e.id).length;if(n)h=h.replace("</b>",`</b> <span class="chip">🧳 ${n}</span>`)}}return h};
  // detalle: panel día a día y botón «A la Biblioteca»
  const vd=window.verD;if(typeof vd==="function")window.verD=function(id){const r=vd.apply(this,arguments);const e=(S.diario||[]).find(x=>x.id===id);if(!e||!$("#dlg").open)return r;
    if(esLargo(e)&&!e.priv){const t=$("#vdTxt");if(t){t.insertAdjacentHTML("afterend",panelViaje(e));bindViaje(e);bindItems($("#viajeBox"))}}
    const p=padreDe(e);if(p){const s=$("#dlgB .small.muted");if(s)s.insertAdjacentHTML("afterend",`<div class="small vjpad">↳ Parte de <a href="#" data-vk="d:${esc(p.id)}">${esc(p.titulo||"evento")}</a></div>`);bindItems($("#dlgB"))}
    if(e.tipo==="nota"&&!e.priv){const F=$("#dlgF");if(F&&!$("#vdBib")){F.insertAdjacentHTML("afterbegin",'<button class="b" id="vdBib">📚 A la Biblioteca</button>');$("#vdBib").onclick=()=>{cerrar();aBiblioteca([{k:"d",o:e}])}}}
    return r};
  const ed=window.editarD;if(typeof ed==="function")window.editarD=function(id,pre){const r=ed.apply(this,arguments);const e0=id?(S.diario||[]).find(x=>x.id===id):null;const pegar=()=>{const b=$("#dePadreBox");if(b)b.remove();const h=camposPadre(e0||(pre&&pre.padre?{padre:pre.padre}:null));const ref=$("#deT");if(h&&ref)ref.insertAdjacentHTML("afterend",h);
      const lb=$("#deLargaBox");const ff=$("#deFF"),fi=$("#deF");const larga=ff&&fi&&ff.value&&ff.value>fi.value;if(larga&&!lb){const a=$("#dePadreBox")||ref;if(a)a.insertAdjacentHTML("afterend",camposLarga(e0))}else if(!larga&&lb)lb.remove()};
    pegar();const f=$("#deF");if(f)f.addEventListener("change",pegar);const f2=$("#deFF");if(f2)f2.addEventListener("change",pegar);return r};
  const gd=window.guardarD;if(typeof gd==="function")window.guardarD=function(e,e0){if($("#deLargaBox")){const v=$("#deVis").value;if(v)e.vis=v;else delete e.vis;const c=(document.querySelector('input[name="deCol"]:checked')||{}).value;if(c)e.color=c;else delete e.color}else if(e0&&e0.vis&&!(e.fechaFin&&e.fechaFin>e.fecha))delete e.vis;
    const s=$("#dePadre");if(s){if(s.value)e.padre=s.value;else delete e.padre;if($("#deOcu")&&$("#deOcu").checked&&e.padre)e.oculto=true;else delete e.oculto}
    const r=gd.apply(this,arguments);if(e0){const real=S.diario.find(x=>x.id===e0.id);if(real){if(!e.padre)delete real.padre;if(!e.oculto)delete real.oculto;if(!e.vis)delete real.vis;if(!e.color)delete real.color}}return r};
  // captura rápida: durante un evento de varios días, ofrecer añadirlo
  const pq=window.previewQC;if(typeof pq==="function")window.previewQC=function(){const p=pq.apply(this,arguments);const box=$("#qcP");if(p&&box){const L=largosEn(p.fecha);if(L.length){const sel=QCV&&L.some(x=>x.id===QCV)?QCV:"";QCV=sel;box.insertAdjacentHTML("beforeend",`<div class="small" style="margin-top:4px">🧳 <select id="qcV"><option value="">— no añadir a un evento de varios días —</option>${L.map(x=>`<option value="${esc(x.id)}" ${sel===x.id?"selected":""}>Añadir a «${esc(x.titulo||"evento")}»</option>`).join("")}</select></div>`);$("#qcV").onchange=()=>{QCV=$("#qcV").value}}}return p};
  const gq=window.guardarQC;if(typeof gq==="function")window.guardarQC=function(){const antes=new Set((S.diario||[]).map(x=>x.id)),v=QCV;const r=gq.apply(this,arguments);if(v){const n=(S.diario||[]).find(x=>!antes.has(x.id));if(n&&n.id!==v){const p=S.diario.find(x=>x.id===v);if(p&&n.fecha>=p.fecha&&n.fecha<=p.fechaFin){n.padre=v;changed();render()}}}QCV=null;return r};
});
let QCV=null;
