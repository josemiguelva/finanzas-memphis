// =====================================================================================================
// Intermediario de Memphis para Cloudflare Workers (gratis). Pegar tal cual en el editor del Worker.
// Versión 4.1 (vista previa de X, Instagram, Facebook, Threads y TikTok; una lista de avisos por persona: varios perfiles, cada uno con su chat de Telegram). Solo trabaja para tu Memphis y exige la cabecera X-Memphis-Clave = variable secreta MEMPHIS_CLAVE.
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
const UA_FB = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", UA_TW = "Twitterbot/1.0";
const pocoUtil = o => !o || o.error || !o.titulo || /^(instagram|facebook|x|threads|tiktok|log ?in|iniciar sesi[oó]n|inicia sesi[oó]n|login|sign up)\b/i.test(o.titulo.trim()) && !o.desc;
async function pagina(d, ua) {
  const h = d.hostname.replace(/^www\.|^m\./, "");
  const r = await fetch(d.href, { headers: { "User-Agent": ua, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "es,en;q=0.8" }, redirect: "follow" });
  if (!r.ok) return { url: d.href, error: "La página respondió " + r.status };
  if (!/html/i.test(r.headers.get("Content-Type") || "")) return { url: r.url, titulo: "", desc: "", imagen: "", sitio: h, tipo: r.headers.get("Content-Type") || "" };
  const t = await leerCabeza(r, 700000), M = {};
  for (const m of t.matchAll(/<meta\s[^>]*>/gi)) { const tag = m[0], k = (tag.match(/(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1], v = (tag.match(/content\s*=\s*"([^"]*)"/i) || tag.match(/content\s*=\s*'([^']*)'/i) || [])[1]; if (k && v != null && !M[k.toLowerCase()]) M[k.toLowerCase()] = ent(v) }
  const tt = ent((t.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  let img = M["og:image"] || M["og:image:url"] || M["twitter:image"] || M["twitter:image:src"] || "";
  try { if (img) img = new URL(img, r.url || d.href).href } catch (e) { img = "" }
  return { url: r.url || d.href, titulo: M["og:title"] || M["twitter:title"] || tt, desc: (M["og:description"] || M["twitter:description"] || M["description"] || "").slice(0, 800), imagen: img, sitio: M["og:site_name"] || h, autor: M["author"] || M["article:author"] || "", fecha: M["article:published_time"] || "" };
}
async function jsonDe(u) { const r = await fetch(u, { headers: { "User-Agent": UA, "Accept": "application/json" } }); if (!r.ok) throw new Error("" + r.status); return r.json() }
const sinEtiquetas = h => ent(String(h || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "));
async function meta(d) {
  const h = d.hostname.replace(/^www\.|^m\.|^mobile\./, "");
  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(h)) { try { const j = await jsonDe("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(d.href)); return { url: d.href, titulo: j.title || "", desc: j.author_name ? "Canal: " + j.author_name : "", imagen: j.thumbnail_url || "", sitio: "YouTube", autor: j.author_name || "" } } catch (e) { } }
  // X / Twitter: el texto del trino, su autor y su imagen
  if (/^(x|twitter|fxtwitter|vxtwitter|fixupx)\.com$/.test(h)) {
    const id = (d.pathname.match(/\/status(?:es)?\/(\d{5,25})/) || [])[1];
    if (id) { try { const j = await jsonDe("https://api.fxtwitter.com/status/" + id), tw = j.tweet; if (tw && tw.text != null) { const a = tw.author || {}, md = tw.media || {}; return { url: d.href, titulo: (a.name ? a.name + (a.screen_name ? " (@" + a.screen_name + ")" : "") : "Publicación en X"), desc: String(tw.text || "").slice(0, 800), imagen: (md.photos && md.photos[0] && md.photos[0].url) || (md.videos && md.videos[0] && md.videos[0].thumbnail_url) || (md.mosaic && md.mosaic.formats && md.mosaic.formats.jpeg) || a.avatar_url || "", sitio: "X", autor: a.name || "", fecha: tw.created_at ? new Date(tw.created_at).toISOString() : "" } } } catch (e) { } }
    try { const j = await jsonDe("https://publish.twitter.com/oembed?omit_script=1&dnt=true&url=" + encodeURIComponent(d.href.replace(/\/\/(x|fxtwitter|vxtwitter|fixupx)\.com/, "//twitter.com"))); const txt = sinEtiquetas((String(j.html || "").match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1]); return { url: d.href, titulo: j.author_name ? j.author_name + " en X" : "Publicación en X", desc: txt.slice(0, 800), imagen: "", sitio: "X", autor: j.author_name || "" } } catch (e) { }
  }
  // TikTok
  if (/(^|\.)tiktok\.com$/.test(h)) { try { const j = await jsonDe("https://www.tiktok.com/oembed?url=" + encodeURIComponent(d.href)); return { url: d.href, titulo: j.author_name ? j.author_name + " en TikTok" : "TikTok", desc: String(j.title || "").slice(0, 800), imagen: j.thumbnail_url || "", sitio: "TikTok", autor: j.author_name || "" } } catch (e) { } }
  // Instagram, Facebook, Threads: muestran la vista previa a los lectores de enlaces de las redes sociales
  const red = /(^|\.)(instagram\.com|facebook\.com|fb\.watch|fb\.com|threads\.net|threads\.com)$/.test(h);
  let o = null;
  if (red) { try { o = await pagina(d, UA_FB) } catch (e) { } if (pocoUtil(o)) { try { const o2 = await pagina(d, UA_TW); if (!pocoUtil(o2)) o = o2 } catch (e) { } } }
  if (red && pocoUtil(o) && /instagram\.com$/.test(h)) { const c = (d.pathname.match(/\/(p|reel|reels|tv)\/([\w-]{5,40})/) || [])[2];
    if (c) { try { const r = await fetch(`https://www.instagram.com/p/${c}/embed/captioned/`, { headers: { "User-Agent": UA } }); if (r.ok) { const t = await r.text(), img = ent((t.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/) || t.match(/<img[^>]+src="([^"]+)"[^>]*class="EmbeddedMediaImage"/) || [])[1] || ""), cap = sinEtiquetas((t.match(/class="Caption"[^>]*>([\s\S]*?)<div class="CaptionComments"/) || t.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || ""), user = ent((t.match(/class="UsernameText"[^>]*>([^<]+)</) || [])[1] || "");
      if (img || cap) o = { url: d.href, titulo: user ? user + " en Instagram" : "Publicación de Instagram", desc: cap.replace(new RegExp("^" + user.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*"), "").slice(0, 800), imagen: img, sitio: "Instagram", autor: user } } } catch (e) { } } }
  if (!o || (!red && pocoUtil(o))) { try { const g = await pagina(d, UA); if (!o || !pocoUtil(g)) o = g } catch (e) { if (!o) throw e } }
  if (pocoUtil(o) && !red) { try { const o2 = await pagina(d, UA_FB); if (!pocoUtil(o2)) o = o2 } catch (e) { } }
  return o;
}
async function tg(bot, chat, texto) { const r = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: texto.slice(0, 4000), disable_web_page_preview: true }) }); return r.ok }
const claveCfg = chat => "cfg:" + String(chat);
async function leerCfg(env, chat) { let c = await env.AVISOS.get(claveCfg(chat), "json"); if (!c) { const v = await env.AVISOS.get("cfg", "json"); if (v && String(v.chat) === String(chat)) c = v } return c }
async function enviarDe(env, k) {
  const c = await env.AVISOS.get(k, "json"); if (!c || !c.bot || !c.chat || !Array.isArray(c.lista)) return 0;
  const ahora = Date.now(), env6 = new Set(c.enviados || []); let n = 0;
  for (const a of c.lista) { if (a.t > ahora || a.t < ahora - 6 * 3600e3 || env6.has(a.id)) continue; if (await tg(c.bot, c.chat, a.txt)) { env6.add(a.id); n++ } }
  if (n) { const vivos = new Set(c.lista.map(a => a.id)); c.enviados = [...env6].filter(id => vivos.has(id)).slice(-3000); await env.AVISOS.put(k, JSON.stringify(c)) }
  return n;
}
async function enviarPendientes(env) {
  if (!env.AVISOS) return 0;
  // latido: deja constancia (cada ~30 min) de que la revisión programada está corriendo
  const lat = +(await env.AVISOS.get("latido") || 0); if (Date.now() - lat > 30 * 60e3) await env.AVISOS.put("latido", String(Date.now()));
  let n = 0; const L = await env.AVISOS.list({ prefix: "cfg" });
  for (const k of L.keys.slice(0, 20)) n += await enviarDe(env, k.name);
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
      const prev = (await leerCfg(env, b.chat)) || {};
      await env.AVISOS.put(claveCfg(b.chat), JSON.stringify({ bot, chat: String(b.chat), lista, enviados: prev.enviados || [], subido: Date.now() }));
      const vieja = await env.AVISOS.get("cfg", "json"); if (vieja && String(vieja.chat) === String(b.chat)) await env.AVISOS.delete("cfg");
      return json({ ok: true, n: lista.length });
    }
    if (req.method !== "GET") return no(405, "Método no permitido");
    if (u.pathname === "/avisos/estado") { if (!env.AVISOS) return json({ kv: false }); const ch = u.searchParams.get("chat") || ""; const c = (RE_CHAT.test(ch) ? await leerCfg(env, ch) : await env.AVISOS.get("cfg", "json")) || {}, ahora = Date.now(), L = c.lista || [], env6 = new Set(c.enviados || []);
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
    } else if (u.pathname === "/version") return json({ v: 4, avisos: !!env.AVISOS });
    else return no(404, "No existe");
    const r = await fetch(destino.href, { headers: { "User-Agent": "Memphis" }, redirect: "follow", cf: { cacheTtl: 0 } });
    const h = new Headers(cors);
    h.set("Content-Type", r.headers.get("Content-Type") || "application/octet-stream");
    h.set("Cache-Control", "no-store");
    return new Response(r.body, { status: r.status, headers: h });
  },
  async scheduled(ev, env, ctx) { ctx.waitUntil(enviarPendientes(env)) }
};
