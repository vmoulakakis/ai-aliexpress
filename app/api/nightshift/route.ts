import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  const response = await fetch(`${url}/functions/v1/foundry-nightshift`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
    cache: "no-store"
  });
  const body = await response.json().catch(() => ({ ok: false }));
  return NextResponse.json(body, { status: response.status });
}
