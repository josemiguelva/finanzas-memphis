// =====================================================================================================
// Intermediario de Memphis para Cloudflare Workers (gratis). Pegar tal cual en el editor del Worker.
// Versión 2. Solo trabaja para tu Memphis y exige la cabecera X-Memphis-Clave = variable secreta MEMPHIS_CLAVE.
//   GET  /ics?u=<dirección secreta iCal>   → trae tu calendario (Google, Outlook o iCloud)
//   GET  /tg/<ruta del archivo>            → trae un adjunto de tu bot de Telegram
//   GET  /meta?u=<enlace>                  → título, descripción e imagen de una página (vista previa)
//   GET  /img?u=<imagen>                   → trae la imagen de la vista previa (solo imágenes, máx. 6 MB)
//   POST /avisos                           → guarda tu lista de recordatorios (necesita el espacio KV «AVISOS»)
//   POST /avisos/prueba                    → manda ya un mensaje de prueba a tu Telegram
//   (programado cada 5 minutos)            → envía por Telegram los recordatorios que ya tocan
// No registra el contenido. Los recordatorios quedan en TU espacio KV de Cloudflare hasta que pasan.
// =====================================================================================================
const ORIGEN = "https://josemiguelva.github.io";
const HOSTS_ICS = ["calendar.google.com", "outlook.office365.com", "outlook.live.com", "p01-caldav.icloud.com"];
const UA = "Mozilla/5.0 (compatible; MemphisPreview/2.0; vista previa personal de enlaces)";
const cors = { "Access-Control-Allow-Origin": ORIGEN, "Access-Control-Allow-Headers": "X-Memphis-Clave, X-Memphis-Bot, Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Max-Age": "86400", "Vary": "Origin" };
const no = (s, t) => new Response(t, { status: s, headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });
const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const igual = (a, b) => { if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0 };
const RE_BOT = /^\d{5,15}:[\w-]{30,60}$/, RE_CHAT = /^-?\d{1,20}$/;
function hostPrivado(h) { h = h.toLowerCase(); return h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || /^\[|^\d+\.\d+\.\d+\.\d+$/.test(h) && (/^(10|127|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h.startsWith("[")) }
function urlPublica(v) { let d; try { d = new URL(v || "") } catch (e) { return null } if (!/^https?:$/.test(d.protocol) || hostPrivado(d.hostname)) return null; return d }
const ent = s => String(s || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/\s+/g, " ").trim();
async function leerCabeza(r, max) { const rd = r.body.getReader(), dec = new TextDecoder(); let t = ""; while (t.length < max) { const { done, value } = await rd.read(); if (done) break; t += dec.decode(value, { stream: true }); if (/<\/head>/i.test(t)) break } try { rd.cancel() } catch (e) { } return t }
async function meta(d) {
  const h = d.hostname.replace(/^www\.|^m\./, "");
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(h)) { try { const r = await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(d.href), { headers: { "User-Agent": UA } }); if (r.ok) { const j = await r.json(); return { url: d.href, titulo: j.title || "", desc: j.author_name ? "Canal: " + j.author_name : "", imagen: j.thumbnail_url || "", sitio: "YouTube", autor: j.author_name || "" } } } catch (e) { } }
  const r = await fetch(d.href, { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "es,en;q=0.8" }, redirect: "follow" });
  if (!r.ok) return { url: d.href, error: "La página respondió " + r.status };
  if (!/html/i.test(r.headers.get("Content-Type") || "")) return { url: r.url, titulo: "", desc: "", imagen: "", sitio: h, tipo: r.headers.get("Content-Type") || "" };
  const t = await leerCabeza(r, 700000), M = {};
  for (const m of t.matchAll(/<meta\s[^>]*>/gi)) { const tag = m[0], k = (tag.match(/(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1], v = (tag.match(/content\s*=\s*"([^"]*)"/i) || tag.match(/content\s*=\s*'([^']*)'/i) || [])[1]; if (k && v != null && !M[k.toLowerCase()]) M[k.toLowerCase()] = ent(v) }
  const tt = ent((t.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  let img = M["og:image"] || M["og:image:url"] || M["twitter:image"] || M["twitter:image:src"] || "";
  try { if (img) img = new URL(img, r.url || d.href).href } catch (e) { img = "" }
  return { url: r.url || d.href, titulo: M["og:title"] || M["twitter:title"] || tt, desc: (M["og:description"] || M["twitter:description"] || M["description"] || "").slice(0, 800), imagen: img, sitio: M["og:site_name"] || h, autor: M["author"] || M["article:author"] || "", fecha: M["article:published_time"] || "" };
}
async function tg(bot, chat, texto) { const r = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: texto.slice(0, 4000), disable_web_page_preview: true }) }); return r.ok }
async function enviarPendientes(env) {
  if (!env.AVISOS) return 0;
  // latido: deja constancia (cada ~30 min) de que la revisión programada está corriendo
  const lat = +(await env.AVISOS.get("latido") || 0); if (Date.now() - lat > 30 * 60e3) await env.AVISOS.put("latido", String(Date.now()));
  const c = await env.AVISOS.get("cfg", "json"); if (!c || !c.bot || !c.chat || !Array.isArray(c.lista)) return 0;
  const ahora = Date.now(), env6 = new Set(c.enviados || []); let n = 0;
  for (const a of c.lista) { if (a.t > ahora || a.t < ahora - 6 * 3600e3 || env6.has(a.id)) continue; if (await tg(c.bot, c.chat, a.txt)) { env6.add(a.id); n++ } }
  if (n) { const vivos = new Set(c.lista.map(a => a.id)); c.enviados = [...env6].filter(id => vivos.has(id)).slice(-3000); await env.AVISOS.put("cfg", JSON.stringify(c)) }
  return n;
}
export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!env.MEMPHIS_CLAVE || env.MEMPHIS_CLAVE.length < 20) return no(500, "Falta la variable secreta MEMPHIS_CLAVE en el Worker");
    if (!igual(req.headers.get("X-Memphis-Clave") || "", env.MEMPHIS_CLAVE)) return no(403, "Clave incorrecta");
    const u = new URL(req.url);
    if (req.method === "POST") {
      if (!u.pathname.startsWith("/avisos")) return no(404, "No existe");
      const bot = req.headers.get("X-Memphis-Bot") || ""; if (!RE_BOT.test(bot)) return no(400, "Falta el bot");
      let b; try { b = await req.json() } catch (e) { return no(400, "JSON no válido") }
      if (!RE_CHAT.test(String(b.chat || ""))) return no(400, "Falta el chat");
      if (u.pathname === "/avisos/prueba") return (await tg(bot, b.chat, "✅ Avisos de Memphis funcionando. Te escribiré aquí cuando algo esté por empezar.")) ? json({ ok: true }) : no(502, "Telegram no aceptó el mensaje");
      if (u.pathname !== "/avisos") return no(404, "No existe");
      if (!env.AVISOS) return no(500, "Falta el espacio KV «AVISOS» (Configuración del Worker → Vinculaciones → KV)");
      const lista = (Array.isArray(b.lista) ? b.lista : []).filter(a => a && /^[\w-]{2,80}$/.test(String(a.id)) && Number.isFinite(+a.t) && typeof a.txt === "string").slice(0, 800).map(a => ({ id: String(a.id), t: +a.t, txt: a.txt.slice(0, 1500) }));
      const prev = (await env.AVISOS.get("cfg", "json")) || {};
      await env.AVISOS.put("cfg", JSON.stringify({ bot, chat: String(b.chat), lista, enviados: prev.enviados || [], subido: Date.now() }));
      return json({ ok: true, n: lista.length });
    }
    if (req.method !== "GET") return no(405, "Método no permitido");
    if (u.pathname === "/avisos/estado") { if (!env.AVISOS) return json({ kv: false }); const c = (await env.AVISOS.get("cfg", "json")) || {}, ahora = Date.now(), L = c.lista || [], env6 = new Set(c.enviados || []);
      const prox = L.filter(a => a.t > ahora - 6 * 3600e3 && !env6.has(a.id)).sort((a, b) => a.t - b.t)[0];
      return json({ kv: true, subido: c.subido || 0, n: L.length, pendientes: L.filter(a => !env6.has(a.id) && a.t > ahora).length, enviados: env6.size, proximo: prox ? prox.t : 0, latido: +(await env.AVISOS.get("latido") || 0), ahora }) }
    if (u.pathname === "/meta") { const d = urlPublica(u.searchParams.get("u")); if (!d) return no(400, "Dirección no permitida"); try { return json(await meta(d)) } catch (e) { return json({ url: d.href, error: String(e && e.message || e) }) } }
    if (u.pathname === "/img") {
      const d = urlPublica(u.searchParams.get("u")); if (!d) return no(400, "Dirección no permitida");
      const r = await fetch(d.href, { headers: { "User-Agent": UA, "Accept": "image/*" }, redirect: "follow" }); const ct = r.headers.get("Content-Type") || "";
      if (!r.ok || !/^image\/(png|jpe?g|gif|webp|avif)/i.test(ct)) return no(415, "No es una imagen"); if (+(r.headers.get("Content-Length") || 0) > 6e6) return no(413, "Imagen muy grande");
      return new Response(r.body, { status: 200, headers: { ...cors, "Content-Type": ct, "Cache-Control": "no-store" } });
    }
    let destino;
    if (u.pathname === "/ics") {
      try { destino = new URL(u.searchParams.get("u") || "") } catch (e) { return no(400, "Dirección no válida") }
      if (destino.protocol === "webcal:") destino.protocol = "https:";
      if (destino.protocol !== "https:" || !(HOSTS_ICS.includes(destino.hostname) || /^p\d+-caldav\.icloud\.com$/.test(destino.hostname))) return no(400, "Solo calendarios de Google, Outlook o iCloud");
    } else if (u.pathname.startsWith("/tg/")) {
      const bot = req.headers.get("X-Memphis-Bot") || "";
      if (!RE_BOT.test(bot)) return no(400, "Falta el bot");
      const ruta = u.pathname.slice(4);
      if (!/^[\w./-]{1,300}$/.test(ruta) || ruta.includes("..")) return no(400, "Ruta no válida");
      destino = new URL(`https://api.telegram.org/file/bot${bot}/${ruta}`);
    } else if (u.pathname === "/version") return json({ v: 3, avisos: !!env.AVISOS });
    else return no(404, "No existe");
    const r = await fetch(destino.href, { headers: { "User-Agent": "Memphis" }, redirect: "follow", cf: { cacheTtl: 0 } });
    const h = new Headers(cors);
    h.set("Content-Type", r.headers.get("Content-Type") || "application/octet-stream");
    h.set("Cache-Control", "no-store");
    return new Response(r.body, { status: r.status, headers: h });
  },
  async scheduled(ev, env, ctx) { ctx.waitUntil(enviarPendientes(env)) }
};
