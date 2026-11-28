// =====================================================================================================
// Memphis · 🤝 COMPARTIR CON MI PAREJA
// · Se emparejan una vez con un código de 12 caracteres: así nace una LLAVE DE PAREJA (AES-256) distinta de la frase
//   de cada uno. Lo compartido viaja cifrado con esa llave en /pareja/<id>/ del Dropbox que comparten (perfiles).
// · Nada se comparte por defecto: cada uno elige personas (su ficha y su salud), el nivel de las finanzas
//   (nada · solo totales · por categoría) y las cuentas o categorías comunes (esas sí con detalle), y la agenda #familia.
// · El ciclo, el registro íntimo, el diario personal y los demás gastos NUNCA se incluyen.
// · Quitar algo o terminar el emparejamiento borra lo publicado; la otra app borra lo recibido en su siguiente sincronización.
// =====================================================================================================
"use strict";
CONFIG_EXTRA.push("pareja","parejaIn");
const PAR={ocupado:false,ult:0,llave:null,llaveDe:""};
const ABC32="0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const codigoPar=()=>{const b=crypto.getRandomValues(new Uint8Array(12));return[...b].map(x=>ABC32[x&31]).join("")};
const fmtCod=c=>c.replace(/(.{4})(?=.)/g,"$1-");
const limpiaCod=c=>String(c||"").toUpperCase().replace(/[^0-9A-Z]/g,"").replace(/O/g,"0").replace(/[IL]/g,"1").replace(/U/g,"V");
async function hexSha(t){return[...new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(t)))].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function llaveCodigo(cod,salt){const k=await crypto.subtle.importKey("raw",enc.encode(cod),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:600000,hash:"SHA-256"},k,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function llavePar(){const P=S.pareja;if(!P||!P.k)return null;if(PAR.llave&&PAR.llaveDe===P.pid)return PAR.llave;PAR.llave=await crypto.subtle.importKey("raw",b64u8(P.k),{name:"AES-GCM"},false,["encrypt","decrypt"]);PAR.llaveDe=P.pid;return PAR.llave}
async function cifrarPar(obj,quien){const k=await llavePar(),iv=crypto.getRandomValues(new Uint8Array(12));return JSON.stringify({v:1,iv:u8b64(iv),ct:u8b64(new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode(S.pareja.pid+"|"+quien)},k,enc.encode(JSON.stringify(obj)))))})}
async function descifrarPar(txt,quien){const o=JSON.parse(txt),k=await llavePar();return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(o.iv),additionalData:enc.encode(S.pareja.pid+"|"+quien)},k,b64u8(o.ct))))}
const otroDe=y=>y==="a"?"b":"a";
const miNombreP=()=>(S.pareja&&S.pareja.miNombre)||PAR.nombre||(typeof nombrePerfil==="function"?nombrePerfil(PERFIL):"")||"Yo";
// ---------------------------------------------------------------- emparejar
async function crearInvitacion(){if(!conDropbox()){alert("Para compartir, los dos deben usar el mismo Dropbox (cada uno con su perfil). Conecta Dropbox primero.");return}
  const cod=codigoPar(),pid=u8b64(crypto.getRandomValues(new Uint8Array(9))).replace(/[^\w]/g,"x"),kRaw=crypto.getRandomValues(new Uint8Array(32)),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const k=await llaveCodigo(cod,salt),ct=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode("invitacion")},k,enc.encode(JSON.stringify({pid,k:u8b64(kRaw),de:miNombreP()})));
  const h=(await hexSha("memphis-pareja|"+cod)).slice(0,20);
  await dbxUp(`/pareja/inv-${h}.json`,JSON.stringify({v:1,salt:u8b64(salt),iv:u8b64(iv),ct:u8b64(new Uint8Array(ct)),exp:Date.now()+3*864e5}),{".tag":"overwrite"});
  S.pareja={pid,k:u8b64(kRaw),yo:"a",estado:"invitando",cod,inv:h,miNombre:miNombreP(),otro:"",desde:"",comp:{personas:[],fin:"nada",ctas:[],cats:[],agenda:false},hashPub:"",revIn:""};changed();render()}
async function aceptarCodigo(txt){const cod=limpiaCod(txt);if(cod.length!==12){alert("El código tiene 12 caracteres (letras y números).");return false}if(!conDropbox()){alert("Conecta primero el mismo Dropbox que usa tu pareja.");return false}
  const h=(await hexSha("memphis-pareja|"+cod)).slice(0,20),d=await dbxDown(`/pareja/inv-${h}.json`);if(!d){alert("No encontré esa invitación. Revisa el código y que los dos estén en el mismo Dropbox (cada uno con su perfil).");return false}
  try{const o=JSON.parse(dec.decode(d.bytes));if(o.exp&&o.exp<Date.now()){alert("La invitación venció. Pide un código nuevo.");return false}
    const k=await llaveCodigo(cod,b64u8(o.salt)),x=JSON.parse(dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(o.iv),additionalData:enc.encode("invitacion")},k,b64u8(o.ct))));
    S.pareja={pid:x.pid,k:x.k,yo:"b",estado:"activo",miNombre:miNombreP(),otro:String(x.de||"Mi pareja").slice(0,40),desde:hoyISO(),comp:{personas:[],fin:"nada",ctas:[],cats:[],agenda:false},hashPub:"",revIn:""};PAR.llave=null;
    changed();await publicarPar(true);aviso("🤝 Emparejados con "+S.pareja.otro);return true}catch(e){alert("El código no coincide.");return false}}
async function terminarPar(){if(!S.pareja)return;if(!confirm(`¿Terminar el emparejamiento${S.pareja.otro?" con "+S.pareja.otro:""}? Se borra lo que publicaste y lo que recibiste. Para volver a compartir tendrían que emparejarse de nuevo.`))return;
  const P=S.pareja;try{if(P.estado==="activo"&&conDropbox()){await dbxUp(`/pareja/${P.pid}/${P.yo}.json`,await cifrarPar({revocado:true,t:Date.now()},P.yo),{".tag":"overwrite"})}if(P.inv)await dbxBorrar(`/pareja/inv-${P.inv}.json`)}catch(e){}
  S.pareja=null;S.parejaIn=null;PAR.llave=null;changed();render();aviso("🤝 Emparejamiento terminado")}
// ---------------------------------------------------------------- qué publico
const mesesAtras=n=>{const out=[];const d=new Date();d.setDate(1);for(let i=0;i<n;i++){out.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));d.setMonth(d.getMonth()-1)}return out};
function resumenFin(L,conCats){const M={};for(const m of L){const c=calc(m),k=m.fecha.slice(0,7);if(!M[k])M[k]={gasto:0,ingreso:0,cats:{}};M[k].gasto+=c.gasto;M[k].ingreso+=c.ingreso;if(conCats&&c.gasto){const ca=m.categoria||"Sin categoría";M[k].cats[ca]=(M[k].cats[ca]||0)+c.gasto}}
  for(const k in M){M[k].gasto=Math.round(M[k].gasto);M[k].ingreso=Math.round(M[k].ingreso);for(const c in M[k].cats)M[k].cats[c]=Math.round(M[k].cats[c])}return M}
function esComun(m){const C=S.pareja.comp;return(C.ctas||[]).includes(m.cuenta)||(C.cats||[]).includes(m.categoria)}
function paquetePar(){const P=S.pareja,C=P.comp,desde=mesesAtras(12).pop()+"-01",L=(S.mov||[]).filter(m=>m.fecha>=desde);
  const pk={v:1,de:P.miNombre||miNombreP(),t:Date.now(),personas:[],fin:{nivel:C.fin||"nada",meses:{},det:[],ctas:C.ctas||[],cats:C.cats||[]},agenda:[]};
  for(const n of C.personas||[]){const f=fichaDe(n,"persona"),d=f?datosP(f):{},pf=typeof perfilDe==="function"?perfilDe(n):null;
    pk.personas.push({nombre:f?f.nombre:n,datos:{rel:d.rel||"",cumple:d.cumple||"",tel:d.tel||[],email:d.email||[],org:d.org||"",extra:d.extra||[]},perfil:pf?Object.fromEntries(Object.entries(pf).filter(([k])=>!/^(adjuntos|id|editado|creado)$/.test(k))):null,
      salud:(S.salud||[]).filter(r=>typeof esDe==="function"&&esDe(r,n)).map(r=>({fecha:r.fecha,hora:r.hora,tipo:r.tipo,titulo:r.titulo,texto:r.texto,estado:r.estado,medico:r.medico,esp:r.esp,lugar:r.lugar,sintomas:r.sintomas,meds:r.meds,vacunas:r.vacunas,medidas:r.medidas,nAdj:(r.adjuntos||[]).length})).slice(-300)})}
  if(C.fin==="total"||C.fin==="cat")pk.fin.meses=resumenFin(L,C.fin==="cat");
  if((C.ctas||[]).length||(C.cats||[]).length)pk.fin.det=L.filter(esComun).map(m=>{const c=calc(m);return{f:m.fecha,g:Math.round(c.gasto),i:Math.round(c.ingreso),cat:m.categoria||"",cta:m.cuenta||"",d:(m.estab||m.concepto||m.desc||"").slice(0,80)}}).filter(x=>x.g||x.i).slice(-2000);
  if(C.agenda)pk.agenda=(S.diario||[]).filter(e=>!e.priv&&e.tipo==="evento"&&e.fecha>=masDias(hoyISO(),-30)&&/#familia\b/i.test((e.titulo||"")+" "+(e.texto||""))).map(e=>({f:e.fecha,h:e.hora||"",hf:e.horaFin||"",ff:e.fechaFin||"",t:(e.titulo||"").replace(/#familia\b/gi,"").trim(),l:e.lugar||""})).slice(0,300);
  return pk}
// ---------------------------------------------------------------- sincronizar
async function publicarPar(forzar){const P=S.pareja;if(!P||P.estado!=="activo")return;const pk=paquetePar(),h=await hexSha(JSON.stringify({...pk,t:0}));if(!forzar&&h===P.hashPub)return;
  await dbxUp(`/pareja/${P.pid}/${P.yo}.json`,await cifrarPar(pk,P.yo),{".tag":"overwrite"});P.hashPub=h;P.pub=Date.now();changed()}
async function syncPar(forzar){const P=S&&S.pareja;if(!P||!conDropbox()||PAR.ocupado)return;if(!forzar&&Date.now()-PAR.ult<90e3)return;PAR.ocupado=true;PAR.ult=Date.now();
  try{const otro=otroDe(P.yo),ruta=`/pareja/${P.pid}/${otro}.json`,meta=await dbxMeta(ruta);
    if(P.estado==="invitando"){if(meta){P.estado="activo";P.desde=hoyISO();try{await dbxBorrar(`/pareja/inv-${P.inv}.json`)}catch(e){}delete P.cod;changed();aviso("🤝 Tu pareja aceptó: ya están emparejados")}else return}
    if(meta&&meta.rev!==P.revIn){const d=await dbxDown(ruta);if(d){const pk=await descifrarPar(dec.decode(d.bytes),otro);
      if(pk.revocado){S.parejaIn=null;S.pareja=null;PAR.llave=null;try{await dbxBorrar(`/pareja/${P.pid}`)}catch(e){}changed();aviso("🤝 Tu pareja terminó el emparejamiento: se borró lo compartido");render();return}
      S.parejaIn=pk;P.otro=String(pk.de||P.otro||"").slice(0,40);P.revIn=meta.rev;P.recibido=Date.now();changed()}}
    await publicarPar(forzar)}catch(e){P.error=String(e.message||e).slice(0,200)}finally{PAR.ocupado=false}}
window.addEventListener("load",()=>{const ds=window.dbxSync;if(typeof ds==="function")window.dbxSync=async function(motivo){const r=await ds.apply(this,arguments);try{await syncPar(motivo==="manual")}catch(e){}return r}});
// ---------------------------------------------------------------- tarjeta en Ajustes
function tarjetaPareja(){const P=S.pareja;let h=`<div class="card" id="ajPareja"><h2>🤝 Compartir con mi pareja</h2>`;
  if(!P)return h+`<p class="small">Comparte solo lo que elijas (salud de los hijos o de un familiar, un resumen de tus gastos, cuentas comunes, la agenda familiar). Todo viaja cifrado con una llave que solo tienen ustedes dos. Necesitan estar en el <b>mismo Dropbox</b>, cada uno con su perfil.</p>
   <label>Tu nombre para tu pareja<input id="paNom" value="${esc(miNombreP())}" maxlength="40"></label><div class="filters" style="margin-top:8px"><button class="b p" id="paInv">Emparejar: mostrar mi código</button><button class="b" id="paAcep">Tengo un código</button></div></div>`;
  if(P.estado==="invitando")return h+`<p>Dile a tu pareja que, en su Memphis (Ajustes › 🤝 Compartir con mi pareja › «Tengo un código»), escriba:</p><p class="pacod">${esc(fmtCod(P.cod||""))}</p><p class="small muted">Vence en 3 días. Cuando lo acepte, aquí aparecerá emparejado (se revisa al sincronizar).</p><div class="filters"><button class="b s" id="paRev">Revisar ahora</button><button class="b s" id="paFin">Cancelar</button></div></div>`;
  const C=P.comp,personas=[...new Set([...(S.fichas||[]).filter(f=>f.tipo==="persona").map(f=>f.nombre),...(S.perfilesSalud||[]).map(p=>p.nombre)])].sort((a,b)=>a.localeCompare(b,"es")),cats=[...new Set((S.mov||[]).map(m=>m.categoria).filter(Boolean))].sort();
  const chk=(cls,v,on)=>`<label class="fchip ${on?"on":"off"}"><input type="checkbox" class="${cls}" value="${esc(v)}" ${on?"checked":""} hidden>${esc(v)}</label>`;
  return h+`<p>Emparejado con <b>${esc(P.otro||"tu pareja")}</b>${P.desde?" desde el "+esc(fechaCorta(P.desde)):""}. ${P.recibido?`<span class="small muted">Recibido: ${esc(new Date(P.recibido).toLocaleString("es-CO"))}.</span>`:""}</p>
   <h3>Lo que compartes tú</h3><p class="small muted">Nada se comparte si no lo marcas. Lo íntimo, el ciclo, tu diario y los demás gastos nunca se comparten.</p>
   <label>👤 Personas (su ficha, perfil y registros de salud)</label><div class="opc">${personas.map(n=>chk("paPer",n,(C.personas||[]).includes(n))).join("")||'<span class="small muted">Crea primero las fichas (p. ej. tus hijos).</span>'}</div>
   <label style="margin-top:8px">💰 Tus finanzas</label><select id="paFin2"><option value="nada" ${C.fin==="nada"?"selected":""}>No compartir</option><option value="total" ${C.fin==="total"?"selected":""}>Solo totales del mes (sin detalle)</option><option value="cat" ${C.fin==="cat"?"selected":""}>Totales por categoría (sin cada compra)</option></select>
   <label style="margin-top:8px">🏠 Cuentas en común <span class="small muted">(de estas sí va el detalle de cada movimiento)</span></label><div class="opc">${(S.cuentas||[]).map(c=>chk("paCta",c,(C.ctas||[]).includes(c))).join("")}</div>
   <label style="margin-top:8px">🛒 Categorías en común <span class="small muted">(p. ej. Mercado, Colegio: detalle de esas compras)</span></label><div class="opc">${cats.map(c=>chk("paCat",c,(C.cats||[]).includes(c))).join("")}</div>
   <label style="margin-top:8px"><input type="checkbox" id="paAg" ${C.agenda?"checked":""}> 📅 Compartir las actividades marcadas con <b>#familia</b></label>
   <div class="filters" style="margin-top:10px"><button class="b p" id="paVer">👀 Ver lo compartido</button><button class="b s" id="paPub">Publicar ahora</button><button class="b s" id="paFin">Terminar emparejamiento</button></div>${P.error?`<p class="small neg">Último error: ${esc(P.error)}</p>`:""}</div>`}
function bindPareja(){if(!$("#ajPareja"))return;const P=S.pareja;const nom=$("#paNom");
  if($("#paInv"))$("#paInv").onclick=async()=>{PAR.nombre=nom.value.trim().slice(0,40);try{await crearInvitacion();reAj()}catch(e){alert("No se pudo crear la invitación: "+e.message)}};
  if($("#paAcep"))$("#paAcep").onclick=async()=>{const c=prompt("Escribe el código de 12 caracteres que te muestra tu pareja:");if(!c)return;PAR.nombre=nom.value.trim().slice(0,40);if(await aceptarCodigo(c))reAj()};
  if($("#paRev"))$("#paRev").onclick=async()=>{await syncPar(true);reAj()};if($("#paFin"))$("#paFin").onclick=async()=>{await terminarPar();reAj()};
  if(!P||P.estado!=="activo")return;const C=P.comp;
  const lee=()=>{C.personas=[...document.querySelectorAll(".paPer:checked")].map(x=>x.value);C.ctas=[...document.querySelectorAll(".paCta:checked")].map(x=>x.value);C.cats=[...document.querySelectorAll(".paCat:checked")].map(x=>x.value);C.fin=$("#paFin2").value;C.agenda=$("#paAg").checked;changed();clearTimeout(PAR.t);PAR.t=setTimeout(()=>syncPar(true),1500)};
  document.querySelectorAll(".paPer,.paCta,.paCat").forEach(x=>x.onchange=()=>{x.parentElement.className="fchip "+(x.checked?"on":"off");lee()});$("#paFin2").onchange=lee;$("#paAg").onchange=lee;
  $("#paVer").onclick=()=>verPareja();$("#paPub").onclick=async()=>{await syncPar(true);aviso("🤝 Publicado");reAj()}}
function reAj(){const c=$("#ajPareja");if(!c)return;c.outerHTML=tarjetaPareja();bindPareja()}
window.addEventListener("load",()=>{const ra=window.reorganizarAjustes;if(typeof ra==="function")window.reorganizarAjustes=function(){const r=ra.apply(this,arguments);const s=$("#ajs-datos");if(s&&S&&!$("#ajPareja")){s.insertAdjacentHTML("afterbegin",tarjetaPareja());bindPareja()}return r}});
// ---------------------------------------------------------------- ver lo compartido
const PV={tab:"fin",mes:""};
function verPareja(){const I=S.parejaIn,P=S.pareja;if(!P||P.estado!=="activo"){alert("Aún no están emparejados.");return}
  let d=$("#paDlg");if(!d){d=document.createElement("dialog");d.id="paDlg";document.body.appendChild(d)}
  const tabs=[["fin","💰 Finanzas"],["fam","👨‍👩‍👧 Familia"],["ag","📅 Agenda"]];
  d.innerHTML=`<div class="filters" style="justify-content:space-between"><h2 style="margin:0">🤝 Con ${esc(P.otro||"tu pareja")}</h2><button class="b s" id="paX">✕</button></div>
   <div class="seg" style="margin:8px 0">${tabs.map(([k,l])=>`<button data-pvt="${k}" class="${PV.tab===k?"on":""}">${l}</button>`).join("")}</div><div id="paB">${!I?'<p class="small muted">Todavía no ha llegado nada de tu pareja (o aún no ha elegido qué compartir).</p>':PV.tab==="fin"?pvFin(I):PV.tab==="fam"?pvFam(I):pvAg(I)}</div>`;
  if(!d.open)d.showModal();$("#paX").onclick=()=>d.close();d.querySelectorAll("[data-pvt]").forEach(b=>b.onclick=()=>{PV.tab=b.dataset.pvt;verPareja()});
  d.querySelectorAll("[data-pvm]").forEach(s=>s.onchange=()=>{PV.mes=s.value;verPareja()})}
function pvFin(I){const F=I.fin||{},M=mesesAtras(12),mes=PV.mes||M[0],otro=esc(S.pareja.otro||"Pareja"),mine=resumenFin((S.mov||[]).filter(m=>m.fecha.startsWith(mes)),true)[mes]||{gasto:0,ingreso:0,cats:{}},suyo=(F.meses||{})[mes];
  let h=`<label>Mes <select data-pvm="1">${M.map(m=>`<option value="${m}" ${m===mes?"selected":""}>${esc(dDe(m+"-01").toLocaleDateString("es-CO",{month:"long",year:"numeric"}))}</option>`).join("")}</select></label>`;
  if(F.nivel==="nada"&&!(F.det||[]).length)return h+`<p class="small muted">${otro} no comparte sus finanzas.</p>`;
  if(suyo){const ant=M[M.indexOf(mes)+1],sa=ant&&(F.meses||{})[ant],mia=ant?(resumenFin((S.mov||[]).filter(m=>m.fecha.startsWith(ant)),false)[ant]||{gasto:0}):null,hog=mine.gasto+suyo.gasto,hogA=sa&&mia?mia.gasto+sa.gasto:0;
    h+=`<div class="ajg" style="margin-top:8px"><div><b>${fmt(mine.gasto)}</b><div class="small muted">gastaste tú</div></div><div><b>${fmt(suyo.gasto)}</b><div class="small muted">gastó ${otro}</div></div><div><b>${fmt(hog)}</b><div class="small muted">hogar${hogA?` · ${hog>hogA?"▲":"▼"} ${Math.abs(Math.round((hog-hogA)/hogA*100))}% vs. mes anterior`:""}</div></div></div>`;
    if(F.nivel==="cat"){const cats=[...new Set([...Object.keys(mine.cats),...Object.keys(suyo.cats||{})])].map(c=>({c,a:mine.cats[c]||0,b:(suyo.cats||{})[c]||0})).sort((x,y)=>y.a+y.b-x.a-x.b);
      h+=`<h3>Por categoría</h3><div class="tabla-c-wrap"><table class="tabla-c small"><tr><th>Categoría</th><th class="n">Tú</th><th class="n">${otro}</th><th class="n">Hogar</th></tr>${cats.slice(0,25).map(x=>`<tr><td>${esc(x.c)}</td><td class="n">${fmt(x.a)}</td><td class="n">${fmt(x.b)}</td><td class="n"><b>${fmt(x.a+x.b)}</b></td></tr>`).join("")}</table></div>`}
    const serie=M.slice(0,6).reverse().map(m=>({m,v:((F.meses||{})[m]||{gasto:0}).gasto+((resumenFin((S.mov||[]).filter(x=>x.fecha.startsWith(m)),false)[m]||{gasto:0}).gasto)})),mx=Math.max(1,...serie.map(x=>x.v));
    h+=`<h3>Hogar, últimos 6 meses</h3><div class="cosem">${serie.map(x=>`<div title="${fmt(x.v)}"><span style="height:${x.v/mx*100}%"></span><small>${esc(dDe(x.m+"-01").toLocaleDateString("es-CO",{month:"short"}))}</small></div>`).join("")}</div>`}
  else if(F.nivel!=="nada")h+=`<p class="small muted">No hay datos de ${otro} para ese mes.</p>`;
  const det=(F.det||[]).filter(x=>x.f.startsWith(mes)),C=S.pareja.comp,mios=(S.mov||[]).filter(m=>m.fecha.startsWith(mes)&&esComun(m)).map(m=>{const c=calc(m);return{f:m.fecha,g:Math.round(c.gasto),cat:m.categoria||"",cta:m.cuenta||"",d:(m.estab||m.concepto||m.desc||"").slice(0,80),yo:1}}).filter(x=>x.g);
  if(det.length||mios.length){const tA=mios.reduce((a,x)=>a+x.g,0),tB=det.reduce((a,x)=>a+x.g,0),dif=Math.round((tA-tB)/2);
    h+=`<h3>🏠 Gastos en común</h3><p class="small muted">Tus cuentas/categorías comunes: ${esc([...(C.ctas||[]),...(C.cats||[])].join(", ")||"ninguna")} · las de ${otro}: ${esc([...(F.ctas||[]),...(F.cats||[])].join(", ")||"ninguna")}</p>
     <div class="ajg"><div><b>${fmt(tA)}</b><div class="small muted">pusiste tú</div></div><div><b>${fmt(tB)}</b><div class="small muted">puso ${otro}</div></div><div><b>${dif===0?"A mano":dif>0?`${otro} te debe ${fmt(dif)}`:`Le debes ${fmt(-dif)}`}</b><div class="small muted">si dividen por mitades</div></div></div>
     <div class="tabla-c-wrap"><table class="tabla-c small"><tr><th>Fecha</th><th>Quién</th><th>Detalle</th><th>Categoría</th><th class="n">Valor</th></tr>${[...mios,...det].sort((a,b)=>b.f.localeCompare(a.f)).slice(0,200).map(x=>`<tr><td>${esc(fechaCorta(x.f))}</td><td>${x.yo?"Tú":otro}</td><td>${esc(x.d)}</td><td>${esc(x.cat)}</td><td class="n">${fmt(x.g)}</td></tr>`).join("")}</table></div>`}
  return h}
function pvFam(I){const L=I.personas||[];if(!L.length)return comunesP().length?`<p>👨‍👩‍👧 En común: <b>${comunesP().map(c=>esc(c.nombre)).join(", ")}</b>.</p><p class="small muted">Su ficha, su salud y las notas o actividades que los mencionan están en tu app como datos normales (Salud, Diario, Inicio) y los editan los dos.</p>`:`<p class="small muted">${esc(S.pareja.otro||"Tu pareja")} no comparte información de personas.</p>`;
  return L.map(p=>{const d=p.datos||{};return`<details class="pgrp" open><summary>👤 ${esc(p.nombre)}<span class="cnt">${(p.salud||[]).length} registros</span></summary><div style="padding:6px 10px">
   ${[d.rel&&"Relación: "+d.rel,d.cumple&&"Cumpleaños: "+d.cumple,(d.tel||[]).length&&"Tel: "+d.tel.join(", "),...(d.extra||[]).map(x=>x.k+": "+x.v)].filter(Boolean).map(x=>`<div class="small">${esc(x)}</div>`).join("")}
   ${p.perfil?`<div class="small">${Object.entries(p.perfil).filter(([k,v])=>v&&typeof v!=="object"&&k!=="nombre").map(([k,v])=>`<b>${esc(k)}:</b> ${esc(String(v).slice(0,200))}`).join(" · ")}</div>`:""}
   ${(p.salud||[]).slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,80).map(r=>`<details class="small" style="margin-top:4px"><summary>${esc((STIPOS[r.tipo]||["📝"])[0])} ${esc(fechaCorta(r.fecha))} · ${esc(r.titulo||(r.sintomas||[]).join(", ")||"Registro")}${r.estado?` <span class="chip">${esc(r.estado)}</span>`:""}</summary>
     <div style="padding:4px 8px">${r.medico?`<div>🩺 ${esc(r.medico)}${r.esp?" · "+esc(r.esp):""}</div>`:""}${(r.meds||[]).map(m=>`<div>💊 ${esc(m.n)} ${esc(m.dosis||"")}${m.cadaH?" cada "+m.cadaH+" h":""}${m.dias?" por "+m.dias+" días":""}</div>`).join("")}${(r.vacunas||[]).map(v=>`<div>💉 ${esc(v.v)} ${esc(v.dosis||"")}</div>`).join("")}
     ${r.texto?`<div class="md">${md(r.texto)}</div>`:""}${r.nAdj?`<div class="muted">📎 ${r.nAdj} adjunto(s) que no se comparten (pídeselos si los necesitas)</div>`:""}</div></details>`).join("")}</div></details>`}).join("")}
function pvAg(I){const L=(I.agenda||[]).filter(e=>(e.ff||e.f)>=hoyISO()).sort((a,b)=>(a.f+a.h).localeCompare(b.f+b.h));
  const mias=(S.diario||[]).filter(e=>!e.priv&&e.tipo==="evento"&&e.fecha>=hoyISO()&&/#familia\b/i.test((e.titulo||"")+" "+(e.texto||""))).map(e=>({f:e.fecha,h:e.hora||"",t:(e.titulo||"").replace(/#familia\b/gi,"").trim(),l:e.lugar||"",yo:1}));
  const T=[...L,...mias].sort((a,b)=>(a.f+a.h).localeCompare(b.f+b.h));
  return`<p class="small muted">Actividades con <b>#familia</b> de los dos (las tuyas se comparten si lo activas en Ajustes).</p>${T.length?T.slice(0,100).map(e=>`<div class="vrow small"><span style="min-width:110px">${esc(fechaCorta(e.f))}${e.h?" "+esc(e.h):""}</span><span style="flex:1">${esc(e.t||"Actividad")}${e.l?` <span class="muted">· 📍 ${esc(e.l)}</span>`:""}</span><span class="muted">${e.yo?"tú":esc(S.pareja.otro||"")}</span></div>`).join(""):'<p class="small muted">No hay actividades familiares próximas.</p>'}`}
// ---------------------------------------------------------------- accesos: Inicio, menú contextual
window.addEventListener("load",()=>{
  const pa=window.porAtenderHtml;if(typeof pa==="function")window.porAtenderHtml=function(){let h=pa.apply(this,arguments);if(!S||!S.pareja||S.pareja.estado!=="activo"||!S.parejaIn)return h;
    return h.replace('<h2>📌 Por atender</h2>','<h2>📌 Por atender</h2>'+`<div class="vrow small click" id="iPar"><span style="flex:1">🤝 Lo que comparte ${esc(S.pareja.otro||"tu pareja")}</span><span class="muted">ver →</span></div>`).replace('<p class="small muted">Todo al día ✔</p>',"")};
  const bi=window.bindInicio;if(typeof bi==="function")window.bindInicio=function(){const r=bi.apply(this,arguments);const x=$("#iPar");if(x)x.onclick=()=>verPareja();return r};
  const af=window.accionesF;if(typeof af==="function")window.accionesF=function(f){const A=af.apply(this,arguments);if(S.pareja&&S.pareja.estado==="activo"&&f.tipo==="persona"){const on=(S.pareja.comp.personas||[]).includes(f.nombre);
    A.push(["🤝",on?"Dejar de compartir con "+(S.pareja.otro||"mi pareja"):"Compartir con "+(S.pareja.otro||"mi pareja"),()=>{const L=new Set(S.pareja.comp.personas||[]);if(on)L.delete(f.nombre);else L.add(f.nombre);S.pareja.comp.personas=[...L];changed();syncPar(true);aviso(on?"Ya no se comparte":"🤝 Se compartirá "+f.nombre)}])}return A};
  const ad=window.accionesD;if(typeof ad==="function")window.accionesD=function(e){const A=ad.apply(this,arguments);if(e.tipo==="evento"&&!e.priv){const on=/#familia\b/i.test((e.titulo||"")+" "+(e.texto||""));
    A.splice(Math.max(0,A.length-2),0,["👨‍👩‍👧",on?"Quitar de la agenda familiar":"Agenda familiar (#familia)",()=>{if(on){e.titulo=(e.titulo||"").replace(/\s*#familia\b/gi,"");e.texto=(e.texto||"").replace(/\s*#familia\b/gi,"")}else e.texto=((e.texto||"")+" #familia").trim();e.editado=new Date().toISOString();changed();render();if(S.pareja)syncPar(true)}])}return A}});
// =====================================================================================================
// Lo recibido DENTRO de cada módulo (solo lectura, marcado «🤝 de …»):
// · Salud: las personas compartidas aparecen en Resumen, Perfiles, Historial y Síntomas con sus registros y su perfil.
// · Agenda (Diario e Inicio): sus citas de salud y las actividades #familia de tu pareja.
// · Finanzas: pestaña «🤝 Pareja» con el hogar, las categorías y los gastos en común.
// Mientras se dibuja la pantalla se suman como elementos virtuales y se retiran al terminar: nunca se guardan en tus datos.
// =====================================================================================================
const PARV={recs:new Map(),ev:new Map()};
const idPar=(...p)=>"par_"+[...p].join("|").replace(/[^\w|-]/g,"").slice(0,60)+"_"+Math.abs([...p.join("|")].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7)).toString(36);
function virtualesPar(){const I=S&&S.pareja&&S.pareja.estado==="activo"&&S.parejaIn;PARV.recs.clear();PARV.ev.clear();if(!I)return{R:[],P:[],E:[]};const otro=S.pareja.otro||"tu pareja",R=[],P=[],E=[];
  for(const p of I.personas||[]){(p.salud||[]).forEach((r,i)=>{const v={...r,id:idPar(p.nombre,r.fecha,r.hora||"",r.titulo||"",i),personas:[p.nombre],sintomas:r.sintomas||[],meds:r.meds||[],vacunas:r.vacunas||[],medidas:r.medidas||{},adjuntos:[],enlaces:[],versiones:[],texto:r.texto||"",titulo:r.titulo||"",fechaFin:r.fechaFin||"",horaFin:r.horaFin||"",inc:null,creado:"",editado:"",_par:otro};R.push(v);PARV.recs.set(v.id,{v,p})});
    if(p.perfil&&!(S.perfilesSalud||[]).some(x=>claveF(x.nombre)===claveF(p.nombre)))P.push({...p.perfil,nombre:p.nombre,_par:otro})}
  (I.agenda||[]).forEach((e,i)=>{const v={id:idPar("ev",e.f,e.h,e.t,i),...e,_par:otro};E.push(v);PARV.ev.set(v.id,v)});return{R,P,E}}
function conVirtuales(fn){if(!S||!S.parejaIn||!S.pareja||S.pareja.estado!=="activo")return fn();const {R,P,E}=virtualesPar();S.salud=S.salud||[];S.perfilesSalud=S.perfilesSalud||[];
  S.salud.push(...R);S.perfilesSalud.push(...P);PARV.agenda=E;try{return fn()}finally{S.salud=(S.salud||[]).filter(r=>!r._par);S.perfilesSalud=(S.perfilesSalud||[]).filter(p=>!p._par);PARV.agenda=null}}
function verRecPar(id){const x=PARV.recs.get(id)||(virtualesPar(),PARV.recs.get(id));if(!x){aviso("Ese registro ya no está compartido.");return}const r=x.v;
  dlg(`${esc((STIPOS[r.tipo]||["📝"])[0])} ${esc(r.titulo||"Registro")}`,`<p class="small"><span class="chip">🤝 compartido por ${esc(r._par)}</span> · solo lectura</p>
   <p><b>${esc(x.p.nombre)}</b> · ${esc(fechaLarga(r.fecha))}${r.hora?" "+esc(r.hora):""}${r.estado?` · <span class="chip">${esc(r.estado)}</span>`:""}</p>
   ${r.medico?`<p>🩺 ${esc(r.medico)}${r.esp?" · "+esc(r.esp):""}${r.lugar?" · 📍 "+esc(r.lugar):""}</p>`:""}${(r.sintomas||[]).length?`<p>Síntomas: ${r.sintomas.map(esc).join(", ")}</p>`:""}
   ${(r.meds||[]).map(m=>`<div>💊 <b>${esc(m.n)}</b> ${esc(m.dosis||"")}${m.cadaH?" cada "+m.cadaH+" h":""}${m.dias?" por "+m.dias+" días":""}</div>`).join("")}${(r.vacunas||[]).map(v=>`<div>💉 <b>${esc(v.v)}</b> ${esc(v.dosis||"")}${v.refuerzo?" · refuerzo "+esc(fechaCorta(v.refuerzo)):""}</div>`).join("")}
   ${Object.entries(r.medidas||{}).filter(([,v])=>v!==""&&v!=null).length?`<p>${Object.entries(r.medidas).filter(([,v])=>v!==""&&v!=null).map(([k,v])=>`${esc(k)}: <b>${esc(v)}</b>`).join(" · ")}</p>`:""}
   ${r.texto?`<div class="md">${md(r.texto)}</div>`:""}${r.nAdj?`<p class="small muted">📎 ${r.nAdj} adjunto(s) que no se comparten: pídeselos a ${esc(r._par)} si los necesitas.</p>`:""}`,[["Cerrar","p",cerrar]])}
function verEvPar(id){const e=PARV.ev.get(id)||(virtualesPar(),PARV.ev.get(id));if(!e)return;dlg("📅 "+esc(e.t||"Actividad"),`<p class="small"><span class="chip">🤝 agenda familiar de ${esc(e._par)}</span> · solo lectura</p><p>${esc(fechaLarga(e.f))}${e.h?" · "+esc(e.h)+(e.hf?"–"+esc(e.hf):""):""}${e.ff&&e.ff!==e.f?" → "+esc(fechaLarga(e.ff)):""}</p>${e.l?`<p>📍 ${esc(e.l)}</p>`:""}`,[["Cerrar","p",cerrar]])}
// Finanzas › 🤝 Pareja
function vFinPar(){const I=S.parejaIn,P=S.pareja;$("#view").innerHTML=!P||P.estado!=="activo"?`<div class="card"><h2>🤝 Pareja</h2><p class="small">Aún no estás emparejada/o. Hazlo en Ajustes › Datos › 🤝 Compartir con mi pareja.</p></div>`
   :`<div class="card"><h2>🤝 Finanzas con ${esc(P.otro||"tu pareja")}</h2>${I?pvFin(I):'<p class="small muted">Todavía no ha llegado nada.</p>'}<p class="small muted">Tú compartes: ${({nada:"nada de tus finanzas",total:"solo tus totales",cat:"tus totales por categoría"})[P.comp.fin||"nada"]}${(P.comp.ctas||[]).length+(P.comp.cats||[]).length?" y el detalle de "+esc([...(P.comp.ctas||[]),...(P.comp.cats||[])].join(", ")):""}. <a href="#" id="fpAj">Cambiar</a></p></div>`;
  document.querySelectorAll("#view [data-pvm]").forEach(s=>s.onchange=()=>{PV.mes=s.value;render()});const a=$("#fpAj");if(a)a.onclick=ev=>{ev.preventDefault();$("#btnAj").click()}}
function ponerTabPar(){const n=$("#tabs");if(!n)return;const hay=!!(S&&S.pareja&&S.pareja.estado==="activo"),b=n.querySelector('[data-t="par"]');if(hay&&!b)n.insertAdjacentHTML("beforeend",'<button data-t="par">🤝 Pareja</button>');else if(!hay&&b){b.remove();if(TAB==="par")TAB="inicio"}}
window.addEventListener("load",()=>{
  const r0=window.render;if(typeof r0==="function")window.render=function(){if(S)ponerTabPar();if(S&&typeof MOD!=="undefined"&&MOD==="fin"&&TAB==="par"){document.body.dataset.mod=MOD;vFinPar();return}return conVirtuales(()=>r0.apply(this,arguments))};
  const ts=window.tarjetaS;if(typeof ts==="function")window.tarjetaS=function(r){const h=ts.apply(this,arguments);return r&&r._par?h.replace(/^(\s*<div[^>]*>)/,`$1<span class="chip par">🤝 ${esc(r._par)}</span> `):h};
  const vs=window.verS;if(typeof vs==="function")window.verS=function(id){if(String(id).startsWith("par_"))return verRecPar(id);return vs.apply(this,arguments)};
  const es=window.editarS;if(typeof es==="function")window.editarS=function(id){if(String(id||"").startsWith("par_")){aviso("Es de tu pareja: solo lectura");return verRecPar(id)}return es.apply(this,arguments)};
  const ir=window.itemsRango;if(typeof ir==="function")window.itemsRango=function(desde,hasta){const out=ir.apply(this,arguments);const E=PARV.agenda||(S&&S.parejaIn&&S.pareja&&S.pareja.estado==="activo"?virtualesPar().E:[]);
    for(const e of E)if(e.f<=hasta&&(e.ff||e.f)>=desde)out.push({k:"pa",fecha:e.f>=desde?e.f:desde,hora:e.h||"",e});return out.sort((a,b)=>a.fecha.localeCompare(b.fecha)||(a.hora||"").localeCompare(b.hora||""))};
  const ti=window.tarjetaItem;if(typeof ti==="function")window.tarjetaItem=function(x){if(x&&x.k==="pa")return`<div class="it ev click" data-pev="${esc(x.e.id)}">📅 ${x.e.h?`<b>${esc(x.e.h)}</b> `:""}${esc(x.e.t||"Actividad")} <span class="chip par">🤝 ${esc(x.e._par)}</span>${x.e.l?` <span class="small muted">📍 ${esc(x.e.l)}</span>`:""}</div>`;return ti.apply(this,arguments)};
  document.addEventListener("click",ev=>{const a=ev.target.closest&&ev.target.closest("[data-pev]");if(a){ev.preventDefault();verEvPar(a.dataset.pev)}});
});
// =====================================================================================================
// 👨‍👩‍👧 PERSONAS EN COMÚN (las editan los dos): todo lo de esas personas —su ficha, su perfil de salud, sus registros
// de salud y las notas y actividades del Diario que las mencionan— vive en las dos apps como datos normales (se editan
// con las pantallas de siempre) y se mantiene igual en ambas a través de /pareja/<id>/comun.json, cifrado con la llave
// de pareja. Los adjuntos viajan aparte (/pareja/<id>/adj/), también cifrados con esa llave.
// · Gana la edición más reciente de cada elemento; lo borrado por uno se borra en el otro (queda en su papelera).
// · Las notas privadas 🔒 y los eventos traídos de Google Calendar nunca entran.
// · Si terminan el emparejamiento, cada uno se queda con su copia completa.
// =====================================================================================================
const KCOM={s:"salud",d:"diario",f:"fichas",p:"perfilesSalud"};
const comunesP=()=>(S.pareja&&Array.isArray(S.pareja.comunes)?S.pareja.comunes:[]);
function clavesComunes(){const K=new Set();for(const c of comunesP()){K.add(claveF(c.nombre));for(const a of c.alias||[])K.add(claveF(a));const f=fichaDe(c.nombre,"persona");if(f){K.add(claveF(f.nombre));for(const a of f.alias||[])K.add(claveF(a))}}return K}
function esComunNombre(n,K){K=K||clavesComunes();const f=fichaDe(n,"persona");return[n,...(f?[f.nombre,...(f.alias||[])]:[])].some(x=>K.has(claveF(x)))}
function cuentaComo(k,x,K){if(!x)return false;if(k==="s")return(x.personas||[]).some(n=>esComunNombre(n,K));if(k==="f")return x.tipo==="persona"&&esComunNombre(x.nombre,K);if(k==="p")return esComunNombre(x.nombre,K);
  if(k==="d")return!x.priv&&!(x.gcal&&x.gcal.src)&&!x.gcal&&typeof menciones==="function"&&menciones((x.titulo||"")+" "+(x.texto||"")).some(m=>m.tipo==="persona"&&esComunNombre(m.nombre,K));return false}
const marcaT=x=>String(x.editado||x.creado||"");
const sinVirt=o=>{const c=structuredClone(o);delete c._par;return c};
function esElementoComun(k,id){const P=S.pareja;return!!(P&&P.com&&P.com.vistos&&(k+":"+id) in P.com.vistos)}
async function comCifrar(o){const k=await llavePar(),iv=crypto.getRandomValues(new Uint8Array(12));return JSON.stringify({v:1,iv:u8b64(iv),ct:u8b64(new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode(S.pareja.pid+"|comun")},k,enc.encode(JSON.stringify(o)))))})}
async function comDescifrar(t){const o=JSON.parse(t),k=await llavePar();return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(o.iv),additionalData:enc.encode(S.pareja.pid+"|comun")},k,b64u8(o.ct))))}
function fusionarPersonas(R){const P=S.pareja,mapa=new Map();const quit=new Map();for(const q of [...(R.quitadas||[]),...(P.quitadas||[])])if(!quit.has(q.c)||quit.get(q.c)<q.t)quit.set(q.c,q.t);
  for(const c of [...(R.personas||[]),...comunesP()]){const k=claveF(c.nombre),prev=mapa.get(k);if(!prev||String(c.desde||"")>String(prev.desde||""))mapa.set(k,{...c,alias:[...new Set([...(prev&&prev.alias||[]),...(c.alias||[])])]})}
  P.comunes=[...mapa.values()].filter(c=>!(quit.has(claveF(c.nombre))&&quit.get(claveF(c.nombre))>=String(c.desde||"")));P.quitadas=[...quit.entries()].map(([c,t])=>({c,t})).slice(-100)}
async function syncComun(){const P=S.pareja;if(!P||P.estado!=="activo")return false;P.com=P.com||{rev:"",vistos:{}};const ruta=`/pareja/${P.pid}/comun.json`;let cambioLocal=false;
  for(let intento=0;intento<3;intento++){let R={personas:[],quitadas:[],items:{s:[],d:[],f:[],p:[]},borr:[],quien:{}},rev=null;
    const meta=await dbxMeta(ruta);if(meta){const d=await dbxDown(ruta);if(d){R=await comDescifrar(dec.decode(d.bytes));rev=d.rev||meta.rev}}
    R.items=R.items||{};for(const k in KCOM)R.items[k]=R.items[k]||[];R.borr=R.borr||[];R.quien=R.quien||{};
    if(!comunesP().length&&!(R.personas||[]).length){P.com.rev=rev||"";return false}
    fusionarPersonas(R);const K=clavesComunes(),ahora=new Date().toISOString(),borr=new Map(R.borr.map(b=>[b.k+":"+b.id,b.t]));
    // asegurar fichas y núcleo familiar para cada persona en común
    for(const c of P.comunes){if(!fichaDe(c.nombre,"persona")&&typeof asegurarFichas==="function"){asegurarFichas("@["+c.nombre+"]");cambioLocal=true}
      if(Array.isArray(S.saludFuera)&&S.saludFuera.some(x=>clavesComunes().has(claveF(x)))){S.saludFuera=S.saludFuera.filter(x=>!esComunNombre(x,K));cambioLocal=true}}
    for(const k in KCOM){const L=S[KCOM[k]]=S[KCOM[k]]||[];
      // 1) lo que el otro borró
      for(const [key,t] of borr){if(!key.startsWith(k+":"))continue;const id=key.slice(k.length+1),i=L.findIndex(x=>x.id===id);if(i>=0&&marcaT(L[i])<=t){const o=L[i];if(typeof aPapelera==="function"&&k!=="p")try{aPapelera(KCOM[k],o)}catch(e){}L.splice(i,1);(S.eliminados=S.eliminados||[]).push({id,fecha:ahora});cambioLocal=true}delete P.com.vistos[key]}
      // 2) lo nuevo o más reciente del otro
      for(const r of R.items[k]){let i=L.findIndex(x=>x.id===r.id);if(borr.has(k+":"+r.id))continue;
        if(i<0&&(k==="f"||k==="p")){const j=L.findIndex(x=>x.id!==r.id&&!x._par&&(k==="p"||x.tipo==="persona")&&(claveF(x.nombre)===claveF(r.nombre)||(x.alias||[]).some(a=>claveF(a)===claveF(r.nombre))));
          if(j>=0){const x=L[j],[gana,pierde]=r.id<x.id?[sinVirt(r),x]:[x,r];
            if(k==="f"){gana.alias=[...new Set([...(gana.alias||[]),...(pierde.alias||[]),pierde.nombre].filter(n=>claveF(n)!==claveF(gana.nombre)))];const dg=gana.datos||{},dp=pierde.datos||{};for(const [kk,v] of Object.entries(dp))if(dg[kk]==null||dg[kk]===""||Array.isArray(dg[kk])&&!dg[kk].length)dg[kk]=v;gana.datos=dg;if(pierde.nota&&!String(gana.nota||"").includes(pierde.nota))gana.nota=[gana.nota,pierde.nota].filter(Boolean).join("\n\n")}
            else for(const [kk,v] of Object.entries(pierde))if(kk!=="id"&&(gana[kk]==null||gana[kk]===""))gana[kk]=v;
            gana.editado=ahora;L[j]=gana;R.borr.push({k,id:pierde.id,t:ahora});borr.set(k+":"+pierde.id,ahora);delete P.com.vistos[k+":"+pierde.id];P.com.vistos[k+":"+gana.id]=marcaT(gana);cambioLocal=true;continue}}
        if(i<0&&(k+":"+r.id) in P.com.vistos&&marcaT(r)<=P.com.vistos[k+":"+r.id])continue; // lo borré yo: no lo revivo
        if(i<0){const n=sinVirt(r);for(const a of n.adjuntos||[])a.enCarpeta=false;L.push(n);cambioLocal=true;P.com.vistos[k+":"+r.id]=marcaT(r)}
        else if(marcaT(r)>marcaT(L[i])){const n=sinVirt(r);for(const a of n.adjuntos||[]){const v=(L[i].adjuntos||[]).find(x=>x.sha===a.sha);a.enCarpeta=v?!!v.enCarpeta:false}L[i]=n;cambioLocal=true;P.com.vistos[k+":"+r.id]=marcaT(r)}}
      // 3) lo que yo borré
      for(const key of Object.keys(P.com.vistos)){if(!key.startsWith(k+":"))continue;const id=key.slice(k.length+1);if(!L.some(x=>x.id===id)&&!borr.has(key)){R.borr.push({k,id,t:ahora});borr.set(key,ahora);delete P.com.vistos[key]}}}
    // 4) duplicados exactos en salud (lo mismo anotado por los dos antes de compartir)
    const SL=S.salud||[],vistosD=new Map();for(const r of SL.filter(r=>cuentaComo("s",r,K))){const firma=[r.fecha,r.hora||"",r.tipo,normK(r.titulo||""),[...(r.personas||[])].map(claveF).sort().join(",")].join("|");const o=vistosD.get(firma);
      if(o&&o.id!==r.id){const [queda,sale]=((r.texto||"").length+(r.adjuntos||[]).length*50)>((o.texto||"").length+(o.adjuntos||[]).length*50)?[r,o]:[o,r];
        for(const a of sale.adjuntos||[])if(!(queda.adjuntos||[]).some(x=>x.sha===a.sha))(queda.adjuntos=queda.adjuntos||[]).push(a);if(sale.texto&&!String(queda.texto||"").includes(sale.texto))queda.texto=[queda.texto,sale.texto].filter(Boolean).join("\n\n");queda.editado=ahora;
        S.salud=S.salud.filter(x=>x!==sale);R.borr.push({k:"s",id:sale.id,t:ahora});(S.eliminados=S.eliminados||[]).push({id:sale.id,fecha:ahora});vistosD.set(firma,queda);cambioLocal=true}else vistosD.set(firma,r)}
    // 5) armar lo que sube: todo lo que cuenta como común (de los dos), con quién lo editó
    const out={personas:P.comunes,quitadas:P.quitadas,items:{},borr:R.borr.filter(b=>b.t>new Date(Date.now()-180*864e5).toISOString()).slice(-3000),quien:R.quien};
    for(const k in KCOM){out.items[k]=[];for(const x of S[KCOM[k]]||[]){if(x._par||!cuentaComo(k,x,K)&&!((k+":"+x.id) in P.com.vistos))continue;const key=k+":"+x.id,rem=R.items[k].find(y=>y.id===x.id);
      if(!rem||marcaT(x)>marcaT(rem))out.quien[key]=P.miNombre||miNombreP();out.items[k].push(sinVirt(x));P.com.vistos[key]=marcaT(x)}}
    const antes=JSON.stringify({items:R.items,borr:R.borr.length,personas:(R.personas||[]).map(c=>c.nombre).sort()}),despues=JSON.stringify({items:out.items,borr:out.borr.length,personas:out.personas.map(c=>c.nombre).sort()});
    P.quien=out.quien;
    if(antes===despues&&meta){P.com.rev=rev;break}
    try{const r=await dbxUp(ruta,await comCifrar(out),rev?{".tag":"update",update:rev}:{".tag":"add"});P.com.rev=r.rev;break}catch(e){if(e.message==="DBX_409"&&intento<2)continue;throw e}}
  await subirAdjComun();if(cambioLocal){changed();if(!document.querySelector("dialog[open]"))render()}return cambioLocal}
// adjuntos: copia cifrada con la llave de pareja
async function subirAdjComun(){const P=S.pareja;if(!P||!P.com)return;P.com.adj=P.com.adj||{};let n=0;
  for(const [k,col] of Object.entries(KCOM)){if(k==="f"||k==="p")continue;for(const x of S[col]||[]){if(!((k+":"+x.id) in P.com.vistos))continue;for(const a of x.adjuntos||[]){if(!a.sha||a.tipo==="enlace"||P.com.adj[a.sha]||n>=15)continue;
    try{const p=await bytesAdj(a,{silencio:true}),kp=await llavePar(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode("padj|"+a.sha)},kp,p)),buf=new Uint8Array(12+ct.length);buf.set(iv);buf.set(ct,12);
      await dbxUp(`/pareja/${P.pid}/adj/${a.sha}.fmp`,buf,{".tag":"overwrite"});P.com.adj[a.sha]=1;n++}catch(e){}}}}if(n)changed()}
async function bajarAdjComun(a){const P=S.pareja;if(!P||P.estado!=="activo"||!a||!a.sha)return null;const d=await dbxDown(`/pareja/${P.pid}/adj/${a.sha}.fmp`);if(!d||!d.bytes)return null;
  const b=d.bytes,p=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:b.subarray(0,12),additionalData:enc.encode("padj|"+a.sha)},await llavePar(),b.subarray(12)));if(await sha256(p)!==a.sha)return null;
  const mio=await cifrarAdj(p,a.sha);await DB.set("adj:"+a.sha,mio);if(a.ruta&&typeof colaPoner==="function")colaPoner(a.sha,a.ruta);return p}
window.addEventListener("load",()=>{
  const ba=window.bytesAdj;if(typeof ba==="function")window.bytesAdj=async function(a,op){try{return await ba.call(this,a,{...(op||{}),silencio:true})}catch(e){try{const p=await bajarAdjComun(a);if(p)return p}catch(x){}if(op&&op.silencio)throw e;return ba.apply(this,arguments)}};
  // la sincronización de pareja también mantiene lo común
  const sp=window.syncPar;void sp;
});
const _syncParBase=syncPar;
syncPar=async function(forzar){await _syncParBase(forzar);const P=S&&S.pareja;if(!P||P.estado!=="activo"||PAR.ocupadoC)return;if(!forzar&&Date.now()-(PAR.ultC||0)<90e3)return;PAR.ocupadoC=true;PAR.ultC=Date.now();try{await syncComun()}catch(e){P.error=String(e.message||e).slice(0,200)}finally{PAR.ocupadoC=false}};
// convertir lo que antes era «compartir persona (solo lectura)» en «persona en común»
MIGRAR_EXTRA.push(st=>{const P=st.pareja;if(P&&P.comp&&Array.isArray(P.comp.personas)&&P.comp.personas.length){P.comunes=[...(P.comunes||[]),...P.comp.personas.filter(n=>!(P.comunes||[]).some(c=>claveF(c.nombre)===claveF(n))).map(n=>({nombre:n,alias:[],desde:new Date().toISOString(),por:P.miNombre||""}))];P.comp.personas=[]}});
function ponerComun(nombre,si){const P=S.pareja;if(!P)return;P.comunes=P.comunes||[];P.quitadas=P.quitadas||[];const k=claveF(nombre),ah=new Date().toISOString();
  if(si){if(!P.comunes.some(c=>claveF(c.nombre)===k)){const f=fichaDe(nombre,"persona");P.comunes.push({nombre:f?f.nombre:nombre,alias:f?f.alias||[]:[],desde:ah,por:P.miNombre||miNombreP()})}P.quitadas=P.quitadas.filter(q=>q.c!==k);
    if(Array.isArray(S.saludFuera))S.saludFuera=S.saludFuera.filter(x=>claveF(x)!==k&&!(fichaDe(nombre,"persona")||{alias:[]}).alias.some(a=>claveF(a)===claveF(x)))}
  else{P.comunes=P.comunes.filter(c=>claveF(c.nombre)!==k);P.quitadas.push({c:k,t:ah});for(const key of Object.keys((P.com||{}).vistos||{}))void key}
  changed();PAR.ultC=0;syncPar(true)}
window.addEventListener("load",()=>{
  // Ajustes: la lista de personas ahora es «en común»
  const tp=window.tarjetaPareja;if(typeof tp==="function")window.tarjetaPareja=function(){let h=tp.apply(this,arguments);const P=S.pareja;if(!P||P.estado!=="activo")return h;
    const personas=[...new Set([...(S.fichas||[]).filter(f=>f.tipo==="persona").map(f=>f.nombre),...(S.perfilesSalud||[]).map(p=>p.nombre)])].sort((a,b)=>a.localeCompare(b,"es")),K=clavesComunes();
    const bloque=`<label>👨‍👩‍👧 Personas en común <span class="small muted">(las editan los dos: su ficha, su salud con adjuntos, y las notas y actividades que las mencionan con @)</span></label><div class="opc">${personas.map(n=>{const on=esComunNombre(n,K);return`<label class="fchip ${on?"on":"off"}"><input type="checkbox" class="paCom" value="${esc(n)}" ${on?"checked":""} hidden>${esc(n)}</label>`}).join("")||'<span class="small muted">Crea primero las fichas (p. ej. tus hijos).</span>'}</div>
     ${comunesP().length?`<p class="small muted">En común: ${comunesP().map(c=>esc(c.nombre)+(c.por?` <span class="muted">(por ${esc(c.por)})</span>`:"")).join(", ")}. Quedan en el 🏠 núcleo familiar de los dos.</p>`:""}`;
    return h.replace(/<label>👤 Personas \(su ficha, perfil y registros de salud\)<\/label><div class="opc">[\s\S]*?<\/div>/,bloque)};
  const bp=window.bindPareja;if(typeof bp==="function")window.bindPareja=function(){const r=bp.apply(this,arguments);document.querySelectorAll(".paCom").forEach(x=>x.onchange=()=>{
    if(!x.checked&&!confirm(`¿Dejar de tener a ${x.value} en común? Lo que ya tienen se queda en las dos apps, pero los cambios dejarán de llegarle al otro.`)){x.checked=true;return}x.parentElement.className="fchip "+(x.checked?"on":"off");ponerComun(x.value,x.checked)});return r};
  // marcas visibles
  const ts=window.tarjetaS;if(typeof ts==="function")window.tarjetaS=function(r){const h=ts.apply(this,arguments);return r&&!r._par&&esElementoComun("s",r.id)?h.replace(/^(\s*<div[^>]*>)/,`$1<span class="chip par" title="Lo editan los dos">🤝 común</span> `):h};
  const vs=window.verS;if(typeof vs==="function")window.verS=function(id){const r=vs.apply(this,arguments);if(esElementoComun("s",id)){const q=(S.pareja.quien||{})["s:"+id];const b=$("#dlgB");if(b)b.insertAdjacentHTML("afterbegin",`<p class="small"><span class="chip par">🤝 en común</span>${q?` · última edición: ${esc(q)}`:""}</p>`)}return r};
  const vd=window.verD;if(typeof vd==="function")window.verD=function(id){const r=vd.apply(this,arguments);if(esElementoComun("d",id)){const q=(S.pareja.quien||{})["d:"+id];const b=$("#dlgB");if(b&&!b.querySelector(".comD"))b.insertAdjacentHTML("afterbegin",`<p class="small comD"><span class="chip par">🤝 en común</span>${q?` · última edición: ${esc(q)}`:""}</p>`)}return r};
  // menú contextual de una persona: en común
  const af=window.accionesF;if(typeof af==="function")window.accionesF=function(f){const A=af.apply(this,arguments).filter(a=>!(Array.isArray(a)&&a[0]==="🤝"));if(S.pareja&&S.pareja.estado==="activo"&&f.tipo==="persona"){const on=esComunNombre(f.nombre);
    A.push(["🤝",on?"Dejar de tener en común":"Poner en común con "+(S.pareja.otro||"mi pareja"),()=>{if(on&&!confirm("¿Dejar de tener a "+f.nombre+" en común?"))return;ponerComun(f.nombre,!on);aviso(on?"Ya no está en común":"🤝 "+f.nombre+" quedó en común")}])}return A};
});
