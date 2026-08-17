import { NextResponse } from "next/server";
import { resolveDemandCase } from "@/lib/demand";
import { relayJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === "string" ? body.message : "";
  const match = resolveDemandCase(message);
  const semanticDemand = match ? {
    slug: match.item.slug,
    searchQuery: match.item.searchQuery,
    aliases: match.item.aliases.slice(0, 4),
    solutionPaths: match.item.solutionPaths,
    semanticScore: match.score,
  } : undefined;
  const { status, data } = await relayJson("nhma-search-v4", { ...body, semanticDemand }, "POST");
  return NextResponse.json(data, { status });
}
