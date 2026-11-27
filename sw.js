// Service worker: solo guarda en caché los archivos de la app (código), nunca datos.
// Estrategia "red primero": si hay internet, siempre trae la versión más nueva publicada en GitHub;
// sin internet, abre la última versión guardada.
const CACHE = "memphis-v2026.11.27-nucleo";
const FILES = ["./", "index.html", "app.js", "diario.js", "personas.js", "salud.js", "compartir.js", "vinculos.js", "biblio.js", "extras.js", "captura.js", "buzon.js", "recordar.js", "calext.js", "mejoras.js", "privadas.js", "cursos.js", "correo.js", "proyectos.js", "inicio.js", "perfiles.js", "biblio2.js", "soltar.js", "importar.js", "buscar.js", "previa.js", "avisos.js", "ocr.js", "respaldo.js", "dispositivos.js", "salud2.js", "pareja.js", "escritura.js", "contexto.js", "ajustes.js", "menu.js", "oauth.html", "oauth.js", "styles.css", "gastos.html", "gastos.js", "gastos.webmanifest", "vendor/xlsx.full.min.js", "excel-worker.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  // «Compartir › Memphis» (Android): se guarda tal cual en este dispositivo y la app lo cifra al desbloquear
  if (e.request.method === "POST" && u.origin === location.origin && u.pathname.endsWith("/compartir")) {
    e.respondWith((async () => {
      try {
        const f = await e.request.formData();
        const item = { de: "compartir", titulo: String(f.get("title") || "").slice(0, 300), texto: String(f.get("text") || "").slice(0, 20000), url: String(f.get("url") || "").slice(0, 2000), files: [], t: Date.now() };
        for (const x of f.getAll("files")) if (x && x.size && x.size <= 25 * 1048576) item.files.push({ name: x.name, type: x.type, blob: x });
        await new Promise((ok, ko) => { const r = indexedDB.open("finanzasMemphis", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv");
          r.onsuccess = () => { const db = r.result, tx = db.transaction("kv", "readwrite"), st = tx.objectStore("kv"), g = st.get("capPend");
            g.onsuccess = () => { const L = Array.isArray(g.result) ? g.result : []; L.push(item); st.put(L.slice(-100), "capPend") }; tx.oncomplete = ok; tx.onerror = () => ko(tx.error) }; r.onerror = () => ko(r.error) });
      } catch (err) {}
      return Response.redirect(new URL("./?compartido=1", self.registration.scope).href, 303);
    })());
    return;
  }
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // La clave de caché nunca lleva parámetros (?code=… del regreso de Dropbox no se guarda)
  const clave = u.origin + u.pathname;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { if (r.ok && !u.search) { const c = r.clone(); caches.open(CACHE).then(x => x.put(clave, c)); } return r; })
    .catch(() => caches.match(clave).then(r => r || caches.match("index.html"))));
});
