# Seguridad de Finanzas Memphis

## Modelo
- **Sin servidor.** GitHub Pages solo entrega el código; todo cálculo y cifrado ocurre en el dispositivo.
- **Datos fuera del repositorio**, cifrados, en la nube del dueño (Dropbox u otra).
- **Clave que solo conoce el dueño.** No se guarda en ningún lado; si se pierde, los datos no se pueden recuperar.

## Cifrado
| Elemento | Detalle |
|---|---|
| Archivo de datos `.fmx` | AES-256-GCM, IV aleatorio de 12 bytes en cada guardado, AAD fija; clave derivada con PBKDF2-SHA256, **600.000 iteraciones**, sal aleatoria de 16 bytes. Las iteraciones son constantes del código (un archivo manipulado no puede bajarlas). |
| Adjuntos `.fma` | `FMA1` + IV + AES-256-GCM con una llave de datos aleatoria (256 bits) que vive dentro del `.fmx` cifrado. AAD = huella SHA-256 del archivo; tras descifrar se verifica la huella. Cambiar la clave no obliga a re-cifrar adjuntos. |
| Navegador (IndexedDB) | Solo el sobre cifrado y los adjuntos cifrados. Las llaves en memoria son no extraíbles y se borran al bloquear. |

## Dropbox (guardado automático y sincronización entre dispositivos)
- Conexión con OAuth 2 + PKCE (sin secreto en la página), permiso **solo a la carpeta propia de la app** (`Aplicaciones/<app>`).
- El permiso de largo plazo (refresh token) vive **solo dentro del archivo cifrado**; al bloquear se borra de memoria el token temporal; "Desconectar" lo revoca en Dropbox.
- Se suben a Dropbox: el `.fmx` (cifrado), los `.fma` (cifrados, con **nombre opaco** = huella; el nombre legible vive cifrado en los datos), un respaldo diario (cifrado) y, si está activo, el archivo de sincronización semanal (sin cifrar).
- Fusión movimiento por movimiento con ancestro común: lo nuevo de cada dispositivo se conserva; si se editó lo mismo en ambos, gana lo más reciente; lo borrado se borra en todos. Contador de versión cifrado para detectar si alguien restaura una versión vieja.
- Quien acceda a la carpeta de la app en Dropbox sin la clave no puede leer ni modificar los datos (AES-GCM autentica); a lo sumo podría borrar o reemplazar archivos (la app lo detecta y ofrece reemplazar con la copia local).

## Respaldos y papelera
- Los respaldos son el mismo sobre cifrado (`.fmx`, AES-256-GCM); el nombre del archivo solo dice fecha, tipo, conteos y la etiqueta que pongas (no pongas datos sensibles en la etiqueta).
- Se rotan solos (3 automáticos, 3 manuales, 6 semanales, 12 mensuales) con `files/list_folder` y `files/delete_v2` dentro de la carpeta de la app (Dropbox los guarda además en su historial de eliminados).
- Un respaldo abierto pasa por la misma validación (`migrar`) que cualquier archivo externo. La papelera va dentro de los datos cifrados y también se valida.
- Una restauración marca `restauracion{id,fecha}`; otro dispositivo que la vea más reciente reemplaza sus datos en vez de fusionar (después de respaldar lo suyo), para que lo restaurado no se vuelva a mezclar con lo viejo.

## Diario
- Entradas, fichas y adjuntos (fotos, audios, PDF) van dentro del mismo sobre cifrado / archivos `.fma`; las miniaturas y audios se descifran solo en memoria (`blob:`), que se revocan al bloquear.
- El Markdown se dibuja con un intérprete propio que escapa todo; los enlaces solo pueden ser `https?://`. El pegado «con formato» convierte HTML a Markdown con `DOMParser` (no se inserta HTML).
- La CSP añade solo `media-src 'self' blob:` para reproducir los audios. No hay conexión directa a Google: se usa un enlace de Google Calendar o archivos `.ics`.
- El diario **no** se incluye en `finanzas_sync.json`.

## Salud
- Los registros de salud, perfiles y la lista de síntomas viven solo dentro de los datos cifrados (`.fmx`); sus adjuntos son `.fma` cifrados con nombre opaco.
- Salud **no** se incluye en `finanzas_sync.json` ni en vencimientos (que sí pueden ir en ese archivo): los refuerzos de vacunas se muestran desde los propios registros.
- Todo dato de salud que llega (paquete, otro dispositivo, respaldo) pasa por `migrarSalud`: tipos y estados de lista cerrada, horas y fechas validadas, números con rango, enlaces solo `https`, mime de adjuntos sin HTML/SVG/JS.
- El paquete de importación con datos personales se arma fuera del repositorio y se borra tras importarlo.
- Cola de subida de adjuntos: guarda en IndexedDB solo la huella y la ruta opaca; los bytes que se suben son los ya cifrados.

## Personas y contactos
- Los datos de contacto viven en las fichas, dentro de los datos cifrados; no van a `finanzas_sync.json`. El .vcf importado se lee en el navegador y no se guarda como archivo.
- Se validan al entrar (teléfonos solo con dígitos y signos, correos con forma de correo, web solo `https`).

## Exportar para compartir
- Es la única salida sin cifrar de datos personales y siempre la inicia el usuario, con un aviso explícito. Se genera en el navegador; nada pasa por un servidor.
- La página HTML exportada no lleva scripts ni enlaces internos de la app; las fotos van incrustadas.

## Capturas
- La bandeja vive cifrada como el resto. Lo compartido desde Android (o el marcador) mientras la app está bloqueada queda un momento sin cifrar en el almacenamiento del navegador de ese dispositivo y se cifra y borra al desbloquear.
- Telegram: el token del bot va cifrado en los datos; la app solo acepta mensajes del chat autorizado al conectar. Lo enviado al bot pasa por Telegram (los chats con bots no son de extremo a extremo). CSP: `connect-src` agrega `api.telegram.org` (y `api.crossref.org` para DOI).
- Any.do: solo abre `wa.me` con el texto; nada se envía sin que el usuario toque Enviar.

## Qué queda SIN cifrar (a propósito)
- `sync/finanzas_sync.json` en la carpeta del dueño (local o Dropbox): movimientos y notas (sin facturas) para la sincronización semanal con Sheets/Notion/Capacities. **Se puede apagar** en Datos › Dropbox.
- Las exportaciones que el dueño pide explícitamente (Excel/CSV).
- Un adjunto que el dueño decide descargar.

## Defensas
| Riesgo | Defensa |
|---|---|
| Envío de datos a internet | CSP: solo puede conectarse a `api.dropboxapi.com` y `content.dropboxapi.com`; `script-src 'self'`, `default-src 'none'`; sin código de terceros remoto |
| Texto malicioso en extractos o archivos (XSS) | Todo valor se escapa; los archivos abiertos se validan campo por campo; la CSP impide ejecutar scripts en línea |
| Excel manipulado (fallos conocidos de SheetJS 0.18.5: CVE-2023-30533, CVE-2024-22363) | Se lee en un *Worker* aislado sin acceso a la página ni a los datos, con límite de 20 s; solo vuelven filas de texto |
| Adjuntos peligrosos (HTML/SVG) | Solo PDF e imágenes se abren en pestaña; el resto se descarga como binario y previa confirmación |
| Clickjacking | La app no funciona dentro de otra página |
| Equipo desatendido | Bloqueo automático por inactividad; al bloquear se borran datos, llaves, diálogos y enlaces temporales |
| Datos subidos por error al repositorio | `.gitignore` + acción **Guardia de datos** en cada push |
| Cuenta de GitHub comprometida (código malicioso publicado) | **Verificación en dos pasos obligatoria**; ningún sistema web puede proteger contra su propio publicador |

## Auditoría (23-nov-2026)
Revisión independiente del código + 24 pruebas automáticas (cifrado, bloqueo, clave incorrecta, cambio de clave, inyección de HTML, red bloqueada por CSP, adjuntos, Excel aislado).

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Abrir un adjunto lo dejaba también descifrado en Descargas | Media | Corregido |
| 2 | Adjuntos SVG/HTML podían abrirse como página | Media | Corregido |
| 3 | SheetJS 0.18.5 con fallos conocidos al leer Excel manipulado | Media | Mitigado (Worker aislado) |
| 4 | Algunos valores de archivos abiertos sin escapar | Baja | Corregido (validación + escape) |
| 5 | Diálogos y listas quedaban en memoria al bloquear | Baja | Corregido |
| 6 | Una actualización maliciosa del repositorio se aplicaría al recargar | Baja | Documentado: 2FA en GitHub |
| 7 | Página enmarcable (clickjacking) | Baja | Corregido |
| 8 | `frame-src blob:` innecesario | Info | Corregido (`'none'`) |
| 9 | Respaldos viejos quedan con la clave anterior | Info | Al cambiar la clave se ofrece borrarlos |
| 10 | No se verificaba la huella del adjunto tras descifrar | Info | Corregido |

## Auditoría 2 — integración con Dropbox (23-nov-2026)
Revisión independiente + 12 pruebas con dos dispositivos simulados (celular y computador).

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Una edición hecha durante una subida podía revertirse después | Alta | Corregido (contador de cambios; prueba automática) |
| 2 | Un error 401 pasajero desconectaba Dropbox para siempre | Media | Corregido (reintento; solo se desconecta si Dropbox revoca el permiso) |
| 3 | Dos dispositivos que empezaron por separado tenían llaves de adjuntos distintas | Media | Corregido (llavero de llaves que se combina al sincronizar) |
| 4 | El archivo de sincronización semanal va sin cifrar y algunos textos decían lo contrario | Media | Textos corregidos; se puede apagar |
| 5 | Diálogo de clave podía dejar la sincronización trabada | Baja | Corregido |
| 6 | Archivo remoto dañado o restaurado a una versión vieja | Baja | Detectado y avisado; botón para reemplazar |
| 7 | Reintentos sin espera ante ciertos errores | Baja | Corregido (espera creciente) |
| 8 | Nombres de adjuntos en Dropbox revelaban fecha, comercio y valor | Baja | Corregido (nombres opacos) |
| 9 | Adjunto dañado quedaba en caché | Baja | Corregido (se verifica antes de guardar) |
| 10 | Token en memoria tras bloquear; sin revocación al desconectar | Baja | Corregido |
| 11 | El regreso de Dropbox (`?code=`) quedaba en la caché | Baja | Corregido |
| 12 | Algunos ajustes remotos sin validar | Info | Corregido |

## «Mis gastos» (app para un familiar)
- `gastos.html` no se conecta a nada (CSP `connect-src 'self'`) y no tiene acceso a Dropbox ni a tus datos: guarda en su propio almacenamiento local solo lo que esa persona anota.
- Cada invitación tiene una clave AES-256 aleatoria. Los paquetes van cifrados con AES-GCM (el id del buzón como dato autenticado); Memphis rechaza paquetes de invitaciones desconocidas o desactivadas.
- La clave viaja en el fragmento `#i=` del enlace (no llega a ningún servidor) y se borra de la barra de direcciones al abrirlo. No va al archivo sin cifrar de sincronización.
- Riesgo aceptado: quien obtenga el enlace puede enviar gastos falsos a nombre de esa persona; por eso llegan a «Por revisar». Se mitiga desactivando la invitación.

## «Recordar este dispositivo» (opcional, con huella)
- Se activa en Datos › 📱 Este dispositivo, escribiendo la clave una vez. La clave se guarda cifrada (AES-GCM) con una llave que el navegador genera como **no exportable** y guarda en IndexedDB: no se puede leer como texto ni copiar a otro equipo.
- Con «Pedir huella», antes de usarla el navegador exige una verificación de usuario (WebAuthn, huella o rostro del celular). Es un candado local de comodidad: protege si alguien toma el celular ya desbloqueado, no contra alguien con control total del teléfono.
- Si la clave cambió en otro equipo, el recuerdo se borra solo. «Olvidar este dispositivo» o «Cerrar sesión en este dispositivo» lo eliminan.
- Riesgo aceptado: quien pueda abrir Chrome en ese celular (y pase la huella, si está activa) abre Memphis sin la clave. Úsalo solo en dispositivos propios.

## Calendarios externos e intermediario (Cloudflare Worker)
- Las direcciones secretas iCal y la clave del intermediario se guardan solo dentro de los datos cifrados; no van al archivo de sincronización sin cifrar.
- El Worker (`tools/memphis-worker.js`) solo atiende peticiones con la cabecera `X-Memphis-Clave` correcta (comparación en tiempo constante), solo reenvía a calendarios de Google/Outlook/iCloud o a archivos del bot de Telegram, responde CORS solo al origen de Memphis y no guarda nada.
- Por el Worker pasan, en tránsito, el contenido de tus calendarios y de los adjuntos de Telegram, y el token del bot (en cabecera). El Worker está en tu propia cuenta de Cloudflare.
- CSP: `connect-src` agrega `https://*.workers.dev`.

## Notas privadas (PIN)
- Una llave aleatoria AES-256-GCM cifra texto, adjuntos, enlaces, lugar e historial de cada entrada privada (el id de la entrada va como dato autenticado). Quedan visibles fecha, hora y título.
- La llave se guarda envuelta dos veces dentro de los datos cifrados: con el PIN (PBKDF2-SHA256, 310 000 iteraciones) y con la clave principal (para restablecer el PIN).
- Abiertas solo en memoria; toda escritura a disco o Dropbox pasa por `sellar()`, que guarda siempre la versión cifrada. Se cierran a los N minutos, al bloquear o a mano.
- Alcance: protege frente a quien mira la pantalla o usa Memphis ya abierta. Un PIN corto se puede adivinar por fuerza bruta si alguien ya tiene tus datos descifrados con la clave principal; usa 6 dígitos o más, o una frase.

## Cursos (datos de estudiantes)
- Archivo aparte, cifrado con AES-256-GCM (llave aleatoria `cursosK`, guardada solo dentro de los datos cifrados principales). Ni la llave ni los datos de estudiantes van al archivo de sincronización sin cifrar.
- Excel se lee y escribe en un hilo aislado (`excel-worker.js`) que solo devuelve texto o el archivo generado.
- Son datos personales de terceros (Ley 1581 de 2012): no exportes ni compartas planillas completas por canales abiertos; el envío individual por correo manda a cada estudiante solo lo suyo.

## Gmail
- Permiso OAuth solo `gmail.send` (no lee el correo). Flujo de navegador sin programas de Google en la página: ventana de Google → `oauth.html` (recibe el permiso en el fragmento `#`, lo envía a Memphis con `postMessage` al mismo origen y verifica `state`). El permiso vive solo en memoria (1 hora) y se borra al bloquear.
- CSP: `connect-src` agrega `https://gmail.googleapis.com`. `oauth.html` tiene su propia CSP estricta.
- El ID de cliente es público; el «secreto de cliente» de Google no se usa ni debe guardarse.

## Inicio
- La caja que entiende texto trabaja solo en el navegador; no envía nada a ningún servicio. Los apodos aprendidos se guardan como «otros nombres» de las fichas, dentro del archivo cifrado.
- Modo, «ocultar montos» y «abrir en Inicio» se guardan en `localStorage` del dispositivo (no son datos personales).

## Biblioteca: PubMed y compartir
- CSP `connect-src` agrega `https://www.ebi.ac.uk` (Europe PMC) y `https://eutils.ncbi.nlm.nih.gov` (NCBI). Solo se envía el identificador (PMID/PMC), nunca tus notas.
- Compartir, .zip y PDF sacan el contenido **sin cifrar** y solo cuando tú lo pides; las notas 🔒 piden el PIN antes y lo advierten.
- Pegar con formato convierte el HTML a Markdown (el HTML nunca se inserta en la página); las imágenes remotas no se descargan.

## Importar notas y buscar
- La importación lee la carpeta o el .zip solo en el dispositivo (sin servidores); los adjuntos se cifran igual que los demás. Los .zip se descomprimen con `DecompressionStream` del navegador.
- La búsqueda global corre en memoria sobre los datos ya descifrados; no muestra el contenido de las notas 🔒 privadas cerradas.

## Intermediario v2, avisos, OCR y prueba de respaldo
- Intermediario v2: `/meta` y `/img` solo aceptan direcciones http(s) públicas (rechaza localhost, .local y rangos privados) y `/img` solo devuelve imágenes de hasta 6 MB. Todo sigue exigiendo `X-Memphis-Clave`.
- Avisos: para escribirte cuando Memphis está cerrado, la lista de los próximos 8 días y el token de tu bot quedan **sin cifrar en tu espacio KV de Cloudflare** (tu cuenta). El modo «Discreto» manda solo horas. Los avisos enviados se borran al salir de la lista.
- OCR: Tesseract corre dentro de un *worker* del propio sitio; las imágenes no salen del dispositivo. Los archivos del motor (`vendor/tesseract`, licencia Apache-2.0) se sirven desde el repositorio.
- Prueba de respaldo: la clave se usa solo para descifrar en memoria; se restauran las llaves de la sesión al terminar.

## Dispositivos de confianza
- Un dispositivo recordado guarda en IndexedDB: la clave cifrada con una llave AES no exportable y la llave derivada (CryptoKey no exportable) para abrir rápido. Ninguna se puede leer como texto ni copiar a otro equipo.
- El PIN de dispositivo se guarda como PBKDF2 (150 000 iteraciones) con sal; tras 5 intentos fallidos se olvida la clave guardada.
- Las reglas viven en la lista cifrada `disp` (sincronizada) y se copian a `localStorage` solo como regla (sin secretos) para aplicarlas en la pantalla de bloqueo. Revocar borra el recuerdo la próxima vez que ese equipo abra.
- Riesgo asumido: quien tenga el equipo desbloqueado y dentro del plazo de la regla entra a Memphis. Las notas 🔒 privadas siguen pidiendo su PIN.

## Sin datos personales en el código
- El código es público: todos los ejemplos son genéricos (nombres inventados, áreas y plantillas neutras). Las reglas de importación de cada persona (bancos, servicios, empleador, nombres de cuentas) viven **cifradas** en su archivo como reglas propias; el código solo trae reglas comunes de comercios.
- `tools/guardia.sh` revisa antes de cada publicación que no se suban datos.

## Perfiles (varias personas)
- Cada perfil tiene su propia frase, su base local (`finanzasMemphis_<perfil>`), sus preferencias del dispositivo y su carpeta en Dropbox (`/perfiles/<perfil>/…`). Todas las rutas de Dropbox pasan por un único punto (`rutaP`), así que un perfil no lee ni escribe fuera de su carpeta (salvo `/pareja/`, el buzón cifrado de la pareja).
- Con el mismo Dropbox, el permiso de cada celular alcanza la carpeta de la app: sin la frase del otro no puede leer sus datos; a lo sumo podría borrar un archivo, y en ese caso la app lo restaura con la copia local (y Dropbox guarda el historial de borrados).
- «Mudarme a otro Dropbox» descarga primero todos los adjuntos, borra la carpeta del perfil y, al conectar la otra cuenta, sube todo allá.

## Compartir con la pareja
- Emparejamiento con un código de 12 caracteres (~60 bits) que se muestra en pantalla: la invitación en Dropbox va cifrada con una llave derivada del código (PBKDF2-SHA256, 600 000 iteraciones) y vence en 3 días; se borra al aceptarse.
- La llave de pareja (AES-256-GCM, aleatoria) vive dentro de los datos cifrados de cada uno. Cada lado publica `/pareja/<id>/<a|b>.json` cifrado con esa llave (AAD = id y lado). Nada se publica por defecto: personas elegidas (ficha, perfil y registros de salud, sin adjuntos), finanzas a nivel elegido (nada, totales o por categoría) y detalle solo de cuentas o categorías marcadas como comunes; agenda solo con `#familia`.
- Nunca se incluyen: ciclo, registro íntimo, diario personal, notas privadas ni movimientos fuera de lo común.
- Terminar publica una marca de revocación cifrada; la otra app borra lo recibido y la carpeta común. Lo que el otro ya vio en pantalla no se puede «des-ver».

## Salud ampliada (ciclo, íntimo, comidas, bienestar)
- Ciclo, comidas, bienestar y chequeos van dentro de tus datos cifrados; no van al archivo de sincronización sin cifrar ni a la búsqueda general.
- El registro íntimo tiene una capa extra: cada registro (incluida su fecha) se cifra con la llave de las notas privadas (PIN) y AAD propio; las etiquetas que crees también quedan cifradas. Se cierra solo al salir de esa pestaña.
- Los avisos por Telegram del ciclo y de la pastilla usan textos discretos si activas el modo discreto.
- Vista previa de redes (Worker 4.1): para X el Worker consulta api.fxtwitter.com (servicio público de terceros) y, si falla, el oEmbed oficial de X; TikTok y YouTube por su oEmbed oficial; Instagram, Facebook y Threads se leen como lo hacen los lectores de enlaces de las redes sociales. Solo viaja el enlace público, nunca tus datos.
