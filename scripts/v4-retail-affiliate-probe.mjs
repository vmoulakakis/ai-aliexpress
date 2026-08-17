import process from "node:process";
import { chromium } from "playwright";

const affiliate = "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/aliexpress-affiliate";
const url = "https://www.aliexpress.com/w/wholesale-robot-vacuum.html?shipFromCountry=ES&shipTo=GR&currency=EUR";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "en-US" });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
await page.waitForTimeout(5000);
const cards = await page.locator('a[href*="/item/"]').evaluateAll((nodes) => {
  const out = [];
  const seen = new Set();
  for (const node of nodes) {
    const a = node;
    const match = a.href.match(/\/item\/(\d+)\.html/i);
    if (!match || seen.has(match[1])) continue;
    seen.add(match[1]);
    let root = a;
    for (let i = 0; i < 5 && root.parentElement; i++) {
      const text = (root.innerText || "").trim();
      const image = root.querySelector?.("img");
      if (image && text.length > 12 && text.length < 1400) break;
      root = root.parentElement;
    }
    const image = root.querySelector?.("img") || a.querySelector?.("img");
    const text = (root.innerText || a.innerText || "").replace(/\s+/g, " ").trim();
    const title = (a.getAttribute("title") || image?.getAttribute("alt") || text.split(/€|US \$/)[0] || "").replace(/\s+/g, " ").trim();
    const priceMatch = text.match(/€\s*([0-9][0-9.,]*)/) || text.match(/([0-9][0-9.,]*)\s*€/);
    out.push({ productId: match[1], productUrl: `https://www.aliexpress.com/item/${match[1]}.html`, title: title.slice(0, 260), imageUrl: image?.src || image?.getAttribute("data-src") || "", priceText: priceMatch?.[1] || "", cardText: text.slice(0, 700), outer: root.outerHTML.slice(0, 3500) });
    if (out.length >= 6) break;
  }
  return out;
});
console.log(`Retail cards extracted: ${cards.length}`);
if (!cards.length) throw new Error("No retail cards extracted from explicit EU filter page");
let affiliateReady = 0;
for (const card of cards.slice(0, 5)) {
  const response = await fetch(affiliate, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "generate_link", productUrl: card.productUrl }) });
  const data = await response.json().catch(() => ({}));
  const promotionLink = String(data?.promotionLink || "");
  const ok = response.ok && /^https:\/\/s\.click\.aliexpress\.com\//i.test(promotionLink);
  if (ok) affiliateReady += 1;
  console.log(JSON.stringify({ productId: card.productId, title: card.title.slice(0,120), priceText: card.priceText, hasImage: /^https?:/.test(card.imageUrl), affiliateReady: ok }));
}
console.log("FIRST_CARD_HTML=" + cards[0].outer.replace(/\s+/g, " ").slice(0, 3000));
const html = await page.content();
const idx = html.indexOf(cards[0].productId);
if (idx >= 0) console.log("FIRST_ID_SOURCE_CONTEXT=" + html.slice(Math.max(0, idx - 900), idx + 2200).replace(/\s+/g, " "));
await browser.close();
if (affiliateReady < 1) throw new Error("EU retail products could not generate any official affiliate tracking URL");
console.log(`Retail EU → official affiliate link bridge passed: ${affiliateReady}/${Math.min(cards.length,5)} cards.`);
