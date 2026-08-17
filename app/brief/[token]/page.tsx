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
  return <V4BriefClient research={research} />;
}
