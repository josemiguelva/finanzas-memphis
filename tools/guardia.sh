#!/usr/bin/env bash
# Guardia del repositorio: falla si alguien intenta subir datos personales.
# Este repositorio debe contener SOLO el código de la app.
set -u
fallas=0
# 1) Ningún archivo de datos: .fmx, .fma, .json (salvo el manifiesto), hojas de cálculo, extractos, PDFs, imágenes de facturas
while IFS= read -r f; do
  case "$f" in
    manifest.webmanifest|icons/*.png|icons/*.svg) ;;
    *.fmx|*.fma|*.json|*.csv|*.xlsx|*.xls|*.pdf|*.zip|*.jpg|*.jpeg|*.png|*.heic|*.txt|*.tsv|*.ofx|*.qif)
      echo "PROHIBIDO: $f (parece un archivo de datos)"; fallas=1;;
  esac
done < <(git ls-files)
# 2) Ningún contenido con forma de movimientos o de datos personales en los archivos de texto
patrones='"mov"[[:space:]]*:[[:space:]]*\[|"saldos"[[:space:]]*:|"filaSheets"[[:space:]]*:[[:space:]]*[0-9]|"dek"[[:space:]]*:[[:space:]]*"'
if git ls-files -z -- '*.html' '*.js' '*.css' '*.md' '*.yml' | grep -zv '^vendor/' | xargs -0 grep -nE "$patrones" 2>/dev/null; then
  echo "PROHIBIDO: contenido que parece datos de movimientos"; fallas=1
fi
# 3) Lista de términos privados opcional (secreto del repositorio GUARDIA_TERMINOS, uno por línea)
if [ -n "${GUARDIA_TERMINOS:-}" ]; then
  while IFS= read -r term; do [ -z "$term" ] && continue
    if git ls-files -z | xargs -0 grep -niF -- "$term" >/dev/null 2>&1; then echo "PROHIBIDO: aparece un término privado"; fallas=1; fi
  done <<< "$GUARDIA_TERMINOS"
fi
[ $fallas -eq 0 ] && echo "Guardia OK: solo código, sin datos." 
exit $fallas
