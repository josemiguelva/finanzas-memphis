// =====================================================================================================
// Memphis · CALENDARIOS EXTERNOS (Google, Outlook, iCloud) por su «dirección secreta iCal».
// · Los navegadores no dejan leer esas direcciones desde una página: se leen a través de un intermediario
//   propio en Cloudflare (tools/memphis-worker.js) protegido con una clave que solo tienen tú y el Worker.
// · Las direcciones secretas y la clave viven solo dentro de tus datos cifrados.
// · Cada evento se vuelve una entrada «evento» del Diario (con id fijo por evento, para no duplicar entre
//   dispositivos): le puedes escribir notas, adjuntar documentos, @personas, #temas y relaciones.
//   Título, fecha, hora, lugar y descripción vienen de Google y se actualizan solos.
// =====================================================================================================
"use strict";
const CX={ocupado:false,ult:0};
MIGRAR_EXTRA.push(st=>{const x=st.calext&&typeof st.calext==="object"?st.calext:{};const url=v=>{try{const u=new URL(String(v||""));return/^(https|webcal):$/.test(u.protocol)?u.href.slice(0,1000):""}catch(e){return""}};
  st.calext={proxy:/^https:\/\/[\w.-]+\.workers\.dev\/?$/.test(String(x.proxy||""))?String(x.proxy).replace(/\/+$/,""):"",clave:/^[\w-]{20,100}$/.test(String(x.clave||""))?String(x.clave):"",
    atras:Math.min(365,Math.max(0,+x.atras||30)),adelante:Math.min(730,Math.max(7,+x.adelante||180)),
    cals:(Array.isArray(x.cals)?x.cals:[]).filter(c=>c&&/^[\w-]{1,40}$/.test(String(c.id))&&url(c.url)).map(c=>({id:String(c.id),nombre:String(c.nombre||"Calendario").slice(0,80),url:url(c.url),activo:c.activo!==false})).slice(0,20)}});
CONFIG_EXTRA.push("calext");
const cxListo=()=>{const X=S&&S.calext;return!!(X&&X.proxy&&X.clave&&X.cals.some(c=>c.activo))};
async function idEvento(src,uidx){const h=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(src+"\n"+uidx)));return"g"+b64url(h).slice(0,30)}
async function traerICS(c){const X=S.calext;const r=await fetch(X.proxy+"/ics?u="+encodeURIComponent(c.url),{headers:{"X-Memphis-Clave":X.clave},cache:"no-store"});
  const t=await r.text();if(!r.ok)throw new Error(r.status===403?"la clave del intermediario no coincide":r.status===404?"Google no encontró ese calendario (¿restableciste la dirección?)":(t||("error "+r.status)).slice(0,120));
  if(!/BEGIN:VCALENDAR/.test(t))throw new Error("la respuesta no es un calendario");return t}
const CX_EST=JSON.parse((()=>{try{return localStorage.getItem("memphisCalEst")||"{}"}catch(e){return"{}"}})());
const cxEst=(id,v)=>{CX_EST[id]=v;try{localStorage.setItem("memphisCalEst",JSON.stringify(CX_EST))}catch(e){}};
async function sincCalendarios(manual){if(!S||CX.ocupado||!cxListo()||navigator.onLine===false)return null;CX.ocupado=true;CX.ult=Date.now();const X=S.calext,desde=masDias(hoyISO(),-X.atras),hasta=masDias(hoyISO(),X.adelante),ah=new Date().toISOString();
  let n=0,u=0,b=0;const errores=[];
  try{for(const c of X.cals.filter(c=>c.activo)){try{const {evs}=parseICS(await traerICS(c));const L=expandirICS(evs,desde,hasta),vistos=new Set();
      for(const x of L){vistos.add(x.uid);const id=await idEvento(c.id,x.uid);let e=(S.diario||[]).find(d=>d.id===id)||(S.diario||[]).find(d=>d.gcal&&d.gcal.uid===x.uid&&(!d.gcal.src||d.gcal.src===c.id));
        if(e){const cambia=e.titulo!==x.titulo||e.fecha!==x.fecha||e.hora!==x.hora||(e.horaFin||"")!==x.horaFin||!!e.todoDia!==x.todoDia||(e.lugar||"")!==x.lugar||e.gcal.desc!==x.desc||e.gcal.fuera||e.gcal.src!==c.id||e.gcal.cal!==c.nombre;
          if(cambia){Object.assign(e,{titulo:x.titulo,fecha:x.fecha,hora:x.hora,horaFin:x.horaFin,todoDia:x.todoDia,lugar:x.lugar,editado:ah});Object.assign(e.gcal,{desc:x.desc,src:c.id,cal:c.nombre,visto:ah});delete e.gcal.fuera;u++}}
        else{(S.diario=S.diario||[]).push({id,tipo:"evento",titulo:x.titulo,texto:"",fecha:x.fecha,hora:x.hora,horaFin:x.horaFin,fechaFin:"",todoDia:x.todoDia,lugar:x.lugar,alertas:[],adjuntos:[],enlaces:[],creado:ah,editado:"",fijado:false,versiones:[],gcal:{uid:x.uid,desc:x.desc,cal:c.nombre,src:c.id,visto:ah}});n++}}
      // los que ya no están en Google: sin notas tuyas se quitan; con notas se marcan
      for(const e of [...(S.diario||[])]){if(!e.gcal||e.gcal.src!==c.id||vistos.has(e.gcal.uid)||e.fecha<desde||e.fecha>hasta||e.gcal.fuera)continue;
        const tuyo=(e.texto||"").trim()||(e.adjuntos||[]).length||(e.enlaces||[]).length||(S.vinculos||[]).some(v=>v.a==="d:"+e.id||v.b==="d:"+e.id);
        if(tuyo){e.gcal.fuera=true;e.editado=ah}else{S.diario=S.diario.filter(y=>y!==e);(S.eliminados=S.eliminados||[]).push({id:e.id,fecha:ah})}b++}
      cxEst(c.id,{ok:ah,n:L.length})}catch(err){errores.push(c.nombre+": "+err.message);cxEst(c.id,{err:err.message,t:ah})}}}
  finally{CX.ocupado=false}
  if(n||u||b){changed();if(["dia","semana","mes","anio"].includes(TD.vista)&&MOD==="dia")render()}
  if(manual)aviso(errores.length?"⚠️ "+errores.join(" · "):`🗓️ Calendarios al día${n||u||b?`: ${n} nuevos, ${u} cambiados${b?`, ${b} quitados`:""}`:""}`);
  else if(errores.length)aviso("🗓️ "+errores[0]);
  if($("#cxCard"))pintarCx();return{n,u,b,errores}}
// ---------------------------------------------------------------- tarjeta en Datos
function cxCardHtml(){return`<div class="card" id="cxCard"><h2>🗓️ Calendarios (Google, Outlook, iCloud)</h2><div id="cxIn"></div></div>`}
function pintarCx(){const box=$("#cxIn");if(!box)return;const X=S.calext;
  box.innerHTML=`<p class="small muted">Tus eventos aparecen solos en la agenda, como eventos del Diario a los que puedes agregar notas, documentos y personas. Se leen con la «dirección secreta en formato iCal» de cada calendario, a través de tu intermediario en Cloudflare.</p>
   <details ${X.proxy&&X.clave&&X.cals.length?"":"open"}><summary><b>1. Intermediario</b> ${X.proxy&&X.clave?'<span class="chip ok">configurado</span>':'<span class="chip warn">falta</span>'}</summary>
    <label class="small">Dirección del Worker</label><input id="cxP" placeholder="https://memphis.TU-NOMBRE.workers.dev" value="${esc(X.proxy)}" style="width:100%" autocomplete="off">
    <label class="small">Clave del intermediario (va en Cloudflare como variable secreta <code>MEMPHIS_CLAVE</code>)</label><div class="filters" style="margin:0"><input id="cxK" value="${esc(X.clave)}" readonly style="flex:1;font-family:monospace;font-size:.8rem" placeholder="Toca «Generar»"><button class="b s" id="cxKG">${X.clave?"Cambiar":"Generar"}</button><button class="b s" id="cxKC" ${X.clave?"":"disabled"}>📋 Copiar</button></div>
    <div class="filters"><button class="b s p" id="cxPG">Guardar</button><button class="b s" id="cxPT" ${X.proxy&&X.clave?"":"disabled"}>Probar</button><span class="small" id="cxPR"></span></div>
    <p class="small muted">Código del intermediario: <a href="tools/memphis-worker.js" target="_blank" rel="noopener">memphis-worker.js</a>. El mismo intermediario trae también los adjuntos de Telegram.</p></details>
   <div style="margin-top:8px"><b>2. Calendarios</b></div>
   ${X.cals.map(c=>{const e=CX_EST[c.id]||{};return`<div class="vrow"><label style="margin:0"><input type="checkbox" data-cxa="${esc(c.id)}" ${c.activo?"checked":""}></label><span style="flex:1">🗓️ <b>${esc(c.nombre)}</b> <span class="small muted">${e.err?`<span class="neg">⚠️ ${esc(e.err)}</span>`:e.ok?`✔ ${esc(e.n)} eventos · ${esc(new Date(e.ok).toLocaleString("es-CO",{dateStyle:"short",timeStyle:"short"}))}`:"sin sincronizar aún"}</span></span><button class="b s" data-cxx="${esc(c.id)}">✕</button></div>`}).join("")||'<p class="small muted">Aún no hay calendarios.</p>'}
   <div class="filters"><input id="cxN" placeholder="Nombre (Personal, Trabajo…)" style="flex:1;min-width:120px"><input id="cxU" type="password" placeholder="Dirección secreta iCal (…/basic.ics)" style="flex:2;min-width:160px" autocomplete="off"><button class="b s p" id="cxA">+ Agregar</button></div>
   <div class="filters"><label class="small" style="margin:0">Traer desde <input type="number" id="cxAt" value="${X.atras}" min="0" max="365" style="width:60px"> días atrás hasta <input type="number" id="cxAd" value="${X.adelante}" min="7" max="730" style="width:60px"> días adelante</label><button class="b s" id="cxS" ${cxListo()?"":"disabled"}>🔄 Sincronizar ahora</button></div>
   <p class="small muted">Se actualiza al abrir Memphis y cada 30 minutos. Título, hora, lugar y descripción se cambian en Google; tus notas, fotos y relaciones quedan en Memphis. Si un evento se borra en Google y tenía notas tuyas, se conserva con la marca «ya no está en Google».</p>`;
  const guardarP=()=>{const p=$("#cxP").value.trim().replace(/\/+$/,"");if(p&&!/^https:\/\/[\w.-]+\.workers\.dev$/.test(p)){alert("La dirección debe ser la de tu Worker: https://algo.workers.dev");return false}X.proxy=p;changed();return true};
  $("#cxKG").onclick=()=>{if(X.clave&&!confirm("Si cambias la clave tendrás que ponerla otra vez en Cloudflare. ¿Seguir?"))return;const pp=$("#cxP").value.trim().replace(/\/+$/,"");if(/^https:\/\/[\w.-]+\.workers\.dev$/.test(pp))X.proxy=pp;X.clave=b64url(crypto.getRandomValues(new Uint8Array(24)));changed();pintarCx();aviso("Clave nueva: cópiala en Cloudflare (MEMPHIS_CLAVE)")};
  $("#cxKC").onclick=async()=>{try{await navigator.clipboard.writeText(X.clave);aviso("Clave copiada")}catch(e){$("#cxK").select()}};
  $("#cxPG").onclick=()=>{if(guardarP()){aviso("Guardado");pintarCx()}};
  $("#cxPT").onclick=async()=>{if(!guardarP())return;const R=$("#cxPR");R.textContent="Probando…";try{const r=await fetch(X.proxy+"/ics?u="+encodeURIComponent("https://calendar.google.com/calendar/ical/prueba/basic.ics"),{headers:{"X-Memphis-Clave":X.clave},cache:"no-store"});const t=await r.text();
      R.innerHTML=r.status===403?'<span class="neg">✗ La clave no coincide: revisa MEMPHIS_CLAVE en Cloudflare</span>':r.status===500&&/MEMPHIS_CLAVE/.test(t)?'<span class="neg">✗ Falta la variable secreta MEMPHIS_CLAVE en el Worker</span>':'<span class="pos">✓ El intermediario responde y la clave coincide</span>'}
    catch(e){R.innerHTML='<span class="neg">✗ No responde (¿la dirección es correcta y el Worker está implementado?)</span>'}};
  $("#cxA").onclick=()=>{let u=$("#cxU").value.trim().replace(/^webcal:/i,"https:");const nm=$("#cxN").value.trim()||"Calendario";try{const x=new URL(u);if(x.protocol!=="https:")throw 0}catch(e){alert("Pega la dirección secreta en formato iCal (empieza por https://)");return}
    if(/\/public\/basic\.ics/.test(u)&&!confirm("Esa parece la dirección PÚBLICA del calendario. Para calendarios privados usa la «Dirección secreta en formato iCal». ¿Agregarla igual?"))return;
    X.cals.push({id:"c"+uid(),nombre:nm.slice(0,80),url:u,activo:true});changed();pintarCx();if(cxListo())sincCalendarios(true)};
  document.querySelectorAll("[data-cxa]").forEach(c=>c.onchange=()=>{const k=X.cals.find(y=>y.id===c.dataset.cxa);k.activo=c.checked;changed();pintarCx()});
  document.querySelectorAll("[data-cxx]").forEach(bt=>bt.onclick=()=>{const k=X.cals.find(y=>y.id===bt.dataset.cxx);if(!confirm(`¿Quitar «${k.nombre}»? Sus eventos sin notas tuyas se borran de la agenda; los que tienen notas se quedan.`))return;
    X.cals=X.cals.filter(y=>y!==k);const ah=new Date().toISOString();for(const e of [...(S.diario||[])])if(e.gcal&&e.gcal.src===k.id){const tuyo=(e.texto||"").trim()||(e.adjuntos||[]).length||(S.vinculos||[]).some(v=>v.a==="d:"+e.id||v.b==="d:"+e.id);if(tuyo){delete e.gcal.src;e.editado=ah}else{S.diario=S.diario.filter(y=>y!==e);S.eliminados.push({id:e.id,fecha:ah})}}
    changed();pintarCx()});
  const rg=()=>{X.atras=Math.min(365,Math.max(0,+$("#cxAt").value||30));X.adelante=Math.min(730,Math.max(7,+$("#cxAd").value||180));changed()};$("#cxAt").onchange=rg;$("#cxAd").onchange=rg;
  $("#cxS").onclick=()=>sincCalendarios(true)}
// ---------------------------------------------------------------- enganches
window.addEventListener("load",()=>{
  const vd=window.vDatos;if(typeof vd==="function")window.vDatos=function(){const r=vd.apply(this,arguments);const v=$("#view");if(v&&S&&!$("#cxCard")){const ref=$("#recCard");if(ref)ref.insertAdjacentHTML("afterend",cxCardHtml());else v.insertAdjacentHTML("afterbegin",cxCardHtml());pintarCx()}return r};
  const dz=window.desbloqueado;if(typeof dz==="function")window.desbloqueado=function(){const r=dz.apply(this,arguments);setTimeout(()=>sincCalendarios(false).catch(()=>{}),4000);return r};
  setInterval(()=>{if(S&&document.visibilityState==="visible"&&Date.now()-CX.ult>30*60000)sincCalendarios(false).catch(()=>{})},60000);
  document.addEventListener("visibilitychange",()=>{if(S&&document.visibilityState==="visible"&&Date.now()-CX.ult>10*60000)sincCalendarios(false).catch(()=>{})});
  // marca «ya no está en Google» en la tarjeta y en el detalle
  const ti=window.tarjetaItem;if(typeof ti==="function")window.tarjetaItem=function(x){let h=ti.apply(this,arguments);if(x&&x.k==="d"&&x.e.gcal){h=h.replace('<span class="chip">Google</span>',`<span class="chip" title="${esc(x.e.gcal.cal||"")}">🗓️ ${esc((x.e.gcal.cal||"Google").slice(0,18))}</span>${x.e.gcal.fuera?'<span class="chip bad">ya no está en Google</span>':""}`)}return h};
});
