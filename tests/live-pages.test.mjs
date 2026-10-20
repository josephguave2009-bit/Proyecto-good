import { test } from "node:test";
import assert from "node:assert/strict";
import { livePlayersView, mountLivePlayers } from "../js/live-players.js";
import { liveGroupsView, mountLiveGroups } from "../js/live-groups.js";
import { mountLiveHome } from "../js/live-home.js";
import { editionMatches, safe, initials, emptyHint } from "../js/live-core.js";
import { home } from "../js/pages/views.js";

test("Real player discovery offers Supabase-backed search, filters and profile buttons", () => {
  const view = livePlayersView();
  assert.match(view, /id="live-players"/);
  assert.match(view, /id="lp-search"/);
  assert.match(view, /id="lp-edition"/);
  assert.match(view, /id="lp-player-list"/);
  assert.match(view, /registra|jugadores reales|jugadores registrados/i);
  assert.doesNotMatch(view, /jugadores de demo|perfiles ficticios/);
});

test("Real groups screen contains creation, membership and a live group-chat form", () => {
  const view = liveGroupsView();
  for (const id of ["live-groups","lg-create-form","lg-chat-panel","lg-chat-form","lg-chat-messages","lg-results"]) {
    assert.ok(view.includes('id="'+id+'"'), "Missing #" + id);
  }
  assert.match(view, /Un equipo|aventuras/i);
  assert.doesNotMatch(view, /demostración|ficticio/);
});

test("Home is ready for real users, groups, and shared posts, not the demo list", () => {
  const view = home();
  for (const id of ["home-player-results","home-group-results","home-post-results"]) {
    assert.ok(view.includes('id="'+id+'"'), "Missing home placeholder " + id);
  }
  assert.ok(view.includes("Cargando jugadores reales"));
  assert.doesNotMatch(view, /DEMO INTERACTIVA/);
  assert.doesNotMatch(view, /Jugadores de demo/);
});

test("Live mounting without corresponding route is safe and returns a cleanup function", () => {
  const previous=globalThis.document;
  globalThis.document={ querySelector:() => null };
  try {
    for (const mount of [mountLivePlayers,mountLiveGroups,mountLiveHome]) {
      const cleanup=mount();
      assert.equal(typeof cleanup,"function");
      cleanup();
    }
  } finally {
    if(previous===undefined)delete globalThis.document; else globalThis.document=previous;
  }
});

test("Edition filters include players using both Java and Bedrock", () => {
  assert.equal(editionMatches("Java","Ambas"),true);
  assert.equal(editionMatches("Bedrock","Ambas"),true);
  assert.equal(editionMatches("Bedrock","Java"),false);
  assert.equal(editionMatches("Todas","Java"),true);
});

test("Safe card labels escape HTML, including malicious player display names", () => {
  assert.equal(safe('<script>alert("x")</script>'),'&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(initials("Joseph"),"JO");
  assert.match(emptyHint("<b>Hola</b>","ok"),/&lt;b&gt;Hola&lt;\/b&gt;/);
});
