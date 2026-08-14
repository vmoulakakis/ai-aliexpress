import { NextResponse } from "next/server";
import { relayJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { status, data } = await relayJson("nhma-chat", body, "POST");
  return NextResponse.json(data, { status });
}
