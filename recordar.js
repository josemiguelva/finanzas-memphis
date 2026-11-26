// =====================================================================================================
// Memphis · RECORDAR ESTE CELULAR (+ huella)
// · La clave se guarda cifrada con una llave AES-GCM NO EXPORTABLE creada por el navegador (CryptoKey en
//   IndexedDB): no se puede copiar a otro equipo ni leer como texto; solo esta instalación de Chrome la usa.
// · Opcional: pedir huella/rostro (WebAuthn con verificación de usuario) antes de usarla.
// · «Cerrar sesión en este dispositivo», cambiar la clave en otro lado o «Olvidar» lo borran.
// =====================================================================================================
"use strict";
const REC={auto:true};
async function recLeer(){try{const r=await DB.get("recuerdo");return r&&r.key&&r.ct?r:null}catch(e){return null}}
async function recGuardar(clave,{huella}){const key=await crypto.subtle.generateKey({name:"AES-GCM",length:256},false,["encrypt","decrypt"]);const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(clave)));let cred=null,err="";if(huella){try{cred=await huellaRegistrar()}catch(e){err=e&&e.name==="NotAllowedError"?"cancelaste o el celular no dejó registrar la huella":(e.message||String(e))}}
  await DB.set("recuerdo",{key,iv,ct,cred,creado:new Date().toISOString(),err});return{cred,err}}
const huellaPosible=async()=>{try{return !!(window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch(e){return false}};
async function huellaRegistrar(){const c=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:"Memphis",id:location.hostname},
  user:{id:crypto.getRandomValues(new Uint8Array(16)),name:"memphis@"+location.hostname,displayName:"Memphis en este celular"},pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
  authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"preferred",requireResidentKey:false},timeout:60000,attestation:"none"}});
  if(!c)throw new Error("No se registró la huella");return new Uint8Array(c.rawId)}
async function huellaPedir(cred){const a=await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rpId:location.hostname,allowCredentials:[{type:"public-key",id:cred}],userVerification:"required",timeout:60000}});
  const ad=new Uint8Array(a.response.authenticatorData);if(!(ad[32]&4))throw new Error("El celular no confirmó tu huella");return true}
async function recAbrir(){const r=await recLeer();if(!r||!$("#uF"))return;const b=$("#recB"),e=$("#uE");if(b)b.disabled=true;
  try{if(typeof verificarDisp==="function")await verificarDisp(r);else if(r.cred)await huellaPedir(r.cred);REC.rapida=r.kek?{kek:r.kek,ksalt:r.ksalt}:null;const clave=dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:r.iv},r.key,r.ct));$("#uK").value=clave;REC.probando=true;$("#uF").requestSubmit()}
  catch(x){if(b)b.disabled=false;REC.ultErr=(x&&x.name)+": "+(x&&x.message||x);if(e)e.textContent=x&&x.name==="NotAllowedError"?"Toca «🔓 Abrir con huella» (o escribe tu clave).":"No se pudo usar el recuerdo: "+(x.message||x)}}
function recBoton(){recLeer().then(rc=>{if(!$("#uF")||$("#recB")||$("#recHint"))return;if(!rc){$("#uF").insertAdjacentHTML("beforeend",`<p class="small muted" id="recHint">💡 Para no escribir la clave cada vez en este celular: ábrelo y ve a Datos › 📱 Este dispositivo › «Recordar este dispositivo».</p>`);return}const k=$("#uK");if(k){k.removeAttribute("autofocus");k.blur()}$("#uF .opts").insertAdjacentHTML("afterbegin",`<button class="b p" type="button" id="recB">${rc.cred&&(typeof tocaVerificar!=="function"||tocaVerificar())?"🔓 Abrir con huella":"🔓 Abrir"}</button>`);$("#uOK").classList.remove("p");$("#recB").onclick=recAbrir;$("#recB").style.cssText="width:100%;padding:14px;font-size:1.05rem;margin-bottom:8px";const o=$("#uF .opts");if(o&&o.parentNode)o.parentNode.insertBefore($("#recB"),o);
      // si la clave recordada ya no sirve (se cambió en otro equipo), se olvida
      const ue=$("#uE");if(ue)new MutationObserver(()=>{if(REC.probando&&ue.textContent){REC.probando=false;DB.del("recuerdo");$("#uK").value="";ue.textContent="La clave recordada ya no sirve (¿la cambiaste?). Escríbela y vuelve a activar «Recordar este celular» en Datos.";const b=$("#recB");if(b)b.remove()}}).observe(ue,{childList:true,characterData:true,subtree:true});
      if(REC.auto&&document.visibilityState==="visible"){REC.auto=false;setTimeout(recAbrir,250)}})}
window.addEventListener("load",()=>{
  const pb=window.pantallaBloqueo;if(typeof pb==="function")window.pantallaBloqueo=function(){const r=pb.apply(this,arguments);recBoton();return r};
  if($("#uF"))recBoton(); // la pantalla de bloqueo ya se mostró antes de este archivo
  const dz=window.desbloqueado;if(typeof dz==="function")window.desbloqueado=function(){REC.probando=false;REC.auto=false;return dz.apply(this,arguments)};
  // al volver a la app después del bloqueo automático, pedir la huella sola
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!S&&$("#recB")&&!$("#recB").disabled)setTimeout(recAbrir,300)});
  const vd=window.vDatos;if(typeof vd==="function")window.vDatos=function(){const r=vd.apply(this,arguments);const v=$("#view");if(v&&S&&!$("#recCard")){v.insertAdjacentHTML("afterbegin",`<div class="card" id="recCard"><h2>📱 Este dispositivo</h2><div id="recIn" class="small muted">…</div></div>`);pintarRec()}return r};
});
async function pintarRec(){const box=$("#recIn");if(!box)return;const r=await recLeer(),hp=await huellaPosible();
  box.className="";box.innerHTML=r?`<p>✅ <b>Recordado</b> ${r.cred?"con huella":"sin huella"} desde ${esc(r.creado.slice(0,10))}.${r.err&&!r.cred?` <span class="small muted">(la huella no se pudo registrar: ${esc(r.err)})</span>`:""} Al abrir Memphis ${r.cred?"te pide la huella":"entra directo"}.</p>
     <div class="filters"><button class="b s" id="recX">Olvidar este dispositivo</button>${hp?`<button class="b s" id="recH">${r.cred?"Quitar huella":"Pedir huella"}</button>`:""}</div>`
   :`<p class="small">No tendrás que escribir la clave cada vez. Usa esto solo en tu propio celular o computador.</p>
     <label class="small"><input type="checkbox" id="recCH" ${hp?"checked":"disabled"}> Pedir huella o rostro para abrir${hp?"":" (este dispositivo no tiene huella disponible)"}</label>
     <label class="small"><input type="checkbox" id="recCB" checked> Bloquear solo tras 120 minutos sin uso</label>
     <div class="filters"><button class="b s p" id="recA">📱 Recordar este dispositivo</button></div>`;
  box.insertAdjacentHTML("beforeend",`<p class="small muted">La clave queda cifrada con una llave que el navegador crea y no deja copiar. Quien tenga el celular desbloqueado${r&&r.cred?" y tu huella":""} puede abrir Memphis. «Cerrar sesión en este dispositivo» también lo borra.</p>`);
  if($("#recA"))$("#recA").onclick=()=>{dlg("📱 Recordar este dispositivo",`<label>Escribe tu clave una última vez</label><input type="password" id="recK" autocomplete="current-password" style="width:100%">`,[["Cancelar","",cerrar],["Recordar","p",async()=>{const k=$("#recK").value;
      try{await abrirSobre(await DB.get("estado"),k)}catch(e){alert("Esa no es la clave");return}
      const hu=$("#recCH")&&$("#recCH").checked,b120=$("#recCB")&&$("#recCB").checked;cerrar();
      try{const g=await recGuardar(k,{huella:hu});if(b120){S.bloqueoMin=120;changed()}if(hu&&!g.cred)alert("Quedó recordado SIN huella ("+g.err+"). Memphis abrirá directo; puedes intentar «Pedir huella» otra vez en esta tarjeta.");else aviso(g.cred?"Listo: la próxima vez abre con tu huella":"Listo: este dispositivo queda recordado")}catch(e){alert("No se pudo recordar: "+(e.message||e))}pintarRec()}]]);setTimeout(()=>$("#recK").focus(),50)};
  if($("#recX"))$("#recX").onclick=async()=>{await DB.del("recuerdo");aviso("Olvidado: la próxima vez te pedirá la clave");pintarRec()};
  if($("#recH"))$("#recH").onclick=async()=>{if(r.cred){r.cred=null;await DB.set("recuerdo",r);pintarRec();return}try{r.cred=await huellaRegistrar();await DB.set("recuerdo",r);aviso("Huella activada")}catch(e){alert("No se registró la huella")}pintarRec()}}
