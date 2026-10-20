import { players, events } from "../data.js";
import { repository } from "../store.js";

// Dialogs consume only the repository adapter; an authenticated API can replace it later.
const MODES = ["Survival", "Hardcore", "PvP", "Skyblock", "Creativo"];
const EDITIONS = ["Java", "Bedrock"];
const REASONS = [
  "Comportamiento ofensivo",
  "Información personal",
  "Spam o publicidad",
  "Contenido inapropiado",
  "Otro motivo",
];
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
let onChange = () => {},
  notify = () => {},
  initialized = false;
const dialog = () => document.querySelector("#app-dialog");
const content = () => document.querySelector("#dialog-content");
const mascot = () =>
  '<img class="spawny-small" src="assets/spawny/spawny.png" alt="Spawny, tu compañero de aventuras" width="112" height="112">';
const options = (values) =>
  values
    .map(
      (value) =>
        /* HTML */ `<option value="${escape(value)}">${escape(value)}</option>`,
    )
    .join("");
const avatar = (person) =>
  /* HTML */ `<span
    class="avatar"
    style="--avatar-color:${/^#[\da-f]{3,8}$/i.test(person.color || "")
      ? person.color
      : "#6bd9a7"}"
    >${escape(person.initials || "SP")}</span
  >`;
const localNotice = () =>
  !repository.getLastSaveOk()
    ? " El navegador no permite guardarlo: el cambio durará solo esta sesión."
    : "";
function signal(message, type) {
  notify(message + localNotice());
  onChange({ type });
}
function show(title, body, footer = "") {
  if (!dialog() || !content())
    throw new Error("Falta el contenedor de diálogos de SPAWNLY.");
  dialog().setAttribute("aria-labelledby", "dialog-title");
  content().innerHTML = /* HTML */ `<div class="dialog-header">
      <h2 id="dialog-title">${escape(title)}</h2>
      <button
        type="button"
        class="dialog-close"
        data-dialog-close
        aria-label="Cerrar ventana"
      >
        ×
      </button>
    </div>
    <div class="dialog-body">${body}</div>
    ${footer ? /* HTML */ `<div class="dialog-actions">${footer}</div>` : ""}`;
  content()
    .querySelectorAll("img")
    .forEach((image) =>
      image.addEventListener(
        "error",
        () => {
          if (!image.dataset.fallback) {
            image.dataset.fallback = "true";
            image.src = "assets/spawny/reference.jpg";
          }
        },
        { once: true },
      ),
    );
  if (!dialog().open) dialog().showModal();
  const firstInput = content().querySelector("input, textarea, select");
  if (firstInput) firstInput.focus();
}
function close() {
  dialog()?.close();
}
function error(form, message, field) {
  const output = form.querySelector("[data-form-error]");
  output.textContent = message;
  output.hidden = false;
  if (field) {
    field.setAttribute("aria-invalid", "true");
    field.focus();
  }
}
function formError() {
  return '<p class="form-error" data-form-error role="alert" hidden></p>';
}
function personById(id) {
  return (
    repository.getPlayers().find((person) => person.id === id) ||
    players.find((person) => person.id === id)
  );
}

export function initDialogs(callbacks = {}) {
  onChange = callbacks.onChange || (() => {});
  notify = callbacks.notify || (() => {});
  if (initialized) return;
  initialized = true;
  dialog().addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-dialog-close")) close();
    if (button.dataset.dialogConnect) {
      repository.toggleConnection(button.dataset.dialogConnect);
      signal(
        repository.isConnected(button.dataset.dialogConnect)
          ? "Conexión guardada en la demo. ¡Ya tienes un nuevo compañero ficticio!"
          : "Conexión eliminada de la demo.",
        "connection",
      );
      openProfile(button.dataset.dialogConnect);
    }
    if (button.dataset.dialogJoin) {
      const group = repository
        .getGroups()
        .find((item) => item.id === button.dataset.dialogJoin);
      if (!group) return;
      if (
        !repository.isJoined(group.id) &&
        group.members.length >= group.capacity
      ) {
        notify("Este grupo ya está completo. Prueba con otra aventura.");
        return;
      }
      repository.toggleGroup(group.id);
      signal(
        repository.isJoined(group.id)
          ? "¡Bienvenido al equipo! Te uniste al grupo en esta demostración."
          : "Saliste del grupo de demostración.",
        "membership",
      );
      openGroup(group.id);
    }
    if (button.dataset.dialogReport)
      openReport(button.dataset.targetType, button.dataset.dialogReport);
    if (button.dataset.dialogInfo) openInfo(button.dataset.dialogInfo);
    if (button.hasAttribute("data-demo-continue")) {
      close();
      notify(
        "¡Bienvenido a SPAWNLY! Estás explorando la demostración, sin crear una cuenta.",
      );
    }
  });
  dialog().addEventListener("submit", handleSubmit);
  dialog().addEventListener("input", (event) =>
    event.target.removeAttribute("aria-invalid"),
  );
}

export function openProfile(id) {
  const person = personById(id);
  if (!person) {
    notify("Este perfil de demostración no está disponible.");
    return;
  }
  const connected = repository.isConnected(id);
  show(
    person.name,
    /* HTML */ `<div class="profile-intro">
        ${avatar(person)}
        <div>
          <p class="eyebrow">JUGADOR DE DEMOSTRACIÓN</p>
          <p class="muted">
            ${escape(person.availability)} · ${escape(person.edition)}
          </p>
        </div>
      </div>
      <p>${escape(person.bio)}</p>
      <div class="profile-details">
        <p><strong>Plataforma</strong> ${escape(person.platform)}</p>
        <p><strong>Idioma</strong> ${escape(person.language)}</p>
        ${person.country
          ? /* HTML */ `<p>
              <strong>País opcional</strong> ${escape(person.country)}
            </p>`
          : ""}
        <p><strong>Horario habitual</strong> ${escape(person.schedule)}</p>
        <p><strong>Modalidad favorita</strong> ${escape(person.mode)}</p>
      </div>
      <div class="profile-tags">
        ${(person.tags || [])
          .map((tag) => /* HTML */ `<span class="pill">${escape(tag)}</span>`)
          .join("")}
      </div>
      <p class="safety-note">
        No compartas tu dirección, teléfono, contraseñas ni datos personales con
        desconocidos. Los perfiles de esta demo son ficticios.
      </p>`,
    /* HTML */ `<button
        class="btn btn-primary"
        type="button"
        data-dialog-connect="${escape(id)}"
        aria-pressed="${connected}"
      >
        ${connected ? "Conectado · Quitar conexión" : "Conectar en la demo"}</button
      ><button
        class="btn btn-secondary"
        type="button"
        data-dialog-report="${escape(id)}"
        data-target-type="profile"
      >
        Reportar perfil</button
      ><button
        class="btn btn-secondary"
        type="button"
        data-dialog-info="privacy"
      >
        Privacidad y bloqueo futuro
      </button>`,
  );
}

export function openGroup(id) {
  const group = repository.getGroups().find((item) => item.id === id);
  if (!group) {
    notify("Este grupo ya no está disponible.");
    return;
  }
  const joined = repository.isJoined(id),
    full = group.members.length >= group.capacity;
  const members = group.members
    .map((memberId) =>
      memberId === "me"
        ? {
            name: "Tú · Perfil de demostración",
            initials: "TÚ",
            color: "#63e69d",
            edition: group.edition,
          }
        : personById(memberId),
    )
    .filter(Boolean);
  show(
    group.name,
    /* HTML */ `<div class="profile-tags">
        <span class="pill">${escape(group.edition)}</span
        ><span class="pill">${escape(group.mode)}</span
        ><span class="pill"
          >${group.members.length}/${group.capacity} integrantes</span
        >
      </div>
      <p>${escape(group.description)}</p>
      <h3>Conoce al equipo</h3>
      <div class="member-list">
        ${members
          .map(
            (person) =>
              /* HTML */ `<div class="member-row">
                ${avatar(person)}
                <div>
                  <strong>${escape(person.name)}</strong
                  ><small class="muted"
                    >${escape(person.edition)} · Perfil ficticio</small
                  >
                </div>
              </div>`,
          )
          .join("") ||
        '<p class="muted">Todavía no hay integrantes. ¡Sé el primero!</p>'}
      </div>
      <p class="safety-note">
        La membresía se simula en este navegador. No te estás conectando a un
        servidor de Minecraft ni a personas reales.
      </p>`,
    /* HTML */ `<button
        type="button"
        class="btn ${joined ? "btn-secondary" : "btn-primary"}"
        data-dialog-join="${escape(id)}"
        aria-pressed="${joined}"
        ${full && !joined ? "disabled" : ""}
      >
        ${joined
          ? "Salir del grupo"
          : full
            ? "Grupo completo"
            : "Unirme al grupo"}</button
      ><button type="button" class="btn btn-secondary" data-dialog-close>
        Cerrar
      </button>`,
  );
}

export function openCreate(type = "post") {
  const group = type === "group";
  show(
    group
      ? "Tu próxima aventura empieza en grupo"
      : "Encuentra a tu próximo compañero",
    `${mascot()}<p class="muted">${group ? "Crea un pequeño lugar para grandes aventuras." : "Cuéntale a la comunidad qué te gustaría jugar."} Se guardará únicamente en este navegador.</p><form data-dialog-form="${group ? "group" : "post"}" novalidate><label class="field">${group ? "Nombre del grupo" : "Título de la publicación"}<input name="title" required minlength="3" maxlength="${group ? 60 : 90}" autocomplete="off" placeholder="${group ? "Los exploradores del Overworld" : "Busco amigos para empezar un Survival"}"></label><div class="field-row"><label class="field">Edición<select name="edition">${options(EDITIONS)}</select></label><label class="field">Modalidad<select name="mode">${options(MODES)}</select></label></div><label class="field">Descripción<textarea name="description" required minlength="10" maxlength="${group ? 400 : 600}" rows="4" placeholder="¿Qué tienes en mente? Describe el ambiente y la aventura que te gustaría compartir."></textarea></label><p class="safety-note">Usa un apodo. No publiques números de teléfono, direcciones ni información privada.</p>${formError()}<div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dialog-close>Cancelar</button><button class="btn btn-primary" type="submit">${group ? "Crear grupo" : "Publicar búsqueda"}</button></div></form>`,
  );
}

export function openReport(targetType, targetId) {
  const validType = ["profile", "post", "group"].includes(targetType)
    ? targetType
    : "post";
  show(
    "Cuidemos este lugar juntos",
    /* HTML */ `<p>
        Gracias por ayudar a que SPAWNLY sea una comunidad amigable.
      </p>
      <p class="safety-note">
        Esto guarda un reporte local de demostración. No se envía a un equipo de
        moderación ni genera una investigación real.
      </p>
      <form
        data-dialog-form="report"
        data-target-type="${escape(validType)}"
        data-target-id="${escape(targetId)}"
        novalidate
      >
        <label class="field"
          >Motivo del reporte<select name="reason" required>
            <option value="">Selecciona un motivo</option>
            ${options(REASONS)}
          </select></label
        >${formError()}
        <div class="dialog-actions">
          <button class="btn btn-secondary" type="button" data-dialog-close>
            Cancelar</button
          ><button class="btn btn-primary" type="submit">
            Guardar reporte de demo
          </button>
        </div>
      </form>`,
  );
}

export function openAuth(mode = "login") {
  show(
    mode === "register"
      ? "Tu próxima amistad empieza aquí"
      : "¡Qué bueno verte por aquí!",
    `${mascot()}<p>Estás en la primera demostración de SPAWNLY.</p><p class="muted">Las cuentas, el inicio de sesión y las amistades reales llegarán en una futura versión. Por ahora puedes explorar perfiles ficticios, crear publicaciones y formar grupos sin registrarte.</p><div class="safety-note">No necesitamos tu correo ni tu contraseña. Tus cambios se guardan localmente en este navegador; no se sincronizan entre dispositivos.</div>`,
    '<button class="btn btn-primary" type="button" data-demo-continue>Continuar en demostración</button>',
  );
}

export function openInfo(kind = "rules", payload) {
  if (kind === "privacy") {
    show(
      "Tu privacidad, primero",
      '<p>Los perfiles de demostración solo muestran apodos, preferencias de juego y horarios genéricos. El país es opcional.</p><h3>En esta versión</h3><p class="muted">Las publicaciones, grupos, conexiones y reportes se guardan en localStorage de tu navegador. No existe una base de datos remota ni se envía información a otros jugadores. Puedes eliminar estos datos desde el almacenamiento del sitio en tu navegador.</p><h3>Preparado para el futuro</h3><p class="muted">El bloqueo de usuarios, la visibilidad del perfil, los permisos de solicitudes y la eliminación de cuenta están previstos para una versión con cuentas reales. Todavía no están activados.</p><p class="safety-note">No compartas datos personales, credenciales ni información privada. Usa un apodo diferente de tu nombre real.</p>',
      '<button class="btn btn-primary" type="button" data-dialog-close>Entendido</button>',
    );
  } else if (kind === "welcome") {
    show(
      "¡Hola! Soy Spawny 💚",
      `${mascot()}<p>¡Bienvenido a SPAWNLY! Tu próxima aventura empieza con un «hola».</p><p class="muted">Explora jugadores, encuentra tu modalidad favorita o crea un grupo. Todo lo que ves funciona como una demostración local con personas ficticias.</p><p class="safety-note">Aparece, conecta y juega. Con respeto, curiosidad y sin compartir información personal.</p>`,
      '<button class="btn btn-primary" type="button" data-dialog-close>¡Vamos a explorar!</button>',
    );
  } else if (kind === "event") {
    const event =
      typeof payload === "string"
        ? events.find((item) => item.id === payload)
        : payload;
    if (!event) {
      notify("Este evento no está disponible.");
      return;
    }
    show(
      event.title,
      /* HTML */ `<p class="eyebrow">EVENTO DE DEMOSTRACIÓN</p>
        <p>${escape(event.description)}</p>
        <div class="profile-details">
          <p><strong>Cuándo</strong> ${escape(event.date)}</p>
          <p><strong>Edición</strong> ${escape(event.edition)}</p>
          <p><strong>Modalidad</strong> ${escape(event.mode)}</p>
        </div>
        <p class="safety-note">
          Este evento es ficticio. No hay una inscripción real, servidor, pago
          ni encuentro organizado. La agenda muestra cómo se verán los eventos
          de la comunidad.
        </p>`,
      '<button class="btn btn-primary" type="button" data-dialog-close>Entendido</button>',
    );
  } else {
    show(
      "Las buenas aventuras empiezan con respeto",
      '<p class="muted">Nuestras normas de comunidad</p><ol class="community-rules"><li><strong>Sé amable.</strong> Respeta a todos los jugadores, sus niveles y estilos de juego. No se permite acoso, discriminación ni insultos.</li><li><strong>Cuida tu privacidad.</strong> Usa un apodo y no compartas direcciones, teléfonos, contraseñas ni datos sensibles.</li><li><strong>Juega limpio.</strong> Evita trampas, estafas, spam y solicitudes de dinero.</li><li><strong>Respeta los límites.</strong> Una conexión o invitación siempre debe ser voluntaria.</li><li><strong>Reporta lo que preocupe.</strong> En la demo el reporte se guarda solo en tu navegador. La moderación real se incorporará con el servicio en línea.</li></ol><p class="safety-note">Si eres menor, pide ayuda a un adulto de confianza antes de interactuar con desconocidos o entrar a comunidades externas.</p>',
      '<button class="btn btn-primary" type="button" data-dialog-close>Juguemos con respeto</button>',
    );
  }
}

function handleSubmit(event) {
  const form = event.target.closest("[data-dialog-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const type = form.dataset.dialogForm;
  try {
    if (type === "report") {
      const reason = data.get("reason");
      if (!REASONS.includes(reason)) {
        error(
          form,
          "Selecciona el motivo de tu reporte.",
          form.elements.reason,
        );
        return;
      }
      repository.report({
        targetType: form.dataset.targetType,
        targetId: form.dataset.targetId,
        reason,
      });
      close();
      signal(
        "Gracias por cuidar la comunidad. Reporte guardado solo en esta demo.",
        "report",
      );
      return;
    }
    const title = String(data.get("title") || "").trim();
    const description = String(data.get("description") || "").trim();
    const edition = data.get("edition"),
      mode = data.get("mode");
    const maxTitle = type === "group" ? 60 : 90;
    if (title.length < 3 || title.length > maxTitle) {
      error(
        form,
        `Escribe un ${type === "group" ? "nombre" : "título"} de entre 3 y ${maxTitle} caracteres.`,
        form.elements.title,
      );
      return;
    }
    const maxDescription = type === "group" ? 400 : 600;
    if (description.length < 10 || description.length > maxDescription) {
      error(
        form,
        `Escribe una descripción de entre 10 y ${maxDescription} caracteres.`,
        form.elements.description,
      );
      return;
    }
    if (!EDITIONS.includes(edition) || !MODES.includes(mode)) {
      error(form, "Elige una edición y una modalidad válidas.");
      return;
    }
    if (type === "group")
      repository.addGroup({ name: title, description, edition, mode });
    else repository.addPost({ title, description, edition, mode });
    close();
    signal(
      type === "group"
        ? "¡Tu grupo está listo! Spawny te desea grandes aventuras."
        : "¡Búsqueda publicada! Tu próxima amistad puede empezar aquí.",
      type,
    );
  } catch (failure) {
    error(
      form,
      failure instanceof Error
        ? failure.message
        : "No se pudo guardar. Revisa los campos e inténtalo de nuevo.",
    );
  }
}
