import { getLiveClient, safe, initials, emptyHint, prettyDate } from "./live-core.js";
import { openPlayerProfile } from "./player-profile.js";

export function mountLiveHome() {
  const root = document.querySelector("#main-content");
  if (!root?.querySelector("#home-player-results")) return () => {};
  let active = true, db, user = null, subscription, timer, loading = false;
  const get = selector => root.querySelector(selector);
  const placeholder = (title, subtitle, link, label) =>
    `<div class="lp-home-placeholder"><strong>${safe(title)}</strong><p>${safe(subtitle)}</p>
      <a href="${safe(link)}" class="btn btn-primary">${safe(label)} →</a></div>`;
  async function refresh() {
    if (!active || !db || loading) return;
    loading = true;
    try {
      const auth = await db.auth.getUser();
      if (!active) return;
      user = auth.error ? null : auth.data.user;
      const requests = [
        db.from("community_posts")
          .select("id,author_id,title,description,edition,mode,created_at")
          .order("created_at", { ascending:false }).limit(2)
      ];
      if (user) {
        requests.push(db.from("profiles")
          .select("id,username,edition,bio").order("created_at",{ascending:false}).limit(50));
        requests.push(db.from("game_groups")
          .select("id,name,description,owner_id").order("created_at",{ascending:false}).limit(3));
        requests.push(db.from("group_members").select("group_id,user_id").limit(1000));
      }
      const outputs = await Promise.all(requests);
      if (!active) return;
      const [postsResult, profilesResult, groupsResult, membersResult] = outputs;
      if (postsResult.error) throw postsResult.error;
      const posts = postsResult.data || [];
      const profiles = profilesResult && !profilesResult.error ? profilesResult.data || [] : [];
      const groups = groupsResult && !groupsResult.error ? groupsResult.data || [] : [];
      const members = membersResult && !membersResult.error ? membersResult.data || [] : [];
      const nameOf = id => profiles.find(p=>p.id===id)?.username || "Jugador de Spawnly";
      const otherPlayers = profiles.filter(p=>p.id!==user?.id).slice(0,4);

      get(".tiny-avatars").innerHTML = otherPlayers.length
        ? otherPlayers.map((p,i) => `<span style="--av:${["#427b68","#436591","#8765a1","#67947b"][i%4]}">${safe(initials(p.username))}</span>`).join("")
        : '<span class="lp-home-avatar-empty">✦</span>';

      get("#home-player-results").innerHTML = !user
        ? placeholder("Jugadores reales, amistades reales", "Inicia sesión para descubrir a quienes ya juegan en Spawnly.", "#social", "Entrar o registrarme")
        : otherPlayers.length
        ? otherPlayers.map(p=>`<article class="lp-home-player-card">
          <span class="lp-player-avatar" aria-hidden="true">${safe(initials(p.username))}</span>
          <h3>${safe(p.username)}</h3><span class="lp-edition-tag">${safe(p.edition)}</span>
          <p>${safe(p.bio || "¡Buscando compañeros de aventura!")}</p>
          <button type="button" data-lh-profile="${safe(p.id)}">Ver perfil y añadir amigo →</button>
        </article>`).join("")
        : placeholder("Invita a un amigo", "Aún no hay otros usuarios para mostrarte. Comparte Spawnly y crea el primer equipo.", "#jugadores", "Explorar jugadores");
      get("#home-group-results").innerHTML = !user
        ? placeholder("Los equipos te esperan", "Entra a tu cuenta para descubrir grupos creados por jugadores reales.", "#social", "Iniciar sesión")
        : groups.length
        ? groups.map((g,i)=>{
          const count = members.filter(m=>m.group_id===g.id).length;
          return `<article class="lp-home-group">
            <div class="lp-home-group-art lg-cover-${i%4}"><span>✦ SPAWNLY TEAMS</span><b>${safe(initials(g.name))}</b></div>
            <div class="lp-home-group-body"><h3>${safe(g.name)}</h3>
              <p>${safe(g.description || "Un equipo listo para la siguiente aventura.")}</p>
              <small>${count} ${count===1?"miembro":"miembros"}</small>
              <a href="#grupos" class="btn btn-secondary">Unirse o abrir chat →</a>
            </div>
          </article>`;
        }).join("")
        : placeholder("Crea un grupo con tus amigos", "Todavía no hay grupos registrados.", "#grupos", "Crear grupo");

      get("#home-post-results").innerHTML = posts.length
        ? posts.map(p=>`<article class="lp-home-post">
          <span class="lp-edition-tag">${safe(p.edition)} · ${safe(p.mode)}</span>
          <h3>${safe(p.title)}</h3><p>${safe(p.description)}</p>
          <div><small>${safe(nameOf(p.author_id))} · ${safe(prettyDate(p.created_at))}</small>
            <a href="#comunidad" class="btn btn-secondary">Ver y comentar →</a></div>
        </article>`).join("")
        : placeholder("Sé quien inicie la conversación", "Todavía no hay publicaciones reales. ¡Abre Comunidad y publica la primera!", "#comunidad", "Abrir Comunidad");
    } catch (error) {
      if (!active) return;
      const note = placeholder("No se pudieron cargar los datos reales",
        "Comprueba tu conexión e inténtalo otra vez.", "#social", "Ver mi cuenta");
      for (const selector of ["#home-player-results","#home-group-results","#home-post-results"]) get(selector).innerHTML = note;
    } finally { loading = false; }
  }
  function click(event) {
    const btn=event.target.closest("[data-lh-profile]");
    if (!btn || !root.contains(btn) || !db) return;
    openPlayerProfile({db,playerId:btn.dataset.lhProfile,onFriendsChanged:refresh});
  }
  root.addEventListener("click",click);
  (async()=>{
    try {
      db=await getLiveClient();
      if(!active)return;
      await refresh();
      if(!active)return;
      subscription=db.auth.onAuthStateChange(()=>{if(active)queueMicrotask(()=>{if(active)refresh();});}).data.subscription;
      timer=setInterval(()=>{if(active)refresh();},25000);
    }catch(error){
      if(active)get("#home-player-results").innerHTML=placeholder("Spawnly no pudo conectar", "Actualiza la página para intentarlo otra vez.", "#jugadores", "Explorar jugadores");
    }
  })();
  return ()=>{active=false;clearInterval(timer);subscription?.unsubscribe();root.removeEventListener("click",click);};
}
