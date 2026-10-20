import { players, seedPosts, seedGroups, editions, modes } from "./data.js";

// Local demo adapter. Replace this boundary with authenticated API requests later.
// A real backend must enforce permissions, validation, moderation and privacy itself.
const KEY = "spawnly-demo-v1";
const VERSION = 1;
const ME = "me";
const MAX_POSTS = 200;
const MAX_GROUPS = 100;
const MAX_REPORTS = 100;
const knownPlayers = new Set([...players.map((player) => player.id), ME]);
const covers = ["forest", "portal", "sky", "castle"];
const clone = (value) => structuredClone(value);
const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value, min, max) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.length <= max;
const id = (value) =>
  typeof value === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(value);
const date = (value) =>
  typeof value === "string" &&
  value.length <= 30 &&
  Number.isFinite(Date.parse(value));
const unique = (list) => new Set(list).size === list.length;
const validPost = (p) =>
  isObject(p) &&
  id(p.id) &&
  knownPlayers.has(p.playerId) &&
  text(p.title, 3, 90) &&
  text(p.description, 10, 600) &&
  editions.includes(p.edition) &&
  modes.includes(p.mode) &&
  date(p.createdAt);
const validGroup = (g) =>
  isObject(g) &&
  id(g.id) &&
  text(g.name, 3, 60) &&
  text(g.description, 10, 400) &&
  editions.includes(g.edition) &&
  modes.includes(g.mode) &&
  covers.includes(g.cover) &&
  Number.isInteger(g.capacity) &&
  g.capacity >= 2 &&
  g.capacity <= 100 &&
  Array.isArray(g.members) &&
  g.members.length <= g.capacity &&
  unique(g.members) &&
  g.members.every((member) => knownPlayers.has(member));
const validReport = (r) =>
  isObject(r) &&
  id(r.id) &&
  ["profile", "post", "group"].includes(r.targetType) &&
  id(r.targetId) &&
  text(r.reason, 3, 300) &&
  date(r.createdAt);
const validState = (s) =>
  isObject(s) &&
  s.version === VERSION &&
  Array.isArray(s.posts) &&
  s.posts.length <= MAX_POSTS &&
  s.posts.every(validPost) &&
  unique(s.posts.map((p) => p.id)) &&
  Array.isArray(s.groups) &&
  s.groups.length <= MAX_GROUPS &&
  s.groups.every(validGroup) &&
  unique(s.groups.map((g) => g.id)) &&
  Array.isArray(s.connections) &&
  s.connections.length <= players.length &&
  s.connections.every((p) => knownPlayers.has(p) && p !== ME) &&
  unique(s.connections) &&
  Array.isArray(s.interests) &&
  s.interests.length <= MAX_POSTS &&
  unique(s.interests) &&
  s.interests.every((postId) =>
    s.posts.some((post) => post.id === postId && post.playerId !== ME),
  ) &&
  Array.isArray(s.reports) &&
  s.reports.length <= MAX_REPORTS &&
  s.reports.every(validReport) &&
  unique(s.reports.map((r) => r.id));
const fresh = () => ({
  version: VERSION,
  posts: clone(seedPosts),
  groups: clone(seedGroups),
  connections: [],
  interests: [],
  reports: [],
});
let lastSaveOk = true;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    // Bound parsing work; this demo has a small, intentionally limited data model.
    if (raw.length > 500000) return fresh();
    const value = JSON.parse(raw);
    // Existing valid demos predate interests. Migrate only the missing field;
    // keep posts, groups and other saved actions intact, then validate normally.
    if (isObject(value) && !Object.hasOwn(value, "interests"))
      value.interests = [];
    return validState(value) ? value : fresh();
  } catch {
    lastSaveOk = false;
    return fresh();
  }
}
let state = load();
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    lastSaveOk = true;
  } catch {
    lastSaveOk = false;
  }
}
function field(value, label, min, max) {
  if (typeof value !== "string") throw new Error(`Completa ${label}.`);
  const result = value.trim();
  if (!text(result, min, max))
    throw new Error(`${label} debe tener entre ${min} y ${max} caracteres.`);
  return result;
}
function common(input) {
  if (!isObject(input)) throw new Error("Revisa los datos del formulario.");
  if (!editions.includes(input.edition))
    throw new Error("Selecciona Java o Bedrock.");
  if (!modes.includes(input.mode))
    throw new Error("Selecciona una modalidad válida.");
  return { edition: input.edition, mode: input.mode };
}
function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}
export const repository = {
  getPlayers: () => clone(players),
  getPosts: () => clone(state.posts),
  getGroups: () => clone(state.groups),
  getConnections: () => [...state.connections],
  getInterests: () => [...state.interests],
  getReports: () => clone(state.reports),
  getLastSaveOk: () => lastSaveOk,
  isConnected: (playerId) => state.connections.includes(playerId),
  isInterested: (postId) => state.interests.includes(postId),
  isJoined: (groupId) =>
    Boolean(
      state.groups.find((group) => group.id === groupId)?.members.includes(ME),
    ),
  toggleConnection(playerId) {
    if (!knownPlayers.has(playerId) || playerId === ME)
      throw new Error("Este perfil no está disponible.");
    const connected = state.connections.includes(playerId);
    state.connections = connected
      ? state.connections.filter((value) => value !== playerId)
      : [...state.connections, playerId];
    persist();
    return !connected;
  },
  toggleInterest(postId) {
    const post = state.posts.find((value) => value.id === postId);
    if (!post) throw new Error("Esta publicación ya no está disponible.");
    if (post.playerId === ME)
      throw new Error("Esta es tu propia publicación de demostración.");
    const interested = state.interests.includes(postId);
    state.interests = interested
      ? state.interests.filter((value) => value !== postId)
      : [...state.interests, postId];
    persist();
    return !interested;
  },
  toggleGroup(groupId) {
    const group = state.groups.find((value) => value.id === groupId);
    if (!group) throw new Error("No encontramos este grupo.");
    const joined = group.members.includes(ME);
    if (!joined && group.members.length >= group.capacity)
      throw new Error("Este grupo ya está completo.");
    group.members = joined
      ? group.members.filter((value) => value !== ME)
      : [...group.members, ME];
    persist();
    return !joined;
  },
  addPost(input) {
    const fields = common(input);
    if (state.posts.length >= MAX_POSTS)
      throw new Error(
        "La demo admite hasta 200 publicaciones. Restablece los datos para empezar de nuevo.",
      );
    const post = {
      id: createId("p"),
      playerId: ME,
      title: field(input.title, "El título", 3, 90),
      description: field(input.description, "La descripción", 10, 600),
      ...fields,
      createdAt: new Date().toISOString(),
    };
    state.posts.unshift(post);
    persist();
    return clone(post);
  },
  addGroup(input) {
    const fields = common(input);
    if (state.groups.length >= MAX_GROUPS)
      throw new Error(
        "La demo admite hasta 100 grupos. Restablece los datos para empezar de nuevo.",
      );
    const group = {
      id: createId("g"),
      name: field(input.name, "El nombre", 3, 60),
      description: field(input.description, "La descripción", 10, 400),
      ...fields,
      members: [ME],
      cover: covers[state.groups.length % covers.length],
      capacity: 12,
    };
    state.groups.unshift(group);
    persist();
    return clone(group);
  },
  report(input) {
    if (!isObject(input)) throw new Error("Completa el reporte.");
    const targetType =
      input.targetType === "player" ? "profile" : input.targetType;
    const exists =
      targetType === "profile"
        ? knownPlayers.has(input.targetId)
        : targetType === "post"
          ? state.posts.some((p) => p.id === input.targetId)
          : targetType === "group" &&
            state.groups.some((g) => g.id === input.targetId);
    if (!exists || !id(input.targetId))
      throw new Error("El contenido que quieres reportar no está disponible.");
    const reason = field(input.reason, "El motivo", 3, 300);
    if (state.reports.length >= MAX_REPORTS)
      throw new Error("Has alcanzado el límite de reportes de esta demo.");
    const report = {
      id: createId("r"),
      targetType,
      targetId: input.targetId,
      reason,
      createdAt: new Date().toISOString(),
    };
    state.reports.unshift(report);
    persist();
    return clone(report);
  },
  reset() {
    state = fresh();
    persist();
    return true;
  },
};
