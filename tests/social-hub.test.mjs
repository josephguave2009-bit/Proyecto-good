import { test } from "node:test";
import assert from "node:assert/strict";
import { socialHubView, mountSocialHub } from "../js/social-hub.js";

test("integrated social screen includes critical friend, group and chat UI", () => {
  const html = socialHubView();
  const ids = [...html.matchAll(/id='([^']+)'/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, "No duplicate HTML IDs");
  for (const expected of ["social-hub", "sh-auth", "sh-workspace", "sh-auth-form", "sh-profile-form", "sh-group-form", "sh-message-form", "sh-friends", "sh-requests", "sh-players", "sh-groups", "sh-messages"]) {
    assert.ok(ids.includes(expected), "Missing " + expected);
  }
  assert.match(html, /Spawny/);
  assert.match(html, /Amigos|amigos/i);
  assert.match(html, /grupos/i);
  assert.match(html, /Mensajes/i);
});

test("mount is a no-op when no social route is present", () => {
  const previous = globalThis.document;
  globalThis.document = { querySelector: () => null };
  try {
    const cleanup = mountSocialHub();
    assert.equal(typeof cleanup, "function");
    cleanup();
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});
