import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./social-config.js";
import { escapeHTML } from "./utils/html.js";

let instance;
export function getLiveClient() {
  if (!instance) {
    instance = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
      .then(({createClient}) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
      .catch(error => { instance = null; throw error; });
  }
  return instance;
}
export const safe = value => escapeHTML(String(value ?? ""));
export const initials = name => String(name || "Jugador").slice(0, 2).toUpperCase();
export const editionMatches = (chosen, actual) =>
  chosen === "Todas" || chosen === actual || actual === "Ambas";
export const prettyDate = value => {
  const d = new Date(value);
  return Number.isFinite(d.valueOf()) ? d.toLocaleDateString("es-EC") : "";
};
export const emptyHint = (title, subtitle) => `<div class="lp-empty"><span>✦</span><h3>${safe(title)}</h3><p>${safe(subtitle)}</p></div>`;
