// =====================================================================================================
// Memphis · 🧪 PRUEBA DE RESPALDO: abre tu copia (la de Dropbox o un archivo .fmx que elijas) con tu clave, como lo haría
// un celular nuevo, SIN tocar lo que tienes abierto; compara cuántos registros trae y descifra una muestra de adjuntos.
// Memphis te lo recuerda cada mes en «Por atender».
// =====================================================================================================
"use strict";
MIGRAR_EXTRA.push(st=>{const r=st.respaldo&&typeof st.respaldo==="object"?st.respaldo:{};st.respaldo={ult:/^\d{4}-\d\d-\d\dT/.test(String(r.ult||""))?String(r.ult):"",ok:r.ok===true,nota:String(r.nota||"").slice(0,300)}});
CONFIG_EXTRA.push("respaldo");
const LISTAS_RESP=[["mov","💰 Movimientos"],["venc","⏰ Vencimientos"],["rec","🔁 Pagos fijos"],["diario","📓 Diario"],["salud","🩺 Salud"],["fichas","👤 Fichas"],["biblio","📚 Biblioteca"],["proy","🎯 Proyectos"],["ptar","☑️ Tareas de proyecto"],["bandeja","📥 Bandeja"]];
const diasDesde=iso=>iso?Math.floor((Date.now()-new Date(iso).getTime())/864e5):null;
function tarjetaRespaldo(){const R=S.respaldo||{},d=diasDesde(R.ult);return`<div class="card" id="rsCard"><h2>🧪 Prueba de respaldo</h2>
  <p class="small">Comprueba que tu copia de verdad se puede abrir: la descifra con tu clave como si fuera un dispositivo nuevo, cuenta los registros y abre una muestra de adjuntos. No cambia nada de lo que tienes.</p>
  <p class="small">${R.ult?`Última prueba: <b>${esc(tsBonito(R.ult))}</b> (hace ${d} día${d===1?"":"s"}) · ${R.ok?'<span class="ok">✓ bien</span>':'<span class="neg">⚠️ con problemas</span>'}${R.nota?" · "+esc(R.nota):""}`:'<span class="warn">Nunca la has hecho.</span>'}</p>
  <button class="b p" id="rsGo">🧪 Probar mi respaldo</button></div>`}
async function probarRespaldo(){dlg("🧪 Probar mi respaldo",`<p class="small">Escribe tu clave principal (no se guarda). ${conDropbox()?"Probaré la copia que está en tu Dropbox.":"Elige tu archivo .fmx de respaldo."}</p>
   <input type="password" id="rsK" placeholder="Clave principal de Memphis" autocomplete="current-password" style="width:100%"><div id="rsRes" class="small" style="margin-top:8px"></div>`,
  [["Cerrar","",cerrar],["Elegir archivo .fmx…","",()=>correr("archivo")],...(conDropbox()?[["Probar la copia de Dropbox","p",()=>correr("dropbox")]]:[])]);
  setTimeout(()=>$("#rsK").focus(),30);
  async function correr(origen){const k=$("#rsK").value;if(!k){alert("Escribe tu clave.");return}const out=$("#rsRes"),pinta=h=>out.innerHTML=h;let texto="";
    try{if(origen==="dropbox"){pinta("Descargando la copia de Dropbox…");const d=await dbxDown(DBX_RUTA);if(!d)throw new Error("No hay copia en Dropbox ("+DBX_RUTA+")");texto=dec.decode(d.bytes)}
      else{texto=await new Promise((ok,mal)=>{const i=document.createElement("input");i.type="file";i.accept=".fmx,application/json";i.onchange=async()=>{if(!i.files[0])return mal(new Error("No elegiste archivo"));ok(await i.files[0].text())};i.click()})}
      pinta("Descifrando con tu clave…");const kek0=CR.kek,salt0=CR.salt;let st;try{st=await abrirSobre(texto,k)}finally{CR.kek=kek0;CR.salt=salt0}
      try{migrar(st)}catch(e){}
      const filas=LISTAS_RESP.map(([k,l])=>{const a=(S[k]||[]).length,b=(st[k]||[]).length;return[l,a,b]}).filter(([,a,b])=>a||b);
      const difs=filas.filter(([,a,b])=>a!==b);pinta(`<p>✓ La copia se abrió con tu clave.</p><table class="rstab"><tr><th></th><th>Aquí</th><th>En la copia</th></tr>${filas.map(([l,a,b])=>`<tr><td>${l}</td><td>${a}</td><td class="${a!==b?"warn":""}">${b}</td></tr>`).join("")}</table><p id="rsAdj">Revisando adjuntos…</p>`);
      // muestra de adjuntos de la copia: se bajan y se descifran de verdad
      const A=[];const recorre=o=>{if(!o||typeof o!=="object")return;if(Array.isArray(o)){o.forEach(recorre);return}if(o.sha&&o.ruta&&o.tipo!=="enlace")A.push(o);else for(const v of Object.values(o))if(v&&typeof v==="object")recorre(v)};for(const [k] of LISTAS_RESP)recorre(st[k]);
      const vistos=new Set(),U=A.filter(a=>!vistos.has(a.sha)&&vistos.add(a.sha)),M=U.sort(()=>Math.random()-.5).slice(0,8);let okA=0,malA=[];
      for(const a of M){try{let b=null;if(conDropbox()){const d=await dbxDown("/"+a.ruta);b=d&&d.bytes}else{const c=await DB.get("adj:"+a.sha);b=c}if(!b)throw new Error("no está");const p=await descifrarAdj(b,a.sha);if(await sha256(p)!==a.sha)throw new Error("alterado");okA++}catch(e){malA.push((a.original||a.nombre||a.sha.slice(0,8))+": "+e.message)}}
      let cur="";if(S.cursosK&&conDropbox()&&typeof RUTA_CUR!=="undefined"){try{const d=await dbxDown(RUTA_CUR);cur=d?"✓ El archivo de Cursos está en Dropbox.":"⚠️ No encontré el archivo de Cursos en Dropbox."}catch(e){cur="⚠️ Cursos: "+e.message}}
      const okTodo=!malA.length&&!cur.startsWith("⚠️");
      $("#rsAdj").innerHTML=`${U.length?`Adjuntos: ${U.length} en la copia · muestra de ${M.length}: <b>${okA} abren bien</b>${malA.length?`<br><span class="neg">${malA.map(esc).join("<br>")}</span>`:""}`:"La copia no tiene adjuntos."}${cur?"<br>"+cur:""}
        ${difs.length?`<br><span class="muted">Las diferencias en los conteos suelen ser cambios recientes que aún no se han subido; toca ⟳ y vuelve a probar si quieres.</span>`:""}<p><b>${okTodo?"✅ Tu respaldo se puede restaurar.":"⚠️ Revisa lo marcado."}</b></p>`;
      S.respaldo={ult:new Date().toISOString(),ok:okTodo,nota:`${origen==="dropbox"?"Dropbox":"archivo"} · ${U.length} adjuntos, ${okA}/${M.length} verificados`};changed();if($("#rsCard"))$("#rsCard").outerHTML=tarjetaRespaldo(),bindRs()}
    catch(e){pinta(`<p class="neg">❌ ${esc(e.message)}</p>`);S.respaldo={ult:new Date().toISOString(),ok:false,nota:e.message.slice(0,200)};changed()}}}
function bindRs(){const b=$("#rsGo");if(b)b.onclick=probarRespaldo}
window.addEventListener("load",()=>{
  const vd=window.vDatos;if(typeof vd==="function")window.vDatos=function(){const r=vd.apply(this,arguments);const v=$("#view");if(v&&S&&!$("#rsCard")){const ref=[...v.querySelectorAll(".card h2")].find(h=>/Respaldos y papelera/.test(h.textContent));if(ref)ref.closest(".card").insertAdjacentHTML("beforebegin",tarjetaRespaldo());else v.insertAdjacentHTML("beforeend",tarjetaRespaldo());bindRs()}return r};
  // recordatorio mensual en Inicio › Por atender
  const pa=window.porAtenderHtml;if(typeof pa==="function")window.porAtenderHtml=function(){let h=pa.apply(this,arguments);const R=S.respaldo||{},d=diasDesde(R.ult);if(d===null||d>30||R.ok===false){const fila=`<div class="vrow click" id="rsIni">🧪 <span style="flex:1">Prueba de respaldo${d===null?" (nunca)":R.ok===false?" (falló)":` (hace ${d} días)`}</span><b>›</b></div>`;h=h.replace('<p class="small muted">Todo al día ✔</p>',"").replace(/<\/div>$/,fila+"</div>")}return h};
  const bi=window.bindInicio;if(typeof bi==="function")window.bindInicio=function(){const r=bi.apply(this,arguments);const e=$("#rsIni");if(e)e.onclick=probarRespaldo;return r};
});
