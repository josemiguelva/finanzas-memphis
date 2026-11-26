// =====================================================================================================
// Memphis · MENÚ SUPERIOR compacto: secciones como íconos (la activa muestra su nombre), pestañas deslizables sin
// barra, botones de arriba en una sola fila. En el PC se ve con nombres; en celular y tablet, solo íconos.
// =====================================================================================================
"use strict";
function iconizarMods(){const m=$("#mods");if(!m)return;for(const b of m.querySelectorAll("button[data-mod]")){if(b.querySelector(".mi"))continue;const t=b.textContent.trim(),i=t.indexOf(" ");
    const ico=i>0?t.slice(0,i):t,nom=i>0?t.slice(i+1):"";b.innerHTML=`<span class="mi">${esc(ico)}</span><span class="ml">${esc(nom)}</span>`;b.title=nom;b.setAttribute("aria-label",nom)}}
function centrarActivo(){for(const sel of ["#mods","#tabs","#tabsD","#tabsS","#tabsB","#tabsC","#tabsP"]){const n=$(sel);if(!n||n.hidden||n.scrollWidth<=n.clientWidth+2)continue;const a=n.querySelector("button.on");if(!a)continue;
    const x=a.offsetLeft-(n.clientWidth-a.offsetWidth)/2;n.scrollTo({left:Math.max(0,x),behavior:"smooth"})}}
function marcarDesborde(){for(const n of document.querySelectorAll("header nav,#mods")){const fin=n.scrollLeft+n.clientWidth>=n.scrollWidth-4,ini=n.scrollLeft<=4;n.classList.toggle("masDer",!fin);n.classList.toggle("masIzq",!ini)}}
// la sincronización automática no debe mover la pantalla: conserva la posición y espera si estás escribiendo
const SYN={en:false,pend:false};
window.addEventListener("load",()=>{
  const ds=window.dbxSync;if(typeof ds==="function")window.dbxSync=async function(motivo){const auto=["intervalo","visible","foco","online","pendiente","cambio"].includes(motivo);SYN.en=auto;try{return await ds.apply(this,arguments)}finally{SYN.en=false}};
  const rn=window.render;window.render=function(){if(!SYN.en)return rn.apply(this,arguments);
    const a=document.activeElement;if(a&&$("#view")&&$("#view").contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)){if(!SYN.pend){SYN.pend=true;a.addEventListener("blur",()=>{SYN.pend=false;const y=scrollY;rn();scrollTo(0,y)},{once:true})}return}
    const y=scrollY,x=scrollX;const r=rn.apply(this,arguments);scrollTo(x,y);requestAnimationFrame(()=>scrollTo(x,y));return r};
});
window.addEventListener("load",()=>{setTimeout(()=>{iconizarMods();document.body.classList.add("menuv2");marcarDesborde();centrarActivo()},0);
  const m=$("#mods");if(m)new MutationObserver(()=>{iconizarMods();marcarDesborde()}).observe(m,{childList:true});
  for(const n of document.querySelectorAll("header nav,#mods"))n.addEventListener("scroll",marcarDesborde,{passive:true});
  addEventListener("resize",()=>{marcarDesborde()});
  const im=window.irModulo;if(typeof im==="function")window.irModulo=function(){const r=im.apply(this,arguments);setTimeout(()=>{marcarDesborde();centrarActivo()},30);return r};
  // al tocar una pestaña, centrarla
  document.querySelector("header").addEventListener("click",ev=>{if(ev.target.closest("nav button,#mods button"))setTimeout(()=>{centrarActivo();marcarDesborde()},40)});
});
