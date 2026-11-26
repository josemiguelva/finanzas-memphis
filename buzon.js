// =====================================================================================================
// Memphis · BUZONES: un familiar anota sus gastos en «Mis gastos» (gastos.html) y te los envía cifrados.
// Aquí se crean las invitaciones (clave AES-256 por persona, guardada solo dentro de tus datos cifrados)
// y se abren los paquetes que llegan por la bandeja (compartir, Telegram, pegar, archivo).
// =====================================================================================================
"use strict";
const PREF_BZ="MEMPHIS-GASTOS1.";
MIGRAR_EXTRA.push(st=>{st.buzones=(Array.isArray(st.buzones)?st.buzones:[]).filter(x=>x&&/^[\w-]{6,40}$/.test(String(x.id))&&typeof x.k==="string").map(x=>{let ok=false;try{ok=b64u8(x.k).length===32}catch(e){}return ok?{id:String(x.id),k:x.k,nombre:String(x.nombre||"").slice(0,60),cuentas:(Array.isArray(x.cuentas)?x.cuentas:[]).map(c=>String(c).slice(0,120)).filter(Boolean).slice(0,20),pagador:["fam","yo","ext"].includes(x.pagador)?x.pagador:"fam",creado:String(x.creado||""),ult:String(x.ult||""),activo:x.activo!==false}:null}).filter(Boolean)});
CONFIG_EXTRA.push("buzones");
const enlaceBuzon=bz=>{const cats=[...new Set(S.mov.filter(m=>quien(m)===bz.pagador||!bz.pagador).map(m=>m.categoria).filter(Boolean))].slice(0,40);
  const cnt={};for(const m of S.mov)if(bz.cuentas.includes(m.cuenta)&&m.estab)cnt[m.estab]=(cnt[m.estab]||0)+1;const est=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,120).map(x=>x[0]);
  const de=((S.fichas||[]).find(f=>f.tipo==="persona"&&f.datos&&f.datos.rel==="yo")||{}).nombre||"";
  const o={b:bz.id,k:bz.k,n:bz.nombre,de:de.split(" ")[0],c:bz.cuentas,cat:cats,est};
  return location.origin+location.pathname.replace(/[^/]*$/,"")+"gastos.html#i="+b64url(enc.encode(JSON.stringify(o)))};
async function abrirPaqueteBz(txt){const m=String(txt||"").match(/MEMPHIS-GASTOS1\.([\w-]{6,40})\.([\w-]+)/);if(!m)return null;const bz=(S.buzones||[]).find(x=>x.id===m[1]);
  if(!bz)throw new Error("Llegó un paquete de «Mis gastos» de una invitación que no está en esta Memphis.");if(!bz.activo)throw new Error(`La invitación de ${bz.nombre} está desactivada; no se importó.`);
  const u=deB64urlBz(m[2]);const key=await crypto.subtle.importKey("raw",b64u8(bz.k),"AES-GCM",false,["decrypt"]);let o;
  try{o=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:u.slice(0,12),additionalData:enc.encode(bz.id)},key,u.slice(12))))}catch(e){throw new Error("El paquete de gastos está dañado o no es de esta invitación.")}
  return{bz,o}}
const deB64urlBz=s=>b64u8(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4));
async function importarBz(txt,{silencio}={}){const r=await abrirPaqueteBz(txt);if(!r)return null;const {bz,o}=r,ah=new Date().toISOString();let nuevos=0,cambios=0,borr=0;const borrados=new Set((S.eliminados||[]).map(x=>x.id));
  for(const g of (Array.isArray(o.g)?o.g:[]).slice(0,2000)){if(!/^[\da-f]{8,40}$/.test(String(g.id)))continue;const id="bz_"+g.id,m0=S.mov.find(x=>x.id===id);
    if(g.borrado){if(m0&&!/borr/.test(m0.revisar||"")){m0.revisar=`${bz.nombre} lo borró en su app: revisa si lo eliminas`;m0.editado=ah;borr++}continue}
    if(!m0&&borrados.has(id))continue;if(m0&&(+m0.bzv||0)>=(+g.ver||1))continue;
    const v=Math.max(0,Math.round(+g.valor||0)),fecha=/^\d{4}-\d{2}-\d{2}$/.test(String(g.fecha))?g.fecha:hoyISO(),cuenta=String(g.cuenta||bz.cuentas[0]||"Efectivo").slice(0,120);
    const adj=m0?(m0.adjuntos||[]):[];if(g.foto&&/^data:image\/jpeg;base64,[\w+/=]+$/.test(g.foto)&&!adj.length){try{const b=b64u8(g.foto.split(",")[1]);adj.push(await adjDeArchivo(new File([b],`factura_${fecha}.jpg`,{type:"image/jpeg"}),fecha))}catch(e){}}
    const m=Object.assign(m0||{id,origen:"buzon",conciliacion:"",desc:"",concepto:""},{fecha,hora:/^([01]\d|2[0-3]):[0-5]\d$/.test(String(g.hora||""))?g.hora:undefined,valor:v,cuenta,estab:normalizarComercio(String(g.estab||"").slice(0,120)),categoria:String(g.cat||"").slice(0,80),
      nota:[`Enviado por ${bz.nombre}`,String(g.nota||"").slice(0,500)].filter(Boolean).join(" · "),pagador:bz.pagador,revisar:`Enviado por ${bz.nombre}: revísalo`,adjuntos:adj,bzv:+g.ver||1,editado:ah});
    if(!m.hora)delete m.hora;m.tipo=tipoParaCuenta(m.cuenta,"Gasto débito",m.pagador);if(!S.cuentas.includes(m.cuenta))S.cuentas.push(m.cuenta);
    if(m0)cambios++;else{S.mov.push(m);nuevos++}}
  bz.ult=ah;changed();const t=[nuevos&&`${nuevos} nuevo${nuevos>1?"s":""}`,cambios&&`${cambios} actualizado${cambios>1?"s":""}`,borr&&`${borr} que borró`].filter(Boolean).join(", ")||"nada nuevo (ya estaban)";
  if(!silencio)aviso(`💳 Gastos de ${bz.nombre}: ${t}. Quedan en «Por revisar».`);return{nuevos,cambios,borr,bz}}
function buzonesCard(){const L=S.buzones||[];
  return`<div class="card" id="bzCard"><h2>💳 App «Mis gastos» para la familia</h2><p class="small muted">Una persona de tu familia anota sus gastos en su celular y te los envía cifrados por WhatsApp, Telegram o correo. Ella no ve nada de tu Memphis. Cuando te llegue el archivo, compártelo con Memphis o pégalo en la 📥 bandeja.</p>
   ${L.map(b=>`<div class="vrow"><span style="flex:1">👤 <b>${esc(b.nombre)}</b> <span class="small muted">${esc(b.cuentas.join(", "))}${b.ult?" · último envío "+esc(b.ult.slice(0,10)):""}${b.activo?"":" · desactivada"}</span></span><button class="b s" data-bzl="${esc(b.id)}">🔗 Invitación</button><button class="b s" data-bzx="${esc(b.id)}">${b.activo?"Desactivar":"Activar"}</button></div>`).join("")}
   <div class="filters"><button class="b s p" id="bzN">+ Invitar a alguien</button><button class="b s" id="bzP">📋 Pegar un paquete</button></div></div>`}
function bindBuzones(){if(!$("#bzCard"))return;
  $("#bzN").onclick=()=>{const fam=famNombre(),cu=[...new Set(Object.entries((S.familia||{}).cuentas||{}).filter(([,v])=>v==="fam").map(([k])=>k))];
    dlg("💳 Invitar a «Mis gastos»",`<label>Nombre</label><input id="bzNo" value="${esc(fam!=="Familia"?fam:"")}" style="width:100%"><label>Cuentas o medios con que paga (separados por coma; el primero es el de siempre)</label><input id="bzCu" value="${esc([...cu,"Efectivo"].join(", "))}" style="width:100%">
     <label>Sus gastos cuentan como</label><select id="bzPg"><option value="fam">De la familia (${esc(fam)})</option><option value="yo">Míos</option><option value="ext">De otra persona (no cuentan)</option></select>`,
     [["Cancelar","",cerrar],["Crear","p",()=>{const n=$("#bzNo").value.trim();if(!n){alert("Escribe el nombre");return}const bz={id:b64url(crypto.getRandomValues(new Uint8Array(9))),k:u8b64(crypto.getRandomValues(new Uint8Array(32))),nombre:n,cuentas:$("#bzCu").value.split(",").map(x=>x.trim()).filter(Boolean),pagador:$("#bzPg").value,creado:new Date().toISOString(),ult:"",activo:true};
       (S.buzones=S.buzones||[]).push(bz);changed();cerrar();render();setTimeout(()=>verInvitacion(bz),50)}]])};
  document.querySelectorAll("[data-bzl]").forEach(b=>b.onclick=()=>verInvitacion(S.buzones.find(x=>x.id===b.dataset.bzl)));
  document.querySelectorAll("[data-bzx]").forEach(b=>b.onclick=()=>{const x=S.buzones.find(y=>y.id===b.dataset.bzx);x.activo=!x.activo;changed();render()});
  $("#bzP").onclick=()=>{dlg("📋 Pegar paquete de gastos",`<textarea id="bzTx" rows="6" style="width:100%" placeholder="MEMPHIS-GASTOS1.…"></textarea>`,[["Cancelar","",cerrar],["Importar","p",async()=>{try{const r=await importarBz($("#bzTx").value);if(!r)alert("Eso no parece un paquete de «Mis gastos».");else{cerrar();render()}}catch(e){alert(e.message)}}]])}}
function verInvitacion(bz){if(!bz)return;const u=enlaceBuzon(bz);
  dlg(`🔗 Invitación de ${bz.nombre}`,`<p class="small">Envíale este enlace a <b>${esc(bz.nombre)}</b> (solo a ella). Al abrirlo en su celular queda lista su app; puede «Agregar a la pantalla de inicio».</p>
   <textarea readonly rows="4" style="width:100%;font-size:.75rem">${esc(u)}</textarea>
   <p class="small muted">⚠️ El enlace lleva la clave de su buzón: quien lo tenga puede <i>enviarte</i> gastos a su nombre (nunca leer tu Memphis). Si se filtra, desactiva esta invitación y crea otra.</p>`,
   [["Cerrar","",cerrar],["📋 Copiar","",async()=>{try{await navigator.clipboard.writeText(u);aviso("Copiado")}catch(e){}}],["💬 WhatsApp","p",()=>window.open("https://wa.me/?text="+encodeURIComponent(`Tu app para anotar gastos de la casa (ábrela en tu celular): ${u}`),"_blank","noopener,noreferrer")]])}
window.addEventListener("load",()=>{
  // la bandeja recibe todo (compartir, Telegram, pegar, archivo): si es un paquete de «Mis gastos», se importa en vez de guardarse
  const ab=window.aBandeja;if(typeof ab==="function")window.aBandeja=async function(o){try{let txt=String((o&&o.texto)||"")+" "+String((o&&o.titulo)||"");
      if(!txt.includes(PREF_BZ))for(const f of (o&&o.files)||[])if(f.size<30*1048576&&(/^text\/plain/.test(f.type)||/\.txt$/i.test(f.name||""))){const t=await f.text();if(t.startsWith(PREF_BZ)){txt=t;break}}
      if(txt.includes(PREF_BZ)){const r=await importarBz(txt);if(r)return null}}catch(e){aviso("💳 "+e.message);return null}return ab.apply(this,arguments)};
  const vd=window.vDatos;if(typeof vd==="function")window.vDatos=function(){const r=vd.apply(this,arguments);const v=$("#view");if(v&&S&&!$("#bzCard")){v.insertAdjacentHTML("beforeend",buzonesCard());bindBuzones()}return r};
});
