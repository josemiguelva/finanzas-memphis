// =====================================================================================================
// Memphis · 🖱 MENÚ CONTEXTUAL (clic derecho en el PC, mantener presionado en el celular), SELECCIÓN MÚLTIPLE,
// menú sobre el texto seleccionado, 🔎 búsqueda global desde cualquier parte (Ctrl+F) y atajos de teclado.
// =====================================================================================================
"use strict";
const CTX_SEL='[data-d],[data-frv],[data-fre],[data-rver],[data-m],[data-id],[data-b],[data-bvver],[data-bvab],[data-bved],[data-ptv],[data-ptok],[data-ptid],[data-fi],[data-s],[data-est],[data-pr],[data-tk],[data-ir],[data-gk],[data-vk],[data-rl]';
const enEscritura=el=>!!(el&&(el.closest("input,textarea,select,[contenteditable=true]")));
function itemCtx(target){const el=target&&target.closest&&target.closest(CTX_SEL);if(!el||el.closest("#ctxMenu,#selBar,#ctxDlg"))return null;const d=el.dataset;let k="",id="",x={};
  const deKey=v=>{const i=String(v||"").indexOf(":");return i>0?[v.slice(0,i),v.slice(i+1)]:["",""]};
  if(d.tk!=null){k="tk";id=d.tk;x.linea=+d.tl}
  else if(d.d||d.frv||d.fre||d.rver){k="d";id=d.d||d.frv||d.fre||d.rver}else if(d.m){k="m";id=d.m}else if(d.id&&(S.mov||[]).some(m=>m.id===d.id)){k="m";id=d.id}
  else if(d.b||d.bvver||d.bvab||d.bved){k="b";id=d.b||d.bvver||d.bvab||d.bved}else if(d.ptv||d.ptok||d.ptid){k="t";id=d.ptv||d.ptok||d.ptid}else if(d.fi){k="f";id=d.fi}
  else if(d.s){k="s";id=d.s}else if(d.est){k="est";id=d.est}else if(d.pr){k="p";id=d.pr}else if(d.ir&&/^\d{4}-\d\d-\d\d$/.test(d.ir)){k="dia";id=d.ir}
  else if(d.gk||d.vk||d.rl){[k,id]=deKey(d.gk||d.vk||d.rl)}
  if(!k||!id)return null;const obj=k==="d"?(S.diario||[]).find(e=>e.id===id):k==="m"?(S.mov||[]).find(m=>m.id===id):k==="b"?(S.biblio||[]).find(b=>b.id===id):k==="t"?(S.ptar||[]).find(t=>t.id===id):k==="f"?(S.fichas||[]).find(f=>f.id===id):k==="s"?(S.salud||[]).find(r=>r.id===id):k==="p"?(S.proy||[]).find(p=>p.id===id):k==="est"?(typeof C!=="undefined"&&C?C.est.find(e=>e.id===id):null):k==="tk"?todasTareas().find(t=>t.key===id&&t.linea===x.linea):k==="dia"?{fecha:id}:null;
  if(!obj)return null;return{k,id,el,o:obj,...x}}
// ---------------------------------------------------------------- utilidades
const hecho=(t)=>{changed();render();if(t)aviso(t)};
const marcaEd=o=>{o.editado=new Date().toISOString()};
const primeraLinea=e=>e.titulo||String(e.texto||"").split("\n").find(l=>l.trim())||"(sin título)";
function borrarObj(col,o,etq){if(!confirm(`¿Borrar ${etq}? Va a la papelera.`))return;aPapelera(col==="mov"?"mov":col,o);const k=col==="mov"?"mov":col;S[k]=(S[k]||[]).filter(x=>x!==o);(S.eliminados=S.eliminados||[]).push({id:o.id,fecha:new Date().toISOString()});changed();render();
  deshacer("Borrado",()=>{S[k].push(o);S.eliminados=S.eliminados.filter(x=>x.id!==o.id);S.papelera=(S.papelera||[]).filter(p=>!(p.obj&&p.obj.id===o.id));changed();render()})}
function ctxDlg(titulo,html,okTxt){return new Promise(res=>{let d=$("#ctxDlg");if(!d){d=document.createElement("dialog");d.id="ctxDlg";document.body.appendChild(d)}
  d.innerHTML=`<h3 style="margin-top:0">${titulo}</h3><div>${html}</div><div class="filters" style="justify-content:flex-end;margin-top:10px"><button class="b" id="cdC">Cancelar</button><button class="b p" id="cdOK">${okTxt||"Aceptar"}</button></div>`;
  let fin=false;const f=v=>{if(fin)return;fin=true;if(d.open)d.close();res(v)};d.onclose=()=>f(null);$("#cdC").onclick=()=>f(null);
  $("#cdOK").onclick=()=>{const v={};d.querySelectorAll("input,select,textarea").forEach(i=>v[i.id]=i.type==="checkbox"?i.checked:i.value);f(v)};
  d.onkeydown=ev=>{if(ev.key==="Enter"&&ev.target.tagName!=="TEXTAREA"){ev.preventDefault();$("#cdOK").click()}};d.showModal();setTimeout(()=>{const i=d.querySelector("input,select,textarea");if(i)i.focus()},40)})}
const pedirFecha=(t,f,h)=>ctxDlg(t,`<div class="filters"><input type="date" id="cF" value="${esc(f||hoyISO())}">${h!==undefined?`<input type="time" id="cH" value="${esc(h||"")}">`:""}</div>
  <div class="small">${[["hoy",0],["mañana",1],["en 3 días",3],["en 1 semana",7],["en 1 mes",30]].map(([l,n])=>`<a href="#" onclick="document.getElementById('cF').value='${masDias(hoyISO(),n)}';return false">${l}</a>`).join(" · ")}</div>`);
const elegirDe=(t,L,v,etq)=>ctxDlg(t,`<label class="small">${etq||""}<input id="cV" list="cVL" value="${esc(v||"")}" style="width:100%"></label><datalist id="cVL">${L.map(x=>`<option value="${esc(x)}">`).join("")}</datalist>`);
const elegirProy=(t)=>ctxDlg(t,`<select id="cP" style="width:100%"><option value="">— sin proyecto —</option>${(S.proy||[]).filter(p=>!["terminado","cancelado"].includes(p.estado)).map(p=>`<option value="${esc(p.id)}">${esc(typeof nomP==="function"?nomP(p):p.nombre)}</option>`).join("")}</select>`);
function compartirTexto(tit,txt){const t=(tit?tit+"\n\n":"")+txt;if(navigator.share){navigator.share({title:tit||"Memphis",text:t}).catch(()=>{});return}
  abrirMenu([["💬","WhatsApp",()=>window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank","noopener")],["✉️","Correo",()=>{location.href="mailto:?subject="+encodeURIComponent(tit||"")+"&body="+encodeURIComponent(txt)}],["📋","Copiar el texto",()=>navigator.clipboard.writeText(t).then(()=>aviso("Copiado"))]],MENU.x,MENU.y)}
// ---------------------------------------------------------------- acciones por tipo
function accionesD(e){const priv=typeof verPriv==="function"&&verPriv(e),ev=e.tipo==="evento",A=[];
  A.push(["✏️","Editar",()=>editarD(e.id)],["👁","Ver",()=>verD(e.id)],["📌",e.fijado?"Quitar de fijadas":"Fijar",()=>{e.fijado=!e.fijado;marcaEd(e);hecho(e.fijado?"📌 Fijada":"Ya no está fijada")}]);
  if(!e.priv)A.push(["🔒","Hacer privada",()=>{editarD(e.id);setTimeout(()=>{const c=$("#dePriv");if(c&&!c.checked)c.click()},120)}]);
  A.push("—",["⏰","Recordarme…",()=>abrirMenu([["⏰","Mañana",()=>ponRec(e,masDias(hoyISO(),1))],["⏰","En 3 días",()=>ponRec(e,masDias(hoyISO(),3))],["⏰","En 1 semana",()=>ponRec(e,masDias(hoyISO(),7))],["📅","Elegir fecha y hora…",async()=>{const v=await pedirFecha("⏰ Recordatorio",masDias(hoyISO(),1),"08:00");if(v&&v.cF)ponRec(e,v.cF,v.cH)}]],MENU.x,MENU.y)],
    ["📅","Mover a otro día…",async()=>{const v=await pedirFecha("📅 Mover a otro día",e.fecha);if(!v||!v.cF)return;const dd=(dDe(v.cF)-dDe(e.fecha))/864e5;e.fecha=v.cF;if(e.fechaFin)e.fechaFin=masDias(e.fechaFin,Math.round(dd));marcaEd(e);hecho("📅 "+fechaCorta(e.fecha))}],
    ["⏩","Pasar a mañana",()=>{e.fecha=masDias(e.fecha<hoyISO()?hoyISO():e.fecha,1);marcaEd(e);hecho("⏩ "+fechaCorta(e.fecha))}],
    ["🕑","Cambiar hora…",async()=>{const v=await ctxDlg("🕑 Hora",`<input type="time" id="cH" value="${esc(e.hora||"")}">`);if(!v)return;e.hora=v.cH||"";e.todoDia=ev&&!e.hora;marcaEd(e);hecho("🕑 "+(e.hora||"sin hora"))}],"—",
    ["🔄",ev?"Convertir en nota":"Convertir en actividad",()=>{if(ev){e.tipo="nota";if(e.titulo&&!String(e.texto||"").startsWith(e.titulo))e.texto=(e.titulo+"\n"+(e.texto||"")).trim()}else{e.tipo="evento";e.titulo=e.titulo||primeraLinea(e).replace(/^[-*#>\s[\]x]+/,"").slice(0,120)}marcaEd(e);hecho(ev?"Ahora es nota":"Ahora es actividad")}],
    ["☑️","Convertir en tarea de proyecto…",async()=>{const v=await elegirProy("☑️ ¿A qué proyecto?");if(!v||!v.cP)return;const t=nuevaPt(v.cP,{titulo:primeraLinea(e).replace(/^[-*#>\s[\]x]+/,"").slice(0,200),fin:e.fecha>=hoyISO()?e.fecha:"",hora:e.hora||""});ligar("d:"+e.id,"t:"+t.id);hecho("☑️ Tarea creada y ligada")}],
    ["🔗","Ligar con…",()=>{editarD(e.id);setTimeout(()=>{const d=document.querySelector("#edRel details");if(d)d.open=true;const q=$("#edRQ");if(q){q.scrollIntoView({block:"center"});q.focus()}},150)}],
    ["🎯","Asignar a proyecto…",async()=>{const v=await elegirProy("🎯 Proyecto");if(!v)return;if(v.cP)e.proy=v.cP;else delete e.proy;marcaEd(e);hecho(v.cP?"🎯 Asignada":"Sin proyecto")}],"—");
  if(!priv)A.push(["📋","Duplicar",()=>{const n=structuredClone(e);Object.assign(n,{id:uid(),creado:new Date().toISOString(),editado:"",versiones:[],gcal:undefined});delete n.gcal;delete n.recs;S.diario.push(n);hecho("📋 Duplicada")}],
    ["📤","Compartir o enviar…",()=>compartirTexto(e.titulo||"",(ev?[fechaCorta(e.fecha)+(e.hora?" "+e.hora:""),e.lugar&&"📍 "+e.lugar].filter(Boolean).join(" · ")+"\n":"")+(e.texto||""))]);
  if(ev&&typeof gcalUrlD==="function")A.push(["📅","Enviar a Google Calendar",()=>window.open(gcalUrlD(e),"_blank","noopener,noreferrer")]);
  A.push(["☑","Seleccionar varios",()=>iniciarSel("d",e.id)],"—",["🗑","Borrar",()=>borrarObj("diario",e,ev?"la actividad":"la nota")]);return A}
function ponRec(e,f,h){e.recs=[...(e.recs||[]),{id:"r"+Date.now().toString(36),fecha:f,hora:h||"",txt:"",hecho:false}];marcaEd(e);hecho("⏰ Recordatorio "+fechaCorta(f)+(h?" "+h:""))}
function accionesT(t){const A=[["✔",t.estado==="hecho"?"Marcar pendiente":"Hecha",()=>{marcaEstado(t,t.estado==="hecho"?"pendiente":"hecho");render()}],["✏️","Editar",()=>editarTarea(t.id)],
  ["⏩","Para mañana",()=>{t.fin=masDias(hoyISO(),1);ponPt(t);render();aviso("⏩ Mañana")}],["📅","Elegir fecha…",async()=>{const v=await pedirFecha("📅 Fecha de la tarea",t.fin||hoyISO(),t.hora||"");if(!v)return;t.fin=v.cF||"";t.hora=v.cH||"";ponPt(t);render()}],
  ["⏰","Avisarme a una hora…",async()=>{const v=await pedirFecha("⏰ Te aviso ese día a esa hora",t.fin||hoyISO(),t.hora||"08:00");if(!v)return;t.fin=v.cF||t.fin;t.hora=v.cH||"08:00";ponPt(t);render();aviso("⏰ "+fechaCorta(t.fin)+" "+t.hora)}],"—",
  ["🎯","Pasar a otro proyecto…",async()=>{const v=await elegirProy("🎯 Mover a");if(!v||!v.cP)return;t.proy=v.cP;t.padre="";ponPt(t);render()}],
  ["👤","Responsable…",async()=>{const v=await elegirDe("👤 Responsable",(S.fichas||[]).filter(f=>f.tipo==="persona").map(f=>f.nombre),t.resp);if(!v)return;t.resp=v.cV.trim();ponPt(t);render()}],
  ["⬆","Prioridad",()=>abrirMenu([["🔴","Alta",()=>{t.prioridad="alta";ponPt(t);render()}],["🟡","Media",()=>{t.prioridad="media";ponPt(t);render()}],["⚪","Baja",()=>{t.prioridad="baja";ponPt(t);render()}],["·","Sin prioridad",()=>{t.prioridad="";ponPt(t);render()}]],MENU.x,MENU.y)],
  "—",["☑","Seleccionar varios",()=>iniciarSel("t",t.id)],["🗑","Borrar",()=>{if(S.ptar.some(x=>x.padre===t.id)){alert("Tiene subtareas: bórrala desde su editor.");return}borrarObj("ptar",t,"la tarea")}]];return A}
function accionesTk(x,el){return[["✔",x.hecha?"Marcar pendiente":"Hecha",()=>el.click()],["👁","Abrir donde está",()=>abrirItem(x.key)],
  ["☑️","Convertir en tarea de proyecto…",async()=>{const v=await elegirProy("☑️ ¿A qué proyecto?");if(!v||!v.cP)return;const t=nuevaPt(v.cP,{titulo:x.texto.slice(0,200),fin:x.fecha||"",hora:x.hora||""});ligar(x.key,"t:"+t.id);if(!x.hecha)el.click();aviso("☑️ Pasó al proyecto")}]]}
function accionesF(f){const d=datosP(f),A=[["👁","Abrir ficha",()=>{cerrarSiAbierto();TD.vista="fichas";TD.ficha=f.id;if(MOD!=="dia")irModulo("dia");else render()}]];
  A.push(["✏️","Editar"+(f.tipo==="persona"?" (apodos y campos extra)":""),()=>f.tipo==="persona"?editarPersona(f):f.tipo==="lugar"?editarLugar(f):(TD.vista="fichas",TD.ficha=f.id,irModulo("dia"))]);
  const tel=(d.tel||[])[0];if(tel)A.push(["📞","Llamar",()=>{location.href="tel:"+tel.replace(/[^\d+]/g,"")}],["💬","WhatsApp",()=>window.open("https://wa.me/"+tel.replace(/\D/g,"").replace(/^(\d{10})$/,"57$1"),"_blank","noopener")]);
  const mail=(d.email||[])[0];if(mail)A.push(["✉️","Correo",()=>{location.href="mailto:"+mail}]);
  A.push("—",["📝","Nueva nota con "+(f.tipo==="persona"?"esta persona":f.tipo==="lugar"?"este lugar":"este tema"),()=>editarD(null,f.tipo==="lugar"?{lugar:f.nombre}:{texto:(f.tipo==="persona"?"@[":"#[")+f.nombre+"] "})],
    ["🔎","Ver todo lo relacionado",()=>abrirBusquedaG(f.nombre)],["🔀","Unir con otra ficha…",()=>unirFicha(f)],"—",["☑","Seleccionar varios",()=>iniciarSel("f",f.id)]);return A}
async function unirFicha(f){const L=(S.fichas||[]).filter(x=>x.tipo===f.tipo&&x!==f);if(!L.length){aviso("No hay otra ficha de ese tipo");return}
  const v=await ctxDlg("🔀 Unir «"+esc(f.nombre)+"» con…",`<select id="cU" style="width:100%">${L.sort((a,b)=>a.nombre.localeCompare(b.nombre,"es")).map(x=>`<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join("")}</select><p class="small muted">Se queda la ficha que elijas; «${esc(f.nombre)}» pasa a ser uno de sus otros nombres, y sus datos y vínculos se juntan. Las menciones siguen funcionando.</p>`,"Unir");
  if(!v||!v.cU)return;const g=S.fichas.find(x=>x.id===v.cU);g.alias=[...new Set([...(g.alias||[]),f.nombre,...(f.alias||[])])].filter(a=>claveF(a)!==claveF(g.nombre));
  if(f.tipo==="persona"||f.tipo==="lugar"){const a=datosP(f),b=datosP(g),m={...a,...b};for(const k of ["tel","email"])m[k]=[...new Set([...(a[k]||[]),...(b[k]||[])])];m.extra=[...(b.extra||[]),...(a.extra||[]).filter(x=>!(b.extra||[]).some(y=>y.k===x.k))];g.datos=normDatosP(m)}
  if(f.nota)g.nota=[g.nota,f.nota].filter(Boolean).join("\n\n");for(const vv of S.vinculos||[]){if(vv.a==="f:"+f.id)vv.a="f:"+g.id;if(vv.b==="f:"+f.id)vv.b="f:"+g.id}
  for(const e of S.diario||[])if(e.lugar&&claveF(e.lugar)===claveF(f.nombre))e.lugar=g.nombre;
  S.fichas=S.fichas.filter(x=>x!==f);(S.eliminados=S.eliminados||[]).push({id:f.id,fecha:new Date().toISOString()});g.editado=new Date().toISOString();if(TD.ficha===f.id)TD.ficha=g.id;hecho("🔀 Unidas en «"+g.nombre+"»")}
function accionesM(m){const cats=[...new Set(S.mov.map(x=>x.categoria).filter(Boolean))].sort();return[["✏️","Editar",()=>editar(m.id)],
  ["🏷","Cambiar categoría…",async()=>{const v=await elegirDe("🏷 Categoría",cats,m.categoria);if(!v)return;m.categoria=v.cV.trim();m.revisar="";marcaEd(m);hecho("🏷 "+(m.categoria||"sin categoría"))}],
  ["💳","Cambiar cuenta…",async()=>{const v=await elegirDe("💳 Cuenta",S.cuentas||[],m.cuenta);if(!v||!v.cV.trim())return;m.cuenta=v.cV.trim();if(!S.cuentas.includes(m.cuenta))S.cuentas.push(m.cuenta);marcaEd(m);hecho("💳 "+m.cuenta)}],
  ["✔","Marcar revisado",()=>{m.revisar="";marcaEd(m);hecho("✔ Revisado")}],
  ["📏","Crear regla con este comercio",()=>{const p=(m.estab||m.concepto||m.desc||"").trim();if(!p){aviso("No tiene comercio");return}S.reglas.unshift({id:uid(),patron:p.toUpperCase(),tipo:m.tipo,categoria:m.categoria||"",estab:m.estab||"",propia:true});hecho("📏 Regla creada: «"+p+"» → "+(m.categoria||"(sin categoría)")+". Revísala en Finanzas › Reglas.")}],
  ["✂","Dividir el gasto…",async()=>{const v=await ctxDlg("✂ Dividir "+esc(fmt(m.valor)),`<label>Valor de la parte nueva <input id="cV" inputmode="numeric" style="width:100%"></label><label>Categoría de esa parte <input id="cK" list="cKL" style="width:100%"></label><datalist id="cKL">${cats.map(c=>`<option value="${esc(c)}">`).join("")}</datalist>`,"Dividir");
    if(!v)return;const p=typeof parseNum==="function"?parseNum(v.cV):+String(v.cV).replace(/\D/g,"");if(!p||p>=Math.abs(m.valor)){alert("El valor debe ser menor que el total");return}const sg=m.valor<0?-1:1;const n=structuredClone(m);Object.assign(n,{id:uid(),valor:sg*p,categoria:v.cK.trim()||m.categoria,adjuntos:[],nota:[m.nota,"(dividido)"].filter(Boolean).join(" ")});m.valor=m.valor-sg*p;marcaEd(m);marcaEd(n);S.mov.push(n);hecho("✂ Dividido")}],
  ["📎","Adjuntar recibo",()=>{editar(m.id);setTimeout(()=>{const b=document.querySelector("#dlgB input[type=file]");if(b)b.click()},150)}],"—",["☑","Seleccionar varios",()=>iniciarSel("m",m.id)],["🗑","Borrar",()=>borrarObj("mov",m,"el movimiento")]]}
function accionesB(x){const cols=[...new Set((S.biblio||[]).map(y=>y.coleccion).filter(Boolean))].sort(),A=[["👁","Abrir",()=>verB(x.id)],["✏️","Editar",()=>editarB(x.id)],
  ["📂","Mover a colección…",async()=>{const v=await elegirDe("📂 Colección",cols,x.coleccion);if(!v)return;x.coleccion=v.cV.trim();marcaEd(x);hecho("📂 "+(x.coleccion||"sin colección"))}],
  ["🏷","Etiquetar…",async()=>{const v=await elegirDe("🏷 Etiquetas (separadas por coma)",[],(x.etiquetas||[]).join(", "));if(!v)return;x.etiquetas=[...new Set(v.cV.split(",").map(s=>s.trim().replace(/^#/,"")).filter(Boolean))];marcaEd(x);hecho("🏷 Listo")}],
  ["⭐","Estado",()=>abrirMenu(BESTADOS.map(s=>["⭐",s||"sin estado",()=>{x.estado=s;marcaEd(x);hecho("⭐ "+(s||"sin estado"))}]),MENU.x,MENU.y)]];
  if(x.tipo==="referencia"||x.doi||(x.autores||[]).length)A.push(["📑","Copiar cita APA",()=>navigator.clipboard.writeText(refAPA(x)).then(()=>aviso("Copiada (APA)"))],["📑","Copiar cita Vancouver",()=>navigator.clipboard.writeText(refVancouver(x)).then(()=>aviso("Copiada (Vancouver)"))]);
  A.push(["📤","Compartir",()=>typeof compartirB==="function"?compartirB([x.id]):compartirTexto(x.titulo,x.texto||x.url||"")],["🔗","Ligar a un proyecto…",async()=>{const v=await elegirProy("🔗 Ligar a");if(v&&v.cP){ligar("b:"+x.id,"p:"+v.cP);hecho("🔗 Ligado")}}],
    "—",["☑","Seleccionar varios",()=>iniciarSel("b",x.id)],["🗑","Borrar",()=>borrarObj("biblio",x,"esto de la biblioteca")]);return A}
function accionesS(r){return[["👁","Ver",()=>verS(r.id)],["✏️","Editar",()=>editarS(r.id)],["☑","Seleccionar varios",()=>iniciarSel("s",r.id)],"—",["🗑","Borrar",()=>borrarObj("salud",r,"el registro")]]}
function accionesP(p){return[["👁","Abrir",()=>abrirProyecto(p.id)],["✏️","Editar",()=>editarProyecto(p.id)],["☑️","Nueva tarea",()=>editarTarea(null,{proy:p.id})],["📝","Nueva nota del proyecto",()=>{editarD(null);setTimeout(()=>{const s=$("#deProy");if(s)s.value=p.id},80)}]]}
function accionesEst(e,el){const cur=CUR.curso,c=C.cur.find(x=>x.id===cur),i=C.ins.find(x=>x.cur===cur&&x.est===e.id),CF=(c&&c.campos)||[],A=[["👁","Ficha",()=>el.click()],["✏️","Editar",()=>editarEst(e.id,cur)]];
  if(i&&CF.length)A.push(["🏷","Asignar "+CF.map(f=>f.nombre).join(" / ")+"…",()=>asignarCampo([i],CF)]);
  if(i)A.push(["✅","Ir a la asistencia",()=>{CUR.sub="asis";render()}]);if(e.correo)A.push(["✉️","Enviarle correo",()=>{location.href="mailto:"+e.correo}]);
  if(i)A.push(["🚪",i.estado==="retirado"?"Reactivar en el curso":"Marcar retirado",()=>{const r=i.estado!=="retirado";ponLista("ins",{...i,estado:r?"retirado":"activo",baja:r?hoyISO():""});render()}]);
  A.push(["☑","Seleccionar varios",()=>iniciarSel("est",e.id)]);return A}
async function asignarCampo(L,CF){const v=await ctxDlg("🏷 Asignar a "+L.length+" estudiante"+(L.length>1?"s":""),`<select id="cCF" style="width:100%">${CF.map(f=>`<option value="${esc(f.id)}">${esc(f.nombre)}</option>`).join("")}</select><input id="cV" placeholder="Valor (p. ej. 1). Vacío = quitar" style="width:100%;margin-top:6px">`);
  if(!v)return;for(const i of L){const ex={...(i.extra||{})},val=v.cV.trim().slice(0,200);if(val)ex[v.cCF]=val;else delete ex[v.cCF];ponLista("ins",{...i,extra:ex})}render();aviso("🏷 Listo")}
function accionesDia(f){return[["📅","Nueva actividad ese día",()=>editarD(null,{tipo:"evento",fecha:f})],["🕑","Nueva actividad a una hora…",async()=>{const v=await ctxDlg("🕑 "+esc(fechaCorta(f)),`<input type="time" id="cH" value="09:00">`);if(v)editarD(null,{tipo:"evento",fecha:f,hora:v.cH})}],
  ["📝","Nueva nota de ese día",()=>editarD(null,{fecha:f,hora:f===hoyISO()?ahoraHM():""})],["☐","Nueva tarea para ese día",()=>editarD(null,{fecha:hoyISO(),texto:`- [ ]  el ${+f.slice(8)} de ${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][+f.slice(5,7)-1]}`})],
  ["👁","Ir a ese día",()=>{TD.fecha=f;TD.vista="dia";if(MOD!=="dia")irModulo("dia");else render()}]]}
function accionesDe(it){switch(it.k){case"d":return accionesD(it.o);case"t":return accionesT(it.o);case"tk":return accionesTk(it.o,it.el);case"f":return accionesF(it.o);case"m":return accionesM(it.o);case"b":return accionesB(it.o);case"s":return accionesS(it.o);case"p":return accionesP(it.o);case"est":return accionesEst(it.o,it.el);case"dia":return accionesDia(it.id)}return[]}
const tituloDe=it=>it.k==="d"?primeraLinea(it.o):it.k==="t"?it.o.titulo:it.k==="tk"?"☐ "+it.o.texto:it.k==="f"?it.o.nombre:it.k==="m"?[it.o.estab||it.o.concepto,fmt(it.o.valor)].join(" · "):it.k==="b"?it.o.titulo:it.k==="s"?(it.o.titulo||"Salud"):it.k==="p"?it.o.nombre:it.k==="est"?nomEst(it.o):it.k==="dia"?fechaLarga(it.id):"";
// ---------------------------------------------------------------- el menú
const MENU={x:0,y:0,items:[],sel:-1};
function abrirMenu(items,x,y,titulo){cerrarMenu();MENU.items=items.filter(a=>a==="—"||Array.isArray(a));MENU.x=x;MENU.y=y;MENU.sel=-1;const m=document.createElement("div");m.id="ctxMenu";m.setAttribute("role","menu");
  const movil=innerWidth<760||matchMedia("(pointer:coarse)").matches;if(movil)m.className="hoja";
  m.innerHTML=(titulo?`<div class="ctt">${esc(String(titulo).slice(0,70))}</div>`:"")+MENU.items.map((a,i)=>a==="—"?'<div class="csep"></div>':`<div class="cit" role="menuitem" data-ci="${i}"><span class="cico">${esc(a[0])}</span><span>${esc(a[1])}</span></div>`).join("")+(movil?'<div class="cit ccan" data-cx="1">Cancelar</div>':"");
  (document.querySelector("dialog[open]:not(#ctxDlg)")||document.body).appendChild(m);
  if(!movil){const r=m.getBoundingClientRect();m.style.left=Math.max(4,Math.min(x,innerWidth-r.width-4))+"px";m.style.top=Math.max(4,Math.min(y,innerHeight-r.height-4))+"px"}
  m.querySelectorAll("[data-ci]").forEach(d=>d.onclick=ev=>{ev.stopPropagation();const a=MENU.items[+d.dataset.ci];cerrarMenu();try{a[2]()}catch(e){console.error(e);aviso("No se pudo: "+e.message)}});
  const cx=m.querySelector("[data-cx]");if(cx)cx.onclick=cerrarMenu}
function cerrarMenu(){const m=$("#ctxMenu");if(m)m.remove()}
function pintaSelMenu(){document.querySelectorAll("#ctxMenu .cit").forEach(d=>d.classList.toggle("on",+d.dataset.ci===MENU.sel));const on=document.querySelector("#ctxMenu .cit.on");if(on)on.scrollIntoView({block:"nearest"})}
function menuPara(target,x,y){const it=itemCtx(target);if(!it)return false;const A=accionesDe(it);if(!A.length)return false;abrirMenu(A,x,y,tituloDe(it));return true}
const LP={t:null,x:0,y:0,ult:0,tocado:0};
document.addEventListener("contextmenu",ev=>{if(!S||enEscritura(ev.target))return;const s=getSelection&&String(getSelection());if(s&&s.trim()&&ev.target.closest&&!ev.target.closest(CTX_SEL))return;
  if(SELM.k){ev.preventDefault();return}if(menuPara(ev.target,ev.clientX,ev.clientY)){ev.preventDefault();LP.ult=Date.now();clearTimeout(LP.t)}});
document.addEventListener("pointerdown",ev=>{if(!$("#ctxMenu"))return;if(!ev.target.closest("#ctxMenu"))cerrarMenu()},true);
document.addEventListener("touchstart",ev=>{if(!S||ev.touches.length!==1||enEscritura(ev.target)||!ev.target.closest(CTX_SEL))return;const t=ev.touches[0];LP.x=t.clientX;LP.y=t.clientY;const tg=ev.target;clearTimeout(LP.t);
  LP.t=setTimeout(()=>{if(Date.now()-LP.ult<900)return;if(SELM.k){alternarSel(tg);LP.ult=Date.now();return}if(menuPara(tg,LP.x,LP.y)){LP.ult=Date.now();if(navigator.vibrate)try{navigator.vibrate(15)}catch(e){}}},560)},{passive:true});
document.addEventListener("touchmove",ev=>{const t=ev.touches[0];if(t&&Math.hypot(t.clientX-LP.x,t.clientY-LP.y)>10)clearTimeout(LP.t)},{passive:true});
document.addEventListener("touchend",()=>clearTimeout(LP.t),{passive:true});
document.addEventListener("click",ev=>{if(Date.now()-LP.ult<700&&!ev.target.closest("#ctxMenu,#selBar,#ctxDlg")){ev.preventDefault();ev.stopPropagation()}},true);
addEventListener("scroll",()=>{if($("#ctxMenu")&&!$("#ctxMenu").classList.contains("hoja"))cerrarMenu()},true);addEventListener("resize",cerrarMenu);
// ---------------------------------------------------------------- selección múltiple
const SELM={k:"",ids:new Set()};
const SELK={d:"diario",t:"ptar",m:"mov",b:"biblio",s:"salud",f:"fichas",est:"est"};
function iniciarSel(k,id){SELM.k=k;SELM.ids=new Set([id]);pintarSel();aviso("Toca otros elementos para sumarlos a la selección")}
function terminarSel(){SELM.k="";SELM.ids.clear();const b=$("#selBar");if(b)b.remove();document.querySelectorAll(".selx").forEach(x=>x.classList.remove("selx"));document.body.classList.remove("selmodo")}
function alternarSel(target){const it=itemCtx(target);if(!it||it.k!==SELM.k)return false;if(SELM.ids.has(it.id))SELM.ids.delete(it.id);else SELM.ids.add(it.id);pintarSel();return true}
function objsSel(){const L=SELM.k==="est"?C.est:S[SELK[SELM.k]]||[];return L.filter(o=>SELM.ids.has(o.id))}
function marcarVisibles(){document.querySelectorAll(".selx").forEach(x=>x.classList.remove("selx"));if(!SELM.k)return;document.querySelectorAll(CTX_SEL).forEach(el=>{const it=itemCtx(el);if(it&&it.k===SELM.k&&it.el===el&&SELM.ids.has(it.id))el.classList.add("selx")})}
function accionesSel(){const L=objsSel(),n=L.length,k=SELM.k,A=[];const fin=t=>{for(const o of L)if(o&&"editado" in o||k!=="est")marcaEd(o);changed();terminarSel();render();if(t)aviso(t)};
  if(k==="d")A.push(["📅","Mover de día",async()=>{const v=await pedirFecha("📅 Mover "+n,hoyISO());if(v&&v.cF){for(const e of L)e.fecha=v.cF;fin("📅 "+n+" movidas")}}],["⏩","A mañana",()=>{for(const e of L)e.fecha=masDias(e.fecha<hoyISO()?hoyISO():e.fecha,1);fin("⏩ Listo")}],
    ["🎯","Proyecto",async()=>{const v=await elegirProy("🎯 Proyecto para "+n);if(!v)return;for(const e of L){if(v.cP)e.proy=v.cP;else delete e.proy}fin("🎯 Listo")}],
    ["#","Etiquetar",async()=>{const v=await elegirDe("# Tema para "+n,(S.fichas||[]).filter(f=>f.tipo==="tema").map(f=>f.nombre),"");if(!v||!v.cV.trim())return;const t=v.cV.trim().replace(/^#/,""),tag=/\s/.test(t)?"#["+t+"]":"#"+t;for(const e of L)if(!(e.texto||"").includes(tag))e.texto=((e.texto||"")+" "+tag).trim();asegurarFichas(tag);fin("# Listo")}]);
  if(k==="t")A.push(["✔","Hechas",()=>{for(const t of L)marcaEstado(t,"hecho");terminarSel();render()}],["📅","Fecha",async()=>{const v=await pedirFecha("📅 Fecha para "+n,hoyISO());if(v){for(const t of L)t.fin=v.cF||"";fin("📅 Listo")}}],
    ["🎯","Proyecto",async()=>{const v=await elegirProy("🎯 Mover "+n);if(v&&v.cP){for(const t of L){t.proy=v.cP;t.padre=""}fin("🎯 Listo")}}],["⬆","Prioridad",()=>abrirMenu(Object.keys(PT_PRI).concat([""]).map(p=>[p?PT_PRI[p]:"·",p||"sin prioridad",()=>{for(const t of L)t.prioridad=p;fin("Listo")}]),innerWidth/2,innerHeight-200)]);
  if(k==="m"){const cats=[...new Set(S.mov.map(x=>x.categoria).filter(Boolean))].sort();A.push(["🏷","Categoría",async()=>{const v=await elegirDe("🏷 Categoría para "+n,cats,"");if(v){for(const m of L){m.categoria=v.cV.trim();m.revisar=""}fin("🏷 Listo")}}],
    ["💳","Cuenta",async()=>{const v=await elegirDe("💳 Cuenta para "+n,S.cuentas||[],"");if(v&&v.cV.trim()){for(const m of L)m.cuenta=v.cV.trim();if(!S.cuentas.includes(v.cV.trim()))S.cuentas.push(v.cV.trim());fin("💳 Listo")}}],["✔","Revisados",()=>{for(const m of L)m.revisar="";fin("✔ Listo")}])}
  if(k==="b"){const cols=[...new Set((S.biblio||[]).map(y=>y.coleccion).filter(Boolean))].sort();A.push(["📂","Colección",async()=>{const v=await elegirDe("📂 Colección para "+n,cols,"");if(v){for(const x of L)x.coleccion=v.cV.trim();fin("📂 Listo")}}],
    ["🏷","Etiqueta",async()=>{const v=await elegirDe("🏷 Etiqueta para "+n,[],"");if(v&&v.cV.trim()){for(const x of L)x.etiquetas=[...new Set([...(x.etiquetas||[]),v.cV.trim().replace(/^#/,"")])];fin("🏷 Listo")}}],
    ["⭐","Estado",()=>abrirMenu(BESTADOS.map(s=>["⭐",s||"sin estado",()=>{for(const x of L)x.estado=s;fin("⭐ Listo")}]),innerWidth/2,innerHeight-200)]);if(typeof compartirB==="function")A.push(["📤","Compartir",()=>{const ids=L.map(x=>x.id);terminarSel();compartirB(ids)}])}
  if(k==="f")A.push(["👥","Grupo",()=>abrirMenu(GRUPOS.map(([g,l])=>["",l,()=>{for(const f of L)if(f.tipo==="persona")f.datos=normDatosP({...datosP(f),grupo:g});fin("👥 Listo")}]),innerWidth/2,innerHeight-200)]);
  if(k==="est"){const c=C.cur.find(x=>x.id===CUR.curso),CF=(c&&c.campos)||[],I=L.map(e=>C.ins.find(i=>i.cur===CUR.curso&&i.est===e.id)).filter(Boolean);
    if(CF.length)A.push(["🏷","Asignar campo",()=>{terminarSel();asignarCampo(I,CF)}]);A.push(["🚪","Retirar",()=>{if(!confirm(`¿Marcar ${I.length} como retirados?`))return;for(const i of I)ponLista("ins",{...i,estado:"retirado",baja:hoyISO()});terminarSel();render()}])}
  if(SELK[k]&&k!=="est"&&k!=="f")A.push(["🗑","Borrar",()=>{if(!confirm(`¿Borrar ${n}? Van a la papelera.`))return;const col=SELK[k],ah=new Date().toISOString();for(const o of L){aPapelera(col,o);(S.eliminados=S.eliminados||[]).push({id:o.id,fecha:ah})}S[col]=S[col].filter(o=>!SELM.ids.has(o.id));
    const back=L.slice();terminarSel();changed();render();deshacer(`🗑 ${back.length} borrados`,()=>{S[col].push(...back);const ids=new Set(back.map(o=>o.id));S.eliminados=S.eliminados.filter(x=>!ids.has(x.id));changed();render()})}]);return A}
function pintarSel(){if(!SELM.k){terminarSel();return}document.body.classList.add("selmodo");let b=$("#selBar");if(!b){b=document.createElement("div");b.id="selBar";document.body.appendChild(b)}const n=SELM.ids.size,A=accionesSel();
  b.innerHTML=`<b>${n}</b><span class="small">seleccionado${n===1?"":"s"}</span><button class="b s" data-sa="todo" title="Seleccionar todos los visibles">Todos</button>${A.map((a,i)=>`<button class="b s" data-si="${i}" ${n?"":"disabled"}>${esc(a[0])} ${esc(a[1])}</button>`).join("")}<button class="b s" data-sa="x">✕</button>`;
  b.querySelector('[data-sa="x"]').onclick=terminarSel;b.querySelector('[data-sa="todo"]').onclick=()=>{document.querySelectorAll(CTX_SEL).forEach(el=>{const it=itemCtx(el);if(it&&it.k===SELM.k&&el.offsetParent)SELM.ids.add(it.id)});pintarSel()};
  b.querySelectorAll("[data-si]").forEach(x=>x.onclick=()=>A[+x.dataset.si][2]());marcarVisibles()}
document.addEventListener("click",ev=>{if(!SELM.k||ev.target.closest("#selBar,#ctxMenu,#ctxDlg,dialog"))return;if(ev.target.closest("#mods,header nav,.tabs"))return;if(alternarSel(ev.target)){ev.preventDefault();ev.stopPropagation()}},true);
new MutationObserver(()=>{if(SELM.k)requestAnimationFrame(marcarVisibles)}).observe(document.documentElement,{childList:true,subtree:true});
// ---------------------------------------------------------------- menú sobre texto seleccionado (editores)
const AREAS_TX=["deX","bX","seX","fiNo"];
function pintaSelTx(){const X=document.activeElement;let m=$("#selTx");if(!X||!AREAS_TX.includes(X.id)||X.selectionEnd-X.selectionStart<1){if(m)m.remove();return}
  if(!m){m=document.createElement("div");m.id="selTx";(document.querySelector("dialog[open]")||document.body).appendChild(m)}const s=X.value.slice(X.selectionStart,X.selectionEnd);
  const B=[["B","Negrita",()=>envolverSel(X,"**","**","")],["▮","Resaltar",()=>envolverSel(X,"==","==","")],...COLORES.map(([c,i])=>[i,"Color "+c,()=>envolverSel(X,"{"+c+":","}","")]),
    ["☐","Convertir en tarea",()=>{const a=X.selectionStart,b=X.selectionEnd,i0=X.value.lastIndexOf("\n",a-1)+1,blk=X.value.slice(i0,b);X.value=X.value.slice(0,i0)+blk.split("\n").map(l=>l.trim()?(/^\s*- \[[ x]\]/.test(l)?l:"- [ ] "+l.replace(/^\s*[-*]\s+/,"")):l).join("\n")+X.value.slice(b);X.dispatchEvent(new Event("input",{bubbles:true}))}],
    ...(X.id==="deX"?[["⏰","Recordatorio con este texto",()=>{if(typeof pintaRecsEd==="function")pintaRecsEd();const f=$("#edRecF");if(f){f.hidden=false;$("#edRT").value=s.trim().slice(0,300);$("#edRF").focus()}}]]:[]),
    ["👤","Persona",()=>envolverSel(X,"@[","]","")],["#","Tema",()=>envolverSel(X,"#[","]","")]];
  m.innerHTML=B.map((b,i)=>`<button type="button" data-tx="${i}" title="${esc(b[1])}">${esc(b[0])}</button>`).join("");m.querySelectorAll("[data-tx]").forEach(x=>x.onmousedown=ev=>{ev.preventDefault();B[+x.dataset.tx][2]();setTimeout(pintaSelTx,10)});
  if(innerWidth<760){const vv=window.visualViewport;m.className="abajo";m.style.left="4px";m.style.top="";m.style.bottom=((vv?Math.max(0,innerHeight-vv.height-vv.offsetTop):0)+($("#kbBar")?46:6))+"px"}
  else{const xy=typeof caretXY==="function"?caretXY(X):null,r=X.getBoundingClientRect();m.className="";m.style.left=Math.max(6,Math.min((xy?xy.x:r.left)-40,innerWidth-m.offsetWidth-6))+"px";m.style.top=Math.max(6,(xy?xy.y-58:r.top-44))+"px"}}
document.addEventListener("selectionchange",()=>{clearTimeout(pintaSelTx._t);pintaSelTx._t=setTimeout(pintaSelTx,120)});
document.addEventListener("focusout",ev=>{if(AREAS_TX.includes(ev.target.id))setTimeout(()=>{if(!AREAS_TX.includes((document.activeElement||{}).id)){const m=$("#selTx");if(m)m.remove()}},150)});
// ---------------------------------------------------------------- 🔎 búsqueda global (botón y Ctrl+F)
function abrirBusquedaG(q){if(!S)return;cerrarMenu();let d=$("#gbDlg");if(!d){d=document.createElement("dialog");d.id="gbDlg";document.body.appendChild(d)}
  d.innerHTML=`<div class="gbcab"><span class="iqlupa">🔎</span><input id="gbQ" placeholder="Buscar en todo Memphis…" autocomplete="off"><button class="b" id="gbX" title="Cerrar (Esc)">✕</button></div><div id="gbR" class="gbres"><span class="small muted">Escribe al menos 2 letras. ↑↓ para elegir, Enter abre. Atajo: Ctrl+F (⌘F en Mac) o «/».</span></div>`;
  if(!d.open)d.showModal();const i=$("#gbQ"),R=$("#gbR");let sel=-1;const items=()=>[...R.querySelectorAll("[data-gk]")];
  const pinta=()=>{sel=-1;if(i.value.trim().length<2){R.innerHTML='<span class="small muted">Escribe al menos 2 letras. ↑↓ para elegir, Enter abre.</span>';return}pintaBusqueda(i.value,R)};
  R.addEventListener("click",ev=>{const a=ev.target.closest("[data-gk]");if(!a)return;ev.preventDefault();ev.stopPropagation();d.close();setTimeout(()=>abrirResultado(a.dataset.gk),30)},true);
  i.oninput=()=>{clearTimeout(i._t);i._t=setTimeout(pinta,160)};$("#gbX").onclick=()=>d.close();d.onclick=ev=>{if(ev.target===d)d.close()};
  i.onkeydown=ev=>{const L=items();if(ev.key==="ArrowDown"||ev.key==="ArrowUp"){ev.preventDefault();if(!L.length)return;sel=(sel+(ev.key==="ArrowDown"?1:-1)+L.length)%L.length;L.forEach((a,k)=>a.classList.toggle("on",k===sel));L[sel].scrollIntoView({block:"nearest"})}
    else if(ev.key==="Enter"){ev.preventDefault();const a=L[Math.max(0,sel)];if(a)a.click()}};
  if(q){i.value=q;pinta()}setTimeout(()=>{i.focus();i.select()},30)}
function ponerBotonBuscar(){if($("#btnBuscar"))return;const ref=$("#btnSync")||$("#btnBandeja")||$("#btnTema");if(!ref)return;ref.insertAdjacentHTML("beforebegin",'<button class="b" id="btnBuscar" title="Buscar en todo (Ctrl+F)"><span class="ico">🔎</span></button>');$("#btnBuscar").onclick=()=>abrirBusquedaG()}
// ---------------------------------------------------------------- atajos de teclado
const ATK={n:["📝","Nueva nota",()=>editarD(null)],e:["📅","Nueva actividad",()=>editarD(null,{tipo:"evento"})],r:["⏰","Recordatorio rápido",()=>recordatorioRapido()],t:["☐","Nueva tarea",()=>anotarCon("- [ ] ")],
  g:["💸","Gasto",()=>anotarCon("gasté ")],i:["💰","Ingreso",()=>{if(typeof editar!=="function")return;editar(null);setTimeout(()=>{const s=$("#eT");if(!s)return;const o=[...s.options].find(o=>/^ingreso/i.test(o.value)&&!/estimado/i.test(o.value))||[...s.options].find(o=>/ingreso/i.test(o.value));if(o){s.value=o.value;s.dispatchEvent(new Event("change",{bubbles:true}))}},60)}],
  b:["📚","Guardar en la Biblioteca",()=>{irModulo("bib");setTimeout(()=>{const q=$("#bq0");if(q)q.focus()},120)}],s:["🩺","Registro de salud",()=>{if(typeof editarS==="function")editarS(null)}],k:["✍️","Anotar en Inicio",()=>anotarCon("")]};
const MODK=["ini","fin","dia","sal","bib","proy","cur"];
function anotarCon(pre){INI.busca=false;if(MOD!=="ini")irModulo("ini");else render();setTimeout(()=>{const q=$("#iq");if(!q)return;q.value=pre;q.focus();q.setSelectionRange(pre.length,pre.length);q.dispatchEvent(new Event("input"))},80)}
async function recordatorioRapido(){const v=await ctxDlg("⏰ Recordatorio",`<input id="cT" placeholder="¿Qué te recuerdo?" style="width:100%"><div class="filters" style="margin-top:6px"><input type="date" id="cF" value="${masDias(hoyISO(),1)}"><input type="time" id="cH" value="08:00"></div>
   <div class="small">${[["hoy",0],["mañana",1],["en 3 días",3],["en 1 semana",7],["en 1 mes",30]].map(([l,n])=>`<a href="#" onclick="document.getElementById('cF').value='${masDias(hoyISO(),n)}';return false">${l}</a>`).join(" · ")}</div><p class="small muted">Se guarda como una nota de hoy con su ⏰. Te avisa por Telegram.</p>`,"Crear");
  if(!v||!v.cT.trim()||!v.cF)return;const ah=new Date().toISOString(),t=sinComillas(v.cT.trim());const e={id:uid(),tipo:"nota",titulo:"",texto:"⏰ "+t,fecha:hoyISO(),hora:ahoraHM(),horaFin:"",fechaFin:"",todoDia:false,lugar:"",alertas:[],adjuntos:[],enlaces:[],creado:ah,editado:"",fijado:false,versiones:[],recs:[{id:"r"+Date.now().toString(36),fecha:v.cF,hora:v.cH||"",txt:t.slice(0,300),hecho:false}]};
  S.diario.push(e);asegurarFichas(t);changed();render();deshacer("⏰ Recordatorio "+fechaCorta(v.cF)+(v.cH?" "+v.cH:""),()=>{S.diario=S.diario.filter(x=>x!==e);changed();render()})}
document.addEventListener("keydown",ev=>{if(!S||ev.isComposing)return;const a=document.activeElement||{},enCampo=enEscritura(a),dlgA=!!document.querySelector("dialog[open]"),k=(ev.key||"").toLowerCase(),ctrl=ev.ctrlKey||ev.metaKey;
  // menú contextual con teclado
  if($("#ctxMenu")){const L=[...document.querySelectorAll("#ctxMenu [data-ci]")];if(ev.key==="Escape"){ev.preventDefault();ev.stopPropagation();cerrarMenu();return}
    if(ev.key==="ArrowDown"||ev.key==="ArrowUp"){ev.preventDefault();ev.stopPropagation();const i=L.findIndex(d=>+d.dataset.ci===MENU.sel),j=(i+(ev.key==="ArrowDown"?1:-1)+L.length)%L.length;MENU.sel=+L[j].dataset.ci;pintaSelMenu();return}
    if(ev.key==="Enter"&&MENU.sel>=0){ev.preventDefault();ev.stopPropagation();const d=L.find(d=>+d.dataset.ci===MENU.sel);if(d)d.click();return}}
  if(ev.key==="Escape"&&SELM.k&&!dlgA){terminarSel();return}
  // búsqueda global
  if(ctrl&&!ev.altKey&&(k==="f"&&!ev.shiftKey||k==="f"&&ev.shiftKey||k==="k"&&ev.shiftKey)){if($("#gbDlg")&&$("#gbDlg").open&&k==="f"&&!ev.shiftKey)return;ev.preventDefault();ev.stopImmediatePropagation();abrirBusquedaG(enCampo?"":"");return}
  if(!enCampo&&!dlgA&&ev.key==="/"&&!ctrl&&!ev.altKey){ev.preventDefault();ev.stopImmediatePropagation();abrirBusquedaG();return}
  // guardar en diálogos
  if(ctrl&&(ev.key==="Enter"||k==="s")&&$("#dlg")&&$("#dlg").open){const g=[...document.querySelectorAll("#dlgF button.p")].pop();if(g){ev.preventDefault();ev.stopPropagation();g.click()}return}
  // Shift+F10 / tecla de menú: menú del elemento con foco
  if((ev.key==="ContextMenu"||ev.shiftKey&&ev.key==="F10")&&!enCampo){const el=a.closest&&a.closest(CTX_SEL);if(el){ev.preventDefault();const r=el.getBoundingClientRect();menuPara(el,r.left+10,r.bottom)}return}
  if(enCampo||dlgA||ctrl||ev.altKey)return;
  if(a!==document.body&&typeof a.onkeydown==="function")return; // p. ej. asistencia con teclado en Cursos
  if(ev.key==="?"){ev.preventDefault();ayudaTeclado();return}
  if(/^[1-7]$/.test(ev.key)){const m=MODK[+ev.key-1];if(m&&document.querySelector(`#mods [data-mod="${m}"]`)&&!document.querySelector(`#mods [data-mod="${m}"]`).hidden){ev.preventDefault();cerrarSiAbierto();irModulo(m)}return}
  const A=ATK[k];if(A&&!ev.shiftKey){ev.preventDefault();A[2]()}},true);
function ayudaTeclado(){const f=(k,d)=>`<tr><td><kbd>${k}</kbd></td><td>${d}</td></tr>`;
  dlg("⌨ Atajos de teclado",`<p class="small">Las letras solas funcionan cuando no estás escribiendo en un campo.</p><table class="tabla-c atay">
   ${f("Ctrl+F · /","🔎 Buscar en todo (otra vez Ctrl+F dentro de la búsqueda: buscar en la página)")}${f("Ctrl+K","✍️ Anotar en Inicio")}
   ${Object.entries(ATK).filter(([k])=>k!=="k").map(([k,a])=>f(k.toUpperCase(),a[0]+" "+a[1])).join("")}
   ${f("1 … 7","Ir a Inicio, Finanzas, Diario, Salud, Biblioteca, Proyectos, Cursos")}${f("Ctrl+Enter · Ctrl+S","Guardar el formulario abierto")}${f("Esc","Cerrar")}
   ${f("Clic derecho · Shift+F10","Menú de acciones de un elemento (en el celular: mantener presionado)")}${f("?","Esta ayuda")}</table>
   <p class="small">Al escribir: <code>@</code> ligar, <code>#</code> tema, <code>/</code> comandos, <code>[ ]</code> tarea. Selecciona texto en una nota para ver negrita, colores, tarea, recordatorio, persona o tema.</p>`,[["Ver atajos de escritura","",()=>{cerrar();ayudaAtajos()}],["Entendido","p",cerrar]])}
window.addEventListener("load",()=>{ponerBotonBuscar();setTimeout(ponerBotonBuscar,1500);
  const r0=window.render;if(typeof r0==="function")window.render=function(){const o=r0.apply(this,arguments);ponerBotonBuscar();return o}});
