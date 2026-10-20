# SPAWNLY

**Aparece, conecta y juega.** Una demostración social para encontrar compañeros de Minecraft Java y Bedrock, conocer jugadores y formar grupos.

HTML, CSS y JavaScript con módulos nativos. Sin instalación de paquetes ni compilación para ejecutar la aplicación.

```sh
cd /workspace/Proyecto-good
python3 -m http.server 8000 --bind 0.0.0.0
```

En tu computadora, abre `http://localhost:8000`. Se requiere HTTP: no abras `index.html` con `file://`.

Los perfiles, eventos y conexiones son ficticios. Las publicaciones, grupos, conexiones y reportes se guardan solo en el navegador; no hay cuentas reales, base de datos remota ni moderación en línea.

Consulta [GUIA.md](GUIA.md) para las funciones, pruebas, estructura del proyecto, uso de Spawny y siguientes pasos de desarrollo.

Pruebas del adaptador (Node.js): `node --test tests/store.test.mjs`. Las pruebas en navegador requieren Playwright y Chromium; consulta la guía para configurarlas.
