import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { relationshipFor, openPlayerProfile } from "../js/player-profile.js";

const me = "a92cc24b-72fb-48f7-9432-04a8d7ff4f8b";
const other = "fb216f35-c0a2-4ad2-bca1-5d311323177e";
const row = (sender, receiver, status, id = "r-1") =>
  ({ id, sender_id: sender, receiver_id: receiver, status });

test("own profile and logged-out visitors do not get an add-friend action", () => {
  assert.equal(relationshipFor([], me, me).kind, "self");
  assert.equal(relationshipFor([], null, other).kind, "login");
  assert.equal(relationshipFor([], me, null).kind, "login");
});

test("a player may send one new invitation only when there is no existing relationship", () => {
  assert.equal(relationshipFor([], me, other).kind, "none");
  assert.equal(relationshipFor([row(me, other, "pending")], me, other).kind, "outgoing");
});

test("incoming requests can be accepted from the profile directly", () => {
  assert.deepEqual(relationshipFor([row(other, me, "pending", "incoming1")], me, other),
    { kind: "incoming", requestId: "incoming1" });
});

test("accepted relationship wins if another pending request also exists", () => {
  assert.equal(relationshipFor([
    row(other, me, "pending", "in"),
    row(me, other, "accepted", "yes")
  ], me, other).kind, "friends");
});

test("rejected and unrelated requests are not treated as fresh invitations", () => {
  assert.equal(relationshipFor([row(me, other, "rejected")], me, other).kind, "rejected");
  assert.equal(relationshipFor([row(me, "someone-else", "accepted")], me, other).kind, "none");
});

test("the public profile is exported and both live surfaces point to it", () => {
  assert.equal(typeof openPlayerProfile, "function");
  const community = readFileSync(new URL("../js/community-live.js", import.meta.url), "utf8");
  const social = readFileSync(new URL("../js/social-hub.js", import.meta.url), "utf8");
  assert.match(community, /data-cl-profile/);
  assert.match(community, /openPlayerProfile/);
  assert.match(social, /openPlayerProfile/);
});
