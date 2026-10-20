import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./social-config.js";
import { openPlayerProfile } from "./player-profile.js";

let clientPromise;
const connect = () => {
  if (!clientPromise) {
    clientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
      .catch((error) => { clientPromise = null; throw error; });
  }
  return clientPromise;
};

export function socialHubView() {
  return [
    "<section class='section-wrap sh-page' id='social-hub'>",
    " <div class='sh-intro'><div><p class='eyebrow'>SPAWNLY SOCIAL · CONEXIONES REALES</p><h1>Las mejores aventuras <span>se viven juntos.</span></h1><p>Descubre jugadores, añade amigos y habla con tu equipo sin salir de Spawnly.</p></div>",
    " <div class='sh-intro-mascot'><img src='assets/spawny/spawny.png' alt='Spawny te da la bienvenida' width='115' height='145'><span>¡Tu equipo te espera!</span></div></div>",
    " <p id='sh-status' class='sh-status' role='status' aria-live='polite'>Conectando con la comunidad…</p>",
    " <div id='sh-auth' class='sh-auth sh-hidden'><div class='sh-auth-copy'><span class='sh-chip'>✦ TU PUNTO DE ENCUENTRO</span><h2>Un pequeño hola.<br><span>Una gran aventura.</span></h2><p>Crea una cuenta gratuita para hablar con jugadores reales, encontrar amigos y empezar tu propio grupo.</p><div class='sh-auth-points'><span>✧ Perfiles y amistades reales</span><span>✧ Chats privados</span><span>✧ Grupos para tu equipo</span></div></div>",
    " <form id='sh-auth-form' class='sh-panel sh-auth-form'><h2 id='sh-auth-title'>Bienvenido de nuevo</h2><p class='sh-muted' id='sh-auth-subtitle'>Entra con tu correo y contraseña.</p>",
    " <label>Correo electrónico<input id='sh-email' type='email' required maxlength='254' autocomplete='email' placeholder='tu@correo.com'></label>",
    " <label>Contraseña<input id='sh-password' type='password' required minlength='8' maxlength='72' autocomplete='current-password' placeholder='Mínimo 8 caracteres'></label>",
    " <button type='submit' class='sh-primary' id='sh-auth-submit'>Iniciar sesión →</button>",
    " <p class='sh-switch'><span id='sh-auth-switch-text'>¿No tienes cuenta?</span> <button type='button' class='sh-text-button' data-sh='switch-auth'>Regístrate aquí</button></p>",
    " <p class='sh-note'>Cuida tu privacidad: no compartas contraseñas ni datos personales con otros jugadores. Puede ser necesario confirmar tu correo.</p></form></div>",
    " <div id='sh-workspace' class='sh-hidden'>",
    "  <div class='sh-toolbar'><div><span class='sh-chip'>● COMUNIDAD EN LÍNEA</span><strong id='sh-greeting'>Tu rincón de aventuras</strong></div><button type='button' class='sh-quiet' data-sh='logout'>Cerrar sesión ↗</button></div>",
    "  <div class='sh-layout'>",
    "   <aside class='sh-sidebar'>",
    "    <div class='sh-panel'><div class='sh-panel-title'><h2>Mis amigos</h2><span id='sh-friend-count' class='sh-counter'>0</span></div><div id='sh-friends'></div></div>",
    "    <div class='sh-panel'><div class='sh-panel-title'><h2>Solicitudes</h2><span id='sh-request-count' class='sh-counter'>0</span></div><div id='sh-requests'></div></div>",
    "    <div class='sh-panel'><div class='sh-panel-title'><h2>Mis grupos</h2><span class='sh-spark'>✦</span></div><div id='sh-my-groups'></div></div>",
    "    <div class='sh-side-safety'><span>🛡</span><div><strong>Juega con confianza</strong><p>Respeta a los demás. Nunca compartas datos privados.</p></div></div>",
    "   </aside>",
    "   <div class='sh-center'>",
    "    <div class='sh-panel sh-discover' id='sh-discover'><div class='sh-panel-title sh-search-head'><div><p class='eyebrow'>TU PRÓXIMO COMPAÑERO</p><h2>Descubre jugadores</h2></div><span class='sh-pill'>JAVA + BEDROCK</span></div>",
    "    <label class='sh-search'>⌕ <input type='search' id='sh-search' placeholder='Busca por nombre de usuario…' aria-label='Buscar jugadores'></label><div id='sh-players' class='sh-player-list'></div></div>",
    "    <section class='sh-panel sh-chat sh-hidden' id='sh-chat'><header class='sh-chat-head'><button type='button' class='sh-back' data-sh='back-chat' aria-label='Volver a explorar'>←</button><div class='sh-mini-avatar'>✦</div><div><h2 id='sh-chat-title'>Conversación</h2><p>Un espacio para compartir aventuras</p></div></header>",
    "      <div class='sh-messages' id='sh-messages' role='log' aria-live='polite' aria-label='Mensajes'></div>",
    "      <form id='sh-message-form' class='sh-compose'><input id='sh-message' maxlength='1000' autocomplete='off' required placeholder='Escribe tu mensaje…' aria-label='Escribir mensaje'><button class='sh-primary' type='submit'>Enviar ➤</button></form>",
    "    </section>",
    "    <div class='sh-tip'><img src='assets/spawny/spawny.png' alt='' width='72' height='85'><div><strong>Spawny dice:</strong><p>Una amistad nueva puede cambiar toda tu partida. ¡Anímate a saludar!</p></div></div>",
    "   </div>",
    "   <aside class='sh-extras'>",
    "    <div class='sh-panel'><div class='sh-panel-title'><h2>Mi perfil</h2><span class='sh-spark'>✎</span></div>",
    "      <form id='sh-profile-form' class='sh-form'><label>Mi apodo<input id='sh-username' minlength='3' maxlength='24' pattern='[a-zA-Z0-9_]+' required></label>",
    "        <label>Juego en<select id='sh-edition'><option>Java</option><option>Bedrock</option><option>Ambas</option></select></label>",
    "        <label>Sobre mí<input id='sh-bio' maxlength='240' placeholder='Me encanta el Survival…'></label><button class='sh-primary' type='submit'>Guardar perfil</button>",
    "      </form></div>",
    "    <div class='sh-panel'><div class='sh-panel-title'><h2>Crear un grupo</h2><span class='sh-spark'>⊞</span></div><form id='sh-group-form' class='sh-form'><label>Nombre<input id='sh-group-name' required minlength='3' maxlength='60' placeholder='Aventureros del Overworld'></label><label>Descripción<input id='sh-group-desc' maxlength='300' placeholder='¿A qué van a jugar?'></label><button class='sh-primary' type='submit'>+ Crear grupo</button></form></div>",
    "    <div class='sh-panel'><div class='sh-panel-title'><h2>Explorar grupos</h2></div><div id='sh-groups'></div></div>",
    "   </aside>",
    "  </div>",
    " </div>",
    "</section>"
  ].join("");
}

export function mountSocialHub() {
  const root = document.querySelector("#social-hub");
  if (!root) return () => {};
  const find = (id) => root.querySelector("#" + id);
  const view = { active: true, db: null, user: null, profiles: [], requests: [], groups: [], members: [], selected: null, timer: null, channel: null, subscription: null, signup: false, loading: false, generation: 0 };
  const el = (tag, text = "", className = "") => {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
  };
  const setStatus = (msg = "") => { if (view.active) find("sh-status").textContent = msg; };
  const guard = (response) => { if (response?.error) throw response.error; return response?.data; };
  const currentId = () => view.user?.id;
  const nameOf = (id) => view.profiles.find((p) => p.id === id)?.username || "Jugador";
  const friendIds = () => new Set(view.requests.filter((r) => r.status === "accepted").map((r) => r.sender_id === currentId() ? r.receiver_id : r.sender_id));
  const action = (label, fn, kind = "") => {
    const btn = el("button", label, "sh-action " + kind);
    btn.type = "button"; btn.addEventListener("click", fn);
    return btn;
  };
  const list = (id, rows, message) => {
    const node = find(id);
    if (!node) return;
    node.replaceChildren(...(rows.length ? rows : [el("p", message, "sh-empty")]));
  };
  const makeAvatar = (label) => {
    const avatar = el("span", String(label || "J").slice(0, 2).toUpperCase(), "sh-avatar");
    avatar.setAttribute("aria-hidden", "true");
    return avatar;
  };
  const item = (title, desc, buttons = [], profileId = null) => {
    const row = el("div", "", "sh-list-row");
    row.append(makeAvatar(title));
    const words = el("div", "", "sh-list-copy");
    if (profileId) {
      const profileButton = el("button", title, "sh-profile-name");
      profileButton.type = "button";
      profileButton.setAttribute("aria-label", "Ver perfil de " + title);
      profileButton.addEventListener("click", () => {
        if (view.db) openPlayerProfile({
          db: view.db,
          playerId: profileId,
          onFriendsChanged: () => loadData()
        });
      });
      words.append(profileButton, el("small", desc));
    } else {
      words.append(el("strong", title), el("small", desc));
    }
    row.append(words);
    if (buttons.length) {
      const buttonsBox = el("div", "", "sh-row-actions");
      buttons.forEach(([name, fn, kind]) => buttonsBox.append(action(name, fn, kind)));
      row.append(buttonsBox);
    }
    return row;
  };
  function showAuth() {
    find("sh-auth").classList.toggle("sh-hidden", !!view.user);
    find("sh-workspace").classList.toggle("sh-hidden", !view.user);
    if (view.user) {
      const profile = view.profiles.find((p) => p.id === currentId());
      find("sh-greeting").textContent = profile ? "¡Hola, " + profile.username + "!" : "¡Hola, aventurero!";
    }
  }
  function renderAll() {
    if (!view.active || !view.user) return;
    const myId = currentId(), friends = friendIds();
    const search = find("sh-search").value.trim().toLowerCase();
    const incoming = view.requests.filter((r) => r.receiver_id === myId && r.status === "pending");
    find("sh-friend-count").textContent = String(friends.size);
    find("sh-request-count").textContent = String(incoming.length);

    list("sh-friends", view.profiles.filter((p) => friends.has(p.id)).map((p) =>
      item(p.username, "✓ Amigo · " + p.edition, [["Chatear", () => openChat("direct", p.id, p.username), "sh-accent"]], p.id)
    ), "Todavía no tienes amigos. ¡Explora jugadores!");

    list("sh-requests", [
      ...incoming.map((r) => item(nameOf(r.sender_id), "Quiere ser tu amigo", [
        ["Aceptar", () => respond(r.id, "accepted"), "sh-accent"], ["No", () => respond(r.id, "rejected")]
      ], r.sender_id)),
      ...view.requests.filter((r) => r.sender_id === myId && r.status === "pending")
        .map((r) => item(nameOf(r.receiver_id), "Solicitud enviada", [], r.receiver_id))
    ], "No hay solicitudes pendientes.");

    const matches = view.profiles.filter((p) => p.id !== myId && p.username.toLowerCase().includes(search));
    list("sh-players", matches.map((p) => {
      const waiting = view.requests.some((r) => r.sender_id === myId && r.receiver_id === p.id && r.status === "pending");
      const incomingRequest = incoming.find((r) => r.sender_id === p.id);
      let buttons = [];
      if (friends.has(p.id)) buttons = [["Abrir chat", () => openChat("direct", p.id, p.username), "sh-accent"]];
      else if (incomingRequest) buttons = [["Aceptar", () => respond(incomingRequest.id, "accepted"), "sh-accent"]];
      else if (!waiting) buttons = [["+ Añadir", () => sendFriendRequest(p.id), "sh-accent"]];
      return item(p.username, p.edition + (p.bio ? " · " + p.bio : "") + (waiting ? " · Pendiente" : ""), buttons, p.id);
    }), search ? "No encontramos jugadores con ese nombre." : "Aún no hay otros jugadores registrados. Invita a un amigo.");

    const memberOf = (g) => view.members.some((m) => m.group_id === g.id && m.user_id === myId);
    const groupRow = (g, isMember) => item(g.name, (g.description || "Comunidad Minecraft") + " · " + view.members.filter((m) => m.group_id === g.id).length + " integrantes",
      isMember ? [["Chat", () => openChat("group", g.id, g.name), "sh-accent"], ["Salir", () => leaveGroup(g.id)]] : [["Unirme", () => joinGroup(g.id), "sh-accent"]]);
    list("sh-my-groups", view.groups.filter(memberOf).map((g) => groupRow(g, true)), "Todavía no formas parte de un grupo.");
    list("sh-groups", view.groups.filter((g) => !memberOf(g)).map((g) => groupRow(g, false)), "No hay otros grupos aún. ¡Crea el primero!");
    showAuth();
  }
  async function loadData() {
    if (!view.active || !view.user || view.loading) return;
    view.loading = true;
    const generation = view.generation;
    try {
      const [p, r, g, m] = await Promise.all([
        view.db.from("profiles").select("id,username,bio,edition").order("created_at", { ascending: false }).limit(200),
        view.db.from("friend_requests").select("id,sender_id,receiver_id,status"),
        view.db.from("game_groups").select("id,name,description,owner_id").order("created_at", { ascending: false }).limit(100),
        view.db.from("group_members").select("group_id,user_id")
      ]);
      if (!view.active || generation !== view.generation) return;
      view.profiles = guard(p) || [];
      view.requests = guard(r) || [];
      view.groups = guard(g) || [];
      view.members = guard(m) || [];
      renderAll();
      if (view.selected) await loadMessages();
    } catch (error) { setStatus("No se pudo actualizar la comunidad: " + error.message); }
    finally { view.loading = false; }
  }
  async function run(fn) {
    try { await fn(); } catch (error) { setStatus(error.message || "Algo salió mal. Vuelve a intentarlo."); }
  }
  async function sendFriendRequest(id) { await run(async () => {
    guard(await view.db.from("friend_requests").insert({ sender_id: currentId(), receiver_id: id }));
    setStatus("¡Solicitud de amistad enviada!");
    await loadData();
  }); }
  async function respond(id, status) { await run(async () => {
    guard(await view.db.from("friend_requests").update({ status }).eq("id", id));
    setStatus(status === "accepted" ? "¡Ya son amigos! Pueden hablar por chat." : "Solicitud rechazada.");
    await loadData();
  }); }
  async function joinGroup(id) { await run(async () => {
    guard(await view.db.from("group_members").insert({ group_id: id, user_id: currentId() }));
    setStatus("¡Te uniste al grupo!");
    await loadData();
  }); }
  async function leaveGroup(id) { await run(async () => {
    guard(await view.db.from("group_members").delete().eq("group_id", id).eq("user_id", currentId()));
    if (view.selected?.type === "group" && view.selected.id === id) backChat();
    setStatus("Has salido del grupo.");
    await loadData();
  }); }
  async function openChat(type, id, name) {
    view.selected = { type, id, name };
    find("sh-discover").classList.add("sh-hidden");
    find("sh-chat").classList.remove("sh-hidden");
    find("sh-chat-title").textContent = (type === "group" ? "✦ " : "✉ ") + name;
    find("sh-messages").replaceChildren(el("p", "Cargando conversación…", "sh-empty"));
    await loadMessages();
    if (view.active) find("sh-message").focus();
  }
  function backChat() {
    view.selected = null;
    find("sh-chat").classList.add("sh-hidden");
    find("sh-discover").classList.remove("sh-hidden");
  }
  async function loadMessages() {
    if (!view.active || !view.selected || !view.user) return;
    const selected = view.selected;
    try {
      let q = view.db.from(selected.type === "group" ? "group_messages" : "direct_messages")
        .select("id,sender_id,body,created_at").order("created_at", { ascending: false }).limit(80);
      if (selected.type === "group") q = q.eq("group_id", selected.id);
      else q = q.or("and(sender_id.eq." + currentId() + ",receiver_id.eq." + selected.id + "),and(sender_id.eq." + selected.id + ",receiver_id.eq." + currentId() + ")");
      const messages = (guard(await q) || []).reverse();
      if (!view.active || view.selected !== selected) return;
      const output = find("sh-messages");
      if (!messages.length) { output.replaceChildren(el("p", "Aún no hay mensajes. ¡Envía el primer hola!", "sh-empty")); return; }
      output.replaceChildren(...messages.map((m) => {
        const bubble = el("div", "", "sh-bubble" + (m.sender_id === currentId() ? " sh-me" : ""));
        bubble.append(el("small", nameOf(m.sender_id) + " · " + new Date(m.created_at).toLocaleString("es-EC")), el("p", m.body));
        return bubble;
      }));
      output.scrollTop = output.scrollHeight;
    } catch (error) { setStatus("No se pudieron cargar los mensajes: " + error.message); }
  }
  function setAuthMode(signup) {
    view.signup = signup;
    find("sh-auth-title").textContent = signup ? "Empieza tu aventura" : "Bienvenido de nuevo";
    find("sh-auth-subtitle").textContent = signup ? "Crea una cuenta para conocer jugadores." : "Entra con tu correo y contraseña.";
    find("sh-auth-submit").textContent = signup ? "Crear mi cuenta →" : "Iniciar sesión →";
    find("sh-auth-switch-text").textContent = signup ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?";
    root.querySelector("[data-sh='switch-auth']").textContent = signup ? "Inicia sesión" : "Regístrate aquí";
    find("sh-password").autocomplete = signup ? "new-password" : "current-password";
  }
  function startUpdates() {
    if (view.timer) clearInterval(view.timer);
    if (view.channel) view.db.removeChannel(view.channel);
    view.timer = setInterval(() => { if (view.active && view.user) loadData(); }, 12000);
    view.channel = view.db.channel("spawnly-social-hub")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () => loadMessages())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_messages" }, () => loadMessages())
      .on("postgres_changes", { event: "*", schema: "public", table: "friend_requests" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "game_groups" }, () => loadData())
      .subscribe();
  }
  async function setUser(user) {
    if (!view.active) return;
    if (view.user?.id === user?.id && view.user) return;
    view.generation++;
    view.user = user;
    view.selected = null;
    find("sh-discover").classList.remove("sh-hidden");
    find("sh-chat").classList.add("sh-hidden");
    if (view.channel) { view.db.removeChannel(view.channel); view.channel = null; }
    if (view.timer) { clearInterval(view.timer); view.timer = null; }
    showAuth();
    if (!user) { setStatus(""); return; }
    setStatus("¡Estás conectado! Bienvenido a Spawnly.");
    await loadData();
    if (!view.active) return;
    const me = view.profiles.find((p) => p.id === user.id);
    if (me) {
      find("sh-username").value = me.username;
      find("sh-edition").value = me.edition;
      find("sh-bio").value = me.bio || "";
    }
    startUpdates();
  }
  async function boot() {
    try {
      view.db = await connect();
      if (!view.active) return;
      const session = guard(await view.db.auth.getSession());
      const hasSession = !!session.session;
      let verified = null;
      if (hasSession) {
        const result = await view.db.auth.getUser();
        if (!result.error) verified = result.data.user;
      }
      if (!view.active) return;
      view.subscription = view.db.auth.onAuthStateChange((_, sessionNext) => {
        if (!view.active) return;
        if (sessionNext?.user?.id !== currentId()) {
          setTimeout(() => { if (view.active) setUser(sessionNext?.user || null); }, 0);
        }
      }).data.subscription;
      await setUser(verified);
    } catch (error) {
      find("sh-auth").classList.remove("sh-hidden");
      setStatus("No se pudo conectar con Supabase: " + error.message);
    }
  }
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sh]");
    if (!button || !root.contains(button)) return;
    switch (button.dataset.sh) {
      case "switch-auth": setAuthMode(!view.signup); break;
      case "back-chat": backChat(); break;
      case "logout": run(async () => { guard(await view.db.auth.signOut()); await setUser(null); }); break;
    }
  });
  root.addEventListener("input", (event) => {
    if (event.target.id === "sh-search") renderAll();
  });
  root.addEventListener("submit", (event) => {
    const form = event.target;
    if (!["sh-auth-form", "sh-profile-form", "sh-group-form", "sh-message-form"].includes(form.id)) return;
    event.preventDefault();
    if (!view.db) { setStatus("Todavía no se ha conectado con Supabase."); return; }
    if (form.id === "sh-auth-form") run(async () => {
      const email = find("sh-email").value.trim(), password = find("sh-password").value;
      const response = view.signup
        ? await view.db.auth.signUp({ email, password, options: { emailRedirectTo: new URL("social.html", location.href).toString() } })
        : await view.db.auth.signInWithPassword({ email, password });
      guard(response);
      setStatus(view.signup ? (response.data.session ? "¡Cuenta creada!" : "Revisa tu correo y confirma tu cuenta para entrar.") : "¡Inicio de sesión correcto!");
    });
    if (form.id === "sh-profile-form") run(async () => {
      const username = find("sh-username").value.trim();
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) throw new Error("Usa entre 3 y 24 letras, números o guiones bajos.");
      guard(await view.db.from("profiles").update({ username, edition: find("sh-edition").value, bio: find("sh-bio").value.trim() }).eq("id", currentId()));
      setStatus("Tu perfil se ha guardado.");
      await loadData();
    });
    if (form.id === "sh-group-form") run(async () => {
      const name = find("sh-group-name").value.trim(), description = find("sh-group-desc").value.trim();
      if (name.length < 3) throw new Error("Escribe al menos 3 caracteres para tu grupo.");
      const group = guard(await view.db.from("game_groups").insert({ name, description, owner_id: currentId() }).select("id").single());
      guard(await view.db.from("group_members").insert({ group_id: group.id, user_id: currentId() }));
      form.reset();
      setStatus("¡Grupo creado! Ya formas parte de él.");
      await loadData();
    });
    if (form.id === "sh-message-form") run(async () => {
      if (!view.selected) return;
      const selected = view.selected, body = find("sh-message").value.trim();
      if (!body) return;
      const destination = selected.type === "group" ? "group_messages" : "direct_messages";
      const payload = selected.type === "group" ? { group_id: selected.id, sender_id: currentId(), body } : { receiver_id: selected.id, sender_id: currentId(), body };
      guard(await view.db.from(destination).insert(payload));
      find("sh-message").value = "";
      await loadMessages();
    });
  });
  boot();
  return () => {
    view.active = false;
    if (view.timer) clearInterval(view.timer);
    if (view.channel && view.db) view.db.removeChannel(view.channel);
    if (view.subscription) view.subscription.unsubscribe();
  };
}
