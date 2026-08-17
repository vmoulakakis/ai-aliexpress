import process from "node:process";
import { chromium } from "playwright";

const affiliate = "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/aliexpress-affiliate";
const url = "https://www.aliexpress.com/w/wholesale-robot-vacuum.html?shipFromCountry=ES&shipTo=GR&currency=EUR";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "en-US" });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
await page.waitForTimeout(5000);
const cards = await page.locator('a[href*="/item/"]').evaluateAll((nodes) => {
  const out = []; const seen = new Set();
  for (const node of nodes) {
    const a = node; const rawHref = a.getAttribute("href") || ""; const href = a.href || rawHref;
    const display = href.match(/\/item\/(\d+)\.html/i); if (!display || seen.has(display[1])) continue; seen.add(display[1]);
    let decoded = href; try { decoded = decodeURIComponent(href); } catch {}
    const object = decoded.match(/x_object_id:(\d{8,})/i) || rawHref.match(/x_object_id%3A(\d{8,})/i);
    let root = a.closest?.(".search-item-card-wrapper-gallery") || a;
    const image = root.querySelector?.("img") || a.querySelector?.("img");
    const text = (root.innerText || a.innerText || "").replace(/\s+/g, " ").trim();
    const title = (a.getAttribute("title") || image?.getAttribute("alt") || text.split(/€|US \$/)[0] || "").replace(/\s+/g, " ").trim();
    const priceMatch = text.match(/€\s*([0-9][0-9.,]*)/) || text.match(/US\s*\$\s*([0-9][0-9.,]*)/) || text.match(/\$\s*([0-9][0-9.,]*)/);
    out.push({ displayId: display[1], canonicalId: object?.[1] || "", productUrl: `https://www.aliexpress.com/item/${display[1]}.html`, title: title.slice(0,260), imageUrl: image?.src || image?.getAttribute("data-src") || "", priceText: priceMatch?.[1] || "", cardText: text.slice(0,1000) });
    if (out.length >= 6) break;
  }
  return out;
});
console.log(`Retail cards extracted: ${cards.length}`);
if (!cards.length) throw new Error("No retail cards extracted from explicit EU filter page");
let generatedLinks=0, canonicalDetails=0;
for (const card of cards.slice(0,5)) {
  const linkResponse = await fetch(affiliate,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"generate_link",productUrl:card.productUrl})});
  const linkData = await linkResponse.json().catch(()=>({})); const linkOk=linkResponse.ok&&/^https:\/\/s\.click\.aliexpress\.com\//i.test(String(linkData?.promotionLink||"")); if(linkOk)generatedLinks++;
  let detailOk=false,detailTitle="",detailPrice=null;
  if(card.canonicalId){const detailResponse=await fetch(affiliate,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"product_detail",productId:card.canonicalId})});const detailData=await detailResponse.json().catch(()=>({}));detailOk=detailResponse.ok&&Boolean(detailData?.product?.title);if(detailOk){canonicalDetails++;detailTitle=String(detailData.product.title).slice(0,100);detailPrice=detailData.product.price??null}}
  console.log(JSON.stringify({displayId:card.displayId,canonicalId:card.canonicalId,title:card.title.slice(0,100),priceText:card.priceText,cardText:card.cardText.slice(0,220),hasImage:/^https?:/.test(card.imageUrl),affiliateLink:linkOk,canonicalDetail:detailOk,detailTitle,detailPrice}));
}
await browser.close();
if(generatedLinks<1)throw new Error("No EU retail product generated an official affiliate tracking URL");
if(canonicalDetails<1)throw new Error("No x_object_id resolved through official product_detail");
console.log(`EU proof bridge passed: generatedLinks=${generatedLinks}, canonicalDetails=${canonicalDetails}.`);
