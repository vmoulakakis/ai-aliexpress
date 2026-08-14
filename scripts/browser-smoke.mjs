import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const fail = (message) => { throw new Error(message); };
const chrome = process.env.CHROME_PATH;
if (!chrome) fail('CHROME_PATH is required');

const out = path.resolve('visual-artifacts');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
});

const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(String(err)));
page.on('console', msg => { if (msg.type() === 'error') console.log('BROWSER_CONSOLE_ERROR', msg.text()); });

async function noHorizontalOverflow(label) {
  const dims = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  if (dims.sw > dims.cw + 1) fail(`${label}: horizontal overflow ${dims.sw} > ${dims.cw}`);
}

await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForSelector('#searchBtn');
await noHorizontalOverflow('desktop home');

await page.$eval('#query', el => { el.value = 'Θέλω εργονομική καρέκλα γραφείου μέχρι 180 ευρώ'; el.dispatchEvent(new Event('input', { bubbles: true })); });
await page.click('#searchBtn');
await page.waitForFunction(() => document.querySelectorAll('.product').length > 0 || document.querySelector('#empty')?.classList.contains('visible') || document.querySelector('#notice')?.classList.contains('visible'), { timeout: 35000 });

const searchState = await page.evaluate(() => ({
  products: [...document.querySelectorAll('.product')].map(card => ({
    title: card.querySelector('.product-title')?.textContent?.trim() || '',
    price: card.querySelector('.price')?.textContent?.trim() || '',
    match: card.querySelector('.match-label')?.textContent?.trim() || '',
    why: card.querySelector('.why')?.textContent?.trim() || ''
  })),
  intentVisible: document.querySelector('#intentPanel')?.classList.contains('visible') || false,
  affiliateVisible: document.querySelector('#affiliateNote')?.classList.contains('visible') || false,
  notice: document.querySelector('#notice')?.textContent?.trim() || ''
}));

if (!searchState.products.length) fail(`office-chair search returned no rendered products; notice=${searchState.notice}`);
if (!searchState.intentVisible) fail('interpreted-intent panel did not render after search');
if (!searchState.affiliateVisible) fail('affiliate disclosure did not render with outbound results');

const forbidden = /(foot\s*rest|footrest|cushion|lumbar\s*(pad|cushion)|saddle|\bstool\b|caster|gas\s*lift|seat\s*cover)/i;
for (const p of searchState.products) {
  if (forbidden.test(p.title)) fail(`accessory/incorrect chair result rendered: ${p.title}`);
  const normalized = p.price.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const n = Number(normalized);
  if (Number.isFinite(n) && n > 180.001) fail(`budget violation rendered: ${p.price} — ${p.title}`);
  if (/%/.test(p.match)) fail(`raw percentage exposed as relevance label: ${p.match}`);
  if (!p.why) fail(`missing Why-it-matches text: ${p.title}`);
}

await page.screenshot({ path: path.join(out, 'results-desktop.png'), fullPage: true });

const compareButtons = await page.$$('.compare-toggle');
if (compareButtons.length < 2) fail('fewer than two compare controls after successful search');
await compareButtons[0].click();
await compareButtons[1].click();
await page.waitForFunction(() => !document.querySelector('#compareBtn')?.disabled);
await page.click('#compareBtn');
await page.waitForFunction(() => document.querySelector('#compareDialog')?.open === true);
const compareCards = await page.$$eval('.compare-card', els => els.length);
if (compareCards < 2) fail(`compare dialog rendered only ${compareCards} cards`);
await page.screenshot({ path: path.join(out, 'compare-desktop.png') });
await page.click('[data-close-dialog="compareDialog"]');

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await noHorizontalOverflow('mobile results');
const mobileControls = await page.evaluate(() => ({
  search: document.querySelector('#searchBtn')?.getBoundingClientRect().toJSON(),
  photo: document.querySelector('#photoBtn')?.getBoundingClientRect().toJSON(),
  chat: document.querySelector('#chatLaunch')?.getBoundingClientRect().toJSON(),
  vw: innerWidth,
  vh: innerHeight
}));
for (const [name, rect] of Object.entries({ search: mobileControls.search, photo: mobileControls.photo, chat: mobileControls.chat })) {
  if (!rect) fail(`missing mobile ${name} control`);
  if (rect.left < -1 || rect.right > mobileControls.vw + 1) fail(`${name} is clipped horizontally on mobile`);
  if (rect.width < 24 || rect.height < 24) fail(`${name} target below WCAG minimum: ${rect.width}x${rect.height}`);
}
await page.screenshot({ path: path.join(out, 'results-mobile.png'), fullPage: true });

await page.click('#chatLaunch');
await page.waitForFunction(() => document.querySelector('#chatPanel')?.classList.contains('open'));
const sessionBefore = await page.evaluate(() => localStorage.getItem('nhma_session_id'));
let assistantBefore = await page.$$eval('.bubble.assistant', els => els.length);
await page.type('#chatInput', 'Θέλω εργονομική καρέκλα γραφείου μέχρι 180 ευρώ');
await page.click('#chatSend');
await page.waitForFunction(n => document.querySelectorAll('.bubble.assistant').length > n, { timeout: 35000 }, assistantBefore);
assistantBefore = await page.$$eval('.bubble.assistant', els => els.length);
await page.type('#chatInput', 'να είναι μαύρη και να έχει μπράτσα');
await page.click('#chatSend');
await page.waitForFunction(n => document.querySelectorAll('.bubble.assistant').length > n, { timeout: 35000 }, assistantBefore);
const chatState = await page.evaluate(() => ({
  session: localStorage.getItem('nhma_session_id'),
  userBubbles: document.querySelectorAll('.bubble.user').length,
  assistantBubbles: document.querySelectorAll('.bubble.assistant').length,
  text: document.querySelector('#chatLog')?.textContent || ''
}));
if (chatState.session !== sessionBefore) fail('session ID changed unexpectedly across two chat turns');
if (chatState.userBubbles < 2 || chatState.assistantBubbles < 3) fail(`two-turn chat did not render expected bubbles: ${JSON.stringify(chatState)}`);
await page.screenshot({ path: path.join(out, 'chat-mobile.png') });

await page.click('#newChat');
const sessionAfterNew = await page.evaluate(() => localStorage.getItem('nhma_session_id'));
if (!sessionAfterNew || sessionAfterNew === sessionBefore) fail('New conversation did not create a fresh session ID');
const afterReset = await page.evaluate(() => ({ users: document.querySelectorAll('.bubble.user').length, assistants: document.querySelectorAll('.bubble.assistant').length }));
if (afterReset.users !== 0 || afterReset.assistants !== 1) fail(`New conversation did not reset local chat UX: ${JSON.stringify(afterReset)}`);

if (pageErrors.length) fail(`page errors: ${pageErrors.join(' | ')}`);

fs.writeFileSync(path.join(out, 'smoke-result.json'), JSON.stringify({
  ok: true,
  productCount: searchState.products.length,
  products: searchState.products,
  compareCards,
  mobileControls,
  chat: { twoTurns: true, freshSessionAfterReset: true }
}, null, 2));

await browser.close();
console.log(`Browser smoke passed with ${searchState.products.length} live products and ${compareCards} compare cards.`);
