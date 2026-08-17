import Link from "next/link";
import { notFound } from "next/navigation";
import { V4BriefClient } from "@/components/v4-brief-client";
import { relayJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Buying Brief" };

export default async function BriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { status, data } = await relayJson("nhma-engagement-v4", { action: "get_research", token }, "POST");
  const research = status === 200 && data && typeof data === "object" && "research" in data ? (data as { research: any }).research : null;
  if (!research) notFound();
  const products = Array.isArray(research.products) ? research.products : [];
  return <><V4BriefClient research={research} /><nav className="brief-decision-links no-print" aria-label="Πλήρεις αναλύσεις προϊόντων"><b>Θέλεις περισσότερη ανάλυση;</b><div>{products.slice(0,8).map((product:any)=><Link key={product.productId} href={`/product/${token}/${encodeURIComponent(product.productId)}`}>{product.title || "AI επιλογή"} →</Link>)}</div>{products.length>1&&<Link className="brief-compare-link" href={`/compare/${token}?ids=${products.slice(0,4).map((p:any)=>encodeURIComponent(p.productId)).join(",")}`}>Σύγκρινε τις κορυφαίες επιλογές ⇄</Link>}</nav></>;
}
