const endpoint = process.env.V4_SEARCH_URL || "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/nhma-search-v4";

const cases = [
  {
    name: "premium-projector",
    message: "Θέλω καλό smart projector για σαλόνι μέχρι 1000 ευρώ, μόνο EU warehouse",
    semanticDemand: { slug: "home-cinema-projector", searchQuery: "premium 4k smart projector home cinema high brightness auto focus", retrievalQueries: ["4k smart projector auto focus keystone", "full hd projector android wifi bluetooth"], aliases: ["projector για σαλόνι"], solutionPaths: ["4K projector", "Audio"] }
  },
  {
    name: "ergonomic-chair",
    message: "Θέλω εργονομική καρέκλα για πολλές ώρες μέχρι 900 ευρώ, μόνο EU warehouse",
    semanticDemand: { slug: "ergonomic-home-office", searchQuery: "premium ergonomic home office chair lumbar", retrievalQueries: ["ergonomic office chair adjustable lumbar headrest", "premium mesh office chair lumbar support"], aliases: ["καρέκλα για πολλές ώρες"], solutionPaths: ["Εργονομική καρέκλα", "Foot support"] }
  },
  {
    name: "power-station",
    message: "Θέλω power station για backup σπιτιού μέχρι 1500 ευρώ, μόνο EU warehouse",
    semanticDemand: { slug: "power-backup-home", searchQuery: "portable power station home backup lifepo4", retrievalQueries: ["lifepo4 portable power station 1000w", "portable power station solar generator 1000w"], aliases: ["power station σπίτι"], solutionPaths: ["Portable power station", "Solar input"] }
  },
  {
    name: "pet-cleaning",
    message: "Θέλω robot vacuum για τρίχες σκύλου μέχρι 800 ευρώ, μόνο EU warehouse",
    semanticDemand: { slug: "pet-hair-home", searchQuery: "robot vacuum pet hair", retrievalQueries: ["robot vacuum self empty station lidar pet hair", "cordless vacuum cleaner pet hair high power"], aliases: ["τρίχες σκύλου παντού"], solutionPaths: ["Αυτόματος καθημερινός καθαρισμός", "Βαθύς καθαρισμός"] }
  }
];

async function run(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 80_000);
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    return data;
  } finally { clearTimeout(timer); }
}

let totalVerified = 0;
for (const test of cases) {
  const data = await run({ message: test.message, semanticDemand: test.semanticDemand });
  const products = Array.isArray(data.products) ? data.products : [];
  if (!["complete", "recovery"].includes(String(data.status))) throw new Error(`${test.name}: unexpected status ${JSON.stringify(data)}`);
  if (data?.analysis?.hardRules?.euWarehouse !== true || data?.analysis?.hardRules?.affiliateTrackingUrl !== true) throw new Error(`${test.name}: hard rules missing`);
  for (const product of products) {
    if (product?.verification?.euWarehouse !== "verified") throw new Error(`${test.name}: unverified EU product leaked ${product?.productId}`);
    if (!/^[A-Z]{2}$/.test(String(product?.warehouseCountry || ""))) throw new Error(`${test.name}: warehouse country missing ${product?.productId}`);
    if (!/[?&]shipFromCountry=/.test(String(product?.warehouseProofUrl || ""))) throw new Error(`${test.name}: warehouse proof missing ${product?.productId}`);
    if (!/^https:\/\/s\.click\.aliexpress\.com\//i.test(String(product?.promotionLink || ""))) throw new Error(`${test.name}: affiliate tracking URL missing ${product?.productId}`);
    if (!product?.decision?.verifiedFields?.includes("EU warehouse proof")) throw new Error(`${test.name}: decision proof metadata missing ${product?.productId}`);
  }
  totalVerified += products.length;
  console.log(`${test.name}: status=${data.status}, verified=${products.length}, evidence=${data?.analysis?.euEvidenceCount ?? "?"}, detailMissing=${data?.analysis?.detailMissing ?? "?"}, identityRejected=${data?.analysis?.rejectedIdentity ?? "?"}, budgetRejected=${data?.analysis?.rejectedBudget ?? "?"}`);
}
if (totalVerified < 1) throw new Error("Live multi-category suite returned zero fully verified EU affiliate-ready products across all categories");

const impossible = await run({
  message: "Θέλω robot vacuum self empty μέχρι 20 ευρώ, μόνο EU warehouse",
  semanticDemand: { slug: "pet-hair-home", searchQuery: "robot vacuum pet hair", retrievalQueries: ["robot vacuum self empty station lidar pet hair"], aliases: ["robot vacuum"], solutionPaths: ["Αυτόματος καθημερινός καθαρισμός"] }
});
const impossibleProducts = Array.isArray(impossible.products) ? impossible.products : [];
if (impossibleProducts.length !== 0 || impossible.status !== "recovery") throw new Error(`Hard budget gate leaked product: ${JSON.stringify(impossible)}`);
console.log(`Hard budget recovery passed; total fully verified products across live suite=${totalVerified}.`);
