import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const executablePath = process.env.CHROME_PATH || undefined;
await fs.mkdir("v3-artifacts", { recursive: true });

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await desktop.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
  await desktop.locator(".brand-lockup").getByText("EU Scout", { exact: true }).waitFor();
  await desktop.locator(".tool-active").waitFor();
  await desktop.locator(".demand-card").first().waitFor();

  const health = await desktop.evaluate(async () => {
    const response = await fetch("/api/health", { cache: "no-store" });
    return { status: response.status, body: await response.json() };
  });
  await fs.writeFile("v3-artifacts/health.json", JSON.stringify(health, null, 2));
  if (health.status !== 200 || !health.body?.ok) throw new Error("Supabase health relay failed");
  if (!health.body?.integrations?.aliexpress) throw new Error("AliExpress integration is not configured");

  await desktop.screenshot({ path: "v3-artifacts/home-desktop.png", fullPage: true });

  const input = desktop.locator(".search-box textarea");
  await input.fill("εργονομική καρέκλα γραφείου μέχρι 180 ευρώ");
  await desktop.locator(".main-cta").click();
  await desktop.locator(".results-section.visible").waitFor({ timeout: 45000 });
  await desktop.waitForFunction(() => {
    return document.querySelectorAll(".product-card").length > 0 || Boolean(document.querySelector(".no-results"));
  }, undefined, { timeout: 45000 });
  const productCount = await desktop.locator(".product-card").count();
  const noResultCount = await desktop.locator(".no-results").count();
  if (productCount === 0 && noResultCount === 0) throw new Error("Search produced neither products nor safe no-result state");

  let proxiedImages = 0;
  if (productCount > 0) {
    await desktop.locator(".query-translation").waitFor({ timeout: 10000 });
    await desktop.waitForFunction(() => {
      const first = document.querySelector(".product-card img");
      return first instanceof HTMLImageElement && first.complete && first.naturalWidth > 40;
    }, undefined, { timeout: 20000 });
    proxiedImages = await desktop.locator('.product-card img[src^="/api/image?"]').count();
    if (proxiedImages === 0) throw new Error("AliExpress product media did not route through the same-origin proxy");
  }
  await desktop.screenshot({ path: "v3-artifacts/search-desktop.png", fullPage: true });

  // Back-to-school demand family flow: one click must compose context and start live search.
  await desktop.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
  const firstDemand = desktop.locator(".demand-card").first();
  await firstDemand.waitFor();
  await firstDemand.locator(".demand-items button").first().click();
  await desktop.locator(".results-section.visible").waitFor({ timeout: 45000 });
  await desktop.waitForFunction(() => {
    return document.querySelectorAll(".product-card").length > 0 || Boolean(document.querySelector(".no-results"));
  }, undefined, { timeout: 45000 });
  await desktop.screenshot({ path: "v3-artifacts/demand-desktop.png", fullPage: true });

  // Independent conversational agent with two-turn continuity.
  await desktop.locator(".chat-fab").click();
  await desktop.locator(".chat-panel").waitFor();
  const chatInput = desktop.locator(".chat-compose textarea");
  await chatInput.fill("Θέλω σχολική τσάντα για Β Γυμνασίου μέχρι 45 ευρώ");
  await desktop.locator(".chat-compose button").click();
  await desktop.locator(".bubble.assistant").last().waitFor({ timeout: 45000 });
  const assistantBefore = await desktop.locator(".bubble.assistant").count();
  await chatInput.fill("να είναι μαύρη και ελαφριά");
  await desktop.locator(".chat-compose button").click();
  await desktop.waitForFunction((count) => document.querySelectorAll(".bubble.assistant").length > count, assistantBefore, { timeout: 45000 });
  const miniCards = await desktop.locator(".mini-products.vertical a").count();
  if (miniCards > 0) {
    const first = desktop.locator(".mini-products.vertical a").first();
    const box = await first.boundingBox();
    const parent = await desktop.locator(".mini-products.vertical").first().boundingBox();
    if (!box || !parent || box.width < parent.width * 0.8) throw new Error("Chat product card is not vertically stacked/full width");
    await desktop.waitForFunction(() => {
      const image = document.querySelector(".mini-products.vertical img");
      return !(image instanceof HTMLImageElement) || (image.complete && image.naturalWidth > 20);
    }, undefined, { timeout: 15000 });
  }
  await desktop.screenshot({ path: "v3-artifacts/chat-desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
  await mobile.locator(".demand-card").first().waitFor();
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  if (overflow) throw new Error("Horizontal overflow detected on mobile");
  await mobile.screenshot({ path: "v3-artifacts/home-mobile.png", fullPage: true });

  console.log(JSON.stringify({ ok: true, health: health.body, productCount, noResultCount, proxiedImages, miniCards }, null, 2));
} finally {
  await browser.close();
}
