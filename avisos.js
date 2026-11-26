// =====================================================================================================
// Memphis · 🔔 AVISOS POR TELEGRAM aunque Memphis esté cerrado. Memphis arma la lista de los próximos 8 días
// (actividades, citas, clases, tareas con hora, pagos, vencimientos, cumpleaños y un resumen cada mañana) y la deja en
// TU intermediario de Cloudflare; el intermediario revisa cada 5 minutos y te escribe con tu bot.
// Privacidad: la lista viaja y queda sin cifrar en tu cuenta de Cloudflare. Con «modo discreto» solo va la hora.
// =====================================================================================================
"use strict";
MIGRAR_EXTRA.push(st=>{const a=st.avisos&&typeof st.avisos==="object"?st.avisos:{};const hm=v=>/^\d\d:\d\d$/.test(String(v||""))?String(v):"";
  st.avisos={on:a.on===true,antes:[0,5,10,15,30,60,120].includes(+a.antes)?+a.antes:15,resumen:a.resumen===""?"":hm(a.resumen)||"06:30",discreto:a.discreto===true,pagos:a.pagos!==false,venc:a.venc!==false,cumple:a.cumple!==false,tareas:a.tareas!==false,clases:a.clases!==false}});
CONFIG_EXTRA.push("avisos");
const AV={ult:0,ocupado:false,err:"",t:null};
const avListo=()=>!!(S&&S.avisos&&S.avisos.on&&S.telegram&&S.telegram.token&&S.telegram.chat&&S.calext&&S.calext.proxy&&S.calext.clave);
const msDe=(f,h)=>new Date(`${f}T${h||"00:00"}:00`).getTime();
function listaAvisos(){const A=S.avisos,hoy=hoyISO(),fin=masDias(hoy,8),ahora=Date.now(),out=[],disc=A.discreto;
  const pon=(id,t,txt,disc2)=>{if(t<ahora-60000||t>msDe(fin,"23:59"))return;if(out.some(o=>o.id===String(id).replace(/[^\w-]/g,"_").slice(0,80)))return;out.push({id:String(id).replace(/[^\w-]/g,"_").slice(0,80),t,txt:disc?disc2:txt})};
  const hhmm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
  const porDia={};const agenda=(f,h,t)=>{(porDia[f]=porDia[f]||[]).push([h||"",t])};
  for(const e of S.diario||[]){if(Array.isArray(e.recs)&&!(e.gcal&&e.gcal.fuera)){const priv=typeof verPriv==="function"&&verPriv(e),base=priv?"🔒 (privada)":(e.titulo||String(e.texto||"").split("\n")[0].replace(/^- \[ \] /,"").slice(0,90)||"Nota");
      for(const r of e.recs){if(r.hecho||r.fecha<hoy||r.fecha>fin)continue;const h=r.hora||"08:00";agenda(r.fecha,r.hora,"⏰ "+(r.txt||base));pon(`k${e.id}_${r.id}`,msDe(r.fecha,h),`⏰ Recordatorio${r.hora?" "+r.hora:""}: ${r.txt||base}${r.txt&&!priv?"\n— de: "+base:""}`,`⏰ Tienes un recordatorio${r.hora?" a las "+r.hora:""}.`)}}
    if(e.tipo!=="evento"||e.oculto||(e.gcal&&e.gcal.fuera)||e.fecha<hoy||e.fecha>fin)continue;const tit=(typeof verPriv==="function"&&verPriv(e))?"🔒 (privada)":(e.titulo||"Actividad");agenda(e.fecha,e.todoDia?"":e.hora,"📅 "+tit);
    if(!e.hora||e.todoDia||e.sinAviso)continue;const al=(e.alertas&&e.alertas.length?e.alertas:[A.antes]);for(const m of al){const t=msDe(e.fecha,e.hora)-m*60000;pon(`d${e.id}_${m}`,t,`⏰ ${e.hora} · ${tit}${e.lugar?" · 📍 "+e.lugar:""}${m?` (en ${m>=60?m/60+" h":m+" min"})`:""}`,`⏰ Tienes algo a las ${e.hora}. Ábrelo en Memphis.`)}}
  for(const r of S.salud||[]){if(r.tipo!=="cita"||r.fecha<hoy||r.fecha>fin)continue;agenda(r.fecha,r.hora,"🩺 "+r.titulo);if(r.hora)pon(`s${r.id}`,msDe(r.fecha,r.hora)-A.antes*60000,`🩺 ${r.hora} · ${r.titulo}${r.lugar?" · 📍 "+r.lugar:""}`,`🩺 Cita a las ${r.hora}.`)}
  if(A.tareas){for(const t of S.ptar||[]){if(!t.fin||t.fin<hoy||t.fin>fin||["hecho","cancelado"].includes(t.estado)||t.tipo==="objetivo")continue;const p=(S.proy||[]).find(x=>x.id===t.proy)||{};agenda(t.fin,t.hora,`☑️ ${t.titulo} (${p.corto||p.nombre||"proyecto"})`);if(t.hora)pon(`t${t.id}`,msDe(t.fin,t.hora),`☑️ ${t.hora} · ${t.titulo}${p.nombre?" · 🎯 "+(p.corto||p.nombre):""}`,`☑️ Tarea a las ${t.hora}.`)}
    if(typeof todasTareas==="function")for(const t of todasTareas()){if(t.hecha||!t.fecha||t.fecha<hoy||t.fecha>fin)continue;agenda(t.fecha,t.hora,"☑️ "+t.texto.slice(0,80));if(t.hora)pon(`x${t.key}_${t.linea}`,msDe(t.fecha,t.hora),`☑️ ${t.hora} · ${t.texto.slice(0,200)}`,`☑️ Tarea a las ${t.hora}.`)}}
  if(A.clases&&typeof C!=="undefined"&&C)for(const s of C.ses){if(s.cancelada||s.fecha<hoy||s.fecha>fin)continue;const c=C.cur.find(x=>x.id===s.cur);if(!c||c.arch)continue;agenda(s.fecha,s.hora,`🎓 ${c.nombre}${s.tema?" · "+s.tema:""}`);if(s.hora)pon(`c${s.id}`,msDe(s.fecha,s.hora)-A.antes*60000,`🎓 ${s.hora} · Clase de ${c.nombre}${s.tema?" · "+s.tema:""}`,`🎓 Clase a las ${s.hora}.`)}
  const ANTES=[[3,"en 3 días"],[1,"mañana"],[0,"hoy"]],fechaBonita=f=>{const d=dDe(f);return d.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"})};
  if(A.pagos)for(const r of S.rec||[]){if(r.activo===false)continue;for(const f of ocurrencias(r,hoy,masDias(fin,3))){const v=(vigenteEn(r,f)||{}).monto||0;if(f<=fin)agenda(f,"",`💳 ${r.nombre}`);
    for(const [n,cuando] of ANTES){const d=masDias(f,-n);pon(`r${r.id}_${f}_${n}`,msDe(d,"07:00"),`💳 ${n?`Pago ${cuando} (${fechaBonita(f)})`:"Hoy toca pagar"}: ${r.nombre}${v?" · "+fmt(v):""}`,`💳 Tienes un pago ${cuando}.`)}}}
  if(A.venc)for(const v of S.venc||[]){if(v.estado==="cerrado"||!v.vence||v.vence<hoy||v.vence>masDias(fin,3))continue;if(v.vence<=fin)agenda(v.vence,"",`⏰ Vence: ${v.titulo}`);
    for(const [n,cuando] of ANTES){const d=masDias(v.vence,-n);pon(`v${v.id}_${n}`,msDe(d,"07:00"),`⏰ ${n?`Vence ${cuando} (${fechaBonita(v.vence)})`:"Vence hoy"}: ${v.titulo}`,`⏰ Algo vence ${cuando}.`)}}
  if(A.cumple&&typeof proxCumple==="function")for(const f of S.fichas||[]){const c=f.tipo==="persona"&&f.datos&&f.datos.cumple;if(!c)continue;const d=proxCumple(c,hoy);if(d>fin)continue;agenda(d,"",`🎂 ${f.nombre}`);pon(`b${f.id}_${d}`,msDe(d,"07:00"),`🎂 Hoy cumple años ${f.nombre}`,"🎂 Hoy hay un cumpleaños.")}
  if(A.resumen)for(let i=0;i<=8;i++){const f=masDias(hoy,i),L=(porDia[f]||[]).sort((a,b)=>(a[0]||"99").localeCompare(b[0]||"99"));if(!L.length)continue;
    pon(`res_${f}`,msDe(f,A.resumen),`☀️ Tu día · ${fechaLarga(f)}\n\n`+L.map(([h,t])=>`${h?h+" ":"• "}${t}`).join("\n"),`☀️ Hoy tienes ${L.length} cosa${L.length>1?"s":""} en la agenda. Ábrela en Memphis.`)}
  return out.sort((a,b)=>a.t-b.t)}
async function subirAvisos(forzar){if(!avListo()||AV.ocupado||navigator.onLine===false)return;const L=listaAvisos(),h=JSON.stringify(L).length+"_"+await sha256(new TextEncoder().encode(JSON.stringify(L)));
  let prev="";try{prev=localStorage.getItem("memphisAvHash")||""}catch(e){}const viejo=Date.now()-(+localStorage.getItem("memphisAvT")||0)>6*3600e3;if(!forzar&&h===prev&&!viejo)return;
  AV.ocupado=true;AV.pend=false;try{const X=S.calext,r=await fetch(X.proxy+"/avisos",{method:"POST",keepalive:JSON.stringify(L).length<60000,headers:{"X-Memphis-Clave":X.clave,"X-Memphis-Bot":S.telegram.token,"Content-Type":"application/json"},body:JSON.stringify({chat:S.telegram.chat,lista:L})});
    if(!r.ok)throw new Error(r.status===404||r.status===405?"Tu intermediario es la versión anterior: actualiza su código.":(await r.text()).slice(0,160));AV.err="";AV.n=L.length;try{localStorage.setItem("memphisAvHash",h);localStorage.setItem("memphisAvT",String(Date.now()))}catch(e){}}
  catch(e){AV.err=e.message}finally{AV.ocupado=false;pintarAv()}}
async function diagAvisos(){const el=$("#avDiag");if(!el)return;el.textContent="Revisando…";const hace=t=>{const m=Math.round((Date.now()-t)/60000);return m<1?"hace segundos":m<60?`hace ${m} min`:m<2880?`hace ${Math.round(m/60)} h`:`hace ${Math.round(m/1440)} días`};
  try{await subirAvisos(true);const el2=$("#avDiag");if(el2&&el2!==el){el2.textContent="Revisando…"}const X=S.calext,r=await fetch(X.proxy+"/avisos/estado",{headers:{"X-Memphis-Clave":X.clave},cache:"no-store"});if(!r.ok)throw new Error(r.status===404?"Tu intermediario no es la versión 3: pega otra vez el código de memphis-worker.js y despliega.":(await r.text()).slice(0,150));const e=await r.json();
    const out=$("#avDiag")||el2;if(!e.kv){out.innerHTML='<p class="neg">❌ El Worker no ve el espacio KV: en Settings → Bindings el nombre de la variable debe ser exactamente <code>AVISOS</code>.</p>';return}
    const cron=e.latido&&Date.now()-e.latido<40*60000,hm=t=>{const d=new Date(t);return d.toLocaleString("es-CO",{weekday:"short",hour:"2-digit",minute:"2-digit"})};
    out.innerHTML=`<ul style="margin:6px 0;padding-left:18px"><li>${e.subido?`✓ Lista recibida ${hace(e.subido)}: ${e.n} avisos, ${e.pendientes} por enviar, ${e.enviados} ya enviados.`:'❌ El intermediario aún no tiene tu lista.'}</li>
     <li>${e.proximo?`Próximo aviso: <b>${esc(hm(e.proximo))}</b>.`:"No hay avisos próximos en la lista (¿la actividad tiene hora y es de los próximos 8 días?)."}</li>
     <li>${cron?`✓ La revisión automática está corriendo (última ${hace(e.latido)}).`:e.latido?`❌ La revisión automática no corre desde ${hace(e.latido)}.`:'❌ La revisión automática (Cron) nunca ha corrido: en tu Worker → Settings → Triggers → Cron Triggers agrega <code>*/5 * * * *</code> y guarda. Puede tardar unos minutos en empezar.'}</li></ul>`}
  catch(e){($("#avDiag")||el).innerHTML=`<p class="neg">❌ ${esc(e.message)}</p>`}}
function tarjetaAvisos(){return`<div class="card" id="avCard"><h2>🔔 Avisos por Telegram</h2><div id="avIn"></div></div>`}
function pintarAv(){const box=$("#avIn");if(!box||!S)return;const A=S.avisos,tg=S.telegram&&S.telegram.chat,px=S.calext&&S.calext.proxy&&S.calext.clave;
  box.innerHTML=`<p class="small">Te escribo por tu bot cuando algo esté por empezar, <b>aunque Memphis esté cerrado</b>: actividades, citas, clases, recordatorios ⏰ que pongas en notas y actividades, tareas con hora, pagos y vencimientos (3 días antes, la víspera y el mismo día a las 7 a. m.), cumpleaños y un resumen cada mañana.</p>
   ${!tg?'<p class="small warn">Primero conecta tu bot de Telegram (más arriba, en «Capturas»).</p>':""}${!px?'<p class="small warn">Primero configura tu intermediario de Cloudflare (Calendarios › 1. Intermediario).</p>':""}
   <label class="small"><input type="checkbox" id="avOn" ${A.on?"checked":""} ${tg&&px?"":"disabled"}> Activar avisos</label>
   <div class="ajg" style="margin-top:6px"><label>Avisar antes de actividades y clases<select id="avAn">${[0,5,10,15,30,60,120].map(m=>`<option value="${m}" ${A.antes===m?"selected":""}>${m?m>=60?m/60+" h":m+" min":"a la hora"}</option>`).join("")}</select></label>
    <label>Resumen del día<select id="avRe"><option value="">No</option>${["05:30","06:00","06:30","07:00","07:30","08:00","20:00","21:00"].map(h=>`<option ${A.resumen===h?"selected":""}>${h}</option>`).join("")}</select></label>
    <label>Contenido<select id="avDi"><option value="0" ${A.discreto?"":"selected"}>Completo (título y lugar)</option><option value="1" ${A.discreto?"selected":""}>Discreto (solo la hora)</option></select></label></div>
   <div class="filters small" style="margin-top:6px">${[["tareas","Tareas"],["clases","Clases"],["pagos","Pagos fijos"],["venc","Vencimientos"],["cumple","Cumpleaños"]].map(([k,l])=>`<label><input type="checkbox" data-avk="${k}" ${A[k]?"checked":""}> ${l}</label>`).join("")}</div>
   <div class="filters"><button class="b s" id="avPr" ${tg&&px?"":"disabled"}>Enviar prueba</button><button class="b s" id="avSu" ${avListo()?"":"disabled"}>Actualizar ahora</button><span class="small" id="avEs">${AV.err?`<span class="neg">${esc(AV.err)}</span>`:A.on&&AV.n!=null?`✓ ${AV.n} avisos programados para los próximos 8 días`:""}</span></div>
   <div id="avDiag" class="small"></div>${A.on&&avListo()?'<button class="b s" id="avDg">🔍 Revisar el intermediario</button>':""}
   <details class="small"><summary><b>Qué hay que hacer en Cloudflare (una vez)</b></summary><ol><li>Actualiza el código de tu Worker con la versión 3 de <a href="https://github.com/josemiguelva/finanzas-memphis/blob/main/tools/memphis-worker.js" target="_blank" rel="noopener">memphis-worker.js</a> (también trae las vistas previas de enlaces).</li>
     <li>En Cloudflare: <b>Storage &amp; Databases → KV → Create</b> un espacio (p. ej. «memphis-avisos»).</li><li>En tu Worker: <b>Settings → Bindings → Add → KV namespace</b>, nombre de variable <code>AVISOS</code>, elige ese espacio.</li>
     <li>En tu Worker: <b>Settings → Triggers → Cron Triggers → Add</b>: <code>*/5 * * * *</code> (cada 5 minutos). Guarda y despliega.</li><li>Vuelve aquí, activa los avisos y toca «Enviar prueba».</li></ol>
     <p class="muted">La lista de avisos (y tu bot, para poder escribirte) queda guardada sin cifrar en tu cuenta de Cloudflare hasta que pasan. Si prefieres, usa el modo «Discreto».</p></details>`;
  const guarda=()=>{changed();setTimeout(()=>subirAvisos(true),300)};
  $("#avOn").onchange=()=>{A.on=$("#avOn").checked;guarda();pintarAv()};$("#avAn").onchange=()=>{A.antes=+$("#avAn").value;guarda()};$("#avRe").onchange=()=>{A.resumen=$("#avRe").value;guarda()};$("#avDi").onchange=()=>{A.discreto=$("#avDi").value==="1";guarda()};
  if($("#avDg"))$("#avDg").onclick=diagAvisos;
  box.querySelectorAll("[data-avk]").forEach(c=>c.onchange=()=>{A[c.dataset.avk]=c.checked;guarda()});$("#avSu").onclick=()=>subirAvisos(true);
  $("#avPr").onclick=async()=>{$("#avEs").textContent="Enviando…";try{const X=S.calext,r=await fetch(X.proxy+"/avisos/prueba",{method:"POST",headers:{"X-Memphis-Clave":X.clave,"X-Memphis-Bot":S.telegram.token,"Content-Type":"application/json"},body:JSON.stringify({chat:S.telegram.chat})});
    if(!r.ok)throw new Error(r.status===404||r.status===405?"Tu intermediario es la versión anterior: actualiza su código.":(await r.text()).slice(0,160));$("#avEs").textContent="✓ Revisa tu Telegram"}catch(e){$("#avEs").innerHTML=`<span class="neg">${esc(e.message)}</span>`}}}
window.addEventListener("load",()=>{
  const vd=window.vDatos;if(typeof vd==="function")window.vDatos=function(){const r=vd.apply(this,arguments);const v=$("#view");if(v&&S&&!$("#avCard")){const ref=$("#capCard")||$("#cxCard");if(ref)ref.insertAdjacentHTML("afterend",tarjetaAvisos());else v.insertAdjacentHTML("beforeend",tarjetaAvisos());pintarAv()}return r};
  const ch=window.changed;if(typeof ch==="function")window.changed=function(){const r=ch.apply(this,arguments);if(avListo()){clearTimeout(AV.t);AV.pend=true;AV.t=setTimeout(()=>subirAvisos(),4000)}return r};
  setInterval(()=>{if(avListo()&&!document.hidden){if(typeof C!=="undefined"&&!C&&typeof cargarCursos==="function"&&S.avisos.clases)cargarCursos().catch(()=>{});subirAvisos()}},10*60000);
  document.addEventListener("visibilitychange",()=>{if(!avListo())return;if(document.hidden){if(AV.pend){clearTimeout(AV.t);subirAvisos()}}else setTimeout(()=>subirAvisos(),3000)});
  addEventListener("pagehide",()=>{if(avListo()&&AV.pend){clearTimeout(AV.t);subirAvisos()}});
  const dz=window.desbloqueado;if(typeof dz==="function")window.desbloqueado=function(){const r=dz.apply(this,arguments);setTimeout(()=>{if(avListo())subirAvisos()},8000);return r};
});
