// =====================================================================================================
// Memphis · módulo SALUD. Se carga después de app.js y diario.js y usa sus piezas: cifrado, Dropbox,
// adjuntos cifrados, respaldos, papelera, versiones, Markdown, @personas (fichas) y la agenda.
// Un registro de salud es UNA sola hoja: quién, cuándo, qué síntomas, qué dijo el médico, qué medicamentos,
// fotos, audios, fórmulas, incapacidades y enlaces. Nada de esto va al archivo de sincronización sin cifrar.
// =====================================================================================================
"use strict";
CONFIG_EXTRA.push("saludFuera");
let TS={circ:"nucleo",vista:"resumen",per:"",tipo:"",sint:"",anio:"",q:"",perfil:""};
const STIPOS={episodio:["🤒","Enfermedad / síntomas"],cita:["🩺","Cita médica"],accidente:["🩹","Accidente"],vacuna:["💉","Vacuna"],medicamento:["💊","Medicamento / tratamiento"],examen:["🧪","Examen / laboratorio"],control:["📏","Control / medidas"],nota:["📝","Nota de salud"]};
const SESTADOS=[["","—"],["pendiente","Pendiente"],["hecho","Hecho / terminó"],["no asistió","No asistió"],["cancelada","Cancelada"]];
const SINT_DEF=["Fiebre","Febrícula","Temperatura alta","Tos","Flema","Mucosidad nasal","Congestión respiratoria","Dolor de garganta","Disfonía","Gripe","Resfrío","Dolor de cabeza","Mareos","Fatiga","Malestar general","Dolor de cuerpo","Dolor de articulaciones",
  "Dolor de espalda","Lumbago","Dolor de cuello","Tortícolis","Dolor de piernas","Dolor de rodilla","Dolor de pie","Esguince","Dolor estomacal","Náuseas","Vómito","Diarrea","Pujos","Estreñimiento","Inflamación",
  "Conjuntivitis","Inflamación en el ojo","Problemas de vista","Dolor de oído","Dermatitis","Prurito","Roséola","Caspa","Dolor de muelas","Caries","Caída de diente","Herida / corte","Accidente","Psicología","Control sano"];
// palabras sueltas que también reconocen un síntoma al escribir rápido (sin tildes, en minúscula)
const SIN_SIN={mocos:"Mucosidad nasal",moco:"Mucosidad nasal",mocosidad:"Mucosidad nasal","congestion nasal":"Congestión respiratoria",congestion:"Congestión respiratoria",congestionado:"Congestión respiratoria",
  vomito:"Vómito",vomitos:"Vómito",vomitando:"Vómito",vomitar:"Vómito",soltura:"Diarrea",diarreas:"Diarrea",garganta:"Dolor de garganta",cabeza:"Dolor de cabeza","dolor de estomago":"Dolor estomacal",estomago:"Dolor estomacal",barriga:"Dolor estomacal",
  temperatura:"Febrícula",afiebrado:"Fiebre",fiebre:"Fiebre",tos:"Tos",nauseas:"Náuseas","ganas de vomitar":"Náuseas",mareado:"Mareos",mareo:"Mareos",cansancio:"Fatiga",cansado:"Fatiga",malestar:"Malestar general",
  muela:"Dolor de muelas",ronquera:"Disfonía",afonia:"Disfonía","sin voz":"Disfonía",espalda:"Dolor de espalda",rodilla:"Dolor de rodilla",corte:"Herida / corte",herida:"Herida / corte",picazon:"Prurito",rasquiña:"Prurito",oido:"Dolor de oído"};

// ---------------------------------------------------------------- validación (la llama migrar de app.js)
function migrarSalud(st,{ISO,ID,normA}){
  const s=(v,n)=>v==null?"":String(v).slice(0,n),num=(v,a,b)=>{const x=+v;return Number.isFinite(x)&&x>=a&&x<=b?x:0},iso=v=>ISO.test(String(v||""))?String(v):"",hh=v=>RE_H.test(String(v||""))?String(v):"",dt=v=>RE_DT.test(String(v||""))?String(v):"";
  const lst=(v,n,m)=>(Array.isArray(v)?v:[]).map(x=>s(x,n).trim()).filter(Boolean).slice(0,m);
  st.salud=(Array.isArray(st.salud)?st.salud:[]).filter(r=>r&&typeof r==="object"&&ISO.test(String(r.fecha))).map(r=>{
    const o={id:ID.test(String(r.id))?String(r.id):uid(),tipo:STIPOS[r.tipo]?r.tipo:"nota",titulo:s(r.titulo,300),texto:s(r.texto,200000),fecha:String(r.fecha),hora:hh(r.hora),fechaFin:iso(r.fechaFin),horaFin:hh(r.horaFin),
      personas:[...new Set(lst(r.personas,120,12))],sintomas:[...new Set(lst(r.sintomas,80,40))],lugar:s(r.lugar,300),medico:s(r.medico,200),esp:s(r.esp,120),estado:SESTADOS.some(e=>e[0]===r.estado)?r.estado:"",
      meds:(Array.isArray(r.meds)?r.meds:[]).filter(m=>m&&String(m.n||"").trim()).map(m=>({n:s(m.n,200).trim(),dosis:s(m.dosis,120),cadaH:num(m.cadaH,0,720),dias:Math.round(num(m.dias,0,3650)),desde:iso(m.desde),hora:hh(m.hora),nota:s(m.nota,300)})).slice(0,20),
      vacunas:(Array.isArray(r.vacunas)?r.vacunas:[]).filter(v=>v&&String(v.v||"").trim()).map(v=>({p:s(v.p,120),v:s(v.v,200).trim(),dosis:s(v.dosis,80),refuerzo:iso(v.refuerzo)})).slice(0,20),
      medidas:{},inc:null,
      adjuntos:(Array.isArray(r.adjuntos)?r.adjuntos:[]).filter(a=>a&&typeof a==="object").map(normA).slice(0,200),
      enlaces:(Array.isArray(r.enlaces)?r.enlaces:[]).filter(l=>l&&/^https?:\/\//i.test(String(l.url))).map(l=>({url:s(l.url,2000),titulo:s(l.titulo,300),modo:l.modo==="completo"?"completo":"titulo",captura:/^[0-9a-f]{64}$/.test(String(l.captura||""))?String(l.captura):""})).slice(0,100),
      fuentes:(Array.isArray(r.fuentes)?r.fuentes:[]).filter(f=>f&&/^https:\/\//i.test(String(f.url))).map(f=>({de:["capacities","notion"].includes(f.de)?f.de:"otro",url:s(f.url,500),archivos:lst(f.archivos,200,30)})).slice(0,5),
      movs:(Array.isArray(r.movs)?r.movs:[]).map(String).filter(x=>ID.test(x)).slice(0,20),
      creado:dt(r.creado)||new Date().toISOString(),editado:dt(r.editado),
      versiones:(Array.isArray(r.versiones)?r.versiones:[]).filter(v=>v&&RE_DT.test(String(v.t))).map(v=>({t:String(v.t),titulo:s(v.titulo,300),texto:s(v.texto,200000)})).slice(-30)};
    const md0=r.medidas&&typeof r.medidas==="object"?r.medidas:{};for(const [k,a,b] of [["temp",30,45],["peso",0.5,400],["talla",20,250],["fc",20,250]]){const x=num(md0[k],a,b);if(x)o.medidas[k]=x}if(md0.pa&&/^\d{2,3}\/\d{2,3}$/.test(String(md0.pa)))o.medidas.pa=String(md0.pa);
    if(r.inc&&typeof r.inc==="object"&&ISO.test(String(r.inc.desde)))o.inc={desde:String(r.inc.desde),dias:Math.round(num(r.inc.dias,0,365))};
    if(o.fechaFin&&o.fechaFin<o.fecha)o.fechaFin="";return o});
  st.perfilesSalud=(Array.isArray(st.perfilesSalud)?st.perfilesSalud:[]).filter(p=>p&&typeof p==="object"&&String(p.nombre||"").trim()).map(p=>({id:ID.test(String(p.id))?String(p.id):uid(),nombre:s(p.nombre,120).trim(),
    nac:iso(p.nac),sangre:s(p.sangre,10),eps:s(p.eps,200),alergias:s(p.alergias,2000),condiciones:s(p.condiciones,5000),medico:s(p.medico,300),notas:s(p.notas,20000),creado:dt(p.creado)||new Date().toISOString(),editado:dt(p.editado)}));
  st.sintomas=Array.isArray(st.sintomas)?[...new Set(lst(st.sintomas,80,500))]:SINT_DEF.slice()}
const huellaS=r=>JSON.stringify([r.tipo,r.titulo,r.texto,r.fecha,r.hora,r.fechaFin,r.horaFin,r.personas,r.sintomas,r.lugar,r.medico,r.esp,r.estado,r.meds,r.vacunas,r.medidas,r.inc,(r.adjuntos||[]).map(a=>a.sha||a.url||"").join(","),JSON.stringify(r.enlaces||[]),r.movs,(r.versiones||[]).length]);
const huellaP=p=>JSON.stringify([p.nombre,p.nac,p.sangre,p.eps,p.alergias,p.condiciones,p.medico,p.notas]);
const huellasS=L=>{const o={};for(const r of L||[])o[r.id]=huellaS(r);return o};
const huellasP=L=>{const o={};for(const p of L||[])o[p.id]=huellaP(p);return o};

// ---------------------------------------------------------------- personas, fechas y utilidades
const sIco=t=>(STIPOS[t]||STIPOS.nota)[0],sNom=t=>(STIPOS[t]||STIPOS.nota)[1];
const nomPer=n=>{const f=fichaDe(n,"persona");return f?f.nombre:n};
const clavesPer=n=>{const f=fichaDe(n,"persona");return f?[f.nombre,...f.alias].map(claveF):[claveF(n)]};
const esDe=(r,n)=>{const k=clavesPer(n);return r.personas.some(p=>k.includes(claveF(p))||k.includes(claveF(nomPer(p))))};
function famSalud(){const m=new Map();const add=n=>{const nm=nomPer(n);if(!m.has(claveF(nm)))m.set(claveF(nm),nm)};
  const fam=(S.fichas||[]).filter(f=>f.tipo==="persona"&&f.datos&&f.datos.salud),ord=f=>{const r=(f.datos.rel||"").toLowerCase();return r==="yo"?0:/pareja|espos/.test(r)?1:/hij/.test(r)?2:(f.datos.grupo==="familia cercana"?3:4)};
  fam.sort((a,b)=>ord(a)-ord(b)||a.nombre.localeCompare(b.nombre)).forEach(f=>add(f.nombre));
  for(const p of S.perfilesSalud||[])add(p.nombre);const cnt={};for(const r of S.salud||[])for(const p of r.personas)cnt[nomPer(p)]=(cnt[nomPer(p)]||0)+1;
  Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).forEach(add);return[...m.values()]}
// núcleo familiar: quién entra en las estadísticas (las demás personas se ven en su perfil y en el historial)
const fueraS=()=>new Set((S.saludFuera||[]).map(claveF));
const enNucleo=n=>!fueraS().has(claveF(nomPer(n)));
const recNucleo=r=>!r.personas.length||r.personas.some(enNucleo);
const famStats=()=>TS.circ==="todos"?famSalud():famSalud().filter(enNucleo);
const recVis=r=>TS.circ==="todos"||recNucleo(r);
function selCirc(){const F=famSalud().filter(n=>!enNucleo(n));return F.length?`<div class="filters"><div class="seg">${[["nucleo","🏠 Núcleo familiar"],["todos","👥 Todos"]].map(([k,l])=>`<button data-scirc="${k}" class="${(TS.circ||"nucleo")===k?"on":""}">${l}</button>`).join("")}</div><span class="small muted">Fuera de las estadísticas: ${F.map(esc).join(", ")} · <a href="#" data-snuc="1">cambiar</a></span></div>`:`<p class="small muted" style="margin:0 0 6px"><a href="#" data-snuc="1">⚙ Elegir quién entra en las estadísticas</a></p>`}
function dlgNucleo(){const P=famSalud(),F=fueraS();
  dlg("🏠 Núcleo familiar",`<p class="small">Marca a quienes quieres en el resumen y las estadísticas de Salud. Los demás siguen con su perfil, su historia y sus recordatorios; solo no se suman a los totales ni a las gráficas.</p>
   <div class="opc">${P.map(n=>`<label class="fchip ${F.has(claveF(n))?"off":"on"}"><input type="checkbox" class="sNuc" value="${esc(n)}" ${F.has(claveF(n))?"":"checked"} hidden>${esc(n)}${relDe(n)?` <span class="small">· ${esc(relDe(n))}</span>`:""}</label>`).join("")}</div>`,
   [["Cancelar","",cerrar],["Guardar","p",()=>{S.saludFuera=[...document.querySelectorAll(".sNuc")].filter(x=>!x.checked).map(x=>x.value);changed();cerrar();render()}]]);
  document.querySelectorAll(".sNuc").forEach(x=>x.onchange=()=>{x.parentElement.className="fchip "+(x.checked?"on":"off")})}
const COLP=["#185FA5","#9C5BB5","#2E8B57","#C0612B","#B8336A","#5F6B7A","#8A6D1F"];
const colPer=n=>{const L=famSalud(),i=L.findIndex(x=>claveF(x)===claveF(nomPer(n)));return COLP[(i<0?parseInt(hashTxt(n).slice(0,2),16):i)%COLP.length]};
const chipP=n=>`<a href="#" class="chipP" data-sper="${esc(nomPer(n))}" style="--c:${colPer(n)}">${esc(nomPer(n))}</a>`;
const relDe=n=>{const f=fichaDe(n,"persona");return f&&f.datos&&f.datos.rel&&f.datos.rel!=="yo"?f.datos.rel:""};
const perfilDe=n=>(S.perfilesSalud||[]).find(p=>clavesPer(n).includes(claveF(p.nombre)));
const diasS=(a,b)=>Math.round((dDe(b)-dDe(a))/864e5);
function edad(nac){if(!nac)return"";const h=hoyISO();let a=+h.slice(0,4)-+nac.slice(0,4);if(h.slice(5)<nac.slice(5))a--;if(a>=2)return a+" años";const m=(+h.slice(0,4)-+nac.slice(0,4))*12+(+h.slice(5,7)-+nac.slice(5,7))-(h.slice(8)<nac.slice(8)?1:0);return m+" meses"}
function rangoS(r,corto){let t=fechaCorta(r.fecha)+(corto?"":" "+r.fecha.slice(0,4));if(r.hora)t+=" · "+r.hora+(r.horaFin?"–"+r.horaFin:"");
  if(r.fechaFin&&r.fechaFin!==r.fecha)t+=` → ${fechaCorta(r.fechaFin)}${r.fechaFin.slice(0,4)!==r.fecha.slice(0,4)?" "+r.fechaFin.slice(0,4):""} (${diasS(r.fecha,r.fechaFin)+1} días)`;return t}
const enCurso=r=>["episodio","accidente"].includes(r.tipo)&&r.estado!=="hecho"&&(r.fechaFin?r.fechaFin>=hoyISO():diasS(r.fecha,hoyISO())<=4&&r.fecha<=hoyISO());
function finMed(m,r){const d=m.desde||r.fecha;return m.dias?masDias(d,m.dias-1):r.fechaFin||d}
const medActiva=(m,r)=>{const h=hoyISO(),d=m.desde||r.fecha;return d<=h&&finMed(m,r)>=h&&r.estado!=="cancelada"};
function proxDosis(m,r){if(!m.cadaH||!m.hora)return"";const t0=new Date((m.desde||r.fecha)+"T"+m.hora+":00").getTime(),fin=new Date(finMed(m,r)+"T23:59:00").getTime(),p=m.cadaH*3600e3,ahora=Date.now();
  const k=Math.max(0,Math.ceil((ahora-t0)/p)),t=t0+k*p;if(t>fin)return"";const d=new Date(t);return(fISO(d)===hoyISO()?"hoy":fechaCorta(fISO(d)))+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
function vacunasDe(n){const out=[];for(const r of S.salud||[]){if(r.tipo!=="vacuna"&&!(r.vacunas||[]).length)continue;
    if((r.vacunas||[]).length){for(const v of r.vacunas)if(v.p?clavesPer(n).includes(claveF(v.p)):esDe(r,n))out.push({r,v})}else if(esDe(r,n))out.push({r,v:{v:r.titulo||"Vacuna",dosis:"",refuerzo:""}})}
  return out.sort((a,b)=>b.r.fecha.localeCompare(a.r.fecha))}
function medidasDe(n){return(S.salud||[]).filter(r=>esDe(r,n)&&Object.keys(r.medidas||{}).length).sort((a,b)=>b.fecha.localeCompare(a.fecha))}

// ---------------------------------------------------------------- captura rápida en palabras
function leerSalud(t){const n0=normK(t),modo=modoTexto(t,/\b(cita|consulta|control|vacuna|examen|terapia|pediatra|odontolog)/.test(n0)?"futuro":"pasado"),r=leerCuando(t,hoyISO(),{modo}),n=" "+normK(t).replace(/[.,;:!?()]/g," ")+" ";const per=[],sin=new Set();
  for(const f of (S.fichas||[]).filter(f=>f.tipo==="persona"))for(const k of [f.nombre,...f.alias].map(claveF).filter(k=>k.length>=2))if(new RegExp("[\\s@\\[]"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"[\\s\\]]").test(n)){if(!per.includes(f.nombre))per.push(f.nombre);break}
  for(const m of menciones(t))if(m.tipo==="persona"&&!per.some(p=>claveF(p)===claveF(nomPer(m.nombre))))per.push(nomPer(m.nombre));
  for(const c of S.sintomas||SINT_DEF){const k=normK(c);if(k.length>=3&&n.includes(" "+k))sin.add(c)}
  for(const [k,v] of Object.entries(SIN_SIN))if(new RegExp("\\s"+k+"\\s").test(n)){const c=(S.sintomas||SINT_DEF).find(x=>normK(x)===normK(v))||v;sin.add(c)}
  if(sin.has("Dolor estomacal")||sin.has("Dolor de garganta")||sin.has("Dolor de cabeza"))sin.delete("Malestar general");
  if(/(cayo|caida|se le cayo|perdio|saco|sacaron)\s.{0,25}(diente|muela|colmillo)/.test(n))sin.add((S.sintomas||SINT_DEF).find(x=>normK(x)==="caida de diente")||"Caída de diente");
  const tm=(" "+normK(t)+" ").match(/[\s(](3[5-9]|4[0-2])[.,'´](\d)(?!\d)/);const temp=tm?+(tm[1]+"."+tm[2]):0;
  if(temp>=38)sin.add("Fiebre");else if(temp>=37.3)sin.add("Febrícula");if(temp>=38)sin.delete("Febrícula");
  const ca=n.match(/cada\s+(\d{1,2})\s*(h|horas)/);
  let tipo=/\svacun/.test(n)?"vacuna":/\s(cita|consulta|pediatra|medico|medica|doctor|doctora|odontolog|dentista|terapia|optometr|ortopt|urgencias|especialista)/.test(n)?"cita":ca?"medicamento":/\s(examen|examenes|laboratorio|hemograma|radiograf|ecograf|resonancia)/.test(n)?"examen":/\s(golpe|corte|esguince|fractura|accidente|quemadura|cayo|caida)\s/.test(n)&&!sin.has("Caída de diente")?"accidente":sin.size&&!(sin.size===1&&(sin.has("Caída de diente")||sin.has("Control sano")))?"episodio":"nota";
  const lug=typeof lugarEn==="function"?lugarEn(t):null;
  if(lug&&(tipo==="nota"||tipo==="episodio")&&/\s(fui|fue|fuimos|fueron|voy|vamos|ir)\s+(a|al)\s/.test(n)&&(S.salud||[]).some(x=>x.tipo==="cita"&&x.lugar&&(claveF(x.lugar)===claveF(lug.nombre)||claveF(x.lugar).includes(claveF(lug.nombre)))))tipo="cita";
  return{r,personas:per,sintomas:[...sin],temp,cadaH:ca?+ca[1]:0,tipo,lugar:lug?lug.nombre:""}}
function previewQS(){const t=($("#sq")||{}).value||"";const el=$("#sqP");if(!t.trim()){if(el)el.innerHTML="Ej.: «Sofi fiebre 38.5 y tos desde ayer» · «mañana 7 am cita pediatra Tomás» · «Ana amoxicilina cada 8 horas por 7 días». Reconozco persona, síntomas, temperatura, fecha y tipo.";return null}
  const x=leerSalud(t),f=x.r.fecha||hoyISO();
  if(el)el.innerHTML=`${sIco(x.tipo)} <b>${esc(sNom(x.tipo))}</b> · ${x.personas.length?x.personas.map(esc).join(", "):'<span class="neg">¿de quién? (escribe el nombre)</span>'} · ${x.r.fecha?esc(cuandoTxt(x.r)):"hoy"+(x.r.hora?" "+x.r.hora:"")}${x.lugar?" · 📍 "+esc(x.lugar):""}${x.sintomas.length?" · "+x.sintomas.map(esc).join(", "):""}${x.temp?" · 🌡 "+x.temp+" °C":""}${x.cadaH?" · cada "+x.cadaH+" h":""}`+sugerenciasHtml(t,"sq");if(el)bindSugerencias("sq",previewQS);
  return{x,t,f}}
function guardarQS(){const p=previewQS();if(!p)return;const {x,t,f}=p;const ah=new Date().toISOString();
  const r={id:uid(),tipo:x.tipo,titulo:(x.r.titulo||t).slice(0,300),texto:"",fecha:f,hora:x.r.hora||(f===hoyISO()&&x.tipo!=="cita"?ahoraHM():""),fechaFin:x.r.fechaFin||"",horaFin:x.r.horaFin||"",personas:x.personas,sintomas:x.sintomas,lugar:x.lugar||"",medico:"",esp:"",estado:x.tipo==="cita"&&f>=hoyISO()?"pendiente":"",
    meds:[],vacunas:[],medidas:x.temp?{temp:x.temp}:{},inc:null,adjuntos:[],enlaces:[],fuentes:[],movs:[],creado:ah,editado:"",versiones:[]};
  if(x.tipo==="medicamento"){const no=new Set(["para","tomar","toma","darle","dar","cada","horas","hora","desde","dias","durante","empezar","empieza","inicio","manana","hoy","ayer","pastilla","pastillas","jarabe","gotas","tableta","tabletas"]),pk=new Set(x.personas.flatMap(clavesPer).flatMap(k=>k.split(" ")));
    const w=(t.split(/[^A-Za-zÁÉÍÓÚáéíóúñÑüÜ]+/).find(p=>p.length>=4&&!no.has(normK(p))&&!pk.has(normK(p)))||"");const nm=w?w.charAt(0).toUpperCase()+w.slice(1).toLowerCase():"";const dd=normK(t).match(/(\d{1,3})\s*dias/);r.meds=[{n:nm||"Medicamento",dosis:"",cadaH:x.cadaH,dias:dd?+dd[1]:0,desde:f,hora:x.r.hora||ahoraHM(),nota:""}]}
  (S.salud=S.salud||[]).push(r);asegurarFichas(t);changed();$("#sq").value="";
  deshacer("Registro de salud guardado",()=>{S.salud=S.salud.filter(y=>y.id!==r.id);changed();render()});render()}

// ---------------------------------------------------------------- tarjetas
function tarjetaS(r,{conFecha,corto}={}){const ex=(r.texto||"").split("\n").filter(l=>l.trim()).slice(0,2).join("\n"),cur=enCurso(r);
  const meds=(r.meds||[]).map(m=>`💊 ${esc(m.n)}${m.dosis?" "+esc(m.dosis):""}${m.cadaH?" c/"+m.cadaH+"h":""}${m.dias?" × "+m.dias+"d":""}`).join(" · ");
  return`<div class="it sal t-${r.tipo}${cur?" curso":""}" data-s="${esc(r.id)}"><div class="ih"><span class="hr2">${conFecha?esc(rangoS(r,corto)):r.hora||""}</span><b>${sIco(r.tipo)} ${esc(limpiaMen(r.titulo)||sNom(r.tipo))}</b>${cur?'<span class="chip warn">en curso</span>':""}${r.estado&&r.estado!=="hecho"?`<span class="chip">${esc(r.estado)}</span>`:""}${typeof chipVin==="function"?chipVin("s:"+r.id):""}</div>
    <div class="small">${r.personas.map(chipP).join(" ")}${r.sintomas.length?` <span class="muted">· ${r.sintomas.map(esc).join(", ")}</span>`:""}${r.medidas&&r.medidas.temp?` · 🌡 ${r.medidas.temp}`:""}${!conFecha&&r.fechaFin&&r.fechaFin!==r.fecha?` · hasta ${esc(fechaCorta(r.fechaFin))}`:""}</div>
    ${r.lugar||r.esp||r.medico?`<div class="small muted">${[r.esp,r.medico,r.lugar&&"📍 "+r.lugar].filter(Boolean).map(esc).join(" · ")}</div>`:""}${meds?`<div class="small">${meds}</div>`:""}
    ${ex?`<div class="ex">${mdF(ex,r.fecha)}</div>`:""}${galeria(r,{chico:true})}${(r.fuentes||[]).some(f=>f.archivos.length)?`<div class="small muted">📎 ${r.fuentes.reduce((a,f)=>a+f.archivos.length,0)} archivo(s) en ${esc(r.fuentes.map(f=>f.de==="capacities"?"Capacities":f.de==="notion"?"Notion":"otro").join(", "))}</div>`:""}</div>`}
function saludDeFicha(f){const L=(S.salud||[]).filter(r=>esDe(r,f.nombre)).sort((a,b)=>b.fecha.localeCompare(a.fecha));if(!L.length)return"";
  return`<div class="card"><h2>🩺 Salud <span class="small muted">${L.length} registros</span></h2>${L.slice(0,8).map(r=>tarjetaS(r,{conFecha:true})).join("")}<button class="b s" data-sperfil="${esc(f.nombre)}">Abrir su perfil de salud</button></div>`}

// ---------------------------------------------------------------- vista principal
function vSalud(){if(!S.sintomas)S.sintomas=SINT_DEF.slice();
  let h=`<div class="cap card"><div class="caprow"><input id="sq" placeholder="«Sofi fiebre 38.5 y tos» · «mañana 7 am cita pediatra Tomás» · «amoxicilina cada 8 horas por 7 días para Ana»" autocomplete="off"><button class="b p" id="sqG">Guardar</button></div>
    <div id="sqP" class="small muted"></div><div class="filters" style="margin:6px 0 0">${Object.entries(STIPOS).map(([k,[i,l]])=>`<button class="b s" data-snuevo="${k}">${i} ${l.split(" /")[0]}</button>`).join("")}</div></div>`;
  h+=TS.vista==="historial"?vHistS():TS.vista==="perfiles"?vPerfilesS():TS.vista==="perfil"?vPerfilS():TS.vista==="sintomas"?vSintomasS():vResumenS();
  $("#view").innerHTML=h;bindSalud();previewQS()}
function vResumenS(){const P=famStats(),h0=hoyISO(),L=(S.salud||[]).filter(recVis);
  if(!L.length&&!(S.perfilesSalud||[]).length)return`<div class="card vacio"><h2>🩺 Salud de la familia</h2><p>Aquí quedan citas, enfermedades con sus síntomas día a día, vacunas, medicamentos con recordatorios, exámenes, fórmulas e incapacidades, de cada persona. Escribe arriba lo que pasa, o importa tu historial (Datos › Importar paquete).</p><button class="b p" id="sPerN">+ Crear perfil</button></div>`;
  const prox=L.filter(r=>r.tipo==="cita"&&r.fecha>=h0&&!["cancelada","no asistió"].includes(r.estado)).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
  const refz=[];for(const n of P)for(const {r,v} of vacunasDe(n))if(v.refuerzo&&v.refuerzo>=masDias(h0,-30))refz.push({n,r,v});refz.sort((a,b)=>a.v.refuerzo.localeCompare(b.v.refuerzo));
  const act=[];for(const r of L)for(const m of r.meds||[])if(medActiva(m,r))act.push({r,m});
  const cur=L.filter(enCurso);
  let h=selCirc()+`<div class="pcards">${P.map(n=>{const pf=perfilDe(n),R=L.filter(r=>esDe(r,n)),u12=R.filter(r=>r.fecha>=masDias(h0,-365)),ep=u12.filter(r=>r.tipo==="episodio"),ci=u12.filter(r=>r.tipo==="cita");
      const cnt={};for(const r of ep)for(const s of r.sintomas)cnt[s]=(cnt[s]||0)+1;const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3);const md1=medidasDe(n).find(r=>r.medidas.peso||r.medidas.talla),ult=R.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
      return`<div class="card pcard" style="--c:${colPer(n)}"><div class="ih click" data-sper="${esc(n)}"><h2 style="margin:0">👤 ${esc(n)}</h2><span class="small muted">${[relDe(n),pf&&pf.nac&&edad(pf.nac)].filter(Boolean).map(esc).join(" · ")}</span></div>
        <div class="small">${ep.length} episodios y ${ci.length} citas en 12 meses${top.length?`<div class="muted">más frecuente: ${top.map(([s,c])=>esc(s)+" ("+c+")").join(", ")}</div>`:""}</div>
        ${md1?`<div class="small">📏 ${md1.medidas.peso?md1.medidas.peso+" kg ":""}${md1.medidas.talla?md1.medidas.talla+" cm ":""}<span class="muted">(${esc(md1.fecha)})</span></div>`:""}
        ${pf&&pf.alergias?`<div class="small neg">⚠️ Alergias: ${esc(pf.alergias)}</div>`:""}${ult?`<div class="small muted">Último: ${esc(ult.fecha)} · ${sIco(ult.tipo)} ${esc(limpiaMen(ult.titulo))}</div>`:""}</div>`}).join("")}</div>
   <div class="g2"><div>${cur.length?`<div class="card"><h2>🤒 En curso</h2>${cur.map(r=>tarjetaS(r,{conFecha:true,corto:true})+`<div class="filters" style="margin:-4px 0 8px"><button class="b s" data-evo="${esc(r.id)}">✍️ Anotar cómo sigue</button><button class="b s" data-fin="${esc(r.id)}">✅ Ya se recuperó</button></div>`).join("")}</div>`:""}
    ${act.length?`<div class="card"><h2>💊 Medicamentos activos</h2>${act.map(({r,m})=>`<div class="it click" data-s="${esc(r.id)}"><b>${esc(m.n)}</b> ${esc(m.dosis)} ${m.cadaH?"cada "+m.cadaH+" h":""} <span class="small muted">hasta ${esc(fechaCorta(finMed(m,r)))} · ${r.personas.map(esc).join(", ")}</span>${proxDosis(m,r)?`<div class="small">⏰ próxima dosis: <b>${esc(proxDosis(m,r))}</b></div>`:""}</div>`).join("")}</div>`:""}
    <div class="card"><h2>🩺 Próximas citas</h2>${prox.length?prox.slice(0,8).map(r=>tarjetaS(r,{conFecha:true,corto:true})).join(""):'<p class="small muted">Sin citas futuras anotadas.</p>'}</div>
    ${refz.length?`<div class="card"><h2>💉 Refuerzos de vacunas</h2>${refz.slice(0,10).map(({n,v,r})=>`<div class="it click" data-s="${esc(r.id)}">${v.refuerzo<h0?"⚠️":"📅"} <b>${esc(v.refuerzo)}</b> · ${esc(n)}: ${esc(v.v)}</div>`).join("")}</div>`:""}</div>
   <div><div class="card"><h2>📋 Lo más reciente</h2>${L.slice().sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora)).filter(r=>r.fecha<=h0).slice(0,8).map(r=>tarjetaS(r,{conFecha:true,corto:true})).join("")}<button class="b s" data-sv="historial">Ver todo el historial →</button></div></div></div>`;
  return h}
function filtrarS(){const q=normK(TS.q);return(S.salud||[]).filter(r=>(!TS.per||esDe(r,TS.per))&&(!TS.tipo||r.tipo===TS.tipo)&&(!TS.sint||r.sintomas.includes(TS.sint))&&(!TS.anio||r.fecha.startsWith(TS.anio))&&
    (!q||normK([r.titulo,r.texto,r.lugar,r.medico,r.esp,r.sintomas.join(" "),r.personas.join(" "),(r.meds||[]).map(m=>m.n+" "+m.dosis).join(" "),(r.vacunas||[]).map(v=>v.v).join(" "),(r.adjuntos||[]).map(a=>a.original||a.nombre).join(" "),(r.fuentes||[]).map(f=>f.archivos.join(" ")).join(" ")].join(" ")).includes(q)))
  .sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora))}
function filtrosHtmlS(){const anios=[...new Set((S.salud||[]).map(r=>r.fecha.slice(0,4)))].sort().reverse(),usados=[...new Set((S.salud||[]).flatMap(r=>r.sintomas))].sort((a,b)=>a.localeCompare(b));
  return`<div class="filters"><input id="sB" placeholder="🔎 Buscar: medicamento, médico, síntoma, archivo…" value="${esc(TS.q)}" style="flex:1;min-width:180px">
    <select id="sFp"><option value="">Todos</option>${(()=>{const o=n=>`<option ${TS.per===n?"selected":""}>${esc(n)}</option>`,N=famSalud().filter(enNucleo),O=famSalud().filter(n=>!enNucleo(n));return O.length?`<optgroup label="Núcleo familiar">${N.map(o).join("")}</optgroup><optgroup label="Otras personas">${O.map(o).join("")}</optgroup>`:N.map(o).join("")})()}</select>
    <select id="sFt"><option value="">Todo tipo</option>${Object.entries(STIPOS).map(([k,[i,l]])=>`<option value="${k}" ${TS.tipo===k?"selected":""}>${i} ${esc(l)}</option>`).join("")}</select>
    <select id="sFs"><option value="">Cualquier síntoma</option>${usados.map(s=>`<option ${TS.sint===s?"selected":""}>${esc(s)}</option>`).join("")}</select>
    <select id="sFa"><option value="">Todos los años</option>${anios.map(a=>`<option ${TS.anio===a?"selected":""}>${a}</option>`).join("")}</select></div>`}
function vHistS(){const L=filtrarS();TS.sel=TS.sel||new Set();let h=filtrosHtmlS()+`<div class="filters" style="margin:6px 0"><span class="small muted">${L.length} registros</span><span class="sp"></span>${TS.elegir?`<button class="b s" id="sSelT">Marcar todos</button><button class="b s" id="sSelN">Ninguno</button><button class="b s p" id="sExpSel">📤 Exportar ${TS.sel.size} elegidos</button><button class="b s" id="sElegir">Terminar</button>`:`<button class="b s" id="sElegir">☑ Elegir registros</button><button class="b s" id="sExpF">📤 Exportar lo filtrado</button>`}</div>`,mes="";
  for(const r of L.slice(0,400)){const m=r.fecha.slice(0,7);if(m!==mes){mes=m;h+=`<div class="dsep">${MESL[+m.slice(5)-1]} ${m.slice(0,4)}</div>`}h+=TS.elegir?`<div class="selw"><input type="checkbox" data-sel="${esc(r.id)}" ${TS.sel.has(r.id)?"checked":""}>${tarjetaS(r,{conFecha:true,corto:true})}</div>`:tarjetaS(r,{conFecha:true,corto:true})}
  return h+(L.length>400?`<p class="small muted">y ${L.length-400} más: usa los filtros.</p>`:"")}
function vPerfilesS(){const P0=famSalud(),fichas=(S.fichas||[]).filter(f=>f.tipo==="persona"&&!P0.some(n=>claveF(n)===claveF(f.nombre)));void fichas;
  const tarj=P=>`<div class="pcards">${P.map(n=>{const pf=perfilDe(n);return`<div class="card pcard click" style="--c:${colPer(n)}" data-sper="${esc(n)}"><h2>👤 ${esc(n)}</h2>${relDe(n)?`<div class="small"><span class="chip">${esc(relDe(n))}</span></div>`:""}<div class="small muted">${pf?[pf.nac&&edad(pf.nac),pf.sangre&&"🩸 "+pf.sangre,pf.eps].filter(Boolean).map(esc).join(" · ")||"Perfil sin datos todavía":"Sin perfil (toca para crearlo)"}</div><div class="small">${(S.salud||[]).filter(r=>esDe(r,n)).length} registros</div><div class="small"><a href="#" data-smov="${esc(n)}">${enNucleo(n)?"Sacar de las estadísticas":"Pasar al núcleo familiar"}</a></div></div>`}).join("")}</div>`,N=P0.filter(enNucleo),O=P0.filter(n=>!enNucleo(n));
  return`<h2 class="sub">🏠 Núcleo familiar <span class="small muted">(entra en el resumen y las estadísticas)</span></h2>${tarj(N)}${O.length?`<h2 class="sub">👥 Otras personas <span class="small muted">(solo su perfil e historia)</span></h2>${tarj(O)}`:""}
   <div class="filters"><button class="b p" id="sPar">+ Pariente o persona cercana</button></div><p class="small muted">Las personas se definen en el área de 👥 Personas (Diario): ahí van sus datos de contacto y su relación (papá, tía, suegro…). Las marcadas «🩺 en Salud» aparecen aquí.</p>`}
function vPerfilS(){const n=TS.perfil,pf=perfilDe(n),f=fichaDe(n,"persona"),R=(S.salud||[]).filter(r=>esDe(r,n)).sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora));
  const V=vacunasDe(n),M=medidasDe(n),meds=[];for(const r of R)for(const m of r.meds||[])meds.push({r,m});const adj=R.flatMap(r=>(r.adjuntos||[]).filter(a=>a.tipo!=="enlace").map(a=>({a,r})));
  const diario=f?usosFicha(f).ent.length:0;const cnt={};for(const r of R.filter(r=>r.tipo==="episodio"))for(const s of r.sintomas)cnt[s]=(cnt[s]||0)+1;
  return`<div class="filters"><button class="b s" data-sv="perfiles">← Perfiles</button></div>
   <div class="card pcard" style="--c:${colPer(n)}"><div class="ih"><h2 style="margin:0">👤 ${esc(n)}</h2><span class="sp"></span><button class="b s" id="sPerE">${pf?"Editar perfil":"Crear perfil"}</button><button class="b s p" data-snuevo="episodio" data-para="${esc(n)}">+ Registro</button><button class="b s" id="sExpP">📤 Compartir su historia</button><button class="b s" id="sPerD">👤 Ficha y contacto${diario?` · ${diario} en el diario`:""}</button></div>
    ${relDe(n)?`<div class="small"><span class="chip">${esc(relDe(n))}</span></div>`:""}${pf?`<div class="kv small">${[["Nacimiento",pf.nac&&pf.nac+" ("+edad(pf.nac)+")"],["Sangre",pf.sangre],["EPS / prepagada",pf.eps],["Médico de cabecera",pf.medico],["Alergias",pf.alergias],["Condiciones",pf.condiciones]].filter(x=>x[1]).map(([k,v])=>`<div><span class="muted">${k}</span> ${esc(v)}</div>`).join("")}</div>${pf.notas?`<div class="mdv">${md(pf.notas)}</div>`:""}`:'<p class="small muted">Sin perfil: fecha de nacimiento, tipo de sangre, EPS, alergias…</p>'}</div>
   <div class="kpis"><div class="kpi"><div class="l">🤒 Episodios</div><div class="v">${R.filter(r=>r.tipo==="episodio").length}</div></div><div class="kpi"><div class="l">🩺 Citas</div><div class="v">${R.filter(r=>r.tipo==="cita").length}</div></div><div class="kpi"><div class="l">💉 Vacunas</div><div class="v">${V.length}</div></div><div class="kpi"><div class="l">📎 Archivos</div><div class="v">${adj.length}</div></div></div>
   <div class="g2"><div><h2 class="sub">Historia</h2>${R.map(r=>tarjetaS(r,{conFecha:true})).join("")||'<p class="small muted">Sin registros.</p>'}</div>
    <div>${Object.keys(cnt).length?`<div class="card"><h2>📊 Síntomas más frecuentes</h2>${barrasS(Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,10),colPer(n))}</div>`:""}
     <div class="card"><h2>💉 Vacunas</h2>${V.length?`<div class="tw"><table><tr><th>Fecha</th><th>Vacuna</th><th>Refuerzo</th></tr>${V.map(({r,v})=>`<tr class="click" data-s="${esc(r.id)}"><td>${esc(r.fecha)}</td><td>${esc(v.v)}${v.dosis?` <span class="muted">${esc(v.dosis)}</span>`:""}</td><td>${esc(v.refuerzo)}</td></tr>`).join("")}</table></div>`:'<p class="small muted">Ninguna anotada.</p>'}</div>
     ${meds.length?`<div class="card"><h2>💊 Medicamentos</h2>${meds.slice(0,30).map(({r,m})=>`<div class="small click" data-s="${esc(r.id)}">${medActiva(m,r)?"🟢":"⚪"} <b>${esc(m.n)}</b> ${esc(m.dosis)}${m.cadaH?" cada "+m.cadaH+" h":""}${m.dias?" · "+m.dias+" días":""} <span class="muted">${esc(m.desde||r.fecha)}</span></div>`).join("")}</div>`:""}
     ${M.length?`<div class="card"><h2>📏 Medidas</h2><div class="tw"><table><tr><th>Fecha</th><th>Peso</th><th>Talla</th><th>Temp.</th></tr>${M.slice(0,40).map(r=>`<tr class="click" data-s="${esc(r.id)}"><td>${esc(r.fecha)}</td><td>${r.medidas.peso?r.medidas.peso+" kg":""}</td><td>${r.medidas.talla?r.medidas.talla+" cm":""}</td><td>${r.medidas.temp?r.medidas.temp+" °C":""}</td></tr>`).join("")}</table></div></div>`:""}
     ${adj.length?`<div class="card"><h2>📎 Fórmulas, órdenes y fotos</h2><div class="gal">${adj.filter(x=>esImg(x.a)).slice(0,30).map(x=>`<img data-mini="${x.a.sha}" data-ver="${x.a.sha}" alt="">`).join("")}</div>${adj.filter(x=>!esImg(x.a)).map(x=>`<div class="small"><a href="#" data-abrir="${x.a.sha}">${esAud(x.a)?"🎙":/pdf/.test(x.a.mime)?"📄":"📎"} ${esc(x.a.original||x.a.nombre)}</a> <span class="muted">${esc(x.r.fecha)}</span></div>`).join("")}</div>`:""}</div></div>`}
function barrasS(pares,col){const mx=Math.max(1,...pares.map(p=>p[1]));return pares.map(([k,v])=>`<div class="sbar"><span class="sbl">${esc(k)}</span><span class="sbt"><span style="width:${Math.round(v/mx*100)}%;background:${col||"var(--pri2)"}"></span></span><span class="sbn">${v}</span></div>`).join("")}
function vSintomasS(){const anio=TS.anio||"",P=famStats(),E=(S.salud||[]).filter(recVis).filter(r=>["episodio","accidente","cita"].includes(r.tipo)&&(!anio||r.fecha.startsWith(anio)));
  const anios=[...new Set((S.salud||[]).map(r=>r.fecha.slice(0,4)))].sort().reverse();const uso={};for(const r of S.salud||[])for(const s of r.sintomas)uso[s]=(uso[s]||0)+1;
  const tot={};for(const r of E)for(const s of r.sintomas)tot[s]=(tot[s]||0)+1;const top=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]).slice(0,25);
  const porMes={};for(const r of E.filter(r=>r.tipo==="episodio")){const m=r.fecha.slice(0,7);porMes[m]=porMes[m]||{};for(const n of r.personas.map(nomPer))porMes[m][n]=(porMes[m][n]||0)+1}
  const meses=Object.keys(porMes).sort().slice(-24),mx=Math.max(1,...meses.map(m=>Object.values(porMes[m]).reduce((a,b)=>a+b,0)));
  return selCirc()+`<div class="filters"><select id="sFa"><option value="">Todos los años</option>${anios.map(a=>`<option ${anio===a?"selected":""}>${a}</option>`).join("")}</select></div>
   <div class="card"><h2>📊 Síntomas por persona ${anio?"en "+anio:""}</h2><div class="tw"><table><tr><th>Síntoma</th>${P.map(n=>`<th style="color:${colPer(n)}">${esc(n)}</th>`).join("")}<th>Total</th></tr>
    ${top.map(s=>`<tr><td><a href="#" data-ssin="${esc(s)}">${esc(s)}</a></td>${P.map(n=>{const c=E.filter(r=>esDe(r,n)&&r.sintomas.includes(s)).length;return`<td class="r">${c||""}</td>`}).join("")}<td class="r"><b>${tot[s]}</b></td></tr>`).join("")}</table></div></div>
   ${meses.length?`<div class="card"><h2>🤒 Episodios por mes</h2><div class="smes">${meses.map(m=>{const o=porMes[m];return`<div class="smc" title="${m}"><div class="smb">${P.filter(n=>o[n]).map(n=>`<span style="height:${o[n]/mx*100}%;background:${colPer(n)}" title="${esc(n)}: ${o[n]}"></span>`).join("")}</div><div class="small">${MESN[+m.slice(5)-1]}${m.endsWith("-01")?"<br>"+m.slice(2,4):""}</div></div>`}).join("")}</div>
     <div class="small">${P.map(n=>`<span style="color:${colPer(n)}">■</span> ${esc(n)}`).join(" &nbsp; ")}</div></div>`:""}
   <div class="card"><h2>🏷️ Lista de síntomas</h2><p class="small muted">Es la lista de opciones al registrar. Toca uno para ver sus registros; ✕ quita los que no se han usado.</p><div class="chips">${(S.sintomas||[]).map(s=>`<span class="fchip on"><a href="#" data-ssin="${esc(s)}">${esc(s)}</a>${uso[s]?` <span class="muted">${uso[s]}</span>`:` <button class="x" data-sdel="${esc(s)}" title="Quitar de la lista">✕</button>`}</span>`).join(" ")}</div>
    <div class="filters"><input id="sNs" placeholder="Nuevo síntoma"><button class="b s" id="sNsA">Añadir</button></div></div>`}

function bindSalud(){const sq=$("#sq");if(sq){sq.oninput=previewQS;sq.onkeydown=ev=>{if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();guardarQS()}};$("#sqG").onclick=guardarQS}
  document.querySelectorAll("[data-snuevo]").forEach(b=>b.onclick=()=>{const p=previewQS();const pre={tipo:b.dataset.snuevo};if(b.dataset.para)pre.personas=[b.dataset.para];else if(p){Object.assign(pre,{titulo:p.x.r.titulo||p.t,fecha:p.f,hora:p.x.r.hora,fechaFin:p.x.r.fechaFin,horaFin:p.x.r.horaFin,lugar:p.x.lugar,personas:p.x.personas,sintomas:p.x.sintomas,medidas:p.x.temp?{temp:p.x.temp}:{}})}editarS(null,pre)});
  document.querySelectorAll("[data-sv]").forEach(b=>b.onclick=()=>{TS.vista=b.dataset.sv;syncTabsS();render()});
  document.querySelectorAll("[data-scirc]").forEach(b=>b.onclick=()=>{TS.circ=b.dataset.scirc;render()});document.querySelectorAll("[data-snuc]").forEach(a=>a.onclick=ev=>{ev.preventDefault();dlgNucleo()});
  document.querySelectorAll("[data-smov]").forEach(a=>a.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const n=a.dataset.smov,F=new Set(S.saludFuera||[]);const k=[...F].find(x=>claveF(x)===claveF(n));if(k)F.delete(k);else F.add(n);S.saludFuera=[...F];changed();render()});
  const sel=(id,k)=>{const e=$(id);if(e)e.onchange=()=>{TS[k]=e.value;render()}};sel("#sFp","per");sel("#sFt","tipo");sel("#sFs","sint");sel("#sFa","anio");
  if($("#sB")){const b=$("#sB");b.oninput=()=>{TS.q=b.value;clearTimeout(b._t);b._t=setTimeout(()=>{render();const i=$("#sB");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)}}
  document.querySelectorAll("[data-ssin]").forEach(a=>a.onclick=ev=>{ev.preventDefault();TS.sint=a.dataset.ssin;TS.vista="historial";syncTabsS();render()});
  document.querySelectorAll("[data-sdel]").forEach(b=>b.onclick=()=>{S.sintomas=S.sintomas.filter(s=>s!==b.dataset.sdel);changed();render()});
  if($("#sNsA"))$("#sNsA").onclick=()=>{const v=$("#sNs").value.trim();if(!v)return;if(!S.sintomas.some(s=>normK(s)===normK(v)))S.sintomas.push(v.charAt(0).toUpperCase()+v.slice(1));changed();render()};
  if($("#sPerN"))$("#sPerN").onclick=nuevoPariente;if($("#sPar"))$("#sPar").onclick=nuevoPariente;
  if($("#sPerE"))$("#sPerE").onclick=()=>editarPerfil(TS.perfil);
  if($("#sPerD"))$("#sPerD").onclick=()=>{let f=fichaDe(TS.perfil,"persona");if(!f){asegurarFichas("@["+TS.perfil+"]");f=fichaDe(TS.perfil,"persona");changed()}TD.vista="fichas";TD.ficha=f.id;irModulo("dia")};
  document.querySelectorAll("[data-evo]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();evolucionS(b.dataset.evo)});
  document.querySelectorAll("[data-fin]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();terminarS(b.dataset.fin)});
  if($("#sExpP"))$("#sExpP").onclick=()=>exportarItems((S.salud||[]).filter(r=>esDe(r,TS.perfil)).map(r=>({k:"s",r})),"Salud de "+TS.perfil);
  if($("#sExpF"))$("#sExpF").onclick=()=>exportarItems(filtrarS().map(r=>({k:"s",r})),"Salud"+(TS.per?" de "+TS.per:" de la familia")+(TS.sint?" · "+TS.sint:"")+(TS.anio?" · "+TS.anio:""));
  if($("#sElegir"))$("#sElegir").onclick=()=>{TS.elegir=!TS.elegir;if(!TS.elegir)TS.sel=new Set();render()};
  if($("#sSelT"))$("#sSelT").onclick=()=>{filtrarS().slice(0,400).forEach(r=>TS.sel.add(r.id));render()};if($("#sSelN"))$("#sSelN").onclick=()=>{TS.sel=new Set();render()};
  if($("#sExpSel"))$("#sExpSel").onclick=()=>{if(!TS.sel.size){alert("Marca los registros que quieres compartir.");return}exportarItems((S.salud||[]).filter(r=>TS.sel.has(r.id)).map(r=>({k:"s",r})),"Salud · selección")};
  document.querySelectorAll("[data-sel]").forEach(c=>c.onclick=ev=>{ev.stopPropagation();if(c.checked)TS.sel.add(c.dataset.sel);else TS.sel.delete(c.dataset.sel);const b=$("#sExpSel");if(b)b.textContent=`📤 Exportar ${TS.sel.size} elegidos`});
  bindItemsS($("#view"))}
function bindItemsS(root){bindItems(root);
  root.querySelectorAll("[data-sper]").forEach(a=>a.onclick=ev=>{ev.preventDefault();ev.stopPropagation();irPerfilS(a.dataset.sper)});
  root.querySelectorAll("[data-men]").forEach(el=>el.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const [t,n]=el.dataset.men.split("|");if(t==="persona"){irPerfilS(nomPer(n));return}let f=fichaDe(n,t);if(!f){asegurarFichas("#["+n+"]");f=fichaDe(n,t);changed()}cerrarSiAbierto();TD.vista="fichas";TD.ficha=f.id;irModulo("dia")})}
function irPerfilS(n){cerrarSiAbierto();TS.vista="perfil";TS.perfil=nomPer(n);if(MOD!=="sal")irModulo("sal");else{syncTabsS();render()}}
function syncTabsS(){document.querySelectorAll("#tabsS button").forEach(x=>x.classList.toggle("on",x.dataset.ts===TS.vista||(TS.vista==="perfil"&&x.dataset.ts==="perfiles")))}

// ---------------------------------------------------------------- ver un registro
function verS(id){const r=(S.salud||[]).find(x=>x.id===id);if(!r)return;
  dlg(`${sIco(r.tipo)} ${limpiaMen(r.titulo)||sNom(r.tipo)}`,`<div class="small muted">${esc(sNom(r.tipo))} · ${esc(rangoS(r))}${r.estado?" · "+esc(r.estado):""}</div>
    <div style="margin:6px 0">${r.personas.map(chipP).join(" ")}</div>
    ${r.sintomas.length?`<div class="chips">${r.sintomas.map(s=>`<span class="fchip on">${esc(s)}</span>`).join(" ")}</div>`:""}
    ${r.esp||r.medico||r.lugar?`<div class="small">${[r.esp&&"🩺 "+r.esp,r.medico&&"👩‍⚕️ "+r.medico,r.lugar&&"📍 "+r.lugar].filter(Boolean).map(esc).join(" · ")}</div>`:""}
    ${Object.keys(r.medidas||{}).length?`<div class="small">📏 ${[r.medidas.temp&&"🌡 "+r.medidas.temp+" °C",r.medidas.peso&&r.medidas.peso+" kg",r.medidas.talla&&r.medidas.talla+" cm",r.medidas.pa&&"PA "+r.medidas.pa,r.medidas.fc&&r.medidas.fc+" lpm"].filter(Boolean).join(" · ")}</div>`:""}
    ${r.inc?`<div class="small">📄 Incapacidad desde ${esc(r.inc.desde)}${r.inc.dias?" por "+r.inc.dias+" días (hasta "+esc(masDias(r.inc.desde,r.inc.dias-1))+")":""}</div>`:""}
    ${(r.meds||[]).length?`<div class="card"><b>💊 Medicamentos</b>${r.meds.map((m,i)=>`<div class="small">${medActiva(m,r)?"🟢":"⚪"} <b>${esc(m.n)}</b> ${esc(m.dosis)}${m.cadaH?" · cada "+m.cadaH+" h":""}${m.dias?" · "+m.dias+" días":""}${m.desde||m.hora?" · desde "+esc((m.desde||r.fecha)+" "+(m.hora||"")):""}${m.nota?" · "+esc(m.nota):""}${proxDosis(m,r)?` · ⏰ próxima <b>${esc(proxDosis(m,r))}</b>`:""} <button class="b s" data-mics="${i}" title="Recordatorios en tu calendario">⏰ recordatorios</button></div>`).join("")}</div>`:""}
    ${(r.vacunas||[]).length?`<div class="small">💉 ${r.vacunas.map(v=>`${v.p?esc(v.p)+": ":""}${esc(v.v)}${v.dosis?" ("+esc(v.dosis)+")":""}${v.refuerzo?" · refuerzo "+esc(v.refuerzo):""}`).join("<br>")}</div>`:""}
    <div class="mdv">${r.texto?mdF(r.texto,r.fecha):'<p class="muted small">Sin notas.</p>'}</div>${galeria(r)}${enlacesHtml(r)}
    ${(r.fuentes||[]).length?`<div class="small muted">${r.fuentes.map(f=>`Viene de <a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${f.de==="capacities"?"Capacities":f.de==="notion"?"Notion":"otra app"}</a>${f.archivos.length?" · archivos allá: "+f.archivos.map(esc).join(", "):""}`).join("<br>")}</div>`:""}
    <div class="small muted tss">Creado ${esc(tsBonito(r.creado))}${r.editado?` · última edición ${esc(tsBonito(r.editado))}`:""}${(r.versiones||[]).length?` · ${r.versiones.length} versiones anteriores`:""}</div>`,
   [...(r.tipo==="cita"||r.fecha>hoyISO()?[["📅 A Google","",()=>window.open(gcalUrlD(comoEvento(r)),"_blank","noopener,noreferrer")],[".ics","",()=>descargar(new Blob([icsD([comoEvento(r)])],{type:"text/calendar"}),slug(r.titulo||"cita")+".ics")]]:[]),
    ...((r.versiones||[]).length?[["Historial","",()=>historialS(r)]]:[]),["📤","",()=>exportarItems([{k:"s",r}],`${r.titulo} · ${r.personas.map(nomPer).join(", ")}`)],["✍️ Cómo sigue","",()=>evolucionS(r.id)],["Cerrar","",cerrar],["Editar","p",()=>editarS(r.id)]]);
  $("#dlg").classList.add("ancho");bindItemsS($("#dlgB"));
  $("#dlgB").querySelectorAll("[data-mics]").forEach(b=>b.onclick=()=>recordatorioMed(r,r.meds[+b.dataset.mics]));
  $("#dlgB").querySelectorAll("[data-tarea]").forEach(c=>c.onchange=()=>{const L=r.texto.split("\n"),i=+c.dataset.tarea;L[i]=L[i].replace(/\[( |x|X)\]/,c.checked?"[x]":"[ ]");guardarVersion(r,r.titulo,L.join("\n"));changed()})}
const comoEvento=r=>({titulo:`${sIco(r.tipo)} ${r.titulo||sNom(r.tipo)}${r.personas.length?" · "+r.personas.join(", "):""}`,fecha:r.fecha,hora:r.hora,horaFin:r.horaFin,todoDia:!r.hora,lugar:r.lugar,texto:[r.esp,r.medico,r.texto].filter(Boolean).join("\n"),alertas:r.hora?[1440,120]:[]});
const RE_SALUDMOV=/farmac|droguer|compensar|unisalud|colsubsidio|cruz ?verde|cafam|pediatr|odonto|dental|clinic|laborator|optic|optometr|imevi|\bemi\b|sanitas|colmedica|salud|medic|hospital|cl[ií]nica|eps\b/i;
const movsDe=r=>(r.movs||[]).map(id=>S.mov.find(m=>m.id===id)).filter(Boolean);
function movsCerca(r){const a=masDias(r.fecha,-2),b=masDias(r.fechaFin||r.fecha,3);return S.mov.filter(m=>m.fecha>=a&&m.fecha<=b&&(calc(m).gasto>0||/Gasto/.test(m.tipo))&&RE_SALUDMOV.test([m.estab,m.desc,m.concepto,m.categoria].join(" "))).sort((x,y)=>x.fecha.localeCompare(y.fecha))}
function recordatorioMed(r,m){const d=m.desde||r.fecha,h=m.hora||"08:00",n=m.cadaH?Math.max(1,Math.ceil((m.dias||1)*24/m.cadaH)):(m.dias||1);
  const rr=m.cadaH?`RRULE:FREQ=HOURLY;INTERVAL=${m.cadaH};COUNT=${n}`:`RRULE:FREQ=DAILY;COUNT=${n}`,tit=`💊 ${m.n}${m.dosis?" "+m.dosis:""}${r.personas.length?" · "+r.personas.join(", "):""}`;
  const fin=(()=>{const [H,M]=h.split(":").map(Number);const t=H*60+M+10;return String(Math.floor(t/60)%24).padStart(2,"0")+":"+String(t%60).padStart(2,"0")})();
  const e=s=>String(s||"").replace(/\\/g,"\\\\").replace(/[,;]/g,c=>"\\"+c).replace(/\r?\n/g,"\\n");
  const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Memphis//Salud//ES","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${r.id}-${slug(m.n)}@memphis`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").slice(0,15)}Z`,`DTSTART:${gcDT(d,h)}`,`DTEND:${gcDT(d,fin)}`,`SUMMARY:${e(tit)}`,`DESCRIPTION:${e([m.nota,m.cadaH?"Cada "+m.cadaH+" horas":"Una vez al día",m.dias?m.dias+" días":""].filter(Boolean).join(" · "))}`,rr,"BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${e(tit)}`,"TRIGGER:PT0M","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
  const p=new URLSearchParams({action:"TEMPLATE",text:tit,ctz:"America/Bogota",dates:gcDT(d,h)+"/"+gcDT(d,fin),recur:rr,details:`${n} tomas${m.cadaH?", cada "+m.cadaH+" h":""}. Registrado en Memphis › Salud.`});
  dlg("⏰ Recordatorios de "+m.n,`<p class="small">${n} tomas desde ${esc(d)} ${esc(h)}${m.cadaH?`, cada ${m.cadaH} h`:", una al día"}. Tu calendario avisará en cada toma (también en el celular).</p>`,
   [["Cerrar","",()=>verS(r.id)],["Descargar .ics","",()=>descargar(new Blob([ics],{type:"text/calendar"}),slug(m.n)+"_recordatorios.ics")],["📅 Abrir en Google","p",()=>window.open("https://calendar.google.com/calendar/render?"+p.toString(),"_blank","noopener,noreferrer")]])}
function historialS(r){const V=(r.versiones||[]).map((v,i)=>({v,i})).reverse();
  dlg("Historial de cambios",`<p class="small">Versión actual: ${esc(tsBonito(r.editado||r.creado))}. Antes:</p>${V.map(({v,i})=>`<details class="card"><summary>${esc(tsBonito(v.t))} · ${esc(v.titulo||"(sin título)")}</summary><div class="mdv">${md(v.texto)}</div><button class="b s" data-rv="${i}">Volver a esta versión</button></details>`).join("")}`,[["Cerrar","",()=>verS(r.id)]]);
  document.querySelectorAll("[data-rv]").forEach(b=>b.onclick=()=>{const v=r.versiones[+b.dataset.rv];guardarVersion(r,v.titulo,v.texto);changed();aviso("Versión restaurada");verS(r.id)})}
function evolucionS(id){const r=(S.salud||[]).find(x=>x.id===id);if(!r)return;
  dlg("✍️ ¿Cómo sigue?",`<div class="small muted">${esc(r.titulo)} · ${r.personas.map(esc).join(", ")}</div><div class="filters"><input type="date" id="evF" value="${hoyISO()}"><input type="time" id="evH" value="${ahoraHM()}"><input id="evT" placeholder="🌡 temp." style="width:80px"></div>
    <textarea id="evX" rows="4" style="width:100%" placeholder="Ej.: sigue con tos, ya sin fiebre; le dimos Dolex a las 8"></textarea>
    <label class="small"><input type="checkbox" id="evS" ${["episodio","accidente"].includes(r.tipo)?"checked":""}> sigue enfermo/a (extiende la fecha final hasta ese día)</label>`,
   [["Cancelar","",cerrar],["Anotar","p",()=>{const f=$("#evF").value||hoyISO(),h=$("#evH").value,t=$("#evX").value.trim(),tp=parseFloat(String($("#evT").value).replace(",","."));if(!t&&!tp){alert("Escribe algo");return}
     const linea=`**${f}${h?" "+h:""}**${tp?" · 🌡 "+tp+" °C":""}${t?" · "+t:""}`;guardarVersion(r,r.titulo,(r.texto?r.texto.replace(/\s+$/,"")+"\n\n":"")+linea);
     if($("#evS").checked&&(!r.fechaFin||r.fechaFin<f)&&f>=r.fecha)r.fechaFin=f;if(tp>=35&&tp<=43&&(!r.medidas.temp||tp>r.medidas.temp))r.medidas.temp=tp;
     for(const x of leerSalud(t).sintomas)if(!r.sintomas.includes(x))r.sintomas.push(x);asegurarFichas(t);changed();cerrar();render()}]]);setTimeout(()=>$("#evX").focus(),30)}
function terminarS(id){const r=(S.salud||[]).find(x=>x.id===id);if(!r)return;const antes=structuredClone(r);r.estado="hecho";if(!r.fechaFin||r.fechaFin<hoyISO())r.fechaFin=hoyISO()<r.fecha?r.fecha:hoyISO();r.editado=new Date().toISOString();changed();render();
  deshacer("Marcado como recuperado",()=>{const i=S.salud.findIndex(x=>x.id===id);if(i>=0){S.salud[i]=antes;antes.editado=new Date().toISOString();changed();render()}})}

// ---------------------------------------------------------------- editor
const PARA={sint:"episodio accidente cita nota control",cita:"cita examen vacuna",fin:"episodio accidente medicamento",med:"medicamento cita episodio accidente examen",vac:"vacuna cita",medi:"control episodio cita accidente",inc:"cita episodio accidente",hf:"cita examen vacuna"};
let SEL={per:[],sin:[],meds:[],vac:[]};
function editarS(id,pre){const r0=id?(S.salud||[]).find(x=>x.id===id):null;pre=pre||{};if(!S.sintomas)S.sintomas=SINT_DEF.slice();
  const r=r0?structuredClone(r0):{id:uid(),tipo:pre.tipo||"episodio",titulo:pre.titulo||"",texto:pre.texto||"",fecha:pre.fecha||hoyISO(),hora:pre.hora||"",fechaFin:pre.fechaFin||"",horaFin:pre.horaFin||"",personas:pre.personas||(TS.per?[TS.per]:[]),sintomas:pre.sintomas||[],lugar:pre.lugar||"",medico:"",esp:"",estado:"",meds:[],vacunas:[],medidas:pre.medidas||{},inc:null,adjuntos:[],enlaces:[],fuentes:[],movs:[],creado:new Date().toISOString(),editado:"",versiones:[]};
  SEL={per:r.personas.slice(),sin:r.sintomas.slice(),meds:(r.meds||[]).map(m=>({...m})),vac:(r.vacunas||[]).map(v=>({...v}))};
  ADJ=(r.adjuntos||[]).slice();ENL=(r.enlaces||[]).map(l=>({...l}));
  ADJCTX=()=>({fecha:$("#seF").value||r.fecha,estab:"salud-"+(SEL.per[0]||"familia"),concepto:"",desc:"",valor:0});ADJPINTA=pintaAdjD;ADJOPC={max:2000,q:0.82,umbral:400*1024};
  const gente=[...new Set([...famSalud(),...(S.fichas||[]).filter(f=>f.tipo==="persona").map(f=>f.nombre)])];
  const md0=r.medidas||{};
  dlg(r0?"Editar registro de salud":"Nuevo registro de salud",`<div class="seg wrap">${Object.entries(STIPOS).map(([k,[i,l]])=>`<button data-stp="${k}" class="${r.tipo===k?"on":""}">${i} ${l.split(" /")[0]}</button>`).join("")}</div>
    <label>¿De quién?</label><div class="chips" id="sePer">${gente.map(n=>`<button class="fchip ${SEL.per.some(p=>claveF(nomPer(p))===claveF(n))?"on":"off"}" data-pp="${esc(n)}">${esc(n)}</button>`).join("")}<button class="fchip off" id="sePerN">+ otra</button></div>
    <input id="seT" placeholder="Título: «Gripe», «Cita pediatra», «Vacuna influenza»…" value="${esc(r.titulo)}" style="width:100%;margin-top:8px;font-weight:600">
    <div class="filters"><input type="date" id="seF" value="${r.fecha}" title="Fecha"><input type="time" id="seH" value="${r.hora}" title="Hora"><span data-para="${PARA.hf}">–</span><input type="time" id="seHF" value="${r.horaFin}" data-para="${PARA.hf}" title="Hasta">
     <span data-para="${PARA.fin}" class="small">hasta</span><input type="date" id="seFF" value="${r.fechaFin}" data-para="${PARA.fin}" title="Hasta qué día (déjalo vacío si sigue)"><input id="seW" placeholder="o escribe: ayer 3 pm" style="flex:1;min-width:120px"></div>
    <div data-para="${PARA.sint}"><label>Síntomas</label><input id="seSb" placeholder="filtrar o escribir uno nuevo y Enter" style="width:100%"><div class="chips" id="seSin"></div></div>
    <div data-para="${PARA.cita}" class="filters"><input id="seEsp" placeholder="Especialidad (pediatría, odontología…)" value="${esc(r.esp)}" list="seEspL"><input id="seMed" placeholder="Médico/a" value="${esc(r.medico)}"><input id="seL" placeholder="📍 Lugar" value="${esc(r.lugar)}" style="flex:1;min-width:160px" list="seLL">
     <select id="seE">${SESTADOS.map(([k,l])=>`<option value="${k}" ${r.estado===k?"selected":""}>${k?l:"Estado"}</option>`).join("")}</select></div>
    <datalist id="seEspL">${[...new Set((S.salud||[]).map(x=>x.esp).filter(Boolean))].map(x=>`<option value="${esc(x)}">`).join("")}</datalist><datalist id="seLL">${[...new Set([...lugares().map(f=>f.nombre),...(S.salud||[]).map(x=>x.lugar).filter(Boolean)])].slice(0,80).map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
    <div data-para="${PARA.med}"><label>💊 Medicamentos</label><div id="seMeds"></div><button class="b s" id="seMA">+ medicamento</button></div>
    <div data-para="${PARA.vac}"><label>💉 Vacunas aplicadas</label><div id="seVacs"></div><button class="b s" id="seVA">+ vacuna</button></div>
    <div data-para="${PARA.medi}" class="filters"><span class="small">📏</span><input id="seTe" placeholder="🌡 °C" value="${md0.temp||""}" style="width:70px"><input id="sePe" placeholder="Peso kg" value="${md0.peso||""}" style="width:80px"><input id="seTa" placeholder="Talla cm" value="${md0.talla||""}" style="width:80px"><input id="sePa" placeholder="Presión 120/80" value="${esc(md0.pa||"")}" style="width:110px"></div>
    <div data-para="${PARA.inc}" class="filters"><span class="small">📄 Incapacidad desde</span><input type="date" id="seId" value="${r.inc?r.inc.desde:""}"><input id="seIn" placeholder="días" value="${r.inc&&r.inc.dias||""}" style="width:60px"></div>
    <div class="tb">${[["**","B","Negrita"],["- ","•","Lista"],["- [ ] ","☐","Tarea"],["==","▮","Resaltar"]].map(([m,l,t])=>`<button class="b s" data-mk="${esc(m)}" title="${t}">${l}</button>`).join("")}<span class="sp"></span><button class="b s" id="sePrev">👁 Vista previa</button></div>
    <textarea id="seX" rows="7" style="width:100%" placeholder="Qué pasó, qué dijo el médico, cómo evoluciona día a día (luego usa «✍️ Cómo sigue»). Markdown opcional.">${esc(r.texto)}</textarea><div id="seV" class="mdv card" hidden></div><div id="seSug"></div>
    <div class="filters"><button class="b s" id="deFo">📷 Foto (fórmula, orden…)</button><button class="b s" id="deIm">🖼 Imágenes</button><button class="b s" id="deFi">📄 PDF / archivo</button><button class="b s" id="deAu">🎙 Grabar audio</button><button class="b s" id="deLk">🔗 Enlace</button><span id="deRec" class="small"></span></div>
    <input type="hidden" id="adjT" value="Salud"><div id="adjL"></div><div id="deEnl"></div>
    ${(r.fuentes||[]).length?`<div class="small muted">${r.fuentes.map(f=>`Importado de <a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${f.de==="capacities"?"Capacities":f.de==="notion"?"Notion":"otra app"}</a>${f.archivos.length?" · archivos allá: "+f.archivos.map(esc).join(", "):""}`).join("<br>")}</div>`:""}
    <div class="small muted tss">${r0?`Creado ${esc(tsBonito(r.creado))}${r.editado?` · última edición ${esc(tsBonito(r.editado))}`:""}`:"Se guarda cifrado, con fecha de creación y de cada edición (puedes volver a versiones anteriores)."}</div>`,
   [...(r0?[["Borrar","",()=>{if(!confirm("¿Borrar este registro? Queda 30 días en la papelera."))return;cerrar();borrarConPapelera("salud",r0.id);render()}]]:[]),["Cancelar","",()=>{pararGrab(true);cerrar()}],["Guardar","p",()=>guardarS(r,r0)]]);
  $("#dlg").classList.add("ancho");
  const tipo=t=>{r.tipo=t;document.querySelectorAll("[data-stp]").forEach(b=>b.classList.toggle("on",b.dataset.stp===t));document.querySelectorAll("#dlgB [data-para]").forEach(x=>x.hidden=!x.dataset.para.split(" ").includes(t))};tipo(r.tipo);
  document.querySelectorAll("[data-stp]").forEach(b=>b.onclick=()=>{tipo(b.dataset.stp);if(b.dataset.stp==="medicamento"&&!SEL.meds.length){SEL.meds.push(medVacio());pintaMeds()}if(b.dataset.stp==="vacuna"&&!SEL.vac.length){SEL.vac.push({p:"",v:"",dosis:"",refuerzo:""});pintaVacs()}});
  const pintaPer=()=>document.querySelectorAll("[data-pp]").forEach(b=>b.className="fchip "+(SEL.per.some(p=>claveF(nomPer(p))===claveF(b.dataset.pp))?"on":"off"));
  document.querySelectorAll("[data-pp]").forEach(b=>b.onclick=()=>{const n=b.dataset.pp,i=SEL.per.findIndex(p=>claveF(nomPer(p))===claveF(n));if(i>=0)SEL.per.splice(i,1);else SEL.per.push(n);pintaPer();pintaVacs()});
  $("#sePerN").onclick=()=>{const n=(prompt("Nombre de la persona")||"").trim();if(!n)return;asegurarFichas("@["+n+"]");SEL.per.push(nomPer(n));const b=document.createElement("button");b.className="fchip on";b.dataset.pp=nomPer(n);b.textContent=nomPer(n);b.onclick=()=>{const i=SEL.per.indexOf(b.dataset.pp);if(i>=0)SEL.per.splice(i,1);else SEL.per.push(b.dataset.pp);pintaPer()};$("#sePerN").before(b)};
  const pintaSin=()=>{const q=normK($("#seSb").value),L=[...new Set([...SEL.sin,...S.sintomas])];$("#seSin").innerHTML=L.filter(s=>SEL.sin.includes(s)||!q||normK(s).includes(q)).map(s=>`<button class="fchip ${SEL.sin.includes(s)?"on":"off"}" data-ss="${esc(s)}">${esc(s)}</button>`).join("");
    $("#seSin").querySelectorAll("[data-ss]").forEach(b=>b.onclick=()=>{const s=b.dataset.ss,i=SEL.sin.indexOf(s);if(i>=0)SEL.sin.splice(i,1);else SEL.sin.push(s);pintaSin()})};
  $("#seSb").oninput=pintaSin;$("#seSb").onkeydown=ev=>{if(ev.key!=="Enter")return;ev.preventDefault();const v=$("#seSb").value.trim();if(!v)return;const ex=S.sintomas.find(s=>normK(s)===normK(v))||(()=>{const n=v.charAt(0).toUpperCase()+v.slice(1);S.sintomas.push(n);return n})();if(!SEL.sin.includes(ex))SEL.sin.push(ex);$("#seSb").value="";pintaSin()};pintaSin();
  $("#seMA").onclick=()=>{leerMeds();SEL.meds.push(medVacio());pintaMeds()};$("#seVA").onclick=()=>{leerVacs();SEL.vac.push({p:"",v:"",dosis:"",refuerzo:""});pintaVacs()};pintaMeds();pintaVacs();
  $("#seW").onchange=()=>{const w=$("#seW").value,x=leerCuando(w,hoyISO(),{modo:modoTexto(w,["cita","examen","vacuna"].includes(r.tipo)?"futuro":"pasado")});if(x.fechaFin&&$("#seFF"))$("#seFF").value=x.fechaFin;if(!x.encontrado){alert("No entendí la fecha u hora. Ej.: «ayer 3 pm», «el lunes a las 7 am».");return}if(x.fecha)$("#seF").value=x.fecha;if(x.hora)$("#seH").value=x.hora;if(x.horaFin)$("#seHF").value=x.horaFin;if(x.titulo&&!$("#seT").value)$("#seT").value=x.titulo;$("#seW").value=""};
  const X=$("#seX");document.querySelectorAll("#dlgB [data-mk]").forEach(b=>b.onclick=()=>marcar(X,b.dataset.mk));
  $("#sePrev").onclick=()=>{const v=$("#seV");v.hidden=!v.hidden;X.hidden=!v.hidden;if(!v.hidden)v.innerHTML=md(X.value)||'<p class="muted small">(vacío)</p>';$("#sePrev").textContent=v.hidden?"👁 Vista previa":"✏️ Escribir"};
  X.addEventListener("paste",async ev=>{const files=[...(ev.clipboardData&&ev.clipboardData.files)||[]].filter(f=>/^image\//.test(f.type));if(files.length){ev.preventDefault();await adjuntarArchivos(files.map((f,i)=>new File([f],`captura_${fISO(new Date())}_${ahoraHM().replace(":","")}${i?"_"+i:""}.${(f.type.split("/")[1]||"png").replace("jpeg","jpg")}`,{type:f.type})));aviso("Captura añadida")}});
  $("#deFo").onclick=()=>{$("#camIn").value="";$("#camIn").click()};
  $("#deIm").onclick=()=>{const i=$("#attIn");i.accept="image/*";i.value="";i.click();setTimeout(()=>i.removeAttribute("accept"),1000)};
  $("#deFi").onclick=()=>{const i=$("#attIn");i.removeAttribute("accept");i.value="";i.click()};
  $("#deAu").onclick=()=>GRAB?pararGrab():grabar();$("#deLk").onclick=()=>nuevoEnlace();pintaAdjD();pintaEnl();
  vigilarSugerencias(["seT","seX"],"seSug");setTimeout(()=>(r0?X:$("#seT")).focus(),30)}
const medVacio=()=>({n:"",dosis:"",cadaH:0,dias:0,desde:($("#seF")||{}).value||hoyISO(),hora:"",nota:""});
function pintaMeds(){const el=$("#seMeds");if(!el)return;el.innerHTML=SEL.meds.map((m,i)=>`<div class="filters mrow"><input data-mi="${i}" data-k="n" placeholder="Medicamento" value="${esc(m.n)}" style="flex:2;min-width:130px" list="seMedL"><input data-mi="${i}" data-k="dosis" placeholder="Dosis (5 ml, 500 mg…)" value="${esc(m.dosis)}" style="width:120px">
   <span class="small">cada</span><input data-mi="${i}" data-k="cadaH" value="${m.cadaH||""}" style="width:46px" placeholder="h"><span class="small">h ×</span><input data-mi="${i}" data-k="dias" value="${m.dias||""}" style="width:46px" placeholder="días"><span class="small">días desde</span><input type="date" data-mi="${i}" data-k="desde" value="${m.desde}"><input type="time" data-mi="${i}" data-k="hora" value="${m.hora}" title="Hora de la primera toma"><button class="b s" data-mx="${i}">✕</button></div>`).join("")+
   `<datalist id="seMedL">${[...new Set((S.salud||[]).flatMap(x=>(x.meds||[]).map(m=>m.n)))].map(n=>`<option value="${esc(n)}">`).join("")}</datalist>`;
  el.querySelectorAll("[data-mx]").forEach(b=>b.onclick=()=>{leerMeds();SEL.meds.splice(+b.dataset.mx,1);pintaMeds()})}
function leerMeds(){document.querySelectorAll("[data-mi]").forEach(x=>{const m=SEL.meds[+x.dataset.mi];if(!m)return;const k=x.dataset.k;m[k]=["cadaH","dias"].includes(k)?(parseFloat(String(x.value).replace(",","."))||0):x.value.trim()})}
function pintaVacs(){const el=$("#seVacs");if(!el)return;const P=SEL.per.length?SEL.per:famSalud();
  el.innerHTML=SEL.vac.map((v,i)=>`<div class="filters mrow"><select data-vi="${i}" data-k="p"><option value="">${SEL.per.length>1?"todos":"—"}</option>${P.map(n=>`<option ${claveF(v.p)===claveF(n)?"selected":""}>${esc(n)}</option>`).join("")}</select><input data-vi="${i}" data-k="v" placeholder="Vacuna (influenza, VPH…)" value="${esc(v.v)}" style="flex:1;min-width:140px" list="seVacL"><input data-vi="${i}" data-k="dosis" placeholder="Dosis (1.ª, refuerzo…)" value="${esc(v.dosis)}" style="width:120px"><span class="small">próximo refuerzo</span><input type="date" data-vi="${i}" data-k="refuerzo" value="${v.refuerzo}"><button class="b s" data-vx="${i}">✕</button></div>`).join("")+
   `<datalist id="seVacL">${[...new Set((S.salud||[]).flatMap(x=>(x.vacunas||[]).map(v=>v.v)))].map(n=>`<option value="${esc(n)}">`).join("")}</datalist>`;
  el.querySelectorAll("[data-vx]").forEach(b=>b.onclick=()=>{leerVacs();SEL.vac.splice(+b.dataset.vx,1);pintaVacs()})}
function leerVacs(){document.querySelectorAll("[data-vi]").forEach(x=>{const v=SEL.vac[+x.dataset.vi];if(v)v[x.dataset.k]=x.value.trim()})}
function guardarS(r,r0){if(GRAB){alert("Detén la grabación antes de guardar.");return}leerMeds();leerVacs();
  const f=$("#seF").value;if(!RE_ISO.test(f)){alert("Fecha inválida");return}const titulo=$("#seT").value.trim(),texto=$("#seX").value;
  if(!SEL.per.length&&!confirm("No elegiste de quién es. ¿Guardar igual?"))return;
  const vis=k=>PARA[k].split(" ").includes(r.tipo),nm=id=>{const v=parseFloat(String($(id).value).replace(",","."));return Number.isFinite(v)?v:0};
  const medidas={};if(vis("medi")){if(nm("#seTe"))medidas.temp=nm("#seTe");if(nm("#sePe"))medidas.peso=nm("#sePe");if(nm("#seTa"))medidas.talla=nm("#seTa");if(/^\d{2,3}\/\d{2,3}$/.test($("#sePa").value.trim()))medidas.pa=$("#sePa").value.trim()}
  const ff=vis("fin")?$("#seFF").value:"";
  Object.assign(r,{fecha:f,hora:$("#seH").value||"",horaFin:vis("hf")?$("#seHF").value||"":"",fechaFin:ff&&ff>=f?ff:"",personas:SEL.per.map(nomPer),sintomas:vis("sint")?SEL.sin.slice():r.sintomas,
    esp:vis("cita")?$("#seEsp").value.trim():r.esp,medico:vis("cita")?$("#seMed").value.trim():r.medico,lugar:vis("cita")?resolverLugar($("#seL").value.trim()):r.lugar,estado:vis("cita")?$("#seE").value:r.estado,
    meds:vis("med")?SEL.meds.filter(m=>m.n):r.meds,vacunas:vis("vac")?SEL.vac.filter(v=>v.v):r.vacunas,medidas:vis("medi")?medidas:r.medidas,
    inc:vis("inc")&&RE_ISO.test($("#seId").value)?{desde:$("#seId").value,dias:Math.round(nm("#seIn"))}:vis("inc")?null:r.inc,adjuntos:ADJ.slice(),enlaces:ENL.filter(l=>l.url)});
  if(!titulo&&!texto.trim()&&!r.sintomas.length&&!ADJ.length&&!r.meds.length&&!r.vacunas.length){alert("El registro está vacío.");return}
  const tit=titulo||(r.tipo==="episodio"&&r.sintomas.length?r.sintomas.slice(0,2).join(" y "):r.tipo==="vacuna"&&r.vacunas.length?"Vacuna "+r.vacunas[0].v:r.tipo==="medicamento"&&r.meds.length?r.meds[0].n:sNom(r.tipo));
  for(const s of r.sintomas)if(!S.sintomas.includes(s))S.sintomas.push(s);
  if(r0){const real=S.salud.find(x=>x.id===r0.id),antes=structuredClone(real);guardarVersion(r,tit,texto);Object.assign(real,r,{versiones:r.versiones});asegurarFichas(tit+" "+texto+" "+r.personas.map(p=>"@["+p+"]").join(" "));changed();cerrar();ADJPINTA=null;ADJOPC=null;render();
    deshacer("Registro guardado",()=>{const i=S.salud.findIndex(x=>x.id===antes.id);if(i>=0){antes.editado=new Date().toISOString();S.salud[i]=antes;changed();render()}})}
  else{r.titulo=tit;r.texto=texto;r.creado=new Date().toISOString();(S.salud=S.salud||[]).push(r);asegurarFichas(tit+" "+texto+" "+r.personas.map(p=>"@["+p+"]").join(" "));changed();cerrar();ADJPINTA=null;ADJOPC=null;render();
    deshacer("Registro de salud guardado",()=>{S.salud=S.salud.filter(x=>x.id!==r.id);changed();render()});
    if(r.tipo==="cita"&&r.fecha>=hoyISO())setTimeout(()=>{if(confirm("¿Añadir la cita a tu Google Calendar (con aviso un día y dos horas antes)?"))window.open(gcalUrlD(comoEvento(r)),"_blank","noopener,noreferrer")},80)}}
function nuevoPariente(){const P=(S.fichas||[]).filter(f=>f.tipo==="persona"&&!(f.datos&&f.datos.salud)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  dlg("🩺 Agregar a Salud",`<label>Persona</label><select id="npS" style="width:100%"><option value="">— Nueva persona —</option>${P.map(f=>`<option value="${esc(f.id)}">${esc(f.nombre)}${f.datos&&f.datos.rel?" ("+esc(f.datos.rel)+")":""}</option>`).join("")}</select>
    <div id="npNB"><label>Nombre</label><input id="npN" style="width:100%" placeholder="Ej.: tío Carlos, abuela Rosa…"></div>
    <label>Relación</label><input id="npR" list="relL2" placeholder="papá, mamá, tío, prima, sobrina, suegro…" style="width:100%"><datalist id="relL2">${RELS.map(r=>`<option value="${r}">`).join("")}</datalist>
    <label>Grupo</label><select id="npG">${GRUPOS.map(([k,l])=>`<option value="${k}" ${k==="familia"?"selected":""}>${l}</option>`).join("")}</select>`,
   [["Cancelar","",cerrar],["Agregar","p",()=>{let f=S.fichas.find(x=>x.id===$("#npS").value);const ah=new Date().toISOString();
     if(!f){const n=$("#npN").value.trim();if(!n){alert("Escribe el nombre");return}f=fichaDe(n,"persona");if(!f){f={id:uid(),nombre:n,tipo:"persona",alias:[],nota:"",creado:ah,editado:"",datos:{}};S.fichas.push(f)}}
     const d={...(f.datos||{}),salud:true};if($("#npR").value.trim())d.rel=$("#npR").value.trim();if(!d.grupo||$("#npS").value==="")d.grupo=$("#npG").value;f.datos=normDatosP(d);f.editado=ah;changed();cerrar();irPerfilS(f.nombre)}]]);
  $("#npS").onchange=()=>{const f=S.fichas.find(x=>x.id===$("#npS").value);$("#npNB").hidden=!!f;if(f){$("#npR").value=(f.datos&&f.datos.rel)||"";$("#npG").value=(f.datos&&f.datos.grupo)||"familia"}}}
function editarPerfil(n){const p0=perfilDe(n),p=p0?structuredClone(p0):{id:uid(),nombre:nomPer(n),nac:"",sangre:"",eps:"",alergias:"",condiciones:"",medico:"",notas:"",creado:new Date().toISOString(),editado:""};
  dlg(p0?"Perfil de "+p.nombre:"Nuevo perfil de salud",`<label>Nombre (el mismo de @${esc(p.nombre)} en el diario)</label><input id="pfN" value="${esc(p.nombre)}" style="width:100%">
    <div class="filters"><label class="small">Nacimiento <input type="date" id="pfNa" value="${p.nac}"></label><label class="small">Sangre <input id="pfS" value="${esc(p.sangre)}" style="width:70px" placeholder="O+"></label></div>
    <label>EPS / prepagada / seguro</label><input id="pfE" value="${esc(p.eps)}" style="width:100%"><label>Médico de cabecera, pediatra…</label><input id="pfM" value="${esc(p.medico)}" style="width:100%">
    <label>Alergias</label><input id="pfA" value="${esc(p.alergias)}" style="width:100%"><label>Condiciones / antecedentes</label><textarea id="pfC" rows="2" style="width:100%">${esc(p.condiciones)}</textarea>
    <label>Notas (Markdown)</label><textarea id="pfNo" rows="4" style="width:100%">${esc(p.notas)}</textarea>`,
   [...(p0?[["Borrar perfil","",()=>{if(!confirm("¿Borrar el perfil? Los registros no se borran."))return;S.perfilesSalud=S.perfilesSalud.filter(x=>x.id!==p0.id);(S.eliminados=S.eliminados||[]).push({id:p0.id,fecha:new Date().toISOString()});changed();cerrar();render()}]]:[]),["Cancelar","",cerrar],
    ["Guardar","p",()=>{const nn=$("#pfN").value.trim();if(!nn){alert("Pon un nombre");return}Object.assign(p,{nombre:nn,nac:$("#pfNa").value,sangre:$("#pfS").value.trim(),eps:$("#pfE").value.trim(),medico:$("#pfM").value.trim(),alergias:$("#pfA").value.trim(),condiciones:$("#pfC").value,notas:$("#pfNo").value,editado:new Date().toISOString()});
     if(p0)Object.assign(p0,p);else(S.perfilesSalud=S.perfilesSalud||[]).push(p);asegurarFichas("@["+nn+"]");changed();cerrar();TS.vista="perfil";TS.perfil=nomPer(nn);render()}]])}

// ---------------------------------------------------------------- importar historial (paquete preparado desde Notion/Capacities)
function importarSaludPaquete(d){const t=migrar({mov:[],salud:d.registros||[],perfilesSalud:d.perfiles||[],sintomas:d.sintomas||[],fichas:d.fichas||[]});
  const nd=t.fichas.filter(f=>{const ex=fichaDe(f.nombre,f.tipo)||f.alias.map(a=>fichaDe(a,f.tipo)).find(Boolean);return ex&&Object.entries(f.datos||{}).some(([k,v])=>!(ex.datos||{})[k]&&v)}).length;
  const nr=t.salud.filter(r=>!(S.salud||[]).some(x=>x.id===r.id)),np=t.perfilesSalud.filter(p=>!perfilDe(p.nombre)),nf=t.fichas.filter(f=>!fichaDe(f.nombre,f.tipo)&&!f.alias.some(a=>fichaDe(a,f.tipo)));
  const ns=t.sintomas.filter(s=>!(S.sintomas||[]).some(x=>normK(x)===normK(s)));
  if(!nr.length&&!np.length&&!ns.length&&!nf.length&&!nd){alert("Todo lo de salud de este paquete ya estaba en la app.");return false}
  const por={};for(const r of nr)for(const p of r.personas)por[p]=(por[p]||0)+1;
  if(!confirm(`Salud: se agregarán\n• ${nr.length} registros (${Object.entries(por).map(([k,v])=>k+" "+v).join(", ")})\n• ${np.length} perfiles · ${nf.length} personas nuevas en el diario\n• ${ns.length} síntomas nuevos a la lista\n\n¿Importar?`))return false;
  const ah=new Date().toISOString();S.fichas=S.fichas||[];for(const f of nf)S.fichas.push(f);
  // alias que traiga el paquete para personas que ya existen
  for(const f of t.fichas){const ex=fichaDe(f.nombre,f.tipo)||f.alias.map(a=>fichaDe(a,f.tipo)).find(Boolean);if(ex&&ex!==f&&f.datos){const d={...(ex.datos||{})};for(const [k,v] of Object.entries(f.datos))if(d[k]==null||d[k]===""||(Array.isArray(d[k])&&!d[k].length))d[k]=v;ex.datos=normDatosP(d);ex.editado=ah}
    if(ex&&ex!==f)for(const a of [f.nombre,...f.alias])if(claveF(a)!==claveF(ex.nombre)&&!ex.alias.some(x=>claveF(x)===claveF(a))){ex.alias.push(a);ex.editado=ah}}
  for(const r of nr){r.personas=r.personas.map(nomPer);(S.salud=S.salud||[]).push(r)}for(const p of np){p.nombre=nomPer(p.nombre);(S.perfilesSalud=S.perfilesSalud||[]).push(p)}
  S.sintomas=[...(S.sintomas||SINT_DEF),...ns];changed();return true}
