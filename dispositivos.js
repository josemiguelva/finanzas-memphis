// =====================================================================================================
// Memphis · 💻 MIS DISPOSITIVOS DE CONFIANZA. Cada celular, navegador o computador donde abres Memphis queda en una
// lista (cifrada, viaja con tus datos) con su propia regla: cada cuánto pide huella/PIN y tras cuánto se bloquea.
// · Un dispositivo «recordado» abre directo; pide huella o PIN según su regla (por defecto: la primera vez del día).
// · Las reglas se cambian desde cualquier dispositivo y se aplican en el otro la próxima vez que se abra.
// · «Revocar» hace que ese dispositivo olvide la clave la próxima vez que se abra y vuelva a pedirla.
// · Apertura rápida: la llave ya calculada se guarda protegida por el navegador (no exportable).
// =====================================================================================================
"use strict";
const VERIF={dia:"La primera vez de cada día",h12:"Cada 12 horas",d7:"Cada 7 días",siempre:"Cada vez que se abre",nunca:"Nunca (abre directo)"};
const BLOQ=[[0,"Nunca (solo con 🔒)"],[5,"5 min sin uso"],[10,"10 min"],[30,"30 min"],[60,"1 hora"],[240,"4 horas"],[1440,"1 día"]];
const huellaDi=d=>JSON.stringify([d.nombre,d.verif,d.bloqueo,d.metodo,d.revocado,d.ult,d.recordado,d.editado]);
LISTAS_EXTRA.push({k:"disp",base:"_baseDi",hf:huellaDi,ord:(a,b)=>a.creado.localeCompare(b.creado)});
MIGRAR_EXTRA.push(st=>{const ok=t=>/^\d{4}-\d\d-\d\dT/.test(String(t||""))?String(t):"";
  st.disp=(Array.isArray(st.disp)?st.disp:[]).filter(d=>d&&/^[\w-]{6,40}$/.test(String(d.id||""))).map(d=>({id:String(d.id),nombre:String(d.nombre||"Dispositivo").slice(0,80),tipo:["cel","tablet","pc"].includes(d.tipo)?d.tipo:"pc",
    verif:VERIF[d.verif]?d.verif:"dia",bloqueo:BLOQ.some(b=>b[0]===+d.bloqueo)?+d.bloqueo:60,metodo:d.metodo==="pin"?"pin":"huella",revocado:d.revocado===true,recordado:d.recordado===true,
    creado:ok(d.creado)||new Date().toISOString(),ult:ok(d.ult),editado:ok(d.editado)}));
  if(!st._baseDi||typeof st._baseDi!=="object")st._baseDi={}});
// ---------------------------------------------------------------- este dispositivo
function idDisp(){let id="";try{id=localStorage.getItem("memphisDispId")||""}catch(e){}if(!/^[\w-]{6,40}$/.test(id)){id="d"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);try{localStorage.setItem("memphisDispId",id)}catch(e){}}return id}
function describirDisp(){const u=navigator.userAgent,ipad=/iPad/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1),tel=/Android.*Mobile|iPhone/.test(u),tipo=ipad||/Android/.test(u)&&!/Mobile/.test(u)?"tablet":tel?"cel":"pc";
  const so=ipad?"iPad":/iPhone/.test(u)?"iPhone":/Android/.test(u)?"Android":/Windows/.test(u)?"Windows":/CrOS/.test(u)?"ChromeOS":/Mac OS X/.test(u)?"Mac":/Linux/.test(u)?"Linux":"Otro";
  const nav=navigator.brave?"Brave":/Edg\//.test(u)?"Edge":/OPR\//.test(u)?"Opera":/Firefox\//.test(u)?"Firefox":/CriOS|Chrome\//.test(u)?"Chrome":/Safari\//.test(u)?"Safari":"Navegador";
  const app=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;return{tipo,nombre:`${nav} · ${so}${app?" · app instalada":""}`}}
const polLocal=()=>{try{return JSON.parse(localStorage.getItem("memphisDispPol")||"null")}catch(e){return null}};
const ponPolLocal=d=>{try{localStorage.setItem("memphisDispPol",JSON.stringify({verif:d.verif,bloqueo:d.bloqueo,metodo:d.metodo,recordado:d.recordado}))}catch(e){}};
function miDisp(){return(S&&S.disp||[]).find(d=>d.id===idDisp())}
async function registrarDisp(){if(!S)return;S.disp=S.disp||[];const id=idDisp(),ah=new Date().toISOString(),rec=!!(await recLeer());let d=S.disp.find(x=>x.id===id);
  if(d&&d.revocado){await DB.del("recuerdo");try{localStorage.removeItem("memphisDispPol");localStorage.removeItem("memphisVerif")}catch(e){}S.disp=S.disp.filter(x=>x.id!==id);changed();await persist();
    alert("Este dispositivo fue revocado desde otro equipo: olvidé la clave guardada aquí. La próxima vez tendrás que escribirla.");bloquear();return}
  if(!d){const x=describirDisp();d={id,nombre:x.nombre,tipo:x.tipo,verif:"dia",bloqueo:x.tipo==="cel"?0:x.tipo==="tablet"?30:60,metodo:"huella",revocado:false,recordado:rec,creado:ah,ult:ah,editado:ah};S.disp.push(d);changed()}
  else{const viejo=Date.now()-new Date(d.ult||0).getTime()>3600e3;if(viejo||d.recordado!==rec){d.ult=ah;d.recordado=rec;d.editado=ah;changed()}}ponPolLocal(d)}
// minutos de bloqueo de este dispositivo (los no recordados siguen la regla general)
function bloqueoDisp(){const p=polLocal();if(p&&p.recordado&&Number.isFinite(+p.bloqueo))return+p.bloqueo;return S&&S.bloqueoMin||10}
// ¿toca pedir huella/PIN al abrir?
function tocaVerificar(){const p=polLocal()||{verif:"dia"},v=p.verif||"dia";if(v==="nunca")return false;if(v==="siempre")return true;let u="";try{u=localStorage.getItem("memphisVerif")||""}catch(e){}if(!u)return true;
  const t=new Date(u).getTime();if(v==="dia")return diaLocal(u)!==hoyISO();if(v==="h12")return Date.now()-t>12*3600e3;if(v==="d7")return Date.now()-t>7*864e5;return true}
const marcaVerif=()=>{try{localStorage.setItem("memphisVerif",new Date().toISOString())}catch(e){}};
async function hashPin(pin,salt){const k=await crypto.subtle.importKey("raw",enc.encode(pin),"PBKDF2",false,["deriveBits"]);return u8b64(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:150000},k,256)))}
function pedirPinRapido(){return new Promise(ok=>{const d=document.createElement("dialog");d.id="pinRap";d.innerHTML=`<form method="dialog" style="min-width:250px"><h3 style="margin-top:0">🔢 Tu PIN de este dispositivo</h3><input id="prI" type="password" inputmode="numeric" autocomplete="off" maxlength="8" style="width:100%;font-size:1.4rem;letter-spacing:.4em;text-align:center"><div class="filters" style="margin-top:10px"><button class="b" value="no">Usar la clave</button><button class="b p" value="si">Abrir</button></div></form>`;
  document.body.appendChild(d);d.addEventListener("close",()=>{const v=d.returnValue==="si"?d.querySelector("#prI").value:null;d.remove();ok(v)});d.showModal();setTimeout(()=>d.querySelector("#prI").focus(),30)})}
// la usa recAbrir (recordar.js) antes de descifrar la clave guardada
async function verificarDisp(r){if(!tocaVerificar())return;const p=polLocal()||{};
  if(p.metodo==="pin"&&r.pinH){for(let i=(r.pinFallos||0);i<5;i++){const v=await pedirPinRapido();if(v===null)throw Object.assign(new Error("Escribe tu clave."),{name:"NotAllowedError"});
      if(await hashPin(v,b64u8(r.pinS))===r.pinH){if(r.pinFallos){r.pinFallos=0;await DB.set("recuerdo",r)}marcaVerif();return}r.pinFallos=(r.pinFallos||0)+1;await DB.set("recuerdo",r);aviso(`PIN incorrecto (${r.pinFallos} de 5)`)}
    await DB.del("recuerdo");throw new Error("Demasiados intentos: olvidé la clave guardada en este dispositivo. Escríbela.")}
  if(r.cred){await huellaPedir(r.cred);marcaVerif();return}}
// ---------------------------------------------------------------- apertura rápida (llave ya calculada, no exportable)
async function guardarLlaveRapida(){try{const r=await recLeer();if(!r||!CR.kek||!CR.salt)return;const s=u8b64(CR.salt);if(r.ksalt===s&&r.kek)return;r.kek=CR.kek;r.ksalt=s;await DB.set("recuerdo",r)}catch(e){}}
// ---------------------------------------------------------------- tarjeta «Mis dispositivos»
const haceTxt=iso=>{if(!iso)return"nunca";const m=Math.round((Date.now()-new Date(iso).getTime())/60000);return m<2?"ahora":m<60?`hace ${m} min`:m<1440?`hace ${Math.round(m/60)} h`:`hace ${Math.round(m/1440)} días`};
function tarjetaDisp(){return`<div class="card" id="dispCard"><h2>💻 Mis dispositivos</h2><div id="dispIn"></div></div>`}
async function pintarDisp(){const box=$("#dispIn");if(!box||!S)return;const yo=idDisp(),r=await recLeer(),L=(S.disp||[]).slice().sort((a,b)=>(b.id===yo)-(a.id===yo)||String(b.ult).localeCompare(String(a.ult)));
  const ico={cel:"📱",tablet:"📲",pc:"💻"},sel=(k,o,v,id)=>`<select data-dk="${k}" data-di="${esc(id)}">${o.map(([a,b])=>`<option value="${a}" ${String(v)===String(a)?"selected":""}>${b}</option>`).join("")}</select>`;
  box.innerHTML=`<p class="small">Cada dispositivo tiene su regla. Los <b>recordados</b> abren sin escribir la clave; pueden pedir huella o PIN según la regla. Cambia aquí la de cualquiera (se aplica allá la próxima vez que se abra).</p>
   <div class="dlist">${L.map(d=>`<div class="dfila ${d.id===yo?"yo":""} ${d.revocado?"rev":""}"><div class="dcab"><span class="dico">${ico[d.tipo]||"💻"}</span><div style="flex:1;min-width:0"><input class="dnom" data-dn="${esc(d.id)}" value="${esc(d.nombre)}" ${d.revocado?"disabled":""}>
      <div class="small muted">${d.id===yo?"<b>Este dispositivo</b> · ":""}${d.revocado?"⛔ revocado (olvidará la clave al abrirse)":d.recordado?"🔓 recordado":"🔑 pide la clave"} · usado ${haceTxt(d.ult)}</div></div></div>
     ${d.revocado?"":`<div class="ajg dsel"><label>Pedir ${d.metodo==="pin"?"PIN":"huella"}${sel("verif",Object.entries(VERIF),d.verif,d.id)}</label><label>Bloquear${sel("bloqueo",BLOQ,d.bloqueo,d.id)}</label><label>Con${sel("metodo",[["huella","Huella / rostro"],["pin","PIN"]],d.metodo,d.id)}</label></div>`}
     <div class="filters">${d.id===yo&&!d.revocado?`${!r?'<span class="small warn">Para que abra sin clave, actívalo en «📱 Este dispositivo» → Recordar.</span>':""}${r&&d.metodo==="pin"?`<button class="b s" id="dPin">${r.pinH?"Cambiar PIN":"Crear PIN"}</button>`:""}`:""}
      ${d.id!==yo?(d.revocado?`<button class="b s" data-dq="${esc(d.id)}">Quitar de la lista</button>`:`<button class="b s" data-dr="${esc(d.id)}">⛔ Revocar</button>`):""}</div></div>`).join("")}</div>
   <p class="small muted">«Revocar» sirve si pierdes un equipo o dejas de usarlo: la próxima vez que se abra olvidará la clave. Si lo perdiste, cambia además tu clave principal. El PIN de las notas 🔒 privadas no cambia.</p>`;
  const ah=()=>new Date().toISOString(),D=id=>S.disp.find(d=>d.id===id);
  box.querySelectorAll("[data-dk]").forEach(s=>s.onchange=()=>{const d=D(s.dataset.di);const k=s.dataset.dk;d[k]=k==="bloqueo"?+s.value:s.value;d.editado=ah();if(d.id===yo){ponPolLocal(d);ultimaAct=Date.now()}changed();aviso("Listo");pintarDisp()});
  box.querySelectorAll("[data-dn]").forEach(i=>i.onchange=()=>{const d=D(i.dataset.dn);d.nombre=i.value.trim().slice(0,80)||d.nombre;d.editado=ah();changed()});
  box.querySelectorAll("[data-dr]").forEach(b=>b.onclick=()=>{const d=D(b.dataset.dr);if(!confirm(`¿Revocar «${d.nombre}»? La próxima vez que se abra olvidará la clave y la pedirá.`))return;d.revocado=true;d.editado=ah();changed();pintarDisp()});
  box.querySelectorAll("[data-dq]").forEach(b=>b.onclick=()=>{S.disp=S.disp.filter(d=>d.id!==b.dataset.dq);changed();pintarDisp()});
  if($("#dPin"))$("#dPin").onclick=async()=>{const p1=prompt("PIN nuevo para este dispositivo (4 a 8 números):","");if(p1===null)return;if(!/^\d{4,8}$/.test(p1)){alert("Debe tener de 4 a 8 números.");return}if(prompt("Repítelo:","")!==p1){alert("No coinciden.");return}
    const r=await recLeer();if(!r)return;const s=crypto.getRandomValues(new Uint8Array(16));r.pinS=u8b64(s);r.pinH=await hashPin(p1,s);r.pinFallos=0;await DB.set("recuerdo",r);aviso("PIN guardado en este dispositivo");pintarDisp()}}
// ---------------------------------------------------------------- enganches
window.addEventListener("load",()=>{
  // apertura rápida: si la clave viene del recuerdo y la sal coincide, se usa la llave ya calculada
  const dv=window.derivar;if(typeof dv==="function")window.derivar=async function(frase,salt){if(REC&&REC.probando&&REC.rapida&&REC.rapida.kek&&REC.rapida.ksalt===u8b64(salt))return REC.rapida.kek;return dv.apply(this,arguments)};
  const dz=window.desbloqueado;if(typeof dz==="function")window.desbloqueado=function(){const venia=REC&&REC.probando;const r=dz.apply(this,arguments);if(REC)REC.rapida=null;setTimeout(()=>{registrarDisp().then(()=>{if(!venia)marcaVerif();guardarLlaveRapida()})},400);return r};
  setInterval(()=>{if(S&&!document.hidden)registrarDisp()},30*60000);
  const vd=window.vDatos;if(typeof vd==="function")window.vDatos=function(){const r=vd.apply(this,arguments);const v=$("#view");if(v&&S&&!$("#dispCard")){const ref=$("#recCard");if(ref)ref.insertAdjacentHTML("afterend",tarjetaDisp());else v.insertAdjacentHTML("afterbegin",tarjetaDisp());registrarDisp().then(pintarDisp)}return r};
  const rg=window.recGuardar;if(typeof rg==="function")window.recGuardar=async function(){const r=await rg.apply(this,arguments);marcaVerif();setTimeout(()=>registrarDisp().then(()=>{guardarLlaveRapida();pintarDisp()}),200);return r};
});
