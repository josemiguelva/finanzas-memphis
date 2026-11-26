// =====================================================================================================
// Memphis · 🔒 NOTAS PRIVADAS (segunda capa de cifrado con PIN o frase)
// · Una llave aleatoria (AES-256-GCM) cifra texto, adjuntos, enlaces, lugar e historial de cada entrada privada.
//   Esa llave se guarda envuelta dos veces: con tu PIN y con tu clave principal (para recuperarla si olvidas el PIN).
// · Se ven el día, la hora y el título (si tiene); lo demás queda «••••••» hasta escribir el PIN.
// · Abiertas solo en memoria: al escribir en disco o en Dropbox siempre se guardan cifradas (envoltura de «sellar»).
// · Se cierran solas a los N minutos, al bloquear Memphis o con «Cerrar privadas».
// · La búsqueda normal no las incluye; «🔒 Buscar en privadas» busca solo en ellas.
// =====================================================================================================
"use strict";
const PRIV={key:null,hasta:0,mat:new WeakSet()};
const b64ok=v=>/^[\w+/=]{12,200}$/.test(String(v||""));
MIGRAR_EXTRA.push(st=>{const p=st.privada;st.privada=p&&typeof p==="object"&&b64ok(p.saltP)&&b64ok(p.saltM)&&p.wPin&&b64ok(p.wPin.iv)&&b64ok(p.wPin.ct)&&p.wMain&&b64ok(p.wMain.iv)&&b64ok(p.wMain.ct)
  ?{saltP:p.saltP,saltM:p.saltM,wPin:{iv:p.wPin.iv,ct:p.wPin.ct},wMain:{iv:p.wMain.iv,ct:p.wMain.ct},min:p.v===2&&[0,1,5,15].includes(+p.min)?+p.min:0,v:2}:null});
CONFIG_EXTRA.push("privada");
const privLista=()=>!!(S&&S.privada);
async function kdfP(pass,salt){const base=await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:b64u8(salt),iterations:310000},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function envolver(raw,k){const iv=crypto.getRandomValues(new Uint8Array(12));return{iv:u8b64(iv),ct:u8b64(new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},k,raw)))}}
async function desenvolver(w,k){return new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(w.iv)},k,b64u8(w.ct)))}
const llaveDe=raw=>crypto.subtle.importKey("raw",raw,"AES-GCM",false,["encrypt","decrypt"]);
function abrirPor(){PRIV.hasta=Date.now()+((S&&S.privada&&S.privada.min)||0)*60000+2000}
// ---------------------------------------------------------------- PIN
function pinDlg(titulo,html){return new Promise(ok=>{let d=$("#pinDlg");if(!d){d=document.createElement("dialog");d.id="pinDlg";d.style.cssText="width:min(420px,92vw)";document.body.appendChild(d)}
  d.innerHTML=`<h2 style="margin-top:0">${titulo}</h2>${html}<div class="small neg" id="pnE"></div><div class="filters" style="justify-content:flex-end;margin-top:10px"><button class="b" id="pnC">Cancelar</button><button class="b p" id="pnOK">Aceptar</button></div>`;
  let hecho=false;const fin=v=>{if(hecho)return;hecho=true;d.onclose=null;if(d.open)d.close();ok(v)};d._fin=fin;d.onclose=()=>fin(null);$("#pnC").onclick=()=>fin(null);d.onkeydown=e=>{if(e.key==="Enter"&&e.target.tagName==="INPUT"){e.preventDefault();$("#pnOK").click()}};
  $("#pnOK").onclick=()=>{const v={};d.querySelectorAll("input").forEach(i=>v[i.id]=i.value);fin(v)};d.showModal();setTimeout(()=>{const i=d.querySelector("input");if(i)i.focus()},50)})}
const inpP=(id,ph)=>`<input type="password" id="${id}" placeholder="${ph}" autocomplete="off" style="width:100%;margin:4px 0">`;
async function pedirPin(motivo){if(PRIV.key){abrirPor();return true}if(!privLista()){await configurarPin();return!!PRIV.key}
  for(let i=0;i<5;i++){const v=await pinDlg("🔒 Notas privadas",`<p class="small">${esc(motivo||"Escribe tu PIN de notas privadas.")}</p>${inpP("pP","PIN o frase")}${i?'<p class="small neg">PIN incorrecto, intenta otra vez.</p>':""}<p class="small muted"><a href="#" id="pnOlv">¿Lo olvidaste?</a></p>`);
    if(!v)return false;try{const raw=await desenvolver(S.privada.wPin,await kdfP(v.pP,S.privada.saltP));PRIV.key=await llaveDe(raw);raw.fill(0);abrirPor();return true}catch(e){}}
  return false}
document.addEventListener("click",e=>{if(e.target&&e.target.id==="pnOlv"){e.preventDefault();const d=$("#pinDlg");if(d&&d._fin)d._fin(null);setTimeout(olvidePin,30)}});
async function configurarPin(){const v=await pinDlg("🔒 Crear PIN de notas privadas",`<p class="small">Con este PIN (o una frase) se abren tus notas privadas. Usa 6 dígitos o más. Si lo olvidas, lo restableces con tu clave principal de Memphis.</p>${inpP("pA","PIN nuevo")}${inpP("pB","Repite el PIN")}${inpP("pM","Tu clave principal de Memphis")}`);
  if(!v)return;if(v.pA.length<4){alert("El PIN debe tener al menos 4 caracteres (mejor 6 o más).");return}if(v.pA!==v.pB){alert("Los PIN no coinciden.");return}
  try{await abrirSobre(await DB.get("estado"),v.pM)}catch(e){alert("La clave principal no es correcta.");return}
  const raw=crypto.getRandomValues(new Uint8Array(32)),saltP=u8b64(crypto.getRandomValues(new Uint8Array(16))),saltM=u8b64(crypto.getRandomValues(new Uint8Array(16)));
  S.privada={v:1,saltP,saltM,wPin:await envolver(raw,await kdfP(v.pA,saltP)),wMain:await envolver(raw,await kdfP(v.pM,saltM)),min:0,v:2};PRIV.key=await llaveDe(raw);raw.fill(0);abrirPor();changed();aviso("🔒 PIN creado")}
async function cambiarPin(){const v=await pinDlg("🔒 Cambiar PIN",`${inpP("pO","PIN actual")}${inpP("pA","PIN nuevo")}${inpP("pB","Repite el PIN nuevo")}`);if(!v)return;
  if(v.pA.length<4||v.pA!==v.pB){alert("El PIN nuevo no coincide o es muy corto.");return}
  let raw;try{raw=await desenvolver(S.privada.wPin,await kdfP(v.pO,S.privada.saltP))}catch(e){alert("El PIN actual no es correcto.");return}
  const saltP=u8b64(crypto.getRandomValues(new Uint8Array(16)));S.privada.saltP=saltP;S.privada.wPin=await envolver(raw,await kdfP(v.pA,saltP));raw.fill(0);changed();aviso("🔒 PIN cambiado")}
async function olvidePin(){const v=await pinDlg("🔒 Restablecer el PIN",`<p class="small">Escribe tu clave principal de Memphis y elige un PIN nuevo. Tus notas privadas no se pierden.</p>${inpP("pM","Tu clave principal de Memphis")}${inpP("pA","PIN nuevo")}${inpP("pB","Repite el PIN nuevo")}`);if(!v)return;
  if(v.pA.length<4||v.pA!==v.pB){alert("El PIN nuevo no coincide o es muy corto.");return}
  let raw;try{raw=await desenvolver(S.privada.wMain,await kdfP(v.pM,S.privada.saltM))}catch(e){alert("La clave principal no es correcta (¿la cambiaste? usa la que tenías cuando creaste el PIN).");return}
  const saltP=u8b64(crypto.getRandomValues(new Uint8Array(16)));S.privada.saltP=saltP;S.privada.wPin=await envolver(raw,await kdfP(v.pA,saltP));PRIV.key=await llaveDe(raw);raw.fill(0);abrirPor();changed();aviso("🔒 PIN restablecido")}
// ---------------------------------------------------------------- cifrar / abrir entradas (Diario y Biblioteca)
const PCOL={diario:{campos:{texto:"",adjuntos:[],enlaces:[],lugar:"",versiones:[]},aad:e=>e.id},biblio:{campos:{texto:"",adjuntos:[],url:"",doi:"",autores:[],revista:"",vol:"",num:"",pags:"",editorial:"",versiones:[]},aad:e=>"b:"+e.id}};
const colDe=e=>(S.biblio||[]).includes(e)?"biblio":"diario";
async function cifrarEntrada(e,col){col=col||colDe(e);const C=PCOL[col],o={};for(const k in C.campos)o[k]=e[k]??structuredClone(C.campos[k]);const iv=crypto.getRandomValues(new Uint8Array(12));
  return{iv:u8b64(iv),ct:u8b64(new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode(C.aad(e))},PRIV.key,enc.encode(JSON.stringify(o)))))}}
const vaciarP=(e,col)=>{const C=PCOL[col||colDe(e)].campos;for(const k in C)e[k]=structuredClone(C[k]);return e};
async function abrirEntrada(e,col){if(PRIV.mat.has(e)||!e.priv||!e.priv.ct)return true;col=col||colDe(e);const C=PCOL[col];
  try{const o=JSON.parse(dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(e.priv.iv),additionalData:enc.encode(C.aad(e))},PRIV.key,b64u8(e.priv.ct))));for(const k in C.campos)e[k]=o[k]??structuredClone(C.campos[k]);PRIV.mat.add(e);return true}
  catch(x){aviso("🔒 No pude abrir una entrada privada");return false}}
async function abrirTodas(){for(const e of S.diario||[])if(e.priv)await abrirEntrada(e,"diario")}
// vuelve a cifrar en memoria todo lo que esté abierto; con «olvidar» suelta también la llave
let SELLANDO=false;
async function sellarAbiertas(olvidar){if(SELLANDO)return;SELLANDO=true;try{if(S&&PRIV.key)for(const col of ["diario","biblio"])for(const e of S[col]||[])if(PRIV.mat.has(e)){e.priv=await cifrarEntrada(e,col);vaciarP(e,col);PRIV.mat.delete(e)}
  if(olvidar||!S){PRIV.key=null;PRIV.hasta=0}}finally{SELLANDO=false}}
async function cerrarPrivadas(silencio){const habia=TD.enPriv;TD.enPriv=false;await sellarAbiertas(true);if(!silencio){aviso("🔒 Privadas cerradas");if(MOD==="dia"||MOD==="bib"||habia)render()}}
const verPriv=e=>e&&e.priv&&!PRIV.mat.has(e);
const hayAbiertas=()=>S&&["diario","biblio"].some(c=>(S[c]||[]).some(e=>PRIV.mat.has(e)));
async function hacerPrivada(e,si){if(si){if(!await pedirPin("Para hacerla privada, escribe tu PIN."))return false;if(!e.priv)e.priv={iv:"",ct:""};PRIV.mat.add(e)}else{if(!confirm("¿Quitar la privacidad? Se verá completa en la agenda y en las búsquedas."))return false;delete e.priv;PRIV.mat.delete(e)}
  e.editado=new Date().toISOString();changed();return true}
// ---------------------------------------------------------------- enganches
window.addEventListener("load",()=>{
  // todo lo que se escribe a disco o a Dropbox pasa por sellar(): lo privado abierto se guarda cifrado
  const se=window.sellar;if(typeof se==="function")window.sellar=async function(obj,...r){if(obj&&obj===S&&PRIV.key&&hayAbiertas()){const o={...S};for(const col of ["diario","biblio"]){const D=[];for(const e of S[col]||[])D.push(PRIV.mat.has(e)?{...vaciarP({...e},col),priv:await cifrarEntrada(e,col)}:e);o[col]=D}obj=o}return se.call(this,obj,...r)};
  const pb=window.pantallaBloqueo;if(typeof pb==="function")window.pantallaBloqueo=function(){PRIV.key=null;PRIV.mat=new WeakSet();TD.enPriv=false;return pb.apply(this,arguments)};
  // en cuanto no hay nada privado a la vista, se vuelve a cerrar (y se suelta el PIN si ya pasó su tiempo)
  setInterval(()=>{if(!S||!PRIV.key||SELLANDO)return;const pin=$("#pinDlg");if(pin&&pin.open)return;if($("#dlg").open)return;
    if(!TD.enPriv&&hayAbiertas()){sellarAbiertas(Date.now()>PRIV.hasta).then(()=>{if(MOD==="dia"||MOD==="bib")render()});return}
    if(!TD.enPriv&&Date.now()>PRIV.hasta)sellarAbiertas(true)},700);
  // tarjetas: siempre cerradas, salvo en «Buscar en privadas»
  const candado=e=>`<span class="hr2">${e.todoDia?"todo el día":e.hora?e.hora+(e.horaFin?"–"+e.horaFin:""):""}</span><b>🔒 ${e.titulo?esc(e.titulo):"••••••"}</b>`;
  const ti=window.tarjetaItem;if(typeof ti==="function")window.tarjetaItem=function(x){if(x&&x.k==="d"&&x.e.priv&&!(TD.enPriv&&PRIV.mat.has(x.e))){const e=x.e;return`<div class="it ${e.tipo} priv" data-d="${esc(e.id)}"><div class="ih">${candado(e)}</div><div class="small muted">Privada · toca para ver</div></div>`}return ti.apply(this,arguments)};
  const tb=window.tarjetaB;if(typeof tb==="function")window.tarjetaB=function(x){if(x&&x.priv)return`<div class="it bib priv" data-b="${esc(x.id)}"><div class="ih"><b>🔒 ${x.titulo?esc(x.titulo):"••••••"}</b></div><div class="small muted">Privada · toca para ver</div></div>`;return tb.apply(this,arguments)};
  // botón 🔒/🔓 en el detalle
  const botonP=(e,reabrir)=>{const F=$("#dlgF");if(!F||$("#vdPriv"))return;F.insertAdjacentHTML("afterbegin",`<button class="b" id="vdPriv" title="${e.priv?"Quitar la privacidad":"Que solo se vea con tu PIN"}">${e.priv?"🔓 Quitar privada":"🔒 Hacer privada"}</button>`);
    $("#vdPriv").onclick=async()=>{if(await hacerPrivada(e,!e.priv)){cerrar();aviso(e.priv?"🔒 Ahora es privada":"🔓 Ya no es privada");render()}}};
  // ver y editar: piden el PIN
  const vd=window.verD;if(typeof vd==="function")window.verD=function(id){const e=(S.diario||[]).find(x=>x.id===id);if(verPriv(e)){pedirPin().then(async ok=>{if(ok&&await abrirEntrada(e,"diario"))window.verD(id)});return}
    const r=vd.apply(this,arguments);if(e&&$("#dlg").open&&!e.gcal)botonP(e);return r};
  const ed=window.editarD;if(typeof ed==="function")window.editarD=function(id,pre){const e=id?(S.diario||[]).find(x=>x.id===id):null;if(verPriv(e)){pedirPin().then(async ok=>{if(ok&&await abrirEntrada(e,"diario"))window.editarD(id,pre)});return}
    const r=ed.apply(this,arguments);if(!(e&&e.gcal))ponerCasilla("#deP",e);return r};
  const gd=window.guardarD;if(typeof gd==="function")window.guardarD=function(e,e0){return guardarConPriv(gd,this,arguments,e,"diario")};
  const vb2=window.verB;if(typeof vb2==="function")window.verB=function(id){const x=(S.biblio||[]).find(y=>y.id===id);if(verPriv(x)){pedirPin().then(async ok=>{if(ok&&await abrirEntrada(x,"biblio"))window.verB(id)});return}
    const r=vb2.apply(this,arguments);if(x&&$("#dlg").open)botonP(x);return r};
  const eb=window.editarB;if(typeof eb==="function")window.editarB=function(id,pre){const x=id?(S.biblio||[]).find(y=>y.id===id):null;if(verPriv(x)){pedirPin().then(async ok=>{if(ok&&await abrirEntrada(x,"biblio"))window.editarB(id,pre)});return}
    const r=eb.apply(this,arguments);ponerCasilla("#bT",x,true);return r};
  const gb=window.guardarB;if(typeof gb==="function")window.guardarB=function(x,x0){return guardarConPriv(gb,this,arguments,x,"biblio")};
  // captura rápida: si empieza con 🔒 queda privada (pide el PIN antes de guardar)
  const gq=window.guardarQC;if(typeof gq==="function")window.guardarQC=async function(){const q=$("#qc");if(q&&/^\s*🔒/.test(q.value)){if(!await pedirPin("Para guardarla como privada, escribe tu PIN."))return;q.value=q.value.replace(/^\s*🔒\s*/,"");const antes=new Set(S.diario.map(x=>x.id));const r=gq.apply(this,arguments);const n=S.diario.find(x=>!antes.has(x.id));if(n){n.priv={iv:"",ct:""};PRIV.mat.add(n);changed();render()}return r}return gq.apply(this,arguments)};
  // búsqueda separada
  const vbu=window.vBuscar;if(typeof vbu==="function")window.vBuscar=function(){const h=vbu.apply(this,arguments);const n=(S.diario||[]).filter(e=>e.priv).length;if(!n&&!TD.enPriv)return h;
    return`<div class="filters" style="margin:0 0 6px">${TD.enPriv?`<span class="chip warn">🔒 Buscando solo en tus ${n} privadas</span><button class="b s" id="bPrivX">Salir y cerrar</button>`:`<button class="b s" id="bPriv">🔒 Buscar en privadas (${n})</button>`}</div>`+h};
  const bdi=window.bindDiario;if(typeof bdi==="function")window.bindDiario=function(){const r=bdi.apply(this,arguments);
    if($("#bPriv"))$("#bPriv").onclick=async()=>{if(await pedirPin("Para buscar en tus notas privadas, escribe tu PIN.")){await abrirTodas();TD.enPriv=true;render()}};
    if($("#bPrivX"))$("#bPrivX").onclick=()=>{cerrarPrivadas()};if(TD.enPriv&&TD.vista!=="buscar")cerrarPrivadas(true).then(()=>render());return r};
  // tarjeta en Datos
  const vda=window.vDatos;if(typeof vda==="function")window.vDatos=function(){const r=vda.apply(this,arguments);const v=$("#view");if(v&&S&&!$("#pvCard")){const ref=$("#recCard");const html=`<div class="card" id="pvCard"><h2>🔒 Notas privadas</h2><div id="pvIn"></div></div>`;if(ref)ref.insertAdjacentHTML("afterend",html);else v.insertAdjacentHTML("afterbegin",html);pintarPv()}return r};
});
function ponerCasilla(ancla,e,despues){const a=$(ancla);if(!a||$("#dePriv"))return;const h=`<label class="small" style="margin:0" title="Solo se ve la fecha, la hora y el título; lo demás pide tu PIN"><input type="checkbox" id="dePriv" ${e&&e.priv?"checked":""}> 🔒 privada</label>`;
  if(despues)a.insertAdjacentHTML("afterend",`<div style="margin:4px 0">${h}</div>`);else a.closest("label").insertAdjacentHTML("afterend",h);
  $("#dePriv").onchange=async()=>{const c=$("#dePriv");if(c.checked){const ok=await pedirPin("Para que sea privada, escribe tu PIN.");if(!ok)c.checked=false}}}
function guardarConPriv(orig,ctx,args,e,col){const c=$("#dePriv"),quiere=c?c.checked:!!e.priv;if(quiere&&!PRIV.key){alert("Se cerraron las privadas. Vuelve a marcar «🔒 privada» para escribir tu PIN.");if(c)c.checked=false;return}
  const r=orig.apply(ctx,args);const real=(S[col]||[]).find(x=>x.id===e.id);if(real){if(quiere){if(!real.priv)real.priv={iv:"",ct:""};PRIV.mat.add(real);changed()}else if(real.priv){delete real.priv;PRIV.mat.delete(real);changed()}}return r}
function pintarPv(){const b=$("#pvIn");if(!b)return;const n=[...(S.diario||[]),...(S.biblio||[])].filter(e=>e.priv).length,P=S.privada;
  b.innerHTML=!P?`<p class="small">Marca «🔒 privada» al escribir una nota, un evento o algo de la Biblioteca (o empieza la captura rápida con 🔒): en la agenda solo se verá el día, la hora y el título (o ••••••). Lo demás pide un PIN, distinto de tu clave principal.</p><button class="b s p" id="pvCrear">Crear PIN</button>`
   :`<p class="small">${n} privada${n===1?"":"s"} · siempre se ven cerradas en la agenda y la Biblioteca; al abrir una te pido el PIN</p>
    <div class="filters"><label class="small" style="margin:0">Pedir el PIN <select id="pvMin">${[[0,"cada vez"],[1,"si pasó 1 min"],[5,"si pasaron 5 min"],[15,"si pasaron 15 min"]].map(([m,l])=>`<option value="${m}" ${P.min===m?"selected":""}>${l}</option>`).join("")}</select></label>${PRIV.key?'<button class="b s" id="pvCerrar">Cerrar ahora</button>':""}<button class="b s" id="pvCambiar">Cambiar PIN</button><button class="b s" id="pvOlv">Olvidé el PIN</button></div>
    <p class="small muted">Las privadas no salen en la búsqueda normal ni en exportaciones; en 🔎 Buscar está «🔒 Buscar en privadas». Protegen frente a quien mire tu pantalla o use Memphis abierta; la protección fuerte sigue siendo tu clave principal.</p>`;
  if($("#pvCrear"))$("#pvCrear").onclick=async()=>{await configurarPin();pintarPv()};
  if($("#pvMin"))$("#pvMin").onchange=()=>{S.privada.min=+$("#pvMin").value;changed()};
  if($("#pvCerrar"))$("#pvCerrar").onclick=async()=>{await cerrarPrivadas();pintarPv()};
  if($("#pvCambiar"))$("#pvCambiar").onclick=cambiarPin;if($("#pvOlv"))$("#pvOlv").onclick=async()=>{await olvidePin();pintarPv()}}
