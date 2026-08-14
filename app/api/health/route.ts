import { NextResponse } from "next/server";
import { relayJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";

export async function GET() {
  const { status, data } = await relayJson("nhma-health", undefined, "GET");
  return NextResponse.json(data, { status });
}
