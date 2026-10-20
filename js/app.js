import { repository } from "./store.js";
import {
  home,
  playersPage,
  groupsPage,
  communityPage,
  spawnyPage,
} from "./pages/views.js?v=20261020b";
import {
  playerCard,
  groupCard,
  postCard,
  emptyState,
} from "./components/cards.js";
import {
  initDialogs,
  openProfile,
  openGroup,
  openCreate,
  openReport,
  openAuth,
  openInfo,
} from "./components/dialogs.js";
import { icon, escapeHTML as e } from "./utils/html.js";
import { spawny } from "../assets/spawny/manifest.js";
import { socialHubView, mountSocialHub } from "./social-hub.js";
const $ = (s) => document.querySelector(s);
const pages = {
  inicio: home,
  jugadores: playersPage,
  grupos: groupsPage,
  comunidad: communityPage,
  spawny: spawnyPage,
  social: socialHubView,
};
const filters = {
  player: {
    query: "",
    edition: "Todas",
    mode: "Todos",
    language: "Todos",
    availability: "Todos",
  },
  group: { query: "", edition: "Todas" },
  post: { query: "", edition: "Todas", mode: "Todos" },
  homeMode: "Todos",
};
let leaveSocial = null;
let currentRoute = "",
  toastTimer,
  dialogReturnFocus = "";
function focusSelector(element) {
  if (!element) return "";
  if (element.id) return "#" + CSS.escape(element.id);
  for (const key of [
    "data-connect",
    "data-profile",
    "data-group",
    "data-create",
    "data-interest",
    "data-join",
    "data-mode",
    "data-group-edition",
    "data-event",
    "data-auth",
    "data-info",
    "data-reset",
  ])
    if (element.hasAttribute(key))
      return (
        "button[" + key + '="' + CSS.escape(element.getAttribute(key)) + '"]'
      );
  return "";
}
function restoreFocus(selector) {
  const target = selector && document.querySelector(selector);
  if (target) target.focus({ preventScroll: true });
  else $("#main-content").focus({ preventScroll: true });
}
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function notify(message, title = "Spawny te acompaña") {
  clearTimeout(toastTimer);
  $("#toast-region").innerHTML = /* HTML */ `<div class="toast">
    ${spawny("celebrating")}
    <div>
      <strong>${e(title)}</strong>
      <p>${e(message)}</p>
    </div>
  </div>`;
  toastTimer = setTimeout(() => {
    $("#toast-region").innerHTML = "";
  }, 6500);
}
const saveWarning = () =>
  repository.getLastSaveOk()
    ? ""
    : " El cambio durará solo esta sesión: almacenamiento local no disponible.";
function renderPlayers() {
  const f = filters.player;
  const list = repository
    .getPlayers()
    .filter(
      (p) =>
        (f.edition === "Todas" || p.edition === f.edition) &&
        (f.mode === "Todos" || p.mode === f.mode) &&
        (f.language === "Todos" || p.language === f.language) &&
        (f.availability === "Todos" || p.availability === f.availability) &&
        normalize(
          [p.name, p.bio, p.mode, p.platform, ...p.tags].join(" "),
        ).includes(normalize(f.query)),
    );
  $("#player-results").innerHTML = list.length
    ? list.map(playerCard).join("")
    : emptyState();
  $("#player-count").textContent = `${list.length} jugadores de demo`;
}
function renderGroups() {
  const f = filters.group;
  const list = repository
    .getGroups()
    .filter(
      (g) =>
        (f.edition === "Todas" || g.edition === f.edition) &&
        normalize([g.name, g.description, g.mode].join(" ")).includes(
          normalize(f.query),
        ),
    );
  $("#group-results").innerHTML = list.length
    ? list.map(groupCard).join("")
    : emptyState(
        "Tu grupo aún está por descubrir",
        "Prueba otra edición o crea el grupo que te gustaría encontrar.",
      );
}
function renderPosts() {
  const f = filters.post;
  const list = repository
    .getPosts()
    .filter(
      (p) =>
        (f.edition === "Todas" || p.edition === f.edition) &&
        (f.mode === "Todos" || p.mode === f.mode) &&
        normalize([p.title, p.description, p.mode].join(" ")).includes(
          normalize(f.query),
        ),
    );
  $("#post-results").innerHTML = list.length
    ? list.map(postCard).join("")
    : emptyState(
        "Esta aventura todavía no se ha publicado",
        "Cambia tus filtros o publica una búsqueda para encontrar compañeros.",
      );
}
function renderHomePlayers() {
  const list = repository
    .getPlayers()
    .filter((p) => filters.homeMode === "Todos" || p.mode === filters.homeMode)
    .slice(0, 4);
  $("#home-player-results").innerHTML = list.map(playerCard).join("");
  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === filters.homeMode);
    b.setAttribute("aria-pressed", String(b.dataset.mode === filters.homeMode));
  });
}
function restoreControls() {
  if (currentRoute === "jugadores") {
    const f = filters.player;
    $("#player-search").value = f.query;
    for (const field of ["edition", "mode", "language", "availability"])
      $("#filter-" + field).value = f[field];
    renderPlayers();
  }
  if (currentRoute === "grupos") {
    $("#group-search").value = filters.group.query;
    document.querySelectorAll("[data-group-edition]").forEach((b) => {
      b.classList.toggle(
        "active",
        b.dataset.groupEdition === filters.group.edition,
      );
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.groupEdition === filters.group.edition),
      );
    });
    renderGroups();
  }
  if (currentRoute === "comunidad") {
    $("#post-search").value = filters.post.query;
    $("#post-edition").value = filters.post.edition;
    $("#post-mode").value = filters.post.mode;
    renderPosts();
  }
  if (currentRoute === "inicio") renderHomePlayers();
}
function render(scroll = false) {
  const priorFocus = $("#main-content").contains(document.activeElement)
    ? focusSelector(document.activeElement)
    : "";
  const requested = location.hash.slice(1) || "inicio";
  currentRoute = Object.hasOwn(pages, requested) ? requested : "inicio";
  if (requested !== currentRoute) history.replaceState(null, "", "#inicio");
  const main = $("#main-content");
  if (leaveSocial) { leaveSocial(); leaveSocial = null; }
  main.innerHTML = pages[currentRoute]();
  if (currentRoute === "social") leaveSocial = mountSocialHub();
  main.classList.remove("page-enter");
  void main.offsetWidth;
  main.classList.add("page-enter");
  restoreControls();
  document.querySelectorAll("[data-route]").forEach((a) => {
    const active = a.dataset.route === currentRoute;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $(".main-nav").classList.remove("is-open");
  $(".menu-button").setAttribute("aria-expanded", "false");
  $(".menu-button").setAttribute("aria-label", "Abrir navegación");
  document.title = `${{ inicio: "Aparece, conecta y juega", jugadores: "Encuentra a tu gente", grupos: "Tu próximo equipo", comunidad: "El punto de encuentro", spawny: "Conoce a Spawny", social: "Amigos y chat" }[currentRoute]} · SPAWNLY`;
  if (scroll) {
    window.scrollTo({ top: 0, behavior: "instant" });
    main.focus({ preventScroll: true });
  } else if (priorFocus) restoreFocus(priorFocus);
}
initDialogs({
  notify,
  onChange: ({ type }) => {
    if (type === "post") {
      filters.post = { query: "", edition: "Todas", mode: "Todos" };
      if (currentRoute !== "comunidad") {
        location.hash = "comunidad";
        return;
      }
    }
    if (type === "group") {
      filters.group = { query: "", edition: "Todas" };
      if (currentRoute !== "grupos") {
        location.hash = "grupos";
        return;
      }
    }
    render();
  },
});
function clearFilters() {
  if (currentRoute === "jugadores") {
    filters.player = {
      query: "",
      edition: "Todas",
      mode: "Todos",
      language: "Todos",
      availability: "Todos",
    };
  }
  if (currentRoute === "grupos")
    filters.group = { query: "", edition: "Todas" };
  if (currentRoute === "comunidad")
    filters.post = { query: "", edition: "Todas", mode: "Todos" };
  restoreControls();
}
function showReset() {
  const dialog = $("#app-dialog");
  dialog.setAttribute("aria-labelledby", "dialog-title");
  $("#dialog-content").innerHTML = /* HTML */ `<div class="dialog-header">
      <h2 id="dialog-title">¿Empezamos una nueva aventura?</h2>
      <button
        class="dialog-close"
        data-dialog-close
        aria-label="Cerrar ventana"
      >
        ×
      </button>
    </div>
    <div class="dialog-body">
      ${spawny("happy", "spawny-small")}
      <p>
        Se eliminarán únicamente tus publicaciones, grupos, conexiones,
        intereses y reportes de esta demostración de Spawnly en este navegador.
      </p>
      <p class="muted">Volverás a los datos ficticios iniciales.</p>
    </div>
    <div class="dialog-actions">
      <button class="btn btn-secondary" data-dialog-close>
        Conservar mis datos</button
      ><button class="btn btn-primary" data-confirm-reset>
        Restablecer demostración
      </button>
    </div>`;
  dialog.showModal();
}
document.addEventListener("click", (event) => {
  if (event.target.closest(".skip-link")) {
    event.preventDefault();
    $("#main-content").focus({ preventScroll: true });
    $("#main-content").scrollIntoView({ behavior: "instant", block: "start" });
    return;
  }
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-confirm-reset")) {
    repository.reset();
    $("#app-dialog").close();
    filters.homeMode = "Todos";
    clearFilters();
    render();
    notify(
      "Todo listo. Tu punto de aparición vuelve a estar como nuevo." +
        saveWarning(),
    );
    return;
  }
  if (button.closest("#app-dialog")) return;
  if (
    button.matches(
      "[data-profile],[data-group],[data-create],[data-auth],[data-info],[data-event],[data-report],[data-interest],[data-reset]",
    )
  )
    dialogReturnFocus = focusSelector(button);
  try {
    if (button.matches(".menu-button")) {
      const open = $(".main-nav").classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute(
        "aria-label",
        open ? "Cerrar navegación" : "Abrir navegación",
      );
    }
    if (button.dataset.profile) openProfile(button.dataset.profile);
    if (button.dataset.group) openGroup(button.dataset.group);
    if (button.dataset.create) openCreate(button.dataset.create);
    if (button.dataset.auth) openAuth(button.dataset.auth);
    if (button.dataset.info) openInfo(button.dataset.info);
    if (button.dataset.event) openInfo("event", button.dataset.event);
    if (button.dataset.report)
      openReport(button.dataset.report, button.dataset.id);
    if (button.hasAttribute("data-clear-filters")) clearFilters();
    if (button.hasAttribute("data-reset")) showReset();
    if (button.dataset.connect) {
      const id = button.dataset.connect;
      const connected = repository.toggleConnection(id);
      render();
      notify(
        (connected
          ? "¡Conexión guardada! Un primer hola, una nueva aventura de demo."
          : "Conexión retirada de esta demostración.") + saveWarning(),
      );
    }
    if (button.dataset.interest) {
      const interested = repository.toggleInterest(button.dataset.interest);
      render();
      notify(
        (interested
          ? "Interés guardado en tu demo. No se envían solicitudes a personas reales."
          : "Retiraste tu interés de esta publicación.") + saveWarning(),
      );
    }
    if (button.dataset.join) {
      repository.toggleGroup(button.dataset.join);
      render();
      notify(
        (repository.isJoined(button.dataset.join)
          ? "¡Ya formas parte del equipo! Puedes ver a sus integrantes al abrir el grupo."
          : "Saliste del grupo de demostración.") + saveWarning(),
      );
    }
    if (button.dataset.mode) {
      filters.homeMode = button.dataset.mode;
      renderHomePlayers();
    }
    if (button.dataset.groupEdition) {
      filters.group.edition = button.dataset.groupEdition;
      restoreControls();
    }
  } catch (error) {
    notify(
      error.message || "No pudimos completar esta acción. Inténtalo de nuevo.",
    );
  }
});
document.addEventListener("input", (event) => {
  const { id, value } = event.target;
  if (id === "player-search") {
    filters.player.query = value;
    renderPlayers();
  }
  if (id === "group-search") {
    filters.group.query = value;
    renderGroups();
  }
  if (id === "post-search") {
    filters.post.query = value;
    renderPosts();
  }
});
document.addEventListener("change", (event) => {
  const { id, value } = event.target;
  if (id.startsWith("filter-")) {
    const key = id.replace("filter-", "");
    if (Object.hasOwn(filters.player, key)) {
      filters.player[key] = value;
      renderPlayers();
    }
  }
  if (id === "post-edition" || id === "post-mode") {
    filters.post[id === "post-mode" ? "mode" : "edition"] = value;
    renderPosts();
  }
});
addEventListener("hashchange", () => render(true));
addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $(".main-nav").classList.remove("is-open");
    $(".menu-button").setAttribute("aria-expanded", "false");
  }
});
$("#app-dialog").addEventListener("close", () =>
  requestAnimationFrame(() => {
    if (!$("#app-dialog").open) restoreFocus(dialogReturnFocus);
  }),
);
$("#year").textContent = new Date().getFullYear();
render();
