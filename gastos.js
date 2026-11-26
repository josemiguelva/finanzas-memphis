// =====================================================================================================
// Memphis · MIS GASTOS — app pequeña para que un familiar anote sus gastos y se los envíe al dueño de Memphis.
// · No ve nada de Memphis: solo lo que ella misma anota en este celular.
// · Lo que envía va cifrado (AES-GCM) con la clave de su enlace de invitación; solo la Memphis que creó
//   la invitación puede abrirlo. Se envía como archivo o texto por WhatsApp, Telegram, correo…
// · Sin cuentas, sin servidores, sin conexiones externas (CSP connect-src 'self').
// =====================================================================================================
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const hoyISO=()=>{const d=new Date();return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const ahoraHM=()=>{const d=new Date();return`${pad(d.getHours())}:${pad(d.getMinutes())}`};
const fmt=v=>"$"+Math.round(+v||0).toLocaleString("es-CO");
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const idNuevo=()=>[...crypto.getRandomValues(new Uint8Array(10))].map(b=>b.toString(16).padStart(2,"0")).join("");
const u8b64=u=>{let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
const b64u8=b=>{const s=atob(b);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
const b64url=u=>u8b64(u).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const deB64url=s=>b64u8(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4));
// ---------------------------------------------------------------- almacenamiento local (solo este celular)
const KV={db:null,async abrir(){if(this.db)return;this.db=await new Promise((ok,ko)=>{const r=indexedDB.open("memphisGastos",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)})},
  async get(k){await this.abrir();return new Promise((ok,ko)=>{const r=this.db.transaction("kv").objectStore("kv").get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)})},
  async set(k,v){await this.abrir();return new Promise((ok,ko)=>{const t=this.db.transaction("kv","readwrite");t.objectStore("kv").put(v,k);t.oncomplete=()=>ok();t.onerror=()=>ko(t.error)})}};
let INV=null,L=[],MES=hoyISO().slice(0,7);
const guardar=()=>KV.set("lista",L);
// ---------------------------------------------------------------- invitación
function leerInvitacion(){const m=location.hash.match(/^#i=([\w-]+)$/);if(!m)return null;try{const o=JSON.parse(new TextDecoder().decode(deB64url(m[1])));
  if(!/^[\w-]{6,40}$/.test(o.b)||typeof o.k!=="string"||b64u8(o.k).length!==32)return null;
  const lst=(v,n)=>(Array.isArray(v)?v:[]).map(x=>String(x).slice(0,80).trim()).filter(Boolean).slice(0,n);
  return{b:o.b,k:o.k,n:String(o.n||"").slice(0,60),de:String(o.de||"").slice(0,60),c:lst(o.c,20),cat:lst(o.cat,60),est:lst(o.est,200),t:new Date().toISOString()}}catch(e){return null}}
// ---------------------------------------------------------------- cifrado del paquete
async function paquete(items){const key=await crypto.subtle.importKey("raw",b64u8(INV.k),"AES-GCM",false,["encrypt"]);const iv=crypto.getRandomValues(new Uint8Array(12));
  const datos=new TextEncoder().encode(JSON.stringify({v:1,b:INV.b,de:INV.n,t:new Date().toISOString(),g:items}));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:new TextEncoder().encode(INV.b)},key,datos));const u=new Uint8Array(12+ct.length);u.set(iv);u.set(ct,12);
  return`MEMPHIS-GASTOS1.${INV.b}.${b64url(u)}`}
// ---------------------------------------------------------------- fotos: JPEG de máx. 1400 px
async function reducirFoto(f){const img=await createImageBitmap(f).catch(()=>null);if(!img)throw new Error("No pude leer la foto");const s=Math.min(1,1400/Math.max(img.width,img.height));
  const c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.72)}
// ---------------------------------------------------------------- vistas
function vista(){const app=$("#app");
  if(!INV){$("#gBar").hidden=true;app.innerHTML=`<div class="card"><h2>💳 Mis gastos</h2><p>Para empezar abre el <b>enlace de invitación</b> que te enviaron desde Memphis.</p><p class="small muted">Esta app guarda tus gastos solo en este celular y los envía cifrados. No ve ninguna otra información.</p></div>`;return}
  $("#gBar").hidden=false;const V=L.filter(x=>!x.borrado),M=V.filter(x=>x.fecha.startsWith(MES)).sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora)),pend=L.filter(x=>!x.enviado).length;
  const [y,m]=MES.split("-").map(Number),tot=M.reduce((a,x)=>a+x.valor,0),cat={};for(const x of M)cat[x.cat||"Sin categoría"]=(cat[x.cat||"Sin categoría"]||0)+x.valor;
  app.innerHTML=`<div class="gh"><h1>💳 Mis gastos${INV.n?` · ${esc(INV.n)}`:""}</h1><button class="b s" id="gMenu">⋯</button></div>
   <div class="card"><div class="filters" style="margin:0"><button class="b s" id="mPrev">◀</button><b style="flex:1;text-align:center">${MESES[m-1]} ${y}</b><button class="b s" id="mNext">▶</button></div>
    <div style="font-size:1.6rem;font-weight:700;text-align:center;margin:6px 0">${fmt(tot)}</div>
    <div class="small muted" style="text-align:center">${M.length} gasto${M.length===1?"":"s"}${pend?` · <span class="pend">${pend} sin enviar</span>`:" · todo enviado ✔"}</div>
    ${Object.keys(cat).length>1?`<div class="small" style="margin-top:6px">${Object.entries(cat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${esc(k)} <b>${fmt(v)}</b>`).join(" · ")}</div>`:""}</div>
   <div class="card">${M.length?M.map(x=>`<div class="gi click" data-g="${x.id}">${x.foto?`<img src="${x.foto}" alt="">`:`<span style="font-size:1.4rem">🧾</span>`}<div class="t"><b>${esc(x.estab||x.nota||"(sin nombre)")}</b><span class="small muted">${[x.fecha.slice(8)+"/"+x.fecha.slice(5,7)+(x.hora?" "+x.hora:""),x.cat,x.cuenta].filter(Boolean).map(esc).join(" · ")}</span></div><div style="text-align:right"><b>${fmt(x.valor)}</b><div class="small ${x.enviado?"env":"pend"}">${x.enviado?"✔ enviado":"● por enviar"}</div></div></div>`).join(""):'<p class="small muted">No hay gastos este mes. Toca «➕ Gasto».</p>'}</div>`;
  $("#mPrev").onclick=()=>{MES=mover(MES,-1);vista()};$("#mNext").onclick=()=>{MES=mover(MES,1);vista()};$("#gMenu").onclick=menu;
  document.querySelectorAll("[data-g]").forEach(d=>d.onclick=()=>editar(d.dataset.g))}
const mover=(ym,n)=>{let [y,m]=ym.split("-").map(Number);m+=n;while(m<1){m+=12;y--}while(m>12){m-=12;y++}return`${y}-${pad(m)}`};
function modal(html,botones){let d=$("#gDlg");if(!d){d=document.createElement("dialog");d.id="gDlg";d.style.cssText="width:min(560px,94vw);max-height:92vh;overflow:auto";document.body.appendChild(d)}
  d.innerHTML=`<div class="gf">${html}</div><div class="filters" style="justify-content:flex-end;margin-top:12px">${botones.map((b,i)=>`<button class="b ${b[1]||""}" data-bi="${i}">${b[0]}</button>`).join("")}</div>`;
  d.querySelectorAll("[data-bi]").forEach(b=>b.onclick=()=>botones[+b.dataset.bi][2]());if(!d.open)d.showModal();return d}
const cerrar=()=>{const d=$("#gDlg");if(d&&d.open)d.close()};
function editar(id){const x0=id?L.find(x=>x.id===id):null,x=x0?{...x0}:{id:"",fecha:hoyISO(),hora:ahoraHM(),valor:0,estab:"",cat:"",cuenta:INV.c[0]||"",nota:"",foto:""};
  const ests=[...new Set([...L.map(y=>y.estab),...INV.est].filter(Boolean))].slice(0,300),cats=[...new Set([...INV.cat,...L.map(y=>y.cat)].filter(Boolean))];
  modal(`<h2 style="margin-top:0">${x0?"Editar gasto":"Nuevo gasto"}</h2>
   <label>Valor</label><input id="fV" class="gv" inputmode="numeric" autocomplete="off" value="${x.valor?Math.round(x.valor).toLocaleString("es-CO"):""}" placeholder="$0">
   <label>¿Dónde o qué?</label><input id="fE" list="fEl" value="${esc(x.estab)}" placeholder="Éxito, droguería, almuerzo…" autocomplete="off"><datalist id="fEl">${ests.map(e=>`<option value="${esc(e)}">`).join("")}</datalist>
   <div class="g2c"><div><label>Fecha</label><input id="fF" type="date" value="${esc(x.fecha)}"></div><div><label>Hora</label><input id="fH" type="time" value="${esc(x.hora)}"></div></div>
   <div class="g2c"><div><label>Categoría</label><select id="fK"><option value="">—</option>${cats.map(c=>`<option ${c===x.cat?"selected":""}>${esc(c)}</option>`).join("")}</select></div>
    <div><label>Pagado con</label><select id="fC">${[...new Set([...INV.c,x.cuenta].filter(Boolean))].map(c=>`<option ${c===x.cuenta?"selected":""}>${esc(c)}</option>`).join("")}<option value="Efectivo" ${x.cuenta==="Efectivo"?"selected":""}>Efectivo</option></select></div></div>
   <label>Nota (opcional)</label><input id="fN" value="${esc(x.nota)}" autocomplete="off">
   <label>Foto de la factura (opcional)</label><input id="fP" type="file" accept="image/*" capture="environment"><div id="gFotoV">${x.foto?`<img src="${x.foto}" alt=""><br><button class="b s" id="fPx">Quitar foto</button>`:""}</div>
   ${x0&&x0.enviado?'<p class="small muted">Ya se envió. Si lo cambias, se volverá a enviar con el cambio.</p>':""}`,
   [...(x0?[["🗑 Borrar","",()=>{if(!confirm("¿Borrar este gasto?"))return;if(x0.enviado){Object.assign(x0,{borrado:true,enviado:"",editado:new Date().toISOString()})}else L=L.filter(y=>y.id!==x0.id);guardar();cerrar();vista()}]]:[]),
    ["Cancelar","",cerrar],["Guardar","p",()=>{const v=+String($("#fV").value).replace(/[^\d]/g,"");if(!v){alert("Escribe el valor");$("#fV").focus();return}
      Object.assign(x,{valor:v,estab:$("#fE").value.trim().slice(0,120),fecha:$("#fF").value||hoyISO(),hora:$("#fH").value||"",cat:$("#fK").value,cuenta:$("#fC").value,nota:$("#fN").value.trim().slice(0,500),enviado:"",editado:new Date().toISOString(),ver:(x0&&x0.ver||0)+1});
      if(x0)Object.assign(x0,x);else{x.id=idNuevo();x.creado=new Date().toISOString();L.push(x)}guardar();cerrar();MES=x.fecha.slice(0,7);vista()}]]);
  const fv=$("#fV");fv.oninput=()=>{const n=String(fv.value).replace(/[^\d]/g,"");fv.value=n?(+n).toLocaleString("es-CO"):""};if(!x0)setTimeout(()=>fv.focus(),50);
  $("#fP").onchange=async()=>{const f=$("#fP").files[0];if(!f)return;try{x.foto=await reducirFoto(f);$("#gFotoV").innerHTML=`<img src="${x.foto}" alt="">`}catch(e){alert(e.message)}};
  if($("#fPx"))$("#fPx").onclick=()=>{x.foto="";$("#gFotoV").innerHTML=""}}
async function enviar(todo){const items=L.filter(x=>todo?x.fecha.startsWith(MES):!x.enviado);if(!items.length){alert("No hay nada nuevo por enviar ✔");return}
  const g=items.map(x=>({id:x.id,ver:x.ver||1,fecha:x.fecha,hora:x.hora,valor:x.valor,estab:x.estab,cat:x.cat,cuenta:x.cuenta,nota:x.nota,foto:x.foto||"",borrado:!!x.borrado}));
  const txt=await paquete(g),nombre=`gastos_${hoyISO()}_${ahoraHM().replace(":","")}.txt`,file=new File([txt],nombre,{type:"text/plain"});const n=items.filter(x=>!x.borrado).length;
  const msg=`${n} gasto${n===1?"":"s"} para Memphis${INV.n?" de "+INV.n:""} (${fmt(items.filter(x=>!x.borrado).reduce((a,x)=>a+x.valor,0))})`;let ok=false;
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:msg,text:msg});ok=true}else if(navigator.share&&txt.length<60000){await navigator.share({title:msg,text:txt});ok=true}}catch(e){if(e&&e.name==="AbortError")return}
  if(!ok){const a=document.createElement("a");a.href=URL.createObjectURL(file);a.download=nombre;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);try{if(txt.length<200000)await navigator.clipboard.writeText(txt)}catch(e){}
    alert("Descargué el archivo (y si se pudo, también lo copié). Envíaselo"+(INV.de?" a "+INV.de:"")+" por WhatsApp, Telegram o correo.")}
  modal(`<h2 style="margin-top:0">¿Se envió?</h2><p>${esc(msg)}</p><p class="small muted">Si no alcanzaste a enviarlo, toca «No» y quedan pendientes.</p>`,[["No","",cerrar],["Sí, se envió","p",()=>{const t=new Date().toISOString();for(const x of items)x.enviado=t;L=L.filter(x=>!(x.borrado&&x.enviado));guardar();cerrar();vista()}]])}
function menu(){modal(`<h2 style="margin-top:0">Opciones</h2>
  <button class="b" id="oRe" style="width:100%;margin:4px 0">📤 Reenviar todo ${MESES[+MES.slice(5)-1]}</button>
  <button class="b" id="oCsv" style="width:100%;margin:4px 0">⬇️ Bajar mis gastos (CSV)</button>
  <p class="small muted">Invitación de ${esc(INV.de||"Memphis")} · desde ${esc(INV.t.slice(0,10))}. Tus gastos solo están en este celular hasta que los envías. Para pasarlos a otro celular, abre allí el mismo enlace de invitación y reenvía desde aquí.</p>`,[["Cerrar","",cerrar]]);
  $("#oRe").onclick=()=>{cerrar();enviar(true)};
  $("#oCsv").onclick=()=>{const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;const b=new Blob(["﻿Fecha;Hora;Valor;Dónde;Categoría;Pagado con;Nota;Enviado\n"+L.filter(x=>!x.borrado).map(x=>[x.fecha,x.hora,x.valor,x.estab,x.cat,x.cuenta,x.nota,x.enviado?"sí":"no"].map(q).join(";")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="mis_gastos.csv";a.click()}}
// ---------------------------------------------------------------- arranque
(async()=>{try{const t=localStorage.getItem("memphisTema");if(t)document.documentElement.dataset.tema=t}catch(e){}
  try{INV=await KV.get("inv")||null;L=(await KV.get("lista"))||[]}catch(e){$("#app").innerHTML='<div class="card">Este navegador no deja guardar datos (¿modo incógnito?).</div>';return}
  const nueva=leerInvitacion();if(location.hash)history.replaceState(null,"",location.pathname);
  if(nueva){if(INV&&INV.b!==nueva.b&&L.some(x=>!x.enviado)&&!confirm("Tienes gastos sin enviar de otra invitación. ¿Cambiar de todas formas? (No se borran)"))vista();else{INV=nueva;await KV.set("inv",INV)}}
  vista();$("#gNuevo").onclick=()=>editar(null);$("#gEnviar").onclick=()=>enviar(false);
  if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})})();
