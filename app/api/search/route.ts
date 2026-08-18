import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bgvgstpoypqbjnemqcqp.supabase.co";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = (p.get("q") || "").trim().slice(0, 700);
  let payload: { mode: "search" | "featured" | "b2b"; q?: string };
  if (p.get("b2b") === "1") payload = { mode: "b2b" };
  else if (p.get("featured") === "1") payload = { mode: "featured" };
  else payload = { mode: "search", q };

  if (payload.mode === "search" && q.length < 2) return NextResponse.json({ items: [] });

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
