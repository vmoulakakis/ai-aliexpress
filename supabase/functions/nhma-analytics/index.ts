import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_BODY_BYTES = 240_000;
const ALLOWED_EVENTS = new Set([
  "session_started",
  "page_view",
  "seasonal_section_viewed",
  "seasonal_product_selected",
  "search_started",
  "search_completed",
  "search_zero_results",
  "product_impression",
  "product_opened",
  "product_saved",
  "comparison_started",
  "comparison_completed",
  "chat_opened",
  "chat_message_sent",
  "chat_recommendation_shown",
  "funnel_step_viewed",
  "funnel_step_completed",
  "trust_evidence_viewed",
  "offer_popup_shown",
  "offer_popup_accepted",
  "outbound_intent",
  "outbound_click",
  "affiliate_redirect_success",
  "affiliate_redirect_failed",
  "conversion_reported",
  "agent_decision",
  "product_rejected",
  "experiment_exposure",
  "session_replay_chunk",
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expectedKey = Deno.env.get("EU_SCOUT_ANALYTICS_INGEST_KEY");
  const suppliedKey = request.headers.get("x-eu-scout-analytics-key");
  if (!expectedKey || !suppliedKey || suppliedKey !== expectedKey) {
    return json({ error: "unauthorized" }, 401);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const event = String(body.event || "");
  const eventId = String(body.eventId || "");
  const visitorId = String(body.visitorId || "");
  const sessionId = String(body.sessionId || "");
  const occurredAt = String(body.occurredAt || "");

  if (!eventId || !visitorId || !sessionId || !occurredAt || !ALLOWED_EVENTS.has(event)) {
    return json({ error: "invalid_event" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "server_not_configured" }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("eu_scout_analytics_events").upsert(
    {
      event_id: eventId,
      visitor_id: visitorId,
      session_id: sessionId,
      event_name: event,
      occurred_at: occurredAt,
      path: typeof body.path === "string" ? body.path.slice(0, 1_000) : null,
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 2_000) : null,
      properties:
        body.properties && typeof body.properties === "object" ? body.properties : {},
      source: "web",
    },
    { onConflict: "event_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("analytics_insert_failed", error.code, error.message);
    return json({ error: "insert_failed" }, 500);
  }

  return json({ ok: true }, 202);
});
