const endpoint = process.env.V4_SEARCH_URL || "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/nhma-search-v4";
const tests = [
  { message: "premium robot vacuum pet hair self empty EU warehouse", semanticDemand: { slug: "pet-hair-home", searchQuery: "premium robot vacuum pet hair self empty", aliases: ["pet hair robot vacuum"], solutionPaths: ["Αυτόματος καθημερινός καθαρισμός", "Βαθύς καθαρισμός"] } },
  { message: "premium ergonomic office chair lumbar support EU warehouse", semanticDemand: { slug: "ergonomic-home-office", searchQuery: "premium ergonomic office chair adjustable lumbar", aliases: ["ergonomic chair"], solutionPaths: ["Εργονομική καρέκλα", "Foot support"] } },
  { message: "premium 4k smart projector home cinema EU warehouse", semanticDemand: { slug: "home-cinema-projector", searchQuery: "premium 4k smart projector home cinema high brightness", aliases: ["4k projector"], solutionPaths: ["4K projector", "Audio"] } },
];
let totalProducts = 0;
for (const test of tests) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 70_000); let response;
  try { response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(test), signal: controller.signal }); } finally { clearTimeout(timer); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`V4 live search HTTP ${response.status}: ${JSON.stringify(data)}`);
  if (!["complete", "recovery"].includes(String(data.status))) throw new Error(`Unexpected status: ${JSON.stringify(data)}`);
  const products = Array.isArray(data.products) ? data.products : [];
  for (const product of products) {
    if (product?.verification?.euWarehouse !== "verified") throw new Error(`Non-EU/unknown product leaked: ${product?.productId}`);
    if (!/^https:\/\/s\.click\.aliexpress\.com\//i.test(String(product?.promotionLink || ""))) throw new Error(`Missing affiliate tracking URL: ${product?.productId}`);
    if (!product?.decision || !Array.isArray(product.decision.verifiedFields)) throw new Error(`Decision metadata missing: ${product?.productId}`);
  }
  if (data?.analysis?.hardRules?.euWarehouse !== true || data?.analysis?.hardRules?.affiliateTrackingUrl !== true) throw new Error("Hard-rule analysis missing");
  totalProducts += products.length;
  console.log(`${test.semanticDemand.slug}: status=${data.status}, verifiedProducts=${products.length}, rejectedEU=${data?.analysis?.rejectedByEuGate ?? "?"}, rejectedAffiliate=${data?.analysis?.rejectedMissingAffiliate ?? "?"}`);
}
console.log(`V4 official-Affiliate gate passed. Verified EU products surfaced: ${totalProducts}. Zero is allowed here because the official product-query schema has no ship-from filter; the separate EU web-verifier gate is tested next.`);
