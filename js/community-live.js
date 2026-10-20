import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./social-config.js";
import { escapeHTML as e } from "./utils/html.js";
import { openPlayerProfile } from "./player-profile.js";
let promise;
const connect = () => promise ||= import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(({createClient})=>createClient(SUPABASE_URL,SUPABASE_ANON_KEY)).catch(err=>{promise=null;throw err;});
const modes=["Survival","Hardcore","PvP","Skyblock","Creativo"];
const options=values=>values.map(v=>`<option value="${v}">${v}</option>`).join("");
export function communityLiveView(){return `<section class="section-wrap sh-page" id="community-live">
<div class="sh-intro"><div><p class="eyebrow">SPAWNLY · COMUNIDAD REAL</p><h1>Tu mundo. <span>Tu comunidad.</span></h1><p>Publica para que todos puedan verlo, incluso desde otras cuentas.</p></div><div class="sh-intro-mascot"><img src="assets/spawny/spawny.png" width="115" height="145" alt="Spawny"></div></div>
<div class="sh-panel" style="padding:20px;margin:20px 0"><p id="cl-status" role="status">Conectando…</p><div id="cl-auth" hidden><p>Necesitas una cuenta de Spawnly para publicar.</p><a href="#social" class="sh-primary">Iniciar sesión o registrarme →</a></div>
<form id="cl-form" hidden><h2>Crear publicación</h2><label>Título<input name="title" required minlength="3" maxlength="90"></label><label>Descripción<textarea name="description" required minlength="10" maxlength="600" rows="3"></textarea></label><label>Edición<select name="edition">${options(["Java","Bedrock"])}</select></label><label>Modalidad<select name="mode">${options(modes)}</select></label><button class="sh-primary" type="submit">Publicar para todos →</button><p class="sh-note">No publiques información privada.</p></form></div>
<div class="sh-panel" style="padding:20px"><div class="sh-panel-title"><h2>Publicaciones</h2><button id="cl-refresh" class="sh-quiet" type="button">Actualizar ↻</button></div><div id="cl-posts">Cargando…</div></div></section>`;}

export function mountCommunityLive() {
  let alive = true, db, user = null, interval, authSubscription, loading = false;
  const root = document.querySelector("#community-live");
  if (!root) return () => {};
  const get = selector => root.querySelector(selector);
  const status = message => { if (alive) get("#cl-status").textContent = message; };
  const expanded = new Set();
  const replyTo = new Map();
  const drafts = new Map();
  const pending = new Set();
  const clean = value => e(String(value ?? ""));
  const login = () => '<a href="#social" class="sh-text-button">Inicia sesión</a> para participar.';
  const commentMarkup = (comment, postId, level = 0) => {
    const author = comment.profiles?.username || "Jugador";
    const children = (commentIndex.get(comment.id) || []);
    const isOwner = user?.id === comment.author_id;
    const replying = replyTo.get(postId) === comment.id;
    return `<div class="cl-comment" style="--reply-depth:${Math.min(level,2)}">
      <div class="cl-comment-meta"><button class="cl-author-button" type="button" data-cl-profile="${clean(comment.author_id)}" aria-label="Ver perfil de ${clean(author)}">${clean(author)}</button><small>${clean(new Date(comment.created_at).toLocaleString("es-EC"))}</small></div>
      <p>${clean(comment.body)}</p>
      <div class="cl-comment-actions">
        <button type="button" class="sh-quiet" data-cl-reply="${clean(comment.id)}" data-cl-post="${clean(postId)}">Responder</button>
        ${isOwner ? `<button type="button" class="sh-quiet" data-cl-delete-comment="${clean(comment.id)}">Eliminar</button>` : ""}
      </div>
      ${replying ? (user ? commentForm(postId, comment.id) : `<p class="sh-muted">${login()}</p>`) : ""}
      ${children.map(child => commentMarkup(child, postId, level + 1)).join("")}
    </div>`;
  };
  let commentIndex = new Map();
  const commentForm = (postId, parentId = "") => {
    const key = postId + ":" + parentId;
    return `<form class="cl-comment-form" data-cl-comment-form="${clean(postId)}" data-cl-parent="${clean(parentId)}">
      <label class="cl-visually-hidden" for="cl-text-${clean(parentId || postId)}">${parentId ? "Escribir respuesta" : "Escribir comentario"}</label>
      <textarea id="cl-text-${clean(parentId || postId)}" name="body" required maxlength="500" rows="2" placeholder="${parentId ? "Escribe tu respuesta…" : "Escribe un comentario…" }">${clean(drafts.get(key) || "")}</textarea>
      <div class="cl-compose-bottom"><small>Máximo 500 caracteres · Sé respetuoso</small><button type="submit" class="sh-primary">${parentId ? "Responder" : "Comentar"}</button></div>
    </form>`;
  };
  const selectError = (error, operation) => status("No se pudo " + operation + ": " + (error?.message || "Vuelve a intentarlo."));
  async function load({ quiet = false } = {}) {
    if (!alive || !db || loading) return;
    loading = true;
    try {
      const { data: posts, error } = await db.from("community_posts")
        .select("id,author_id,title,description,edition,mode,created_at,profiles!community_posts_author_id_fkey(username)")
        .order("created_at", { ascending: false }).limit(30);
      if (!alive) return;
      if (error) { selectError(error, "cargar publicaciones"); return; }
      const ids = (posts || []).map(p => p.id);
      let likes = [], comments = [];
      if (ids.length) {
        const results = await Promise.all([
          db.from("community_post_likes").select("post_id,user_id").in("post_id", ids).limit(3000),
          db.from("community_post_comments")
            .select("id,post_id,author_id,parent_id,body,created_at,profiles!community_post_comments_author_id_fkey(username)")
            .in("post_id", ids).order("created_at", { ascending: true }).limit(1500)
        ]);
        if (!alive) return;
        if (results[0].error || results[1].error) {
          selectError(results[0].error || results[1].error, "cargar las interacciones"); return;
        }
        likes = results[0].data || [];
        comments = results[1].data || [];
      }
      const likeCounts = new Map();
      const liked = new Set();
      for (const row of likes) {
        likeCounts.set(row.post_id, (likeCounts.get(row.post_id) || 0) + 1);
        if (row.user_id === user?.id) liked.add(row.post_id);
      }
      const commentCounts = new Map(), roots = new Map();
      commentIndex = new Map();
      for (const comment of comments) {
        commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) || 0) + 1);
        const map = comment.parent_id ? commentIndex : roots;
        const key = comment.parent_id || comment.post_id;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(comment);
      }
      get("#cl-posts").innerHTML = (posts || []).length ? posts.map(p => {
        const owner = user?.id === p.author_id;
        const username = p.profiles?.username || "Jugador";
        const isLiked = liked.has(p.id);
        const showComments = expanded.has(p.id);
        const count = commentCounts.get(p.id) || 0;
        return `<article class="cl-post">
          <div class="cl-post-head"><button class="cl-author-button" type="button" data-cl-profile="${clean(p.author_id)}" aria-label="Ver perfil de ${clean(username)}">${clean(username)}</button><small>${clean(new Date(p.created_at).toLocaleDateString("es-EC"))}</small></div>
          <div class="cl-post-tags"><span>${clean(p.edition)}</span><span>${clean(p.mode)}</span></div>
          <h3>${clean(p.title)}</h3><p>${clean(p.description)}</p>
          <div class="cl-reactions">
            <button type="button" class="cl-react ${isLiked ? "is-liked" : ""}" data-cl-like="${clean(p.id)}" aria-pressed="${isLiked}" aria-label="${isLiked ? "Quitar me gusta" : "Dar me gusta"}">${isLiked ? "♥" : "♡"} Me gusta <span>${likeCounts.get(p.id) || 0}</span></button>
            <button type="button" class="cl-react" data-cl-expand="${clean(p.id)}" aria-expanded="${showComments}">▤ Comentarios <span>${count}</span></button>
            ${owner ? `<button type="button" class="sh-quiet cl-remove" data-cl-delete="${clean(p.id)}">Eliminar publicación</button>` : ""}
          </div>
          ${showComments ? `<div class="cl-discussion">
            <h4>Conversación</h4>
            ${(roots.get(p.id) || []).map(c => commentMarkup(c, p.id)).join("") || '<p class="sh-muted">Sé el primero en comentar.</p>'}
            ${user ? commentForm(p.id) : `<p class="sh-muted">${login()}</p>`}
          </div>` : ""}
        </article>`;
      }).join("") : '<p class="sh-muted">Todavía no hay publicaciones. ¡Sé el primero!</p>';
      if (!quiet) status("Publicaciones compartidas: " + (posts || []).length);
    } catch (error) {
      if (alive) selectError(error, "actualizar la comunidad");
    } finally { loading = false; }
  }
  async function auth() {
    if (!db || !alive) return;
    const { data, error } = await db.auth.getUser();
    if (!alive) return;
    user = error ? null : data.user;
    get("#cl-form").hidden = !user;
    get("#cl-auth").hidden = !!user;
    await load();
  }
  async function run(key, operation) {
    if (pending.has(key)) return;
    pending.add(key);
    try { await operation(); } catch (error) { if (alive) selectError(error, "realizar la acción"); }
    finally { pending.delete(key); }
  }
  async function submit(event) {
    const form = event.target;
    if (form.id !== "cl-form" && !form.matches("[data-cl-comment-form]")) return;
    event.preventDefault();
    if (!user) { location.hash = "social"; return; }
    if (!form.reportValidity()) return;
    if (form.id === "cl-form") {
      const fd = new FormData(form);
      const title = String(fd.get("title")).trim();
      const description = String(fd.get("description")).trim();
      if (title.length < 3 || title.length > 90 || description.length < 10 || description.length > 600) return;
      await run("new-post", async () => {
        const button = form.querySelector("[type=submit]"); button.disabled = true;
        try {
          const { error } = await db.from("community_posts").insert({
            author_id: user.id, title, description, edition: fd.get("edition"), mode: fd.get("mode")
          });
          if (error) { selectError(error, "publicar"); return; }
          form.reset(); await load(); status("¡Tu publicación ya es visible para todos!");
        } finally { if (alive) button.disabled = false; }
      });
      return;
    }
    const postId = form.dataset.clCommentForm, parentId = form.dataset.clParent || null;
    const key = postId + ":" + (parentId || "");
    const body = String(new FormData(form).get("body") || "").trim();
    if (!body || body.length > 500) return;
    await run("comment:" + key, async () => {
      const button = form.querySelector("[type=submit]"); button.disabled = true;
      try {
        const { error } = await db.from("community_post_comments").insert({
          post_id: postId, author_id: user.id, parent_id: parentId, body
        });
        if (error) { selectError(error, "comentar"); return; }
        drafts.delete(key); replyTo.delete(postId); expanded.add(postId);
        await load(); status(parentId ? "¡Respuesta publicada!" : "¡Comentario publicado!");
      } finally { if (alive && button.isConnected) button.disabled = false; }
    });
  }
  function input(event) {
    const form = event.target.closest("[data-cl-comment-form]");
    if (!form || event.target.name !== "body") return;
    drafts.set(form.dataset.clCommentForm + ":" + (form.dataset.clParent || ""), event.target.value);
  }
  async function click(event) {
    const button = event.target.closest("button");
    if (!button || !root.contains(button)) return;
    if (button.id === "cl-refresh") { await auth(); return; }
    if (button.dataset.clProfile) {
      await openPlayerProfile({ db, playerId: button.dataset.clProfile, onFriendsChanged: () => {} });
      return;
    }
    if (button.dataset.clExpand) {
      const id = button.dataset.clExpand;
      if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
      await load({ quiet: true }); return;
    }
    if (button.dataset.clReply) {
      const postId = button.dataset.clPost;
      replyTo.set(postId, replyTo.get(postId) === button.dataset.clReply ? null : button.dataset.clReply);
      await load({ quiet: true }); return;
    }
    if (!user && (button.dataset.clLike || button.dataset.clDelete || button.dataset.clDeleteComment)) {
      status("Inicia sesión para interactuar con las publicaciones."); return;
    }
    if (button.dataset.clLike) {
      const id = button.dataset.clLike, isLiked = button.getAttribute("aria-pressed") === "true";
      await run("like:" + id, async () => {
        const request = isLiked
          ? db.from("community_post_likes").delete().eq("post_id", id).eq("user_id", user.id)
          : db.from("community_post_likes").insert({ post_id: id, user_id: user.id });
        const { error } = await request;
        if (error) selectError(error, "guardar tu me gusta");
        else await load({ quiet: true });
      });
      return;
    }
    if (button.dataset.clDelete) {
      if (!confirm("¿Eliminar tu publicación y sus comentarios?")) return;
      await run("delete-post:" + button.dataset.clDelete, async () => {
        const { error } = await db.from("community_posts").delete()
          .eq("id", button.dataset.clDelete).eq("author_id", user.id);
        if (error) selectError(error, "eliminar la publicación"); else await load();
      }); return;
    }
    if (button.dataset.clDeleteComment) {
      if (!confirm("¿Eliminar tu comentario y sus respuestas?")) return;
      await run("delete-comment:" + button.dataset.clDeleteComment, async () => {
        const { error } = await db.from("community_post_comments").delete()
          .eq("id", button.dataset.clDeleteComment).eq("author_id", user.id);
        if (error) selectError(error, "eliminar el comentario"); else await load({ quiet: true });
      });
    }
  }
  root.addEventListener("submit", submit);
  root.addEventListener("click", click);
  root.addEventListener("input", input);
  (async () => {
    try {
      db = await connect();
      if (!alive) return;
      await auth();
      if (!alive) return;
      const { data } = db.auth.onAuthStateChange(() => {
        if (alive) queueMicrotask(() => { if (alive) auth(); });
      });
      authSubscription = data.subscription;
      interval = setInterval(() => { if (alive && !loading) load({ quiet: true }); }, 15000);
    } catch (error) { status("No se pudo conectar con Supabase. Revisa tu conexión."); }
  })();
  return () => {
    alive = false; clearInterval(interval); authSubscription?.unsubscribe();
    root.removeEventListener("submit", submit);
    root.removeEventListener("click", click);
    root.removeEventListener("input", input);
  };
}
