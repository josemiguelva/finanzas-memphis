// =====================================================================================================
// Memphis · ✉️ CORREO CON GMAIL — resúmenes individuales de notas y asistencia a cada estudiante.
// · Permiso de Google SOLO para enviar (gmail.send). Sin programas de Google dentro de Memphis: se abre la
//   página de Google en una ventanita, y oauth.html devuelve el permiso (vale 1 hora, solo en memoria).
// · Cada estudiante recibe únicamente lo suyo.
// =====================================================================================================
"use strict";
const GM={token:"",exp:0,estado:""};
MIGRAR_EXTRA.push(st=>{const g=st.gmail&&typeof st.gmail==="object"?st.gmail:{};st.gmail={clientId:/^[\w.-]{10,200}\.apps\.googleusercontent\.com$/.test(String(g.clientId||""))?String(g.clientId):"",remitente:String(g.remitente||"").slice(0,120),nombre:String(g.nombre||"").slice(0,120),firma:String(g.firma||"").slice(0,2000),
  asunto:String(g.asunto||"Resumen de {curso}").slice(0,200),intro:String(g.intro||"Hola {nombre}:\n\nTe comparto el resumen de tus notas y asistencia en {curso} a la fecha.").slice(0,4000)}});
CONFIG_EXTRA.push("gmail");
const gmListo=()=>!!(S&&S.gmail&&S.gmail.clientId);
const redirOAuth=()=>location.origin+location.pathname.replace(/[^/]*$/,"")+"oauth.html";
function permisoGmail(){if(GM.token&&Date.now()<GM.exp-60000)return Promise.resolve(GM.token);
  return new Promise((ok,ko)=>{GM.estado=b64url(crypto.getRandomValues(new Uint8Array(16)));const u="https://accounts.google.com/o/oauth2/v2/auth?"+new URLSearchParams({client_id:S.gmail.clientId,redirect_uri:redirOAuth(),response_type:"token",scope:"https://www.googleapis.com/auth/gmail.send",state:GM.estado,include_granted_scopes:"true",...(S.gmail.remitente?{login_hint:S.gmail.remitente}:{})});
    const w=window.open(u,"memphisGoogle","width=480,height=640");if(!w){ko(new Error("Permite las ventanas emergentes para conectar con Google"));return}
    const fin=(f,v)=>{removeEventListener("message",onm);clearInterval(iv);f(v)};
    const onm=ev=>{if(ev.origin!==location.origin||!ev.data||!ev.data.memphisOAuth)return;if(ev.data.state!==GM.estado)return fin(ko,new Error("Respuesta de Google no válida"));if(ev.data.error)return fin(ko,new Error(ev.data.error==="access_denied"?"No diste el permiso en Google":"Google: "+ev.data.error));
      GM.token=ev.data.token;GM.exp=Date.now()+(ev.data.exp||3600)*1000;fin(ok,GM.token)};
    addEventListener("message",onm);const iv=setInterval(()=>{if(w.closed){setTimeout(()=>{if(GM.estado&&!GM.token)fin(ko,new Error("Se cerró la ventana de Google"))},600)}},800)})}
const b64utf=s=>u8b64(enc.encode(s));
const encCab=s=>/^[\x20-\x7e]*$/.test(s)?s:"=?UTF-8?B?"+b64utf(s)+"?=";
function mime({para,asunto,html,texto}){const b="mm_"+uid();const de=S.gmail.remitente?(S.gmail.nombre?`${encCab(S.gmail.nombre)} <${S.gmail.remitente}>`:S.gmail.remitente):"";
  const partes=[...(de?[`From: ${de}`]:[]),`To: ${para}`,`Subject: ${encCab(asunto)}`,"MIME-Version: 1.0",`Content-Type: multipart/alternative; boundary="${b}"`,"",`--${b}`,"Content-Type: text/plain; charset=UTF-8","Content-Transfer-Encoding: base64","",b64utf(texto).replace(/.{76}/g,"$&\r\n"),`--${b}`,"Content-Type: text/html; charset=UTF-8","Content-Transfer-Encoding: base64","",b64utf(html).replace(/.{76}/g,"$&\r\n"),`--${b}--`];
  return b64url(enc.encode(partes.join("\r\n")))}
async function enviarGmail(m){const t=await permisoGmail();const r=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({raw:mime(m)})});
  if(r.status===401){GM.token="";throw new Error("El permiso de Google venció; vuelve a enviar")}if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error((j.error&&j.error.message)||"Gmail respondió "+r.status)}return r.json()}
// ---------------------------------------------------------------- contenido del resumen (solo lo de ese estudiante)
function resumenEst(c,e,op){const R=calcNotas(c.id,e.id),A=asisDe(c.id,e.id),E=c.escala,i=C.ins.find(x=>x.cur===c.id&&x.est===e.id)||{};const sub=t=>t.replace(/\{nombre\}/g,e.nom.split(" ")[0]?cap(e.nom.split(" ")[0]):nomEst(e)).replace(/\{nombre_completo\}/g,nomEst(e)).replace(/\{curso\}/g,c.nombre).replace(/\{grupo\}/g,c.grupo||"").replace(/\{fecha\}/g,fechaLarga(hoyISO()));
  const cols=colsDe(c.id),G=grpDe(c.id),filas=cols.map(x=>{const cel=C.nota[x.id+"|"+e.id]||{};const g=G.find(y=>y.id===x.grp);return{t:x.titulo,g:g?g.nombre:"",f:x.fecha,v:cel.v||"",max:x.max,c:op.com?cel.c||"":""}});
  const td='style="border:1px solid #ccc;padding:4px 8px"',th='style="border:1px solid #ccc;padding:4px 8px;background:#f0f0f0;text-align:left"';
  let html=`<div style="font:14px/1.5 Arial,sans-serif;color:#222">${esc(sub(op.intro)).replace(/\n/g,"<br>")}<h3 style="margin:16px 0 6px">${esc(c.nombre)}${c.grupo?" · grupo "+esc(c.grupo):""}</h3><p style="margin:0 0 8px;color:#555">${esc(nomEst(e))}${i.n?" · N° "+esc(i.n):""}</p>`;
  let txt=sub(op.intro)+`\n\n${c.nombre}${c.grupo?" · grupo "+c.grupo:""}\n${nomEst(e)}${i.n?" · N° "+i.n:""}\n`;
  if(op.notas&&filas.length){html+=`<table style="border-collapse:collapse;font-size:13px"><tr><th ${th}>Calificación</th><th ${th}>Grupo</th><th ${th}>Fecha</th><th ${th}>Nota</th>${op.com?`<th ${th}>Comentario</th>`:""}</tr>${filas.map(f=>`<tr><td ${td}>${esc(f.t)}</td><td ${td}>${esc(f.g)}</td><td ${td}>${esc(f.f)}</td><td ${td}><b>${esc(f.v||"—")}</b>${f.v&&f.max!==E.max?"/"+f.max:""}</td>${op.com?`<td ${td}>${esc(f.c)}</td>`:""}</tr>`).join("")}</table>`;
    txt+="\nNotas:\n"+filas.map(f=>`- ${f.t}${f.g?" ("+f.g+")":""}: ${f.v||"—"}${f.c?" · "+f.c:""}`).join("\n")+"\n";
    if(R.grupos.length){html+=`<p>${R.grupos.map(x=>`${esc(x.g.nombre)} (${x.g.peso}%): <b>${x.prom==null?"—":redondea(x.prom,2).toFixed(2)}</b>`).join(" · ")}</p>`;txt+=R.grupos.map(x=>`${x.g.nombre} (${x.g.peso}%): ${x.prom==null?"—":redondea(x.prom,2).toFixed(2)}`).join(" · ")+"\n"}
    html+=`<p style="font-size:15px">Nota acumulada (sobre lo calificado hasta hoy): <b>${R.acum==null?"—":R.acum.toFixed(E.dec)}</b></p>`;txt+=`Nota acumulada: ${R.acum==null?"—":R.acum.toFixed(E.dec)}\n`}
  if(op.asis&&A.tot){const fal=A.L.filter(x=>x.v==="A").map(x=>fechaCorta(x.s.fecha));html+=`<p>Asistencia: <b>${A.pct}%</b> (${A.P} presente${A.P===1?"":"s"}${A.T?`, ${A.T} tarde`:""}${A.A?`, ${A.A} ausencia${A.A===1?"":"s"}`:""}${A.E?`, ${A.E} con excusa`:""})${fal.length?`<br><span style="color:#555">Ausencias: ${esc(fal.join(", "))}</span>`:""}</p>`;
    txt+=`\nAsistencia: ${A.pct}% (${A.P} P, ${A.T} T, ${A.A} A${A.E?`, ${A.E} E`:""})${fal.length?"\nAusencias: "+fal.join(", "):""}\n`}
  if(op.extra){html+=`<p>${esc(sub(op.extra)).replace(/\n/g,"<br>")}</p>`;txt+="\n"+sub(op.extra)+"\n"}
  if(S.gmail.firma){html+=`<p style="color:#555">${esc(S.gmail.firma).replace(/\n/g,"<br>")}</p>`;txt+="\n"+S.gmail.firma}
  html+=`<p style="font-size:11px;color:#999">Este mensaje contiene solo tu información. Si ves algún error, responde a este correo.</p></div>`;return{asunto:sub(op.asunto),html,texto:txt}}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1).toLowerCase();
// ---------------------------------------------------------------- ventana de envío
function opcionesCorreo(c,lista,unico){const g=S.gmail;
  dlg(unico?"✉️ Enviar resumen":"✉️ Enviar resúmenes a cada estudiante",`${!gmListo()?`<p class="small neg">Primero conecta Gmail en Datos › ✉️ Correo con Gmail.</p>`:""}
   ${unico?"":`<div class="small" style="max-height:180px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:6px"><label><input type="checkbox" id="cmAll" checked> <b>Todos con correo (${lista.filter(x=>x.e.correo).length})</b></label>${lista.map(x=>`<label style="display:block"><input type="checkbox" data-cme="${esc(x.e.id)}" ${x.e.correo?"checked":"disabled"}> ${esc(x.i.n)} ${esc(nomEst(x.e))} <span class="muted">${esc(x.e.correo||"sin correo")}</span></label>`).join("")}</div>`}
   <label>Asunto</label><input id="cmA" value="${esc(g.asunto)}" style="width:100%"><label>Mensaje (usa {nombre}, {curso}, {grupo}, {fecha})</label><textarea id="cmI" rows="4" style="width:100%">${esc(g.intro)}</textarea>
   <div class="filters"><label class="small" style="margin:0"><input type="checkbox" id="cmN" checked> Notas</label><label class="small" style="margin:0"><input type="checkbox" id="cmS" checked> Asistencia</label><label class="small" style="margin:0"><input type="checkbox" id="cmC" checked> Comentarios de cada nota</label></div>
   <label>Texto final (opcional)</label><textarea id="cmX" rows="2" style="width:100%"></textarea><div class="filters"><button class="b s" id="cmV">👁 Vista previa</button>${g.remitente?`<button class="b s" id="cmP">Probar: enviarme uno a mí</button>`:""}</div><div id="cmPrev"></div><div id="cmProg" class="small"></div>`,
   [["Cerrar","",cerrar],["Enviar","p",async()=>{await mandar(false)}]]);$("#dlg").classList.add("ancho");
  const op=()=>({asunto:$("#cmA").value,intro:$("#cmI").value,notas:$("#cmN").checked,asis:$("#cmS").checked,com:$("#cmC").checked,extra:$("#cmX").value});
  const elegidos=()=>unico?lista:lista.filter(x=>x.e.correo&&$(`[data-cme="${x.e.id}"]`)&&$(`[data-cme="${x.e.id}"]`).checked);
  if($("#cmAll"))$("#cmAll").onchange=()=>document.querySelectorAll("[data-cme]:not(:disabled)").forEach(x=>x.checked=$("#cmAll").checked);
  $("#cmV").onclick=()=>{const x=elegidos()[0]||lista[0];if(!x)return;const m=resumenEst(c,x.e,op());$("#cmPrev").innerHTML=`<div class="card" style="background:#fff;color:#222"><div class="small"><b>Para:</b> ${esc(x.e.correo)} · <b>Asunto:</b> ${esc(m.asunto)}</div><div style="max-height:340px;overflow:auto">${m.html}</div></div>`};
  if($("#cmP"))$("#cmP").onclick=()=>mandar(true);
  async function mandar(prueba){if(!gmListo()){alert("Conecta Gmail en Datos primero.");return}const L=prueba?[elegidos()[0]||lista[0]].filter(Boolean):elegidos();if(!L.length){alert("No hay estudiantes con correo seleccionados.");return}
    try{await permisoGmail()}catch(e){alert(e.message);return}
    if(!prueba&&!confirm(`¿Enviar ${L.length} correo${L.length>1?"s":""} desde tu Gmail? Cada estudiante recibe solo lo suyo.`))return;
    const o=op();g.asunto=o.asunto;g.intro=o.intro;changed();const P=$("#cmProg");let ok=0;const err=[];
    for(const x of L){const m=resumenEst(c,x.e,o);P.textContent=`Enviando ${ok+err.length+1} de ${L.length}: ${nomEst(x.e)}…`;
      try{await enviarGmail({para:prueba?g.remitente:x.e.correo,asunto:(prueba?"[PRUEBA] ":"")+m.asunto,html:m.html,texto:m.texto});ok++;if(!prueba)ponLista("bit",{id:uid(),est:x.e.id,cur:c.id,fecha:hoyISO(),texto:`✉️ Resumen enviado a ${x.e.correo}`})}
      catch(e){err.push(nomEst(x.e)+": "+e.message);if(/venció|permiso/.test(e.message))break}await new Promise(r=>setTimeout(r,350))}
    P.innerHTML=`✓ ${ok} enviado${ok===1?"":"s"}${prueba?" (prueba a tu correo)":""}${err.length?`<div class="neg">✗ ${err.map(esc).join("<br>")}</div>`:""}`;aviso(`✉️ ${ok} enviado${ok===1?"":"s"}${err.length?`, ${err.length} con error`:""}`)}}
window.enviarResumen=function(estId){const e=C.est.find(x=>x.id===estId);if(!e||!e.correo){alert("Este estudiante no tiene correo.");return}const I=C.ins.filter(i=>i.est===estId).map(i=>C.cur.find(c=>c.id===i.cur)).filter(Boolean);
  const c=I.find(x=>x.id===CUR.estCur)||I[0];if(!c){alert("No está en ningún curso.");return}opcionesCorreo(c,[{i:C.ins.find(i=>i.cur===c.id&&i.est===estId),e}],true)};
// ---------------------------------------------------------------- configuración en Datos
function pintarGm(){const b=$("#gmIn");if(!b)return;const g=S.gmail;
  b.innerHTML=`<p class="small muted">Para enviar a cada estudiante el resumen de sus notas y asistencia desde tu Gmail. Memphis solo pide permiso para <b>enviar</b> (no lee tu correo). El permiso dura una hora y no se guarda.</p>
   <label class="small">ID de cliente de Google (termina en .apps.googleusercontent.com)</label><input id="gmId" value="${esc(g.clientId)}" style="width:100%" autocomplete="off">
   <div class="g2c"><div><label class="small">Tu correo (remitente)</label><input id="gmR" value="${esc(g.remitente)}" type="email"></div><div><label class="small">Nombre que verán</label><input id="gmNo" value="${esc(g.nombre)}"></div></div>
   <label class="small">Firma</label><textarea id="gmF" rows="2" style="width:100%">${esc(g.firma)}</textarea>
   <div class="filters"><button class="b s p" id="gmG">Guardar</button><button class="b s" id="gmT" ${g.clientId&&g.remitente?"":"disabled"}>Enviarme un correo de prueba</button><span class="small" id="gmE"></span></div>
   <details><summary class="small">Dirección de retorno para Google Cloud</summary><code class="small">${esc(redirOAuth())}</code><div class="small muted">Origen autorizado: <code>${esc(location.origin)}</code></div></details>`;
  $("#gmG").onclick=()=>{const id=$("#gmId").value.trim();if(id&&!/\.apps\.googleusercontent\.com$/.test(id)){alert("El ID debe terminar en .apps.googleusercontent.com");return}Object.assign(g,{clientId:id,remitente:$("#gmR").value.trim(),nombre:$("#gmNo").value.trim(),firma:$("#gmF").value});changed();aviso("Guardado");pintarGm()};
  $("#gmT").onclick=async()=>{const E=$("#gmE");E.textContent="Abriendo Google…";try{await enviarGmail({para:g.remitente,asunto:"Prueba de Memphis ✉️",html:"<p>¡Funciona! Memphis ya puede enviar correos desde tu Gmail.</p>",texto:"¡Funciona! Memphis ya puede enviar correos desde tu Gmail."});E.innerHTML='<span class="pos">✓ Enviado: revisa tu bandeja</span>'}catch(e){E.innerHTML=`<span class="neg">✗ ${esc(e.message)}</span>`}}}
window.addEventListener("load",()=>{
  const vd=window.vDatos;if(typeof vd==="function")window.vDatos=function(){const r=vd.apply(this,arguments);const v=$("#view");if(v&&S&&!$("#gmCard")){const ref=$("#cxCard")||$("#pvCard");const h=`<div class="card" id="gmCard"><h2>✉️ Correo con Gmail</h2><div id="gmIn"></div></div>`;if(ref)ref.insertAdjacentHTML("afterend",h);else v.insertAdjacentHTML("beforeend",h);pintarGm()}return r};
  // botón en la lista del curso
  const vl=window.vLista;if(typeof vl==="function")window.vLista=function(c){return vl.apply(this,arguments).replace('<button class="b s" id="lExp">📤 Exportar</button>','<button class="b s" id="lExp">📤 Exportar</button><button class="b s" id="lMail">✉️ Enviar resúmenes</button>')};
  const bl=window.bindLista;if(typeof bl==="function")window.bindLista=function(c){const r=bl.apply(this,arguments);if($("#lMail"))$("#lMail").onclick=()=>opcionesCorreo(c,insDe(c.id),false);return r};
  const pb=window.pantallaBloqueo;if(typeof pb==="function")window.pantallaBloqueo=function(){GM.token="";GM.exp=0;return pb.apply(this,arguments)};
});
