import fs from "node:fs";

const endpoint = "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/nhma-engagement-v4";
const sessionId = "11111111-1111-4111-8111-111111111111";
const affiliateUrl = "https://s.click.aliexpress.com/e/v4CiTestToken";
const proofUrl = "https://www.aliexpress.com/w/wholesale-robot-vacuum.html?shipFromCountry=ES&shipTo=GR&currency=EUR";
fs.mkdirSync("v4-artifacts", { recursive: true });

async function call(body) {
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${body.action} HTTP ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

const created = await call({
  action: "create_research", sessionId, query: "robot vacuum pet hair EU only", understood: "CI verified buying research", demandSlug: "pet-hair-home",
  products: [{ productId: "1005012926698211", title: "CI Verified EU Product", imageUrl: "https://ae01.alicdn.com/kf/test.jpg", price: 299, currency: "EUR", promotionLink: affiliateUrl, matchScore: 92, why: "CI semantic fit", warehouseCountry: "ES", warehouseProofUrl: proofUrl, warehouseVerifiedAt: new Date().toISOString(), verification: { euWarehouse: "verified", positiveFeedback: 96 }, decision: { role: "best_match", fitScore: 92, strengths: ["EU proof"], limitations: ["delivery check"], verifiedFields: ["EU warehouse proof"], unknownFields: ["exact delivery"] } }]
});
if (!/^[a-f0-9]{24,64}$/i.test(String(created.researchToken || ""))) throw new Error("Research token invalid");
if (!/^\/brief\/[a-f0-9]+$/i.test(String(created.briefPath || ""))) throw new Error("Brief path invalid");
if (!/^\/go\/[a-f0-9]+$/i.test(String(created.products?.[0]?.trackingPath || ""))) throw new Error("Tracking path missing");
if (created.products?.[0]?.promotionLink) throw new Error("Raw affiliate URL leaked in public research response");

const research = await call({ action: "get_research", token: created.researchToken });
if (research?.research?.token !== created.researchToken) throw new Error("Research retrieval mismatch");
if (research?.research?.products?.[0]?.promotionLink) throw new Error("Raw affiliate URL leaked from stored brief");

const outboundToken = String(created.products[0].outboundToken || created.products[0].trackingPath.split("/").pop());
const resolved = await call({ action: "resolve_link", token: outboundToken, sessionId, source: "ci" });
if (resolved.targetUrl !== affiliateUrl) throw new Error("First-party redirect did not resolve expected affiliate URL");

const lead = await call({ action: "lead", email: "ci-v4-funnel@example.invalid", researchToken: created.researchToken, sessionId, marketingConsent: false, locale: "el", siteBaseUrl: "not-a-valid-url" });
if (lead.marketingConsent !== false) throw new Error("Marketing consent was not kept separate/false");
if (!/^\/brief\//.test(String(lead.briefPath || ""))) throw new Error("Lead response brief missing");
if (!["not_configured", "test_skipped", "provider_error"].includes(String(lead.emailStatus))) throw new Error(`Unexpected email status ${lead.emailStatus}`);
await call({ action: "event", eventName: "share", sessionId, researchToken: created.researchToken, productId: "1005012926698211", source: "ci", metadata: { platform: "test" } });

fs.writeFileSync("v4-artifacts/stage4-research.json", JSON.stringify({ researchToken: created.researchToken, outboundToken, briefPath: created.briefPath, trackingPath: created.products[0].trackingPath, affiliateUrl }, null, 2));
console.log(`Stage4 engagement gate passed: research=${created.researchToken}, tracking=${outboundToken}, emailStatus=${lead.emailStatus}.`);
