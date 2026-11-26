// =====================================================================================================
// Memphis · CAPTURAS. Todo lo que llega de afuera cae primero en la 📥 Bandeja (cifrada y sincronizada) y desde ahí
// se manda con un toque al Diario, a Salud, a la Biblioteca o a Finanzas. Llega por:
//  · el menú Compartir del celular (Android, app instalada) · el marcador «Guardar en Memphis» del navegador
//  · tu bot de Telegram (texto, fotos, PDF, audios; se descargan al abrir la app) · pegar o escribir en la bandeja.
// También: botón «⏰ Any.do» que abre WhatsApp con el recordatorio ya escrito.
// =====================================================================================================
"use strict";
const ANYDO_NUM="13852122741"; // número público del asistente de Any.do en WhatsApp (editable en Datos)
const DE_BA={telegram:"✈️ Telegram",compartir:"📲 Compartido",marcador:"🔖 Navegador",manual:"✍️ Escrito",pegado:"📋 Pegado"};
function migrarBandeja(st,{ID,normA}){const s=(v,n)=>v==null?"":String(v).slice(0,n);
  st.bandeja=(Array.isArray(st.bandeja)?st.bandeja:[]).filter(x=>x&&typeof x==="object").map(x=>({id:ID.test(String(x.id))?String(x.id):uid(),de:DE_BA[x.de]?x.de:"manual",titulo:s(x.titulo,300),texto:s(x.texto,50000),
    url:/^https?:\/\//i.test(String(x.url||""))?s(x.url,2000):"",adjuntos:(Array.isArray(x.adjuntos)?x.adjuntos:[]).filter(a=>a&&typeof a==="object").map(normA).slice(0,50),
    fecha:RE_DT.test(String(x.fecha))?String(x.fecha):new Date().toISOString(),creado:RE_DT.test(String(x.creado))?String(x.creado):new Date().toISOString(),editado:RE_DT.test(String(x.editado))?String(x.editado):""})).slice(-2000);
  const t=st.telegram;st.telegram=t&&typeof t==="object"&&/^\d{5,15}:[\w-]{30,60}$/.test(String(t.token||""))?{token:String(t.token),chat:/^-?\d{1,20}$/.test(String(t.chat||""))?String(t.chat):"",bot:s(t.bot,64).replace(/[^\w]/g,""),nombre:s(t.nombre,100),offset:Math.max(0,Math.floor(+t.offset||0)),ult:RE_DT.test(String(t.ult||""))?String(t.ult):""}:null;
  const a=st.anydo&&typeof st.anydo==="object"?st.anydo:{};st.anydo={num:/^\d{8,15}$/.test(String(a.num||""))?String(a.num):ANYDO_NUM,plantilla:s(a.plantilla,400)||"Recordarme {titulo} el {fecha} a las {hora}"}}
const huellaBa=x=>JSON.stringify([x.titulo,x.texto,x.url,(x.adjuntos||[]).map(a=>a.sha).join(",")]);
MIGRAR_EXTRA.push(migrarBandeja);LISTAS_EXTRA.push({k:"bandeja",base:"_baseBa",hf:huellaBa,ord:(x,y)=>x.fecha.localeCompare(y.fecha)});CONFIG_EXTRA.push("anydo");

// ---------------------------------------------------------------- archivos → adjuntos cifrados (sin diálogos)
async function adjDeArchivo(f,fecha){f=await comprimirImagen(f);if(f.size>25*1048576)throw new Error(`${f.name}: pesa más de 25 MB`);
  const bytes=new Uint8Array(await f.arrayBuffer()),sha=await sha256(bytes);const prev=todosAdj().map(x=>x[1]).find(a=>a.sha===sha);
  const a={tipo:"archivo",sha,codigo:sha.slice(0,8),mime:/^[\w.+-]+\/[\w.+-]+$/.test(f.type)&&f.type!=="image/svg+xml"&&!/html|xml|javascript/i.test(f.type)?f.type:"application/octet-stream",tam:f.size,original:f.name||"archivo",tipoDoc:"Captura",fechaDoc:fecha||hoyISO(),savedAt:new Date().toISOString()};
  a.nombre=nombreAdj({fecha:a.fechaDoc,estab:"captura",concepto:"",desc:"",valor:0},a);if(prev){a.ruta=prev.ruta;a.enCarpeta=prev.enCarpeta}else{a.ruta=rutaAdj({},a);await guardarAdj(a,bytes)}return a}
async function aBandeja({de,titulo,texto,url,files,fecha,id}){const ah=new Date().toISOString(),adj=[];for(const f of files||[]){try{adj.push(await adjDeArchivo(f,diaLocal(fecha||ah)))}catch(e){aviso(e.message)}}
  const it={id:id||uid(),de:de||"manual",titulo:String(titulo||"").slice(0,300),texto:String(texto||"").slice(0,50000),url:/^https?:\/\//i.test(url||"")?url:"",adjuntos:adj,fecha:fecha||ah,creado:ah,editado:""};
  if((S.bandeja||[]).some(x=>x.id===it.id))return null;(S.bandeja=S.bandeja||[]).push(it);changed();pintaBadge();return it}
function pintaBadge(){const b=$("#btnBandeja");if(!b)return;const n=S&&S.bandeja?S.bandeja.length:0;b.textContent=n?`📥 ${n}`:"📥";b.classList.toggle("p",n>0)}

// ---------------------------------------------------------------- capturas que llegan antes de desbloquear (compartir / marcador)
async function guardaPend(item){if(!DB.db)try{await DB.open()}catch(e){}const L=(await DB.get("capPend"))||[];L.push(item);await DB.set("capPend",L.slice(-100))}
async function leerParametroCap(){const q=new URLSearchParams(location.search);const c=q.get("cap");if(!c&&!q.has("compartido"))return;
  if(c){try{const d=JSON.parse(c);await guardaPend({de:"marcador",titulo:String(d.t||"").slice(0,300),texto:String(d.s||"").slice(0,20000),url:String(d.u||"").slice(0,2000),files:[],t:Date.now()})}catch(e){}}
  history.replaceState(null,"",location.pathname)}
async function procesarPendientes(){const L=(await DB.get("capPend"))||[];if(!L.length||!S)return 0;let n=0;
  for(const p of L){const files=(p.files||[]).map(x=>x.blob instanceof Blob?new File([x.blob],x.name||"archivo",{type:x.type||x.blob.type}):null).filter(Boolean);
    const txt=[p.texto,p.url&&!String(p.texto||"").includes(p.url)?p.url:""].filter(Boolean).join("\n");
    if(await aBandeja({de:p.de,titulo:p.titulo,texto:txt,url:p.url||((txt.match(/https?:\/\/\S+/)||[])[0]||""),files,fecha:new Date(p.t||Date.now()).toISOString()}))n++}
  await DB.del("capPend");if(n)aviso(`📥 ${n} captura${n>1?"s":""} nueva${n>1?"s":""} en la bandeja`);return n}
function marcadorJS(){const base=location.origin+location.pathname;return`javascript:(()=>{const d={t:document.title,u:location.href,s:String(getSelection()).slice(0,4000)};window.open('${base}?cap='+encodeURIComponent(JSON.stringify(d)),'_blank')})()`}

// ---------------------------------------------------------------- bot de Telegram (sin servidor: la app lo consulta al abrirse)
const TG={ocupado:false,t:null};
async function tgApi(token,met,params){const r=await fetch(`https://api.telegram.org/bot${token}/${met}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(params||{})});
  let j=null;try{j=await r.json()}catch(e){}if(!j||!j.ok)throw new Error(j&&j.description?"Telegram: "+j.description:"Telegram no respondió ("+r.status+")");return j.result}
function nombreOrigen(m){const o=m.forward_origin;if(o){if(o.sender_user)return[o.sender_user.first_name,o.sender_user.last_name].filter(Boolean).join(" ");if(o.sender_user_name)return o.sender_user_name;if(o.chat)return o.chat.title||o.chat.username;if(o.sender_chat)return o.sender_chat.title}
  if(m.forward_from)return[m.forward_from.first_name,m.forward_from.last_name].filter(Boolean).join(" ");if(m.forward_sender_name)return m.forward_sender_name;return""}
async function tgArchivo(token,fid,nombre,mime){const f=await tgApi(token,"getFile",{file_id:fid});if(!f.file_path)throw new Error("Archivo no disponible");
  const X=S&&S.calext;const r=X&&X.proxy&&X.clave?await fetch(X.proxy.replace(/\/+$/,"")+"/tg/"+f.file_path,{headers:{"X-Memphis-Clave":X.clave,"X-Memphis-Bot":token}}):await fetch(`https://api.telegram.org/file/bot${token}/${f.file_path}`);if(!r.ok)throw new Error("No se pudo bajar el archivo");const b=await r.blob();
  return new File([b],nombre||f.file_path.split("/").pop(),{type:mime||b.type||"application/octet-stream"})}
async function revisarTelegram(manual){const T=S&&S.telegram;if(!T||!T.token||!T.chat||TG.ocupado||navigator.onLine===false)return;TG.ocupado=true;let n=0,err="";
  try{const U=await tgApi(T.token,"getUpdates",{offset:T.offset||0,timeout:0,allowed_updates:["message"]});let max=T.offset?T.offset-1:0;const grupos=new Map();
    for(const u of U){max=Math.max(max,u.update_id);const m=u.message;if(!m||String(m.chat.id)!==T.chat)continue;const k=m.media_group_id?"g"+m.media_group_id:"m"+m.message_id;
      if(!grupos.has(k))grupos.set(k,{id:"tg_"+T.chat.replace("-","n")+"_"+m.message_id,msgs:[],fecha:new Date(m.date*1000).toISOString()});grupos.get(k).msgs.push(m)}
    for(const g of grupos.values()){const files=[],txt=[];let url="";
      for(const m of g.msgs){const de=nombreOrigen(m);if(de&&!txt.some(t=>t.startsWith("↪️")))txt.push(`↪️ Reenviado de ${de}`);const t=m.text||m.caption||"";if(t)txt.push(t);
        for(const e of [...(m.entities||[]),...(m.caption_entities||[])])if(!url&&(e.type==="url"||e.type==="text_link"))url=e.url||t.substr(e.offset,e.length);
        try{if(m.photo&&m.photo.length){const p=m.photo[m.photo.length-1];files.push(await tgArchivo(T.token,p.file_id,`foto_${m.message_id}.jpg`,"image/jpeg"))}
          for(const [x,def] of [[m.document,"documento"],[m.voice,"nota_de_voz.ogg"],[m.audio,"audio"],[m.video,"video.mp4"],[m.video_note,"video.mp4"]])if(x){if(x.file_size>20*1048576){txt.push(`(Archivo de más de 20 MB que Telegram no deja descargar: ${x.file_name||def})`);continue}files.push(await tgArchivo(T.token,x.file_id,x.file_name||def,x.mime_type))}}
        catch(e){const sinCors=/fetch|network|load failed/i.test(e.message);txt.push(sinCors?"(📎 Este mensaje traía un adjunto que se quedó en Telegram: Telegram no deja que una página web descargue archivos. Compártelo directo con Memphis desde el celular, o configura el intermediario en Datos › 🗓️ Calendarios)":`(No se pudo bajar un adjunto: ${e.message})`);if(sinCors)TG.sinAdj=(TG.sinAdj||0)+1}}
      if(await aBandeja({id:g.id,de:"telegram",titulo:"",texto:txt.join("\n"),url,files,fecha:g.fecha}))n++}
    if(U.length){T.offset=max+1;T.ult=new Date().toISOString();changed();await tgApi(T.token,"getUpdates",{offset:T.offset,timeout:0,limit:1}).catch(()=>{})}
    if(n)await tgApi(T.token,"sendMessage",{chat_id:T.chat,text:`✔ ${n} ${n>1?"capturas recibidas":"captura recibida"} en Memphis`+(TG.sinAdj?`\n⚠️ ${TG.sinAdj} adjunto${TG.sinAdj>1?"s":""} no se ${TG.sinAdj>1?"pudieron":"pudo"} traer (Telegram no deja descargarlos desde una página web). Para fotos y archivos usa «Compartir › Memphis» en el celular.`:""),disable_notification:true}).catch(()=>{});TG.sinAdj=0}
  catch(e){err=e.message}finally{TG.ocupado=false}
  if(n)aviso(`📥 ${n} desde Telegram`);else if(manual)aviso(err||"Telegram: nada nuevo");if(err&&manual)alert(err+(/Failed to fetch|NetworkError|Load failed/i.test(err)?"\n\n(El navegador no pudo llegar a Telegram: revisa la conexión.)":""));return n}
function conectarTelegram(){const T=S.telegram;
  dlg("✈️ Conectar tu bot de Telegram",`${T&&T.chat?`<p class="small">✓ Conectado a <b>@${esc(T.bot)}</b> para ${esc(T.nombre)}. Última revisión: ${T.ult?esc(tsBonito(T.ult)):"—"}.</p>`:""}
    <ol class="small"><li>En Telegram abre <b>@BotFather</b> › <code>/newbot</code> › nombre › usuario terminado en <code>bot</code>.</li><li>Copia el <b>token</b> que te da y pégalo aquí (queda cifrado con tu clave).</li><li>Abre tu bot, toca <b>Iniciar</b> y escríbele «hola».</li><li>Toca <b>Conectar</b>: tu cuenta queda como la única autorizada.</li></ol>
    <input id="tgK" type="password" placeholder="123456789:AA…" autocomplete="off" style="width:100%" value="${T?esc(T.token):""}"><div id="tgE" class="small"></div>
    <p class="small muted">Lo que mandes al bot pasa por los servidores de Telegram (los chats con bots no tienen cifrado de extremo a extremo) y Telegram lo guarda unas 24 horas hasta que abras Memphis.</p>`,
   [...(T?[["Desconectar","",()=>{if(!confirm("¿Desconectar el bot? Lo que esté en Telegram sin bajar se queda allá."))return;S.telegram=null;changed();cerrar();render()}],["Revisar ahora","",()=>revisarTelegram(true)]]:[]),["Cancelar","",cerrar],["Conectar","p",async()=>{
     const tok=$("#tgK").value.trim(),E=$("#tgE");if(!/^\d{5,15}:[\w-]{30,60}$/.test(tok)){E.innerHTML='<span class="neg">Ese no parece un token de bot (se ve así: 123456789:AA…).</span>';return}
     E.textContent="Probando…";try{const me=await tgApi(tok,"getMe");const U=await tgApi(tok,"getUpdates",{timeout:0,allowed_updates:["message"]});const pm=U.map(u=>u.message).filter(m=>m&&m.chat&&m.chat.type==="private").pop();
       if(!pm){E.innerHTML=`El bot <b>@${esc(me.username)}</b> funciona, pero no encuentro tu mensaje. Abre <b>t.me/${esc(me.username)}</b>, toca Iniciar, escríbele «hola» y vuelve a tocar Conectar.`;return}
       const off=Math.max(...U.map(u=>u.update_id))+1;S.telegram={token:tok,chat:String(pm.chat.id),bot:me.username,nombre:[pm.from.first_name,pm.from.last_name].filter(Boolean).join(" "),offset:off,ult:new Date().toISOString()};changed();
       await tgApi(tok,"getUpdates",{offset:off,timeout:0,limit:1}).catch(()=>{});await tgApi(tok,"sendMessage",{chat_id:pm.chat.id,text:"✅ Conectado a Memphis. Lo que me mandes (texto, fotos, PDF, audios, enlaces) llegará a tu bandeja cuando abras la app."}).catch(()=>{});
       cerrar();aviso("✈️ Telegram conectado");render()}catch(e){E.innerHTML=`<span class="neg">${esc(e.message)}</span>`}}]])}
setInterval(()=>{if(S&&S.telegram&&!document.hidden)revisarTelegram()},120000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&S&&S.telegram)setTimeout(revisarTelegram,1500)});

// ---------------------------------------------------------------- Any.do por WhatsApp
const fechaLargaCorta=f=>{const d=dDe(f);return`${d.getDate()} de ${MESL[d.getMonth()].toLowerCase()}${f.slice(0,4)!==hoyISO().slice(0,4)?" de "+f.slice(0,4):""}`};
function mensajeAnydo({titulo,fecha,hora,extra}){const p=(S.anydo&&S.anydo.plantilla)||"Recordarme {titulo} el {fecha} a las {hora}";
  let t=p.replace("{titulo}",titulo||"").replace("{fecha}",fecha?(fecha===hoyISO()?"hoy":fecha===masDias(hoyISO(),1)?"mañana":fechaLargaCorta(fecha)):"").replace("{hora}",hora||"");
  if(!hora)t=t.replace(/\s*(a las|a la|at)\s*$/i,"").replace(/\s*(a las|a la)\s*(?=[.,;]|$)/i,"");if(!fecha)t=t.replace(/\s+el\s*(?=\s|$)/,"");return(t.replace(/\s+/g," ").trim()+(extra?" "+extra:"")).trim()}
function abrirAnydo(datos){const num=(S.anydo&&S.anydo.num)||ANYDO_NUM;const t=mensajeAnydo(datos);window.open(`https://wa.me/${num}?text=${encodeURIComponent(t)}`,"_blank","noopener,noreferrer")}
const anydoDe={s:r=>({titulo:`${r.titulo}${r.personas.length?" ("+r.personas.map(nomPer).join(", ")+")":""}${r.lugar?" en "+r.lugar:""}`,fecha:r.fecha,hora:r.hora}),
  d:e=>({titulo:`${e.titulo||"evento"}${e.lugar?" en "+e.lugar:""}`,fecha:e.fecha,hora:e.todoDia?"":e.hora}),
  med:(r,m)=>{const pd=proxDosis(m,r);const [f,h]=pd?[pd.startsWith("hoy")?hoyISO():"",pd.split(" ").pop()]:[m.desde||r.fecha,m.hora];return{titulo:`dar ${m.n}${m.dosis?" "+m.dosis:""} a ${r.personas.map(nomPer).join(", ")}`,fecha:f||m.desde||r.fecha,hora:h,extra:m.cadaH?`y repetir cada ${m.cadaH} horas${m.dias?" durante "+m.dias+" días":""}`:""}}};

// ---------------------------------------------------------------- la bandeja
function sugerirDestino(x){const t=[x.titulo,x.texto].join(" ");const ls=typeof leerSalud==="function"?leerSalud(t):null,r=leerCuando(t,hoyISO(),{modo:modoTexto(t,"futuro")});
  if(ls&&(ls.sintomas.length||ls.tipo==="cita"||ls.tipo==="medicamento"||ls.tipo==="vacuna")&&ls.personas.length)return"salud";
  if(/\$\s?\d|\d{1,3}(\.\d{3})+\s*(pesos|cop)?/i.test(t)&&/pag|compr|gast|factura|recibo|cuenta de cobro/i.test(t))return"gasto";
  if(r.encontrado&&r.fecha>=hoyISO()&&!/^https?:\/\//.test(x.texto.trim()))return"evento";
  if(x.url||/doi\.org|10\.\d{4,}\//i.test(t)||(x.adjuntos||[]).some(a=>/pdf/.test(a.mime)))return"biblio";return"nota"}
const DESTINOS=[["nota","📓 Nota"],["evento","📅 Evento"],["salud","🩺 Salud"],["biblio","📚 Biblioteca"],["gasto","💰 Gasto"]];
function verBandeja(){const L=(S.bandeja||[]).slice().sort((a,b)=>b.fecha.localeCompare(a.fecha));
  dlg(`📥 Bandeja${L.length?" · "+L.length:""}`,`<div class="card bacap"><textarea id="baT" rows="2" placeholder="Escribe o pega aquí (texto, enlaces, capturas de pantalla, archivos)…" style="min-height:60px"></textarea>
     <div class="filters" style="margin:6px 0 0"><button class="b s" id="baA">📎 Archivos</button><span class="sp"></span><button class="b s p" id="baG">A la bandeja</button></div></div>
    ${L.length?L.map(x=>{const sug=sugerirDestino(x),ex=(x.texto||"").trim();return`<div class="it bait" data-ba="${esc(x.id)}"><div class="ih"><span class="small muted">${DE_BA[x.de]||""} · ${esc(tsBonito(x.fecha))}</span></div>
      ${x.titulo?`<b>${esc(x.titulo)}</b>`:""}${ex?`<div class="ex">${md(ex.slice(0,1200))}</div>`:""}${x.url&&!ex.includes(x.url)?`<div class="small"><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.url.slice(0,80))}</a></div>`:""}${galeria(x,{chico:true})}
      <div class="filters" style="margin:6px 0 0">${DESTINOS.filter(([k])=>k!=="biblio"||typeof crearBiblioDesde==="function").map(([k,l])=>`<button class="b s ${k===sug?"p":""}" data-bd="${k}" data-bi="${esc(x.id)}">${l}</button>`).join("")}<span class="sp"></span><button class="b s" data-bx="${esc(x.id)}" title="Descartar">🗑️</button></div></div>`}).join(""):'<p class="muted small">La bandeja está vacía. Aquí llega lo que compartes desde el celular, lo que guardas con el marcador del navegador y lo que le mandas a tu bot de Telegram.</p>'}`,
   [...(S.telegram?[["✈️ Revisar Telegram","",async()=>{await revisarTelegram(true);verBandeja()}]]:[]),["Cerrar","",cerrar]]);$("#dlg").classList.add("ancho");
  const T=$("#baT");T.addEventListener("paste",async ev=>{const fs=[...((ev.clipboardData&&ev.clipboardData.files)||[])];if(!fs.length)return;ev.preventDefault();await aBandeja({de:"pegado",texto:T.value,files:fs.map((f,i)=>new File([f],f.name&&f.name!=="image.png"?f.name:`captura_${fISO(new Date())}_${ahoraHM().replace(":","")}${i?"_"+i:""}.${(f.type.split("/")[1]||"png").replace("jpeg","jpg")}`,{type:f.type}))});verBandeja()});
  $("#baG").onclick=async()=>{const v=T.value.trim();if(!v)return;await aBandeja({de:"manual",texto:v,url:(v.match(/https?:\/\/\S+/)||[])[0]||""});verBandeja()};
  $("#baA").onclick=()=>{const i=document.createElement("input");i.type="file";i.multiple=true;i.onchange=async()=>{await aBandeja({de:"manual",texto:T.value,files:[...i.files]});verBandeja()};i.click()};
  bindItems($("#dlgB"));
  document.querySelectorAll("[data-bx]").forEach(b=>b.onclick=()=>{const x=S.bandeja.find(y=>y.id===b.dataset.bx);quitarBa(x.id);verBandeja();deshacer("Descartado",()=>{S.bandeja.push(x);changed();pintaBadge();verBandeja()})});
  document.querySelectorAll("[data-bd]").forEach(b=>b.onclick=()=>enviarBa(b.dataset.bi,b.dataset.bd))}
function quitarBa(id){S.bandeja=(S.bandeja||[]).filter(y=>y.id!==id);(S.eliminados=S.eliminados||[]).push({id,fecha:new Date().toISOString()});changed();pintaBadge()}
// al abrir un editor desde la bandeja: si al cerrar aparece un registro nuevo, la captura sale de la bandeja
let BA_EN={id:null,antes:null};
const idsActuales=()=>new Set([...S.mov.map(x=>"m:"+x.id),...(S.diario||[]).map(x=>"d:"+x.id),...(S.salud||[]).map(x=>"s:"+x.id),...(S.biblio||[]).map(x=>"b:"+x.id)]);
function enviarBa(id,dest){const x=(S.bandeja||[]).find(y=>y.id===id);if(!x)return;const t=[x.titulo,x.texto].filter(Boolean).join("\n").trim(),fecha=diaLocal(x.fecha);
  if(dest==="nota"){const r=leerCuando(t,fecha,{modo:"pasado"});const e={id:uid(),tipo:"nota",titulo:x.titulo||"",texto:x.texto||x.url,fecha:r.fecha&&r.fecha<=hoyISO()?r.fecha:fecha,hora:x.fecha.slice(11,16)?new Date(x.fecha).toTimeString().slice(0,5):"",horaFin:"",fechaFin:"",todoDia:false,lugar:typeof lugarEn==="function"&&lugarEn(t)?lugarEn(t).nombre:"",alertas:[],adjuntos:x.adjuntos.slice(),enlaces:x.url?[{url:x.url,titulo:x.titulo||"",modo:"titulo",captura:""}]:[],creado:new Date().toISOString(),editado:"",fijado:false,versiones:[],cap:{de:String(x.de||"bandeja").slice(0,20),clas:false}};
    (S.diario=S.diario||[]).push(e);asegurarFichas(e.titulo+" "+e.texto);quitarBa(id);aviso("📓 Guardado como nota del "+e.fecha);verBandeja();return}
  BA_EN={id,antes:idsActuales()};
  if(dest==="evento"){const r=leerCuando(t,hoyISO(),{modo:"futuro"});editarD(null,{tipo:"evento",titulo:r.titulo||x.titulo||t.slice(0,120),texto:x.texto,fecha:r.fecha||hoyISO(),hora:r.hora,horaFin:r.horaFin,fechaFin:r.fechaFin,lugar:typeof lugarEn==="function"&&lugarEn(t)?lugarEn(t).nombre:""});ADJ.push(...x.adjuntos);pintaAdjD()}
  else if(dest==="salud"){const p=leerSalud(t);editarS(null,{tipo:p.tipo,titulo:p.r.titulo||t.slice(0,120),texto:x.texto,fecha:p.r.fecha||fecha,hora:p.r.hora,fechaFin:p.r.fechaFin,personas:p.personas,sintomas:p.sintomas,lugar:p.lugar,medidas:p.temp?{temp:p.temp}:{}});ADJ.push(...x.adjuntos);pintaAdjD()}
  else if(dest==="biblio"&&typeof crearBiblioDesde==="function")crearBiblioDesde(x);
  else if(dest==="gasto"){editar(null);const v=(t.match(/\$\s?([\d.,]+)/)||t.match(/(\d{1,3}(?:\.\d{3})+)/)||[])[1];if($("#eD"))$("#eD").value=t.split("\n")[0].slice(0,120);if(v&&$("#eV"))$("#eV").value=String(v).replace(/[.,](\d{3})/g,"$1").replace(",",".");if($("#eF"))$("#eF").value=fecha;ADJ.push(...x.adjuntos);if(typeof pintaAdj==="function")pintaAdj()}}
// cuando el editor abierto desde la bandeja se cierra: si apareció un registro nuevo, la captura sale de la bandeja
function revisarFinBandeja(){if(!BA_EN.id||!S)return;if($("#dlg").open){setTimeout(revisarFinBandeja,400);return}const nuevos=[...idsActuales()].filter(k=>!BA_EN.antes.has(k));const id=BA_EN.id;BA_EN={id:null,antes:null};
  if(nuevos.length){quitarBa(id);aviso("✓ Captura guardada y sacada de la bandeja")}}
setInterval(()=>{if(BA_EN.id)revisarFinBandeja()},700);

// ---------------------------------------------------------------- tarjeta en Datos
function capturasCard(){const T=S.telegram,A=S.anydo||{};const enApp=window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches;
  return`<div class="card" id="capCard"><h2>📥 Capturas, Telegram y Any.do</h2>
   <p class="small"><b>Celular (Android):</b> ${enApp?"✓ la app está instalada: al compartir desde WhatsApp, la galería o el navegador elige «Memphis».":"instala la app (menú del navegador › Instalar / Agregar a pantalla de inicio) y aparecerá «Memphis» en el menú Compartir."} En iPhone usa el bot de Telegram.</p>
   <p class="small"><b>Navegador del PC:</b> arrastra este botón a tu barra de marcadores; en cualquier página tócalo (con texto seleccionado si quieres) y queda en la bandeja: <a class="b s" id="capMk" href="#">🔖 Guardar en Memphis</a> <button class="b s" id="capMkC">Copiar el código</button></p>
   <p class="small"><b>Telegram:</b> ${T&&T.chat?`✓ @${esc(T.bot)} conectado · última revisión ${T.ult?esc(tsBonito(T.ult)):"—"}`:"sin conectar"} <button class="b s" id="capTg">${T?"Ajustes del bot":"Conectar bot"}</button>${T?` <button class="b s" id="capTgR">Revisar ahora</button>`:""}</p>
   <p class="small"><b>Any.do por WhatsApp:</b> número <input id="adN" value="${esc(A.num||ANYDO_NUM)}" style="width:130px"> plantilla <input id="adP" value="${esc(A.plantilla||"")}" style="width:min(380px,90%)"> <button class="b s" id="adG">Guardar</button> <button class="b s" id="adT">Probar</button><br><span class="muted">Usa {titulo}, {fecha} y {hora}. El botón «⏰ Any.do» aparece en citas, eventos, medicamentos y vencimientos: abre WhatsApp con el mensaje listo y tú tocas Enviar.</span></p></div>`}
function bindCapturas(){const mk=$("#capMk");if(!mk)return;mk.setAttribute("href",marcadorJS());mk.onclick=ev=>{ev.preventDefault();alert("Arrástralo a la barra de marcadores (no lo toques aquí).")};
  $("#capMkC").onclick=async()=>{try{await navigator.clipboard.writeText(marcadorJS());aviso("Código copiado: crea un marcador nuevo y pégalo como dirección")}catch(e){prompt("Copia este código y pégalo como dirección de un marcador:",marcadorJS())}};
  $("#capTg").onclick=conectarTelegram;if($("#capTgR"))$("#capTgR").onclick=()=>revisarTelegram(true);
  $("#adG").onclick=()=>{const n=$("#adN").value.replace(/\D/g,"");if(n.length<8){alert("Número inválido");return}S.anydo={num:n,plantilla:$("#adP").value.trim()||"Recordarme {titulo} el {fecha} a las {hora}"};changed();aviso("Any.do guardado")};
  $("#adT").onclick=()=>abrirAnydo({titulo:"probar Memphis",fecha:masDias(hoyISO(),1),hora:"09:00"})}

// ---------------------------------------------------------------- enganches con el resto de la app
window.addEventListener("load",()=>{
  leerParametroCap();
  const ev=window.vDatos;if(typeof ev==="function")window.vDatos=function(...a){const r=ev.apply(this,a);const v=$("#view");if(v&&S){v.insertAdjacentHTML("beforeend",capturasCard());bindCapturas()}return r};
  const db=window.desbloqueado;if(typeof db==="function")window.desbloqueado=function(...a){const r=db.apply(this,a);setTimeout(async()=>{if(!S)return;const n=await procesarPendientes();pintaBadge();if(S.telegram)await revisarTelegram();if(n||new URLSearchParams(location.search).has("compartido"))verBandeja()},900);return r};
  const b=$("#btnBandeja");if(b)b.onclick=()=>{if(S)verBandeja()};
  // botones «⏰ Any.do» en citas, eventos y medicamentos
  const vs=window.verS;if(typeof vs==="function")window.verS=function(id,...a){const r=vs.call(this,id,...a);const x=(S.salud||[]).find(y=>y.id===id);if(x&&$("#dlg").open){const f=$("#dlgF"),bt=document.createElement("button");bt.className="b";bt.textContent="⏰ Any.do";bt.onclick=()=>abrirAnydo(anydoDe.s(x));f.insertBefore(bt,f.firstChild);
      $("#dlgB").querySelectorAll("[data-mics]").forEach(m=>{const k=document.createElement("button");k.className="b s";k.textContent="Any.do";k.onclick=()=>abrirAnydo(anydoDe.med(x,x.meds[+m.dataset.mics]));m.after(k)})}return r};
  const vd=window.verD;if(typeof vd==="function")window.verD=function(id,...a){const r=vd.call(this,id,...a);const e=(S.diario||[]).find(y=>y.id===id);if(e&&e.tipo==="evento"&&$("#dlg").open){const f=$("#dlgF"),bt=document.createElement("button");bt.className="b";bt.textContent="⏰ Any.do";bt.onclick=()=>abrirAnydo(anydoDe.d(e));f.insertBefore(bt,f.firstChild)}return r};
  const evv=window.editarV;if(typeof evv==="function")window.editarV=function(id,...a){const r=evv.call(this,id,...a);const v=id&&(S.venc||[]).find(y=>y.id===id);if(v&&$("#dlg").open){const f=$("#dlgF"),bt=document.createElement("button");bt.className="b";bt.textContent="⏰ Any.do";bt.onclick=()=>abrirAnydo({titulo:`revisar ${v.tipo.toLowerCase()} de ${v.titulo} (vence)`,fecha:masDias(v.vence,-(+v.avisar||7)),hora:"09:00"});f.insertBefore(bt,f.firstChild)}return r};
});
