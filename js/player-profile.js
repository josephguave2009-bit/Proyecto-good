import { escapeHTML as e } from "./utils/html.js";

/** Derive the actual relationship from RLS-visible friend requests. */
export function relationshipFor(requests, viewerId, playerId) {
  if (!viewerId || !playerId) return { kind: "login" };
  if (viewerId === playerId) return { kind: "self" };
  const rows = (requests || []).filter(r =>
    (r.sender_id === viewerId && r.receiver_id === playerId) ||
    (r.sender_id === playerId && r.receiver_id === viewerId)
  );
  const accepted = rows.find(r => r.status === "accepted");
  if (accepted) return { kind: "friends", requestId: accepted.id };
  const received = rows.find(r => r.status === "pending" && r.receiver_id === viewerId);
  if (received) return { kind: "incoming", requestId: received.id };
  const sent = rows.find(r => r.status === "pending" && r.sender_id === viewerId);
  if (sent) return { kind: "outgoing", requestId: sent.id };
  if (rows.some(r => r.status === "rejected")) return { kind: "rejected" };
  return { kind: "none" };
}

/**
 * Opens the exact Supabase profile selected in a post/comment or the social hub.
 * The backend RLS decides who can see profiles and modify friend requests.
 */
export async function openPlayerProfile({ db, playerId, onFriendsChanged = () => {} }) {
  if (!db || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(playerId || "")) return;
  const dialog = document.createElement("dialog");
  dialog.className = "sh-public-profile";
  dialog.setAttribute("aria-label", "Perfil de jugador");
  dialog.innerHTML = `<div class="sh-public-profile-shell">
    <div class="sh-public-profile-top"><span>SPAWNLY · PERFIL DE JUGADOR</span>
      <button type="button" class="sh-public-profile-close" data-profile-close aria-label="Cerrar perfil">×</button></div>
    <div class="sh-public-profile-content" role="status" aria-live="polite">Cargando perfil real…</div>
  </div>`;
  document.body.append(dialog);
  let busy = false;
  const area = dialog.querySelector(".sh-public-profile-content");
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.addEventListener("click", evt => {
    if (evt.target === dialog || evt.target.closest("[data-profile-close]")) dialog.close();
  });
  dialog.showModal();

  let currentUser;
  async function refresh() {
    if (!dialog.open) return;
    try {
      const auth = await db.auth.getUser();
      if (!dialog.open) return;
      currentUser = auth.error ? null : auth.data.user;
      if (!currentUser) {
        area.innerHTML = `<div class="sh-public-profile-access">
          <h2>Conoce a este jugador</h2>
          <p>Inicia sesión para ver perfiles reales, enviar solicitudes de amistad y chatear.</p>
          <a href="#social" data-profile-nav class="sh-primary">Iniciar sesión o crear cuenta →</a>
        </div>`;
        return;
      }
      const [profileResponse, requestsResponse] = await Promise.all([
        db.from("profiles").select("id,username,bio,edition,created_at").eq("id", playerId).single(),
        db.from("friend_requests").select("id,sender_id,receiver_id,status")
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${playerId}),and(sender_id.eq.${playerId},receiver_id.eq.${currentUser.id})`)
      ]);
      if (!dialog.open) return;
      if (profileResponse.error) throw profileResponse.error;
      if (requestsResponse.error) throw requestsResponse.error;
      const p = profileResponse.data;
      const relationship = relationshipFor(requestsResponse.data, currentUser.id, p.id);
      const tag = p.edition || "Java";
      const names = {
        self: "Este es tu perfil",
        friends: "✓ Ya sois amigos",
        outgoing: "⏳ Solicitud de amistad enviada",
        incoming: "✦ Te ha enviado una solicitud",
        rejected: "Esta solicitud fue rechazada",
        none: "¡Un nuevo compañero de aventuras!"
      };
      let action = "";
      if (relationship.kind === "none") action = '<button type="button" class="sh-primary" data-profile-action="send">+ Añadir de amigo</button>';
      if (relationship.kind === "incoming") action = '<button type="button" class="sh-primary" data-profile-action="accept">✓ Aceptar amistad</button>';
      if (relationship.kind === "friends") action = '<a class="sh-primary" href="#social" data-profile-nav>✉ Ir a amigos y chat →</a>';
      if (relationship.kind === "self") action = '<a class="sh-primary" href="#social" data-profile-nav>✎ Editar mi perfil →</a>';
      area.innerHTML = `
        <div class="sh-public-profile-heading">
          <span class="sh-public-profile-avatar" aria-hidden="true">${e(p.username.slice(0,2).toUpperCase())}</span>
          <div><h2>${e(p.username)}</h2><span class="sh-public-profile-pill">🎮 Minecraft ${e(tag)}</span></div>
        </div>
        <div class="sh-public-profile-info">
          <h3>Sobre mí</h3>
          <p>${e(p.bio || "Este jugador todavía no ha escrito una biografía.")}</p>
          <p class="sh-public-profile-since">En Spawnly desde ${e(new Date(p.created_at).toLocaleDateString("es-EC"))}</p>
        </div>
        <p class="sh-public-profile-relationship">${e(names[relationship.kind] || "")}</p>
        <div class="sh-public-profile-actions">${action}</div>
        <p class="sh-public-profile-feedback" role="status" aria-live="polite"></p>
        <p class="sh-public-profile-security">Nunca compartas contraseñas, direcciones ni datos personales con desconocidos.</p>
      `;
      dialog.dataset.relationshipKind = relationship.kind;
      dialog.dataset.requestId = relationship.requestId || "";
    } catch (error) {
      if (dialog.open) area.innerHTML = `<div class="sh-public-profile-access"><h2>No pudimos cargar este perfil</h2>
        <p>${e(error?.message || "Comprueba tu conexión e inténtalo de nuevo.")}</p>
        <button type="button" class="sh-primary" data-profile-action="reload">Reintentar</button></div>`;
    }
  }
  dialog.addEventListener("click", async event => {
    const nav = event.target.closest("[data-profile-nav]");
    if (nav) { dialog.close(); return; }
    const button = event.target.closest("[data-profile-action]");
    if (!button || busy || !currentUser) {
      if (button?.dataset.profileAction === "reload") await refresh();
      return;
    }
    const kind = button.dataset.profileAction;
    if (kind === "reload") { await refresh(); return; }
    if (kind !== "send" && kind !== "accept") return;
    busy = true;
    button.disabled = true;
    const feedback = dialog.querySelector(".sh-public-profile-feedback");
    try {
      let response;
      if (kind === "send") {
        response = await db.from("friend_requests").insert({
          sender_id: currentUser.id,
          receiver_id: playerId,
          status: "pending"
        });
      } else {
        response = await db.from("friend_requests")
          .update({ status: "accepted" })
          .eq("id", dialog.dataset.requestId)
          .eq("receiver_id", currentUser.id)
          .eq("status", "pending")
          .select("id");
        if (!response.error && !response.data?.length) throw new Error("La solicitud ya no está pendiente. Actualiza el perfil.");
      }
      if (response.error) throw response.error;
      if (!dialog.open) return;
      await refresh();
      if (dialog.open) {
        const freshFeedback = dialog.querySelector(".sh-public-profile-feedback");
        if (freshFeedback) freshFeedback.textContent = kind === "send" ? "¡Solicitud enviada! La otra persona podrá aceptarla desde Spawnly." : "¡Ahora son amigos!";
      }
      onFriendsChanged();
    } catch (error) {
      if (dialog.open) {
        if (feedback) feedback.textContent = error?.code === "23505" ? "Ya existe una solicitud entre estas cuentas. Vuelve a abrir el perfil para comprobar su estado." : (error?.message || "No pudimos completar la solicitud.");
      }
    } finally {
      busy = false;
      if (button.isConnected) button.disabled = false;
    }
  });
  await refresh();
}
