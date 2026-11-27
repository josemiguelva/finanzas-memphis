// =====================================================================================================
// Memphis · 👤 PERFILES (varias personas: mismo enlace, mismo Dropbox si quieren, datos y frases separados),
// 🔁 mudarse a otro Dropbox, 🏷 nombre e ícono de la app, módulos visibles.
// Cada perfil guarda en Dropbox dentro de /perfiles/<perfil>/ (el principal usa las rutas de siempre) y
// nunca escribe fuera de su carpeta (salvo /pareja/, el buzón cifrado que comparten si se emparejan).
// =====================================================================================================
"use strict";
const LS0={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
function listaPerfiles(){let L=[];try{L=JSON.parse(LS0.get("memphisPerfiles")||"[]")}catch(e){}if(!Array.isArray(L))L=[];L=L.filter(p=>p&&/^[a-z0-9-]{0,24}$/.test(p.id||"")&&typeof p.nombre==="string");
  if(!L.some(p=>p.id===""))L.unshift({id:"",nombre:"Principal"});if(PERFIL&&!L.some(p=>p.id===PERFIL))L.push({id:PERFIL,nombre:PERFIL});return L}
const nombrePerfil=id=>(listaPerfiles().find(p=>p.id===id)||{}).nombre||(id||"Principal");
const slugP=n=>normK(n).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,24);
function cambiarAPerfil(id){LS0.set("memphisPerfil",id);location.replace(location.pathname)}
function dialogoPerfiles(){const L=listaPerfiles();let d=$("#pfDlg");if(!d){d=document.createElement("dialog");d.id="pfDlg";document.body.appendChild(d)}
  d.innerHTML=`<h2 style="margin-top:0">👤 ¿Quién usa Memphis aquí?</h2><p class="small">Cada perfil tiene su propia frase, sus datos y su carpeta en Dropbox. Nadie puede leer los datos de otro perfil sin su frase.</p>
   <div class="pfl">${L.map(p=>`<button class="b ${p.id===PERFIL?"p":""}" data-pf="${esc(p.id)}">${p.id===PERFIL?"✔ ":""}${esc(p.nombre)}${p.id?"":" <span class='small'>(principal)</span>"}</button>`).join("")}</div>
   <h3>Nuevo perfil</h3><div class="filters"><input id="pfN" placeholder="Nombre (p. ej. Ana)" maxlength="30" style="flex:1"><button class="b" id="pfA">Crear y entrar</button></div>
   <p class="small muted">En un dispositivo propio basta un perfil. Si comparten un PC, aquí cambian de uno a otro (Memphis se bloquea al cambiar).</p>
   <div class="filters" style="justify-content:flex-end"><button class="b" id="pfC">Cerrar</button></div>`;
  d.showModal();$("#pfC").onclick=()=>d.close();
  d.querySelectorAll("[data-pf]").forEach(b=>b.onclick=async()=>{const id=b.dataset.pf;if(id===PERFIL){d.close();return}if(S&&typeof bloquear==="function")try{await bloquear()}catch(e){}cambiarAPerfil(id)});
  $("#pfA").onclick=async()=>{const n=$("#pfN").value.trim();const id=slugP(n);if(!id){alert("Escribe un nombre");return}if(L.some(p=>p.id===id)){alert("Ya existe ese perfil");return}
    L.push({id,nombre:n.slice(0,30)});LS0.set("memphisPerfiles",JSON.stringify(L.filter(p=>p.id||p.nombre!=="Principal"||true)));if(S&&typeof bloquear==="function")try{await bloquear()}catch(e){}cambiarAPerfil(id)}}
// barra del perfil en las pantallas de bienvenida y de clave
function barraPerfil(){const c=document.querySelector("#view .lock.card");if(!c||c.querySelector(".pfbar"))return;const L=listaPerfiles();
  c.insertAdjacentHTML("afterbegin",`<div class="pfbar small">👤 <b>${esc(nombrePerfil(PERFIL))}</b>${L.length>1||PERFIL?` · <a href="#" id="pfCam">cambiar de perfil</a>`:` · <a href="#" id="pfCam">otra persona</a>`}</div>`);
  $("#pfCam").onclick=ev=>{ev.preventDefault();dialogoPerfiles()};const h=c.querySelector("h2");if(h)h.textContent=h.textContent.replace(/Finanzas Memphis|Memphis/,nombreApp())}
new MutationObserver(()=>{if(document.body.classList.contains("locked"))barraPerfil()}).observe(document.documentElement,{childList:true,subtree:true});
// lo compartido al teléfono (Android) cae en la base del perfil principal: lo traemos
window.addEventListener("load",async()=>{if(!PERFIL)return;try{const db=await new Promise((ok,ko)=>{const r=indexedDB.open("finanzasMemphis",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)});
  const L=await new Promise(ok=>{const g=db.transaction("kv").objectStore("kv").get("capPend");g.onsuccess=()=>ok(g.result);g.onerror=()=>ok(null)});
  if(Array.isArray(L)&&L.length){const mio=(await DB.get("capPend"))||[];await DB.set("capPend",[...mio,...L].slice(-100));await new Promise(ok=>{const t=db.transaction("kv","readwrite");t.objectStore("kv").delete("capPend");t.oncomplete=ok;t.onerror=ok})}db.close()}catch(e){}});
// ---------------------------------------------------------------- nombre e ícono
const ICONOS_APP=[["clasico","Clásico"],["agenda","Agenda"],["flor","Flor"],["libreta","Libreta"],["hoja","Hoja"],["estrella","Estrella"],["corazon","Corazón"],["hogar","Hogar"]];
const NOMBRES_APP=["Memphis","Agenda MP","Mi agenda","Agenda"];
function marcaApp(){let m=null;try{m=JSON.parse(LS0.get("memphisMarca")||"null")}catch(e){}if(S&&S.marca)m=S.marca;return{nombre:(m&&typeof m.nombre==="string"&&m.nombre.trim())?m.nombre.trim().slice(0,30):"Memphis",icono:m&&ICONOS_APP.some(x=>x[0]===m.icono)?m.icono:"clasico"}}
const nombreApp=()=>marcaApp().nombre;
function aplicarMarca(){const m=marcaApp(),pf=PERFIL?" · "+nombrePerfil(PERFIL):"";document.title=m.nombre;const h=document.querySelector("header h1");if(h&&h.textContent!==m.nombre)h.textContent=m.nombre;
  const t=document.querySelector('meta[name="apple-mobile-web-app-title"]');if(t)t.content=m.nombre;
  const svg=m.icono==="clasico"?"icons/icon.svg":`icons/v/${m.icono}.svg`,png=m.icono==="clasico"?"icons/icon-192.png":`icons/v/${m.icono}-192.png`;
  const fi=document.querySelector('link[rel="icon"]');if(fi&&fi.getAttribute("href")!==svg)fi.setAttribute("href",svg);const ap=document.querySelector('link[rel="apple-touch-icon"]');if(ap&&ap.getAttribute("href")!==png)ap.setAttribute("href",png);
  const i=NOMBRES_APP.indexOf(m.nombre),mf=(m.icono==="clasico"&&i<=0)?"manifest.webmanifest":`icons/v/m-${m.icono}-${Math.max(0,i)}.webmanifest`;const ml=document.querySelector('link[rel="manifest"]');if(ml&&ml.getAttribute("href")!==mf)ml.setAttribute("href",mf);
  LS0.set("memphisMarca",JSON.stringify(m));void pf}
aplicarMarca();
// ---------------------------------------------------------------- módulos visibles (además del modo Trabajo/Personal)
const MODS_OPC=[["fin","💰 Finanzas"],["dia","📓 Diario"],["sal","🩺 Salud"],["bib","📚 Biblioteca"],["proy","🎯 Proyectos"],["cur","🎓 Cursos"]];
CONFIG_EXTRA.push("modsOcultos","marca");
const BASE_OCULTA=typeof MODO_OCULTA!=="undefined"?Object.fromEntries(Object.entries(MODO_OCULTA).map(([k,v])=>[k,v.slice()])):null;
function aplicarOcultos(){const o=(S&&Array.isArray(S.modsOcultos)?S.modsOcultos:[]).filter(k=>MODS_OPC.some(x=>x[0]===k));document.body.dataset.ocu=o.join(" ");
  if(BASE_OCULTA)for(const k of Object.keys(MODO_OCULTA)){MODO_OCULTA[k].length=0;MODO_OCULTA[k].push(...new Set([...BASE_OCULTA[k],...o]))}
  if(S&&typeof MOD!=="undefined"&&o.includes(MOD))irModulo("ini")}
// ---------------------------------------------------------------- 🔁 mudarse a otro Dropbox
async function mudarDropbox(){if(!S||!conDropbox()){alert("Primero conecta Dropbox.");return}
  if(!confirm(`Vas a llevar tus datos a OTRA cuenta de Dropbox.\n\n1) Memphis descarga a este dispositivo todos tus adjuntos.\n2) ${PERFIL?"Borra tu carpeta de este Dropbox (/perfiles/"+PERFIL+")":"Deja tus archivos en este Dropbox (puedes borrarlos tú después)"}.\n3) Desconecta este Dropbox.\n4) Tú conectas la otra cuenta y todo se sube allá.\n\n¿Seguir?`))return;
  const box=document.createElement("dialog");box.id="mdDlg";box.innerHTML='<h3>🔁 Mudanza</h3><p id="mdT">Preparando…</p>';document.body.appendChild(box);box.showModal();const T=t=>{$("#mdT").textContent=t};
  try{T("Sincronizando…");await dbxSync("manual");const L=todosAdj().filter(([,a])=>a.sha&&a.tipo!=="enlace");let ok=0,mal=0;
    for(const [m,a] of L){const ya=await DB.get("adj:"+a.sha);if(ya){ok++;continue}T(`Descargando adjuntos… ${ok+mal+1}/${L.length}`);try{const d=a.ruta?await dbxDown("/"+a.ruta):null;if(d&&d.bytes){await DB.set("adj:"+a.sha,d.bytes);ok++}else mal++}catch(e){mal++}}
    if(mal&&!confirm(`${mal} adjunto(s) no se pudieron descargar (quizá ya no estaban en Dropbox). Si sigues, se perderán. ¿Seguir de todas formas?`)){box.close();box.remove();return}
    if(typeof C!=="undefined"&&C)C._sucio=true;for(const [,a] of todosAdj())if(a.enCarpeta)a.enCarpeta=false;
    if(PERFIL){T("Borrando tu carpeta de este Dropbox…");await dbxBorrar("/perfiles/"+PERFIL)}
    T("Desconectando…");try{await fetch("https://api.dropboxapi.com/2/auth/token/revoke",{method:"POST",headers:{Authorization:"Bearer "+await dbxTok()}})}catch(e){}
    S.dbx=null;DBX.token=null;changed();await persist();LS0.set("memphisMudanza","1");box.close();box.remove();
    if(confirm("Listo. Ahora conecta la OTRA cuenta de Dropbox (inicia sesión con esa cuenta cuando Dropbox te lo pida). ¿Conectar ya?"))pedirAppKey();else render()}
  catch(e){T("No se pudo: "+e.message+". No se borró nada.");setTimeout(()=>{box.close();box.remove()},4000)}}
window.addEventListener("load",()=>{setInterval(async()=>{if(LS0.get("memphisMudanza")!=="1"||!S||!conDropbox()||!S.dbx||!S.dbx.rev)return;LS0.set("memphisMudanza","");let n=0;
  for(const [m,a] of todosAdj()){if(a.tipo==="enlace"||!a.sha||a.enCarpeta)continue;a.ruta=a.ruta||rutaAdj(m,a);const c=await DB.get("adj:"+a.sha);if(c){try{await dbxUp("/"+a.ruta,c,{".tag":"overwrite"});a.enCarpeta=true;n++}catch(e){}}}changed();aviso(`🔁 Mudanza completa: ${n} adjuntos subidos al nuevo Dropbox`)},20000)});
// ---------------------------------------------------------------- tarjeta en Ajustes › Este dispositivo
function tarjetaPerfil(){const m=marcaApp(),o=S.modsOcultos||[];
  return`<div class="card" id="ajPerfil"><h2>👤 Perfil, nombre e ícono</h2>
   <p class="small">Perfil en este dispositivo: <b>${esc(nombrePerfil(PERFIL))}</b>${PERFIL?` · carpeta en Dropbox: <code>/perfiles/${esc(PERFIL)}</code>`:" (principal)"} · <a href="#" id="ajPfC">cambiar o crear perfil</a></p>
   <label>Nombre de la app<input id="ajNom" list="ajNomL" value="${esc(m.nombre)}" maxlength="30"></label><datalist id="ajNomL">${NOMBRES_APP.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
   <label style="margin-top:6px">Ícono</label><div class="icosel">${ICONOS_APP.map(([k,l])=>`<button type="button" class="ico ${m.icono===k?"on":""}" data-ico="${k}" title="${esc(l)}"><img src="${k==="clasico"?"icons/icon.svg":"icons/v/"+k+".svg"}" alt="${esc(l)}"></button>`).join("")}</div>
   <p class="small muted">Se ve de inmediato en la app. En la pantalla de inicio del celular el ícono y el nombre se toman al <b>instalar</b>: si ya está instalada, desinstálala y vuelve a instalarla. Con los nombres de la lista (${NOMBRES_APP.join(", ")}) Android también usa el nombre; con otro nombre, Android deja «Memphis» y en iPhone puedes escribirlo al «Agregar a inicio».</p>
   <label style="margin-top:6px">Módulos que usas</label><div class="opc">${MODS_OPC.map(([k,l])=>`<label class="fchip ${o.includes(k)?"off":"on"}"><input type="checkbox" data-mv="${k}" ${o.includes(k)?"":"checked"} hidden>${l}</label>`).join("")}</div>
   <p class="small muted">Lo que desmarques desaparece del menú, de Inicio y de la búsqueda (no se borra nada). Se aplica en todos tus dispositivos.</p>
   <div class="filters" style="margin-top:8px"><button class="b s" id="ajMud">🔁 Mudarme a otro Dropbox…</button></div></div>`}
function bindTarjetaPerfil(){if(!$("#ajPerfil"))return;$("#ajPfC").onclick=ev=>{ev.preventDefault();dialogoPerfiles()};
  $("#ajNom").onchange=()=>{const n=$("#ajNom").value.trim().slice(0,30)||"Memphis";S.marca={...marcaApp(),nombre:n};changed();aplicarMarca();aviso("Nombre: "+n)};
  document.querySelectorAll("[data-ico]").forEach(b=>b.onclick=()=>{S.marca={...marcaApp(),icono:b.dataset.ico};changed();aplicarMarca();document.querySelectorAll("[data-ico]").forEach(x=>x.classList.toggle("on",x===b))});
  document.querySelectorAll("[data-mv]").forEach(c=>c.onchange=()=>{const k=c.dataset.mv,o=new Set(S.modsOcultos||[]);if(c.checked)o.delete(k);else o.add(k);S.modsOcultos=[...o];c.parentElement.className="fchip "+(c.checked?"on":"off");changed();aplicarOcultos()});
  $("#ajMud").onclick=mudarDropbox}
window.addEventListener("load",()=>{
  const ra=window.reorganizarAjustes;if(typeof ra==="function")window.reorganizarAjustes=function(){const r=ra.apply(this,arguments);const s=$("#ajs-disp");if(s&&S&&!$("#ajPerfil")){const d=$("#ajDisp");(d||s.lastElementChild).insertAdjacentHTML(d?"afterend":"beforeend",tarjetaPerfil());bindTarjetaPerfil()}return r};
  const r0=window.render;if(typeof r0==="function")window.render=function(){const o=r0.apply(this,arguments);if(S){aplicarMarca();const oc=(S.modsOcultos||[]).join(" ");if(document.body.dataset.ocu!==oc)aplicarOcultos()}return o};
  const de=window.desbloqueado;if(typeof de==="function")window.desbloqueado=function(){const r=de.apply(this,arguments);aplicarMarca();aplicarOcultos();return r}});
