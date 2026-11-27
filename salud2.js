// =====================================================================================================
// Memphis · SALUD AMPLIADA: 🌸 ciclo menstrual (registro diario, predicción con tu historial, ventana fértil,
// retrasos, embarazo y menopausia), 🔒 registro íntimo (cifrado con tu PIN: ni la fecha queda a la vista),
// 🍽 comidas (calorías y proteína aproximadas con una tabla editable), 🌿 bienestar diario y ✅ chequeos preventivos.
// Todo vive cifrado en tus datos. Nada de esto va al archivo de sincronización sin cifrar ni a la búsqueda.
// =====================================================================================================
"use strict";
const SX={vista:"",mes:"",dia:"",cDia:""};
const ID_SX=/^[\w-]{3,40}$/,F_SX=/^\d{4}-\d\d-\d\d$/,H_SX=/^\d\d:\d\d$/;
const sS=(v,n)=>String(v??"").slice(0,n);const nS=(v,a,b)=>{const x=+v;return Number.isFinite(x)?Math.min(b,Math.max(a,x)):null};
const nuevoId=()=>uid();const ahoraISO=()=>new Date().toISOString();
const SANGRADO=[["","Nada"],["manchado","Manchado"],["leve","Leve"],["moderado","Moderado"],["abundante","Abundante"]];
const SINT_CICLO=["Cólicos","Dolor lumbar","Dolor de cabeza","Hinchazón","Senos sensibles","Náuseas","Cansancio","Acné","Antojos","Irritabilidad","Tristeza","Ansiedad","Cambios de ánimo","Insomnio","Flujo","Diarrea","Estreñimiento","Sofocos","Sudoración nocturna","Sequedad íntima","Libido alta","Libido baja"];
const INTENS=["","leve","moderado","fuerte"];
// ---------------------------------------------------------------- normalización y sincronización
MIGRAR_EXTRA.push(st=>{
  st.ciclo=(Array.isArray(st.ciclo)?st.ciclo:[]).filter(e=>e&&ID_SX.test(String(e.id))&&F_SX.test(String(e.fecha))).map(e=>{const o={id:String(e.id),fecha:String(e.fecha),sangrado:SANGRADO.some(x=>x[0]===e.sangrado)?e.sangrado:"",sint:{},alivio:sS(e.alivio,300),nota:sS(e.nota,2000),creado:sS(e.creado,30)||ahoraISO(),editado:sS(e.editado,30)};
    if(e.sint&&typeof e.sint==="object")for(const [k,v] of Object.entries(e.sint).slice(0,40)){const n=nS(v,1,3);if(n&&k.length<=40)o.sint[sS(k,40)]=n}return o});
  st.intimo=(Array.isArray(st.intimo)?st.intimo:[]).filter(e=>e&&ID_SX.test(String(e.id))&&typeof e.iv==="string"&&typeof e.ct==="string").map(e=>({id:String(e.id),iv:sS(e.iv,40),ct:sS(e.ct,200000),creado:sS(e.creado,30),editado:sS(e.editado,30)}));
  st.comidas=(Array.isArray(st.comidas)?st.comidas:[]).filter(e=>e&&ID_SX.test(String(e.id))&&F_SX.test(String(e.fecha))).map(e=>({id:String(e.id),fecha:String(e.fecha),hora:H_SX.test(e.hora||"")?e.hora:"",tiempo:sS(e.tiempo,20),plato:sS(e.plato,300),tam:["p","m","g","d"].includes(e.tam)?e.tam:"m",kcal:nS(e.kcal,0,9000)??0,prot:nS(e.prot,0,600)??0,grupos:Array.isArray(e.grupos)?e.grupos.filter(g=>typeof g==="string").slice(0,8):[],manual:e.manual===true,nota:sS(e.nota,500),creado:sS(e.creado,30)||ahoraISO(),editado:sS(e.editado,30)}));
  st.bienestar=(Array.isArray(st.bienestar)?st.bienestar:[]).filter(e=>e&&ID_SX.test(String(e.id))&&F_SX.test(String(e.fecha))).map(e=>{const o={id:String(e.id),fecha:String(e.fecha),creado:sS(e.creado,30)||ahoraISO(),editado:sS(e.editado,30),nota:sS(e.nota,1000),ejTipo:sS(e.ejTipo,60)};
    for(const k of ["animo","energia","suenoCal","estres"]){const n=nS(e[k],1,5);if(n)o[k]=n}for(const [k,a,b] of [["sueno",0,24],["ejercicio",0,600],["agua",0,30]]){const n=nS(e[k],a,b);if(n!=null&&e[k]!=="")o[k]=n}return o});
  st.chequeos=(Array.isArray(st.chequeos)?st.chequeos:[]).filter(e=>e&&ID_SX.test(String(e.id))&&e.nombre).map(e=>({id:String(e.id),nombre:sS(e.nombre,80),cada:nS(e.cada,0,120)||12,ultima:F_SX.test(e.ultima||"")?e.ultima:"",proxima:F_SX.test(e.proxima||"")?e.proxima:"",nota:sS(e.nota,500),creado:sS(e.creado,30)||ahoraISO(),editado:sS(e.editado,30)}));
  st.alimentos=(Array.isArray(st.alimentos)?st.alimentos:[]).filter(a=>a&&a.nombre).map(a=>({id:ID_SX.test(String(a.id||""))?String(a.id):nuevoId(),nombre:sS(a.nombre,60),grupo:sS(a.grupo,12)||"mixto",por:sS(a.por,40),kcal:nS(a.kcal,0,5000)||0,prot:nS(a.prot,0,300)||0})).slice(0,500);
  const c=st.cicloCfg&&typeof st.cicloCfg==="object"?st.cicloCfg:{};st.cicloCfg={on:c.on===true,modo:["ciclo","embarazo","menopausia"].includes(c.modo)?c.modo:"ciclo",durPer:nS(c.durPer,1,15)||5,durCiclo:nS(c.durCiclo,18,60)||28,
    hist:(Array.isArray(c.hist)?c.hist:[]).filter(f=>F_SX.test(String(f))).slice(0,24),avisoDias:nS(c.avisoDias,0,10)??2,avisos:c.avisos!==false,pastilla:H_SX.test(c.pastilla||"")?c.pastilla:"",fum:F_SX.test(c.fum||"")?c.fum:""};
  const m=st.comidaCfg&&typeof st.comidaCfg==="object"?st.comidaCfg:{};st.comidaCfg={kcal:nS(m.kcal,0,8000)||0,prot:nS(m.prot,0,400)||0,agua:nS(m.agua,0,30)||0};
  if(st.intimoCfg&&typeof st.intimoCfg==="object")st.intimoCfg={iv:sS(st.intimoCfg.iv,40),ct:sS(st.intimoCfg.ct,20000)};else delete st.intimoCfg});
const hfX=e=>JSON.stringify(e);
for(const [k,b] of [["ciclo","_baseCi"],["intimo","_baseIn"],["comidas","_baseCo"],["bienestar","_baseBi"],["chequeos","_baseCh"],["alimentos","_baseAl"]])LISTAS_EXTRA.push({k,base:b,hf:hfX,ord:(x,y)=>String(x.fecha||x.creado||x.id).localeCompare(String(y.fecha||y.creado||y.id))});
CONFIG_EXTRA.push("cicloCfg","comidaCfg","intimoCfg");
function borrarX(col,id,etq){const L=S[col]||[],o=L.find(x=>x.id===id);if(!o)return;S[col]=L.filter(x=>x!==o);(S.eliminados=S.eliminados||[]).push({id,fecha:ahoraISO()});if(col!=="intimo")aPapelera(col,o);changed();render();
  deshacer(etq+" borrado",()=>{S[col].push(o);S.eliminados=S.eliminados.filter(x=>x.id!==id);changed();render()})}
const dEntre=(a,b)=>Math.round((dDe(b)-dDe(a))/864e5);
const fCorta=f=>{const d=dDe(f);return d.toLocaleDateString("es-CO",{day:"numeric",month:"short"})};

// =====================================================================================================
// 🌸 CICLO
// =====================================================================================================
const esPeriodo=e=>e&&["leve","moderado","abundante"].includes(e.sangrado);
function iniciosCiclo(){const cfg=S.cicloCfg||{},dias=new Set((S.ciclo||[]).filter(esPeriodo).map(e=>e.fecha)),ini=new Set(cfg.hist||[]);
  for(const f of dias){let nuevo=true;for(let k=1;k<=3;k++)if(dias.has(masDias(f,-k))){nuevo=false;break}if(nuevo){for(const h of cfg.hist||[])if(Math.abs(dEntre(h,f))<=3){nuevo=false;break}}if(nuevo)ini.add(f)}
  return[...ini].sort()}
function duracionesPeriodo(){const dias=new Set((S.ciclo||[]).filter(esPeriodo).map(e=>e.fecha)),D=[];for(const i of iniciosCiclo()){if(!dias.has(i))continue;let n=0;while(dias.has(masDias(i,n))||dias.has(masDias(i,n+1))&&n<12)n++;if(masDias(i,n)>=masDias(hoyISO(),-1))continue;if(n>=1&&n<=12)D.push(n)}return D}
function prediccion(){const cfg=S.cicloCfg||{},I=iniciosCiclo(),hoy=hoyISO();const L=[];for(let i=1;i<I.length;i++){const d=dEntre(I[i-1],I[i]);if(d>=15&&d<=60)L.push(d)}
  const ult=L.slice(-6),prom=ult.length?ult.reduce((a,b)=>a+b,0)/ult.length:cfg.durCiclo||28,sd=ult.length>1?Math.sqrt(ult.reduce((a,b)=>a+(b-prom)**2,0)/(ult.length-1)):0;
  const DP=duracionesPeriodo().slice(-6),durP=DP.length?Math.round(DP.reduce((a,b)=>a+b,0)/DP.length):cfg.durPer||5;
  const last=I[I.length-1]||"";if(!last)return{I,L,prom,sd,durP,sinDatos:true};
  let prox=masDias(last,Math.round(prom));while(dEntre(prox,hoy)>Math.round(prom))prox=masDias(prox,Math.round(prom));
  const marg=Math.max(2,Math.round(sd)),desde=masDias(prox,-marg),hasta=masDias(prox,marg),ovu=masDias(prox,-14),fd=masDias(ovu,-5),fh=masDias(ovu,1);
  const diaCiclo=dEntre(last,hoy)+1,retraso=hoy>hasta?dEntre(hasta,hoy):0;
  const irregular=ult.length>=3&&(sd>5||Math.max(...ult)-Math.min(...ult)>9);
  const fase=diaCiclo<=durP?"menstrual":hoy<fd?"folicular":hoy<=fh?"fértil (ovulación estimada)":"lútea";
  return{I,L:ult,prom,sd,durP,last,prox,desde,hasta,ovu,fd,fh,diaCiclo,retraso,irregular,fase}}
function faseDe(f){const p=prediccion();if(p.sinDatos)return"";const I=p.I.filter(i=>i<=f),u=I[I.length-1];if(!u)return"";const d=dEntre(u,f)+1,lon=Math.round(p.prom);
  if(d>lon+10)return"";const ovu=lon-14+1;return d<=p.durP?"menstrual (día "+d+")":d<ovu-5?"folicular (día "+d+")":d<=ovu+1?"fértil (día "+d+")":"lútea (día "+d+")"}
const cicloDia=f=>(S.ciclo||[]).find(e=>e.fecha===f);
function vCiclo(){const cfg=S.cicloCfg;if(!cfg.on)return vCicloActivar();if(cfg.modo==="embarazo")return vEmbarazo()+vCicloCal(null)+vCicloSint();
  const p=prediccion(),hoy=hoyISO();let h=`<div class="card ciclo-top"><div class="filters" style="justify-content:space-between;align-items:flex-start"><div>`;
  if(p.sinDatos)h+=`<h2 style="margin:0">🌸 Aún no hay períodos registrados</h2><p class="small">Toca «Me llegó hoy» cuando empiece, o agrega fechas anteriores en ⚙.</p>`;
  else h+=`<h2 style="margin:0">🌸 Día ${p.diaCiclo} del ciclo <span class="small muted">· fase ${esc(p.fase)}</span></h2>
    <p style="margin:6px 0">Próximo período: <b>${p.desde===p.hasta?fCorta(p.prox):"entre el "+fCorta(p.desde)+" y el "+fCorta(p.hasta)}</b>${p.prox>=hoy?` <span class="small muted">(en ${dEntre(hoy,p.prox)} días)</span>`:""}</p>
    ${cfg.modo==="ciclo"?`<p class="small" style="margin:0">Ventana fértil estimada: ${fCorta(p.fd)} – ${fCorta(p.fh)} · ovulación hacia el ${fCorta(p.ovu)}</p>`:""}
    ${p.retraso?`<p class="neg" style="margin:6px 0 0"><b>⏳ Retraso de ${p.retraso} día${p.retraso>1?"s":""}</b> respecto a lo esperado.</p>`:""}
    ${p.irregular?`<p class="small warn" style="margin:6px 0 0">Tus últimos ciclos varían bastante (${Math.min(...p.L)} a ${Math.max(...p.L)} días). Vale la pena comentarlo con tu médica.</p>`:""}`;
  h+=`</div><div class="filters"><button class="b p" id="ciHoy">🩸 Me llegó hoy</button><button class="b" id="ciReg">📝 Registrar hoy</button><button class="b s" id="ciCfg" title="Ajustes del ciclo">⚙</button></div></div>
   <p class="small muted" style="margin:6px 0 0">Son estimaciones con tu historial: <b>no sirven como método anticonceptivo</b> ni reemplazan a tu médica.</p></div>`;
  return h+vCicloCal(p)+vCicloStats(p)+vCicloSint()}
function vCicloCal(p){const hoy=hoyISO(),m=SX.mes||hoy.slice(0,7),d0=m+"-01",dow=(dDe(d0).getDay()+6)%7,n=new Date(+m.slice(0,4),+m.slice(5,7),0).getDate();
  const pred=new Set(),fert=new Set();if(p&&!p.sinDatos){for(let k=0;k<3;k++){const pr=masDias(p.prox,Math.round(p.prom)*k),dd=Math.max(2,Math.round(p.sd));for(let i=-0;i<p.durP;i++)pred.add(masDias(pr,i));
    if(S.cicloCfg.modo==="ciclo"){const o=masDias(pr,-14);for(let i=-5;i<=1;i++)fert.add(masDias(o,i))}void dd}}
  let c="";for(let i=0;i<dow;i++)c+="<span></span>";for(let d=1;d<=n;d++){const f=m+"-"+String(d).padStart(2,"0"),e=cicloDia(f),cls=[esPeriodo(e)?"per "+e.sangrado:e&&e.sangrado==="manchado"?"man":"",!esPeriodo(e)&&pred.has(f)&&f>=hoy?"pred":"",fert.has(f)?"fert":"",f===hoy?"hoy":"",e&&Object.keys(e.sint||{}).length?"sin":""].join(" ");
    c+=`<button class="cd ${cls}" data-cdia="${f}" title="${esc(fechaLarga(f))}">${d}</button>`}
  let mm=dDe(d0).toLocaleDateString("es-CO",{month:"long",year:"numeric"});mm=mm[0].toUpperCase()+mm.slice(1);
  return`<div class="card"><div class="filters" style="justify-content:space-between"><button class="b s" data-cmes="-1">‹</button><b>${esc(mm)}</b><button class="b s" data-cmes="1">›</button></div>
   <div class="cical"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>${c}</div>
   <div class="small cileg"><span class="cd per moderado">1</span> período <span class="cd pred">1</span> esperado ${S.cicloCfg.modo==="ciclo"?'<span class="cd fert">1</span> fértil':""} <span class="cd sin">1</span> con síntomas · toca un día para registrarlo</div></div>`}
function vCicloStats(p){if(p.sinDatos)return"";return`<div class="card"><h2>📈 Tu historial</h2><div class="ajg">
   <div><b>${Math.round(p.prom)} días</b><div class="small muted">ciclo promedio${p.L.length?` (${p.L.length} ciclo${p.L.length>1?"s":""})`:" (dato que diste)"}</div></div><div><b>${p.durP} días</b><div class="small muted">duración del período</div></div>
   ${p.L.length>1?`<div><b>± ${Math.round(p.sd)} días</b><div class="small muted">variación</div></div>`:""}</div>
   ${p.L.length?`<div class="cibar">${p.I.slice(-7).map((f,i,A)=>i?`<div title="${fCorta(A[i-1])} → ${fCorta(f)}"><span style="height:${Math.min(100,dEntre(A[i-1],f)/45*100)}%"></span><small>${dEntre(A[i-1],f)}</small></div>`:"").join("")}</div>`:""}
   <p class="small muted">Inicios registrados: ${p.I.slice(-8).map(fCorta).join(" · ")}</p></div>`}
function vCicloSint(){const N={};let dias=0;for(const e of (S.ciclo||[]).filter(e=>e.fecha>=masDias(hoyISO(),-180))){const k=Object.keys(e.sint||{});if(k.length)dias++;for(const s of k){N[s]=N[s]||{n:0,f:0};N[s].n++;if(e.sint[s]===3)N[s].f++}}
  const L=Object.entries(N).sort((a,b)=>b[1].n-a[1].n).slice(0,8);if(!L.length)return"";
  return`<div class="card"><h2>🩹 Molestias más frecuentes <span class="small muted">(6 meses)</span></h2>${L.map(([s,v])=>`<div class="vrow small"><span style="flex:1">${esc(s)}</span><span>${v.n} día${v.n>1?"s":""}${v.f?` · <span class="neg">${v.f} fuerte${v.f>1?"s":""}</span>`:""}</span></div>`).join("")}</div>`}
function vCicloActivar(){return`<div class="card"><h2>🌸 Ciclo menstrual</h2><p>Registra tus días de período y tus molestias; Memphis calcula tu ciclo promedio, el próximo período, la ventana fértil y te avisa por Telegram unos días antes.</p>
  <p class="small muted">Para empezar con buenas predicciones, dime cuándo empezaron tus últimos períodos (los que recuerdes, idealmente 3 a 6).</p><button class="b p" id="ciAct">Activar y configurar</button></div>`}
function vEmbarazo(){const f=S.cicloCfg.fum;if(!f)return`<div class="card"><h2>🤰 Embarazo</h2><p class="small">Escribe la fecha de tu última menstruación (FUM) en ⚙ para calcular semanas y fecha probable de parto.</p><button class="b s" id="ciCfg">⚙ Ajustes</button></div>`;
  const d=dEntre(f,hoyISO()),sem=Math.floor(d/7),dd=d%7,fpp=masDias(f,280),tri=sem<14?1:sem<28?2:3;
  return`<div class="card"><h2>🤰 Semana ${sem} + ${dd} días <span class="small muted">· trimestre ${tri}</span></h2><p>Fecha probable de parto: <b>${esc(fechaLarga(fpp))}</b> (en ${Math.max(0,dEntre(hoyISO(),fpp))} días)</p>
   <div class="filters"><button class="b" id="ciReg">📝 Registrar síntomas de hoy</button><button class="b s" id="ciCfg">⚙</button></div><p class="small muted">Los controles prenatales regístralos como citas en Salud para tener la historia completa.</p></div>`}
function editarCicloDia(f){const e0=cicloDia(f),e=e0?structuredClone(e0):{id:nuevoId(),fecha:f,sangrado:"",sint:{},alivio:"",nota:""};const fs=faseDe(f);
  const chip=s=>{const v=e.sint[s]||0;return`<button type="button" class="sch i${v}" data-sch="${esc(s)}">${esc(s)}${v?` · ${INTENS[v]}`:""}</button>`};
  dlg("🌸 "+fechaLarga(f),`${fs?`<p class="small muted">Fase estimada: ${esc(fs)}</p>`:""}<label>Sangrado</label><div class="opc">${SANGRADO.map(([k,l])=>`<button type="button" class="b s ${e.sangrado===k?"p":""}" data-csa="${k}">${k?"🩸 ":""}${l}</button>`).join("")}</div>
   <label style="margin-top:8px">Molestias <span class="small muted">(toca para subir la intensidad: leve → moderado → fuerte → quitar)</span></label><div class="schs">${SINT_CICLO.map(chip).join("")}</div>
   <label style="margin-top:8px">¿Qué tomaste o hiciste para aliviarlo?</label><input id="ciAl" value="${esc(e.alivio)}" placeholder="Ej.: ibuprofeno 400 mg, bolsa de agua caliente">
   <label>Nota</label><textarea id="ciNo" rows="2">${esc(e.nota)}</textarea>`,[...(e0?[["Borrar","",()=>{cerrar();borrarX("ciclo",e0.id,"Registro del ciclo")}]]:[]),["Cancelar","",cerrar],["Guardar","p",()=>{e.alivio=$("#ciAl").value.trim().slice(0,300);e.nota=$("#ciNo").value.trim().slice(0,2000);
     const vacio=!e.sangrado&&!Object.keys(e.sint).length&&!e.alivio&&!e.nota;e.editado=ahoraISO();S.ciclo=S.ciclo||[];
     if(e0){const i=S.ciclo.findIndex(x=>x.id===e0.id);if(vacio){S.ciclo.splice(i,1);(S.eliminados=S.eliminados||[]).push({id:e0.id,fecha:ahoraISO()})}else S.ciclo[i]=e}else if(!vacio){e.creado=ahoraISO();S.ciclo.push(e)}changed();cerrar();render()}]]);
  document.querySelectorAll("[data-csa]").forEach(b=>b.onclick=()=>{e.sangrado=b.dataset.csa;document.querySelectorAll("[data-csa]").forEach(x=>x.classList.toggle("p",x===b))});
  document.querySelectorAll("[data-sch]").forEach(b=>b.onclick=()=>{const s=b.dataset.sch,v=((e.sint[s]||0)+1)%4;if(v)e.sint[s]=v;else delete e.sint[s];b.className="sch i"+v;b.textContent=s+(v?" · "+INTENS[v]:"")})}
function configCiclo(primera){const c=S.cicloCfg,H=[...c.hist,...Array(Math.max(0,6-c.hist.length)).fill("")].slice(0,Math.max(6,c.hist.length));
  dlg("🌸 Ajustes del ciclo",`<label>¿Qué quieres seguir?</label><select id="ccM"><option value="ciclo" ${c.modo==="ciclo"?"selected":""}>Ciclo menstrual</option><option value="embarazo" ${c.modo==="embarazo"?"selected":""}>Embarazo</option><option value="menopausia" ${c.modo==="menopausia"?"selected":""}>Perimenopausia / menopausia (sin ventana fértil)</option></select>
   <label style="margin-top:8px">Fechas de inicio de tus últimos períodos</label><div class="ajg">${H.map((f,i)=>`<input type="date" class="ccH" value="${esc(f)}" max="${hoyISO()}" aria-label="Inicio ${i+1}">`).join("")}</div>
   <div class="ajg" style="margin-top:8px"><label>Tu período suele durar (días)<input type="number" id="ccP" min="1" max="15" value="${c.durPer}"></label><label>Tu ciclo suele durar (días; si no sabes, 28)<input type="number" id="ccC" min="18" max="60" value="${c.durCiclo}"></label></div>
   <label><input type="checkbox" id="ccA" ${c.avisos?"checked":""}> Avisarme por Telegram <input type="number" id="ccD" min="0" max="10" value="${c.avisoDias}" style="width:60px"> días antes del período esperado</label>
   <label>Recordatorio diario de la pastilla anticonceptiva <input type="time" id="ccPa" value="${esc(c.pastilla)}"> <span class="small muted">(vacío = sin recordatorio)</span></label>
   <label>Fecha de la última menstruación (solo para embarazo)<input type="date" id="ccF" value="${esc(c.fum)}" max="${hoyISO()}"></label>
   ${c.on?`<p class="small"><a href="#" id="ccOff">Desactivar el seguimiento del ciclo</a> (no borra lo registrado)</p>`:""}`,[["Cancelar","",cerrar],["Guardar","p",()=>{Object.assign(c,{on:true,modo:$("#ccM").value,durPer:+$("#ccP").value||5,durCiclo:+$("#ccC").value||28,avisos:$("#ccA").checked,avisoDias:+$("#ccD").value||0,pastilla:$("#ccPa").value||"",fum:$("#ccF").value||"",
     hist:[...new Set([...document.querySelectorAll(".ccH")].map(x=>x.value).filter(f=>F_SX.test(f)))].sort()});changed();cerrar();render();if(primera)aviso("🌸 Ciclo activado")}]]);
  if($("#ccOff"))$("#ccOff").onclick=ev=>{ev.preventDefault();c.on=false;changed();cerrar();render()}}
function bindCiclo(){if($("#ciAct"))$("#ciAct").onclick=()=>configCiclo(true);document.querySelectorAll("#ciCfg").forEach(b=>b.onclick=()=>configCiclo());if($("#ciReg"))$("#ciReg").onclick=()=>editarCicloDia(hoyISO());
  if($("#ciHoy"))$("#ciHoy").onclick=()=>{const f=hoyISO();let e=cicloDia(f);if(!e){e={id:nuevoId(),fecha:f,sangrado:"moderado",sint:{},alivio:"",nota:"",creado:ahoraISO(),editado:ahoraISO()};S.ciclo.push(e)}else{e.sangrado=esPeriodo(e)?e.sangrado:"moderado";e.editado=ahoraISO()}changed();render();aviso("🩸 Registrado: inicio del período")};
  document.querySelectorAll("[data-cdia]").forEach(b=>b.onclick=()=>editarCicloDia(b.dataset.cdia));
  document.querySelectorAll("[data-cmes]").forEach(b=>b.onclick=()=>{const m=SX.mes||hoyISO().slice(0,7);const d=new Date(+m.slice(0,4),+m.slice(5,7)-1+ +b.dataset.cmes,1);SX.mes=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");render()})}

// =====================================================================================================
// 🔒 ÍNTIMO (cada registro cifrado con la llave de tus privadas; sin PIN no se ve ni la fecha)
// =====================================================================================================
const INT={cache:new Map(),cfg:null};
const PROTECCION=["Ninguna","Condón","Pastilla","DIU","Implante","Inyección","Parche","Coito interrumpido","Otro"];
async function abrirIntimo(){if(!PRIV.key){const ok=await pedirPin("Escribe tu PIN para abrir tu registro íntimo.");if(!ok)return false}
  INT.cache.clear();for(const e of S.intimo||[])try{INT.cache.set(e.id,JSON.parse(dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(e.iv),additionalData:enc.encode("int:"+e.id)},PRIV.key,b64u8(e.ct)))))}catch(x){}
  INT.cfg={etiquetas:[]};if(S.intimoCfg&&S.intimoCfg.ct)try{INT.cfg=JSON.parse(dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(S.intimoCfg.iv),additionalData:enc.encode("intcfg")},PRIV.key,b64u8(S.intimoCfg.ct))))}catch(x){}
  return true}
async function sellarInt(id,o){const iv=crypto.getRandomValues(new Uint8Array(12));return{iv:u8b64(iv),ct:u8b64(new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode("int:"+id)},PRIV.key,enc.encode(JSON.stringify(o)))))}}
async function guardarCfgInt(){const iv=crypto.getRandomValues(new Uint8Array(12));S.intimoCfg={iv:u8b64(iv),ct:u8b64(new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode("intcfg")},PRIV.key,enc.encode(JSON.stringify(INT.cfg)))))}}
const intAbierto=()=>!!PRIV.key&&INT.cfg!=null;
function cerrarInt(){INT.cache.clear();INT.cfg=null}
function vIntimo(){if(!intAbierto())return`<div class="card"><h2>🔒 Registro íntimo</h2><p>Es solo tuyo: cada registro se guarda cifrado con tu PIN de privadas (ni siquiera la fecha queda visible sin él). No aparece en la búsqueda, en Inicio, en las exportaciones ni en Telegram, y nunca se comparte.</p><button class="b p" id="inAbrir">🔓 Abrir con mi PIN</button></div>`;
  const L=[...INT.cache.entries()].map(([id,o])=>({id,...o})).sort((a,b)=>(b.fecha+(b.hora||"")).localeCompare(a.fecha+(a.hora||""))),hoy=hoyISO(),m=hoy.slice(0,7),mes=L.filter(x=>x.fecha.startsWith(m)),val=L.filter(x=>x.val).slice(0,20);
  const prom=val.length?(val.reduce((a,b)=>a+b.val,0)/val.length).toFixed(1):"–",T={};for(const x of L)for(const t of x.etiquetas||[])T[t]=(T[t]||0)+1;
  return`<div class="card"><div class="filters" style="justify-content:space-between"><h2 style="margin:0">🔒 Registro íntimo</h2><div class="filters"><button class="b p" id="inNuevo">＋ Registrar</button><button class="b s" id="inCerrar">🔒 Cerrar</button></div></div>
   <div class="ajg" style="margin-top:8px"><div><b>${mes.length}</b><div class="small muted">este mes</div></div><div><b>${L.filter(x=>x.fecha>=masDias(hoy,-30)).length}</b><div class="small muted">últimos 30 días</div></div><div><b>${prom}</b><div class="small muted">valoración promedio (últimos 20)</div></div></div>
   ${Object.keys(T).length?`<p class="small muted">Tus etiquetas: ${Object.entries(T).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([t,n])=>`${esc(t)} (${n})`).join(" · ")}</p>`:""}</div>
   <div class="card">${L.length?L.slice(0,60).map(x=>`<div class="vrow click" data-inv="${esc(x.id)}"><span style="min-width:92px">${esc(fCorta(x.fecha))}${x.hora?" "+esc(x.hora):""}</span><span style="flex:1;min-width:0">${"★".repeat(x.val||0)}<span class="muted">${"★".repeat(5-(x.val||0))}</span> ${(x.etiquetas||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join(" ")} <span class="small muted">${esc((x.nota||"").slice(0,60))}</span></span><span class="small muted">${esc(x.prot&&x.prot!=="Ninguna"?x.prot:"")}</span></div>`).join(""):'<p class="small muted">Aún no hay registros.</p>'}</div>`}
async function editarInt(id){if(!intAbierto()){if(!await abrirIntimo())return;render()}const o0=id?INT.cache.get(id):null,o=o0?structuredClone(o0):{fecha:hoyISO(),hora:"",prot:"",val:0,deseo:0,animo:"",etiquetas:[],nota:""};const fs=S.cicloCfg&&S.cicloCfg.on?faseDe(o.fecha):"";
  const usadas=[...new Set([...(INT.cfg.etiquetas||[]),...[...INT.cache.values()].flatMap(x=>x.etiquetas||[])])].sort((a,b)=>a.localeCompare(b,"es"));
  const est=(k,v)=>[1,2,3,4,5].map(n=>`<button type="button" class="star ${n<=v?"on":""}" data-st="${k}" data-v="${n}">★</button>`).join("");
  dlg("🔒 "+(o0?"Editar":"Nuevo")+" registro",`<div class="ajg"><label>Fecha<input type="date" id="inF" value="${esc(o.fecha)}"></label><label>Hora<input type="time" id="inH" value="${esc(o.hora)}"></label></div>${fs?`<p class="small muted">Fase del ciclo: ${esc(fs)}</p>`:""}
   <label>Protección / método</label><input id="inP" list="inPL" value="${esc(o.prot)}"><datalist id="inPL">${PROTECCION.map(p=>`<option value="${esc(p)}">`).join("")}</datalist>
   <label>¿Cómo estuvo?</label><div class="stars">${est("val",o.val)}</div><label>Deseo / ganas</label><div class="stars">${est("deseo",o.deseo)}</div>
   <label>Ánimo</label><input id="inA" value="${esc(o.animo)}" placeholder="Ej.: relajada, cansado, con ganas…">
   <label>Etiquetas <span class="small muted">(las creas tú: lugar, posiciones, momentos… solo existen cifradas)</span></label><div id="inT" class="schs">${usadas.map(t=>`<button type="button" class="sch ${o.etiquetas.includes(t)?"i2":"i0"}" data-it="${esc(t)}">${esc(t)}</button>`).join("")}</div>
   <div class="filters"><input id="inTN" placeholder="Nueva etiqueta" style="flex:1"><button type="button" class="b s" id="inTA">＋</button></div>
   <label>Comentarios</label><textarea id="inN" rows="4">${esc(o.nota)}</textarea>`,
   [...(o0?[["Borrar","",async()=>{if(!confirm("¿Borrar este registro? No va a la papelera."))return;cerrar();INT.cache.delete(id);S.intimo=S.intimo.filter(x=>x.id!==id);(S.eliminados=S.eliminados||[]).push({id,fecha:ahoraISO()});changed();render()}]]:[]),["Cancelar","",cerrar],
    ["Guardar","p",async()=>{if(!PRIV.key){alert("Se cerraron las privadas. Ábrelas de nuevo.");cerrar();cerrarInt();render();return}Object.assign(o,{fecha:$("#inF").value||hoyISO(),hora:$("#inH").value||"",prot:$("#inP").value.trim().slice(0,40),animo:$("#inA").value.trim().slice(0,60),nota:$("#inN").value.slice(0,5000)});
     const nid=id||nuevoId(),s=await sellarInt(nid,o);INT.cache.set(nid,o);S.intimo=S.intimo||[];const ah=ahoraISO();const i=S.intimo.findIndex(x=>x.id===nid);if(i>=0)S.intimo[i]={...S.intimo[i],...s,editado:ah};else S.intimo.push({id:nid,...s,creado:"",editado:ah});
     const nuevas=o.etiquetas.filter(t=>!(INT.cfg.etiquetas||[]).includes(t));if(nuevas.length){INT.cfg.etiquetas=[...(INT.cfg.etiquetas||[]),...nuevas].slice(0,200);await guardarCfgInt()}changed();cerrar();render()}]]);
  document.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>{const k=b.dataset.st,v=+b.dataset.v;o[k]=o[k]===v?0:v;document.querySelectorAll(`[data-st="${k}"]`).forEach(x=>x.classList.toggle("on",+x.dataset.v<=o[k]))});
  const bindT=()=>document.querySelectorAll("[data-it]").forEach(b=>b.onclick=()=>{const t=b.dataset.it,i=o.etiquetas.indexOf(t);if(i>=0)o.etiquetas.splice(i,1);else o.etiquetas.push(t);b.className="sch "+(i>=0?"i0":"i2")});bindT();
  $("#inTA").onclick=()=>{const t=$("#inTN").value.trim().slice(0,40);if(!t)return;if(!o.etiquetas.includes(t))o.etiquetas.push(t);if(!document.querySelector(`[data-it="${CSS.escape(t)}"]`))$("#inT").insertAdjacentHTML("beforeend",`<button type="button" class="sch i2" data-it="${esc(t)}">${esc(t)}</button>`);$("#inTN").value="";bindT()};
  $("#inTN").onkeydown=ev=>{if(ev.key==="Enter"){ev.preventDefault();$("#inTA").click()}}}
function bindIntimo(){if($("#inAbrir"))$("#inAbrir").onclick=async()=>{if(await abrirIntimo())render()};if($("#inNuevo"))$("#inNuevo").onclick=()=>editarInt(null);
  if($("#inCerrar"))$("#inCerrar").onclick=()=>{cerrarInt();render()};document.querySelectorAll("[data-inv]").forEach(r=>r.onclick=()=>editarInt(r.dataset.inv))}

// =====================================================================================================
// 🍽 COMIDAS
// =====================================================================================================
// [nombre, palabras que lo reconocen, grupo, porción de referencia, kcal, proteína g] — valores aproximados por porción mediana
const ALIM=[
["Arroz blanco","arroz","carb","1 taza",205,4],["Arroz integral","arroz integral","carb","1 taza",215,5],["Arepa","arepa|arepas","carb","1 mediana",140,3],["Arepa de choclo","arepa de choclo","carb","1",220,5],["Arepa con queso","arepa con queso|arepa de queso","carb","1",250,9],
["Pan","pan|panes|pancito","carb","1 unidad",140,4],["Pan integral","pan integral","carb","2 tajadas",140,7],["Pan tajado","pan tajado|tostada|tostadas","carb","2 tajadas",150,5],["Almojábana","almojabana|almojabanas","carb","1",200,7],["Pandebono","pandebono|pandebonos","carb","1",180,5],
["Buñuelo","bunuelo|bunuelos","carb","1",160,4],["Empanada","empanada|empanadas","mixto","1",240,6],["Papa","papa|papas","carb","1 mediana",130,3],["Papa criolla","papa criolla|papitas criollas","carb","1 taza",120,3],["Papas fritas","papas fritas|papa frita|francesa","carb","porción",310,4],
["Yuca","yuca","carb","1 trozo",160,1],["Plátano maduro","maduro|platano maduro|tajadas","carb","½ unidad",160,1],["Patacón","patacon|patacones","carb","2",220,2],["Plátano verde","platano verde|platano","carb","½",120,1],["Pasta","pasta|espagueti|espaguetis|macarrones|tallarines","carb","1 taza",220,8],
["Avena","avena","carb","½ taza",150,5],["Granola","granola","carb","½ taza",230,6],["Cereal","cereal|cornflakes","carb","1 taza",150,3],["Tortilla","tortilla|wrap","carb","1",150,4],["Galletas de sal","galletas de sal|saltinas|galleta de sal","carb","4",120,2],
["Mazorca","mazorca|choclo","carb","1",120,4],["Quinua","quinua|quinoa","carb","1 taza",220,8],["Fríjoles","frijoles|frijol","prot","1 taza",230,15],["Lentejas","lentejas|lenteja","prot","1 taza",230,18],["Garbanzos","garbanzos|garbanzo","prot","1 taza",270,15],["Arvejas","arvejas|arveja","verd","½ taza",60,4],
["Huevo","huevo|huevos","prot","1",72,6],["Huevos pericos","pericos|huevos pericos","prot","2 huevos",220,13],["Pollo","pollo|pechuga","prot","1 presa / 120 g",200,37],["Pollo frito","pollo frito|pollo apanado","prot","1 presa",300,25],["Carne de res","carne|res|bistec|lomo|sobrebarriga","prot","120 g",250,30],
["Carne molida","carne molida","prot","120 g",280,25],["Cerdo","cerdo|chuleta|lomo de cerdo","prot","120 g",270,30],["Chicharrón","chicharron|chicharrones","prot","1 trozo",270,15],["Chorizo","chorizo|chorizos","prot","1",200,10],["Salchicha","salchicha|salchichas","prot","1",110,4],
["Jamón","jamon","prot","2 tajadas",60,8],["Pescado","pescado|tilapia|mojarra|robalo","prot","1 filete",150,28],["Atún","atun","prot","1 lata",120,26],["Salmón","salmon","prot","120 g",250,25],["Camarones","camarones|camaron","prot","100 g",100,24],
["Queso","queso|quesito|cuajada","lacteo","1 tajada",90,6],["Morcilla","morcilla|rellena","prot","1 porción",300,12],["Hígado","higado","prot","100 g",150,22],
["Leche","leche","lacteo","1 vaso",150,8],["Leche descremada","leche descremada|leche deslactosada|leche light","lacteo","1 vaso",100,8],["Yogur","yogur|yogurt","lacteo","1 vaso",150,7],["Yogur griego","yogur griego|griego","lacteo","1 vaso pequeño",140,14],["Kumis","kumis","lacteo","1 vaso",170,7],
["Mantequilla","mantequilla","grasa","1 cucharadita",35,0],["Crema de leche","crema de leche","grasa","1 cucharada",50,0],["Queso crema","queso crema","grasa","1 cucharada",50,1],
["Ensalada","ensalada","verd","1 taza",30,2],["Tomate","tomate","verd","1",20,1],["Lechuga","lechuga","verd","1 taza",8,1],["Zanahoria","zanahoria","verd","1",25,1],["Brócoli","brocoli","verd","1 taza",55,4],["Espinaca","espinaca|espinacas","verd","1 taza",40,5],
["Hogao","hogao|ahogao","verd","2 cucharadas",40,1],["Aguacate","aguacate","grasa","½",160,2],["Pepino","pepino","verd","1",15,1],["Habichuela","habichuela|habichuelas","verd","1 taza",35,2],["Ahuyama","ahuyama|auyama","verd","1 taza",50,1],["Remolacha","remolacha","verd","1",35,1],
["Champiñones","champinones|champinon","verd","1 taza",20,3],["Verduras salteadas","verduras|vegetales","verd","1 taza",80,3],
["Banano","banano|banana|guineo","fruta","1",105,1],["Manzana","manzana","fruta","1",95,1],["Naranja","naranja","fruta","1",62,1],["Mandarina","mandarina","fruta","1",45,1],["Papaya","papaya","fruta","1 taza",55,1],["Mango","mango","fruta","1",130,2],
["Piña","pina","fruta","1 taza",80,1],["Fresas","fresas|fresa","fruta","1 taza",50,1],["Uvas","uvas|uva","fruta","1 taza",100,1],["Pera","pera","fruta","1",100,1],["Guayaba","guayaba","fruta","1",37,1],["Granadilla","granadilla","fruta","1",45,1],
["Mora","mora|moras","fruta","½ taza",30,1],["Sandía","sandia|patilla","fruta","1 taza",45,1],["Melón","melon","fruta","1 taza",55,1],["Fruta","fruta|frutas","fruta","1 porción",70,1],["Jugo natural","jugo|jugo natural","bebida","1 vaso",120,1],["Jugo de caja","jugo de caja|jugo en caja","bebida","1 vaso",120,0],
["Tinto","tinto|cafe negro|cafe","bebida","1 pocillo",2,0],["Café con leche","cafe con leche|perico|capuchino|latte","bebida","1 pocillo",70,4],["Chocolate","chocolate","bebida","1 pocillo",190,7],["Aguapanela","aguapanela|agua de panela|panela","bebida","1 vaso",120,0],
["Gaseosa","gaseosa|coca cola|cocacola|soda","bebida","1 lata",150,0],["Cerveza","cerveza|cervezas|pola","bebida","1 lata",145,2],["Vino","vino","bebida","1 copa",125,0],["Aromática","aromatica|te|infusion","bebida","1 pocillo",2,0],
["Aceite","aceite","grasa","1 cucharada",120,0],["Mayonesa","mayonesa","grasa","1 cucharada",90,0],["Maní","mani","grasa","1 puñado",170,7],["Almendras","almendras","grasa","1 puñado",170,6],["Nueces","nueces|nuez","grasa","1 puñado",185,4],
["Chocolatina","chocolatina|chocolatinas","dulce","1",160,2],["Torta","torta|ponque|pastel|postre","dulce","1 porción",350,4],["Helado","helado","dulce","1 bola",140,3],["Bocadillo","bocadillo","dulce","1",90,0],["Arequipe","arequipe|dulce de leche","dulce","1 cucharada",60,2],
["Galletas dulces","galletas|galleta","dulce","4",200,2],["Pan dulce","croissant|roscon|pan dulce|mogolla","dulce","1",250,5],["Paquete de papas","papas de paquete|paquete|snack|chitos|doritos","dulce","1 bolsa",160,2],["Donut","donut|dona","dulce","1",250,3],["Brownie","brownie","dulce","1",230,3],
["Ajiaco","ajiaco","mixto","1 plato",450,25],["Sancocho","sancocho","mixto","1 plato",400,22],["Bandeja paisa","bandeja paisa|bandeja","mixto","1 plato",1100,45],["Arroz con pollo","arroz con pollo","mixto","1 plato",550,28],["Sopa","sopa|crema","mixto","1 plato",180,8],
["Caldo de costilla","caldo|caldo de costilla","mixto","1 plato",250,18],["Changua","changua","mixto","1 plato",220,12],["Tamal","tamal|tamales","mixto","1",450,18],["Lechona","lechona","mixto","1 porción",650,30],["Hamburguesa","hamburguesa","mixto","1",550,28],
["Perro caliente","perro caliente|perro","mixto","1",450,15],["Pizza","pizza","mixto","2 porciones",550,22],["Sándwich","sandwich|sanduche","mixto","1",350,18],["Ensalada de frutas","ensalada de frutas","mixto","1",250,4],["Salchipapa","salchipapa|salchipapas","mixto","1",700,18],
["Picada","picada","mixto","1 porción",900,45],["Almuerzo corriente","corrientazo|almuerzo corriente|ejecutivo|menu del dia","mixto","sopa + seco",900,35],["Mondongo","mondongo","mixto","1 plato",400,25],["Cazuela de frijoles","cazuela","mixto","1",600,25],
["Sushi","sushi","mixto","8 piezas",350,14],["Ceviche","ceviche","mixto","1",250,25],["Crepe","crepe|crepes","mixto","1",450,20],["Arroz chino","arroz chino|arroz frito","mixto","1 plato",650,20],["Lasaña","lasana","mixto","1 porción",500,25],["Burrito","burrito","mixto","1",550,24]];
const GRUPOS_C={carb:"🍞 Harinas",prot:"🍗 Proteína",verd:"🥦 Verduras",fruta:"🍎 Fruta",lacteo:"🥛 Lácteos",grasa:"🥑 Grasas",dulce:"🍫 Dulces",bebida:"☕ Bebidas",mixto:"🍲 Plato"};
const TAM={p:["Pequeña",0.7],m:["Mediana",1],g:["Grande",1.4],d:["Doble",2]};
const TIEMPOS=[["desayuno","🌅 Desayuno"],["mm","🍎 Media mañana"],["almuerzo","🍽 Almuerzo"],["onces","☕ Onces"],["cena","🌙 Cena"],["snack","🍪 Snack"]];
const tiempoPorHora=h=>{const m=+String(h||ahoraHM()).slice(0,2);return m<11?"desayuno":m<12?"mm":m<15?"almuerzo":m<18?"onces":m<22?"cena":"snack"};
const NUMW={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,medio:.5,media:.5};
function tablaAlim(){return[...(S.alimentos||[]).map(a=>[a.nombre,normK(a.nombre),a.grupo,a.por,a.kcal,a.prot,true]),...ALIM]}
function analizarPlato(txt,tam){const t=" "+normK(txt).replace(/[^a-z0-9ñ ]+/g," ").replace(/\s+/g," ")+" ",usados=[],enc2=[];let resto=t;
  const T=tablaAlim().map(a=>({a,ws:a[1].split("|").map(w=>normK(w).trim()).filter(Boolean).sort((x,y)=>y.length-x.length)})).sort((x,y)=>y.ws[0].length-x.ws[0].length);
  for(const {a,ws} of T)for(const w of ws){const i=resto.indexOf(" "+w+" ");if(i<0)continue;const antes=resto.slice(0,i).trim().split(" ").slice(-2);let q=1;for(const x of antes.reverse()){if(/^\d+([.,]\d+)?$/.test(x)){q=+x.replace(",",".");break}if(NUMW[x]){q=NUMW[x];break}}
    const nPor=+(String(a[3]).match(/^(\d+)\s/)||[])[1];if(nPor&&q===nPor)q=1;enc2.push({n:a[0],g:a[2],q,kcal:a[4]*q,prot:a[5]*q});resto=resto.slice(0,i)+" "+"·".repeat(w.length)+" "+resto.slice(i+w.length+2);break}
  const hayMixto=enc2.some(x=>x.g==="mixto"),L=hayMixto?enc2.filter(x=>x.g==="mixto"||["bebida","fruta","dulce"].includes(x.g)):enc2,f=TAM[tam||"m"][1];
  return{items:L,kcal:Math.round(L.reduce((a,x)=>a+x.kcal,0)*f),prot:Math.round(L.reduce((a,x)=>a+x.prot,0)*f),grupos:[...new Set(L.map(x=>x.g))]};void usados}
function bienDe(f){return(S.bienestar||[]).find(e=>e.fecha===f)}
function asegurarBien(f){let e=bienDe(f);if(!e){e={id:nuevoId(),fecha:f,creado:ahoraISO(),editado:ahoraISO(),nota:"",ejTipo:""};S.bienestar=S.bienestar||[];S.bienestar.push(e)}return e}
function vComidas(){const f=SX.cDia||hoyISO(),L=(S.comidas||[]).filter(c=>c.fecha===f).sort((a,b)=>(a.hora||"").localeCompare(b.hora||"")),cfg=S.comidaCfg,tk=L.reduce((a,c)=>a+c.kcal,0),tp=L.reduce((a,c)=>a+c.prot,0),agua=(bienDe(f)||{}).agua||0;
  const fav=Object.entries((S.comidas||[]).filter(c=>c.fecha>=masDias(hoyISO(),-60)).reduce((m,c)=>{const k=c.plato.trim();if(k)m[k]=(m[k]||0)+1;return m},{})).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const barra=(v,m,col)=>m?`<div class="cobar"><span style="width:${Math.min(100,v/m*100)}%;background:${col}"></span></div>`:"";
  const sem=[...Array(7)].map((_,i)=>masDias(f,i-6)).map(d=>({d,k:(S.comidas||[]).filter(c=>c.fecha===d).reduce((a,c)=>a+c.kcal,0)})),mx=Math.max(1,cfg.kcal||0,...sem.map(x=>x.k));
  return`<div class="cap card"><div class="caprow"><input id="coQ" placeholder="«2 huevos pericos con arepa y café con leche» · «almuerzo corriente» · «manzana»" autocomplete="off"><button class="b p" id="coG">Guardar</button></div>
   <div class="filters" style="margin-top:6px"><select id="coT">${TIEMPOS.map(([k,l])=>`<option value="${k}" ${tiempoPorHora()===k?"selected":""}>${l}</option>`).join("")}</select><select id="coS">${Object.entries(TAM).map(([k,[l]])=>`<option value="${k}" ${k==="m"?"selected":""}>Porción ${l.toLowerCase()}</option>`).join("")}</select></div>
   <div id="coP" class="small muted"></div>${fav.length?`<div class="small" style="margin-top:6px">⭐ Repetir: ${fav.map(([p])=>`<a href="#" class="chip" data-cofav="${esc(p)}">${esc(p.slice(0,40))}</a>`).join(" ")}</div>`:""}</div>
   <div class="card"><div class="filters" style="justify-content:space-between"><button class="b s" data-cod="-1">‹</button><b>${f===hoyISO()?"Hoy":esc(fechaLarga(f))}</b><button class="b s" data-cod="1" ${f>=hoyISO()?"disabled":""}>›</button></div>
   <div class="ajg" style="margin-top:6px"><div><b>${tk} kcal</b>${cfg.kcal?` <span class="small muted">de ${cfg.kcal}</span>`:""}${barra(tk,cfg.kcal,"var(--pri)")}</div><div><b>${tp} g proteína</b>${cfg.prot?` <span class="small muted">de ${cfg.prot}</span>`:""}${barra(tp,cfg.prot,"#2e8b57")}</div>
    <div><b>💧 ${agua} vaso${agua===1?"":"s"}</b>${cfg.agua?` <span class="small muted">de ${cfg.agua}</span>`:""} <button class="b s" data-agua="-1">−</button><button class="b s" data-agua="1">＋</button>${barra(agua,cfg.agua,"#3a8fd6")}</div></div>
   <p class="small muted">${["verd","fruta","prot","carb"].map(g=>`${GRUPOS_C[g]}: ${L.filter(c=>c.grupos.includes(g)).length}`).join(" · ")}</p>
   ${TIEMPOS.map(([k,l])=>{const X=L.filter(c=>c.tiempo===k);return X.length?`<h3 style="margin:8px 0 2px">${l}</h3>${X.map(c=>`<div class="vrow click" data-coe="${esc(c.id)}"><span style="flex:1;min-width:0">${esc(c.plato)} <span class="small muted">· ${TAM[c.tam][0].toLowerCase()}</span></span><span class="small">${c.kcal} kcal · ${c.prot} g</span></div>`).join("")}`:""}).join("")||'<p class="small muted">Nada registrado este día.</p>'}
   <div class="filters" style="margin-top:8px"><button class="b s" id="coMet">🎯 Metas</button><button class="b s" id="coTab">📋 Mis alimentos</button></div>
   <p class="small muted">Calorías y proteína son aproximadas (porciones típicas). Corrige cualquier valor tocando la comida.</p></div>
   <div class="card"><h2>📅 Últimos 7 días</h2><div class="cosem">${sem.map(x=>`<div title="${x.k} kcal"><span style="height:${x.k/mx*100}%"></span><small>${dDe(x.d).toLocaleDateString("es-CO",{weekday:"narrow"})}</small><small>${x.k||""}</small></div>`).join("")}</div>${cfg.kcal?`<p class="small muted">Línea de referencia: tu meta de ${cfg.kcal} kcal.</p>`:""}</div>`}
function previewCo(){const q=$("#coQ");if(!q)return;const v=q.value.trim(),p=$("#coP");if(!v){p.textContent="";return}const a=analizarPlato(v,$("#coS").value);
  p.innerHTML=a.items.length?`≈ <b>${a.kcal} kcal</b> · <b>${a.prot} g</b> proteína · ${a.items.map(x=>esc((x.q!==1?x.q+" × ":"")+x.n)).join(", ")}`:"No reconozco los alimentos: se guardará y podrás poner las calorías a mano (o agrégalo a «Mis alimentos»)."}
function guardarCo(txt){const q=$("#coQ"),v=(txt||q.value).trim();if(!v)return;const tam=$("#coS").value,a=analizarPlato(v,tam),f=SX.cDia||hoyISO(),ah=ahoraISO();
  S.comidas=S.comidas||[];const c={id:nuevoId(),fecha:f,hora:f===hoyISO()?ahoraHM():"",tiempo:$("#coT").value,plato:v.slice(0,300),tam,kcal:a.kcal,prot:a.prot,grupos:a.grupos,manual:false,nota:"",creado:ah,editado:ah};S.comidas.push(c);changed();render();
  aviso(`🍽 ${c.plato.slice(0,40)} · ≈${c.kcal} kcal`);setTimeout(()=>{const z=$("#coQ");if(z)z.focus()},50)}
function editarCo(id){const c=(S.comidas||[]).find(x=>x.id===id);if(!c)return;
  dlg("🍽 "+c.plato.slice(0,50),`<label>Plato</label><input id="ceP" value="${esc(c.plato)}"><div class="ajg"><label>Comida<select id="ceT">${TIEMPOS.map(([k,l])=>`<option value="${k}" ${c.tiempo===k?"selected":""}>${l}</option>`).join("")}</select></label>
   <label>Porción<select id="ceS">${Object.entries(TAM).map(([k,[l]])=>`<option value="${k}" ${c.tam===k?"selected":""}>${l}</option>`).join("")}</select></label><label>Fecha<input type="date" id="ceF" value="${c.fecha}"></label></div>
   <div class="ajg"><label>Calorías<input type="number" id="ceK" value="${c.kcal}" min="0"></label><label>Proteína (g)<input type="number" id="cePr" value="${c.prot}" min="0"></label></div>
   <label>Grupos</label><div class="opc">${Object.entries(GRUPOS_C).map(([k,l])=>`<label class="fchip ${c.grupos.includes(k)?"on":"off"}"><input type="checkbox" class="ceG" value="${k}" ${c.grupos.includes(k)?"checked":""} hidden>${l}</label>`).join("")}</div>
   <label>Nota</label><input id="ceN" value="${esc(c.nota)}"><p class="small"><a href="#" id="ceRe">Recalcular con la tabla</a></p>`,
   [["Borrar","",()=>{cerrar();borrarX("comidas",c.id,"Comida")}],["Cancelar","",cerrar],["Guardar","p",()=>{const k=+$("#ceK").value,pr=+$("#cePr").value;c.manual=c.manual||k!==c.kcal||pr!==c.prot;Object.assign(c,{plato:$("#ceP").value.trim().slice(0,300)||c.plato,tiempo:$("#ceT").value,tam:$("#ceS").value,fecha:$("#ceF").value||c.fecha,kcal:Math.max(0,Math.round(k)),prot:Math.max(0,Math.round(pr)),grupos:[...document.querySelectorAll(".ceG")].filter(x=>x.checked).map(x=>x.value),nota:$("#ceN").value.trim().slice(0,500),editado:ahoraISO()});changed();cerrar();render()}]]);
  document.querySelectorAll(".ceG").forEach(x=>x.onchange=()=>{x.parentElement.className="fchip "+(x.checked?"on":"off")});
  $("#ceRe").onclick=ev=>{ev.preventDefault();const a=analizarPlato($("#ceP").value,$("#ceS").value);$("#ceK").value=a.kcal;$("#cePr").value=a.prot}}
function metasCo(){const m=S.comidaCfg;dlg("🎯 Metas diarias",`<p class="small muted">Opcionales: déjalas en 0 si solo quieres llevar el registro. Si tienes una meta médica o nutricional, usa la que te dieron.</p><div class="ajg"><label>Calorías<input type="number" id="mkK" value="${m.kcal}" min="0"></label><label>Proteína (g)<input type="number" id="mkP" value="${m.prot}" min="0"></label><label>Vasos de agua<input type="number" id="mkA" value="${m.agua}" min="0"></label></div>`,
  [["Cancelar","",cerrar],["Guardar","p",()=>{Object.assign(m,{kcal:+$("#mkK").value||0,prot:+$("#mkP").value||0,agua:+$("#mkA").value||0});changed();cerrar();render()}]])}
function tablaCo(){const pinta=()=>`${(S.alimentos||[]).map(a=>`<div class="vrow small"><span style="flex:1">${esc(a.nombre)} <span class="muted">· ${esc(a.por)}</span></span><span>${a.kcal} kcal · ${a.prot} g</span><a href="#" data-alx="${esc(a.id)}">✕</a></div>`).join("")||'<p class="small muted">Aún no agregas alimentos propios.</p>'}
   <h3>Agregar</h3><div class="ajg"><input id="alN" placeholder="Nombre (p. ej. Changua de mi mamá)"><input id="alP" placeholder="Porción (1 plato)"><input type="number" id="alK" placeholder="kcal"><input type="number" id="alPr" placeholder="Proteína g"><select id="alG">${Object.entries(GRUPOS_C).map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select></div><button class="b s" id="alA" style="margin-top:6px">＋ Agregar</button>
   <p class="small muted">La tabla incluida tiene ${ALIM.length} alimentos y platos comunes; los tuyos tienen prioridad al reconocer el texto.</p>`;
  dlg("📋 Mis alimentos",`<div id="alBox">${pinta()}</div>`,[["Listo","p",()=>{cerrar();render()}]]);
  const bind=()=>{document.querySelectorAll("[data-alx]").forEach(a=>a.onclick=ev=>{ev.preventDefault();S.alimentos=S.alimentos.filter(x=>x.id!==a.dataset.alx);changed();$("#alBox").innerHTML=pinta();bind()});
    $("#alA").onclick=()=>{const n=$("#alN").value.trim();if(!n)return;S.alimentos=S.alimentos||[];S.alimentos.push({id:nuevoId(),nombre:n.slice(0,60),grupo:$("#alG").value,por:$("#alP").value.trim().slice(0,40)||"1 porción",kcal:+$("#alK").value||0,prot:+$("#alPr").value||0});changed();$("#alBox").innerHTML=pinta();bind()}};bind()}
function bindComidas(){const q=$("#coQ");if(!q)return;q.oninput=previewCo;$("#coS").onchange=previewCo;q.onkeydown=ev=>{if(ev.key==="Enter"){ev.preventDefault();guardarCo()}};$("#coG").onclick=()=>guardarCo();
  document.querySelectorAll("[data-cofav]").forEach(a=>a.onclick=ev=>{ev.preventDefault();guardarCo(a.dataset.cofav)});document.querySelectorAll("[data-coe]").forEach(r=>r.onclick=()=>editarCo(r.dataset.coe));
  document.querySelectorAll("[data-cod]").forEach(b=>b.onclick=()=>{SX.cDia=masDias(SX.cDia||hoyISO(),+b.dataset.cod);if(SX.cDia>hoyISO())SX.cDia=hoyISO();render()});
  document.querySelectorAll("[data-agua]").forEach(b=>b.onclick=()=>{const e=asegurarBien(SX.cDia||hoyISO());e.agua=Math.max(0,(e.agua||0)+ +b.dataset.agua);e.editado=ahoraISO();changed();render()});
  $("#coMet").onclick=metasCo;$("#coTab").onclick=tablaCo}

// =====================================================================================================
// 🌿 BIENESTAR y ✅ CHEQUEOS PREVENTIVOS
// =====================================================================================================
const CHEQ_PRE=[["Para todos",[["Odontología (control)",6],["Limpieza dental",6],["Optometría",12],["Exámenes de sangre de control",12],["Tomarse la presión arterial",6],["Vacuna de la influenza",12],["Revisión de lunares (dermatología)",12]]],
  ["Mujer",[["Citología",12],["Control ginecológico",12],["Mamografía o ecografía de mama",24],["Autoexamen de mama",1],["Densitometría ósea",24]]],["Hombre",[["Urología / antígeno prostático (PSA)",12],["Autoexamen testicular",1]]]];
const proxCheq=c=>c.proxima||(c.ultima?masDias(c.ultima,Math.round(c.cada*30.4)):"");
function vBienestar(){const f=SX.dia||hoyISO(),e=bienDe(f)||{},esc5=(k,lab,ico)=>`<div class="bi5"><span>${ico} ${lab}</span><span>${[1,2,3,4,5].map(n=>`<button type="button" class="b s ${e[k]===n?"p":""}" data-bk="${k}" data-bv="${n}">${n}</button>`).join("")}</span></div>`;
  const H=[...Array(14)].map((_,i)=>masDias(hoyISO(),-i)).map(d=>({d,e:bienDe(d)})).filter(x=>x.e);const hoy=hoyISO(),C=(S.chequeos||[]).map(c=>({c,p:proxCheq(c)})).sort((a,b)=>(a.p||"9999").localeCompare(b.p||"9999"));
  return`<div class="card"><div class="filters" style="justify-content:space-between"><button class="b s" data-bd="-1">‹</button><h2 style="margin:0">🌿 ${f===hoy?"Hoy":esc(fechaLarga(f))}</h2><button class="b s" data-bd="1" ${f>=hoy?"disabled":""}>›</button></div>
   <p class="small muted">De 1 (muy bajo) a 5 (muy alto).</p>${esc5("animo","Ánimo","🙂")}${esc5("energia","Energía","⚡")}${esc5("estres","Estrés","🌪")}${esc5("suenoCal","Calidad del sueño","😴")}
   <div class="ajg" style="margin-top:6px"><label>Horas de sueño<input type="number" step="0.5" min="0" max="24" id="bSu" value="${e.sueno??""}"></label><label>Ejercicio (minutos)<input type="number" min="0" id="bEj" value="${e.ejercicio??""}"></label><label>Tipo de ejercicio<input id="bEt" value="${esc(e.ejTipo||"")}" placeholder="caminar, bici, yoga…"></label><label>Vasos de agua<input type="number" min="0" id="bAg" value="${e.agua??""}"></label></div>
   <label>Nota del día</label><input id="bNo" value="${esc(e.nota||"")}"></div>
   ${H.length?`<div class="card"><h2>📈 Últimos 14 días</h2><div class="tabla-c-wrap"><table class="tabla-c small"><tr><th>Día</th><th>🙂</th><th>⚡</th><th>🌪</th><th>😴</th><th>Horas</th><th>Ejercicio</th><th>💧</th></tr>${H.map(({d,e})=>`<tr><td>${esc(fCorta(d))}</td><td>${e.animo||""}</td><td>${e.energia||""}</td><td>${e.estres||""}</td><td>${e.suenoCal||""}</td><td>${e.sueno??""}</td><td>${e.ejercicio?e.ejercicio+" min":""}</td><td>${e.agua??""}</td></tr>`).join("")}</table></div></div>`:""}
   <div class="card"><div class="filters" style="justify-content:space-between"><h2 style="margin:0">✅ Chequeos preventivos</h2><button class="b s" id="chN">＋ Agregar</button></div>
   ${C.length?C.map(({c,p})=>{const est=!p?'<span class="muted">sin fecha</span>':p<hoy?`<span class="neg">vencido (${esc(fCorta(p))})</span>`:p<=masDias(hoy,30)?`<span class="warn">pronto: ${esc(fCorta(p))}</span>`:`<span class="pos">al día · ${esc(fCorta(p))}</span>`;
     return`<div class="vrow"><span style="flex:1;min-width:0" class="click" data-che="${esc(c.id)}"><b>${esc(c.nombre)}</b> <span class="small muted">· cada ${c.cada} mes${c.cada>1?"es":""}${c.ultima?" · último "+esc(fCorta(c.ultima)):""}</span></span><span class="small">${est}</span><button class="b s" data-chok="${esc(c.id)}" title="Lo hice hoy">✔ Hecho</button></div>`}).join(""):'<p class="small muted">Agrega los chequeos que quieres recordar: Memphis te avisa por Telegram una semana antes y el día.</p>'}
   <p class="small muted">Las frecuencias son sugerencias generales: ajústalas a lo que te indique tu médico.</p></div>`}
function bindBienestar(){const f=SX.dia||hoyISO();document.querySelectorAll("[data-bk]").forEach(b=>b.onclick=()=>{const e=asegurarBien(f),k=b.dataset.bk,v=+b.dataset.bv;e[k]=e[k]===v?undefined:v;if(e[k]===undefined)delete e[k];e.editado=ahoraISO();changed();render()});
  for(const [id,k,num] of [["bSu","sueno",1],["bEj","ejercicio",1],["bEt","ejTipo",0],["bAg","agua",1],["bNo","nota",0]]){const x=$("#"+id);if(x)x.onchange=()=>{const e=asegurarBien(f);if(num){if(x.value==="")delete e[k];else e[k]=+x.value}else e[k]=x.value.trim();e.editado=ahoraISO();changed()}}
  document.querySelectorAll("[data-bd]").forEach(b=>b.onclick=()=>{SX.dia=masDias(f,+b.dataset.bd);if(SX.dia>hoyISO())SX.dia=hoyISO();render()});
  if($("#chN"))$("#chN").onclick=agregarCheq;document.querySelectorAll("[data-che]").forEach(a=>a.onclick=()=>editarCheq(a.dataset.che));
  document.querySelectorAll("[data-chok]").forEach(b=>b.onclick=()=>{const c=S.chequeos.find(x=>x.id===b.dataset.chok);if(!c)return;c.ultima=hoyISO();c.proxima="";c.editado=ahoraISO();changed();render();aviso("✔ Próximo: "+fCorta(proxCheq(c)))})}
function agregarCheq(){const ya=new Set((S.chequeos||[]).map(c=>normK(c.nombre)));
  dlg("✅ Chequeos preventivos",`${CHEQ_PRE.map(([g,L])=>`<h3>${g}</h3><div class="opc">${L.map(([n,m])=>`<label class="fchip ${ya.has(normK(n))?"on":"off"}"><input type="checkbox" class="chP" value="${esc(n)}" data-m="${m}" ${ya.has(normK(n))?"checked disabled":""} hidden>${esc(n)} <span class="small">· ${m} m</span></label>`).join("")}</div>`).join("")}
   <h3>Otro</h3><div class="ajg"><input id="chON" placeholder="Nombre"><label>Cada (meses)<input type="number" id="chOM" value="12" min="1"></label></div>`,
   [["Cancelar","",cerrar],["Agregar","p",()=>{S.chequeos=S.chequeos||[];const ah=ahoraISO();for(const x of document.querySelectorAll(".chP:checked:not(:disabled)"))S.chequeos.push({id:nuevoId(),nombre:x.value,cada:+x.dataset.m,ultima:"",proxima:"",nota:"",creado:ah,editado:ah});
     const n=$("#chON").value.trim();if(n)S.chequeos.push({id:nuevoId(),nombre:n.slice(0,80),cada:+$("#chOM").value||12,ultima:"",proxima:"",nota:"",creado:ah,editado:ah});changed();cerrar();render()}]]);
  document.querySelectorAll(".chP").forEach(x=>x.onchange=()=>{x.parentElement.className="fchip "+(x.checked?"on":"off")})}
function editarCheq(id){const c=S.chequeos.find(x=>x.id===id);if(!c)return;
  dlg("✅ "+c.nombre,`<label>Nombre<input id="ceqN" value="${esc(c.nombre)}"></label><div class="ajg"><label>Cada (meses)<input type="number" id="ceqC" value="${c.cada}" min="0"></label><label>Última vez<input type="date" id="ceqU" value="${c.ultima}"></label><label>Próxima (si ya tienes cita)<input type="date" id="ceqP" value="${c.proxima}"></label></div><label>Nota<input id="ceqNo" value="${esc(c.nota)}"></label>`,
   [["Borrar","",()=>{cerrar();borrarX("chequeos",c.id,"Chequeo")}],["Cancelar","",cerrar],["Guardar","p",()=>{Object.assign(c,{nombre:$("#ceqN").value.trim().slice(0,80)||c.nombre,cada:+$("#ceqC").value||12,ultima:$("#ceqU").value||"",proxima:$("#ceqP").value||"",nota:$("#ceqNo").value.trim().slice(0,500),editado:ahoraISO()});changed();cerrar();render()}]])}

// =====================================================================================================
// pestañas de Salud, avisos e Inicio
// =====================================================================================================
const VISTAS_SX={ciclo:["🌸","Ciclo",vCiclo,bindCiclo],intimo:["🔒","Íntimo",vIntimo,bindIntimo],comidas:["🍽","Comidas",vComidas,bindComidas],bienestar:["🌿","Bienestar",vBienestar,bindBienestar]};
function ponerTabsSX(){const n=$("#tabsS");if(!n||n.querySelector("[data-ts=comidas]"))return;n.insertAdjacentHTML("beforeend",Object.entries(VISTAS_SX).map(([k,[i,l]])=>`<button data-ts="${k}">${i} ${l}</button>`).join(""))}
setInterval(()=>{if(S&&PRIV.key&&INT.cfg&&typeof MOD!=="undefined"&&MOD==="sal"&&TS.vista==="intimo"&&!document.hidden)abrirPor()},500); // mientras miras el registro íntimo no se cierra; al salir, se cierra solo
window.addEventListener("load",()=>{ponerTabsSX();
  const vs=window.vSalud;if(typeof vs==="function")window.vSalud=function(){const V=VISTAS_SX[TS.vista];if(!V)return vs.apply(this,arguments);if(TS.vista==="intimo"&&!PRIV.key)cerrarInt();
    S.ciclo=S.ciclo||[];S.comidas=S.comidas||[];S.bienestar=S.bienestar||[];S.chequeos=S.chequeos||[];S.intimo=S.intimo||[];
    $("#view").innerHTML=V[2]();V[3]();if(typeof syncTabsS==="function")syncTabsS()};
  const cp=window.cerrarPrivadas;if(typeof cp==="function")window.cerrarPrivadas=async function(){const habia=intAbierto();cerrarInt();const r=await cp.apply(this,arguments);if(habia&&MOD==="sal"&&TS.vista==="intimo"&&!document.querySelector("dialog[open]"))render();return r};
  const sa=window.sellarAbiertas;if(typeof sa==="function")window.sellarAbiertas=async function(olvidar){if(olvidar)cerrarInt();return sa.apply(this,arguments)};
  // avisos por Telegram
  const la=window.listaAvisos;if(typeof la==="function")window.listaAvisos=function(){const out=la.apply(this,arguments);if(!S)return out;const disc=S.avisos&&S.avisos.discreto,hoy=hoyISO(),fin=masDias(hoy,8),ahora=Date.now();
    const pon=(id,f,h,txt,txtD)=>{const t=msDe(f,h);if(t<ahora-60000||f>fin)return;id=String(id).replace(/[^\w-]/g,"_").slice(0,80);if(out.some(o=>o.id===id))return;out.push({id,t,txt:disc?txtD:txt})};
    const c=S.cicloCfg;if(c&&c.on&&c.modo!=="embarazo"&&c.avisos){const p=prediccion();if(!p.sinDatos){const f=masDias(p.desde,-(c.avisoDias||0));pon("ci_"+p.prox,f,"08:00",`🌸 Tu período podría empezar ${c.avisoDias?"en "+c.avisoDias+" día"+(c.avisoDias>1?"s":""):"hoy"} (entre el ${fCorta(p.desde)} y el ${fCorta(p.hasta)}).`,"🌸 Recordatorio de tu ciclo")}}
    if(c&&c.on&&c.pastilla)for(let i=0;i<=7;i++){const f=masDias(hoy,i);pon("pa_"+f,f,c.pastilla,"💊 Hora de la pastilla.","💊 Recordatorio")}
    for(const ch of S.chequeos||[]){const p=proxCheq(ch);if(!p)continue;pon("ch_"+ch.id+"_"+p,masDias(p,-7),"08:00",`✅ En una semana te toca: ${ch.nombre}.`,"✅ Chequeo pendiente");pon("ch0_"+ch.id+"_"+p,p,"08:00",`✅ Hoy te toca: ${ch.nombre}.`,"✅ Chequeo pendiente")}
    return out.sort((a,b)=>a.t-b.t)};
  // Inicio › Por atender: chequeos vencidos y retraso del ciclo
  const pa=window.porAtenderHtml;if(typeof pa==="function")window.porAtenderHtml=function(){let h=pa.apply(this,arguments);if(!S||(typeof MODO_OCULTA!=="undefined"&&MODO_OCULTA[INI.modo].includes("sal")))return h;const hoy=hoyISO(),L=[];
    for(const ch of S.chequeos||[]){const p=proxCheq(ch);if(p&&p<=hoy)L.push(`<div class="vrow small click" data-irsx="bienestar"><span style="flex:1">✅ ${esc(ch.nombre)}</span><span class="neg">${p<hoy?"vencido":"hoy"}</span></div>`)}
    const c=S.cicloCfg;if(c&&c.on&&c.modo==="ciclo"){const p=prediccion();if(!p.sinDatos&&p.retraso>=3)L.push(`<div class="vrow small click" data-irsx="ciclo"><span style="flex:1">🌸 Retraso de ${p.retraso} días</span></div>`)}
    if(!L.length)return h;return h.replace('<h2>📌 Por atender</h2>','<h2>📌 Por atender</h2>'+L.join("")).replace('<p class="small muted">Todo al día ✔</p>',"")};
  const bi=window.bindInicio;if(typeof bi==="function")window.bindInicio=function(){const r=bi.apply(this,arguments);document.querySelectorAll("[data-irsx]").forEach(a=>a.onclick=()=>{TS.vista=a.dataset.irsx;irModulo("sal")});return r};
});
