// =====================================================================================================
// Memphis · módulo DIARIO (agenda personal). Se carga después de app.js y usa sus piezas:
// cifrado, Dropbox, adjuntos cifrados (.fma), respaldos, papelera y deshacer.
// Una entrada del diario es UNA sola cosa (no se parte en «objetos»): texto en Markdown + fotos + audios +
// archivos + enlaces, con fecha/hora, y menciones @persona / #tema que la conectan con todo lo demás.
// Nada del diario va al archivo de sincronización sin cifrar (finanzas_sync.json).
// =====================================================================================================
"use strict";
let MOD="fin",TD={vista:"dia",fecha:"",filtros:Object.assign({diario:true,eventos:true,google:true,clases:true,proy:true,salud:true,fin:true,venc:true,rec:true},(()=>{try{return JSON.parse(localStorage.getItem("memphisFiltros")||"{}")}catch(e){return{}}})()),q:"",ficha:"",soloAdj:false,tipoB:"todo"};
const DIAS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],DIASC=["dom","lun","mar","mié","jue","vie","sáb"];
const MESL=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const RE_ISO=/^\d{4}-\d{2}-\d{2}$/,RE_H=/^([01]\d|2[0-3]):[0-5]\d$/,RE_DT=/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/;
const fISO=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const dDe=f=>new Date(f+"T12:00:00");
const masDias=(f,n)=>{const d=dDe(f);d.setDate(d.getDate()+n);return fISO(d)};
const lunesDe=f=>{const d=dDe(f);return masDias(f,-((d.getDay()+6)%7))};
const fechaLarga=f=>{const d=dDe(f);return`${DIAS[d.getDay()]} ${d.getDate()} de ${MESL[d.getMonth()]} de ${d.getFullYear()}`};
const fechaCorta=f=>{const d=dDe(f);return`${DIASC[d.getDay()]} ${d.getDate()} ${MESN[d.getMonth()]}`};
const ahoraHM=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const tsBonito=t=>{if(!t)return"";const d=new Date(t);return isNaN(d)?"":`${fechaCorta(fISO(d))} ${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`};

// ---------------------------------------------------------------- validación (la llama migrar de app.js)
function migrarDiario(st,{ISO,ID,normA}){
  const s=(v,n)=>v==null?"":String(v).slice(0,n);
  st.diario=(Array.isArray(st.diario)?st.diario:[]).filter(e=>e&&typeof e==="object"&&ISO.test(String(e.fecha))).map(e=>{
    const o={id:ID.test(String(e.id))?String(e.id):uid(),tipo:e.tipo==="evento"?"evento":"nota",titulo:s(e.titulo,300),texto:s(e.texto,200000),fecha:String(e.fecha),
      hora:RE_H.test(String(e.hora||""))?String(e.hora):"",horaFin:RE_H.test(String(e.horaFin||""))?String(e.horaFin):"",fechaFin:ISO.test(String(e.fechaFin||""))&&String(e.fechaFin)>String(e.fecha)?String(e.fechaFin):"",todoDia:!!e.todoDia,lugar:s(e.lugar,300),
      alertas:(Array.isArray(e.alertas)?e.alertas:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=40320).slice(0,5),
      adjuntos:(Array.isArray(e.adjuntos)?e.adjuntos:[]).filter(a=>a&&typeof a==="object").map(normA).slice(0,200),
      enlaces:(Array.isArray(e.enlaces)?e.enlaces:[]).filter(l=>l&&/^https?:\/\//i.test(String(l.url))).map(l=>({url:s(l.url,2000),titulo:s(l.titulo,300),modo:l.modo==="completo"?"completo":"titulo",captura:/^[0-9a-f]{64}$/.test(String(l.captura||""))?String(l.captura):""})).slice(0,100),
      creado:RE_DT.test(String(e.creado))?String(e.creado):new Date().toISOString(),editado:RE_DT.test(String(e.editado))?String(e.editado):"",fijado:!!e.fijado,
      versiones:(Array.isArray(e.versiones)?e.versiones:[]).filter(v=>v&&RE_DT.test(String(v.t))).map(v=>({t:String(v.t),titulo:s(v.titulo,300),texto:s(v.texto,200000)})).slice(-30)};
    if(e.gcal&&typeof e.gcal==="object")o.gcal={uid:s(e.gcal.uid,400),desc:s(e.gcal.desc,20000),cal:s(e.gcal.cal,200),visto:RE_DT.test(String(e.gcal.visto))?String(e.gcal.visto):""};if(o.gcal&&e.gcal){if(/^[\w-]{1,40}$/.test(String(e.gcal.src||"")))o.gcal.src=String(e.gcal.src);if(e.gcal.fuera===true)o.gcal.fuera=true}
    if(e.cap&&typeof e.cap==="object")o.cap={de:s(e.cap.de,20),clas:e.cap.clas===true};if(ID.test(String(e.padre||""))&&String(e.padre)!==o.id)o.padre=String(e.padre);if(e.oculto===true)o.oculto=true;if(["extremos","oculta"].includes(e.vis))o.vis=e.vis;if(ID.test(String(e.proy||"")))o.proy=String(e.proy);if(/^#[0-9a-f]{6}$/i.test(String(e.color||"")))o.color=String(e.color);
    if(e.sinAviso===true)o.sinAviso=true;if(Array.isArray(e.recs)){const R=e.recs.filter(r=>r&&/^\d{4}-\d\d-\d\d$/.test(String(r.fecha))).map(r=>({id:/^[\w-]{3,40}$/.test(String(r.id||""))?String(r.id):"r"+Math.random().toString(36).slice(2,9),fecha:String(r.fecha),hora:/^\d\d:\d\d$/.test(String(r.hora||""))?String(r.hora):"",txt:s(r.txt,300),hecho:r.hecho===true})).slice(0,30);if(R.length)o.recs=R}
    if(e.priv&&typeof e.priv==="object"&&/^[\w+/=]{12,40}$/.test(String(e.priv.iv||""))&&typeof e.priv.ct==="string"&&/^[\w+/=]*$/.test(e.priv.ct)&&e.priv.ct.length<8e6)o.priv={iv:String(e.priv.iv),ct:String(e.priv.ct)};
    return o});
  st.fichas=(Array.isArray(st.fichas)?st.fichas:[]).filter(f=>f&&typeof f==="object"&&String(f.nombre||"").trim()).map(f=>({id:ID.test(String(f.id))?String(f.id):uid(),
    nombre:s(f.nombre,120).trim(),tipo:f.tipo==="tema"?"tema":f.tipo==="lugar"?"lugar":"persona",alias:(Array.isArray(f.alias)?f.alias:[]).map(a=>s(a,120).trim()).filter(Boolean).slice(0,20),
    nota:s(f.nota,20000),datos:typeof normDatosP==="function"?normDatosP(f.datos):{},creado:RE_DT.test(String(f.creado))?String(f.creado):new Date().toISOString(),editado:RE_DT.test(String(f.editado))?String(f.editado):""}));
  // «@yo» antes creaba una persona llamada «yo»: si ya hay alguien con relación «yo», esa ficha sobra
  if(st.fichas.some(f=>f.tipo==="persona"&&f.datos&&f.datos.rel==="yo"&&claveF(f.nombre)!=="yo"))st.fichas=st.fichas.filter(f=>!(f.tipo==="persona"&&claveF(f.nombre)==="yo"&&!(f.datos&&f.datos.rel&&f.datos.rel!=="yo")&&!f.nota));
}
const huellaD=e=>JSON.stringify([e.tipo,e.titulo,e.texto,e.fecha,e.hora,e.horaFin,e.fechaFin||"",e.todoDia,e.lugar,e.alertas,(e.adjuntos||[]).map(a=>a.sha||a.url||"").join(","),JSON.stringify(e.enlaces||[]),e.gcal?JSON.stringify(e.gcal):"",e.fijado,(e.versiones||[]).length,e.cap?JSON.stringify(e.cap):"",e.padre||"",!!e.oculto,e.vis||"",e.color||"",e.proy||"",e.recs?JSON.stringify(e.recs):"",e.sinAviso?"sa":"",e.priv?String(e.priv.ct).slice(0,80):""]);
const huellaFi=f=>JSON.stringify([f.nombre,f.tipo,f.alias,f.nota,f.datos&&Object.keys(f.datos).length?f.datos:""]);
const huellasD=L=>{const o={};for(const e of L||[])o[e.id]=huellaD(e);return o};
const huellasFi=L=>{const o={};for(const f of L||[])o[f.id]=huellaFi(f);return o};

// ---------------------------------------------------------------- menciones @persona y #tema
const RE_MEN=/(^|[\s(¿¡"'“])([@#])(?:\[([^\]\n]{1,80})\]|([\p{L}\p{N}][\p{L}\p{N}_\-]{0,60}))/gu;
const nomMen=(br,w)=>(br||w||"").replace(/_/g," ").trim();
function menciones(txt){const out=[];for(const m of String(txt||"").matchAll(RE_MEN)){const n=nomMen(m[3],m[4]);if(n&&!/^\d+$/.test(n))out.push({tipo:m[2]==="@"?"persona":"tema",nombre:n})}return out}
const claveF=n=>normK(n).replace(/\s+/g," ");
function fichaDe(nombre,tipo){const k=claveF(nombre);const f=(S.fichas||[]).find(f=>(!tipo||f.tipo===tipo)&&(claveF(f.nombre)===k||f.alias.some(a=>claveF(a)===k)));if(f)return f;
  if((!tipo||tipo==="persona")&&typeof porAtajo==="function"){const L=porAtajo(nombre);if(L.length===1)return L[0]}return undefined}
function asegurarFichas(txt){let n=0;for(const m of menciones(txt))if(!fichaDe(m.nombre,m.tipo)){if(m.tipo==="persona"&&typeof porAtajo==="function"&&porAtajo(m.nombre).length>1)continue;(S.fichas=S.fichas||[]).push({id:uid(),nombre:m.nombre,tipo:m.tipo,alias:[],nota:"",creado:new Date().toISOString(),editado:"",datos:claveF(m.nombre)==="yo"?{rel:"yo"}:{}});n++}return n}
function fichasDeEntrada(e){const set=new Map();for(const m of menciones(e.titulo+" "+e.texto)){const f=fichaDe(m.nombre,m.tipo);if(f)set.set(f.id,f)}return[...set.values()]}

// ---------------------------------------------------------------- Markdown seguro (sin HTML del usuario)
function mdInline(t){t=String(t).replace(/\u0000/g,"");const tok=[];const keep=h=>"\u0000"+(tok.push(h)-1)+"\u0000";
  t=t.replace(/`([^`\n]+)`/g,(_,c)=>keep(`<code>${esc(c)}</code>`));
  t=t.replace(/\[([^\]\n]{1,300})\]\((https?:\/\/[^\s)]+)\)/g,(_,x,u)=>keep(`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(x)}</a>`));
  t=t.replace(/(^|[\s(])(https?:\/\/[^\s<>()]+[^\s<>().,;:!?¿¡"'])/g,(_,p,u)=>p+keep(`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.length>60?u.slice(0,57)+"…":u)}</a>`));
  t=t.replace(RE_MEN,(_,p,s,br,w)=>{const n=nomMen(br,w);if(!n||/^\d+$/.test(n))return _;return p+keep(`<a href="#" class="men ${s==="@"?"per":"tem"}" data-men="${esc((s==="@"?"persona":"tema")+"|"+n)}">${s}${esc(n)}</a>`)});
  t=t.replace(RE_FTXT,(m0,p)=>{const x=m0.slice(p.length);const r=leerCuando(x,MDBASE||hoyISO());if(!r.fecha||r.hora)return m0;return p+keep(`<a href="#" class="fch" data-dia="${r.fecha}" title="Ver ${r.fecha} en la agenda">${esc(x)}${/^\d{4}-\d{2}-\d{2}$/.test(x)?"":` <span class="fchd">${r.fecha}</span>`}</a>`)});
  t=esc(t);
  t=t.replace(/\*\*([^*\n]+)\*\*/g,"<b>$1</b>").replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g,"$1<i>$2</i>").replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g,"$1<i>$2</i>").replace(/~~([^~\n]+)~~/g,"<s>$1</s>").replace(/==([^=\n]+)==/g,"<mark>$1</mark>");
  return t.replace(/\u0000(\d+)\u0000/g,(_,i)=>tok[+i])}
let MDBASE="";
const RE_FTXT=new RegExp("(^|[\\s(¿¡«\"'])(\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|el\\s+\\d{1,2}\\/\\d{1,2}|(?:el\\s+)?\\d{1,2}\\s+del\\s+\\d{1,2}(?:\\s+de\\s+\\d{4})?|\\d{1,2}\\s+(?:de|del)\\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)\\b\\.?(?:\\s+(?:de|del)\\s+\\d{4})?)(?![\\d:/])","gi");
function mdF(src,base){const b=MDBASE;MDBASE=base||"";try{return md(src)}finally{MDBASE=b}}
function md(src){const L=String(src||"").replace(/\r/g,"").split("\n");let h="",i=0;const lista=[];
  const cierra=()=>{while(lista.length)h+=`</${lista.pop()}>`};
  for(;i<L.length;i++){const l=L[i];
    if(/^```/.test(l)){cierra();let c=[];i++;while(i<L.length&&!/^```/.test(L[i]))c.push(L[i++]);h+=`<pre><code>${esc(c.join("\n"))}</code></pre>`;continue}
    let m;
    if(m=l.match(/^(#{1,3})\s+(.+)/)){cierra();h+=`<h${m[1].length+2}>${mdInline(m[2])}</h${m[1].length+2}>`;continue}
    if(/^(-{3,}|\*{3,})\s*$/.test(l)){cierra();h+="<hr>";continue}
    if(m=l.match(/^>\s?(.*)/)){cierra();h+=`<blockquote>${mdInline(m[1])}</blockquote>`;continue}
    if(m=l.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)/)){if(lista[lista.length-1]!=="ul"){cierra();lista.push("ul");h+='<ul class="tareas">'}h+=`<li><label class="tarea"><input type="checkbox" data-tarea="${i}" ${m[1]!==" "?"checked":""}> <span>${mdInline(m[2])}</span></label></li>`;continue}
    if(m=l.match(/^\s*[-*•]\s+(.*)/)){if(lista[lista.length-1]!=="ul"){cierra();lista.push("ul");h+="<ul>"}h+=`<li>${mdInline(m[1])}</li>`;continue}
    if(m=l.match(/^\s*\d+[.)]\s+(.*)/)){if(lista[lista.length-1]!=="ol"){cierra();lista.push("ol");h+="<ol>"}h+=`<li>${mdInline(m[1])}</li>`;continue}
    cierra();if(!l.trim()){h+='<div class="sp1"></div>';continue}h+=`<p>${mdInline(l)}</p>`}
  cierra();return h}
function htmlAMd(html){ // pegado «con formato»: HTML → Markdown (el HTML nunca se inserta en la página)
  let doc;try{doc=new DOMParser().parseFromString(html,"text/html")}catch(e){return null}
  const walk=(n,ctx)=>{if(n.nodeType===3)return n.nodeValue.replace(/\s+/g," ");if(n.nodeType!==1)return"";const t=n.tagName.toLowerCase();
    if(/^(script|style|head|meta|noscript|template|svg|iframe|object)$/.test(t))return"";
    const hijos=c=>[...n.childNodes].map(x=>walk(x,c||ctx)).join("");
    switch(t){case"br":return"\n";case"p":case"div":case"section":case"article":case"tr":return"\n"+hijos().trim()+"\n";
      case"h1":return"\n# "+hijos().trim()+"\n";case"h2":return"\n## "+hijos().trim()+"\n";case"h3":case"h4":case"h5":case"h6":return"\n### "+hijos().trim()+"\n";
      case"b":case"strong":{const x=hijos().trim();return x?"**"+x+"**":""}case"i":case"em":{const x=hijos().trim();return x?"*"+x+"*":""}
      case"s":case"del":case"strike":{const x=hijos().trim();return x?"~~"+x+"~~":""}case"code":return"`"+n.textContent+"`";case"pre":return"\n```\n"+n.textContent+"\n```\n";
      case"blockquote":return"\n> "+hijos().trim()+"\n";case"a":{const u=n.getAttribute("href")||"",x=hijos().trim();return/^https?:\/\//i.test(u)?(x&&x!==u?`[${x}](${u})`:u):x}
      case"ul":return"\n"+[...n.children].map(li=>"- "+walk(li,"ul").trim()).join("\n")+"\n";case"ol":return"\n"+[...n.children].map((li,k)=>(k+1)+". "+walk(li,"ol").trim()).join("\n")+"\n";
      case"td":case"th":return hijos().trim()+" · ";case"img":return"";default:return hijos()}};
  return walk(doc.body,"").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim()}

// ---------------------------------------------------------------- «mañana a las 2 pm almuerzo con el jefe»
const NUM={un:1,una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,quince:15,veinte:20,treinta:30};
const MESX={enero:1,ene:1,febrero:2,feb:2,marzo:3,mar:3,abril:4,abr:4,mayo:5,may:5,junio:6,jun:6,julio:7,jul:7,agosto:8,ago:8,septiembre:9,setiembre:9,sep:9,sept:9,octubre:10,oct:10,noviembre:11,nov:11,diciembre:12,dic:12};
const DIAX={domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6,dom:0,lun:1,mie:3,jue:4,vie:5,sab:6};
// Lee fechas y horas en español dentro de un texto. modo:"pasado" (lo que ya ocurrió: notas, salud, gastos) o "futuro" (citas y eventos):
// solo decide los casos sin pista («el viernes»). Devuelve fecha, hora, fechaFin, horaFin, aprox, titulo (el texto sin la fecha) y resto.
function leerCuando(txt,base,op){base=base||hoyISO();op=op||{};const modo=op.modo==="pasado"?"pasado":"futuro";const orig=String(txt||"");
  let n=[...orig].map(c=>{const x=c.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();return x.length===1?x:c.toLowerCase().length===1?c.toLowerCase():" "}).join("");
  let o=[...orig];const quita=(i,len)=>{for(let k=i;k<i+len;k++){o[k]=" ";n=n.slice(0,k)+" "+n.slice(k+1)}};
  const busca=(re,fn)=>{const m=re.exec(n);if(!m)return false;const r=fn(m);if(r!==false)quita(m.index,m[0].length);return r!==false};
  let fecha="",hora="",fechaFin="",horaFin="",aprox=false,conAnio=false;
  const by=+base.slice(0,4),bd=dDe(base);
  const mk=(y,m,d)=>{if(!(m>=1&&m<=12&&d>=1&&d<=31))return"";const f=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const t=dDe(f);return t.getDate()===d&&t.getMonth()+1===m?f:""};
  const dist=f=>Math.abs(dDe(f)-bd);
  const cercana=(m,d)=>[by-1,by,by+1].map(y=>mk(y,m,d)).filter(Boolean).sort((a,b)=>dist(a)-dist(b))[0]||"";
  const anio=a=>a?(a.length===2?2000+ +a:+a):0;
  const conDiaSemana=(w,d)=>{let best="";for(let k=-14;k<=14;k++){const x=new Date(bd.getFullYear(),bd.getMonth()+k,d,12);if(x.getDate()!==d||x.getDay()!==w)continue;const f=fISO(x);if(!best||dist(f)<dist(best))best=f}return best};
  const nombreDia=w=>{const hoy=bd.getDay();return w}; // (claridad)
  const semana=(w,cual)=>{const hoy=bd.getDay();if(cual==="prox"){let d=(w-hoy+7)%7;return masDias(base,d||7)}if(cual==="pas"){let d=(hoy-w+7)%7;return masDias(base,-(d||7))}
    if(cual==="este"){return masDias(lunesDe(base),(w+6)%7)}return modo==="pasado"?masDias(base,-((hoy-w+7)%7)):masDias(base,(w-hoy+7)%7)};
  const nu=s=>+s||NUM[s]||0;const MES=Object.keys(MESX).sort((a,b)=>b.length-a.length).join("|"),DIA=Object.keys(DIAX).sort((a,b)=>b.length-a.length).join("|");
  const NN="\\d{1,2}|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta";
  const fechas=[]; // {i,len,f,y}
  const toma=(re,fn)=>{re=new RegExp(re.source,"g");let m;const zonas=[];while((m=re.exec(n))){const r=fn(m);if(r&&r.f){zonas.push({i:m.index,len:m[0].length,...r})}}for(const z of zonas){quita(z.i,z.len);fechas.push(z)}};
  // 1) rango con un solo mes: «del 20 al 23 de noviembre», «entre el 3 y el 5 de mayo de 2026»
  toma(new RegExp(`\\b(?:del|desde el|desde|entre el|entre|de)\\s+(?:(?:${DIA})\\s+)?(\\d{1,2})\\s+(?:al|a|hasta el|hasta|y el|y)\\s+(?:(?:${DIA})\\s+)?(\\d{1,2})\\s+(?:de|del)\\s+(${MES})\\b(?:\\s+(?:de|del)\\s+(\\d{4}))?`),m=>{const y=anio(m[4]);let a=y?mk(y,MESX[m[3]],+m[1]):cercana(MESX[m[3]],+m[1]),b=y?mk(y,MESX[m[3]],+m[2]):cercana(MESX[m[3]],+m[2]);if(!a||!b)return null;if(b<a)return null;fechaFin=b;conAnio=!!y;return{f:a,rango:true}});
  // 2) fechas completas
  toma(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,m=>({f:mk(+m[1],+m[2],+m[3]),y:1}));
  toma(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?\b/,m=>({f:m[3]?mk(anio(m[3]),+m[2],+m[1]):cercana(+m[2],+m[1]),y:!!m[3]}));
  toma(/\b(?:el\s+)?(\d{1,2})-(\d{1,2})-(\d{4}|\d{2})\b/,m=>({f:mk(anio(m[3]),+m[2],+m[1]),y:1}));
  toma(/\bel\s+(\d{1,2})-(\d{1,2})\b(?!\s*(?:am|pm|a\.|p\.|h\b|horas))/,m=>({f:cercana(+m[2],+m[1])}));
  toma(new RegExp(`\\b(?:el\\s+)?(?:(?:${DIA})\\s+)?(\\d{1,2})\\s+(?:de|del)\\s+(${MES})\\b\\.?(?:\\s+(?:de|del)\\s+(\\d{4})|\\s+(\\d{4}))?`),m=>{const y=anio(m[3]||m[4]);return{f:y?mk(y,MESX[m[2]],+m[1]):cercana(MESX[m[2]],+m[1]),y:!!y}});
  toma(new RegExp(`\\b(${MES})\\s+(\\d{1,2})\\b(?!\\s*(?::|am|pm|a\\.|p\\.))(?:\\s+(?:de|del)?\\s*(\\d{4}))?`),m=>{const y=anio(m[3]);return{f:y?mk(y,MESX[m[1]],+m[2]):cercana(MESX[m[1]],+m[2]),y:!!y}});
  toma(/\b(?:el\s+)?(\d{1,2})\s+del?\s+(\d{1,2})\b(?:\s+(?:de|del)\s+(\d{4}))?(?!\s*(?::|am|pm|a\.\s?m|p\.\s?m|de la|horas|personas|%))/,m=>{if(!/\bdel\s/.test(m[0])&&!/^el\s/.test(m[0]))return null;const y=anio(m[3]);return{f:y?mk(y,+m[2],+m[1]):cercana(+m[2],+m[1]),y:!!y}});
  // 3) día de la semana con número: «viernes 20»
  toma(new RegExp(`\\b(?:el\\s+)?(${DIA})\\s+(\\d{1,2})\\b(?!\\s*(?::|am|pm|a\\.|p\\.|de la|h\\b|horas))`),m=>({f:conDiaSemana(DIAX[m[1]],+m[2])}));
  // 4) aproximadas
  toma(new RegExp(`\\b(?:a|para)\\s+(principios|comienzos|inicios|mediados|finales|fines)\\s+de\\s+(${MES})\\b(?:\\s+(?:de\\s+)?(\\d{4}))?`),m=>{const d=/^(prin|comi|inic)/.test(m[1])?3:/^med/.test(m[1])?15:28;const y=anio(m[3]);aprox=true;return{f:y?mk(y,MESX[m[2]],d):cercana(MESX[m[2]],d)}});
  // 5) relativas
  toma(/\bpasado\s*manana\b/,()=>({f:masDias(base,2)}));toma(/\b(?:antes\s*de\s*ayer|anteayer|antier)\b/,()=>({f:masDias(base,-2)}));
  toma(/\banoche\b/,()=>({f:masDias(base,-1)}));
  toma(new RegExp(`\\bhace\\s+(${NN})\\s+(dias?|semanas?|mes(?:es)?|anos?)\\b`),m=>{const k=nu(m[1]);if(!k)return null;const u=m[2][0];return{f:u==="d"?masDias(base,-k):u==="s"?masDias(base,-7*k):u==="m"?sumarMeses(base,-k):sumarMeses(base,-12*k)}});
  toma(new RegExp(`\\b(?:en|dentro\\s+de)\\s+(${NN})\\s+(dias?|semanas?|mes(?:es)?|anos?)\\b`),m=>{let k=nu(m[1]);if(!k)return null;const u=m[2][0];if(u==="d"&&k===8)k=7;if(u==="d"&&k===15)k=14;return{f:u==="d"?masDias(base,k):u==="s"?masDias(base,7*k):u==="m"?sumarMeses(base,k):sumarMeses(base,12*k)}});
  toma(/\b(?:en|dentro\s+de)\s+(?:una|1)\s+semana\b/,()=>({f:masDias(base,7)}));
  toma(/\b(?:la\s+)?semana\s+pasada\b/,()=>{aprox=true;return{f:masDias(lunesDe(base),-7)}});
  toma(/\b(?:la\s+)?(?:proxima|siguiente|otra)\s+semana\b|\bla\s+semana\s+que\s+viene\b/,()=>{aprox=true;return{f:masDias(lunesDe(base),7)}});
  toma(/\b(?:el\s+)?mes\s+pasado\b/,()=>{aprox=true;return{f:sumarMeses(base.slice(0,8)+"01",-1)}});
  toma(/\b(?:el\s+)?(?:proximo|siguiente)\s+mes\b|\bel\s+mes\s+que\s+viene\b/,()=>{aprox=true;return{f:sumarMeses(base.slice(0,8)+"01",1)}});
  toma(/\bmanana\b(?<!(?:la|esta|en la|por la|de la|en la|del)\s+manana)/,()=>({f:masDias(base,1)}));
  toma(/\b(?:hoy|esta\s+(?:manana|tarde|noche))\b/,m=>{if(/tarde|noche/.test(m[0]))return{f:base};return{f:base}});toma(/\bayer\b/,()=>({f:masDias(base,-1)}));
  toma(new RegExp(`\\b(?:el\\s+|este\\s+|esta\\s+|la\\s+)?(proximo\\s+|siguiente\\s+|pasado\\s+)?(${DIA})(\\s+que\\s+viene|\\s+proximo|\\s+pasado|\\s+anterior)?\\b`),m=>{const w=DIAX[m[2]];const q=(m[1]||"")+(m[3]||"");const cual=/proximo|siguiente|que viene/.test(q)?"prox":/pasado|anterior/.test(q)?"pas":/^(este|esta)\s/.test(m[0])?"este":"";return{f:semana(w,cual),sem:1}});
  fechas.sort((a,b)=>a.i-b.i);
  if(fechas.length){const a=fechas[0];fecha=a.f;conAnio=conAnio||!!a.y;
    if(fechas.length>1&&!a.rango){const b=fechas[1],gap=n.slice(a.i+a.len,b.i);// lo que queda entre dos fechas (ya borradas)
      if(/^\s*[\d:apm. ]*(?:de la (?:manana|tarde|noche))?\s*(?:al|a|hasta el|hasta|y el|-|–)\s*$/.test(gap.replace(/\b(?:a las|las|la)\b/g," "))||/^\s*$/.test(gap)){let f2=b.f;if(f2<fecha&&b.sem)while(f2<fecha)f2=masDias(f2,7);else if(f2<fecha&&!b.y)f2=sumarMeses(f2,12);if(f2>=fecha)fechaFin=f2}}}
  // conectores sobrantes al principio de un rango
  // horas
  const SUF="(a\\.?\\s?m\\.?|p\\.?\\s?m\\.?|de la manana|de la tarde|de la noche|de la madrugada|en la manana|en la tarde|en la noche|por la manana|por la tarde|por la noche)";
  const suf=(h,s,sinSuf)=>{s=(s||"").replace(/[\s.]/g,"");if(/^p|tarde|noche/.test(s)){if(h<12)h+=12}else if(/^a|manana|madrugada/.test(s)){if(h===12)h=0}else if(sinSuf&&h>=1&&h<=6)h+=12;return h};
  const hm=(h,m)=>String(h).padStart(2,"0")+":"+String(m||0).padStart(2,"0");
  busca(new RegExp(`\\b(?:de|del|desde|entre)\\s+(?:las\\s+|la\\s+)?(\\d{1,2})(?:[:h.](\\d{2}))?\\s*${SUF}?\\s*(?:a|al|y|hasta)\\s+(?:las\\s+|la\\s+)?(\\d{1,2})(?:[:h.](\\d{2}))?\\s*${SUF}?(?![\\d/])`),m=>{
    let h1=+m[1],h2=+m[4];if(h1>23||h2>23)return false;const s2=m[6]||"",s1=m[3]||(!fechaFin&&h1<=h2?s2:"");
    h2=suf(h2,s2,!s2);h1=suf(h1,s1,!s1&&!s2);if(!fechaFin&&h1>h2&&h1-12>=0&&!m[3])h1-=12;hora=hm(h1,m[2]);horaFin=hm(h2,m[5])});
  const unaHora=()=>{let r="";busca(/\b(?:a|al)\s+medio\s?dia\b|\bmedio\s?dia\b/,()=>{r="12:00"})||busca(/\b(?:a\s+(?:la\s+)?)?medianoche\b/,()=>{r="00:00"})||
    busca(new RegExp(`\\b(?:a\\s+las|a\\s+la|como\\s+a\\s+las|tipo|las|la)\\s+(\\d{1,2}|${Object.keys(NUM).join("|")})(?:[:h.](\\d{2}))?(\\s+y\\s+(?:media|cuarto))?\\s*${SUF}?(?![\\d/])`),m=>{
      let h=+m[1]||NUM[m[1]];if(!(h>=0&&h<=23))return false;let mi=m[2]?+m[2]:/media/.test(m[3]||"")?30:/cuarto/.test(m[3]||"")?15:0;r=hm(suf(h,m[4],!m[4]),mi)})||
    busca(new RegExp(`\\b(\\d{1,2})(?:[:h.](\\d{2}))\\s*${SUF}?`),m=>{let h=+m[1];if(h>23||+m[2]>59)return false;r=hm(suf(h,m[3],false),m[2])})||
    busca(new RegExp(`\\b(\\d{1,2})\\s*(a\\.?\\s?m\\.?|p\\.?\\s?m\\.?|de la manana|de la tarde|de la noche|de la madrugada)`),m=>{let h=+m[1];if(h>12)return false;r=hm(suf(h,m[2],false),0)});return r};
  if(!hora){hora=unaHora();if(hora){const h2=unaHora();if(h2)horaFin=h2}}
  if(fecha&&!fechaFin&&horaFin&&horaFin<hora&&fechas.length>1)fechaFin=fechas[1].f;
  const limpia=s=>s.replace(/\s+/g," ").replace(/\b(?:del|desde el|desde|entre el|al|hasta el|hasta)\b(?=\s*(?:$|[,.;:]|\b(?:al|hasta|y)\b))/gi," ").replace(/\s+/g," ").replace(/^[\s,.;:\-–]+|[\s,.;:\-–]+$/g,"").replace(/^(el|la|a|de|del|para|desde|y)\s+/i,"").replace(/\s+(el|la|a|de|del|al|desde|hasta|y)$/i,"").trim();
  const resto=o.join("");const titulo=limpia(resto);
  return{fecha,hora,fechaFin:fechaFin&&fechaFin!==fecha?fechaFin:"",horaFin,aprox,titulo:titulo?titulo.charAt(0).toUpperCase()+titulo.slice(1):"",resto,encontrado:!!(fecha||hora)}}
// ¿el texto cuenta algo que ya pasó? (para decidir «el viernes» = el último o el próximo)
const PASADO_V=/\b(fui|fue|fuimos|fueron|tuve|tuvo|tuvimos|estuve|estuvo|estuvimos|hice|hizo|hicimos|dio|dieron|vi|vio|vimos|hubo|pude|pudo|dije|dijo|traje|trajo|puse|puso|era|estaba|habia|termino|empezo|comenzo|llego|paso|ocurrio)\b/;
const PASADO_NO=/^(tambien|cafe|despues|asi|aqui|alli|alla|aca|ahi|si|mi|ti|tu|el|mas|ya|bebe|jose|rene|ingles|frances|japones|anis|aji|esqui|ojala|quizas|jamas|papa|mama|bogota)$/;
function modoTexto(t,def){const o=String(t||"");if(PASADO_V.test(normK(o)))return"pasado";const w=o.toLowerCase().match(/[a-záéíóúñ]+/g)||[];if(w.some(x=>/[éóí]$/.test(x)&&x.length>2&&!PASADO_NO.test(normK(x))))return"pasado";
  if(/\b(voy a|vamos a|tengo|tenemos|hay que|debo|cita|reunion|recordar|recuerda|pendiente)\b/.test(normK(o)))return"futuro";return def||"futuro"}
// «vie 20 nov 2026 · 15:00 → sáb 21 nov 11:00»
function cuandoTxt(r){if(!r||!r.encontrado)return"";const d=f=>{const x=dDe(f);return["dom","lun","mar","mié","jue","vie","sáb"][x.getDay()]+" "+x.getDate()+" "+MESN[x.getMonth()]+" "+f.slice(0,4)};
  return(r.fecha?d(r.fecha):"")+(r.hora?" · "+r.hora:"")+(r.fechaFin?" → "+d(r.fechaFin):"")+(r.horaFin?(r.fechaFin?" ":"–")+r.horaFin:"")+(r.aprox?" (aprox.)":"")}

// ---------------------------------------------------------------- Google Calendar (sin conexión directa: enlace o .ics)
const gcDT=(f,h)=>f.replace(/-/g,"")+(h?"T"+h.replace(":","")+"00":"");
function finEvento(e){if(e.horaFin)return e.horaFin;if(!e.hora)return"";const [h,m]=e.hora.split(":").map(Number);const t=Math.min(23*60+59,h*60+m+60);return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")}
function gcalUrlD(e){const p=new URLSearchParams({action:"TEMPLATE",text:e.titulo||"(sin título)",ctz:"America/Bogota"});
  p.set("dates",e.hora&&!e.todoDia?gcDT(e.fecha,e.hora)+"/"+gcDT(e.fechaFin||e.fecha,e.fechaFin&&e.horaFin?e.horaFin:e.fechaFin?e.hora:finEvento(e)):gcDT(e.fecha)+"/"+gcDT(masDias(e.fechaFin||e.fecha,1)));
  const det=[(e.texto||"").slice(0,1500),e.alertas&&e.alertas.length?"Alertas deseadas: "+e.alertas.map(alertaTxt).join(", "):""].filter(Boolean).join("\n\n");if(det)p.set("details",det);if(e.lugar)p.set("location",typeof dirLugar==="function"?dirLugar(e.lugar):e.lugar);
  return"https://calendar.google.com/calendar/render?"+p.toString()}
const alertaTxt=m=>m>=1440?(m/1440)+" día"+(m>1440?"s":"")+" antes":m>=60?(m/60)+" h antes":m+" min antes";
function icsD(L){const e=s=>String(s||"").replace(/\\/g,"\\\\").replace(/[,;]/g,c=>"\\"+c).replace(/\r?\n/g,"\\n");const st=new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
  const out=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Memphis//Diario//ES","CALSCALE:GREGORIAN"];
  for(const x of L){out.push("BEGIN:VEVENT","UID:"+(x.gcal&&x.gcal.uid?x.gcal.uid.split("|")[0]:x.id+"@memphis"),"DTSTAMP:"+st);
    if(x.hora&&!x.todoDia){out.push("DTSTART;TZID=America/Bogota:"+gcDT(x.fecha,x.hora),"DTEND;TZID=America/Bogota:"+gcDT(x.fechaFin||x.fecha,x.fechaFin?(x.horaFin||x.hora):finEvento(x)))}else out.push("DTSTART;VALUE=DATE:"+gcDT(x.fecha),"DTEND;VALUE=DATE:"+gcDT(masDias(x.fechaFin||x.fecha,1)));
    out.push("SUMMARY:"+e(x.titulo||"(sin título)"));if(x.lugar)out.push("LOCATION:"+e(x.lugar));if(x.texto)out.push("DESCRIPTION:"+e(x.texto.slice(0,3000)));
    for(const a of x.alertas||[])out.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+e(x.titulo||"Recordatorio"),"TRIGGER:-PT"+a+"M","END:VALARM");out.push("END:VEVENT")}
  out.push("END:VCALENDAR");return out.map(l=>{let r="",s=l;while(s.length>74){r+=s.slice(0,74)+"\r\n ";s=s.slice(74)}return r+s}).join("\r\n")}
// --- lectura de .ics exportado de Google Calendar (incluye repeticiones sencillas)
function parseICS(txt){const lines=String(txt).replace(/\r\n[ \t]/g,"").replace(/\n[ \t]/g,"").split(/\r?\n/);const evs=[];let cur=null,cal="";
  const un=s=>s.replace(/\\n/gi,"\n").replace(/\\([,;\\])/g,"$1");
  for(const l of lines){if(l==="BEGIN:VEVENT"){cur={exdate:[]};continue}if(l==="END:VEVENT"){if(cur)evs.push(cur);cur=null;continue}
    const i=l.indexOf(":");if(i<0)continue;const head=l.slice(0,i),val=l.slice(i+1);const [name,...ps]=head.split(";");const P={};for(const p of ps){const [k,v]=p.split("=");P[k.toUpperCase()]=v}
    if(!cur){if(name==="X-WR-CALNAME")cal=un(val);continue}
    const N=name.toUpperCase();
    if(N==="DTSTART"||N==="DTEND"||N==="RECURRENCE-ID"){const d=icsFecha(val,P);if(d)cur[N]=d}
    else if(N==="EXDATE")for(const v of val.split(",")){const d=icsFecha(v,P);if(d)cur.exdate.push(d.fecha)}
    else if(N==="SUMMARY"||N==="DESCRIPTION"||N==="LOCATION"||N==="UID"||N==="RRULE"||N==="STATUS")cur[N]=N==="RRULE"?val:un(val)}
  return{cal,evs}}
function icsFecha(v,P){let m;
  if(P.VALUE==="DATE"||/^\d{8}$/.test(v)){m=v.match(/^(\d{4})(\d{2})(\d{2})/);return m?{fecha:`${m[1]}-${m[2]}-${m[3]}`,hora:"",todoDia:true}:null}
  m=v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);if(!m)return null;
  if(m[7]){const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6]));return{fecha:fISO(d),hora:String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"),todoDia:false}}
  return{fecha:`${m[1]}-${m[2]}-${m[3]}`,hora:`${m[4]}:${m[5]}`,todoDia:false}}
function expandirICS(evs,desde,hasta){const out=[],over=new Map();
  for(const e of evs)if(e["RECURRENCE-ID"]&&e.UID)over.set(e.UID+"|"+e["RECURRENCE-ID"].fecha,e);
  const mk=(e,f)=>{const s=e.DTSTART,en=e.DTEND;return{uid:(e.UID||"sin-uid")+(e.RRULE||e["RECURRENCE-ID"]?"|"+f:""),titulo:e.SUMMARY||"(sin título)",fecha:f,hora:s.todoDia?"":s.hora,horaFin:en&&!en.todoDia&&en.fecha===s.fecha?en.hora:"",todoDia:!!s.todoDia,lugar:e.LOCATION||"",desc:e.DESCRIPTION||"",cancelado:/CANCELLED/i.test(e.STATUS||"")}};
  for(const e of evs){if(!e.DTSTART||e["RECURRENCE-ID"])continue;
    if(!e.RRULE){if(e.DTSTART.fecha>=desde&&e.DTSTART.fecha<=hasta)out.push(mk(e,e.DTSTART.fecha));continue}
    const R={};for(const p of e.RRULE.split(";")){const [k,v]=p.split("=");R[k]=v}
    const freq=R.FREQ,iv=+R.INTERVAL||1,cnt=R.COUNT?+R.COUNT:1e9,until=R.UNTIL?(icsFecha(R.UNTIL,{})||{}).fecha||"9999":"9999";
    const byd=(R.BYDAY||"").split(",").filter(Boolean).map(x=>({SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6})[x.slice(-2)]).filter(x=>x!=null);
    let n=0;const ini=e.DTSTART.fecha;
    const emit=f=>{n++;if(f>until||n>cnt)return false;if(f>=desde&&f<=hasta&&!e.exdate.includes(f)){const ov=over.get(e.UID+"|"+f);if(ov){if(ov.DTSTART)out.push(Object.assign(mk(ov,ov.DTSTART.fecha),{uid:e.UID+"|"+f}))}else out.push(mk(e,f))}return f<=hasta};
    if(freq==="WEEKLY"&&byd.length){let w=lunesDe(ini);for(let k=0;k<3000;k++){const dias=byd.map(d=>masDias(w,(d+6)%7)).sort();let seguir=true;for(const f of dias){if(f<ini)continue;if(!emit(f)){seguir=false;break}}if(!seguir)break;w=masDias(w,7*iv)}}
    else for(let k=0;k<3000;k++){const f=freq==="DAILY"?masDias(ini,k*iv):freq==="WEEKLY"?masDias(ini,7*k*iv):freq==="MONTHLY"?sumarMeses(ini,k*iv):freq==="YEARLY"?sumarMeses(ini,12*k*iv):null;if(!f||!emit(f))break}}
  return out.filter(x=>!x.cancelado)}
function importarICS(){elegirArchivo(".ics,text/calendar",async f=>{const {cal,evs}=parseICS(await f.text());if(!evs.length){alert("No encontré eventos en ese archivo.");return}
  let desde=masDias(hoyISO(),-60),hasta=masDias(hoyISO(),120);
  const pinta=()=>{const L=expandirICS(evs,desde,hasta).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
    const est=x=>{const e=(S.diario||[]).find(d=>d.gcal&&d.gcal.uid===x.uid);return!e?"nuevo":(e.titulo===x.titulo&&e.fecha===x.fecha&&e.hora===x.hora&&e.lugar===x.lugar&&e.gcal.desc===x.desc)?"igual":"cambió"};
    const E=L.map(x=>({x,s:est(x)}));
    $("#icL").innerHTML=E.length?`<div class="tw" style="max-height:320px"><table><tr><th></th><th>Fecha</th><th>Evento</th><th></th></tr>${E.map(({x,s},i)=>`<tr><td><input type="checkbox" data-ic="${i}" ${s!=="igual"?"checked":""}></td><td class="small">${esc(fechaCorta(x.fecha))}${x.hora?" "+x.hora:""}</td><td>${esc(x.titulo)}${x.lugar?`<div class="small muted">${esc(x.lugar)}</div>`:""}</td><td><span class="chip ${s==="nuevo"?"ok":s==="cambió"?"warn":""}">${s}</span></td></tr>`).join("")}</table></div>`:'<p class="muted small">No hay eventos en esas fechas.</p>';
    $("#icL")._E=E};
  dlg("📅 Traer eventos de Google Calendar",`<p class="small">Archivo: <b>${esc(f.name)}</b>${cal?" · calendario «"+esc(cal)+"»":""} · ${evs.length} eventos. Los que ya trajiste antes se actualizan sin tocar tus notas, fotos ni audios.</p>
    <div class="filters"><label style="margin:0">Desde <input type="date" id="icD" value="${desde}"></label><label style="margin:0">Hasta <input type="date" id="icH" value="${hasta}"></label></div><div id="icL"></div>`,
   [["Cancelar","",cerrar],["Traer seleccionados","p",()=>{const E=$("#icL")._E||[];let n=0,u=0;const ah=new Date().toISOString();
     document.querySelectorAll("[data-ic]").forEach(c=>{if(!c.checked)return;const {x}=E[+c.dataset.ic];const e=(S.diario||[]).find(d=>d.gcal&&d.gcal.uid===x.uid);
       if(e){Object.assign(e,{titulo:x.titulo,fecha:x.fecha,hora:x.hora,horaFin:x.horaFin,todoDia:x.todoDia,lugar:x.lugar,editado:ah});e.gcal.desc=x.desc;e.gcal.visto=ah;u++}
       else{(S.diario=S.diario||[]).push({id:uid(),tipo:"evento",titulo:x.titulo,texto:"",fecha:x.fecha,hora:x.hora,horaFin:x.horaFin,todoDia:x.todoDia,lugar:x.lugar,alertas:[],adjuntos:[],enlaces:[],creado:ah,editado:"",fijado:false,versiones:[],gcal:{uid:x.uid,desc:x.desc,cal,visto:ah}});n++}});
     if(n||u){respaldoAuto("antes de traer eventos");changed()}cerrar();aviso(n||u?`${n} eventos nuevos${u?` · ${u} actualizados`:""}.`:"Nada nuevo: ya tenías todos esos eventos.");render()}]]);
  const re=()=>{desde=$("#icD").value||desde;hasta=$("#icH").value||hasta;pinta()};$("#icD").onchange=re;$("#icH").onchange=re;pinta()})}

// ---------------------------------------------------------------- miniaturas y audio (descifrados solo en memoria)
const MINI=new Map();
async function urlAdj(a){if(MINI.has(a.sha))return MINI.get(a.sha);const b=await bytesAdj(a);const u=URL.createObjectURL(new Blob([b],{type:a.mime}));BLOBS.push(u);MINI.set(a.sha,u);return u}
function llenarMedia(root){(root||document).querySelectorAll("[data-mini]:not([data-ok])").forEach(async el=>{el.dataset.ok=1;const e=buscaEntradaAdj(el.dataset.mini);if(!e)return;
  try{const u=await urlAdj(e);if(el.tagName==="IMG")el.src=u;else if(el.tagName==="AUDIO"){el.src=u}}catch(x){el.replaceWith(Object.assign(document.createElement("span"),{className:"small muted",textContent:"(no disponible en este equipo)"}))}})}
function buscaEntradaAdj(sha){for(const e of [...(S.diario||[]),...(S.salud||[]),...LISTAS_EXTRA.flatMap(L=>S[L.k]||[])])for(const a of e.adjuntos||[])if(a.sha===sha)return a;return(ADJ||[]).find(a=>a.sha===sha)}
const esImg=a=>/^image\/(jpeg|png|webp|gif)$/.test(a.mime),esAud=a=>/^audio\//.test(a.mime);
function galeria(e,{chico}={}){const A=(e.adjuntos||[]).filter(a=>a.tipo!=="enlace");if(!A.length)return"";
  const im=A.filter(esImg),au=A.filter(esAud),ot=A.filter(a=>!esImg(a)&&!esAud(a));
  return`${im.length?`<div class="gal ${chico?"chico":""}">${im.slice(0,chico?4:60).map(a=>`<img data-mini="${a.sha}" data-ver="${a.sha}" alt="${esc(a.original||"foto")}" loading="lazy">`).join("")}${chico&&im.length>4?`<span class="mas">+${im.length-4}</span>`:""}</div>`:""}
   ${au.map(a=>chico?`<span class="chip">🎙 audio${a.dur?" "+durTxt(a.dur):""}</span>`:`<div class="aud"><span>🎙</span><audio controls preload="none" data-mini="${a.sha}"></audio><span class="small muted">${esc(a.original||"")}${a.tam?" · "+Math.round(a.tam/1024)+" KB":""}</span></div>`).join("")}
   ${ot.map(a=>`<a href="#" class="chip" data-abrir="${a.sha}">${/pdf/.test(a.mime)?"📄":"📎"} ${esc(a.original||a.nombre)}</a>`).join("")}`}
const durTxt=s=>Math.floor(s/60)+":"+String(Math.round(s%60)).padStart(2,"0");
function enlacesHtml(e){return(e.enlaces||[]).map(l=>{const host=(l.url.match(/^https?:\/\/(?:www\.)?([^/]+)/i)||["",""])[1];const cap=l.captura&&(e.adjuntos||[]).find(a=>a.sha===l.captura);
  return`<div class="lnk"><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(l.modo==="completo"||!l.titulo?l.url:l.titulo)}</a>${l.modo!=="completo"&&l.titulo?`<span class="small muted"> · ${esc(host)}</span>`:""}${cap?`<img class="cap" data-mini="${cap.sha}" data-ver="${cap.sha}" alt="captura">`:""}</div>`}).join("")}

// ---------------------------------------------------------------- qué hay en un rango de fechas (todo conectado)
const esLarga=e=>!!(e&&e.fechaFin&&e.fechaFin>e.fecha);
const PAL_FR=["#1D9E75","#7F77DD","#D85A30","#378ADD","#BA7517","#D4537E","#639922","#5F5E5A"];
const colorFr=e=>e.color&&/^#[0-9a-f]{6}$/i.test(e.color)?e.color:PAL_FR[[...String(e.id)].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL_FR.length];
function franjaHtml(e,f){const D=Math.round((dDe(e.fechaFin)-dDe(e.fecha))/864e5)+1,n=Math.round((dDe(f)-dDe(e.fecha))/864e5)+1,abierta=TD.frAb===e.id+"|"+f,H=typeof hijosDe==="function"?hijosDe(e.id):[];
  const ico=e.gcal?"🗓️":/gripa|gripe|enferm|incapac|covid|fiebre|cirug|recuper/i.test(e.titulo)?"🤒":/viaje|paseo|vacacion/i.test(e.titulo)?"🧳":/congreso|simposio|encuentro|seminario|curso|taller/i.test(e.titulo)?"🎤":"↔️";
  return`<div class="franja ${abierta?"abierta":""}" style="--fc:${colorFr(e)}" data-fr="${esc(e.id)}|${f}"><div class="frh"><span class="frt">${ico} ${e.priv?"🔒 "+esc(e.titulo||"••••••"):esc(e.titulo||"(sin título)")}</span><span class="frd">día ${n} de ${D}${e.vis==="oculta"?" · oculta":""}</span><span class="frf">${abierta?"▾":"▸"}</span></div>
   ${abierta?`<div class="frb"><div class="small muted">${esc(fechaLarga(e.fecha))} → ${esc(fechaLarga(e.fechaFin))}${e.lugar?" · 📍 "+esc(e.lugar):""}</div>${!e.priv&&e.texto?`<div class="ex">${mdInline((e.texto||"").split("\n").filter(l=>l.trim()).slice(0,3).join(" · "))}</div>`:""}
    ${H.length?`<div class="small">🧳 ${H.length} anotación${H.length===1?"":"es"} · hoy: ${H.filter(x=>x.fecha===f).length}</div>`:""}
    <div class="filters" style="margin:6px 0 0"><button class="b s p" data-frv="${esc(e.id)}">Abrir</button>${e.gcal?"":`<button class="b s" data-fre="${esc(e.id)}">Editar</button><select class="b s" data-frs="${esc(e.id)}" title="Cómo se ve en la agenda"><option value="" ${!e.vis?"selected":""}>Mostrar todos los días</option><option value="extremos" ${e.vis==="extremos"?"selected":""}>Solo el primer y último día</option><option value="oculta" ${e.vis==="oculta"?"selected":""}>Ocultar de la agenda</option></select>`}</div></div>`:""}</div>`}
function itemsRango(desde,hasta){const f=TD.filtros,out=[];
  for(const e of S.diario||[])if(e.fecha<=hasta&&(e.fechaFin||e.fecha)>=desde&&!e.oculto&&!(esLarga(e)&&(e.vis==="oculta"||(e.vis==="extremos"&&desde===hasta&&desde!==e.fecha&&desde!==e.fechaFin)))&&(e.tipo==="evento"?(e.gcal&&e.gcal.src?f.google!==false:f.eventos):f.diario)){if(e.fecha>=desde)out.push({k:"d",fecha:e.fecha,hora:e.todoDia?"":e.hora,e});else out.push({k:"d",fecha:desde,hora:"",e,sigue:true})}
  if(f.eventos!==false)for(const p of (S.fichas||[]).filter(p=>p.tipo==="persona"&&p.datos&&p.datos.cumple)){let c=proxCumple(p.datos.cumple,desde);while(c<=hasta){out.push({k:"c",fecha:c,hora:"",p});c=proxCumple(p.datos.cumple,masDias(c,1))}}
  if(f.salud!==false)for(const r of S.salud||[]){if(r.fecha>=desde&&r.fecha<=hasta)out.push({k:"s",fecha:r.fecha,hora:r.hora||"",r});for(const v of r.vacunas||[])if(v.refuerzo&&v.refuerzo>=desde&&v.refuerzo<=hasta)out.push({k:"s",fecha:v.refuerzo,hora:"",r,ref:v})}
  if(f.venc)for(const b of S.biblio||[])if(b.vence&&b.vence>=desde&&b.vence<=hasta)out.push({k:"b",fecha:b.vence,hora:"",b,vence:true});
  if(f.fin)for(const m of S.mov)if(m.fecha>=desde&&m.fecha<=hasta)out.push({k:"m",fecha:m.fecha,hora:m.hora||"",m});
  if(f.venc)for(const v of S.venc||[])if(v.estado!=="cerrado"&&v.vence>=desde&&v.vence<=hasta)out.push({k:"v",fecha:v.vence,hora:"",v});
  if(f.rec)for(const r of S.rec||[])if(r.activo!==false)for(const fx of ocurrencias(r,desde,hasta))out.push({k:"r",fecha:fx,hora:"",r});
  return out.sort((a,b)=>a.fecha.localeCompare(b.fecha)||(a.hora||"").localeCompare(b.hora||""))}
function tarjetaItem(x){
  if(x.k==="b")return x.vence?`<div class="it ven click" data-b="${esc(x.b.id)}">🗂️ Vence: <b>${esc(x.b.titulo)}</b></div>`:tarjetaB(x.b);
  if(x.k==="c"){const c=x.p.datos.cumple,y=c.slice(0,4);return`<div class="it click" data-fi="${esc(x.p.id)}">🎂 Cumpleaños de <b>${esc(x.p.nombre)}</b>${y!=="0000"?` <span class="small muted">(${+x.fecha.slice(0,4)-+y} años)</span>`:""}${x.p.datos.rel?` <span class="chip">${esc(x.p.datos.rel)}</span>`:""}</div>`}
  if(x.k==="s")return x.ref?`<div class="it sal click" data-s="${esc(x.r.id)}">💉 Refuerzo: <b>${esc(x.ref.v)}</b> <span class="small muted">${esc(x.ref.p||x.r.personas.join(", "))}</span></div>`:tarjetaS(x.r,{conFecha:x.conFecha,corto:true});
  if(x.k==="d"){const e=x.e,F=fichasDeEntrada(e),ex=(e.texto||"").split("\n").filter(l=>l.trim()).slice(0,3).join("\n");
    return`<div class="it ${e.tipo}" data-d="${esc(e.id)}"><div class="ih"><span class="hr2">${x.sigue?"continúa":e.todoDia?"todo el día":e.hora?e.hora+(e.horaFin&&!e.fechaFin?"–"+e.horaFin:""):""}</span>${e.titulo?`<b>${e.tipo==="evento"?"📅 ":""}${esc(e.titulo)}</b>`:!ex?`<b class="muted">${(e.adjuntos||[]).length?"📎 Archivos":"(sin texto)"}</b>`:""}${e.gcal?'<span class="chip">Google</span>':""}${e.fijado?" 📌":""}${typeof chipVin==="function"?chipVin("d:"+e.id):""}</div>
      ${e.fechaFin?`<div class="small muted">→ hasta ${esc(fechaCorta(e.fechaFin))}${e.horaFin?" "+e.horaFin:""}</div>`:""}${e.lugar?`<div class="small muted">📍 ${esc(e.lugar)}</div>`:""}${ex?`<div class="ex ${e.titulo?"":"sintit"}">${mdF(ex,e.fecha)}</div>`:""}${e.gcal&&!e.texto?'<div class="small muted">✍️ Toca para anotar qué se hizo, subir fotos o documentos</div>':""}
      ${galeria(e,{chico:true})}${(e.enlaces||[]).length?`<div class="small muted">🔗 ${e.enlaces.length} enlace${e.enlaces.length>1?"s":""}</div>`:""}${F.length?`<div>${F.map(f=>`<a href="#" class="men ${f.tipo==="persona"?"per":"tem"}" data-men="${esc(f.tipo+"|"+f.nombre)}">${f.tipo==="persona"?"@":"#"}${esc(f.nombre)}</a>`).join(" ")}</div>`:""}</div>`}
  if(x.k==="m"){const m=x.m,c=calc(m);return`<div class="it fin click" data-m="${esc(m.id)}"><span class="hr2">${x.conFecha?esc(fechaCorta(m.fecha))+" "+m.fecha.slice(2,4):m.hora||""}</span>${icoCat(m.categoria||"")} ${esc(m.estab||m.desc)}${typeof chipVin==="function"?chipVin("m:"+m.id):""} <span class="${c.ingreso||/Reembolso/.test(m.tipo)?"pos":""}" style="float:right">${fmt(m.valor)}</span></div>`}
  if(x.k==="v")return`<div class="it ven click" data-v="${esc(x.v.id)}">⏰ Vence: <b>${esc(x.v.titulo)}</b> <span class="small muted">${esc(x.v.tipo)}</span></div>`;
  return`<div class="it rec click" data-r="${esc(x.r.id)}">🔁 Cobro: <b>${esc(x.r.nombre)}</b> <span class="small muted">${fmt(vigenteEn(x.r,x.fecha).monto||0)}</span></div>`}
function bindItems(root){root=root||$("#view");
  root.querySelectorAll("[data-d]").forEach(el=>el.onclick=ev=>{if(ev.target.closest("[data-men],[data-dia],a[href^=http],audio,input"))return;verD(el.dataset.d)});
  root.querySelectorAll("[data-vk]").forEach(el=>el.onclick=ev=>{ev.preventDefault();ev.stopPropagation();abrirItem(el.dataset.vk)});
  root.querySelectorAll("[data-dia]").forEach(el=>el.onclick=ev=>{ev.preventDefault();ev.stopPropagation();cerrarSiAbierto();TD.fecha=el.dataset.dia;TD.vista="dia";if(MOD!=="dia")irModulo("dia");else{syncTabsD();render()}});
  root.querySelectorAll("[data-m]").forEach(el=>el.onclick=()=>editar(el.dataset.m));root.querySelectorAll("[data-b]").forEach(el=>el.onclick=ev=>{if(ev.target.closest("[data-men],[data-dia],a[href^=http],audio,input,button"))return;ev.preventDefault();ev.stopPropagation();cerrarSiAbierto();verB(el.dataset.b)});root.querySelectorAll("[data-fi]").forEach(el=>el.onclick=ev=>{ev.stopPropagation();cerrarSiAbierto();TD.vista="fichas";TD.ficha=el.dataset.fi;if(MOD!=="dia")irModulo("dia");else{syncTabsD();render()}});root.querySelectorAll("[data-s]").forEach(el=>el.onclick=ev=>{if(ev.target.closest("[data-men],[data-sper],a[href^=http],audio,input,button"))return;ev.stopPropagation();verS(el.dataset.s)});root.querySelectorAll("[data-sperfil]").forEach(el=>el.onclick=ev=>{ev.stopPropagation();irPerfilS(el.dataset.sperfil)});root.querySelectorAll("[data-sper]").forEach(el=>el.onclick=ev=>{ev.preventDefault();ev.stopPropagation();irPerfilS(el.dataset.sper)});root.querySelectorAll("[data-v]").forEach(el=>el.onclick=ev=>{ev.stopPropagation();editarV(el.dataset.v)});root.querySelectorAll("[data-r]").forEach(el=>el.onclick=ev=>{ev.stopPropagation();editarR(el.dataset.r)});
  root.querySelectorAll("[data-men]").forEach(el=>el.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const [t,n]=el.dataset.men.split("|");let f=fichaDe(n,t);if(!f){asegurarFichas((t==="persona"?"@[":"#[")+n+"]");f=fichaDe(n,t);changed()}if(cerrarSiAbierto())0;TD.vista="fichas";TD.ficha=f.id;render()});
  root.querySelectorAll("[data-ver]").forEach(el=>el.onclick=ev=>{ev.stopPropagation();const a=buscaEntradaAdj(el.dataset.ver);if(a)abrirAdj(a)});
  root.querySelectorAll("[data-abrir]").forEach(el=>el.onclick=ev=>{ev.preventDefault();ev.stopPropagation();const a=buscaEntradaAdj(el.dataset.abrir);if(a)abrirAdj(a)});
  llenarMedia(root)}
function cerrarSiAbierto(){try{if($("#dlg").open){cerrar();return true}}catch(e){}return false}

// ---------------------------------------------------------------- vista principal
function vDiario(){if(!TD.fecha)TD.fecha=hoyISO();
  const V=[["dia","Día"],["semana","Semana"],["mes","Mes"],["anio","Año"]];const nav=["dia","semana","mes","anio"].includes(TD.vista);
  const tit=TD.vista==="dia"?fechaLarga(TD.fecha):TD.vista==="semana"?(()=>{const l=lunesDe(TD.fecha),d=masDias(l,6);return`Semana del ${dDe(l).getDate()} ${MESN[dDe(l).getMonth()]} al ${dDe(d).getDate()} ${MESN[dDe(d).getMonth()]} ${dDe(d).getFullYear()}`})():TD.vista==="mes"?MESL[dDe(TD.fecha).getMonth()]+" "+TD.fecha.slice(0,4):TD.fecha.slice(0,4);
  const fil=[["diario","📓 Notas"],["eventos","📅 Mis eventos"],...((S.diario||[]).some(e=>e.gcal&&e.gcal.src)?[["google","🗓️ Google"]]:[]),...(typeof C!=="undefined"&&C&&C.ses.length?[["clases","🎓 Clases"]]:[]),...((S.ptar||[]).length?[["proy","🎯 Proyectos"]]:[]),["salud","🩺 Salud"],["fin","💰 Finanzas"],["venc","⏰ Vencimientos"],["rec","🔁 Cobros"]];const soloN=Object.keys(TD.filtros).every(k=>k==="diario"?TD.filtros[k]:!TD.filtros[k]);
  let h=`<div class="cap card"><div class="caprow"><input id="qc" placeholder="Escribe algo… «mañana a las 2 pm almuerzo con el jefe» o «hoy salí al parque con @Ana»" autocomplete="off"><button class="b p" id="qcG">Guardar</button></div>
     <div id="qcP" class="small muted">Con fecha u hora se guarda como evento; sin ellas, como nota de ahora. Usa @persona y #tema para conectarla.</div>
     <div class="filters" style="margin:6px 0 0"><button class="b s" id="qcN">✍️ Nota completa</button><button class="b s" id="qcF">📷 Foto</button><button class="b s" id="qcA">🎙 Audio</button><button class="b s" id="qcI">📅 Traer de Google (.ics)</button></div></div>`;
  if(nav)h+=`<div class="dnav"><button class="b s" id="dPrev">◀</button><button class="b s" id="dHoy">Hoy</button><button class="b s" id="dNext">▶</button><h2 class="dtit">${esc(tit.charAt(0).toUpperCase()+tit.slice(1))}</h2><span class="sp"></span><div class="seg">${V.map(([k,l])=>`<button data-dv="${k}" class="${TD.vista===k?"on":""}">${l}</button>`).join("")}</div></div>
    <div class="chips"><button class="fchip ${soloN?"on":"off"}" id="flSolo" title="Ver solo las notas">${soloN?"↩ Ver todo":"📓 Solo notas"}</button>${fil.map(([k,l])=>`<button class="fchip ${TD.filtros[k]?"on":"off"}" data-fl="${k}">${l}</button>`).join("")}</div>`;
  if(TD.vista==="dia")h+=vDia();else if(TD.vista==="semana")h+=vSemana();else if(TD.vista==="mes")h+=vMes();else if(TD.vista==="anio")h+=vAnio();else if(TD.vista==="buscar")h+=vBuscar();else if(TD.vista==="fichas")h+=vFichas();
  $("#view").innerHTML=h;bindDiario()}
function vDia(){const L=itemsRango(TD.fecha,TD.fecha),dd=L.filter(x=>x.k==="d"||x.k==="s"||x.k==="c"||x.k==="cl"||x.k==="pt"),fin=L.filter(x=>x.k==="m"),pend=L.filter(x=>x.k==="v"||x.k==="r"||x.k==="b");
  const lar=dd.filter(x=>x.k==="d"&&esLarga(x.e)),esNota=x=>x.k==="d"&&x.e.tipo==="nota"&&!esLarga(x.e),ag=dd.filter(x=>!esNota(x)&&!lar.includes(x)),no=dd.filter(esNota),todo=ag.filter(x=>!x.hora),conH=ag.filter(x=>x.hora),
    ocultas=(S.diario||[]).filter(e=>esLarga(e)&&e.vis==="oculta"&&e.fecha<=TD.fecha&&e.fechaFin>=TD.fecha),
    franjas=lar.length||ocultas.length?`<div class="franjas">${lar.map(x=>franjaHtml(x.e,TD.fecha)).join("")}${ocultas.length?(TD.verOcultas?ocultas.map(e=>franjaHtml(e,TD.fecha)).join(""):`<a href="#" class="small muted" id="frOc">👁 ${ocultas.length} actividad${ocultas.length>1?"es":""} oculta${ocultas.length>1?"s":""}</a>`):""}</div>`:"",
    sinH=todo.filter(x=>x.k==="d"),pild=sinH.length?`<div class="pildoras">${sinH.map(x=>`<span class="pildora ${x.e.tipo}" data-d="${esc(x.e.id)}">${x.e.priv?"🔒 "+esc(x.e.titulo||"••••••"):esc(x.e.titulo||(x.e.texto||"").split("\n")[0].slice(0,50)||"(sin título)")}</span>`).join("")}</div>`:"",g=fin.reduce((a,x)=>a+calc(x.m).gasto,0);
  const bloqueAg=ag.length||franjas?`${no.length?'<h3 class="dblq">📅 Agenda</h3>':""}${franjas}${pild}${todo.filter(x=>x.k!=="d").map(tarjetaItem).join("")}${conH.length?`<div class="tl">${conH.map(tarjetaItem).join("")}</div>`:""}`:"";
  const bloqueNo=no.length?`${ag.length?`<h3 class="dblq">📓 Notas del día <span class="small muted">${no.length}</span></h3>`:""}${no.map(tarjetaItem).join("")}`:"";
  return`<div class="g2 dia"><div>${bloqueAg||bloqueNo?bloqueAg+bloqueNo:`<div class="card vacio">Nada anotado este día. Escribe arriba lo que pasó o lo que viene.</div>`}</div>
    <div>${pend.length?`<div class="card"><h2>⏰ Pendientes del día</h2>${pend.map(tarjetaItem).join("")}</div>`:""}${fin.length?`<div class="card"><h2>💰 Movimientos <span class="small muted">gasto ${fmt(g)}</span></h2>${fin.map(tarjetaItem).join("")}</div>`:""}</div></div>`}
function vSemana(){const l=lunesDe(TD.fecha),hoy=hoyISO(),fin7=masDias(l,6);
  const LL=TD.filtros.eventos===false&&TD.filtros.diario===false?[]:(S.diario||[]).filter(e=>esLarga(e)&&e.vis!=="oculta"&&!e.oculto&&e.fecha<=fin7&&e.fechaFin>=l&&(e.tipo==="evento"?(e.gcal&&e.gcal.src?TD.filtros.google!==false:TD.filtros.eventos):TD.filtros.diario));
  let h=LL.length?`<div class="semfr">${LL.map(e=>{const a=e.fecha<l?0:Math.round((dDe(e.fecha)-dDe(l))/864e5),b=e.fechaFin>fin7?6:Math.round((dDe(e.fechaFin)-dDe(l))/864e5);return`<div class="sfr" style="grid-column:${a+1}/${b+2};--fc:${colorFr(e)}" data-d="${esc(e.id)}">${e.fecha<l?"◂ ":""}${e.priv?"🔒 "+esc(e.titulo||"••••••"):esc(e.titulo||"(sin título)")}${e.fechaFin>fin7?" ▸":""}</div>`}).join("")}</div>`:"";h+='<div class="sem">';
  for(let i=0;i<7;i++){const f=masDias(l,i),L=itemsRango(f,f),dd=L.filter(x=>x.k!=="m"),fin=L.filter(x=>x.k==="m");
    h+=`<div class="sd ${f===hoy?"hoy":""}"><div class="sdh click" data-ir="${f}">${DIASC[dDe(f).getDay()]} <b>${dDe(f).getDate()}</b></div>${dd.filter(x=>!(x.k==="d"&&esLarga(x.e))).map(x=>x.k==="d"?`<div class="mini ${x.e.tipo}" data-d="${esc(x.e.id)}">${x.hora?`<span class="hr2">${x.hora}</span>`:""}${esc(x.e.titulo||(x.e.texto||"").slice(0,40)||"(nota)")}${(x.e.adjuntos||[]).length?" 📎":""}</div>`:x.k==="c"?`<div class="mini" data-fi="${esc(x.p.id)}">🎂 ${esc(x.p.nombre)}</div>`:x.k==="b"?`<div class="mini ven" data-b="${esc(x.b.id)}">🗂️ ${esc(x.b.titulo)}</div>`:x.k==="s"?`<div class="mini sal" data-s="${esc(x.r.id)}">${x.ref?"💉 "+esc(x.ref.v):sIco(x.r.tipo)+" "+esc(x.r.titulo)}</div>`:x.k==="v"?`<div class="mini ven" data-v="${esc(x.v.id)}">⏰ ${esc(x.v.titulo)}</div>`:x.k==="pt"?`<div class="mini ptm" data-pt="${esc(x.t.id)}" style="--fc:${x.p.color||"var(--mod)"}">${x.t.tipo==="hito"?"◆":"🎯"} ${esc(x.t.titulo.slice(0,34))}</div>`:x.k==="cl"?`<div class="mini cl" data-cls="${esc(x.s.id)}" style="--fc:${x.c.color||"var(--mod)"}">${x.hora?`<span class="hr2">${x.hora}</span>`:""}🎓 ${esc(x.c.nombre.slice(0,30))}</div>`:`<div class="mini rec" data-r="${esc(x.r.id)}">🔁 ${esc(x.r.nombre)}</div>`).join("")}${fin.length?`<div class="mini fin click" data-ir="${f}">💰 ${fin.length} mov. · ${fmtM(fin.reduce((a,x)=>a+calc(x.m).gasto,0))}</div>`:""}</div>`}
  return h+"</div>"}
function vMes(){const ini=TD.fecha.slice(0,7)+"-01",l=lunesDe(ini),hoy=hoyISO(),mes=ini.slice(0,7);let h=`<div class="mes">${["lun","mar","mié","jue","vie","sáb","dom"].map(d=>`<div class="mh">${d}</div>`).join("")}`;
  for(let i=0;i<42;i++){const f=masDias(l,i);if(i===35&&f.slice(0,7)!==mes)break;const L=itemsRango(f,f),dd=L.filter(x=>x.k==="d"),nf=L.filter(x=>x.k==="m").length,np=L.filter(x=>x.k==="v"||x.k==="r").length,ns=L.filter(x=>x.k==="s").length,ncl=L.filter(x=>x.k==="cl").length,npt=L.filter(x=>x.k==="pt").length;
    h+=`<div class="md ${f.slice(0,7)!==mes?"fuera":""} ${f===hoy?"hoy":""} click" data-ir="${f}"><div class="mn">${dDe(f).getDate()}</div>${dd.slice(0,3).map(x=>esLarga(x.e)?`<div class="mt larga" style="--fc:${colorFr(x.e)}">${f===x.e.fecha||dDe(f).getDay()===1?esc(x.e.titulo||"…"):"&nbsp;"}</div>`:`<div class="mt ${x.e.tipo}">${x.hora?x.hora+" ":""}${esc(x.e.priv?"🔒 "+(x.e.titulo||"••••"):x.e.titulo||(x.e.texto||"").slice(0,30)||"nota")}</div>`).join("")}${dd.length>3?`<div class="small muted">+${dd.length-3} más</div>`:""}<div class="mdots">${npt?`<span title="tareas de proyectos">🎯${npt}</span>`:""}${ncl?`<span title="clases">🎓${ncl}</span>`:""}${ns?`<span title="salud">🩺${ns}</span>`:""}${nf?`<span title="${nf} movimientos">💰${nf}</span>`:""}${np?`<span title="pendientes">⏰${np}</span>`:""}</div></div>`}
  return h+"</div>"}
function vAnio(){const y=TD.fecha.slice(0,4),cnt={};for(const e of S.diario||[])if(e.fecha.startsWith(y))cnt[e.fecha]=(cnt[e.fecha]||0)+1;const hoy=hoyISO();
  let h='<div class="anio">';for(let m=0;m<12;m++){const ini=`${y}-${String(m+1).padStart(2,"0")}-01`,l=lunesDe(ini);const tot=Object.entries(cnt).filter(([f])=>f.startsWith(ini.slice(0,7))).reduce((a,[,v])=>a+v,0);
    h+=`<div class="am card"><div class="amh click" data-irm="${ini}">${MESL[m]} <span class="small muted">${tot?tot+" entradas":""}</span></div><div class="amg">`;
    for(let i=0;i<42;i++){const f=masDias(l,i);if(i>=35&&f.slice(0,7)!==ini.slice(0,7))break;const c=cnt[f]||0;h+=`<span class="ad ${f.slice(0,7)!==ini.slice(0,7)?"fuera":""} ${f===hoy?"hoy":""} n${Math.min(4,c)}" data-ir="${f}" title="${f}${c?" · "+c:""}">${dDe(f).getDate()}</span>`}
    h+="</div></div>"}return h+"</div>"}
// ---------------------------------------------------------------- búsqueda en todo
let BUSCA_RES=[];
function vBuscar(){const q=normK(TD.q),res=[];
  const TB0=TD.tipoB;if(TD.enPriv)TD.tipoB="diario";
  if(q||TD.soloAdj){const ok=s=>!q||normK(s).includes(q);
    if(["todo","diario"].includes(TD.tipoB))for(const e of S.diario||[]){if(!!e.priv!==!!TD.enPriv)continue;if(TD.soloAdj&&!(e.adjuntos||[]).length)continue;const txt=[e.titulo,e.texto,e.lugar,e.gcal&&e.gcal.desc,(e.enlaces||[]).map(l=>l.url+" "+l.titulo).join(" "),(e.adjuntos||[]).map(a=>a.original||a.nombre).join(" ")].join(" ");if(ok(txt))res.push({k:"d",fecha:e.fecha,hora:e.hora,e,txt})}
    if(["todo","salud"].includes(TD.tipoB))for(const r of S.salud||[]){if(TD.soloAdj&&!(r.adjuntos||[]).length)continue;const txt=[r.titulo,r.texto,r.lugar,r.medico,r.esp,r.personas.join(" "),r.sintomas.join(" "),(r.meds||[]).map(m=>m.n).join(" "),(r.vacunas||[]).map(v=>v.v).join(" "),(r.adjuntos||[]).map(a=>a.original||a.nombre).join(" ")].join(" ");if(ok(txt))res.push({k:"s",fecha:r.fecha,hora:r.hora,r,txt,conFecha:true})}
    if(["todo","biblio"].includes(TD.tipoB))for(const b of S.biblio||[]){if(TD.soloAdj&&!(b.adjuntos||[]).length)continue;const txt=[b.titulo,b.texto,b.url,b.autores.join(" "),b.revista,b.etiquetas.join(" "),(b.adjuntos||[]).map(a=>a.original||a.nombre).join(" ")].join(" ");if(ok(txt))res.push({k:"b",fecha:diaLocal(b.creado),hora:"",b,txt})}
    if(["todo","fin"].includes(TD.tipoB)&&!TD.soloAdj||TD.tipoB==="fin")for(const m of S.mov){const txt=[m.estab,m.desc,m.concepto,m.categoria,m.nota,m.cuenta].join(" ");if(ok(txt)&&(!TD.soloAdj||(m.adjuntos||[]).length))res.push({k:"m",fecha:m.fecha,hora:m.hora||"",m,txt})}
    if(["todo","venc"].includes(TD.tipoB))for(const v of S.venc||[]){const txt=[v.titulo,v.tipo,v.comercio,v.nota].join(" ");if(ok(txt)&&(!TD.soloAdj||(v.adjuntos||[]).length))res.push({k:"v",fecha:v.vence,hora:"",v,txt})}}
  TD.tipoB=TB0;res.sort((a,b)=>b.fecha.localeCompare(a.fecha)||(b.hora||"").localeCompare(a.hora||""));BUSCA_RES=res;
  const snip=t=>{if(!q)return"";const n=normK(t),i=n.indexOf(q);if(i<0)return"";const a=Math.max(0,i-50);return esc((a?"…":"")+t.slice(a,i))+"<mark>"+esc(t.slice(i,i+q.length))+"</mark>"+esc(t.slice(i+q.length,i+q.length+80))+"…"};
  return`<div class="filters"><input id="bq" placeholder="Buscar en el diario, salud, finanzas y vencimientos…" value="${esc(TD.q)}" style="flex:1;min-width:200px"><select id="bt">${[["todo","Todo"],["diario","Diario"],["salud","Salud"],["biblio","Biblioteca"],["fin","Finanzas"],["venc","Vencimientos"]].map(([k,l])=>`<option value="${k}" ${TD.tipoB===k?"selected":""}>${l}</option>`).join("")}</select><label class="small" style="margin:0"><input type="checkbox" id="bA" ${TD.soloAdj?"checked":""}> con adjuntos</label>${res.some(x=>x.k==="d"||x.k==="s")?'<button class="b s" id="bExp">📤 Exportar resultados</button>':""}</div>
   ${q||TD.soloAdj?`<div class="small muted" style="margin:6px 0">${res.length} resultados</div>${res.slice(0,300).map(x=>`<div class="bres"><div class="small muted">${esc(fechaCorta(x.fecha))} ${x.fecha.slice(0,4)}${x.hora?" · "+x.hora:""} · ${x.k==="d"?"Diario":x.k==="s"?"Salud":x.k==="b"?"Biblioteca":x.k==="m"?"Finanzas":"Vencimiento"}</div>${tarjetaItem(x)}${snip(x.txt)?`<div class="small snip">${snip(x.txt)}</div>`:""}</div>`).join("")}`:'<p class="muted small">Escribe para buscar. Encuentra texto dentro de notas, títulos, lugares, enlaces, nombres de archivos, eventos de Google, movimientos y vencimientos.</p>'}`}
// ---------------------------------------------------------------- personas y temas
function usosFicha(f){const nombres=[f.nombre,...f.alias].map(claveF);const re=f.tipo==="lugar"?e=>e.lugar&&nombres.includes(claveF(e.lugar))||(typeof lugarEn==="function"&&lugarEn(e.titulo+" "+e.texto)===f):e=>menciones(e.titulo+" "+e.texto).some(m=>m.tipo===f.tipo&&(nombres.includes(claveF(m.nombre))||fichaDe(m.nombre,f.tipo)===f));
  const ent=(S.diario||[]).filter(re).sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora));
  const pal=nombres.filter(n=>n.length>=3);const mov=S.mov.filter(m=>{const t=normK([m.estab,m.concepto,m.nota,m.desc,m.cuenta].join(" "));return pal.some(p=>new RegExp("(^|\\W)"+p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(\\W|$)").test(t))}).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const ven=(S.venc||[]).filter(v=>{const t=normK([v.titulo,v.nota].join(" "));return pal.some(p=>t.includes(p))});
  return{ent,mov,ven}}
function vFichas(){const F=(S.fichas||[]).slice().sort((a,b)=>a.nombre.localeCompare(b.nombre));const sel=F.find(f=>f.id===TD.ficha);
  if(!sel)return listaPersonasHtml();
  const u=usosFicha(sel),rel=new Map();for(const e of u.ent)for(const o of fichasDeEntrada(e))if(o.id!==sel.id)rel.set(o.id,{f:o,n:(rel.get(o.id)||{n:0}).n+1});for(const m of menciones(sel.nota)){const o=fichaDe(m.nombre,m.tipo);if(o&&o.id!==sel.id&&!rel.has(o.id))rel.set(o.id,{f:o,n:0})}
  const adj=u.ent.flatMap(e=>(e.adjuntos||[]).filter(a=>a.tipo!=="enlace").map(a=>({a,e})));
  return`<div class="filters"><button class="b s" id="fVol">← Personas</button></div>
   <div class="card"><div class="ih"><h2 style="margin:0">${sel.tipo==="persona"?"👤 @":sel.tipo==="lugar"?"📍 ":"🏷️ #"}${esc(sel.nombre)}</h2><span class="sp"></span><button class="b s" id="fEd">Editar ficha</button><button class="b s" id="fNota">+ Nota sobre ${esc(sel.nombre)}</button><button class="b s" id="fRel">🔗 Relacionar</button><button class="b s" id="fExp">📤 Exportar</button></div>
    ${sel.alias.length?`<div class="small muted">También: ${sel.alias.map(esc).join(", ")}</div>`:""}${datosPersonaHtml(sel)}${sel.nota?`<div class="mdv">${md(sel.nota)}</div>`:""}
    ${rel.size?`<div class="small" style="margin-top:6px">Relacionado: ${[...rel.values()].sort((a,b)=>b.n-a.n).map(({f})=>`<a href="#" class="men ${f.tipo==="persona"?"per":"tem"}" data-men="${esc(f.tipo+"|"+f.nombre)}">${f.tipo==="persona"?"@":"#"}${esc(f.nombre)}</a>`).join(" ")}</div>`:""}
    <div class="kpis" style="margin-top:10px"><div class="kpi"><div class="l">📓 Entradas</div><div class="v">${u.ent.length}</div>${u.ent.length?`<div class="small muted">desde ${esc(fechaCorta(u.ent[u.ent.length-1].fecha))} ${u.ent[u.ent.length-1].fecha.slice(0,4)}</div>`:""}</div><div class="kpi"><div class="l">📎 Fotos, audios y archivos</div><div class="v">${adj.length}</div></div><div class="kpi"><div class="l">💰 Movimientos que lo nombran</div><div class="v">${u.mov.length}</div>${u.mov.length?`<div class="small muted">${fmt(u.mov.reduce((a,m)=>a+(calc(m).gasto||(/Gasto de otra cuenta|Gasto en efectivo/.test(m.tipo)?+m.valor:0)),0))} gastados (familia)</div>`:""}</div></div></div>
   <div class="g2"><div><h2 class="sub">Línea de tiempo</h2>${u.ent.map(e=>`<div class="small muted dsep">${esc(fechaCorta(e.fecha))} ${e.fecha.slice(0,4)}</div>${tarjetaItem({k:"d",fecha:e.fecha,hora:e.hora,e})}`).join("")||'<p class="small muted">Sin entradas todavía.</p>'}</div>
    <div>${adj.length?`<div class="card"><h2>📎 Archivos</h2><div class="gal">${adj.filter(x=>esImg(x.a)).slice(0,30).map(x=>`<img data-mini="${x.a.sha}" data-ver="${x.a.sha}" alt="">`).join("")}</div>${adj.filter(x=>!esImg(x.a)).map(x=>`<div class="small"><a href="#" data-abrir="${x.a.sha}">${esAud(x.a)?"🎙":/pdf/.test(x.a.mime)?"📄":"📎"} ${esc(x.a.original||x.a.nombre)}</a> <span class="muted">${esc(x.e.fecha)}</span></div>`).join("")}</div>`:""}
     ${typeof ligadosFichaHtml==="function"?ligadosFichaHtml(sel):""}${sel.tipo==="persona"&&typeof saludDeFicha==="function"?saludDeFicha(sel):""}${sel.tipo==="lugar"&&typeof lugarExtra==="function"?lugarExtra(sel):""}${typeof bibDeFicha==="function"?bibDeFicha(sel):""}
     ${u.ven.length?`<div class="card"><h2>⏰ Vencimientos</h2>${u.ven.map(v=>tarjetaItem({k:"v",v})).join("")}</div>`:""}
     ${u.mov.length?`<div class="card"><h2>💰 Movimientos</h2>${u.mov.slice(0,60).map(m=>tarjetaItem({k:"m",m,conFecha:true})).join("")}${u.mov.length>60?`<div class="small muted">y ${u.mov.length-60} más</div>`:""}</div>`:""}</div></div>`}
function editarFicha(f,nueva){if((f&&f.tipo==="persona")||(!f&&nueva==="persona"))return editarPersona(f);if((f&&f.tipo==="lugar")||(!f&&nueva==="lugar"))return editarLugar(f);const nf=f||{id:uid(),nombre:"",tipo:nueva,alias:[],nota:"",creado:new Date().toISOString(),editado:""};
  dlg(f?"Editar ficha":nueva==="persona"?"Nueva persona":"Nuevo tema",`<label>Nombre</label><input id="fiN" value="${esc(nf.nombre)}" style="width:100%">
   <label>Tipo</label><select id="fiT"><option value="persona" ${nf.tipo==="persona"?"selected":""}>Persona</option><option value="tema" ${nf.tipo==="tema"?"selected":""}>Tema, proyecto o clase</option></select>
   <label>Otros nombres (separados por coma: apodos, cómo aparece en el banco…)</label><input id="fiA" value="${esc(nf.alias.join(", "))}" style="width:100%">
   <label>Nota de la ficha (Markdown; aquí puedes listar, por ejemplo, a los estudiantes de una clase con @Nombre)</label><textarea id="fiNo" rows="8" style="width:100%">${esc(nf.nota)}</textarea>
   ${f?'<div class="small muted">Las menciones con el nombre anterior siguen apuntando aquí si lo dejas como «otro nombre».</div>':""}`,
   [...(f?[["Borrar ficha","",()=>{if(!confirm("¿Borrar la ficha? Las notas no se borran; solo pierden el enlace."))return;S.fichas=S.fichas.filter(x=>x.id!==f.id);(S.eliminados=S.eliminados||[]).push({id:f.id,fecha:new Date().toISOString()});changed();cerrar();TD.ficha="";render()}]]:[]),
    ["Cancelar","",cerrar],["Guardar","p",()=>{const n=$("#fiN").value.trim();if(!n){alert("Pon un nombre");return}
      if(f&&claveF(n)!==claveF(f.nombre)&&!nf.alias.some(a=>claveF(a)===claveF(f.nombre)))nf.alias.push(f.nombre);
      Object.assign(nf,{nombre:n,tipo:$("#fiT").value,alias:[...new Set([...$("#fiA").value.split(",").map(x=>x.trim()).filter(Boolean),...(f?nf.alias.filter(a=>claveF(a)===claveF(f.nombre)):[])])],nota:$("#fiNo").value,editado:new Date().toISOString()});
      if(!f)(S.fichas=S.fichas||[]).push(nf);asegurarFichas(nf.nota);changed();cerrar();TD.vista="fichas";TD.ficha=nf.id;render()}]])}

// ---------------------------------------------------------------- captura rápida
function previewQC(){const t=$("#qc").value.trim();if(!t){$("#qcP").textContent="Con fecha u hora se guarda como evento; sin ellas, como nota de ahora. Usa @persona y #tema para conectarla.";return null}
  const modo=modoTexto(t,"futuro"),r=leerCuando(t,hoyISO(),{modo});const fecha=r.fecha||hoyISO();const ev=r.encontrado&&modo!=="pasado"&&(fecha>=hoyISO()||r.fechaFin)&&(r.fecha!==hoyISO()||r.hora);
  const lug=typeof lugarEn==="function"?lugarEn(t):null;
  $("#qcP").innerHTML=(ev?`📅 <b>Evento</b> · ${esc(cuandoTxt({...r,fecha,encontrado:true}))}${r.hora?"":" · todo el día"} · «${esc(r.titulo||t)}» <span class="muted">(al guardar puedes enviarlo a Google Calendar)</span>`:`📝 <b>Nota</b> · ${r.fecha?esc(cuandoTxt(r)):"hoy "+ahoraHM()}`)+(lug?` · 📍 ${esc(lug.nombre)}`:"")+(typeof sugerenciasHtml==="function"?sugerenciasHtml(t,"qc"):"");
  if(typeof bindSugerencias==="function")bindSugerencias("qc",previewQC);
  return{r,t,ev,fecha,lug}}
function guardarQC(){const p=previewQC();if(!p)return;const {r,t,ev,fecha,lug}=p;const ah=new Date().toISOString();
  const e={id:uid(),tipo:ev?"evento":"nota",titulo:ev?(r.titulo||t):"",texto:ev?"":t,fecha,hora:r.hora||(ev?"":(fecha===hoyISO()?ahoraHM():"")),horaFin:r.horaFin||"",fechaFin:r.fechaFin||"",todoDia:ev&&!r.hora,lugar:lug?lug.nombre:"",alertas:ev&&r.hora?[30]:[],adjuntos:[],enlaces:[],creado:ah,editado:"",fijado:false,versiones:[]};
  const urls=t.match(/https?:\/\/[^\s<>()]+/g);if(urls)e.enlaces=urls.slice(0,10).map(u=>({url:u,titulo:"",modo:"titulo",captura:""}));
  (S.diario=S.diario||[]).push(e);asegurarFichas(e.titulo+" "+e.texto);changed();$("#qc").value="";TD.fecha=e.fecha;
  deshacer(ev?"Evento guardado":"Nota guardada",()=>{S.diario=S.diario.filter(x=>x.id!==e.id);changed();render()});
  if(ev){render();setTimeout(()=>{if(confirm(`¿Añadir «${e.titulo}» a tu Google Calendar? Se abre Google con el evento listo; ahí eliges calendario y alertas.`))window.open(gcalUrlD(e),"_blank","noopener,noreferrer")},60)}else render()}
function bindDiario(){
  const qc=$("#qc");if(qc){qc.oninput=previewQC;qc.onkeydown=ev=>{if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();guardarQC()}};$("#qcG").onclick=guardarQC;
    $("#qcN").onclick=()=>{const p=previewQC();editarD(null,p?{texto:p.ev?"":p.t,titulo:p.ev?(p.r.titulo||p.t):"",fecha:p.fecha,hora:p.r.hora,horaFin:p.r.horaFin,fechaFin:p.r.fechaFin,lugar:p.lug?p.lug.nombre:"",tipo:p.ev?"evento":"nota"}:{fecha:TD.fecha})};
    $("#qcF").onclick=()=>editarD(null,{fecha:TD.fecha,accion:"foto"});$("#qcA").onclick=()=>editarD(null,{fecha:TD.fecha,accion:"audio"});$("#qcI").onclick=importarICS}
  const mv=k=>{const f=TD.fecha;TD.fecha=TD.vista==="dia"?masDias(f,k):TD.vista==="semana"?masDias(f,7*k):TD.vista==="mes"?sumarMeses(f.slice(0,7)+"-01",k):sumarMeses(f.slice(0,7)+"-01",12*k);render()};
  if($("#dPrev")){$("#dPrev").onclick=()=>mv(-1);$("#dNext").onclick=()=>mv(1);$("#dHoy").onclick=()=>{TD.fecha=hoyISO();render()}}
  document.querySelectorAll("[data-dv]").forEach(b=>b.onclick=()=>{TD.vista=b.dataset.dv;render()});
  const gF=()=>{try{localStorage.setItem("memphisFiltros",JSON.stringify(TD.filtros))}catch(e){}};document.querySelectorAll("[data-fl]").forEach(b=>b.onclick=()=>{TD.filtros[b.dataset.fl]=!TD.filtros[b.dataset.fl];gF();render()});
  if($("#flSolo"))$("#flSolo").onclick=()=>{const solo=Object.keys(TD.filtros).every(k=>k==="diario"?TD.filtros[k]:!TD.filtros[k]);if(solo){TD.filtros=Object.assign({},TD.filtrosAntes||{diario:true,eventos:true,google:true,clases:true,proy:true,salud:true,fin:true,venc:true,rec:true})}else{TD.filtrosAntes={...TD.filtros};for(const k of Object.keys(TD.filtros))TD.filtros[k]=k==="diario"}gF();render()};
  document.querySelectorAll("[data-ir]").forEach(b=>b.onclick=ev=>{if(ev.target.closest("[data-d]"))return;TD.fecha=b.dataset.ir;TD.vista="dia";render()});
  document.querySelectorAll("[data-irm]").forEach(b=>b.onclick=()=>{TD.fecha=b.dataset.irm;TD.vista="mes";render()});
  if($("#bq")){const bq=$("#bq");bq.oninput=()=>{TD.q=bq.value;clearTimeout(bq._t);bq._t=setTimeout(()=>{render();const i=$("#bq");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)};$("#bt").onchange=e=>{TD.tipoB=e.target.value;render()};$("#bA").onchange=e=>{TD.soloAdj=e.target.checked;render()}}
  document.querySelectorAll("[data-fi]").forEach(b=>b.onclick=()=>{TD.ficha=b.dataset.fi;render()});
  if($("#fVol"))$("#fVol").onclick=()=>{TD.ficha="";render()};if($("#fNP"))$("#fNP").onclick=()=>editarPersona(null);bindListaPersonas();{const fs=S.fichas.find(f=>f.id===TD.ficha);if(fs&&fs.tipo==="persona")bindDatosPersona(fs)}if($("#fNT"))$("#fNT").onclick=()=>editarFicha(null,"tema");
  if($("#fEd"))$("#fEd").onclick=()=>editarFicha(S.fichas.find(f=>f.id===TD.ficha));
  if($("#fRel"))$("#fRel").onclick=()=>{const f=S.fichas.find(x=>x.id===TD.ficha);dlg("🔗 "+f.nombre,'<p class="small muted">Liga a esta ficha gastos, notas, citas o documentos, aunque no la mencionen. Así ves todo junto y cuánto ha costado.</p>',[["Listo","p",()=>{cerrar();render()}]]);ponerRelaciones("f:"+f.id);$("#vPick").hidden=false;buscaVin("f:"+f.id)};
  if($("#fExp"))$("#fExp").onclick=()=>{const f=S.fichas.find(x=>x.id===TD.ficha);const u=usosFicha(f);const it=u.ent.map(e=>({k:"d",e}));if(f.tipo==="persona"&&typeof esDe==="function")for(const r of S.salud||[])if(esDe(r,f.nombre))it.push({k:"s",r});exportarItems(it,(f.tipo==="lugar"?"":"")+f.nombre)};
  if($("#bExp"))$("#bExp").onclick=()=>exportarItems(BUSCA_RES.filter(x=>x.k==="d"||x.k==="s"||x.k==="b"),"Búsqueda: "+(TD.q||"con adjuntos"));
  if($("#fNota"))$("#fNota").onclick=()=>{const f=S.fichas.find(x=>x.id===TD.ficha);editarD(null,{fecha:hoyISO(),texto:(f.tipo==="persona"?"@[":"#[")+f.nombre+"] "})};
  bindItems()}

// ---------------------------------------------------------------- ver una entrada (como una hoja de agenda)
function verD(id){const e=(S.diario||[]).find(x=>x.id===id);if(!e)return;const F=fichasDeEntrada(e);
  dlg(`${e.tipo==="evento"?"📅":"📓"} ${e.titulo||fechaCorta(e.fecha)}`,`<div class="small muted">${esc(fechaLarga(e.fecha))}${e.todoDia?" · todo el día":e.hora?" · "+e.hora+(e.horaFin&&!e.fechaFin?"–"+e.horaFin:""):""}${e.fechaFin?" → "+esc(fechaLarga(e.fechaFin))+(e.horaFin?" "+e.horaFin:""):""}${e.lugar?" · 📍 "+esc(e.lugar)+(typeof dirLugar==="function"&&dirLugar(e.lugar)!==e.lugar?` <span class="muted">(${esc(dirLugar(e.lugar))})</span>`:""):""}</div>
    ${e.gcal&&e.gcal.desc?`<details class="gdesc"><summary class="small">Descripción en Google Calendar${e.gcal.cal?" ("+esc(e.gcal.cal)+")":""}</summary><div class="mdv">${md(e.gcal.desc)}</div></details>`:""}
    <div class="mdv" id="vdTxt">${e.texto?mdF(e.texto,e.fecha):'<p class="muted small">Sin notas todavía.</p>'}</div>${galeria(e)}${enlacesHtml(e)}
    ${F.length?`<div style="margin-top:6px">${F.map(f=>`<a href="#" class="men ${f.tipo==="persona"?"per":"tem"}" data-men="${esc(f.tipo+"|"+f.nombre)}">${f.tipo==="persona"?"@":"#"}${esc(f.nombre)}</a>`).join(" ")}</div>`:""}
    <div class="small muted tss">Creado ${esc(tsBonito(e.creado))}${e.editado?` · última edición ${esc(tsBonito(e.editado))}`:""}${(e.versiones||[]).length?` · ${e.versiones.length} versión${e.versiones.length>1?"es":""} anterior${e.versiones.length>1?"es":""}`:""}</div>`,
   [["📤","",()=>exportarItems([{k:"d",e}],e.titulo||("Nota "+e.fecha))],...(e.tipo==="evento"?[["📅 A Google","",()=>window.open(gcalUrlD(e),"_blank","noopener,noreferrer")],[".ics","",()=>descargar(new Blob([icsD([e])],{type:"text/calendar"}),slug(e.titulo||"evento")+".ics")]]:[]),
    ...((e.versiones||[]).length?[["Historial","",()=>historialD(e)]]:[]),["Cerrar","",cerrar],["Editar","p",()=>editarD(e.id)]]);
  $("#dlg").classList.add("ancho");bindItems($("#dlgB"));
  $("#dlgB").querySelectorAll("[data-tarea]").forEach(c=>c.onchange=()=>{const L=e.texto.split("\n"),i=+c.dataset.tarea;L[i]=L[i].replace(/\[( |x|X)\]/,c.checked?"[x]":"[ ]");guardarVersion(e,e.titulo,L.join("\n"));changed()})}
function guardarVersion(e,titulo,texto){if(e.texto!==texto||e.titulo!==titulo){if(e.texto||e.titulo)(e.versiones=e.versiones||[]).push({t:e.editado||e.creado,titulo:e.titulo,texto:e.texto});e.versiones=(e.versiones||[]).slice(-30);e.titulo=titulo;e.texto=texto}e.editado=new Date().toISOString()}
function historialD(e){const V=(e.versiones||[]).map((v,i)=>({v,i})).reverse();
  dlg("Historial de cambios",`<p class="small">Versión actual: ${esc(tsBonito(e.editado||e.creado))}. Antes:</p>${V.map(({v,i})=>`<details class="card"><summary>${esc(tsBonito(v.t))} · ${esc(v.titulo||"(sin título)")}</summary><div class="mdv">${md(v.texto)}</div><button class="b s" data-rv="${i}">Volver a esta versión</button></details>`).join("")}`,
   [["Cerrar","",()=>verD(e.id)]]);
  document.querySelectorAll("[data-rv]").forEach(b=>b.onclick=()=>{const v=e.versiones[+b.dataset.rv];guardarVersion(e,v.titulo,v.texto);changed();aviso("Versión restaurada (la anterior quedó en el historial)");verD(e.id)})}

// ---------------------------------------------------------------- editor
let PEGA="plano",ENL=[],GRAB=null;
function editarD(id,pre){const e0=id?(S.diario||[]).find(x=>x.id===id):null;pre=pre||{};
  const e=e0?structuredClone(e0):{id:uid(),tipo:pre.tipo||"nota",titulo:pre.titulo||"",texto:pre.texto||"",fecha:pre.fecha||hoyISO(),hora:pre.hora||((pre.fecha||hoyISO())===hoyISO()&&(pre.tipo||"nota")==="nota"?ahoraHM():""),horaFin:pre.horaFin||"",fechaFin:pre.fechaFin||"",todoDia:false,lugar:pre.lugar||"",alertas:pre.tipo==="evento"?[30]:[],adjuntos:[],enlaces:[],creado:new Date().toISOString(),editado:"",fijado:false,versiones:[]};
  ADJ=(e.adjuntos||[]).slice();ENL=(e.enlaces||[]).map(l=>({...l}));
  ADJCTX=()=>({fecha:$("#deF").value||e.fecha,estab:$("#deT").value.trim()||"diario",concepto:"",desc:"",valor:0});ADJPINTA=pintaAdjD;ADJOPC={max:1920,q:0.8,umbral:350*1024};
  const AL=[[10,"10 min"],[30,"30 min"],[60,"1 h"],[1440,"1 día"]];
  dlg(e0?"Editar entrada":"Nueva entrada",`<div class="filters" style="margin:0"><div class="seg"><button data-tp="nota" class="${e.tipo==="nota"?"on":""}">📓 Nota</button><button data-tp="evento" class="${e.tipo==="evento"?"on":""}">📅 Evento</button></div>
     <label class="small" style="margin:0"><input type="checkbox" id="deP" ${e.fijado?"checked":""}> 📌 fijar</label></div>
    <input id="deT" placeholder="Título (opcional en notas)" value="${esc(e.titulo)}" style="width:100%;margin-top:8px;font-weight:600">
    <div class="filters"><input type="date" id="deF" value="${e.fecha}"><input type="time" id="deH" value="${e.hora}" title="Hora"><span class="evo">–</span><input type="time" id="deHF" class="evo" value="${e.horaFin}" title="Hasta"><label class="small evo" style="margin:0"><input type="checkbox" id="deTD" ${e.todoDia?"checked":""}> todo el día</label><span class="small evo">hasta el día</span><input type="date" id="deFF" class="evo" value="${e.fechaFin||""}" title="Si dura varios días">
     <input id="deW" placeholder="o escribe: mañana 2 pm" style="flex:1;min-width:140px" title="Fecha y hora en palabras"></div>
    <div class="evo"><input id="deL" placeholder="📍 Lugar (o un atajo: mi casa, mi trabajo…)" value="${esc(e.lugar)}" style="width:100%" list="deLL"><datalist id="deLL">${(S.fichas||[]).filter(f=>f.tipo==="lugar").map(f=>`<option value="${esc(f.nombre)}">`).join("")}</datalist><div class="small" style="margin-top:6px">Alertas: ${AL.map(([m,l])=>`<label class="fchip ${(e.alertas||[]).includes(m)?"on":"off"}"><input type="checkbox" data-al="${m}" ${(e.alertas||[]).includes(m)?"checked":""} hidden>${l}</label>`).join(" ")}</div></div>
    ${e.gcal&&e.gcal.desc?`<details class="gdesc"><summary class="small">Descripción que viene de Google</summary><div class="mdv">${md(e.gcal.desc)}</div></details>`:""}
    <div class="tb">${[["**","B","Negrita"],["*","I","Cursiva"],["# ","H","Título"],["- ","•","Lista"],["- [ ] ","☐","Tarea"],["> ","❝","Cita"],["==","▮","Resaltar"]].map(([m,l,t])=>`<button class="b s" data-mk="${esc(m)}" title="${t}">${l}</button>`).join("")}<button class="b s" data-mk="@" title="Persona">@</button><button class="b s" data-mk="#" title="Tema">#</button>
     <span class="sp"></span><button class="b s" id="dePega" title="Cómo se pega el texto copiado">${PEGA==="rico"?"Pegar: con formato":"Pegar: texto plano"}</button><button class="b s" id="dePrev">👁 Vista previa</button></div>
    <textarea id="deX" rows="10" style="width:100%" placeholder="Escribe libremente. Markdown opcional: **negrita**, *cursiva*, - listas, - [ ] tareas, # títulos. Menciona @[Nombre Apellido] o #[Matemáticas]. Pega capturas de pantalla directamente.">${esc(e.texto)}</textarea>
    <div id="deV" class="mdv card" hidden></div><div id="deSug"></div>
    <div class="filters"><button class="b s" id="deFo">📷 Foto</button><button class="b s" id="deIm">🖼 Imágenes</button><button class="b s" id="deFi">📎 PDF / archivo</button><button class="b s" id="deAu">🎙 Grabar audio</button><button class="b s" id="deLk">🔗 Enlace</button><span id="deRec" class="small"></span></div>
    <input type="hidden" id="adjT" value="Diario"><div id="adjL"></div><div id="deEnl"></div>
    <div class="small muted tss">${e0?`Creado ${esc(tsBonito(e.creado))}${e.editado?` · última edición ${esc(tsBonito(e.editado))}`:""}${(e.versiones||[]).length?` · ${e.versiones.length} versiones anteriores guardadas`:""}`:"Se guarda cifrado; cada cambio queda con su fecha y hora, y puedes volver a versiones anteriores."}</div>`,
   [...(e0?[["Borrar","",()=>{if(!confirm("¿Borrar esta entrada? Queda 30 días en la papelera."))return;cerrar();borrarConPapelera("diario",e0.id);render()}]]:[]),["Cancelar","",()=>{pararGrab(true);cerrar()}],["Guardar","p",()=>guardarD(e,e0)]]);
  $("#dlg").classList.add("ancho");
  const tipo=t=>{e.tipo=t;document.querySelectorAll("[data-tp]").forEach(b=>b.classList.toggle("on",b.dataset.tp===t));document.querySelectorAll(".evo").forEach(x=>x.hidden=t!=="evento")};tipo(e.tipo);
  document.querySelectorAll("[data-tp]").forEach(b=>b.onclick=()=>tipo(b.dataset.tp));
  document.querySelectorAll("[data-al]").forEach(c=>c.onchange=()=>c.parentElement.className="fchip "+(c.checked?"on":"off"));
  $("#deW").onchange=()=>{const w=$("#deW").value,r=leerCuando(w,hoyISO(),{modo:modoTexto(w,e.tipo==="evento"?"futuro":"pasado")});if(r.fecha)$("#deF").value=r.fecha;if(r.hora)$("#deH").value=r.hora;if(r.horaFin)$("#deHF").value=r.horaFin;if(r.fechaFin&&$("#deFF"))$("#deFF").value=r.fechaFin;if(!r.encontrado){alert("No entendí la fecha u hora. Ej.: «mañana 2 pm», «el jueves a las 10», «3 de diciembre de 2 a 4 pm».");return}if(r.titulo&&!$("#deT").value)$("#deT").value=r.titulo;if(r.hora||r.fecha!==hoyISO())tipo(r.hora&&e.tipo==="nota"&&!e0?"evento":e.tipo);$("#deW").value=""};
  const X=$("#deX");
  document.querySelectorAll("[data-mk]").forEach(b=>b.onclick=()=>marcar(X,b.dataset.mk));
  $("#dePega").onclick=()=>{PEGA=PEGA==="rico"?"plano":"rico";$("#dePega").textContent=PEGA==="rico"?"Pegar: con formato":"Pegar: texto plano"};
  $("#dePrev").onclick=()=>{const v=$("#deV");v.hidden=!v.hidden;if(!v.hidden){v.innerHTML=md(X.value)||'<p class="muted small">(vacío)</p>';X.hidden=true;$("#dePrev").textContent="✏️ Escribir"}else{X.hidden=false;$("#dePrev").textContent="👁 Vista previa"}};
  X.addEventListener("paste",async ev=>{const cd=ev.clipboardData;if(!cd)return;const files=[...cd.files||[]].filter(f=>/^image\//.test(f.type));
    if(files.length){ev.preventDefault();await adjuntarArchivos(files.map((f,i)=>new File([f],`captura_${fISO(new Date())}_${ahoraHM().replace(":","")}${i?"_"+i:""}.${(f.type.split("/")[1]||"png").replace("jpeg","jpg")}`,{type:f.type})));aviso("Captura añadida");return}
    const txt=cd.getData("text/plain")||"";
    if(/^https?:\/\/\S+$/.test(txt.trim())&&!ENL.some(l=>l.url===txt.trim())){ENL.push({url:txt.trim(),titulo:"",modo:"titulo",captura:""});pintaEnl()}
    if(PEGA==="rico"){const h=cd.getData("text/html");if(h){const m=htmlAMd(h);if(m!=null){ev.preventDefault();insertar(X,m)}}}
    else if(cd.getData("text/html")){ev.preventDefault();insertar(X,txt)}});
  $("#deFo").onclick=()=>{$("#camIn").value="";$("#camIn").click()};
  $("#deIm").onclick=()=>{const i=$("#attIn");i.accept="image/*";i.value="";i.click();setTimeout(()=>i.removeAttribute("accept"),1000)};
  $("#deFi").onclick=()=>{const i=$("#attIn");i.removeAttribute("accept");i.value="";i.click()};
  $("#deAu").onclick=()=>GRAB?pararGrab():grabar();$("#deLk").onclick=()=>nuevoEnlace();
  pintaAdjD();pintaEnl();if(typeof vigilarSugerencias==="function")vigilarSugerencias(["deT","deX"],"deSug");
  if(pre.accion==="foto")setTimeout(()=>$("#deFo").click(),50);if(pre.accion==="audio")setTimeout(grabar,50);
  setTimeout(()=>{(e0||pre.titulo?X:$("#deT").value?X:X).focus()},30)}
function insertar(X,t){const a=X.selectionStart,b=X.selectionEnd;X.value=X.value.slice(0,a)+t+X.value.slice(b);X.selectionStart=X.selectionEnd=a+t.length;X.focus()}
function marcar(X,mk){const a=X.selectionStart,b=X.selectionEnd,s=X.value.slice(a,b);
  if(/^(#|- |- \[ \] |> )/.test(mk)&&mk!=="#"){const ini=X.value.lastIndexOf("\n",a-1)+1;X.value=X.value.slice(0,ini)+mk+X.value.slice(ini);X.selectionStart=X.selectionEnd=b+mk.length}
  else if(mk==="@"||mk==="#"){const n=s||prompt(mk==="@"?"¿Qué persona? (ej.: Ana)":"¿Qué tema? (ej.: Matemáticas)","");if(!n)return;const t=/\s/.test(n)?`${mk}[${n}]`:mk+n;X.value=X.value.slice(0,a)+t+" "+X.value.slice(b);X.selectionStart=X.selectionEnd=a+t.length+1}
  else{X.value=X.value.slice(0,a)+mk+(s||"texto")+mk+X.value.slice(b);X.selectionStart=a+mk.length;X.selectionEnd=a+mk.length+(s||"texto").length}X.focus()}
function pintaAdjD(){const el=$("#adjL");if(!el)return;const A=ADJ.filter(a=>a.tipo!=="enlace");
  el.innerHTML=A.length?`<div class="gal">${A.filter(esImg).map(a=>`<span class="gi"><img data-mini="${a.sha}" data-ver="${a.sha}" alt=""><button class="x" data-qa="${a.sha}" title="Quitar">✕</button></span>`).join("")}</div>
   ${A.filter(a=>!esImg(a)).map(a=>`<div class="small adjr">${esAud(a)?`🎙 <audio controls preload="none" data-mini="${a.sha}"></audio>`:`<a href="#" data-abrir="${a.sha}">${/pdf/.test(a.mime)?"📄":"📎"} ${esc(a.original||a.nombre)}</a>`} <span class="muted">${a.tam?Math.round(a.tam/1024)+" KB":""}</span> <button class="b s" data-qa="${a.sha}">✕</button></div>`).join("")}`:"";
  el.querySelectorAll("[data-qa]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();ADJ=ADJ.filter(a=>a.sha!==b.dataset.qa);ENL.forEach(l=>{if(l.captura===b.dataset.qa)l.captura=""});pintaAdjD();pintaEnl()});
  el.querySelectorAll("[data-ver]").forEach(i=>i.onclick=()=>{const a=ADJ.find(x=>x.sha===i.dataset.ver);if(a)abrirAdj(a)});el.querySelectorAll("[data-abrir]").forEach(i=>i.onclick=ev=>{ev.preventDefault();const a=ADJ.find(x=>x.sha===i.dataset.abrir);if(a)abrirAdj(a)});
  llenarMedia(el)}
function pintaEnl(){const el=$("#deEnl");if(!el)return;el.innerHTML=ENL.map((l,i)=>`<div class="lnk edit"><span>🔗</span><input data-lt="${i}" value="${esc(l.titulo)}" placeholder="Título (opcional)" style="flex:1;min-width:120px"><span class="small muted" style="word-break:break-all;flex:2">${esc(l.url)}</span>
   <select data-lm="${i}"><option value="titulo" ${l.modo==="titulo"?"selected":""}>Mostrar título</option><option value="completo" ${l.modo==="completo"?"selected":""}>Mostrar enlace completo</option></select>
   <button class="b s" data-lc="${i}" title="Pegar o subir una captura de lo que ves en esa página">${l.captura?"🖼 cambiar captura":"🖼 captura"}</button><button class="b s" data-lx="${i}">✕</button></div>`).join("");
  el.querySelectorAll("[data-lt]").forEach(x=>x.oninput=()=>ENL[+x.dataset.lt].titulo=x.value);el.querySelectorAll("[data-lm]").forEach(x=>x.onchange=()=>ENL[+x.dataset.lm].modo=x.value);
  el.querySelectorAll("[data-lx]").forEach(x=>x.onclick=()=>{ENL.splice(+x.dataset.lx,1);pintaEnl()});
  el.querySelectorAll("[data-lc]").forEach(x=>x.onclick=()=>{const i=+x.dataset.lc;elegirArchivo("image/*",async f=>{const antes=new Set(ADJ.map(a=>a.sha));await adjuntarArchivos([f]);const nuevo=ADJ.find(a=>!antes.has(a.sha))||ADJ.find(a=>a.original===f.name);if(nuevo){ENL[i].captura=nuevo.sha;pintaEnl()}})})}
function nuevoEnlace(){const u=prompt("Pega el enlace (https://…)");if(!u)return;const url=u.trim();if(!/^https?:\/\//i.test(url)){alert("El enlace debe empezar por https://");return}if(ENL.some(l=>l.url===url))return;
  const t=prompt("Título para mostrar (opcional; déjalo vacío para mostrar el enlace completo)","")||"";ENL.push({url,titulo:t.trim(),modo:t.trim()?"titulo":"completo",captura:""});pintaEnl()}
async function grabar(){if(!navigator.mediaDevices||typeof MediaRecorder==="undefined"){alert("Este navegador no permite grabar audio aquí.");return}
  let st;try{st=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){alert("No hay permiso para usar el micrófono.");return}
  const tipos=["audio/webm;codecs=opus","audio/mp4","audio/ogg;codecs=opus","audio/webm"];const mime=tipos.find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||"";
  const rec=new MediaRecorder(st,mime?{mimeType:mime,audioBitsPerSecond:32000}:{audioBitsPerSecond:32000});const partes=[];const t0=Date.now();
  rec.ondataavailable=e=>{if(e.data&&e.data.size)partes.push(e.data)};
  rec.onstop=async()=>{st.getTracks().forEach(t=>t.stop());clearInterval(GRAB&&GRAB.int);const cancel=GRAB&&GRAB.cancel;GRAB=null;if($("#deAu"))$("#deAu").textContent="🎙 Grabar audio";if($("#deRec"))$("#deRec").textContent="";
    if(cancel||!partes.length)return;const tipo=(rec.mimeType||mime||"audio/webm").split(";")[0],ext=tipo.includes("mp4")?"m4a":tipo.includes("ogg")?"ogg":"webm";
    const f=new File(partes,`audio_${fISO(new Date())}_${ahoraHM().replace(":","")}.${ext}`,{type:tipo});const antes=new Set(ADJ.map(a=>a.sha));await adjuntarArchivos([f]);const a=ADJ.find(x=>!antes.has(x.sha));if(a)a.dur=Math.round((Date.now()-t0)/1000)};
  rec.start(1000);GRAB={rec,int:setInterval(()=>{const s=(Date.now()-t0)/1000;if($("#deRec"))$("#deRec").innerHTML=`<span class="rojo">●</span> grabando ${durTxt(s)}`;if(s>=30*60)pararGrab()},500)};
  if($("#deAu"))$("#deAu").textContent="⏹ Detener"}
function pararGrab(cancel){if(!GRAB)return;GRAB.cancel=!!cancel;try{GRAB.rec.stop()}catch(e){}}
function guardarD(e,e0){if(GRAB){alert("Detén la grabación antes de guardar.");return}
  const titulo=$("#deT").value.trim(),texto=$("#deX").value;
  if(!titulo&&!texto.trim()&&!ADJ.length&&!ENL.length){alert("La entrada está vacía.");return}
  const f=$("#deF").value;if(!RE_ISO.test(f)){alert("Fecha inválida");return}
  const ahora=new Date().toISOString();
  Object.assign(e,{fecha:f,hora:$("#deTD").checked&&e.tipo==="evento"?"":$("#deH").value||"",horaFin:e.tipo==="evento"&&!$("#deTD").checked?$("#deHF").value||"":"",fechaFin:e.tipo==="evento"&&$("#deFF")&&$("#deFF").value>f?$("#deFF").value:"",todoDia:e.tipo==="evento"&&$("#deTD").checked,lugar:e.tipo==="evento"?(typeof resolverLugar==="function"?resolverLugar($("#deL").value.trim()):$("#deL").value.trim()):e.lugar,
    alertas:e.tipo==="evento"?[...document.querySelectorAll("[data-al]")].filter(c=>c.checked).map(c=>+c.dataset.al):[],fijado:$("#deP").checked,adjuntos:ADJ.slice(),enlaces:ENL.filter(l=>l.url)});
  if(e0){const real=S.diario.find(x=>x.id===e0.id);const antes=structuredClone(real);guardarVersion(e,titulo,texto);Object.assign(real,e,{versiones:e.versiones});
    asegurarFichas(titulo+" "+texto);changed();cerrar();ADJPINTA=null;ADJOPC=null;render();deshacer("Entrada guardada",()=>{const i=S.diario.findIndex(x=>x.id===antes.id);if(i>=0){antes.editado=new Date().toISOString();S.diario[i]=antes;changed();render()}})}
  else{e.titulo=titulo;e.texto=texto;e.creado=ahora;(S.diario=S.diario||[]).push(e);asegurarFichas(titulo+" "+texto);changed();cerrar();ADJPINTA=null;ADJOPC=null;TD.fecha=e.fecha;if(MOD==="dia"&&["mes","anio"].includes(TD.vista))TD.vista="dia";render();
    deshacer(e.tipo==="evento"?"Evento guardado":"Nota guardada",()=>{S.diario=S.diario.filter(x=>x.id!==e.id);changed();render()});
    if(e.tipo==="evento"&&!e.gcal)setTimeout(()=>{if(confirm(`¿Añadir «${e.titulo||"evento"}» a tu Google Calendar?`))window.open(gcalUrlD(e),"_blank","noopener,noreferrer")},80)}}

// ---------------------------------------------------------------- módulos
function irModulo(m){MOD=m;document.querySelectorAll("[data-mod]").forEach(b=>b.classList.toggle("on",b.dataset.mod===m));
  for(const [k,t,c] of [["fin","tabs","soloFin"],["dia","tabsD","soloDia"],["sal","tabsS","soloSal"],["bib","tabsB","soloBib"],["cur","tabsC","soloCur"],["proy","tabsP","soloProy"]]){const n=$("#"+t);if(n)n.hidden=m!==k;document.querySelectorAll("."+c).forEach(x=>x.hidden=m!==k)}
  try{localStorage.setItem("memphisMod",m)}catch(e){}render()}
document.addEventListener("DOMContentLoaded",()=>{});
(function(){const mods=$("#mods");if(mods)mods.onclick=e=>{const b=e.target.closest("[data-mod]");if(b)irModulo(b.dataset.mod)};
  const tD=$("#tabsD");if(tD)tD.onclick=e=>{const b=e.target.closest("button");if(!b)return;TD.vista=b.dataset.tv;if(TD.vista==="fichas")TD.ficha="";document.querySelectorAll("#tabsD button").forEach(x=>x.classList.toggle("on",x===b));render()};
  const nd=$("#btnNota");if(nd)nd.onclick=()=>editarD(null,{fecha:TD.fecha||hoyISO()});
  const tS=$("#tabsS");if(tS)tS.onclick=e=>{const b=e.target.closest("button");if(!b)return;TS.vista=b.dataset.ts;if(TS.vista!=="historial"){TS.sint="";TS.tipo=""}syncTabsS();render()};
  const ns=$("#btnSalud");if(ns)ns.onclick=()=>editarS(null,{tipo:"episodio"});
  const tB=$("#tabsB");if(tB)tB.onclick=e=>{const b=e.target.closest("button");if(!b)return;TB.vista=b.dataset.tb;TB.estado=TB.vista==="leer"?"por leer":"";if(TB.vista!=="todo"&&TB.vista!=="leer"){TB.etq="";TB.col=""}render()};
  const nb=$("#btnBib");if(nb)nb.onclick=()=>editarB(null,{tipo:"nota"});
  try{const m=localStorage.getItem("memphisMod");if(["dia","sal","bib","cur","proy"].includes(m))MOD=m}catch(e){}})();
function syncTabsD(){document.querySelectorAll("#tabsD button").forEach(x=>x.classList.toggle("on",x.dataset.tv===TD.vista||(["dia","semana","mes","anio"].includes(TD.vista)&&x.dataset.tv==="dia")))}
