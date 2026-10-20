import { getLiveClient, safe, initials, emptyHint } from "./live-core.js";
import { openPlayerProfile } from "./player-profile.js";

export function liveGroupsView() {
  return `<section class="section-wrap lg-page" id="live-groups">
    <header class="lg-intro">
      <div><p class="eyebrow">SPAWNLY · GRUPOS REALES</p>
      <h1>Un equipo. <span>Infinitas aventuras.</span></h1>
      <p>Crea grupos de Minecraft, únete a otros jugadores y conversa con tu equipo. Todos verán los mismos grupos desde cualquier cuenta.</p></div>
      <img src="assets/spawny/spawny.png" width="130" height="155" alt="Spawny animando a tu equipo">
    </header>
    <p class="lg-status" id="lg-status" role="status" aria-live="polite">Buscando equipos registrados…</p>
    <div id="lg-login" class="lp-login-notice" hidden>
      <h2>La aventura empieza cuando inicias sesión</h2>
      <p>Entra a Spawnly para descubrir equipos reales, crear grupos y participar en sus chats.</p>
      <a href="#social" class="btn btn-primary">Iniciar sesión o registrarme →</a>
    </div>
    <div class="lg-layout">
      <div class="lg-main">
        <div class="lg-controls">
          <label>Buscar grupo<input id="lg-search" type="search" placeholder="Survival, Bedrock, amigos…" maxlength="80"></label>
          <label>Mostrar<select id="lg-filter"><option value="all">Todos los grupos</option><option value="mine">Mis grupos</option></select></label>
          <button id="lg-refresh" type="button" class="lp-refresh">↻ Actualizar</button>
        </div>
        <section id="lg-chat-panel" class="lg-chat-panel" hidden aria-label="Chat del grupo">
          <div class="lg-chat-top"><button type="button" data-lg-back class="lg-back">← Volver</button>
            <div><h2 id="lg-chat-title">Chat de equipo</h2><p>Conversación compartida con los miembros del grupo</p></div>
          </div>
          <div id="lg-chat-messages" class="lg-chat-messages" role="log" aria-label="Mensajes del grupo" aria-live="polite"></div>
          <form id="lg-chat-form" class="lg-chat-form"><label class="lp-visually-hidden" for="lg-message">Mensaje</label>
            <input id="lg-message" maxlength="1000" required autocomplete="off" placeholder="Escribe a tu equipo…">
            <button type="submit" class="btn btn-primary">Enviar ➤</button>
          </form>
        </section>
        <div id="lg-results" class="lg-cards"></div>
      </div>
      <aside class="lg-aside">
        <div class="lg-create-box">
          <span class="lg-small-title">✦ TU PRÓXIMO EQUIPO</span>
          <h2>Crear un grupo</h2>
          <p>Invita a jugadores a compartir una aventura.</p>
          <form id="lg-create-form" hidden>
            <label>Nombre del grupo<input name="name" minlength="3" maxlength="60" required placeholder="Aventureros del Overworld"></label>
            <label>Descripción<textarea name="description" maxlength="300" rows="3" placeholder="¿Qué van a jugar?"></textarea></label>
            <button type="submit" class="btn btn-primary">+ Crear grupo</button>
          </form>
          <p class="lg-privacy">No compartas contraseñas ni información personal.</p>
        </div>
        <div class="lg-tip"><img src="assets/spawny/spawny.png" alt="" width="58" height="67">
          <p>Juega acompañado, respeta a los demás y haz nuevos amigos.</p></div>
      </aside>
    </div>
  </section>`;
}

export function mountLiveGroups() {
  const root = document.querySelector("#live-groups");
  if (!root) return () => {};
  let active = true, db, user = null, groups = [], members = [], profiles = [], selectedGroup = null;
  let authSubscription, timer, loading = false, messageLoading = false, working = false;
  const get = selector => root.querySelector(selector);
  const status = text => { if (active) get("#lg-status").textContent = text; };
  const nameOf = id => profiles.find(p => p.id === id)?.username || "Jugador";
  const isMember = groupId => members.some(m => m.group_id === groupId && m.user_id === user?.id);
  function render() {
    if (!active) return;
    const logged = !!user;
    get("#lg-login").hidden = logged;
    get("#lg-create-form").hidden = !logged;
    if (!logged) { get("#lg-results").replaceChildren(); get("#lg-chat-panel").hidden = true; return; }
    const term = get("#lg-search").value.trim().toLocaleLowerCase();
    const onlyMine = get("#lg-filter").value === "mine";
    const results = groups.filter(g =>
      (!onlyMine || isMember(g.id)) &&
      (g.name + " " + (g.description || "")).toLocaleLowerCase().includes(term)
    );
    get("#lg-results").innerHTML = results.length ? results.map((g, i) => {
      const joined = isMember(g.id);
      const memberList = members.filter(m => m.group_id === g.id).slice(0,6);
      const count = members.filter(m => m.group_id === g.id).length;
      const owner = g.owner_id === user.id;
      return `<article class="lg-card">
        <div class="lg-card-banner lg-cover-${i % 4}"><span>🎮 ${safe(joined ? "MI EQUIPO" : "GRUPO ABIERTO")}</span><b>${safe(g.name.slice(0, 1).toUpperCase())}</b></div>
        <div class="lg-card-body">
          <div class="lg-card-heading"><h2>${safe(g.name)}</h2><span>${count} ${count === 1 ? "miembro" : "miembros"}</span></div>
          <p>${safe(g.description || "Un lugar para vivir nuevas aventuras de Minecraft.")}</p>
          <p class="lg-owner">Creado por <button type="button" data-lg-profile="${safe(g.owner_id)}">${safe(nameOf(g.owner_id))}</button>${owner ? " · Tú" : ""}</p>
          <div class="lg-member-line">${memberList.map(m => `<button type="button" class="lg-member-avatar" data-lg-profile="${safe(m.user_id)}" title="Ver perfil de ${safe(nameOf(m.user_id))}" aria-label="Ver perfil de ${safe(nameOf(m.user_id))}">${safe(initials(nameOf(m.user_id)))}</button>`).join("")}<small>${count ? "Ver sus perfiles" : "¡Sé el primero en entrar!"}</small></div>
          <div class="lg-card-actions">
            ${joined ? `<button type="button" class="btn btn-primary" data-lg-chat="${safe(g.id)}">💬 Abrir chat</button><button type="button" class="btn btn-secondary" data-lg-leave="${safe(g.id)}">Salir</button>`
              : `<button type="button" class="btn btn-primary" data-lg-join="${safe(g.id)}">+ Unirme al grupo</button>`}
          </div>
        </div>
      </article>`;
    }).join("") : emptyHint("Aún no hay grupos con esos filtros", "Prueba otra búsqueda o crea tu equipo en el formulario.");
    if (!selectedGroup) get("#lg-chat-panel").hidden = true;
    status("Grupos encontrados: " + results.length);
  }
  async function load() {
    if (!active || !db || loading) return;
    loading = true;
    try {
      const { data: auth, error: authError } = await db.auth.getUser();
      if (!active) return;
      user = authError ? null : auth.user;
      if (!user) { groups=[]; members=[]; profiles=[]; selectedGroup=null; render(); status("Inicia sesión para encontrar equipos."); return; }
      const responses = await Promise.all([
        db.from("game_groups").select("id,name,description,owner_id,created_at").order("created_at",{ascending:false}).limit(150),
        db.from("group_members").select("group_id,user_id").limit(3000),
        db.from("profiles").select("id,username").limit(250)
      ]);
      if (!active) return;
      for (const r of responses) if (r.error) throw r.error;
      [groups,members,profiles] = responses.map(r => r.data || []);
      if (selectedGroup && (!groups.some(g => g.id === selectedGroup.id) || !isMember(selectedGroup.id))) selectedGroup = null;
      render();
      if (selectedGroup) await loadMessages({ quiet:true });
    } catch (error) { status("No pudimos cargar los grupos: " + (error.message || "error de red")); }
    finally { loading = false; }
  }
  async function loadMessages({ quiet = false } = {}) {
    if (!active || !db || !selectedGroup || messageLoading) return;
    const selected = selectedGroup;
    messageLoading = true;
    try {
      const { data, error } = await db.from("group_messages")
        .select("id,sender_id,body,created_at").eq("group_id",selected.id)
        .order("created_at",{ascending:false}).limit(80);
      if (!active || selected !== selectedGroup) return;
      if (error) throw error;
      const messages = (data || []).slice().reverse();
      const output = get("#lg-chat-messages");
      if (!output) return;
      const wasNearBottom = output.scrollHeight - output.scrollTop - output.clientHeight < 90;
      output.innerHTML = messages.length ? messages.map(m => `
        <div class="lg-bubble ${m.sender_id===user?.id ? "lg-bubble-me" : ""}">
          <button type="button" data-lg-profile="${safe(m.sender_id)}" aria-label="Ver perfil de ${safe(nameOf(m.sender_id))}">${safe(nameOf(m.sender_id))}</button>
          <p>${safe(m.body)}</p><small>${safe(new Date(m.created_at).toLocaleString("es-EC"))}</small>
        </div>`).join("") : '<p class="lg-chat-empty">Aún no hay mensajes. ¡Rompe el hielo y saluda!</p>';
      if (wasNearBottom || !quiet) output.scrollTop = output.scrollHeight;
    } catch (error) { status("No se pudieron cargar los mensajes del grupo: " + error.message); }
    finally { messageLoading = false; }
  }
  async function chat(id) {
    const group = groups.find(g => g.id === id);
    if (!group || !isMember(id)) { status("Debes ser miembro para abrir el chat."); return; }
    selectedGroup = group;
    get("#lg-chat-panel").hidden = false;
    get("#lg-chat-title").textContent = "✦ " + group.name;
    get("#lg-chat-messages").innerHTML = '<p class="lg-chat-empty">Cargando conversación…</p>';
    await loadMessages();
    if (!active) return;
    get("#lg-chat-panel").scrollIntoView({ behavior:"smooth",block:"start" });
  }
  async function run(operation, fn) {
    if (working || !user || !db) return;
    working = true;
    try { await fn(); }
    catch (error) { status("No pudimos " + operation + ": " + (error.message || "error de conexión")); }
    finally { working = false; }
  }
  async function click(event) {
    const node = event.target.closest("button");
    if (!node || !root.contains(node)) return;
    if (node.id === "lg-refresh") { await load(); return; }
    if (node.dataset.lgProfile) {
      if (db) await openPlayerProfile({db,playerId:node.dataset.lgProfile,onFriendsChanged:load});
      return;
    }
    if (node.hasAttribute("data-lg-back")) { selectedGroup=null;get("#lg-chat-panel").hidden=true;return; }
    if (node.dataset.lgChat) { await chat(node.dataset.lgChat);return; }
    if (node.dataset.lgJoin) await run("unirte al grupo",async()=>{
      const {error}=await db.from("group_members").insert({group_id:node.dataset.lgJoin,user_id:user.id});
      if(error)throw error;
      await load();status("¡Ya formas parte de ese grupo! Abre su chat para hablar con el equipo.");
    });
    if (node.dataset.lgLeave) await run("salir del grupo",async()=>{
      if(!confirm("¿Quieres salir de este grupo? Podrás volver cuando quieras."))return;
      const {error}=await db.from("group_members").delete().eq("group_id",node.dataset.lgLeave).eq("user_id",user.id);
      if(error)throw error;
      if(selectedGroup?.id===node.dataset.lgLeave)selectedGroup=null;
      await load();status("Has salido del grupo.");
    });
  }
  async function submit(event) {
    const form=event.target;
    if(form.id!=="lg-create-form" && form.id!=="lg-chat-form")return;
    event.preventDefault();
    if(!form.reportValidity())return;
    if(form.id==="lg-create-form")await run("crear el grupo",async()=>{
      const fd=new FormData(form),name=String(fd.get("name")||"").trim(),description=String(fd.get("description")||"").trim();
      if(name.length<3||name.length>60||description.length>300)throw Error("Revisa el nombre y la descripción.");
      const result=await db.from("game_groups").insert({owner_id:user.id,name,description}).select("id").single();
      if(result.error)throw result.error;
      const membership=await db.from("group_members").insert({group_id:result.data.id,user_id:user.id});
      if(membership.error)throw Error("Grupo creado, pero debes entrar desde la lista: "+membership.error.message);
      form.reset();await load();status("¡Grupo creado! Ya puedes chatear e invitar a otros jugadores.");
    });
    if(form.id==="lg-chat-form")await run("enviar el mensaje",async()=>{
      if(!selectedGroup||!isMember(selectedGroup.id))throw Error("Debes formar parte de este grupo.");
      const input=get("#lg-message"),body=input.value.trim();
      if(!body||body.length>1000)throw Error("Escribe un mensaje de 1 a 1000 caracteres.");
      const {error}=await db.from("group_messages").insert({group_id:selectedGroup.id,sender_id:user.id,body});
      if(error)throw error;
      input.value="";await loadMessages();status("Mensaje enviado al equipo.");
    });
  }
  root.addEventListener("click",click);
  root.addEventListener("submit",submit);
  get("#lg-search").addEventListener("input",render);
  get("#lg-filter").addEventListener("change",render);
  (async()=>{
    try{
      db=await getLiveClient();if(!active)return;
      await load();if(!active)return;
      authSubscription=db.auth.onAuthStateChange(()=>{if(active)queueMicrotask(()=>{if(active)load();});}).data.subscription;
      timer=setInterval(()=>{if(active)load();},12000);
    }catch(error){status("No fue posible conectar con Supabase. Intenta actualizar.");}
  })();
  return ()=>{
    active=false;clearInterval(timer);authSubscription?.unsubscribe();
    root.removeEventListener("click",click);root.removeEventListener("submit",submit);
    get("#lg-search").removeEventListener("input",render);get("#lg-filter").removeEventListener("change",render);
  };
}
