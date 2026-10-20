# SPAWNLY — Aparece, conecta y juega

Primera versión de una plataforma social para encontrar compañeros de Minecraft. Incluye inicio, explorador de jugadores, grupos, comunidad y una sección dedicada a Spawny. Los jugadores y los eventos son ficticios: esta versión demuestra la experiencia sin registrar cuentas ni contratar servidores.

## Ejecutar

Requisitos: Python 3 y un navegador moderno con módulos JavaScript, `dialog`, `crypto.randomUUID` y `structuredClone` (versiones actuales de Chrome, Edge, Firefox o Safari).

```sh
cd /workspace/Proyecto-good
python3 -m http.server 8000 --bind 0.0.0.0
```

En una computadora donde ejecutes el comando, abre `http://localhost:8000`. Detén el servidor con `Ctrl+C`. Si el puerto está ocupado, usa otro, por ejemplo `8001`, y abre ese puerto en el navegador. No abras `index.html` directamente con `file://`: los módulos necesitan un servidor HTTP.

La aplicación no necesita Node.js, npm, instalación de dependencias, compilación, claves, cuentas ni servicios de pago para funcionar. Los archivos visuales se sirven desde el propio proyecto; no requiere una CDN. Las instrucciones de localhost son para ejecución local y no representan un despliegue público del entorno en la nube.

## Recorrido

| Ruta | Contenido |
| --- | --- |
| `#inicio` | Bienvenida con Spawny, jugadores, grupos y publicaciones destacadas. |
| `#jugadores` | Buscador y filtros de edición, modalidad, idioma y disponibilidad; perfiles y conexiones de demostración. |
| `#grupos` | Grupos, filtros de edición, búsqueda, creación, membresía e integrantes. |
| `#comunidad` | Publicaciones para buscar compañeros, eventos ficticios y grupos destacados. |
| `#spawny` | Presentación de la mascota y estructura de sus futuras expresiones. |

La navegación utiliza fragmentos URL, por lo que no necesita reglas especiales de redirección del servidor. «Iniciar sesión» y «Registrarse» explican el estado de demostración y permiten continuar sin solicitar correo ni contraseña.

## Qué funciona y qué se guarda

Se pueden buscar jugadores, combinar filtros, abrir perfiles, guardar o quitar conexiones locales, marcar interés en publicaciones de otros perfiles ficticios, crear publicaciones, crear grupos, entrar y salir de grupos, ver integrantes y guardar reportes locales. Los formularios validan longitudes, campos obligatorios, edición y modalidad. Los grupos tienen una capacidad máxima y la demo no permite unirse a un grupo completo.

La clave de almacenamiento es **`spawnly-demo-v1`**. Una demo válida guardada antes de incorporar intereses se adapta automáticamente con una lista de intereses vacía, conservando las publicaciones, grupos y demás acciones existentes. Se conserva por navegador y origen: cambiar de puerto, de navegador o de dispositivo crea otro almacenamiento. Esta clave es independiente de `nuvix-demo-v1`, usada por la demo anterior; no se migran ni se eliminan sus datos automáticamente.

No hay base de datos remota, cuentas reales, solicitudes enviadas a otros jugadores, mensajería, conexión a servidores de Minecraft ni chat de voz. Los botones de conexión y membresía modifican únicamente los datos de la demostración. Los eventos no organizan encuentros reales ni inscripciones.

Si localStorage está bloqueado o lleno, los cambios funcionan en memoria durante la sesión y la interfaz avisa de que no se pudieron conservar. Al cargar datos corruptos o incompatibles, el adaptador recupera los datos ficticios iniciales. Las listas devueltas son copias para evitar cambios accidentales fuera del adaptador.

Para volver a empezar, elimina **solo** `spawnly-demo-v1` en Herramientas de desarrollo → Aplicación/Almacenamiento → Local Storage y recarga. También puedes ejecutar esto en la consola del navegador:

```js
localStorage.removeItem('spawnly-demo-v1');
location.reload();
```

## Pruebas manuales

1. **Navegación.** Abre las cinco rutas, usa los botones principales y los botones Atrás/Adelante del navegador. Recarga una ruta interna y comprueba que muestra la sección correcta.
2. **Filtros de jugadores.** En Explorar jugadores, prueba Java y Bedrock; Survival, Hardcore, PvP, Skyblock y Creativo; Español e Inglés; Disponible y Más tarde. Combina varios filtros, busca un apodo o interés y restablécelos. Las tarjetas deben corresponder a la selección.
3. **Estado vacío.** Busca `sin-resultados-123`. Debe aparecer el mensaje con Spawny y una opción para restablecer filtros, sin errores ni tarjetas antiguas.
4. **Perfil y conexión.** Abre un perfil y revisa su edición, plataforma, idioma, biografía, horario genérico y modalidades. Guarda una conexión, cierra y vuelve a abrir el perfil. Recarga y comprueba que se conserva; después quítala. No se envía ninguna solicitud real.
5. **Publicaciones.** Crea una búsqueda desde Comunidad. Prueba campos vacíos, título demasiado corto y descripción de menos de diez caracteres: debe aparecer una explicación y no debe crearse el registro. Con datos válidos, verifica confirmación, aparición de la publicación y persistencia tras recargar. «Me interesa» guarda o quita tu interés local en una publicación de otro perfil ficticio. Comprueba que se conserva tras recargar. No se envían mensajes ni solicitudes reales, y no se puede marcar interés en una publicación propia.
6. **Grupos.** Busca y filtra por edición. Crea un grupo con nombre, descripción, modalidad y edición. Comprueba que apareces como integrante de demostración. Abre un grupo existente, revisa sus integrantes, únete, recarga y verifica la membresía; después sal y comprueba el cambio de cantidad.
7. **Reportes y confianza.** Reporta un perfil o publicación eligiendo un motivo. Verifica la confirmación y la advertencia de que el reporte es local. Revisa las normas y el panel de privacidad. Los reportes no llegan a moderadores.
8. **Acceso y eventos.** Abre Iniciar sesión, Registrarse y los eventos. Deben explicar sus límites sin simular una cuenta ni una inscripción y sin pedir credenciales.
9. **Texto seguro.** Publica un título como `<img src=x onerror=alert(1)>` con una descripción válida. El texto debe verse literalmente, sin crear una imagen ni ejecutar JavaScript. Repite en el nombre de un grupo. Elimina estos datos de prueba al terminar.
10. **Móvil y teclado.** Prueba 390 px y una pantalla de escritorio, además de una ventana intermedia. No debe haber desplazamiento horizontal. Usa Tab y Enter para controles, Escape para cerrar diálogos y comprueba que el foco sea visible. Activa «reducir movimiento» en el sistema para revisar las animaciones reducidas.
11. **Almacenamiento restringido.** En un perfil de navegador con almacenamiento bloqueado, comprueba que la navegación funciona y que una creación muestra un aviso al no poder guardarse. No debe afirmar que sincronizó datos.
12. **Recursos y consola.** Revisa en las herramientas del navegador que los archivos locales respondan correctamente y que no haya errores JavaScript ni recursos faltantes. La apariencia del servidor o un puerto abierto por sí solos no validan las funciones.

## Pruebas automatizadas

Estas herramientas son solo para desarrollo y verificación; no son dependencias de producción. Usa Node.js moderno (pruebas del adaptador ejecutadas con Node 24).

```sh
node --test tests/store.test.mjs
```

Las pruebas del adaptador cubren persistencia tras recargar, validación, conexiones e intereses en publicaciones, migración del estado anterior, membresías y capacidad de grupos, reportes locales, copias defensivas, texto potencialmente peligroso conservado como dato, recuperación ante datos corruptos y almacenamiento bloqueado. La prueba de navegador comprueba además la presentación segura del texto.

Para `tests/smoke.cjs`, deja el servidor Python activo y ten Playwright y Chromium disponibles. En el entorno de desarrollo en la nube se reutilizan las herramientas instaladas. En otra computadora puedes instalar Playwright fuera del repositorio para estas pruebas:

```sh
npm install --no-save --package-lock=false --prefix /tmp/spawnly-test-deps playwright
NODE_PATH=/tmp/spawnly-test-deps/node_modules BASE_URL=http://127.0.0.1:8000 CHROMIUM_PATH=/usr/bin/chromium node tests/smoke.cjs
```

Ajusta `CHROMIUM_PATH` a la ruta real de tu ejecutable Chromium. Si Playwright ya está disponible para Node, basta con `node tests/smoke.cjs`. Los valores predeterminados son `BASE_URL=http://127.0.0.1:8000` y `CHROMIUM_PATH=/usr/bin/chromium`. El script necesita un navegador instalado; instalar el paquete Playwright por sí solo no garantiza que exista ese ejecutable.

## Estructura

```text
index.html                  Entrada y contenedor de la aplicación
css/styles.css              Tema oscuro, componentes y adaptación móvil
js/
  app.js                    Navegación y coordinación de interacciones
  data.js                   Perfiles, publicaciones, grupos y eventos ficticios
  store.js                  Adaptador local y validación de datos
  components/
    cards.js                Tarjetas y estados vacíos reutilizables
    dialogs.js              Perfiles, grupos, formularios y mensajes informativos
  pages/views.js            Plantillas de las cinco secciones
  utils/html.js             Iconos y escape de texto
assets/
  *.svg                     Iconos e ilustraciones locales de bloques
  fonts/                    Space Grotesk local y su licencia
  spawny/
    reference.jpg           Imagen de referencia aportada por el usuario
    spawny.png              Pose de bienvenida derivada de esa referencia
    manifest.js             Registro de expresiones y renderizado de la mascota
tests/
  store.test.mjs            Pruebas del adaptador con node:test
  smoke.cjs                 Pruebas funcionales con Playwright y Chromium
README.md                   Inicio rápido
GUIA.md                     Uso, pruebas y evolución
```

El código usa módulos nativos y componentes de presentación pequeños. No hay una dependencia de framework para poner en marcha la demo. Los datos introducidos se escapan al mostrarse; esta protección de presentación no sustituye la validación y autorización necesarias en un futuro servidor.

## Spawny y recursos visuales

La imagen aportada por el usuario es la referencia principal de Spawny y se conserva en `assets/spawny/reference.jpg`. La pose de bienvenida de `spawny.png` se generó a partir de esa referencia para integrarla en la interfaz, respetando su cabeza de bloques, rostro claro, tonos verdes, flor y mochila. Las ilustraciones SVG del sitio son recursos propios de esta demostración. La tipografía Space Grotesk se sirve desde `assets/fonts/` y conserva su licencia en esa carpeta. SPAWNLY es una propuesta de comunidad sin afiliación con Mojang o Microsoft.

`assets/spawny/manifest.js` prepara las expresiones Feliz, Emocionado, Saludando, Sorprendido, Triste, Celebrando y Jugando. **Actualmente todas reutilizan la misma imagen real disponible.** Las etiquetas de variantes preparadas no significan que existan poses distintas. Para añadir una expresión, incorpora primero su archivo al proyecto y después actualiza el `src` correspondiente en el registro. No se deben apuntar rutas a archivos inexistentes.

Spawny acompaña la bienvenida, la búsqueda, los estados vacíos, las confirmaciones y la sección de presentación. La estructura permite reutilizarlo más adelante en notificaciones reales.

## Privacidad y confianza

Los perfiles muestran apodos, preferencias y horarios genéricos; el país es opcional. No uses datos personales reales para probar la demo. El almacenamiento del navegador no es un almacén seguro para credenciales ni información sensible.

Los botones de reporte guardan motivos únicamente en localStorage: **no existe moderación real, envío a terceros ni investigación de reportes**. El bloqueo, la visibilidad del perfil, la gestión de solicitudes y la eliminación de cuenta se describen como funciones futuras y no están activos. Las normas recomiendan respeto, juego limpio y no compartir teléfonos, direcciones, contraseñas ni información privada.

## Evolución de la plataforma

- **Cuentas y base de datos:** sustituir el adaptador de `js/store.js` por peticiones a una API autenticada y almacenar perfiles, publicaciones y grupos en un servidor. La API deberá validar entradas y permisos; el identificador `me` dejará paso al usuario autenticado.
- **Amistades reales:** modelar solicitudes, aceptación, rechazo y eliminación como estados explícitos. Una conexión local de demostración no equivale a una amistad aceptada.
- **Moderación y privacidad:** añadir autorización, reportes privados para moderadores, bloqueo efectivo, límites contra abuso, ajustes de visibilidad y eliminación de datos. No publicar la demo como servicio con personas reales sin implementar estas capacidades.
- **Recomendaciones:** crear un servicio que ordene candidatos por edición, modalidades, idioma y preferencias elegidas voluntariamente; la lista actual utiliza datos ficticios y filtros, no un algoritmo de recomendación.
- **Horarios:** reemplazar las etiquetas genéricas actuales por franjas de disponibilidad, zona horaria IANA (por ejemplo `America/Guayaquil`) y conversión de fechas. La disponibilidad de demostración no es presencia en tiempo real. Los eventos actuales son ejemplos sin calendario real.
- **Rendimiento:** conservar recursos locales, cargar solo las imágenes necesarias, optimizar nuevas poses y evitar dependencias o servicios externos innecesarios. Mantener compatibilidad con teclado y reducción de movimiento al ampliar animaciones. La tipografía actual se sirve localmente; conserva ese criterio si añades nuevas fuentes.

El proyecto está organizado para incorporar estas piezas por separado. Ninguna cuenta, amistad remota, sincronización o recomendación futura se presenta como implementada en esta versión.
