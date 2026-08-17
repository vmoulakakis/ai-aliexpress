import fs from "node:fs";
import process from "node:process";
import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const out = "v4-artifacts";
fs.mkdirSync(out, { recursive: true });
const researchToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const mock = {
  status: "complete",
  understood: "Κατάλαβα ότι ψάχνεις λύση για τρίχες κατοικιδίου έως 300 €.",
  query: "robot vacuum pet hair",
  warnings: [],
  analysis: { euEvidenceCount: 40, detailChecked: 8, verifiedCount: 3, rejectedIdentity: 5, hardRules: { euWarehouse: true, affiliateTrackingUrl: true, shipToCountry: "GR" } },
  products: [
    { productId: "1001", title: "Robot Vacuum Pet Hair Self Empty", imageUrl: "", price: 249, currency: "EUR", promotionLink: "https://s.click.aliexpress.com/e/test1", warehouseCountry: "ES", warehouseProofUrl: "https://www.aliexpress.com/w/wholesale-robot-vacuum.html?shipFromCountry=ES&shipTo=GR", matchScore: 94, why: "πολύ καλή αντιστοίχιση · εντός budget", verification: { euWarehouse: "verified", positiveFeedback: 97 }, decision: { strengths: ["Επιβεβαιωμένη αποθήκη ES"], limitations: ["delivery check"], verifiedFields: ["EU warehouse proof"] } },
    { productId: "1002", title: "Cordless Vacuum Pet Hair", imageUrl: "", price: 189, currency: "EUR", promotionLink: "https://s.click.aliexpress.com/e/test2", warehouseCountry: "PL", warehouseProofUrl: "https://www.aliexpress.com/w/wholesale-vacuum.html?shipFromCountry=PL&shipTo=GR", matchScore: 89, why: "καλή αντιστοίχιση", verification: { euWarehouse: "verified", positiveFeedback: 96 }, decision: { strengths: ["Επιβεβαιωμένη αποθήκη PL"], limitations: [], verifiedFields: ["EU warehouse proof"] } },
    { productId: "1003", title: "Smart Wet Dry Vacuum", imageUrl: "", price: 219, currency: "EUR", promotionLink: "https://s.click.aliexpress.com/e/test3", warehouseCountry: "FR", warehouseProofUrl: "https://www.aliexpress.com/w/wholesale-vacuum.html?shipFromCountry=FR&shipTo=GR", matchScore: 85, why: "σχετική premium λύση", verification: { euWarehouse: "verified", positiveFeedback: 95 }, decision: { strengths: ["Επιβεβαιωμένη αποθήκη FR"], limitations: [], verifiedFields: ["EU warehouse proof"] } }
  ]
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const failures = [];
for (const viewport of [{ width: 1440, height: 1000, name: "desktop" }, { width: 390, height: 844, name: "mobile" }]) {
  const page = await browser.newPage({ viewport });
  const searchBodies = [], engagementBodies = [];
  await page.route("**/api/search", async (route) => {
    try { searchBodies.push(JSON.parse(route.request().postData() || "{}")); } catch {}
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mock) });
  });
  await page.route("**/api/engagement", async (route) => {
    let body = {}; try { body = JSON.parse(route.request().postData() || "{}"); engagementBodies.push(body); } catch {}
    if (body.action === "create_research") {
      const products = (body.products || []).map((product, index) => { const { promotionLink, ...safe } = product; return { ...safe, outboundToken: `bbbbbbbbbbbbbbbbbbbbbbb${index}`, trackingPath: `/go/bbbbbbbbbbbbbbbbbbbbbbb${index}` }; });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ researchToken, briefPath: `/brief/${researchToken}`, products }) }); return;
    }
    if (body.action === "lead") { await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, emailStatus: "not_configured", briefPath: `/brief/${researchToken}`, marketingConsent: false }) }); return; }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto(base, { waitUntil: "networkidle" });
  const expect = async (condition, label) => { if (!condition) failures.push(`${viewport.name}: ${label}`); };
  const bodyText = await page.locator("body").innerText();
  await expect(bodyText.includes("AIgora"), "AIgora brand missing");
  await expect(bodyText.includes("Χωρίς εισαγωγικούς δασμούς"), "EU/no-import-duty message missing");
  const input = page.getByRole("textbox", { name: "AI semantic αναζήτηση" });
  await input.fill("τρίχες σκύλου παντού, έως 300 ευρώ");
  await expect(await page.locator(".semantic-suggestions button").count() > 0, "semantic suggestions missing");
  await page.getByRole("button", { name: /Ρώτα το AI/ }).click();
  await page.locator(".tracked-cta").first().waitFor({ state: "visible", timeout: 5000 });
  await expect(await page.locator(".result-card").count() === 3, "results not rendered");
  await expect(searchBodies.some((body) => String(body.message || "").includes("αποθήκη ΕΕ")), "EU-only phrase missing");
  await expect(engagementBodies.some((body) => body.action === "create_research"), "research snapshot not created");
  const href = await page.locator(".tracked-cta").first().getAttribute("href");
  await expect(/^\/go\//.test(href || ""), "CTA does not use first-party /go tracking");
  await page.locator(".result-card .card-actions button").first().click();
  await expect((await page.locator(".result-card .card-actions button").first().innerText()).includes("Saved"), "save interaction failed");
  await page.locator(".result-card").first().getByRole("button", { name: /Compare/ }).click();
  await expect(await page.locator(".compare-dock").isVisible(), "compare dock missing");
  await page.getByRole("button", { name: "Στείλε στο email" }).click();
  await page.locator(".offer-modal").waitFor({ state: "visible" });
  await page.locator('.offer-modal input[type="email"]').fill("user@example.com");
  await page.locator(".modal-submit").click();
  await page.locator(".lead-success").waitFor({ state: "visible" });
  await expect(engagementBodies.some((body) => body.action === "lead" && body.marketingConsent === false), "separate false marketing consent not preserved");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await expect(!overflow, "horizontal overflow");
  const unnamed = await page.locator("button").evaluateAll((buttons) => buttons.filter((button) => !(button.getAttribute("aria-label") || button.textContent || "").trim()).length);
  await expect(unnamed === 0, "unnamed clickable buttons");
  await page.screenshot({ path: `${out}/home-aigora-${viewport.name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
if (failures.length) { console.error("AIgora V4 browser smoke failed:\n" + failures.map((item) => `- ${item}`).join("\n")); process.exit(1); }
console.log("AIgora V4 browser smoke passed: semantic search + EU messaging + first-party tracking + save + compare + lead funnel on desktop/mobile.");
