const discover = "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/nhma-eu-web-discover";
const affiliate = "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/aliexpress-affiliate";

const discoveryResponse = await fetch(discover, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query: "robot vacuum", countries: ["ES", "FR", "PL"], demandSlug: "ci-canonical-bridge" })
});
const discovery = await discoveryResponse.json().catch(() => ({}));
if (!discoveryResponse.ok) throw new Error(`EU discovery HTTP ${discoveryResponse.status}: ${JSON.stringify(discovery)}`);
const cards = Array.isArray(discovery.products) ? discovery.products : [];
console.log(`Server EU evidence cards: ${cards.length}; results=${JSON.stringify(discovery.results)}`);
if (!cards.length) throw new Error("Server EU discovery returned zero evidence cards");

let detailReady = 0;
let affiliateReady = 0;
const diagnostics = [];
for (const card of cards.slice(0, 10)) {
  const canonicalId = String(card.productId || "");
  const detailResponse = await fetch(affiliate, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "product_detail", productId: canonicalId })
  });
  const detail = await detailResponse.json().catch(() => ({}));
  const detailOk = detailResponse.ok && Boolean(detail?.product?.title);
  if (detailOk) detailReady += 1;

  const productUrl = String(card.retailProductUrl || (card.displayProductId ? `https://www.aliexpress.com/item/${card.displayProductId}.html` : ""));
  let linkOk = false;
  if (productUrl) {
    const linkResponse = await fetch(affiliate, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "generate_link", productUrl })
    });
    const link = await linkResponse.json().catch(() => ({}));
    linkOk = linkResponse.ok && /^https:\/\/s\.click\.aliexpress\.com\//i.test(String(link?.promotionLink || ""));
    if (linkOk) affiliateReady += 1;
  }
  diagnostics.push({
    canonicalId,
    displayProductId: card.displayProductId || null,
    warehouseCountry: card.warehouseCountry || null,
    hasProof: /[?&]shipFromCountry=/.test(String(card.proofUrl || "")),
    detailReady: detailOk,
    affiliateReady: linkOk,
    title: String(detail?.product?.title || card.titleHint || "").slice(0, 120),
    price: detail?.product?.price ?? null,
  });
  if (detailReady >= 2 && affiliateReady >= 2) break;
}
console.log(JSON.stringify(diagnostics, null, 2));
if (detailReady < 1) throw new Error("No canonical x_object_id from EU evidence resolved through official product_detail");
if (affiliateReady < 1) throw new Error("No EU evidence product generated an official affiliate tracking URL");
console.log(`Canonical server bridge passed: officialDetail=${detailReady}, affiliateLinks=${affiliateReady}.`);
