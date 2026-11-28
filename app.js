
"use strict";
// ======================= Perfiles: varias personas en el mismo dispositivo o en el mismo Dropbox =======================
// Cada perfil tiene su base local, sus preferencias del dispositivo y su propia carpeta en Dropbox (/perfiles/<perfil>/…).
// El perfil principal ("") usa las rutas de siempre. Un perfil nunca lee ni escribe fuera de su carpeta.
const PERFIL=(()=>{try{const p=localStorage.getItem("memphisPerfil")||"";return/^[a-z0-9-]{1,24}$/.test(p)?p:""}catch(e){return""}})();
const SUF_P=PERFIL?"_"+PERFIL:"";
(()=>{if(!PERFIL)return;const G=Storage.prototype.getItem,P=Storage.prototype.setItem,R=Storage.prototype.removeItem,k=x=>/^memphis/.test(x)&&!/^memphisPerfil/.test(x)?x+SUF_P:x;
  Storage.prototype.getItem=function(x){return G.call(this,k(String(x)))};Storage.prototype.setItem=function(x,v){return P.call(this,k(String(x)),v)};Storage.prototype.removeItem=function(x){return R.call(this,k(String(x)))}})();
const rutaP=p=>{p=String(p||"");if(!PERFIL)return p;const r=p.startsWith("/")?p:"/"+p;return r.startsWith("/perfiles/")||r.startsWith("/pareja/")?r:"/perfiles/"+PERFIL+r};
// apariencia de este dispositivo (antes de pintar nada)
try{const t=localStorage.getItem("memphisTema"),a=localStorage.getItem("memphisAcento");if(t&&t!=="auto")document.documentElement.dataset.tema=t;if(a&&a!=="azul")document.documentElement.dataset.acento=a}catch(e){}
// ======================= Datos base =======================
const TIPOS_DEF=[
 ["Gasto débito",1,0,-1,0,0,"Compra o pago con cuenta de ahorros, Nequi o PSE"],
 ["Compra TC",1,0,0,1,0,"Compra con tarjeta de crédito: es gasto al comprar; sube la deuda"],
 ["Cargo financiero TC",1,0,0,1,0,"Intereses, mora y cuota de manejo de la tarjeta"],
 ["Avance TC",0,0,1,1,0,"Avance en efectivo: entra plata y sube la deuda"],
 ["Devolución TC",-1,0,0,-1,0,"Devolución de un comercio a la tarjeta"],
 ["Pago tarjeta de crédito",0,0,-1,-1,0,"Pago de la tarjeta: NO es gasto"],
 ["Cuota de crédito / leasing",1,0,-1,0,0,"Cuota completa de un crédito o del leasing (lo que te descuentan): cuenta como gasto del mes"],
 ["Pago crédito (capital)",0,0,-1,0,-1,"Abono a capital: NO es gasto, baja la deuda"],
 ["Intereses y seguros de crédito",1,0,-1,0,0,"Intereses y seguro de un crédito"],
 ["Pago deuda sin desglose",0,0,-1,0,-1,"Cuota de un crédito sin separar intereses"],
 ["Desembolso crédito",0,0,1,0,1,"Te prestan: entra plata, NO es ingreso"],
 ["Leasing vivienda",1,0,-1,0,0,"Cuota de leasing sin separar capital e intereses"],
 ["Deuda saldada con aportes",0,1,0,0,-1,"Deuda cancelada con tus ahorros o aportes (sin mover tus cuentas)"],
 ["Gasto financiero",1,0,-1,0,0,"4x1000, cuota de manejo, comisiones"],
 ["Retiro de efectivo",1,0,-1,0,0,"Efectivo: cuenta como gasto al retirarlo"],
 ["Transferencia a terceros",1,0,-1,0,0,"Transferencia a una persona (revisar)"],
 ["Aporte familiar enviado",1,0,-1,0,0,"Plata que envías a familiares para deudas o gastos comunes"],
 ["Aporte familiar recibido",-1,0,1,0,0,"Plata que la familia te pasa para gastos comunes: NO es ingreso, reduce el gasto"],
 ["Reembolso de gasto compartido",-1,0,1,0,0,"Alguien te paga su parte de una compra que hiciste tú: NO es ingreso, reduce el gasto"],
 ["Ingreso extraordinario (ahorros)",0,1,1,0,0,"Liquidación de ahorros, cesantías o fondo de empleados"],
 ["Transferencia interna",0,0,-1,0,0,"Sale hacia otra cuenta tuya"],
 ["Transferencia interna (entrada)",0,0,1,0,0,"Entra desde otra cuenta tuya"],
 ["Ingreso salario",0,1,1,0,0,"Nómina"],
 ["Ingreso otro",0,1,1,0,0,"Otros ingresos reales (p. ej. premios)"],
 ["Rendimientos",0,1,1,0,0,"Intereses que te paga el banco"],
 ["Devolución",-1,0,1,0,0,"Devolución de un gasto a la cuenta"],
 ["Ajuste bancario (salida)",0,0,-1,0,0,"Movimiento reversado"],
 ["Ajuste bancario (entrada)",0,0,1,0,0,"Reversa del banco"],
 ["Gasto de otra cuenta",0,0,0,0,0,"Gasto familiar pagado desde la cuenta de tu familiar: no es tu dinero; cuenta en la vista Familia"],
 ["Gasto en efectivo",0,0,0,0,0,"Pago con efectivo que sacaste del cajero: el retiro ya contó como gasto; aquí solo se detalla en qué se fue"],
 ["Revisar (no está en el extracto)",0,0,0,0,0,"Anotado pero no aparece en el banco: no suma"]
].map(t=>({tipo:t[0],gasto:t[1],ingreso:t[2],flujo:t[3],dtc:t[4],dcred:t[5],desc:t[6]}));

const REGLAS_DEF=[
 // patrón (texto o /regex/), tipo, categoría, establecimiento
 ["/ABONO INTERESES|PAGO DE INTERESES/","Rendimientos","Ingresos","Banco"],
 ["/PAGO SUC VIRT TC|MORA TARJETA|PAGO TARJETA/","Pago tarjeta de crédito","Pagos","Tarjeta de crédito"],
 ["/LEASING/","Cuota de crédito / leasing","Leasing y créditos","Leasing"],
 ["/PAGO CREDITO SUC|ABONO CARTERA/","Cuota de crédito / leasing","Leasing y créditos","Banco"],
 ["/REINTEGRO/","Devolución","Reembolsos",""],
 ["/4X1000|MANEJO TARJ|CUOTA DE MANEJO|COMIS/","Gasto financiero","Banco","Banco"],
 ["/INTERESES CORRIENTES|INTERESES MORA/","Cargo financiero TC","Banco","Tarjeta de crédito"],
 ["/RETIRO CAJERO|RETIRASTE/","Retiro de efectivo","Cajero",""],
 
 ["/ENERGIA|ACUEDUCTO|GAS NATURAL|TELECOMU/","Gasto débito","Servicios",""],
 ["/NETFLIX|SPOTIFY|DISNEY|HBO|MAX |AMAZON|PRIME|APPLE|GOOGLE|MICROSOFT|ADOBE/","Gasto débito","Software",""],
 // Comercios conocidos → categoría automática (se aplican al importar y al escribir el establecimiento)
 ["/UBER ?EATS|DIDI ?FOOD|RAPPI(?!PAY)|IFOOD|DOMICILIOS\.COM/","Gasto débito","Domicilios",""],
 ["/\\bUBER\\b|\\bDIDI\\b|INDRIVE|\\bBEAT\\b|TAXI|PICAP|\\bCABIFY\\b/","Gasto débito","Transporte",""],
 ["/TRANSMILENIO|TU ?LLAVE|RECARGA TM|SITP/","Gasto débito","Transporte","TransMilenio"],
 ["/PEAJE|PARQUEADERO|PARKING|CITY ?PARKING/","Gasto débito","Transporte",""],
 ["/TERPEL|PRIMAX|TEXACO|BIOMAX|\\bMOBIL\\b|ESTACION DE SERVICIO|\\bEDS\\b/","Gasto débito","Combustible",""],
 ["/\\bEXITO\\b|ALMACENES EXITO/","Gasto débito","Mercado","Éxito"],["/ALKOSTO/","Gasto débito","Mercado","Alkosto"],
 ["/OLIMPICA|\\bSAO\\b/","Gasto débito","Mercado","Olímpica"],["/\\bJUMBO\\b|CENCOSUD/","Gasto débito","Mercado","Jumbo"],
 ["/\\bD1\\b|TIENDAS D1|KOBA/","Gasto débito","Mercado","D1"],["/TIENDAS ARA|JERONIMO MARTINS|\\bARA\\b/","Gasto débito","Mercado","Ara"],
 ["/\\bISIMO\\b|\\bMAKRO\\b|SURTIMAX|SUPER ?INTER|COMFANDI|MERCAQUEBUENO|FRUVER|AUTOSERVICIO|SUPERMERCADO|MINIMERCADO/","Gasto débito","Mercado",""],
 ["/PRICESMART/","Gasto débito","Mercado","PriceSmart"],
 ["/JUAN VALDEZ/","Gasto débito","Café y snacks","Juan Valdez"],["/TOSTAO/","Gasto débito","Café y snacks","Tostao"],["/\\bOMA\\b|STARBUCKS|PAN PA YA|PANADERIA/","Gasto débito","Café y snacks",""],
 ["/EL CORRAL|FRISBY|\\bKFC\\b|MC ?DONALD|BURGER KING|CREPES|PRESTO|SUBWAY|DOMINO|PAPA JOHN|JENOS|RESTAURANTE|ASADERO/","Gasto débito","Restaurantes",""],
 ["/CRUZ VERDE|LA REBAJA|FARMATODO|LOCATEL|DROGUERIA|FARMACIA|PASTEUR/","Gasto débito","Salud",""],
 ["/HOMECENTER|SODIMAC|EASY |CONSTRUCTOR/","Gasto débito","Hogar",""],
 ["/KTRONIX|FALABELLA|MERCADO ?LIBRE|MERCADOPAGO|TEMU|SHEIN|ALIEXPRESS/","Gasto débito","Compras",""],
 ["/PANAMERICANA|LIBRERIA|NACIONAL DE LIBROS/","Gasto débito","Papelería y libros",""],
 ["/CINE ?COLOMBIA|CINEMARK|PROCINAL|CINEPOLIS/","Gasto débito","Entretenimiento",""],
 ["/WOMPI|SUPERINTENDENCIA/","Gasto débito","Servicios",""],
 ["/RECARGA|CELULAR|CLARO|MOVISTAR|TIGO/","Gasto débito","Servicios","Recarga celular"],
 ["/^TRANSF A |^PARA |ENVIO CON BRE-B|BRE-B|ENVIASTE|TRANSFERENCIA A /","Gasto débito","Pagos por transferencia",""],
 ["/^TRANSF DE |^DE |PAGO INTERBANC|RECIBISTE|TRANSFERENCIA DE /","Reembolso de gasto compartido","Reembolsos",""]
].map((r,i)=>({id:i+1,patron:r[0],tipo:r[1],categoria:r[2],estab:r[3]}));
// Las reglas personales (nombres, empleador, administración…) NO van en este código público: viven cifradas en tu archivo de datos (propia:true).
const REGLAS_VER="2026-11-23e";

let S=null; // estado
const $=s=>document.querySelector(s);
let DISC=(()=>{try{return localStorage.getItem("memphisDisc")==="1"}catch(e){return false}})();
function toggleDisc(){DISC=!DISC;try{localStorage.setItem("memphisDisc",DISC?"1":"0")}catch(e){}document.body.classList.toggle("disc",DISC)}
const fmt=n=>DISC?"$ •••":(n<0?"-":"")+"$"+Math.round(Math.abs(n)).toLocaleString("es-CO");
const esc=s=>String(s??"").replace(/[&<>"'`]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const tipoInfo=t=>S.tipos.find(x=>x.tipo===t)||{gasto:0,ingreso:0,flujo:0,dtc:0,dcred:0};
const calc=m=>{const t=tipoInfo(m.tipo),v=+m.valor||0;return{gasto:v*t.gasto,ingreso:v*t.ingreso,flujo:v*t.flujo,dtc:v*t.dtc,dcred:v*t.dcred}};
const isTC=c=>/VISA|MASTER|TC|TARJETA/i.test(c||"");

// ======================= Seguridad: cifrado =======================
// Archivo de datos (.fmx): JSON {app,tipo,v,kdf{alg,iter,salt},enc{alg,iv},gz,ct}
//   clave = PBKDF2-SHA256(frase, salt, 600.000 iteraciones) → AES-256-GCM
//   dentro va todo el estado, incluida la "llave de datos" (dek) con la que se cifran los adjuntos.
// Adjunto (.fma): "FMA1" + iv(12) + AES-256-GCM(dek, contenido)  (AAD = "fma|"+sha)
const APP_VERSION="2026.11.28-compartido";
const APP_ID="finanzas-memphis",FORMATO=3,ITER=600000,AAD_DATOS=new TextEncoder().encode("finanzas-memphis|datos");
const CR={kek:null,salt:null,dek:null,deks:new Map()};
const enc=new TextEncoder(),dec=new TextDecoder();
function u8b64(u){let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
function b64u8(b){const s=atob(b);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
async function derivar(frase,salt){const base=await crypto.subtle.importKey("raw",enc.encode(frase.normalize("NFC")),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt,iterations:ITER},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function gz(u,modo){if(typeof CompressionStream==="undefined")return null;const s=new Blob([u]).stream().pipeThrough(modo==="c"?new CompressionStream("gzip"):new DecompressionStream("gzip"));return new Uint8Array(await new Response(s).arrayBuffer())}
async function sellar(obj){ // estado → texto .fmx cifrado
  let plano=enc.encode(JSON.stringify(obj));const c=await gz(plano,"c");const usaGz=!!c;if(c)plano=c;
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:AAD_DATOS},CR.kek,plano));
  return JSON.stringify({app:APP_ID,tipo:"datos",v:1,kdf:{alg:"PBKDF2-SHA256",iter:ITER,salt:u8b64(CR.salt)},enc:{alg:"AES-256-GCM",iv:u8b64(iv)},gz:usaGz,ct:u8b64(ct)})}
function esSobre(o){return o&&o.app===APP_ID&&o.tipo==="datos"&&o.kdf&&o.ct}
async function abrirSobre(o,frase){ // texto/objeto .fmx + frase → estado (lanza error si la frase no sirve)
  if(typeof o==="string")o=JSON.parse(o);if(!esSobre(o))throw new Error("No es un archivo de Finanzas Memphis");
  const salt=b64u8(o.kdf.salt);const kek=await derivar(frase,salt);let plano;
  try{plano=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(o.enc.iv),additionalData:AAD_DATOS},kek,b64u8(o.ct)))}catch(e){throw new Error("Clave incorrecta (o archivo dañado)")}
  if(o.gz)plano=await gz(plano,"d");
  CR.kek=kek;CR.salt=salt;return JSON.parse(dec.decode(plano))}
async function nuevaClave(frase){CR.salt=crypto.getRandomValues(new Uint8Array(16));CR.kek=await derivar(frase,CR.salt)}
async function cargarDek(){ // llavero de adjuntos: una llave por dispositivo que empezó por separado; se combinan al sincronizar
  if(!S.deks||typeof S.deks!=="object")S.deks={};if(S.dek&&!Object.values(S.deks).includes(S.dek)){S.deks.k0=S.dek}
  if(!S.dekId||!S.deks[S.dekId]){if(S.dek){S.dekId=Object.keys(S.deks).find(k=>S.deks[k]===S.dek)}else{const id=[...crypto.getRandomValues(new Uint8Array(4))].map(b=>b.toString(16).padStart(2,"0")).join("");S.deks[id]=u8b64(crypto.getRandomValues(new Uint8Array(32)));S.dekId=id}}
  delete S.dek;CR.deks=new Map();for(const [id,k] of Object.entries(S.deks))if(/^[0-9a-z]{2,8}$/.test(id))CR.deks.set(id,await crypto.subtle.importKey("raw",b64u8(k),{name:"AES-GCM"},false,["encrypt","decrypt"]));CR.dek=CR.deks.get(S.dekId)}
async function cifrarAdj(bytes,sha){const iv=crypto.getRandomValues(new Uint8Array(12));const id=S.dekId.padEnd(8," ");const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode("fma|"+sha+"|"+S.dekId)},CR.dek,bytes));const out=new Uint8Array(4+8+12+ct.length);out.set(enc.encode("FMA2"));out.set(enc.encode(id),4);out.set(iv,12);out.set(ct,24);return out}
async function descifrarAdj(u,sha){const mag=dec.decode(u.subarray(0,4));
  if(mag==="FMA2"){const id=dec.decode(u.subarray(4,12)).trim();const k=CR.deks.get(id);if(!k)throw new Error("Falta la llave de este adjunto (sincroniza con el dispositivo donde se agregó)");return new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:u.subarray(12,24),additionalData:enc.encode("fma|"+sha+"|"+id)},k,u.subarray(24)))}
  if(mag!=="FMA1")throw new Error("No es un adjunto cifrado de Finanzas Memphis");
  for(const k of CR.deks.values()){try{return new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:u.subarray(4,16),additionalData:enc.encode("fma|"+sha)},k,u.subarray(16)))}catch(e){}}throw new Error("No pude descifrar este adjunto")}
function fuerza(f){let p=0;if(f.length>=12)p++;if(f.length>=16)p++;if(f.length>=22)p++;if(/[a-záéíóúñ]/.test(f)&&/[A-ZÁÉÍÓÚÑ]/.test(f))p++;if(/\d/.test(f))p++;if(/[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]/.test(f))p++;if(/\s/.test(f.trim())&&f.trim().split(/\s+/).length>=4)p+=2;return Math.min(p,6)}

// ======================= Persistencia =======================
// En este navegador (IndexedDB) solo se guarda el sobre CIFRADO y los adjuntos CIFRADOS.
const DB={db:null,
 open(){return new Promise((ok,ko)=>{const r=indexedDB.open("finanzasMemphis"+SUF_P,1);r.onupgradeneeded=()=>{r.result.createObjectStore("kv")};r.onsuccess=()=>{this.db=r.result;ok()};r.onerror=()=>ko(r.error)})},
 get(k){return new Promise(ok=>{try{const r=this.db.transaction("kv").objectStore("kv").get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null)}catch(e){ok(null)}})},
 set(k,v){return new Promise(ok=>{try{const tx=this.db.transaction("kv","readwrite");tx.objectStore("kv").put(v,k);tx.oncomplete=()=>ok(true);tx.onerror=()=>ok(false)}catch(e){ok(false)}})},
 del(k){return new Promise(ok=>{try{const tx=this.db.transaction("kv","readwrite");tx.objectStore("kv").delete(k);tx.oncomplete=()=>ok(true);tx.onerror=()=>ok(false)}catch(e){ok(false)}})},
 keys(){return new Promise(ok=>{try{const r=this.db.transaction("kv").objectStore("kv").getAllKeys();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>ok([])}catch(e){ok([])}})}
};
const FSA="showDirectoryPicker" in window;
let dirHandle=null,saveTimer=null,dirty=false,syncTimer=null;
function status(t){$("#st").textContent=t}
let GEN=0;
function changed(){GEN++;dirty=true;S.ultimaEdicion=new Date().toISOString();clearTimeout(saveTimer);saveTimer=setTimeout(persist,600);status("Guardando…")}
async function permiso(h,pedir){if(!h)return false;try{const o={mode:"readwrite"};if(await h.queryPermission(o)==="granted")return true;return pedir?(await h.requestPermission(o))==="granted":false}catch(e){return false}}
async function subdir(ruta,crear=true){let d=dirHandle;if(PERFIL)ruta="perfiles/"+PERFIL+"/"+ruta;for(const p of ruta.split("/").filter(Boolean))d=await d.getDirectoryHandle(p,{create:crear});return d}
async function escribir(ruta,datos){const partes=ruta.split("/");const nombre=partes.pop();const d=await subdir(partes.join("/"));const fh=await d.getFileHandle(nombre,{create:true});const w=await fh.createWritable();await w.write(datos);await w.close()}
async function leer(ruta){const partes=ruta.split("/");const nombre=partes.pop();const d=await subdir(partes.join("/"),false);return (await d.getFileHandle(nombre)).getFile()}
const RUTA_DATOS="datos/finanzas-memphis.fmx";
let carpetaOK=false;
async function persist(){
  if(!S||!CR.kek)return;
  if(conDropbox())S.dbx.sucio=true;
  const sobre=await sellar(S);
  await DB.set("estado",sobre);
  if(conDropbox()){S.dbx.sucio=true;await DB.set("estado",await sellar(S));dirty=false;dbxSync("cambio");return}
  let msg="Guardado (cifrado) en este navegador";
  if(dirHandle&&(carpetaOK||await permiso(dirHandle,false))){try{carpetaOK=true;await escribir(RUTA_DATOS,sobre);
      const hoy=new Date().toISOString().slice(0,10);if(S.ultimoRespaldo!==hoy){await escribir(`respaldos/finanzas-memphis_${hoy}.fmx`,sobre);S.ultimoRespaldo=hoy}
      msg="Guardado (cifrado) en tu carpeta "+dirHandle.name;
      if(S.syncPlano!==false){clearTimeout(syncTimer);syncTimer=setTimeout(()=>escribirSync().catch(()=>{}),1500)}
    }catch(e){carpetaOK=false;msg="Guardado en el navegador · no pude escribir en la carpeta (Datos › Reconectar)"}}
  else if(S.mov.length)msg+=" · recuerda guardar el archivo en Dropbox (Datos)";
  dirty=false;status(msg+" · "+new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}));
}
// Archivo de sincronización: SIN cifrar, solo movimientos (lo lee la sincronización semanal hacia Sheets/Notion/Capacities)
function datosSync(){return JSON.stringify({app:APP_ID,tipo:"sync",formato:FORMATO,generado:new Date().toISOString(),
  movimientos:S.mov.map(m=>{const c=calc(m);return{id:m.id,fecha:m.fecha,hora:m.hora||"",pagado_por:QN(quien(m)),cuenta:m.cuenta,descripcion:m.desc,establecimiento:m.estab,concepto:m.concepto,categoria:m.categoria,tipo:m.tipo,valor:m.valor,gasto_real:c.gasto,ingreso:c.ingreso,naturaleza:naturaleza(m),conciliacion:m.conciliacion||"",nota:m.nota||"",filaSheets:m.filaSheets||null,adjuntos:(m.adjuntos||[]).map(a=>a.nombre),editado:m.editado||null}}),
  vencimientos:(S.venc||[]).map(v=>({id:v.id,tipo:v.tipo,titulo:v.titulo,comercio:v.comercio,valor:v.valor,inicio:v.inicio,meses:v.meses,vence:v.vence,avisar:v.avisar,movimiento:v.movId||null,estado:v.estado,nota:v.nota,adjuntos:(v.adjuntos||[]).map(a=>a.nombre)})),
  recurrentes:(S.rec||[]).map(r=>{const v=vigenteEn(r,hoyISO());return{id:r.id,nombre:r.nombre,tipo:r.tipo,monto_actual:v.monto,cuenta_actual:v.cuenta,cada:r.cada,unidad:r.unidad,inicio:r.inicio,fin:r.fin,activo:r.activo,auto:r.auto,historial:r.historial}}),
  eliminados:S.eliminados||[]},null,1)}
async function escribirSync(){if(!dirHandle)return;await escribir("sync/finanzas_sync.json",datosSync());S.ultimoSync=new Date().toISOString()}
function naturaleza(m){const t=m.tipo;if(t==="Pago tarjeta de crédito")return"Pago de TC";if(/Pago crédito|Pago deuda/.test(t))return"Pago de crédito";const c=calc(m);if(c.ingreso>0)return"Ingreso";if(/Reembolso|Aporte familiar recibido|^Devolución/.test(t))return"Reembolso";if(/Transferencia interna|Ajuste|Desembolso|Revisar/.test(t))return"Movimiento interno";if(t==="Gasto en efectivo")return"Gasto en efectivo (detalle)";if(c.gasto>0||t==="Gasto de otra cuenta")return"Gasto";return"Otro"}
function defaults(){return{app:APP_ID,formato:FORMATO,reglasVer:REGLAS_VER,tipos:TIPOS_DEF,reglas:REGLAS_DEF,cuentas:["Cuenta de ahorros","Billetera digital","Tarjeta de crédito","Efectivo"],saldos:null,mov:[],venc:[],rec:[],eliminados:[],ventana:{banco:4,tc:7,tolerancia:3},bloqueoMin:10}}
// Migraciones de formato: cada versión nueva de la app sabe leer las anteriores
function normTC(t){const n=x=>x===""||x==null||isNaN(+x)?null:+x;return{cuotas:Math.max(1,Math.min(72,Math.floor(+t.cuotas||1))),cuotaActual:n(t.cuotaActual),valorCuota:n(t.valorCuota),tasaMV:n(t.tasaMV),tasaEA:n(t.tasaEA),saldo:n(t.saldo),corte:/^\d{4}-\d{2}-\d{2}$/.test(String(t.corte))?String(t.corte):"",aut:String(t.aut||"").slice(0,20),modalidad:["con_intereses","sin_intereses","diferida"].includes(t.modalidad)?t.modalidad:"con_intereses",manual:!!t.manual}}
function unirCuotas(st){ // capital + intereses del mismo pago → una sola "Cuota de crédito / leasing" con el valor real descontado
  const PART=["Pago crédito (capital)","Intereses y seguros de crédito","Leasing vivienda"];const g={};
  for(const m of st.mov||[]){if(!PART.includes(m.tipo))continue;const cred=(String(m.concepto).match(/(\d{4})\s*$/)||[])[1]||(/leasing/i.test(m.concepto+m.desc+m.categoria)?"leasing":"x");const k=[m.fecha,m.cuenta,m.desc,cred].join("|");(g[k]=g[k]||[]).push(m)}
  const quitar=new Set();st.eliminados=st.eliminados||[];
  for(const L of Object.values(g)){const base=L.find(x=>x.tipo==="Pago crédito (capital)")||L[0];const tot=L.reduce((a,x)=>a+(+x.valor||0),0);
    const cred=(String(base.concepto).match(/(\d{4})\s*$/)||[])[1];const canon=(String(base.concepto).match(/canon\s*(\d+)/i)||[])[1];
    const nombre=/leasing/i.test(base.concepto+base.desc+base.categoria)?`Cuota leasing apartamento${canon?" (canon "+canon+")":""}`:cred==="3232"?"Cuota crédito Notebook (3232)":cred==="9549"?"Cuota crédito Sofá (9549)":"Cuota de crédito"+(cred?" "+cred:"");
    const det=L.map(x=>/capital/i.test(x.tipo)?"capital "+Math.round(x.valor):"intereses y seguros "+Math.round(x.valor)).join(", ");
    Object.assign(base,{tipo:"Cuota de crédito / leasing",valor:Math.round(tot*100)/100,concepto:nombre,categoria:"Leasing y créditos",nota:[base.nota,L.length>1?"Detalle: "+det:""].filter(Boolean).join(" · "),editado:new Date().toISOString()});
    for(const x of L)if(x!==base){quitar.add(x.id);st.eliminados.push({id:x.id,fecha:new Date().toISOString()})}}
  for(const m of st.mov||[])if(m.tipo==="Pago deuda sin desglose"){m.tipo="Cuota de crédito / leasing";m.categoria="Leasing y créditos"}
  st.mov=(st.mov||[]).filter(m=>!quitar.has(m.id))}
function migrar(st){
  st=Object.assign(defaults(),st);
  if(st.tipos)for(const d of TIPOS_DEF)if(!st.tipos.find(x=>x.tipo===d.tipo))st.tipos.push(d);
  if(st.reglasVer!==REGLAS_VER){st.reglas=[...(st.reglas||[]).filter(r=>r.propia),...REGLAS_DEF.map(r=>Object.assign({},r))];st.reglas.forEach((r,i)=>r.id=i+1);st.reglasVer=REGLAS_VER}
  delete st.seedVer;
  // Validación estricta: todo dato que llega de un archivo se normaliza antes de mostrarse (defensa contra inyección de HTML)
  const ISO=/^\d{4}-\d{2}-\d{2}$/,ID=/^[A-Za-z0-9_-]{1,64}$/,str=v=>v==null?"":String(v).slice(0,2000);
  const normA=a=>{const o={tipo:a.tipo==="enlace"?"enlace":"archivo",nombre:str(a.nombre).slice(0,200),tipoDoc:str(a.tipoDoc),original:str(a.original),
      codigo:/^[0-9a-fx]{1,16}$/.test(String(a.codigo))?String(a.codigo):"",dur:Math.min(36000,Math.max(0,Math.round(+a.dur||0)))||undefined,fechaDoc:ISO.test(String(a.fechaDoc))?a.fechaDoc:"",savedAt:/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(String(a.savedAt))?a.savedAt:"",
      mime:/^[\w.+-]+\/[\w.+-]+$/.test(String(a.mime))&&!/html|xml|javascript|svg/i.test(String(a.mime))?a.mime:"application/octet-stream",tam:Math.abs(+a.tam)||0,enCarpeta:!!a.enCarpeta};
      if(o.tipo==="enlace")o.url=/^https?:\/\//i.test(String(a.url))?String(a.url):"";else{o.sha=/^[0-9a-f]{64}$/.test(String(a.sha))?a.sha:"";o.ruta=/^adjuntos\/(\d{4}\/\d{2}\/)?[\w.\-]+\.fma$/.test(String(a.ruta))?a.ruta:"";if(a.data)o.data=String(a.data)}
      return o};
  st.mov=(Array.isArray(st.mov)?st.mov:[]).filter(m=>m&&typeof m==="object"&&ISO.test(String(m.fecha))).map(m=>({
    id:ID.test(String(m.id))?String(m.id):uid(),fecha:String(m.fecha),cuenta:str(m.cuenta),desc:str(m.desc),estab:str(m.estab),concepto:str(m.concepto),categoria:str(m.categoria),
    tipo:str(m.tipo),valor:Math.abs(+m.valor)||0,origen:str(m.origen),conciliacion:["","conciliado","solo_banco","solo_registro","pendiente"].includes(m.conciliacion)?m.conciliacion:"",
    revisar:str(m.revisar),nota:str(m.nota),filaSheets:Number.isInteger(+m.filaSheets)&&m.filaSheets!==null&&m.filaSheets!==""?+m.filaSheets:null,hash:str(m.hash),revisado:!!m.revisado,
    recId:m.recId!=null&&m.recId!==""&&ID.test(String(m.recId))?String(m.recId):undefined,hora:/^([01]\d|2[0-3]):[0-5]\d$/.test(String(m.hora||""))?String(m.hora):undefined,pagador:["yo","fam","ext"].includes(m.pagador)?m.pagador:undefined,bzv:Number.isInteger(+m.bzv)&&+m.bzv>0?+m.bzv:undefined,orden:Number.isInteger(+m.orden)&&m.orden!==null&&m.orden!==""?+m.orden:undefined,tc:m.tc&&typeof m.tc==="object"?normTC(m.tc):undefined,editado:typeof m.editado==="string"&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(m.editado)?m.editado:null,
    adjuntos:(Array.isArray(m.adjuntos)?m.adjuntos:[]).filter(a=>a&&typeof a==="object").map(normA)}));
  const adjV=a=>a&&typeof a==="object";
  st.venc=(Array.isArray(st.venc)?st.venc:[]).filter(v=>v&&typeof v==="object"&&ISO.test(String(v.vence))).map(v=>({id:ID.test(String(v.id))?String(v.id):uid(),
    tipo:VTIPOS.includes(v.tipo)?v.tipo:"Otro",titulo:str(v.titulo).slice(0,200),comercio:str(v.comercio).slice(0,200),valor:Math.abs(+v.valor)||0,inicio:ISO.test(String(v.inicio))?v.inicio:"",
    meses:Math.max(0,Math.min(600,Math.floor(+v.meses||0))),vence:String(v.vence),avisar:Math.max(0,Math.min(3650,Math.floor(+v.avisar||0))),movId:ID.test(String(v.movId))?String(v.movId):"",
    nota:str(v.nota),estado:v.estado==="cerrado"?"cerrado":"activo",editado:typeof v.editado==="string"&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v.editado)?v.editado:null,
    adjuntos:(Array.isArray(v.adjuntos)?v.adjuntos:[]).filter(adjV).map(normA)}));
  const fISO=x=>ISO.test(String(x))?String(x):"";
  st.rec=(Array.isArray(st.rec)?st.rec:[]).filter(r=>r&&typeof r==="object"&&ISO.test(String(r.inicio))).map(r=>({id:ID.test(String(r.id))?String(r.id):uid(),nombre:str(r.nombre).slice(0,200),monto:Math.abs(+r.monto)||0,
    cada:Math.max(1,Math.min(120,Math.floor(+r.cada||1))),unidad:["meses","semanas","dias","anios"].includes(r.unidad)?r.unidad:"meses",inicio:String(r.inicio),cuenta:str(r.cuenta).slice(0,120),auto:!!r.auto,activo:r.activo!==false,
    avisar:Math.max(0,Math.min(365,Math.floor(+r.avisar||0))),fin:fISO(r.fin),tipo:RTIPOS.includes(r.tipo)?r.tipo:"Otro",categoria:str(r.categoria).slice(0,80),comercio:str(r.comercio).slice(0,200),patron:str(r.patron).slice(0,300),
    nota:str(r.nota),autoRegistro:!!r.autoRegistro,ultimoAuto:fISO(r.ultimoAuto),editado:typeof r.editado==="string"&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(r.editado)?r.editado:null,
    historial:(Array.isArray(r.historial)?r.historial:[]).filter(h=>h&&ISO.test(String(h.desde))).map(h=>({desde:String(h.desde),hasta:fISO(h.hasta),monto:h.monto!=null&&h.monto!==""?Math.abs(+h.monto)||0:null,cuenta:str(h.cuenta).slice(0,120),nota:str(h.nota).slice(0,300)}))}));
  st.tcRes=(Array.isArray(st.tcRes)?st.tcRes:[]).filter(r=>r&&ISO.test(String(r.corte))).map(r=>{const o={tarjeta:str(r.tarjeta).slice(0,40),moneda:r.moneda==="USD"?"USD":"COP",corte:String(r.corte),pagarAntes:fISO(r.pagarAntes)};for(const k of ["pagoTotal","pagoMinimo","deuda","cupo","cupoDisp","intereses","interesesMora","otrosCargos","compras","pagos","saldoAnterior"])o[k]=+r[k]||0;return o});
  st.tcTasas=(Array.isArray(st.tcTasas)?st.tcTasas:[]).filter(r=>r&&ISO.test(String(r.corte))).map(r=>({tarjeta:str(r.tarjeta).slice(0,40),corte:String(r.corte),categoria:str(r.categoria).slice(0,80),tasaMV:+r.tasaMV||0,tasaEA:+r.tasaEA||0}));
  st.mig=st.mig&&typeof st.mig==="object"?{cuotas1:!!st.mig.cuotas1,efectivo1:!!st.mig.efectivo1,nocheUTC1:!!st.mig.nocheUTC1,reglas2:!!st.mig.reglas2}:{};
  if(!st.mig.efectivo1){for(const m of st.mov)if(m.tipo==="Gasto de otra cuenta"&&/^efectivo$/i.test(m.cuenta)){m.tipo="Gasto en efectivo";m.editado=new Date().toISOString()}st.mig.efectivo1=true}
  {const f=st.familia&&typeof st.familia==="object"?st.familia:{};const cu={};if(f.cuentas&&typeof f.cuentas==="object")for(const [k,v] of Object.entries(f.cuentas))if(k!=="__proto__"&&["yo","fam","ext"].includes(v))cu[str(k).slice(0,120)]=v;
   st.familia={nombre:str(f.nombre).slice(0,40),cuentas:cu,compartidos:(Array.isArray(f.compartidos)?f.compartidos:[]).map(x=>str(x).slice(0,80)).filter(Boolean).slice(0,30),ingresos:(Array.isArray(f.ingresos)?f.ingresos:[]).filter(x=>x&&ISO.test(String(x.desde))).map(x=>({desde:String(x.desde),mensual:Math.max(0,+x.mensual||0),primaPct:Math.min(100,Math.max(0,+x.primaPct||0)),primaMeses:(Array.isArray(x.primaMeses)?x.primaMeses:[]).map(Number).filter(n=>n>=1&&n<=12)})).slice(0,50)}}
  if(!st.mig.cuotas1){unirCuotas(st);st.mig.cuotas1=true}
  if(!st.mig.reglas2){const k=r=>[r.patron,r.tipo,r.categoria,r.estab].join("|"),D=new Set(REGLAS_DEF.map(k));for(const r of st.reglas||[]){if(typeof r.patron==="string")r.patron=r.patron.replace(/\x08/g,"\\b");if(!r.propia&&!D.has(k(r)))r.propia=true}st.mig.reglas2=true}
  if(typeof migrarDiario==="function")migrarDiario(st,{ISO,ID,normA});else{st.diario=Array.isArray(st.diario)?st.diario:[];st.fichas=Array.isArray(st.fichas)?st.fichas:[]}
  if(typeof migrarSalud==="function")migrarSalud(st,{ISO,ID,normA});else{st.salud=Array.isArray(st.salud)?st.salud:[];st.perfilesSalud=Array.isArray(st.perfilesSalud)?st.perfilesSalud:[]}
  if(typeof migrarVinculos==="function")migrarVinculos(st,{ID});else st.vinculos=Array.isArray(st.vinculos)?st.vinculos:[];
  for(const f of MIGRAR_EXTRA)f(st,{ISO,ID,normA});
  st.precarga=st.precarga!==false;
  {const P=(Array.isArray(st.papelera)?st.papelera:[]).filter(p=>p&&["mov","venc","rec","diario","salud","biblio"].includes(p.tipo)&&p.obj&&typeof p.obj==="object"&&ID.test(String(p.obj.id))&&/^[\dT:.Z-]{10,30}$/.test(String(p.fecha)));
   if(P.length){const t=migrar({mig:{cuotas1:true},papelera:[],mov:P.filter(p=>p.tipo==="mov").map(p=>p.obj),venc:P.filter(p=>p.tipo==="venc").map(p=>p.obj),rec:P.filter(p=>p.tipo==="rec").map(p=>p.obj),diario:P.filter(p=>p.tipo==="diario").map(p=>p.obj),salud:P.filter(p=>p.tipo==="salud").map(p=>p.obj),biblio:P.filter(p=>p.tipo==="biblio").map(p=>p.obj)});
     const ok={};for(const k of ["mov","venc","rec","diario","salud","biblio"])for(const o of t[k]||[])ok[k+"|"+o.id]=o;
     st.papelera=P.map(p=>({tipo:p.tipo,fecha:String(p.fecha),obj:ok[p.tipo+"|"+String(p.obj.id)]})).filter(p=>p.obj).slice(-500)}else st.papelera=[]}
  st.restauracion=st.restauracion&&ID.test(String(st.restauracion.id))&&/^[\dT:.Z-]{10,30}$/.test(String(st.restauracion.fecha))?{id:String(st.restauracion.id),fecha:String(st.restauracion.fecha),de:str(st.restauracion.de).slice(0,30)}:null;
  st.eliminados=(Array.isArray(st.eliminados)?st.eliminados:[]).filter(x=>x&&ID.test(String(x.id))).map(x=>({id:String(x.id),fecha:str(x.fecha).slice(0,30)}));
  if(st.saldos&&typeof st.saldos==="object"){const s=st.saldos;st.saldos={fecha:ISO.test(String(s.fecha))?s.fecha:"2026-01-01",nota:str(s.nota),
    cuentas:(Array.isArray(s.cuentas)?s.cuentas:[]).map(c=>({nombre:str(c.nombre),saldo:+c.saldo||0})),
    deudas:(Array.isArray(s.deudas)?s.deudas:[]).map(d=>({nombre:str(d.nombre),saldo:+d.saldo||0,tipo:["tarjeta","credito","leasing"].includes(d.tipo)?d.tipo:"credito",cuota:+d.cuota||0}))}}
  st.cuentas=(Array.isArray(st.cuentas)?st.cuentas:[]).map(str);
  st.bloqueoMin=Math.min(120,Math.max(1,+st.bloqueoMin||10));
  const v=st.ventana||{};st.ventana={banco:Math.min(60,Math.max(0,+v.banco||4)),tc:Math.min(60,Math.max(0,+v.tc||7)),tolerancia:Math.min(50,Math.max(0,+v.tolerancia||3))};
  st.tipos=(Array.isArray(st.tipos)?st.tipos:TIPOS_DEF).filter(x=>x&&x.tipo).map(x=>({tipo:str(x.tipo).slice(0,80),gasto:+x.gasto||0,ingreso:+x.ingreso||0,flujo:+x.flujo||0,dtc:+x.dtc||0,dcred:+x.dcred||0,desc:str(x.desc).slice(0,300)}));
  st.reglas=(Array.isArray(st.reglas)?st.reglas:[]).filter(x=>x&&typeof x==="object").map(x=>({id:ID.test(String(x.id))?x.id:uid(),patron:str(x.patron).slice(0,300),tipo:str(x.tipo).slice(0,80),categoria:str(x.categoria).slice(0,80),estab:str(x.estab).slice(0,120),propia:!!x.propia}));
  if(st.mapaCuentasSheets&&typeof st.mapaCuentasSheets==="object"){const o={};for(const [k,v2] of Object.entries(st.mapaCuentasSheets))if(k!=="__proto__")o[str(k)]=str(v2);st.mapaCuentasSheets=o}
  st.seq=Math.max(0,Math.floor(+st.seq||0));st.syncPlano=st.syncPlano!==false;
  for(const k of ["ultimoRespaldo","ultimoSync","ultimaEdicion"])if(st[k]!=null&&!/^[\dT:.Z-]{10,30}$/.test(String(st[k])))delete st[k];
  st.formato=FORMATO;st.app=APP_ID;return st}
// Adjuntos del formato anterior (dentro del archivo) → archivos cifrados aparte
async function migrarAdj(){const viejos=S.archivos||{};let n=0;
  for(const m of S.mov)for(const a of m.adjuntos||[]){let d=a.data||(a.sha&&viejos[a.sha]&&viejos[a.sha].data);if(!d)continue;
    const bytes=dataURLtoBytes(d);const sha=await sha256(bytes);a.sha=sha;a.codigo=sha.slice(0,8);a.mime=a.mime||d.slice(5,d.indexOf(";"));a.tam=bytes.length;a.original=a.original||a.nombre;delete a.data;a.nombre=nombreAdj(m,a);a.ruta=rutaAdj(m,a);
    await guardarAdj(a,bytes);n++}
  delete S.archivos;return n}

// ======================= Dropbox: guardado automático y sincronización entre dispositivos =======================
// Todo lo que sale hacia Dropbox va CIFRADO (el mismo sobre .fmx y los .fma). La app solo puede hablar con
// api.dropboxapi.com y content.dropboxapi.com (CSP). Permiso mínimo: carpeta propia de la app ("App folder").
// El token de acceso de largo plazo vive dentro de tus datos cifrados; sin tu clave no se puede usar.
const DBX={token:null,exp:0,ocupado:false,pendiente:false,refresh:null,appKey:null,ultSync:0,error:""};
const DBX_RUTA="/datos/finanzas-memphis.fmx";
const REDIRECT=location.origin+location.pathname.replace(/index\.html$/,"");
const b64url=u=>u8b64(u).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const conDropbox=()=>!!(S&&S.dbx&&S.dbx.refresh);
async function dbxConectar(appKey){
  appKey=String(appKey||"").trim();if(!/^[a-z0-9]{8,32}$/i.test(appKey)){alert("Ese App key no parece válido");return}
  const v=b64url(crypto.getRandomValues(new Uint8Array(48)));const ch=b64url(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(v))));const st=b64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem("dbx_pkce",JSON.stringify({v,st,appKey}));await DB.set("dbxAppKey",appKey);
  if(S){clearTimeout(saveTimer);await persist()}
  location.href="https://www.dropbox.com/oauth2/authorize?"+new URLSearchParams({client_id:appKey,response_type:"code",code_challenge:ch,code_challenge_method:"S256",token_access_type:"offline",redirect_uri:REDIRECT,state:st})}
async function dbxRetorno(){ // al volver de Dropbox con ?code=…
  const q=new URLSearchParams(location.search);if(!q.has("code")&&!q.has("error"))return false;
  history.replaceState(null,"",REDIRECT);
  let p=null;try{p=JSON.parse(sessionStorage.getItem("dbx_pkce")||"null")}catch(e){}sessionStorage.removeItem("dbx_pkce");
  if(q.has("error")||!p||q.get("state")!==p.st){alert("No se completó la conexión con Dropbox.");return false}
  try{const r=await fetch("https://api.dropboxapi.com/oauth2/token",{method:"POST",body:new URLSearchParams({grant_type:"authorization_code",code:q.get("code"),client_id:p.appKey,code_verifier:p.v,redirect_uri:REDIRECT})});
    if(!r.ok)throw new Error("Dropbox respondió "+r.status);const j=await r.json();if(!j.refresh_token)throw new Error("Dropbox no entregó el permiso de largo plazo");
    DBX.refresh=j.refresh_token;DBX.appKey=p.appKey;DBX.token=j.access_token;DBX.exp=Date.now()+(j.expires_in||3600)*1000;return true}
  catch(e){alert("No se pudo conectar con Dropbox: "+e.message);return false}}
async function dbxTok(){if(DBX.token&&Date.now()<DBX.exp-60000)return DBX.token;
  const rt=(S&&S.dbx&&S.dbx.refresh)||DBX.refresh,ak=(S&&S.dbx&&S.dbx.appKey)||DBX.appKey;if(!rt)throw new Error("DBX_AUTH");
  const r=await fetch("https://api.dropboxapi.com/oauth2/token",{method:"POST",body:new URLSearchParams({grant_type:"refresh_token",refresh_token:rt,client_id:ak})});
  if(!r.ok){let j={};try{j=await r.json()}catch(e){}if(j.error==="invalid_grant")throw new Error("DBX_AUTH");throw new Error("Dropbox "+r.status)}
  const j=await r.json();DBX.token=j.access_token;DBX.exp=Date.now()+(j.expires_in||3600)*1000;return DBX.token}
const hdrArg=o=>JSON.stringify(o).replace(/[\u007f-￿]/g,c=>"\\u"+c.charCodeAt(0).toString(16).padStart(4,"0"));
async function dbxErr(r){if(r.status===401){DBX.token=null;return new Error("DBX_401")}if(r.status===409){const e=new Error("DBX_409");e.info=await r.json().catch(()=>({}));return e}return new Error("Dropbox "+r.status)}
async function _dbxMeta(path){path=rutaP(path);const r=await fetch("https://api.dropboxapi.com/2/files/get_metadata",{method:"POST",headers:{Authorization:"Bearer "+await dbxTok(),"Content-Type":"application/json"},body:JSON.stringify({path})});
  if(r.ok)return r.json();const e=await dbxErr(r);if(e.message==="DBX_409"&&e.info&&e.info.error&&e.info.error.path&&e.info.error.path[".tag"]==="not_found")return null;throw e}
async function _dbxDown(path){path=rutaP(path);const r=await fetch("https://content.dropboxapi.com/2/files/download",{method:"POST",headers:{Authorization:"Bearer "+await dbxTok(),"Dropbox-API-Arg":hdrArg({path})}});
  if(!r.ok){const e=await dbxErr(r);if(e.message==="DBX_409")return null;throw e}
  let rev=null;try{rev=JSON.parse(r.headers.get("Dropbox-API-Result")||"{}").rev||null}catch(e){}return{bytes:new Uint8Array(await r.arrayBuffer()),rev}}
async function _dbxUp(path,data,mode){path=rutaP(path);const r=await fetch("https://content.dropboxapi.com/2/files/upload",{method:"POST",headers:{Authorization:"Bearer "+await dbxTok(),"Content-Type":"application/octet-stream","Dropbox-API-Arg":hdrArg({path,mode:mode||"overwrite",mute:true,autorename:false,strict_conflict:true})},body:data});
  if(!r.ok)throw await dbxErr(r);return r.json()}
async function reint(f){try{return await f()}catch(e){if(e.message==="DBX_401")return await f();throw e}}
async function dbxMeta(p){return reint(()=>_dbxMeta(p))}
async function dbxDown(p){return reint(()=>_dbxDown(p))}
async function dbxUp(p,d,m){return reint(()=>_dbxUp(p,d,m))}
// ---- Fusión de cambios entre dispositivos (por movimiento, con ancestro común) ----
const huella=m=>{const a=[m.fecha,m.cuenta,m.desc,m.estab,m.concepto,m.categoria,m.tipo,+m.valor,m.nota,m.revisar,m.conciliacion,!!m.revisado,(m.adjuntos||[]).map(a=>a.sha||a.url||"").join(",")];if(m.hora)a.push("h"+m.hora);if(m.pagador)a.push("p"+m.pagador);return JSON.stringify(a)};
const huellas=L=>{const o={};for(const m of L)o[m.id]=huella(m);return o};
const huellaV=v=>JSON.stringify([v.tipo,v.titulo,v.comercio,+v.valor,v.inicio,+v.meses,v.vence,+v.avisar,v.movId,v.nota,v.estado,(v.adjuntos||[]).map(a=>a.sha||a.url||"").join(",")]);
const huellaR=r=>JSON.stringify([r.nombre,+r.monto,+r.cada,r.unidad,r.inicio,r.cuenta,r.auto,r.activo,+r.avisar,r.fin,r.tipo,r.categoria,r.comercio,r.patron,r.nota,r.autoRegistro,r.ultimoAuto,JSON.stringify(r.historial||[])]);
const huellasR=L=>{const o={};for(const r of L||[])o[r.id]=huellaR(r);return o};
const huellasV=L=>{const o={};for(const v of L||[])o[v.id]=huellaV(v);return o};
function fusionLista(Ll,Rl,base,borr,hf,remotoMasNuevo,ord){ // fusión de 3 vías por id
  const L=Object.fromEntries(Ll.map(m=>[m.id,m])),RM=Object.fromEntries(Rl.map(m=>[m.id,m]));const out=[];let nuevos=0,act=0,conf=0,quit=0;
  for(const id of new Set([...Object.keys(L),...Object.keys(RM)])){
    const l=L[id],r=RM[id];if(borr.has(id)){if(l)quit++;continue}
    if(l&&!r){out.push(l);continue}
    if(r&&!l){out.push(r);nuevos++;continue}
    const hl=hf(l),hr=hf(r),b=base[id];
    if(hl===hr)out.push(l);else if(hl===b){out.push(r);act++}else if(hr===b)out.push(l);
    else{conf++;const ganaR=(r.editado||"")!==(l.editado||"")?(r.editado||"")>(l.editado||""):remotoMasNuevo;out.push(ganaR?r:l);if(ganaR)act++}}
  out.sort(ord);const cambio=out.length!==Rl.length||out.some(m=>!RM[m.id]||hf(m)!==hf(RM[m.id]));
  return{out,nuevos,act,conf,quit,cambio}}
// Módulos nuevos registran aquí sus listas (fusión de 3 vías), su validación y sus ajustes
const LISTAS_EXTRA=[],MIGRAR_EXTRA=[],CONFIG_EXTRA=[];
const huellasExtra=(L,hf)=>{const o={};for(const x of L||[])o[x.id]=hf(x);return o};
function fusionar(R){ // R = estado remoto ya descifrado y migrado; modifica S
  const borr=new Map();for(const x of [...(S.eliminados||[]),...(R.eliminados||[])])if(!borr.has(x.id))borr.set(x.id,x);
  const remotoMasNuevo=(R.ultimaEdicion||"")>(S.ultimaEdicion||"");
  const a=fusionLista(S.mov,R.mov,S._base||{},borr,huella,remotoMasNuevo,(x,y)=>x.fecha.localeCompare(y.fecha));
  const b=fusionLista(S.venc||[],R.venc||[],S._baseV||{},borr,huellaV,remotoMasNuevo,(x,y)=>x.vence.localeCompare(y.vence));
  const c=fusionLista(S.rec||[],R.rec||[],S._baseR||{},borr,huellaR,remotoMasNuevo,(x,y)=>x.nombre.localeCompare(y.nombre));
  const d=fusionLista(S.diario||[],R.diario||[],S._baseD||{},borr,huellaD,remotoMasNuevo,(x,y)=>(x.fecha+(x.hora||"")).localeCompare(y.fecha+(y.hora||"")));
  const fi=fusionLista(S.fichas||[],R.fichas||[],S._baseFi||{},borr,huellaFi,remotoMasNuevo,(x,y)=>x.nombre.localeCompare(y.nombre));
  const sa=fusionLista(S.salud||[],R.salud||[],S._baseS||{},borr,huellaS,remotoMasNuevo,(x,y)=>(x.fecha+(x.hora||"")).localeCompare(y.fecha+(y.hora||"")));
  const pe=fusionLista(S.perfilesSalud||[],R.perfilesSalud||[],S._baseP||{},borr,huellaP,remotoMasNuevo,(x,y)=>x.nombre.localeCompare(y.nombre));
  const vi=fusionLista(S.vinculos||[],R.vinculos||[],S._baseVi||{},borr,huellaVi,remotoMasNuevo,(x,y)=>x.creado.localeCompare(y.creado));
  const EX=LISTAS_EXTRA.map(L=>({L,r:fusionLista(S[L.k]||[],R[L.k]||[],S[L.base]||{},borr,L.hf,remotoMasNuevo,L.ord)}));for(const {L,r} of EX)S[L.k]=r.out;
  {const k=new Set((S.sintomas||[]).map(normK));S.sintomas=[...(S.sintomas||[]),...(R.sintomas||[]).filter(x=>!k.has(normK(x)))]}
  S.mov=a.out;S.venc=b.out;S.rec=c.out;S.diario=d.out;S.fichas=fi.out;S.salud=sa.out;S.perfilesSalud=pe.out;S.vinculos=vi.out;S.eliminados=[...borr.values()].slice(-5000);
  {const pp=new Map();for(const p of [...(S.papelera||[]),...(R.papelera||[])])pp.set(p.tipo+"|"+p.obj.id+"|"+p.fecha,p);const lim=new Date(Date.now()-30*864e5).toISOString();S.papelera=[...pp.values()].filter(p=>p.fecha>=lim&&!(S[p.tipo]||[]).some(x=>x.id===p.obj.id)).sort((x,y)=>x.fecha.localeCompare(y.fecha)).slice(-500)}
  if(remotoMasNuevo){for(const k of ["saldos","ventana","tipos","mapaCuentasSheets","bloqueoMin","syncPlano","familia",...CONFIG_EXTRA])if(R[k]!=null)S[k]=R[k];
    const propias=new Map();for(const r of [...(S.reglas||[]),...(R.reglas||[])])if(r.propia)propias.set(r.patron+"|"+r.tipo,r);
    S.reglas=[...(R.reglas||[]).filter(r=>!r.propia),...propias.values()];}
  S.cuentas=[...new Set([...(S.cuentas||[]),...(R.cuentas||[])])];
  if(R.dek&&!Object.values(S.deks).includes(R.dek))S.deks["l"+[...crypto.getRandomValues(new Uint8Array(3))].map(b=>b.toString(16).padStart(2,"0")).join("")]=String(R.dek);
  if(R.deks&&typeof R.deks==="object")for(const [k,v] of Object.entries(R.deks))if(!S.deks[k]&&/^[0-9a-z]{2,8}$/.test(k))S.deks[k]=String(v);
  S._base=huellas(R.mov);S._baseV=huellasV(R.venc);S._baseR=huellasR(R.rec);S._baseD=huellasD(R.diario);S._baseFi=huellasFi(R.fichas);S._baseS=huellasS(R.salud);S._baseP=huellasP(R.perfilesSalud);S._baseVi=huellasVi(R.vinculos);for(const L of LISTAS_EXTRA)S[L.base]=huellasExtra(R[L.k],L.hf);
  const T=[a,b,c,d,fi,sa,pe,vi,...EX.map(x=>x.r)],sum=k=>T.reduce((x,y)=>x+y[k],0);
  return{nuevos:sum("nuevos"),act:sum("act"),conf:sum("conf"),quit:sum("quit"),cambioLocal:T.some(x=>x.cambio)||(R.sintomas||[]).length!==(S.sintomas||[]).length}}
async function abrirRemoto(texto){let o;try{o=JSON.parse(texto)}catch(e){throw new Error("DBX_DANADO")}if(!esSobre(o))throw new Error("DBX_DANADO");
  try{return await abrirRemoto2(o)}catch(e){if(e.message==="DBX_CLAVE")throw e;if(/Clave incorrecta/.test(e.message))throw new Error("DBX_CLAVE");throw new Error("DBX_DANADO")}}
async function abrirRemoto2(o){
  if(o.kdf.salt===u8b64(CR.salt)){ // misma clave
    let plano=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(o.enc.iv),additionalData:AAD_DATOS},CR.kek,b64u8(o.ct)));if(o.gz)plano=await gz(plano,"d");return migrar(JSON.parse(dec.decode(plano)))}
  const f=await pedirClave("La clave se cambió en otro dispositivo. Escribe la clave NUEVA para seguir sincronizando.");if(!f)throw new Error("DBX_CLAVE");
  return migrar(await abrirSobre(o,f))}
function pedirClave(msg){if(editando())return Promise.resolve(null);return new Promise(ok=>{let v=null;dlg("Clave",`<p class="small">${esc(msg)}</p><input type="password" id="pcK" style="width:100%">`,[["Cancelar","",()=>cerrar()],["Usar","p",()=>{v=$("#pcK").value;cerrar()}]]);$("#dlg").addEventListener("close",()=>ok(v),{once:true})})}
function editando(){return $("#dlg").open}
async function dbxSync(motivo){
  if(!conDropbox())return;if(DBX.pausa&&motivo!=="manual")return;if(motivo==="manual"){DBX.pausa=false;DBX.danado=false}if(DBX.ocupado){DBX.pendiente=true;return}DBX.ocupado=true;
  try{
    status("Sincronizando con Dropbox…");
    const meta=await dbxMeta(DBX_RUTA);let res=null;
    if(meta&&meta.rev!==S.dbx.rev){const d=await dbxDown(DBX_RUTA);if(d){const R=await abrirRemoto(dec.decode(d.bytes));const seqMax=+(await DB.get("dbxSeqMax"))||0;
        if(seqMax&&(+R.seq||0)<seqMax)aviso("Atención: el archivo en Dropbox es más antiguo que el último que este dispositivo vio (¿restauraron una versión vieja?). Se fusionó sin perder tus cambios.");
        const miDbx=S.dbx;const rR=R.restauracion,rS=S.restauracion;
        if(rR&&(!rS||(rR.id!==rS.id&&rR.fecha>rS.fecha))){await respaldoAuto("antes de recibir restauración");S=R;res={nuevos:0,act:0,conf:0,quit:0,cambioLocal:false};S._base=huellas(R.mov);S._baseV=huellasV(R.venc);S._baseR=huellasR(R.rec);S._baseD=huellasD(R.diario);S._baseFi=huellasFi(R.fichas);S._baseS=huellasS(R.salud);S._baseP=huellasP(R.perfilesSalud);S._baseVi=huellasVi(R.vinculos);for(const L of LISTAS_EXTRA)S[L.base]=huellasExtra(R[L.k],L.hf);aviso(`Se aplicó la restauración hecha en otro dispositivo (datos del ${rR.de||rR.fecha.slice(0,10)}).`);if(!editando())setTimeout(render,50)}
        else if(rS&&S.dbx.sucio&&(!rR||(rS.id!==rR.id&&rS.fecha>rR.fecha))){res={nuevos:0,act:0,conf:0,quit:0,cambioLocal:true}} // mi restauración manda: no se mezcla con lo viejo
        else res=fusionar(R);if((+R.seq||0)>(+S.seq||0))S.seq=+R.seq;S.dbx=miDbx;await cargarDek();S.dbx.rev=d.rev||meta.rev;if(res.cambioLocal)S.dbx.sucio=true}}
    if(!meta||S.dbx.sucio){
      const g=GEN,snap=huellas(S.mov),snapV=huellasV(S.venc),snapR=huellasR(S.rec),snapD=huellasD(S.diario),snapFi=huellasFi(S.fichas),snapS=huellasS(S.salud),snapP=huellasP(S.perfilesSalud),snapVi=huellasVi(S.vinculos),snapEx=LISTAS_EXTRA.map(L=>[L.base,huellasExtra(S[L.k],L.hf)]);S.seq=(+S.seq||0)+1;const sobre=await sellar(S);
      try{const r=await dbxUp(DBX_RUTA,sobre,meta?{".tag":"update",update:S.dbx.rev}:{".tag":"add"});S.dbx.rev=r.rev;S._base=snap;S._baseV=snapV;S._baseR=snapR;S._baseD=snapD;S._baseFi=snapFi;S._baseS=snapS;S._baseP=snapP;S._baseVi=snapVi;for(const [b,h] of snapEx)S[b]=h;await DB.set("dbxSeqMax",S.seq);
        if(GEN===g)S.dbx.sucio=false;else DBX.pendiente=true}
      catch(e){if(e.message==="DBX_409"){DBX.pendiente=true}else throw e}
      if(!S.dbx.sucio){const hoy=new Date().toISOString().slice(0,10);
        if(S.ultimoRespaldo!==hoy){await dbxUp(`/respaldos/finanzas-memphis_${hoy}.fmx`,sobre,{".tag":"overwrite"});S.ultimoRespaldo=hoy}
        if(S.syncPlano!==false&&(motivo==="bloqueo"||motivo==="manual"||Date.now()-DBX.ultSync>10*60000)){await dbxUp("/sync/finanzas_sync.json",datosSync(),{".tag":"overwrite"});S.ultimoSync=new Date().toISOString();DBX.ultSync=Date.now()}}}
    await DB.set("estado",await sellar(S));DBX.error="";
    if(res&&(res.nuevos||res.act||res.quit)){const t=[res.nuevos&&res.nuevos+" nuevos",res.act&&res.act+" actualizados",res.quit&&res.quit+" eliminados"].filter(Boolean).join(", ");
      aviso(`Cambios desde otro dispositivo: ${t}${res.conf?` (${res.conf} editados en ambos: quedó la versión más reciente)`:""}.`);if(!editando())render()}
    status("Sincronizado con Dropbox · "+new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}));setTimeout(()=>{trabajarCola();precargarAdj()},2500);
  }catch(e){
    if(e.message==="DBX_AUTH"){DBX.error="Dropbox pidió volver a conectar (Datos › Dropbox).";S.dbx.refresh=null;await DB.set("estado",await sellar(S))}
    else if(e.message==="DBX_CLAVE"){DBX.error="Sincronización en pausa: la clave cambió en otro dispositivo. Toca Datos › Sincronizar ahora.";DBX.pausa=true}
    else if(e.message==="DBX_DANADO"){DBX.error="El archivo en Dropbox está dañado o no es de tus datos. Revisa Datos › Dropbox.";DBX.pausa=true;DBX.danado=true}
    else DBX.error="Sin conexión con Dropbox; se reintentará.";
    status(DBX.error)}
  finally{DBX.ocupado=false;if(DBX.pendiente&&conDropbox()&&!DBX.pausa){DBX.pendiente=false;DBX.intentos=(DBX.intentos||0)+1;setTimeout(()=>dbxSync("pendiente"),Math.min(60000,1500*2**Math.min(DBX.intentos,6)))}else if(!DBX.error)DBX.intentos=0}}
function aviso(t){let a=$("#aviso");if(!a){a=document.createElement("div");a.id="aviso";document.body.appendChild(a)}a.textContent=t;a.classList.add("on");clearTimeout(a._t);a._t=setTimeout(()=>a.classList.remove("on"),7000)}
// ======================= Respaldos, papelera y deshacer =======================
// Respaldos CIFRADOS (mismo formato .fmx). Se guardan en este dispositivo y, si está conectado, en Dropbox:
//   respaldos/automaticos (3 últimos: al abrir y antes de operaciones grandes) · respaldos/manuales (3 últimos)
//   respaldos/semanales (6 últimas semanas) · respaldos/mensuales (12 últimos meses)
const BK={automaticos:3,manuales:3,semanales:6,mensuales:12};
const BKN={automaticos:"Automático",manuales:"Manual",semanales:"Semanal",mensuales:"Mensual"};
function semanaISO(f){const d=new Date(f+"T00:00:00");const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const dn=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-dn+3);const y=t.getUTCFullYear();const w=1+Math.round(((t-new Date(Date.UTC(y,0,4)))/864e5-3+((new Date(Date.UTC(y,0,4)).getUTCDay()+6)%7))/7);return y+"-S"+String(w).padStart(2,"0")}
function nombreBk(tipo,st,etq){const d=new Date(),loc=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString();const f=loc.slice(0,10)+"_"+loc.slice(11,13)+loc.slice(14,16)+loc.slice(17,19);
  return`${f}__${(st.mov||[]).length}m-${(st.venc||[]).length}v-${(st.rec||[]).length}r${etq?"__"+slug(etq).toLowerCase():""}.fmx`}
function infoBk(tipo,nombre){const m=nombre.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})(\d{2})?__(\d+)m-(\d+)v-(\d+)r(?:__([a-z0-9-]+))?\.fmx$/);if(!m)return null;
  return{tipo,nombre,fecha:m[1]+" "+m[2]+":"+m[3],orden:m[1]+m[2]+m[3]+(m[4]||"00"),mov:+m[5],venc:+m[6],rec:+m[7],etq:(m[8]||"").replace(/-/g," ")}}
async function dbxListar(path){path=rutaP(path);try{const r=await fetch("https://api.dropboxapi.com/2/files/list_folder",{method:"POST",headers:{Authorization:"Bearer "+await dbxTok(),"Content-Type":"application/json"},body:JSON.stringify({path})});if(!r.ok)return[];const j=await r.json();return(j.entries||[]).filter(e=>e[".tag"]==="file").map(e=>e.name)}catch(e){return[]}}
async function dbxBorrar(path){path=rutaP(path);try{await fetch("https://api.dropboxapi.com/2/files/delete_v2",{method:"POST",headers:{Authorization:"Bearer "+await dbxTok(),"Content-Type":"application/json"},body:JSON.stringify({path})})}catch(e){}}
async function bkListar(){const out=new Map();
  for(const k of await DB.keys()){const m=String(k).match(/^bk:(\w+)\/(.+)$/);if(m){const i=infoBk(m[1],m[2]);if(i){i.local=true;out.set(m[1]+"/"+m[2],i)}}}
  if(conDropbox())for(const tipo of Object.keys(BK))for(const n of await dbxListar("/respaldos/"+tipo)){const i=infoBk(tipo,n);if(!i)continue;const k=tipo+"/"+n;if(out.has(k))out.get(k).nube=true;else{i.nube=true;out.set(k,i)}}
  if(dirHandle&&carpetaOK)for(const tipo of Object.keys(BK)){try{const d=await subdir("respaldos/"+tipo,false);for await(const [n] of d.entries()){const i=infoBk(tipo,n);if(!i)continue;const k=tipo+"/"+n;if(out.has(k))out.get(k).carpeta=true;else{i.carpeta=true;out.set(k,i)}}}catch(e){}}
  return[...out.values()].sort((a,b)=>b.orden.localeCompare(a.orden))}
async function bkGuardar(tipo,etq,sobre,st){st=st||S;const n=nombreBk(tipo,st,etq);const p=sobre?Promise.resolve(sobre):sellar(st);sobre=await p;
  await DB.set("bk:"+tipo+"/"+n,sobre);
  if(conDropbox())try{await dbxUp(`/respaldos/${tipo}/${n}`,sobre,{".tag":"overwrite"})}catch(e){}
  if(dirHandle&&carpetaOK)try{await escribir(`respaldos/${tipo}/${n}`,sobre)}catch(e){}
  await bkPodar(tipo);return n}
async function bkPodar(tipo){const L=(await bkListar()).filter(x=>x.tipo===tipo);
  // semanales/mensuales: uno por período (el más reciente de cada uno)
  let quitar=[];if(tipo==="semanales"||tipo==="mensuales"){const vistos=new Set();for(const x of L){const p=tipo==="semanales"?semanaISO(x.fecha.slice(0,10)):x.fecha.slice(0,7);if(vistos.has(p))quitar.push(x);else vistos.add(p)}}
  const rest=L.filter(x=>!quitar.includes(x));quitar=quitar.concat(rest.slice(BK[tipo]));
  for(const x of quitar){await DB.del("bk:"+tipo+"/"+x.nombre);if(conDropbox())await dbxBorrar(`/respaldos/${tipo}/${x.nombre}`);if(dirHandle&&carpetaOK)try{await (await subdir("respaldos/"+tipo,false)).removeEntry(x.nombre)}catch(e){}}}
async function bkLeer(x){let s=await DB.get("bk:"+x.tipo+"/"+x.nombre);
  if(!s&&conDropbox()){const d=await dbxDown(`/respaldos/${x.tipo}/${x.nombre}`);if(d)s=dec.decode(d.bytes)}
  if(!s&&dirHandle&&carpetaOK)try{s=await (await leer(`respaldos/${x.tipo}/${x.nombre}`)).text()}catch(e){}
  if(!s)throw new Error("No encuentro ese respaldo");return s}
async function abrirBk(texto){const o=JSON.parse(texto);if(!esSobre(o))throw new Error("El respaldo está dañado");if(o.kdf.salt===u8b64(CR.salt)){const kek=CR.kek;
    let plano=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(o.enc.iv),additionalData:AAD_DATOS},kek,b64u8(o.ct)));if(o.gz)plano=await gz(plano,"d");return migrar(JSON.parse(dec.decode(plano)))}
  const f=await pedirClave("Este respaldo se hizo con una clave anterior. Escribe esa clave para abrirlo.");if(!f)throw new Error("Cancelado");
  const kek=CR.kek,salt=CR.salt;try{return migrar(await abrirSobre(o,f))}finally{CR.kek=kek;CR.salt=salt}}
let ultimoAutoBk=0;
async function respaldoAuto(motivo,sobre,st){if(!S&&!st)return;try{await bkGuardar("automaticos",motivo,sobre,st);ultimoAutoBk=Date.now()}catch(e){}}
async function respaldosPeriodicos(){ // semanal y mensual: el primero de cada semana/mes
  const L=await bkListar(),hoy=hoyISO();
  if(!L.some(x=>x.tipo==="semanales"&&semanaISO(x.fecha.slice(0,10))===semanaISO(hoy)))await bkGuardar("semanales","");
  if(!L.some(x=>x.tipo==="mensuales"&&x.fecha.slice(0,7)===hoy.slice(0,7)))await bkGuardar("mensuales","")}
function compararEstados(A,B){ // qué tiene A (respaldo) frente a B (actual)
  const r={};for(const [k,h] of [["mov",huella],["venc",huellaV],["rec",huellaR],["diario",huellaD],["salud",huellaS]]){const a=Object.fromEntries((A[k]||[]).map(x=>[x.id,x])),b=Object.fromEntries((B[k]||[]).map(x=>[x.id,x]));
    const hb=new Set(Object.values(b).map(h));
    r[k]={faltan:Object.keys(a).filter(i=>!b[i]&&!hb.has(h(a[i]))).map(i=>a[i]),nuevos:Object.keys(b).filter(i=>!a[i]).map(i=>b[i]),distintos:Object.keys(a).filter(i=>b[i]&&h(a[i])!==h(b[i])).length}}
  return r}
async function vRespaldos(){
  dlg("Respaldos",`<p class="small">Tus respaldos van <b>cifrados</b>. Se guardan en este dispositivo${conDropbox()?" y en Dropbox › Aplicaciones › (carpeta de Memphis) › respaldos":dirHandle?" y en tu carpeta › respaldos":""}. Se conservan los ${BK.automaticos} automáticos más recientes (al abrir la app y antes de importar o restaurar), tus ${BK.manuales} manuales, ${BK.semanales} semanales y ${BK.mensuales} mensuales.</p>
   <div class="filters"><input id="bkE" placeholder="Nombre del respaldo, ej: antes de importar diciembre" style="flex:1"><button class="b p" id="bkN">Crear respaldo</button></div><div id="bkL" class="small muted">Cargando…</div>`,[["Cerrar","",cerrar]]);
  $("#bkN").onclick=async()=>{$("#bkN").disabled=true;await bkGuardar("manuales",$("#bkE").value.trim()||"manual");aviso("Respaldo creado");vRespaldos()};
  const L=await bkListar();
  $("#bkL").innerHTML=L.length?`<div class="tw"><table><tr><th>Fecha</th><th>Tipo</th><th>Contenido</th><th>Dónde</th><th></th></tr>${L.map((x,i)=>`<tr><td>${esc(x.fecha)}</td><td>${BKN[x.tipo]}${x.etq?`<div class="small muted">${esc(x.etq)}</div>`:""}</td><td class="small">${x.mov} mov · ${x.venc} venc. · ${x.rec} rec.</td><td class="small">${[x.local&&"aquí",x.nube&&"Dropbox",x.carpeta&&"carpeta"].filter(Boolean).join(" · ")}</td><td><button class="b s" data-bk="${i}">Ver / restaurar</button></td></tr>`).join("")}</table></div>`:"Todavía no hay respaldos.";
  document.querySelectorAll("[data-bk]").forEach(b=>b.onclick=()=>verRespaldo(L[+b.dataset.bk]))}
async function verRespaldo(x){let R;try{R=await abrirBk(await bkLeer(x))}catch(e){alert(e.message);return}
  const c=compararEstados(R,S);const ln=(k,n)=>`<li><b>${n}:</b> el respaldo tiene ${(R[k]||[]).length}, hoy hay ${(S[k]||[]).length}. ${c[k].faltan.length?`<b>${c[k].faltan.length}</b> que hoy no están`:""}${c[k].nuevos.length?` · ${c[k].nuevos.length} nuevos desde entonces`:""}${c[k].distintos?` · ${c[k].distintos} modificados`:""}</li>`;
  const falt=[...c.mov.faltan.map(m=>`${m.fecha} · ${esc(m.estab||m.desc)} · ${fmt(m.valor)}`),...c.venc.faltan.map(v=>`Vencimiento: ${esc(v.titulo)}`),...c.rec.faltan.map(r=>`Recurrente: ${esc(r.nombre)}`),...c.diario.faltan.map(e=>`Diario ${esc(e.fecha)}: ${esc(e.titulo||(e.texto||"").slice(0,50))}`),...c.salud.faltan.map(r=>`Salud ${esc(r.fecha)}: ${esc(r.titulo)}`)];
  dlg(`Respaldo del ${x.fecha}`,`<ul class="small">${ln("mov","Movimientos")}${ln("venc","Vencimientos")}${ln("rec","Recurrentes")}${ln("diario","Diario")}${ln("salud","Salud")}</ul>
    ${falt.length?`<details open><summary class="small">Lo que está en el respaldo y hoy no (${falt.length})</summary><div class="small" style="max-height:180px;overflow:auto">${falt.slice(0,200).map(t=>`<div>${t}</div>`).join("")}</div></details>`:'<p class="small muted">No falta nada: todo lo del respaldo sigue en tus datos.</p>'}
    <p class="small muted">Antes de restaurar se crea un respaldo de lo que tienes hoy, por si te arrepientes.</p>`,
   [["Volver","",()=>vRespaldos()],...(falt.length?[["Recuperar solo lo que falta","",async()=>{await respaldoAuto("antes de recuperar");let n=0;const ahora=new Date().toISOString();
      for(const k of ["mov","venc","rec","diario","salud"])for(const o of c[k].faltan){const y=structuredClone(o);y.id=uid();y.editado=ahora;(S[k]=S[k]||[]).push(y);n++}
      changed();cerrar();alert(n+" elementos recuperados.");render()}]]:[]),
    ["Restaurar todo","p",async()=>{if(!confirm(`Tus datos quedarán exactamente como estaban el ${x.fecha}. Lo que hiciste después se pierde (queda en el respaldo automático que se crea ahora). ¿Restaurar?`))return;
      await respaldoAuto("antes de restaurar");const miDbx=S.dbx;S=R;S.dbx=miDbx;if(S.dbx)S.dbx.sucio=true;S.restauracion={id:uid(),fecha:new Date().toISOString(),de:x.fecha};S.ultimaEdicion=new Date().toISOString();
      await cargarDek();await persist();cerrar();alert("Restaurado. Tus otros dispositivos tomarán esta versión en su próxima sincronización.");render()}]])}
// ---- Papelera (30 días) y Deshacer
function aPapelera(tipo,obj){S.papelera=S.papelera||[];S.papelera.push({tipo,obj:structuredClone(obj),fecha:new Date().toISOString()});
  const lim=new Date(Date.now()-30*864e5).toISOString();S.papelera=S.papelera.filter(p=>p.fecha>=lim).slice(-500)}
function borrarConPapelera(tipo,id){const L=S[tipo]||[];const o=L.find(x=>x.id===id);if(!o)return;S[tipo]=L.filter(x=>x.id!==id);(S.eliminados=S.eliminados||[]).push({id,fecha:new Date().toISOString()});aPapelera(tipo,o);changed();
  deshacer(`${tipo==="mov"?"Movimiento":tipo==="venc"?"Vencimiento":tipo==="diario"?"Entrada del diario":tipo==="salud"?"Registro de salud":tipo==="biblio"?"Elemento de la biblioteca":"Recurrente"} eliminad${tipo==="diario"?"a":"o"}`,()=>restaurarDePapelera(S.papelera.length-1,true))}
function restaurarDePapelera(i,silencio){const p=S.papelera[i];if(!p)return;const y=structuredClone(p.obj);const viejo=y.id;y.id=uid();{const pk={mov:"m",diario:"d",salud:"s",venc:"v",rec:"r",biblio:"b"}[p.tipo];if(pk)for(const v of S.vinculos||[]){if(v.a===pk+":"+viejo)v.a=pk+":"+y.id;if(v.b===pk+":"+viejo)v.b=pk+":"+y.id}}y.editado=new Date().toISOString();(S[p.tipo]=S[p.tipo]||[]).push(y);S.papelera.splice(i,1);changed();if(!silencio)aviso("Recuperado");render()}
function deshacer(texto,fn){let d=$("#deshacer");if(!d){d=document.createElement("div");d.id="deshacer";document.body.appendChild(d)}
  {const dl=$("#dlg"),host=dl&&dl.open?dl:document.body;if(d.parentNode!==host)host.appendChild(d)} // con un diálogo abierto, el aviso va dentro para poder tocarlo
  d.innerHTML=`<span>${esc(texto)}</span><button class="b s">Deshacer</button>`;d.classList.add("on");clearTimeout(d._t);
  d.querySelector("button").onclick=()=>{d.classList.remove("on");fn()};d._t=setTimeout(()=>d.classList.remove("on"),9000)}
function vPapelera(){const P=(S.papelera||[]).map((p,i)=>({p,i})).reverse();
  dlg("Papelera (30 días)",P.length?`<div class="tw"><table><tr><th>Borrado</th><th>Qué</th><th></th></tr>${P.map(({p,i})=>{const o=p.obj;const t=p.tipo==="mov"?`${esc(o.fecha)} · ${esc(o.estab||o.desc)} · ${fmt(o.valor)}`:p.tipo==="venc"?`Vencimiento: ${esc(o.titulo)}`:p.tipo==="diario"?`Diario ${esc(o.fecha)}: ${esc(o.titulo||(o.texto||"").slice(0,60))}`:p.tipo==="salud"?`Salud ${esc(o.fecha)}: ${esc(o.titulo)} (${esc((o.personas||[]).join(", "))})`:p.tipo==="biblio"?`Biblioteca: ${esc(o.titulo)}`:`Recurrente: ${esc(o.nombre)}`;
    return`<tr><td class="small">${esc(p.fecha.slice(0,16).replace("T"," "))}</td><td>${t}</td><td><button class="b s" data-pp="${i}">Recuperar</button></td></tr>`}).join("")}</table></div>`:'<p class="muted">La papelera está vacía.</p>',
   [...(P.length?[["Vaciar papelera","",()=>{if(confirm("¿Vaciar la papelera? No se puede deshacer.")){S.papelera=[];changed();cerrar()}}]]:[]),["Cerrar","",cerrar]]);
  document.querySelectorAll("[data-pp]").forEach(b=>b.onclick=()=>{restaurarDePapelera(+b.dataset.pp);vPapelera()})}
async function respaldosAlAbrir(){if(!S)return;try{const u=+(await DB.get("ultBkAuto"))||0;if(Date.now()-u>6*3600e3){await respaldoAuto("al abrir");await DB.set("ultBkAuto",Date.now())}await respaldosPeriodicos()}catch(e){}}
setInterval(()=>{if(conDropbox()&&!document.hidden)dbxSync("intervalo")},45000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&conDropbox())dbxSync("visible")});
window.addEventListener("online",()=>{if(conDropbox())dbxSync("online")});

// ======================= Arranque, bloqueo y desbloqueo =======================
let SOBRE=null,SOBRE_EXTERNO=false;
async function boot(){
  if(window.top!==window.self){document.body.innerHTML="";return} // no se deja abrir dentro de otra página (clickjacking)
  try{await DB.open()}catch(e){}
  if(!window.crypto||!crypto.subtle){$("#view").innerHTML=`<div class="card"><h2>Este navegador no permite cifrar</h2><p>Abre la app desde su dirección https:// (no como archivo suelto) en Chrome, Edge, Safari o Firefox actualizados.</p></div>`;return}
  dirHandle=await DB.get("dirHandle")||null;
  SOBRE=await DB.get("estado");
  if(await dbxRetorno()){
    if(!SOBRE){try{const d=await dbxDown(DBX_RUTA);if(d)SOBRE=dec.decode(d.bytes)}catch(e){}}
    if(SOBRE)pantallaBloqueo("Dropbox conectado ✓. Escribe tu clave para terminar.");
    else{pantallaBienvenida();aviso("Dropbox conectado ✓. Todavía no hay datos en Dropbox: importa tus datos o empieza desde cero.")}}
  else if(SOBRE)pantallaBloqueo();else pantallaBienvenida();
  if("serviceWorker" in navigator&&location.protocol==="https:"){navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(reg=>{let t0=Date.now();document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&Date.now()-t0>30*60000){t0=Date.now();reg.update().catch(()=>{})}})}).catch(()=>{});
    // si se instaló una versión nueva mientras la app estaba abierta, se avisa (o se recarga sola si está bloqueada)
    let hubo=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!hubo){hubo=true;return}if(!S){location.reload();return}
      if(!document.getElementById("nuevaV")){const d=document.createElement("div");d.id="nuevaV";d.className="toast";d.style.cssText="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99;display:flex;gap:8px;align-items:center;background:var(--card);border:1px solid var(--line);padding:10px 14px;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.2)";d.innerHTML='Hay una versión nueva de Memphis <button class="b s p">Actualizar</button>';d.querySelector("button").onclick=()=>{Promise.resolve(dirty?persist():0).catch(()=>{}).finally(()=>location.reload())};document.body.appendChild(d)}})}
}
function limpiarUI(){try{if($("#dlg").open)$("#dlg").close()}catch(e){}$("#dlgB").innerHTML="";$("#dlgF").innerHTML="";$("#dlgH").textContent="";ADJ=[];PREV=[];F={mes:"",cuenta:"",tipo:"",q:"",est:""};MESSEL="";for(const u of BLOBS)URL.revokeObjectURL(u);BLOBS.length=0;if(typeof MINI!=="undefined")MINI.clear();if(typeof pararGrab==="function")pararGrab(true);ADJPINTA=null;ADJOPC=null}
const BLOBS=[];
function modoBloqueado(on){document.body.classList.toggle("locked",on)}
function pantallaBienvenida(){modoBloqueado(true);S=null;
  $("#view").innerHTML=`<div class="lock card"><h2>Finanzas Memphis</h2>
   <p>Tus datos se guardan <b>cifrados</b> con una clave que solo tú conoces. Ni GitHub ni nadie más puede leerlos sin ella. A Dropbox solo le llegan cifrados (salvo el archivo de la sincronización semanal, si lo dejas activo).</p>
   <div class="opts">
    ${FSA?`<button class="b p" id="wDir">Abrir mi carpeta "Finanzas Memphis"</button>`:""}
    <button class="b ${FSA?"":"p"}" id="wFmx">Abrir mi archivo de datos (.fmx)</button>
    <button class="b p" id="wDbx">Conectar con Dropbox</button>
    <button class="b" id="wJson">Primera vez: importar datos sin cifrar (.json)</button>
    <button class="b" id="wNuevo">Empezar desde cero</button></div>
   <p class="small muted">${FSA?"En este computador puedes vincular la carpeta de Dropbox y la app guarda sola ahí.":"En este dispositivo abres y guardas el archivo a mano (por ejemplo desde la app de Dropbox)."}</p></div>`;
  if(FSA)$("#wDir").onclick=async()=>{try{const h=await window.showDirectoryPicker({id:"memphis",mode:"readwrite"});dirHandle=h;await DB.set("dirHandle",h);carpetaOK=true;
      let f=null;try{f=await leer(RUTA_DATOS)}catch(e){}
      if(f){SOBRE=await f.text();pantallaBloqueo("Carpeta vinculada. Escribe tu clave para abrir tus datos.")}
      else alert("La carpeta quedó vinculada pero todavía no tiene datos. Ahora importa tu archivo .json (primera vez) o empieza desde cero; la app guardará en "+h.name+"/datos/.")}catch(e){if(e.name!=="AbortError")alert(e.message)}};
  $("#wFmx").onclick=()=>elegirArchivo(".fmx,.json",async f=>{SOBRE=await f.text();SOBRE_EXTERNO=true;pantallaBloqueo()});
  $("#wJson").onclick=()=>elegirArchivo(".json",async f=>{let d;try{d=JSON.parse(await f.text())}catch(e){alert("No es un JSON válido");return}
    if(esSobre(d)){SOBRE=d;pantallaBloqueo();return}if(!d.mov){alert("No parece un archivo de Finanzas");return}crearClave(d)});
  $("#wNuevo").onclick=()=>crearClave(defaults());
  $("#wDbx").onclick=pedirAppKey;
}
function elegirArchivo(accept,fn){const i=document.createElement("input");i.type="file";i.accept=accept;i.onchange=()=>{if(i.files[0])fn(i.files[0]).catch(e=>alert(e.message))};i.click()}
function crearClave(datos){
  $("#view").innerHTML=`<div class="lock card"><h2>Crea tu clave</h2>
   <p class="small">Usa una <b>frase larga</b> que recuerdes, por ejemplo 4 o 5 palabras al azar. <b>Si la olvidas no hay forma de recuperar los datos</b>: guárdala en tu gestor de contraseñas.</p>
   <label>Clave</label><input type="password" id="k1" autocomplete="new-password" style="width:100%">
   <div class="meter"><div id="kM"></div></div><div class="small muted" id="kT"></div>
   <label>Repítela</label><input type="password" id="k2" autocomplete="new-password" style="width:100%">
   <div class="opts"><button class="b" id="kV">Volver</button><button class="b p" id="kOK">Cifrar y guardar</button></div></div>`;
  const pinta=()=>{const p=fuerza($("#k1").value);$("#kM").style.width=(p/6*100)+"%";$("#kM").style.background=p<3?"var(--bad)":p<5?"var(--warn)":"var(--ok)";$("#kT").textContent=["Muy débil","Muy débil","Débil","Aceptable","Buena","Fuerte","Muy fuerte"][p]};$("#k1").oninput=pinta;
  $("#kV").onclick=pantallaBienvenida;
  $("#kOK").onclick=async()=>{const a=$("#k1").value,b=$("#k2").value;if(a!==b){alert("Las claves no coinciden");return}if(a.length<12||fuerza(a)<3){alert("La clave es muy débil: usa al menos 12 caracteres, mejor una frase de varias palabras.");return}
    $("#kOK").disabled=true;$("#kOK").textContent="Cifrando…";await nuevaClave(a);S=migrar(datos);await cargarDek();const n=await migrarAdj();await persist();desbloqueado();
    alert("Listo: tus datos quedaron cifrados"+(n?` (y ${n} adjuntos)`:"")+".\n\n"+(dirHandle?"Se guardaron en tu carpeta "+dirHandle.name+".":"Ahora ve a Datos › Guardar archivo cifrado y guárdalo en Dropbox › Finanzas Memphis › datos.")+"\n\nBorra el archivo .json sin cifrar que usaste para importar.")}}
function pantallaBloqueo(msg){modoBloqueado(true);S=null;CR.kek=CR.dek=null;CR.deks=new Map();DBX.token=null;DBX.exp=0;limpiarUI();
  $("#view").innerHTML=`<div class="lock card"><h2>🔒 Finanzas Memphis</h2>${msg?`<p class="small">${esc(msg)}</p>`:""}
   <form id="uF"><label>Tu clave</label><input type="password" id="uK" autocomplete="current-password" style="width:100%" autofocus>
   <div class="opts"><button class="b p" id="uOK" type="submit">Abrir</button></div></form>
   <p class="small muted" id="uE"></p>
   <details class="small"><summary>Otras opciones</summary><div class="opts">${FSA?`<button class="b" id="uDir">${dirHandle?"Cambiar carpeta":"Abrir carpeta"}</button>`:""}<button class="b" id="uDbx">Conectar con Dropbox</button><button class="b" id="uFmx">Abrir otro archivo .fmx</button><button class="b" id="uOlvidar">Cerrar sesión en este dispositivo</button></div></details></div>`;
  $("#uF").onsubmit=async e=>{e.preventDefault();$("#uOK").disabled=true;$("#uOK").textContent="Abriendo…";$("#uE").textContent="";
    try{const k=$("#uK").value;let st;
      if(SOBRE_EXTERNO){st=await abrirSobre(SOBRE,k);delete st.dbx} // un archivo traído de otro lado no hereda el permiso de Dropbox de otro dispositivo
      else{st=await abrirSobre(SOBRE,k);
        if(!(st.dbx&&st.dbx.refresh)&&dirHandle&&await permiso(dirHandle,true)){carpetaOK=true;let fuente=null;try{fuente=await (await leer(RUTA_DATOS)).text()}catch(x){}
          if(fuente&&fuente!==SOBRE){const car=await abrirSobre(fuente,k);if((car.ultimaEdicion||"")>(st.ultimaEdicion||"")||confirm("Este dispositivo tiene cambios más recientes que el archivo de la carpeta. ¿Usar los de este dispositivo? (Cancelar = usar los de la carpeta)")===false)st=car}}}
      SOBRE_EXTERNO=false;
      S=migrar(st);await cargarDek();await persist();desbloqueado()}
    catch(x){$("#uE").textContent=x.message;$("#uOK").disabled=false;$("#uOK").textContent="Abrir"}};
  if(FSA)$("#uDir").onclick=async()=>{try{const h=await window.showDirectoryPicker({id:"memphis",mode:"readwrite"});dirHandle=h;await DB.set("dirHandle",h);carpetaOK=true;try{SOBRE=await (await leer(RUTA_DATOS)).text()}catch(e){}pantallaBloqueo("Carpeta: "+h.name)}catch(e){}};
  $("#uFmx").onclick=()=>elegirArchivo(".fmx,.json",async f=>{SOBRE=await f.text();SOBRE_EXTERNO=true;dirHandle=null;await DB.del("dirHandle");pantallaBloqueo("Archivo: "+f.name)});
  $("#uOlvidar").onclick=olvidarDispositivo;$("#uDbx").onclick=pedirAppKey;
  setTimeout(()=>$("#uK")&&$("#uK").focus(),50);
}
const DBX_APPKEY="n5776obktpw8sds"; // identificador PÚBLICO de la app de Dropbox (no es secreto)
async function pedirAppKey(){const k=await DB.get("dbxAppKey")||DBX_APPKEY;
  dlg("Conectar con Dropbox",`<p class="small">Pega el <b>App key</b> de tu app de Dropbox (dropbox.com/developers › tu app › Settings). Te llevaré a Dropbox para que autorices y volverás aquí.</p><input id="akK" value="${esc(k)}" style="width:100%" autocomplete="off">`,[["Cancelar","",cerrar],["Ir a Dropbox","p",()=>dbxConectar($("#akK").value)]])}
async function olvidarDispositivo(){if(!confirm("Se borra de ESTE dispositivo la copia cifrada de tus datos y de los adjuntos. Tu archivo en Dropbox no se toca. ¿Seguir?"))return;for(const k of await DB.keys())await DB.del(k);dirHandle=null;SOBRE=null;S=null;CR.kek=CR.dek=null;pantallaBienvenida()}
function desbloqueado(){modoBloqueado(false);ultimaAct=Date.now();
  setTimeout(()=>{const a=S&&alertaPagoTC();if(a)aviso(`💳 El pago de la tarjeta ${a.d<0?"venció":"vence"} el ${a.R.pagarAntes}: total ${fmt(a.R.pagoTotal)}, mínimo ${fmt(a.R.pagoMinimo)}.`)},4000);
  setTimeout(()=>{if(S)autoRegistrar();const nr=S&&alertasRec().filter(x=>x.est!=="futuro").length;if(nr)setTimeout(()=>aviso(`🔔 ${nr} cobro${nr>1?"s":""} recurrente${nr>1?"s":""} por atender: mira la pestaña Recurrentes.`),8000)},600);
  setTimeout(()=>{const n=S&&proximos().length;if(n)aviso(`⏰ Tienes ${n} vencimiento${n>1?"s":""} próximo${n>1?"s":""} o vencido${n>1?"s":""}: mira la pestaña Vencimientos.`)},1200);
  if(DBX.refresh){S.dbx={appKey:DBX.appKey,refresh:DBX.refresh,rev:null,sucio:false};DBX.refresh=null;persist()}
  setTimeout(respaldosAlAbrir,conDropbox()?6000:1500);try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}colaLeer().then(q=>pintaCola(q.length));
  if(conDropbox())setTimeout(()=>dbxSync("inicio"),300);if(dirHandle)status("Carpeta vinculada: "+dirHandle.name);if(typeof irModulo==="function")irModulo(MOD);else render()}
async function bloquear(){if(!S)return;if(dirty){clearTimeout(saveTimer);await persist()}if(conDropbox()){for(let i=0;i<20&&DBX.ocupado;i++)await new Promise(r=>setTimeout(r,250));await dbxSync("bloqueo")}SOBRE=await DB.get("estado");cerrar();pantallaBloqueo("Se bloqueó por inactividad.")}
let ultimaAct=Date.now();
["pointerdown","keydown","touchstart","scroll"].forEach(ev=>window.addEventListener(ev,()=>{ultimaAct=Date.now()},{passive:true}));
setInterval(()=>{if(!S)return;const m=typeof bloqueoDisp==="function"?bloqueoDisp():(S.bloqueoMin||10);if(m>0&&Date.now()-ultimaAct>m*60000)bloquear()},15000);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&S&&dirty){clearTimeout(saveTimer);persist()}});
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});

// ======================= Navegación =======================
let TAB="inicio",F={mes:"",cuenta:"",tipo:"",q:"",est:""},MESSEL="";
$("#tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;TAB=b.dataset.t;document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x===b));render()};
$("#btnNuevo").onclick=()=>editar(null);
$("#btnImp").onclick=importar;
$("#btnLock").onclick=bloquear;
function badgeV(){const b=document.querySelector('#tabs button[data-t="venc"]');if(b&&S){const n=proximos().length;b.textContent=n?`⏰ Vencimientos (${n})`:"⏰ Vencimientos"}const c=document.querySelector('#tabs button[data-t="rec"]');if(c&&S){const n=alertasRec().length;c.textContent=n?`🔁 Recurrentes (${n})`:"🔁 Recurrentes"}}
function render(){if(typeof MOD!=="undefined")document.body.dataset.mod=MOD;if(typeof MOD!=="undefined"&&MOD==="dia"&&S){syncTabsD();vDiario();return}if(typeof MOD!=="undefined"&&MOD==="sal"&&S&&typeof vSalud==="function"){syncTabsS();vSalud();return}if(typeof MOD!=="undefined"&&MOD==="bib"&&S&&typeof vBiblio==="function"){vBiblio();return}if(typeof MOD!=="undefined"&&MOD==="cur"&&S&&typeof vCursos==="function"){vCursos();return}if(typeof MOD!=="undefined"&&MOD==="proy"&&S&&typeof vProyectos==="function"){vProyectos();return}badgeV();({inicio:vInicio,resumen:vResumen,venc:vVenc,rec:vRec,graf:vGraf,mov:vMov,rev:vRev,deu:vDeu,reg:vReglas,cfg:vDatos})[TAB]()}
const meses=()=>[...new Set(S.mov.map(m=>m.fecha.slice(0,7)))].sort();

// ======================= Resumen =======================
function agrupar(){
  const R={};
  for(const m of S.mov){const k=m.fecha.slice(0,7);const r=R[k]||(R[k]={ing:0,gas:0,tc:0,fin:0,flu:0,dtc:0,dcr:0,otra:0,ptc:0,cap:0,n:0,rev:0});const c=calc(m);
    r.ing+=c.ingreso;r.gas+=c.gasto;r.flu+=c.flujo;r.dtc+=c.dtc;r.dcr+=c.dcred;r.n++;
    if(m.tipo==="Compra TC")r.tc+=c.gasto;
    if(/Cargo financiero|Intereses y seguros|Gasto financiero/.test(m.tipo))r.fin+=c.gasto;
    if(m.tipo==="Gasto de otra cuenta")r.otra+=+m.valor;
    if(m.tipo==="Pago tarjeta de crédito")r.ptc+=+m.valor;
    if(/Pago crédito|Pago deuda/.test(m.tipo))r.cap+=+m.valor;
    if(m.revisar||m.conciliacion==="solo_banco"&&isGastoAnotable(m))r.rev++;}
  return R;
}
function isGastoAnotable(m){return /Gasto débito|Compra TC|Transferencia a terceros|Retiro/.test(m.tipo)}
// ======================= Inicio: hoy, semana y mes =======================
function rangoInicio(){const h=hoyISO(),d=new Date(h+"T12:00:00"),dw=(d.getDay()+6)%7;return{hoy:h,lunes:restarDias(h,dw),mes:h.slice(0,7)+"-01"}}
function sumaRango(L,desde,hasta){const r={gas:0,yo:0,fam:0,ing:0,rec:0,n:0};for(const x of L){if(x.fecha<desde||x.fecha>hasta)continue;if(!x.v)r.n++;r.gas+=x.g;r[x.q==="fam"?"fam":"yo"]+=x.g;r.ing+=x.i;
    if(/Reembolso|Devolución/.test(x.tipo))r.rec+=x.valor}return r}
function vInicio(){const prev=LENTE;LENTE="todo";try{vInicio2()}finally{LENTE=prev}}
function vInicio2(){const R=rangoInicio(),L=lineas("todo"),H=sumaRango(L,R.hoy,R.hoy),W=sumaRango(L,R.lunes,R.hoy),M=sumaRango(L,R.mes,R.hoy),Mi=sumaRango(L,R.mes,R.mes.slice(0,7)+"-31");
  const dHoy=new Date(R.hoy+"T12:00:00").toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"});
  const hoyL=L.filter(x=>!x.v&&x.fecha===R.hoy).sort((a,b)=>(a.hora||"99").localeCompare(b.hora||"99")||((+a.m.orden||0)-(+b.m.orden||0)));
  const parte=x=>x.gas>0&&x.fam>0?`<div class="duo"><span style="width:${Math.max(0,x.yo)/x.gas*100}%;background:${COLQ.yo}"></span><span style="width:${x.fam/x.gas*100}%;background:${COLQ.fam}"></span></div><div class="small muted">🙋 yo ${fmt(x.yo)} · 💜 ${esc(famNombre())} ${fmt(x.fam)}</div>`:"";
  const caja=(ic,t,x,extra)=>`<div class="kpi ini"><div class="l">${ic} ${t}</div><div class="v neg">${fmt(x.gas)}</div><div class="small muted">gastado en familia · ${x.n} mov.${x.rec?` · devueltos ${fmt(x.rec)}`:""}</div>${parte(x)}${extra||""}</div>`;
  const catsM=sumQ(L.filter(x=>x.fecha>=R.mes&&x.fecha<=R.hoy),x=>x.cat,x=>x.g);
  const ATC=alertaPagoTC(),PV=proximos(),AR=alertasRec().filter(x=>x.est!=="futuro"),nRev=S.mov.filter(m=>m.revisar||m.conciliacion==="solo_banco"&&isGastoAnotable(m)&&!m.revisado).length;
  const sinFam=!S.familia||!S.familia.nombre;
  $("#view").innerHTML=`<div class="ini-top"><div><div class="small muted">👨‍👩‍👧 Resumen de la familia · hoy</div><h2 style="margin:0">${esc(dHoy.charAt(0).toUpperCase()+dHoy.slice(1))}</h2></div>
    <div class="ini-btns"><button class="b p grande" id="iNuevo">＋ Añadir movimiento</button><button class="b grande" id="iImp">⇪ Importar extracto</button></div></div>
   ${sinFam?`<div class="card alerta small">👨‍👩‍👧 Para ver aquí también lo que paga tu familiar desde su cuenta y sus ingresos, configúralo en <b>Datos › Familia</b>.</div>`:""}
   <div class="kpis">${caja("☀️","Hoy",H)}${caja("📅","Esta semana (desde el lunes)",W)}${caja("🗓️","Este mes",M,Mi.ing?`<div class="small" style="margin-top:4px">💰 Ingresos del mes ${fmt(Mi.ing)}${(S.familia.ingresos||[]).length?" (con sueldo estimado)":""} · <b class="${Mi.ing-M.gas>=0?"pos":"neg"}">queda ${fmt(Mi.ing-M.gas)}</b></div>`:"")}</div>
   ${ATC?`<div class="card alerta click" id="iTC"><b>💳 Pago de la tarjeta ${ATC.d<0?"vencido hace "+(-ATC.d)+" días":ATC.d===0?"vence HOY":"vence en "+ATC.d+" días"}</b> <span class="small">(${esc(ATC.R.pagarAntes)}) · total ${fmt(ATC.R.pagoTotal)} · mínimo ${fmt(ATC.R.pagoMinimo)}</span></div>`:""}
   <div class="g2">
    <div class="card"><h2>🧾 Movimientos de hoy</h2>${hoyL.length?hoyL.map(x=>`<div class="vrow click" data-id="${esc(x.id)}"><span class="small muted" style="display:inline-block;min-width:44px">${x.hora||"—"}</span> ${icoCat(x.cat)} <b>${esc(x.estab)}</b> <span class="small muted">${esc(x.cat)}</span>${x.q==="fam"?` <span class="chip fam">${esc(famNombre())}</span>`:""}<span style="float:right" class="${x.i||/Reembolso|Devolución/.test(x.tipo)?"pos":""}">${fmt(x.valor)}</span></div>`).join(""):'<p class="muted small">Todavía no hay movimientos hoy.</p>'}</div>
    <div class="card"><h2>🗓️ En qué se va el mes</h2>${barrasH(catsM,{n:7,ico:icoCat})}${leyendaQ()}</div></div>
   <div class="card ${PV.length?"alerta":""}"><h2>⏰ Garantías y vencimientos próximos</h2>${PV.length?PV.slice(0,8).map(v=>`<div class="click vrow" data-v="${esc(v.id)}"><span class="chip ${estadoV(v)[1]}">${esc(estadoV(v)[0])}</span> <b>${esc(v.titulo)}</b> <span class="small muted">${esc(v.tipo)} · ${esc(v.vence)}</span></div>`).join(""):'<p class="muted small">Nada vence pronto.</p>'}</div>
   ${AR.length?`<div class="card alerta"><h2>🔔 Cobros recurrentes por atender</h2>${AR.slice(0,6).map(x=>`<div class="click vrow" data-r="${esc(x.r.id)}"><span class="chip ${ESTR[x.est][1]}">${ESTR[x.est][0]}</span> <b>${esc(x.r.nombre)}</b> <span class="small muted">${esc(x.fecha)} · ${x.monto?fmt(x.monto):"variable"}</span></div>`).join("")}</div>`:""}
   <div class="filters">${nRev?`<button class="b" id="iRev">✅ Por revisar (${nRev})</button>`:""}<button class="b" id="iAho">🐷 Dónde ahorrar</button><button class="b" id="iAna">📊 Ver análisis completo →</button></div>`;
  const ir=t=>{TAB=t;document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.t===t));render()};
  $("#iNuevo").onclick=()=>editar(null);$("#iImp").onclick=importar;$("#iAna").onclick=()=>ir("resumen");$("#iAho").onclick=()=>{T.vista="ahorro";LENTE="todo";ir("graf")};if($("#iRev"))$("#iRev").onclick=()=>ir("rev");
  if($("#iTC"))$("#iTC").onclick=()=>{T.vista="tarjeta";ir("graf")};
  document.querySelectorAll("#view [data-id]").forEach(e=>e.onclick=()=>editar(e.dataset.id));document.querySelectorAll("#view [data-v]").forEach(e=>e.onclick=()=>editarV(e.dataset.v));document.querySelectorAll("#view [data-r]").forEach(e=>e.onclick=()=>editarR(e.dataset.r));
}
function vResumenFam(){const L=lineas(),ms=[...new Set(L.filter(x=>!x.v).map(x=>x.fecha.slice(0,7)))].sort();if(!MESSEL||!ms.includes(MESSEL))MESSEL=ms[ms.length-1]||"";
  const R={};for(const x of L){const k=x.fecha.slice(0,7);if(!ms.includes(k))continue;const r=R[k]||(R[k]={iy:0,if:0,gy:0,gf:0});if(x.q==="fam"){r.if+=x.i;r.gf+=x.g}else{r.iy+=x.i;r.gy+=x.g}}
  const r=R[MESSEL]||{iy:0,if:0,gy:0,gf:0},ing=r.iy+r.if,gas=r.gy+r.gf,mx=Math.max(1,...ms.map(k=>Math.max(R[k].iy+R[k].if,R[k].gy+R[k].gf)));
  const nm=esc(famNombre()),solo=LENTE==="fam";
  const cats=sumQ(L.filter(x=>x.fecha.startsWith(MESSEL)),x=>x.cat,x=>x.g);
  $("#view").innerHTML=`<div class="filters">${selLente("lR")}<select id="mesSel">${ms.map(k=>`<option ${k===MESSEL?"selected":""}>${k}</option>`).join("")}</select>
   <span class="muted small" style="align-self:center">${solo?`Solo el dinero de ${nm}: lo que paga desde su cuenta y sus ingresos estimados.`:`Todo el dinero de la familia: lo tuyo + lo de ${nm}. Lo que se pasan entre ustedes no se cuenta.`}</span></div>
  <div class="kpis">
   <div class="kpi"><div class="l">💰 Ingresos${solo?"":" de la familia"}</div><div class="v pos">${fmt(solo?r.if:ing)}</div>${solo?"":`<div class="small muted">🙋 yo ${fmt(r.iy)} · 💜 ${nm} ${fmt(r.if)}</div>`}</div>
   <div class="kpi"><div class="l">🧾 Gasto${solo?"":" de la familia"}</div><div class="v neg">${fmt(solo?r.gf:gas)}</div>${solo?"":`<div class="small muted">🙋 yo ${fmt(r.gy)} · 💜 ${nm} ${fmt(r.gf)}</div>`}</div>
   <div class="kpi"><div class="l">🐷 Ahorro (ingresos − gasto)</div><div class="v ${(solo?r.if-r.gf:ing-gas)>=0?"pos":"neg"}">${fmt(solo?r.if-r.gf:ing-gas)}</div><div class="small muted">${(solo?r.if:ing)?Math.round((solo?r.if-r.gf:ing-gas)/(solo?r.if:ing)*100)+"% de los ingresos":""}</div></div></div>
  <div class="card" style="margin-top:14px"><h2>📅 Mes a mes</h2><div class="tw"><table>
   <tr><th>Mes</th>${solo?"":`<th class="n">Mis ingresos</th>`}<th class="n">Ingresos ${nm}</th>${solo?"":`<th class="n">Mi gasto</th>`}<th class="n">Gasto ${nm}</th>${solo?"":`<th class="n">Gasto familia</th>`}<th class="n">Ahorro</th><th style="width:20%"></th></tr>
   ${ms.map(k=>{const x=R[k],i2=solo?x.if:x.iy+x.if,g2=solo?x.gf:x.gy+x.gf;return`<tr class="click" data-m="${k}"><td>${k}</td>${solo?"":`<td class="n">${fmt(x.iy)}</td>`}<td class="n">${fmt(x.if)}</td>${solo?"":`<td class="n">${fmt(x.gy)}</td>`}<td class="n">${fmt(x.gf)}</td>${solo?"":`<td class="n">${fmt(x.gy+x.gf)}</td>`}<td class="n ${i2-g2>=0?"pos":"neg"}">${fmt(i2-g2)}</td>
   <td><div class="bar" style="width:${i2/mx*100}%;background:var(--ok);opacity:.7"></div><div class="duo" style="margin-top:3px;width:${g2/mx*100}%">${solo?`<span style="width:100%;background:${COLQ.fam}"></span>`:`<span style="width:${g2?Math.max(0,x.gy)/g2*100:0}%;background:${COLQ.yo}"></span><span style="width:${g2?x.gf/g2*100:0}%;background:${COLQ.fam}"></span>`}</div></td></tr>`}).join("")}
  </table></div><div class="small muted">Verde = ingresos; azul = gasto tuyo; morado = gasto de ${nm}. ${(S.familia.ingresos||[]).length?`Los ingresos de ${nm} son estimados (Datos › Familia).`:""}</div></div>
  <div class="card"><h2>🏷️ Gasto por categoría · ${MESSEL}</h2>${barrasH(cats,{n:20,ico:icoCat})}${leyendaQ()}</div>`;
  $("#mesSel").onchange=e=>{MESSEL=e.target.value;render()};document.querySelectorAll("tr[data-m]").forEach(t=>t.onclick=()=>{MESSEL=t.dataset.m;render()})}
function vResumen(){if(LENTE!=="yo")return vResumenFam();
  const R=agrupar(),ms=Object.keys(R).sort();if(!MESSEL)MESSEL=ms[ms.length-1]||"";
  const PV=proximos();const cardV=PV.length?`<div class="card alerta"><h2>⏰ Vencimientos próximos</h2>${PV.slice(0,6).map(v=>`<div class="click vrow" data-v="${esc(v.id)}"><span class="chip ${estadoV(v)[1]}">${esc(estadoV(v)[0])}</span> <b>${esc(v.titulo)}</b> <span class="small muted">${esc(v.tipo)} · ${esc(v.vence)}</span></div>`).join("")}</div>`:"";
  const r=R[MESSEL]||{ing:0,gas:0,tc:0,fin:0,flu:0,dtc:0,dcr:0,otra:0};
  const cat={};for(const m of S.mov)if(m.fecha.startsWith(MESSEL)){const g=calc(m).gasto;if(g)cat[m.categoria||"Sin categoría"]=(cat[m.categoria||"Sin categoría"]||0)+g}
  const cs=Object.entries(cat).sort((a,b)=>b[1]-a[1]),mx=cs.length?cs[0][1]:1;
  const maxG=Math.max(1,...ms.map(k=>Math.max(R[k].gas,R[k].ing)));
  const AR=alertasRec();const cardR=AR.length?`<div class="card alerta"><h2>🔔 Cobros recurrentes por atender</h2>${AR.slice(0,6).map(x=>`<div class="click vrow" data-r="${esc(x.r.id)}"><span class="chip ${ESTR[x.est][1]}">${ESTR[x.est][0]}</span> <b>${esc(x.r.nombre)}</b> <span class="small muted">${esc(x.fecha)} · ${x.monto?fmt(x.monto):"variable"}</span></div>`).join("")}</div>`:"";
  const ATC=alertaPagoTC();const cardTC=ATC?`<div class="card alerta click" id="rTC"><h2>💳 Pago de la tarjeta: ${ATC.d<0?"venció hace "+(-ATC.d)+" días":ATC.d===0?"vence HOY":"vence en "+ATC.d+" días"} (${esc(ATC.R.pagarAntes)})</h2><div class="small">Pago total ${fmt(ATC.R.pagoTotal)} · mínimo ${fmt(ATC.R.pagoMinimo)}${ATC.pagado?` · ya pagaste ${fmt(ATC.pagado)}`:""}</div></div>`:"";
  $("#view").innerHTML=cardTC+cardV+cardR+`
  <div class="filters">${selLente("lR")}<select id="mesSel">${ms.map(k=>`<option ${k===MESSEL?"selected":""}>${k}</option>`).join("")}</select>
  <span class="muted small" style="align-self:center">Gasto real: las compras con tarjeta cuentan al comprar; pagar la tarjeta o abonar a capital no es gasto.</span></div>
  <div class="kpis">
   <div class="kpi"><div class="l">Ingresos</div><div class="v pos">${fmt(r.ing)}</div></div>
   <div class="kpi"><div class="l">Gasto real</div><div class="v neg">${fmt(r.gas)}</div><div class="small muted">con tarjeta ${fmt(r.tc)} · financieros ${fmt(r.fin)}</div></div>
   <div class="kpi"><div class="l">Ahorro real (ingresos − gasto)</div><div class="v ${r.ing-r.gas>=0?"pos":"neg"}">${fmt(r.ing-r.gas)}</div></div>
   <div class="kpi"><div class="l">Flujo de caja de tus cuentas</div><div class="v">${fmt(r.flu)}</div></div>
   <div class="kpi"><div class="l">Cambio deuda tarjeta</div><div class="v ${r.dtc>0?"neg":"pos"}">${r.dtc>0?"+":""}${fmt(r.dtc)}</div></div>
   <div class="kpi"><div class="l">Cambio deuda créditos</div><div class="v ${r.dcr>0?"neg":"pos"}">${r.dcr>0?"+":""}${fmt(r.dcr)}</div></div>
   <div class="kpi"><div class="l">Pagado desde otras cuentas</div><div class="v">${fmt(r.otra)}</div></div>
  </div>
  <div class="card" style="margin-top:14px"><h2>Mes a mes</h2><div class="tw"><table>
   <tr><th>Mes</th><th class="n">Ingresos</th><th class="n">Gasto real</th><th class="n">Con TC</th><th class="n">Financieros</th><th class="n">Ahorro</th><th class="n">Flujo caja</th><th class="n">Δ deuda TC</th><th class="n">Δ créditos</th><th style="width:22%"></th></tr>
   ${ms.map(k=>{const x=R[k];return`<tr class="click" data-m="${k}"><td>${k}</td><td class="n">${fmt(x.ing)}</td><td class="n">${fmt(x.gas)}</td><td class="n">${fmt(x.tc)}</td><td class="n">${fmt(x.fin)}</td><td class="n ${x.ing-x.gas>=0?"pos":"neg"}">${fmt(x.ing-x.gas)}</td><td class="n">${fmt(x.flu)}</td><td class="n">${fmt(x.dtc)}</td><td class="n">${fmt(x.dcr)}</td>
   <td><div class="bar" style="width:${x.ing/maxG*100}%;background:var(--ok);opacity:.7"></div><div class="bar" style="margin-top:3px;width:${x.gas/maxG*100}%;background:var(--bad);opacity:.7"></div></td></tr>`}).join("")}
  </table></div><div class="small muted">Verde = ingresos, rojo = gasto real.</div></div>
  <div class="card"><h2>Gasto real por categoría · ${MESSEL}</h2><table>${cs.map(([c,v])=>`<tr><td style="width:30%">${esc(c)}</td><td class="n" style="width:18%">${fmt(v)}</td><td><div class="bar" style="width:${v/mx*100}%"></div></td></tr>`).join("")||"<tr><td class=muted>Sin gastos</td></tr>"}</table></div>`;
  $("#mesSel").onchange=e=>{MESSEL=e.target.value;render()};
  document.querySelectorAll(".vrow[data-v]").forEach(e=>e.onclick=()=>editarV(e.dataset.v));document.querySelectorAll(".vrow[data-r]").forEach(e=>e.onclick=()=>editarR(e.dataset.r));if($("#rTC"))$("#rTC").onclick=()=>{T.vista="tarjeta";TAB="graf";document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.t==="graf"));render()};
  document.querySelectorAll("tr[data-m]").forEach(t=>t.onclick=()=>{MESSEL=t.dataset.m;render()});
}


// ======================= Hora del movimiento y categorías automáticas =======================
const NUMH={una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12};
function leerFechaHora(txt){ // "14:00", "2 pm", "2 de la tarde", "2026-11-23 2 PM", "23/11/2026 14:05", "mediodía", "3 y media de la tarde"
  let t=String(txt||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();if(!t)return{};
  let fecha="",m;
  if(m=t.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/)){fecha=`${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;t=t.replace(m[0]," ")}
  else if(m=t.match(/\b(\d{1,2})[\/](\d{1,2})[\/](\d{2,4})\b/)){const y=m[3].length===2?"20"+m[3]:m[3];fecha=`${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;t=t.replace(m[0]," ")}
  else if(/\bhoy\b/.test(t)){fecha=hoyISO();t=t.replace(/\bhoy\b/," ")}else if(/\bayer\b/.test(t)){fecha=restarDias(hoyISO(),1);t=t.replace(/\bayer\b/," ")}
  if(!fecha&&typeof leerCuando==="function"){const r=leerCuando(txt,hoyISO(),{modo:"pasado"});if(r.fecha){fecha=r.fecha;if(r.hora)return{fecha,hora:r.hora};t=String(r.resto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();if(!t)return{fecha}}}
  t=t.replace(/\b(a las|las|eso de|como a las|como a|tipo|hrs?|horas?)\b/g," ").replace(/^(a la|la)\s+(?=\d)/,"").replace(/\s+/g," ").trim();
  if(/mediodia/.test(t))return{fecha,hora:"12:00"};if(/medianoche/.test(t))return{fecha,hora:"00:00"};
  for(const [w,n] of Object.entries(NUMH))t=t.replace(new RegExp("\\b"+w+"\\b"),String(n));
  m=t.match(/(\d{1,2})(?:\s*[:.h]\s*(\d{2}))?(?:\s*y\s*(media|cuarto|\d{1,2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?|de la manana|de la madrugada|de la tarde|de la noche|del mediodia|manana|tarde|noche|madrugada)?/);
  if(!m)return{fecha};
  let h=+m[1],mi=m[2]?+m[2]:m[3]==="media"?30:m[3]==="cuarto"?15:m[3]?+m[3]:0;const suf=(m[4]||"").replace(/[\s.]/g,"");
  if(/^pm|tarde|noche|mediodia/.test(suf)){if(h<12)h+=12;if(/noche/.test(suf)&&h===24)h=0}
  else if(/^am|manana|madrugada/.test(suf)){if(h===12)h=0}
  if(h===24&&!mi)h=0;if(h>23||mi>59)return{fecha,error:true};
  return{fecha,hora:String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0")}}
const horaBonita=h=>{if(!h)return"";const [a,b]=h.split(":").map(Number);const s=a===0?"12":a>12?a-12:a;return`${h} (${s}${b?":"+String(b).padStart(2,"0"):""} ${a<12?"a. m.":"p. m."})`};
const ordenMov=(a,b)=>b.fecha.localeCompare(a.fecha)||(b.hora||"").localeCompare(a.hora||"")||((+b.orden||0)-(+a.orden||0));
const normK=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
function catAprendida(estab){const k=normK(estab);if(!k)return null;const c={};for(const m of S.mov)if(m.categoria&&normK(m.estab)===k)c[m.categoria]=(c[m.categoria]||0)+1;const e=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return e?e[0]:null}
function catAuto(estab,desc){const a=catAprendida(estab);if(a)return a;const r=regla(estab)||regla(desc);return r&&r.categoria?r.categoria:null}
// ======================= Movimientos =======================
const EST={conciliado:["ok","En banco y registro"],solo_banco:["bad","Solo en banco"],solo_registro:["warn","No está en el banco"],pendiente:["","Pendiente de extracto"],"":["",""]};
function filtrar(list){const q=F.q.toLowerCase();return list.filter(m=>(!F.mes||m.fecha.startsWith(F.mes))&&(!F.cuenta||m.cuenta===F.cuenta)&&(!F.tipo||m.tipo===F.tipo)&&(!F.est||m.conciliacion===F.est)&&(!q||(m.desc+" "+m.estab+" "+m.concepto+" "+m.categoria+" "+m.nota).toLowerCase().includes(q)))}
function vMov(){
  const ms=meses(),cuentas=[...new Set(S.mov.map(m=>m.cuenta))].sort();
  const L=filtrar(S.mov).sort(ordenMov);
  const tot=L.reduce((a,m)=>{const c=calc(m);a.g+=c.gasto;a.i+=c.ingreso;return a},{g:0,i:0});
  const show=L.slice(0,600);
  $("#view").innerHTML=`<div class="filters">
   <input id="fq" placeholder="Buscar…" value="${esc(F.q)}" style="flex:1;min-width:140px">
   <select id="fm"><option value="">Todos los meses</option>${ms.map(k=>`<option ${k===F.mes?"selected":""}>${k}</option>`).join("")}</select>
   <select id="fc"><option value="">Todas las cuentas</option>${cuentas.map(k=>`<option ${k===F.cuenta?"selected":""}>${esc(k)}</option>`).join("")}</select>
   <select id="ft"><option value="">Todos los tipos</option>${S.tipos.map(t=>`<option ${t.tipo===F.tipo?"selected":""}>${esc(t.tipo)}</option>`).join("")}</select>
   <select id="fe"><option value="">Cualquier estado</option>${Object.entries(EST).filter(e=>e[0]).map(([k,v])=>`<option value="${k}" ${k===F.est?"selected":""}>${v[1]}</option>`).join("")}</select></div>
  <div class="small muted" style="margin-bottom:6px">${L.length} movimientos · gasto real ${fmt(tot.g)} · ingresos ${fmt(tot.i)}${L.length>600?" · se muestran 600 (filtra para ver más)":""}</div>
  <div class="card" style="padding:0"><div class="tw"><table class="mov"><tr><th>Fecha</th><th>Cuenta</th><th>Establecimiento / concepto</th><th>Tipo</th><th class="n">Valor</th><th>Estado</th></tr>
  ${show.map(m=>`<tr class="click" data-id="${m.id}"><td>${m.fecha}${m.hora?`<div class="small muted">${m.hora}</div>`:""}</td><td class="small">${icoCuenta(m.cuenta)} ${esc(m.cuenta)}</td><td>${icoCat(m.categoria||"")} <b>${esc(m.estab||m.desc)}</b>${quien(m)==="fam"?` <span class="chip fam">${esc(famNombre())}</span>`:quien(m)==="ext"?` <span class="chip">otra persona</span>`:""}<div class="small muted">${esc(m.concepto)}${m.categoria?" · "+esc(m.categoria):""}${m.adjuntos&&m.adjuntos.length?" · 📎"+m.adjuntos.length:""}</div></td><td class="small">${esc(m.tipo)}</td><td class="n ${tipoInfo(m.tipo).ingreso?"pos":""}">${fmt(m.valor)}</td><td>${chipEst(m)}</td></tr>`).join("")}</table>
  <div class="mcard">${show.map(m=>`<div class="mc click" data-id="${m.id}"><div class="t"><span>${icoCat(m.categoria||"")} ${esc(m.estab||m.desc)}${quien(m)==="fam"?` <span class="chip fam">${esc(famNombre())}</span>`:""}</span><span class="${tipoInfo(m.tipo).ingreso?"pos":""}">${fmt(m.valor)}</span></div><div class="small muted">${m.fecha}${m.hora?" "+m.hora:""} · ${esc(m.cuenta)} · ${esc(m.tipo)}</div><div class="small">${esc(m.concepto)} ${chipEst(m)}</div></div>`).join("")}</div></div></div>`;
  const re=()=>vMov();
  $("#fq").oninput=e=>{F.q=e.target.value;clearTimeout(window._fq);window._fq=setTimeout(()=>{re();const i=$("#fq");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)};
  $("#fm").onchange=e=>{F.mes=e.target.value;re()};$("#fc").onchange=e=>{F.cuenta=e.target.value;re()};$("#ft").onchange=e=>{F.tipo=e.target.value;re()};$("#fe").onchange=e=>{F.est=e.target.value;re()};
  document.querySelectorAll("[data-id]").forEach(t=>t.onclick=()=>editar(t.dataset.id));
}
function chipEst(m){const e=EST[m.conciliacion||""]||["",""];return (e[1]?`<span class="chip ${e[0]}">${e[1]}</span>`:"")+(m.revisar?`<span class="chip warn">revisar</span>`:"")}

// ======================= Editar =======================
function dlg(h,body,btns){$("#dlg").classList.remove("ancho");$("#dlgH").textContent=h;$("#dlgB").innerHTML=body;const f=$("#dlgF");f.innerHTML="";for(const [t,cl,fn] of btns){const b=document.createElement("button");b.className="b "+(cl||"");b.textContent=t;b.onclick=fn;f.appendChild(b)}if(!$("#dlg").open)$("#dlg").showModal()}
const cerrar=()=>$("#dlg").close();
let ADJ=[];
function comercios(){const c={};for(const m of S.mov){const e=(m.estab||"").trim();if(!e)continue;const k=e.toLowerCase();c[k]=c[k]||{n:e,c:0};c[k].c++}return Object.values(c).sort((a,b)=>b.c-a.c).map(x=>x.n)}
function normalizarComercio(v){v=v.trim();if(!v)return v;const k=v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");const ex=comercios().find(c=>c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")===k);return ex||v}
function editar(id){
  const m=id?structuredClone(S.mov.find(x=>x.id===id)):{id:uid(),fecha:hoyISO(),cuenta:S.cuentas[0]||"",desc:"",estab:"",concepto:"",categoria:"",tipo:"Gasto débito",valor:0,origen:"manual",conciliacion:"",revisar:"",nota:"",adjuntos:[]};
  ADJ=m.adjuntos||[];
  const cats=[...new Set(S.mov.map(x=>x.categoria).filter(Boolean))].sort();
  dlg(id?"Editar movimiento":"Nuevo movimiento",`
   <div class="grid2"><div><label>Fecha</label><input type="date" id="eF" value="${m.fecha}" style="width:100%"></div>
   <div><label>Hora u orden (opcional)</label><input id="eH" value="${esc(m.hora||"")}" placeholder="14:00 · 2 pm · 2 de la tarde" style="width:100%" autocomplete="off"><div class="small muted" id="eHo"></div></div>
   <div><label>Valor (positivo)</label><input id="eV" inputmode="decimal" value="${m.valor}" style="width:100%"></div>
   <div><label>Cuenta</label><input id="eC" list="lCu" value="${esc(m.cuenta)}" style="width:100%"><datalist id="lCu">${S.cuentas.map(c=>`<option>${esc(c)}</option>`).join("")}</datalist></div>
   <div><label>¿De quién es el dinero?</label><select id="eP" style="width:100%"><option value="">Según la cuenta</option><option value="yo">🙋 Mío</option><option value="fam">💜 De ${esc(famNombre()==="Familia"?"mi familiar":famNombre())}</option><option value="ext">De otra persona (no cuenta)</option></select></div>
   <div><label>Tipo</label><select id="eT" style="width:100%">${S.tipos.map(t=>`<option ${t.tipo===m.tipo?"selected":""}>${esc(t.tipo)}</option>`).join("")}</select></div>
   <div><label>Establecimiento</label><input id="eE" list="lEs" value="${esc(m.estab)}" style="width:100%" autocomplete="off"><datalist id="lEs">${comercios().map(c=>`<option>${esc(c)}</option>`).join("")}</datalist></div>
   <div><label>Categoría</label><input id="eK" list="lCa" value="${esc(m.categoria)}" style="width:100%"><datalist id="lCa">${cats.map(c=>`<option>${esc(c)}</option>`).join("")}</datalist></div></div>
   <div id="eTC" style="display:${isTC(m.cuenta)?"block":"none"}" class="card"><b>Compra con tarjeta de crédito</b>
    <div class="grid2"><div><label>Número de cuotas</label><input id="eQn" type="number" min="1" max="72" value="${esc((m.tc&&m.tc.cuotas)||1)}"></div>
    <div><label>Modalidad</label><select id="eQm"><option value="con_intereses" ${!m.tc||m.tc.modalidad==="con_intereses"?"selected":""}>Con intereses</option><option value="sin_intereses" ${m.tc&&m.tc.modalidad==="sin_intereses"?"selected":""}>Sin intereses (precio de contado)</option><option value="diferida" ${m.tc&&m.tc.modalidad==="diferida"?"selected":""}>Diferida después</option></select></div>
    <div><label>Tasa mensual (%)</label><input id="eQi" inputmode="decimal" value="${esc(m.tc&&m.tc.tasaMV!=null?m.tc.tasaMV:"")}" placeholder="del extracto"></div>
    <div><label>Cuota que llevas</label><input id="eQa" type="number" min="1" value="${esc(m.tc&&m.tc.cuotaActual||"")}" placeholder="automático"></div></div>
    <div class="small muted" id="eQo"></div></div>
   <label>Concepto</label><input id="eCo" value="${esc(m.concepto)}" style="width:100%">
   <label>Descripción en el banco</label><input id="eD" value="${esc(m.desc)}" style="width:100%">
   <label>Nota / referencia / factura</label><input id="eN" value="${esc(m.nota)}" style="width:100%">
   <label>Revisar (déjalo vacío si ya está bien)</label><input id="eR" value="${esc(m.revisar)}" style="width:100%">
   ${htmlAdj("Facturas y documentos")}
   <label>Garantías y vencimientos</label><div id="eVenc"></div>
   <div class="small muted">${m.origen?"Origen: "+esc(m.origen):""} ${m.filaSheets?"· fila "+m.filaSheets+" en Sheets":""} · <span class="tipoDesc"></span></div>`,
   [...(id?[["Eliminar","",()=>{if(confirm("¿Eliminar este movimiento?")){borrarConPapelera("mov",id);cerrar();render()}}]]:[]),["Cancelar","",cerrar],["Guardar","p",()=>{guardarMov(false)}]]);
  function guardarMov(seguir){
     const v=parseNum($("#eV").value);if(!(v>=0)){alert("Valor inválido");return false}
     const fh=leerFechaHora($("#eH").value);if($("#eH").value.trim()&&!fh.hora&&!fh.fecha||fh.error){alert("No entendí la hora. Escribe por ejemplo 14:00, 2 pm o 2 de la tarde.");return false}
     if(fh.fecha)$("#eF").value=fh.fecha;if(fh.hora)m.hora=fh.hora;else delete m.hora;
     const i0=S.mov.findIndex(x=>x.id===m.id),antes=i0>=0?JSON.parse(JSON.stringify(S.mov[i0])):null;
     Object.assign(m,{fecha:$("#eF").value,valor:v,cuenta:$("#eC").value.trim(),tipo:$("#eT").value,estab:normalizarComercio($("#eE").value),categoria:$("#eK").value.trim(),concepto:$("#eCo").value.trim(),desc:$("#eD").value.trim(),nota:$("#eN").value.trim(),revisar:$("#eR").value.trim(),adjuntos:ADJ});
     for(const a of m.adjuntos){a.nombre=nombreAdj(m,a);if(a.tipo!=="enlace")a.ruta=a.ruta||rutaAdj(m,a)}m.editado=new Date().toISOString();
     if(isTC(m.cuenta)){const n=Math.max(1,+$("#eQn").value||1),ti=$("#eQi").value.trim();const prev=m.tc||{};
       if(n>1||prev.cuotas>1){m.tc=normTC(Object.assign({},prev,{cuotas:n,modalidad:$("#eQm").value,tasaMV:ti===""?prev.tasaMV:parseNum(ti),cuotaActual:+$("#eQa").value||prev.cuotaActual,manual:true,valorCuota:prev.corte?prev.valorCuota:null,saldo:prev.corte?prev.saldo:null}))}else delete m.tc}else delete m.tc;
     const pg=$("#eP").value;if(pg)m.pagador=pg;else delete m.pagador;m.tipo=tipoParaCuenta(m.cuenta,m.tipo,m.pagador);
     if(!S.cuentas.includes(m.cuenta))S.cuentas.push(m.cuenta);
     const i=S.mov.findIndex(x=>x.id===m.id);if(i>=0)S.mov[i]=m;else S.mov.push(m);changed();cerrar();if(!seguir)render();
     if(antes)deshacer("Movimiento guardado",()=>{const j=S.mov.findIndex(x=>x.id===antes.id);antes.editado=new Date().toISOString();if(j>=0)S.mov[j]=antes;else S.mov.push(antes);changed();render();aviso("Cambio deshecho")});return true}
  $("#eP").value=m.pagador||"";
  const sd=()=>{document.querySelector(".tipoDesc").textContent=tipoInfo($("#eT").value).desc||""};sd();$("#eT").onchange=sd;
  const vh=()=>{const v=$("#eH").value.trim(),r=leerFechaHora(v);$("#eHo").textContent=!v?"":r.error||(!r.hora&&!r.fecha)?"No la entiendo: prueba 14:00 o 2 pm":[r.fecha&&"fecha "+r.fecha,r.hora&&"→ "+horaBonita(r.hora)].filter(Boolean).join(" · ")};vh();$("#eH").oninput=vh;
  const ac=()=>{if($("#eK").value.trim())return;const c=catAuto($("#eE").value,$("#eD").value);if(c){$("#eK").value=c;$("#eK").classList.add("auto");$("#eK").title="Categoría automática (la puedes cambiar)"}};$("#eE").addEventListener("change",ac);$("#eE").addEventListener("blur",ac);
  const tcq=()=>{$("#eTC").style.display=isTC($("#eC").value)?"block":"none";const V=parseNum($("#eV").value)||0,n=Math.max(1,+$("#eQn").value||1),i=$("#eQm").value==="sin_intereses"?0:(parseNum($("#eQi").value)||((S.tcTasas||[]).slice(-1)[0]||{}).tasaMV||0)/100;
    $("#eQo").textContent=n>1?`Cuota ≈ ${fmt(cuotaFija(V,i,n))} al mes · pagarás ≈ ${fmt(cuotaFija(V,i,n)*n)} (${fmt(cuotaFija(V,i,n)*n-V)} de intereses)${m.tc&&m.tc.corte?` · según el extracto del ${m.tc.corte}: cuota ${m.tc.cuotaActual} de ${m.tc.cuotas}, debes ${fmt(m.tc.saldo||0)}`:""}`:"A 1 cuota: sin intereses si pagas el total en la fecha límite."};
  ["eQn","eQi","eV"].forEach(x=>$("#"+x).addEventListener("input",tcq));$("#eQm").onchange=tcq;$("#eC").addEventListener("input",tcq);tcq();
  bindAdj(movDlg,m.id);
  const vs=(S.venc||[]).filter(v=>v.movId===m.id);
  $("#eVenc").innerHTML=(vs.length?vs.map(v=>`<div class="small" style="padding:3px 0"><span class="chip ${estadoV(v)[1]}">${esc(estadoV(v)[0])}</span> <a href="#" data-ve="${esc(v.id)}">${esc(v.tipo)}: ${esc(v.titulo)}</a> · vence ${esc(v.vence)}</div>`).join(""):"")+`<button class="b s" id="eVAdd">+ Garantía / vencimiento de esta compra</button>`;
  document.querySelectorAll("[data-ve]").forEach(e=>e.onclick=ev=>{ev.preventDefault();if(guardarMov(true))editarV(e.dataset.ve)});
  $("#eVAdd").onclick=()=>{if(guardarMov(true))editarV(null,m.id)};
}
const DOCT=["Factura","Comprobante de pago","Garantía","Contrato","Cotización","Extracto","Otro"];
const slug=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,32)||"sin-nombre";
function hashTxt(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return("0000000"+(h>>>0).toString(16)).slice(-8)}
async function sha256(buf){const d=await crypto.subtle.digest("SHA-256",buf);return[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("")}
let ADJCTX=null,ADJPINTA=null,ADJOPC=null; // de dónde sale el nombre codificado de los adjuntos del diálogo abierto
function htmlAdj(titulo,tdDef){return`<label>${esc(titulo)}</label><div id="adjL"></div>
   <div class="filters" style="margin-top:6px"><select id="adjT">${DOCT.map(d=>`<option ${d===tdDef?"selected":""}>${d}</option>`).join("")}</select><button class="b s" id="adjF">📎 Archivo</button><button class="b s" id="adjC">📷 Foto</button></div>
   <div class="filters"><input id="adjU" placeholder="o pega un enlace (Drive, OneDrive, Dropbox…)" style="flex:1;min-width:180px"><button class="b s" id="adjAdd">Añadir enlace</button></div>
   <div class="small muted">Fotos, imágenes, PDF o cualquier archivo; se guardan cifrados con nombre codificado (fecha_comercio_valor_tipo_código). Si el mismo archivo ya está en otro registro, se enlaza sin duplicarlo.</div>`}
function bindAdj(ctx,propioId){ADJCTX=ctx;pintaAdj();
  $("#adjF").onclick=()=>{$("#attIn").value="";$("#attIn").click()};
  $("#adjC").onclick=()=>{$("#camIn").value="";$("#camIn").click()};
  $("#adjAdd").onclick=()=>{const u=$("#adjU").value.trim();if(!u)return;if(!/^https?:\/\//i.test(u)){alert("El enlace debe empezar por https://");return}if(ADJ.some(a=>a.url===u)){alert("Ese enlace ya está aquí");return}
    const otro=todosRegistros().find(([x])=>x.id!==propioId&&(x.adjuntos||[]).some(a=>a.url===u));if(otro&&!confirm(`Ese enlace ya está en ${otro[1]}. ¿Añadirlo también aquí?`))return;
    const c=ctx();const a={tipo:"enlace",url:u,tipoDoc:$("#adjT").value,fechaDoc:c.fecha,savedAt:new Date().toISOString(),codigo:hashTxt(u)};a.nombre=nombreAdj(c,a);ADJ.push(a);$("#adjU").value="";pintaAdj()}}
function todosAdj(){const o=[];for(const m of S.mov)for(const a of m.adjuntos||[])o.push([m,a]);for(const v of S.venc||[])for(const a of v.adjuntos||[])o.push([v,a]);for(const e of S.diario||[])for(const a of e.adjuntos||[])o.push([e,a]);for(const r of S.salud||[])for(const a of r.adjuntos||[])o.push([r,a]);for(const L of LISTAS_EXTRA)for(const x of S[L.k]||[])for(const a of x.adjuntos||[])o.push([x,a]);return o}
function todosRegistros(){return[...S.mov.map(m=>[m,`${m.fecha} · ${m.estab||m.desc} (${fmt(m.valor)})`]),...(S.venc||[]).map(v=>[v,`${v.tipo}: ${v.titulo} (vence ${v.vence})`]),...(S.diario||[]).map(e=>[e,`el diario (${e.fecha}${e.titulo?" · "+e.titulo:""})`]),...(S.salud||[]).map(r=>[r,`Salud (${r.fecha} · ${r.titulo})`])]}
async function comprimirImagen(f){ // fotos grandes del celular → JPEG de máx. 2200 px (la factura sigue legible y pesa mucho menos); el diario comprime más
  const O=ADJOPC||{max:2200,q:0.85,umbral:1.5*1024*1024};
  if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type)||f.size<O.umbral||typeof createImageBitmap==="undefined")return f;
  try{const bm=await createImageBitmap(f);const k=Math.min(1,O.max/Math.max(bm.width,bm.height));const c=document.createElement("canvas");c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext("2d").drawImage(bm,0,0,c.width,c.height);
    const b=await new Promise(ok=>c.toBlob(ok,"image/jpeg",O.q));if(!b||b.size>=f.size)return f;return new File([b],f.name.replace(/\.\w+$/,"")+".jpg",{type:"image/jpeg"})}catch(e){return f}}
function movDlg(){return{fecha:$("#eF").value,estab:$("#eE").value.trim(),concepto:$("#eCo").value.trim(),desc:$("#eD").value.trim(),valor:parseNum($("#eV").value)||0}}
function nombreAdj(m,a){const ext=a.tipo==="enlace"?"":(String(a.original||a.nombre||"").match(/\.[A-Za-z0-9]{1,5}$/)||[mimeExt(a.mime)])[0].toLowerCase();
  const f=m.fecha||a.fechaDoc||"";a.fechaDoc=f;
  const host=a.url?(a.url.match(/^https?:\/\/(?:www\.)?([^/]+)/i)||["",""])[1].split(".")[0]:"";
  return[f,slug(m.estab||m.concepto||m.desc),Math.round(+m.valor||0),slug(a.tipoDoc||"Documento"),(a.codigo||(a.sha||"").slice(0,8)||(a.url?hashTxt(a.url):"x"))].join("_")+(a.tipo==="enlace"?"_enlace-"+slug(host):ext)}
function mimeExt(m){return({"application/pdf":".pdf","image/jpeg":".jpg","image/png":".png","image/heic":".heic","image/webp":".webp","application/zip":".zip","text/xml":".xml","application/xml":".xml"})[m]||".bin"}
function rutaAdj(m,a){return`adjuntos/${String(a.sha).slice(0,32)}.fma`} // nombre opaco: el nombre legible vive cifrado en tus datos
function dataURLtoBytes(d){return b64u8(d.slice(d.indexOf(",")+1))}
async function guardarAdj(a,bytes){const c=await cifrarAdj(bytes,a.sha);await DB.set("adj:"+a.sha,c);
  if(conDropbox()&&a.ruta){a.enCarpeta=false;await colaPoner(a.sha,a.ruta);return} // se sube en segundo plano: guardar no espera a la red
  if(dirHandle&&carpetaOK&&a.ruta){try{await escribir(a.ruta,c);a.enCarpeta=true}catch(e){a.enCarpeta=false}}else a.enCarpeta=false}
// ---- Cola de subida de adjuntos: el texto se sincroniza al instante; los archivos suben solos, en orden y con reintentos,
// aunque cierres la app (la cola vive en este dispositivo). Mientras tanto el archivo cifrado ya está guardado aquí.
const COLA={activa:false,t:null,err:0};
async function colaLeer(){const q=await DB.get("colaAdj");return Array.isArray(q)?q:[]}
async function colaPoner(sha,ruta){const q=await colaLeer();if(!q.some(x=>x.sha===sha))q.push({sha,ruta,t:Date.now()});await DB.set("colaAdj",q);pintaCola(q.length);clearTimeout(COLA.t);COLA.t=setTimeout(trabajarCola,400)}
function pintaCola(n){let el=$("#colaAdj");if(!el){const st=$("#st");if(!st)return;el=document.createElement("span");el.id="colaAdj";el.className="status";st.after(el)}
  el.textContent=n?`⬆ ${n} adjunto${n>1?"s":""} subiendo…`:"";el.title=n?"Se suben en segundo plano. Puedes seguir usando la app.":""}
async function trabajarCola(){if(COLA.activa||!S||!conDropbox())return;if(navigator.onLine===false){pintaCola((await colaLeer()).length);return}COLA.activa=true;let subidos=0;
  try{let q=await colaLeer();
    while(q.length){const x=q[0],c=await DB.get("adj:"+x.sha);
      if(c){try{await dbxUp("/"+x.ruta,c,{".tag":"overwrite"})}catch(e){COLA.err++;const espera=Math.min(30*60e3,15e3*2**Math.min(7,COLA.err));clearTimeout(COLA.t);COLA.t=setTimeout(trabajarCola,espera);pintaCola(q.length);break}}
      COLA.err=0;subidos++;for(const [,a] of todosAdj())if(a.sha===x.sha)a.enCarpeta=true;
      q=(await colaLeer()).filter(y=>y.sha!==x.sha);await DB.set("colaAdj",q);pintaCola(q.length)}}
  finally{COLA.activa=false}
  if(subidos)changed()}
window.addEventListener("online",()=>{COLA.err=0;setTimeout(trabajarCola,1500)});
// ---- Precarga en segundo plano: trae a este dispositivo (cifradas) las fotos, audios y PDF recientes para verlos sin esperar
const PRE={activa:false,hecho:0};
async function precargarAdj(){if(PRE.activa||!S||S.precarga===false||!conDropbox()||navigator.onLine===false)return;const cx=navigator.connection;if(cx&&(cx.saveData||/2g/.test(cx.effectiveType||"")))return;
  if(Date.now()-PRE.hecho<20*60e3)return;PRE.activa=true;
  try{const lim=masDiasISO(hoyISO(),-60),vistos=new Set(),L=[];
    for(const [r,a] of todosAdj()){const f=r.fecha||r.vence||"";if(a.tipo==="enlace"||!a.sha||!a.ruta||vistos.has(a.sha)||f<lim||(a.tam||0)>8*1048576)continue;if(!/^(image|audio)\/|pdf/.test(a.mime||""))continue;vistos.add(a.sha);L.push({f,a})}
    L.sort((x,y)=>y.f.localeCompare(x.f));const keys=new Set(await DB.keys());let bytes=0;
    for(const {a} of L){if(keys.has("adj:"+a.sha))continue;if(bytes>60*1048576||document.hidden&&bytes>15*1048576)break;try{const d=await dbxDown("/"+a.ruta);if(d&&d.bytes){await DB.set("adj:"+a.sha,d.bytes);bytes+=d.bytes.length}}catch(e){break}await new Promise(ok=>setTimeout(ok,150))}
    PRE.hecho=Date.now()}finally{PRE.activa=false}}
const masDiasISO=(f,n)=>{const d=new Date(f+"T12:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
async function bytesAdj(a,{silencio}={}){
  const prueba=async c=>{const p=await descifrarAdj(c,a.sha);if(await sha256(p)!==a.sha)throw new Error("El adjunto no coincide con su huella (archivo alterado)");return p};
  let c=await DB.get("adj:"+a.sha);if(c){try{return await prueba(c)}catch(e){await DB.del("adj:"+a.sha);c=null}}
  const fuentes=[];let faltaNube=false;
  if(conDropbox()&&a.ruta)fuentes.push(async()=>{if(navigator.onLine===false)throw new Error("Sin conexión: este adjunto aún no está guardado en este dispositivo.");const d=await dbxDown("/"+a.ruta);if(!d)faltaNube=true;return d&&d.bytes});
  if(dirHandle&&carpetaOK&&a.ruta)fuentes.push(async()=>new Uint8Array(await (await leer(a.ruta)).arrayBuffer()));
  if(silencio||conDropbox())fuentes.push(async()=>{throw new Error(faltaNube?"⏳ Este adjunto todavía se está subiendo desde el otro dispositivo. Abre la app allá (con internet) un momento y vuelve a intentar.":"No se pudo descargar el adjunto. Revisa la conexión y vuelve a intentar.")});
  else fuentes.push(()=>new Promise(ok=>{alert(`El adjunto "${a.nombre}" no está en este dispositivo. Búscalo (archivo ${a.ruta||".fma"}) y selecciónalo.`);elegirArchivo(".fma",async f=>ok(new Uint8Array(await f.arrayBuffer())))}));
  let ult=null;for(const f of fuentes){try{const b=await f();if(!b)continue;const p=await prueba(b);await DB.set("adj:"+a.sha,b);return p}catch(e){ult=ult&&/Sin conexión|alterado/.test(ult.message)?ult:e}}
  throw ult||new Error("No encuentro este adjunto")}
function pintaAdj(){if(ADJPINTA)return ADJPINTA();$("#adjL").innerHTML=ADJ.length?ADJ.map((a,i)=>`<div class="small" style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--line)"><span>${a.tipo==="enlace"?"🔗":"📎"}</span><div style="flex:1;min-width:0"><a href="#" data-o="${i}" style="word-break:break-all">${esc(a.nombre)}</a><div class="muted">${esc(a.tipoDoc||"")}${a.original&&a.original!==a.nombre?" · original: "+esc(a.original):""}${a.tam?" · "+Math.round(a.tam/1024)+" KB":""}${a.savedAt?" · añadido "+a.savedAt.slice(0,10):""}</div></div>${a.tipo!=="enlace"?`<button class="b s" data-d="${i}" title="Descargar con el nombre codificado">⬇</button>`:""}<button class="b s" data-x="${i}">Quitar</button></div>`).join(""):'<div class="small muted">Sin adjuntos</div>';
  document.querySelectorAll("[data-o]").forEach(e=>e.onclick=ev=>{ev.preventDefault();abrirAdj(ADJ[+e.dataset.o])});
  document.querySelectorAll("[data-d]").forEach(e=>e.onclick=async()=>{const a=ADJ[+e.dataset.d];try{descargar(new Blob([await bytesAdj(a)],{type:a.mime||"application/octet-stream"}),a.nombre)}catch(x){alert(x.message)}});
  document.querySelectorAll("[data-x]").forEach(e=>e.onclick=()=>{ADJ.splice(+e.dataset.x,1);pintaAdj()})}
const VISIBLE=["application/pdf","image/jpeg","image/png","image/webp","image/gif"];
async function abrirAdj(a){if(a.tipo==="enlace"){if(/^https?:\/\//i.test(a.url))window.open(a.url,"_blank","noopener,noreferrer");return}
  try{const bytes=await bytesAdj(a);
    if(VISIBLE.includes(a.mime)){const u=URL.createObjectURL(new Blob([bytes],{type:a.mime}));BLOBS.push(u);const w=window.open(u,"_blank");if(!w&&confirm("El navegador no dejó abrir una pestaña. ¿Descargar el archivo descifrado a este equipo?"))descargar(new Blob([bytes],{type:a.mime}),a.nombre)}
    else if(confirm(`"${a.nombre}" no se puede ver dentro de la app. ¿Descargarlo descifrado a este equipo?`))descargar(new Blob([bytes],{type:"application/octet-stream"}),a.nombre)}
  catch(x){alert(x.message)}}
function dataURLtoBlob(d){const [h,b]=d.split(",");const mime=h.match(/:(.*?);/)[1];const bin=atob(b);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:mime})}
$("#attIn").onchange=e=>adjuntarArchivos(e.target.files);
$("#camIn").onchange=e=>adjuntarArchivos(e.target.files);
async function adjuntarArchivos(files){const md=ADJCTX?ADJCTX():movDlg(),td=$("#adjT").value;
  for(let f of files){f=await comprimirImagen(f);
    if(f.size>25*1024*1024){alert(`${f.name} pesa más de 25 MB: mejor guárdalo en Drive/Dropbox y pega el enlace.`);continue}
    const bytes=new Uint8Array(await f.arrayBuffer());const sha=await sha256(bytes);
    if(ADJ.some(a=>a.sha===sha)){alert(`${f.name}: ya está adjunto en este movimiento.`);continue}
    const otroR=todosRegistros().find(([x])=>(x.adjuntos||[]).some(a=>a.sha===sha));const otro=otroR&&otroR[0];
    if(otro&&!confirm(`${f.name} es el mismo archivo que ya está en ${otroR[1]}. ¿Enlazarlo también aquí? No se guarda una segunda copia.`))continue;
    const prev=otro&&otro.adjuntos.find(a=>a.sha===sha);
    const a={tipo:"archivo",sha,codigo:sha.slice(0,8),mime:/^[\w.+-]+\/[\w.+-]+$/.test(f.type)&&f.type!=="image/svg+xml"&&!/html|xml|javascript/i.test(f.type)?f.type:"application/octet-stream",tam:f.size,original:f.name,tipoDoc:td,fechaDoc:md.fecha,savedAt:new Date().toISOString()};
    a.nombre=nombreAdj(md,a);
    if(prev){a.ruta=prev.ruta;a.enCarpeta=prev.enCarpeta}else{a.ruta=rutaAdj(md,a);status("Cifrando adjunto…");await guardarAdj(a,bytes)}
    ADJ.push(a)}
  status("");pintaAdj()}
function parseNum(s){s=String(s).trim().replace(/[$\s]/g,"");if(/,\d{1,2}$/.test(s))s=s.replace(/\./g,"").replace(",",".");else s=s.replace(/,/g,"");return Math.abs(parseFloat(s))}

// ======================= Vencimientos: garantías, seguros, alimentos, documentos… =======================
const VTIPOS=["Garantía","Seguro","Alimento / medicamento","Documento","Suscripción","Mantenimiento","Otro"];
const hoyISO=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const diaLocal=t=>{if(/^\d{4}-\d{2}-\d{2}$/.test(String(t||"")))return String(t);const d=new Date(t);return isNaN(d)?hoyISO():new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
function diasA(f){return Math.round((new Date(f+"T00:00:00")-new Date(hoyISO()+"T00:00:00"))/864e5)}
function estadoV(v){if(v.estado==="cerrado")return["Cerrado",""];const d=diasA(v.vence);if(d<0)return[`Venció hace ${-d} d`,"bad"];if(d===0)return["Vence hoy","bad"];if(d<=(v.avisar??30))return[`Vence en ${d} d`,"warn"];return[`Vigente · ${d} d`,"ok"]}
const proximos=()=>(S.venc||[]).filter(v=>v.estado!=="cerrado"&&diasA(v.vence)<=(v.avisar??30)).sort((a,b)=>a.vence.localeCompare(b.vence));
function sumarMeses(f,n){const d=new Date(f+"T00:00:00");const dia=d.getDate();d.setMonth(d.getMonth()+(+n||0));if(d.getDate()<dia)d.setDate(0);return d.toISOString().slice(0,10)}
function restarDias(f,n){const d=new Date(f+"T00:00:00");d.setDate(d.getDate()-(+n||0));return d.toISOString().slice(0,10)}
let FV={q:"",tipo:"",est:"activos"};
function vVenc(){
  const L=(S.venc||[]).filter(v=>(!FV.tipo||v.tipo===FV.tipo)&&(FV.est==="todos"||(FV.est==="cerrados"?v.estado==="cerrado":v.estado!=="cerrado"))&&(!FV.q||(v.titulo+" "+v.comercio+" "+v.nota).toLowerCase().includes(FV.q.toLowerCase()))).sort((a,b)=>a.vence.localeCompare(b.vence));
  const P=proximos();
  $("#view").innerHTML=`${P.length?`<div class="card alerta"><h2>⏰ Por vencer o vencidos (${P.length})</h2>${P.map(v=>`<div class="click vrow" data-v="${esc(v.id)}"><span class="chip ${estadoV(v)[1]}">${esc(estadoV(v)[0])}</span> <b>${esc(v.titulo)}</b> <span class="small muted">${esc(v.tipo)} · ${esc(v.vence)}</span></div>`).join("")}</div>`:""}
  <div class="filters"><input id="vq" placeholder="Buscar…" value="${esc(FV.q)}" style="flex:1;min-width:140px">
   <select id="vt"><option value="">Todos los tipos</option>${VTIPOS.map(x=>`<option ${FV.tipo===x?"selected":""}>${x}</option>`).join("")}</select>
   <div class="seg" id="ve">${[["activos","Activos"],["cerrados","Cerrados"],["todos","Todos"]].map(([k,l])=>`<button data-k="${k}" class="${FV.est===k?"on":""}">${l}</button>`).join("")}</div>
   <button class="b p" id="vNew">+ Vencimiento</button><button class="b" id="vArch">📂 Archivo de documentos</button><button class="b" id="vIcsAll">Todos al calendario (.ics)</button></div>
  <div class="vgrid">${L.map(v=>{const [e,c]=estadoV(v);const m=v.movId&&S.mov.find(x=>x.id===v.movId);const nAdj=(v.adjuntos||[]).length;
    return`<div class="card vcard click" data-v="${esc(v.id)}"><div class="t"><span class="chip">${esc(v.tipo)}</span><span class="chip ${c}">${esc(e)}</span></div>
     <h3>${esc(v.titulo)}</h3><div class="small muted">${esc(v.comercio||"")}${v.valor?" · "+fmt(v.valor):""}</div>
     <div class="small">Vence <b>${esc(v.vence)}</b>${v.inicio?` · desde ${esc(v.inicio)}`:""}${v.meses?` (${esc(v.meses)} meses)`:""}</div>
     <div class="small muted">${m?`Compra: ${esc(m.fecha)} · ${esc(m.estab||m.desc)}`:""}${nAdj?` · 📎 ${nAdj}`:""}</div></div>`}).join("")||'<div class="muted">Nada aquí todavía. Usa "+ Vencimiento" o, desde un movimiento, "+ Garantía".</div>'}</div>`;
  $("#vq").oninput=e=>{FV.q=e.target.value;clearTimeout(vVenc._t);vVenc._t=setTimeout(()=>{vVenc();const i=$("#vq");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)};
  $("#vt").onchange=e=>{FV.tipo=e.target.value;vVenc()};
  document.querySelectorAll("#ve button").forEach(b=>b.onclick=()=>{FV.est=b.dataset.k;vVenc()});
  $("#vNew").onclick=()=>editarV(null);$("#vArch").onclick=verAdjuntos;
  $("#vIcsAll").onclick=()=>{const A=(S.venc||[]).filter(v=>v.estado!=="cerrado");if(!A.length){alert("No hay vencimientos activos");return}descargar(new Blob([icsDe(A)],{type:"text/calendar"}),`vencimientos_${hoyISO()}.ics`)};
  document.querySelectorAll("[data-v]").forEach(e=>e.onclick=()=>editarV(e.dataset.v));
}
function editarV(id,movId){
  const m0=movId&&S.mov.find(x=>x.id===movId);
  const v=id?structuredClone(S.venc.find(x=>x.id===id)):{id:uid(),tipo:"Garantía",titulo:m0?(m0.concepto||m0.estab):"",comercio:m0?m0.estab:"",inicio:m0?m0.fecha:hoyISO(),meses:12,vence:sumarMeses(m0?m0.fecha:hoyISO(),12),avisar:30,valor:m0?m0.valor:0,movId:movId||"",nota:"",estado:"activo",adjuntos:[]};
  ADJ=v.adjuntos||[];
  const movs=S.mov.filter(x=>calc(x).gasto>0).sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,400);
  dlg(id?"Editar vencimiento":"Nuevo vencimiento",`
   <div class="grid2"><div><label>Tipo</label><select id="vT" style="width:100%">${VTIPOS.map(x=>`<option ${x===v.tipo?"selected":""}>${x}</option>`).join("")}</select></div>
   <div><label>Estado</label><select id="vS" style="width:100%"><option value="activo" ${v.estado!=="cerrado"?"selected":""}>Activo</option><option value="cerrado" ${v.estado==="cerrado"?"selected":""}>Cerrado (ya no aplica)</option></select></div></div>
   <label>¿Qué es?</label><input id="vTi" value="${esc(v.titulo)}" placeholder="Ej: Nevera LG, SOAT del carro, leche de fórmula…" style="width:100%">
   <div class="grid2"><div><label>Comercio / aseguradora</label><input id="vCo" list="lEs2" value="${esc(v.comercio)}" style="width:100%"><datalist id="lEs2">${comercios().slice(0,300).map(c=>`<option>${esc(c)}</option>`).join("")}</datalist></div>
   <div><label>Valor</label><input id="vVa" inputmode="decimal" value="${esc(v.valor||"")}" style="width:100%"></div>
   <div><label>Desde (compra o inicio)</label><input type="date" id="vIn" value="${esc(v.inicio||"")}" style="width:100%"></div>
   <div><label>Duración (meses)</label><input id="vMe" type="number" min="0" value="${esc(v.meses||"")}" style="width:100%"></div>
   <div><label>Vence</label><input type="date" id="vVe" value="${esc(v.vence)}" style="width:100%"></div>
   <div><label>Avisarme (días antes)</label><input id="vAv" type="number" min="0" value="${esc(v.avisar??30)}" style="width:100%"></div></div>
   <label>Compra asociada</label><select id="vMo" style="width:100%"><option value="">— ninguna —</option>${movs.map(x=>`<option value="${esc(x.id)}" ${x.id===v.movId?"selected":""}>${esc(x.fecha)} · ${esc((x.estab||x.desc).slice(0,40))} · ${fmt(x.valor)}</option>`).join("")}</select>
   <label>Notas (número de póliza, serial, lote, contacto…)</label><textarea id="vNo" rows="2" style="width:100%">${esc(v.nota)}</textarea>
   ${htmlAdj("Garantía, póliza, fotos y documentos","Garantía")}
   <label>Recordatorio en tu calendario</label><div class="filters"><button class="b s" id="vGcal">Google Calendar</button><button class="b s" id="vIcs">Calendario del celular (.ics)</button></div>
   <div class="small muted">El recordatorio queda con el nombre y la fecha en tu calendario (fuera de la app, sin cifrar).</div>`,
   [...(id?[["Eliminar","",()=>{if(confirm("¿Eliminar este vencimiento?")){borrarConPapelera("venc",id);cerrar();render()}}]]:[]),["Cancelar","",cerrar],["Guardar","p",()=>{if(leerV())guardarV()}]]);
  const auto=()=>{if($("#vIn").value&&+$("#vMe").value)$("#vVe").value=sumarMeses($("#vIn").value,$("#vMe").value)};$("#vIn").onchange=auto;$("#vMe").oninput=auto;
  $("#vMo").onchange=()=>{const x=S.mov.find(y=>y.id===$("#vMo").value);if(x){if(!$("#vCo").value)$("#vCo").value=x.estab;if(!$("#vTi").value)$("#vTi").value=x.concepto||x.estab;if(!parseNum($("#vVa").value))$("#vVa").value=x.valor;$("#vIn").value=x.fecha;auto()}};
  const ctx=()=>({fecha:$("#vIn").value||$("#vVe").value,estab:$("#vCo").value.trim(),concepto:$("#vTi").value.trim(),desc:"",valor:parseNum($("#vVa").value)||0});
  bindAdj(ctx,v.id);
  function leerV(){const ve=$("#vVe").value;if(!/^\d{4}-\d{2}-\d{2}$/.test(ve)){alert("Pon la fecha de vencimiento");return false}if(!$("#vTi").value.trim()){alert("Escribe qué es");return false}
    Object.assign(v,{tipo:$("#vT").value,estado:$("#vS").value,titulo:$("#vTi").value.trim(),comercio:normalizarComercio($("#vCo").value),valor:parseNum($("#vVa").value)||0,inicio:$("#vIn").value,meses:+$("#vMe").value||0,vence:ve,avisar:Math.max(0,+$("#vAv").value||0),movId:$("#vMo").value,nota:$("#vNo").value.trim(),adjuntos:ADJ,editado:new Date().toISOString()});
    const c=ctx();for(const a of v.adjuntos){a.nombre=nombreAdj(c,a);if(a.tipo!=="enlace")a.ruta=a.ruta||rutaAdj(c,a)}return true}
  function guardarV(){S.venc=S.venc||[];const i=S.venc.findIndex(x=>x.id===v.id);if(i>=0)S.venc[i]=v;else S.venc.push(v);changed();cerrar();render()}
  $("#vGcal").onclick=()=>{if(!leerV())return;window.open(gcalUrl(v),"_blank","noopener,noreferrer")};
  $("#vIcs").onclick=()=>{if(!leerV())return;descargar(new Blob([icsDe([v])],{type:"text/calendar"}),`recordatorio_${slug(v.titulo)}_${v.vence}.ics`)};
}
function tituloRec(v){return`${v.tipo==="Alimento / medicamento"?"Vence":"Vence "+v.tipo.toLowerCase()}: ${v.titulo}`}
function gcalUrl(v){ // evento de todo el día en la fecha de aviso (vence − días de aviso); en la descripción va la fecha real
  const f=v.avisar>0?restarDias(v.vence,v.avisar):v.vence;const f2=restarDias(f,-1);
  return"https://calendar.google.com/calendar/render?"+new URLSearchParams({action:"TEMPLATE",text:(v.avisar>0?`⏰ ${v.avisar} días: `:"")+tituloRec(v),dates:f.replace(/-/g,"")+"/"+f2.replace(/-/g,""),details:`${tituloRec(v)} el ${v.vence}.${v.comercio?" "+v.comercio+".":""}${v.nota?" "+v.nota:""}\n(Recordatorio creado desde Finanzas Memphis)`})}
function icsDe(L){const e=s=>String(s||"").replace(/\\/g,"\\\\").replace(/[,;]/g,c=>"\\"+c).replace(/\r?\n/g,"\\n");const st=new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
  return["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Finanzas Memphis//ES","CALSCALE:GREGORIAN",...L.flatMap(v=>{const d=v.vence.replace(/-/g,""),d2=restarDias(v.vence,-1).replace(/-/g,"");
    return["BEGIN:VEVENT","UID:"+v.id+"@finanzas-memphis","DTSTAMP:"+st,"DTSTART;VALUE=DATE:"+d,"DTEND;VALUE=DATE:"+d2,"SUMMARY:"+e(tituloRec(v)),"DESCRIPTION:"+e(`${v.comercio||""} ${v.nota||""}`.trim()),
      ...(v.avisar>0?["BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+e(tituloRec(v)),"TRIGGER:-P"+v.avisar+"D","END:VALARM"]:[]),"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+e(tituloRec(v)),"TRIGGER:-P1D","END:VALARM","END:VEVENT"]}),"END:VCALENDAR"].join("\r\n")}

// ======================= Recurrentes: suscripciones, servicios, cuotas, colegios… =======================
const RTIPOS=["Suscripción","Servicio público","Leasing / deuda","Educación","Salud","Arriendo","Seguro","Otro"];
const RUNID={meses:"mes(es)",semanas:"semana(s)",dias:"día(s)",anios:"año(s)"};
function sumarPeriodo(f,n,u){if(u==="anios")return sumarMeses(f,12*n);if(u==="meses")return sumarMeses(f,n);return restarDias(f,-(u==="semanas"?7*n:n))}
function vigenteEn(r,f){let monto=r.monto,cuenta=r.cuenta,temporal=null;const H=(r.historial||[]).slice().sort((a,b)=>a.desde.localeCompare(b.desde));
  for(const h of H)if(!h.hasta&&h.desde<=f){if(h.monto!=null&&h.monto!=="")monto=+h.monto;if(h.cuenta)cuenta=h.cuenta}
  for(const h of H)if(h.hasta&&h.desde<=f&&f<=h.hasta){if(h.monto!=null&&h.monto!=="")monto=+h.monto;if(h.cuenta)cuenta=h.cuenta;temporal=h}
  return{monto,cuenta,temporal}}
function ocurrenciasAtras(r,desde){const out=[];for(let i=1;i<600;i++){const f=sumarPeriodo(r.inicio,-(+r.cada||1)*i,r.unidad);if(f<desde)break;out.unshift(f)}return out}
function ocurrencias(r,desde,hasta){const out=[];const fin=r.fin||"9999-12-31";for(let i=0;i<2000;i++){const f=sumarPeriodo(r.inicio,(+r.cada||1)*i,r.unidad);if(f>hasta||f>fin)break;if(f>=desde)out.push(f)}return out}
const normTxt=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function coincideTexto(r,m){const t=normTxt(m.desc+" "+m.estab+" "+m.concepto);
  if(r.patron){try{return /^\/.*\/$/.test(r.patron)?new RegExp(r.patron.slice(1,-1),"i").test(t):r.patron.split("|").some(p=>p.trim()&&t.includes(normTxt(p.trim())))}catch(e){return false}}
  const pal=normTxt(r.nombre).split(/[^a-z0-9+]+/).filter(w=>w.length>=4&&!["mensual","credito","banco","cuota","pago"].includes(w));return pal.length&&pal.some(w=>t.includes(w))}
function estadoRec(r,hasta){return estadoRecDesde(r,restarDias(hoyISO(),400),hasta||restarDias(hoyISO(),-62))}
function diasEntre(a,b){return Math.round((new Date(a+"T00:00:00")-new Date(b+"T00:00:00"))/864e5)}
const ESTR={pagado:["Pagado","ok"],atrasado:["Sin pago registrado","bad"],pendiente:["Pendiente","warn"],proximo:["Próximo","warn"],futuro:["Programado",""]};
function estadoRecDesde(r,desde,hasta,atras){ // como estadoRec pero desde una fecha dada (historial completo)
  const tol=r.unidad==="meses"||r.unidad==="anios"?10:3;const usados=new Set();const res=[];
  for(const f of [...(atras?ocurrenciasAtras(r,desde):[]),...ocurrencias(r,desde,hasta)]){const v=vigenteEn(r,f),monto=v.monto;
    const cand=S.mov.filter(m=>!usados.has(m.id)&&Math.abs(diasEntre(m.fecha,f))<=tol&&(m.recId===r.id||((!(monto>0)||Math.abs(m.valor-monto)<=Math.max(1000,monto*0.2))&&coincideTexto(r,m)))).sort((a,b)=>(b.recId===r.id)-(a.recId===r.id)||Math.abs(diasEntre(a.fecha,f))-Math.abs(diasEntre(b.fecha,f)));
    let pago=cand[0];
    if(!pago&&monto>0){const porDia={};for(const m of S.mov)if(!usados.has(m.id)&&Math.abs(diasEntre(m.fecha,f))<=tol&&coincideTexto(r,m))(porDia[m.fecha]=porDia[m.fecha]||[]).push(m);
      for(const [dia,L] of Object.entries(porDia)){const s=L.reduce((a,m)=>a+m.valor,0);if(Math.abs(s-monto)<=Math.max(1000,monto*0.03)){pago={id:L[0].id,fecha:dia,valor:s,estab:L[0].estab,desc:L[0].desc,partes:L};L.forEach(m=>usados.add(m.id));break}}}
    if(pago)usados.add(pago.id);const d=diasA(f);
    res.push({fecha:f,monto,pago,temporal:v.temporal,est:pago?"pagado":d<-tol?"atrasado":d<0?"pendiente":d<=(r.avisar??3)?"proximo":"futuro"})}
  return res}
function alertasRec(){const o=[];for(const r of S.rec||[]){if(!r.activo)continue;for(const x of estadoRec(r,restarDias(hoyISO(),-((r.avisar??3)))))if(["atrasado","pendiente","proximo"].includes(x.est)&&diasA(x.fecha)>=-45)o.push({r,...x})}return o.sort((a,b)=>a.fecha.localeCompare(b.fecha))}
function autoRegistrar(){ // recurrentes que no pasan por el banco (efectivo, otra cuenta): se anotan solos al llegar la fecha
  let n=0;const hoy=hoyISO();
  for(const r of S.rec||[]){if(!r.activo||!r.autoRegistro)continue;const desde=r.ultimoAuto?restarDias(r.ultimoAuto,-1):hoy;
    for(const f of ocurrencias(r,desde,hoy)){const {monto,cuenta}=vigenteEn(r,f);if(S.mov.some(m=>m.recId===r.id&&m.fecha===f))continue;
      S.mov.push({id:uid(),fecha:f,cuenta,desc:"",estab:r.comercio||r.nombre,concepto:r.nombre,categoria:r.categoria||"",tipo:tipoParaCuenta(cuenta,"Gasto débito"),valor:monto||0,origen:"recurrente",conciliacion:"",revisar:monto?"":"Recurrente sin valor: escríbelo",nota:"Anotado automáticamente (recurrente)",adjuntos:[],recId:r.id,editado:new Date().toISOString()});n++}
    if(ocurrencias(r,desde,hoy).length){r.ultimoAuto=hoy;r.editado=new Date().toISOString()}}
  if(n){changed();aviso(`${n} pago${n>1?"s":""} recurrente${n>1?"s":""} anotado${n>1?"s":""} automáticamente (efectivo u otra cuenta).`)}return n}
let FR={mes:"",ver:"activos"};
function vRec(){
  const hoy=hoyISO();if(!FR.mes)FR.mes=hoy.slice(0,7);const R=(S.rec||[]);
  const A=alertasRec();
  const ini=FR.mes+"-01",fin=restarDias(sumarMeses(ini,1),1);
  const delMes=[];for(const r of R){if(!r.activo&&!(r.fin&&r.fin>=ini))continue;for(const x of estadoRec(r,fin))if(x.fecha>=ini&&x.fecha<=fin)delMes.push({r,...x})}delMes.sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const totE=delMes.reduce((a,x)=>a+(x.monto||0),0),totP=delMes.filter(x=>x.pago).reduce((a,x)=>a+x.pago.valor,0);
  const L=R.filter(r=>FR.ver==="todos"||(FR.ver==="activos"?r.activo:!r.activo)).map(r=>{const prox=estadoRec(r,restarDias(hoy,-400)).find(x=>x.fecha>=hoy&&!x.pago);return{r,prox,v:vigenteEn(r,hoy)}}).sort((a,b)=>(a.prox?a.prox.fecha:"9")<(b.prox?b.prox.fecha:"9")?-1:1);
  const mensual=R.filter(r=>r.activo).reduce((a,r)=>{const v=vigenteEn(r,hoy).monto||0;const k=r.unidad==="meses"?1/(+r.cada||1):r.unidad==="anios"?1/(12*(+r.cada||1)):r.unidad==="semanas"?4.345/(+r.cada||1):30.4/(+r.cada||1);return a+v*k},0);
  $("#view").innerHTML=`${A.length?`<div class="card alerta"><h2>🔔 Cobros recurrentes por atender (${A.length})</h2>${A.slice(0,12).map(x=>`<div class="click vrow" data-r="${esc(x.r.id)}"><span class="chip ${ESTR[x.est][1]}">${ESTR[x.est][0]}</span> <b>${esc(x.r.nombre)}</b> <span class="small muted">${esc(x.fecha)} · ${x.monto?fmt(x.monto):"valor variable"} · ${esc(vigenteEn(x.r,x.fecha).cuenta)}</span></div>`).join("")}</div>`:""}
  <div class="kpis"><div class="kpi"><div class="l">Recurrentes activos</div><div class="v">${R.filter(r=>r.activo).length}</div></div><div class="kpi"><div class="l">Costo mensual estimado</div><div class="v neg">${fmt(mensual)}</div></div><div class="kpi"><div class="l">Esperado en ${esc(perLbl(FR.mes))}</div><div class="v">${fmt(totE)}</div></div><div class="kpi"><div class="l">Ya pagado en ${esc(perLbl(FR.mes))}</div><div class="v pos">${fmt(totP)}</div></div></div>
  <div class="card"><div class="filters"><button class="b s" id="rmPrev">◀</button><b style="align-self:center">${esc(perLbl(FR.mes))}</b><button class="b s" id="rmNext">▶</button><span class="sp"></span><button class="b p" id="rNew">+ Recurrente</button></div>
   <div class="tw"><table><tr><th>Fecha</th><th>Recurrente</th><th>Cuenta</th><th class="n">Esperado</th><th>Estado</th></tr>${delMes.map(x=>`<tr class="click" data-r="${esc(x.r.id)}"><td>${esc(x.fecha)}</td><td><b>${esc(x.r.nombre)}</b><div class="small muted">${esc(x.r.tipo)}${x.pago?` · pagado ${esc(x.pago.fecha)} ${fmt(x.pago.valor)}`:""}</div></td><td class="small">${esc(vigenteEn(x.r,x.fecha).cuenta)}</td><td class="n">${x.monto?fmt(x.monto):"variable"}</td><td><span class="chip ${ESTR[x.est][1]}">${ESTR[x.est][0]}</span></td></tr>`).join("")||'<tr><td class="muted">Nada este mes</td></tr>'}</table></div></div>
  <div class="card"><div class="filters"><h2 style="margin:0;align-self:center">Mis recurrentes</h2><span class="sp"></span><div class="seg" id="rVer">${[["activos","Activos"],["inactivos","Finalizados"],["todos","Todos"]].map(([k,l])=>`<button data-k="${k}" class="${FR.ver===k?"on":""}">${l}</button>`).join("")}</div></div>
   <div class="vgrid">${L.map(({r,prox,v})=>`<div class="card vcard click" data-r="${esc(r.id)}"><div class="t"><span class="chip">${esc(r.tipo)}</span>${r.activo?(prox?`<span class="chip ${prox.est==="proximo"?"warn":""}">${esc(prox.fecha)}</span>`:""):'<span class="chip">Finalizado</span>'}</div>
     <h3>${esc(r.nombre)}</h3><div class="small"><b>${v.monto?fmt(v.monto):"Valor variable"}</b> cada ${esc(r.cada)} ${esc(RUNID[r.unidad]||r.unidad)}</div><div class="small muted">${esc(v.cuenta)}${r.auto?" · débito automático":""}${r.autoRegistro?" · se anota solo":""}${(r.historial||[]).length?` · ${r.historial.length} cambio(s)`:""}</div></div>`).join("")||'<div class="muted">Sin recurrentes</div>'}</div></div>`;
  $("#rmPrev").onclick=()=>{FR.mes=sumarMeses(FR.mes+"-01",-1).slice(0,7);vRec()};$("#rmNext").onclick=()=>{FR.mes=sumarMeses(FR.mes+"-01",1).slice(0,7);vRec()};
  $("#rNew").onclick=()=>editarR(null);document.querySelectorAll("#rVer button").forEach(b=>b.onclick=()=>{FR.ver=b.dataset.k;vRec()});
  document.querySelectorAll("[data-r]").forEach(e=>e.onclick=()=>editarR(e.dataset.r));
}
function editarR(id){
  const r=id?structuredClone(S.rec.find(x=>x.id===id)):{id:uid(),nombre:"",monto:0,cada:1,unidad:"meses",inicio:hoyISO(),cuenta:S.cuentas[0]||"",auto:false,activo:true,avisar:3,fin:"",tipo:"Suscripción",categoria:"",comercio:"",patron:"",nota:"",autoRegistro:false,historial:[]};
  const hoy=hoyISO(),v=vigenteEn(r,hoy),E=[];
  const Hst=id?(()=>{const primer=S.mov.reduce((a,m)=>m.fecha<a?m.fecha:a,"9999");const desde=primer,hasta=restarDias(hoy,-62);return estadoRecDesde(r,desde,hasta,true).reverse()})():[];
  const cats=[...new Set(S.mov.map(x=>x.categoria).filter(Boolean))].sort();
  dlg(id?"Recurrente: "+r.nombre:"Nuevo recurrente",`
   <label>Nombre</label><input id="rNo" value="${esc(r.nombre)}" placeholder="Ej: Netflix, Leasing, Colegio…" style="width:100%">
   <div class="grid2"><div><label>Tipo</label><select id="rTi" style="width:100%">${RTIPOS.map(x=>`<option ${x===r.tipo?"selected":""}>${x}</option>`).join("")}</select></div>
   <div><label>Categoría</label><input id="rCa" list="lCaR" value="${esc(r.categoria)}" style="width:100%"><datalist id="lCaR">${cats.map(c=>`<option>${esc(c)}</option>`).join("")}</datalist></div>
   <div><label>Valor ${id?"original":""} (vacío si varía)</label><input id="rMo" inputmode="decimal" value="${esc(r.monto||"")}" style="width:100%"></div>
   <div><label>Cuenta / medio de pago ${id?"original":""}</label><input id="rCu" list="lCuR" value="${esc(r.cuenta)}" style="width:100%"><datalist id="lCuR">${S.cuentas.map(c=>`<option>${esc(c)}</option>`).join("")}</datalist></div>
   <div><label>Cada</label><div style="display:flex;gap:6px"><input id="rCd" type="number" min="1" value="${esc(r.cada)}" style="width:70px"><select id="rUn" style="flex:1">${Object.entries(RUNID).map(([k,l])=>`<option value="${k}" ${k===r.unidad?"selected":""}>${l}</option>`).join("")}</select></div></div>
   <div><label>Primera fecha (define el día de cobro)</label><input type="date" id="rIn" value="${esc(r.inicio)}" style="width:100%"></div>
   <div><label>Avisar (días antes)</label><input id="rAv" type="number" min="0" value="${esc(r.avisar??3)}" style="width:100%"></div>
   <div><label>Termina (opcional)</label><input type="date" id="rFi" value="${esc(r.fin||"")}" style="width:100%"></div></div>
   <label>Comercio</label><input id="rCo" list="lEsR" value="${esc(r.comercio)}" style="width:100%"><datalist id="lEsR">${comercios().slice(0,300).map(c=>`<option>${esc(c)}</option>`).join("")}</datalist>
   <label>Cómo aparece en el banco (para reconocer el pago; varias opciones con | )</label><input id="rPa" value="${esc(r.patron)}" placeholder="Ej: NETFLIX  ·  APPLE.COM|ITUNES" style="width:100%">
   <label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" id="rAu" ${r.auto?"checked":""}> Débito automático</label>
   <label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" id="rAR" ${r.autoRegistro?"checked":""}> Anotarlo solo en la app al llegar la fecha (para pagos en efectivo o desde otra cuenta, que no llegan en el extracto)</label>
   <label>Notas</label><input id="rNt" value="${esc(r.nota)}" style="width:100%">
   ${id?`<div class="card" style="margin-top:10px"><b>Hoy:</b> ${v.monto?fmt(v.monto):"valor variable"} desde <b>${esc(v.cuenta)}</b> · ${r.activo?"Activo":"Finalizado"+(r.fin?" el "+esc(r.fin):"")}
     <div class="filters" style="margin-top:8px"><button class="b s" id="rCV">Cambió el valor</button><button class="b s" id="rCC">Cambió el medio de pago</button>${r.activo?`<button class="b s" id="rFin">Ya no va más</button>`:`<button class="b s" id="rReac">Reactivar</button>`}<button class="b s" id="rPago">Anotar un pago</button></div>
     ${(r.historial||[]).length?`<div class="small" style="margin-top:6px"><b>Historial:</b>${r.historial.slice().sort((a,b)=>a.desde.localeCompare(b.desde)).map((h,i)=>`<div>${h.hasta?"solo "+esc(h.desde):"desde "+esc(h.desde)}: ${h.monto!=null&&h.monto!==""?fmt(h.monto):""} ${h.cuenta?"· "+esc(h.cuenta):""} ${h.nota?"· "+esc(h.nota):""} <a href="#" data-hx="${i}">quitar</a></div>`).join("")}</div>`:""}
     </div>
   <div class="card"><b>Pagos de ${esc(r.nombre)}</b> <span class="small muted">toca un pago para verlo, adjuntarle la factura o corregirlo</span>
     <div class="tw" style="max-height:320px"><table><tr><th>Fecha</th><th class="n">Esperado</th><th>Pago</th><th></th></tr>${Hst.map((x,i)=>`<tr><td>${esc(x.fecha)}${x.temporal?`<div class="small warn">${esc(x.temporal.nota||"precio de ese mes")}</div>`:""}</td><td class="n">${x.monto?fmt(x.monto):"variable"}</td>
       <td>${x.pago?`<a href="#" data-pm="${esc(x.pago.id)}">${esc(x.pago.fecha)} · ${fmt(x.pago.valor)}</a>${x.pago.partes?" (en partes)":""}${(S.mov.find(y=>y.id===x.pago.id)||{adjuntos:[]}).adjuntos.length?" 📎":""}`:`<span class="chip ${ESTR[x.est][1]}">${ESTR[x.est][0]}</span>`}</td>
       <td style="white-space:nowrap"><button class="b s" data-ps="${i}" title="Precio distinto solo este cobro">$ solo este mes</button>${x.pago?"":` <button class="b s" data-pa="${i}">Asociar pago</button>`}</td></tr>`).join("")}</table></div>`:""}`,
   [...(id?[["Eliminar","",()=>{if(confirm("¿Eliminar este recurrente? (Si solo dejó de cobrarse, mejor usa «Ya no va más» para conservar el historial)")){borrarConPapelera("rec",id);cerrar();render()}}]]:[]),["Cancelar","",cerrar],["Guardar","p",()=>{if(leer()){guardar();cerrar();render()}}]]);
  function leer(){if(!$("#rNo").value.trim()){alert("Escribe el nombre");return false}if(!/^\d{4}-\d{2}-\d{2}$/.test($("#rIn").value)){alert("Pon la primera fecha");return false}
    Object.assign(r,{nombre:$("#rNo").value.trim(),tipo:$("#rTi").value,categoria:$("#rCa").value.trim(),monto:parseNum($("#rMo").value)||0,cuenta:$("#rCu").value.trim(),cada:Math.max(1,+$("#rCd").value||1),unidad:$("#rUn").value,inicio:$("#rIn").value,avisar:Math.max(0,+$("#rAv").value||0),fin:$("#rFi").value,comercio:normalizarComercio($("#rCo").value),patron:$("#rPa").value.trim(),auto:$("#rAu").checked,autoRegistro:$("#rAR").checked,nota:$("#rNt").value.trim(),editado:new Date().toISOString()});
    if(r.autoRegistro&&!r.ultimoAuto)r.ultimoAuto=restarDias(hoyISO(),1);if(r.fin&&r.fin<hoyISO())r.activo=false;return true}
  function guardar(){S.rec=S.rec||[];const i=S.rec.findIndex(x=>x.id===r.id);if(i>=0)S.rec[i]=r;else S.rec.push(r);changed()}
  const pedir=(titulo,campos)=>new Promise(ok=>{const prev=$("#dlgB").innerHTML;let res=null;
    dlg(titulo,campos,[["Cancelar","",()=>cerrar()],["Aplicar","p",()=>{res={};document.querySelectorAll("#dlgB [data-c]").forEach(e=>res[e.dataset.c]=e.value);cerrar()}]]);$("#dlg").addEventListener("close",()=>ok(res),{once:true})});
  if(id){
    $("#rCV").onclick=async()=>{if(!leer())return;guardar();const x=await pedir("Cambió el valor de "+r.nombre,`<label>Nuevo valor</label><input data-c="monto" inputmode="decimal" style="width:100%"><label>Desde (fecha del primer cobro con el valor nuevo)</label><input data-c="desde" type="date" value="${hoyISO()}" style="width:100%"><label>Nota (opcional)</label><input data-c="nota" style="width:100%">`);
      if(x&&parseNum(x.monto)>0&&/^\d{4}-\d{2}-\d{2}$/.test(x.desde)){r.historial.push({desde:x.desde,monto:parseNum(x.monto),nota:x.nota||"Cambio de valor"});r.editado=new Date().toISOString();guardar()}editarR(r.id)};
    $("#rCC").onclick=async()=>{if(!leer())return;guardar();const x=await pedir("Cambió el medio de pago de "+r.nombre,`<label>Nueva cuenta o medio de pago</label><input data-c="cuenta" list="lCuR2" style="width:100%"><datalist id="lCuR2">${S.cuentas.map(c=>`<option>${esc(c)}</option>`).join("")}</datalist><label>Desde</label><input data-c="desde" type="date" value="${hoyISO()}" style="width:100%"><label>Nota (opcional)</label><input data-c="nota" style="width:100%">`);
      if(x&&x.cuenta.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(x.desde)){r.historial.push({desde:x.desde,cuenta:x.cuenta.trim(),nota:x.nota||"Cambio de medio de pago"});if(!S.cuentas.includes(x.cuenta.trim()))S.cuentas.push(x.cuenta.trim());r.editado=new Date().toISOString();guardar()}editarR(r.id)};
    if($("#rFin"))$("#rFin").onclick=async()=>{if(!leer())return;guardar();const x=await pedir("Finalizar "+r.nombre,`<label>¿Desde cuándo ya no se cobra?</label><input data-c="fin" type="date" value="${hoyISO()}" style="width:100%"><label>Motivo (opcional)</label><input data-c="nota" placeholder="Cancelada, se terminó el crédito…" style="width:100%">`);
      if(x&&/^\d{4}-\d{2}-\d{2}$/.test(x.fin)){r.fin=x.fin;r.activo=x.fin>hoyISO();r.nota=[r.nota,x.nota&&("Finalizado: "+x.nota)].filter(Boolean).join(" · ");r.editado=new Date().toISOString();guardar()}editarR(r.id)};
    if($("#rReac"))$("#rReac").onclick=()=>{if(!leer())return;r.activo=true;r.fin="";r.editado=new Date().toISOString();guardar();editarR(r.id)};
    $("#rPago").onclick=()=>{if(!leer())return;guardar();const p=estadoRec(r,hoyISO()).filter(x=>!x.pago).pop();const f=p?p.fecha:hoyISO(),vv=vigenteEn(r,f);cerrar();
      const nm={id:uid(),fecha:f,cuenta:vv.cuenta,desc:"",estab:r.comercio||r.nombre,concepto:r.nombre,categoria:r.categoria||"",tipo:tipoParaCuenta(vv.cuenta,"Gasto débito"),valor:vv.monto||0,origen:"manual",conciliacion:"",revisar:"",nota:"Pago de recurrente",adjuntos:[],recId:r.id};
      S.mov.push(nm);changed();editar(nm.id)};
    document.querySelectorAll("[data-pm]").forEach(e=>e.onclick=ev=>{ev.preventDefault();if(!leer())return;guardar();editar(e.dataset.pm)});
    document.querySelectorAll("[data-ps]").forEach(e=>e.onclick=async()=>{if(!leer())return;guardar();const x0=Hst[+e.dataset.ps];
      const x=await pedir("Precio distinto solo el cobro del "+x0.fecha,`<p class="small">Solo cambia ese cobro; los siguientes siguen con el valor normal.</p><label>Valor de ese cobro</label><input data-c="monto" inputmode="decimal" value="${x0.monto||""}" style="width:100%"><label>Motivo (opcional)</label><input data-c="nota" placeholder="Pagué el plan premium ese mes" style="width:100%">`);
      if(x&&parseNum(x.monto)>0){r.historial=r.historial.filter(h=>!(h.hasta&&h.desde===x0.fecha));r.historial.push({desde:x0.fecha,hasta:x0.fecha,monto:parseNum(x.monto),nota:x.nota||"Precio de ese mes"});r.editado=new Date().toISOString();guardar()}editarR(r.id)});
    document.querySelectorAll("[data-pa]").forEach(e=>e.onclick=async()=>{if(!leer())return;guardar();const x0=Hst[+e.dataset.pa];
      const C=S.mov.filter(m=>Math.abs(diasEntre(m.fecha,x0.fecha))<=20&&calc(m).gasto>0).sort((a,b)=>Math.abs(diasEntre(a.fecha,x0.fecha))-Math.abs(diasEntre(b.fecha,x0.fecha))).slice(0,40);
      const x=await pedir("¿Cuál movimiento es el pago del "+x0.fecha+"?",`<select data-c="id" style="width:100%">${C.map(m=>`<option value="${esc(m.id)}">${esc(m.fecha)} · ${esc((m.estab||m.desc).slice(0,40))} · ${fmt(m.valor)}</option>`).join("")}</select>`);
      if(x&&x.id){const m=S.mov.find(y=>y.id===x.id);if(m){m.recId=r.id;m.editado=new Date().toISOString();changed()}}editarR(r.id)});
    document.querySelectorAll("[data-hx]").forEach(e=>e.onclick=ev=>{ev.preventDefault();if(!confirm("¿Quitar este cambio del historial?"))return;leer();const H=r.historial.slice().sort((a,b)=>a.desde.localeCompare(b.desde));r.historial=H.filter((_,i)=>i!==+e.dataset.hx);guardar();editarR(r.id)});
  }
}

// ======================= Familia: de quién es el dinero, ingresos de la familia y lentes =======================
// Lentes: "todo" = familia (lo tuyo + lo de tu familiar), "yo" = solo tu dinero, "fam" = solo lo de tu familiar.
// Entre ustedes dos los aportes no son gasto ni reembolso en la lente Familia (no se cuenta doble).
let LENTE="todo";
const famNombre=()=>(S&&S.familia&&S.familia.nombre)||"Familia";
const LENTES=()=>[["todo","👨‍👩‍👧 Familia"],["yo","🙋 Yo"],["fam","💜 "+famNombre()]];
const COLQ={yo:"#185FA5",fam:"#9C5BB5"};
const QN=q=>q==="fam"?famNombre():q==="ext"?"Otra persona":"Yo";
function rolCuenta(c){const r=((S.familia||{}).cuentas||{})[c];if(r)return r;if(/^efectivo$/i.test(String(c||"")))return"yo";return null}
function quien(m){if(m.pagador)return m.pagador;if(m.tipo==="Gasto de otra cuenta")return rolCuenta(m.cuenta)||"fam";return"yo"}
function tipoParaCuenta(cuenta,tipo,pagador){const r=pagador||rolCuenta(cuenta);if(!/^(Gasto débito|Gasto de otra cuenta|Gasto en efectivo)$/.test(tipo||"Gasto débito"))return tipo;
  if(r==="fam"||r==="ext"||(!r&&(/\botra\b/i.test(cuenta||"")||(typeof S!=="undefined"&&S&&cuenta&&S.mov.some(m=>m.cuenta===cuenta&&m.tipo==="Gasto de otra cuenta")))))return"Gasto de otra cuenta";if(/efectivo/i.test(cuenta||""))return"Gasto en efectivo";return tipo==="Gasto de otra cuenta"?"Gasto débito":tipo||"Gasto débito"}
function ingresosFam(hasta){const F=S.familia||{},L=(F.ingresos||[]).slice().sort((a,b)=>a.desde.localeCompare(b.desde));if(!L.length)return[];
  const out=[],fin=(hasta||hoyISO()).slice(0,7);let k=L[0].desde.slice(0,7);
  while(k<=fin){const v=L.filter(x=>x.desde.slice(0,7)<=k).pop();if(v&&v.mensual>0){const f=k+"-28",nm=famNombre();
      out.push({v:1,fecha:f,cat:"Ingresos",estab:"Sueldo "+nm+" (estimado)",cuenta:nm,tipo:"Ingreso estimado",valor:v.mensual,g:0,i:v.mensual,q:"fam"});
      if((v.primaMeses||[]).includes(+k.slice(5))&&v.primaPct>0){const p=Math.round(v.mensual*v.primaPct/100);out.push({v:1,fecha:f,cat:"Ingresos",estab:"Prima "+nm+" (estimado)",cuenta:nm,tipo:"Ingreso estimado",valor:p,g:0,i:p,q:"fam"})}}
    const [y,mo]=k.split("-").map(Number);k=mo===12?`${y+1}-01`:`${y}-${String(mo+1).padStart(2,"0")}`}
  return out}
function lineas(lente){lente=lente||LENTE;const out=[];
  for(const m of S.mov){const q=quien(m),t=m.tipo;if(q==="ext")continue;if(lente!=="todo"&&q!==lente)continue;
    let g,i;if(t==="Gasto de otra cuenta"||t==="Gasto en efectivo"){g=+m.valor||0;i=0}else{const c=calc(m);g=c.gasto;i=c.ingreso}
    if(lente!=="yo"&&/^Aporte familiar/.test(t))g=0;
    out.push({m,id:m.id,fecha:m.fecha,hora:m.hora,cat:/^Retiro/.test(t)?"Efectivo sin detallar":(m.categoria||"Sin categoría"),estab:m.estab||m.desc||m.concepto,cuenta:m.cuenta,tipo:t,valor:+m.valor||0,g,i,q,recId:m.recId,origen:m.origen})}
  // Efectivo: lo que sacas del cajero cuenta como «Efectivo sin detallar»; cada gasto en efectivo que anotas se descuenta del retiro más antiguo que aún tenga saldo
  // (así el gasto aparece el día que lo hiciste, en su categoría, sin contarse dos veces).
  const ret=out.filter(x=>x.q==="yo"&&/^Retiro/.test(x.tipo)).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  for(const x of out.filter(x=>x.tipo==="Gasto en efectivo"&&x.q==="yo").sort((a,b)=>a.fecha.localeCompare(b.fecha))){let r=x.g;for(const y of ret){if(r<=0)break;if(y.fecha>x.fecha)break;const d=Math.min(r,y.g);y.g-=d;r-=d}}
  if(lente!=="yo")out.push(...ingresosFam());
  return out}
function sumQ(L,key,val){const o={};for(const x of L){const k=key(x);if(k==null||k==="")continue;const v=val(x);const e=o[k]||(o[k]={k,v:0,yo:0,fam:0});e.v+=v;e[x.q==="fam"?"fam":"yo"]+=v}return Object.values(o)}
function selLente(id){return`<div class="seg lentes" id="${id}">${LENTES().map(([k,l])=>`<button data-lente="${k}" class="${LENTE===k?"on":""}">${esc(l)}</button>`).join("")}</div>`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-lente]");if(!b||!S)return;LENTE=b.dataset.lente;render()});
// Íconos (solo decoración)
const ICAT=[[/mercado|supermerc/,"🛒"],[/transporte|taxi/,"🚕"],[/combustible|gasolina/,"⛽"],[/carro|veh[ií]culo|parqueadero/,"🚗"],[/educa|colegio|universidad|curso/,"🎓"],[/salud|m[eé]dic|droguer|farmac/,"💊"],
  [/domicilio/,"🛵"],[/restaurante/,"🍽️"],[/comida|almuerzo|cena/,"🍽️"],[/caf[eé]|snack/,"☕"],[/servicio/,"💡"],[/software|suscrip|digital/,"💻"],[/leasing|cr[eé]dito|banco|financ/,"🏦"],
  [/casa|hogar|arriendo|administraci/,"🏠"],[/compra|ropa|vestuario/,"🛍️"],[/entreten|cine|ocio/,"🎬"],[/viaje|turismo|hotel/,"✈️"],[/regalo/,"🎁"],[/mascota|perro|gato/,"🐾"],[/papeler|libro/,"📚"],
  [/seguro/,"🛡️"],[/reembolso/,"↩️"],[/ingreso|sueldo|prima/,"💰"],[/transferencia|pagos por/,"📲"],[/efectivo|cajero/,"💵"],[/impuesto/,"🧾"],[/deporte|gimnasio|nataci/,"🏊"],[/belleza|peluquer/,"💇"],[/familia/,"👨‍👩‍👧"],[/tecnolog|celular|computador/,"📱"],[/electrodom/,"🔌"],[/tramite|notar|document/,"📄"],[/otros|varios/,"📦"],[/ropa|calzado/,"👕"],[/sin categor/,"❔"]];
function icoCat(c){const k=normK(c);for(const [re,i] of ICAT)if(re.test(k))return i;return"🏷️"}
function icoCuenta(c){c=String(c||"");if(/efectivo/i.test(c))return"💵";if(/nequi/i.test(c))return"📱";if(isTC(c)||/^tarjeta/i.test(c))return"💳";if(rolCuenta(c)==="fam")return"💜";if(/bancolombia|ahorro|banco/i.test(c))return"🏦";return"👛"}
// ---- Configuración de la familia (Datos › Familia)
function cuentasConocidas(){const c=new Set([...(S.cuentas||[]),...S.mov.map(m=>m.cuenta),...Object.keys((S.familia||{}).cuentas||{})]);return[...c].filter(Boolean).sort()}
function rolSugerido(c){const r=rolCuenta(c);if(r)return r;return S.mov.some(m=>m.cuenta===c&&m.tipo==="Gasto de otra cuenta")?"fam":"yo"}
function aplicarCompartidos(nombres){ // personas que te pagan su parte de gastos compartidos: sus transferencias son reembolsos, no aportes familiares
  const pal=[...new Set(nombres.flatMap(n=>normK(n).toUpperCase().split(/[^A-Z0-9]+/)).filter(w=>w.length>=3))];if(!pal.length)return 0;
  const re=new RegExp("\\b("+pal.join("|")+")\\b","i"),ah=new Date().toISOString();let n=0;
  for(const m of S.mov){const d=normK(m.desc+" "+m.estab).toUpperCase();if(!re.test(d))continue;
    if(m.tipo==="Aporte familiar recibido"){m.tipo="Reembolso de gasto compartido";m.categoria="Reembolsos";m.editado=ah;n++}
    else if(m.tipo==="Aporte familiar enviado"){m.tipo="Gasto débito";m.categoria=m.categoria&&m.categoria!=="Familia"?m.categoria:"Pagos por transferencia";m.editado=ah;n++}}
  for(const r of S.reglas)if(r.propia&&/^Aporte familiar/.test(r.tipo)&&/^\/.*\/$/.test(r.patron)){const alts=r.patron.slice(1,-1).split("|").filter(a=>!pal.includes(normK(a).toUpperCase().trim()));r.patron=alts.length?"/"+alts.join("|")+"/":""}
  S.reglas=S.reglas.filter(r=>r.patron);if(!S.reglas.some(r=>r.propia&&r.tipo==="Reembolso de gasto compartido"&&r.patron==="/"+pal.join("|")+"/"))S.reglas.unshift({id:uid(),patron:"/"+pal.join("|")+"/",tipo:"Reembolso de gasto compartido",categoria:"Reembolsos",estab:"",propia:true});
  return n}
function vFamilia(){const F=S.familia,cu=cuentasConocidas();let ING=(F.ingresos||[]).map(x=>({...x}));
  const filaI=(x,i)=>`<tr><td><input type="date" data-ii="${i}" data-f="desde" value="${esc(x.desde)}"></td><td><input inputmode="decimal" data-ii="${i}" data-f="mensual" value="${esc(x.mensual)}" style="width:120px"></td><td><input inputmode="decimal" data-ii="${i}" data-f="primaPct" value="${esc(x.primaPct)}" style="width:60px">%</td><td><input data-ii="${i}" data-f="primaMeses" value="${esc((x.primaMeses||[]).join(", "))}" style="width:80px" placeholder="6, 12"></td><td><button class="b s" data-iq="${i}">✕</button></td></tr>`;
  const pinta=()=>{$("#fIng").innerHTML=`<table><tr><th>Desde</th><th>Sueldo mensual</th><th>Prima</th><th>Meses de prima</th><th></th></tr>${ING.map(filaI).join("")}</table>`;
    document.querySelectorAll("[data-ii]").forEach(e=>e.oninput=()=>{const x=ING[+e.dataset.ii],f=e.dataset.f;x[f]=f==="desde"?e.value:f==="primaMeses"?e.value.split(/[^\d]+/).map(Number).filter(n=>n>=1&&n<=12):parseNum(e.value)||0});
    document.querySelectorAll("[data-iq]").forEach(b=>b.onclick=()=>{ING.splice(+b.dataset.iq,1);pinta()})};
  dlg("👨‍👩‍👧 Familia",`<p class="small">La vista <b>Familia</b> suma tu dinero y el de tu familiar. Lo que se pasan entre ustedes no cuenta (no se cuenta doble). Inicio siempre muestra la familia.</p>
   <label>Nombre de tu familiar</label><input id="fNom" value="${esc(F.nombre)}" placeholder="Nombre" style="width:100%">
   <label>¿De quién es el dinero de cada cuenta?</label><div class="tw" style="max-height:220px"><table>${cu.map((c,i)=>`<tr><td>${icoCuenta(c)} ${esc(c)}</td><td><select data-cu="${i}"><option value="yo">Mío</option><option value="fam">De mi familiar</option><option value="ext">De otra persona (no cuenta)</option></select></td></tr>`).join("")}</table></div>
   <div class="small muted">El efectivo es tuyo (lo sacas del cajero). Si un pago en efectivo lo hizo tu familiar, márcalo así en el movimiento.</div>
   <label>Ingresos de tu familiar (estimados)</label><div id="fIng"></div><button class="b s" id="fAddI">+ Agregar (por ejemplo, cuando cambie el sueldo)</button>
   <label>Personas que te pagan su parte de gastos compartidos <span class="small muted">(sus transferencias son reembolsos, no aportes de la familia)</span></label>
   <input id="fComp" value="${esc((F.compartidos||[]).join(", "))}" placeholder="Nombres separados por coma" style="width:100%">`,
   [["Cancelar","",cerrar],["Guardar","p",()=>{respaldoAuto("antes de cambiar familia");F.nombre=$("#fNom").value.trim().slice(0,40);F.cuentas={};document.querySelectorAll("[data-cu]").forEach(s=>{F.cuentas[cu[+s.dataset.cu]]=s.value});
     F.ingresos=ING.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.desde)&&x.mensual>0);const comp=$("#fComp").value.split(",").map(x=>x.trim()).filter(Boolean);F.compartidos=comp;const n=comp.length?aplicarCompartidos(comp):0;
     const ah=new Date().toISOString();for(const m of S.mov){const t=tipoParaCuenta(m.cuenta,m.tipo,m.pagador);if(t!==m.tipo){m.tipo=t;m.editado=ah}}
     changed();cerrar();if(n)aviso(`${n} transferencias quedaron como reembolsos de gastos compartidos.`);render()}]]);
  document.querySelectorAll("[data-cu]").forEach(s=>s.value=rolSugerido(cu[+s.dataset.cu]));pinta();$("#fAddI").onclick=()=>{ING.push({desde:hoyISO().slice(0,7)+"-01",mensual:(ING[ING.length-1]||{}).mensual||0,primaPct:50,primaMeses:[6,12]});pinta()}}
// ======================= Gráficos =======================
let G={agr:"mes",per:"",cuenta:"",cat:"",est:"",clase:"",grupo:"",anio:""};
const PAL=["#3b78b5","#e08a2e","#2a9d8f","#9c5bb5","#c9a227","#d1495b","#5f8f3a","#8a6d5a","#4aa3c7","#7a7f8c"];
const perKey=(f,a)=>a==="anio"?f.slice(0,4):a==="sem"?f.slice(0,4)+"-S"+(+f.slice(5,7)<=6?1:2):f.slice(0,7);
const MESN=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const perLbl=k=>/^\d{4}-\d{2}$/.test(k)?MESN[+k.slice(5)-1]+" "+k.slice(2,4):k.replace("-S"," S");
const fmtM=n=>{if(DISC)return"•••";const a=Math.abs(n);return (n<0?"-":"")+(a>=1e6?(a/1e6).toFixed(a>=1e7?0:1)+" M":a>=1e3?Math.round(a/1e3)+" k":Math.round(a))};
function grupoGasto(m){const t=m.tipo;
  if(t==="Leasing vivienda"||(t==="Intereses y seguros de crédito"&&/leasing/i.test(m.categoria)))return"Leasing (intereses y seguro)";
  if(/Cargo financiero|Intereses y seguros|Gasto financiero/.test(t))return"Intereses, cuotas de manejo y 4x1000";
  if(/Compra TC|Devolución TC/.test(t))return"Compras con tarjeta de crédito";
  if(/Gasto débito|Transferencia a terceros/.test(t))return"Débito, PSE, Nequi y Bre-B";
  if(/Retiro/.test(t))return"Efectivo";
  if(t==="Aporte familiar enviado")return"Aportes a la familia";
  if(/Aporte familiar recibido|Reembolso|^Devolución$/.test(t))return"Reembolsos y aportes recibidos";
  return null}
function claseTipo(t){
  if(/^Ingreso|Rendimientos/.test(t))return"Ingresos";
  if(/Compra TC|Cargo financiero TC|Avance TC|Devolución TC/.test(t))return"Tarjeta: compras y cargos";
  if(t==="Pago tarjeta de crédito")return"Tarjeta: pagos";
  if(/Pago crédito|Pago deuda|Intereses y seguros|Leasing|Desembolso|Deuda saldada/.test(t))return"Créditos y leasing";
  if(/Aporte familiar/.test(t))return"Familia";
  if(/Reembolso|^Devolución$/.test(t))return"Reembolsos";
  if(/Transferencia interna|Ajuste/.test(t))return"Movimientos internos";
  if(t==="Gasto de otra cuenta")return"Pagado desde otras cuentas";
  return"Gastos de cuenta (débito, PSE, efectivo)"}
function sumBy(L,key,val){const o={};for(const m of L){const k=key(m);if(k==null||k==="")continue;o[k]=(o[k]||0)+val(m)}return Object.entries(o).map(([k,v])=>({k,v}))}
// ======================= Tablero (6 vistas) =======================
// Un solo selector Año ▸ Mes arriba; una pregunta por vista. Clics manejados por delegación (los botones nunca quedan "muertos").
let T={vista:"gastos",anio:"",mes:"",cat:"",est:"",q:""};
const TV=[["gastos","📊 Gastos"],["categorias","🏷️ Categorías"],["comercios","🏪 Comercios"],["cuentas","👛 Cuentas"],["recibido","💰 Dinero recibido"],["ahorro","🐷 Dónde ahorrar"],["tarjeta","💳 Tarjeta"]];
const RECIBIDO=m=>{const t=m.tipo;if(/^Ingreso salario/.test(t))return"Sueldo";if(/Reembolso de gasto compartido/.test(t))return"Reembolsos de gastos compartidos";if(/Aporte familiar recibido/.test(t))return"Aportes familiares";if(/^Devolución$/.test(t))return"Devoluciones";if(/Ingreso extraordinario/.test(t))return"Liquidación de ahorros";if(/^Ingreso|Rendimientos/.test(t))return t==="Rendimientos"?"Rendimientos":"Otros ingresos";return null};
const montoRecibido=m=>RECIBIDO(m)?+m.valor:0;
function medioPago(m){const c=m.cuenta||"";if(m.tipo==="Gasto de otra cuenta")return c||"Otra cuenta";if(isTC(c))return"Tarjeta "+c.replace(/^(VISA|MASTERCARD)\s*/i,"$1 ");if(/nequi/i.test(c))return"Nequi";if(/efectivo/i.test(c)||m.tipo==="Retiro de efectivo")return"Efectivo";return c}
function barrasH(list,{color="#534AB7",fk="",activo="",n=12,fmtv=fmt,ico=null}={}){list=list.filter(x=>Math.round(x.v)>0).sort((a,b)=>b.v-a.v);const top=list.slice(0,n),rest=list.slice(n);
  if(rest.length)top.push({k:`Otros (${rest.length})`,v:rest.reduce((a,x)=>a+x.v,0),yo:rest.reduce((a,x)=>a+(x.yo||0),0),fam:rest.reduce((a,x)=>a+(x.fam||0),0),otros:1});
  if(!top.length)return'<div class="small muted">Sin datos en este período</div>';const mx=top[0].v,tot=list.reduce((a,x)=>a+x.v,0);
  const seg=x=>LENTE==="todo"&&x.fam>0&&x.yo!=null?[[Math.max(0,x.yo),COLQ.yo,"Yo"],[Math.max(0,x.fam),COLQ.fam,famNombre()]]:[[x.v,LENTE==="todo"&&x.yo!=null&&color==="#534AB7"?COLQ.yo:color,""]];
  return`<div class="hb">${top.map(x=>{const cl=fk&&!x.otros,on=activo&&x.k===activo;return`<div class="hr ${cl?"click":""} ${activo&&!on?"dim":""} ${on?"on":""}" ${cl?`data-fk="${fk}" data-fv="${esc(x.k)}"`:""} title="${esc(x.k)}: ${fmt(x.v)}${x.fam>0&&LENTE==="todo"?` (yo ${fmt(x.yo)} · ${esc(famNombre())} ${fmt(x.fam)})`:""}"><div class="hl">${ico&&!x.otros?ico(x.k)+" ":""}${esc(x.k)}</div><div class="ht">${seg(x).map(([v,c])=>`<div style="width:${v/mx*100}%;background:${c}"></div>`).join("")}</div><div class="hv">${fmtv(x.v)}<span class="muted"> ${tot?Math.round(x.v/tot*100)+"%":""}</span></div></div>`}).join("")}</div>`}
function columnas(vals,{color="#7F77DD",sel="",etiquetas=MESN,clave="m",apil=null}={}){const mx=Math.max(1,...vals);
  return`<div class="cols">${vals.map((v,i)=>{const p=apil&&LENTE==="todo"?[[Math.max(0,apil[1][i]),COLQ.fam],[Math.max(0,apil[0][i]),COLQ.yo]]:[[v,color]];
    return`<div class="c ${sel!==""&&+sel===i?"sel":""} ${sel!==""&&+sel!==i?"dim":""}" data-${clave}="${i}" title="${etiquetas[i]}: ${fmt(v)}${apil&&LENTE==="todo"?` (yo ${fmt(apil[0][i])} · ${esc(famNombre())} ${fmt(apil[1][i])})`:""}"><span class="cv">${v?fmtM(v):""}</span><span class="cbs">${p.map(([x,c])=>`<span class="cb" style="height:${Math.max(x>0?2:0,x/mx*120)}px;background:${c}"></span>`).join("")}</span><span class="cl">${etiquetas[i]}</span></div>`}).join("")}</div>`}
const leyendaQ=()=>LENTE==="todo"?`<div class="leyenda small"><span><i style="background:${COLQ.yo}"></i>Yo</span><span><i style="background:${COLQ.fam}"></i>${esc(famNombre())}</span></div>`:"";
const tarjetaKpi=a=>`<div class="kpis">${a.map(([l,v,c,sub])=>`<div class="kpi"><div class="l">${l}</div><div class="v ${c||""}">${v}</div>${sub?`<div class="small muted">${sub}</div>`:""}</div>`).join("")}</div>`;
const esFijo=x=>!!(x.recId||x.origen==="recurrente"||/Cuota de crédito|Leasing|Intereses y seguros/.test(x.tipo)||/educa|colegio|leasing|cr[eé]dito|seguro|servicio/.test(normK(x.cat)));
const recib=x=>LENTE!=="yo"&&/Aporte familiar/.test(x.tipo)?null:x.tipo==="Ingreso estimado"?(/^Prima/.test(x.estab)?"Prima ":"Sueldo ")+famNombre()+" (estimado)":RECIBIDO(x);
const montoRec=x=>recib(x)?(x.tipo==="Ingreso estimado"?x.i:+x.valor):0;
function vGraf(){
  const TODAS=lineas();
  const anios=[...new Set(S.mov.map(m=>m.fecha.slice(0,4)))].sort();if(!T.anio||!anios.includes(T.anio))T.anio=anios[anios.length-1]||String(new Date().getFullYear());
  const enAnio=TODAS.filter(x=>x.fecha.startsWith(T.anio));
  const enPer=T.mes===""?enAnio:enAnio.filter(x=>+x.fecha.slice(5,7)-1===+T.mes);
  const per=T.mes===""?T.anio:MESN[+T.mes]+" "+T.anio;
  const porMes=(L,f)=>{const a=Array(12).fill(0);for(const x of L)a[+x.fecha.slice(5,7)-1]+=f(x);return a};
  const gR=x=>x.g,gYo=x=>x.q==="fam"?0:x.g,gFa=x=>x.q==="fam"?x.g:0;
  const mesesCon=porMes(enAnio.filter(x=>!x.v),()=>1).filter(x=>x).length||1;
  const chips=[T.mes!==""&&["mes","📅 "+per],T.cat&&["cat",icoCat(T.cat)+" "+T.cat],T.est&&["est","🏪 "+T.est]].filter(Boolean);
  let h=`<div class="filters ttop">${selLente("lG")}<select id="tA">${anios.map(a=>`<option ${a===T.anio?"selected":""}>${a}</option>`).join("")}</select>
    <select id="tM"><option value="">Todo el año</option>${MESN.map((m,i)=>`<option value="${i}" ${T.mes!==""&&+T.mes===i?"selected":""}>${m} ${T.anio}</option>`).join("")}</select>
    <span class="chips" style="margin:0">${chips.map(([f,l])=>`<button class="fchip" data-x="${f}">${esc(l)} ✕</button>`).join("")}${chips.length?`<button class="fchip lim" data-x="todo">Quitar filtros</button>`:""}</span></div>
   <div class="seg tvistas">${TV.map(([k,l])=>`<button data-v="${k}" class="${T.vista===k?"on":""}">${l}</button>`).join("")}</div>`;
  if(T.vista==="gastos"){const G=porMes(enAnio,gR),tot=enPer.reduce((a,x)=>a+gR(x),0),imx=G.indexOf(Math.max(...G)),tf=enPer.reduce((a,x)=>a+gFa(x),0);
    const cats=sumQ(enPer,x=>x.cat,gR);
    h+=tarjetaKpi([["Gasto total · "+per,fmt(tot),"neg",LENTE==="todo"?`yo ${fmt(tot-tf)} · ${esc(famNombre())} ${fmt(tf)}`:""],["Promedio mensual "+T.anio,fmt(G.reduce((a,b)=>a+b,0)/mesesCon)],["Mes más alto",MESN[imx]+" · "+fmtM(G[imx])]])
      +`<div class="card"><h2>Gasto total por mes <span class="small muted">toca un mes</span></h2>${columnas(G,{sel:T.mes,apil:[porMes(enAnio,gYo),porMes(enAnio,gFa)]})}${leyendaQ()}</div>
      <div class="card"><h2>En qué se fue · ${esc(per)} <span class="small muted">toca una categoría</span></h2>${barrasH(cats,{fk:"cat",ico:icoCat})}</div>`}
  if(T.vista==="categorias"){const cats=sumQ(enPer,x=>x.cat,gR);const c=T.cat||(cats.slice().sort((a,b)=>b.v-a.v)[0]||{}).k||"";
    const deC=x=>x.cat===c;const G=porMes(enAnio.filter(deC),gR),tot=enPer.filter(deC).reduce((a,x)=>a+gR(x),0),totAll=enPer.reduce((a,x)=>a+gR(x),0);
    h+=tarjetaKpi([[icoCat(c)+" "+esc(c)+" · "+per,fmt(tot),"neg"],["Promedio mensual",fmt(G.reduce((a,b)=>a+b,0)/mesesCon)],["% del gasto",totAll?Math.round(tot/totAll*100)+"%":"—"]])
      +`<div class="g2"><div class="card"><h2>Categorías · ${esc(per)}</h2>${barrasH(cats,{fk:"cat",activo:c,ico:icoCat})}</div>
      <div class="card"><h2>¿Dónde, en ${esc(c)}?</h2>${barrasH(sumQ(enPer.filter(deC),x=>x.estab,gR),{color:"#1D9E75",fk:"est",activo:T.est})}</div></div>
      <div class="card"><h2>${esc(c)} mes a mes</h2>${columnas(G,{sel:T.mes,color:"#1D9E75",apil:[porMes(enAnio.filter(deC),gYo),porMes(enAnio.filter(deC),gFa)]})}${leyendaQ()}</div>`}
  if(T.vista==="comercios"){const q=normTxt(T.q);const L=sumQ(enPer.filter(x=>gR(x)>0&&!x.v),x=>x.estab,gR).filter(x=>!q||normTxt(x.k).includes(q));
    h+=`<div class="filters"><input id="tQ" placeholder="Buscar comercio" value="${esc(T.q)}" style="flex:1"></div><div class="card"><h2>Dónde gastan más · ${esc(per)} <span class="small muted">toca uno para ver sus compras</span></h2>${barrasH(L,{color:"#D85A30",fk:"est",activo:T.est,n:25})}${leyendaQ()}</div>`}
  if(T.vista==="cuentas"){const mp=x=>x.m?medioPago(x.m):x.cuenta;const gastoPor=sumQ(enPer.filter(x=>!x.v),mp,gR);const pagosTC=enPer.filter(x=>x.tipo==="Pago tarjeta de crédito").reduce((a,x)=>a+x.valor,0);const top=gastoPor.slice().sort((a,b)=>b.v-a.v)[0];
    h+=tarjetaKpi([["Desde donde más se paga",top?icoCuenta(top.k)+" "+esc(top.k):"—"],["Gastado con tarjeta de crédito",fmt(gastoPor.filter(x=>/^Tarjeta/.test(x.k)).reduce((a,x)=>a+x.v,0))],["Pagos a la tarjeta (no es gasto)",fmt(pagosTC)]])
      +`<div class="card"><h2>Desde dónde se pagan los gastos · ${esc(per)}</h2>${barrasH(gastoPor,{color:"#185FA5",ico:icoCuenta})}<div class="small muted" style="margin-top:6px">Los pagos a la tarjeta no se suman: el gasto ya se contó al comprar. El efectivo cuenta cuando lo sacas del cajero («Efectivo sin detallar») y se reparte en categorías a medida que anotas en qué lo gastaste.</div></div>`}
  if(T.vista==="recibido"){const R=sumQ(enPer,recib,montoRec);const G=porMes(enAnio,montoRec);const tot=R.reduce((a,x)=>a+x.v,0),ing=enPer.reduce((a,x)=>a+x.i,0);
    h+=tarjetaKpi([["Recibido · "+per,fmt(tot),"pos"],["Ingresos (sueldos, primas…)",fmt(ing),"",LENTE!=="yo"&&(S.familia.ingresos||[]).length?"incluye el sueldo estimado de "+esc(famNombre()):""],["Reembolsos y aportes",fmt(tot-ing)]])
      +`<div class="g2"><div class="card"><h2>Qué dinero entró</h2>${barrasH(R,{color:"#0F6E56",ico:()=>"💰"})}</div><div class="card"><h2>¿De quién? <span class="small muted">sin sueldos</span></h2>${barrasH(sumQ(enPer.filter(x=>recib(x)&&!x.i&&x.tipo!=="Ingreso estimado"),x=>x.estab,montoRec),{color:"#0F6E56"})}</div></div>
      <div class="card"><h2>Recibido por mes</h2>${columnas(G,{sel:T.mes,color:"#1D9E75"})}<div class="small muted">${LENTE==="yo"?"Sueldo, premios y liquidaciones cuentan como ingreso; reembolsos y aportes familiares reducen tu gasto.":"En la vista Familia lo que se pasan entre ustedes no aparece: es plata que se mueve dentro de la familia."}</div></div>`}
  if(T.vista==="ahorro")h+=htmlAhorro(TODAS);
  if(T.vista==="tarjeta")h+=htmlTarjeta();
  if(T.vista!=="tarjeta"&&T.vista!=="ahorro"){let L=enPer.filter(x=>!x.v);if(T.vista==="recibido")L=L.filter(x=>recib(x));else if(T.vista==="cuentas")L=L.filter(x=>gR(x)>0||x.tipo==="Pago tarjeta de crédito");else L=L.filter(x=>gR(x)!==0);
    if(T.cat)L=L.filter(x=>x.cat===T.cat);if(T.est)L=L.filter(x=>x.estab===T.est);
    L=L.slice().sort((a,b)=>ordenMov(a.m,b.m));
    h+=`<div class="card"><h2>Movimientos · ${esc(per)}${T.cat?" · "+esc(T.cat):""}${T.est?" · "+esc(T.est):""} <span class="small muted">${L.length} · ${fmt(L.reduce((a,x)=>a+(T.vista==="recibido"?montoRec(x):gR(x)||x.valor),0))}</span></h2>
     <div class="tw" style="max-height:380px"><table><tr><th>Fecha</th><th>Movimiento</th><th>Cuenta</th><th class="n">Valor</th></tr>${L.slice(0,300).map(x=>{const m=x.m;return`<tr class="click" data-id="${esc(m.id)}"><td>${esc(m.fecha)}${m.hora?`<div class="small muted">${m.hora}</div>`:""}</td><td>${icoCat(x.cat)} <b>${esc(x.estab)}</b>${x.q==="fam"?` <span class="chip fam">${esc(famNombre())}</span>`:""}<div class="small muted">${esc(m.concepto)}${m.categoria?" · "+esc(m.categoria):""}${(m.adjuntos||[]).length?" · 📎":""}${m.tc&&m.tc.cuotas>1?` · ${m.tc.cuotaActual||"?"}/${m.tc.cuotas} cuotas`:""}</div></td><td class="small">${icoCuenta(medioPago(m))} ${esc(medioPago(m))}</td><td class="n">${fmt(m.valor)}</td></tr>`}).join("")||'<tr><td class="muted">Sin movimientos</td></tr>'}</table></div></div>`}
  $("#view").innerHTML=h;
  $("#tA").onchange=e=>{T.anio=e.target.value;T.mes="";vGraf()};$("#tM").onchange=e=>{T.mes=e.target.value;vGraf()};
  if($("#tQ"))$("#tQ").oninput=e=>{T.q=e.target.value;clearTimeout(vGraf._q);vGraf._q=setTimeout(()=>{vGraf();const i=$("#tQ");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)};
  if(T.vista==="tarjeta")bindTarjeta();
}
function htmlAhorro(TODAS){ // Dónde ahorrar: se compara el último mes completo con el promedio de los 3 anteriores
  const hoy=hoyISO(),mesAct=hoy.slice(0,7);const mesesDe=k=>{const [y,m]=k.split("-").map(Number);return(d)=>{const t=new Date(y,m-1-d,1);return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")}};
  const ref=T.mes!==""?T.anio+"-"+String(+T.mes+1).padStart(2,"0"):mesesDe(mesAct)(1);const ant=[1,2,3].map(mesesDe(ref));
  const G=TODAS.filter(x=>x.g!==0),del=k=>G.filter(x=>x.fecha.startsWith(k));
  const sumC=L=>{const o={};for(const x of L)o[x.cat]=(o[x.cat]||0)+x.g;return o};
  const cR=sumC(del(ref)),cA=ant.map(k=>sumC(del(k)));const prom=c=>cA.reduce((a,o)=>a+(o[c]||0),0)/3;
  const cambios=Object.keys({...cR,...Object.assign({},...cA)}).map(c=>({c,act:cR[c]||0,prom:prom(c)})).map(x=>({...x,d:x.act-x.prom})).filter(x=>Math.abs(x.d)>=1000&&(x.act>0||x.prom>0)&&!/reembols|ingreso/.test(normK(x.c))).sort((a,b)=>b.d-a.d);
  const tot=del(ref).reduce((a,x)=>a+x.g,0),fijo=del(ref).filter(esFijo).reduce((a,x)=>a+x.g,0);
  const tres=G.filter(x=>ant.concat([ref]).some(k=>x.fecha.startsWith(k))&&!esFijo(x)&&!x.v&&x.g>0);const com=sumQ(tres,x=>x.estab,x=>x.g/4).sort((a,b)=>b.v-a.v).slice(0,12);
  const subs=(S.rec||[]).filter(r=>r.activo&&/software|suscrip|digital|entreten|streaming/i.test(normK(r.categoria)+" "+normK(r.tipo))).map(r=>{const v=vigenteEn(r,hoy)||{};const m=+(v.monto??r.monto)||0;const c=+r.cada||1,f=r.unidad==="anios"?1/(12*c):r.unidad==="semanas"?52/12/c:r.unidad==="dias"?30.4/c:1/c;return{k:r.nombre,v:m*f*12}}).filter(x=>x.v>0);
  const ing=TODAS.filter(x=>x.fecha.startsWith(ref)).reduce((a,x)=>a+x.i,0);
  return tarjetaKpi([["Gasto de "+perLbl(ref),fmt(tot),"neg"],["Fijo (cuotas, colegio, servicios, recurrentes)",fmt(fijo),"",tot?Math.round(fijo/tot*100)+"% del gasto":""],["Variable (aquí se puede recortar)",fmt(tot-fijo),"neg",tot?Math.round((tot-fijo)/tot*100)+"% del gasto":""],["Ahorro del mes (ingresos − gasto)",fmt(ing-tot),ing-tot>=0?"pos":"neg",ing?Math.round((ing-tot)/ing*100)+"% de los ingresos":""]])
   +`<div class="g2"><div class="card"><h2>📈 Lo que más subió · ${esc(perLbl(ref))} <span class="small muted">vs. promedio de los 3 meses anteriores</span></h2>${cambios.filter(x=>x.d>0).slice(0,10).map(x=>`<div class="vrow click" data-fk="cat" data-fv="${esc(x.c)}">${icoCat(x.c)} <b>${esc(x.c)}</b> <span class="neg" style="float:right">+${fmt(x.d)}</span><div class="small muted">${fmt(x.act)} este mes · promedio ${fmt(x.prom)}</div></div>`).join("")||'<p class="small muted">Nada subió frente al promedio. 👏</p>'}</div>
    <div class="card"><h2>📉 Lo que bajó</h2>${cambios.filter(x=>x.d<0).reverse().slice(0,8).map(x=>`<div class="vrow">${icoCat(x.c)} <b>${esc(x.c)}</b> <span class="pos" style="float:right">${fmt(x.d)}</span><div class="small muted">${fmt(x.act)} este mes · promedio ${fmt(x.prom)}</div></div>`).join("")||'<p class="small muted">—</p>'}</div></div>
   <div class="g2"><div class="card"><h2>🏪 Gasto variable por comercio <span class="small muted">promedio mensual, últimos 4 meses</span></h2>${barrasH(com,{color:"#D85A30",fk:"est"})}${leyendaQ()}</div>
    <div class="card"><h2>💻 Suscripciones: costo al año</h2>${subs.length?barrasH(subs,{color:"#7F77DD",n:15})+`<div class="small muted">Total ${fmt(subs.reduce((a,x)=>a+x.v,0))} al año. ¿Alguna que ya no uses?</div>`:'<p class="small muted">No hay suscripciones activas en Recurrentes.</p>'}</div></div>`}
// Delegación única para el tablero: funciona aunque la vista se redibuje
document.addEventListener("click",e=>{if(TAB!=="graf"||!S)return;const v=$("#view");if(!v.contains(e.target))return;
  const b=e.target.closest("[data-v],[data-x],[data-m],[data-fk],tr[data-id]");if(!b||!v.contains(b))return;
  if(b.matches(".tvistas [data-v]")){T.vista=b.dataset.v;T.est="";vGraf();return}
  if(b.dataset.x){const f=b.dataset.x;if(f==="todo"){T.mes="";T.cat="";T.est=""}else T[f]="";vGraf();return}
  if(b.dataset.m!==undefined&&b.closest(".cols")){T.mes=String(T.mes)===b.dataset.m?"":b.dataset.m;vGraf();return}
  if(b.dataset.fk){const f=b.dataset.fk,val=b.dataset.fv;if(f==="cat"&&T.vista==="gastos"){T.cat=val;T.vista="categorias";T.est=""}else{T[f]=T[f]===val?"":val;if(f==="cat")T.est=""}vGraf();return}
  if(b.matches("tr[data-id]")){editar(b.dataset.id);return}
});

// ======================= Tarjeta de crédito: deuda, cuotas, próximo pago, proyección y simulador =======================
function cuotaFija(P,i,n){return i>0?P*i/(1-Math.pow(1+i,-n)):P/n}
function infoTC(m){return m.tc||{}}
function comprasEnCuotas(){ // compras con saldo pendiente según el último extracto (o estimado si la anotaste tú)
  const hoy=hoyISO();return S.mov.filter(m=>isTC(m.cuenta)&&calc(m).dtc>0&&m.tc&&m.tc.cuotas>1).map(m=>{const t=m.tc;
    const n=+t.cuotas,act=Math.min(n,+t.cuotaActual||Math.max(1,mesesEntre(m.fecha,hoy))),restan=Math.max(0,n-act);
    const i=(t.modalidad==="sin_intereses")?0:(+t.tasaMV||0)/100;
    let saldo=t.saldo!=null&&t.saldo!==""?+t.saldo:Math.max(0,m.valor-(m.valor/n)*act);
    const cuota=+t.valorCuota||cuotaFija(m.valor,i,n);
    return{m,n,act,restan,i,saldo,cuota,fin:sumarMeses(m.fecha.slice(0,7)+"-01",n).slice(0,7)}}).filter(x=>x.restan>0&&x.saldo>0)}
function mesesEntre(a,b){return(+b.slice(0,4)-+a.slice(0,4))*12+(+b.slice(5,7)-+a.slice(5,7))}
function proyeccionTC(meses=12){ // pago esperado por mes: cuotas pendientes (capital + interés sobre saldo)
  const L=comprasEnCuotas(),hoy=hoyISO(),out=[];for(let k=1;k<=meses;k++)out.push({mes:sumarMeses(hoy.slice(0,7)+"-01",k).slice(0,7),capital:0,interes:0});
  for(const c of L){let s=c.saldo;const cap=c.saldo/c.restan;for(let k=0;k<c.restan&&k<meses;k++){const int=s*c.i;out[k].capital+=cap;out[k].interes+=int;s-=cap}}
  // compras a 1 cuota hechas después del último corte: se pagan en el próximo extracto
  const R=ultimoResumen();const corte=R?R.corte:"0000";const unaCuota=S.mov.filter(m=>isTC(m.cuenta)&&m.fecha>corte&&calc(m).dtc>0&&!(m.tc&&m.tc.cuotas>1)).reduce((a,m)=>a+calc(m).dtc,0);
  if(out[0])out[0].capital+=unaCuota;return out}
function ultimoResumen(){const L=(S.tcRes||[]).filter(r=>r.moneda==="COP"&&(r.deuda>0||r.pagoTotal>0)).sort((a,b)=>b.corte.localeCompare(a.corte));return L[0]||null}
function deudaTCHoy(){const R=ultimoResumen();if(R){let d=R.deuda;for(const m of S.mov)if(isTC(m.cuenta)||m.tipo==="Pago tarjeta de crédito")if(m.fecha>R.corte)d+=calc(m).dtc;return{d,desde:"extracto del "+R.corte}}
  const ini=((S.saldos||{}).deudas||[]).filter(x=>x.tipo==="tarjeta").reduce((a,x)=>a+x.saldo,0);return{d:ini+S.mov.reduce((a,m)=>a+calc(m).dtc,0),desde:"saldo inicial + movimientos"}}
function alertaPagoTC(){const R=ultimoResumen();if(!R||!R.pagarAntes)return null;const d=diasA(R.pagarAntes);if(d<-3||d>10)return null;
  const pagado=S.mov.filter(m=>m.tipo==="Pago tarjeta de crédito"&&m.fecha>R.corte).reduce((a,m)=>a+ +m.valor,0);if(pagado>=R.pagoTotal-1)return null;
  return{R,d,pagado}}
function htmlTarjeta(){const R=ultimoResumen(),D=deudaTCHoy(),P=proyeccionTC(12),C=comprasEnCuotas().sort((a,b)=>b.saldo-a.saldo);const al=alertaPagoTC();
  const intAnio=S.mov.filter(m=>m.fecha.startsWith(T.anio)&&/Cargo financiero TC/.test(m.tipo)).reduce((a,m)=>a+ +m.valor,0);
  const porMesInt=Array(12).fill(0);for(const m of S.mov)if(m.fecha.startsWith(T.anio)&&/Cargo financiero TC/.test(m.tipo))porMesInt[+m.fecha.slice(5,7)-1]+=+m.valor;
  const comprasMes=Array(12).fill(0),pagosMes=Array(12).fill(0);for(const m of S.mov){if(!m.fecha.startsWith(T.anio))continue;const i=+m.fecha.slice(5,7)-1;if(isTC(m.cuenta)&&/Compra TC/.test(m.tipo))comprasMes[i]+=+m.valor;if(m.tipo==="Pago tarjeta de crédito")pagosMes[i]+=+m.valor}
  const tasa=(S.tcTasas||[]).filter(x=>/2 - 36|cuotas/i.test(x.categoria)).sort((a,b)=>b.corte.localeCompare(a.corte))[0];
  return`${al?`<div class="card alerta"><h2>💳 Pago de la tarjeta ${al.d<0?"vencido hace "+(-al.d)+" días":al.d===0?"vence HOY":"vence en "+al.d+" días"} (${esc(al.R.pagarAntes)})</h2><div class="small">Pago total ${fmt(al.R.pagoTotal)} · pago mínimo ${fmt(al.R.pagoMinimo)}${al.pagado?` · ya pagaste ${fmt(al.pagado)}`:""}</div></div>`:""}
   ${tarjetaKpi([["Debes hoy (aprox.)",fmt(D.d),"neg"],["Próximo pago",R&&R.pagarAntes?`${esc(R.pagarAntes)} · ${fmtM(R.pagoTotal)}`:"Importa el resumen del extracto"],["Intereses y cargos "+T.anio,fmt(intAnio),"neg"]])}
   <div class="small muted" style="margin:-6px 0 10px">Deuda calculada desde el ${esc(D.desde)}${R?` · cupo disponible al corte ${fmt(R.cupoDisp)}`:""}${tasa?` · tasa a cuotas del último extracto: ${tasa.tasaMV}% mensual (${tasa.tasaEA}% E.A.)`:""}</div>
   <div class="card"><h2>Lo que te toca pagar los próximos meses <span class="small muted">cuotas pendientes + intereses estimados</span></h2>${columnas(P.map(x=>x.capital+x.interes),{etiquetas:P.map(x=>perLbl(x.mes)),color:"#A32D2D",clave:"p"})}
    <div class="small muted">No incluye compras que hagas desde hoy. ${P[0]?`En ${perLbl(P[0].mes)}: ${fmt(P[0].capital)} de cuotas + ${fmt(P[0].interes)} de intereses.`:""}</div></div>
   <div class="card"><h2>Compras en cuotas pendientes (${C.length})</h2>${C.length?`<div class="tw" style="max-height:360px"><table><tr><th>Compra</th><th>Cuotas</th><th class="n">Debes</th><th class="n">Cuota</th><th>Tasa</th><th>Termina</th></tr>${C.map(c=>`<tr class="click" data-tcid="${esc(c.m.id)}"><td><b>${esc(c.m.estab||c.m.desc)}</b><div class="small muted">${esc(c.m.fecha)} · ${fmt(c.m.valor)}</div></td><td>${c.act} de ${c.n}</td><td class="n">${fmt(c.saldo)}</td><td class="n">${fmt(c.cuota)}</td><td class="small">${c.i?(c.i*100).toFixed(2)+"% m.":"sin intereses"}</td><td>${esc(perLbl(c.fin))}</td></tr>`).join("")}</table></div>`:'<div class="small muted">Sin compras a cuotas con saldo. Importa el CSV <b>movimientos_tarjetas</b> de tu convertidor para traer las cuotas, o anótalas en cada compra.</div>'}</div>
   <div class="g2"><div class="card"><h2>Compras vs. pagos · ${esc(T.anio)}</h2>${columnas(comprasMes.map((v,i)=>v),{color:"#534AB7",clave:"x"})}<div class="small muted">Barras: compras con la tarjeta. Pagos del año: ${fmt(pagosMes.reduce((a,b)=>a+b,0))}.</div></div>
   <div class="card"><h2>Intereses y cargos por mes</h2>${columnas(porMesInt,{color:"#A32D2D",clave:"x"})}</div></div>
   <div class="card"><h2>Simulador: ¿a cuántas cuotas?</h2><div class="grid2"><div><label>Valor de la compra</label><input id="sV" inputmode="decimal" value="300000"></div><div><label>Tasa mensual (%)</label><input id="sI" inputmode="decimal" value="${tasa?tasa.tasaMV:"1.89"}"></div></div>
    <label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" id="sSin"> Sin intereses (precio de contado a cuotas)</label><div id="sOut" style="margin-top:8px"></div>
    <div class="grid2" style="margin-top:8px"><div><label>Si este mes pago…</label><input id="sPago" inputmode="decimal" value="${R?Math.round(R.pagoMinimo):""}"></div><div id="sPagoOut" class="small" style="align-self:end"></div></div></div>`}
function bindTarjeta(){const sim=()=>{const V=parseNum($("#sV").value)||0,i=$("#sSin").checked?0:(parseNum($("#sI").value)||0)/100;
    $("#sOut").innerHTML=`<table><tr><th>Cuotas</th><th class="n">Cuota mensual</th><th class="n">Pagas en total</th><th class="n">Intereses</th></tr>${[1,2,3,6,12,24,36].map(n=>{const c=n===1?V:cuotaFija(V,i,n),t=c*n;return`<tr><td>${n}</td><td class="n">${fmt(c)}</td><td class="n">${fmt(t)}</td><td class="n ${t-V>0?"neg":""}">${fmt(t-V)}</td></tr>`}).join("")}</table><div class="small muted">A 1 cuota no hay intereses si pagas el total en la fecha límite.</div>`;
    const D=deudaTCHoy().d,p=parseNum($("#sPago").value)||0,i2=(parseNum($("#sI").value)||0)/100;$("#sPagoOut").innerHTML=p?`Quedarías debiendo ≈ <b>${fmt(Math.max(0,D-p))}</b>; si no pagas el total, los intereses del mes serían ≈ <b>${fmt(Math.max(0,D-p)*i2)}</b>.`:""};
  ["sV","sI","sPago"].forEach(id=>$("#"+id).oninput=sim);$("#sSin").onchange=sim;sim();
  document.querySelectorAll("[data-tcid]").forEach(r=>r.onclick=()=>editar(r.dataset.tcid))}

// ======================= Por revisar =======================
function vRev(){
  const A=S.mov.filter(m=>m.revisar).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const B=S.mov.filter(m=>m.conciliacion==="solo_banco"&&isGastoAnotable(m)&&!m.revisado).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const C=S.mov.filter(m=>m.conciliacion==="solo_registro").sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const tb=(L,extra)=>`<div class="tw"><table><tr><th>Fecha</th><th>Cuenta</th><th>Movimiento</th><th>Tipo</th><th class="n">Valor</th>${extra?"<th></th>":""}</tr>${L.map(m=>`<tr class="click" data-id="${m.id}"><td>${m.fecha}</td><td class="small">${esc(m.cuenta)}</td><td><b>${esc(m.estab||m.desc)}</b><div class="small muted">${esc(m.revisar||m.concepto||m.desc)}</div></td><td class="small">${esc(m.tipo)}</td><td class="n">${fmt(m.valor)}</td>${extra?`<td><button class="b s" data-ok="${m.id}">Ya está bien</button></td>`:""}</tr>`).join("")||'<tr><td class="muted">Nada pendiente</td></tr>'}</table></div>`;
  $("#view").innerHTML=`<div class="card"><h2>Necesitan tu decisión (${A.length})</h2><div class="small muted">Transferencias a personas, ingresos de personas, pagos sin desglose. Ábrelos, cambia el Tipo si hace falta y borra el campo "Revisar".</div>${tb(A)}</div>
  <div class="card"><h2>Gastos del banco que no anotaste (${B.length})</h2><div class="small muted">Ponles concepto y categoría, o márcalos como revisados.</div>${tb(B,1)}</div>
  <div class="card"><h2>Anotados que no aparecen en el banco (${C.length})</h2><div class="small muted">Revisa si la fecha o el valor están mal, si es un duplicado o si se pagó desde otra cuenta.</div>${tb(C)}</div>`;
  document.querySelectorAll("tr[data-id]").forEach(t=>t.onclick=e=>{if(e.target.dataset.ok)return;editar(t.dataset.id)});
  document.querySelectorAll("[data-ok]").forEach(b=>b.onclick=e=>{e.stopPropagation();const m=S.mov.find(x=>x.id===b.dataset.ok);m.revisado=true;changed();vRev()});
}

// ======================= Deudas =======================
function vDeu(){ // lista simple: créditos y leasing (desde Recurrentes) + tarjeta (desde los extractos)
  const hoy=hoyISO(),anio=hoy.slice(0,4);const C=(S.rec||[]).filter(r=>r.tipo==="Leasing / deuda");
  const fila=r=>{const v=vigenteEn(r,hoy);const pagos=estadoRecDesde(r,anio+"-01-01",hoy).filter(x=>x.pago);const pagado=pagos.reduce((a,x)=>a+x.pago.valor,0);
    const prox=estadoRec(r).find(x=>x.fecha>=hoy&&!x.pago);const restan=r.fin?Math.max(0,mesesEntre(hoy,r.fin)+1):null;
    return`<tr class="click" data-r="${esc(r.id)}"><td><b>${esc(r.nombre)}</b><div class="small muted">${esc(v.cuenta)}${r.activo?"":" · finalizado"}</div></td><td class="n">${v.monto?fmt(v.monto):"variable"}</td><td>${prox?esc(prox.fecha):"—"}</td><td>${r.fin?esc(r.fin)+(restan!=null&&r.activo?` <span class="small muted">(${restan} cuotas)</span>`:""):"—"}</td><td class="n">${fmt(pagado)}</td></tr>`};
  const D=deudaTCHoy(),R=ultimoResumen(),Q=comprasEnCuotas();
  const totCuotas=C.filter(r=>r.activo).reduce((a,r)=>a+(vigenteEn(r,hoy).monto||0),0);
  $("#view").innerHTML=`<div class="kpis"><div class="kpi"><div class="l">Cuotas fijas al mes (créditos y leasing)</div><div class="v neg">${fmt(totCuotas)}</div></div><div class="kpi"><div class="l">Tarjeta: debes hoy (aprox.)</div><div class="v neg">${fmt(D.d)}</div></div><div class="kpi"><div class="l">Próximo pago de la tarjeta</div><div class="v">${R&&R.pagarAntes?esc(R.pagarAntes)+" · "+fmtM(R.pagoTotal):"—"}</div></div></div>
   <div class="card"><h2>Créditos y leasing</h2><div class="tw"><table><tr><th>Crédito</th><th class="n">Cuota</th><th>Próxima</th><th>Termina</th><th class="n">Pagado en ${anio}</th></tr>${C.map(fila).join("")||'<tr><td class="muted">Crea tus créditos en Recurrentes (tipo «Leasing / deuda»).</td></tr>'}</table></div>
    <div class="small muted">Cada pago se ve como una sola cuota con el valor que te descontaron. El saldo exacto de cada crédito lo ves en la app del banco.</div></div>
   <div class="card"><h2>Tarjeta de crédito</h2><p class="small">${Q.length} compras a cuotas con saldo pendiente${R?` · al corte del ${esc(R.corte)} debías ${fmt(R.deuda)} (cupo disponible ${fmt(R.cupoDisp)})`:""}.</p><button class="b p" id="dGoTC">Ver detalle y proyección de la tarjeta</button></div>`;
  document.querySelectorAll("#view [data-r]").forEach(e=>e.onclick=()=>editarR(e.dataset.r));
  $("#dGoTC").onclick=()=>{T.vista="tarjeta";TAB="graf";document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.t==="graf"));render()};
}

// ======================= Reglas =======================
function vReglas(){
  $("#view").innerHTML=`<div class="card"><h2>Reglas de clasificación al importar</h2><div class="small muted">Se aplican en orden; gana la primera que coincide con la descripción del banco. Usa texto simple o /expresión regular/. Las reglas que creas o editas (marcadas ★) se guardan cifradas en tus datos y se conservan en cada actualización de la app.</div>
  <div class="tw"><table><tr><th>#</th><th>Patrón</th><th>Tipo</th><th>Categoría</th><th>Establecimiento</th><th></th></tr>
  ${S.reglas.map((r,i)=>`<tr><td>${i+1}${r.propia?" ★":""}</td><td><input data-r="${i}" data-k="patron" value="${esc(r.patron)}" style="width:100%"></td><td><select data-r="${i}" data-k="tipo">${S.tipos.map(t=>`<option ${t.tipo===r.tipo?"selected":""}>${esc(t.tipo)}</option>`).join("")}</select></td><td><input data-r="${i}" data-k="categoria" value="${esc(r.categoria)}" size="12"></td><td><input data-r="${i}" data-k="estab" value="${esc(r.estab)}" size="14"></td><td style="white-space:nowrap"><button class="b s" data-up="${i}">↑</button><button class="b s" data-del="${i}">✕</button></td></tr>`).join("")}</table></div>
  <div class="filters" style="margin-top:8px"><button class="b" id="rAdd">+ Regla</button><button class="b" id="rApply">Aplicar reglas a los movimientos "Solo en banco" sin concepto</button><button class="b" id="rCat">Completar categorías vacías (por comercio)</button></div></div>
  <div class="card"><h2>Tipos y cómo cuentan</h2><div class="small muted">1 suma, -1 resta, 0 no cuenta.</div><div class="tw"><table><tr><th>Tipo</th><th class="n">Gasto</th><th class="n">Ingreso</th><th class="n">Flujo</th><th class="n">Δ TC</th><th class="n">Δ Créd.</th><th>Qué significa</th></tr>
  ${S.tipos.map((t,i)=>`<tr><td>${esc(t.tipo)}</td>${["gasto","ingreso","flujo","dtc","dcred"].map(k=>`<td class="n"><input data-t="${i}" data-k="${k}" value="${t[k]}" size="2" style="text-align:right"></td>`).join("")}<td class="small">${esc(t.desc)}</td></tr>`).join("")}</table></div></div>`;
  document.querySelectorAll("[data-r]").forEach(e=>e.onchange=()=>{const r=S.reglas[+e.dataset.r];r[e.dataset.k]=e.value;r.propia=true;changed()});
  document.querySelectorAll("[data-t]").forEach(e=>e.onchange=()=>{S.tipos[+e.dataset.t][e.dataset.k]=+e.value||0;changed()});
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{S.reglas.splice(+b.dataset.del,1);changed();vReglas()});
  document.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>{const i=+b.dataset.up;if(i>0){[S.reglas[i-1],S.reglas[i]]=[S.reglas[i],S.reglas[i-1]];changed();vReglas()}});
  $("#rAdd").onclick=()=>{S.reglas.unshift({id:uid(),patron:"",tipo:"Gasto débito",categoria:"",estab:"",propia:true});changed();vReglas()};
  $("#rCat").onclick=()=>{respaldoAuto("antes de completar categorías");let n=0;const ah=new Date().toISOString();for(const m of S.mov){if(m.categoria||!calc(m).gasto)continue;const r=regla(m.desc)||regla(m.estab);const c=catAprendida(m.estab)||(r&&r.categoria);if(c){m.categoria=c;if(!m.estab&&r&&r.estab)m.estab=r.estab;m.editado=ah;n++}}if(n)changed();alert(n?`${n} movimientos quedaron con categoría.`:"No encontré movimientos sin categoría que se puedan completar.");render()};
  $("#rApply").onclick=()=>{respaldoAuto("antes de aplicar reglas");let n=0;for(const m of S.mov)if(m.conciliacion==="solo_banco"&&!m.concepto){const r=regla(m.desc);if(r){const ent=tipoInfo(m.tipo).flujo>0;m.tipo=/^Aporte familiar/.test(r.tipo)?(ent?"Aporte familiar recibido":"Aporte familiar enviado"):r.tipo;if(r.categoria)m.categoria=r.categoria;if(r.estab)m.estab=r.estab;n++}}changed();alert(n+" movimientos actualizados")};
}
function regla(desc){const d=String(desc||"").toUpperCase();for(const r of S.reglas){if(!r.patron)continue;let ok=false;if(/^\/.*\/$/.test(r.patron)){try{ok=new RegExp(r.patron.slice(1,-1),"i").test(d)}catch(e){}}else ok=d.includes(r.patron.toUpperCase());if(ok)return r}return null}

// ======================= Datos =======================
function vDatos(){
  const tam=new Blob([JSON.stringify(S)]).size;let nAdj=0,pend=0;for(const [m,a] of todosAdj()){nAdj++;if(a.tipo!=="enlace"&&!a.enCarpeta)pend++}
  const dbxCard=`<div class="card"><h2>Dropbox</h2>${conDropbox()?`<p class="small">✓ Conectado. Cada cambio se cifra y se guarda solo en <b>Dropbox › Aplicaciones › (tu app) </b>; los otros dispositivos lo ven en menos de un minuto. ${DBX.error?`<br><span class="neg">${esc(DBX.error)}</span>`:""}</p>
     <label style="display:flex;gap:8px;align-items:flex-start;color:var(--ink)"><input type="checkbox" id="xPlano" ${S.syncPlano!==false?"checked":""}><span class="small">Escribir el archivo para la sincronización semanal con Sheets, Notion y Capacities (<b>sin cifrar</b>: movimientos y notas, sin facturas). Si lo apagas, esa sincronización se detiene.</span></label>
     <label style="display:flex;gap:8px;align-items:flex-start;color:var(--ink)"><input type="checkbox" id="xPre" ${S.precarga!==false?"checked":""}><span class="small">El texto se sincroniza al instante y los adjuntos van aparte: se <b>suben en segundo plano</b> (con reintentos) y en los otros dispositivos se bajan <b>cuando los abres</b>. Activa esto para traer además, sin que lo pidas, las fotos, audios y PDF de los últimos 60 días (hasta 60 MB por vez; no lo hace en modo ahorro de datos).</span></label>
     <div class="filters"><button class="b p" id="xSync">Sincronizar ahora</button>${DBX.danado?`<button class="b" id="xRepl">Reemplazar el archivo de Dropbox con la copia de este dispositivo</button>`:""}<button class="b" id="xAdj">Subir adjuntos pendientes${pend?" ("+pend+")":""}</button><button class="b" id="xOff">Desconectar este dispositivo</button></div>`
    :`<p class="small">Conecta Dropbox para que el guardado sea automático en el celular y en el computador, y los cambios de un dispositivo aparezcan en el otro.</p><div class="filters"><button class="b p" id="xOn">Conectar con Dropbox</button></div>`}</div>`;
  $("#view").innerHTML=dbxCard+`<div class="card"><h2>Dónde están tus datos</h2>
   <p>${S.mov.length} movimientos · ${nAdj} adjuntos · archivo de datos de ${(tam/1048576).toFixed(2)} MB. Todo se guarda <b>cifrado</b> con tu clave. La app solo se conecta a Dropbox (si lo conectas) y solo le envía datos cifrados, salvo el archivo de sincronización semanal.</p>
   ${FSA?`<p class="small">${dirHandle?`Carpeta vinculada: <b>${esc(dirHandle.name)}</b> ${carpetaOK?"✓ guardando sola":"(toca Reconectar)"} · datos, respaldo diario, adjuntos y archivo de sincronización se escriben ahí.`:"Vincula tu carpeta Dropbox › Finanzas Memphis y la app guardará sola ahí."}</p>
   <div class="filters"><button class="b p" id="dDir">${dirHandle?"Reconectar / cambiar carpeta":"Vincular carpeta Finanzas Memphis"}</button>${dirHandle?`<button class="b" id="dSubAdj">Copiar adjuntos a la carpeta${pend?" ("+pend+" pendientes)":""}</button><button class="b" id="dSyncW">Escribir archivo de sincronización ahora</button>`:""}</div>`
   :`<p class="small">En este dispositivo guardas a mano: descarga el archivo cifrado y guárdalo en Dropbox › Finanzas Memphis › datos (reemplazando el anterior).</p>`}
   <div class="filters"><button class="b ${FSA&&dirHandle?"":"p"}" id="dDown">Guardar archivo cifrado (.fmx)</button>${pend&&!dirHandle?`<button class="b" id="dZipP">Adjuntos nuevos para Dropbox (${pend})</button>`:""}<button class="b" id="dSync">Descargar archivo de sincronización</button><button class="b" id="dAdj">Ver todos los adjuntos</button></div>
   <div class="small muted">Último respaldo diario: ${S.ultimoRespaldo||"—"} · última sincronización escrita: ${S.ultimoSync?S.ultimoSync.slice(0,16).replace("T"," "):"—"}</div></div>
  <div class="card"><h2>Importar paquete</h2><p class="small">Para traer garantías, vencimientos y recurrentes preparados fuera de la app (por ejemplo, desde tu Notion o tu Google Sheets). Lo que ya exista no se duplica.</p><button class="b" id="dPaq">Importar paquete (.json)</button></div>
  <div class="card"><h2>Exportar (copias de respaldo)</h2>
   <div class="filters"><button class="b" id="dSheets">Excel con las columnas de tu Google Sheets</button><button class="b" id="dXlsx">Excel completo (con resumen)</button><button class="b" id="dCsv">CSV para Notion / Capacities</button></div>
   <div class="small muted">Estos archivos NO van cifrados: guárdalos solo en lugares privados.</div></div>
  <div class="card"><h2>👨‍👩‍👧 Familia</h2><p class="small">${S.familia.nombre?`Familiar: <b>${esc(S.familia.nombre)}</b> · cuentas suyas: ${Object.entries(S.familia.cuentas).filter(e=>e[1]==="fam").map(e=>esc(e[0])).join(", ")||"ninguna"} · ingresos estimados: ${(S.familia.ingresos||[]).length?fmt(S.familia.ingresos[S.familia.ingresos.length-1].mensual)+" al mes":"sin configurar"}`:"Configura quién es tu familiar, qué cuentas son suyas y sus ingresos para ver el dinero de toda la familia."}</p><button class="b p" id="famCfg">Configurar familia</button></div>
  <div class="card"><h2>Respaldos y papelera</h2>
   <p class="small">Copias cifradas automáticas al abrir la app y antes de importar o restaurar (quedan las 3 últimas), tus 3 últimas manuales, una por semana (6 semanas) y una por mes (12 meses).${conDropbox()?" En Dropbox: Aplicaciones › (carpeta de Memphis) › respaldos.":""} Lo que borras queda 30 días en la papelera.</p>
   <div class="filters"><button class="b p" id="bkVer">Respaldos: ver, crear o restaurar</button><button class="b" id="bkPap">Papelera${(S.papelera||[]).length?` (${S.papelera.length})`:""}</button></div></div>
  <div class="card"><h2>Seguridad</h2>
   <div class="grid2"><div><label>Bloquear tras minutos sin uso</label><input id="sBl" type="number" min="1" max="120" value="${S.bloqueoMin||10}"></div></div>
   <div class="filters" style="margin-top:8px"><button class="b" id="sBlG">Guardar</button><button class="b" id="sLock">Bloquear ahora</button><button class="b" id="sPass">Cambiar clave</button><button class="b" id="sOlv">Cerrar sesión en este dispositivo</button></div>
   <div class="small muted">Versión de la app ${APP_VERSION} · formato de datos ${FORMATO}</div></div>
  <div class="card"><h2>Saldos iniciales</h2><textarea id="dSal" style="font-family:ui-monospace,monospace;font-size:12px">${esc(JSON.stringify(S.saldos,null,1))}</textarea><button class="b" id="dSalG">Guardar saldos</button></div>
  <div class="card"><h2>Cruce automático al importar</h2><div class="grid2"><div><label>Días de tolerancia (cuentas)</label><input id="vB" value="${esc(S.ventana.banco)}"></div><div><label>Días de tolerancia (tarjeta)</label><input id="vT" value="${esc(S.ventana.tc)}"></div><div><label>Diferencia de valor permitida (%)</label><input id="vP" value="${esc(S.ventana.tolerancia)}"></div></div><button class="b" id="vG">Guardar</button></div>`;
  if(FSA){$("#dDir").onclick=async()=>{try{if(dirHandle&&await permiso(dirHandle,true)){carpetaOK=true;await persist();vDatos();return}const h=await window.showDirectoryPicker({id:"memphis",mode:"readwrite"});dirHandle=h;await DB.set("dirHandle",h);carpetaOK=true;await persist();await escribirSync();vDatos()}catch(e){if(e.name!=="AbortError")alert(e.message)}};
    if(dirHandle){$("#dSubAdj").onclick=subirAdjCarpeta;$("#dSyncW").onclick=async()=>{try{await escribirSync();changed();alert("Escrito en sync/finanzas_sync.json")}catch(e){alert(e.message)}}}}
  if(conDropbox()){$("#xSync").onclick=()=>dbxSync("manual");$("#xPlano").onchange=e=>{S.syncPlano=e.target.checked;changed()};$("#xPre").onchange=e=>{S.precarga=e.target.checked;changed();if(S.precarga){PRE.hecho=0;precargarAdj()}};
    if($("#xRepl"))$("#xRepl").onclick=async()=>{if(!confirm("Se sobrescribe el archivo de datos en Dropbox con lo que tiene este dispositivo. ¿Seguir?"))return;try{const s=await sellar(S);const r=await dbxUp(DBX_RUTA,s,{".tag":"overwrite"});S.dbx.rev=r.rev;S.dbx.sucio=false;S._base=huellas(S.mov);S._baseV=huellasV(S.venc);S._baseR=huellasR(S.rec);DBX.pausa=false;DBX.danado=false;DBX.error="";await DB.set("estado",await sellar(S));alert("Listo")}catch(e){alert(e.message)}vDatos()};$("#xOff").onclick=async()=>{if(!confirm("Este dispositivo dejará de sincronizar con Dropbox (tus datos en Dropbox no se borran). ¿Seguir?"))return;try{await fetch("https://api.dropboxapi.com/2/auth/token/revoke",{method:"POST",headers:{Authorization:"Bearer "+await dbxTok()}})}catch(e){}S.dbx=null;DBX.token=null;await persist();vDatos()};
    $("#xAdj").onclick=async()=>{let n=0;for(const [m,a] of todosAdj()){if(a.tipo==="enlace"||!a.sha||a.enCarpeta)continue;a.ruta=a.ruta||rutaAdj(m,a);const c=await DB.get("adj:"+a.sha);if(c){try{await dbxUp("/"+a.ruta,c,{".tag":"overwrite"});a.enCarpeta=true;n++}catch(e){}}}changed();alert(n+" adjuntos subidos a Dropbox");vDatos()}}
  else $("#xOn").onclick=pedirAppKey;
  $("#dDown").onclick=async()=>descargar(new Blob([await sellar(S)],{type:"application/octet-stream"}),"finanzas-memphis.fmx");
  if($("#dZipP"))$("#dZipP").onclick=()=>zipAdj(true);
  $("#dSync").onclick=()=>{descargar(new Blob([datosSync()],{type:"application/json"}),"finanzas_sync.json");S.ultimoSync=new Date().toISOString();changed()};
  $("#dAdj").onclick=verAdjuntos;$("#dPaq").onclick=()=>elegirArchivo(".json",importarPaquete);
  $("#dSheets").onclick=exportSheets;$("#dXlsx").onclick=exportXlsx;$("#dCsv").onclick=exportCsv;
  $("#sBlG").onclick=()=>{S.bloqueoMin=Math.min(120,Math.max(1,+$("#sBl").value||10));changed();alert("Guardado")};
  $("#sLock").onclick=bloquear;$("#sOlv").onclick=olvidarDispositivo;
  $("#famCfg").onclick=vFamilia;$("#bkVer").onclick=vRespaldos;$("#bkPap").onclick=vPapelera;
  $("#sPass").onclick=()=>{dlg("Cambiar clave",`<label>Clave actual</label><input type="password" id="cp0" style="width:100%"><label>Clave nueva</label><input type="password" id="cp1" autocomplete="new-password" style="width:100%"><label>Repítela</label><input type="password" id="cp2" autocomplete="new-password" style="width:100%"><p class="small muted">Los adjuntos no hay que volver a cifrarlos: usan una llave interna que va dentro de tu archivo de datos.</p>`,[["Cancelar","",cerrar],["Cambiar","p",async()=>{
      try{await abrirSobre(await sellar(S),$("#cp0").value)}catch(e){alert("La clave actual no es correcta");return}
      const a=$("#cp1").value;if(a!==$("#cp2").value){alert("Las claves nuevas no coinciden");return}if(a.length<12||fuerza(a)<3){alert("Clave muy débil");return}
      await nuevaClave(a);S.ultimoRespaldo="";await persist();cerrar();
      if(dirHandle&&carpetaOK&&confirm("Clave cambiada. Los respaldos anteriores en la carpeta siguen cifrados con la clave VIEJA. ¿Borrarlos y dejar solo el de hoy (con la clave nueva)?")){try{const d=await subdir("respaldos");const hoy=`finanzas-memphis_${new Date().toISOString().slice(0,10)}.fmx`;for await(const [n] of d.entries())if(n!==hoy)await d.removeEntry(n)}catch(e){}}
      alert("Clave cambiada."+(dirHandle?"":" Guarda de nuevo el archivo cifrado en Dropbox."))}]])};
  $("#dSalG").onclick=()=>{try{S.saldos=JSON.parse($("#dSal").value);changed();alert("Guardado")}catch(e){alert("JSON inválido: "+e.message)}};
  $("#vG").onclick=()=>{S.ventana={banco:+$("#vB").value||4,tc:+$("#vT").value||7,tolerancia:+$("#vP").value||3};changed();alert("Guardado")};
}
async function importarPaquete(f){let d;try{d=JSON.parse(await f.text())}catch(e){alert("No es un JSON válido");return}
  if(!d||d.app!=="finanzas-memphis"||d.tipo!=="paquete"){alert("No es un paquete de Finanzas Memphis");return}
  await respaldoAuto("antes de importar paquete");
  if(d.salud&&typeof d.salud==="object"){const ok=importarSaludPaquete(d.salud);if(ok){alert("Salud importada ✓ Ya puedes borrar el archivo del paquete.");if(typeof irModulo==="function")irModulo("sal")}if(!d.familia&&!(d.vencimientos||[]).length&&!(d.recurrentes||[]).length)return}
  if(d.familia&&typeof d.familia==="object"){const t=migrar({mov:[],familia:d.familia}).familia;
    if(confirm(`Configurar la familia:\n• Familiar: ${t.nombre}\n• Cuentas suyas: ${Object.entries(t.cuentas).filter(e=>e[1]==="fam").map(e=>e[0]).join(", ")}\n• Ingresos estimados: ${t.ingresos.map(x=>fmt(x.mensual)+" desde "+x.desde+(x.primaPct?` + prima ${x.primaPct}% en meses ${x.primaMeses.join(" y ")}`:"")).join("; ")}\n• Gastos compartidos (reembolsos): ${t.compartidos.join(", ")||"—"}\n\n¿Aplicar?`)){
      S.familia=Object.assign(S.familia||{},t,{cuentas:Object.assign({},(S.familia||{}).cuentas,t.cuentas)});const n=t.compartidos.length?aplicarCompartidos(t.compartidos):0;
      const ah=new Date().toISOString();let k=0;for(const m of S.mov){const tp=tipoParaCuenta(m.cuenta,m.tipo,m.pagador);if(tp!==m.tipo){m.tipo=tp;m.editado=ah;k++}}
      changed();alert(`Familia configurada ✓${n?`\n${n} transferencias pasaron a reembolsos de gastos compartidos.`:""}${k?`\n${k} movimientos ajustados según de quién es la cuenta.`:""}`);render()}
    if(!(d.vencimientos||[]).length&&!(d.recurrentes||[]).length)return}
  const tmp=migrar({venc:d.vencimientos||[],rec:d.recurrentes||[],mov:[]});
  const nv=tmp.venc.filter(v=>!(S.venc||[]).some(x=>x.id===v.id)),nr=tmp.rec.filter(r=>!(S.rec||[]).some(x=>x.id===r.id));
  const act=nv.filter(v=>v.estado!=="cerrado").length;
  if(!nv.length&&!nr.length){alert("Todo lo de este paquete ya estaba en la app.");return}
  if(!confirm(`Se agregarán:\n• ${nv.length} vencimientos (${act} activos, ${nv.length-act} cerrados/historial)\n• ${nr.length} recurrentes\n\n${d.descripcion||""}\n\n¿Importar?`))return;
  const ahora=new Date().toISOString();for(const v of nv){v.editado=ahora;(S.venc=S.venc||[]).push(v)}for(const r of nr){r.editado=ahora;(S.rec=S.rec||[]).push(r)}
  for(const r of nr)if(r.cuenta&&!S.cuentas.includes(r.cuenta))S.cuentas.push(r.cuenta);
  changed();alert("Importado ✓");render()}
function exportSheets(){ // mismas columnas que la hoja "Movimientos" de Google Sheets + ID app
  const cu=S.mapaCuentasSheets||{};
  const filas=S.mov.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(m=>({Fecha:m.fecha,Item:m.concepto||m.estab||m.desc,Monto:m.valor,Naturaleza:naturaleza(m),Cuenta:cu[m.cuenta]||m.cuenta,Comercio:m.estab,"Categoría":m.categoria,Cuotas:"","Tipo de vencimiento":"","Vence manual":"","Plazo en días":"","Meses de garantía":"",Notas:[m.nota,(m.adjuntos||[]).map(a=>a.nombre).join(" | ")].filter(Boolean).join(" · "),"ID app":m.id,"Tipo (app)":m.tipo}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(filas),"Movimientos");XLSX.writeFile(wb,`finanzas_memphis_sheets_${new Date().toISOString().slice(0,10)}.xlsx`)}
function descargar(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function filasExport(){return S.mov.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(m=>{const c=calc(m);return{"ID app":m.id,Fecha:m.fecha,Mes:m.fecha.slice(0,7),Cuenta:m.cuenta,"Descripción banco":m.desc,Establecimiento:m.estab,Concepto:m.concepto,"Categoría":m.categoria,Tipo:m.tipo,Valor:m.valor,"Gasto real":c.gasto,Ingreso:c.ingreso,"Flujo caja":c.flujo,"Δ Deuda TC":c.dtc,"Δ Deuda créditos":c.dcred,Estado:(EST[m.conciliacion||""]||["",""])[1],Revisar:m.revisar,Nota:m.nota,Adjuntos:(m.adjuntos||[]).map(a=>a.tipo==="enlace"?a.url:a.nombre).join(" | ")}})}
function exportXlsx(){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(filasExport()),"Movimientos");
  const R=agrupar();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(Object.keys(R).sort().map(k=>({Mes:k,Ingresos:R[k].ing,"Gasto real":R[k].gas,"Con TC":R[k].tc,Financieros:R[k].fin,Ahorro:R[k].ing-R[k].gas,"Flujo caja":R[k].flu,"Δ Deuda TC":R[k].dtc,"Δ Deuda créditos":R[k].dcr,"Otras cuentas":R[k].otra}))),"Resumen");
  XLSX.writeFile(wb,`finanzas_memphis_${new Date().toISOString().slice(0,10)}.xlsx`)}
async function zipAdj(soloPend){const C=XLSX.CFB,z=C.utils.cfb_new();let n=0;const vistos=new Set();
  for(const [m,a] of todosAdj()){if(a.tipo==="enlace"||!a.sha||vistos.has(a.sha))continue;if(soloPend&&a.enCarpeta)continue;vistos.add(a.sha);
    const c=await DB.get("adj:"+a.sha);if(!c)continue;C.utils.cfb_add(z,"/"+(a.ruta||rutaAdj(m,a)).replace(/^adjuntos\//,""),c);n++}
  if(!n){alert(soloPend?"No hay adjuntos pendientes de guardar en Dropbox.":"No hay adjuntos en este dispositivo.");return}
  descargar(new Blob([C.write(z,{type:"array",fileType:"zip"})],{type:"application/zip"}),`adjuntos_cifrados_${new Date().toISOString().slice(0,10)}.zip`);
  alert(`${n} adjuntos cifrados en el zip. Descomprímelo dentro de Dropbox › Finanzas Memphis › adjuntos (respeta las carpetas año/mes).`)}
async function subirAdjCarpeta(){if(!dirHandle||!await permiso(dirHandle,true)){alert("Primero vincula la carpeta");return}carpetaOK=true;let n=0;
  for(const [m,a] of todosAdj()){if(a.tipo==="enlace"||!a.sha)continue;a.ruta=a.ruta||rutaAdj(m,a);
    let existe=false;try{await leer(a.ruta);existe=true}catch(e){}
    if(!existe){const c=await DB.get("adj:"+a.sha);if(c){await escribir(a.ruta,c);n++}}
    if(existe||n)a.enCarpeta=true}
  changed();alert(n?`${n} adjuntos copiados a la carpeta.`:"Todos los adjuntos ya estaban en la carpeta.")}
let FA={q:"",td:""};
async function verAdjuntos(){const L=todosAdj().map(([r,a])=>({r,a,esV:!!r.vence,fecha:r.fecha||r.inicio||r.vence,quien:r.estab||r.comercio||r.desc||"",que:r.concepto||r.titulo||"",valor:r.valor}))
    .sort((x,y)=>(y.fecha||"").localeCompare(x.fecha||""));
  const pinta=()=>{const q=FA.q.toLowerCase();const V=L.filter(x=>(!FA.td||x.a.tipoDoc===FA.td)&&(!q||(x.a.nombre+" "+x.quien+" "+x.que+" "+(x.a.original||"")).toLowerCase().includes(q)));
    $("#faL").innerHTML=V.map((x,i)=>`<div class="arow"><div style="min-width:0;flex:1"><a href="#" data-va="${L.indexOf(x)}" style="word-break:break-all">${x.a.tipo==="enlace"?"🔗":/^image\//.test(x.a.mime)?"🖼️":/pdf/.test(x.a.mime)?"📄":"📎"} ${esc(x.a.nombre)}</a>
      <div class="small muted">${esc(x.a.tipoDoc||"")} · ${esc(x.fecha||"")} · ${esc(x.quien)}${x.que?" · "+esc(x.que):""}${x.valor?" · "+fmt(x.valor):""}${x.a.original&&x.a.original!==x.a.nombre?" · original: "+esc(x.a.original):""}</div></div>
      ${x.a.tipo!=="enlace"?`<button class="b s" data-vd="${L.indexOf(x)}" title="Descargar">⬇</button>`:""}<button class="b s" data-vm="${L.indexOf(x)}">${x.esV?"Ver vencimiento":"Ver movimiento"}</button></div>`).join("")||'<p class="muted">Nada con ese filtro</p>';
    document.querySelectorAll("[data-va]").forEach(e=>e.onclick=ev=>{ev.preventDefault();abrirAdj(L[+e.dataset.va].a)});
    document.querySelectorAll("[data-vd]").forEach(e=>e.onclick=async()=>{const a=L[+e.dataset.vd].a;try{descargar(new Blob([await bytesAdj(a)],{type:a.mime||"application/octet-stream"}),a.nombre)}catch(x){alert(x.message)}});
    document.querySelectorAll("[data-vm]").forEach(e=>e.onclick=()=>{const x=L[+e.dataset.vm];cerrar();x.esV?editarV(x.r.id):editar(x.r.id)})};
  dlg(`Archivo de facturas, garantías y documentos (${L.length})`,L.length?`<div class="filters"><input id="faQ" placeholder="Buscar por comercio, nombre, concepto…" value="${esc(FA.q)}" style="flex:1;min-width:160px"><select id="faT"><option value="">Todos los tipos</option>${DOCT.map(d=>`<option ${FA.td===d?"selected":""}>${d}</option>`).join("")}</select></div><div id="faL"></div>
    <div class="filters" style="margin-top:8px"><button class="b" id="faZip">Descargar todos (descifrados, .zip por mes)</button></div><div class="small muted">El .zip queda SIN cifrar en este equipo: guárdalo en un lugar privado.</div>`:"<p class='muted'>Sin adjuntos todavía</p>",[["Cerrar","",cerrar]]);
  if(!L.length)return;pinta();$("#faQ").oninput=e=>{FA.q=e.target.value;pinta()};$("#faT").onchange=e=>{FA.td=e.target.value;pinta()};
  $("#faZip").onclick=async()=>{if(!confirm("Se descargará un .zip con todos tus adjuntos DESCIFRADOS. ¿Seguir?"))return;const C=XLSX.CFB,z=C.utils.cfb_new();let n=0,f=0;const vistos=new Set();
    for(const x of L){if(x.a.tipo==="enlace"||!x.a.sha)continue;const ruta="/"+(x.fecha||"sin-fecha").slice(0,7)+"/"+x.a.nombre;if(vistos.has(ruta))continue;vistos.add(ruta);
      try{C.utils.cfb_add(z,ruta,await bytesAdj(x.a));n++}catch(e){f++}}
    const idx=[["Archivo","Fecha","Comercio","Concepto","Valor","Tipo de documento","Nombre original","Enlace"],...L.map(x=>[x.a.nombre,x.fecha,x.quien,x.que,x.valor||"",x.a.tipoDoc||"",x.a.original||"",x.a.url||""])];
    C.utils.cfb_add(z,"/indice.csv",enc.encode("﻿"+idx.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\n")));
    descargar(new Blob([C.write(z,{type:"array",fileType:"zip"})],{type:"application/zip"}),`adjuntos_finanzas_memphis_${hoyISO()}.zip`);if(f)alert(f+" adjuntos no se pudieron incluir (no están en este dispositivo ni en Dropbox).")}}
function exportCsv(){const ws=XLSX.utils.json_to_sheet(filasExport());descargar(new Blob(["﻿"+XLSX.utils.sheet_to_csv(ws,{FS:";"})],{type:"text/csv"}),`finanzas_memphis_${new Date().toISOString().slice(0,10)}.csv`)}

// ======================= Importar =======================
let MODO="mov",PREV=[];
function importar(){
  dlg("Importar movimientos",`
   <p class="small">Puedes traer:</p>
   <ul class="small"><li><b>CSV de tu convertidor de extractos</b> (movimientos_cuentas.csv o movimientos_tarjetas.csv de las carpetas <i>sin_password/consolidado</i>).</li>
   <li><b>Excel o CSV</b> descargado de la sucursal virtual de tu banco o billetera digital (te pido qué columna es cada cosa).</li>
   <li><b>Texto pegado</b>: notificaciones o correos de Bancolombia/Nequi (“Compraste $50.900 en … con tu T.Cred *1234”, “Pagaste …”, “Transferiste …”, “Recibiste …”). También sirve una tabla copiada.</li>
   <li><b>Tarjeta de crédito:</b> además de <i>movimientos_tarjetas.csv</i> (trae las cuotas, la tasa y el saldo de cada compra), importa <i>resumen_tarjetas.csv</i> (fecha límite, pago mínimo y total, deuda, cupo) y <i>tasas_tarjetas.csv</i>.</li></ul>
   <label>Cuenta por defecto (si el archivo no lo dice)</label><input id="iCu" list="lCu2" value="${esc(S.cuentas[0]||"")}"><datalist id="lCu2">${S.cuentas.map(c=>`<option>${esc(c)}</option>`).join("")}</datalist>
   <label>Texto para pegar</label><textarea id="iTx" placeholder="Pega aquí mensajes o una tabla…"></textarea>`,
   [["Cancelar","",cerrar],["Elegir archivo…","",()=>{MODO="mov";$("#fileIn").value="";$("#fileIn").click()}],["Analizar texto","p",()=>{const t=$("#iTx").value;if(!t.trim())return;const rows=parseTexto(t,$("#iCu").value);previsualizar(rows,"texto pegado")}]]);
}
$("#fileIn").onchange=async e=>{const f=e.target.files[0];if(!f)return;
  try{
   if(/\.(json|fmx)$/i.test(f.name)){alert("Para abrir otro archivo de datos usa Datos › Cerrar sesión, o el candado. Aquí se importan extractos (CSV/Excel).");return;const d=JSON.parse(await f.text());if(!d.mov)throw new Error("No es un archivo de Finanzas JM");if(confirm(`Reemplazar tus datos actuales (${S.mov.length} movimientos) por los del archivo (${d.mov.length})?`)){S=Object.assign(defaults(),d);migrarAdj();await persist();cerrar();render()}return}
   let rows;
   if(/\.xlsx?$/i.test(f.name)){rows=await leerExcelAislado(await f.arrayBuffer())}
   else{let t=await f.text();if(/�/.test(t)){t=new TextDecoder("windows-1252").decode(await f.arrayBuffer())}rows=csvParse(t)}
   const cu=($("#iCu")&&$("#iCu").value)||S.cuentas[0]||"";
   const norm=detectar(rows,cu,f.name);
   if(norm)previsualizar(norm,f.name);else mapear(rows,cu,f.name);
  }catch(err){alert("No pude leer el archivo: "+err.message)}};
function csvParse(t){t=t.replace(/^﻿/,"");const first=t.split(/\r?\n/)[0];const sep=[";",",","\t"].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
  const out=[];let row=[],cur="",q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}else if(c==='"')q=true;else if(c===sep){row.push(cur);cur=""}else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;row.push(cur);out.push(row);row=[];cur=""}else cur+=c}
  if(cur||row.length){row.push(cur);out.push(row)}const h=out.shift().map(s=>s.trim());return out.filter(r=>r.some(x=>x.trim())).map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]??"").trim()])))}
function fechaISO(s){if(s instanceof Date)return s.toISOString().slice(0,10);s=String(s).trim();let m;
  if(m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/))return`${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
  if(m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/)){const y=m[3].length===2?"20"+m[3]:m[3];return`${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`}
  const MES={ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,oct:10,nov:11,dic:12};
  if(m=s.toLowerCase().match(/(\d{1,2})\s*(?:de\s*)?([a-z]{3})[a-z]*\.?\s*(?:de\s*)?(\d{4})/))return`${m[3]}-${String(MES[m[2]]||1).padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  return ""}
function detectar(rows,cu,nombre){if(!rows.length)return null;const k=Object.keys(rows[0]);
  if(k.includes("tipo_cuenta")&&k.includes("valor")){return rows.map(r=>{const v=parseFloat(r.valor);const cta=r.tipo_cuenta==="nequi"?"Nequi "+(r.cuenta||""):"Bancolombia "+(r.cuenta||"");return nuevo({fecha:r.fecha,cuenta:cta.trim(),desc:r.descripcion,valor:Math.abs(v),entra:v>0,catBanco:r.categoria})}).filter(Boolean)}
  if(k.includes("pago_minimo")&&k.includes("deuda_fecha_corte")){importarResumenTC(rows);return[]}
  if(k.includes("tasa_mes_vencido_pct")){importarTasasTC(rows);return[]}
  if(k.includes("franquicia")&&k.includes("valor_movimiento")){ // cada compra aparece en cada extracto mientras tenga cuotas: nos quedamos con la info del corte más reciente
    const ult={};for(const r of rows){const key=[r.fecha,r.autorizacion,r.descripcion,Math.round(+r.valor_movimiento)].join("|");if(!ult[key]||String(r.fecha_corte)>String(ult[key].fecha_corte))ult[key]=r}
    const out=[];for(const r of Object.values(ult)){const v=+r.valor_movimiento;if(r.tipo==="abono/pago")continue;
      const m=nuevo({fecha:r.fecha,cuenta:`${r.franquicia} ${r.tarjeta}`,desc:r.descripcion,valor:Math.abs(v),entra:v<0,tc:true,catBanco:r.tipo,nota:""});if(!m)continue;
      const n=+r.cuotas_total||0;if(n>1){m.tc=normTC({cuotas:n,cuotaActual:+r.cuota_actual||null,valorCuota:+r.valor_cuota||null,tasaMV:r.tasa_mensual_pct!==""?+r.tasa_mensual_pct:null,tasaEA:r.tasa_anual_pct!==""?+r.tasa_anual_pct:null,saldo:r.saldo_pendiente!==""?+r.saldo_pendiente:null,corte:r.fecha_corte,aut:r.autorizacion,modalidad:+r.tasa_mensual_pct>0?"con_intereses":"sin_intereses"})}
      out.push(m)}
    return out}
  return null}
function importarResumenTC(rows){S.tcRes=S.tcRes||[];let n=0;
  for(const r of rows){const o={tarjeta:`${r.franquicia} ${r.tarjeta}`,moneda:r.moneda==="USD"?"USD":"COP",corte:fechaISO(r.periodo_fin),pagarAntes:fechaISO(r.pagar_antes_de)||"",pagoTotal:+r.pago_total||0,pagoMinimo:+r.pago_minimo||0,deuda:+r.deuda_fecha_corte||0,cupo:+r.cupo_total||0,cupoDisp:+r.cupo_disponible||0,intereses:+r.intereses_corrientes||0,interesesMora:+r.intereses_mora||0,otrosCargos:+r.otros_cargos||0,compras:+r.compras_del_mes||0,pagos:+r.pagos_abonos||0,saldoAnterior:+r.saldo_anterior||0};
    if(!o.corte)continue;const i=S.tcRes.findIndex(x=>x.tarjeta===o.tarjeta&&x.moneda===o.moneda&&x.corte===o.corte);if(i>=0)S.tcRes[i]=o;else S.tcRes.push(o);n++}
  cerrar();changed();alert(`${n} resúmenes de extracto de tarjeta guardados (fecha límite, pago mínimo/total, deuda y cupo). Míralos en Gráficos › Tarjeta.`);render()}
function importarTasasTC(rows){S.tcTasas=S.tcTasas||[];let n=0;for(const r of rows){const o={tarjeta:`${r.franquicia} ${r.tarjeta}`,corte:fechaISO(r.periodo_fin),categoria:r.categoria,tasaMV:+r.tasa_mes_vencido_pct||0,tasaEA:+r.tasa_efectiva_anual_pct||0};if(!o.corte||r.moneda!=="COP")continue;
  const i=S.tcTasas.findIndex(x=>x.tarjeta===o.tarjeta&&x.corte===o.corte&&x.categoria===o.categoria);if(i>=0)S.tcTasas[i]=o;else S.tcTasas.push(o);n++}
  cerrar();changed();alert(`${n} tasas de la tarjeta guardadas.`);render()}
function mapear(rows,cu,nombre){const k=Object.keys(rows[0]||{});const opt=(sel,re)=>k.map(x=>`<option ${re.test(x)?"selected":""}>${esc(x)}</option>`).join("");
  dlg("¿Qué columna es cada cosa?",`<p class="small muted">${esc(nombre)} · ${rows.length} filas</p><div class="grid2">
   <div><label>Fecha</label><select id="mF">${opt(0,/fecha|date/i)}</select></div>
   <div><label>Descripción</label><select id="mD">${opt(0,/desc|concepto|detalle|referencia/i)}</select></div>
   <div><label>Valor (con signo)</label><select id="mV"><option value="">— uso ingreso/egreso —</option>${opt(0,/^valor$|monto|importe/i)}</select></div>
   <div><label>Cuenta</label><input id="mC" value="${esc(cu)}"></div>
   <div><label>Hora (opcional)</label><select id="mH"><option value="">— no hay —</option>${opt(0,/^hora$|^time$|hora/i)}</select></div>
   <div><label>Ingresos / créditos</label><select id="mI"><option value="">—</option>${opt(0,/ingreso|cr[eé]dito|abono/i)}</select></div>
   <div><label>Egresos / débitos</label><select id="mE"><option value="">—</option>${opt(0,/egreso|d[eé]bito|cargo|retiro/i)}</select></div></div>
   <label><input type="checkbox" id="mTc"> Es una tarjeta de crédito (los valores positivos son compras)</label>`,
   [["Cancelar","",cerrar],["Continuar","p",()=>{const fF=$("#mF").value,fH=$("#mH").value,fD=$("#mD").value,fV=$("#mV").value,fI=$("#mI").value,fE=$("#mE").value,c=$("#mC").value,tc=$("#mTc").checked;
     const out=rows.map(r=>{let v,entra;if(fV){const raw=String(r[fV]);v=signed(raw);entra=tc?v<0:v>0}else{const i=parseNum(r[fI]||0)||0,e2=parseNum(r[fE]||0)||0;v=i||e2;entra=!!i}return nuevo({fecha:r[fF],hora:fH?String(r[fH]):"",cuenta:c,desc:r[fD],valor:Math.abs(v),entra,tc})}).filter(Boolean);previsualizar(out,nombre)}]])}
function horaImportada(fecha,hora){ // la hora puede venir en su propia columna o junto a la fecha ("2026-11-23 14:05", "23/11/2026 2:05 PM")
  if(hora!=null&&hora!==""){const n=+hora;if(!isNaN(n)&&n>=0&&n<1){const t=Math.round(n*1440);return String(Math.floor(t/60)%24).padStart(2,"0")+":"+String(t%60).padStart(2,"0")}const r=leerFechaHora(String(hora));return r.hora||""}
  if(typeof fecha==="string"&&/\d[:h]\d{2}|\d\s?[ap]\.?\s?m\b/i.test(fecha)){const r=leerFechaHora(fecha.trim().replace(/^\S+\s*/,""));return r.hora||""}
  if(fecha instanceof Date&&(fecha.getHours()||fecha.getMinutes()))return String(fecha.getHours()).padStart(2,"0")+":"+String(fecha.getMinutes()).padStart(2,"0");
  return""}
function signed(s){s=String(s).trim();const neg=/^-|\(|-$/.test(s);const v=parseNum(s);return neg?-v:v}
function nuevo({fecha,cuenta,desc,valor,entra,tc,catBanco,nota,hora}){const hr=horaImportada(fecha,hora);fecha=fechaISO(fecha);if(!fecha||!(valor>0))return null;
  const m={id:uid(),fecha,cuenta,desc:String(desc||"").trim(),estab:"",concepto:"",categoria:"",tipo:"",valor:Math.round(valor*100)/100,origen:"importado",conciliacion:"solo_banco",revisar:"",nota:nota||"",adjuntos:[]};
  if(hr)m.hora=hr;
  const r=regla(m.desc);
  if(r){m.tipo=r.tipo;m.categoria=r.categoria;m.estab=r.estab}
  if(m.estab&&!m.categoria){const ca=catAprendida(m.estab);if(ca)m.categoria=ca}
  if(/^Aporte familiar/.test(m.tipo))m.tipo=entra?"Aporte familiar recibido":"Aporte familiar enviado";
  if(!m.tipo||(tc&&/Gasto débito/.test(m.tipo)))m.tipo=tc?(entra?"Devolución TC":(/INTERES|MANEJO/i.test(m.desc)?"Cargo financiero TC":(/AVANCE/i.test(m.desc)?"Avance TC":"Compra TC"))):(entra?"Reembolso de gasto compartido":"Gasto débito");
  // Solo el sueldo (y premios / liquidación de ahorros) es ingreso; el resto de lo que entra reduce gasto
  if(entra&&!tc&&tipoInfo(m.tipo).flujo<0){m.tipo="Reembolso de gasto compartido";m.categoria="Reembolsos"}
  if(!entra&&!tc&&m.tipo==="Reembolso de gasto compartido"){m.tipo="Gasto débito";m.categoria="Pagos por transferencia"}
  if(!entra&&!tc&&tipoInfo(m.tipo).flujo>0){m.tipo="Gasto débito"}
  if(m.tipo==="Ingreso otro"&&!/OPERADOR/i.test(m.desc))m.revisar="¿Es un ingreso real o un reembolso?";
  if(!m.estab)m.estab=m.desc.replace(/^(COMPRA (EN|INTL)|PAGO PSE|PAGO EN|COMPRA PSE EN|TRANSF A|TRANSF DE|PARA|DE)\s+/i,"").slice(0,40);
  m.editado=new Date().toISOString();m.hash=[m.fecha,Math.round(m.valor),m.desc.toUpperCase().replace(/\s+/g," "),m.cuenta].join("|");return m}
// Excel de terceros se lee en un Worker aislado: si el archivo viene manipulado (fallos conocidos de SheetJS 0.18.5),
// no puede tocar la página donde están tus datos descifrados, y si se cuelga se corta a los 20 s.
function leerExcelAislado(buf){return new Promise((ok,ko)=>{const w=new Worker("excel-worker.js");const to=setTimeout(()=>{w.terminate();ko(new Error("El archivo tardó demasiado en leerse"))},20000);
  w.onmessage=e=>{clearTimeout(to);w.terminate();if(e.data.error)return ko(new Error(e.data.error));
    ok((e.data.filas||[]).slice(0,50000).map(r=>{const o={};for(const [k,v] of Object.entries(r||{})){if(k==="__proto__"||k==="constructor"||k==="prototype")continue;o[String(k).slice(0,200)]=String(v??"").slice(0,2000)}return o}))};
  w.onerror=e=>{clearTimeout(to);w.terminate();ko(new Error("No pude leer el Excel"))};w.postMessage(buf,[buf])})}
function parseTexto(t,cu){if(t.length>300000){alert("El texto pegado es muy largo (máx. 300.000 caracteres).");return[]}const out=[];const lines=t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  // 1) tabla pegada (tabs o ;)
  if(lines.length>1&&/[\t;]/.test(lines[0])){const rows=csvParse(lines.join("\n").replace(/\t/g,";"));const d=detectar(rows,cu);if(d)return d;mapear(rows,cu,"tabla pegada");return null}
  const num=s=>parseNum(s);
  const reF=/(\d{1,2}\/\d{1,2}\/\d{2,4})/;
  for(const raw of t.split(/\n(?=\S)|(?<=\.)\s+(?=(?:Bancolombia|Nequi|Compraste|Pagaste|Transferiste|Recibiste|Retiraste))/i)){const s=raw.replace(/\s+/g," ");let m,o=null;
    const f=(s.match(reF)||[])[1];const fecha=f?fechaISO(f):hoyISO();
    const card=(s.match(/T\.?\s?Cred(?:ito)?\s*\*?(\d{4})/i)||[])[1];const prod=(s.match(/(?:producto|cuenta|T\.?\s?Deb)\s*\*?\**(\d{4})/i)||[])[1];
    const cta=card?"VISA "+card:(prod?"Bancolombia "+prod:cu);
    if(m=s.match(/Compraste\s+(?:COP)?\$?\s*([\d.,]+)\s+en\s+(.+?)\s+con tu/i))o={desc:"COMPRA "+m[2],valor:num(m[1]),entra:false,tc:!!card};
    else if(m=s.match(/Pagaste\s+\$?\s*([\d.,]+)\s+a\s+(.+?)\s+desde/i))o={desc:"PAGO "+m[2],valor:num(m[1]),entra:false};
    else if(m=s.match(/Transferiste\s+\$?\s*([\d.,]+)\s+(?:por .+? )?a\s+(.+?)(?:\s+desde|\.|$)/i))o={desc:"TRANSF A "+m[2],valor:num(m[1]),entra:false};
    else if(m=s.match(/Recibiste\s+(?:una transferencia (?:por|de)\s+)?\$?\s*([\d.,]+)\s+(?:de|del)\s+(.+?)(?:\s+en tu|\.|$)/i))o={desc:"TRANSF DE "+m[2],valor:num(m[1]),entra:true};
    else if(m=s.match(/Retiraste\s+\$?\s*([\d.,]+)\s+en\s+(\S+)/i))o={desc:"RETIRO CAJERO "+m[2],valor:num(m[1]),entra:false};
    else if(m=s.match(/(?:Env[ií]aste|Para)\s+.*?\$?\s*([\d.,]{4,})/i))o={desc:s.slice(0,60),valor:num(m[1]),entra:false};
    if(o){const n=nuevo({fecha,cuenta:cta,...o});if(n)out.push(n)}}
  if(!out.length)alert("No reconocí movimientos en el texto. Prueba pegando una tabla (con columnas) o un mensaje del banco completo.");
  return out}
function conciliar(m,usados){if(m.tipo==="Rendimientos")return null;const w=isTC(m.cuenta)?S.ventana.tc:S.ventana.banco,tol=S.ventana.tolerancia/100;const d0=new Date(m.fecha);
  let best=null,bs=1e9;for(const x of S.mov){if(usados.has(x.id)||x.origen==="importado"&&x.conciliacion!=="solo_registro"||!(x.conciliacion==="solo_registro"||x.conciliacion==="pendiente"||x.origen==="manual"&&x.conciliacion!=="conciliado"))continue;
    const dd=Math.abs((new Date(x.fecha)-d0)/864e5);if(dd>w)continue;const dv=Math.abs(x.valor-m.valor);if(dv>Math.max(1,m.valor*tol))continue;const sc=dv*10+dd+(isTC(x.cuenta)!==isTC(m.cuenta)?50:0);if(sc<bs){bs=sc;best=x}}return best}
function previsualizar(rows,origen){if(!rows)return;rows.forEach((m,i)=>{if(m&&m.orden==null)m.orden=i});const hashes=new Set(S.mov.map(m=>m.hash||[m.fecha,Math.round(m.valor),String(m.desc||"").toUpperCase().replace(/\s+/g," "),m.cuenta].join("|")));
  if(!rows.length){cerrar();return}
  { // compras ya registradas: se actualizan sus cuotas con el extracto más reciente (sin duplicarlas)
    const porHash={};for(const m of S.mov)porHash[m.hash||[m.fecha,Math.round(m.valor),String(m.desc||"").toUpperCase().replace(/\s+/g," "),m.cuenta].join("|")]=m;let up=0;
    for(const r of rows){if(!r.tc)continue;const x=porHash[r.hash];if(x&&(!x.tc||(x.tc.corte||"")<=r.tc.corte)){x.tc=r.tc;x.editado=new Date().toISOString();up++}}
    if(up){changed();aviso(`${up} compras a cuotas actualizadas con el extracto`)}}
  const usados=new Set();const ini=(S.saldos&&S.saldos.fecha)||"2026-01-01";PREV=rows.map(m=>{if(m.fecha<ini)return{m,acc:"old"};if(hashes.has(m.hash))return{m,acc:"dup"};const c=conciliar(m,usados);if(c){usados.add(c.id);return{m,acc:"conc",con:c}}return{m,acc:"nuevo"}});
  const ord={nuevo:0,conc:1,dup:2,old:3};PREV.sort((a,b)=>ord[a.acc]-ord[b.acc]||a.m.fecha.localeCompare(b.m.fecha));const n=k=>PREV.filter(p=>p.acc===k).length;
  dlg(`Revisar antes de importar · ${origen}`,`<p class="small"><b>${n("nuevo")}</b> nuevos · <b>${n("conc")}</b> coinciden con algo que ya anotaste (se unen) · <b>${n("dup")}</b> ya estaban (se ignoran)${n("old")?` · <b>${n("old")}</b> son anteriores a ${esc((S.saldos||{}).fecha||"")} (desmarcados)`:""}</p>
  <div class="tw" style="max-height:52vh"><table><tr><th></th><th>Fecha</th><th>Descripción</th><th>Tipo</th><th class="n">Valor</th><th>Qué pasará</th></tr>
  ${PREV.map((p,i)=>`<tr><td><input type="checkbox" data-p="${i}" ${p.acc==="dup"||p.acc==="old"?"":"checked"}></td><td>${p.m.fecha}</td><td class="small">${esc(p.m.desc)}<div class="muted">${esc(p.m.cuenta)}</div></td><td><select data-pt="${i}" style="max-width:160px">${S.tipos.map(t=>`<option ${t.tipo===p.m.tipo?"selected":""}>${esc(t.tipo)}</option>`).join("")}</select></td><td class="n">${fmt(p.m.valor)}</td><td class="small">${p.acc==="old"?'<span class="chip">anterior al inicio</span>':p.acc==="dup"?'<span class="chip">ya existe</span>':p.acc==="conc"?`<span class="chip ok">se une con</span> ${esc(p.con.concepto||p.con.estab)} (${p.con.fecha}, ${fmt(p.con.valor)})`:'<span class="chip bad">nuevo</span>'}</td></tr>`).join("")}</table></div>`,
  [["Cancelar","",cerrar],["Importar seleccionados","p",()=>{
    respaldoAuto("antes de importar");
    document.querySelectorAll("[data-pt]").forEach(s=>PREV[+s.dataset.pt].m.tipo=s.value);
    let a=0,c=0;document.querySelectorAll("[data-p]").forEach(ch=>{if(!ch.checked)return;const p=PREV[+ch.dataset.p];
      if(p.acc==="conc"){const x=p.con;Object.assign(p.m,{estab:x.estab||p.m.estab,concepto:x.concepto,categoria:x.categoria||p.m.categoria,nota:[x.nota,p.m.nota].filter(Boolean).join(" · "),adjuntos:x.adjuntos||[],conciliacion:"conciliado",filaSheets:x.filaSheets,revisar:""});if(x.tipo==="Gasto de otra cuenta")p.m.tipo=x.tipo;S.mov=S.mov.filter(y=>y.id!==x.id);c++}
      S.mov.push(p.m);a++});
    changed();cerrar();alert(`${a} movimientos importados (${c} unidos con lo que ya tenías anotado).`);render()}]]);
}
boot();
