/* Browser smoke test for the complete local SPAWNLY demo.
 * Start the static server first, then run:
 * BASE_URL=http://127.0.0.1:8000 node tests/smoke.cjs
 * Requires Playwright and Chromium; no application dependencies are installed here.
 */
const assert = require("node:assert/strict");
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({
    chromium,
  } = require("/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}
const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);
const STORAGE_KEY = "spawnly-demo-v1";
const ROUTES = {
  inicio: ".hero",
  jugadores: "#player-results",
  grupos: "#group-results",
  comunidad: "#post-results",
  spawny: ".spawny-intro",
};
const failures = [],
  checks = [];
let browser;
const check = (condition, label) => assert.ok(condition, label);

async function run() {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  // Fresh contexts keep all demo writes isolated from the user's browser data.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const monitor = (page) => {
    page.on("pageerror", (error) =>
      failures.push(`JavaScript: ${error.message}`),
    );
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().startsWith(BASE_URL + "/"))
        failures.push(`HTTP ${response.status()}: ${response.url()}`);
    });
  };
  monitor(page);
  const storage = () =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  const dialog = () => page.locator("#app-dialog");
  async function closeDialog() {
    await page.keyboard.press("Escape");
    check(
      await dialog().evaluate((element) => !element.open),
      "Escape closes the dialog",
    );
  }
  async function route(name) {
    const link =
      name === "spawny"
        ? page.locator('.site-footer a[href="#spawny"]')
        : page.locator(`.main-nav [data-route="${name}"]`);
    await link.click();
    await page.locator(ROUTES[name]).waitFor();
    check(new URL(page.url()).hash === "#" + name, `Navigation to ${name}`);
  }
  async function stage(name, task) {
    await task();
    checks.push(name);
    console.log(`PASS ${name}`);
  }
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.locator(".hero-spawny").waitFor();
  await page.screenshot({
    path: "/tmp/spawnly-home-desktop.png",
    fullPage: true,
  });
  await stage("five routes and initial content", async () => {
    check(
      await page
        .locator(".hero-spawny")
        .evaluate((image) => image.complete && image.naturalWidth > 0),
      "Hero mascot loaded",
    );
    for (const name of Object.keys(ROUTES)) await route(name);
    check(
      (await page.locator(".expression-grid article").count()) === 7,
      "Seven prepared mascot expression slots",
    );
  });
  await stage("combined player filters, empty state and reset", async () => {
    await route("jugadores");
    check(
      (await page.locator("#player-results .player-card").count()) === 8,
      "Eight fictional players",
    );
    await page.locator("#filter-edition").selectOption("Java");
    await page.locator("#filter-mode").selectOption("Hardcore");
    await page.locator("#filter-language").selectOption("Inglés");
    await page.locator("#filter-availability").selectOption("Disponible");
    await page.locator("#player-search").fill("rio");
    check(
      (await page.locator("#player-results .player-card").count()) === 1,
      "All five player filters combine",
    );
    check(
      (await page.locator("#player-results").textContent()).includes(
        "RioRedstone",
      ),
      "Correct combined filter match",
    );
    await page.locator("#player-search").fill("a-player-that-does-not-exist");
    await page.locator("#player-results .empty-state").waitFor();
    check(
      (await page.locator("#player-results .empty-state img").count()) === 1,
      "Personalized Spawny empty state",
    );
    await page.locator("#player-results [data-clear-filters]").click();
    check(
      (await page.locator("#player-results .player-card").count()) === 8,
      "Reset restores every player",
    );
    await page.locator('[data-connect="alex"]').click();
    check(
      (await page.evaluate(() =>
        document.activeElement?.getAttribute("data-connect"),
      )) === "alex",
      "Connection toggle retains keyboard focus after rerender",
    );
    await page.locator('[data-connect="alex"]').click();
  });
  await stage(
    "full profiles, connections and profile reports persist",
    async () => {
      await page.locator('[data-profile="rio"]').click();
      check(
        (await dialog().textContent()).includes("Horario habitual"),
        "Full profile has schedule",
      );
      check(
        (await dialog().textContent()).includes("Plataforma"),
        "Full profile has platform",
      );
      await page.locator('[data-dialog-connect="rio"]').click();
      check(
        (await page
          .locator('[data-dialog-connect="rio"]')
          .getAttribute("aria-pressed")) === "true",
        "Connect action changes state",
      );
      await closeDialog();
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("data-profile") === "rio",
      );
      check(
        (await page.evaluate(() =>
          document.activeElement?.getAttribute("data-profile"),
        )) === "rio",
        "Escape returns focus to profile trigger after connecting",
      );
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('[data-profile="rio"]').click();
      check(
        (await page
          .locator('[data-dialog-connect="rio"]')
          .getAttribute("aria-pressed")) === "true",
        "Connection survives reload",
      );
      await page.locator("[data-dialog-report]").click();
      await dialog().locator('[type="submit"]').click();
      check(
        await page.locator("[data-form-error]").isVisible(),
        "Report requires a reason",
      );
      await page
        .locator('[name="reason"]')
        .selectOption("Comportamiento ofensivo");
      await dialog().locator('[type="submit"]').click();
      check(
        (await storage()).reports.some(
          (report) =>
            report.targetType === "profile" && report.targetId === "rio",
        ),
        "Profile report saved locally",
      );
    },
  );
  const attack = '<img src=x onerror="window.__spawnlyXSS=1">';
  await stage(
    "community filters, interest and validated escaped post creation",
    async () => {
      await route("comunidad");
      check(
        (await page.locator("#post-results .post-card").count()) === 5,
        "Five seed posts",
      );
      await page.locator("#post-edition").selectOption("Bedrock");
      await page.locator("#post-mode").selectOption("Skyblock");
      await page.locator("#post-search").fill("isla");
      check(
        (await page.locator("#post-results .post-card").count()) === 1,
        "Combined post filters",
      );
      await page.locator('#post-results [data-interest="p4"]').click();
      check(
        (await page
          .locator('#post-results [data-interest="p4"]')
          .getAttribute("aria-pressed")) === "true",
        "Post interest is saved",
      );
      await page.reload({ waitUntil: "networkidle" });
      check(
        (await page
          .locator('#post-results [data-interest="p4"]')
          .getAttribute("aria-pressed")) === "true",
        "Post interest survives reload",
      );
      await page.locator('#post-results [data-profile="maya"]').click();
      check(
        (await dialog().textContent()).includes("MayaSky"),
        "Author button opens the profile",
      );
      await closeDialog();
      await page.locator('[data-create="post"]').first().click();
      await page.locator('[name="title"]').fill("   ");
      await dialog()
        .locator('[name="description"]')
        .fill(
          "Una descripción de prueba que no contiene información personal.",
        );
      await dialog().locator('[type="submit"]').click();
      check(
        await page.locator("[data-form-error]").isVisible(),
        "Whitespace-only title rejected",
      );
      check((await storage()).posts.length === 5, "Invalid post not saved");
      await page.evaluate(() => {
        window.__spawnlyXSS = 0;
      });
      await page.locator('[name="title"]').fill(attack);
      await page.locator('[name="edition"]').selectOption("Java");
      await page.locator('[name="mode"]').selectOption("Survival");
      await dialog().locator('[type="submit"]').click();
      await page.locator("#post-results .post-card").first().waitFor();
      check(
        (await page.locator("#post-results .post-card").count()) === 6,
        "New post visible and prior filters cleared",
      );
      check(
        (await page
          .locator("#post-results .post-card h3")
          .first()
          .textContent()) === attack,
        "User HTML rendered as literal text",
      );
      check(
        (await page.locator("#post-results .post-card h3 img").count()) === 0,
        "No HTML element injected",
      );
      check(
        (await page.evaluate(() => window.__spawnlyXSS)) === 0,
        "XSS sentinel unchanged",
      );
      check(
        (await page.locator("#toast-region").textContent()).includes(
          "Búsqueda publicada",
        ),
        "Confirmation notification shown",
      );
      await page.reload({ waitUntil: "networkidle" });
      check(
        (await page.locator("#post-results .post-card").count()) === 6,
        "Created post survives reload",
      );
      await page.locator('#post-results [data-report="post"]').first().click();
      await page.locator('[name="reason"]').selectOption("Spam o publicidad");
      await dialog().locator('[type="submit"]').click();
      check(
        (await storage()).reports.some(
          (report) => report.targetType === "post",
        ),
        "Post report saved locally",
      );
    },
  );
  await stage(
    "groups creation, members, filtering, joining and leaving persist",
    async () => {
      await route("grupos");
      check(
        (await page.locator("#group-results .group-card").count()) === 6,
        "Six seed groups",
      );
      await page.locator(".skip-link").focus();
      await page.keyboard.press("Enter");
      check(
        new URL(page.url()).hash === "#grupos",
        "Skip link preserves current route",
      );
      check(
        (await page.evaluate(() => document.activeElement?.id)) ===
          "main-content",
        "Skip link focuses the main content",
      );
      await page.locator('[data-create="group"]').click();
      await page.locator('[name="title"]').fill("Equipo smoke de aventuras");
      await dialog()
        .locator('[name="description"]')
        .fill("Un grupo de demostración creado por la prueba del navegador.");
      await page.locator('[name="edition"]').selectOption("Java");
      await page.locator('[name="mode"]').selectOption("Survival");
      await dialog().locator('[type="submit"]').click();
      check(
        (await page.locator("#group-results .group-card").count()) === 7,
        "Created group visible",
      );
      const created = (await storage()).groups.find(
        (group) => group.name === "Equipo smoke de aventuras",
      );
      check(created.members.includes("me"), "Creator becomes group member");
      await page
        .locator(`#group-results .group-cover[data-group="${created.id}"]`)
        .click();
      check(
        (await page.locator(".member-row").count()) === 1,
        "Group shows its actual members",
      );
      check(
        (await dialog().textContent()).includes("Tú · Perfil de demostración"),
        "Demo user identified explicitly",
      );
      await page.locator("[data-dialog-join]").click();
      check(
        (await page
          .locator("[data-dialog-join]")
          .getAttribute("aria-pressed")) === "false",
        "Leave group inside dialog",
      );
      await page.locator("[data-dialog-join]").click();
      await closeDialog();
      await page.reload({ waitUntil: "networkidle" });
      check(
        (await page
          .locator(`[data-join="${created.id}"]`)
          .getAttribute("aria-pressed")) === "true",
        "Created group membership survives reload",
      );
      await page.locator('[data-join="g1"]').click();
      await page.reload({ waitUntil: "networkidle" });
      check(
        (await page
          .locator('[data-join="g1"]')
          .getAttribute("aria-pressed")) === "true",
        "Join seed group persists",
      );
      await page.locator('[data-join="g1"]').click();
      await page.reload({ waitUntil: "networkidle" });
      check(
        (await page
          .locator('[data-join="g1"]')
          .getAttribute("aria-pressed")) === "false",
        "Leave seed group persists",
      );
      await page.locator('[data-group-edition="Bedrock"]').click();
      check(
        (await page.locator("#group-results .group-card").count()) === 3,
        "Group edition filter",
      );
      await page.locator("#group-search").fill("no matching group");
      await page.locator("#group-results .empty-state").waitFor();
      await page.locator("#group-results [data-clear-filters]").click();
      check(
        (await page.locator("#group-results .group-card").count()) === 7,
        "Empty group filters reset",
      );
    },
  );
  await stage(
    "honest auth, community rules, privacy, welcome and events",
    async () => {
      for (const mode of ["login", "register"]) {
        await page.locator(`[data-auth="${mode}"]`).click();
        check(
          (await dialog().locator("input").count()) === 0,
          "Demo auth asks for no credentials",
        );
        check(
          (await dialog().textContent()).includes("sin registrarte"),
          "Auth explains local demonstration",
        );
        await page.locator("[data-demo-continue]").click();
      }
      await page.locator('.site-footer [data-info="rules"]').click();
      check(
        (await page.locator(".community-rules li").count()) >= 5,
        "Community rules present",
      );
      await closeDialog();
      await page.locator('.site-footer [data-info="privacy"]').click();
      check(
        (await dialog().textContent()).includes("bloqueo de usuarios"),
        "Blocking explained as future functionality",
      );
      await closeDialog();
      await page.locator('[data-info="welcome"]').click();
      check(
        (await dialog().locator(".spawny-small").count()) === 1,
        "Welcome includes Spawny",
      );
      await closeDialog();
      await route("comunidad");
      await page.locator("[data-event]").first().click();
      check(
        (await dialog().textContent()).includes("EVENTO DE DEMOSTRACIÓN"),
        "Event is explicitly fictitious",
      );
      check(
        (await dialog().textContent()).includes("No hay una inscripción real"),
        "No simulated real event registration",
      );
      await closeDialog();
    },
  );
  await stage(
    "reset requires confirmation and preserves unrelated local data",
    async () => {
      await page.evaluate(() =>
        localStorage.setItem("nuvix-demo-v1", '{"untouched":true}'),
      );
      const before = JSON.stringify(await storage());
      await page.locator("[data-reset]").click();
      await page.locator("#app-dialog [data-dialog-close]").last().click();
      check(
        JSON.stringify(await storage()) === before,
        "Cancel preserves demo data",
      );
      await page.locator("[data-reset]").click();
      await page.locator("[data-confirm-reset]").click();
      const reset = await storage();
      check(
        reset.posts.length === 5 && reset.groups.length === 6,
        "Reset restores seed posts and groups",
      );
      check(
        reset.connections.length === 0 &&
          reset.reports.length === 0 &&
          reset.interests.length === 0,
        "Reset clears connections, interests and reports",
      );
      check(
        (await page.evaluate(() => localStorage.getItem("nuvix-demo-v1"))) ===
          '{"untouched":true}',
        "Unrelated Nuvix data preserved",
      );
    },
  );
  await stage(
    "mobile 390px and 320px, all routes and menu interactions",
    async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const mobile = await mobileContext.newPage();
      monitor(mobile);
      await mobile.goto(BASE_URL, { waitUntil: "networkidle" });
      await mobile.screenshot({
        path: "/tmp/spawnly-home-mobile.png",
        fullPage: true,
      });
      for (const width of [390, 320]) {
        await mobile.setViewportSize({ width, height: 844 });
        for (const name of Object.keys(ROUTES)) {
          if (name === "spawny")
            await mobile.locator('.site-footer a[href="#spawny"]').click();
          else {
            await mobile.locator(".menu-button").click();
            check(
              (await mobile
                .locator(".menu-button")
                .getAttribute("aria-expanded")) === "true",
              "Mobile menu opens",
            );
            await mobile.locator(`.main-nav [data-route="${name}"]`).click();
          }
          await mobile.locator(ROUTES[name]).waitFor();
          check(
            (await mobile
              .locator(".menu-button")
              .getAttribute("aria-expanded")) === "false",
            "Navigation closes mobile menu",
          );
          const sizing = await mobile.evaluate(() => ({
            viewport: innerWidth,
            content: document.documentElement.scrollWidth,
          }));
          check(
            sizing.content <= sizing.viewport,
            `No horizontal overflow at ${width}px on ${name}: ${JSON.stringify(sizing)}`,
          );
        }
      }
      await mobileContext.close();
    },
  );
  check(failures.length === 0, failures.join("\n"));
  await context.close();
  console.log(
    `\n${checks.length} smoke scenarios passed. No JavaScript errors or failed app HTTP requests.`,
  );
  console.log(
    "Screenshots: /tmp/spawnly-home-desktop.png and /tmp/spawnly-home-mobile.png",
  );
}
run()
  .catch((error) => {
    console.error("\nFAIL", error.stack || error);
    if (failures.length) console.error(failures.join("\n"));
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });
