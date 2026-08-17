import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const executablePath = process.env.CHROME_PATH || undefined;
await fs.mkdir("v3-artifacts", { recursive: true });

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await desktop.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
  await desktop.getByText("AIgora", { exact: true }).first().waitFor();
  await desktop.locator(".demand-card").first().waitFor();

  const bodyText = await desktop.locator("body").innerText();
  if (!bodyText.includes("Χωρίς εισαγωγικούς δασμούς")) throw new Error("EU/no-import-duty homepage message missing");

  const health = await desktop.evaluate(async () => {
    const response = await fetch("/api/health", { cache: "no-store" });
    return { status: response.status, body: await response.json() };
  });
  await fs.writeFile("v3-artifacts/health.json", JSON.stringify(health, null, 2));
  if (health.status !== 200 || !health.body?.ok) throw new Error("Supabase health relay failed");
  if (!health.body?.integrations?.aliexpress) throw new Error("AliExpress integration is not configured");

  await desktop.screenshot({ path: "v3-artifacts/home-desktop.png", fullPage: true });

  const input = desktop.getByRole("textbox", { name: "AI semantic αναζήτηση" });
  await input.fill("εργονομική καρέκλα γραφείου μέχρι 180 ευρώ");
  await desktop.locator(".hero-search .search-submit").click();
  await desktop.locator("#results.visible").waitFor({ timeout: 45000 });
  await desktop.waitForFunction(() => {
    return document.querySelectorAll(".result-card").length > 0 || Boolean(document.querySelector(".empty-state")) || Boolean(document.querySelector(".error-box"));
  }, undefined, { timeout: 45000 });
  const productCount = await desktop.locator(".result-card").count();
  const safeStateCount = await desktop.locator(".empty-state, .error-box").count();
  if (productCount === 0 && safeStateCount === 0) throw new Error("Search produced neither products nor a safe recovery/error state");

  let proxiedImages = 0;
  if (productCount > 0) {
    await desktop.waitForFunction(() => {
      const first = document.querySelector(".result-card img");
      return !(first instanceof HTMLImageElement) || (first.complete && first.naturalWidth > 20);
    }, undefined, { timeout: 20000 });
    proxiedImages = await desktop.locator('.result-card img[src^="/api/image?"]').count();
  }
  await desktop.screenshot({ path: "v3-artifacts/search-desktop.png", fullPage: true });

  await desktop.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
  const firstDemand = desktop.locator(".demand-card").first();
  await firstDemand.waitFor();
  await firstDemand.click();
  await desktop.locator("#results.visible").waitFor({ timeout: 45000 });
  await desktop.screenshot({ path: "v3-artifacts/demand-desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
  await mobile.getByText("AIgora", { exact: true }).first().waitFor();
  await mobile.locator(".demand-card").first().waitFor();
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  if (overflow) throw new Error("Horizontal overflow detected on mobile");
  await mobile.screenshot({ path: "v3-artifacts/home-mobile.png", fullPage: true });

  console.log(JSON.stringify({ ok: true, health: health.body, productCount, safeStateCount, proxiedImages }, null, 2));
} finally {
  await browser.close();
}
