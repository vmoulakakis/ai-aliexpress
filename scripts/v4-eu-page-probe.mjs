import fs from "node:fs";
import process from "node:process";
import { chromium } from "playwright";

const out = "v4-artifacts";
fs.mkdirSync(out, { recursive: true });
const countries = ["ES", "FR", "PL", "DE", "IT", "CZ"];
const query = "robot-vacuum";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const context = await browser.newContext({
  locale: "en-US",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  viewport: { width: 1440, height: 1000 },
});
let totalLinks = 0;
const evidence = [];
for (const country of countries) {
  const page = await context.newPage();
  const url = `https://www.aliexpress.com/w/wholesale-${query}.html?shipFromCountry=${country}&shipTo=GR&currency=EUR`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(5_000);
    const title = await page.title();
    const finalUrl = page.url();
    const links = await page.locator('a[href*="/item/"]').evaluateAll((nodes) => [...new Set(nodes.map((node) => node.href).filter(Boolean))]);
    const text = (await page.locator("body").innerText().catch(() => "")).slice(0, 400);
    const blocked = /captcha|security verification|unusual traffic|punish/i.test(`${title} ${text} ${finalUrl}`);
    evidence.push({ country, requestedUrl: url, finalUrl, title, productLinks: links.slice(0, 20), blocked });
    totalLinks += links.length;
    console.log(`${country}: links=${links.length}, blocked=${blocked}, title=${JSON.stringify(title)}`);
    if (links.length) {
      await page.screenshot({ path: `${out}/eu-filter-${country}.png`, fullPage: false });
      break;
    }
  } catch (error) {
    evidence.push({ country, requestedUrl: url, error: String(error) });
    console.log(`${country}: ${String(error)}`);
  } finally { await page.close(); }
}
await browser.close();
fs.writeFileSync(`${out}/eu-web-probe.json`, JSON.stringify(evidence, null, 2));
if (totalLinks < 1) {
  console.error("EU warehouse web-filter probe found no product links. The free browser-verification route is not reliable from CI and must not be used as proof of EU warehouse.");
  process.exit(1);
}
console.log(`EU warehouse web-filter probe passed with ${totalLinks} AliExpress product links from an explicit shipFromCountry filter.`);
