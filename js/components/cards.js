import { icon, escapeHTML as e } from "../utils/html.js";
import { repository } from "../store.js";
import { spawny } from "../../assets/spawny/manifest.js";
export const editionBadge = (edition) =>
  /* HTML */ `<span
    class="edition-badge ${edition === "Bedrock" ? "bedrock" : ""}"
    >${icon("cube", 12)} ${e(edition)}</span
  >`;
export const avatar = (player, small = false) =>
  /* HTML */ `<span
    class="voxel-avatar ${small ? "avatar-small" : ""}"
    style="--skin:${e(player.color)}"
    aria-hidden="true"
    ><span class="hair"></span><span class="eyes"></span
    ><span class="mouth"></span
  ></span>`;
export function playerCard(p) {
  const connected = repository.isConnected(p.id);
  return /* HTML */ `<article class="player-card">
    <div class="player-card-top">
      ${avatar(p)}<button
        class="icon-button connect-icon ${connected ? "is-connected" : ""}"
        data-connect="${e(p.id)}"
        aria-label="${connected ? "Quitar conexión con" : "Conectar con"} ${e(
          p.name,
        )}"
        aria-pressed="${connected}"
      >
        ${icon("heart", 18)}
      </button>
    </div>
    <div class="player-title">
      <h3>${e(p.name)}</h3>
      <span class="verified" title="Perfil ficticio de demostración"
        >${icon("check", 10)}</span
      >
    </div>
    <div class="player-meta">
      ${e(p.platform)} <span>·</span> ${e(p.language)}
    </div>
    <p class="player-bio">${e(p.bio)}</p>
    <div class="card-tags">
      ${editionBadge(p.edition)}<span class="mode-tag">${e(p.mode)}</span>
    </div>
    <div class="player-card-bottom">
      <span
        class="availability ${p.availability === "Disponible" ? "online" : ""}"
        ><i></i>${e(p.availability)}</span
      ><button class="profile-link" data-profile="${e(p.id)}">
        Ver perfil ${icon("arrow", 14)}
      </button>
    </div>
  </article>`;
}
export function groupCard(g) {
  const joined = repository.isJoined(g.id);
  return /* HTML */ `<article class="group-card">
    <button
      class="group-cover ${e(g.cover)}"
      data-group="${e(g.id)}"
      aria-label="Ver grupo ${e(g.name)}"
    >
      <img
        src="assets/${e(
          ["forest", "portal", "sky", "castle"].includes(g.cover)
            ? g.cover
            : "forest",
        )}.svg"
        alt="Paisaje de bloques de ${e(g.name)}"
        loading="lazy"
        width="600"
        height="300"
      /><span class="cover-badge"
        >${icon("users", 13)} ${g.members.length} miembros</span
      ><span class="cover-mode">${e(g.mode)}</span>
    </button>
    <div class="group-content">
      <div class="group-name">
        <h3><button data-group="${e(g.id)}">${e(g.name)}</button></h3>
        ${editionBadge(g.edition)}
      </div>
      <p>${e(g.description)}</p>
      <div class="group-bottom">
        <div class="member-avatars">
          ${g.members
            .slice(0, 3)
            .map((id) => {
              const p = repository.getPlayers().find((p) => p.id === id);
              return p ? avatar(p, true) : '<span class="you-avatar">Tú</span>';
            })
            .join("")}<span class="member-caption">Hay un lugar para ti</span>
        </div>
        <button
          class="join-button ${joined ? "joined" : ""}"
          data-join="${e(g.id)}"
          aria-pressed="${joined}"
        >
          ${joined ? icon("check", 15) : icon("plus", 15)}
          ${joined ? "Miembro" : "Unirme"}
        </button>
      </div>
    </div>
  </article>`;
}
export function postCard(p) {
  const player = repository.getPlayers().find((x) => x.id === p.playerId);
  const name = player?.name || "Tú · Demo";
  const interested = repository.isInterested(p.id);
  return /* HTML */ `<article class="post-card">
    <div class="post-author">
      ${player
        ? avatar(player, true)
        : '<span class="you-avatar">Tú</span>'}<span
        >${player
          ? /* HTML */ `<button
              class="author-profile"
              data-profile="${e(player.id)}"
            >
              ${e(name)}
            </button>`
          : /* HTML */ `<strong>${e(name)}</strong>`}<small
          >${p.playerId === "me"
            ? "Tu publicación local"
            : "Publicación de demostración"}</small
        ></span
      ><button
        class="icon-button report-trigger"
        data-report="post"
        data-id="${e(p.id)}"
        aria-label="Reportar publicación ${e(p.title)}"
      >
        ${icon("flag", 16)}
      </button>
    </div>
    <div class="card-tags">
      ${editionBadge(p.edition)}<span class="mode-tag">${e(p.mode)}</span>
    </div>
    <h3>${e(p.title)}</h3>
    <p>${e(p.description)}</p>
    <div class="post-footer">
      <span>${icon("users", 14)} Buscando compañeros</span
      ><button
        class="btn btn-secondary btn-sm ${interested ? "interest-saved" : ""}"
        data-interest="${e(p.id)}"
        aria-pressed="${interested}"
        ${p.playerId === "me" ? "disabled" : ""}
      >
        ${p.playerId === "me"
          ? "Tu publicación"
          : interested
            ? "Interés guardado"
            : "Me interesa"}
        ${icon(interested ? "check" : "arrow", 14)}
      </button>
    </div>
  </article>`;
}
export const emptyState = (
  title = "No encontramos a tu equipo… todavía",
  description = "Prueba otros filtros. Tu próxima amistad puede estar a un bloque de distancia.",
) =>
  /* HTML */ `<div class="empty-state">
    ${spawny("surprised", "empty-mascot")}
    <h3>${e(title)}</h3>
    <p>${e(description)}</p>
    <button class="btn btn-secondary" data-clear-filters>
      Restablecer filtros ${icon("arrow", 16)}
    </button>
  </div>`;
export const eventCard = (event) =>
  /* HTML */ `<article class="event-card">
    <div class="event-visual ${e(event.cover)}">
      ${icon("calendar", 29)}<span>EVENTO DEMO</span>
    </div>
    <div>
      <div class="event-date">${e(event.date)}</div>
      <h3>${e(event.title)}</h3>
      <p>${e(event.description)}</p>
      <button class="profile-link" data-event="${e(event.id)}">
        Ver evento ${icon("arrow", 14)}
      </button>
    </div>
  </article>`;
