// =====================================================================================================
// Memphis · ⚙️ AJUSTES en un solo lugar: este dispositivo (portada, modo, montos, pegado, vistas, tema), seguridad
// (recordar, huella, PIN de privadas, bloqueo), datos y respaldos (Dropbox, exportar, papelera, importar notas),
// conexiones (calendarios, Telegram, Gmail, Mis gastos) y lo propio de Finanzas. Reúne las tarjetas que ya existían.
// =====================================================================================================
"use strict";
const SEC_AJ=[["disp","📱 Este dispositivo"],["seg","🔐 Seguridad y acceso"],["datos","☁️ Datos y respaldos"],["con","🔌 Conexiones"],["fin","💰 Finanzas"],["otros","Otros"]];
function seccionDe(card){const id=card.id||"",h=normK((card.querySelector("h2,h3,summary b,b")||{}).textContent||"");
  if(/recCard|pvCard|dispCard/.test(id)||/seguridad|recordar|privad|huella|bloqueo|dispositivos/.test(h))return"seg";
  if(/cxCard|gmCard|bzCard/.test(id)||/calendario|telegram|captur|gmail|correo|mis gastos|buzon/.test(h))return"con";
  if(/dropbox|donde estan|exportar|respaldo|papelera|importar paquete|copias|carpeta/.test(h))return"datos";
  if(/familia|saldos|cruce|reglas|categor|cuentas|tipos/.test(h))return"fin";return"otros"}
function tarjetaDispositivo(){const g=k=>{try{return localStorage.getItem(k)}catch(e){return null}},port=g("memphisPortada")!=="ultimo",bv=typeof BV!=="undefined"?BV:{cel:"lista",pc:"tabla"},M=typeof BV_MODOS!=="undefined"?BV_MODOS:{};
  const opt=(o,v)=>Object.entries(o).map(([k,[i,l]])=>`<option value="${k}" ${v===k?"selected":""}>${i} ${l}</option>`).join("");
  return`<div class="card" id="ajDisp"><h2>📱 Este dispositivo</h2><p class="small muted">Estas preferencias son de este celular o PC (no viajan con tus datos).</p>
   <div class="ajg"><label>Al abrir Memphis<select id="ajPort"><option value="ini" ${port?"selected":""}>🏠 Inicio</option><option value="ultimo" ${port?"":"selected"}>La última sección usada</option></select></label>
    <label>Modo<select id="ajModo">${[["ambos","Ambos"],["trabajo","💼 Trabajo (oculta Finanzas y Salud)"],["personal","🏠 Personal (oculta Cursos y Proyectos)"]].map(([k,l])=>`<option value="${k}" ${INI.modo===k?"selected":""}>${l}</option>`).join("")}</select></label>
    <label>Montos de dinero<select id="ajDisc"><option value="0" ${DISC?"":"selected"}>Mostrar</option><option value="1" ${DISC?"selected":""}>🙈 Ocultar ($ •••)</option></select></label>
    <label>Al pegar texto copiado<select id="ajPega"><option value="rico" ${PEGA==="rico"?"selected":""}>Con formato (títulos, negritas, listas, imágenes)</option><option value="plano" ${PEGA==="plano"?"selected":""}>Texto plano</option></select></label>
    <label>Biblioteca en el celular<select id="ajBvC">${opt(M,bv.cel)}</select></label><label>Biblioteca en el PC<select id="ajBvP">${opt(M,bv.pc)}</select></label></div>
   <div class="filters" style="margin-top:8px"><button class="b s" id="ajTema">🎨 Apariencia (claro, oscuro, colores)</button></div>
   <p class="small muted" style="margin-top:8px">Atajos en el PC: <b>Ctrl+K</b> anotar · <b>Ctrl+Shift+K</b> o <b>/</b> buscar en todo · arrastra archivos a cualquier parte.</p></div>`}
function tarjetaImportar(){return`<div class="card" id="ajImp"><h2>📥 Importar notas (UpNote, Notesnook, Obsidian, Markdown)</h2><p class="small">Trae tus notas a la Biblioteca con sus libretas, etiquetas, imágenes y adjuntos. Puedes repetirlo: lo que ya está no se duplica.</p><button class="b p" id="ajImpB">📥 Importar notas…</button></div>`}
let AJ_SEC="";
function reorganizarAjustes(){const v=$("#view");if(!v)return;const cards=[...v.children].filter(el=>el.classList.contains("card")||el.querySelector("h2"));const por={};for(const c of cards){const s=seccionDe(c);(por[s]=por[s]||[]).push(c)}
  v.innerHTML=`<div class="ajh"><h1 style="margin:0">⚙️ Ajustes</h1><span class="sp"></span><input id="ajQ" placeholder="🔎 Buscar un ajuste…" style="max-width:240px"></div>
   <nav class="ajnav">${SEC_AJ.filter(([k])=>k==="disp"||por[k]).map(([k,l])=>`<a href="#" data-ajs="${k}">${l}</a>`).join("")}</nav>
   <div id="ajCont">${SEC_AJ.map(([k,l])=>`<section class="ajsec" id="ajs-${k}" ${k!=="disp"&&!por[k]&&k!=="datos"?"hidden":""}><h2 class="ajt">${l}</h2></section>`).join("")}</div>`;
  const sec=k=>$("#ajs-"+k);sec("disp").insertAdjacentHTML("beforeend",tarjetaDispositivo());sec("datos").insertAdjacentHTML("beforeend",tarjetaImportar());
  for(const [k] of SEC_AJ)for(const c of por[k]||[])sec(k).appendChild(c);
  // enlaces
  document.querySelectorAll("[data-ajs]").forEach(a=>a.onclick=ev=>{ev.preventDefault();AJ_SEC=a.dataset.ajs;sec(AJ_SEC).scrollIntoView({behavior:"smooth",block:"start"})});
  $("#ajQ").oninput=()=>{const q=normK($("#ajQ").value);document.querySelectorAll("#ajCont .ajsec > .card, #ajCont .ajsec > div").forEach(c=>{c.hidden=!!q&&!normK(c.textContent).includes(q)});document.querySelectorAll("#ajCont .ajsec").forEach(s=>{s.querySelector(".ajt").hidden=!!q&&![...s.children].some(c=>!c.classList.contains("ajt")&&!c.hidden)})};
  $("#ajPort").onchange=()=>{try{localStorage.setItem("memphisPortada",$("#ajPort").value)}catch(e){}aviso("Listo")};
  $("#ajModo").onchange=()=>{INI.modo=$("#ajModo").value;try{localStorage.setItem("memphisModo",INI.modo)}catch(e){}document.body.dataset.modo=INI.modo;aviso("Modo: "+$("#ajModo").selectedOptions[0].textContent)};
  $("#ajDisc").onchange=()=>{if(($("#ajDisc").value==="1")!==DISC)toggleDisc();aviso(DISC?"Montos ocultos":"Montos visibles")};
  $("#ajPega").onchange=()=>{PEGA=$("#ajPega").value;try{localStorage.setItem("memphisPega",PEGA)}catch(e){}aviso("Listo")};
  const bvs=(id,k)=>{const e=$(id);if(e)e.onchange=()=>{BV[k]=e.value;bvGuarda();aviso("Listo")}};bvs("#ajBvC","cel");bvs("#ajBvP","pc");
  $("#ajTema").onclick=()=>{const b=$("#btnTema");if(b)b.click()};$("#ajImpB").onclick=()=>importarNotasB();
  if(AJ_SEC&&sec(AJ_SEC))setTimeout(()=>sec(AJ_SEC).scrollIntoView({block:"start"}),30)}
function irAjustes(sec){AJ_SEC=sec||"";irModulo("aj");scrollTo(0,0)}
window.addEventListener("load",()=>{
  // botón ⚙️ arriba, junto al tema
  const t=$("#btnTema");if(t&&!$("#btnAj")){t.insertAdjacentHTML("afterend",'<button class="b" id="btnAj" title="Ajustes">⚙️</button>');$("#btnAj").onclick=()=>irAjustes("")}
  // las tarjetas de Datos se reconstruyen solas (p. ej. al conectar Dropbox): si estamos en Ajustes, se reordenan
  const vd=window.vDatos;if(typeof vd==="function"){window.vDatos=function(){const r=vd.apply(this,arguments);if(typeof MOD!=="undefined"&&MOD==="aj")reorganizarAjustes();return r}}
  const rn=window.render;window.render=function(){if(MOD==="aj"&&S){document.body.dataset.mod="aj";window.vDatos();return}if(MOD==="aj"&&!S)return;return rn.apply(this,arguments)};
  // en Finanzas › Datos, un aviso de que todo está también en Ajustes
  const vd2=window.vDatos;window.vDatos=function(){const r=vd2.apply(this,arguments);if(MOD==="fin"){const v=$("#view");if(v&&!$("#ajAviso"))v.insertAdjacentHTML("afterbegin",'<div class="card small" id="ajAviso">⚙️ Todos los ajustes (dispositivo, seguridad, respaldos, conexiones) están reunidos en <a href="#" id="ajIr">Ajustes</a>.</div>');if($("#ajIr"))$("#ajIr").onclick=e=>{e.preventDefault();irAjustes("")}}return r}
  const sm=window.irModulo;if(typeof sm==="function")window.irModulo=function(m){const r=sm.apply(this,arguments);const b=$("#btnAj");if(b)b.classList.toggle("p",m==="aj");return r};
});
