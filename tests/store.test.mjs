import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

const KEY = "spawnly-demo-v1";
const moduleURL = new URL("../js/store.js", import.meta.url);
let memory;
let importNumber = 0;

function installStorage({ blockedRead = false, blockedWrite = false } = {}) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(key) {
        if (blockedRead) throw new Error("Storage access denied");
        return memory.get(key) ?? null;
      },
      setItem(key, value) {
        if (blockedWrite) throw new Error("Storage quota exceeded");
        memory.set(key, value);
      },
    },
  });
}
async function newRepository() {
  // Each module import represents a page reload with the same browser storage.
  const url = new URL(moduleURL);
  url.searchParams.set("test-instance", String(++importNumber));
  return (await import(url.href)).repository;
}
const postInput = {
  title: "Una aventura desde cero",
  description: "Busco compañeros para explorar un mundo nuevo juntos.",
  edition: "Java",
  mode: "Survival",
};
const groupInput = {
  name: "Amigos del Overworld",
  description: "Un grupo tranquilo para explorar y construir juntos.",
  edition: "Bedrock",
  mode: "Creativo",
};

describe("SPAWNLY local demo repository", { concurrency: false }, () => {
  beforeEach(() => {
    memory = new Map();
    installStorage();
  });

  test("starts with useful fictional content and no claimed connections", async () => {
    const repository = await newRepository();
    const people = repository.getPlayers();
    assert.equal(people.length, 8);
    assert.ok(people.some((person) => person.edition === "Java"));
    assert.ok(people.some((person) => person.edition === "Bedrock"));
    assert.ok(repository.getPosts().length >= 5);
    assert.ok(repository.getGroups().length >= 6);
    assert.deepEqual(repository.getConnections(), []);
    assert.deepEqual(repository.getInterests(), []);
    assert.deepEqual(repository.getReports(), []);
  });

  test("persists created posts and groups across page reloads", async () => {
    const repository = await newRepository();
    const post = repository.addPost(postInput);
    const group = repository.addGroup(groupInput);
    assert.equal(post.playerId, "me");
    assert.deepEqual(group.members, ["me"]);
    assert.equal(repository.isJoined(group.id), true);
    assert.equal(repository.getLastSaveOk(), true);
    const reloaded = await newRepository();
    assert.deepEqual(
      reloaded.getPosts().find((item) => item.id === post.id),
      post,
    );
    assert.deepEqual(
      reloaded.getGroups().find((item) => item.id === group.id),
      group,
    );
  });

  test("persists publication interests and removes them when toggled again", async () => {
    const repository = await newRepository();
    assert.equal(repository.isInterested("p1"), false);
    assert.equal(repository.toggleInterest("p1"), true);
    assert.equal(repository.isInterested("p1"), true);
    repository.getInterests().push("p2");
    assert.deepEqual(repository.getInterests(), ["p1"]);
    let reloaded = await newRepository();
    assert.equal(reloaded.isInterested("p1"), true);
    assert.equal(reloaded.toggleInterest("p1"), false);
    reloaded = await newRepository();
    assert.equal(reloaded.isInterested("p1"), false);
    assert.deepEqual(reloaded.getInterests(), []);
  });

  test("rejects interest in unknown or self-authored publications", async () => {
    const repository = await newRepository();
    const ownPost = repository.addPost(postInput);
    assert.throws(() => repository.toggleInterest("unknown-post"));
    assert.throws(() => repository.toggleInterest(ownPost.id), /propia/i);
    assert.deepEqual(repository.getInterests(), []);
    assert.equal(repository.getPosts()[0].id, ownPost.id);
  });

  test("migrates an older valid demo without losing saved work", async () => {
    const repository = await newRepository();
    const post = repository.addPost(postInput);
    const group = repository.addGroup(groupInput);
    repository.toggleConnection("alex");
    const saved = JSON.parse(memory.get(KEY));
    delete saved.interests;
    memory.set(KEY, JSON.stringify(saved));
    let reloaded = await newRepository();
    assert.deepEqual(reloaded.getInterests(), []);
    assert.equal(reloaded.getPosts()[0].id, post.id);
    assert.equal(reloaded.getGroups()[0].id, group.id);
    assert.equal(reloaded.isConnected("alex"), true);
    reloaded.toggleInterest("p1");
    assert.deepEqual(JSON.parse(memory.get(KEY)).interests, ["p1"]);
    reloaded = await newRepository();
    assert.equal(reloaded.getPosts()[0].id, post.id);
    assert.equal(reloaded.getGroups()[0].id, group.id);
    assert.equal(reloaded.isInterested("p1"), true);
  });

  test("rejects corrupt interest lists and invalid publication references", async () => {
    const repository = await newRepository();
    const ownPost = repository.addPost(postInput);
    const base = JSON.parse(memory.get(KEY));
    for (const interests of [null, "p1", ["p1", "p1"], ["unknown"], [ownPost.id], [null], Array(201).fill("p1")]) {
      memory.set(KEY, JSON.stringify({ ...base, interests }));
      const reloaded = await newRepository();
      assert.deepEqual(reloaded.getInterests(), []);
      assert.equal(reloaded.getPosts().length, 5);
    }
  });

  test("toggles connections and group membership without duplicate members", async () => {
    const repository = await newRepository();
    assert.equal(repository.toggleConnection("alex"), true);
    assert.equal(repository.isConnected("alex"), true);
    assert.equal(repository.toggleGroup("g1"), true);
    let reloaded = await newRepository();
    assert.equal(reloaded.isConnected("alex"), true);
    assert.equal(reloaded.isJoined("g1"), true);
    assert.equal(
      reloaded
        .getGroups()
        .find((group) => group.id === "g1")
        .members.filter((id) => id === "me").length,
      1,
    );
    assert.equal(reloaded.toggleConnection("alex"), false);
    assert.equal(reloaded.toggleGroup("g1"), false);
    reloaded = await newRepository();
    assert.equal(reloaded.isConnected("alex"), false);
    assert.equal(reloaded.isJoined("g1"), false);
  });

  test("rejects joining a full group while allowing an existing member to leave", async () => {
    const repository = await newRepository();
    repository.addGroup(groupInput);
    const saved = JSON.parse(memory.get(KEY));
    saved.groups[0].capacity = 2;
    saved.groups[0].members = ["alex", "luna"];
    memory.set(KEY, JSON.stringify(saved));
    let reloaded = await newRepository();
    assert.throws(() => reloaded.toggleGroup(saved.groups[0].id), /completo/i);
    assert.equal(reloaded.isJoined(saved.groups[0].id), false);
    saved.groups[0].members = ["alex", "me"];
    memory.set(KEY, JSON.stringify(saved));
    reloaded = await newRepository();
    assert.equal(reloaded.toggleGroup(saved.groups[0].id), false);
  });

  test("validates user input before changing the collection", async () => {
    const repository = await newRepository();
    const originalPosts = repository.getPosts();
    const invalidInputs = [
      { ...postInput, title: "  " },
      { ...postInput, title: "a".repeat(91) },
      { ...postInput, description: "corto" },
      { ...postInput, description: "a".repeat(601) },
      { ...postInput, edition: "Una edición inventada" },
      { ...postInput, mode: "Modo inexistente" },
    ];
    for (const input of invalidInputs)
      assert.throws(() => repository.addPost(input));
    assert.throws(() => repository.addPost(null));
    assert.throws(() =>
      repository.addGroup({ ...groupInput, name: "a".repeat(61) }),
    );
    assert.throws(() =>
      repository.addGroup({ ...groupInput, description: "a".repeat(401) }),
    );
    assert.deepEqual(repository.getPosts(), originalPosts);
    const created = repository.addPost({
      ...postInput,
      title: `  ${postInput.title}  `,
    });
    assert.equal(created.title, postInput.title);
  });

  test("preserves potentially unsafe user text as literal data", async () => {
    const repository = await newRepository();
    const literal = "<img src=x onerror=alert(1)>";
    const created = repository.addPost({
      ...postInput,
      title: literal,
      description: `${literal} Texto de prueba sin ejecutar.`,
    });
    const group = repository.addGroup({ ...groupInput, name: literal });
    const reloaded = await newRepository();
    assert.equal(
      reloaded.getPosts().find((item) => item.id === created.id).title,
      literal,
    );
    assert.equal(
      reloaded.getGroups().find((item) => item.id === group.id).name,
      literal,
    );
    // Browser tests cover escaping during presentation; storage must not mutate text.
  });

  test("stores reports only locally and rejects unknown targets", async () => {
    const repository = await newRepository();
    const report = repository.report({
      targetType: "profile",
      targetId: "alex",
      reason: "Comportamiento ofensivo",
    });
    assert.equal(report.targetType, "profile");
    assert.equal(report.targetId, "alex");
    assert.ok(Number.isFinite(Date.parse(report.createdAt)));
    assert.throws(() =>
      repository.report({
        targetType: "post",
        targetId: "missing-post",
        reason: "Spam o publicidad",
      }),
    );
    assert.throws(() =>
      repository.report({
        targetType: "profile",
        targetId: "alex",
        reason: "",
      }),
    );
    const reloaded = await newRepository();
    assert.deepEqual(reloaded.getReports(), [report]);
  });

  test("returns defensive copies instead of exposing mutable repository state", async () => {
    const repository = await newRepository();
    const post = repository.addPost(postInput);
    post.title = "Mutado fuera del adaptador";
    repository.getPosts()[0].title = "Otro cambio externo";
    const group = repository.addGroup(groupInput);
    group.members.length = 0;
    repository.getGroups()[0].members.push("alex");
    const players = repository.getPlayers();
    players[0].name = "Cambio externo";
    repository.toggleConnection("alex");
    repository.getConnections().push("luna");
    const report = repository.report({
      targetType: "profile",
      targetId: "alex",
      reason: "Spam o publicidad",
    });
    report.reason = "Cambio externo";
    repository.getReports()[0].reason = "Otro cambio";
    assert.equal(repository.getPosts()[0].title, postInput.title);
    assert.deepEqual(repository.getGroups()[0].members, ["me"]);
    assert.equal(repository.getPlayers()[0].name, "AlexCraft");
    assert.deepEqual(repository.getConnections(), ["alex"]);
    assert.equal(repository.getReports()[0].reason, "Spam o publicidad");
  });

  test("recovers initial demo content from malformed JSON and incompatible state", async () => {
    for (const raw of [
      "{malformed",
      "null",
      "[]",
      JSON.stringify({
        version: 999,
        posts: [],
        groups: [],
        connections: [],
        reports: [],
      }),
    ]) {
      memory.set(KEY, raw);
      const repository = await newRepository();
      assert.equal(repository.getPlayers().length, 8);
      assert.ok(repository.getPosts().length >= 5);
      assert.ok(repository.getGroups().length >= 6);
    }
  });

  test("rejects corrupt records, duplicate members and references to unknown users", async () => {
    const repository = await newRepository();
    repository.addPost(postInput);
    const base = JSON.parse(memory.get(KEY));
    const cases = [
      (state) => {
        state.posts[0].edition = "Invalid";
      },
      (state) => {
        state.groups[0].members = ["alex", "alex"];
      },
      (state) => {
        state.groups[0].members = ["unknown-player"];
      },
      (state) => {
        state.connections = ["unknown-player"];
      },
      (state) => {
        state.reports = [null];
      },
    ];
    for (const corrupt of cases) {
      const state = structuredClone(base);
      corrupt(state);
      memory.set(KEY, JSON.stringify(state));
      const reloaded = await newRepository();
      assert.equal(reloaded.getPosts().length, 5);
      assert.equal(reloaded.getGroups().length, 6);
      assert.deepEqual(reloaded.getConnections(), []);
    }
  });

  test("continues in memory when reading browser storage is blocked", async () => {
    installStorage({ blockedRead: true, blockedWrite: true });
    const repository = await newRepository();
    assert.equal(repository.getLastSaveOk(), false);
    const created = repository.addPost(postInput);
    assert.ok(repository.getPosts().some((post) => post.id === created.id));
    assert.equal(repository.getLastSaveOk(), false);
    assert.equal(memory.size, 0);
  });

  test("reports a failed save while keeping the current session useful", async () => {
    const repository = await newRepository();
    installStorage({ blockedWrite: true });
    const group = repository.addGroup(groupInput);
    assert.equal(repository.isJoined(group.id), true);
    assert.equal(repository.getLastSaveOk(), false);
    installStorage();
    repository.toggleConnection("alex");
    assert.equal(repository.getLastSaveOk(), true);
    const reloaded = await newRepository();
    assert.ok(reloaded.getGroups().some((item) => item.id === group.id));
    assert.equal(reloaded.isConnected("alex"), true);
  });

  test("reset removes created demo records without touching old Nuvix data", async () => {
    memory.set("nuvix-demo-v1", "untouched");
    const repository = await newRepository();
    repository.addPost(postInput);
    repository.addGroup(groupInput);
    repository.toggleConnection("alex");
    repository.toggleInterest("p1");
    repository.report({
      targetType: "profile",
      targetId: "alex",
      reason: "Spam o publicidad",
    });
    repository.reset();
    const reloaded = await newRepository();
    assert.equal(reloaded.getPosts().length, 5);
    assert.equal(reloaded.getGroups().length, 6);
    assert.deepEqual(reloaded.getConnections(), []);
    assert.deepEqual(reloaded.getInterests(), []);
    assert.deepEqual(reloaded.getReports(), []);
    assert.equal(memory.get("nuvix-demo-v1"), "untouched");
  });
});
