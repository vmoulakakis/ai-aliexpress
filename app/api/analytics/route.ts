import { NextResponse } from "next/server";
import { functionsBase } from "@/lib/upstream";
import { ANALYTICS_EVENTS, type AnalyticsEventEnvelope } from "@/lib/analytics/events";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 240_000;
const EVENT_NAMES = new Set(Object.values(ANALYTICS_EVENTS));

function isEnvelope(value: unknown): value is AnalyticsEventEnvelope {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<AnalyticsEventEnvelope>;
  return Boolean(
    body.eventId &&
      body.visitorId &&
      body.sessionId &&
      body.occurredAt &&
      body.event &&
      EVENT_NAMES.has(body.event),
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "analytics_payload_too_large" }, { status: 413 });
  }

  const ingestKey = process.env.EU_SCOUT_ANALYTICS_INGEST_KEY;
  if (!ingestKey) {
    return NextResponse.json({ ok: true, accepted: false, reason: "analytics_not_configured" }, { status: 202 });
  }

  const body = await request.json().catch(() => null);
  if (!isEnvelope(body)) {
    return NextResponse.json({ error: "invalid_analytics_event" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${functionsBase()}/nhma-analytics`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-eu-scout-analytics-key": ingestKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "analytics_upstream_rejected" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, accepted: true }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "analytics_upstream_unavailable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
