# SPAWNLY SOCIAL — Activación de la plataforma real

Esta rama integra `#social` dentro de `index.html`, la web principal de Spawnly. `social.html` redirige a esa sección. La comunidad real se conecta a Supabase (no es una simulación de localStorage). Incluye:
- Alta y acceso por correo y contraseña con Supabase Auth.
- Edición de apodo y preferencias Java/Bedrock.
- Búsqueda de perfiles registrados, invitaciones y aceptación/rechazo de solicitudes.
- Lista de amigos y conversaciones privadas **solo entre amigos aceptados**.
- Grupos públicos que los miembros pueden crear, descubrir, unirse y abandonar.
- Chat de grupo, controlado por pertenencia al grupo.
- Actualización de chats mediante Realtime cuando está habilitado, con comprobación periódica de respaldo.

## Ponerlo en marcha

1. Crea un proyecto en https://supabase.com y guarda su **Project URL** y **publishable key** (o **anon key**). **Nunca** publiques `service_role`, secretos JWT, contraseñas ni API keys de privilegios administrativos.
2. Abre Supabase → SQL Editor, copia y ejecuta `supabase/schema.sql`. Se crean tablas y políticas RLS para que usuarios no puedan leer conversaciones de desconocidos.
3. En Supabase → Authentication → URL Configuration, configura **Site URL** como `https://josephguave2009-bit.github.io/Proyecto-good/` y agrega `https://josephguave2009-bit.github.io/Proyecto-good/social.html` en Redirect URLs.
4. Edita `js/social-config.js` reemplazando **solo** `SUPABASE_URL` y `SUPABASE_ANON_KEY`. Son valores públicos autorizados para ejecutarse en el navegador, siempre que RLS siga activado.
5. Para actualizaciones instantáneas, habilita las tablas `direct_messages`, `group_messages`, `friend_requests`, `group_members` y `game_groups` en Database → Publications → `supabase_realtime`. Si no lo haces, se recarga la información cada 5 segundos.
6. Publica la rama tras revisar y probar. En GitHub Pages la ruta será `/Proyecto-good/#social`. La barra de navegación contiene «Amigos y chat» y los botones de entrada llevan a `#social`.
7. Crea dos cuentas usando dos correos distintos (puedes usar ventanas privadas separadas), confirma ambos correos si Supabase lo requiere. Envía solicitud, acéptala y verifica mensajes en ambas sesiones.

**Nota:** GitHub Pages aloja únicamente el frontend; Supabase gestiona las cuentas, base de datos y chat. La web no será funcional en producción hasta configurar y desplegar ambos.

## Antes de invitar usuarios reales

Esto es una primera base social, no un producto completamente endurecido. Realiza pruebas de autorización (incluidos ataques usando directamente la API), implementa bloqueo, eliminación de mensajes, reportes reales, moderación, protección contra spam y límites de envío, reglas de edad y privacidad, controles contra abuso y un proceso de eliminación de cuentas. Revisa políticas de protección de menores y retención de datos. No se prometen chats cifrados de extremo a extremo. No publiques claves privilegiadas. Revisa costes y límites de Supabase según uso.

## Limitaciones de esta primera versión

- No tiene recuperación integrada de contraseña ni gestión completa de cuenta.
- No tiene todavía eliminación de amistad ni bloqueos.
- Los grupos públicos no tienen invitaciones privadas ni administradores delegados.
- La interfaz lee los primeros 200 perfiles y 100 grupos; se necesitará paginación real.
- Para un futuro lanzamiento, añadir rate limiting, CAPTCHA si corresponde, presencia en línea, moderación y pruebas automáticas de políticas RLS.

## Integración y vista previa

El nuevo módulo `js/social-hub.js` se monta y desmonta desde `js/app.js` cuando se entra o sale de la ruta `#social`. Su CSS está aislado en `css/social-hub.css`. La mascota usa el asset existente. Los botones de acceso apuntan al hub real y `social.html` redirige a la ruta integrada.

**Pruebas pendientes antes de publicar:** crear dos usuarios reales, confirmar los correos, probar amistad, chat en ambas direcciones, creación y participación en grupos, permisos RLS para terceros y adaptación móvil. Faltan moderación efectiva y límites de spam. Las capturas son maquetas visuales con perfiles ficticios, no evidencias de conversaciones reales.
