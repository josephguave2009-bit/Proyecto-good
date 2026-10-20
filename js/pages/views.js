import { icon, escapeHTML as e } from "../utils/html.js";
import {
  playerCard,
  groupCard,
  postCard,
  eventCard,
} from "../components/cards.js";
import { spawny, expressions } from "../../assets/spawny/manifest.js";
import { repository } from "../store.js";
import { events } from "../data.js";
export const modes = [
  "Todos",
  "Survival",
  "Hardcore",
  "PvP",
  "Skyblock",
  "Creativo",
];
const sectionTitle = (eyebrow, title, link, label) =>
  /* HTML */ `<div class="section-title">
    <div>
      <p class="eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
    </div>
    ${link
      ? /* HTML */ `<a class="see-all" href="${link}"
          >${label} ${icon("arrow", 17)}</a
        >`
      : ""}
  </div>`;
export const modeTabs = (active) =>
  /* HTML */ `<div class="mode-tabs" aria-label="Modalidad de juego">
    ${modes
      .map(
        (m, i) =>
          /* HTML */ `<button
            class="mode-tab ${m === active ? "active" : ""}"
            data-mode="${m}"
            aria-pressed="${m === active}"
          >
            ${icon(["spark", "leaf", "shield", "game", "cube", "spark"][i], 15)}
            ${m === "Todos" ? "Para ti" : m}
          </button>`,
      )
      .join("")}
  </div>`;
export function home() {
  return /* HTML */ `<section class="hero section-wrap">
      <div class="hero-copy">
        <div class="hero-eyebrow">
          <span class="status-dot"></span> TU GENTE. TU MUNDO. TU AVENTURA.
        </div>
        <h1>
          TU PRÓXIMA<br /><span>AVENTURA</span><br />COMIENZA AQUÍ<span
            class="hero-period"
            >.</span
          >
        </h1>
        <p>
          Encuentra amigos, forma equipos y descubre nuevas aventuras en
          Minecraft. Porque jugar acompañado siempre es mejor.
        </p>
        <div class="hero-buttons">
          <a class="btn btn-primary btn-lg" href="#jugadores"
            >${icon("users", 19)} Encontrar amigos ${icon("arrowUp", 17)}</a
          ><a class="btn btn-secondary btn-lg" href="#comunidad"
            >Explorar comunidad ${icon("arrow", 17)}</a
          >
        </div>
        <div class="hero-proof">
          <div class="tiny-avatars">
            ${repository
              .getPlayers()
              .slice(0, 4)
              .map(
                (p) =>
                  /* HTML */ `<span style="--av:${e(p.color)}"
                    >${e(p.initials)}</span
                  >`,
              )
              .join("")}
          </div>
          <span
            >Un buen equipo empieza con un <strong>«hola».</strong
            ><small>Java o Bedrock, aquí hay sitio para ti.</small></span
          >
        </div>
      </div>
      <div class="hero-stage">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <span class="star star-one">✦</span><span class="star star-two">✧</span
        ><span class="pixel pixel-one"></span
        ><span class="pixel pixel-two"></span
        ><span class="pixel pixel-three"></span>
        <div class="mascot-hello">
          <span>👋</span> ¡Hey! Soy <strong>Spawny</strong
          ><small>¿Listo para una nueva aventura?</small>
        </div>
        <img
          class="hero-island"
          src="assets/island.svg"
          alt=""
          width="600"
          height="260"
        /><img
          class="hero-spawny spawny"
          src="assets/spawny/spawny.png"
          width="480"
          height="600"
          alt="Spawny te da la bienvenida con una sonrisa y la mano levantada"
          fetchpriority="high"
        />
        <div class="floating-note">
          ${icon("heart", 17)}
          <div>
            Tu próximo amigo está por aquí.<small
              >Aparece, conecta y juega.</small
            >
          </div>
        </div>
        <span class="hero-coordinates">SPAWN POINT · 0, 64, 0</span>
      </div>
    </section>
    <div class="feature-strip section-wrap">
      <div>
        ${icon("cube", 25)}<span
          ><strong>Java & Bedrock</strong
          ><small>Dos ediciones. Una comunidad.</small></span
        >
      </div>
      <div>
        ${icon("users", 25)}<span
          ><strong>Encuentra tu equipo</strong
          ><small>Personas que juegan como tú.</small></span
        >
      </div>
      <div>
        ${icon("shield", 25)}<span
          ><strong>Buen rollo, siempre</strong
          ><small>La amistad es nuestro mejor loot.</small></span
        >
      </div>
      <span class="demo-pill">DEMO INTERACTIVA</span>
    </div>
    <section class="section-wrap content-section" id="home-players">
      ${sectionTitle(
        "EL SIGUIENTE BLOQUE LO PONEMOS JUNTOS",
        "No juegues solo. <span>Encuentra a tu gente.</span>",
        "#jugadores",
        "Explorar jugadores",
      )}
      <div class="home-discovery">
        <div>
          ${modeTabs("Todos")}
          <div id="home-player-results" class="player-grid">
            ${repository.getPlayers().slice(0, 4).map(playerCard).join("")}
          </div>
        </div>
        <aside class="spawny-tip">
          <div class="tip-mascot">${spawny("happy")}</div>
          <span class="mini-label">UN CONSEJO DE SPAWNY</span>
          <h3>Un «hola» puede cambiar tu partida.</h3>
          <p>
            No importa tu nivel. Aquí lo importante son las ganas de compartir.
          </p>
          <a href="#jugadores">Encuentra tu compañero ${icon("arrow", 16)}</a>
        </aside>
      </div>
    </section>
    <section class="section-wrap content-section">
      ${sectionTitle(
        "LOS MEJORES MUNDOS SE CONSTRUYEN EN EQUIPO",
        "Un grupo. <span>Mil historias por vivir.</span>",
        "#grupos",
        "Todos los grupos",
      )}
      <div class="group-grid">
        ${repository.getGroups().slice(0, 3).map(groupCard).join("")}
      </div>
    </section>
    <section class="section-wrap content-section home-community">
      <div>
        ${sectionTitle(
          "EL PUNTO DE ENCUENTRO",
          "La comunidad <span>está en movimiento.</span>",
          "#comunidad",
          "Ver comunidad",
        )}
        <div class="post-grid">
          ${repository.getPosts().slice(0, 2).map(postCard).join("")}
        </div>
      </div>
      <aside class="community-note">
        <div class="note-icon">${icon("shield", 26)}</div>
        <h3>Un buen mundo empieza con respeto.</h3>
        <p>
          Juega a tu ritmo, respeta a los demás y cuida tu información personal.
        </p>
        <button class="profile-link" data-info="rules">
          Nuestras normas ${icon("arrow", 16)}
        </button>
      </aside>
    </section>
    ${mascotBanner()}`;
}
export const mascotBanner = () =>
  /* HTML */ `<section class="section-wrap mascot-banner">
    <div class="banner-mascot">${spawny("waving")}</div>
    <div>
      <p class="eyebrow">PEQUEÑO PERSONAJE. GRANDES AMISTADES.</p>
      <h2>Conoce a Spawny, tu compañero de aventuras.</h2>
      <p>
        Siempre listo para dar la bienvenida. Siempre con espacio para un amigo
        más.
      </p>
    </div>
    <a class="btn btn-secondary" href="#spawny"
      >¡Hola, Spawny! ${icon("arrow", 16)}</a
    >
  </section>`;
const pageHeading = (eyebrow, title, description) =>
  /* HTML */ `<div class="page-heading">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${title}</h1>
    <p>${description}</p>
  </div>`;
export function playersPage() {
  return /* HTML */ `<section class="section-wrap page-section">
      ${pageHeading(
        "TU PRÓXIMO EQUIPO ESTÁ AQUÍ",
        "Encuentra a tu <span>gente.</span>",
        "Distintos mundos, las mismas ganas de jugar. Conecta con jugadores a tu ritmo.",
      )}
      <div class="explore-layout">
        <aside class="filter-panel">
          <div class="filter-heading">
            <h2>${icon("search", 17)} Tus preferencias</h2>
            <button class="text-link" data-clear-filters>Limpiar</button>
          </div>
          <label class="field"
            ><span>Edición</span
            ><select id="filter-edition">
              <option value="Todas">Todas las ediciones</option>
              <option>Java</option>
              <option>Bedrock</option>
            </select></label
          ><label class="field"
            ><span>Modalidad</span
            ><select id="filter-mode">
              ${modes
                .map(
                  (m) =>
                    /* HTML */ `<option value="${m}">
                      ${m === "Todos" ? "Todas las modalidades" : m}
                    </option>`,
                )
                .join("")}
            </select></label
          ><label class="field"
            ><span>Idioma</span
            ><select id="filter-language">
              <option value="Todos">Todos los idiomas</option>
              <option>Español</option>
              <option>Inglés</option>
            </select></label
          ><label class="field"
            ><span>Disponibilidad</span
            ><select id="filter-availability">
              <option value="Todos">Cualquier momento</option>
              <option>Disponible</option>
              <option>Más tarde</option>
            </select></label
          >
          <div class="filter-tip">
            ${spawny("happy")}<strong>Tu equipo está por descubrir.</strong>
            <p>
              Prueba otra modalidad. A veces las mejores amistades aparecen
              donde menos lo esperas.
            </p>
          </div>
          <button class="text-link safety-link" data-info="privacy">
            ${icon("shield", 14)} Tu privacidad importa
          </button>
        </aside>
        <div class="explore-results">
          <div class="results-toolbar">
            <label class="search-box"
              >${icon("search", 19)}<input
                type="search"
                id="player-search"
                placeholder="Nombre, intereses o estilo de juego…"
                aria-label="Buscar jugadores" /></label
            ><span
              class="results-count"
              id="player-count"
              aria-live="polite"
            ></span>
          </div>
          <div class="demo-notice">
            ${icon("spark", 15)} Estás explorando perfiles ficticios. Las
            conexiones se guardan solo en este navegador.
          </div>
          <div id="player-results" class="player-grid explore-grid"></div>
        </div>
      </div>
    </section>
    ${mascotBanner()}`;
}
export function groupsPage() {
  return /* HTML */ `<section class="section-wrap page-section">
      <div class="page-heading-row">
        ${pageHeading(
          "UN LUGAR DONDE SIEMPRE ERES BIENVENIDO",
          "Pequeños grupos.<br><span>Grandes aventuras.</span>",
          "Desde un survival tranquilo hasta tu próxima victoria. Hay un equipo para cada forma de jugar.",
        )}<button class="btn btn-primary" data-create="group">
          ${icon("plus", 18)} Crear un grupo
        </button>
      </div>
      <div class="groups-toolbar">
        <div class="edition-tabs">
          <button class="active" data-group-edition="Todas" aria-pressed="true">
            Todos los grupos</button
          ><button data-group-edition="Java" aria-pressed="false">Java</button
          ><button data-group-edition="Bedrock" aria-pressed="false">
            Bedrock
          </button>
        </div>
        <label class="search-box"
          >${icon("search", 18)}<input
            id="group-search"
            type="search"
            placeholder="Busca un grupo o modalidad…"
            aria-label="Buscar grupos"
        /></label>
      </div>
      <p class="demo-notice">
        ${icon("users", 16)} Grupos de demostración · Únete, descubre sus
        integrantes o crea tu propio equipo.
      </p>
      <div id="group-results" class="group-grid"></div>
    </section>
    ${mascotBanner()}`;
}
export function communityPage() {
  return /* HTML */ `<section class="section-wrap page-section">
    <div class="page-heading-row">
      ${pageHeading(
        "UN HOLA PUEDE SER EL INICIO DE TODO",
        "El punto de <span>encuentro.</span>",
        "Comparte tu próxima aventura, descubre eventos y encuentra compañeros de partida.",
      )}<button class="btn btn-primary" data-create="post">
        ${icon("plus", 18)} Crear publicación
      </button>
    </div>
    <div class="community-layout">
      <div>
        <div class="community-composer">
          ${spawny("waving")}<button data-create="post">
            ¿Qué aventura tienes en mente? ${icon("plus", 20)}
          </button>
        </div>
        <div class="community-filter">
          <label class="search-box"
            >${icon("search", 18)}<input
              type="search"
              id="post-search"
              placeholder="Busca una aventura…"
              aria-label="Buscar publicaciones" /></label
          ><select
            id="post-edition"
            aria-label="Filtrar publicaciones por edición"
          >
            <option value="Todas">Todas las ediciones</option>
            <option>Java</option>
            <option>Bedrock</option></select
          ><select
            id="post-mode"
            aria-label="Filtrar publicaciones por modalidad"
          >
            ${modes
              .map(
                (m) =>
                  /* HTML */ `<option value="${m}">
                    ${m === "Todos" ? "Todas las modalidades" : m}
                  </option>`,
              )
              .join("")}
          </select>
        </div>
        <div id="post-results" class="community-feed"></div>
      </div>
      <aside class="community-sidebar">
        <div class="sidebar-box">
          <div class="sidebar-heading">
            <h2>${icon("calendar", 18)} Próximas aventuras</h2>
            <span class="mini-label">DEMO</span>
          </div>
          ${events.map(eventCard).join("")}
        </div>
        <div class="sidebar-box popular-groups">
          <h2>${icon("users", 18)} Descubre grupos</h2>
          ${repository
            .getGroups()
            .slice(0, 3)
            .map(
              (g) =>
                /* HTML */ `<button
                  class="popular-group"
                  data-group="${e(g.id)}"
                >
                  <span class="popular-icon">${icon("cube", 19)}</span
                  ><span
                    ><strong>${e(g.name)}</strong
                    ><small
                      >${g.members.length} miembros ficticios ·
                      ${e(g.mode)}</small
                    ></span
                  >${icon("chevron", 15)}
                </button>`,
            )
            .join("")}
        </div>
        <div class="sidebar-box trust-box">
          ${icon("shield", 28)}
          <h3>Comparte aventuras,<br />cuida tus datos.</h3>
          <p>
            No compartas contraseñas, direcciones ni información personal con
            desconocidos.
          </p>
          <button class="text-link" data-info="rules">
            Normas de la comunidad →
          </button>
        </div>
      </aside>
    </div>
  </section>`;
}
export function spawnyPage() {
  return /* HTML */ `<section class="section-wrap page-section">
    <div class="spawny-intro">
      <div>
        ${pageHeading(
          "EL CORAZÓN VERDE DE SPAWNLY",
          "Pequeño de tamaño.<br><span>Gigante en amistad.</span>",
          "¡Hola! Soy Spawny. Vengo con una mochila llena de aventuras y muchas ganas de conocer a tu próximo equipo.",
        )}
        <p class="mascot-story">
          Una flor sobre la cabeza, una sonrisa que nunca falta y la curiosidad
          de descubrir nuevos mundos. Spawny representa lo que nos une: amistad,
          confianza y diversión compartida.
        </p>
        <a class="btn btn-primary" href="#jugadores"
          >Vamos a encontrar amigos ${icon("arrow", 17)}</a
        >
      </div>
      <div class="spawny-portrait">
        ${spawny("waving")}<span>SPAWNY · COMPAÑERO DE AVENTURAS</span>
      </div>
    </div>
    <div class="mascot-values">
      <div>
        ${icon("heart", 25)}
        <h3>Amistad</h3>
        <p>Siempre hay lugar para alguien más.</p>
      </div>
      <div>
        ${icon("shield", 25)}
        <h3>Confianza</h3>
        <p>La comunidad se construye con respeto.</p>
      </div>
      <div>
        ${icon("spark", 25)}
        <h3>Aventura</h3>
        <p>Cada conexión abre un nuevo mundo.</p>
      </div>
    </div>
    <div class="section-title">
      <div>
        <p class="eyebrow">UN PERSONAJE, MUCHOS MOMENTOS</p>
        <h2>La colección de <span>Spawny.</span></h2>
        <p class="muted">
          Reutilizamos su pose de bienvenida. La estructura está lista para
          incorporar nuevas expresiones originales.
        </p>
      </div>
    </div>
    <div class="expression-grid">
      ${expressions
        .map(
          (x) =>
            /* HTML */ `<article>
              <div>${spawny(x.id)}</div>
              <h3>${x.label}</h3>
              <span>${x.status}</span>
            </article>`,
        )
        .join("")}
    </div>
    <div class="reference-note">
      <img
        src="assets/spawny/reference.jpg"
        alt="Referencia original de Spawny proporcionada para este proyecto"
        width="1280"
        height="853"
        loading="lazy"
      />
      <div>
        <p class="eyebrow">SU IDENTIDAD, SIEMPRE PRESENTE</p>
        <h2>De tu idea a nuestra comunidad.</h2>
        <p>
          La referencia original guía la apariencia de Spawny: su flor blanca,
          su gorrito de césped, sus mejillas rosadas y su mochila de aventurero.
        </p>
      </div>
    </div>
  </section>`;
}
