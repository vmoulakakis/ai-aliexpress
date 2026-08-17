import fs from "node:fs";
import process from "node:process";
import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const out = "v4-artifacts";
fs.mkdirSync(out, { recursive: true });

const mock = {
  status: "complete",
  understood: "Κατάλαβα ότι ψάχνεις λύση για τρίχες κατοικιδίου έως 300 €.",
  query: "robot vacuum pet hair",
  warnings: [],
  products: [
    { productId: "1001", title: "Robot Vacuum Pet Hair Self Empty", imageUrl: "", price: 249, currency: "EUR", promotionLink: "https://s.click.aliexpress.com/e/test1", matchScore: 94, why: "πολύ καλή αντιστοίχιση · εντός budget", verification: { euWarehouse: "verified", freeShipping: "verified", positiveFeedback: 97 } },
    { productId: "1002", title: "Cordless Vacuum Pet Hair", imageUrl: "", price: 189, currency: "EUR", promotionLink: "https://s.click.aliexpress.com/e/test2", matchScore: 89, why: "καλή αντιστοίχιση · EU fulfilment", verification: { euWarehouse: "verified", freeShipping: "verified", positiveFeedback: 96 } },
    { productId: "1003", title: "Smart Wet Dry Vacuum", imageUrl: "", price: 219, currency: "EUR", promotionLink: "https://s.click.aliexpress.com/e/test3", matchScore: 85, why: "σχετική premium λύση", verification: { euWarehouse: "verified", freeShipping: "unknown", positiveFeedback: 95 } }
  ]
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
let failures = [];
for (const viewport of [{ width: 1440, height: 1000, name: "desktop" }, { width: 390, height: 844, name: "mobile" }]) {
  const page = await browser.newPage({ viewport });
  const requestBodies = [];
  await page.route("**/api/search", async (route) => {
    const request = route.request();
    try { requestBodies.push(JSON.parse(request.postData() || "{}")); } catch {}
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mock) });
  });
  await page.goto(base, { waitUntil: "networkidle" });
  const expect = async (condition, label) => { if (!condition) failures.push(`${viewport.name}: ${label}`); };
  await expect((await page.locator("body").innerText()).includes("ΒρεςΜου"), "brand missing");
  await expect(await page.getByRole("textbox", { name: "AI semantic αναζήτηση" }).isVisible(), "search not visible");
  await page.getByRole("textbox", { name: "AI semantic αναζήτηση" }).fill("τρίχες σκύλου παντού, έως 300 ευρώ");
  await page.getByRole("button", { name: /Βρες μου λύση/ }).click();
  await page.locator("#results").waitFor({ state: "visible" });
  await expect(await page.locator(".result-card").count() === 3, "mock results not rendered");
  await expect(requestBodies.some((body) => String(body.message || "").includes("αποθήκη ΕΕ")), "EU-only requirement not sent");
  const firstAffiliate = page.locator(".result-card a").first();
  await expect((await firstAffiliate.getAttribute("rel") || "").includes("sponsored"), "affiliate disclosure rel missing");
  await expect(await page.locator(".demand-card").count() === 6, "demand cards missing");
  await expect(await page.locator(".premium-card").count() === 3, "premium cards missing");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await expect(!overflow, "horizontal overflow");
  const unnamed = await page.locator("button").evaluateAll((buttons) => buttons.filter((button) => !(button.getAttribute("aria-label") || button.textContent || "").trim()).length);
  await expect(unnamed === 0, "unnamed clickable buttons");
  await page.screenshot({ path: `${out}/home-${viewport.name}.png`, fullPage: true });
  await page.close();
}
await browser.close();

if (failures.length) {
  console.error("V4 browser smoke failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("V4 browser smoke passed: desktop + mobile + semantic search + EU requirement + clickable cards.");
