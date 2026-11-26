// Lee o escribe Excel en un hilo aislado (sin acceso a la página ni a tus datos).
// · ArrayBuffer            → filas de la primera hoja como objetos (uso original)
// · {leer:ArrayBuffer}     → todas las hojas como tablas de texto [[...],[...]]
// · {escribir:{hojas:[{nombre,filas:[[...]]}]}} → ArrayBuffer de un .xlsx
importScripts("vendor/xlsx.full.min.js");
onmessage = e => {
  try {
    const d = e.data;
    if (d && d.escribir) {
      const wb = XLSX.utils.book_new();
      for (const h of (d.escribir.hojas || []).slice(0, 30)) {
        const ws = XLSX.utils.aoa_to_sheet(h.filas || []);
        if (h.anchos) ws["!cols"] = h.anchos.map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, String(h.nombre || "Hoja").replace(/[\\/?*\[\]:]/g, " ").slice(0, 31));
      }
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      postMessage({ xlsx: out }, [out]);
      return;
    }
    if (d && d.leer) {
      const wb = XLSX.read(d.leer, { type: "array", cellDates: true });
      const hojas = wb.SheetNames.slice(0, 30).map(n => ({ nombre: n, filas: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: "", raw: false, dateNF: "yyyy-mm-dd", blankrows: false }).slice(0, 20000).map(r => r.slice(0, 300).map(v => String(v ?? "").slice(0, 2000))) }));
      postMessage({ hojas });
      return;
    }
    const wb = XLSX.read(d, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false, dateNF: "yyyy-mm-dd" });
    postMessage({ filas: JSON.parse(JSON.stringify(filas)) });
  } catch (err) { postMessage({ error: "No pude leer o escribir el Excel: " + String(err && err.message || err).slice(0, 200) }); }
};
