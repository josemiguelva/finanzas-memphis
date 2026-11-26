# Finanzas Memphis

App personal de finanzas que funciona en el navegador (computador y celular) **sin servidor**.

- **Este repositorio contiene solo el código.** No hay ningún dato personal aquí.
- Los datos (movimientos, facturas, fotos) viven **cifrados** en la nube que elija el dueño (Dropbox, Drive…), con una clave que solo él conoce.
- La página solo puede conectarse a la API de Dropbox (y solo le envía datos cifrados, salvo el archivo opcional de sincronización semanal).

## Uso
1. Abrir la app (GitHub Pages) y tocar **Conectar con Dropbox** (recomendado: guarda solo y sincroniza celular ↔ computador).
2. **Computador (Chrome/Edge):** "Abrir mi carpeta Finanzas Memphis" → elegir la carpeta de Dropbox. La app guarda sola ahí:
   ```
   Finanzas Memphis/
     datos/finanzas-memphis.fmx        ← movimientos (cifrado)
     adjuntos/AAAA/MM/*.fma            ← facturas y fotos (cifradas, una por archivo)
     respaldos/finanzas-memphis_AAAA-MM-DD.fmx  ← copia diaria (cifrada)
     respaldos/automaticos/  ← 3 últimos (al abrir la app y antes de importar/aplicar reglas/restaurar)
     respaldos/manuales/     ← 3 últimos creados con «Crear respaldo»
     respaldos/semanales/    ← 1 por semana, últimas 6
     respaldos/mensuales/    ← 1 por mes, últimos 12
     sync/finanzas_sync.json           ← para la sincronización semanal (sin cifrar, solo movimientos)
   ```
3. **Celular:** "Abrir mi archivo de datos (.fmx)" desde la app de Dropbox; al terminar, Datos › "Guardar archivo cifrado" y reemplazarlo en Dropbox.
4. Se puede instalar como app: menú del navegador › "Agregar a la pantalla de inicio".

## Inicio, hora y categorías automáticas
- **Inicio** (primera pantalla): gasto de hoy, de la semana (desde el lunes) y del mes; botones grandes para añadir o importar; movimientos de hoy en orden de hora; garantías y vencimientos próximos; cobros pendientes. El resumen completo quedó en **Análisis**.
- Cada movimiento acepta **hora** opcional: «14:00», «2 pm», «2 de la tarde», «3 y media de la tarde», «mediodía», o fecha y hora juntas («2026-11-23 2 PM»). Al importar se toma de la columna de hora o de la fecha si la trae; si no, se conserva el orden del extracto.
- **Categoría automática**: al escribir el establecimiento se propone la categoría que más has usado con él o la de la lista de comercios conocidos (Cabify, Uber, DiDi → Transporte; Éxito, Carulla, Alkosto, D1, Ara, Olímpica, Jumbo → Mercado; Rappi → Domicilios; droguerías → Salud…). La lista se edita en Reglas; ahí también está «Completar categorías vacías».

## Diario (módulo)
- Arriba, **💰 Finanzas / 📓 Diario**. El Diario es una agenda personal: cada entrada es una sola cosa (texto en Markdown opcional + fotos + audios + PDF/archivos + enlaces), sin partirse en «objetos».
- **Captura rápida**: «mañana a las 2 pm almuerzo con el jefe» crea un evento (fecha y hora entendidas en español) y ofrece llevarlo a Google Calendar; sin fecha ni hora queda como nota de ahora.
- **Agenda** por día, semana, mes y año; en cada día también se ven (si quieres) los movimientos de Finanzas, vencimientos y cobros recurrentes.
- **Google Calendar**: «Traer de Google (.ics)» importa eventos (incluye repeticiones); reimportar actualiza sin borrar tus notas, fotos ni audios. Cada evento tiene «📅 A Google» (abre Google con el evento listo) y «.ics» con alertas.
- **@persona y #tema** (o @[Nombre con espacios]) conectan todo: cada ficha muestra su línea de tiempo, archivos, vencimientos y movimientos de Finanzas que la nombran.
- **Marcas de tiempo**: creado, última edición y hasta 30 versiones anteriores que puedes restaurar.
- Pegar texto: «con formato» (convierte a Markdown) o «texto plano». Pegar una imagen (captura de pantalla de un chat) la adjunta.
- Enlaces: mostrar el título o el enlace completo, y opcionalmente una captura de lo que ves en esa página.
- Fotos del diario se comprimen (máx. 1920 px) y los audios se graban a 32 kbps (5 min ≈ 1,2 MB). Todo va cifrado y **nada del diario va al archivo de sincronización sin cifrar**.

## 📚 Biblioteca (segundo cerebro)
- Módulo propio: notas, ideas, enlaces, referencias científicas, PDF, libros, citas textuales, material de clase y documentos importantes.
- Pega un DOI y trae título, autores, revista y año de Crossref; «Cómo citarlo» en APA, Vancouver y BibTeX; exporta BibTeX de lo filtrado.
- Etiquetas = los #temas de toda la app (el tema muestra también sus notas, gastos y lo ligado). [[Otra nota]] enlaza notas; cada una muestra «Mencionado en».
- Colecciones, estado de lectura (📖 Por leer), fijados, búsqueda, versiones, adjuntos, relaciones y exportar.
- 🗂️ Bóveda: documentos con fecha de vencimiento (en la agenda y aviso 60 días antes).

## 📥 Bandeja y capturas
- Botón 📥 arriba (con contador). Todo lo capturado llega ahí cifrado y sincronizado; con un toque va a Nota, Evento, Salud, Biblioteca o Gasto (la app sugiere el destino). Al guardar, sale de la bandeja.
- Llega por: Compartir › Memphis en Android (app instalada), el marcador «🔖 Guardar en Memphis» del navegador (página, enlace y texto seleccionado), tu bot de Telegram (texto, fotos —los álbumes llegan juntos—, PDF, audios, reenviados; responde «✔ recibido») o escribiendo/pegando en la bandeja.
- Lo compartido antes de desbloquear espera en el dispositivo y se cifra al desbloquear.
- Telegram: Datos › Capturas › Conectar bot (token de @BotFather; solo tu cuenta queda autorizada). Se revisa al abrir la app y cada 2 minutos.
- ⏰ Any.do: en citas, eventos, medicamentos y vencimientos abre WhatsApp con el recordatorio escrito («Recordarme … el … a las …»); número y plantilla editables en Datos.

## ✅ Tareas, 📋 revisión semanal y plantillas
- **Diario › ✅ Tareas** junta todas las casillas `- [ ]` de notas, salud y biblioteca (vencidas, hoy, próximas, sin fecha). Marcarla aquí la marca en su nota. Las que tienen fecha salen en la agenda del día; ⏰ la manda a Any.do.
- **Diario › 📋 Revisión**: gastos de la semana contra la anterior, eventos, salud, lo que viene (tareas, cumpleaños, vencimientos, cobros, bandeja) y una reflexión que se guarda en el diario. Recordatorio semanal en Google o Any.do.
- **Plantillas** (selector 📋 en el editor de notas y de salud): reunión de tesis, sesión de clase, acta, comité, cita médica. Se editan y se sincronizan.
- **Tesis**: en la ficha de un estudiante de tesis (relación «estudiante de tesis», «tesista», «maestría»…) aparece la tarjeta 🎓 con título, hitos (salen en la agenda), compromisos abiertos y «+ Reunión» con la plantilla.
- **Costos**: la ficha de una persona o un tema suma lo que ha costado (gastos ligados a ella, a sus registros de salud y notas). Las tarjetas de Salud muestran el gasto de los últimos 12 meses.
- **🧾 Renta**: al editar un movimiento puedes marcarlo como soporte (prepagada, intereses de vivienda, pensión voluntaria, AFC, ICETEX, 4×1000, donaciones…). Análisis muestra el total por concepto y año, sugerencias y un CSV. Solo organiza: lo deducible lo confirma el contador.

## 💳 «Mis gastos»: app para un familiar
- En **Datos › App «Mis gastos»** creas una invitación (nombre, cuentas con que paga y si sus gastos cuentan como de la familia). Se genera un enlace `gastos.html#i=…` que le envías por WhatsApp.
- En su celular, ese enlace abre una app sencilla: valor, dónde, fecha, categoría, medio de pago, nota y foto de la factura. Ve solo lo que ella anota.
- «📤 Enviar» produce un archivo `.txt` **cifrado (AES-256-GCM)** que comparte por WhatsApp, Telegram o correo. Tú lo compartes con Memphis, lo reenvías al bot o lo pegas en la 📥 bandeja: Memphis lo reconoce y crea los movimientos en «Por revisar», con la foto como adjunto. No duplica; si ella corrige un gasto, se actualiza; si lo borra, te avisa.
- La clave de cada invitación vive solo en tus datos cifrados y en el enlace. Quien tenga el enlace puede *enviarte* gastos, nunca leer tu Memphis. Puedes desactivar una invitación.

## 📱 Recordar este dispositivo y huella
- Datos › 📱 Este dispositivo › «Recordar este dispositivo»: escribes la clave una vez y Memphis deja de pedirla en ese celular. Con «Pedir huella», al abrir (o al volver después del bloqueo) te pide la huella o el rostro. Puedes dejar el bloqueo automático en 120 minutos.

## 🗓️ Calendarios de Google, Outlook o iCloud
- Datos › 🗓️ Calendarios: pegas la «dirección secreta en formato iCal» de cada calendario. Sus eventos aparecen solos en la agenda como eventos del Diario: les escribes notas, adjuntas documentos, nombras @personas y #temas y los relacionas con gastos o la Biblioteca. Título, hora, lugar y descripción vienen de Google y se actualizan solos (al abrir y cada 30 min).
- Los navegadores no dejan leer esas direcciones directamente, así que pasan por un intermediario propio en Cloudflare Workers (gratis): código en `tools/memphis-worker.js`, protegido con una clave que genera Memphis (variable secreta `MEMPHIS_CLAVE`). El mismo intermediario trae los adjuntos del bot de Telegram.

## ⟳ Recargar, filtros, por clasificar, viajes y privadas
- **⟳** (barra de arriba): trae y sube lo de Dropbox, recarga calendarios, revisa Telegram y lo compartido. En la app instalada también se recarga deslizando hacia abajo.
- **Agenda**: filtros 📓 Notas · 📅 Mis eventos · 🗓️ Google… y el atajo «📓 Solo notas» (se recuerdan). La vista Día separa 📅 Agenda y 📓 Notas del día. «☑ Seleccionar» permite mandar varias notas a la Biblioteca o descartarlas.
- **Biblioteca › 📥 Por clasificar**: lo que llegó por Telegram, Compartir o la bandeja, con selección múltiple: «A la Biblioteca» (copia y relaciona; «Mover» opcional), «Dejar como nota» o «Descartar». Cada nota tiene también «📚 A la Biblioteca».
- **Eventos de varios días** (viajes, congresos, incapacidades): panel «🧳 Día a día» con una pestaña por día para añadir subeventos; cada uno es una entrada del Diario con «↳ evento», o se oculta de la agenda. La captura rápida sugiere añadir al evento en curso. Resumen por día, gastos de esas fechas (para ligar) y exportación.
- **🔒 Privadas** (Diario y Biblioteca): «🔒 privada» en el editor, «🔒 Hacer privada» en el detalle o empezar la captura rápida con 🔒. Siempre se ven cerradas (día, hora y título o ••••••); al abrir una se pide el PIN y al cerrar el detalle se vuelve a cifrar. Búsqueda aparte con «🔒 Buscar en privadas». En Datos: crear/cambiar PIN, «Olvidé el PIN» (con la clave principal) y cada cuánto pedirlo (por defecto, cada vez).

## 🎯 Proyectos
- Proyecto con área, estado, fechas, código, color, objetivo general, equipo (personas y roles), descripción, tema para notas (#[tema]) y opción de franja en la agenda.
- **Elementos**: objetivos, tareas y subtareas (sin límite de niveles), hitos, resultados y entregables, con estado, prioridad, responsable, inicio, fecha límite, avance (o calculado de las subtareas), dependencia («espera a»), meta e indicador, notas y relaciones.
- **Añadir rápido** con lenguaje natural: «revisar datos con @[Ana] el viernes», «◆ entrega informe 15 de diciembre», «🎯 Objetivo: …», «!!» = prioridad alta.
- **Vistas**: 📊 Resumen (avance, objetivos, vencidas, próximo, hitos, resultados, reuniones, últimos registros, gastos ligados) · 🗂️ Lista en árbol (arrastrar para ordenar o anidar) · 🧱 Tablero · 📅 Cronograma (Gantt por semanas, meses, trimestres o año, hoy y dependencias) · 🗓️ Calendario · 📓 Bitácora (notas, reuniones y tareas terminadas) · 📎 Archivos, enlaces y relaciones (gastos, Biblioteca…) · 👥 Personas con sus pendientes.
- Globales: ☑️ Mis tareas de todos los proyectos y 📅 Cronograma de todos los proyectos activos. Las tareas con fecha salen en la agenda (filtro 🎯 Proyectos); las notas y reuniones del Diario tienen campo «Proyecto»; las fichas de personas muestran sus proyectos y tareas.
- Exportar: informe en PDF, tareas en Excel o CSV y Markdown.

## 🎓 Cursos
- Semestres y cursos (código, grupo, horario, codocentes, escala 0–5 / aprueba 3 / decimales, peso opcional de la asistencia).
- **Listado**: pegar desde el SIA o Excel, o importar Excel/CSV/TXT; se indica qué es cada columna (N°, apellidos, nombres, nombre completo, documento, plan, correo…). Al **actualizar** se agregan los nuevos, se actualizan datos y se marcan como retirados los que ya no aparecen.
- **Asistencia**: por sesión, en lista (P/A/T/E, «todos presentes») o **uno por uno** con teclado (P, A, T, E, ←/→, Z deshacer) o botones grandes en el celular. Importa Plickers (scoresheet CSV) y planillas.
- **Notas**: calificaciones con título, fecha, grupo, nota máxima y comentarios; **grupos con pesos** (p. ej. quices 50 %, parciales 40 %, trabajo 10 %) que promedian solo lo calificado y pueden anular las peores; acumulada y «si terminara hoy». Pegar columnas (por documento, correo, N° o en orden de la lista), importar Excel/CSV y ZipGrade.
- **Exportar** Excel (lista, asistencia y notas en hojas), CSV, TXT y PDF (imprimir).
- **Cursos por módulos**: en ⚙️ Curso se marcan los tramos del semestre y cuáles están a tu cargo; las sesiones y la asistencia se crean solo para esos.
- **Calendario** del curso y de todos los cursos (menú 🗓️ Calendario): clases, módulos, calificaciones, cierres de corte y festivos de Colombia.
- **Sesiones y bitácora**: «Crear sesiones» (desde–hasta o por módulos, días y horas, omite festivos de Colombia, vista previa); cada sesión tiene tema, plan, lo que se hizo, documentos, la asistencia de ese día y las calificaciones de esa fecha; se agrupan por semana y corte. Las clases salen en la agenda (filtro 🎓 Clases) con botones de asistencia y bitácora.
- Página de cada estudiante (asistencia, notas con comentarios, bitácora) y directorio de todos los estudiantes por curso y semestre.
- **✉️ Resúmenes por Gmail**: desde la lista del curso (o la página del estudiante) se envía a cada estudiante solo su resumen (notas con comentarios, promedios por grupo, acumulada y asistencia con fechas de ausencia), con asunto y mensaje con {nombre}, {curso}…, vista previa y prueba a tu correo. Configuración en Datos › ✉️ Correo con Gmail (ID de cliente de Google Cloud; permiso solo para enviar, dura 1 hora, no se guarda).
- Los datos de cursos van en un archivo cifrado aparte (`/datos/cursos-memphis.fmc` en Dropbox), con llave propia guardada en tus datos cifrados; se fusionan celda a celda entre dispositivos.

## Relaciones
- Cualquier cosa se liga con cualquier otra (gasto, nota o evento, registro de salud, vencimiento, recurrente, persona, lugar, tema). Al abrir cualquiera aparece «🔗 Relacionado»: lo ligado (tócalo para ir y «← volver»), el costo total por categoría, sugerencias automáticas (mismas fechas, persona, lugar, farmacia/EPS, transporte del día) con «Ligar» o «✕ no sugerir», y «+ Relacionar» para buscar en todo.
- En la agenda, lo ligado muestra «🔗 n · $total». Un tema (#Remodelación cocina) sirve de carpeta para un asunto largo y suma lo que costó.
- Se sincroniza; quitar una relación tiene deshacer. Recuperar algo de la papelera conserva sus relaciones.

## Apariencia
- 🎨 en la barra: Automático, Claro, Suave u Oscuro, y color de botones (azul, verde, violeta, terracota, grafito). Por dispositivo.
- Cada módulo tiene su color (franja superior, botón del módulo y su submenú).

## Fechas, atajos y lugares (en toda la app)
- Un solo lector de fechas para Diario, Salud y Finanzas: hoy, ayer, anteayer / antes de ayer / antier, mañana, pasado mañana; «hace 3 días», «en una semana», «dentro de 8 días»; «el próximo viernes», «el viernes pasado», «viernes 20»; «7 de octubre», «7 de oct», «el 07 del 10», «7/10/2026», «2026-10-07» (sin año, el más cercano a hoy); rangos «del 20 al 23 de noviembre», «desde el lunes hasta el miércoles», «del viernes 3 pm al sábado 11 am», «de 2 a 4 pm»; aproximadas «a finales de octubre».
- «el viernes» sin más: si el texto cuenta algo que ya pasó (fui, tuvo, le dio…) es el último; si no, el próximo. La vista previa siempre muestra la fecha completa antes de guardar.
- Las fechas escritas dentro de las notas se muestran con su fecha completa y abren ese día en la agenda.
- Eventos del diario de varios días (fecha final), también al enviarlos a Google o .ics.
- @yo es la persona con relación «yo». @esposa, @decana, @jefe… se resuelven por la relación o el cargo de la persona. Sin @ nunca se asume: la vista previa pregunta «¿«mi esposa» es @Ana?».
- 📍 Lugares (en Personas): nombre, dirección y atajos («mi casa», «mi trabajo», «la Nacional»). Al escribir «en mi casa» o «fui a Unisalud» se llena el Lugar; Google Calendar recibe la dirección.

## Compartir (exportar sin cifrar)
- 📤 en un registro de salud o del diario, «Compartir su historia» en un perfil de salud, «Exportar lo filtrado» o «☑ Elegir registros» en el historial, «Exportar» en la ficha de una persona y en la búsqueda.
- Formatos: página HTML (con fotos dentro; se imprime o guarda como PDF), Markdown o texto para chat. Rango de fechas y orden. En el celular abre el menú Compartir del teléfono (WhatsApp, Telegram, correo…); en el PC descarga o copia.
- Lo exportado queda sin cifrar (la app lo advierte). No es un respaldo.

## Personas (área común)
- En Diario › 👥 Personas: cada persona tiene relación (papá, tía, suegro, jefe, estudiante de tesis…), grupo (familia cercana, familia, trabajo, universidad, amigos, médicos, servicios), teléfonos (con enlace a llamar y WhatsApp), correos, empresa y cargo, dirección, cumpleaños, otros nombres y notas.
- 📇 Importar contactos: el archivo .vcf que exporta el celular (uno o cientos); eliges cuáles, a qué grupo van, y los que ya existen solo se completan. Cada persona se puede exportar como tarjeta .vcf.
- La ficha reúne todo lo que hay con esa persona: notas y eventos del diario (@Nombre), movimientos que la nombran (incluida su cuenta), vencimientos y salud. Los cumpleaños salen en la agenda y en «Cumpleaños próximos».
- Las personas marcadas «🩺 en Salud» (o agregadas con «+ Pariente» en Salud › Perfiles) tienen perfil e historial de salud.

## Salud (módulo)
- Arriba, **🩺 Salud**: un registro por cosa que pasa (enfermedad con síntomas, cita, accidente, vacuna, medicamento, examen, control de medidas o nota), de una o varias personas.
- Captura rápida en palabras: «Sofi fiebre 38.5 y tos desde ayer», «mañana 7 am cita pediatra Tomás», «amoxicilina cada 8 horas por 7 días para Ana». Reconoce persona (por la ficha y sus otros nombres), síntomas de la lista, temperatura, fecha/hora y tipo.
- Síntomas con lista de opciones editable (pestaña 📊 Síntomas), con estadísticas por persona y episodios por mes.
- «✍️ Cómo sigue» agrega la evolución día a día con fecha y hora; «✅ Ya se recuperó» cierra el episodio.
- Medicamentos con dosis, cada cuántas horas, días y primera toma: muestra la próxima dosis y crea recordatorios (Google Calendar o .ics con alarma en cada toma).
- Vacunas con próximo refuerzo (aparece en el Resumen y en la agenda), medidas (peso, talla, temperatura), incapacidades, fotos de fórmulas/órdenes, PDF, audios y enlaces.
- Perfiles por persona (nacimiento, sangre, EPS, alergias…) con toda su historia, vacunas, medicamentos, medidas y archivos.
- Todo conectado: la agenda del Diario muestra citas y refuerzos; la ficha @persona del Diario muestra su salud; la búsqueda encuentra registros de salud; cada registro sugiere los gastos de farmacia/EPS de esas fechas para vincularlos.
- Versiones, papelera de 30 días y deshacer como en el Diario. Salud **no** va al archivo de sincronización sin cifrar.
- El historial anterior se trae con un paquete (Datos › Importar paquete) preparado fuera del repositorio; los registros guardan el enlace a su origen.

## Adjuntos: el texto primero, los archivos en segundo plano
- Al adjuntar, el archivo se cifra y queda guardado en el dispositivo al instante; la subida a Dropbox va en una cola que trabaja sola, con reintentos, y sobrevive a cerrar la app (aviso «⬆ N adjuntos subiendo…»).
- Los datos (texto) se sincronizan sin esperar a los adjuntos. En el otro dispositivo cada adjunto se baja al abrirlo y queda en caché; si aún no terminó de subir, la app lo dice.
- Opcional (Datos › Dropbox): traer en segundo plano las fotos, audios y PDF de los últimos 60 días (máx. 60 MB por vez; no en modo ahorro de datos). La app pide al navegador almacenamiento persistente para que la caché no se borre.

## Familia
- Selector **👨‍👩‍👧 Familia / 🙋 Yo / 💜 tu familiar** en Análisis y Gráficos. Inicio siempre muestra la familia.
- Datos › Familia: nombre del familiar, de quién es cada cuenta (mía / de mi familiar / de otra persona, que no cuenta), ingresos estimados del familiar (sueldo, prima y en qué meses) y personas con gastos compartidos (sus transferencias son reembolsos). Todo esto vive cifrado en tus datos, no en el código.
- En la vista Familia lo que se pasan entre ustedes no es gasto ni reembolso, para no contar doble.
- **Efectivo**: el retiro del cajero cuenta como «Efectivo sin detallar»; cada gasto en efectivo que anotas se descuenta de ese retiro y aparece el día que lo hiciste, en su categoría. Si un pago en efectivo lo hizo tu familiar, márcalo en «¿De quién es el dinero?».
- Gráficos › **🐷 Dónde ahorrar**: lo que más subió frente al promedio de 3 meses, gasto fijo vs. variable, comercios del gasto variable y el costo anual de las suscripciones.

## Respaldos, papelera y deshacer
- **Datos › Respaldos**: lista de copias, «Ver qué cambió» (qué tiene el respaldo que hoy no está), «Recuperar solo lo que falta» o «Restaurar todo». Antes de restaurar se respalda lo actual. Una restauración se aplica también en los demás dispositivos (cada uno respalda lo suyo antes).
- Con Dropbox conectado los respaldos quedan en Dropbox › Aplicaciones › (carpeta de Memphis) › respaldos (además de una copia en el dispositivo). Todos van cifrados; uno hecho con una clave anterior pide esa clave.
- Borrar un movimiento, vencimiento o recurrente lo manda a la **papelera** (30 días) y muestra «Deshacer» unos segundos; editar un movimiento también se puede deshacer.

## 🎯 Nombre corto de proyecto
- Cada proyecto puede tener un **nombre corto o apodo** (máx. 30 caracteres): se usa en la agenda, listas, chips, avisos, vínculos y búsqueda, y la caja de Inicio lo reconoce. El nombre completo se ve en la ficha del proyecto y al exportar.

## 💻 Dispositivos de confianza
- Cada dispositivo (celular, navegador, PC, tablet) queda en **Ajustes › Seguridad › Mis dispositivos** con su regla: cada cuánto pide huella o PIN (la primera vez del día, cada 12 h, cada 7 días, siempre o nunca) y tras cuánto se bloquea (nunca, 5 min… 1 día). Las reglas se cambian desde cualquier equipo; «Revocar» hace que ese equipo olvide la clave al abrirse.
- Apertura rápida: la llave ya calculada se guarda protegida por el navegador (no exportable), así un equipo recordado abre en menos de un segundo.
- La sincronización automática ya no mueve la pantalla (conserva la posición y espera si estás escribiendo). Avisos de pagos y vencimientos: 3 días antes, la víspera y el mismo día a las 7 a. m.

## 🖼 Vista previa · 🔔 Avisos por Telegram · 🔤 OCR · 🧪 Prueba de respaldo
- **Vista previa de enlaces** (Biblioteca): al guardar un enlace llegan solos el título, la descripción, el sitio y la imagen (cifrada como adjunto), vía tu intermediario de Cloudflare **v2** (`/meta`, `/img`). También «🖼 Vista previa» en la nota, en el lector y para varios seleccionados. Facebook/Instagram/X a menudo no la entregan sin sesión.
- **Avisos por Telegram aunque Memphis esté cerrado** (Ajustes › Conexiones): actividades (con sus alertas o N minutos antes), citas, clases, tareas con hora, pagos fijos, vencimientos, cumpleaños y un resumen del día. Memphis sube la lista de 8 días al intermediario (espacio KV `AVISOS` + Cron `*/5 * * * *`), que te escribe con tu bot. Modo discreto: solo la hora.
- **OCR en el dispositivo** (Tesseract, español e inglés, en `vendor/tesseract/`): «🔤 Leer texto» en cualquier editor con imágenes; en un movimiento propone total, fecha, establecimiento y NIT de la factura.
- **Prueba de respaldo** (Ajustes › Datos): abre la copia de Dropbox o un .fmx con tu clave sin tocar la sesión, compara conteos y descifra una muestra de adjuntos; Inicio la recuerda cada 30 días.

## 📥 Importar notas · 🔎 Buscar en todo · ⚙️ Ajustes
- **Importar** (Biblioteca › 📥 Importar, o Ajustes › Datos): exportación de **UpNote** en Markdown o HTML (carpeta o .zip), y también Notesnook, Obsidian o cualquier carpeta de .md/.html/.txt. Libretas → colecciones, sublibretas → etiquetas, fechas de creación conservadas, imágenes y archivos de la carpeta *Files* adjuntos y cifrados, etiqueta #upnote opcional. Reimportar no duplica. Soltar el .zip en la Biblioteca también importa.
- **Buscar en todo** desde la caja de Inicio («🔎 Buscar en todo», escribir «?…», tecla «/» o Ctrl+Shift+K): biblioteca, diario y agenda, salud, fichas, proyectos y tareas, cursos, estudiantes y bitácoras, movimientos (también por valor), vencimientos, pagos fijos y bandeja. Respeta el modo y no muestra el contenido de las privadas.
- **⚙️ Ajustes** (botón arriba): este dispositivo (portada, modo, montos, pegado, vistas de la Biblioteca, apariencia), seguridad, datos y respaldos, conexiones y Finanzas, con buscador de ajustes. Finanzas › Datos sigue existiendo.

## 📚 Biblioteca: vistas, compartir, PubMed y arrastrar
- **Vistas**: ☰ Lista · ▦ Cuadritos (con miniatura) · ▤ Tabla (ordenar tocando la columna) · 🗂 Fichas (cita APA) · 📋 Tablero por estado (arrastrar en PC, botones en el celular). Se recuerda una vista para el celular y otra para el PC. Agrupar por colección, etiqueta, tipo, fuente, estado, año o mes; carga por tandas al bajar.
- **PC/tablet**: panel lateral de colecciones y etiquetas y lector al lado. **Celular**: una columna, filtros plegados, mantener presionado = seleccionar.
- **Selección múltiple**: etiquetar (con «-» quita), colección, estado, compartir, .zip, borrar.
- **📤 Compartir**: «Enviar a…» del sistema (con archivos), WhatsApp, correo, copiar texto/Markdown/enlace, cita APA, BibTeX, RIS, .md o .zip (Markdown + adjuntos, importable en Notesnook/Obsidian/UpNote), PDF.
- **Captura**: DOI (Crossref), **PMID y PMC** (Europe PMC, respaldo NCBI) con autores, revista y resumen; enlaces de Facebook, Instagram, X, Threads, YouTube, TikTok… se reconocen y se titulan solos; sugiere la **colección** según lo que ya clasificaste.
- **Arrastrar y soltar** archivos en toda la app; **pegar con formato** (títulos, negritas, listas, enlaces; imágenes incrustadas se adjuntan, las de internet quedan como enlace).

## 🏠 Inicio
Portada al abrir (desactivable): saludo, **caja que entiende lo que escribes** (Ctrl+K desde cualquier módulo), acciones rápidas, «Hoy» (agenda, clases, tareas de proyecto con hora, franjas), tareas vencidas, notas del día, «Por atender» (por clasificar, movimientos por revisar, pagos de los próximos 7 días, vencimientos, asistencias sin tomar, cumpleaños) y resúmenes de Finanzas, Cursos, Proyectos, Salud y Biblioteca.
- **Modo** 💼 Trabajo / 🏠 Personal / Ambos (por dispositivo): Trabajo oculta Finanzas y Salud; Personal oculta Cursos y Proyectos (también en la agenda).
- **🙈 Ocultar montos**: todas las cifras de dinero se muestran como «$ •••» (por dispositivo).
- **La caja** reconoce: gastos («25 mil», «25 lucas», «25k», «$25.000», «2,5 millones»; cuenta y categoría por el historial), tiempos relativos a ahora («ahora», «en este momento», «hace 10 min», «hace 1 hora», «en 45 min», «en dos horas»), actividades, salud (síntomas, «me duele», «a X le duele»), tareas (verbo en infinitivo o «debo/tengo que…») y el proyecto aunque lo escribas incompleto, enlaces/DOI → Biblioteca, y lo demás como nota. Antes de guardar muestra qué entendió y se puede cambiar el tipo o el proyecto.
- **Apodos**: si escribes «mi X» o «a X le duele» y X no está en tus fichas, pregunta quién es y lo guarda como «otro nombre» de esa ficha (dentro del archivo cifrado, nunca en el código).
- Cursos tiene la pestaña **📌 Hoy** (clases, asistencias sin tomar, por calificar, estudiantes en alerta) y Proyectos muestra indicadores arriba.

## ✍️ Escritura: tres horas, recordatorios y atajos
- Cada nota tiene **✍️ escrita** (cuándo la anotaste, al pie, editable), **🕑 cuándo pasó o cuándo es** y **⏰ recordatorios** (varios por nota o actividad, cada uno con su fecha, hora y texto). Una nota sin ⏰ no avisa. Las actividades con hora avisan antes (o «🔕 Sin aviso»).
- «…si no responde, recordarme en una semana» crea un ⏰ aparte (te pregunta con una etiqueta ✕/Sí) y **no** mueve la fecha de la nota. La fecha cambia solo si el texto empieza con ella («Ayer fui…»).
- Lo detectado aparece como etiquetas con ✕ (persona, lugar, recordatorio) y se sugiere ligar la actividad del mismo día. «su oficina» o «la oficina de X» no se toma como tu lugar. `@"Nombre Apellido"` = `@[Nombre Apellido]`.
- Atajos: `@` persona, lugar, proyecto, actividad o libro · `#` tema · `/` comandos (tarea, lista, título, negrita, resaltar, color, cita, separador, recordar, foto, galería, archivo, audio, hora, plantilla) · `[ ]` casilla · `{verde:texto}` resaltado de color. En el celular, barra de atajos sobre el teclado. Botón «⌨ ?» con la ayuda.
- Panel «🔗 Relacionar» en el editor: lo de ese día, lo parecido y una búsqueda para ligar.
- Personas con **campos extra** libres; listas de personas, lugares y temas en grupos plegables (los más usados primero). Cursos con **campos propios** por curso (p. ej. «Grupo»), editables en la tabla, para agrupar y exportar.

## 🖱 Menú de acciones, selección múltiple y teclado
- **Clic derecho** (PC) o **mantener presionado** (celular) sobre una nota, actividad, tarea, persona, lugar, movimiento, elemento de la Biblioteca, estudiante o día de la agenda abre sus acciones: editar, recordarme, mover de día, convertir, ligar, asignar proyecto, duplicar, compartir, crear regla, dividir gasto, copiar cita, unir fichas duplicadas, asignar Grupo… En el celular sale como hoja desde abajo.
- **☑ Seleccionar varios**: toca otros elementos del mismo tipo y aplica una acción a todos desde la barra naranja.
- Al **seleccionar texto** en una nota: negrita, resaltar, colores, tarea, recordatorio, persona o tema.
- **🔎 en la barra** (junto a ⟳) o **Ctrl+F** / «/»: buscar en todo desde cualquier parte. Ctrl+F otra vez dentro de la búsqueda usa la del navegador.
- Teclas (fuera de un campo): **N** nota · **E** actividad · **R** recordatorio · **T** tarea · **G** gasto · **I** ingreso · **B** biblioteca · **S** salud · **1–7** módulos · **?** ayuda. **Ctrl+Enter** o **Ctrl+S** guarda; **Esc** cierra; **Shift+F10** menú del elemento.

## Seguridad (resumen)
| Qué | Cómo |
|---|---|
| Cifrado de datos | AES-256-GCM; clave derivada de la frase con PBKDF2-SHA256, 600.000 iteraciones, sal aleatoria |
| Adjuntos | AES-256-GCM con una llave interna aleatoria guardada dentro del archivo de datos cifrado |
| Red | CSP: solo Dropbox (`api.dropboxapi.com`, `content.dropboxapi.com`) |
| Código de terceros | Ninguno desde internet; SheetJS va copiado en `vendor/` |
| Bloqueo | Automático tras minutos sin uso; borra datos y llaves de la memoria |
| Repositorio | La acción "Guardia de datos" rechaza cualquier archivo con forma de datos |

Detalles y auditoría en [SEGURIDAD.md](SEGURIDAD.md).

## Formato y actualizaciones
Cada archivo de datos lleva un número de formato; las versiones nuevas de la app migran automáticamente los archivos anteriores. Las reglas personales de clasificación van dentro del archivo cifrado, no en este código.
