import { NextRequest, NextResponse } from "next/server";
import { interpretWithDeepSeek, needsProReview } from "@/lib/deepseek";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function rpc(name: string, body: unknown) {
  if (!url || !key) return [];
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  if (!res.ok) return [];
  return res.json();
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const featured = params.get("featured") === "1";
  const b2b = params.get("b2b") === "1";
  const raw = (params.get("q") || "").trim().slice(0, 700);

  if (b2b) {
    const items = await rpc("sf_b2b_feed", { p_limit: 24 });
    return NextResponse.json({ items }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
  }

  if (featured) {
    const items = await rpc("sf_featured_cards", { p_limit: 1 });
    return NextResponse.json({ items }, { headers: { "cache-control": "public, max-age=60, s-maxage=180" } });
  }

  if (raw.length < 2) return NextResponse.json({ items: [] });

  // Cheap path first: direct DB search. AI is only invoked if deterministic retrieval is weak.
  let items = await rpc("sf_search_cards", { p_query: raw, p_limit: 8 });
  if (Array.isArray(items) && items.length >= 3) return NextResponse.json({ items, ai_used: false });

  const intent = await interpretWithDeepSeek(raw, false);
  if (intent?.normalized_query && intent.normalized_query !== raw) {
    const expanded = await rpc("sf_search_cards", { p_query: `${intent.normalized_query} ${intent.keywords.join(" ")}`, p_limit: 8 });
    if (Array.isArray(expanded) && expanded.length) items = expanded;
  }

  // Pro is rare and only runs when the query is genuinely complex AND cheaper retrieval still failed.
  if ((!Array.isArray(items) || items.length === 0) && needsProReview(raw)) {
    const pro = await interpretWithDeepSeek(raw, true);
    if (pro?.normalized_query) items = await rpc("sf_search_cards", { p_query: `${pro.normalized_query} ${pro.keywords.join(" ")}`, p_limit: 8 });
  }

  return NextResponse.json({ items: Array.isArray(items) ? items : [], ai_used: Boolean(intent) });
}
