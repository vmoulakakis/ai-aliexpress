import { NextResponse } from "next/server";
import { relayJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = new URL(request.url);
  const source = url.searchParams.get("source") || "result_card";
  const referrer = request.headers.get("referer") || "";
  const { status, data } = await relayJson("nhma-engagement-v4", { action: "resolve_link", token, source, referrer }, "POST");
  const target = status === 200 && typeof (data as { targetUrl?: unknown })?.targetUrl === "string" ? (data as { targetUrl: string }).targetUrl : "";
  if (!/^https:\/\/s\.click\.aliexpress\.com\//i.test(target)) {
    return NextResponse.redirect(new URL("/?tracking=unavailable", request.url), 302);
  }
  const response = NextResponse.redirect(target, 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
