const endpoint = process.env.V4_SEARCH_URL || "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/nhma-search-v4";
const semanticDemand = {
  slug: "pet-hair-home",
  searchQuery: "best solution for pet hair across home robot vacuum cordless vacuum pet hair",
  retrievalQueries: ["robot vacuum pet hair", "cordless vacuum pet hair"],
  aliases: ["τρίχες σκύλου παντού", "pet hair home"],
  solutionPaths: ["Αυτόματος καθημερινός καθαρισμός", "Βαθύς καθαρισμός"]
};
async function run(message) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 75_000);
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, semanticDemand }), signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`V4 live search HTTP ${response.status}: ${JSON.stringify(data)}`);
    return data;
  } finally { clearTimeout(timer); }
}

const good = await run("Θέλω robot vacuum για τρίχες σκύλου μέχρι 600 ευρώ, μόνο EU warehouse");
const products = Array.isArray(good.products) ? good.products : [];
console.log(`joined V4: status=${good.status}, products=${products.length}, analysis=${JSON.stringify(good.analysis)}`);
if (good.status !== "complete" || products.length < 1) throw new Error(`Expected at least one real EU verified affiliate-ready product: ${JSON.stringify(good)}`);
for (const product of products) {
  if (product?.verification?.euWarehouse !== "verified") throw new Error(`EU verification missing: ${product?.productId}`);
  if (!/^[A-Z]{2}$/.test(String(product?.warehouseCountry || ""))) throw new Error(`Warehouse country missing: ${product?.productId}`);
  if (!/[?&]shipFromCountry=/.test(String(product?.warehouseProofUrl || ""))) throw new Error(`Warehouse proof URL missing: ${product?.productId}`);
  if (!/^https:\/\/s\.click\.aliexpress\.com\//i.test(String(product?.promotionLink || ""))) throw new Error(`Affiliate URL missing: ${product?.productId}`);
  if (!product?.decision?.verifiedFields?.includes("EU warehouse proof")) throw new Error(`Decision proof metadata missing: ${product?.productId}`);
}

const impossible = await run("Θέλω robot vacuum για τρίχες σκύλου μέχρι 20 ευρώ, μόνο EU warehouse");
const impossibleProducts = Array.isArray(impossible.products) ? impossible.products : [];
console.log(`hard budget: status=${impossible.status}, products=${impossibleProducts.length}, rejectedBudget=${impossible?.analysis?.rejectedBudget ?? "?"}`);
if (impossibleProducts.length !== 0 || impossible.status !== "recovery") throw new Error("Hard budget gate leaked a product or failed to enter recovery mode");
console.log("V4 joined EU warehouse + official affiliate + hard budget gates passed.");
