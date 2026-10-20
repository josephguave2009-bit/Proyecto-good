import { getLiveClient, safe, initials, editionMatches, emptyHint } from "./live-core.js";
import { relationshipFor, openPlayerProfile } from "./player-profile.js";

export function livePlayersView() {
  return `<section class="section-wrap lp-page" id="live-players">
    <div class="lp-intro">
      <div><p class="eyebrow">SPAWNLY · JUGADORES REALES</p>
        <h1>Encuentra a tu <span>gente.</span></h1>
        <p>Conoce jugadores de Minecraft que ya se registraron en Spawnly. Entra a sus perfiles y envía solicitudes de amistad reales.</p>
      </div>
      <img src="assets/spawny/spawny.png" alt="Spawny te da la bienvenida" width="125" height="154">
    </div>
    <div class="lp-search-panel">
      <label for="lp-search">Buscar por apodo
        <input id="lp-search" type="search" maxlength="80" placeholder="Busca jugadores registrados…">
      </label>
      <label for="lp-edition">Edición de Minecraft
        <select id="lp-edition"><option>Todas</option><option>Java</option><option>Bedrock</option><option>Ambas</option></select>
      </label>
      <button type="button" class="lp-refresh" id="lp-refresh">↻ Actualizar</button>
    </div>
    <p class="lp-status" id="lp-status" role="status" aria-live="polite">Buscando jugadores registrados…</p>
    <div class="lp-login-notice" id="lp-login-notice" hidden>
      <strong>Tu próximo compañero de aventuras te espera</strong>
      <p>Inicia sesión para descubrir perfiles reales y agregar amigos.</p>
      <a class="btn btn-primary" href="#social">Iniciar sesión o crear cuenta →</a>
    </div>
    <div class="lp-player-grid" id="lp-player-list"></div>
    <div class="lp-bottom-cta"><img src="assets/spawny/spawny.png" alt="" width="64" height="76">
      <p>¿Ya tienes un nuevo amigo? Acepta las solicitudes y chatea en <a href="#social">Amigos y chat →</a></p></div>
  </section>`;
}

export function mountLivePlayers() {
  const root = document.querySelector("#live-players");
  if (!root) return () => {};
  let active = true, db, user = null, profiles = [], requests = [], timer, subscription, loading = false;
  const get = selector => root.querySelector(selector);
  const status = message => { if (active) get("#lp-status").textContent = message; };
  function render() {
    if (!active) return;
    get("#lp-login-notice").hidden = !!user;
    if (!user) { get("#lp-player-list").replaceChildren(); return; }
    const query = get("#lp-search").value.trim().toLocaleLowerCase();
    const edition = get("#lp-edition").value;
    const filtered = profiles.filter(p => p.id !== user.id &&
      editionMatches(edition, p.edition) &&
      (p.username + " " + (p.bio || "")).toLocaleLowerCase().includes(query)
    );
    get("#lp-player-list").innerHTML = filtered.length ? filtered.map(p => {
      const relation = relationshipFor(requests, user.id, p.id);
      const kind = {
        friends: "✓ Ya son amigos",
        incoming: "✦ Solicitud recibida",
        outgoing: "⏳ Solicitud enviada",
        rejected: "Solicitud rechazada",
        none: "+ Añadir amigo"
      }[relation.kind] || "+ Añadir amigo";
      return `<article class="lp-player-card">
        <div class="lp-player-top"><div class="lp-player-avatar" aria-hidden="true">${safe(initials(p.username))}</div>
          <span class="lp-edition-tag">🎮 ${safe(p.edition)}</span></div>
        <h2><button type="button" data-lp-open="${safe(p.id)}" class="lp-player-name" aria-label="Ver perfil de ${safe(p.username)}">${safe(p.username)}</button></h2>
        <p class="lp-player-bio">${safe(p.bio || "Todavía no ha escrito una biografía.")}</p>
        <div class="lp-player-actions">
          <button type="button" class="btn btn-primary" data-lp-open="${safe(p.id)}">${safe(kind)} →</button>
        </div>
      </article>`;
    }).join("") : emptyHint("Sin resultados por ahora", "Prueba otro nombre o edición. Los perfiles aparecen cuando las personas se registran.");
    status("Jugadores encontrados: " + filtered.length);
  }
  async function load() {
    if (!active || !db || loading) return;
    loading = true;
    try {
      const auth = await db.auth.getUser();
      if (!active) return;
      user = auth.error ? null : auth.data.user;
      if (!user) {
        profiles = []; requests = [];
        render(); status("Inicia sesión para explorar los perfiles.");
        return;
      }
      const [p, r] = await Promise.all([
        db.from("profiles").select("id,username,edition,bio").order("created_at",{ascending:false}).limit(200),
        db.from("friend_requests").select("id,sender_id,receiver_id,status")
      ]);
      if (!active) return;
      if (p.error || r.error) throw p.error || r.error;
      profiles = p.data || [];
      requests = r.data || [];
      render();
    } catch (error) { status("No se pudieron cargar los jugadores: " + (error.message || "error de conexión")); }
    finally { loading = false; }
  }
  async function click(event) {
    const target = event.target.closest("[data-lp-open]");
    if (target && root.contains(target) && db) {
      await openPlayerProfile({ db, playerId: target.dataset.lpOpen, onFriendsChanged: load });
      return;
    }
    if (event.target.closest("#lp-refresh")) await load();
  }
  root.addEventListener("click", click);
  get("#lp-search").addEventListener("input", render);
  get("#lp-edition").addEventListener("change", render);
  (async () => {
    try {
      db = await getLiveClient(); if (!active) return;
      await load(); if (!active) return;
      subscription = db.auth.onAuthStateChange(() => {
        if (active) queueMicrotask(() => { if (active) load(); });
      }).data.subscription;
      timer = setInterval(() => { if (active) load(); }, 12000);
    } catch (error) { status("No fue posible conectar con Supabase. Inténtalo de nuevo."); }
  })();
  return () => {
    active = false;
    clearInterval(timer);
    subscription?.unsubscribe();
    root.removeEventListener("click", click);
    get("#lp-search").removeEventListener("input", render);
    get("#lp-edition").removeEventListener("change", render);
  };
}
