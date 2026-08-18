import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(req: NextRequest) {
  if (!supabaseUrl) return NextResponse.json({ items: [], error: "search_not_configured" }, { status: 503 });
  const p = req.nextUrl.searchParams;
  const payload = p.get("b2b") === "1"
    ? { mode: "b2b" }
    : p.get("featured") === "1"
      ? { mode: "featured" }
      : { mode: "search", q: (p.get("q") || "").trim().slice(0, 700) };

  if (payload.mode === "search" && (!payload.q || payload.q.length < 2)) return NextResponse.json({ items: [] });

  const response = await fetch(`${supabaseUrl}/functions/v1/foundry-search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({ items: [] }));
  return NextResponse.json(data, {
    status: response.ok ? 200 : response.status,
    headers: { "cache-control": payload.mode === "search" ? "no-store" : "public, max-age=60, s-maxage=180" }
  });
}
