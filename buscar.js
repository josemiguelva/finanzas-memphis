// =====================================================================================================
// Memphis · 🔎 BUSCAR EN TODO (desde la caja de Inicio: «🔎 Buscar en todo», «?texto», «/» o Ctrl+Shift+K).
// Biblioteca, diario y agenda, salud, fichas (personas, lugares, temas), proyectos y tareas, cursos y estudiantes,
// movimientos, vencimientos, pagos fijos y bandeja. Respeta el modo Trabajo/Personal y no abre notas 🔒 privadas.
// =====================================================================================================
"use strict";
const GRUPOS_G={b:"📚 Biblioteca",d:"📓 Diario y agenda",s:"🩺 Salud",f:"👤 Fichas",p:"🎯 Proyectos",t:"☑️ Tareas de proyecto",c:"🎓 Cursos",e:"👩‍🎓 Estudiantes",m:"💰 Movimientos",v:"⏰ Vencimientos",r:"🔁 Pagos fijos",x:"📥 Bandeja"};
const ocultoModo=k=>{const o=(typeof MODO_OCULTA!=="undefined"&&MODO_OCULTA[INI.modo])||[];return(o.includes("fin")&&"mvr".includes(k))||(o.includes("sal")&&k==="s")||(o.includes("cur")&&"ce".includes(k))||(o.includes("proy")&&"pt".includes(k))};
function buscarTodo(q,max){const W=normK(q).split(/\s+/).filter(w=>w.length>=2);if(!W.length)return[];const out=[],num=/^\d[\d.,]*$/.test(q.trim())?parseNum(q):null;
  const prueba=(k,key,ico,tit,cuerpo,fecha,sub,extra)=>{if(ocultoModo(k))return;const T=normK(tit),C=normK(cuerpo);let sc=0;for(const w of W){const enT=T.includes(w);if(!enT&&!C.includes(w))return;sc+=enT?3:1}
    if(T.startsWith(W[0]))sc+=2;const r={k,key,ico,tit:tit||"(sin título)",sub,fecha:fecha||"",sc,cuerpo,...extra};out.push(r)};
  const priv=x=>typeof verPriv==="function"&&verPriv(x);
  for(const x of S.biblio||[])if(!priv(x))prueba("b","b:"+x.id,bIco(x.tipo),x.titulo,[x.texto,x.url,x.doi,x.autores.join(" "),x.revista,x.etiquetas.join(" "),x.coleccion,(x.adjuntos||[]).map(a=>a.original||"").join(" ")].join(" "),diaLocal(x.creado),[x.coleccion&&"📂 "+x.coleccion,x.autores[0]&&x.autores[0].split(",")[0],x.anio].filter(Boolean).join(" · "));
    else if(x.titulo)prueba("b","b:"+x.id,"🔒",x.titulo,"",diaLocal(x.creado),"Privada");
  for(const e of S.diario||[]){if(e.oculto)continue;if(priv(e)){if(e.titulo)prueba("d","d:"+e.id,"🔒",e.titulo,"",e.fecha,"Privada");continue}prueba("d","d:"+e.id,e.tipo==="evento"?"📅":"📓",e.titulo||(e.texto||"").split("\n")[0].slice(0,90),[e.texto,e.lugar,(e.enlaces||[]).map(l=>l.url+" "+l.titulo).join(" ")].join(" "),e.fecha,[e.hora,e.lugar&&"📍 "+e.lugar].filter(Boolean).join(" · "))}
  for(const r of S.salud||[])prueba("s","s:"+r.id,typeof sIco==="function"?sIco(r.tipo):"🩺",r.titulo,[r.texto,r.personas.join(" "),r.sintomas.join(" "),r.lugar,r.medico,r.esp].join(" "),r.fecha,r.personas.map(n=>typeof nomPer==="function"?nomPer(n):n).join(", "));
  for(const f of S.fichas||[])prueba("f","f:"+f.id,f.tipo==="persona"?"👤":f.tipo==="lugar"?"📍":"#",f.nombre,[(f.alias||[]).join(" "),f.nota||"",f.datos?[...Object.values(f.datos).filter(v=>typeof v==="string"),...(f.datos.tel||[]),...(f.datos.email||[]),...(f.datos.extra||[]).map(x=>x.k+" "+x.v)].join(" "):""].join(" "),"",f.tipo);
  for(const p of S.proy||[])prueba("p","p:"+p.id,"🎯",p.corto?p.corto+" · "+p.nombre:p.nombre,[p.corto,p.desc,p.objetivo,p.codigo,p.tema,p.area,(p.personas||[]).map(x=>x.n).join(" ")].join(" "),p.inicio,[p.area,p.estado].filter(Boolean).join(" · "));
  for(const t of S.ptar||[]){const p=(S.proy||[]).find(x=>x.id===t.proy);prueba("t","t:"+t.id,typeof PT_TIPOS!=="undefined"?PT_TIPOS[t.tipo][0]:"☑️",t.titulo,[t.desc,t.resp,t.meta].join(" "),t.fin,[p&&(p.corto||p.nombre),t.estado,t.resp].filter(Boolean).join(" · "))}
  if(typeof C!=="undefined"&&C){for(const c of C.cur)prueba("c","c:"+c.id,"🎓",c.nombre,[c.codigo,c.grupo].join(" "),"",(C.sem.find(s=>s.id===c.sem)||{}).nombre||"");
    for(const e of C.est)prueba("e","e:"+e.id,"👩‍🎓",nomEst(e),Object.values(e).filter(v=>typeof v==="string").join(" "),"",[e.doc,e.correo].filter(Boolean).join(" · "));
    for(const s of C.ses){if(!s.tema&&!s.hecho&&!s.plan)continue;const c=C.cur.find(x=>x.id===s.cur);prueba("c","cs:"+s.id,"📓",`${c?c.nombre:"Clase"} · ${s.tema||"bitácora"}`,[s.tema,s.hecho,s.plan].join(" "),s.fecha,s.hora||"")}
    for(const b of C.bit){const e=C.est.find(x=>x.id===b.est);if(e)prueba("e","e:"+e.id,"📝",nomEst(e)+" · bitácora",b.texto,b.fecha,"")}}
  for(const m of S.mov){if(ocultoModo("m"))break;const vNum=num!=null&&Math.round(Math.abs(m.valor))===Math.round(num);if(vNum){out.push({k:"m",key:"m:"+m.id,ico:"💰",tit:m.estab||m.concepto||m.desc||"Movimiento",sub:`${fmt(m.valor)} · ${m.cuenta}`,fecha:m.fecha,sc:5,cuerpo:""});continue}
    prueba("m","m:"+m.id,"💰",m.estab||m.concepto||m.desc||"Movimiento",[m.concepto,m.desc,m.nota,m.categoria,m.cuenta,(m.adjuntos||[]).map(a=>a.original||"").join(" ")].join(" "),m.fecha,`${fmt(m.valor)} · ${m.categoria||m.tipo}`)}
  for(const v of S.venc||[])prueba("v","v:"+v.id,"⏰",v.titulo,[v.comercio,v.nota,v.tipo].join(" "),v.vence,v.tipo);
  for(const r of S.rec||[])prueba("r","r:"+r.id,"🔁",r.nombre,[r.tipo,r.cuenta].join(" "),"",r.tipo);
  for(const x of S.bandeja||[])prueba("x","x:"+x.id,"📥",x.titulo||(x.texto||"").split("\n")[0].slice(0,90),[x.texto,x.url].join(" "),diaLocal(x.fecha),"Por clasificar");
  out.sort((a,b)=>b.sc-a.sc||String(b.fecha).localeCompare(String(a.fecha)));return max?out.slice(0,max):out}
function resaltar(t,q){let h=esc(t);for(const w of normK(q).split(/\s+/).filter(w=>w.length>=2)){const re=new RegExp("("+w.split("").map(c=>{const m={a:"[aáà]",e:"[eéè]",i:"[iíì]",o:"[oóò]",u:"[uúüù]",n:"[nñ]"}[c];return m||c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}).join("")+")","ig");h=h.replace(re,"<mark>$1</mark>")}return h}
function fragmento(cuerpo,q){const c=String(cuerpo||"").replace(/https?:\/\/\S+/g," ").replace(/[*_=`>#\[\]]+/g,"").replace(/\s+/g," "),n=normK(c),w=normK(q).split(/\s+/).find(w=>w.length>=2&&n.includes(w));if(!w)return"";const i=n.indexOf(w),a=Math.max(0,i-50);return(a?"…":"")+c.slice(a,i+110)+(i+110<c.length?"…":"")}
let GB={q:"",todo:false};
function pintaBusqueda(q,box0){const box=box0||$("#iqP");if(!box)return;if(q.trim().length<2){box.innerHTML='<span class="small muted">Escribe al menos 2 letras. Busca en todo Memphis (sin tildes ni mayúsculas). Un número busca también movimientos por valor. Enter abre el primero.</span>';return}
  if(typeof C!=="undefined"&&!C&&typeof cargarCursos==="function"&&!GB.cargando&&!ocultoModo("c")){GB.cargando=true;cargarCursos().then(()=>{if(box0&&box0.isConnected){const i=$("#gbQ");if(i)pintaBusqueda(i.value,box0)}else if(INI.busca&&MOD==="ini")pintaBusqueda($("#iq").value)}).catch(()=>{})}
  if(GB.q!==q){GB.q=q;GB.todo=false}const ORD="bdsfptcexvrm",R=buscarTodo(q).sort((a,b)=>ORD.indexOf(a.k)-ORD.indexOf(b.k)||b.sc-a.sc||String(b.fecha).localeCompare(String(a.fecha))),M=GB.todo?R:recorte(R);if(!R.length){box.innerHTML='<p class="small muted">Nada encontrado. Prueba con menos palabras.</p>';return}
  const por=new Map();for(const r of M){const g=r.k==="c"&&r.key.startsWith("cs:")?"c":r.k;if(!por.has(g))por.set(g,[]);por.get(g).push(r)}
  box.innerHTML=`<div class="small muted">${R.length} resultado${R.length>1?"s":""}</div><div class="gres">${[...por.entries()].map(([g,L])=>`<div class="gh">${GRUPOS_G[g]||g} · ${L.length}</div>${L.map(r=>`<a href="#" data-gk="${esc(r.key)}"><span>${r.ico}</span><span style="flex:1;min-width:0"><span class="gt">${resaltar(r.tit,q)}</span>${r.sub||r.fecha?`<span class="gs"> · ${esc([r.sub,r.fecha&&fechaCorta(r.fecha)].filter(Boolean).join(" · "))}</span>`:""}${fragmento(r.cuerpo,q)&&!normK(r.tit).includes(normK(q).split(/\s+/)[0])?`<div class="gs">${resaltar(fragmento(r.cuerpo,q),q)}</div>`:""}</span></a>`).join("")}`).join("")}</div>
   ${R.length>M.length?`<button class="b s" id="gTodo">Ver los ${R.length}</button>`:""}`;
  box.querySelectorAll("[data-gk]").forEach(a=>a.onclick=ev=>{ev.preventDefault();abrirResultado(a.dataset.gk)});const gt=box.querySelector("#gTodo");if(gt)gt.onclick=()=>{GB.todo=true;pintaBusqueda(q,box0)}}
const recorte=R=>{const c={},o=[];for(const r of R){c[r.k]=(c[r.k]||0)+1;if(c[r.k]<=8)o.push(r)}return o};
function abrirResultado(key){const [k,id]=[key.slice(0,key.indexOf(":")),key.slice(key.indexOf(":")+1)];
  if(k==="x"){if(typeof verBandeja==="function")verBandeja();return}
  if(k==="e"){CUR.est=id;CUR.estCur="";CUR.vista="estudiante";irModulo("cur");return}if(k==="c"){CUR.curso=id;CUR.vista="curso";CUR.sub="lista";irModulo("cur");return}
  if(k==="cs"){if(typeof editarSesion==="function")editarSesion(id);return}
  if(typeof abrirItem==="function")abrirItem(key)}
